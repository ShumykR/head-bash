/* Key points of the driver's figure, car-local: npx tsx scripts/riderpts.ts id,id */
import { CARS } from '../src/cars/defs';
import { HELMET_SCALE } from '../src/cars/sprite';
const ids = process.argv[2]?.split(',');
const f = (n: number) => n.toFixed(2);
for (const d of CARS.filter((c) => !ids || ids.includes(c.id))) {
  const { x, y, r } = d.head, u = r / 0.26, rd = d.rider;
  const lean = (rd?.lean ?? (rd?.pose === 'ride' ? 0.08 : 0)) * u;
  const neck = [x - 0.02 * u, y + 0.26 * u];
  const drop = rd?.pose === 'ride' ? Math.sqrt(Math.max(0.01, 0.27 * 0.27 - (lean / u) * (lean / u) * 0.6)) : 0.31;
  const hip = [neck[0] - 0.04 * u - lean, neck[1] + drop * u];
  const sh = [neck[0] + 0.02 * u, neck[1] + 0.07 * u];
  const hand = rd?.hand ?? [sh[0] + 0.26 * u, sh[1] + 0.13 * u];
  console.log(`${d.id.padEnd(22)} head ${f(x)},${f(y)} r${f(r)} helmetBot ${f(y + r * HELMET_SCALE)} shoulder ${f(sh[0])},${f(sh[1])} hand ${f(hand[0])},${f(hand[1])} hip ${f(hip[0])},${f(hip[1])} ${rd?.pose ?? 'sit'}${rd?.front ? ' front' : ''}`);
}
