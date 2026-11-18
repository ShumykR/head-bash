import type { Frame } from './factory';
import type { CarMat, CarPoly, Pt } from './types';
import { arc, blob, circ, ell, eyeball, fangs, path, poly, rect, rr } from './draw';

/*
 * Animal anatomy for creature cars. The animal *is* the vehicle (as in hand-drawn arcade
 * sprites): its legs come down onto the wheels, which read as feet or paws; no chassis rail.
 * Everything is render-only and sized from the frame, so the physics stay as they were.
 */

/** Length / height scale of a creature frame (1 = default). */
export function dims(f: Frame) {
  const xs = f.wheels.map((w) => w.x);
  const L = Math.max(...xs) / 0.62;
  const H = (-0.2 - f.roof.y) / 0.42;
  const wy = Math.min(...f.wheels.map((w) => w.y));
  return { L, H, rear: Math.min(...xs), front: Math.max(...xs), wy, wr: f.wheels[0].r };
}

/** Saddle under the driver. */
export const saddle = (x: number, y: number, mat: CarMat = 'red', w = 0.55): CarPoly[] => [
  rr(x - w * 0.55, y - 0.06, x + w * 0.45, y + 0.08, 0.05, mat),
  rect(x - w * 0.55, y + 0.03, x + w * 0.45, y + 0.08, 'gold', { flat: true }),
];

export interface TheroOpts {
  mat?: CarMat;
  belly?: CarMat | null;
  /** Back stripes material (null = none). */
  stripes?: CarMat | null;
  /** Torso bulk (1 = tyrannosaur, 0.75 = raptor). */
  bulk?: number;
  /** Tail: length behind the rear wheel and how high its tip rides. */
  tail?: number;
  tailUp?: number;
  saddle?: CarMat | null;
}

/**
 * Two-legged dinosaur: barrel torso leaning forward, the big hind leg on the front wheel,
 * the tail root resting on the rear wheel and the tail swept back. Draw the head after it.
 */
export function theropod(f: Frame, o: TheroOpts = {}): CarPoly[] {
  const { L, H } = dims(f);
  const m = o.mat ?? 'body', b = o.bulk ?? 1;
  const X = (x: number) => x * L, Y = (y: number) => -0.2 + (y + 0.2) * H;
  const T = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [X(x), Y(y)]);
  const tl = o.tail ?? 1, tu = o.tailUp ?? 0.35;
  const top = -0.62 - 0.22 * b;
  const out: CarPoly[] = [
    // tail swept back, carried by its root over the rear wheel
    blob(T([[-0.2, top + 0.1], [-0.95, top + 0.02], [-1.1 - 0.55 * tl, top - tu], [-1.25 - 0.55 * tl, top - tu - 0.06], [-1.0 - 0.3 * tl, top + 0.3], [-0.85, -0.3], [-0.25, -0.05]]), m, {}, 2),
    blob(T([[-0.3, -0.6], [-0.85, -0.45], [-0.88, 0.08], [-0.4, 0.1], [-0.15, -0.2]]), m, {}, 1),
    // torso
    blob(T([[-0.48, top + 0.05], [0.08, top - 0.08], [0.65, top - 0.05], [0.98, -0.62], [0.95, -0.25], [0.5, 0.05 * b], [-0.22, 0.08 * b], [-0.6, -0.25]]), m, {}, 2),
  ];
  if (o.stripes !== null) {
    const sm = o.stripes ?? 'dark';
    for (const x of [-1.25, -0.95, -0.65, -0.25, 0.1, 0.42]) {
      const y = x < -0.4 ? top - (x < -0.9 ? tu * 0.5 : 0.02) : top - 0.06;
      out.push(poly(T([[x - 0.09, y + 0.02], [x + 0.09, y], [x + 0.02, y + 0.22]]), sm, { flat: true }));
    }
  }
  if (o.belly !== null) out.push(...path(T([[0.95, -0.45], [0.75, -0.1], [0.35, 0.04 * b], [-0.25, 0.05 * b]]), 0.13, o.belly ?? 'accent'));
  // the big hind leg on the front wheel
  out.push(
    ell(X(0.36), Y(-0.22), 0.36 * L * (0.8 + 0.2 * b), 0.36 * H * (0.8 + 0.2 * b), m, { ring: true }, 18),
    blob(T([[0.43, -0.02], [0.72, 0.02], [0.74, 0.2], [0.5, 0.2]]), m, {}, 1),
  );
  if (o.saddle !== null) {
    const hx = f.head.x;
    out.push(...saddle(hx, f.head.y + 0.2, o.saddle ?? 'red'));
  }
  return out;
}

