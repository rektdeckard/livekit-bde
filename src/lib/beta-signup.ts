/**
 * Séance beta signup: step order, option ids, and validation shared by the client
 * flow and the server action. Labels and copy live in `@/content/beta`.
 */

export const STEPS = ['email', 'company', 'use-case', 'referral', 'review'] as const;
export type StepId = (typeof STEPS)[number];

export const USE_CASE_IDS = ['grief', 'ancestry', 'estate', 'research', 'events', 'sales'] as const;
export type UseCaseId = (typeof USE_CASE_IDS)[number];

export const REFERRAL_IDS = [
  'search',
  'friend',
  'social',
  'podcast',
  'event',
  'beyond',
  'other',
] as const;
export type ReferralId = (typeof REFERRAL_IDS)[number];

export const LIMITS = { email: 254, company: 120, referralOther: 200 } as const;

export type Draft = {
  email: string;
  company: string;
  useCases: UseCaseId[];
  referral: ReferralId | null;
  referralOther: string;
};

export type Field = keyof Draft;
export type FieldErrors = Partial<Record<Field, string>>;

export const emptyDraft: Draft = {
  email: '',
  company: '',
  useCases: [],
  referral: null,
  referralOther: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function validateEmail(value: string): string | undefined {
  const email = normalizeEmail(value);
  if (!email) return 'Enter your email so we know where to reach you.';
  if (email.length > LIMITS.email) return 'That email is too long.';
  if (!email.includes('@')) return 'Your email needs an @ symbol.';
  if (!EMAIL_PATTERN.test(email)) return 'Check the address — it should look like you@company.com.';
}

function validateCompany(value: string): string | undefined {
  const company = value.trim();
  if (!company) return 'Tell us where you work, or “Independent” if you’re on your own.';
  if (company.length > LIMITS.company) return `Keep it under ${LIMITS.company} characters.`;
}

function validateUseCases(value: readonly string[]): string | undefined {
  if (value.length === 0) return 'Pick at least one — you can choose several.';
  if (!value.every(isUseCaseId)) return 'Pick from the options listed.';
}

function validateReferral(referral: string | null, other: string): FieldErrors {
  if (!referral) return { referral: 'Pick the one that fits best.' };
  if (!isReferralId(referral)) return { referral: 'Pick from the options listed.' };
  if (referral === 'other') {
    if (!other.trim()) return { referralOther: 'Tell us where you heard about us.' };
    if (other.trim().length > LIMITS.referralOther)
      return { referralOther: `Keep it under ${LIMITS.referralOther} characters.` };
  }
  return {};
}

export function validateStep(step: StepId, draft: Draft): FieldErrors {
  switch (step) {
    case 'email': {
      const email = validateEmail(draft.email);
      return email ? { email } : {};
    }
    case 'company': {
      const company = validateCompany(draft.company);
      return company ? { company } : {};
    }
    case 'use-case': {
      const useCases = validateUseCases(draft.useCases);
      return useCases ? { useCases } : {};
    }
    case 'referral':
      return validateReferral(draft.referral, draft.referralOther);
    case 'review':
      return {};
  }
}

function stepForField(field: Field): StepId {
  switch (field) {
    case 'email':
      return 'email';
    case 'company':
      return 'company';
    case 'useCases':
      return 'use-case';
    case 'referral':
    case 'referralOther':
      return 'referral';
  }
}

export type Signup = Draft & { referral: ReferralId; contactSales: boolean };

/** Validates and normalizes a complete signup. The server runs this on every submit. */
export function validateSignup(
  input: Draft,
): { ok: true; value: Signup } | { ok: false; errors: FieldErrors; step: StepId } {
  const draft: Draft = {
    email: normalizeEmail(input.email),
    company: input.company.trim(),
    useCases: [...new Set(input.useCases)],
    referral: input.referral,
    referralOther: input.referral === 'other' ? input.referralOther.trim() : '',
  };

  const errors: FieldErrors = {};
  for (const step of STEPS) Object.assign(errors, validateStep(step, draft));

  const failed = Object.keys(errors) as Field[];
  if (failed.length > 0) {
    return { ok: false, errors, step: stepForField(failed[0]) };
  }

  return {
    ok: true,
    value: {
      ...draft,
      // validateStep('referral') above rejects a null referral.
      referral: draft.referral as ReferralId,
      contactSales: draft.useCases.includes('sales'),
    },
  };
}

function isUseCaseId(value: string): value is UseCaseId {
  return (USE_CASE_IDS as readonly string[]).includes(value);
}

function isReferralId(value: string): value is ReferralId {
  return (REFERRAL_IDS as readonly string[]).includes(value);
}
