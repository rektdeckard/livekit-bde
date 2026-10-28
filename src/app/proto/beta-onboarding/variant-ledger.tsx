'use client';

// Candlelit Ledger — a split view. Answers are inked into a ledger as you go, a candle
// lights for every step, and the ledger itself becomes the review and the receipt.

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useRef } from 'react';

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

export function LedgerVariant({ flow }: { flow: Flow }) {
  const reduce = !!useReducedMotion();
  const sealed = flow.status === 'success' && !!flow.result;
  const isReview = flow.step === 'review' && !sealed;

  return (
    <div className="flex min-h-dvh flex-col">
      <ProtoChrome />
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-4 pt-8 pb-32 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:pt-16">
        <aside className={cn('lg:block', isReview || sealed ? 'block' : 'hidden')}>
          <div className="lg:sticky lg:top-8">
            <Ledger flow={flow} sealed={sealed} reduce={reduce} />
          </div>
        </aside>

        <section className="flex min-w-0 flex-col gap-8">
          <Candles lit={sealed ? STEPS.length : flow.stepIndex} flare={sealed} reduce={reduce} />
          <AnimatePresence mode="wait" custom={flow.direction}>
            {sealed ? (
              <LedgerSuccess key="success" flow={flow} reduce={reduce} />
            ) : (
              <LedgerStep key={flow.step} flow={flow} reduce={reduce} />
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

function LedgerStep({ flow, reduce }: { flow: Flow; reduce: boolean }) {
  const ref = useRef<HTMLFormElement>(null);
  useStepFocus(ref, flow);
  const copy = beta.steps[flow.step];
  const isReview = flow.step === 'review';
  const dir = flow.direction;

  return (
    <motion.form
      ref={ref}
      noValidate
      initial={reduce ? false : { opacity: 0, x: 28 * dir }}
      animate={{
        opacity: 1,
        x: 0,
        transition: { duration: secs(tune.duration), ease: EASE_OUT },
      }}
      exit={
        reduce
          ? { opacity: 1, transition: { duration: 0 } }
          : {
              opacity: 0,
              x: -18 * dir,
              transition: { duration: secs(tune.duration * 0.55), ease: EASE_IN },
            }
      }
      onSubmit={(e) => {
        e.preventDefault();
        if (isReview) flow.submit();
        else flow.next();
      }}
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col gap-3">
        <p className="font-mono text-xs tracking-wider text-fgAccent1 uppercase">
          {String(flow.stepIndex + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')} ·{' '}
          {copy.eyebrow}
        </p>
        <h1
          data-step-heading
          tabIndex={-1}
          className="font-display text-3xl text-balance text-fg0 outline-none sm:text-4xl"
        >
          {copy.title}
        </h1>
        <p className="text-fg3">
          {isReview
            ? 'Everything in the ledger is what we’ll send. Edit any line before sealing it.'
            : copy.body}
        </p>
      </div>

      {!isReview && <StepFields step={flow.step} flow={flow} />}

      <div className="flex flex-col gap-4">
        {flow.status === 'error' && <FieldError>{beta.errors.submit}</FieldError>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" pending={flow.status === 'submitting'}>
            {isReview
              ? flow.status === 'error'
                ? beta.actions.retry
                : 'Seal the ledger'
              : flow.returnToReview
                ? 'Save and review'
                : beta.actions.next}
          </Button>
          {flow.stepIndex > 0 && (
            <Button variant="ghost" onClick={flow.back} disabled={flow.status === 'submitting'}>
              {beta.actions.back}
            </Button>
          )}
        </div>
      </div>
    </motion.form>
  );
}

function Ledger({ flow, sealed, reduce }: { flow: Flow; sealed: boolean; reduce: boolean }) {
  const editable = flow.step === 'review' && !sealed;

  return (
    <div className="relative border bg-bg1">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <p className="font-display text-lg text-fg0">The ledger</p>
        <p className="font-mono text-xs text-fg4">Séance beta · No. 0013</p>
      </div>
      <dl className="flex flex-col">
        {reviewRows.map((row, i) => {
          const value = i < flow.stepIndex || sealed ? answerText(row.step, flow.draft) : '';
          const current = !sealed && flow.step === row.step;
          return (
            <div
              key={row.step}
              className={cn(
                'relative flex items-start gap-4 border-b border-dashed px-5 py-4 last:border-b-0',
                current && 'bg-bgAccent1',
              )}
            >
              {current && (
                <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-pumpkin-500" />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <dt className="font-mono text-xs tracking-wider text-fg3 uppercase">{row.label}</dt>
                <dd className="min-h-6 break-words text-fg0">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={value || 'empty'}
                      initial={
                        reduce ? false : { opacity: 0, filter: `blur(${tune.blur * 0.5}px)` }
                      }
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, transition: { duration: secs(100) } }}
                      transition={{ duration: secs(tune.duration * 1.5), ease: EASE_OUT }}
                      className={cn('block', !value && 'text-fg4')}
                    >
                      {value || (current ? 'Writing…' : '—')}
                    </motion.span>
                  </AnimatePresence>
                </dd>
              </div>
              {editable && (
                <button
                  type="button"
                  onClick={() => flow.edit(row.step)}
                  className="-my-2 -mr-3 inline-flex min-h-10 shrink-0 items-center px-3 text-sm text-fgAccent1 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-fg1"
                  aria-label={`${beta.actions.edit} ${row.label.toLowerCase()}`}
                >
                  {beta.actions.edit}
                </button>
              )}
            </div>
          );
        })}
      </dl>

      <AnimatePresence>
        {sealed && (
          <motion.div
            key="seal"
            aria-hidden
            initial={reduce ? false : { opacity: 0, scale: 1.6, rotate: -18 }}
            animate={{ opacity: 1, scale: 1, rotate: -8 }}
            transition={{ type: 'spring', duration: secs(500), bounce: 0.3, delay: secs(250) }}
            className="absolute -top-4 -right-3 flex items-center gap-2 border-2 border-pumpkin-500 bg-bg1 p-1.5 pr-3 shadow-md"
          >
            <PixelPumpkin size={32} />
            <span className="font-mono text-xs tracking-widest text-fgAccent1 uppercase">
              Sealed
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Candles({ lit, flare, reduce }: { lit: number; flare: boolean; reduce: boolean }) {
  return (
    <div className="flex items-end gap-3">
      <p className="sr-only" aria-live="polite">
        {flare ? 'All steps complete' : `Step ${lit + 1} of ${STEPS.length}`}
      </p>
      {STEPS.map((step, i) => (
        <Candle
          key={step}
          lit={i < lit}
          current={!flare && i === lit}
          flare={flare}
          index={i}
          reduce={reduce}
        />
      ))}
    </div>
  );
}

function Candle({
  lit,
  current,
  flare,
  index,
  reduce,
}: {
  lit: boolean;
  current: boolean;
  flare: boolean;
  index: number;
  reduce: boolean;
}) {
  return (
    <svg viewBox="0 0 16 40" aria-hidden className="h-10 w-4 overflow-visible">
      <motion.g
        initial={false}
        animate={
          lit || current
            ? { opacity: current ? 0.45 : 1, scale: flare && !reduce ? [1, 1.7, 1] : 1 }
            : { opacity: 0, scale: 0.4 }
        }
        transition={{
          duration: secs(flare ? 700 : 250),
          delay: flare ? index * secs(70) : 0,
          ease: EASE_OUT,
        }}
        style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
      >
        <g
          className={cn(!reduce && 'animate-[dk-flicker_1.6s_ease-in-out_infinite]')}
          style={{
            transformBox: 'fill-box',
            transformOrigin: '50% 100%',
            animationDelay: `${index * -370}ms`,
            animationDuration: `calc(1600ms / var(--proto-speed, 1))`,
          }}
        >
          <path d="M8 2c3 4 4 6 4 8.5a4 4 0 0 1-8 0C4 8 5 6 8 2z" className="fill-pumpkin-400" />
          <path d="M8 7c1.4 2 2 3 2 4a2 2 0 0 1-4 0c0-1 .6-2 2-4z" className="fill-pumpkin-100" />
        </g>
      </motion.g>
      <rect x="7.5" y="14" width="1" height="3" className="fill-fg3" />
      <rect
        x="3"
        y="17"
        width="10"
        height="23"
        className={cn(lit ? 'fill-gray-200 light:fill-gray-500' : 'fill-bg3')}
      />
    </svg>
  );
}

function LedgerSuccess({ flow, reduce }: { flow: Flow; reduce: boolean }) {
  const lines = flow.result ? successLines(flow.result) : [];
  const base = reduce ? 0 : secs(500);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: secs(tune.duration), ease: EASE_OUT }}
      className="flex flex-col gap-6"
      aria-live="polite"
    >
      <p className="font-mono text-xs tracking-wider text-fgAccent1 uppercase">Sealed and sent</p>
      <h1 className="font-display text-4xl text-balance text-fg0 sm:text-5xl">
        The candles are lit.
      </h1>
      <ul className="flex flex-col gap-3 text-lg text-pretty text-fg2">
        {lines.map((line, i) => (
          <motion.li
            key={line.id}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: secs(tune.duration),
              delay: base + i * secs(tune.stagger * 2.5),
              ease: EASE_OUT,
            }}
            className={cn('flex gap-3', line.tone === 'sales' && 'text-fgSecondary1')}
          >
            <span
              aria-hidden
              className={cn(
                'mt-2.5 size-1.5 shrink-0',
                line.tone === 'sales' ? 'bg-purple-400' : 'bg-pumpkin-500',
              )}
            />
            <span className="min-w-0">
              <SuccessLineText line={line} />
            </span>
          </motion.li>
        ))}
      </ul>
      <Link href="/" className={buttonStyles({ variant: 'secondary', className: 'self-start' })}>
        Back to DeadKit
      </Link>
    </motion.div>
  );
}
