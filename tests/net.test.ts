import { describe, expect, it, vi } from 'vitest';
import { DET_MATH, detMathInstalled } from '../src/net/detmath';
import { detRun } from '../src/net/detrun';
import { stateHash, stateHashDetail } from '../src/net/hash';
import { Game } from '../src/game/game';
import { CARS } from '../src/cars/defs';
import { MAPS } from '../src/maps/defs';

describe('deterministic math', () => {
  it('is installed for tests (as in the app)', () => {
    expect(detMathInstalled()).toBe(true);
    expect(Math.sin).toBe(DET_MATH.sin);
    expect(Math.atan2).toBe(DET_MATH.atan2);
  });

  it('stays within a couple of ulps of the textbook values', () => {
    const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(Math.abs(b) * 4e-16 + 1e-300);
    close(Math.sin(Math.PI / 6), 0.5);
    close(Math.cos(Math.PI / 3), 0.5);
    close(Math.tan(Math.PI / 4), 1);
    close(Math.atan2(1, 1), Math.PI / 4);
    close(Math.atan2(-1, -1), (-3 * Math.PI) / 4);
    close(Math.exp(1), Math.E);
    close(Math.pow(2, 10), 1024);
    close(Math.pow(9, 0.5), 3);
    close(Math.hypot(3, 4), 5);
    close(Math.hypot(2, 3, 6), 7);
    expect(Math.hypot()).toBe(0);
    expect(Math.hypot(-2)).toBe(2);
  });
});

describe('simulation determinism', () => {
  it('the same seed and inputs give the same hashes', () => {
    const a = detRun({ seed: 3, steps: 60 * 40 });
    const b = detRun({ seed: 3, steps: 60 * 40 });
    expect(a.hashes).toEqual(b.hashes);
    expect(a.rounds).toBeGreaterThan(0);
  });

  it('different seeds diverge', () => {
    expect(detRun({ seed: 1, steps: 120 }).hashes).not.toEqual(detRun({ seed: 2, steps: 120 }).hashes);
  });

  it('never calls Math.random', () => {
    const spy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random called inside the simulation: use game.rand()');
    });
    try {
      detRun({ seed: 11, steps: 60 * 60 });
    } finally {
      spy.mockRestore();
    }
  });
});

describe('state hash', () => {
  const make = () => new Game({ cars: [CARS[0], CARS[1]], maps: [MAPS[0]], randomMaps: false, target: 5, roundTime: 30, seed: 5 });

  it('changes when any body moves by one ulp', () => {
    const g = make();
    const h = stateHash(g);
    const b = g.cars[0].chassis;
    const p = b.getPosition();
    b.setPosition({ x: p.x + Number.EPSILON * Math.abs(p.x), y: p.y });
    expect(stateHash(g)).not.toBe(h);
  });

  it('detail lists one hash per body', () => {
    const g = make();
    let n = 0;
    for (let b = g.world.getBodyList(); b; b = b.getNext()) n++;
    expect(stateHashDetail(g).bodies).toHaveLength(n);
  });
});
