import type { UserRole, User } from '../App';
import { supabase } from './supabase';
import { registrarLogin } from '../services/metricsService';

export type { User };

// ─── Login via Supabase Auth ────────────────────────────────────────────────

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

  const user: User = {
    id:        profile.id,
    email:     profile.email,
    name:      profile.name,
    role:      profile.role as UserRole,
    active:    profile.active ?? true,
    matricula: profile.matricula ?? '',
  };

  // Registra login nas métricas (fire-and-forget)
  registrarLogin(user.id, user.name, user.email, user.role).catch(() => {});

  return user;
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

// ─── Admin: listar todos os usuários ───────────────────────────────────────────────

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, matricula, active')
    .order('name');

  if (error || !data) return [];

  return data.map(p => ({
    id:        p.id,
    email:     p.email,
    name:      p.name,
    role:      p.role as UserRole,
    active:    p.active ?? true,
    matricula: p.matricula ?? '',
  }));
}

// ─── Admin: ativar/desativar usuário ────────────────────────────────────────────────

export async function updateUserActive(id: string, active: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ active })
    .eq('id', id);

  return !error;
}

// ─── Usuário: atualizar nome e/ou senha ───────────────────────────────────────────────

export async function updateUser(
  _email: string,
  updates: { name?: string; password?: string }
): Promise<boolean> {
  let ok = true;

  if (updates.name) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ name: updates.name })
        .eq('id', user.id);
      if (error) ok = false;
    }
  }

  if (updates.password) {
    const { error } = await supabase.auth.updateUser({ password: updates.password });
    if (error) ok = false;
  }

  return ok;
}

// ─── Helpers de permissão ────────────────────────────────────────────────────────────────
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
