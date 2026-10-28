'use client';

// Séance Table — one question per screen on a centered card. A planchette glides along
// the progress track; each step materializes out of a blur and dissipates on exit.

import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { CandleGlow } from '@/components/candle-glow';
import { PixelPumpkin } from '@/components/pixel-pumpkin';
import { Button, buttonStyles } from '@/components/ui/button';
import { FieldError } from '@/components/ui/text-field';
import { beta, successLines } from '@/content/beta';
import { STEPS } from '@/lib/beta-signup';
import { cn } from '@/lib/cn';

import {
  answerText,
  ProtoChrome,
  reviewRows,
  StepFields,
  SuccessLineText,
  useStepFocus,
} from './fields';
import { secs, tune } from './tune';
import type { Flow } from './use-proto-flow';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN = [0.4, 0, 1, 1] as const;

export function TableVariant({ flow }: { flow: Flow }) {
  const reduce = !!useReducedMotion();
  const success = flow.status === 'success' && flow.result;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <ProtoChrome />
      {/* Candlelight pooled under the card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[80vh] bg-[radial-gradient(ellipse_60%_50%_at_50%_30%,var(--dk-color-bgAccent1),transparent_70%)] opacity-80"
      />
      <div
        aria-hidden
        className="bg-dot-pattern pointer-events-none absolute inset-0 -z-20 opacity-40"
      />

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-10 pb-32 sm:pt-16">
        {!success && <CandleTrack index={flow.stepIndex} />}

        <AnimatePresence mode="wait" custom={flow.direction}>
          {success ? (
            <TableSuccess key="success" flow={flow} reduce={reduce} />
          ) : (
            <TableStep key={flow.step} flow={flow} reduce={reduce} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function stepVariants(reduce: boolean): Variants {
  return {
    enter: (dir: number) =>
      reduce ? { opacity: 1 } : { opacity: 0, y: 14 * dir, filter: `blur(${tune.blur}px)` },
    center: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: reduce
        ? { duration: 0 }
        : {
            duration: secs(tune.duration),
            ease: EASE_OUT,
            staggerChildren: secs(tune.stagger),
          },
    },
    exit: (dir: number) =>
      reduce
        ? { opacity: 1, transition: { duration: 0 } }
        : {
            opacity: 0,
            y: -10 * dir,
            filter: `blur(${tune.blur * 0.75}px)`,
            transition: { duration: secs(tune.duration * 0.6), ease: EASE_IN },
          },
  };
}

function itemVariants(reduce: boolean): Variants {
  return {
    enter: reduce ? {} : { opacity: 0, y: 8 },
    center: {
      opacity: 1,
      y: 0,
      transition: reduce ? { duration: 0 } : { duration: secs(tune.duration), ease: EASE_OUT },
    },
  };
}

function TableStep({ flow, reduce }: { flow: Flow; reduce: boolean }) {
  const ref = useRef<HTMLFormElement>(null);
  useStepFocus(ref, flow);
  const copy = beta.steps[flow.step];
  const item = itemVariants(reduce);
  const isReview = flow.step === 'review';

  return (
    <motion.form
      ref={ref}
      noValidate
      custom={flow.direction}
      variants={stepVariants(reduce)}
      initial="enter"
      animate="center"
      exit="exit"
      onSubmit={(e) => {
        e.preventDefault();
        if (isReview) flow.submit();
        else flow.next();
      }}
      className="mt-10 flex flex-col gap-8"
    >
      <motion.div variants={item} className="flex flex-col gap-3">
        <p className="font-mono text-xs tracking-wider text-fgAccent1 uppercase">{copy.eyebrow}</p>
        <h1
          data-step-heading
          tabIndex={-1}
          className="font-display text-3xl text-balance text-fg0 outline-none sm:text-4xl"
        >
          {copy.title}
        </h1>
        <p className="text-fg3">{copy.body}</p>
      </motion.div>

      <motion.div variants={item}>
        {isReview ? <ReviewCard flow={flow} /> : <StepFields step={flow.step} flow={flow} />}
      </motion.div>

      <motion.div variants={item} className="flex flex-col gap-4">
        {flow.status === 'error' && <FieldError>{beta.errors.submit}</FieldError>}
        <div className="flex items-center justify-between gap-3">
          {flow.stepIndex > 0 ? (
            <Button variant="ghost" onClick={flow.back} disabled={flow.status === 'submitting'}>
              ← {beta.actions.back}
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" size="lg" pending={flow.status === 'submitting'}>
            {isReview
              ? flow.status === 'error'
                ? beta.actions.retry
                : beta.actions.submit
              : flow.returnToReview
                ? 'Save and review'
                : beta.actions.next}
          </Button>
        </div>
      </motion.div>
    </motion.form>
  );
}

function ReviewCard({ flow }: { flow: Flow }) {
  return (
    <dl className="divide-y border bg-bg1">
      {reviewRows.map((row) => (
        <div key={row.step} className="flex items-start gap-4 px-4 py-3.5">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <dt className="font-mono text-xs tracking-wider text-fg3 uppercase">{row.label}</dt>
            <dd className="break-words text-fg0">{answerText(row.step, flow.draft)}</dd>
          </div>
          <button
            type="button"
            onClick={() => flow.edit(row.step)}
            className="-my-2 -mr-3 inline-flex min-h-10 shrink-0 items-center px-3 text-sm text-fgAccent1 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-fg1"
            aria-label={`${beta.actions.edit} ${row.label.toLowerCase()}`}
          >
            {beta.actions.edit}
          </button>
        </div>
      ))}
    </dl>
  );
}

const STATIONS = ['I', 'II', 'III', 'IV', 'V'];

/** Five stations; the current one is candlelit, and lighting hands off as you move. */
function CandleTrack({ index }: { index: number }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="sr-only" aria-live="polite">
        Step {index + 1} of {STEPS.length}
      </p>
      <ol aria-hidden className="relative flex items-center justify-between">
        <span className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-separator1" />
        {STATIONS.map((numeral, i) => (
          <li key={numeral} className="relative grid size-10 place-items-center">
            <CandleGlow
              lit={i === index}
              className={cn(
                'grid size-8 place-items-center border bg-bg1 font-mono text-xs',
                'data-lit:border-(--candle-color) data-lit:bg-bgAccent1 data-lit:text-fg0',
                i < index ? 'border-separatorAccent text-fgAccent1' : 'border-separator2 text-fg4',
              )}
            >
              {numeral}
            </CandleGlow>
          </li>
        ))}
      </ol>
    </div>
  );
}

function TableSuccess({ flow, reduce }: { flow: Flow; reduce: boolean }) {
  const lines = flow.result ? successLines(flow.result) : [];
  const base = reduce ? 0 : secs(900);

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: secs(200) }}
      className="mt-6 flex flex-col items-center gap-8 text-center"
      aria-live="polite"
    >
      <LitPumpkin />
      <div className="flex flex-col gap-4">
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 10, filter: `blur(${tune.blur}px)` }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: secs(tune.duration * 1.4), delay: base, ease: EASE_OUT }}
          className="font-display text-4xl text-balance text-fg0 sm:text-5xl"
        >
          You’re on the list.
        </motion.h1>
        <ul className="flex flex-col gap-2 text-lg text-pretty text-fg2">
          {lines.map((line, i) => (
            <motion.li
              key={line.id}
              initial={reduce ? false : { opacity: 0, y: 8, filter: `blur(${tune.blur}px)` }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: secs(tune.duration * 1.4),
                delay: base + secs(250) + i * secs(tune.stagger * 3),
                ease: EASE_OUT,
              }}
              className={cn(line.tone === 'sales' && 'text-fgSecondary1')}
            >
              <SuccessLineText line={line} />
            </motion.li>
          ))}
        </ul>
      </div>
      <Link href="/" className={buttonStyles({ variant: 'secondary' })}>
        Back to DeadKit
      </Link>
    </motion.section>
  );
}

/** The assembled pumpkin catches the light once its blocks have landed. */
function LitPumpkin() {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setLit(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <CandleGlow
      lit={lit}
      className="grid place-items-center"
      style={
        { '--candle-size': '48px', '--candle-handoff': `${secs(1100) * 1000}ms` } as CSSProperties
      }
    >
      <PixelPumpkin size={112} animate="assemble" />
    </CandleGlow>
  );
}
