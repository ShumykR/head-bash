import { beforeEach, describe, expect, it } from 'vitest';
import { RoomCore, RoomEvent, sanitizeConfig } from '../server/src/room-core';
import { PROTO, RECONNECT_SEC } from '../src/net/protocol';
import type { ServerMsg } from '../src/net/protocol';

class FakeConn {
  inbox: ServerMsg[] = [];
  closed: [number | undefined, string | undefined] | null = null;
  constructor(readonly id: string) {}
  send(m: ServerMsg) { this.inbox.push(m); }
  close(code?: number, reason?: string) { this.closed = [code, reason]; }
  last<T extends ServerMsg['t']>(t: T): Extract<ServerMsg, { t: T }> | undefined {
    for (let i = this.inbox.length - 1; i >= 0; i--) if (this.inbox[i].t === t) return this.inbox[i] as Extract<ServerMsg, { t: T }>;
    return undefined;
  }
  all<T extends ServerMsg['t']>(t: T) { return this.inbox.filter((m) => m.t === t) as Extract<ServerMsg, { t: T }>[]; }
}

let now = 1_000_000;
let seq = 0;
let events: RoomEvent[] = [];
const deps = { now: () => now, rand: () => ((seq = (seq * 9301 + 49297) % 233280) / 233280), onEvent: (e: RoomEvent) => events.push(e) };

function room() {
  const r = new RoomCore('ABCDE', deps);
  r.create();
  return r;
}
function join(r: RoomCore, id: string, extra: Record<string, unknown> = {}) {
  const c = new FakeConn(id);
  r.open(c);
  r.message(id, JSON.stringify({ t: 'hello', proto: PROTO, build: 'b1', name: id, ...extra }));
  return c;
}
const send = (r: RoomCore, c: FakeConn, m: object) => r.message(c.id, JSON.stringify(m));
function startedRoom() {
  const r = room();
  const a = join(r, 'a'), b = join(r, 'b');
  send(r, a, { t: 'pick', car: 'sparrow' });
  send(r, b, { t: 'pick', car: 'bulldog' });
  send(r, a, { t: 'ready', ready: true });
  send(r, b, { t: 'ready', ready: true });
  return { r, a, b };
}

beforeEach(() => {
  now = 1_000_000;
  seq = 1;
  events = [];
});

