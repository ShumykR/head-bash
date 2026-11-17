import { RGB, hex, mix, shade, hash2 } from '../render/color';

/*
 * Parallax background layers, painted the way the terrain and the cars are: every object is a
 * silhouette with a dark outline, a lit top-left rim, a shaded bottom-right edge and its own
 * details. Far layers fade toward the sky colour (aerial perspective) and drop the outline.
 *
 * Painters also leave "emitters": spots where the renderer animates something small
 * (chimney smoke, blinking windows, glowing lanterns, camera flashes, drips, a windmill…).
 */

export const BG_W = 320;

export type EmitKind = 'smoke' | 'steam' | 'blink' | 'glow' | 'flash' | 'drip' | 'wisp' | 'twinkle' | 'mill' | 'shimmer' | 'lava';

export interface Emitter { x: number; y: number; kind: EmitKind; color: number; size: number; seed: number }

export interface BgLayer {
  w: number;
  h: number;
  rgba: Uint8ClampedArray;
  /** Horizontal parallax factor (0 = fixed, 1 = moves with world). */
  factor: number;
  /** Fraction of screen height where the layer's bottom sits. */
  bottom: number;
  /** Colour that fills the screen below (or above, for hanging layers) the strip. */
  fill: RGB;
  emitters: Emitter[];
}

export type LayerKind =
  | 'mountains' | 'hills' | 'trees' | 'city' | 'factory' | 'pines' | 'dunes' | 'islands' | 'crystals' | 'craters' | 'ruins'
  | 'graves' | 'volcanoes' | 'stands' | 'palms' | 'sea' | 'pagodas' | 'farm' | 'domewall' | 'blocks' | 'snowpines'
  | 'stalactites' | 'cavewall' | 'girders' | 'pipes';

export interface LayerSpec {
  kind: LayerKind;
  color: string;
  color2?: string;
  factor: number;
  bottom: number;
  height: number;
  seed: number;
  /** Hangs from the top of the screen (stalactites) and fills upward. */
  hang?: boolean;
}

/** outline, highlight, light, mid, dark */
interface Ramp { o: RGB; hi: RGB; lt: RGB; md: RGB; dk: RGB; group: number }

const WHITE: RGB = [255, 255, 255];

/** Periodic noise in [-1,1], tileable over width W. */
export function pnoise(x: number, W: number, seed: number, octaves = 4): number {
  let v = 0, amp = 1, tot = 0;
  for (let o = 0; o < octaves; o++) {
    const k = (o + 1) * (o + 1) + Math.floor(hash2(o, seed) * 3);
    const ph = hash2(seed, o) * Math.PI * 2;
    v += Math.sin((x / W) * Math.PI * 2 * k + ph) * amp;
    tot += amp;
    amp *= 0.5;
  }
  return v / tot;
}

/** A layer under construction: objects are painted as ids, then shaded all at once. */
class Canvas {
  readonly id: Int32Array;
  readonly rgba: Uint8ClampedArray;
  private ramps: (Ramp | null)[] = [null];
  private groups = 0;
  readonly emitters: Emitter[] = [];
  constructor(readonly w: number, readonly h: number, private haze: number, private sky: RGB, readonly outline: boolean) {
    this.id = new Int32Array(w * h);
    this.rgba = new Uint8ClampedArray(w * h * 4);
  }
  /** Ramp for a base colour, faded toward the sky by the layer's haze. */
  ramp(c: RGB | string, group = ++this.groups, punch = 1): Ramp {
    const b = typeof c === 'string' ? hex(c) : c;
    const f = (x: RGB) => mix(x, this.sky, this.haze);
    return {
      o: f(mix(shade(b, 0.42), [12, 8, 24], 0.35)),
      hi: f(mix(b, WHITE, 0.42 * punch)),
      lt: f(mix(b, WHITE, 0.2 * punch)),
      md: f(b),
      dk: f(shade(b, 1 - 0.24 * punch)),
      group,
    };
  }
  /** A new object id painted with ramp `r`. Objects of one group are shaded as one shape. */
  obj(r: Ramp): number {
    this.ramps.push(r);
    return this.ramps.length - 1;
  }
  wx(x: number) { return ((Math.round(x) % this.w) + this.w) % this.w; }
  set(x: number, y: number, k: number) {
    y = Math.round(y);
    if (y < 0 || y >= this.h) return;
    this.id[y * this.w + this.wx(x)] = k;
  }
  get(x: number, y: number) {
    if (y < 0) return 0;
    if (y >= this.h) y = this.h - 1;
    return this.id[y * this.w + this.wx(x)];
  }
  rect(k: number, x: number, y: number, w: number, h: number) {
    for (let j = Math.round(y); j < Math.round(y + h); j++) for (let i = Math.round(x); i < Math.round(x + w); i++) this.set(i, j, k);
  }
  ell(k: number, cx: number, cy: number, rx: number, ry: number) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, k);
      }
  }
  poly(k: number, pts: [number, number][]) {
    const ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const xs: number[] = [];
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > y + 0.5) !== (yj > y + 0.5)) xs.push(xi + ((y + 0.5 - yi) / (yj - yi)) * (xj - xi));
      }
      xs.sort((a, b) => a - b);
      for (let n = 0; n + 1 < xs.length; n += 2) for (let x = Math.ceil(xs[n] - 0.5); x <= Math.floor(xs[n + 1] - 0.5); x++) this.set(x, y, k);
    }
  }
  /** Fill a column from `top` down to the bottom of the layer. */
  col(k: number, x: number, top: number, bottom = this.h) {
    for (let y = Math.max(0, Math.round(top)); y < Math.min(this.h, bottom); y++) this.set(x, y, k);
  }
  line(k: number, x0: number, y0: number, x1: number, y1: number, t = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
      this.rect(k, Math.round(x - (t - 1) / 2), Math.round(y - (t - 1) / 2), t, t);
    }
  }
  emit(x: number, y: number, kind: EmitKind, color: string | number, size = 1, seed = 0) {
    this.emitters.push({ x: this.wx(x), y: Math.round(y), kind, color: typeof color === 'string' ? parseInt(color.slice(1), 16) : color, size, seed });
  }
  /** Shade every object: outline, lit top/left rim, shaded bottom/right rim, flat body. */
  shade() {
    const { w, h, id } = this;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const k = id[y * w + x];
        if (!k) continue;
        const r = this.ramps[k]!;
        const g = (dx: number, dy: number) => {
          const kk = this.get(x + dx, y + dy);
          return kk !== 0 && this.ramps[kk]!.group === r.group;
        };
        const front = (dx: number, dy: number) => {
          const kk = this.get(x + dx, y + dy);
          return kk === 0 || this.ramps[kk]!.group !== r.group;
        };
        let c = r.md;
        if (this.outline && (front(0, -1) || front(-1, 0) || front(1, 0) || (y < h - 1 && front(0, 1)))) c = r.o;
        else if (!g(0, -1) || (this.outline && !g(0, -2))) c = r.hi;
        else if (!g(-1, 0) || (this.outline && !g(-2, 0))) c = r.lt;
        else if (!g(1, 0) || (this.outline && !g(2, 0)) || (y < h - 2 && (!g(0, 1) || (this.outline && !g(0, 2))))) c = r.dk;
        this.put(x, y, c);
      }
  }
  /** Paint a detail pixel directly (after shading). */
  put(x: number, y: number, c: RGB) {
    y = Math.round(y);
    if (y < 0 || y >= this.h) return;
    const i = (y * this.w + this.wx(x)) * 4;
    this.rgba[i] = c[0]; this.rgba[i + 1] = c[1]; this.rgba[i + 2] = c[2]; this.rgba[i + 3] = 255;
  }
  /** Detail colour faded like the rest of the layer. */
  tint(c: RGB | string) {
    return mix(typeof c === 'string' ? hex(c) : c, this.sky, this.haze);
  }
  filled(x: number, y: number) {
    return this.get(x, y) !== 0;
  }
}

