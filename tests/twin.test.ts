import { describe, expect, it } from 'vitest';
import { Game } from '../src/game/game';
import { gameConfigFor } from '../src/net/session';
import { stateHash } from '../src/net/hash';
import { isolated, twinForGames } from '../src/net/twin';
import { dirOfBits, BIT_ACTION } from '../src/net/protocol';
import { player } from './netsim';

/** Inputs for ticks 0..n-1 (player() is stateful: read it in order once). */
function script(seed: number, n = 9100) {
  const p = player(seed);
  const out: number[] = [];
  for (let k = 0; k < n; k++) out.push(p(k));
  return (k: number) => out[k];
}

const cfg = gameConfigFor({ t: 'start', seed: 11, delay: 4, cars: ['porcupine', 'rammer'], config: { target: 9, roundTime: 30, map: 'random', randomCars: false } } as never);

function drive(g: Game, b0: number, b1: number) {
  g.inputs[0] = dirOfBits(b0);
  g.inputs[1] = dirOfBits(b1);
  g.actions[0] = (b0 & BIT_ACTION) !== 0;
  g.actions[1] = (b1 & BIT_ACTION) !== 0;
  g.step();
}

function prepare() {
  const auth = new Game(cfg), view = new Game(cfg), ref = new Game(cfg);
  return { auth, view, ref, twin: twinForGames(auth) };
}

describe('twin (rollback state copy)', () => {
  it('copies the game exactly, across rounds, without touching the source', () => {
    const { auth, view, ref, twin } = prepare();
    const p0 = script(5), p1 = script(6), wrong = script(99);
    for (let k = 0; k < 100; k++) for (const g of [auth, view, ref]) drive(g, p0(k), p1(k));
    expect(twin.pair(auth, view)).toBe(true);
    const car0 = view.cars[0];
    const syncMs: number[] = [];
    let compared = 0, rounds = auth.match.round;
    for (let k = 100; k < 9000; k++) {
      const b0 = p0(k), b1 = p1(k);
      drive(auth, b0, b1);
      drive(ref, b0, b1);
      expect(stateHash(auth), `source untouched at ${k}`).toBe(stateHash(ref));
      if (k % 25 === 0) {
        // The shown game ran ahead on a wrong guess; copy the truth back in.
        isolated(() => { for (let j = 0; j < 12; j++) drive(view, b0, wrong(k + j)); });
        const t0 = performance.now();
        for (const d of twin.sync(auth, view)) if (d === view.world) view.wireWorld();
        syncMs.push(performance.now() - t0);
        expect(stateHash(view)).toBe(stateHash(auth));
        // From here on it must evolve exactly like the source.
        for (let j = 1; j <= 10; j++) {
          isolated(() => drive(view, p0(k + j), p1(k + j)));
        }
      }
      if (k % 25 === 10) {
        expect(view.stepCount).toBe(auth.stepCount);
        expect(stateHash(view), `shown game follows at ${k}`).toBe(stateHash(auth));
        compared++;
      }
      rounds = auth.match.round;
    }
    expect(compared).toBeGreaterThan(300);
    syncMs.sort((x, y) => x - y);
    console.info(`sync ms: median ${syncMs[syncMs.length >> 1].toFixed(2)}, p95 ${syncMs[Math.floor(syncMs.length * 0.95)].toFixed(2)}`);
    expect(rounds).toBeGreaterThan(2);
    void car0;
  }, 60000);

  it('keeps the shown objects (no fresh copies) when only state changed', () => {
    const { auth, view, twin } = prepare();
    const p0 = script(1), p1 = script(2), wrong = script(3);
    for (let k = 0; k < 300; k++) { drive(auth, p0(k), p1(k)); drive(view, p0(k), p1(k)); }
    expect(twin.pair(auth, view)).toBe(true);
    const cars = [...view.cars], world = view.world;
    for (let k = 300; k < 310; k++) drive(auth, p0(k), p1(k));
    isolated(() => { for (let k = 300; k < 312; k++) drive(view, p0(k), wrong(k)); });
    twin.sync(auth, view);
    expect(view.cars[0]).toBe(cars[0]);
    expect(view.cars[1]).toBe(cars[1]);
    expect(view.world).toBe(world);
    expect(stateHash(view)).toBe(stateHash(auth));
    expect(twin.created).toBeLessThan(twin.visited / 4);
  });
});
