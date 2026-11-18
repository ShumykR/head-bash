import { tailgate } from '../art';
import { blob, circ, ell, eyeball, path, poly, rect, rr, seat, seg, stack, starShape, stripe, tank } from '../draw';
import { arc, bike, hover, monsterTruck, pickup, saucer, tracks, truckCab } from '../skins';
import type { CarMat, CarPoly, Pt } from '../types';
import type { Frame } from '../factory';
import { dims } from '../critters';
import { group, o } from './util';

const hidden = (p: CarPoly): CarPoly => ({ ...p, hide: true });

/** Tracked hull + optional turret. */
function tankHull(f: Frame, mat: 'body' | 'accent' = 'body'): CarPoly[] {
  const a = f.wheels[0], b = f.wheels[f.wheels.length - 1];
  const y = a.y - a.r - 0.06;
  return [
    ...tracks(f),
    blob([[a.x - a.r - 0.2, y + 0.05], [a.x - a.r - 0.15, y - 0.32], [b.x + b.r - 0.4, y - 0.36], [b.x + b.r + 0.25, y - 0.05], [b.x + b.r, y + 0.06]], mat, {}, 1),
    rr(a.x - a.r - 0.12, y - 0.06, b.x + b.r + 0.1, y + 0.12, 0.04, mat, { ring: true }),
    ...Array.from({ length: 6 }, (_, i) => circ(a.x - a.r + (i * (b.x - a.x + 2 * a.r)) / 5, y + 0.03, 0.03, 'dark')),
  ];
}
/** Satellite dish on a mast. */
const dish = (x: number, y: number): CarPoly[] => [rect(x - 0.04, y - 0.5, x + 0.04, y, 'grey'), blob([[x - 0.45, y - 0.9], [x + 0.2, y - 0.45], [x + 0.08, y - 0.38], [x - 0.5, y - 0.72]], 'white', {}, 1), seg([x - 0.12, y - 0.62], [x + 0.05, y - 0.82], 0.04, 'grey'), circ(x + 0.06, y - 0.84, 0.05, 'red')];
/** Army star in a circle. */
const armyStar = (x: number, y: number, r = 0.14): CarPoly[] => [circ(x, y, r * 1.15, 'white'), starShape(x, y, r, 'body')];

