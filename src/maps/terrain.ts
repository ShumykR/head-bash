import { ART_PPM } from '../physics/constants';
import { RGB, hex, mix, hash2, bayer } from '../render/color';
import { PixelGrid, makeGrid, gget, gset, fillPoly } from '../render/grid';
import type { MapDef, Pt, TerrainMat } from './types';

/*
 * Terrain art, drawn the way the cars are: a dark outline, a bright rim on top, clean bands
 * of shade and a readable texture per material (stones, planks, plates, bricks, windows…).
 * No per-pixel noise: every texture is built from shapes that are shaded as a whole.
 */

export interface TerrainArt {
  grid: PixelGrid;
  /** Dark cave back wall (behind background props), when the map has one. */
  back: PixelGrid | null;
  palette: (RGB | null)[];
  /** World coords of grid pixel (0,0). */
  x0: number;
  y0: number;
  ppm: number;
}

/** outline, highlight, light, mid, dark, deep */
interface Ramp { o: RGB; hi: RGB; lt: RGB; md: RGB; dk: RGB; dd: RGB }
const ramp = (o: string, hi: string, lt: string, md: string, dk: string, dd: string): Ramp =>
  ({ o: hex(o), hi: hex(hi), lt: hex(lt), md: hex(md), dk: hex(dk), dd: hex(dd) });

/** Palette that grows as colors are used (index 0 stays transparent). */
class Palette {
  readonly list: (RGB | null)[] = [null];
  private ids = new Map<number, number>();
  id(c: RGB): number {
    const k = (c[0] << 16) | (c[1] << 8) | c[2];
    let i = this.ids.get(k);
    if (i !== undefined) return i;
    if (this.list.length < 256) {
      i = this.list.length;
      this.list.push(c);
    } else {
      let best = 1, bd = Infinity;
      for (let j = 1; j < this.list.length; j++) {
        const q = this.list[j]!;
        const d = (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2 + (q[2] - c[2]) ** 2;
        if (d < bd) { bd = d; best = j; }
      }
      i = best;
    }
    this.ids.set(k, i);
    return i;
  }
}

/* ------------------------------------------------------------------ */
/* Pattern helpers                                                     */
/* ------------------------------------------------------------------ */

/** Voronoi cell id at a pixel and whether it sits on a joint. */
function cell(x: number, y: number, size: number, sy: number, seed: number): { id: number; edge: boolean; cx: number; cy: number } {
  const gx0 = Math.floor(x / size), gy0 = Math.floor(y / (size * sy));
  let d1 = 1e9, d2 = 1e9, id = 0, cx = 0, cy = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const gx = gx0 + i, gy = gy0 + j;
    const px = (gx + 0.15 + hash2(gx, gy, seed) * 0.7) * size;
    const py = (gy + 0.15 + hash2(gx, gy, seed + 1) * 0.7) * size * sy;
    const dx = x + 0.5 - px, dy = (y + 0.5 - py) / sy;
    const d = dx * dx + dy * dy;
    if (d < d1) { d2 = d1; d1 = d; id = gx * 7919 + gy * 31 + 7; cx = px; cy = py; } else if (d < d2) d2 = d;
  }
  return { id, edge: Math.sqrt(d2) - Math.sqrt(d1) < 1.05, cx, cy };
}

/**
 * Beveled stones: dark joints, a lit top-left edge, a shaded bottom-right edge, and
 * one flat tone per stone (two tones alternate so the wall does not look printed).
 */
function stones(x: number, y: number, r: Ramp, size: number, sy = 0.75, seed = 11): RGB {
  const c = cell(x, y, size, sy, seed);
  if (c.edge) return r.dd;
  const up = cell(x, y - 1, size, sy, seed), lf = cell(x - 1, y, size, sy, seed);
  if (up.edge || lf.edge) return r.lt;
  const dn = cell(x, y + 1, size, sy, seed), rt = cell(x + 1, y, size, sy, seed);
  if (dn.edge || rt.edge) return r.dk;
  const v = hash2(c.id, 3, seed);
  // a small glint on bigger stones
  if (v > 0.55 && Math.abs(x + 0.5 - (c.cx - size * 0.22)) < 1 && Math.abs(y + 0.5 - (c.cy - size * sy * 0.22)) < 1) return r.hi;
  return v > 0.66 ? mix(r.md, r.lt, 0.35) : v < 0.22 ? mix(r.md, r.dk, 0.4) : r.md;
}

/** Rectangular blocks in running bond: bricks, planks, plates. */
function blocks(x: number, y: number, bw: number, bh: number, offset: number): { lx: number; ly: number; id: number } {
  const row = Math.floor(y / bh);
  const xx = x + (row % 2) * offset;
  const col = Math.floor(xx / bw);
  return { lx: xx - col * bw, ly: y - row * bh, id: col * 131 + row * 17 };
}

