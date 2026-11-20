import { describe, it, expect } from 'vitest';
import { Vec2 } from 'planck';
import { Game } from '../src/game/game';
import { CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
import type { ItemKind } from '../src/cars/types';

function rig(car0 = 'sparrow') {
  const g = new Game({ cars: [CAR_BY_ID[car0], CAR_BY_ID.rowboat], maps: [MAP_BY_ID.meadow], randomMaps: false, target: 99, roundTime: 60, seed: 3 });
  while (g.phase !== 'play') g.step();
  for (let i = 0; i < 120; i++) g.step();
  return g;
}
const still = (g: Game) => { for (const c of g.cars) for (const b of c.bodies) { const v = b.getLinearVelocity(); b.setLinearVelocity(new Vec2(0, v.y > 1 ? v.y : 0)); } };

describe('items hitting a driver\'s head', () => {
  for (const kind of ['hay', 'cow', 'melon', 'coal', 'tire', 'cone'] as ItemKind[]) {
    it(`a ${kind} falling on an open car's head kills`, () => {
      const g = rig();
      const hp = g.cars[0].headWorld();
      g.spawnItem(kind, 1, new Vec2(hp.x, hp.y - 1.2), new Vec2(0, 0), 30);
      for (let i = 0; i < 90 && g.phase === 'play'; i++) { still(g); g.step(); }
      expect(g.phase).toBe('roundEnd');
      expect(g.headLog.find((e) => e.with === 'item')).toMatchObject({ result: 'KILL', item: kind });
    });
  }

  it('a slow item drifting through the head does not kill, and the log says why', () => {
    const g = rig();
    const hp = g.cars[0].headWorld();
    const it = g.spawnItem('melon', 1, new Vec2(hp.x - 1, hp.y), new Vec2(2, 0), 30);
    it.body.setGravityScale(0);
    for (let i = 0; i < 60; i++) { still(g); it.body.setLinearVelocity(new Vec2(2, 0)); g.step(); }
    expect(g.phase).toBe('play');
    expect(g.headLog.find((e) => e.with === 'item')).toMatchObject({ result: 'below-threshold', need: 3.5 });
  });

  it('an item riding along with a fast car (same velocity as the head) is not a hit', () => {
    const g = rig();
    const car = g.cars[0];
    const hp = car.headWorld();
    const it = g.spawnItem('hay', 1, new Vec2(hp.x, hp.y), new Vec2(8, 0), 30);
    it.body.setGravityScale(0);
    for (let i = 0; i < 3; i++) {
      for (const b of car.bodies) b.setLinearVelocity(new Vec2(8, 0));
      it.body.setLinearVelocity(new Vec2(8, 0));
      g.step();
    }
    expect(g.phase).toBe('play');
    const e = g.headLog.find((x) => x.with === 'item');
    expect(e).toMatchObject({ result: 'below-threshold' });
    expect(e!.speed as number).toBeGreaterThan(7); // fast in the world...
    expect(e!.rel as number).toBeLessThan(1.5); // ...but not relative to the head
  });

  it('a thrown item that is already overlapping the head still counts once it is fast enough (not only at first touch)', () => {
    const g = rig();
    const car = g.cars[0];
    const hp = car.headWorld();
    const it = g.spawnItem('cow', 1, new Vec2(hp.x, hp.y), new Vec2(0, 0), 30);
    it.body.setGravityScale(0);
    for (let i = 0; i < 20; i++) { still(g); it.body.setLinearVelocity(new Vec2(0, 0)); it.body.setPosition(new Vec2(hp.x, hp.y)); g.step(); }
    expect(g.phase).toBe('play'); // resting on the head: no hit
    it.body.setLinearVelocity(new Vec2(7, 0)); // now it is shoved
    for (let i = 0; i < 10 && g.phase === 'play'; i++) { still(g); g.step(); }
    expect(g.phase).toBe('roundEnd');
    expect(g.headLog.at(-1)).toMatchObject({ result: 'KILL', via: 'overlap' });
  });

  it('a car part on the head after a shield runs out kills', () => {
    const g = rig();
    const [a, b] = g.cars;
    b.shieldT = 0.4;
    const hb = b.headWorld();
    a.reset(hb.x - 1.2, hb.y - 0.3);
    let blocked = false;
    for (let i = 0; i < 120 && g.phase === 'play'; i++) {
      still(g);
      g.step();
      if (g.headLog.some((e) => e.result === 'shield-blocked')) blocked = true;
    }
    expect(blocked || g.headLog.length > 0).toBe(true);
    expect(g.phase).toBe('roundEnd');
    expect(g.lastResult).not.toBeNull();
  });
});
