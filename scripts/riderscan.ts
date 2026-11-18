/*
 * How much of the driver's body shows on each car, and whether the helmet sinks into the bodywork:
 *   npx tsx scripts/riderscan.ts [id,id]
 * vis   = suit pixels seen (not hidden by the bodywork) / all suit pixels
 * neck  = suit pixels seen in the band right under the helmet / band width (0 = a lone head)
 * sunk  = helmet pixels over solid bodywork / helmet pixels (high = head drawn "inside" the car)
 */
import { CARS } from '../src/cars/defs';
import { CAR_PPM } from '../src/physics/constants';
import { generateCarGrid, generateHeadGrid, generateRiderGrid } from '../src/cars/sprite';
import type { PixelGrid } from '../src/render/grid';

const ids = process.argv[2]?.split(',');
const at = (g: PixelGrid, x: number, y: number) => (x < 0 || y < 0 || x >= g.w || y >= g.h ? 0 : g.data[y * g.w + x]);
for (const def of CARS.filter((c) => !ids || ids.includes(c.id))) {
  const body = generateCarGrid(def), rider = generateRiderGrid(def), head = generateHeadGrid(def.head.r);
  const front = !!def.rider?.front;
  const hx = Math.round(def.head.x * CAR_PPM), hy = Math.round(def.head.y * CAR_PPM);
  const solid = (cx: number, cy: number) => at(body, cx + body.ox, cy + body.oy) > 1;
  const inHead = (cx: number, cy: number) => at(head, cx - hx + head.ox, cy - hy + head.oy) > 0;
  let all = 0, seen = 0;
  for (let y = 0; y < rider.h; y++) for (let x = 0; x < rider.w; x++) {
    if (!at(rider, x, y)) continue;
    const cx = x - rider.ox, cy = y - rider.oy;
    if (inHead(cx, cy)) continue;
    all++;
    if (front || !solid(cx, cy)) seen++;
  }
  const R = head.ox;
  let band = 0, bandSeen = 0;
  for (let dx = -Math.round(R * 0.6); dx <= Math.round(R * 0.6); dx++) {
    band++;
    for (let dy = 0; dy < Math.round(R * 0.7); dy++) {
      const cx = hx + dx, cy = hy + R + 1 + dy;
      if (at(rider, cx + rider.ox, cy + rider.oy) && (front || !solid(cx, cy))) { bandSeen++; break; }
    }
  }
  let hp = 0, hs = 0;
  for (let y = 0; y < head.h; y++) for (let x = 0; x < head.w; x++) if (at(head, x, y)) {
    hp++;
    if (solid(x - head.ox + hx, y - head.oy + hy)) hs++;
  }
  console.log([def.id.padEnd(24), def.archetype.padEnd(10), (front ? 'F' : '-') + (def.rider?.pose ?? 'sit').padEnd(5), 'vis', (seen / Math.max(1, all)).toFixed(2), 'neck', (bandSeen / band).toFixed(2), 'sunk', (hs / hp).toFixed(2)].join(' '));
}
