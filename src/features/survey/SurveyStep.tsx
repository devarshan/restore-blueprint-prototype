import { useEffect, useState } from 'react';
import { EXERCISE_OPTIONS, GENDER_OPTIONS, SLEEP_DURATIONS, TIMEZONES } from '../../domain/chronotype/constants';
import { assertNever, type SurveyStepId } from '../../domain/chronotype/steps';
import type { ChronotypeResult, SurveyData } from '../../domain/chronotype/types';
import { isValidTime } from '../../domain/chronotype/validation';
import { SchedulePanel } from './SchedulePanel';
import { TimePicker } from './TimePicker';
import { Body, ChoiceButton, Eyebrow, FieldLabel, SliderField, Title } from './ui';

function TimeField({
  id,
  label,
  hour,
  minute,
  defaultPeriod,
  onHour,
  onMinute,
}: {
  id: string;
  label: string;
  hour: string;
  minute: string;
  defaultPeriod: 'AM' | 'PM';
  onHour: (value: string) => void;
  onMinute: (value: string) => void;
}) {
  const incomplete = !isValidTime(hour, minute);
  return (
    <div>
      <FieldLabel id={id} required={incomplete}>
        {label}
      </FieldLabel>
      <TimePicker
        labelledBy={id}
        hour={hour}
        minute={minute}
        onHourChange={onHour}
        onMinuteChange={onMinute}
        defaultPeriod={defaultPeriod}
        incomplete={incomplete}
      />
    </div>
  );
}

function MealRow({
  id,
  label,
  skipped,
  hour,
  minute,
  defaultPeriod,
  onSkip,
  onHour,
  onMinute,
}: {
  id: string;
  label: string;
  skipped: boolean;
  hour: string;
  minute: string;
  defaultPeriod: 'AM' | 'PM';
  onSkip: (skipped: boolean) => void;
  onHour: (value: string) => void;
  onMinute: (value: string) => void;
}) {
  const incomplete = !skipped && !isValidTime(hour, minute);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <FieldLabel id={id} required={incomplete}>
          {label}
        </FieldLabel>
        <label className="inline-flex min-h-11 items-center gap-2 font-sans text-sm text-white">
          <input
            type="checkbox"
            checked={skipped}
            onChange={(event) => onSkip(event.target.checked)}
            className="size-5 accent-[#bee1e3]"
          />
          N/A
        </label>
      </div>
      <TimePicker
        labelledBy={id}
        hour={hour}
        minute={minute}
        onHourChange={onHour}
        onMinuteChange={onMinute}
        defaultPeriod={defaultPeriod}
        disabled={skipped}
        incomplete={incomplete}
      />
    </div>
  );
}

function CalculatingStatus() {
  const [percent, setPercent] = useState(6);

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - started;
      setPercent(Math.min(96, Math.round(6 + (elapsed / 2400) * 90)));
    }, 80);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="survey-stage is-status">
      <div className="survey-status-stack">
        <div className="survey-spinner" aria-hidden="true" />
        <Eyebrow>Working</Eyebrow>
        <Title className="mt-3">Mapping your chronotype</Title>
        <div className="survey-map-progress" aria-hidden="true">
          <span style={{ width: `${percent}%` }} />
        </div>
        <p className="survey-map-percent" aria-live="polite">
          {percent}%
        </p>
      </div>
    </div>
  );
}

function timezoneChoices(current: string) {
  if (current && !TIMEZONES.some((zone) => zone.value === current)) {
    return [{ value: current, label: current.replace(/_/g, ' ') }, ...TIMEZONES];
  }
  return TIMEZONES;
}

interface SurveyStepProps {
  step: SurveyStepId;
  data: SurveyData;
  result: ChronotypeResult | null;
  emailSent: boolean | null;
  campaignName?: string;
  updateData: (updates: Partial<SurveyData>) => void;
}

