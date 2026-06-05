import { createLocalId, nowIso, warunginDb, type OnboardingState } from '@/lib/db';

export async function ensureOnboardingState(storeId: string): Promise<OnboardingState> {
  const existing = await warunginDb.onboardingState.where({ storeId }).first();
  const timestamp = nowIso();

  if (existing) {
    const updated = {
      ...existing,
      updatedAt: timestamp,
    } satisfies OnboardingState;

    await warunginDb.onboardingState.put(updated);
    return updated;
  }

  const state = {
    id: createLocalId('onboarding'),
    storeId,
    currentStep: 'sample-data',
    completed: false,
    demoDataSeeded: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies OnboardingState;

  await warunginDb.onboardingState.add(state);
  return state;
}

export async function markSampleDataSeeded(storeId: string) {
  const state = await ensureOnboardingState(storeId);
  const updated = {
    ...state,
    demoDataSeeded: true,
    updatedAt: nowIso(),
  } satisfies OnboardingState;

  await warunginDb.onboardingState.put(updated);
  return updated;
}
