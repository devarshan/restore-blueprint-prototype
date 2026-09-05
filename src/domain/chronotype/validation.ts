import type { SurveyData } from './types';
import { assertNever, type SurveyStepId } from './steps';

export function isValidBirthYear(yearString: string): boolean {
  if (!yearString || typeof yearString !== 'string') return false;

  const year = parseInt(yearString, 10);
  if (isNaN(year)) return false;

  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  if (age < 18 || age > 120) return false;
  if (year > currentYear || year < currentYear - 120) return false;

  return true;
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  const trimmedEmail = email.trim();
  if (trimmedEmail.length === 0 || trimmedEmail.length > 254) return false;

  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(trimmedEmail);
}

export function isValidTime(hour: string, minute: string): boolean {
  if (!hour || !minute || typeof hour !== 'string' || typeof minute !== 'string') return false;

  const h = parseInt(hour, 10);
  const m = parseInt(minute, 10);

  if (isNaN(h) || isNaN(m)) return false;
  if (h < 0 || h >= 24) return false;
  if (m < 0 || m >= 60) return false;

  if (hour.trim() !== h.toString() && hour.trim() !== h.toString().padStart(2, '0')) return false;
  if (minute.trim() !== m.toString() && minute.trim() !== m.toString().padStart(2, '0')) return false;

  return true;
}

function timeToMinutes(hour: string, minute: string): number {
  const h = parseInt(hour, 10);
  const m = parseInt(minute, 10);
  return h * 60 + m;
}

export function isTimeAfter(hour1: string, minute1: string, hour2: string, minute2: string): boolean {
  if (!isValidTime(hour1, minute1) || !isValidTime(hour2, minute2)) return false;
  return timeToMinutes(hour2, minute2) > timeToMinutes(hour1, minute1);
}

export function isValidSleepTime(
  bedtimeHour: string,
  bedtimeMinute: string,
  waketimeHour: string,
  waketimeMinute: string,
): boolean {
  if (!isValidTime(bedtimeHour, bedtimeMinute) || !isValidTime(waketimeHour, waketimeMinute)) return false;

  const bedMinutes = timeToMinutes(bedtimeHour, bedtimeMinute);
  const wakeMinutes = timeToMinutes(waketimeHour, waketimeMinute);

  return bedMinutes !== wakeMinutes;
}

export function isStepComplete(step: SurveyStepId, data: SurveyData): boolean {
  switch (step) {
    case 'welcome':
    case 'workIntro':
    case 'lifestyleIntro':
    case 'calculating':
    case 'result':
    case 'schedule':
    case 'done':
      return true;
    case 'birthYear':
      return data.birthYear.length > 0 && isValidBirthYear(data.birthYear);
    case 'gender':
      return data.gender !== '';
    case 'timezone':
      return data.timezone.length > 0;
    case 'workLifeBalance':
      return data.workLifeBalance >= 0 && data.workLifeBalance <= 100;
    case 'stress':
      return data.stressLevel >= 0 && data.stressLevel <= 100;
    case 'workHours':
      return (
        isValidTime(data.workStartHour, data.workStartMinute) &&
        isValidTime(data.workEndHour, data.workEndMinute)
      );
    case 'workdaySleep':
      return (
        isValidTime(data.workdayBedtimeHour, data.workdayBedtimeMinute) &&
        isValidTime(data.workdayWaketimeHour, data.workdayWaketimeMinute)
      );
    case 'workdayFallAsleep':
      return data.workdayFallAsleepDuration !== '';
    case 'workdayStayInBed':
      return data.workdayStayInBed !== '';
    case 'workdayAlarm':
      return data.workdayUseAlarm !== '';
    case 'differentSleep':
      return data.differentSleepPattern !== '';
    case 'nonWorkdaySleep':
      if (data.differentSleepPattern === 'no') return true;
      return (
        isValidTime(data.nonWorkdayBedtimeHour, data.nonWorkdayBedtimeMinute) &&
        isValidTime(data.nonWorkdayWaketimeHour, data.nonWorkdayWaketimeMinute)
      );
    case 'nonWorkdayFallAsleep':
      if (data.differentSleepPattern === 'no') return true;
      return data.nonWorkdayFallAsleepDuration !== '';
    case 'nonWorkdayStayInBed':
      if (data.differentSleepPattern === 'no') return true;
      return data.nonWorkdayStayInBed !== '';
    case 'nonWorkdayAlarm':
      if (data.differentSleepPattern === 'no') return true;
      return data.nonWorkdayUseAlarm !== '';
    case 'sleepLonger':
      if (data.differentSleepPattern === 'no') return true;
      return data.sleepLongerNonWorkday !== '';
    case 'exercise':
      return data.exerciseDaysPerWeek >= 0 && data.exerciseDaysPerWeek <= 7;
    case 'meals': {
      const hasBreakfast = data.skipBreakfast || isValidTime(data.breakfastHour, data.breakfastMinute);
      const hasLunch = data.skipLunch || isValidTime(data.lunchHour, data.lunchMinute);
      const hasDinner = data.skipDinner || isValidTime(data.dinnerHour, data.dinnerMinute);
      return hasBreakfast && hasLunch && hasDinner;
    }
    case 'contact':
      return data.firstName.trim().length > 0 && data.lastName.trim().length > 0 && isValidEmail(data.email);
    default:
      return assertNever(step);
  }
}

