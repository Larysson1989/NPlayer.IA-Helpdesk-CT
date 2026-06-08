import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, LogOut, RefreshCw, Users, MessageSquare,
  LogIn, TrendingUp, Activity, Award, Clock, BarChart2,
} from 'lucide-react';
import type { UserRole } from '../App';
import { UserAvatar } from '../components/UserAvatar';
import {
  getKpis, getTopUsers, getWordCloud,
  type KpiData, type TopUser, type WordFreq,
} from '../services/metricsService';

interface Props {
  adminName: string;
  adminRole: UserRole;
  onBack:    () => void;
  onLogout:  () => void;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  captador:      { label: 'Captador',      color: 'text-blue-600',    bg: 'bg-blue-50'    },
  supervisor:    { label: 'Supervisor',    color: 'text-purple-600',  bg: 'bg-purple-50'  },
  administrador: { label: 'Administrador', color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

function formatDate(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Nuvem de palavras: tamanho e cor baseados na frequência
function WordCloud({ words }: { words: WordFreq[] }) {
  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-300 gap-2">
        <MessageSquare size={36} strokeWidth={1} />
        <p className="text-sm font-semibold">Nenhuma mensagem registrada ainda</p>
      </div>
    );
  }

  const max = Math.max(...words.map(w => w.count));
  const min = Math.min(...words.map(w => w.count));

  const COLORS = [
    'text-blue-600', 'text-indigo-500', 'text-violet-500',
    'text-sky-500',  'text-teal-500',   'text-emerald-500',
    'text-blue-400', 'text-slate-500',
  ];

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center items-center py-4 px-2">
      {words.map(({ word, count }, i) => {
        const ratio = max === min ? 0.5 : (count - min) / (max - min);
        const size = 12 + Math.round(ratio * 28); // 12px → 40px
        const opacity = 0.5 + ratio * 0.5;
        const color = COLORS[i % COLORS.length];
        return (
          <motion.span
            key={word}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity, scale: 1 }}
            transition={{ delay: i * 0.015, duration: 0.3 }}
            title={`${count} ocorrência${count !== 1 ? 's' : ''}`}
            className={`font-bold cursor-default select-none ${color}`}
            style={{ fontSize: size }}
          >
            {word}
          </motion.span>
        );
      })}
    </div>
  );
}

// Card KPI
function KpiCard({
  icon: Icon, label, value, sub, color = 'text-blue-600', bg = 'bg-blue-50',
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
  bg?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon size={18} className={color} />
        </div>
      </div>
      <p className={`text-3xl font-black tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 font-semibold">{sub}</p>}
    </motion.div>
  );
}

export function MetricsDashboardPage({ adminName, adminRole, onBack, onLogout }: Props) {
  const [kpis,      setKpis]      = useState<KpiData | null>(null);
  const [topUsers,  setTopUsers]  = useState<TopUser[]>([]);
  const [wordCloud, setWordCloud] = useState<WordFreq[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    const [k, t, w] = await Promise.all([getKpis(), getTopUsers(), getWordCloud()]);
    setKpis(k);
    setTopUsers(t);
    setWordCloud(w);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh a cada 60 segundos
  useEffect(() => {
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

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
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 hidden sm:block">
            Equipes & Métricas
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            title="Atualizar dados"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-400' : ''} />
            <span className="hidden sm:block">Atualizar</span>
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
        {/* Título */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Equipes & Métricas</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Dados em tempo real · Atualizado às {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-blue-500 font-semibold">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              Carregando...
            </div>
          )}
        </div>

        <AnimatePresence>
          {kpis && (
            <>
              {/* ─── KPIs DE USO ─── */}
              <section>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <Activity size={14} /> KPIs de Uso
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KpiCard
                    icon={Users} label="Total de Usuários"
                    value={kpis.totalUsers}
                    sub={`${kpis.activeUsers} ativos`}
                    color="text-blue-600" bg="bg-blue-50"
                  />
                  <KpiCard
                    icon={MessageSquare} label="Mensagens Totais"
                    value={kpis.totalMensagens}
                    sub={`${kpis.mensagensHoje} hoje`}
                    color="text-violet-600" bg="bg-violet-50"
                  />
                  <KpiCard
                    icon={TrendingUp} label="Msgs Esta Semana"
                    value={kpis.mensagensEstaSemana}
                    sub={`média ${kpis.mediaMensagensPorSessao} por sessão`}
                    color="text-emerald-600" bg="bg-emerald-50"
                  />
                  <KpiCard
                    icon={BarChart2} label="Msgs Hoje"
                    value={kpis.mensagensHoje}
                    sub="mensagens no dia"
                    color="text-orange-500" bg="bg-orange-50"
                  />
                </div>
              </section>

              {/* ─── KPIs DE LOGIN ─── */}
              <section>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <LogIn size={14} /> KPIs de Login
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <KpiCard
                    icon={LogIn} label="Logins Totais"
                    value={kpis.totalLogins}
                    sub="desde o início"
                    color="text-blue-600" bg="bg-blue-50"
                  />
                  <KpiCard
                    icon={Clock} label="Logins Hoje"
                    value={kpis.loginsHoje}
                    sub="no dia atual"
                    color="text-teal-600" bg="bg-teal-50"
                  />
                  <KpiCard
                    icon={Activity} label="Logins Esta Semana"
                    value={kpis.loginsEstaSemana}
                    sub="nos últimos 7 dias"
                    color="text-indigo-600" bg="bg-indigo-50"
                  />
                </div>
              </section>

              {/* ─── NUVEM DE PALAVRAS + TOP 5 ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Nuvem de palavras */}
                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <MessageSquare size={14} /> Temas Mais Pesquisados
                  </h2>
                  {wordCloud.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-300 gap-2">
                      <MessageSquare size={36} strokeWidth={1} />
                      <p className="text-sm font-semibold">Nenhuma mensagem registrada ainda</p>
                      <p className="text-xs text-slate-300">As palavras aparecerão conforme os usuários usarem o chat</p>
                    </div>
                  ) : (
                    <WordCloud words={wordCloud} />
                  )}
                </section>

                {/* Top 5 usuários */}
                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <Award size={14} /> Top 5 — Mais Logins
                  </h2>
                  {topUsers.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-300 gap-2">
                      <Users size={36} strokeWidth={1} />
                      <p className="text-sm font-semibold">Nenhum login registrado ainda</p>
                      <p className="text-xs text-slate-300">O ranking aparecerá conforme os usuários fizerem login</p>
                    </div>
                  ) : (
                    <ol className="space-y-2">
                      {topUsers.map((user, i) => {
                        const roleCfg = ROLE_CONFIG[user.user_role] || ROLE_CONFIG.captador;
                        const medalColors = [
                          'bg-yellow-400 text-white',
                          'bg-slate-300 text-white',
                          'bg-amber-600 text-white',
                          'bg-slate-100 text-slate-500',
                          'bg-slate-100 text-slate-500',
                        ];
                        return (
                          <motion.li
                            key={user.user_id}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 transition-colors"
                          >
                            <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${medalColors[i]}`}>
                              {i + 1}
                            </span>
                            <UserAvatar name={user.user_name} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{user.user_name}</p>
                              <p className="text-xs text-slate-400 truncate">{user.user_email}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${roleCfg.color} ${roleCfg.bg}`}>
                                {roleCfg.label}
                              </span>
                              <span className="text-xs font-black text-blue-600 tabular-nums">
                                {user.total_logins} login{user.total_logins !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </motion.li>
                        );
                      })}
                    </ol>
                  )}
                </section>
              </div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
