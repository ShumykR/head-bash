/**
 * Where the room server lives. Set at build time with VITE_SERVER_URL
 * (e.g. wss://head-bash.<account>.workers.dev); `?server=` in the page URL
 * overrides it (local testing against `wrangler dev`).
 */
export function serverUrl(q: URLSearchParams = new URLSearchParams(location.search)): string {
  return q.get('server') || (import.meta.env.VITE_SERVER_URL as string | undefined) || 'ws://localhost:8787';
}

/** Build id the room uses to seat only identical clients. */
export function buildId(): string {
  return typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__.sha : 'dev';
}
