import type { Body } from 'planck';
import type { Game, GameEvent } from '../game/game';
import type { Car } from '../cars/car';

/**
 * Bug report: a JSON snapshot of the running match plus a short flight recording (the last
 * few seconds of car states and events), so a screenshot can come with the numbers behind it.
 */

const HISTORY_S = 12;
/** One coarse sample per this many physics steps (60 Hz): every 0.1 s. */
const SAMPLE_STEPS = 6;
const SAMPLE_EVERY = SAMPLE_STEPS / 60;
const MAX_EVENTS = 80;
/** The dense buffer: every physics step of the last few seconds, copied out whenever a moment is marked. */
const DENSE_STEPS = 180;
const MAX_INCIDENTS = 3;
/** Items and shots closer than this to a driver's head are recorded around it. */
const NEAR_R = 3;
const NEAR_MAX = 6;

type Num = number;
const r = (v: Num, d = 3) => (Number.isFinite(v) ? Math.round(v * 10 ** d) / 10 ** d : v);

function bodyState(b: Body) {
  const p = b.getPosition(), v = b.getLinearVelocity();
  return { x: r(p.x), y: r(p.y), a: r(b.getAngle()), vx: r(v.x, 2), vy: r(v.y, 2), w: r(b.getAngularVelocity(), 2), awake: b.isAwake() };
}

/** Fields that sit at a non-zero value all the time, so they carry no information. */
const IDLE: Record<string, number> = { spillT: 1.5 };

/** The interesting plain fields of an object: numbers that are not zero and flags that are set (timers, counters, states). */
function primitives(o: object, skip: string[] = []): Record<string, number | boolean> {
  const out: Record<string, number | boolean> = {};
  for (const [k, v] of Object.entries(o)) {
    if (skip.includes(k)) continue;
    if (typeof v === 'number') { if (v !== 0 && IDLE[k] !== v) out[k] = r(v); }
    else if (v === true) out[k] = true;
  }
  return out;
}

function carState(c: Car, full: boolean) {
  const head = c.alive ? c.headWorld() : null;
  return {
    id: c.def.id,
    player: c.player,
    alive: c.alive,
    ability: c.def.ability ? c.def.ability.kind + (c.def.ability.projectile ? `:${c.def.ability.projectile}` : '') : null,
    traits: (c.def.traits ?? []).map((t) => t.kind),
    swims: c.canSwim,
    speed: r(c.speed, 2),
    angle: r(c.angle),
    wheelsOnGround: c.wheelsOnGround,
    inAir: c.inAir,
    head: head ? { x: r(head.x), y: r(head.y) } : null,
    chassis: bodyState(c.chassis),
    // Wheels and links are only needed for suspension / trailer bugs: `window.__reportFull = true` adds them.
    ...(full ? { wheels: c.wheels.map(bodyState), linkWheels: c.linkWheels.map((w) => bodyState(w.body)), links: c.links.map(bodyState) } : {}),
    mass: r(c.mass, 2),
    fields: primitives(c, ['player', 'alive', 'histTick', 'flipDir']),
  };
}

type Pt = { x: number; y: number };

/** Items and shots within NEAR_R of any driver's head (nearest first), as [name, x, y, vx, vy]. */
function nearThings(g: Game): [string, number, number, number, number][] {
  const heads: Pt[] = g.cars.map((c) => (c.alive ? c.headWorld() : c.chassis.getPosition()));
  const out: { d: number; row: [string, number, number, number, number] }[] = [];
  const add = (name: string, b: Body) => {
    const p = b.getPosition();
    let d = Infinity;
    for (const h of heads) d = Math.min(d, Math.hypot(p.x - h.x, p.y - h.y));
    if (d > NEAR_R) return;
    const v = b.getLinearVelocity();
    out.push({ d, row: [name, r(p.x, 2), r(p.y, 2), r(v.x, 1), r(v.y, 1)] });
  };
  for (const i of g.items) if (!i.dead && !i.stowed) add(`${i.kind}#${i.id}o${i.owner}`, i.body);
  for (const s of g.shots) if (!s.dead) add(`${s.proj}#${s.id}o${s.owner}`, s.body);
  return out.sort((a, b) => a.d - b.d).slice(0, NEAR_MAX).map((x) => x.row);
}

/** Status timers that change how a hit counts; only the running ones are listed. */
function statuses(c: Car) {
  const st: Record<string, number> = {};
  if (c.shieldT > 0) st.shield = r(c.shieldT, 2);
  if (c.stunT > 0) st.stun = r(c.stunT, 2);
  if (c.phaseT > 0) st.phase = r(c.phaseT, 2);
  if (c.reflectT > 0) st.reflect = r(c.reflectT, 2);
  if (c.invisT > 0) st.invis = r(c.invisT, 2);
  return Object.keys(st).length ? st : undefined;
}

