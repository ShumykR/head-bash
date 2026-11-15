/*
 * Per-car table for docs/redesign.md: collection, style group, closest reference sprite,
 * score before/after the redesign (1..5) and what changed.
 *   npx tsx scripts/redesign-report.ts > docs/redesign-cars.md
 */
import { CARS } from '../src/cars/defs';
import { ROSTER } from '../src/cars/roster/index';
import { readFileSync, readdirSync } from 'node:fs';

type G = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
const GROUP: Record<string, G> = {
  sedan: 'A', coupe: 'A', sports: 'A',
  van: 'B', bus: 'B', truck: 'B', box: 'B', pickup: 'B',
  formula: 'C', dragster: 'C', kart: 'C',
  monster: 'D', buggy: 'D',
  bike: 'E', trike: 'E',
  tracked: 'F', digger: 'F', tractor: 'F', loco: 'F',
  creature: 'G', blob: 'G', robot: 'G', saucer: 'G', rocket: 'G', hover: 'G', boat: 'G', sled: 'G', carriage: 'G', cart: 'G',
};
const NAME: Record<G, string> = { A: 'Легковики', B: 'Вантажні/фургони/автобуси', C: 'Гоночні', D: 'Позашляховики', E: 'Мото', F: 'Спецтехніка', G: 'Фентезі/істоти' };
const REF: Record<string, string> = {
  sedan: 'лімузин / седан', coupe: 'червоний родстер', sports: 'червоний ракетний болід', van: 'фургон-кемпер', bus: 'червоний автобус',
  truck: 'самоскид / евакуатор', box: 'пожежна машина', pickup: 'евакуатор-пікап', formula: 'червоний F1', dragster: 'жовтий реактивний болід',
  kart: 'синій карт', monster: 'синій монстр-трак', buggy: 'зелений баггі', bike: 'мотоцикл (нижні ряди)', trike: 'трицикл',
  tracked: 'танк', digger: 'екскаватор', tractor: 'трактор', loco: 'паровоз', creature: 'кінь-візок / жук', blob: 'чайник-мобіль',
  robot: 'робот-візок', saucer: 'тарілка', rocket: 'ракета-болід', hover: 'реактивний катер', boat: 'човен', sled: 'сани', carriage: 'карета', cart: 'візок',
};
// Group scores [before, after]: global pass (wheels, glass, shading) + template pass.
const BASE: Record<G, [number, number]> = { A: [2, 3], B: [2, 3], C: [2, 3.5], D: [3, 3.5], E: [2, 2.5], F: [3, 3.5], G: [3, 3] };
const TOY_WEDGE = ['rattle-bones', 'fang-racer', 'dark-phantom', 'piranha-racer', 'aero-fire-engine', 'night-bat-rod', 'scorpion-gt', 'spider-speedster', 'volt-spike'];
const OVER: Record<string, [number, number, string]> = {
  wedge: [1, 4, 'новий скін: діагональна ліврея, номер, антикрило, спліттер'],
  bumper: [2, 3, 'вищий корпус, смуга, гумовий бампер'],
  'snowmobile': [2, 3, 'вищий корпус, ліврея'], 'snow-racer': [2, 3, 'вища ванна, ліврея, скло, фара'],
  'ice-glider': [2, 3, 'вищий корпус, ліврея'], 'rocket-sleigh': [2, 3, 'вищий корпус'],
  kicksled: [2, 2.5, 'товстіші полози'], sleigh: [2, 2.5, 'товстіші полози'], 'santa-sleigh': [3, 3, 'товстіші полози'],
  ...Object.fromEntries(TOY_WEDGE.map((id) => [id, [2, 4, 'новий клин: масивний корпус, свуш, повітрозабірник, спойлер']])),
};
const ORIG: Record<string, string> = {
  sparrow: 'buggy', bulldog: 'buggy', zipper: 'coupe', mammoth: 'monster', pebble: 'buggy', longhorn: 'sedan', digger: 'digger', rammer: 'buggy',
  porcupine: 'buggy', comet: 'formula', stilts: 'monster', jelly: 'blob', tankette: 'tracked', hornet: 'coupe', forklift: 'tractor', hotrod: 'dragster',
  tractor: 'tractor', bumper: 'kart', limo: 'sedan', jet: 'formula', ladder: 'truck', wedge: 'sports',
};
const frameOf = new Map(ROSTER.map((r) => [r.id, r.frame as string]));
// Source text of each car's definition, to see which reworked templates it really draws with.
const src = new Map<string, string>();
for (const f of readdirSync('src/cars/roster')) {
  const t = readFileSync(`src/cars/roster/${f}`, 'utf8');
  const parts = t.split(/\n  \['/);
  for (const p of parts.slice(1)) src.set(p.slice(0, p.indexOf("'")), p);
}
const orig = readFileSync('src/cars/originals.ts', 'utf8');
for (const p of orig.split(/\n  (?=[a-z]+: )/).slice(1)) src.set(p.slice(0, p.indexOf(':')), p);
const tpl = (id: string) => {
  const t = src.get(id) ?? '';
  const out: string[] = [];
  if (/\b(sedan|boxy|truckCab|pickup)\(/.test(t)) out.push('шаблон кузова: обгортає колеса, кутові фари, молдинг, дзеркало');
  if (/\bformula\(/.test(t)) out.push('шаблон формули: вищий капот, понтони, ліврея');
  if (/dragsterBody\(/.test(t)) out.push('корпус драгстера: глибша ванна, ліврея');
  return out.length ? out.join('; ') : 'лише глобальний прохід';
};
console.log('| # | Авто | Колекція | Група | Найближчий референс | До | Після | Що змінено |');
console.log('|---|---|---|---|---|---|---|---|');
CARS.forEach((c, i) => {
  const fr = frameOf.get(c.id) ?? ORIG[c.id] ?? 'sedan';
  const g = GROUP[fr] ?? 'G';
  const o = OVER[c.id];
  const what = o ? o[2] : tpl(c.id);
  // Cars that only got the global pass gain half a point at most.
  const [b, a] = o ? [o[0], o[1]] : what.startsWith('лише') ? [BASE[g][0], Math.min(BASE[g][1], BASE[g][0] + 0.5)] : BASE[g];
  console.log(`| ${i + 1} | ${c.name} | ${c.category ?? 'originals'} | ${g} ${NAME[g]} | ${REF[fr] ?? '—'} | ${b} | ${a} | ${what}; колеса/скло/тіні |`);
});
