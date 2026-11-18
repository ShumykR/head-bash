import { withDrive } from './drive';
import type { Frame } from './factory';
import type { CarDef, CarPoly } from './types';
import { blob, bumper, circ, shoulders, ell, eyeball, flameDecal, grille, ladder, lightbar, path, poly, rect, rr, seat, seg, spare, spikesAlong, stack, starShape, stripe, tank } from './draw';
import { fenders, frontLamp, mirror, monsterChassis, pickup, rearLamp, sedan, tracks, tractor } from './skins';

/*
 * Skins for the hand-written original cars (src/cars/defs.ts). Their hulls stay
 * physics-only; these render-only shapes give each one a recognisable look.
 */

type Spec = { x0: number; x1: number; y0: number; y1: number; roof?: [number, number, number]; deck?: [number, number, number] };
/** Frame-like anchors for the template helpers. */
function fr(d: CarDef, s: Spec): Frame {
  const [rx0, rx1, ry] = s.roof ?? [s.x0, s.x1, s.y0];
  const [dx0, dx1, dy] = s.deck ?? [s.x0, s.x1, s.y0];
  return {
    arch: d.archetype, polys: [], windows: [], wheels: d.wheels, head: d.head,
    deck: { x0: dx0, x1: dx1, y: dy }, roof: { x0: rx0, x1: rx1, y: ry },
    nose: { x: s.x1, y0: s.y0, y1: s.y1 }, tail: { x: s.x0, y0: s.y0, y1: s.y1 },
  };
}

