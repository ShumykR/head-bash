import { RGB, hex, mix, hash2 } from '../render/color';

/*
 * Water and lava textures, drawn like the terrain: a clean crest on top, bands that darken with
 * depth, and texture you can read (caustic light on water, cooled crust plates on lava).
 * Everything tiles horizontally over W pixels; bodies are BODY_H tall and fade to a flat deep
 * colour at the bottom, so anything deeper is filled with that colour.
 */

export type LiquidKind = 'water' | 'lava';
export interface Tex { w: number; h: number; rgba: Uint8ClampedArray }

export const LIQ_W = 64;
export const BODY_H = 96;
export const SURF_H = 8;

const TAU = Math.PI * 2;
const per = (x: number, k: number, ph = 0) => Math.sin((x / LIQ_W) * TAU * k + ph);

function tex(w: number, h: number) {
  const rgba = new Uint8ClampedArray(w * h * 4);
  const put = (x: number, y: number, c: RGB) => {
    if (y < 0 || y >= h) return;
    const i = (y * w + (((x % w) + w) % w)) * 4;
    rgba[i] = c[0]; rgba[i + 1] = c[1]; rgba[i + 2] = c[2]; rgba[i + 3] = 255;
  };
  return { t: { w, h, rgba }, put };
}

/** Depth bands with a one-row checker seam between them. */
function band(y: number, x: number, stops: [number, RGB][]): RGB {
  for (let i = stops.length - 1; i >= 0; i--) {
    const [y0, c] = stops[i];
    if (y >= y0 + 1) return c;
    if (y === y0) return (x + y) % 2 ? c : stops[Math.max(0, i - 1)][1];
  }
  return stops[0][1];
}

export const DEEP: Record<LiquidKind, RGB> = { water: hex('#163a78'), lava: hex('#5a1206') };

const WATER = { foam: hex('#ffffff'), crest: hex('#d2f6ff'), top: hex('#6ad8f0'), mid: hex('#3aa8e0'), deep: hex('#2a7ac8'), deeper: hex('#1e56a0') };
const LAVA = { crest: hex('#fff6c0'), hot: hex('#ffd860'), top: hex('#ffa030'), mid: hex('#f06a1a'), deep: hex('#c03a12'), deeper: hex('#86200a') };
const CRUST = { o: hex('#1a0806'), lt: hex('#7a3a24'), md: hex('#4a2018'), dk: hex('#30140e') };

/** Periodic Voronoi over the tile width: cell id and whether the pixel is on a joint. */
function cells(x: number, y: number, size: number, seed: number) {
  const n = LIQ_W / size;
  const gx0 = Math.floor(x / size), gy0 = Math.floor(y / size);
  let d1 = 1e9, d2 = 1e9, id = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const gx = gx0 + i, gy = gy0 + j, wx = ((gx % n) + n) % n;
    const px = (gx + 0.2 + hash2(wx, gy, seed) * 0.6) * size, py = (gy + 0.2 + hash2(wx, gy, seed + 1) * 0.6) * size;
    const d = (x + 0.5 - px) ** 2 + ((y + 0.5 - py) * 1.4) ** 2;
    if (d < d1) { d2 = d1; d1 = d; id = wx * 131 + gy; } else if (d < d2) d2 = d;
  }
  return { id, gap: Math.sqrt(d2) - Math.sqrt(d1) };
}

