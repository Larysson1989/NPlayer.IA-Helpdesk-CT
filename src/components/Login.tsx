import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: { email: string; name: string }) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Mock authentication based on user request
    setTimeout(() => {
      if (email === 'gabriel.lara@hpp.org.br' && password === '1234') {
        onLogin({ email, name: 'Gabriel Lara' });
      } else {
        setError('E-mail ou senha incorretos.');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100"
      >
        <div className="text-center mb-10">
          <div className="text-5xl font-extrabold font-headline tracking-tighter leading-none mb-3">
            <span className="text-primary">NPlayer</span>
            <span className="text-secondary">.IA</span>
          </div>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest opacity-60">
            Apoio operacional para Captação por Telefone
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              E-mail Institucional
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="seu.nome@hpp.org.br"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="••••"
                required
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-red-500 text-xs font-bold text-center"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar no Portal'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Acesso restrito a colaboradores autorizados.<br/>
            Hospital Pequeno Príncipe © 2026
          </p>
        </div>
      </motion.div>
    </div>
  );
}
