import { RGB, hex, shade, mix, hash2, bayer } from '../render/color';
import type { ThemeId } from './types';

export { generateTerrain, type TerrainArt } from './terrain';
import { paintLayer, type BgLayer, type LayerSpec } from './backdrop';
export type { BgLayer, LayerSpec } from './backdrop';

/* ------------------------------------------------------------------ */
/* Parallax backgrounds                                                */
/* ------------------------------------------------------------------ */

export interface Theme {
  sky: [string, string, string];
  /** `hang` layers hang from the top of the screen (stalactites) and fill upward. */
  layers: LayerSpec[];
  celestial?: { kind: 'sun' | 'moon' | 'planet'; color: string; x: number; y: number; r: number };
  stars?: boolean;
  clouds?: string;
}

export const THEMES: Record<ThemeId, Theme> = {
  meadow: {
    sky: ['#4aa8ff', '#9ad8ff', '#e8f8ff'],
    celestial: { kind: 'sun', color: '#fff2a0', x: 0.78, y: 0.18, r: 11 },
    clouds: '#ffffff',
    layers: [
      { kind: 'mountains', color: '#7aa6d8', color2: '#e8f0ff', factor: 0.08, bottom: 0.78, height: 70, seed: 1 },
      { kind: 'hills', color: '#58b45a', color2: '#3f8f46', factor: 0.2, bottom: 0.86, height: 50, seed: 2 },
      { kind: 'trees', color: '#2c7a3c', color2: '#1d5a2c', factor: 0.35, bottom: 0.95, height: 40, seed: 3 },
    ],
  },
  foundry: {
    sky: ['#1a0c14', '#5a1e1e', '#d0582a'],
    stars: false,
    layers: [
      { kind: 'factory', color: '#2a1a1e', color2: '#ff8a3a', factor: 0.1, bottom: 0.8, height: 90, seed: 4 },
      { kind: 'factory', color: '#3a2226', color2: '#ffb050', factor: 0.25, bottom: 0.92, height: 70, seed: 5 },
    ],
  },
  sawmill: {
    sky: ['#ff9a5a', '#ffc88a', '#ffe8c0'],
    celestial: { kind: 'sun', color: '#fff0c0', x: 0.25, y: 0.3, r: 14 },
    clouds: '#ffe0c8',
    layers: [
      { kind: 'mountains', color: '#b07a7a', color2: '#e8c0b0', factor: 0.08, bottom: 0.75, height: 60, seed: 6 },
      { kind: 'pines', color: '#4a5a3a', color2: '#33402a', factor: 0.2, bottom: 0.88, height: 60, seed: 7 },
      { kind: 'pines', color: '#2a3624', color2: '#1c2618', factor: 0.38, bottom: 0.98, height: 60, seed: 8 },
    ],
  },
  sky: {
    sky: ['#2c5cd8', '#6aa0ff', '#d0e4ff'],
    celestial: { kind: 'sun', color: '#ffffff', x: 0.6, y: 0.15, r: 9 },
    clouds: '#ffffff',
    layers: [
      { kind: 'islands', color: '#8a86b0', color2: '#9ad08a', factor: 0.06, bottom: 0.7, height: 60, seed: 9 },
      { kind: 'islands', color: '#7a6a8a', color2: '#6ac45a', factor: 0.15, bottom: 0.95, height: 60, seed: 10 },
    ],
  },
  ice: {
    sky: ['#0c1430', '#24406e', '#5a8ac0'],
    stars: true,
    celestial: { kind: 'moon', color: '#e8f4ff', x: 0.2, y: 0.2, r: 10 },
    layers: [
      { kind: 'crystals', color: '#3a6aa0', color2: '#8ad0ff', factor: 0.1, bottom: 0.8, height: 80, seed: 11 },
      { kind: 'mountains', color: '#5a86b8', color2: '#f0f8ff', factor: 0.22, bottom: 0.92, height: 60, seed: 12 },
    ],
  },
  neon: {
    sky: ['#0a0418', '#2a0c48', '#7a1a6a'],
    stars: true,
    celestial: { kind: 'planet', color: '#ff5ab4', x: 0.7, y: 0.25, r: 16 },
    layers: [
      { kind: 'city', color: '#1c0e34', color2: '#5ef0ff', factor: 0.08, bottom: 0.85, height: 100, seed: 13 },
      { kind: 'city', color: '#120824', color2: '#ff4fd8', factor: 0.2, bottom: 0.97, height: 80, seed: 14 },
    ],
  },
  desert: {
    sky: ['#3a8ae0', '#8cc4f0', '#ffe2b0'],
    celestial: { kind: 'sun', color: '#fff8d0', x: 0.85, y: 0.12, r: 12 },
    layers: [
      { kind: 'dunes', color: '#e8b070', color2: '#c48a4e', factor: 0.08, bottom: 0.8, height: 40, seed: 15 },
      { kind: 'ruins', color: '#b47a4a', color2: '#8a5a34', factor: 0.2, bottom: 0.9, height: 60, seed: 16 },
      { kind: 'dunes', color: '#d49a5a', color2: '#b07a40', factor: 0.35, bottom: 1.0, height: 30, seed: 17 },
    ],
  },
  halloween: {
    sky: ['#0a0614', '#2a1440', '#6a2a5a'],
    stars: true,
    celestial: { kind: 'moon', color: '#ffe8a0', x: 0.75, y: 0.22, r: 16 },
    layers: [
      { kind: 'hills', color: '#2a1a3a', color2: '#1e1230', factor: 0.08, bottom: 0.8, height: 60, seed: 21 },
      { kind: 'graves', color: '#1a1026', color2: '#ff9a2a', factor: 0.22, bottom: 0.95, height: 60, seed: 22 },
    ],
  },
  winter: {
    sky: ['#5a8ad8', '#a8c8f0', '#eef6ff'],
    celestial: { kind: 'sun', color: '#fffbe8', x: 0.2, y: 0.2, r: 10 },
    clouds: '#ffffff',
    layers: [
      { kind: 'mountains', color: '#8aa6d0', color2: '#ffffff', factor: 0.07, bottom: 0.75, height: 70, seed: 23 },
      { kind: 'snowpines', color: '#3a6a5a', color2: '#ffffff', factor: 0.2, bottom: 0.9, height: 60, seed: 24 },
      { kind: 'hills', color: '#e8f0ff', color2: '#c8d6ee', factor: 0.35, bottom: 1.0, height: 30, seed: 25 },
    ],
  },
  alien: {
    sky: ['#06120c', '#163a2a', '#3a7a4a'],
    stars: true,
    celestial: { kind: 'moon', color: '#d8ffd0', x: 0.15, y: 0.2, r: 9 },
    layers: [
      { kind: 'hills', color: '#1a3a24', color2: '#14301c', factor: 0.08, bottom: 0.82, height: 50, seed: 26 },
      { kind: 'farm', color: '#6a5a50', color2: '#ffd86a', factor: 0.2, bottom: 0.94, height: 60, seed: 27 },
    ],
  },
  dome: {
    sky: ['#10101a', '#24243a', '#3a3a56'],
    layers: [
      { kind: 'domewall', color: '#2a2a3e', color2: '#ffd23f', factor: 0.06, bottom: 0.85, height: 120, seed: 28 },
      { kind: 'stands', color: '#3a3a52', color2: '#ff5a6e', factor: 0.18, bottom: 0.96, height: 50, seed: 29 },
    ],
  },
  volcano: {
    sky: ['#1a0a0a', '#5a1a14', '#e0602a'],
    layers: [
      { kind: 'volcanoes', color: '#2a1a18', color2: '#ff7a1a', factor: 0.07, bottom: 0.8, height: 90, seed: 30 },
      { kind: 'trees', color: '#1e3a1a', color2: '#142a12', factor: 0.22, bottom: 0.95, height: 44, seed: 31 },
    ],
  },
  beach: {
    sky: ['#2a9ae8', '#7accf8', '#fff0c8'],
    celestial: { kind: 'sun', color: '#fff6c0', x: 0.82, y: 0.16, r: 13 },
    clouds: '#ffffff',
    layers: [
      { kind: 'islands', color: '#5a9a6a', color2: '#7ac48a', factor: 0.05, bottom: 0.82, height: 50, seed: 32 },
      { kind: 'sea', color: '#1a7ac8', color2: '#8ae0ff', factor: 0.1, bottom: 1.0, height: 70, seed: 33 },
      { kind: 'palms', color: '#1e6a3a', color2: '#6a4a2a', factor: 0.25, bottom: 0.92, height: 60, seed: 34 },
    ],
  },
  stadium: {
    sky: ['#0a1430', '#1a3060', '#3a5a9a'],
    stars: true,
    layers: [
      { kind: 'stands', color: '#2a3050', color2: '#ffd23f', factor: 0.08, bottom: 0.85, height: 80, seed: 35 },
      { kind: 'stands', color: '#1e2440', color2: '#ffffff', factor: 0.18, bottom: 0.95, height: 50, seed: 36 },
    ],
  },
  cny: {
    sky: ['#1a0610', '#4a0e20', '#a02a2a'],
    stars: true,
    celestial: { kind: 'moon', color: '#ffe080', x: 0.5, y: 0.2, r: 14 },
    layers: [
      { kind: 'mountains', color: '#3a1422', color2: '#5a2032', factor: 0.06, bottom: 0.78, height: 60, seed: 37 },
      { kind: 'pagodas', color: '#5a1a2a', color2: '#ffb030', factor: 0.2, bottom: 0.95, height: 80, seed: 38 },
    ],
  },
  rift: {
    sky: ['#04020c', '#1a0a34', '#4a1a6a'],
    stars: true,
    celestial: { kind: 'planet', color: '#c07aff', x: 0.72, y: 0.3, r: 20 },
    layers: [
      { kind: 'crystals', color: '#2a1448', color2: '#ff8ae8', factor: 0.08, bottom: 0.82, height: 90, seed: 39 },
      { kind: 'islands', color: '#1e1036', color2: '#5ef0ff', factor: 0.18, bottom: 0.95, height: 60, seed: 40 },
    ],
  },
  toys: {
    sky: ['#6ab8ff', '#b0e0ff', '#ffffff'],
    clouds: '#ffffff',
    celestial: { kind: 'sun', color: '#fff2a0', x: 0.15, y: 0.18, r: 11 },
    layers: [
      { kind: 'blocks', color: '#ff6a5a', color2: '#5a9aff', factor: 0.08, bottom: 0.85, height: 70, seed: 41 },
      { kind: 'blocks', color: '#ffd23f', color2: '#4ac46a', factor: 0.2, bottom: 0.97, height: 44, seed: 42 },
    ],
  },
  cavern: {
    sky: ['#0a0612', '#1e1430', '#3a2850'],
    layers: [
      { kind: 'stalactites', color: '#1a1228', color2: '#3a2c50', factor: 0.06, bottom: 0.3, height: 60, seed: 51, hang: true },
      { kind: 'cavewall', color: '#241a36', color2: '#3a2c50', factor: 0.1, bottom: 0.9, height: 80, seed: 52 },
    ],
  },
  catacomb: {
    sky: ['#08060c', '#1a141e', '#30263a'],
    layers: [
      { kind: 'stalactites', color: '#140e18', color2: '#2e2234', factor: 0.06, bottom: 0.26, height: 50, seed: 53, hang: true },
      { kind: 'graves', color: '#1c1422', color2: '#e8dcc0', factor: 0.14, bottom: 0.92, height: 60, seed: 54 },
    ],
  },
  grotto: {
    sky: ['#04101a', '#0c2a3a', '#1a4a5c'],
    layers: [
      { kind: 'stalactites', color: '#081a26', color2: '#2a6a7a', factor: 0.06, bottom: 0.3, height: 60, seed: 55, hang: true },
      { kind: 'crystals', color: '#0e2a3a', color2: '#5ef0ff', factor: 0.12, bottom: 0.92, height: 80, seed: 56 },
    ],
  },
  mine: {
    sky: ['#0e0a08', '#2a1c14', '#4a3020'],
    layers: [
      { kind: 'stalactites', color: '#1a120c', color2: '#3a2818', factor: 0.06, bottom: 0.28, height: 50, seed: 57, hang: true },
      { kind: 'girders', color: '#3a2a1c', color2: '#ffb050', factor: 0.12, bottom: 0.95, height: 110, seed: 58 },
    ],
  },
  chasm: {
    sky: ['#1a2a5a', '#5a6aa8', '#f0a87a'],
    celestial: { kind: 'sun', color: '#fff0c0', x: 0.7, y: 0.55, r: 16 },
    clouds: '#f8d8c8',
    layers: [
      { kind: 'mountains', color: '#4a4a7a', color2: '#d8c8e8', factor: 0.06, bottom: 0.8, height: 80, seed: 59 },
      { kind: 'girders', color: '#2a2a4a', color2: '#8a8ab0', factor: 0.16, bottom: 1.0, height: 120, seed: 60 },
    ],
  },
  bunker: {
    sky: ['#0a0e16', '#1a2434', '#2c3a52'],
    layers: [
      { kind: 'pipes', color: '#1a2230', color2: '#ff4a3a', factor: 0.06, bottom: 0.9, height: 160, seed: 61 },
      { kind: 'girders', color: '#222c3c', color2: '#5a6a86', factor: 0.14, bottom: 1.0, height: 90, seed: 62 },
    ],
  },
  crypt: {
    sky: ['#06040a', '#140e1c', '#261a30'],
    layers: [
      { kind: 'stalactites', color: '#120c18', color2: '#2a1e34', factor: 0.06, bottom: 0.32, height: 60, seed: 63, hang: true },
      { kind: 'cavewall', color: '#1a1222', color2: '#ffb050', factor: 0.1, bottom: 0.92, height: 90, seed: 64 },
    ],
  },
  amber: {
    sky: ['#2a0e04', '#6a2a0a', '#d07a20'],
    celestial: { kind: 'sun', color: '#ffe8a0', x: 0.3, y: 0.3, r: 18 },
    layers: [
      { kind: 'dunes', color: '#a0500c', color2: '#7a3a08', factor: 0.08, bottom: 0.82, height: 40, seed: 65 },
      { kind: 'ruins', color: '#6a3006', color2: '#4a2004', factor: 0.18, bottom: 0.94, height: 60, seed: 66 },
    ],
  },
  moon: {
    sky: ['#020208', '#0a0a1c', '#1a1a34'],
    stars: true,
    celestial: { kind: 'planet', color: '#4a9aff', x: 0.3, y: 0.28, r: 22 },
    layers: [
      { kind: 'craters', color: '#4a4a5e', color2: '#6a6a80', factor: 0.08, bottom: 0.85, height: 50, seed: 18 },
      { kind: 'craters', color: '#34344a', color2: '#50506a', factor: 0.2, bottom: 0.97, height: 40, seed: 19 },
    ],
  },
};

