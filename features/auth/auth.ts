import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export const signUpWithEmail = async (email: string, password: string) => {
  if (!supabase || !isSupabaseConfigured) return { data: null, error: new Error('Supabase is not configured') };
  return supabase.auth.signUp({ email: email.trim(), password });
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!supabase || !isSupabaseConfigured) return { data: null, error: new Error('Supabase is not configured') };
  return supabase.auth.signInWithPassword({ email: email.trim(), password });
};

export const signOut = async () => {
  if (!supabase || !isSupabaseConfigured) return { error: null };
  return supabase.auth.signOut();
};

export const getCurrentSession = async () => {
  if (!supabase || !isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const ensureSession = async () => {
  if (!supabase || !isSupabaseConfigured) return { data: { session: null }, error: new Error('Supabase is not configured') };
  const current = await supabase.auth.getSession();
  if (current.data.session) return current;
  return supabase.auth.signInAnonymously();
};
