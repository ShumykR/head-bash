// Every car against a panel of reference cars, both sides, hard bots: a rough win rate per car.
//   SHARD=0 SHARDS=4 R=4 npx tsx scripts/gauntlet.ts > out0.tsv   (ONLY=id,id to pick cars)
import { Game } from '../src/game/game';
import { CARS, CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
import { Bot } from '../src/ai/bot';
const R = Number(process.env.R ?? 4);
const shard = Number(process.env.SHARD ?? 0), shards = Number(process.env.SHARDS ?? 1);
const panel = (process.env.PANEL ?? 'sparrow,bulldog,zipper,american-car').split(',').map((id) => CAR_BY_ID[id]);
const maps = (process.env.MAPS ?? 'meadow,sky,sawmill').split(',').map((m) => MAP_BY_ID[m]);
const only = process.env.ONLY?.split(',');
const cars = CARS.filter((c, i) => (only ? only.includes(c.id) : i % shards === shard));
let seed = 1;
for (const car of cars) {
  let w = 0, l = 0, d = 0;
  for (const foe of panel) for (const side of [0, 1]) {
    const pair = side === 0 ? [car, foe] : [foe, car];
    const g = new Game({ cars: pair, maps, randomMaps: true, target: 999, roundTime: 40, seed: seed++ });
    g.controllers[0] = new Bot('hard', seed * 3);
    g.controllers[1] = new Bot('hard', seed * 7);
    g.on((e) => {
      if (e.type !== 'roundEnd') return;
      if (e.result === 'draw') d++;
      else if (e.result === side) w++;
      else l++;
    });
    let k = 0;
    while (g.match.round <= R && k++ < 60 * 60 * 6) g.step();
  }
  console.log(`${car.id}\t${car.archetype}\t${car.ability ? (car.ability.projectile ?? car.ability.item ?? car.ability.kind) : '-'}\t${w}\t${l}\t${d}\t${Math.round((100 * w) / Math.max(1, w + l))}`);
}
