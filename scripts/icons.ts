// Generates the PWA / home-screen icons (PNG) from the same pixel-art generators the game uses.
// Each size is drawn natively at its own resolution (then scaled by a whole number), so pixels stay crisp.
// npx tsx scripts/icons.ts [outDir]
import { writeFileSync, mkdirSync } from 'node:fs';
import { CAR_BY_ID } from '../src/cars/defs';
import { carPalette, driverPalette, generateCarGrid, generateHeadGrid, generateWheelGrid, wheelPalette } from '../src/cars/sprite';
import { gridToRGBA, type PixelGrid } from '../src/render/grid';
import { hex, mix, type RGB } from '../src/render/color';
import { png } from './arena-preview';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x: number, y: number) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
const P1 = '#3ec1ff', P2 = '#ff5a6e';

class Img {
  rgba: Uint8ClampedArray;
  constructor(readonly w: number, readonly h: number) { this.rgba = new Uint8ClampedArray(w * h * 4); }
  put(x: number, y: number, c: RGB) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.rgba[i] = c[0]; this.rgba[i + 1] = c[1]; this.rgba[i + 2] = c[2]; this.rgba[i + 3] = 255;
  }
  get(x: number, y: number): RGB | null {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    const i = (y * this.w + x) * 4;
    return this.rgba[i + 3] ? [this.rgba[i], this.rgba[i + 1], this.rgba[i + 2]] : null;
  }
  grid(g: PixelGrid, pal: (RGB | null)[], ox: number, oy: number, flip = false) {
    const src = gridToRGBA(g, pal);
    for (let y = 0; y < g.h; y++)
      for (let x = 0; x < g.w; x++) {
        const i = (y * g.w + x) * 4;
        if (!src[i + 3]) continue;
        const dx = flip ? g.ox - x : x - g.ox;
        this.put(ox + dx, oy + y - g.oy, [src[i], src[i + 1], src[i + 2]]);
      }
  }
  /** Fill a polygon (pixel centers). */
  poly(pts: [number, number][], c: (x: number, y: number) => RGB | null) {
    const ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const xs: number[] = [];
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > y + 0.5) !== (yj > y + 0.5)) xs.push(xi + ((y + 0.5 - yi) / (yj - yi)) * (xj - xi));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) {
          const cc = c(x, y);
          if (cc) this.put(x, y, cc);
        }
    }
  }
  scaled(k: number): Img {
    const o = new Img(this.w * k, this.h * k);
    for (let y = 0; y < o.h; y++)
      for (let x = 0; x < o.w; x++) {
        const i = (Math.floor(y / k) * this.w + Math.floor(x / k)) * 4;
        o.rgba.set(this.rgba.subarray(i, i + 4), (y * o.w + x) * 4);
      }
    return o;
  }
}

/** Sunset sky in clean dithered bands, a big striped sun and two rows of lit mountains. */
function backdrop(img: Img, S: number, horizon: number) {
  const sky = ['#2a1446', '#4a1a64', '#7a2274', '#b8306e', '#ec5a5a', '#ff9a4a', '#ffc860'].map(hex);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const t = (y / horizon) * (sky.length - 1);
      const b = Math.min(sky.length - 1, Math.floor(t + (t % 1 > bayer(x, y) ? 1 : 0)));
      img.put(x, y, sky[b]);
    }
  // stars up top
  for (let i = 0; i < S / 6; i++) {
    const x = Math.floor(((i * 7919) % 997) / 997 * S), y = Math.floor(((i * 104729) % 991) / 991 * S * 0.28);
    img.put(x, y, i % 3 ? [255, 236, 250] : [255, 255, 255]);
  }
  // sun with scanline gaps toward the bottom
  const sx = S * 0.5, sy = horizon - S * 0.06, sr = S * 0.26;
  for (let y = Math.floor(sy - sr); y <= sy + sr; y++)
    for (let x = Math.floor(sx - sr); x <= sx + sr; x++) {
      const d = Math.hypot(x + 0.5 - sx, y + 0.5 - sy);
      if (d > sr) continue;
      const v = (y - (sy - sr)) / (2 * sr);
      const gap = v > 0.45 && Math.floor((y - sy) / Math.max(2, S / 32)) % 2 === 0 && (y - sy) % Math.max(2, Math.round(S / 32)) < Math.max(1, Math.round(v * S / 64));
      if (gap) continue;
      img.put(x, y, mix(hex('#fff2a8'), hex('#ff8a5a'), v));
    }
  // mountains: far (soft violet) and near (deep purple), lit on the left faces
  const ridge = (x: number, seed: number, amp: number) => {
    let v = 0;
    for (let o = 1; o <= 3; o++) v += Math.abs(Math.sin(x / S * Math.PI * (o * 2 + seed) + seed * o)) / o;
    return v / 1.8 * amp;
  };
  const rows: [number, number, string, string][] = [[0.9, 0.18, '#7a3a8a', '#a4589e'], [0.3, 0.12, '#3a1a4e', '#5a2a6a']];
  for (const [seed, amp, base, lit] of rows) {
    for (let x = 0; x < S; x++) {
      const top = horizon - ridge(x, seed, S * amp) - S * 0.02;
      const nxt = horizon - ridge(x + 1, seed, S * amp) - S * 0.02;
      for (let y = Math.floor(top); y < horizon + 2; y++) img.put(x, y, y < top + 1 ? hex(lit) : nxt < top ? hex(lit) : hex(base));
    }
  }
}