/** Tiny clawed arm at the chest. */
export const arm = (x: number, y: number, mat: CarMat = 'body'): CarPoly[] => [
  ...path([[x, y], [x + 0.18, y + 0.16], [x + 0.28, y + 0.12]], 0.09, mat),
  poly([[x + 0.26, y + 0.08], [x + 0.36, y + 0.12], [x + 0.28, y + 0.18]], 'bone'),
];

export interface QuadOpts {
  mat?: CarMat;
  belly?: CarMat | null;
  /** Back height above the default body top (m). */
  hump?: number;
  /** Where the hump peaks (-1 rear … 1 front). */
  peak?: number;
  /** Tail length and lift (0 = none). */
  tail?: number;
  tailUp?: number;
  tailMat?: CarMat;
  /** Leg thickness. */
  leg?: number;
  saddle?: CarMat | null;
  /** Front end of the body (where the neck starts). */
  chest?: number;
}

/**
 * Four-legged animal: a body arched over both wheels with a thick leg down onto each
 * wheel (the wheel is the paw). Draw neck/head after it.
 */
export function quadruped(f: Frame, o: QuadOpts = {}): CarPoly[] {
  const { L, H, rear, front } = dims(f);
  const m = o.mat ?? 'body', hump = o.hump ?? 0, pk = o.peak ?? 0, lg = o.leg ?? 0.3;
  const top = -0.2 - 0.42 * H - hump;
  const ch = (o.chest ?? 1.0) * L;
  const out: CarPoly[] = [];
  const tl = o.tail ?? 0.7;
  if (tl > 0) {
    const tu = o.tailUp ?? 0.15, tx = -1.0 * L;
    out.push(blob([[tx + 0.3, top + 0.2], [tx - tl * 0.5, top + 0.18 - tu * 0.5], [tx - tl, top + 0.1 - tu], [tx - tl * 0.55, top + 0.32 - tu * 0.5], [tx + 0.25, -0.15]], o.tailMat ?? m, {}, 1));
  }
  // legs onto the wheels
  for (const x of [rear, front]) {
    out.push(blob([[x - lg * 0.6, -0.3], [x + lg * 0.6, -0.3], [x + lg * 0.42, 0.34], [x - lg * 0.42, 0.34]], m, { ring: true }, 1));
    out.push(rect(x - lg * 0.42, 0.22, x + lg * 0.42, 0.34, 'dark', { flat: true }));
  }
  const px = pk * 0.7 * L;
  out.push(blob([[-1.08 * L, -0.28], [-1.0 * L, top + 0.3 + hump * 0.3], [-0.75 * L, top + 0.08 + hump * 0.15], [px - 0.45, top - 0.02], [px, top - 0.06], [px + 0.45, top - 0.02], [ch - 0.25, top + 0.12 + hump * 0.35], [ch, -0.35], [front - 0.1, -0.02], [rear + 0.1, -0.02]], m, {}, 2));
  if (o.belly !== null) out.push(blob([[rear + 0.15, -0.16], [front - 0.15, -0.16], [front - 0.2, -0.03], [rear + 0.2, -0.03]], o.belly ?? 'accent', {}, 1));
  if (o.saddle !== null) out.push(...saddle(f.head.x, f.head.y + 0.2, o.saddle ?? 'red'));
  return out;
}

/** Eye with a heavy brow. */
export const browEye = (x: number, y: number, r = 0.08, iris: CarMat = 'black', brow: CarMat = 'dark'): CarPoly[] => [
  ...eyeball(x, y, r, iris), poly([[x - r * 1.4, y - r * 1.5], [x + r * 1.6, y - r * 1.3], [x + r * 0.2, y - r * 0.6]], brow),
];

/** Open mouth: dark gap with teeth from both jaws. */
export const maw = (x0: number, x1: number, y: number, h = 0.1, n = 4): CarPoly[] => [
  poly([[x0, y - h * 0.4], [x1, y - h * 0.5], [x1 - 0.05, y + h * 0.5], [x0 + 0.05, y + h * 0.4]], 'black', { flat: true }),
  ...fangs(x0 + 0.06, x1 - 0.02, y - h * 0.45, n, h * 0.9),
  ...fangs(x0 + 0.12, x1 - 0.08, y + h * 0.45, n - 1, h * 0.8, true),
];
export { circ };

