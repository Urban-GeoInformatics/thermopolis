/**
 * The fictional city of Thermopolis as an 8 × 8 grid of 64 cells. FICTIONAL and ILLUSTRATIVE.
 *
 * Frozen, deterministic data (no randomness at runtime).
 *
 * Layout (row 0 = north, col 0 = west):
 *   - dense commercial core, centre          → very high built-up, hottest cells
 *   - park, north-east                       → high vegetation, coolest
 *   - river corridor / woods, south-west     → high vegetation, cool
 *   - paved logistics lot, south-east        → high built-up, hot, LOW vulnerability
 *   - older residential area, west/north-west→ moderate heat, HIGH vulnerability
 *
 * Variables
 *   heat           illustrative afternoon LAND SURFACE temperature in °C, as a satellite would see it
 *                  (synthetic; about 21–38 °C, a realistic spread between vegetated and paved surfaces).
 *                  Stored as 20 + 2 × the 0–10 design index, so one index point = 2 °C.
 *   vegetation     green / vegetated surface cover, 0–100 %
 *   builtUp        relative built-up / impervious intensity, 0–100 %
 *   vulnerability  illustrative share of residents aged 65+ (%), a common proxy for heat vulnerability (about 6–28 %).
 *                  Stored as 5 + 3 × the 0–10 design index. Age is only one proxy: income, health and access to cooling matter too.
 */

export interface Cell {
  id: number;
  row: number;
  col: number;
  heat: number;
  vegetation: number;
  builtUp: number;
  vulnerability: number;
}

export const GRID_SIZE = 8;

// [temperature °C, vegetation %, built-up %, vulnerability = % of residents aged 65+] in row-major order
const RAW: ReadonlyArray<readonly [number, number, number, number]> = [
  [29.8, 5, 27, 24.2],
  [31.2, 7, 40, 23.6],
  [33.2, 8, 31, 17.0],
  [31.8, 29, 25, 12.8],
  [28.0, 36, 24, 9.5],
  [26.6, 66, 18, 8.0],
  [27.4, 88, 8, 8.3],
  [26.8, 62, 17, 9.8],
  [31.2, 5, 54, 27.5],
  [32.6, 10, 63, 28.4],
  [33.4, 3, 66, 21.5],
  [35.8, 12, 50, 17.0],
  [33.6, 48, 29, 11.3],
  [29.2, 81, 18, 8.6],
  [29.6, 90, 15, 10.7],
  [27.8, 73, 20, 7.7],
  [30.8, 29, 61, 26.3],
  [31.8, 21, 79, 25.1],
  [34.4, 3, 85, 23.6],
  [35.0, 5, 71, 16.1],
  [35.6, 32, 62, 14.6],
  [33.2, 55, 42, 8.9], // F3: hand-adjusted +0.2 °C (was 33.0) so the 16 hottest cells have no tie at the boundary
  [29.2, 71, 22, 8.6],
  [27.0, 50, 14, 6.5],
  [31.6, 24, 49, 23.0],
  [30.8, 28, 72, 22.1],
  [34.8, 3, 94, 22.7],
  [36.4, 3, 95, 20.6],
  [37.6, 3, 82, 17.3],
  [33.8, 14, 53, 9.8],
  [32.8, 24, 36, 11.6],
  [31.6, 19, 35, 9.2],
  [28.4, 36, 32, 17.3],
  [31.4, 19, 57, 22.7],
  [30.0, 13, 75, 21.2],
  [34.8, 3, 92, 18.5],
  [33.0, 4, 76, 12.8],
  [35.4, 8, 74, 10.1],
  [34.6, 3, 72, 10.4],
  [30.8, 9, 53, 10.4],
  [25.4, 37, 24, 20.9],
  [26.2, 40, 36, 21.5],
  [29.0, 35, 52, 22.1],
  [33.0, 10, 73, 19.7],
  [31.6, 6, 70, 13.1],
  [30.8, 6, 71, 10.1],
  [32.4, 3, 93, 11.3],
  [35.0, 3, 87, 11.6],
  [24.2, 55, 21, 16.1],
  [24.6, 76, 17, 17.0],
  [24.4, 63, 33, 17.0],
  [27.0, 42, 41, 20.0],
  [31.8, 20, 49, 16.4],
  [31.2, 5, 68, 11.3],
  [32.2, 3, 93, 8.0],
  [32.6, 3, 90, 9.8],
  [23.8, 73, 8, 10.4],
  [21.4, 80, 11, 11.9],
  [26.4, 69, 12, 14.6],
  [26.0, 54, 15, 18.8],
  [31.0, 21, 32, 17.3],
  [30.8, 14, 55, 11.9],
  [30.8, 3, 71, 9.8],
  [31.6, 3, 69, 11.3],
];

export const CELLS: readonly Cell[] = RAW.map(([heat, vegetation, builtUp, vulnerability], id) => ({
  id,
  row: Math.floor(id / GRID_SIZE),
  col: id % GRID_SIZE,
  heat,
  vegetation,
  builtUp,
  vulnerability,
}));

/** Human-readable cell label, e.g. "C4" (column letter + row number). */
export function cellLabel(cell: Pick<Cell, 'row' | 'col'>): string {
  return `${String.fromCharCode(65 + cell.col)}${cell.row + 1}`;
}

export type VariableKey = 'heat' | 'vegetation' | 'builtUp' | 'vulnerability';

export interface VariableMeta {
  key: VariableKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  /** Colour ramp id, see src/components/colors.ts */
  ramp: 'heat' | 'green' | 'built' | 'vuln';
  /** Short caption describing what the layer is. */
  description: string;
}

/** Fixed display ranges — legends never rescale to the data. */
export const VARIABLES: Record<VariableKey, VariableMeta> = {
  heat: { key: 'heat', label: 'Surface temperature', unit: '°C', min: 20, max: 40, ramp: 'heat', description: 'Illustrative land surface temperature, as a satellite sees it (synthetic, not measured)' },
  vegetation: { key: 'vegetation', label: 'Vegetation cover', unit: '% of cell', min: 0, max: 100, ramp: 'green', description: 'Green / vegetated surface cover' },
  builtUp: { key: 'builtUp', label: 'Built-up intensity', unit: '% of cell', min: 0, max: 100, ramp: 'built', description: 'Relative intensity of development / impervious surface' },
  vulnerability: { key: 'vulnerability', label: 'Vulnerability', unit: '% of residents aged 65+', min: 5, max: 35, ramp: 'vuln', description: 'Illustrative share of residents aged 65+, a proxy for vulnerability to heat' },
};

/** Format a temperature for display. */
export const fmtTemp = (t: number) => `${t.toFixed(1)} °C`;

/** The fictional city. */
export const CITY = 'Thermopolis';

/** One short line for the footer. */
export const DATA_NOTE = 'Thermopolis is fictional. All data are synthetic.';
