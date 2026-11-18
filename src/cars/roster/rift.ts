import { beacon, blob, circ, ell, eyeball, fangs, path, poly, rect, rr, seg, spikesAlong, stack, starShape, stripe, tank } from '../draw';
import { arc, boxy, carriage, hover, pickup, tracks, monsterTruck } from '../skins';
import type { CarMat, CarPoly, Pt } from '../types';
import type { Frame } from '../factory';
import { saddle, theropod, arm, browEye, dragonHead } from '../critters';
import { group, o } from './util';

function base(f: Frame, mat: CarMat = 'body', h = 0.38): CarPoly[] {
  const a = f.wheels[0], b = f.wheels[f.wheels.length - 1];
  const y = a.y - a.r - 0.06;
  return [
    ...tracks(f), blob([[a.x - a.r - 0.15, y + 0.04], [a.x - a.r - 0.05, y - h], [b.x + b.r - 0.35, y - h - 0.02], [b.x + b.r + 0.15, y - 0.06], [b.x + b.r, y + 0.04]], mat, {}, 1),
    rr(a.x - a.r - 0.1, y - 0.06, b.x + b.r + 0.05, y + 0.12, 0.04, mat, { ring: true }),
    ...[0, 1, 2, 3, 4].map((i) => circ(a.x - a.r + (i * (b.x - a.x + 2 * a.r)) / 4, y + 0.03, 0.03, 'dark')),
  ];
}
const crystal = (x: number, y: number, h: number, w: number, mat: CarMat = 'white'): CarPoly => poly([[x - w / 2, y], [x - w * 0.6, y - h * 0.6], [x, y - h], [x + w * 0.6, y - h * 0.6], [x + w / 2, y]], mat);
const tentacles = (x: number, y: number, n: number, len: number, mat: CarMat = 'accent', dir = -1): CarPoly[] =>
  Array.from({ length: n }, (_, i) => path([[x, y + i * 0.12], [x + dir * len * 0.5, y + 0.15 + i * 0.2], [x + dir * len, y + 0.05 + i * 0.3], [x + dir * len * 1.1, y - 0.1 + i * 0.3]], 0.1 - i * 0.01, mat)).flat();
const glowEyes = (x: number, y: number, n: number, mat: CarMat = 'accent'): CarPoly[] => Array.from({ length: n }, (_, i) => circ(x + i * 0.2, y - (i % 2) * 0.08, 0.07, mat));

