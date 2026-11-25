// End-to-end check of a running room server with two scripted clients:
// create → join → pick → ready → start → inputs/hashes → result → end, plus a reconnect.
//   node scripts/smoke.mjs [ws://localhost:8787]
const base = (process.argv[2] ?? 'ws://localhost:8787').replace(/\/$/, '');
const PROTO = 1;

function client(path, name, extra = {}) {
  const ws = new WebSocket(base + path);
  const inbox = [];
  const waiters = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    inbox.push(m);
    for (const w of [...waiters]) if (w.pred(m)) { waiters.splice(waiters.indexOf(w), 1); w.resolve(m); }
  };
  const ready = new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const wait = (t, pred = () => true, ms = 5000) => {
    const hit = inbox.find((m) => m.t === t && pred(m));
    if (hit) { inbox.splice(inbox.indexOf(hit), 1); return Promise.resolve(hit); }
    return new Promise((resolve, reject) => {
      const w = { pred: (m) => m.t === t && pred(m), resolve: (m) => { clearTimeout(timer); inbox.splice(inbox.indexOf(m), 1); resolve(m); } };
      const timer = setTimeout(() => reject(new Error(`${name}: timed out waiting for ${t}`)), ms);
      waiters.push(w);
    });
  };
  const send = (m) => ws.send(JSON.stringify(m));
  return { ws, ready, wait, send, hello: async () => { await ready; send({ t: 'hello', proto: PROTO, build: 'smoke', name, ...extra }); return wait('welcome'); } };
}

const t0 = Date.now();
const a = client('/ws/new', 'Alice');
const wa = await a.hello();
console.log('room', wa.code, 'slot', wa.slot);
let b = client(`/ws/${wa.code}`, 'Bob');
const wb = await b.hello();
console.log('joined slot', wb.slot);

a.send({ t: 'ping', ts: Date.now(), rtt: 40 });
await a.wait('pong');
a.send({ t: 'pick', car: 'sparrow' });
b.send({ t: 'pick', car: 'bulldog' });
a.send({ t: 'ready', ready: true });
b.send({ t: 'ready', ready: true });
const sa = await a.wait('start'), sb = await b.wait('start');
if (JSON.stringify(sa) !== JSON.stringify(sb)) throw new Error('start differs');
console.log('start seed', sa.seed, 'delay', sa.delay);

a.send({ t: 'in', k: 3, c: [[1, 2]] });
const rb = await b.wait('in');
if (rb.p !== 0 || rb.k !== 3) throw new Error('relay wrong');
b.send({ t: 'in', k: 3 });
await a.wait('in');
a.send({ t: 'hash', k: 60, h: 7 });
b.send({ t: 'hash', k: 60, h: 7 });

// Bob drops and comes back with his token.
b.ws.close();
await a.wait('peer', (m) => m.state === 'left');
b = client(`/ws/${wa.code}`, 'Bob', { token: wb.token });
await b.hello();
const res = await b.wait('resume');
console.log('resume inputs', JSON.stringify(res.inputs), 'confirmed', res.confirmed);
await a.wait('peer', (m) => m.state === 'back');

a.send({ t: 'result', winner: 0, scores: [5, 3] });
b.send({ t: 'result', winner: 0, scores: [5, 3] });
const end = await a.wait('end');
console.log('end', JSON.stringify(end));
if (end.reason !== 'score' || end.winner !== 0) throw new Error('bad end');

const bad = client('/ws/ZZZZZ', 'Eve');
await bad.ready;
const rej = await bad.wait('reject');
console.log('unknown room →', rej.reason);

a.ws.close(); b.ws.close(); bad.ws.close();
console.log(`OK in ${Date.now() - t0} ms`);
process.exit(0);