export interface FishOpts {
  belly?: CarMat;
  fin?: CarMat;
  /** Mouth style: a shark's toothy grin under the snout, or a piranha's underbite. */
  jaw?: 'shark' | 'piranha';
  /** How far the body rises over the wheels (m). */
  top?: number;
}

/**
 * Fish-shaped car on a low two-wheel frame: pointed snout, mouth, eye, gills, white belly,
 * dorsal fin behind the rider and a crescent tail fin. The rider sits in an open cockpit.
 */
export function fishCar(f: Frame, o: FishOpts = {}): CarPoly[] {
  const x0 = f.tail.x, x1 = f.nose.x, top = o.top ?? -0.5, bot = 0.18, fin = o.fin ?? 'body';
  const hx = f.head.x;
  const out: CarPoly[] = [
    // crescent tail fin and the dorsal fin behind the rider
    poly([[x0 + 0.25, -0.15], [x0 - 0.35, -0.85], [x0 - 0.15, -0.15], [x0 - 0.35, 0.45], [x0 + 0.25, 0.05]], fin),
    poly([[hx - 0.75, top + 0.05], [hx - 0.55, top - 0.55], [hx - 0.35, top - 0.6], [hx - 0.25, top + 0.05]], fin),
    // body: tapering to the tail, thick at the head, snout over the mouth
    blob([[x0 + 0.1, -0.08], [x0 + 0.3, -0.3], [hx - 0.5, top + 0.02], [hx + 0.6, top - 0.02], [x1 - 0.5, top + 0.12], [x1, -0.08], [x1 + 0.05, 0.05], [x1 - 0.25, bot], [x0 + 0.4, bot - 0.02], [x0 + 0.1, 0.05]], 'body', {}, 2),
    blob([[x0 + 0.3, 0.02], [hx, 0.0], [x1 - 0.5, 0.0], [x1 - 0.25, bot - 0.02], [x0 + 0.4, bot]], o.belly ?? 'white', {}, 1),
    // pectoral fin and gill slits
    poly([[hx + 0.35, 0.02], [hx + 0.75, 0.05], [hx + 0.25, 0.32]], fin),
    ...[0, 1, 2].map((i) => rect(x1 - 0.95 + i * 0.1, top + 0.25, x1 - 0.92 + i * 0.1, top + 0.45, 'dark', { flat: true })),
    // cockpit rim around the rider
    rr(hx - 0.35, top - 0.04, hx + 0.35, top + 0.06, 0.03, 'dark'),
  ];
  if ((o.jaw ?? 'shark') === 'shark') {
    out.push(poly([[x1 - 0.75, -0.12], [x1 - 0.05, -0.2], [x1 - 0.12, 0.02], [x1 - 0.7, -0.0]], 'black', { flat: true }));
    out.push(...fangs(x1 - 0.72, x1 - 0.08, -0.15, 5, 0.1), ...fangs(x1 - 0.66, x1 - 0.16, -0.0, 4, 0.09, true));
  } else {
    out.push(poly([[x1 - 0.6, -0.12], [x1 + 0.08, -0.15], [x1 + 0.05, 0.12], [x1 - 0.55, 0.06]], 'black', { flat: true }));
    out.push(...fangs(x1 - 0.55, x1 + 0.0, -0.13, 4, 0.1), ...fangs(x1 - 0.5, x1 + 0.04, 0.1, 4, 0.12, true));
  }
  out.push(...browEye(x1 - 0.55, top + 0.25, 0.07));
  return out;
}

/** A crab-style pincer drawn over the 'claw' part (same footprint): domed upper finger, hooked lower one, teeth. */
export function pincer(f: Frame, ny: number, mat: CarMat = 'body', tip: CarMat = 'accent'): CarPoly[] {
  const n = f.nose;
  return [
    ...path([[n.x - 0.15, (n.y0 + ny) / 2], [n.x + 0.15, (n.y0 + ny) / 2 - 0.1]], 0.22, mat),
    blob([[n.x + 0.05, n.y0 - 0.05], [n.x + 0.45, n.y0 - 0.72], [n.x + 1.1, n.y0 - 0.72], [n.x + 1.45, n.y0 - 0.32], [n.x + 1.0, ny - 0.15], [n.x + 0.2, ny]], mat, {}, 2),
    blob([[n.x, ny - 0.04], [n.x + 1.3, ny - 0.04], [n.x + 0.95, ny + 0.2], [n.x, ny + 0.14]], tip, {}, 1),
    ...fangs(n.x + 0.35, n.x + 1.15, ny - 0.12, 4, 0.08),
    ell(n.x + 0.7, n.y0 - 0.5, 0.18, 0.06, 'white', { flat: true }),
  ];
}

