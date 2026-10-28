'use client';

import { motion, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/cn';

// The pumpkin mark from public/brand/pumpkin.svg, broken into its 4.8-unit blocks
// so each one can move on its own.
const BLOCK = 4.8;
const BLOCKS = [
  [6, 5],
  [25.2, 5],
  [10.8, 9.8],
  [20.4, 9.8],
  [15.6, 14.6],
  [25.2, 14.6],
  [25.2, 19.4],
  [6, 24.2],
  [10.8, 24.2],
  [15.6, 24.2],
  [20.4, 24.2],
  [25.2, 24.2],
] as const;

// Deterministic scatter so server and client render the same start positions.
const SCATTER = BLOCKS.map((_, i) => ({
  x: ((i * 37) % 23) - 11,
  y: ((i * 53) % 29) - 18,
  rotate: ((i * 71) % 90) - 45,
}));

type PixelPumpkinProps = {
  size?: number;
  /** `assemble` scatters the blocks and snaps them into the face, one after another. */
  animate?: 'none' | 'assemble';
  delay?: number;
  className?: string;
  /** Omit when the pumpkin is decorative, so screen readers skip it. */
  label?: string;
};

export function PixelPumpkin({
  size = 96,
  animate = 'none',
  delay = 0,
  className,
  label,
}: PixelPumpkinProps) {
  const reduceMotion = useReducedMotion();
  const assemble = animate === 'assemble' && !reduceMotion;

  return (
    <svg
      viewBox="0 0 36 36"
      width={size}
      height={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('overflow-visible', className)}
    >
      <motion.rect
        width="36"
        height="36"
        className="fill-pumpkin-500"
        initial={assemble ? { opacity: 0, scale: 0.9 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay, ease: [0.23, 1, 0.32, 1] }}
        style={{ transformOrigin: 'center' }}
      />
      {BLOCKS.map(([x, y], i) => (
        // Blocks move as groups so motion's x/y transforms never collide with the rect's own x/y attributes.
        <motion.g
          key={`${x}-${y}`}
          initial={assemble ? { ...SCATTER[i], opacity: 0 } : false}
          animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          transition={{
            type: 'spring',
            duration: 0.7,
            bounce: 0.15,
            delay: delay + 0.25 + i * 0.05,
          }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
          <rect x={x} y={y} width={BLOCK} height={BLOCK} className="fill-black" />
        </motion.g>
      ))}
    </svg>
  );
}
