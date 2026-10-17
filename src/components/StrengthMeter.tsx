import { fmtR } from '../analytics/report';
import { describeStrength } from '../analytics/stats';

/** A −1 … +1 scale with a marker: how strongly, and in which direction, two things go together. */
export function StrengthMeter({ r }: { r: number }) {
  const x = ((r + 1) / 2) * 100;
  return (
    <div className="meter" role="img" aria-label={`Correlation r = ${r.toFixed(2)}, ${describeStrength(r)}`}>
      <div className="meter-head"><span className="stat-k">Correlation (r)</span><b className="meter-value">{fmtR(r)}</b><span className="meter-word">{describeStrength(r)}</span></div>
      <div className="meter-bar"><span className="meter-mid" /><span className="meter-dot" style={{ left: `${x}%` }} /></div>
      <div className="meter-ends"><span>−1<br />opposite</span><span>0<br />no relationship</span><span>+1<br />move together</span></div>
    </div>
  );
}
