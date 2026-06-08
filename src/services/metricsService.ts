import { supabase } from '../lib/supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface KpiData {
  totalUsers: number;
  activeUsers: number;
  totalLogins: number;
  loginsHoje: number;
  loginsEstaSemana: number;
  totalMensagens: number;
  mensagensHoje: number;
  mensagensEstaSemana: number;
  mediaMensagensPorSessao: number;
}

export interface TopUser {
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  total_logins: number;
  ultimo_login: string;
}

export interface WordFreq {
  word: string;
  count: number;
}

// Stop words em português para filtrar da nuvem
const STOP_WORDS = new Set([
  'a','o','e','é','de','da','do','em','na','no','para','por','com','um','uma',
  'os','as','dos','das','que','se','não','mais','mas','ou','ao','aos','às','na',
  'nos','nas','me','meu','minha','seu','sua','seus','suas','isso','este','esta',
  'esse','essa','eles','elas','eu','você','ele','ela','nós','eles','como','quando',
  'onde','qual','quais','quem','há','ter','ser','estar','foi','tem','são','pode',
  'muito','bem','já','sim','não','também','ainda','sobre','entre','depois','antes',
  'assim','então','aqui','ali','lá','vai','vou','vem','vir','ver','faz','fazer',
  'tenho','preciso','quero','gostaria','poderia','seria','favor','obrigado','oi',
  'olá','bom','dia','tarde','noite','tudo','certo','ok','okay','tá','ta',
]);

// ─── Registrar login ──────────────────────────────────────────────────────────
export async function registrarLogin(
  userId: string,
  userName: string,
  userEmail: string,
  userRole: string
): Promise<void> {
  await supabase.from('login_logs').insert({
    user_id:    userId,
    user_name:  userName,
    user_email: userEmail,
    user_role:  userRole,
  });
}

// ─── Registrar mensagem do chat ───────────────────────────────────────────────
export async function registrarMensagem(
  userId: string,
  userName: string,
  userRole: string,
  message: string
): Promise<void> {
  await supabase.from('chat_logs').insert({
    user_id:   userId,
    user_name: userName,
    user_role: userRole,
    message:   message.slice(0, 1000),
  });
}

// ─── KPIs gerais ──────────────────────────────────────────────────────────────
export async function getKpis(): Promise<KpiData> {
  const agora = new Date();
  const inicioDia = new Date(agora); inicioDia.setHours(0, 0, 0, 0);
  const inicioSemana = new Date(agora);
  inicioSemana.setDate(agora.getDate() - agora.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  const [usersRes, loginsRes, mensagensRes] = await Promise.all([
    supabase.from('profiles').select('id, active', { count: 'exact' }),
    supabase.from('login_logs').select('logged_at', { count: 'exact' }),
    supabase.from('chat_logs').select('sent_at', { count: 'exact' }),
  ]);

  const users = usersRes.data || [];
  const logins = loginsRes.data || [];
  const mensagens = mensagensRes.data || [];

  const loginsHoje = logins.filter(l =>
    new Date(l.logged_at) >= inicioDia
  ).length;

  const loginsEstaSemana = logins.filter(l =>
    new Date(l.logged_at) >= inicioSemana
  ).length;

  const mensagensHoje = mensagens.filter(m =>
    new Date(m.sent_at) >= inicioDia
  ).length;

  const mensagensEstaSemana = mensagens.filter(m =>
    new Date(m.sent_at) >= inicioSemana
  ).length;

  const totalLogins = loginsRes.count || logins.length;
  const totalMensagens = mensagensRes.count || mensagens.length;

  return {
    totalUsers:              users.length,
    activeUsers:             users.filter(u => u.active).length,
    totalLogins,
    loginsHoje,
    loginsEstaSemana,
    totalMensagens,
    mensagensHoje,
    mensagensEstaSemana,
    mediaMensagensPorSessao: totalLogins > 0 ? parseFloat((totalMensagens / totalLogins).toFixed(1)) : 0,
  };
}

// ─── Top 5 usuários que mais logam ───────────────────────────────────────────
export async function getTopUsers(): Promise<TopUser[]> {
  const { data, error } = await supabase
    .from('login_logs')
    .select('user_id, user_name, user_email, user_role, logged_at');

  if (error || !data) return [];

  // Agrega por user_id no cliente
  const map = new Map<string, TopUser>();
  for (const row of data) {
    if (!row.user_id) continue;
    if (!map.has(row.user_id)) {
      map.set(row.user_id, {
        user_id:      row.user_id,
        user_name:    row.user_name || 'Desconhecido',
        user_email:   row.user_email || '',
        user_role:    row.user_role || 'captador',
        total_logins: 0,
        ultimo_login: row.logged_at,
      });
    }
    const entry = map.get(row.user_id)!;
    entry.total_logins++;
    if (new Date(row.logged_at) > new Date(entry.ultimo_login)) {
      entry.ultimo_login = row.logged_at;
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.total_logins - a.total_logins)
    .slice(0, 5);
}

// ─── Nuvem de palavras ────────────────────────────────────────────────────────
export async function getWordCloud(): Promise<WordFreq[]> {
  const { data, error } = await supabase
    .from('chat_logs')
    .select('message')
    .order('sent_at', { ascending: false })
    .limit(500);

  if (error || !data || data.length === 0) return [];

  const freq = new Map<string, number>();

  for (const row of data) {
    const words = row.message
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/);

    for (const word of words) {
      if (word.length < 4) continue;
      if (STOP_WORDS.has(word)) continue;
      freq.set(word, (freq.get(word) || 0) + 1);
    }
  }

  return Array.from(freq.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 60);
}
