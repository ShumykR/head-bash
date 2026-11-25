/**
 * Entry Worker: routes WebSocket connections to the room Durable Objects.
 *
 *   GET /health         → { ok, proto }
 *   GET /ws/new         → create a room near the caller, connect to it (code comes in `welcome`)
 *   GET /ws/:code       → join an existing room
 *
 * The Integration API for the Telegram bot (/api/v1/*) lands here later
 * (docs/online-plan.md, stage 5).
 */
import { CODE_RE, PROTO, randomCode } from '../../src/net/protocol';
import { random } from './room';

export { Room } from './room';

export interface Env {
  ROOMS: DurableObjectNamespace;
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
