import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';

// Build stamp shown in the main menu: v<commit count> · <sha> · [PR #n] · <build time>.
// The commit count grows with every commit/merge to main, so it is a monotonic
// "build number"; the sha pins the exact commit; the PR number is parsed from the
// squash/merge commit subject ("... (#12)" or "Merge pull request #12").
const git = (cmd: string) => { try { return execSync(`git ${cmd}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };
const sha = (process.env.GITHUB_SHA || git('rev-parse HEAD') || 'dev').slice(0, 7);
const count = git('rev-list --count HEAD');
const subject = git('log -1 --format=%s');
const pr = /\(#(\d+)\)|Merge pull request #(\d+)/.exec(subject);
const appVersion = {
  build: count || '0',
  sha,
  pr: pr ? (pr[1] || pr[2]) : '',
  date: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
};

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(appVersion) },
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
  server: { host: true },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
} as any);
