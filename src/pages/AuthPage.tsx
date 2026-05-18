// src/pages/AuthPage.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@supabase/supabase-js';
import { ShieldAlert, X, Eye, EyeOff, Loader2, Headphones, User, Mail, Lock, ArrowRight } from 'lucide-react';

const supabase = createClient(
  'https://uinfkxxfmowkjixcduuy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbmZreHhmbW93a2ppeGNkdXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzc0NjcsImV4cCI6MjA5NDY1MzQ2N30.6fkxUMbliL8WncNHpWhvDejLpN1-ttSCDGDxIYrYeA0'
);

const ALLOWED_DOMAINS = ['hpp.org.br'];
const ALLOWED_EXCEPTIONS = ['admin@lary.ia.br'];

function isDomainAllowed(email: string): boolean {
  const lower = email.trim().toLowerCase();
  if (ALLOWED_EXCEPTIONS.includes(lower)) return true;
  const domain = lower.split('@')[1];
  return !!domain && ALLOWED_DOMAINS.includes(domain);
}

// ─── FloatingLetters ────────────────────────────────────────
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function FloatingLetters() {
  const items = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => ({
      id: i,
      char: CHARS[Math.floor(Math.random() * CHARS.length)],
      size: Math.floor(Math.random() * 60) + 14,
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: Math.random() * 0.10 + 0.15,
      color: Math.random() > 0.5 ? '#1064AE' : '#FBDB14',
      duration: Math.random() * 25 + 15,
      delay: Math.random() * -30,
    }));
  }, []);

  return (
    <>
      <style>{`
        @keyframes float-3d {
          0%   { transform: translateY(0)     rotateX(0deg)   rotateY(0deg)   scale(1); }
          25%  { transform: translateY(-30px) rotateX(10deg)  rotateY(5deg)   scale(1.08); }
          50%  { transform: translateY(0)     rotateX(0deg)   rotateY(10deg)  scale(1); }
          75%  { transform: translateY(30px)  rotateX(-10deg) rotateY(-5deg)  scale(0.92); }
          100% { transform: translateY(0)     rotateX(0deg)   rotateY(0deg)   scale(1); }
        }
        .float-letter {
          animation: float-3d linear infinite;
          position: absolute;
          font-weight: 900;
          font-family: 'Syne', sans-serif;
          user-select: none;
          line-height: 1;
        }
      `}</style>
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" style={{ perspective: '600px' }}>
        {items.map(item => (
          <span
            key={item.id}
            className="float-letter"
            style={{
              top: `${item.top}%`,
              left: `${item.left}%`,
              fontSize: `${item.size}px`,
              opacity: item.opacity,
              color: item.color,
              animationDuration: `${item.duration}s`,
              animationDelay: `${item.delay}s`,
            }}
          >
            {item.char}
          </span>
        ))}
      </div>
    </>
  );
}

