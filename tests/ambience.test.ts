import { describe, expect, it } from 'vitest';
import { Sprite } from 'pixi.js';
import { Ambience } from '../src/render/ambience';
import type { Particles } from '../src/render/particles';

const view = { x0: 0, y0: 0, x1: 30, y1: 15 };
const screen = { w: 900, h: 400, ps: 2 };

function setup(kind: 'spruce' | 'tombstone' | 'barn') {
  // counts what would be spawned (real particles need a canvas)
  const particles = { n: 0, spawn() { this.n++; }, burst(_x: number, _y: number, n: number) { this.n += n; } };
  const amb = new Ambience(particles as unknown as Particles, 14);
  amb.reset('moon'); // no drifting motes, so only shed particles count
  const s = new Sprite();
  s.position.set(10, 15);
  amb.add(s, kind, 10, 15, 26, 42, 1);
  return { amb, s, particles };
}

describe('arena ambience', () => {
  it('a car brushing past bends a tree and shakes snow off it', () => {
    const { amb, s, particles } = setup('spruce');
    let maxBend = 0;
    for (let i = 0; i < 40; i++) {
      amb.update(1 / 60, i / 60, [{ x: 9 + i * 0.05, y: 14.5, vx: 9, vy: 0 }], view, screen);
      maxBend = Math.max(maxBend, -s.skew.x);
    }
    expect(maxBend).toBeGreaterThan(0.1); // bends the way the car goes
    expect(particles.n).toBeGreaterThan(0);
    // and settles back to a gentle sway
    for (let i = 0; i < 600; i++) amb.update(1 / 60, 1 + i / 60, [], view, screen);
    expect(Math.abs(s.skew.x)).toBeLessThan(0.06);
  });

  it('a blast tips a tombstone away from it and makes it hop', () => {
    const { amb, s } = setup('tombstone');
    amb.blast(8, 14.5, 1.2, 1);
    let minRot = 0, minY = s.y;
    for (let i = 0; i < 20; i++) {
      amb.update(1 / 60, i / 60, [], view, screen);
      minRot = Math.max(minRot, s.rotation);
      minY = Math.min(minY, s.y);
    }
    expect(minRot).toBeGreaterThan(0.02);
    expect(minY).toBeLessThan(15);
  });

  it('buildings stay put', () => {
    const { amb, s } = setup('barn');
    amb.blast(10, 14, 2, 2);
    for (let i = 0; i < 30; i++) amb.update(1 / 60, i / 60, [{ x: 10, y: 14.5, vx: 12, vy: 0 }], view, screen);
    expect(s.rotation).toBe(0);
    expect(s.skew.x).toBe(0);
  });
});
