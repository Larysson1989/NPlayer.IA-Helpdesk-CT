import type { UserRole, User } from '../App';

const USERS: Array<{ email: string; password: string; name: string; role: UserRole }> = [
  {
    email:    'admin@lary.ia.br',
    password: 'admin',
    name:     'Administrador',
    role:     'administrador',
  },
  {
    email:    'tatiana.soares@hpp.org.br',
    password: 'tati2026',
    name:     'Tatiana Soares',
    role:     'supervisor',
  },
  {
    email:    'renata.andrade@hpp.org.br',
    password: 'renata2026',
    name:     'Renata Andrade',
    role:     'supervisor',
  },
  {
    email:    'usuarioct@hpp.org.br',
    password: '123456',
    name:     'Usuário CT',
    role:     'supervisor',
  },
];

const SESSION_KEY = 'nplayer-session';

export type { User };

export function login(email: string, password: string): User | null {
  const found = USERS.find(
    u =>
      u.email.toLowerCase() === email.trim().toLowerCase() &&
      u.password === password
  );
  if (!found) return null;

  const user: User = {
    id:     found.email,
    email:  found.email,
    name:   found.name,
    role:   found.role,
    active: true,
  };

  try { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch { /* silencia */ }
  return user;
}

export function logout(): void {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* silencia */ }
}

export function getStoredSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

// ─── Helpers de permissão ────────────────────────────────────

/** Chat IA, scripts, FAQ e materiais — todos os perfis */
export function canAccessChat(role: UserRole | null): boolean {
  return role === 'captador' || role === 'supervisor' || role === 'administrador';
}

/** Visão de equipe e métricas — supervisor e administrador */
export function canAccessMetrics(role: UserRole | null): boolean {
  return role === 'supervisor' || role === 'administrador';
}

/** Painel administrativo completo — somente administrador */
export function canAccessAdmin(role: UserRole | null): boolean {
  return role === 'administrador';
}