export function SurveyStep({ step, data, result, emailSent, campaignName, updateData }: SurveyStepProps) {
  switch (step) {
    case 'welcome':
      return (
        <div className="survey-stage">
          <Title>Let your body design your day.</Title>
          <Body>
            {campaignName
              ? `A short Restore survey for ${campaignName}. We will map your high-performing hours and chronotype.`
              : 'A short Restore survey. We will map your high-performing hours and chronotype.'}
          </Body>
        </div>
      );
    case 'birthYear':
      return (
        <div>
          <Title>What year were you born?</Title>
          <Body>You must be 18 or older.</Body>
          <div className="survey-fields">
            <FieldLabel htmlFor="birthYear" required={!data.birthYear}>
              Birth year
            </FieldLabel>
            <input
              id="birthYear"
              type="number"
              inputMode="numeric"
              value={data.birthYear}
              onChange={(event) => updateData({ birthYear: event.target.value })}
              placeholder="1990"
              min={new Date().getFullYear() - 120}
              max={new Date().getFullYear() - 18}
              className="field-input"
              aria-invalid={!data.birthYear ? true : undefined}
            />
          </div>
        </div>
      );
    case 'gender':
      return (
        <div>
          <Title>What is your gender?</Title>
          <div className="survey-choices">
            {GENDER_OPTIONS.map((option) => (
              <ChoiceButton
                key={option.value}
                selected={data.gender === option.value}
                onClick={() => updateData({ gender: option.value })}
              >
                {option.label}
              </ChoiceButton>
            ))}
          </div>
        </div>
      );
    case 'timezone':
      return (
        <div>
          <Title>What is your timezone?</Title>
          <div className="survey-fields">
            <FieldLabel htmlFor="timezone" required={!data.timezone}>
              Timezone
            </FieldLabel>
            <select
              id="timezone"
              value={data.timezone}
              onChange={(event) => updateData({ timezone: event.target.value })}
              className="field-select"
            >
              <option value="">Select timezone</option>
              {timezoneChoices(data.timezone).map((tz) => (
                <option key={tz.value} value={tz.value} className="text-black">
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    case 'workIntro':
      return (
        <div className="survey-stage">
          <Title>Let us talk about your work.</Title>
          <Body>Your work hours help us place peak windows on a real day, not an ideal one.</Body>
        </div>
      );
    case 'workLifeBalance':
      return (
        <div>
          <Title>How would you rate your work-life balance?</Title>
          <SliderField
            id="workLifeBalance"
            value={data.workLifeBalance}
            onChange={(value) => updateData({ workLifeBalance: value })}
            lowLabel="Poor"
            highLabel="Excellent"
          />
        </div>
      );
    case 'stress':
      return (
        <div>
          <Title>What is your daily stress level?</Title>
          <SliderField
            id="stress"
            value={data.stressLevel}
            onChange={(value) => updateData({ stressLevel: value })}
            lowLabel="Stressed"
            highLabel="Relaxed"
          />
        </div>
      );
    case 'workHours':
      return (
        <div>
          <Title>What time do you start and end work?</Title>
          <Body>Type the hour and minutes.</Body>
          <div className="survey-times">
            <TimeField
              id="work-start"
              label="Work start time"
              hour={data.workStartHour}
              minute={data.workStartMinute}
              defaultPeriod="AM"
              onHour={(hour) => updateData({ workStartHour: hour })}
              onMinute={(minute) => updateData({ workStartMinute: minute })}
            />
            <TimeField
              id="work-end"
              label="Work end time"
              hour={data.workEndHour}
              minute={data.workEndMinute}
              defaultPeriod="PM"
              onHour={(hour) => updateData({ workEndHour: hour })}
              onMinute={(minute) => updateData({ workEndMinute: minute })}
            />
          </div>
        </div>
      );
    case 'workdaySleep':
      return (
        <div>
          <Title>What are your typical sleep times on work nights?</Title>
          <Body>Type the hour and minutes.</Body>
          <div className="survey-times">
            <TimeField
              id="work-bed"
              label="Bedtime"
              hour={data.workdayBedtimeHour}
              minute={data.workdayBedtimeMinute}
              defaultPeriod="PM"
              onHour={(hour) => updateData({ workdayBedtimeHour: hour })}
              onMinute={(minute) => updateData({ workdayBedtimeMinute: minute })}
            />
            <TimeField
              id="work-wake"
              label="Wake time"
              hour={data.workdayWaketimeHour}
              minute={data.workdayWaketimeMinute}
              defaultPeriod="AM"
              onHour={(hour) => updateData({ workdayWaketimeHour: hour })}
              onMinute={(minute) => updateData({ workdayWaketimeMinute: minute })}
            />
          </div>
        </div>
      );
    case 'workdayFallAsleep':
      return (
        <div>
          <Title>How long does it take you to fall asleep on work nights?</Title>
          <div className="survey-choices">
            {SLEEP_DURATIONS.map((option) => (
              <ChoiceButton
                key={option.value}
                selected={data.workdayFallAsleepDuration === option.value}
                onClick={() => updateData({ workdayFallAsleepDuration: option.value })}
              >
                {option.label}
              </ChoiceButton>
            ))}
          </div>
        </div>
      );
    case 'workdayStayInBed':
      return (
        <div>
          <Title>How long do you stay in bed after waking on work mornings?</Title>
          <div className="survey-choices">
            {SLEEP_DURATIONS.map((option) => (
              <ChoiceButton
                key={option.value}
                selected={data.workdayStayInBed === option.value}
                onClick={() => updateData({ workdayStayInBed: option.value })}
              >
                {option.label}
              </ChoiceButton>
            ))}
          </div>
        </div>
      );
    case 'workdayAlarm':
      return (
        <div>
          <Title>Do you use an alarm to wake up on work mornings?</Title>
          <div className="survey-choices">
            <ChoiceButton selected={data.workdayUseAlarm === 'yes'} onClick={() => updateData({ workdayUseAlarm: 'yes' })}>
              Yes
            </ChoiceButton>
            <ChoiceButton selected={data.workdayUseAlarm === 'no'} onClick={() => updateData({ workdayUseAlarm: 'no' })}>
              No
            </ChoiceButton>
          </div>
        </div>
      );
    case 'lifestyleIntro':
      return (
        <div className="survey-stage">
          <Title>Now, your lifestyle.</Title>
          <Body>Habits outside work tell us more about your natural rhythm.</Body>
        </div>
      );
    case 'differentSleep':
      return (
        <div>
          <Title>Is your sleep pattern different on non-work days?</Title>
          <div className="survey-choices">
            <ChoiceButton
              selected={data.differentSleepPattern === 'yes'}
              onClick={() => updateData({ differentSleepPattern: 'yes' })}
            >
              Yes
            </ChoiceButton>
            <ChoiceButton
              selected={data.differentSleepPattern === 'no'}
              onClick={() => updateData({ differentSleepPattern: 'no' })}
            >
              No, it is the same
            </ChoiceButton>
          </div>
        </div>
      );
    case 'nonWorkdaySleep':
      return (
        <div>
          <Title>What are your typical sleep times on non-work nights?</Title>
          <Body>Type the hour and minutes.</Body>
          <div className="survey-times">
            <TimeField
              id="free-bed"
              label="Bedtime"
              hour={data.nonWorkdayBedtimeHour}
              minute={data.nonWorkdayBedtimeMinute}
              defaultPeriod="PM"
              onHour={(hour) => updateData({ nonWorkdayBedtimeHour: hour })}
              onMinute={(minute) => updateData({ nonWorkdayBedtimeMinute: minute })}
            />
            <TimeField
              id="free-wake"
              label="Wake time"
              hour={data.nonWorkdayWaketimeHour}
              minute={data.nonWorkdayWaketimeMinute}
              defaultPeriod="AM"
              onHour={(hour) => updateData({ nonWorkdayWaketimeHour: hour })}
              onMinute={(minute) => updateData({ nonWorkdayWaketimeMinute: minute })}
            />
          </div>
        </div>
      );
    case 'nonWorkdayFallAsleep':
      return (
        <div>
          <Title>How long does it take you to fall asleep on non-work nights?</Title>
          <div className="survey-choices">
            {SLEEP_DURATIONS.map((option) => (
              <ChoiceButton
                key={option.value}
                selected={data.nonWorkdayFallAsleepDuration === option.value}
                onClick={() => updateData({ nonWorkdayFallAsleepDuration: option.value })}
              >
                {option.label}
              </ChoiceButton>
            ))}
          </div>
        </div>
      );
    case 'nonWorkdayStayInBed':
      return (
        <div>
          <Title>How long do you stay in bed after waking on non-work mornings?</Title>
          <div className="survey-choices">
            {SLEEP_DURATIONS.map((option) => (
              <ChoiceButton
                key={option.value}
                selected={data.nonWorkdayStayInBed === option.value}
                onClick={() => updateData({ nonWorkdayStayInBed: option.value })}
              >
                {option.label}
              </ChoiceButton>
            ))}
          </div>
        </div>
      );
    case 'nonWorkdayAlarm':
      return (
        <div>
          <Title>Do you use an alarm on non-work mornings?</Title>
          <div className="survey-choices">
            <ChoiceButton
              selected={data.nonWorkdayUseAlarm === 'yes'}
              onClick={() => updateData({ nonWorkdayUseAlarm: 'yes' })}
            >
              Yes
            </ChoiceButton>
            <ChoiceButton selected={data.nonWorkdayUseAlarm === 'no'} onClick={() => updateData({ nonWorkdayUseAlarm: 'no' })}>
              No
            </ChoiceButton>
          </div>
        </div>
      );
    case 'sleepLonger':
      return (
        <div>
          <Title>Do you sleep longer on non-work days?</Title>
          <div className="survey-choices">
            {(['yes', 'no', 'sometimes'] as const).map((value) => (
              <ChoiceButton
                key={value}
                selected={data.sleepLongerNonWorkday === value}
                onClick={() => updateData({ sleepLongerNonWorkday: value })}
              >
                {value === 'yes' ? 'Yes' : value === 'no' ? 'No' : 'Sometimes'}
              </ChoiceButton>
            ))}
          </div>
        </div>
      );
    case 'exercise':
      return (
        <div>
          <Title>How many days per week do you exercise?</Title>
          <div className="survey-choices">
            {EXERCISE_OPTIONS.map((option) => (
              <ChoiceButton
                key={option.value}
                selected={data.exerciseDaysPerWeek === option.value}
                onClick={() => updateData({ exerciseDaysPerWeek: option.value })}
              >
                {option.label}
              </ChoiceButton>
            ))}
          </div>
        </div>
      );
    case 'meals':
      return (
        <div>
          <Title>What are your typical meal times?</Title>
          <Body>Type each meal time, or mark N/A if you usually skip it.</Body>
          <div className="survey-times">
            <MealRow
              id="breakfast"
              label="Breakfast"
              skipped={data.skipBreakfast}
              hour={data.breakfastHour}
              minute={data.breakfastMinute}
              defaultPeriod="AM"
              onSkip={(skipped) => updateData({ skipBreakfast: skipped })}
              onHour={(hour) => updateData({ breakfastHour: hour })}
              onMinute={(minute) => updateData({ breakfastMinute: minute })}
            />
            <MealRow
              id="lunch"
              label="Lunch"
              skipped={data.skipLunch}
              hour={data.lunchHour}
              minute={data.lunchMinute}
              defaultPeriod="PM"
              onSkip={(skipped) => updateData({ skipLunch: skipped })}
              onHour={(hour) => updateData({ lunchHour: hour })}
              onMinute={(minute) => updateData({ lunchMinute: minute })}
            />
            <MealRow
              id="dinner"
              label="Dinner"
              skipped={data.skipDinner}
              hour={data.dinnerHour}
              minute={data.dinnerMinute}
              defaultPeriod="PM"
              onSkip={(skipped) => updateData({ skipDinner: skipped })}
              onHour={(hour) => updateData({ dinnerHour: hour })}
              onMinute={(minute) => updateData({ dinnerMinute: minute })}
            />
          </div>
        </div>
      );
    case 'contact':
      return (
        <div>
          <Title>Where should we send your results?</Title>
          <Body>Name and email only. We use this to send your chronotype report.</Body>
          <div className="survey-fields">
            <div>
              <FieldLabel htmlFor="firstName" required={!data.firstName.trim()}>
                First name
              </FieldLabel>
              <input
                id="firstName"
                value={data.firstName}
                onChange={(event) => updateData({ firstName: event.target.value })}
                className="field-input"
                autoComplete="given-name"
                aria-invalid={!data.firstName.trim() ? true : undefined}
              />
            </div>
            <div>
              <FieldLabel htmlFor="lastName" required={!data.lastName.trim()}>
                Last name
              </FieldLabel>
              <input
                id="lastName"
                value={data.lastName}
                onChange={(event) => updateData({ lastName: event.target.value })}
                className="field-input"
                autoComplete="family-name"
                aria-invalid={!data.lastName.trim() ? true : undefined}
              />
            </div>
            <div>
              <FieldLabel htmlFor="email" required={!data.email.trim()}>
                Email
              </FieldLabel>
              <input
                id="email"
                type="email"
                value={data.email}
                onChange={(event) => updateData({ email: event.target.value })}
                className="field-input"
                autoComplete="email"
                aria-invalid={!data.email.trim() ? true : undefined}
              />
            </div>
          </div>
        </div>
      );
    case 'calculating':
      return <CalculatingStatus />;
    case 'result':
      if (!result) {
        return (
          <div>
            <Title>We could not calculate a result.</Title>
            <Body>Go back and try again.</Body>
          </div>
        );
      }
      return (
        <div>
          <Eyebrow>Your chronotype</Eyebrow>
          <Title className="mt-2 capitalize">{result.chronotype}</Title>
          <Body>{result.description}</Body>
          <Body className="mt-4">{result.characteristics}</Body>
          <div className="mt-6 rounded-[12px] bg-white/10 p-4">
            <p className="font-sans text-sm font-bold text-white">Peak windows</p>
            <p className="mt-3 rounded-[12px] bg-[#102539] px-4 py-3 font-sans text-base font-bold text-white">
              {result.firstPeakStart} - {result.firstPeakEnd}
            </p>
            <p className="mt-2 rounded-[12px] bg-[#102539] px-4 py-3 font-sans text-base font-bold text-white">
              {result.secondPeakStart} - {result.secondPeakEnd}
            </p>
            <p className="mt-4 font-sans text-sm text-white/70">Natural wake {result.naturalWakeTime}</p>
            <p className="font-sans text-sm text-white/70">Optimal bedtime {result.optimalBedtime}</p>
          </div>
        </div>
      );
    case 'schedule':
      if (!result) {
        return (
          <div>
            <Title>We could not calculate a result.</Title>
            <Body>Go back and try again.</Body>
          </div>
        );
      }
      return <SchedulePanel result={result} />;
    case 'done':
      return (
        <div className="survey-stage">
          <div>
            {emailSent ? (
              <>
                <Title>Check your inbox.</Title>
                <Body className="break-words">We sent your chronotype report and schedule to {data.email}.</Body>
              </>
            ) : (
              <>
                <Title>Your results are saved.</Title>
                <Body>
                  We stored your chronotype. Email will follow if sending is available. You can still use the schedule on this
                  screen.
                </Body>
              </>
            )}
          </div>
        </div>
      );
    default:
      return assertNever(step);
  }
}
