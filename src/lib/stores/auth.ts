// src/lib/stores/auth.ts
import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import { setLang } from '$lib/i18n/index';
import type { UserProfile } from '$lib/types';

export const authStore = writable<{ user: UserProfile | null }>({ user: null });

export async function loadSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { authStore.set({ user: null }); return; }

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (data) {
    authStore.set({ user: data as UserProfile });
    setLang(data.language);
  }
}

export async function login(username: string, password: string) {
  const email = `${username}@mathprimaire.local`;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error('invalidCredentials');
  await loadSession();
}

export async function logout() {
  await supabase.auth.signOut();
  authStore.set({ user: null });
}
