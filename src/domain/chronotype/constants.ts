export const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'GMT (London)' },
  { value: 'Europe/Paris', label: 'Central European Time (Paris)' },
  { value: 'Europe/Athens', label: 'Eastern European Time (Athens)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (Dubai)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (Mumbai)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (Shanghai)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (Tokyo)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (Sydney)' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time (Auckland)' },
] as const;

export const TIMEZONE_ALIASES: Record<string, string> = {
  'Asia/Calcutta': 'Asia/Kolkata',
};

export const SLEEP_DURATIONS = [
  { value: '<5', label: 'Less than 5 minutes' },
  { value: '5-15', label: '5-15 minutes' },
  { value: '15-30', label: '15-30 minutes' },
  { value: '30-60', label: '30-60 minutes' },
  { value: '60+', label: 'More than 60 minutes' },
] as const;

export const EXERCISE_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 1, label: '1 day' },
  { value: 2, label: '2 days' },
  { value: 3, label: '3 days' },
  { value: 4, label: '4 days' },
  { value: 5, label: '5 days' },
  { value: 6, label: '6 days' },
  { value: 7, label: 'Every day' },
] as const;

export const GENDER_OPTIONS = [
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
  { value: 'Nonbinary', label: 'Nonbinary' },
] as const;

export const CHRONOTYPE_INFO = {
  horizon: {
    name: 'Horizon',
    description: 'You work best in the morning.',
    characteristics:
      'You have a natural tendency to be alert, energetic, and productive in the early part of the day, preferring to wake up early and go to bed early.',
  },
  apex: {
    name: 'Apex',
    description: 'You are aligned with the sun.',
    characteristics:
      "You have a neutral preference for when you feel most alert and don't have a strong preference for morning or evening activities.",
  },
  aurora: {
    name: 'Aurora',
    description: 'You work best in the afternoon.',
    characteristics:
      'You have a preference for being more alert in the evening and later at night. You also tend to sleep and wake up later in the day.',
  },
} as const;

export const CHRONOTYPE_WINDOWS = {
  horizon: {
    firstPeakStart: '7:30 AM',
    firstPeakEnd: '10:00 AM',
    secondPeakStart: '2:00 PM',
    secondPeakEnd: '4:00 PM',
  },
  apex: {
    firstPeakStart: '9:00 AM',
    firstPeakEnd: '11:30 AM',
    secondPeakStart: '3:30 PM',
    secondPeakEnd: '5:30 PM',
  },
  aurora: {
    firstPeakStart: '10:30 AM',
    firstPeakEnd: '1:00 PM',
    secondPeakStart: '6:00 PM',
    secondPeakEnd: '8:00 PM',
  },
} as const;
