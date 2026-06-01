import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, LogOut, Eye, EyeOff, Save,
  Camera, User, Lock, ShieldCheck,
} from 'lucide-react';
import { updateUser } from '../lib/auth';
import { uploadAvatar, saveAvatarUrl } from '../services/avatarService';
import { UserAvatar } from '../components/UserAvatar';
import type { UserRole } from '../App';

interface SettingsPageProps {
  userEmail:    string;
  userName:     string;
  userRole:     UserRole;
  userMatricula: string;
  avatarUrl?:   string | null;
  onLogout:     () => void;
  onBack:       () => void;
  onAvatarChange?: (url: string) => void;
}

const ROLE_LABEL: Record<UserRole, string> = {
  captador:      'Captador',
  supervisor:    'Supervisor',
  administrador: 'Administrador',
};

const ROLE_COLOR: Record<UserRole, string> = {
  captador:      'text-blue-600 bg-blue-50',
  supervisor:    'text-purple-600 bg-purple-50',
  administrador: 'text-emerald-700 bg-emerald-50',
};

export function SettingsPage({
  userEmail,
  userName,
  userRole,
  userMatricula,
  avatarUrl: initialAvatar,
  onLogout,
  onBack,
  onAvatarChange,
}: SettingsPageProps) {
  const [name,        setName]        = useState(userName);
  const [password,    setPassword]    = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(initialAvatar ?? null);
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const url = await uploadAvatar(userEmail, file);
    if (url) {
      await saveAvatarUrl(userEmail, url);
      setAvatarUrl(url);
      onAvatarChange?.(url);
    } else {
      setError('Falha ao enviar a foto. Tente novamente.');
    }
    setUploading(false);
  }

  async function handleSave() {
    setError('');
    if (password && password !== confirmPass) {
      setError('As senhas nao coincidem.');
      return;
    }
    if (password && password.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    setSaving(true);
    const updates: Record<string, string> = { name };
    if (password) updates.password = password;
    updateUser(userEmail, updates);
    setSaving(false);
    setSaved(true);
    setPassword('');
    setConfirmPass('');
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm select-none">N</div>
          <span className="text-lg font-bold text-blue-600 tracking-tight hidden sm:block">
            NPlayer.<span className="text-yellow-400">IA</span>
          </span>
          <span className="text-slate-200 hidden sm:block">/</span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 hidden sm:block">Configuracoes</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:block">Inicio</span>
          </button>
          <button onClick={onLogout} title="Sair"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-8 py-8 max-w-2xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Minha Conta</h1>
          <p className="text-sm text-slate-400 mt-0.5">Atualize seu nome, foto e senha.</p>
        </div>

        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex items-center gap-5"
        >
          <div className="relative">
            <UserAvatar name={name || userName} avatarUrl={avatarUrl} size="lg" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-700 transition-colors disabled:opacity-60"
              title="Trocar foto"
            >
              {uploading
                ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera size={13} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="font-bold text-slate-800">{name || userName}</p>
            <p className="text-xs text-slate-400 mt-0.5">{userEmail}</p>
            <span className={`inline-block mt-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${ROLE_COLOR[userRole]}`}>
              {ROLE_LABEL[userRole]}
            </span>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="ml-auto text-xs font-bold text-blue-600 hover:underline disabled:opacity-50"
          >
            {uploading ? 'Enviando...' : 'Trocar foto'}
          </button>
        </motion.div>

        {/* Dados pessoais */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <User size={15} className="text-slate-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Dados pessoais</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Nome completo</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">E-mail (login)</label>
              <input type="text" value={userEmail} readOnly
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-400 outline-none cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Matricula</label>
              <input type="text" value={userMatricula} readOnly
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-400 outline-none cursor-not-allowed" />
            </div>
          </div>
        </motion.div>

        {/* Alterar senha */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Lock size={15} className="text-slate-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Alterar senha</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Nova senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Deixe em branco para nao alterar"
                  className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Confirmar nova senha</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Perfil (somente leitura) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.15 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <ShieldCheck size={15} className="text-slate-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Perfil de acesso</h2>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs text-slate-400 mb-3">Seu nivel de acesso e definido pelo administrador.</p>
            <span className={`inline-flex text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${ROLE_COLOR[userRole]}`}>
              {ROLE_LABEL[userRole]}
            </span>
          </div>
        </motion.div>

        {/* Erro */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm font-semibold text-red-600"
          >
            {error}
          </motion.div>
        )}

        {/* Botao salvar */}
        <div className="pb-8">
          <button onClick={handleSave} disabled={saving || uploading}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-sm shadow-blue-200">
            {saving
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : saved
                ? <><ShieldCheck size={16} /> Salvo com sucesso!</>
                : <><Save size={15} /> Salvar alteracoes</>}
          </button>
        </div>
      </main>
    </div>
  );
}