/** Grass lip with tufts over dirt with pebbles, like the arena terrain. */
function ground(img: Img, S: number, top: number) {
  const o = hex('#16260f'), hi = hex('#dcf77e'), lt = hex('#92e04e'), md = hex('#56b83a'), dk = hex('#34902e');
  const dirt = hex('#8a5631'), dirtDk = hex('#6a3f22'), dirtLt = hex('#ab723f');
  const u = Math.max(1, Math.round(S / 64));
  for (let x = 0; x < S; x++) {
    const lip = Math.round((Math.abs(Math.sin(x * 0.7 / u)) * 2.2 + 1) * u);
    const thick = 3 * u + lip;
    for (let y = top; y < S; y++) {
      const d = y - top;
      let c: RGB;
      if (d < u) c = o;
      else if (d < 2 * u) c = hi;
      else if (d < 3 * u) c = lt;
      else if (d < thick - u) c = md;
      else if (d < thick) c = dk;
      else if (d < thick + u) c = hex('#48291a');
      else {
        c = dirt;
        const strata = (y + Math.round(Math.sin(x / u * 0.25) * u)) % (6 * u) === 0;
        if (strata) c = dirtDk;
        const px = Math.floor(x / (7 * u)), py = Math.floor(y / (5 * u));
        if (((px * 73 + py * 31) % 5 === 0) && (x % (7 * u)) < 3 * u && (y % (5 * u)) < 2 * u) c = (y % (5 * u)) < u ? hex('#e2d6c4') : hex('#968878');
        if (d === thick + u) c = mix(dirt, dirtLt, 0.5);
      }
      img.put(x, y, c);
    }
    // tufts
    if ((x / u) % 5 === 2) for (let j = 1; j <= 2 * u; j++) img.put(x, top - j, j > u ? hi : lt);
  }
}

/** A star-shaped impact flash with an outline, rays and sparks. */
function impact(img: Img, cx: number, cy: number, r: number) {
  const pts: [number, number][] = [];
  const n = 8;
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2 + 0.2;
    const rr = i % 2 === 0 ? r * (i % 4 === 0 ? 1 : 0.8) : r * 0.42;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  const grow = (k: number): [number, number][] => pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
  img.poly(grow(1.14), () => hex('#3a1020'));
  img.poly(pts, () => hex('#ff8a2a'));
  img.poly(grow(0.74), () => hex('#ffd23f'));
  img.poly(grow(0.42), () => hex('#fff8e0'));
}

