import { supabase } from '../lib/supabase';
import type { UserRole } from '../App';

// ─── Tipos ───────────────────────────────────────────────────────────────────
export interface MetricsKPIs {
  total_users:       number;
  total_logins:      number;
  logins_7d:         number;
  total_msgs:        number;
  msgs_7d:           number;
  unique_users_7d:   number;
  inactive_users:    number;
  total_corrections: number;
  corrections_7d:    number;
  ia_accuracy:       number;
  ia_accuracy_7d:    number;
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
  label:  string;
  date:   string;
  logins: number;
  msgs:   number;
}

export interface HourCount {
  hour:  number;
  label: string;
  value: number;
}

export interface UserActivity {
  user_id:      string;
  user_name:    string;
  role:         string;
  dias_ativos:  number;
  total_msgs:   number;
  ultimo_login: string;
  inativo:      boolean;
}

export interface RoleDistribution {
  role:  string;
  count: number;
  msgs:  number;
}

export interface WeekdayCount {
  label:  string;
  logins: number;
  msgs:   number;
}

export interface UserCorrectionRate {
  user_id:   string;
  user_name: string;
  role:      string;
  correcoes: number;
  msgs:      number;
  taxa:      number;
}

export interface RoleTopWords {
  role:  string;
  words: WordCount[];
}

export interface UserStreak {
  user_id:    string;
  user_name:  string;
  role:       string;
  streak:     number;
  max_streak: number;
}

export interface MsgLengthByRole {
  role:  string;
  media: number;
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
  options?: { resposta?: string; session_id?: string },
): Promise<string | null> {
  const { data, error } = await supabase
    .from('chat_logs')
    .insert({
      user_id:    userId,
      user_name:  userName,
      pergunta:   pergunta.slice(0, 1000),
      resposta:   options?.resposta   ? options.resposta.slice(0, 4000) : null,
      session_id: options?.session_id ?? null,
    })
    .select('id')
    .single();

  if (error || !data) return null;
  return data.id as string;
}

