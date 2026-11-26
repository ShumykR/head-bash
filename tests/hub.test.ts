import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError, HubCore, HubStore } from '../server/src/hub-core';

class MapStore implements HubStore {
  m = new Map<string, unknown>();
  async get<T>(k: string) { return structuredClone(this.m.get(k)) as T | undefined; }
  async put(k: string, v: unknown) { this.m.set(k, structuredClone(v)); }
  async delete(k: string) { this.m.delete(k); }
  async list<T>(prefix: string, o: { startAfter?: string; limit?: number } = {}) {
    const keys = [...this.m.keys()].filter((k) => k.startsWith(prefix) && (!o.startAfter || k > o.startAfter)).sort().slice(0, o.limit ?? Infinity);
    return new Map(keys.map((k) => [k, structuredClone(this.m.get(k)) as T]));
  }
}

let now = Date.parse('2026-12-01T12:00:00Z');
let seq = 1;
let hub: HubCore;
beforeEach(() => {
  now = Date.parse('2026-12-01T12:00:00Z');
  seq = 1;
  hub = new HubCore({
    store: new MapStore(), now: () => now, rand: () => ((seq = (seq * 16807) % 2147483647) / 2147483647),
    gameUrl: 'https://shumykr.github.io/head-bash', botUsername: 'hb_bot', appShortName: 'arena',
  });
});

describe('hub: lobbies for the bot', () => {
  it('creates a lobby with links', async () => {
    const l = await hub.createLobby({ meta: { chatId: -100, messageId: 7 } });
    expect(l.code).toMatch(/^[A-Z2-9]{5}$/);
    expect(l.startParam).toBe(`l_${l.code}`);
    expect(l.miniAppUrl).toBe(`https://t.me/hb_bot/arena?startapp=l_${l.code}`);
    expect(l.webUrl).toBe(`https://shumykr.github.io/head-bash/?room=${l.code}`);
    expect(l.status).toBe('waiting');
    expect(await hub.isOpen(l.code)).toBe(true);
    expect((await hub.getLobby(l.code)).meta).toEqual({ chatId: -100, messageId: 7 });
  });

  it('is idempotent with the same key', async () => {
    const a = await hub.createLobby({}, 'k1');
    const b = await hub.createLobby({}, 'k1');
    const c = await hub.createLobby({}, 'k2');
    expect(b.code).toBe(a.code);
    expect(c.code).not.toBe(a.code);
  });

  it('validates input', async () => {
    await expect(hub.createLobby({ meta: 'x'.repeat(2000) })).rejects.toMatchObject({ code: 'meta_too_large', status: 400 });
    await expect(hub.createLobby({ ttlSec: 5 })).rejects.toBeInstanceOf(ApiError);
    await expect(hub.getLobby('ZZZZZ')).rejects.toMatchObject({ status: 404, code: 'lobby_not_found' });
    await expect(hub.events('abc', null)).rejects.toMatchObject({ code: 'bad_cursor' });
  });
});

describe('hub: events from the room', () => {
  it('records the whole story in order, with meta, and pages by cursor', async () => {
    const { code } = await hub.createLobby({ meta: { chatId: 1 } });
    await hub.report(code, { type: 'player_joined', slot: 0, name: 'Олег', tgUserId: 11 });
    await hub.report(code, { type: 'player_joined', slot: 1, name: 'Ігор', tgUserId: 22 });
    await hub.report(code, { type: 'match_started' });
    expect((await hub.getLobby(code)).status).toBe('playing');
    await hub.report(code, { type: 'match_finished', winner: 1, scores: [3, 5], reason: 'score' });
    const all = await hub.events(null, null);
    expect(all.events.map((e) => e.type)).toEqual(['lobby.player_joined', 'lobby.player_joined', 'match.started', 'match.finished']);
    expect(all.events.every((e) => (e.meta as { chatId: number }).chatId === 1)).toBe(true);
    const fin = all.events[3];
    expect(fin.data).toMatchObject({ winner: { slot: 1, name: 'Ігор', tgUserId: 22 }, scores: [3, 5], reason: 'score' });
    expect((await hub.getLobby(code)).status).toBe('waiting'); // back in the lobby for a rematch
    const page1 = await hub.events(null, '2');
    expect(page1.events.map((e) => e.id)).toEqual([1, 2]);
    const page2 = await hub.events(page1.cursor, '2');
    expect(page2.events.map((e) => e.id)).toEqual([3, 4]);
    const page3 = await hub.events(page2.cursor, null);
    expect(page3).toEqual({ events: [], cursor: page2.cursor });
  });

  it('expires a lobby nobody opened, closes an emptied one, ignores unknown codes', async () => {
    const a = await hub.createLobby({ ttlSec: 60 });
    const b = await hub.createLobby({});
    await hub.report(b.code, { type: 'player_joined', slot: 0, name: 'X' });
    expect(await hub.sweep()).toBe(now + 60_000);
    now += 61_000;
    await hub.sweep();
    expect((await hub.getLobby(a.code)).status).toBe('closed');
    expect(await hub.isOpen(a.code)).toBe(false);
    expect((await hub.getLobby(b.code)).status).toBe('waiting'); // someone is in it
    await hub.report(b.code, { type: 'room_closed' });
    const ev = (await hub.events(null, null)).events;
    expect(ev.filter((e) => e.type === 'lobby.closed').map((e) => e.data.reason)).toEqual(['expired', 'empty']);
    await hub.report('QQQQQ', { type: 'match_started' });
    expect((await hub.events(null, null)).events).toHaveLength(ev.length);
  });

  it('cancels before the match, not during it', async () => {
    const a = await hub.createLobby({});
    expect((await hub.cancelLobby(a.code)).closeRoom).toBe(true);
    expect((await hub.getLobby(a.code)).closedReason).toBe('cancelled');
    const b = await hub.createLobby({});
    await hub.report(b.code, { type: 'match_started' });
    await expect(hub.cancelLobby(b.code)).rejects.toMatchObject({ status: 409 });
  });

  it('forgets events after a day', async () => {
    const { code } = await hub.createLobby({});
    await hub.report(code, { type: 'player_joined', slot: 0, name: 'A' });
    now += 25 * 3600 * 1000;
    await hub.report(code, { type: 'player_joined', slot: 1, name: 'B' });
    await hub.sweep();
    expect((await hub.events(null, null)).events.map((e) => e.id)).toEqual([2]);
  });
});
