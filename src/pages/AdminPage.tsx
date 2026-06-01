import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Search, Edit2, Save, X, ArrowLeft,
  LogOut, ShieldCheck, Eye, EyeOff,
  ChevronDown, UserCog, Lock,
} from 'lucide-react';
import { getAllUsers, updateUser } from '../lib/auth';
import type { UserRole } from '../App';

// ── Types ──────────────────────────────────────────────────
interface LocalUser {
  email:     string;
  name:      string;
  matricula: string;
  password:  string;
  role:      UserRole;
}

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

// ── EditModal ─────────────────────────────────────────────
interface EditModalProps {
  user:      LocalUser;
  adminRole: UserRole;
  onSave:    (email: string, data: Partial<LocalUser>) => void;
  onClose:   () => void;
}

function EditModal({ user, adminRole, onSave, onClose }: EditModalProps) {
  const [name,      setName]      = useState(user.name);
  const [matricula, setMatricula] = useState(user.matricula);
  const [password,  setPassword]  = useState(user.password);
  const [role,      setRole]      = useState<UserRole>(user.role);
  const [showPass,  setShowPass]  = useState(false);
  const [saving,    setSaving]    = useState(false);

  const canChangeRole  = adminRole === 'administrador';
  const availableRoles: UserRole[] = adminRole === 'administrador'
    ? ['captador', 'supervisor', 'administrador']
    : ['captador', 'supervisor'];

  function handleSave() {
    setSaving(true);
    onSave(user.email, { name, matricula, password, role });
    setSaving(false);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Editar Usuário</h2>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Nome completo</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Nome do usuário"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Usuário (e-mail)</label>
            <input type="text" value={user.email} readOnly
              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-400 outline-none cursor-not-allowed" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Matrícula</label>
            <input type="text" value={matricula} onChange={e => setMatricula(e.target.value)}
              placeholder="Número da matrícula"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Senha</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nova senha"
                className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Perfil {!canChangeRole && (
                <span className="text-amber-500 normal-case font-semibold tracking-normal">
                  (somente Admin pode promover a Administrador)
                </span>
              )}
            </label>
            <div className="relative">
              <select value={role} onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all">
                {availableRoles.map(r => (
                  <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
            {saving
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Save size={15} />}
            Salvar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── AdminPage ───────────────────────────────────────────
// Grid: Nome(minmax 200px) | Email(minmax 220px) | Matrícula(90px) | Perfil(130px) | Senha(90px) | Btn(44px)
const COL_GRID = 'grid-cols-[minmax(200px,2fr)_minmax(220px,2.2fr)_90px_130px_90px_44px]';

export function AdminPage({ adminName, adminRole, onLogout, onBack }: AdminPageProps) {
  const [users,      setUsers]      = useState<LocalUser[]>(() => getAllUsers());
  const [search,     setSearch]     = useState('');
  const [filterRole, setFilterRole] = useState<FilterRole>('todos');
  const [editUser,   setEditUser]   = useState<LocalUser | null>(null);

  const visibleUsers = useMemo(() =>
    adminRole === 'administrador' ? users : users.filter(u => u.role !== 'administrador'),
    [users, adminRole]);

  const filtered = useMemo(() =>
    visibleUsers.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.matricula.includes(q);
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

  function handleSave(email: string, data: Partial<LocalUser>) {
    updateUser(email, data);
    setUsers(getAllUsers());
  }

  function canEdit(target: LocalUser): boolean {
    if (adminRole === 'administrador') return true;
    return target.role !== 'administrador';
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

      {/* ── Header ── */}
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
            <span className="hidden sm:block">Início</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {adminName?.[0]?.toUpperCase() ?? 'A'}
            </div>
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

      {/* ── Main ── */}
      {/* max-w-screen-xl garante largura generosa na tela cheia */}
      <main className="flex-1 px-4 md:px-8 py-6 max-w-screen-xl mx-auto w-full space-y-5">

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestão de Usuários</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {adminRole === 'administrador'
                ? 'Acesso total — edite qualquer usuário, perfil ou senha.'
                : 'Você pode editar Captadores e Supervisores. Administradores são protegidos.'}
            </p>
          </div>
          {adminRole === 'administrador'
            ? <ShieldCheck size={22} className="text-emerald-500 mt-1" />
            : <UserCog size={22} className="text-purple-400 mt-1" />}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map(t => (
            <button key={t.key} onClick={() => setFilterRole(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 text-xs font-bold uppercase tracking-wider transition-all ${
                filterRole === t.key
                  ? 'bg-white border-blue-500 text-blue-600 shadow-sm shadow-blue-100'
                  : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
              }`}>
              {t.label}
              <span className={`text-xs font-black ${
                filterRole === t.key ? 'text-blue-600' : 'text-slate-400'
              }`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou matrícula..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
        </div>

        {/* ── Table ── */}
        {/* overflow-x-auto para scroll horizontal em telas menores */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">

          {/* Header — desktop only */}
          <div className={`hidden sm:grid ${COL_GRID} gap-x-4 px-5 py-3 bg-slate-50 border-b border-slate-100 min-w-[820px]`}>
            {['Nome', 'Usuário (login)', 'Matrícula', 'Perfil', 'Senha', ''].map((h, i) => (
              <span key={i} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</span>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-3">
              <Users size={48} strokeWidth={1} />
              <p className="text-sm font-semibold">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              <AnimatePresence initial={false}>
                {filtered.map(u => {
                  const roleCfg = ROLE_CONFIG[u.role];
                  const editable = canEdit(u);

                  return (
                    <motion.li key={u.email} layout
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* ── Desktop row ── */}
                      <div className={`hidden sm:grid ${COL_GRID} gap-x-4 items-center px-5 py-3.5 hover:bg-slate-50 transition-colors min-w-[820px]`}>

                        {/* Nome — sem truncate, quebra linha se necessário */}
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-black text-sm shrink-0">
                            {u.name[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-slate-800 leading-snug">{u.name}</span>
                        </div>

                        {/* E-mail — sem truncate */}
                        <span className="text-xs text-slate-500 font-medium break-all leading-snug">{u.email}</span>

                        {/* Matrícula */}
                        <span className="text-xs font-bold text-slate-600 tabular-nums">
                          {u.matricula || <span className="text-slate-300 italic font-normal">—</span>}
                        </span>

                        {/* Perfil */}
                        <span className={`inline-flex w-fit text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${roleCfg.color} ${roleCfg.bg}`}>
                          {roleCfg.label}
                        </span>

                        {/* Senha (mascarada) */}
                        <span className="flex items-center gap-1 text-xs font-mono text-slate-400">
                          <Lock size={10} className="text-slate-300 shrink-0" />
                          {'•'.repeat(Math.min(u.password.length, 8))}
                        </span>

                        {/* Botão editar */}
                        <button
                          onClick={() => editable && setEditUser(u)}
                          disabled={!editable}
                          title={editable ? 'Editar' : 'Sem permissão'}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
                            editable
                              ? 'text-slate-300 hover:text-blue-600 hover:bg-blue-50'
                              : 'text-slate-200 cursor-not-allowed'
                          }`}>
                          <Edit2 size={15} />
                        </button>
                      </div>

                      {/* ── Mobile row ── */}
                      <div className="flex sm:hidden items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-black shrink-0 mt-0.5">
                          {u.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-400 break-all mt-0.5">{u.email}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${roleCfg.color} ${roleCfg.bg}`}>
                              {roleCfg.label}
                            </span>
                            {u.matricula && (
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                #{u.matricula}
                              </span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => editable && setEditUser(u)} disabled={!editable}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors shrink-0 ${
                            editable ? 'text-slate-300 hover:text-blue-600 hover:bg-blue-50' : 'text-slate-200 cursor-not-allowed'
                          }`}>
                          <Edit2 size={15} />
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
              {filtered.length} de {visibleUsers.length} usuário{visibleUsers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {editUser && (
          <EditModal
            user={editUser}
            adminRole={adminRole}
            onSave={handleSave}
            onClose={() => setEditUser(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
