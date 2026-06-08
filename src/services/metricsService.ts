import { supabase } from '../lib/supabase';
import type { UserRole } from '../App';

// ─── Tipos ───────────────────────────────────────────────────────────────────
export interface MetricsKPIs {
  totalLogins:      number;
  loginsHoje:       number;
  logins7d:         number;
  totalMensagens:   number;
  mensagensHoje:    number;
  mensagens7d:      number;
  usuariosAtivos:   number;
  usuariosTotal:    number;
  // novos
  usuariosInativos3d: number;
  mediaMsgPorUsuario: number;
  taxaRetorno7d:      number; // % usuários que logaram em 2+ dias nos últimos 7
  totalCorrecoes:     number;
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
  mensagens: number;
  role:      string;
  lastSeen:  string;
}

export interface WordCount {
  word:  string;
  count: number;
}

export interface DayCount {
  label: string;
  date:  string;
  logins: number;
  msgs:   number;
}

export interface HourCount {
  hour:  number;
  label: string;
  value: number;
}

export interface UserActivity {
  user_id:   string;
  user_name: string;
  role:      string;
  dias_ativos: number;
  total_msgs:  number;
  ultimo_login: string;
  inativo: boolean;
}

export interface RoleDistribution {
  role:  string;
  count: number;
  msgs:  number;
}

// ─── Registrar login ─────────────────────────────────────────────────────────
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

// ─── Registrar mensagem ───────────────────────────────────────────────────────
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

// ─── helpers ─────────────────────────────────────────────────────────────────
function isoDay(daysAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ─── KPIs principais ─────────────────────────────────────────────────────────
export async function fetchMetricsKPIs(): Promise<MetricsKPIs> {
  const hoje = isoDay(0);
  const d7   = isoDay(7);
  const d3   = isoDay(3);

  const [loginsTotalR, loginsHojeR, logins7dR,
         msgTotalR, msgHojeR, msg7dR,
         profilesR, logins7dAllR, correcoesR] =
    await Promise.all([
      supabase.from('login_logs').select('id',        { count: 'exact', head: true }),
      supabase.from('login_logs').select('id',        { count: 'exact', head: true }).gte('created_at', hoje),
      supabase.from('login_logs').select('id',        { count: 'exact', head: true }).gte('created_at', d7),
      supabase.from('chat_logs' ).select('id',        { count: 'exact', head: true }),
      supabase.from('chat_logs' ).select('id',        { count: 'exact', head: true }).gte('created_at', hoje),
      supabase.from('chat_logs' ).select('id',        { count: 'exact', head: true }).gte('created_at', d7),
      supabase.from('profiles'  ).select('id, active'),
      supabase.from('login_logs').select('user_id, created_at').gte('created_at', d7),
      supabase.from('system_logs').select('id',       { count: 'exact', head: true }).eq('type', 'correction_feedback'),
    ]);

  const profiles   = profilesR.data ?? [];
  const totalAtivos = profiles.filter((p: { active: boolean }) => p.active).length;
  const totalTotal  = profiles.length;

  // usuários inativos: não logaram nos últimos 3 dias mas existem
  const loginRecentes = new Set((logins7dAllR.data ?? []).map((r: { user_id: string }) => r.user_id));
  const inativos3d = profiles.filter((p: { id: string; active: boolean }) =>
    p.active && !loginRecentes.has(p.id)
  ).length;

  // taxa de retorno: usuários que logaram em 2+ dias distintos nos últimos 7
  const diasPorUser = new Map<string, Set<string>>();
  for (const r of (logins7dAllR.data ?? [])) {
    if (!diasPorUser.has(r.user_id)) diasPorUser.set(r.user_id, new Set());
    diasPorUser.get(r.user_id)!.add((r.created_at as string).slice(0, 10));
  }
  const recorrentes = [...diasPorUser.values()].filter(s => s.size >= 2).length;
  const taxaRetorno = diasPorUser.size > 0 ? Math.round((recorrentes / diasPorUser.size) * 100) : 0;

  const mediaMsgPorUsuario = totalAtivos > 0
    ? Math.round((msgTotalR.count ?? 0) / totalAtivos)
    : 0;

  return {
    totalLogins:      loginsTotalR.count ?? 0,
    loginsHoje:       loginsHojeR.count  ?? 0,
    logins7d:         logins7dR.count    ?? 0,
    totalMensagens:   msgTotalR.count    ?? 0,
    mensagensHoje:    msgHojeR.count     ?? 0,
    mensagens7d:      msg7dR.count       ?? 0,
    usuariosAtivos:   totalAtivos,
    usuariosTotal:    totalTotal,
    usuariosInativos3d: inativos3d,
    mediaMsgPorUsuario,
    taxaRetorno7d:    taxaRetorno,
    totalCorrecoes:   correcoesR.count   ?? 0,
  };
}

// ─── Top usuários (logins + mensagens) ────────────────────────────────────────
export async function fetchTopUsers(): Promise<TopUser[]> {
  const [loginsR, msgsR] = await Promise.all([
    supabase.from('login_logs').select('user_id, user_name, user_role, created_at'),
    supabase.from('chat_logs' ).select('user_id, created_at'),
  ]);

  const logins = loginsR.data ?? [];
  const msgs   = msgsR.data   ?? [];

  // contagem de logins por user
  const loginMap = new Map<string, { user_name: string; logins: number; role: string; lastSeen: string }>();
  for (const r of logins) {
    const prev = loginMap.get(r.user_id);
    if (prev) {
      prev.logins++;
      if (r.created_at > prev.lastSeen) prev.lastSeen = r.created_at;
    } else {
      loginMap.set(r.user_id, { user_name: r.user_name, logins: 1, role: r.user_role, lastSeen: r.created_at });
    }
  }

  // contagem de mensagens por user
  const msgMap = new Map<string, number>();
  for (const r of msgs) msgMap.set(r.user_id, (msgMap.get(r.user_id) ?? 0) + 1);

  return [...loginMap.entries()]
    .map(([user_id, v]) => ({
      user_id,
      user_name: v.user_name,
      logins:    v.logins,
      mensagens: msgMap.get(user_id) ?? 0,
      role:      v.role,
      lastSeen:  v.lastSeen,
    }))
    .sort((a, b) => b.logins - a.logins)
    .slice(0, 10);
}

// ─── Nuvem de palavras ────────────────────────────────────────────────────────
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
    for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  }

  return [...freq.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 60);
}

