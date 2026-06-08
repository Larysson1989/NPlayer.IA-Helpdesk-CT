import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, LogOut, Mail, Phone, MapPin, Calendar,
  Hash, Briefcase, Building2, CalendarCheck, ShieldCheck,
  UserCog, Edit2, KeyRound, Download, UserX, TrendingUp,
  CheckCircle2, X, Save, AlertTriangle,
  UserCheck, Loader2, Eye, EyeOff,
} from 'lucide-react';
import { UserAvatar } from '../components/UserAvatar';
import { supabase } from '../lib/supabase';
import { updateUserActive } from '../lib/auth';
import type { User, UserRole } from '../App';

interface UserProfilePageProps {
  profileUser:  User;
  adminName:    string;
  adminRole:    UserRole;
  onBack:       () => void;
  onLogout:     () => void;
  onUserUpdate?: (updated: User) => void;
}

const ROLE_META: Record<UserRole, { label: string; color: string; bg: string }> = {
  captador:      { label: 'Captador',      color: 'text-blue-700',    bg: 'bg-blue-50'    },
  supervisor:    { label: 'Supervisor',    color: 'text-purple-700',  bg: 'bg-purple-50'  },
  administrador: { label: 'Administrador', color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

const CARGO_BY_ROLE: Record<UserRole, string> = {
  captador:      'Captador Pleno',
  supervisor:    'Supervisor de Equipe',
  administrador: 'Administrador do Sistema',
};

const DEPT_BY_ROLE: Record<UserRole, string> = {
  captador:      'Captação de Recursos',
  supervisor:    'Gestão de Equipes',
  administrador: 'Tecnologia da Informação',
};

function RoleIcon({ role }: { role: UserRole }) {
  if (role === 'captador') return <UserCog size={16} />;
  return <ShieldCheck size={16} />;
}

function InfoField({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
        {icon}{label}
      </p>
      <div className="text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1,    opacity: 1, y: 0  }}
          exit   ={{ scale: 0.95, opacity: 0, y: 10 }}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-black text-slate-800">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X size={16} />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold ${
        type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
      }`}
    >
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      {msg}
    </motion.div>
  );
}

export function UserProfilePage({
  profileUser, adminName, adminRole, onBack, onLogout, onUserUpdate,
}: UserProfilePageProps) {
  const [user, setUser]               = useState<User>(profileUser);
  const role                          = user.role ?? 'captador';
  const roleMeta                      = ROLE_META[role];
  const handleBase                    = user.name.split(' ')[0].toLowerCase();
  const handle                        = `@${handleBase}_${role}`;

  const [modal, setModal]             = useState<'edit' | 'senha' | 'desativar' | null>(null);
  const closeModal                    = () => setModal(null);

  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [saving, setSaving]           = useState(false);

  // ── Editar Dados ──────────────────────────────────────────────────────────
  const [editName,     setEditName]   = useState(user.name);
  const [editEmail,    setEditEmail]  = useState(user.email);
  const [editTelefone, setEditTel]    = useState(user.telefone ?? '');
  const [editRole,     setEditRole]   = useState<UserRole>(role);

  const openEdit = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditTel(user.telefone ?? '');
    setEditRole(role);
    setModal('edit');
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    const updates: Record<string, unknown> = {};
    if (editName.trim()   !== user.name)            updates.name     = editName.trim();
    if (editEmail.trim()  !== user.email)           updates.email    = editEmail.trim().toLowerCase();
    if (editTelefone      !== (user.telefone ?? '')) updates.telefone = editTelefone.trim();
    if (editRole          !== role)                 updates.role     = editRole;

    if (Object.keys(updates).length === 0) { closeModal(); setSaving(false); return; }

    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    setSaving(false);
    if (error) { showToast('Erro ao salvar alterações.', 'error'); return; }

    const updated: User = {
      ...user,
      name:     (updates.name     as string)   ?? user.name,
      email:    (updates.email    as string)   ?? user.email,
      telefone: (updates.telefone as string)   ?? user.telefone,
      role:     (updates.role     as UserRole) ?? user.role,
    };
    setUser(updated);
    onUserUpdate?.(updated);
    closeModal();
    showToast('Dados atualizados com sucesso!');
  };

  // ── Modal Senha — abas ────────────────────────────────────────────────────
  const [senhaAba,      setSenhaAba]      = useState<'email' | 'definir'>('email');
  const [novaSenha,     setNovaSenha]     = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showNova,      setShowNova]      = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const openSenha = () => {
    setSenhaAba('email');
    setNovaSenha('');
    setConfirmarSenha('');
    setShowNova(false);
    setShowConfirmar(false);
    setModal('senha');
  };

  // Aba 1 — enviar e-mail de redefinição
  const handleResetSenha = async () => {
    setSaving(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    setSaving(false);
    if (error) {
      console.error('[resetPassword]', error);
      showToast(`Erro: ${error.message}`, 'error');
      return;
    }
    closeModal();
    showToast(`E-mail de redefinição enviado para ${user.email}`);
  };

  // Aba 2 — definir nova senha diretamente (Admin API)
  const handleDefinirSenha = async () => {
    if (novaSenha.length < 6) {
      showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      showToast('As senhas não conferem.', 'error');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password: novaSenha });
    setSaving(false);
    if (error) {
      console.error('[definirSenha]', error);
      showToast(`Erro: ${error.message}`, 'error');
      return;
    }
    closeModal();
    showToast('Nova senha definida com sucesso!');
  };

  // ── Exportar Histórico ────────────────────────────────────────────────────
  const handleExportar = () => {
    const rows = [
      ['Campo', 'Valor'],
      ['Nome',            user.name],
      ['E-mail',          user.email],
      ['Matrícula',       user.matricula ?? '-'],
      ['Cargo',           CARGO_BY_ROLE[role]],
      ['Departamento',    DEPT_BY_ROLE[role]],
      ['Nível de Acesso', roleMeta.label],
      ['Telefone',        user.telefone ?? '-'],
      ['Status',          user.active ? 'Ativo' : 'Inativo'],
      ['Exportado em',    new Date().toLocaleString('pt-BR')],
    ];
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `historico_${user.name.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Histórico exportado!');
  };

  // ── Desativar / Reativar ──────────────────────────────────────────────────
  const handleToggleAtivo = async () => {
    setSaving(true);
    const ok = await updateUserActive(user.id, !user.active);
    setSaving(false);
    if (!ok) { showToast('Erro ao atualizar status.', 'error'); return; }
    const updated = { ...user, active: !user.active };
    setUser(updated);
    onUserUpdate?.(updated);
    closeModal();
    showToast(updated.active ? 'Conta reativada com sucesso!' : 'Conta desativada.');
  };

  const perf = { captacoes: 124, captacoesDelta: '+12%', conversao: 68, conversaoDelta: '+5%', auditorias: 12 };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* TOAST */}
      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>

      {/* MODAL EDITAR DADOS */}
      {modal === 'edit' && (
        <Modal title="Editar Dados" onClose={closeModal}>
          <div className="flex flex-col gap-4">
            {([
              { label: 'Nome completo', val: editName,     set: setEditName,  type: 'text'  },
              { label: 'E-mail',        val: editEmail,    set: setEditEmail, type: 'email' },
              { label: 'Telefone',      val: editTelefone, set: setEditTel,   type: 'tel'   },
            ] as { label: string; val: string; set: (v: string) => void; type: string }[]).map(f => (
              <div key={f.label}>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{f.label}</label>
                <input
                  type={f.type}
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nível de Acesso</label>
              <select
                value={editRole}
                onChange={e => setEditRole(e.target.value as UserRole)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="captador">Captador</option>
                <option value="supervisor">Supervisor</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3 rounded-2xl hover:bg-slate-800 transition disabled:opacity-60 mt-1"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL SENHA (2 ABAS) */}
      {modal === 'senha' && (
        <Modal title="Gerenciar Senha" onClose={closeModal}>
          {/* Abas */}
          <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 mb-5">
            <button
              onClick={() => setSenhaAba('email')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl transition-all ${
                senhaAba === 'email'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Mail size={13} /> Enviar E-mail
            </button>
            <button
              onClick={() => setSenhaAba('definir')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl transition-all ${
                senhaAba === 'definir'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <KeyRound size={13} /> Definir Nova Senha
            </button>
          </div>

          {/* Aba: Enviar E-mail */}
          {senhaAba === 'email' && (
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Será enviado um e-mail de redefinição para:
                </p>
                <p className="text-sm font-black text-slate-900 mt-1 break-all">{user.email}</p>
                <p className="text-xs text-slate-400 mt-2">
                  O usuário receberá um link para criar uma nova senha.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={closeModal}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                  Cancelar
                </button>
                <button
                  onClick={handleResetSenha}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3 rounded-2xl hover:bg-slate-800 transition disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  {saving ? 'Enviando...' : 'Enviar E-mail'}
                </button>
              </div>
            </div>
          )}

          {/* Aba: Definir Nova Senha */}
          {senhaAba === 'definir' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-3">
                <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 font-medium">
                  A nova senha será aplicada imediatamente. O usuário será desconectado em outras sessões.
                </p>
              </div>

              {/* Campo Nova Senha */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showNova ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNova(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showNova ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Campo Confirmar Senha */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirmar ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={e => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmar(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showConfirmar ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmarSenha && novaSenha !== confirmarSenha && (
                  <p className="text-xs text-red-500 font-semibold mt-1">As senhas não conferem.</p>
                )}
              </div>

              <div className="flex gap-3 mt-1">
                <button onClick={closeModal}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                  Cancelar
                </button>
                <button
                  onClick={handleDefinirSenha}
                  disabled={saving || !novaSenha || novaSenha !== confirmarSenha}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3 rounded-2xl hover:bg-slate-800 transition disabled:opacity-40"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  {saving ? 'Salvando...' : 'Definir Senha'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* MODAL DESATIVAR / REATIVAR */}
      {modal === 'desativar' && (
        <Modal title={user.active ? 'Desativar Conta' : 'Reativar Conta'} onClose={closeModal}>
          <div className="flex flex-col items-center text-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
              user.active ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {user.active ? <UserX size={24} /> : <UserCheck size={24} />}
            </div>
            <div>
              <p className="font-bold text-slate-800">
                {user.active ? 'Desativar' : 'Reativar'} {user.name}?
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {user.active
                  ? 'O usuário perderá o acesso ao sistema imediatamente.'
                  : 'O usuário voltará a ter acesso ao sistema.'
                }
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={closeModal}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                Cancelar
              </button>
              <button
                onClick={handleToggleAtivo}
                disabled={saving}
                className={`flex-1 py-3 rounded-2xl text-sm font-bold text-white transition disabled:opacity-60 flex items-center justify-center gap-2 ${
                  user.active ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                {user.active ? 'Sim, desativar' : 'Sim, reativar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

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
          <span className="text-slate-200 hidden sm:block">/</span>
          <span className="text-xs font-semibold text-slate-500 hidden sm:block">Perfil do Usuário</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:block">Voltar</span>
          </button>
          <button onClick={onLogout} title="Sair"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 max-w-screen-xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">

          {/* COLUNA ESQUERDA */}
          <div className="flex flex-col gap-4">

            {/* Card identidade */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center gap-3">
              <div className="relative">
                <UserAvatar
                  name={user.name}
                  avatarUrl={user.avatar_url ?? user.avatar ?? null}
                  size="xl"
                  className="border-4 border-white shadow-md"
                />
                <button
                  onClick={openEdit}
                  className="absolute bottom-0.5 right-0.5 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors"
                  title="Editar dados"
                >
                  <Edit2 size={13} />
                </button>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 leading-snug">{user.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{handle}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                user.active
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-red-500 bg-red-50 border-red-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                {user.active ? 'Ativo' : 'Inativo'}
              </span>
            </motion.div>

            {/* Nível de acesso */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className={`${roleMeta.bg} rounded-3xl p-4 flex items-center justify-between border border-slate-100`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nível de Acesso</p>
                <p className={`text-base font-black uppercase tracking-wider mt-0.5 ${roleMeta.color}`}>{roleMeta.label}</p>
              </div>
              <span className={roleMeta.color}><RoleIcon role={role} /></span>
            </motion.div>

            {/* Botões de ação */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="flex flex-col gap-2">

              <button onClick={openEdit}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all bg-slate-900 text-white hover:bg-slate-800">
                <Edit2 size={15} /> Editar Dados
              </button>

              <button onClick={openSenha}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50">
                <KeyRound size={15} /> Gerenciar Senha
              </button>

              <button onClick={handleExportar}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50">
                <Download size={15} /> Exportar Histórico
              </button>

              <button
                onClick={() => setModal('desativar')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all border ${
                  user.active
                    ? 'bg-white border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300'
                    : 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300'
                }`}
              >
                {user.active ? <UserX size={15} /> : <UserCheck size={15} />}
                {user.active ? 'Desativar Conta' : 'Reativar Conta'}
              </button>
            </motion.div>
          </div>

          {/* COLUNA DIREITA */}
          <div className="flex flex-col gap-4">

            {/* Informações Básicas */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                <Mail size={13} /> Informações Básicas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoField label="E-mail Institucional" icon={<Mail size={11} />}
                  value={<a href={`mailto:${user.email}`} className="text-blue-600 hover:underline break-all">{user.email}</a>} />
                <InfoField label="Celular" icon={<Phone size={11} />}
                  value={user.telefone
                    ? <a href={`tel:${user.telefone}`} className="text-blue-600 hover:underline">{user.telefone}</a>
                    : <span className="text-slate-300 italic font-normal">Não informado</span>} />
                <InfoField label="Data de Nascimento" icon={<Calendar size={11} />}
                  value={<span className="text-slate-300 italic font-normal">Não informado</span>} />
                <InfoField label="Localização" icon={<MapPin size={11} />}
                  value={<span className="text-slate-300 italic font-normal">Não informado</span>} />
              </div>
            </motion.div>

            {/* Dados Profissionais */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                <Briefcase size={13} /> Dados Profissionais
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoField label="Matrícula" icon={<Hash size={11} />}
                  value={user.matricula
                    ? <span className="font-black text-slate-900">#{user.matricula}</span>
                    : <span className="text-slate-300 italic font-normal">-</span>} />
                <InfoField label="Cargo"          icon={<Briefcase size={11} />} value={CARGO_BY_ROLE[role]} />
                <InfoField label="Departamento"   icon={<Building2 size={11} />} value={DEPT_BY_ROLE[role]} />
                <InfoField label="Data de Início" icon={<CalendarCheck size={11} />}
                  value={<span className="text-slate-300 italic font-normal">Não informado</span>} />
              </div>
            </motion.div>

            {/* Desempenho Recente */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="bg-slate-900 rounded-3xl p-6 text-white">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <TrendingUp size={13} /> Desempenho Recente
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold">Últimos 30 dias</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800 rounded-2xl p-4">
                  <p className="text-xs text-slate-400 font-semibold mb-1">Captações</p>
                  <p className="text-3xl font-black tabular-nums">{perf.captacoes}</p>
                  <p className="text-xs text-emerald-400 font-bold mt-1 flex items-center gap-1"><TrendingUp size={11}/>{perf.captacoesDelta}</p>
                </div>
                <div className="bg-slate-800 rounded-2xl p-4">
                  <p className="text-xs text-slate-400 font-semibold mb-1">Conversão</p>
                  <p className="text-3xl font-black tabular-nums">{perf.conversao}%</p>
                  <p className="text-xs text-emerald-400 font-bold mt-1 flex items-center gap-1"><TrendingUp size={11}/>{perf.conversaoDelta}</p>
                </div>
                <div className="bg-slate-800 rounded-2xl p-4">
                  <p className="text-xs text-slate-400 font-semibold mb-1">Auditorias</p>
                  <p className="text-3xl font-black tabular-nums">{perf.auditorias}</p>
                  <p className="text-xs text-emerald-400 font-bold mt-1 flex items-center gap-1"><CheckCircle2 size={11}/>Meta ok</p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </main>
    </div>
  );
}
