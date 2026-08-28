import { supabase } from '@/lib/supabase';

export type PairMember = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  pair_id: string;
};

export const createPair = async (displayName: string) => {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  return supabase.rpc('create_pair_with_defaults', { input_display_name: displayName });
};

export const joinPair = async (inviteCode: string, displayName: string) => {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  return supabase.rpc('join_pair_by_code', {
    input_code: inviteCode.trim().toUpperCase(),
    input_display_name: displayName,
  });
};

export const getPairMembers = async (pairId: string) => {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  return supabase.from('profiles').select('id, display_name, avatar_url, pair_id').eq('pair_id', pairId).order('created_at');
};