// ─── Avaliar mensagem (satisfação) ────────────────────────────────────────────
// nota: 1 = Ruim (👎) | 3 = Ótimo (👍)
export async function avaliarMensagem(chatLogId: string, nota: 1 | 3): Promise<void> {
  await supabase.from('chat_logs').update({ satisfacao: nota }).eq('id', chatLogId);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isoDay(daysAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ─── KPIs principais ─────────────────────────────────────────────────────────
export async function fetchMetricsKPIs(): Promise<MetricsKPIs> {
  const d7 = isoDay(7);

  const [
    loginsTotalR, logins7dR,
    msgTotalR, msg7dR,
    profilesR, logins7dUsersR,
    corrTotalR, corr7dR,
    satisfacaoR, satisfacao7dR,
  ] = await Promise.all([
    supabase.from('login_logs'    ).select('id',        { count: 'exact', head: true }),
    supabase.from('login_logs'    ).select('id',        { count: 'exact', head: true }).gte('created_at', d7),
    supabase.from('chat_logs'     ).select('id',        { count: 'exact', head: true }),
    supabase.from('chat_logs'     ).select('id',        { count: 'exact', head: true }).gte('created_at', d7),
    supabase.from('profiles'      ).select('id, active'),
    supabase.from('login_logs'    ).select('user_id'   ).gte('created_at', d7),
    supabase.from('ai_corrections').select('id',        { count: 'exact', head: true }),
    supabase.from('ai_corrections').select('id',        { count: 'exact', head: true }).gte('created_at', d7),
    supabase.from('chat_logs'     ).select('satisfacao').not('satisfacao', 'is', null),
    supabase.from('chat_logs'     ).select('satisfacao').not('satisfacao', 'is', null).gte('created_at', d7),
  ]);

  const profiles   = profilesR.data ?? [];
  const totalUsers = profiles.filter((p: { active: boolean }) => p.active).length;

  // Usuários únicos nos últimos 7 dias
  const userIds7d     = new Set((logins7dUsersR.data ?? []).map((r: { user_id: string }) => r.user_id));
  const uniqueUsers7d = userIds7d.size;

  // Usuários ativos que não logaram nos últimos 7 dias
  const inactiveUsers = profiles.filter(
    (p: { id: string; active: boolean }) => p.active && !userIds7d.has(p.id)
  ).length;

  // Correções da tabela ai_corrections
  const totalCorrections = corrTotalR.count ?? 0;
  const corrections7d    = corr7dR.count    ?? 0;

  // Taxa de acerto baseada em chat_logs.satisfacao
  const rated      = (satisfacaoR.data  ?? []) as { satisfacao: number }[];
  const rated7d    = (satisfacao7dR.data ?? []) as { satisfacao: number }[];
  const positive   = rated.filter(r => r.satisfacao === 3).length;
  const positive7d = rated7d.filter(r => r.satisfacao === 3).length;
  const iaAccuracy   = rated.length   > 0 ? Math.round((positive   / rated.length)   * 100) : 100;
  const iaAccuracy7d = rated7d.length > 0 ? Math.round((positive7d / rated7d.length) * 100) : 100;

  return {
    total_users:       totalUsers,
    total_logins:      loginsTotalR.count ?? 0,
    logins_7d:         logins7dR.count    ?? 0,
    total_msgs:        msgTotalR.count    ?? 0,
    msgs_7d:           msg7dR.count       ?? 0,
    unique_users_7d:   uniqueUsers7d,
    inactive_users:    inactiveUsers,
    total_corrections: totalCorrections,
    corrections_7d:    corrections7d,
    ia_accuracy:       iaAccuracy,
    ia_accuracy_7d:    iaAccuracy7d,
  };
}

// ─── Top usuários ─────────────────────────────────────────────────────────────
export async function fetchTopUsers(): Promise<TopUser[]> {
  const [loginsR, msgsR] = await Promise.all([
    supabase.from('login_logs').select('user_id, user_name, user_role, created_at'),
    supabase.from('chat_logs' ).select('user_id'),
  ]);

  const logins = loginsR.data ?? [];
  const msgs   = msgsR.data   ?? [];

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
    const text = (row.pergunta as string | null) ?? '';
    if (!text) continue;
    const words = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
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

// ─── Série temporal 14 dias ───────────────────────────────────────────────────
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
    const h = (new Date(r.created_at).getUTCHours() - 3 + 24) % 24;
    counts[h]++;
  }

  return counts.map((value, hour) => ({
    hour,
    label: `${String(hour).padStart(2, '0')}h`,
    value,
  }));
}

// ─── Atividade individual ─────────────────────────────────────────────────────
export async function fetchUserActivity(): Promise<UserActivity[]> {
  const d3 = isoDay(3);

  const [loginsR, msgsR, profilesR] = await Promise.all([
    supabase.from('login_logs').select('user_id, user_name, user_role, created_at'),
    supabase.from('chat_logs' ).select('user_id'),
    supabase.from('profiles'  ).select('id, active'),
  ]);

  const logins   = loginsR.data   ?? [];
  const msgs     = msgsR.data     ?? [];
  const profiles = profilesR.data ?? [];
  const activeIds = new Set(
    profiles.filter((p: { active: boolean }) => p.active).map((p: { id: string }) => p.id)
  );

  const map = new Map<string, { name: string; role: string; dias: Set<string>; msgs: number; lastLogin: string }>();
  for (const r of logins) {
    if (!map.has(r.user_id)) {
      map.set(r.user_id, { name: r.user_name, role: r.user_role, dias: new Set(), msgs: 0, lastLogin: '' });
    }
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

export async function fetchLoginsPerDay(): Promise<{ label: string; value: number }[]> {
  const series = await fetchTimeSeries();
  return series.slice(-7).map(d => ({ label: d.label, value: d.logins }));
}

// ─── Distribuição por dia da semana ──────────────────────────────────────────
export async function fetchWeekdayDistribution(): Promise<WeekdayCount[]> {
  const d30  = isoDay(30);
  const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const [loginsR, msgsR] = await Promise.all([
    supabase.from('login_logs').select('created_at').gte('created_at', d30),
    supabase.from('chat_logs' ).select('created_at').gte('created_at', d30),
  ]);

  const result: WeekdayCount[] = DIAS.map(label => ({ label, logins: 0, msgs: 0 }));

  for (const r of (loginsR.data ?? [])) result[new Date(r.created_at).getDay()].logins++;
  for (const r of (msgsR.data   ?? [])) result[new Date(r.created_at).getDay()].msgs++;

  return result;
}

// ─── Taxas de correção por usuário ───────────────────────────────────────────
export async function fetchUserCorrectionRates(): Promise<UserCorrectionRate[]> {
  const [loginsR, msgsR, correctionsR] = await Promise.all([
    supabase.from('login_logs'    ).select('user_id, user_name, user_email, user_role'),
    supabase.from('chat_logs'     ).select('user_id'),
    supabase.from('ai_corrections').select('user_email'),
  ]);

  // Mapa de usuários a partir dos logins (deduplica por user_id)
  const userMap = new Map<string, { name: string; role: string; email: string }>();
  for (const r of (loginsR.data ?? [])) {
    if (!userMap.has(r.user_id)) {
      userMap.set(r.user_id, { name: r.user_name, role: r.user_role, email: r.user_email });
    }
  }

  // Contagem de mensagens por user_id
  const msgCount = new Map<string, number>();
  for (const r of (msgsR.data ?? [])) {
    msgCount.set(r.user_id, (msgCount.get(r.user_id) ?? 0) + 1);
  }

  // Contagem de correções por user_email (ai_corrections)
  const corrByEmail = new Map<string, number>();
  for (const r of (correctionsR.data ?? [])) {
    corrByEmail.set(r.user_email, (corrByEmail.get(r.user_email) ?? 0) + 1);
  }

  return [...userMap.entries()]
    .map(([user_id, v]) => {
      const msgs      = msgCount.get(user_id) ?? 0;
      const correcoes = corrByEmail.get(v.email) ?? 0;
      const taxa      = msgs > 0 ? Math.round((correcoes / msgs) * 1000) / 10 : 0;
      return { user_id, user_name: v.name, role: v.role, correcoes, msgs, taxa };
    })
    .filter(u => u.msgs > 0)
    .sort((a, b) => b.correcoes - a.correcoes)
    .slice(0, 10);
}

// ─── Top palavras por role ────────────────────────────────────────────────────
export async function fetchTopWordsByRole(): Promise<RoleTopWords[]> {
  const [loginsR, chatR] = await Promise.all([
    supabase.from('login_logs').select('user_id, user_role'),
    supabase.from('chat_logs' ).select('user_id, pergunta').order('created_at', { ascending: false }).limit(1000),
  ]);

  const userRole = new Map<string, string>();
  for (const r of (loginsR.data ?? [])) userRole.set(r.user_id, r.user_role);

  const roleFreq = new Map<string, Map<string, number>>();

  for (const row of (chatR.data ?? [])) {
    const role = userRole.get(row.user_id) ?? 'desconhecido';
    if (!roleFreq.has(role)) roleFreq.set(role, new Map());
    const freq = roleFreq.get(role)!;

    const text = (row.pergunta as string | null) ?? '';
    if (!text) continue;
    const words = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOPWORDS.has(w));
    for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  }

  return [...roleFreq.entries()].map(([role, freq]) => ({
    role,
    words: [...freq.entries()]
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  }));
}

// ─── Streaks de atividade ─────────────────────────────────────────────────────
export async function fetchUserStreaks(): Promise<UserStreak[]> {
  const { data: logins } = await supabase
    .from('login_logs')
    .select('user_id, user_name, user_role, created_at');

  const userDays = new Map<string, { name: string; role: string; days: Set<string> }>();
  for (const r of (logins ?? [])) {
    if (!userDays.has(r.user_id)) {
      userDays.set(r.user_id, { name: r.user_name, role: r.user_role, days: new Set() });
    }
    userDays.get(r.user_id)!.days.add((r.created_at as string).slice(0, 10));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return [...userDays.entries()].map(([user_id, v]) => {
    const sorted = [...v.days].sort().reverse();

    let streak = 0;
    const cursor = new Date(today);
    for (let i = 0; i < 365; i++) {
      const key = cursor.toISOString().slice(0, 10);
      if (v.days.has(key)) {
        streak++;
      } else if (streak === 0) {
        cursor.setDate(cursor.getDate() - 1);
        const yesterday = cursor.toISOString().slice(0, 10);
        if (v.days.has(yesterday)) { streak++; cursor.setDate(cursor.getDate() - 1); continue; }
        else break;
      } else {
        break;
      }
      cursor.setDate(cursor.getDate() - 1);
    }

    let maxStreak = 0;
    let currentRun = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
      if (diff === 1) {
        currentRun++;
        maxStreak = Math.max(maxStreak, currentRun);
      } else {
        currentRun = 1;
      }
    }
    maxStreak = Math.max(maxStreak, currentRun, streak);

    return { user_id, user_name: v.name, role: v.role, streak, max_streak: maxStreak };
  })
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 10);
}

// ─── Tamanho médio de mensagem por role ──────────────────────────────────────
export async function fetchMsgLengthByRole(): Promise<MsgLengthByRole[]> {
  const [loginsR, chatR] = await Promise.all([
    supabase.from('login_logs').select('user_id, user_role'),
    supabase.from('chat_logs' ).select('user_id, pergunta').order('created_at', { ascending: false }).limit(500),
  ]);

  const userRole = new Map<string, string>();
  for (const r of (loginsR.data ?? [])) userRole.set(r.user_id, r.user_role);

  const roleData = new Map<string, number[]>();
  for (const row of (chatR.data ?? [])) {
    const role = userRole.get(row.user_id) ?? 'desconhecido';
    if (!roleData.has(role)) roleData.set(role, []);
    roleData.get(role)!.push((row.pergunta as string)?.length ?? 0);
  }

  const LABELS: Record<string, string> = {
    captador: 'Captador', supervisor: 'Supervisor', administrador: 'Admin',
  };

  return [...roleData.entries()]
    .map(([role, lengths]) => ({
      role:  LABELS[role] ?? role,
      media: lengths.length > 0
        ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
        : 0,
    }))
    .sort((a, b) => b.media - a.media);
}
