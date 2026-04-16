import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Camera, MessageSquare, ChevronRight, Info, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';

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
}

type ModalView = 'main' | 'edit' | 'support' | 'success';

export function UserModals({ isOpen, onClose, user, onUpdateUser }: UserModalsProps) {
  const [view, setView] = useState<ModalView>('main');
  const [editData, setEditData] = useState<UserData>(user);
  const [supportData, setSupportData] = useState({ subject: '', category: 'problema', description: '' });

  useEffect(() => {
    if (isOpen) {
      setView('main');
      setEditData(user);
    }
  }, [isOpen, user]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(editData);
    setView('main');
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setView('success');
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  const handleAvatarChange = () => {
    // In a real app, this would open a file picker. 
    // For now, we'll cycle through some placeholders or just alert.
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`;
    onUpdateUser({ ...user, avatar: newAvatar });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/20 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                {view === 'main' && <><User size={24} /> Meu Perfil</>}
                {view === 'edit' && 'Editar Dados'}
                {view === 'support' && 'Suporte & Sugestões'}
                {view === 'success' && 'Suporte'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {view === 'main' && (
                <div className="space-y-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/10 bg-slate-100">
                        <img 
                          src={user.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgdPkiT-wRtOnLWfj51Eko2A8FvPaNGJ9YfKsvfQJI7gKPON-2yvOWFMWgtFmRhEmichfWU3XbAz48qYC0PRqR9_chfQQZ2BbtesGE0Jy7gcgL_Ubv7TuyzPmPQkJg1-suxATPUgyhbrS6jrCV5ctYinBi9YlSQ0J9TMWcR2MOT0ZS54pLxrEOvLR2YzOMy1drxABvrpXtyhhg-aKC6gOd-u74J0RYJcOABpiFEDbcYv2RBPqwT57Mhqjm4adWnR1Li0ygdAc73X4'} 
                          alt={user.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button 
                        onClick={handleAvatarChange}
                        className="absolute bottom-0 right-0 p-3 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95 border-2 border-white"
                      >
                        <Camera size={20} />
                      </button>
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-primary">{user.name}</h3>
                      <p className="text-slate-500 font-medium">{user.email}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => setView('edit')}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                          <User size={20} />
                        </div>
                        <span className="font-bold text-primary">Editar Dados Cadastrais</span>
                      </div>
                      <ChevronRight size={20} className="text-slate-300" />
                    </button>

                    <button 
                      onClick={() => setView('support')}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-secondary group-hover:text-white transition-colors">
                          <MessageSquare size={20} />
                        </div>
                        <span className="font-bold text-primary">Falar com o Suporte</span>
                      </div>
                      <ChevronRight size={20} className="text-slate-300" />
                    </button>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-2xl space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-primary/40 uppercase">Matrícula</span>
                      <span className="font-bold text-primary">{user.matricula || '-'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-primary/40 uppercase">Telefone</span>
                      <span className="font-bold text-primary">{user.telefone || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {view === 'edit' && (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Nome Completo</label>
                    <input 
                      type="text" 
                      value={editData.name}
                      onChange={e => setEditData({...editData, name: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Matrícula</label>
                    <input 
                      type="text" 
                      value={editData.matricula || ''}
                      onChange={e => setEditData({...editData, matricula: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                      placeholder="000000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Telefone</label>
                    <input 
                      type="tel" 
                      value={editData.telefone || ''}
                      onChange={e => setEditData({...editData, telefone: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                      placeholder="(41) 9..."
                    />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setView('main')}
                      className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 bg-primary text-white py-4 font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              )}

              {view === 'support' && (
                <form onSubmit={handleSupportSubmit} className="space-y-4 font-sans">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Assunto</label>
                    <input 
                      type="text"
                      value={supportData.subject}
                      onChange={e => setSupportData({...supportData, subject: e.target.value})}
                      placeholder="Sobre o que quer falar?"
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Categoria</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setSupportData({...supportData, category: 'problema'})}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-bold ${supportData.category === 'problema' ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-100 text-slate-400'}`}
                      >
                        <AlertTriangle size={18} /> Problema
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSupportData({...supportData, category: 'sugestao'})}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-bold ${supportData.category === 'sugestao' ? 'border-secondary bg-secondary/5 text-secondary' : 'border-slate-100 text-slate-400'}`}
                      >
                        <Lightbulb size={18} /> Sugestão
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                      <span>Descrição detalhada</span>
                      <span>{supportData.description.length}/3000</span>
                    </label>
                    <textarea 
                      value={supportData.description}
                      onChange={e => setSupportData({...supportData, description: e.target.value.slice(0, 3000)})}
                      placeholder="Descreva aqui sua necessidade em detalhes..."
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-primary/20 transition-all min-h-[150px] resize-none"
                      required
                    />
                  </div>
                  <div className="pt-2 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setView('main')}
                      className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                    >
                      Voltar
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 bg-secondary text-white py-4 font-bold rounded-xl shadow-lg shadow-secondary/20 hover:scale-[1.02] transition-all active:scale-95"
                    >
                      Enviar Mensagem
                    </button>
                  </div>
                </form>
              )}

              {view === 'success' && (
                <div className="py-12 flex flex-col items-center text-center space-y-6">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-green-100"
                  >
                    <CheckCircle2 size={48} />
                  </motion.div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-primary">Recebemos sua mensagem!</h3>
                    <p className="text-slate-500 font-medium">Muito obrigado pelo seu feedback. <br/>Voltando para o portal em instantes...</p>
                  </div>
                  <div className="w-full max-w-xs h-1 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3, ease: 'linear' }}
                      className="h-full bg-green-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
