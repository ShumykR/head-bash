import { Container, Sprite, type Texture, type TilingSprite } from 'pixi.js';
import type { Emitter } from '../maps/backdrop';
import { hash2 } from './color';

/*
 * Small animations on the parallax layers, all pure functions of time so nothing has to be
 * simulated: smoke and steam, blinking windows and beacons, glowing lanterns and floodlights,
 * camera flashes, drips, will-o'-wisps, twinkling crystals, windmill sails, sea glints, lava.
 * Plus a flock of birds crossing daytime skies now and then.
 */

interface LayerFx { sprite: TilingSprite; w: number; emitters: Emitter[]; box: Container; used: number }

const frac = (v: number) => v - Math.floor(v);

export class BgLife {
  private layers: LayerFx[] = [];
  readonly birds = new Container();
  private hasBirds = false;

  constructor(private square: Texture, private halo: Texture) {}

  reset(birds: boolean) {
    this.layers = [];
    this.hasBirds = birds;
    this.birds.removeChildren();
  }

  /** Register a layer; returns the container to put right above its sprite. */
  add(sprite: TilingSprite, w: number, emitters: Emitter[]): Container {
    const box = new Container();
    this.layers.push({ sprite, w, emitters, box, used: 0 });
    return box;
  }

  private sq(box: Container, used: number, tex: Texture): Sprite {
    let s = box.children[used] as Sprite | undefined;
    if (!s) { s = new Sprite(tex); box.addChild(s); }
    if (s.texture !== tex) s.texture = tex;
    s.visible = true;
    s.rotation = 0;
    s.anchor.set(0.5);
    return s;
  }

  update(time: number, ps: number, W: number, H: number) {
    for (const L of this.layers) {
      let n = 0;
      const tw = L.w * ps;
      const ox = L.sprite.tilePosition.x, oy = L.sprite.y;
      for (const e of L.emitters) {
        // the strip repeats: draw the emitter at every copy that is on screen
        let x0 = ((ox + e.x * ps) % tw + tw) % tw - tw;
        for (; x0 < W + tw; x0 += tw) {
          if (x0 < -60 || x0 > W + 60) continue;
          n = this.draw(L.box, n, e, x0, oy + e.y * ps, time, ps);
        }
      }
      for (let i = n; i < L.box.children.length; i++) L.box.children[i].visible = false;
    }
    this.flock(time, ps, W, H);
  }

