import { blob, bumper, circ, ell, eyeball, fangs, grille, path, poly, rect, rr, seat, seg, spikesAlong, starShape, stripe, windows, arc } from '../draw';
import { bike, carriage, fenders, frontLamp, hover, loco, pickup, rearLamp, skirt } from '../skins';
import { browEye, saddle, dims, quadruped } from '../critters';
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
      ];
    },
  }],
  ['chariot', 'Chariot', 'Антична бойова колісниця з шипами на осях. Атакує ривком.', 'cart', ['#c8a040', '#e02a2a'], {
    o: o({ len: 1.2, wheel: 1.6, rim: 'spokes' }), parts: ['spikes'],
    skin: (f) => [
      blob([[f.tail.x + 0.1, f.deck.y + 0.15], [f.tail.x, f.deck.y - 0.35], [f.tail.x + 0.3, f.deck.y - 0.1], [f.nose.x - 0.2, f.deck.y - 0.15], [f.nose.x, f.deck.y - 0.6], [f.nose.x + 0.05, f.deck.y + 0.1], [f.nose.x - 0.2, 0.18], [f.tail.x + 0.2, 0.18]], 'gold', {}, 1),
      stripe(f.tail.x + 0.15, f.nose.x - 0.1, f.deck.y - 0.02, 0.06, 'accent'), stripe(f.tail.x + 0.15, f.nose.x - 0.1, 0.12, 0.06, 'accent'),
      circ(0.05, -0.2, 0.3, 'dark'), circ(0.05, -0.2, 0.26, 'accent'), starShape(0.05, -0.2, 0.16, 'gold'),
      ...path([[f.nose.x - 0.1, f.deck.y], [f.nose.x + 0.55, f.deck.y - 0.25]], 0.06, 'wood'),
      ...path([[f.tail.x + 0.2, f.deck.y - 0.1], [f.tail.x + 0.15, f.deck.y - 0.7]], 0.05, 'wood'), poly([[f.tail.x + 0.18, f.deck.y - 0.7], [f.tail.x + 0.6, f.deck.y - 0.6], [f.tail.x + 0.18, f.deck.y - 0.45]], 'accent'),
    ],
  }],
  ['spiky-car', 'Spiky Car', 'Шипований броньовик пустельних рейдерів: шипи спереду й на даху.', 'pickup', ['#6a5a4a', '#c0c0c0'], {
    parts: ['spikes', 'roofspikes'],
    skin: (f) => [
      ...pickup(f),
      ...[[-1.2, 0.0], [-0.2, 0.1], [0.9, -0.05]].map(([x, y]) => ell(x, y, 0.16, 0.1, 'orange')),
      ...[-1.3, -0.8, -0.3, 0.2, 0.7, 1.2].map((x) => circ(x, 0.22, 0.03, 'grey')), rect(f.tail.x + 0.05, -0.12, f.nose.x - 0.1, -0.08, 'black', { flat: true }),
      ...[-1.4, -0.95, -0.5].flatMap((x) => [rect(x, f.deck.y - 0.25, x + 0.06, f.deck.y, 'grey')]),
      rect(f.roof.x0 + 0.1, f.roof.y + 0.08, f.roof.x1 - 0.05, f.roof.y + 0.2, 'grey'), ...[0, 1, 2, 3].map((i) => rect(f.roof.x0 + 0.15 + i * 0.16, f.roof.y + 0.2, f.roof.x0 + 0.2 + i * 0.16, f.nose.y0 - 0.06, 'grey', { flat: true })),
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
    skin: (f) => [
      ...loco(f, { boiler: 'body', trim: 'accent' }),
      ell(f.nose.x - 0.3, -0.32, 0.26, 0.26, 'white'), circ(f.nose.x - 0.38, -0.38, 0.05, 'black'), circ(f.nose.x - 0.22, -0.38, 0.05, 'black'), ell(f.nose.x - 0.3, -0.22, 0.06, 0.08, 'black'),
      ...[-1.3, -0.6, 0.1].map((x, i) => ell(x, f.roof.y - 0.3 - i * 0.12, 0.25, 0.14, 'white')),
    ],
  }],
  ['broom-bike', 'Broom Bike', 'Відьмина мітла з моторчиком. Злітає й ширяє над ареною.', 'bike', ['#a0703a', '#e0c060'], {
    o: o({ mat: 'wood' }), float: 0.7, noLights: true,
    skin: (f) => [
      ...path([[-0.65, -0.1], [f.nose.x + 0.2, -0.25]], 0.14, 'wood'),
      ...[-0.2, -0.1, 0.0, 0.1, 0.2].map((d) => poly([[-0.6, -0.14 + d * 0.5], [-0.6, -0.02 + d * 0.5], [-1.5, d * 2.6]], d === 0 ? 'yellow' : 'tan')),
      rr(-0.74, -0.26, -0.56, 0.08, 0.03, 'red'),
      ell(0.12, 0.02, 0.32, 0.2, 'black'), rr(-0.22, -0.2, 0.46, -0.12, 0.03, 'grey'), ...path([[-0.1, 0.15], [-0.5, 0.24]], 0.07, 'chrome'),
      circ(0.12, 0.04, 0.08, 'green'),
      seg([-0.4, -0.1], [-0.6, 0.3], 0.05, 'wood'), seg([0.6, -0.2], [0.85, 0.3], 0.05, 'wood'),
      poly([[-0.42, -0.95], [0.12, -0.95], [-0.05, -1.5], [-0.25, -1.3]], 'black'), rr(-0.55, -1.0, 0.25, -0.92, 0.03, 'black'), rect(-0.4, -1.06, 0.1, -1.0, 'purple', { flat: true }),
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
  ['beast', 'Beast', 'Вовкулака-монстр на велетенських колесах. Від його виття в суперника плутаються ліво й право.', 'monster', ['#8a6a4a', '#ffd23f'], {
    o: o({ open: true }),
    parts: ['fangs'], hideParts: true,
    // A hunched werewolf on all fours: the rider clings to its back behind the shoulders.
    skin: (f) => {
      const x0 = f.tail.x, x1 = f.nose.x, [rw, fw] = [f.wheels[0], f.wheels[1]];
      return [
        // bushy tail
        blob([[x0 + 0.3, -0.7], [x0 - 0.3, -1.0], [x0 - 0.55, -1.35], [x0 - 0.2, -1.2], [x0 + 0.35, -0.95]], 'body', {}, 1),
        poly([[x0 - 0.55, -1.35], [x0 - 0.3, -1.25], [x0 - 0.45, -1.15]], 'grey'),
        // hind leg and foreleg: thick haunch and arm reaching down to each wheel, claws over the tyre
        blob([[rw.x - 0.45, -0.75], [rw.x + 0.35, -0.8], [rw.x + 0.25, rw.y - 0.3], [rw.x - 0.25, rw.y - 0.3]], 'body', { ring: true }, 1),
        blob([[fw.x - 0.35, -0.9], [fw.x + 0.2, -0.85], [fw.x + 0.15, fw.y - 0.3], [fw.x - 0.2, fw.y - 0.3]], 'body', { ring: true }, 1),
        ...[rw, fw].flatMap((w) => [-0.12, 0.0, 0.12].map((d) => poly([[w.x + d - 0.04, w.y - w.r - 0.05], [w.x + d + 0.04, w.y - w.r - 0.05], [w.x + d + 0.06, w.y - w.r + 0.08]], 'bone'))),
        // hunched body, shoulders high in front of the rider, ragged fur along the spine
        blob([[x0 + 0.1, -0.2], [x0 + 0.05, -0.75], [-0.8, -0.75], [-0.25, -1.15], [0.45, -1.2], [0.95, -0.9], [1.05, -0.4], [0.6, -0.15], [-0.6, -0.1]], 'body', {}, 2),
        ...[-0.2, 0.1, 0.4, 0.7].map((x) => poly([[x - 0.12, -1.12 + Math.abs(x - 0.25) * 0.2], [x + 0.12, -1.12 + Math.abs(x - 0.25) * 0.2], [x - 0.05, -1.35 + Math.abs(x - 0.25) * 0.2]], 'body')),
        blob([[-0.6, -0.15], [0.6, -0.2], [0.9, -0.45], [0.4, -0.4], [-0.4, -0.3]], 'grey', {}, 1),
        ...[[-1.0, -0.45], [-0.3, -0.6], [0.3, -0.7]].map(([x, y]) => poly([[x - 0.1, y], [x + 0.1, y - 0.02], [x, y + 0.15]], 'dark', { flat: true })),
        // wolf head: tall pointed ears, glowing eyes, long snout, open jaws
        blob([[0.85, -1.05], [1.2, -1.15], [1.45, -0.9], [x1 + 0.1, -0.7], [x1 + 0.1, -0.5], [1.2, -0.4], [0.85, -0.6]], 'body', {}, 1),
        poly([[0.9, -1.0], [0.92, -1.45], [1.12, -1.08]], 'body'), poly([[1.1, -1.1], [1.2, -1.48], [1.32, -1.02]], 'body'),
        poly([[0.97, -1.05], [0.98, -1.3], [1.06, -1.08]], 'pink'),
        ...browEye(1.28, -0.9, 0.075, 'accent'),
        poly([[1.15, -0.58], [x1 + 0.12, -0.6], [x1 + 0.05, -0.35], [1.2, -0.4]], 'black', { flat: true }),
        ...fangs(1.2, x1 + 0.08, -0.59, 4, 0.12), ...fangs(1.25, x1, -0.38, 3, 0.1, true),
        blob([[1.22, -0.38], [x1, -0.38], [x1 - 0.1, -0.26], [1.25, -0.28]], 'body', {}, 1),
        circ(x1 + 0.1, -0.66, 0.06, 'black'),
        // a ripped saddle for the rider
        ...saddle(f.head.x, f.head.y + 0.28, 'red'),
      ];
    },
  }],
  ['ghost-bike', 'Ghost Bike', 'Мотоцикл-привид у примарному сяйві.', 'bike', ['#d0e0f0', '#7a6ab0'], {
    float: 0.8, noLights: true,
    skin: (f) => [
      blob([[-0.6, -0.15], [-1.0, -0.5], [-1.5, -0.4], [-1.25, -0.1], [-1.6, 0.1], [-1.2, 0.2], [-0.6, 0.2]], 'white', {}, 1),
      ...bike(f, { mat: 'accent' }),
      ell(0.42, -0.25, 0.06, 0.08, 'black'), ell(0.57, -0.25, 0.06, 0.08, 'black'), ell(0.5, -0.1, 0.05, 0.04, 'black'),
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
    ],
  }],
]);