/**
 * A galloping horse (or reindeer) seen from the side, facing right, hooves on the ground line g.
 * Used for animals that pull a vehicle (chariot horse, Santa's reindeer): pure art, no physics.
 */
export function steed(x: number, g: number, o: { mat?: CarMat; mane?: CarMat; deer?: boolean; nose?: CarMat; s?: number; phase?: number } = {}): CarPoly[] {
  const s = o.s ?? 1, m = o.mat ?? 'brown', mn = o.mane ?? 'dark', ph = o.phase ?? 0;
  const P = (dx: number, dy: number): Pt => [x + dx * s, g + dy * s];
  // A leg swings from the hip as the car rolls (a trot: the diagonal pairs move together).
  const leg = (pts: Pt[], phase: number) => {
    const gait = { at: pts[0], amp: 26, phase: (ph + phase) % 1 };
    const [hx, hy] = pts[pts.length - 1];
    return [...path(pts, 0.085 * s, m, { gait }), rect(hx - 0.05 * s, hy - 0.05 * s, hx + 0.05 * s, hy + 0.02 * s, 'black', { gait })];
  };
  const out: CarPoly[] = [
    // far legs and the tail
    ...leg([P(-0.28, -0.6), P(-0.34, -0.3), P(-0.3, 0)], 0),
    ...leg([P(0.28, -0.6), P(0.32, -0.3), P(0.28, 0)], 0.5),
    ...path([P(-0.4, -0.72), P(-0.62, -0.6), P(-0.7, -0.42)], 0.09 * s, mn),
    // near legs, then the body over their tops
    ...leg([P(-0.25, -0.55), P(-0.2, -0.28), P(-0.26, 0)], 0.5),
    ...leg([P(0.26, -0.55), P(0.3, -0.28), P(0.24, 0)], 0),
    ell(P(0, -0.66)[0], P(0, -0.66)[1], 0.44 * s, 0.2 * s, m),
    // neck and head
    ...path([P(0.28, -0.7), P(0.42, -0.92), P(0.5, -1.02)], 0.17 * s, m),
    blob([P(0.4, -1.12), P(0.58, -1.12), P(0.8, -0.95), P(0.78, -0.86), P(0.55, -0.9), P(0.42, -0.98)], m, {}, 1),
    poly([P(0.44, -1.1), P(0.48, -1.24), P(0.53, -1.1)], m),
    circ(P(0.58, -1.03)[0], P(0.58, -1.03)[1], 0.03 * s, 'black'),
  ];
  if (o.deer) {
    // antlers, a white chest and a glowing nose
    out.push(...path([P(0.46, -1.12), P(0.38, -1.4), P(0.24, -1.5)], 0.04 * s, 'tan'), ...path([P(0.4, -1.32), P(0.5, -1.45)], 0.035 * s, 'tan'));
    out.push(...path([P(0.52, -1.12), P(0.56, -1.38), P(0.68, -1.46)], 0.04 * s, 'tan'));
    out.push(ell(P(0.36, -0.62)[0], P(0.36, -0.62)[1], 0.1 * s, 0.12 * s, 'cream'));
    if (o.nose) out.push(circ(P(0.8, -0.92)[0], P(0.8, -0.92)[1], 0.05 * s, o.nose));
  } else {
    out.push(...path([P(0.3, -0.78), P(0.4, -0.98), P(0.48, -1.12)], 0.07 * s, mn));
  }
  return out;
}

export interface CrewOpts {
  /** Helmet shell, visor, crown stripe (null = none) and suit materials. */
  helm?: CarMat; visor?: CarMat; stripe?: CarMat | null; suit?: CarMat;
  /** Helmet styled for the car: a SWAT visor band, a porter's conical brim, prison stripes, a sun peak. */
  style?: 'race' | 'swat' | 'conical' | 'stripes' | 'peak';
  /** Draw the suit under the helmet (false: only the helmet pokes out). */
  body?: boolean;
  /** Turn the whole figure about the helmet centre (radians, y down), e.g. lying on its back. */
  rot?: number;
}

