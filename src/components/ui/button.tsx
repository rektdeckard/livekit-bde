import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'md' | 'lg';

type ButtonStyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

/** Button classes, for links and other elements that should look like a `Button`. */
export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: ButtonStyleOptions = {}) {
  return cn(
    'relative inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap select-none touch-manipulation',
    'transition-[background-color,border-color,color,scale] duration-150 ease-out active:scale-[0.96]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg1',
    'disabled:pointer-events-none',
    size === 'md' ? 'h-11 px-5 text-sm' : 'h-13 px-6 text-base',
    variant === 'primary' &&
      'bg-pumpkin-500 text-black hover:bg-pumpkin-400 [&:disabled:not([aria-busy])]:bg-bg3 [&:disabled:not([aria-busy])]:text-fg4',
    variant === 'secondary' &&
      'border border-separator2 text-fg0 hover:border-gray-400 hover:bg-bg2 [&:disabled:not([aria-busy])]:text-fg4',
    variant === 'ghost' && 'px-3 text-fg2 hover:bg-bg2 hover:text-fg0 disabled:text-fg4',
    className,
  );
}

type ButtonProps = ComponentProps<'button'> &
  Omit<ButtonStyleOptions, 'className'> & {
    /** Shows a spinner, keeps the button's width, and blocks repeat clicks. */
    pending?: boolean;
  };

export function Button({
  variant,
  size,
  pending = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      <span className={cn('inline-flex items-center gap-2', pending && 'invisible')}>
        {children}
      </span>
      {pending && <PixelSpinner className="absolute" />}
    </button>
  );
}

/** Three blocks blinking in turn, borrowed from the pumpkin's pixel grid. */
function PixelSpinner({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('flex gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-[dk-blink_900ms_ease-in-out_infinite] bg-current motion-reduce:animate-none"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}
