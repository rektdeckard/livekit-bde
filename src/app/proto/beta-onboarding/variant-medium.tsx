'use client';

// The Medium — a conversation. A spirit medium asks each question in type that writes
// itself out; your answers stack up as replies. Leans on the realtime-voice product.

import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react';

import { PixelPumpkin } from '@/components/pixel-pumpkin';
import { Button, buttonStyles } from '@/components/ui/button';
import { FieldError } from '@/components/ui/text-field';
import { beta, successLines } from '@/content/beta';
import { STEPS, type StepId } from '@/lib/beta-signup';
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

const prompts: Record<StepId, string> = {
  email: 'Someone is reaching across. Where should the spirits write back?',
  company: 'I sense an organization around you. Where do you work?',
  'use-case': 'Who are you hoping to reach on the other side? Choose all that apply.',
  referral: 'One more thing. How did you find your way to us?',
  review: 'Let me read back what the spirits recorded.',
};

export function MediumVariant({ flow }: { flow: Flow }) {
  const reduce = !!useReducedMotion();
  const success = flow.status === 'success' && !!flow.result;
  const end = useRef<HTMLDivElement>(null);
  // Review is never in the transcript: it's always the last step, so slicing before it drops it.
  const answered = STEPS.slice(0, success ? STEPS.length - 1 : flow.stepIndex);

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'end' });
  }, [flow.stepIndex, flow.status, reduce]);

  return (
    <div className="flex min-h-dvh flex-col">
      <ProtoChrome />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 pt-8 pb-40 sm:pt-12">
        <div className="flex items-center gap-3 border-b border-dashed pb-6">
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping bg-fgSuccess opacity-60 motion-reduce:animate-none" />
            <span className="relative size-2 bg-fgSuccess" />
          </span>
          <p className="font-mono text-xs tracking-wider text-fg3 uppercase">
            Séance in progress · Medium connected · 13ms to the beyond
          </p>
        </div>

        <ol className="flex flex-col gap-6" aria-label="Conversation">
          {answered.map((step) => (
            <li key={step} className="flex flex-col gap-3">
              <MediumMessage>
                <p>{prompts[step]}</p>
              </MediumMessage>
              <Reply>
                <p className="break-words">{answerText(step, flow.draft)}</p>
              </Reply>
            </li>
          ))}

          {success ? (
            <MediumSuccess flow={flow} reduce={reduce} />
          ) : (
            <CurrentTurn key={flow.step} flow={flow} reduce={reduce} />
          )}
        </ol>
        <div ref={end} />
      </main>
    </div>
  );
}

function CurrentTurn({ flow, reduce }: { flow: Flow; reduce: boolean }) {
  const ref = useRef<HTMLFormElement>(null);
  const [typed, setTyped] = useState(reduce);
  useStepFocus(ref, flow, typed);
  const isReview = flow.step === 'review';

  return (
    <li className="flex flex-col gap-3">
      <p className="sr-only" aria-live="polite">
        Question {flow.stepIndex + 1} of {STEPS.length}
      </p>
      <MediumMessage>
        <Typewriter text={prompts[flow.step]} reduce={reduce} onDone={() => setTyped(true)} />
        {isReview && typed && <ReviewSheet flow={flow} reduce={reduce} />}
      </MediumMessage>

      {/* A CSS transition, not motion: motion skips `animate` changes made right after hydration. */}
      <form
        ref={ref}
        noValidate
        inert={!typed}
        onSubmit={(e) => {
          e.preventDefault();
          if (isReview) flow.submit();
          else flow.next();
        }}
        style={{ transitionDuration: 'var(--proto-duration, 320ms)' }}
        className={cn(
          'transition-[opacity,translate] ease-out motion-reduce:transition-none',
          typed ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
          'ml-auto flex w-full max-w-[92%] flex-col gap-4 border border-dashed border-separator2 p-4 sm:max-w-[85%]',
        )}
      >
        <p
          data-step-heading
          tabIndex={-1}
          className="font-mono text-xs tracking-wider text-fg3 uppercase outline-none"
        >
          Your reply
        </p>
        {!isReview && <StepFields step={flow.step} flow={flow} compact />}
        {flow.status === 'error' && <FieldError>{beta.errors.submit}</FieldError>}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {flow.stepIndex > 0 && (
            <Button variant="ghost" onClick={flow.back} disabled={flow.status === 'submitting'}>
              Take that back
            </Button>
          )}
          <Button type="submit" pending={flow.status === 'submitting'}>
            {isReview
              ? flow.status === 'error'
                ? beta.actions.retry
                : beta.actions.submit
              : flow.returnToReview
                ? 'Save and review'
                : 'Answer'}
          </Button>
        </div>
      </form>
    </li>
  );
}

