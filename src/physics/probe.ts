import { World, Vec2, Chain } from 'planck';
import { CAT, MASK, DEFAULT_GRAVITY, POSITION_ITERS, STEP_DT, VELOCITY_ITERS } from './constants';
import { Car } from '../cars/car';
import type { CarDef } from '../cars/types';

/** Flat test track used to measure car handling headlessly (tests + tuning). */
export function testWorld(gravity = DEFAULT_GRAVITY) {
  const world = new World({ gravity: new Vec2(0, gravity) });
  const ground = world.createBody({ type: 'static' });
  ground.createFixture({
    shape: new Chain([new Vec2(-500, 0), new Vec2(500, 0), new Vec2(500, 20), new Vec2(-500, 20)], true),
    friction: 0.9,
    filterCategoryBits: CAT.TERRAIN,
    filterMaskBits: MASK.TERRAIN,
    userData: { kind: 'terrain', mat: 'grass' },
  });
  return world;
}

export function settle(world: World, car: Car, steps = 90) {
  for (let i = 0; i < steps; i++) {
    car.preStep(STEP_DT);
    world.step(STEP_DT, VELOCITY_ITERS, POSITION_ITERS);
  }
}

export function stepN(world: World, car: Car, n: number, each?: (i: number) => void) {
  for (let i = 0; i < n; i++) {
    each?.(i);
    car.preStep(STEP_DT);
    world.step(STEP_DT, VELOCITY_ITERS, POSITION_ITERS);
  }
}

export interface Handling {
  /** Seconds to reach 90% of top speed. */
  t90: number;
  top: number;
  /** Max nose-up angle (rad) while launching from standstill. */
  wheelie: number;
  /** Did the car flip over backwards while launching? */
  flipped: boolean;
  /** Seconds to rotate 360° in the air holding forward. */
  airFlip: number;
  /** Seconds to recover from lying on the roof. */
  recover: number;
  mass: number;
}

export function measure(def: CarDef): Handling {
  // Launch test
  let world = testWorld();
  let car = new Car(world, def, 0, 0, -1.6, 1);
  settle(world, car);
  let top = 0, t90 = 0, wheelie = 0, flipped = false;
  const speeds: number[] = [];
  stepN(world, car, 60 * 5, (i) => {
    car.input = 1;
    const v = car.chassis.getLinearVelocity().x;
    speeds.push(v);
    wheelie = Math.max(wheelie, -car.angle);
    if (Math.abs(car.angle) > 2) flipped = true;
    void i;
  });
  top = Math.max(...speeds);
  t90 = speeds.findIndex((v) => v >= top * 0.9) / 60;

  // Air flip: launch it high with no rotation and hold forward
  world = testWorld();
  car = new Car(world, def, 0, 0, -40, 1);
  for (const b of car.bodies) b.setLinearVelocity(new Vec2(0, -10));
  let turned = 0, last = car.chassis.getAngle(), airFlip = Infinity;
  for (let i = 0; i < 60 * 4; i++) {
    car.input = 1;
    car.preStep(STEP_DT);
    world.step(STEP_DT, VELOCITY_ITERS, POSITION_ITERS);
    const a = car.chassis.getAngle();
    turned += a - last;
    last = a;
    if (Math.abs(turned) >= Math.PI * 2) {
      airFlip = (i + 1) / 60;
      break;
    }
  }

  // Recovery from upside down
  world = testWorld();
  // Start high enough that nothing tall on the car (a jib, a ladder, a giant cone) begins inside the ground.
  const tall = Math.min(0, ...def.body.filter((p) => !p.deco).flatMap((p) => p.pts.map((q) => q[1])), ...(def.links ?? []).flatMap((l) => l.polys.filter((p) => !p.deco).flatMap((p) => p.pts.map((q) => q[1]))));
  const h0 = Math.max(2.2, -tall + 0.5);
  car = new Car(world, def, 0, 0, -h0, 1);
  car.chassis.setAngle(Math.PI);
  for (const w of [...car.wheels, ...car.linkWheels.map((lw) => lw.body)]) {
    const p = w.getPosition();
    w.setPosition(new Vec2(-p.x, -h0 - (p.y + h0)));
  }
  for (const l of car.links) {
    const p = l.getPosition();
    l.setTransform(new Vec2(-p.x, -h0 - (p.y + h0)), Math.PI);
  }
  let recover = Infinity;
  for (let i = 0; i < 60 * 8; i++) {
    car.input = 0;
    car.preStep(STEP_DT);
    world.step(STEP_DT, VELOCITY_ITERS, POSITION_ITERS);
    if (i > 30 && Math.abs(car.angle) < 0.35 && car.wheelsOnGround >= 1) {
      recover = (i + 1) / 60;
      break;
    }
  }
  return { t90, top, wheelie, flipped, airFlip, recover, mass: car.mass };
}

