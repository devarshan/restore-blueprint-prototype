type Answers = Record<string, unknown>;

function str(data: Answers, key: string): string {
  return String(data[key] ?? "");
}

function num(data: Answers, key: string): number {
  const value = data[key];
  return typeof value === "number" ? value : Number(value) || 0;
}

function timeToMinutes(hour: string, minute: string): number {
  return (parseInt(hour, 10) || 0) * 60 + (parseInt(minute, 10) || 0);
}

function sleepMidpoint(bedH: string, bedM: string, wakeH: string, wakeM: string): number {
  let bedtime = timeToMinutes(bedH, bedM);
  let waketime = timeToMinutes(wakeH, wakeM);
  if (waketime < bedtime) waketime += 24 * 60;
  return ((bedtime + waketime) / 2) % (24 * 60);
}

export type ChronotypeName = "horizon" | "apex" | "aurora";

export const CHRONOTYPE_WINDOWS: Record<
  ChronotypeName,
  { firstPeakStart: string; firstPeakEnd: string; secondPeakStart: string; secondPeakEnd: string }
> = {
  horizon: {
    firstPeakStart: "7:30 AM",
    firstPeakEnd: "10:00 AM",
    secondPeakStart: "2:00 PM",
    secondPeakEnd: "4:00 PM",
  },
  apex: {
    firstPeakStart: "9:00 AM",
    firstPeakEnd: "11:30 AM",
    secondPeakStart: "3:30 PM",
    secondPeakEnd: "5:30 PM",
  },
  aurora: {
    firstPeakStart: "10:30 AM",
    firstPeakEnd: "1:00 PM",
    secondPeakStart: "6:00 PM",
    secondPeakEnd: "8:00 PM",
  },
};

export function isChronotype(value: string): value is ChronotypeName {
  return value === "horizon" || value === "apex" || value === "aurora";
}

export function formatPeakHours(name: ChronotypeName): string {
  const w = CHRONOTYPE_WINDOWS[name];
  return `${w.firstPeakStart} - ${w.firstPeakEnd} and ${w.secondPeakStart} - ${w.secondPeakEnd}`;
}

export function calculateChronotype(data: Answers): { chronotype: ChronotypeName; peakHours: string } {
  let score = 50;
  const ageYear = parseInt(str(data, "birthYear"), 10);
  const age = Number.isFinite(ageYear) ? new Date().getFullYear() - ageYear : 30;
  const useFreeDay = str(data, "differentSleepPattern") === "yes";
  const freeDayBedHour = useFreeDay ? str(data, "nonWorkdayBedtimeHour") : str(data, "workdayBedtimeHour");
  const freeDayBedMin = useFreeDay ? str(data, "nonWorkdayBedtimeMinute") : str(data, "workdayBedtimeMinute");
  const freeDayWakeHour = useFreeDay ? str(data, "nonWorkdayWaketimeHour") : str(data, "workdayWaketimeHour");
  const freeDayWakeMin = useFreeDay ? str(data, "nonWorkdayWaketimeMinute") : str(data, "workdayWaketimeMinute");
  const useAlarmFreeDay = useFreeDay ? str(data, "nonWorkdayUseAlarm") : str(data, "workdayUseAlarm");

  if (freeDayBedHour && freeDayWakeHour) {
    const midpointHour = sleepMidpoint(freeDayBedHour, freeDayBedMin, freeDayWakeHour, freeDayWakeMin) / 60;
    if (midpointHour < 3) score += 25;
    else if (midpointHour < 4) score += 15;
    else if (midpointHour < 5) score += 5;
    else if (midpointHour < 6) score += 0;
    else if (midpointHour < 7) score -= 10;
    else score -= 20;
  }

  if (freeDayWakeHour && useAlarmFreeDay === "no") {
    const wakeHour = timeToMinutes(freeDayWakeHour, freeDayWakeMin) / 60;
    if (wakeHour < 6) score += 20;
    else if (wakeHour < 7) score += 15;
    else if (wakeHour < 8) score += 10;
    else if (wakeHour < 9) score += 0;
    else if (wakeHour < 10) score -= 10;
    else score -= 15;
  }

  if (str(data, "differentSleepPattern") === "yes") {
    if (str(data, "sleepLongerNonWorkday") === "yes") score -= 15;
    else if (str(data, "sleepLongerNonWorkday") === "no") score += 10;
  } else {
    score += 15;
  }

  const fallAsleep = str(data, "workdayFallAsleepDuration");
  if (fallAsleep === "<5" || fallAsleep === "5-15") score += 10;
  else if (fallAsleep === "30-60" || fallAsleep === "60+") score -= 10;

  if (str(data, "workdayUseAlarm") === "yes") score -= 5;
  else score += 10;

  if (str(data, "breakfastHour")) {
    const breakfastHour = timeToMinutes(str(data, "breakfastHour"), str(data, "breakfastMinute")) / 60;
    if (breakfastHour < 7) score += 10;
    else if (breakfastHour < 8) score += 5;
    else if (breakfastHour < 9) score += 0;
    else if (breakfastHour < 10) score -= 5;
    else score -= 10;
  }

  if (num(data, "stressLevel") > 70 && num(data, "workLifeBalance") < 30) score -= 5;
  if (age < 25) score -= 10;
  else if (age < 40) score -= 5;
  else if (age >= 55 && age < 70) score += 5;
  else if (age >= 70) score += 10;

  if (str(data, "gender") === "Female") score += 3;
  else if (str(data, "gender") === "Male") score -= 2;

  const exercise = num(data, "exerciseDaysPerWeek");
  if (exercise >= 5) score += 5;
  else if (exercise >= 3) score += 2;

  score = Math.max(0, Math.min(100, score));
  const chronotype: ChronotypeName = score >= 70 ? "horizon" : score >= 40 ? "apex" : "aurora";

  return {
    chronotype,
    peakHours: formatPeakHours(chronotype),
  };
}
