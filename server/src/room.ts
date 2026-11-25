/**
 * Durable Object hosting one room. A thin shell around RoomCore: it accepts
 * WebSockets (with the hibernation API, so an idle lobby costs nothing),
 * forwards their events, persists the lobby snapshot and keeps the alarm set
 * to the core's next deadline.
 */
import { DurableObject } from 'cloudflare:workers';
import { Conn, RoomCore, RoomSnapshot } from './room-core';
import type { ServerMsg } from '../../src/net/protocol';
import type { Env } from './worker';

interface Attachment { id: string }

export const random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;

export class Room extends DurableObject<Env> {
  private core: RoomCore | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      const snap = await ctx.storage.get<RoomSnapshot>('snap');
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
    const code = req.headers.get('x-room-code') ?? '';
    const create = req.headers.get('x-room-create') === '1';
    if (!this.core) this.core = this.makeCore(code);
    if (create) {
      // The code is already in use: the worker picks another.
      if (this.core.created) return new Response('taken', { status: 409 });
      this.core.create();
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
    this.core.message(a.id, typeof msg === 'string' ? msg : new TextDecoder().decode(msg));
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
      await this.ctx.storage.deleteAll();
      this.core = null;
      return;
    }
    await this.after();
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
    return new RoomCore(code, { now: () => Date.now(), rand: random });
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
