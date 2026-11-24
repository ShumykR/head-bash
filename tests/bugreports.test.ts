import { describe, it, expect } from 'vitest';
import { Vec2 } from 'planck';
import { Game } from '../src/game/game';
import { CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';

// Regressions from player bug reports (the JSON logs from the 🐞 button).

const game = (map: string, a: string, b: string, seed = 3) =>
  new Game({ cars: [CAR_BY_ID[a], CAR_BY_ID[b]], maps: [MAP_BY_ID[map]], randomMaps: false, target: 99, roundTime: 60, seed });

describe('bug reports', () => {
  it('icecave: no icicle is already falling at GO (it used to drop during the countdown onto a parked head)', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const g = game('icecave', 'snowball-tank', 'shopping-cart', seed);
      while (g.phase === 'countdown') g.step();
      expect(g.arena.blocks.length).toBe(0);
      // and the first one still comes, a full interval later
      for (let i = 0; i < 60 * 3; i++) g.step();
      expect(g.arena.blocks.length).toBeGreaterThan(0);
    }
  });

  it('mineshaft: the shuttle platform backs off instead of grinding a wheel off its axle', () => {
    for (const id of ['minibus', 'snowmobile', 'shopping-cart']) {
      let worst = 0;
      for (const side of [0, 1]) for (const delay of [0, 30, 60, 90]) {
        const g = game('mineshaft', id, id, 3 + delay);
        const c = g.cars[side];
        const run = c.joints.map(() => 0);
        for (let i = 0; i < 60 * 12 && c.alive; i++) {
          g.inputs[side] = i < 180 + delay ? 0 : (side === 0 ? 1 : -1) * (Math.floor(i / 50) % 3 === 2 ? -1 : 1);
          g.step();
          c.joints.forEach((j, k) => {
            const a = j.getAnchorA(), b = j.getAnchorB(), ax = c.chassis.getWorldVector(j.getLocalAxisA());
            const off = Math.abs((b.x - a.x) * ax.y - (b.y - a.y) * ax.x);
            run[k] = off > 0.3 ? run[k] + 1 : 0;
            worst = Math.max(worst, run[k]);
          });
        }
      }
      // a wheel may get yanked for a moment, but never stays torn off (it used to for over a second)
      expect(worst, id).toBeLessThan(30);
    }
  });

  it('rift: a car caught by its body on an island corner falls off instead of hanging there under throttle', () => {
    const g = game('rift', 'rickshaw', 'snowmobile');
    for (let i = 0; i < 190; i++) g.step();
    const c = g.cars[1];
    c.reset(20.03, 8.12);
    for (let i = 0; i < 120; i++) { g.inputs[1] = -1; g.step(); }
    expect(c.position.y).toBeGreaterThan(12);
  });

  it('snowmobile carries no hidden collision parts above its deck', () => {
    const top = Math.min(...CAR_BY_ID.snowmobile.body.filter((p) => p.hide && !p.deco).flatMap((p) => p.pts.map((q) => q[1])));
    expect(top).toBeGreaterThan(-0.4);
  });
});
