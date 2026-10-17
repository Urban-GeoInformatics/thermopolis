/**
 * Sequential colour ramps (ColorBrewer-style 5-class stops, interpolated).
 * One distinct hue per concept so that input layers and derived output are
 * never confused, and no ramp relies on a red/green contrast:
 *   heat = yellow→red · vegetation = green · built-up = grey · vulnerability = blue
 *   priority (derived output) = purple
 */
export type RampId = 'heat' | 'green' | 'built' | 'vuln' | 'priority' | 'resid';

const STOPS: Record<RampId, string[]> = {
  heat: ['#ffffb2', '#fecc5c', '#fd8d3c', '#e31a1c', '#800026'],
  green: ['#edf8e9', '#bae4b3', '#74c476', '#238b45', '#00441b'],
  built: ['#f7f7f7', '#d0d0d0', '#969696', '#525252', '#1a1a1a'],
  vuln: ['#eff3ff', '#bdd7e7', '#6baed6', '#2171b5', '#08306b'],
  priority: ['#f2f0f7', '#cbc9e2', '#9e9ac8', '#756bb1', '#3f007d'],
  // diverging (colour-blind safe purple–orange): negative → positive residual
  resid: ['#542788', '#998ec3', '#f7f7f7', '#f1a340', '#b35806'],
};

/** Categorical colours for hot spot classes (hot / cold / not significant). */
export const CLUSTER_COLORS = { hot: 'rgb(179, 0, 38)', cold: 'rgb(49, 130, 189)', ns: 'rgb(235, 232, 226)' } as const;

type RGB = [number, number, number];
const hexToRgb = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;

/** t in [0,1] (clamped) → css colour string. */
export function rampColor(ramp: RampId, t: number): string {
  const stops = STOPS[ramp].map(hexToRgb);
  const x = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  const [r, g, b] = stops[i].map((v, k) => Math.round(v + (stops[i + 1][k] - v) * f));
  return `rgb(${r}, ${g}, ${b})`;
}

export function rampGradient(ramp: RampId): string {
  return `linear-gradient(to right, ${STOPS[ramp].join(', ')})`;
}

/** Black or white text, whichever contrasts better with the given rgb() fill. */
export function textOn(rgb: string): string {
  const [r, g, b] = (rgb.match(/\d+/g) ?? ['0', '0', '0']).map(Number).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.3 ? '#1b1b1b' : '#ffffff';
}
