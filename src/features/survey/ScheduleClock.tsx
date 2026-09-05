import { useId } from 'react';
import {
  CLOCK_CORE,
  CLOCK_CX,
  CLOCK_CY,
  CLOCK_RING_INNER,
  CLOCK_RING_OUTER,
  CLOCK_SIZE,
  CLOCK_WELL,
  buildClockScene,
  resultPeakWindows,
} from '../../domain/chronotype/clock';
import { CHRONOTYPE_INFO } from '../../domain/chronotype/constants';
import { CLOCK_GRAIN } from '../../domain/chronotype/grain';
import type { ChronotypeResult } from '../../domain/chronotype/types';

export function ScheduleClock({ result }: { result: ChronotypeResult }) {
  const uid = useId().replace(/:/g, '');
  const info = CHRONOTYPE_INFO[result.chronotype];
  const scene = buildClockScene(resultPeakWindows(result));
  const trackWidth = CLOCK_RING_OUTER - CLOCK_RING_INNER;
  const trackRadius = (CLOCK_RING_INNER + CLOCK_RING_OUTER) / 2;
  const peakStop = CLOCK_RING_INNER / CLOCK_RING_OUTER;
  const clipId = `clock-face-${uid}`;
  const spotId = `clock-spot-${uid}`;
  const wellId = `clock-well-${uid}`;
  const coreId = `clock-core-${uid}`;
  const trackId = `clock-track-${uid}`;
  const peakId = `clock-peak-${uid}`;
  const sheenId = `clock-sheen-${uid}`;
  const nightId = `clock-night-${uid}`;
  const glowId = `clock-glow-${uid}`;
  const grainId = `clock-grain-${uid}`;
  const label = `${info.name} energy clock. Peak ${result.firstPeakStart} to ${result.firstPeakEnd} and ${result.secondPeakStart} to ${result.secondPeakEnd}.`;

  return (
    <svg
      className="schedule-dial"
      viewBox={`0 0 ${CLOCK_SIZE} ${CLOCK_SIZE}`}
      role="img"
      aria-label={label}
    >
      <defs>
        <radialGradient id={spotId} cx="63%" cy="28%" r="62%">
          <stop offset="0%" stopColor="#b7d0dc" stopOpacity="0.28" />
          <stop offset="38%" stopColor="#5a7a8e" stopOpacity="0.11" />
          <stop offset="100%" stopColor="#102539" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={wellId} cx="38%" cy="34%" r="68%">
          <stop offset="0%" stopColor="#4e6c7e" stopOpacity="0.36" />
          <stop offset="100%" stopColor="#0c1c28" stopOpacity="0.92" />
        </radialGradient>
        <radialGradient id={coreId} cx="34%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#6e8a9a" stopOpacity="0.48" />
          <stop offset="45%" stopColor="#243e50" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#081622" />
        </radialGradient>
        <linearGradient id={trackId} x1="18%" y1="8%" x2="86%" y2="92%">
          <stop offset="0%" stopColor="#2a4456" stopOpacity="0.4" />
          <stop offset="38%" stopColor="#7896a6" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#182e3e" stopOpacity="0.28" />
        </linearGradient>
        <radialGradient
          id={peakId}
          gradientUnits="userSpaceOnUse"
          cx={CLOCK_CX}
          cy={CLOCK_CY}
          r={CLOCK_RING_OUTER}
        >
          <stop offset={peakStop} stopColor="#9ec9c8" stopOpacity="0.32" />
          <stop offset="0.88" stopColor="#bee1e3" stopOpacity="0.72" />
          <stop offset="1" stopColor="#ecf8f7" stopOpacity="0.94" />
        </radialGradient>
        <radialGradient id={sheenId} cx="68%" cy="24%" r="48%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="42%" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={nightId} cx="22%" cy="52%" r="48%">
          <stop offset="0%" stopColor="#040c14" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#040c14" stopOpacity="0" />
        </radialGradient>
        <clipPath id={clipId}>
          <circle cx={CLOCK_CX} cy={CLOCK_CY} r={CLOCK_RING_OUTER + 2} />
        </clipPath>
        <filter id={glowId} x="-22%" y="-22%" width="144%" height="144%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={grainId} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={CLOCK_GRAIN.frequency}
            numOctaves={CLOCK_GRAIN.octaves}
            seed={CLOCK_GRAIN.seed}
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.35 0" in="noise" />
        </filter>
      </defs>

      <circle cx={CLOCK_CX} cy={CLOCK_CY} r="196" fill={`url(#${spotId})`} />
      <circle cx={CLOCK_CX} cy={CLOCK_CY} r={CLOCK_WELL} fill={`url(#${wellId})`} />
      <circle cx={CLOCK_CX} cy={CLOCK_CY} r={CLOCK_CORE} fill={`url(#${coreId})`} />
      <circle
        cx={CLOCK_CX}
        cy={CLOCK_CY}
        r={trackRadius}
        fill="none"
        stroke={`url(#${trackId})`}
        strokeWidth={trackWidth}
      />
      <circle
        cx={CLOCK_CX}
        cy={CLOCK_CY}
        r={CLOCK_RING_OUTER + 3.5}
        fill="none"
        stroke="rgba(6, 16, 26, 0.5)"
        strokeWidth="1.8"
      />

      {scene.sectors.map((path) => (
        <path key={`glow-${path}`} d={path} fill="#bee1e3" opacity="0.34" filter={`url(#${glowId})`} />
      ))}
      {scene.sectors.map((path) => (
        <path key={`peak-${path}`} d={path} fill={`url(#${peakId})`} />
      ))}
      {scene.rims.map((path) => (
        <path
          key={`rim-${path}`}
          d={path}
          fill="none"
          stroke="rgba(245, 252, 252, 0.82)"
          strokeWidth="2.15"
          strokeLinecap="round"
        />
      ))}

      <g clipPath={`url(#${clipId})`}>
        <circle cx={CLOCK_CX} cy={CLOCK_CY} r={CLOCK_RING_OUTER + 2} fill={`url(#${sheenId})`} />
        <circle cx={CLOCK_CX} cy={CLOCK_CY} r={CLOCK_RING_OUTER + 2} fill={`url(#${nightId})`} />
        <circle
          className="schedule-dial-grain"
          cx={CLOCK_CX}
          cy={CLOCK_CY}
          r={CLOCK_RING_OUTER + 2}
          fill="#808080"
          filter={`url(#${grainId})`}
          opacity={CLOCK_GRAIN.faceOpacity}
        />
      </g>

      <circle
        cx={CLOCK_CX}
        cy={CLOCK_CY}
        r={CLOCK_RING_OUTER + 1}
        fill="none"
        stroke="rgba(255, 255, 255, 0.16)"
        strokeWidth="1.15"
      />

      {scene.ticks.map((tick) => (
        <line
          key={`${tick.x1}-${tick.y1}`}
          className="schedule-dial-break"
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
        />
      ))}
      {scene.labels.map((item) => (
        <text
          key={item.text}
          className="schedule-dial-label"
          x={item.x}
          y={item.y}
          dy={item.dy}
          textAnchor={item.anchor}
        >
          {item.text}
        </text>
      ))}
    </svg>
  );
}