// ─── Série temporal 14 dias (logins + msgs) ───────────────────────────────────
export async function fetchTimeSeries(): Promise<DayCount[]> {
  const d14 = isoDay(13);

  const [loginsR, msgsR] = await Promise.all([
    supabase.from('login_logs').select('created_at').gte('created_at', d14),
    supabase.from('chat_logs' ).select('created_at').gte('created_at', d14),
  ]);

  const days: DayCount[] = [];
  for (let i = 13; i >= 0; i--) {
    const d   = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      date:   key,
      label:  d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      logins: 0,
      msgs:   0,
    });
  }

  for (const r of (loginsR.data ?? [])) {
    const key  = (r.created_at as string).slice(0, 10);
    const slot = days.find(d => d.date === key);
    if (slot) slot.logins++;
  }
  for (const r of (msgsR.data ?? [])) {
    const key  = (r.created_at as string).slice(0, 10);
    const slot = days.find(d => d.date === key);
    if (slot) slot.msgs++;
  }

  return days;
}

// ─── Distribuição por hora do dia ─────────────────────────────────────────────
export async function fetchPeakHours(): Promise<HourCount[]> {
  const d30 = isoDay(30);
  const { data } = await supabase
    .from('chat_logs')
    .select('created_at')
    .gte('created_at', d30);

  const counts = new Array(24).fill(0);
  for (const r of (data ?? [])) {
    // ajusta para UTC-3
    const h = (new Date(r.created_at).getUTCHours() - 3 + 24) % 24;
    counts[h]++;
  }

  return counts.map((value, hour) => ({
    hour,
    label: `${String(hour).padStart(2, '0')}h`,
    value,
  }));
}

// ─── Atividade individual (tabela de usuários) ────────────────────────────────
export async function fetchUserActivity(): Promise<UserActivity[]> {
  const d3 = isoDay(3);

  const [loginsR, msgsR, profilesR] = await Promise.all([
    supabase.from('login_logs').select('user_id, user_name, user_role, created_at'),
    supabase.from('chat_logs' ).select('user_id, created_at'),
    supabase.from('profiles'  ).select('id, active'),
  ]);

  const logins   = loginsR.data   ?? [];
  const msgs     = msgsR.data     ?? [];
  const profiles = profilesR.data ?? [];
  const activeIds = new Set(profiles.filter((p: { active: boolean }) => p.active).map((p: { id: string }) => p.id));

  // mapa por user_id
  const map = new Map<string, { name: string; role: string; dias: Set<string>; msgs: number; lastLogin: string }>();
  for (const r of logins) {
    if (!map.has(r.user_id)) map.set(r.user_id, { name: r.user_name, role: r.user_role, dias: new Set(), msgs: 0, lastLogin: '' });
    const u = map.get(r.user_id)!;
    u.dias.add((r.created_at as string).slice(0, 10));
    if (r.created_at > u.lastLogin) u.lastLogin = r.created_at;
  }
  for (const r of msgs) {
    if (map.has(r.user_id)) map.get(r.user_id)!.msgs++;
  }

  return [...map.entries()]
    .filter(([id]) => activeIds.has(id))
    .map(([user_id, v]) => ({
      user_id,
      user_name:    v.name,
      role:         v.role,
      dias_ativos:  v.dias.size,
      total_msgs:   v.msgs,
      ultimo_login: v.lastLogin,
      inativo:      !v.lastLogin || v.lastLogin < d3,
    }))
    .sort((a, b) => b.total_msgs - a.total_msgs);
}

// ─── Distribuição por role ────────────────────────────────────────────────────
export async function fetchRoleDistribution(): Promise<RoleDistribution[]> {
  const [loginsR, msgsR] = await Promise.all([
    supabase.from('login_logs').select('user_id, user_role'),
    supabase.from('chat_logs' ).select('user_id'),
  ]);

  const logins = loginsR.data ?? [];
  const msgs   = msgsR.data   ?? [];

  // unique users per role (by last login role)
  const userRole = new Map<string, string>();
  for (const r of logins) userRole.set(r.user_id, r.user_role);

  const msgsByUser = new Map<string, number>();
  for (const r of msgs) msgsByUser.set(r.user_id, (msgsByUser.get(r.user_id) ?? 0) + 1);

  const roleMap = new Map<string, { count: number; msgs: number }>();
  for (const [uid, role] of userRole) {
    if (!roleMap.has(role)) roleMap.set(role, { count: 0, msgs: 0 });
    const r = roleMap.get(role)!;
    r.count++;
    r.msgs += msgsByUser.get(uid) ?? 0;
  }

  return [...roleMap.entries()].map(([role, v]) => ({ role, count: v.count, msgs: v.msgs }));
}

// ─── Logins por dia — mantido para compatibilidade ───────────────────────────
export async function fetchLoginsPerDay(): Promise<{ label: string; value: number }[]> {
  const series = await fetchTimeSeries();
  return series.slice(-7).map(d => ({ label: d.label, value: d.logins }));
}
