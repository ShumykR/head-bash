/**
 * Entry Worker: routes WebSocket connections to the room Durable Objects.
 *
 *   GET /health         → { ok, proto }
 *   GET /ws/new         → create a room near the caller, connect to it (code comes in `welcome`)
 *   GET /ws/:code       → join an existing room (or open one for a lobby the bot created)
 *   /api/v1/*           → the Telegram bot's API (hub.ts; docs/online-plan.md §3)
 */
import { CODE_RE, PROTO, randomCode } from '../../src/net/protocol';
import { random } from './room';

export { Room } from './room';
export { Hub } from './hub';

export interface Env {
  ROOMS: DurableObjectNamespace;
  HUB: DurableObjectNamespace;
  /** Public game URL (GitHub Pages), for the links the API returns. */
  GAME_URL: string;
  /** The Telegram bot: numeric id (verifies Mini App players), username and Mini App short name (t.me links). */
  TG_BOT_ID?: string;
  TG_BOT_USERNAME?: string;
  TG_APP_SHORT_NAME?: string;
  /** Secret: the key the bot sends as `Authorization: Bearer …`. */
  BOT_API_KEY?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });

async function toRoom(env: Env, req: Request, code: string, create: boolean): Promise<Response> {
  const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
  const headers = new Headers(req.headers);
  headers.set('x-room-code', code);
  if (create) headers.set('x-room-create', '1');
  return stub.fetch(new Request(req.url, { method: 'GET', headers }));
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, '');

    if (path === '/health' || path === '') return json({ ok: true, proto: PROTO });

    if (path.startsWith('/api/v1/')) {
      const hub = env.HUB.get(env.HUB.idFromName('hub'), { locationHint: 'eeur' });
      return hub.fetch(req);
    }

    const ws = /^\/ws\/([A-Za-z0-9]+)$/.exec(path);
    if (ws) {
      if (req.headers.get('upgrade')?.toLowerCase() !== 'websocket') return json({ error: { code: 'upgrade_required', message: 'WebSocket only' } }, 426);
      if (ws[1] === 'new') {
        for (let i = 0; i < 5; i++) {
          const res = await toRoom(env, req, randomCode(random), true);
          if (res.status !== 409) return res;
        }
        return json({ error: { code: 'busy', message: 'Could not allocate a room code' } }, 503);
      }
      const code = ws[1].toUpperCase();
      if (!CODE_RE.test(code)) return json({ error: { code: 'bad_code', message: 'Invalid room code' } }, 400);
      return toRoom(env, req, code, false);
    }

    return json({ error: { code: 'not_found', message: 'Not found' } }, 404);
  },
} satisfies ExportedHandler<Env>;
