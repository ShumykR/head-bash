/**
 * Online protocol between the game client and the room server (server/).
 * Shared by both sides; JSON over one WebSocket per player.
 *
 * Flow: connect → `hello` → `welcome` + `lobby` → `pick`/`config`/`ready` →
 * `start` (both ready) → `in`/`hash` while playing → `result` → `end` →
 * back to the lobby for a rematch.
 *
 * Lockstep: each client runs the full simulation. Inputs are scheduled
 * `delay` ticks ahead and relayed through the room. A tick can only run once
 * both players' inputs for it are known, so every client keeps confirming
 * ticks (`in.k`) even when its input does not change; changes ride along in
 * `in.c`.
 *
 * Bump PROTO on any incompatible change: the room rejects mismatched clients.
 */
export const PROTO = 1;

/** Input bits for one tick. */
export const BIT_LEFT = 1, BIT_RIGHT = 2, BIT_ACTION = 4;

/** Room codes: 5 characters, no look-alikes (0/O, 1/I/L). */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 5;
export const CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/;

/** Ticks per second of the simulation (STEP_DT = 1/60). */
export const TICK_HZ = 60;
/** A client confirms its input at least every BATCH ticks. */
export const BATCH = 1;
/** Input delay bounds, ticks. */
export const MIN_DELAY = 4, MAX_DELAY = 15;
/** Clients hash their state every HASH_EVERY ticks. */
export const HASH_EVERY = 60;
/** Seconds a dropped player has to come back during a match. */
export const RECONNECT_SEC = 15;

export interface MatchConfig {
  /** Map id or 'random' (new random arena each round). */
  map: string;
  target: number;
  roundTime: number;
  randomCars: boolean;
}

export const DEFAULT_CONFIG: MatchConfig = { map: 'random', target: 5, roundTime: 60, randomCars: false };

export interface LobbyPlayer {
  name: string;
  car: string | null;
  ready: boolean;
  connected: boolean;
}

export type RoomPhase = 'lobby' | 'playing';

/** A change of input: from tick `k` on, the bits are `b`. */
export type InputChange = [k: number, b: number];

// ---- client → server ----

export type ClientMsg =
  | { t: 'hello'; proto: number; build: string; name: string; token?: string; auth?: string }
  | { t: 'pick'; car: string }
  | { t: 'config'; config: Partial<MatchConfig> }
  | { t: 'ready'; ready: boolean }
  /** Input confirmed through tick `k`; `c` lists changes (ticks ≤ k) since the last message. */
  | { t: 'in'; k: number; c?: InputChange[] }
  | { t: 'hash'; k: number; h: number }
  | { t: 'result'; winner: 0 | 1; scores: [number, number] }
  /** Leave the room (in a match: concede). */
  | { t: 'leave' }
  /** `rtt`: the client's latest measured round trip (ms), used to pick the input delay. */
  | { t: 'ping'; ts: number; rtt?: number };

// ---- server → client ----

export interface StartMsg {
  t: 'start';
  seed: number;
  cars: [string, string];
  config: MatchConfig;
  /** Input delay in ticks. */
  delay: number;
}

export type EndReason = 'score' | 'forfeit' | 'desync' | 'aborted';

export type RejectReason = 'version' | 'full' | 'notFound' | 'auth' | 'bad';

export type ServerMsg =
  | { t: 'welcome'; code: string; slot: 0 | 1; token: string }
  | { t: 'lobby'; phase: RoomPhase; players: (LobbyPlayer | null)[]; config: MatchConfig; host: 0 | 1 }
  | StartMsg
  | { t: 'in'; p: 0 | 1; k: number; c?: InputChange[] }
  /** The other player dropped (`left`, with the deadline as epoch ms) or came back. */
  | { t: 'peer'; state: 'left' | 'back'; deadline?: number }
  | { t: 'desync'; k: number }
  | { t: 'end'; winner: 0 | 1 | null; scores: [number, number] | null; reason: EndReason }
  /** Reconnected mid-match: the start message and every input so far, to re-simulate up to now. */
  | { t: 'resume'; start: StartMsg; inputs: [p: 0 | 1, k: number, b: number][]; confirmed: [number, number] }
  | { t: 'pong'; ts: number }
  | { t: 'reject'; reason: RejectReason };

export function bitsOf(left: boolean, right: boolean, action: boolean): number {
  return (left ? BIT_LEFT : 0) | (right ? BIT_RIGHT : 0) | (action ? BIT_ACTION : 0);
}

export function dirOfBits(b: number): -1 | 0 | 1 {
  const l = (b & BIT_LEFT) !== 0, r = (b & BIT_RIGHT) !== 0;
  return l === r ? 0 : l ? -1 : 1;
}

export function randomCode(rand: () => number): string {
  let s = '';
  for (let i = 0; i < CODE_LENGTH; i++) s += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  return s;
}

/** Input delay for a measured round trip: half the RTT in ticks, plus slack for jitter and batching. */
export function delayFor(rttMs: number): number {
  const ticks = Math.ceil(rttMs / 2 / (1000 / TICK_HZ)) + BATCH + 1;
  return Math.max(MIN_DELAY, Math.min(MAX_DELAY, ticks));
}

/** Parse and minimally validate a client message (the room never trusts shapes blindly). */
export function parseClientMsg(raw: string): ClientMsg | null {
  if (raw.length > 4096) return null;
  let m: unknown;
  try {
    m = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!m || typeof m !== 'object') return null;
  const o = m as Record<string, unknown>;
  const int = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0;
  const str = (v: unknown, max = 64) => typeof v === 'string' && v.length <= max;
  switch (o.t) {
    case 'hello':
      return int(o.proto) && str(o.build) && str(o.name, 32) && (o.token === undefined || str(o.token)) && (o.auth === undefined || str(o.auth, 2048)) ? (o as ClientMsg) : null;
    case 'pick':
      return str(o.car) ? (o as ClientMsg) : null;
    case 'config':
      return o.config && typeof o.config === 'object' ? (o as ClientMsg) : null;
    case 'ready':
      return typeof o.ready === 'boolean' ? (o as ClientMsg) : null;
    case 'in':
      return int(o.k) && (o.c === undefined || (Array.isArray(o.c) && o.c.length <= 64 && o.c.every((x) => Array.isArray(x) && x.length === 2 && int(x[0]) && int(x[1]) && (x[1] as number) < 8))) ? (o as ClientMsg) : null;
    case 'hash':
      return int(o.k) && int(o.h) ? (o as ClientMsg) : null;
    case 'result':
      return (o.winner === 0 || o.winner === 1) && Array.isArray(o.scores) && o.scores.length === 2 && o.scores.every(int) ? (o as ClientMsg) : null;
    case 'leave':
      return o as ClientMsg;
    case 'ping':
      return typeof o.ts === 'number' && (o.rtt === undefined || (typeof o.rtt === 'number' && o.rtt >= 0)) ? (o as ClientMsg) : null;
    default:
      return null;
  }
}
