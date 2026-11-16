import { circ, ell, path, poly, starShape } from './draw';
import type { CarDef, CarMat, CarPoly, FxDef, Pt } from './types';

/*
 * Animated car decoration: smoke out of a stack, steam, ghostly wisps, sparks, fizz, frost
 * breath, exhaust flames, glowing trails, rain, lightning and light beams. In the game these
 * are particles and flickering lines (render/view.ts); they are never baked into the sprite
 * and never collide. For still pictures (garage, sheets) `fxSnapshot` gives one frame of them.
 */

/** Unit vector of an fx direction (degrees, 0 forward, -90 up, y down). */
export const fxDir = (e: FxDef): Pt => {
  const a = ((e.dir ?? -90) * Math.PI) / 180;
  return [Math.cos(a), Math.sin(a)];
};

/** Default material of each kind (when the car does not set one). */
export const FX_MAT: Record<FxDef['kind'], CarMat> = {
  smoke: 'grey', steam: 'white', wisp: 'white', spark: 'yellow', bubble: 'white', frost: 'sky',
  flame: 'orange', trail: 'light', rain: 'sky', bolt: 'yellow', beam: 'light',
};

/** Deterministic zig-zag between two points (lightning). */
export function boltPts(a: Pt, b: Pt, n: number, amp: number, seed: number): Pt[] {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l, ny = dx / l;
  const pts: Pt[] = [a];
  for (let i = 1; i < n; i++) {
    const t = i / n, k = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    const j = ((k - Math.floor(k)) * 2 - 1) * amp;
    pts.push([a[0] + dx * t + nx * j, a[1] + dy * t + ny * j]);
  }
  pts.push(b);
  return pts;
}

/** One still frame of a car's effects, as render-only polygons (car-local, facing +x). */
export function fxSnapshot(def: CarDef): CarPoly[] {
  const out: CarPoly[] = [];
  for (const e of def.fx ?? []) {
    const [x, y] = e.at, [ux, uy] = fxDir(e), s = e.size ?? 0.2, m = e.mat ?? FX_MAT[e.kind];
    const along = (d: number, side = 0): Pt => [x + ux * d - uy * side, y + uy * d + ux * side];
    switch (e.kind) {
      case 'smoke': case 'steam': case 'frost':
        [0.6, 1.5, 2.6].forEach((d, i) => { const [px, py] = along(d * s, (i % 2 ? 0.25 : -0.2) * s); out.push(ell(px, py, s * (0.55 + i * 0.25), s * (0.4 + i * 0.18), m)); });
        break;
      case 'wisp':
        [0.8, 2.0, 3.2].forEach((d, i) => { const [px, py] = along(d * s, (i % 2 ? 0.3 : -0.3) * s); out.push(ell(px, py, s * (0.8 - i * 0.15), s * (0.3 - i * 0.06), m, { flat: true })); });
        break;
      case 'spark':
        [[0.8, -0.6], [1.6, 0.5], [2.4, -0.2]].forEach(([d, sd]) => { const [px, py] = along(d * s, sd * s); out.push(starShape(px, py, s * 0.35, m)); });
        break;
      case 'bubble':
        [[0.5, 0], [1.4, 0.4], [2.3, -0.2]].forEach(([d, sd], i) => { const [px, py] = along(d * s, sd * s); out.push(circ(px, py, s * (0.28 - i * 0.05), m, { ring: true })); });
        break;
      case 'flame': {
        const [tx, ty] = along(s * 3);
        out.push(poly([along(0, -s * 0.5), [tx, ty], along(0, s * 0.5)], 'orange'), poly([along(0, -s * 0.28), along(s * 1.8), along(0, s * 0.28)], 'yellow'));
        break;
      }
      case 'trail': {
        const [tx, ty] = along(s * 6);
        out.push(poly([along(0, -s * 0.18), [tx, ty], along(0, s * 0.18)], m, { flat: true }));
        break;
      }
      case 'rain': {
        const [bx, by] = e.to ?? [x + 1, y];
        for (let i = 0; i <= 4; i++) { const px = x + ((bx - x) * i) / 4, py = y + ((by - y) * i) / 4 + (i % 2) * s; out.push(...path([[px, py], [px - s * 0.2, py + s * 1.2]], s * 0.18, m)); }
        break;
      }
      case 'bolt':
        out.push(...path(boltPts(e.at, e.to ?? along(1), 5, s * 0.8, x * 7 + y), s * 0.35, m));
        break;
      case 'beam': {
        const [bx, by] = e.to ?? along(2);
        const dx = bx - x, dy = by - y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
        out.push(poly([[x + nx * s * 0.4, y + ny * s * 0.4], [bx + nx * s * 1.6, by + ny * s * 1.6], [bx - nx * s * 1.6, by - ny * s * 1.6], [x - nx * s * 0.4, y - ny * s * 0.4]], m, { flat: true }));
        break;
      }
    }
  }
  return out;
}

/** How each kind of car effect moves (per particle; rate is per second at fx.rate 1). */
export const FX_PARAMS: Record<string, { rate: number; speed: number; jitter: number; life: number; size: number; g: number; drag: number; grow: number; spin: number; alpha: number; carry: number }> = {
  smoke: { rate: 9, speed: 1.4, jitter: 0.5, life: 1.3, size: 0.9, g: -0.8, drag: 1.2, grow: 1.6, spin: 2, alpha: 0.85, carry: 0.2 },
  steam: { rate: 12, speed: 1.8, jitter: 0.6, life: 0.9, size: 0.9, g: -1.2, drag: 1.4, grow: 2, spin: 2, alpha: 0.8, carry: 0.2 },
  wisp: { rate: 14, speed: 1.6, jitter: 0.8, life: 0.8, size: 0.7, g: -0.4, drag: 1, grow: 1.2, spin: 1, alpha: 0.6, carry: 0.1 },
  spark: { rate: 10, speed: 2.2, jitter: 3, life: 0.35, size: 0.4, g: 2, drag: 2, grow: 0, spin: 8, alpha: 1, carry: 0.6 },
  bubble: { rate: 7, speed: 0.9, jitter: 0.8, life: 1.1, size: 0.5, g: -1.5, drag: 1, grow: 0.6, spin: 0, alpha: 0.75, carry: 0.5 },
  frost: { rate: 12, speed: 1.3, jitter: 0.7, life: 0.8, size: 0.6, g: 0.4, drag: 1.5, grow: 1.4, spin: 2, alpha: 0.7, carry: 0.4 },
  flame: { rate: 30, speed: 4, jitter: 0.8, life: 0.22, size: 0.9, g: 0, drag: 2, grow: 0, spin: 6, alpha: 1, carry: 0.8 },
  trail: { rate: 40, speed: 0.2, jitter: 0.1, life: 0.55, size: 0.45, g: 0, drag: 3, grow: 0, spin: 0, alpha: 0.9, carry: 0 },
  rain: { rate: 26, speed: 7, jitter: 0.3, life: 0.35, size: 0.25, g: 6, drag: 0, grow: 0, spin: 0, alpha: 0.85, carry: 0.8 },
};
