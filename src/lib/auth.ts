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

// ─── Admin/Supervisor: criar novo usuário ────────────────────────────────────────────
// Usa signUp padrão. O projeto Supabase deve ter "Confirm email" DESABILITADO
// (Authentication → Settings → Email → Enable email confirmations = OFF)
// para que o usuário seja criado e ativado imediatamente sem e-mail de confirmação.
// O perfil é inserido manualmente na tabela profiles após o signUp.

export interface CreateUserPayload {
  email:     string;
  password:  string;
  name:      string;
  role:      UserRole;
  matricula?: string;
}

export interface CreateUserResult {
  ok:    boolean;
  error?: string;
}

export async function createUser(payload: CreateUserPayload): Promise<CreateUserResult> {
  const email = payload.email.trim().toLowerCase();

  // 1. Verifica se o e-mail já existe na tabela profiles
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: 'Este e-mail já está cadastrado.' };
  }

  // 2. Cria o usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: payload.password,
    options: {
      // Não redireciona para confirmação de e-mail
      emailRedirectTo: undefined,
      data: {
        name: payload.name,
        role: payload.role,
      },
    },
  });

  if (authError || !authData.user) {
    const msg = authError?.message ?? 'Erro ao criar usuário.';
    // Mensagens comuns do Supabase traduzidas
    if (msg.includes('already registered')) return { ok: false, error: 'Este e-mail já está cadastrado.' };
    if (msg.includes('password')) return { ok: false, error: 'Senha inválida (mínimo 6 caracteres).' };
    return { ok: false, error: msg };
  }

  // 3. Insere/atualiza o perfil na tabela profiles
  //    (upsert cobre o caso de um trigger já ter criado o registro)
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id:        authData.user.id,
      email,
      name:      payload.name,
      role:      payload.role,
      matricula: payload.matricula?.trim() || null,
      active:    true,
    }, { onConflict: 'id' });

  if (profileError) {
    return { ok: false, error: 'Usuário criado no Auth, mas erro ao salvar perfil: ' + profileError.message };
  }

  return { ok: true };
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
