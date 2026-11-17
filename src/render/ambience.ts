import { Container, Sprite } from 'pixi.js';
import type { DecorKind, ThemeId } from '../maps/types';
import type { Particles } from './particles';
import { makeGrid, gset, type PixelGrid } from './grid';
import { hash2 } from './color';

/*
 * Life on the arena: props sway in the wind, bend and wobble when a car brushes past or a
 * blast goes off (shedding leaves, snow, sand or sparks), lights glow, and every theme has
 * something drifting in the air. Render only: nothing here touches the physics.
 */

type Motion = 'sway' | 'stiff' | 'rigid' | 'hover' | 'none';

interface KindLife {
  motion: Motion;
  /** Wind sway amplitude (shear) and speed. */
  wind?: number;
  speed?: number;
  /** How much a passing car / blast bends it. */
  give?: number;
  /** Particles shed when hit. */
  shed?: number[];
  /** Halo behind it: color and radius in decor pixels, offset from the bottom. */
  glow?: { color: number; r: number; y: number };
}

const LEAF = [0x5cc23a, 0x2f8a34, 0x92e04e];
const SNOW = [0xffffff, 0xdfe8f8];
const DUST = [0xd8c8a8, 0xa89880];

const LIFE: Partial<Record<DecorKind, KindLife>> = {
  spruce: { motion: 'sway', wind: 0.03, speed: 1.1, give: 1, shed: [0x2f8a34, 0xffffff, 0xffffff] },
  palm: { motion: 'sway', wind: 0.06, speed: 0.9, give: 1, shed: LEAF },
  bamboo: { motion: 'sway', wind: 0.07, speed: 1.4, give: 1.2, shed: [0x92e04e, 0x5cc23a] },
  fern: { motion: 'sway', wind: 0.08, speed: 1.8, give: 1.4, shed: LEAF },
  deadtree: { motion: 'stiff', wind: 0.012, speed: 0.7, give: 0.5, shed: [0x5e3a22, 0x3d2616] },
  cactus: { motion: 'stiff', wind: 0, give: 0.4, shed: [0x46a046, 0xff7ab8] },
  checkflag: { motion: 'sway', wind: 0.05, speed: 3.2, give: 1.2 },
  cornerflag: { motion: 'sway', wind: 0.06, speed: 3.6, give: 1.4 },
  lantern: { motion: 'sway', wind: 0.04, speed: 1.6, give: 1.3, shed: [0xffd23f, 0xff8c1a], glow: { color: 0xffa040, r: 11, y: 28 } },
  umbrella: { motion: 'stiff', wind: 0.015, speed: 1.2, give: 0.6 },
  floodlight: { motion: 'stiff', wind: 0, give: 0.25, glow: { color: 0xfff6c0, r: 16, y: 59 } },
  tombstone: { motion: 'rigid', give: 0.35, shed: DUST },
  cross: { motion: 'rigid', give: 0.5, shed: DUST },
  snowman: { motion: 'rigid', give: 0.4, shed: SNOW },
  sandcastle: { motion: 'rigid', give: 0.25, shed: [0xf2cf7a, 0xd9ad55] },
  fence: { motion: 'rigid', give: 0.3, shed: [0x8c5a34] },
  rocks: { motion: 'rigid', give: 0.15, shed: DUST },
  skull: { motion: 'rigid', give: 0.8, shed: DUST },
  bones: { motion: 'rigid', give: 0.6, shed: DUST },
  crystal: { motion: 'rigid', give: 0.2, shed: [0xd08aff, 0x5ef0ff, 0xffffff], glow: { color: 0xc07aff, r: 13, y: 14 } },
  silo: { motion: 'stiff', wind: 0, give: 0.08 },
  barn: { motion: 'none' },
  gate: { motion: 'none' },
  ufo: { motion: 'hover', glow: { color: 0x8cffd0, r: 22, y: 10 } },
  portal: { motion: 'none', glow: { color: 0xff7ae0, r: 26, y: 23 } },
};

interface Live {
  s: Sprite;
  kind: DecorKind;
  x: number; y: number; w: number; h: number;
  life: KindLife;
  /** Bend (shear) and its velocity; hop is a small vertical kick for light props. */
  ang: number; vel: number;
  hop: number; hopV: number;
  phase: number;
  cool: number;
  baseY: number;
  halo?: Sprite;
}

