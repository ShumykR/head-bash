import { arc, blob, circ, ell, eyeball, fangs, path, poly, rect, rr, seg, spikesAlong, starShape, stripe } from '../draw';
import { beast, carriage, dinoHead, rocket, tail, tracks, monsterTruck } from '../skins';
import type { CarMat, CarPoly } from '../types';
import { browEye } from '../critters';
import { group, o } from './util';

/** Paper lantern hanging from a pole. */
const lantern = (x: number, y: number, s = 1): CarPoly[] => [
  ...path([[x, y], [x, y - 0.75 * s]], 0.05, 'wood'),
  ell(x, y - 0.95 * s, 0.17 * s, 0.22 * s, 'red'), rect(x - 0.1 * s, y - 1.2 * s, x + 0.1 * s, y - 1.14 * s, 'gold'), rect(x - 0.1 * s, y - 0.76 * s, x + 0.1 * s, y - 0.7 * s, 'gold'),
  seg([x, y - 0.7 * s], [x, y - 0.55 * s], 0.04, 'yellow'),
];
/** Scales: a row of small arcs. */
const scales = (x0: number, x1: number, y: number, mat: CarMat = 'accent'): CarPoly[] => {
  const out: CarPoly[] = [];
  for (let x = x0; x < x1; x += 0.22) out.push(blob([[x, y], [x + 0.11, y + 0.1], [x + 0.22, y]], mat, { flat: true }, 1));
  return out;
};

