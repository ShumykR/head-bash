/**
 * Room logic, independent of Cloudflare: the Durable Object (room.ts) feeds it
 * connections, messages, closes and alarms, and sends what it returns. Pure
 * TypeScript with injected time and randomness, so it is tested in plain Node
 * (tests/room.test.ts).
 *
 * One room = one lobby code = up to two players. The room never simulates the
 * game: it relays inputs, compares state hashes, and decides the result.
 */
import {
  DEFAULT_CONFIG, HASH_EVERY, PROTO, RECONNECT_SEC,
  delayFor, parseClientMsg,
} from '../../src/net/protocol';
import type {
  ClientMsg, EndReason, InputChange, LobbyPlayer, MatchConfig, RejectReason, RoomPhase, ServerMsg, StartMsg,
} from '../../src/net/protocol';

export interface Conn {
  readonly id: string;
  send(m: ServerMsg): void;
  close(code?: number, reason?: string): void;
}

export interface RoomDeps {
  now(): number;
  rand(): number;
  /** Room events for integrations (webhooks later). */
  onEvent?(e: RoomEvent): void;
}

export type RoomEvent =
  | { type: 'player_joined'; slot: 0 | 1; name: string; tgUserId?: number }
  | { type: 'player_left'; slot: 0 | 1; name: string }
  | { type: 'match_started'; cars: [string, string]; config: MatchConfig }
  | { type: 'match_finished'; winner: 0 | 1 | null; scores: [number, number] | null; reason: EndReason; names: [string, string] };

interface Slot {
  name: string;
  car: string | null;
  ready: boolean;
  token: string;
  /** Telegram user id, when the player came in through the Mini App (verified initData). */
  tgUserId?: number;
  connId: string | null;
  rtt: number;
  /** Epoch ms by which a dropped player must reconnect. */
  deadline: number | null;
}

interface Match {
  start: StartMsg;
  /** Every input change so far, in arrival order. */
  inputs: [p: 0 | 1, k: number, b: number][];
  /** Last tick each player has confirmed. */
  confirmed: [number, number];
  /** Hashes waiting for the other player's, by tick. */
  hashes: Map<number, [number | null, number | null]>;
  results: [[number, number, number] | null, [number, number, number] | null];
  resultDeadline: number | null;
}

/** What survives a Durable Object eviction (the lobby; a running match does not). */
export interface RoomSnapshot {
  code: string;
  created: boolean;
  build: string | null;
  config: MatchConfig;
  slots: (Slot | null)[];
  phase: RoomPhase;
  expireAt: number | null;
}

const HELLO_SEC = 10;
const RESULT_WAIT_SEC = 10;
const EMPTY_ROOM_SEC = 120;
/** A client may not run more than this many ticks ahead of the other's confirmed input. */
const MAX_LEAD = 60 * 10;

export class RoomCore {
  created = false;
  build: string | null = null;
  config: MatchConfig = { ...DEFAULT_CONFIG };
  slots: (Slot | null)[] = [null, null];
  phase: RoomPhase = 'lobby';
  match: Match | null = null;
  expireAt: number | null = null;
  /** Lobby state changed: the host should persist a snapshot. */
  dirty = false;
  private conns = new Map<string, Conn>();
  private pending = new Map<string, number>();

  constructor(readonly code: string, private readonly deps: RoomDeps) {}

  /** The room is created by its first player (so it lives near them). */
  create() {
    this.created = true;
    this.expireAt = this.deps.now() + EMPTY_ROOM_SEC * 1000;
    this.dirty = true;
  }

  // ---- connections ----

  open(conn: Conn) {
    this.conns.set(conn.id, conn);
    if (!this.created) return this.reject(conn, 'notFound');
    this.pending.set(conn.id, this.deps.now() + HELLO_SEC * 1000);
  }

  /** Re-attach a socket after the host restarted (hibernation); no messages are sent. */
  reattach(conn: Conn) {
    this.conns.set(conn.id, conn);
    if (!this.slots.some((s) => s?.connId === conn.id)) this.pending.set(conn.id, this.deps.now() + HELLO_SEC * 1000);
  }

