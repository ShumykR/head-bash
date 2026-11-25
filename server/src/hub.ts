/**
 * Durable Object for the bot integration (one instance, "hub"): the HTTP API
 * the Telegram bot calls (/api/v1/*, Bearer BOT_API_KEY) and the internal
 * calls rooms make (/internal/*, reachable only through the binding).
 */
import { DurableObject } from 'cloudflare:workers';
import { ApiError, HubCore, HubStore, RoomReport } from './hub-core';
import { random } from './room';
import type { Env } from './worker';

export const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...extra } });
export const apiError = (status: number, code: string, message: string) => json({ error: { code, message } }, status);

/** Constant-time comparison for the API key. */
function sameKey(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export class Hub extends DurableObject<Env> {
  private core: HubCore;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    const st = ctx.storage;
    const store: HubStore = {
      get: (k) => st.get(k),
      put: (k, v) => st.put(k, v),
      delete: async (k) => { await st.delete(k); },
      list: (prefix, o = {}) => st.list({ prefix, ...(o.startAfter ? { startAfter: o.startAfter } : {}), ...(o.limit ? { limit: o.limit } : {}) }),
    };
    this.core = new HubCore({
      store, now: () => Date.now(), rand: random,
      gameUrl: env.GAME_URL, botUsername: env.TG_BOT_USERNAME || undefined, appShortName: env.TG_APP_SHORT_NAME || undefined,
    });
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, '');
    try {
      // ---- rooms (internal) ----
      if (path.startsWith('/internal/')) {
        const code = url.searchParams.get('code') ?? '';
        if (path === '/internal/open') return json({ open: await this.core.isOpen(code) });
        if (path === '/internal/report' && req.method === 'POST') {
          await this.core.report(code, (await req.json()) as RoomReport);
          return json({ ok: true });
        }
        return apiError(404, 'not_found', 'Not found');
      }

      // ---- bot API ----
      if (!this.env.BOT_API_KEY) return apiError(503, 'api_disabled', 'The bot API is not configured on this server');
      const auth = req.headers.get('authorization') ?? '';
      if (!sameKey(auth.replace(/^Bearer\s+/i, ''), this.env.BOT_API_KEY)) return apiError(401, 'unauthorized', 'Missing or wrong API key (Authorization: Bearer <key>)');

      if (path === '/api/v1/lobbies' && req.method === 'POST') {
        let body: Record<string, unknown> = {};
        const text = await req.text();
        if (text.trim()) {
          try { body = JSON.parse(text); } catch { return apiError(400, 'bad_json', 'Body must be JSON'); }
          if (!body || typeof body !== 'object' || Array.isArray(body)) return apiError(400, 'bad_json', 'Body must be a JSON object');
        }
        const lobby = await this.core.createLobby(body, req.headers.get('idempotency-key'));
        await this.scheduleSweep();
        return json(lobby, 201);
      }
      const m = /^\/api\/v1\/lobbies\/([A-Za-z0-9]+)(\/cancel)?$/.exec(path);
      if (m && !m[2] && req.method === 'GET') return json(await this.core.getLobby(m[1].toUpperCase()));
      if (m && m[2] && req.method === 'POST') {
        const code = m[1].toUpperCase();
        const r = await this.core.cancelLobby(code);
        if (r.closeRoom) {
          const room = this.env.ROOMS.get(this.env.ROOMS.idFromName(code));
          await room.fetch('https://room/internal/cancel', { method: 'POST' }).catch(() => undefined);
        }
        return json(r.lobby);
      }
      if (path === '/api/v1/events' && req.method === 'GET') return json(await this.core.events(url.searchParams.get('after'), url.searchParams.get('limit')));
      return apiError(404, 'not_found', 'Unknown endpoint');
    } catch (e) {
      if (e instanceof ApiError) return apiError(e.status, e.code, e.message);
      console.error(e);
      return apiError(500, 'internal', 'Internal error');
    }
  }

  async alarm() {
    const next = await this.core.sweep();
    await this.ctx.storage.setAlarm(next ?? Date.now() + 3600_000);
  }

  private async scheduleSweep() {
    const next = await this.core.sweep();
    const cur = await this.ctx.storage.getAlarm();
    const want = next ?? Date.now() + 3600_000;
    if (cur === null || want < cur) await this.ctx.storage.setAlarm(want);
  }
}
