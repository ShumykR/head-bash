import { CAR_PPM } from '../physics/constants';
import { RGB, hex, shade, mix } from '../render/color';
import { PixelGrid, makeGrid, gget, gset, fillPoly } from '../render/grid';
import type { CarDef, CarMat, CarPalette, WheelDef } from './types';

/*
 * Car palette: index 0 is transparent, 1 is the outline; then every material gets a
 * five-tone ramp [deep, dark, base, light, highlight]. Body/accent/dark/glass/light come
 * from the car's palette, everything else is a fixed colour so details read the same on
 * every car (a red beacon is always red, chrome is always chrome).
 */
export const MATS: CarMat[] = [
  'body', 'accent', 'dark', 'metal', 'spike', 'scoop', 'rocket', 'wood', 'glass', 'bone', 'gold', 'leaf', 'white', 'light', 'black', 'pink',
  'red', 'yellow', 'green', 'blue', 'orange', 'brown', 'purple', 'chrome', 'rubber', 'cream', 'teal', 'tan', 'sky', 'grey',
];
const FIXED: Partial<Record<CarMat, string>> = {
  metal: '#8e96a6', spike: '#b4bcc8', scoop: '#f2b42a', rocket: '#d84a48', wood: '#a8683a', bone: '#e6dcbe', gold: '#f2be34',
  leaf: '#34a24a', white: '#eef2f8', black: '#2c2a34', pink: '#f68cb2', red: '#dc3838', yellow: '#ffd23a', green: '#3cb44a',
  blue: '#3a72e4', orange: '#f68a22', brown: '#7c4a2a', purple: '#8c4ad4', chrome: '#c4ccd8', rubber: '#34323c', cream: '#f4e4b4',
  teal: '#22b4a4', tan: '#d2a46a', sky: '#7cc8f4', grey: '#6e7280',
};
export const TONES = 5;
const T_DEEP = 0, T_DARK = 1, T_BASE = 2, T_LIGHT = 3, T_HI = 4;
const matIndex = new Map(MATS.map((m, i) => [m, i]));
export const tone = (m: CarMat, t: number) => 2 + (matIndex.get(m) ?? 0) * TONES + t;

export const P = {
  NONE: 0,
  OUTLINE: 1,
  HEAD_LIGHT: tone('light', T_BASE),
  TAIL_LIGHT: tone('red', T_LIGHT),
  GLASS: tone('glass', T_BASE),
  DARK: tone('dark', T_BASE),
  HAZARD: tone('black', T_BASE),
} as const;

const COOL: RGB = [36, 26, 74];
const WARM: RGB = [255, 244, 214];
function ramp(c: RGB): RGB[] {
  return [
    mix(shade(c, 0.42), COOL, 0.25),
    mix(shade(c, 0.7), COOL, 0.12),
    c,
    mix(shade(c, 1.22), WARM, 0.12),
    mix(shade(c, 1.5), WARM, 0.2),
  ];
}

/**
 * Tinted glass: dark panes with a pale glint, the way hand-drawn arcade sprites read windows
 * (bright cyan glass made every car look like a toy). The car's own glass colour only tints it.
 */
function glassRamp(tint: RGB): RGB[] {
  const base: RGB = mix([38, 38, 66], tint, 0.12);
  return [mix(base, [8, 6, 16], 0.55), mix(base, [8, 6, 16], 0.25), base, mix([112, 116, 160], tint, 0.25), mix([226, 230, 246], tint, 0.15)];
}

export function carPalette(p: CarPalette): (RGB | null)[] {
  const pal: (RGB | null)[] = [null, mix(shade(hex(p.dark), 0.3), [14, 10, 24], 0.6)];
  const src: Record<string, string> = { body: p.body, accent: p.accent, dark: p.dark, glass: p.glass, light: p.light };
  for (const m of MATS) {
    if (m === 'glass') { pal.push(...glassRamp(hex(p.glass))); continue; }
    for (const c of ramp(hex(src[m] ?? FIXED[m] ?? '#ff00ff'))) pal.push(c);
  }
  return pal;
}

/** Bounding box (meters) of all chassis polygons and windows. */
export function carBounds(def: CarDef) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x: number, y: number) => {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  };
  for (const p of def.body) if (!p.hide) for (const [x, y] of p.pts) add(x, y);
  for (const w of def.windows ?? []) for (const [x, y] of w) add(x, y);
  if (x0 === Infinity) for (const p of def.body) for (const [x, y] of p.pts) add(x, y);
  return { x0, y0, x1, y1 };
}

