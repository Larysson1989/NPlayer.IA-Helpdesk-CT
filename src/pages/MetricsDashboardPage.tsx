import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, LogOut, RefreshCw, Users, MessageSquare,
  LogIn, BarChart2, TrendingUp, AlertTriangle, Clock,
  Repeat2, ThumbsDown, UserX, Activity, Zap, Target,
  AlignLeft, Flame, Calendar,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { UserAvatar } from '../components/UserAvatar';
import { OnlineUsersWidget, OnlineUsersBadge } from '../components/OnlineUsersWidget';
import type { OnlineUser } from '../hooks/useOnlineUsers';
import {
  fetchMetricsKPIs, fetchTopUsers, fetchWordCloud,
  fetchTimeSeries, fetchPeakHours, fetchUserActivity, fetchRoleDistribution,
  fetchWeekdayDistribution, fetchUserCorrectionRates, fetchTopWordsByRole,
  fetchUserStreaks, fetchMsgLengthByRole,
  type MetricsKPIs, type TopUser, type WordCount,
  type DayCount, type HourCount, type UserActivity, type RoleDistribution,
  type WeekdayCount, type UserCorrectionRate, type RoleTopWords,
  type UserStreak, type MsgLengthByRole,
} from '../services/metricsService';
import type { UserRole } from '../App';

interface Props {
  adminName: string;
  adminRole: UserRole;
  currentUserId: string;
  onlineUsers: OnlineUser[];
  onlineCount: number;
  onBack:   () => void;
  onLogout: () => void;
}

// ─── Cores ────────────────────────────────────────────────────────────────────
const ROLE_COLOR: Record<string, { badge: string; hex: string }> = {
  captador:      { badge: 'text-blue-600 bg-blue-50',       hex: '#3b82f6' },
  supervisor:    { badge: 'text-purple-600 bg-purple-50',    hex: '#9333ea' },
  administrador: { badge: 'text-emerald-700 bg-emerald-50',  hex: '#059669' },
};

const PIE_COLORS  = ['#3b82f6', '#9333ea', '#059669', '#f59e0b', '#ef4444'];
const WORD_COLORS = ['#2563eb','#7c3aed','#0891b2','#059669','#d97706','#dc2626','#9333ea','#0284c7','#16a34a','#ca8a04'];
const MSG_BAR_COLORS = ['#3b82f6', '#9333ea', '#059669'];

const PEAK_COLORS_FN = (ratio: number) =>
  ratio > 0.7 ? '#f87171' : ratio > 0.4 ? '#fbbf24' : '#60a5fa';

function fmt(n: number) { return n.toLocaleString('pt-BR'); }

function relTime(iso: string): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'agora';
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

// ─── Tooltip customizado — ÚNICO tooltip usado em TODOS os gráficos ───────────
// O Tooltip nativo do Recharts v2 causa crash "Cannot read properties of
// undefined (reading 'color')" quando o payload contém entradas undefined/null.
// Este componente filtra defensivamente cada entrada antes de renderizar.
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; fill?: string } | undefined | null>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const safe = payload.filter(Boolean);
  if (!safe.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2.5 text-xs font-semibold text-slate-700">
      {label && <p className="font-black text-slate-500 mb-1">{label}</p>}
      {safe.map((p, i) => {
        if (!p) return null;
        const color = p.color ?? p.fill ?? '#64748b';
        return (
          <p key={i} style={{ color }}>
            {p.name ?? ''}: <span className="font-black">{fmt(p.value ?? 0)}</span>
          </p>
        );
      })}
    </div>
  );
};

