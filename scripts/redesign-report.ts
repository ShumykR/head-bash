/*
 * Per-car redesign table from docs/redesign/evals/*.json → docs/redesign/cars.md
 *   npx tsx scripts/redesign-report.ts
 * Each eval: general traits Z1..Z6, category traits K1..K3 and the pair score P against
 * the closest reference (see docs/redesign/README.md), before and after the redesign.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { CARS } from '../src/cars/defs';

interface Score { z: number[]; k: number[]; p: number }
interface Round3 { verdict: string; note: string; after: Score }
interface Eval { id: string; group: string; ref: string; before: Score; gap: string; redo: string; after?: Score; da?: string; round1?: unknown; r3?: Round3 }

const DIR = 'docs/redesign/evals';
const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
export const total = (s: Score) => Math.round(avg([avg(s.z), avg(s.k), s.p]) * 2) / 2;

const evals = new Map<string, Eval>();
for (const f of readdirSync(DIR).filter((n) => n.endsWith('.json')).sort()) {
  for (const e of JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8')) as Eval[]) {
    if (!CARS.some((c) => c.id === e.id)) throw new Error(`${f}: unknown car ${e.id}`);
    for (const s of [e.before, e.after, e.r3?.after]) if (s && (s.z.length !== 6 || s.k.length !== 3)) throw new Error(`${e.id}: need 6 Z and 3 K scores`);
    evals.set(e.id, e);
  }
}

const fmt = (s?: Score) => (s ? `${s.z.join('')} · ${s.k.join('')} · ${s.p} → **${total(s)}**` : '—');
const lines = [
  '# Оцінка кожного авто',
  '',
  'Згенеровано `npx tsx scripts/redesign-report.ts` з `evals/*.json`. Формат оцінки: `Z1..Z6 · K1..K3 · P → підсумок` (див. README). ² — перемальоване в другому раунді (референси з фандому Drive Ahead): «До» тут — підсумок першого раунду, а перший раунд збережено в `round1`. «Раунд 3» — повторна перевірка всіх авто з пропорціями коліс по осях: «осі» — змінено розміри коліс, «перемальовано» — новий малюнок, «без змін» — авто пройшло перевірку як є.',
  '',
];
let done = 0, sb = 0, sa = 0, s3 = 0;
const cats = [...new Set(CARS.map((c) => c.category ?? 'originals'))];
for (const cat of cats) {
  const cars = CARS.filter((c) => (c.category ?? 'originals') === cat);
  lines.push(`## ${cat} (${cars.filter((c) => evals.get(c.id)?.after).length}/${cars.length})`, '');
  lines.push('| Авто | Група | Референс | Drive Ahead (фандом) | До | Прогалини | Редизайн | Після | Раунд 3 | Підсумок |', '|---|---|---|---|---|---|---|---|---|---|');
  for (const c of cars) {
    const e = evals.get(c.id);
    if (!e) { lines.push(`| ${c.name} | | | | ще не оцінено | | | | | |`); continue; }
    if (e.after) { done++; sb += total(e.before); sa += total(e.after); s3 += total(e.r3?.after ?? e.after); }
    const r3 = e.r3 ? `${e.r3.verdict}: ${e.r3.note}` : '—';
    lines.push(`| ${c.name}${e.round1 ? ' ²' : ''} | ${e.group} | ${e.ref} | ${e.da ?? '—'} | ${fmt(e.before)} | ${e.gap} | ${e.redo} | ${fmt(e.after)} | ${r3} | ${fmt(e.r3?.after ?? e.after)} |`);
  }
  lines.push('');
}
const checked = [...evals.values()].filter((e) => e.r3).length;
lines.splice(4, 0, `Готово: **${done}/${CARS.length}** авто, раунд 3 пройшли **${checked}/${CARS.length}**. Середній підсумок: ${done ? (sb / done).toFixed(2) : '—'} → ${done ? (sa / done).toFixed(2) : '—'} (раунди 1–2) → ${done ? (s3 / done).toFixed(2) : '—'} (раунд 3).`, '');
writeFileSync('docs/redesign/cars.md', lines.join('\n'));
console.log(`done ${done}/${CARS.length}`);