/**
 * Rasterize the car into a palette-indexed pixel grid.
 * Pure function: no DOM, deterministic.
 *
 * Each polygon paints its material; later polygons sit on top. Shading works per
 * material region: the top row gets a highlight, the upper third the light tone,
 * the lower quarter the dark tone, with an ordered dither between bands. Where a
 * later piece sits on a different material it gets a 1px outline so details read
 * as separate parts (a `ring` piece gets a dark seam even on the same material).
 */
export function generateCarGrid(def: CarDef, ppm = CAR_PPM): PixelGrid {
  const b = carBounds(def);
  const pad = 3;
  const ox = Math.ceil(-b.x0 * ppm) + pad;
  const oy = Math.ceil(-b.y0 * ppm) + pad;
  const w = ox + Math.ceil(b.x1 * ppm) + pad;
  const h = oy + Math.ceil(b.y1 * ppm) + pad;
  const mats = makeGrid(w, h, ox, oy);
  const toPx = (pts: readonly (readonly [number, number])[]) => pts.map(([x, y]) => [x * ppm + ox, y * ppm + oy] as [number, number]);

  const owner = new Uint16Array(w * h);
  const polys = def.body.filter((p) => !p.hide);
  const ringOf: boolean[] = [false];
  const flatOf: boolean[] = [false];
  polys.forEach((poly, i) => {
    const id = (matIndex.get(poly.mat ?? 'body') ?? 0) + 1;
    ringOf.push(!!poly.ring);
    flatOf.push(!!poly.flat);
    fillPoly(toPx(poly.pts), w, h, (x, y) => {
      gset(mats, x, y, poly.cut ? 0 : id);
      owner[y * w + x] = poly.cut ? 0 : i + 1;
    });
  });
  const own = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : owner[y * w + x]);
  // Old-style window list: glass panes cut into whatever they sit on.
  const glassId = (matIndex.get('glass') ?? 0) + 1;
  const winGrid = makeGrid(w, h);
  for (const win of def.windows ?? []) fillPoly(toPx(win), w, h, (x, y) => { if (gget(mats, x, y)) gset(winGrid, x, y, 1); });

  const out = makeGrid(w, h, ox, oy);
  const stripeY0 = def.stripe ? Math.round(def.stripe.y * ppm + oy) : -999;
  const stripeY1 = def.stripe ? stripeY0 + Math.max(1, Math.round(def.stripe.h * ppm)) : -999;
  const matAt = (x: number, y: number) => {
    const m = gget(mats, x, y);
    if (!m) return 0;
    if (gget(winGrid, x, y)) return glassId;
    if (m === 1 && y >= stripeY0 && y < stripeY1 && def.stripe) return 2;
    return m;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const m0 = gget(mats, x, y);
      if (!m0) continue;
      const m = matAt(x, y);
      const me = own(x, y);
      // Seams: a piece on top of a different material gets an outline; window panes get frames.
      const seam = (xx: number, yy: number) => {
        const o = own(xx, yy);
        const mm = matAt(xx, yy);
        if (m === glassId && gget(winGrid, x, y) && !gget(winGrid, xx, yy)) return 2;
        // The outline around a detail is drawn on the piece underneath it.
        if (o > me && mm !== m && mm && !flatOf[o]) return 2;
        if (o > me && ringOf[o]) return 1;
        return 0;
      };
      const sv = Math.max(seam(x - 1, y), seam(x + 1, y), seam(x, y - 1), seam(x, y + 1));
      const mat = MATS[m - 1];
      if (sv === 2) { gset(out, x, y, P.OUTLINE); continue; }
      if (sv === 1) { gset(out, x, y, tone(mat, T_DEEP)); continue; }
      // Vertical extent of this material run through the pixel.
      let up = 0, dn = 0;
      while (up < 64 && matAt(x, y - up - 1) === m) up++;
      while (dn < 64 && matAt(x, y + dn + 1) === m) dn++;
      const H = up + dn + 1;
      const t = H > 1 ? up / (H - 1) : 0.5;
      let tn = T_BASE;
      // Crisp bands like hand-shaded sprites: a bright rim on top, a light band under it,
      // the base colour, a darker lower band and a deep bottom row. No dither noise.
      if (flatOf[me]) tn = T_BASE;
      else if (up === 0 && H >= 3) tn = T_HI;
      else if (H >= 5 && dn === 0) tn = T_DEEP;
      else if (H >= 4) {
        if (up === 1 && H >= 7) tn = T_LIGHT;
        else if (t < 0.24) tn = T_LIGHT;
        else if (t > 0.72) tn = T_DARK;
      }
      // Material textures
      switch (mat) {
        case 'wood': if (y % 4 === 0 && tn !== T_HI) tn = T_DARK; else if ((x * 5 + (y >> 2) * 3) % 13 === 0) tn = T_DEEP; break;
        case 'scoop': if ((x + y) % 7 < 2 && tn !== T_HI) { gset(out, x, y, P.HAZARD); continue; } break;
        case 'spike': tn = (x + y) % 3 === 0 ? T_HI : y % 2 ? T_DARK : T_BASE; break;
        case 'glass': {
          // Dark pane, a lighter strip under the frame and a slanted glint.
          const k = (x - y + 256) % 11;
          tn = k === 0 || k === 1 ? T_LIGHT : up === 0 ? T_LIGHT : up < 2 && H > 4 ? T_BASE : t > 0.6 ? T_DEEP : T_DARK;
          if (k === 0 && up > 0 && dn > 0) tn = T_HI;
          break;
        }
        case 'chrome': tn = up === 0 ? T_HI : t < 0.45 ? T_LIGHT : t < 0.75 ? T_BASE : T_DARK; break;
        case 'rubber': if (tn === T_HI) tn = T_LIGHT; break;
        case 'light': tn = up === 0 ? T_HI : T_LIGHT; break;
      }
      gset(out, x, y, tone(mat, tn));
    }
  }

  // Outline drawn outside the silhouette, so even 2px-thin parts keep their colour.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (gget(mats, x, y)) continue;
      if (gget(mats, x - 1, y) || gget(mats, x + 1, y) || gget(mats, x, y - 1) || gget(mats, x, y + 1)) gset(out, x, y, P.OUTLINE);
    }
  }

  // Wheel arches: darken body pixels just around each wheel so wheels sit in wells.
  for (const wd of def.wheels) {
    if (wd.hidden) continue;
    const cx = wd.x * ppm + ox, cy = wd.y * ppm + oy, r = wd.r * ppm;
    for (let y = Math.floor(cy - r - 3); y <= cy + 1; y++) {
      for (let x = Math.floor(cx - r - 3); x <= cx + r + 3; x++) {
        if (!gget(mats, x, y)) continue;
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d < r + 1.6) gset(out, x, y, d > r + 0.6 ? P.OUTLINE : P.DARK);
      }
    }
  }

  // Automatic head & tail lights for plain hulls (skins draw their own).
  const skinned = def.body.some((p) => p.hide);
  const bodyId = 1;
  const bodyRows: number[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (gget(mats, x, y) === bodyId) { bodyRows.push(y); break; }
  if (bodyRows.length && def.lights !== false && !skinned) {
    const midY = bodyRows[Math.floor(bodyRows.length * 0.35)];
    for (let x = w - 1; x >= 0; x--) {
      if (gget(mats, x, midY) === bodyId) {
        gset(out, x - 1, midY, P.HEAD_LIGHT);
        gset(out, x - 2, midY, P.HEAD_LIGHT);
        gset(out, x - 1, midY + 1, P.HEAD_LIGHT);
        break;
      }
    }
    for (let x = 0; x < w; x++) {
      if (gget(mats, x, midY) === bodyId) {
        gset(out, x + 1, midY, P.TAIL_LIGHT);
        gset(out, x + 1, midY + 1, P.TAIL_LIGHT);
        break;
      }
    }
  }
  return out;
}

