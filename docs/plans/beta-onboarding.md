# Séance beta onboarding — implementation plan

## Non-negotiable requirements

From the request, fixed:

1. A multi-step onboarding flow where a visitor signs up for the Séance beta.
2. Collected, in order: **email → current company → use case (multi-select) → how did you hear about us → final review/confirmation → submit**.
3. Email capture starts on the **homepage**, built with a **reusable input field** component; the captured email is **prefilled throughout** the onboarding.
4. The use-case question includes a **"talk to sales" option** that acts as the enterprise path.
5. The final step is an **animated success state that references some of the user's answers**.
6. The whole experience is **animated** and carries a **spooky / afterlife theme**, built with the **existing theme tokens and assets** (`src/styles/tokens.css`, `public/brand/pumpkin.svg`, the three fonts).
7. Use the **prototyping skill** to build **several variants** of the experience for the user to compare before the final build.

Repo constraints that apply (from `README.md` / `AGENTS.md`): works in light and dark (`data-dk-theme`), mobile and desktop, respects `prefers-reduced-motion`, only DeadKit colors exist in Tailwind, and Next.js 16.4 APIs must be checked against `node_modules/next/dist/docs/` (async `cookies()`/`searchParams`, global `PageProps`).

## What exists today

- Next 16.4.3 / React 19.3 / Tailwind v4, `motion` 14 installed, `clsx` + `tailwind-merge` via `cn()`.
- `src/app/page.tsx` — placeholder hero; CTAs are plain `<a href="#">`.
- No `Button`, no input, no server actions, no backend, no test runner.
- Copy lives in `src/content/launch.ts` (`as const` objects) — the new copy follows that pattern.

## Shape of the solution

```
/            Hero with <EmailCapture>  ──(server action: validate, set cookie, redirect)──▶  /beta
/beta        Server page reads cookie → <OnboardingFlow initialEmail>
             ?step=email|company|use-case|referral|review   (client-side via history.pushState)
             submit ──(server action: validate everything, persist)──▶ success state (same route)
```

### Email handoff (homepage → /beta)

The email does **not** go in the URL (it would land in server logs, browser history, analytics and `Referer`). Instead:

- `startBetaSignup(prevState, formData)` server action validates the email, mints a random `handoffId` (`crypto.randomUUID()`), sets an `httpOnly`, `sameSite=lax`, `secure` (prod), `path=/beta`, 1-day `dk_beta_handoff` cookie holding `{ email, handoffId }` (JSON), then `redirect('/beta?h=<handoffId>')`. The `h` value is an opaque nonce, not PII.
- Works without JS (native `<form action>` POST + redirect). With JS, `useActionState` shows the inline error and pending state; native `type="email" required` covers the no-JS invalid case.
- `/beta/page.tsx` (server) awaits `searchParams` and `cookies()`, parses the cookie defensively (malformed JSON → ignored), and passes `handoff = { email, handoffId }` to the client **only when `searchParams.h === cookie.handoffId`**. A refresh or a second tab without a matching `h` gets `handoff = null`. Reading cookies makes the route dynamic, which is fine.
- **Consumed once:** the client applies a handoff only if its `handoffId` differs from the draft's stored `handoffId`, then strips `h` from the URL with `replaceState`. Applying a handoff **resets the whole draft** (new email, empty answers, new `submissionId`) — a new homepage entry is a new signup, never a merge of a new email into old answers.

### Flow state

- One client component, `OnboardingFlow`, owns a `useReducer` draft: `{ handoffId, email, company, useCases: UseCaseId[], referral: ReferralId | null, referralOther, submissionId }`.
- **Persistence across refresh:** the draft is mirrored to `sessionStorage` (tab-scoped; not `localStorage`, to keep PII short-lived). Read after mount to avoid a hydration mismatch; until then the shell renders the step frame, and step content fades in once hydrated.
- **Email precedence:** a draft's email, once in the draft, is only ever changed by the user editing it or by a _new_ handoff (see above). A refresh never overwrites an edited email; two tabs keep independent drafts because the handoff is matched by the URL nonce, not by the shared cookie alone.
- **Step in the URL, not the data:** current step is `?step=<id>` written with `window.history.pushState` (Next 16 syncs this into `useSearchParams` without a server round trip — `01-getting-started/04-linking-and-navigating.md` § Native History API). This gives a working browser Back button and direction-aware transitions (compare previous vs. next step index).
- **Guard:** `firstIncompleteStep(draft)` clamps the requested step, so `/beta?step=review` with an empty draft lands on the first incomplete step (`replaceState`, no extra history entry).
- **Edit from review:** each review row has an "Edit" link that jumps to that step with a `returnTo=review` flag; Continue on that step returns straight to review.

### Domain module (shared client + server)

`src/lib/beta-signup.ts` — pure, no React:

