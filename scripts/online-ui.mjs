// The online lobby as a player uses it, in two real browsers (phone-sized landscape):
// main menu → "онлайн" → name → "створити гру" → the friend opens the invite link →
// both see each other → host changes a setting → both "готовий" → the match starts.
//
//   node scripts/online-ui.mjs [--shots=dir]
import { chromium } from 'playwright';
import path from 'node:path';
import { SERVER, WEB, startServers, until } from './online-env.mjs';

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const shots = arg('shots', '');
const stop = await startServers();
const browser = await chromium.launch();
const errors = [];
const page = async (who) => {
  const ctx = await browser.newContext({ viewport: { width: 915, height: 412 }, hasTouch: true });
  const p = await ctx.newPage();
  p.on('console', (m) => m.type() === 'error' && errors.push(`${who}: ${m.text()}`));
  p.on('pageerror', (e) => errors.push(`${who}: ${e.message}`));
  return p;
};
const shot = async (p, name) => shots && p.screenshot({ path: path.join(shots, `${name}.png`) });
const srv = `server=${encodeURIComponent(SERVER)}`;

const host = await page('host');
await host.goto(`${WEB}/?${srv}`);
await host.getByRole('button', { name: 'онлайн' }).click();
await host.locator('.text-in').first().fill('Олег');
await shot(host, 'online-entry');
await host.getByRole('button', { name: 'створити гру' }).click();
const code = await until(() => host.locator('.room-code b').textContent({ timeout: 500 }), 20000, 'room code');
console.log('room', code);
await shot(host, 'lobby-host-alone');

const guest = await page('guest');
await guest.addInitScript(() => localStorage.setItem('hba-settings-v1', JSON.stringify({ name: 'Ігор', p1: 'bulldog' })));
await guest.goto(`${WEB}/?room=${code}&${srv}`);
await until(async () => (await host.locator('.seat:not(.empty)').count()) === 2, 20000, 'guest seated');
const names = await host.locator('.seat-name').allTextContents();
console.log('host sees:', names.join(' | '));

// A new lobby plays random cars by default (30 s rounds, 5 points).
const defaults = await guest.locator('.lobby-config').textContent();
console.log(`defaults: random cars ${defaults.includes('випадкові авто')}, 30 s ${defaults.includes('раунд 30 с')}, 5 points ${defaults.includes('до 5 очок')}`);
const defaultsOk = defaults.includes('випадкові авто') && defaults.includes('раунд 30 с') && defaults.includes('до 5 очок');
// Host sets 3 points and own cars; the guest's lobby shows it.
await host.getByRole('button', { name: '3', exact: true }).click();
await host.locator('.set-row', { hasText: 'Випадкові авто' }).getByRole('button', { name: 'ні' }).click();
await until(async () => { const t = await guest.locator('.lobby-config').textContent(); return t.includes('до 3 очок') && !t.includes('випадкові авто'); }, 10000, 'config reaches guest');
// The guest changes car in the garage while the host also changes something (the lobby must
// not redraw under the open garage); the host then sees the new car.
await guest.getByRole('button', { name: 'змінити авто' }).click();
await guest.locator('.gcar').first().waitFor();
await host.getByRole('button', { name: '45с' }).click();
await new Promise((r) => setTimeout(r, 500));
const garageStillOpen = await guest.locator('.garage').count();
const newCar = await guest.locator('.gcar').nth(5).getAttribute('title').catch(() => null);
await guest.locator('.gcar').nth(5).click();
await until(async () => !(await guest.locator('.garage').count()), 5000, 'garage closed');
const hostSeesCar = await until(async () => { const t = await host.locator('.seat.p2 .seat-carname').textContent(); return t && t !== 'Bulldog' ? t : null; }, 10000, 'car change reaches host');
console.log(`garage stayed open during a lobby update: ${garageStillOpen === 1}; host sees guest car: ${hostSeesCar}${newCar ? ` (${newCar})` : ''}`);
await shot(host, 'lobby-host');
await shot(guest, 'lobby-guest');

await guest.getByRole('button', { name: 'готовий' }).click();
await until(async () => (await host.locator('.seat.p2 .seat-state').textContent()).includes('готовий'), 10000, 'ready reaches host');
await host.getByRole('button', { name: 'готовий' }).click();
const playing = (p) => p.evaluate(() => window.__app.state === 'play' && window.__online?.game?.phase !== undefined);
await until(async () => (await playing(host)) && (await playing(guest)), 20000, 'match started');
console.log('match started on both');
await new Promise((r) => setTimeout(r, 4000));
await shot(guest, 'match-guest');
const ticks = await Promise.all([host, guest].map((p) => p.evaluate(() => window.__online.ls.simTick)));
console.log('ticks', ticks.join(' / '));

// The guest concedes (⚑ + confirm): the host gets the win banner and is back in the lobby.
guest.on('dialog', (d) => d.accept());
await guest.locator('.pause-btn').click();
await until(async () => (await host.evaluate(() => window.__app.state)) === 'over' && (await host.locator('.seat.empty').count()) === 1, 20000, 'host back in lobby');
await shot(host, 'lobby-after-forfeit');
const guestState = await guest.evaluate(() => window.__app.state);
console.log('after concede: host in lobby with an empty seat; guest state', guestState);

await browser.close();
stop();
if (errors.length) console.log('console errors:\n' + errors.join('\n'));
const ok = defaultsOk && errors.length === 0 && ticks.every((t) => t > 120) && guestState === 'menu' && garageStillOpen === 1;
console.log(ok ? 'OK: lobby flow works' : 'FAILED');
process.exit(ok ? 0 : 1);