/** Things drifting in the air, per theme. */
interface Drift {
  rate: number;
  colors: number[];
  vx: [number, number];
  vy: [number, number];
  g?: number;
  life: number;
  size: number;
  /** Where they appear: anywhere in view, from the top edge, or from the bottom. */
  from: 'any' | 'top' | 'bottom';
}

const DRIFT: Partial<Record<ThemeId, Drift>> = {
  meadow: { rate: 3, colors: [0xffffff, 0xfff6c0], vx: [0.4, 1.2], vy: [-0.3, 0.2], life: 4, size: 0.07, from: 'any' },
  sawmill: { rate: 5, colors: [0xe08a30, 0xc8602a, 0xf0b040], vx: [0.6, 1.6], vy: [0.6, 1.2], life: 6, size: 0.12, from: 'top' },
  ice: { rate: 12, colors: [0xffffff, 0xd8f0ff], vx: [-0.3, 0.3], vy: [0.8, 1.6], life: 7, size: 0.08, from: 'top' },
  winter: { rate: 16, colors: [0xffffff, 0xeef6ff], vx: [-0.4, 0.6], vy: [1, 2], life: 7, size: 0.1, from: 'top' },
  desert: { rate: 6, colors: [0xf2cf7a, 0xe8b070], vx: [2.5, 4.5], vy: [-0.2, 0.2], life: 3, size: 0.07, from: 'any' },
  amber: { rate: 6, colors: [0xffd860, 0xffb030], vx: [1.5, 3], vy: [-0.3, 0.1], life: 3, size: 0.07, from: 'any' },
  halloween: { rate: 3, colors: [0xb88ae8, 0x8cffb0], vx: [-0.4, 0.4], vy: [-0.5, -0.1], life: 4, size: 0.08, from: 'any' },
  alien: { rate: 5, colors: [0xb6ff6a, 0x8cffd0], vx: [-0.5, 0.5], vy: [-0.5, 0.3], life: 3.5, size: 0.08, from: 'any' },
  volcano: { rate: 10, colors: [0xff8a2a, 0xffc040, 0xff5a1a], vx: [-0.4, 0.4], vy: [-2.2, -1], life: 4, size: 0.09, from: 'bottom' },
  foundry: { rate: 8, colors: [0xff8a2a, 0xffc040], vx: [-0.3, 0.3], vy: [-2, -0.8], life: 4, size: 0.08, from: 'bottom' },
  cny: { rate: 1.2, colors: [0xff9a2a, 0xffc040], vx: [-0.2, 0.3], vy: [-1, -0.6], life: 12, size: 0.22, from: 'bottom' },
  rift: { rate: 6, colors: [0xff8ae8, 0x5ef0ff, 0xd08aff], vx: [-0.3, 0.3], vy: [-1.2, -0.4], life: 5, size: 0.08, from: 'bottom' },
  stadium: { rate: 2, colors: [0xfff6c0, 0xffffff], vx: [-0.6, 0.6], vy: [-0.4, 0.4], life: 3, size: 0.06, from: 'any' },
  beach: { rate: 2, colors: [0xffffff], vx: [0.5, 1.2], vy: [-0.2, 0.1], life: 3, size: 0.06, from: 'any' },
  cavern: { rate: 3, colors: [0xc6a2b2, 0x86688e], vx: [-0.2, 0.2], vy: [-0.2, 0.3], life: 5, size: 0.06, from: 'any' },
  catacomb: { rate: 3, colors: [0xe8dcc0, 0xa89880], vx: [-0.2, 0.2], vy: [-0.2, 0.3], life: 5, size: 0.06, from: 'any' },
  crypt: { rate: 3, colors: [0xffb050, 0x8a6a8a], vx: [-0.2, 0.2], vy: [-0.4, 0.1], life: 5, size: 0.06, from: 'any' },
  grotto: { rate: 4, colors: [0x5ef0ff, 0xb0f8ff], vx: [-0.1, 0.1], vy: [2.5, 4], life: 3, size: 0.07, from: 'top' },
  mine: { rate: 4, colors: [0xd8b080, 0x8a6a4a], vx: [-0.3, 0.3], vy: [-0.1, 0.4], life: 5, size: 0.06, from: 'any' },
  bunker: { rate: 3, colors: [0xc2d0e4, 0x8ea2be], vx: [-0.3, 0.3], vy: [-0.1, 0.3], life: 5, size: 0.05, from: 'any' },
};

