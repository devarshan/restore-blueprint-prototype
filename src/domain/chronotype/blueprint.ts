import { CHRONOTYPE_WINDOWS } from "./constants";
import type { Chronotype } from "./types";

/** Minutes in a clock day. Peak math is half-open: a peak ending at 10:00 does not include 10:00. */
export const DAY_MINUTES = 24 * 60;

/** Figma note: a day runs 16 hours unless dayEnd overrides it. */
export const DEFAULT_DAY_MINUTES = 16 * 60;

/**
 * Figma note on page 90:20: the day starts one hour later per chronotype.
 * A custom dayStart overrides this. These are not the survey's natural wake times.
 */
export const CHRONOTYPE_DAY_START: Record<Chronotype, string> = {
  horizon: "06:00",
  apex: "07:00",
  aurora: "08:00",
};

export type EnergyPeakKind = "main" | "secondary";

export type HeatLevel = 0 | 1 | 2 | 3 | 4;

export interface EnergyPeakInput {
  start: string;
  end: string;
  kind: EnergyPeakKind;
}

export interface EnergyBlueprintInput {
  chronotype: Chronotype;
  dayStart?: string;
  dayEnd?: string;
  peaks?: EnergyPeakInput[];
}

export interface ResolvedPeak {
  kind: EnergyPeakKind;
  start: number;
  end: number;
  startLabel: string;
  endLabel: string;
  slices: PeakSlice[];
}

export interface PeakSlice {
  offset: number;
  length: number;
}

export interface BlueprintHourRow {
  hour: number;
  label: string;
  offset: number;
  span: number;
  shade: HeatLevel;
}

export interface EnergyBlueprintModel {
  chronotype: Chronotype;
  dayStart: number;
  duration: number;
  peaks: ResolvedPeak[];
  rows: BlueprintHourRow[];
  /** Offsets from day start, in minutes, where a real peak boundary is visible. */
  ticks: number[];
  sentence: string;
}

export function parseBlueprintTime(value: string): number | null {
  const trimmed = value.trim();
  const hourMinute = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (hourMinute) {
    const hour = Number(hourMinute[1]);
    const minute = Number(hourMinute[2]);
    if (hour > 23 || minute > 59) return null;
    return hour * 60 + minute;
  }

  const withMeridiem = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!withMeridiem) return null;
  const hourRaw = Number(withMeridiem[1]);
  const minute = Number(withMeridiem[2]);
  if (hourRaw < 1 || hourRaw > 12 || minute > 59) return null;
  let hour = hourRaw % 12;
  if (/pm/i.test(withMeridiem[3])) hour += 12;
  return hour * 60 + minute;
}

