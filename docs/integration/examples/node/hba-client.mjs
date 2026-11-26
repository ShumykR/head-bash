// Head Bash Arena bot API client — Node.js 18+, no dependencies.
// Contract: ../../openapi.yaml. Copy this file into the bot as is.
//
//   import { HbaClient } from './hba-client.mjs';
//   const hba = new HbaClient({ baseUrl: process.env.HBA_API_URL, apiKey: process.env.HBA_API_KEY });
//   const lobby = await hba.createLobby({ meta: { chatId } });

export class HbaError extends Error {
  /** @param {number} status @param {string} code @param {string} message */
  constructor(status, code, message) {
    super(`${status} ${code}: ${message}`);
    this.status = status;
    this.code = code;
  }
}

export class HbaClient {
  /**
   * @param {{ baseUrl: string, apiKey: string, timeoutMs?: number }} o
   *   baseUrl: https://head-bash-staging.headbash.workers.dev/api/v1 (staging) or
   *            https://head-bash.headbash.workers.dev/api/v1 (production)
   */
  constructor({ baseUrl, apiKey, timeoutMs = 10000 }) {
    if (!baseUrl || !apiKey) throw new Error('HbaClient: baseUrl and apiKey are required');
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
  }

  async #call(method, path, { body, headers } = {}) {
    const res = await fetch(this.baseUrl + path, {
      method,
      headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new HbaError(res.status, data?.error?.code ?? 'http_error', data?.error?.message ?? res.statusText);
    return data;
  }

  /**
   * Create a lobby. `meta` (≤ 1 KB JSON) comes back in every event of this lobby.
   * Pass a stable `idempotencyKey` (e.g. `${chatId}:${commandMessageId}`) so a retry cannot create two lobbies.
   * @returns {Promise<{code: string, status: string, startParam: string, miniAppUrl: string|null, webUrl: string, expiresAt: string, players: object[], lastResult: object|null, meta: any}>}
   */
  createLobby({ meta, ttlSec, idempotencyKey } = {}) {
    return this.#call('POST', '/lobbies', { body: { meta, ttlSec }, headers: idempotencyKey ? { 'idempotency-key': idempotencyKey } : {} });
  }

  getLobby(code) {
    return this.#call('GET', `/lobbies/${encodeURIComponent(code)}`);
  }

  cancelLobby(code) {
    return this.#call('POST', `/lobbies/${encodeURIComponent(code)}/cancel`);
  }

  /** One page of events after `cursor` → { events, cursor }. */
  events(cursor = '0', limit = 100) {
    return this.#call('GET', `/events?after=${encodeURIComponent(cursor)}&limit=${limit}`);
  }

  /**
   * Poll events forever and hand each one to `onEvent`, in order, once.
   * `loadCursor`/`saveCursor` persist the cursor (e.g. in SQLite) so a restart neither loses nor repeats events.
   * `isActive()` → false pauses polling (no open lobbies = no requests).
   * Returns a function that stops the loop.
   */
  poll({ onEvent, loadCursor, saveCursor, isActive = () => true, intervalMs = 4000, onError = console.error }) {
    let stopped = false;
    let timer = null;
    const tick = async () => {
      if (stopped) return;
      try {
        if (isActive()) {
          let cursor = (await loadCursor()) ?? '0';
          for (;;) {
            const page = await this.events(cursor);
            for (const ev of page.events) await onEvent(ev);
            if (page.cursor !== cursor) await saveCursor(page.cursor);
            cursor = page.cursor;
            if (page.events.length < 100) break; // caught up
          }
        }
      } catch (e) {
        onError(e);
      }
      if (!stopped) timer = setTimeout(tick, intervalMs);
    };
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }
}
