import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import {
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

const PROVISIONAL_PASSWORD = '123456';

export function ForcePasswordChange({ onDone }: Props) {
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isProvisional = password === PROVISIONAL_PASSWORD;
  const tooShort      = password.length > 0 && password.length < 8;
  const passwordOk    = password.length >= 8 && !isProvisional;
  const match         = password === confirm && confirm.length > 0;
  const canSubmit     = passwordOk && match && !loading;

  let passwordError: string | null = null;
  if (tooShort)      passwordError = 'A senha deve ter pelo menos 8 caracteres';
  else if (isProvisional) passwordError = 'Escolha uma senha diferente da provisória';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setErrorMsg(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) {
      setLoading(false);
      setErrorMsg(authError.message ?? 'Erro ao salvar. Tente novamente.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ force_password_change: false })
        .eq('id', user.id);
    }

    setLoading(false);
    setSuccess(true);
    setTimeout(() => onDone(), 1500);
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
              <ShieldCheck size={28} style={{ color: '#1064AE' }} />
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
              Primeiro Acesso
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
                    <p className="text-lg font-black text-slate-800">Senha criada com sucesso!</p>
                    <p className="text-sm text-slate-500 mt-1">Acessando o sistema…</p>
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
                  <div className="text-center space-y-1 mb-2">
                    <p className="text-sm font-black text-slate-700">Crie sua nova senha</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Por segurança, você precisa definir uma nova senha antes de continuar.
                    </p>
                  </div>

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
                        className={`w-full pl-11 pr-12 py-[15px] border rounded-2xl text-sm font-semibold text-slate-800 bg-white placeholder:text-slate-300 outline-none transition-all ${
                          passwordError ? 'border-red-300' : 'border-slate-200'
                        }`}
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
                    {passwordError && (
                      <p className="text-[11px] text-red-500 font-bold ml-1">{passwordError}</p>
                    )}
                  </div>

                  {/* Confirmar nova senha */}
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
                      <p className="text-[11px] text-red-500 font-bold ml-1">As senhas não conferem.</p>
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
                      : 'Salvar e Entrar'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <footer className="py-8 text-center">
            <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-300">
              Hospital Pequeno Príncipe © 2026
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
