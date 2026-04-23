import React from 'react';
import { LogOut } from 'lucide-react';

interface TopBarProps {
  onLogout?: () => void;
  onProfileClick?: () => void;
  user?: {
    name: string;
    avatar?: string;
  };
}

export function TopBar({ onLogout, onProfileClick, user }: TopBarProps) {
  const defaultAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuDgdPkiT-wRtOnLWfj51Eko2A8FvPaNGJ9YfKsvfQJI7gKPON-2yvOWFMWgtFmRhEmichfWU3XbAz48qYC0PRqR9_chfQQZ2BbtesGE0Jy7gcgL_Ubv7TuyzPmPQkJg1-suxATPUgyhbrS6jrCV5ctYinBi9YlSQ0J9TMWcR2MOT0ZS54pLxrEOvLR2YzOMy1drxABvrpXtyhhg-aKC6gOd-u74J0RYJcOABpiFEDbcYv2RBPqwT57Mhqjm4adWnR1Li0ygdAc73X4";

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl shadow-sm h-20 flex flex-col justify-center px-8 border-b border-slate-100">
      <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
        <div className="flex flex-col">
          <div className="text-2xl font-extrabold font-headline tracking-tighter leading-none">
            <span className="text-primary">NPlayer</span>
            <span className="text-secondary">.IA</span>
          </div>
          <span className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-[0.15em] mt-1.5">
            Apoio operacional para Captação por Telefone
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={onProfileClick}
              className="group relative flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-4 rounded-full transition-all"
            >
              <div className="h-10 w-10 rounded-full bg-surface-container-highest overflow-hidden border-2 border-primary/10 group-hover:border-primary/30 transition-all shadow-sm">
                <img 
                  alt={user?.name || "User Profile"} 
                  className="w-full h-full object-cover" 
                  src={user?.avatar || defaultAvatar}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Captador</span>
                <span className="text-sm font-bold text-primary group-hover:text-secondary transition-colors leading-none">{user?.name || "Usuário"}</span>
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
      </div>
    </header>
  );
}
