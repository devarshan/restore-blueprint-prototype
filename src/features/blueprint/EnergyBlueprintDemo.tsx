import { useEffect, useState } from "react";
import { formatClockTime } from "../../domain/chronotype/blueprint";
import { CHRONOTYPE_INFO } from "../../domain/chronotype/constants";
import type { ChronotypeResult } from "../../domain/chronotype/types";
import { ScheduleClock } from "../survey/ScheduleClock";
import { EnergyBlueprintVertical } from "./EnergyBlueprintVertical";
import { EnergyPeakSentence } from "./EnergyPeakSentence";
import "./energy-blueprint.css";

const HORIZON_CLOCK: ChronotypeResult = {
  chronotype: "horizon",
  score: 80,
  scoreFactors: [],
  description: CHRONOTYPE_INFO.horizon.description,
  characteristics: CHRONOTYPE_INFO.horizon.characteristics,
  firstPeakStart: "7:30 AM",
  firstPeakEnd: "10:00 AM",
  secondPeakStart: "2:00 PM",
  secondPeakEnd: "4:00 PM",
  naturalWakeTime: "6:00 AM",
  optimalBedtime: "10:00 PM",
};

export function EnergyBlueprintDemo() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Energy blueprint bench";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <main className="ebv-bench">
      <div className="ebv-bench-inner">
        <p className="ebv-bench-kicker">Development only</p>
        <h1>Energy blueprint</h1>
        <p className="ebv-bench-lead">
          One day, top to bottom, from the Web Summit peak windows. Horizon starts at 6 am, Apex at 7 am, Aurora at 8 am.
        </p>

        <div className="ebv-bench-grid">
          <figure className="ebv-bench-item" id="horizon">
            <figcaption>Horizon</figcaption>
            <EnergyBlueprintVertical chronotype="horizon" now={null} />
          </figure>
          <figure className="ebv-bench-item" id="apex">
            <figcaption>Apex</figcaption>
            <EnergyBlueprintVertical chronotype="apex" now={null} />
          </figure>
          <figure className="ebv-bench-item" id="aurora">
            <figcaption>Aurora</figcaption>
            <EnergyBlueprintVertical chronotype="aurora" now={null} />
          </figure>
        </div>

        <PinnedNow />

        <section className="ebv-bench-block" id="custom-start">
          <h2>Custom day start</h2>
          <p className="ebv-bench-note">Horizon with dayStart 05:00. The peaks stay at 7:30 AM and 2:00 PM. The column starts an hour earlier.</p>
          <EnergyBlueprintVertical chronotype="horizon" dayStart="05:00" now={null} />
        </section>

        <section className="ebv-bench-block" id="sentence-only">
          <h2>Sentence only</h2>
          <p className="ebv-bench-note">The line the dashboard can render without the column.</p>
          <div className="ebv ebv-sentence-only">
            <EnergyPeakSentence chronotype="apex" />
          </div>
        </section>

        <section className="ebv-bench-block" id="compare">
          <h2>Clock and column</h2>
          <p className="ebv-bench-note">Horizon email plate beside the vertical day.</p>
          <div className="ebv-bench-compare">
            <div>
              <img
                className="ebv-bench-plate"
                src="/static/images/email/horizon-schedule.jpg"
                alt="Horizon schedule from the conference email, with the circular energy clock"
              />
              <div className="ebv-bench-clock">
                <ScheduleClock result={HORIZON_CLOCK} />
              </div>
            </div>
            <EnergyBlueprintVertical chronotype="horizon" now={null} />
          </div>
        </section>
      </div>
    </main>
  );
}

function PinnedNow() {
  const [minutes, setMinutes] = useState(9 * 60 + 12);
  const label = formatClockTime(minutes);

  return (
    <section className="ebv-bench-block" id="now-marker">
      <h2>Now marker</h2>
      <p className="ebv-bench-note">
        Pinned at {label}. Advance it to move the line without reloading. An unpinned blueprint follows the clock and steps at each new minute.
      </p>
      <button type="button" className="ebv-bench-step" onClick={() => setMinutes((value) => (value + 30) % (24 * 60))}>
        Advance 30 minutes
      </button>
      <EnergyBlueprintVertical chronotype="horizon" now={label} />
    </section>
  );
}
