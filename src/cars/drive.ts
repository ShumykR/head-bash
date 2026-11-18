import type { CarDef, DriveKind } from './types';

/**
 * Sets a car's running gear: `drive` given, else tracks when its skin draws a track belt (pieces
 * marked `gear`), and the live belt's stand-off from the wheel rims and material from that belt.
 */
export function withDrive(def: CarDef, drive?: DriveKind): CarDef {
  const beltPoly = def.body.find((p) => p.gear);
  const kind = drive ?? (beltPoly ? 'tracks' : undefined);
  if (!kind || kind === 'wheels') return def;
  const out: CarDef = { ...def, drive: kind };
  if (beltPoly && kind === 'tracks' && def.wheels.length) {
    const ys = beltPoly.pts.map((q) => q[1]), xs = beltPoly.pts.map((q) => q[0]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), r = (y1 - y0) / 2;
    const w0 = [...def.wheels].sort((p, q) => p.x - q.x)[0];
    const mat = beltPoly.mat ?? 'rubber';
    if (def.wheels.some((w) => w.x < x0 - 0.05 || w.x > x1 + 0.05)) {
      // the belt is shorter than the wheelbase (a ski up front): it runs on idlers of its own
      const a = x0 + r, b = x1 - r;
      out.belt = { grow: 0.08, mat, idlers: { x0: +a.toFixed(3), x1: +b.toFixed(3), y: +((y0 + y1) / 2).toFixed(3), r: +r.toFixed(3), bogies: Math.max(2, Math.round((b - a) / 0.42) + 1) } };
    } else out.belt = { grow: +Math.max(0.02, r - w0.r).toFixed(3), mat };
  }
  return out;
}
