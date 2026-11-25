/**
 * Deterministic transcendental math.
 *
 * Online play is lockstep: both clients run the same simulation from the same
 * inputs and must stay bit-identical. JS engines do not guarantee identical
 * results for Math.sin/cos/tan/atan2/exp/pow/hypot: they differ between
 * engines (V8 vs JavaScriptCore) and even between V8 versions (Node 22 and a
 * current Chromium disagree on Math.atan2(sin(-0.12), cos(-0.12)) in the last
 * bit, which desyncs a match on the first step).
 *
 * The replacements are pure-JS fdlibm ports (stdlib) that use only IEEE-754
 * basic arithmetic, so every engine gets the same bits. Planck and the game
 * call `Math.sin(...)` etc. at call time, so swapping the functions on the
 * global Math object covers them without touching their code.
 *
 * Install once, before any simulation runs (main.ts does it at boot; the
 * tests do it in their setup file).
 */
import sin from '@stdlib/math-base-special-sin';
import cos from '@stdlib/math-base-special-cos';
import tan from '@stdlib/math-base-special-tan';
import atan2 from '@stdlib/math-base-special-atan2';
import exp from '@stdlib/math-base-special-exp';
import pow from '@stdlib/math-base-special-pow';
import hypot2 from '@stdlib/math-base-special-hypot';

/** Math.hypot takes any number of arguments; the game uses 2 (and rarely 3). */
function hypot(...xs: number[]): number {
  if (xs.length === 2) return hypot2(xs[0], xs[1]);
  if (xs.length === 0) return 0;
  if (xs.length === 1) return Math.abs(xs[0]);
  let r = hypot2(xs[0], xs[1]);
  for (let i = 2; i < xs.length; i++) r = hypot2(r, xs[i]);
  return r;
}

export const DET_MATH = { sin, cos, tan, atan2, exp, pow, hypot } as const;

let installed = false;

/** Replace the engine's transcendental Math functions with the deterministic ones. */
export function installDetMath() {
  if (installed) return;
  installed = true;
  Object.assign(Math, DET_MATH);
}

export function detMathInstalled(): boolean {
  return installed;
}
