/*
 * Collision shapes nobody can see. Every car's solid shapes (body polygons that collide, solid pieces of
 * its moving links, hidden wheels) are compared with the sprite as drawn — body, back layer, effects,
 * links, visible wheels, the driver — and the area that lies on empty pixels and sticks out of the
 * picture is reported (ghost area that only fills a hollow between drawn parts is counted apart). Such "ghost"
 * pieces snag on corners for no visible reason.
 *   npx tsx scripts/ghostparts.ts [minArea=0.03] [sheet.png]
 * With a sheet path, writes the worst cars' sprites: magenta = sticking out, dim purple = filling a hollow.
 */
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { CARS } from '../src/cars/defs';
import { CAR_PPM } from '../src/physics/constants';
import { carPalette, generateBackGrid, generateCarGrid, generateFxGrid, generateHeadGrid, generateLinkGrid, generateRiderGrid, generateWheelGrid } from '../src/cars/sprite';
import type { CarDef, CarPoly } from '../src/cars/types';
import type { PixelGrid } from '../src/render/grid';

const minArea = Number(process.argv[2] ?? 0.03);
const sheet = process.argv[3];
/** How far (px) a shape may stick out past the drawing before it counts (outline, rounding). */
const SLACK = 1;

const inPoly = (pts: readonly (readonly [number, number])[], x: number, y: number) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

interface Mask { w: number; h: number; ox: number; oy: number; on: Uint8Array; pal: Uint8Array; grids: [PixelGrid, number, number][] }

function drawn(def: CarDef): Mask {
  const grids: [PixelGrid, number, number][] = [];
  const add = (g: PixelGrid | null | undefined, x = 0, y = 0) => { if (g) grids.push([g, Math.round(x * CAR_PPM) - g.ox, Math.round(y * CAR_PPM) - g.oy]); };
  add(generateBackGrid(def));
  add(generateRiderGrid(def));
  add(generateCarGrid(def));
  add(generateFxGrid(def));
  add(generateHeadGrid(def.head.r), def.head.x, def.head.y);
  for (const w of def.wheels) if (!w.hidden) add(generateWheelGrid(w), w.x, w.y);
  (def.links ?? []).forEach((ld, i) => {
    add(generateLinkGrid(def, i));
    for (const w of ld.wheels ?? []) if (!w.hidden) add(generateWheelGrid(w), w.x, w.y);
  });
  let x0 = 0, y0 = 0, x1 = 0, y1 = 0;
  for (const [g, x, y] of grids) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + g.w); y1 = Math.max(y1, y + g.h); }
  const w = x1 - x0 + 2, h = y1 - y0 + 2, ox = -x0 + 1, oy = -y0 + 1;
  const on = new Uint8Array(w * h), pal = new Uint8Array(w * h);
  for (const [g, gx, gy] of grids) for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const v = g.data[y * g.w + x];
    if (!v) continue;
    const i = (gy + y + oy) * w + gx + x + ox;
    on[i] = 1;
    pal[i] = v;
  }
  return { w, h, ox, oy, on, pal, grids };
}

/** Solid shapes in car-local metres: polygons and circles. */
function solids(def: CarDef) {
  const polys: CarPoly[] = def.body.filter((p) => !p.deco);
  for (const ld of def.links ?? []) if (!ld.trim) polys.push(...ld.polys.filter((p) => !p.deco));
  const circles = def.wheels.filter((w) => w.hidden).map((w) => [w.x, w.y, w.r] as const);
  for (const ld of def.links ?? []) for (const w of ld.wheels ?? []) if (w.hidden) circles.push([w.x, w.y, w.r] as const);
  return { polys, circles };
}

/** A ghost pixel with drawing on both sides of it within this many px (left & right or above & below)
 *  only fills a hollow of the picture; anything else sticks out of it and can catch on things. */
