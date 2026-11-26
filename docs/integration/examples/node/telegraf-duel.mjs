// /duel for a Telegraf bot: post a lobby button in the chat and keep the message up to date.
// A sketch to adapt, not a drop-in module: storage is an in-memory Map here; use the bot's SQLite.
//
// Env: HBA_API_URL (…/api/v1), HBA_API_KEY.
import { Markup } from 'telegraf';
import { HbaClient, HbaError } from './hba-client.mjs';

const hba = new HbaClient({ baseUrl: process.env.HBA_API_URL, apiKey: process.env.HBA_API_KEY });

/** code → { chatId, messageId, names }  (keep in SQLite: it must survive restarts). */
const lobbies = new Map();
let cursor = '0'; // keep in SQLite too

const button = (url) => Markup.inlineKeyboard([Markup.button.url('🎮 Грати', url)]);

/** @param {import('telegraf').Telegraf} bot */
export function setupDuel(bot) {
  bot.command('duel', async (ctx) => {
    try {
      const lobby = await hba.createLobby({
        meta: { chatId: ctx.chat.id },
        // Telegram may deliver the same update twice: one lobby per command message.
        idempotencyKey: `${ctx.chat.id}:${ctx.message.message_id}`,
      });
      // In groups only URL buttons can open a Mini App; miniAppUrl is that URL.
      const url = lobby.miniAppUrl ?? lobby.webUrl;
      const msg = await ctx.reply(`⚔️ ${ctx.from.first_name} кидає виклик! Заходь — перший, хто натисне, грає.`, button(url));
      lobbies.set(lobby.code, { chatId: ctx.chat.id, messageId: msg.message_id, url, names: [] });
    } catch (e) {
      console.error(e);
      await ctx.reply(e instanceof HbaError && e.status >= 500 ? 'Гра зараз недоступна, спробуй пізніше' : 'Не вдалося створити гру');
    }
  });

  hba.poll({
    isActive: () => lobbies.size > 0,
    loadCursor: async () => cursor,
    saveCursor: async (c) => { cursor = c; },
    onEvent: async (ev) => {
      const l = lobbies.get(ev.code);
      if (!l) return; // a lobby this bot instance does not track
      const edit = (text, withButton = true) =>
        bot.telegram.editMessageText(l.chatId, l.messageId, undefined, text, withButton ? button(l.url) : undefined).catch(() => {});
      switch (ev.type) {
        case 'lobby.player_joined':
          l.names[ev.data.player.slot] = ev.data.player.name;
          await edit(`⚔️ У грі: ${l.names.filter(Boolean).join(' і ')}${l.names.filter(Boolean).length < 2 ? '. Чекаємо суперника!' : ''}`);
          break;
        case 'lobby.player_left':
          l.names[ev.data.player.slot] = undefined;
          break;
        case 'match.started':
          await edit(`🔥 Матч: ${ev.data.players.map((p) => p.name).join(' vs ')}`, false);
          break;
        case 'match.finished': {
          const { winner, scores, reason } = ev.data;
          const text =
            reason === 'score' ? `🏆 ${winner.name} перемагає ${scores[0]} : ${scores[1]}`
            : reason === 'forfeit' ? `🏆 ${winner?.name ?? '—'} перемагає: суперник вийшов`
            : 'Матч не зараховано';
          await bot.telegram.sendMessage(l.chatId, text);
          await edit('Реванш? Обидва гравці натискають «готовий» у грі.', true);
          break;
        }
        case 'lobby.closed':
          await edit(ev.data.reason === 'expired' ? '⌛ Ніхто не прийняв виклик' : 'Гру завершено', false);
          lobbies.delete(ev.code);
          break;
        default:
          break; // new event types may appear: ignore them
      }
    },
  });
}