  /** One emitter at screen (x, y); returns the next free sprite index. */
  private draw(box: Container, n: number, e: Emitter, x: number, y: number, t: number, ps: number): number {
    const sd = e.seed * 0.618;
    const put = (px: number, py: number, size: number, color: number, alpha: number, tex = this.square) => {
      const s = this.sq(box, n++, tex);
      s.position.set(Math.round(px), Math.round(py));
      s.width = s.height = size;
      s.tint = color;
      s.alpha = alpha;
      return s;
    };
    switch (e.kind) {
      case 'smoke':
      case 'steam': {
        const steam = e.kind === 'steam';
        const N = steam ? 5 : 6;
        for (let i = 0; i < N; i++) {
          const k = frac(t * (steam ? 0.55 : 0.22) + i / N + sd);
          const drift = Math.sin(k * 3 + i + sd) * ps * 2 + k * ps * (steam ? 4 : 10);
          const size = ps * (e.size + 1 + k * (steam ? 3 : 5));
          put(x + drift, y - k * ps * (steam ? 14 : 30), Math.round(size / ps) * ps, e.color, (1 - k) * (steam ? 0.5 : 0.65));
        }
        break;
      }
      case 'blink': {
        const on = Math.sin(t * (1.2 + hash2(e.seed, 1) * 2.5) + sd * 5) > 0.2;
        if (on) put(x, y, ps * e.size, e.color, 1);
        if (on && e.color === 0xff3a3a) put(x, y, ps * 5, e.color, 0.25, this.halo);
        break;
      }
      case 'glow': {
        const a = 0.22 + 0.1 * Math.sin(t * 2.6 + sd * 4) + (hash2(Math.floor(t * 10), e.seed) > 0.92 ? 0.06 : 0);
        put(x, y, ps * (e.size * 4 + 3), e.color, a, this.halo);
        break;
      }
      case 'flash': {
        // a camera goes off every few seconds
        const slot = Math.floor(t * 3 + sd);
        if (hash2(slot, e.seed) > 0.93 && frac(t * 3 + sd) < 0.5) {
          put(x, y, ps * 2, 0xffffff, 1);
          put(x, y, ps * 7, 0xffffff, 0.35, this.halo);
        }
        break;
      }
      case 'drip': {
        const k = frac(t * 0.45 + sd);
        if (k < 0.75) {
          const q = k / 0.75;
          put(x, y + q * q * ps * 30, ps, e.color, 1 - q * 0.6);
        }
        break;
      }
      case 'wisp': {
        const wx = x + Math.sin(t * 0.9 + sd * 3) * ps * 4, wy = y + Math.cos(t * 1.3 + sd) * ps * 3;
        put(wx, wy, ps * 6, e.color, 0.3, this.halo);
        put(wx, wy, ps * 2, e.color, 0.9);
        break;
      }
      case 'twinkle': {
        const b = Math.pow(Math.max(0, Math.sin(t * 1.4 + sd * 7)), 6);
        if (b > 0.05) {
          put(x, y, ps, 0xffffff, b);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(x + dx * ps, y + dy * ps, ps, e.color, b * 0.8);
        }
        break;
      }
      case 'mill': {
        for (let i = 0; i < 4; i++) {
          const s = this.sq(box, n++, this.square);
          s.anchor.set(0, 0.5);
          s.position.set(Math.round(x), Math.round(y));
          s.width = e.size * ps;
          s.height = ps * 2;
          s.tint = e.color;
          s.alpha = 1;
          s.rotation = t * 0.9 + (i * Math.PI) / 2;
        }
        put(x, y, ps * 2, 0x3a2a20, 1);
        break;
      }
      case 'shimmer': {
        const b = Math.sin(t * 2.2 + sd * 9);
        if (b > 0.75) put(x + Math.sin(t + sd) * ps * 3, y, ps * 2, 0xffffff, (b - 0.75) * 4);
        break;
      }
      case 'lava': {
        put(x, y, ps * (e.size * 5 + Math.sin(t * 3 + sd) * 2), e.color, 0.35, this.halo);
        for (let i = 0; i < 3; i++) {
          const k = frac(t * 0.6 + i / 3 + sd);
          const dir = (hash2(Math.floor(t * 0.6 + i / 3 + sd), i, e.seed) - 0.5) * 2;
          put(x + dir * k * ps * 8, y - (k * 1.6 - k * k * 1.4) * ps * 22, ps * 2, k < 0.5 ? 0xffd040 : e.color, 1 - k * 0.7);
        }
        break;
      }
    }
    return n;
  }

  /** A loose V of birds crossing the sky every ~25 seconds. */
  private flock(t: number, ps: number, W: number, H: number) {
    let n = 0;
    if (this.hasBirds) {
      const period = 26, k = frac(t / period);
      const cycle = Math.floor(t / period);
      const dir = hash2(cycle, 3) > 0.5 ? 1 : -1;
      const span = W + 40 * ps;
      const cx = dir > 0 ? -20 * ps + k * span : W + 20 * ps - k * span;
      const cy = H * (0.12 + hash2(cycle, 5) * 0.2);
      const count = 3 + Math.floor(hash2(cycle, 7) * 4);
      for (let i = 0; i < count; i++) {
        const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1;
        const bx = cx - dir * row * 7 * ps, by = cy + side * row * 4 * ps + Math.sin(t * 2 + i) * ps;
        const up = Math.sin(t * 9 + i * 1.7) > 0;
        const parts: [number, number][] = up ? [[0, 0], [-1, -1], [1, -1], [-2, -1], [2, -1]] : [[0, 0], [-1, 0], [1, 0], [-2, 1], [2, 1]];
        for (const [dx, dy] of parts) {
          const s = this.sq(this.birds, n++, this.square);
          s.position.set(Math.round(bx + dx * ps), Math.round(by + dy * ps));
          s.width = s.height = ps;
          s.tint = 0x2a2438;
          s.alpha = 0.85;
        }
      }
    }
    for (let i = n; i < this.birds.children.length; i++) this.birds.children[i].visible = false;
  }
}
