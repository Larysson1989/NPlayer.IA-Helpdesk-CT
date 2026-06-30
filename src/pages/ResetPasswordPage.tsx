import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import {
  Headphones,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  onDone: () => void;
}

type Rule = { label: string; ok: boolean };

function getRules(pwd: string): Rule[] {
  return [
    { label: 'Mínimo 8 caracteres',            ok: pwd.length >= 8 },
    { label: 'Pelo menos uma letra maiúscula',  ok: /[A-Z]/.test(pwd) },
    { label: 'Pelo menos uma letra minúscula',  ok: /[a-z]/.test(pwd) },
    { label: 'Pelo menos um número',            ok: /[0-9]/.test(pwd) },
    { label: 'Pelo menos um caractere especial (!@#$…)', ok: /[^A-Za-z0-9]/.test(pwd) },
  ];
}

export function ResetPasswordPage({ onDone }: Props) {
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);

  const rules     = getRules(password);
  const allOk     = rules.every(r => r.ok);
  const match     = password === confirm && confirm.length > 0;
  const canSubmit = allOk && match && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setErrorMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message ?? 'Erro ao salvar. Tente novamente.');
      return;
    }

    // Encerra a sessão de recovery → força novo login
    await supabase.auth.signOut();
    setSuccess(true);
    setTimeout(() => onDone(), 2500);
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&display=swap"
        rel="stylesheet"
      />

      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[460px] space-y-5">

          {/* Cabeçalho */}
          <div className="text-center space-y-2">
            <div
              className="inline-flex p-3 rounded-[24px] mb-1"
              style={{ background: 'rgba(16,100,174,0.08)' }}
            >
              <Headphones size={28} style={{ color: '#1064AE' }} />
            </div>
            <h1
              className="text-5xl font-black uppercase tracking-tighter leading-none"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              <span style={{ color: '#1064AE' }}>NPlayer</span>
              <span style={{ color: '#FBDB14', textShadow: '0 0 20px rgba(251,219,20,0.5)' }}>
                .IA
              </span>
            </h1>
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.18em]">
              Redefinição de Senha
            </p>
          </div>

          {/* Card */}
          <div
            className="bg-white/90 backdrop-blur-2xl p-7 sm:p-9 rounded-[28px] sm:rounded-[40px] border border-slate-200"
            style={{ boxShadow: '0 8px 40px rgba(16,100,174,0.10), 0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 py-6 text-center"
                >
                  <CheckCircle2 size={52} className="text-emerald-500" />
                  <div>
                    <p className="text-lg font-black text-slate-800">Senha atualizada!</p>
                    <p className="text-sm text-slate-500 mt-1">Redirecionando para o login…</p>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-center text-xs font-black uppercase tracking-[0.18em] text-slate-400 mb-2">
                    Crie sua nova senha
                  </p>

                  <AnimatePresence>
                    {errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2"
                      >
                        <XCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-red-600">{errorMsg}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Nova senha */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-11 pr-12 py-[15px] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 bg-white placeholder:text-slate-300 outline-none transition-all"
                        onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 4px rgba(16,100,174,0.10)')}
                        onBlur={e  => (e.currentTarget.style.boxShadow = '')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-slate-500 transition-colors"
                      >
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Regras */}
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100"
                    >
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={13} /> Requisitos da senha
                      </p>
                      {rules.map(r => (
                        <div key={r.label} className="flex items-center gap-2">
                          {r.ok
                            ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                            : <XCircle      size={14} className="text-slate-300  shrink-0" />}
                          <span className={`text-xs font-semibold transition-colors ${
                            r.ok ? 'text-emerald-600' : 'text-slate-400'
                          }`}>{r.label}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* Confirmar */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showConf ? 'text' : 'password'}
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="••••••••"
                        required
                        className={`w-full pl-11 pr-12 py-[15px] border rounded-2xl text-sm font-semibold text-slate-800 bg-white placeholder:text-slate-300 outline-none transition-all ${
                          confirm.length > 0
                            ? match ? 'border-emerald-300' : 'border-red-300'
                            : 'border-slate-200'
                        }`}
                        onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 4px rgba(16,100,174,0.10)')}
                        onBlur={e  => (e.currentTarget.style.boxShadow = '')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConf(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-slate-500 transition-colors"
                      >
                        {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirm.length > 0 && !match && (
                      <p className="text-[11px] text-red-500 font-bold ml-1">As senhas não coincidem.</p>
                    )}
                  </div>

                  {/* Botão */}
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40"
                    style={{ background: '#1064AE', boxShadow: '0 4px 20px rgba(16,100,174,0.30)' }}
                  >
                    {loading
                      ? <Loader2 size={18} className="animate-spin" />
                      : 'Salvar Nova Senha'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <footer className="py-8 text-center">
          <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-300">
            Hospital Pequeno Príncipe © 2026
          </p>
        </footer>
      </div>
    </>
  );
}