  /** A message from a socket. `ident`: the verified Telegram identity sent with a `hello` (checked by the host). */
  message(connId: string, raw: string, ident?: { tgUserId: number; name: string }) {
    const conn = this.conns.get(connId);
    if (!conn) return;
    const m = parseClientMsg(raw);
    if (!m) return this.reject(conn, 'bad');
    if (m.t === 'ping') {
      conn.send({ t: 'pong', ts: m.ts });
      const p = this.slotOf(connId);
      if (p !== null && m.rtt !== undefined) this.slots[p]!.rtt = Math.min(m.rtt, 2000);
      return;
    }
    if (this.pending.has(connId)) {
      if (m.t !== 'hello') return this.reject(conn, 'bad');
      return this.hello(conn, m, ident);
    }
    const p = this.slotOf(connId);
    if (p === null) return;
    this.handle(p, m);
  }

  close(connId: string) {
    this.conns.delete(connId);
    this.pending.delete(connId);
    const p = this.slotOf(connId);
    if (p === null) return this.checkEmpty();
    const s = this.slots[p]!;
    s.connId = null;
    s.deadline = this.deps.now() + RECONNECT_SEC * 1000;
    if (this.phase === 'playing') this.sendTo(1 - p, { t: 'peer', state: 'left', deadline: s.deadline });
    this.dirty = true;
    this.broadcastLobby();
  }

  /** The lobby was cancelled from outside (the bot): everyone out, the room is gone. */
  cancel() {
    for (const c of this.conns.values()) {
      c.send({ t: 'reject', reason: 'notFound' });
      c.close(4003, 'cancelled');
    }
    this.conns.clear();
    this.pending.clear();
    this.slots = [null, null];
    this.match = null;
    this.phase = 'lobby';
    this.created = false;
    this.expireAt = null;
  }

  // ---- time ----

  /** The earliest moment `alarm` needs to run, or null. */
  nextAlarm(): number | null {
    const ts: number[] = [...this.pending.values()];
    for (const s of this.slots) if (s?.deadline) ts.push(s.deadline);
    if (this.match?.resultDeadline) ts.push(this.match.resultDeadline);
    if (this.expireAt) ts.push(this.expireAt);
    return ts.length ? Math.min(...ts) : null;
  }

  /** Handle every deadline that has passed. Returns true when the room has expired and can be deleted. */
  alarm(): boolean {
    const now = this.deps.now();
    for (const [id, t] of this.pending) {
      if (t <= now) {
        this.pending.delete(id);
        this.conns.get(id)?.close(4000, 'hello timeout');
        this.conns.delete(id);
      }
    }
    if (this.match?.resultDeadline && this.match.resultDeadline <= now) {
      const r = this.match.results[0] ?? this.match.results[1];
      if (r) this.end(r[0] as 0 | 1, [r[1], r[2]], 'score');
    }
    for (let p = 0; p < 2; p++) {
      const s = this.slots[p];
      if (!s?.deadline || s.deadline > now) continue;
      if (this.phase === 'playing') {
        const other = this.slots[1 - p];
        const otherHere = other && other.connId;
        this.end(otherHere ? ((1 - p) as 0 | 1) : null, null, otherHere ? 'forfeit' : 'aborted');
      }
      this.removeSlot(p as 0 | 1);
    }
    this.checkEmpty();
    return this.expireAt !== null && this.expireAt <= now && this.isEmpty();
  }

  // ---- persistence ----

  snapshot(): RoomSnapshot {
    this.dirty = false;
    return {
      code: this.code, created: this.created, build: this.build, config: this.config,
      slots: this.slots, phase: this.phase, expireAt: this.expireAt,
    };
  }

  /** Restore after an eviction. A match in progress cannot be resumed (its inputs lived in memory). */
  restore(s: RoomSnapshot) {
    this.created = s.created;
    this.build = s.build;
    this.config = s.config;
    this.slots = s.slots;
    this.expireAt = s.expireAt;
    this.phase = 'lobby';
    if (s.phase === 'playing') {
      for (const sl of this.slots) if (sl) sl.ready = false;
      this.dirty = true;
    }
  }

  // ---- internals ----