const BG_W = 320;

function putPx(buf: Uint8ClampedArray, w: number, x: number, y: number, c: RGB, a = 255) {
  const i = (y * w + x) * 4;
  buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = a;
}

/** One parallax strip; far layers fade toward the theme's horizon colour. */
export function generateLayer(spec: LayerSpec, theme?: Theme): BgLayer {
  const sky = theme ? mix(hex(theme.sky[1]), hex(theme.sky[2]), 0.6) : hex(spec.color);
  return paintLayer(spec, sky);
}

/** Sky: tall thin gradient with ordered dithering, plus sun/moon/stars & clouds. */
export function generateSky(theme: Theme, withClouds = true): { w: number; h: number; rgba: Uint8ClampedArray } {
  const w = BG_W, h = 180;
  const rgba = new Uint8ClampedArray(w * h * 4);
  const [a, b, c] = theme.sky.map(hex);
  const bands = 7;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = y / (h - 1);
      const tt = t * bands;
      const band = Math.floor(tt);
      const frac = tt - band;
      const q = (band + (frac > bayer(x, y) ? 1 : 0)) / bands;
      const col = q < 0.5 ? mix(a, b, q * 2) : mix(b, c, (q - 0.5) * 2);
      putPx(rgba, w, x, y, col);
    }
  }
  if (theme.stars) {
    for (let i = 0; i < 90; i++) {
      const x = Math.floor(hash2(i, 1, 9) * w), y = Math.floor(hash2(i, 2, 9) * h * 0.7);
      putPx(rgba, w, x, y, hash2(i, 3) > 0.7 ? [255, 255, 255] : [170, 180, 220]);
    }
  }
  const ce = theme.celestial;
  if (ce) {
    const cx = ce.x * w, cy = ce.y * h;
    const col = hex(ce.color);
    for (let y = Math.floor(cy - ce.r - 4); y <= cy + ce.r + 4; y++) {
      for (let x = Math.floor(cx - ce.r - 4); x <= cx + ce.r + 4; x++) {
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const d = Math.hypot(x - cx, y - cy);
        if (d <= ce.r) {
          let cc = col;
          if (ce.kind === 'moon' && hash2(x >> 1, y >> 1, 4) > 0.8) cc = shade(col, 0.85);
          if (ce.kind === 'planet') cc = Math.floor((y - cy) / 3) % 2 === 0 ? col : shade(col, 0.8);
          if (ce.kind === 'planet' && x - cx > ce.r * 0.4 - (y - cy) * 0.2) cc = shade(cc, 0.65);
          putPx(rgba, w, x, y, cc);
        } else if (ce.kind === 'sun' && d < ce.r + 4 && bayer(x, y) < 0.5 - (d - ce.r) / 8) {
          putPx(rgba, w, x, y, mix(col, hex(theme.sky[1]), 0.5));
        }
      }
    }
    if (ce.kind === 'planet') {
      for (let x = Math.floor(cx - ce.r * 1.8); x < cx + ce.r * 1.8; x++) {
        const y = Math.round(cy + (x - cx) * 0.25);
        if (x >= 0 && x < w && y >= 0 && y < h && Math.abs(x - cx) > ce.r * 0.7) putPx(rgba, w, x, y, shade(col, 1.3));
      }
    }
  }
  if (theme.clouds && withClouds) paintClouds(rgba, w, h, theme.clouds);
  return { w, h, rgba };
}

