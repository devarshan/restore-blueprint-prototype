import { CLOCK_GRAIN, paintGrain } from './grain';
import type { ChronotypeResult } from './types';

export const CLOCK_SIZE = 400;
export const CLOCK_CX = 200;
export const CLOCK_CY = 200;
export const CLOCK_CORE = 76;
export const CLOCK_WELL = 92;
export const CLOCK_RING_INNER = 96;
export const CLOCK_RING_OUTER = 144;
export const CLOCK_TICK_INNER = 82;
export const CLOCK_TICK_OUTER = 148;
export const CLOCK_LABEL_R = 170;

export interface PeakWindow {
  start: number;
  end: number;
}

export interface ClockTick {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ClockLabel {
  x: number;
  y: number;
  dy: number;
  text: string;
  anchor: 'start' | 'middle' | 'end';
}

export interface ClockScene {
  sectors: string[];
  rims: string[];
  ticks: ClockTick[];
  labels: ClockLabel[];
}

export const CLOCK_LABELS: { minutes: number; text: string }[] = [
  { minutes: 6 * 60, text: '6 am' },
  { minutes: 9 * 60, text: '9 am' },
  { minutes: 12 * 60, text: '12 pm' },
  { minutes: 15 * 60, text: '3 pm' },
  { minutes: 18 * 60, text: '6 pm' },
  { minutes: 21 * 60, text: '9 pm' },
  { minutes: 0, text: '12 am' },
  { minutes: 3 * 60, text: '3 am' },
];

const DAY = 24 * 60;

export function parseClockTime(value: string): number {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  const hourRaw = Number(match[1]);
  const minute = Number(match[2]);
  let hour = hourRaw % 12;
  if (/pm/i.test(match[3])) hour += 12;
  return hour * 60 + minute;
}

export function formatPeakRange(start: string, end: string): string {
  return `${start.replace('AM', 'am').replace('PM', 'pm')} – ${end.replace('AM', 'am').replace('PM', 'pm')}`;
}

export function resultPeakWindows(result: ChronotypeResult): PeakWindow[] {
  return [
    { start: parseClockTime(result.firstPeakStart), end: parseClockTime(result.firstPeakEnd) },
    { start: parseClockTime(result.secondPeakStart), end: parseClockTime(result.secondPeakEnd) },
  ];
}

export function clockAngle(minutes: number): number {
  const fromSix = (minutes - 6 * 60 + DAY) % DAY;
  return (fromSix / DAY) * Math.PI * 2 - Math.PI / 2;
}

export function polar(radius: number, minutes: number, cx = CLOCK_CX, cy = CLOCK_CY) {
  const angle = clockAngle(minutes);
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function splitWindow(start: number, end: number): Array<[number, number]> {
  const from = ((start % DAY) + DAY) % DAY;
  const to = ((end % DAY) + DAY) % DAY;
  if (from === to) return [];
  if (to > from) return [[from, to]];
  return [
    [from, DAY],
    [0, to],
  ];
}

export function outerArcPath(start: number, end: number): string {
  const span = (end - start + DAY) % DAY;
  if (span === 0) return '';
  const large = span > DAY / 2 ? 1 : 0;
  const outer0 = polar(CLOCK_RING_OUTER, start);
  const outer1 = polar(CLOCK_RING_OUTER, end);
  return `M ${outer0.x.toFixed(3)} ${outer0.y.toFixed(3)} A ${CLOCK_RING_OUTER} ${CLOCK_RING_OUTER} 0 ${large} 1 ${outer1.x.toFixed(3)} ${outer1.y.toFixed(3)}`;
}

export function annularSectorPath(start: number, end: number): string {
  const span = (end - start + DAY) % DAY;
  if (span === 0) return '';
  const large = span > DAY / 2 ? 1 : 0;
  const outer0 = polar(CLOCK_RING_OUTER, start);
  const outer1 = polar(CLOCK_RING_OUTER, end);
  const inner1 = polar(CLOCK_RING_INNER, end);
  const inner0 = polar(CLOCK_RING_INNER, start);
  return [
    `M ${outer0.x.toFixed(3)} ${outer0.y.toFixed(3)}`,
    `A ${CLOCK_RING_OUTER} ${CLOCK_RING_OUTER} 0 ${large} 1 ${outer1.x.toFixed(3)} ${outer1.y.toFixed(3)}`,
    `L ${inner1.x.toFixed(3)} ${inner1.y.toFixed(3)}`,
    `A ${CLOCK_RING_INNER} ${CLOCK_RING_INNER} 0 ${large} 0 ${inner0.x.toFixed(3)} ${inner0.y.toFixed(3)}`,
    'Z',
  ].join(' ');
}

function labelLayout(minutes: number, text: string): ClockLabel {
  const angle = clockAngle(minutes);
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  let anchor: ClockLabel['anchor'] = 'middle';
  if (cosine > 0.42) anchor = 'start';
  else if (cosine < -0.42) anchor = 'end';
  let dy = 5;
  if (sine < -0.55) dy = 0;
  else if (sine > 0.55) dy = 14;
  const point = polar(CLOCK_LABEL_R, minutes);
  return { x: point.x, y: point.y, dy, text, anchor };
}

export function buildClockScene(peaks: PeakWindow[]): ClockScene {
  const sectors: string[] = [];
  const rims: string[] = [];
  const tickMinutes = new Set<number>();

  for (const peak of peaks) {
    for (const [start, end] of splitWindow(peak.start, peak.end)) {
      const sector = annularSectorPath(start, end);
      const rim = outerArcPath(start, end);
      if (sector) sectors.push(sector);
      if (rim) rims.push(rim);
    }
    tickMinutes.add(peak.start % DAY);
    tickMinutes.add(peak.end % DAY);
  }

  const ticks = [...tickMinutes].map((minutes) => {
    const inner = polar(CLOCK_TICK_INNER, minutes);
    const outer = polar(CLOCK_TICK_OUTER, minutes);
    return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
  });

  return {
    sectors,
    rims,
    ticks,
    labels: CLOCK_LABELS.map((label) => labelLayout(label.minutes, label.text)),
  };
}

export function paintEnergyClock(ctx: CanvasRenderingContext2D, peaks: PeakWindow[]): void {
  const scene = buildClockScene(peaks);
  const trackWidth = CLOCK_RING_OUTER - CLOCK_RING_INNER;
  const trackRadius = (CLOCK_RING_INNER + CLOCK_RING_OUTER) / 2;

  ctx.save();

  const spot = ctx.createRadialGradient(252, 112, 8, 252, 112, 220);
  spot.addColorStop(0, 'rgba(183, 208, 220, 0.28)');
  spot.addColorStop(0.38, 'rgba(90, 122, 142, 0.11)');
  spot.addColorStop(1, 'rgba(16, 37, 57, 0)');
  ctx.fillStyle = spot;
  ctx.beginPath();
  ctx.arc(CLOCK_CX, CLOCK_CY, 196, 0, Math.PI * 2);
  ctx.fill();

  const well = ctx.createRadialGradient(156, 140, 6, CLOCK_CX, CLOCK_CY, CLOCK_WELL);
  well.addColorStop(0, 'rgba(78, 108, 126, 0.36)');
  well.addColorStop(1, 'rgba(12, 28, 40, 0.92)');
  ctx.fillStyle = well;
  ctx.beginPath();
  ctx.arc(CLOCK_CX, CLOCK_CY, CLOCK_WELL, 0, Math.PI * 2);
  ctx.fill();

  const core = ctx.createRadialGradient(152, 136, 4, CLOCK_CX, CLOCK_CY, CLOCK_CORE);
  core.addColorStop(0, 'rgba(110, 138, 154, 0.48)');
  core.addColorStop(0.45, 'rgba(36, 62, 80, 0.92)');
  core.addColorStop(1, 'rgba(8, 22, 34, 1)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(CLOCK_CX, CLOCK_CY, CLOCK_CORE, 0, Math.PI * 2);
  ctx.fill();

  const track = ctx.createLinearGradient(72, 32, 344, 368);
  track.addColorStop(0, 'rgba(42, 68, 86, 0.4)');
  track.addColorStop(0.38, 'rgba(120, 150, 166, 0.42)');
  track.addColorStop(1, 'rgba(24, 46, 62, 0.28)');
  ctx.strokeStyle = track;
  ctx.lineWidth = trackWidth;
  ctx.beginPath();
  ctx.arc(CLOCK_CX, CLOCK_CY, trackRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(6, 16, 26, 0.5)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(CLOCK_CX, CLOCK_CY, CLOCK_RING_OUTER + 3.5, 0, Math.PI * 2);
  ctx.stroke();

  const peakFill = ctx.createRadialGradient(CLOCK_CX, CLOCK_CY, CLOCK_RING_INNER, CLOCK_CX, CLOCK_CY, CLOCK_RING_OUTER);
  peakFill.addColorStop(0, 'rgba(158, 201, 200, 0.32)');
  peakFill.addColorStop(0.72, 'rgba(190, 225, 227, 0.72)');
  peakFill.addColorStop(1, 'rgba(236, 248, 247, 0.94)');

  ctx.save();
  ctx.shadowColor = 'rgba(190, 225, 227, 0.34)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = peakFill;
  for (const sector of scene.sectors) ctx.fill(new Path2D(sector));
  ctx.restore();

  ctx.strokeStyle = 'rgba(245, 252, 252, 0.82)';
  ctx.lineWidth = 2.15;
  ctx.lineCap = 'round';
  for (const rim of scene.rims) ctx.stroke(new Path2D(rim));

  ctx.save();
  ctx.beginPath();
  ctx.arc(CLOCK_CX, CLOCK_CY, CLOCK_RING_OUTER + 2, 0, Math.PI * 2);
  ctx.clip();
  const sheen = ctx.createRadialGradient(272, 96, 0, 272, 96, 168);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
  sheen.addColorStop(0.42, 'rgba(255, 255, 255, 0.05)');
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, CLOCK_SIZE, CLOCK_SIZE);
  const night = ctx.createRadialGradient(88, 208, 0, 88, 208, 168);
  night.addColorStop(0, 'rgba(4, 12, 20, 0.22)');
  night.addColorStop(1, 'rgba(4, 12, 20, 0)');
  ctx.fillStyle = night;
  ctx.fillRect(0, 0, CLOCK_SIZE, CLOCK_SIZE);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(CLOCK_CX, CLOCK_CY, CLOCK_RING_OUTER + 2, 0, Math.PI * 2);
  ctx.clip();
  paintGrain(ctx, CLOCK_SIZE, CLOCK_SIZE, CLOCK_GRAIN.faceOpacity);
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.arc(CLOCK_CX, CLOCK_CY, CLOCK_RING_OUTER + 1, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  for (const tick of scene.ticks) {
    ctx.beginPath();
    ctx.moveTo(tick.x1, tick.y1);
    ctx.lineTo(tick.x2, tick.y2);
    ctx.stroke();
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 13px "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';
  for (const label of scene.labels) {
    ctx.textAlign = label.anchor === 'start' ? 'left' : label.anchor === 'end' ? 'right' : 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(label.text, label.x, label.y + label.dy);
  }
  ctx.restore();
}