/** Drop the car from `h` meters: returns suspension extremes and whether the chassis bottomed out. */
export function dropTest(def: CarDef, h = 4.5) {
  const world = testWorld();
  const car = new Car(world, def, 0, 0, -h, 1);
  let minT = 0, maxT = 0, bottomed = false, bounces = 0, lastVy = 0;
  for (let i = 0; i < 60 * 3; i++) {
    car.preStep(STEP_DT);
    world.step(STEP_DT, VELOCITY_ITERS, POSITION_ITERS);
    for (const j of car.joints) {
      const t = j.getJointTranslation();
      minT = Math.min(minT, t);
      maxT = Math.max(maxT, t);
    }
    if (car.chassisTouching) bottomed = true;
    const vy = car.chassis.getLinearVelocity().y;
    if (lastVy > 0.5 && vy < -0.5) bounces++;
    lastVy = vy;
  }
  return { minT, maxT, bottomed, bounces, angle: car.angle };
}

/** A bowl for climbing tests: flat bottom `hw` m each side of centre, filleted into straight slopes of angle θ, flat rim. */
function bowl(theta: number, friction: number, hw: number, depth = 2.2) {
  const world = new World({ gravity: new Vec2(0, DEFAULT_GRAVITY) });
  const t = Math.tan(theta), run = depth / t;
  const pts: Vec2[] = [];
  // top-left rim → left slope → bottom → right slope → rim, with a soft fillet at each corner
  const raw: [number, number][] = [[-30, 0], [-hw - run, 0], [-hw, depth], [hw, depth], [hw + run, 0], [30, 0]];
  const fillet = (a: [number, number], b: [number, number], c: [number, number], r: number) => {
    const out: [number, number][] = [];
    const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
    const l1 = Math.hypot(v1[0], v1[1]), l2 = Math.hypot(v2[0], v2[1]);
    const p1 = [b[0] + (v1[0] / l1) * r, b[1] + (v1[1] / l1) * r], p2 = [b[0] + (v2[0] / l2) * r, b[1] + (v2[1] / l2) * r];
    for (let i = 0; i <= 6; i++) {
      const s = i / 6, q0x = p1[0] + (b[0] - p1[0]) * s, q0y = p1[1] + (b[1] - p1[1]) * s, q1x = b[0] + (p2[0] - b[0]) * s, q1y = b[1] + (p2[1] - b[1]) * s;
      out.push([q0x + (q1x - q0x) * s, q0y + (q1y - q0y) * s]);
    }
    return out;
  };
  pts.push(new Vec2(raw[0][0], raw[0][1]));
  for (let i = 1; i < raw.length - 1; i++) for (const p of fillet(raw[i - 1], raw[i], raw[i + 1], 1.5)) pts.push(new Vec2(p[0], p[1]));
  pts.push(new Vec2(raw[raw.length - 1][0], raw[raw.length - 1][1]), new Vec2(30, 20), new Vec2(-30, 20));
  const g = world.createBody({ type: 'static' });
  g.createFixture({ shape: new Chain(pts, true), friction, filterCategoryBits: CAT.TERRAIN, filterMaskBits: MASK.TERRAIN, userData: { kind: 'terrain', mat: 'moon' } });
  return world;
}



export interface ClimbResult { out: number; flipped: boolean }

/**
 * Starts from rest on the bottom of a pit with `deg`° walls and holds the throttle toward the right rim.
 * `out` is the time in seconds to reach the rim (-1 = never in 12 s); `flipped` = tipped over on the slope.
 */
export function climbTest(def: CarDef, deg: number, hw = 0.6, friction = 0.85, depth = 2.2): ClimbResult {
  const world = bowl((deg * Math.PI) / 180, friction, hw, depth);
  const car = new Car(world, def, 0, 0, depth - 1.6, 1);
  settle(world, car);
  const run = depth / Math.tan((deg * Math.PI) / 180);
  for (let i = 0; i < 60 * 12; i++) {
    car.input = 1;
    car.preStep(STEP_DT);
    world.step(STEP_DT, VELOCITY_ITERS, POSITION_ITERS);
    if (car.position.x > hw + run) return { out: i / 60, flipped: false };
    if (Math.abs(car.angle) > 2.0 && car.position.x < hw + run - 1) return { out: -1, flipped: true };
  }
  return { out: -1, flipped: false };
}
