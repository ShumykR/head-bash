import { arc, blob, circ, ell, eyeball, fangs, path, poly, rect, rr, seg, spikesAlong, stripe } from '../draw';
import { carriage, rocket, tracks, monsterTruck } from '../skins';
import type { CarMat, CarPoly } from '../types';
import { browEye, crew, dims, quadruped, saddle } from '../critters';
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
    o: o({ tall: 1.15, wheel: 0.8 }), parts: ['ears', 'tail'], noLights: true, hideParts: true,
    // A lion-dance costume: the big painted head in front, the cloth body draped behind it.
    skin: (f) => {
      const { rear, front } = dims(f);
      return [
        // dancers' legs in yellow trousers under the drape
        ...[rear, front].flatMap((x) => [rr(x - 0.14, -0.1, x + 0.14, 0.3, 0.05, 'accent', { ring: true }), rect(x - 0.14, 0.2, x + 0.14, 0.3, 'black')]),
        // cloth body: red with gold scales, white fur along the spine and a fringed hem
        blob([[-1.3, -0.05], [-1.25, -0.6], [-0.5, -0.8], [0.5, -0.78], [0.95, -0.5], [0.95, -0.05]], 'body', {}, 2),
        ...[-1.0, -0.6, -0.2, 0.2, 0.6].flatMap((x) => [arc(x, -0.35, 0.14, Math.PI * 0.05, Math.PI * 0.95, 0.05, 'accent'), arc(x + 0.2, -0.55, 0.12, Math.PI * 0.05, Math.PI * 0.95, 0.05, 'gold')]),
        ...[-1.2, -0.95, -0.7, -0.45, -0.2, 0.05, 0.3, 0.55, 0.8].map((x) => poly([[x - 0.12, -0.08], [x + 0.12, -0.08], [x, 0.08]], 'white')),
        ...path([[-1.25, -0.62], [-0.6, -0.82], [0.2, -0.82]], 0.1, 'white'),
        blob([[-1.3, -0.5], [-1.6, -0.75], [-1.55, -0.35], [-1.3, -0.25]], 'accent', {}, 1),
        // the lion head: fluffy white mane, mirror and horn on the brow, huge lashed eyes, open mouth
        ...[0, 1, 2, 3, 4, 5, 6].map((i) => ell(1.25 + Math.cos(-0.4 - i * 0.55) * 0.5, -0.85 + Math.sin(-0.4 - i * 0.55) * 0.45, 0.14, 0.12, 'white')),
        blob([[0.8, -1.25], [1.3, -1.35], [1.75, -1.15], [1.85, -0.75], [1.7, -0.45], [1.0, -0.42], [0.8, -0.8]], 'body', {}, 2),
        rr(0.95, -1.28, 1.65, -1.16, 0.05, 'gold'), circ(1.3, -1.2, 0.08, 'sky'), poly([[1.22, -1.32], [1.3, -1.55], [1.4, -1.32]], 'gold'),
        ...[1.2, 1.55].flatMap((x) => [ell(x, -0.98, 0.14, 0.12, 'white'), circ(x + 0.04, -0.97, 0.07, 'black'), rect(x - 0.14, -1.13, x + 0.14, -1.09, 'black', { flat: true })]),
        ell(1.78, -0.82, 0.09, 0.07, 'gold'),
        poly([[1.15, -0.72], [1.85, -0.7], [1.8, -0.52], [1.2, -0.5]], 'black', { flat: true }), ...fangs(1.2, 1.8, -0.71, 4, 0.08),
        blob([[1.1, -0.52], [1.82, -0.52], [1.7, -0.38], [1.15, -0.38]], 'accent', {}, 1),
        ...saddle(f.head.x, f.head.y + 0.22, 'gold'),
      ];
    },
  }],
  ['emperor-carriage', 'The Emperor\'s Carriage', 'Золотий імператорський паланкін з ліхтарями.', 'carriage', ['#e0b020', '#c02a2a'], {
    parts: ['lantern'], hideParts: true, hideWheels: [0, 1],
    // The porters are solid too: you bump into them, not through them.
    art: (f) => [f.tail.x - 0.12, f.nose.x + 0.12].map((x) => ({ ...rect(x - 0.17, -0.62, x + 0.17, 0.05, 'blue', { density: 0.2 }), deco: false, hide: true })),
    // No wheels: two porters in conical hats carry the palanquin on long poles (their feet are the wheels).
    skin: (f) => [
      // one long carrying pole through the base, resting on the porters' shoulders
      rr(f.tail.x - 0.45, -0.2, f.nose.x + 0.45, -0.1, 0.04, 'wood'),
      ...carriage({ ...f, wheels: [] }, { trim: 'red' }),
      poly([[f.roof.x0 - 0.35, f.roof.y + 0.02], [f.roof.x1 + 0.35, f.roof.y + 0.02], [f.roof.x1 - 0.05, f.roof.y - 0.28], [f.roof.x0 + 0.05, f.roof.y - 0.28]], 'accent'),
      poly([[f.roof.x0 - 0.35, f.roof.y + 0.02], [f.roof.x0 - 0.1, f.roof.y - 0.12], [f.roof.x0 - 0.5, f.roof.y - 0.2]], 'accent'), poly([[f.roof.x1 + 0.35, f.roof.y + 0.02], [f.roof.x1 + 0.1, f.roof.y - 0.12], [f.roof.x1 + 0.5, f.roof.y - 0.2]], 'accent'),
      circ(0, f.roof.y - 0.38, 0.1, 'gold'),
      rr(-0.45, f.roof.y + 0.2, 0.45, f.roof.y + 0.62, 0.04, 'red'), ...[-0.3, -0.1, 0.1, 0.3].map((x) => rect(x - 0.02, f.roof.y + 0.2, x + 0.02, f.roof.y + 0.62, 'gold', { flat: true })),
      ...lantern(f.tail.x + 0.4, -0.05, 0.8), ...lantern(f.nose.x - 0.4, -0.05, 0.8),
      // the porters stand clear of the box at both pole ends, striding forward
      ...[f.tail.x - 0.12, f.nose.x + 0.12].flatMap((x, i) => {
        const g = f.wheels[i].y + f.wheels[i].r, s = i ? 0.1 : -0.1;
        return [
          ...path([[x - 0.02, -0.02], [x - 0.12 - s, g - 0.3], [x - 0.2 - s, g - 0.06]], 0.11, 'blue'),
          ...path([[x + 0.04, -0.02], [x + 0.12 + s, g - 0.3], [x + 0.18 + s, g - 0.06]], 0.11, 'blue'),
          rr(x - 0.3 - s, g - 0.08, x - 0.08 - s, g, 0.03, 'black'), rr(x + 0.08 + s, g - 0.08, x + 0.3 + s, g, 0.03, 'black'),
          rr(x - 0.17, -0.42, x + 0.17, 0.06, 0.06, 'blue'), rect(x - 0.17, -0.06, x + 0.17, 0.0, 'gold', { flat: true }),
          // drawn like the player: a red helmet with a porter's conical straw brim on top
          ...crew(x + 0.02, -0.6, 0.2, { helm: 'red', stripe: null, suit: 'blue', style: 'conical' }),
        ];
      }),
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
    o: o({ neck: 'raptor', len: 1.3, wheel: 0.8 }), parts: ['plates', 'tail', 'mohawk'], noLights: true, hideParts: true,
    skin: (f) => {
      const { rear, front } = dims(f);
      const spine: [number, number][] = [[-2.25, -1.0], [-1.75, -0.45], [-1.15, -0.72], [-0.5, -0.42], [0.25, -0.7], [0.85, -0.5], [1.25, -0.72]];
      return [
        // long serpentine body with a gold belly band and a flame-tipped tail
        ...path(spine, 0.36, 'body'),
        ...path(spine.map(([x, y]) => [x + 0.02, y + 0.12] as [number, number]), 0.1, 'accent'),
        ...spine.slice(0, -1).flatMap(([x, y], i) => poly([[x - 0.08, y - 0.15], [x + 0.1, y - 0.16], [x + 0.02 - (i % 2) * 0.05, y - 0.38]], 'gold')),
        poly([[-2.25, -1.0], [-2.55, -1.25], [-2.35, -0.85], [-2.6, -0.8], [-2.2, -0.82]], 'orange'),
        // clawed legs onto the wheels
        ...[rear, front].flatMap((x) => [...path([[x - 0.05, -0.5], [x + 0.12, -0.15], [x, 0.18]], 0.18, 'body'), ...[-0.1, 0.05].map((d) => poly([[x + d, 0.18], [x + d + 0.08, 0.18], [x + d + 0.12, 0.3]], 'bone'))]),
        // head: long snout, antler horns, flowing whiskers, red mane, open jaws
        ...path([[1.6, -1.05], [1.3, -1.5], [1.05, -1.6]], 0.07, 'gold'), ...path([[1.38, -1.35], [1.5, -1.6]], 0.06, 'gold'),
        blob([[1.1, -0.95], [1.3, -1.25], [1.15, -1.45], [0.9, -1.1], [0.75, -0.8]], 'orange', {}, 1),
        blob([[1.2, -1.05], [1.75, -1.15], [2.35, -0.95], [2.4, -0.75], [1.6, -0.7], [1.25, -0.72]], 'body', {}, 1),
        poly([[1.55, -0.75], [2.4, -0.78], [2.3, -0.58], [1.6, -0.6]], 'black', { flat: true }), ...fangs(1.65, 2.35, -0.76, 4, 0.08),
        blob([[1.5, -0.62], [2.3, -0.6], [2.1, -0.48], [1.55, -0.5]], 'body', {}, 1),
        ...browEye(1.7, -0.95, 0.08, 'black', 'gold'),
        ...path([[2.3, -0.9], [2.6, -0.8], [2.85, -0.98]], 0.05, 'gold'), ...path([[2.2, -0.7], [2.45, -0.45], [2.7, -0.5]], 0.05, 'gold'),
        circ(2.3, -0.92, 0.035, 'black'),
        ...saddle(f.head.x, f.head.y + 0.22, 'gold'),
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
  ['zodiac-dog', 'Zodiacal Dog', 'Зодіакальний святковий пес у червоному шарфі.', 'creature', ['#e09040', '#ffffff'], {
    o: o({ tall: 1.15, wheel: 0.8 }), parts: ['ears', 'tail'], noLights: true, hideParts: true,
    skin: (f) => [
      // curled shiba tail
      ...path([[-0.95, -0.55], [-1.3, -0.85], [-1.15, -1.15], [-0.9, -1.0]], 0.16, 'body'), circ(-0.92, -1.02, 0.07, 'white'),
      ...quadruped(f, { tail: 0, leg: 0.26, belly: 'accent', saddle: 'gold', chest: 0.95 }),
      // red festive scarf with a gold coin and tassels
      rr(0.55, -0.85, 0.85, -0.2, 0.05, 'red'), poly([[0.6, -0.4], [0.35, -0.05], [0.5, -0.02], [0.7, -0.3]], 'red'),
      circ(0.72, -0.35, 0.09, 'gold'), rect(0.7, -0.38, 0.74, -0.32, 'red', { flat: true }),
      // head: pointed ears, white cheeks, black nose, happy open mouth
      ...path([[0.75, -0.7], [1.05, -0.95]], 0.3, 'body'),
      blob([[0.92, -1.25], [1.25, -1.38], [1.55, -1.25], [1.72, -1.02], [1.7, -0.8], [1.3, -0.74], [0.95, -0.9]], 'body', {}, 1),
      poly([[1.0, -1.22], [1.02, -1.5], [1.2, -1.3]], 'body'), poly([[1.28, -1.32], [1.4, -1.55], [1.5, -1.26]], 'body'),
      poly([[1.05, -1.25], [1.06, -1.4], [1.14, -1.3]], 'pink'),
      blob([[1.32, -1.0], [1.74, -0.98], [1.72, -0.8], [1.3, -0.76]], 'accent', {}, 1),
      circ(1.74, -0.98, 0.06, 'black'), ...eyeball(1.32, -1.12, 0.065),
      poly([[1.45, -0.82], [1.65, -0.82], [1.55, -0.7]], 'red'),
    ],
  }],
  ['rocket-ride', 'Rocket Ride', 'Святкова новорічна ракета з ліхтариком.', 'rocket', ['#e02a2a', '#ffd23f'], {
    parts: ['booster', 'lantern'], hideParts: true,
    fx: (f) => [{ kind: 'spark', at: [f.tail.x - 0.3, 0.0], dir: 180, size: 0.18 }],
    skin: (f) => [
      ...rocket(f, { nose: 'gold', fin: 'gold' }),
      ...[0, 1, 2, 3].map((i) => poly([[-1.35 + i * 0.5, -0.32], [-1.15 + i * 0.5, -0.32], [-1.4 + i * 0.5, 0.32], [-1.6 + i * 0.5, 0.32]], 'accent', { flat: true })),
      ...lantern(-0.6, -0.32, 0.7),
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
      // the bronze barrel: thick at the breech, banded, with a flared muzzle and a cascabel knob
      circ(-0.42, f.deck.y + 0.08, 0.14, 'gold'),
      ...path([[-0.3, f.deck.y + 0.02], [0.95, f.deck.y - 0.5]], 0.44, 'gold'), ...path([[0.9, f.deck.y - 0.48], [1.1, f.deck.y - 0.56]], 0.52, 'gold'),
      circ(1.12, f.deck.y - 0.57, 0.13, 'black'),
      ...[-0.05, 0.3, 0.65].map((dx) => seg([dx - 0.06, f.deck.y - 0.24 - dx * 0.4], [dx + 0.06, f.deck.y + 0.2 - dx * 0.4], 0.07, 'brown')),
      circ(f.tail.x + 0.25, f.deck.y - 0.12, 0.1, 'black'), circ(f.tail.x + 0.48, f.deck.y - 0.12, 0.1, 'black'), circ(f.tail.x + 0.36, f.deck.y - 0.3, 0.1, 'black'),
      stripe(-0.4, 0.4, f.deck.y + 0.15, 0.06, 'red'),
      ...[0.1, 0.45, 0.8].map((dx) => circ(dx, f.deck.y - 0.25 - dx * 0.4, 0.035, 'gold')), poly([[-0.1, f.deck.y - 0.35], [0.05, f.deck.y - 0.55], [0.15, f.deck.y - 0.3]], 'red'),
    ],
  }],
]);
