import { useState } from 'react';

interface TimePickerProps {
  hour: string;
  minute: string;
  onHourChange: (value: string) => void;
  onMinuteChange: (value: string) => void;
  defaultPeriod?: 'AM' | 'PM';
  labelledBy?: string;
  disabled?: boolean;
  incomplete?: boolean;
}

function to12Hour(hour24: string): { hour12: string; period: 'AM' | 'PM' } {
  const h = parseInt(hour24, 10);
  if (h === 0) return { hour12: '12', period: 'AM' };
  if (h < 12) return { hour12: h.toString(), period: 'AM' };
  if (h === 12) return { hour12: '12', period: 'PM' };
  return { hour12: (h - 12).toString(), period: 'PM' };
}

function to24Hour(hour12: string, period: 'AM' | 'PM'): string {
  const h = parseInt(hour12, 10);
  if (period === 'AM') {
    if (h === 12) return '00';
    return h.toString().padStart(2, '0');
  }
  if (h === 12) return '12';
  return (h + 12).toString().padStart(2, '0');
}

function parseHour(raw: string): number | null {
  if (!raw) return null;
  const value = parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 1 || value > 12) return null;
  return value;
}

function parseMinute(raw: string): number | null {
  if (!raw) return null;
  const value = parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 0 || value > 59) return null;
  return value;
}

function digitsOnly(raw: string, maxLength: number) {
  return raw.replace(/\D/g, '').slice(0, maxLength);
}

function PeriodChevron() {
  return (
    <svg className="time-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.25 4.25L6 8L9.75 4.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TimePicker({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  defaultPeriod = 'AM',
  labelledBy,
  disabled = false,
  incomplete = false,
}: TimePickerProps) {
  const parsed = hour ? to12Hour(hour) : { hour12: '', period: defaultPeriod };
  const [hourEditing, setHourEditing] = useState<string | null>(null);
  const [minuteEditing, setMinuteEditing] = useState<string | null>(null);
  const [emptyPeriod, setEmptyPeriod] = useState<'AM' | 'PM'>(defaultPeriod);

  const hourText = hourEditing ?? parsed.hour12;
  const minuteText = minuteEditing ?? (hour ? minute || '00' : '');
  const period = hour ? parsed.period : emptyPeriod;

  function applyHour(raw: string, nextPeriod: 'AM' | 'PM') {
    const value = parseHour(raw);
    if (value === null) {
      onHourChange('');
      return;
    }
    onHourChange(to24Hour(String(value), nextPeriod));
    if (!minute) onMinuteChange('00');
  }

  function onHourInput(raw: string) {
    const next = digitsOnly(raw, 2);
    setHourEditing(next);
    if (!next) {
      onHourChange('');
      return;
    }
    applyHour(next, period);
  }

  function onMinuteInput(raw: string) {
    const next = digitsOnly(raw, 2);
    setMinuteEditing(next);
    if (!next) {
      onMinuteChange('');
      return;
    }
    if (next.length === 2 || (next.length === 1 && parseInt(next, 10) > 5)) {
      const value = parseMinute(next);
      if (value !== null) onMinuteChange(value.toString().padStart(2, '0'));
    }
  }

  function onPeriodChange(next: 'AM' | 'PM') {
    if (!hour) setEmptyPeriod(next);
    const value = parseHour(hourText);
    if (value === null) return;
    onHourChange(to24Hour(String(value), next));
  }

  const wellClass = [
    'time-well mt-2',
    disabled ? 'is-disabled' : '',
    incomplete && !disabled ? 'is-incomplete' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wellClass} role="group" aria-labelledby={labelledBy} aria-disabled={disabled || undefined}>
      <label className={`time-cell ${hourText ? '' : 'is-empty'}`}>
        <span className="sr-only">Hour</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          placeholder="Hr"
          autoComplete="off"
          disabled={disabled}
          value={hourText}
          onChange={(event) => onHourInput(event.target.value)}
          onFocus={(event) => {
            setHourEditing(hourText);
            event.currentTarget.select();
          }}
          onBlur={() => {
            applyHour(hourText, period);
            setHourEditing(null);
          }}
          aria-invalid={incomplete && !disabled ? true : undefined}
        />
      </label>
      <span className="time-colon">:</span>
      <label className={`time-cell ${hour && minuteText ? '' : 'is-empty'}`}>
        <span className="sr-only">Minutes</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          placeholder="Min"
          autoComplete="off"
          disabled={disabled}
          value={minuteText}
          onChange={(event) => onMinuteInput(event.target.value)}
          onFocus={(event) => {
            setMinuteEditing(minuteText);
            event.currentTarget.select();
          }}
          onBlur={() => {
            const value = parseMinute(minuteText);
            if (value === null) {
              if (hour && !minute) onMinuteChange('00');
            } else {
              onMinuteChange(value.toString().padStart(2, '0'));
            }
            setMinuteEditing(null);
          }}
          aria-invalid={incomplete && !disabled ? true : undefined}
        />
      </label>
      <label className="time-cell time-cell-period">
        <span className="sr-only">AM or PM</span>
        <select
          className="time-period"
          disabled={disabled}
          value={period}
          onChange={(event) => onPeriodChange(event.target.value as 'AM' | 'PM')}
        >
          <option value="AM" className="text-black">
            AM
          </option>
          <option value="PM" className="text-black">
            PM
          </option>
        </select>
        <PeriodChevron />
      </label>
    </div>
  );
}
