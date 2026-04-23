import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, Camera, MessageSquare, ChevronRight, 
  AlertTriangle, Lightbulb, CheckCircle2, Lock, 
  LogOut, ShieldCheck, Mail, Phone, Hash, 
  Trash2, Upload, Loader2, Star
} from 'lucide-react';

interface UserData {
  email: string;
  name: string;
  matricula?: string;
  telefone?: string;
  avatar?: string;
}

interface UserModalsProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData;
  onUpdateUser: (updatedUser: UserData) => void;
  onLogout: () => void;
}

type ModalView = 'main' | 'edit' | 'password' | 'support' | 'success';

export function UserModals({ isOpen, onClose, user, onUpdateUser, onLogout }: UserModalsProps) {
  const [view, setView] = useState<ModalView>('main');
  const [editData, setEditData] = useState<UserData>(user);
  const [supportData, setSupportData] = useState({ subject: '', category: 'problema', description: '' });
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setView('main');
      setEditData(user);
      setAvatarPreview(null);
    }
  }, [isOpen, user]);

  // Calculate profile completion
  const calculateCompletion = () => {
    const fields = ['name', 'email', 'matricula', 'telefone', 'avatar'];
    const filled = fields.filter(f => !!(user as any)[f]).length;
    return Math.round((filled / fields.length) * 100);
  };

  const completion = calculateCompletion();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      onUpdateUser({ ...editData, avatar: avatarPreview || user.avatar });
      setIsSaving(false);
      setView('main');
    }, 800);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setView('main');
    }, 1000);
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setView('success');
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    onUpdateUser({ ...user, avatar: undefined });
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 10 }
  };

  const viewVariants = {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/20 backdrop-blur-md"
          />
          
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/50"
          >
            {/* Header */}
            <div className="px-8 py-6 flex justify-between items-center bg-white sticky top-0 z-20 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                  {view === 'main' && <User size={22} />}
                  {(view === 'edit' || view === 'password' || view === 'support') && (
                    <button onClick={() => setView('main')} className="hover:scale-110 transition-transform">
                      <ChevronRight className="rotate-180" size={22} />
                    </button>
                  )}
                  {view === 'success' && <CheckCircle2 size={22} />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary tracking-tight">
                    {view === 'main' && 'Meu Perfil'}
                    {view === 'edit' && 'Editar Cadastro'}
                    {view === 'password' && 'Segurança'}
                    {view === 'support' && 'Suporte Central'}
                    {view === 'success' && 'Enviado!'}
                  </h2>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-slate-100 rounded-full transition-all group"
              >
                <X size={20} className="text-slate-400 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {view === 'main' && (
                  <motion.div 
                    key="main"
                    variants={viewVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="p-8 space-y-8"
                  >
                    {/* Hero section */}
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-white shadow-xl bg-slate-100 group-hover:scale-[1.02] transition-transform duration-500">
                          <img 
                            src={user.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgdPkiT-wRtOnLWfj51Eko2A8FvPaNGJ9YfKsvfQJI7gKPON-2yvOWFMWgtFmRhEmichfWU3XbAz48qYC0PRqR9_chfQQZ2BbtesGE0Jy7gcgL_Ubv7TuyzPmPQkJg1-suxATPUgyhbrS6jrCV5ctYinBi9YlSQ0J9TMWcR2MOT0ZS54pLxrEOvLR2YzOMy1drxABvrpXtyhhg-aKC6gOd-u74J0RYJcOABpiFEDbcYv2RBPqwT57Mhqjm4adWnR1Li0ygdAc73X4'} 
                            alt={user.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-2 -right-2 flex gap-2">
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 bg-primary text-white rounded-2xl shadow-lg hover:bg-secondary hover:text-primary transition-all active:scale-95 border-2 border-white"
                          >
                            <Camera size={18} />
                          </button>
                          {user.avatar && (
                            <button 
                              onClick={removeAvatar}
                              className="p-3 bg-white text-red-500 rounded-2xl shadow-lg hover:bg-red-50 transition-all active:scale-95 border-2 border-white"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          className="hidden" 
                          accept="image/*"
                        />
                      </div>
                      <div className="text-center space-y-1">
                        <h3 className="text-3xl font-headline font-bold text-primary tracking-tighter">{user.name}</h3>
                        <p className="text-slate-500 font-medium flex items-center justify-center gap-2">
                          <Mail size={14} className="text-slate-300" /> {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Completion bar */}
                    <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Progresso do Perfil</span>
                        <span className={`text-xs font-bold ${completion === 100 ? 'text-green-500' : 'text-primary'}`}>{completion}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${completion}%` }}
                          className={`h-full ${completion === 100 ? 'bg-green-500' : 'bg-primary'}`}
                        />
                      </div>
                      {completion < 100 && (
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">Complete todos os campos para ganhar o selo de perfil verificado! 🏆</p>
                      )}
                    </div>

                    {/* Action grid */}
                    <div className="grid gap-3">
                      <button 
                        onClick={() => setView('edit')}
                        className="flex items-center justify-between p-5 bg-white border border-slate-100 hover:border-primary/20 hover:bg-primary/[0.02] rounded-2xl transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                            <User size={20} />
                          </div>
                          <div className="text-left">
                            <span className="block font-bold text-primary">Dados Cadastrais</span>
                            <span className="text-[10px] text-slate-400 font-medium">Nome, telefone e matrícula</span>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button 
                        onClick={() => setView('password')}
                        className="flex items-center justify-between p-5 bg-white border border-slate-100 hover:border-primary/20 hover:bg-primary/[0.02] rounded-2xl transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                            <Lock size={20} />
                          </div>
                          <div className="text-left">
                            <span className="block font-bold text-primary">Segurança & Senha</span>
                            <span className="text-[10px] text-slate-400 font-medium">Gerencie sua segurança</span>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button 
                        onClick={() => setView('support')}
                        className="flex items-center justify-between p-5 bg-white border border-slate-100 hover:border-primary/20 hover:bg-primary/[0.02] rounded-2xl transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-xl group-hover:bg-secondary group-hover:text-primary transition-colors">
                            <MessageSquare size={20} />
                          </div>
                          <div className="text-left">
                            <span className="block font-bold text-primary">Central de Suporte</span>
                            <span className="text-[10px] text-slate-400 font-medium">Dúvidas ou sugestões</span>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button 
                        onClick={() => {
                          if (window.confirm('Deseja realmente sair?')) onLogout();
                        }}
                        className="flex items-center justify-between p-5 bg-white border border-slate-100 hover:border-red-100 hover:bg-red-50 rounded-2xl transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors">
                            <LogOut size={20} />
                          </div>
                          <div className="text-left">
                            <span className="block font-bold text-red-600 group-hover:text-red-700">Encerrar Sessão</span>
                            <span className="text-[10px] text-red-400/60 font-medium">Sair com segurança</span>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-red-200 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {view === 'edit' && (
                  <motion.div 
                    key="edit"
                    variants={viewVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="p-8 space-y-6"
                  >
                    <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl">
                      <div className="relative">
                        <img 
                          src={avatarPreview || user.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgdPkiT-wRtOnLWfj51Eko2A8FvPaNGJ9YfKsvfQJI7gKPON-2yvOWFMWgtFmRhEmichfWU3XbAz48qYC0PRqR9_chfQQZ2BbtesGE0Jy7gcgL_Ubv7TuyzPmPQkJg1-suxATPUgyhbrS6jrCV5ctYinBi9YlSQ0J9TMWcR2MOT0ZS54pLxrEOvLR2YzOMy1drxABvrpXtyhhg-aKC6gOd-u74J0RYJcOABpiFEDbcYv2RBPqwT57Mhqjm4adWnR1Li0ygdAc73X4'} 
                          className="w-16 h-16 rounded-xl object-cover bg-white p-1 shadow-sm"
                        />
                        {avatarPreview && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest leading-none block mb-1">Preview</span>
                        <span className="text-xs font-bold text-primary">Alteração pendente de salvamento</span>
                      </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Nome Completo</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30" size={18} />
                          <input 
                            type="text" 
                            value={editData.name}
                            onChange={e => setEditData({...editData, name: e.target.value})}
                            className="w-full bg-slate-50 border-2 border-transparent rounded-[20px] py-4 pl-12 pr-4 focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/10 transition-all font-bold text-primary"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Matrícula</label>
                          <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30" size={18} />
                            <input 
                              type="text" 
                              value={editData.matricula || ''}
                              onChange={e => setEditData({...editData, matricula: e.target.value})}
                              className="w-full bg-slate-50 border-2 border-transparent rounded-[20px] py-4 pl-12 pr-4 focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/10 transition-all font-bold text-primary"
                              placeholder="000000"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Telefone</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30" size={18} />
                            <input 
                              type="tel" 
                              value={editData.telefone || ''}
                              onChange={e => setEditData({...editData, telefone: e.target.value})}
                              className="w-full bg-slate-50 border-2 border-transparent rounded-[20px] py-4 pl-12 pr-4 focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/10 transition-all font-bold text-primary"
                              placeholder="(41) 9..."
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 flex gap-4">
                        <button 
                          type="button" 
                          onClick={() => setView('main')}
                          className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                        >
                          Cancelar
                        </button>
                        <button 
                          type="submit" 
                          disabled={isSaving}
                          className="flex-[2] bg-primary text-white py-4 font-bold rounded-2xl shadow-xl shadow-primary/20 hover:translate-y-[-2px] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Dados'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {view === 'password' && (
                  <motion.div 
                    key="password"
                    variants={viewVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="p-8 space-y-6"
                  >
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                      <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                      <p className="text-xs font-medium text-amber-700">Por segurança, sua nova senha deve conter pelo menos 8 caracteres, incluindo letras e números.</p>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Senha Atual</label>
                        <input 
                          type="password" 
                          value={passwordData.current}
                          onChange={e => setPasswordData({...passwordData, current: e.target.value})}
                          className="w-full bg-slate-50 border-2 border-transparent rounded-[20px] py-4 px-6 focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/10 transition-all font-bold text-primary"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Nova Senha</label>
                        <input 
                          type="password" 
                          value={passwordData.new}
                          onChange={e => setPasswordData({...passwordData, new: e.target.value})}
                          className="w-full bg-slate-50 border-2 border-transparent rounded-[20px] py-4 px-6 focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/10 transition-all font-bold text-primary"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Confirmar Senha</label>
                        <input 
                          type="password" 
                          value={passwordData.confirm}
                          onChange={e => setPasswordData({...passwordData, confirm: e.target.value})}
                          className="w-full bg-slate-50 border-2 border-transparent rounded-[20px] py-4 px-6 focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/10 transition-all font-bold text-primary"
                          required
                        />
                      </div>

                      <div className="pt-6 flex gap-4">
                        <button 
                          type="button" 
                          onClick={() => setView('main')}
                          className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                        >
                          Voltar
                        </button>
                        <button 
                          type="submit" 
                          disabled={isSaving}
                          className="flex-[2] bg-primary text-white py-4 font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Atualizar Senha'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {view === 'support' && (
                  <motion.div 
                    key="support"
                    variants={viewVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="p-8 space-y-6"
                   >
                    <form onSubmit={handleSupportSubmit} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Assunto</label>
                        <input 
                          type="text"
                          value={supportData.subject}
                          onChange={e => setSupportData({...supportData, subject: e.target.value})}
                          placeholder="Como podemos ajudar?"
                          className="w-full bg-slate-50 border-2 border-transparent rounded-[20px] py-4 px-6 focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/10 transition-all font-bold text-primary"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Categoria de Atendimento</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            type="button"
                            onClick={() => setSupportData({...supportData, category: 'problema'})}
                            className={`flex items-center justify-center gap-2 py-4 px-4 rounded-2xl border-2 transition-all font-bold ${supportData.category === 'problema' ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                          >
                            <AlertTriangle size={18} /> Problema
                          </button>
                          <button 
                            type="button"
                            onClick={() => setSupportData({...supportData, category: 'sugestao'})}
                            className={`flex items-center justify-center gap-2 py-4 px-4 rounded-2xl border-2 transition-all font-bold ${supportData.category === 'sugestao' ? 'border-secondary bg-secondary/10 text-primary' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                          >
                            <Lightbulb size={18} /> Sugestão
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between ml-1">
                          <label className="text-[11px] font-bold text-slate-400 uppercase">Descrição</label>
                          <span className="text-[10px] font-bold text-primary/40 leading-none">{supportData.description.length}/3000</span>
                        </div>
                        <textarea 
                          value={supportData.description}
                          onChange={e => setSupportData({...supportData, description: e.target.value.slice(0, 3000)})}
                          placeholder="Descreva seu problema ou sugestão em detalhes..."
                          className="w-full bg-slate-50 border-2 border-transparent rounded-[24px] py-4 px-6 focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/10 transition-all min-h-[160px] resize-none font-medium"
                          required
                        />
                      </div>
                      <div className="pt-4 flex gap-4">
                        <button 
                          type="button" 
                          onClick={() => setView('main')}
                          className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                        >
                          Voltar
                        </button>
                        <button 
                          type="submit" 
                          className="flex-[2] bg-secondary text-primary py-4 font-bold rounded-2xl shadow-xl shadow-secondary/20 hover:translate-y-[-2px] transition-all active:scale-95"
                        >
                          Enviar Ticket
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {view === 'success' && (
                  <motion.div 
                    key="success"
                    variants={viewVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="p-12 flex flex-col items-center text-center space-y-8"
                  >
                    <motion.div 
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', damping: 10 }}
                      className="w-32 h-32 bg-green-500 text-white rounded-[40px] flex items-center justify-center shadow-2xl shadow-green-100 relative"
                    >
                      <CheckCircle2 size={64} />
                      <div className="absolute inset-0 bg-white/20 rounded-[40px] animate-pulse" />
                    </motion.div>
                    <div className="space-y-3">
                      <h3 className="text-3xl font-headline font-bold text-primary">Solicitação Enviada!</h3>
                      <p className="text-slate-500 font-medium max-w-[280px] mx-auto">Sua mensagem está com nossos guardiões do portal. <br/>Retornando em instantes...</p>
                    </div>
                    <div className="w-full max-w-xs h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3, ease: 'linear' }}
                        className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Footer */}
            <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center">
               <div className="flex gap-1">
                 {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-primary/20" />)}
               </div>
               <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Hospital Pequeno Príncipe • 2026</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