function bricks(x: number, y: number, r: Ramp, bw = 14, bh = 6): RGB {
  const b = blocks(x, y, bw, bh, bw / 2);
  if (b.ly === 0 || b.lx === 0) return r.dd;
  if (b.ly === 1 || b.lx === 1) return r.lt;
  if (b.ly === bh - 1 || b.lx === bw - 1) return r.dk;
  const v = hash2(b.id, 5);
  return v > 0.7 ? mix(r.md, r.lt, 0.3) : v < 0.2 ? mix(r.md, r.dk, 0.35) : r.md;
}

function planks(x: number, y: number, r: Ramp): RGB {
  const bh = 7;
  const b = blocks(x, y, 42, bh, 17 + (Math.floor(y / bh) % 3) * 6);
  if (b.ly === 0 || b.lx === 0) return r.dd;
  if (b.ly === 1) return r.lt;
  if (b.ly === bh - 1) return r.dk;
  // nails at both plank ends
  if ((b.lx === 3 || b.lx === 39) && b.ly === 3) return r.hi;
  if ((b.lx === 3 || b.lx === 39) && b.ly === 4) return r.dd;
  // grain: short dark streaks along the plank
  const g = Math.floor((b.lx + hash2(b.id, 2) * 40) / 9);
  if (b.ly === 2 + Math.floor(hash2(b.id, g) * 4) && hash2(b.id, g, 4) > 0.45 && (b.lx % 9) > 2) return r.dk;
  return hash2(b.id, 9) > 0.6 ? mix(r.md, r.lt, 0.25) : r.md;
}

function plates(x: number, y: number, r: Ramp, pw = 26, ph = 16): RGB {
  const b = blocks(x, y, pw, ph, 0);
  if (b.ly === 0 || b.lx === 0) return r.dd;
  if (b.ly === 1 || b.lx === 1) return r.lt;
  if (b.ly === ph - 1 || b.lx === pw - 1) return r.dk;
  const rv = (b.lx === 4 || b.lx === pw - 5) && (b.ly === 4 || b.ly === ph - 5);
  if (rv) return r.hi;
  if ((b.lx === 5 || b.lx === pw - 4) && (b.ly === 5 || b.ly === ph - 4)) return r.dk;
  // soft diagonal sheen across each plate
  const t = b.lx - b.ly;
  if (t > 6 && t < 9) return mix(r.md, r.lt, 0.45);
  return r.md;
}

/** Pebbles scattered in soil: round stones with a lit top. Returns null between them. */
function pebbles(x: number, y: number, r: Ramp, size: number, chance: number, seed: number): RGB | null {
  const gx = Math.floor(x / size), gy = Math.floor(y / size);
  if (hash2(gx, gy, seed) > chance) return null;
  const rx = 1.6 + hash2(gx, gy, seed + 1) * (size * 0.22), ry = rx * 0.7;
  const cx = gx * size + size / 2 + (hash2(gx, gy, seed + 2) - 0.5) * size * 0.4;
  const cy = gy * size + size / 2 + (hash2(gx, gy, seed + 3) - 0.5) * size * 0.4;
  const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
  const d = dx * dx + dy * dy;
  if (d > 1) return null;
  if (d > 0.62) return r.o;
  if (dy < -0.25 && dx < 0.3) return dy < -0.55 && dx < -0.1 ? r.hi : r.lt;
  return dy > 0.35 ? r.dk : r.md;
}

/** Soil body: flat tone, wavy strata lines and the odd pebble. */
function soil(x: number, y: number, r: Ramp, pr: Ramp, seed: number): RGB {
  const p = pebbles(x, y, pr, 17, 0.32, seed);
  if (p) return p;
  const wave = Math.round(Math.sin(x * 0.11 + Math.floor(y / 13) * 1.7) * 2);
  const ly = (y + wave) % 13;
  if (ly === 0 && hash2(Math.floor(x / 11), Math.floor(y / 13), seed) > 0.35) return r.dk;
  if (ly === 1 && hash2(Math.floor(x / 11), Math.floor(y / 13), seed) > 0.35) return mix(r.md, r.lt, 0.35);
  return r.md;
}

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

const DIRT = ramp('#2a160c', '#d39a64', '#ab723f', '#8a5631', '#6a3f22', '#48291a');
const PEBBLE = ramp('#2a1a12', '#e2d6c4', '#b8aa98', '#968878', '#76695c', '#554a40');

interface Surface {
  r: Ramp;
  /** Base thickness (px) and how far the scalloped lip hangs below it. */
  thick: number;
  lip: number;
  /** Blades/tufts sticking out of the top. */
  tufts?: 'grass' | 'dead';
  /** Optional custom paint of the surface band (row = 0 is the outline row). */
  paint?: (x: number, row: number, thick: number) => RGB | null;
}

interface MatArt {
  surface?: Surface;
  body: Ramp;
  paint: (x: number, y: number, top: number) => RGB;
  /** Rim-lit from every side (cave materials). */
  rim?: boolean;
}

