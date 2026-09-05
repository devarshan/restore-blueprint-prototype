import { CHRONOTYPE_INFO, CHRONOTYPE_WINDOWS } from './constants';
import type { SurveyData, ChronotypeResult, Chronotype } from './types';

function timeToMinutes(hour: string, minute: string): number {
  const h = parseInt(hour) || 0;
  const m = parseInt(minute) || 0;
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
}

function calculateAge(birthYear: string): number {
  if (!birthYear) return 30;
  const year = parseInt(birthYear, 10);
  if (isNaN(year)) return 30;
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  return age;
}

function calculateSleepMidpoint(bedtimeHour: string, bedtimeMin: string, waketimeHour: string, waketimeMin: string): number {
  let bedtime = timeToMinutes(bedtimeHour, bedtimeMin);
  let waketime = timeToMinutes(waketimeHour, waketimeMin);

  if (waketime < bedtime) {
    waketime += 24 * 60;
  }

  const midpoint = (bedtime + waketime) / 2;
  return midpoint % (24 * 60);
}

export function calculateChronotype(data: SurveyData): ChronotypeResult {
  let score = 50;
  const scoreFactors: string[] = [];

  const age = calculateAge(data.birthYear);

  const useFreeDay = data.differentSleepPattern === 'yes';
  const freeDayBedHour = useFreeDay ? data.nonWorkdayBedtimeHour : data.workdayBedtimeHour;
  const freeDayBedMin = useFreeDay ? data.nonWorkdayBedtimeMinute : data.workdayBedtimeMinute;
  const freeDayWakeHour = useFreeDay ? data.nonWorkdayWaketimeHour : data.workdayWaketimeHour;
  const freeDayWakeMin = useFreeDay ? data.nonWorkdayWaketimeMinute : data.workdayWaketimeMinute;

  if (freeDayBedHour && freeDayWakeHour) {
    const midpoint = calculateSleepMidpoint(freeDayBedHour, freeDayBedMin, freeDayWakeHour, freeDayWakeMin);
    const midpointHour = midpoint / 60;

    let midpointAdjustment = 0;
    if (midpointHour < 3) midpointAdjustment = 25;
    else if (midpointHour < 4) midpointAdjustment = 15;
    else if (midpointHour < 5) midpointAdjustment = 5;
    else if (midpointHour < 6) midpointAdjustment = 0;
    else if (midpointHour < 7) midpointAdjustment = -10;
    else midpointAdjustment = -20;

    score += midpointAdjustment;
    scoreFactors.push(`Sleep midpoint: ${midpointHour.toFixed(1)}h → ${midpointAdjustment > 0 ? '+' : ''}${midpointAdjustment}`);
  }

  const useAlarmFreeDay = useFreeDay ? data.nonWorkdayUseAlarm : data.workdayUseAlarm;
  if (freeDayWakeHour) {
    const wakeMinutes = timeToMinutes(freeDayWakeHour, freeDayWakeMin);
    const wakeHour = wakeMinutes / 60;

    if (useAlarmFreeDay === 'no') {
      let wakeAdjustment = 0;
      if (wakeHour < 6) wakeAdjustment = 20;
      else if (wakeHour < 7) wakeAdjustment = 15;
      else if (wakeHour < 8) wakeAdjustment = 10;
      else if (wakeHour < 9) wakeAdjustment = 0;
      else if (wakeHour < 10) wakeAdjustment = -10;
      else wakeAdjustment = -15;

      score += wakeAdjustment;
      scoreFactors.push(`Natural wake: ${wakeHour.toFixed(1)}h (no alarm) → ${wakeAdjustment > 0 ? '+' : ''}${wakeAdjustment}`);
    } else {
      scoreFactors.push(`Wake: ${wakeHour.toFixed(1)}h (with alarm - not scored)`);
    }
  }

  if (data.differentSleepPattern === 'yes') {
    if (data.sleepLongerNonWorkday === 'yes') {
      score -= 15;
    } else if (data.sleepLongerNonWorkday === 'no') {
      score += 10;
    }
  } else {
    score += 15;
  }

  if (data.workdayFallAsleepDuration === '<5' || data.workdayFallAsleepDuration === '5-15') {
    score += 10;
  } else if (data.workdayFallAsleepDuration === '30-60' || data.workdayFallAsleepDuration === '60+') {
    score -= 10;
  }

  if (data.workdayUseAlarm === 'yes') {
    score -= 5;
  } else {
    score += 10;
  }

  if (data.breakfastHour) {
    const breakfastMinutes = timeToMinutes(data.breakfastHour, data.breakfastMinute);
    const breakfastHour = breakfastMinutes / 60;

    if (breakfastHour < 7) score += 10;
    else if (breakfastHour < 8) score += 5;
    else if (breakfastHour < 9) score += 0;
    else if (breakfastHour < 10) score -= 5;
    else score -= 10;
  }

  if (data.stressLevel > 70 && data.workLifeBalance < 30) {
    score -= 5;
  }

  let ageAdjustment = 0;
  if (age < 25) {
    ageAdjustment = -10;
  } else if (age >= 25 && age < 40) {
    ageAdjustment = -5;
  } else if (age >= 40 && age < 55) {
    ageAdjustment = 0;
  } else if (age >= 55 && age < 70) {
    ageAdjustment = 5;
  } else if (age >= 70) {
    ageAdjustment = 10;
  }
  score += ageAdjustment;
  if (ageAdjustment !== 0) {
    scoreFactors.push(`Age: ${age}y → ${ageAdjustment > 0 ? '+' : ''}${ageAdjustment}`);
  }

  if (data.gender === 'Female') {
    score += 3;
  } else if (data.gender === 'Male') {
    score -= 2;
  }

  if (data.exerciseDaysPerWeek >= 5) {
    score += 5;
  } else if (data.exerciseDaysPerWeek >= 3) {
    score += 2;
  }

  score = Math.max(0, Math.min(100, score));

  let chronotype: Chronotype;
  if (score >= 70) chronotype = 'horizon';
  else if (score >= 40) chronotype = 'apex';
  else chronotype = 'aurora';

  let naturalWakeMinutes: number;
  if (chronotype === 'horizon') {
    naturalWakeMinutes = 6 * 60;
  } else if (chronotype === 'apex') {
    naturalWakeMinutes = 7 * 60 + 30;
  } else {
    naturalWakeMinutes = 9 * 60;
  }

  const optimalBedtimeMinutes = (naturalWakeMinutes - 8 * 60 + 24 * 60) % (24 * 60);

  const windows = CHRONOTYPE_WINDOWS[chronotype];
  const firstPeakStart = windows.firstPeakStart;
  const firstPeakEnd = windows.firstPeakEnd;
  const secondPeakStart = windows.secondPeakStart;
  const secondPeakEnd = windows.secondPeakEnd;

  return {
    chronotype,
    score: Math.round(score),
    description: getChronotypeDescription(chronotype),
    characteristics: getChronotypeCharacteristics(chronotype),
    firstPeakStart,
    firstPeakEnd,
    secondPeakStart,
    secondPeakEnd,
    naturalWakeTime: minutesToTime(naturalWakeMinutes),
    optimalBedtime: minutesToTime(optimalBedtimeMinutes),
  };
}

function getChronotypeDescription(chronotype: Chronotype): string {
  return CHRONOTYPE_INFO[chronotype].description;
}

function getChronotypeCharacteristics(chronotype: Chronotype): string {
  return CHRONOTYPE_INFO[chronotype].characteristics;
}

export function formatPeakHours(result: ChronotypeResult): string {
  return `${result.firstPeakStart} - ${result.firstPeakEnd} and ${result.secondPeakStart} - ${result.secondPeakEnd}`;
}
