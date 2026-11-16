import { tailgate } from '../art';
import { beacon, blob, lightbar, circ, ell, eyeball, headlight, path, poly, rect, rr, seg, starShape, stripe, tank, windows } from '../draw';
import { bike, boxy, fenders, rocket, sedan, tracks, truckCab } from '../skins';
import type { CarMat, CarPoly, Pt } from '../types';
import type { Frame } from '../factory';
import { quadruped, steed } from '../critters';
import { group, o } from './util';

const hidden = (p: CarPoly): CarPoly => ({ ...p, hide: true });

/** Sled runners with a curled front, joined to the body by struts. */
function runners(f: Frame, mat: CarMat = 'chrome', y = 0.2, struts = true): CarPoly[] {
  const x0 = f.tail.x - 0.05, x1 = f.nose.x - 0.35;
  const out = path([[x0 - 0.1, y - 0.08], [x0, y], [x1, y], [x1 + 0.3, y - 0.1], [x1 + 0.45, y - 0.32], [x1 + 0.38, y - 0.52], [x1 + 0.2, y - 0.55], [x1 + 0.12, y - 0.42]], 0.11, mat);
  if (struts) for (const x of [x0 + 0.35, (x0 + x1) / 2, x1 - 0.2]) out.push(seg([x, y], [x + 0.06, y - 0.2], 0.1, mat));
  return out;
}

/** Tracked hull sitting on a track loop. */
function trackedBody(f: Frame, mat: CarMat = 'body', h = 0.42): CarPoly[] {
  const a = f.wheels[0], b = f.wheels[f.wheels.length - 1];
  const y = a.y - a.r - 0.06;
  return [
    ...tracks(f),
    blob([[a.x - a.r - 0.15, y + 0.04], [a.x - a.r - 0.05, y - h], [b.x + b.r - 0.4, y - h], [b.x + b.r + 0.15, y - 0.06], [b.x + b.r, y + 0.04]], mat, {}, 1),
    // armour skirt over the top of the track, with rivets
    rr(a.x - a.r - 0.1, y - 0.06, b.x + b.r + 0.05, y + 0.12, 0.04, mat, { ring: true }),
    ...Array.from({ length: Math.max(3, Math.round((b.x - a.x) / 0.4)) + 1 }, (_, i) => circ(a.x - a.r + (i * (b.x - a.x + 2 * a.r)) / Math.max(3, Math.round((b.x - a.x) / 0.4)), y + 0.03, 0.03, 'dark')),
  ];
}

/** Snow cap on top of a span. */
const snowCap = (x0: number, x1: number, y: number, t = 0.12): CarPoly => blob([[x0 - 0.05, y + 0.02], [x0 + 0.05, y - t], [(x0 + x1) / 2, y - t * 1.3], [x1 - 0.05, y - t], [x1 + 0.05, y + 0.02]], 'white', {}, 1);

/** Icicles hanging below a line. */
const icicles = (x0: number, x1: number, y: number, n: number): CarPoly[] => {
  const w = (x1 - x0) / n;
  return Array.from({ length: n }, (_, i) => poly([[x0 + i * w, y], [x0 + (i + 0.8) * w, y], [x0 + (i + 0.4) * w, y + 0.12 + (i % 2) * 0.08]], 'sky'));
};

const ornaments = (cx: number, y: number): CarPoly[] => [
  circ(cx - 0.3, y - 0.3, 0.07, 'red'), circ(cx + 0.25, y - 0.5, 0.07, 'gold'), circ(cx - 0.1, y - 0.75, 0.06, 'white'),
  circ(cx + 0.15, y - 1.0, 0.06, 'red'), circ(cx - 0.35, y - 0.15, 0.06, 'blue'),
];
const fir = (cx: number, y: number, s = 1): CarPoly[] => [
  rect(cx - 0.08, y - 0.15, cx + 0.08, y, 'brown'),
  poly([[cx - 0.6 * s, y - 0.12], [cx + 0.6 * s, y - 0.12], [cx, y - 0.8 * s]], 'leaf'),
  poly([[cx - 0.47 * s, y - 0.55 * s], [cx + 0.47 * s, y - 0.55 * s], [cx, y - 1.15 * s]], 'leaf'),
  poly([[cx - 0.32 * s, y - 0.95 * s], [cx + 0.32 * s, y - 0.95 * s], [cx, y - 1.45 * s]], 'leaf'),
  starShape(cx, y - 1.5 * s, 0.13, 'gold'),
];

