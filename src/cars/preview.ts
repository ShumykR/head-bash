import { CAR_PPM } from '../physics/constants';
import { gridToRGBA, PixelGrid } from '../render/grid';
import type { RGB } from '../render/color';
import { carPalette, driverPalette, generateCarGrid, generateFxGrid, generateHeadGrid, generateLinkGrid, generateRiderGrid, generateWheelGrid, riderPalette, tone, wheelPalette } from './sprite';
import { FX_MAT, FX_PARAMS, boltPts, fxDir } from './fx';
import type { CarDef, CarPalette } from './types';
import { ITEMS, cargoSlots } from '../game/abilities';
import { DECOR_PAL, flailGrid, itemGrid } from '../maps/decor';
import { makeGrid, gset } from '../render/grid';

function gridCanvas(g: PixelGrid, pal: (RGB | null)[]) {
  const c = document.createElement('canvas');
  c.width = g.w;
  c.height = g.h;
  c.getContext('2d')!.putImageData(new ImageData(gridToRGBA(g, pal) as any, g.w, g.h), 0, 0);
  return c;
}

/**
 * Compose a static pixel-art preview of a car (body, wheels, driver) into a canvas,
 * scaled up by an integer factor. Used by the garage menu.
 */
export function carPreviewCanvas(def: CarDef, palette: CarPalette, playerColor: string, scale = 3, flip = false, animate = false): HTMLCanvasElement {
  animate = animate && !!def.fx?.length;
  const body = generateCarGrid(def);
  const head = generateHeadGrid(def.head.r);
  const torso = generateRiderGrid(def);
  const riderItem = { g: torso, c: gridCanvas(torso, riderPalette(playerColor)), x: -torso.ox, y: -torso.oy };
  const wheels = def.wheels.map((w) => generateWheelGrid(w));
  const items: { g: PixelGrid; c: HTMLCanvasElement; x: number; y: number; ghost?: boolean }[] = [];
  const dpal = driverPalette(playerColor);
  // Cargo lies in the bed behind the body: bed walls and closed bodies hide it.
  if (def.cargo) {
    const info = ITEMS[def.cargo.kind];
    const ig = itemGrid(def.cargo.kind, info.w, info.h, CAR_PPM);
    const ic = gridCanvas(ig, DECOR_PAL);
    for (const [x, y] of cargoSlots(def.cargo)) items.push({ g: ig, c: ic, x: x * CAR_PPM - ig.ox, y: y * CAR_PPM - ig.oy });
  }
  if (!def.cabin && !def.rider?.front) items.push(riderItem);
  const linkItems = (behind: boolean) => (def.links ?? []).forEach((ld, i) => {
    if (!!ld.behind !== behind) return;
    const lg = generateLinkGrid(def, i);
    items.push({ g: lg, c: gridCanvas(lg, carPalette(palette)), x: -lg.ox, y: -lg.oy });
    if (!behind) for (const w of (ld.wheels ?? []).filter((q) => !q.hidden)) { const wg = generateWheelGrid(w); items.push({ g: wg, c: gridCanvas(wg, wheelPalette(palette)), x: w.x * CAR_PPM - wg.ox, y: w.y * CAR_PPM - wg.oy }); }
  });
  linkItems(true);
  items.push({ g: body, c: gridCanvas(body, carPalette(palette)), x: -body.ox, y: -body.oy });
  if (!def.cabin && def.rider?.front) items.push(riderItem);
  const fxg = generateFxGrid(def);
  // Animated previews leave room for the effects but draw them live (see animateFx).
  if (fxg) items.push({ g: fxg, c: gridCanvas(fxg, carPalette(palette)), x: -fxg.ox, y: -fxg.oy, ghost: animate });
  items.push({ g: head, c: gridCanvas(head, dpal), x: def.head.x * CAR_PPM - head.ox, y: def.head.y * CAR_PPM - head.oy });
  def.wheels.forEach((w, i) => !w.hidden && items.push({ g: wheels[i], c: gridCanvas(wheels[i], wheelPalette(palette)), x: w.x * CAR_PPM - wheels[i].ox, y: w.y * CAR_PPM - wheels[i].oy }));
  linkItems(false);
  for (const ld of def.links ?? []) if (ld.behind) for (const w of (ld.wheels ?? []).filter((q) => !q.hidden)) { const wg = generateWheelGrid(w); items.push({ g: wg, c: gridCanvas(wg, wheelPalette(palette)), x: w.x * CAR_PPM - wg.ox, y: w.y * CAR_PPM - wg.oy }); }
  if (def.flail) {
    const fl = def.flail;
    const fg = flailGrid(fl.look, fl.r, CAR_PPM);
    const bx = fl.at[0] * CAR_PPM, by = (fl.at[1] + fl.len) * CAR_PPM;
    const n = Math.max(1, Math.round(fl.len * CAR_PPM - fl.r * CAR_PPM));
    const chain = makeGrid(2, n, 0, 0);
    for (let i = 0; i < n; i++) { gset(chain, 0, i, i % 3 === 2 ? 1 : 4); gset(chain, 1, i, i % 3 === 2 ? 1 : 3); }
    items.push({ g: chain, c: gridCanvas(chain, DECOR_PAL), x: bx - 1, y: fl.at[1] * CAR_PPM });
    items.push({ g: fg, c: gridCanvas(fg, DECOR_PAL), x: bx - fg.ox, y: by - fg.oy });
  }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const it of items) {
    x0 = Math.min(x0, it.x); y0 = Math.min(y0, it.y);
    x1 = Math.max(x1, it.x + it.g.w); y1 = Math.max(y1, it.y + it.g.h);
  }
  const pad = animate ? 6 : 0;
  x0 -= pad; y0 -= pad * 2; x1 += pad; y1 += pad;
  const W = Math.ceil(x1 - x0) + 2, H = Math.ceil(y1 - y0) + 2;
  const out = document.createElement('canvas');
  out.width = W * scale;
  out.height = H * scale;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  if (flip) {
    ctx.translate(out.width, 0);
    ctx.scale(-1, 1);
  }
  for (const it of items) if (!it.ghost) ctx.drawImage(it.c, Math.round((it.x - x0 + 1)) * scale, Math.round((it.y - y0 + 1)) * scale, it.g.w * scale, it.g.h * scale);
  if (animate) animateFx(out, def, palette, scale, flip, (-x0 + 1) * scale, (-y0 + 1) * scale);
  return out;
}