const pitchStripe = (x: number) => Math.floor(x / 14) % 2 === 0;

const MATS: Record<TerrainMat, MatArt> = {
  grass: {
    surface: { r: ramp('#16260f', '#dcf77e', '#92e04e', '#56b83a', '#34902e', '#226628'), thick: 6, lip: 3, tufts: 'grass' },
    body: DIRT,
    paint: (x, y) => soil(x, y, DIRT, PEBBLE, 21),
  },
  rock: {
    body: ramp('#1b1b24', '#e2ded6', '#aeaaa8', '#8c8892', '#69656f', '#47444f'),
    paint: (x, y) => stones(x, y, MATS.rock.body, 17, 0.7, 13),
  },
  sand: {
    surface: { r: ramp('#4a2e14', '#fff6cc', '#ffe69a', '#f6d07a', '#e0b060', '#c48c40'), thick: 4, lip: 1 },
    body: ramp('#4a2e14', '#fff0b8', '#f8d888', '#efc26c', '#d6a24e', '#b07c34'),
    paint: (x, y) => {
      const r = MATS.sand.body;
      const p = pebbles(x, y, ramp('#4a2e14', '#fff6dc', '#f2dcb0', '#d8b880', '#b8945c', '#8a6a40'), 23, 0.18, 7);
      if (p) return p;
      const wave = Math.round(Math.sin(x * 0.09 + Math.floor(y / 9)) * 2.2);
      const band = Math.floor((y + wave) / 9);
      const ly = (y + wave) - band * 9;
      if (ly === 0) return r.dk;
      return band % 2 ? r.md : mix(r.md, r.lt, 0.5);
    },
  },
  metal: {
    surface: {
      r: ramp('#12141a', '#f2f6fb', '#c4ced9', '#2a2a30', '#ffcc2a', '#1e1e24'), thick: 7, lip: 0,
      // hazard stripes along the edge
      paint: (x, row) => (row === 1 ? hex('#f2f6fb') : row === 2 ? hex('#a8b4c4') : row === 6 ? hex('#12141a') : (x + row) % 8 < 4 ? hex('#ffcc2a') : hex('#24242a')),
    },
    body: ramp('#12141a', '#eef3f8', '#aab6c6', '#7a8698', '#566174', '#3a4252'),
    paint: (x, y) => plates(x, y, MATS.metal.body),
  },
  ice: {
    surface: { r: ramp('#142a44', '#ffffff', '#f2fbff', '#dcf2ff', '#b6dcf2', '#8cc0e2'), thick: 4, lip: 2 },
    body: ramp('#142a44', '#f4fdff', '#c4ecff', '#92d6f6', '#62b0de', '#3e86bc'),
    paint: (x, y) => {
      const r = MATS.ice.body;
      const c = cell(x, y, 22, 0.8, 41);
      if (c.edge) return r.dd;
      if (cell(x, y - 1, 22, 0.8, 41).edge || cell(x - 1, y, 22, 0.8, 41).edge) return r.hi;
      if (cell(x, y + 1, 22, 0.8, 41).edge || cell(x + 1, y, 22, 0.8, 41).edge) return r.dk;
      // two diagonal shine streaks in the upper-left of each block
      const t = (x - c.cx) + (y - c.cy);
      if ((t > -9 && t < -7) || (t > -5 && t < -4)) return x < c.cx ? r.lt : r.md;
      return hash2(c.id, 1) > 0.6 ? mix(r.md, r.lt, 0.3) : r.md;
    },
  },
  wood: {
    surface: { r: ramp('#2a1408', '#ffd89a', '#e8aa62', '#c4843f', '#9a5e2a', '#6a3a18'), thick: 4, lip: 0 },
    body: ramp('#2a1408', '#f2c27e', '#d39250', '#b5763a', '#8c5426', '#5e3416'),
    paint: (x, y) => planks(x, y, MATS.wood.body),
  },
  snow: {
    surface: { r: ramp('#22304a', '#ffffff', '#f6faff', '#e2ecfa', '#b9cae6', '#8ea4cc'), thick: 8, lip: 4 },
    body: ramp('#1c2232', '#c2cee4', '#94a2bc', '#717e98', '#566079', '#3c445c'),
    paint: (x, y) => stones(x, y, MATS.snow.body, 16, 0.7, 17),
  },
  moon: {
    surface: { r: ramp('#18181f', '#f4f2fa', '#d4d2de', '#b6b4c4', '#9896aa', '#787690'), thick: 3, lip: 1 },
    body: ramp('#18181f', '#eceaf4', '#c4c2d0', '#a6a4b4', '#84829a', '#605e76'),
    paint: (x, y) => {
      const r = MATS.moon.body;
      const S = 20;
      for (let j = -1; j <= 0; j++) for (let i = -1; i <= 0; i++) {
        const gx = Math.floor(x / S) + i + (x % S >= S / 2 ? 1 : 0), gy = Math.floor(y / S) + j + (y % S >= S / 2 ? 1 : 0);
        if (hash2(gx, gy, 5) > 0.55) continue;
        const rr = 3 + hash2(gx, gy, 9) * 5;
        const cx = gx * S + hash2(gx, gy, 6) * S * 0.5, cy = gy * S + hash2(gx, gy, 7) * S * 0.5;
        const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) / 0.7;
        const d = Math.hypot(dx, dy);
        if (d > rr) continue;
        if (d > rr - 1.2) return dy < 0 ? r.dk : r.lt; // rim: shadowed far wall, lit near lip
        return dy < -rr * 0.2 ? r.dd : r.dk;
      }
      const ly = (y + Math.round(Math.sin(x * 0.07) * 2)) % 16;
      return ly === 0 ? mix(r.md, r.dk, 0.5) : r.md;
    },
  },
  neon: {
    surface: {
      r: ramp('#06040e', '#ff8ae8', '#ff4fd8', '#3a2e66', '#2c2454', '#1c1636'), thick: 6, lip: 0,
      paint: (_x, row) => (row === 1 ? hex('#ffd0f6') : row === 2 ? hex('#ff4fd8') : row === 3 ? hex('#5a4a90') : row === 4 ? hex('#3a2e66') : hex('#14102a')),
    },
    body: ramp('#06040e', '#5ef0ff', '#3c3070', '#241c46', '#1a1436', '#110d26'),
    paint: (x, y) => {
      const r = MATS.neon.body;
      const lx = x % 30, ly = y % 11;
      if (lx < 3) return lx === 1 ? r.lt : r.dk; // pilaster
      const wx = (lx - 3) % 9, wy = ly;
      if (wx >= 2 && wx <= 6 && wy >= 3 && wy <= 8) {
        const id = Math.floor(x / 9) * 31 + Math.floor(y / 11);
        const on = hash2(id, 4) > 0.45;
        if (!on) return wy === 3 ? hex('#2c2454') : hex('#0c0a1c');
        const lit = [hex('#5ef0ff'), hex('#ffd86a'), hex('#ff8ae8')][Math.floor(hash2(id, 6) * 3)];
        return wy === 3 ? mix(lit, [255, 255, 255], 0.55) : wy === 8 ? mix(lit, [0, 0, 0], 0.3) : lit;
      }
      if (wy === 9 && wx >= 1 && wx <= 7) return r.lt; // sill
      return r.md;
    },
  },
  brick: {
    body: ramp('#2a0e0a', '#f2b090', '#d8704e', '#b84a34', '#8e3426', '#4e1a14'),
    paint: (x, y) => bricks(x, y, MATS.brick.body),
  },
  grave: {
    surface: { r: ramp('#120a18', '#d2acf6', '#9a72d2', '#6a4a9a', '#48326e', '#2e2048'), thick: 5, lip: 2, tufts: 'dead' },
    body: ramp('#0e0a12', '#7a6676', '#584654', '#40323e', '#2e232e', '#1e1620'),
    paint: (x, y) => {
      const r = MATS.grave.body;
      // the odd buried bone
      const gx = Math.floor(x / 31), gy = Math.floor(y / 23);
      if (hash2(gx, gy, 77) < 0.07) {
        const bx = gx * 31 + 9, by = gy * 23 + 11, lx = x - bx, ly = y - by;
        const knob = (Math.abs(lx) <= 1 || Math.abs(lx - 11) <= 1) && ly >= -1 && ly <= 2;
        if (knob || (lx >= 0 && lx <= 11 && ly >= 0 && ly <= 1)) return ly <= 0 ? hex('#fff4dc') : hex('#cbbc9c');
        if ((knob || (lx >= 0 && lx <= 11 && ly >= -1 && ly <= 2)) && Math.abs(lx - 5) < 9) return hex('#1a1218');
      }
      return soil(x, y, r, ramp('#0e0a12', '#a89aa8', '#7c6e7c', '#5c505c', '#463c46', '#2e262e'), 33);
    },
  },
  basalt: {
    surface: { r: ramp('#0c0808', '#9a8078', '#6e5a54', '#54443f', '#3e3230', '#2c2322'), thick: 3, lip: 1 },
    body: ramp('#0c0808', '#7e6862', '#5a4a46', '#433634', '#2f2524', '#1c1616'),
    paint: (x, y) => {
      const r = MATS.basalt.body;
      const c = cell(x, y, 15, 1.1, 51);
      if (c.edge) {
        // some joints are glowing cracks
        const a = cell(x, y, 15, 1.1, 51);
        return hash2(a.id, 2) > 0.72 ? hex('#ff6a1a') : r.dd;
      }
      const nearCrack = [cell(x, y - 1, 15, 1.1, 51), cell(x - 1, y, 15, 1.1, 51), cell(x, y + 1, 15, 1.1, 51), cell(x + 1, y, 15, 1.1, 51)].some((n) => n.edge && hash2(n.id, 2) > 0.72);
      if (nearCrack) return hex('#a8401a');
      if (cell(x, y - 1, 15, 1.1, 51).edge || cell(x - 1, y, 15, 1.1, 51).edge) return r.lt;
      if (cell(x, y + 1, 15, 1.1, 51).edge || cell(x + 1, y, 15, 1.1, 51).edge) return r.dk;
      return hash2(c.id, 3) > 0.6 ? mix(r.md, r.lt, 0.3) : r.md;
    },
  },
  turf: {
    surface: {
      r: ramp('#0c1e0e', '#ffffff', '#86e070', '#52c452', '#3aa23e', '#28782c'), thick: 7, lip: 2, tufts: 'grass',
      paint: (x, row, thick) => {
        if (row === 1) return hex('#ffffff'); // chalk line
        if (row === 2) return hex('#c8f0b4');
        if (row >= thick - 1) return hex('#28782c');
        return pitchStripe(x) ? hex('#5ccc58') : hex('#44b046');
      },
    },
    body: DIRT,
    paint: (x, y) => soil(x, y, DIRT, PEBBLE, 25),
  },
  track: {
    surface: {
      r: ramp('#5a2006', '#ffe2b8', '#ffa64a', '#ff8c1a', '#d8680a', '#a84a06'), thick: 8, lip: 0,
      paint: (x, row) => (row === 1 ? hex('#ffe2b8') : row === 2 ? hex('#ffa64a') : row === 4 && Math.floor(x / 8) % 2 === 0 ? hex('#ffffff') : row === 7 ? hex('#a84a06') : row === 6 ? hex('#d8680a') : hex('#ff8c1a')),
    },
    body: ramp('#1a1420', '#ffffff', '#d8d0e0', '#a098b0', '#3a3044', '#241c2c'),
    paint: (x, y) => {
      // stacked toy bricks with studs
      const b = blocks(x, y, 20, 10, 10);
      const cols = [ramp('#3a0a0a', '#ffb0a0', '#ff7a6a', '#ec4a3c', '#b8302a', '#801e1a'), ramp('#0a1a3a', '#bcd8ff', '#7ab0ff', '#4a86ec', '#3060b8', '#1e3e80'), ramp('#3a2a04', '#fff4b0', '#ffe066', '#ffcc2a', '#d8a018', '#a07010'), ramp('#0a2a10', '#c4f4b0', '#7ad86a', '#46b84a', '#2e8a36', '#1e6026')];
      const row = Math.floor(y / 10);
      const r = cols[Math.floor(hash2(Math.floor((x + (row % 2) * 10) / 60), Math.floor(row / 3), 3) * 4)];
      if (b.ly === 0 || b.lx === 0) return r.dd;
      if (b.ly === 1 || b.lx === 1) return r.lt;
      if (b.ly === 9 || b.lx === 19) return r.dk;
      const sx = (b.lx - 2) % 6;
      if (b.ly >= 3 && b.ly <= 5 && sx >= 1 && sx <= 3 && b.lx < 18) return b.ly === 3 ? r.hi : sx === 3 || b.ly === 5 ? r.dk : r.lt;
      return r.md;
    },
  },
  void: {
    surface: { r: ramp('#08040e', '#ffc4f4', '#ff8ae8', '#b45ae0', '#7a3cbe', '#4e2488'), thick: 4, lip: 2 },
    body: ramp('#08040e', '#b48ae8', '#6a40b0', '#4a2c80', '#33205e', '#22143e'),
    paint: (x, y) => {
      const r = MATS.void.body;
      const c = cell(x, y, 16, 0.9, 61);
      if (c.edge) return hash2(c.id, 2) > 0.6 ? hex('#ff8ae8') : r.dd;
      if (cell(x, y - 1, 16, 0.9, 61).edge || cell(x - 1, y, 16, 0.9, 61).edge) return r.lt;
      if (cell(x, y + 1, 16, 0.9, 61).edge || cell(x + 1, y, 16, 0.9, 61).edge) return r.dk;
      // embedded crystal shards
      const t = (x - c.cx) * 0.6 - (y - c.cy);
      if (hash2(c.id, 5) > 0.7 && Math.abs(x - c.cx) < 2.5 && Math.abs(t) < 3) return x < c.cx ? hex('#d8f8ff') : hex('#5ef0ff');
      return hash2(c.id, 3) > 0.6 ? mix(r.md, r.lt, 0.3) : r.md;
    },
  },
  asphalt: {
    surface: {
      r: ramp('#0a0a0e', '#bcbcc6', '#6e6e78', '#4c4c55', '#3a3a42', '#26262c'), thick: 9, lip: 0,
      paint: (x, row) => (row === 1 ? hex('#bcbcc6') : row === 2 ? hex('#7a7a84') : row === 5 && Math.floor(x / 10) % 2 === 0 ? hex('#ffd23f') : row === 8 ? hex('#26262c') : (x * 7 + row * 3) % 29 === 0 ? hex('#5e5e68') : hex('#4c4c55')),
    },
    body: ramp('#0a0a0e', '#c8c8d0', '#9a9aa4', '#7c7c86', '#5e5e68', '#40404a'),
    paint: (x, y) => plates(x, y, MATS.asphalt.body, 32, 18),
  },
  tile: {
    surface: { r: ramp('#2a1004', '#fff4b0', '#ffd84a', '#ecb42a', '#c0861a', '#8a5a10'), thick: 4, lip: 0 },
    body: ramp('#1a0606', '#ffd84a', '#c83a30', '#a42220', '#7a1618', '#4a0a0c'),
    paint: (x, y) => {
      const r = MATS.tile.body;
      const b = blocks(x, y, 24, 18, 12);
      if (b.ly === 0 || b.lx === 0) return hex('#5a0e10');
      if (b.ly === 1 || b.lx === 1) return hex('#e8a030'); // gold frame
      if (b.ly === 17 || b.lx === 23) return hex('#8a5a10');
      if (b.ly === 2 || b.lx === 2) return r.lt;
      // a gold coin ornament in the middle of each panel
      const d = Math.hypot(b.lx - 12, (b.ly - 9) * 1.1);
      if (d < 3.6 && (b.id & 1)) return d < 1.2 ? hex('#8a5a10') : d < 2.6 ? hex('#ffd84a') : hex('#c0861a');
      return r.md;
    },
  },
  // rim-lit cave materials: outline, bright rim, glow, then the textured body
  cave: {
    rim: true,
    surface: { r: ramp('#120a1a', '#fbe8d6', '#d8b4c0', '#a080a4', '#6c5682', '#3c2e52'), thick: 0, lip: 0 },
    body: ramp('#120a1a', '#a286b8', '#7c64a0', '#5e4a7a', '#463862', '#271c36'),
    paint: (x, y) => stones(x, y, MATS.cave.body, 13, 0.8, 71),
  },
  steel: {
    rim: true,
    surface: { r: ramp('#0c1018', '#f2f8ff', '#c8d6e8', '#98aac4', '#7e92b0', '#4c5e7c'), thick: 0, lip: 0 },
    body: ramp('#0c1018', '#c8d6e8', '#94a8c4', '#6e82a0', '#566a88', '#34425a'),
    paint: (x, y) => plates(x, y, MATS.steel.body, 22, 14),
  },
  amber: {
    rim: true,
    surface: { r: ramp('#2a1004', '#fff6c0', '#ffd860', '#ffb838', '#ee962a', '#b0600c'), thick: 0, lip: 0 },
    body: ramp('#2a1004', '#fff0a0', '#ffc444', '#f09a24', '#c87414', '#7e3c06'),
    paint: (x, y) => {
      const r = MATS.amber.body;
      const c = cell(x, y, 19, 1.2, 81);
      if (c.edge) return r.dd;
      if (cell(x, y - 1, 19, 1.2, 81).edge || cell(x - 1, y, 19, 1.2, 81).edge) return r.hi;
      if (cell(x, y + 1, 19, 1.2, 81).edge || cell(x + 1, y, 19, 1.2, 81).edge) return r.dk;
      // a dark speck (trapped insect) in some crystals
      if (hash2(c.id, 4) > 0.8 && Math.abs(x - c.cx) < 1.5 && Math.abs(y - c.cy) < 1) return hex('#5a2a06');
      const t = (x - c.cx) - (y - c.cy) * 0.5;
      return t < -2 ? r.lt : hash2(c.id, 3) > 0.5 ? r.md : mix(r.md, r.dk, 0.35);
    },
  },
  girder: {
    rim: true,
    body: ramp('#0a0c12', '#f2f6fc', '#c4ccd8', '#949cac', '#6c7482', '#4a505c'),
    paint: () => MATS.girder.body.md,
  },
};

