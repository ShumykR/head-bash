import './detmath-install'; // first: car/map modules use Math while loading
import { Game } from '../game/game';
import { CARS } from '../cars/defs';
import { MAPS } from '../maps/defs';
import { stateHash } from './hash';

/**
 * Scripted match for determinism checks: a fixed seed and a fixed,
 * pseudo-random input script for both players (direction and action change
 * every 20 steps), random cars and arenas every round. Returns the state hash
 * every `every` steps. Running it in two JS engines and comparing the output
 * tells whether lockstep online play between them would stay in sync.
 */
export interface DetRunOptions {
  seed?: number;
  steps?: number;
  every?: number;
  roundTime?: number;
}

export interface DetRunResult {
  hashes: number[];
  rounds: number;
  scores: [number, number];
  steps: number;
}

export function detRun(opts: DetRunOptions = {}): DetRunResult {
  const { seed = 42, steps = 60 * 60, every = 60, roundTime = 20 } = opts;
  const game = new Game({
    cars: [CARS[0], CARS[1]],
    maps: MAPS,
    randomMaps: true,
    randomCars: true,
    carPool: CARS,
    target: 9999,
    roundTime,
    seed,
  });
  let s = (seed ^ 0x9e3779b9) >>> 0 || 1;
  const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  let rounds = 0;
  game.on((e) => {
    if (e.type === 'roundEnd') rounds++;
  });
  const hashes: number[] = [];
  for (let i = 0; i < steps; i++) {
    if (i % 20 === 0) {
      for (const p of [0, 1]) {
        game.inputs[p] = (Math.floor(r() * 3) - 1) as -1 | 0 | 1;
        game.actions[p] = r() < 0.25;
      }
    }
    game.step();
    if ((i + 1) % every === 0) hashes.push(stateHash(game));
  }
  return { hashes, rounds, scores: [...game.match.scores] as [number, number], steps };
}