interface Puff { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; g: number; drag: number; grow: number; alpha: number; col: string }

/**
 * Plays the car's effects over a finished preview, the way the game does: puffs of smoke and
 * steam, sparks, fizz, flames and trails as pixel squares, lightning that re-forks and blinks,
 * beams that breathe. Runs while the canvas is on the page (and stops once it is gone).
 */
function animateFx(out: HTMLCanvasElement, def: CarDef, palette: CarPalette, scale: number, flip: boolean, ox: number, oy: number) {
  const base = document.createElement('canvas');
  base.width = out.width; base.height = out.height;
  base.getContext('2d')!.drawImage(out, 0, 0);
  const ctx = out.getContext('2d')!;
  const pal = carPalette(palette);
  const css = (m: Parameters<typeof tone>[0], t: number) => { const c = pal[tone(m, t)]!; return `rgb(${c[0]},${c[1]},${c[2]})`; };
  const fx = def.fx!, cols = fx.map((e) => { const m = e.mat ?? FX_MAT[e.kind]; return [css(m, 2), css(m, 4)]; });
  const k = CAR_PPM * scale, px = (v: number) => Math.round(v * k / scale) * scale;
  const puffs: Puff[] = [];
  let last = performance.now(), t = 0, seen = false;
  const born = last;
  const frame = (now: number) => {
    if (out.isConnected) seen = true;
    else if (seen || now - born > 3000) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now; t += dt;
    fx.forEach((e, i) => {
      if (e.kind === 'bolt' || e.kind === 'beam') return;
      const P = FX_PARAMS[e.kind];
      if (Math.random() > (e.rate ?? 1) * P.rate * dt) return;
      const [ux, uy] = fxDir(e), s = e.size ?? 0.2, sp = P.speed * (0.7 + Math.random() * 0.6), j = (Math.random() - 0.5) * P.jitter;
      let x = e.at[0], y = e.at[1];
      if (e.kind === 'rain' && e.to) { const q = Math.random(); x += (e.to[0] - x) * q; y += (e.to[1] - y) * q; }
      // a parked car: trails and flames drift back as if it were driving
      const drift = e.kind === 'trail' ? -4 : 0;
      const life = P.life * (0.8 + Math.random() * 0.4);
      puffs.push({ x, y, vx: ux * sp - uy * j + drift, vy: uy * sp + ux * j, life, max: life, size: s * P.size, g: P.g, drag: P.drag, grow: P.grow, alpha: P.alpha, col: cols[i][Math.random() < 0.5 ? 0 : 1] });
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, out.width, out.height);
    ctx.drawImage(base, 0, 0);
    if (flip) ctx.setTransform(-1, 0, 0, 1, out.width, 0);
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.life -= dt;
      if (p.life <= 0) { puffs.splice(i, 1); continue; }
      p.vy += p.g * dt;
      const d = Math.exp(-p.drag * dt);
      p.vx *= d; p.vy *= d; p.x += p.vx * dt; p.y += p.vy * dt;
      const f = p.life / p.max, sz = Math.max(scale, px(p.grow ? p.size * (1 + p.grow * (1 - f)) : p.size * (0.3 + 0.7 * f)));
      ctx.globalAlpha = Math.min(1, f * 2.5) * p.alpha;
      ctx.fillStyle = p.col;
      ctx.fillRect(ox + px(p.x) - sz / 2, oy + px(p.y) - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
    fx.forEach((e, i) => {
      const s = e.size ?? 0.2, [ux, uy] = fxDir(e);
      const to = e.to ?? [e.at[0] + ux, e.at[1] + uy];
      if (e.kind === 'bolt') {
        const tick = Math.floor(t * 9 + i * 3.7);
        if (Math.sin(tick * 2.17) < -0.35) return;
        const pts = boltPts(e.at, to, 5, s * 0.8, tick);
        for (const [w, c] of [[s * 0.45, cols[i][0]], [s * 0.18, '#ffffff']] as const) {
          ctx.beginPath();
          pts.forEach(([x, y], n) => (n ? ctx.lineTo : ctx.moveTo).call(ctx, ox + x * k, oy + y * k));
          ctx.lineWidth = Math.max(scale, w * k); ctx.strokeStyle = c; ctx.stroke();
        }
      } else if (e.kind === 'beam') {
        const dx = to[0] - e.at[0], dy = to[1] - e.at[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
        const w0 = s * 0.4, w1 = s * (1.5 + 0.15 * Math.sin(t * 5));
        ctx.globalAlpha = 0.3 + 0.12 * Math.sin(t * 7);
        ctx.fillStyle = cols[i][0];
        ctx.beginPath();
        for (const [x, y] of [[e.at[0] + nx * w0, e.at[1] + ny * w0], [to[0] + nx * w1, to[1] + ny * w1], [to[0] - nx * w1, to[1] - ny * w1], [e.at[0] - nx * w0, e.at[1] - ny * w0]]) ctx.lineTo(ox + x * k, oy + y * k);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
