// Long online match diagnostics: two browsers play for --seconds (default 150, past the 60 s
// sudden death), with optional CPU throttling on the guest (--throttle=4 ≈ a mid-range phone),
// and print lockstep state every few seconds.
//   node scripts/online-long.mjs [--seconds=150] [--throttle=1]   (ONLINE_SERVER=wss://… for a deployed server)
import { chromium } from 'playwright';
import { SERVER, WEB, startServers, until } from './online-env.mjs';

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const seconds = Number(arg('seconds', '150')), throttle = Number(arg('throttle', '1'));
const stop = await startServers();
const browser = await chromium.launch();
const errors = [];
const open = async (url, who, rate) => {
  const ctx = await browser.newContext({ viewport: { width: 915, height: 412 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${who}: ${e.message}`));
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.push(`${who} ${m.type()}: ${m.text()}`));
  if (rate > 1) await (await ctx.newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate });
  await page.goto(url);
  return page;
};
const q = `server=${encodeURIComponent(SERVER)}&target=99&time=60`;
const host = await open(`${WEB}/?online=1&room=new&car=sparrow&name=Host&${q}`, 'host', 1);
const code = await until(() => host.evaluate(() => window.__online?.code), 20000, 'room code');
const guest = await open(`${WEB}/?online=1&room=${code}&car=bulldog&name=Guest&${q}`, 'guest', throttle);
await until(async () => (await host.evaluate(() => window.__online?.ls?.simTick ?? 0)) > 10, 30000, 'started');
const probe = (p) => p.evaluate(() => {
  const s = window.__online, ls = s?.ls;
  if (!ls) return { ended: true, state: window.__app.state };
  return { tick: ls.simTick, delay: ls.delay, ft: +ls.frameTicks.toFixed(1), clock: Math.round(ls.clock), conf: [...ls.confirmed], stalled: ls.stalled, catching: ls.catchingUp, rtt: Math.round(s.client.rtt), status: s.client.status, phase: s.game.phase, sudden: s.game.suddenDeath, bodies: (() => { let n = 0; for (let b = s.game.world.getBodyList(); b; b = b.getNext()) n++; return n; })(), badge: document.querySelector('.net-badge')?.textContent };
});
const t0 = Date.now();
const waits = [];
// Keep both players busy: alternate directions.
const drive = async (p, k) => { await p.keyboard.down(k); setTimeout(() => p.keyboard.up(k).catch(() => {}), 700); };
while (Date.now() - t0 < seconds * 1000) {
  await drive(host, Math.random() < 0.5 ? 'KeyA' : 'KeyD');
  await drive(guest, Math.random() < 0.5 ? 'KeyA' : 'KeyD');
  await new Promise((r) => setTimeout(r, 5000));
  const [h, g] = [await probe(host), await probe(guest)];
  waits.push(/чекаємо/.test(h.badge ?? '') || /чекаємо/.test(g.badge ?? ''));
  console.log(`${Math.round((Date.now() - t0) / 1000)}s host ${JSON.stringify(h)}\n     guest ${JSON.stringify(g)}`);
  if (h.ended && g.ended) break;
}
const hashes = await Promise.all([host, guest].map((p) => p.evaluate(() => Object.fromEntries(window.__online?.hashes ?? []))));
let same = 0, diff = 0;
for (const k of Object.keys(hashes[0])) if (k in hashes[1]) (hashes[0][k] === hashes[1][k] ? same++ : diff++);
console.log(`hashes identical=${same} different=${diff}`);
// --check (CI): fail on any desync, or if the second half of the match was mostly spent waiting.
if (process.argv.includes('--check')) {
  const late = waits.slice(Math.floor(waits.length / 2));
  const waitShare = late.filter(Boolean).length / Math.max(1, late.length);
  console.log(`waiting badge in the second half: ${Math.round(waitShare * 100)}% of samples`);
  if (diff > 0 || same < 20 || waitShare > 0.25) { console.log('FAILED'); await browser.close(); stop(); process.exit(1); }
  console.log('OK: long match keeps pace');
}
if (errors.length) console.log('console:\n' + [...new Set(errors)].slice(0, 20).join('\n'));
await browser.close();
stop();
