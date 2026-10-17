import { VARIABLES } from '../data/neighborhood';
import { fmtR, landscapeMetrics, relationship, residualResult, type ExplanatoryKey } from '../analytics/report';
import type { ToolId } from '../content';
import { GridMap } from './GridMap';
import { Legend } from './Legend';
import { Scatterplot } from './Scatterplot';
import { Segmented } from './Segmented';
import { StrengthMeter } from './StrengthMeter';
import { ToolFrame } from './ToolFrame';

interface Props {
  tool: ToolId;
  setTool: (t: ToolId) => void;
  variable: ExplanatoryKey;
  setVariable: (v: ExplanatoryKey) => void;
  onNext: () => void;
}

const NOUN: Record<ExplanatoryKey, string> = { vegetation: 'vegetation', builtUp: 'built-up surface' };
const RES_MAX = 6; // °C

export function ModeExplain({ tool, setTool, variable, setVariable, onNext }: Props) {
  let visual: React.ReactNode;
  let result: React.ReactNode;

  if (tool === 'distance') {
    const lm = landscapeMetrics();
    visual = (
      <>
        <GridMap values={lm.distToGreen} min={0} max={5} ramp="built" decimals={1} title="Distance to green space map" />
        <Legend ramp="built" min={0} max={5} label="Distance to green" unit="cells" lowLabel="at green" highLabel="far" />
      </>
    );
    result = <p className="result-line">{lm.rDistHeat > 0 ? 'Farther from' : 'Closer to'} green tends to mean hotter (r = <b>{fmtR(lm.rDistHeat)}</b>).</p>;
  } else if (tool === 'correlation') {
    const rel = relationship(variable);
    const observed = rel.direction === 'negative' ? 'lower' : 'higher';
    visual = <Scatterplot rel={rel} selectedId={null} onSelect={() => {}} compact />;
    result = (
      <>
        <StrengthMeter r={rel.r} />
        <p className="result-line">More {NOUN[variable]} tends to mean <b>{observed}</b> temperatures. The correlation accounts for about <b>{Math.round(rel.regression.r2 * 100)}%</b> of the variation in temperature.</p>
      </>
    );
  } else {
    const meta = VARIABLES[variable];
    const res = residualResult(variable);
    visual = (
      <>
        <GridMap values={res.residuals} min={-RES_MAX} max={RES_MAX} ramp="resid" decimals={1} title={`Residual map: temperature minus what ${meta.label} predicts`} />
        <Legend ramp="resid" min={-RES_MAX} max={RES_MAX} label="Compared with the correlation" unit="°C" lowLabel="cooler" highLabel="hotter" />
      </>
    );
    result = (
      <p className="result-line">
        Orange cells are hotter than {NOUN[variable]} alone would suggest, purple cells cooler.{' '}
        {res.moran > 0.3 ? <>Similar residuals <b>cluster spatially</b>, so location matters too.</> : <>The residuals look fairly mixed.</>}
      </p>
    );
  }

  return (
    <ToolFrame mode="explain" headingId="q-explain" question="What is associated with the heat pattern?" tool={tool} setTool={setTool}
      sub={tool === 'correlation' || tool === 'residual' ? (
        <Segmented label="Landscape feature" value={variable} onChange={setVariable}
          options={[{ value: 'vegetation', label: 'Vegetation', sub: 'feature' }, { value: 'builtUp', label: 'Built-up', sub: 'feature' }]} />
      ) : undefined}
      visual={visual} result={result} nextLabel="Next: MODEL →" onNext={onNext} />
  );
}
