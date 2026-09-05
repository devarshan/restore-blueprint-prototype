import { type FocusEvent, type ReactNode } from 'react';
import { RestoreLogo } from '../../components/RestoreLogo';

interface SurveyChromeProps {
  embed: boolean;
  paneKey: string;
  campaignName?: string;
  progressPercent: number;
  showProgress: boolean;
  showHeader?: boolean;
  showBack: boolean;
  showFooter: boolean;
  nextDisabled: boolean;
  nextHint?: string;
  nextLabel?: string;
  onBack: () => void;
  onNext: () => void;
  children: ReactNode;
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M15 6L9 12L15 18' : 'M9 6L15 12L9 18'}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SurveyChrome({
  embed,
  paneKey,
  campaignName,
  progressPercent,
  showProgress,
  showHeader = true,
  showBack,
  showFooter,
  nextDisabled,
  nextHint,
  nextLabel = 'Next',
  onBack,
  onNext,
  children,
}: SurveyChromeProps) {
  function onFocusIn(event: FocusEvent<HTMLElement>) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.tagName !== 'INPUT' && target.tagName !== 'SELECT' && target.tagName !== 'TEXTAREA') return;
    window.setTimeout(() => {
      target.scrollIntoView({ block: 'center', inline: 'nearest' });
    }, 280);
  }

  const iconOnly = nextLabel === 'Next';

  return (
    <div className="survey-page">
      <div className="survey-shell">
        {showHeader ? (
          <header className={`survey-header${embed ? ' is-embed' : ''}`}>
            <div className="survey-brand-row">
              <RestoreLogo className="survey-brand" />
              {campaignName ? <p className="survey-campaign">{campaignName}</p> : null}
            </div>
            {showProgress ? (
              <div className="survey-progress" aria-hidden="true">
                <span style={{ width: `${progressPercent}%` }} />
              </div>
            ) : null}
          </header>
        ) : null}

        <div className="survey-col">
          <main
            className={`survey-main${showHeader ? '' : ' is-flush'}${showFooter ? '' : ' is-bare'}`}
            onFocus={onFocusIn}
          >
            <div key={paneKey} className="survey-enter flex min-h-full flex-1 flex-col">
              {children}
            </div>
          </main>

          {showFooter ? (
            <footer className="survey-footer">
              {showBack ? (
                <button type="button" onClick={onBack} className="survey-back" aria-label="Back">
                  <Chevron direction="left" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={onNext}
                disabled={nextDisabled}
                className="survey-next"
                aria-label={nextLabel}
                title={nextDisabled ? nextHint : undefined}
              >
                {iconOnly ? <Chevron direction="right" /> : nextLabel}
              </button>
            </footer>
          ) : null}
        </div>
      </div>
    </div>
  );
}
