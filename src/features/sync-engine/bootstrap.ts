import { getSupabaseClient } from '@/lib/supabase';
import { nowIso, warunginDb, type LocalProfile, type LocalStore } from '@/lib/db';
import { markRelatedQueueItemsSynced } from './queue-helpers';

function userDisplayName(email?: string, name?: string) {
  return name || email?.split('@')[0] || 'Warungin';
}

export async function bootstrapRemoteStore(storeId: string): Promise<LocalStore> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userData.user;
  if (!user) throw new Error('Login Supabase diperlukan sebelum sync.');

  const localStore = await warunginDb.stores.get(storeId);
  if (!localStore) throw new Error('Local store tidak ditemukan.');

  const timestamp = nowIso();
  const displayName = userDisplayName(user.email, user.user_metadata?.name || localStore.name);

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    display_name: displayName,
    email: user.email ?? null,
  });
  if (profileError) throw profileError;

  const localProfile: LocalProfile = {
    localId: user.id,
    remoteId: user.id,
    userId: user.id,
    displayName,
    email: user.email ?? undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
    syncStatus: 'synced',
    lastSyncedAt: timestamp,
  };
  await warunginDb.profiles.put(localProfile);

  if (localStore.remoteId) {
    const { error } = await supabase
      .from('stores')
      .update({
        name: localStore.name,
        business_type: localStore.businessType ?? null,
        address: localStore.address ?? null,
        phone: localStore.phone ?? null,
        receipt_footer: localStore.receiptFooter ?? null,
        receipt_prefix: localStore.receiptPrefix,
        theme_key: localStore.themeKey ?? null,
        onboarding_completed: localStore.onboardingCompleted,
        demo_data_seeded: localStore.demoDataSeeded,
        deleted_at: localStore.deletedAt ?? null,
      })
      .eq('id', localStore.remoteId);
    if (error) throw error;

    const syncedStore = { ...localStore, ownerUserId: user.id, syncStatus: 'synced' as const, lastSyncedAt: timestamp, updatedAt: timestamp };
    await warunginDb.stores.put(syncedStore);
    await markRelatedQueueItemsSynced('store', syncedStore.localId, syncedStore.remoteId);
    return syncedStore;
  }

  const { data: existingStores, error: lookupError } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(1);
  if (lookupError) throw lookupError;

  const existingStoreId = existingStores?.[0]?.id as string | undefined;
  let remoteId = existingStoreId;

  if (!remoteId) {
    const { data, error } = await supabase
      .from('stores')
      .insert({
        owner_user_id: user.id,
        name: localStore.name,
        business_type: localStore.businessType ?? null,
        address: localStore.address ?? null,
        phone: localStore.phone ?? null,
        receipt_footer: localStore.receiptFooter ?? null,
        receipt_prefix: localStore.receiptPrefix,
        theme_key: localStore.themeKey ?? null,
        onboarding_completed: localStore.onboardingCompleted,
        demo_data_seeded: localStore.demoDataSeeded,
      })
      .select('id')
      .single();
    if (error) throw error;
    remoteId = data.id as string;
  }

  const syncedStore = {
    ...localStore,
    remoteId,
    ownerUserId: user.id,
    syncStatus: 'synced' as const,
    lastSyncedAt: timestamp,
    updatedAt: timestamp,
  } satisfies LocalStore;

  await warunginDb.stores.put(syncedStore);
  await markRelatedQueueItemsSynced('store', syncedStore.localId, remoteId);
  return syncedStore;
}
