import type { Frame } from './factory';
import type { CarMat, CarPoly, Pt } from './types';
import { blob, circ, ell, eyeball, fangs, path, poly, rect, rr } from './draw';

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