const BACK = ramp('#07050c', '#2a2238', '#221b2e', '#1b1526', '#16111f', '#0e0b16');

/** Hanging lip below a surface band: scallops of varying length. */
function lipDepth(x: number, amp: number, seed: number): number {
  if (amp <= 0) return 0;
  const c = Math.floor(x / 7);
  const len = Math.round(hash2(c, seed, 3) * amp);
  const lx = x - c * 7;
  return Math.max(0, Math.round(len * (1 - Math.abs(lx - 3) / 3.6)));
}

/* ------------------------------------------------------------------ */
/* Generator                                                           */
/* ------------------------------------------------------------------ */

/** Breadth-first distance (4-neighbour) from every `src` pixel, capped. */
function distanceFrom(w: number, h: number, isSrc: (i: number) => boolean, cap: number): Int16Array {
  const dist = new Int16Array(w * h).fill(cap + 1);
  const q = new Int32Array(w * h);
  let qn = 0;
  for (let i = 0; i < w * h; i++) if (isSrc(i)) { dist[i] = 0; q[qn++] = i; }
  for (let k = 0; k < qn; k++) {
    const i = q[k], d = dist[i];
    if (d >= cap) continue;
    const x = i % w;
    if (x > 0 && dist[i - 1] > d + 1) { dist[i - 1] = d + 1; q[qn++] = i - 1; }
    if (x < w - 1 && dist[i + 1] > d + 1) { dist[i + 1] = d + 1; q[qn++] = i + 1; }
    if (i >= w && dist[i - w] > d + 1) { dist[i - w] = d + 1; q[qn++] = i - w; }
    if (i < w * (h - 1) && dist[i + w] > d + 1) { dist[i + w] = d + 1; q[qn++] = i + w; }
  }
  return dist;
}

