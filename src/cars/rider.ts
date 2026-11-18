import { circ, path, rr, seg } from './draw';
import type { CarDef, CarMat, CarPalette, CarPoly, Gait, Pt, RiderDef } from './types';

/*
 * The driver's body: a small racing suit under the big helmet, on purpose much too small for it
 * (the helmet is what the eye should find first, the body only says "someone sits here").
 * Drawn as car polygons, so it goes through the same rasterizer as the cars (outline, shading),
 * in a palette of its own: sleeves and stripe in the player's colour, a dark suit, black gloves
 * and boots. Crew on the cars (porters, coachmen) are the same figure in the car's colours.
 * Faces +x; y down; sizes scale with the head radius (0.26 m is the standard driver).
 */

export interface FigureOpts {
  pose: 'sit' | 'ride' | 'stand';
  hand?: Pt;
  foot?: Pt;
  /** Standing figures: y of the ground under the boots. */
  ground?: number;
  /** Standing figures: stride swing (degrees) and phase of the near leg; the far leg runs half a step behind. */
  walk?: { amp: number; phase?: number };
  /** Hips this far behind the shoulders (default: a little when riding). */
  lean?: number;
  suit?: CarMat; legs?: CarMat; sleeve?: CarMat; glove?: CarMat; boot?: CarMat; stripe?: CarMat;
}

const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const len = (v: Pt) => Math.hypot(v[0], v[1]);
/** Point at most `max` from a towards b. */
function reach(a: Pt, b: Pt, max: number): Pt {
  const d = sub(b, a), l = len(d);
  if (l <= max || l < 1e-6) return b;
  return [a[0] + (d[0] / l) * max, a[1] + (d[1] / l) * max];
}
/** Knee of a two-bone leg from hip to foot, bending forward (+x). */
function knee(h: Pt, f: Pt, l1: number, l2: number): Pt {
  const d = sub(f, h), l = Math.max(1e-6, Math.min(len(d), l1 + l2 - 1e-3));
  const a = (l1 * l1 - l2 * l2 + l * l) / (2 * l), k = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = d[0] / len(d), uy = d[1] / len(d);
  // the side of the hip→foot line that points forward and up
  const n1: Pt = [-uy, ux], n2: Pt = [uy, -ux];
  const n = n1[0] - n1[1] * 0.3 > n2[0] - n2[1] * 0.3 ? n1 : n2;
  return [h[0] + ux * a + n[0] * k, h[1] + uy * a + n[1] * k];
}

/** The figure under a helmet centred at (x, y) with radius r. */
export function figure(x: number, y: number, r: number, o: FigureOpts): CarPoly[] {
  const u = r / 0.26;
  const suit = o.suit ?? 'body', legs = o.legs ?? 'dark', sleeve = o.sleeve ?? 'body', glove = o.glove ?? 'black', boot = o.boot ?? 'black', stripe = o.stripe ?? 'accent';
  const out: CarPoly[] = [];
  const lean = (o.lean ?? (o.pose === 'ride' ? 0.08 : 0)) * u;
  const neck: Pt = [x - 0.02 * u, y + 0.26 * u];
  const drop = o.pose === 'ride' ? Math.sqrt(Math.max(0.01, 0.27 * 0.27 - (lean / u) * (lean / u) * 0.6)) : 0.31;
  const hip: Pt = [neck[0] - 0.04 * u - lean, neck[1] + drop * u];
  const lw = 0.13 * u, aw = 0.11 * u;
  const leg = (h: Pt, k: Pt, f: Pt, g?: Gait): CarPoly[] => {
    const x0 = g ? { gait: g } : {};
    return [
      ...path([h, k, f], lw, legs, x0),
      rr(f[0] - 0.06 * u, f[1] - 0.06 * u, f[0] + 0.13 * u, f[1] + 0.05 * u, 0.03 * u, boot, x0),
    ];
  };
  // legs first: the far one, then the near one; the body sits over their tops
  if (o.pose === 'stand') {
    const g = o.ground ?? hip[1] + 0.5 * u;
    const foot: Pt = [hip[0] + 0.02 * u, g - 0.045 * u];
    const kn: Pt = [hip[0] + 0.03 * u, (hip[1] + foot[1]) / 2];
    const amp = o.walk?.amp ?? 0, ph = o.walk?.phase ?? 0;
    const far = amp ? { at: hip, amp, phase: (ph + 0.5) % 1 } : undefined;
    const near = amp ? { at: hip, amp, phase: ph } : undefined;
    out.push(...leg(hip, kn, foot, far).map((p) => ({ ...p, mat: p.mat === legs ? ('black' as CarMat) : p.mat })));
    out.push(...leg(hip, kn, foot, near));
  } else {
    const foot = o.foot ?? [hip[0] + 0.3 * u, hip[1] + 0.2 * u];
    const f = reach(hip, foot, 0.47 * u);
    out.push(...leg(hip, o.foot ? knee(hip, f, 0.24 * u, 0.24 * u) : [hip[0] + 0.25 * u, hip[1] - 0.01 * u], f));
  }
  // the torso: rounded shoulders, a little narrower at the hips, a stripe down the side
  const sh = 0.14 * u, hp = 0.12 * u;
  // (a capsule from the shoulders to the hips, so it holds its shape at any lean)
  const tw = sh + hp;
  out.push(seg(neck, hip, tw, suit), circ(neck[0], neck[1] + 0.02 * u, tw / 2, suit), circ(hip[0], hip[1], hp, suit));
  out.push(seg([neck[0] - 0.02 * u, neck[1] + 0.06 * u], [hip[0] - 0.02 * u, hip[1] - 0.03 * u], 0.06 * u, stripe, { flat: true }));
  // a dark belt where the suit meets the legs
  out.push(seg([hip[0] - hp, hip[1] - 0.02 * u], [hip[0] + hp, hip[1] - 0.03 * u], 0.05 * u, legs, { flat: true }));
  // the arm reaching forward and the glove
  const shoulder: Pt = [neck[0] + 0.02 * u, neck[1] + 0.07 * u];
  const hand = reach(shoulder, o.hand ?? [shoulder[0] + 0.26 * u, shoulder[1] + 0.13 * u], 0.4 * u);
  out.push(seg(shoulder, hand, aw, sleeve), circ(shoulder[0], shoulder[1], aw / 2, sleeve));
  out.push(circ(hand[0], hand[1], 0.07 * u, glove));
  return out;
}

/** Default rider: seated, arm forward to the wheel. */
export const SEATED: RiderDef = { pose: 'sit' };

/** The player's driver body (render only), car-local. */
export function riderPolys(def: CarDef): CarPoly[] {
  const rd = def.rider ?? SEATED;
  return figure(def.head.x, def.head.y, def.head.r, { pose: rd.pose, hand: rd.hand, foot: rd.foot, lean: rd.lean }).map((p) => ({ ...p, deco: true }));
}

/** Palette the driver body is drawn in: the player's colour on the sleeves and stripe, a dark suit. */
export function riderColors(playerColor: string): CarPalette {
  return { body: playerColor, accent: '#f4f6fc', dark: '#3a3c52', glass: '#8fe0ff', light: '#fff2a8' };
}
