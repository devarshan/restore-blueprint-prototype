import type { ReactNode } from 'react';

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-sans text-[12px] font-semibold tracking-[0.18em] text-[#bee1e3] uppercase">{children}</p>
  );
}

export function Title({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h1 id="step-title" tabIndex={-1} className={`survey-h1 outline-none ${className}`.trim()}>
      {children}
    </h1>
  );
}

export function Body({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`survey-body ${className}`.trim()}>{children}</p>;
}

export function FieldLabel({
  htmlFor,
  id,
  required,
  children,
}: {
  htmlFor?: string;
  id?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} id={id} className="block font-sans text-sm font-semibold text-white">
      {children}
      {required ? (
        <span className="field-required" aria-hidden="true">
          {' '}
          *
        </span>
      ) : null}
    </label>
  );
}

export function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className="survey-choice">
      {children}
    </button>
  );
}

export function SliderField({
  id,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  const display = Math.round(value / 10);

  return (
    <div className="survey-slider">
      <p className="slider-value" aria-live="polite">
        {display}/10
      </p>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="restore-range"
        aria-valuetext={`${display} out of 10`}
      />
      <div className="mt-4 flex justify-between px-2 font-sans text-sm font-bold text-white">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