// ─── Legenda manual HTML — substitui <Legend> do Recharts (causa crash) ───────
function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
      {items.map(item => (
        <span key={item.label} className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
          <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

// ─── Componentes utilitários ──────────────────────────────────────────────────
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
    orange:  { bg: 'bg-orange-50',  text: 'text-orange-700',  icon: 'text-orange-400'  },
    rose:    { bg: 'bg-rose-50',    text: 'text-rose-700',    icon: 'text-rose-400'    },
  };
  const c = COLORS[color] ?? COLORS.blue;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${c.bg} ${alert ? 'ring-2 ring-red-300' : ''} rounded-2xl p-4 flex flex-col gap-2 relative`}
    >
      {alert && <span className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full animate-pulse" />}
      <div className={`${c.icon} w-8 h-8 flex items-center justify-center`}>{icon}</div>
      <p className="text-xs font-semibold text-slate-500 leading-snug">{label}</p>
      <p className={`text-2xl font-black tabular-nums ${c.text}`}>
        {typeof value === 'number' ? fmt(value) : value}
        {suffix && <span className="text-sm font-semibold text-slate-400 ml-0.5">{suffix}</span>}
      </p>
      {delta && <p className="text-xs text-slate-400 font-semibold">{delta}</p>}
    </motion.div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center py-12">
      <p className="text-sm font-semibold text-slate-300">{label}</p>
    </div>
  );
}

// ─── Gráfico de Área ──────────────────────────────────────────────────────────
function TimeSeriesAreaChart({ data }: { data: DayCount[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradLogins" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradMsgs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area isAnimationActive={false} type="monotone" dataKey="logins"    name="Logins"     stroke="#3b82f6" strokeWidth={2} fill="url(#gradLogins)" dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#3b82f6' }} />
          <Area isAnimationActive={false} type="monotone" dataKey="msgs"      name="Mensagens"  stroke="#8b5cf6" strokeWidth={2} fill="url(#gradMsgs)"   dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#8b5cf6' }} />
        </AreaChart>
      </ResponsiveContainer>
      <ChartLegend items={[{ label: 'Logins', color: '#3b82f6' }, { label: 'Mensagens', color: '#8b5cf6' }]} />
    </div>
  );
}

function PeakHoursBarChart({ data }: { data: HourCount[] }) {
  const workHours = (data ?? []).filter(d => d.hour >= 7 && d.hour <= 21);
  const max = Math.max(...workHours.map(d => d.value), 1);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <p className="text-xs text-slate-400 font-semibold mb-3">Horários comerciais (07h–21h) · últimos 30 dias</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={workHours} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="value" name="Mensagens" fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false}>
            {workHours.map((entry, index) => (
              <Cell key={index} fill={PEAK_COLORS_FN(entry.value / max)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2">
        <span className="flex items-center gap-1 text-[10px] text-slate-400"><span className="w-2 h-2 rounded bg-red-400" /> Alto</span>
        <span className="flex items-center gap-1 text-[10px] text-slate-400"><span className="w-2 h-2 rounded bg-amber-400" /> Médio</span>
        <span className="flex items-center gap-1 text-[10px] text-slate-400"><span className="w-2 h-2 rounded bg-blue-400" /> Baixo</span>
      </div>
    </div>
  );
}

function RoleDonutChart({ data }: { data: RoleDistribution[] }) {
  const LABELS: Record<string, string> = { captador: 'Captador', supervisor: 'Supervisor', administrador: 'Admin' };
  const pieData = (data ?? []).map(d => ({ name: LABELS[d.role] ?? d.role, value: d.msgs, users: d.count }));
  const total   = pieData.reduce((s, d) => s + d.value, 0);

  const CustomPieLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, index,
  }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; index: number }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const pct = total > 0 ? Math.round((pieData[index]?.value / total) * 100) : 0;
    if (pct < 5) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: 11, fontWeight: 900 }}>{pct}%</text>
    );
  };

  if (!pieData.length) return <EmptyState label="Sem dados de distribuição" />;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%" cy="50%"
              innerRadius={50} outerRadius={80}
              dataKey="value"
              labelLine={false}
              label={CustomPieLabel as React.FC}
              isAnimationActive={false}
            >
              {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-3 flex-1">
          {pieData.map((d, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-sm font-bold text-slate-700">{d.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-black tabular-nums" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>{fmt(d.value)} msgs</p>
                <p className="text-[10px] text-slate-400">{d.users} usuário{d.users !== 1 ? 's' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserActivityTable({ data }: { data: UserActivity[] }) {
  const [filter, setFilter] = useState<'todos' | 'inativos'>('todos');
  const shown = filter === 'inativos' ? data.filter(u => u.inativo) : data;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-50">
        <p className="text-xs font-black uppercase tracking-wider text-slate-500">Atividade por usuário</p>
        <div className="flex gap-1">
          {(['todos', 'inativos'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-50'
              }`}>
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
                      <span className="flex items-center gap-1 text-[10px] font-black text-red-500"><AlertTriangle size={11} /> Inativo</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600"><Activity size={11} /> Ativo</span>
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

function TopUsersChart({ data }: { data: TopUser[] }) {
  const chartData = data.map(u => ({
    name: u.user_name.split(' ')[0],
    logins: u.logins,
    mensagens: u.mensagens,
    role: u.role,
  }));
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar isAnimationActive={false} dataKey="logins"    name="Logins"     fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={14} />
          <Bar isAnimationActive={false} dataKey="mensagens" name="Mensagens"  fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend items={[{ label: 'Logins', color: '#3b82f6' }, { label: 'Mensagens', color: '#8b5cf6' }]} />
    </div>
  );
}

