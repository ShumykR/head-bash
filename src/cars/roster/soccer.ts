import { blob, circ, ell, path, poly, rect, rr, seg, stripe, shoulders } from '../draw';
import { tracks, truckCab, monsterTruck } from '../skins';
import type { CarPoly } from '../types';
import type { Frame } from '../factory';
import { group, o } from './util';

/** Football: white ball with black pentagons. */
function football(cx: number, cy: number, r: number): CarPoly[] {
  const pent = (x: number, y: number, s: number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i < 5; i++) pts.push([x + Math.cos(-Math.PI / 2 + i * 1.2566) * s, y + Math.sin(-Math.PI / 2 + i * 1.2566) * s]);
    return poly(pts, 'black', { flat: true });
  };
  const out: CarPoly[] = [circ(cx, cy, r, 'white')];
  out.push(pent(cx, cy, r * 0.28));
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + i * 1.2566;
    out.push(pent(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78, r * 0.2));
  }
  return out;
}
function tankBody(f: Frame): CarPoly[] {
  const a = f.wheels[0], b = f.wheels[f.wheels.length - 1];
  const y = a.y - a.r - 0.06;
  return [
    ...tracks(f), blob([[a.x - a.r - 0.15, y + 0.04], [a.x - a.r - 0.05, y - 0.38], [b.x + b.r - 0.35, y - 0.4], [b.x + b.r + 0.15, y - 0.06], [b.x + b.r, y + 0.04]], 'body', {}, 1),
    rr(a.x - a.r - 0.1, y - 0.06, b.x + b.r + 0.05, y + 0.12, 0.04, 'body', { ring: true }),
    ...[0, 1, 2, 3, 4].map((i) => circ(a.x - a.r + (i * (b.x - a.x + 2 * a.r)) / 4, y + 0.03, 0.03, 'dark')),
  ];
}
/** Striped football-pitch band. */
const pitch = (x0: number, x1: number, y: number): CarPoly[] => Array.from({ length: 8 }, (_, i) => rect(x0 + ((x1 - x0) * i) / 8, y - 0.06, x0 + ((x1 - x0) * (i + 1)) / 8, y + 0.06, i % 2 ? 'green' : 'leaf', { flat: true }));