/** Clouds alone on a transparent sky-sized layer, so they can drift. */
export function generateClouds(theme: Theme): { w: number; h: number; rgba: Uint8ClampedArray } {
  const w = BG_W, h = 180;
  const rgba = new Uint8ClampedArray(w * h * 4);
  if (theme.clouds) paintClouds(rgba, w, h, theme.clouds);
  return { w, h, rgba };
}

function paintClouds(rgba: Uint8ClampedArray, w: number, h: number, color: string) {
  {
    const cc = hex(color);
    for (let i = 0; i < 6; i++) {
      const cx = hash2(i, 5, 2) * w, cy = 20 + hash2(i, 6, 2) * 60;
      const len = 18 + hash2(i, 7) * 26;
      for (let k = 0; k < 4; k++) {
        const bx = cx + (k - 1.5) * len * 0.3, by = cy - (k % 2) * 3, r = len * (0.22 + (k % 2) * 0.1);
        for (let y = Math.floor(by - r); y <= by + r * 0.5; y++)
          for (let x = Math.floor(bx - r); x <= bx + r; x++) {
            const xx = ((x % w) + w) % w;
            if (y < 0 || y >= h) continue;
            if (Math.hypot(x - bx, (y - by) * 1.4) <= r) putPx(rgba, w, xx, y, y > by ? shade(cc, 0.9) : cc);
          }
      }
    }
  }
}