interface Sample {
  t: number;
  /** Physics step number: the same clock as `game.stepCount` and the head log. */
  n: number;
  round: number;
  phase: string;
  inputs: number[];
  cars: { x: number; y: number; a: number; vx: number; vy: number; alive: boolean; wheels: number; head: Pt | null; st?: Record<string, number> }[];
  near: [string, number, number, number, number][];
}

/** One dense frame, positional to stay small: cars [x, y, a, vx, vy, headX, headY], things [name, x, y, vx, vy]. */
interface Dense { n: number; t: number; c: number[][]; i: [string, number, number, number, number][] }

/** A marked moment (the 📍 button, or the bug button itself) with the dense steps leading up to it. */
interface Incident { kind: 'mark' | 'report'; t: number; n: number; round: number; format: string; dense: Dense[] }

export class FlightRecorder {
  private samples: Sample[] = [];
  private events: { t: number; type: string; data: unknown }[] = [];
  private dense: Dense[] = [];
  private incidents: Incident[] = [];
  private roundStart: Record<string, unknown> | null = null;

  constructor(private game: Game) {
    game.on((e) => this.onEvent(e));
    game.onStep = () => this.onStep();
    this.noteRoundStart(); // the first round has already started by now
  }

  /** What it takes to replay this round: the generator state and the step it began at. */
  private noteRoundStart() {
    const g = this.game;
    this.roundStart = { round: g.match.round, n: g.stepCount, t: r(g.time, 2), rngState: (g as unknown as Record<string, unknown>).rngState, map: g.map.id, cars: g.roundCars.map((c) => c.id) };
  }

  private onEvent(e: GameEvent) {
    const { type, ...data } = e as GameEvent & Record<string, unknown>;
    // Maps are large; the id is enough.
    if (type === 'roundStart') {
      (data as Record<string, unknown>).map = (e as { map: { id: string } }).map.id;
      this.noteRoundStart();
    }
    this.events.push({ t: r(this.game.time, 2), type, data });
    if (this.events.length > MAX_EVENTS) this.events.shift();
  }

  /** Called after every physics step: a dense frame always, a coarse sample every 0.1 s. */
  private onStep() {
    const g = this.game;
    const heads = g.cars.map((c) => (c.alive ? c.headWorld() : null));
    const things = nearThings(g);
    this.dense.push({
      n: g.stepCount,
      t: r(g.time, 3),
      c: g.cars.map((c, i) => {
        const p = c.chassis.getPosition(), v = c.chassis.getLinearVelocity(), h = heads[i];
        return [r(p.x, 2), r(p.y, 2), r(c.angle, 2), r(v.x, 1), r(v.y, 1), h ? r(h.x, 2) : 0, h ? r(h.y, 2) : 0];
      }),
      i: things,
    });
    if (this.dense.length > DENSE_STEPS) this.dense.shift();
    if (g.stepCount % SAMPLE_STEPS !== 0) return;
    this.samples.push({
      t: r(g.time, 2),
      n: g.stepCount,
      round: g.match.round,
      phase: g.phase,
      inputs: [...g.inputs],
      cars: g.cars.map((c, i) => {
        const p = c.chassis.getPosition(), v = c.chassis.getLinearVelocity(), h = heads[i];
        return { x: r(p.x, 2), y: r(p.y, 2), a: r(c.angle, 2), vx: r(v.x, 1), vy: r(v.y, 1), alive: c.alive, wheels: c.wheelsOnGround, head: h ? { x: r(h.x, 2), y: r(h.y) } : null, st: statuses(c) };
      }),
      near: things,
    });
    if (this.samples.length > HISTORY_S / SAMPLE_EVERY) this.samples.shift();
  }

  /** Marks "this is the moment": copies the dense buffer so it survives until the report is saved. */
  mark(kind: Incident['kind']) {
    const g = this.game;
    this.incidents.push({ kind, t: r(g.time, 2), n: g.stepCount, round: g.match.round, format: 'dense frame: c = per car [x, y, angle, vx, vy, headX, headY], i = near things [name#id o<owner>, x, y, vx, vy]', dense: [...this.dense] });
    while (this.incidents.length > MAX_INCIDENTS) this.incidents.shift();
  }

  /** How many 📍 marks are held. */
  marks() {
    return this.incidents.filter((i) => i.kind === 'mark').length;
  }

  dump() {
    return { sampleEvery: SAMPLE_EVERY, samples: this.samples, events: this.events, roundStart: this.roundStart, incidents: this.incidents };
  }
}

