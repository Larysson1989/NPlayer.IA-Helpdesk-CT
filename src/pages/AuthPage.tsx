// src/pages/AuthPage.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, X, Eye, EyeOff, Loader2 } from 'lucide-react';

// Domínios permitidos
const ALLOWED_DOMAINS = ['hpp.org.br'];
const ALLOWED_EXCEPTIONS = ['admin@lary.ia.br'];

function isDomainAllowed(email: string): boolean {
  const lower = email.trim().toLowerCase();
  if (ALLOWED_EXCEPTIONS.includes(lower)) return true;
  const domain = lower.split('@')[1];
  return !!domain && ALLOWED_DOMAINS.includes(domain);
}

// ─── Modal de bloqueio ───────────────────────────────────────
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
        {/* Topo vermelho */}
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

        {/* Corpo */}
        <div className="px-6 py-6 space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <p className="text-sm font-bold text-red-700 mb-1">
              E-mail rejeitado:
            </p>
            <p className="text-sm text-red-500 font-mono break-all">{email}</p>
          </div>

          <div className="space-y-2 text-sm text-slate-600">
            <p className="font-bold text-slate-800">🔒 Política de segurança</p>
            <p>Este sistema é de uso <strong>exclusivo</strong> para colaboradores do Hospital Pequeno Príncipe.</p>
            <p>
              Apenas e-mails com domínio{' '}
              <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                @hpp.org.br
              </span>{' '}
              estão autorizados.
            </p>
            <p className="text-slate-400 text-xs mt-2">
              Se você é colaborador e está tendo dificuldades de acesso, entre em contato com o suporte de TI.
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

  const clearError = () => setError(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validação de domínio (front-end)
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
        // Registro
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name || email.split('@')[0] },
          },
        });
        if (error) throw error;
        // O trigger handle_new_user cuida do user_permissions automaticamente
        onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      // Traduz mensagens comuns do Supabase
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
      <AnimatePresence>
        {blockedEmail && (
          <BlockedDomainModal
            email={blockedEmail}
            onClose={() => setBlockedEmail(null)}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-slate-50">
            {/* Coloque aqui o logo do HPP */}
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-extrabold text-xl">L</span>
            </div>
            <h1 className="text-xl font-extrabold text-primary">Portal Lary</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Hospital Pequeno Príncipe
            </p>
          </div>

          {/* Tabs login / cadastro */}
          <div className="flex mx-6 mt-6 bg-slate-50 rounded-2xl p-1 gap-1">
            {(['login', 'register'] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); clearError(); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  mode === m
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {m === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pt-5 pb-8 space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1 pb-0.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      required={mode === 'register'}
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3.5 px-4 focus:outline-none focus:bg-white focus:border-primary/20 transition-all text-sm font-medium text-primary"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                E-mail institucional
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@hpp.org.br"
                required
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3.5 px-4 focus:outline-none focus:bg-white focus:border-primary/20 transition-all text-sm font-medium text-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-3.5 px-4 pr-12 focus:outline-none focus:bg-white focus:border-primary/20 transition-all text-sm font-medium text-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Erro inline */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-start gap-2"
                >
                  <ShieldAlert size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-red-600">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : mode === 'login' ? (
                'Entrar no Portal'
              ) : (
                'Criar Conta'
              )}
            </button>

            {/* Aviso de domínio */}
            <p className="text-center text-[10px] text-slate-300 font-medium pt-1">
              Acesso exclusivo para{' '}
              <span className="font-mono text-slate-400">@hpp.org.br</span>
            </p>
          </form>
        </motion.div>
      </div>
    </>
  );
}