- `USE_CASES` (ids + labels live in content; ids here), including `sales` — the enterprise "Talk to sales" option.
- `REFERRALS` single-select, including `other` (reveals a free-text field).
- `validateStep(step, draft)` and `validateSignup(input)` — hand-written (no new dependency for five fields): trims, lowercases email, simple RFC-pragmatic email regex, length caps (email ≤ 254, company 1–120, other ≤ 200), option ids whitelisted, `useCases` non-empty and de-duplicated.
- `firstIncompleteStep(draft)`.

### Submission

`submitBetaSignup(prevState, formData)` server action:

- Re-validates the whole payload server-side with `validateSignup` (never trusts client step validation). Returns `{ ok: false, fieldErrors, step }` so the client can jump to the failing step.
- Honeypot field for basic bot filtering; rate limiting is out of scope.
- **Local logging only (decided: this is a test build).** An accepted submission is written by `src/lib/signup-log.ts` → `logSignup(record)`: a `console.info` line on the server plus one appended line in git-ignored `.data/signups.jsonl`, so signups can be inspected after restarts. Nothing is sent anywhere else; `sales` selections are flagged in the record (`contactSales: true`) for whoever reads the log.
- The client mints a `submissionId` per submit attempt and the review form is locked while `pending`, so a double click sends one request; the id is in each log line, so an accidental duplicate is easy to spot.
- **No enumeration:** the response never depends on earlier submissions, and the success state renders from the caller's own validated payload returned by the action.
- On success: expire the handoff cookie with its matching path — `(await cookies()).set('dk_beta_handoff', '', { path: '/beta', maxAge: 0 })` (a bare `delete()` defaults to `path=/` and would leave it), clear the `sessionStorage` draft, and switch to the success state. Setting the cookie re-renders `/beta` server-side; the client ignores the now-`null` handoff prop. The success state renders from the **server-acknowledged canonical payload** returned by the action, not the client draft.

### Success state (references answers)

Built from the acknowledged submission, e.g.:

- "**Mount Auburn Grief Services**, the line is open." (company)
- "We'll whisper to **you@company.com** when your séance room is ready." (email)
- Use-case line picks the first selected use case's phrase ("Your ancestors have been waiting to be interviewed.").
- If `sales` was selected: "A living member of our team will reach out about enterprise plans." (no response-time promise until a sales owner and SLA exist) — styled with the secondary (purple) accent so the enterprise path is visibly acknowledged.
- If referral is the playful "A voice from beyond": "Tell the voice we said thanks."

Motion: the pumpkin mark's pixel blocks (the SVG is six rects/paths) assemble/flicker into place, then lines materialize one by one (opacity + blur + small y). Under reduced motion: everything renders at its end state, no blocks animation, opacity-only fade at most.

### Components (production, reusable)

