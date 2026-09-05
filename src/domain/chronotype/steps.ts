export const SURVEY_STEP_IDS = [
  'welcome',
  'birthYear',
  'gender',
  'timezone',
  'workIntro',
  'workLifeBalance',
  'stress',
  'workHours',
  'workdaySleep',
  'workdayFallAsleep',
  'workdayStayInBed',
  'workdayAlarm',
  'lifestyleIntro',
  'differentSleep',
  'nonWorkdaySleep',
  'nonWorkdayFallAsleep',
  'nonWorkdayStayInBed',
  'nonWorkdayAlarm',
  'sleepLonger',
  'exercise',
  'meals',
  'contact',
  'calculating',
  'result',
  'schedule',
  'done',
] as const;

export type SurveyStepId = (typeof SURVEY_STEP_IDS)[number];

const NON_WORKDAY_STEPS: SurveyStepId[] = [
  'nonWorkdaySleep',
  'nonWorkdayFallAsleep',
  'nonWorkdayStayInBed',
  'nonWorkdayAlarm',
  'sleepLonger',
];

export function isNonWorkdayStep(step: SurveyStepId): boolean {
  return NON_WORKDAY_STEPS.includes(step);
}

export function getVisibleSteps(differentSleepPattern: string): SurveyStepId[] {
  if (differentSleepPattern === 'no') {
    return SURVEY_STEP_IDS.filter((step) => !isNonWorkdayStep(step));
  }
  return [...SURVEY_STEP_IDS];
}

export function getQuestionSteps(differentSleepPattern: string): SurveyStepId[] {
  return getVisibleSteps(differentSleepPattern).filter(
    (step) => step !== 'calculating' && step !== 'result' && step !== 'schedule' && step !== 'done',
  );
}

export type SurveyChapter = 'arrival' | 'you' | 'work' | 'rest' | 'close' | 'report';

export function isQuestionStep(step: SurveyStepId): boolean {
  switch (step) {
    case 'welcome':
    case 'workIntro':
    case 'lifestyleIntro':
    case 'calculating':
    case 'result':
    case 'schedule':
    case 'done':
      return false;
    case 'birthYear':
    case 'gender':
    case 'timezone':
    case 'workLifeBalance':
    case 'stress':
    case 'workHours':
    case 'workdaySleep':
    case 'workdayFallAsleep':
    case 'workdayStayInBed':
    case 'workdayAlarm':
    case 'differentSleep':
    case 'nonWorkdaySleep':
    case 'nonWorkdayFallAsleep':
    case 'nonWorkdayStayInBed':
    case 'nonWorkdayAlarm':
    case 'sleepLonger':
    case 'exercise':
    case 'meals':
    case 'contact':
      return true;
    default:
      return assertNever(step);
  }
}

export function stepChapter(step: SurveyStepId): SurveyChapter {
  switch (step) {
    case 'welcome':
      return 'arrival';
    case 'birthYear':
    case 'gender':
    case 'timezone':
      return 'you';
    case 'workIntro':
    case 'workLifeBalance':
    case 'stress':
    case 'workHours':
    case 'workdaySleep':
    case 'workdayFallAsleep':
    case 'workdayStayInBed':
    case 'workdayAlarm':
      return 'work';
    case 'lifestyleIntro':
    case 'differentSleep':
    case 'nonWorkdaySleep':
    case 'nonWorkdayFallAsleep':
    case 'nonWorkdayStayInBed':
    case 'nonWorkdayAlarm':
    case 'sleepLonger':
    case 'exercise':
    case 'meals':
      return 'rest';
    case 'contact':
      return 'close';
    case 'calculating':
    case 'result':
    case 'schedule':
    case 'done':
      return 'report';
    default:
      return assertNever(step);
  }
}

export function footerNextLabel(step: SurveyStepId): string {
  switch (step) {
    case 'contact':
      return 'See results';
    case 'done':
      return 'Start over';
    case 'welcome':
    case 'birthYear':
    case 'gender':
    case 'timezone':
    case 'workIntro':
    case 'workLifeBalance':
    case 'stress':
    case 'workHours':
    case 'workdaySleep':
    case 'workdayFallAsleep':
    case 'workdayStayInBed':
    case 'workdayAlarm':
    case 'lifestyleIntro':
    case 'differentSleep':
    case 'nonWorkdaySleep':
    case 'nonWorkdayFallAsleep':
    case 'nonWorkdayStayInBed':
    case 'nonWorkdayAlarm':
    case 'sleepLonger':
    case 'exercise':
    case 'meals':
    case 'calculating':
    case 'result':
    case 'schedule':
      return 'Next';
    default:
      return assertNever(step);
  }
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled survey step: ${String(value)}`);
}