/** Wheel palette slots */
export const WP = { NONE: 0, OUTLINE: 1, TIRE: 2, TIRE_L: 3, RIM_D: 4, RIM: 5, RIM_L: 6, HUB: 7 } as const;

/** Sprite of one moving piece (see LinkDef); same origin as the car sprite at rest. */
export function generateLinkGrid(def: CarDef, i: number, ppm = CAR_PPM): PixelGrid {
  return generateCarGrid({ ...def, body: def.links![i].polys, windows: [], wheels: [], stripe: undefined, lights: false, links: undefined }, ppm);
}

export function wheelPalette(p: CarPalette): (RGB | null)[] {
  // Black tyre with a soft grey sheen, a pale rim ring and a small hub in the car's own colour
  // (the accent when the body is black, white or grey).
  const sat = (c: RGB) => Math.max(...c) - Math.min(...c);
  const body = hex(p.body), acc = hex(p.accent);
  const lum = (c: RGB) => (c[0] + c[1] + c[2]) / 3;
  const hub = sat(body) >= 60 ? body : sat(acc) >= 60 ? acc : lum(acc) > 70 && lum(acc) < 200 ? acc : ([200, 60, 60] as RGB);
  return [null, [14, 12, 20], [30, 28, 38], [62, 60, 74], [150, 152, 168], [222, 224, 234], hub, shade(hub, 0.6)];
}

