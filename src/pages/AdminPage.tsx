import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import {
  Users, Wifi, WifiOff, ShieldOff, Search, Edit2,
  Save, X, ArrowLeft, LogOut, RefreshCw,
  CheckCircle2, Clock, Ban, ChevronDown,
} from 'lucide-react';

type UserStatus  = 'ativo' | 'inativo' | 'bloqueado';
type UserRole    = 'captador' | 'supervisor' | 'administrador';
type FilterTab   = 'todos' | 'online' | 'offline' | 'bloqueado';

interface Profile {
  id:           string;
  email:        string;
  name:         string | null;
  role:         UserRole | null;
  status:       UserStatus;
  active:       boolean;
  last_seen_at: string | null;
  created_at:   string;
}

interface AdminPageProps {
  adminName: string;
  onLogout:  () => void;
  onBack:    () => void;
}

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function isOnline(last_seen_at: string | null): boolean {
  if (!last_seen_at) return false;
  return Date.now() - new Date(last_seen_at).getTime() < ONLINE_THRESHOLD_MS;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Nunca';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return 'Agora mesmo';
  if (diff < 3600)  return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  ativo:     { label: 'Ativo',     color: 'text-emerald-600', bg: 'bg-emerald-50',  icon: <CheckCircle2 size={12} /> },
  inativo:   { label: 'Inativo',   color: 'text-slate-400',   bg: 'bg-slate-100',   icon: <Clock size={12} /> },
  bloqueado: { label: 'Bloqueado', color: 'text-red-600',     bg: 'bg-red-50',      icon: <Ban size={12} /> },
};

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string }> = {
  captador:      { label: 'Captador',      color: 'text-blue-600',    bg: 'bg-blue-50'    },
  supervisor:    { label: 'Supervisor',    color: 'text-purple-600',  bg: 'bg-purple-50'  },
  administrador: { label: 'Administrador', color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

interface EditModalProps {
  profile: Profile;
  onSave:  (id: string, data: Partial<Profile>) => Promise<void>;
  onClose: () => void;
}

function EditModal({ profile, onSave, onClose }: EditModalProps) {
  const [name,   setName]   = useState(profile.name   ?? '');
  const [role,   setRole]   = useState<UserRole | ''>(profile.role ?? '');
  const [status, setStatus] = useState<UserStatus>(profile.status ?? 'ativo');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(profile.id, {
      name:   name || null,
      role:   (role as UserRole) || null,
      status,
      active: status === 'ativo',
    });
    setSaving(false);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1,    y: 0    }}
        exit={{ scale: 0.94, y: 16 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Editar Usuário</h2>
            <p className="text-xs text-slate-400 mt-0.5">{profile.email}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Nome completo</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome do usuário"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Login (e-mail)</label>
            <input
              type="text"
              value={profile.email}
              readOnly
              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-400 outline-none cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Perfil</label>
            <div className="relative">
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole | '')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all"
              >
                <option value="">Sem perfil definido</option>
                <option value="captador">Captador</option>
                <option value="supervisor">Supervisor</option>
                <option value="administrador">Administrador</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Status da conta</label>
            <div className="grid grid-cols-3 gap-2">
              {(['ativo', 'inativo', 'bloqueado'] as UserStatus[]).map(s => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border-2 transition-all ${
                      status === s
                        ? `${cfg.bg} ${cfg.color} border-current`
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {saving
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Save size={15} />
            }
            Salvar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function AdminPage({ adminName, onLogout, onBack }: AdminPageProps) {
  const [profiles,    setProfiles]    = useState<Profile[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [tab,         setTab]         = useState<FilterTab>('todos');
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [tick,        setTick]        = useState(0);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);

    // Verifica a sessão ativa
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[AdminPage] Session user:', session?.user?.email, session?.user?.id);

    // Testa a role via RPC
    const { data: myRole, error: roleError } = await supabase.rpc('get_my_role');
    console.log('[AdminPage] get_my_role:', myRole, roleError?.message);

    // Busca os perfis
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, status, active, last_seen_at, created_at')
      .order('name');

    if (error) {
      console.error('[AdminPage] Erro ao buscar perfis:', error.message, error.details, error.hint);
    } else {
      console.log('[AdminPage] Perfis carregados:', data?.length, data);
    }

    if (data) setProfiles(data as Profile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();

    const channel = supabase
      .channel('profiles-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        payload => {
          setProfiles(prev => {
            if (payload.eventType === 'INSERT') {
              return [...prev, payload.new as Profile].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map(p => p.id === payload.new.id ? { ...p, ...(payload.new as Profile) } : p);
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter(p => p.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    const interval = setInterval(() => setTick(t => t + 1), 60_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchProfiles]);

  async function handleSave(id: string, data: Partial<Profile>) {
    const { error } = await supabase
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) console.error('[AdminPage] Erro ao salvar:', error.message);
  }

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || (p.name?.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
    const matchTab =
      tab === 'todos'     ? true :
      tab === 'online'    ? isOnline(p.last_seen_at) && p.status === 'ativo' :
      tab === 'offline'   ? !isOnline(p.last_seen_at) && p.status === 'ativo' :
      tab === 'bloqueado' ? p.status === 'bloqueado' :
      true;
    return matchSearch && matchTab;
  });

  const counts = {
    todos:     profiles.length,
    online:    profiles.filter(p => isOnline(p.last_seen_at) && p.status === 'ativo').length,
    offline:   profiles.filter(p => !isOnline(p.last_seen_at) && p.status === 'ativo').length,
    bloqueado: profiles.filter(p => p.status === 'bloqueado').length,
  };

  const TABS: { key: FilterTab; label: string; icon: React.ReactNode; dotColor: string }[] = [
    { key: 'todos',     label: 'Todos',      icon: <Users size={14} />,     dotColor: 'bg-slate-400'   },
    { key: 'online',    label: 'Online',     icon: <Wifi size={14} />,      dotColor: 'bg-emerald-400' },
    { key: 'offline',   label: 'Offline',    icon: <WifiOff size={14} />,   dotColor: 'bg-slate-300'   },
    { key: 'bloqueado', label: 'Bloqueados', icon: <ShieldOff size={14} />, dotColor: 'bg-red-400'     },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm select-none">N</div>
          <span className="text-lg font-bold text-blue-600 tracking-tight hidden sm:block">
            NPlayer.<span className="text-yellow-400">IA</span>
          </span>
          <span className="text-slate-200 hidden sm:block">/</span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 hidden sm:block">Administrador</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:block">Início</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {adminName?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <span className="text-sm font-semibold text-slate-700">{adminName}</span>
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full text-emerald-600 bg-emerald-100">Admin</span>
          </div>

          <button onClick={onLogout} title="Sair" className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 max-w-5xl mx-auto w-full space-y-5">

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestão de Usuários</h1>
            <p className="text-sm text-slate-400 mt-0.5">Gerencie perfis, acessos e status da equipe em tempo real.</p>
          </div>
          <button
            onClick={fetchProfiles}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all ${
                tab === t.key
                  ? 'bg-white border-blue-500 shadow-sm shadow-blue-100'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={tab === t.key ? 'text-blue-600' : 'text-slate-400'}>{t.icon}</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${tab === t.key ? 'text-blue-600' : 'text-slate-500'}`}>
                  {t.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {t.key === 'online' && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
                <span className={`text-sm font-black ${tab === t.key ? 'text-blue-600' : 'text-slate-500'}`}>
                  {counts[t.key]}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">

          <div className="hidden sm:grid grid-cols-[1fr_1.2fr_120px_100px_100px_44px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100">
            {['Nome', 'Login', 'Perfil', 'Status', 'Presença', ''].map((h, i) => (
              <span key={i} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</span>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-3">
              <Users size={48} strokeWidth={1} />
              <p className="text-sm font-semibold">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              <AnimatePresence initial={false}>
                {filtered.map(profile => {
                  const online    = isOnline(profile.last_seen_at);
                  const statusCfg = STATUS_CONFIG[profile.status] ?? STATUS_CONFIG['inativo'];
                  const roleCfg   = profile.role ? ROLE_CONFIG[profile.role] : null;

                  return (
                    <motion.li
                      key={profile.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Desktop */}
                      <div className="hidden sm:grid grid-cols-[1fr_1.2fr_120px_100px_100px_44px] gap-4 items-center px-5 py-3.5 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-black text-sm">
                              {(profile.name ?? profile.email)[0].toUpperCase()}
                            </div>
                            {online && profile.status === 'ativo' && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                            )}
                          </div>
                          <span className="text-sm font-bold text-slate-800 truncate">
                            {profile.name || <span className="text-slate-300 italic font-normal">Sem nome</span>}
                          </span>
                        </div>

                        <span className="text-xs text-slate-400 font-medium truncate">{profile.email}</span>

                        {roleCfg ? (
                          <span className={`inline-flex w-fit text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${roleCfg.color} ${roleCfg.bg}`}>
                            {roleCfg.label}
                          </span>
                        ) : (
                          <span className="inline-flex w-fit text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full text-amber-600 bg-amber-50">
                            Pendente
                          </span>
                        )}

                        <span className={`inline-flex items-center gap-1 w-fit text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${statusCfg.color} ${statusCfg.bg}`}>
                          {statusCfg.icon}
                          {statusCfg.label}
                        </span>

                        <span className={`text-xs font-semibold ${online && profile.status === 'ativo' ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {profile.status === 'bloqueado' ? '—' : timeAgo(profile.last_seen_at)}
                        </span>

                        <button
                          onClick={() => setEditProfile(profile)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 size={15} />
                        </button>
                      </div>

                      {/* Mobile */}
                      <div className="flex sm:hidden items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-black">
                            {(profile.name ?? profile.email)[0].toUpperCase()}
                          </div>
                          {online && profile.status === 'ativo' && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{profile.name || profile.email}</p>
                          <p className="text-xs text-slate-400 truncate">{profile.email}</p>
                          <div className="flex gap-1.5 mt-1">
                            {roleCfg && (
                              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${roleCfg.color} ${roleCfg.bg}`}>
                                {roleCfg.label}
                              </span>
                            )}
                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${statusCfg.color} ${statusCfg.bg}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => setEditProfile(profile)} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Edit2 size={15} />
                        </button>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}

          {!loading && profiles.length > 0 && (
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">
                {filtered.length} de {profiles.length} usuário{profiles.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tempo real</span>
              </div>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {editProfile && (
          <EditModal
            profile={editProfile}
            onSave={handleSave}
            onClose={() => setEditProfile(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
