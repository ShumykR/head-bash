/**
 * Online screens: entry (create a room / join by code), connecting, and the
 * room lobby (players, cars, host settings, ready, share, leave). Built on
 * the Menu's screen system; all network work goes through the hooks.
 */
import { CARS, CAR_BY_ID } from '../cars/defs';
import { carPreviewCanvas } from '../cars/preview';
import { MAP_BY_ID } from '../maps/defs';
import { altPalette, PLAYER_COLORS } from '../render/view';
import { CODE_RE } from '../net/protocol';
import type { LobbyPlayer, MatchConfig } from '../net/protocol';
import type { LobbyState } from '../net/session';
import type { Menu } from './menu';
import type { Settings } from './settings';
import { button, el, titleCanvas } from './dom';

export interface LobbyHooks {
  create(): void;
  join(code: string): void;
  leave(): void;
  pick(car: string): void;
  config(c: Partial<MatchConfig>): void;
  ready(r: boolean): void;
  /** Open the arena picker (host); calls back to re-show the lobby. */
  pickMap(done: () => void): void;
  settingsChanged(): void;
  /** Redraw the lobby (after a picker closes). */
  refresh(): void;
}

/** Last result shown above the lobby after a match. */
export interface LobbyBanner { text: string; color: string }

export class OnlineUI {
  /** A picker (car / arena) is open over the lobby: the host must not redraw it under the player. */
  busy = false;

  constructor(private readonly menu: Menu, private readonly settings: Settings, private readonly hooks: LobbyHooks) {}

  /** Link a friend opens to join the room. */
  static inviteUrl(code: string): string {
    const u = new URL(location.href);
    u.search = '';
    u.hash = '';
    u.searchParams.set('room', code);
    return u.toString();
  }

