import { describe, it, expect, vi } from 'vitest';
import { Game } from '../src/game/game';
import { CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
import { FlightRecorder, buildReport } from '../src/debug/report';

describe('bug report', () => {
  it('snapshots the match with a flight recording, as plain JSON', () => {
    vi.stubGlobal('navigator', { userAgent: 'test', language: 'uk', maxTouchPoints: 0 });
    vi.stubGlobal('window', { innerWidth: 900, innerHeight: 400, devicePixelRatio: 2 });
    vi.stubGlobal('screen', { width: 900, height: 400 });
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal('location', { href: 'http://x/' });
    const g = new Game({ cars: [CAR_BY_ID['tanker-truck'], CAR_BY_ID.rowboat], maps: [MAP_BY_ID.beach], randomMaps: false, target: 3, roundTime: 60, seed: 4 });
    const rec = new FlightRecorder(g);
    for (let i = 0; i < 300; i++) { g.step(); rec.tick(1 / 60); }
    const rep = buildReport(g, rec, { fps: 59.4, uiState: 'play', mode: 'pvp' });
    const back = JSON.parse(JSON.stringify(rep));
    expect(back.map.id).toBe('beach');
    expect(back.cars).toHaveLength(2);
    expect(back.cars[0].linkWheels.length).toBeGreaterThan(0);
    expect(back.cars[1].swims).toBe(true);
    expect(back.cars[0].fields).toHaveProperty('abilityCd');
    expect(back.match.seed).toBe(4);
    expect(back.recording.samples.length).toBeGreaterThan(10);
    expect(back.recording.events.some((e: { type: string }) => e.type === 'roundStart' || e.type === 'go')).toBe(true);
    expect(JSON.stringify(rep).length).toBeLessThan(400_000);
    vi.unstubAllGlobals();
  });
});
