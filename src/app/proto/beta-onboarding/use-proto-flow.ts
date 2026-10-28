'use client';

import { useCallback, useRef, useState } from 'react';

import {
  emptyDraft,
  STEPS,
  validateSignup,
  validateStep,
  type Draft,
  type FieldErrors,
  type Signup,
  type StepId,
} from '@/lib/beta-signup';

import { tune } from './tune';

export type Flow = ReturnType<typeof useProtoFlow>;

export const worstCase: Draft = {
  email: 'bartholomew.featherstonehaugh-montgomery@mountauburnhistoricalpreservation.org',
  company: 'Mount Auburn Cemetery Historical Preservation & Grief Services Cooperative, LLC',
  useCases: ['grief', 'ancestry', 'estate', 'research', 'events', 'sales'],
  referral: 'other',
  referralOther:
    'My late grandmother mentioned it during a Ouija session at my aunt’s Halloween party, then my therapist brought it up again the following week',
};

export const minimalCase: Draft = {
  email: 'ana@hex.co',
  company: 'Hex',
  useCases: ['ancestry'],
  referral: 'beyond',
  referralOther: '',
};

/** Prototype-only flow state: same rules as production, fake submit. */
export function useProtoFlow() {
  const [draft, setDraft] = useState<Draft>({ ...emptyDraft, email: 'ana@hex.co' });
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [returnToReview, setReturnToReview] = useState(false);
  const [status, setStatus] = useState<'editing' | 'submitting' | 'error' | 'success'>('editing');
  const [result, setResult] = useState<Signup | null>(null);
  const navigations = useRef(0);

  const step: StepId = STEPS[stepIndex];

  const go = useCallback(
    (index: number) => {
      setDirection(index >= stepIndex ? 1 : -1);
      setStepIndex(index);
      setErrors({});
      navigations.current += 1;
    },
    [stepIndex],
  );

  const update = useCallback(
    (patch: Partial<Draft>) => {
      const next = { ...draft, ...patch };
      setDraft(next);
      // Once a step has shown errors, re-check on every change so they clear as soon as they're fixed.
      if (Object.keys(errors).length > 0) setErrors(validateStep(step, next));
    },
    [draft, errors, step],
  );

  const next = useCallback(() => {
    const found = validateStep(step, draft);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    if (returnToReview) {
      setReturnToReview(false);
      go(STEPS.indexOf('review'));
    } else {
      go(Math.min(stepIndex + 1, STEPS.length - 1));
    }
  }, [draft, go, returnToReview, step, stepIndex]);

  const back = useCallback(() => {
    setReturnToReview(false);
    go(Math.max(stepIndex - 1, 0));
  }, [go, stepIndex]);

  const edit = useCallback(
    (target: StepId) => {
      setReturnToReview(true);
      go(STEPS.indexOf(target));
    },
    [go],
  );

  const submit = useCallback(() => {
    const checked = validateSignup(draft);
    if (!checked.ok) {
      go(STEPS.indexOf(checked.step));
      setErrors(checked.errors);
      return;
    }
    setStatus('submitting');
    window.setTimeout(() => {
      if (tune.failNextSubmit) {
        tune.failNextSubmit = false;
        setStatus('error');
        return;
      }
      setResult(checked.value);
      setStatus('success');
    }, 1100);
  }, [draft, go]);

  const load = useCallback((value: Draft, at: StepId = 'review') => {
    setDraft(value);
    setErrors({});
    setReturnToReview(false);
    setStatus('editing');
    setResult(null);
    setStepIndex(STEPS.indexOf(at));
    setDirection(1);
  }, []);

  const jump = useCallback(
    (at: StepId) => {
      setStatus('editing');
      setResult(null);
      setReturnToReview(false);
      go(STEPS.indexOf(at));
    },
    [go],
  );

  const showSuccess = useCallback(() => {
    // Preview with the current answers, or the worst case when they're incomplete.
    const checked = validateSignup(draft);
    const preview = checked.ok ? checked : validateSignup(worstCase);
    if (!preview.ok) throw new Error('worstCase must be a valid signup');
    setResult(preview.value);
    setStatus('success');
  }, [draft]);

  return {
    draft,
    step,
    stepIndex,
    direction,
    errors,
    status,
    result,
    returnToReview,
    /** True after the visitor has moved between steps at least once — used to decide whether to move focus. */
    hasNavigated: () => navigations.current > 0,
    update,
    next,
    back,
    edit,
    submit,
    load,
    jump,
    showSuccess,
  };
}
