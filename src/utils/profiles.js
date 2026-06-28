import { supabase } from './supabaseClient.js';

export async function getProfile(userId) {
  if (!supabase || !userId) {
    return null;
  }

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function upsertProfile(userId, username) {
  if (!supabase || !userId || !username.trim()) {
    return;
  }

  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    username: username.trim()
  });

  if (error) {
    throw new Error(error.message);
  }
}