const MAT_LIST = Object.keys(MATS) as TerrainMat[];

/** Rasterize map solids into a shaded pixel-art grid. Pure, deterministic. */
export function generateTerrain(map: MapDef, ppm = ART_PPM): TerrainArt {
  const pad = 6;
  const x0 = map.bounds.x0 - pad, y0 = map.bounds.y0 - pad;
  const w = Math.ceil((map.bounds.x1 - map.bounds.x0 + pad * 2) * ppm);
  const h = Math.ceil((map.bounds.y1 - map.bounds.y0 + pad * 2) * ppm);
  // Textures are designed at the game's art resolution; thumbnails sample them coarser.
  const k = ART_PPM / ppm;
  const matGrid = makeGrid(w, h);
  const toPx = (pts: Pt[]) => pts.map(([x, y]) => [(x - x0) * ppm, (y - y0) * ppm] as [number, number]);
  for (const s of map.solids) {
    const id = MAT_LIST.indexOf(s.mat) + 1;
    fillPoly(toPx(s.pts), w, h, (x, y) => gset(matGrid, x, y, id));
  }
  const pal = new Palette();
  const out = makeGrid(w, h);
  const solid = (i: number) => matGrid.data[i] !== 0;
  const air = distanceFrom(w, h, (i) => !solid(i), 16);
  // vertical depth from the air above, and height above the air below
  const top = new Int16Array(w * h), bot = new Int16Array(w * h);
  for (let x = 0; x < w; x++) {
    let d = 0;
    for (let y = 0; y < h; y++) { d = matGrid.data[y * w + x] ? d + 1 : 0; top[y * w + x] = d; }
    d = 0;
    for (let y = h - 1; y >= 0; y--) { d = matGrid.data[y * w + x] ? d + 1 : 0; bot[y * w + x] = d; }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const m = matGrid.data[i];
      if (!m) continue;
      const mat = MAT_LIST[m - 1];
      const art = MATS[mat];
      // art-space coordinates so patterns keep their size at any ppm
      const ax = Math.floor(x * k), ay = Math.floor(y * k);
      const a = air[i], t = Math.ceil(top[i] * k), b = Math.ceil(bot[i] * k);
      const c = shadePixel(mat, art, ax, ay, a, t, b, k, matGrid, x, y);
      if (c) gset(out, x, y, pal.id(c));
    }
  }

  // Tufts of grass along the top of grassy ground (render only, in the air above it).
  for (let x = 0; x < w; x++) {
    for (let y = 1; y < h; y++) {
      const m = matGrid.data[y * w + x];
      if (!m || matGrid.data[(y - 1) * w + x]) continue;
      const s = MATS[MAT_LIST[m - 1]].surface;
      if (!s?.tufts || k > 1.5) continue;
      tuft(out, pal, matGrid, x, y, s);
    }
  }

  // Dark back wall behind caves (render only), on its own layer.
  let backOut: PixelGrid | null = null;
  if (map.backdrop) {
    backOut = makeGrid(w, h);
    const back = makeGrid(w, h);
    for (const bd of map.backdrop) fillPoly(toPx(bd), w, h, (x, y) => gset(back, x, y, 1));
    const fromRock = distanceFrom(w, h, solid, 12);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!back.data[i] || matGrid.data[i]) continue;
        const ax = Math.floor(x * k), ay = Math.floor(y * k);
        let c = stones(ax, ay, BACK, 15, 0.8, 91);
        const d = fromRock[i] * k;
        // soft contact shadow next to the rock
        if (d < 4 || (d < 8 && bayer(x, y) * 8 > d - 3)) c = c === BACK.dd ? BACK.o : mix(c, BACK.o, 0.6);
        gset(backOut, x, y, pal.id(c));
      }
    }
  }
  return { grid: out, back: backOut, palette: pal.list, x0, y0, ppm };
}