/**
 * A crew member drawn the way the player is: a full-face racing helmet (round shell, wide dark
 * visor with a glint, a stripe over the crown, a chin vent) on a racing suit with the arm
 * reaching forward and a black glove. Faces +x; (x, y) is the helmet centre, r its radius.
 * Every person on a car is one of these, with the helmet styled for that car.
 */
export function crew(x: number, y: number, r: number, o: CrewOpts = {}): CarPoly[] {
  const helm = o.helm ?? 'body', suit = o.suit ?? 'black', st = o.style ?? 'race';
  const out: CarPoly[] = [];
  if (o.body !== false) {
    out.push(
      rr(x - 0.8 * r, y + 0.55 * r, x + 0.7 * r, y + 2.1 * r, 0.3 * r, suit),
      rr(x - 0.35 * r, y + 0.55 * r, x + 0.3 * r, y + 0.85 * r, 0.1 * r, helm, { flat: true }),
      rect(x - 0.55 * r, y + 0.9 * r, x - 0.4 * r, y + 2.0 * r, helm, { flat: true }),
      ...path([[x + 0.05 * r, y + 1.0 * r], [x + 0.75 * r, y + 1.55 * r], [x + 1.05 * r, y + 1.4 * r]], 0.32 * r, helm),
      circ(x + 1.1 * r, y + 1.38 * r, 0.2 * r, 'black'),
    );
  }
  // egg-shaped shell, a pale band down the back
  out.push(ell(x, y, r * 0.95, r * 1.02, helm), arc(x, y, r * 0.75, Math.PI * 0.75, Math.PI * 1.3, r * 0.22, 'white', { flat: true }));
  const band = st === 'stripes' ? 'white' : o.stripe === undefined ? 'white' : o.stripe;
  if (st === 'stripes') {
    // prison stripes round the shell
    for (const v of [-0.62, -0.05, 0.5]) out.push(rect(x - Math.sqrt(1 - v * v) * r * 0.95, y + (v - 0.13) * r, x + Math.sqrt(1 - v * v) * r * 0.95, y + (v + 0.13) * r, 'black', { flat: true }));
  } else if (band && st !== 'swat') out.push(arc(x, y, r * 0.8, Math.PI * 1.25, Math.PI * 1.75, r * 0.28, band, { flat: true }));
  // the visor slanting across the upper front (as on the player's helmet), a lilac glint on its edge
  out.push(
    poly([[x + 0.05 * r, y - 0.1 * r], [x + 0.55 * r, y - 0.62 * r], [x + 0.92 * r, y - 0.42 * r], [x + 0.95 * r, y + 0.1 * r], [x + 0.55 * r, y + 0.3 * r], [x + 0.2 * r, y + 0.15 * r]], o.visor ?? 'black'),
    arc(x, y, r * 0.95, -Math.PI * 0.2, Math.PI * 0.05, r * 0.14, 'purple', { flat: true }),
  );
  if (st === 'swat') out.push(rect(x - 0.95 * r, y - 0.08 * r, x + 0.04 * r, y + 0.1 * r, 'black', { flat: true }), rr(x - 0.75 * r, y - 0.85 * r, x - 0.1 * r, y - 0.6 * r, 0.1 * r, 'white', { flat: true }));
  if (st === 'conical') out.push(poly([[x - 1.45 * r, y - 0.55 * r], [x + 1.45 * r, y - 0.55 * r], [x + 0.1 * r, y - 1.45 * r]], 'gold'), rect(x - 1.45 * r, y - 0.62 * r, x + 1.45 * r, y - 0.5 * r, 'brown', { flat: true }));
  if (st === 'peak') out.push(poly([[x + 0.2 * r, y - 0.62 * r], [x + 1.45 * r, y - 0.5 * r], [x + 1.3 * r, y - 0.38 * r], [x + 0.2 * r, y - 0.42 * r]], o.stripe ?? 'white'));
  if (!o.rot) return out;
  const c = Math.cos(o.rot), s = Math.sin(o.rot);
  return out.map((p) => ({ ...p, pts: p.pts.map(([px, py]) => [+(x + (px - x) * c - (py - y) * s).toFixed(3), +(y + (px - x) * s + (py - y) * c).toFixed(3)] as Pt) }));
}