export function getValidationError(step: SurveyStepId, data: SurveyData): string {
  switch (step) {
    case 'welcome':
    case 'workIntro':
    case 'lifestyleIntro':
    case 'calculating':
    case 'result':
    case 'schedule':
    case 'done':
    case 'workLifeBalance':
    case 'stress':
      return '';
    case 'birthYear': {
      if (!data.birthYear) return 'Enter your birth year';
      if (!isValidBirthYear(data.birthYear)) {
        const year = parseInt(data.birthYear, 10);
        const currentYear = new Date().getFullYear();
        const age = currentYear - year;
        if (year > currentYear) return 'Birth year cannot be in the future';
        if (age < 18) return 'You must be at least 18 years old';
        return 'Enter a valid birth year';
      }
      return '';
    }
    case 'gender':
      return data.gender ? '' : 'Select your gender';
    case 'timezone':
      return data.timezone ? '' : 'Select your timezone';
    case 'workHours':
      if (!isValidTime(data.workStartHour, data.workStartMinute)) return 'Enter your work start time';
      if (!isValidTime(data.workEndHour, data.workEndMinute)) return 'Enter your work end time';
      if (!isTimeAfter(data.workStartHour, data.workStartMinute, data.workEndHour, data.workEndMinute)) {
        return 'Work end time must be after start time';
      }
      return '';
    case 'workdaySleep':
      if (!isValidTime(data.workdayBedtimeHour, data.workdayBedtimeMinute)) return 'Enter your bedtime';
      if (!isValidTime(data.workdayWaketimeHour, data.workdayWaketimeMinute)) return 'Enter your wake time';
      if (
        !isValidSleepTime(
          data.workdayBedtimeHour,
          data.workdayBedtimeMinute,
          data.workdayWaketimeHour,
          data.workdayWaketimeMinute,
        )
      ) {
        return 'Wake time cannot be the same as bedtime';
      }
      return '';
    case 'workdayFallAsleep':
      return data.workdayFallAsleepDuration ? '' : 'Select an option';
    case 'workdayStayInBed':
      return data.workdayStayInBed ? '' : 'Select an option';
    case 'workdayAlarm':
      return data.workdayUseAlarm ? '' : 'Select an option';
    case 'differentSleep':
      return data.differentSleepPattern ? '' : 'Select an option';
    case 'nonWorkdaySleep':
      if (data.differentSleepPattern === 'no') return '';
      if (!isValidTime(data.nonWorkdayBedtimeHour, data.nonWorkdayBedtimeMinute)) return 'Enter your bedtime';
      if (!isValidTime(data.nonWorkdayWaketimeHour, data.nonWorkdayWaketimeMinute)) return 'Enter your wake time';
      if (
        !isValidSleepTime(
          data.nonWorkdayBedtimeHour,
          data.nonWorkdayBedtimeMinute,
          data.nonWorkdayWaketimeHour,
          data.nonWorkdayWaketimeMinute,
        )
      ) {
        return 'Wake time cannot be the same as bedtime';
      }
      return '';
    case 'nonWorkdayFallAsleep':
      if (data.differentSleepPattern === 'no') return '';
      return data.nonWorkdayFallAsleepDuration ? '' : 'Select an option';
    case 'nonWorkdayStayInBed':
      if (data.differentSleepPattern === 'no') return '';
      return data.nonWorkdayStayInBed ? '' : 'Select an option';
    case 'nonWorkdayAlarm':
      if (data.differentSleepPattern === 'no') return '';
      return data.nonWorkdayUseAlarm ? '' : 'Select an option';
    case 'sleepLonger':
      if (data.differentSleepPattern === 'no') return '';
      return data.sleepLongerNonWorkday ? '' : 'Select an option';
    case 'exercise':
      if (data.exerciseDaysPerWeek < 0 || data.exerciseDaysPerWeek > 7) {
        return 'Select how many days per week you exercise';
      }
      return '';
    case 'meals': {
      const hasBreakfast = data.skipBreakfast || isValidTime(data.breakfastHour, data.breakfastMinute);
      const hasLunch = data.skipLunch || isValidTime(data.lunchHour, data.lunchMinute);
      const hasDinner = data.skipDinner || isValidTime(data.dinnerHour, data.dinnerMinute);
      if (!hasBreakfast) return 'Enter breakfast time or mark as N/A';
      if (!hasLunch) return 'Enter lunch time or mark as N/A';
      if (!hasDinner) return 'Enter dinner time or mark as N/A';
      return '';
    }
    case 'contact':
      if (!data.firstName.trim()) return 'Enter your first name';
      if (!data.lastName.trim()) return 'Enter your last name';
      if (!data.email) return 'Enter your email address';
      if (!isValidEmail(data.email)) return 'Enter a valid email address';
      return '';
    default:
      return assertNever(step);
  }
}

