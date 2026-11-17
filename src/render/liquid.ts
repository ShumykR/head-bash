import { Container, Sprite, TilingSprite, type Texture } from 'pixi.js';
import { ART_PPM } from '../physics/constants';
import { BODY_H, DEEP, LIQ_W, SURF_H, lavaGlow, liquidBody, liquidSurface, type LiquidKind, type Tex } from '../maps/liquids';
import { toHex } from './color';
import type { Particles } from './particles';

/**
 * A pool of water or lava: a crest strip on top, a body that darkens with depth, a flat deep fill
 * below that, and (lava) a heat glow above. The crest and body drift at different speeds; lava
 * pops bubbles and throws up embers, water glints.
 */
export class LiquidView {
  readonly root = new Container();
  private body: TilingSprite;
  private deep: Sprite;
  private top: TilingSprite;
  private glow: TilingSprite | null = null;
  private x = 0;
  private y = 0;
  private acc = 0;

  constructor(readonly kind: LiquidKind, private wM: number, hM: number, tex: (key: string, make: () => Tex) => Texture, white: Texture) {
    const W = Math.ceil(wM * ART_PPM), H = Math.ceil(hM * ART_PPM);
    this.body = new TilingSprite({ texture: tex(`liq:${kind}:body`, () => liquidBody(kind)), width: W, height: Math.min(H, BODY_H) });
    this.body.scale.set(1 / ART_PPM);
    this.deep = new Sprite(white);
    this.deep.tint = toHex(DEEP[kind]);
    this.deep.width = wM;
    this.deep.height = Math.max(0, (H - BODY_H) / ART_PPM);
    this.deep.visible = H > BODY_H;
    this.top = new TilingSprite({ texture: tex(`liq:${kind}:top`, () => liquidSurface(kind)), width: W, height: SURF_H });
    this.top.scale.set(1 / ART_PPM);
    if (kind === 'lava') {
      this.glow = new TilingSprite({ texture: tex('liq:lava:glow', () => lavaGlow()), width: W, height: 12 });
      this.glow.scale.set(1 / ART_PPM);
      this.root.addChild(this.glow);
    }
    this.root.addChild(this.deep, this.body, this.top);
  }

  /** Top-left corner of the liquid (its surface), world metres. */
  place(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.body.position.set(x, y);
    this.deep.position.set(x, y + BODY_H / ART_PPM);
    this.top.position.set(x, y - 4 / ART_PPM);
    this.glow?.position.set(x, y - 15 / ART_PPM);
  }

  update(dt: number, time: number, particles: Particles) {
    const lava = this.kind === 'lava';
    this.body.tilePosition.x = Math.round(time * (lava ? 2 : 4)) % LIQ_W;
    this.top.tilePosition.x = Math.round(time * (lava ? 5 : -12)) % LIQ_W;
    // water bobs a pixel up and down
    if (!lava) this.top.y = this.y - 4 / ART_PPM + Math.round(Math.sin(time * 2.2)) / ART_PPM;
    if (this.glow) this.glow.alpha = 0.55 + 0.25 * Math.sin(time * 2.7) + 0.1 * Math.sin(time * 7.3);
    // bubbles and embers (lava), glints (water), spread over the width
    this.acc += dt * this.wM * (lava ? 0.18 : 0.25);
    while (this.acc >= 1) {
      this.acc -= 1;
      const x = this.x + Math.random() * this.wM;
      if (lava) {
        if (Math.random() < 0.6) particles.burst(x, this.y - 0.05, 5, { speed: 2.4, colors: [0xfff6c0, 0xffd860, 0xff8a2a], life: 0.5, size: 0.1, g: 12, drag: 1, up: 1.5, spread: 1.4 });
        else particles.spawn(x, this.y - 0.1, { vx: (Math.random() - 0.5) * 0.6, vy: -1.2 - Math.random(), life: 1.6, size: 0.08, color: Math.random() > 0.5 ? 0xffa030 : 0xff6a1a, shrink: true });
      } else {
        particles.spawn(x, this.y + Math.random() * 0.25, { life: 0.35, size: 0.09, color: 0xffffff, shrink: true, alpha: 0.9 });
      }
    }
  }

  destroy() {
    this.root.destroy({ children: true });
  }
}
