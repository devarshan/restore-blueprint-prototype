import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

const mod = await server.ssrLoadModule("/src/domain/chronotype/blueprint.ts");
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function shadeRow(model) {
  return model.rows.map((row) => `${row.label}:${row.shade}`).join(" ");
}

const horizon = mod.resolveEnergyBlueprint({ chronotype: "horizon" });
const apex = mod.resolveEnergyBlueprint({ chronotype: "apex" });
const aurora = mod.resolveEnergyBlueprint({ chronotype: "aurora" });

assert(horizon.dayStart === 6 * 60, `horizon day start ${horizon.dayStart}`);
assert(apex.dayStart === 7 * 60, `apex day start ${apex.dayStart}`);
assert(aurora.dayStart === 8 * 60, `aurora day start ${aurora.dayStart}`);
assert(horizon.duration === 16 * 60, `horizon duration ${horizon.duration}`);

assert(
  horizon.sentence ===
    "Your energy peaks today are 7:30 AM to 10:00 AM (main peak) and 2:00 PM to 4:00 PM (secondary peak).",
  horizon.sentence,
);
assert(
  apex.sentence ===
    "Your energy peaks today are 9:00 AM to 11:30 AM (main peak) and 3:30 PM to 5:30 PM (secondary peak).",
  apex.sentence,
);
assert(
  aurora.sentence ===
    "Your energy peaks today are 10:30 AM to 1:00 PM (secondary peak) and 6:00 PM to 8:00 PM (main peak).",
  aurora.sentence,
);

const horizonMain = horizon.peaks.find((peak) => peak.kind === "main");
const horizonSecondary = horizon.peaks.find((peak) => peak.kind === "secondary");
assert(horizonMain.slices[0].offset === 90, `horizon main offset ${horizonMain.slices[0].offset}`);
assert(horizonMain.slices[0].length === 150, `horizon main length ${horizonMain.slices[0].length}`);
assert(horizonSecondary.slices[0].offset === 8 * 60, `horizon secondary offset ${horizonSecondary.slices[0].offset}`);
assert(horizonSecondary.slices[0].length === 120, `horizon secondary length ${horizonSecondary.slices[0].length}`);

const apexMain = apex.peaks.find((peak) => peak.kind === "main");
const apexSecondary = apex.peaks.find((peak) => peak.kind === "secondary");
assert(apexMain.slices[0].offset === 120, `apex main offset ${apexMain.slices[0].offset}`);
assert(apexMain.slices[0].length === 150, `apex main length ${apexMain.slices[0].length}`);
assert(apexMain.slices[0].offset + apexMain.slices[0].length === 270, "apex main should end at 11:30");
assert(apexSecondary.slices[0].offset === 8 * 60 + 30, `apex secondary offset ${apexSecondary.slices[0].offset}`);
assert(apexSecondary.slices[0].length === 120, `apex secondary length ${apexSecondary.slices[0].length}`);

const auroraMain = aurora.peaks.find((peak) => peak.kind === "main");
const auroraSecondary = aurora.peaks.find((peak) => peak.kind === "secondary");
assert(auroraMain.start === 18 * 60, `aurora main start ${auroraMain.start}`);
assert(auroraMain.slices[0].length === 120, `aurora main length ${auroraMain.slices[0].length}`);
assert(auroraSecondary.slices[0].offset === 150, `aurora 10:30 offset ${auroraSecondary.slices[0].offset}`);
assert(auroraSecondary.slices[0].length === 150, `aurora secondary length ${auroraSecondary.slices[0].length}`);

assert(
  shadeRow(horizon) ===
    "6 am:2 7 am:4 8 am:4 9 am:4 10 am:2 11 am:1 12 pm:1 1 pm:2 2 pm:4 3 pm:4 4 pm:2 5 pm:1 6 pm:0 7 pm:0 8 pm:0 9 pm:0",
  shadeRow(horizon),
);
assert(horizon.rows.find((row) => row.label === "7 am").shade === 4, "7am rounds up at exactly 30 minutes");
assert(apex.rows.find((row) => row.label === "11 am").shade === 4, "11am apex is 30 minutes and darkest");
assert(apex.rows.find((row) => row.label === "3 pm").shade === 4, "3pm apex starts at 3:30 and rounds up");
assert(apex.rows.find((row) => row.label === "5 pm").shade === 4, "5pm apex ends at 5:30 and rounds up");
assert(aurora.rows.find((row) => row.label === "10 am").shade === 4, "10am aurora starts at 10:30 and rounds up");

