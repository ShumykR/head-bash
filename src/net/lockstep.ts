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
 *
 * Rollback (optional `view`): the authoritative game above stays exactly as described (only
 * confirmed inputs; its hashes are what the players compare). A second Game, the one on screen,
 * runs ahead of it to the real-time clock on a guess for the other player's input (the last one
 * known). When their real input arrives and differs, the shown game gets the authoritative state
 * copied in (`Twin`) and re-runs the few ticks since. The input delay still adapts, so guessing
 * covers only the moments the other player's input is late (jitter) instead of freezing.
 */
import { ROUND_END_DELAY } from '../game/game';
import type { Game } from '../game/game';
import { STEP_DT } from '../physics/constants';
import { BATCH, BIT_ACTION, HASH_EVERY, MIN_DELAY, dirOfBits } from './protocol';
import type { ClientMsg, InputChange } from './protocol';
import { stateHash } from './hash';
import { Twin, TwinError, isolated, twinForGames } from './twin';

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
/** Rollback: the shown game guesses at most this many ticks past the authoritative one (then waits). */
export const MAX_PREDICT = 12;
/** Rollback: guessing deeper than this often costs a tick of input delay (see `adapt`). */
const SOFT_PREDICT = 6;
/** Rollback: the input delay comes down while guesses stay this shallow most of the time (ticks). */
const CALM_PREDICT = 3;
/** Rollback: the input delay may go this low (guessing covers what it does not). */
const ROLLBACK_MIN_DELAY = 2;

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
  // Rollback: time spent guessing more than CALM_PREDICT / SOFT_PREDICT ticks ahead.
  private winGuess = 0;
  private winDeep = 0;
  /** Rollback: our clock minus the other's last reported one (smoothed; includes the message's travel). */
  private rawAdvantage = 0;
  /** Rollback: the input delay we ask the other player to use (from how deep we guess their input). */
  private wantPeer: number;
  private calmWindows = 0;
  /** Smoothed length of our frames in ticks (a slow device sends its confirmations less often). */
  private frameTicks = 1;
  /** Seconds spent waiting for the other player since the start (for the network stats overlay). */
  stallTime = 0;
  /** Closest the other player's input came to being late in the last adaptation window (ticks; < 0 = we waited). */
  peerMargin = 0;
  /** Rollback stats: corrections of a wrong guess, ticks re-run for them, how deep the shown game guesses now. */
  rollbacks = 0;
  rollbackTicks = 0;
  predicted = 0;
  /** Rollback: the shown game drifted from the authoritative one without a wrong guess (must stay 0). */
  mismatches = 0;
  /** Rollback: how many ticks our clock runs ahead of the other player's (smoothed; > 0 = we are ahead). */
  advantage = 0;
  /** Rollback: the shown game's objects were replaced (the renderer must rebuild its sprites). */
  onViewReset?: () => void;
  /** Rollback had to stop (the state could not be copied): show the authoritative game from now on. */
  onFallback?: (game: Game) => void;

  private view: Game | null = null;
  private twin: Twin | null = null;
  /** The worlds last paired (so a new round's objects get paired once). */
  private pairedWorld: unknown = null;
  private pairedViewWorld: unknown = null;
  private readonly vidx = [0, 0];
  private readonly vcur = [0, 0];
  /** A guess the shown game ran on turned out wrong: copy the authoritative state in. */
  private dirty = false;
  /** The shown game is waiting at a round's start (never guessed): no reason for more input delay. */
  private atBoundary = false;
  /** The shown game stopped short for want of input (not for want of time on a slow device). */
  private viewBlocked = false;
  /** The furthest tick the shown game has reached (ticks below it re-run after a correction). */
  private shownMax = 0;
  /** Shown-game hashes at HASH_EVERY ticks, checked against the authoritative ones. */
  private readonly viewHashes = new Map<number, number>();

  constructor(
    readonly game: Game,
    readonly slot: 0 | 1,
    /** Input delay in ticks: starts from the room's value (by ping) and adapts to the link (see `adapt`). */
    public delay: number,
    private readonly send: (m: ClientMsg) => void,
    resume?: { inputs: [p: 0 | 1, k: number, b: number][]; confirmed: [number, number] },
    /** Rollback: the game shown on screen (built from the same config, at the same tick). */
    view?: Game,
  ) {
    this.simTick = game.stepCount;
    this.clock = this.simTick;
    this.wantPeer = delay;
    if (view) {
      this.view = view;
      this.twin = twinForGames(game);
      this.pair();
    }
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
  receive(p: 0 | 1, k: number, c?: InputChange[], w?: number, a?: number, d?: number) {
    if (p === this.slot || k <= this.confirmed[p]) return;
    // Rollback: our input delay is what the other player needs (they see how late our input comes).
    if (this.view && d !== undefined) this.delay = Math.max(ROLLBACK_MIN_DELAY, Math.min(DELAY_CAP, d));
    if (this.view && w !== undefined) {
      // Their clock was at `w` when they sent this; they measure the same about ours (`a`). The
      // travel time is in both, so half the difference is how far apart the clocks really are.
      this.rawAdvantage += (this.clock - w - this.rawAdvantage) * 0.05;
      if (a !== undefined) this.advantage = (this.rawAdvantage - a / 10) / 2;
    }
    for (const ch of c ?? []) {
      if (ch[0] <= this.confirmed[p]) continue;
      this.tl[p].push(ch);
      // The shown game already ran this tick on the old input: its guess was wrong.
      if (this.view && ch[0] < this.view.stepCount) this.dirty = true;
    }
    this.confirmed[p] = k;
  }

  /** Rollback is on (a separate game is shown). */
  get rollback() { return this.view !== null; }
  /** The game to show: the rollback view, or the authoritative game itself. */
  get shown(): Game { return this.view ?? this.game; }

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
    // Rollback: nothing makes the clocks wait for each other, so the one ahead (it guesses more and
    // the other less) slows down a little until they agree again.
    if (this.view && this.advantage > 1) scale *= 1 - Math.min(0.08, (this.advantage - 1) * 0.02);
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
    // With rollback the shown game runs up to MAX_PREDICT ticks past the other player's input,
    // so our own input must be known that far.
    this.extendLocal(Math.min(Math.floor(this.clock), peer + 1 + (this.view ? MAX_PREDICT : 0)) + this.lead());
    let n = 0;
    const target = Math.floor(this.clock);
    // Normally one or two ticks per frame; further behind, catch up within a time budget.
    this.catchingUp = target - this.simTick > this.delay;
    const until = now() + (this.catchingUp ? CATCHUP_MS : 4);
    while (this.simTick < target && this.canStep() && (n < 3 || now() < until)) {
      this.step();
      n++;
    }
    let shownTick = this.simTick;
    if (this.view) {
      this.advanceView(target);
      if (this.view) shownTick = this.view.stepCount;
    }
    this.stalled = shownTick < target && (this.view ? this.viewBlocked : !this.canStep());
    // Waiting for the other player: let go of the time we could not use. Our clock then follows
    // the pace both sides can keep (a late start or a hiccup on their side costs a moment, not a
    // growing gap with stop-and-burst play); only steady waiting raises the input delay (`adapt`).
    // A couple of ticks of slack absorb ordinary jitter (caught up next frame) without counting as waiting.
    const waiting = this.stalled && this.clock - shownTick >= JITTER_SLACK;
    if (waiting) this.clock = shownTick + JITTER_SLACK;
    // Rollback: guessing deep (not only waiting) also asks for more input delay.
    this.adapt(realDt, waiting, waiting && this.atBoundary);
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
  private adapt(realDt: number, waiting: boolean, expected = false) {
    const dt = Math.min(Math.max(realDt, 0), 1);
    this.winT += dt;
    if (waiting) {
      if (!expected) this.winStall += dt;
      this.stallTime += dt;
    }
    if (this.view) {
      if (this.predicted > SOFT_PREDICT) this.winDeep += dt;
      if (this.predicted > CALM_PREDICT) this.winGuess += dt;
    }
    this.winMargin = Math.min(this.winMargin, this.confirmed[1 - this.slot] - (this.view ? this.view.stepCount : this.simTick));
    if (this.winT < WINDOW) return;
    this.peerMargin = this.winMargin === Infinity ? 0 : this.winMargin;
    const ratio = this.winStall / this.winT;
    if (this.view) {
      // Rollback: guessing covers late input, so aim for shallow guesses most of the time and deep
      // ones rarely; only waiting (guessing as far as allowed) or frequent deep guesses cost a tick.
      const deep = this.winDeep / this.winT, guess = this.winGuess / this.winT;
      // Their input is what comes late, so it is their delay that we adjust (sent with ours: `d`).
      if (ratio > 0.05 || deep > 0.1) {
        this.wantPeer = Math.min(DELAY_CAP, this.wantPeer + 1);
        this.calmWindows = 0;
      } else if (ratio < 0.01 && guess < 0.25) {
        if (++this.calmWindows >= 2 && this.wantPeer > ROLLBACK_MIN_DELAY) {
          this.wantPeer--;
          this.calmWindows = 0;
        }
      } else this.calmWindows = 0;
      this.winT = this.winStall = this.winDeep = this.winGuess = 0;
      this.winMargin = Infinity;
      return;
    }
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
    if (this.view && this.view.stepCount < this.simTick) this.resync();
    this.catchingUp = false;
  }

  // --- rollback ------------------------------------------------------------------------------

  /** Pair the shown game's objects with the authoritative ones (they are equal right now). */
  private pair() {
    const g = this.game, v = this.view!;
    this.pairedWorld = g.world;
    this.pairedViewWorld = v.world;
    if (v.stepCount !== g.stepCount || stateHash(v) !== stateHash(g) || !this.twin!.pair(g, v)) {
      // Not equal after all: a plain copy still works (with fresh objects the renderer rebuilds).
      this.resync();
    }
  }

  /** Copy the authoritative state into the shown game (a wrong guess, or the shown game fell behind). */
  private resync() {
    const g = this.game, v = this.view!;
    const world = v.world, car0 = v.cars[0], car1 = v.cars[1];
    try {
      for (const d of this.twin!.sync(g, v)) if (d === v.world) v.wireWorld();
    } catch (e) {
      if (!(e instanceof TwinError)) throw e;
      this.stopRollback();
      return;
    }
    this.vidx[0] = this.idx[0];
    this.vidx[1] = this.idx[1];
    this.vcur[0] = this.cur[0];
    this.vcur[1] = this.cur[1];
    this.dirty = false;
    this.viewHashes.clear();
    if (v.world !== world || v.cars[0] !== car0 || v.cars[1] !== car1) this.onViewReset?.();
  }

  private stopRollback() {
    this.view = null;
    this.twin = null;
    this.onFallback?.(this.game);
  }

  /**
   * Run the shown game up to `target`: on real inputs where known, past that on a guess (the other
   * player keeps their last input), but not into the next round and at most MAX_PREDICT ticks ahead.
   */
  private advanceView(target: number) {
    const v = this.view!, other = 1 - this.slot;
    // A new round: pair its objects once both games are in it, exactly if they are at the same tick
    // with nothing guessed, else by place (the shown one ran ahead): the renderer keeps its sprites.
    const g = this.game;
    if (this.pairedWorld !== g.world) {
      if (v.stepCount === this.simTick && !this.dirty) this.pair();
      else if (this.pairedViewWorld !== v.world && v.match.round === g.match.round) {
        this.twin!.pair(g, v, true);
        this.pairedWorld = g.world;
        this.pairedViewWorld = v.world;
      }
    }
    if (!this.view) return;
    // Behind by a little (the authoritative game stepped first this frame): just step it below.
    // Far behind (a reconnect, a hidden tab): copying is cheaper than re-running.
    if (this.dirty || this.simTick - v.stepCount > MAX_PREDICT) {
      const before = v.stepCount;
      this.resync();
      if (!this.view) return;
      if (before > this.simTick) {
        this.rollbacks++;
        this.rollbackTicks += Math.min(before, target) - this.simTick;
      }
    }
    this.atBoundary = false;
    this.viewBlocked = false;
    const was = this.catchingUp;
    // At least a frame's worth of ticks (a slow device needs several per frame), then a time budget.
    const minSteps = Math.max(3, Math.ceil(this.frameTicks) + 1);
    const until = now() + (target - v.stepCount > minSteps ? CATCHUP_MS : 4);
    let n = 0;
    while (v.stepCount < target && (n < minSteps || now() < until)) {
      const k = v.stepCount;
      // Missing input (ours not yet scheduled, or theirs beyond what we may guess): the screen waits.
      this.viewBlocked = true;
      if (k > this.confirmed[this.slot]) break;
      const guess = k > this.confirmed[other];
      // Never guess the step that starts the next round (its new world would come from a guess).
      if (guess && !guessable(v)) {
        this.atBoundary = true;
        break;
      }
      if (guess && k - this.simTick >= MAX_PREDICT) break;
      this.viewBlocked = false;
      // Re-running ticks already shown (after a wrong guess): no sounds for them.
      this.catchingUp = k < this.shownMax;
      this.stepView(k);
      n++;
    }
    this.catchingUp = was;
    this.shownMax = Math.max(this.shownMax, v.stepCount);
    this.predicted = Math.max(0, v.stepCount - 1 - this.confirmed[other]);
  }

  private stepView(k: number) {
    const v = this.view!;
    for (let p = 0; p < 2; p++) {
      const tl = this.tl[p];
      while (this.vidx[p] < tl.length && tl[this.vidx[p]][0] <= k) this.vcur[p] = tl[this.vidx[p]++][1];
      v.inputs[p] = dirOfBits(this.vcur[p]);
      v.actions[p] = (this.vcur[p] & BIT_ACTION) !== 0;
    }
    isolated(() => v.step());
    if (v.stepCount % HASH_EVERY === 0) this.viewHashes.set(v.stepCount, stateHash(v));
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
    if (g.stepCount % HASH_EVERY === 0) {
      const h = stateHash(g);
      this.send({ t: 'hash', k: g.stepCount, h });
      // The shown game ran this tick on the same inputs (no wrong guess pending): it must agree.
      const vh = this.viewHashes.get(g.stepCount);
      if (vh !== undefined) {
        this.viewHashes.delete(g.stepCount);
        if (vh !== h && !this.dirty) {
          this.mismatches++;
          this.dirty = true;
        }
      }
    }
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
    const msg: Extract<ClientMsg, { t: 'in' }> = this.pending.length ? { t: 'in', k, c: this.pending } : { t: 'in', k };
    if (this.view) {
      msg.w = Math.floor(this.clock);
      msg.a = Math.round(this.rawAdvantage * 10);
      msg.d = this.wantPeer;
    }
    this.send(msg);
    this.pending = [];
    this.lastSent = k;
  }
}

/** The shown game may run its next step on a guess: not the step that starts a new round, not after the match. */
function guessable(v: Game): boolean {
  if (v.phase === 'play' || v.phase === 'countdown') return true;
  return v.phase === 'roundEnd' && v.phaseTime + STEP_DT * 1.5 < ROUND_END_DELAY;
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
