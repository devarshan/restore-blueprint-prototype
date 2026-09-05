import { useState } from 'react';
import { formatPeakRange } from '../../domain/chronotype/clock';
import { CHRONOTYPE_INFO } from '../../domain/chronotype/constants';
import type { ChronotypeResult } from '../../domain/chronotype/types';
import { downloadSchedulePoster } from './downloadSchedule';
import { ScheduleClock } from './ScheduleClock';
import { Title } from './ui';

export function SchedulePanel({ result }: { result: ChronotypeResult }) {
  const info = CHRONOTYPE_INFO[result.chronotype];
  const [saving, setSaving] = useState(false);

  async function onDownload() {
    if (saving) return;
    setSaving(true);
    try {
      await downloadSchedulePoster(result);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="schedule-page">
      <Title className="schedule-title">{info.name} Schedule</Title>
      <p className="schedule-kicker">{info.description}</p>
      <div className="schedule-clock">
        <ScheduleClock result={result} />
      </div>
      <div className="schedule-meta">
        <div className="schedule-aside">
          <ul className="schedule-legend">
            <li>
              <span className="schedule-swatch schedule-swatch-peak" aria-hidden="true" />
              Peak
            </li>
            <li>
              <span className="schedule-swatch schedule-swatch-break" aria-hidden="true" />
              Break
            </li>
          </ul>
          <button type="button" className="schedule-save" onClick={() => void onDownload()} disabled={saving}>
            {saving ? 'Preparing' : 'Download schedule'}
          </button>
        </div>
        <div className="schedule-peaks">
          <p>{formatPeakRange(result.firstPeakStart, result.firstPeakEnd)}</p>
          <p>{formatPeakRange(result.secondPeakStart, result.secondPeakEnd)}</p>
        </div>
      </div>
    </div>
  );
}