export const CNY = group('cny', [
  ['dancing-lion', 'Dancing Lion', 'Святковий лев із пишною гривою.', 'creature', ['#e02a2a', '#ffd23f'], {
    parts: ['ears', 'tail'], noLights: true, hideParts: true,
    skin: (f) => [
      tail(f.tail.x, -0.3, 0.55, 'accent'),
      ...beast(f, { belly: 'accent' }),
      ...scales(-0.9, 0.7, -0.45), ...scales(-0.8, 0.6, -0.25, 'gold'),
      ...[0, 1, 2, 3, 4, 5].map((i) => ell(1.0 + Math.cos(i * 0.9) * 0.35, -0.95 + Math.sin(i * 0.9) * 0.35, 0.2, 0.15, i % 2 ? 'accent' : 'white')),
      ...dinoHead('short').polys,
      ell(1.4, -0.95, 0.38, 0.32, 'body'), rr(1.1, -1.3, 1.65, -1.2, 0.04, 'gold'), poly([[1.25, -1.28], [1.38, -1.5], [1.5, -1.28]], 'gold'),
      ...eyeball(1.42, -1.02, 0.1), ...eyeball(1.62, -1.0, 0.08),
      ell(1.72, -0.85, 0.08, 0.06, 'pink'),
      poly([[1.3, -0.78], [1.8, -0.78], [1.7, -0.62], [1.35, -0.62]], 'black'), ...fangs(1.32, 1.75, -0.78, 4, 0.08),
      circ(1.4, -1.28, 0.06, 'red'), ...[-0.7, -0.2, 0.3].map((x) => circ(x, -0.05, 0.05, 'gold')),
    ],
  }],
  ['emperor-carriage', 'The Emperor\'s Carriage', 'Золотий імператорський паланкін з ліхтарями.', 'carriage', ['#e0b020', '#c02a2a'], {
    parts: ['lantern'], hideParts: true,
    skin: (f) => [
      ...carriage(f, { trim: 'red' }),
      poly([[f.roof.x0 - 0.35, f.roof.y + 0.02], [f.roof.x1 + 0.35, f.roof.y + 0.02], [f.roof.x1 - 0.05, f.roof.y - 0.28], [f.roof.x0 + 0.05, f.roof.y - 0.28]], 'accent'),
      poly([[f.roof.x0 - 0.35, f.roof.y + 0.02], [f.roof.x0 - 0.1, f.roof.y - 0.12], [f.roof.x0 - 0.5, f.roof.y - 0.2]], 'accent'), poly([[f.roof.x1 + 0.35, f.roof.y + 0.02], [f.roof.x1 + 0.1, f.roof.y - 0.12], [f.roof.x1 + 0.5, f.roof.y - 0.2]], 'accent'),
      circ(0, f.roof.y - 0.38, 0.1, 'gold'),
      rr(-0.45, f.roof.y + 0.2, 0.45, f.roof.y + 0.62, 0.04, 'red'), ...[-0.3, -0.1, 0.1, 0.3].map((x) => rect(x - 0.02, f.roof.y + 0.2, x + 0.02, f.roof.y + 0.62, 'gold', { flat: true })),
      ...lantern(f.tail.x + 0.4, -0.05, 0.8), ...lantern(f.nose.x - 0.4, -0.05, 0.8),
      ...[f.tail.x - 0.1, f.nose.x + 0.1].map((x) => rr(x - 0.4, 0.02, x + 0.4, 0.1, 0.03, 'wood')),
    ],
  }],
  ['cloud', 'Cloud', 'Чарівна хмаринка: пливе над ареною.', 'blob', ['#f4f8ff', '#ffd23f'], {
    o: o({ shape: 'flat', mat: 'white' }), float: 0.75, noLights: true,
    skin: () => [
      ell(-0.6, -0.4, 0.55, 0.38, 'white'), ell(0.15, -0.55, 0.6, 0.45, 'white'), ell(0.85, -0.3, 0.45, 0.32, 'white'), ell(0, -0.1, 1.25, 0.3, 'white'),
      ...[[-0.9, -0.55], [0.0, -0.85], [0.7, -0.5]].map(([x, y]) => blob([[x - 0.15, y], [x, y - 0.12], [x + 0.15, y], [x, y + 0.05]], 'sky', { flat: true }, 1)),
      ...eyeball(0.55, -0.22, 0.07), ...eyeball(0.8, -0.22, 0.06),
      ell(0.95, -0.05, 0.08, 0.05, 'pink'), blob([[0.55, -0.05], [0.68, 0.02], [0.8, -0.05]], 'black', {}, 1),
      ell(-0.3, -0.75, 0.25, 0.08, 'white', { flat: true }), rr(-0.9, 0.14, 0.9, 0.3, 0.05, 'gold'), ...[-0.6, 0.0, 0.6].map((x) => circ(x, 0.22, 0.04, 'red')),
    ],
  }],
  ['chinese-dragon', 'Chinese Dragon', 'Довгий східний дракон із вусами. Дихає полум\'ям.', 'creature', ['#e02a2a', '#ffd23f'], {
    o: o({ neck: 'raptor', len: 1.3 }), parts: ['plates', 'tail', 'mohawk'], noLights: true, hideParts: true,
    skin: (f) => {
      const L = 1.3;
      return [
        ...path([[f.tail.x + 0.2, -0.3], [f.tail.x - 0.3, -0.6], [f.tail.x - 0.7, -0.35], [f.tail.x - 0.9, -0.6]], 0.22, 'body'),
        ...beast(f, { rx: 1.3, ry: 0.35, belly: 'accent' }),
        ...spikesAlong(-1.2, 1.0, -0.52, 9, 0.18, 'gold'),
        ...scales(-1.2, 1.1, -0.35, 'accent'),
        ...path([[0.8 * L, -0.35], [1.2 * L, -0.65]], 0.34, 'body'),
        blob([[1.05 * L, -0.9], [1.5 * L, -0.98], [1.85 * L, -0.75], [1.85 * L, -0.48], [1.25 * L, -0.42]], 'body', {}, 1),
        ...path([[1.15 * L, -0.92], [0.95 * L, -1.25], [0.8 * L, -1.28]], 0.07, 'gold'), ...path([[1.3 * L, -0.95], [1.2 * L, -1.3]], 0.07, 'gold'),
        ...eyeball(1.45 * L, -0.78, 0.09),
        ...path([[1.8 * L, -0.55], [2.05 * L, -0.35], [2.2 * L, -0.45]], 0.05, 'gold'), ...path([[1.75 * L, -0.5], [1.95 * L, -0.2], [2.1 * L, -0.25]], 0.05, 'gold'),
        rect(1.4 * L, -0.6, 1.85 * L, -0.55, 'black'), ...fangs(1.42 * L, 1.82 * L, -0.6, 4, 0.08),
        circ(1.75 * L, -0.66, 0.03, 'black'), circ(1.45 * L, -0.78, 0.035, 'white'),
      ];
    },
  }],
  ['dragon-monster', 'Dragon Monster', 'Монстр-трак із головою дракона. Пихкає вогнем.', 'monster', ['#e02a2a', '#ffd23f'], {
    o: o({ open: true }),
    parts: ['fangs', 'horns'], hideParts: true,
    skin: (f) => {
      const x1 = f.nose.x, top = f.roof.y;
      return [
        ...monsterTruck(f, { lamps: false }),
        // gold scales along the flanks, a spiny crest over the cab and down the bed
        ...[-1.15, -0.85, -0.55, -0.25, 0.05, 0.35, 0.65].map((x) => arc(x, -0.32, 0.12, Math.PI * 0.05, Math.PI * 0.95, 0.05, 'accent')),
        ...spikesAlong(f.roof.x0, f.roof.x1, top - 0.05, 4, 0.18, 'accent'),
        ...spikesAlong(f.tail.x + 0.2, f.roof.x0 - 0.1, -0.62, 3, 0.15, 'accent'),
        // the dragon head is the front end: horned brow, glowing eye, jaws with fangs, whiskers
        blob([[x1 - 0.75, -0.55], [x1 - 0.5, -0.95], [x1 - 0.05, -0.85], [x1 + 0.22, -0.55], [x1 + 0.2, -0.38], [x1 - 0.7, -0.35]], 'body', {}, 1),
        poly([[x1 - 0.62, -0.85], [x1 - 0.95, -1.25], [x1 - 0.4, -0.95]], 'gold'), poly([[x1 - 0.4, -0.92], [x1 - 0.55, -1.3], [x1 - 0.2, -0.9]], 'gold'),
        ...browEye(x1 - 0.3, -0.7, 0.08, 'red'),
        poly([[x1 - 0.55, -0.4], [x1 + 0.22, -0.42], [x1 + 0.18, -0.2], [x1 - 0.5, -0.22]], 'black', { flat: true }),
        ...fangs(x1 - 0.45, x1 + 0.18, -0.41, 4, 0.1), ...fangs(x1 - 0.4, x1 + 0.12, -0.21, 3, 0.09, true),
        ...path([[x1 + 0.15, -0.5], [x1 + 0.4, -0.6], [x1 + 0.5, -0.8]], 0.05, 'gold'),
        circ(x1 + 0.12, -0.55, 0.035, 'black'),
      ];
    },
  }],
  ['zodiac-dog', 'Zodiacal Dog', 'Зодіакальний святковий пес у червоному шарфі.', 'creature', ['#e0a040', '#ffffff'], {
    parts: ['ears', 'tail'], noLights: true, hideParts: true,
    skin: (f) => {
      const h = dinoHead('short');
      return [
        ...path([[f.tail.x + 0.1, -0.35], [f.tail.x - 0.3, -0.75], [f.tail.x - 0.2, -0.95]], 0.14, 'body'),
        ...beast(f, { belly: 'accent' }), ...h.polys,
        poly([[1.1, -1.05], [1.0, -1.4], [1.3, -1.1]], 'brown'), ell(1.68, -0.86, 0.07, 0.06, 'black'),
        ...eyeball(h.eye[0], h.eye[1], 0.07),
        blob([[0.6, -0.6], [1.05, -0.88], [1.15, -0.7], [0.75, -0.42]], 'red', {}, 1), poly([[0.75, -0.5], [0.6, -0.15], [0.8, -0.18], [0.88, -0.48]], 'red'),
        circ(0.95, -0.55, 0.06, 'gold'), circ(0.95, -0.42, 0.06, 'gold'),
        ...[[-0.6, -0.35], [-0.1, -0.45], [0.3, -0.3]].map(([x, y]) => ell(x, y, 0.1, 0.07, 'brown')),
      ];
    },
  }],
  ['rocket-ride', 'Rocket Ride', 'Святкова новорічна ракета з ліхтариком.', 'rocket', ['#e02a2a', '#ffd23f'], {
    parts: ['booster', 'lantern'], hideParts: true,
    skin: (f) => [
      ...rocket(f, { nose: 'gold', fin: 'gold' }),
      ...[0, 1, 2, 3].map((i) => poly([[-1.35 + i * 0.5, -0.32], [-1.15 + i * 0.5, -0.32], [-1.4 + i * 0.5, 0.32], [-1.6 + i * 0.5, 0.32]], 'accent', { flat: true })),
      ...lantern(-0.6, -0.32, 0.7),
      ...[[f.tail.x - 0.4, -0.12], [f.tail.x - 0.55, 0.06], [f.tail.x - 0.35, 0.12]].map(([x, y]) => starShape(x, y, 0.06, 'yellow')),
      rr(-1.2, 0.26, 1.0, 0.38, 0.04, 'dark'),
    ],
  }],
  ['serpent-tank', 'Serpent Dragon Tank', 'Танк у вигляді змія з драконячою пащею.', 'tracked', ['#2a8a3a', '#ffd23f'], {
    gun: () => ({ at: [[0.93, -1.01]], aim: 15 }),
    parts: ['fangs', 'cannon'], hideParts: true,
    skin: (f) => [
      ...tracks(f, 'rubber'),
      blob([[-1.7, 0.0], [-1.65, -0.45], [0.8, -0.55], [1.6, -0.35], [1.85, -0.05], [1.6, 0.05]], 'body', {}, 1),
      ...scales(-1.5, 1.2, -0.25), ...spikesAlong(-1.4, 0.4, -0.5, 7, 0.15, 'gold'),
      circ(-0.2, -0.65, 0.3, 'body'), ...path([[-0.2, -0.7], [0.9, -1.0]], 0.14, 'gold'),
      ...eyeball(1.25, -0.3, 0.1, 'red'), rr(-0.4, -0.98, 0.0, -0.9, 0.03, 'gold'), rr(0.82, -1.08, 1.0, -0.94, 0.03, 'dark'),
      rr(-1.7, -0.06, 1.7, 0.1, 0.04, 'body', { ring: true }), ...[-1.4, -0.7, 0.0, 0.7, 1.4].map((x) => circ(x, 0.02, 0.03, 'gold')),
      poly([[1.3, -0.12], [1.9, -0.15], [1.85, 0.02], [1.3, 0.02]], 'black'), ...fangs(1.35, 1.85, -0.13, 4, 0.1),
    ],
  }],
  ['cannon-carriage', 'Cannon Carriage', 'Середньовічна гармата на великих колесах.', 'cart', ['#7a4a2a', '#3a3a3a'], {
    gun: (f) => ({ at: [[1.08, f.deck.y - 0.55]], aim: 23 }),
    o: o({ wheel: 1.8, mat: 'wood', rim: 'spokes' }), parts: [['cannon', 0.7]], noLights: true, hideParts: true,
    skin: (f) => [
      ...path([[f.tail.x - 0.6, f.deck.y + 0.55], [f.tail.x + 0.2, f.deck.y + 0.3]], 0.16, 'wood'),
      blob([[f.tail.x + 0.05, 0.3], [f.tail.x + 0.1, f.deck.y + 0.15], [f.nose.x - 0.1, f.deck.y - 0.05], [f.nose.x, 0.0], [f.nose.x - 0.2, 0.3]], 'wood', {}, 1),
      rect(-0.62, 0.32, 0.62, 0.42, 'dark'),
      ...path([[0.0, f.deck.y - 0.1], [0.95, f.deck.y - 0.5]], 0.3, 'dark'), ...path([[0.9, f.deck.y - 0.48], [1.05, f.deck.y - 0.54]], 0.38, 'dark'),
      ...[0.25, 0.55].map((dx) => seg([dx - 0.03, f.deck.y - 0.35 - dx * 0.4], [dx + 0.06, f.deck.y + 0.08 - dx * 0.4], 0.06, 'gold')),
      circ(f.tail.x + 0.25, f.deck.y - 0.12, 0.1, 'black'), circ(f.tail.x + 0.48, f.deck.y - 0.12, 0.1, 'black'), circ(f.tail.x + 0.36, f.deck.y - 0.3, 0.1, 'black'),
      stripe(-0.4, 0.4, f.deck.y + 0.15, 0.06, 'red'),
      ...[0.1, 0.45, 0.8].map((dx) => circ(dx, f.deck.y - 0.25 - dx * 0.4, 0.035, 'gold')), poly([[-0.1, f.deck.y - 0.35], [0.05, f.deck.y - 0.55], [0.15, f.deck.y - 0.3]], 'red'),
    ],
  }],
]);
