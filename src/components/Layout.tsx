import React from 'react';

export function TopBar() {
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
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-surface-container-highest overflow-hidden border-2 border-primary/10">
            <img 
              alt="Fundraiser Profile" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgdPkiT-wRtOnLWfj51Eko2A8FvPaNGJ9YfKsvfQJI7gKPON-2yvOWFMWgtFmRhEmichfWU3XbAz48qYC0PRqR9_chfQQZ2BbtesGE0Jy7gcgL_Ubv7TuyzPmPQkJg1-suxATPUgyhbrS6jrCV5ctYinBi9YlSQ0J9TMWcR2MOT0ZS54pLxrEOvLR2YzOMy1drxABvrpXtyhhg-aKC6gOd-u74J0RYJcOABpiFEDbcYv2RBPqwT57Mhqjm4adWnR1Li0ygdAc73X4"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
