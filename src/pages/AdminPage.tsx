import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

// ─── Tipos ───────────────────────────────────────────────────
type FilterStatus = 'todos' | 'pendente' | 'ativo' | 'inativo';

interface Profile {
  id:        string;
  email:     string;
  name:      string;
  role:      string | null;
  active:    boolean;
  matricula?: string;
  telefone?:  string;
  avatar?:    string;
}

interface AdminPageProps {
  adminName: string;
  onLogout:  () => void;
  onBack:    () => void;   // ← voltar ao dashboard
}

// ─── Componente ───────────────────────────────────────────────
export function AdminPage({ adminName, onLogout, onBack }: AdminPageProps) {
  const [profiles, setProfiles]       = useState<Profile[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState<FilterStatus>('todos');
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editRole, setEditRole]       = useState('');
  const [editActive, setEditActive]   = useState(true);
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, active, matricula, telefone, avatar')
      .order('name');
    if (!error && data) setProfiles(data);
    setLoading(false);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ role: editRole || null, active: editActive })
      .eq('id', id);
    await fetchProfiles();
    setSaving(false);
    setEditingId(null);
  }

  const filtered = profiles.filter(p => {
    const matchSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === 'todos'    ? true :
      filter === 'ativo'    ? p.active && !!p.role :
      filter === 'inativo'  ? !p.active :
      filter === 'pendente' ? p.active && !p.role :
      true;

    return matchSearch && matchFilter;
  });

  const counts = {
    total:    profiles.length,
    pendente: profiles.filter(p =>  p.active && !p.role).length,
    ativo:    profiles.filter(p =>  p.active &&  !!p.role).length,
    inativo:  profiles.filter(p => !p.active).length,
  };

  const ROLE_OPTIONS = ['captador', 'supervisor', 'administrador'];

  const roleColor: Record<string, string> = {
    captador:      'text-blue-600 bg-blue-50',
    supervisor:    'text-purple-600 bg-purple-50',
    administrador: 'text-emerald-600 bg-emerald-50',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Header ── */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 sticky top-0 z-10">

        {/* Esquerda: logo + breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm select-none">
            N
          </div>
          <span className="text-lg font-bold text-blue-600 tracking-tight hidden sm:block">
            NPlayer.<span className="text-yellow-400">IA</span>
          </span>
          <span className="text-slate-300 hidden sm:block">/</span>
          <span className="text-sm font-semibold text-slate-500 hidden sm:block uppercase tracking-wider">
            Administrador
          </span>
        </div>

        {/* Direita: botão voltar + nome + logout */}
        <div className="flex items-center gap-3">

          {/* Botão voltar ao início */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors group px-3 py-2 rounded-xl hover:bg-blue-50"
          >
            <span className="material-icons-round text-[18px] group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            <span className="hidden sm:block">Início</span>
          </button>

          {/* Nome + badge */}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800">{adminName}</p>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-emerald-600 bg-emerald-50">
              Admin
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Sair"
          >
            <span className="material-icons-round text-[20px]">logout</span>
          </button>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <main className="flex-1 px-6 md:px-8 py-8 max-w-5xl mx-auto w-full">

        {/* Título */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Gestão de Usuários</h1>
          <p className="text-sm text-slate-500 mt-1">Defina perfis e controle o acesso da equipe.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total',     value: counts.total,    icon: 'group',           color: 'text-blue-600 bg-blue-50' },
            { label: 'Pendentes', value: counts.pendente, icon: 'schedule',        color: 'text-amber-600 bg-amber-50' },
            { label: 'Ativos',    value: counts.ativo,    icon: 'check_circle',    color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Inativos',  value: counts.inativo,  icon: 'person_off',      color: 'text-red-500 bg-red-50' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.color}`}>
                <span className="material-icons-round text-[20px]">{kpi.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 leading-none">{kpi.value}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-0.5">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Busca + filtros */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">

            {/* Busca */}
            <div className="relative flex-1">
              <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 border border-slate-100"
              />
            </div>

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap">
              {(['todos', 'pendente', 'ativo', 'inativo'] as FilterStatus[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Lista */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <span className="material-icons-round text-[48px]">group_off</span>
              <p className="text-sm font-semibold">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              <AnimatePresence>
                {filtered.map(profile => (
                  <motion.li
                    key={profile.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-5 py-4"
                  >
                    {editingId === profile.id ? (
                      /* ── Modo edição ── */
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex-1 space-y-2 w-full">
                          <p className="text-sm font-bold text-slate-800">{profile.name}</p>
                          <p className="text-xs text-slate-400">{profile.email}</p>
                          <div className="flex gap-2 flex-wrap">
                            <select
                              value={editRole}
                              onChange={e => setEditRole(e.target.value)}
                              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Sem perfil</option>
                              {ROLE_OPTIONS.map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editActive}
                                onChange={e => setEditActive(e.target.checked)}
                                className="w-4 h-4 accent-blue-600"
                              />
                              Ativo
                            </label>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(profile.id)}
                            disabled={saving}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                          >
                            {saving
                              ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : <span className="material-icons-round text-[14px]">save</span>
                            }
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                          >
                            <span className="material-icons-round text-[14px]">close</span>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── Modo visualização ── */
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {profile.avatar
                            ? <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                            : <span className="material-icons-round text-slate-400 text-[20px]">person</span>
                          }
                        </div>

                        {/* Dados */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{profile.name || '—'}</p>
                          <p className="text-xs text-slate-400 truncate">{profile.email}</p>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 shrink-0">
                          {profile.role ? (
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${roleColor[profile.role] ?? 'text-slate-500 bg-slate-100'}`}>
                              {profile.role}
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full text-amber-600 bg-amber-50">
                              Pendente
                            </span>
                          )}
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${profile.active ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                            {profile.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>

                        {/* Botão editar */}
                        <button
                          onClick={() => {
                            setEditingId(profile.id);
                            setEditRole(profile.role ?? '');
                            setEditActive(profile.active);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                          title="Editar"
                        >
                          <span className="material-icons-round text-[16px]">edit</span>
                        </button>
                      </div>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