export function liquidBody(kind: LiquidKind): Tex {
  const { t, put } = tex(LIQ_W, BODY_H);
  for (let y = 0; y < BODY_H; y++)
    for (let x = 0; x < LIQ_W; x++) {
      if (kind === 'water') {
        let c = band(y, x, [[0, WATER.top], [8, WATER.mid], [26, WATER.deep], [52, WATER.deeper], [78, DEEP.water]]);
        // caustic net of light, fading with depth
        // short wavy glints, in rows, thinning out with depth
        const row = Math.floor(y / 5), ly = y - row * 5;
        const wave = Math.round(per(x, 2, row * 1.7) * 1.2);
        if (y < 64 && ly === 2 + wave && per(x, 3, row * 2.3) > 0.55 - y * 0.004) c = mix(c, [255, 255, 255], 0.38 - y * 0.004);
        // a few rising bubbles
        const bx = Math.floor(x / 16), by = Math.floor(y / 24);
        if (hash2(bx, by, 7) > 0.55) {
          const cx = bx * 16 + 4 + hash2(bx, by, 8) * 8, cy = by * 24 + 6 + hash2(bx, by, 9) * 12;
          const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
          if (d < 1.6) c = d < 0.8 ? mix(c, [255, 255, 255], 0.7) : mix(c, [255, 255, 255], 0.25);
        }
        put(x, y, c);
      } else {
        let c = band(y, x, [[0, LAVA.hot], [5, LAVA.top], [16, LAVA.mid], [38, LAVA.deep], [64, LAVA.deeper], [84, DEEP.lava]]);
        // cooled crust plates floating in the glow; the gaps between them stay bright
        const cl = cells(x, y, 16, 3);
        const crust = hash2(cl.id, 5) > 0.55 && y < 80;
        if (crust && cl.gap > 2.2) {
          const up = cells(x, y - 1, 16, 3), lf = cells(x - 1, y, 16, 3);
          const dn = cells(x, y + 1, 16, 3);
          let cc = up.gap <= 2.2 || lf.gap <= 2.2 ? CRUST.lt : dn.gap <= 2.2 ? CRUST.dk : CRUST.md;
          if (cl.gap < 2.8) cc = CRUST.o;
          // deeper plates sink into the dark
          c = mix(cc, DEEP.lava, Math.min(0.6, y / 140));
        } else if (crust && cl.gap > 1.2) c = mix(c, LAVA.hot, 0.5); // rim glow
        // white-hot specks
        if (!crust && hash2(x >> 1, y >> 1, 11) > 0.97 && y < 50) c = LAVA.crest;
        put(x, y, c);
      }
    }
  return t;
}

/** The crest strip that sits on top of the body (transparent above the wave). */
export function liquidSurface(kind: LiquidKind): Tex {
  const { t, put } = tex(LIQ_W, SURF_H);
  for (let x = 0; x < LIQ_W; x++) {
    if (kind === 'water') {
      const top = 3 + Math.round(per(x, 2) * 1.4 + per(x, 5, 1) * 0.6);
      for (let y = top; y < SURF_H; y++) {
        let c = y === top ? WATER.foam : y === top + 1 ? WATER.crest : WATER.top;
        if (y === top + 2 && hash2(x, 3, 5) > 0.75) c = WATER.foam; // foam flecks
        put(x, y, c);
      }
    } else {
      // slower, heavier swell with bubbles bulging out of it
      let top = 4 + Math.round(per(x, 2, 0.5) * 1.2);
      const b = Math.floor(x / 16), bx = b * 16 + 5 + Math.floor(hash2(b, 2) * 6);
      if (hash2(b, 1) > 0.35 && Math.abs(x - bx) <= 2) top -= 2 - Math.floor(Math.abs(x - bx) / 2);
      for (let y = top; y < SURF_H; y++) put(x, y, y === top ? LAVA.crest : y === top + 1 ? LAVA.hot : LAVA.top);
    }
  }
  return t;
}

/** Heat haze above lava: a dithered glow that thins out upward (transparent elsewhere). */
export function lavaGlow(): Tex {
  const H = 12;
  const { t, put } = tex(LIQ_W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < LIQ_W; x++) {
      const k = y / H; // 0 top .. 1 bottom
      const dens = k * k;
      const th = ((x * 7 + y * 13) % 16) / 16;
      if (th < dens * 0.45) put(x, y, k > 0.7 ? hex('#ffb040') : hex('#ff7a2a'));
    }
  return t;
}