| File                                                   | Purpose                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/text-field.tsx`                     | Reusable input: `label` (visible or `sr-only`), `hint`, `error`, all native input props, `ref` as a prop (React 19). `useId` wiring for `htmlFor`, `aria-describedby`, `aria-invalid`. `text-base` (16px) so iOS doesn't zoom. Semantic tokens only (`bg-bg3`, `border-separator1`, focus ring in `pumpkin-500`, error `fgSerious`). Used by the homepage and the email/company/"other" fields. |
| `src/components/ui/button.tsx`                         | `Button` with `variant: 'primary' \| 'secondary' \| 'ghost'`, `pending` (spinner + `aria-busy`, keeps width), and exported `buttonStyles()` so links share the look. Hover/press/focus-visible/disabled states.                                                                                                                                                                                 |
| `src/components/ui/choice.tsx`                         | Card-style **real** `<input type="checkbox                                                                                                                                                                                                                                                                                                                                                      | radio">`inside a`<label>`, used by use-case and referral steps; grouped in `<fieldset>`/`<legend>`. |
| `src/components/email-capture.tsx`                     | Homepage form: `TextField` + `Button`, `useActionState(startBetaSignup)`.                                                                                                                                                                                                                                                                                                                       |
| `src/app/actions/beta.ts`                              | `'use server'` — `startBetaSignup`, `submitBetaSignup`.                                                                                                                                                                                                                                                                                                                                         |
| `src/content/beta.ts`                                  | All flow copy: step titles, option labels, success lines.                                                                                                                                                                                                                                                                                                                                       |
| `src/lib/signup-log.ts`                                | `logSignup()` — console line + append to `.data/signups.jsonl`. `.data/` added to `.gitignore`.                                                                                                                                                                                                                                                                                                 |
| `src/app/beta/page.tsx` + `src/app/beta/_components/*` | Server page, `OnboardingFlow`, one file per step, `SuccessState`.                                                                                                                                                                                                                                                                                                                               |

### Accessibility & interaction details

- On step change, focus moves to the step heading (`tabIndex={-1}`); a visually hidden `aria-live="polite"` region announces "Step 2 of 5".
- Each step is a `<form>`; Enter submits/continues. Validation shows on submit, then live once a field has been touched. Errors linked via `aria-describedby`.
- Autofocus the first field on steps 2+ only (not on homepage load). `autocomplete="email"` / `"organization"`.
- Back button in UI mirrors browser Back.
- `MotionConfig reducedMotion="user"` wraps the flow; CSS keyframes get a `prefers-reduced-motion` override.
- Both themes, 375px width and desktop checked in the browser.

## Phase 1 — Prototype variants

Done **before** building the production flow; nothing in production imports from it.

- **Scope of this run:** the onboarding flow shell — layout, progress indicator, step transitions, and the success moment. Steps use the real `TextField`/`Button`/`Choice` and the real `beta-signup.ts` options, so those are built first (Phase 0).
- **Harness:** `src/app/proto/beta-onboarding/page.tsx` + one file per variant, `notFound()` when `NODE_ENV === 'production'`. Picker copied verbatim from the skill's `PICKER.md` (keys `1–N`, `←/→`, `R` replay, `?v=` persisted). Control panel (plain `<input type="range">`, writes CSS variables) for step-transition duration, blur, stagger, and a 0.25×/0.5×/1× speed multiplier. Panel also has "Fill worst case" and "Jump to step" helpers.
- **Worst content:** 254-char-adjacent email, company "Mount Auburn Cemetery Historical Preservation & Grief Services Cooperative, LLC", all use cases selected including sales, referral `other` with a long answer; also the minimal path (one use case, no sales).
- **Variants (each a defensible direction, different axis):**

| #   | Name             | Axis                                           | Idea                                                                                                                                                                                                                                                                         |
| --- | ---------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Séance Table     | Layout: one question per screen, centered card | Progress is a planchette gliding along a 1–5 track; steps "materialize" (blur + fade + slight rise) and "dissipate" on exit. Success: pumpkin pixels assemble, answers fade in line by line.                                                                                 |
| 2   | Candlelit Ledger | Layout: split view, answers accumulate         | Left rail is a ledger/epitaph that fills in as you answer; right is the current question. Progress = candles lighting (flicker keyframe). Success: candles flare, the ledger becomes the confirmation card. Review step is nearly free because the ledger _is_ the review.   |
| 3   | The Medium       | Interaction model: conversational              | A spirit "medium" asks each question in mono type that writes itself out; answers appear as your replies in a transcript; inputs dock at the bottom. Leans into the realtime-voice product. Success: "transmission received" summarizing your answers in the medium's voice. |

- **Verify, then stop:** flip every variant in the browser (both themes, 375px, reduced motion), clean console, `ui-review` flag list. Present the table with each variant's honest cost. **User picks** (or asks for a riff).
- **After the pick:** write the decision block (direction, chosen durations/easing, rejected variants and why) into `docs/decisions/beta-onboarding.md`, then delete `src/app/proto/` entirely and grep to confirm.

## Build order

0. **Foundations** — `TextField`, `Button`, `Choice`, `beta-signup.ts`, `content/beta.ts`. (Production, needed by both prototypes and final.)
1. **Prototype** — Phase 1 above. Wait for user choice.
2. **Homepage** — replace the hero CTA row with `EmailCapture` + secondary "Read the docs" link; `startBetaSignup` action + cookie.
3. **Flow** — `/beta` page, `OnboardingFlow` (reducer, sessionStorage, step URL, guard), steps in the chosen direction.
4. **Submit + success** — `submitBetaSignup`, `signup-log.ts`, success animation.
5. **Teardown + verify** — delete prototype, decision doc, then verification below.

## Verification

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` (catches Next 16 async-API misuse and server/client boundary errors).
- **Unit tests** for `beta-signup.ts` only (validation, whitelist, length caps, `firstIncompleteStep`) with Vitest added as a dev dependency — it is the one module both trust boundaries depend on.
- Manual pass in the built-in browser:
  - Homepage: valid email → lands on `/beta` with email prefilled; invalid → inline error; JS disabled → still redirects.
  - Refresh mid-flow keeps answers and step; browser Back/Forward move between steps; deep link `?step=review` with empty draft clamps.
  - Edit the prefilled email, refresh → edited email kept. Start A in tab 1, B from the homepage in tab 2, refresh tab 1 → tab 1 still has A's draft. Re-enter from the homepage in the same tab → draft fully reset.
  - Edit-from-review returns to review.
  - Server rejects tampered payloads (unknown use-case id, empty company) and the client jumps to the failing step.
  - Double-click submit → one log line. Restart dev server → `.data/signups.jsonl` still holds earlier signups.
  - After success, a fresh `/beta` request carries no `dk_beta_handoff` cookie.
  - Success copy with and without `sales`, with `other` referral.
  - Light/dark, 375px and desktop, reduced motion (end states, no movement), keyboard-only run-through, VoiceOver spot check of step announcements.

## Out of scope / open questions for you

1. **Where signups go** — decided: logged locally only (console + `.data/signups.jsonl`); no external destination for this test build.
2. **Rate limiting / CAPTCHA / email verification** — honeypot only in v1; submissions are unverified (anyone can type any address).
3. **Analytics on step drop-off** — not included.
4. **No-JS onboarding** — the homepage capture works without JS; the multi-step flow requires JS.
5. `Logo` component from the brief is not part of this work; the success animation animates an inline copy of the pumpkin SVG's blocks.