export const SOCCER = group('soccer', [
  ['soccer-monster', 'Soccer Monster', 'Монстр-трак футбольної арени з вирячкуватими очима.', 'monster', ['#ffffff', '#2a2a2a'], {
    o: o({ open: true }),
    skin: (f) => {
      const x1 = f.nose.x;
      return [
        ...monsterTruck(f),
        ...shoulders(f.head),
        // football livery: black pentagons on white, a green pitch stripe
        ...[[-1.1, -0.35], [-0.45, -0.3], [0.85, -0.3], [0.1, -0.85]].map(([x, y]) => poly(Array.from({ length: 5 }, (_, i) => [x + Math.cos(i * 1.2566 - 1.57) * 0.13, y + Math.sin(i * 1.2566 - 1.57) * 0.13] as [number, number]), 'black', { flat: true })),
        stripe(f.tail.x + 0.05, x1 - 0.1, -0.12, 0.08, 'green'),
        // goal net stretched over the roll bar
        ...[0, 1, 2].map((i) => seg([f.tail.x + 0.15 + i * 0.2, -0.6], [f.tail.x + 0.15 + i * 0.2, f.roof.y], 0.03, 'white')),
        // bulging googly-eye headlights on the hood
        ell(x1 - 0.55, -0.66, 0.15, 0.17, 'white'), circ(x1 - 0.5, -0.64, 0.07, 'black'),
        ell(x1 - 0.25, -0.6, 0.12, 0.14, 'white'), circ(x1 - 0.21, -0.58, 0.06, 'black'),
      ];
    },
  }],
  ['soccer-ball', 'Soccer Ball', 'Футбольний м\'яч на шасі: пружинить і відскакує.', 'blob', ['#ffffff', '#2a2a2a'], {
    o: o({ mat: 'white' }), bounce: 0.5, noLights: true,
    skin: (f) => [...football(0, -0.35, 0.9), ell(-0.35, -0.85, 0.22, 0.1, 'white', { flat: true }), rr(-0.85, 0.12, 0.85, 0.3, 0.05, 'dark'), rr(-0.9, 0.08, -0.55, 0.2, 0.04, 'green'), rr(0.55, 0.08, 0.9, 0.2, 0.04, 'green'), ...shoulders(f.head)],
  }],
  ['soccer-delivery', 'Soccer Delivery Truck', 'Вантажівка з сіткою м\'ячів. М\'ячі розлітаються по арені.', 'truck', ['#3aa04a', '#ffffff'], {
    o: o({ wheels: 2 }), parts: ['net'], cargo: ['ball', 6], hideParts: true,
    skin: (f) => {
      const d = f.deck;
      return [
        ...truckCab(f),
        ...shoulders(f.head),
        rr(d.x0, d.y - 0.05, d.x1, d.y + 0.1, 0.03, 'white'),
        ...[d.x0, d.x1 - 0.08].map((x) => rect(x, d.y - 0.85, x + 0.08, d.y, 'white')), rect(d.x0, d.y - 0.9, d.x1, d.y - 0.82, 'white'),
        ...Array.from({ length: 9 }, (_, i) => seg([d.x0 + 0.08 + i * ((d.x1 - d.x0 - 0.16) / 8), d.y - 0.82], [d.x0 + 0.08 + i * ((d.x1 - d.x0 - 0.16) / 8), d.y], 0.03, 'grey', { flat: true })),
        ...Array.from({ length: 4 }, (_, i) => seg([d.x0 + 0.08, d.y - 0.18 - i * 0.18], [d.x1 - 0.08, d.y - 0.18 - i * 0.18], 0.03, 'grey', { flat: true })),
        stripe(f.tail.x, f.nose.x, 0.05, 0.07, 'white'),
        ...football((d.x0 + d.x1) / 2, d.y - 0.42, 0.16), rr(d.x0, d.y + 0.08, d.x1, d.y + 0.2, 0.03, 'dark'),
      ];
    },
  }],
  ['soccer-cannon', 'Soccer Cannon', 'Пневматична гармата для футбольних м\'ячів.', 'tracked', ['#3aa04a', '#ffffff'], {
    gun: () => ({ at: [[1.14, -1.22]], aim: 27 }),
    s: 0.9, parts: ['cannon'], hideParts: true,
    skin: (f) => [
      ...tankBody(f), ...pitch(-1.6, 1.6, -0.2),
      circ(0.0, -0.6, 0.3, 'body'), ...path([[0.0, -0.65], [1.0, -1.15]], 0.32, 'white'), ...path([[0.95, -1.12], [1.1, -1.2]], 0.42, 'grey'),
      ...shoulders(f.head),
      ...football(-0.95, -0.72, 0.22), rr(0.92, -1.26, 1.18, -1.08, 0.04, 'dark'),
    ],
  }],
  ['dual-soccer-cannon', 'Dual Soccer Cannon', 'Здвоєний футбольний міномет.', 'tracked', ['#2a6ae0', '#ffffff'], {
    gun: () => ({ at: [[1.48, -0.86], [1.33, -1.2]], aim: 20 }),
    parts: ['twincannon'], hideParts: true,
    skin: (f) => [
      ...tankBody(f), ...pitch(-1.6, 1.6, -0.2),
      rr(-0.3, -0.75, 0.5, -0.3, 0.1, 'body'),
      ...shoulders(f.head),
      ...path([[0.3, -0.48], [1.45, -0.85]], 0.2, 'white'), ...path([[0.2, -0.64], [1.3, -1.18]], 0.2, 'white'),
      ...football(-1.0, -0.65, 0.2), ...football(-0.6, -0.6, 0.16), rr(1.35, -0.95, 1.55, -0.77, 0.04, 'dark'), rr(1.2, -1.28, 1.4, -1.1, 0.04, 'dark'),
    ],
  }],
  ['soccer-shoe', 'Soccer Shoe', 'Бутса на роликах: шнурки, шипи і удар з розгону.', 'sports', ['#1a1a1a', '#ffffff'], {
    // A real boot silhouette on small roller wheels: tall ankle shaft around the rider, instep with laces sloping to the toe.
    o: o({ wheel: 0.75, len: 0.82 }), parts: ['hump'], noLights: true, hideParts: true, hideWheels: [0, 1],
    skin: (f) => {
      // a short heel: the boot ends just behind the ankle the rider sits in
      const g = f.wheels[0].y + f.wheels[0].r, sole = g - 0.5, hx = f.head.x, heel = Math.max(f.tail.x, hx - 0.8);
      const rollers = [0, 1, 2, 3].map((i) => heel + 0.3 + ((f.nose.x - 0.35 - heel - 0.3) * i) / 3);
      return [
        // the boot upper: heel counter and ankle collar behind and around the rider, instep down to a rounded toe
        blob([[heel + 0.15, sole], [heel - 0.02, sole - 0.2], [heel + 0.1, -0.42], [hx - 0.42, -0.5], [hx - 0.5, -1.02], [hx + 0.38, -1.02], [hx + 0.48, -0.62], [0.6, -0.5], [1.15, -0.38], [f.nose.x + 0.1, -0.3], [f.nose.x + 0.15, sole - 0.12], [f.nose.x - 0.1, sole]], 'body', {}, 2),
        ...shoulders(f.head),
        // padded collar and the dark opening the rider sits in
        rr(hx - 0.56, -1.12, hx + 0.44, -0.98, 0.07, 'accent'),
        // three stripes on the side, a red heel tab
        ...[0, 1, 2].map((i) => poly([[0.0 + i * 0.22, -0.52], [0.12 + i * 0.22, -0.5], [-0.12 + i * 0.22, sole - 0.04], [-0.24 + i * 0.22, sole - 0.04]], 'white', { flat: true })),
        rr(hx - 0.6, -0.95, hx - 0.46, -0.6, 0.04, 'red'), ell(heel + 0.3, -0.2, 0.16, 0.1, 'accent', { flat: true }),
        // laces criss-crossing the instep, eyelets along the edge
        ...[0, 1, 2, 3].flatMap((i) => {
          const x = hx + 0.45 + i * 0.2, y = -0.62 + i * 0.05;
          return [seg([x, y], [x + 0.18, y + 0.06], 0.045, 'white'), seg([x + 0.18, y], [x, y + 0.06], 0.045, 'white'), circ(x, y + 0.03, 0.03, 'chrome')];
        }),
        // thick white sole with screw-in studs
        blob([[heel - 0.05, sole - 0.06], [f.nose.x - 0.3, sole - 0.06], [f.nose.x + 0.15, sole - 0.2], [f.nose.x + 0.12, sole - 0.06], [f.nose.x - 0.25, sole + 0.12], [heel, sole + 0.12]], 'white', {}, 1),
        // roller-skate plate with four little wheels under the sole
        rr(heel + 0.1, sole + 0.1, f.nose.x - 0.25, sole + 0.2, 0.03, 'chrome'),
        ...rollers.map((x) => rect(x - 0.04, sole + 0.15, x + 0.04, g - 0.16, 'grey')),
        // the rollers turn as it rolls (each its own spinning piece)
        ...rollers.flatMap((x) => {
          const gait = { at: [x, g - 0.17] as [number, number], amp: 0, spin: 0.17 };
          return [circ(x, g - 0.17, 0.17, 'rubber', { gait }), circ(x, g - 0.17, 0.09, 'red', { gait }), seg([x - 0.08, g - 0.17], [x + 0.08, g - 0.17], 0.04, 'white', { gait, flat: true }), seg([x, g - 0.25], [x, g - 0.09], 0.04, 'white', { gait, flat: true }), circ(x, g - 0.17, 0.03, 'chrome', { gait })];
        }),
      ];
    },
  }],
]);

