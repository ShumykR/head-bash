import { blob, bumper, circ, ell, eyeball, fangs, grille, path, poly, rect, rr, seat, seg, spikesAlong, starShape, stripe, windows, arc, place } from '../draw';
import { bike, carriage, fenders, frontLamp, hover, loco, pickup, rearLamp, skirt } from '../skins';
import { saddle, dims, quadruped, steed } from '../critters';
import type { CarPoly } from '../types';
import { group, o } from './util';

/** Pumpkin with ribs and a carved face, centred at (cx, cy). */
function jackOLantern(cx: number, cy: number, rx: number, ry: number, face = true): CarPoly[] {
  const out: CarPoly[] = [
    ell(cx - rx * 0.45, cy, rx * 0.6, ry, 'orange'), ell(cx + rx * 0.45, cy, rx * 0.6, ry, 'orange'), ell(cx, cy, rx * 0.6, ry * 1.02, 'orange'),
    rr(cx - 0.06, cy - ry - 0.2, cx + 0.06, cy - ry + 0.05, 0.03, 'leaf'),
  ];
  if (face) {
    out.push(poly([[cx + rx * 0.05, cy - ry * 0.15], [cx + rx * 0.35, cy - ry * 0.15], [cx + rx * 0.2, cy - ry * 0.5]], 'yellow'));
    out.push(poly([[cx + rx * 0.45, cy - ry * 0.15], [cx + rx * 0.75, cy - ry * 0.15], [cx + rx * 0.6, cy - ry * 0.5]], 'yellow'));
    out.push(poly([[cx - rx * 0.05, cy + ry * 0.15], [cx + rx * 0.85, cy + ry * 0.15], [cx + rx * 0.7, cy + ry * 0.5], [cx + rx * 0.1, cy + ry * 0.5]], 'yellow'));
  }
  return out;
}

