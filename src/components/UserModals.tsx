import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, User, Camera, MessageSquare, ChevronRight,
  AlertTriangle, CheckCircle2, Lock,
  LogOut, Mail, Phone, Hash,
  Trash2, Loader2, Sparkles
} from 'lucide-react';

interface UserData {
  email: string;
  name: string;
  matricula?: string;
  telefone?: string;
  avatar?: string;
}

interface UserModalsProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData;
  onUpdateUser: (updatedUser: UserData) => void;
  onLogout: () => void;
}

type ModalView = 'main' | 'edit' | 'password' | 'support' | 'improvements' | 'success';

const DEFAULT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDgdPkiT-wRtOnLWfj51Eko2A8FvPaNGJ9YfKsvfQJI7gKPON-2yvOWFMWgtFmRhEmichfWU3XbAz48qYC0PRqR9_chfQQZ2BbtesGE0Jy7gcgL_Ubv7TuyzPmPQkJg1-suxATPUgyhbrS6jrCV5ctYinBi9YlSQ0J9TMWcR2MOT0ZS54pLxrEOvLR2YzOMy1drxABvrpXtyhhg-aKC6gOd-u74J0RYJcOABpiFEDbcYv2RBPqwT57Mhqjm4adWnR1Li0ygdAc73X4';

const VIEW_TITLES: Record<ModalView, string> = {
  main: 'Meu Perfil',
  edit: 'Editar Cadastro',
  password: 'Segurança',
  support: 'Central de Suporte',
  improvements: 'Sugestão de Melhoria',
  success: 'Enviado!',
};

const MENU_ITEMS = [
  {
    view: 'edit' as ModalView,
    icon: <User size={18} />,
    title: 'Meu Perfil',
    sub: 'Nome, telefone e matrícula',
    iconHover: 'group-hover:bg-primary group-hover:text-white',
    cardHover: 'hover:border-primary/20 hover:bg-primary/[0.02]',
  },
  {
    view: 'password' as ModalView,
    icon: <Lock size={18} />,
    title: 'Segurança & Senha',
    sub: 'Gerencie sua segurança',
    iconHover: 'group-hover:bg-primary group-hover:text-white',
    cardHover: 'hover:border-primary/20 hover:bg-primary/[0.02]',
  },
  {
    view: 'support' as ModalView,
    icon: <MessageSquare size={18} />,
    title: 'Suporte',
    sub: 'Reporte problemas técnicos',
    iconHover: 'group-hover:bg-secondary group-hover:text-primary',
    cardHover: 'hover:border-primary/20 hover:bg-primary/[0.02]',
  },
];

const drawerVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', damping: 28, stiffness: 300 },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

