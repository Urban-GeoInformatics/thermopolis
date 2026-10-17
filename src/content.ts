/** All teaching copy in one place. */

/** The three phases of the framework in Fagerholm et al. (2021): Explore, Explain, Predict/Model. */
export type Mode = 'explore' | 'explain' | 'predict';

export const MODES: { id: Mode; label: string; question: string; method: string; minutes: number }[] = [
  { id: 'explore', label: 'EXPLORE', question: 'Where is the heat concentrated?', method: 'Descriptive spatial analysis', minutes: 1 },
  { id: 'explain', label: 'EXPLAIN', question: 'What is associated with the heat pattern?', method: 'Spatial relationship analysis', minutes: 2 },
  { id: 'predict', label: 'MODEL', question: 'Where might action be prioritized?', method: 'Multi-criteria analysis', minutes: 2 },
];

/** The quick analysis tools offered for each question. Each shows a different view; students discuss what each reveals. */
export type ToolId = 'heat' | 'compare' | 'hotAreas' | 'distance' | 'correlation' | 'residual' | 'heatOnly' | 'vulnOnly' | 'overlay';

export interface Tool {
  id: ToolId;
  label: string;
  /** Method group (never an individual technique). */
  group: string;
  short: string;
}

export const TOOLS: Record<Mode, Tool[]> = {
  explore: [
    { id: 'heat', label: 'Temperature map', group: 'Mapping & visualization', short: 'Mapping' },
    { id: 'compare', label: 'Side by side', group: 'Mapping & visualization', short: 'Mapping' },
    { id: 'hotAreas', label: 'Hot spots', group: 'Hot spot analysis', short: 'Hot spots' },
  ],
  explain: [
    { id: 'distance', label: 'Distance to green', group: 'Proximity analysis', short: 'Proximity' },
    { id: 'correlation', label: 'Correlation', group: 'Statistical association', short: 'Association' },
    { id: 'residual', label: 'Residuals', group: 'Spatial dependence', short: 'Spatial dependence' },
  ],
  predict: [
    { id: 'heatOnly', label: 'Temperature only', group: 'Multi-criteria analysis', short: 'Multi-criteria' },
    { id: 'vulnOnly', label: 'Vulnerability only', group: 'Multi-criteria analysis', short: 'Multi-criteria' },
    { id: 'overlay', label: 'Combine both', group: 'Multi-criteria analysis', short: 'Multi-criteria' },
  ],
};

export const TRY_LINE = 'Try each tool. What do they reveal?';