export const RIFT = group('rift', [
  ['crystallizer', 'CrystalLizer', 'Кристалічний ящір на гусеницях: броня-дзеркало відбиває снаряди.', 'tracked', ['#5ad0f0', '#ffffff'], {
    parts: ['crystals'], hideParts: true,
    skin: (f) => {
      const a = f.wheels[0], b = f.wheels[f.wheels.length - 1], y = a.y - a.r - 0.06;
      return [
        ...tracks(f),
        // a crystal lizard sprawled over the tracks: clawed legs, faceted body, spiky tail
        ...[a.x + 0.2, b.x - 0.2].flatMap((x) => [...path([[x, y - 0.3], [x + 0.2, y - 0.05], [x + 0.3, y + 0.05]], 0.14, 'body'), ...[0, 1].map((i) => poly([[x + 0.24 + i * 0.1, y + 0.02], [x + 0.32 + i * 0.1, y + 0.02], [x + 0.4 + i * 0.1, y + 0.12]], 'white'))]),
        blob([[a.x - a.r, y - 0.25], [a.x - a.r - 0.6, y - 0.55], [a.x - a.r - 0.95, y - 0.75], [a.x - a.r - 0.5, y - 0.4], [a.x - 0.2, y - 0.05]], 'body', {}, 1),
        blob([[a.x - 0.3, y - 0.05], [a.x - 0.2, y - 0.5], [0.0, y - 0.65], [b.x - 0.1, y - 0.55], [b.x + 0.3, y - 0.3], [b.x + 0.1, y - 0.02]], 'body', {}, 2),
        ...[[-0.9, 0.35], [-0.45, 0.5], [0.4, 0.45], [0.8, 0.3]].map(([x, h]) => crystal(x, y - 0.55, h, 0.22, 'sky')),
        ...[[-0.6, y - 0.3], [0.2, y - 0.35], [0.6, y - 0.2]].map(([x, yy]) => poly([[x - 0.12, yy], [x, yy - 0.12], [x + 0.12, yy], [x, yy + 0.12]], 'white', { flat: true })),
        // head: wedge snout with crystal horns and a glowing eye
        blob([[b.x - 0.05, y - 0.6], [b.x + 0.45, y - 0.65], [b.x + 0.95, y - 0.4], [b.x + 0.9, y - 0.2], [b.x + 0.2, y - 0.15]], 'body', {}, 1),
        crystal(b.x + 0.2, y - 0.6, 0.35, 0.14, 'sky'), crystal(b.x + 0.42, y - 0.62, 0.25, 0.12, 'white'),
        ...browEye(b.x + 0.5, y - 0.45, 0.07, 'purple', 'sky'),
        rect(b.x + 0.5, y - 0.28, b.x + 0.9, y - 0.25, 'dark', { flat: true }),
      ];
    },
  }],
  ['freezer', 'Freezer', 'Кріогенна машина з балоном рідкого азоту. Заморожує суперника.', 'box', ['#a8e0ff', '#ffffff'], {
    parts: ['tank'], hideParts: true,
    skin: (f) => [
      ...boxy(f, { x0: f.nose.x - 1.2, slope: 0.3, slopeH: 0.4 }),
      rr(f.tail.x, -0.25, f.nose.x - 1.15, 0.3, 0.04, 'dark'),
      tank(f.tail.x + 0.05, f.nose.x - 1.25, -0.6, 0.32, 'chrome'), ...[-1.1, -0.6].map((x) => rect(x, -0.92, x + 0.06, -0.28, 'grey', { flat: true })),
      rr(-0.95, -0.72, -0.5, -0.48, 0.04, 'blue'), rect(-0.9, -0.66, -0.55, -0.62, 'white', { flat: true }),
      ...path([[-0.2, -0.85], [0.1, -1.05], [0.3, -1.05]], 0.06, 'grey'),
      ...[-1.2, -0.7, -0.2, 0.3].map((x) => poly([[x - 0.08, 0.3], [x + 0.08, 0.3], [x, 0.48]], 'white')),
      ...[0.5, 0.75].map((x) => ell(x, f.roof.y - 0.1, 0.1, 0.06, 'white')),
      poly([[-0.4, -0.72], [-0.22, -0.42], [-0.58, -0.42]], 'yellow'), rect(-0.42, -0.62, -0.38, -0.5, 'black', { flat: true }),
      // frost on the nitrogen tank and a big snowflake badge; cold vapour spills off the nozzle (animated)
      ...[[-1.5, -0.82], [-0.85, -0.85], [-0.3, -0.82]].map(([x, y]) => ell(x, y, 0.16, 0.05, 'white', { flat: true })),
      starShape(-1.3, -0.58, 0.16, 'white'), starShape(-1.3, -0.58, 0.08, 'sky'),
    ],
    fx: () => [{ kind: 'frost', at: [0.32, -1.05], dir: -20, size: 0.2, mat: 'white' }],
  }],
  ['harpoon', 'Harpoon', 'Платформа з гарпунною гарматою: б\'є і притягує суперника.', 'pickup', ['#3e6a9a', '#ffd23f'], {
    gun: (f) => ({ at: [[1.12, f.deck.y - 1.02]], aim: 20 }),
    parts: [['cannon', 1.2]], hideParts: true,
    skin: (f) => [
      ...pickup(f),
      circ(f.deck.x0 + 0.35, f.deck.y - 0.2, 0.22, 'wood'), circ(f.deck.x0 + 0.35, f.deck.y - 0.2, 0.09, 'dark'),
      ...path([[-0.6, f.deck.y - 0.1], [-0.2, f.deck.y - 0.55]], 0.18, 'dark'),
      ...path([[-0.2, f.deck.y - 0.55], [0.9, f.deck.y - 0.95]], 0.08, 'chrome'),
      poly([[0.9, f.deck.y - 1.05], [1.15, f.deck.y - 1.02], [0.95, f.deck.y - 0.85]], 'chrome'),
      stripe(f.tail.x, f.nose.x, 0.06, 0.06, 'accent'),
      ...[0.07, 0.13].map((r) => circ(f.deck.x0 + 0.35, f.deck.y - 0.2, r, 'tan', { flat: true })).slice(0, 1), circ(f.deck.x0 + 0.35, f.deck.y - 0.2, 0.05, 'dark'),
      rr(-0.35, f.deck.y - 0.75, -0.05, f.deck.y - 0.45, 0.04, 'grey'),
    ],
  }],
  ['mine-lander', 'Mine Lander', 'Гусеничний мінний загороджувач: закидає міни вперед.', 'tracked', ['#3a3a4a', '#ff3a3a'], {
    parts: ['barrels'], hideParts: true,
    skin: (f) => [
      ...base(f),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => poly([[-1.6 + i * 0.4, -0.18], [-1.4 + i * 0.4, -0.18], [-1.5 + i * 0.4, 0.0], [-1.7 + i * 0.4, 0.0]], 'yellow', { flat: true })),
      ...[0, 1, 2].map((i) => [circ(-0.9 + i * 0.5, -0.65, 0.2, 'dark'), circ(-0.9 + i * 0.5, -0.65, 0.07, 'red'), ...spikesAlong(-1.05 + i * 0.5, -0.75 + i * 0.5, -0.82, 2, 0.1, 'grey')]).flat(),
      rr(0.75, -0.95, 1.4, -0.5, 0.06, 'body'), rect(0.95, -0.88, 1.32, -0.68, 'glass'), rect(0.75, -0.62, 1.4, -0.58, 'accent', { flat: true }),
      ...beacon(1.1, -0.95, 'red', 0.12),
    ],
  }],
  ['kraken-bait', 'Kraken\'s Bait', 'Бочка-приманка, з якої вже лізуть щупальця.', 'blob', ['#8a5a2a', '#3a3a3a'], {
    o: o({ mat: 'wood' }), parts: ['tentacles'], noLights: true, hideParts: true,
    skin: () => [
      ...tentacles(-0.8, -0.5, 3, 0.7, 'pink'),
      blob([[-0.95, 0.35], [-1.0, -0.35], [-0.95, -1.05], [0.95, -1.05], [1.0, -0.35], [0.95, 0.35]], 'wood', {}, 1),
      ...[-0.85, -0.25, 0.25].map((y) => [rr(-1.02, y - 0.06, 1.02, y + 0.06, 0.03, 'grey'), ...[-0.7, 0.0, 0.7].map((x) => circ(x, y, 0.025, 'dark'))]).flat(),
      ...[-0.5, 0.1].map((x) => rect(x, -1.0, x + 0.03, 0.3, 'brown', { flat: true })), rr(-0.9, 0.3, 0.9, 0.44, 0.04, 'dark'),
      ...eyeball(0.5, -0.55, 0.12, 'red'),
      ...path([[0.6, -1.0], [0.75, -1.4], [0.95, -1.35]], 0.12, 'pink'), ...path([[-0.4, -1.0], [-0.5, -1.35], [-0.3, -1.45]], 0.1, 'pink'),
    ],
  }],
  ['bat-holder', 'Bat Holder', 'Візок-сідало, повний кажанів.', 'cart', ['#3a2a4a', '#a050e0'], {
    o: o({ len: 1.6 }), parts: ['wings'], noLights: true, hideParts: true, wheelie: 0.6,
    skin: (f) => [
      blob([[f.tail.x, f.deck.y], [f.nose.x, f.deck.y], [f.nose.x - 0.18, 0.16], [f.tail.x + 0.18, 0.16]], 'body', {}, 1),
      ...path([[f.tail.x + 0.1, f.deck.y], [f.tail.x + 0.1, f.deck.y - 0.7], [f.nose.x - 0.1, f.deck.y - 0.7], [f.nose.x - 0.1, f.deck.y]], 0.07, 'wood'),
      // bats hang upside down from the perch either side of the driver, more roost on top of it
      ...[f.tail.x + 0.3, f.tail.x + 0.75, f.nose.x - 0.75, f.nose.x - 0.3].filter((x) => Math.abs(x - f.head.x) > 0.42).flatMap((x) => {
        const y = f.deck.y - 0.62;
        return [
          seg([x, y - 0.08], [x, y], 0.03, 'black'),
          poly([[x - 0.26, y + 0.05], [x - 0.1, y + 0.02], [x - 0.08, y + 0.3], [x - 0.2, y + 0.22]], 'accent'),
          poly([[x + 0.26, y + 0.05], [x + 0.1, y + 0.02], [x + 0.08, y + 0.3], [x + 0.2, y + 0.22]], 'accent'),
          ell(x, y + 0.17, 0.09, 0.15, 'dark'), circ(x - 0.04, y + 0.25, 0.025, 'red'), circ(x + 0.04, y + 0.25, 0.025, 'red'),
          poly([[x - 0.06, y + 0.33], [x - 0.02, y + 0.3], [x - 0.05, y + 0.38]], 'dark'), poly([[x + 0.06, y + 0.33], [x + 0.02, y + 0.3], [x + 0.05, y + 0.38]], 'dark'),
        ];
      }),
      ...[f.tail.x + 0.55, f.nose.x - 0.6].flatMap((x) => {
        const y = f.deck.y - 0.8;
        return [poly([[x - 0.22, y - 0.12], [x - 0.06, y - 0.02], [x, y - 0.1], [x + 0.06, y - 0.02], [x + 0.22, y - 0.12], [x + 0.1, y + 0.04], [x - 0.1, y + 0.04]], 'accent'), ell(x, y - 0.03, 0.07, 0.08, 'dark'), circ(x - 0.025, y - 0.05, 0.02, 'red'), circ(x + 0.025, y - 0.05, 0.02, 'red')];
      }),
      stripe(f.tail.x + 0.1, f.nose.x - 0.1, f.deck.y + 0.25, 0.06, 'accent'),
      ...f.wheels.map((w) => arc(w.x, w.y, w.r + 0.08, Math.PI * 1.1, Math.PI * 1.9, 0.09, 'body')),
      ...path([[f.nose.x - 0.1, f.deck.y - 0.7], [f.nose.x + 0.15, f.deck.y - 0.85]], 0.04, 'wood'), ell(f.nose.x + 0.18, f.deck.y - 0.7, 0.08, 0.11, 'light'),
    ],
  }],
  ['ghost-ship', 'Ghost Ship', 'Летючий корабель-привид із подертими вітрилами.', 'boat', ['#4a5a6a', '#a0f0d0'], {
    parts: ['sail'], float: 0.85, noLights: true, hideParts: true,
    skin: (f) => [
      blob([[f.tail.x - 0.1, -0.85], [f.tail.x + 0.4, -0.55], [f.nose.x - 0.3, -0.5], [f.nose.x + 0.3, -0.6], [f.nose.x - 0.3, 0.05], [f.tail.x + 0.3, 0.1]], 'body', {}, 1),
      rr(f.tail.x - 0.1, -0.95, f.tail.x + 0.6, -0.5, 0.04, 'body'),
      ...[-1.0, -0.5, 0.0, 0.5].map((x) => [circ(x, -0.22, 0.1, 'dark'), circ(x, -0.22, 0.07, 'accent')]).flat(),
      ...[-0.38, 0.0].map((y) => stripe(f.tail.x + 0.4, f.nose.x - 0.4, y, 0.025, 'dark')), rr(f.tail.x + 0.3, 0.02, f.nose.x - 0.4, 0.12, 0.04, 'accent'),
      ...path([[0.1, -0.5], [0.1, -2.0]], 0.08, 'wood'),
      poly([[0.15, -1.9], [0.75, -1.85], [0.6, -1.5], [0.85, -1.3], [0.6, -1.1], [0.75, -0.75], [0.15, -0.7]], 'accent'),
      poly([[0.05, -1.75], [-0.6, -1.6], [-0.45, -1.2], [-0.65, -0.85], [0.05, -0.75]], 'accent'),
      ...path([[f.nose.x + 0.2, -0.6], [f.nose.x + 0.7, -0.95]], 0.05, 'wood'),
      poly([[-0.1, -2.05], [-0.1, -1.9], [-0.45, -1.95]], 'black'),
    ],
  }],
  ['urn-launcher', 'Urn Launcher', 'Мобільна катапульта: метає урни, що розбиваються з вибухом.', 'tracked', ['#7a5a3a', '#e0c080'], {
    gun: (f) => ({ at: [[f.deck.x1 + 0.27, f.deck.y - 1.32]], aim: 45 }),
    skin: (f) => [
      ...base(f, 'body', 0.3),
      poly([[f.deck.x0 + 0.1, f.deck.y], [f.deck.x0 + 0.5, f.deck.y - 0.7], [f.deck.x0 + 0.9, f.deck.y]], 'wood'),
      ...path([[f.deck.x0 + 0.5, f.deck.y - 0.6], [f.deck.x1 + 0.2, f.deck.y - 1.1]], 0.1, 'wood'),
      blob([[f.deck.x1 + 0.0, f.deck.y - 1.1], [f.deck.x1 + 0.5, f.deck.y - 1.15], [f.deck.x1 + 0.45, f.deck.y - 1.0], [f.deck.x1 + 0.05, f.deck.y - 0.98]], 'wood', {}, 1),
      blob([[f.deck.x1 + 0.12, f.deck.y - 1.12], [f.deck.x1 + 0.08, f.deck.y - 1.35], [f.deck.x1 + 0.2, f.deck.y - 1.5], [f.deck.x1 + 0.35, f.deck.y - 1.5], [f.deck.x1 + 0.45, f.deck.y - 1.35], [f.deck.x1 + 0.4, f.deck.y - 1.12]], 'accent', {}, 1),
      stripe(f.deck.x1 + 0.1, f.deck.x1 + 0.42, f.deck.y - 1.3, 0.04, 'brown'),
      circ(f.deck.x0 + 0.5, f.deck.y - 0.6, 0.08, 'dark'),
      ...[-1.0, -0.4, 0.2].map((x) => circ(x, -0.38, 0.035, 'grey')), stripe(-1.5, 1.5, -0.2, 0.06, 'accent'),
      ...path([[f.deck.x0 + 0.5, f.deck.y - 0.6], [f.deck.x0 + 0.2, f.deck.y - 0.1]], 0.03, 'tan'),
    ],
  }],
  ['ghost-dragon-summoner', 'Ghost Dragon Summoner', 'Платформа заклинача: кристали кличуть примарного дракона, що дихає вогнем.', 'carriage', ['#2a2a4a', '#7aff9a'], {
    gun: (f) => ({ at: [[f.roof.x1 + 1.4, f.roof.y - 0.66]], aim: 5 }),
    parts: ['crystals'], hideParts: true,
    skin: (f) => [
      ...carriage(f, { trim: 'accent' }),
      crystal(-0.5, f.roof.y - 0.05, 0.6, 0.3, 'accent'), crystal(-0.2, f.roof.y - 0.05, 0.4, 0.22, 'sky'),
      // the summoned ghost dragon: a pale glowing body coiling up out of the crystals, a wing spread
      // behind, and the head reared over the front, jaws open for the fire
      ...path([[-0.9, f.roof.y + 0.05], [-1.35, f.roof.y - 0.35], [-1.05, f.roof.y - 0.75], [-0.5, f.roof.y - 0.65], [0.1, f.roof.y - 0.8], [f.roof.x1 + 0.1, f.roof.y - 0.8]], 0.3, 'sky'),
      poly([[-0.5, f.roof.y - 0.7], [-1.25, f.roof.y - 1.5], [-0.8, f.roof.y - 1.3], [-0.45, f.roof.y - 1.6], [-0.2, f.roof.y - 1.2], [0.1, f.roof.y - 1.4], [0.05, f.roof.y - 0.8]], 'teal'),
      ...[[-1.25, -1.5], [-0.45, -1.6], [0.1, -1.4]].map(([x, y]) => seg([-0.3, f.roof.y - 0.75], [x, f.roof.y + y], 0.04, 'white')),
      ...dragonHead(f.roof.x1 + 0.25, f.roof.y - 0.7, 0.95, { mat: 'sky', snout: 'white', mane: ['teal', 'accent'], spikes: 'white', horn: 'white', whiskers: 'accent', maneLen: 0.45 }),
      ...[-0.6, 0.0, 0.6].map((x) => [circ(x, f.roof.y + 0.45, 0.11, 'dark'), circ(x, f.roof.y + 0.45, 0.07, 'accent')]).flat(),
    ],
    // the dragon's fire and the crystals' sparks are animated
    fx: (f) => [{ kind: 'flame', at: [f.roof.x1 + 1.4, f.roof.y - 0.66], dir: 5, size: 0.22 }, { kind: 'spark', at: [-0.4, f.roof.y - 0.5], size: 0.18, mat: 'accent', rate: 0.6 }],
  }],
  ['jelly-shock', 'Jelly Shock', 'Електрична медуза: б\'є струмом блискавкою.', 'blob', ['#ff7ad0', '#5ef0ff'], {
    o: o({ shape: 'egg' }), parts: ['tentacles'], bounce: 0.5, noLights: true, hideParts: true,
    skin: () => [
      ...[-0.6, -0.3, 0.0, 0.3, 0.6].map((x, i) => path([[x, -0.1], [x + (i % 2 ? 0.1 : -0.1), 0.15], [x, 0.4]], 0.08, 'pink')).flat(),
      blob([[-0.95, -0.05], [-0.95, -0.6], [-0.5, -1.15], [0.5, -1.15], [0.95, -0.6], [0.95, -0.05]], 'body', {}, 2),
      ell(0, -0.75, 0.55, 0.3, 'pink'),
      ...eyeball(0.45, -0.5, 0.09), ...eyeball(0.15, -0.5, 0.08),
      ...[-0.5, 0.0].map((x) => poly([[x, -0.15], [x + 0.1, -0.15], [x + 0.04, 0.0], [x + 0.12, 0.0], [x - 0.04, 0.25], [x + 0.02, 0.05], [x - 0.06, 0.05]], 'accent', { flat: true })),
      ell(-0.35, -0.95, 0.22, 0.08, 'white', { flat: true }), ...[[-0.6, -0.55], [-0.35, -0.3]].map(([x, y]) => circ(x, y, 0.05, 'white')), rr(-0.9, 0.14, 0.9, 0.3, 0.05, 'dark'),
    ],
  }],
  ['abyss-eel', 'Abyss Eel', 'Глибоководний вугор зі світними плямами.', 'creature', ['#2a4a6a', '#5ef0ff'], {
    o: o({ neck: 'raptor', len: 1.3, tall: 0.7 }), parts: ['tail'], noLights: true, hideParts: true,
    skin: (f) => {
      const L = 1.3;
      const spine: [number, number][] = [[f.tail.x - 1.0, -0.6], [f.tail.x - 0.4, -0.25], [-0.7, -0.42], [0.0, -0.25], [0.7, -0.42], [1.05 * L, -0.55]];
      return [
        // undulating eel body riding low over the wheels: a teal ribbon fin along the back,
        // a pale belly, and rows of glowing spots
        ...path(spine.map(([x, y]) => [x, y - 0.24] as [number, number]), 0.16, 'teal'),
        ...path(spine, 0.52, 'body'),
        ...path(spine.slice(1).map(([x, y]) => [x, y + 0.16] as [number, number]), 0.14, 'grey'),
        ...spine.slice(1, -1).flatMap(([x, y]) => [circ(x - 0.2, y - 0.08, 0.06, 'accent'), circ(x + 0.15, y - 0.04, 0.06, 'accent')]),
        poly([[f.tail.x - 1.0, -0.6], [f.tail.x - 1.35, -0.95], [f.tail.x - 1.3, -0.3]], 'teal'),
        rr(f.wheels[0].x - 0.2, -0.05, f.wheels[1].x + 0.2, 0.1, 0.04, 'dark'),
        // the angler head: a huge underbite of needle teeth, a glowing lure on a stalk, a pale eye
        ...path([[1.3 * L, -0.95], [1.2 * L, -1.35], [1.5 * L, -1.5]], 0.05, 'grey'), circ(1.52 * L, -1.5, 0.11, 'accent'), circ(1.52 * L, -1.5, 0.05, 'white'),
        blob([[0.95 * L, -0.85], [1.4 * L, -1.0], [1.85 * L, -0.85], [1.95 * L, -0.6], [1.2 * L, -0.55], [0.9 * L, -0.45]], 'body', {}, 1),
        poly([[1.05 * L, -0.55], [1.95 * L, -0.6], [1.95 * L, -0.28], [1.1 * L, -0.3]], 'black', { flat: true }),
        ...fangs(1.15 * L, 1.92 * L, -0.58, 6, 0.12), ...fangs(1.2 * L, 1.95 * L, -0.31, 6, 0.13, true),
        blob([[0.95 * L, -0.4], [1.98 * L, -0.33], [2.02 * L, -0.12], [1.1 * L, -0.12]], 'body', {}, 1),
        circ(1.45 * L, -0.78, 0.11, 'sky', { flat: true }), circ(1.48 * L, -0.78, 0.05, 'black', { flat: true }),
        ...saddle(f.head.x, f.head.y + 0.2, 'teal'),
      ];
    },
  }],
  ['blast-fish', 'Blast Fish', 'Механічна риба-їжак. Скидає вибухову ікру.', 'blob', ['#e0a020', '#e02a2a'], {
    parts: ['fin', 'spikes'], noLights: true,
    skin: () => [
      poly([[-0.85, -0.35], [-1.3, -0.75], [-1.2, -0.35], [-1.3, 0.05]], 'accent'),
      ...Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return poly([[Math.cos(a - 0.12) * 0.85, -0.35 + Math.sin(a - 0.12) * 0.65], [Math.cos(a) * 1.15, -0.35 + Math.sin(a) * 0.9], [Math.cos(a + 0.12) * 0.85, -0.35 + Math.sin(a + 0.12) * 0.65]], 'spike');
      }),
      ell(0, -0.35, 0.92, 0.7, 'body', {}, 28),
      ell(0.1, -0.1, 0.6, 0.35, 'cream'),
      ...eyeball(0.45, -0.55, 0.15),
      ell(0.88, -0.22, 0.09, 0.07, 'black'),
      poly([[-0.2, -0.95], [0.1, -1.25], [0.25, -0.9]], 'accent'),
      ...[[-0.5, -0.6], [-0.3, -0.45], [-0.6, -0.3]].map(([x, y]) => circ(x, y, 0.05, 'orange')), ell(-0.3, -0.85, 0.2, 0.08, 'white', { flat: true }), rr(-0.9, 0.14, 0.9, 0.3, 0.05, 'dark'),
    ],
  }],
  ['cosmic-squid', 'Cosmic Squid', 'Космічний кальмар: пливе крізь повітря на щупальцях.', 'blob', ['#7a3ae0', '#ff7ad0'], {
    o: o({ shape: 'egg' }), parts: ['tentacles'], float: 0.8, noLights: true, hideParts: true,
    skin: () => [
      ...tentacles(-0.6, -0.3, 4, 0.9, 'body'),
      blob([[-0.8, 0.15], [-0.95, -0.4], [-0.5, -1.0], [0.1, -1.45], [0.55, -0.95], [0.95, -0.35], [0.8, 0.15]], 'body', {}, 2),
      poly([[-0.2, -1.2], [0.1, -1.55], [0.4, -1.2]], 'accent'),
      ...eyeball(0.4, -0.45, 0.14),
      ...[[-0.3, -0.9, 0.1], [0.2, -1.05, 0.07], [-0.5, -0.4, 0.08], [0.0, -0.2, 0.06]].map(([x, y, r]) => circ(x, y, r, 'accent')),
      ell(-0.15, -1.15, 0.15, 0.07, 'white', { flat: true }), rr(-0.9, 0.14, 0.9, 0.3, 0.05, 'dark'),
    ],
  }],
  ['space-scallop', 'Space Scallop', 'Броньований гребінець зі стулками-панцирем.', 'blob', ['#f0a0c0', '#ffffff'], {
    o: o({ shape: 'flat' }), parts: ['plates'], noLights: true, hideParts: true,
    skin: () => [
      blob([[-1.25, -0.05], [-1.1, -0.55], [-0.5, -0.85], [0.5, -0.85], [1.1, -0.55], [1.25, -0.05]], 'body', {}, 2),
      ...[-0.95, -0.55, -0.15, 0.25, 0.65, 1.0].map((x) => seg([0, 0.1], [x, -0.65 + Math.abs(x) * 0.15], 0.07, 'accent')),
      rr(-1.3, -0.08, 1.3, 0.18, 0.1, 'pink'), poly([[-0.3, 0.1], [0.3, 0.1], [0.2, 0.3], [-0.2, 0.3]], 'accent'),
      ...[-0.6, -0.2, 0.2, 0.6].map((x) => circ(x, 0.05, 0.05, 'sky')), circ(0.0, -0.05, 0.1, 'white'), circ(0.0, -0.05, 0.06, 'sky'),
      ...[[-0.8, -0.45], [0.8, -0.45]].map(([x, y]) => ell(x, y, 0.1, 0.05, 'white', { flat: true })),
    ],
  }],
  ['atomic-ray', 'Atomic Ray', 'Гусеничний випромінювач атомних променів.', 'tracked', ['#3a3a4a', '#7aff3a'], {
    gun: () => ({ at: [[1.42, -1.38]], aim: 37 }),
    parts: ['dish'], hideParts: true,
    skin: (f) => [
      ...base(f),
      circ(0, -0.35, 0.22, 'yellow'), ...[0, 1, 2].map((i) => poly([[0, -0.35], [Math.cos(i * 2.1) * 0.2, -0.35 + Math.sin(i * 2.1) * 0.2], [Math.cos(i * 2.1 + 0.8) * 0.2, -0.35 + Math.sin(i * 2.1 + 0.8) * 0.2]], 'black', { flat: true })),
      rr(0.5, -0.9, 0.9, -0.45, 0.05, 'dark'), ...path([[0.7, -0.9], [1.3, -1.35]], 0.12, 'grey'),
      blob([[1.05, -1.55], [1.6, -1.35], [1.4, -1.05]], 'chrome', {}, 1), circ(1.32, -1.3, 0.08, 'accent'),
      ...[-1.2, -0.9, -0.6].map((x) => [tank(x - 0.12, x + 0.12, -0.68, 0.18, 'accent'), rect(x - 0.12, -0.72, x + 0.12, -0.66, 'dark', { flat: true })]).flat(),
      ...[0, 1, 2].map((i) => poly([[0.5 + i * 0.14, -0.45], [0.58 + i * 0.14, -0.45], [0.64 + i * 0.14, -0.6], [0.56 + i * 0.14, -0.6]], 'yellow', { flat: true })),
    ],
  }],
  ['doom-bomber', 'Doom Bomber', 'Важкий бомбардувальник розломів: скидає бомби з ґнотом.', 'hover', ['#3a3a4a', '#e02a2a'], {
    o: o({ len: 1.15 }), parts: ['wing', 'jets'], hideParts: true,
    skin: (f) => [
      poly([[f.tail.x + 0.1, -0.3], [f.tail.x - 0.2, -0.85], [f.tail.x + 0.25, -0.85], [f.tail.x + 0.8, -0.3]], 'accent'),
      rr(f.tail.x - 0.35, -0.22, f.tail.x + 0.05, 0.0, 0.05, 'grey'), rr(f.tail.x - 0.35, 0.02, f.tail.x + 0.05, 0.2, 0.05, 'grey'),
      ...hover(f, { glow: 'red', canopy: 'dark' }),
      ...[-0.8, -0.4, 0.0].map((x) => [circ(x, 0.28, 0.12, 'black'), seg([x, 0.16], [x + 0.06, 0.08], 0.03, 'tan')]).flat(),
      poly([[1.0, -0.2], [1.35, -0.12], [1.3, -0.05], [1.0, -0.1]], 'yellow'), circ(1.2, -0.12, 0.03, 'black'),
      poly([[-0.6, 0.0], [0.6, 0.0], [-0.5, 0.4], [-0.9, 0.4]], 'body'), ...[-0.4, 0.0].map((x) => circ(x, -0.15, 0.04, 'grey')), circ(-0.65, 0.2, 0.08, 'white'), rect(-0.67, 0.16, -0.63, 0.24, 'red', { flat: true }),
      // bomber wings over the hull, and the bomb bay: big round bombs with lit fuses hanging underneath
      poly([[-0.9, -0.42], [0.5, -0.42], [0.2, -0.62], [-0.6, -0.62]], 'grey'), poly([[-1.0, -0.45], [-0.75, -0.62], [-0.65, -0.45]], 'accent'),
      rr(-1.05, 0.12, 0.25, 0.22, 0.04, 'dark'),
      ...[-0.8, -0.4, 0.0].flatMap((x) => [circ(x, 0.4, 0.16, 'black'), circ(x - 0.05, 0.35, 0.05, 'grey'), seg([x + 0.05, 0.26], [x + 0.12, 0.18], 0.035, 'tan'), starShape(x + 0.13, 0.16, 0.05, 'orange')]),
    ],
  }],
  ['specimen-x', 'Specimen X', 'Колба з мутантом на гусеницях. Мутант дивиться на тебе.', 'tracked', ['#5a6a7a', '#7aff3a'], {
    parts: ['tank'], hideParts: true,
    skin: (f) => {
      const cx = (f.deck.x0 + f.deck.x1) / 2, y = f.deck.y;
      return [
        ...base(f),
        rr(cx - 0.75, y - 0.2, cx + 0.75, y + 0.05, 0.04, 'grey'), rr(cx - 0.75, y - 1.05, cx + 0.75, y - 0.92, 0.04, 'grey'),
        rr(cx - 0.68, y - 0.95, cx + 0.68, y - 0.18, 0.15, 'sky'), rect(cx - 0.55, y - 0.88, cx - 0.48, y - 0.3, 'white', { flat: true }),
        ...[cx - 0.6, cx + 0.6].map((x) => circ(x, y - 0.12, 0.04, 'chrome')),
        ell(cx, y - 0.45, 0.4, 0.28, 'accent'), ...eyeball(cx + 0.05, y - 0.5, 0.15, 'red'),
        ...path([[cx - 0.3, y - 0.3], [cx - 0.5, y - 0.2]], 0.07, 'accent'), ...path([[cx + 0.3, y - 0.3], [cx + 0.5, y - 0.2]], 0.07, 'accent'),
        ...[cx - 0.45, cx + 0.15].map((x) => circ(x, y - 0.8, 0.04, 'white')),
      ];
    },
  }],
  ['rcu', 'Rift Containment Unit', 'Контейнер стримування: поле глушить усе поруч.', 'box', ['#e0e0e0', '#ff3a3a'], {
    parts: ['siren'], hideParts: true,
    skin: (f) => [
      ...boxy(f, { slope: 0.25, slopeH: 0.4, round: 0.06 }),
      ...[0, 1, 2, 3, 4].map((i) => poly([[f.tail.x + 0.1 + i * 0.36, f.roof.y + 0.1], [f.tail.x + 0.28 + i * 0.36, f.roof.y + 0.1], [f.tail.x + 0.12 + i * 0.36, f.roof.y + 0.4], [f.tail.x - 0.06 + i * 0.36, f.roof.y + 0.4]], 'accent', { flat: true })),
      circ(-0.4, -0.1, 0.22, 'black'), circ(-0.4, -0.1, 0.13, 'purple'), circ(-0.4, -0.1, 0.05, 'white'),
      ...[f.roof.x1 - 0.7, f.roof.x1 - 0.45].map((x) => rr(x, f.roof.y - 0.16, x + 0.2, f.roof.y, 0.05, 'red')),
      rect(f.tail.x + 0.06, f.roof.y + 0.45, f.tail.x + 0.1, f.nose.y1 - 0.1, 'grey', { flat: true }), poly([[0.2, -0.3], [0.38, 0.0], [0.02, 0.0]], 'yellow'),
    ],
  }],
  ['void-hopper', 'Void Hopper', 'Ровер порожнечі: стрибає крізь портали на кілька метрів.', 'buggy', ['#2a1a3a', '#c07aff'], {
    bounce: 0.5,
    fx: (f) => [{ kind: 'spark', at: [f.tail.x - 0.35, -0.45], dir: -60, size: 0.2, mat: 'accent' }],
    skin: (f) => [
      ...f.wheels.map((w) => path([[w.x, w.y], [w.x * 0.7, -0.3], [w.x * 0.4, -0.05]], 0.08, 'purple')).flat(),
      blob([[f.tail.x + 0.1, 0.1], [f.tail.x + 0.2, -0.2], [0.0, -0.25], [f.nose.x - 0.2, -0.18], [f.nose.x, 0.05], [0.0, 0.15]], 'body', {}, 1),
      ell(0, 0.15, 0.35, 0.13, 'accent'), ell(0, 0.15, 0.2, 0.07, 'black'),
      ...path([[-0.85, -0.2], [-0.65, -0.95], [0.25, -0.95]], 0.08, 'accent'), seg([0.62, -0.15], [0.48, -0.42], 0.08, 'accent'),
      circ(f.nose.x - 0.15, -0.1, 0.07, 'light'),
      ...f.wheels.map((w) => arc(w.x, w.y, w.r + 0.08, Math.PI * 1.1, Math.PI * 1.9, 0.09, 'body')), stripe(f.tail.x + 0.2, f.nose.x - 0.2, -0.1, 0.04, 'accent'),
      // the void portal it hops through: a glowing ring behind the rover (its sparks are animated), and springy jump legs
      ell(f.tail.x - 0.35, -0.45, 0.22, 0.55, 'accent'), ell(f.tail.x - 0.35, -0.45, 0.14, 0.44, 'black'), ell(f.tail.x - 0.35, -0.45, 0.07, 0.3, 'purple'),
      ...[-0.35, 0.35].flatMap((x) => [seg([x, -0.2], [x + 0.1, -0.35], 0.04, 'grey'), seg([x + 0.1, -0.35], [x, -0.5], 0.04, 'grey')]),
    ],
  }],
  ['rift-monster', 'Rift Monster', 'Істота з порталу: зникає й з\'являється ближче до тебе.', 'monster', ['#3a1a4a', '#ff3aa0'], {
    arch: 'monster',
    o: o({ open: true }),
    parts: ['fangs'], hideParts: true,
    skin: (f) => {
      const x1 = f.nose.x, top = f.roof.y;
      return [
        // loose cables whipping out of the bed, glowing at the ends
        ...[[-1.3, -1.25], [-0.95, -1.4], [-1.5, -0.95]].flatMap(([x, y]) => [...path([[-1.0, -0.6], [(x - 1.0) / 2, y + 0.25], [x, y]], 0.05, 'dark'), circ(x, y, 0.07, 'accent')]),
        ...monsterTruck(f, { frame: 'purple', bar: 'dark' }),
        // rift cracks glowing through the panels, crystals on the hood
        ...path([[-1.3, -0.5], [-1.0, -0.3], [-0.7, -0.42], [-0.35, -0.2]], 0.06, 'accent'),
        ...path([[0.55, -0.45], [0.85, -0.28], [1.15, -0.4]], 0.06, 'accent'),
        ...[[x1 - 0.6, -0.55, 0.28], [x1 - 0.42, -0.52, 0.2]].map(([x, y, h]) => poly([[x - 0.08, y], [x + 0.08, y], [x + 0.03, y - h]], 'sky')),
        rr(f.roof.x0 + 0.05, top - 0.14, f.roof.x1 - 0.1, top - 0.05, 0.03, 'accent'),
        ...f.wheels.map((w) => circ(w.x, w.y, 0.12, 'accent')),
      ];
    },
  }],
  ['void-engine', 'Void Engine', 'Монолітний двигун порожнечі: телепортується вперед.', 'box', ['#1a1a24', '#c07aff'], {
    o: o({ tall: 1.2 }), parts: ['stack'], hideParts: true,
    skin: (f) => [
      ...boxy(f, { slope: 0.15, slopeH: 0.3, round: 0.04, bumper: 'purple' }),
      ...stack(f.roof.x1 - 0.4, f.roof.y, 0.45, 0.14, 'dark'), circ(f.roof.x1 - 0.4, f.roof.y - 0.5, 0.08, 'accent'),
      circ(-0.3, -0.45, 0.36, 'accent'), circ(-0.3, -0.45, 0.25, 'black'), circ(-0.3, -0.45, 0.12, 'purple'), circ(-0.3, -0.45, 0.05, 'white'),
      ...[0, 1, 2, 3, 4, 5].map((i) => seg([-0.3 + Math.cos(i * 1.05) * 0.38, -0.45 + Math.sin(i * 1.05) * 0.38], [-0.3 + Math.cos(i * 1.05) * 0.48, -0.45 + Math.sin(i * 1.05) * 0.48], 0.06, 'accent')),
      stripe(f.tail.x, f.nose.x, -0.02, 0.05, 'accent'),
      ...[f.tail.x + 0.2, f.tail.x + 0.5].map((x) => rect(x, f.roof.y + 0.15, x + 0.05, f.nose.y1 - 0.15, 'accent', { flat: true })),
    ],
    // warp exhaust streaming out behind and energy arcs round the rift drive (animated)
    fx: (f) => [
      { kind: 'wisp', at: [f.tail.x - 0.05, -0.5], dir: 180, size: 0.32, mat: 'accent' },
      { kind: 'bolt', at: [-0.75, -0.75], to: [0.15, -0.95], size: 0.16, mat: 'accent' },
      { kind: 'bolt', at: [0.15, -0.1], to: [-0.75, 0.0], size: 0.16, mat: 'accent' },
    ],
  }],
  ['mantis-shrimp', 'Mantis Shrimp', 'Рак-богомол на чотирьох колесах: низький сегментований панцир і серпоподібна клешня — найсильніший удар у світі.', 'tracked', ['#b0a6d8', '#ff3a9a'], {
    // After the reference: a low lavender body of overlapping plates tapering into a pointed tail
    // behind, pink lights along its belly, and the raised scythe of a claw in front (it punches).
    o: o({ len: 1.0, wheel: 1.12, rim: 'disc' }), arch: 'ram', noLights: true, accel: 1.2,
    // The scythe is a piece of its own: hinged at the shoulder on a spring, it sways as the
    // shrimp drives and lashes forward and down when it punches.
    links: (f) => {
      const g = f.wheels[0].y - f.wheels[0].r, sh: Pt = [0.95, g - 0.45];
      return [{
        at: sh, swing: [-25, 45], spring: 40, density: 0.35,
        hit: [
          seg(sh, [1.2, g - 1.2], 0.22),
          poly([[1.05, g - 1.35], [1.45, g - 1.42], [1.85, g - 1.25], [1.6, g - 1.1], [1.15, g - 1.1]]),
          poly([[1.85, g - 1.25], [2.05, g - 0.95], [2.0, g - 0.65], [1.75, g - 1.0]]),
        ],
        art: [
          ...path([sh, [1.05, g - 0.95], [1.2, g - 1.2]], 0.22, 'body'),
          blob([[1.05, g - 1.35], [1.45, g - 1.42], [1.85, g - 1.25], [2.05, g - 0.95], [2.0, g - 0.65], [1.9, g - 0.9], [1.6, g - 1.1], [1.15, g - 1.1]], 'body', {}, 1),
          ...path([[1.12, g - 1.3], [1.5, g - 1.36], [1.85, g - 1.2]], 0.06, 'white', { flat: true }),
          circ(1.08, g - 0.95, 0.09, 'purple'), circ(sh[0], sh[1], 0.1, 'accent'),
        ],
      }];
    },
    head: () => [-0.15, -0.72],
    skin: (f) => {
      const g = f.wheels[0].y - f.wheels[0].r;
      const plate = (x: number, i: number): CarPoly[] => {
        const h = 0.34 + i * 0.05;
        // each plate leans back over the next one, a pale top edge on it
        return [poly([[x - 0.12, g - 0.02], [x - 0.3, g - h], [x + 0.08, g - h - 0.08], [x + 0.3, g - 0.02]], 'body', { ring: true }), seg([x - 0.28, g - h + 0.02], [x + 0.06, g - h - 0.06], 0.05, 'white', { flat: true })];
      };
      return [
        // the pointed tail sweeping back and up
        poly([[-0.95, g - 0.04], [-1.75, g - 0.5], [-1.85, g - 0.55], [-1.0, g - 0.36]], 'body'),
        seg([-1.0, g - 0.33], [-1.78, g - 0.53], 0.04, 'white', { flat: true }),
        // overlapping plates, back to front
        ...[-0.85, -0.55, -0.25, 0.05, 0.35, 0.65].flatMap((x, i) => plate(x, i)),
        // belly rail with pink lights
        rr(-1.0, g - 0.08, 1.05, g + 0.06, 0.04, 'dark'),
        ...[-0.75, -0.3, 0.15, 0.6].map((x) => circ(x, g - 0.01, 0.05, 'accent')),
        // the head (the scythe on its hinge is a separate piece, see links)
        blob([[0.7, g], [0.75, g - 0.55], [1.05, g - 0.62], [1.2, g - 0.3], [1.1, g]], 'body', {}, 1),
        ...saddle(f.head.x, f.head.y + 0.22, 'accent'),
      ];
    },
  }],
  ['hercules-beetle', 'Hercules Beetle', 'Всюдихід-жук із рогом. Таранить з розгону.', 'blob', ['#3a2a1a', '#c0a040'], {
    o: o({ shape: 'flat' }), parts: [['drill', 1.5]], noLights: true, hideParts: true,
    skin: (f) => [
      ...[-0.7, -0.2, 0.3].map((x) => path([[x, 0.0], [x - 0.15, 0.2], [x - 0.25, 0.42]], 0.07, 'black')).flat(),
      ell(-0.1, -0.2, 1.1, 0.42, 'accent', {}, 28),
      seg([-0.1, -0.6], [-0.1, 0.15], 0.05, 'black'),
      blob([[0.7, -0.45], [1.15, -0.5], [f.nose.x + 0.05, -0.2], [1.1, 0.05], [0.75, 0.0]], 'body', {}, 1),
      ...path([[0.95, -0.45], [1.4, -1.1], [2.0, -1.35], [2.3, -1.1]], 0.16, 'black'),
      ...path([[f.nose.x - 0.05, -0.15], [f.nose.x + 0.7, -0.35], [f.nose.x + 1.25, -0.2]], 0.2, 'black'), ...path([[f.nose.x + 0.9, -0.33], [f.nose.x + 1.05, -0.6]], 0.1, 'black'),
      circ(1.05, -0.3, 0.05, 'red'),
      ell(-0.5, -0.4, 0.25, 0.08, 'gold'), ell(0.3, -0.5, 0.2, 0.06, 'gold'),
      ...[-0.8, -0.4, 0.2, 0.5].map((x) => circ(x, -0.15, 0.04, 'dark')), rr(-1.0, 0.1, 0.9, 0.26, 0.05, 'dark'),
    ],
  }],
  ['rift-spider', 'Rift Spider', 'Кіберпавук розлому: стріляє павутиною, що зупиняє суперника.', 'tracked', ['#5a3a8a', '#ff3a6a'], {
    s: 0.9, stride: 0.9,
    skin: () => [
      // the legs step as it rolls, every other one together (pieces with a gait swing on their own)
      ...[-1.4, -0.9, -0.4, 0.4, 0.9, 1.4].map((x, i) => path([[x * 0.4, -0.35], [x * 0.95, -1.0], [x * 1.25, 0.25]], 0.12, 'black', { gait: { at: [x * 0.4, -0.35], amp: 14, phase: (i % 2) * 0.5 } })).flat(),
      ell(-0.6, -0.4, 0.75, 0.42, 'body'), ell(0.55, -0.35, 0.5, 0.32, 'body'),
      poly([[-0.6, -0.65], [-0.45, -0.45], [-0.6, -0.25], [-0.75, -0.45]], 'accent'), poly([[-0.6, -0.4], [-0.4, -0.2], [-0.8, -0.2]], 'accent'),
      ...glowEyes(0.7, -0.4, 3, 'red'),
      ...fangs(0.9, 1.05, -0.15, 2, 0.12),
      ell(-0.8, -0.65, 0.2, 0.08, 'grey', { flat: true }), rr(-1.3, -0.1, 1.1, 0.06, 0.04, 'dark'), ...[-1.0, -0.4, 0.2, 0.8].map((x) => circ(x, -0.02, 0.03, 'red')),
    ],
  }],
  ['mini-dino', 'Mini Dino', 'Малий допоміжний юніт порталу — крихітний динозаврик.', 'creature', ['#6aa04a', '#ffd23f'], {
    s: 0.75, o: o({ neck: 'raptor' }), parts: ['tail'], noLights: true, hideParts: true,
    skin: (f) => [
      ...theropod(f, { bulk: 0.85, tail: 0.6, tailUp: 0.15, stripes: 'accent', belly: 'cream' }),
      // big cute head with a wide grin
      blob([[0.62, -0.75], [1.0, -0.98], [1.12, -0.6], [0.85, -0.42]], 'body', {}, 1),
      blob([[0.95, -1.05], [1.35, -1.12], [1.78, -0.88], [1.8, -0.6], [1.15, -0.55], [0.95, -0.72]], 'body', {}, 1),
      arc(1.5, -0.78, 0.22, Math.PI * 0.2, Math.PI * 0.75, 0.05, 'dark'),
      ...eyeball(1.3, -0.88, 0.11),
      ...arm(0.85, -0.42),
    ],
  }],
  ['mini-tentacle', 'Mini Tentacle', 'Малий щупальцевий юніт з одним оком.', 'blob', ['#7a3ae0', '#5ef0ff'], {
    s: 0.8, parts: ['tentacles'], noLights: true, hideParts: true,
    skin: () => [
      ...tentacles(-0.6, -0.55, 4, 1.4, 'body'),
      ell(0, -0.35, 0.95, 0.72, 'body', {}, 28),
      ...eyeball(0.3, -0.5, 0.28, 'accent'),
      ...[[-0.5, -0.8], [-0.6, -0.2], [0.0, 0.1]].map(([x, y]) => circ(x, y, 0.07, 'accent')),
      ell(-0.3, -0.85, 0.2, 0.08, 'white', { flat: true }), rr(-0.9, 0.14, 0.9, 0.3, 0.05, 'dark'),
    ],
  }],
  ['rift-cloud', 'Rift Cloud', 'Грозова хмара з розлому: пливе й іскрить.', 'blob', ['#c0b0e0', '#7a5ae0'], {
    s: 0.85, o: o({ shape: 'flat', mat: 'white' }), float: 0.75, noLights: true,
    // the storm is animated: forked lightning striking down ahead and under the cloud, and rain
    fx: () => [
      { kind: 'bolt', at: [1.1, -0.1], to: [1.05, 0.85], size: 0.22, mat: 'yellow' },
      { kind: 'bolt', at: [-0.55, 0.1], to: [-0.75, 0.75], size: 0.16, mat: 'yellow' },
      { kind: 'rain', at: [-1.0, 0.18], to: [0.85, 0.18], dir: 100, size: 0.16, mat: 'sky' },
    ],
    skin: () => [
      ell(-0.6, -0.4, 0.55, 0.38, 'body'), ell(0.15, -0.55, 0.6, 0.45, 'body'), ell(0.85, -0.3, 0.45, 0.32, 'body'), ell(0, -0.1, 1.25, 0.3, 'accent'),
      ...eyeball(0.55, -0.32, 0.08, 'purple'), ...eyeball(0.85, -0.3, 0.07, 'purple'),
      ell(-0.3, -0.75, 0.25, 0.08, 'white', { flat: true }),
      ...[[-0.8, -0.55], [0.0, -0.85]].map(([x, y]) => poly([[x, y], [x + 0.08, y - 0.12], [x + 0.04, y], [x + 0.12, y - 0.02], [x + 0.0, y + 0.15]], 'yellow', { flat: true })),
      // a proper thunderhead: dark storm belly
      ell(0.0, -0.05, 1.1, 0.16, 'purple'),
    ],
  }],
  ['bat-eyes', 'Bat Eyes', 'Кажан-спостерігач із палаючими очима.', 'blob', ['#2a1a3a', '#ff3a3a'], {
    s: 0.8, parts: ['wings'], noLights: true, hideParts: true,
    skin: () => [
      poly([[-0.6, -0.5], [-1.6, -1.2], [-1.4, -0.75], [-1.75, -0.6], [-1.35, -0.35], [-1.55, 0.0], [-0.6, -0.1]], 'body'),
      poly([[0.6, -0.5], [1.5, -1.25], [1.35, -0.8], [1.7, -0.65], [1.3, -0.4], [1.5, -0.05], [0.6, -0.1]], 'body'),
      ell(0, -0.35, 0.95, 0.72, 'body', {}, 28),
      poly([[-0.45, -0.95], [-0.15, -1.0], [-0.4, -1.4]], 'body'), poly([[0.15, -1.0], [0.45, -0.95], [0.35, -1.4]], 'body'),
      poly([[0.1, -0.68], [0.45, -0.58], [0.4, -0.45], [0.12, -0.52]], 'accent'), poly([[0.55, -0.6], [0.85, -0.68], [0.82, -0.52], [0.58, -0.47]], 'accent'),
      ...fangs(0.35, 0.65, -0.2, 2, 0.12),
      ell(0.0, -0.05, 0.45, 0.25, 'purple'), ...[-0.5, -0.2].map((x) => circ(x, -0.75, 0.04, 'grey')), rr(-0.9, 0.14, 0.9, 0.3, 0.05, 'dark'),
    ],
  }],
]);

