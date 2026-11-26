import './net/detmath-install'; // must stay first: online lockstep needs identical Math in every engine
import { FlightRecorder, buildReport, reportFileName, saveReport } from './debug/report';
import { openNoteEditor, openBugEditor } from './debug/notes';
import { Application, TextureSource } from 'pixi.js';
import { Game, GameEvent } from './game/game';
import { GameView, setOnlineLabels } from './render/view';
import { InputManager } from './input/input';
import { CARS, CAR_BY_ID } from './cars/defs';
import { MAPS, MAP_BY_ID } from './maps/defs';
import { Bot } from './ai/bot';
import { audio } from './audio/audio';
import { music } from './audio/music';
import { Menu, Mode } from './ui/menu';
import { loadSettings, saveSettings } from './ui/settings';
import { setupPwa } from './ui/pwa';
import { NetSession } from './net/session';
import { serverUrl, buildId } from './net/config';
import { CODE_RE, bitsOf } from './net/protocol';
import { OnlineUI, type LobbyBanner } from './ui/lobby';
import { initTelegram } from './platform/telegram';

TextureSource.defaultOptions.scaleMode = 'nearest';

type State = 'menu' | 'play' | 'paused' | 'over';

async function boot() {
  const q = new URLSearchParams(location.search);
  if (q.has('gallery')) {
    const { showGallery } = await import('./ui/gallery');
    showGallery(document.getElementById('ui')!);
    (window as any).__ready = true;
    return;
  }

  // Telegram Mini App (only when Telegram opened the page): full screen, Back button, the player's identity.
  const tg = await initTelegram();

  const host = document.getElementById('app')!;
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: '#14101e',
    antialias: false,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    preference: 'webgl',
  });
  host.appendChild(app.canvas);

  const input = new InputManager(app.canvas);
  const relayout = () => input.layout(window.innerWidth, window.innerHeight);
  relayout();
  window.addEventListener('resize', relayout);
  const coarse = matchMedia('(pointer: coarse)').matches;

  const view = new GameView(app, input);
  view.debug = q.has('debug');
  const settings = loadSettings();
  if (tg && !settings.name && tg.name) settings.name = tg.name;
  let state: State = 'menu';
  let mode: Mode = 'pvp';
  let game: Game | null = null;
  let overTimer = -1;
  /** The online session, when playing over the network. */
  let online: NetSession | null = null;
  const netBadge = document.createElement('div');
  netBadge.className = 'net-badge';
  document.getElementById('ui')!.appendChild(netBadge);
  /** Seconds the simulation has been waiting for the other player. */
  let stallT = 0;
  const updateNetBadge = (dt: number) => {
    const s = online;
    netBadge.classList.toggle('on', !!s && state === 'play');
    if (!s) return;
    stallT = s.ls?.stalled ? stallT + dt : 0;
    const waiting = stallT > 0.3 || s.client.status === 'reconnecting';
    netBadge.classList.toggle('warn', waiting || s.client.rtt > 200);
    netBadge.textContent = s.client.status === 'reconnecting' ? 'перепідключення…' : waiting ? 'чекаємо суперника…' : `${Math.round(s.client.rtt)} мс`;
  };

  const pauseBtn = document.createElement('button');
  pauseBtn.className = 'btn pause-btn';
  pauseBtn.textContent = 'II';
  pauseBtn.addEventListener('click', () => pause());
  document.getElementById('ui')!.appendChild(pauseBtn);

  // Bug report: a JSON snapshot + the last seconds of recording, saved as a file (or shared on phones).
  let recorder: FlightRecorder | null = null;
  let fps = 60;
  const toast = document.createElement('div');
  toast.className = 'toast';
  document.getElementById('ui')!.appendChild(toast);
  let toastTimer = 0;
  const say = (msg: string) => {
    toast.textContent = msg;
    toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('on'), 2600);
  };
  // While a note or bug report is being written/sent the match is frozen.
  let frozen = false;
  const freeze = (f: boolean) => {
    frozen = f;
    if (f) audio.stopEngines();
    music.duck(f || state === 'paused');
  };
  // The bug button marks the moment at once, then asks what went wrong: a report without a note is not saved.
  const reportBug = () => {
    if (!game || !settings.debugButtons || state !== 'play' || frozen) return;
    const g = game;
    freeze(true);
    recorder?.mark('report');
    openBugEditor(document.getElementById('ui')!, g, {
      marks: recorder?.marks() ?? 0,
      onSubmit: async ({ category, text }) => {
        const rep = buildReport(g, recorder, { fps, uiState: state, mode, note: text, category, full: !!(window as any).__reportFull });
        const res = await saveReport(rep);
        say(res === 'cancelled' ? 'Звіт не відправлено' : res === 'shared' ? 'Звіт відправлено' : `Звіт збережено: ${reportFileName(rep)}`);
      },
      onClose: () => freeze(false),
    });
  };
  // One tap during play: "it just happened". The game goes on; the report saved later carries the steps around this moment.
  const markMoment = () => {
    if (!game || !settings.debugButtons || state !== 'play' || frozen) return;
    recorder?.mark('mark');
    say('📍 Момент позначено. Збережіть звіт кнопкою 🐞, коли зручно');
  };
  const bugBtn = document.createElement('button');
  bugBtn.className = 'btn bug-btn';
  bugBtn.textContent = '🐞';
  bugBtn.title = 'Звіт про баг з обов’язковою нотаткою (F9)';
  bugBtn.addEventListener('click', reportBug);
  document.getElementById('ui')!.appendChild(bugBtn);

  const markBtn = document.createElement('button');
  markBtn.className = 'btn mark-btn';
  markBtn.textContent = '📍';
  markBtn.title = 'Позначити момент «щойно було» (F7)';
  markBtn.addEventListener('click', markMoment);
  document.getElementById('ui')!.appendChild(markBtn);

  const writeNote = () => {
    if (!game || !settings.debugButtons || state !== 'play' || frozen) return;
    freeze(true);
    openNoteEditor(document.getElementById('ui')!, game, { say, onClose: () => freeze(false) });
  };
  const noteBtn = document.createElement('button');
  noteBtn.className = 'btn note-btn';
  noteBtn.textContent = '📝';
  noteBtn.title = 'Нотатка: ідея, правка, зауваження (не баг) (F8)';
  noteBtn.addEventListener('click', writeNote);
  document.getElementById('ui')!.appendChild(noteBtn);

  const setState = (s: State) => {
    state = s;
    tg?.setBack(s !== 'menu' || !document.querySelector('.screen.main'));
    pauseBtn.style.display = s === 'play' ? '' : 'none';
    pauseBtn.textContent = online ? '⚑' : 'II';
    pauseBtn.title = online ? 'Здатися' : 'Пауза';
    for (const b of [bugBtn, noteBtn, markBtn]) b.style.display = s === 'play' && settings.debugButtons ? '' : 'none';
    view.hud.visible = s === 'play';
    view.showTouch = s === 'play' && (coarse || input.touchEnabled);
    if (s !== 'play') audio.stopEngines();
    if (s === 'menu') music.play('menu');
    music.duck(s === 'paused');
  };

  const onEvent = (e: GameEvent) => {
    if (state === 'menu') return; // attract mode is silent
    if (online?.ls?.catchingUp) return; // re-simulating after a reconnect: no sound burst
    if (tg) {
      if (e.type === 'death') tg.haptic('heavy');
      else if (e.type === 'impact' && e.carCar && e.strength > 2.5) tg.haptic('light');
      else if (e.type === 'matchEnd') tg.haptic(online ? (e.winner === online.slot ? 'success' : 'error') : 'success');
    }
    switch (e.type) {
      case 'countdown': audio.countdown(e.n); break;
      case 'go': audio.countdown(0); break;
      case 'impact': audio.impact(e.strength, e.carCar); break;
      case 'death': audio.explosion(); break;
      case 'pad': audio.pad(); break;
      case 'ability': audio.ability(e.kind, game?.cars[e.player].ability?.projectile); break;
      case 'blast': audio.blast(e.kind, Math.max(0.4, Math.min(3.2, (e.r / 3) * Math.sqrt((e.power ?? 1) / 0.8)))); break;
      case 'shieldBlock': audio.shieldBlock(); break;
      case 'effect': audio.effect(e.effect); break;
      case 'shotHit': audio.impact(2, false); break;
      case 'suddenDeath':
        audio.siren();
        if (!e.late) music.play('sudden');
        break;
      case 'roundStart': if (music.current === 'sudden') music.resumeMatch(); break;
      case 'roundEnd': if (e.result !== 'draw') audio.point(); break;
      case 'matchEnd':
        music.stop();
        audio.jingle(online ? e.winner === online.slot : mode === 'pvp' || e.winner === 0);
        overTimer = 1.6;
        break;
    }
  };

  const newGame = (cfg: ConstructorParameters<typeof Game>[0]) => {
    game = new Game(cfg);
    game.on(onEvent);
    recorder = new FlightRecorder(game);
    view.attach(game);
    (window as any).__game = game;
    (window as any).__music = music;
    (window as any).__audio = audio;
    return game;
  };

  /** Leave the online room (any local game or the menu ends online play). */
  const leaveOnline = () => {
    if (!online) return;
    const s = online;
    online = null; // first: closing the socket reports 'closed', which must not look like a lost connection
    s.leave();
    setOnlineLabels(null);
    netBadge.classList.remove('on');
    input.solo = false;
    relayout();
  };

  const startDemo = () => {
    leaveOnline();
    const a = CARS[Math.floor(Math.random() * CARS.length)], b = CARS[Math.floor(Math.random() * CARS.length)];
    const g = newGame({ cars: [a, b], maps: MAPS, randomMaps: true, randomCars: true, carPool: CARS, target: 999, roundTime: 40 });
    g.controllers[0] = new Bot('hard', 11);
    g.controllers[1] = new Bot('normal', 12);
    setState('menu');
  };

  const startMatch = () => {
    leaveOnline();
    const map = settings.map === 'random' ? null : MAP_BY_ID[settings.map];
    const g = newGame({
      cars: [CAR_BY_ID[settings.p1] ?? CARS[0], CAR_BY_ID[settings.p2] ?? CARS[1]],
      maps: map ? [map] : MAPS,
      randomMaps: !map,
      randomCars: settings.randomCars,
      carPool: CARS,
      target: settings.target,
      roundTime: settings.roundTime,
      seed: q.has('seed') ? Number(q.get('seed')) : undefined,
    });
    if (mode === 'bot') g.controllers[1] = new Bot(settings.bot, Date.now() & 0xffff);
    input.solo = mode === 'bot';
    relayout();
    if (q.has('bots')) {
      g.controllers[0] = new Bot('hard', 5);
      g.controllers[1] = new Bot('hard', 6);
    }
    overTimer = -1;
    menu.hide();
    music.playMatch();
    setState('play');
  };

  /** Result line shown above the online lobby after a match. */
  let onlineBanner: LobbyBanner | null = null;
  const showOnlineLobby = () => {
    const s = online;
    if (!s || onlineUI.busy || state === 'play' || state === 'paused') return;
    if (!s.lobby || s.slot === null || !s.code) return onlineUI.showConnecting();
    onlineUI.showLobby(s.lobby, s.slot, s.code, onlineBanner, state === 'over');
  };
  const rejectText: Record<string, string> = {
    version: 'Інша версія гри: онови сторінку',
    full: 'Кімната вже заповнена',
    notFound: 'Кімнату не знайдено',
    auth: 'Не вдалося підтвердити гравця',
    bad: 'Сервер відхилив підключення',
  };

  /**
   * Online play: create a room (no code) or join one, then the lobby; the session drives
   * the Game in lockstep, each side with its own controls.
   * `auto` (from ?online=1&car=…&target=…) picks, configures and readies by itself — used by tests.
   */
  const openOnline = (code?: string, auto = false) => {
    leaveOnline();
    if (state !== 'menu') startDemo();
    goFullscreen();
    onlineBanner = null;
    onlineUI.busy = false;
    let picked = false;
    const staging = !!tg?.staging && code === tg.roomCode;
    OnlineUI.server = staging ? serverUrl(q, true) : null;
    const s = new NetSession({ server: serverUrl(q, staging), name: (auto && q.get('name')) || settings.name || 'Гравець', build: buildId(), auth: tg?.initData }, {
      makeGame: (cfg) => {
        const me = s.slot ?? 0;
        setOnlineLabels({ me, foe: s.lobby?.players[1 - me]?.name ?? '' });
        const g = newGame(cfg);
        input.solo = true;
        relayout();
        overTimer = -1;
        onlineBanner = null;
        onlineUI.busy = false;
        menu.hide();
        music.playMatch();
        setState('play');
        return g;
      },
      onLobby: (l) => {
        if (l.phase !== 'lobby' || s.slot === null) return;
        const me = l.players[s.slot];
        if (!picked) {
          picked = true;
          if (!me?.car) s.pick((auto && q.get('car')) || settings.p1);
          if (auto && s.slot === l.host && (q.has('target') || q.has('time') || q.has('map'))) {
            s.config({
              ...(q.has('target') ? { target: Number(q.get('target')) } : {}),
              ...(q.has('time') ? { roundTime: Number(q.get('time')) } : {}),
              ...(q.has('map') ? { map: q.get('map')! } : {}),
            });
          }
        }
        if (auto && me?.car && !me.ready && l.players.every((p) => p && p.connected) && state !== 'over') s.ready();
        showOnlineLobby();
      },
      onStatus: (st) => {
        if (st === 'open' && s.code) {
          const u = new URL(location.href);
          u.searchParams.set('room', s.code);
          history.replaceState(null, '', u);
        }
        if (st === 'reconnecting') say('Зв’язок втрачено, перепідключення…');
        if (st === 'closed' && online === s) {
          say('З’єднання з сервером закрито');
          leaveOnline();
          startDemo();
          onlineUI.showEntry();
        }
      },
      onPeer: (st, deadline) => say(st === 'left' ? `Суперник відключився (${Math.max(0, Math.round(((deadline ?? Date.now()) - Date.now()) / 1000))} с на повернення)` : 'Суперник повернувся'),
      onEnd: (winner, scores, reason) => {
        const win = winner !== null && winner === s.slot;
        const sc = scores ? ` ${scores[s.slot ?? 0]} : ${scores[1 - (s.slot ?? 0)]}` : '';
        onlineBanner =
          reason === 'score' ? { text: win ? `ТИ ПЕРЕМІГ!${sc}` : `СУПЕРНИК ПЕРЕМІГ${sc}`, color: win ? '#ffd23f' : '#ff5a6e' }
          : reason === 'forfeit' ? { text: win ? 'СУПЕРНИК ВИЙШОВ: ПЕРЕМОГА' : 'ТЕХНІЧНА ПОРАЗКА', color: win ? '#ffd23f' : '#ff5a6e' }
          : reason === 'desync' ? { text: 'РОЗСИНХРОН: НЕ ЗАРАХОВАНО', color: '#ffffff' }
          : { text: 'МАТЧ ПЕРЕРВАНО', color: '#ffffff' };
        // A normal finish waits for the match-end slow-mo (see the ticker); anything else returns at once.
        if (reason !== 'score' || overTimer <= 0) {
          overTimer = -1;
          setState('over');
          audio.stopEngines();
          showOnlineLobby();
        }
      },
      onReject: (r) => {
        say(rejectText[r] ?? rejectText.bad);
        leaveOnline();
        onlineUI.showEntry();
      },
    });
    online = s;
    (window as any).__online = s;
    onlineUI.showConnecting();
    s.connect(code);
  };

  const goFullscreen = () => {
    // In Telegram the Mini App goes full screen through Telegram (platform/telegram.ts).
    if (!coarse || tg) return;
    const de = document.documentElement as any;
    if (!document.fullscreenElement && de.requestFullscreen) {
      de.requestFullscreen({ navigationUI: 'hide' }).then(() => (screen.orientation as any)?.lock?.('landscape').catch(() => {})).catch(() => {});
    }
  };

  const pause = () => {
    if (state !== 'play') return;
    if (online) {
      // An online match cannot be paused: the button offers to concede instead.
      const ask = tg ? tg.confirm('Здатися й вийти з матчу?') : Promise.resolve(confirm('Здатися й вийти з матчу?'));
      void ask.then((ok) => {
        if (!ok || !online) return;
        leaveOnline();
        startDemo();
        menu.showMain();
      });
      return;
    }
    setState('paused');
    menu.showPause();
  };

  const menu = new Menu(document.getElementById('ui')!, settings, {
    start: (m) => {
      mode = m;
      goFullscreen();
      menu.showCars(m, () => menu.showMaps(() => startMatch(), () => menu.showCars(m, () => menu.showMaps(startMatch, () => menu.showMain()))));
    },
    resume: () => {
      menu.hide();
      setState('play');
    },
    restart: () => startMatch(),
    toMenu: () => {
      startDemo();
      menu.showMain();
    },
    rematch: () => startMatch(),
    online: () => onlineUI.showEntry(),
    changeCars: () => menu.showCars(mode, () => menu.showMaps(() => startMatch(), () => menu.showMain())),
    install: null,
    settingsChanged: () => saveSettings(settings),
  });
  const onlineUI = new OnlineUI(menu, settings, {
    create: () => openOnline(),
    join: (code) => openOnline(code),
    leave: () => {
      leaveOnline();
      if (state !== 'menu') startDemo();
      menu.showMain();
    },
    pick: (car) => online?.pick(car),
    config: (c) => online?.config(c),
    ready: (r) => online?.ready(r),
    pickMap: (done) => {
      const back = () => { onlineUI.busy = false; showOnlineLobby(); };
      menu.showMaps(() => { done(); back(); }, back);
    },
    refresh: () => showOnlineLobby(),
    settingsChanged: () => saveSettings(settings),
  });

  if (tg) {
    // Telegram's Back button does what Escape does (menus go back; in an online match it offers to concede).
    tg.onBack = () => {
      if (state === 'play') return pause();
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' }));
    };
    // Show it whenever we are off the main menu.
    new MutationObserver(() => tg.setBack(state !== 'menu' || !document.querySelector('.screen.main'))).observe(document.getElementById('ui')!, { childList: true, subtree: true });
  }

  if (!tg) setupPwa((fn) => {
    (menu as any).hooks.install = fn;
    if (state === 'menu' && !document.querySelector('.cars, .maps, .settings')) menu.showMain();
  });

  input.onAnyKey = (code) => {
    audio.unlock();
    if (code === 'Backquote') view.debug = !view.debug;
    if (code === 'F9' && game) reportBug();
    if (code === 'F7' && game) markMoment();
    if (code === 'F8' && game) writeNote();
    if (code === 'Escape' && state === 'play' && !frozen) pause();
  };
  window.addEventListener('pointerdown', () => audio.unlock(), { once: false });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !frozen && !online) pause();
  });

  const roomParam = (tg?.roomCode ?? q.get('room') ?? '').toUpperCase();
  if (q.has('online')) {
    // Test/dev autopilot: ?online=1&room=new|CODE&car=…&target=…&time=…&map=…
    startDemo();
    openOnline(roomParam && roomParam !== 'NEW' ? roomParam : undefined, true);
  } else if (CODE_RE.test(roomParam)) {
    // An invite link: straight into that room.
    startDemo();
    openOnline(roomParam);
  } else if (q.has('autostart') || q.has('map') || q.has('p1') || q.has('bots')) {
    if (q.get('p1')) settings.p1 = q.get('p1')!;
    if (q.get('p2')) settings.p2 = q.get('p2')!;
    settings.map = q.get('map') ?? settings.map;
    if (q.get('time')) settings.roundTime = Number(q.get('time'));
    if (q.get('target')) settings.target = Number(q.get('target'));
    if (q.has('randomcars')) settings.randomCars = q.get('randomcars') !== '0';
    mode = q.get('mode') === 'bot' ? 'bot' : 'pvp';
    startMatch();
  } else {
    startDemo();
    menu.showMain();
  }

  /** Time of the previous online frame (performance.now), for real elapsed time. */
  let netLastMs = 0;
  app.ticker.add((t) => {
    const dt = Math.min(t.deltaMS / 1000, 0.1);
    if (t.deltaMS > 0) fps += (1000 / t.deltaMS - fps) * 0.05;
    if (!game) return;
    if (input.touchEnabled && state === 'play') view.showTouch = true;
    if (online && online.game === game) {
      // Online: own controls (either keyboard set or the touch pad) drive our seat; the session steps the Game.
      const b0 = input.buttons(0), b1 = input.buttons(1);
      const live = state === 'play';
      updateNetBadge(dt);
      // Real elapsed time (Pixi's ticker caps a frame at 0.1 s): the match clock must not lose time on slow devices.
      const nowMs = performance.now();
      const realDt = netLastMs ? Math.min((nowMs - netLastMs) / 1000, 1) : dt;
      netLastMs = nowMs;
      online.frame(realDt, bitsOf(live && (b0.left || b1.left), live && (b0.right || b1.right), live && (input.action(0) || input.action(1))));
    } else if (!frozen && (state === 'play' || state === 'menu' || state === 'over')) {
      game.inputs[0] = input.dir(0);
      game.inputs[1] = input.dir(1);
      game.actions[0] = state === 'play' && input.action(0);
      game.actions[1] = state === 'play' && input.action(1);
      game.frame(dt);
    }
    view.render(state === 'paused' || frozen ? 0 : dt);
    if (state === 'play' && !frozen) {
      audio.setEngines(game.cars.map((c, i) => ({ load: c.engineLoad, throttle: c.input !== 0, alive: c.alive, pitch: i === 0 ? 1 : 1.12 })));
      if (overTimer > 0) {
        overTimer -= dt;
        if (overTimer <= 0) {
          setState('over');
          if (online) showOnlineLobby();
          else menu.showOver(game.match.winner ?? 0, game.match.scores, mode);
        }
      }
    }
  });

  (window as any).__ready = true;
  (window as any).__view = view;
  (window as any).__bugReport = reportBug;
  (window as any).__app = { menu, settings, get state() { return state; } };
}

boot();
