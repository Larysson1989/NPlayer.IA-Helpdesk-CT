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
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadialBarChart, RadialBar,
} from 'recharts';
import { UserAvatar } from '../components/UserAvatar';
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
  onBack:   () => void;
  onLogout: () => void;
}

// ─── Cores ────────────────────────────────────────────────────────────────────
const ROLE_COLOR: Record<string, { badge: string; hex: string }> = {
  captador:      { badge: 'text-blue-600 bg-blue-50',    hex: '#3b82f6' },
  supervisor:    { badge: 'text-purple-600 bg-purple-50', hex: '#9333ea' },
  administrador: { badge: 'text-emerald-700 bg-emerald-50', hex: '#059669' },
};

const PIE_COLORS = ['#3b82f6', '#9333ea', '#059669', '#f59e0b', '#ef4444'];
const WORD_COLORS = ['#2563eb','#7c3aed','#0891b2','#059669','#d97706','#dc2626','#9333ea','#0284c7','#16a34a','#ca8a04'];

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

// ─── Tooltip customizado ──────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2.5 text-xs font-semibold text-slate-700">
      {label && <p className="font-black text-slate-500 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <span className="font-black">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

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

// ─── Gráfico de Área (Série temporal) ────────────────────────────────────────
function TimeSeriesAreaChart({ data }: { data: DayCount[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradLogins" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradMsgs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle" iconSize={8}
            formatter={(v) => <span className="text-xs font-bold text-slate-500">{v}</span>}
          />
          <Area type="monotone" dataKey="logins" name="Logins" stroke="#3b82f6" strokeWidth={2}
            fill="url(#gradLogins)" dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#3b82f6' }} />
          <Area type="monotone" dataKey="msgs" name="Mensagens" stroke="#8b5cf6" strokeWidth={2}
            fill="url(#gradMsgs)" dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#8b5cf6' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Gráfico de barras (Pico de Horas) ───────────────────────────────────────
function PeakHoursBarChart({ data }: { data: HourCount[] }) {
  const workHours = data.filter(d => d.hour >= 7 && d.hour <= 21);
  const max = Math.max(...workHours.map(d => d.value), 1);

  const coloredData = workHours.map(d => ({
    ...d,
    fill: d.value / max > 0.7 ? '#f87171' : d.value / max > 0.4 ? '#fbbf24' : '#60a5fa',
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <p className="text-xs text-slate-400 font-semibold mb-3">Horários comerciais (07h–21h) · últimos 30 dias</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={coloredData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="value" name="Mensagens" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {coloredData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
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

// ─── Donut de distribuição por role ──────────────────────────────────────────
function RoleDonutChart({ data }: { data: RoleDistribution[] }) {
  const LABELS: Record<string, string> = {
    captador: 'Captador', supervisor: 'Supervisor', administrador: 'Admin',
  };
  const pieData = data.map(d => ({ name: LABELS[d.role] ?? d.role, value: d.msgs, users: d.count }));
  const total = pieData.reduce((s, d) => s + d.value, 0);

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, index }: {
    cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; index: number;
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const pct = total > 0 ? Math.round((pieData[index].value / total) * 100) : 0;
    if (pct < 5) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
        className="text-[10px] font-black" style={{ fontSize: 11, fontWeight: 900 }}>
        {pct}%
      </text>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
              dataKey="value" labelLine={false} label={CustomPieLabel as React.FC}>
              {pieData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number, name: string) => [`${fmt(v)} msgs`, name]} />
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
                <p className="text-sm font-black tabular-nums" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>
                  {fmt(d.value)} msgs
                </p>
                <p className="text-[10px] text-slate-400">{d.users} usuário{d.users !== 1 ? 's' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
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

// ─── Ranking Top 10 com barras duplas ─────────────────────────────────────────
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
          <Legend iconType="circle" iconSize={8}
            formatter={(v) => <span className="text-xs font-bold text-slate-500">{v}</span>} />
          <Bar dataKey="logins" name="Logins" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={14} />
          <Bar dataKey="mensagens" name="Mensagens" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── NOVO: Uso por dia da semana ──────────────────────────────────────────────
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
          <Legend iconType="circle" iconSize={8}
            formatter={(v) => <span className="text-xs font-bold text-slate-500">{v}</span>} />
          <Bar dataKey="logins" name="Logins" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="msgs" name="Mensagens" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── NOVO: Taxa de correção por usuário ───────────────────────────────────────
function CorrectionRateChart({ data }: { data: UserCorrectionRate[] }) {
  const chartData = data
    .filter(u => u.correcoes > 0)
    .map(u => ({
      name: u.user_name.split(' ')[0],
      correcoes: u.correcoes,
      taxa: u.taxa,
      role: u.role,
    }));

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
          <Legend iconType="circle" iconSize={8}
            formatter={(v) => <span className="text-xs font-bold text-slate-500">{v}</span>} />
          <Bar dataKey="correcoes" name="Correções" fill="#f87171" radius={[0, 4, 4, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── NOVO: Gauge de taxa de acerto IA ─────────────────────────────────────────
function IaAccuracyGauge({ taxa }: { taxa: number }) {
  const color = taxa >= 90 ? '#10b981' : taxa >= 70 ? '#f59e0b' : '#ef4444';
  const label = taxa >= 90 ? 'Excelente' : taxa >= 70 ? 'Atenção' : 'Crítico';
  const gaugeData = [{ name: 'Taxa', value: taxa, fill: color }, { name: 'Resto', value: 100 - taxa, fill: '#f1f5f9' }];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Taxa de Acerto da IA</p>
      <div className="relative">
        <ResponsiveContainer width={180} height={120}>
          <RadialBarChart cx="50%" cy="100%" innerRadius={60} outerRadius={90}
            startAngle={180} endAngle={0} data={gaugeData}>
            <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#f1f5f9' }}>
              {gaugeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </RadialBar>
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <p className="text-3xl font-black tabular-nums" style={{ color }}>{taxa}%</p>
          <p className="text-xs font-bold" style={{ color }}>{label}</p>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-3 text-center">Baseado em msgs vs. correções submetidas</p>
    </div>
  );
}

// ─── NOVO: Comprimento médio por role ─────────────────────────────────────────
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
          <Bar dataKey="media" name="Caracteres médios" radius={[6, 6, 0, 0]} maxBarSize={60}>
            {data.map((_, i) => (
              <Cell key={i} fill={['#3b82f6', '#9333ea', '#059669'][i % 3]} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── NOVO: Streaks de uso ─────────────────────────────────────────────────────
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
                  <span className="flex items-center gap-1.5 text-sm font-black text-orange-500">
                    <Flame size={13} />{u.streak}d
                  </span>
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

// ─── NOVO: Top palavras por role ──────────────────────────────────────────────
function TopWordsByRoleSection({ data }: { data: RoleTopWords[] }) {
  const ROLE_LABELS: Record<string, string> = { captador: 'Captadores', supervisor: 'Supervisores', administrador: 'Admins' };
  const COLORS_BY_ROLE: Record<string, string> = { captador: '#3b82f6', supervisor: '#9333ea', administrador: '#059669' };

  if (data.length === 0) return <EmptyState label="Sem dados suficientes" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {data.map(r => (
        <div key={r.role} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: COLORS_BY_ROLE[r.role] ?? '#64748b' }}>
            {ROLE_LABELS[r.role] ?? r.role}
          </p>
          <div className="flex flex-col gap-2">
            {r.words.slice(0, 8).map((w, i) => {
              const max = r.words[0]?.count ?? 1;
              const pct = Math.round((w.count / max) * 100);
              return (
                <div key={w.word} className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-slate-700">{w.word}</span>
                      <span className="text-[10px] font-black text-slate-400">{w.count}x</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS_BY_ROLE[r.role] ?? '#64748b', opacity: 0.7 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function MetricsDashboardPage({ adminName, adminRole, onBack, onLogout }: Props) {
  const [kpis,           setKpis]           = useState<MetricsKPIs | null>(null);
  const [topUsers,       setTopUsers]       = useState<TopUser[]>([]);
  const [wordCloud,      setWordCloud]      = useState<WordCount[]>([]);
  const [series,         setSeries]         = useState<DayCount[]>([]);
  const [hours,          setHours]          = useState<HourCount[]>([]);
  const [activity,       setActivity]       = useState<UserActivity[]>([]);
  const [roles,          setRoles]          = useState<RoleDistribution[]>([]);
  // novos
  const [weekdays,       setWeekdays]       = useState<WeekdayCount[]>([]);
  const [corrRates,      setCorrRates]      = useState<UserCorrectionRate[]>([]);
  const [roleWords,      setRoleWords]      = useState<RoleTopWords[]>([]);
  const [streaks,        setStreaks]        = useState<UserStreak[]>([]);
  const [msgLengths,     setMsgLengths]     = useState<MsgLengthByRole[]>([]);

  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeTab,  setActiveTab]  = useState<'overview' | 'usuarios' | 'conteudo' | 'qualidade'>('overview');

  const loadAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);

    const [k, tu, wc, s, h, a, r, wd, cr, rw, st, ml] = await Promise.all([
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

    setKpis(k); setTopUsers(tu); setWordCloud(wc);
    setSeries(s); setHours(h); setActivity(a); setRoles(r);
    setWeekdays(wd); setCorrRates(cr); setRoleWords(rw); setStreaks(st); setMsgLengths(ml);
    setLastUpdate(new Date());
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    const id = setInterval(() => loadAll(true), 60_000);
    return () => clearInterval(id);
  }, [loadAll]);

  const maxWord = wordCloud[0]?.count ?? 1;

  const TABS = [
    { id: 'overview',   label: 'Visão Geral',   icon: <BarChart2     size={14} /> },
    { id: 'usuarios',   label: 'Usuários',       icon: <Users         size={14} /> },
    { id: 'conteudo',   label: 'Conteúdo & Uso', icon: <MessageSquare size={14} /> },
    { id: 'qualidade',  label: 'Qualidade IA',   icon: <Target        size={14} /> },
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
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
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

            {/* ═══════════ ABA: VISÃO GERAL ═══════════ */}
            {activeTab === 'overview' && (
              <motion.div key="overview"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <section>
                  <SectionTitle icon={<MessageSquare size={15} />} title="Mensagens" subtitle="Volume total de interações com a IA" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KpiCard label="Total de mensagens" value={kpis!.totalMensagens} icon={<MessageSquare size={18}/>} color="blue" />
                    <KpiCard label="Mensagens hoje" value={kpis!.mensagensHoje} icon={<MessageSquare size={18}/>} color="indigo" />
                    <KpiCard label="Últimos 7 dias" value={kpis!.mensagens7d} icon={<TrendingUp size={18}/>} color="violet" />
                    <KpiCard label="Média por usuário" value={kpis!.mediaMsgPorUsuario} icon={<BarChart2 size={18}/>} color="sky" suffix=" msgs" />
                  </div>
                </section>

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
                    <KpiCard label="Comprimento médio" value={kpis!.mediaCaracteresPergunta} icon={<AlignLeft size={18}/>} color="orange"
                      suffix=" chars" delta="Média das últimas 200 perguntas" />
                    <KpiCard label="Total de usuários" value={kpis!.usuariosTotal} icon={<Users size={18}/>} color="indigo" />
                  </div>
                </section>

                <section>
                  <SectionTitle icon={<TrendingUp size={15} />} title="Atividade nos últimos 14 dias" subtitle="Logins e mensagens por dia" />
                  {series.length > 0 ? <TimeSeriesAreaChart data={series} /> : <EmptyState label="Sem dados" />}
                </section>

                <section>
                  <SectionTitle icon={<Calendar size={15} />} title="Uso por Dia da Semana" subtitle="Distribuição de logins e mensagens nos últimos 30 dias" />
                  {weekdays.length > 0 ? <WeekdayBarChart data={weekdays} /> : <EmptyState label="Sem dados" />}
                </section>

                <section>
                  <SectionTitle icon={<Users size={15} />} title="Uso por Perfil" subtitle="Distribuição de mensagens por tipo de usuário" />
                  {roles.length > 0 ? <RoleDonutChart data={roles} /> : <EmptyState label="Sem dados" />}
                </section>
              </motion.div>
            )}

            {/* ═══════════ ABA: USUÁRIOS ═══════════ */}
            {activeTab === 'usuarios' && (
              <motion.div key="usuarios"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <section>
                  <SectionTitle icon={<TrendingUp size={15} />} title="Ranking de Engajamento" subtitle="Top 10 usuários por logins e mensagens" />
                  {topUsers.length === 0
                    ? <EmptyState label="Nenhum login registrado ainda" />
                    : <TopUsersChart data={topUsers} />}
                </section>

                {topUsers.length > 0 && (
                  <section>
                    <SectionTitle icon={<Users size={15} />} title="Detalhes do Ranking" subtitle="Posição e métricas individuais" />
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
                                  <div className="h-1.5 bg-blue-500 rounded-full transition-all" style={{ width: `${(u.logins / maxLogins) * 100}%` }} />
                                </div>
                                <span className="text-xs font-black text-blue-600 tabular-nums w-8 text-right">{u.logins}</span>
                                <span className="text-[9px] text-slate-400">login</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                  <div className="h-1.5 bg-violet-500 rounded-full transition-all" style={{ width: `${(u.mensagens / maxMsgs) * 100}%` }} />
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
                  </section>
                )}

                <section>
                  <SectionTitle icon={<Flame size={15} />} title="Streaks de Uso" subtitle="Dias consecutivos de uso por usuário" />
                  <StreakTable data={streaks} />
                </section>

                <section>
                  <SectionTitle icon={<Activity size={15} />} title="Atividade Individual" subtitle="Histórico e status de cada usuário ativo" />
                  {activity.length === 0 ? <EmptyState label="Sem dados de atividade" /> : (
                    <UserActivityTable data={activity} />
                  )}
                </section>
              </motion.div>
            )}

            {/* ═══════════ ABA: CONTEÚDO ═══════════ */}
            {activeTab === 'conteudo' && (
              <motion.div key="conteudo"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <section>
                  <SectionTitle icon={<Clock size={15} />} title="Horários de Pico" subtitle="Quando a equipe mais usa o sistema" />
                  {hours.length > 0 ? <PeakHoursBarChart data={hours} /> : <EmptyState label="Sem dados" />}
                </section>

                <section>
                  <SectionTitle icon={<AlignLeft size={15} />} title="Profundidade das Perguntas" subtitle="Comprimento médio de pergunta por perfil" />
                  {msgLengths.length > 0 ? <MsgLengthChart data={msgLengths} /> : <EmptyState label="Sem dados" />}
                </section>

                <section>
                  <SectionTitle icon={<MessageSquare size={15} />} title="Temas mais Pesquisados" subtitle="Nuvem de palavras das últimas 500 perguntas" />
                  {wordCloud.length === 0 ? <EmptyState label="Nenhuma mensagem registrada ainda" /> : (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {wordCloud.map((w, i) => {
                          const ratio   = w.count / maxWord;
                          const size    = 11 + Math.round(ratio * 26);
                          const opacity = 0.45 + ratio * 0.55;
                          return (
                            <span
                              key={w.word}
                              className="font-bold cursor-default select-none transition-transform hover:scale-110"
                              style={{ fontSize: size, color: WORD_COLORS[i % WORD_COLORS.length], opacity }}
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

                <section>
                  <SectionTitle icon={<BarChart2 size={15} />} title="Top Temas por Frequência" subtitle="Palavras-chave mais repetidas (gráfico)" />
                  {wordCloud.length === 0 ? <EmptyState label="Sem dados" /> : (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                          data={wordCloud.slice(0, 15).map(w => ({ name: w.word, count: w.count }))}
                          layout="vertical"
                          margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                          <Bar dataKey="count" name="Ocorrências" radius={[0, 4, 4, 0]} maxBarSize={18}>
                            {wordCloud.slice(0, 15).map((_, i) => (
                              <Cell key={i} fill={WORD_COLORS[i % WORD_COLORS.length]} fillOpacity={0.8} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </section>

                <section>
                  <SectionTitle icon={<Users size={15} />} title="Temas por Perfil" subtitle="O que cada grupo mais pergunta" />
                  <TopWordsByRoleSection data={roleWords} />
                </section>
              </motion.div>
            )}

            {/* ═══════════ ABA: QUALIDADE IA ═══════════ */}
            {activeTab === 'qualidade' && (
              <motion.div key="qualidade"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* KPIs de qualidade */}
                <section>
                  <SectionTitle icon={<Target size={15} />} title="Indicadores de Qualidade" subtitle="Precisão e comportamento de uso da IA" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KpiCard label="Taxa de acerto IA" value={kpis!.taxaAcertoIA} icon={<Target size={18}/>}
                      color={kpis!.taxaAcertoIA >= 90 ? 'emerald' : kpis!.taxaAcertoIA >= 70 ? 'amber' : 'red'}
                      suffix="%" delta={kpis!.taxaAcertoIA >= 90 ? 'Excelente' : kpis!.taxaAcertoIA >= 70 ? 'Requer atenção' : 'Crítico'} />
                    <KpiCard label="Total de correções" value={kpis!.totalCorrecoes} icon={<ThumbsDown size={18}/>}
                      color={kpis!.totalCorrecoes === 0 ? 'green' : 'amber'}
                      delta="Feedbacks negativos enviados" />
                    <KpiCard label="Correções/usuário" value={kpis!.mediaCorrecoesUsuario} icon={<ThumbsDown size={18}/>}
                      color={kpis!.mediaCorrecoesUsuario === 0 ? 'green' : kpis!.mediaCorrecoesUsuario < 1 ? 'amber' : 'red'}
                      suffix=" /user" delta="Média de feedbacks negativos" />
                    <KpiCard label="Comprimento médio" value={kpis!.mediaCaracteresPergunta} icon={<AlignLeft size={18}/>}
                      color="blue" suffix=" chars"
                      delta={kpis!.mediaCaracteresPergunta > 60 ? 'Perguntas elaboradas' : 'Perguntas curtas'} />
                  </div>
                </section>

                {/* Gauge de acerto */}
                <section>
                  <SectionTitle icon={<Zap size={15} />} title="Precisão da IA" subtitle="Visualização da taxa de acerto geral" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <IaAccuracyGauge taxa={kpis!.taxaAcertoIA} />
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-center gap-4">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-500">Como interpretar</p>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-slate-700">≥ 90% — Excelente</p>
                            <p className="text-xs text-slate-400">Base de conhecimento muito bem calibrada</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-slate-700">70–89% — Atenção</p>
                            <p className="text-xs text-slate-400">Revisar tópicos com mais correções</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full bg-red-400 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-slate-700">&lt; 70% — Crítico</p>
                            <p className="text-xs text-slate-400">Base de conhecimento precisa de revisão urgente</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Correções por usuário */}
                <section>
                  <SectionTitle icon={<ThumbsDown size={15} />} title="Correções por Usuário" subtitle="Quem mais enviou feedbacks negativos" />
                  <CorrectionRateChart data={corrRates} />
                </section>

                {/* Tabela detalhada */}
                {corrRates.filter(u => u.correcoes > 0).length > 0 && (
                  <section>
                    <SectionTitle icon={<Users size={15} />} title="Detalhes de Correção" subtitle="Taxa individual de feedback negativo" />
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-50 bg-slate-50">
                              {['Usuário', 'Perfil', 'Mensagens', 'Correções', 'Taxa'].map(h => (
                                <th key={h} className="text-left text-[10px] font-black uppercase tracking-wider text-slate-400 px-4 py-2.5">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {corrRates.filter(u => u.correcoes > 0).map((u, i) => (
                              <tr key={u.user_id} className={`border-b border-slate-50 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
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
                                <td className="px-4 py-3 text-sm font-bold tabular-nums text-slate-700">{fmt(u.msgs)}</td>
                                <td className="px-4 py-3 text-sm font-bold tabular-nums text-red-500">{u.correcoes}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-sm font-black tabular-nums ${
                                    u.taxa > 10 ? 'text-red-500' : u.taxa > 5 ? 'text-amber-500' : 'text-emerald-600'
                                  }`}>{u.taxa}%</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
