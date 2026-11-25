import type { BotLevel } from '../ai/bot';

export interface Settings {
  target: number;
  roundTime: number;
  bot: BotLevel;
  p1: string;
  p2: string;
  map: string; // map id or 'random'
  /** New random car for each player every round. */
  randomCars: boolean;
  /** Show the debug buttons during a match: bug report 🐞, moment mark 📍, note 📝 (and their F9 / F7 / F8 keys). */
  debugButtons: boolean;
  /** Name shown to the other player online. */
  name: string;
  /** The player switched the debug buttons themselves (otherwise the default applies, even to settings saved earlier). */
  debugChosen?: boolean;
}

const KEY = 'hba-settings-v1';
export const DEFAULTS: Settings = { target: 5, roundTime: 60, bot: 'normal', p1: 'sparrow', p2: 'bulldog', map: 'random', randomCars: false, debugButtons: false, name: '' };

export function loadSettings(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    // Older saves carried the old default (shown); keep the value only if the player chose it.
    if (!saved.debugChosen) delete saved.debugButtons;
    return { ...DEFAULTS, ...saved };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}