  showEntry(prefill = '') {
    const s = this.menu.open('online settings', (e) => e.code === 'Escape' && this.hooks.leave());
    s.appendChild(titleCanvas('ОНЛАЙН', 14, '#ffffff', 3));

    const nameRow = el('div', 'set-row');
    nameRow.appendChild(el('span', '', 'Твоє ім’я'));
    const name = el('input', 'text-in');
    name.maxLength = 24;
    name.placeholder = 'Гравець';
    name.value = this.settings.name;
    name.addEventListener('change', () => {
      this.settings.name = name.value.trim().slice(0, 24);
      this.hooks.settingsChanged();
    });
    nameRow.appendChild(name);
    s.appendChild(nameRow);

    const saveName = () => {
      this.settings.name = name.value.trim().slice(0, 24);
      this.hooks.settingsChanged();
    };
    s.appendChild(button('створити гру', 'primary big', () => { saveName(); this.hooks.create(); }));

    const joinRow = el('div', 'row join-row');
    const code = el('input', 'text-in code-in');
    code.maxLength = 5;
    code.placeholder = 'КОД';
    code.autocapitalize = 'characters';
    code.spellcheck = false;
    code.value = prefill;
    const join = button('увійти', '', () => {
      const c = code.value.trim().toUpperCase();
      if (!CODE_RE.test(c)) {
        code.classList.add('bad');
        code.focus();
        return;
      }
      saveName();
      this.hooks.join(c);
    });
    code.addEventListener('input', () => {
      code.value = code.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      code.classList.remove('bad');
    });
    code.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') join.click();
    });
    name.addEventListener('keydown', (e) => e.stopPropagation());
    joinRow.append(code, join);
    s.appendChild(joinRow);
    s.appendChild(el('div', 'hint', 'Створи гру й надішли посилання другові, або введи код його кімнати'));
    s.appendChild(button('◀ меню', '', () => this.hooks.leave(), 'back'));
  }

  showConnecting(text = 'Підключення…') {
    const s = this.menu.open('online settings', (e) => e.code === 'Escape' && this.hooks.leave());
    s.appendChild(titleCanvas('ОНЛАЙН', 14, '#ffffff', 3));
    s.appendChild(el('div', 'hint big-hint', text));
    s.appendChild(button('скасувати', '', () => this.hooks.leave(), 'back'));
  }

  /** The room: both seats, my car, host settings, ready. `overlay` keeps the finished match visible behind. */
  showLobby(l: LobbyState, me: 0 | 1, code: string, banner: LobbyBanner | null, overlay: boolean) {
    const s = this.menu.open(`online lobby settings ${overlay ? 'overlay' : ''}`, (e) => {
      if (e.code === 'Enter') this.hooks.ready(!l.players[me]?.ready);
      if (e.code === 'Escape') this.hooks.leave();
    });
    if (banner) s.appendChild(titleCanvas(banner.text, 12, banner.color, 3));

    const head = el('div', 'row lobby-head');
    head.appendChild(el('div', 'room-code', `Кімната <b>${code}</b>`));
    const invite = OnlineUI.inviteUrl(code);
    head.appendChild(button('📤 запросити', 'small gold', () => share(invite, code)));
    s.appendChild(head);

    const seats = el('div', 'seats');
    for (const p of [0, 1] as const) seats.appendChild(this.seat(l, p, me));
    s.appendChild(seats);

    s.appendChild(this.configBlock(l.config, me === l.host));

    const mine = l.players[me];
    const both = l.players.every((p) => p && p.connected);
    const foot = el('div', 'row foot');
    foot.appendChild(button('вийти', '', () => this.hooks.leave(), 'back'));
    const rd = button(mine?.ready ? '✓ готовий' : 'готовий', mine?.ready ? 'on' : 'primary', () => this.hooks.ready(!mine?.ready));
    foot.appendChild(rd);
    s.appendChild(foot);
    s.appendChild(el('div', 'hint', !both ? 'Чекаємо другого гравця: надішли йому посилання чи код' : mine?.ready ? 'Чекаємо, поки суперник буде готовий' : 'Матч почнеться, коли обидва готові'));
  }

  private seat(l: LobbyState, p: 0 | 1, me: 0 | 1) {
    const pl: LobbyPlayer | null = l.players[p];
    const box = el('div', `seat p${p + 1} ${pl ? '' : 'empty'}`);
    if (!pl) {
      box.appendChild(el('div', 'seat-name', 'вільне місце'));
      box.appendChild(el('div', 'seat-wait', 'чекаємо гравця…'));
      return box;
    }
    const tags = [p === me ? 'ти' : '', p === l.host ? 'хост' : ''].filter(Boolean).join(' · ');
    box.appendChild(el('div', 'seat-name', `${escapeHtml(pl.name)}${tags ? ` <small>${tags}</small>` : ''}`));
    const def = (pl.car && CAR_BY_ID[pl.car]) || null;
    if (def && !l.config.randomCars) {
      const other = l.players[1 - p];
      const same = p === 1 && other?.car === def.id;
      const cv = carPreviewCanvas(def, same ? altPalette(def.palette) : def.palette, PLAYER_COLORS[p], 2, p === 1, true);
      cv.className = 'seat-car';
      box.appendChild(cv);
      box.appendChild(el('div', 'seat-carname', def.name));
    } else {
      box.appendChild(el('div', 'seat-car none', l.config.randomCars ? '🎲' : '?'));
      box.appendChild(el('div', 'seat-carname', l.config.randomCars ? 'випадкові авто' : 'авто не обрано'));
    }
    if (p === me && !l.config.randomCars) {
      box.appendChild(button('змінити авто', 'small', () => {
        this.busy = true;
        this.menu.pickCar('ТВОЄ АВТО', PLAYER_COLORS[p], pl.car ?? CARS[0].id, (id) => {
          this.settings.p1 = id;
          this.hooks.settingsChanged();
          this.hooks.pick(id);
        }, () => {
          this.busy = false;
          this.hooks.refresh();
        });
      }));
    }
    box.appendChild(el('div', `seat-state ${pl.ready ? 'ready' : ''} ${pl.connected ? '' : 'gone'}`, !pl.connected ? 'відключився…' : pl.ready ? '✓ готовий' : 'не готовий'));
    return box;
  }

  private configBlock(c: MatchConfig, host: boolean) {
    const box = el('div', 'lobby-config');
    const mapName = c.map === 'random' ? 'випадкова щораунду' : MAP_BY_ID[c.map]?.name ?? c.map;
    if (!host) {
      box.appendChild(el('div', 'hint', `Арена: <b>${escapeHtml(mapName)}</b> · до <b>${c.target}</b> очок · раунд <b>${c.roundTime} с</b>${c.randomCars ? ' · <b>випадкові авто</b>' : ''} · налаштовує хост`));
      return box;
    }
    const row = (label: string, values: number[], cur: number, fmt: (v: number) => string, set: (v: number) => void) => {
      const r = el('div', 'set-row');
      r.appendChild(el('span', '', label));
      const seg = el('div', 'seg');
      for (const v of values) seg.appendChild(button(fmt(v), `small ${v === cur ? 'on' : ''}`, () => set(v)));
      r.appendChild(seg);
      box.appendChild(r);
    };
    const mr = el('div', 'set-row');
    mr.appendChild(el('span', '', 'Арена'));
    mr.appendChild(button(`${escapeHtml(mapName)} ▸`, 'small', () => {
      this.busy = true;
      this.hooks.pickMap(() => this.hooks.config({ map: this.settings.map }));
    }));
    box.appendChild(mr);
    row('Очок до перемоги', [3, 5, 7, 10], c.target, String, (v) => this.hooks.config({ target: v }));
    row('Час раунду', [30, 45, 60, 90], c.roundTime, (v) => `${v}с`, (v) => this.hooks.config({ roundTime: v }));
    row('Випадкові авто щораунду', [1, 0], c.randomCars ? 1 : 0, (v) => (v ? 'так' : 'ні'), (v) => this.hooks.config({ randomCars: !!v }));
    return box;
  }
}

async function share(url: string, code: string) {
  const text = `Зіграймо в Head Bash Arena! Кімната ${code}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Head Bash Arena', text, url });
      return;
    }
  } catch { /* cancelled: fall back to copying */ }
  try {
    await navigator.clipboard.writeText(url);
    toast('Посилання скопійовано');
  } catch {
    prompt('Посилання на кімнату:', url);
  }
}

function toast(msg: string) {
  const t = document.querySelector('.toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 2200);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