  private hello(conn: Conn, m: Extract<ClientMsg, { t: 'hello' }>, ident?: { tgUserId: number; name: string }) {
    if (m.proto !== PROTO || (this.build !== null && m.build !== this.build && this.slots.some((s) => s))) return this.reject(conn, 'version');
    this.pending.delete(conn.id);
    // Coming back to a seat (reconnect, or the same player in a new tab).
    let p = m.token ? this.slots.findIndex((s) => s?.token === m.token) : -1;
    const back = p !== -1;
    if (back) {
      const s = this.slots[p]!;
      if (s.connId && s.connId !== conn.id) {
        const old = this.conns.get(s.connId);
        this.conns.delete(s.connId);
        old?.close(4001, 'replaced');
      }
      s.connId = conn.id;
      s.deadline = null;
    } else {
      p = this.slots.findIndex((s) => !s);
      if (p === -1) return this.reject(conn, 'full');
      if (!this.slots.some((s) => s)) this.build = m.build;
      const name = (ident?.name || m.name || '').trim().slice(0, 24) || `Гравець ${p + 1}`;
      this.slots[p] = { name, car: null, ready: false, token: this.token(), connId: conn.id, rtt: 150, deadline: null, ...(ident ? { tgUserId: ident.tgUserId } : {}) };
      this.deps.onEvent?.({ type: 'player_joined', slot: p as 0 | 1, name, ...(ident ? { tgUserId: ident.tgUserId } : {}) });
    }
    this.expireAt = null;
    this.dirty = true;
    const s = this.slots[p]!;
    conn.send({ t: 'welcome', code: this.code, slot: p as 0 | 1, token: s.token });
    if (back && this.phase === 'playing' && this.match) {
      conn.send({ t: 'resume', start: this.match.start, inputs: this.match.inputs, confirmed: this.match.confirmed });
      this.sendTo(1 - p, { t: 'peer', state: 'back' });
    }
    this.broadcastLobby();
  }

  private handle(p: number, m: ClientMsg) {
    const s = this.slots[p]!;
    switch (m.t) {
      case 'pick':
        if (this.phase !== 'lobby') return;
        s.car = m.car;
        s.ready = false;
        this.dirty = true;
        return this.broadcastLobby();
      case 'config': {
        if (this.phase !== 'lobby' || p !== 0) return;
        this.config = sanitizeConfig({ ...this.config, ...m.config });
        for (const sl of this.slots) if (sl) sl.ready = false;
        this.dirty = true;
        return this.broadcastLobby();
      }
      case 'ready':
        if (this.phase !== 'lobby') return;
        s.ready = m.ready && (s.car !== null || this.config.randomCars);
        this.dirty = true;
        this.broadcastLobby();
        if (this.slots.every((sl) => sl && sl.ready && sl.connId)) this.startMatch();
        return;
      case 'in':
        return this.input(p as 0 | 1, m.k, m.c);
      case 'hash':
        return this.hash(p as 0 | 1, m.k, m.h);
      case 'result':
        return this.result(p as 0 | 1, m.winner, m.scores);
      case 'leave':
        if (this.phase === 'playing') this.end((1 - p) as 0 | 1, null, 'forfeit');
        this.conns.get(s.connId!)?.close(1000, 'left');
        if (s.connId) this.conns.delete(s.connId);
        this.removeSlot(p as 0 | 1);
        return this.checkEmpty();
      case 'hello':
        return;
    }
  }

  private startMatch() {
    const [a, b] = this.slots as Slot[];
    const start: StartMsg = {
      t: 'start',
      seed: Math.floor(this.deps.rand() * 4294967296) >>> 0,
      cars: [a.car ?? 'sparrow', b.car ?? 'bulldog'],
      config: { ...this.config },
      delay: delayFor(Math.max(a.rtt, b.rtt)),
    };
    for (const sl of this.slots) sl!.ready = false;
    this.phase = 'playing';
    this.match = { start, inputs: [], confirmed: [-1, -1], hashes: new Map(), results: [null, null], resultDeadline: null };
    this.dirty = true;
    this.broadcast(start);
    this.broadcastLobby();
    this.deps.onEvent?.({ type: 'match_started', cars: start.cars, config: start.config });
  }

  private input(p: 0 | 1, k: number, c: InputChange[] | undefined) {
    const m = this.match;
    if (!m || this.phase !== 'playing') return;
    if (k <= m.confirmed[p] || k > m.confirmed[1 - p] + MAX_LEAD) return;
    const changes: InputChange[] = [];
    for (const [ck, b] of c ?? []) {
      if (ck <= m.confirmed[p] || ck > k) continue;
      changes.push([ck, b]);
      m.inputs.push([p, ck, b]);
    }
    m.confirmed[p] = k;
    this.sendTo(1 - p, changes.length ? { t: 'in', p, k, c: changes } : { t: 'in', p, k });
  }

