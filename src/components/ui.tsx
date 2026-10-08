import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useStore } from '../store';

/* ------------------------------------------------------------------ */
/* Tooltip                                                             */
/* ------------------------------------------------------------------ */

type Side = 'top' | 'bottom' | 'left' | 'right';

const SIDE_CLASS: Record<Side, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export const Tooltip: React.FC<{
  label: React.ReactNode;
  hint?: string;
  side?: Side;
  children: React.ReactNode;
}> = ({ label, hint, side = 'top', children }) => (
  <span className="relative inline-flex group">
    {children}
    <span
      role="tooltip"
      className={`pointer-events-none absolute z-[60] hidden whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-semibold text-app shadow-float group-hover:block group-focus-within:block ${SIDE_CLASS[side]}`}
      style={{ animation: 'fade-in 0.12s ease-out' }}
    >
      {label}
      {hint && (
        <span className="ml-1.5 rounded bg-app/20 px-1 py-px font-mono text-[10px] tracking-wide opacity-90">
          {hint}
        </span>
      )}
    </span>
  </span>
);

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    active?: boolean;
    tone?: 'default' | 'brand' | 'danger';
    size?: 'sm' | 'md' | 'lg';
  }
> = ({ active, tone = 'default', size = 'md', className = '', ...props }) => {
  const sizes = {
    sm: 'h-8 w-8 rounded-lg',
    md: 'h-10 w-10 rounded-xl',
    lg: 'h-12 w-12 rounded-2xl',
  }[size];

  const tones = active
    ? tone === 'danger'
      ? 'bg-bad text-white shadow-soft'
      : 'brand-gradient text-white shadow-brand'
    : tone === 'danger'
      ? 'text-ink-2 hover:bg-bad/10 hover:text-bad'
      : 'text-ink-2 hover:bg-panel-2 hover:text-ink';

  return (
    <button
      type="button"
      {...props}
      className={`inline-flex shrink-0 items-center justify-center transition-all duration-150 active:scale-90 disabled:pointer-events-none disabled:opacity-35 ${sizes} ${tones} ${className}`}
    />
  );
};

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'ghost' | 'outline' | 'danger';
    size?: 'sm' | 'md';
  }