function shadePixel(mat: TerrainMat, art: MatArt, x: number, y: number, a: number, t: number, b: number, k: number, grid: PixelGrid, gx: number, gy: number): RGB | null {
  const body = art.body;
  if (art.rim) {
    if (mat === 'girder') {
      let up = 0;
      while (up < 40 && gget(grid, gx, gy - up - 1) === gget(grid, gx, gy)) up++;
      return girderPixel(body, gx, gy, up + 1, grid, k);
    }
    const s = art.surface!.r;
    const d = a * k;
    if (d <= 1) return s.o;
    if (d <= 2) return s.hi;
    if (d <= 3) return s.lt;
    if (d <= 5) return s.md;
    if (d <= 7 && bayer(gx, gy) * 2 < 8 - d) return s.dk;
    return depthTint(art.paint(x, y, t), body, t);
  }
  // outline on every face
  if (a <= 1) return (art.surface && t <= art.surface.thick + 2 ? art.surface.r : body).o;
  const surf = art.surface;
  if (surf) {
    const thick = surf.thick + lipDepth(x, surf.lip, 3);
    if (t <= thick) {
      if (surf.paint) {
        const c = surf.paint(x, t - 1, thick);
        if (c) return underside(c, surf.r, b);
      }
      const r = surf.r;
      const c = t === 2 ? r.hi : t === 3 ? r.lt : t >= thick ? r.dk : t === thick - 1 && thick > 5 ? mix(r.md, r.dk, 0.5) : r.md;
      return underside(c, r, b);
    }
    // contact shadow under the lip
    if (t <= thick + 2) return underside(t === thick + 1 ? body.dd : mix(body.dk, body.dd, 0.5), body, b);
  } else {
    // bare top edge: one bright row, one light row
    if (t === 2) return body.hi;
    if (t === 3) return body.lt;
  }
  // lit side walls facing left
  return underside(depthTint(art.paint(x, y, t), body, t), body, b);
}

