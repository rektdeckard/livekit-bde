import { useId, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

type TextFieldProps = Omit<ComponentProps<'input'>, 'size'> & {
  label: string;
  /** Keep the label for screen readers but hide it visually, e.g. in a one-field hero form. */
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: string;
  size?: 'md' | 'lg';
  /** Applied to the wrapper; use `inputClassName` to style the input itself. */
  className?: string;
  inputClassName?: string;
};

/** Labeled text input; the label, hint, and error are wired to it for screen readers. */
export function TextField({
  label,
  hideLabel = false,
  hint,
  error,
  size = 'md',
  className,
  inputClassName,
  id,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label
        htmlFor={inputId}
        className={cn(
          'font-mono text-xs tracking-wider text-fg2 uppercase',
          hideLabel && 'sr-only',
        )}
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full border border-separator2 bg-bg2 px-3.5 text-base text-fg0 transition-[border-color,background-color] duration-150 ease-out placeholder:text-fg4',
          'hover:border-gray-400 focus-visible:border-pumpkin-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg1',
          'aria-[invalid=true]:border-fgSerious aria-[invalid=true]:focus-visible:outline-fgSerious',
          'disabled:cursor-not-allowed disabled:bg-bg3 disabled:text-fg4',
          size === 'md' ? 'h-11' : 'h-13',
          inputClassName,
        )}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="text-sm text-fg3">
          {hint}
        </p>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}

/** Error text with an icon, so the state never relies on color alone. */
export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-2 text-sm text-fgSerious">
      <svg viewBox="0 0 12 12" aria-hidden className="mt-1 size-3 shrink-0 fill-current">
        <rect x="5" y="1" width="2" height="6" />
        <rect x="5" y="9" width="2" height="2" />
      </svg>
      <span>{children}</span>
    </p>
  );
}
