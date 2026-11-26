import { describe, expect, it, vi } from 'vitest';
import { beforeAll, afterAll } from 'vitest';
import { Client, netsimDefaults, setup } from './netsim';
import { PROTO } from '../src/net/protocol';

// Whole matches on two (with rollback four) simulated games.
vi.setConfig({ testTimeout: 40000 });

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

describe.each([['lockstep', false], ['rollback', true]] as const)('%s over a simulated network', (_mode, rollback) => {
  beforeAll(() => { netsimDefaults.rollback = rollback; });
  afterAll(() => { netsimDefaults.rollback = false; });

  it('plays a whole match in sync with 40–70 ms latency and agrees on the result', () => {
    const { a, b, run } = setup(0.04, 0.03);
    run(400, () => !!(a.ended && b.ended));
    expect(a.desync || b.desync).toBe(false);
    expect(a.ended).toMatchObject({ t: 'end', reason: 'score' });
    expect(b.ended).toEqual(a.ended);
    expect(expectSameHashes(a, b)).toBeGreaterThan(5);
  });

  it('abilities (the action button) stay in sync on both sides', () => {
    // Cars with abilities: the action bit must reach the other player's simulation too.
    const { a, b, run } = setup(0.05, 0.03, 4, 3, ['porcupine', 'rammer']);
    run(2, () => !!(a.game && b.game));
    const used = [0, 0];
    a.game!.on((e) => { if (e.type === 'ability') used[e.player]++; });
    run(400, () => !!(a.ended && b.ended));
    expect(used[0]).toBeGreaterThan(0);
    expect(used[1]).toBeGreaterThan(0);
    expect(a.desync || b.desync).toBe(false);
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

  it('a slow device (12 fps) neither stalls the other player nor inflates their input lag', () => {
    const { a, b, run } = setup(0.05, 0.02, 21, 20);
    run(1, () => !!(a.ls && b.ls));
    b.frameInterval = 1 / 12;
    const delay0 = a.ls!.delay;
    let samples = 0, lagSum = 0, stalled = 0, maxLag = 0;
    const t0 = a.ls!.simTick;
    for (let i = 0; i < 60 * 40; i++) {
      run(1 / 60);
      const ls = a.ls;
      if (!ls) break;
      const lag = ls.confirmed[a.slot] - ls.shown.stepCount; // how far ahead of the shown game A's own inputs land
      samples++;
      lagSum += lag;
      maxLag = Math.max(maxLag, lag);
      if (ls.stalled) stalled++;
    }
    expect(a.desync || b.desync).toBe(false);
    // Both keep (almost) real time: 40 s of play ≈ 2400 ticks.
    expect(a.ls!.simTick - t0).toBeGreaterThan(60 * 40 * 0.85);
    expect(b.ls!.simTick - t0).toBeGreaterThan(60 * 40 * 0.85);
    // A's controls stay responsive: inputs land about `delay` ticks ahead, not half a second.
    expect(lagSum / samples).toBeLessThan(delay0 + 6);
    expect(maxLag).toBeLessThan(delay0 + 14);
    expect(stalled / samples).toBeLessThan(0.5);
  });
});

describe('rollback', () => {
  /** Play `seconds` on a link and report how often A's screen froze and how far ahead A's input lands. */
  function measure(rollback: boolean, latency: number, jitter: number, seconds = 30) {
    netsimDefaults.rollback = rollback;
    try {
      const { a, b, run } = setup(latency, jitter, 3, 20);
      run(3, () => !!(a.ls && b.ls));
      run(3);
      let resets = 0;
      a.ls!.onViewReset = () => resets++;
      let frames = 0, stalled = 0, lag = 0;
      for (let i = 0; i < 60 * seconds; i++) {
        run(1 / 60);
        const ls = a.ls!;
        frames++;
        if (ls.stalled) stalled++;
        lag += ls.confirmed[a.slot] - ls.shown.stepCount;
      }
      expect(a.desync || b.desync).toBe(false);
      expect(expectSameHashes(a, b)).toBeGreaterThan(20);
      return { a, b, stalled: stalled / frames, lag: lag / frames, resets, rounds: a.game!.match.round };
    } finally {
      netsimDefaults.rollback = false;
    }
  }

  it('hides jitter: far fewer freezes and less input lag than plain lockstep, with no drift', () => {
    const lock = measure(false, 0.03, 0.08);
    const roll = measure(true, 0.03, 0.08);
    expect(lock.stalled).toBeGreaterThan(0.1);
    expect(roll.stalled).toBeLessThan(0.03);
    expect(roll.lag).toBeLessThan(lock.lag);
    for (const c of [roll.a, roll.b]) {
      // It did guess wrong now and then, corrected it, and never drifted from the authoritative game.
      expect(c.ls!.rollbacks).toBeGreaterThan(0);
      expect(c.ls!.mismatches).toBe(0);
      expect(c.ls!.rollback).toBe(true);
    }
    // The shown game keeps its own objects (the renderer's sprites). At most a wrong guess right
    // at a round's start makes it take new ones (during the countdown, when sprites are rebuilt anyway).
    expect(roll.rounds).toBeGreaterThan(1);
    expect(roll.resets).toBeLessThan(roll.rounds);
  }, 60000);

  it('on a calm link the input delay comes down to a couple of ticks', () => {
    const roll = measure(true, 0.02, 0.02, 20);
    expect(roll.a.ls!.delay).toBeLessThanOrEqual(3);
    expect(roll.b.ls!.delay).toBeLessThanOrEqual(3);
    expect(roll.stalled).toBeLessThan(0.02);
  }, 60000);

  it('keeps both clocks together (the one ahead slows down)', () => {
    const roll = measure(true, 0.05, 0.05, 20);
    expect(Math.abs(roll.a.ls!.advantage)).toBeLessThan(2);
    expect(Math.abs(roll.a.ls!.simTick - roll.b.ls!.simTick)).toBeLessThan(20);
  }, 60000);
});
