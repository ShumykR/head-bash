/**
 * Network log of an online match: one sample a second (ping both ways, input delay, waiting,
 * guessing, frame times). The stats panel copies it as JSON, to paste into a bug report; the last
 * match's log is kept in localStorage so it can still be copied after the match.
 */
import type { NetSession } from './session';

export interface NetSample {
  /** Seconds since the match started. */
  t: number;
  /** Round trips (ms): ours, and the other player's as the room last heard it. */
  rtt: number;
  peerRtt: number | null;
  /** Our input delay (ticks). */
  delay: number;
  /** Share of the second spent waiting for the other player (%). */
  wait: number;
  /** Rollback: deepest guess this second (ticks), corrections and re-run ticks this second. */
  guess: number;
  rollbacks: number;
  rerun: number;
  /** Our clock ahead of theirs (ticks). */
  adv: number;
  /** Frames: average and worst (ms). */
  frame: number;
  worst: number;
  status: string;
}

const KEY = 'hba-netlog-last';

export class NetLog {
  readonly samples: NetSample[] = [];
  private readonly started = performance.now();
  private secT = 0;
  private frames = 0;
  private worst = 0;
  private guessMax = 0;
  private stall0 = 0;
  private rb0 = 0;
  private rt0 = 0;

  constructor(private readonly s: NetSession, readonly meta: Record<string, unknown>) {
    const ls = s.ls;
    if (ls) {
      this.stall0 = ls.stallTime;
      this.rb0 = ls.rollbacks;
      this.rt0 = ls.rollbackTicks;
    }
  }

  /** Every rendered frame. */
  frame(dt: number) {
    const ls = this.s.ls;
    if (!ls) return;
    this.secT += dt;
    this.frames++;
    this.worst = Math.max(this.worst, dt);
    this.guessMax = Math.max(this.guessMax, ls.predicted);
    if (this.secT < 1) return;
    const c = this.s.client;
    this.samples.push({
      t: Math.round((performance.now() - this.started) / 100) / 10,
      rtt: Math.round(c.rtt),
      peerRtt: c.peerRtt ?? null,
      delay: ls.delay,
      wait: Math.round(((ls.stallTime - this.stall0) / this.secT) * 100),
      guess: this.guessMax,
      rollbacks: ls.rollbacks - this.rb0,
      rerun: ls.rollbackTicks - this.rt0,
      adv: Math.round(ls.advantage * 10) / 10,
      frame: Math.round((this.secT / this.frames) * 1000),
      worst: Math.round(this.worst * 1000),
      status: c.status,
    });
    // An hour at most.
    if (this.samples.length > 3600) this.samples.shift();
    this.stall0 = ls.stallTime;
    this.rb0 = ls.rollbacks;
    this.rt0 = ls.rollbackTicks;
    this.secT = this.frames = this.worst = this.guessMax = 0;
  }

  /** The log as JSON text, with a summary on top. */
  text(): string {
    const s = this.samples;
    const avg = (f: (x: NetSample) => number) => (s.length ? Math.round(s.reduce((a, x) => a + f(x), 0) / s.length) : null);
    const max = (f: (x: NetSample) => number) => (s.length ? Math.max(...s.map(f)) : null);
    const summary = {
      seconds: s.length,
      rttAvg: avg((x) => x.rtt), rttMax: max((x) => x.rtt),
      peerRttAvg: avg((x) => x.peerRtt ?? 0),
      waitSecondsOver5pct: s.filter((x) => x.wait > 5).length,
      rollbacks: s.reduce((a, x) => a + x.rollbacks, 0),
      guessMax: max((x) => x.guess),
      worstFrameMs: max((x) => x.worst),
      reconnects: s.filter((x, i) => x.status !== 'open' && (i === 0 || s[i - 1].status === 'open')).length,
    };
    return JSON.stringify({ kind: 'head-bash-net-log', createdAt: new Date().toISOString(), ...this.meta, summary, samples: s });
  }

  /** Keep this log as "the last match" (survives the match's end and a reload). */
  save() {
    try { localStorage.setItem(KEY, this.text()); } catch { /* full or blocked */ }
  }

  static last(): string | null {
    try { return localStorage.getItem(KEY); } catch { return null; }
  }
}

/** Copy text to the clipboard (inside a tap: Telegram's web view needs the user gesture). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older web views: a selected textarea and the old copy command.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* not allowed */ }
    ta.remove();
    return ok;
  }
}