export interface DragonHeadOpts {
  /** Scaly skull and lower jaw. */
  mat?: CarMat;
  snout?: CarMat;
  /** Long fronds of the mane streaming back (two alternating colours) and the spikes among them. */
  mane?: [CarMat, CarMat];
  spikes?: CarMat;
  /** How far back the mane streams (1 = a full head length). */
  maneLen?: number;
  horn?: CarMat;
  /** Curling whiskers off the snout (null = none). */
  whiskers?: CarMat | null;
  /** Facing -x. */
  flip?: boolean;
}

/**
 * An eastern dragon's head, after a temple dragon but kept simple and friendly: facing +x, drawn
 * round its jaw hinge (x, y), sized k (1 ≈ 1.2 m from mane to nose). A gold skull with a green
 * brow tuft, an orange snout with a red nose knob, a calm almond eye, a black horn curling back,
 * jaws a little open on a few white teeth, a short gold whisker and a few mane fronds.
 */
export function dragonHead(x: number, y: number, k = 1, o: DragonHeadOpts = {}): CarPoly[] {
  const m = o.mat ?? 'gold', [m1, m2] = o.mane ?? ['green', 'teal'], sp = o.spikes ?? 'red';
  const sx = o.flip ? -1 : 1;
  const at = (a: number, b: number): Pt => [x + a * k * sx, y + b * k];
  const P = (pts: Pt[]): Pt[] => pts.map(([a, b]) => at(a, b));
  const teeth = (x0: number, x1: number, yy: number, n: number, h: number, up = false) => {
    const [a, b] = o.flip ? [at(x1, 0)[0], at(x0, 0)[0]] : [at(x0, 0)[0], at(x1, 0)[0]];
    return fangs(a, b, y + yy * k, n, h * k, up);
  };
  const out: CarPoly[] = [];
  // the mane: a few fronds streaming back, alternating colours, a red spike between two of them
  const ml = o.maneLen ?? 0.6;
  const fronds: [Pt, Pt][] = [[[0.05, -0.3], [-0.95, -0.62]], [[0.0, -0.1], [-1.1, -0.2]], [[0.05, 0.1], [-0.95, 0.3]], [[0.15, 0.28], [-0.5, 0.6]]];
  fronds.forEach(([[bx, by], [tx0, ty0]], i) => {
    const tx = bx + (tx0 - bx) * ml, ty = by + (ty0 - by) * ml;
    if (i === 1) out.push(poly(P([[bx + 0.1, by - 0.1], [bx + 0.1, by + 0.1], [bx + (tx - bx) * 0.7, by + 0.04]]), sp));
    out.push(poly(P([[bx, by - 0.09], [bx + 0.05, by + 0.09], [tx, ty]]), i % 2 ? m2 : m1));
  });
  // the horn curling back
  out.push(...path(P([[0.3, -0.34], [0.12, -0.62], [-0.18, -0.72]]), 0.1 * k, o.horn ?? 'black'));
  // the skull, the green brow tuft, the orange snout with its red nose knob
  out.push(blob(P([[-0.1, -0.25], [0.2, -0.44], [0.6, -0.4], [0.88, -0.26], [0.98, -0.1], [0.4, -0.04], [0.0, 0.02]]), m, {}, 1));
  out.push(blob(P([[0.18, -0.4], [0.45, -0.5], [0.66, -0.38], [0.38, -0.33]]), m1, {}, 1));
  out.push(blob(P([[0.76, -0.3], [1.1, -0.26], [1.2, -0.1], [0.82, -0.04]]), o.snout ?? 'orange', {}, 1));
  out.push(circ(...at(1.1, -0.21), 0.065 * k, 'red'));
  // a calm almond eye under the tuft: no white showing round it
  out.push(ell(...at(0.58, -0.24), 0.085 * k, 0.05 * k, 'black', { flat: true }), circ(...at(0.6, -0.255), 0.022 * k, 'white', { flat: true }));
  // the mouth open just enough for the fire: a row of white teeth, the lower jaw
  out.push(poly(P([[0.2, -0.02], [1.18, -0.05], [1.05, 0.16], [0.25, 0.12]]), 'black', { flat: true }));
  out.push(...teeth(0.45, 1.12, -0.03, 3, 0.1));
  out.push(blob(P([[0.1, 0.12], [1.02, 0.15], [0.98, 0.27], [0.2, 0.26]]), m, {}, 1));
  // the whisker curling up off the snout
  if (o.whiskers !== null) out.push(...path(P([[1.1, -0.14], [1.3, -0.32], [1.22, -0.52]]), 0.055 * k, o.whiskers ?? 'gold'));
  return out;
}
