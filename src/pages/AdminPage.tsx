import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Search, Edit2, Save, X, ArrowLeft,
  LogOut, ShieldCheck, UserCog, ChevronDown,
} from 'lucide-react';
import { getAllUsers, updateUserActive } from '../lib/auth';
import { UserAvatar } from '../components/UserAvatar';
import type { User, UserRole } from '../App';

interface AdminPageProps {
  adminName: string;
  adminRole: UserRole;
  onLogout:  () => void;
  onBack:    () => void;
}

type FilterRole = 'todos' | UserRole;

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string }> = {
  captador:      { label: 'Captador',      color: 'text-blue-600',    bg: 'bg-blue-50'    },
  supervisor:    { label: 'Supervisor',    color: 'text-purple-600',  bg: 'bg-purple-50'  },
  administrador: { label: 'Administrador', color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

const COL_GRID = 'grid-cols-[minmax(200px,2fr)_minmax(220px,2.2fr)_90px_130px_120px_44px]';

export function AdminPage({ adminName, adminRole, onLogout, onBack }: AdminPageProps) {
  const [users,      setUsers]      = useState<User[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filterRole, setFilterRole] = useState<FilterRole>('todos');
  const [toggling,   setToggling]   = useState<string | null>(null);

  useEffect(() => {
    getAllUsers().then(data => { setUsers(data); setLoading(false); });
  }, []);

  const visibleUsers = useMemo(() =>
    adminRole === 'administrador' ? users : users.filter(u => u.role !== 'administrador'),
    [users, adminRole]);

  const filtered = useMemo(() =>
    visibleUsers.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.matricula ?? '').includes(q);
      const matchRole = filterRole === 'todos' || u.role === filterRole;
      return matchSearch && matchRole;
    }),
    [visibleUsers, search, filterRole]);

  const counts = useMemo(() => ({
    todos:         visibleUsers.length,
    captador:      visibleUsers.filter(u => u.role === 'captador').length,
    supervisor:    visibleUsers.filter(u => u.role === 'supervisor').length,
    administrador: visibleUsers.filter(u => u.role === 'administrador').length,
  }), [visibleUsers]);

  async function handleToggleActive(user: User) {
    setToggling(user.id);
    const ok = await updateUserActive(user.id, !user.active);
    if (ok) setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: !u.active } : u));
    setToggling(null);
  }

  const FILTER_TABS: { key: FilterRole; label: string; count: number }[] = [
    { key: 'todos',      label: 'Todos',        count: counts.todos      },
    { key: 'captador',   label: 'Captadores',   count: counts.captador   },
    { key: 'supervisor', label: 'Supervisores', count: counts.supervisor },
    ...(adminRole === 'administrador'
      ? [{ key: 'administrador' as FilterRole, label: 'Administradores', count: counts.administrador }]
      : []),
  ];

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
            {adminRole === 'administrador' ? 'Administrador' : 'Supervisor'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:block">Inicio</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
            <UserAvatar name={adminName} size="sm" />
            <span className="text-sm font-semibold text-slate-700">{adminName}</span>
            <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
              adminRole === 'administrador' ? 'text-emerald-600 bg-emerald-100' : 'text-purple-600 bg-purple-100'
            }`}>
              {adminRole === 'administrador' ? 'Admin' : 'Supervisor'}
            </span>
          </div>
          <button onClick={onLogout} title="Sair"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 max-w-screen-xl mx-auto w-full space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestao de Usuarios</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {adminRole === 'administrador'
                ? 'Acesso total - ative ou desative qualquer usuario.'
                : 'Voce pode gerenciar Captadores e Supervisores.'}
            </p>
          </div>
          {adminRole === 'administrador'
            ? <ShieldCheck size={22} className="text-emerald-500 mt-1" />
            : <UserCog size={22} className="text-purple-400 mt-1" />}
        </div>

        {/* FILTROS */}
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map(t => (
            <button key={t.key} onClick={() => setFilterRole(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 text-xs font-bold uppercase tracking-wider transition-all ${
                filterRole === t.key
                  ? 'bg-white border-blue-500 text-blue-600 shadow-sm shadow-blue-100'
                  : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
              }`}>
              {t.label}
              <span className={`text-xs font-black ${filterRole === t.key ? 'text-blue-600' : 'text-slate-400'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* BUSCA */}
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou matricula..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
        </div>

        {/* TABELA */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
          <div className={`hidden sm:grid ${COL_GRID} gap-x-4 px-5 py-3 bg-slate-50 border-b border-slate-100 min-w-[860px]`}>
            {['Nome', 'E-mail', 'Matricula', 'Perfil', 'Status', ''].map((h, i) => (
              <span key={i} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-semibold">Carregando usuarios...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-3">
              <Users size={48} strokeWidth={1} />
              <p className="text-sm font-semibold">Nenhum usuario encontrado</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              <AnimatePresence initial={false}>
                {filtered.map(u => {
                  const roleCfg = ROLE_CONFIG[u.role];
                  const isToggling = toggling === u.id;
                  const canToggle = adminRole === 'administrador' || u.role !== 'administrador';
                  return (
                    <motion.li key={u.id} layout
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Desktop */}
                      <div className={`hidden sm:grid ${COL_GRID} gap-x-4 items-center px-5 py-3.5 hover:bg-slate-50 transition-colors min-w-[860px] ${
                        !u.active ? 'opacity-50' : ''
                      }`}>
                        <div className="flex items-center gap-3">
                          <UserAvatar name={u.name} size="sm" />
                          <span className="text-sm font-bold text-slate-800 leading-snug">{u.name}</span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium break-all">{u.email}</span>
                        <span className="text-xs font-bold text-slate-600 tabular-nums">
                          {u.matricula || <span className="text-slate-300 italic font-normal">-</span>}
                        </span>
                        <span className={`inline-flex w-fit text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${roleCfg.color} ${roleCfg.bg}`}>
                          {roleCfg.label}
                        </span>
                        <span className={`inline-flex w-fit text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          u.active ? 'text-emerald-700 bg-emerald-50' : 'text-red-500 bg-red-50'
                        }`}>
                          {u.active ? 'Ativo' : 'Inativo'}
                        </span>
                        <button
                          onClick={() => canToggle && handleToggleActive(u)}
                          disabled={!canToggle || isToggling}
                          title={canToggle ? (u.active ? 'Desativar' : 'Ativar') : 'Sem permissao'}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
                            canToggle ? 'text-slate-300 hover:text-blue-600 hover:bg-blue-50' : 'text-slate-200 cursor-not-allowed'
                          }`}>
                          {isToggling
                            ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            : <Edit2 size={15} />}
                        </button>
                      </div>

                      {/* Mobile */}
                      <div className={`flex sm:hidden items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors ${
                        !u.active ? 'opacity-50' : ''
                      }`}>
                        <UserAvatar name={u.name} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-400 break-all mt-0.5">{u.email}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${roleCfg.color} ${roleCfg.bg}`}>
                              {roleCfg.label}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                              u.active ? 'text-emerald-700 bg-emerald-50' : 'text-red-500 bg-red-50'
                            }`}>
                              {u.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => canToggle && handleToggleActive(u)} disabled={!canToggle || isToggling}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors shrink-0 ${
                            canToggle ? 'text-slate-300 hover:text-blue-600 hover:bg-blue-50' : 'text-slate-200 cursor-not-allowed'
                          }`}>
                          {isToggling
                            ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            : <Edit2 size={15} />}
                        </button>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}

          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
            <span className="text-xs text-slate-400 font-semibold">
              {filtered.length} de {visibleUsers.length} usuario{visibleUsers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
