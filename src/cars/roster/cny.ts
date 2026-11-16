import { arc, blob, circ, ell, eyeball, fangs, path, poly, rect, rr, seg, spikesAlong, stripe } from '../draw';
import { rocket, tracks, monsterTruck } from '../skins';
import type { CarPoly } from '../types';
import { dims, dragonHead, quadruped, saddle } from '../critters';
import { group, o } from './util';

/** Paper lantern hanging from a pole. */
const lantern = (x: number, y: number, s = 1): CarPoly[] => [
  ...path([[x, y], [x, y - 0.75 * s]], 0.05, 'wood'),
  ell(x, y - 0.95 * s, 0.17 * s, 0.22 * s, 'red'), rect(x - 0.1 * s, y - 1.2 * s, x + 0.1 * s, y - 1.14 * s, 'gold'), rect(x - 0.1 * s, y - 0.76 * s, x + 0.1 * s, y - 0.7 * s, 'gold'),
  seg([x, y - 0.7 * s], [x, y - 0.55 * s], 0.04, 'yellow'),
];
export const CNY = group('cny', [
  ['dancing-lion', 'Dancing Lion', 'Святковий лев із пишною гривою.', 'creature', ['#2a6ad8', '#3aa84a'], {
    o: o({ tall: 1.15, wheel: 0.8 }), parts: ['ears', 'tail'], noLights: true, hideParts: true, axles: [0.75, 0.75],
    // After Drive Ahead's New Year lion: a wide costume body painted with three rows of zigzags,
    // standing on the wheels on two stubby legs, and the head raised at the front like a big
    // friendly dog's: a curl on the crown, a short snout with a white lip and a green tuft on the nose.
    skin: (f) => {
      const { rear, front } = dims(f);
      const zig = (y: number) => path(Array.from({ length: 10 }, (_, i) => [-1.0 + i * 0.19, y + (i % 2 ? 0.08 : -0.08)] as [number, number]), 0.08, 'accent');
      const hx = 1.0, hy = -0.98;
      return [
        // the costume body: two legs onto the wheels, three rows of zigzags, a white rim on the back
        ...[rear, front].map((x) => rr(x - 0.24, -0.3, x + 0.24, 0.38, 0.08, 'body')),
        blob([[-1.05, 0.25], [-1.12, -0.45], [-0.85, -0.72], [0.35, -0.75], [0.8, -0.55], [0.82, 0.25]], 'body', {}, 2),
        ...[-0.45, -0.17, 0.11].flatMap(zig),
        ...path([[-1.02, -0.5], [-0.82, -0.7], [0.3, -0.73]], 0.07, 'white'),
        // the mane at the back of the head, mottled green
        ell(hx - 0.2, hy + 0.05, 0.45, 0.45, 'accent'), circ(hx - 0.35, hy + 0.15, 0.1, 'dark'), circ(hx - 0.15, hy + 0.3, 0.08, 'dark'),
        // the head, a white rim along its crown, the curl on top
        ell(hx + 0.1, hy, 0.42, 0.4, 'body'),
        arc(hx + 0.1, hy, 0.38, Math.PI * 1.05, Math.PI * 1.6, 0.06, 'white', { flat: true }),
        arc(hx - 0.25, hy - 0.05, 0.17, Math.PI * 0.6, Math.PI * 2.3, 0.07, 'body', { flat: true }), circ(hx - 0.24, hy - 0.06, 0.05, 'body'),
        // the short snout with a white lower lip and a green tuft on the nose
        rr(hx + 0.3, hy + 0.0, hx + 0.72, hy + 0.3, 0.08, 'body'),
        rr(hx + 0.32, hy + 0.24, hx + 0.7, hy + 0.36, 0.05, 'white'),
        rect(hx + 0.4, hy + 0.19, hx + 0.68, hy + 0.23, 'black', { flat: true }),
        poly([[hx + 0.66, hy + 0.0], [hx + 0.85, hy - 0.08], [hx + 0.78, hy + 0.08]], 'accent'),
        // a calm eye: a small dark almond under a brow
        ell(hx + 0.38, hy - 0.06, 0.06, 0.035, 'black', { flat: true }), rect(hx + 0.3, hy - 0.13, hx + 0.46, hy - 0.1, 'white', { flat: true }),
        ...saddle(f.head.x, f.head.y + 0.22, 'accent'),
      ];
    },
  }],
  ['emperor-carriage', 'The Emperor\'s Carriage', 'Імператорський трон на ношах: двоє носіїв у конічних брилях несуть його на довгій жердині.', 'carriage', ['#d83a2a', '#e8b830'], {
    parts: ['lantern'], hideParts: true, hideWheels: [0, 1],
    // The porters are solid too: you bump into them, not through them.
    art: (f) => [f.tail.x - 0.12, f.nose.x + 0.12].map((x) => ({ ...rect(x - 0.17, -0.62, x + 0.17, 0.05, 'blue', { density: 0.2 }), deco: false, hide: true })),
    // After Drive Ahead's New Year carriage: a long carrying pole, a striped platform on it, an
    // open throne with a tall back and a stepped arm, and two porters in big straw hats.
    skin: (f) => {
      const hx = f.head.x, sy = f.head.y + 0.25, x0 = f.tail.x + 0.4, x1 = f.nose.x - 0.4;
      const stripes = (a: number, b: number, y0: number, y1: number) => Array.from({ length: Math.max(2, Math.round((b - a) / 0.12)) }, (_, i) => a + 0.06 + i * 0.12).filter((x) => x < b - 0.03).map((x) => rect(x - 0.025, y0, x + 0.025, y1, 'accent', { flat: true }));
      return [
        // the pole: one long cream beam with gold caps, resting on the porters' shoulders
        rr(f.tail.x - 0.5, -0.22, f.nose.x + 0.5, -0.12, 0.04, 'cream'),
        rr(f.tail.x - 0.58, -0.24, f.tail.x - 0.42, -0.1, 0.03, 'accent'), rr(f.nose.x + 0.42, -0.24, f.nose.x + 0.58, -0.1, 0.03, 'accent'),
        // the platform on the pole: striped base under a white-rimmed top step
        rr(x0, -0.5, x1, -0.22, 0.03, 'body', { ring: true }), ...stripes(x0, x1, -0.45, -0.26),
        rr(x0 - 0.05, -0.56, x1 + 0.05, -0.48, 0.03, 'white'),
        // the throne: a tall back behind the player, a striped seat, a stepped arm in front
        rr(hx - 0.8, sy - 1.15, hx - 0.45, -0.5, 0.06, 'body', { ring: true }), rect(hx - 0.66, sy - 1.05, hx - 0.6, -0.56, 'accent', { flat: true }), rr(hx - 0.83, sy - 1.22, hx - 0.42, sy - 1.12, 0.03, 'white'),
        rr(hx - 0.5, sy - 0.05, hx + 0.3, -0.5, 0.03, 'body', { ring: true }), ...stripes(hx - 0.45, hx + 0.25, sy + 0.05, -0.54),
        rr(hx - 0.5, sy - 0.12, hx + 0.3, sy - 0.03, 0.03, 'white'),
        rr(hx + 0.25, sy - 0.3, hx + 0.45, -0.5, 0.03, 'body'), rr(hx + 0.22, sy - 0.36, hx + 0.48, sy - 0.27, 0.03, 'white'),
        // the porters under the pole ends, their faces hidden by the hats
        ...[f.tail.x - 0.12, f.nose.x + 0.12].flatMap((x, i) => {
          const g = f.wheels[i].y + f.wheels[i].r, s = i ? 0.08 : -0.08;
          return [
            ...path([[x - 0.04, -0.05], [x - 0.08 - s, g - 0.12]], 0.1, 'dark'), ...path([[x + 0.06, -0.05], [x + 0.12 + s, g - 0.12]], 0.1, 'dark'),
            rr(x - 0.2 - s, g - 0.12, x - 0.0 - s, g, 0.03, 'green'), rr(x + 0.06 + s, g - 0.12, x + 0.26 + s, g, 0.03, 'green'),
            rr(x - 0.18, -0.45, x + 0.18, 0.02, 0.06, 'body'), rect(x - 0.18, -0.12, x + 0.18, -0.06, 'accent', { flat: true }),
            seg([x - 0.15, -0.42], [x + 0.15, -0.1], 0.05, 'accent'),
            circ(x + 0.03, -0.48, 0.12, 'tan'),
            poly([[x - 0.38, -0.44], [x + 0.03, -0.82], [x + 0.44, -0.44]], 'gold'), rect(x - 0.38, -0.46, x + 0.44, -0.42, 'brown', { flat: true }),
          ];
        }),
      ];
    },
  }],
  ['cloud', 'Cloud', 'Чарівна хмаринка: пливе над ареною.', 'blob', ['#d83a2a', '#e8b830'], {
    o: o({ shape: 'flat', mat: 'white' }), float: 0.75, noLights: true, axles: [0.6, 0.6],
    // After Drive Ahead's New Year cloud: an auspicious cloud tapering to a point at both ends,
    // three round lobes with white spirals, a gold rim underneath, a little staff behind the player.
    skin: () => {
      const curl = (cx: number, cy: number, r: number) => [arc(cx, cy, r, Math.PI * 0.85, Math.PI * 2.3, 0.08, 'accent', { flat: true }), arc(cx + r * 0.2, cy, r * 0.45, Math.PI * 1.3, Math.PI * 2.8, 0.08, 'accent', { flat: true })];
      return [
        // the staff behind the player
        ...path([[-0.75, -0.3], [-0.3, -1.2]], 0.06, 'accent'),
        // the gold rim, then the cloud: pointed ends, a flat belly, three lobes
        poly([[-1.5, 0.02], [-1.0, -0.2], [1.0, -0.2], [1.55, 0.02], [0.9, 0.42], [-0.9, 0.42]], 'accent'),
        poly([[-1.42, -0.02], [-0.95, -0.25], [0.95, -0.25], [1.47, -0.02], [0.85, 0.34], [-0.85, 0.34]], 'body'),
        ell(-0.6, -0.4, 0.42, 0.36, 'body'), ell(0.2, -0.5, 0.5, 0.42, 'body'), ell(0.85, -0.28, 0.36, 0.3, 'body'),
        ...curl(-0.6, -0.38, 0.22), ...curl(0.2, -0.46, 0.27), ...curl(0.85, -0.26, 0.18),
      ];
    },
  }],
  ['chinese-dragon', 'Chinese Dragon', 'Довгий східний дракон із вусами. Дихає полум\'ям.', 'creature', ['#2a6ad8', '#3aa84a'], {
    o: o({ neck: 'raptor', len: 1.3, wheel: 0.8 }), parts: ['plates', 'tail', 'mohawk'], noLights: true, hideParts: true,
    // the fire leaves the open jaws
    gun: () => ({ at: [[2.1, -0.78]], aim: 4 }),
    // the player rides high on the hump between the loops
    head: () => [0.0, -1.12],
    // After Drive Ahead's New Year dragon: a thick body bent into a square wave, each loop standing
    // on a wheel and the player riding the hump between them; a white shine along the top, green
    // bristles along the edges, a finned tail, and a blocky head with a white horn and a green mane.
    skin: (f) => {
      const { rear, front } = dims(f);
      const top = -0.78, bot = -0.04, T = 0.34, w = 0.34;
      const pts: [number, number][] = [[-1.95, top], [rear - w, top], [rear - w, bot], [rear + w, bot], [rear + w, top], [front - w, top], [front - w, bot], [front + w, bot], [front + w, top], [1.3, -0.8]];
      // bristles: green ticks along the outside of every run
      const ticks: CarPoly[] = [];
      for (let i = 0; i + 1 < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[i + 1], l = Math.hypot(bx - ax, by - ay), n = Math.floor(l / 0.14);
        const nx = (by - ay) / l, ny = -(bx - ax) / l;
        for (let k = 1; k < n; k++) {
          const x = ax + ((bx - ax) * k) / n, y = ay + ((by - ay) * k) / n;
          ticks.push(seg([x + nx * T * 0.4, y + ny * T * 0.4], [x + nx * T * 0.95, y + ny * T * 0.95], 0.07, 'accent'));
        }
      }
      return [
        ...ticks,
        // the finned tail
        ...[[-2.4, -0.75], [-2.45, -0.45], [-2.35, -0.2]].map(([x, y]) => poly([[-1.9, top - 0.12], [-1.9, top + 0.12], [x, y]], 'accent')),
        // the body: a thick blue tube with a white shine on top and a dark green underside
        ...path(pts, T, 'body'),
        ...path(pts.map(([x, y]) => [x, y + T * 0.36] as [number, number]), 0.05, 'dark'),
        ...[[-1.95, rear - w], [rear + w, front - w], [front + w, 1.2]].map(([a, b]) => rect(a, top - T / 2 + 0.03, b, top - T / 2 + 0.08, 'white', { flat: true })),
        // the feet: white claws over the wheels
        ...[rear, front].flatMap((x) => [-0.2, 0.0, 0.2].map((d) => poly([[x + d - 0.06, bot + T / 2 - 0.02], [x + d + 0.06, bot + T / 2 - 0.02], [x + d, bot + T / 2 + 0.1]], 'white'))),
        // the head: green mane, a white horn sweeping back, a blocky blue skull, open jaws
        rr(1.05, -1.22, 1.55, -0.66, 0.1, 'accent'), ...[[0.95, -1.2], [0.9, -0.95], [0.95, -0.72]].map(([x, y]) => poly([[1.1, y - 0.06], [1.1, y + 0.06], [x, y]], 'accent')),
        ...path([[1.45, -1.14], [1.25, -1.39], [1.05, -1.54]], 0.08, 'white'),
        rr(1.35, -1.16, 2.05, -0.84, 0.08, 'body'), rect(1.4, -1.14, 1.95, -1.1, 'white', { flat: true }),
        rr(1.95, -1.1, 2.12, -0.9, 0.04, 'white'),
        ell(1.62, -1.0, 0.06, 0.035, 'black', { flat: true }), rect(1.52, -1.08, 1.72, -1.05, 'accent', { flat: true }),
        rect(1.5, -0.84, 2.06, -0.7, 'black', { flat: true }), ...fangs(1.62, 2.02, -0.84, 3, 0.08),
        rr(1.48, -0.71, 1.98, -0.6, 0.04, 'body'), ...[1.55, 1.7, 1.85].map((x) => rect(x, -0.6, x + 0.06, -0.52, 'accent')),
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
