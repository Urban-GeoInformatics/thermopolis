import { TOOLS, TRY_LINE, type Mode, type ToolId } from '../content';
import { Segmented } from './Segmented';

interface Props {
  mode: Mode;
  headingId: string;
  question: string;
  tool: ToolId;
  setTool: (t: ToolId) => void;
  /** Optional one-line note under the instruction (e.g. a definition). */
  note?: string;
  /** Optional small control under the tool buttons (e.g. which variable, which scenario). */
  sub?: React.ReactNode;
  /** The picture: map or chart. */
  visual: React.ReactNode;
  /** One or two computed sentences about what is on screen. */
  result: React.ReactNode;
  /** Button to the next phase; omitted on the last phase. */
  nextLabel?: string;
  onNext?: () => void;
}

/** Common screen: one question, a few quick analysis tools, one picture, one result line. */
export function ToolFrame({ mode, headingId, question, tool, setTool, note, sub, visual, result, nextLabel, onNext }: Props) {
  const tools = TOOLS[mode];
  const current = tools.find((t) => t.id === tool) ?? tools[0];
  return (
    <section className="mode" aria-labelledby={headingId}>
      <div className="col-info-top">
        <h2 id={headingId} className="question">{question}</h2>
        <p className="tryline">{TRY_LINE}</p>
        {note && <p className="trynote">{note}</p>}
        {current.group !== current.label && <p className="toolgroup">{current.group}</p>}
        <Segmented label="Analysis tool" value={tool} onChange={setTool} variant="tools"
          options={tools.map((t) => ({ value: t.id, label: t.label }))} />
        {sub}
      </div>
      <div className="col-map">{visual}</div>
      <div className="col-info">
        <div className="result" aria-live="polite">{result}</div>
        {nextLabel && onNext && <button className="btn btn-primary" onClick={onNext}>{nextLabel}</button>}
      </div>
    </section>
  );
}
