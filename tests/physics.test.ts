import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game';
import { CARS } from '../src/cars/defs';
import { MAPS, MAP_BY_ID } from '../src/maps/defs';
import { CAR_BY_ID } from '../src/cars/defs';
import { Vec2 } from 'planck';
import { tagOf } from '../src/physics/tags';

function mkGame(mapIdx = 0, a = 0, b = 1) {
  return new Game({ cars: [CARS[a], CARS[b % CARS.length]], maps: [MAPS[mapIdx]], randomMaps: false, target: 5, roundTime: 60, seed: 1 });
}

describe('physics sandbox', () => {
  it('cars settle on the ground during countdown', () => {
    const g = mkGame();
    for (let i = 0; i < 180; i++) g.step();
    for (const c of g.cars) {
      expect(c.alive).toBe(true);
      expect(c.wheelsOnGround).toBeGreaterThan(0);
      expect(Math.abs(c.angle)).toBeLessThan(0.6);
      expect(c.speed).toBeLessThan(1.5);
    }
  });
  it('driving moves the car', () => {
    const g = mkGame();
    for (let i = 0; i < 180; i++) g.step();
    const x0 = g.cars[0].position.x;
    g.inputs[0] = 1;
    for (let i = 0; i < 45; i++) g.step();
    expect(g.cars[0].position.x - x0).toBeGreaterThan(2);
  });
});

describe('head vs ground', () => {
  it('a car flipped onto its roof loses the round (head hits the ground)', () => {
    const g = mkGame();
    for (let i = 0; i < 180; i++) g.step();
    const deaths: string[] = [];
    g.on((e) => { if (e.type === 'death') deaths.push(`${e.player}:${e.cause}`); });
    const c = g.cars[0];
    const p = c.chassis.getPosition();
    // Turn the whole car upside down just above where it was standing.
    for (const b of c.bodies) {
      const q = b.getPosition();
      const dx = q.x - p.x, dy = q.y - p.y;
      b.setTransform({ x: p.x - dx, y: p.y - 1.2 - dy } as never, b.getAngle() + Math.PI);
      b.setLinearVelocity({ x: 0, y: 0 } as never);
      b.setAngularVelocity(0);
    }
    for (let i = 0; i < 120 && !deaths.length; i++) g.step();
    expect(deaths).toEqual(['0:ground']);
    expect(c.alive).toBe(false);
  });
});

describe('spawn with trailers', () => {
  it('trailer wheels start above the ground', () => {
    for (const id of ['tanker-truck', 'timber-lorry', 'car-carrier', 'travel-trailer', 'sled-dog']) {
      const car = CAR_BY_ID[id];
      const g = new Game({ cars: [car, car], maps: [MAPS[0]], randomMaps: false, target: 5, roundTime: 60, seed: 1 });
      for (const c of g.cars) {
        for (const lw of c.linkWheels) {
          const p = lw.body.getPosition();
          const r = (lw.body.getFixtureList()!.getShape() as unknown as { m_radius: number }).m_radius;
          let ground = Infinity;
          g.world.rayCast(new Vec2(p.x, p.y - 4), new Vec2(p.x, p.y + 4), (fix, pt) => {
            if (!fix.isSensor() && tagOf(fix)?.kind === 'terrain') ground = Math.min(ground, pt.y);
            return -1;
          });
          expect(ground - p.y, `${id} trailer wheel`).toBeGreaterThan(r - 0.1);
        }
      }
    }
  });
});

describe('swimming and umbrellas', () => {
  const sea = (id: string) => {
    const g = new Game({ cars: [CAR_BY_ID[id], CAR_BY_ID['monster-truck']], maps: [MAP_BY_ID.beach], randomMaps: false, target: 3, roundTime: 99, seed: 5 });
    while (g.phase !== 'play') g.step();
    for (let i = 0; i < 700 && g.cars[0].alive; i++) {
      g.inputs[0] = g.cars[0].position.x > 3 ? -1 : 0;
      g.inputs[1] = 0;
      g.step();
    }
    return g.cars[0];
  };
  it('boats and sea creatures float, ordinary cars drown', () => {
    for (const id of ['rowboat', 'speedboat', 'yacht', 'chomp-shark', 'amphibian']) expect(sea(id).alive, id).toBe(true);
    expect(sea('sparrow').alive).toBe(false);
  });
  it('an umbrella only bounces a car that lands on it from above', () => {
    const g = new Game({ cars: [CAR_BY_ID.sparrow, CAR_BY_ID.sparrow], maps: [MAP_BY_ID.beach], randomMaps: false, target: 3, roundTime: 99, seed: 5 });
    const pad = g.arena.padBodies[0];
    const car = g.cars[0];
    const landing = (g as unknown as { landingOn(a: unknown, b: unknown): boolean }).landingOn.bind(g);
    const at = pad.getPosition();
    car.chassis.setPosition(new Vec2(at.x, at.y - 2));
    car.chassis.setLinearVelocity(new Vec2(0, 6));
    expect(landing(pad, car.chassis)).toBe(true);
    car.chassis.setLinearVelocity(new Vec2(6, 0));
    expect(landing(pad, car.chassis)).toBe(false);
    car.chassis.setPosition(new Vec2(at.x, at.y + 1));
    car.chassis.setLinearVelocity(new Vec2(0, -6));
    expect(landing(pad, car.chassis)).toBe(false);
  });
});
