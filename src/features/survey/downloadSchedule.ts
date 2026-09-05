import { CLOCK_SIZE, formatPeakRange, paintEnergyClock, resultPeakWindows } from '../../domain/chronotype/clock';
import { CHRONOTYPE_INFO } from '../../domain/chronotype/constants';
import type { ChronotypeResult } from '../../domain/chronotype/types';

const POSTER_WIDTH = 1080;
const POSTER_HEIGHT = 1660;
const NAVY = '#102539';
const MINT = '#c8e5e3';
const FONT = '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function paintOrbs(ctx: CanvasRenderingContext2D) {
  const mint = ctx.createRadialGradient(
    POSTER_WIDTH * 0.1,
    POSTER_HEIGHT * 0.88,
    0,
    POSTER_WIDTH * 0.1,
    POSTER_HEIGHT * 0.88,
    POSTER_WIDTH * 0.9,
  );
  mint.addColorStop(0, 'rgba(190, 225, 227, 0.42)');
  mint.addColorStop(0.58, 'rgba(190, 225, 227, 0)');
  ctx.fillStyle = mint;
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  const flare = ctx.createRadialGradient(
    POSTER_WIDTH * 0.92,
    POSTER_HEIGHT * 0.08,
    0,
    POSTER_WIDTH * 0.92,
    POSTER_HEIGHT * 0.08,
    POSTER_WIDTH * 0.7,
  );
  flare.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
  flare.addColorStop(0.52, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = flare;
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
}

export async function renderSchedulePoster(result: ChronotypeResult): Promise<Blob> {
  await document.fonts.ready;
  const logo = await loadImage('/static/images/restore-wordmark-dark.png');
  const canvas = document.createElement('canvas');
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not draw the schedule.');

  const info = CHRONOTYPE_INFO[result.chronotype];
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  paintOrbs(ctx);

  const pad = 72;
  let y = 80;
  if (logo) {
    const height = 52;
    const width = (logo.naturalWidth / logo.naturalHeight) * height;
    ctx.drawImage(logo, (POSTER_WIDTH - width) / 2, y, width, height);
    y += height + 48;
  }

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `600 56px ${FONT}`;
  ctx.fillText(`${info.name} Schedule`, pad, y + 56);
  y += 88;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.font = `400 28px ${FONT}`;
  ctx.fillText(info.description, pad, y + 28);
  y += 56;

  const clockBox = 760;
  ctx.save();
  ctx.translate((POSTER_WIDTH - clockBox) / 2, y);
  ctx.scale(clockBox / CLOCK_SIZE, clockBox / CLOCK_SIZE);
  paintEnergyClock(ctx, resultPeakWindows(result));
  ctx.restore();
  y += clockBox + 12;

  const cardW = 420;
  const cardH = 96;
  const cardX = POSTER_WIDTH - pad - cardW;
  const ranges = [
    formatPeakRange(result.firstPeakStart, result.firstPeakEnd),
    formatPeakRange(result.secondPeakStart, result.secondPeakEnd),
  ];

  ctx.fillStyle = MINT;
  roundRect(ctx, pad, y + 18, 56, 24, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 24px ${FONT}`;
  ctx.fillText('Peak', pad + 72, y + 38);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(pad, y + 70, 44, 3);
  ctx.font = `600 24px ${FONT}`;
  ctx.fillText('Break', pad + 72, y + 78);

  ctx.font = `700 26px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ranges.forEach((range, index) => {
    const top = y + index * (cardH + 16);
    ctx.fillStyle = MINT;
    roundRect(ctx, cardX, top, cardW, cardH, 20);
    ctx.fill();
    ctx.fillStyle = NAVY;
    ctx.fillText(range, cardX + cardW / 2, top + cardH / 2);
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not export the schedule.'));
    }, 'image/png');
  });
}

export async function downloadSchedulePoster(result: ChronotypeResult): Promise<void> {
  const blob = await renderSchedulePoster(result);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${result.chronotype}-schedule.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
