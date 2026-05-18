// src/pages/AdminPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, ShieldCheck, UserX, Clock, Search,
  ChevronDown, Check, X, RefreshCw, LogOut,
  Crown, Eye, Headphones, AlertTriangle
} from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────
type UserRole = 'captador' | 'supervisor' | 'administrador';

interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole | null;
  active: boolean;
  created_at: string;
}

interface AdminPageProps {
  adminName: string;
  onLogout: () => void;
}

// ── Helpers ───────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  captador:      { label: 'Captador',      icon: <Headphones size={13} />, color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
  supervisor:    { label: 'Supervisor',    icon: <Eye size={13} />,        color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200' },
  administrador: { label: 'Administrador', icon: <Crown size={13} />,      color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
};

function RoleBadge({ role }: { role: UserRole | null }) {
  if (!role) return (
    <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
      <Clock size={11} /> Pendente
    </span>
  );
  const c = ROLE_CONFIG[role];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${c.bg} ${c.color}`}>
      {c.icon} {c.label}
    </span>
  );
}

// ── Dropdown de role ──────────────────────────────────────────
function RoleDropdown({
  userId, currentRole, onUpdated
}: { userId: string; currentRole: UserRole | null; onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const roles: (UserRole | null)[] = ['captador', 'supervisor', 'administrador', null];
  const labels: Record<string, string> = {
    captador: 'Captador', supervisor: 'Supervisor',
    administrador: 'Administrador', null: 'Remover perfil'
  };

  const apply = async (role: UserRole | null) => {
    setSaving(true);
    setOpen(false);
    await supabase.from('profiles').update({ role }).eq('id', userId);
    setSaving(false);
    onUpdated();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:border-primary/40 hover:text-primary transition-all disabled:opacity-50"
      >
        {saving ? <RefreshCw size={12} className="animate-spin" /> : 'Alterar'}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-1 z-20 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden py-1"
            >
              {roles.map(r => (
                <button
                  key={String(r)}
                  onClick={() => apply(r)}
                  className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between transition-colors
                    ${r === null ? 'text-red-500 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  {labels[String(r)]}
                  {currentRole === r && <Check size={12} className="text-primary" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── AdminPage ─────────────────────────────────────────────────
export function AdminPage({ adminName, onLogout }: AdminPageProps) {
  const [profiles, setProfiles]   = useState<Profile[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState<'todos' | 'pendente' | 'ativo' | 'inativo'>('todos');
  const [toastMsg, setToastMsg]   = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, email, name, role, active, created_at')
      .order('created_at', { ascending: false });
    setProfiles(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (profile: Profile) => {
    await supabase.from('profiles').update({ active: !profile.active }).eq('id', profile.id);
    showToast(`${profile.name ?? profile.email} ${!profile.active ? 'ativado' : 'desativado'}.`);
    load();
  };

  // ── Filtro + busca ─────────────────────────────────────────
  const filtered = profiles.filter(p => {
    const matchSearch =
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'todos'    ? true :
      filter === 'pendente' ? !p.role :
      filter === 'ativo'    ? p.active && !!p.role :
      !p.active;
    return matchSearch && matchFilter;
  });

  // ── Estatísticas ───────────────────────────────────────────
  const stats = {
    total:    profiles.length,
    pending:  profiles.filter(p => !p.role).length,
    active:   profiles.filter(p => p.active && !!p.role).length,
    inactive: profiles.filter(p => !p.active).length,
  };

  const firstName = adminName.split(' ')[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">N</div>
          <span className="text-lg font-bold text-primary tracking-tight">
            NPlayer.<span className="text-yellow-400">IA</span>
          </span>
          <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest text-slate-300 ml-2">
            / Administrador
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-600 hidden sm:block">{firstName}</span>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
            Admin
          </span>
          <button
            onClick={onLogout}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Título */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestão de Usuários</h1>
          <p className="text-sm text-slate-400 font-medium mt-0.5">
            Defina perfis e controle o acesso da equipe.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total',     value: stats.total,    icon: <Users size={18} />,      color: 'text-slate-600',  bg: 'bg-slate-100' },
            { label: 'Pendentes', value: stats.pending,  icon: <Clock size={18} />,      color: 'text-amber-600',  bg: 'bg-amber-50' },
            { label: 'Ativos',    value: stats.active,   icon: <ShieldCheck size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Inativos',  value: stats.inactive, icon: <UserX size={18} />,      color: 'text-red-500',    bg: 'bg-red-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800 leading-none">{s.value}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros + busca */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['todos', 'pendente', 'ativo', 'inativo'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                  filter === f
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'bg-white text-slate-400 border-slate-200 hover:border-primary/30'
                }`}
              >
                {f}
                {f === 'pendente' && stats.pending > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${filter === f ? 'bg-white/20' : 'bg-amber-100 text-amber-600'}`}>
                    {stats.pending}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela de usuários */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <RefreshCw size={18} className="animate-spin text-primary" />
              <span className="text-sm font-bold text-slate-400">Carregando...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-300">
              <Users size={40} />
              <p className="text-sm font-bold">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {/* Cabeçalho */}
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 bg-slate-50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Perfil</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</span>
              </div>

              <AnimatePresence>
                {filtered.map((profile, i) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3 sm:gap-4 items-center px-6 py-4 hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Usuário */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0 uppercase">
                        {(profile.name ?? profile.email)[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {profile.name ?? '—'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{profile.email}</p>
                      </div>
                    </div>

                    {/* Perfil */}
                    <div className="flex items-center gap-2">
                      <RoleBadge role={profile.role} />
                      <RoleDropdown
                        userId={profile.id}
                        currentRole={profile.role}
                        onUpdated={() => { load(); showToast('Perfil atualizado.'); }}
                      />
                    </div>

                    {/* Status */}
                    <div>
                      {profile.active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                          <Check size={11} /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600">
                          <X size={11} /> Inativo
                        </span>
                      )}
                    </div>

                    {/* Ações */}
                    <button
                      onClick={() => toggleActive(profile)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                        profile.active
                          ? 'border-red-200 text-red-500 hover:bg-red-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {profile.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Aviso pendentes */}
        {stats.pending > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl"
          >
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-amber-800">
                {stats.pending} usuário{stats.pending > 1 ? 's' : ''} aguardando liberação
              </p>
              <p className="text-xs text-amber-600 mt-0.5 font-medium">
                Use o botão "Alterar" ao lado do perfil para definir o acesso.
              </p>
            </div>
          </motion.div>
        )}

      </main>
    </div>
  );
}