export interface ReportContext {
  /** What went wrong, in the player's words (required by the UI). */
  note?: string;
  /** Quick category picked next to the note. */
  category?: string;
  /** Also list wheels and links with their velocities. */
  full?: boolean;
  /** Rendered-frame stats from the ticker. */
  fps?: number;
  uiState?: string;
  mode?: string;
}

export function buildReport(game: Game, rec: FlightRecorder | null, ctx: ReportContext = {}) {
  const g = game as unknown as Record<string, unknown>;
  const body = (b: Body) => bodyState(b);
  return {
    kind: 'head-bash-arena-bug-report',
    version: 2,
    createdAt: new Date().toISOString(),
    note: ctx.note ?? '',
    category: ctx.category ?? '',
    env: {
      viewport: [window.innerWidth, window.innerHeight],
      standalone: matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches,
      fps: ctx.fps !== undefined ? r(ctx.fps, 1) : undefined,
    },
    ui: { state: ctx.uiState, mode: ctx.mode },
    match: {
      round: game.match.round,
      scores: game.match.scores,
      target: game.cfg.target,
      roundTime: game.cfg.roundTime,
      seed: game.cfg.seed ?? null,
      rngState: g.rngState,
      randomMaps: game.cfg.randomMaps,
      randomCars: !!game.cfg.randomCars,
    },
    game: {
      phase: game.phase,
      phaseTime: r(game.phaseTime, 2),
      roundClock: r(game.roundClock, 2),
      timeLeft: r(game.timeLeft, 2),
      time: r(game.time, 2),
      stepCount: game.stepCount,
      suddenDeath: game.suddenDeath,
      slowmo: r(game.slowmo, 2),
      timeScale: r(game.stepper.timeScale, 2),
      inputs: [...game.inputs],
      actions: [...game.actions],
      controllers: game.controllers.map((c) => (c ? c.constructor.name : 'human')),
      gravity: game.map.gravity ?? null,
    },
    map: { id: game.map.id, name: game.map.name, killY: game.map.killY, bounds: game.map.bounds, spawns: game.map.spawns },
    cars: game.cars.map((c) => carState(c, !!ctx.full)),
    headLog: game.headLog.slice(),
    shots: game.shots.map((s) => ({ id: s.id, owner: s.owner, proj: s.proj, age: r(game.time - s.born, 2), dead: s.dead, ...body(s.body) })),
    items: game.items.map((i) => ({
      id: i.id, kind: i.kind, owner: i.owner, fx: i.fx ?? null, age: r(game.time - i.born, 2), ttl: i.ttl === Infinity ? 'inf' : r(i.ttl, 1),
      ...(i.stowed ? { stowed: true } : {}), ...(i.dead ? { dead: true } : {}), ...body(i.body),
    })),
    tethers: game.tethers.length,
    strikes: game.strikes.length,
    ragdolls: game.ragdolls.length,
    world: { bodies: game.world.getBodyCount(), contacts: game.world.getContactCount(), joints: game.world.getJointCount() },
    recording: rec?.dump() ?? null,
  };
}

export type BugReport = ReturnType<typeof buildReport>;

/** Valid JSON, readable: anything short sits on one line, long objects and lists are broken up. */
export function compactJson(v: unknown, indent = ''): string {
  const flat = JSON.stringify(v);
  if (flat === undefined) return 'null';
  if (flat.length <= 150 || v === null || typeof v !== 'object') return flat;
  const next = indent + ' ';
  if (Array.isArray(v)) return '[\n' + v.map((x) => next + compactJson(x, next)).join(',\n') + '\n' + indent + ']';
  const ent = Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== undefined);
  return '{\n' + ent.map(([k, x]) => `${next}${JSON.stringify(k)}: ${compactJson(x, next)}`).join(',\n') + '\n' + indent + '}';
}

const STORE_KEY = 'hba-bug-reports-v1';

/** Keeps the last few reports in the browser too, so one can be fetched later from the console. */
function stash(json: string) {
  try {
    const list: string[] = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]');
    list.push(json);
    while (list.length > 3 || list.reduce((s, x) => s + x.length, 0) > 3_000_000) list.shift();
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  } catch { /* storage full or blocked: the file is what matters */ }
}

export function reportFileName(rep: BugReport) {
  const t = rep.createdAt.replace(/[:.]/g, '-').slice(0, 19);
  return `bug-${rep.map.id}-r${rep.match.round}-${t}.json`;
}

/**
 * Hands the report to the player: on phones the share sheet (send to a chat or mail) when the
 * browser can share files, otherwise a plain file download.
 */
export async function saveReport(rep: BugReport): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const json = compactJson(rep);
  stash(json);
  const name = reportFileName(rep);
  const file = new File([json], name, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (matchMedia('(pointer: coarse)').matches && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'Head Bash Arena: звіт про баг' });
      return 'shared';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'cancelled';
      // anything else: fall through to a download
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}
