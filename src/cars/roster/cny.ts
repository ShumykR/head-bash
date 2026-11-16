import { arc, blob, circ, ell, eyeball, fangs, path, poly, rect, rr, seg, smooth, spikesAlong, stripe } from '../draw';
import { rocket, tracks, monsterTruck } from '../skins';
import type { CarMat, CarPoly } from '../types';
import { crew, dims, dragonHead, quadruped, saddle } from '../critters';
import { group, o } from './util';

/** Paper lantern hanging from a pole. */
const lantern = (x: number, y: number, s = 1): CarPoly[] => [
  ...path([[x, y], [x, y - 0.75 * s]], 0.05, 'wood'),
  ell(x, y - 0.95 * s, 0.17 * s, 0.22 * s, 'red'), rect(x - 0.1 * s, y - 1.2 * s, x + 0.1 * s, y - 1.14 * s, 'gold'), rect(x - 0.1 * s, y - 0.76 * s, x + 0.1 * s, y - 0.7 * s, 'gold'),
  seg([x, y - 0.7 * s], [x, y - 0.55 * s], 0.04, 'yellow'),
];
export const CNY = group('cny', [
  ['dancing-lion', 'Dancing Lion', 'Святковий лев із пишною гривою.', 'creature', ['#2a5ad8', '#3aa84a'], {
    o: o({ tall: 1.15, wheel: 0.8 }), parts: ['ears', 'tail'], noLights: true, hideParts: true,
    // As in Drive Ahead's New Year set: a compact lion-dance costume. A rounded body painted with
    // rows of zigzag waves on short legs, a curled tail, and the big round head in front with a
    // spiral curl on its cheek, a bright eye and a gaping gold mouth; the player rides its back.
    skin: (f) => {
      const { rear, front } = dims(f);
      const hx = 1.0, hy = -0.85;
      const zig = (y: number, x0: number, x1: number, m: CarMat) => path(Array.from({ length: Math.round((x1 - x0) / 0.2) + 1 }, (_, i) => [x0 + i * 0.2, y + (i % 2 ? 0.09 : -0.09)] as [number, number]), 0.09, m);
      const spiral = (cx: number, cy: number, r: number, m: CarMat) => [0, 1, 2].map((k) => arc(cx + (k % 2 ? 0.02 : 0), cy, r * (1 - k * 0.3), Math.PI * (0.2 + k * 0.5), Math.PI * (1.7 + k * 0.5), 0.07, m, { flat: true }));
      return [
        // stubby legs onto the wheels
        ...[rear, front].map((x) => rr(x - 0.17, -0.2, x + 0.17, 0.3, 0.07, 'body')),
        // the curled tail
        ...spiral(-1.12, -0.72, 0.2, 'accent'),
        // the rounded body with rows of zigzag waves and a fringed hem
        blob([[-1.05, 0.1], [-1.1, -0.45], [-0.8, -0.72], [0.3, -0.75], [0.75, -0.6], [0.8, 0.1]], 'body', {}, 2),
        ...[-0.48, -0.16].flatMap((y) => zig(y, -0.95, 0.6, 'accent')),
        ...[-0.95, -0.7, -0.45, -0.2, 0.05, 0.3, 0.55].map((x) => poly([[x - 0.1, 0.06], [x + 0.1, 0.06], [x, 0.2]], 'accent')),
        // the head: round, ringed by a darker mane edge, the spiral curl on its cheek
        ell(hx, hy, 0.66, 0.62, 'accent'),
        ell(hx + 0.05, hy, 0.58, 0.55, 'body'),
        ...spiral(hx - 0.15, hy - 0.04, 0.34, 'accent'),
        // the eye and a horn knob on the brow
        circ(hx + 0.34, hy - 0.26, 0.12, 'white', { flat: true }), circ(hx + 0.38, hy - 0.26, 0.07, 'black', { flat: true }),
        circ(hx + 0.12, hy - 0.6, 0.09, 'gold'),
        // the gaping mouth at the front: gold lips, white teeth, a red tongue
        poly([[hx + 0.3, hy + 0.08], [hx + 0.72, hy - 0.02], [hx + 0.7, hy + 0.36], [hx + 0.32, hy + 0.34]], 'black', { flat: true }),
        ...fangs(hx + 0.35, hx + 0.7, hy + 0.03, 2, 0.1),
        ell(hx + 0.5, hy + 0.3, 0.14, 0.05, 'red', { flat: true }),
        rr(hx + 0.28, hy + 0.34, hx + 0.72, hy + 0.42, 0.03, 'gold'), rr(hx + 0.3, hy - 0.06, hx + 0.76, hy + 0.02, 0.03, 'gold'),
        ...saddle(f.head.x, f.head.y + 0.22, 'accent'),
      ];
    },
  }],
  ['emperor-carriage', 'The Emperor\'s Carriage', 'Імператорський трон на ношах: двоє носіїв у конічних брилях несуть його на довгій жердині.', 'carriage', ['#e0b020', '#c02a2a'], {
    parts: ['lantern'], hideParts: true, hideWheels: [0, 1],
    // The porters are solid too: you bump into them, not through them.
    art: (f) => [f.tail.x - 0.12, f.nose.x + 0.12].map((x) => ({ ...rect(x - 0.17, -0.62, x + 0.17, 0.05, 'blue', { density: 0.2 }), deco: false, hide: true })),
    // As in Drive Ahead's New Year set: no wheels and no box — the player sits on an open throne
    // set on a gilded platform, and two porters in conical hats carry it on one long pole.
    skin: (f) => {
      const hx = f.head.x, sy = f.head.y + 0.25;
      return [
      // one long carrying pole through the base, resting on the porters' shoulders
      rr(f.tail.x - 0.45, -0.2, f.nose.x + 0.45, -0.1, 0.04, 'wood'),
      // the platform: a red base banded with gold, a gold rail along the top
      rr(f.tail.x + 0.5, -0.42, f.nose.x - 0.5, 0.05, 0.04, 'accent', { ring: true }),
      ...Array.from({ length: 8 }, (_, i) => f.tail.x + 0.6 + i * ((f.nose.x - f.tail.x - 1.2) / 7)).map((x) => rect(x - 0.025, -0.3, x + 0.025, -0.04, 'gold', { flat: true })),
      rr(f.tail.x + 0.45, -0.48, f.nose.x - 0.45, -0.4, 0.03, 'gold'), rr(f.tail.x + 0.45, 0.02, f.nose.x - 0.45, 0.1, 0.03, 'gold'),
      // the throne: a tall stepped back behind the player, a cushioned seat, an armrest in front
      rr(hx - 0.85, sy - 0.95, hx - 0.3, sy + 0.05, 0.05, 'body'),
      rr(hx - 0.92, sy - 1.08, hx - 0.23, sy - 0.92, 0.04, 'gold'), rr(hx - 0.75, sy - 1.2, hx - 0.4, sy - 1.06, 0.04, 'gold'),
      rr(hx - 0.75, sy - 0.82, hx - 0.4, sy - 0.12, 0.04, 'accent', { flat: true }), circ(hx - 0.575, sy - 0.55, 0.08, 'gold'),
      rr(hx - 0.85, sy - 0.05, hx + 0.5, -0.42, 0.05, 'body', { ring: true }),
      ...[0, 1, 2, 3, 4, 5].map((i) => rect(hx - 0.75 + i * 0.23, sy + 0.05, hx - 0.72 + i * 0.23, -0.48, 'gold', { flat: true })),
      rr(hx - 0.8, sy - 0.12, hx + 0.4, sy + 0.0, 0.05, 'accent'),
      rr(hx + 0.32, sy - 0.4, hx + 0.5, sy + 0.0, 0.04, 'body'), circ(hx + 0.41, sy - 0.42, 0.07, 'gold'),
      // the porters stand clear of the platform at both pole ends, striding forward
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
      ];
    },
  }],
  ['cloud', 'Cloud', 'Чарівна хмаринка: пливе над ареною.', 'blob', ['#e02a2a', '#ffc828'], {
    o: o({ shape: 'flat', mat: 'white' }), float: 0.75, noLights: true, axles: [0.6, 0.6],
    // As in Drive Ahead's New Year set: an auspicious cloud — round lobes curling into gold spirals,
    // a flat underside on two little wheels, a curl trailing off the back, the player on top.
    skin: () => {
      const curl = (cx: number, cy: number, r: number) => [arc(cx, cy, r * 0.75, Math.PI * 0.9, Math.PI * 2.6, 0.07, 'accent', { flat: true }), arc(cx + r * 0.12, cy, r * 0.38, Math.PI * 1.4, Math.PI * 2.9, 0.07, 'accent', { flat: true })];
      return [
        // the trailing curl at the back
        ell(-1.2, -0.4, 0.28, 0.24, 'body'), ...curl(-1.2, -0.4, 0.28),
        // the lobes
        ell(-0.65, -0.35, 0.45, 0.38, 'body'), ell(0.15, -0.5, 0.55, 0.45, 'body'), ell(0.85, -0.3, 0.42, 0.34, 'body'),
        rr(-1.0, -0.3, 1.2, 0.38, 0.15, 'body'),
        // gold spirals curling in each lobe, and the gold rim along the flat underside the wheels peek out of
        ...curl(-0.65, -0.35, 0.36), ...curl(0.15, -0.5, 0.42), ...curl(0.85, -0.3, 0.32), ...curl(-0.2, 0.12, 0.22), ...curl(0.55, 0.12, 0.2),
        rr(-1.0, 0.3, 1.2, 0.4, 0.05, 'accent'),
      ];
    },
  }],
  ['chinese-dragon', 'Chinese Dragon', 'Довгий східний дракон із вусами. Дихає полум\'ям.', 'creature', ['#d82a2a', '#ffc828'], {
    o: o({ neck: 'raptor', len: 1.3, wheel: 0.8 }), parts: ['plates', 'tail', 'mohawk'], noLights: true, hideParts: true,
    // the fire leaves the open jaws
    gun: () => ({ at: [[2.45, -0.78]], aim: 4 }),
    // As in Drive Ahead's New Year set: a snaking dragon whose body dives down onto each wheel and
    // rises into humps between them (the player rides the middle hump), a gold crest of spines
    // along the back, a pale belly stripe, a finned tail and the gold temple-dragon head in front.
    skin: (f) => {
      const { rear, front, wy } = dims(f);
      const lo = wy - 0.22;
      const spine = smooth([[-2.15, -1.05], [-1.7, -0.55], [rear - 0.2, lo], [rear + 0.2, lo], [rear + 0.35, -0.55], [-0.25, -0.75], [front - 0.35, -0.55], [front - 0.2, lo], [front + 0.2, lo], [1.3, -0.5], [1.4, -0.8]], 2, false) as [number, number][];
      const along = (i: number, t: number): [number, number] => { const [x, y] = spine[i], [nx, ny] = spine[i + 1]; return [x + (nx - x) * t, y + (ny - y) * t]; };
      return [
        // the crest: short gold spines standing along the back
        ...spine.slice(0, -1).filter((_, i) => i % 2 === 0).map((_, k) => {
          const i = k * 2, [x, y] = along(i, 0.5), [nx, ny] = spine[i + 1], [px, py] = spine[i];
          const dx = nx - px, dy = ny - py, l = Math.hypot(dx, dy) || 1, ux = dy / l, uy = -dx / l, tx = dx / l, ty = dy / l;
          return poly([[x - tx * 0.12 + ux * 0.15, y - ty * 0.12 + uy * 0.15], [x + tx * 0.12 + ux * 0.15, y + ty * 0.12 + uy * 0.15], [x - tx * 0.08 + ux * 0.46, y - ty * 0.08 + uy * 0.46]], 'accent');
        }),
        // the finned tail
        ...[[-2.55, -1.25], [-2.6, -0.95], [-2.4, -1.35]].map(([x, y]) => poly([[-2.1, -1.08], [-2.2, -0.92], [x, y]], 'accent')),
        // the snaking body: a thick tube, a pale belly stripe, gold claws where it meets the wheels
        ...path(spine, 0.46, 'body'),
        ...path(spine.map(([x, y]) => [x, y + 0.15] as [number, number]), 0.07, 'accent'),
        ...[rear, front].flatMap((x) => [rr(x - 0.22, lo + 0.06, x + 0.22, lo + 0.2, 0.05, 'accent'), ...[-0.15, 0.0, 0.15].map((d) => poly([[x + d - 0.05, lo + 0.18], [x + d + 0.05, lo + 0.18], [x + d, lo + 0.3]], 'white'))]),
        // the head
        ...dragonHead(1.4, -0.8, 0.95, { mane: ['green', 'accent'], maneLen: 0.4 }),
        ...saddle(f.head.x, f.head.y + 0.22, 'accent'),
      ];
    },
  }],
  ['dragon-monster', 'Dragon Monster', 'Монстр-трак із головою дракона. Пихкає вогнем.', 'monster', ['#e02a2a', '#ffd23f'], {
    o: o({ open: true }),
    parts: ['fangs', 'horns'], hideParts: 'all',
    // A red monster truck that is a dragon: the hood is the dragon's head (its jaw round the fangs),
    // the horn over the cab is its gold horn, bat wings fold along the bed and a spiny crest runs
    // down the back to a tail over the tailgate.
    skin: (f) => {
      const x0 = f.tail.x, x1 = f.nose.x, r = f.roof;
      return [
        ...monsterTruck(f, { lamps: false }),
        // the tail curling off the tailgate, and gold scales along the flanks
        ...path([[x0 + 0.1, -0.45], [x0 - 0.3, -0.6], [x0 - 0.55, -0.95]], 0.18, 'body'), poly([[x0 - 0.45, -0.95], [x0 - 0.75, -1.25], [x0 - 0.5, -0.85], [x0 - 0.68, -0.8]], 'accent'),
        ...[-1.25, -0.95, -0.65, -0.35, -0.05, 0.25].map((x) => arc(x, -0.34, 0.12, Math.PI * 0.05, Math.PI * 0.95, 0.06, 'accent', { flat: true })),
        // the folded bat wing over the bed: dark membrane between gold finger bones
        poly([[x0 + 0.05, -0.6], [r.x0 - 0.1, -0.6], [r.x0 - 0.2, -1.45], [x0 + 0.5, -1.3], [x0 + 0.1, -0.95]], 'dark'),
        ...[[x0 + 0.1, -0.95], [x0 + 0.5, -1.3], [r.x0 - 0.2, -1.45]].map(([x, y]) => seg([r.x0 - 0.25, -0.62], [x, y], 0.07, 'accent')),
        ...path([[r.x0 - 0.25, -0.62], [r.x0 - 0.2, -1.45], [r.x0 - 0.05, -1.6]], 0.09, 'accent'),
        // the goring horn over the cab: black, like the dragon's own
        poly([[r.x1 - 0.3, r.y], [r.x1 - 0.02, r.y + 0.05], [r.x1 + 0.7, r.y - 0.75]], 'black'),
        // the head over the hood, jaws round the fangs
        // a neck rising off the hood
        blob([[x1 - 1.1, -0.5], [x1 - 0.9, -0.95], [x1 - 0.5, -0.9], [x1 - 0.2, -0.45]], 'body', {}, 1),
        ...dragonHead(x1 - 0.8, -0.6, 1.2, { maneLen: 0.4 }),
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
    // A tank whose hull is a green serpent lying on the tracks: scaly back with a gold crest,
    // its tail coiled over the rear, the dragon's head reared up in front, and the gun turret
    // riding on its back like a gold saddle.
    skin: (f) => [
      ...tracks(f, 'rubber'),
      // the coiled tail at the back
      ...path([[-1.55, -0.3], [-1.9, -0.55], [-1.75, -0.85], [-1.45, -0.75]], 0.2, 'body'), poly([[-1.45, -0.82], [-1.3, -0.72], [-1.5, -0.66]], 'accent'),
      // the serpent hull: a long scaly body with a pale belly band and a crest of gold spines
      ...spikesAlong(-1.4, 0.6, -0.5, 8, 0.16, 'accent'),
      blob([[-1.7, 0.02], [-1.65, -0.42], [-0.6, -0.55], [0.6, -0.55], [1.2, -0.42], [1.45, -0.1], [1.3, 0.05]], 'body', {}, 1),
      ...[-0.38, -0.2].flatMap((y, r) => [-1.4, -1.0, -0.6, -0.2, 0.2, 0.6, 1.0].map((x) => arc(x + r * 0.2, y, 0.11, Math.PI * 0.1, Math.PI * 0.9, 0.05, 'green', { flat: true }))),
      rr(-1.6, -0.06, 1.3, 0.06, 0.04, 'cream'),
      // the turret: a gold-banded dome on the serpent's back, the barrel through a dragon-mouth mantlet
      ...path([[-0.2, -0.75], [0.9, -1.01]], 0.15, 'dark'), rr(0.8, -1.09, 1.0, -0.93, 0.03, 'black'),
      circ(-0.2, -0.62, 0.32, 'body'), rr(-0.52, -0.68, 0.12, -0.6, 0.03, 'accent'), circ(0.06, -0.78, 0.07, 'accent'),
      // the head reared up in front
      ...dragonHead(1.05, -0.32, 0.95, { mat: 'body', snout: 'accent', mane: ['accent', 'teal'], spikes: 'red', maneLen: 0.35 }),
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