export const ALIEN = group('alien', [
  ['cattle-trailer', 'Cattle Trailer', 'Фургон із викраденою коровою в клітці. Корова може й випасти.', 'truck', ['#c8402e', '#ffffff'], {
    o: o({ wheels: 2 }), parts: ['cage'], cargo: ['cow', 1],
    skin: (f) => [
      ...truckCab(f),
      rr(f.deck.x0, f.deck.y - 0.05, f.deck.x1, f.deck.y + 0.1, 0.03, 'wood'),
      ...[0.2, 0.45, 0.7].map((dy) => rr(f.deck.x0 + 0.02, f.deck.y - dy - 0.06, f.deck.x1 - 0.05, f.deck.y - dy + 0.02, 0.02, 'wood')),
      ...[f.deck.x0 + 0.02, (f.deck.x0 + f.deck.x1) / 2, f.deck.x1 - 0.1].map((x) => rect(x, f.deck.y - 0.8, x + 0.08, f.deck.y, 'brown')),
      stripe(f.tail.x, f.nose.x, 0.06, 0.06, 'accent'),
    ],
  }],
  ['space-shuttle', 'Space Shuttle', 'Космічний човник: білий корпус, чорне черево, ракета ззаду.', 'rocket', ['#f0f0f0', '#2a2a2a'], {
    o: o({ len: 1.15 }), parts: ['fin', 'booster'], hideParts: true,
    skin: (f) => [
      poly([[f.tail.x + 0.1, -0.3], [f.tail.x - 0.1, -1.05], [f.tail.x + 0.3, -1.05], [f.tail.x + 0.9, -0.3]], 'body'),
      rr(f.tail.x - 0.25, -0.25, f.tail.x + 0.1, 0.05, 0.05, 'grey'), rr(f.tail.x - 0.25, 0.05, f.tail.x + 0.1, 0.25, 0.04, 'grey'),
      blob([[f.tail.x, -0.3], [f.nose.x - 0.9, -0.36], [f.nose.x - 0.3, -0.22], [f.nose.x + 0.05, 0.05], [f.nose.x - 0.2, 0.3], [f.tail.x, 0.3]], 'body', {}, 1),
      blob([[f.tail.x, 0.12], [f.nose.x - 0.3, 0.14], [f.nose.x + 0.05, 0.05], [f.nose.x - 0.2, 0.3], [f.tail.x, 0.3]], 'black', {}, 1),
      poly([[-1.3, 0.0], [0.4, 0.0], [-0.7, 0.42], [-1.4, 0.42]], 'white'), poly([[-1.3, 0.3], [0.2, 0.3], [-0.7, 0.42], [-1.4, 0.42]], 'black'),
      ...[0, 1, 2].map((i) => rr(f.nose.x - 0.85 + i * 0.16, -0.24, f.nose.x - 0.73 + i * 0.16, -0.1, 0.03, 'glass')),
      rect(-0.5, -0.24, 0.1, -0.12, 'red', { flat: true }), rect(-0.5, -0.24, -0.3, -0.12, 'blue', { flat: true }),
      ...[-1.0, -0.5, 0.0, 0.5].map((x) => rect(x, -0.3, x + 0.03, 0.12, 'grey', { flat: true })),
      stripe(f.tail.x + 0.05, f.tail.x + 0.5, -0.75, 0.08, 'red'),
    ],
    fx: (f) => [{ kind: 'flame', at: [f.tail.x - 0.25, -0.1], dir: 180, size: 0.13 }, { kind: 'flame', at: [f.tail.x - 0.25, 0.15], dir: 180, size: 0.11 }],
  }],
  ['flying-saucer', 'Flying Saucer', 'Тарілка прибульців із мигалками. Злітає й ширяє.', 'saucer', ['#a0a8b8', '#7aff7a'], {
    noLights: true,
    // the tractor beam under the dish pulses (animated, no collision)
    fx: () => [{ kind: 'beam', at: [0, 0.26], to: [0, 0.75], size: 0.25, mat: 'accent' }],
    skin: (f) => [...saucer(f, { lights: 'accent' })],
  }],
  ['skater-cow', 'Skater Cow', 'Корова на скейті. Швидкі низькі стрибки майже без перезарядки.', 'creature', ['#f4f4f4', '#3a8ad8'], {
    o: o({ wheel: 0.6, tall: 1.15 }), noLights: true,
    skin: (f) => {
      const { rear, front, wy, wr } = dims(f);
      const deck = wy - wr - 0.1;
      return [
        // skateboard: kicked-up deck with grip tape and trucks over the little wheels
        ...path([[rear - 0.45, deck - 0.2], [rear - 0.3, deck], [front + 0.3, deck], [front + 0.45, deck - 0.2]], 0.12, 'accent'),
        ...path([[rear - 0.3, deck - 0.06], [front + 0.3, deck - 0.06]], 0.04, 'black'),
        ...[rear, front].map((x) => rr(x - 0.12, deck + 0.04, x + 0.12, wy - 0.05, 0.03, 'grey')),
        // cow standing on it: four legs with hooves, a spotty barrel body, swishing tail
        ...[rear - 0.12, rear + 0.15, front - 0.15, front + 0.12].map((x, i) => rr(x - 0.08, -0.25, x + 0.08, deck - 0.06, 0.03, i % 2 ? 'body' : 'grey', { ring: true })),
        ...[rear - 0.12, rear + 0.15, front - 0.15, front + 0.12].map((x) => rect(x - 0.08, deck - 0.16, x + 0.08, deck - 0.06, 'black')),
        ...path([[-1.0, -0.6], [-1.25, -0.3], [-1.3, 0.0]], 0.07, 'body'), circ(-1.3, 0.02, 0.08, 'black'),
        blob([[-1.05, -0.2], [-1.05, -0.6], [-0.6, -0.78], [0.5, -0.78], [0.95, -0.55], [0.95, -0.2], [0.5, -0.05], [-0.6, -0.05]], 'body', {}, 2),
        ...[[-0.7, -0.5, 0.2, 0.14], [0.2, -0.4, 0.24, 0.16], [-0.2, -0.15, 0.14, 0.09], [0.65, -0.62, 0.12, 0.1]].map(([x, y, a, b]) => ell(x, y, a, b, 'black', { flat: true })),
        // head: horns, ear, big pink muzzle
        blob([[0.75, -0.95], [1.1, -1.05], [1.42, -0.85], [1.45, -0.55], [1.1, -0.45], [0.8, -0.6]], 'body', {}, 1),
        poly([[0.92, -1.0], [0.82, -1.25], [1.0, -1.02]], 'bone'), poly([[1.12, -1.02], [1.15, -1.28], [1.25, -1.0]], 'bone'),
        ell(0.78, -0.85, 0.12, 0.06, 'black'),
        blob([[1.22, -0.72], [1.55, -0.72], [1.58, -0.45], [1.25, -0.42]], 'pink', {}, 1), circ(1.45, -0.62, 0.03, 'dark'),
        ...eyeball(1.1, -0.82, 0.07),
      ];
    },
  }],
  ['gun-truck', 'Gun Truck', 'Пікап із гарматою в кузові.', 'pickup', ['#5a8a34', '#3a3a3a'], {
    gun: (f) => ({ at: [[(f.deck.x0 + f.deck.x1) / 2 + 1.1, f.deck.y - 0.74]], aim: 24 }),
    parts: ['cannon'], hideParts: true,
    skin: (f) => [
      ...pickup(f),
      circ((f.deck.x0 + f.deck.x1) / 2, f.deck.y - 0.18, 0.3, 'dark'), ...path([[(f.deck.x0 + f.deck.x1) / 2, f.deck.y - 0.25], [(f.deck.x0 + f.deck.x1) / 2 + 1.05, f.deck.y - 0.72]], 0.16, 'grey'),
      ...armyStar(0.3, 0.05, 0.12),
      poly([[(f.deck.x0 + f.deck.x1) / 2 + 0.25, f.deck.y - 0.65], [(f.deck.x0 + f.deck.x1) / 2 + 0.45, f.deck.y - 0.75], [(f.deck.x0 + f.deck.x1) / 2 + 0.45, f.deck.y - 0.2], [(f.deck.x0 + f.deck.x1) / 2 + 0.25, f.deck.y - 0.2]], 'dark'),
      rr(f.deck.x0 + 0.05, f.deck.y - 0.25, f.deck.x0 + 0.4, f.deck.y, 0.03, 'tan'), rr(f.deck.x0 + 0.1, f.deck.y - 0.45, f.deck.x0 + 0.38, f.deck.y - 0.25, 0.03, 'tan'),
      rr((f.deck.x0 + f.deck.x1) / 2 + 1.0, f.deck.y - 0.82, (f.deck.x0 + f.deck.x1) / 2 + 1.15, f.deck.y - 0.64, 0.03, 'black'),
    ],
  }],
  ['army-truck', 'Army Truck', 'Військова вантажівка з ящиками боєприпасів у кузові.', 'truck', ['#4f7f30', '#5a6a38'], {
    cargo: ['sandbag', 4],
    art: (f) => [hidden(tailgate(f.deck.x0, f.deck.y, 0.3, 'body'))],
    skin: (f) => [
      ...truckCab(f, { grille: true }),
      blob([[f.deck.x0 - 0.05, f.deck.y], [f.deck.x0 - 0.05, f.deck.y - 0.95], [f.deck.x0 + 0.2, f.deck.y - 1.1], [f.deck.x1 - 0.1, f.deck.y - 1.1], [f.deck.x1 + 0.05, f.deck.y - 0.95], [f.deck.x1 + 0.05, f.deck.y]], 'accent', {}, 1),
      ...[0.6, 1.2, 1.8, 2.4].map((dx) => rect(f.deck.x0 + dx, f.deck.y - 1.08, f.deck.x0 + dx + 0.05, f.deck.y, 'body', { flat: true })),
      ...[0.3, 0.9, 1.5, 2.1].map((dx) => path([[f.deck.x0 + dx, f.deck.y - 0.95], [f.deck.x0 + dx + 0.15, f.deck.y - 0.85], [f.deck.x0 + dx + 0.3, f.deck.y - 0.95]], 0.03, 'tan')).flat(),
      rect(f.deck.x0 - 0.05, f.deck.y - 0.15, f.deck.x1 + 0.05, f.deck.y - 0.1, 'tan', { flat: true }),
      rect(f.deck.x0 - 0.05, f.deck.y - 0.5, f.deck.x0 + 0.3, f.deck.y, 'dark'),
      ...armyStar(f.nose.x - 0.5, -0.38, 0.12),
    ],
  }],
  ['shredder', 'Shredder', 'Броньовик-подрібнювач із дисковою пилкою.', 'tracked', ['#5a5a6a', '#ffd23f'], {
    parts: [['saw', 0.8]], accel: 1.3,
    skin: (f) => [
      ...tankHull(f),
      rr(-0.8, -0.72, 0.4, -0.35, 0.08, 'body'), rect(-0.6, -0.62, 0.2, -0.52, 'black', { flat: true }), rect(-0.55, -0.6, 0.15, -0.57, 'red', { flat: true }),
      ...stack(-1.2, -0.4, 0.4, 0.1, 'black'), ...[-0.7, -0.3, 0.1].map((x) => circ(x, -0.42, 0.03, 'grey')),
      ...[0, 1, 2, 3, 4, 5].map((i) => poly([[-1.6 + i * 0.5, -0.12], [-1.4 + i * 0.5, -0.12], [-1.55 + i * 0.5, 0.0], [-1.75 + i * 0.5, 0.0]], 'yellow', { flat: true })),
    ],
  }],
  ['monster-cannon', 'Monster Cannon', 'Монстр-пікап на дуже пружних колесах із гарматою в кузові: б\'є вперед, понад кабіною.', 'monster', ['#4f7f30', '#ffd23f'], {
    o: o({ open: true }),
    // A monster pickup (as in Drive Ahead the player rides at the back): a cab up front, and in the
    // bed behind it a cannon on a pedestal mount firing forward over the cab roof.
    gun: (f) => ({ at: [[f.roof.x1 + 0.35, f.roof.y - 0.62]], aim: 12 }),
    parts: ['cannon'], hideParts: true,
    skin: (f) => {
      const px = f.tail.x + 0.32, py = f.roof.y - 0.3, mx = f.roof.x1 + 0.3, my = f.roof.y - 0.6;
      return [
        ...monsterTruck(f, { frame: 'black', bar: 'dark' }),
        ...armyStar(f.roof.x0 + 0.35, -0.3, 0.13),
        rect(f.tail.x + 0.1, -0.1, f.nose.x - 0.3, -0.05, 'dark', { flat: true }),
        // the pedestal mount in the bed, the breech and a long barrel with a muzzle brake
        rr(px - 0.16, py, px + 0.16, f.deck.y + 0.02, 0.04, 'dark'), rr(px - 0.28, f.deck.y - 0.1, px + 0.28, f.deck.y + 0.02, 0.03, 'grey'),
        circ(px, py, 0.22, 'body'), circ(px, py, 0.1, 'dark'),
        ...path([[px + 0.05, py - 0.05], [mx, my]], 0.18, 'grey'), seg([px + 0.3, py - 0.1], [mx - 0.2, my + 0.03], 0.05, 'chrome', { flat: true }),
        rr(mx - 0.12, my - 0.14, mx + 0.08, my + 0.14, 0.04, 'black'),
        // an ammo box by the gun
        rr(px + 0.2, f.deck.y - 0.25, px + 0.55, f.deck.y, 0.03, 'body', { ring: true }), rect(px + 0.3, f.deck.y - 0.18, px + 0.45, f.deck.y - 0.14, 'yellow', { flat: true }),
      ];
    },
  }],
  ['army-bike', 'Army Bike', 'Армійський мотоцикл із кулеметом на кермі.', 'trike', ['#4f7f30', '#2a2a2a'], {
    axles: [0.8, 0.8, 0.8],
    gun: () => ({ at: [[1.13, -0.55]], aim: 4 }),
    parts: ['gun'], hideParts: true,
    skin: (f) => [
      blob([[-1.35, 0.2], [-1.35, -0.25], [-0.6, -0.3], [-0.5, 0.2]], 'body', {}, 1), // sidecar
      ...bike(f, { style: 'road' }),
      ...armyStar(0.2, -0.15, 0.09),
      ...path([[0.5, -0.5], [1.1, -0.55]], 0.1, 'dark'), rr(0.45, -0.62, 0.68, -0.4, 0.03, 'dark'), rr(0.25, -0.45, 0.45, -0.3, 0.03, 'tan'),
      stripe(-1.35, -0.5, -0.1, 0.05, 'black'), circ(-0.95, -0.1, 0.07, 'white'),
      // camouflage decals (as in Drive Ahead) and a heavy machine gun with an ammo belt on the bars
      ...[[-1.15, -0.1, 0.14], [-0.8, 0.05, 0.1], [0.0, -0.05, 0.12], [0.35, -0.25, 0.09], [-0.25, -0.3, 0.08]].map(([x, y, r]) => ell(x, y, r, r * 0.7, 'brown', { flat: true })),
      ...[[-0.95, -0.2, 0.08], [0.15, 0.08, 0.08]].map(([x, y, r]) => ell(x, y, r, r * 0.7, 'dark', { flat: true })),
      rr(0.5, -0.66, 1.25, -0.52, 0.03, 'black'), rect(1.1, -0.7, 1.16, -0.48, 'dark'), rr(0.62, -0.52, 0.86, -0.36, 0.03, 'tan'),
      ...[0, 1, 2, 3].map((i) => rect(0.66 + i * 0.05, -0.36, 0.69 + i * 0.05, -0.26, 'gold', { flat: true })),
    ],
  }],
  ['gunboat', 'Gunboat', 'Броньований річковий катер із гарматою на носі.', 'boat', ['#5a6a7a', '#ffd23f'], {
    gun: (f) => ({ at: [[f.nose.x - 0.35, -0.08]], aim: 0 }),
    parts: [['cannon', 0.7]], hideParts: true,
    skin: (f) => [
      blob([[f.tail.x, -0.45], [f.nose.x + 0.05, -0.55], [f.nose.x - 0.4, 0.0], [f.nose.x - 0.7, 0.12], [f.tail.x + 0.2, 0.12]], 'body', {}, 1),
      stripe(f.tail.x, f.nose.x - 0.1, -0.3, 0.07, 'accent'),
      rr(-0.3, -0.95, 0.75, -0.45, 0.06, 'grey'), rect(0.35, -0.85, 0.65, -0.65, 'glass'), seg([0.1, -0.95], [0.1, -1.4], 0.05, 'dark'),
      ...[-1.0, -0.5, 0.0].map((x) => [circ(x, -0.15, 0.08, 'chrome'), circ(x, -0.15, 0.05, 'glass')]).flat(),
      poly([[f.tail.x + 0.05, -0.02], [f.nose.x - 0.5, -0.02], [f.nose.x - 0.68, 0.12], [f.tail.x + 0.2, 0.12]], 'red', { flat: true }),
      ...[-0.15, 0.25, 0.65].map((x) => circ(x, -0.75, 0.03, 'dark')), rect(-0.35, -1.0, 0.8, -0.95, 'dark'),
      circ(f.deck.x0 + 0.2, -0.6, 0.2, 'dark'), ...path([[f.deck.x0 + 0.2, -0.65], [f.deck.x0 + 0.9, -0.95]], 0.12, 'grey'),
    ],
  }],
  ['rocket-launcher', 'Rocket Launcher', 'Армійська вантажівка з великою ракетою на пусковій рейці над кабіною: ракета прикриває голову водія, а пуск відправляє її в ціль.', 'truck', ['#4f7f30', '#e02a2a'], {
    // As in Drive Ahead: one big rocket lies on top, over the driver, on a launch rail raised from the
    // bed by two hydraulic rams. Firing launches that rocket (the rail stands empty until it reloads).
    // the rocket itself leaves the rail: the shot starts where it lies, flying along the rail
    gun: (f) => {
      const A: Pt = [f.deck.x0 + 0.15, f.deck.y - 0.5], B: Pt = [f.roof.x1 + 0.2, f.roof.y - 0.22];
      const L = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L;
      // the shot's hit circle is the rocket's nose, so it starts at the nose
      const t = L + 0.5 - 0.22, c = 0.24;
      return { at: [[A[0] + ux * t + uy * c, A[1] + uy * t - ux * c]], aim: +((Math.atan2(-uy, ux) * 180) / Math.PI).toFixed(1) };
    },
    parts: ['launcher'], hideParts: true,
    skin: (f) => {
      const d = f.deck;
      const A: Pt = [d.x0 + 0.15, d.y - 0.5], B: Pt = [f.roof.x1 + 0.2, f.roof.y - 0.22];
      const L = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L, nx = uy, ny = -ux;
      const at = (t: number, h = 0): Pt => [A[0] + ux * t + nx * h, A[1] + uy * t + ny * h];
      const band = (t0: number, t1: number, h0: number, h1: number, mat: CarMat, x: Partial<CarPoly> = {}) => poly([at(t0, h0), at(t1, h0), at(t1, h1), at(t0, h1)], mat, x);
      const r = 0.2, c = 0.24;
      return [
        ...truckCab(f),
        // bed with a turntable at the back, the two hydraulic rams lifting the rail
        rr(d.x0 - 0.05, d.y - 0.1, d.x1, d.y + 0.08, 0.03, 'dark'),
        rr(d.x0 + 0.05, d.y - 0.32, d.x0 + 0.75, d.y - 0.08, 0.05, 'body', { ring: true }),
        ...[[d.x0 + 0.95, L * 0.42], [d.x1 - 0.2, L * 0.62]].flatMap(([x, t]) => [seg([x, d.y - 0.08], at(t, -0.05), 0.12, 'dark'), seg([x, d.y - 0.08], at(t * 0.92, -0.05), 0.06, 'chrome')]),
        // the launch rail: a long girder from the bed out over the cab
        band(-0.05, L + 0.05, -0.06, 0.04, 'dark'), ...[0.3, 0.9, 1.5, 2.1].filter((t) => t < L).map((t) => band(t, t + 0.08, -0.04, c - r + 0.04, 'grey')),
        // the big rocket: olive body with a white band, red nose cone, fins, a nozzle at the back
        ...[
          band(0.05, L - 0.05, c - r, c + r, 'body'), band(L * 0.55, L * 0.62, c - r, c + r, 'white', { flat: true }),
          poly([at(L - 0.05, c - r), at(L + 0.5, c), at(L - 0.05, c + r)], 'accent'),
          poly([at(0.05, c + r), at(0.35, c + r), at(-0.08, c + r + 0.25)], 'accent'), poly([at(0.05, c - r), at(0.35, c - r), at(0.0, c - r - 0.12)], 'accent'),
          band(-0.12, 0.05, c - r * 0.6, c + r * 0.6, 'grey'),
          ...armyStar(...at(L * 0.35, c), 0.1),
        ].map((p) => ({ ...p, ammo: true })),
        // the rail's cradle under the rocket, seen when it has gone
        ...[0.15, L * 0.5, L - 0.25].map((t) => band(t, t + 0.1, -0.04, c - r + 0.1, 'grey')),
        ...armyStar(f.nose.x - 0.5, -0.4, 0.12),
        ...[d.x0 + 0.1, d.x1 - 0.3].map((x) => [rect(x, d.y, x + 0.07, d.y + 0.35, 'dark'), rr(x - 0.08, d.y + 0.32, x + 0.15, d.y + 0.38, 0.02, 'black')]).flat(),
      ];
    },
  }],
  ['tank', 'Tank', 'Бойовий танк: башта, довгий ствол і п\'ять котків.', 'tracked', ['#4f7f30', '#5a6a38'], {
    gun: () => ({ at: [[1.96, -0.76]], aim: 7 }),
    o: o({ wheels: 5 }), parts: ['cannon'], hideParts: true,
    skin: (f) => [
      ...tankHull(f),
      blob([[-0.9, -0.32], [-0.8, -0.75], [0.35, -0.78], [0.7, -0.35]], 'body', {}, 1),
      ...path([[0.5, -0.58], [1.85, -0.75]], 0.13, 'grey'), rr(1.7, -0.84, 1.95, -0.66, 0.04, 'dark'),
      ...armyStar(-0.25, -0.5, 0.12),
      seg([-0.6, -0.78], [-0.75, -1.2], 0.04, 'dark'), rr(-0.65, -0.85, -0.25, -0.75, 0.04, 'dark'),
      rr(0.45, -0.66, 0.75, -0.5, 0.04, 'dark'), rr(-1.1, -0.5, -0.85, -0.35, 0.03, 'tan'), rr(-1.15, -0.62, -0.88, -0.5, 0.03, 'tan'),
    ],
  }],
  ['space-bike', 'Space Bike', 'Світловий мотоцикл: суцільний обтічний корпус, колеса-кільця з неоновим ободом і світний слід позаду.', 'bike', ['#1a1a2a', '#5ef0ff'], {
    axles: [1.15, 1.15],
    o: o({ rim: 'disc' }), speed: 1.15, hideWheels: [0, 1], air: 1.4, lamp: null,
    // A light cycle: big hubless ring wheels with neon rims, one sleek shell wrapping over both of
    // them, the rider lying forward along it with hands on the low grips in the front cowl, neon
    // seams, and the wall of light it leaves behind.
    head: () => [0.22, -0.8],
    rider: (f) => ({ pose: 'ride', front: true, lean: 0.55, hand: [f.wheels[1].x - 0.22, -0.52], foot: [f.wheels[0].x + 0.3, -0.3] }),
    ribbon: (f) => ({ at: [f.wheels[0].x - f.wheels[0].r * 0.5, f.wheels[0].y + f.wheels[0].r], h: 0.85, mat: 'accent', life: 1.4 }),
    skin: (f) => {
      const [rw, fw] = f.wheels;
      const ring = (w: typeof rw) => [circ(w.x, w.y, w.r, 'black'), circ(w.x, w.y, w.r - 0.06, 'accent', { flat: true }), circ(w.x, w.y, w.r - 0.17, 'black', { flat: true }), circ(w.x, w.y, 0.07, 'accent', { flat: true })];
      const shell: Pt[] = [
        [rw.x - rw.r - 0.1, rw.y - 0.05], [rw.x - rw.r * 0.8, rw.y - rw.r - 0.06], [rw.x + 0.2, rw.y - rw.r - 0.14], [-0.05, -0.36],
        [fw.x - 0.3, fw.y - fw.r - 0.14], [fw.x + fw.r * 0.8, fw.y - fw.r - 0.02], [fw.x + fw.r + 0.12, fw.y - 0.05], [fw.x, fw.y - 0.02], [0.0, 0.02], [rw.x, rw.y - 0.02],
      ];
      return [
        blob(shell, 'body', {}, 2),
        // the ring wheels show whole through the shell's open sides, under fender arcs
        ...ring(rw), ...ring(fw),
        ...[rw, fw].flatMap((w) => [arc(w.x, w.y, w.r + 0.05, Math.PI * 1.08, Math.PI * 1.92, 0.12, 'body'), arc(w.x, w.y, w.r + 0.1, Math.PI * 1.1, Math.PI * 1.9, 0.035, 'accent', { flat: true })]),
        // neon seam along the spine, the low canopy over the front, a tail light
        ...path([[rw.x + 0.2, rw.y - rw.r - 0.1], [-0.05, -0.32], [fw.x - 0.3, fw.y - fw.r - 0.1]], 0.035, 'accent'),
        ...path([[rw.x + rw.r + 0.05, rw.y - 0.12], [fw.x - fw.r - 0.05, fw.y - 0.12]], 0.035, 'accent'),
        blob([[fw.x - 0.5, fw.y - fw.r - 0.12], [fw.x - 0.15, fw.y - fw.r - 0.32], [fw.x + 0.25, fw.y - fw.r - 0.12]], 'glass', {}, 1),
        rr(rw.x - rw.r - 0.16, rw.y - 0.16, rw.x - rw.r - 0.06, rw.y - 0.04, 0.02, 'accent'),
      ];
    },
  }],
  ['alien-drone', 'Alien Attack Drone', 'Бойовий дрон прибульців із червоним оком-лазером.', 'saucer', ['#3a3a4a', '#ff3a3a'], {
    s: 0.85, parts: ['antenna'], noLights: true, hideParts: true,
    skin: (f) => [
      ...saucer(f, { dome: 'dark', lights: 'red' }),
      circ(f.nose.x - 0.25, -0.05, 0.24, 'dark'), circ(f.nose.x - 0.25, -0.05, 0.2, 'red'), circ(f.nose.x - 0.22, -0.05, 0.1, 'light'),
      ...[-0.8, -0.4, 0.0].map((x) => poly([[x, -0.32], [x + 0.2, -0.32], [x + 0.1, -0.52]], 'red')),
      ...path([[-0.6, -0.75], [-0.8, -1.25]], 0.05, 'grey'), circ(-0.8, -1.3, 0.08, 'red'),
      ...path([[f.tail.x + 0.3, 0.2], [f.tail.x + 0.1, 0.5]], 0.07, 'grey'), ...path([[f.nose.x - 0.3, 0.2], [f.nose.x - 0.1, 0.5]], 0.07, 'grey'),
      // two laser guns on the sides (as in Drive Ahead) and the drone's rotors on outriggers
      ...[[f.tail.x - 0.05, -1], [f.nose.x + 0.05, 1]].flatMap(([x, d]) => [rr(Math.min(x, x + d * 0.45), -0.42, Math.max(x, x + d * 0.45), -0.28, 0.04, 'grey'), rr(Math.min(x + d * 0.4, x + d * 0.55), -0.4, Math.max(x + d * 0.4, x + d * 0.55), -0.3, 0.03, 'red')]),
      ...[f.tail.x + 0.35, f.nose.x - 0.35].flatMap((x) => [seg([x, -0.45], [x, -0.82], 0.05, 'grey'), ell(x, -0.86, 0.38, 0.05, 'grey', { flat: true }), rect(x - 0.05, -0.92, x + 0.05, -0.82, 'dark')]),
    ],
  }],
  ['celestial-teapot', 'Celestial Teapot', 'Космічний чайник на реактивній тязі. Хлюпає окропом.', 'blob', ['#f0f0f0', '#4a8ad8'], {
    gun: () => ({ at: [[1.38, -1.08]], aim: 45 }),
    parts: ['booster', 'lid'], noLights: true, hideParts: true,
    skin: () => [
      ...path([[0.65, -0.4], [1.0, -0.5], [1.35, -1.05]], 0.18, 'body'),
      blob([[-1.25, -0.9], [-1.4, -0.5], [-1.25, -0.15], [-0.85, -0.2], [-0.85, -0.3], [-1.15, -0.32], [-1.22, -0.5], [-1.15, -0.75], [-0.85, -0.75], [-0.85, -0.88]], 'accent', {}, 1),
      ell(0, -0.35, 0.95, 0.72, 'body', {}, 28),
      rr(-0.55, -1.12, 0.55, -1.0, 0.04, 'accent'), ell(0, -1.12, 0.4, 0.12, 'body'), circ(0, -1.28, 0.08, 'accent'),
      ...[-0.45, 0.0, 0.45].map((x) => circ(x, -0.35, 0.12, 'accent')), stripe(-0.85, 0.85, 0.05, 0.06, 'accent'),
      rr(-0.7, 0.2, 0.7, 0.36, 0.05, 'grey'), poly([[-0.5, 0.36], [0.5, 0.36], [0.3, 0.55], [-0.3, 0.55]], 'orange'),
      ell(-0.4, -0.75, 0.25, 0.1, 'white', { flat: true }), ...[[-0.45, -0.35], [0.0, -0.35], [0.45, -0.35]].map(([x, y]) => starShape(x, y, 0.07, 'white')),
      rect(-0.9, -0.12, 0.9, -0.08, 'gold', { flat: true }),
    ],
  }],
  ['moon-rover', 'Moon Rover', 'Місяцехід з антеною-тарілкою. Стрибає, як у невагомості.', 'buggy', ['#e0e0e0', '#ffd23f'], {
    o: o({ wheel: 1.1, open: true }), parts: ['dish'], hideParts: true,
    skin: (f) => [
      ...f.wheels.map((w) => seg([w.x, w.y], [w.x * 0.6, -0.05], 0.08, 'grey')),
      rr(f.tail.x - 0.05, -0.3, f.nose.x - 0.05, 0.1, 0.06, 'gold'), ...[-0.8, -0.4, 0.0, 0.4].map((x) => rect(x, -0.28, x + 0.03, 0.08, 'tan', { flat: true })),
      rr(f.tail.x + 0.1, -0.12, f.nose.x - 0.2, 0.0, 0.03, 'body', { flat: true }),
      ...f.wheels.map((w) => arc(w.x, w.y, w.r + 0.08, Math.PI * 1.1, Math.PI * 1.9, 0.08, 'grey')), rr(f.nose.x - 0.2, -0.22, f.nose.x + 0.02, -0.1, 0.03, 'light'),
      ...seat(f.head.x + 0.05, -0.25, 0.4, 'white'),
      ...dish(f.tail.x + 0.35, -0.25),
      rr(0.4, -0.55, 0.7, -0.25, 0.04, 'grey'), circ(0.55, -0.4, 0.06, 'red'),
      ...path([[0.9, -0.25], [1.0, -0.6]], 0.05, 'grey'),
    ],
  }],
  ['alien-spaceship', 'Alien Spaceship', 'Винищувач прибульців із реактивними дюзами і лазером.', 'hover', ['#3a8a3a', '#7aff7a'], {
    parts: ['fin', 'jets'], hideParts: true,
    skin: (f) => [
      poly([[f.tail.x + 0.2, -0.3], [f.tail.x - 0.2, -0.95], [f.tail.x + 0.2, -0.95], [f.tail.x + 0.9, -0.3]], 'accent'),
      rr(f.tail.x - 0.35, -0.25, f.tail.x + 0.05, -0.05, 0.05, 'grey'), rr(f.tail.x - 0.35, 0.0, f.tail.x + 0.05, 0.18, 0.05, 'grey'),
      ...hover(f, { glow: 'accent' }),
      ...path(Array.from({ length: 11 }, (_, i): [number, number] => [f.head.x - Math.cos(i * Math.PI / 10) * 0.62, -0.34 - Math.sin(i * Math.PI / 10) * 0.62]), 0.06, 'accent'),
      ...eyeball(0.0, -0.48, 0.12, 'leaf'), ...eyeball(-0.3, -0.5, 0.1, 'leaf'),
      poly([[-0.4, 0.05], [0.8, 0.05], [-0.6, 0.45]], 'body'),
      ...[[-1.1, -0.15], [0.6, -0.15]].map(([x, y]) => [circ(x, y, 0.07, 'dark'), circ(x, y, 0.045, 'accent')]).flat(),
    ],
  }],
  ['planet-explorer', 'Planet Explorer', 'Шестиколісний планетохід із тарілкою зв\'язку.', 'tracked', ['#e0e0e0', '#ff8a1a'], {
    o: o({ wheels: 6 }), parts: ['dish'], hideParts: true,
    skin: (f) => [
      ...f.wheels.map((w) => seg([w.x, w.y], [w.x * 0.9, -0.1], 0.08, 'grey')),
      rr(-1.6, -0.45, 1.65, -0.05, 0.08, 'body'), stripe(-1.6, 1.65, -0.2, 0.08, 'accent'),
      rr(-0.8, -0.85, 0.5, -0.45, 0.1, 'gold'), rect(-0.6, -0.75, 0.3, -0.6, 'black', { flat: true }),
      ...dish(0.9, -0.45),
      ...[1.3, 1.5].map((x) => circ(x, -0.3, 0.06, 'light')),
      rr(-1.65, -0.08, 1.7, 0.04, 0.03, 'dark'), ...[-1.2, -0.6, 0.0, 0.6, 1.2].map((x) => circ(x, -0.38, 0.03, 'grey')),
      ...[-1.35, -1.05].map((x) => rr(x, -0.68, x + 0.24, -0.45, 0.02, 'blue')), rect(-1.35, -0.58, -0.81, -0.56, 'grey', { flat: true }),
    ],
  }],
  ['space-interceptor', 'Space Interceptor', 'Перехоплювач із самонавідними ракетами.', 'hover', ['#e0e0e0', '#3a6ad8'], {
    parts: ['wing', 'booster'], speed: 1.05, hideParts: true,
    skin: (f) => [
      poly([[f.tail.x + 0.1, -0.3], [f.tail.x - 0.15, -0.8], [f.tail.x + 0.25, -0.8], [f.tail.x + 0.8, -0.3]], 'accent'),
      rr(f.tail.x - 0.4, -0.2, f.tail.x + 0.05, 0.1, 0.05, 'grey'),
      ...hover(f, { glow: 'sky' }),
      poly([[-0.8, 0.0], [0.6, 0.0], [-0.4, 0.42], [-0.9, 0.42]], 'accent'),
      ...[[-0.6, 0.38], [-0.2, 0.38]].map(([x, y]) => tank(x - 0.3, x + 0.2, y, 0.06, 'red')),
      starShape(0.8, -0.12, 0.1, 'accent'), circ(-0.2, -0.12, 0.12, 'white'), rect(-0.23, -0.2, -0.17, -0.04, 'black', { flat: true }),
    ],
  }],
]);