describe('room lobby', () => {
  it('rejects connections to a room that was never created', () => {
    const r = new RoomCore('ZZZZZ', deps);
    const c = new FakeConn('x');
    r.open(c);
    expect(c.last('reject')?.reason).toBe('notFound');
    expect(c.closed).not.toBeNull();
  });

  it('seats two players and rejects a third', () => {
    const r = room();
    const a = join(r, 'a'), b = join(r, 'b'), c = join(r, 'c');
    expect(a.last('welcome')?.slot).toBe(0);
    expect(b.last('welcome')?.slot).toBe(1);
    expect(c.last('reject')?.reason).toBe('full');
    expect(a.last('lobby')?.players.map((p) => p?.name)).toEqual(['a', 'b']);
    expect(events.filter((e) => e.type === 'player_joined')).toHaveLength(2);
  });

  it('rejects a wrong protocol version and a different build', () => {
    const r = room();
    expect(join(r, 'old', { proto: PROTO + 1 }).last('reject')?.reason).toBe('version');
    join(r, 'a');
    expect(join(r, 'b', { build: 'b2' }).last('reject')?.reason).toBe('version');
  });

  it('drops a connection that never says hello', () => {
    const r = room();
    const c = new FakeConn('silent');
    r.open(c);
    now += 11_000;
    r.alarm();
    expect(c.closed?.[1]).toBe('hello timeout');
  });

  it('rejects malformed messages', () => {
    const r = room();
    const a = join(r, 'a');
    r.message('a', '{nope');
    expect(a.last('reject')?.reason).toBe('bad');
  });

  it('only the host changes the config, which is clamped, and it clears ready', () => {
    const r = room();
    const a = join(r, 'a'), b = join(r, 'b');
    send(r, b, { t: 'pick', car: 'x' });
    send(r, b, { t: 'ready', ready: true });
    send(r, b, { t: 'config', config: { target: 3 } });
    expect(r.config.target).toBe(5);
    send(r, a, { t: 'config', config: { target: 99, roundTime: 5, map: 'desert' } });
    expect(r.config).toMatchObject({ target: 20, roundTime: 15, map: 'desert' });
    expect(a.last('lobby')?.players[1]?.ready).toBe(false);
  });

  it('cannot be ready without a car unless cars are random', () => {
    const r = room();
    const a = join(r, 'a');
    send(r, a, { t: 'config', config: { randomCars: false } });
    send(r, a, { t: 'ready', ready: true });
    expect(r.slots[0]?.ready).toBe(false);
    send(r, a, { t: 'config', config: { randomCars: true } });
    send(r, a, { t: 'ready', ready: true });
    expect(r.slots[0]?.ready).toBe(true);
  });

  it('starts when both are ready, with the same start for both', () => {
    const { a, b } = startedRoom();
    const sa = a.last('start')!, sb = b.last('start')!;
    expect(sa).toEqual(sb);
    expect(sa.cars).toEqual(['sparrow', 'bulldog']);
    expect(sa.delay).toBeGreaterThanOrEqual(4);
    expect(a.last('lobby')?.phase).toBe('playing');
  });

  it('answers pings and uses the reported RTT for the input delay', () => {
    const r = room();
    const a = join(r, 'a'), b = join(r, 'b');
    send(r, a, { t: 'ping', ts: 5, rtt: 400 });
    expect(a.last('pong')?.ts).toBe(5);
    send(r, a, { t: 'pick', car: 'x' });
    send(r, b, { t: 'pick', car: 'y' });
    send(r, a, { t: 'ready', ready: true });
    send(r, b, { t: 'ready', ready: true });
    // 400 ms round trip: 12 ticks one way + BATCH (1) + 1 of slack.
    expect(a.last('start')?.delay).toBe(14);
  });
});

