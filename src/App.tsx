import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { getStoredSession, logout, canAccessMetrics, canAccessAdmin } from './lib/auth';
import { AuthPage } from './pages/AuthPage';
import { AdminPage } from './pages/AdminPage';
import { UserModals } from './components/UserModals';
import { UnderConstruction } from './components/UnderConstruction';
import type { ProfilePage } from './components/UnderConstruction';
import ChatView from './components/ChatView';

// ─── Tipos exportados ────────────────────────────────────────
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

// ─── Constantes ──────────────────────────────────────────────
const DEFAULT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBsja2GmlJ7z64XhGwI_WRtSwLQ1cA8yB2IW_SxUGC6xqrXSNnd-tjPNwXd-yFuW16id4il3bF0eTU5CTbxIhUStSPK0G5iNPPFwpfo1UM1AMKUoznN9IjvQqOPHLyLb099WSpiqb_qwqR5eQCh5dlmkkAEnCT1uH3RwRus2scZ8deMJcrPfN-ABL3mSAL6_EiQdL3quKIwfpWChNxAEQQrTQfc_jJEEV_GjJN4dzgfdHxxBs2i8834KMIg3F9grlI_ov603xAceHM';

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

const ROLE_BADGE: Record<UserRole, { label: string; color: string }> = {
  captador:      { label: 'Captador',   color: 'text-blue-600 bg-blue-50' },
  supervisor:    { label: 'Supervisor', color: 'text-purple-600 bg-purple-50' },
  administrador: { label: 'Admin',      color: 'text-emerald-600 bg-emerald-50' },
};

// ─── App ─────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]                             = useState<User | null>(null);
  const [ready, setReady]                           = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [searchQuery, setSearchQuery]               = useState('');
  const [activeChatQuery, setActiveChatQuery]       = useState<string | null>(null);
  const [activeProfilePage, setActiveProfilePage]   = useState<ProfilePage | null>(null);
  const textareaRef                                 = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const stored = getStoredSession();
    if (stored) setUser(stored);
    setReady(true);
  }, []);

  // ── Handlers ────────────────────────────────────────────────

  const handleLogin = (loggedUser: User) => setUser(loggedUser);

  const handleLogout = () => {
    logout();
    setUser(null);
    setSearchQuery('');
    setActiveChatQuery(null);
    setActiveProfilePage(null);
  };

  const openChat = (query: string) => {
    if (!query.trim()) return;
    setActiveChatQuery(query);
  };

  const handleTextareaInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      openChat(searchQuery);
    }
  };

  // ── Roteamento ───────────────────────────────────────────────

  // 1. Carregando sessão
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 2. Não autenticado
  if (!user) {
    return <AuthPage onSuccess={handleLogin} />;
  }

  // 3. Painel admin — acessado via botão, não automático
  if (activeProfilePage === 'admin') {
    return (
      <AdminPage
        adminName={user.name}
        onLogout={handleLogout}
        onBack={() => setActiveProfilePage(null)}
      />
    );
  }

  // 4. Página em construção (metrics, settings, help, about)
  if (activeProfilePage !== null) {
    return (
      <UnderConstruction
        page={activeProfilePage}
        onBack={() => setActiveProfilePage(null)}
      />
    );
  }

  // 5. Chat aberto
  if (activeChatQuery !== null) {
    return (
      <ChatView
        user={user}
        initialQuery={activeChatQuery}
        onBack={() => {
          setActiveChatQuery(null);
          setSearchQuery('');
        }}
      />
    );
  }

  // 6. Dashboard principal — todos os perfis (captador, supervisor, administrador)
  const badge      = user.role ? ROLE_BADGE[user.role] : { label: 'Sem perfil', color: 'text-slate-400 bg-slate-100' };
  const firstName  = user.name.split(' ')[0];
  const hasMetrics = canAccessMetrics(user.role);
  const hasAdmin   = canAccessAdmin(user.role);

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

      {/* ── Header ── */}
      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 md:px-8 bg-white/80 backdrop-blur-md z-10 sticky top-0">

        {/* Logo */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm select-none">
              N
            </div>
            <span className="text-xl font-bold text-blue-600 tracking-tight">
              NPlayer.<span className="text-yellow-400">IA</span>
            </span>
          </div>
          <p className="text-sm font-medium text-slate-400 hidden md:block italic">
            "Inteligência que transforma cada ligação"
          </p>
        </div>

        {/* Ações centrais do header */}
        <div className="hidden md:flex items-center gap-2">

          {/* Equipe & Métricas — supervisor e administrador */}
          {hasMetrics && (
            <button
              onClick={() => setActiveProfilePage('metrics' as ProfilePage)}
              className="flex items-center gap-2 text-sm font-semibold text-purple-600 bg-purple-50 px-4 py-2 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <span className="material-icons-round text-[18px]">bar_chart</span>
              Equipe & Métricas
            </button>
          )}

          {/* Painel Admin — somente administrador */}
          {hasAdmin && (
            <button
              onClick={() => setActiveProfilePage('admin' as ProfilePage)}
              className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              <span className="material-icons-round text-[18px]">admin_panel_settings</span>
              Painel Admin
            </button>
          )}
        </div>

        {/* Avatar / perfil */}
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800">{user.name}</p>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.color}`}>
              {badge.label}
            </span>
          </div>
          <img
            src={user.avatar || DEFAULT_AVATAR}
            alt={user.name}
            className="w-10 h-10 rounded-full border-2 border-blue-200 object-cover"
          />
        </button>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto flex flex-col items-center bg-white">
        <div className="max-w-4xl w-full px-6 py-12 md:py-24">

          {/* Saudação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10 space-y-4"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-800">
              Olá, <span className="text-blue-600">{firstName}</span>.{' '}
              Como posso apoiar sua captação hoje?
            </h1>
            <p className="text-slate-500 text-lg">
              Faça uma pergunta ou selecione um dos tópicos rápidos abaixo.
            </p>
          </motion.div>

          {/* Atalhos mobile — métricas e admin */}
          {(hasMetrics || hasAdmin) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-8 md:hidden flex flex-col gap-2"
            >
              {hasMetrics && (
                <button
                  onClick={() => setActiveProfilePage('metrics' as ProfilePage)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-purple-600 bg-purple-50 px-4 py-3 rounded-xl hover:bg-purple-100 transition-colors"
                >
                  <span className="material-icons-round text-[18px]">bar_chart</span>
                  Equipe & Métricas
                </button>
              )}
              {hasAdmin && (
                <button
                  onClick={() => setActiveProfilePage('admin' as ProfilePage)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl hover:bg-emerald-100 transition-colors"
                >
                  <span className="material-icons-round text-[18px]">admin_panel_settings</span>
                  Painel Admin
                </button>
              )}
            </motion.div>
          )}

          {/* Campo de busca */}
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
                className="w-full bg-slate-100 border-none rounded-2xl py-5 pl-7 pr-16 focus:ring-2 focus:ring-blue-500 shadow-sm text-lg text-slate-800 resize-none transition-all placeholder:text-slate-400 outline-none"
              />
              <button
                onClick={() => openChat(searchQuery)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
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

          {/* Cards FAQ */}
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
                className="p-5 border border-slate-200 rounded-2xl bg-white hover:border-blue-500 hover:shadow-xl transition-all text-left flex items-start gap-4 group"
              >
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <span className="material-icons-round">{card.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
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
