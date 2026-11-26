/**
 * Durable Object hosting one room. A thin shell around RoomCore: it accepts
 * WebSockets (with the hibernation API, so an idle lobby costs nothing),
 * forwards their events, persists the lobby snapshot and keeps the alarm set
 * to the core's next deadline.
 *
 * Rooms for lobbies the Telegram bot created ("linked"): the room is created
 * when its first player connects (so it lives near them) after the hub
 * confirms the code, and it reports joins, starts, results and closing to
 * the hub. Telegram players are identified by their verified initData.
 */
import { DurableObject } from 'cloudflare:workers';
import { Conn, RoomCore, RoomEvent, RoomSnapshot } from './room-core';
import type { RoomReport } from './hub-core';
import { verifyInitData } from './tgauth';
import type { ServerMsg } from '../../src/net/protocol';
import type { Env } from './worker';

interface Attachment { id: string }

export const random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;

export class Room extends DurableObject<Env> {
  private core: RoomCore | null = null;
  private linked = false;
  /** Reports to the hub, sent one after another so the bot sees them in order. */
  private reports: Promise<unknown> = Promise.resolve();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      const snap = await ctx.storage.get<RoomSnapshot>('snap');
      this.linked = (await ctx.storage.get<boolean>('linked')) ?? false;
      if (!snap) return;
      this.core = this.makeCore(snap.code);
      this.core.restore(snap);
      // Woken from hibernation: the sockets are still open.
      for (const ws of ctx.getWebSockets()) {
        const a = ws.deserializeAttachment() as Attachment | null;
        if (a) this.core.reattach(this.conn(ws, a.id));
      }
    });
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/internal/cancel') {
      this.core?.cancel();
      this.core = null;
      await this.ctx.storage.deleteAll();
      return new Response('ok');
    }
    const code = req.headers.get('x-room-code') ?? '';
    const create = req.headers.get('x-room-create') === '1';
    if (!this.core) this.core = this.makeCore(code);
    if (create) {
      // The code is already in use: the worker picks another.
      if (this.core.created) return new Response('taken', { status: 409 });
      this.core.create();
    } else if (!this.core.created && (await this.hubOpen(code))) {
      // A lobby the bot created: open the room now, next to its first player.
      this.core.create();
      this.linked = true;
      await this.ctx.storage.put('linked', true);
    }
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    const id = crypto.randomUUID();
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ id } satisfies Attachment);
    this.core.open(this.conn(server, id));
    await this.after();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, msg: string | ArrayBuffer) {
    const a = ws.deserializeAttachment() as Attachment | null;
    if (!a || !this.core) return;
    const raw = typeof msg === 'string' ? msg : new TextDecoder().decode(msg);
    this.core.message(a.id, raw, await this.identity(raw));
    await this.after();
  }

  async webSocketClose(ws: WebSocket) {
    await this.dropped(ws);
  }

  async webSocketError(ws: WebSocket) {
    await this.dropped(ws);
  }

  async alarm() {
    if (!this.core) return;
    if (this.core.alarm()) {
      if (this.linked) this.report({ type: 'room_closed' });
      await this.reports;
      await this.ctx.storage.deleteAll();
      this.core = null;
      this.linked = false;
      return;
    }
    await this.after();
  }

  /** The Telegram identity in a `hello`, when its initData is genuine (checked against the bot's id). */
  private async identity(raw: string): Promise<{ tgUserId: number; name: string } | undefined> {
    if (!this.env.TG_BOT_ID || raw.length > 4096 || !raw.includes('"hello"') || !raw.includes('"auth"')) return undefined;
    try {
      const m = JSON.parse(raw);
      if (m.t !== 'hello' || typeof m.auth !== 'string') return undefined;
      const u = await verifyInitData(m.auth, this.env.TG_BOT_ID);
      return u ? { tgUserId: u.id, name: u.name } : undefined;
    } catch {
      return undefined;
    }
  }

  private async hubOpen(code: string): Promise<boolean> {
    try {
      const res = await this.hub().fetch(`https://hub/internal/open?code=${code}`);
      return ((await res.json()) as { open: boolean }).open;
    } catch {
      return false;
    }
  }

  private report(r: RoomReport) {
    const code = this.core?.code;
    if (!code) return;
    this.reports = this.reports
      .then(() => this.hub().fetch(`https://hub/internal/report?code=${code}`, { method: 'POST', body: JSON.stringify(r) }))
      .catch((e) => console.error('hub report failed', e));
    this.ctx.waitUntil(this.reports);
  }

  private onEvent(e: RoomEvent) {
    if (!this.linked) return;
    switch (e.type) {
      case 'player_joined': return this.report({ type: 'player_joined', slot: e.slot, name: e.name, ...(e.tgUserId ? { tgUserId: e.tgUserId } : {}) });
      case 'player_left': return this.report({ type: 'player_left', slot: e.slot, name: e.name });
      case 'match_started': return this.report({ type: 'match_started' });
      case 'match_finished': return this.report({ type: 'match_finished', winner: e.winner, scores: e.scores, reason: e.reason });
    }
  }

  private hub() {
    return this.env.HUB.get(this.env.HUB.idFromName('hub'), { locationHint: 'eeur' });
  }

  private async dropped(ws: WebSocket) {
    const a = ws.deserializeAttachment() as Attachment | null;
    if (!a || !this.core) return;
    this.core.close(a.id);
    await this.after();
  }

  /** Persist lobby changes and keep the alarm on the next deadline. */
  private async after() {
    const core = this.core;
    if (!core) return;
    if (core.dirty) await this.ctx.storage.put('snap', core.snapshot());
    const next = core.nextAlarm();
    if (next === null) await this.ctx.storage.deleteAlarm();
    else if ((await this.ctx.storage.getAlarm()) !== next) await this.ctx.storage.setAlarm(next);
  }

  private makeCore(code: string) {
    return new RoomCore(code, { now: () => Date.now(), rand: random, onEvent: (e) => this.onEvent(e) });
  }

  private conn(ws: WebSocket, id: string): Conn {
    return {
      id,
      send: (m: ServerMsg) => {
        try { ws.send(JSON.stringify(m)); } catch { /* socket already gone */ }
      },
      close: (code?: number, reason?: string) => {
        try { ws.close(code ?? 1000, reason); } catch { /* already closed */ }
      },
    };
  }
}