describe('room match', () => {
  it('relays inputs to the other player only, in order', () => {
    const { r, a, b } = startedRoom();
    send(r, a, { t: 'in', k: 3, c: [[1, 2]] });
    send(r, a, { t: 'in', k: 6 });
    expect(b.all('in')).toEqual([{ t: 'in', p: 0, k: 3, c: [[1, 2]] }, { t: 'in', p: 0, k: 6 }]);
    expect(a.all('in')).toHaveLength(0);
  });

  it('ignores inputs that go backwards or rewrite confirmed ticks', () => {
    const { r, a, b } = startedRoom();
    send(r, a, { t: 'in', k: 6 });
    send(r, a, { t: 'in', k: 5 });
    send(r, a, { t: 'in', k: 9, c: [[4, 1], [8, 1]] });
    expect(b.all('in').map((m) => m.k)).toEqual([6, 9]);
    expect(b.last('in')?.c).toEqual([[8, 1]]);
  });

  it('a hash mismatch ends the match as desync', () => {
    const { r, a, b } = startedRoom();
    send(r, a, { t: 'hash', k: 60, h: 1 });
    send(r, b, { t: 'hash', k: 60, h: 1 });
    expect(r.phase).toBe('playing');
    send(r, a, { t: 'hash', k: 120, h: 1 });
    send(r, b, { t: 'hash', k: 120, h: 2 });
    expect(b.last('desync')?.k).toBe(120);
    expect(a.last('end')?.reason).toBe('desync');
    expect(r.phase).toBe('lobby');
  });

  it('agreeing results end the match; it goes back to the lobby for a rematch', () => {
    const { r, a, b } = startedRoom();
    send(r, a, { t: 'result', winner: 1, scores: [2, 5] });
    expect(r.phase).toBe('playing');
    send(r, b, { t: 'result', winner: 1, scores: [2, 5] });
    expect(a.last('end')).toEqual({ t: 'end', winner: 1, scores: [2, 5], reason: 'score' });
    expect(events.at(-1)).toMatchObject({ type: 'match_finished', winner: 1, names: ['a', 'b'] });
    send(r, a, { t: 'ready', ready: true });
    send(r, b, { t: 'ready', ready: true });
    expect(a.all('start')).toHaveLength(2);
  });

  it('disagreeing results end as desync', () => {
    const { r, a, b } = startedRoom();
    send(r, a, { t: 'result', winner: 1, scores: [2, 5] });
    send(r, b, { t: 'result', winner: 0, scores: [5, 2] });
    expect(a.last('end')?.reason).toBe('desync');
  });

  it('one result is accepted after a wait if the other never arrives', () => {
    const { r, a } = startedRoom();
    send(r, a, { t: 'result', winner: 0, scores: [5, 1] });
    now += 11_000;
    r.alarm();
    expect(a.last('end')).toMatchObject({ winner: 0, reason: 'score' });
  });

  it('leaving mid-match concedes', () => {
    const { r, a, b } = startedRoom();
    send(r, b, { t: 'leave' });
    expect(a.last('end')).toMatchObject({ winner: 0, reason: 'forfeit' });
    expect(r.slots[1]).toBeNull();
  });

  it('a dropped player can come back with the token and gets every input so far', () => {
    const { r, a, b } = startedRoom();
    const token = b.last('welcome')!.token;
    send(r, a, { t: 'in', k: 3, c: [[2, 1]] });
    send(r, b, { t: 'in', k: 3, c: [[1, 4]] });
    r.close('b');
    expect(a.last('peer')).toMatchObject({ state: 'left' });
    now += 5000;
    const b2 = join(r, 'b2', { token });
    expect(b2.last('welcome')?.slot).toBe(1);
    const res = b2.last('resume')!;
    expect(res.start).toEqual(a.last('start'));
    expect(res.inputs).toEqual([[0, 2, 1], [1, 1, 4]]);
    expect(res.confirmed).toEqual([3, 3]);
    expect(a.last('peer')?.state).toBe('back');
  });

  it('a player who does not come back in time forfeits', () => {
    const { r, a } = startedRoom();
    r.close('b');
    now += RECONNECT_SEC * 1000 + 1;
    r.alarm();
    expect(a.last('end')).toMatchObject({ winner: 0, reason: 'forfeit' });
    expect(r.slots[1]).toBeNull();
  });

  it('the same token in a new tab replaces the old connection', () => {
    const r = room();
    const a = join(r, 'a');
    const a2 = join(r, 'a2', { token: a.last('welcome')!.token });
    expect(a.closed?.[1]).toBe('replaced');
    expect(a2.last('welcome')?.slot).toBe(0);
    expect(r.slots[1]).toBeNull();
  });
});

describe('room lifetime', () => {
  it('expires when empty and survives a snapshot round trip', () => {
    const r = room();
    const a = join(r, 'a');
    send(r, a, { t: 'pick', car: 'sparrow' });
    const snap = JSON.parse(JSON.stringify(r.snapshot()));
    const r2 = new RoomCore('ABCDE', deps);
    r2.restore(snap);
    expect(r2.slots[0]?.car).toBe('sparrow');
    send(r, a, { t: 'leave' });
    expect(r.alarm()).toBe(false);
    now += 121_000;
    expect(r.alarm()).toBe(true);
  });

  it('a snapshot taken mid-match restores into the lobby', () => {
    const { r } = startedRoom();
    const r2 = new RoomCore('ABCDE', deps);
    r2.restore(JSON.parse(JSON.stringify(r.snapshot())));
    expect(r2.phase).toBe('lobby');
    expect(r2.slots.every((s) => s && !s.ready)).toBe(true);
  });

  it('nextAlarm tracks the reconnect deadline', () => {
    const { r } = startedRoom();
    expect(r.nextAlarm()).toBeNull();
    r.close('a');
    expect(r.nextAlarm()).toBe(now + RECONNECT_SEC * 1000);
  });

  it('sanitizeConfig fills defaults', () => {
    expect(sanitizeConfig({ target: 2.5 as number })).toEqual({ map: 'random', target: 5, roundTime: 30, randomCars: true });
  });
});
