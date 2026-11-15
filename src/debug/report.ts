import type { Body } from 'planck';
import type { Game, GameEvent } from '../game/game';
import type { Car } from '../cars/car';

/**
 * Bug report: a JSON snapshot of the running match plus a short flight recording (the last
 * few seconds of car states and events), so a screenshot can come with the numbers behind it.
 */

const HISTORY_S = 12;
const SAMPLE_EVERY = 0.1;
const MAX_EVENTS = 80;

type Num = number;
const r = (v: Num, d = 3) => (Number.isFinite(v) ? Math.round(v * 10 ** d) / 10 ** d : v);

function bodyState(b: Body) {
  const p = b.getPosition(), v = b.getLinearVelocity();
  return { x: r(p.x), y: r(p.y), a: r(b.getAngle()), vx: r(v.x, 2), vy: r(v.y, 2), w: r(b.getAngularVelocity(), 2), awake: b.isAwake() };
}

/** Every plain number / boolean / string field of an object (timers, flags, counters), rounded. */
function primitives(o: object, skip: string[] = []): Record<string, number | boolean | string> {
  const out: Record<string, number | boolean | string> = {};
  for (const [k, v] of Object.entries(o)) {
    if (skip.includes(k)) continue;
    if (typeof v === 'number') out[k] = r(v);
    else if (typeof v === 'boolean' || typeof v === 'string') out[k] = v;
  }
  return out;
}

function carState(c: Car) {
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
    wheels: c.wheels.map(bodyState),
    linkWheels: c.linkWheels.map((w) => bodyState(w.body)),
    links: c.links.map(bodyState),
    mass: r(c.mass, 2),
    fields: primitives(c, ['player']),
  };
}

export class FlightRecorder {
  private samples: { t: number; round: number; phase: string; inputs: number[]; cars: { x: number; y: number; a: number; vx: number; vy: number; alive: boolean; wheels: number }[] }[] = [];
  private events: { t: number; type: string; data: unknown }[] = [];
  private acc = 0;

  constructor(private game: Game) {
    game.on((e) => this.onEvent(e));
  }

  private onEvent(e: GameEvent) {
    const { type, ...data } = e as GameEvent & Record<string, unknown>;
    // Maps are large; the id is enough.
    if (type === 'roundStart') (data as Record<string, unknown>).map = (e as { map: { id: string } }).map.id;
    this.events.push({ t: r(this.game.time, 2), type, data });
    if (this.events.length > MAX_EVENTS) this.events.shift();
  }

  /** Call once per rendered frame with the real elapsed seconds. */
  tick(dt: number) {
    this.acc += dt;
    if (this.acc < SAMPLE_EVERY) return;
    this.acc = 0;
    const g = this.game;
    this.samples.push({
      t: r(g.time, 2),
      round: g.match.round,
      phase: g.phase,
      inputs: [...g.inputs],
      cars: g.cars.map((c) => {
        const p = c.chassis.getPosition(), v = c.chassis.getLinearVelocity();
        return { x: r(p.x, 2), y: r(p.y, 2), a: r(c.angle, 2), vx: r(v.x, 1), vy: r(v.y, 1), alive: c.alive, wheels: c.wheelsOnGround };
      }),
    });
    if (this.samples.length > HISTORY_S / SAMPLE_EVERY) this.samples.shift();
  }

  dump() {
    return { sampleEvery: SAMPLE_EVERY, samples: this.samples, events: this.events };
  }
}

export interface ReportContext {
  note?: string;
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
    version: 1,
    createdAt: new Date().toISOString(),
    note: ctx.note ?? '',
    env: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      viewport: [window.innerWidth, window.innerHeight],
      dpr: window.devicePixelRatio,
      screen: [screen.width, screen.height],
      touch: navigator.maxTouchPoints,
      standalone: matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches,
      url: location.href,
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
    cars: game.cars.map(carState),
    shots: game.shots.map((s) => ({ id: s.id, owner: s.owner, proj: s.proj, age: r(game.time - s.born, 2), dead: s.dead, ...body(s.body) })),
    items: game.items.map((i) => ({
      id: i.id, kind: i.kind, owner: i.owner, fx: i.fx ?? null, age: r(game.time - i.born, 2), ttl: i.ttl === Infinity ? 'inf' : r(i.ttl, 1),
      stowed: !!i.stowed, dead: !!i.dead, ...body(i.body),
    })),
    tethers: game.tethers.length,
    strikes: game.strikes.length,
    ragdolls: game.ragdolls.length,
    world: { bodies: game.world.getBodyCount(), contacts: game.world.getContactCount(), joints: game.world.getJointCount() },
    recording: rec?.dump() ?? null,
  };
}

export type BugReport = ReturnType<typeof buildReport>;

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
  const json = JSON.stringify(rep, null, 1);
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
