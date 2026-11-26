/**
 * Twin: keeps a second copy of an object graph (the game shown on screen) equal to a source
 * graph (the authoritative game), reusing the copy's own objects wherever it can.
 *
 * Online rollback runs two Games: the authoritative one steps only on confirmed inputs (its hashes
 * are compared between players, so it must never be touched), and the shown one runs ahead on a
 * predicted input for the other player. When the prediction was wrong, `sync` copies the
 * authoritative state into the shown game in place: every source object gets a "twin" in the shown
 * graph (found by `pair` or made fresh), and the twin's fields are overwritten. Reusing twins keeps
 * the renderer's sprites attached to the same car and body objects.
 *
 * Rules that keep the source safe:
 *  - nothing is ever written into a source object or into an object both graphs share (config);
 *  - functions are never copied from the source (they may be closures over source objects): the
 *    twin keeps its own, except a few planck fields known to hold plain functions;
 *  - planck's object pools are not used by the shown game (`isolated`), so an object never moves
 *    between the two graphs through a pool.
 */

/** Fields never copied: event listeners, hooks and planck's broad-phase closures (the twin keeps its own). */
const SKIP = new Set(['listeners', '_listeners', 'onStep', 'query', 'queryCallback', 'm_callback']);
/** Fields that hold plain functions (no captured state): copied by reference. */
const PURE_FN = new Set(['_createFn', '_releaseFn', '_allocateFn', '_discardFn', 'm_evaluateFcn']);

type Any = Record<string, unknown>;

const isObj = (v: unknown): v is object => typeof v === 'object' && v !== null;

export class TwinError extends Error {}

// Bookkeeping lives in side tables: tagging planck's objects with extra properties would change
// their shapes and make every physics step several times slower.
type Tagged = Any;

export interface TwinOptions {
  /** Objects that never change once made (static terrain shapes): copied once, then left alone. */
  frozen?: (o: object) => boolean;
  /** Objects with exactly the fields x and y (planck's Vec2): copied without listing their keys. */
  vecProto?: object;
}

export class Twin {
  /** Objects both graphs reach (config, static tables): never copied, never written. */
  private shared = new WeakSet<object>();
  /** Source object → its twin. */
  private twins = new WeakMap<object, Tagged>();
  /** Objects of the copy (a source must never reach one). */
  private own = new WeakSet<object>();
  /** Objects created by the last `sync` (no twin to reuse). */
  created = 0;
  /** Objects the last `sync` visited. */
  visited = 0;

  constructor(private readonly opts: TwinOptions = {}) {}

