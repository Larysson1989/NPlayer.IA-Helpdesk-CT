/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AuthPage } from './pages/AuthPage';
import { AdminPage } from './pages/AdminPage';
import { UserModals } from './components/UserModals';
import { UnderConstruction } from './components/UnderConstruction';
import type { ProfilePage } from './components/UnderConstruction';
import ChatView from './components/ChatView';
import { motion } from 'motion/react';

const AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsja2GmlJ7z64XhGwI_WRtSwLQ1cA8yB2IW_SxUGC6xqrXSNnd-tjPNwXd-yFuW16id4il3bF0eTU5CTbxIhUStSPK0G5iNPPFwpfo1UM1AMKUoznN9IjvQqOPHLyLb099WSpiqb_qwqR5eQCh5dlmkkAEnCT1uH3RwRus2scZ8deMJcrPfN-ABL3mSAL6_EiQdL3quKIwfpWChNxAEQQrTQfc_jJEEV_GjJN4dzgfdHxxBs2i8834KMIg3F9grlI_ov603xAceHM';

const FAQ_CARDS = [
  { icon: 'contact_support',   title: 'Como abordar um doador?',       desc: 'Estratégias para quebrar o gelo e iniciar contato.' },
  { icon: 'description',       title: 'Script de captação atualizado', desc: 'Confira a versão mais recente do roteiro.' },
  { icon: 'question_answer',   title: 'Tratativa de objeções',         desc: 'Como lidar com questionamentos comuns.' },
  { icon: 'lock',              title: 'Segurança de dados',            desc: 'Normas de LGPD e segurança da informação.' },
  { icon: 'favorite',          title: 'Valores do HPP',                desc: 'Missão, visão e valores da instituição.' },
  { icon: 'account_balance',   title: 'Histórico da Instituição',      desc: 'Linha do tempo e conquistas importantes.' },
  { icon: 'record_voice_over', title: 'Dicas de rapport',              desc: 'Como criar conexão imediata pelo telefone.' },
  { icon: 'block',             title: "Contorno de 'não' inicial",     desc: 'Técnicas de reversão de negativa precoce.' },
  { icon: 'psychology',        title: 'Uso de gatilhos mentais',       desc: 'Escassez, autoridade e prova social.' },
  { icon: 'task_alt',          title: 'Finalização de chamada',        desc: 'Protocolo para encerramento e confirmação.' },
];

export type UserRole = 'captador' | 'supervisor' | 'administrador';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole | null;
  active: boolean;
  matricula?: string;
  telefone?: string;
  avatar?: string;
}

type AppState = 'loading' | 'unauthenticated' | 'pending' | 'inactive' | UserRole;

// ─── Telas auxiliares ────────────────────────────────────────

function PendingPage({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center space-y-3 max-w-sm">
        <div className="text-5xl">⏳</div>
        <h2 className="text-xl font-black text-slate-700 uppercase tracking-tight">
          Aguardando liberação
        </h2>
        <p className="text-sm text-slate-400 font-medium leading-relaxed">
          Seu cadastro foi recebido. Um administrador irá liberar seu acesso em breve.
        </p>
      </div>
      <button
        onClick={onLogout}
        className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
      >
        Sair
      </button>
    </div>
  );
}

function InactivePage({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center space-y-3 max-w-sm">
        <div className="text-5xl">🔒</div>
        <h2 className="text-xl font-black text-red-600 uppercase tracking-tight">
          Conta desativada
        </h2>
        <p className="text-sm text-slate-400 font-medium leading-relaxed">
          Seu acesso foi suspenso. Entre em contato com o administrador.
        </p>
      </div>
      <button
        onClick={onLogout}
        className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
      >
        Sair
      </button>
    </div>
  );
}

// ─── Busca perfil no banco ───────────────────────────────────

async function resolveState(userId: string): Promise<{ state: AppState; profile: Partial<User> }> {
  const { data } = await supabase
    .from('profiles')
    .select('email, name, role, active, matricula, telefone, avatar')
    .eq('id', userId)
    .maybeSingle();

  if (!data)        return { state: 'pending',  profile: {} };
  if (!data.active) return { state: 'inactive', profile: data };
  if (!data.role)   return { state: 'pending',  profile: data };

  return { state: data.role as UserRole, profile: data };
}

// ─── App principal ───────────────────────────────────────────

