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
import { BATCH, BIT_ACTION, HASH_EVERY, MAX_DELAY, dirOfBits } from './protocol';
import type { ClientMsg, InputChange } from './protocol';
import { stateHash } from './hash';

/** Real-time budget per frame for catching up (after a stall, a reconnect or a hidden tab). */
const CATCHUP_MS = 10;
/** Ticks confirmed ahead (with no input) while the tab is hidden, so the other player is not held up. */
const HIDDEN_AHEAD = 90;

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

  constructor(
    readonly game: Game,
    readonly slot: 0 | 1,
    readonly delay: number,
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
    this.clock += (Math.min(Math.max(realDt, 0), 0.25) * scale) / STEP_DT;
    // Do not run ahead of a player who is gone (disconnected, frozen): stay within reach of their input.
    const peer = this.confirmed[1 - this.slot];
    this.clock = Math.max(this.simTick, Math.min(this.clock, peer + 2 * MAX_DELAY));
    this.setLocal(bits);
    this.extendLocal(Math.floor(this.clock) + this.delay);
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
    this.flush(false);
    return n;
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
