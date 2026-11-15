import { Game } from '../src/game/game';
import { CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
// Usage: npx tsx scripts/platspawn.ts — spawn height on moon with the moving platforms at every phase of their path.
const g = new Game({ cars: [CAR_BY_ID.snowman, CAR_BY_ID.hovercar], maps: [MAP_BY_ID.moon], randomMaps: false, target: 3, roundTime: 60, seed: 5 });
const ys = new Set<string>();
for (let i = 0; i < 900; i++) {
  g.step();
  if (i % 20 === 0) for (const p of [0, 1]) ys.add(`${p}:${g.spawnPoint(p, g.roundCars[p])[1].toFixed(2)}`);
}
console.log([...ys].sort().join(' '));
