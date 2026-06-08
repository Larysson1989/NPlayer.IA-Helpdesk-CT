import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, LogOut, RefreshCw, Users, MessageSquare,
  LogIn, BarChart2, TrendingUp,
} from 'lucide-react';
import { UserAvatar } from '../components/UserAvatar';
import {
  fetchMetricsKPIs, fetchTopUsers, fetchWordCloud, fetchLoginsPerDay,
  type MetricsKPIs, type TopUser, type WordCount,
} from '../services/metricsService';
import type { UserRole } from '../App';

interface Props {
  adminName: string;
  adminRole: UserRole;
  onBack:    () => void;
  onLogout:  () => void;
}

const ROLE_COLOR: Record<string, string> = {
  captador:      'text-blue-600 bg-blue-50',
  supervisor:    'text-purple-600 bg-purple-50',
  administrador: 'text-emerald-700 bg-emerald-50',
};

const BAR_MAX_W = 200;

export function MetricsDashboardPage({ adminName, adminRole, onBack, onLogout }: Props) {
  const [kpis,       setKpis]       = useState<MetricsKPIs | null>(null);
  const [topUsers,   setTopUsers]   = useState<TopUser[]>([]);
  const [wordCloud,  setWordCloud]  = useState<WordCount[]>([]);
  const [loginsDay,  setLoginsDay]  = useState<{ label: string; value: number }[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const [k, tu, wc, ld] = await Promise.all([
      fetchMetricsKPIs(),
      fetchTopUsers(),
      fetchWordCloud(),
      fetchLoginsPerDay(),
    ]);

    setKpis(k);
    setTopUsers(tu);
    setWordCloud(wc);
    setLoginsDay(ld);
    setLastUpdate(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Auto-refresh a cada 60s
  useEffect(() => {
    const id = setInterval(() => loadAll(true), 60_000);
    return () => clearInterval(id);
  }, [loadAll]);

  const maxWord  = wordCloud[0]?.count ?? 1;
  const maxLogin = Math.max(...topUsers.map(u => u.logins), 1);
  const maxDay   = Math.max(...loginsDay.map(d => d.value), 1);

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
            <BarChart2 size={14} />
            Equipes & Métricas
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAll(true)}
            disabled={refreshing}
            title="Atualizar dados"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
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

      <main className="flex-1 px-4 md:px-8 py-6 max-w-screen-xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Equipes & Métricas</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Dados em tempo real do Supabase
              {lastUpdate && (
                <span className="ml-2 text-slate-300">— atualizado {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              )}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32 gap-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="font-semibold">Carregando métricas...</span>
          </div>
        ) : (
          <AnimatePresence>
            {/* ─ KPIs DE USO (mensagens) ─ */}
            <motion.section key="uso" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <SectionTitle icon={<MessageSquare size={15} />} title="KPIs de Uso (Mensagens)" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard label="Total de mensagens" value={kpis!.totalMensagens} icon={<MessageSquare size={18} />} color="blue" />
                <KpiCard label="Mensagens hoje" value={kpis!.mensagensHoje} icon={<MessageSquare size={18} />} color="indigo" />
                <KpiCard label="Mensagens (7 dias)" value={kpis!.mensagens7d} icon={<TrendingUp size={18} />} color="violet" />
                <KpiCard label="Média/dia (7d)" value={kpis!.mensagens7d > 0 ? +(kpis!.mensagens7d / 7).toFixed(1) : 0} icon={<BarChart2 size={18} />} color="sky" suffix="/dia" />
              </div>
            </motion.section>

            {/* ─ KPIs DE LOGIN ─ */}
            <motion.section key="login" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <SectionTitle icon={<LogIn size={15} />} title="KPIs de Login" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard label="Total de logins" value={kpis!.totalLogins} icon={<LogIn size={18} />} color="emerald" />
                <KpiCard label="Logins hoje" value={kpis!.loginsHoje} icon={<LogIn size={18} />} color="teal" />
                <KpiCard label="Logins (7 dias)" value={kpis!.logins7d} icon={<TrendingUp size={18} />} color="cyan" />
                <KpiCard label="Usuários ativos" value={kpis!.usuariosAtivos} icon={<Users size={18} />} color="green" suffix={`/${kpis!.usuariosTotal}`} />
              </div>

              {/* Mini gráfico de barras: logins por dia */}
              {loginsDay.length > 0 && (
                <div className="mt-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Logins por dia (7 dias)</p>
                  <div className="flex items-end gap-2 h-20">
                    {loginsDay.map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold text-blue-500">{d.value > 0 ? d.value : ''}</span>
                        <div
                          className="w-full bg-blue-500 rounded-t-md transition-all"
                          style={{ height: `${Math.max(4, (d.value / maxDay) * 56)}px` }}
                        />
                        <span className="text-[9px] text-slate-400 font-semibold truncate w-full text-center">{d.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.section>

            {/* ─ TOP 5 USUÁRIOS ─ */}
            <motion.section key="top" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <SectionTitle icon={<Users size={15} />} title="Top 5 Usuários que mais Logam" />
              {topUsers.length === 0 ? (
                <EmptyState label="Nenhum login registrado ainda" />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {topUsers.map((u, i) => (
                    <div key={u.user_id} className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-50 last:border-0">
                      <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-black ${
                        i === 0 ? 'bg-yellow-400 text-yellow-900'
                        : i === 1 ? 'bg-slate-200 text-slate-600'
                        : i === 2 ? 'bg-orange-200 text-orange-700'
                        : 'bg-slate-100 text-slate-400'
                      }`}>{i + 1}</span>
                      <UserAvatar name={u.user_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{u.user_name}</p>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${ROLE_COLOR[u.role] ?? 'text-slate-500 bg-slate-100'}`}>
                          {u.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-slate-100 rounded-full overflow-hidden" style={{ width: BAR_MAX_W, height: 8 }}>
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${(u.logins / maxLogin) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-black text-blue-600 tabular-nums w-8 text-right">{u.logins}</span>
                        <span className="text-xs text-slate-400">logins</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>

            {/* ─ NUVEM DE PALAVRAS ─ */}
            <motion.section key="cloud" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <SectionTitle icon={<MessageSquare size={15} />} title="Temas mais Pesquisados (Nuvem de Palavras)" />
              {wordCloud.length === 0 ? (
                <EmptyState label="Nenhuma mensagem registrada ainda" />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {wordCloud.map((w, i) => {
                      const ratio = w.count / maxWord;
                      const size = 11 + Math.round(ratio * 26);
                      const opacity = 0.45 + ratio * 0.55;
                      const colors = [
                        '#2563eb','#7c3aed','#0891b2','#059669','#d97706',
                        '#dc2626','#9333ea','#0284c7','#16a34a','#ca8a04',
                      ];
                      const color = colors[i % colors.length];
                      return (
                        <span
                          key={w.word}
                          className="font-bold cursor-default select-none transition-transform hover:scale-110"
                          style={{ fontSize: size, color, opacity }}
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
            </motion.section>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

// ─ Sub-componentes ──────────────────────────────────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-blue-500">{icon}</span>
      <h2 className="text-sm font-black uppercase tracking-wider text-slate-600">{title}</h2>
    </div>
  );
}

const KPI_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'text-blue-400'   },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-400' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'text-violet-400' },
  sky:    { bg: 'bg-sky-50',    text: 'text-sky-700',    icon: 'text-sky-400'    },
  emerald:{ bg: 'bg-emerald-50',text: 'text-emerald-700',icon: 'text-emerald-400'},
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-700',   icon: 'text-teal-400'   },
  cyan:   { bg: 'bg-cyan-50',   text: 'text-cyan-700',   icon: 'text-cyan-400'   },
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'text-green-400'  },
};

function KpiCard({
  label, value, icon, color, suffix,
}: { label: string; value: number; icon: React.ReactNode; color: string; suffix?: string }) {
  const c = KPI_COLORS[color] ?? KPI_COLORS.blue;
  return (
    <div className={`${c.bg} rounded-2xl p-4 flex flex-col gap-2`}>
      <div className={`${c.icon} w-8 h-8 flex items-center justify-center`}>{icon}</div>
      <p className="text-xs font-semibold text-slate-500 leading-snug">{label}</p>
      <p className={`text-2xl font-black tabular-nums ${c.text}`}>
        {value.toLocaleString('pt-BR')}
        {suffix && <span className="text-sm font-semibold text-slate-400 ml-0.5">{suffix}</span>}
      </p>
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
