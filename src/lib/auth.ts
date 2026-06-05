import type { UserRole, User } from '../App';
import { supabase } from './supabase';

export type { User };

// ─── Login via Supabase Auth ──────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<User | null> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email:    email.trim().toLowerCase(),
    password: password,
  });

  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, name, role, matricula, active')
    .eq('id', data.user.id)
    .single();

  if (!profile) return null;

  return {
    id:        profile.id,
    email:     profile.email,
    name:      profile.name,
    role:      profile.role as UserRole,
    active:    profile.active ?? true,
    matricula: profile.matricula ?? '',
  };
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getStoredSession(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, name, role, matricula, active')
    .eq('id', session.user.id)
    .single();

  if (!profile) return null;

  return {
    id:        profile.id,
    email:     profile.email,
    name:      profile.name,
    role:      profile.role as UserRole,
    active:    profile.active ?? true,
    matricula: profile.matricula ?? '',
  };
}

// ─── Helpers de permissão ─────────────────────────────────────────────────────

export function canAccessChat(role: UserRole | null): boolean {
  return role === 'captador' || role === 'supervisor' || role === 'administrador';
}
export function canAccessHelp(role: UserRole | null): boolean {
  return role === 'captador' || role === 'supervisor' || role === 'administrador';
}
export function canAccessAbout(role: UserRole | null): boolean {
  return role === 'captador' || role === 'supervisor' || role === 'administrador';
}
export function canAccessSettings(role: UserRole | null): boolean {
  return role === 'captador' || role === 'supervisor' || role === 'administrador';
}
export function canAccessMetrics(role: UserRole | null): boolean {
  return role === 'supervisor' || role === 'administrador';
}
export function canAccessAdmin(role: UserRole | null): boolean {
  return role === 'supervisor' || role === 'administrador';
}
