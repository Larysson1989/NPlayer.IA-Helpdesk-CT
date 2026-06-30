import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { login } from '../lib/auth';
import type { User } from '../App';
import { ShieldAlert, Eye, EyeOff, Loader2, Headphones, Mail, Lock, ArrowRight } from 'lucide-react';

// ─── AuthPage principal ──────────────────────────────────────
export function AuthPage({ onSuccess }: { onSuccess: (user: User) => void }) {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [attempts, setAttempts]         = useState(0);

  const isBlocked = attempts >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) return;
    setError(null);
    setLoading(true);

    // Simula delay mínimo para UX
    await new Promise(r => setTimeout(r, 400));

    const user = await login(email, password);
    setLoading(false);

    if (!user) {
      setAttempts(a => a + 1);
      setError('E-mail ou senha incorretos.');
      return;
    }

    onSuccess(user);
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&display=swap" rel="stylesheet" />

      <div className="min-h-screen relative overflow-hidden flex flex-col" style={{ background: '#002776' }}>
        <FloatingLetters />

        <div className="flex-1 flex items-center justify-center p-4 z-10 relative">
          <div className="w-full max-w-[490px] space-y-5">

            {/* HEADER */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-[24px] mb-1" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <Headphones size={28} style={{ color: '#009C3B' }} />
              </div>
              <h1
                className="text-5xl font-black uppercase tracking-tighter leading-none"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                <span style={{ color: '#ffffff' }}>NPlayer</span>
                <span style={{ color: '#FFDF00', textShadow: '0 0 20px rgba(255,223,0,0.5)' }}>.IA</span>
              </h1>
              <p className="text-[12px] font-black uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                🇧🇷 Apoio Operacional · CT
              </p>
            </div>

            {/* CARD */}
            <div
              className="bg-white overflow-hidden"
              style={{
                borderRadius: '24px',
                boxShadow: '0 8px 40px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              {/* Faixa tricolor */}
              <div style={{
                height: '6px',
                background: 'linear-gradient(90deg, #009C3B 0%, #009C3B 33%, #FFDF00 33%, #FFDF00 66%, #002776 66%, #002776 100%)',
              }} />

              <div className="p-7 sm:p-9">
                <p className="text-center text-xs font-black uppercase tracking-[0.18em] text-slate-400 mb-6">
                  Acesso Restrito
                </p>

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

                  {/* Bloqueio */}
                  <AnimatePresence>
                    {isBlocked && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-amber-50 border border-amber-200 rounded-2xl"
                      >
                        <p className="text-xs font-black text-amber-700 uppercase tracking-wider">
                          🔒 Muitas tentativas. Recarregue a página.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* E-mail */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        className="w-full pl-11 pr-4 py-[15px] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 bg-white placeholder:text-slate-300 outline-none transition-all"
                        onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0,156,59,0.14)'}
                        onBlur={e => e.currentTarget.style.boxShadow = ''}
                      />
                    </div>
                  </div>

                  {/* Senha */}
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
                        onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0,156,59,0.14)'}
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
                  </div>

                  {/* Botão */}
                  <button
                    type="submit"
                    disabled={loading || isBlocked}
                    className="w-full py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    style={{ background: '#009C3B', boxShadow: '0 4px 20px rgba(0,156,59,0.35)' }}
                    onMouseEnter={e => !loading && !isBlocked && (e.currentTarget.style.background = '#007a2f')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#009C3B')}
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <> Entrar no Portal <ArrowRight size={16} /> </>
                    )}
                  </button>

                </form>
              </div>
            </div>
          </div>
        </div>

        <footer className="py-8 text-center z-10 relative">
          <p className="text-[12px] font-black uppercase tracking-[0.4em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Hospital Pequeno Príncipe © 2026
          </p>
        </footer>
      </div>
    </>
  );
}

// ─── FloatingLetters ────────────────────────────────────────
import { useMemo } from 'react';
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const FLOAT_COLORS = ['#009C3B', '#FFDF00', '#ffffff'];

function FloatingLetters() {
  const items = useMemo(() => Array.from({ length: 55 }, (_, i) => ({
    id: i,
    char: CHARS[Math.floor(Math.random() * CHARS.length)],
    size: Math.floor(Math.random() * 53) + 13,       // 13–65 px
    top: Math.random() * 100,
    left: Math.random() * 100,
    opacity: Math.random() * 0.20 + 0.14,            // 0.14–0.34
    color: FLOAT_COLORS[Math.floor(Math.random() * FLOAT_COLORS.length)],
    duration: Math.random() * 22 + 12,               // 12–34 s
    delay: -(Math.random() * 34),                    // delay negativo para dessincronizar
  })), []);

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
          <span key={item.id} className="float-letter" style={{
            top: `${item.top}%`, left: `${item.left}%`,
            fontSize: `${item.size}px`, opacity: item.opacity,
            color: item.color, animationDuration: `${item.duration}s`,
            animationDelay: `${item.delay}s`,
          }}>
            {item.char}
          </span>
        ))}
      </div>
    </>
  );
}
