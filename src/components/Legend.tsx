import { rampGradient, type RampId } from './colors';

interface Props {
  ramp: RampId;
  min: number;
  max: number;
  label: string;
  unit: string;
  /** Extra legend entry for outlined cells. */
  outlineNote?: string;
  /** Extra legend entry for cells marked with a thin dashed outline. */
  softNote?: string;
  /** e.g. "Fixed scale — identical in every scenario" */
  note?: string;
  lowLabel?: string;
  highLabel?: string;
}

export function Legend({ ramp, min, max, label, unit, outlineNote, softNote, note, lowLabel = 'low', highLabel = 'high' }: Props) {
  const mid = (min + max) / 2;
  return (
    <div className="legend" aria-label={`Legend: ${label}, ${unit}`}>
      <div className="legend-title"><strong>{label}</strong> <span>({unit})</span></div>
      <div className="legend-bar" style={{ background: rampGradient(ramp) }} />
      <div className="legend-ticks"><span>{min} {lowLabel}</span><span>{mid}</span><span>{max} {highLabel}</span></div>
      {outlineNote && (
        <div className="legend-outline"><span className="legend-swatch" aria-hidden="true" /> {outlineNote}</div>
      )}
      {softNote && (
        <div className="legend-outline"><span className="legend-swatch legend-swatch-soft" aria-hidden="true" /> {softNote}</div>
      )}
      {note && <div className="legend-note">{note}</div>}
    </div>
  );
}

/** Legend for categorical maps (e.g. cluster classes). */
export function CategoryLegend({ title, items, outlineNote, softOutline, note }: { title: string; items: { color: string; label: string }[]; outlineNote?: string; softOutline?: boolean; note?: string }) {
  return (
    <div className="legend" aria-label={`Legend: ${title}`}>
      <div className="legend-title"><strong>{title}</strong></div>
      <ul className="cat-legend">
        {items.map((i) => (<li key={i.label}><span className="cat-swatch" style={{ background: i.color }} aria-hidden="true" />{i.label}</li>))}
      </ul>
      {outlineNote && <div className="legend-outline"><span className={softOutline ? 'legend-swatch legend-swatch-soft' : 'legend-swatch'} aria-hidden="true" /> {outlineNote}</div>}
      {note && <div className="legend-note">{note}</div>}
    </div>
  );
}