/** Bodies get darker in broad bands the deeper they go, with a one-row checker seam. */
function depthTint(c: RGB, r: Ramp, t: number): RGB {
  const band = (t - 34) / 46;
  const seam = band - Math.floor(band) < 0.03 && (t & 1);
  const n = Math.max(0, Math.min(2, Math.floor(band) + (seam ? 0 : 0)));
  if (n === 0) return c;
  return mix(c, r.dd, n === 1 ? 0.28 : 0.5);
}

/** Overhangs and floating islands: shade the bottom edge. */
function underside(c: RGB, r: Ramp, b: number): RGB {
  if (b <= 2) return r.dd;
  if (b <= 4) return mix(c, r.dd, 0.5);
  return c;
}

function girderPixel(r: Ramp, x: number, y: number, depthTop: number, grid: PixelGrid, _k: number): RGB | null {
  const id = gget(grid, x, y);
  let up = depthTop - 1, dn = 0;
  while (dn < 40 && gget(grid, x, y + dn + 1) === id) dn++;
  const H = up + dn + 1;
  if (up === 0 || dn === 0) return r.o;
  if (up === 1) return r.hi;
  if (dn === 1) return r.dk;
  if (up <= 1 || dn <= 1) return r.md;
  const cell = Math.max(6, H - 2);
  const lx = ((x % (cell * 2)) + cell * 2) % (cell * 2);
  const tt = (up - 1) / Math.max(1, H - 3);
  const diag = Math.abs(lx / cell - (lx < cell ? tt : 2 - tt)) * cell;
  if (lx < 3) return lx === 0 ? r.o : lx === 1 ? r.lt : r.dk;
  if (diag < 1.5) return diag < 0.5 ? r.lt : r.md;
  if (diag < 2.2) return r.o;
  return null;
}

/** A small clump of blades (and now and then a flower) standing on the ground at (x, y). */
function tuft(out: PixelGrid, pal: Palette, grid: PixelGrid, x: number, y: number, s: Surface) {
  const c = Math.floor(x / 5);
  const v = hash2(c, 11, 4);
  if (v < 0.35) return;
  const lx = x - c * 5;
  const hgt = [0, 1, 3, 2, 0][lx] + (v > 0.8 ? 1 : 0);
  if (hgt <= 0) return;
  const dead = s.tufts === 'dead';
  for (let j = 1; j <= hgt; j++) {
    if (gget(grid, x, y - j)) return;
    const col = j === hgt ? s.r.hi : j === 1 ? s.r.md : s.r.lt;
    gset(out, x, y - j, pal.id(col));
  }
  if (!dead && lx === 2 && hash2(c, 5, 9) > 0.86) {
    const fl = [hex('#ffffff'), hex('#ffe066'), hex('#ff8ac8')][Math.floor(hash2(c, 6) * 3)];
    gset(out, x, y - hgt - 1, pal.id(fl));
    gset(out, x - 1, y - hgt, pal.id(fl));
    gset(out, x + 1, y - hgt, pal.id(fl));
  }
}
