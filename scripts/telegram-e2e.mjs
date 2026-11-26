// The Telegram path in a browser, with Telegram's SDK replaced by a recording stub:
// the bot creates a lobby through the API → a player opens the Mini App link
// (start_param l_<CODE>) → the game joins that room under the Telegram name, goes
// full screen, shows the Back button → a second player joins by the web link →
// the match starts → the bot's event log shows both players.
//   node scripts/telegram-e2e.mjs
import { chromium } from 'playwright';
import { LOCAL_BOT_KEY, SERVER, WEB, startServers, until } from './online-env.mjs';

const stop = await startServers();
const http = SERVER.replace(/^ws/, 'http');
const key = process.env.BOT_API_KEY || LOCAL_BOT_KEY;
const api = async (p, init = {}) => (await fetch(http + p, { ...init, headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' } })).json();

const lobby = await api('/api/v1/lobbies', { method: 'POST', body: JSON.stringify({ meta: { chatId: 5 } }) });
const { cursor } = await api('/api/v1/events?after=0&limit=100').then(async (r) => { let c = r.cursor; for (;;) { const n = await api(`/api/v1/events?after=${c}`); if (!n.events.length) return { cursor: c }; c = n.cursor; } });
console.log('bot created lobby', lobby.code);

const browser = await chromium.launch();
const errors = [];
// Opened from a chat the phone is usually upright: start in portrait, then turn it.
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true });
// Telegram's SDK, replaced: a WebApp object that records what the game asks of it.
await ctx.route('https://telegram.org/js/**', (route) => route.fulfill({ contentType: 'application/javascript', body: `
  window.__tgCalls = [];
  const rec = (n) => (...a) => window.__tgCalls.push(n);
  window.Telegram = { WebApp: {
    initData: 'query_id=x&user=%7B%22id%22%3A4242%2C%22first_name%22%3A%22%D0%9E%D0%BB%D0%B5%D0%B3%22%7D&auth_date=${Math.floor(Date.now() / 1000)}&signature=fake&hash=fake',
    initDataUnsafe: { start_param: 'l_${lobby.code}', user: { id: 4242, first_name: 'Олег' } },
    version: '8.0', isVersionAtLeast: () => true, isOrientationLocked: true,
    unlockOrientation: () => { window.__tgCalls.push('unlockOrientation'); window.Telegram.WebApp.isOrientationLocked = false; },
    ready: rec('ready'), expand: rec('expand'), requestFullscreen: rec('requestFullscreen'),
    lockOrientation: () => { window.__tgCalls.push(innerWidth > innerHeight ? 'lockOrientation:landscape' : 'lockOrientation:PORTRAIT'); window.Telegram.WebApp.isOrientationLocked = true; },
    disableVerticalSwipes: rec('disableVerticalSwipes'), setHeaderColor: rec('setHeaderColor'), setBackgroundColor: rec('setBackgroundColor'),
    BackButton: { show: rec('back.show'), hide: rec('back.hide'), onClick: (cb) => { window.__tgBack = cb; } },
    HapticFeedback: { impactOccurred: rec('haptic'), notificationOccurred: rec('haptic') },
    onEvent: () => {}, showConfirm: (t, cb) => cb(true),
  } };` }));
const tgPage = await ctx.newPage();
tgPage.on('pageerror', (e) => errors.push(`tg: ${e.message}`));
tgPage.on('console', (m) => m.type() === 'error' && errors.push(`tg: ${m.text()}`));
await tgPage.goto(`${WEB}/?server=${encodeURIComponent(SERVER)}#tgWebAppData=stub&tgWebAppVersion=8.0`);
await until(() => tgPage.evaluate(() => (window.__tgCalls ?? []).includes('ready')), 20000, 'Mini App started');
const portraitCalls = await tgPage.evaluate(() => [...window.__tgCalls]);
await tgPage.setViewportSize({ width: 915, height: 412 }); // the player turns the phone
await until(() => tgPage.locator('.room-code b').textContent({ timeout: 500 }).then((t) => t === lobby.code), 20000, 'Mini App opened the lobby');
const seat = await tgPage.locator('.seat.p1 .seat-name').textContent();
const calls = await tgPage.evaluate(() => window.__tgCalls);
console.log('Mini App in lobby', lobby.code, 'as', JSON.stringify(seat), '; telegram calls:', [...new Set(calls)].join(', '));

const web = await (await browser.newContext({ viewport: { width: 915, height: 412 } })).newPage();
await web.addInitScript(() => localStorage.setItem('hba-settings-v1', JSON.stringify({ name: 'Ігор' })));
await web.goto(`${lobby.webUrl.replace(/^https?:\/\/[^/]+\/[^?]*/, WEB + '/')}&server=${encodeURIComponent(SERVER)}`);
await until(async () => (await tgPage.locator('.seat:not(.empty)').count()) === 2, 20000, 'web player joined');
await web.getByRole('button', { name: 'готовий' }).click();
await tgPage.getByRole('button', { name: 'готовий' }).click();
await until(async () => (await tgPage.evaluate(() => window.__app.state)) === 'play', 20000, 'match started');
await new Promise((r) => setTimeout(r, 1500));
// Telegram's Back button in a match = concede (confirmed through Telegram's dialog).
await tgPage.evaluate(() => window.__tgBack());
await until(async () => (await tgPage.evaluate(() => window.__app.state)) === 'menu', 10000, 'conceded via Back');

let events = [];
await until(async () => { const r = await api(`/api/v1/events?after=${cursor}`); events = r.events.filter((e) => e.code === lobby.code); return events.some((e) => e.type === 'match.finished'); }, 15000, 'bot sees the result');
console.log('bot events:', events.map((e) => `${e.type}${e.data.player ? `(${e.data.player.name})` : ''}${e.type === 'match.finished' ? `(${e.data.reason}, winner ${e.data.winner?.name})` : ''}`).join(', '));

await browser.close();
stop();
const orientationOk = portraitCalls.includes('unlockOrientation') && !calls.includes('lockOrientation:PORTRAIT') && calls.includes('lockOrientation:landscape');
console.log('orientation: in portrait', portraitCalls.filter((c) => c.includes('rientation')).join(',') || '-', '→ after turning', calls.filter((c) => c.includes('rientation')).join(','));
const ok = orientationOk && seat.startsWith('Олег') && calls.includes('requestFullscreen') && calls.includes('disableVerticalSwipes') && calls.includes('back.show')
  && events.some((e) => e.type === 'match.finished' && e.data.reason === 'forfeit' && e.data.winner?.name === 'Ігор') && errors.length === 0;
if (errors.length) console.log('errors:\n' + errors.join('\n'));
console.log(ok ? 'OK: Telegram Mini App path works' : 'FAILED');
process.exit(ok ? 0 : 1);
