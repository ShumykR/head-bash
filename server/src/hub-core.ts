/**
 * The bot integration hub: lobbies the Telegram bot creates and the event log
 * it polls. One instance (a Durable Object, hub.ts) for the whole service.
 * Storage is injected (Durable Object storage in production, a Map in tests).
 *
 * Contract (docs/online-plan.md §3): POST /lobbies reserves a room code; the
 * room itself is created next to the first player who opens it, and reports
 * what happens in it here; the bot reads GET /events?after=<cursor>.
 */
import { CODE_RE, randomCode } from '../../src/net/protocol';

export interface HubStore {
  get<T>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  /** Entries with the prefix, in key order, after `startAfter`. */
  list<T>(prefix: string, opts?: { startAfter?: string; limit?: number }): Promise<Map<string, T>>;
}

export interface HubDeps {
  store: HubStore;
  now(): number;
  rand(): number;
  /** Public game URL, e.g. https://shumykr.github.io/head-bash/ */
  gameUrl: string;
  botUsername?: string;
  appShortName?: string;
  /**
   * Staging only: this server's wss:// URL. The Mini App URL is the same for both environments
   * (the production game), so staging links say which server to use: start_param `ls_<code>`
   * and `?server=` in the web link.
   */
  stagingWs?: string;
}

export type LobbyStatus = 'waiting' | 'playing' | 'closed';

export interface Player { slot: 0 | 1; name: string; tgUserId?: number }

export interface LobbyRecord {
  code: string;
  status: LobbyStatus;
  meta: unknown;
  createdAt: number;
  expiresAt: number;
  players: Player[];
  /** Last finished match in this lobby. */
  lastResult: { winner: Player | null; scores: [number, number] | null; reason: string } | null;
  closedReason?: 'expired' | 'cancelled' | 'empty';
}

export interface HubEvent {
  id: number;
  type: 'lobby.player_joined' | 'lobby.player_left' | 'match.started' | 'match.finished' | 'lobby.closed';
  at: string;
  code: string;
  data: Record<string, unknown>;
  meta: unknown;
}

/** What a room reports (server/src/room.ts forwards RoomCore events). */
export type RoomReport =
  | { type: 'player_joined'; slot: 0 | 1; name: string; tgUserId?: number }
  | { type: 'player_left'; slot: 0 | 1; name: string }
  | { type: 'match_started' }
  | { type: 'match_finished'; winner: 0 | 1 | null; scores: [number, number] | null; reason: string }
  | { type: 'room_closed' };

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
  }
}

const DEFAULT_TTL = 600, MAX_TTL = 3600;
const KEEP_MS = 24 * 3600 * 1000;
const pad = (n: number) => String(n).padStart(12, '0');

export class HubCore {
  constructor(private readonly d: HubDeps) {}

  // ---- bot API ----

  async createLobby(body: { meta?: unknown; ttlSec?: unknown }, idempotencyKey?: string | null) {
    if (idempotencyKey && idempotencyKey.length > 128) throw new ApiError(400, 'bad_idempotency_key', 'Idempotency-Key must be at most 128 characters');
    if (idempotencyKey) {
      const code = await this.d.store.get<string>(`idem:${idempotencyKey}`);
      const existing = code && (await this.lobby(code));
      if (existing) return this.view(existing);
    }
    const meta = body.meta ?? null;
    if (JSON.stringify(meta).length > 1024) throw new ApiError(400, 'meta_too_large', 'meta must be at most 1 KB of JSON');
    const ttl = body.ttlSec === undefined ? DEFAULT_TTL : Number(body.ttlSec);
    if (!Number.isInteger(ttl) || ttl < 30 || ttl > MAX_TTL) throw new ApiError(400, 'bad_ttl', `ttlSec must be an integer from 30 to ${MAX_TTL}`);
    let code = '';
    for (let i = 0; i < 10 && (!code || (await this.lobby(code))); i++) code = randomCode(this.d.rand);
    const now = this.d.now();
    const rec: LobbyRecord = { code, status: 'waiting', meta, createdAt: now, expiresAt: now + ttl * 1000, players: [], lastResult: null };
    await this.d.store.put(`lobby:${code}`, rec);
    if (idempotencyKey) {
      await this.d.store.put(`idem:${idempotencyKey}`, code);
      await this.d.store.put(`idemAt:${idempotencyKey}`, now);
    }
    return this.view(rec);
  }

  async getLobby(code: string) {
    const rec = await this.lobby(code);
    if (!rec) throw new ApiError(404, 'lobby_not_found', `No lobby ${code}`);
    return this.view(rec);
  }

  /** Cancel before the first match starts. Returns true when the room must be told to close. */
  async cancelLobby(code: string) {
    const rec = await this.lobby(code);
    if (!rec) throw new ApiError(404, 'lobby_not_found', `No lobby ${code}`);
    if (rec.status === 'closed') return { lobby: this.view(rec), closeRoom: false };
    if (rec.status === 'playing') throw new ApiError(409, 'match_in_progress', 'The match has already started');
    await this.close(rec, 'cancelled');
    return { lobby: this.view(rec), closeRoom: true };
  }