export const HALLOWEEN = group('halloween', [
  ['hearse', 'Hearse', 'Чорний катафалк із труною в кузові та фіранками на вікнах.', 'pickup', ['#1a1a1a', '#b090e0'], {
    // Physically an open bed (the coffin lies in it); the skin closes it into a hearse body.
    o: o({ len: 1.15 }), cargo: ['coffin', 1],
    skin: (f) => {
      const x0 = f.tail.x, x1 = f.nose.x, top = f.roof.y, bot = skirt(f, f.nose.y1);
      return [
        blob([[x0, bot], [x0, top + 0.15], [x0 + 0.15, top], [f.roof.x1 + 0.05, top], [0.95, -0.3], [x1 - 0.1, -0.22], [x1, -0.05], [x1, bot]], 'body', {}, 1),
        poly([[f.roof.x1 + 0.05, top + 0.08], [0.88, -0.32], [f.roof.x1 + 0.05, -0.32]], 'glass'),
        ...windows(x0 + 0.2, x0 + 1.1, top + 0.12, top + 0.45, 2, 0.12),
        ...[x0 + 0.2, x0 + 0.67].flatMap((x) => [rect(x, top + 0.12, x + 0.12, top + 0.45, 'accent', { flat: true }), rect(x + 0.31, top + 0.12, x + 0.43, top + 0.45, 'accent', { flat: true })]),
        ...path([[x0 + 1.3, top + 0.15], [x0 + 1.55, top + 0.35], [x0 + 1.3, top + 0.55]], 0.05, 'chrome'),
        stripe(x0, x1, 0.02, 0.05, 'chrome'),
        rr(x0 + 0.1, top - 0.06, f.roof.x1 - 0.1, top + 0.02, 0.03, 'chrome'),
        ...frontLamp(x1, 0.04), rearLamp(x0, 0.04), stripe(x0 + 0.1, x1 - 0.2, -0.08, 0.04, 'accent'),
        ...grille(x1 - 0.1, 0.08, x1 + 0.02, 0.3, 2), poly([[x0 + 0.62, top + 0.62], [x0 + 0.74, top + 0.62], [x0 + 0.74, top + 0.95], [x0 + 0.62, top + 0.95]], 'gold'), rect(x0 + 0.54, top + 0.7, x0 + 0.82, top + 0.76, 'gold'),
        bumper(x1 - 0.2, x1 + 0.06, bot - 0.04, 0.12), bumper(x0 - 0.06, x0 + 0.2, bot - 0.04, 0.12),
      ];
    },
  }],
  ['rocking-horse', 'Horse', 'Кінь-гойдалка. Стає дибки й б\'є передніми копитами.', 'creature', ['#d09050', '#f4e8d0'], {
    o: o({ tall: 1.25, wheel: 0.75 }), parts: ['tail'], noLights: true, hideParts: true,
    skin: (f) => {
      const { rear, front } = dims(f);
      return [
        // the wooden rocker bow the legs stand on, running through both wheel hubs
        arc(0, -2.6, 3.1, Math.PI * 0.36, Math.PI * 0.64, 0.12, 'wood'),
        ...quadruped(f, { hump: -0.05, tail: 0.0, leg: 0.24, belly: null, saddle: 'red', chest: 0.95 }),
        // painted dapples, yarn tail
        ...[[-0.7, -0.5], [-0.35, -0.3], [0.3, -0.45], [0.6, -0.25], [-0.85, -0.2]].map(([x, y]) => ell(x, y, 0.08, 0.06, 'cream')),
        ...path([[-1.05, -0.6], [-1.35, -0.45], [-1.45, -0.1]], 0.16, 'brown'),
        ...[rear, front].map((x) => rr(x - 0.14, 0.22, x + 0.14, 0.3, 0.03, 'dark')),
        // neck and long head with a yarn mane, ears, red bridle and a wooden handle peg
        ...path([[0.65, -0.6], [0.95, -1.05]], 0.34, 'body'),
        blob([[0.85, -1.35], [1.15, -1.42], [1.75, -1.1], [1.85, -0.92], [1.6, -0.82], [0.95, -1.0]], 'body', {}, 1),
        ...[0.6, 0.75, 0.9, 1.0].map((x, i) => poly([[x - 0.14, -0.55 - i * 0.2], [x + 0.06, -0.7 - i * 0.2], [x - 0.22, -0.82 - i * 0.2]], 'brown')),
        poly([[1.02, -1.38], [1.08, -1.6], [1.18, -1.4]], 'body'),
        ...path([[1.0, -1.15], [1.0, -1.32]], 0.12, 'wood'), rr(0.88, -1.32, 1.12, -1.24, 0.03, 'wood'),
        ...path([[1.42, -1.12], [1.5, -0.9]], 0.05, 'red'), circ(1.5, -0.92, 0.04, 'gold'),
        ...eyeball(1.3, -1.18, 0.06), circ(1.78, -0.98, 0.03, 'black'),
        // the rider's jousting lance (as in Drive Ahead): striped shaft, a cone guard at the grip
        ...path([[f.head.x - 0.15, f.head.y + 0.42], [1.75, -2.25]], 0.09, 'white'),
        ...[0.25, 0.45, 0.65, 0.85].map((k) => circ(f.head.x - 0.15 + (1.9 - f.head.x) * k, f.head.y + 0.42 + (-2.25 - f.head.y - 0.42) * k, 0.06, 'red')),
        poly([[f.head.x + 0.2, f.head.y + 0.12], [f.head.x + 0.45, f.head.y + 0.35], [f.head.x + 0.22, f.head.y + 0.55]], 'grey'),
      ];
    },
  }],
  ['chariot', 'Chariot', 'Антична бойова колісниця з шипами на осях. Атакує ривком.', 'cart', ['#c8a040', '#e02a2a'], {
    o: o({ len: 1.2, wheel: 1.6, rim: 'spokes' }), parts: ['spikes'], hideParts: true,
    // As in Drive Ahead, a horse pulls the chariot. It is a real piece: hitched to the shaft on a
    // sprung hinge, it has a body to hit and runs on a hidden wheel under its hooves.
    links: (f) => {
      const g = f.wheels[0].y + f.wheels[0].r, x = f.nose.x + 1.15, s = 1.3;
      return [{
        at: [f.nose.x + 0.5, f.deck.y - 0.25], swing: [-14, 14], spring: 10, density: 0.35,
        wheels: [{ x, y: g - 0.26, r: 0.26, drive: false, hidden: true }],
        hit: [rect(x - 0.5 * s, g - 0.86 * s, x + 0.5 * s, g - 0.46 * s), rect(x + 0.35 * s, g - 1.2 * s, x + 0.8 * s, g - 0.86 * s)],
        art: [
          ...path([[f.nose.x + 0.5, f.deck.y - 0.25], [x + 0.1, g - 0.7 * s]], 0.06, 'wood'),
          ...steed(x, g, { mat: 'tan', mane: 'brown', s }),
          rr(x - 0.2, g - 0.92 * s, x + 0.3, g - 0.78 * s, 0.03, 'accent'),
        ],
      }];
    },
    // A real chariot body: a low wooden floor, a tall curved breastwork in front (good cover from the
    // front, as the fandom says) sweeping down to an open back where the player stands, gold trim,
    // scythe blades on the axle hubs and a bronze spear-ram under the shaft.
    head: (f) => [f.tail.x + 0.42, f.deck.y - 0.28],
    skin: (f) => {
      const t = f.deck.y, n = f.nose.x, b = f.tail.x;
      return [
        // the shell: one curved panel, high at the front, low at the back
        blob([[b + 0.05, t + 0.42], [b + 0.1, t + 0.18], [b + 0.6, t + 0.12], [n - 0.55, t - 0.12], [n - 0.15, t - 0.55], [n + 0.08, t - 0.62], [n + 0.12, t - 0.3], [n + 0.02, 0.1], [n - 0.2, 0.18], [b + 0.15, 0.18]], 'gold', {}, 2),
        blob([[b + 0.25, t + 0.4], [b + 0.6, t + 0.28], [n - 0.55, t + 0.04], [n - 0.2, t - 0.36], [n - 0.05, t - 0.34], [n - 0.08, 0.04], [b + 0.25, 0.06]], 'accent', {}, 2),
        // gold rail along the rim, a winged sun on the side panel, a rosette at the prow
        ...path([[b + 0.08, t + 0.16], [b + 0.6, t + 0.08], [n - 0.55, t - 0.16], [n - 0.15, t - 0.6], [n + 0.1, t - 0.66]], 0.06, 'yellow'),
        circ(-0.05, t + 0.32, 0.11, 'gold'), poly([[-0.15, t + 0.3], [-0.5, t + 0.2], [-0.42, t + 0.34], [-0.15, t + 0.36]], 'gold'), poly([[0.05, t + 0.3], [0.4, t + 0.2], [0.32, t + 0.34], [0.05, t + 0.36]], 'gold'),
        circ(n + 0.04, t - 0.58, 0.07, 'yellow'),
        // the wooden floor and the step at the open back
        rr(b - 0.02, 0.08, n + 0.02, 0.2, 0.03, 'wood'), rr(b - 0.15, 0.12, b + 0.1, 0.2, 0.03, 'wood'),
        // the shaft out to the horse and a bronze spear-ram under it
        ...path([[n - 0.1, t + 0.05], [n + 0.5, t - 0.25]], 0.06, 'wood'),
        poly([[n, 0.0], [n + 0.75, 0.04], [n, 0.12]], 'spike'), poly([[n, 0.04], [n + 0.45, 0.06], [n, 0.09]], 'chrome'),
        // scythe blades on the axle hubs
        ...f.wheels.flatMap((w) => [circ(w.x, w.y, 0.09, 'gold'), poly([[w.x + 0.05, w.y - 0.04], [w.x + w.r + 0.35, w.y - 0.12], [w.x + w.r + 0.15, w.y + 0.02], [w.x + 0.05, w.y + 0.04]], 'spike')]),
        // a pennant on a pole at the back
        ...path([[b + 0.08, t + 0.1], [b + 0.02, t - 0.6]], 0.05, 'wood'), poly([[b + 0.03, t - 0.6], [b + 0.42, t - 0.52], [b + 0.04, t - 0.42]], 'accent'),
      ];
    },
  }],
  ['spiky-car', 'Spiky Car', 'Шипований броньовик пустельних рейдерів: шипи спереду й на даху.', 'pickup', ['#6a5a4a', '#c0c0c0'], {
    parts: ['spikes', 'roofspikes'],
    // As in Drive Ahead: the player is strapped high up on a long wooden beam in the bed, which rocks back
    // and forth as the car drives, while a raider in an ox-skull helmet drives from the spiked cab.
    headOn: 0, head: (f) => [f.deck.x0 + 0.55, f.deck.y - 1.55],
    links: (f) => {
      const x = f.deck.x0 + 0.55, y = f.deck.y;
      return [{
        at: [x, y - 0.05], swing: [-22, 22], spring: 9, density: 0.4,
        hit: [rect(x - 0.08, y - 1.3, x + 0.08, y - 0.05), rect(x - 0.32, y - 1.12, x + 0.32, y - 1.0)],
        art: [
          rr(x - 0.09, y - 1.32, x + 0.09, y, 0.03, 'wood'), rr(x - 0.34, y - 1.14, x + 0.34, y - 1.0, 0.03, 'wood'),
          ...[0.35, 0.65, 0.95].map((d) => rect(x - 0.12, y - d - 0.04, x + 0.12, y - d + 0.03, 'tan')),
          ...[-0.3, 0.3].map((dx) => seg([x + dx, y - 1.07], [x + dx * 0.4, y - 1.25], 0.04, 'tan')),
        ],
      }];
    },
    skin: (f) => [
      ...pickup(f),
      ...[[-1.2, 0.0], [-0.2, 0.1], [0.9, -0.05]].map(([x, y]) => ell(x, y, 0.16, 0.1, 'orange')),
      ...[-1.3, -0.8, -0.3, 0.2, 0.7, 1.2].map((x) => circ(x, 0.22, 0.03, 'grey')), rect(f.tail.x + 0.05, -0.12, f.nose.x - 0.1, -0.08, 'black', { flat: true }),
      ...[-1.4, -0.95, -0.5].flatMap((x) => [rect(x, f.deck.y - 0.25, x + 0.06, f.deck.y, 'grey')]),
      rect(f.roof.x0 + 0.1, f.roof.y + 0.08, f.roof.x1 - 0.05, f.roof.y + 0.2, 'grey'), ...[0, 1, 2, 3].map((i) => rect(f.roof.x0 + 0.15 + i * 0.16, f.roof.y + 0.2, f.roof.x0 + 0.2 + i * 0.16, f.nose.y0 - 0.06, 'grey', { flat: true })),
      // the raider at the wheel (in the cab window): an ox skull for a helmet with long curved horns
      blob([[0.0, -0.66], [0.26, -0.68], [0.34, -0.48], [0.24, -0.32], [0.04, -0.34]], 'white', {}, 1),
      ...([[0.02, -0.62, -1], [0.3, -0.64, 1]] as [number, number, number][]).flatMap(([x, y, d]) => path([[x, y], [x + d * 0.2, y - 0.06], [x + d * 0.24, y - 0.26]], 0.05, 'cream')),
      circ(0.1, -0.52, 0.04, 'black'), circ(0.24, -0.52, 0.04, 'black'), rect(0.15, -0.42, 0.21, -0.37, 'black', { flat: true }),
    ],
  }],
  ['pumpkin-carriage', 'Pumpkin Carriage', 'Казкова карета-гарбуз. Метає гарбузи, що вибухають.', 'carriage', ['#ff8a1a', '#3aa04a'], {
    axles: [1.12, 0.85],
    noLights: true,
    skin: (f) => [
      rr(f.tail.x + 0.05, 0.06, f.nose.x - 0.05, 0.18, 0.04, 'gold'),
      ...jackOLantern(0, (f.roof.y + 0.2) / 2, 1.0, (0.2 - f.roof.y) / 2, false),
      ...path([[0.05, f.roof.y], [0.25, f.roof.y - 0.3], [0.45, f.roof.y - 0.35]], 0.07, 'leaf'), ell(0.35, f.roof.y - 0.12, 0.18, 0.08, 'leaf'),
      ...path([[-0.6, f.roof.y + 0.1], [-0.9, f.roof.y - 0.2], [-1.0, f.roof.y - 0.05]], 0.04, 'leaf'),
      ...[-1.0, 1.0].map((x) => path([[x, 0.12], [x * 1.1, 0.4]], 0.05, 'gold')).flat(),
      rr(-0.3, f.roof.y + 0.3, 0.3, f.roof.y + 0.75, 0.15, 'gold'), rr(-0.24, f.roof.y + 0.36, 0.24, f.roof.y + 0.69, 0.12, 'glass'),
      ...[-0.9, 0.9].map((x) => path([[x, 0.15], [x + 0.15 * Math.sign(x), 0.0], [x + 0.05 * Math.sign(x), -0.1]], 0.05, 'gold')).flat(),
    ],
  }],
  ['ghost-train', 'Ghost Train', 'Примарний паротяг: проходить крізь суперника, як туман.', 'loco', ['#d0d8e4', '#8a7ab0'], {
    float: 0.85, noLights: true,
    // ghostly steam pours out of the chimney (animated, not part of the sprite)
    fx: (f) => [{ kind: 'steam', at: [f.nose.x - 0.72, -1.3], dir: -115, size: 0.3 }, { kind: 'wisp', at: [f.tail.x, -0.9], dir: 180, size: 0.3, mat: 'accent', rate: 0.5 }],
    skin: (f) => [
      ...loco(f, { boiler: 'body', trim: 'accent' }),
      ell(f.nose.x - 0.3, -0.32, 0.26, 0.26, 'white'), circ(f.nose.x - 0.38, -0.38, 0.05, 'black'), circ(f.nose.x - 0.22, -0.38, 0.05, 'black'), ell(f.nose.x - 0.3, -0.22, 0.06, 0.08, 'black'),
    ],
  }],
  ['broom-bike', 'Broom Bike', 'Відьмина мітла з моторчиком. Злітає й ширяє над ареною.', 'bike', ['#a0703a', '#e0c060'], {
    axles: [0.78, 0.78],
    o: o({ mat: 'wood' }), float: 0.7, noLights: true,
    skin: (f) => [
      ...path([[-0.65, -0.1], [f.nose.x + 0.2, -0.25]], 0.14, 'wood'),
      ...[-0.2, -0.1, 0.0, 0.1, 0.2].map((d) => poly([[-0.6, -0.14 + d * 0.5], [-0.6, -0.02 + d * 0.5], [-1.5, d * 2.6]], d === 0 ? 'yellow' : 'tan')),
      rr(-0.74, -0.26, -0.56, 0.08, 0.03, 'red'),
      ell(0.12, 0.02, 0.32, 0.2, 'black'), rr(-0.22, -0.2, 0.46, -0.12, 0.03, 'grey'), ...path([[-0.1, 0.15], [-0.5, 0.24]], 0.07, 'chrome'),
      circ(0.12, 0.04, 0.08, 'green'),
      seg([-0.4, -0.1], [-0.6, 0.3], 0.05, 'wood'), seg([0.6, -0.2], [0.85, 0.3], 0.05, 'wood'),
      poly([[-0.42, -0.95], [0.12, -0.95], [-0.05, -1.5], [-0.25, -1.3]], 'black'), rr(-0.55, -1.0, 0.25, -0.92, 0.03, 'black'), rect(-0.4, -1.06, 0.1, -1.0, 'purple', { flat: true }),
      // the broom itself (a bike shaped like a witch's broom, as in Drive Ahead): a thick handle and a big fan of straw
      ...path([[-0.95, -0.12], [f.nose.x + 0.5, -0.42]], 0.16, 'wood'), circ(f.nose.x + 0.5, -0.42, 0.09, 'wood'),
      ...[-0.36, -0.24, -0.12, 0, 0.12, 0.24, 0.36].map((d, i) => poly([[-0.85, -0.2 + d * 0.3], [-0.85, -0.04 + d * 0.3], [-1.95, d * 1.6]], i % 2 ? 'tan' : 'yellow')),
      rr(-1.02, -0.32, -0.8, 0.08, 0.04, 'red'),
      ...[[-2.05, -0.55], [-1.75, 0.45], [-2.2, 0.1]].map(([x, y]) => starShape(x, y, 0.07, 'purple')),
    ],
  }],
  ['invisible-car', 'Invisible Car', 'Прозорий парящий кузов. На мить зникає зовсім.', 'hover', ['#c0e8ff', '#ffffff'], {
    o: o({ mat: 'glass' }),
    skin: (f) => [...hover(f, { mat: 'glass', glow: 'sky', canopy: 'white' }), stripe(f.tail.x + 0.1, f.nose.x - 0.2, -0.05, 0.05, 'white'), ...[[-1.0, -0.5], [0.3, -0.6], [0.9, -0.2]].map(([x, y]) => starShape(x, y, 0.08, 'white'))],
  }],
  ['skeletal-ride', 'Skeletal Ride', 'Скелет звіра на колесах: рогатий череп, хребет із шипами, хвіст із кісток.', 'buggy', ['#c8d8f0', '#3a4a8a'], {
    // After Drive Ahead's Skeletal Ride: a pale-blue beast skeleton (horned skull, spiked tail) on spoked wheels.
    o: o({ mat: 'bone', rim: 'spokes', wheel: 0.78 }), parts: ['skull'], hideParts: true,
    skin: (f) => {
      const rw = f.wheels[0], fw = f.wheels[f.wheels.length - 1];
      const sp = (t: number): [number, number] => [rw.x - 0.15 + t * (fw.x - rw.x + 0.25), -0.3 - Math.sin(t * Math.PI) * 0.1];
      return [
        // tail: vertebrae with spikes trailing low behind
        ...Array.from({ length: 9 }, (_, i) => {
          const t = i / 8, x = rw.x - 0.15 - t * 1.25, y = -0.3 + t * 0.12 - t * t * 0.1;
          return [circ(x, y, 0.12 - t * 0.06, 'body'), poly([[x - 0.04, y - 0.04], [x + 0.04, y - 0.04], [x - 0.05, y - 0.2 + t * 0.08]], 'accent', { flat: true })];
        }).flat(),
        // dark ribcage cavity so the ribs read as stripes, then backbone, spines and ribs
        blob([[sp(0.12)[0], -0.3], [sp(0.5)[0], -0.42], [sp(0.88)[0], -0.32], [sp(0.82)[0], 0.12], [sp(0.15)[0], 0.13]], 'accent', { flat: true }, 1),
        ...path(Array.from({ length: 7 }, (_, i) => sp(i / 6)), 0.16, 'body'),
        ...Array.from({ length: 8 }, (_, i) => { const [x, y] = sp((i + 0.5) / 8); return poly([[x - 0.05, y - 0.04], [x + 0.05, y - 0.04], [x - 0.04, y - 0.26]], 'body', { flat: true }); }),
        ...Array.from({ length: 7 }, (_, i) => { const [x, y] = sp(0.14 + i * 0.115); return path([[x, y], [x + 0.08, y + 0.2], [x + 0.03, 0.12]], 0.11, 'body'); }).flat(),
        ...path([[sp(0.15)[0], 0.13], [sp(0.8)[0], 0.12]], 0.07, 'body'),
        // hip and shoulder blades, leg bones onto the axles
        blob([[rw.x - 0.25, -0.42], [rw.x + 0.15, -0.46], [rw.x + 0.18, -0.14], [rw.x - 0.15, -0.1]], 'body', {}, 1),
        blob([[fw.x - 0.5, -0.46], [fw.x - 0.2, -0.4], [fw.x - 0.25, -0.08], [fw.x - 0.48, -0.12]], 'body', {}, 1),
        ...[rw.x, fw.x].flatMap((x) => [...path([[x - 0.1, -0.2], [x + 0.08, 0.0], [x, rw.y]], 0.09, 'bone'), circ(x + 0.08, 0.0, 0.065, 'body')]),
        ...seat(f.head.x + 0.05, -0.32, 0.36, 'black'),
        // neck to a horned skull with glowing green eyes and a toothy jaw
        ...[[fw.x - 0.15, -0.42], [fw.x + 0.0, -0.52], [fw.x + 0.14, -0.6]].map(([x, y]) => circ(x, y, 0.08, 'body')),
        ...path([[fw.x + 0.25, -0.8], [fw.x + 0.05, -1.0], [fw.x - 0.2, -1.05]], 0.08, 'bone'),
        ...path([[fw.x + 0.35, -0.82], [fw.x + 0.3, -1.08], [fw.x + 0.15, -1.2]], 0.07, 'bone'),
        blob([[fw.x + 0.12, -0.72], [fw.x + 0.38, -0.88], [fw.x + 0.75, -0.76], [fw.x + 0.95, -0.56], [fw.x + 0.9, -0.48], [fw.x + 0.25, -0.46]], 'body', {}, 1),
        circ(fw.x + 0.38, -0.68, 0.08, 'black'), circ(fw.x + 0.4, -0.68, 0.035, 'green'), circ(fw.x + 0.88, -0.56, 0.025, 'black'),
        blob([[fw.x + 0.28, -0.42], [fw.x + 0.86, -0.42], [fw.x + 0.7, -0.3], [fw.x + 0.3, -0.32]], 'body', {}, 1),
        ...[0, 1, 2, 3].map((i) => poly([[fw.x + 0.45 + i * 0.1, -0.48], [fw.x + 0.51 + i * 0.1, -0.48], [fw.x + 0.48 + i * 0.1, -0.41]], 'white', { flat: true })),
      ];
    },
  }],
  ['beast', 'Beast', 'Великий сірий вовк на чорних колесах зі спицями. Щелепи клацають, а від виття в суперника плутаються ліво й право.', 'monster', ['#7c8290', '#ffc23a', '#2a2c36'], {
    o: o({ open: true, rim: 'spokes' }),
    parts: ['fangs'], hideParts: true,
    // A big grey wolf loping along (the fandom's Beast: a large monster on black spoked wheels with a
    // jaw that snaps): lean body, deep chest, smooth fur, long muzzle, upright ears, bushy tail.
    skin: (f) => {
      const x0 = f.tail.x, [rw, fw] = [f.wheels[0], f.wheels[1]];
      return [
        // bushy tail held out behind, pale tip
        blob([[x0 + 0.35, -0.82], [x0 - 0.1, -0.98], [x0 - 0.55, -0.95], [x0 - 0.75, -0.78], [x0 - 0.45, -0.66], [x0 + 0.05, -0.62], [x0 + 0.35, -0.6]], 'body', {}, 2),
        blob([[x0 - 0.5, -0.94], [x0 - 0.75, -0.78], [x0 - 0.5, -0.68], [x0 - 0.38, -0.8]], 'white', {}, 1),
        // far legs in shadow, then the near hind leg and foreleg down to the wheels, pale paws on the tyres
        blob([[rw.x - 0.05, -0.6], [rw.x + 0.35, -0.6], [rw.x + 0.3, rw.y - rw.r - 0.05], [rw.x + 0.05, rw.y - rw.r - 0.05]], 'dark', {}, 1),
        blob([[fw.x - 0.35, -0.6], [fw.x - 0.05, -0.6], [fw.x - 0.12, fw.y - fw.r - 0.05], [fw.x - 0.35, fw.y - fw.r - 0.05]], 'dark', {}, 1),
        blob([[rw.x - 0.55, -0.85], [rw.x + 0.3, -0.85], [rw.x + 0.2, -0.35], [rw.x + 0.05, rw.y - rw.r + 0.02], [rw.x - 0.25, rw.y - rw.r + 0.02], [rw.x - 0.45, -0.4]], 'body', { ring: true }, 2),
        blob([[fw.x - 0.25, -0.75], [fw.x + 0.2, -0.75], [fw.x + 0.18, fw.y - fw.r + 0.02], [fw.x - 0.15, fw.y - fw.r + 0.02]], 'body', { ring: true }, 1),
        ...[rw, fw].map((w) => ell(w.x - 0.05, w.y - w.r - 0.02, 0.2, 0.08, 'cream')),
        // lean body: hips, a dip in the back, high shoulders, deep chest, tucked belly
        blob([[x0 + 0.2, -0.4], [x0 + 0.1, -0.95], [x0 + 0.5, -1.12], [-0.6, -1.05], [0.1, -1.1], [0.7, -1.28], [1.1, -1.05], [1.12, -0.5], [0.75, -0.25], [0.2, -0.38], [-0.5, -0.36]], 'body', {}, 2),
        // darker saddle of fur along the back, pale chest and belly
        blob([[x0 + 0.3, -1.05], [-0.6, -1.0], [0.1, -1.06], [0.7, -1.24], [0.62, -1.08], [0.0, -0.94], [-0.7, -0.92]], 'dark', {}, 2),
        blob([[1.1, -0.95], [1.12, -0.5], [0.75, -0.28], [0.3, -0.38], [0.55, -0.55], [0.85, -0.7]], 'cream', {}, 2),
        // head: skull and cheek ruff, long muzzle with a black nose, upright ears, an amber eye,
        // the jaw just open with a pair of fangs
        ...place([
          blob([[0.75, -0.9], [0.95, -1.18], [1.3, -1.25], [1.55, -1.08], [1.95, -0.98], [2.03, -0.86], [1.85, -0.78], [1.4, -0.72], [1.0, -0.62]], 'body', {}, 2),
          blob([[0.95, -0.95], [1.25, -0.82], [1.4, -0.72], [1.05, -0.62], [0.85, -0.75]], 'cream', {}, 1),
          poly([[0.98, -1.12], [1.02, -1.48], [1.2, -1.18]], 'body'), poly([[1.16, -1.18], [1.26, -1.52], [1.38, -1.15]], 'body'),
          poly([[1.04, -1.16], [1.06, -1.36], [1.14, -1.18]], 'pink'),
          ell(1.99, -0.94, 0.07, 0.06, 'black'),
          ell(1.36, -1.04, 0.065, 0.055, 'accent'), circ(1.38, -1.04, 0.028, 'black'),
          poly([[1.45, -0.8], [1.91, -0.8], [1.85, -0.7], [1.48, -0.7]], 'black', { flat: true }),
          ...fangs(1.55, 1.85, -0.8, 2, 0.07),
        ], -0.385, 0.12, 1.3),
        // a leather saddle for the rider behind the shoulders
        ...saddle(f.head.x, f.head.y + 0.28, 'brown'),
      ];
    },
  }],
  ['ghost-bike', 'Ghost Bike', 'Мотоцикл-привид у примарному сяйві.', 'bike', ['#d0e0f0', '#7a6ab0'], {
    axles: [0.8, 0.8],
    float: 0.8, noLights: true,
    // the ghostly glow (animated): pale wisps streaming off the tail, sparks twinkling round the bike
    fx: () => [{ kind: 'wisp', at: [-1.5, -0.2], dir: 175, size: 0.3 }, { kind: 'spark', at: [0.1, -0.6], dir: -90, size: 0.18, mat: 'sky', rate: 0.6 }],
    skin: (f) => [
      blob([[-0.6, -0.15], [-1.0, -0.5], [-1.5, -0.4], [-1.25, -0.1], [-1.6, 0.1], [-1.2, 0.2], [-0.6, 0.2]], 'white', {}, 1),
      ...bike(f, { mat: 'accent' }),
      ell(0.42, -0.25, 0.06, 0.08, 'black'), ell(0.57, -0.25, 0.06, 0.08, 'black'), ell(0.5, -0.1, 0.05, 0.04, 'black'),
      ...[[-1.55, -0.58], [-1.45, -0.58]].map(([x, y]) => circ(x, y, 0.035, 'black')),
    ],
  }],
  ['pumpkin-car', 'Pumpkin Car', 'Гарбуз-ліхтар на колесах із вирізаною усмішкою.', 'blob', ['#ff7a1a', '#2a8a3a'], {
    noLights: true,
    skin: () => [
      ...jackOLantern(0, -0.38, 0.98, 0.72),
      ...path([[-0.05, -1.08], [0.05, -1.4], [0.25, -1.45]], 0.1, 'leaf'), ell(0.25, -1.12, 0.2, 0.08, 'leaf'),
      ...path([[-0.3, -1.05], [-0.6, -1.2], [-0.8, -1.05], [-0.75, -0.9]], 0.04, 'leaf'),
      rr(-0.85, 0.12, 0.85, 0.28, 0.06, 'dark'), bumper(0.6, 1.0, 0.24, 0.1), bumper(-1.0, -0.6, 0.24, 0.1),
    ],
  }],
  ['dracula-carriage', 'Dracula\'s Carriage', 'Готична карета вампіра. Розкриває кажанячі крила й летить.', 'carriage', ['#2a1a2a', '#c02a3a'], {
    axles: [1.15, 0.8],
    parts: ['lantern'], hideParts: true,
    skin: (f) => [
      poly([[-0.6, f.roof.y + 0.3], [-1.6, f.roof.y - 0.4], [-1.45, f.roof.y - 0.05], [-1.75, f.roof.y + 0.05], [-1.5, f.roof.y + 0.25], [-1.7, f.roof.y + 0.4], [-0.6, f.roof.y + 0.55]], 'black'),
      ...carriage(f, { trim: 'accent' }),
      rr(-0.45, f.roof.y + 0.2, 0.45, f.roof.y + 0.6, 0.15, 'accent'), rr(-0.38, f.roof.y + 0.26, 0.38, f.roof.y + 0.55, 0.12, 'glass'),
      ...spikesAlong(-0.9, 0.9, f.roof.y - 0.06, 6, 0.2, 'gold'),
      ...fenders(f, 'black', 0.08),
      ...path([[f.nose.x - 0.3, -0.2], [f.nose.x - 0.3, -0.75]], 0.05, 'black'), ell(f.nose.x - 0.3, -0.85, 0.12, 0.15, 'red'), rect(f.nose.x - 0.42, -1.04, f.nose.x - 0.18, -0.98, 'gold'),
      ...eyeball(-0.25, f.roof.y + 0.35, 0.05, 'red'), ...eyeball(0.0, f.roof.y + 0.35, 0.05, 'red'),
      poly([[-0.3, f.roof.y + 0.85], [0.0, f.roof.y + 0.75], [0.3, f.roof.y + 0.85], [0.15, f.roof.y + 0.9], [0.0, f.roof.y + 0.83], [-0.15, f.roof.y + 0.9]], 'accent'),
      // gothic touches: a pointed arch over the window with red curtains, a bat on the door, the second wing unfolding at the front
      poly([[-0.45, f.roof.y + 0.24], [0.0, f.roof.y - 0.05], [0.45, f.roof.y + 0.24]], 'accent'),
      ...[-0.36, 0.22].map((x) => rr(x, f.roof.y + 0.26, x + 0.14, f.roof.y + 0.56, 0.04, 'red')),
      poly([[-0.3, f.roof.y + 0.72], [-0.12, f.roof.y + 0.66], [0.0, f.roof.y + 0.72], [0.12, f.roof.y + 0.66], [0.3, f.roof.y + 0.72], [0.12, f.roof.y + 0.8], [0.0, f.roof.y + 0.86], [-0.12, f.roof.y + 0.8]], 'black'),
      poly([[0.6, f.roof.y + 0.3], [1.5, f.roof.y - 0.45], [1.35, f.roof.y - 0.08], [1.65, f.roof.y + 0.02], [1.4, f.roof.y + 0.22], [1.6, f.roof.y + 0.36], [0.6, f.roof.y + 0.5]], 'black'),
      ...[[-1.25, f.roof.y - 0.1], [1.25, f.roof.y - 0.12]].map(([x, y]) => seg([x > 0 ? 0.7 : -0.7, f.roof.y + 0.38], [x, y], 0.03, 'accent')),
    ],
  }],
]);
