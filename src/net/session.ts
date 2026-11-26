/**
 * One online session: the connection, the lobby state the room reports, and
 * the lockstep driver once a match starts. The host page (main.ts) supplies
 * how to create and show a Game and gets callbacks for everything else.
 */
import { Game } from '../game/game';
import type { GameConfig } from '../game/game';
import { CARS, CAR_BY_ID } from '../cars/defs';
import { MAPS, MAP_BY_ID } from '../maps/defs';
import { NetClient } from './client';
import type { ClientOptions, ClientStatus } from './client';
import { Lockstep } from './lockstep';
import type { EndReason, MatchConfig, RejectReason, ServerMsg, StartMsg } from './protocol';

/** Game config for a start message: both clients must build exactly the same Game. */
export function gameConfigFor(start: StartMsg): GameConfig {
  const map = start.config.map === 'random' ? null : MAP_BY_ID[start.config.map];
  return {
    cars: [CAR_BY_ID[start.cars[0]] ?? CARS[0], CAR_BY_ID[start.cars[1]] ?? CARS[1]],
    maps: map ? [map] : MAPS,
    randomMaps: !map,
    randomCars: start.config.randomCars,
    carPool: CARS,
    target: start.config.target,
    roundTime: start.config.roundTime,
    seed: start.seed,
  };
}

export type LobbyState = Extract<ServerMsg, { t: 'lobby' }>;

export interface SessionHooks {
  /** Create the Game for a match and show it (the session drives its steps). */
  makeGame(cfg: GameConfig): Game;
  onLobby?(l: LobbyState): void;
  onStart?(game: Game, ls: Lockstep): void;
  onEnd?(winner: 0 | 1 | null, scores: [number, number] | null, reason: EndReason): void;
  onPeer?(state: 'left' | 'back', deadline?: number): void;
  onStatus?(s: ClientStatus): void;
  onReject?(r: RejectReason): void;
  /** Rollback replaced the shown game's objects: rebuild what is drawn for them. */
  onViewReset?(game: Game): void;
  /** Rollback stopped: show this (authoritative) game from now on. */
  onFallback?(game: Game): void;
}

export class NetSession {
  readonly client: NetClient;
  lobby: LobbyState | null = null;
  ls: Lockstep | null = null;
  /** The game on screen (with rollback, not the one the players' hashes come from). */
  game: Game | null = null;
  /** Show a game that runs ahead on a guess for the other player's input (see Lockstep). */
  rollback = true;
  /** Hashes this client reported, by tick (debugging and the two-browser test). */
  readonly hashes = new Map<number, number>();

  constructor(opts: ClientOptions, private readonly hooks: SessionHooks) {
    this.client = new NetClient(opts);
    this.client.onMessage = (m) => this.handle(m);
    this.client.onStatus = (s) => hooks.onStatus?.(s);
    this.client.onReject = (r) => hooks.onReject?.(r);
  }

  get slot() { return this.client.slot; }
  get code() { return this.client.code; }

  /** Create a room (no code) or join one. */
  connect(code?: string) { this.client.connect(code); }
  pick(car: string) { this.client.send({ t: 'pick', car }); }
  config(c: Partial<MatchConfig>) { this.client.send({ t: 'config', config: c }); }
  ready(r = true) { this.client.send({ t: 'ready', ready: r }); }
  leave() {
    this.client.send({ t: 'leave' });
    this.client.close();
  }

  /** Drive the match one rendered frame with the local player's input bits. */
  frame(dt: number, bits: number) {
    if (!this.ls) return 0;
    if (typeof document !== 'undefined' && document.hidden) {
      this.ls.hidden();
      return 0;
    }
    return this.ls.frame(dt, bits);
  }

  private handle(m: ServerMsg) {
    switch (m.t) {
      case 'lobby':
        this.lobby = m;
        this.hooks.onLobby?.(m);
        break;
      case 'start':
        this.begin(m);
        break;
      case 'resume':
        this.begin(m.start, m);
        break;
      case 'in':
        this.ls?.receive(m.p, m.k, m.c, m.w, m.a, m.d);
        break;
      case 'peer':
        this.hooks.onPeer?.(m.state, m.deadline);
        break;
      case 'end':
        this.ls = null;
        this.hooks.onEnd?.(m.winner, m.scores, m.reason);
        break;
      default:
        break;
    }
  }

  private begin(start: StartMsg, resume?: Extract<ServerMsg, { t: 'resume' }>) {
    const slot = this.client.slot;
    if (slot === null) return;
    // Both games from the very same config object (the rollback copy shares what never changes).
    const cfg = gameConfigFor(start);
    const game = this.hooks.makeGame(cfg);
    const auth = this.rollback ? new Game(cfg) : game;
    this.game = game;
    this.hashes.clear();
    const ls = new Lockstep(auth, slot, start.delay, (msg) => {
      if (msg.t === 'hash') this.hashes.set(msg.k, msg.h);
      this.client.send(msg);
    }, resume && { inputs: resume.inputs, confirmed: resume.confirmed }, this.rollback ? game : undefined);
    this.ls = ls;
    ls.onViewReset = () => this.hooks.onViewReset?.(game);
    ls.onFallback = (g) => {
      this.game = g;
      this.hooks.onFallback?.(g);
    };
    if (resume) ls.fastForward();
    this.hooks.onStart?.(this.game, ls);
  }
}
