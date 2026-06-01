import type { UserRole, User } from '../App';

const USERS: Array<{ email: string; password: string; name: string; role: UserRole; matricula: string }> = [
  // ── Administrador ────────────────────────────────────────────
  { email: 'admin@lary.ia.br',                      password: 'admin',       name: 'Administrador',                          role: 'administrador', matricula: '' },

  // ── Supervisores ─────────────────────────────────────────────
  { email: 'eduardo.bueno@hpp.org.br',              password: '21424@2026',  name: 'Eduardo Vinicius Bueno',                 role: 'supervisor',    matricula: '21424' },
  { email: 'renata.andrade@hpp.org.br',             password: '15258@2026',  name: 'Renata Fortunato de Andrade',            role: 'supervisor',    matricula: '15258' },
  { email: 'marlete.zanetti@hpp.org.br',            password: '18150@2026',  name: 'Marlete do Nascimento Zanetti',          role: 'supervisor',    matricula: '18150' },
  { email: 'joao.kinol@hpp.org.br',                 password: '19242@2026',  name: 'João Éder Kinol',                        role: 'supervisor',    matricula: '19242' },
  { email: 'luciano.santos@hpp.org.br',             password: '20467@2026',  name: 'Luciano José dos Santos',                role: 'supervisor',    matricula: '20467' },
  { email: 'camila.rosario@hpp.org.br',             password: '22028@2026',  name: 'Camila Dayane Olexciw do Rosário',       role: 'supervisor',    matricula: '22028' },

  // ── Captadores ───────────────────────────────────────────────
  { email: 'alessandra.silva@cthpp.org.br',         password: '18538@2026',  name: 'Alessandra Batista da Silva',            role: 'captador',      matricula: '18538' },
  { email: 'alessandra.oliveira@cthpp.org.br',      password: '19456@2026',  name: 'Alessandra Veiga Oliveira',              role: 'captador',      matricula: '19456' },
  { email: 'aline.santos@cthpp.org.br',             password: '18355@2026',  name: 'Aline Regina dos Santos',                role: 'captador',      matricula: '18355' },
  { email: 'amanda.lima@cthpp.org.br',              password: '21640@2026',  name: 'Amanda Cristina de Lima',                role: 'captador',      matricula: '21640' },
  { email: 'ariane.melo@cthpp.org.br',              password: '18719@2026',  name: 'Ariane Lara de Melo',                    role: 'captador',      matricula: '18719' },
  { email: 'elisangela.melo@cthpp.org.br',          password: '18969@2026',  name: 'Elisângela Ferreira de Melo',            role: 'captador',      matricula: '18969' },
  { email: 'ilda.cruz@cthpp.org.br',                password: '16139@2026',  name: 'Ilda da Cruz Noronha',                   role: 'captador',      matricula: '16139' },
  { email: 'joelma.carvalho@cthpp.org.br',          password: '21987@2026',  name: 'Joelma Maia Carvalho',                   role: 'captador',      matricula: '21987' },
  { email: 'karina.lima@cthpp.org.br',              password: '21991@2026',  name: 'Karina Soares Siqueira Lima',            role: 'captador',      matricula: '21991' },
  { email: 'marcela.santos@cthpp.org.br',           password: '20418@2026',  name: 'Marcela Andressa Santos',                role: 'captador',      matricula: '20418' },
  { email: 'meri.santos@cthpp.org.br',              password: '18335@2026',  name: 'Meri Suelen de Oliveira Santos',         role: 'captador',      matricula: '18335' },
  { email: 'ana.souza@cthpp.org.br',                password: '21372@2026',  name: 'Ana Carla Pereira de Souza',             role: 'captador',      matricula: '21372' },
  { email: 'heloise.rodrigues@cthpp.org.br',        password: '21983@2026',  name: 'Heloise Regina da Silva Rodrigues',      role: 'captador',      matricula: '21983' },
  { email: 'julia.lima@cthpp.org.br',               password: '21989@2026',  name: 'Julia Letícia de Lima',                  role: 'captador',      matricula: '21989' },
  { email: 'maise.evangelista@cthpp.org.br',        password: '21969@2026',  name: 'Maíse Furtado de Brito Santana Evangelista', role: 'captador', matricula: '21969' },
  { email: 'nathally.neres@cthpp.org.br',           password: '21635@2026',  name: 'Nathally Stefanne De Souza Neres',       role: 'captador',      matricula: '21635' },
  { email: 'paola.gomes@cthpp.org.br',              password: '21375@2026',  name: 'Paola Alexia Domingues Gomes',           role: 'captador',      matricula: '21375' },
  { email: 'stephany.melo@cthpp.org.br',            password: '21377@2026',  name: 'Stephany Gabriele de Souza Melo',        role: 'captador',      matricula: '21377' },
  { email: 'adenilda.santos@cthpp.org.br',          password: '20892@2026',  name: 'Adenilda da Silva dos Santos',           role: 'captador',      matricula: '20892' },
  { email: 'santos.aline@cthpp.org.br',             password: '21971@2026',  name: 'Aline Teodoro dos Santos',               role: 'captador',      matricula: '21971' },
  { email: 'jessica.santos@cthpp.org.br',           password: '21985@2026',  name: 'Jéssica Monteiro dos Santos',            role: 'captador',      matricula: '21985' },
  { email: 'magali.pimentel@cthpp.org.br',          password: '16840@2026',  name: 'Magali de Fatima dos Santos Pimentel',   role: 'captador',      matricula: '16840' },
  { email: 'marcia.cardoso@cthpp.org.br',           password: '16496@2026',  name: 'Marcia de Fatima Ferreira Cardoso',      role: 'captador',      matricula: '16496' },
  { email: 'maria.silva@cthpp.org.br',              password: '18906@2026',  name: 'Maria Anedina Bonifacio da Silva',       role: 'captador',      matricula: '18906' },
  { email: 'maria.godoy@cthpp.org.br',              password: '21650@2026',  name: 'Maria Cristina Medino de Oliveira Godoy', role: 'captador',     matricula: '21650' },
  { email: 'stefanie.casturino@cthpp.org.br',       password: '21652@2026',  name: 'Stefanie de Santana Casturino',          role: 'captador',      matricula: '21652' },
  { email: 'tassila.camargo@cthpp.org.br',          password: '21992@2026',  name: 'Tassila Georgia Cardoso Camargo',        role: 'captador',      matricula: '21992' },
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
    id:        found.email,
    email:     found.email,
    name:      found.name,
    role:      found.role,
    active:    true,
    matricula: found.matricula,
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

/** Chat IA — todos os perfis */
export function canAccessChat(role: UserRole | null): boolean {
  return role === 'captador' || role === 'supervisor' || role === 'administrador';
}

/** Ajuda & Suporte — todos os perfis */
export function canAccessHelp(role: UserRole | null): boolean {
  return role === 'captador' || role === 'supervisor' || role === 'administrador';
}

/** Sobre o Sistema — todos os perfis */
export function canAccessAbout(role: UserRole | null): boolean {
  return role === 'captador' || role === 'supervisor' || role === 'administrador';
}

/** Configurações — todos os perfis */
export function canAccessSettings(role: UserRole | null): boolean {
  return role === 'captador' || role === 'supervisor' || role === 'administrador';
}

/** Equipe & Métricas — supervisor e administrador */
export function canAccessMetrics(role: UserRole | null): boolean {
  return role === 'supervisor' || role === 'administrador';
}

/** Painel Administrativo — somente administrador */
export function canAccessAdmin(role: UserRole | null): boolean {
  return role === 'administrador';
}
