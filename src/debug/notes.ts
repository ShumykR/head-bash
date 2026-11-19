import type { Game } from '../game/game';

/**
 * Match notes: a quick "fix this later" memo about a car, the arena or the game in general.
 * Every note is saved as its own small plain text file (share sheet on phones, download
 * elsewhere); nothing is kept in the browser.
 */

export interface Note {
  at: string;
  target: string;
  text: string;
  round: number;
  map: string;
}

export function notesToText(list: Note[]) {
  return list
    .map((n) => `[${n.at.replace('T', ' ').slice(0, 16)}] ${n.target} (арена: ${n.map}, раунд ${n.round})\n${n.text}\n`)
    .join('\n');
}

function noteFileName(n: Note) {
  const t = n.at.replace(/[:.]/g, '-').slice(0, 19);
  return `note-${t}.txt`;
}

async function saveText(text: string, fileName: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([text], fileName, { type: 'text/plain' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (matchMedia('(pointer: coarse)').matches && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'Head Bash Arena: нотатки' });
      return 'shared';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}

/** Targets a note can be about: both cars, the arena, and a few general buckets. */
function targets(game: Game): string[] {
  return [
    `Машина 1: ${game.cars[0]?.def.name ?? '?'}`,
    `Машина 2: ${game.cars[1]?.def.name ?? '?'}`,
    `Арена: ${game.map.name}`,
    'Гра загалом',
    'Меню / інтерфейс',
    'Баланс',
  ];
}

/**
 * Opens the note editor over the game. `onClose` is called once it is dismissed, so the caller
 * can unfreeze the match. `say` shows the result toast.
 */
export function openNoteEditor(
  host: HTMLElement,
  game: Game,
  ctx: { say: (msg: string) => void; onClose: () => void },
) {
  const root = document.createElement('div');
  root.className = 'screen overlay note-editor';
  root.style.zIndex = '12';
  root.style.position = 'fixed';

  const title = document.createElement('div');
  title.className = 'hint';
  title.innerHTML = '<b>Нотатка</b> — гру зупинено';

  const opts = targets(game);
  let target = opts[0];
  const seg = document.createElement('div');
  seg.className = 'row note-targets';
  const btns = opts.map((label) => {
    const b = document.createElement('button');
    b.className = 'btn small' + (label === target ? ' on' : '');
    b.textContent = label;
    b.addEventListener('click', () => {
      target = label;
      btns.forEach((x) => x.classList.toggle('on', x === b));
      ta.focus();
    });
    seg.appendChild(b);
    return b;
  });

  const ta = document.createElement('textarea');
  ta.className = 'note-text';
  ta.placeholder = 'Що виправити?';
  ta.rows = 5;
  // Typing must not drive the cars or trip hotkeys (WASD, F9, Esc ...).
  for (const ev of ['keydown', 'keyup'] as const) ta.addEventListener(ev, (e) => e.stopPropagation());

  const actions = document.createElement('div');
  actions.className = 'row';
  const mk = (label: string, cls: string, fn: () => void) => {
    const b = document.createElement('button');
    b.className = 'btn ' + cls;
    b.textContent = label;
    b.addEventListener('click', fn);
    actions.appendChild(b);
    return b;
  };

  const close = () => {
    root.remove();
    ctx.onClose();
  };
  mk('Зберегти', 'big', async () => {
    const text = ta.value.trim();
    if (!text) { ta.focus(); return; }
    const note: Note = { at: new Date().toISOString(), target, text, round: game.match.round, map: game.map.name };
    const name = noteFileName(note);
    const res = await saveText(notesToText([note]), name);
    ctx.say(res === 'cancelled' ? 'Нотатку не збережено' : res === 'shared' ? 'Нотатку відправлено' : `Нотатку збережено: ${name}`);
    close();
  });
  mk('Скасувати', '', close);

  root.append(title, seg, ta, actions);
  host.appendChild(root);
  ta.focus();
}
