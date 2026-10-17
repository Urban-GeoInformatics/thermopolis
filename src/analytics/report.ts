/**
 * Single source of truth for every analytical number shown to students.
 * The web app and the printable PDF both call these functions, so the two
 * can never disagree.
 */
import { CELLS, type Cell, type VariableKey } from '../data/neighborhood';
import { linearRegression, pearson, describeStrength, type Regression } from './stats';
import { neighbours, aggregate2x2, classifyCluster, distanceToMask, edgeCount, expectedMoransI, getisOrdGiStar, moranScatter, moransI, patches, type ClusterClass } from './spatial';
import { SCENARIOS, TOP_N, intersectionSize, priorityScores, topCellIds, type Scenario } from './priority';

export type ExplanatoryKey = Extract<VariableKey, 'vegetation' | 'builtUp'>;

export interface RelationshipResult {
  variable: ExplanatoryKey;
  xs: number[];
  ys: number[];
  r: number;
  regression: Regression;
  strength: ReturnType<typeof describeStrength>;
  direction: 'negative' | 'positive';
}

export function relationship(variable: ExplanatoryKey, cells: readonly Cell[] = CELLS): RelationshipResult {
  const xs = cells.map((c) => c[variable]);
  const ys = cells.map((c) => c.heat);
  const r = pearson(xs, ys);
  return {
    variable,
    xs,
    ys,
    r,
    regression: linearRegression(xs, ys),
    strength: describeStrength(r),
    direction: r < 0 ? 'negative' : 'positive',
  };
}

export interface ScenarioResult {
  scenario: Scenario;
  scores: number[];
  top: number[];
}

export function scenarioResult(scenario: Scenario, cells: readonly Cell[] = CELLS): ScenarioResult {
  return {
    scenario,
    scores: priorityScores(cells, scenario.heatWeight),
    top: topCellIds(cells, scenario.heatWeight, TOP_N),
  };
}

export function allScenarioResults(cells: readonly Cell[] = CELLS): ScenarioResult[] {
  return SCENARIOS.map((s) => scenarioResult(s, cells));
}

/** How many top-priority cells two scenarios share, and how many differ. */
export function compareTop(a: ScenarioResult, b: ScenarioResult) {
  const shared = intersectionSize(a.top, b.top);
  return { shared, changed: TOP_N - shared };
}

/** Format r with a proper minus sign and 2 decimals, e.g. "−0.74". */
export function fmtR(r: number): string {
  return (r < 0 ? '−' : '+') + Math.abs(r).toFixed(2);
}

export function fmtSlope(s: number): string {
  return (s < 0 ? '−' : '+') + Math.abs(s).toFixed(3);
}

// ───────────────────────── spatial analysis results ─────────────────────────

/** A cell "breaks the pattern" if it has this much vegetation yet is still hot. */
export const SURPRISE_VEG = 40;
export const SURPRISE_HEAT = 32; // °C
/** A cell counts as green space (for patches / proximity) from this vegetation cover. */
export const GREEN_THRESHOLD = 40;

export function surpriseCells(cells: readonly Cell[] = CELLS): number[] {
  return cells.filter((c) => c.vegetation >= SURPRISE_VEG && c.heat >= SURPRISE_HEAT).map((c) => c.id);
}

export interface HotspotResult {
  z: number[];
  cls: ClusterClass[];
  hotCount: number;
  coldCount: number;
  /** The TOP_N highest-heat cells that are NOT in a significant hot cluster. */
  highButNotSignificant: number[];
  moran: number;
}

export function hotspots(cells: readonly Cell[] = CELLS): HotspotResult {
  const heat = cells.map((c) => c.heat);
  const z = getisOrdGiStar(heat);
  const cls = z.map(classifyCluster);
  const high = [...cells].sort((a, b) => b.heat - a.heat || a.id - b.id).slice(0, TOP_N).map((c) => c.id);
  return {
    z, cls,
    hotCount: cls.filter((c) => c === 'hot').length,
    coldCount: cls.filter((c) => c === 'cold').length,
    highButNotSignificant: high.filter((i) => cls[i] !== 'hot').sort((a, b) => a - b),
    moran: moransI(heat),
  };
}

/** Separate hot and cool areas: connected groups (queen contiguity) of cells in the same class. */
export function clusterAreas(cells: readonly Cell[] = CELLS): { hot: number[][]; cool: number[][] } {
  const { cls } = hotspots(cells);
  return { hot: patches(cls.map((c) => c === 'hot'), 8, 'queen'), cool: patches(cls.map((c) => c === 'cold'), 8, 'queen') };
}

