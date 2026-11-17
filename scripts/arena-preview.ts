// Renders arenas offline (sky, parallax layers, terrain, decor) into PNGs, no browser needed.
// npx tsx scripts/arena-preview.ts [ids|all] [outDir] [--sheet]
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { MAPS, MAP_BY_ID } from '../src/maps/defs';
import { generateClouds, generateLayer, generateSky, generateTerrain, THEMES } from '../src/maps/art';
import { fitCamera } from '../src/render/camera';
import { isPropDecor } from '../src/maps/arena';
import { DECOR_PAL, decorGrid, placedDecor } from '../src/maps/decor';
import { gridToRGBA, type PixelGrid } from '../src/render/grid';
import type { RGB } from '../src/render/color';
import type { MapDef } from '../src/maps/types';

function crc32(buf: Buffer) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
export function png(w: number, h: number, rgba: Uint8Array | Uint8ClampedArray) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

class Canvas {
  rgba: Uint8ClampedArray;
  constructor(readonly w: number, readonly h: number) { this.rgba = new Uint8ClampedArray(w * h * 4); }
  put(x: number, y: number, r: number, g: number, b: number) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.rgba[i] = r; this.rgba[i + 1] = g; this.rgba[i + 2] = b; this.rgba[i + 3] = 255;
  }
  /** Blit RGBA scaled by s (nearest), optional horizontal wrap & flip. */
  blit(src: Uint8ClampedArray, sw: number, sh: number, dx: number, dy: number, s: number, flip = false) {
    const W = Math.ceil(sw * s), H = Math.ceil(sh * s);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const sx = Math.min(sw - 1, Math.floor(x / s)), sy = Math.min(sh - 1, Math.floor(y / s));
      const i = (sy * sw + (flip ? sw - 1 - sx : sx)) * 4;
      if (src[i + 3] < 128) continue;
      this.put(Math.round(dx + x), Math.round(dy + y), src[i], src[i + 1], src[i + 2]);
    }
  }
}

/** One arena framed exactly like the game camera at the start of a round (phone landscape). */
export function renderArena(map: MapDef, W = 915, H = 412, zoomMul = 1): Canvas {
  const b = map.bounds;
  const [[ax, ay], [bx, by]] = map.spawns;
  const minZoom = Math.max(W / (b.x1 - b.x0), H / (b.y1 - b.y0)) * 0.98;
  const cam = fitCamera({ x0: Math.min(ax, bx) - 2.2, y0: Math.min(ay, by) - 2.2, x1: Math.max(ax, bx) + 2.2, y1: Math.max(ay, by) + 2.2 }, W, H, b, { margin: 3.2, minZoom: Math.min(minZoom, H / 8.5), maxZoom: H / 8.5, topPad: 2 });
  cam.zoom *= zoomMul;
  const z = cam.zoom;
  const cv = new Canvas(W, H);
  const theme = THEMES[map.theme];
  const sky = generateSky(theme, false);
  cv.blit(sky.rgba, sky.w, sky.h, 0, 0, W / sky.w, H / sky.h);
  if (theme.clouds) { const cl = generateClouds(theme); cv.blit(cl.rgba, cl.w, cl.h, 0, 0, W / cl.w, H / cl.h); }
  const ps = Math.max(2, Math.round(H / 160));
  const cy = (b.y0 + b.y1) / 2;
  for (const spec of theme.layers) {
    const l = generateLayer(spec, theme);
    const yOff = -(cam.y - cy) * z * l.factor * 0.6;
    const top = Math.round(H * l.bottom - l.h * ps + yOff);
    const off = (((-(cam.x * z * l.factor)) % (l.w * ps)) + l.w * ps) % (l.w * ps) - l.w * ps;
    for (let x = off; x < W; x += l.w * ps) cv.blit(l.rgba, l.w, l.h, x, top, ps);
    if (spec.hang) { for (let y = 0; y < top + 1; y++) for (let x = 0; x < W; x++) cv.put(x, y, ...l.fill); }
    else for (let y = top + l.h * ps - 1; y < H; y++) for (let x = 0; x < W; x++) cv.put(x, y, ...l.fill);
  }
  const art = generateTerrain(map);
  const s = z / art.ppm;
  const tx = (wx: number) => W / 2 + (wx - cam.x) * z, ty = (wy: number) => H / 2 + (wy - cam.y) * z;
  if (art.back) cv.blit(gridToRGBA(art.back, art.palette), art.back.w, art.back.h, tx(art.x0), ty(art.y0), s);
  const decor = placedDecor(map).filter((d) => !isPropDecor(d.kind));
  const drawDecor = (front: boolean) => {
    for (const d of decor) {
      if (!!d.front !== front) continue;
      const g: PixelGrid = decorGrid(d.kind, d.seed);
      const k = s * (d.s ?? 1);
      cv.blit(gridToRGBA(g, DECOR_PAL), g.w, g.h, tx(d.x) - g.ox * k, ty(d.y) - g.oy * k + 2 * s, k, d.flip);
    }
  };
  drawDecor(false);
  for (const wv of [...(map.water ?? []), ...(map.lava ?? [])]) {
    const lava = (map.lava ?? []).includes(wv);
    const c: RGB = lava ? [255, 120, 30] : [40, 140, 220];
    for (let y = Math.max(0, Math.round(ty(wv.y))); y < Math.min(H, ty(wv.y + wv.h)); y++)
      for (let x = Math.max(0, Math.round(tx(wv.x))); x < Math.min(W, tx(wv.x + wv.w)); x++) cv.put(x, y, ...c);
  }
  cv.blit(gridToRGBA(art.grid, art.palette), art.grid.w, art.grid.h, tx(art.x0), ty(art.y0), s);
  drawDecor(true);
  return cv;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = process.argv[2] ?? 'all';
  const out = process.argv[3] ?? 'screenshots/arena';
  const ids = arg === 'all' ? MAPS.map((m) => m.id) : arg.split(',');
  mkdirSync(out, { recursive: true });
  const shots = ids.map((id) => ({ id, cv: renderArena(MAP_BY_ID[id]) }));
  for (const { id, cv } of shots) writeFileSync(`${out}/${id}.png`, png(cv.w, cv.h, cv.rgba));
  if (process.argv.includes('--zoom')) for (const id of ids) { const cv = renderArena(MAP_BY_ID[id], 915, 412, 1.8); writeFileSync(`${out}/${id}-zoom.png`, png(cv.w, cv.h, cv.rgba)); }
  if (process.argv.includes('--sheet')) {
    const cols = 2, cw = 915, rows = Math.ceil(shots.length / cols);
    const ch = Math.max(...shots.map((s) => s.cv.h));
    const sheet = new Canvas(cw * cols, ch * rows);
    shots.forEach(({ cv }, i) => sheet.blit(cv.rgba, cv.w, cv.h, (i % cols) * cw, Math.floor(i / cols) * ch, 1));
    writeFileSync(`${out}/sheet.png`, png(sheet.w, sheet.h, sheet.rgba));
  }
  console.log('wrote', ids.length, 'to', out);
}
