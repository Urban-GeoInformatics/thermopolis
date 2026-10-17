import { CELLS, VARIABLES } from '../data/neighborhood';
import { SCENARIOS, TOP_N } from '../analytics/priority';
import { scenarioResult, singleCriterionShared, singleCriterionTop } from '../analytics/report';
import type { ToolId } from '../content';
import { GridMap } from './GridMap';
import { Legend } from './Legend';
import { Segmented } from './Segmented';
import { ToolFrame } from './ToolFrame';

interface Props {
  tool: ToolId;
  setTool: (t: ToolId) => void;
  heatWeight: number;
  setHeatWeight: (w: number) => void;
}

const pct = (w: number) => Math.round(w * 100);

export function ModePredict({ tool, setTool, heatWeight, setHeatWeight }: Props) {
  const heatTop = singleCriterionTop('heat');
  const vulnTop = singleCriterionTop('vulnerability');
  const shared = singleCriterionShared();
  const preset = SCENARIOS.find((s) => Math.abs(s.heatWeight - heatWeight) < 1e-9) ?? SCENARIOS[1];
  const current = scenarioResult(preset);

  const outlineNote = 'Top 25% values';
  let visual: React.ReactNode;
  let result: React.ReactNode;
  if (tool === 'overlay') {
    visual = (
      <>
        <GridMap values={current.scores} min={0} max={10} ramp="priority" decimals={1}
          title={`Priority score map, temperature weight ${pct(heatWeight)}%`} outlined={current.top} />
        <Legend ramp="priority" min={0} max={10} label="Priority score" unit="higher = act sooner" outlineNote={outlineNote} />
      </>
    );
    result = <p className="formula">Priority = <b>{pct(heatWeight)}%</b> × Temperature + <b>{pct(1 - heatWeight)}%</b> × Vulnerability</p>;
  } else {
    const k = tool === 'heatOnly' ? 'heat' : 'vulnerability';
    const meta = VARIABLES[k];
    visual = (
      <>
        <GridMap values={CELLS.map((c) => c[k])} min={meta.min} max={meta.max} ramp={meta.ramp} decimals={k === 'heat' ? 1 : 0}
          title={`${meta.label} only map`} outlined={k === 'heat' ? heatTop : vulnTop} softOutlined={shared} />
        <Legend ramp={meta.ramp} min={meta.min} max={meta.max} label={meta.label} unit={meta.unit}
          outlineNote={k === 'heat' ? `Hottest quarter (${TOP_N} of 64 cells)` : `Most vulnerable quarter (${TOP_N} of 64 cells)`}
          softNote={k === 'heat' ? 'Also in the most vulnerable quarter' : 'Also in the hottest quarter'} />
      </>
    );
    result = <p className="result-line">Only <b>{shared.length}</b> of these {TOP_N} (dashed) are also in the {k === 'heat' ? 'most vulnerable' : 'hottest'} quarter.</p>;
  }

  return (
    <ToolFrame mode="predict" headingId="q-predict" question="Where might action be prioritized?" tool={tool} setTool={setTool}
      sub={tool === 'overlay' ? (
        <Segmented label="Weighting scenario" value={preset.id as string}
          onChange={(id) => { const s = SCENARIOS.find((x) => x.id === id); if (s) setHeatWeight(s.heatWeight); }}
          options={SCENARIOS.map((s) => ({ value: s.id as string, label: s.label, sub: `${s.id} · ${pct(s.heatWeight)}/${pct(1 - s.heatWeight)}` }))} />
      ) : undefined}
      visual={visual} result={result} />
  );
}