export function stepQuestionLabel(step: SurveyStepId): string {
  switch (step) {
    case 'welcome':
      return 'welcome';
    case 'birthYear':
      return 'birth_year';
    case 'gender':
      return 'gender';
    case 'timezone':
      return 'timezone';
    case 'workIntro':
      return 'work_intro';
    case 'workLifeBalance':
      return 'work_life_balance';
    case 'stress':
      return 'stress_level';
    case 'workHours':
      return 'work_hours';
    case 'workdaySleep':
      return 'workday_sleep';
    case 'workdayFallAsleep':
      return 'workday_fall_asleep';
    case 'workdayStayInBed':
      return 'workday_stay_in_bed';
    case 'workdayAlarm':
      return 'workday_alarm';
    case 'lifestyleIntro':
      return 'lifestyle_intro';
    case 'differentSleep':
      return 'different_sleep';
    case 'nonWorkdaySleep':
      return 'non_workday_sleep';
    case 'nonWorkdayFallAsleep':
      return 'non_workday_fall_asleep';
    case 'nonWorkdayStayInBed':
      return 'non_workday_stay_in_bed';
    case 'nonWorkdayAlarm':
      return 'non_workday_alarm';
    case 'sleepLonger':
      return 'sleep_longer';
    case 'exercise':
      return 'exercise';
    case 'meals':
      return 'meals';
    case 'contact':
      return 'contact';
    case 'calculating':
      return 'calculating';
    case 'result':
      return 'result';
    case 'schedule':
      return 'schedule';
    case 'done':
      return 'done';
    default:
      return assertNever(step);
  }
}
