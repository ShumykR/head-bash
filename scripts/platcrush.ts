import { Game } from '../src/game/game';
import { CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';

// Drive cars into the mine-shaft gap beside the shuttle platform and report the worst wheel-joint stretch
// (how far a wheel sits off its suspension axis) and how long a wheel stayed torn off (> 0.3 m).
// Usage: npx tsx scripts/platcrush.ts [car,car…]  (MAP=mineshaft)
const ids = (process.argv[2] ?? 'classic-monster,minibus,rickshaw,snowmobile,shopping-cart').split(',');
const map = MAP_BY_ID[process.env.MAP ?? 'mineshaft'];
for (const id of ids) {
  let worst = 0, worstAt = '', torn = 0, tornAt = '';
  for (const side of [0, 1]) for (const delay of [0, 30, 60, 90]) {
    const g = new Game({ cars: [CAR_BY_ID[id], CAR_BY_ID[id]], maps: [map], randomMaps: false, target: 99, roundTime: 60, seed: 3 + delay });
    const p = side, c = g.cars[p];
    const run = c.joints.map(() => 0);
    for (let i = 0; i < 60 * 12; i++) {
      g.inputs[p] = i < 180 + delay ? 0 : (p === 0 ? 1 : -1) * (Math.floor(i / 50) % 3 === 2 ? -1 : 1);
      g.inputs[1 - p] = 0;
      g.step();
      if (!c.alive) break;
      c.joints.forEach((j, k) => {
        const a = j.getAnchorA(), b = j.getAnchorB();
        const ax = j.getLocalAxisA ? c.chassis.getWorldVector(j.getLocalAxisA()) : null;
        const dx = b.x - a.x, dy = b.y - a.y;
        // perpendicular error (off the suspension axis) is what a broken joint looks like
        const perp = ax ? Math.abs(dx * ax.y - dy * ax.x) : Math.hypot(dx, dy);
        run[k] = perp > 0.3 ? run[k] + 1 : 0;
        if (run[k] > torn) { torn = run[k]; tornAt = `side${side} d${delay} step${i}`; }
        if (perp > worst) { worst = perp; worstAt = `side${side} d${delay} step${i} x${c.position.x.toFixed(1)}`; }
      });
    }
  }
  console.log(id.padEnd(18), 'worst joint error', worst.toFixed(3), 'm', worstAt, '| longest torn', (torn / 60).toFixed(2), 's', tornAt);
}