const viewVariants = {
  initial: { x: 24, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
  exit: { x: -24, opacity: 0, transition: { duration: 0.15 } },
};

export function UserModals({ isOpen, onClose, user, onUpdateUser, onLogout }: UserModalsProps) {
  const [view, setView] = useState<ModalView>('main');
  const [editData, setEditData] = useState<UserData>(user);
  const [supportData, setSupportData] = useState({ subject: '', category: 'bug', description: '' });
  const [improvementData, setImprovementData] = useState({ title: '', area: 'captacao', description: '' });
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubView = ['edit', 'password', 'support', 'improvements'].includes(view);

  // Trava scroll do body quando drawer abre
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Fecha com Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      isSubView ? setView('main') : onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, isSubView, onClose]);

  // Reset completo ao abrir
  useEffect(() => {
    if (!isOpen) return;
    setView('main');
    setEditData(user);
    setAvatarPreview(null);
    setSupportData({ subject: '', category: 'bug', description: '' });
    setImprovementData({ title: '', area: 'captacao', description: '' });
    setPasswordData({ current: '', new: '', confirm: '' });
    setPasswordError('');
  }, [isOpen, user]);

  // ── Handlers ──────────────────────────────────────────────

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      onUpdateUser({ ...editData, avatar: avatarPreview || user.avatar });
      setIsSaving(false);
      setView('main');
    }, 800);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (passwordData.new.length < 8) {
      setPasswordError('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (!/[a-zA-Z]/.test(passwordData.new) || !/[0-9]/.test(passwordData.new)) {
      setPasswordError('A senha deve conter letras e números.');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('As senhas não coincidem.');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setPasswordData({ current: '', new: '', confirm: '' });
      setView('main');
    }, 1000);
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setView('success');
    setTimeout(onClose, 3000);
  };

  const handleImprovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setView('success');
    setTimeout(onClose, 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    onUpdateUser({ ...user, avatar: undefined });
  };

  // ── Completion ────────────────────────────────────────────

  const completion = (() => {
    const fields = ['name', 'email', 'matricula', 'telefone', 'avatar'];
    const filled = fields.filter(f => !!(user as Record<string, unknown>)[f]).length;
    return Math.round((filled / fields.length) * 100);
  })();

  // ── Render ────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-primary/20 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={VIEW_TITLES[view]}
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 bottom-0 z-[201] w-full max-w-[420px] bg-white shadow-2xl flex flex-col overflow-hidden"
            style={{ borderRadius: '24px 0 0 24px' }}
          >
            {/* Header */}
            <div className="px-6 py-5 flex justify-between items-center bg-white border-b border-slate-50 sticky top-0 z-20 shrink-0">
              <div className="flex items-center gap-3">
                {isSubView && (
                  <button
                    onClick={() => setView('main')}
                    aria-label="Voltar"
                    className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
                  >
                    <ChevronRight className="rotate-180 text-primary" size={20} />
                  </button>
                )}
                <h2 className="text-base font-bold text-primary tracking-tight">
                  {VIEW_TITLES[view]}
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors group"
              >
                <X size={18} className="text-slate-400 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">

                {/* ── MAIN ── */}
                {view === 'main' && (
                  <motion.div key="main" variants={viewVariants} initial="initial" animate="animate" exit="exit" className="p-6 space-y-6">

                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-4 pt-2">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-[28px] overflow-hidden border-4 border-white shadow-xl bg-slate-100 group-hover:scale-[1.02] transition-transform duration-500">
                          <img
                            src={avatarPreview || user.avatar || DEFAULT_AVATAR}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 flex gap-1.5">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            aria-label="Alterar foto"
                            className="p-2 bg-primary text-white rounded-xl shadow-lg hover:bg-secondary hover:text-primary transition-all active:scale-95 border-2 border-white"
                          >
                            <Camera size={14} />
                          </button>
                          {(avatarPreview || user.avatar) && (
                            <button
                              onClick={removeAvatar}
                              aria-label="Remover foto"
                              className="p-2 bg-white text-red-500 rounded-xl shadow-lg hover:bg-red-50 transition-all active:scale-95 border-2 border-white"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                          accept="image/*"
                        />
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-headline font-bold text-primary tracking-tight">{user.name}</h3>
                        <p className="text-sm text-slate-500 font-medium flex items-center justify-center gap-1.5 mt-0.5">
                          <Mail size={12} className="text-slate-300" aria-hidden="true" />
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Progresso */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progresso do Perfil</span>
                        <span className={`text-xs font-bold ${completion === 100 ? 'text-green-500' : 'text-primary'}`}>{completion}%</span>
                      </div>
                      <div
                        className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={completion}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${completion}%` }}
                          transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className={`h-full ${completion === 100 ? 'bg-green-500' : 'bg-primary'}`}
                        />
                      </div>
                      {completion < 100 && (
                        <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                          Complete todos os campos para o selo de perfil verificado! 🏆
                        </p>
                      )}
                    </div>

                    {/* Menu */}
                    <nav className="space-y-2" aria-label="Menu do perfil">
                      {MENU_ITEMS.map(item => (
                        <button
                          key={item.view}
                          onClick={() => setView(item.view)}
                          className={`w-full flex items-center justify-between p-4 bg-white border border-slate-100 ${item.cardHover} rounded-2xl transition-all group`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl ${item.iconHover} transition-colors text-slate-400`}>
                              {item.icon}
                            </div>
                            <div className="text-left">
                              <span className="block text-sm font-bold text-primary">{item.title}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{item.sub}</span>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                        </button>
                      ))}

                      {/* Melhorias */}
                      <button
                        onClick={() => setView('improvements')}
                        className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 hover:border-secondary/40 hover:bg-secondary/5 rounded-2xl transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center bg-secondary/10 rounded-xl group-hover:bg-secondary transition-colors text-primary">
                            <Sparkles size={18} />
                          </div>
                          <div className="text-left">
                            <span className="block text-sm font-bold text-primary">Melhorias</span>
                            <span className="text-[10px] text-slate-400 font-medium">Sugira novas funcionalidades</span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                      </button>

                      {/* Logout */}
                      <div className="pt-1">
                        <button
                          onClick={() => { if (window.confirm('Deseja realmente sair?')) onLogout(); }}
                          className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 hover:border-red-100 hover:bg-red-50 rounded-2xl transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-400 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors">
                              <LogOut size={18} />
                            </div>
                            <div className="text-left">
                              <span className="block text-sm font-bold text-red-500 group-hover:text-red-600">Sair</span>
                              <span className="text-[10px] text-red-300/80 font-medium">Encerrar sessão com segurança</span>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-red-200 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                        </button>
                      </div>
                    </nav>
                  </motion.div>
                )}

                {/* ── EDIT ── */}
                {view === 'edit' && (
                  <motion.div key="edit" variants={viewVariants} initial="initial" animate="animate" exit="exit" className="p-6 space-y-5">
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-2xl">
                      <div className="relative shrink-0">
                        <img
                          src={avatarPreview || user.avatar || DEFAULT_AVATAR}
                          alt="Preview do avatar"
                          className="w-12 h-12 rounded-xl object-cover bg-white shadow-sm"
                        />
                        {avatarPreview && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest block mb-0.5">Preview</span>
                        <span className="text-xs font-bold text-primary">
                          {avatarPreview ? 'Nova foto selecionada — salve para aplicar' : 'Alterações pendentes de salvamento'}
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4" noValidate>
                      <div className="space-y-1">
                        <label htmlFor="edit-name" className="text-[11px] font-bold text-slate-400 uppercase ml-1">Nome Completo</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30" size={16} aria-hidden="true" />
                          <input
                            id="edit-name"
                            type="text"
                            value={editData.name}
                            onChange={e => setEditData({ ...editData, name: e.target.value })}
                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3.5 pl-11 pr-4 focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/10 transition-all font-bold text-primary text-sm"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label htmlFor="edit-matricula" className="text-[11px] font-bold text-slate-400 uppercase ml-1">Matrícula</label>
                          <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30" size={16} aria-hidden="true" />
                            <input
                              id="edit-matricula"
                              type="text"
                              value={editData.matricula || ''}
                              onChange={e => setEditData({ ...editData, matricula: e.target.value })}
                              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3.5 pl-11 pr-4 focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/10 transition-all font-bold text-primary text-sm"
                              placeholder="000000"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="edit-telefone" className="text-[11px] font-bold text-slate-400 uppercase ml-1">Telefone</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30" size={16} aria-hidden="true" />
                            <input
                              id="edit-telefone"
                              type="tel"
                              value={editData.telefone || ''}
                              onChange={e => setEditData({ ...editData, telefone: e.target.value })}
                              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3.5 pl-11 pr-4 focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/10 transition-all font-bold text-primary text-sm"
                              placeholder="(41) 9..."
                            />
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setView('main')}
                          className="flex-1 py-3.5 text-sm font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="flex-[2] bg-primary text-white py-3.5 text-sm font-bold rounded-2xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Dados'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* ── PASSWORD ── */}
                {view === 'password' && (
                  <motion.div key="password" variants={viewVariants} initial="initial" animate="animate" exit="exit" className="p-6 space-y-5">
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                      <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} aria-hidden="true" />
                      <p className="text-xs font-medium text-amber-700">
                        Por segurança, sua nova senha deve conter pelo menos 8 caracteres, incluindo letras e números.
                      </p>
                    </div>

                    {passwordError && (
                      <div role="alert" className="p-3 bg-red-50 rounded-2xl border border-red-100 flex gap-2 items-center">
                        <AlertTriangle className="text-red-400 shrink-0" size={15} aria-hidden="true" />
                        <p className="text-xs font-semibold text-red-600">{passwordError}</p>
                      </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-4" noValidate>
                      {(
                        [
                          { label: 'Senha Atual', key: 'current', autoComplete: 'current-password' },
                          { label: 'Nova Senha', key: 'new', autoComplete: 'new-password' },
                          { label: 'Confirmar Senha', key: 'confirm', autoComplete: 'new-password' },
                        ] as { label: string; key: keyof typeof passwordData; autoComplete: string }[]
                      ).map(({ label, key, autoComplete }) => (
                        <div key={key} className="space-y-1">
                          <label htmlFor={`pwd-${key}`} className="text-[11px] font-bold text-slate-400 uppercase ml-1">{label}</label>
                          <input
                            id={`pwd-${key}`}
                            type="password"
                            value={passwordData[key]}
                            autoComplete={autoComplete}
                            onChange={e => {
                              setPasswordError('');
                              setPasswordData({ ...passwordData, [key]: e.target.value });
                            }}
                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3.5 px-5 focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/10 transition-all font-bold text-primary text-sm"
                            required
                          />
                        </div>
                      ))}
                      <div className="pt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setView('main')}
                          className="flex-1 py-3.5 text-sm font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                        >
                          Voltar
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="flex-[2] bg-primary text-white py-3.5 text-sm font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Atualizar Senha'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* ── SUPPORT ── */}
                {view === 'support' && (
                  <motion.div key="support" variants={viewVariants} initial="initial" animate="animate" exit="exit" className="p-6 space-y-5">
                    <div className="p-3 bg-red-50 rounded-2xl border border-red-100 flex gap-3 items-center">
                      <AlertTriangle className="text-red-400 shrink-0" size={16} aria-hidden="true" />
                      <p className="text-xs font-medium text-red-600">Use para relatar bugs, erros ou problemas no sistema.</p>
                    </div>
                    <form onSubmit={handleSupportSubmit} className="space-y-4" noValidate>
                      <div className="space-y-1">
                        <label htmlFor="support-subject" className="text-[11px] font-bold text-slate-400 uppercase ml-1">Assunto</label>
                        <input
                          id="support-subject"
                          type="text"
                          value={supportData.subject}
                          onChange={e => setSupportData({ ...supportData, subject: e.target.value })}
                          placeholder="Descreva o problema brevemente"
                          className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3.5 px-5 focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/10 transition-all font-bold text-primary text-sm"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Tipo de Problema</label>
                        <div role="group" aria-label="Tipo de problema" className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'bug', label: '🐛 Bug / Erro' },
                            { value: 'acesso', label: '🔐 Acesso' },
                            { value: 'dados', label: '📊 Dados' },
                            { value: 'outro', label: '❓ Outro' },
                          ].map(({ value, label }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setSupportData({ ...supportData, category: value })}
                              aria-pressed={supportData.category === value}
                              className={`py-3 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                                supportData.category === value
                                  ? 'border-primary bg-primary/5 text-primary'
                                  : 'border-slate-100 text-slate-400 hover:border-slate-200'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between ml-1">
                          <label htmlFor="support-desc" className="text-[11px] font-bold text-slate-400 uppercase">Descrição Detalhada</label>
                          <span className="text-[10px] font-bold text-primary/40" aria-live="polite">{supportData.description.length}/3000</span>
                        </div>
                        <textarea
                          id="support-desc"
                          value={supportData.description}
                          onChange={e => setSupportData({ ...supportData, description: e.target.value.slice(0, 3000) })}
                          placeholder="Descreva o problema com o máximo de detalhes possível..."
                          className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3.5 px-5 focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/10 transition-all min-h-[130px] resize-none font-medium text-sm"
                          required
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setView('main')}
                          className="flex-1 py-3.5 text-sm font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                        >
                          Voltar
                        </button>
                        <button
                          type="submit"
                          className="flex-[2] bg-primary text-white py-3.5 text-sm font-bold rounded-2xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <MessageSquare size={16} aria-hidden="true" /> Enviar Suporte
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* ── IMPROVEMENTS ── */}
                {view === 'improvements' && (
                  <motion.div key="improvements" variants={viewVariants} initial="initial" animate="animate" exit="exit" className="p-6 space-y-5">
                    <div className="p-3 bg-secondary/10 rounded-2xl border border-secondary/20 flex gap-3 items-center">
                      <Sparkles className="text-primary shrink-0" size={16} aria-hidden="true" />
                      <p className="text-xs font-medium text-primary/80">Suas ideias constroem o Príncipe. Compartilhe o que podemos melhorar!</p>
                    </div>
                    <form onSubmit={handleImprovementSubmit} className="space-y-4" noValidate>
                      <div className="space-y-1">
                        <label htmlFor="imp-title" className="text-[11px] font-bold text-slate-400 uppercase ml-1">Título da Sugestão</label>
                        <input
                          id="imp-title"
                          type="text"
                          value={improvementData.title}
                          onChange={e => setImprovementData({ ...improvementData, title: e.target.value })}
                          placeholder="Ex: Filtro por período no relatório"
                          className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3.5 px-5 focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/10 transition-all font-bold text-primary text-sm"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Área do Sistema</label>
                        <div role="group" aria-label="Área do sistema" className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'captacao', label: '📋 Captação' },
                            { value: 'relatorios', label: '📊 Relatórios' },
                            { value: 'interface', label: '🎨 Interface' },
                            { value: 'outro', label: '💡 Outro' },
                          ].map(({ value, label }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setImprovementData({ ...improvementData, area: value })}
                              aria-pressed={improvementData.area === value}
                              className={`py-3 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                                improvementData.area === value
                                  ? 'border-secondary bg-secondary/10 text-primary'
                                  : 'border-slate-100 text-slate-400 hover:border-slate-200'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between ml-1">
                          <label htmlFor="imp-desc" className="text-[11px] font-bold text-slate-400 uppercase">Descreva sua ideia</label>
                          <span className="text-[10px] font-bold text-primary/40" aria-live="polite">{improvementData.description.length}/2000</span>
                        </div>
                        <textarea
                          id="imp-desc"
                          value={improvementData.description}
                          onChange={e => setImprovementData({ ...improvementData, description: e.target.value.slice(0, 2000) })}
                          placeholder="Como essa melhoria ajudaria no dia a dia? Seja específico!"
                          className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3.5 px-5 focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/10 transition-all min-h-[130px] resize-none font-medium text-sm"
                          required
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setView('main')}
                          className="flex-1 py-3.5 text-sm font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                        >
                          Voltar
                        </button>
                        <button
                          type="submit"
                          className="flex-[2] bg-secondary text-primary py-3.5 text-sm font-bold rounded-2xl shadow-lg shadow-secondary/20 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Sparkles size={16} aria-hidden="true" /> Enviar Sugestão
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* ── SUCCESS ── */}
                {view === 'success' && (
                  <motion.div key="success" variants={viewVariants} initial="initial" animate="animate" exit="exit" className="p-12 flex flex-col items-center text-center space-y-6">
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', damping: 10 }}
                      className="w-24 h-24 bg-green-500 text-white rounded-[32px] flex items-center justify-center shadow-2xl shadow-green-100 relative"
                      aria-hidden="true"
                    >
                      <CheckCircle2 size={48} />
                      <div className="absolute inset-0 bg-white/20 rounded-[32px] animate-pulse" />
                    </motion.div>
                    <div className="space-y-2" role="status" aria-live="polite">
                      <h3 className="text-2xl font-headline font-bold text-primary">Enviado com sucesso!</h3>
                      <p className="text-sm text-slate-500 font-medium max-w-[260px] mx-auto">
                        Nossa equipe recebeu sua mensagem e vai analisá-la em breve.
                      </p>
                    </div>
                    <div className="w-full max-w-xs h-1.5 bg-slate-100 rounded-full overflow-hidden" aria-hidden="true">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3, ease: 'linear' }}
                        className="h-full bg-green-500"
                      />
                    </div>
                    <p className="text-xs text-slate-400">Fechando automaticamente...</p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50/60 border-t border-slate-50 flex justify-between items-center shrink-0">
              <div className="flex gap-1" aria-hidden="true">
                {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-primary/20" />)}
              </div>
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                Hospital Pequeno Príncipe • 2026
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
