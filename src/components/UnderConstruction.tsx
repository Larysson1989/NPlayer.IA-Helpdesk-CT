import React from 'react';
import { motion } from 'motion/react';

// ─── Tipos ───────────────────────────────────────────────────
export type ProfilePage = 'metrics' | 'admin' | 'settings' | 'help' | 'about';

interface PageConfig {
  icon:        string;
  title:       string;
  description: string;
  support:     string;   // frase de apoio
  color:       string;
  bg:          string;
  iconBg:      string;
}

const PAGE_CONFIG: Record<ProfilePage, PageConfig> = {
  metrics: {
    icon:        'bar_chart',
    title:       'Equipe & Métricas',
    description: 'Acompanhamento de desempenho, metas e visão geral da equipe de captação.',
    support:     'Em breve você poderá visualizar o desempenho individual e coletivo da sua equipe, acompanhar metas em tempo real e identificar oportunidades de melhoria.',
    color:       'text-purple-600',
    bg:          'bg-purple-50',
    iconBg:      'bg-purple-100',
  },
  admin: {
    icon:        'admin_panel_settings',
    title:       'Painel Administrativo',
    description: 'Gestão completa de usuários, configurações e dados do sistema.',
    support:     'O painel administrativo está sendo aprimorado para oferecer mais controle e visibilidade sobre todas as operações do NPlayer.IA.',
    color:       'text-emerald-600',
    bg:          'bg-emerald-50',
    iconBg:      'bg-emerald-100',
  },
  settings: {
    icon:        'settings',
    title:       'Configurações',
    description: 'Preferências do sistema e dados da conta.',
    support:     'Aqui você poderá personalizar sua experiência, alterar dados de perfil e configurar notificações.',
    color:       'text-slate-600',
    bg:          'bg-slate-50',
    iconBg:      'bg-slate-100',
  },
  help: {
    icon:        'help_outline',
    title:       'Ajuda & Suporte',
    description: 'Central de ajuda, tutoriais e contato com o suporte técnico.',
    support:     'Nossa central de ajuda vai reunir tutoriais em vídeo, perguntas frequentes e um canal direto com o time de suporte.',
    color:       'text-blue-600',
    bg:          'bg-blue-50',
    iconBg:      'bg-blue-100',
  },
  about: {
    icon:        'info',
    title:       'Sobre o Sistema',
    description: 'Versão, créditos e informações técnicas do NPlayer.IA.',
    support:     'Informações detalhadas sobre versão, tecnologias utilizadas e os responsáveis pelo desenvolvimento do sistema.',
    color:       'text-sky-600',
    bg:          'bg-sky-50',
    iconBg:      'bg-sky-100',
  },
};

// ─── Componente ───────────────────────────────────────────────
interface UnderConstructionProps {
  page:   ProfilePage;
  onBack: () => void;
}

export function UnderConstruction({ page, onBack }: UnderConstructionProps) {
  const cfg = PAGE_CONFIG[page];

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Header ── */}
      <header className="h-16 border-b border-slate-200 flex items-center px-6 md:px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">

        {/* Botão voltar */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors group"
        >
          <span className="material-icons-round text-[20px] group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
          Voltar
        </button>

        {/* Logo centralizado */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm select-none">
              N
            </div>
            <span className="text-xl font-bold text-blue-600 tracking-tight">
              NPlayer.<span className="text-yellow-400">IA</span>
            </span>
          </div>
        </div>

        {/* Espaçador espelho para centralizar logo */}
        <div className="w-[72px]" />
      </header>

      {/* ── Conteúdo ── */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-lg space-y-6"
        >

          {/* Ícone animado */}
          <motion.div
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1,    opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 16 }}
            className={`w-24 h-24 ${cfg.iconBg} ${cfg.color} rounded-3xl flex items-center justify-center mx-auto shadow-sm`}
          >
            <span className="material-icons-round text-[48px]">{cfg.icon}</span>
          </motion.div>

          {/* Badge "Em construção" */}
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full"
          >
            <span className="material-icons-round text-[13px]">construction</span>
            Em construção
          </motion.span>

          {/* Título e descrição */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="space-y-3"
          >
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              {cfg.title}
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              {cfg.description}
            </p>
          </motion.div>

          {/* Frase de apoio */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className={`${cfg.bg} border border-slate-100 rounded-2xl px-6 py-4`}
          >
            <p className={`text-sm font-medium ${cfg.color} leading-relaxed`}>
              💡 {cfg.support}
            </p>
          </motion.div>

          {/* Aviso de prazo */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.38 }}
            className="text-slate-400 text-sm"
          >
            Esta funcionalidade estará disponível em breve.
          </motion.p>

          {/* Botão voltar */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44 }}
            onClick={onBack}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-8 py-3.5 rounded-2xl transition-colors shadow-md active:scale-95"
          >
            <span className="material-icons-round text-[18px]">arrow_back</span>
            Voltar ao início
          </motion.button>

        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer className="py-6 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-300">
          Hospital Pequeno Príncipe © 2026
        </p>
      </footer>

    </div>
  );
}