/** A dithered disc used as a soft pixel halo. */
export function haloGrid(r: number): PixelGrid {
  const n = r * 2 + 1;
  const g = makeGrid(n, n, r, r);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const d = Math.hypot(x - r, y - r) / r;
      if (d > 1) continue;
      // denser in the middle, every other pixel near the rim
      if (d < 0.55 || (d < 0.8 && (x + y) % 2 === 0) || (x % 2 === 0 && y % 2 === 0)) gset(g, x, y, 1);
    }
  return g;
}

export class Ambience {
  private live: Live[] = [];
  private acc = 0;
  private theme: ThemeId = 'meadow';
  /** Screen-space twinkling stars. */
  readonly stars = new Container();
  private starSprites: { s: Sprite; fx: number; fy: number; ph: number; sp: number }[] = [];

  constructor(private particles: Particles, private ppm: number) {}

  reset(theme: ThemeId) {
    this.live = [];
    this.theme = theme;
    this.acc = 0;
    this.stars.removeChildren();
    this.starSprites = [];
  }

  /** Twinkling stars in the top part of the sky (screen fractions). */
  addStars(tex: import('pixi.js').Texture, n: number) {
    for (let i = 0; i < n; i++) {
      const s = new Sprite(tex);
      s.anchor.set(0.5);
      this.stars.addChild(s);
      this.starSprites.push({ s, fx: hash2(i, 1, 77), fy: hash2(i, 2, 77) * 0.55, ph: hash2(i, 3, 77) * 6.28, sp: 1 + hash2(i, 4, 77) * 2.5 });
    }
  }

  /** Register a planted prop sprite (anchored at its bottom center). */
  add(s: Sprite, kind: DecorKind, x: number, y: number, wPx: number, hPx: number, scale: number, halo?: Sprite): void {
    const life = LIFE[kind];
    if (!life) return;
    const k = scale / this.ppm;
    this.live.push({ s, kind, x, y, w: wPx * k, h: hPx * k, life, ang: 0, vel: 0, hop: 0, hopV: 0, phase: hash2(Math.round(x * 10), 5) * 6.28, cool: 0, baseY: s.y, halo });
  }

  static glowOf(kind: DecorKind) {
    return LIFE[kind]?.glow;
  }

  /** A blast pushes everything around it away from the center. */
  blast(x: number, y: number, r: number, power = 1) {
    const reach = r * 3 + 2;
    for (const l of this.live) {
      const cx = l.x, cy = l.y - l.h / 2;
      const d = Math.hypot(cx - x, cy - y);
      if (d > reach) continue;
      const f = (1 - d / reach) * power * (l.life.give ?? 0);
      if (f <= 0.02) continue;
      l.vel += Math.sign(cx - x || 1) * f * 9;
      if (l.life.motion === 'rigid') l.hopV -= f * 3.5;
      if (l.cool <= 0 && l.life.shed && f > 0.15) this.shed(l, Math.sign(cx - x || 1), Math.min(14, 4 + f * 12));
    }
  }

  private shed(l: Live, dir: number, n: number) {
    const cols = l.life.shed!;
    this.particles.burst(l.x, l.y - l.h * (l.life.motion === 'sway' ? 0.75 : 0.5), Math.round(n), {
      speed: 3.2, colors: cols, life: l.life.motion === 'sway' ? 1.4 : 0.7, size: 0.1, g: l.life.motion === 'sway' ? 3 : 9, drag: 2.2, dir: dir > 0 ? -0.6 : -Math.PI + 0.6, spread: 1.6, up: 1,
    });
    l.cool = 0.5;
  }

