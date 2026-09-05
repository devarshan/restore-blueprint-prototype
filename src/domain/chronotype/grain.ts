export const CLOCK_GRAIN = {
  seed: 11,
  frequency: 0.9,
  octaves: 2,
  faceOpacity: 0.14,
} as const;

const TILE = 64;
let tileCanvas: HTMLCanvasElement | null = null;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getGrainTile(): HTMLCanvasElement {
  if (tileCanvas) return tileCanvas;
  const canvas = document.createElement('canvas');
  canvas.width = TILE;
  canvas.height = TILE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const pixels = ctx.createImageData(TILE, TILE);
  const rand = mulberry32(CLOCK_GRAIN.seed);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const value = 128 + (rand() - 0.5) * 36;
    pixels.data[i] = value;
    pixels.data[i + 1] = value;
    pixels.data[i + 2] = value;
    pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  tileCanvas = canvas;
  return canvas;
}

export function paintGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opacity: number,
): void {
  const pattern = ctx.createPattern(getGrainTile(), 'repeat');
  if (!pattern) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
