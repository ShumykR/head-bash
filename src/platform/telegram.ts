/**
 * Running as a Telegram Mini App. Telegram opens the game with launch data in
 * the URL hash (#tgWebAppData=…); only then is Telegram's SDK loaded, so the
 * plain web game is unaffected.
 *
 * What it gives the game: the raw initData (the room server verifies it and
 * learns the player's Telegram id and name), the lobby to open (start_param
 * `l_<CODE>` from the bot's link), the player's first name, full screen in
 * landscape, no swipe-to-close while playing, Telegram's Back button and
 * haptic feedback.
 */

interface WebApp {
  initData: string;
  initDataUnsafe: { start_param?: string; user?: { id: number; first_name?: string; last_name?: string; username?: string } };
  version: string;
  isVersionAtLeast(v: string): boolean;
  ready(): void;
  expand(): void;
  requestFullscreen?(): void;
  lockOrientation?(): void;
  disableVerticalSwipes?(): void;
  setHeaderColor?(c: string): void;
  setBackgroundColor?(c: string): void;
  BackButton: { show(): void; hide(): void; onClick(cb: () => void): void };
  HapticFeedback?: { impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void; notificationOccurred(t: 'error' | 'success' | 'warning'): void };
  onEvent(e: string, cb: () => void): void;
  showConfirm?(text: string, cb: (ok: boolean) => void): void;
}

declare global {
  interface Window { Telegram?: { WebApp: WebApp } }
}

const SDK = 'https://telegram.org/js/telegram-web-app.js?59';

export interface TelegramPlatform {
  /** Raw initData for the room server. */
  initData: string;
  /** Room code from the bot's link (start_param `l_<CODE>`, or `ls_<CODE>` for a staging lobby), if any. */
  roomCode: string | null;
  /** The lobby lives on the staging server. */
  staging: boolean;
  /** The player's name in Telegram. */
  name: string;
  /** Show/hide Telegram's Back button; `onBack` is what it does. */
  setBack(visible: boolean): void;
  onBack: (() => void) | null;
  haptic(kind: 'light' | 'medium' | 'heavy' | 'success' | 'error'): void;
  /** Telegram's own confirm dialog (window.confirm is unreliable in its WebView). */
  confirm(text: string): Promise<boolean>;
}

/** True when the page was opened by Telegram as a Mini App. */
export function launchedFromTelegram(): boolean {
  return /tgWebAppData=/.test(location.hash) || new URLSearchParams(location.search).has('tgWebAppStartParam');
}

function loadSdk(): Promise<void> {
  if (window.Telegram?.WebApp) return Promise.resolve();
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = SDK;
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.head.appendChild(s);
    setTimeout(resolve, 5000);
  });
}

/** Set up the Mini App; null when not in Telegram (or the SDK did not load). */
export async function initTelegram(): Promise<TelegramPlatform | null> {
  if (!launchedFromTelegram()) return null;
  await loadSdk();
  const wa = window.Telegram?.WebApp;
  if (!wa || !wa.initData) return null;
  const at = (v: string) => wa.isVersionAtLeast?.(v);
  wa.ready();
  wa.expand();
  try {
    wa.setHeaderColor?.('#14101e');
    wa.setBackgroundColor?.('#14101e');
    if (at('7.7')) wa.disableVerticalSwipes?.();
    if (at('8.0')) {
      wa.requestFullscreen?.();
      wa.lockOrientation?.();
    }
  } catch { /* older clients: stay as they are */ }
  document.documentElement.classList.add('tg');

  const sp = wa.initDataUnsafe.start_param ?? new URLSearchParams(location.search).get('tgWebAppStartParam') ?? '';
  const m = /^(ls?)_([A-Z0-9]{5})$/i.exec(sp);
  const u = wa.initDataUnsafe.user;
  const p: TelegramPlatform = {
    initData: wa.initData,
    roomCode: m ? m[2].toUpperCase() : null,
    staging: !!m && m[1].toLowerCase() === 'ls',
    name: [u?.first_name, u?.last_name].filter(Boolean).join(' ').slice(0, 24) || u?.username || '',
    onBack: null,
    setBack: (v) => {
      try { if (v) wa.BackButton.show(); else wa.BackButton.hide(); } catch { /* not supported */ }
    },
    confirm: (text) => new Promise((resolve) => {
      if (wa.showConfirm && at('6.2')) wa.showConfirm(text, (ok) => resolve(!!ok));
      else resolve(window.confirm(text));
    }),
    haptic: (kind) => {
      try {
        if (kind === 'success' || kind === 'error') wa.HapticFeedback?.notificationOccurred(kind);
        else wa.HapticFeedback?.impactOccurred(kind);
      } catch { /* not supported */ }
    },
  };
  wa.BackButton.onClick(() => p.onBack?.());
  return p;
}
