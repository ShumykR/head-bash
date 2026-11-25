import { describe, expect, it } from 'vitest';
import { Client, setup } from './netsim';
import { PROTO } from '../src/net/protocol';

function expectSameHashes(a: Client, b: Client) {
  let compared = 0;
  for (const [k, h] of a.hashes) {
    if (b.hashes.has(k)) {
      expect(b.hashes.get(k), `hash at tick ${k}`).toBe(h);
      compared++;
    }
  }
  return compared;
}

describe('lockstep over a simulated network', () => {
  it('plays a whole match in sync with 40–70 ms latency and agrees on the result', () => {
    const { a, b, run } = setup(0.04, 0.03);
    run(400, () => !!(a.ended && b.ended));
    expect(a.desync || b.desync).toBe(false);
    expect(a.ended).toMatchObject({ t: 'end', reason: 'score' });
    expect(b.ended).toEqual(a.ended);
    expect(expectSameHashes(a, b)).toBeGreaterThan(5);
  });

  it('keeps going (slower) on a bad link: 150 ms ± 120 ms', () => {
    const { a, b, run } = setup(0.15, 0.12, 5, 20);
    run(60);
    expect(a.desync || b.desync).toBe(false);
    expect(expectSameHashes(a, b)).toBeGreaterThan(10);
    // Both made real progress (at least half of real time) despite the delay.
    expect(a.ls!.simTick).toBeGreaterThan(60 * 30);
    expect(Math.abs(a.ls!.simTick - b.ls!.simTick)).toBeLessThan(60);
  });

  it('never simulates a tick before both inputs for it are known', () => {
    const { a, b, net, run } = setup(0.08, 0.06, 9, 20);
    for (let i = 0; i < 60 * 20; i++) {
      run(1 / 60);
      for (const c of [a, b]) {
        const ls = c.ls;
        if (!ls) continue;
        expect(ls.simTick - 1).toBeLessThanOrEqual(Math.min(ls.confirmed[0], ls.confirmed[1]));
      }
    }
    expect(a.game!.stepCount).toBeGreaterThan(60 * 15);
    void net;
  });

  it('a player who drops and reconnects re-simulates to the same state', () => {
    const { net, room, a, b, run } = setup(0.04, 0.02, 3, 3);
    run(10);
    const before = b.ls!.simTick;
    expect(before).toBeGreaterThan(400);
    // b loses its connection for 3 seconds.
    b.connected = false;
    room.close('b1');
    run(3);
    // a is held up (it cannot simulate past b's last confirmed input).
    const aStalled = a.ls!.simTick;
    run(1);
    expect(a.ls!.simTick - aStalled).toBeLessThan(30);
    // b reconnects with its token and catches up from the resume message.
    b.attach('b2');
    b.toServer({ t: 'hello', proto: PROTO, build: 't', name: 'B', token: b.token });
    run(400, () => !!(a.ended && b.ended));
    expect(a.desync || b.desync).toBe(false);
    expect(a.ended).toMatchObject({ reason: 'score' });
    expect(b.ended).toEqual(a.ended);
    expect(expectSameHashes(a, b)).toBeGreaterThan(5);
    void net;
  });
});
