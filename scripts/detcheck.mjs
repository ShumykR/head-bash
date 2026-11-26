// Cross-engine determinism check for lockstep online play.
//
// Runs the same scripted match (src/net/detrun.ts) in Node, Chromium and WebKit
// and compares the state hashes. Any difference means two players on those
// engines would desync.
//
//   node scripts/detcheck.mjs [--minutes=10] [--seed=42] [--engines=node,chromium,webkit] [--every=60] [--strict]
//
// WebKit/Firefox need `npx playwright install --with-deps webkit firefox` once. Missing engines are
// skipped, unless --strict (CI), where a skipped engine fails the check.
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const minutes = Number(arg('minutes', '10'));
const seed = Number(arg('seed', '42'));
const engines = arg('engines', 'node,chromium,webkit').split(',');
const strict = process.argv.includes('--strict');
const opts = { seed, steps: Math.round(minutes * 60 * 60), every: Number(arg('every', '60')) };

const out = await build({
  entryPoints: [path.join(root, 'src/net/detrun.ts')],
  bundle: true,
  format: 'iife',
  globalName: 'DET',
  platform: 'browser',
  target: 'es2022',
  write: false,
  define: { __APP_VERSION__: '{}' },
  logLevel: 'error',
});
const code = out.outputFiles[0].text;

const results = {};
for (const e of engines) {
  const t0 = Date.now();
  try {
    if (e === 'node') {
      const fn = new Function(`${code}; return DET.detRun(${JSON.stringify(opts)});`);
      results[e] = fn();
    } else {
      const pw = await import('playwright');
      const browser = await pw[e].launch();
      const page = await browser.newPage();
      await page.addScriptTag({ content: code });
      results[e] = await page.evaluate((o) => window.DET.detRun(o), opts);
      await browser.close();
    }
    const r = results[e];
    console.log(`${e.padEnd(9)} ${((Date.now() - t0) / 1000).toFixed(1)}s  rounds=${r.rounds} scores=${r.scores.join(':')} final=${r.hashes.at(-1)?.toString(16)}`);
  } catch (err) {
    console.log(`${e.padEnd(9)} skipped: ${String(err.message || err).split('\n')[0]}`);
  }
}

const ran = Object.keys(results);
let ok = true;
for (const e of ran.slice(1)) {
  const a = results[ran[0]].hashes, b = results[e].hashes;
  const i = a.findIndex((h, k) => h !== b[k]);
  if (i === -1 && a.length === b.length) console.log(`${ran[0]} == ${e}: identical (${a.length} hashes)`);
  else {
    ok = false;
    console.log(`${ran[0]} != ${e}: first difference at step ${(i + 1) * opts.every} (${(((i + 1) * opts.every) / 60).toFixed(1)} s of play)`);
  }
}
if (ran.length < 2) console.log('Fewer than two engines ran: nothing compared.');
if (strict && ran.length < engines.length) {
  console.log(`--strict: ${engines.length - ran.length} engine(s) did not run`);
  ok = false;
}
process.exit(ok ? 0 : 1);
