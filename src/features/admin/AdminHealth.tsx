import type { AdminOverview } from '../../infra/api';

export type HealthLevel = 'loading' | 'running' | 'error';

export interface HealthReport {
  level: HealthLevel;
  title: string;
  checked: string;
}

function formatChecked(checkedAt: Date | null): string {
  if (!checkedAt) return 'Loading';
  return checkedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function operationsLabel(level: HealthLevel): string {
  switch (level) {
    case 'loading':
      return 'Loading';
    case 'running':
      return 'Running';
    case 'error':
      return 'Error';
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}

export function readHealth(
  overview: AdminOverview | null,
  recordsUp: boolean | null,
  checkedAt: Date | null,
): HealthReport {
  const checked = formatChecked(checkedAt);

  if (recordsUp === null) {
    return { level: 'loading', title: operationsLabel('loading'), checked };
  }

  if (!recordsUp || !overview) {
    return { level: 'error', title: operationsLabel('error'), checked };
  }

  return { level: 'running', title: operationsLabel('running'), checked };
}

export function AdminStatusStrip({ health }: { health: HealthReport }) {
  return (
    <header className={`admin-status-strip is-${health.level}`} aria-live="polite">
      <span>Operations {health.title}</span>
      <span>Last checked {health.checked}</span>
    </header>
  );
}

export function AdminRailHealth({ health }: { health: HealthReport }) {
  return (
    <p className={`admin-rail-health is-${health.level}`}>
      <span>{health.title}</span>
      <span>Last checked {health.checked}</span>
    </p>
  );
}
