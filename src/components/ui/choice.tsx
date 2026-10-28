import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/cn';

type ChoiceProps = Omit<ComponentProps<'input'>, 'type'> & {
  type: 'checkbox' | 'radio';
  label: ReactNode;
  description?: ReactNode;
  /** `secondary` marks a different kind of option, like the enterprise path. */
  tone?: 'accent' | 'secondary';
};

/**
 * A selectable card around a real checkbox or radio. Group several in a
 * `<fieldset>` with a `<legend>`.
 */
export function Choice({
  type,
  label,
  description,
  tone = 'accent',
  className,
  ...props
}: ChoiceProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer touch-manipulation items-start gap-3 border border-separator1 bg-bg1 p-4',
        'transition-[background-color,border-color] duration-150 ease-out hover:border-separator2 hover:bg-bg2',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
        'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60',
        tone === 'accent' &&
          'has-[:checked]:border-pumpkin-500 has-[:checked]:bg-bgAccent1 has-[:focus-visible]:outline-fg1',
        tone === 'secondary' &&
          'has-[:checked]:border-purple-400 has-[:checked]:bg-bgSecondary1 has-[:focus-visible]:outline-fg1',
        className,
      )}
    >
      <input type={type} className="peer sr-only" {...props} />
      <span
        aria-hidden
        className={cn(
          'mt-0.5 grid size-4 shrink-0 place-items-center border border-gray-400 transition-[background-color,border-color] duration-150',
          type === 'radio' && 'rounded-full',
          tone === 'accent' && 'peer-checked:border-pumpkin-500 peer-checked:bg-pumpkin-500',
          tone === 'secondary' && 'peer-checked:border-purple-400 peer-checked:bg-purple-400',
          '[&>span]:scale-0 peer-checked:[&>span]:scale-100',
        )}
      >
        <span
          className={cn(
            'size-1.5 bg-black transition-[scale] duration-150 ease-out',
            type === 'radio' && 'rounded-full',
          )}
        />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base text-fg0">{label}</span>
        {description && <span className="text-sm text-fg3">{description}</span>}
      </span>
    </label>
  );
}