  private hash(p: 0 | 1, k: number, h: number) {
    const m = this.match;
    if (!m || k % HASH_EVERY !== 0) return;
    const e = m.hashes.get(k) ?? [null, null];
    e[p] = h;
    if (e[0] !== null && e[1] !== null) {
      m.hashes.delete(k);
      if (e[0] !== e[1]) {
        this.broadcast({ t: 'desync', k });
        return this.end(null, null, 'desync');
      }
    } else m.hashes.set(k, e);
    // Keep the table bounded if one side never reports.
    if (m.hashes.size > 32) m.hashes.delete(m.hashes.keys().next().value!);
  }

  private result(p: 0 | 1, winner: 0 | 1, scores: [number, number]) {
    const m = this.match;
    if (!m) return;
    m.results[p] = [winner, scores[0], scores[1]];
    const [a, b] = m.results;
    if (a && b) {
      if (a.join() === b.join()) this.end(winner, scores, 'score');
      else this.end(null, null, 'desync');
    } else m.resultDeadline = this.deps.now() + RESULT_WAIT_SEC * 1000;
  }

  private end(winner: 0 | 1 | null, scores: [number, number] | null, reason: EndReason) {
    if (this.phase !== 'playing') return;
    this.phase = 'lobby';
    this.match = null;
    for (const s of this.slots) if (s) s.ready = false;
    this.dirty = true;
    this.broadcast({ t: 'end', winner, scores, reason });
    this.broadcastLobby();
    const names = this.slots.map((s, i) => s?.name ?? `Гравець ${i + 1}`) as [string, string];
    this.deps.onEvent?.({ type: 'match_finished', winner, scores, reason, names });
  }

  private removeSlot(p: 0 | 1) {
    const s = this.slots[p];
    if (!s) return;
    this.slots[p] = null;
    this.dirty = true;
    this.deps.onEvent?.({ type: 'player_left', slot: p, name: s.name });
    this.broadcastLobby();
  }

  private isEmpty() {
    return !this.slots.some((s) => s) && this.pending.size === 0;
  }

  private checkEmpty() {
    if (this.isEmpty() && this.expireAt === null) {
      this.expireAt = this.deps.now() + EMPTY_ROOM_SEC * 1000;
      this.dirty = true;
    }
  }

  private slotOf(connId: string): number | null {
    const i = this.slots.findIndex((s) => s?.connId === connId);
    return i === -1 ? null : i;
  }

  private reject(conn: Conn, reason: RejectReason) {
    conn.send({ t: 'reject', reason });
    conn.close(4002, reason);
    this.conns.delete(conn.id);
    this.pending.delete(conn.id);
  }

  private sendTo(p: number, msg: ServerMsg) {
    const id = this.slots[p]?.connId;
    if (id) this.conns.get(id)?.send(msg);
  }

  private broadcast(msg: ServerMsg) {
    for (let p = 0; p < 2; p++) this.sendTo(p, msg);
  }

  private broadcastLobby() {
    const players: (LobbyPlayer | null)[] = this.slots.map((s) => s && { name: s.name, car: s.car, ready: s.ready, connected: s.connId !== null });
    this.broadcast({ t: 'lobby', phase: this.phase, players, config: this.config, host: 0 });
  }

  private token(): string {
    let t = '';
    for (let i = 0; i < 24; i++) t += 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(this.deps.rand() * 36)];
    return t;
  }
}

export function sanitizeConfig(c: Partial<MatchConfig>): MatchConfig {
  const int = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isInteger(v) ? Math.max(lo, Math.min(hi, v)) : d);
  return {
    map: typeof c.map === 'string' && c.map.length <= 64 ? c.map : DEFAULT_CONFIG.map,
    target: int(c.target, 1, 20, DEFAULT_CONFIG.target),
    roundTime: int(c.roundTime, 15, 300, DEFAULT_CONFIG.roundTime),
    randomCars: typeof c.randomCars === 'boolean' ? c.randomCars : DEFAULT_CONFIG.randomCars,
  };
}
