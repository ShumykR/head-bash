/**
 * The bot API documentation (docs/integration) must match the server:
 * real responses and the documented examples validate against openapi.yaml,
 * and every error code / event type the server can produce is documented.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { HubCore, HubStore } from '../server/src/hub-core';

const spec = parse(readFileSync('docs/integration/openapi.yaml', 'utf8'));

/** A small JSON Schema checker for the subset the spec uses. Returns error paths. */
function check(schema: any, v: unknown, path = '$'): string[] {
  if (!schema) return [];
  if (schema.$ref) return check(schema.$ref.replace('#/', '').split('/').reduce((o: any, k: string) => o[k], spec), v, path);
  if (schema.oneOf) {
    const ok = schema.oneOf.filter((s: any) => check(s, v, path).length === 0).length;
    return ok === 1 ? [] : [`${path}: matches ${ok} of oneOf`];
  }
  const errs: string[] = [];
  const types: string[] | undefined = schema.type === undefined ? undefined : [].concat(schema.type);
  if (types) {
    const t = v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v;
    if (!types.includes(t) && !(t === 'integer' && types.includes('number'))) return [`${path}: ${t} is not ${types.join('|')}`];
  }
  if (schema.enum && !schema.enum.includes(v)) errs.push(`${path}: ${JSON.stringify(v)} not in enum`);
  if (typeof v === 'string' && schema.pattern && !new RegExp(schema.pattern).test(v)) errs.push(`${path}: pattern`);
  if (typeof v === 'number' && ((schema.minimum !== undefined && v < schema.minimum) || (schema.maximum !== undefined && v > schema.maximum))) errs.push(`${path}: range`);
  if (Array.isArray(v)) {
    if ((schema.minItems !== undefined && v.length < schema.minItems) || (schema.maxItems !== undefined && v.length > schema.maxItems)) errs.push(`${path}: length`);
    v.forEach((x, i) => errs.push(...check(schema.items, x, `${path}[${i}]`)));
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const r of schema.required ?? []) if (!(r in v)) errs.push(`${path}: missing ${r}`);
    for (const [k, s] of Object.entries(schema.properties ?? {})) if (k in v) errs.push(...check(s, (v as any)[k], `${path}.${k}`));
  }
  return errs;
}
const schemaOf = (name: string) => spec.components.schemas[name];
const eventsPage = spec.paths['/events'].get.responses['200'].content['application/json'].schema;

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

describe('bot API contract (docs/integration/openapi.yaml)', () => {
  it('the checker itself rejects wrong shapes', () => {
    expect(check(schemaOf('Lobby'), { code: 'x' }).length).toBeGreaterThan(3);
    expect(check(schemaOf('Event'), { id: 1, type: 'nope', at: '', code: 'A', data: {}, meta: null })).toEqual(['$.type: "nope" not in enum']);
  });

  it('real lobbies and every kind of event match the schemas', async () => {
    let now = Date.parse('2026-12-01T12:00:00Z');
    let seq = 3;
    const hub = new HubCore({ store: new MapStore(), now: () => now, rand: () => ((seq = (seq * 16807) % 2147483647) / 2147483647), gameUrl: 'https://shumykr.github.io/head-bash/' });
    const a = await hub.createLobby({ meta: { chatId: -100 } }, 'k');
    expect(check(schemaOf('Lobby'), a)).toEqual([]);
    expect(a.miniAppUrl).toBeNull();
    await hub.report(a.code, { type: 'player_joined', slot: 0, name: 'A', tgUserId: 1 });
    await hub.report(a.code, { type: 'player_joined', slot: 1, name: 'B' });
    await hub.report(a.code, { type: 'match_started' });
    await hub.report(a.code, { type: 'match_finished', winner: 0, scores: [5, 2], reason: 'score' });
    await hub.report(a.code, { type: 'match_started' });
    await hub.report(a.code, { type: 'match_finished', winner: null, scores: null, reason: 'desync' });
    await hub.report(a.code, { type: 'player_left', slot: 1, name: 'B' });
    await hub.report(a.code, { type: 'room_closed' });
    const b = await hub.createLobby({ ttlSec: 30 });
    now += 31_000;
    await hub.sweep();
    const c = await hub.createLobby({});
    await hub.cancelLobby(c.code);
    for (const code of [a.code, b.code, c.code]) expect(check(schemaOf('Lobby'), await hub.getLobby(code))).toEqual([]);
    const page = await hub.events(null, null);
    expect(check(eventsPage, page)).toEqual([]);
    const types = new Set(page.events.map((e) => e.type));
    expect([...types].sort()).toEqual([...schemaOf('Event').properties.type.enum].sort());
  });

  it('every error code the server can return is documented', () => {
    const src = ['server/src/hub-core.ts', 'server/src/hub.ts'].map((f) => readFileSync(f, 'utf8')).join('\n');
    const codes = new Set([...src.matchAll(/(?:ApiError|apiError)\(\s*\d+,\s*'([a-z_]+)'/g)].map((m) => m[1]));
    expect(codes.size).toBeGreaterThan(5);
    const documented: string[] = schemaOf('Error').properties.error.properties.code.enum;
    for (const c of codes) expect(documented, `error code ${c}`).toContain(c);
  });

  it('the JSON examples in examples/curl.md are valid', () => {
    const md = readFileSync('docs/integration/examples/curl.md', 'utf8');
    const blocks = [...md.matchAll(/```json\n([\s\S]*?)```/g)].map((m) => JSON.parse(m[1]));
    expect(blocks).toHaveLength(3);
    expect(check(schemaOf('Lobby'), blocks[0])).toEqual([]);
    expect(check(eventsPage, blocks[1])).toEqual([]);
    expect(check(schemaOf('Error'), blocks[2])).toEqual([]);
  });

  it('the examples inside openapi.yaml are valid', () => {
    const ex = spec.paths['/lobbies'].post.responses['201'].content['application/json'].example;
    expect(check(schemaOf('Lobby'), ex)).toEqual([]);
  });
});
