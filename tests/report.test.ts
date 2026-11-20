import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Vec2 } from 'planck';
import { Game } from '../src/game/game';
import { CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
import { FlightRecorder, buildReport, compactJson } from '../src/debug/report';

beforeEach(() => {
  vi.stubGlobal('navigator', { userAgent: 'test', language: 'uk', maxTouchPoints: 0 });
  vi.stubGlobal('window', { innerWidth: 900, innerHeight: 400, devicePixelRatio: 2 });
  vi.stubGlobal('screen', { width: 900, height: 400 });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('location', { href: 'http://x/' });
});
afterEach(() => vi.unstubAllGlobals());

function dropRig(height: number) {
  const g = new Game({ cars: [CAR_BY_ID.sparrow, CAR_BY_ID.rowboat], maps: [MAP_BY_ID.meadow], randomMaps: false, target: 99, roundTime: 60, seed: 3 });
  const rec = new FlightRecorder(g);
  while (g.phase !== 'play') g.step();
  for (let i = 0; i < 120; i++) g.step();
  const hold = () => { for (const c of g.cars) for (const b of c.bodies) { const v = b.getLinearVelocity(); b.setLinearVelocity(new Vec2(0, v.y > 1 ? v.y : 0)); } };
  const hp = g.cars[0].headWorld();
  g.spawnItem('melon', 1, new Vec2(hp.x, hp.y - height), new Vec2(0, 0), 30);
  for (let i = 0; i < 80 && g.phase === 'play'; i++) { hold(); g.step(); }
  return { g, rec };
}

describe('bug report', () => {
  it('snapshots the match with a flight recording, as plain JSON', () => {
    const g = new Game({ cars: [CAR_BY_ID['tanker-truck'], CAR_BY_ID.rowboat], maps: [MAP_BY_ID.beach], randomMaps: false, target: 3, roundTime: 60, seed: 4 });
    const rec = new FlightRecorder(g);
    for (let i = 0; i < 300; i++) g.step();
    rec.mark('mark');
    const rep = buildReport(g, rec, { fps: 59.4, uiState: 'play', mode: 'pvp', note: 'тест', category: 'Інше', full: true });
    const text = compactJson(rep);
    const back = JSON.parse(text);
    expect(back.map.id).toBe('beach');
    expect(back.note).toBe('тест');
    expect(back.category).toBe('Інше');
    expect(back.cars).toHaveLength(2);
    expect(back.cars[0].linkWheels.length).toBeGreaterThan(0);
    expect(back.cars[1].swims).toBe(true);
    expect(back.match.seed).toBe(4);
    expect(back.recording.samples.length).toBeGreaterThan(10);
    expect(back.recording.samples[0]).toHaveProperty('n');
    expect(back.recording.samples[0].cars[0]).toHaveProperty('head');
    expect(back.recording.events.some((e: { type: string }) => e.type === 'roundStart' || e.type === 'go')).toBe(true);
    expect(back.recording.roundStart).toMatchObject({ round: 1, map: 'beach' });
    expect(typeof back.recording.roundStart.rngState).toBe('number');
    expect(text.length).toBeLessThan(400_000);
  });

  it('is short by default: no idle fields, no wheels, no browser noise', () => {
    const g = new Game({ cars: [CAR_BY_ID['tanker-truck'], CAR_BY_ID.rowboat], maps: [MAP_BY_ID.beach], randomMaps: false, target: 3, roundTime: 60, seed: 4 });
    for (let i = 0; i < 60; i++) g.step();
    const rep = JSON.parse(compactJson(buildReport(g, null, {})));
    expect(rep.cars[0].wheels).toBeUndefined();
    expect(rep.cars[0].links).toBeUndefined();
    expect(rep.env.userAgent).toBeUndefined();
    for (const c of rep.cars) {
      expect(c.fields.histTick).toBeUndefined();
      expect(Object.values(c.fields).every((v) => v !== 0 && v !== false && typeof v !== 'string')).toBe(true);
    }
  });

  it('marks a moment with the dense steps leading up to it, and keeps it', () => {
    const g = new Game({ cars: [CAR_BY_ID.sparrow, CAR_BY_ID.rowboat], maps: [MAP_BY_ID.meadow], randomMaps: false, target: 3, roundTime: 60, seed: 4 });
    const rec = new FlightRecorder(g);
    for (let i = 0; i < 400; i++) g.step();
    rec.mark('mark');
    const n = g.stepCount;
    for (let i = 0; i < 600; i++) g.step(); // long after the mark
    rec.mark('report');
    const inc = JSON.parse(compactJson(buildReport(g, rec).recording!.incidents));
    expect(inc.map((i: { kind: string }) => i.kind)).toEqual(['mark', 'report']);
    expect(inc[0].n).toBe(n);
    expect(inc[0].dense).toHaveLength(180); // every step of the last 3 s
    expect(inc[0].dense[179].n).toBe(n);
    expect(inc[0].dense[0].n).toBe(n - 179);
    expect(inc[0].dense[0].c[0]).toHaveLength(7);
    expect(rec.marks()).toBe(1);
  });

  it('records items near a head and what was decided when they touched it', () => {
    const { g, rec } = dropRig(1.5);
    const rep = JSON.parse(compactJson(buildReport(g, rec)));
    expect(rep.recording.samples.some((s: { near: string[][] }) => s.near.some((t) => t[0].startsWith('melon#')))).toBe(true);
    const hit = rep.headLog.find((e: { with: string }) => e.with === 'item');
    expect(hit).toMatchObject({ player: 0, item: 'melon', owner: 1, result: 'KILL', need: 3.5 });
    expect(hit.rel).toBeGreaterThan(3.5);
    expect(typeof hit.rel).toBe('number');
  });

  it('writes a slow touch as below-threshold instead of nothing', () => {
    const g = new Game({ cars: [CAR_BY_ID.sparrow, CAR_BY_ID.rowboat], maps: [MAP_BY_ID.meadow], randomMaps: false, target: 99, roundTime: 60, seed: 3 });
    while (g.phase !== 'play') g.step();
    for (let i = 0; i < 120; i++) g.step();
    const hp = g.cars[0].headWorld();
    const it = g.spawnItem('cone', 1, new Vec2(hp.x - 1, hp.y), new Vec2(2, 0), 30);
    it.body.setGravityScale(0);
    for (const c of g.cars) for (const b of c.bodies) b.setLinearVelocity(new Vec2(0, 0));
    for (let i = 0; i < 60; i++) { it.body.setLinearVelocity(new Vec2(2, 0)); g.step(); }
    expect(g.headLog.find((e) => e.with === 'item' && e.item === 'cone')).toMatchObject({ result: 'below-threshold' });
  });

  it('compactJson stays valid JSON and puts short things on one line', () => {
    const v = { a: [1, 2, 3], b: { x: 1, y: 'z' }, long: Array.from({ length: 80 }, (_, i) => ({ i, name: 'item' + i })) };
    const out = compactJson(v);
    expect(JSON.parse(out)).toEqual(v);
    expect(out).toContain('"a": [1,2,3]');
    expect(out.split('\n').length).toBeLessThan(120);
  });
});
