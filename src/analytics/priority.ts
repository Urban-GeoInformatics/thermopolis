/**
 * Mode 3 — simplified weighted multi-criteria evaluation (two criteria).
 *
 *   Priority = w · Heat_norm + (1 − w) · Vulnerability_norm      (0–1)
 *   displayed on a 0–10 scale.
 *
 * Both criteria are min–max normalised against FIXED reference bounds (not the
 * min/max of the data), so the same bounds apply in every scenario.
 * The score is a constructed decision-support index, not a cooling prediction.
 */
import type { Cell } from '../data/neighborhood';

export interface Bounds { min: number; max: number }

/** Reference bounds: temperature 20–40 °C and vulnerability 5–35 % aged 65+ (the full display ranges, not the data's min/max). */
export const HEAT_BOUNDS: Bounds = { min: 20, max: 40 };
export const VULN_BOUNDS: Bounds = { min: 5, max: 35 }; // % of residents aged 65+

/** Number of cells flagged as "highest priority": top 25 % of 64. */
export const TOP_N = 16;

export function normalize(value: number, { min, max }: Bounds): number {
  if (max <= min) throw new Error('invalid bounds');
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/** Priority on the 0–10 display scale. `heatWeight` is w in [0,1]. */
export function priorityScore(cell: Pick<Cell, 'heat' | 'vulnerability'>, heatWeight: number): number {
  if (heatWeight < 0 || heatWeight > 1) throw new Error('heatWeight must be within [0, 1]');
  const h = normalize(cell.heat, HEAT_BOUNDS);
  const v = normalize(cell.vulnerability, VULN_BOUNDS);
  return 10 * (heatWeight * h + (1 - heatWeight) * v);
}

export function priorityScores(cells: readonly Cell[], heatWeight: number): number[] {
  return cells.map((c) => priorityScore(c, heatWeight));
}

/**
 * Ids of the `n` highest-scoring cells. Ties are broken by lower id so the
 * result is fully deterministic.
 */
export function topCellIds(cells: readonly Cell[], heatWeight: number, n: number = TOP_N): number[] {
  const scores = priorityScores(cells, heatWeight);
  return cells
    .map((c) => c.id)
    .sort((a, b) => scores[b] - scores[a] || a - b)
    .slice(0, n);
}

export interface Scenario {
  id: 'A' | 'B' | 'C';
  label: string;
  short: string;
  heatWeight: number;
}

export const SCENARIOS: readonly Scenario[] = [
  { id: 'A', label: 'Temperature-focused', short: 'Temperature 80 · Vuln 20', heatWeight: 0.8 },
  { id: 'B', label: 'Balanced', short: 'Temperature 50 · Vuln 50', heatWeight: 0.5 },
  { id: 'C', label: 'Vulnerability-focused', short: 'Temperature 20 · Vuln 80', heatWeight: 0.2 },
];

export function intersectionSize(a: readonly number[], b: readonly number[]): number {
  const s = new Set(a);
  return b.filter((x) => s.has(x)).length;
}
