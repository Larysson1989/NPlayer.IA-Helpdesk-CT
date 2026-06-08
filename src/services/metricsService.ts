import { supabase } from '../lib/supabase';
import type { UserRole } from '../App';

// ─── Tipos ───────────────────────────────────────────────────────────────────────────────
export interface MetricsKPIs {
  totalLogins:     number;
  loginsHoje:      number;
  logins7d:        number;
  totalMensagens:  number;
  mensagensHoje:   number;
  mensagens7d:     number;
  usuariosAtivos:  number;
  usuariosTotal:   number;
}

export interface LoginEntry {
  id:         string;
  user_id:    string;
  user_name:  string;
  user_email: string;
  user_role:  string;
  created_at: string;
}

export interface TopUser {
  user_id:   string;
  user_name: string;
  logins:    number;
  role:      string;
}

export interface WordCount {
  word:  string;
  count: number;
}

// ─── Registrar login ──────────────────────────────────────────────────────────────────────────────
export async function registrarLogin(
  userId: string,
  userName: string,
  userEmail: string,
  userRole: UserRole,
): Promise<void> {
  await supabase.from('login_logs').insert({
    user_id:    userId,
    user_name:  userName,
    user_email: userEmail,
    user_role:  userRole,
  });
}

// ─── Registrar mensagem (chamado no ChatView) ──────────────────────────────────────────────────
export async function registrarMensagem(
  userId: string,
  userName: string,
  pergunta: string,
): Promise<void> {
  await supabase.from('chat_logs').insert({
    user_id:   userId,
    user_name: userName,
    pergunta:  pergunta.slice(0, 1000),
  });
}

// ─── Buscar KPIs ───────────────────────────────────────────────────────────────────────────────
export async function fetchMetricsKPIs(): Promise<MetricsKPIs> {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hoje_iso = hoje.toISOString();

  const d7 = new Date(hoje);
  d7.setDate(d7.getDate() - 7);
  const d7_iso = d7.toISOString();

  const [loginsTotalR, loginsHojeR, logins7dR, msgTotalR, msgHojeR, msg7dR, profilesR] =
    await Promise.all([
      supabase.from('login_logs').select('id', { count: 'exact', head: true }),
      supabase.from('login_logs').select('id', { count: 'exact', head: true }).gte('created_at', hoje_iso),
      supabase.from('login_logs').select('id', { count: 'exact', head: true }).gte('created_at', d7_iso),
      supabase.from('chat_logs').select('id', { count: 'exact', head: true }),
      supabase.from('chat_logs').select('id', { count: 'exact', head: true }).gte('created_at', hoje_iso),
      supabase.from('chat_logs').select('id', { count: 'exact', head: true }).gte('created_at', d7_iso),
      supabase.from('profiles').select('active', { count: 'exact' }),
    ]);

  const totalAtivos = (profilesR.data ?? []).filter((p: { active: boolean }) => p.active).length;

  return {
    totalLogins:    loginsTotalR.count ?? 0,
    loginsHoje:     loginsHojeR.count  ?? 0,
    logins7d:       logins7dR.count    ?? 0,
    totalMensagens: msgTotalR.count    ?? 0,
    mensagensHoje:  msgHojeR.count     ?? 0,
    mensagens7d:    msg7dR.count       ?? 0,
    usuariosAtivos: totalAtivos,
    usuariosTotal:  profilesR.count    ?? 0,
  };
}

// ─── Top 5 usuários que mais logam ─────────────────────────────────────────────────────────────
export async function fetchTopUsers(): Promise<TopUser[]> {
  const { data, error } = await supabase
    .from('login_logs')
    .select('user_id, user_name, user_role');

  if (error || !data) return [];

  const map = new Map<string, { user_name: string; logins: number; role: string }>();
  for (const row of data) {
    const prev = map.get(row.user_id);
    if (prev) prev.logins++;
    else map.set(row.user_id, { user_name: row.user_name, logins: 1, role: row.user_role });
  }

  return [...map.entries()]
    .map(([user_id, v]) => ({ user_id, user_name: v.user_name, logins: v.logins, role: v.role }))
    .sort((a, b) => b.logins - a.logins)
    .slice(0, 5);
}

// ─── Nuvem de palavras das perguntas ────────────────────────────────────────────────────────────
const STOPWORDS = new Set([
  'de','do','da','dos','das','em','no','na','nos','nas','o','a','os','as','e','é',
  'que','para','com','um','uma','se','por','ao','aos','à','às','mais','me','meu','minha',
  'seu','sua','mas','foi','como','ele','ela','tem','ter','ser','isso','este','esta',
  'esse','essa','aqui','ja','nao','não','ou','até','eu','vc','você','qual','quais','onde','quando',
]);

export async function fetchWordCloud(): Promise<WordCount[]> {
  const { data, error } = await supabase
    .from('chat_logs')
    .select('pergunta')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error || !data) return [];

  const freq = new Map<string, number>();
  for (const row of data) {
    const words = (row.pergunta as string)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOPWORDS.has(w));

    for (const w of words) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }

  return [...freq.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 60);
}

// ─── Logins dos últimos 7 dias (para gráfico) ───────────────────────────────────────────────────
export async function fetchLoginsPerDay(): Promise<{ label: string; value: number }[]> {
  const d7 = new Date();
  d7.setDate(d7.getDate() - 6);
  d7.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('login_logs')
    .select('created_at')
    .gte('created_at', d7.toISOString());

  if (error || !data) return [];

  const map = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(d7);
    d.setDate(d.getDate() + i);
    const key = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
    map.set(d.toISOString().slice(0, 10), 0);
  }

  for (const row of data) {
    const key = (row.created_at as string).slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return [...map.entries()].map(([date, value]) => ({
    label: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
    value,
  }));
}