const FILL = Number(process.env.FILL ?? 12);
const rows: { def: CarDef; area: number; fillArea: number; ghost: Set<number>; fill: Set<number>; m: Mask }[] = [];
for (const def of CARS) {
  const m = drawn(def);
  const near = (px: number, py: number) => {
    for (let dy = -SLACK; dy <= SLACK; dy++) for (let dx = -SLACK; dx <= SLACK; dx++) {
      const x = px + dx, y = py + dy;
      if (x >= 0 && y >= 0 && x < m.w && y < m.h && m.on[y * m.w + x]) return true;
    }
    return false;
  };
  const { polys, circles } = solids(def);
  const ghost = new Set<number>();
  for (let py = 0; py < m.h; py++) for (let px = 0; px < m.w; px++) {
    const x = (px - m.ox + 0.5) / CAR_PPM, y = (py - m.oy + 0.5) / CAR_PPM;
    const solid = polys.some((p) => inPoly(p.pts, x, y)) || circles.some(([cx, cy, r]) => Math.hypot(x - cx, y - cy) < r);
    if (solid && !near(px, py)) ghost.add(py * m.w + px);
  }
  const fill = new Set<number>();
  const seen = (x: number, y: number) => x >= 0 && y >= 0 && x < m.w && y < m.h && m.on[y * m.w + x] === 1;
  const ray = (x: number, y: number, dx: number, dy: number) => { for (let k = 1; k <= FILL; k++) if (seen(x + dx * k, y + dy * k)) return true; return false; };
  for (const i of ghost) {
    const x = i % m.w, y = Math.floor(i / m.w);
    if ((ray(x, y, 1, 0) && ray(x, y, -1, 0)) || (ray(x, y, 0, 1) && ray(x, y, 0, -1))) fill.add(i);
  }
  for (const i of fill) ghost.delete(i);
  const area = ghost.size / (CAR_PPM * CAR_PPM);
  if (area >= minArea) rows.push({ def, area, fillArea: fill.size / (CAR_PPM * CAR_PPM), ghost, fill, m });
}
rows.sort((a, b) => b.area - a.area);
for (const r of rows) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const i of r.ghost) { const x = (i % r.m.w - r.m.ox) / CAR_PPM, y = (Math.floor(i / r.m.w) - r.m.oy) / CAR_PPM; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  console.log(r.def.id.padEnd(24), r.area.toFixed(3), 'm² sticking out, +', r.fillArea.toFixed(2), 'filling hollows', `x ${x0.toFixed(2)}..${x1.toFixed(2)} y ${y0.toFixed(2)}..${y1.toFixed(2)}`);
}
console.log(rows.length, 'cars with invisible collision sticking out of the picture ≥', minArea, 'm²');

if (sheet && rows.length) {
  const S = 3, COLS = 5, CW = 130, CH = 80;
  const list = rows.slice(0, Number(process.env.N ?? 40));
  const W = CW * COLS * S, H = CH * Math.ceil(list.length / COLS) * S;
  const img = new Uint8Array(W * H * 3).fill(40);
  const put = (x: number, y: number, c: number[]) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 3; img[i] = c[0]; img[i + 1] = c[1]; img[i + 2] = c[2]; };
  list.forEach((r, k) => {
    const pal = carPalette(r.def.palette);
    const bx = (k % COLS) * CW, by = Math.floor(k / COLS) * CH;
    const offx = bx + Math.round(CW / 2 - r.m.ox), offy = by + Math.round(CH * 0.6 - r.m.oy);
    for (let y = 0; y < r.m.h; y++) for (let x = 0; x < r.m.w; x++) {
      const i = y * r.m.w + x;
      const c = r.ghost.has(i) ? [255, 0, 255] : r.fill.has(i) ? [110, 60, 140] : r.m.on[i] ? ((pal[r.m.pal[i]] as number[] | null) ?? [200, 200, 200]) : null;
      if (!c || bx + CW <= offx + x || offx + x < bx) continue;
      for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) put((offx + x) * S + a, (offy + y) * S + b, c);
    }
    for (let x = 0; x < CW * S; x++) put(bx * S + x, by * S, [90, 90, 90]);
    for (let y = 0; y < CH * S; y++) put(bx * S, by * S + y, [90, 90, 90]);
    console.log('sheet', k, r.def.id);
  });
  const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let q = 0; q < 8; q++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
  const crc = (b: Buffer) => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const chunk = (t: string, d: Buffer) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) Buffer.from(img.buffer, y * W * 3, W * 3).copy(raw, y * (W * 3 + 1) + 1);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
  writeFileSync(sheet, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
  console.log('wrote', sheet);
}
