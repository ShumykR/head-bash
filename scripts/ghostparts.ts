import { CARS } from '../src/cars/defs';
import type { CarPoly } from '../src/cars/types';

// Collision shapes nobody can see: the area of each car's solid (non-deco) polygons that lies outside
// everything the sprite draws (body polygons that aren't hidden, plus wheels). Such "ghost" pieces snag
// on corners with no visible reason. Usage: npx tsx scripts/ghostparts.ts [minArea=0.03]
const minArea = Number(process.argv[2] ?? 0.03);
const inPoly = (pts: [number, number][], x: number, y: number) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const H = 0.04, PAD = 0.07;
const rows: [string, number, string][] = [];
for (const car of CARS) {
  const body = car.body as CarPoly[];
  const seen = body.filter((p) => !p.hide);
  const solid = body.filter((p) => !p.deco && !(p as { sensor?: boolean }).sensor);
  const visible = (x: number, y: number) =>
    car.wheels.some((w) => Math.hypot(x - w.x, y - w.y) < w.r + PAD) ||
    seen.some((p) => [[0, 0], [PAD, 0], [-PAD, 0], [0, PAD], [0, -PAD]].some(([dx, dy]) => inPoly(p.pts as [number, number][], x + dx, y + dy)));
  let area = 0, xs: number[] = [], ys: number[] = [];
  for (const p of solid) {
    const pts = p.pts as [number, number][];
    const x0 = Math.min(...pts.map((q) => q[0])), x1 = Math.max(...pts.map((q) => q[0]));
    const y0 = Math.min(...pts.map((q) => q[1])), y1 = Math.max(...pts.map((q) => q[1]));
    for (let x = x0 + H / 2; x < x1; x += H) for (let y = y0 + H / 2; y < y1; y += H) {
      if (!inPoly(pts, x, y) || visible(x, y)) continue;
      area += H * H; xs.push(x); ys.push(y);
    }
  }
  if (area >= minArea) rows.push([car.id, area, `x ${Math.min(...xs).toFixed(2)}..${Math.max(...xs).toFixed(2)} y ${Math.min(...ys).toFixed(2)}..${Math.max(...ys).toFixed(2)}`]);
}
rows.sort((a, b) => b[1] - a[1]);
for (const [id, a, where] of rows) console.log(id.padEnd(24), a.toFixed(3), 'm²', where);
console.log(rows.length, 'cars with invisible collision area ≥', minArea, 'm²');