export const ORIGINAL_SKINS: Record<string, (d: CarDef) => CarPoly[]> = {
  sparrow: (d) => {
    return [
      ...spare(-1.66, -0.22, 0.24),
      blob([[-1.55, 0.38], [-1.6, -0.05], [-1.45, -0.52], [-0.75, -0.54], [-0.55, -0.3], [0.4, -0.32], [1.15, -0.28], [1.55, -0.04], [1.53, 0.38]], 'body', {}, 1),
      poly([[-1.52, -0.02], [1.55, 0.02], [1.55, 0.12], [-1.52, 0.1]], 'accent', { flat: true }),
      rr(-1.35, -0.4, -0.95, -0.2, 0.04, 'black'), ...[0, 1, 2].map((i) => rect(-1.3 + i * 0.12, -0.36, -1.25 + i * 0.12, -0.24, 'dark', { flat: true })),
      ...path([[-0.78, -0.52], [-0.64, -1.12], [0.16, -1.12], [0.52, -0.3]], 0.12, 'dark'), seg([-0.64, -1.12], [-0.2, -0.3], 0.09, 'dark'),
      ...[-0.45, -0.15].map((x) => circ(x, -1.22, 0.07, 'light')),
      poly([[0.32, -0.3], [0.64, -0.3], [0.44, -0.66], [0.32, -0.66]], 'glass'),
      ...seat(d.head.x + 0.05, -0.28, 0.42),
      rr(-1.64, -0.74, -1.05, -0.62, 0.03, 'accent'), seg([-1.3, -0.62], [-1.3, -0.52], 0.07, 'black'),
      ...path([[1.42, -0.22], [1.5, -0.14], [1.5, 0.22], [1.44, 0.34]], 0.1, 'chrome'),
      ...frontLamp(1.5, -0.1), rearLamp(-1.6, -0.12),
      circ(0.62, 0.0, 0.13, 'white'), rect(0.59, -0.08, 0.66, 0.08, 'black', { flat: true }),
      rr(-1.2, 0.3, 1.2, 0.4, 0.04, 'dark'),
      ...shoulders(d.head),
    ];
  },
  bulldog: (d) => {
    const f = fr(d, { x0: -1.6, x1: 1.5, y0: -0.3, y1: 0.38, roof: [-0.42, 0.38, -0.86], deck: [-1.6, -0.55, -0.3] });
    return [
      // roll bar with spot lamps over the bed (behind the driver)
      ...path([[-1.38, -0.3], [-1.32, -1.08], [-0.42, -1.08]], 0.11, 'black'),
      ...[-1.2, -0.95, -0.7].map((x) => [rr(x - 0.09, -1.28, x + 0.09, -1.12, 0.04, 'black'), circ(x, -1.2, 0.055, 'light')]).flat(),
      ...pickup(f), ...grille(1.38, -0.2, 1.5, 0.2, 2),
      rr(-1.62, -0.42, -0.5, -0.3, 0.03, 'dark'), ...[-1.4, -1.05, -0.7].map((x) => rect(x, -0.42, x + 0.04, -0.3, 'black', { flat: true })),
      ...path([[1.5, -0.26], [1.68, -0.2], [1.74, 0.1], [1.66, 0.36]], 0.12, 'chrome'), seg([1.55, 0.05], [1.74, 0.05], 0.08, 'chrome'),
      rr(-1.62, -0.55, -1.42, -0.28, 0.03, 'dark'), stripe(-1.6, 1.5, 0.06, 0.08, 'accent'),
      ...[-1.1, 1.1].map((x) => rect(x - 0.62, 0.3, x - 0.56, 0.62, 'black')),
      ...path([[-1.55, 0.36], [-1.75, 0.3]], 0.08, 'chrome'),
      ...shoulders(d.head),
    ];
  },
  zipper: (d) => {
    const f = fr(d, { x0: -1.65, x1: 1.72, y0: -0.26, y1: 0.28, roof: [-0.6, 0.12, -0.6] });
    return [
      ...sedan(f, { roof: 'coupe', top: -0.6, rx0: -0.75, rx1: 0.1, bumper: 'black', pin: null }),
      seg([-1.45, -0.24], [-1.5, -0.5], 0.08, 'black'), rr(-1.8, -0.64, -1.25, -0.5, 0.03, 'black'),
      ...[-0.06, 0.06].map((y) => stripe(-1.6, 1.65, y, 0.06, 'accent')),
      rr(0.6, -0.36, 1.05, -0.26, 0.04, 'black'), rect(0.66, -0.33, 0.99, -0.29, 'dark', { flat: true }),
      circ(-0.95, -0.06, 0.15, 'white'), rect(-0.98, -0.15, -0.91, 0.03, 'black', { flat: true }),
      ...shoulders(d.head),
    ];
  },
  mammoth: (d) => {
    const f = fr(d, { x0: -1.5, x1: 1.55, y0: -0.55, y1: 0.08, roof: [-0.25, 0.35, -1.27] });
    return [
      ...stack(-1.3, -0.5, 0.65, 0.11), ...stack(-1.08, -0.5, 0.55, 0.11),
      ...monsterChassis(f),
      rr(-0.9, 0.1, 0.9, 0.24, 0.04, 'grey'), ...[-0.6, -0.2, 0.2, 0.6].map((x) => circ(x, 0.17, 0.035, 'dark')),
      ...pickup(f),
      ...flameDecal(1.3, -0.4, -0.25, 0.3),
      ...path([[1.55, -0.42], [1.8, -0.36], [1.82, 0.04], [1.6, 0.1]], 0.13, 'chrome'), seg([1.58, -0.16], [1.82, -0.16], 0.09, 'chrome'),
      rr(-0.22, -1.4, 0.35, -1.29, 0.04, 'black'), ...[-0.08, 0.1, 0.28].map((x) => circ(x, -1.35, 0.05, 'light')),
      // The cab is open in front of the driver.
      { ...poly([[-0.15, -1.19], [0.35, -1.19], [0.35, -0.57], [-0.15, -0.57]]), cut: true },
      { ...poly([[0.35, -1.3], [1.15, -1.3], [1.15, -0.57], [0.35, -0.57]]), cut: true },
      ...shoulders(d.head),
    ];
  },
  pebble: (d) => {
    const f = fr(d, { x0: -0.92, x1: 0.94, y0: -0.2, y1: 0.26 });
    return [
      blob([[-0.9, 0.3], [-0.95, -0.1], [-0.75, -0.56], [-0.2, -0.62], [0.35, -0.56], [0.65, -0.22], [0.95, -0.06], [0.92, 0.3]], 'body', {}, 2),
      poly([[-0.7, -0.24], [-0.6, -0.5], [-0.3, -0.52], [-0.3, -0.24]], 'glass'), poly([[0.28, -0.24], [0.28, -0.5], [0.45, -0.48], [0.58, -0.24]], 'glass'),
      ...path([[-0.6, -0.56], [-0.58, -0.84], [0.1, -0.84]], 0.08, 'chrome'),
      rr(-0.55, -1.02, 0.12, -0.86, 0.04, 'accent'), ...[-0.4, -0.15].map((x) => rect(x, -1.02, x + 0.05, -0.86, 'pink', { flat: true })),
      stripe(-0.92, 0.92, 0.04, 0.07, 'white'),
      circ(0.83, -0.08, 0.1, 'chrome'), circ(0.83, -0.08, 0.065, 'light'),
      ...heart(0.0, 0.0, 0.12),
      bumper(0.7, 1.02, 0.24, 0.1), bumper(-1.02, -0.7, 0.24, 0.1),
      rearLamp(-0.94, -0.06, 0.12), ...fenders(f, 'body', 0.08),
      ...shoulders(d.head, { depth: 0.34 }),
    ];
  },
  longhorn: (d) => {
    const f = fr(d, { x0: -2.3, x1: 2.38, y0: -0.25, y1: 0.32, roof: [-2.2, 0.55, -0.75] });
    return [
      ...sedan(f, { roof: 'wagon', top: -0.75, rx1: 0.5, doors: 3, pin: null }),
      rr(-2.2, 0.0, 1.3, 0.24, 0.03, 'wood', { ring: true }), rect(-2.2, -0.02, 1.3, 0.02, 'tan', { flat: true }),
      ...[-2.0, -1.5, -0.9].map((x) => rr(x, -1.05, x + 0.4, -0.86, 0.04, 'brown')),
      rect(-2.15, -0.9, 0.3, -0.84, 'chrome'), ...[-2.1, -1.0, 0.25].map((x) => rect(x, -0.88, x + 0.05, -0.76, 'chrome')),
      ...grille(2.24, -0.14, 2.38, 0.16, 3),
      // a steer-skull hood ornament with a pair of longhorns, sized to the hood: thick at the
      // skull, tapering out sideways and curling up at the tips (the near horn reads in front)
      ...path([[1.72, -0.36], [1.45, -0.4], [1.25, -0.48]], 0.1, 'bone'), ...path([[1.25, -0.48], [1.12, -0.6], [1.12, -0.7]], 0.06, 'bone'),
      ...path([[1.78, -0.36], [2.08, -0.42], [2.3, -0.5]], 0.1, 'bone'), ...path([[2.3, -0.5], [2.44, -0.62], [2.46, -0.74]], 0.06, 'bone'),
      ...[1.12, 2.46].map((x) => circ(x, -0.75, 0.03, 'dark')),
      blob([[1.6, -0.42], [1.9, -0.42], [1.86, -0.28], [1.79, -0.18], [1.71, -0.18], [1.64, -0.28]], 'bone', {}, 1),
      circ(1.69, -0.34, 0.03, 'black'), circ(1.81, -0.34, 0.03, 'black'),
      ...shoulders(d.head),
    ];
  },
  digger: (d) => {
    const f = fr(d, { x0: -1.35, x1: 1.05, y0: -0.32, y1: 0.32, roof: [-1.0, -0.2, -0.95] });
    return [
      rr(-1.45, -0.38, 1.05, 0.38, 0.08, 'body'),
      rr(-1.62, -0.5, -1.3, 0.3, 0.05, 'dark'), ...[0, 1, 2, 3].map((i) => poly([[-1.6, -0.42 + i * 0.18], [-1.32, -0.5 + i * 0.18], [-1.32, -0.42 + i * 0.18], [-1.6, -0.34 + i * 0.18]], 'yellow', { flat: true })),
      rr(-1.08, -1.1, -0.1, -0.36, 0.06, 'body'), rect(-0.98, -0.98, -0.6, -0.5, 'glass'), rect(-0.55, -0.98, -0.22, -0.5, 'glass'),
      rr(-1.18, -1.18, 0.0, -1.06, 0.04, 'dark'), ...path([[-0.05, -0.4], [0.1, -0.9]], 0.06, 'chrome'),
      ...stack(-1.2, -0.38, 0.5, 0.1, 'black'),
      ...path([[0.0, -0.22], [0.75, -0.6], [1.22, -0.25]], 0.17, 'dark'), seg([0.25, -0.02], [0.92, -0.44], 0.09, 'chrome'), seg([0.25, -0.02], [0.6, -0.24], 0.13, 'grey'),
      ...[[0.0, -0.22], [0.75, -0.6], [1.22, -0.25]].map(([x, y]) => circ(x, y, 0.06, 'grey')),
      poly([[1.05, -0.4], [1.25, -0.42], [2.1, 0.2], [2.08, 0.34], [1.05, 0.34]], 'scoop'),
      ...[0, 1, 2, 3].map((i) => poly([[1.55 + i * 0.13, 0.32], [1.65 + i * 0.13, 0.32], [1.6 + i * 0.13, 0.44]], 'chrome')),
      ...[-1.2, -0.7, -0.2, 0.3, 0.8].map((x) => circ(x, -0.28, 0.03, 'dark')),
      stripe(-1.4, 1.0, 0.04, 0.08, 'accent'),
      ...fenders(f, 'dark', 0.12), ...beaconLeft(-0.6, -1.18), ...frontLamp(1.05, -0.2),
      ...shoulders(d.head),
    ];
  },
  rammer: (d) => [
    rr(-1.55, -0.34, 0.95, 0.42, 0.08, 'body'),
    blob([[-1.48, -0.32], [-1.42, -0.72], [-0.78, -0.74], [-0.68, -0.32]], 'body', {}, 1), rect(-1.32, -0.64, -0.84, -0.38, 'glass'), rect(-1.1, -0.64, -1.06, -0.38, 'dark', { flat: true }),
    ...stack(-0.45, -0.34, 0.42, 0.1), ...stack(-0.25, -0.34, 0.36, 0.1),
    rr(0.88, -1.0, 1.28, 0.42, 0.05, 'dark'), ...[0, 1, 2, 3, 4, 5, 6].map((i) => poly([[0.92, -0.9 + i * 0.2], [1.24, -1.0 + i * 0.2], [1.24, -0.92 + i * 0.2], [0.92, -0.82 + i * 0.2]], 'yellow', { flat: true })),
    poly([[1.26, -0.92], [2.5, -0.78], [3.04, -0.44], [2.5, -0.1], [1.26, 0.04]], 'grey'),
    ...[0, 1, 2].map((i) => poly([[1.5 + i * 0.4, -0.87 + i * 0.04], [1.65 + i * 0.4, -0.86 + i * 0.04], [1.85 + i * 0.4, -0.06 - i * 0.04], [1.7 + i * 0.4, -0.05 - i * 0.04]], 'dark', { flat: true })),
    ...[-0.8, -0.45, -0.1].map((y) => circ(1.38, y, 0.04, 'chrome')),
    stripe(-1.5, 0.9, 0.04, 0.1, 'accent'), ...spikesAlong(-0.6, 0.85, -0.32, 4, 0.14, 'spike'),
    ...frontLamp(0.95, -0.15), rearLamp(-1.55, -0.15),
    rr(-1.3, 0.34, 0.8, 0.44, 0.04, 'black'),
      ...shoulders(d.head),
  ],
  porcupine: (d) => [
    rr(-1.45, -0.32, 1.45, 0.4, 0.1, 'body'),
    poly([[0.32, -0.3], [0.82, -0.3], [0.52, -0.8], [0.32, -0.8]], 'glass'),
    ...spikesAlong(-1.4, 0.25, -0.3, 6, 0.32, 'spike'),
    ...spikesAlong(-1.35, 1.35, 0.42, 9, 0.12, 'spike', -1),
    rr(-0.06, -1.24, 0.6, -1.02, 0.05, 'chrome'), rect(0.36, -1.06, 0.54, -0.74, 'chrome'), circ(0.27, -1.13, 0.07, 'dark'),
    poly([[-0.02, -1.22], [0.24, -1.22], [0.11, -1.55]], 'spike'), poly([[0.28, -1.22], [0.56, -1.22], [0.42, -1.52]], 'spike'),
    poly([[1.4, -0.2], [1.4, 0.18], [1.95, -0.01]], 'spike'),
    stripe(-1.42, 1.42, 0.08, 0.1, 'accent'), ...grille(1.3, -0.06, 1.46, 0.24, 2), ...frontLamp(1.45, -0.18), rearLamp(-1.47, -0.15),
      ...shoulders(d.head),
  ],
  comet: (d) => {
    const f = fr(d, { x0: -1.3, x1: 1.6, y0: -0.24, y1: 0.3, roof: [-0.4, 0.2, -0.66] });
    return [
      poly([[-1.45, -0.55], [-2.0, -0.95], [-1.65, -0.95], [-1.15, -0.55]], 'accent'),
      tank(-2.05, -0.95, -0.36, 0.24, 'chrome'), rect(-1.7, -0.6, -1.62, -0.12, 'red', { flat: true }), rect(-1.35, -0.6, -1.27, -0.12, 'red', { flat: true }),
      rr(-2.18, -0.5, -1.98, -0.22, 0.04, 'dark'),
      ...sedan(f, { roof: 'coupe', top: -0.66, rx0: -0.5, rx1: 0.2, bumper: 'chrome', pin: null }),
      poly([[1.5, -0.02], [-1.25, -0.12], [-1.25, 0.08], [1.5, 0.08]], 'accent', { flat: true }),
      circ(0.95, -0.05, 0.14, 'white'), rect(0.92, -0.13, 0.98, 0.03, 'black', { flat: true }),
      ...shoulders(d.head),
    ];
  },
  stilts: (d) => [
    ...[-0.92, 0.92].map((x) => [rr(x - 0.13, 0.05, x + 0.13, 0.55, 0.04, 'dark'), rr(x - 0.08, 0.5, x + 0.08, 1.0, 0.03, 'chrome'), rr(x - 0.15, 0.48, x + 0.15, 0.56, 0.03, 'accent'), ...path([[x + 0.12, 0.1], [x + 0.22, 0.3], [x + 0.1, 0.5]], 0.05, 'black')]).flat(),
    rr(-1.15, 0.0, 1.15, 0.16, 0.04, 'black'),
    blob([[-1.22, 0.1], [-1.24, -0.35], [-1.15, -0.7], [-0.65, -0.72], [-0.55, -0.36], [0.35, -0.38], [0.85, -0.36], [1.24, -0.2], [1.24, 0.1]], 'body', {}, 1),
    poly([[0.35, -0.38], [0.72, -0.38], [0.5, -0.84], [0.35, -0.84]], 'glass'),
    rect(-1.1, -0.64, -0.7, -0.42, 'glass'),
    poly([[-1.2, -0.12], [1.2, -0.16], [1.2, -0.02], [-1.2, 0.02]], 'accent', { flat: true }),
    ...frontLamp(1.24, -0.24), rearLamp(-1.26, -0.2),
      ...shoulders(d.head),
  ],
  jelly: (d) => [
    // A wobbly jelly cube: a tall rounded block the rider sinks into, a glossy highlight,
    // a bubbly inside, a cheeky face on the front and drips running onto the wheels.
    blob([[-1.2, 0.28], [-1.28, -0.2], [-1.18, -0.92], [-0.6, -1.02], [0.1, -0.96], [0.75, -1.04], [1.2, -0.9], [1.3, -0.25], [1.22, 0.28]], 'body', {}, 2),
    blob([[-1.0, 0.12], [-1.06, -0.75], [1.04, -0.78], [1.06, 0.12]], 'glass', { flat: true }, 1),
    blob([[-0.95, 0.1], [-1.0, -0.6], [1.0, -0.62], [1.0, 0.1]], 'body', { flat: true }, 1),
    ...[[-0.75, -0.2, 0.09], [-0.45, 0.02, 0.06], [0.25, -0.35, 0.07], [0.55, 0.0, 0.05], [-0.2, -0.45, 0.05]].map(([x, y, r]) => circ(x, y, r, 'white', { flat: true })),
    rr(-1.1, -0.88, -0.5, -0.8, 0.04, 'white', { flat: true }), rr(-1.12, -0.74, -1.04, -0.35, 0.04, 'white', { flat: true }),
    ...eyeball(0.72, -0.48, 0.12, 'accent'), ...eyeball(1.02, -0.5, 0.09, 'accent'),
    blob([[0.68, -0.18], [1.1, -0.2], [0.92, -0.06]], 'dark', { flat: true }, 1),
    ...[-1.1, -0.5, 0.2, 0.8, 1.15].map((x, i) => path([[x, 0.2], [x + (i % 2 ? 0.05 : -0.05), 0.4], [x, 0.52]], 0.11, 'body')).flat(),
    ...[[-0.2, -1.25, 0.07], [0.2, -1.4, 0.05], [-0.5, -1.35, 0.04]].map(([x, y, r]) => circ(x, y, r, 'sky')),
    ...shoulders(d.head),
  ],
  tankette: (d) => {
    const f = fr(d, { x0: -1.5, x1: 1.5, y0: -0.3, y1: 0.22 });
    return [
      ...tracks(f),
      blob([[-1.6, 0.02], [-1.52, -0.34], [1.3, -0.36], [1.75, -0.12], [1.75, 0.08], [1.55, 0.05]], 'body', {}, 1),
      rr(-1.55, -0.22, 1.6, 0.02, 0.03, 'body', { ring: true }), ...[-1.3, -0.7, -0.1, 0.5, 1.1].map((x) => circ(x, -0.1, 0.035, 'dark')),
      blob([[-1.0, -0.32], [-0.92, -0.76], [0.1, -0.78], [0.22, -0.32]], 'body', {}, 1),
      rr(-0.8, -0.86, -0.3, -0.76, 0.04, 'dark'),
      ...path([[-0.1, -0.58], [0.95, -0.62]], 0.12, 'dark'), rr(0.9, -0.7, 1.2, -0.52, 0.03, 'black'),
      rect(0.95, -0.76, 1.18, -0.32, 'grey'),
      circ(-0.45, -0.52, 0.13, 'white'), starShape(-0.45, -0.52, 0.1, 'accent'),
      ...frontLamp(1.72, -0.06),
      ...shoulders(d.head),
    ];
  },
  hornet: (d) => {
    const f = fr(d, { x0: -1.5, x1: 1.45, y0: -0.24, y1: 0.25, roof: [-0.6, 0.05, -0.56] });
    return [
      blob([[-0.7, -0.5], [-1.55, -1.05], [-1.7, -0.8], [-0.9, -0.42]], 'sky', {}, 1), blob([[-0.6, -0.48], [-1.15, -1.15], [-0.85, -1.2], [-0.45, -0.5]], 'white', {}, 1),
      ...sedan(f, { roof: 'coupe', top: -0.56, rx0: -0.7, rx1: 0.05, bumper: 'black', pin: null }),
      ...[0, 1, 2, 3].map((i) => poly([[-1.35 + i * 0.5, -0.22], [-1.15 + i * 0.5, -0.22], [-1.3 + i * 0.5, 0.3], [-1.5 + i * 0.5, 0.3]], 'accent', { flat: true })),
      poly([[1.45, -0.1], [1.45, 0.16], [2.27, 0.04]], 'spike'), ...[1.6, 1.8].map((x) => rect(x, -0.05, x + 0.05, 0.12, 'black', { flat: true })),
      ell(1.2, -0.18, 0.13, 0.1, 'red'), ell(1.24, -0.2, 0.05, 0.04, 'white'),
      ...path([[1.05, -0.28], [1.25, -0.6], [1.45, -0.7]], 0.05, 'black'),
      seg([-1.35, -0.22], [-1.45, -0.45], 0.07, 'accent'), rr(-1.62, -0.58, -1.25, -0.46, 0.03, 'accent'),
      ...shoulders(d.head),
    ];
  },
  forklift: (d) => [
    rr(-1.15, -0.36, 0.82, 0.36, 0.08, 'body'),
    rr(-1.42, -0.46, -1.05, 0.34, 0.05, 'dark'), ...[0, 1, 2, 3].map((i) => poly([[-1.4, -0.36 + i * 0.18], [-1.07, -0.44 + i * 0.18], [-1.07, -0.36 + i * 0.18], [-1.4, -0.28 + i * 0.18]], 'yellow', { flat: true })),
    ...path([[-0.91, -0.34], [-0.91, -1.14], [0.36, -1.14], [0.42, -0.36]], 0.12, 'dark'), rr(-1.0, -1.22, 0.45, -1.1, 0.03, 'dark'),
    ...seat(-0.08, -0.34, 0.38),
    rr(0.78, -1.3, 0.98, 0.34, 0.03, 'dark'), rect(0.85, -1.3, 0.9, 0.34, 'grey', { flat: true }),
    ...path([[0.92, -1.25], [0.94, -0.2]], 0.04, 'chrome'),
    rr(0.95, -0.42, 1.1, 0.16, 0.03, 'grey'),
    poly([[1.0, -0.06], [1.95, 0.0], [1.95, 0.16], [1.0, 0.16]], 'chrome'),
    ...beaconLeft(-0.6, -1.22), stripe(-1.1, 0.8, 0.12, 0.08, 'accent'), ...frontLamp(0.82, -0.2),
      ...shoulders(d.head),
  ],
  hotrod: (d) => [
    blob([[-1.5, 0.3], [-1.56, -0.3], [-1.2, -0.36], [-0.3, -0.34], [0.5, -0.2], [1.6, -0.1], [1.64, 0.28]], 'body', {}, 1),
    ...seat(d.head.x + 0.05, -0.34, 0.42),
    poly([[-0.36, -0.34], [-0.12, -0.34], [-0.24, -0.76], [-0.34, -0.76]], 'glass'),
    rr(0.35, -0.42, 1.05, -0.16, 0.05, 'chrome'), rr(0.45, -0.66, 0.95, -0.42, 0.05, 'grey'), ...[0.5, 0.64, 0.78].map((x) => rect(x, -0.86, x + 0.1, -0.66, 'chrome')),
    ...[0.45, 0.65, 0.85].map((x) => path([[x, -0.16], [x - 0.08, 0.04], [x - 0.4, 0.14]], 0.07, 'chrome')).flat(),
    ...path([[0.0, 0.14], [-0.6, 0.18], [-1.6, 0.1]], 0.1, 'chrome'),
    ...flameDecal(1.45, 0.1, 0.0, 0.26), ...grille(1.48, -0.1, 1.64, 0.22, 3),
    ...frontLamp(1.62, -0.16), rearLamp(-1.56, -0.12),
      ...shoulders(d.head),
  ],
  tractor: (d) => {
    const f = fr(d, { x0: -1.0, x1: 1.5, y0: -0.4, y1: 0.2 });
    return [
      ...tractor(f, { cab: false }),
      rr(-1.06, -1.32, 0.18, -1.16, 0.04, 'accent'), rect(-0.04, -1.18, 0.08, -0.4, 'dark'), rect(-0.95, -1.18, -0.83, -0.35, 'dark'),
      ...shoulders(d.head),
    ];
  },
  bumper: (d) => [
    rr(-1.32, -0.28, 1.32, 0.6, 0.28, 'rubber'),
    rr(-1.22, -0.18, 1.22, -0.08, 0.04, 'grey', { flat: true }), rr(-1.2, 0.3, 1.2, 0.36, 0.03, 'grey', { flat: true }),
    blob([[-1.05, -0.14], [-1.0, -0.66], [-0.4, -0.72], [0.3, -0.44], [1.0, -0.46], [1.08, -0.14]], 'body', {}, 2),
    poly([[-0.95, -0.34], [1.0, -0.3], [1.0, -0.22], [-0.95, -0.26]], 'accent', { flat: true }),
    ...seat(-0.1, -0.34, 0.3, 'accent'),
    ...path([[-0.83, -0.44], [-0.83, -1.15]], 0.08, 'chrome'), circ(-0.83, -1.2, 0.09, 'yellow'), ...spikesAlong(-0.98, -0.68, -1.24, 2, 0.12, 'yellow'),
    starShape(0.6, -0.2, 0.13, 'gold'), ...frontLamp(1.08, -0.36, 0.1),
    ...shoulders(d.head),
  ],
  limo: (d) => {
    const f = fr(d, { x0: -2.4, x1: 2.45, y0: -0.25, y1: 0.3, roof: [-2.3, 0.6, -0.7] });
    return [
      ...sedan(f, { roof: 'sedan', top: -0.7, rx0: -2.2, rx1: 0.6, glass: 'glass', doors: 3, pin: 'gold' }),
      ...[-1.75, -1.2, -0.65, -0.1].map((x) => rect(x, -0.68, x + 0.07, -0.26, 'gold')),
      stripe(-2.4, 2.4, 0.08, 0.05, 'chrome'), ...grille(2.32, -0.14, 2.47, 0.16, 3), circ(2.2, -0.32, 0.05, 'gold'),
      seg([1.95, -0.3], [1.98, -0.6], 0.04, 'chrome'), poly([[1.98, -0.6], [2.25, -0.54], [1.98, -0.46]], 'accent'),
      ...shoulders(d.head),
    ];
  },
  jet: (d) => {
    const f = fr(d, { x0: -1.4, x1: 1.62, y0: -0.25, y1: 0.22, roof: [-0.5, 0.1, -0.6] });
    return [
      poly([[-0.4, -0.05], [-1.3, -0.95], [-0.9, -0.95], [0.3, -0.05]], 'accent'),
      tank(-2.1, -1.0, -0.42, 0.26, 'chrome'), rr(-1.65, -0.7, -1.4, -0.14, 0.04, 'body'),
      rr(-2.24, -0.6, -2.02, -0.24, 0.04, 'dark'),
      poly([[-1.6, -0.66], [-1.95, -1.05], [-1.55, -1.02], [-1.2, -0.66]], 'accent'),
      ...sedan(f, { roof: 'coupe', top: -0.6, rx0: -0.55, rx1: 0.1, bumper: 'chrome', pin: null }),
      poly([[1.55, -0.08], [-1.35, -0.16], [-1.35, 0.04], [1.55, 0.04]], 'accent', { flat: true }),
      circ(0.75, -0.02, 0.13, 'white'), rect(0.72, -0.1, 0.78, 0.06, 'black', { flat: true }),
      ...shoulders(d.head),
    ];
  },
  ladder: (d) => {
    const f = fr(d, { x0: -1.7, x1: 1.6, y0: -0.3, y1: 0.32, roof: [0.8, 1.6, -0.86] });
    return [
      rr(-1.74, -0.58, 0.85, 0.38, 0.06, 'body'),
      ...[-1.62, -0.88, -0.14].map((x) => [rect(x, -0.5, x + 0.64, -0.02, 'grey', { ring: true }), rect(x + 0.04, -0.3, x + 0.6, -0.26, 'chrome', { flat: true }), rect(x + 0.28, -0.24, x + 0.36, -0.18, 'dark', { flat: true })]).flat(),
      circ(-1.25, -0.82, 0.22, 'red'), circ(-1.25, -0.82, 0.1, 'chrome'),
      blob([[0.8, 0.38], [0.8, -0.9], [1.4, -0.9], [1.62, -0.35], [1.64, 0.38]], 'body', {}, 1),
      poly([[1.0, -0.36], [1.0, -0.78], [1.38, -0.78], [1.52, -0.36]], 'glass'), ...mirror(1.5, -0.3),
      rr(-0.95, -1.0, -0.75, -0.58, 0.03, 'dark'),
      ...ladder([-2.05, -1.1], [0.05, -1.1], 0.18, 'chrome'),
      ...lightbar(0.9, 1.45, -0.9, 'red', 'red'), stripe(-1.74, 1.62, 0.12, 0.1, 'white'),
      ...grille(1.5, -0.04, 1.64, 0.26, 3), ...frontLamp(1.64, -0.14), bumper(1.4, 1.75, 0.34, 0.12),
      circ(-0.5, -0.74, 0.12, 'gold'), ...fenders(f, 'dark', 0.1),
      ...shoulders(d.head),
    ];
  },
  wedge: (d) => [
    // Doorstop ram: a steep wedge that wraps the wheel tops, a red diagonal livery,
    // a race number, a tall rear wing and a chrome splitter on the nose.
    blob([[-1.52, 0.42], [-1.56, -0.55], [-0.9, -0.58], [1.92, 0.1], [1.95, 0.3], [1.8, 0.42]], 'body', {}, 1),
    poly([[-1.5, -0.1], [-1.0, -0.42], [1.9, 0.12], [1.9, 0.22]], 'accent', { flat: true }),
    poly([[-1.5, 0.12], [-1.5, 0.02], [1.9, 0.24], [1.9, 0.28]], 'accent', { flat: true }),
    poly([[0.6, -0.12], [1.95, 0.2], [1.95, 0.3], [0.6, -0.04]], 'chrome'),
    circ(0.0, -0.06, 0.15, 'white'), rect(-0.03, -0.15, 0.04, 0.03, 'black', { flat: true }),
    ...seat(-0.95, -0.52, 0.35, 'black'),
    poly([[-0.75, -0.52], [-0.4, -0.44], [-0.62, -0.78]], 'glass'),
    rr(1.72, 0.06, 1.92, 0.16, 0.03, 'light'), rr(-1.6, -0.3, -1.48, -0.12, 0.03, 'red'),
    rr(-1.3, 0.3, 1.5, 0.42, 0.04, 'dark'),
      ...shoulders(d.head),
  ],
};

const heart = (x: number, y: number, r: number): CarPoly[] => [circ(x - r * 0.5, y - r * 0.2, r * 0.55, 'red'), circ(x + r * 0.5, y - r * 0.2, r * 0.55, 'red'), poly([[x - r, y], [x + r, y], [x, y + r * 1.1]], 'red')];
const beaconLeft = (x: number, y: number): CarPoly[] => [rect(x - 0.12, y - 0.05, x + 0.12, y, 'dark'), blob([[x - 0.08, y - 0.04], [x - 0.08, y - 0.15], [x, y - 0.2], [x + 0.08, y - 0.15], [x + 0.08, y - 0.04]], 'orange', {}, 1)];

/** Hide the physics hull of an original car and draw its skin instead. */
export function skinOriginal(d: CarDef): CarDef {
  const skin = ORIGINAL_SKINS[d.id];
  if (!skin) return d;
  return withDrive({ ...d, body: [...d.body.map((p) => ({ ...p, hide: true })), ...skin(d).map((p) => ({ ...p, deco: true }))], windows: [], stripe: undefined });
}