/**
 * Wheel sprite: a thick black tyre, a thin pale rim and a coloured hub with a
 * pale cross so the spin shows. Slots: TIRE / TIRE_L tyre, RIM_D / RIM rim ring,
 * RIM_L hub colour, HUB hub shadow and cross gaps.
 */
export function generateWheelGrid(wd: WheelDef, ppm = CAR_PPM): PixelGrid {
  const r = Math.max(3, Math.round(wd.r * ppm));
  const size = r * 2 + 1;
  const g = makeGrid(size, size, r, r);
  const style = wd.rim ?? 'spokes';
  const monster = style === 'monster';
  const tireIn = Math.max(1.6, r * (monster ? 0.44 : 0.52));
  const rimIn = Math.max(1.2, tireIn - Math.max(1, r * 0.13));
  const arms = style === 'star' ? 5 : style === 'disc' ? 0 : style === 'monster' ? 6 : 4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - r, dy = y - r;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > r + 0.3) continue;
      const a = Math.atan2(dy, dx);
      let c: number;
      if (d > r - 0.7) c = WP.OUTLINE;
      else if (d > tireIn) {
        // Sheen on the upper-left of the tyre; chunky tread blocks on off-road tyres.
        const sheen = dx + dy < -r * 0.5 && d > tireIn + 0.8 && d < r - 1.2;
        c = sheen ? WP.TIRE_L : WP.TIRE;
        if (monster || r >= 9) {
          const tread = Math.floor(((a + Math.PI) / (Math.PI * 2)) * (monster ? 12 : 16)) % 2;
          if (tread && d > r - 1.7) c = WP.OUTLINE;
        }
      } else if (d > rimIn) c = dx + dy < 0 ? WP.RIM : WP.RIM_D;
      else {
        c = dy > rimIn * 0.35 ? WP.HUB : WP.RIM_L;
        if (arms && rimIn >= 2) {
          const s = Math.abs(Math.sin((a * arms) / 2));
          if (s < 0.28 && d > 0.8) c = WP.RIM;
        }
        if (d < 0.9) c = WP.RIM;
      }
      gset(g, x, y, c);
    }
  }
  return g;
}

/** Driver helmet palette: player colour based. */
export const DP = { NONE: 0, OUTLINE: 1, HELM_D: 2, HELM: 3, HELM_L: 4, VISOR: 5, VISOR_L: 6, SKIN: 7, SUIT: 8, SUIT_D: 9 } as const;

export function driverPalette(playerColor: string): (RGB | null)[] {
  const c = hex(playerColor);
  return [null, [16, 14, 24], shade(c, 0.65), c, shade(c, 1.4), [30, 34, 52], [130, 200, 240], [236, 184, 140], shade(c, 0.85), shade(c, 0.5)];
}

/** How much bigger the helmet is drawn than the head it protects. */
export const HELMET_SCALE = 1.2;

/** Helmet facing +x. Origin is the head center. */
export function generateHeadGrid(r: number, ppm = CAR_PPM): PixelGrid {
  // The helmet is drawn a size up on the head: the driver is what the eye should find first.
  const R = Math.max(3, Math.round(r * ppm * HELMET_SCALE));
  const size = R * 2 + 1;
  const g = makeGrid(size, size, R, R);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - R, dy = y - R;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > R + 0.3) continue;
      let c: number = d > R - 0.8 ? DP.OUTLINE : DP.HELM;
      if (c === DP.HELM) {
        if (dy < -R * 0.4 && dx < R * 0.2) c = DP.HELM_L;
        if (dy > R * 0.45) c = DP.HELM_D;
        // visor on the front half
        if (dx > -R * 0.05 && dy > -R * 0.35 && dy < R * 0.3) c = dy < -R * 0.15 && dx < R * 0.6 ? DP.VISOR_L : DP.VISOR;
        // stripe over the top
        if (Math.abs(dx + R * 0.15) < R * 0.18 && dy < -R * 0.2) c = DP.HELM_D;
      }
      gset(g, x, y, c);
    }
  }
  return g;
}

/** Torso + arm sitting under the head (render only). Origin at neck. */
export function generateTorsoGrid(r: number, ppm = CAR_PPM): PixelGrid {
  const R = Math.max(3, Math.round(r * ppm));
  const w = Math.round(R * 1.7), h = Math.round(R * 1.6);
  const g = makeGrid(w, h, Math.floor(w / 2), 0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      let c: number = edge ? DP.OUTLINE : DP.SUIT;
      if (!edge && x > w * 0.6) c = DP.SUIT_D;
      if (!edge && y === 1) c = DP.SKIN;
      gset(g, x, y, c);
    }
  }
  return g;
}
