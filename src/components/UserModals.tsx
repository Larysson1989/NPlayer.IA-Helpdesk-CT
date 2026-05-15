import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, User, Camera, MessageSquare, ChevronRight,
  Lock, LogOut, Mail, Trash2, Sparkles,
  ArrowLeft, Wrench, Clock,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

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

type FullscreenPage = 'edit' | 'password' | 'support' | 'improvements' | null;

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const DEFAULT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDgdPkiT-wRtOnLWfj51Eko2A8FvPaNGJ9YfKsvfQJI7gKPON-2yvOWFMWgtFmRhEmichfWU3XbAz48qYC0PRqR9_chfQQZ2BbtesGE0Jy7gcgL_Ubv7TuyzPmPQkJg1-suxATPUgyhbrS6jrCV5ctYinBi9YlSQ0J9TMWcR2MOT0ZS54pLxrEOvLR2YzOMy1drxABvrpXtyhhg-aKC6gOd-u74J0RYJcOABpiFEDbcYv2RBPqwT57Mhqjm4adWnR1Li0ygdAc73X4';

const PAGE_META: Record<
  NonNullable<FullscreenPage>,
  { title: string; description: string; icon: React.ReactNode }
> = {
  edit: {
    title: 'Meu Perfil',
    description:
      'Edição de dados cadastrais, foto de perfil, matrícula e telefone.',
    icon: <User size={40} />,
  },
  password: {
    title: 'Segurança & Senha',
    description:
      'Alteração de senha, autenticação em dois fatores e histórico de acessos.',
    icon: <Lock size={40} />,
  },
  support: {
    title: 'Central de Suporte',
    description:
      'Abertura de chamados, acompanhamento de tickets e contato com a equipe técnica.',
    icon: <MessageSquare size={40} />,
  },
  improvements: {
    title: 'Sugestão de Melhorias',
    description:
      'Envio de ideias, votação em sugestões da comunidade e acompanhamento do roadmap.',
    icon: <Sparkles size={40} />,
  },
};

// ─────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────

const drawerVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, damping: 28, stiffness: 300 },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const },
  },
};

const fullscreenVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 26, stiffness: 280 },
  },
  exit: {
    opacity: 0,
    y: 24,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
  },
};

// ─────────────────────────────────────────────
// FullscreenUnderConstruction
// ─────────────────────────────────────────────

function FullscreenUnderConstruction({
  page,
  onBack,
}: {
  page: NonNullable<FullscreenPage>;
  onBack: () => void;
}) {
  const meta = PAGE_META[page];

  return (
    <motion.div
      key={page}
      variants={fullscreenVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[300] bg-white flex flex-col"
    >
      {/* Topbar */}
      <div className="px-6 py-5 flex items-center gap-3 border-b border-slate-100 shrink-0">
        <button
          onClick={onBack}
          aria-label="Voltar"
          className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={18} className="text-primary" />
        </button>
        <h1 className="text-base font-bold text-primary tracking-tight">
          {meta.title}
        </h1>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-8">
        {/* Animated icon */}
        <div className="relative">
          <motion.div
            animate={{ rotate: [0, -8, 8, -8, 0] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeInOut',
              repeatDelay: 1.5,
            }}
            className="w-28 h-28 rounded-[36px] bg-primary/5 flex items-center justify-center text-primary"
          >
            {meta.icon}
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', damping: 12 }}
            className="absolute -top-2 -right-2 bg-secondary text-primary text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider"
          >
            Em breve
          </motion.div>
        </div>

        {/* Text */}
        <div className="space-y-3 max-w-xs">
          <h2 className="text-2xl font-bold text-primary">{meta.title}</h2>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            {meta.description}
          </p>
        </div>

        {/* Info card */}
        <div className="w-full max-w-sm bg-slate-50 rounded-2xl border border-slate-100 p-5 flex gap-4 items-start text-left">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
            <Wrench size={18} className="text-primary/50" />
          </div>
          <div>
            <p className="text-sm font-bold text-primary mb-0.5">
              Página em desenvolvimento
            </p>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Esta funcionalidade está sendo construída pela equipe. Em breve
              estará disponível no portal.
            </p>
          </div>
        </div>

        {/* ETA */}
        <div className="flex items-center gap-2 text-slate-400">
          <Clock size={14} />
          <span className="text-xs font-semibold">Previsão: Em breve</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-50 flex justify-between items-center shrink-0">
        <div className="flex gap-1" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-primary/20" />
          ))}
        </div>
        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
          Hospital Pequeno Príncipe • 2026
        </span>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// UserModals
// ─────────────────────────────────────────────

export function UserModals({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onLogout,
}: UserModalsProps) {
  const [activePage, setActivePage] = useState<FullscreenPage>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Lock body scroll */
  useEffect(() => {
    const locked = isOpen || activePage !== null;
    document.body.style.overflow = locked ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, activePage]);

  /* Keyboard: Escape */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (activePage) {
        setActivePage(null);
      } else {
        onClose();
      }
    };
    if (isOpen || activePage) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, activePage, onClose]);

  /* Reset when drawer closes */
  useEffect(() => {
    if (!isOpen) {
      setActivePage(null);
      setAvatarPreview(null);
    }
  }, [isOpen]);

  /* Avatar upload */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      onUpdateUser({ ...user, avatar: result });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    onUpdateUser({ ...user, avatar: undefined });
  };

  /* Profile completion */
  const completion = (() => {
    const fields = ['name', 'email', 'matricula', 'telefone', 'avatar'];
    const filled = fields.filter(
      (f) => !!(user as Record<string, unknown>)[f]
    ).length;
    return Math.round((filled / fields.length) * 100);
  })();

  const currentAvatar = avatarPreview || user.avatar || DEFAULT_AVATAR;

  return (
    <>
      {/* ── Fullscreen pages ── */}
      <AnimatePresence>
        {activePage && (
          <FullscreenUnderConstruction
            page={activePage}
            onBack={() => setActivePage(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Drawer ── */}
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

            {/* Panel */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Meu Perfil"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed right-0 top-0 bottom-0 z-[201] w-full max-w-[420px] bg-white shadow-2xl flex flex-col overflow-hidden"
              style={{ borderRadius: '24px 0 0 24px' }}
            >
              {/* Header */}
              <div className="px-6 py-5 flex justify-between items-center bg-white border-b border-slate-50 shrink-0">
                <h2 className="text-base font-bold text-primary tracking-tight">
