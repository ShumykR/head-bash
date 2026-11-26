/**
 * Where the room server lives. Set at build time with VITE_SERVER_URL
 * (e.g. wss://head-bash.<account>.workers.dev); `?server=` in the page URL
 * overrides it (local testing against `wrangler dev`).
 */
/** The staging room server (lobbies a bot creates there open the game with start_param `ls_<code>`). */
export const STAGING_SERVER = 'wss://head-bash-staging.headbash.workers.dev';

export function serverUrl(q: URLSearchParams = new URLSearchParams(location.search), staging = false): string {
  if (staging) return STAGING_SERVER;
  return q.get('server') || (import.meta.env.VITE_SERVER_URL as string | undefined) || 'ws://localhost:8787';
}

/** Build id the room uses to seat only identical clients. */
export function buildId(): string {
  return typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__.sha : 'dev';
}
