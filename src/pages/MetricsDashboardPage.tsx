import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, LogOut, RefreshCw, Users, MessageSquare,
  LogIn, BarChart2, TrendingUp, AlertTriangle, Clock,
  Repeat2, ThumbsDown, UserX, Activity,
} from 'lucide-react';
import { UserAvatar } from '../components/UserAvatar';
import {
  fetchMetricsKPIs, fetchTopUsers, fetchWordCloud,
  fetchTimeSeries, fetchPeakHours, fetchUserActivity, fetchRoleDistribution,
  type MetricsKPIs, type TopUser, type WordCount,
  type DayCount, type HourCount, type UserActivity, type RoleDistribution,
} from '../services/metricsService';
import type { UserRole } from '../App';

interface Props {
  adminName: string;
  adminRole: UserRole;
  onBack:   () => void;
  onLogout: () => void;
}

const ROLE_COLOR: Record<string, { badge: string; bar: string }> = {
  captador:      { badge: 'text-blue-600 bg-blue-50',    bar: '#3b82f6' },
  supervisor:    { badge: 'text-purple-600 bg-purple-50', bar: '#9333ea' },
  administrador: { badge: 'text-emerald-700 bg-emerald-50', bar: '#059669' },
};

function fmt(n: number) { return n.toLocaleString('pt-BR'); }

function relTime(iso: string): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'agora';
  if (m < 60)  return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

// ─── Componentes utilitários ─────────────────────────────────────────────────

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-blue-500">{icon}</span>
      <div>
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function KpiCard({
  label, value, icon, color, suffix, delta, alert,
}: {
  label: string; value: number | string; icon: React.ReactNode;
  color: string; suffix?: string; delta?: string; alert?: boolean;
}) {
  const COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    icon: 'text-blue-400'    },
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  icon: 'text-indigo-400'  },
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  icon: 'text-violet-400'  },
    sky:     { bg: 'bg-sky-50',     text: 'text-sky-700',     icon: 'text-sky-400'     },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-400' },
    teal:    { bg: 'bg-teal-50',    text: 'text-teal-700',    icon: 'text-teal-400'    },
    cyan:    { bg: 'bg-cyan-50',    text: 'text-cyan-700',    icon: 'text-cyan-400'    },
    green:   { bg: 'bg-green-50',   text: 'text-green-700',   icon: 'text-green-400'   },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: 'text-amber-400'   },
    red:     { bg: 'bg-red-50',     text: 'text-red-700',     icon: 'text-red-400'     },
    purple:  { bg: 'bg-purple-50',  text: 'text-purple-700',  icon: 'text-purple-400'  },
    slate:   { bg: 'bg-slate-100',  text: 'text-slate-700',   icon: 'text-slate-400'   },
  };
  const c = COLORS[color] ?? COLORS.blue;
  return (
    <div className={`${c.bg} ${alert ? 'ring-2 ring-red-300' : ''} rounded-2xl p-4 flex flex-col gap-2 relative`}>
      {alert && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
      )}
      <div className={`${c.icon} w-8 h-8 flex items-center justify-center`}>{icon}</div>
      <p className="text-xs font-semibold text-slate-500 leading-snug">{label}</p>
      <p className={`text-2xl font-black tabular-nums ${c.text}`}>
        {typeof value === 'number' ? fmt(value) : value}
        {suffix && <span className="text-sm font-semibold text-slate-400 ml-0.5">{suffix}</span>}
      </p>
      {delta && <p className="text-xs text-slate-400 font-semibold">{delta}</p>}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center py-12">
      <p className="text-sm font-semibold text-slate-300">{label}</p>
    </div>
  );
}

