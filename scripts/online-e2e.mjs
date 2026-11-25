// Two real browsers play one online match through a local room server.
//
//   node scripts/online-e2e.mjs [--seconds=25]
//
// Starts `wrangler dev` (server/) and the Vite dev server, opens two isolated
// Chromium contexts (host creates a room, guest joins by code), holds keys on
// the host, and checks: both simulate in lockstep (identical state hashes),
// the host's input moves its car on the guest's screen, no console errors.
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const seconds = Number(arg('seconds', '25'));
const shots = arg('shots', '');
const SERVER = 'ws://localhost:8787', WEB = 'http://localhost:5179';

const procs = [];
const start = (cmd, args, cwd) => {
  const p = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  let log = '';
  p.stdout.on('data', (d) => (log += d));
  p.stderr.on('data', (d) => (log += d));
  procs.push(p);
  return () => log;
};
const stop = () => { for (const p of procs) try { process.kill(-p.pid, 'SIGTERM'); } catch { /* gone */ } };
process.on('exit', stop);
const until = async (fn, ms, what) => {
  const t0 = Date.now();
  for (;;) {
    try { const v = await fn(); if (v) return v; } catch { /* not yet */ }
    if (Date.now() - t0 > ms) throw new Error(`timed out: ${what}`);
    await new Promise((r) => setTimeout(r, 200));
  }
};

const serverLog = start('npx', ['wrangler', 'dev', '--port', '8787'], path.join(root, 'server'));
const webLog = start('npx', ['vite', '--port', '5179', '--strictPort'], root);
await until(() => fetch('http://localhost:8787/health').then((r) => r.ok), 60000, 'room server').catch((e) => { console.log(serverLog()); throw e; });
await until(() => fetch(WEB).then((r) => r.ok), 60000, 'web server').catch((e) => { console.log(webLog()); throw e; });

const browser = await chromium.launch();
const errors = [];
const open = async (url, who) => {
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`${who}: ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`${who}: ${e.message}`));
  await page.goto(url);
  return page;
};
const q = `server=${encodeURIComponent(SERVER)}&target=5&time=60&map=desert`;
const host = await open(`${WEB}/?online=1&room=new&car=sparrow&name=Host&${q}`, 'host');
const code = await until(() => host.evaluate(() => window.__online?.code), 20000, 'room code');
console.log('room', code);
const guest = await open(`${WEB}/?online=1&room=${code}&car=bulldog&name=Guest&${q}`, 'guest');

const state = (p) => p.evaluate(() => {
  const s = window.__online, g = s?.game;
  return g ? { slot: s.slot, tick: s.ls?.simTick ?? g.stepCount, phase: g.phase, x0: g.cars[0].chassis.getPosition().x, stalled: s.ls?.stalled, hashes: Object.fromEntries(s.hashes) } : null;
});
await until(async () => (await state(host))?.phase === 'play' && (await state(guest))?.phase === 'play', 30000, 'both in play');
const before = await state(guest);
console.log('playing; host slot', (await state(host)).slot, 'guest slot', before.slot);

// Host drives right for 2 s: its car must move on the guest's screen.
await host.bringToFront();
await host.keyboard.down('KeyD');
await new Promise((r) => setTimeout(r, 2000));
await host.keyboard.up('KeyD');
await new Promise((r) => setTimeout(r, 500));
const after = await state(guest);
const moved = after.x0 - before.x0;
console.log(`host car x on guest screen: ${before.x0.toFixed(2)} → ${after.x0.toFixed(2)} (Δ ${moved.toFixed(2)})`);

await new Promise((r) => setTimeout(r, Math.max(0, seconds * 1000 - 2500)));
const [h, g] = [await state(host), await state(guest)];
let same = 0, diff = 0;
for (const k of Object.keys(h.hashes)) if (k in g.hashes) (h.hashes[k] === g.hashes[k] ? same++ : diff++);
console.log(`ticks host=${h.tick} guest=${g.tick}; hashes compared=${same + diff} identical=${same} different=${diff}`);
// The guest reloads the tab mid-match: it gets its seat back (token in sessionStorage),
// re-simulates the match from the room's input log, and stays in lockstep.
const preTick = g.tick;
await guest.reload();
await until(async () => { const st = await state(guest); return st && st.tick > preTick + 120; }, 30000, 'guest resumed');
await new Promise((r) => setTimeout(r, 4000));
const [h2, g2] = [await state(host), await state(guest)];
let same2 = 0, diff2 = 0;
for (const k of Object.keys(g2.hashes)) if (k in h2.hashes) (h2.hashes[k] === g2.hashes[k] ? same2++ : diff2++);
console.log(`after guest reload: ticks host=${h2.tick} guest=${g2.tick}; hashes compared=${same2 + diff2} identical=${same2} different=${diff2}`);
const badge = await guest.evaluate(() => document.querySelector('.net-badge')?.textContent);
console.log('guest net badge:', badge);

if (shots) {
  await host.screenshot({ path: path.join(shots, 'online-host.png') });
  await guest.screenshot({ path: path.join(shots, 'online-guest.png') });
}
await browser.close();
stop();

const ok = diff === 0 && same >= 5 && Math.abs(moved) > 1 && diff2 === 0 && same2 >= 3 && errors.length === 0;
if (errors.length) console.log('console errors:\n' + errors.join('\n'));
console.log(ok ? 'OK: two browsers in lockstep' : 'FAILED');
process.exit(ok ? 0 : 1);
