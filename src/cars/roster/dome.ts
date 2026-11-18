import { blob, circ, ell, fender, flameDecal, path, poly, rect, rr, seg, spikesAlong, starShape, stripe, truss, windows, shoulders } from '../draw';
import { arc, bike, boxy, frontLamp, rearLamp, truckCab } from '../skins';
import { crew, fishCar } from '../critters';
import { group, o } from './util';

export const DOME = group('dome', [
  ['rickshaw', 'Rickshaw', 'Триколісна рикша з парасолькою над пасажиром.', 'trike', ['#e0b020', '#2a6a3a'], {
    parts: ['umbrella'], hideParts: true,
    skin: (f) => [
      ...bike(f, { style: 'scooter' }),
      ...shoulders(f.head),
      blob([[-1.45, 0.15], [-1.5, -0.45], [-1.2, -0.55], [-0.6, -0.45], [-0.55, 0.15]], 'accent', {}, 1),
      rr(-1.4, -0.4, -0.7, -0.25, 0.05, 'red'),
      ...path([[-1.45, -0.45], [-1.4, -1.0]], 0.05, 'chrome'), ...path([[-0.6, -0.45], [-0.65, -1.0]], 0.05, 'chrome'),
      blob([[-1.65, -0.95], [-1.0, -1.3], [-0.4, -0.95]], 'accent', {}, 1), ...[-1.45, -1.2, -0.95, -0.7].map((x) => poly([[x - 0.08, -0.97], [x + 0.08, -0.97], [x, -0.86]], 'yellow')),
      rect(-1.45, -0.12, -0.6, -0.06, 'gold', { flat: true }), starShape(-1.0, 0.02, 0.09, 'gold'), circ(-1.0, -1.32, 0.05, 'gold'),
      // the passenger in the back, under the umbrella (Drive Ahead's rickshaw carries a second person)
      // drawn like the player, the helmet in the rickshaw's red with a gold crown stripe
      ...crew(-1.02, -0.68, 0.24, { helm: 'red', stripe: 'gold', suit: 'blue' }),
    ],
  }],
  ['quad-bike', 'Quad Bike', 'Маневрений квадроцикл із багажником.', 'buggy', ['#e02a2a', '#2a2a2a'], {
    s: 0.85, o: o({ wheel: 1.1, open: true }),
    // Backrest and handlebar post are solid: they keep the quad off its back.
    art: () => [{ ...rect(-0.78, -0.82, -0.66, -0.25, 'black'), deco: false }, { ...rect(0.3, -0.7, 0.4, -0.25, 'chrome'), deco: false }],
    skin: (f) => [
      rr(f.tail.x - 0.05, -0.32, -0.6, -0.22, 0.03, 'black'), rr(0.6, -0.32, f.nose.x + 0.05, -0.22, 0.03, 'black'),
      ...f.wheels.map((w) => blob([[w.x - w.r - 0.1, -0.05], [w.x - w.r, -0.25], [w.x + w.r, -0.25], [w.x + w.r + 0.1, -0.05]], 'body', {}, 1)),
      blob([[-0.8, 0.15], [-0.75, -0.15], [-0.2, -0.32], [0.4, -0.3], [0.7, 0.15]], 'body', {}, 1),
      rr(-0.6, -0.28, -0.05, -0.16, 0.05, 'black'), rr(-0.2, 0.0, 0.3, 0.25, 0.05, 'grey'),
      seg([0.3, -0.3], [0.4, -0.55], 0.06, 'chrome'), seg([0.42, -0.55], [0.2, -0.58], 0.07, 'black'),
      ...[-1.0, -0.85, -0.7].map((x) => rect(x, -0.38, x + 0.04, -0.32, 'black')),
      ...f.wheels.map((w) => arc(w.x, w.y, w.r + 0.08, Math.PI * 1.05, Math.PI * 1.95, 0.1, 'body')),
      ...path([[f.nose.x - 0.1, -0.25], [f.nose.x + 0.1, -0.35], [f.nose.x + 0.15, -0.1]], 0.05, 'black'), circ(f.nose.x + 0.02, -0.18, 0.06, 'light'),
      ell(-0.35, -0.05, 0.12, 0.09, 'white'), rect(-0.38, -0.11, -0.32, 0.01, 'black', { flat: true }),
      // luggage racks front and back: tubular rails with a strapped box behind and a bag up front
      rr(f.tail.x - 0.05, -0.42, -0.6, -0.36, 0.02, 'black'), ...[f.tail.x + 0.05, -0.7].map((x) => rect(x, -0.42, x + 0.05, -0.25, 'black')),
      rr(f.tail.x + 0.0, -0.78, -0.65, -0.42, 0.05, 'tan'), rect(f.tail.x + 0.0, -0.64, -0.65, -0.58, 'brown', { flat: true }),
      rr(0.55, -0.42, f.nose.x + 0.05, -0.36, 0.02, 'black'), rr(0.6, -0.62, f.nose.x - 0.05, -0.42, 0.06, 'green'),
      ...shoulders(f.head, { depth: 0.34 }),
    ],
  }],
  ['compensator-bike', 'Compensator Bike', 'Надмірно довгий чопер: вилка до неба.', 'bike', ['#c0c0c8', '#e02a2a'], {
    // Our description: a chopper with a fork up to the sky. Drive Ahead: half bike, half monster truck,
    // a monster wheel up front, a normal one behind and two big exhaust stacks over the rear wheel.
    o: o({ len: 1.4 }), axles: [0.9, 1.5],
    // the rider sits a little forward, gloves on bars clamped halfway up the sky-high fork
    head: (f) => [f.head.x + 0.2, f.head.y - 0.36],
    rider: (f) => ({ pose: 'ride', front: true, hand: [f.head.x + 0.42, f.head.y + 0.4], foot: [f.head.x + 0.1, 0.06] }),
    skin: (f) => {
      const rw = f.wheels[0], fw = f.wheels[1], hx = f.head.x - 0.2;
      const top: [number, number] = [fw.x - 0.75, -1.45], grip: [number, number] = [f.head.x + 0.42, f.head.y + 0.4];
      // where the bars clamp on the fork: a little above the grips
      const ct = (grip[1] - 0.22 - fw.y) / (top[1] - fw.y), clamp: [number, number] = [fw.x + (top[0] - fw.x) * ct, grip[1] - 0.22];
      return [
        // two tall exhaust stacks rising over the rear wheel
        ...[0, 0.16].flatMap((d) => [...path([[hx + 0.15, 0.2], [rw.x + 0.25 - d, 0.05], [rw.x + 0.05 - d, -0.95 - d]], 0.1, 'chrome'), rr(rw.x - 0.05 - d, -1.08 - d, rw.x + 0.15 - d, -0.95 - d, 0.03, 'dark')]),
        // frame, seat, engine and tank
        seg([rw.x, rw.y], [hx + 0.25, 0.15], 0.11, 'dark'), seg([hx - 0.2, -0.3], [top[0], top[1] + 0.35], 0.1, 'dark'),
        rr(hx - 0.5, -0.4, hx + 0.1, -0.26, 0.06, 'black'),
        rr(hx + 0.0, -0.05, hx + 0.65, 0.3, 0.07, 'grey'), ...[0, 1, 2].map((i) => rect(hx + 0.05, 0.0 + i * 0.09, hx + 0.6, 0.03 + i * 0.09, 'dark', { flat: true })),
        blob([[hx + 0.05, -0.3], [hx + 0.2, -0.6], [top[0] + 0.1, -0.7], [top[0] + 0.2, -0.45], [hx + 0.6, -0.12]], 'body', {}, 1),
        ...flameDecal(hx + 0.2, top[0], -0.42, 0.1),
        fender(rw.x, rw.y, rw.r, 0.1, 'body'),
        // the monster fork: twin chrome legs from the huge front hub right up into the sky
        seg([fw.x, fw.y], top, 0.12, 'chrome'), seg([fw.x + 0.1, fw.y], [top[0] + 0.1, top[1]], 0.07, 'grey'),
        fender(fw.x, fw.y, fw.r, 0.12, 'accent'),
        ...path([clamp, [clamp[0] - 0.12, clamp[1] - 0.12], [grip[0] + 0.12, grip[1] - 0.08], grip], 0.07, 'chrome'),
        seg([grip[0] + 0.08, grip[1] - 0.02], [grip[0] - 0.04, grip[1] + 0.02], 0.08, 'black'),
        rr(top[0] - 0.1, top[1] - 0.06, top[0] + 0.14, top[1] + 0.04, 0.03, 'chrome'),
        circ(top[0] + 0.05, top[1] + 0.3, 0.1, 'chrome'), circ(top[0] + 0.07, top[1] + 0.3, 0.06, 'light'),
        rearLamp(rw.x - 0.36, -0.1, 0.1),
      ];
    },
  }],
  ['lucky-shark', 'Lucky Shark Mobile', 'Машина-акула з плавником і зубатою пащею.', 'sports', ['#6a8ab0', '#ffffff'], {
    parts: ['fin'], noLights: true, hideParts: true,
    skin: (f) => [
      ...fishCar(f, { top: -0.68 }),
      // lucky charms: a four-leaf clover on the flank and a horseshoe on the fin
      ...[[0, -0.08], [0.08, 0], [0, 0.08], [-0.08, 0]].map(([dx, dy]) => circ(0.35 + dx, -0.28 + dy, 0.07, 'green')), seg([0.35, -0.28], [0.3, -0.12], 0.04, 'green'),
      arc(f.head.x - 0.5, -0.82, 0.1, Math.PI * 1.0, Math.PI * 2.0, 0.05, 'gold'),
      stripe(f.tail.x + 0.3, f.nose.x - 0.9, -0.1, 0.05, 'accent'),
      ...shoulders(f.head),
    ],
  }],
  ['prison-van', 'Prison Van', 'Броньований автозак із ґратами на вікнах і тараном.', 'van', ['#e0e0e0', '#3a3a6a'], {
    parts: ['ram'], hideParts: true,
    // As in Drive Ahead: a "criminal" in a striped suit is dragged behind the van on a chain. He is a loose,
    // swinging piece with a body of his own, so he can clobber whoever is tailgating.
    links: (f) => {
      const x = f.tail.x, g = f.wheels[0].y + f.wheels[0].r;
      return [{
        at: [x - 0.02, 0.05], swing: [-75, 55], spring: 2, density: 0.3,
        hit: [rect(x - 1.45, g - 0.3, x - 0.7, g - 0.04)],
        art: [
          ...Array.from({ length: 5 }, (_, i) => ell(x - 0.12 - i * 0.13, 0.05 + i * ((g - 0.22 - 0.05) / 5), 0.07, 0.04, 'grey')),
          // lying on his back, feet first: striped suit, cuffs
          rr(x - 1.25, g - 0.28, x - 0.72, g - 0.06, 0.08, 'white'),
          ...[0, 1, 2, 3].map((i) => rect(x - 1.18 + i * 0.13, g - 0.28, x - 1.12 + i * 0.13, g - 0.06, 'black', { flat: true })),
          rr(x - 0.78, g - 0.24, x - 0.62, g - 0.1, 0.04, 'black'),
          // his helmet like the player's, in prison stripes, visor up to the sky
          ...crew(x - 1.38, g - 0.19, 0.17, { helm: 'white', style: 'stripes', body: false, rot: -Math.PI / 2 }),
        ],
      }];
    },
    skin: (f) => [
      ...boxy(f, { round: 0.06, bumper: 'grey' }),
      ...windows(f.tail.x + 0.2, f.tail.x + 1.3, f.roof.y + 0.12, f.roof.y + 0.48, 2, 0.15, 'dark'),
      ...[0, 1, 2, 3, 4, 5].map((i) => rect(f.tail.x + 0.27 + i * 0.19, f.roof.y + 0.12, f.tail.x + 0.31 + i * 0.19, f.roof.y + 0.48, 'chrome', { flat: true })),
      stripe(f.tail.x, f.nose.x, -0.02, 0.12, 'accent'),
      rect(f.nose.x - 0.12, f.nose.y0 + 0.1, f.nose.x + 0.25, f.nose.y1 - 0.05, 'grey'),
      ...[0, 1, 2].map((i) => rect(f.nose.x + 0.05, f.nose.y0 + 0.15 + i * 0.15, f.nose.x + 0.25, f.nose.y0 + 0.2 + i * 0.15, 'dark', { flat: true })),
      ...[f.roof.x1 - 0.5, f.roof.x1 - 0.3].map((x, i) => rr(x, f.roof.y - 0.14, x + 0.18, f.roof.y, 0.04, i ? 'blue' : 'red')),
      rect(f.tail.x + 0.06, f.roof.y + 0.08, f.tail.x + 0.1, f.nose.y1 - 0.1, 'grey', { flat: true }), circ(-0.3, -0.2, 0.12, 'gold'), starShape(-0.3, -0.2, 0.08, 'accent'),
      ...[-1.2, -0.8, -0.4, 0.0, 0.4].map((x) => circ(x, f.roof.y + 0.05, 0.025, 'grey')),
      ...shoulders(f.head),
    ],
  }],
  ['hovercraft', 'Hovercraft', 'Судно на повітряній подушці з великим гвинтом. Ширяє над землею.', 'boat', ['#e0c020', '#2a2a2a'], {
    drive: 'hover',
    parts: ['propeller'], float: 0.85, hideParts: true, hideWheels: [0, 1],
    // No visible wheels: the physics wheels hide inside an inflated rubber skirt down to the ground.
    skin: (f) => [
      blob([[f.tail.x - 0.05, 0.02], [f.nose.x + 0.15, -0.02], [f.nose.x + 0.1, f.wheels[0].y + f.wheels[0].r - 0.15], [f.nose.x - 0.25, f.wheels[0].y + f.wheels[0].r], [f.tail.x + 0.2, f.wheels[0].y + f.wheels[0].r], [f.tail.x - 0.05, f.wheels[0].y + f.wheels[0].r - 0.15]], 'black', {}, 2),
      ...[0, 1, 2, 3, 4, 5, 6].map((i) => rect(f.tail.x + 0.15 + i * ((f.nose.x - f.tail.x - 0.2) / 7), f.wheels[0].y + f.wheels[0].r - 0.12, f.tail.x + 0.19 + i * ((f.nose.x - f.tail.x - 0.2) / 7), f.wheels[0].y + f.wheels[0].r - 0.02, 'dark', { flat: true })),
      blob([[f.tail.x + 0.1, 0.05], [f.tail.x + 0.1, -0.42], [f.nose.x - 0.3, -0.5], [f.nose.x + 0.05, -0.2], [f.nose.x, 0.05]], 'body', {}, 1),
      ...shoulders(f.head),
      rr(-0.2, -0.88, 0.75, -0.42, 0.08, 'white'), ...windows(-0.1, 0.65, -0.8, -0.55, 2, 0.08),
      stripe(f.tail.x + 0.1, f.nose.x, -0.2, 0.07, 'accent'),
      ...[0, 1, 2, 3, 4, 5].map((i) => rect(f.tail.x + 0.2 + i * ((f.nose.x - f.tail.x - 0.4) / 6), 0.08, f.tail.x + 0.23 + i * ((f.nose.x - f.tail.x - 0.4) / 6), 0.3, 'dark', { flat: true })),
      circ(f.tail.x + 0.15, -0.65, 0.5, 'chrome'), circ(f.tail.x + 0.15, -0.65, 0.44, 'dark'), circ(f.tail.x + 0.15, -0.65, 0.36, 'grey'),
      poly([[f.tail.x + 0.55, -0.9], [f.tail.x + 0.75, -0.9], [f.tail.x + 0.7, -0.45], [f.tail.x + 0.55, -0.45]], 'accent'),
      seg([f.tail.x + 0.15, -1.0], [f.tail.x + 0.15, -0.3], 0.1, 'black'), circ(f.tail.x + 0.15, -0.65, 0.08, 'red'),
    ],
  }],
  ['saw-bike', 'Saw Bike', 'Мотоцикл із циркулярною пилкою замість переднього крила.', 'bike', ['#3a3a3a', '#ffd23f'], {
    parts: [['saw', 0.7]], wheelie: 1.0, air: 1.4,
    skin: (f) => [...bike(f, { style: 'sport' }), stripe(-0.7, 0.5, -0.12, 0.06, 'accent'), ...spikesAlong(-0.6, -0.1, -0.24, 3, 0.12, 'spike')],
  }],
  ['shopping-cart', 'Shopping Cart', 'Візок із супермаркету з мотором. Покупки сиплються на ходу.', 'cart', ['#c0c8d0', '#e02a2a'], {
    o: o({ mat: 'metal' }), cargo: ['melon', 3], noLights: true,
    skin: (f) => [
      poly([[f.tail.x, f.deck.y], [f.nose.x, f.deck.y], [f.nose.x - 0.18, 0.12], [f.tail.x + 0.18, 0.12]], 'grey', { flat: true }),
      ...[0, 1, 2, 3, 4, 5].map((i) => seg([f.tail.x + 0.08 + i * 0.3, f.deck.y], [f.tail.x + 0.2 + i * 0.27, 0.12], 0.05, 'chrome')),
      ...[0, 1, 2].map((i) => seg([f.tail.x + 0.05 + i * 0.06, f.deck.y + 0.2 + i * 0.22], [f.nose.x - 0.05 - i * 0.06, f.deck.y + 0.2 + i * 0.22], 0.05, 'chrome')),
      seg([f.tail.x, f.deck.y], [f.nose.x, f.deck.y], 0.07, 'chrome'),
      ...path([[f.tail.x, f.deck.y], [f.tail.x - 0.35, f.deck.y - 0.4]], 0.06, 'chrome'), rr(f.tail.x - 0.55, f.deck.y - 0.47, f.tail.x - 0.2, f.deck.y - 0.33, 0.05, 'accent'),
      rr(f.tail.x + 0.1, 0.12, f.nose.x - 0.1, 0.2, 0.03, 'chrome'),
      rr(f.nose.x - 0.2, f.deck.y - 0.08, f.nose.x + 0.06, f.deck.y + 0.25, 0.04, 'accent'), rr(f.tail.x - 0.06, f.deck.y - 0.08, f.tail.x + 0.18, f.deck.y + 0.12, 0.04, 'accent'),
      rr(-0.3, 0.14, 0.3, 0.34, 0.04, 'dark'), rect(-0.2, 0.2, 0.2, 0.24, 'grey', { flat: true }),
      ...shoulders(f.head),
    ],
  }],
  ['two-sider', 'Two Sider', 'Двостороння машина: шипи спереду, кабіна по центру.', 'box', ['#7a3ae0', '#ffd23f'], {
    o: o({ tall: 0.7 }), parts: ['spikes'],
    skin: (f) => [
      blob([[f.tail.x, 0.3], [f.tail.x, -0.2], [f.tail.x + 0.4, f.roof.y], [f.nose.x - 0.4, f.roof.y], [f.nose.x, -0.2], [f.nose.x, 0.3]], 'body', {}, 1),
      poly([[f.tail.x + 0.05, -0.55], [f.tail.x + 0.05, -0.25], [f.tail.x - 0.4, -0.4]], 'spike'),
      rr(-0.66, f.roof.y + 0.05, 0.66, f.roof.y + 0.43, 0.07, 'dark'), rr(-0.6, f.roof.y + 0.1, 0.6, f.roof.y + 0.38, 0.06, 'glass'), rect(-0.03, f.roof.y + 0.1, 0.03, f.roof.y + 0.38, 'dark'),
      ...frontLamp(f.nose.x, -0.15), rearLamp(f.tail.x, -0.15), rect(-0.05, -0.15, 0.05, 0.25, 'body', { ring: true }),
      stripe(f.tail.x, f.nose.x, 0.0, 0.08, 'accent'),
      ...[f.tail.x, f.nose.x - 0.15].map((x) => rr(x, 0.2, x + 0.15, 0.32, 0.03, 'chrome')),
      ...shoulders(f.head),
    ],
  }],
  ['monster-bus', 'Monster Bus', 'Шкільний автобус на колесах монстр-трака.', 'bus', ['#ffd020', '#1a1a1a'], {
    o: o({ wheel: 1.5, rim: 'monster' }), arch: 'monster',
    skin: (f) => [
      ...boxy(f, { slope: 0.15, slopeH: 0.5, round: 0.1, win: 5, winX: [f.tail.x + 0.15, f.nose.x - 0.4], winY: [f.roof.y + 0.12, f.roof.y + 0.45] }),
      stripe(f.tail.x, f.nose.x, -0.05, 0.07, 'accent'), stripe(f.tail.x, f.nose.x, 0.12, 0.07, 'accent'),
      rect(f.nose.x - 0.05, 0.05, f.nose.x + 0.15, 0.3, 'black'),
      rr(-0.4, f.roof.y + 0.55, 0.6, f.roof.y + 0.68, 0.03, 'black'),
      ...[f.tail.x + 0.2, f.nose.x - 0.6].map((x) => [circ(x, f.roof.y - 0.06, 0.06, 'red'), circ(x + 0.18, f.roof.y - 0.06, 0.06, 'orange')]).flat(),
      seg([f.nose.x - 1.0, -0.2], [f.nose.x - 1.2, -0.2], 0.03, 'grey'), poly([[f.nose.x - 1.42, -0.32], [f.nose.x - 1.28, -0.32], [f.nose.x - 1.2, -0.24], [f.nose.x - 1.2, -0.12], [f.nose.x - 1.28, -0.04], [f.nose.x - 1.42, -0.04], [f.nose.x - 1.5, -0.12], [f.nose.x - 1.5, -0.24]], 'red'),
      rect(f.nose.x - 0.95, f.roof.y + 0.1, f.nose.x - 0.55, 0.22, 'body', { ring: true }),
      ...shoulders(f.head),
    ],
  }],
  ['rock-wheel', 'Rock Wheel', 'Кам\'яна таратайка на важких кам\'яних колесах.', 'kart', ['#8a8070', '#c0b090'], {
    s: 1.1, o: o({ wheel: 1.5 }), mass: 1.2, noLights: true,
    skin: (f) => [
      blob([[f.tail.x - 0.2, -0.1], [f.tail.x - 0.1, -0.62], [-0.45, -0.7], [-0.4, -0.38], [0.15, -0.36], [0.3, -0.72], [f.nose.x + 0.05, -0.6], [f.nose.x + 0.25, -0.1], [0.0, 0.0]], 'tan', {}, 2),
      ...shoulders(f.head),
      ell(-0.75, -0.35, 0.2, 0.08, 'brown'), ell(0.6, -0.3, 0.16, 0.06, 'brown'), ...path([[0.45, -0.68], [0.55, -0.45], [0.48, -0.25]], 0.04, 'brown'),
      ...[[-0.75, -0.65, 0.18], [0.6, -0.68, 0.14]].map(([x, y, r]) => ell(x, y, r, r * 0.4, 'leaf')),
      rr(f.head.x - 0.35, -0.55, f.head.x - 0.1, -0.15, 0.06, 'grey'),
      rr(-0.3, -0.38, 0.3, -0.26, 0.05, 'wood'), ...path([[-0.2, 0.0], [-0.3, -0.25]], 0.1, 'wood'),
      ...[f.wheels[0], f.wheels[1]].map((w) => arc(w.x, w.y, w.r + 0.06, Math.PI * 1.1, Math.PI * 1.9, 0.08, 'wood')),
      // a stone slab seat lashed to a log axle, a club and a rock hood ornament: a proper stone-age cart
      rr(-0.95, -0.42, 0.95, -0.22, 0.08, 'grey'), ...[-0.6, 0.0, 0.55].map((x) => ell(x, -0.36, 0.1, 0.04, 'dark', { flat: true })),
      ...path([[f.wheels[0].x, f.wheels[0].y], [f.wheels[1].x, f.wheels[1].y]], 0.14, 'wood'),
      ...[f.wheels[0].x, f.wheels[1].x].map((x) => rr(x - 0.1, -0.3, x + 0.1, f.wheels[0].y - 0.05, 0.03, 'tan')),
      ...path([[0.45, -0.45], [0.85, -0.95]], 0.07, 'wood'), ell(0.9, -1.02, 0.12, 0.1, 'wood'),
    ],
  }],
  ['tow-truck', 'Tow Truck', 'Евакуатор із гаком на тросі: чіпляє суперника й тягне до себе.', 'truck', ['#f0a020', '#2a2a2a'], {
    o: o({ wheels: 2 }), parts: ['crane'], hideParts: true,
    // A real hook on a cable: it swings behind the truck and clouts whoever tailgates.
    flail: { from: [-2.05, -1.22], len: 0.75, r: 0.24, look: 'anchor' },
    skin: (f) => {
      const d = f.deck;
      return [
        ...truckCab(f),
        ...shoulders(f.head),
        ...[f.roof.x0 + 0.15, f.roof.x0 + 0.4].map((x, i) => rr(x, f.roof.y - 0.14, x + 0.22, f.roof.y, 0.04, i ? 'orange' : 'red')),
        rr(d.x0, d.y - 0.24, d.x1, d.y + 0.1, 0.04, 'body'), ...[0, 1, 2, 3].map((i) => poly([[d.x0 + 0.05 + i * 0.32, d.y + 0.06], [d.x0 + 0.2 + i * 0.32, d.y + 0.06], [d.x0 + 0.3 + i * 0.32, d.y - 0.2], [d.x0 + 0.15 + i * 0.32, d.y - 0.2]], 'black', { flat: true })),
        ...truss([d.x1 - 0.1, d.y - 0.1], [d.x0 - 0.1, d.y - 1.1], 0.24, 'yellow'),
        circ(d.x1 - 0.35, d.y - 0.42, 0.18, 'dark'), circ(d.x1 - 0.35, d.y - 0.42, 0.08, 'chrome'), seg([d.x1 - 0.35, d.y - 0.42], [d.x0 - 0.1, d.y - 1.1], 0.03, 'black'),
        stripe(f.tail.x, f.nose.x, 0.06, 0.07, 'accent'),
      ];
    },
  }],
]);

