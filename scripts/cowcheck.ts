import { Game } from '../src/game/game';
import { CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
import { Vec2 } from 'planck';
// Usage: npx tsx scripts/cowcheck.ts — throw a cow / crate / log at the foe's head from several speeds and angles.
for (const [kind, speed] of [['cow', 9], ['cow', 14], ['cow', 20], ['crate', 12], ['log', 12]] as const) {
  let hits = 0;
  for (const dy of [-0.6, -0.3, 0, 0.3]) {
    const g = new Game({ cars: [CAR_BY_ID['sparrow'], CAR_BY_ID['sparrow']], maps: [MAP_BY_ID.meadow], randomMaps: false, target: 3, roundTime: 99, seed: 5 });
    while (g.phase !== 'play') g.step();
    for (let i = 0; i < 60; i++) g.step();
    const foe = g.cars[1], h = foe.headWorld();
    const it = g.spawnItem(kind as never, 0, new Vec2(h.x - 4, h.y + dy - 0.8), new Vec2(speed, -3), 9);
    for (let i = 0; i < 90 && foe.alive; i++) g.step();
    if (!foe.alive) hits++;
    void it;
  }
  console.log(kind, 'speed', speed, 'kills', hits, '/ 4');
}
