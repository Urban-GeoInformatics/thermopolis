import { CELLS, VARIABLES, fmtTemp } from '../data/neighborhood';
import { hotspots, temperatureSummary, type ExplanatoryKey } from '../analytics/report';
import type { ToolId } from '../content';
import { GridMap } from './GridMap';
import { CategoryLegend, Legend } from './Legend';
import { Segmented } from './Segmented';
import { ToolFrame } from './ToolFrame';
import { CLUSTER_COLORS } from './colors';

interface Props {
  tool: ToolId;
  setTool: (t: ToolId) => void;
  variable: ExplanatoryKey;
  setVariable: (v: ExplanatoryKey) => void;
  onNext: () => void;
}

export function ModeExplore({ tool, setTool, variable, setVariable, onNext }: Props) {
  const meta = VARIABLES[variable];
  const heat = CELLS.map((c) => c.heat);

  let visual: React.ReactNode;
  let result: React.ReactNode;
  if (tool === 'compare') {
    visual = (
      <div className="pair-maps">
        <figure>
          <GridMap values={heat} min={VARIABLES.heat.min} max={VARIABLES.heat.max} ramp="heat" decimals={1} title="Temperature map" compact />
          <Legend ramp="heat" min={VARIABLES.heat.min} max={VARIABLES.heat.max} label="Temperature" unit="°C" />
        </figure>
        <figure>
          <GridMap values={CELLS.map((c) => c[variable])} min={meta.min} max={meta.max} ramp={meta.ramp} decimals={0} title={`${meta.label} map`} compact />
          <Legend ramp={meta.ramp} min={meta.min} max={meta.max} label={meta.label.split(' ')[0]} unit="%" />
        </figure>
      </div>
    );
    result = <p className="result-line">Do the two patterns match?</p>;
  } else if (tool === 'hotAreas') {
    const hs = hotspots();
    visual = (
      <>
        <GridMap values={heat} min={VARIABLES.heat.min} max={VARIABLES.heat.max} ramp="heat" decimals={1} title="Hot spot map" fills={hs.cls.map((c) => CLUSTER_COLORS[c])}
          labels={hs.cls.map((c, id) => (c === 'ns' ? '' : heat[id].toFixed(0)))} ripple />
        <CategoryLegend title="Hot and cold spots"
          items={[{ color: CLUSTER_COLORS.hot, label: 'Hot spot' }, { color: CLUSTER_COLORS.cold, label: 'Cold spot' }, { color: CLUSTER_COLORS.ns, label: 'Not significant' }]}
          note="Numbers show surface temperature (°C)." />
      </>
    );
    result = null;
  } else {
    const sum = temperatureSummary();
    visual = (
      <>
        <GridMap values={heat} min={VARIABLES.heat.min} max={VARIABLES.heat.max} ramp="heat" decimals={1} title="Temperature map" ripple />
        <Legend ramp="heat" min={VARIABLES.heat.min} max={VARIABLES.heat.max} label={VARIABLES.heat.label} unit={VARIABLES.heat.unit} lowLabel="cool" highLabel="hot" />
      </>
    );
    result = <p className="result-line">Hottest cell: <b>{fmtTemp(sum.max)}</b>. Coolest cell: <b>{fmtTemp(sum.min)}</b>. Median {fmtTemp(sum.median)}, mean {fmtTemp(sum.mean)}.</p>;
  }

  return (
    <ToolFrame mode="explore" headingId="q-explore" question="Where is the heat concentrated?" tool={tool} setTool={setTool}
      sub={tool === 'compare' ? (
        <Segmented label="Landscape feature" value={variable} onChange={setVariable}
          options={[{ value: 'vegetation', label: 'Vegetation', sub: 'feature' }, { value: 'builtUp', label: 'Built-up', sub: 'feature' }]} />
      ) : undefined}
      visual={visual} result={result} nextLabel="Next: EXPLAIN →" onNext={onNext} />
  );
}
