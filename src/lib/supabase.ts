import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isDemoMode } from "./demoMode";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isConfigured = Boolean(url && anonKey);

/** The demo never opens an account client, including an existing persisted session. */
export const supabase: SupabaseClient | null =
  url && anonKey && !isDemoMode()
    ? createClient(url, anonKey, { auth: { persistSession: true } })
    : null;