/* ------------------------------------------------------------------ */
/* Painters                                                            */
/* ------------------------------------------------------------------ */

type Painter = (c: Canvas, c1: RGB, c2: RGB, s: number) => void;

const P: Record<LayerKind, Painter> = {
  mountains(c, c1, c2, s) {
    const W = c.w, H = c.h;
    const lit = c.ramp(mix(c1, c2, 0.12));
    const sh = c.ramp(shade(c1, 0.8), lit.group);
    const snow = c.ramp(c2, lit.group);
    const snowSh = c.ramp(mix(c2, c1, 0.35), lit.group);
    const L = c.obj(lit), S = c.obj(sh), N = c.obj(snow), NS = c.obj(snowSh);
    const rid = (x: number) => 1 - Math.abs(pnoise(c.wx(x), W, s, 3));
    const top = (x: number) => H - (0.22 + 0.72 * rid(x)) * H;
    for (let x = 0; x < W; x++) {
      const t = top(x), slope = top(x + 2) - top(x - 2);
      const shadowSide = slope > 0.4;
      const ridge = rid(x);
      const snowLine = 3 + 7 * ridge + Math.floor(hash2(x >> 1, s, 2) * 3);
      for (let y = Math.round(t); y < H; y++) {
        const d = y - t;
        const inSnow = ridge > 0.5 && d < snowLine;
        c.set(x, y, inSnow ? (shadowSide ? NS : N) : shadowSide && d < (H - t) * 0.75 ? S : L);
      }
    }
    c.shade();
    // rock streaks running down the lit faces
    for (let x = 0; x < W; x += 3) {
      const t = top(x);
      if (hash2(x, s, 7) > 0.55 || top(x + 2) - top(x - 2) > 0.4) continue;
      const len = 4 + hash2(x, s, 8) * 10;
      for (let j = 0; j < len; j++) if (c.get(x - j * 0.4, t + 10 + j) === L) c.put(x - j * 0.4, t + 10 + j, lit.dk);
    }
  },

  hills(c, c1, c2, s) {
    const W = c.w, H = c.h;
    for (let i = 0; i < 9; i++) {
      const cx = (i / 9) * W + hash2(i, s) * 20, rx = 26 + hash2(i, s, 2) * 30, ry = H * (0.45 + hash2(i, s, 3) * 0.35);
      const k = c.obj(c.ramp(i % 2 ? c1 : mix(c1, c2, 0.3)));
      c.ell(k, cx, H, rx, ry);
      c.ell(k, cx + W, H, rx, ry);
    }
    c.shade();
    // bushes and little trees on the crests
    for (let x = 0; x < W; x += 2) {
      let t = 0;
      while (t < H && !c.filled(x, t)) t++;
      if (t >= H - 4 || hash2(x, s, 9) > 0.12) continue;
      const r = 2 + Math.floor(hash2(x, s, 10) * 3);
      for (let y = -r; y <= r; y++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + y * y > r * r) continue;
        c.put(x + dx, t - r + y + 1, dx + y < -r * 0.6 ? c.tint(mix(c2, WHITE, 0.25)) : dx + y > r * 0.6 ? c.tint(shade(c2, 0.75)) : c.tint(c2));
      }
    }
  },

  trees(c, c1, c2, s) {
    const W = c.w, H = c.h;
    const ground = c.obj(c.ramp(shade(c2, 0.9)));
    for (let x = 0; x < W; x++) c.col(ground, x, H - 5 + pnoise(x, W, s, 2) * 2);
    for (let i = 0; i < 24; i++) {
      const cx = (i / 24) * W + hash2(i, s) * 8, r = 6 + hash2(i, s, 2) * 7;
      const cy = H - 6 - r - hash2(i, s, 3) * 6;
      const leaf = c.ramp(i % 3 === 0 ? mix(c1, c2, 0.4) : c1);
      const trunk = c.obj(c.ramp('#5a3a22'));
      c.rect(trunk, cx - 1, cy, 3, H - cy);
      const k = c.obj(leaf);
      // a crown of three puffs
      c.ell(k, cx, cy, r, r * 0.85);
      c.ell(k, cx - r * 0.6, cy + r * 0.35, r * 0.62, r * 0.55);
      c.ell(k, cx + r * 0.6, cy + r * 0.3, r * 0.66, r * 0.58);
    }
    c.shade();
  },

  pines(c, c1, c2, s) { pineForest(c, c1, c2, s, false); },
  snowpines(c, c1, c2, s) { pineForest(c, c1, c2, s, true); },

  city(c, c1, c2, s) {
    const W = c.w, H = c.h;
    let x = 0, i = 0;
    while (x < W) {
      const bw = 12 + Math.floor(hash2(i, s) * 16);
      const bh = (0.3 + hash2(i, s, 2) * 0.62) * H;
      const top = H - bh;
      const k = c.obj(c.ramp(i % 3 === 1 ? mix(c1, WHITE, 0.08) : c1));
      c.rect(k, x, top, bw - 1, bh);
      // stepped top, antenna or water tower
      const v = hash2(i, s, 3);
      if (v < 0.3) c.rect(k, x + 3, top - 5, bw - 7, 5);
      else if (v < 0.55) c.line(k, x + bw / 2, top, x + bw / 2, top - 10);
      else if (v < 0.7) { c.rect(k, x + 3, top - 7, 6, 5); c.line(k, x + 4, top - 2, x + 4, top); c.line(k, x + 8, top - 2, x + 8, top); }
      buildings.push({ x, top, bw, k });
      x += bw; i++;
    }
    c.shade();
    for (const b of buildings.splice(0)) {
      for (let wy = b.top + 4; wy < H - 2; wy += 5)
        for (let wx = b.x + 3; wx < b.x + b.bw - 3; wx += 3) {
          const on = hash2(wx, wy, s) > 0.5;
          const col = on ? (hash2(wx, wy, s + 1) > 0.85 ? mix(c2, WHITE, 0.5) : c2) : shade(c1, 0.7);
          c.put(wx, wy, c.tint(col));
          c.put(wx, wy + 1, c.tint(on ? shade(col, 0.8) : shade(c1, 0.7)));
          if (on && hash2(wx, wy, s + 2) > 0.94) c.emit(wx, wy, 'blink', toNum(c2), 1, wx * 7 + wy);
        }
      if (b.top < H * 0.5 && hash2(b.x, s, 4) > 0.5) c.emit(b.x + b.bw / 2, b.top - 10, 'blink', 0xff3a3a, 1, b.x); // aircraft light
    }
  },

  factory(c, c1, c2, s) {
    const W = c.w, H = c.h;
    let x = 0, i = 0;
    while (x < W) {
      const bw = 26 + Math.floor(hash2(i, s) * 22);
      const bh = (0.3 + hash2(i, s, 2) * 0.35) * H;
      const top = H - bh;
      const k = c.obj(c.ramp(i % 2 ? c1 : mix(c1, WHITE, 0.06)));
      c.rect(k, x, top, bw - 1, bh);
      // saw-tooth roof
      for (let t = x; t < x + bw - 8; t += 8) c.poly(k, [[t, top], [t + 8, top], [t + 8, top - 5]]);
      buildings.push({ x, top, bw, k });
      // chimney
      if (hash2(i, s, 3) > 0.35) {
        const cx = x + 4 + Math.floor(hash2(i, s, 4) * (bw - 12));
        const ch = top - 14 - hash2(i, s, 5) * 24;
        const kc = c.obj(c.ramp(mix(c1, WHITE, 0.12)));
        c.rect(kc, cx, ch, 5, top - ch + 1);
        c.rect(kc, cx - 1, ch, 7, 2);
        c.emit(cx + 2.5, ch - 1, 'smoke', toNum(mix(c1, WHITE, 0.45)), 1, i);
      }
      x += bw; i++;
    }
    c.shade();
    for (const b of buildings.splice(0)) {
      for (let wy = b.top + 5; wy < H - 4; wy += 7)
        for (let wx = b.x + 3; wx < b.x + b.bw - 5; wx += 6) {
          if (hash2(wx, wy, s) < 0.3) continue;
          for (let j = 0; j < 3; j++) for (let q = 0; q < 3; q++) c.put(wx + q, wy + j, c.tint(j === 0 ? mix(c2, WHITE, 0.4) : c2));
          if (hash2(wx, wy, s + 3) > 0.9) c.emit(wx + 1, wy + 1, 'blink', toNum(c2), 2, wx + wy);
        }
      // hazard stripe along the roofline
      for (let q = b.x + 1; q < b.x + b.bw - 2; q++) if (c.filled(q, b.top + 1)) c.put(q, b.top + 2, c.tint(Math.floor(q / 3) % 2 ? '#ffcc2a' : '#24242a'));
    }
  },

  dunes(c, c1, c2, s) {
    const W = c.w, H = c.h;
    for (let row = 0; row < 2; row++) {
      const lit = c.ramp(row ? mix(c1, c2, 0.25) : c1);
      const shd = c.ramp(row ? mix(c2, c1, 0.2) : c2, lit.group);
      const L = c.obj(lit), S = c.obj(shd);
      const top = (x: number) => H * (0.3 + row * 0.25) + pnoise(c.wx(x), W, s + row * 7, 2) * H * 0.25;
      for (let x = 0; x < W; x++) {
        const t = top(x), slope = top(x + 2) - top(x - 2);
        for (let y = Math.round(t); y < H; y++) c.set(x, y, slope > 0.25 && y - t < (H - t) * 0.6 ? S : L);
      }
    }
    c.shade();
    // wind ripples on the lit faces
    for (let y = 2; y < H; y += 4) for (let x = 0; x < W; x++) if (hash2(x >> 3, y, s) > 0.6 && (x + y * 3) % 8 < 3) {
      const k = c.get(x, y);
      if (k && c.get(x, y - 1) === k) c.put(x, y, c.tint(shade(c1, 0.88)));
    }
  },

  ruins(c, c1, c2, s) {
    const W = c.w, H = c.h;
    const ground = c.obj(c.ramp(c2));
    for (let x = 0; x < W; x++) c.col(ground, x, H - 5 + pnoise(x, W, s, 2) * 1.5);
    for (let i = 0; i < 6; i++) {
      const x0 = (i / 6) * W + hash2(i, s) * 12;
      const v = hash2(i, s, 2);
      if (v < 0.35) {
        // stepped pyramid
        const k = c.obj(c.ramp(c1));
        const steps = 5 + Math.floor(hash2(i, s, 3) * 3);
        for (let t = 0; t < steps; t++) c.rect(k, x0 + t * 3, H - 5 - (t + 1) * 6, (steps - t) * 6 + 4, 6);
        pyramids.push({ x: x0, steps, k });
      } else if (v < 0.75) {
        // columns, one of them broken, with a lintel
        for (let q = 0; q < 3; q++) {
          const k = c.obj(c.ramp(mix(c1, WHITE, 0.1)));
          const ht = q === 2 && v > 0.55 ? 14 : 30;
          c.rect(k, x0 + q * 12, H - 5 - ht, 5, ht);
          c.rect(k, x0 + q * 12 - 1, H - 5 - ht, 7, 2);
        }
        if (v < 0.55) c.rect(c.obj(c.ramp(mix(c1, WHITE, 0.1))), x0 - 2, H - 39, 33, 4);
      } else {
        // broken arch
        const k = c.obj(c.ramp(c1));
        c.rect(k, x0, H - 30, 6, 26);
        c.rect(k, x0 + 18, H - 22, 6, 18);
        c.poly(k, [[x0, H - 30], [x0 + 6, H - 30], [x0 + 16, H - 36], [x0 + 14, H - 40]]);
      }
    }
    c.shade();
    for (const p of pyramids.splice(0)) for (let t = 0; t < p.steps; t++) for (let x = p.x + t * 3 + 2; x < p.x + t * 3 + (p.steps - t) * 6 + 2; x += 5) c.put(x, H - 5 - (t + 1) * 6 + 3, c.tint(shade(c1, 0.8)));
  },

  islands(c, c1, c2, s) {
    const W = c.w, H = c.h;
    for (let i = 0; i < 4; i++) {
      const cx = (i / 4) * W + 40 + hash2(i, s) * 30, r = 12 + hash2(i, s, 2) * 14;
      const cy = H * 0.3 + hash2(i, s, 3) * H * 0.3;
      const rock = c.ramp(c1), soil = c.ramp(mix(c1, hex('#8a5631'), 0.5), rock.group);
      const R = c.obj(rock), D = c.obj(soil);
      // a rounded top and a rock belly tapering to a jagged point
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const t = Math.abs(x + 0.5 - cx) / r;
        const depth = Math.pow(1 - t * t, 0.75) * r * 1.25 + (hash2(x >> 1, i, s) - 0.5) * 3;
        c.col(R, x, cy, cy + depth);
        c.col(D, x, cy, cy + Math.min(depth, 4));
      }
      const grass = c.obj(c.ramp(c2));
      c.ell(grass, cx, cy, r + 1.5, 2.5);
      for (let x = Math.floor(cx - r); x <= cx + r; x += 3) c.rect(grass, x, cy + 1, 2, 1 + (hash2(x, s, 9) > 0.5 ? 2 : 1));
      if (hash2(i, s, 4) > 0.3) {
        const tx = cx - r * 0.35;
        c.rect(c.obj(c.ramp('#6a4a2a')), tx, cy - 6, 2, 6);
        const t = c.obj(c.ramp(shade(c2, 0.85)));
        c.ell(t, tx + 1, cy - 8, 5, 4.5);
        c.ell(t, tx + 4, cy - 6, 3.5, 3);
      }
      if (hash2(i, s, 5) > 0.45) {
        // a little waterfall off the edge
        const wx = cx + r * 0.55, fall = c.obj(c.ramp('#bfe8ff'));
        for (let y = cy + 1; y < Math.min(H, cy + r * 1.6); y++) { c.set(wx, y, fall); c.set(wx + 1, y, fall); }
        c.emit(wx, cy + r * 1.6, 'drip', 0xd8f4ff, 1, i);
      }
    }
    c.shade();
  },

  crystals(c, c1, c2, s) {
    const W = c.w, H = c.h;
    const ground = c.obj(c.ramp(shade(c1, 0.8)));
    for (let x = 0; x < W; x++) c.col(ground, x, H - 6 + pnoise(x, W, s, 2) * 2);
    for (let i = 0; i < 16; i++) {
      const x0 = (i / 16) * W + hash2(i, s) * 10;
      for (let q = 0; q < 3; q++) {
        const ht = (0.3 + hash2(i * 3 + q, s, 2) * 0.6) * H, wd = 4 + hash2(i * 3 + q, s, 3) * 4;
        const lean = (q - 1) * 4;
        const bx = x0 + q * 5 - 5;
        const dark = c.ramp(c1);
        const k = c.obj(dark), kl = c.obj(c.ramp(mix(c1, c2, 0.55), dark.group));
        const tip: [number, number] = [bx + lean + wd / 2, H - 6 - ht];
        c.poly(k, [[bx, H - 4], [bx + wd, H - 4], [bx + wd + lean, H - 6 - ht + wd], tip, [bx + lean, H - 6 - ht + wd]]);
        c.poly(kl, [[bx, H - 4], [bx + wd / 2, H - 4], tip, [bx + lean, H - 6 - ht + wd]]);
        if (hash2(i, q, s) > 0.7) c.emit(tip[0], tip[1] + 2, 'twinkle', toNum(mix(c2, WHITE, 0.5)), 1, i * 3 + q);
      }
    }
    c.shade();
  },

  craters(c, c1, c2, s) {
    const W = c.w, H = c.h;
    const k = c.obj(c.ramp(c1));
    const top = (x: number) => H * 0.45 + pnoise(c.wx(x), W, s, 3) * 6;
    for (let x = 0; x < W; x++) c.col(k, x, top(x));
    c.shade();
    for (let i = 0; i < 8; i++) {
      const cx = (i / 8) * W + hash2(i, s) * 20, rx = 5 + hash2(i, s, 2) * 9, cy = top(cx) + 5 + hash2(i, s, 3) * (H * 0.35);
      for (let y = -rx * 0.4; y <= rx * 0.4; y++) for (let x = -rx; x <= rx; x++) {
        const d = (x / rx) ** 2 + (y / (rx * 0.4)) ** 2;
        if (d > 1) continue;
        c.put(cx + x, cy + y, c.tint(d > 0.62 ? (y < 0 ? shade(c1, 0.72) : mix(c1, c2, 0.8)) : shade(c1, 0.85)));
      }
    }
  },

  graves(c, c1, c2, s) {
    const W = c.w, H = c.h;
    const ground = c.obj(c.ramp(c1));
    const g = (x: number) => H * 0.72 + pnoise(c.wx(x), W, s, 2) * 4;
    for (let x = 0; x < W; x++) c.col(ground, x, g(x));
    for (let i = 0; i < 22; i++) {
      const x = (i / 22) * W + hash2(i, s) * 8, v = hash2(i, s, 2), gy = g(x) + 1;
      const k = c.obj(c.ramp(mix(c1, WHITE, 0.14)));
      if (v < 0.45) { c.rect(k, x - 3, gy - 8, 7, 8); c.ell(k, x + 0.5, gy - 8, 3.5, 3); }
      else if (v < 0.7) { c.rect(k, x, gy - 11, 2, 11); c.rect(k, x - 3, gy - 8, 8, 2); }
      else if (v < 0.82) {
        const t = c.obj(c.ramp(shade(c1, 0.7)));
        c.line(t, x, gy, x, gy - 22, 2); c.line(t, x, gy - 14, x - 7, gy - 22); c.line(t, x, gy - 18, x + 6, gy - 25); c.line(t, x - 4, gy - 18, x - 7, gy - 17);
      }
      if (v > 0.88) c.emit(x, gy - 8, 'wisp', toNum(c2), 1, i);
    }
    // iron fence along the front
    const f = c.obj(c.ramp(shade(c1, 0.6)));
    for (let x = 0; x < W; x += 4) c.rect(f, x, g(x) + 2, 1, 6);
    for (let x = 0; x < W; x++) c.set(x, g(x) + 3, f);
    c.shade();
  },

  volcanoes(c, c1, c2, s) {
    const W = c.w, H = c.h;
    for (let i = 0; i < 2; i++) {
      const cx = i * (W / 2) + W / 4 + (hash2(i, s) - 0.5) * 40, top = H * (0.12 + hash2(i, s, 2) * 0.15), half = W * 0.3;
      const lit = c.ramp(c1), shd = c.ramp(shade(c1, 0.75), lit.group);
      const L = c.obj(lit), S = c.obj(shd);
      c.poly(L, [[cx - half, H], [cx - 9, top], [cx + 9, top], [cx + half, H]]);
      c.poly(S, [[cx + 2, top], [cx + 9, top], [cx + half, H], [cx + half * 0.3, H]]);
      volcs.push({ cx, top });
    }
    c.shade();
    for (const v of volcs.splice(0)) {
      for (let x = -7; x <= 7; x++) c.put(v.cx + x, v.top, c.tint(Math.abs(x) < 5 ? mix(c2, WHITE, 0.4) : c2));
      // lava streams
      for (let q = -1; q <= 1; q += 2) {
        let x = v.cx + q * 3;
        for (let y = v.top + 1; y < v.top + 40 && y < H; y++) {
          x += Math.sin(y * 0.3 + q) * 0.6 + q * 0.3;
          c.put(x, y, c.tint(c2));
          if (y % 3 === 0) c.put(x + 1, y, c.tint(mix(c2, WHITE, 0.4)));
        }
      }
      c.emit(v.cx, v.top - 1, 'smoke', 0x5a3a36, 3, Math.round(v.cx));
      c.emit(v.cx, v.top, 'lava', toNum(c2), 4, Math.round(v.cx));
    }
  },

  stands(c, c1, c2, s) {
    const W = c.w, H = c.h;
    const top = Math.round(H * 0.22);
    const k = c.obj(c.ramp(c1));
    c.rect(k, 0, top, W, H - top);
    const roof = c.obj(c.ramp(shade(c1, 0.75)));
    c.rect(roof, 0, top - 6, W, 4);
    for (let x = 10; x < W; x += 64) c.rect(roof, x, top - 2, 2, 4);
    c.shade();
    // rows of supporters, each a head on a shirt
    const shirts = [c2, hex('#ffffff'), hex('#ff5a6e'), hex('#3ec1ff'), mix(c2, WHITE, 0.4)];
    for (let row = 0; row * 6 + top + 4 < H; row++) {
      const y = top + 4 + row * 6;
      for (let x = 0; x < W; x++) c.put(x, y + 4, c.tint(shade(c1, 0.75))); // step
      for (let x = (row % 2) * 2; x < W; x += 4) {
        if (hash2(x, row, s) < 0.12) continue;
        const sh = shirts[Math.floor(hash2(x, row, s + 1) * shirts.length)];
        c.put(x, y, c.tint('#f0c8a8')); c.put(x + 1, y, c.tint('#c89878')); // head
        c.put(x, y + 1, c.tint(sh)); c.put(x + 1, y + 1, c.tint(shade(sh, 0.8))); // shirt
        c.put(x, y + 2, c.tint(shade(sh, 0.85))); c.put(x + 1, y + 2, c.tint(shade(sh, 0.7)));
        if (hash2(x, row, s + 4) > 0.96) c.emit(x, y, 'flash', 0xffffff, 1, x * 31 + row);
      }
    }
    // floodlight rigs on the roof
    for (let x = 30; x < W; x += 80) {
      for (let q = 0; q < 8; q++) for (let j = 0; j < 3; j++) c.put(x + q, top - 12 + j, c.tint(j === 1 && q % 2 === 0 ? '#fff8d0' : '#2a2a36'));
      for (let y = top - 9; y < top - 6; y++) c.put(x + 4, y, c.tint('#2a2a36'));
      c.emit(x + 4, top - 11, 'glow', 0xfff6c0, 3, x);
    }
  },

  palms(c, c1, c2, s) {
    const W = c.w, H = c.h;
    for (let i = 0; i < 6; i++) {
      const bx = (i / 6) * W + hash2(i, s) * 20, th = H * (0.55 + hash2(i, s, 2) * 0.35);
      const lean = (hash2(i, s, 3) - 0.5) * 16;
      const trunk = c.obj(c.ramp(c2));
      for (let j = 0; j < th; j++) {
        const t = j / th;
        c.rect(trunk, bx + lean * t * t - 1, H - j, 3, 1);
      }
      const tx = bx + lean, ty = H - th;
      const fr = c.obj(c.ramp(c1));
      for (const [dx, dy] of [[-1, -0.3], [1, -0.3], [-0.9, 0.5], [0.9, 0.5], [0.15, -0.8], [-0.4, 0.8]] as const)
        for (let q = 0; q <= 10; q++) {
          const t = q / 10;
          c.rect(fr, tx + dx * t * 13 - 1, ty + dy * t * 8 + t * t * 6 - 1, 2, q < 8 ? 2 : 1);
        }
      c.ell(c.obj(c.ramp('#6a4a2a')), tx, ty + 2, 2, 2);
    }
    const bush = c.obj(c.ramp(shade(c1, 0.85)));
    for (let x = 0; x < W; x++) c.col(bush, x, H - 3 - Math.abs(Math.sin(x * 0.2 + s)) * 3);
    c.shade();
  },

  sea(c, c1, c2, s) {
    const W = c.w, H = c.h;
    const top = Math.round(H * 0.3);
    for (let y = top; y < H; y++) for (let x = 0; x < W; x++) {
      const d = (y - top) / (H - top);
      let col = mix(mix(c1, WHITE, 0.15), shade(c1, 0.8), d);
      const band = (y - top) % Math.max(3, Math.round(3 + d * 7));
      if (band === 0 && (x + Math.floor(y * 2.3) + Math.floor(hash2(y, 1, s) * 40)) % 23 < 6 + d * 6) col = c2;
      c.put(x, y, c.tint(col));
    }
    for (let x = 0; x < W; x++) c.put(x, top, c.tint(mix(c2, WHITE, 0.5)));
    // a couple of sails on the horizon
    for (let i = 0; i < 2; i++) {
      const x = hash2(i, s) * W;
      for (let j = 0; j < 7; j++) for (let q = 0; q <= j / 2; q++) c.put(x + q, top - 7 + j, c.tint('#ffffff'));
      for (let q = -2; q < 5; q++) c.put(x + q, top, c.tint('#7a4a2a'));
    }
    for (let i = 0; i < 14; i++) c.emit(hash2(i, s, 3) * W, top + 2 + hash2(i, s, 4) * (H - top - 4), 'shimmer', 0xffffff, 1, i);
  },

  pagodas(c, c1, c2, s) {
    const W = c.w, H = c.h;
    const ground = c.obj(c.ramp(shade(c1, 0.85)));
    for (let x = 0; x < W; x++) c.col(ground, x, H - 4);
    for (let i = 0; i < 4; i++) {
      const cx = (i / 4) * W + 30 + hash2(i, s) * 30;
      const tiers = 2 + Math.floor(hash2(i, s, 2) * 3);
      let y = H - 4;
      for (let t = 0; t < tiers; t++) {
        const half = 14 - t * 3;
        const wall = c.obj(c.ramp(mix(c1, hex('#a02a2a'), 0.35)));
        c.rect(wall, cx - half + 3, y - 9, (half - 3) * 2, 9);
        const roof = c.obj(c.ramp(c1));
        // curved eaves turning up at the tips
        c.poly(roof, [[cx - half - 4, y - 12], [cx - half - 6, y - 15], [cx - half + 2, y - 13], [cx + half - 2, y - 13], [cx + half + 6, y - 15], [cx + half + 4, y - 12], [cx + half - 2, y - 9], [cx - half + 2, y - 9]]);
        c.poly(roof, [[cx - half + 2, y - 13], [cx, y - 18], [cx + half - 2, y - 13]]);
        lanterns.push([cx - half - 5, y - 11], [cx + half + 5, y - 11]);
        y -= 15;
      }
      c.rect(c.obj(c.ramp(c2)), cx - 0.5, y - 8, 1, 8);
    }
    c.shade();
    for (const [x, y] of lanterns.splice(0)) {
      c.put(x, y, c.tint(c2)); c.put(x, y + 1, c.tint(c2)); c.put(x, y + 2, c.tint(shade(c2, 0.7)));
      if (hash2(x, y, s) > 0.4) c.emit(x, y + 1, 'glow', toNum(c2), 2, Math.round(x + y));
    }
  },

  farm(c, c1, c2, s) {
    const W = c.w, H = c.h;
    const ground = c.obj(c.ramp(shade(c1, 0.9)));
    for (let x = 0; x < W; x++) c.col(ground, x, H - 6 + pnoise(x, W, s, 2) * 1.5);
    const wood = mix(c1, hex('#8a2a2a'), 0.6);
    for (let i = 0; i < 3; i++) {
      const x0 = (i / 3) * W + hash2(i, s) * 30;
      const v = hash2(i, s, 2);
      if (v < 0.5) {
        const barn = c.obj(c.ramp(wood));
        c.rect(barn, x0, H - 26, 30, 22);
        const roof = c.obj(c.ramp(shade(c1, 0.75)));
        c.poly(roof, [[x0 - 3, H - 25], [x0 + 15, H - 37], [x0 + 33, H - 25]]);
        barns.push({ x: x0 });
        // silo
        const silo = c.obj(c.ramp(mix(c1, WHITE, 0.25)));
        c.rect(silo, x0 + 33, H - 38, 9, 34);
        c.ell(silo, x0 + 37.5, H - 38, 4.5, 4);
      } else {
        // windmill tower; the sails turn (see emitters)
        const t = c.obj(c.ramp(mix(c1, WHITE, 0.2)));
        c.poly(t, [[x0 + 2, H - 4], [x0 + 12, H - 4], [x0 + 9, H - 40], [x0 + 5, H - 40]]);
        c.poly(t, [[x0 + 3, H - 40], [x0 + 11, H - 40], [x0 + 7, H - 45]]);
        c.emit(x0 + 7, H - 39, 'mill', toNum(mix(c1, WHITE, 0.45)), 14, i);
      }
      // trees between
      const tr = c.obj(c.ramp(shade(c1, 0.95)));
      const tx = x0 + 60 + hash2(i, s, 5) * 20;
      c.ell(tr, tx, H - 16, 7, 8);
      c.ell(tr, tx + 6, H - 12, 5, 5);
    }
    // fence
    const f = c.obj(c.ramp(mix(c1, WHITE, 0.15)));
    for (let x = 0; x < W; x += 6) c.rect(f, x, H - 9, 1, 5);
    for (let x = 0; x < W; x++) c.set(x, H - 8, f);
    c.shade();
    for (const b of barns.splice(0)) {
      for (let x = b.x + 2; x < b.x + 28; x += 3) for (let y = H - 23; y < H - 4; y++) if (c.filled(x, y)) c.put(x, y, c.tint(shade(wood, 0.8)));
      for (let y = H - 15; y < H - 4; y++) for (let x = b.x + 11; x < b.x + 19; x++) c.put(x, y, c.tint(shade(wood, 0.6)));
      for (let y = H - 30; y < H - 27; y++) for (let x = b.x + 13; x < b.x + 17; x++) c.put(x, y, c.tint(c2));
      c.emit(b.x + 15, H - 28, 'glow', toNum(c2), 2, b.x);
    }
  },

  domewall(c, c1, c2) {
    const W = c.w, H = c.h;
    const k = c.obj(c.ramp(c1));
    const top = (x: number) => H * 0.08 + Math.pow((c.wx(x) - W / 2) / (W / 2), 2) * H * 0.22;
    for (let x = 0; x < W; x++) c.col(k, x, top(x));
    const truss = c.obj(c.ramp(shade(c1, 0.7)));
    for (let x = 0; x < W; x += 32) c.rect(truss, x, top(x), 3, H);
    c.shade();
    // ad boards along the bottom and bulbs under the rim
    const ads = ['#ff5a6e', '#3ec1ff', '#ffd23f', '#6ad86a'];
    for (let x = 0; x < W; x += 40) for (let y = H - 14; y < H - 4; y++) for (let q = 3; q < 37; q++) {
      const col = hex(ads[(x / 40) % ads.length | 0]);
      c.put(x + q, y, c.tint(y === H - 14 ? mix(col, WHITE, 0.4) : (q + y) % 9 < 2 ? WHITE : col));
    }
    for (let x = 2; x < W; x += 6) {
      const y = top(x) + 6;
      c.put(x, y, c.tint(c2));
      if (x % 12 === 2) c.emit(x, y, 'blink', toNum(c2), 1, x);
    }
  },

  blocks(c, c1, c2, s) {
    const W = c.w, H = c.h;
    const cols = [c1, c2, hex('#4ac46a'), hex('#ffd23f'), hex('#5a9aff'), hex('#ff6a5a')];
    for (let cell = 0; cell < W / 16; cell++) {
      const stack = 1 + Math.floor(hash2(cell, s) * 4);
      for (let b = 0; b < stack; b++) {
        const k = c.obj(c.ramp(cols[Math.floor(hash2(cell, b, s) * cols.length)]));
        const x = cell * 16 + (b % 2) * 2, y = H - (b + 1) * 13;
        c.rect(k, x, y, 15, 13);
        c.rect(k, x + 3, y - 2, 3, 2);
        c.rect(k, x + 9, y - 2, 3, 2);
        if (hash2(cell, b, s + 1) > 0.6) glyphs.push({ x: x + 5, y: y + 3 });
      }
    }
    c.shade();
    for (const g of glyphs.splice(0)) for (let j = 0; j < 7; j++) for (let q = 0; q < 5; q++) if ((q === 0 || q === 4 || j === 0 || j === 3) && (j !== 0 || (q > 0 && q < 4))) c.put(g.x + q, g.y + j, c.tint('#ffffff'));
  },

  stalactites(c, c1, c2, s) {
    const W = c.w, H = c.h;
    const base = c.obj(c.ramp(c1));
    for (let x = 0; x < W; x++) for (let y = 0; y < 5 + pnoise(x, W, s, 2) * 3; y++) c.set(x, y, base);
    for (let i = 0; i < 26; i++) {
      const x = (i / 26) * W + hash2(i, s) * 8, len = (0.25 + hash2(i, s, 2) * 0.75) * H, wd = 3 + hash2(i, s, 3) * 5;
      const k = c.obj(c.ramp(i % 2 ? c1 : mix(c1, c2, 0.3)));
      c.poly(k, [[x - wd, 0], [x + wd, 0], [x + wd * 0.4, len * 0.7], [x, len], [x - wd * 0.3, len * 0.6]]);
      if (hash2(i, s, 4) > 0.55) c.emit(x, len, 'drip', toNum(mix(c2, WHITE, 0.6)), 1, i);
    }
    c.shade();
  },

  cavewall(c, c1, c2, s) {
    const W = c.w, H = c.h;
    const back = c.obj(c.ramp(shade(c1, 0.85)));
    for (let x = 0; x < W; x++) c.col(back, x, H * 0.35 + pnoise(x, W, s, 3) * H * 0.18);
    for (let i = 0; i < 10; i++) {
      const x = (i / 10) * W + hash2(i, s) * 14, ht = (0.4 + hash2(i, s, 2) * 0.55) * H, wd = 5 + hash2(i, s, 3) * 6;
      const k = c.obj(c.ramp(mix(c1, c2, 0.25)));
      c.poly(k, [[x - wd, H], [x - wd * 0.6, H - ht * 0.6], [x, H - ht], [x + wd * 0.5, H - ht * 0.55], [x + wd, H]]);
      if (hash2(i, s, 4) > 0.5) c.emit(x, H - ht * 0.5, 'glow', toNum(c2), 2, i);
    }
    c.shade();
  },

  girders(c, c1, _c2, s) {
    const W = c.w, H = c.h;
    for (let cell = 0; cell < W / 48; cell++) {
      const x0 = cell * 48 + 19, tw = 10, top = H * (0.12 + hash2(cell, s) * 0.35);
      const k = c.obj(c.ramp(c1));
      c.rect(k, x0, top, 2, H - top);
      c.rect(k, x0 + tw - 2, top, 2, H - top);
      for (let y = top; y < H; y += tw) { c.line(k, x0, y, x0 + tw - 1, y + tw); c.line(k, x0 + tw - 1, y, x0, y + tw); c.rect(k, x0, y, tw, 1); }
      c.rect(k, x0 - 2, top - 2, tw + 4, 3);
      c.emit(x0 + tw / 2, top - 3, 'blink', 0xff3a3a, 1, cell);
      const by = Math.floor(H * 0.55 + hash2(cell, s, 1) * 10);
      const beam = c.obj(c.ramp(shade(c1, 0.85)));
      c.rect(beam, cell * 48, by, 48, 3);
    }
    c.shade();
  },

  pipes(c, c1, c2, s) {
    const W = c.w, H = c.h;
    for (let i = 0; i < W / 40; i++) {
      const vx = i * 40 + 6;
      const k = c.obj(c.ramp(c1));
      c.rect(k, vx, 0, 7, H);
      for (let y = 8; y < H; y += 26) c.rect(k, vx - 1, y, 9, 3); // flanges
      const hy = 20 + ((i * 13) % 30);
      const kh = c.obj(c.ramp(mix(c1, WHITE, 0.08)));
      c.rect(kh, i * 40, hy, 40, 6);
      c.rect(kh, i * 40 + 20, hy - 1, 3, 8);
      if (hash2(i, s) > 0.5) {
        const kv = c.obj(c.ramp(c2));
        c.ell(kv, vx + 3.5, hy + 30, 4, 4);
        c.emit(vx + 8, hy + 3, 'steam', 0xc8d4e4, 2, i);
      }
    }
    c.shade();
  },
};