export function formatClockTime(minutes: number): string {
  const value = normalizeMinute(minutes);
  const hour24 = Math.floor(value / 60);
  const minute = value % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

export function formatHourLabel(hour: number): string {
  const hour24 = ((hour % 24) + 24) % 24;
  const suffix = hour24 >= 12 ? "pm" : "am";
  const hour12 = hour24 % 12 || 12;
  return `${hour12} ${suffix}`;
}

/** Delay until the next wall-clock minute. Used so the marker steps without a reload. */
export function nextMinuteDelay(nowMs: number): number {
  const remainder = ((nowMs % 60_000) + 60_000) % 60_000;
  return remainder === 0 ? 60_000 : 60_000 - remainder;
}

export function formatEnergyPeakSentence(peaks: ResolvedPeak[]): string {
  const visible = peaks
    .filter((peak) => peak.slices.length > 0)
    .sort((a, b) => a.slices[0].offset - b.slices[0].offset);
  const ranges = visible.map(
    (peak) => `${peak.startLabel} to ${peak.endLabel} (${peakKindPhrase(peak.kind)})`,
  );
  if (ranges.length === 0) return "No energy peaks fall in this day.";
  if (ranges.length === 1) return `Your energy peak today is ${ranges[0]}.`;
  if (ranges.length === 2) return `Your energy peaks today are ${ranges[0]} and ${ranges[1]}.`;
  const head = ranges.slice(0, -1).join(", ");
  return `Your energy peaks today are ${head}, and ${ranges[ranges.length - 1]}.`;
}

function peakKindPhrase(kind: EnergyPeakKind): string {
  switch (kind) {
    case "main":
      return "main peak";
    case "secondary":
      return "secondary peak";
    default: {
      const neverKind: never = kind;
      return neverKind;
    }
  }
}

/**
 * Hour shade for the whole clock day.
 * 4: peak covers 30 minutes or more of that hour (round up to the darkest mark).
 * 3: peak is present but under 30 minutes.
 * 2, 1, 0: one and two hours out, then quiet. The nearer peak wins.
 */
export function hourShades(peaks: Array<{ start: number; end: number }>): HeatLevel[] {
  const coverage = Array.from({ length: 24 }, (_, hour) => minutesInHour(hour, peaks));
  const base: Array<0 | 3 | 4> = coverage.map((minutes) => {
    if (minutes >= 30) return 4;
    if (minutes > 0) return 3;
    return 0;
  });

  return base.map((level, hour) => {
    if (level > 0) return level;
    let distance = 24;
    for (let other = 0; other < 24; other += 1) {
      if (base[other] < 3) continue;
      const delta = Math.abs(hour - other);
      const circular = Math.min(delta, 24 - delta);
      if (circular < distance) distance = circular;
    }
    if (distance <= 1) return 2;
    if (distance === 2) return 1;
    return 0;
  });
}

export function nowMarkerOffset(nowMinutes: number, dayStart: number, duration: number): number | null {
  if (duration <= 0) return null;
  const offset = (normalizeMinute(nowMinutes) - dayStart + DAY_MINUTES) % DAY_MINUTES;
  if (duration >= DAY_MINUTES) return offset;
  if (offset >= duration) return null;
  return offset;
}

export function resolveEnergyBlueprint(input: EnergyBlueprintInput): EnergyBlueprintModel {
  const chronotype = assertChronotype(input.chronotype);
  const fallbackStart = parseBlueprintTime(CHRONOTYPE_DAY_START[chronotype]) ?? 6 * 60;
  const dayStart = input.dayStart ? parseBlueprintTime(input.dayStart) ?? fallbackStart : fallbackStart;
  const duration = resolveDuration(dayStart, input.dayEnd);
  const peaks = resolvePeaks(chronotype, input.peaks, dayStart, duration);
  const shades = hourShades(peaks);
  const rows = buildHourRows(dayStart, duration, shades);
  const ticks = tickOffsets(peaks, dayStart, duration);

  return {
    chronotype,
    dayStart,
    duration,
    peaks,
    rows,
    ticks,
    sentence: formatEnergyPeakSentence(peaks),
  };
}

export function defaultEnergyPeaks(chronotype: Chronotype): EnergyPeakInput[] {
  const windows = CHRONOTYPE_WINDOWS[chronotype];
  switch (chronotype) {
    case "horizon":
    case "apex":
      return [
        { start: windows.firstPeakStart, end: windows.firstPeakEnd, kind: "main" },
        { start: windows.secondPeakStart, end: windows.secondPeakEnd, kind: "secondary" },
      ];
    case "aurora":
      // Email copy calls the evening window the main peak and the late morning the energy-building peak.
      return [
        { start: windows.secondPeakStart, end: windows.secondPeakEnd, kind: "main" },
        { start: windows.firstPeakStart, end: windows.firstPeakEnd, kind: "secondary" },
      ];
    default: {
      const neverChronotype: never = chronotype;
      return neverChronotype;
    }
  }
}

function assertChronotype(chronotype: Chronotype): Chronotype {
  switch (chronotype) {
    case "horizon":
    case "apex":
    case "aurora":
      return chronotype;
    default: {
      const neverChronotype: never = chronotype;
      return neverChronotype;
    }
  }
}

function resolveDuration(dayStart: number, dayEnd: string | undefined): number {
  if (!dayEnd) return DEFAULT_DAY_MINUTES;
  const end = parseBlueprintTime(dayEnd);
  if (end === null) return DEFAULT_DAY_MINUTES;
  const raw = (end - dayStart + DAY_MINUTES) % DAY_MINUTES;
  return raw === 0 ? DAY_MINUTES : raw;
}

function resolvePeaks(
  chronotype: Chronotype,
  override: EnergyPeakInput[] | undefined,
  dayStart: number,
  duration: number,
): ResolvedPeak[] {
  const source = override ?? defaultEnergyPeaks(chronotype);
  const resolved: ResolvedPeak[] = [];

  for (const peak of source) {
    if (!isPeakKind(peak.kind)) continue;
    const start = parseBlueprintTime(peak.start);
    const end = parseBlueprintTime(peak.end);
    if (start === null || end === null || start === end) continue;
    const slices = peakSlices(start, end, dayStart, duration);
    resolved.push({
      kind: peak.kind,
      start,
      end,
      startLabel: formatClockTime(start),
      endLabel: formatClockTime(end),
      slices,
    });
  }

  return resolved;
}

function isPeakKind(value: string): value is EnergyPeakKind {
  return value === "main" || value === "secondary";
}

function buildHourRows(dayStart: number, duration: number, shades: HeatLevel[]): BlueprintHourRow[] {
  const rows: BlueprintHourRow[] = [];
  const spanLimit = Math.min(Math.max(duration, 0), DAY_MINUTES);
  let cursor = 0;

  while (cursor < spanLimit) {
    const clock = (dayStart + cursor) % DAY_MINUTES;
    const hour = Math.floor(clock / 60);
    const span = Math.min(60 - (clock % 60), spanLimit - cursor);
    rows.push({
      hour,
      label: formatHourLabel(hour),
      offset: cursor,
      span,
      shade: shades[hour] ?? 0,
    });
    cursor += span;
  }

  return rows;
}

function tickOffsets(peaks: ResolvedPeak[], dayStart: number, duration: number): number[] {
  const marks = new Set<number>();
  for (const peak of peaks) {
    for (const boundary of [peak.start, peak.end]) {
      const offset = boundaryOffset(boundary, dayStart, duration);
      if (offset !== null) marks.add(offset);
    }
  }
  return [...marks].sort((a, b) => a - b);
}

function boundaryOffset(minute: number, dayStart: number, duration: number): number | null {
  if (duration <= 0) return null;
  const offset = (normalizeMinute(minute) - dayStart + DAY_MINUTES) % DAY_MINUTES;
  if (duration >= DAY_MINUTES) return offset;
  if (offset > duration) return null;
  return offset;
}

function peakSlices(start: number, end: number, dayStart: number, duration: number): PeakSlice[] {
  if (duration <= 0) return [];
  const slices: PeakSlice[] = [];

  for (const [peakStart, peakEnd] of linearSegments(start, end)) {
    for (const [daySegStart, daySegEnd] of daySegments(dayStart, duration)) {
      const lo = Math.max(peakStart, daySegStart);
      const hi = Math.min(peakEnd, daySegEnd);
      if (hi <= lo) continue;
      const offset = (lo - dayStart + DAY_MINUTES) % DAY_MINUTES;
      if (duration < DAY_MINUTES && offset >= duration) continue;
      slices.push({ offset, length: hi - lo });
    }
  }

  return slices.sort((a, b) => a.offset - b.offset);
}

function daySegments(dayStart: number, duration: number): Array<[number, number]> {
  if (duration >= DAY_MINUTES) return [[0, DAY_MINUTES]];
  const end = (dayStart + duration) % DAY_MINUTES;
  return linearSegments(dayStart, end);
}

function linearSegments(start: number, end: number): Array<[number, number]> {
  const from = normalizeMinute(start);
  const to = normalizeMinute(end);
  if (from === to) return [];
  if (to > from) return [[from, to]];
  return [
    [from, DAY_MINUTES],
    [0, to],
  ];
}

function minutesInHour(hour: number, peaks: Array<{ start: number; end: number }>): number {
  const hourStart = hour * 60;
  const hourEnd = hourStart + 60;
  const pieces: Array<[number, number]> = [];

  for (const peak of peaks) {
    for (const [peakStart, peakEnd] of linearSegments(peak.start, peak.end)) {
      const lo = Math.max(peakStart, hourStart);
      const hi = Math.min(peakEnd, hourEnd);
      if (hi > lo) pieces.push([lo, hi]);
    }
  }

  pieces.sort((a, b) => a[0] - b[0]);
  let total = 0;
  let cursor = hourStart;
  for (const [lo, hi] of pieces) {
    const from = Math.max(lo, cursor);
    if (hi > from) total += hi - from;
    cursor = Math.max(cursor, hi);
  }
  return total;
}

function normalizeMinute(value: number): number {
  return ((value % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
}
