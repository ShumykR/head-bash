import { CARS } from '../src/cars/defs';
import { CAR_PPM } from '../src/physics/constants';
import { generateCarGrid, generateHeadGrid, generateRiderGrid, HELMET_SCALE } from '../src/cars/sprite';
import { gget } from '../src/render/grid';
for (const d of CARS) {
  if (d.rider?.front) continue;
  const body = generateCarGrid(d, CAR_PPM, true), r = generateRiderGrid(d), head = generateHeadGrid(d.head.r);
  const hx = d.head.x * CAR_PPM, hy = d.head.y * CAR_PPM, R = head.ox;
  let n = 0;
  for (let y = Math.round(hy + R * 0.6); y < hy + R + 6; y++) for (let x = Math.round(hx - R); x <= hx + R; x++) {
    if (!gget(r, x + r.ox, y + r.oy)) continue;
    if (gget(head, Math.round(x - hx + head.ox), Math.round(y - hy + head.oy))) continue;
    if (gget(body, x + body.ox, y + body.oy)) continue;
    n++;
  }
  console.log(d.id, n);
}