  /**
   * `src` and `dst` are identical copies (built from the same config and stepped the same way):
   * pair them object for object. Objects both reach (config, static tables) are marked shared.
   * Returns false if the two graphs differ in shape (they were not identical after all).
   *
   * `loose`: the two are only nearly equal (the copy ran a few ticks ahead): pair what lies at the
   * same place with the same type and skip the rest. It only decides which of the copy's objects
   * the next `sync` reuses, so the renderer keeps its sprites; `sync` itself stays exact.
   */
  pair(src: object, dst: object, loose = false): boolean {
    const stack: [unknown, unknown][] = [[src, dst]];
    const seen = new Set<object>();
    const claimed = new Set<object>();
    while (stack.length) {
      const [a, b] = stack.pop()!;
      if (!isObj(a) || !isObj(b)) {
        if (isObj(a) !== isObj(b) && !loose) return false;
        continue;
      }
      if (a === b) {
        this.shared.add(a);
        continue;
      }
      if (seen.has(a)) continue;
      if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b) || claimed.has(b) || this.shared.has(b)) {
        if (!loose) return false;
        continue;
      }
      seen.add(a);
      claimed.add(b);
      this.twins.set(a, b as Tagged);
      this.own.add(b);
      if (Array.isArray(a)) {
        const bb = b as unknown[];
        if (a.length !== bb.length && !loose) return false;
        for (let i = 0; i < Math.min(a.length, bb.length); i++) stack.push([a[i], bb[i]]);
      } else if (a instanceof Map) {
        const bb = b as Map<unknown, unknown>;
        if (a.size !== bb.size && !loose) return false;
        const ea = [...a], eb = [...bb];
        for (let i = 0; i < Math.min(ea.length, eb.length); i++) stack.push([ea[i][0], eb[i][0]], [ea[i][1], eb[i][1]]);
      } else if (a instanceof Set) {
        const bb = b as Set<unknown>;
        if (a.size !== bb.size && !loose) return false;
        const ea = [...a], eb = [...bb];
        for (let i = 0; i < Math.min(ea.length, eb.length); i++) stack.push([ea[i], eb[i]]);
      } else if (!ArrayBuffer.isView(a)) {
        const ka = Object.keys(a);
        if (!loose) {
          const kb = Object.keys(b);
          if (ka.length !== kb.length) return false;
          for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return false;
        }
        for (let i = 0; i < ka.length; i++) {
          if (!SKIP.has(ka[i]) && ka[i] in b) stack.push([(a as Any)[ka[i]], (b as Any)[ka[i]]]);
        }
      }
    }
    return true;
  }

  /**
   * Make `dst` (and everything it reaches) an exact copy of `src`. Throws TwinError if the source
   * holds a function the twin cannot get on its own, or reaches one of our own objects (the caller
   * then stops using `dst`). Returns the fresh twins that miss skipped fields (a new planck World
   * has no listeners yet).
   */
  sync(src: object, dst: object): object[] {
    const shared = this.shared, twins = this.twins, own = this.own, frozen = this.opts.frozen, vecProto = this.opts.vecProto;
    const incomplete: object[] = [];
    const stack: Tagged[] = [];
    const seen = new Set<object>();
    const made = new Set<object>();
    let created = 0, visited = 0;
    const twinOf = (a: Tagged): Tagged => {
      let d = twins.get(a);
      if (d === undefined || Object.getPrototypeOf(d) !== Object.getPrototypeOf(a)) {
        d = fresh(a) as Tagged;
        own.add(d);
        made.add(d);
        twins.set(a, d);
        created++;
        if (!Array.isArray(a) && !(a instanceof Map) && !(a instanceof Set)) {
          for (const k of Object.keys(a)) if (SKIP.has(k) && !(k in d)) { incomplete.push(d); break; }
        }
      }
      return d;
    };
    const m = (v: unknown): unknown => {
      if (typeof v !== 'object' || v === null) return v;
      const a = v as Tagged;
      if (!seen.has(a)) {
        if (shared.has(a)) return a;
        if (own.has(a)) throw new TwinError('the source reaches an object of the copy');
        seen.add(a);
        stack.push(a);
      }
      return twinOf(a);
    };
    const root = src as Tagged;
    twins.set(root, dst as Tagged);
    own.add(dst);
    seen.add(root);
    stack.push(root);

    while (stack.length) {
      const a = stack.pop()!;
      const d = twins.get(a)!;
      visited++;
      if (Object.getPrototypeOf(a) === vecProto) {
        d.x = a.x;
        d.y = a.y;
        continue;
      }
      // Never-changing objects: copied when first made, then left alone (their parts too).
      if (frozen && !made.has(d) && frozen(a)) continue;
      if (Array.isArray(a)) {
        const dd = d as unknown as unknown[];
        dd.length = a.length;
        for (let i = 0; i < a.length; i++) dd[i] = m(a[i]);
      } else if (a instanceof Map) {
        const dd = d as unknown as Map<unknown, unknown>;
        dd.clear();
        for (const [k, v] of a) dd.set(m(k), m(v));
      } else if (a instanceof Set) {
        const dd = d as unknown as Set<unknown>;
        dd.clear();
        for (const v of a) dd.add(m(v));
      } else if (ArrayBuffer.isView(a)) {
        (d as unknown as { set(x: unknown): void }).set(a);
      } else {
        const ka = Object.keys(a);
        // A field the source no longer has must not linger in the copy.
        const kd = Object.keys(d);
        if (kd.length !== ka.length) for (const k of kd) if (!SKIP.has(k) && !(k in a)) delete d[k];
        for (let i = 0; i < ka.length; i++) {
          const k = ka[i];
          if (SKIP.has(k)) continue;
          const v = a[k];
          if (typeof v === 'function') {
            // Plain functions follow the source (planck reuses a contact object for another shape pair).
            if (PURE_FN.has(k)) d[k] = v;
            else if (typeof d[k] !== 'function') throw new TwinError(`closure in field ${k}`);
          } else d[k] = m(v);
        }
      }
    }
    this.created = created;
    this.visited = visited;
    return incomplete;
  }
}