// scratch lists shared by painters (cleared after use)
const buildings: { x: number; top: number; bw: number; k: number }[] = [];
const pyramids: { x: number; steps: number; k: number }[] = [];
const volcs: { cx: number; top: number }[] = [];
const lanterns: [number, number][] = [];
const barns: { x: number }[] = [];
const glyphs: { x: number; y: number }[] = [];

function pineForest(c: Canvas, c1: RGB, c2: RGB, s: number, snowy: boolean) {
  const W = c.w, H = c.h;
  const snowTips: [number, number][] = [];
  for (let i = 0; i < W / 9; i++) {
    const cx = i * 9 + 4 + (hash2(i, s) - 0.5) * 4, th = H * (0.4 + hash2(i, s, 2) * 0.5);
    const k = c.obj(c.ramp(i % 3 === 0 ? mix(c1, WHITE, 0.08) : c1));
    const tiers = 3 + Math.floor(th / 16);
    for (let t = 0; t < tiers; t++) {
      const ty = H - th + (t / tiers) * th * 0.8, hw = 3 + t * 1.6;
      c.poly(k, [[cx - hw, ty + th / tiers + 2], [cx + hw, ty + th / tiers + 2], [cx, ty]]);
      snowTips.push([cx, ty]);
    }
    c.rect(c.obj(c.ramp('#4a3020')), cx - 1, H - 4, 2, 4);
  }
  c.shade();
  if (snowy) for (const [x, y] of snowTips) for (let j = 0; j < 3; j++) for (let q = -j; q <= j; q++) if (c.filled(x + q, y + j + 1)) c.put(x + q, y + j + 1, c.tint(j < 2 ? c2 : mix(c2, c1, 0.3)));
}

