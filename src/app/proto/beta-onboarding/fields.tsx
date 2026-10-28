'use client';

import Link from 'next/link';
import { useEffect, useRef, type RefObject } from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import { Choice } from '@/components/ui/choice';
import { FieldError, TextField } from '@/components/ui/text-field';
import { beta, type SuccessLine } from '@/content/beta';
import { LIMITS, REFERRAL_IDS, USE_CASE_IDS, type Draft, type StepId } from '@/lib/beta-signup';

import type { Flow } from './use-proto-flow';

/** Site header, so each variant is judged in its real surroundings. */
export function ProtoChrome() {
  return (
    <header className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
      <Link href="/" className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/pumpkin.svg" alt="" width={28} height={28} />
        <span className="font-display text-lg font-semibold text-fg0">DeadKit</span>
      </Link>
      <ThemeToggle />
    </header>
  );
}

/**
 * After the visitor moves between steps, focus the step's first control — or its heading on
 * touch devices, so the keyboard doesn't pop open on every step.
 */
export function useStepFocus(container: RefObject<HTMLElement | null>, flow: Flow, ready = true) {
  const shouldFocus = useRef(flow.hasNavigated());
  useEffect(() => {
    if (!ready || !shouldFocus.current || !container.current) return;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const target = coarse
      ? container.current.querySelector<HTMLElement>('[data-step-heading]')
      : (container.current.querySelector<HTMLElement>('input:not([type=hidden])') ??
        container.current.querySelector<HTMLElement>('[data-step-heading]'));
    target?.focus({ preventScroll: true });
  }, [container, ready]);
}

export function StepFields({
  step,
  flow,
  compact = false,
}: {
  step: StepId;
  flow: Flow;
  compact?: boolean;
}) {
  const { draft, errors, update } = flow;

  if (step === 'email') {
    return (
      <TextField
        label={beta.fields.email}
        type="email"
        name="email"
        autoComplete="email"
        spellCheck={false}
        maxLength={LIMITS.email}
        value={draft.email}
        onChange={(e) => update({ email: e.currentTarget.value })}
        error={errors.email}
        placeholder={beta.capture.placeholder}
      />
    );
  }

  if (step === 'company') {
    return (
      <TextField
        label={beta.fields.company}
        name="company"
        autoComplete="organization"
        maxLength={LIMITS.company}
        value={draft.company}
        onChange={(e) => update({ company: e.currentTarget.value })}
        error={errors.company}
        placeholder="Mount Auburn Grief Services"
      />
    );
  }

  if (step === 'use-case') {
    const regular = USE_CASE_IDS.filter((id) => id !== 'sales');
    const toggle = (id: (typeof USE_CASE_IDS)[number], on: boolean) =>
      update({
        useCases: on ? [...draft.useCases, id] : draft.useCases.filter((value) => value !== id),
      });

    return (
      <fieldset
        className="flex flex-col gap-3"
        aria-describedby={errors.useCases ? 'use-cases-error' : undefined}
      >
        <legend className="sr-only">{beta.steps['use-case'].title}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {regular.map((id) => (
            <Choice
              key={id}
              type="checkbox"
              name="useCases"
              value={id}
              checked={draft.useCases.includes(id)}
              onChange={(e) => toggle(id, e.currentTarget.checked)}
              label={beta.useCases[id].label}
              description={compact ? undefined : beta.useCases[id].description}
            />
          ))}
        </div>
        <Choice
          type="checkbox"
          name="useCases"
          value="sales"
          tone="secondary"
          checked={draft.useCases.includes('sales')}
          onChange={(e) => toggle('sales', e.currentTarget.checked)}
          label={
            <span className="flex flex-wrap items-center gap-2">
              {beta.useCases.sales.label}
              <span className="font-mono text-xs tracking-wider text-fgSecondary1 uppercase">
                Enterprise
              </span>
            </span>
          }
          description={beta.useCases.sales.description}
        />
        {errors.useCases && <FieldError id="use-cases-error">{errors.useCases}</FieldError>}
      </fieldset>
    );
  }

  if (step === 'referral') {
    return (
      <fieldset
        className="flex flex-col gap-3"
        aria-describedby={errors.referral ? 'referral-error' : undefined}
      >
        <legend className="sr-only">{beta.steps.referral.title}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {REFERRAL_IDS.map((id) => (
            <Choice
              key={id}
              type="radio"
              name="referral"
              value={id}
              checked={draft.referral === id}
              onChange={() => update({ referral: id })}
              label={beta.referrals[id]}
            />
          ))}
        </div>
        {errors.referral && <FieldError id="referral-error">{errors.referral}</FieldError>}
        {draft.referral === 'other' && (
          <TextField
            label={beta.fields.referralOther}
            name="referralOther"
            maxLength={LIMITS.referralOther}
            value={draft.referralOther}
            onChange={(e) => update({ referralOther: e.currentTarget.value })}
            error={errors.referralOther}
          />
        )}
      </fieldset>
    );
  }

  return null;
}

/** The visitor's answer for a step, as display text. */
export function answerText(step: StepId, draft: Draft): string {
  switch (step) {
    case 'email':
      return draft.email.trim();
    case 'company':
      return draft.company.trim();
    case 'use-case':
      return draft.useCases.map((id) => beta.useCases[id].label).join(', ');
    case 'referral':
      if (!draft.referral) return '';
      return draft.referral === 'other'
        ? draft.referralOther.trim()
        : beta.referrals[draft.referral];
    case 'review':
      return '';
  }
}

export const reviewRows = [
  { step: 'email', label: beta.fields.email },
  { step: 'company', label: beta.fields.company },
  { step: 'use-case', label: beta.fields.useCases },
  { step: 'referral', label: beta.fields.referral },
] as const satisfies { step: StepId; label: string }[];

export function SuccessLineText({ line }: { line: SuccessLine }) {
  return (
    <>
      {line.parts.map((part, i) =>
        typeof part === 'string' ? (
          part
        ) : (
          <strong key={i} className="font-medium break-words text-fg0">
            {part.answer}
          </strong>
        ),
      )}
    </>
  );
}
