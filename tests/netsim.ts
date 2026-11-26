import { RoomCore } from '../server/src/room-core';
import { Lockstep } from '../src/net/lockstep';
import { gameConfigFor } from '../src/net/session';
import { Game } from '../src/game/game';
import { PROTO, bitsOf } from '../src/net/protocol';
import type { ClientMsg, ServerMsg } from '../src/net/protocol';

/**
 * Two lockstep clients, each with its own Game, play through the real room
 * logic over a simulated network (latency + jitter, in-order per direction
 * like TCP). Virtual time; one frame = 1/60 s with frame-time noise.
 */
interface Packet { at: number; deliver: () => void }

export class Net {
  t = 0;
  q: Packet[] = [];
  constructor(public latency: number, public jitter: number, private rand: () => number) {}
  /** In-order per link: a packet never arrives before the previous one on the same link. */
  private lastAt = new Map<string, number>();
  send(link: string, deliver: () => void) {
    const at = Math.max(this.t + this.latency + this.rand() * this.jitter, this.lastAt.get(link) ?? 0);
    this.lastAt.set(link, at);
    this.q.push({ at, deliver });
  }
  pump() {
    this.q.sort((a, b) => a.at - b.at);
    while (this.q.length && this.q[0].at <= this.t) this.q.shift()!.deliver();
  }
}

export class Client {
  slot: 0 | 1 = 0;
  token = '';
  ls: Lockstep | null = null;
  lastLs: Lockstep | null = null;
  game: Game | null = null;
  ended: ServerMsg | null = null;
  desync = false;
  hashes = new Map<number, number>();
  connected = true;
  constructor(readonly id: string, readonly net: Net, readonly room: RoomCore, readonly input: (k: number) => number) {}

  attach(connId: string) {
    this.connected = true;
    const self = this;
    this.room.open({
      id: connId,
      send: (m) => self.net.send(`${connId}<`, () => self.connected && self.onServer(m)),
      close: () => {},
    });
    this.toServer = (m) => this.net.send(`${connId}>`, () => this.room.message(connId, JSON.stringify(m)));
  }
  toServer: (m: ClientMsg) => void = () => {};

  onServer(m: ServerMsg) {
    switch (m.t) {
      case 'welcome': this.slot = m.slot; this.token = m.token; break;
      case 'start': this.begin(m); break;
      case 'resume':
        this.begin(m.start, { inputs: m.inputs, confirmed: m.confirmed });
        this.ls!.fastForward();
        break;
      case 'in': this.ls?.receive(m.p, m.k, m.c); break;
      case 'desync': this.desync = true; break;
      case 'end': this.ended = m; this.lastLs = this.ls; this.ls = null; break;
    }
  }

  begin(start: Extract<ServerMsg, { t: 'start' }>, resume?: { inputs: [0 | 1, number, number][]; confirmed: [number, number] }) {
    this.game = new Game(gameConfigFor(start));
    this.ls = new Lockstep(this.game, this.slot, start.delay, (m) => {
      if (m.t === 'hash') this.hashes.set(m.k, m.h);
      this.toServer(m);
    }, resume);
  }

  /** Seconds between this client's frames (0 = every frame of the loop): a slow device renders less often. */
  frameInterval = 0;
  private frameAcc = 0;

  frame(dt: number) {
    if (!this.ls || !this.connected) return;
    this.frameAcc += dt;
    if (this.frameAcc < this.frameInterval) return;
    this.ls.frame(this.frameAcc, this.input(this.ls.simTick));
    this.frameAcc = 0;
  }
}

export function lcg(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/** A player who holds a direction for a while and taps the action now and then. */
export function player(seed: number) {
  const r = lcg(seed);
  let until = 0, bits = 0;
  return (k: number) => {
    if (k >= until) {
      until = k + 10 + Math.floor(r() * 50);
      const d = Math.floor(r() * 3);
      bits = bitsOf(d === 0, d === 2, r() < 0.3);
    }
    return bits;
  };
}

export function setup(latency: number, jitter: number, seed = 1, target = 2) {
  const net = new Net(latency, jitter, lcg(seed));
  const room = new RoomCore('TESTS', { now: () => net.t * 1000, rand: lcg(seed + 7) });
  room.create();
  const a = new Client('a', net, room, player(seed + 1));
  const b = new Client('b', net, room, player(seed + 2));
  a.attach('a1');
  b.attach('b1');
  a.toServer({ t: 'hello', proto: PROTO, build: 't', name: 'A' });
  b.toServer({ t: 'hello', proto: PROTO, build: 't', name: 'B' });
  for (const c of [a, b]) c.toServer({ t: 'pick', car: c === a ? 'sparrow' : 'bulldog' });
  a.toServer({ t: 'config', config: { target, roundTime: 15 } });
  for (const c of [a, b]) c.toServer({ t: 'ping', ts: 0, rtt: latency * 2000 });
  // Let the host's config land before anyone is ready (a config change clears ready).
  for (let i = 0; i < 60; i++) { net.t += 1 / 60; net.pump(); }
  for (const c of [a, b]) c.toServer({ t: 'ready', ready: true });
  const frameNoise = lcg(seed + 3);
  const run = (seconds: number, until?: () => boolean) => {
    const end = net.t + seconds;
    while (net.t < end && !(until?.())) {
      const dt = 1 / 60 + (frameNoise() - 0.5) * 0.006;
      net.t += dt;
      net.pump();
      a.frame(dt);
      b.frame(dt);
      room.alarm();
    }
  };
  return { net, room, a, b, run };
}

