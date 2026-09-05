import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { INITIAL_SURVEY_DATA, type ChronotypeResult, type SurveyData } from '../../domain/chronotype/types';
import type { SurveyStepId } from '../../domain/chronotype/steps';

interface SurveyStore {
  data: SurveyData;
  step: SurveyStepId;
  result: ChronotypeResult | null;
  emailSent: boolean | null;
  updateData: (updates: Partial<SurveyData>) => void;
  setStep: (step: SurveyStepId) => void;
  setResult: (result: ChronotypeResult | null) => void;
  setEmailSent: (sent: boolean | null) => void;
  reset: () => void;
}

export const useSurveyStore = create<SurveyStore>()(
  persist(
    (set) => ({
      data: INITIAL_SURVEY_DATA,
      step: 'welcome',
      result: null,
      emailSent: null,
      updateData: (updates) => set((state) => ({ data: { ...state.data, ...updates } })),
      setStep: (step) => set({ step }),
      setResult: (result) => set({ result }),
      setEmailSent: (emailSent) => set({ emailSent }),
      reset: () =>
        set({
          data: INITIAL_SURVEY_DATA,
          step: 'welcome',
          result: null,
          emailSent: null,
        }),
    }),
    {
      name: 'restore-survey-v2',
      partialize: (state) => ({
        data: state.data,
        step: state.step,
        result: state.result,
        emailSent: state.emailSent,
      }),
    },
  ),
);
