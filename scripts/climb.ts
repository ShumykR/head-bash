import { CAR_BY_ID } from '../src/cars/defs';
import { climbTest } from '../src/physics/probe';

// Usage: CARS=mammoth,sparrow ANGLES=25,35,45 HW=0.6 FRICTION=0.85 npx tsx scripts/climb.ts
// A pit with straight walls of angle θ (flat bottom of half-width HW m): the car starts from rest on the bottom and holds the throttle
// toward the right rim. Prints the seconds to get out, FLIP if it tipped over on the slope, stuck if it never got out.
const ids = (process.env.CARS ?? 'mammoth,monster-truck,sparrow,bulldog,hotrod,tractor,minibus,race-car-f1,go-kart,dragster').split(',');
const angles = (process.env.ANGLES ?? '20,25,30,35,40,45,50').split(',').map(Number);
const hw = Number(process.env.HW ?? 0.6), fr = Number(process.env.FRICTION ?? 0.85);
console.log('car'.padEnd(16), angles.map((a) => String(a + '°').padStart(8)).join(''));
for (const id of ids) {
  if (!CAR_BY_ID[id]) continue;
  console.log(id.padEnd(16), angles.map((a) => { const r = climbTest(CAR_BY_ID[id], a, hw, fr); return (r.flipped ? 'FLIP' : r.out < 0 ? 'stuck' : r.out.toFixed(1) + 's').padStart(8); }).join(''));
}