export default function App() {
  const [appState, setAppState]                     = useState<AppState>('loading');
  const [user, setUser]                             = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [searchQuery, setSearchQuery]               = useState('');
  const [activeChatQuery, setActiveChatQuery]       = useState<string | null>(null);
  const [activeProfilePage, setActiveProfilePage]   = useState<ProfilePage | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // ── Helper: monta objeto User a partir da sessão + perfil ──
  function buildUser(sessionUser: { id: string; email?: string }, profile: Partial<User>): User {
    return {
      id:        sessionUser.id,
      email:     sessionUser.email ?? '',
      name:      profile.name      ?? (sessionUser.email ?? '').split('@')[0],
      role:      (profile.role as UserRole) ?? null,
      active:    profile.active    ?? true,
      matricula: profile.matricula ?? undefined,
      telefone:  profile.telefone  ?? undefined,
      avatar:    profile.avatar    ?? undefined,
    };
  }

  useEffect(() => {
    let mounted = true;

    // 1. Verifica sessão existente imediatamente (não depende de evento)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      if (!session?.user) {
        setAppState('unauthenticated');
        return;
      }

      try {
        const { state, profile } = await resolveState(session.user.id);
        if (!mounted) return;
        setUser(buildUser(session.user, profile));
        setAppState(state);
      } catch {
        if (mounted) setAppState('unauthenticated');
      }
    });

    // 2. Escuta mudanças futuras: login, logout, refresh de token
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // INITIAL_SESSION já foi tratado pelo getSession() acima
        if (event === 'INITIAL_SESSION') return;

        if (!session?.user) {
          setUser(null);
          setAppState('unauthenticated');
          return;
        }

        setAppState('loading');
        try {
          const { state, profile } = await resolveState(session.user.id);
          if (!mounted) return;
          setUser(buildUser(session.user, profile));
          setAppState(state);
        } catch {
          if (mounted) setAppState('unauthenticated');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── Ações ──────────────────────────────────────────────────

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSearchQuery('');
    setActiveChatQuery(null);
    setActiveProfilePage(null);
    setAppState('unauthenticated');
  };

  const openChat = (query: string) => {
    if (!query.trim()) return;
    setActiveChatQuery(query);
  };

  const handleTextareaInput = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); openChat(searchQuery); }
  };

  // ── Roteamento por estado ──────────────────────────────────

  if (appState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  if (appState === 'unauthenticated' || !user) {
    return <AuthPage onSuccess={() => { /* onAuthStateChange cuida do resto */ }} />;
  }

  if (appState === 'inactive') return <InactivePage onLogout={handleLogout} />;
  if (appState === 'pending')  return <PendingPage  onLogout={handleLogout} />;

  if (appState === 'administrador') {
    return <AdminPage adminName={user.name} onLogout={handleLogout} />;
  }

  if (activeProfilePage !== null) {
    return (
      <UnderConstruction
        page={activeProfilePage}
        onBack={() => setActiveProfilePage(null)}
      />
    );
  }

  if (activeChatQuery !== null) {
    return (
      <ChatView
        user={user}
        initialQuery={activeChatQuery}
        onBack={() => { setActiveChatQuery(null); setSearchQuery(''); }}
      />
    );
  }

  // ── Dashboard principal ────────────────────────────────────

  const roleBadge: Record<UserRole, { label: string; color: string }> = {
    captador:      { label: 'Captador',   color: 'text-blue-600 bg-blue-50' },
    supervisor:    { label: 'Supervisor', color: 'text-purple-600 bg-purple-50' },
    administrador: { label: 'Admin',      color: 'text-emerald-600 bg-emerald-50' },
  };
  const badge = user.role
    ? roleBadge[user.role]
    : { label: 'Sem perfil', color: 'text-slate-400 bg-slate-100' };
  const firstName = user.name.split(' ')[0];

  return (
    <div className="bg-white text-slate-900 min-h-screen flex flex-col">

      <UserModals
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdateUser={(updated) => setUser(u => u ? { ...u, ...updated } : u)}
        onLogout={handleLogout}
        onNavigate={(page) => {
          setIsProfileModalOpen(false);
          setActiveProfilePage(page);
        }}
      />

      {/* Header */}
      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">N</div>
            <span className="text-xl font-bold text-primary tracking-tight">
              NPlayer.<span className="text-yellow-400">IA</span>
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 hidden md:block italic">
            "Inteligência que transforma cada ligação"
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">{user.name}</p>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.color}`}>
                {badge.label}
              </span>
            </div>
            <img
              src={user.avatar || AVATAR}
              alt={user.name}
              className="w-10 h-10 rounded-full border-2 border-primary/20 object-cover"
            />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto flex flex-col items-center bg-white">
        <div className="max-w-4xl w-full px-6 py-12 md:py-24">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10 space-y-4"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-800">
              Olá, <span className="text-primary">{firstName}</span>. Como posso apoiar sua captação hoje?
            </h1>
            <p className="text-slate-500 text-lg">
              Faça uma pergunta ou selecione um dos tópicos rápidos abaixo.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <div className="relative">
              <textarea
                ref={textareaRef}
                rows={1}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onInput={handleTextareaInput}
                onKeyDown={handleTextareaKeyDown}
                placeholder="Escreva sua dúvida aqui... (ex: Como lidar com doador sem tempo?)"
                className="w-full bg-slate-100 border-none rounded-2xl py-5 pl-7 pr-16 focus:ring-2 focus:ring-primary shadow-sm text-lg text-slate-800 resize-none transition-all placeholder:text-slate-400 outline-none"
              />
              <button
                onClick={() => openChat(searchQuery)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary text-white p-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                aria-label="Enviar pergunta"
              >
                <span className="material-icons-round">send</span>
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-3 flex items-center justify-center gap-1">
              <span className="material-icons-round text-[12px]">info</span>
              O NPlayer.IA pode cometer erros. Verifique informações importantes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {FAQ_CARDS.map((card) => (
              <button
                key={card.title}
                onClick={() => openChat(card.title)}
                className="p-5 border border-slate-200 rounded-2xl bg-white hover:border-primary hover:shadow-xl transition-all text-left flex items-start gap-4 group"
              >
                <div className="p-2.5 bg-blue-50 text-primary rounded-xl shrink-0">
                  <span className="material-icons-round">{card.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 group-hover:text-primary transition-colors">
                    {card.title}
                  </p>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>

        </div>
      </main>
    </div>
  );
}
