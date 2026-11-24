import { blob, checkers, stack, circ, ell, eyeball, fangs, flameDecal, grille, lightbar, ladder, path, poly, rect, rr, seat, seg, spikesAlong, starShape, stripe, tank, shoulders } from '../draw';
import { arc, boxy, dragsterBody, fenders, formula, headrest, frontLamp, hover, monsterChassis, pickup, rearLamp, sedan, tracks, monsterTruck } from '../skins';
import type { CarMat, CarPoly } from '../types';
import type { Frame } from '../factory';
import { fishCar, arm, browEye, maw, quadruped } from '../critters';
import { group, o } from './util';

// Toy-track racers: original designs inspired by die-cast toy-car concepts.

const hidden = (p: CarPoly): CarPoly => ({ ...p, hide: true });

/**
 * Low wedge sports body used by most toy racers: a chunky hull that wraps the wheel tops,
 * a two-tone swoosh down the flank, a side intake, a ducktail spoiler and corner lamps.
 */
function wedge(f: Frame, mat: CarMat = 'body', canopy: CarMat = 'glass', swoosh: CarMat = 'accent'): CarPoly[] {
  const x0 = f.tail.x, x1 = f.nose.x;
  const bot = 0.42;
  return [
    blob([[x0 + 0.04, bot], [x0 - 0.04, -0.1], [x0 + 0.1, -0.36], [x0 + 0.45, -0.36], [-0.7, -0.34], [0.45, -0.3], [x1 - 0.3, -0.08], [x1 + 0.03, 0.08], [x1 + 0.02, 0.3], [x1 - 0.12, bot]], mat, {}, 1),
    // flank swoosh: thin at the nose, widening toward the tail
    poly([[x1 - 0.3, 0.1], [x1 - 0.05, 0.12], [x0 + 0.3, 0.08], [x0 + 0.12, -0.14], [x0 + 0.55, -0.16]], swoosh, { flat: true }),
    rr(-0.25, 0.14, 0.35, 0.26, 0.04, 'black'),
    ...[0, 1, 2].map((i) => rect(-0.2 + i * 0.18, 0.17, -0.12 + i * 0.18, 0.23, 'dark', { flat: true })),
    blob([[-0.66, -0.32], [-0.4, -0.58], [0.0, -0.6], [0.5, -0.3]], canopy, {}, 1),
    // ducktail spoiler
    poly([[x0 + 0.02, -0.34], [x0 - 0.08, -0.54], [x0 + 0.38, -0.52], [x0 + 0.45, -0.34]], mat),
    rect(x0 - 0.08, -0.56, x0 + 0.4, -0.5, swoosh, { flat: true }),
    rr(x1 - 0.14, 0.02, x1 + 0.03, 0.12, 0.03, 'light'), rr(x0 - 0.06, -0.12, x0 + 0.06, 0.02, 0.03, 'red'),
    rr(x1 - 0.4, bot - 0.08, x1 + 0.06, bot + 0.02, 0.04, 'dark'),
  ];
}
const skull = (x: number, y: number, r: number): CarPoly[] => [
  circ(x, y, r, 'bone'), rr(x - r * 0.55, y + r * 0.45, x + r * 0.55, y + r * 1.1, r * 0.2, 'bone'),
  circ(x - r * 0.38, y, r * 0.28, 'black'), circ(x + r * 0.38, y, r * 0.28, 'black'),
  poly([[x - r * 0.1, y + r * 0.5], [x + r * 0.1, y + r * 0.5], [x, y + r * 0.25]], 'black'),
  ...[-0.3, 0, 0.3].map((d) => rect(x + d * r - r * 0.05, y + r * 0.75, x + d * r + r * 0.05, y + r * 1.1, 'black', { flat: true })),
];
const angry = (x: number, y: number, r: number, iris: CarMat = 'red'): CarPoly[] => [poly([[x - r, y - r * 0.5], [x + r, y], [x + r * 0.8, y + r * 0.8], [x - r * 0.8, y + r * 0.8]], 'white'), circ(x + r * 0.25, y + r * 0.35, r * 0.38, iris)];

