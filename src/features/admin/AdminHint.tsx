import { useId } from 'react';

export function AdminHint({ label, children }: { label: string; children: string }) {
  const id = useId();

  return (
    <span className="admin-hint">
      <button type="button" className="admin-hint-btn" aria-label={label} aria-describedby={id}>
        ?
      </button>
      <span id={id} className="admin-hint-tip" role="tooltip">
        {children}
      </span>
    </span>
  );
}