function ReviewSheet({ flow, reduce }: { flow: Flow; reduce: boolean }) {
  return (
    <motion.dl
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: secs(tune.duration), ease: EASE_OUT }}
      className="mt-3 flex flex-col divide-y divide-dashed border-y border-dashed"
    >
      {reviewRows.map((row) => (
        <div key={row.step} className="flex items-start gap-3 py-2.5">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <dt className="text-xs tracking-wider text-fg3 uppercase">{row.label}</dt>
            <dd className="font-sans break-words text-fg0">{answerText(row.step, flow.draft)}</dd>
          </div>
          <button
            type="button"
            onClick={() => flow.edit(row.step)}
            className="-my-2 inline-flex min-h-10 shrink-0 items-center px-3 font-sans text-sm text-fgAccent1 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-fg1"
            aria-label={`${beta.actions.edit} ${row.label.toLowerCase()}`}
          >
            {beta.actions.edit}
          </button>
        </div>
      ))}
    </motion.dl>
  );
}

function MediumMessage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex max-w-[92%] items-start gap-3 sm:max-w-[85%]', className)}>
      <PixelPumpkin size={28} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 border-l-2 border-pumpkin-500 bg-bgAccent1 px-4 py-3 font-mono text-sm leading-relaxed text-fg0">
        {children}
      </div>
    </div>
  );
}

function Reply({ children }: { children: ReactNode }) {
  return (
    <div className="ml-auto max-w-[85%] border border-separator2 bg-bg2 px-4 py-3 text-fg0">
      {children}
    </div>
  );
}

/** Writes the text out character by character; screen readers get the full sentence at once. */
function Typewriter({
  text,
  reduce,
  onDone,
}: {
  text: string;
  reduce: boolean;
  onDone?: () => void;
}) {
  const [count, setCount] = useState(reduce ? text.length : 0);
  const finish = useEffectEvent(() => onDone?.());

  useEffect(() => {
    if (reduce) {
      finish();
      return;
    }
    let i = 0;
    let timer: number;
    const tick = () => {
      i += 1;
      setCount(i);
      if (i >= text.length) {
        finish();
        return;
      }
      // Pause a beat on punctuation, like someone listening for the next word.
      const pause = /[.,?]/.test(text[i - 1]) ? 8 : 1;
      timer = window.setTimeout(tick, (tune.typeSpeed * pause) / tune.speed);
    };
    timer = window.setTimeout(tick, secs(200) * 1000);
    return () => window.clearTimeout(timer);
  }, [text, reduce]);

  return (
    <p>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {text.slice(0, count)}
        {count < text.length && (
          <span className="ml-px inline-block h-4 w-2 translate-y-0.5 animate-[dk-blink_700ms_steps(1)_infinite] bg-pumpkin-500" />
        )}
      </span>
    </p>
  );
}

function MediumSuccess({ flow, reduce }: { flow: Flow; reduce: boolean }) {
  const lines = flow.result ? successLines(flow.result) : [];
  const [typed, setTyped] = useState(reduce);

  return (
    <li className="flex flex-col gap-3" aria-live="polite">
      <MediumMessage>
        <Typewriter
          text="Transmission received. The other side has your answers."
          reduce={reduce}
          onDone={() => setTyped(true)}
        />
      </MediumMessage>
      {typed &&
        lines.map((line, i) => (
          <motion.div
            key={line.id}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: secs(tune.duration),
              delay: i * secs(tune.stagger * 5),
              ease: EASE_OUT,
            }}
          >
            <MediumMessage>
              <p
                className={cn(
                  'font-sans text-base text-fg2',
                  line.tone === 'sales' && 'text-fgSecondary1',
                )}
              >
                <SuccessLineText line={line} />
              </p>
            </MediumMessage>
          </motion.div>
        ))}
      {typed && (
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: lines.length * secs(tune.stagger * 5) + secs(200) }}
          className="mt-4 flex flex-col items-center gap-6 border-t border-dashed pt-10 text-center"
        >
          <PixelPumpkin
            size={72}
            animate="assemble"
            delay={lines.length * secs(tune.stagger * 5)}
          />
          <p className="font-display text-3xl text-fg0">Séance ended. You’re on the list.</p>
          <Link href="/" className={buttonStyles({ variant: 'secondary' })}>
            Back to DeadKit
          </Link>
        </motion.div>
      )}
    </li>
  );
}
