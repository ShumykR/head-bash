import { blob, circ, ell, path, poly, rect, rr, seg, spikesAlong, stack, stripe, shoulders } from '../draw';
import { arc, bike, hover, robot, rocket, tracks } from '../skins';
import type { CarPoly, Pt } from '../types';
import type { Frame, LinkSpec } from '../factory';
import { saddle } from '../critters';
import { group, o } from './util';

const visor = (x0: number, x1: number, y: number, mat: 'red' | 'accent' | 'light' = 'red'): CarPoly[] => [rr(x0, y - 0.08, x1, y + 0.08, 0.06, mat), rect(x0 + 0.05, y - 0.04, x1 - 0.05, y - 0.01, 'white', { flat: true })];
const bolts = (xs: number[], y: number): CarPoly[] => xs.map((x) => circ(x, y, 0.04, 'chrome'));
function trackedBase(f: Frame): CarPoly[] {
  const a = f.wheels[0], b = f.wheels[f.wheels.length - 1];
  const y = a.y - a.r - 0.06;
  return [
    ...tracks(f), blob([[a.x - a.r - 0.15, y + 0.04], [a.x - a.r - 0.05, y - 0.35], [b.x + b.r - 0.3, y - 0.38], [b.x + b.r + 0.15, y - 0.06], [b.x + b.r, y + 0.04]], 'body', {}, 1),
    rr(a.x - a.r - 0.1, y - 0.06, b.x + b.r + 0.05, y + 0.12, 0.04, 'body', { ring: true }), ...bolts([a.x - a.r + 0.1, (a.x + b.x) / 2, b.x + b.r - 0.1], y + 0.03),
  ];
}

/**
 * One blade of the Steel Crab's shears, hinged on the claw's bolt at (sx, sy): a narrow heel, broad
 * in the middle, drawn out to a needle point; the cutting edge (facing the other blade) yellow with
 * black teeth. `bolt` also draws the steel bolt over it (on the blade drawn last).
 */
function crabBlade(sx: number, sy: number, side: 1 | -1, ang: number, len: number, w: number, off: number, bolt: boolean): LinkSpec {
  const ux = Math.sin(ang) * side, uy = -Math.cos(ang), nx = -uy, ny = ux;
  const at = (a: number, b: number): Pt => [sx + ux * a + nx * (b + off), sy + uy * a + ny * (b + off)];
  const inner = ang > 0.2 ? -side : side;
  const tip = at(len, 0);
  const kite = [at(0.05, -w * 0.25), at(len * 0.5, -w), tip, at(len * 0.5, w), at(0.05, w * 0.25)];
  return {
    at: [sx, sy], swing: [-12, 12], spring: 30, density: 0.12,
    hit: [poly(kite)],
    art: [
      poly(kite, 'body'),
      // the cutting half is bare steel, so the blade stands out against the red shell
      poly([at(0.12, inner * w * 0.2), at(len * 0.5, inner * w * 0.95), tip, at(len * 0.5, 0)], 'chrome'),
      seg(at(len * 0.18, inner * w * 0.55), tip, 0.08, 'accent'),
      ...[0.32, 0.46, 0.6, 0.74].map((k) => circ(...at(len * k, inner * w * (k < 0.5 ? 0.62 + (k - 0.3) * 0.6 : (1 - k) * 1.5)), 0.04, 'black', { flat: true })),
      ...(bolt ? [circ(sx, sy, 0.22, 'grey'), circ(sx, sy, 0.15, 'chrome'), seg([sx - 0.09, sy - 0.09], [sx + 0.09, sy + 0.09], 0.05, 'dark'), seg([sx - 0.09, sy + 0.09], [sx + 0.09, sy - 0.09], 0.05, 'dark')] : []),
    ],
  };
}

