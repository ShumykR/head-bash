import { arc, blob, circ, ell, eyeball, fangs, path, poly, rect, rr, seg, spikesAlong } from '../draw';
import { arm, browEye, dims, maw, quadruped, saddle, theropod } from '../critters';
import type { CarMat, CarPoly } from '../types';
import { group, o } from './util';

const hidden = (p: CarPoly): CarPoly => ({ ...p, hide: true });

export const DINO = group('dino', [
  ['woolly-mammoth', 'Mammoth', 'Волохатий мамонт із бивнями — важкий і впертий.', 'creature', ['#7a4a2a', '#f0e0c0'], {
    o: o({ neck: 'none', len: 1.1, tall: 1.6, wheel: 0.85 }), parts: ['trunk'], arch: 'heavy', noLights: true, hideParts: true,
    skin: (f) => {
      const { front } = dims(f);
      return [
        ...quadruped(f, { hump: 0.08, peak: 0.3, belly: null, tail: 0.3, tailUp: -0.1, leg: 0.38, saddle: null, chest: 1.0 }),
        // shaggy coat hanging over the legs
        ...[-1.0, -0.72, -0.44, -0.16, 0.12, 0.4, 0.68].map((x) => poly([[x - 0.04, -0.1], [x + 0.28, -0.1], [x + 0.1, 0.12]], 'body')),
        ...[[-0.75, -0.75], [0.15, -0.8], [-0.3, -0.4], [0.4, -0.38]].map(([x, y]) => poly([[x - 0.12, y], [x + 0.12, y - 0.04], [x + 0.02, y + 0.18]], 'dark', { flat: true })),
        // domed head, big ear, trunk curling down, long tusks sweeping forward and up
        blob([[0.85, -1.2], [1.2, -1.28], [1.48, -0.98], [1.45, -0.45], [1.15, -0.25], [0.85, -0.5]], 'body', {}, 2),
        blob([[0.82, -0.95], [1.08, -0.98], [1.12, -0.5], [0.9, -0.38], [0.75, -0.6]], 'dark', {}, 1),
        ...path([[1.38, -0.5], [1.5, -0.1], [1.48, 0.2], [1.32, 0.28]], 0.17, 'body'),
        ...path([[1.32, -0.35], [1.7, -0.08], [2.05, -0.2], [2.2, -0.5]], 0.13, 'bone'),
        ...browEye(1.28, -0.82, 0.07),
        ...saddle(f.head.x, f.head.y + 0.22, 'red'),
        circ(front, 0.48, 0.01, 'dark'),
      ];
    },
  }],
  ['prehistoric-car', 'Prehistoric Car', 'Первісне авто: дерев\'яна рама, шкура замість даху, кам\'яні колеса.', 'kart', ['#a07a4a', '#7a6a5a'], {
    s: 1.1, o: o({ mat: 'wood', wheel: 1.3 }), noLights: true,
    skin: (f) => [
      ...[-0.25, -0.05].map((y) => rr(f.tail.x, y - 0.06, f.nose.x, y + 0.06, 0.06, 'wood')),
      ...[-0.7, 0.0, 0.6].map((x) => rect(x, -0.3, x + 0.08, 0.1, 'brown')),
      ...path([[-0.7, -0.05], [-0.6, -0.85]], 0.08, 'wood'), ...path([[0.5, -0.05], [0.4, -0.85]], 0.08, 'wood'),
      blob([[-0.85, -0.85], [-0.1, -0.95], [0.6, -0.85], [0.5, -0.7], [-0.75, -0.72]], 'tan', {}, 1),
      ...[-0.5, -0.1, 0.25].map((x) => ell(x, -0.83, 0.07, 0.04, 'brown')),
      seg([0.35, -0.2], [0.55, -0.4], 0.05, 'wood'),
    ],
  }],
  ['pterodactyl-car', 'Pterodactyl Car', 'Птеродактиль-крилоплан: розправляє крила й ширяє.', 'creature', ['#a0603a', '#f0c080'], {
    o: o({ neck: 'raptor' }), parts: ['wings', 'crest'], float: 0.8, noLights: true, hideParts: true,
    skin: (f) => [
      // leathery wing raised over the back: arm bone along the leading edge, finger struts
      poly([[0.45, -0.6], [0.0, -1.2], [-0.6, -1.65], [-0.75, -0.6]], 'accent'),
      poly([[-0.6, -1.65], [-1.7, -1.2], [-0.75, -0.6]], 'accent'),
      ...path([[0.45, -0.62], [0.0, -1.2], [-0.6, -1.65]], 0.1, 'body'),
      ...[[-1.1, -1.42], [-1.45, -1.3]].map(([x, y]) => seg([-0.6, -1.62], [x, y], 0.05, 'dark')),
      ...theropod(f, { bulk: 0.7, tail: 0.15, tailUp: 0.1, stripes: null, belly: 'accent' }),
      // long crested head with a pointed beak
      blob([[0.65, -0.75], [1.05, -0.9], [1.15, -0.62], [0.85, -0.4]], 'body', {}, 1),
      poly([[1.05, -0.9], [0.45, -1.25], [0.6, -1.1], [1.15, -0.78]], 'accent'),
      blob([[1.0, -0.9], [1.35, -0.92], [2.1, -0.66], [1.4, -0.56], [1.05, -0.62]], 'body', {}, 1),
      poly([[1.4, -0.62], [2.1, -0.66], [1.4, -0.58]], 'dark', { flat: true }),
      ...browEye(1.25, -0.78, 0.07, 'black', 'accent'),
    ],
  }],
  ['sauropod', 'Sauropod', 'Довгошиїй завропод: голова високо, хвіст довгий.', 'creature', ['#6aa04a', '#c0e080'], {
    o: o({ neck: 'long', tall: 1.35, wheel: 0.8 }), parts: ['tail'], noLights: true, hideParts: true,
    skin: (f) => [
      ...quadruped(f, { hump: 0.08, peak: -0.25, tail: 1.15, tailUp: 0.0, leg: 0.34, belly: 'accent' }),
      // long neck rising in a gentle S to a small head
      ...path([[0.75, -0.55], [1.12, -0.85], [1.32, -1.2], [1.45, -1.42]], 0.32, 'body'),
      ...path([[0.9, -0.42], [1.2, -0.8], [1.38, -1.15]], 0.1, 'accent'),
      blob([[1.25, -1.5], [1.55, -1.66], [1.86, -1.55], [1.86, -1.38], [1.35, -1.32]], 'body', {}, 1),
      rect(1.55, -1.42, 1.84, -1.39, 'dark', { flat: true }),
      ...eyeball(1.55, -1.54, 0.06),
      ...[[-0.6, -0.7, 0.1], [0.05, -0.78, 0.09], [0.45, -0.62, 0.08], [-1.05, -0.5, 0.07]].map(([x, y, r]) => ell(x, y, r, r * 0.75, 'dark')),
    ],
  }],
  ['stegosaurus', 'Stegosaurus', 'Стегозавр із рядом кістяних пластин на спині.', 'creature', ['#5a8a3a', '#e0602a'], {
    o: o({ neck: 'raptor', tall: 1.35, wheel: 0.8 }), parts: ['plates', 'tail'], noLights: true, hideParts: true,
    skin: (f) => {
      const pl = (x: number, y: number, h: number, m: CarMat) => blob([[x - h * 0.42, y + 0.1], [x - h * 0.38, y - h * 0.55], [x, y - h], [x + h * 0.38, y - h * 0.55], [x + h * 0.42, y + 0.1]], m, {}, 1);
      return [
        // two staggered rows of plates; a gap in the middle for the rider
        ...[[-1.0, -0.72, 0.38], [-0.62, -1.02, 0.5], [0.2, -1.04, 0.48], [0.62, -0.84, 0.4]].map(([x, y, h]) => pl(x + 0.18, y + 0.02, h * 0.85, 'dark')),
        ...[[-1.0, -0.72, 0.38], [-0.62, -1.02, 0.5], [0.2, -1.04, 0.48], [0.62, -0.84, 0.4]].map(([x, y, h]) => pl(x, y, h, 'accent')),
        ...quadruped(f, { hump: 0.2, peak: -0.1, tail: 0.85, tailUp: 0.05, chest: 0.95, belly: 'leaf' }),
        // thagomizer
        ...[[-1.6, -0.62], [-1.8, -0.6]].map(([x, y]) => poly([[x - 0.06, y], [x + 0.06, y], [x - 0.08, y - 0.3]], 'bone')),
        // small low head
        blob([[0.8, -0.65], [1.2, -0.72], [1.6, -0.62], [1.72, -0.48], [1.2, -0.4], [0.85, -0.38]], 'body', {}, 1),
        rect(1.35, -0.48, 1.68, -0.45, 'dark', { flat: true }),
        ...eyeball(1.35, -0.6, 0.06),
      ];
    },
  }],
  ['triceratops', 'Triceratops', 'Трицератопс із комірцем і трьома рогами. Таранить з розгону.', 'creature', ['#6a9a3a', '#e8803a'], {
    o: o({ tall: 1.3, wheel: 0.8 }), parts: ['tail'], noLights: true, hideParts: true,
    art: () => [hidden(poly([[1.45, -0.95], [1.55, -1.05], [2.05, -1.25]], 'bone', { deco: false, density: 0.3 }))],
    skin: (f) => [
      ...quadruped(f, { hump: 0.05, peak: -0.3, tail: 0.6, tailUp: 0.05, leg: 0.34, belly: 'cream' }),
      ...[[-0.6, -0.68], [-0.15, -0.72], [0.3, -0.66]].map(([x, y]) => ell(x, y, 0.08, 0.05, 'dark')),
      // great bony frill fanned up behind the head, studded at the rim
      blob([[0.55, -0.45], [0.5, -1.2], [0.78, -1.55], [1.1, -1.5], [1.3, -0.9]], 'accent', {}, 2),
      ...[[0.56, -1.18], [0.72, -1.45], [0.98, -1.52]].map(([x, y]) => circ(x, y, 0.065, 'bone')),
      // big head with a hooked beak
      blob([[0.85, -1.12], [1.35, -1.15], [1.72, -0.92], [1.8, -0.62], [1.5, -0.5], [0.95, -0.55]], 'body', {}, 1),
      poly([[1.66, -0.92], [1.95, -0.72], [1.66, -0.58]], 'dark'),
      // three horns: two long brow horns forward, a short one on the nose
      poly([[1.18, -1.04], [1.36, -1.16], [2.05, -1.34]], 'bone'), poly([[1.3, -0.96], [1.46, -1.08], [2.1, -1.14]], 'bone'),
      poly([[1.6, -0.92], [1.72, -0.9], [1.78, -1.1]], 'bone'),
      ...browEye(1.22, -0.88, 0.07),
    ],
  }],
  ['t-rex', 'T. Rex', 'Тиранозавр: величезна паща, крихітні лапки і рик, що зносить машини.', 'creature', ['#3a6aa8', '#e8d8a0'], {
    o: o({ neck: 'raptor', len: 1.15, tall: 1.2 }), parts: ['tail'], noLights: true, hideParts: true,
    // The lower jaw hangs on its own hinge under the skull: it drops open on bumps and snaps shut.
    links: () => [{
      to: 0, at: [1.45, -0.62], swing: [-2, 30], spring: 1.2, density: 0.6,
      hit: [poly([[1.4, -0.66], [2.15, -0.66], [2.05, -0.44], [1.45, -0.42]])],
      art: [
        blob([[1.38, -0.6], [2.16, -0.6], [2.08, -0.44], [1.8, -0.34], [1.42, -0.34]], 'body', {}, 1),
        rect(1.5, -0.44, 2.0, -0.38, 'accent', { flat: true }),
        ...fangs(1.6, 2.1, -0.58, 4, 0.1, true),
      ],
    }],
    skin: (f) => [
      ...theropod(f, { bulk: 1, tail: 1.0, tailUp: 0.35, saddle: null }),
      // neck and the huge boxy skull
      blob([[0.75, -1.0], [1.2, -1.18], [1.42, -0.72], [1.05, -0.45]], 'body', {}, 1),
      blob([[1.15, -1.2], [1.65, -1.28], [2.05, -1.15], [2.24, -0.95], [2.22, -0.68], [1.4, -0.64], [1.15, -0.85]], 'body', {}, 1),
      poly([[1.35, -0.66], [2.2, -0.68], [2.14, -0.56], [1.4, -0.54]], 'black', { flat: true }),
      ...fangs(1.5, 2.18, -0.67, 5, 0.11),
      poly([[1.45, -1.12], [1.78, -1.12], [1.62, -1.04]], 'dark'),
      ...eyeball(1.6, -0.96, 0.08, 'red'), circ(2.12, -1.02, 0.03, 'black'),
      ...arm(1.0, -0.45),
      ...saddle(f.head.x, f.head.y + 0.2),
    ],
  }],
  ['velociraptor', 'Velociraptor', 'Швидкий велоцираптор: стрибає на здобич зі смугастою спиною.', 'creature', ['#c08a3a', '#c0302a'], {
    s: 0.85, o: o({ neck: 'raptor' }), parts: ['tail'], speed: 1.15, noLights: true, hideParts: true,
    skin: (f) => [
      ...theropod(f, { bulk: 0.72, tail: 1.1, tailUp: 0.05, stripes: 'accent', belly: 'tan' }),
      // feather tufts on the arms and tail tip
      ...[[-1.6, -0.75], [-1.75, -0.72]].map(([x, y]) => poly([[x, y], [x + 0.12, y + 0.02], [x - 0.05, y - 0.16]], 'accent')),
      // long narrow snout full of teeth
      blob([[0.62, -0.72], [1.02, -0.95], [1.12, -0.62], [0.85, -0.42]], 'body', {}, 1),
      blob([[0.98, -0.95], [1.35, -0.98], [1.8, -0.8], [1.86, -0.66], [1.2, -0.6], [1.0, -0.7]], 'body', {}, 1),
      ...maw(1.2, 1.84, -0.62, 0.1, 4),
      blob([[1.22, -0.58], [1.8, -0.56], [1.6, -0.46], [1.25, -0.48]], 'body', {}, 1),
      poly([[1.15, -0.98], [1.45, -0.96], [1.3, -1.1]], 'accent'),
      ...browEye(1.32, -0.82, 0.065, 'yellow'),
      ...arm(0.85, -0.42),
      // the sickle claw
      ...path([[0.82, 0.12], [0.98, 0.04], [1.02, 0.14]], 0.07, 'bone'),
    ],
  }],
  ['fossil', 'Fossil', 'Ожилий скелет: кістки, ребра й порожні очниці.', 'creature', ['#e8dcc0', '#8a7a5a'], {
    o: o({ neck: 'long', mat: 'bone' }), parts: ['tail'], noLights: true, hideParts: true,
    skin: (f) => {
      const { rear, front } = dims(f);
      return [
        // spine from the tail tip over the back and up the neck
        ...path([[f.tail.x - 0.7, -0.85], [-1.0, -0.62], [-0.4, -0.66], [0.3, -0.62], [0.75, -0.5], [1.05, -0.85], [1.38, -1.35]], 0.12, 'bone'),
        ...[-1.5, -1.2].map((x) => circ(x, x < -1.4 ? -0.8 : -0.7, 0.06, 'bone')),
        // ribcage: curved ribs hanging from the spine, a breastbone below
        ...[-0.6, -0.32, -0.04, 0.24, 0.5].map((x) => path([[x, -0.62], [x + 0.1, -0.4], [x + 0.04, -0.12]], 0.08, 'bone')).flat(),
        ...path([[-0.62, -0.1], [0.55, -0.12]], 0.08, 'bone'),
        // pelvis and shoulder blade, leg bones down onto the wheels
        blob([[-0.95, -0.75], [-0.6, -0.78], [-0.55, -0.4], [-0.85, -0.35]], 'bone', {}, 1),
        blob([[0.55, -0.7], [0.82, -0.62], [0.75, -0.3], [0.55, -0.35]], 'bone', {}, 1),
        ...[rear, front].flatMap((x) => path([[x - 0.05, -0.45], [x + 0.08, -0.05], [x, 0.3]], 0.1, 'bone')),
        ...[rear, front].map((x) => circ(x + 0.08, -0.05, 0.07, 'bone')),
        // skull: empty sockets, toothy grin, a green glint in the eye
        blob([[1.18, -1.48], [1.5, -1.64], [1.88, -1.52], [1.86, -1.34], [1.3, -1.28]], 'bone', {}, 1),
        circ(1.48, -1.5, 0.08, 'black'), circ(1.5, -1.5, 0.03, 'green'), circ(1.78, -1.5, 0.03, 'black'),
        ...[0, 1, 2, 3].map((i) => rect(1.48 + i * 0.09, -1.36, 1.52 + i * 0.09, -1.28, 'black', { flat: true })),
      ];
    },
  }],
  ['egg-mobile', 'Egg Mobile', 'Капсула-яйце динозавра. Закидає яйця-перешкоди вперед.', 'blob', ['#f0e8d0', '#7ab04a'], {
    o: o({ shape: 'egg' }), noLights: true,
    skin: () => [
      blob([[-0.75, 0.2], [-0.95, -0.35], [-0.6, -1.05], [0.0, -1.3], [0.6, -1.05], [0.95, -0.35], [0.75, 0.2]], 'body', {}, 2),
      ...[[-0.4, -0.7, 0.14], [0.3, -0.95, 0.1], [0.5, -0.3, 0.12], [-0.5, -0.15, 0.09], [0.1, -0.5, 0.07]].map(([x, y, r]) => ell(x, y, r, r * 0.8, 'accent')),
      ...path([[-0.9, -0.55], [-0.6, -0.65], [-0.4, -0.5], [-0.2, -0.62], [-0.05, -0.5], [0.15, -0.6]], 0.05, 'brown'),
      ...eyeball(0.55, -0.6, 0.1),
      ...path([[-0.2, -1.25], [-0.05, -1.1], [0.1, -1.2], [0.25, -1.05]], 0.05, 'brown'),
      rr(-0.8, 0.12, 0.8, 0.3, 0.05, 'dark'), ell(-0.4, -0.95, 0.18, 0.08, 'white', { flat: true }),
    ],
  }],
  ['parasaurolophus', 'Parasaurolophus', 'Динозавр із трубчастим гребенем: трубить, як у ріг.', 'creature', ['#4a8ab0', '#ffd23f'], {
    o: o({ tall: 1.3, wheel: 0.8 }), parts: ['tail'], noLights: true, hideParts: true,
    skin: (f) => [
      ...quadruped(f, { hump: 0.0, peak: -0.15, tail: 0.9, tailUp: 0.1, belly: 'cream' }),
      ...[-0.75, -0.4, -0.05, 0.3].map((x) => poly([[x - 0.1, -0.72], [x + 0.1, -0.74], [x + 0.02, -0.45]], 'accent', { flat: true })),
      // neck up to a duck-billed head with the long tube crest swept back
      ...path([[0.7, -0.5], [1.05, -0.8], [1.25, -0.95]], 0.34, 'body'),
      ...path([[1.12, -1.12], [0.8, -1.38], [0.48, -1.5]], 0.15, 'accent'),
      blob([[1.05, -1.15], [1.4, -1.18], [1.75, -0.98], [1.85, -0.82], [1.55, -0.76], [1.1, -0.78]], 'body', {}, 1),
      poly([[1.55, -0.86], [1.88, -0.84], [1.84, -0.78], [1.55, -0.8]], 'dark', { flat: true }),
      ...eyeball(1.35, -1.0, 0.065),
    ],
  }],
  ['allosaurus', 'Allosaurus', 'Хижий аллозавр із гребенями над очима.', 'creature', ['#a04a2a', '#f0d0a0'], {
    o: o({ neck: 'raptor' }), parts: ['teeth', 'tail'], noLights: true,
    skin: (f) => [
      ...theropod(f, { bulk: 0.9, tail: 1.0, tailUp: 0.25, stripes: null, belly: 'accent' }),
      ...spikesAlong(-1.3, 0.55, -0.82, 9, 0.13, 'dark'),
      blob([[0.62, -0.78], [1.02, -0.98], [1.15, -0.62], [0.85, -0.42]], 'body', {}, 1),
      blob([[0.98, -0.98], [1.4, -1.02], [1.8, -0.82], [1.84, -0.64], [1.2, -0.58], [1.0, -0.7]], 'body', {}, 1),
      ...maw(1.18, 1.82, -0.6, 0.11, 4),
      blob([[1.2, -0.56], [1.78, -0.54], [1.55, -0.42], [1.22, -0.44]], 'body', {}, 1),
      // the red horn ridges over the eyes
      poly([[1.18, -0.98], [1.42, -1.0], [1.28, -1.16]], 'red'), poly([[1.42, -0.98], [1.6, -0.94], [1.52, -1.08]], 'red'),
      ...browEye(1.35, -0.84, 0.07, 'red'),
      ...arm(0.85, -0.45),
    ],
  }],
  ['piranha', 'Piranha', 'Всюдихід-піранья із зубатою пащею. Кусає з ривка.', 'blob', ['#c0302a', '#ffd23f'], {
    o: o({ shape: 'flat' }), parts: ['fin'], noLights: true, hideParts: true,
    skin: (f) => {
      const n = f.nose.x;
      return [
        // forked tail fin and the spiky dorsal fin
        poly([[f.tail.x + 0.2, -0.2], [f.tail.x - 0.45, -0.75], [f.tail.x - 0.3, -0.2], [f.tail.x - 0.45, 0.35], [f.tail.x + 0.2, 0.0]], 'accent'),
        poly([[-0.55, -0.45], [-0.3, -1.0], [0.0, -0.9], [0.3, -0.5]], 'accent'),
        // deep body with a humped back, red belly
        blob([[f.tail.x + 0.1, -0.2], [-0.6, -0.62], [0.2, -0.7], [n - 0.25, -0.38], [n, 0.02], [n - 0.2, 0.3], [-0.2, 0.32], [f.tail.x + 0.1, 0.05]], 'body', {}, 2),
        blob([[-0.6, 0.05], [n - 0.4, 0.05], [n - 0.3, 0.26], [-0.4, 0.28]], 'orange', {}, 1),
        ...[[-0.55, -0.3], [-0.25, -0.38], [0.05, -0.32], [-0.4, -0.08], [-0.1, -0.1]].map(([x, y]) => arc(x, y, 0.08, Math.PI * 0.1, Math.PI * 0.9, 0.04, 'dark')),
        poly([[0.0, 0.0], [0.35, 0.05], [0.1, 0.25]], 'accent'),
        // big underbite full of teeth
        poly([[n - 0.62, -0.02], [n + 0.02, -0.08], [n - 0.04, 0.18], [n - 0.62, 0.16]], 'black', { flat: true }),
        ...fangs(n - 0.58, n - 0.02, -0.04, 4, 0.12), ...fangs(n - 0.56, n - 0.06, 0.15, 4, 0.12, true),
        ...browEye(n - 0.48, -0.3, 0.1, 'red'),
        rr(-0.95, 0.28, 0.95, 0.4, 0.05, 'dark'),
      ];
    },
  }],
  ['mechasaurus', 'Mechasaurus', 'Кібердинозавр із ракетними пускачами на спині.', 'creature', ['#a0a8b8', '#e02a2a'], {
    gun: () => ({ at: [[-0.32, -0.98], [-0.1, -0.98], [0.12, -0.98]], aim: 35 }),
    o: o({ neck: 'raptor', mat: 'metal' }), parts: ['teeth', 'tail'], noLights: true, hideParts: true,
    // Every piece of the machine is bolted on separately: neck, steel jaw, whip antenna, tail.
    links: () => [
      {
        to: 0, at: [1.3, -0.56], swing: [-2, 32], spring: 1.2, density: 0.7,
        hit: [poly([[1.28, -0.58], [1.8, -0.58], [1.74, -0.42], [1.34, -0.4]])],
        art: [poly([[1.28, -0.58], [1.8, -0.58], [1.74, -0.42], [1.34, -0.4]], 'grey'), ...fangs(1.4, 1.76, -0.56, 3, 0.07, true), circ(1.33, -0.5, 0.05, 'dark')],
      },
      {
        to: 0, at: [1.2, -0.88], swing: [-40, 40], spring: 0.5, density: 0.8, trim: true,
        hit: [seg([1.2, -0.88], [1.15, -1.3], 0.1)],
        art: [...path([[1.2, -0.88], [1.15, -1.25]], 0.04, 'grey'), circ(1.15, -1.28, 0.06, 'red')],
      },
    ],
    skin: (f) => [
      ...theropod(f, { mat: 'metal', bulk: 0.9, tail: 0.95, tailUp: 0.25, stripes: null, belly: 'grey', saddle: 'dark' }),
      // armour panels, rivets and a glowing reactor
      ...[[-0.45, -0.6, 0.0, -0.25], [0.1, -0.62, 0.55, -0.3]].map(([a, b, c, d]) => rect(a, b, c, d, 'grey', { ring: true })),
      ...[-0.4, -0.05, 0.15, 0.5].map((x) => circ(x, -0.55, 0.035, 'dark')),
      circ(0.35, -0.12, 0.08, 'red'), circ(0.35, -0.12, 0.035, 'light'),
      ...[-1.3, -1.0, -0.7].map((x) => rect(x, -0.86 + (x + 1.3) * 0.1, x + 0.1, -0.66 + (x + 1.3) * 0.1, 'dark', { flat: true })),
      // rocket pod on the back
      rr(-0.45, -1.05, 0.25, -0.62, 0.06, 'dark'), ...[-0.32, -0.1, 0.12].map((x) => circ(x, -0.84, 0.075, 'red')),
      // boxy steel head with a visor eye
      rr(0.65, -0.88, 1.12, -0.42, 0.06, 'metal', { ring: true }),
      blob([[0.98, -0.98], [1.45, -1.0], [1.82, -0.84], [1.82, -0.62], [1.25, -0.6], [1.0, -0.68]], 'metal', {}, 1),
      rect(1.28, -0.64, 1.8, -0.58, 'black', { flat: true }), ...fangs(1.32, 1.78, -0.62, 4, 0.08),
      rr(1.2, -0.9, 1.5, -0.8, 0.03, 'red'), rect(1.35, -0.88, 1.47, -0.83, 'light', { flat: true }),
      ...arm(0.85, -0.42, 'grey'),
    ],
  }],
  ['ankylosaurus', 'Ankylosaurus', 'Панцерний динозавр із булавою на хвості — вона розгойдується й б\'є.', 'creature', ['#8a6a3a', '#d8b060'], {
    o: o({ neck: 'none', tall: 1.0, wheel: 0.8 }), parts: ['plates'], noLights: true, hideParts: true,
    flail: { from: 'tail', len: 0.75, r: 0.26, look: 'mace' },
    art: (f) => [hidden(poly([[f.tail.x + 0.3, f.tail.y0], [f.tail.x + 0.3, f.tail.y1 - 0.1], [f.tail.x - 0.25, (f.tail.y0 + f.tail.y1) / 2 - 0.05]], 'body', { deco: false }))],
    skin: (f) => [
      ...quadruped(f, { hump: 0.05, peak: 0, tail: 0.45, tailUp: 0.05, leg: 0.32, belly: null, chest: 0.98 }),
      // armoured shell with rows of bony studs and side spikes
      blob([[-1.12, -0.25], [-0.95, -0.68], [-0.3, -0.82], [0.4, -0.82], [0.95, -0.62], [1.1, -0.25], [0.0, -0.18]], 'accent', {}, 2),
      ...[-0.75, -0.4, -0.05, 0.3, 0.65].map((x) => circ(x, -0.6 + Math.abs(x) * 0.08, 0.07, 'brown')),
      ...[-0.6, -0.25, 0.1, 0.45].map((x) => circ(x, -0.36, 0.06, 'brown')),
      ...[-1.0, -0.6, -0.2, 0.2, 0.6, 0.95].map((x) => poly([[x - 0.08, -0.24], [x + 0.08, -0.24], [x, -0.05]], 'bone')),
      ...[-0.9, -0.5, 0.35, 0.75].map((x) => poly([[x - 0.08, -0.78 + Math.abs(x) * 0.12], [x + 0.08, -0.8 + Math.abs(x) * 0.12], [x - 0.02, -1.0 + Math.abs(x) * 0.12]], 'bone')),
      // small armoured head low at the front
      blob([[0.9, -0.55], [1.25, -0.58], [1.45, -0.38], [1.42, -0.15], [0.95, -0.12]], 'body', {}, 1),
      poly([[1.1, -0.58], [1.3, -0.6], [1.22, -0.72]], 'bone'),
      rect(1.22, -0.24, 1.42, -0.21, 'dark', { flat: true }),
      ...browEye(1.22, -0.4, 0.06),
    ],
  }],
]);

