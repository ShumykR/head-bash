/**
 * WebSocket connection to the room server: hello/welcome, pings with RTT,
 * and automatic reconnection to the same seat (by token) after a drop.
 */
import { PROTO, RECONNECT_SEC } from './protocol';
import type { ClientMsg, RejectReason, ServerMsg } from './protocol';

export type ClientStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

export interface ClientOptions {
  /** Server base URL, e.g. ws://localhost:8787 or wss://head-bash.<acc>.workers.dev */
  server: string;
  name: string;
  build: string;
  /** Telegram initData, when running as a Mini App. */
  auth?: string;
}

const tokenKey = (code: string) => `hba-room-${code}`;

export class NetClient {
  status: ClientStatus = 'connecting';
  code: string | null = null;
  slot: 0 | 1 | null = null;
  /** Smoothed round trip, ms. */
  rtt = 0;
  onMessage: ((m: ServerMsg) => void) | null = null;
  onStatus: ((s: ClientStatus) => void) | null = null;
  onReject: ((r: RejectReason) => void) | null = null;
  private ws: WebSocket | null = null;
  private token: string | undefined;
  private pingTimer = 0;
  private retryUntil = 0;
  private closedByUs = false;

  constructor(private readonly opts: ClientOptions) {}

  /** Create a new room (`code` omitted) or join an existing one. */
  connect(code?: string) {
    if (code) {
      this.code = code;
      this.token = safeGet(tokenKey(code)) ?? undefined;
    }
    this.open();
  }

  send(m: ClientMsg) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(m));
  }

  close() {
    this.closedByUs = true;
    clearInterval(this.pingTimer);
    this.ws?.close(1000, 'bye');
    this.setStatus('closed');
  }

  private open() {
    const base = this.opts.server.replace(/\/+$/, '');
    const ws = new WebSocket(`${base}/ws/${this.code ?? 'new'}`);
    this.ws = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ t: 'hello', proto: PROTO, build: this.opts.build, name: this.opts.name, token: this.token, auth: this.opts.auth } satisfies ClientMsg));
      clearInterval(this.pingTimer);
      this.ping();
      this.pingTimer = window.setInterval(() => this.ping(), 2000);
    };
    ws.onmessage = (e) => {
      let m: ServerMsg;
      try {
        m = JSON.parse(String(e.data));
      } catch {
        return;
      }
      if (m.t === 'pong') {
        const r = now() - m.ts;
        this.rtt = this.rtt ? this.rtt * 0.7 + r * 0.3 : r;
        return;
      }
      if (m.t === 'welcome') {
        this.code = m.code;
        this.slot = m.slot;
        this.token = m.token;
        safeSet(tokenKey(m.code), m.token);
        this.retryUntil = 0;
        this.setStatus('open');
      }
      if (m.t === 'reject') {
        this.closedByUs = true;
        this.setStatus('closed');
        this.onReject?.(m.reason);
        return;
      }
      this.onMessage?.(m);
    };
    ws.onclose = () => {
      clearInterval(this.pingTimer);
      if (this.ws !== ws || this.closedByUs) return;
      // Dropped: try to get the seat back while the room still holds it.
      if (!this.code) return this.setStatus('closed');
      if (!this.retryUntil) this.retryUntil = now() + RECONNECT_SEC * 1000;
      if (now() > this.retryUntil) return this.setStatus('closed');
      this.setStatus('reconnecting');
      window.setTimeout(() => this.open(), 700);
    };
  }

  private ping() {
    this.send({ t: 'ping', ts: now(), rtt: this.rtt ? Math.round(this.rtt) : undefined });
  }

  private setStatus(s: ClientStatus) {
    if (this.status === s) return;
    this.status = s;
    this.onStatus?.(s);
  }
}

const now = () => performance.now();

function safeGet(k: string): string | null {
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
}

function safeSet(k: string, v: string) {
  try {
    sessionStorage.setItem(k, v);
  } catch { /* private mode */ }
}