function WeekdayBarChart({ data }: { data: WeekdayCount[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <p className="text-xs text-slate-400 font-semibold mb-3">Últimos 30 dias</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar isAnimationActive={false} dataKey="logins" name="Logins"    fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar isAnimationActive={false} dataKey="msgs"   name="Mensagens" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend items={[{ label: 'Logins', color: '#3b82f6' }, { label: 'Mensagens', color: '#8b5cf6' }]} />
    </div>
  );
}

function CorrectionRateChart({ data }: { data: UserCorrectionRate[] }) {
  const chartData = data
    .filter(u => u.correcoes > 0)
    .map(u => ({ name: u.user_name.split(' ')[0], correcoes: u.correcoes, taxa: u.taxa, role: u.role }));
  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-12 gap-2">
        <Zap size={32} className="text-emerald-300" />
        <p className="text-sm font-bold text-emerald-600">Nenhuma correção registrada!</p>
        <p className="text-xs text-slate-400">A IA está acertando em cheio 🎯</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar isAnimationActive={false} dataKey="correcoes" name="Correções" fill="#f87171" radius={[0, 4, 4, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Gauge SVG puro — substitui RadialBarChart (causa crash no Recharts v2) ───
function IaAccuracyGauge({ taxa }: { taxa: number }) {
  const safeTaxa = Number.isFinite(taxa) ? Math.max(0, Math.min(100, taxa)) : 0;
  const color = safeTaxa >= 90 ? '#10b981' : safeTaxa >= 70 ? '#f59e0b' : '#ef4444';
  const label = safeTaxa >= 90 ? 'Excelente' : safeTaxa >= 70 ? 'Atenção' : 'Crítico';
  const R = 70;
  const cx = 90;
  const cy = 90;
  const circumference = Math.PI * R;
  const filled = (safeTaxa / 100) * circumference;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Taxa de Acerto da IA</p>
      <div className="relative" style={{ width: 180, height: 110 }}>
        <svg width="180" height="110" viewBox="0 0 180 100" aria-label={`Taxa de acerto: ${safeTaxa}%`}>
          <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
            fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
          <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
            fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.4s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <p className="text-3xl font-black tabular-nums leading-none" style={{ color }}>{safeTaxa}%</p>
          <p className="text-xs font-bold mt-0.5" style={{ color }}>{label}</p>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-3 text-center">Baseado em msgs vs. correções submetidas</p>
    </div>
  );
}

function MsgLengthChart({ data }: { data: MsgLengthByRole[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <p className="text-xs text-slate-400 font-semibold mb-3">Caracteres médios por perfil · últimas 500 mensagens</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="role" tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="media" name="Caracteres médios" radius={[6, 6, 0, 0]} maxBarSize={60} isAnimationActive={false}>
            {(data ?? []).map((_, index) => (
              <Cell key={index} fill={MSG_BAR_COLORS[index % MSG_BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StreakTable({ data }: { data: UserStreak[] }) {
  const shown = data.filter(u => u.streak > 0 || u.max_streak > 0).slice(0, 8);
  if (shown.length === 0) return <EmptyState label="Nenhum streak registrado ainda" />;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-50 bg-slate-50">
              {['#', 'Usuário', 'Perfil', 'Streak atual', 'Recorde'].map(h => (
                <th key={h} className="text-left text-[10px] font-black uppercase tracking-wider text-slate-400 px-4 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((u, i) => (
              <tr key={u.user_id} className={`border-b border-slate-50 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                <td className="px-4 py-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${
                    i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-400'
                  }`}>{i + 1}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar name={u.user_name} size="sm" />
                    <span className="text-sm font-bold text-slate-800 truncate max-w-[120px]">{u.user_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    ROLE_COLOR[u.role]?.badge ?? 'text-slate-500 bg-slate-100'
                  }`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-sm font-black text-orange-500"><Flame size={13} />{u.streak}d</span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-slate-500 tabular-nums">{u.max_streak}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TopWordsByRoleSection({ data }: { data: RoleTopWords[] }) {
  const ROLE_LABELS:   Record<string, string> = { captador: 'Captadores', supervisor: 'Supervisores', administrador: 'Admins' };
  const COLORS_BY_ROLE: Record<string, string> = { captador: '#3b82f6', supervisor: '#9333ea', administrador: '#059669' };
  if (!data.length) return <EmptyState label="Sem dados suficientes" />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {data.map(r => (
        <div key={r.role} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: COLORS_BY_ROLE[r.role] ?? '#64748b' }}>
            {ROLE_LABELS[r.role] ?? r.role}
          </p>
          <div className="flex flex-col gap-1.5">
            {r.words.slice(0, 8).map((w, i) => (
              <div key={w.word} className="flex items-center gap-2">
                <span className="text-[10px] font-black w-4 text-slate-300 tabular-nums">{i + 1}</span>
                <div className="flex-1 bg-slate-50 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center px-2"
                    style={{
                      width: `${Math.max(20, (w.count / (r.words[0]?.count || 1)) * 100)}%`,
                      background: COLORS_BY_ROLE[r.role] ?? '#3b82f6',
                      opacity: 0.7 + (i === 0 ? 0.3 : 0),
                    }}
                  >
                    <span className="text-[9px] font-black text-white truncate">{w.word}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 tabular-nums w-6 text-right">{w.count}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function WordCloudSection({ data }: { data: WordCount[] }) {
  const max = Math.max(...(data ?? []).map(w => w.count), 1);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex flex-wrap gap-2 justify-center">
        {(data ?? []).slice(0, 40).map((w, i) => {
          const ratio = w.count / max;
          const size  = 10 + Math.round(ratio * 18);
          return (
            <span key={w.word} style={{
              fontSize: size,
              color: WORD_COLORS[i % WORD_COLORS.length],
              fontWeight: ratio > 0.6 ? 900 : ratio > 0.3 ? 700 : 600,
              opacity: 0.6 + ratio * 0.4,
              lineHeight: 1.6,
            }}>
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function MetricsDashboardPage({
  adminName, adminRole, currentUserId, onlineUsers, onlineCount, onBack, onLogout,
}: Props) {
  const [activeTab,   setActiveTab]   = useState<'visao' | 'usuarios' | 'conteudo' | 'qualidade'>('visao');
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [kpis,               setKpis]               = useState<MetricsKPIs | null>(null);
  const [topUsers,           setTopUsers]           = useState<TopUser[]>([]);
  const [wordCloud,          setWordCloud]          = useState<WordCount[]>([]);
  const [timeSeries,         setTimeSeries]         = useState<DayCount[]>([]);
  const [peakHours,          setPeakHours]          = useState<HourCount[]>([]);
  const [userActivity,       setUserActivity]       = useState<UserActivity[]>([]);
  const [roleDistribution,   setRoleDistribution]   = useState<RoleDistribution[]>([]);
  const [weekdayDistribution,setWeekdayDistribution]= useState<WeekdayCount[]>([]);
  const [correctionRates,    setCorrectionRates]    = useState<UserCorrectionRate[]>([]);
  const [topWordsByRole,     setTopWordsByRole]     = useState<RoleTopWords[]>([]);
  const [userStreaks,        setUserStreaks]        = useState<UserStreak[]>([]);
  const [msgLengthByRole,    setMsgLengthByRole]    = useState<MsgLengthByRole[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [k, tu, wc, ts, ph, ua, rd, wd, cr, twr, us, ml] = await Promise.all([
        fetchMetricsKPIs(),
        fetchTopUsers(),
        fetchWordCloud(),
        fetchTimeSeries(),
        fetchPeakHours(),
        fetchUserActivity(),
        fetchRoleDistribution(),
        fetchWeekdayDistribution(),
        fetchUserCorrectionRates(),
        fetchTopWordsByRole(),
        fetchUserStreaks(),
        fetchMsgLengthByRole(),
      ]);
      setKpis(k);
      setTopUsers(tu);
      setWordCloud(wc);
      setTimeSeries(ts);
      setPeakHours(ph);
      setUserActivity(ua);
      setRoleDistribution(rd);
      setWeekdayDistribution(wd);
      setCorrectionRates(cr);
      setTopWordsByRole(twr);
      setUserStreaks(us);
      setMsgLengthByRole(ml);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const tabs = [
    { id: 'visao',     icon: <BarChart2 size={14} />,  label: 'Visão Geral'   },
    { id: 'usuarios',  icon: <Users size={14} />,       label: 'Usuários'      },
    { id: 'conteudo',  icon: <AlignLeft size={14} />,   label: 'Conteúdo & Uso'},
    { id: 'qualidade', icon: <Target size={14} />,      label: 'Qualidade IA'  },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={15} /> Voltar
          </button>
          <div className="flex items-center gap-2 ml-1">
            <BarChart2 size={16} className="text-blue-500" />
            <span className="text-sm font-black text-slate-800 uppercase tracking-wide">Equipes & Métricas</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {lastUpdated && (
              <span className="text-[10px] text-slate-400 font-semibold hidden sm:block">
                — atualizado {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <OnlineUsersBadge onlineUsers={onlineUsers} onlineCount={onlineCount} />
            <button onClick={loadAll} disabled={loading}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-40">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Atualizar
            </button>
            <div className="flex items-center gap-2">
              <UserAvatar name={adminName} size="sm" />
              <span className="text-xs font-bold text-slate-600 hidden sm:block">{adminName}</span>
            </div>
            <button onClick={onLogout} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">
              <LogOut size={13} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-0">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                activeTab === t.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-400">Carregando métricas...</p>
            </motion.div>
          ) : (
            <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              {/* ── ABA: VISÃO GERAL ── */}
              {activeTab === 'visao' && (
                <div className="space-y-8">
                  <section>
                    <SectionTitle icon={<Activity size={16} />} title="Online Agora" subtitle="Usuários com sessão ativa em tempo real" />
                    <OnlineUsersWidget onlineUsers={onlineUsers} onlineCount={onlineCount} />
                  </section>

                  <section>
                    <SectionTitle icon={<TrendingUp size={16} />} title="KPIs Principais" subtitle="Totais históricos acumulados" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                      <KpiCard label="Usuários ativos"   value={kpis?.total_users       ?? 0} icon={<Users size={18} />}        color="blue"   />
                      <KpiCard label="Logins totais"     value={kpis?.total_logins      ?? 0} icon={<LogIn size={18} />}         color="indigo" />
                      <KpiCard label="Mensagens enviadas" value={kpis?.total_msgs       ?? 0} icon={<MessageSquare size={18} />} color="violet" />
                      <KpiCard label="Correções à IA"    value={kpis?.total_corrections ?? 0} icon={<Repeat2 size={18} />}       color="amber"  alert={(kpis?.total_corrections ?? 0) > 50} />
                      <KpiCard label="Taxa de acerto IA" value={`${kpis?.ia_accuracy ?? 0}%`} icon={<Target size={18} />} color={(kpis?.ia_accuracy ?? 0) >= 90 ? 'emerald' : (kpis?.ia_accuracy ?? 0) >= 70 ? 'amber' : 'red'} />
                      <KpiCard label="Usuários inativos" value={kpis?.inactive_users    ?? 0} icon={<UserX size={18} />}         color="slate"  alert={(kpis?.inactive_users ?? 0) > 0} />
                    </div>
                  </section>

                  <section>
                    <SectionTitle icon={<Clock size={16} />} title="Últimos 7 Dias" subtitle="Atividade recente" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <KpiCard label="Logins"          value={kpis?.logins_7d        ?? 0} icon={<LogIn size={18} />}         color="sky"    delta="vs. período anterior" />
                      <KpiCard label="Mensagens"       value={kpis?.msgs_7d          ?? 0} icon={<MessageSquare size={18} />} color="purple" />
                      <KpiCard label="Usuários únicos" value={kpis?.unique_users_7d  ?? 0} icon={<Users size={18} />}         color="teal"   />
                      <KpiCard label="Correções"       value={kpis?.corrections_7d   ?? 0} icon={<ThumbsDown size={18} />}    color="rose"   alert={(kpis?.corrections_7d ?? 0) > 10} />
                    </div>
                  </section>

                  <section>
                    <SectionTitle icon={<BarChart2 size={16} />} title="Evolução Diária" subtitle="Últimos 30 dias" />
                    {timeSeries.length > 0 ? <TimeSeriesAreaChart data={timeSeries} /> : <EmptyState label="Sem dados suficientes" />}
                  </section>

                  <section>
                    <SectionTitle icon={<Calendar size={16} />} title="Por Dia da Semana" />
                    {weekdayDistribution.length > 0 ? <WeekdayBarChart data={weekdayDistribution} /> : <EmptyState label="Sem dados" />}
                  </section>

                  <section>
                    <SectionTitle icon={<Flame size={16} />} title="Horários de Pico" />
                    {peakHours.length > 0 ? <PeakHoursBarChart data={peakHours} /> : <EmptyState label="Sem dados" />}
                  </section>
                </div>
              )}

              {/* ── ABA: USUÁRIOS ── */}
              {activeTab === 'usuarios' && (
                <div className="space-y-8">
                  <section>
                    <SectionTitle icon={<Users size={16} />} title="Top 10 Mais Ativos" subtitle="Por logins e mensagens" />
                    {topUsers.length > 0 ? <TopUsersChart data={topUsers} /> : <EmptyState label="Sem dados" />}
                  </section>

                  <section>
                    <SectionTitle icon={<Activity size={16} />} title="Atividade Individual" subtitle="Todos os usuários" />
                    {userActivity.length > 0 ? <UserActivityTable data={userActivity} /> : <EmptyState label="Sem dados" />}
                  </section>

                  <section>
                    <SectionTitle icon={<Flame size={16} />} title="Streaks de Atividade" subtitle="Dias consecutivos de uso" />
                    <StreakTable data={userStreaks} />
                  </section>

                  <section>
                    <SectionTitle icon={<Users size={16} />} title="Distribuição por Perfil" subtitle="Mensagens por papel" />
                    {roleDistribution.length > 0 ? <RoleDonutChart data={roleDistribution} /> : <EmptyState label="Sem dados" />}
                  </section>
                </div>
              )}

              {/* ── ABA: CONTEÚDO & USO ── */}
              {activeTab === 'conteudo' && (
                <div className="space-y-8">
                  <section>
                    <SectionTitle icon={<AlignLeft size={16} />} title="Nuvem de Palavras" subtitle="Termos mais frequentes nas mensagens" />
                    {wordCloud.length > 0 ? <WordCloudSection data={wordCloud} /> : <EmptyState label="Sem dados suficientes" />}
                  </section>

                  <section>
                    <SectionTitle icon={<BarChart2 size={16} />} title="Top Palavras por Perfil" subtitle="O que cada grupo mais pergunta" />
                    <TopWordsByRoleSection data={topWordsByRole} />
                  </section>

                  <section>
                    <SectionTitle icon={<MessageSquare size={16} />} title="Tamanho das Mensagens" subtitle="Média de caracteres por perfil" />
                    {msgLengthByRole.length > 0 ? <MsgLengthChart data={msgLengthByRole} /> : <EmptyState label="Sem dados suficientes" />}
                  </section>
                </div>
              )}

              {/* ── ABA: QUALIDADE IA ── */}
              {activeTab === 'qualidade' && (
                <div className="space-y-8">
                  <section>
                    <SectionTitle icon={<Target size={16} />} title="Taxa de Acerto da IA" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <IaAccuracyGauge taxa={kpis?.ia_accuracy ?? 0} />
                      <div className="grid grid-cols-2 gap-3">
                        <KpiCard label="Total de mensagens" value={kpis?.total_msgs       ?? 0} icon={<MessageSquare size={18} />} color="blue"    />
                        <KpiCard label="Correções totais"   value={kpis?.total_corrections ?? 0} icon={<Repeat2 size={18} />}       color="amber"   />
                        <KpiCard label="Correções (7d)"     value={kpis?.corrections_7d    ?? 0} icon={<AlertTriangle size={18} />}  color="rose"    alert={(kpis?.corrections_7d ?? 0) > 10} />
                        <KpiCard label="Taxa acerto (7d)"   value={`${kpis?.ia_accuracy_7d ?? 0}%`} icon={<Zap size={18} />}        color="emerald" />
                      </div>
                    </div>
                  </section>

                  <section>
                    <SectionTitle icon={<ThumbsDown size={16} />} title="Correções por Usuário" subtitle="Quem mais corrigiu a IA" />
                    <CorrectionRateChart data={correctionRates} />
                  </section>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
