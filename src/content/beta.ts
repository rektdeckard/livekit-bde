import type { ReferralId, Signup, StepId, UseCaseId } from '@/lib/beta-signup';

/** Copy for the Séance beta signup flow. */
export const beta = {
  capture: {
    label: 'Work email',
    placeholder: 'you@company.com',
    submit: 'Join the beta',
    hint: 'No spam. Only messages from the other side.',
  },

  steps: {
    email: {
      eyebrow: 'Who’s calling',
      title: 'Where should the spirits write back?',
      body: 'We’ll send your beta invite here.',
    },
    company: {
      eyebrow: 'Your coven',
      title: 'Where do you work?',
      body: 'Company, studio, or “Independent” if you haunt alone.',
    },
    'use-case': {
      eyebrow: 'Your purpose',
      title: 'Who are you hoping to reach?',
      body: 'Choose all that apply.',
    },
    referral: {
      eyebrow: 'The grapevine',
      title: 'How did you hear about DeadKit?',
      body: 'Pick the one that fits best.',
    },
    review: {
      eyebrow: 'Before we light the candles',
      title: 'Read it back to yourself',
      body: 'Make sure everything’s right before you send it across.',
    },
  } satisfies Record<StepId, { eyebrow: string; title: string; body: string }>,

  fields: {
    email: 'Email',
    company: 'Company',
    useCases: 'Use cases',
    referral: 'Heard about us',
    referralOther: 'Where?',
  },

  useCases: {
    grief: {
      label: 'Grief & closure',
      description: 'Say the thing you didn’t get to say.',
      success: 'Some conversations deserve a second chance.',
    },
    ancestry: {
      label: 'Ancestor interviews',
      description: 'Ask great-grandma about the old country.',
      success: 'Your ancestors have been waiting to be interviewed.',
    },
    estate: {
      label: 'Estate & probate',
      description: 'Find out what the will actually meant.',
      success: 'Finally, a straight answer about the will.',
    },
    research: {
      label: 'Paranormal research',
      description: 'Structured sessions with timestamped transcripts.',
      success: 'Clean data from the other side is rare. We’ll help.',
    },
    events: {
      label: 'Live séances & events',
      description: 'Sessions for venues, parties, and every October.',
      success: 'Your audience is going to scream. In a good way.',
    },
    sales: {
      label: 'Talk to sales',
      description: 'Enterprise volume, custom veil SLAs, a dedicated medium.',
      success: 'A living member of our team will reach out about enterprise plans.',
    },
  } satisfies Record<UseCaseId, { label: string; description: string; success: string }>,

  referrals: {
    search: 'Search engine',
    friend: 'A friend or colleague',
    social: 'Social media',
    podcast: 'Podcast or newsletter',
    event: 'Conference or meetup',
    beyond: 'A voice from beyond',
    other: 'Somewhere else',
  } satisfies Record<ReferralId, string>,

  actions: {
    next: 'Continue',
    back: 'Back',
    edit: 'Edit',
    submit: 'Send it across',
    retry: 'Try again',
  },

  errors: {
    submit: 'The connection to the other side dropped. Your answers are safe — try again.',
  },
} as const;

/** A line of success copy; `{ answer }` parts are the visitor's own words, rendered with emphasis. */
export type SuccessLine = {
  id: string;
  tone: 'default' | 'sales';
  parts: (string | { answer: string })[];
};

/** Lines for the success state, built from the visitor's own answers. */
export function successLines(signup: Signup): SuccessLine[] {
  const primary = signup.useCases.find((id) => id !== 'sales');
  const lines: SuccessLine[] = [
    { id: 'company', tone: 'default', parts: [{ answer: signup.company }, ', the line is open.'] },
    {
      id: 'email',
      tone: 'default',
      parts: ['We’ll whisper to ', { answer: signup.email }, ' when your séance room is ready.'],
    },
  ];
  if (primary) {
    lines.push({ id: 'use-case', tone: 'default', parts: [beta.useCases[primary].success] });
  }
  if (signup.contactSales) {
    lines.push({ id: 'sales', tone: 'sales', parts: [beta.useCases.sales.success] });
  }
  if (signup.referral === 'beyond') {
    lines.push({ id: 'referral', tone: 'default', parts: ['Tell the voice we said thanks.'] });
  }
  return lines;
}