// ─── Gráfico de barras duplas (logins + msgs por dia) ────────────────────────
function TimeSeriesChart({ data }: { data: DayCount[] }) {
  const maxVal = Math.max(...data.map(d => Math.max(d.logins, d.msgs)), 1);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-4 mb-4">
        <span className="flex items-center gap-1.5 text-xs font-bold text-blue-500">
          <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Logins
        </span>
        <span className="flex items-center gap-1.5 text-xs font-bold text-violet-500">
          <span className="w-3 h-3 rounded-sm bg-violet-500 inline-block" /> Mensagens
        </span>
      </div>
      <div className="flex items-end gap-1.5 h-36 overflow-x-auto pb-1">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-[28px]">
            <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: 96 }}>
              <div
                title={`Logins: ${d.logins}`}
                className="bg-blue-500 rounded-t w-2 md:w-3 transition-all hover:bg-blue-600"
                style={{ height: `${Math.max(2, (d.logins / maxVal) * 96)}px` }}
              />
              <div
                title={`Mensagens: ${d.msgs}`}
                className="bg-violet-500 rounded-t w-2 md:w-3 transition-all hover:bg-violet-600"
                style={{ height: `${Math.max(2, (d.msgs / maxVal) * 96)}px` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 font-semibold text-center leading-none">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Gráfico de heatmap de horas ─────────────────────────────────────────────
function PeakHoursChart({ data }: { data: HourCount[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const workHours = data.filter(d => d.hour >= 7 && d.hour <= 21);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <p className="text-xs text-slate-400 font-semibold mb-3">Horários comerciais (07h–21h) · últimos 30 dias</p>
      <div className="flex items-end gap-1 h-20">
        {workHours.map((d, i) => {
          const ratio = d.value / max;
          const bg = ratio > 0.7 ? 'bg-red-400' : ratio > 0.4 ? 'bg-amber-400' : ratio > 0.1 ? 'bg-blue-400' : 'bg-slate-200';
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold text-slate-400">{d.value > 0 ? d.value : ''}</span>
              <div
                title={`${d.label}: ${d.value} msgs`}
                className={`w-full rounded-t ${bg} transition-all`}
                style={{ height: `${Math.max(3, ratio * 56)}px` }}
              />
              <span className="text-[8px] text-slate-400 font-semibold">{d.label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-3">
        <span className="flex items-center gap-1 text-[10px] text-slate-400"><span className="w-2 h-2 rounded bg-red-400" /> Alto</span>
        <span className="flex items-center gap-1 text-[10px] text-slate-400"><span className="w-2 h-2 rounded bg-amber-400" /> Médio</span>
        <span className="flex items-center gap-1 text-[10px] text-slate-400"><span className="w-2 h-2 rounded bg-blue-400" /> Baixo</span>
      </div>
    </div>
  );
}

// ─── Distribuição por role (barras horizontais) ───────────────────────────────
function RoleChart({ data }: { data: RoleDistribution[] }) {
  const maxMsgs = Math.max(...data.map(d => d.msgs), 1);
  const labels: Record<string, string> = {
    captador: 'Captador', supervisor: 'Supervisor', administrador: 'Admin',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
      {data.map((d, i) => {
        const rc = ROLE_COLOR[d.role] ?? { badge: 'text-slate-500 bg-slate-100', bar: '#94a3b8' };
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${rc.badge}`}>
                {labels[d.role] ?? d.role}
              </span>
              <span className="text-xs font-black text-slate-600">{fmt(d.msgs)} msgs · {d.count} users</span>
            </div>
            <div className="bg-slate-100 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${(d.msgs / maxMsgs) * 100}%`, backgroundColor: rc.bar }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tabela de atividade individual ──────────────────────────────────────────
function UserActivityTable({ data }: { data: UserActivity[] }) {
  const [filter, setFilter] = useState<'todos' | 'inativos'>('todos');
  const shown = filter === 'inativos' ? data.filter(u => u.inativo) : data;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-50">
        <p className="text-xs font-black uppercase tracking-wider text-slate-500">Atividade por usuário</p>
        <div className="flex gap-1">
          {(['todos', 'inativos'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              {f === 'todos' ? 'Todos' : `⚠ Inativos (${data.filter(u => u.inativo).length})`}
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <div className="py-10 text-center text-slate-300 text-sm font-semibold">Nenhum usuário encontrado</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                {['Usuário', 'Perfil', 'Dias ativos', 'Perguntas', 'Último login', 'Status'].map(h => (
                  <th key={h} className="text-left text-[10px] font-black uppercase tracking-wider text-slate-400 px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((u, i) => (
                <tr key={u.user_id} className={`border-b border-slate-50 last:border-0 ${
                  u.inativo ? 'bg-red-50/30' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                }`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar name={u.user_name} size="sm" />
                      <span className="text-sm font-bold text-slate-800 truncate max-w-[140px]">{u.user_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      ROLE_COLOR[u.role]?.badge ?? 'text-slate-500 bg-slate-100'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold tabular-nums text-slate-700">{u.dias_ativos}</td>
                  <td className="px-4 py-3 text-sm font-bold tabular-nums text-slate-700">{fmt(u.total_msgs)}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-500">{relTime(u.ultimo_login)}</td>
                  <td className="px-4 py-3">
                    {u.inativo ? (
                      <span className="flex items-center gap-1 text-[10px] font-black text-red-500">
                        <AlertTriangle size={11} /> Inativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600">
                        <Activity size={11} /> Ativo
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function MetricsDashboardPage({ adminName, adminRole, onBack, onLogout }: Props) {
  const [kpis,      setKpis]      = useState<MetricsKPIs | null>(null);
  const [topUsers,  setTopUsers]  = useState<TopUser[]>([]);
  const [wordCloud, setWordCloud] = useState<WordCount[]>([]);
  const [series,    setSeries]    = useState<DayCount[]>([]);
  const [hours,     setHours]     = useState<HourCount[]>([]);
  const [activity,  setActivity]  = useState<UserActivity[]>([]);
  const [roles,     setRoles]     = useState<RoleDistribution[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeTab,  setActiveTab]  = useState<'overview' | 'usuarios' | 'conteudo'>('overview');

  const loadAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);

    const [k, tu, wc, s, h, a, r] = await Promise.all([
      fetchMetricsKPIs(),
      fetchTopUsers(),
      fetchWordCloud(),
      fetchTimeSeries(),
      fetchPeakHours(),
      fetchUserActivity(),
      fetchRoleDistribution(),
    ]);

    setKpis(k); setTopUsers(tu); setWordCloud(wc);
    setSeries(s); setHours(h); setActivity(a); setRoles(r);
    setLastUpdate(new Date());
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    const id = setInterval(() => loadAll(true), 60_000);
    return () => clearInterval(id);
  }, [loadAll]);

  const maxWord  = wordCloud[0]?.count ?? 1;

  const TABS = [
    { id: 'overview',  label: 'Visão Geral',   icon: <BarChart2  size={14} /> },
    { id: 'usuarios',  label: 'Usuários',       icon: <Users      size={14} /> },
    { id: 'conteudo',  label: 'Conteúdo & Uso', icon: <MessageSquare size={14} /> },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm select-none">N</div>
          <span className="text-lg font-bold text-blue-600 tracking-tight hidden sm:block">
            NPlayer.<span className="text-yellow-400">IA</span>
          </span>
          <span className="text-slate-200 hidden sm:block">/</span>
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
            <BarChart2 size={14} /> Equipes & Métricas
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadAll(true)} disabled={refreshing} title="Atualizar"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:block">Voltar</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
            <UserAvatar name={adminName} size="sm" />
            <span className="text-sm font-semibold text-slate-700">{adminName}</span>
          </div>
          <button onClick={onLogout} title="Sair"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* TÍTULO + TABS */}
      <div className="bg-white border-b border-slate-100 px-6 md:px-8 pt-5 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Equipes & Métricas</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Dados em tempo real do Supabase
              {lastUpdate && (
                <span className="ml-2 text-slate-300">
                  — atualizado {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </p>
          </div>
        </div>
        {/* TABS */}
        <div className="flex gap-1 -mb-px">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-4 md:px-8 py-6 max-w-screen-xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-32 gap-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="font-semibold">Carregando métricas...</span>
          </div>
        ) : (
          <AnimatePresence mode="wait">

            {/* ═══════════════ ABA: VISÃO GERAL ═══════════════ */}
            {activeTab === 'overview' && (
              <motion.div key="overview"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* KPIs de Uso */}
                <section>
                  <SectionTitle icon={<MessageSquare size={15} />} title="Mensagens" subtitle="Volume total de interações com a IA" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KpiCard label="Total de mensagens" value={kpis!.totalMensagens} icon={<MessageSquare size={18}/>} color="blue" />
                    <KpiCard label="Mensagens hoje" value={kpis!.mensagensHoje} icon={<MessageSquare size={18}/>} color="indigo" />
                    <KpiCard label="Últimos 7 dias" value={kpis!.mensagens7d} icon={<TrendingUp size={18}/>} color="violet" />
                    <KpiCard label="Média por usuário" value={kpis!.mediaMsgPorUsuario} icon={<BarChart2 size={18}/>} color="sky" suffix=" msgs" />
                  </div>
                </section>

                {/* KPIs de Usuários */}
                <section>
                  <SectionTitle icon={<Users size={15} />} title="Usuários" subtitle="Engajamento e presença da equipe" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KpiCard label="Logins hoje" value={kpis!.loginsHoje} icon={<LogIn size={18}/>} color="emerald" />
                    <KpiCard label="Logins (7 dias)" value={kpis!.logins7d} icon={<LogIn size={18}/>} color="teal" />
                    <KpiCard label="Taxa de retorno 7d" value={kpis!.taxaRetorno7d} icon={<Repeat2 size={18}/>} color="cyan" suffix="%"
                      delta="% usuários que voltaram em 2+ dias" />
                    <KpiCard label="Inativos (+3 dias)" value={kpis!.usuariosInativos3d} icon={<UserX size={18}/>}
                      color={kpis!.usuariosInativos3d > 0 ? 'red' : 'green'}
                      alert={kpis!.usuariosInativos3d > 0}
                      delta={kpis!.usuariosInativos3d > 0 ? 'Precisam de atenção' : 'Todos ativos!'} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <KpiCard label="Usuários ativos" value={kpis!.usuariosAtivos} icon={<Users size={18}/>} color="green"
                      suffix={`/${kpis!.usuariosTotal}`} />
                    <KpiCard label="Total de logins" value={kpis!.totalLogins} icon={<LogIn size={18}/>} color="slate" />
                    <KpiCard label="Feedbacks negativos" value={kpis!.totalCorrecoes} icon={<ThumbsDown size={18}/>}
                      color={kpis!.totalCorrecoes > 0 ? 'amber' : 'green'}
                      delta="Correções submetidas" />
                    <KpiCard label="Total de usuários" value={kpis!.usuariosTotal} icon={<Users size={18}/>} color="indigo" />
                  </div>
                </section>

                {/* Série temporal */}
                <section>
                  <SectionTitle icon={<TrendingUp size={15} />} title="Atividade nos últimos 14 dias" subtitle="Logins e mensagens por dia" />
                  {series.length > 0 ? <TimeSeriesChart data={series} /> : <EmptyState label="Sem dados" />}
                </section>

                {/* Distribuição por role */}
                <section>
                  <SectionTitle icon={<Users size={15} />} title="Uso por Perfil" subtitle="Mensagens e usuários por tipo de perfil" />
                  {roles.length > 0 ? <RoleChart data={roles} /> : <EmptyState label="Sem dados" />}
                </section>
              </motion.div>
            )}

            {/* ═══════════════ ABA: USUÁRIOS ═══════════════ */}
            {activeTab === 'usuarios' && (
              <motion.div key="usuarios"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Top 10 ranking */}
                <section>
                  <SectionTitle icon={<TrendingUp size={15} />} title="Ranking de Engajamento" subtitle="Top 10 usuários por logins e mensagens" />
                  {topUsers.length === 0 ? <EmptyState label="Nenhum login registrado ainda" /> : (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      {topUsers.map((u, i) => {
                        const maxLogins = topUsers[0]?.logins ?? 1;
                        const maxMsgs   = Math.max(...topUsers.map(x => x.mensagens), 1);
                        return (
                          <div key={u.user_id} className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-50 last:border-0">
                            <span className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-full text-xs font-black ${
                              i === 0 ? 'bg-yellow-400 text-yellow-900'
                              : i === 1 ? 'bg-slate-200 text-slate-600'
                              : i === 2 ? 'bg-orange-200 text-orange-700'
                              : 'bg-slate-100 text-slate-400'
                            }`}>{i + 1}</span>
                            <UserAvatar name={u.user_name} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{u.user_name}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                  ROLE_COLOR[u.role]?.badge ?? 'text-slate-500 bg-slate-100'
                                }`}>{u.role}</span>
                                <span className="text-[10px] text-slate-400">{relTime(u.lastSeen)}</span>
                              </div>
                            </div>
                            <div className="hidden md:flex flex-col gap-1.5 w-40">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                  <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${(u.logins / maxLogins) * 100}%` }} />
                                </div>
                                <span className="text-xs font-black text-blue-600 tabular-nums w-8 text-right">{u.logins}</span>
                                <span className="text-[9px] text-slate-400">login</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                  <div className="h-1.5 bg-violet-500 rounded-full" style={{ width: `${(u.mensagens / maxMsgs) * 100}%` }} />
                                </div>
                                <span className="text-xs font-black text-violet-600 tabular-nums w-8 text-right">{fmt(u.mensagens)}</span>
                                <span className="text-[9px] text-slate-400">msgs</span>
                              </div>
                            </div>
                            <div className="md:hidden text-right">
                              <p className="text-sm font-black text-blue-600">{u.logins}L</p>
                              <p className="text-xs font-black text-violet-600">{fmt(u.mensagens)}M</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Tabela de atividade */}
                <section>
                  <SectionTitle icon={<Activity size={15} />} title="Atividade Individual" subtitle="Histórico e status de cada usuário ativo" />
                  {activity.length === 0 ? <EmptyState label="Sem dados de atividade" /> : (
                    <UserActivityTable data={activity} />
                  )}
                </section>
              </motion.div>
            )}

            {/* ═══════════════ ABA: CONTEÚDO ═══════════════ */}
            {activeTab === 'conteudo' && (
              <motion.div key="conteudo"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Pico de horas */}
                <section>
                  <SectionTitle icon={<Clock size={15} />} title="Horários de Pico" subtitle="Quando a equipe mais usa o sistema" />
                  {hours.length > 0 ? <PeakHoursChart data={hours} /> : <EmptyState label="Sem dados" />}
                </section>

                {/* Nuvem de palavras */}
                <section>
                  <SectionTitle icon={<MessageSquare size={15} />} title="Temas mais Pesquisados" subtitle="Nuvem de palavras das últimas 500 perguntas" />
                  {wordCloud.length === 0 ? <EmptyState label="Nenhuma mensagem registrada ainda" /> : (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {wordCloud.map((w, i) => {
                          const ratio   = w.count / maxWord;
                          const size    = 11 + Math.round(ratio * 26);
                          const opacity = 0.45 + ratio * 0.55;
                          const colors  = ['#2563eb','#7c3aed','#0891b2','#059669','#d97706','#dc2626','#9333ea','#0284c7','#16a34a','#ca8a04'];
                          return (
                            <span
                              key={w.word}
                              className="font-bold cursor-default select-none transition-transform hover:scale-110"
                              style={{ fontSize: size, color: colors[i % colors.length], opacity }}
                              title={`${w.word}: ${w.count}x`}
                            >
                              {w.word}
                            </span>
                          );
                        })}
                      </div>
                      <p className="text-center text-xs text-slate-300 mt-4 font-semibold">Baseado nas últimas 500 perguntas</p>
                    </div>
                  )}
                </section>

                {/* Top perguntas recentes */}
                <section>
                  <SectionTitle icon={<MessageSquare size={15} />} title="Top Temas por Frequência" subtitle="Palavras-chave mais repetidas" />
                  {wordCloud.length === 0 ? <EmptyState label="Sem dados" /> : (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      {wordCloud.slice(0, 15).map((w, i) => {
                        const ratio = w.count / maxWord;
                        return (
                          <div key={w.word} className="flex items-center gap-4 px-5 py-2.5 border-b border-slate-50 last:border-0">
                            <span className="w-5 text-xs font-black text-slate-300 tabular-nums">{i+1}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-bold text-slate-700">{w.word}</span>
                                <span className="text-xs font-black text-slate-500">{w.count}x</span>
                              </div>
                              <div className="bg-slate-100 rounded-full h-1.5">
                                <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${ratio * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