function car(img: Img, id: string, x: number, groundY: number, ppm: number, player: string, flip: boolean, palette?: Partial<ReturnType<typeof Object>>) {
  const d = CAR_BY_ID[id];
  const pal = { ...d.palette, ...(palette as object) };
  const bottom = Math.max(...d.wheels.map((w) => w.y + w.r));
  const y = Math.round(groundY - bottom * ppm);
  const fx = (lx: number) => Math.round(x + (flip ? -lx : lx) * ppm);
  img.grid(generateHeadGrid(d.head.r, ppm), driverPalette(player), fx(d.head.x), Math.round(y + d.head.y * ppm), flip);
  img.grid(generateCarGrid(d, ppm), carPalette(pal), x, y, flip);
  for (const w of d.wheels) if (!w.hidden) img.grid(generateWheelGrid(w, ppm), wheelPalette(pal), fx(w.x), Math.round(y + w.y * ppm), flip);
  return { x, y };
}

/**
 * The icon: two cars ramming nose to nose under a sunset, with an impact flash between them.
 * `fit` shrinks the action toward the middle (maskable icons are cropped to a circle).
 */
function scene(S: number, fit = 1): Img {
  const img = new Img(S, S);
  const groundTop = Math.round(S * (fit < 1 ? 0.7 : 0.74));
  backdrop(img, S, groundTop);
  ground(img, S, groundTop);
  const ppm = S * 0.114 * fit;
  // noses meet in the middle: place each car by the front edge of its own sprite
  const nose = (id: string) => { const g = generateCarGrid(CAR_BY_ID[id], ppm); return g.w - g.ox - 3; };
  const gy = groundTop + Math.round(ppm * 0.08);
  // cars and the flash go on their own layer, then get a light sticker rim so they pop off the sky
  const fg = new Img(S, S);
  car(fg, 'sparrow', Math.round(S / 2 - nose('sparrow')), gy, ppm, P1, false);
  car(fg, 'bulldog', Math.round(S / 2 + nose('bulldog')), gy, ppm, P2, true);
  impact(fg, S / 2, groundTop - ppm * 1.25, S * 0.13 * fit);
  const rim = Math.max(1, Math.round(S / 96));
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      if (fg.get(x, y) || y >= groundTop) continue;
      let near = false;
      for (let dy = -rim; dy <= rim && !near; dy++) for (let dx = -rim; dx <= rim; dx++) if (Math.abs(dx) + Math.abs(dy) <= rim && fg.get(x + dx, y + dy)) { near = true; break; }
      if (near) img.put(x, y, mix(img.get(x, y) ?? [0, 0, 0], [255, 244, 220], 0.75));
    }
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const c = fg.get(x, y); if (c) img.put(x, y, c); }
  // sparks flying out of the hit, drawn on top
  const sp: [number, number, number][] = [[-0.35, -2.45, 1], [0.4, -2.6, 1], [-0.9, -2.0, 0], [0.95, -2.1, 0], [0, -3.0, 0]];
  const u = Math.max(1, Math.round(S / 64));
  for (const [dx, dy, big] of sp) {
    const x = S / 2 + dx * ppm, y = groundTop + dy * ppm;
    for (let yy = 0; yy < u * (big ? 2 : 1); yy++) for (let xx = 0; xx < u * (big ? 2 : 1); xx++) img.put(x + xx, y + yy, big ? hex('#ffffff') : hex('#ffd23f'));
  }
  return img;
}

/** Favicon: too small for the cars, so two helmets butting heads over a flash. */
function favicon(S: number): Img {
  const img = new Img(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) img.put(x, y, mix(hex('#2a1446'), hex('#b8306e'), y / S));
  impact(img, S / 2, S * 0.5, S * 0.32);
  const r = 0.28, ppm = (S * 0.25) / (r * 1.25);
  img.grid(generateHeadGrid(r, ppm), driverPalette(P1), Math.round(S * 0.27), Math.round(S * 0.56), false);
  img.grid(generateHeadGrid(r, ppm), driverPalette(P2), Math.round(S * 0.73), Math.round(S * 0.56), true);
  return img;
}

const out = process.argv[2] ?? 'public/icons';
mkdirSync(out, { recursive: true });
const save = (name: string, img: Img) => writeFileSync(`${out}/${name}`, png(img.w, img.h, img.rgba));
save('icon-512.png', scene(128).scaled(4));
save('icon-192.png', scene(96).scaled(2));
save('apple-touch-180.png', scene(90).scaled(2));
save('maskable-512.png', scene(128, 0.78).scaled(4));
save('favicon-32.png', favicon(32));
console.log('icons written to', out);
