// The Telegram bot's side against a running server, end to end:
// create a lobby → two players open it → match → result; the bot polls events.
// Also: wrong key → 401, cancel an unused lobby, unknown lobby → 404.
//   BOT_API_KEY=… node scripts/bot-smoke.mjs [http://localhost:8787]
const base = (process.argv[2] ?? 'http://localhost:8787').replace(/\/$/, '');
const key = process.env.BOT_API_KEY;
if (!key) { console.error('BOT_API_KEY is not set'); process.exit(2); }
const api = async (path, init = {}) => {
  const res = await fetch(base + path, { ...init, headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', ...(init.headers ?? {}) } });
  return { status: res.status, body: await res.json() };
};
const check = (cond, msg) => { if (!cond) { console.error('FAILED:', msg); process.exit(1); } };

check((await fetch(base + '/api/v1/events', { headers: { authorization: 'Bearer nope' } })).status === 401, 'wrong key must be 401');
const start = await api('/api/v1/events');
let cursor = start.body.cursor;

const created = await api('/api/v1/lobbies', { method: 'POST', body: JSON.stringify({ meta: { chatId: -1001, messageId: 42 } }), headers: { 'idempotency-key': `smoke-${Date.now()}` } });
check(created.status === 201, `create lobby: ${JSON.stringify(created)}`);
const { code } = created.body;
console.log('lobby', code, created.body.webUrl, created.body.miniAppUrl ?? '(no bot username yet)');

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
check((await api(`/api/v1/lobbies/${code}`)).body.status === 'playing', 'lobby status playing');
a.send({ t: 'result', winner: 1, scores: [2, 5] }); b.send({ t: 'result', winner: 1, scores: [2, 5] });
await a.wait('end');

// Poll like the bot does until the result shows up.
const seen = [];
for (let i = 0; i < 20 && !seen.some((e) => e.type === 'match.finished' && e.code === code); i++) {
  const r = await api(`/api/v1/events?after=${cursor}`);
  seen.push(...r.body.events.filter((e) => e.code === code));
  cursor = r.body.cursor;
  await new Promise((r) => setTimeout(r, 300));
}
console.log('events:', seen.map((e) => e.type).join(', '));
const fin = seen.find((e) => e.type === 'match.finished');
check(fin && fin.data.winner?.name === 'Ігор' && fin.data.scores.join(':') === '2:5' && fin.meta.chatId === -1001, `match.finished: ${JSON.stringify(fin)}`);
check(seen.map((e) => e.type).slice(0, 3).join() === 'lobby.player_joined,lobby.player_joined,match.started', 'event order');

const other = (await api('/api/v1/lobbies', { method: 'POST', body: '{}' })).body;
const cancelled = await api(`/api/v1/lobbies/${other.code}/cancel`, { method: 'POST' });
check(cancelled.body.status === 'closed' && cancelled.body.closedReason === 'cancelled', 'cancel');
check((await api('/api/v1/lobbies/ZZZZZ')).status === 404, 'unknown lobby 404');
a.ws.close(); b.ws.close();
console.log('OK: bot flow works');
process.exit(0);