export const WINTER = group('winter', [
  ['snowmobile', 'Snowmobile', 'Снігохід на лижі з вітровим склом.', 'sled', ['#e02a4a', '#2a2a2a'], {
    parts: ['wing'], hideParts: true,
    skin: (f) => {
      const a = f.wheels[0];
      return [
        // Rear drive track down to the snow (the wheels are hidden under it).
        rr(f.tail.x - 0.05, a.y + a.r - 0.5, -0.1, a.y + a.r, 0.2, 'rubber'),
        ...[f.tail.x + 0.2, -0.65, -0.3].map((x) => circ(x, a.y + a.r - 0.25, 0.1, 'dark')),
        ...path([[0.3, 0.08], [f.nose.x - 0.1, 0.24], [f.nose.x + 0.15, 0.18], [f.nose.x + 0.25, 0.02]], 0.08, 'chrome'),
        seg([0.6, 0.0], [0.65, 0.22], 0.07, 'dark'),
        blob([[f.tail.x, 0.12], [f.tail.x - 0.02, -0.3], [-0.6, -0.3], [0.1, -0.4], [f.nose.x - 0.1, -0.2], [f.nose.x + 0.18, 0.04], [0.4, 0.14]], 'body', {}, 1),
        poly([[-0.2, -0.02], [f.nose.x + 0.05, 0.0], [f.nose.x - 0.05, 0.08], [-0.2, 0.08]], 'accent', { flat: true }),
        rr(-1.05, -0.44, -0.15, -0.3, 0.05, 'black'),
        blob([[0.2, -0.26], [0.45, -0.58], [0.6, -0.55], [0.55, -0.24]], 'glass', {}, 1),
        stripe(-1.2, 1.0, -0.06, 0.07, 'accent'),
        headlight(f.nose.x - 0.05, -0.04, 0.07),
        rr(f.tail.x - 0.1, -0.42, f.tail.x + 0.35, -0.3, 0.03, 'accent'),
      // track lugs and road wheels that read against the snow, and a tall windscreen
      ...Array.from({ length: 6 }, (_, i) => rect(f.tail.x + 0.05 + i * 0.17, a.y + a.r - 0.04, f.tail.x + 0.11 + i * 0.17, a.y + a.r + 0.03, 'rubber')),
      ...[f.tail.x + 0.2, -0.65, -0.3].map((x) => circ(x, a.y + a.r - 0.25, 0.06, 'grey')),
      blob([[0.25, -0.3], [0.45, -0.78], [0.7, -0.76], [0.62, -0.28]], 'glass', {}, 1),
      ];
    },
  }],
  ['spruce-delivery', 'Spruce Delivery', 'Вантажівка, що везе на свято живу ялинку з іграшками.', 'truck', ['#c02a2a', '#ffffff'], {
    o: o({ wheels: 2 }), parts: ['tree'], hideParts: true,
    skin: (f) => [
      ...truckCab(f),
      snowCap(f.roof.x0, f.nose.x - 0.3, f.roof.y),
      rr(f.deck.x0, f.deck.y - 0.25, f.deck.x1, f.deck.y + 0.1, 0.04, 'wood'),
      ...fir((f.deck.x0 + f.deck.x1) / 2, f.deck.y - 0.2),
      ...ornaments((f.deck.x0 + f.deck.x1) / 2, f.deck.y - 0.2),
      stripe(f.tail.x, f.nose.x, 0.08, 0.06, 'white'),
      ...Array.from({ length: 8 }, (_, i) => rect(f.deck.x0 + 0.05 + i * ((f.deck.x1 - f.deck.x0 - 0.1) / 8), f.deck.y - 0.2, f.deck.x0 + 0.05 + (i + 0.5) * ((f.deck.x1 - f.deck.x0 - 0.1) / 8), f.deck.y - 0.12, 'white', { flat: true })),
      rr(f.deck.x0, f.deck.y + 0.08, f.deck.x1, f.deck.y + 0.2, 0.03, 'black'),
    ],
  }],
  ['snowcat', 'Snowcat', 'Важкий гусеничний ратрак із відвалом і прожекторами.', 'tracked', ['#e04a2a', '#f0f0f0'], {
    o: o({ cab: true }), parts: ['plow'], hideParts: true,
    skin: (f) => [
      ...trackedBody(f, 'body', 0.3),
      rr(f.roof.x0 - 0.5, f.roof.y, f.roof.x1 + 0.5, -0.3, 0.08, 'body'),
      ...windows(f.roof.x0 - 0.42, f.roof.x0 - 0.06, f.roof.y + 0.1, -0.5, 1, 0.1),
      rr(f.roof.x0 - 0.45, f.roof.y - 0.13, f.roof.x1, f.roof.y, 0.04, 'dark'), ...[0.0, 0.3, 0.6, 0.9].map((x) => circ(f.roof.x0 - 0.3 + x, f.roof.y - 0.15, 0.06, 'light')),
      stripe(-1.6, 1.5, -0.25, 0.08, 'accent'),
      poly([[f.nose.x - 0.1, -0.35], [f.nose.x + 0.2, -0.4], [f.nose.x + 0.75, 0.22], [f.nose.x + 0.1, 0.3]], 'chrome'),
      seg([f.nose.x - 0.4, -0.1], [f.nose.x + 0.25, -0.05], 0.1, 'dark'),
      ...[0, 1, 2].map((i) => poly([[f.nose.x + 0.15 + i * 0.17, -0.3 + i * 0.18], [f.nose.x + 0.25 + i * 0.17, -0.32 + i * 0.18], [f.nose.x + 0.32 + i * 0.17, -0.2 + i * 0.18], [f.nose.x + 0.22 + i * 0.17, -0.18 + i * 0.18]], 'yellow', { flat: true })),
      ...beacon(f.roof.x1 - 0.1, f.roof.y - 0.13, 'orange', 0.14),
    ],
  }],
  ['kicksled', 'Kicksled', 'Фінські сани з довгою ручкою: штовхаєшся ногою і летиш.', 'sled', ['#c08a4a', '#e02a2a'], {
    s: 0.85, o: o({ mat: 'wood', len: 0.62 }), parts: ['seat'], noLights: true, hideParts: true,
    // A small kick-chair: a wooden seat with a backrest on two short runners, the push bar on the back.
    skin: (f) => {
      const x0 = f.tail.x, x1 = f.nose.x;
      return [
        ...path([[x0 - 0.05, 0.12], [x0 + 0.05, 0.2], [x1 - 0.2, 0.2], [x1 - 0.02, 0.1], [x1, -0.08], [x1 - 0.12, -0.14]], 0.08, 'chrome'),
        ...[x0 + 0.25, x1 - 0.4].map((x) => seg([x, 0.2], [x, -0.12], 0.08, 'wood')),
        // seat and backrest with a red cushion
        rr(x0 + 0.05, -0.2, x1 - 0.28, -0.04, 0.05, 'wood'), rr(x0 + 0.15, -0.3, x1 - 0.38, -0.18, 0.05, 'accent'),
        rr(x0 + 0.02, -0.75, x0 + 0.18, -0.08, 0.05, 'wood'), rr(x0 + 0.06, -0.68, x0 + 0.14, -0.32, 0.03, 'accent'),
        // push bar
        ...path([[x0 + 0.1, -0.7], [x0 - 0.05, -1.05], [x0 - 0.25, -1.08]], 0.07, 'wood'),
        rr(x0 - 0.35, -1.14, x0 - 0.12, -1.02, 0.04, 'black'),
      ];
    },
  }],
  ['snowman', 'Snowman', 'Сніговик на колесах: морквяний ніс, циліндр і сніжки напоготові.', 'blob', ['#f4f8ff', '#ff8a1a'], {
    gun: () => ({ at: [[0.98, -0.87]], aim: 25 }),
    o: o({ shape: 'snowman', mat: 'white' }), ballast: 0.15, noLights: true,
    skin: () => [
      circ(0, -0.2, 0.75, 'white'), circ(0.05, -1.05, 0.48, 'white'),
      ...path([[-0.5, -0.72], [-0.95, -1.05], [-1.1, -0.95]], 0.06, 'brown'), ...path([[0.55, -0.6], [0.95, -0.85]], 0.06, 'brown'),
      ...eyeball(0.2, -1.15, 0.07), ...eyeball(0.42, -1.12, 0.06),
      poly([[0.45, -1.02], [0.45, -0.92], [0.9, -0.97]], 'orange'),
      rr(-0.48, -0.74, 0.55, -0.6, 0.05, 'red'), rr(-0.48, -0.74, -0.32, -0.32, 0.05, 'red'),
      circ(0.35, -0.42, 0.06, 'black'), circ(0.4, -0.2, 0.06, 'black'), circ(0.4, 0.02, 0.06, 'black'),
      rr(-0.6, -0.75, -0.32, -0.38, 0.05, 'red'), rect(-0.6, -0.48, -0.32, -0.44, 'white', { flat: true }),
      rr(-0.8, 0.3, 0.8, 0.44, 0.05, 'dark'), poly([[-0.6, -0.35], [-0.35, -0.5], [-0.42, -0.25]], 'sky'),
    ],
  }],
  ['snowball-cannon', 'Snowball Cannon', 'Гусенична сніжкова гармата: б\'є точно в шолом.', 'tracked', ['#5a8ad8', '#ffffff'], {
    gun: () => ({ at: [[1.66, -1.11]], aim: 28 }),
    s: 0.9, parts: ['cannon'], hideParts: true,
    skin: (f) => [
      ...trackedBody(f),
      rr(-0.6, -0.72, 0.6, -0.3, 0.12, 'body'), circ(0.6, -0.55, 0.22, 'dark'),
      ...path([[0.6, -0.55], [1.55, -1.05]], 0.24, 'grey'), ...path([[1.45, -0.99], [1.6, -1.08]], 0.3, 'dark'),
      circ(f.tail.x + 0.4, -0.72, 0.15, 'white'), circ(f.tail.x + 0.7, -0.7, 0.13, 'white'), circ(f.tail.x + 0.55, -0.92, 0.12, 'white'),
      stripe(-1.6, 1.5, -0.2, 0.07, 'accent'),
      rr(-0.35, -0.82, 0.05, -0.72, 0.04, 'dark'), circ(-0.15, -0.5, 0.11, 'white'), starShape(-0.15, -0.5, 0.08, 'accent'),
      rr(1.42, -1.14, 1.66, -0.96, 0.04, 'black'),
    ],
  }],
  ['snowball-bike', 'Snowball Bike', 'Трицикл зі сніговою кулею за спиною.', 'trike', ['#3ab0e0', '#ffffff'], {
    parts: [['ball', 0.5]], hideParts: true,
    skin: (f) => [...bike(f, { style: 'scooter' }), circ(f.deck.x0 - 0.05, f.deck.y - 0.3, 0.4, 'white'), circ(f.deck.x0 + 0.05, f.deck.y - 0.42, 0.1, 'sky')],
  }],
  ['santa-sleigh', 'Santa\'s Sleigh', 'Літаючі сани Санти. Подарунки в кузові вилітають на віражах.', 'sled', ['#d02a2a', '#ffd23f'], {
    float: 0.8, cargo: ['gift', 3],
    // As in Drive Ahead, two reindeer pull the sleigh, on little wheels under their hooves. They are one
    // real piece, hitched to the sleigh's nose: you can hit them and they bump over the ground.
    links: () => {
      const g = 0.27 - 0.2, w = (x: number) => ({ x, y: g + 0.1, r: 0.1, rim: 'disc' as const, drive: false });
      return [{
        at: [1.45, -0.25], swing: [-12, 12], spring: 10, density: 0.25,
        wheels: [w(1.75), w(2.45), w(2.35), w(3.05)],
        hit: [rect(1.75, g - 0.78, 2.55, g - 0.42), rect(2.35, g - 0.74, 3.2, g - 0.42), rect(3.05, g - 1.1, 3.45, g - 0.8)],
        art: [
          ...steed(2.75, g, { mat: 'brown', deer: true, s: 0.95 }),
          ...path([[1.45, -0.3], [2.5, -0.65], [2.95, -0.72]], 0.035, 'gold'),
          ...steed(2.15, g + 0.02, { mat: 'brown', deer: true, nose: 'red', s: 1.0 }),
          ...path([[1.45, -0.25], [2.1, -0.6]], 0.035, 'gold'),
        ],
      }];
    },
    skin: () => [
      ...path([[-1.6, 0.12], [-1.55, 0.2], [1.15, 0.2], [1.45, 0.1], [1.6, -0.15], [1.52, -0.38], [1.32, -0.42], [1.24, -0.28]], 0.1, 'gold'),
      ...[-1.1, -0.2, 0.7].map((x) => seg([x, 0.2], [x + 0.05, 0.02], 0.08, 'gold')),
      blob([[-1.62, 0.06], [-1.66, -0.72], [-1.5, -0.98], [-1.25, -0.92], [-1.15, -0.55], [-0.95, -0.38], [0.05, -0.38], [0.55, -0.45], [0.95, -0.72], [1.2, -0.7], [1.22, -0.45], [0.95, 0.06]], 'body', {}, 2),
      stripe(-1.55, 1.0, -0.1, 0.12, 'gold'),
      ...[-1.0, -0.4, 0.2].map((x) => starShape(x, 0.0, 0.09, 'gold')),
      ...path([[-1.6, -0.9], [-1.4, -0.95], [-1.2, -0.85], [-1.0, -0.42], [0.05, -0.4], [0.55, -0.47], [0.95, -0.74], [1.18, -0.72]], 0.1, 'white'),
      circ(1.2, -0.72, 0.11, 'gold'),
      ...[[-1.55, -0.55], [1.05, -0.55]].map(([x, y]) => path([[x, y], [x + 0.1, y + 0.15], [x, y + 0.3], [x - 0.08, y + 0.2]], 0.05, 'gold')).flat(),
      ell(-1.2, -1.02, 0.3, 0.22, 'brown'), rect(-1.25, -1.26, -1.15, -1.2, 'gold'),
    ],
  }],
  ['gift-box', 'Gift Box', 'Подарункова коробка на колесах. Сюрприз: вона підскакує!', 'blob', ['#e02a4a', '#ffd23f'], {
    o: o({ shape: 'square' }), noLights: true,
    skin: (f) => [
      rect(-0.85, -1.15, 0.85, 0.2, 'body'), rect(-0.95, -1.3, 0.95, -1.1, 'body'),
      rect(-0.12, -1.3, 0.12, 0.2, 'accent'), rect(-0.95, -0.55, 0.95, -0.35, 'accent'),
      ell(-0.3, f.roof.y - 0.28, 0.28, 0.16, 'accent'), ell(0.3, f.roof.y - 0.28, 0.28, 0.16, 'accent'), circ(0, f.roof.y - 0.22, 0.12, 'gold'),
      poly([[-0.05, f.roof.y - 0.2], [-0.3, f.roof.y + 0.1], [-0.15, f.roof.y + 0.1]], 'accent'),
      ...[[-0.6, -0.9], [0.5, -0.85], [-0.55, -0.1], [0.55, -0.05], [0.0, -0.75]].map(([x, y]) => circ(x, y, 0.07, 'white')),
      rect(-0.12, -1.3, -0.05, 0.2, 'yellow', { flat: true }),
      rr(0.3, -0.3, 0.7, -0.05, 0.03, 'white'), seg([0.3, -0.18], [0.12, -0.4], 0.03, 'accent'),
      rr(-0.9, 0.12, 0.9, 0.3, 0.05, 'dark'),
    ],
  }],
  ['firework-truck', 'Firework Truck', 'Вантажівка з батареєю феєрверків. Стріляє петардами.', 'truck', ['#3a3ad8', '#ffd23f'], {
    gun: (f) => ({ at: [0, 1, 2, 3, 4].map((i) => [f.deck.x0 + 0.675 + i * 0.4, f.deck.y - 1.55 + i * 0.07]), aim: 72 }),
    parts: ['launcher'], hideParts: true,
    skin: (f) => {
      const d = f.deck;
      return [
        ...truckCab(f),
        rr(d.x0, d.y - 0.35, d.x1, d.y + 0.08, 0.04, 'dark'),
        poly([[d.x0 + 0.2, d.y - 0.3], [d.x1 - 0.2, d.y - 0.3], [d.x1 - 0.4, d.y - 0.95], [d.x0 + 0.5, d.y - 1.1]], 'grey'),
        ...[0, 1, 2, 3, 4].map((i) => rr(d.x0 + 0.55 + i * 0.4, d.y - 1.4 + i * 0.07, d.x0 + 0.8 + i * 0.4, d.y - 0.85 + i * 0.07, 0.05, (['red', 'yellow', 'green', 'pink', 'orange'] as CarMat[])[i])),
        ...[0, 1, 2, 3, 4].map((i) => poly([[d.x0 + 0.55 + i * 0.4, d.y - 1.4 + i * 0.07], [d.x0 + 0.8 + i * 0.4, d.y - 1.4 + i * 0.07], [d.x0 + 0.675 + i * 0.4, d.y - 1.6 + i * 0.07]], 'white')),
        starShape(-0.2, 0.05, 0.12), starShape(0.4, 0.08, 0.09),
        rect(d.x0 + 0.3, d.y - 0.45, d.x1 - 0.2, d.y - 0.38, 'black'), ...[d.x0 + 0.4, d.x1 - 0.4].map((x) => rect(x, d.y - 0.45, x + 0.07, d.y - 0.28, 'black')),
        ...[0, 1, 2, 3, 4, 5].map((i) => poly([[d.x0 + 0.05 + i * 0.4, d.y + 0.08], [d.x0 + 0.2 + i * 0.4, d.y + 0.08], [d.x0 + 0.3 + i * 0.4, d.y - 0.1], [d.x0 + 0.15 + i * 0.4, d.y - 0.1]], 'yellow', { flat: true })),
      ];
    },
  }],
  ['firework', 'Firework', 'Ракета-петарда зі смугастим корпусом. Тримай «вперед» — летить.', 'rocket', ['#e02a2a', '#ffd23f'], {
    parts: ['booster'], hideParts: true,
    // the lit fuse spits sparks (animated)
    fx: (f) => [{ kind: 'spark', at: [f.tail.x - 0.45, 0.05], dir: 200, size: 0.16 }],
    skin: (f) => [
      ...rocket(f, { nose: 'yellow', fin: 'yellow', glass: false }),
      ...[0, 1, 2, 3, 4].map((i) => poly([[-1.3 + i * 0.45, -0.32], [-1.1 + i * 0.45, -0.32], [-1.35 + i * 0.45, 0.32], [-1.55 + i * 0.45, 0.32]], 'accent', { flat: true })),
      ...path([[f.tail.x - 0.05, 0.0], [f.tail.x - 0.3, -0.12], [f.tail.x - 0.45, 0.05]], 0.05, 'tan'),
      rr(-1.2, 0.26, 1.0, 0.38, 0.04, 'dark'),
    ],
  }],
  ['christmas-tree', 'Christmas Tree', 'Ялинка з іграшками на шестиколісній гусениці.', 'tracked', ['#2a8a3a', '#ffd23f'], {
    o: o({ wheels: 6 }), parts: [['tree', 1.3]], hideParts: true,
    skin: (f) => [
      ...tracks(f, 'red'),
      rr(-1.3, -0.45, 1.3, -0.1, 0.06, 'gold'), stripe(-1.3, 1.3, -0.28, 0.07, 'red'),
      ...fir(0.6, -0.4, 1.3), ...ornaments(0.6, -0.5), ...ornaments(0.7, -0.8),
      ...path([[-0.1, -0.65], [0.6, -0.9], [1.3, -0.65]], 0.05, 'yellow'), ...path([[0.25, -1.2], [0.6, -1.32], [0.95, -1.2]], 0.05, 'yellow'),
      rr(-1.05, -0.72, -0.6, -0.45, 0.03, 'blue'), rect(-0.86, -0.72, -0.8, -0.45, 'gold', { flat: true }), rr(-0.55, -0.62, -0.25, -0.45, 0.03, 'pink'), rect(-0.43, -0.62, -0.37, -0.45, 'white', { flat: true }),
    ],
  }],
  ['snow-racer', 'Snow Racer', 'Одномісні спортивні сани з номером.', 'sled', ['#3a8ad8', '#ffd23f'], {
    speed: 1.05,
    skin: (f) => [
      ...runners(f, 'chrome'),
      blob([[f.tail.x + 0.05, 0.1], [f.tail.x + 0.02, -0.4], [-0.7, -0.42], [-0.2, -0.3], [0.6, -0.3], [f.nose.x - 0.05, -0.12], [f.nose.x - 0.1, 0.06], [f.nose.x - 0.3, 0.12]], 'body', {}, 1),
      poly([[f.tail.x + 0.1, -0.2], [f.nose.x - 0.15, -0.08], [f.nose.x - 0.15, -0.02], [f.tail.x + 0.1, -0.1]], 'accent', { flat: true }),
      blob([[0.3, -0.3], [0.55, -0.55], [0.75, -0.5], [0.8, -0.26]], 'glass', {}, 1),
      rr(f.nose.x - 0.2, -0.1, f.nose.x - 0.04, 0.0, 0.03, 'light'),
      circ(0.2, -0.06, 0.13, 'white'), rect(0.17, -0.13, 0.23, 0.01, 'black', { flat: true }),
      rr(f.tail.x + 0.05, -0.55, f.tail.x + 0.2, -0.25, 0.04, 'accent'),
    ],
  }],
  ['street-sweeper', 'Street Sweeper', 'Снігоприбиральна машина з відвалом і щіткою.', 'box', ['#f0a020', '#ffffff'], {
    parts: ['plow'], hideParts: true,
    skin: (f) => [
      ...boxy(f, { x0: f.tail.x, slope: 0.25, slopeH: 0.45, win: 1, winX: [f.nose.x - 0.85, f.nose.x - 0.4], bumper: null }),
      stripe(f.tail.x, f.nose.x, f.roof.y + 0.55, 0.06, 'black'),
      rr(f.tail.x + 0.1, f.roof.y + 0.1, 0.4, f.nose.y1 - 0.2, 0.04, 'accent'),
      ...[0, 1, 2, 3, 4].map((i) => poly([[f.tail.x + 0.2 + i * 0.5, 0.15], [f.tail.x + 0.4 + i * 0.5, 0.15], [f.tail.x + 0.55 + i * 0.5, -0.05], [f.tail.x + 0.35 + i * 0.5, -0.05]], 'black', { flat: true })),
      circ(0.05, 0.36, 0.22, 'orange'), ...[0, 1, 2, 3, 4, 5].map((i) => seg([0.05, 0.36], [0.05 + Math.cos(i) * 0.3, 0.36 + Math.sin(i) * 0.3], 0.04, 'brown')),
      poly([[f.nose.x - 0.05, f.nose.y0 + 0.25], [f.nose.x + 0.2, f.nose.y0 + 0.15], [f.nose.x + 0.75, f.nose.y1 - 0.05], [f.nose.x - 0.05, f.nose.y1 - 0.05]], 'chrome'),
      ...[0, 1, 2].map((i) => poly([[f.nose.x + 0.15 + i * 0.18, f.nose.y0 + 0.2 + i * 0.12], [f.nose.x + 0.25 + i * 0.18, f.nose.y0 + 0.17 + i * 0.12], [f.nose.x + 0.3 + i * 0.18, f.nose.y0 + 0.28 + i * 0.12], [f.nose.x + 0.2 + i * 0.18, f.nose.y0 + 0.31 + i * 0.12]], 'yellow', { flat: true })),
      ...beacon(f.roof.x1 - 0.5, f.roof.y, 'orange', 0.16),
    ],
  }],
  ['snowcycle', 'Snowcycle', 'Зимовий мотоцикл: лижа спереду, гусениця ззаду.', 'bike', ['#3a3ad8', '#e0e0e0'], {
    o: o({ rim: 'monster' }), hideWheels: [0, 1],
    skin: (f) => {
      const a = f.wheels[0], b = f.wheels[1];
      const t0 = a.x - a.r - 0.05, t1 = a.x + a.r + 0.55, ty0 = a.y - a.r * 0.75, ty1 = a.y + a.r;
      return [
        // rear track loop (the physics wheel is hidden inside it): lugs all round, bogie wheels, a drive sprocket
        rr(t0, ty0, t1, ty1, (ty1 - ty0) / 2, 'rubber'),
        ...Array.from({ length: 9 }, (_, i) => rect(t0 + 0.15 + i * ((t1 - t0 - 0.3) / 8) - 0.04, ty1 - 0.02, t0 + 0.15 + i * ((t1 - t0 - 0.3) / 8) + 0.04, ty1 + 0.05, 'rubber')),
        ...Array.from({ length: 9 }, (_, i) => rect(t0 + 0.15 + i * ((t1 - t0 - 0.3) / 8) - 0.04, ty0 - 0.05, t0 + 0.15 + i * ((t1 - t0 - 0.3) / 8) + 0.04, ty0 + 0.02, 'rubber')),
        rr(t0 + 0.12, ty0 + 0.1, t1 - 0.12, ty1 - 0.1, (ty1 - ty0) / 2 - 0.1, 'dark'),
        ...[t0 + 0.28, (t0 + t1) / 2, t1 - 0.28].map((x) => circ(x, (ty0 + ty1) / 2 + 0.05, 0.15, 'grey')),
        ...[t0 + 0.28, (t0 + t1) / 2, t1 - 0.28].map((x) => circ(x, (ty0 + ty1) / 2 + 0.05, 0.06, 'chrome')),
        ...bike(f, { style: 'sport' }),
        // front ski on a strut where the front wheel would be
        ...path([[b.x - 0.35, -0.2], [b.x - 0.1, b.y + 0.1], [b.x, b.y + b.r - 0.05]], 0.12, 'chrome'),
        ...path([[b.x - 0.45, b.y + b.r - 0.02], [b.x + 0.4, b.y + b.r - 0.02], [b.x + 0.58, b.y + b.r - 0.15], [b.x + 0.55, b.y + b.r - 0.28]], 0.09, 'chrome'),
      ];
    },
  }],
  ['ice-glider', 'Ice Glider', 'Льодовий буєр під вітрилом: розганяється вітром.', 'sled', ['#a8e0ff', '#ffffff'], {
    o: o({ len: 1.15 }), parts: ['sail'], accel: 1.2, hideParts: true,
    skin: (f) => [
      ...runners(f, 'chrome'),
      blob([[f.tail.x, 0.1], [f.tail.x + 0.05, -0.32], [-0.4, -0.34], [f.nose.x - 0.5, -0.24], [f.nose.x + 0.02, 0.0], [f.nose.x - 0.3, 0.12]], 'body', {}, 1),
      poly([[f.tail.x + 0.1, -0.12], [f.nose.x - 0.2, -0.06], [f.nose.x - 0.25, 0.0], [f.tail.x + 0.1, -0.04]], 'accent', { flat: true }),
      ...path([[0.0, -0.18], [0.0, -2.0]], 0.08, 'wood'),
      poly([[0.06, -1.95], [0.06, -0.3], [1.1, -0.32]], 'white'), poly([[-0.06, -1.7], [-0.06, -0.35], [-0.8, -0.38]], 'sky'),
      stripe(0.06, 0.8, -0.9, 0.06, 'accent'),
    ],
  }],
  ['snow-coach', 'Snow Coach', 'Гусеничний снігобус: довгий обтічний кузов із рядом вікон, гусениця ззаду, лижа спереду.', 'carriage', ['#2a3a5a', '#e0c040'], {
    drive: 'tracks',
    // After Drive Ahead's Snow Coach: a Bombardier-style tracked snow bus. Both physics wheels hide inside the track.
    o: o({ len: 1.2 }), hideWheels: [0, 1],
    skin: (f) => {
      const a = f.wheels[0], b = f.wheels[1], g = a.y + a.r;
      const t0 = a.x - a.r - 0.1, t1 = b.x - 0.25, ty0 = g - 0.62;
      return [
        // rubber track under the rear two thirds, with lugs, bogies and a sprocket
        rr(t0, ty0, t1, g, 0.31, 'rubber'),
        ...Array.from({ length: 11 }, (_, i) => rect(t0 + 0.2 + i * ((t1 - t0 - 0.4) / 10) - 0.04, g - 0.02, t0 + 0.2 + i * ((t1 - t0 - 0.4) / 10) + 0.04, g + 0.05, 'rubber')),
        rr(t0 + 0.1, ty0 + 0.1, t1 - 0.1, g - 0.1, 0.21, 'dark'),
        ...Array.from({ length: 5 }, (_, i) => circ(t0 + 0.32 + i * ((t1 - t0 - 0.64) / 4), g - 0.3, 0.15, 'grey')),
        ...Array.from({ length: 5 }, (_, i) => circ(t0 + 0.32 + i * ((t1 - t0 - 0.64) / 4), g - 0.3, 0.05, 'chrome')),
        // front ski on a sprung leg
        ...path([[b.x - 0.1, ty0 + 0.05], [b.x + 0.05, g - 0.08]], 0.11, 'dark'),
        ...path([[b.x - 0.4, g - 0.04], [b.x + 0.35, g - 0.04], [b.x + 0.55, g - 0.16], [b.x + 0.55, g - 0.3]], 0.09, 'chrome'),
        // the long rounded body: low nose with a grille, domed roof with a row of round-topped windows
        blob([[f.tail.x + 0.05, ty0 + 0.05], [f.tail.x, f.roof.y + 0.3], [f.tail.x + 0.35, f.roof.y], [b.x - 0.6, f.roof.y], [b.x - 0.2, f.roof.y + 0.35], [f.nose.x + 0.1, f.roof.y + 0.6], [f.nose.x + 0.15, ty0 - 0.05], [f.nose.x - 0.05, ty0 + 0.08]], 'body', {}, 2),
        stripe(f.tail.x + 0.05, f.nose.x + 0.1, ty0 - 0.12, 0.08, 'accent'),
        ...Array.from({ length: 5 }, (_, i) => { const x = f.tail.x + 0.4 + i * 0.42; return rr(x, f.roof.y + 0.14, x + 0.3, f.roof.y + 0.46, 0.1, 'glass'); }),
        rr(f.nose.x - 0.25, f.roof.y + 0.62, f.nose.x + 0.08, ty0 - 0.2, 0.04, 'dark'),
        ...[0, 1, 2].map((i) => rect(f.nose.x - 0.2, f.roof.y + 0.68 + i * 0.1, f.nose.x + 0.04, f.roof.y + 0.72 + i * 0.1, 'grey', { flat: true })),
        circ(f.nose.x - 0.05, f.roof.y + 0.5, 0.09, 'light'),
        snowCap(f.tail.x + 0.3, b.x - 0.55, f.roof.y - 0.04, 0.12),
        rect(f.tail.x + 0.1, f.roof.y - 0.25, f.tail.x + 0.5, f.roof.y - 0.02, 'black'), rect(f.tail.x + 0.15, f.roof.y - 0.33, f.tail.x + 0.45, f.roof.y - 0.25, 'brown'),
      ];
    },
  }],
  ['dual-snowballer', 'Dual Snowballer', 'Здвоєна сніжкова установка на гусеницях.', 'tracked', ['#7ab0e0', '#ffffff'], {
    gun: () => ({ at: [[1.58, -0.91], [1.43, -1.22]], aim: 23 }),
    parts: ['twincannon'], hideParts: true,
    skin: (f) => [
      ...trackedBody(f),
      rr(-0.3, -0.75, 0.7, -0.3, 0.1, 'body'),
      ...path([[0.6, -0.5], [1.55, -0.9]], 0.18, 'grey'), ...path([[0.5, -0.66], [1.4, -1.2]], 0.18, 'grey'),
      circ(-1.0, -0.65, 0.14, 'white'), circ(-0.72, -0.63, 0.12, 'white'),
      rr(1.45, -1.0, 1.66, -0.82, 0.04, 'black'), rr(1.3, -1.3, 1.5, -1.12, 0.04, 'black'), rr(-0.1, -0.85, 0.3, -0.75, 0.04, 'dark'),
      stripe(-1.6, 1.5, -0.2, 0.07, 'accent'),
    ],
  }],
  ['frosty-car', 'Frosty Car', 'Крижаний легковик з бурульками. Дихає морозом — суперник замерзає.', 'sedan', ['#bfe8ff', '#ffffff'], {
    o: o({ mat: 'glass' }),
    fx: (f) => [{ kind: 'frost', at: [f.nose.x + 0.15, -0.1], dir: 0, size: 0.2, mat: 'white' }, { kind: 'spark', at: [f.nose.x + 0.4, -0.15], dir: -20, size: 0.14, mat: 'sky', rate: 0.5 }],
    skin: (f) => [
      ...sedan(f, { mat: 'sky', glass: 'white', bumper: 'white' }),
      snowCap(f.roof.x0 - 0.05, f.roof.x1 + 0.05, f.roof.y, 0.1),
      ...icicles(f.tail.x + 0.2, f.nose.x - 0.2, 0.28, 10),
      ...[[-1.0, 0.0], [0.6, 0.05], [-0.2, -0.05]].map(([x, y]) => starShape(x, y, 0.09, 'white')),
      ...path([[f.nose.x - 0.1, -0.15], [f.nose.x - 0.5, -0.1], [f.nose.x - 0.7, -0.2], [f.nose.x - 0.6, -0.3]], 0.04, 'white'),
      // icicles along the roof edge and an ice crust on the hood (the frost breath off the nose is animated)
      ...icicles(f.roof.x0 - 0.05, f.roof.x1 + 0.05, f.roof.y + 0.06, 6),
      blob([[f.roof.x1 + 0.1, f.nose.y0 - 0.02], [f.nose.x - 0.4, f.nose.y0 - 0.1], [f.nose.x - 0.1, f.nose.y0 - 0.02]], 'white', {}, 1),
    ],
  }],
  ['sleigh', 'Sleigh', 'Класичні дерев\'яні сани із загнутими полозами.', 'sled', ['#a0603a', '#e0c060'], {
    o: o({ mat: 'wood' }), noLights: true,
    skin: (f) => [
      ...runners(f, 'gold'),
      blob([[f.tail.x, 0.05], [f.tail.x - 0.02, -0.55], [f.tail.x + 0.15, -0.6], [f.tail.x + 0.3, -0.3], [0.5, -0.3], [f.nose.x - 0.35, -0.45], [f.nose.x - 0.25, -0.3], [f.nose.x - 0.4, 0.05]], 'wood', {}, 1),
      stripe(f.tail.x + 0.05, f.nose.x - 0.4, -0.05, 0.08, 'accent'),
      rr(f.tail.x + 0.15, -0.45, -0.15, -0.26, 0.06, 'red'), rect(f.tail.x + 0.2, -0.38, -0.2, -0.35, 'gold', { flat: true }),
      ...[f.tail.x + 0.15, f.nose.x - 0.5].map((x) => path([[x, -0.25], [x + 0.12, -0.35], [x + 0.2, -0.25], [x + 0.12, -0.18]], 0.04, 'gold')).flat(),
    ],
  }],
  ['rocket-sleigh', 'Rocket Sleigh', 'Сани з реактивним двигуном. Тримай «вперед» — летиш по льоду.', 'sled', ['#e02a2a', '#c0c0c0'], {
    parts: ['booster'], hideParts: true,
    skin: (f) => [
      ...runners(f, 'chrome'),
      blob([[f.tail.x + 0.05, 0.1], [f.tail.x + 0.02, -0.44], [-0.7, -0.44], [-0.2, -0.32], [0.3, -0.34], [f.nose.x - 0.1, -0.14], [f.nose.x - 0.15, 0.08]], 'body', {}, 1),
      rr(f.tail.x + 0.15, -0.08, 0.4, 0.02, 0.03, 'dark'),
      tank(f.tail.x - 0.4, -0.6, -0.5, 0.18, 'chrome'), poly([[f.tail.x - 0.4, -0.62], [f.tail.x - 0.7, -0.6], [f.tail.x - 0.7, -0.4], [f.tail.x - 0.4, -0.38]], 'dark'),
      poly([[-0.9, -0.66], [-1.2, -0.95], [-1.0, -0.95], [-0.7, -0.66]], 'accent'),
      blob([[0.35, -0.3], [0.65, -0.55], [0.85, -0.22]], 'glass', {}, 1),
      stripe(f.tail.x + 0.1, 0.9, -0.1, 0.06, 'accent'),
    ],
  }],
  ['caterdog', 'Caterdog', 'Робопес-гусениця на широких траках.', 'creature', ['#c0c8d0', '#3a8ad8'], {
    drive: 'tracks',
    o: o({ len: 1.3, mat: 'metal' }), parts: ['tail', 'ears'], noLights: true, hideParts: true, glide: 0.82,
    skin: () => [
      // track loop under a robot dog
      rr(-1.05, 0.18, 1.05, 0.82, 0.3, 'rubber'), rr(-0.92, 0.28, 0.92, 0.72, 0.2, 'dark'),
      ...[-0.65, -0.2, 0.25, 0.7].map((x) => circ(x, 0.5, 0.11, 'grey')),
      // dog body: rounded steel barrel with a blue collar and back plates
      blob([[-1.25, 0.1], [-1.2, -0.45], [-0.6, -0.65], [0.5, -0.65], [0.95, -0.45], [1.0, 0.1]], 'metal', {}, 2),
      ...[[-0.95, -0.4], [-0.45, -0.52], [0.05, -0.52]].map(([x, y]) => rr(x, y, x + 0.4, y + 0.3, 0.05, 'grey', { ring: true })),
      ...[-0.85, -0.35, 0.15].map((x) => circ(x, -0.02, 0.04, 'dark')),
      rr(0.62, -0.62, 0.82, -0.05, 0.04, 'accent'), circ(0.72, 0.0, 0.06, 'gold'),
      // wagging antenna tail
      ...path([[-1.2, -0.3], [-1.5, -0.75], [-1.42, -1.0]], 0.08, 'metal'), circ(-1.42, -1.02, 0.06, 'accent'),
      // head: square muzzle, floppy ear, screen eye, black nose
      ...path([[0.8, -0.4], [1.2, -0.8]], 0.24, 'grey'),
      blob([[1.05, -1.05], [1.4, -1.15], [1.95, -1.02], [2.0, -0.82], [1.6, -0.75], [1.15, -0.78]], 'metal', {}, 1),
      blob([[1.1, -1.08], [1.35, -1.12], [1.32, -0.7], [1.15, -0.65]], 'accent', {}, 1),
      rr(1.45, -1.05, 1.68, -0.9, 0.03, 'black'), rect(1.52, -1.0, 1.62, -0.95, 'sky', { flat: true }),
      circ(2.0, -0.95, 0.07, 'black'), rect(1.62, -0.82, 1.95, -0.78, 'dark', { flat: true }),
    ],
  }],
  ['sled-dog', 'Sled Dog', 'Хаскі в упряжі тягне за собою сани.', 'creature', ['#7a8090', '#f0f0f0'], {
    noLights: true, hideParts: true,
    // The rider sits in the sled, towed on a harness: it fishtails behind the dog and bucks over bumps.
    headOn: 0, head: () => [-1.95, -0.35],
    links: () => [{
      at: [-1.0, 0.1], swing: [-40, 40], density: 0.5, behind: true,
      wheels: [{ x: -2.25, y: 0.58, r: 0.22, hidden: true, drive: false }, { x: -1.6, y: 0.58, r: 0.22, hidden: true, drive: false }],
      hit: [rect(-2.5, 0.2, -1.4, 0.62)],
      art: [
        ...path([[-1.0, 0.1], [-1.3, 0.25], [-1.4, 0.3]], 0.05, 'red'),
        // runners with a curled nose, the basket and the musher's handlebar
        ...path([[-2.6, 0.7], [-2.5, 0.78], [-1.5, 0.78], [-1.32, 0.66], [-1.3, 0.5], [-1.42, 0.46]], 0.07, 'chrome'),
        ...[-2.3, -1.65].map((x) => seg([x, 0.4], [x, 0.78], 0.06, 'wood')),
        blob([[-2.45, 0.42], [-2.42, 0.08], [-2.28, 0.1], [-2.25, 0.25], [-1.45, 0.25], [-1.38, 0.42]], 'wood', {}, 1),
        rr(-2.3, 0.28, -1.5, 0.38, 0.03, 'red'), rect(-2.3, 0.33, -1.5, 0.35, 'gold', { flat: true }),
        ...path([[-2.42, 0.1], [-2.5, -0.3], [-2.62, -0.34]], 0.07, 'wood'),
      ],
    }],
    skin: (f) => [
      ...quadruped(f, { hump: -0.05, peak: 0.1, tail: 0.45, tailUp: 0.4, tailMat: 'grey', belly: 'white', leg: 0.26, saddle: null, chest: 0.95 }),
      // harness
      rr(0.05, -0.6, 0.3, 0.0, 0.04, 'red'), seg([-0.9, -0.15], [0.1, -0.35], 0.06, 'red'),
      // husky head: pointed ears, white mask, blue eyes, black nose
      ...path([[0.7, -0.4], [1.08, -0.72]], 0.3, 'body'),
      blob([[0.95, -0.92], [1.25, -1.05], [1.55, -0.95], [1.92, -0.78], [1.88, -0.62], [1.3, -0.58], [1.0, -0.65]], 'body', {}, 1),
      poly([[1.05, -0.95], [1.1, -1.32], [1.28, -1.0]], 'body'), poly([[1.28, -1.0], [1.38, -1.3], [1.48, -0.98]], 'body'),
      poly([[1.12, -0.98], [1.14, -1.18], [1.22, -1.0]], 'pink'),
      blob([[1.3, -0.82], [1.88, -0.76], [1.86, -0.62], [1.3, -0.6]], 'white', {}, 1),
      circ(1.9, -0.78, 0.06, 'black'), ...eyeball(1.42, -0.86, 0.06, 'sky'),
      poly([[1.55, -0.62], [1.7, -0.62], [1.62, -0.5]], 'pink'),
      rr(0.85, -0.6, 1.1, -0.48, 0.03, 'red'), circ(0.98, -0.44, 0.05, 'gold'),
    ],
  }],
  ['snow-truck', 'Snow Truck', 'Полярний вантажник, повний снігу. Висипає снігову лавину.', 'truck', ['#e06a1a', '#f0f0f0'], {
    o: o({ wheel: 1.3, wheels: 2 }), cargo: ['snowball', 7],
    art: (f) => [hidden(tailgate(f.deck.x0, f.deck.y, 0.3, 'body')), hidden(rect(f.deck.x1 - 0.08, f.deck.y - 0.3, f.deck.x1, f.deck.y, 'body', { deco: false }))],
    skin: (f) => [
      ...truckCab(f),
      snowCap(f.roof.x0, f.nose.x - 0.3, f.roof.y),
      poly([[f.deck.x0, f.deck.y - 0.32], [f.deck.x1, f.deck.y - 0.32], [f.deck.x1, f.deck.y + 0.1], [f.deck.x0, f.deck.y + 0.1]], 'body'),
      ...[0.4, 0.9, 1.4].map((dx) => rect(f.deck.x0 + dx, f.deck.y - 0.3, f.deck.x0 + dx + 0.06, f.deck.y + 0.08, 'body')),
      ...[0.65, 1.15].map((dx) => starShape(f.deck.x0 + dx, f.deck.y - 0.1, 0.09, 'white')),
      // a big heaped load of snow: rounded drifts with blue shadows under each lump, heaped well
      // over the sides, spilling down over the rim in drips, with icicles under the bed
      ...([[0.3, -0.5, 0.3, 0.24], [0.85, -0.72, 0.42, 0.34], [1.45, -0.66, 0.4, 0.3], [2.0, -0.5, 0.32, 0.24]] as const).flatMap(([dx, dy, rx, ry]) => {
        const x = f.deck.x0 + dx;
        return x - rx > f.deck.x1 ? [] : [ell(x + 0.05, f.deck.y + dy + 0.05, rx, ry, 'sky'), ell(x - 0.03, f.deck.y + dy - 0.02, rx * 0.92, ry * 0.88, 'white')];
      }),
      blob([[f.deck.x0 - 0.05, f.deck.y - 0.26], [f.deck.x0 + 0.1, f.deck.y - 0.5], [f.deck.x1 - 0.1, f.deck.y - 0.5], [f.deck.x1 + 0.02, f.deck.y - 0.26]], 'white', {}, 1),
      ...[0.15, 0.55, 1.0, 1.35, 1.75].filter((dx) => f.deck.x0 + dx < f.deck.x1 - 0.1).map((dx, i) => blob([[f.deck.x0 + dx - 0.1, f.deck.y - 0.3], [f.deck.x0 + dx + 0.1, f.deck.y - 0.3], [f.deck.x0 + dx + 0.06, f.deck.y - 0.16 + (i % 2) * 0.06], [f.deck.x0 + dx - 0.03, f.deck.y - 0.12 + (i % 2) * 0.06]], 'white', {}, 1)),
      ...[[0.5, -0.88], [1.3, -0.95], [1.9, -0.68]].map(([dx, dy]) => starShape(f.deck.x0 + dx, f.deck.y + dy, 0.05, 'sky')),
      ...icicles(f.deck.x0 + 0.05, f.deck.x1 - 0.05, f.deck.y + 0.1, 8),
      ...lightbar(f.roof.x0 + 0.1, f.roof.x1 - 0.1, f.roof.y - 0.1, 'orange', 'orange'),
      ...fenders(f, 'dark', 0.12),
    ],
  }],
  ['penguin-prisoner', 'Penguin Prisoner', 'Візок із пінгвіном у клітці. Пінгвін може вистрибнути!', 'cart', ['#3a3a4a', '#ffa020'], {
    // The penguin rides in a barred cage at the back, the driver sits up front.
    o: o({ len: 1.35 }), cargo: ['penguin', 1], noLights: true, wheelie: 0.6,
    cargoAt: (f) => [f.tail.x + 0.12, f.tail.x + 0.62, f.deck.y],
    head: (f) => [f.nose.x - 0.42, f.deck.y - 0.32],
    skin: (f) => [
      // the cage: roof and bars in front of the penguin (the penguin itself is the cargo, it can hop out)
      rr(f.tail.x - 0.02, f.deck.y - 0.86, f.tail.x + 0.76, f.deck.y - 0.76, 0.03, 'accent'),
      ...[0.02, 0.37, 0.7].map((dx) => rect(f.tail.x + dx, f.deck.y - 0.78, f.tail.x + dx + 0.05, f.deck.y, 'grey')),
      rr(f.tail.x, f.deck.y, f.nose.x, 0.18, 0.05, 'body'),
      stripe(f.tail.x, f.nose.x, f.deck.y + 0.2, 0.08, 'accent'),
      ...[0, 1, 2, 3, 4].map((i) => poly([[f.tail.x + 0.1 + i * 0.32, 0.12], [f.tail.x + 0.25 + i * 0.32, 0.12], [f.tail.x + 0.35 + i * 0.32, f.deck.y + 0.08], [f.tail.x + 0.2 + i * 0.32, f.deck.y + 0.08]], 'yellow', { flat: true })),
      rr(f.tail.x - 0.05, f.deck.y - 0.04, f.nose.x + 0.05, f.deck.y + 0.06, 0.03, 'dark'), rr(f.tail.x - 0.05, 0.14, f.nose.x + 0.05, 0.24, 0.03, 'dark'),
      ...[f.tail.x + 0.15, f.nose.x - 0.2].map((x) => circ(x, f.deck.y + 0.2, 0.04, 'grey')),
      rr(f.nose.x - 0.12, f.deck.y + 0.08, f.nose.x + 0.04, f.deck.y + 0.2, 0.03, 'light'),
    ],
  }],
  ['penguin-slider', 'Penguin Slider', 'Пінгвін, що мчить на череві: кілька секунд ковзає без тертя.', 'creature', ['#1a1a2a', '#ffa020'], {
    o: o({ neck: 'none', len: 0.9 }), parts: ['snout'], noLights: true, hideParts: true, glide: 0.82,
    // ice spray kicked up at the belly (animated)
    fx: (f) => [{ kind: 'frost', at: [f.tail.x - 0.1, 0.75], dir: 200, size: 0.14, mat: 'white' }],
    // The rider sits on the back of a penguin tobogganing on its belly: no wheels show.
    skin: (f) => {
      const n = f.nose.x, t = f.tail.x;
      return [
        // orange feet trailing behind, flipper swept back
        ...[[t - 0.35, 0.45], [t - 0.3, 0.62]].map(([x, y]) => poly([[t + 0.15, y - 0.12], [x, y - 0.06], [x - 0.05, y + 0.06], [t + 0.15, y + 0.04]], 'accent')),
        // torpedo body lying on its white belly, belly down to the snow
        blob([[t, 0.55], [t - 0.05, 0.1], [-0.5, -0.38], [0.4, -0.45], [n - 0.15, -0.2], [n + 0.05, 0.3], [n - 0.2, 0.72], [-0.5, 0.82], [t + 0.2, 0.75]], 'body', {}, 2),
        blob([[t + 0.15, 0.62], [-0.3, 0.38], [0.5, 0.3], [n - 0.05, 0.38], [n - 0.25, 0.7], [-0.4, 0.8]], 'white', {}, 2),
        poly([[-0.15, 0.05], [0.3, 0.12], [-0.6, 0.45], [-0.75, 0.35]], 'dark'),
        // head at the front: white cheek, eye, orange beak, a red scarf
        blob([[n - 0.25, -0.38], [n + 0.1, -0.3], [n + 0.25, 0.0], [n + 0.1, 0.28], [n - 0.35, 0.2]], 'body', {}, 1),
        ell(n - 0.02, -0.05, 0.12, 0.1, 'white'), circ(n + 0.03, -0.07, 0.05, 'black'),
        poly([[n + 0.18, -0.08], [n + 0.55, 0.02], [n + 0.2, 0.1]], 'accent'),
        rr(n - 0.45, -0.38, n - 0.25, 0.22, 0.05, 'red'), poly([[n - 0.42, -0.2], [n - 0.8, -0.35], [n - 0.75, -0.18], [n - 0.4, -0.08]], 'red'),
      ];
    },
  }],
  ['penguin-minions', 'Penguin Minions', 'Візок пінгвінів. Запускає пінгвіна, що ковзає по землі на суперника.', 'cart', ['#3a8ad8', '#ffa020'], {
    o: o({ len: 1.05 }), wheelie: 0.6, noLights: true,
    gun: (f) => ({ at: [[f.nose.x + 0.25, -0.35]], aim: 5 }),
    skin: (f) => {
      const x0 = f.tail.x, x1 = f.nose.x, top = f.deck.y;
      const peng = (x: number, y: number, s: number): CarPoly[] => [
        blob([[x - 0.2 * s, y + 0.3], [x - 0.22 * s, y - 0.1], [x, y - 0.32 * s], [x + 0.22 * s, y - 0.1], [x + 0.2 * s, y + 0.3]], 'black', {}, 1),
        ell(x + 0.05 * s, y, 0.13 * s, 0.17 * s, 'white'), circ(x + 0.08 * s, y - 0.12 * s, 0.04, 'black'),
        poly([[x + 0.16 * s, y - 0.1 * s], [x + 0.34 * s, y - 0.05 * s], [x + 0.16 * s, y - 0.0 * s]], 'accent'),
      ];
      return [
        // penguins crowding the wagon, one in front ready to launch
        ...peng(x0 + 0.28, top - 0.28, 1.15), ...peng(x1 - 0.55, top - 0.3, 1.15), ...peng(x1 - 0.2, top - 0.22, 1.05),
        // wooden wagon tub with planks and a pull handle
        blob([[x0, top + 0.05], [x1, top + 0.05], [x1 - 0.15, 0.2], [x0 + 0.15, 0.2]], 'body', {}, 1),
        ...[x0 + 0.35, 0, x1 - 0.35].map((x) => rect(x - 0.02, top + 0.08, x + 0.02, 0.15, 'dark', { flat: true })),
        rr(x0 - 0.05, top - 0.02, x1 + 0.05, top + 0.08, 0.03, 'accent'),
        ...path([[x1 - 0.05, top + 0.3], [x1 + 0.35, top + 0.1], [x1 + 0.42, top + 0.18]], 0.06, 'dark'),
        starShape(0, top + 0.32, 0.12, 'accent'),
      ];
    },
  }],
  ['snowball-tank', 'Snowball Tank', 'Білий броньовик для снігових баталій.', 'tracked', ['#e0e8f0', '#3a8ad8'], {
    gun: () => ({ at: [[1.38, -0.89]], aim: 21 }),
    parts: [['cannon', 0.8]], hideParts: true,
    skin: (f) => [
      ...trackedBody(f),
      blob([[-0.7, -0.3], [-0.6, -0.72], [0.4, -0.72], [0.65, -0.3]], 'body', {}, 1),
      ...path([[0.5, -0.55], [1.35, -0.88]], 0.14, 'grey'),
      starShape(-0.15, -0.5, 0.14, 'accent'), stripe(-1.6, 1.5, -0.2, 0.07, 'accent'),
      rr(1.25, -0.96, 1.42, -0.8, 0.03, 'dark'), rr(-0.45, -0.82, -0.05, -0.72, 0.04, 'grey'),
      snowCap(-0.55, 0.4, -0.72, 0.1),
    ],
  }],
  ['electric-reindeer', 'Electric Reindeer', 'Живий північний олень, обмотаний різдвяною гірляндою. Гірлянда іскрить — олень б\'є розрядом навколо.', 'creature', ['#8a5a36', '#ffd23f'], {
    noLights: true,
    // the garland crackles: sparks off the bulbs (animated)
    fx: () => [{ kind: 'spark', at: [0.6, -0.75], dir: -80, size: 0.16, rate: 0.5 }],
    skin: (f) => {
      const bulbs: CarMat[] = ['red', 'yellow', 'green', 'blue', 'orange'];
      // a string of Christmas lights looping along the body and round the neck
      const wire: Pt[] = [[-0.95, -0.62], [-0.6, -0.36], [-0.2, -0.6], [0.2, -0.34], [0.55, -0.62], [0.82, -0.5], [1.0, -0.78], [1.12, -0.62]];
      return [
        ...quadruped(f, { mat: 'body', hump: 0.05, peak: 0.3, tail: 0.18, tailUp: 0.5, tailMat: 'white', belly: 'cream', leg: 0.24, chest: 0.95 }),
        // the neck up to a deer's head: pale throat, long muzzle, big dark eye, a red nose, tall branching antlers
        ...path([[0.7, -0.45], [0.98, -0.75], [1.12, -0.9]], 0.3, 'body'), ...path([[0.82, -0.42], [1.05, -0.7]], 0.14, 'cream'),
        blob([[0.98, -1.06], [1.3, -1.12], [1.68, -0.98], [1.78, -0.84], [1.55, -0.78], [1.15, -0.78]], 'body', {}, 1),
        poly([[1.02, -1.02], [0.82, -1.22], [1.12, -1.08]], 'body'), poly([[1.0, -1.04], [0.88, -1.17], [1.06, -1.08]], 'pink'),
        ell(1.3, -0.97, 0.06, 0.05, 'black'), circ(1.32, -0.99, 0.02, 'white'),
        circ(1.78, -0.88, 0.08, 'red'), circ(1.76, -0.9, 0.025, 'white'),
        ...path([[1.12, -1.08], [1.02, -1.42], [0.82, -1.68]], 0.07, 'tan'), ...path([[1.04, -1.36], [1.22, -1.58]], 0.06, 'tan'), ...path([[0.92, -1.56], [0.88, -1.78]], 0.05, 'tan'),
        ...path([[1.26, -1.1], [1.34, -1.46], [1.58, -1.7]], 0.07, 'tan'), ...path([[1.32, -1.36], [1.56, -1.44]], 0.06, 'tan'), ...path([[1.48, -1.62], [1.52, -1.82]], 0.05, 'tan'),
        // the garland: dark wire with glowing bulbs in turn
        ...path(wire, 0.03, 'dark'),
        ...wire.slice(0, -1).flatMap((p, i) => [0.33, 0.66].map((k, j) => {
          const q = wire[i + 1], x = p[0] + (q[0] - p[0]) * k, y = p[1] + (q[1] - p[1]) * k;
          return ell(x, y + 0.04, 0.045, 0.06, bulbs[(i * 2 + j) % bulbs.length]);
        })),
      ];
    },
  }],
]);

