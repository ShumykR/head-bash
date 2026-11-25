// Shared setup for the online browser tests: starts `wrangler dev` (server/) and the Vite dev server.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** Room server: local `wrangler dev`, or a deployed one via ONLINE_SERVER=wss://… (then nothing is started for it). */
export const SERVER = process.env.ONLINE_SERVER || 'ws://localhost:8787';
const remote = !!process.env.ONLINE_SERVER;
export const WEB = 'http://localhost:5179';

export const until = async (fn, ms, what) => {
  const t0 = Date.now();
  for (;;) {
    try { const v = await fn(); if (v) return v; } catch { /* not yet */ }
    if (Date.now() - t0 > ms) throw new Error(`timed out: ${what}`);
    await new Promise((r) => setTimeout(r, 200));
  }
};

export async function startServers() {
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
  const health = SERVER.replace(/^ws/, 'http') + '/health';
  const serverLog = remote ? () => '' : start('npx', ['wrangler', 'dev', '--port', '8787'], path.join(root, 'server'));
  const webLog = start('npx', ['vite', '--port', '5179', '--strictPort'], root);
  await until(() => fetch(health).then((r) => r.ok), 60000, 'room server').catch((e) => { console.log(serverLog()); throw e; });
  await until(() => fetch(WEB).then((r) => r.ok), 60000, 'web server').catch((e) => { console.log(webLog()); throw e; });
  return stop;
}
