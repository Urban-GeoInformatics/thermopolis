/**
 * Spatial analysis on the 8×8 grid: neighbourhoods, spatial autocorrelation
 * (global Moran's I), local clusters (Getis-Ord Gi*), landscape patches,
 * proximity, and change of scale. Pure functions, no UI.
 *
 * Conventions: cells are indexed row-major; "queen" contiguity = the 8 touching
 * neighbours, "rook" = the 4 edge-sharing neighbours.
 */
import { GRID_SIZE } from '../data/neighborhood';

export type Contiguity = 'queen' | 'rook';

export function neighbours(id: number, size = GRID_SIZE, kind: Contiguity = 'queen'): number[] {
  const r = Math.floor(id / size), c = id % size;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    if (kind === 'rook' && dr && dc) continue;
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && cc >= 0 && rr < size && cc < size) out.push(rr * size + cc);
  }
  return out;
}

const mean = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function checkGrid(values: readonly number[], size: number) {
  if (values.length !== size * size) throw new Error('values must have size×size entries');
}

/** Spatial lag of the deviations from the mean (row-standardised weights = mean of neighbours). */
function lagOfDeviations(values: readonly number[], size: number, kind: Contiguity) {
  const m = mean(values);
  const dev = values.map((v) => v - m);
  const lag = dev.map((_, i) => mean(neighbours(i, size, kind).map((j) => dev[j])));
  return { dev, lag };
}

/**
 * Global Moran's I with row-standardised weights.
 * ≈ −1/(n−1) ≈ 0 if values are spatially random; positive if similar values cluster.
 */
export function moransI(values: readonly number[], size = GRID_SIZE, kind: Contiguity = 'queen'): number {
  checkGrid(values, size);
  const { dev, lag } = lagOfDeviations(values, size, kind);
  const den = dev.reduce((s, d) => s + d * d, 0);
  if (den === 0) throw new Error("Moran's I undefined: no variation");
  return dev.reduce((s, d, i) => s + d * lag[i], 0) / den;
}

export const expectedMoransI = (n: number) => -1 / (n - 1);

/** Points for a Moran scatterplot: standardised value vs mean standardised value of neighbours. */
export function moranScatter(values: readonly number[], size = GRID_SIZE, kind: Contiguity = 'queen') {
  checkGrid(values, size);
  const { dev, lag } = lagOfDeviations(values, size, kind);
  const sd = Math.sqrt(dev.reduce((s, d) => s + d * d, 0) / dev.length);
  return dev.map((d, i) => ({ id: i, x: d / sd, y: lag[i] / sd }));
}

/** |z| above this marks a cell as a significant cluster member (≈95 % per cell, uncorrected). */
export const Z_CRIT = 1.96;

/** Getis-Ord Gi* z-scores (binary weights, each cell included in its own neighbourhood). */
export function getisOrdGiStar(values: readonly number[], size = GRID_SIZE, kind: Contiguity = 'queen'): number[] {
  checkGrid(values, size);
  const n = values.length;
  const xbar = mean(values);
  const s = Math.sqrt(mean(values.map((v) => v * v)) - xbar * xbar);
  if (s === 0) throw new Error('Gi* undefined: no variation');
  return values.map((_, i) => {
    const hood = [i, ...neighbours(i, size, kind)];
    const w = hood.length;
    const sum = hood.reduce((a, j) => a + values[j], 0);
    return (sum - xbar * w) / (s * Math.sqrt((n * w - w * w) / (n - 1)));
  });
}

export type ClusterClass = 'hot' | 'cold' | 'ns';
export const classifyCluster = (z: number): ClusterClass => (z > Z_CRIT ? 'hot' : z < -Z_CRIT ? 'cold' : 'ns');

/** Connected groups of cells satisfying `mask` (rook connectivity by default), largest first. */
export function patches(mask: readonly boolean[], size = GRID_SIZE, kind: Contiguity = 'rook'): number[][] {
  const seen = new Array(mask.length).fill(false);
  const out: number[][] = [];
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || seen[i]) continue;
    const stack = [i], group: number[] = [];
    seen[i] = true;
    while (stack.length) {
      const k = stack.pop()!;
      group.push(k);
      for (const j of neighbours(k, size, kind)) if (mask[j] && !seen[j]) { seen[j] = true; stack.push(j); }
    }
    out.push(group.sort((a, b) => a - b));
  }
  return out.sort((a, b) => b.length - a.length || a[0] - b[0]);
}

/** Number of cell edges separating masked from non-masked cells (inside the grid). */
export function edgeCount(mask: readonly boolean[], size = GRID_SIZE): number {
  let e = 0;
  for (let i = 0; i < mask.length; i++) for (const j of neighbours(i, size, 'rook')) if (j > i && mask[i] !== mask[j]) e++;
  return e;
}

/** Straight-line distance, in cell widths, from each cell to the nearest masked cell (0 inside). */
export function distanceToMask(mask: readonly boolean[], size = GRID_SIZE): number[] {
  const targets = mask.map((m, i) => (m ? i : -1)).filter((i) => i >= 0);
  if (!targets.length) throw new Error('mask is empty');
  return mask.map((_, i) => Math.min(...targets.map((t) => Math.hypot(Math.floor(i / size) - Math.floor(t / size), (i % size) - (t % size)))));
}

/** Mean of each 2×2 block: an 8×8 grid becomes 4×4 (a change of spatial scale). */
export function aggregate2x2(values: readonly number[], size = GRID_SIZE): number[] {
  checkGrid(values, size);
  const half = size / 2, out: number[] = [];
  for (let r = 0; r < half; r++) for (let c = 0; c < half; c++) {
    const a = (2 * r) * size + 2 * c;
    out.push((values[a] + values[a + 1] + values[a + size] + values[a + size + 1]) / 4);
  }
  return out;
}
