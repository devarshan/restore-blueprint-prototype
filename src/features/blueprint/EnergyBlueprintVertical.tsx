import { useEffect, useMemo, useState } from "react";
import { CHRONOTYPE_INFO } from "../../domain/chronotype/constants";
import {
  nextMinuteDelay,
  nowMarkerOffset,
  parseBlueprintTime,
  resolveEnergyBlueprint,
  type EnergyBlueprintInput,
  type EnergyBlueprintModel,
  type EnergyPeakKind,
  type ResolvedPeak,
} from "../../domain/chronotype/blueprint";
import { EnergyPeakSentence } from "./EnergyPeakSentence";
import "./energy-blueprint.css";

export interface EnergyBlueprintVerticalProps extends EnergyBlueprintInput {
  /** Pin the marker. Omit it to follow the clock. Null hides the marker. */
  now?: Date | string | null;
  className?: string;
}

export function EnergyBlueprintVertical({
  chronotype,
  dayStart,
  dayEnd,
  peaks,
  now,
  className,
}: EnergyBlueprintVerticalProps) {
  const model = useMemo(
    () => resolveEnergyBlueprint({ chronotype, dayStart, dayEnd, peaks }),
    [chronotype, dayStart, dayEnd, peaks],
  );
  const live = useLiveMinute(now === undefined);
  const nowMinutes = resolveNowMinutes(now, live);
  const nowOffset =
    nowMinutes === null ? null : nowMarkerOffset(nowMinutes, model.dayStart, model.duration);
  const name = CHRONOTYPE_INFO[chronotype].name;
  const classNames = className ? `ebv ${className}` : "ebv";

  return (
    <section
      className={classNames}
      aria-label={`${name} energy blueprint`}
      data-testid="energy-blueprint"
      data-chronotype={chronotype}
      style={{ ["--eb-minutes" as string]: String(model.duration) }}
    >
      <EnergyPeakSentence chronotype={chronotype} dayStart={dayStart} dayEnd={dayEnd} peaks={peaks} />
      <div
        className="ebv-chart"
        aria-hidden="true"
        style={{ gridTemplateRows: model.rows.map((row) => `${row.span}fr`).join(" ") }}
      >
        {model.rows.map((row, index) => (
          <div
            key={`label-${row.offset}`}
            className="ebv-label"
            style={{ gridColumn: 1, gridRow: index + 1 }}
          >
            {row.label}
          </div>
        ))}
        {model.rows.map((row, index) => (
          <div
            key={`cell-${row.offset}`}
            className="ebv-cell"
            data-hour={row.label}
            data-shade={row.shade}
            style={{
              gridRow: index + 1,
              gridColumn: 2,
              background: `var(--eb-heat-${row.shade})`,
            }}
          />
        ))}
        <div
          className="ebv-overlay"
          style={{
            gridColumn: 2,
            gridRow: "1 / -1",
            gridTemplateRows: `repeat(${model.duration}, minmax(0, 1fr))`,
          }}
        >
          {model.peaks.flatMap((peak) =>
            peak.slices.map((slice) => (
              <div
                key={`${peak.start}-${slice.offset}`}
                className={peakClass(peak.kind)}
                data-kind={peak.kind}
                data-offset={slice.offset}
                data-length={slice.length}
                style={{
                  gridColumn: 1,
                  gridRow: `${slice.offset + 1} / ${slice.offset + slice.length + 1}`,
                }}
              />
            )),
          )}
          {model.ticks.map((offset) => (
            <div
              key={`tick-${offset}`}
              className={offset >= model.duration ? "ebv-tick is-end" : "ebv-tick"}
              data-offset={offset}
              style={{
                gridColumn: 1,
                gridRow: offset >= model.duration ? model.duration : offset + 1,
              }}
            />
          ))}
          {nowOffset !== null ? (
            <div
              className="ebv-now"
              data-offset={nowOffset}
              style={{ gridColumn: 1, gridRow: nowOffset + 1 }}
            />
          ) : null}
        </div>
      </div>
      <ul className="sr-only">
        {audiblePeaks(model).length === 0 ? <li>No energy peaks fall in this day.</li> : null}
        {audiblePeaks(model).map((peak) => (
          <li key={`${peak.kind}-${peak.start}`}>
            {peakKindLabel(peak.kind)} peak, {peak.startLabel} to {peak.endLabel}
          </li>
        ))}
      </ul>
    </section>
  );
}

function audiblePeaks(model: EnergyBlueprintModel): ResolvedPeak[] {
  const visible = model.peaks
    .filter((peak) => peak.slices.length > 0)
    .sort((left, right) => left.slices[0].offset - right.slices[0].offset);
  return visible;
}

function peakClass(kind: EnergyPeakKind): string {
  switch (kind) {
    case "main":
      return "ebv-peak is-main";
    case "secondary":
      return "ebv-peak is-secondary";
    default: {
      const neverKind: never = kind;
      return neverKind;
    }
  }
}

function peakKindLabel(kind: EnergyPeakKind): string {
  switch (kind) {
    case "main":
      return "Main";
    case "secondary":
      return "Secondary";
    default: {
      const neverKind: never = kind;
      return neverKind;
    }
  }
}

function useLiveMinute(enabled: boolean): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!enabled) return;
    let interval = 0;
    const tick = () => setNow(new Date());
    const timeout = window.setTimeout(() => {
      tick();
      interval = window.setInterval(tick, 60_000);
    }, nextMinuteDelay(Date.now()));
    return () => {
      window.clearTimeout(timeout);
      if (interval) window.clearInterval(interval);
    };
  }, [enabled]);

  return now;
}

function resolveNowMinutes(now: Date | string | null | undefined, live: Date): number | null {
  if (now === null) return null;
  if (now === undefined) return live.getHours() * 60 + live.getMinutes();
  if (now instanceof Date) {
    if (Number.isNaN(now.getTime())) return null;
    return now.getHours() * 60 + now.getMinutes();
  }
  return parseBlueprintTime(now);
}
