import { supabase } from '@/lib/supabase';
import type { Actor } from '@/store/useMomDailyStore';

export type PairMember = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  pair_id: string;
};

export const actorDisplayName = (actor: Actor): '我' | '妈妈' => (actor === 'me' ? '我' : '妈妈');

export const mapPairMembers = (members: PairMember[], currentUserId: string, fallbackActor: Actor) => {
  const current = members.find((member) => member.id === currentUserId);
  const other = members.find((member) => member.id !== currentUserId);
  const activeActor: Actor = current?.display_name === '妈妈' ? 'mom' : current?.display_name === '我' ? 'me' : fallbackActor;
  const me = members.find((member) => member.display_name === '我') ?? (activeActor === 'me' ? current : other);
  const mom = members.find((member) => member.display_name === '妈妈') ?? (activeActor === 'mom' ? current : other);

  return {
    activeActor,
    displayNames: { me: me?.display_name ?? '我', mom: mom?.display_name ?? '妈妈' },
    userIds: { me: me?.id ?? '', mom: mom?.id ?? '' },
  };
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

export const updatePairIdentity = async (actor: Actor) => {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  return supabase.rpc('set_pair_identity', { input_display_name: actorDisplayName(actor) });
};
