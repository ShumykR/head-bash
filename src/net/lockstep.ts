/**
 * Lockstep driver for one online match.
 *
 * Both clients run the same deterministic Game. Each tick needs both players'
 * inputs; a client schedules its own input `delay` ticks ahead, so by the time
 * the simulation reaches a tick the other player's input for it has (usually)
 * arrived. If it has not, the simulation waits. Inputs are kept as change
 * lists per player ("from tick k the bits are b") plus how far each player
 * has confirmed.
 *
 * The transport is injected (`send`, `receive`), so the same class runs over
 * the real WebSocket and in tests over an in-memory relay.
 */
import type { Game } from '../game/game';
import { STEP_DT } from '../physics/constants';
import { BATCH, BIT_ACTION, HASH_EVERY, MIN_DELAY, dirOfBits } from './protocol';
import type { ClientMsg, InputChange } from './protocol';
import { stateHash } from './hash';

/** Real-time budget per frame for catching up (after a stall, a reconnect or a hidden tab). */
const CATCHUP_MS = 10;
/** Ticks confirmed ahead (with no input) while the tab is hidden, so the other player is not held up. */
const HIDDEN_AHEAD = 90;
/** Adaptive input delay never goes above this (24 ticks = 0.4 s). */
export const DELAY_CAP = 24;
/** Ticks the clock may run ahead of a wait before the time is let go (ordinary jitter). */
const JITTER_SLACK = 3;
/** Seconds of play per adaptation window. */
const WINDOW = 1;

export class Lockstep {
  /** The next tick to simulate (= game.stepCount). */
  simTick: number;
  /** Last tick each player's input is known for. */
  readonly confirmed: [number, number] = [-1, -1];
  /** The simulation is waiting for the other player's input. */
  stalled = false;
  /** Running extra steps to catch up; the host may mute effects meanwhile. */
  catchingUp = false;
  private readonly tl: [InputChange[], InputChange[]] = [[], []];
  private readonly idx = [0, 0];
  private readonly cur = [0, 0];
  private localBits = 0;
  private pending: InputChange[] = [];
  private lastSent = -1;
  /**
   * Where the match should be by now (ticks, fractional): advances with real time (and slow motion)
   * even while stalled, so our confirmations keep flowing and a stall on one side does not
   * also stall the other. The simulation runs up to it when inputs allow.
   */
  private clock: number;
  private resultSent = false;
  // Adaptation window: real time, time spent waiting for the other player, closest the other's input came.
  private winT = 0;
  private winStall = 0;
  private winMargin = Infinity;
  private calmWindows = 0;
  /** Smoothed length of our frames in ticks (a slow device sends its confirmations less often). */
  private frameTicks = 1;

  constructor(
    readonly game: Game,
    readonly slot: 0 | 1,
    /** Input delay in ticks: starts from the room's value (by ping) and adapts to the link (see `adapt`). */
    public delay: number,
    private readonly send: (m: ClientMsg) => void,
    resume?: { inputs: [p: 0 | 1, k: number, b: number][]; confirmed: [number, number] },
  ) {
    this.simTick = game.stepCount;
    this.clock = this.simTick;
    game.on((e) => {
      if (e.type === 'matchEnd' && !this.resultSent) {
        this.resultSent = true;
        this.send({ t: 'result', winner: e.winner, scores: [...game.match.scores] as [number, number] });
      }
    });
    if (resume) {
      for (const [p, k, b] of resume.inputs) this.tl[p].push([k, b]);
      this.confirmed[0] = resume.confirmed[0];
      this.confirmed[1] = resume.confirmed[1];
      const mine = this.tl[slot];
      this.localBits = mine.length ? mine[mine.length - 1][1] : 0;
      this.lastSent = this.confirmed[slot];
    } else {
      // Nobody has input for the first `delay` ticks: confirm them empty so the match can start.
      this.extendLocal(delay - 1);
      this.flush(true);
    }
  }

  /** The other player's input arrived (relayed by the room). */
  receive(p: 0 | 1, k: number, c?: InputChange[]) {
    if (p === this.slot || k <= this.confirmed[p]) return;
    for (const ch of c ?? []) if (ch[0] > this.confirmed[p]) this.tl[p].push(ch);
    this.confirmed[p] = k;
  }

