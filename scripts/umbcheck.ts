import { Game } from '../src/game/game';
import { CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
// Usage: npx tsx scripts/umbcheck.ts — drive tall cars under the beach umbrella: the canopy must not bounce or block them.
for (const id of ['sparrow', 'monster-truck', 'fire-truck', 'ladder', 'mammoth']) {
  const g = new Game({ cars: [CAR_BY_ID[id], CAR_BY_ID.sparrow], maps: [MAP_BY_ID.beach], randomMaps: false, target: 3, roundTime: 99, seed: 5 });
  let pads = 0;
  g.on((e) => { if (e.type === 'pad') pads++; });
  while (g.phase !== 'play') g.step();
  let minY = 99;
  for (let i = 0; i < 420; i++) { g.inputs[0] = 1; g.inputs[1] = 0; g.step(); if (g.cars[0].position.x > 15 && g.cars[0].position.x < 18) minY = Math.min(minY, g.cars[0].position.y); }
  console.log(id.padEnd(14), 'x', g.cars[0].position.x.toFixed(1), 'pad bounces', pads, 'highest y near umbrella', minY.toFixed(1));
}