export const TOYS = group('toys', [
  ['rattle-bones', 'Rattle Bones', 'Хот-род із решіткою-черепом і хромованими трубами.', 'sports', ['#1a1a1a', '#e8dcc0'], {
    axles: [1.15, 0.85],
    parts: ['exhaust'], hideParts: true,
    skin: (f) => [
      ...wedge(f),
      ...shoulders(f.head),
      ...skull(f.nose.x - 0.35, -0.12, 0.2),
      ...[0, 1, 2].map((i) => path([[0.2 + i * 0.15, -0.24], [0.1 + i * 0.15, -0.55]], 0.08, 'chrome')).flat(),
      ...path([[-0.5, 0.22], [f.tail.x - 0.2, 0.2]], 0.1, 'chrome'),
      stripe(-1.4, 0.6, 0.03, 0.06, 'bone'),
      // the skull grille on the nose and chrome side pipes
      circ(f.nose.x - 0.2, -0.12, 0.2, 'bone'), rr(f.nose.x - 0.34, -0.02, f.nose.x - 0.05, 0.1, 0.03, 'bone'),
      circ(f.nose.x - 0.27, -0.14, 0.055, 'black'), circ(f.nose.x - 0.13, -0.14, 0.055, 'black'), poly([[f.nose.x - 0.21, -0.06], [f.nose.x - 0.17, -0.06], [f.nose.x - 0.19, -0.02]], 'black'),
      ...[0, 1, 2].map((i) => rect(f.nose.x - 0.3 + i * 0.08, 0.0, f.nose.x - 0.27 + i * 0.08, 0.1, 'black', { flat: true })),
      ...path([[-0.6, 0.12], [f.tail.x + 0.1, 0.1], [f.tail.x - 0.2, 0.0]], 0.08, 'chrome'), ...path([[-0.6, 0.2], [f.tail.x + 0.1, 0.2], [f.tail.x - 0.2, 0.12]], 0.08, 'chrome'),
    ],
  }],
  ['fang-racer', 'Fang Racer', 'Звіроподібний болід із зубастою пащею на носі.', 'sports', ['#2a6ae0', '#ffffff'], {
    parts: ['fangs'], hideParts: true,
    skin: (f) => [
      ...wedge(f),
      // a beast's head pushed out over the front wheel: brow, angry eye, gaping toothy maw
      blob([[f.nose.x - 0.75, -0.45], [f.nose.x - 0.2, -0.52], [f.nose.x + 0.3, -0.4], [f.nose.x + 0.42, -0.2], [f.nose.x + 0.3, -0.02], [f.nose.x - 0.6, -0.05]], 'body', {}, 1),
      poly([[f.nose.x - 0.35, -0.28], [f.nose.x + 0.4, -0.24], [f.nose.x + 0.32, -0.08], [f.nose.x - 0.3, -0.12]], 'black'),
      ...fangs(f.nose.x - 0.3, f.nose.x + 0.36, -0.26, 4, 0.1), ...fangs(f.nose.x - 0.26, f.nose.x + 0.3, -0.1, 4, 0.08, true),
      ...angry(f.nose.x - 0.2, -0.4, 0.08),
      poly([[f.nose.x - 0.55, -0.48], [f.nose.x - 0.4, -0.7], [f.nose.x - 0.3, -0.5]], 'accent'),
      ...[0, 1, 2, 3].map((i) => poly([[-1.4 + i * 0.45, -0.12], [-1.2 + i * 0.45, -0.12], [-1.35 + i * 0.45, 0.2], [-1.55 + i * 0.45, 0.2]], 'accent', { flat: true })),
      ...shoulders(f.head),
    ],
  }],
  ['turbo-bones', 'Turbo Bones', 'Кістяний турбо-болід із закисом азоту.', 'formula', ['#e8dcc0', '#e02a2a'], {
    o: o({ mat: 'bone' }), parts: ['exhaust', 'jets'], hideParts: true,
    skin: (f) => [
      ...formula(f, { mat: 'bone', wing: 'accent' }),
      ...[-1.0, -0.6, -0.2, 0.2, 0.6].map((x) => rect(x, -0.04, x + 0.06, 0.16, 'dark', { flat: true })),
      ...skull(f.nose.x - 0.15, 0.0, 0.12),
      ...[0, 1].map((i) => path([[-0.9 + i * 0.2, -0.2], [-1.0 + i * 0.2, -0.6]], 0.08, 'chrome')).flat(),
      ...shoulders(f.head),
    ],
  }],
  ['star-coupe', 'Star Coupe', 'Космічний концепт-кар із зоряним бластером.', 'hover', ['#c0c8d0', '#3a6ad8'], {
    gun: (f) => ({ at: [[f.nose.x + 0.4, -0.28]], aim: 3 }),
    parts: ['fin'], hideParts: true,
    skin: (f) => [
      poly([[f.tail.x + 0.1, -0.3], [f.tail.x - 0.15, -0.8], [f.tail.x + 0.25, -0.8], [f.tail.x + 0.8, -0.3]], 'accent'),
      ...hover(f, { glow: 'yellow' }),
      starShape(-0.6, -0.12, 0.14, 'gold'), stripe(f.tail.x, f.nose.x - 0.2, 0.0, 0.05, 'accent'),
      ...path([[0.6, -0.3], [1.3, -0.45]], 0.1, 'grey'), circ(1.32, -0.45, 0.08, 'yellow'), rr(0.55, -0.42, 0.75, -0.2, 0.04, 'dark'),
      ...[[-1.2, -0.5], [0.9, -0.7]].map(([x, y]) => starShape(x, y, 0.07, 'yellow')),
      // the star blaster on the roof: a long barrel with a glowing star at the muzzle
      rr(0.1, -0.36, f.nose.x + 0.25, -0.2, 0.05, 'grey'), rr(-0.1, -0.42, 0.35, -0.14, 0.06, 'accent'), ...[0.55, 0.85].map((x) => rect(x, -0.38, x + 0.05, -0.18, 'dark')),
      starShape(f.nose.x + 0.38, -0.28, 0.2, 'gold'), starShape(f.nose.x + 0.38, -0.28, 0.09, 'white'),
      ...[[-1.0, -0.15], [0.3, 0.05]].map(([x, y]) => starShape(x, y, 0.08, 'white')),
      ...shoulders(f.head),
    ],
  }],
  ['dark-phantom', 'Dark Phantom', 'Бойова машина темного лорда: розчиняється в тіні.', 'sports', ['#7a3ae0', '#e8dcc0'], {
    parts: ['skull', 'roofspikes'],
    // the shadow it dissolves into: dark wisps streaming off the tail (animated)
    fx: (f) => [{ kind: 'wisp', at: [f.tail.x - 0.1, -0.2], dir: 180, size: 0.32, mat: 'purple', rate: 1.3 }],
    skin: (f) => [
      ...wedge(f, 'body', 'dark'), ...spikesAlong(-1.3, -0.6, -0.18, 3, 0.2, 'bone'),
      ...shoulders(f.head),
      // the dark lord's sigil: a skull on the flank, glowing eye-lamps on the nose
      circ(-0.15, -0.02, 0.13, 'bone'), circ(-0.2, -0.04, 0.035, 'black'), circ(-0.1, -0.04, 0.035, 'black'), rect(-0.2, 0.06, -0.1, 0.1, 'bone'),
      ...[0, 0.14].map((d) => poly([[f.nose.x - 0.42 + d, -0.16], [f.nose.x - 0.3 + d, -0.2], [f.nose.x - 0.32 + d, -0.1]], 'green')),
    ],
  }],
  ['rex-dragster', 'Rex Dragster', 'Гібрид тиранозавра й дрегстера: ракета ззаду, паща спереду.', 'dragster', ['#3a8a3a', '#e0e0c0'], {
    parts: ['teeth', 'booster'], hideParts: true,
    skin: (f) => {
      const n = f.nose.x, t = f.tail.x;
      return [
        // rocket in the tail, the tail itself swept up as the wing strut
        rr(t - 0.35, -0.14, t + 0.15, 0.14, 0.05, 'grey'), rr(t - 0.48, -0.09, t - 0.3, 0.09, 0.03, 'orange'),
        blob([[t + 0.2, -0.1], [t - 0.1, -0.75], [t + 0.2, -0.8], [t + 0.6, -0.2]], 'body', {}, 1),
        // long scaly body
        blob([[t + 0.1, 0.2], [t + 0.15, -0.2], [-0.6, -0.32], [0.2, -0.28], [n - 0.9, -0.3], [n - 0.8, 0.22]], 'body', {}, 1),
        ...spikesAlong(t + 0.3, n - 1.0, -0.26, 8, 0.14, 'accent'),
        path([[t + 0.3, 0.12], [n - 0.9, 0.12]], 0.08, 'accent')[0],
        ...seat(-0.95, -0.2, 0.45),
        // the T-rex head is the nose: heavy skull, open jaws full of teeth, tiny arm
        blob([[n - 1.15, -0.45], [n - 0.95, -0.85], [n - 0.4, -0.88], [n - 0.02, -0.6], [n + 0.1, -0.15], [n - 0.6, -0.1], [n - 1.1, -0.15]], 'body', {}, 1),
        poly([[n - 0.72, -0.12], [n + 0.08, -0.16], [n, 0.05], [n - 0.68, 0.04]], 'black', { flat: true }),
        ...fangs(n - 0.66, n + 0.04, -0.14, 5, 0.09), ...fangs(n - 0.6, n - 0.04, 0.03, 4, 0.08, true),
        blob([[n - 0.75, 0.02], [n, 0.04], [n - 0.12, 0.2], [n - 0.7, 0.18]], 'body', {}, 1),
        ...browEye(n - 0.6, -0.6, 0.08, 'red'), circ(n - 0.05, -0.45, 0.03, 'black'),
        ...arm(n - 1.05, -0.05),
        ...shoulders(f.head),
      ];
    },
  }],
  ['horned-pickup', 'Horned Pickup', 'Пікап із головою трицератопса.', 'pickup', ['#e08a1a', '#e0d0a0'], {
    parts: ['horns'], hideParts: true,
    art: (f) => [hidden(poly([[f.nose.x - 0.05, -0.05], [f.nose.x - 0.05, 0.2], [f.nose.x + 1.1, -0.3]], 'accent', { deco: false, density: 0.3 }))],
    skin: (f) => [
      ...pickup(f),
      // the triceratops head over the bonnet: a big bony frill fanning up behind the horns, edged with spikes
      blob([[f.nose.x - 0.85, -0.2], [f.nose.x - 0.95, -0.75], [f.nose.x - 0.6, -1.15], [f.nose.x - 0.15, -1.05], [f.nose.x + 0.1, -0.6], [f.nose.x + 0.05, -0.2]], 'brown', {}, 1),
      ...[[-0.95, -0.75], [-0.8, -1.0], [-0.55, -1.15], [-0.25, -1.1], [-0.02, -0.85]].map(([dx, y]) => poly([[f.nose.x + dx - 0.07, y + 0.04], [f.nose.x + dx + 0.07, y + 0.04], [f.nose.x + dx, y - 0.14]], 'bone')),
      ell(f.nose.x - 0.45, -0.7, 0.2, 0.15, 'accent', { flat: true }), ell(f.nose.x - 0.45, -0.7, 0.1, 0.07, 'brown', { flat: true }),
      poly([[f.nose.x + 0.05, -0.3], [f.nose.x + 0.38, -0.2], [f.nose.x + 0.3, 0.02], [f.nose.x + 0.05, 0.05]], 'bone'),
      blob([[f.nose.x - 0.25, -0.26], [f.nose.x + 0.0, -0.75], [f.nose.x + 0.25, -0.65], [f.nose.x + 0.05, -0.2]], 'accent', {}, 1),
      poly([[f.nose.x - 0.05, -0.05], [f.nose.x - 0.05, 0.2], [f.nose.x + 1.1, -0.3]], 'bone'),
      poly([[f.roof.x1 - 0.3, f.roof.y], [f.roof.x1 - 0.02, f.roof.y + 0.05], [f.roof.x1 + 0.7, f.roof.y - 0.75]], 'bone'),
      ...eyeball(f.nose.x - 0.45, -0.1, 0.08),
      ...[[-1.2, -0.05], [-0.6, 0.05], [0.2, -0.05]].map(([x, y]) => ell(x, y, 0.12, 0.08, 'brown')),
      poly([[f.nose.x - 0.25, -0.3], [f.nose.x - 0.05, -0.3], [f.nose.x - 0.15, -0.45]], 'accent'),
      ...shoulders(f.head),
    ],
  }],
  ['dino-trike', 'Dino Trike', 'Трицикл-динозавр із зубатою мордою.', 'trike', ['#4a8a3a', '#ffd23f'], {
    parts: ['teeth'], noLights: true, hideParts: true,
    skin: (f) => [
      // long tail out the back, body over the rear axle, toothy head on a neck at the front
      blob([[-1.2, -0.15], [-1.9, -0.45], [-1.2, -0.38]], 'body', {}, 1),
      ...shoulders(f.head),
      blob([[-1.35, 0.22], [-1.3, -0.3], [-0.6, -0.48], [0.3, -0.35], [0.6, -0.05], [0.3, 0.18], [-0.2, 0.26]], 'body', {}, 1),
      blob([[-1.1, 0.14], [-0.2, 0.04], [0.35, 0.02], [0.2, 0.15], [-0.6, 0.2]], 'cream', {}, 1),
      ...f.wheels.map((w) => arc(w.x, w.y, w.r + 0.08, Math.PI * 1.1, Math.PI * 1.9, 0.09, 'dark')),
      ...[-1.05, -0.75, -0.45, -0.15].map((x) => poly([[x - 0.12, -0.36 - (x + 0.6) * 0.05], [x + 0.12, -0.38 - (x + 0.6) * 0.05], [x, -0.62 - (x + 0.6) * 0.05]], 'accent')),
      ...path([[0.3, -0.3], [0.6, -0.65]], 0.26, 'body'),
      blob([[0.45, -0.9], [0.85, -0.98], [1.25, -0.8], [1.28, -0.55], [0.7, -0.5], [0.45, -0.62]], 'body', {}, 1),
      ...maw(0.7, 1.28, -0.6, 0.1, 3),
      ...browEye(0.8, -0.78, 0.07, 'black', 'accent'),
      ...arm(0.4, -0.25),
      ...path([[f.wheels[f.wheels.length - 1].x, 0.32], [0.62, -0.2]], 0.07, 'chrome'),
    ],
  }],
  ['stinger-buggy', 'Stinger Buggy', 'Стелс-багі з ракетним двигуном.', 'buggy', ['#2a2a2a', '#e02a2a'], {
    parts: ['booster'], wheelie: 0.7, hideParts: true,
    skin: (f) => [
      blob([[f.tail.x, 0.2], [f.tail.x + 0.05, -0.1], [0.0, -0.2], [f.nose.x - 0.1, -0.08], [f.nose.x + 0.08, 0.12], [f.nose.x - 0.1, 0.24]], 'body', {}, 1),
      ...path([[f.tail.x + 0.3, -0.1], [f.tail.x + 0.1, -0.7], [f.tail.x - 0.15, -1.0], [f.tail.x - 0.05, -1.15]], 0.12, 'accent'),
      poly([[f.tail.x - 0.1, -1.1], [f.tail.x + 0.15, -1.2], [f.tail.x + 0.25, -0.95]], 'spike'),
      rr(f.tail.x - 0.35, -0.05, f.tail.x + 0.05, 0.15, 0.04, 'grey'),
      ...path([[-0.8, -0.1], [-0.6, -0.9], [0.2, -0.9]], 0.08, 'accent'), seg([0.62, -0.12], [0.48, -0.42], 0.08, 'accent'),
      ...seat(f.head.x + 0.05, -0.12, 0.4),
      poly([[f.tail.x + 0.1, 0.02], [f.nose.x - 0.1, -0.02], [f.nose.x - 0.1, 0.06], [f.tail.x + 0.1, 0.1]], 'accent', { flat: true }),
      ...f.wheels.map((w) => arc(w.x, w.y, w.r + 0.08, Math.PI * 1.1, Math.PI * 1.9, 0.1, 'body')), ...frontLamp(f.nose.x + 0.06, 0.02, 0.1),
      // stealth: matte faceted armour panels over the frame, and the rocket engine at the back (its flame is animated)
      poly([[f.tail.x + 0.15, -0.12], [-0.4, -0.5], [0.4, -0.45], [f.nose.x - 0.05, -0.1]], 'grey'),
      poly([[-0.4, -0.5], [0.0, -0.32], [0.4, -0.45]], 'dark'), poly([[f.tail.x + 0.15, -0.12], [-0.4, -0.5], [-0.2, -0.15]], 'dark'), poly([[0.4, -0.45], [0.1, -0.15], [f.nose.x - 0.05, -0.1]], 'dark'),
      rr(f.tail.x - 0.35, -0.2, f.tail.x + 0.15, 0.02, 0.06, 'grey'), rr(f.tail.x - 0.42, -0.22, f.tail.x - 0.3, 0.04, 0.03, 'dark'),
      ...shoulders(f.head),
    ],
    fx: (f) => [{ kind: 'flame', at: [f.tail.x - 0.44, -0.09], dir: 180, size: 0.14 }],
  }],
  ['swamp-monster', 'Swamp Monster', 'Монстр-трак із боліт, обвішаний твані й водоростями.', 'monster', ['#4a6a2a', '#a0c040'], {
    arch: 'monster',
    o: o({ open: true }),
    parts: ['teeth'], hideParts: true,
    skin: (f) => {
      const x1 = f.nose.x, top = f.roof.y;
      return [
        // reeds and a cattail growing out of the bed
        ...[[-1.35, -1.15], [-1.15, -1.3], [-0.95, -1.05]].map(([x, y]) => seg([x + 0.05, -0.6], [x, y], 0.05, 'leaf')),
        rr(-1.2, -1.42, -1.1, -1.22, 0.04, 'brown'),
        ...monsterTruck(f, { frame: 'brown' }),
        ...shoulders(f.head),
        // mud splashed up the lower body, weed dripping from every edge
        blob([[f.tail.x, -0.05], [-0.6, -0.22], [0.2, -0.1], [0.9, -0.2], [x1, -0.02], [x1, 0.04], [f.tail.x, 0.04]], 'brown', {}, 1),
        ...[[-1.25, -0.62, 0.25], [-0.75, -0.62, 0.18], [0.45, -0.58, 0.3], [0.95, -0.52, 0.2], [x1 - 0.1, -0.4, 0.22]].map(([x, y, h]) => blob([[x - 0.08, y], [x + 0.08, y], [x + 0.03, y + h], [x - 0.02, y + h * 0.7]], 'accent', {}, 1)),
        ...[f.roof.x0 + 0.1, f.roof.x1 - 0.1].map((x) => blob([[x - 0.07, top], [x + 0.07, top], [x + 0.02, top + 0.25]], 'accent', {}, 1)),
        ell(-0.3, -0.66, 0.18, 0.05, 'leaf'), circ(-0.25, -0.75, 0.06, 'pink'),
      ];
    },
  }],
  ['jet-golf-cart', 'Jet Golf Cart', 'Гольф-кар із реактивним двигуном і драйвером.', 'buggy', ['#f0f0f0', '#3aa04a'], {
    s: 0.85, parts: ['booster'], wheelie: 0.7, hideParts: true,
    fx: (f) => [{ kind: 'flame', at: [f.tail.x - 0.55, -0.15], dir: 180, size: 0.1 }],
    skin: (f) => [
      tank(f.tail.x - 0.45, f.tail.x + 0.2, -0.15, 0.17, 'chrome'), rr(f.tail.x - 0.55, -0.24, f.tail.x - 0.4, -0.06, 0.03, 'red'),
      blob([[f.tail.x, 0.22], [f.tail.x, -0.15], [-0.3, -0.12], [0.6, -0.1], [f.nose.x, 0.0], [f.nose.x, 0.22]], 'body', {}, 1),
      ...seat(f.head.x + 0.05, -0.12, 0.42, 'accent'),
      seg([-0.85, -0.12], [-0.75, f.roof.y], 0.07, 'chrome'), seg([0.53, -0.1], [0.41, -0.36], 0.07, 'chrome'),
      rr(f.roof.x0 - 0.15, f.roof.y - 0.12, f.roof.x1 + 0.15, f.roof.y + 0.02, 0.05, 'accent'),
      ...checkers(-1.2, -0.03, 1.2, 0.07, 12, 2, 'white', 'leaf'),
      poly([[0.45, -0.1], [0.6, -0.1], [0.48, f.roof.y + 0.05], [0.4, f.roof.y + 0.05]], 'glass'), ...frontLamp(f.nose.x, -0.02, 0.1),
      ...fenders(f, 'body', 0.08),
      ...shoulders(f.head, { depth: 0.34 }),
    ],
  }],
  ['bumper-concept', 'Bumper Concept', 'Концепт-бампер: гумове коло й удар з розгону.', 'blob', ['#ffd020', '#2a6ae0'], {
    o: o({ shape: 'flat' }), parts: ['ram'], bounce: 0.45, noLights: true, hideParts: true,
    skin: (f) => [
      // the rubber ring: one fat inflated tube right round the pod (a bumper boat on wheels)
      rr(f.tail.x - 0.2, -0.82, f.nose.x + 0.32, 0.14, 0.45, 'rubber'),
      rr(f.tail.x + 0.0, -0.68, f.nose.x + 0.12, 0.0, 0.32, 'dark'),
      ...[f.tail.x + 0.2, 0.0, f.nose.x - 0.1].map((x) => rect(x - 0.03, -0.82, x + 0.03, -0.68, 'grey', { flat: true })),
      rr(f.tail.x - 0.05, -0.25, f.nose.x + 0.25, 0.08, 0.16, 'rubber'),
      blob([[f.tail.x + 0.1, -0.2], [f.tail.x + 0.1, -0.5], [-0.3, -0.58], [0.6, -0.45], [f.nose.x - 0.05, -0.2]], 'body', {}, 2),
      ell(0, -0.42, 0.32, 0.12, 'accent'), starShape(0.75, -0.35, 0.1, 'white'),
      rr(f.tail.x + 0.05, -0.15, f.nose.x + 0.15, -0.06, 0.03, 'grey', { flat: true }), poly([[f.tail.x + 0.15, -0.3], [f.nose.x - 0.1, -0.26], [f.nose.x - 0.1, -0.2], [f.tail.x + 0.15, -0.24]], 'accent', { flat: true }),
      ...shoulders(f.head),
    ],
  }],
  ['throne-racer', 'Throne Racer', 'Гоночний унітаз. Так, справді.', 'cart', ['#f4f4f4', '#5ab0e0'], {
    o: o({ mat: 'white' }), noLights: true,
    skin: (f) => [
      rr(f.tail.x + 0.05, f.deck.y - 0.9, f.tail.x + 0.55, f.deck.y + 0.05, 0.06, 'white'), rr(f.tail.x, f.deck.y - 1.0, f.tail.x + 0.6, f.deck.y - 0.88, 0.04, 'accent'),
      rect(f.tail.x + 0.4, f.deck.y - 0.75, f.tail.x + 0.5, f.deck.y - 0.68, 'chrome'),
      blob([[f.tail.x + 0.3, f.deck.y + 0.08], [f.nose.x, f.deck.y], [f.nose.x - 0.1, f.deck.y + 0.25], [0.3, 0.12], [-0.2, 0.12]], 'white', {}, 2),
      ell(0.15, f.deck.y - 0.02, 0.72, 0.1, 'accent'), ell(0.15, f.deck.y - 0.02, 0.52, 0.06, 'sky'),
      rr(-0.4, 0.14, 0.6, 0.3, 0.05, 'dark'), ...[[-0.9, -0.5], [0.5, f.deck.y - 0.2]].map(([x, y]) => circ(x, y, 0.06, 'sky')),
      rr(-0.25, 0.08, 0.35, 0.2, 0.04, 'white'),
      ...shoulders(f.head),
    ],
  }],
  ['wheelie-king', 'Wheelie King', 'Трюковий дрегстер, що весь час стає на диби.', 'dragster', ['#e02a8a', '#ffd23f'], {
    parts: ['booster'], hideParts: true,
    skin: (f) => [
      rr(f.tail.x - 0.35, -0.12, f.tail.x + 0.1, 0.12, 0.05, 'grey'), rr(f.tail.x - 0.45, -0.08, f.tail.x - 0.3, 0.08, 0.03, 'red'),
      ...dragsterBody(f),
      ...shoulders(f.head),
      ...seat(-0.95, -0.15, 0.45, 'accent'),
      starShape(0.6, 0.05, 0.15, 'accent'),
      ...[-1.2, -0.8].map((x) => poly([[x - 0.15, -0.15], [x + 0.15, -0.15], [x, -0.42]], 'gold')),
      ...path([[f.tail.x + 0.2, 0.2], [f.tail.x - 0.5, 0.35]], 0.05, 'chrome'), circ(f.tail.x - 0.55, 0.36, 0.08, 'rubber'),
    ],
  }],
  ['bubble-blaster', 'Bubble Blaster', 'Фургон-бульбашкомет. Бульбашка піднімає суперника в повітря.', 'van', ['#5ab0ff', '#ffffff'], {
    s: 0.9, parts: ['bubble'], hideParts: true,
    skin: (f) => [
      ...boxy(f, { round: 0.2, slope: 0.3, slopeH: 0.45 }),
      circ(f.nose.x - 0.1, -0.3, 0.22, 'accent'), circ(f.nose.x - 0.1, -0.3, 0.13, 'sky'),
      ...[[-1.0, -0.25, 0.14], [-0.45, -0.1, 0.1], [0.15, -0.3, 0.12]].flatMap(([x, y, r]) => [circ(x, y, r, 'sky'), circ(x - r * 0.35, y - r * 0.35, r * 0.3, 'white')]),
      tank(f.tail.x + 0.1, f.tail.x + 0.9, f.roof.y - 0.1, 0.1, 'pink'),
      ...shoulders(f.head, { depth: 0.34 }),
    ],
    // soap bubbles drifting up off the roof tank (animated)
    fx: (f) => [{ kind: 'bubble', at: [f.tail.x + 0.5, f.roof.y - 0.25], dir: -100, size: 0.3, mat: 'sky' }],
  }],
  ['chomp-shark', 'Chomp Shark', 'Авто з клацаючою пащею акули.', 'sports', ['#3a6ad0', '#ffffff'], {
    parts: ['fin'], noLights: true, hideParts: true,
    skin: (f) => [
      ...fishCar(f, { top: -0.72 }),
      ...shoulders(f.head),
      // racing number on the flank, scars on the snout
      circ(0.25, -0.25, 0.16, 'white'), rect(0.22, -0.35, 0.28, -0.15, 'black', { flat: true }),
      ...[0, 1].map((i) => seg([f.nose.x - 0.45 + i * 0.1, -0.42], [f.nose.x - 0.35 + i * 0.1, -0.3], 0.03, 'dark')),
    ],
  }],
  ['rocket-board', 'Rocket Board', 'Скейт-ракета: дошка, двигун і ніякого здорового глузду.', 'rocket', ['#ff8a1a', '#2a2a2a'], {
    s: 0.9, parts: ['booster'], hideParts: true,
    fx: (f) => [{ kind: 'flame', at: [f.tail.x - 0.32, f.wheels[0].y - f.wheels[0].r - 0.18], dir: 180, size: 0.12 }],
    // A skateboard with a rocket strapped on: the deck and trucks are the car, the rocket sits behind the rider.
    skin: (f) => {
      const a = f.wheels[0], b = f.wheels[1], d = a.y - a.r - 0.16;
      return [
        // the rocket, strapped to the deck behind the rider (its flame is animated)
        rr(f.tail.x - 0.32, d - 0.22, f.tail.x - 0.12, d + 0.18, 0.04, 'dark'),
        rr(f.tail.x - 0.15, d - 0.32, -0.35, d + 0.02, 0.15, 'body'), poly([[-0.4, d - 0.32], [-0.1, d - 0.17], [-0.4, d + 0.02]], 'accent'),
        ...shoulders(f.head),
        poly([[f.tail.x, d - 0.3], [f.tail.x + 0.15, d - 0.55], [f.tail.x + 0.35, d - 0.3]], 'accent'),
        ...[f.tail.x + 0.4, -0.65].map((x) => rect(x - 0.03, d - 0.33, x + 0.03, d + 0.02, 'grey')),
        // the deck: a long wooden board with kicked-up tail and nose, grip tape and a flame graphic
        blob([[f.tail.x - 0.12, d - 0.14], [f.tail.x + 0.05, d], [f.nose.x - 0.05, d], [f.nose.x + 0.15, d - 0.14], [f.nose.x + 0.12, d + 0.04], [f.nose.x - 0.1, d + 0.1], [f.tail.x + 0.1, d + 0.1], [f.tail.x - 0.15, d + 0.02]], 'wood', {}, 1),
        rect(f.tail.x + 0.1, d - 0.02, f.nose.x - 0.1, d + 0.02, 'black', { flat: true }),
        ...flameDecal(f.nose.x - 0.2, -0.1, d + 0.06, 0.06),
        // trucks down to the little wheels
        ...[a, b].flatMap((w) => [rr(w.x - 0.18, d + 0.08, w.x + 0.18, d + 0.16, 0.03, 'chrome'), poly([[w.x - 0.08, d + 0.14], [w.x + 0.08, d + 0.14], [w.x + 0.03, w.y], [w.x - 0.03, w.y]], 'grey')]),
      ];
    },
  }],
  ['woodie-surfer', 'Woodie Surfer', 'Дерев\'яний універсал серфера з дошкою на даху.', 'sedan', ['#c08a4a', '#ffffff'], {
    o: o({ mat: 'wood' }),
    skin: (f) => [
      ...sedan(f, { roof: 'wagon', mat: 'wood' }),
      ...shoulders(f.head),
      blob([[f.nose.x - 0.5, -0.18], [f.nose.x - 0.25, -0.16], [f.nose.x, -0.05], [f.nose.x, 0.3], [f.nose.x - 0.5, 0.3]], 'white', {}, 1),
      ...grille(f.nose.x - 0.06, -0.08, f.nose.x + 0.04, 0.16, 2),
      blob([[f.roof.x0 - 0.6, f.roof.y - 0.08], [f.roof.x0 - 0.3, f.roof.y - 0.2], [f.roof.x1 + 0.4, f.roof.y - 0.22], [f.roof.x1 + 0.9, f.roof.y - 0.12], [f.roof.x1 + 0.4, f.roof.y - 0.04]], 'accent', {}, 1),
      stripe(f.roof.x0 - 0.3, f.roof.x1 + 0.6, f.roof.y - 0.13, 0.04, 'red'),
      ...[f.roof.x0 - 0.1, f.roof.x1 + 0.1].map((x) => rect(x, f.roof.y - 0.1, x + 0.05, f.roof.y, 'black')), ...[[-0.8, -0.05], [-0.2, 0.0]].map(([x, y]) => starShape(x, y, 0.08, 'yellow')),
    ],
  }],
  ['piranha-racer', 'Piranha Racer', 'Хижа риба-болід із гострим плавником.', 'sports', ['#e04a2a', '#ffd23f'], {
    parts: ['teeth', 'fin'], noLights: true, hideParts: true,
    skin: (f) => [
      ...fishCar(f, { top: -0.48, jaw: 'piranha', belly: 'orange', fin: 'accent' }),
      ...shoulders(f.head),
      ...[[-0.6, -0.25], [-0.2, -0.3], [0.2, -0.25], [-0.4, -0.05], [0.0, -0.08]].map(([x, y]) => arc(x, y, 0.08, Math.PI * 0.1, Math.PI * 0.9, 0.04, 'dark')),
      ...spikesAlong(f.head.x + 0.4, f.nose.x - 0.6, -0.48, 3, 0.12, 'accent'),
    ],
  }],
  ['soda-popper', 'Soda Popper', 'Пляшка газованки на колесах. Стріляє корком.', 'rocket', ['#3a8a3a', '#e02a2a'], {
    gun: (f) => ({ at: [[f.nose.x + 0.05, 0]], aim: 4 }),
    o: o({ mat: 'glass' }),
    skin: (f) => [
      blob([[f.tail.x, -0.32], [0.4, -0.32], [0.9, -0.15], [f.nose.x - 0.25, -0.12], [f.nose.x - 0.25, 0.12], [0.9, 0.15], [0.4, 0.32], [f.tail.x, 0.32]], 'green', {}, 1),
      rr(f.nose.x - 0.3, -0.16, f.nose.x + 0.05, 0.16, 0.04, 'tan'),
      rr(-1.2, -0.27, 0.35, 0.27, 0.04, 'accent'), rr(-0.9, -0.14, 0.05, 0.1, 0.04, 'white'), rect(-0.75, -0.06, -0.1, 0.02, 'red', { flat: true }),
      ...[[-1.4, -0.1], [-1.25, 0.15], [0.6, -0.05], [0.75, 0.08]].map(([x, y]) => circ(x, y, 0.05, 'white')),
      rect(f.tail.x, -0.32, f.tail.x + 0.12, 0.32, 'dark'),
      rect(-1.0, -0.3, 0.6, -0.26, 'white', { flat: true }), rr(-1.2, 0.3, 1.0, 0.4, 0.04, 'dark'),
      // a big label round the bottle and glass highlights; the fizz bubbling out round the cork is animated
      rr(-0.6, -0.33, 0.25, 0.33, 0.04, 'accent'), rect(-0.5, -0.1, 0.15, 0.1, 'white', { flat: true }), rect(-0.4, -0.04, 0.05, 0.04, 'accent', { flat: true }),
      rr(f.tail.x + 0.1, -0.26, 0.8, -0.2, 0.03, 'white', { flat: true }),
      ...shoulders(f.head),
    ],
    fx: (f) => [{ kind: 'bubble', at: [f.nose.x + 0.1, -0.2], dir: -60, size: 0.16 }],
  }],
  ['aero-fire-engine', 'Aero Fire Engine', 'Обтічна пожежна машина-концепт.', 'sports', ['#e02a2a', '#f0f0f0'], {
    o: o({ len: 1.15 }), parts: ['siren'], hideParts: true,
    skin: (f) => [
      ...wedge(f),
      ...shoulders(f.head),
      stripe(f.tail.x, f.nose.x - 0.1, 0.02, 0.06, 'white'),
      ...ladder([f.tail.x - 0.1, -0.32], [0.4, -0.36], 0.14, 'chrome'),
      ...lightbar(-0.35, 0.1, -0.48),
      circ(f.nose.x - 0.35, -0.08, 0.08, 'gold'),
    ],
  }],
  ['aero-bus', 'Aero Bus', 'Обтічний концептуальний автобус.', 'bus', ['#e0e0e0', '#3a6ad8'], {
    o: o({ tall: 0.8 }), speed: 1.1,
    skin: (f) => [
      blob([[f.tail.x, 0.3], [f.tail.x, f.roof.y + 0.2], [f.tail.x + 0.3, f.roof.y], [f.nose.x - 1.0, f.roof.y], [f.nose.x - 0.1, f.roof.y + 0.45], [f.nose.x, 0.3]], 'body', {}, 2),
      ...shoulders(f.head),
      blob([[f.tail.x + 0.25, f.roof.y + 0.15], [f.nose.x - 1.0, f.roof.y + 0.12], [f.nose.x - 0.2, f.roof.y + 0.45], [f.nose.x - 0.25, f.roof.y + 0.5], [f.tail.x + 0.25, f.roof.y + 0.42]], 'glass', {}, 1),
      ...[-1.3, -0.7, -0.1, 0.5].map((x) => rect(x, f.roof.y + 0.12, x + 0.05, f.roof.y + 0.48, 'body', { flat: true })),
      poly([[f.tail.x, -0.05], [f.nose.x, -0.25], [f.nose.x, -0.12], [f.tail.x, 0.08]], 'accent', { flat: true }),
      ...fenders(f, 'body', 0.1), ...frontLamp(f.nose.x, 0.05), rearLamp(f.tail.x, 0.05), rect(-0.3, -0.05, 0.1, 0.25, 'body', { ring: true }),
    ],
  }],
  ['school-racer', 'School Racer', 'Шкільний автобус із ракетним двигуном.', 'bus', ['#ffc020', '#1a1a1a'], {
    parts: ['booster'], speed: 1.1, hideParts: true,
    skin: (f) => [
      tank(f.tail.x - 0.5, f.tail.x + 0.3, -0.3, 0.22, 'chrome'), rr(f.tail.x - 0.6, -0.42, f.tail.x - 0.45, -0.18, 0.03, 'red'),
      ...boxy(f, { slope: 0.15, slopeH: 0.5, round: 0.1, win: 5, winX: [f.tail.x + 0.15, f.nose.x - 0.4], winY: [f.roof.y + 0.12, f.roof.y + 0.45] }),
      stripe(f.tail.x, f.nose.x, -0.05, 0.07, 'accent'), stripe(f.tail.x, f.nose.x, 0.12, 0.07, 'accent'),
      ...flameDecal(f.nose.x - 0.2, f.nose.x - 1.6, 0.03, 0.2),
      poly([[f.tail.x - 0.6, -0.4], [f.tail.x - 0.95, -0.3], [f.tail.x - 0.6, -0.2]], 'orange'), ...[f.roof.x0 + 0.2, f.roof.x1 - 0.3].map((x) => circ(x, f.roof.y - 0.05, 0.06, 'red')),
      ...shoulders(f.head),
    ],
  }],
  ['hot-dog-racer', 'Hot Dog Racer', 'Хот-дог на гоночному шасі: булка, сосиска, гірчиця.', 'blob', ['#c86a3a', '#ffd020'], {
    o: o({ shape: 'flat', len: 1.2 }), noLights: true,
    skin: (f) => [
      rr(-1.6, -0.55, 1.6, -0.15, 0.2, 'red'),
      ...path([[-1.2, -0.48], [-0.9, -0.58], [-0.6, -0.46], [-0.3, -0.58], [0.0, -0.46], [0.3, -0.58], [0.6, -0.46], [0.9, -0.58], [1.2, -0.46]], 0.07, 'accent'),
      blob([[-1.45, -0.25], [-1.5, 0.05], [-1.2, 0.25], [1.2, 0.25], [1.5, 0.05], [1.45, -0.25]], 'tan', {}, 2),
      stripe(-1.3, 1.3, 0.05, 0.05, 'brown'), ...[-1.0, -0.4, 0.2, 0.8].map((x) => ell(x, -0.15, 0.06, 0.03, 'cream')),
      rr(-1.2, 0.22, 1.2, 0.36, 0.05, 'dark'), ...frontLamp(1.45, 0.1, 0.1),
      ...shoulders(f.head),
    ],
  }],
  ['turbo-taxi', 'Turbo Taxi', 'Тюнінговане спортивне таксі з антикрилом.', 'sports', ['#ffd020', '#1a1a1a'], {
    parts: ['wing', 'sign'], hideParts: true,
    skin: (f) => [
      ...sedan(f, { roof: 'coupe', top: -0.5, rx0: -0.7, rx1: 0.05 }),
      ...checkers(f.tail.x + 0.2, -0.04, f.nose.x - 0.2, 0.06, 14),
      seg([f.tail.x + 0.25, -0.12], [f.tail.x + 0.2, -0.38], 0.07, 'black'), rr(f.tail.x - 0.1, -0.5, f.tail.x + 0.55, -0.36, 0.03, 'black'),
      rr(-0.45, -0.66, -0.05, -0.5, 0.04, 'white'), rect(-0.4, -0.62, -0.1, -0.54, 'black', { flat: true }),
      rr(-0.1, 0.12, 0.35, 0.24, 0.04, 'black'), circ(0.6, 0.0, 0.12, 'white'), rect(0.57, -0.07, 0.63, 0.07, 'black', { flat: true }),
      // the TAXI sign on the roof and a checker band: it is still a taxi, only tuned
      rr(-1.15, -0.85, -0.55, -0.6, 0.04, 'light'), ...[0, 1, 2, 3].map((i) => rect(-1.08 + i * 0.13, -0.78, -1.0 + i * 0.13, -0.67, 'black', { flat: true })), rect(-0.89, -0.6, -0.81, -0.5, 'black'),
      ...shoulders(f.head),
    ],
  }],
  ['oval-racer', 'Oval Racer', 'Болід для кільцевих перегонів із номером.', 'formula', ['#2a6ae0', '#ffd23f'], {
    skin: (f) => [...formula(f, { num: true }), ...checkers(0.6, -0.04, 1.5, 0.06, 6), circ(-0.95, 0.06, 0.13, 'white'), ...shoulders(f.head)],
  }],
  ['skull-ram', 'Skull Ram', 'Броньовик із велетенським черепом-тараном.', 'monster', ['#3a3a3a', '#e8dcc0'], {
    o: o({ open: true }),
    parts: ['skull'], arch: 'ram', hideParts: true,
    skin: (f) => [
      ...monsterChassis(f),
      rr(f.tail.x, -0.6, f.nose.x - 0.3, 0.08, 0.1, 'body'),
      ...shoulders(f.head),
      ...spikesAlong(f.tail.x + 0.2, f.nose.x - 0.6, -0.58, 5, 0.16, 'spike'),
      ...skull(f.nose.x - 0.3, -0.4, 0.32),
      poly([[f.nose.x - 0.7, -0.6], [f.nose.x - 0.95, -0.85], [f.nose.x - 0.55, -0.65]], 'bone'), poly([[f.nose.x + 0.05, -0.6], [f.nose.x + 0.3, -0.85], [f.nose.x - 0.05, -0.65]], 'bone'),
      ...[f.tail.x + 0.3, f.tail.x + 0.9, f.tail.x + 1.5].map((x) => circ(x, -0.25, 0.04, 'grey')), rect(f.tail.x + 0.1, -0.12, f.nose.x - 0.6, -0.08, 'red', { flat: true }),
      ...stack(f.tail.x + 0.35, -0.6, 0.45, 0.1, 'grey'),
    ],
  }],
  ['night-bat-rod', 'Night Bat Rod', 'Низький вампірський хот-род із крилами-плавниками.', 'sports', ['#2a1a3a', '#c02a3a'], {
    axles: [1.2, 0.85],
    parts: ['fangs'],
    skin: (f) => [
      // bat-wing tail fins: scalloped membranes stretched over bony fingers
      poly([[f.tail.x + 0.2, -0.15], [-0.3, -0.2], [-0.5, -0.95], [-0.8, -0.65], [-1.05, -0.9], [-1.2, -0.55], [-1.5, -0.75], [-1.55, -0.35], [-1.8, -0.4]], 'accent'),
      ...[[-0.5, -0.95], [-1.05, -0.9], [-1.5, -0.75]].map(([x, y]) => seg([-0.45, -0.2], [x, y], 0.04, 'black')),
      poly([[-0.6, -0.18], [-0.95, -0.7], [-1.25, -0.5], [-1.35, -0.3]], 'red'),
      ...wedge(f, 'body', 'dark'),
      ...shoulders(f.head),
      ...angry(f.nose.x - 0.5, -0.1, 0.1, 'red'),
      poly([[f.nose.x - 0.25, 0.14], [f.nose.x - 0.15, 0.14], [f.nose.x - 0.2, 0.28]], 'white'),
    ],
  }],
  ['scorpion-gt', 'Scorpion GT', 'Спорткар-скорпіон: хвіст із жалом над дахом і клешні.', 'sports', ['#c88a2a', '#2a2a2a'], {
    noLights: true,
    skin: (f) => {
      const n = f.nose.x, t = f.tail.x;
      const tail: [number, number][] = [[t + 0.25, -0.1], [t + 0.0, -0.55], [t + 0.15, -0.95], [t + 0.55, -1.15], [t + 0.95, -1.05]];
      return [
        // legs out under the body
        ...[-1.0, -0.6, -0.2, 0.2].map((x) => path([[x, 0.0], [x - 0.15, 0.15], [x - 0.08, 0.3]], 0.06, 'dark')).flat(),
        ...wedge(f, 'body', 'dark'),
        ...shoulders(f.head),
        ...[0, 1, 2, 3].map((i) => rect(-1.2 + i * 0.45, -0.1, -1.1 + i * 0.45, 0.2, 'accent', { flat: true })),
        // segmented tail curling over the roof to a yellow stinger
        ...path(tail, 0.2, 'body'), ...tail.map(([x, y], i) => circ(x, y, 0.13 - i * 0.012, 'body', { ring: true })),
        poly([[t + 1.0, -1.15], [t + 1.3, -0.92], [t + 1.0, -0.95]], 'accent'),
        // two pincers reaching forward from the nose
        ...[[-0.04, 'body'], [0.12, 'dark']].flatMap(([dy, m]) => [
          ...path([[n - 0.3, (dy as number) + 0.0], [n + 0.15, (dy as number) - 0.05]], 0.1, m as 'body'),
          blob([[n + 0.1, (dy as number) - 0.18], [n + 0.5, (dy as number) - 0.2], [n + 0.55, (dy as number) - 0.05], [n + 0.25, (dy as number) - 0.02], [n + 0.5, (dy as number) + 0.08], [n + 0.1, (dy as number) + 0.08]], m as 'body', {}, 1),
        ]),
        ...[0, 1].map((i) => circ(n - 0.45 + i * 0.14, -0.15, 0.045, 'accent')),
      ];
    },
  }],
  ['spider-speedster', 'Spider Speedster', 'Концепт-павук: вісім очей і вісім лап.', 'sports', ['#7a3ae0', '#7aff3a'], {
    noLights: true,
    skin: (f) => {
      const n = f.nose.x, t = f.tail.x;
      return [
        // four legs a side arching high over the car, feet down at the road
        ...[[-1.35, -0.55], [-0.85, -0.25], [0.25, 0.1], [0.75, 0.4]].flatMap(([x, k]) => path([[x + 0.25, -0.1], [x + 0.1 + k * 0.4, -0.85 + Math.abs(k) * 0.1], [x + 0.35 + k * 0.9, 0.25]], 0.07, 'black')),
        ...wedge(f, 'body', 'dark'),
        ...shoulders(f.head),
        // the abdomen bulging at the back with a red hourglass
        blob([[t - 0.1, 0.0], [t - 0.05, -0.55], [t + 0.5, -0.7], [t + 0.95, -0.45], [t + 0.9, -0.05]], 'body', {}, 2),
        poly([[t + 0.35, -0.55], [t + 0.55, -0.55], [t + 0.45, -0.38]], 'red'), poly([[t + 0.45, -0.38], [t + 0.55, -0.2], [t + 0.35, -0.2]], 'red'),
        // eight eyes in two rows and the fangs at the nose
        ...[0, 1, 2, 3].flatMap((i) => [circ(n - 0.62 + i * 0.13, -0.12, 0.055, 'accent'), circ(n - 0.56 + i * 0.13, 0.0, 0.04, 'accent')]),
        ...fangs(n - 0.2, n + 0.02, 0.16, 2, 0.14),
        // the eight eyes, clustered on the nose
        ...[[0, 0, 0.07], [0.12, -0.03, 0.06], [-0.1, 0.05, 0.05], [0.05, 0.1, 0.05], [0.2, 0.06, 0.04], [-0.05, -0.1, 0.04], [0.16, -0.12, 0.035], [-0.15, -0.06, 0.035]].map(([dx, dy, r]) => circ(n - 0.5 + dx * 1.6, -0.32 + dy * 1.6, r * 1.5, 'red')),
      ];
    },
  }],
  ['mini-tank', 'Mini Tank', 'Мініатюрний танк із короткою гарматою.', 'tracked', ['#3a8a3a', '#ffd23f'], {
    gun: () => ({ at: [[1.3, -0.76]], aim: 12 }),
    o: o({ wheel: 1.35 }), s: 0.68, parts: [['cannon', 0.7]], hideParts: true,
    skin: (f) => [
      ...tracks(f),
      blob([[-1.6, 0.0], [-1.5, -0.32], [1.2, -0.36], [1.7, -0.05], [1.5, 0.05]], 'body', {}, 1),
      blob([[-0.8, -0.32], [-0.65, -0.78], [0.3, -0.8], [0.6, -0.32]], 'body', {}, 1),
      ...path([[0.4, -0.58], [1.2, -0.75]], 0.16, 'grey'), rr(1.1, -0.85, 1.3, -0.64, 0.04, 'dark'),
      starShape(-0.2, -0.55, 0.13, 'accent'), rr(-0.55, -0.88, -0.15, -0.78, 0.04, 'dark'),
      rr(-1.55, -0.06, 1.55, 0.1, 0.04, 'body', { ring: true }), ...[-1.2, -0.6, 0.0, 0.6, 1.2].map((x) => circ(x, 0.02, 0.03, 'dark')),
      ...shoulders(f.head, { depth: 0.5 }),
    ],
  }],
  ['bone-speedster', 'Bone Speedster', 'Низький спідстер із хребта й ребер.', 'formula', ['#e8dcc0', '#2a2a2a'], {
    axles: [1.15, 0.85],
    o: o({ mat: 'bone' }),
    skin: (f) => [
      ...path([[f.tail.x + 0.1, 0.06], [f.nose.x - 0.25, 0.04]], 0.16, 'bone'),
      ...[-1.2, -0.9, -0.6, 0.4, 0.7, 1.0].map((x) => path([[x, 0.05], [x + 0.06, -0.2], [x + 0.18, -0.24]], 0.08, 'bone')).flat(),
      ...seat(f.head.x + 0.05, -0.02, 0.4, 'dark'),
      ...skull(f.nose.x - 0.1, -0.02, 0.15),
      rr(f.tail.x - 0.05, -0.55, f.tail.x + 0.5, -0.42, 0.05, 'bone'), seg([f.tail.x + 0.22, -0.42], [f.tail.x + 0.22, 0.0], 0.09, 'bone'),
      ...[-1.0, -0.5, 0.0, 0.5, 1.0].map((x) => circ(x, 0.05, 0.11, 'bone')), rr(-0.5, -0.06, 0.4, 0.16, 0.05, 'bone'),
      ...shoulders(f.head),
    ],
  }],
  ['twin-devil', 'Twin Devil', 'Дводвигунний дрегстер із рогами й вогнем.', 'dragster', ['#c02a2a', '#1a1a1a'], {
    parts: ['horns', 'booster'], hideParts: true,
    skin: (f) => [
      rr(f.tail.x - 0.35, -0.12, f.tail.x + 0.1, 0.12, 0.05, 'grey'), rr(f.tail.x - 0.45, -0.08, f.tail.x - 0.3, 0.08, 0.03, 'red'),
      ...dragsterBody(f),
      ...shoulders(f.head),
      ...seat(-0.95, -0.15, 0.45, 'black'),
      ...[-0.55, -0.2].map((x) => [rr(x, -0.52, x + 0.28, -0.18, 0.05, 'chrome'), ...[0, 1, 2].map((i) => rect(x + 0.02 + i * 0.09, -0.66, x + 0.08 + i * 0.09, -0.52, 'chrome'))]).flat(),
      
      ...flameDecal(1.5, -0.2, 0.06, 0.2),
    ],
  }],
  ['big-head-racer', 'Big Head Racer', 'Вінтажний болід, у якому водій більший за машину.', 'formula', ['#c08a2a', '#2a2a2a'], {
    // A tiny car: the head keeps its full size, so the driver ends up bigger than the car.
    s: 0.68, o: o({ rim: 'spokes', wheel: 1.15 }),
    art: (f) => [{ ...headrest(f), deco: false }],
    skin: (f) => [
      ell(0.0, 0.0, f.nose.x - 0.15, 0.3, 'body', {}, 28), stripe(-1.0, f.nose.x - 0.6, 0.14, 0.05, 'red'),
      ...[0, 1, 2, 3].map((i) => rect(-0.85 + i * 0.15, -0.14, -0.8 + i * 0.15, 0.06, 'dark', { flat: true })),
      ell(f.nose.x - 0.4, 0.04, 0.24, 0.17, 'grey'), ...[0, 1, 2].map((i) => rect(f.nose.x - 0.5 + i * 0.07, -0.06, f.nose.x - 0.46 + i * 0.07, 0.14, 'black', { flat: true })),
      circ(0.4, 0.04, 0.13, 'white'), rect(0.36, -0.03, 0.44, 0.11, 'black', { flat: true }),
      ...path([[-0.1, -0.06], [0.15, -0.28]], 0.05, 'black'),
      ...path([[0.0, 0.18], [-0.8, 0.22], [f.tail.x + 0.2, 0.16]], 0.06, 'chrome'),
      ...shoulders(f.head, { depth: 0.5 }),
    ],
  }],
  ['knight-dragster', 'Knight Dragster', 'Болід-дракон у лицарському обладунку зі списом.', 'dragster', ['#a0a8b8', '#e02a2a'], {
    parts: [['spikes', 0.55]],
    skin: (f) => [
      rr(f.tail.x - 0.1, -0.1, f.tail.x + 0.2, 0.12, 0.05, 'grey'),
      ...dragsterBody(f),
      ...[-1.6, -1.2, -0.8].map((x) => rect(x, -0.2, x + 0.3, 0.2, 'body', { ring: true })),
      ...path([[0.0, -0.32], [2.6, -0.36]], 0.07, 'wood'), poly([[2.5, -0.44], [2.5, -0.28], [2.95, -0.36]], 'spike'),
      blob([[-0.45, -0.18], [0.1, -0.18], [0.05, 0.22], [-0.15, 0.34], [-0.35, 0.22]], 'accent', {}, 1), rect(-0.18, -0.15, -0.12, 0.25, 'white', { flat: true }), rect(-0.35, 0.0, 0.05, 0.05, 'white', { flat: true }),
      ...shoulders(f.head),
    ],
  }],
  ['rotty-racer', 'Rotty Racer', 'Машина-ротвейлер із шипованим нашийником.', 'creature', ['#2a2220', '#c07a3a'], {
    o: o({ tall: 1.15, wheel: 0.8 }), parts: ['ears', 'snout'], noLights: true, hideParts: true,
    skin: (f) => [
      ...quadruped(f, { tail: 0.25, tailUp: 0.3, leg: 0.3, belly: 'accent', saddle: 'red', chest: 0.95 }),
      ...[[-0.95, -0.15], [0.62, -0.15]].map(([x, y]) => ell(x, y, 0.12, 0.08, 'accent')),
      // spiked collar
      rr(0.62, -0.88, 0.92, -0.38, 0.05, 'red'), ...[-0.75, -0.6, -0.45].map((y) => poly([[0.88, y - 0.05], [0.88, y + 0.05], [1.0, y]], 'chrome')),
      // blocky rottweiler head: tan muzzle and brows, drooping ear, heavy jaw
      ...path([[0.7, -0.6], [1.0, -0.88]], 0.32, 'body'),
      ...shoulders(f.head),
      blob([[0.9, -1.2], [1.3, -1.28], [1.6, -1.15], [1.65, -0.9], [1.95, -0.88], [1.95, -0.62], [1.3, -0.6], [0.95, -0.8]], 'body', {}, 1),
      blob([[1.4, -0.92], [1.95, -0.88], [1.95, -0.62], [1.4, -0.6]], 'accent', {}, 1),
      ell(1.25, -1.0, 0.06, 0.04, 'accent'), ...eyeball(1.32, -1.06, 0.06),
      blob([[0.95, -1.15], [1.18, -1.2], [1.12, -0.85], [0.98, -0.88]], 'body', { ring: true }, 1),
      circ(1.95, -0.85, 0.065, 'black'), poly([[1.5, -0.66], [1.92, -0.66], [1.88, -0.6], [1.52, -0.6]], 'black', { flat: true }),
    ],
  }],
  ['six-wheel-mauler', 'Six-Wheel Mauler', 'Шестиколісний гірський всюдихід із лебідкою.', 'tracked', ['#e02a2a', '#2a2a2a'], {
    o: o({ wheels: 3, wheel: 1.6, cab: true }),
    skin: (f) => [
      ...f.wheels.map((w) => seg([w.x, w.y], [w.x * 0.8, -0.2], 0.1, 'dark')),
      blob([[f.tail.x - 0.05, 0.0], [f.tail.x, -0.4], [f.roof.x0 - 0.5, -0.45], [f.roof.x0 - 0.3, f.roof.y], [f.roof.x1, f.roof.y], [f.roof.x1 + 0.5, -0.45], [f.nose.x + 0.05, -0.3], [f.nose.x, 0.0]], 'body', {}, 1),
      ...shoulders(f.head),
      rr(f.roof.x0 - 0.3, f.roof.y - 0.12, f.roof.x1, f.roof.y, 0.03, 'black'), ...[0, 1, 2].map((i) => circ(f.roof.x0 - 0.15 + i * 0.3, f.roof.y - 0.16, 0.06, 'light')),
      rr(f.nose.x - 0.1, -0.2, f.nose.x + 0.2, 0.1, 0.04, 'grey'), circ(f.nose.x + 0.05, -0.05, 0.08, 'dark'),
      stripe(f.tail.x, f.nose.x, -0.15, 0.07, 'accent'), ...frontLamp(f.nose.x + 0.05, -0.32, 0.1), rearLamp(f.tail.x, -0.3),
      ...f.wheels.map((w) => arc(w.x, w.y, w.r + 0.08, Math.PI * 1.15, Math.PI * 1.85, 0.1, 'dark')), rect(f.roof.x0 - 0.2, -0.4, f.roof.x0 - 0.16, 0.0, 'dark', { flat: true }),
    ],
  }],
  ['volt-spike', 'Volt Spike', 'Електричний болід із шипами.', 'sports', ['#2a2a3a', '#ffd23f'], {
    parts: ['spikes'],
    skin: (f) => [
      ...wedge(f), poly([[-1.0, -0.14], [-0.5, -0.14], [-0.7, 0.0], [-0.2, 0.0], [-0.9, 0.24], [-0.7, 0.08], [-1.1, 0.08]], 'accent', { flat: true }), ...spikesAlong(-1.4, -0.6, -0.2, 3, 0.15, 'accent'),
      ...shoulders(f.head),
      // electricity: a tesla coil behind the driver; the arcs crackling off it and the nose are animated
      rr(-1.0, -0.62, -0.85, -0.18, 0.03, 'grey'), ...[-0.55, -0.48, -0.41].map((y) => rr(-1.06, y, -0.79, y + 0.04, 0.02, 'gold')), circ(-0.92, -0.7, 0.1, 'sky'),
    ],
    fx: (f) => [
      { kind: 'bolt', at: [-0.92, -0.75], to: [-0.35, -0.98], size: 0.14, mat: 'sky' },
      { kind: 'bolt', at: [f.nose.x - 0.4, -0.25], to: [f.nose.x + 0.1, -0.5], size: 0.12, mat: 'sky' },
    ],
  }],
  ['toaster-racer', 'Toaster Racer', 'Тостер на колесах. Стріляє гарячими тостами.', 'box', ['#c0c8d0', '#c08a4a'], {
    gun: (f) => ({ at: [[f.roof.x0 + 0.42, f.roof.y - 0.38], [f.roof.x0 + 0.92, f.roof.y - 0.32]], aim: 72 }),
    s: 0.8, o: o({ mat: 'metal' }), parts: ['toast'], wheelie: 0.7, air: 1.4, hideParts: true,
    skin: (f) => [
      rr(f.roof.x0 + 0.25, f.roof.y - 0.35, f.roof.x0 + 0.6, f.roof.y + 0.1, 0.08, 'tan'), rr(f.roof.x0 + 0.75, f.roof.y - 0.28, f.roof.x0 + 1.1, f.roof.y + 0.1, 0.08, 'tan'),
      rr(f.tail.x, f.roof.y, f.nose.x, 0.3, 0.22, 'chrome'),
      rect(f.roof.x0 + 0.2, f.roof.y, f.roof.x0 + 0.65, f.roof.y + 0.08, 'black'), rect(f.roof.x0 + 0.7, f.roof.y, f.roof.x0 + 1.15, f.roof.y + 0.08, 'black'),
      rr(f.nose.x - 0.3, -0.55, f.nose.x - 0.12, -0.1, 0.04, 'dark'), circ(-0.6, -0.25, 0.13, 'black'), circ(-0.6, -0.25, 0.05, 'chrome'),
      stripe(f.tail.x + 0.1, f.nose.x - 0.1, -0.02, 0.06, 'accent'),
      ...[-0.9, 0.9].map((x) => rect(x - 0.2, 0.25, x + 0.2, 0.32, 'black')),
      ...[-0.3, -0.1, 0.1, 0.3].map((x) => rect(x, -0.32, x + 0.08, -0.12, 'dark', { flat: true })), rr(f.nose.x - 0.05, -0.2, f.nose.x + 0.08, 0.05, 0.03, 'black'), ...frontLamp(f.nose.x + 0.08, -0.32, 0.1),
      rect(f.tail.x + 0.15, f.roof.y + 0.15, f.nose.x - 0.15, f.roof.y + 0.2, 'white', { flat: true }),
      ...shoulders(f.head, { depth: 0.34 }),
    ],
  }],
]);