  update(dt: number, time: number, cars: { x: number; y: number; vx: number; vy: number }[], view: { x0: number; y0: number; x1: number; y1: number }, screen: { w: number; h: number; ps: number }) {
    dt = Math.min(dt, 1 / 20);
    for (const l of this.live) {
      l.cool -= dt;
      const lf = l.life;
      if (lf.motion === 'hover') {
        l.s.y = l.baseY + Math.sin(time * 1.6 + l.phase) * 0.18;
        l.s.rotation = Math.sin(time * 1.1 + l.phase) * 0.03;
        if (l.halo) { l.halo.y = l.s.y - (lf.glow!.y / this.ppm); l.halo.alpha = 0.22 + 0.08 * Math.sin(time * 5); }
        continue;
      }
      if (lf.motion === 'none') {
        if (l.halo) l.halo.alpha = 0.2 + 0.1 * Math.sin(time * 2.4 + l.phase);
        continue;
      }
      // cars brushing past
      for (const c of cars) {
        const dx = c.x - l.x;
        if (Math.abs(dx) > l.w / 2 + 1.1) continue;
        if (c.y < l.y - l.h - 1.2 || c.y > l.y + 1.2) continue;
        const sp = Math.abs(c.vx) + Math.abs(c.vy) * 0.4;
        if (sp < 1.2) continue;
        const give = lf.give ?? 0;
        l.vel += Math.sign(c.vx) * give * sp * 4 * dt * (lf.motion === 'sway' ? 2.2 : 1);
        if (lf.motion === 'rigid' && l.cool <= 0 && sp > 4) l.hopV -= give * Math.min(3, sp * 0.3);
        if (l.cool <= 0 && lf.shed && sp > 3) this.shed(l, Math.sign(c.vx), 3 + sp * 0.6);
      }
      // spring toward the wind
      const wind = lf.wind ? Math.sin(time * (lf.speed ?? 1) + l.phase) * lf.wind + Math.sin(time * 0.37 + l.phase * 2) * lf.wind * 0.5 : 0;
      const k = lf.motion === 'sway' ? 40 : lf.motion === 'stiff' ? 90 : 160;
      const c = lf.motion === 'sway' ? 4 : 8;
      l.vel += (-(l.ang - wind) * k - l.vel * c) * dt;
      l.ang += l.vel * dt;
      const lim = lf.motion === 'sway' ? 0.55 : lf.motion === 'stiff' ? 0.25 : 0.18;
      l.ang = Math.max(-lim, Math.min(lim, l.ang));
      if (lf.motion === 'rigid') {
        // rigid props tip instead of bend, and light ones hop
        l.s.rotation = l.ang;
        l.hopV += 30 * dt;
        l.hop += l.hopV * dt;
        if (l.hop > 0) { l.hop = 0; l.hopV = -l.hopV * 0.3; if (Math.abs(l.hopV) < 0.3) l.hopV = 0; }
        l.s.y = l.baseY + l.hop * 0.25;
      } else {
        l.s.skew.x = -l.ang;
      }
      if (l.halo) {
        const g = lf.glow!;
        const top = g.y / this.ppm;
        l.halo.x = l.x + Math.sin(l.ang) * top;
        l.halo.alpha = 0.26 + 0.08 * Math.sin(time * 3 + l.phase) + (hash2(Math.floor(time * 12), Math.round(l.x)) > 0.93 ? 0.06 : 0);
      }
    }
    // drifting motes
    const d = DRIFT[this.theme];
    if (d) {
      const area = ((view.x1 - view.x0) * (view.y1 - view.y0)) / 400;
      this.acc += d.rate * area * dt;
      while (this.acc >= 1) {
        this.acc -= 1;
        const x = view.x0 + Math.random() * (view.x1 - view.x0);
        const y = d.from === 'top' ? view.y0 - 0.5 : d.from === 'bottom' ? view.y1 + 0.5 : view.y0 + Math.random() * (view.y1 - view.y0);
        const r = (a: [number, number]) => a[0] + Math.random() * (a[1] - a[0]);
        this.particles.spawn(x, y, { vx: r(d.vx), vy: r(d.vy), g: d.g ?? 0, life: d.life * (0.7 + Math.random() * 0.6), size: d.size * (0.7 + Math.random() * 0.6), color: d.colors[Math.floor(Math.random() * d.colors.length)], shrink: false, drag: 0, spin: (Math.random() - 0.5) * 3, alpha: 0.9 });
      }
    }
    for (const st of this.starSprites) {
      st.s.position.set(Math.round(st.fx * screen.w), Math.round(st.fy * screen.h));
      st.s.width = st.s.height = screen.ps * (st.sp > 3 ? 2 : 1);
      st.s.alpha = 0.35 + 0.65 * Math.max(0, Math.sin(time * st.sp + st.ph));
    }
  }
}
