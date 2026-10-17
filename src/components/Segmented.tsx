interface Props<T extends string> {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; sub?: string }[];
  /** 'tools' = pill chips for analysis tools; 'switch' = joined toggle bar for a setting. */
  variant?: 'tools' | 'switch';
}

/** Large, tappable single-choice control. Tools and settings look different on purpose, so neither is mistaken for the tabs. */
export function Segmented<T extends string>({ label, value, onChange, options, variant = 'switch' }: Props<T>) {
  return (
    <div className={variant === 'tools' ? 'seg-tools' : 'seg-switch'} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value}
          className={(variant === 'tools' ? 'seg-tool' : 'seg') + (o.value === value ? ' seg-on' : '')} onClick={() => onChange(o.value)}>
          <span className="seg-label">{o.label}</span>
          {o.sub && <span className="seg-sub">{o.sub}</span>}
        </button>
      ))}
    </div>
  );
}