  async events(after: string | null, limitRaw: string | null) {
    const a = after === null || after === '' ? 0 : Number(after);
    if (!Number.isInteger(a) || a < 0) throw new ApiError(400, 'bad_cursor', 'after must be a cursor from a previous response');
    const limit = Math.max(1, Math.min(100, Number(limitRaw ?? 100) || 100));
    const got = await this.d.store.list<HubEvent>('ev:', { startAfter: `ev:${pad(a)}`, limit });
    const events = [...got.values()];
    return { events, cursor: String(events.length ? events[events.length - 1].id : a) };
  }

  // ---- rooms ----

  /** Is this code a lobby the bot created (a room may be opened for it)? */
  async isOpen(code: string) {
    const rec = await this.lobby(code);
    return !!rec && rec.status !== 'closed';
  }

  async report(code: string, r: RoomReport) {
    const rec = await this.lobby(code);
    if (!rec || rec.status === 'closed') return;
    switch (r.type) {
      case 'player_joined': {
        const p: Player = { slot: r.slot, name: r.name, ...(r.tgUserId ? { tgUserId: r.tgUserId } : {}) };
        rec.players = [...rec.players.filter((x) => x.slot !== r.slot), p].sort((x, y) => x.slot - y.slot);
        await this.save(rec);
        return this.emit('lobby.player_joined', rec, { player: p });
      }
      case 'player_left': {
        const p = rec.players.find((x) => x.slot === r.slot) ?? { slot: r.slot, name: r.name };
        rec.players = rec.players.filter((x) => x.slot !== r.slot);
        await this.save(rec);
        return this.emit('lobby.player_left', rec, { player: p });
      }
      case 'match_started':
        rec.status = 'playing';
        await this.save(rec);
        return this.emit('match.started', rec, { players: rec.players });
      case 'match_finished': {
        const winner = r.winner === null ? null : rec.players.find((x) => x.slot === r.winner) ?? { slot: r.winner, name: '' };
        rec.status = 'waiting';
        rec.lastResult = { winner, scores: r.scores, reason: r.reason };
        await this.save(rec);
        return this.emit('match.finished', rec, { winner, scores: r.scores, reason: r.reason, players: rec.players });
      }
      case 'room_closed':
        return this.close(rec, 'empty');
    }
  }

  // ---- time ----

  /** Expire lobbies nobody joined; forget anything older than a day. Returns the next time to run. */
  async sweep(): Promise<number | null> {
    const now = this.d.now();
    let next: number | null = null;
    for (const rec of (await this.d.store.list<LobbyRecord>('lobby:')).values()) {
      if (rec.status === 'waiting' && rec.players.length === 0) {
        if (rec.expiresAt <= now) await this.close(rec, 'expired');
        else next = Math.min(next ?? Infinity, rec.expiresAt);
      } else if (rec.status === 'closed' && now - rec.createdAt > KEEP_MS) {
        await this.d.store.delete(`lobby:${rec.code}`);
      }
    }
    for (const [k, ev] of await this.d.store.list<HubEvent>('ev:', { limit: 500 })) {
      if (now - Date.parse(ev.at) <= KEEP_MS) break;
      await this.d.store.delete(k);
    }
    for (const [k, t] of await this.d.store.list<number>('idemAt:')) {
      if (now - t > KEEP_MS) {
        await this.d.store.delete(k);
        await this.d.store.delete(`idem:${k.slice(7)}`);
      }
    }
    return next;
  }

  // ---- internals ----

  private async lobby(code: string) {
    if (!CODE_RE.test(code)) return undefined;
    return this.d.store.get<LobbyRecord>(`lobby:${code}`);
  }

  private save(rec: LobbyRecord) {
    return this.d.store.put(`lobby:${rec.code}`, rec);
  }

  private async close(rec: LobbyRecord, reason: 'expired' | 'cancelled' | 'empty') {
    rec.status = 'closed';
    rec.closedReason = reason;
    await this.save(rec);
    await this.emit('lobby.closed', rec, { reason });
  }

  private async emit(type: HubEvent['type'], rec: LobbyRecord, data: Record<string, unknown>) {
    const id = ((await this.d.store.get<number>('seq')) ?? 0) + 1;
    await this.d.store.put('seq', id);
    const ev: HubEvent = { id, type, at: new Date(this.d.now()).toISOString(), code: rec.code, data, meta: rec.meta };
    await this.d.store.put(`ev:${pad(id)}`, ev);
  }

  private view(rec: LobbyRecord) {
    const startParam = `${this.d.stagingWs ? 'ls' : 'l'}_${rec.code}`;
    const base = this.d.gameUrl.replace(/\/?$/, '/');
    const server = this.d.stagingWs ? `&server=${encodeURIComponent(this.d.stagingWs)}` : '';
    return {
      code: rec.code,
      status: rec.status,
      startParam,
      miniAppUrl: this.d.botUsername && this.d.appShortName ? `https://t.me/${this.d.botUsername}/${this.d.appShortName}?startapp=${startParam}` : null,
      webUrl: `${base}?room=${rec.code}${server}`,
      expiresAt: new Date(rec.expiresAt).toISOString(),
      players: rec.players,
      lastResult: rec.lastResult,
      ...(rec.closedReason ? { closedReason: rec.closedReason } : {}),
      meta: rec.meta,
    };
  }
}
