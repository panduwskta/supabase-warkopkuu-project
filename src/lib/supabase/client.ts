import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const DEVELOP_BRANCH = 'develop';
const DEVELOP_STAGING_PROJECT_REF = 'bwqunnneefyunebevtyc';

let supabaseClient: SupabaseClient | null | undefined;

function projectRefFromSupabaseUrl(value?: string) {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    const [projectRef, providerDomain] = url.hostname.split('.');
    if (providerDomain === 'supabase') return projectRef;
  } catch {
    return undefined;
  }

  return undefined;
}

export function getConfiguredSupabaseProjectRef() {
  return projectRefFromSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
}

export function getExpectedSupabaseProjectRef() {
  return __APP_GIT_BRANCH__ === DEVELOP_BRANCH ? DEVELOP_STAGING_PROJECT_REF : undefined;
}

export function getSupabaseEnvironmentIssue() {
  const expectedProjectRef = getExpectedSupabaseProjectRef();
  if (!expectedProjectRef) return undefined;

  const configuredProjectRef = getConfiguredSupabaseProjectRef();
  if (configuredProjectRef === expectedProjectRef) return undefined;

  return `Branch ${DEVELOP_BRANCH} harus memakai Supabase staging (${expectedProjectRef}), bukan ${configuredProjectRef || 'env kosong/tidak valid'}.`;
}

export function getSupabaseClient() {
  if (supabaseClient !== undefined) return supabaseClient;

  const environmentIssue = getSupabaseEnvironmentIssue();
  if (environmentIssue) {
    console.error(environmentIssue);
    supabaseClient = null;
    return supabaseClient;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  supabaseClient = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
  return supabaseClient;
}
