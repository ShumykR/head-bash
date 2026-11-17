import type { CarSpec } from './factory';
import type { Archetype, CarDef } from './types';

/*
 * Per-car tuning after the redesign, kept in one table so it can be read and changed in one place.
 * Numbers multiply what the roster entry already says (1 = unchanged); `arch` replaces the class.
 * Each line says why: what the car now looks like, or its win rate before tuning in scripts/gauntlet.ts
 * (hard bots, against sparrow, bulldog, zipper and american-car, both sides, three maps).
 */
export interface Tune {
  arch?: Archetype;
  speed?: number;
  accel?: number;
  mass?: number;
  air?: number;
  why: string;
}

export const TUNE: Record<string, Tune> = {
  // ---- the hand-built originals (same rules as below)
  rammer: { mass: 0.85, accel: 0.88, speed: 0.95, why: 'won 98% vs the panel' },
  ladder: { mass: 0.85, accel: 0.88, speed: 0.95, why: 'won 94% vs the panel' },
  forklift: { accel: 0.88, speed: 0.95, why: 'won 88% vs the panel (lighter, it bottoms out on drops)' },
  mammoth: { mass: 0.85, accel: 0.88, speed: 0.95, why: 'won 88% vs the panel' },
  porcupine: { mass: 0.85, accel: 0.88, speed: 0.95, why: 'won 88% vs the panel' },
  // ---- the look changed what the car is
  'gun-truck': { arch: 'allround', why: 'looks like an army jeep with a gun, not a heavy truck' },
  'harpoon': { arch: 'allround', why: 'a buggy on big wheels with a harpoon gun, not a heavy platform' },
  'doom-bomber': { speed: 0.9, mass: 1.15, why: 'a heavy bomber: was as light and fast as a jet (heavier still breaks the fast-is-light rule)' },
  // ---- bot gauntlet win rate <= 15%: heavier, quicker off the line, steadier in the air
  'mini-tentacle': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 0% vs the panel' },
  'bat-eyes': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 2% vs the panel' },
  'kicksled': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 2% vs the panel' },
  'minibus': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 2% vs the panel' },
  'personal-transporter': { air: 1.2, why: 'won 2% vs the panel (more weight or pull flips it over on launch)' },
  'robo-bike': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 2% vs the panel' },
  'sports-bike': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 2% vs the panel' },
  'bubble-car': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 4% vs the panel' },
  'dino-trike': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 4% vs the panel' },
  'fang-racer': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 4% vs the panel' },
  'throne-racer': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 4% vs the panel' },
  'big-head-racer': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 6% vs the panel' },
  'brass-bike': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 6% vs the panel' },
  hovercar: { accel: 1.2, air: 1.2, why: 'won 10% vs the panel (heavier, it bottoms out on drops)' },
  'bumper-car': { mass: 0.5, accel: 1.2, air: 1.2, why: 'won 4% vs the panel; kept at its old weight (~1.1), heavier it bottoms out on drops' },
  'sled-dog': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 8% vs the panel' },
  'snow-racer': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 8% vs the panel' },
  'go-kart': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 10% vs the panel' },
  'gyrocar': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 10% vs the panel' },
  'kraken-bait': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 10% vs the panel' },
  'motorbike': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 10% vs the panel' },
  'prehistoric-car': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 10% vs the panel' },
  'space-bike': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 10% vs the panel' },
  'turtle': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 11% vs the panel' },
  'aero-fire-engine': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 13% vs the panel' },
  'baby-carriage': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 13% vs the panel' },
  'celestial-teapot': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 13% vs the panel' },
  'night-bat-rod': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 13% vs the panel' },
  'shopping-cart': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 13% vs the panel' },
  'tow-truck': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 13% vs the panel' },
  'weevil': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 13% vs the panel' },
  'aero-bus': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 15% vs the panel' },
  'army-bike': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 15% vs the panel' },
  'helmet-car': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 15% vs the panel' },
  'pumpkin-car': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 15% vs the panel' },
  'rattle-bones': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 15% vs the panel' },
  'roadster': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 15% vs the panel' },
  'sleigh': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 15% vs the panel' },
  'soccer-delivery': { mass: 1.3, accel: 1.2, air: 1.2, why: 'won 15% vs the panel' },
  // ---- win rate 80-87%: a little lighter and slower
  'antique-mobile': { mass: 0.92, accel: 0.94, why: 'won 80% vs the panel' },
  'snow-coach': { mass: 0.92, accel: 0.94, why: 'won 80% vs the panel' },
  'street-sweeper': { mass: 0.92, accel: 0.94, why: 'won 80% vs the panel' },
  'asphalt-paver': { mass: 0.92, accel: 0.94, why: 'won 81% vs the panel' },
  'skeletal-ride': { mass: 0.92, accel: 0.94, why: 'won 83% vs the panel' },
  'snowball-cannon': { mass: 0.92, accel: 0.94, why: 'won 83% vs the panel' },
  'christmas-tree': { mass: 0.92, accel: 0.94, why: 'won 85% vs the panel' },
  'ghost-train': { mass: 0.92, accel: 0.94, why: 'won 85% vs the panel' },
  'locomotive': { mass: 0.92, accel: 0.94, why: 'won 85% vs the panel' },
  'dual-soccer-cannon': { mass: 0.92, accel: 0.94, why: 'won 87% vs the panel' },
  'snowball-tank': { mass: 0.92, accel: 0.94, why: 'won 87% vs the panel' },
  // ---- win rate >= 88%: lighter, slower to pull away
  'compensator-bike': { mass: 0.85, accel: 0.88, speed: 0.95, why: 'won 88% vs the panel' },
  'santa-sleigh': { mass: 0.85, accel: 0.88, speed: 0.95, why: 'won 89% vs the panel' },
  'beast': { mass: 0.85, accel: 0.88, speed: 0.95, why: 'won 90% vs the panel' },
  'laser-tank': { mass: 0.85, accel: 0.88, speed: 0.95, why: 'won 90% vs the panel' },
  'cherry-picker': { mass: 0.85, accel: 0.88, speed: 0.95, why: 'won 91% vs the panel' },
  'horned-pickup': { mass: 0.85, accel: 0.88, speed: 0.95, why: 'won 94% vs the panel' },
  't-rex': { mass: 0.85, accel: 0.88, speed: 0.95, why: 'won 94% vs the panel' },
  'excavator': { mass: 0.85, accel: 0.88, speed: 0.95, why: 'won 96% vs the panel' },
  'shredder': { mass: 0.85, accel: 0.88, speed: 0.95, why: 'won 96% vs the panel' },
  'stinger-buggy': { mass: 0.85, accel: 0.88, speed: 0.95, why: 'won 96% vs the panel' },
  'dual-snowballer': { mass: 0.85, accel: 0.88, speed: 0.95, why: 'won 98% vs the panel' },
  'spiky-car': { mass: 0.85, accel: 0.88, speed: 0.95, why: 'won 98% vs the panel' },
  'bulldozer': { mass: 0.85, accel: 0.88, speed: 0.95, why: 'won 100% vs the panel' },
};

/** A roster entry with its tuning applied. */
export function tuned(spec: CarSpec): CarSpec {
  const t = TUNE[spec.id];
  if (!t) return spec;
  const k = (base: number | undefined, m: number | undefined) => (m === undefined ? base : +((base ?? 1) * m).toFixed(3));
  return { ...spec, arch: t.arch ?? spec.arch, speed: k(spec.speed, t.speed), accel: k(spec.accel, t.accel), mass: k(spec.mass, t.mass), air: k(spec.air, t.air) };
}

/** A hand-built car with its tuning applied: mass through density, pull through torque. */
export function tunedDef(def: CarDef): CarDef {
  const t = TUNE[def.id];
  if (!t) return def;
  const m = t.mass ?? 1;
  return {
    ...def,
    archetype: t.arch ?? def.archetype,
    density: +(def.density * m).toFixed(3),
    motor: { ...def.motor, torque: +(def.motor.torque * m * (t.accel ?? 1)).toFixed(2), speed: +(def.motor.speed * (t.speed ?? 1)).toFixed(2) },
    air: def.air * (t.air ?? 1),
  };
}