> = ({ variant = 'primary', size = 'md', className = '', ...props }) => {
  const variants = {
    primary: 'brand-gradient text-white shadow-brand hover:brightness-105',
    ghost: 'text-ink-2 hover:bg-panel-2 hover:text-ink',
    outline: 'border border-line text-ink hover:bg-panel-2',
    danger: 'bg-bad text-white hover:brightness-110',
  }[variant];

  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-lg',
    md: 'h-10 px-4 text-sm rounded-xl',
  }[size];

  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 font-bold transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${variants} ${sizes} ${className}`}
    />
  );
};

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  width?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ open, onClose, title, subtitle, icon, width = 'max-w-lg', children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ animation: 'fade-in 0.15s ease-out' }}
    >
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${width} overflow-hidden rounded-3xl border border-line bg-panel shadow-float`}
        style={{ animation: 'rise 0.2s cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <header className="flex items-start gap-3 border-b border-line px-6 py-5">
          {icon && (
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold tracking-tight text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs font-medium text-ink-3">{subtitle}</p>}
          </div>
          <IconButton size="sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </IconButton>
        </header>

        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-line bg-panel-2 px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
};

/* ------------------------------------------------------------------ */
/* Popover — anchored floating panel that closes on outside click       */
/* ------------------------------------------------------------------ */

export const Popover: React.FC<{
  open: boolean;
  onClose: () => void;
  anchor: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ open, onClose, anchor, className = '', children }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    // Defer so the click that opened the popover does not immediately close it.
    const id = setTimeout(() => document.addEventListener('mousedown', onDown), 0);
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative">
      {anchor}
      {open && (
        <div
          className={`absolute z-50 rounded-2xl border border-line bg-panel p-1.5 shadow-float ${className}`}
          style={{ animation: 'pop-in 0.14s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export const MenuItem: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon?: React.ReactNode;
    hint?: string;
    danger?: boolean;
  }
> = ({ icon, hint, danger, children, className = '', ...props }) => (
  <button
    type="button"
    {...props}
    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40 ${
      danger ? 'text-bad hover:bg-bad/10' : 'text-ink-2 hover:bg-panel-2 hover:text-ink'
    } ${className}`}
  >
    {icon && <span className="shrink-0 opacity-80">{icon}</span>}
    <span className="flex-1 truncate">{children}</span>
    {hint && <span className="font-mono text-[10px] text-ink-3">{hint}</span>}
  </button>
);

export const MenuDivider = () => <div className="my-1 h-px bg-line" />;

export const MenuLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-3 pb-1 pt-2 text-[10px] font-extrabold uppercase tracking-widest text-ink-3">
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/* Slider                                                              */
/* ------------------------------------------------------------------ */

export const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step = 1, suffix = '', format, onChange }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">{label}</span>
        <span className="tabular text-xs font-extrabold text-ink">
          {format ? format(value) : `${value}${suffix}`}
        </span>
      </div>
      <input
        type="range"
        className="sk-range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ['--sk-fill' as string]: `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
};

/* ------------------------------------------------------------------ */
/* Segmented control                                                   */
/* ------------------------------------------------------------------ */

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
}: {
  options: { value: T; label: React.ReactNode; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-xl bg-panel-2 p-1">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          title={opt.title}
          onClick={() => onChange(opt.value)}
          className={`flex items-center justify-center gap-1.5 rounded-lg font-bold transition-all ${
            size === 'sm' ? 'h-7 px-2.5 text-[11px]' : 'h-9 px-3 text-xs'
          } ${
            value === opt.value
              ? 'bg-panel text-ink shadow-soft'
              : 'text-ink-3 hover:text-ink-2'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Switch                                                              */
/* ------------------------------------------------------------------ */

export const Switch: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
}> = ({ checked, onChange, label, description }) => {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4">
      {label && (
        <span className="min-w-0">
          <span className="block text-[13px] font-bold text-ink">{label}</span>
          {description && (
            <span className="block text-[11px] font-medium text-ink-3">{description}</span>
          )}
        </span>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'brand-gradient' : 'bg-panel-3'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-transform ${
            checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
};

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

export const ToastStack: React.FC = () => {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  if (!toasts.length) return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[120] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold shadow-float ${
            t.kind === 'error'
              ? 'bg-bad text-white'
              : t.kind === 'success'
                ? 'bg-good text-white'
                : 'bg-ink text-app'
          }`}
          style={{ animation: 'rise 0.2s cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          {t.message}
        </button>
      ))}
    </div>,
    document.body,
  );
};

/* ------------------------------------------------------------------ */
/* Inline rename field                                                 */
/* ------------------------------------------------------------------ */

export const InlineEdit: React.FC<{
  value: string;
  onCommit: (v: string) => void;
  className?: string;
  inputClassName?: string;
}> = ({ value, onCommit, className = '', inputClassName = '' }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  // Adjust the draft during render when the source value changes underneath us.
  if (lastValue !== value) {
    setLastValue(value);
    setDraft(value);
  }

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== value) onCommit(draft.trim());
    else setDraft(value);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onDoubleClick={() => setEditing(true)}
        onClick={() => setEditing(true)}
        className={`truncate text-left ${className}`}
        title="Click to rename"
      >
        {value}
      </button>
    );
  }

  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') {
          setDraft(value);
          setEditing(false);
        }
        e.stopPropagation();
      }}
      onClick={(e) => e.stopPropagation()}
      className={`w-full rounded-md bg-panel-2 px-1.5 py-0.5 outline-none ring-2 ring-brand ${inputClassName}`}
    />
  );
};