/** Classes whose constructor (no arguments) creates closures over the new object: build those with `new`. */
const CONSTRUCT = new WeakSet<object>();
export function constructTwinsOf(proto: object) {
  CONSTRUCT.add(proto);
}

function fresh(a: object): object {
  if (Array.isArray(a)) return [];
  if (a instanceof Map) return new Map();
  if (a instanceof Set) return new Set();
  const proto = Object.getPrototypeOf(a);
  if (ArrayBuffer.isView(a)) return new (proto.constructor)((a as unknown as { length: number }).length);
  if (proto && CONSTRUCT.has(proto)) return new (proto.constructor)();
  return Object.create(proto);
}

// --- planck object pools -------------------------------------------------------------------

let isolatedDepth = 0;
let poolsPatched = false;

/**
 * planck recycles some objects (tree nodes, contacts) through module-wide pools. The shown game
 * must not hand objects to the authoritative one that way: while `isolated` runs, pools neither
 * give out recycled objects nor take any back. Pass any planck Pool instance once to patch them.
 */
export function patchPools(samplePool: object) {
  if (poolsPatched) return;
  poolsPatched = true;
  const proto = Object.getPrototypeOf(samplePool) as {
    allocate(this: PoolLike): unknown;
    release(this: PoolLike, item: unknown): void;
  };
  const allocate = proto.allocate, release = proto.release;
  proto.allocate = function (this: PoolLike) {
    if (!isolatedDepth) return allocate.call(this);
    const item = this._hasCreateFn ? this._createFn!() : {};
    if (this._hasAllocateFn) this._allocateFn!(item);
    return item;
  };
  proto.release = function (this: PoolLike, item: unknown) {
    if (!isolatedDepth) release.call(this, item);
  };
}
interface PoolLike { _hasCreateFn: boolean; _createFn?: () => unknown; _hasAllocateFn: boolean; _allocateFn?: (x: unknown) => void }

export function isolated<T>(fn: () => T): T {
  isolatedDepth++;
  try {
    return fn();
  } finally {
    isolatedDepth--;
  }
}

// --- the Game's physics world ------------------------------------------------------------

interface PlanckInternals {
  m_broadPhase: { m_tree: { inputPool: object } };
  getGravity(): object;
}

/**
 * A Twin set up for two Games' planck worlds: pools isolated, broad phases built with their own
 * closures, Vec2 fast path, and static terrain (chain shapes, static fixtures' proxies) copied once.
 */
export function twinForGames(sample: { world: unknown }): Twin {
  const w = sample.world as PlanckInternals;
  patchPools(w.m_broadPhase.m_tree.inputPool);
  constructTwinsOf(Object.getPrototypeOf(w.m_broadPhase));
  return new Twin({
    vecProto: Object.getPrototypeOf(w.getGravity()),
    frozen: (o) => {
      const x = o as { m_type?: unknown; proxyId?: unknown; fixture?: { m_body?: { m_type?: unknown } } };
      return x.m_type === 'chain' || (x.proxyId !== undefined && x.fixture?.m_body?.m_type === 'static');
    },
  });
}