const toNum = (c: RGB) => (c[0] << 16) | (c[1] << 8) | c[2];

/** Paint one parallax strip. `sky` is the colour far layers fade toward. */
export function paintLayer(spec: LayerSpec, sky: RGB): BgLayer {
  // aerial perspective: the slower a layer moves, the farther it is
  const haze = Math.max(0, Math.min(0.5, 0.42 - spec.factor * 1.4));
  const c = new Canvas(BG_W, spec.height, haze, sky, spec.factor >= 0.14);
  P[spec.kind](c, hex(spec.color), hex(spec.color2 ?? spec.color), spec.seed);
  // what fills the screen beyond the strip: the colour of its last (or first) row
  const row = spec.hang ? 0 : spec.height - 1;
  let fill: RGB = mix(hex(spec.color), sky, haze);
  const counts = new Map<number, number>();
  for (let x = 0; x < BG_W; x++) {
    const i = (row * BG_W + x) * 4;
    if (!c.rgba[i + 3]) continue;
    const k = (c.rgba[i] << 16) | (c.rgba[i + 1] << 8) | c.rgba[i + 2];
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let best = 0;
  for (const [k, n] of counts) if (n > best) { best = n; fill = [(k >> 16) & 255, (k >> 8) & 255, k & 255]; }
  return { w: BG_W, h: spec.height, rgba: c.rgba, factor: spec.factor, bottom: spec.bottom, fill, emitters: c.emitters };
}
