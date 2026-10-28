import { notFound } from 'next/navigation';

import { Harness } from './harness';

// Throwaway exploration for the beta onboarding flow. Delete this folder once a direction is picked.
export default async function BetaOnboardingProto({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { v } = await searchParams;
  return <Harness initialVariant={(Number(v) || 1) - 1} />;
}
