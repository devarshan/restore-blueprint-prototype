import { useEffect, useMemo, useRef, useState } from 'react';
import { calculateChronotype, formatPeakHours } from '../../domain/chronotype/calculator';
import {
  footerNextLabel,
  getVisibleSteps,
  isQuestionStep,
  stepChapter,
  type SurveyStepId,
  assertNever,
} from '../../domain/chronotype/steps';
import { getValidationError, isStepComplete, stepQuestionLabel } from '../../domain/chronotype/validation';
import { TIMEZONE_ALIASES } from '../../domain/chronotype/constants';
import { displayCampaignName } from '../../infra/campaign';
import { completeSurvey, getCampaign, identifyVisitor, trackEvent, type CampaignRecord } from '../../infra/api';
import { env } from '../../infra/env';
import {
  allowPinchZoom,
  deviceFingerprint,
  getCampaignSlug,
  getOrCreateSessionId,
  getOrCreateVisitorToken,
  parseUtm,
} from '../tracking/client';
import { SurveyChrome } from './SurveyChrome';
import { SurveyStep } from './SurveyStep';
import { useSurveyStore } from './store';

interface SurveyFlowProps {
  embed?: boolean;
}

const CALCULATE_DWELL_MS = 1600;

export function SurveyFlow({ embed = false }: SurveyFlowProps) {
  const { data, step, result, emailSent, updateData, setStep, setResult, setEmailSent, reset } = useSurveyStore();
  const [campaign, setCampaign] = useState<CampaignRecord | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const stepEnteredAt = useRef(Date.now());
  const identified = useRef(false);

  const slug = getCampaignSlug();
  const visible = useMemo(() => getVisibleSteps(data.differentSleepPattern), [data.differentSleepPattern]);
  const questions = useMemo(() => visible.filter(isQuestionStep), [visible]);
  const questionIndex = questions.indexOf(step);
  const progressPercent =
    questionIndex < 0
      ? stepChapter(step) === 'report'
        ? 100
        : 0
      : Math.round(((questionIndex + 1) / questions.length) * 100);
  const campaignLabel = displayCampaignName(campaign?.name, campaign?.slug);

  useEffect(() => {
    allowPinchZoom();
  }, []);

  useEffect(() => {
    if (step === 'calculating' && !busy) setStep('contact');
  }, [busy, setStep, step]);

  useEffect(() => {
    getCampaign(slug)
      .then((payload) =>
        setCampaign(payload.campaign ?? { id: 0, name: 'Restore', slug, email_template_key: 'default' }),
      )
      .catch(() => setCampaign({ id: 0, name: 'Restore', slug, email_template_key: 'default' }));
  }, [slug]);

  useEffect(() => {
    if (data.timezone) return;
    const raw = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tz = TIMEZONE_ALIASES[raw] || raw;
    if (tz) updateData({ timezone: tz });
    // Seed once from the device clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (identified.current) return;
    identified.current = true;
    const visitorToken = getOrCreateVisitorToken();
    deviceFingerprint()
      .then((fingerprint) =>
        identifyVisitor({
          visitorToken,
          fingerprint,
          userAgent: navigator.userAgent,
          referrerUrl: document.referrer || undefined,
          utm: parseUtm(),
        }),
      )
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    stepEnteredAt.current = Date.now();
    void sendTrack('view', step);
    const heading = document.getElementById('step-title');
    heading?.focus({ preventScroll: true });
    const scroller = heading?.closest('main');
    scroller?.scrollTo({ top: 0 });
    // Track the visible step only. sendTrack reads latest store data on each call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    const onHide = () => {
      if (step === 'done' || step === 'result' || step === 'schedule') return;
      void sendTrack('abandon', step, true);
    };
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function sendTrack(
    interactionType: 'view' | 'next' | 'back' | 'complete' | 'abandon',
    current: SurveyStepId,
    keepalive = false,
  ) {
    const body = {
      visitorToken: getOrCreateVisitorToken(),
      campaignSlug: slug,
      sessionId: getOrCreateSessionId(),
      currentStep: visible.indexOf(current),
      totalSteps: visible.length,
      timeSpentOnStepMs: Date.now() - stepEnteredAt.current,
      interactionType,
      completed: current === 'done' || current === 'result' || current === 'schedule',
      question: stepQuestionLabel(current),
      answer: answerForStep(current),
    };

    if (keepalive) {
      try {
        await fetch(`${env.serverUrl}/track/event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.anonKey}`,
          },
          body: JSON.stringify(body),
          keepalive: true,
        });
      } catch {
        return;
      }
      return;
    }

    try {
      await trackEvent(body);
    } catch {
      return;
    }
  }

  function answerForStep(current: SurveyStepId): unknown {
    switch (current) {
      case 'birthYear':
        return data.birthYear;
      case 'gender':
        return data.gender;
      case 'timezone':
        return data.timezone;
      case 'workLifeBalance':
        return data.workLifeBalance;
      case 'stress':
        return data.stressLevel;
      case 'workHours':
        return { start: `${data.workStartHour}:${data.workStartMinute}`, end: `${data.workEndHour}:${data.workEndMinute}` };
      case 'workdaySleep':
        return {
          bedtime: `${data.workdayBedtimeHour}:${data.workdayBedtimeMinute}`,
          wake: `${data.workdayWaketimeHour}:${data.workdayWaketimeMinute}`,
        };
      case 'workdayFallAsleep':
        return data.workdayFallAsleepDuration;
      case 'workdayStayInBed':
        return data.workdayStayInBed;
      case 'workdayAlarm':
        return data.workdayUseAlarm;
      case 'differentSleep':
        return data.differentSleepPattern;
      case 'nonWorkdaySleep':
        return {
          bedtime: `${data.nonWorkdayBedtimeHour}:${data.nonWorkdayBedtimeMinute}`,
          wake: `${data.nonWorkdayWaketimeHour}:${data.nonWorkdayWaketimeMinute}`,
        };
      case 'nonWorkdayFallAsleep':
        return data.nonWorkdayFallAsleepDuration;
      case 'nonWorkdayStayInBed':
        return data.nonWorkdayStayInBed;
      case 'nonWorkdayAlarm':
        return data.nonWorkdayUseAlarm;
      case 'sleepLonger':
        return data.sleepLongerNonWorkday;
      case 'exercise':
        return data.exerciseDaysPerWeek;
      case 'meals':
        return {
          breakfast: data.skipBreakfast ? 'n/a' : `${data.breakfastHour}:${data.breakfastMinute}`,
          lunch: data.skipLunch ? 'n/a' : `${data.lunchHour}:${data.lunchMinute}`,
          dinner: data.skipDinner ? 'n/a' : `${data.dinnerHour}:${data.dinnerMinute}`,
        };
      case 'contact':
        return { firstName: data.firstName, lastName: data.lastName, email: data.email };
      case 'welcome':
      case 'workIntro':
      case 'lifestyleIntro':
      case 'calculating':
      case 'result':
      case 'schedule':
      case 'done':
        return null;
      default:
        return assertNever(current);
    }
  }

  function goTo(next: SurveyStepId, direction: 'next' | 'back') {
    void sendTrack(direction, step);
    setError('');
    setStep(next);
  }

  async function handleNext() {
    if (!isStepComplete(step, data)) {
      setError(getValidationError(step, data) || 'Complete this step to continue');
      return;
    }

    if (step === 'contact') {
      setBusy(true);
      setStep('calculating');
      try {
        const calculated = calculateChronotype(data);
        setResult(calculated);
        const peakHours = formatPeakHours(calculated);
        const [, completion] = await Promise.all([
          new Promise((resolve) => {
            window.setTimeout(resolve, CALCULATE_DWELL_MS);
          }),
          completeSurvey({
            visitorToken: getOrCreateVisitorToken(),
            campaignSlug: slug,
            sessionId: getOrCreateSessionId(),
            email: data.email.trim(),
            fullName: `${data.firstName.trim()} ${data.lastName.trim()}`,
            chronotype: calculated.chronotype,
            peakHours,
            allResponses: data,
            result: calculated,
          }),
        ]);
        setEmailSent(completion.emailSent);
        await sendTrack('complete', 'contact');
        setStep('result');
      } catch {
        setResult(null);
        setEmailSent(false);
        setError('We could not save your results. Try again.');
        setStep('contact');
      } finally {
        setBusy(false);
      }
      return;
    }

    const index = visible.indexOf(step);
    const next = visible[index + 1];
    if (!next) return;
    goTo(next, 'next');
  }

  function handleBack() {
    const index = visible.indexOf(step);
    const prev = visible[index - 1];
    if (!prev) return;
    goTo(prev, 'back');
  }

  const showBack = step !== 'welcome' && step !== 'calculating';
  const showFooter = step !== 'calculating';
  const showHeader = true;
  const nextLabel = footerNextLabel(step);
  const nextDisabled = busy || (showFooter && step !== 'done' && !isStepComplete(step, data));
  const stepHint =
    showFooter && step !== 'done' && !isStepComplete(step, data)
      ? getValidationError(step, data) || 'Complete this step to continue'
      : '';

  function onFooterNext() {
    if (step === 'done') {
      reset();
      return;
    }
    void handleNext();
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Enter' || nextDisabled || !showFooter) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'SELECT') return;
      event.preventDefault();
      onFooterNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (campaign === null) {
    return (
      <SurveyChrome
        embed={embed}
        paneKey="loading"
        showProgress={false}
        showBack={false}
        showFooter={false}
        progressPercent={0}
        nextDisabled
        onBack={() => undefined}
        onNext={() => undefined}
      >
        <div className="survey-stage is-status">
          <p className="survey-body">Loading survey</p>
        </div>
      </SurveyChrome>
    );
  }

  return (
    <SurveyChrome
      embed={embed}
      paneKey={step}
      campaignName={step === 'schedule' ? undefined : campaignLabel}
      progressPercent={progressPercent}
      showProgress={isQuestionStep(step)}
      showHeader={showHeader}
      showBack={showBack}
      showFooter={showFooter}
      nextDisabled={nextDisabled}
      nextHint={stepHint || undefined}
      nextLabel={nextLabel}
      onBack={handleBack}
      onNext={onFooterNext}
    >
      <SurveyStep
        step={step}
        data={data}
        result={result}
        emailSent={emailSent}
        campaignName={campaignLabel}
        updateData={updateData}
      />
      {error ? (
        <p className="mt-6 font-sans text-sm text-[#f0b4b4]" role="alert">
          {error}
        </p>
      ) : stepHint ? (
        <p className="field-hint" role="status">
          {stepHint}
        </p>
      ) : null}
    </SurveyChrome>
  );
}