const under = mod.hourShades([{ start: 7 * 60, end: 7 * 60 + 29 }]);
const exact = mod.hourShades([{ start: 7 * 60, end: 7 * 60 + 30 }]);
const split = mod.hourShades([{ start: 7 * 60 + 45, end: 8 * 60 + 15 }]);
assert(under[7] === 3 && under[6] === 2 && under[8] === 2, `under 30 shades ${under.slice(6, 9).join(",")}`);
assert(exact[7] === 4, `exact 30 shade ${exact[7]}`);
assert(split[7] === 3 && split[8] === 3, `split peak shades ${split[7]},${split[8]}`);

const custom = mod.resolveEnergyBlueprint({ chronotype: "horizon", dayStart: "05:00" });
assert(custom.dayStart === 5 * 60, `custom start ${custom.dayStart}`);
assert(custom.rows[0].label === "5 am", `custom first label ${custom.rows[0].label}`);
assert(custom.peaks.find((peak) => peak.kind === "main").slices[0].offset === 150, "custom start keeps 7:30");
assert(custom.sentence === horizon.sentence, custom.sentence);

const clipped = mod.resolveEnergyBlueprint({ chronotype: "horizon", dayStart: "08:00" });
const clippedMain = clipped.peaks.find((peak) => peak.kind === "main");
assert(clippedMain.slices[0].offset === 0, `clipped offset ${clippedMain.slices[0].offset}`);
assert(clippedMain.slices[0].length === 120, `clipped length ${clippedMain.slices[0].length}`);
assert(!clipped.ticks.includes(0), `clipped ticks should omit the hidden 7:30 edge ${clipped.ticks.join(",")}`);
assert(clipped.ticks.includes(120), `clipped ticks should keep 10:00 ${clipped.ticks.join(",")}`);

const hidden = mod.resolveEnergyBlueprint({ chronotype: "horizon", dayStart: "11:00" });
assert(
  hidden.sentence === "Your energy peak today is 2:00 PM to 4:00 PM (secondary peak).",
  hidden.sentence,
);

assert(mod.nowMarkerOffset(9 * 60 + 12, 6 * 60, 16 * 60) === 192, "9:12 sits 12 minutes into 9 am");
assert(mod.nowMarkerOffset(5 * 60, 6 * 60, 16 * 60) === null, "5:00 is outside the horizon day");
assert(mod.nowMarkerOffset(22 * 60, 6 * 60, 16 * 60) === null, "day end is outside");
assert(mod.nowMarkerOffset(21 * 60 + 59, 6 * 60, 16 * 60) === 15 * 60 + 59, "21:59 is inside");

assert(mod.nextMinuteDelay(0) === 60_000, "delay on the minute");
assert(mod.nextMinuteDelay(1_000) === 59_000, "delay one second in");
assert(mod.nextMinuteDelay(59_999) === 1, "delay just before the minute");

const wrapped = mod.resolveEnergyBlueprint({
  chronotype: "apex",
  dayStart: "20:00",
  dayEnd: "04:00",
  peaks: [{ start: "22:00", end: "01:00", kind: "main" }],
});
assert(wrapped.duration === 8 * 60, `wrapped duration ${wrapped.duration}`);
assert(wrapped.peaks[0].slices.length === 2, `wrapped slices ${wrapped.peaks[0].slices.length}`);
assert(wrapped.peaks[0].slices[0].offset === 120 && wrapped.peaks[0].slices[0].length === 120, "wrapped first slice");
assert(wrapped.peaks[0].slices[1].offset === 240 && wrapped.peaks[0].slices[1].length === 60, "wrapped second slice");
assert(wrapped.rows.reduce((sum, row) => sum + row.span, 0) === wrapped.duration, "row spans cover the day");

console.log("horizon", shadeRow(horizon));
console.log("apex", shadeRow(apex));
console.log("aurora", shadeRow(aurora));

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("blueprint checks passed");
process.exit(0);
