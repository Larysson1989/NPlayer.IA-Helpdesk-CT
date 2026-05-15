import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Construction, User, Lock, MessageSquare, Sparkles } from 'lucide-react';

export type ProfilePage = 'perfil' | 'seguranca' | 'suporte' | 'melhorias';

interface UnderConstructionProps {
  page: ProfilePage;
  onBack: () => void;
}

const PAGE_CONFIG: Record<ProfilePage, {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  bg: string;
  iconColor: string;
  eta: string;
}> = {
  perfil: {
    title: 'Meu Perfil',
    subtitle: 'Dados Cadastrais',
    description: 'Em breve você poderá editar nome, foto, telefone, matrícula e todas as suas informações diretamente por aqui.',
    icon: <User size={36} />,
    bg: 'bg-primary/10',
    iconColor: 'text-primary',
    eta: 'Sprint 2',
  },
  seguranca: {
    title: 'Segurança & Senha',
    subtitle: 'Gerencie sua segurança',
    description: 'Em breve você terá acesso completo para alterar sua senha, configurar autenticação em dois fatores e gerenciar sessões ativas.',
    icon: <Lock size={36} />,
    bg: 'bg-primary/10',
    iconColor: 'text-primary',
    eta: 'Sprint 2',
  },
  suporte: {
    title: 'Suporte',
    subtitle: 'Reporte problemas técnicos',
    description: 'Em breve você poderá abrir chamados, acompanhar o status dos tickets e falar diretamente com a equipe técnica.',
    icon: <MessageSquare size={36} />,
    bg: 'bg-primary/10',
    iconColor: 'text-primary',
    eta: 'Sprint 3',
  },
  melhorias: {
    title: 'Melhorias',
    subtitle: 'Sugira novas funcionalidades',
    description: 'Em breve você poderá enviar sugestões, votar nas ideias da equipe e acompanhar o roadmap de evoluções do NPlayer.IA.',
    icon: <Sparkles size={36} />,
    bg: 'bg-yellow-400/15',
    iconColor: 'text-primary',
    eta: 'Sprint 3',
  },
};

export function UnderConstruction({ page, onBack }: UnderConstructionProps) {
  const config = PAGE_CONFIG[page];

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <header className="h-16 border-b border-slate-100 flex items-center px-6 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Voltar
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xs">N</div>
          <span className="text-base font-bold text-primary tracking-tight">
            NPlayer.<span className="text-yellow-400">IA</span>
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-sm w-full text-center space-y-8"
        >
          {/* Ícone */}
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0.8, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className={`w-28 h-28 rounded-[36px] ${config.bg} ${config.iconColor} flex items-center justify-center shadow-md`}
            >
              {config.icon}
            </motion.div>
          </div>

          {/* Texto */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{config.subtitle}</p>
            <h1 className="text-3xl font-bold text-primary tracking-tight">{config.title}</h1>
            <p className="text-slate-500 text-sm leading-relaxed pt-1">{config.description}</p>
          </div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl"
          >
            <div className="relative shrink-0">
              <Construction size={18} className="text-amber-500" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-700 leading-none">Em Construção</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Previsão: {config.eta}</p>
            </div>
          </motion.div>

          {/* Botão */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={onBack}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            Voltar ao Início
          </motion.button>
        </motion.div>
      </main>

      <footer className="py-4 text-center">
        <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">Hospital Pequeno Príncipe • 2026</span>
      </footer>
    </div>
  );
}
