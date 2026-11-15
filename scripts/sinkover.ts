import { Game } from '../src/game/game';
import { CARS } from '../src/cars/defs';
import { MAPS } from '../src/maps/defs';
import { pointInPoly } from '../src/render/grid';
// Usage: MAPS=toytrack STEPS=200 npx tsx scripts/sinkover.ts — worst wheel penetration into the terrain polygons during settling/driving.
const only = process.env.MAPS?.split(',');
const steps = +(process.env.STEPS ?? 200);
const segDist = (px: number, py: number, a: number[], b: number[]) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy);
};
for (const map of MAPS) {
  if (only && !only.includes(map.id)) continue;
  const res: [number, string][] = [];
  for (const car of CARS) {
    if (process.env.CARS && !process.env.CARS.split(',').includes(car.id)) continue;
    const g = new Game({ cars: [car, car], maps: [map], randomMaps: false, target: 3, roundTime: 60, seed: 5 });
    let worst = 0, when = 0;
    for (let i = 0; i < steps; i++) {
      g.step();
      for (const c of g.cars) for (const w of [...c.wheels, ...c.linkWheels.map((l) => l.body)]) {
        const p = w.getPosition(), r = (w.getFixtureList()!.getShape() as any).m_radius as number;
        for (const s of map.solids) {
          let d = Infinity;
          for (let j = 0; j < s.pts.length; j++) d = Math.min(d, segDist(p.x, p.y, s.pts[j], s.pts[(j + 1) % s.pts.length]));
          const pen = pointInPoly(p.x, p.y, s.pts) ? r + d : r - d;
          if (pen > worst) { worst = pen; when = i; }
        }
      }
    }
    res.push([worst, `${car.id}(${worst.toFixed(2)}@${when})`]);
  }
  res.sort((a, b) => b[0] - a[0]);
  console.log(`== ${map.id}: worst ${res.slice(0, 12).map((r) => r[1]).join(' ')}`);
}
