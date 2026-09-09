import { SURVEY_STEP_IDS } from '../../domain/chronotype/steps';

export interface CountRow {
  label: string;
  count: number;
}

export interface DailyPoint {
  day: string;
  started: number;
  completed: number;
}

function stepLabel(step: number): string {
  const id = SURVEY_STEP_IDS[step];
  if (!id) return `Step ${String(step).padStart(2, '0')}`;
  return id.replace(/([A-Z])/g, ' $1').replace(/^./, (ch) => ch.toUpperCase());
}

export function dropOffRows(rows: Array<{ step: number; count: number }>): CountRow[] {
  return rows.map((row) => ({ label: stepLabel(row.step), count: row.count }));
}

export function LineChart({
  series,
  aLabel,
  bLabel,
}: {
  series: DailyPoint[];
  aLabel: string;
  bLabel: string;
}) {
  if (!series.length) return null;
  const width = 640;
  const height = 168;
  const pad = { top: 12, right: 8, bottom: 28, left: 8 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...series.flatMap((point) => [point.started, point.completed]), 1);

  function x(index: number): number {
    if (series.length === 1) return pad.left + innerW / 2;
    return pad.left + (index / (series.length - 1)) * innerW;
  }

  function y(value: number): number {
    return pad.top + innerH - (value / max) * innerH;
  }

  function d(key: 'started' | 'completed'): string {
    return series
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)} ${y(point[key]).toFixed(1)}`)
      .join(' ');
  }

  const ticks = series.filter((_, index) => index === 0 || index === series.length - 1 || index % 3 === 0);
  const last = series.length - 1;
  const completedArea = `${d('completed')} L${x(last).toFixed(1)} ${y(0).toFixed(1)} L${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`;

  return (
    <div className="admin-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${aLabel} and ${bLabel} over 14 days`}>
        <line x1={pad.left} y1={y(0)} x2={width - pad.right} y2={y(0)} stroke="rgba(16,37,57,0.12)" />
        <path d={completedArea} fill="rgba(190,225,227,0.42)" />
        <path d={d('started')} fill="none" stroke="rgba(16,37,57,0.28)" strokeWidth="2" />
        <path d={d('completed')} fill="none" stroke="#102539" strokeWidth="2.4" />
        {ticks.map((point) => (
          <text
            key={point.day}
            x={x(series.indexOf(point))}
            y={height - 8}
            textAnchor="middle"
            fill="rgba(16,37,57,0.45)"
            fontSize="11"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            {point.day.slice(5)}
          </text>
        ))}
      </svg>
      <p className="admin-chart-key">
        <span className="is-muted">{aLabel}</span>
        <span>{bLabel}</span>
      </p>
    </div>
  );
}

export function BarList({ rows }: { rows: CountRow[] }) {
  const max = Math.max(...rows.map((row) => row.count), 0);
  if (!rows.length || max === 0) {
    return <p className="admin-empty">No data yet.</p>;
  }

  return (
    <ul className="admin-bars">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="admin-bars-meta">
            <span>{row.label}</span>
            <span className="tabular-nums">{row.count}</span>
          </div>
          <span className="admin-bars-track" aria-hidden="true">
            <span style={{ width: `${(row.count / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}
