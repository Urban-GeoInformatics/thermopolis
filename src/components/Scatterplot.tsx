import type { RelationshipResult } from '../analytics/report';
import { CELLS, VARIABLES } from '../data/neighborhood';

interface Props {
  rel: RelationshipResult;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  /** Smaller, non-interactive version. */
  compact?: boolean;
}

const W = 340;
const H = 270;
const M = { l: 40, r: 12, t: 12, b: 44 };

export function Scatterplot({ rel, selectedId, onSelect, compact }: Props) {
  const xMeta = VARIABLES[rel.variable];
  const yMeta = VARIABLES.heat;
  const sx = (v: number) => M.l + ((v - xMeta.min) / (xMeta.max - xMeta.min)) * (W - M.l - M.r);
  const sy = (v: number) => H - M.b - ((v - yMeta.min) / (yMeta.max - yMeta.min)) * (H - M.b - M.t);
  const { slope, intercept } = rel.regression;
  const x0 = xMeta.min, x1 = xMeta.max;
  const xTicks = [0, 25, 50, 75, 100];
  const yTicks = [20, 24, 28, 32, 36, 40];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="scatter" role="img"
      aria-label={`Scatterplot of temperature against ${xMeta.label}, r = ${rel.r.toFixed(2)}`}>
      {yTicks.map((t) => (
        <g key={`y${t}`} className="tick">
          <line x1={M.l} x2={W - M.r} y1={sy(t)} y2={sy(t)} className="grid-line" />
          <text x={M.l - 6} y={sy(t) + 4} textAnchor="end">{t}</text>
        </g>
      ))}
      {xTicks.map((t) => (
        <g key={`x${t}`} className="tick">
          <line x1={sx(t)} x2={sx(t)} y1={M.t} y2={H - M.b} className="grid-line" />
          <text x={sx(t)} y={H - M.b + 15} textAnchor="middle">{t}</text>
        </g>
      ))}
      <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} className="axis-line" />
      <line x1={M.l} x2={M.l} y1={M.t} y2={H - M.b} className="axis-line" />
      <text x={(M.l + W - M.r) / 2} y={H - 8} textAnchor="middle" className="axis-title">{xMeta.label} ({xMeta.unit})</text>
      <text transform={`translate(11 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" className="axis-title">Surface temperature (°C)</text>

      {CELLS.map((c) => {
        const isSel = c.id === selectedId;
        return (
          <g key={c.id} onClick={compact ? undefined : () => onSelect(isSel ? null : c.id)} className={compact ? undefined : 'pt'}>
            {!compact && <circle cx={sx(c[rel.variable])} cy={sy(c.heat)} r={9} fill="transparent" />}
            <circle cx={sx(c[rel.variable])} cy={sy(c.heat)} r={isSel ? 6.5 : 4}
              className={isSel ? 'dot dot-sel' : 'dot'}>
              <title>{`${xMeta.label} ${c[rel.variable]}, temperature ${c.heat.toFixed(1)} °C`}</title>
            </circle>
          </g>
        );
      })}
      <line x1={sx(x0)} y1={sy(intercept + slope * x0)} x2={sx(x1)} y2={sy(intercept + slope * x1)} className="fit-line" />
    </svg>
  );
}
