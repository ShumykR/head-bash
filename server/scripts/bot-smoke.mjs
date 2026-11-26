// The Telegram bot's side against a running server, end to end:
// create a lobby → two players open it → match → result; the bot polls events.
// Also: wrong key → 401, cancel an unused lobby, unknown lobby → 404.
//   BOT_API_KEY=… node scripts/bot-smoke.mjs [http://localhost:8787]
// The API calls go through the documented example client (docs/integration/examples/node), so it is tested too.
import { HbaClient, HbaError } from '../../docs/integration/examples/node/hba-client.mjs';

const base = (process.argv[2] ?? 'http://localhost:8787').replace(/\/$/, '');
const key = process.env.BOT_API_KEY;
if (!key) { console.error('BOT_API_KEY is not set'); process.exit(2); }
const hba = new HbaClient({ baseUrl: `${base}/api/v1`, apiKey: key });
const check = (cond, msg) => { if (!cond) { console.error('FAILED:', msg); process.exit(1); } };

check((await fetch(base + '/api/v1/events', { headers: { authorization: 'Bearer nope' } })).status === 401, 'wrong key must be 401');
let cursor = '0';
for (;;) { const p = await hba.events(cursor); if (p.cursor === cursor) break; cursor = p.cursor; }

const idem = `smoke-${Date.now()}`;
const created = await hba.createLobby({ meta: { chatId: -1001, messageId: 42 }, idempotencyKey: idem });
check((await hba.createLobby({ idempotencyKey: idem })).code === created.code, 'idempotent create');
const { code } = created;
console.log('lobby', code, created.webUrl, created.miniAppUrl ?? '(no bot username yet)');

const wsBase = base.replace(/^http/, 'ws');
function player(name) {
  const ws = new WebSocket(`${wsBase}/ws/${code}`);
  const inbox = [];
  const waiters = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); inbox.push(m); for (const w of [...waiters]) if (w.t === m.t) { waiters.splice(waiters.indexOf(w), 1); w.res(m); } };
  const wait = (t) => { const i = inbox.findIndex((m) => m.t === t); if (i >= 0) return Promise.resolve(inbox.splice(i, 1)[0]); return new Promise((res, rej) => { waiters.push({ t, res }); setTimeout(() => rej(new Error(`${name}: no ${t}`)), 8000); }); };
  const send = (m) => ws.send(JSON.stringify(m));
  return { ws, wait, send, open: new Promise((r) => (ws.onopen = r)) };
}
const a = player('A'), b = player('B');
await a.open; a.send({ t: 'hello', proto: 1, build: 'bot-smoke', name: 'Олег' }); await a.wait('welcome');
await b.open; b.send({ t: 'hello', proto: 1, build: 'bot-smoke', name: 'Ігор' }); await b.wait('welcome');
a.send({ t: 'pick', car: 'sparrow' }); b.send({ t: 'pick', car: 'bulldog' });
await new Promise((r) => setTimeout(r, 300));
a.send({ t: 'ready', ready: true }); b.send({ t: 'ready', ready: true });
await a.wait('start');
check((await hba.getLobby(code)).status === 'playing', 'lobby status playing');
a.send({ t: 'result', winner: 1, scores: [2, 5] }); b.send({ t: 'result', winner: 1, scores: [2, 5] });
await a.wait('end');

// Poll like the bot does (the example client's loop) until the result shows up.
const seen = [];
await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => { stop(); reject(new Error('no match.finished')); }, 15000);
  const stop = hba.poll({
    intervalMs: 300,
    loadCursor: async () => cursor,
    saveCursor: async (c) => { cursor = c; },
    onEvent: async (e) => {
      if (e.code !== code) return;
      seen.push(e);
      if (e.type === 'match.finished') { clearTimeout(timeout); stop(); resolve(); }
    },
  });
});
console.log('events:', seen.map((e) => e.type).join(', '));
const fin = seen.find((e) => e.type === 'match.finished');
check(fin && fin.data.winner?.name === 'Ігор' && fin.data.scores.join(':') === '2:5' && fin.meta.chatId === -1001, `match.finished: ${JSON.stringify(fin)}`);
check(seen.map((e) => e.type).slice(0, 3).join() === 'lobby.player_joined,lobby.player_joined,match.started', 'event order');

const other = await hba.createLobby();
const cancelled = await hba.cancelLobby(other.code);
check(cancelled.status === 'closed' && cancelled.closedReason === 'cancelled', 'cancel');
const missing = await hba.getLobby('ZZZZZ').catch((e) => e);
check(missing instanceof HbaError && missing.status === 404 && missing.code === 'lobby_not_found', 'unknown lobby 404');
a.ws.close(); b.ws.close();
console.log('OK: bot flow works');
process.exit(0);
