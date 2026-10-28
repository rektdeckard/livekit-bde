import { useId, type ComponentProps, type CSSProperties } from 'react';

import { cn } from '@/lib/cn';

type CandleGlowProps = ComponentProps<'span'> & {
  /** Lit candles glow and flicker; switching off fades the glow out. */
  lit: boolean;
};

/**
 * Wraps an element in candlelight. Style the lit state with Tailwind's `data-lit:`
 * variant (e.g. `data-lit:text-fg0`) — those colors fade in on the candle's timing.
 *
 * Tune it with the `--candle-*` custom properties in `src/app/globals.css`, globally
 * or per element via `style`.
 */
export function CandleGlow({ lit, className, style, children, ...props }: CandleGlowProps) {
  // A stable per-instance offset, so a row of candles never flickers in unison.
  const seed = [...useId()].reduce((sum, char) => sum + char.charCodeAt(0) * 97, 0) % 1800;

  return (
    <span
      data-lit={lit ? '' : undefined}
      className={cn('dk-candle', className)}
      style={{ '--candle-seed': `-${seed}ms`, ...style } as CSSProperties}
      {...props}
    >
      <span aria-hidden className="dk-candle-glow" />
      {children}
    </span>
  );
}
