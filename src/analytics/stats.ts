/**
 * Exploratory statistics used in ANALYZE mode.
 * Plain Pearson correlation and ordinary least-squares (OLS) linear regression
 * applied to the 64 grid cells. These are NOT spatial regression methods and do
 * not account for spatial autocorrelation.
 */

export function mean(xs: readonly number[]): number {
  if (xs.length === 0) throw new Error('mean of empty array');
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

function checkPair(xs: readonly number[], ys: readonly number[]): void {
  if (xs.length !== ys.length) throw new Error('x and y must have equal length');
  if (xs.length < 3) throw new Error('need at least 3 observations');
}

/** Pearson product-moment correlation coefficient, in [-1, 1]. */
export function pearson(xs: readonly number[], ys: readonly number[]): number {
  checkPair(xs, ys);
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) throw new Error('correlation undefined: a variable has zero variance');
  return sxy / Math.sqrt(sxx * syy);
}

export interface Regression {
  slope: number;
  intercept: number;
  /** Coefficient of determination (equals r² for simple linear regression). */
  r2: number;
  n: number;
}

/** Ordinary least squares fit of y = intercept + slope · x. */
export function linearRegression(xs: readonly number[], ys: readonly number[]): Regression {
  checkPair(xs, ys);
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0, sxx = 0, ssTot = 0;
  for (let i = 0; i < xs.length; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    ssTot += (ys[i] - my) ** 2;
  }
  if (sxx === 0) throw new Error('regression undefined: x has zero variance');
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  let ssRes = 0;
  for (let i = 0; i < xs.length; i++) ssRes += (ys[i] - (intercept + slope * xs[i])) ** 2;
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, intercept, r2, n: xs.length };
}

/** Plain-language strength label for |r| (conventional rule-of-thumb bands). */
export function describeStrength(r: number): 'very weak' | 'weak' | 'moderate' | 'strong' | 'very strong' {
  const a = Math.abs(r);
  if (a < 0.2) return 'very weak';
  if (a < 0.4) return 'weak';
  if (a < 0.6) return 'moderate';
  if (a < 0.8) return 'strong';
  return 'very strong';
}
