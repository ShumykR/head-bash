import { tailgate } from '../art';
import { arc, beacon, blob, checkers, circ, ell, flameDecal, grille, ladder, lightbar, path, poly, rect, rr, seat, seg, stack, starShape, stripe, windows, eyeball } from '../draw';
import { bike, boxy, fenders, frontLamp, loco, monsterChassis, pickup, sedan, tracks } from '../skins';
import type { CarPoly } from '../types';
import { crew, dims, saddle } from '../critters';
import { group, o } from './util';

const hidden = (p: CarPoly): CarPoly => ({ ...p, hide: true });

export const SUMMER = group('summer', [
  ['harvester', 'Harvester', 'Зернозбиральний комбайн із мотовилом. Скидає тюки сіна.', 'box', ['#3aa04a', '#ffd23f'], {
    axles: [0.75, 1.15],
    o: o({ len: 1.15, tall: 1.2 }), arch: 'scoop', cargo: ['hay', 2],
    art: (f) => [hidden(tailgate(f.deck.x0, f.deck.y, 0.3, 'accent')), hidden(poly([[f.nose.x - 0.2, -0.3], [f.nose.x + 0.7, -0.15], [f.nose.x + 0.75, 0.3], [f.nose.x - 0.2, 0.3]], 'yellow', { deco: false }))],
    // The reel is absurdly big and really turns: it combs whatever is in front up and over the header.
    links: (f) => {
      const cx = f.nose.x + 0.75, cy = -0.75, r = 0.85;
      const art: CarPoly[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
        art.push(seg([cx, cy], [cx + c * r, cy + sn * r], 0.07, 'red'));
        art.push(seg([cx + c * r - sn * 0.22, cy + sn * r + c * 0.22], [cx + c * r + sn * 0.22, cy + sn * r - c * 0.22], 0.13, 'yellow'));
      }
      art.push(circ(cx, cy, 0.2, 'red'), circ(cx, cy, 0.08, 'dark'));
      return [{ at: [cx, cy], spin: -7, density: 0.03, hit: [ell(cx, cy, r, r, 'red', {}, 8)], art }];
    },
    skin: (f) => [
      rr(f.tail.x, f.roof.y + 0.15, f.nose.x - 0.2, 0.25, 0.1, 'body'),
      rr(f.nose.x - 1.05, f.roof.y - 0.35, f.nose.x - 0.25, f.roof.y + 0.5, 0.08, 'body'), rr(f.nose.x - 0.95, f.roof.y - 0.25, f.nose.x - 0.35, f.roof.y + 0.3, 0.05, 'glass'),
      ...path([[f.tail.x + 0.3, f.roof.y + 0.15], [f.tail.x + 0.2, f.roof.y - 0.5], [f.tail.x - 0.25, f.roof.y - 0.6]], 0.14, 'accent'),
      stripe(f.tail.x, f.nose.x - 0.2, -0.05, 0.08, 'accent'),
      poly([[f.nose.x - 0.2, -0.3], [f.nose.x + 0.7, -0.15], [f.nose.x + 0.75, 0.3], [f.nose.x - 0.2, 0.3]], 'yellow'),
      ...[0, 1, 2, 3].map((i) => poly([[f.nose.x - 0.1 + i * 0.22, 0.28], [f.nose.x + 0.0 + i * 0.22, 0.28], [f.nose.x + 0.12 + i * 0.22, -0.15], [f.nose.x + 0.02 + i * 0.22, -0.15]], 'black', { flat: true })),
      ...ladder([f.nose.x - 1.15, 0.2], [f.nose.x - 1.1, f.roof.y + 0.5], 0.12, 'grey', 5), ...beacon(f.nose.x - 0.65, f.roof.y - 0.35, 'orange', 0.14),
      rect(f.nose.x - 1.05, f.roof.y - 0.39, f.nose.x - 0.25, f.roof.y - 0.33, 'dark', { flat: true }),
      ...[0, 1, 2, 3].map((i) => poly([[f.nose.x + 0.05 + i * 0.17, 0.3], [f.nose.x + 0.13 + i * 0.17, 0.3], [f.nose.x + 0.09 + i * 0.17, 0.45]], 'chrome')),
      ...path([[f.nose.x - 0.3, -0.5], [f.nose.x + 0.75, -0.75]], 0.12, 'dark'),
      ...stack(f.tail.x + 0.8, f.roof.y + 0.15, 0.4, 0.09, 'dark'),
    ],
  }],
  ['sports-bike', 'Sports Bike', 'Шосейний спортбайк з обтічником.', 'bike', ['#e02a2a', '#ffffff'], {
    axles: [0.82, 0.8],
    speed: 1.2, accel: 1.2,
    skin: (f) => [
      ...bike(f, { style: 'sport' }),
      // full racing fairing: one red shell from the front wheel to under the rider, a tinted screen, number and stripe
      blob([[-0.35, 0.18], [-0.5, -0.2], [0.2, -0.4], [0.75, -0.62], [1.05, -0.35], [1.0, 0.0], [0.55, 0.22]], 'body', {}, 2),
      stripe(-0.35, 0.95, -0.12, 0.07, 'accent'),
      blob([[0.6, -0.6], [0.85, -0.82], [0.95, -0.6]], 'glass', {}, 1),
      circ(0.35, 0.02, 0.13, 'white'), rect(0.32, -0.05, 0.38, 0.09, 'black', { flat: true }),
      rr(0.85, -0.3, 1.05, -0.2, 0.03, 'light'),
    ],
  }],
  ['off-road-truck', 'Off-Road Truck', 'Експедиційний трак з ящиками спорядження в кузові.', 'pickup', ['#e0a020', '#2a2a2a'], {
    o: o({ wheel: 1.25 }), cargo: ['tire', 3],
    art: (f) => [hidden(tailgate(f.deck.x0, f.deck.y, 0.24, 'body'))],
    skin: (f) => [
      ...pickup(f), ...fenders(f, 'dark', 0.12),
      rr(f.roof.x0, f.roof.y - 0.1, f.roof.x1, f.roof.y, 0.03, 'black'), ...[0, 1, 2].map((i) => circ(f.roof.x0 + 0.15 + i * 0.25, f.roof.y - 0.14, 0.07, 'light')),
      ...path([[f.roof.x1 + 0.3, f.nose.y0 - 0.02], [f.nose.x + 0.1, f.nose.y0 + 0.05], [f.nose.x + 0.15, f.nose.y1 - 0.05]], 0.08, 'black'),
      rr(f.nose.x - 0.1, f.nose.y1 - 0.2, f.nose.x + 0.25, f.nose.y1 + 0.02, 0.04, 'black'), circ(f.nose.x + 0.08, f.nose.y1 - 0.09, 0.06, 'grey'),
      ...path([[f.roof.x0 - 0.05, f.roof.y - 0.1], [f.roof.x0 - 0.1, f.roof.y - 0.28], [f.roof.x1, f.roof.y - 0.28]], 0.05, 'black'),
    ],
  }],
  ['classic-monster', 'Classic Monster', 'Оригінальний бігфут на величезних колесах.', 'monster', ['#2a6ae0', '#ffffff'], {
    o: o({ wheel: 1.1 }),
    skin: (f) => [
      ...monsterChassis(f),
      ...pickup({ ...f, nose: { ...f.nose, y0: -0.5, y1: 0.06 }, tail: { ...f.tail, y0: -0.5, y1: 0.06 }, roof: f.roof }),
      starShape(0.4, -0.25, 0.16, 'white'), stripe(f.tail.x, f.nose.x, -0.08, 0.06, 'white'),
      ...path([[f.nose.x - 0.05, -0.42], [f.nose.x + 0.2, -0.36], [f.nose.x + 0.22, 0.02], [f.nose.x, 0.08]], 0.12, 'chrome'),
      ...stack(f.tail.x + 0.25, -0.48, 0.55, 0.1), rr(f.roof.x0, f.roof.y - 0.13, f.roof.x1, f.roof.y - 0.02, 0.04, 'black'), ...[0.12, 0.35, 0.58].map((x) => circ(f.roof.x0 + x, f.roof.y - 0.08, 0.05, 'light')),
    ],
  }],
  ['burger-bike', 'Burger Bike', 'Трицикл-бургерна. Жбурляє бургерами.', 'trike', ['#e0b060', '#7a3a1a'], {
    gun: () => ({ at: [[-0.65, -0.72]], aim: 35 }),
    parts: ['hump'], hideParts: true,
    skin: (f) => [
      ...bike(f, { style: 'scooter', mat: 'red' }),
      blob([[-1.3, -0.3], [-1.2, -0.6], [-0.65, -0.68], [-0.15, -0.55], [-0.12, -0.3]], 'body', {}, 2),
      ...[-1.0, -0.8, -0.55, -0.35].map((x) => ell(x, -0.55, 0.03, 0.02, 'white')),
      blob([[-1.32, -0.3], [-0.1, -0.3], [-0.15, -0.2], [-0.4, -0.25], [-0.7, -0.18], [-1.0, -0.25], [-1.25, -0.2]], 'leaf', {}, 1),
      rr(-1.3, -0.24, -0.12, -0.12, 0.05, 'accent'), rr(-1.25, -0.13, -0.17, -0.02, 0.04, 'body'),
      poly([[-1.28, -0.31], [-0.12, -0.31], [-0.4, -0.22], [-0.55, -0.15], [-0.7, -0.22], [-1.0, -0.17], [-1.28, -0.24]], 'yellow'), rr(-1.26, -0.36, -0.14, -0.3, 0.02, 'red'),
    ],
  }],
  ['lowrider', 'Lowrider', 'Лоурайдер на гідравліці: підстрибує на місці.', 'sedan', ['#8a2ae0', '#ffd23f'], {
    axles: [0.82, 0.82],
    o: o({ len: 1.1 }), arch: 'bouncy', bounce: 0.3,
    skin: (f) => [
      ...sedan(f, { roof: 'coupe', bumper: 'gold' }),
      ...flameDecal(f.nose.x - 0.1, -0.6, 0.05, 0.22),
      stripe(f.tail.x, f.nose.x, 0.2, 0.05, 'gold'),
      ...f.wheels.map((w) => seg([w.x, w.y], [w.x, 0.1], 0.08, 'gold')),
      ...path([[f.tail.x + 0.2, -0.05], [-0.6, -0.1], [-0.3, 0.0], [0.0, -0.1]], 0.03, 'gold'), poly([[f.roof.x0 + 0.05, f.roof.y + 0.02], [f.roof.x0 + 0.4, f.roof.y + 0.02], [f.roof.x0 + 0.4, f.roof.y + 0.08], [f.roof.x0 + 0.05, f.roof.y + 0.08]], 'white'),
    ],
  }],
  ['yacht', 'Yacht', 'Моторна яхта з білою надбудовою і рятувальним колом.', 'boat', ['#ffffff', '#3a6ad8'], {
    o: o({ len: 1.15 }),
    skin: (f) => [
      blob([[f.tail.x, -0.45], [f.nose.x + 0.05, -0.55], [f.nose.x - 0.3, 0.0], [f.nose.x - 0.6, 0.12], [f.tail.x + 0.15, 0.12]], 'body', {}, 1),
      stripe(f.tail.x, f.nose.x - 0.2, -0.28, 0.08, 'accent'), stripe(f.tail.x + 0.1, f.nose.x - 0.5, 0.0, 0.06, 'accent'),
      blob([[-0.6, -0.45], [-0.55, -0.88], [0.6, -0.9], [0.95, -0.45]], 'white', {}, 1), ...windows(-0.4, 0.6, -0.8, -0.58, 3, 0.08),
      circ(0.1, -0.68, 0.16, 'red'), circ(0.1, -0.68, 0.08, 'white'),
      // the second deck: a flybridge with its own windows, a rail and the mast on top (two decks, as in Drive Ahead)
      blob([[-0.25, -0.88], [-0.2, -1.2], [0.45, -1.22], [0.7, -0.88]], 'white', {}, 1), ...windows(-0.1, 0.5, -1.14, -0.98, 2, 0.06),
      ...[-0.2, 0.15, 0.5].map((x) => rect(x - 0.02, -1.4, x + 0.02, -1.2, 'chrome')), rr(-0.25, -1.43, 0.55, -1.37, 0.02, 'chrome'),
      ...path([[0.3, -1.2], [0.3, -1.8]], 0.05, 'chrome'), poly([[0.33, -1.8], [0.33, -1.55], [0.75, -1.68]], 'accent'),
      ...[-1.6, -1.3, -1.0].map((x) => [circ(x, -0.15, 0.08, 'chrome'), circ(x, -0.15, 0.055, 'glass')]).flat(),
      ...path([[f.tail.x + 0.1, -0.5], [-0.6, -0.55], [-0.6, -0.45]], 0.04, 'chrome'), ...path([[0.95, -0.48], [f.nose.x - 0.2, -0.55]], 0.04, 'chrome'),
      rr(-0.62, -0.95, 0.62, -0.88, 0.02, 'accent'),
    ],
  }],
  ['coupe', 'Coupé', 'Компактне дводверне купе.', 'coupe', ['#3ab0b0', '#ffffff'], {
    axles: [0.8, 0.8],
    skin: (f) => [...sedan(f, { roof: 'coupe', pin: null }), poly([[f.tail.x + 0.1, -0.06], [f.nose.x - 0.2, 0.0], [f.nose.x - 0.2, 0.06], [f.tail.x + 0.1, 0.02]], 'white', { flat: true }), ...grille(f.nose.x - 0.06, -0.1, f.nose.x + 0.03, 0.12, 2), circ(-0.1, 0.12, 0.1, 'white'), rect(-0.13, 0.06, -0.07, 0.18, 'black', { flat: true })],
  }],
  ['speedboat', 'Speedboat', 'Швидкісний катер із номером на борту.', 'boat', ['#e02a2a', '#ffffff'], {
    arch: 'fast',
    skin: (f) => [
      blob([[f.tail.x, -0.4], [f.nose.x + 0.25, -0.5], [f.nose.x - 0.2, 0.0], [f.nose.x - 0.6, 0.12], [f.tail.x + 0.1, 0.12]], 'body', {}, 1),
      poly([[f.tail.x, -0.15], [f.nose.x + 0.15, -0.3], [f.nose.x - 0.05, -0.15], [f.tail.x, 0.0]], 'white', { flat: true }),
      blob([[0.2, -0.45], [0.55, -0.82], [0.75, -0.48]], 'glass', {}, 1),
      circ(-0.6, -0.22, 0.14, 'white'), rect(-0.63, -0.3, -0.57, -0.14, 'black', { flat: true }),
      rr(f.tail.x - 0.35, -0.55, f.tail.x + 0.15, -0.15, 0.06, 'dark'), seg([f.tail.x - 0.25, -0.15], [f.tail.x - 0.3, 0.2], 0.08, 'grey'),
      rect(f.tail.x - 0.3, -0.45, f.tail.x + 0.1, -0.41, 'red', { flat: true }), poly([[f.tail.x - 0.3, 0.2], [f.tail.x - 0.5, 0.25], [f.tail.x - 0.3, 0.3]], 'white'),
      ...path([[0.15, -0.45], [0.05, -0.62], [-0.3, -0.6]], 0.04, 'chrome'), poly([[f.tail.x + 0.1, 0.02], [f.nose.x - 0.3, -0.08], [f.nose.x - 0.5, 0.04], [f.tail.x + 0.15, 0.1]], 'accent', { flat: true }),
    ],
  }],
  ['swat-van', 'Swat Van', 'Броньовик спецпризначенців. Світлошумова глушить суперника поруч.', 'van', ['#2a2a3a', '#ffffff'], {
    parts: ['ram'], hideParts: true,
    skin: (f) => [
      ...boxy(f, { slope: 0.3, round: 0.06, bumper: 'black' }),
      ...windows(f.tail.x + 0.3, f.tail.x + 1.2, f.roof.y + 0.15, f.roof.y + 0.32, 2, 0.15, 'dark'),
      stripe(f.tail.x, f.nose.x, -0.06, 0.08, 'white'),
      ...lightbar(f.roof.x0 + 0.2, f.roof.x0 + 0.7, f.roof.y),
      rect(f.nose.x - 0.12, f.nose.y0 + 0.1, f.nose.x + 0.25, f.nose.y1 - 0.05, 'black'),
      ...[0, 1, 2].map((i) => rect(f.nose.x + 0.05, f.nose.y0 + 0.15 + i * 0.15, f.nose.x + 0.25, f.nose.y0 + 0.2 + i * 0.15, 'grey', { flat: true })),
      ...[-0.9, -0.5, -0.1, 0.3].map((x) => circ(x, 0.2, 0.04, 'chrome')),
      circ(-0.4, -0.3, 0.13, 'gold'), starShape(-0.4, -0.3, 0.09, 'body'), rect(f.tail.x + 0.06, f.roof.y + 0.08, f.tail.x + 0.1, f.nose.y1 - 0.1, 'grey', { flat: true }),
      // two SWAT officers riding on the roof with their rifles (as in Drive Ahead's Swat Van):
      // drawn like the player, in grey tactical helmets with a visor band
      ...[f.tail.x + 0.35, f.tail.x + 0.85].flatMap((x) => [
        ...crew(x, f.roof.y - 0.5, 0.24, { helm: 'grey', suit: 'black', style: 'swat' }),
        rect(x - 0.16, f.roof.y - 0.24, x + 0.14, f.roof.y - 0.17, 'white', { flat: true }),
        rr(x + 0.05, f.roof.y - 0.2, x + 0.5, f.roof.y - 0.13, 0.02, 'black'), rect(x + 0.18, f.roof.y - 0.14, x + 0.24, f.roof.y - 0.05, 'black'),
      ]),
    ],
  }],
  ['dune-buggy', 'Dune Buggy', 'Легкий багі для дюн із прапорцем на щоглі.', 'buggy', ['#ff8a1a', '#2a2a2a'], {
    axles: [1.12, 0.9],
    skin: (f) => [
      blob([[f.tail.x, 0.2], [f.tail.x + 0.1, -0.12], [-0.4, -0.12], [0.6, -0.16], [f.nose.x + 0.05, 0.02], [f.nose.x - 0.1, 0.22]], 'body', {}, 1),
      ...path([[-0.85, -0.1], [-0.65, -0.95], [0.25, -0.95]], 0.09, 'accent'), seg([0.62, -0.12], [0.48, -0.42], 0.09, 'accent'), seg([-0.65, -0.95], [-0.2, -0.1], 0.07, 'accent'),
      ...seat(f.head.x + 0.05, -0.12, 0.42),
      rr(f.tail.x - 0.1, -0.35, f.tail.x + 0.35, -0.05, 0.06, 'grey'), ...stack(f.tail.x + 0.05, -0.3, 0.25, 0.07),
      ...path([[f.tail.x + 0.2, -0.08], [f.tail.x + 0.1, -1.4]], 0.04, 'chrome'), poly([[f.tail.x + 0.1, -1.4], [f.tail.x + 0.1, -1.18], [f.tail.x + 0.45, -1.3]], 'red'),
      ...fenders(f, 'body', 0.1),
      ...frontLamp(f.nose.x + 0.02, -0.06, 0.1), circ(0.0, 0.05, 0.1, 'white'), rect(-0.03, -0.02, 0.03, 0.12, 'black', { flat: true }),
      ...[-0.45, -0.15].map((x) => circ(x, -1.02, 0.06, 'light')),
    ],
  }],
  ['taxi', 'Taxi', 'Жовте міське таксі з шашечками.', 'sedan', ['#ffd020', '#1a1a1a'], {
    axles: [0.8, 0.8],
    parts: ['sign'], hideParts: true,
    skin: (f) => [
      ...sedan(f),
      ...checkers(f.tail.x + 0.1, -0.02, f.nose.x - 0.1, 0.1, 16),
      rr(-0.45, f.roof.y - 0.2, 0.05, f.roof.y, 0.04, 'white'), rect(-0.4, f.roof.y - 0.15, 0.0, f.roof.y - 0.05, 'black', { flat: true }),
      rr(0.3, -0.12, 0.6, 0.0, 0.03, 'white'), rect(0.35, -0.09, 0.55, -0.05, 'black', { flat: true }),
    ],
  }],
  ['asphalt-paver', 'Asphalt Paver', 'Асфальтоукладач: важкий, низький, гарячий.', 'box', ['#f0a020', '#2a2a2a'], {
    o: o({ tall: 0.8 }), parts: ['stack', 'plow'], hideParts: true,
    skin: (f) => [
      rr(f.tail.x - 0.45, -0.05, f.tail.x + 0.1, 0.3, 0.04, 'black'), rr(f.tail.x - 0.5, 0.18, f.tail.x + 0.1, 0.32, 0.03, 'grey'),
      rr(f.tail.x, -0.35, f.nose.x - 0.1, 0.25, 0.08, 'body'),
      rr(-0.6, f.roof.y - 0.1, 0.4, -0.35, 0.06, 'dark'), ...seat(-0.1, -0.35, 0.4),
      ...path([[-0.65, -0.35], [-0.6, f.roof.y - 0.25], [0.5, f.roof.y - 0.25], [0.45, -0.35]], 0.07, 'dark'),
      rr(-0.75, f.roof.y - 0.33, 0.6, f.roof.y - 0.22, 0.04, 'accent'),
      ...stack(f.nose.x - 0.5, -0.35, 0.55, 0.1, 'black'),
      poly([[f.nose.x - 0.1, -0.3], [f.nose.x + 0.55, -0.4], [f.nose.x + 0.55, 0.15], [f.nose.x - 0.1, 0.25]], 'grey'), rect(f.nose.x, -0.2, f.nose.x + 0.45, 0.0, 'black', { flat: true }),
      ...[0, 1, 2, 3, 4].map((i) => poly([[f.tail.x + 0.1 + i * 0.5, 0.2], [f.tail.x + 0.3 + i * 0.5, 0.2], [f.tail.x + 0.45 + i * 0.5, 0.0], [f.tail.x + 0.25 + i * 0.5, 0.0]], 'black', { flat: true })),
      ...beacon(0.3, f.roof.y - 0.33, 'orange', 0.14), ...[f.tail.x - 0.4, f.tail.x - 0.2].map((x) => ell(x, -0.15, 0.08, 0.12, 'white', { flat: true })),
    ],
  }],
  ['bulldozer', 'Bulldozer', 'Бульдозер із масивним відвалом.', 'tracked', ['#f0b020', '#2a2a2a'], {
    o: o({ cab: true }), parts: ['blade'], hideParts: true,
    skin: (f) => [
      ...tracks(f),
      blob([[-1.6, 0.0], [-1.55, -0.45], [0.6, -0.5], [1.4, -0.3], [1.5, 0.0]], 'body', {}, 1),
      ...[0.7, 0.9, 1.1].map((x) => rect(x, -0.42, x + 0.06, -0.1, 'dark', { flat: true })),
      rr(f.roof.x0 - 0.45, f.roof.y, f.roof.x1 + 0.4, -0.45, 0.06, 'body'), rect(f.roof.x0 - 0.36, f.roof.y + 0.12, f.roof.x0 - 0.06, -0.6, 'glass'), rr(f.roof.x0 - 0.5, f.roof.y - 0.1, f.roof.x1 + 0.05, f.roof.y + 0.02, 0.04, 'dark'),
      ...stack(0.4, -0.45, 0.45, 0.09, 'black'),
      // The blade as a real dozer's: a curved moldboard (its face hollow towards the front) with a
      // steel cutting edge, pushed by an arm from the track frame and tilted by a hydraulic ram.
      ...(() => {
        const n = f.nose.x, cx = n + 1.15, cy = -0.45, r = 0.8, back: [number, number] = [cx - r, cy];
        return [
          // push arm along the track to the bottom of the blade, pinned at both ends
          ...path([[-0.1, 0.06], [back[0] + 0.08, 0.1]], 0.15, 'body'), circ(-0.1, 0.06, 0.07, 'dark'), circ(back[0] + 0.06, 0.1, 0.07, 'dark'),
          // hydraulic ram from the hull to the top of the blade: dark barrel, chrome rod
          seg([0.95, -0.5], [1.6, -0.66], 0.14, 'dark'), seg([1.6, -0.66], [back[0] + 0.12, -0.8], 0.07, 'chrome'),
          // ribs on the back of the moldboard
          ...[-0.85, -0.45, -0.05].map((y) => seg([back[0] + 0.02, y], [back[0] + 0.18, y], 0.07, 'dark')),
          // the moldboard: a thick curved plate, its hollow face catching the light
          arc(cx, cy, r, Math.PI - 0.88, Math.PI + 0.88, 0.27, 'body'),
          arc(cx, cy, r - 0.08, Math.PI - 0.7, Math.PI + 0.7, 0.05, 'yellow', { flat: true }),
          // top lip and the cutting edge at the bottom
          seg([cx - r * Math.cos(0.88) - 0.04, cy - r * Math.sin(0.88) + 0.02], [cx - r * Math.cos(0.88) + 0.12, cy - r * Math.sin(0.88) + 0.06], 0.09, 'body'),
          seg([cx - r * Math.cos(0.88) - 0.06, cy + r * Math.sin(0.88) - 0.02], [cx - r * Math.cos(0.88) + 0.14, cy + r * Math.sin(0.88) + 0.05], 0.1, 'chrome'),
        ];
      })(),
      ...beacon(f.roof.x0 - 0.1, f.roof.y - 0.1, 'orange', 0.14), stripe(-1.55, 0.6, -0.2, 0.06, 'black'),
    ],
  }],
  ['locomotive', 'Locomotive', 'Паровоз із тендером вугілля: вугілля сиплеться на ходу.', 'loco', ['#2a2a2a', '#e02a2a'], {
    axles: [1.12, 1.12, 0.72],
    cargo: ['coal', 5],
    // coal smoke rolling out of the chimney (animated)
    fx: (f) => [{ kind: 'smoke', at: [f.nose.x - 0.72, -1.3], dir: -115, size: 0.28 }],
    skin: (f) => [...loco(f, { mat: 'accent', boiler: 'black', trim: 'gold' })],
  }],
  ['turtle', 'Turtle', 'Черепаха. Ховається в панцир: не їде, але її не зрушити й не вибити.', 'creature', ['#5a9a4a', '#a07a3a'], {
    s: 0.9, o: o({ neck: 'raptor', tall: 1.2, wheel: 0.8 }), parts: ['hump'], noLights: true, hideParts: true,
    skin: (f) => {
      const { rear, front } = dims(f);
      return [
        // stubby legs onto the wheels, little tail
        ...[rear, front].map((x) => blob([[x - 0.2, -0.2], [x + 0.2, -0.2], [x + 0.17, 0.3], [x - 0.17, 0.3]], 'body', { ring: true }, 1)),
        poly([[-1.05, -0.15], [-1.4, -0.05], [-1.05, 0.0]], 'body'),
        // neck and head poking out, a friendly face
        ...path([[0.7, -0.35], [1.15, -0.55]], 0.3, 'body'),
        blob([[1.0, -0.82], [1.4, -0.88], [1.72, -0.68], [1.68, -0.45], [1.1, -0.42]], 'body', {}, 1),
        ...eyeball(1.38, -0.7, 0.07), arc(1.5, -0.6, 0.12, Math.PI * 0.15, Math.PI * 0.75, 0.03, 'dark'),
        // high domed shell: hexagon scutes, rim band, belly plate
        blob([[-1.2, 0.0], [-1.1, -0.6], [-0.5, -1.05], [0.5, -1.05], [1.05, -0.6], [1.15, 0.0]], 'accent', {}, 2),
        ...[[-0.55, -0.7], [0.0, -0.82], [0.55, -0.7], [-0.75, -0.3], [-0.25, -0.38], [0.3, -0.38], [0.78, -0.3]].map(([x, y]) => poly([[x - 0.18, y], [x - 0.09, y - 0.15], [x + 0.09, y - 0.15], [x + 0.18, y], [x + 0.09, y + 0.15], [x - 0.09, y + 0.15]], 'brown')),
        rr(-1.22, -0.1, 1.18, 0.05, 0.05, 'yellow'), ...[-0.8, -0.3, 0.2, 0.7].map((x) => rect(x, -0.1, x + 0.05, 0.05, 'brown', { flat: true })),
        ...saddle(f.head.x, f.head.y + 0.2, 'red'),
      ];
    },
  }],
  ['gyrocar', 'Gyrocar', 'Самобалансуючий гіромобіль із маховиком усередині.', 'blob', ['#e0e0e0', '#3a6ad8'], {
    s: 0.9, o: o({ shape: 'egg' }),
    skin: () => [
      blob([[-0.75, 0.2], [-0.95, -0.35], [-0.6, -1.05], [0.0, -1.3], [0.6, -1.05], [0.95, -0.35], [0.75, 0.2]], 'body', {}, 2),
      circ(-0.1, -0.35, 0.36, 'accent'), circ(-0.1, -0.35, 0.26, 'chrome'), circ(-0.1, -0.35, 0.1, 'accent'),
      ...[0, 1, 2, 3].map((i) => seg([-0.1, -0.35], [-0.1 + Math.cos(i * 0.8) * 0.26, -0.35 + Math.sin(i * 0.8) * 0.26], 0.04, 'dark')),
      blob([[0.2, -1.0], [0.7, -0.75], [0.75, -0.55], [0.3, -0.7]], 'glass', {}, 1),
      circ(0.82, -0.3, 0.07, 'light'), stripe(-0.9, 0.9, 0.0, 0.06, 'accent'), rr(-0.8, 0.12, 0.8, 0.28, 0.05, 'dark'),
    ],
  }],
  ['personal-transporter', 'Personal Transporter', 'Сегвей: платформа, стійка й кермо.', 'cart', ['#2a2a2a', '#5ef0ff'], {
    s: 0.8, o: o({ tall: 0.5 }), noLights: true,
    skin: (f) => [
      rr(f.tail.x, f.deck.y, f.nose.x, f.deck.y + 0.18, 0.06, 'body'), stripe(f.tail.x + 0.1, f.nose.x - 0.1, f.deck.y + 0.12, 0.04, 'accent'),
      ...path([[0.45, f.deck.y], [0.62, f.deck.y - 0.95]], 0.09, 'grey'), rr(0.45, f.deck.y - 1.02, 0.9, f.deck.y - 0.92, 0.04, 'black'),
      ...f.wheels.map((w) => arc(w.x, w.y, w.r + 0.08, Math.PI * 1.1, Math.PI * 1.9, 0.12, 'accent')),
      ...[0.45, 0.9].map((x) => circ(x, f.deck.y - 0.97, 0.05, 'accent')), circ(f.nose.x - 0.05, f.deck.y + 0.08, 0.05, 'light'),
    ],
  }],
]);

