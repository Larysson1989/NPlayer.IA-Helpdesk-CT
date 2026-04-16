/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TopBar } from './components/Layout';
import Chatbot from './components/Chatbot';
import { Login } from './components/Login';
import { UserModals } from './components/UserModals';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X } from 'lucide-react';

export function BackgroundMascot() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden select-none">
      <img 
        src="https://media.licdn.com/dms/image/v2/C4D22AQGesYbMte2pNw/feedshare-shrink_800/feedshare-shrink_800/0/1639700725961?e=2147483647&v=beta&t=tCZRnF3IND35XxVwTUZMb6fGuH5aGfVLmlxrJCTBHdA" 
        alt=""
        className="w-full h-full object-cover opacity-25 transition-opacity duration-1000 grayscale-[0.2]"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

interface User {
  email: string;
  name: string;
  matricula?: string;
  telefone?: string;
  avatar?: string;
}

interface Message {
  role: 'user' | 'bot';
  text: string;
  time: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // Effect to initialize greeting message once
  if (messages.length === 0 && user) {
    setMessages([
      { 
        role: 'bot', 
        text: `Olá **${user.name}**! Tudo bem? Que bom ter você por aqui. 👑\n\nComo posso apoiar o seu trabalho hoje?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsChatOpen(true);
      // We could pass the query to the chatbot here if we had a way to initialize it with a message
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSearchQuery('');
    setMessages([]);
  };

  const AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPO-NmdE1NB9QeXLddpbN7LJi7gT0WnLtAewyoIkGBhO25w2gt8YMl2WIPGcwODMN_xMW7_Fa86YAroC26D1imVz8OXxPj7p1bNgJOcqEXjeP8acCAS3PJ4di_WN-w4aDLMi35hqR7gPHEqwTgZpUWFHPhCYPPjcwaYtSmeJv6Y2UgqHoV4EtCjqpJPswMuEXSNlqv3PQB68tD1qnGxyydoLBRpImaxsJDeIFhD21Ag1tcuXaRFX98jpIhTyeldqgL86V1Z1X3i8w';

  return (
    <div className="min-h-screen flex flex-col bg-transparent relative">
      <BackgroundMascot />
      <UserModals 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdateUser={setUser}
      />
      <div className="relative z-10 min-h-screen flex flex-col">
        <TopBar 
          onLogout={handleLogout} 
          user={user} 
          onProfileClick={() => setIsProfileModalOpen(true)} 
        />
        
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-full max-w-[1400px] mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[28px] font-headline font-bold text-primary mb-8 leading-tight tracking-tight w-full"
            >
              Olá <span className="text-secondary font-bold">@{user.name}</span>, o que vamos aprender juntos hoje?
            </motion.h1>

            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSearchSubmit}
              className="relative group max-w-3xl mx-auto"
            >
              <div className="absolute left-8 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
                <Search size={28} />
              </div>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Escreva aqui sua dúvida..."
                className="w-full bg-white border-2 border-primary/5 rounded-[32px] py-7 pl-20 pr-40 text-xl shadow-2xl shadow-primary/5 focus:ring-8 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all placeholder:text-slate-300 font-medium"
              />
              <button 
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary text-white px-10 py-4 rounded-[24px] font-bold shadow-lg hover:scale-105 active:scale-95 transition-all text-lg"
              >
                Buscar
              </button>
            </motion.form>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-20 flex flex-wrap justify-center gap-5"
            >
              {['Como abordar um doador?', 'Valores do HPP', 'Segurança de dados', 'Script de captação'].map((tag) => (
                <button 
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag);
                    setIsChatOpen(true);
                  }}
                  className="bg-white px-8 py-4 rounded-2xl text-base font-bold text-primary/60 border border-primary/5 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-md hover:shadow-xl"
                >
                  {tag}
                </button>
              ))}
            </motion.div>
          </div>
        </main>
        
        {/* Floating Chatbot Access */}
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
          <AnimatePresence>
            {isChatOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="w-[350px] sm:w-[450px] h-[650px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
              >
                <div className="bg-primary p-4 flex justify-between items-center text-white">
                  <div className="flex items-center gap-3">
                    <img src={AVATAR} alt="Príncipe" className="w-8 h-8 rounded-full border-2 border-white/20" />
                    <span className="font-bold">Príncipe</span>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/10 p-1 rounded-lg">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <Chatbot isEmbedded={true} user={user} messages={messages} setMessages={setMessages} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-20 h-20 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden border-4 border-secondary group"
          >
            <img src={AVATAR} alt="Chat" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
