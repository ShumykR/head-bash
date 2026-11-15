import { Game } from '../src/game/game';
import { CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
// Usage: npx tsx scripts/swimcheck.ts — drive each car off the beach island into the sea and see whether it stays afloat.
const map = MAP_BY_ID.beach;
const ids = (process.env.CARS ?? 'rowboat,yacht,speedboat,lucky-shark,chomp-shark,piranha-racer,abyss-eel,blast-fish,jelly-shock,cosmic-squid,turtle,steel-crab,penguin-slider,woodie-surfer,hovercar,amphibian,sparrow,monster-truck').split(',');
for (const id of ids) {
  const g = new Game({ cars: [CAR_BY_ID[id], CAR_BY_ID['monster-truck']], maps: [map], randomMaps: false, target: 3, roundTime: 99, seed: 5 });
  let cause = '';
  g.on((e) => { if (e.type === 'death' && e.player === 0) cause = e.cause; });
  while (g.phase !== 'play') g.step();
  const c = g.cars[0];
  let inWater = 0, maxY = 0;
  for (let i = 0; i < 900 && c.alive; i++) {
    g.inputs[0] = c.position.x > 3 ? -1 : 0;
    g.inputs[1] = 0;
    g.step();
    if (c.position.y > 17.5 && c.position.x < 5) { inWater++; maxY = Math.max(maxY, c.position.y); }
  }
  console.log(id.padEnd(15), 'alive', String(c.alive).padEnd(5), 'steps in water', String(inWater).padEnd(4), 'deepest', maxY.toFixed(2), cause);
}
