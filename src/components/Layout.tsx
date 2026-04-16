import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface TopBarProps {
  onLogout?: () => void;
  onProfileClick?: () => void;
  user?: {
    name: string;
    avatar?: string;
  };
}

const HPP_VALUES = [
  {
    title: 'Somos um time',
    quote: 'Juntos vamos mais longe, porque cada talento soma e fortalece o todo.',
  },
  {
    title: 'Vestimos a camisa do Pequeno Príncipe',
    quote: 'Trabalhamos com propósito, colocando o coração em tudo o que fazemos.',
  },
  {
    title: 'Curtimos a jornada com felicidade',
    quote: 'Valorizamos cada passo, celebrando conquistas grandes e pequenas.',
  },
  {
    title: 'Agimos com verdade e respeito',
    quote: 'A confiança é a base de tudo — falamos com transparência e agimos com integridade.',
  },
  {
    title: 'Buscamos excelência contínua',
    quote: 'Evoluir é um compromisso diário: sempre podemos fazer melhor do que ontem.',
  },
  {
    title: 'Prezamos pela humanização',
    quote: 'Cuidar de pessoas é tão importante quanto alcançar resultados.',
  },
  {
    title: 'Temos paixão pelo desafio',
    quote: 'Desafios nos movem — transformamos obstáculos em oportunidades de crescimento.',
  },
];

export function TopBar({ onLogout, onProfileClick, user }: TopBarProps) {
  const defaultAvatar =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDgdPkiT-wRtOnLWfj51Eko2A8FvPaNGJ9YfKsvfQJI7gKPON-2yvOWFMWgtFmRhEmichfWU3XbAz48qYC0PRqR9_chfQQZ2BbtesGE0Jy7gcgL_Ubv7TuyzPmPQkJg1-suxATPUgyhbrS6jrCV5ctYinBi9YlSQ0J9TMWcR2MOT0ZS54pLxrEOvLR2YzOMy1drxABvrpXtyhhg-aKC6gOd-u74J0RYJcOABpiFEDbcYv2RBPqwT57Mhqjm4adWnR1Li0ygdAc73X4';

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HPP_VALUES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const current = HPP_VALUES[currentIndex];

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl shadow-sm h-20 flex flex-col justify-center px-8 border-b border-slate-100">
      <div className="flex justify-between items-center w-full max-w-7xl mx-auto gap-6">
        {/* Logo */}
        <div className="shrink-0">
          <div className="text-2xl font-extrabold font-headline tracking-tighter leading-none">
            <span className="text-primary">NPlayer</span>
            <span className="text-secondary">.IA</span>
          </div>
        </div>

        {/* Carrossel de valores — centro */}
        <div className="flex-1 flex justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              className="text-center max-w-xl"
            >
              <p className="text-[13px] font-bold text-primary leading-none mb-1">
                {current.title}
              </p>
              <p className="text-[11px] italic text-slate-500 leading-snug">
                &ldquo;{current.quote}&rdquo;
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Perfil + Logout */}
        <div className="shrink-0 flex items-center gap-4">
          <button
            onClick={onProfileClick}
            className="group relative flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-4 rounded-full transition-all"
          >
            <div className="h-10 w-10 rounded-full bg-surface-container-highest overflow-hidden border-2 border-primary/10 group-hover:border-primary/30 transition-all shadow-sm">
              <img
                alt={user?.name || 'User Profile'}
                className="w-full h-full object-cover"
                src={user?.avatar || defaultAvatar}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Captador</span>
              <span className="text-sm font-bold text-primary group-hover:text-secondary transition-colors leading-none">
                {user?.name || 'Usuário'}
              </span>
            </div>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg font-bold text-xs uppercase tracking-wider"
              title="Sair do Portal"
            >
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