  /**
   * One rendered frame: schedule the local input, then run as many ticks as
   * real time (with slow motion) allows and the inputs permit. Returns the
   * number of ticks simulated.
   */
  frame(realDt: number, bits: number): number {
    const g = this.game;
    // Slow motion is a playback speed only (same formula as Game.frame); it never changes the outcome.
    let scale = 1;
    if (g.slowmo > 0) {
      g.slowmo -= realDt;
      scale = g.slowmo > 0.35 ? 0.22 : 0.22 + (1 - 0.22) * (1 - Math.max(0, g.slowmo) / 0.35);
    }
    // The match clock follows real time even when frames are slow (a phone at 20 fps): a clock that
    // loses time would leave this player behind and make the other one wait. Only a long gap (a
    // background tab) is cut short.
    this.clock += (Math.min(Math.max(realDt, 0), 1) * scale) / STEP_DT;
    const peer = this.confirmed[1 - this.slot];
    // If the other player is gone (disconnected, frozen), do not bank more than a little time.
    this.clock = Math.max(this.simTick, Math.min(this.clock, peer + 1 + DELAY_CAP + 10));
    this.setLocal(bits);
    // Our inputs go `delay` ticks ahead of where the match can actually be (never past the other
    // player's confirmed input + 1): ahead of the real clock they would only add control lag.
    // A slow device confirms only once per (long) frame, so it also covers its own frame length:
    // its slowness costs its own controls a little, not the other player's.
    this.frameTicks += (Math.min(Math.max(realDt, 0), 1) / STEP_DT - this.frameTicks) * 0.1;
    this.extendLocal(Math.min(Math.floor(this.clock), peer + 1) + this.lead());
    let n = 0;
    const target = Math.floor(this.clock);
    // Normally one or two ticks per frame; further behind, catch up within a time budget.
    this.catchingUp = target - this.simTick > this.delay;
    const until = now() + (this.catchingUp ? CATCHUP_MS : 4);
    while (this.simTick < target && this.canStep() && (n < 3 || now() < until)) {
      this.step();
      n++;
    }
    this.stalled = this.simTick < target && !this.canStep();
    // Waiting for the other player: let go of the time we could not use. Our clock then follows
    // the pace both sides can keep (a late start or a hiccup on their side costs a moment, not a
    // growing gap with stop-and-burst play); only steady waiting raises the input delay (`adapt`).
    // A couple of ticks of slack absorb ordinary jitter (caught up next frame) without counting as waiting.
    const waiting = this.stalled && this.clock - this.simTick >= JITTER_SLACK;
    if (waiting) this.clock = this.simTick + JITTER_SLACK;
    this.adapt(realDt, waiting);
    this.flush(false);
    return n;
  }

  /** How far ahead our inputs go: the input delay plus our frame length beyond one tick. */
  private lead() {
    return this.delay + Math.max(0, Math.ceil(this.frameTicks) - 1);
  }

  /**
   * Adaptive input delay. Waiting for the other player means the two leads together (ours + theirs)
   * do not cover the link's latency: raise ours by a tick (the other side does the same from its
   * end). After several calm seconds with room to spare, give a tick back, for snappier controls.
   */
  private adapt(realDt: number, waiting: boolean) {
    const dt = Math.min(Math.max(realDt, 0), 1);
    this.winT += dt;
    if (waiting) this.winStall += dt;
    this.winMargin = Math.min(this.winMargin, this.confirmed[1 - this.slot] - this.simTick);
    if (this.winT < WINDOW) return;
    const ratio = this.winStall / this.winT;
    if (ratio > 0.1) {
      this.delay = Math.min(DELAY_CAP, this.delay + 1);
      this.calmWindows = 0;
    } else if (ratio < 0.02 && this.winMargin > 2) {
      if (++this.calmWindows >= 4 && this.delay > MIN_DELAY) {
        this.delay--;
        this.calmWindows = 0;
      }
    } else this.calmWindows = 0;
    this.winT = this.winStall = 0;
    this.winMargin = Infinity;
  }

  /** Re-simulate everything known so far (after a reconnect), with no time budget. */
  fastForward() {
    this.catchingUp = true;
    while (this.canStep() && Math.min(this.confirmed[0], this.confirmed[1]) - this.simTick > this.delay) this.step();
    this.clock = Math.max(this.clock, this.simTick);
    this.catchingUp = false;
  }

  /** The tab is hidden: confirm a stretch of empty input ahead so the other player keeps playing. */
  hidden() {
    this.setLocal(0);
    this.extendLocal(Math.max(this.simTick, this.confirmed[1 - this.slot]) + HIDDEN_AHEAD);
    this.flush(true);
  }

  private canStep(): boolean {
    return this.confirmed[0] >= this.simTick && this.confirmed[1] >= this.simTick;
  }

  private step() {
    const g = this.game, k = this.simTick;
    for (let p = 0; p < 2; p++) {
      const tl = this.tl[p];
      while (this.idx[p] < tl.length && tl[this.idx[p]][0] <= k) this.cur[p] = tl[this.idx[p]++][1];
      g.inputs[p] = dirOfBits(this.cur[p]);
      g.actions[p] = (this.cur[p] & BIT_ACTION) !== 0;
    }
    // The extra steps of a catch-up must not starve our own confirmations.
    this.extendLocal(k + this.delay);
    g.step();
    this.simTick++;
    if (g.stepCount % HASH_EVERY === 0) this.send({ t: 'hash', k: g.stepCount, h: stateHash(g) });
  }

  /** The local input changes from the next unconfirmed tick on. */
  private setLocal(bits: number) {
    if (bits === this.localBits) return;
    this.localBits = bits;
    const ch: InputChange = [this.confirmed[this.slot] + 1, bits];
    this.tl[this.slot].push(ch);
    this.pending.push(ch);
    // A change is always inside what we confirm (the room drops changes past the confirmed tick).
    this.confirmed[this.slot] = ch[0];
  }

  private extendLocal(k: number) {
    if (k > this.confirmed[this.slot]) this.confirmed[this.slot] = k;
  }

  /** Send our confirmations: at once when the input changed, otherwise every BATCH ticks. */
  private flush(force: boolean) {
    const k = this.confirmed[this.slot];
    if (k <= this.lastSent) return;
    if (!force && !this.pending.length && k - this.lastSent < BATCH) return;
    this.send(this.pending.length ? { t: 'in', k, c: this.pending } : { t: 'in', k });
    this.pending = [];
    this.lastSent = k;
  }
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
