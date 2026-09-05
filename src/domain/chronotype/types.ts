export type Gender = 'Female' | 'Male' | 'Nonbinary';
export type YesNo = 'yes' | 'no';
export type YesNoSometimes = 'yes' | 'no' | 'sometimes';
export type SleepDuration = '<5' | '5-15' | '15-30' | '30-60' | '60+';
export type Chronotype = 'horizon' | 'apex' | 'aurora';

export interface SurveyData {
  firstName: string;
  lastName: string;
  email: string;
  birthYear: string;
  gender: Gender | '';
  timezone: string;
  city: string;
  role: string;
  workLifeBalance: number;
  stressLevel: number;
  workStartHour: string;
  workStartMinute: string;
  workEndHour: string;
  workEndMinute: string;
  workdayBedtimeHour: string;
  workdayBedtimeMinute: string;
  workdayWaketimeHour: string;
  workdayWaketimeMinute: string;
  workdayFallAsleepDuration: SleepDuration | '';
  workdayStayInBed: SleepDuration | '';
  workdayUseAlarm: YesNo | '';
  workdayFeelRefreshed: number;
  differentSleepPattern: YesNo | '';
  nonWorkdayBedtimeHour: string;
  nonWorkdayBedtimeMinute: string;
  nonWorkdayWaketimeHour: string;
  nonWorkdayWaketimeMinute: string;
  nonWorkdayFallAsleepDuration: SleepDuration | '';
  nonWorkdayStayInBed: SleepDuration | '';
  nonWorkdayUseAlarm: YesNo | '';
  sleepLongerNonWorkday: YesNoSometimes | '';
  exerciseDaysPerWeek: number;
  skipBreakfast: boolean;
  breakfastHour: string;
  breakfastMinute: string;
  skipLunch: boolean;
  lunchHour: string;
  lunchMinute: string;
  skipDinner: boolean;
  dinnerHour: string;
  dinnerMinute: string;
  caffeineLevel: number;
}

export interface ChronotypeResult {
  chronotype: Chronotype;
  score: number;
  description: string;
  characteristics: string;
  firstPeakStart: string;
  firstPeakEnd: string;
  secondPeakStart: string;
  secondPeakEnd: string;
  naturalWakeTime: string;
  optimalWakeTime?: string;
  optimalBedtime: string;
}

export const INITIAL_SURVEY_DATA: SurveyData = {
  firstName: '',
  lastName: '',
  email: '',
  birthYear: '',
  gender: '',
  timezone: '',
  city: '',
  role: '',
  workLifeBalance: 50,
  stressLevel: 50,
  workStartHour: '',
  workStartMinute: '',
  workEndHour: '',
  workEndMinute: '',
  workdayBedtimeHour: '',
  workdayBedtimeMinute: '',
  workdayWaketimeHour: '',
  workdayWaketimeMinute: '',
  workdayFallAsleepDuration: '',
  workdayStayInBed: '',
  workdayUseAlarm: '',
  workdayFeelRefreshed: 3,
  differentSleepPattern: '',
  nonWorkdayBedtimeHour: '',
  nonWorkdayBedtimeMinute: '',
  nonWorkdayWaketimeHour: '',
  nonWorkdayWaketimeMinute: '',
  nonWorkdayFallAsleepDuration: '',
  nonWorkdayStayInBed: '',
  nonWorkdayUseAlarm: '',
  sleepLongerNonWorkday: '',
  exerciseDaysPerWeek: -1,
  skipBreakfast: false,
  breakfastHour: '',
  breakfastMinute: '',
  skipLunch: false,
  lunchHour: '',
  lunchMinute: '',
  skipDinner: false,
  dinnerHour: '',
  dinnerMinute: '',
  caffeineLevel: 50,
};
