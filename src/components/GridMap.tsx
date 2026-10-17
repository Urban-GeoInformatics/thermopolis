import { useCallback } from 'react';
import { CELLS, GRID_SIZE, cellLabel, type Cell } from '../data/neighborhood';
import { rampColor, textOn, type RampId } from './colors';

export interface GridMapProps {
  /** Value shown by each cell, indexed by cell id. */
  values: readonly number[];
  min: number;
  max: number;
  ramp: RampId;
  /** Digits of the value in a cell's accessible name (0 for %, 1 for indices). */
  decimals: number;
  /** Accessible description, e.g. "Temperature map". */
  title: string;
  selectedId?: number | null;
  onSelect?: (id: number | null) => void;
  /** Cells to outline strongly (e.g. top-priority cells). */
  outlined?: readonly number[];
  /** Cells to mark quietly with a thin dashed outline (secondary information such as outliers). */
  softOutlined?: readonly number[];
  /** Small thumbnail: no labels, not interactive. */
  compact?: boolean;
  /** Override the ramp: explicit fill per cell id (for categorical maps). */
  fills?: readonly string[];
  /** Text printed in each cell, by cell id ('' for none). Cells show colour only unless labels are given. */
  labels?: readonly string[];
  /** Cells marked by the student (blue, numbered in order). */
  marked?: readonly number[];
  /** Animate colour changes as a ripple from the highest-value cell, then fade the outlines in. */
  ripple?: boolean;
}

const CELL = 50;

/** SVG thematic grid map. All geometry is in viewBox units so it scales to any width. */
export function GridMap({ values, min, max, ramp, decimals, title, selectedId, onSelect, outlined, compact, fills, labels, marked, ripple, softOutlined }: GridMapProps) {
  const size = GRID_SIZE * CELL;
  const outlinedSet = new Set(outlined ?? []);
  const interactive = !compact && !!onSelect;

  const onKey = useCallback(
    (e: React.KeyboardEvent, cell: Cell) => {
      if (!onSelect) return;
      let { row, col } = cell;
      if (e.key === 'ArrowRight') col++;
      else if (e.key === 'ArrowLeft') col--;
      else if (e.key === 'ArrowDown') row++;
      else if (e.key === 'ArrowUp') row--;
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(selectedId === cell.id ? null : cell.id);
        return;
      } else return;
      e.preventDefault();
      row = Math.min(GRID_SIZE - 1, Math.max(0, row));
      col = Math.min(GRID_SIZE - 1, Math.max(0, col));
      const next = row * GRID_SIZE + col;
      onSelect(next);
      (e.currentTarget.parentElement?.querySelector(`[data-cell="${next}"]`) as SVGElement | null)?.focus();
    },
    [onSelect, selectedId],
  );

  const focusable = selectedId ?? 0;
  // Ripple origin: the cell with the highest value; delay grows with distance from it.
  const origin = values.indexOf(Math.max(...values));
  const delayOf = (row: number, col: number) =>
    `${Math.round(Math.hypot(row - Math.floor(origin / GRID_SIZE), col - (origin % GRID_SIZE)) * 55)}ms`;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={(compact ? 'map map-compact' : 'map') + (ripple ? ' ripple' : '')}
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{title}</title>
      <g>
        {CELLS.map((cell) => {
          const v = values[cell.id];
          const fill = fills ? fills[cell.id] : rampColor(ramp, (v - min) / (max - min));
          const text = labels ? labels[cell.id] : '';
          const x = cell.col * CELL;
          const y = cell.row * CELL;
          const isSel = selectedId === cell.id;
          return (
            <g
              key={cell.id}
              data-cell={cell.id}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? (cell.id === focusable ? 0 : -1) : undefined}
              aria-label={interactive ? `Cell ${cellLabel(cell)}: ${text || v.toFixed(decimals)}` : undefined}
              aria-pressed={interactive ? isSel : undefined}
              onClick={interactive ? () => onSelect!(isSel ? null : cell.id) : undefined}
              onKeyDown={interactive ? (e) => onKey(e, cell) : undefined}
              className={interactive ? 'cell cell-interactive' : 'cell'}
            >
              <rect x={x} y={y} width={CELL} height={CELL} fill={fill} stroke="#fff" strokeWidth={compact ? 1 : 1.5}
                style={ripple ? ({ fill, '--d': delayOf(cell.row, cell.col) } as React.CSSProperties) : undefined} />
              {!compact && text !== '' && (
                <text x={x + CELL / 2} y={y + CELL / 2 + 4.5} textAnchor="middle" fill={textOn(fill)} className="cell-value">
                  {text}
                </text>
              )}
            </g>
          );
        })}
        {/* Overlays are drawn after the fills so outlines are never covered by neighbours. */}
        {CELLS.filter((c) => outlinedSet.has(c.id)).map((c) => (
          <rect key={`o${c.id}`} x={c.col * CELL + 2} y={c.row * CELL + 2} width={CELL - 4} height={CELL - 4}
            fill="none" stroke="#111" strokeWidth={compact ? 3.5 : 3} pointerEvents="none" className="outline-pop" />
        ))}
        {(marked ?? []).map((id, k) => {
          const cx = (id % GRID_SIZE) * CELL, cy = Math.floor(id / GRID_SIZE) * CELL;
          return (
            <g key={`m${id}`} pointerEvents="none">
              <rect x={cx + 1} y={cy + 1} width={CELL - 2} height={CELL - 2} fill="none" stroke="#2563eb" strokeWidth={compact ? 4 : 4.5} />
              {!compact && (<><circle cx={cx + 11} cy={cy + 11} r={9} fill="#2563eb" /><text x={cx + 11} y={cy + 15} textAnchor="middle" fill="#fff" className="mark-n">{k + 1}</text></>)}
            </g>
          );
        })}
        {(softOutlined ?? []).map((id) => (
          <rect key={`s${id}`} className="outline-soft" x={(id % GRID_SIZE) * CELL + 5} y={Math.floor(id / GRID_SIZE) * CELL + 5} width={CELL - 10} height={CELL - 10}
            fill="none" stroke="#333" strokeWidth={compact ? 2.5 : 1.6} strokeDasharray={compact ? '4 3' : '3.5 3'} pointerEvents="none" />
        ))}
        {selectedId != null && !compact && (
          <rect x={(selectedId % GRID_SIZE) * CELL + 1} y={Math.floor(selectedId / GRID_SIZE) * CELL + 1}
            width={CELL - 2} height={CELL - 2} fill="none" stroke="#2563eb" strokeWidth={4} pointerEvents="none" />
        )}
      </g>
    </svg>
  );
}
