// Renders arenas offline (sky, parallax layers, terrain, decor) into PNGs, no browser needed.
// npx tsx scripts/arena-preview.ts [ids|all] [outDir] [--sheet]
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { MAPS, MAP_BY_ID } from '../src/maps/defs';
import { generateLayer, generateSky, generateTerrain, THEMES } from '../src/maps/art';
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

/** One arena framed like the game camera at full view: world fits in `W` px wide. */
export function renderArena(map: MapDef, W = 900): Canvas {
  const b = map.bounds;
  const ppmOut = W / (b.x1 - b.x0);
  const H = Math.round((b.y1 - b.y0) * ppmOut * 0.62);
  const cv = new Canvas(W, H);
  // view centered on spawns' height
  const cy = (map.spawns[0][1] + map.spawns[1][1]) / 2 + 1;
  const vy0 = cy - (H / ppmOut) * 0.62;
  const theme = THEMES[map.theme];
  const sky = generateSky(theme);
  const ss = H / sky.h;
  for (let x = 0; x < W; x += Math.floor(sky.w * ss)) cv.blit(sky.rgba, sky.w, sky.h, x, 0, ss);
  const px = H / 180; // background pixel scale (screen fraction, like the game)
  for (const spec of theme.layers) {
    const l = generateLayer(spec);
    const top = spec.hang ? 0 : l.bottom * H - l.h * px;
    for (let x = -((spec.seed * 37) % 300) * px; x < W; x += l.w * px) cv.blit(l.rgba, l.w, l.h, x, top, px);
    if (!spec.hang) {
      // fill below the layer
      const c = l.rgba.subarray((l.w * (l.h - 1)) * 4, (l.w * (l.h - 1)) * 4 + 4);
      for (let y = Math.ceil(top + l.h * px); y < H; y++) for (let x = 0; x < W; x++) if (c[3]) cv.put(x, y, c[0], c[1], c[2]);
    }
  }
  const art = generateTerrain(map);
  const s = ppmOut / art.ppm;
  const tx = (wx: number) => (wx - b.x0) * ppmOut, ty = (wy: number) => (wy - vy0) * ppmOut;
  if (art.back) cv.blit(gridToRGBA(art.back, art.palette), art.back.w, art.back.h, tx(art.x0), ty(art.y0), s);
  const decor = placedDecor(map);
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
  if (process.argv.includes('--zoom')) {
    // game-like close-up: 3x the overview, cropped around the left spawn
    for (const id of ids) {
      const m = MAP_BY_ID[id];
      const big = renderArena(m, 2700);
      const crop = new Canvas(900, 420);
      const sx = Math.max(0, Math.min(big.w - 900, Math.round(((m.spawns[0][0] - m.bounds.x0) / (m.bounds.x1 - m.bounds.x0)) * big.w - 300)));
      const sy = Math.max(0, Math.min(big.h - 420, Math.round(big.h * 0.62 - 260)));
      for (let y = 0; y < 420; y++) crop.rgba.set(big.rgba.subarray(((sy + y) * big.w + sx) * 4, ((sy + y) * big.w + sx + 900) * 4), y * 900 * 4);
      writeFileSync(`${out}/${id}-zoom.png`, png(900, 420, crop.rgba));
    }
  }
  if (process.argv.includes('--sheet')) {
    const cols = 2, cw = 900, rows = Math.ceil(shots.length / cols);
    const ch = Math.max(...shots.map((s) => s.cv.h));
    const sheet = new Canvas(cw * cols, ch * rows);
    shots.forEach(({ cv }, i) => sheet.blit(cv.rgba, cv.w, cv.h, (i % cols) * cw, Math.floor(i / cols) * ch, 1));
    writeFileSync(`${out}/sheet.png`, png(sheet.w, sheet.h, sheet.rgba));
  }
  console.log('wrote', ids.length, 'to', out);
}
