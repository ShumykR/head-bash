import type { Body } from 'planck';
import type { Game } from '../game/game';

/**
 * State hash for lockstep desync detection.
 *
 * Both online clients hash their simulation every N steps; a mismatch means
 * the two worlds have diverged. The hash covers every physics body (exact
 * float bits of position, angle and velocities, in world order) plus the
 * game-level counters that drive the match.
 */

const buf = new DataView(new ArrayBuffer(8));

/** FNV-1a over 32-bit words. */
class Fnv {
  h = 0x811c9dc5;
  word(w: number) {
    for (let i = 0; i < 4; i++) {
      this.h ^= (w >>> (i * 8)) & 0xff;
      this.h = Math.imul(this.h, 0x01000193);
    }
  }
  /** Exact bits of a float64 (so -0 and 0, and every last ulp, differ). */
  num(x: number) {
    buf.setFloat64(0, x);
    this.word(buf.getUint32(0));
    this.word(buf.getUint32(4));
  }
  int(x: number) {
    this.word(x | 0);
  }
  get value(): number {
    return this.h >>> 0;
  }
}

function hashBody(f: Fnv, b: Body) {
  const p = b.getPosition(), v = b.getLinearVelocity();
  f.num(p.x);
  f.num(p.y);
  f.num(b.getAngle());
  f.num(v.x);
  f.num(v.y);
  f.num(b.getAngularVelocity());
  f.int(b.isAwake() ? 1 : 0);
}

function bodies(game: Game): Body[] {
  const out: Body[] = [];
  for (let b = game.world.getBodyList(); b; b = b.getNext()) out.push(b);
  return out;
}

/** One 32-bit hash of the whole simulation state. */
export function stateHash(game: Game): number {
  const f = new Fnv();
  f.int(game.stepCount);
  f.int(game.match.round);
  f.int(game.match.scores[0]);
  f.int(game.match.scores[1]);
  f.int(game.mapIndex);
  f.int((game as unknown as { rngState: number }).rngState);
  f.num(game.time);
  f.int(game.shots.length);
  f.int(game.items.length);
  for (const c of game.cars) {
    f.int(c.alive ? 1 : 0);
    f.num(c.abilityCd);
  }
  const list = bodies(game);
  f.int(list.length);
  for (const b of list) hashBody(f, b);
  return f.value;
}

/**
 * Per-body hashes, for pinpointing where two worlds first differ
 * (diff two of these after a desync).
 */
export function stateHashDetail(game: Game): { counters: number; bodies: number[] } {
  const c = new Fnv();
  c.int(game.stepCount);
  c.int(game.match.round);
  c.int(game.match.scores[0]);
  c.int(game.match.scores[1]);
  c.int((game as unknown as { rngState: number }).rngState);
  return {
    counters: c.value,
    bodies: bodies(game).map((b) => {
      const f = new Fnv();
      hashBody(f, b);
      return f.value;
    }),
  };
}
