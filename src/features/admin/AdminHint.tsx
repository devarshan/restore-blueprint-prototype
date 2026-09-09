import { useEffect, useId, useState } from 'react';

export function AdminHint({ label, children }: { label: string; children: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function close() {
      setOpen(false);
    }
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <span className={`admin-hint${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="admin-hint-btn"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={id}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => setOpen((current) => !current)}
      >
        ?
      </button>
      <span id={id} className="admin-hint-tip" role="tooltip">
        {children}
      </span>
    </span>
  );
}