// ─── Barra de força da senha ─────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];

  return (
    <div className="flex gap-1 mt-2">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? colors[strength - 1] : 'bg-slate-200'}`}
        />
      ))}
    </div>
  );
}

// ─── Modal de bloqueio de domínio ────────────────────────────
function BlockedDomainModal({ email, onClose }: { email: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-red-950/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 16 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="bg-red-600 px-6 pt-8 pb-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X size={16} />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Acesso Bloqueado</h2>
          <p className="text-red-100 text-sm mt-1 font-medium">Domínio não autorizado</p>
        </div>
        <div className="px-6 py-6 space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <p className="text-sm font-bold text-red-700 mb-1">E-mail rejeitado:</p>
            <p className="text-sm text-red-500 font-mono break-all">{email}</p>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <p className="font-bold text-slate-800">🔒 Política de segurança</p>
            <p>Este sistema é de uso <strong>exclusivo</strong> para colaboradores do Hospital Pequeno Príncipe.</p>
            <p>
              Apenas e-mails com domínio{' '}
              <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">@hpp.org.br</span>{' '}
              estão autorizados.
            </p>
            <p className="text-slate-400 text-xs mt-2">
              Se você é colaborador e está tendo dificuldades, entre em contato com o suporte de TI.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-95"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── AuthPage principal ──────────────────────────────────────
type AuthMode = 'login' | 'register';

export function AuthPage({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedEmail, setBlockedEmail] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const isBlocked = attempts >= 5;

  const clearError = () => setError(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) return;
    clearError();

    if (!isDomainAllowed(email)) {
      setBlockedEmail(email);
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name || email.split('@')[0] } },
        });
        if (error) throw error;
        onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setAttempts(a => a + 1);
      if (msg.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirme seu e-mail antes de entrar.');
      } else if (msg.includes('User already registered')) {
        setError('Este e-mail já está cadastrado. Faça login.');
      } else if (msg.includes('Password should be')) {
        setError('A senha deve ter no mínimo 6 caracteres.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Google Fonts — Syne */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&display=swap" rel="stylesheet" />

      <AnimatePresence>
        {blockedEmail && (
          <BlockedDomainModal email={blockedEmail} onClose={() => setBlockedEmail(null)} />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
        <FloatingLetters />

        {/* Conteúdo central */}
        <div className="flex-1 flex items-center justify-center p-4 z-10 relative">
          <div className="w-full max-w-[490px] space-y-5">

            {/* HEADER */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-[24px] mb-1" style={{ background: 'rgba(16,100,174,0.08)' }}>
                <Headphones size={28} style={{ color: '#1064AE' }} />
              </div>
              <h1
                className="text-5xl font-black uppercase tracking-tighter leading-none"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                <span style={{ color: '#1064AE' }}>NPlayer</span>
                <span style={{
                  color: '#FBDB14',
                  textShadow: '0 0 20px rgba(251,219,20,0.5), 0 0 40px rgba(16,100,174,0.2)'
                }}>.IA</span>
              </h1>
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.18em]">
                Apoio operacional · Captação por Telefone
              </p>
            </div>

            {/* CARD FORM */}
            <div
              className="bg-white/90 backdrop-blur-2xl p-7 sm:p-9 rounded-[28px] sm:rounded-[40px] border border-slate-200"
              style={{ boxShadow: '0 8px 40px rgba(16,100,174,0.10), 0 2px 8px rgba(0,0,0,0.06)' }}
            >
              {/* Tabs */}
              <div className="flex bg-slate-50 rounded-2xl p-1 gap-1 mb-6">
                {(['login', 'register'] as AuthMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); clearError(); setAttempts(0); }}
                    className="flex-1 py-2.5 text-xs font-black uppercase tracking-[0.15em] rounded-xl transition-all"
                    style={mode === m
                      ? { background: '#1064AE', color: '#fff', boxShadow: '0 2px 8px rgba(16,100,174,0.25)' }
                      : { color: '#94a3b8' }
                    }
                  >
                    {m === 'login' ? 'Entrar' : 'Cadastrar'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Erro */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2"
                    >
                      <ShieldAlert size={15} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-red-600">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bloqueio por tentativas */}
                <AnimatePresence>
                  {isBlocked && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-amber-50 border border-amber-200 rounded-2xl"
                    >
                      <p className="text-xs font-black text-amber-700 uppercase tracking-wider">
                        🔒 Muitas tentativas. Aguarde alguns instantes.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Campo Nome (só cadastro) */}
                <AnimatePresence mode="wait">
                  {mode === 'register' && (
                    <motion.div
                      key="name-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Nome completo
                        </label>
                        <div className="relative">
                          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Seu nome"
                            required={mode === 'register'}
                            className="w-full pl-11 pr-4 py-[15px] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 bg-white placeholder:text-slate-300 outline-none transition-all"
                            onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(16,100,174,0.10)'}
                            onBlur={e => e.currentTarget.style.boxShadow = ''}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Campo E-mail */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    E-mail institucional
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="nome@hpp.org.br"
                      required
                      className="w-full pl-11 pr-4 py-[15px] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 bg-white placeholder:text-slate-300 outline-none transition-all"
                      onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(16,100,174,0.10)'}
                      onBlur={e => e.currentTarget.style.boxShadow = ''}
                    />
                  </div>
                </div>

                {/* Campo Senha — minLength removido */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-11 pr-12 py-[15px] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 bg-white placeholder:text-slate-300 outline-none transition-all"
                      onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(16,100,174,0.10)'}
                      onBlur={e => e.currentTarget.style.boxShadow = ''}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {mode === 'register' && <PasswordStrength password={password} />}
                </div>

                {/* Botão Submit */}
                <button
                  type="submit"
                  disabled={loading || isBlocked}
                  className="w-full py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: '#1064AE', boxShadow: '0 4px 20px rgba(16,100,174,0.30)' }}
                  onMouseEnter={e => !loading && !isBlocked && (e.currentTarget.style.background = '#0d52a0')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#1064AE')}
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? 'Entrar no Portal' : 'Criar Conta'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                {/* Toggle modo */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); clearError(); setAttempts(0); }}
                    className="text-[12px] font-black uppercase tracking-[0.15em] transition-opacity hover:opacity-70"
                    style={{ color: '#1064AE' }}
                  >
                    {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tenho uma conta'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>

        {/* RODAPÉ */}
        <footer className="py-8 text-center z-10 relative">
          <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-300">
            Hospital Pequeno Príncipe © 2026
          </p>
        </footer>
      </div>
    </>
  );
}