export const ROBO = group('robo', [
  ['tentabot', 'Tentabot', 'Робот зі щупальцем-гарпуном: хапає суперника й тягне.', 'robot', ['#7a3ae0', '#5ef0ff'], {
    gun: (f) => ({ at: [[f.roof.x1 + 0.6, f.roof.y + 0.45]], aim: 8 }),
    parts: ['tentacles'], hideParts: true,
    skin: (f) => [
      ...[0, 1, 2].map((i) => path([[f.tail.x + 0.3, f.roof.y + 0.5 + i * 0.15], [f.tail.x - 0.2, f.roof.y + 0.7 + i * 0.25], [f.tail.x - 0.45, f.roof.y + 0.55 + i * 0.35]], 0.1, 'accent')).flat(),
      ...robot(f, { arms: false }),
      circ(0.05, f.roof.y + 0.36, 0.14, 'accent'), circ(0.08, f.roof.y + 0.36, 0.06, 'white'),
      ...path([[f.roof.x1, f.roof.y + 0.5], [f.roof.x1 + 0.4, f.roof.y + 0.65], [f.roof.x1 + 0.55, f.roof.y + 0.45]], 0.12, 'accent'),
      stripe(-0.5, 0.5, -0.3, 0.06, 'accent'), ...[[-1.0, -0.75], [-1.1, -0.45]].map(([x, y]) => circ(x, y, 0.05, 'white')),
      ...shoulders(f.head),
    ],
  }],
  ['hexabot', 'Hexabot', 'Шестиногий шагохід на гусеницях-лапах.', 'tracked', ['#a0a8b8', '#e02a2a'], {
    o: o({ wheels: 6 }), parts: ['antenna'], hideParts: true,
    skin: (f) => [
      ...f.wheels.map((w) => path([[w.x * 0.45, -0.35], [w.x * 0.8 + (w.x < 0 ? -0.15 : 0.15), -1.0], [w.x, w.y]], 0.11, 'grey')).flat(),
      ...f.wheels.map((w) => circ(w.x * 0.8 + (w.x < 0 ? -0.15 : 0.15), -1.0, 0.07, 'accent')),
      blob([[-1.6, 0.0], [-1.4, -0.55], [0.8, -0.6], [1.6, -0.25], [1.5, 0.05]], 'body', {}, 2),
      ...bolts([-1.2, -0.7, -0.2, 0.3, 0.8], -0.15),
      blob([[1.1, -0.45], [1.55, -0.45], [1.7, -0.15], [1.2, -0.05]], 'dark', {}, 1), ...visor(1.25, 1.6, -0.28),
      ...path([[-1.2, -0.55], [-1.3, -1.0]], 0.04, 'grey'), circ(-1.3, -1.05, 0.06, 'red'),
      stripe(-1.5, 1.2, -0.38, 0.06, 'accent'), rr(-0.9, -0.62, -0.3, -0.52, 0.03, 'dark'), rr(-0.1, -0.64, 0.5, -0.54, 0.03, 'dark'),
      ...shoulders(f.head),
    ],
  }],
  ['doom-bot', 'Doom Bot', 'Важкий бойовий андроїд із лазерними очима.', 'robot', ['#3a3a4a', '#e02a2a'], {
    gun: (f) => ({ at: [[0.45, f.roof.y + 0.32]], aim: 4 }),
    o: o({ tall: 1.1 }), parts: ['antenna'], hideParts: true,
    skin: (f) => [
      ...robot(f, { face: 'dark' }),
      ...shoulders(f.head),
      poly([[-0.4, f.roof.y + 0.25], [-0.05, f.roof.y + 0.33], [-0.05, f.roof.y + 0.43], [-0.4, f.roof.y + 0.38]], 'red'),
      poly([[0.4, f.roof.y + 0.25], [0.05, f.roof.y + 0.33], [0.05, f.roof.y + 0.43], [0.4, f.roof.y + 0.38]], 'red'),
      ...[-0.3, -0.1, 0.1, 0.3].map((x) => poly([[x - 0.06, -0.55], [x + 0.06, -0.55], [x + 0.1, -0.2], [x - 0.02, -0.2]], 'yellow', { flat: true })),
      ...spikesAlong(-0.55, 0.55, f.roof.y, 4, 0.18, 'spike'),
      ...[-0.75, 0.75].map((x) => rr(x - 0.12, -0.5, x + 0.12, -0.3, 0.04, 'red')),
    ],
  }],
  ['rocket-fist', 'Rocket Fist', 'Ракетний кулак: короткий корпус-ракета з кулаком на носі, що врізається з блискавичного ривка.', 'rocket', ['#e02a2a', '#ffd23f'], {
    // short and stubby: a booster, a cockpit and the fist, nothing more
    o: o({ len: 0.7 }), parts: ['booster', 'ram'], hideParts: true,
    skin: (f) => [
      ...rocket(f, { nose: 'body', glass: false }),
      blob([[f.nose.x - 0.75, -0.42], [f.nose.x - 0.1, -0.45], [f.nose.x + 0.25, -0.2], [f.nose.x + 0.25, 0.25], [f.nose.x - 0.1, 0.42], [f.nose.x - 0.75, 0.38]], 'body', {}, 1),
      ...[-0.3, -0.1, 0.1, 0.3].map((y) => rr(f.nose.x - 0.25, y - 0.09, f.nose.x + 0.25, y + 0.09, 0.07, 'body', { ring: true })),
      rr(f.nose.x - 0.7, -0.6, f.nose.x - 0.35, -0.3, 0.08, 'body', { ring: true }),
      rr(f.nose.x - 0.95, -0.36, f.nose.x - 0.75, 0.36, 0.04, 'accent'),
      ...[-1.0, -0.6, -0.2].map((x) => circ(x, -0.15, 0.04, 'chrome')), stripe(f.tail.x + 0.2, f.nose.x - 1.0, 0.1, 0.06, 'accent'),
      rr(f.tail.x + 0.3, 0.26, f.nose.x - 1.0, 0.38, 0.04, 'dark'),
      ...shoulders(f.head),
    ],
  }],
  ['hovercar', 'Hovercar', 'Антигравітаційний седан без коліс-видимих: просто ширяє.', 'hover', ['#3a8ad8', '#ffffff'], {
    glide: 0.34,
    skin: (f) => [...hover(f, { glow: 'sky' }), rr(f.tail.x + 0.5, 0.26, f.nose.x - 0.6, 0.34, 0.04, 'light'), stripe(f.tail.x, f.nose.x - 0.1, -0.12, 0.06, 'accent'), rect(-0.3, -0.3, -0.26, 0.1, 'dark', { flat: true }), rect(-0.2, -0.12, -0.08, -0.08, 'chrome', { flat: true }), ...shoulders(f.head)],
  }],
  ['brass-bike', 'Brass Bike', 'Стімпанк-байк із латуні: шестерні, клепки й труба.', 'bike', ['#c8902a', '#5a3a1a'], {
    axles: [0.8, 0.8],
    o: o({ mat: 'gold' }), parts: ['stack'], hideParts: true,
    skin: (f) => [
      ...bike(f, { mat: 'gold' }),
      ...stack(-0.55, -0.15, 0.6, 0.12, 'gold'),
      circ(-0.2, 0.05, 0.2, 'brown'), circ(-0.2, 0.05, 0.08, 'gold'), ...[0, 1, 2, 3, 4, 5].map((i) => circ(-0.2 + Math.cos(i * 1.05) * 0.22, 0.05 + Math.sin(i * 1.05) * 0.22, 0.04, 'brown')),
      circ(0.25, 0.0, 0.12, 'brown'), ...bolts([0.0, 0.2, 0.4], -0.22),
      ...path([[0.6, -0.4], [0.75, -0.6], [0.95, -0.55]], 0.06, 'gold'), ell(0.98, -0.52, 0.06, 0.1, 'gold'),
      // a big brass headlamp up front and a riveted boiler; the trail of smoke from the stack is animated (fx)
      rr(0.75, -0.48, 1.05, -0.2, 0.08, 'gold'), circ(1.02, -0.34, 0.11, 'light'), circ(1.02, -0.34, 0.06, 'white'),
      rr(-0.35, -0.42, 0.45, -0.2, 0.1, 'gold'), ...[-0.2, 0.05, 0.3].map((x) => circ(x, -0.31, 0.03, 'brown')),
    ],
    fx: () => [{ kind: 'smoke', at: [-0.55, -0.78], dir: -140, size: 0.2 }],
  }],
  ['laser-tank', 'Laser Tank', 'Футуристичний танк із лазерною гарматою.', 'tracked', ['#2a2a3a', '#5ef0ff'], {
    gun: () => ({ at: [[1.8, -0.93]], aim: 16 }),
    parts: [['cannon', 1.2]], hideParts: true,
    skin: (f) => [
      ...trackedBase(f),
      blob([[-0.8, -0.32], [-0.6, -0.75], [0.5, -0.75], [0.75, -0.32]], 'body', {}, 1),
      ...shoulders(f.head),
      ...path([[0.5, -0.55], [1.7, -0.9]], 0.16, 'grey'), ...[0.8, 1.1, 1.4].map((x) => ell(x, -0.64 - (x - 0.5) * 0.29, 0.06, 0.12, 'accent')),
      circ(1.75, -0.92, 0.09, 'accent'),
      stripe(-1.6, 1.6, -0.15, 0.06, 'accent'), rr(-0.4, -0.65, 0.2, -0.55, 0.04, 'accent'),
      rr(-0.6, -0.84, -0.2, -0.75, 0.04, 'dark'), ...[-0.5, -0.2, 0.1, 0.4].map((x) => circ(x, -0.4, 0.03, 'accent')),
    ],
  }],
  ['steel-crab', 'Steel Crab', 'Сталевий краб на чотирьох шипастих колесах: злі жовті очі, дві величезні розкриті клешні на болтах.', 'tracked', ['#e0301e', '#ffc81e'], {
    // After the reference: a round red shell with angry yellow eyes and a yellow mouth plate, thin
    // red legs down to four spiky wheels, and a huge open claw on a steel bolt at each side
    // (the front one is the real, solid claw).
    o: o({ len: 1.0, wheel: 1.05, rim: 'star' }), arch: 'ram', noLights: true, accel: 1.2,
    head: () => [-0.05, -1.3],
    // Each blade of both claws is a piece of its own, pinned on the claw's steel bolt and sprung:
    // they stand out from the shell and sway open and shut as the crab drives and bumps.
    links: () => [-1, 1].flatMap((side) => {
      const sx = side * 1.2, sy = -0.63;
      // the rear claw is for show (it would prop the crab up when it rolls over); the front one hits
      return [crabBlade(sx, sy, side as 1 | -1, 0.78, 1.5, 0.34, side * 0.06, false), crabBlade(sx, sy, side as 1 | -1, -0.2, 1.4, 0.32, -side * 0.06, true)].map((l) => (side < 0 ? { ...l, trim: true } : l));
    }),
    skin: (f) => {
      const sy = -0.55;
      return [
        // thin legs down to every wheel hub
        ...f.wheels.map((w) => seg([w.x * 0.45, sy + 0.2], [w.x, w.y - 0.05], 0.09, 'body')),
        // the round shell, a lighter crown, angry eyes under black brows, the yellow mouth plate
        ell(0, sy, 0.95, 0.56, 'body', {}, 28),
        ell(0, sy - 0.22, 0.6, 0.22, 'red', { flat: true }),
        ...[-1, 1].flatMap((d) => [
          poly([[d * 0.12, sy - 0.12], [d * 0.48, sy - 0.26], [d * 0.44, sy - 0.08], [d * 0.16, sy - 0.02]], 'accent'),
          poly([[d * 0.08, sy - 0.2], [d * 0.52, sy - 0.38], [d * 0.52, sy - 0.3], [d * 0.1, sy - 0.12]], 'black', { flat: true }),
        ]),
        rr(-0.3, sy + 0.12, 0.3, sy + 0.4, 0.07, 'accent', { ring: true }),
        rect(-0.24, sy + 0.24, 0.24, sy + 0.27, 'gold', { flat: true }),
        ...saddle(f.head.x, f.head.y + 0.22, 'accent'),
        ...shoulders(f.head),
      ];
    },
  }],
  ['sawbot', 'Sawbot', 'Робот-тесля з дисковою пилкою на руці.', 'robot', ['#5a5a6a', '#ffd23f'], {
    parts: ['saw'],
    skin: (f) => [
      ...robot(f),
      ...shoulders(f.head),
      ...visor(-0.35, 0.4, f.roof.y + 0.36, 'red'),
      ...[-0.4, -0.15, 0.1, 0.35].map((x) => poly([[x - 0.06, -0.55], [x + 0.06, -0.55], [x + 0.12, -0.2], [x, -0.2]], 'black', { flat: true })),
      rr(-0.45, -0.6, 0.45, -0.18, 0.04, 'accent', { ring: true }),
      ...[0, 1, 2, 3].map((i) => poly([[-0.42 + i * 0.22, -0.16], [-0.32 + i * 0.22, -0.16], [-0.24 + i * 0.22, -0.04], [-0.34 + i * 0.22, -0.04]], 'black', { flat: true })),
    ],
  }],
  ['tripod', 'Tripod', 'Триногий крокохід прибульців із тепловим променем.', 'robot', ['#c0c8d0', '#3a8ad8'], {
    o: o({ tall: 1.2 }), parts: ['antenna'], hideParts: true,
    skin: (f) => [
      ...path([[-0.3, -0.2], [-0.75, 0.0], [-0.95, 0.4]], 0.1, 'dark'), ...path([[0.3, -0.2], [0.75, 0.0], [0.95, 0.4]], 0.1, 'dark'), ...path([[0, -0.2], [0, 0.42]], 0.1, 'dark'),
      ell(0, f.roof.y + 0.55, 0.85, 0.5, 'body', {}, 24),
      ...shoulders(f.head),
      ell(0, f.roof.y + 0.25, 0.55, 0.3, 'glass', {}, 20),
      circ(0.55, f.roof.y + 0.65, 0.14, 'accent'), circ(0.6, f.roof.y + 0.65, 0.06, 'white'),
      stripe(-0.8, 0.8, f.roof.y + 0.8, 0.06, 'accent'),
      ...path([[-0.5, f.roof.y + 0.85], [-0.8, f.roof.y + 1.1]], 0.06, 'grey'),
      ...[-0.6, -0.2, 0.2].map((x) => circ(x, f.roof.y + 0.62, 0.04, 'chrome')), circ(0, -0.2, 0.12, 'grey'), circ(0, -0.2, 0.05, 'accent'),
    ],
  }],
  ['robo-bike', 'Robo Bike', 'Двоколісний дроїд-мотоцикл з одним оком-сенсором.', 'bike', ['#c0c8d0', '#e02a2a'], {
    axles: [0.8, 0.8],
    noLights: true,
    skin: (f) => [
      blob([[f.wheels[0].x - 0.1, 0.1], [-0.65, -0.35], [0.3, -0.35], [0.8, -0.05], [0.7, 0.2], [-0.2, 0.25]], 'body', {}, 2),
      circ(0.62, -0.08, 0.15, 'black'), circ(0.66, -0.08, 0.08, 'red'),
      stripe(-0.6, 0.4, -0.12, 0.06, 'accent'), poly([[-0.7, -0.25], [-0.5, -0.25], [-0.75, -0.55]], 'accent'),
      ...f.wheels.map((w) => arc(w.x, w.y, w.r + 0.08, Math.PI * 1.1, Math.PI * 1.9, 0.09, 'body')), ...bolts([-0.4, -0.1, 0.2], -0.25),
      ...f.wheels.map((w) => seg([w.x, w.y], [w.x * 0.6, 0.0], 0.08, 'dark')),
      // the droid's one big eye-sensor in a dark visor on the front fairing, an antenna on top
      blob([[0.25, -0.62], [0.85, -0.62], [1.05, -0.2], [0.85, 0.05], [0.35, 0.0]], 'dark', {}, 1),
      circ(0.66, -0.3, 0.3, 'black'), circ(0.69, -0.3, 0.21, 'red'), circ(0.74, -0.35, 0.08, 'light'),
      ...path([[-0.3, -0.35], [-0.35, -0.75]], 0.04, 'grey'), circ(-0.35, -0.78, 0.05, 'red'),
      ...[-0.45, -0.1, 0.2].map((x) => rect(x, -0.3, x + 0.02, 0.15, 'dark', { flat: true })),
    ],
  }],
]);
