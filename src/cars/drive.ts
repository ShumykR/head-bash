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
    const ys = beltPoly.pts.map((q) => q[1]);
    const w0 = [...def.wheels].sort((p, q) => p.x - q.x)[0];
    out.belt = { grow: +Math.max(0.02, (Math.max(...ys) - Math.min(...ys)) / 2 - w0.r).toFixed(3), mat: beltPoly.mat ?? 'rubber' };
  }
  return out;
}