/** The hottest cell that is not in a hot spot, with its neighbours' average: a concrete "hot cell, no hot spot" example. */
export function hotCellNotInSpot(cells: readonly Cell[] = CELLS): { id: number; temp: number; neighbourMean: number } {
  const { cls } = hotspots(cells);
  const candidate = cells.filter((c) => cls[c.id] !== 'hot').sort((a, b) => b.heat - a.heat || a.id - b.id)[0];
  const nb = neighbours(candidate.id).map((j) => cells[j].heat);
  return { id: candidate.id, temp: candidate.heat, neighbourMean: nb.reduce((a, b) => a + b, 0) / nb.length };
}

export interface ResidualResult {
  variable: ExplanatoryKey;
  /** actual heat − heat predicted by the straight line (positive = hotter than the line predicts). */
  residuals: number[];
  moran: number;
}

export function residualResult(variable: ExplanatoryKey, cells: readonly Cell[] = CELLS): ResidualResult {
  const { regression } = relationship(variable, cells);
  const residuals = cells.map((c) => c.heat - (regression.intercept + regression.slope * c[variable]));
  return { variable, residuals, moran: moransI(residuals) };
}

/** How many of the student's picks fall inside a scenario's top-priority set. */
export function pickAgreement(picks: readonly number[], result: ScenarioResult): number {
  const top = new Set(result.top);
  return picks.filter((p) => top.has(p)).length;
}

export interface LandscapeMetrics {
  greenMask: boolean[];
  patchSizes: number[];
  greenCells: number;
  largestShare: number;
  edges: number;
  /** straight-line distance (cell widths) to the nearest green cell */
  distToGreen: number[];
  rDistHeat: number;
}

export function landscapeMetrics(cells: readonly Cell[] = CELLS): LandscapeMetrics {
  const greenMask = cells.map((c) => c.vegetation >= GREEN_THRESHOLD);
  const ps = patches(greenMask);
  const greenCells = greenMask.filter(Boolean).length;
  const distToGreen = distanceToMask(greenMask);
  return {
    greenMask, patchSizes: ps.map((p) => p.length), greenCells,
    largestShare: ps[0].length / greenCells, edges: edgeCount(greenMask),
    distToGreen, rDistHeat: pearson(distToGreen, cells.map((c) => c.heat)),
  };
}

export interface ScaleComparison {
  r8: Record<ExplanatoryKey, number>;
  r4: Record<ExplanatoryKey, number>;
  heat4: number[];
}

/** Same analysis at two spatial scales (64 cells vs 16 aggregated cells). */
export function scaleComparison(cells: readonly Cell[] = CELLS): ScaleComparison {
  const heat4 = aggregate2x2(cells.map((c) => c.heat));
  const r8 = {} as Record<ExplanatoryKey, number>, r4 = {} as Record<ExplanatoryKey, number>;
  for (const v of ['vegetation', 'builtUp'] as const) {
    r8[v] = pearson(cells.map((c) => c[v]), cells.map((c) => c.heat));
    r4[v] = pearson(aggregate2x2(cells.map((c) => c[v])), heat4);
  }
  return { r8, r4, heat4 };
}

export { expectedMoransI, moranScatter };

// ───────────────────────── single-criterion rankings (PRIORITIZE tools) ─────────────────────────
import { topCellIds as _topCellIds } from './priority';

/** Top-16 cells by one criterion alone (temperature weight 1 or 0). No tie at the boundary. */
export function singleCriterionTop(criterion: 'heat' | 'vulnerability', cells: readonly Cell[] = CELLS): number[] {
  return _topCellIds(cells, criterion === 'heat' ? 1 : 0, TOP_N);
}

/** Cell ids that are in the top 16 for both temperature alone and vulnerability alone. */
export function singleCriterionShared(cells: readonly Cell[] = CELLS): number[] {
  const v = new Set(singleCriterionTop('vulnerability', cells));
  return singleCriterionTop('heat', cells).filter((i) => v.has(i)).sort((a, b) => a - b);
}

/** How many of the top-16 cells temperature alone and vulnerability alone have in common. */
export function singleCriterionAgreement(cells: readonly Cell[] = CELLS): number {
  const v = new Set(singleCriterionTop('vulnerability', cells));
  return singleCriterionTop('heat', cells).filter((i) => v.has(i)).length;
}

// ───────────────────────── descriptive statistics (EXPLORE) ─────────────────────────

export interface TemperatureSummary {
  min: number;
  median: number;
  mean: number;
  max: number;
  minId: number;
  maxId: number;
}

export function temperatureSummary(cells: readonly Cell[] = CELLS): TemperatureSummary {
  const t = cells.map((c) => c.heat);
  const sorted = [...t].sort((a, b) => a - b);
  const mid = sorted.length / 2;
  return {
    min: sorted[0], max: sorted[sorted.length - 1],
    median: (sorted[mid - 1] + sorted[mid]) / 2,
    mean: t.reduce((a, b) => a + b, 0) / t.length,
    minId: cells.reduce((m, c) => (c.heat < cells[m].heat ? c.id : m), 0),
    maxId: cells.reduce((m, c) => (c.heat > cells[m].heat ? c.id : m), 0),
  };
}
