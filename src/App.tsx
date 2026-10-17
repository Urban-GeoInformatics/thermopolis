import { useCallback, useEffect, useState } from 'react';
import { DATA_NOTE } from './data/neighborhood';
import { MODES, TOOLS, type Mode, type ToolId } from './content';
import { ModeExplore } from './components/ModeExplore';
import { ModeExplain } from './components/ModeExplain';
import { ModePredict } from './components/ModePredict';
import type { ExplanatoryKey } from './analytics/report';

type View = Mode;
const VIEWS: View[] = ['explore', 'explain', 'predict'];

function viewFromHash(): View {
  const h = window.location.hash.replace(/^#\/?/, '') as View;
  return VIEWS.includes(h) ? h : 'explore';
}

const START_WEIGHT = 0.8; // temperature-focused scenario first
const startTools = (): Record<Mode, ToolId> => ({ explore: TOOLS.explore[0].id, explain: TOOLS.explain[0].id, predict: TOOLS.predict[0].id });

export default function App() {
  const [view, setView] = useState<View>(viewFromHash);
  const [visited, setVisited] = useState<Set<View>>(() => new Set([viewFromHash()]));
  // Selections live here so students can switch tabs and return without losing state.
  const [tools, setTools] = useState<Record<Mode, ToolId>>(startTools);
  const [variable, setVariable] = useState<ExplanatoryKey>('vegetation');
  const [heatWeight, setHeatWeight] = useState(START_WEIGHT);

  useEffect(() => {
    const onHash = () => { const v = viewFromHash(); setView(v); setVisited((s) => new Set(s).add(v)); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const goTo = useCallback((v: View) => {
    window.location.hash = `/${v}`;
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>Analyzing urban heat in Thermopolis</h1>
        </div>
        <nav className="tabs" role="tablist" aria-label="Analytical lens">
          {MODES.map((m, i) => {
            const on = view === m.id;
            const done = visited.has(m.id) && !on;
            return (
              <button key={m.id} role="tab" aria-selected={on} className={'tab' + (on ? ' tab-on' : '') + (done ? ' tab-done' : '')}
                onClick={() => goTo(m.id)}>
                <span className="tab-n" aria-hidden="true">{done ? '✓' : i + 1}</span>
                <span className="tab-l">{m.label}</span>
                <span className="tab-q">{m.id === 'explore' ? 'Describe' : m.id === 'explain' ? 'Relate' : 'Plan'}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main>
        {view === 'explore' && <ModeExplore tool={tools.explore} setTool={(t) => setTools((s) => ({ ...s, explore: t }))} variable={variable} setVariable={setVariable} onNext={() => goTo('explain')} />}
        {view === 'explain' && <ModeExplain tool={tools.explain} setTool={(t) => setTools((s) => ({ ...s, explain: t }))} variable={variable} setVariable={setVariable} onNext={() => goTo('predict')} />}
        {view === 'predict' && <ModePredict tool={tools.predict} setTool={(t) => setTools((s) => ({ ...s, predict: t }))} heatWeight={heatWeight} setHeatWeight={setHeatWeight} />}
      </main>

      <footer className="footer">
        <p>{DATA_NOTE}</p>
      </footer>
    </div>
  );
}
