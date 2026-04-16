import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Crown, MoreVertical, PlusCircle, Smile } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { parseGeminiError } from "../services/geminiService";
import { HPP_KNOWLEDGE } from '../constants/knowledgeBase';

const AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPO-NmdE1NB9QeXLddpbN7LJi7gT0WnLtAewyoIkGBhO25w2gt8YMl2WIPGcwODMN_xMW7_Fa86YAroC26D1imVz8OXxPj7p1bNgJOcqEXjeP8acCAS3PJ4di_WN-w4aDLMi35hqR7gPHEqwTgZpUWFHPhCYPPjcwaYtSmeJv6Y2UgqHoV4EtCjqpJPswMuEXSNlqv3PQB68tD1qnGxyydoLBRpImaxsJDeIFhD21Ag1tcuXaRFX98jpIhTyeldqgL86V1Z1X3i8w';
const USER_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHp1RvZmB7xBh7bUfqrdhK8P1hzcRTxwINDjS_PjKNDi1uBj3ROuw5IMXyJ0NvBx6K9AruQRaPu-RiY-QBtmxBX79FJXVeJA4OeQJfRszxAF0xFs-7tSvQBzqP_PYjfpbO_Nf5DPrchtRJu8av1w2cxhgH1OrEybIpvA9tvQ4qYMrqaSe144T2KMaTDX4p6HiguYyU3T1YtizaUCjMu08jhgMExonngGt-TWOOysocsfkBibegjx_d0W-53Co8rXhNQvOQ6DS4Q6A';

interface Message {
  role: 'user' | 'bot';
  text: string;
  time: string;
}

const SYSTEM_PROMPT = `Você é o assistente virtual do NPlayer.IA, chamado "Príncipe".
Você tem dois objetivos principais:
1. SUPORTE AO SISTEMA NPLAYER.IA: Explicar funcionalidades, formatos de áudio e como usar a plataforma.
2. APOIO À EQUIPE DO HOSPITAL PEQUENO PRÍNCIPE (HPP): Orientar sobre captação, abordagem e valores institucionais.

BASE DE CONHECIMENTO (HPP):
${HPP_KNOWLEDGE}

Seja sempre cordial, objetivo e empático. Responda em português brasileiro.`;

export default function Chatbot({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'bot', 
      text: 'Olá! Eu sou o Príncipe, seu guia assistente. 👑\n\nEstou aqui para ajudar você a dominar o NPlayer.IA e compartilhar as melhores dicas de captação de recursos para o Hospital Pequeno Príncipe.\n\nComo posso facilitar seu trabalho hoje?',
      time: '14:02'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText, time: timeStr }]);
    setLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('Chave de API não configurada.');

      const ai = new GoogleGenAI({ apiKey });
      
      const result = await ai.models.generateContentStream({
        model: 'gemini-1.5-flash',
        contents: userText,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.7,
        }
      });

      setMessages(prev => [...prev, { role: 'bot', text: '', time: timeStr }]);
      let fullResponse = '';
      
      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullResponse += chunkText;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], text: fullResponse };
            return updated;
          });
        }
      }
    } catch (err: any) {
      console.error("Erro no Chatbot:", err);
      const errorMessage = parseGeminiError(err);
      setMessages(prev => [...prev, { role: 'bot', text: errorMessage, time: timeStr }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`flex-1 flex flex-col items-center justify-center bg-surface-container-low ${isEmbedded ? 'h-full w-full' : 'mt-16 pb-20 md:pb-0 md:pt-4 h-[calc(100vh-4rem)]'}`}>
      <div className={`w-full flex flex-col bg-surface-container-lowest overflow-hidden relative ${isEmbedded ? 'h-full' : 'max-w-2xl h-full md:rounded-3xl shadow-[0_12px_32px_rgba(25,28,30,0.04)]'}`}>
        {/* Chat Header - Only show if not embedded */}
        {!isEmbedded && (
          <div className="flex items-center justify-between px-6 py-4 bg-primary text-white shrink-0">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-lg overflow-hidden">
                  <img src={AVATAR} alt="Príncipe" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-secondary rounded-full border-2 border-primary"></div>
              </div>
              <div>
                <h2 className="font-headline text-lg font-bold tracking-tight leading-none">Príncipe</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                  <span className="text-xs font-medium text-white/80">Online</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 chat-scroll bg-gradient-to-b from-white to-surface-container-low">
          <div className="flex justify-center">
            <span className="px-4 py-1 rounded-full bg-surface-container-highest text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Hoje</span>
          </div>

          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end ml-auto' : 'items-start'} max-w-[85%]`}
            >
              <div className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${msg.role === 'bot' ? 'bg-primary/10' : ''}`}>
                  <img 
                    src={msg.role === 'bot' ? AVATAR : USER_AVATAR} 
                    alt={msg.role} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className={`p-4 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-br-none' 
                    : 'bg-white text-on-surface rounded-bl-none'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] text-slate-400 ${msg.role === 'user' ? 'mr-10' : 'ml-10'}`}>
                {msg.time}
              </span>
            </motion.div>
          ))}

          {loading && messages[messages.length - 1].role === 'user' && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                <img src={AVATAR} alt="Bot" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="bg-slate-100 px-4 py-3 rounded-2xl flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-3 bg-surface-container-highest rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <PlusCircle size={20} />
            </button>
            <input 
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-400 py-2" 
              placeholder="Escreva sua mensagem..." 
              type="text"
            />
            <div className="flex items-center gap-2">
              <button className="text-on-surface-variant hover:text-primary transition-colors">
                <Smile size={20} />
              </button>
              <button 
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-primary hover:bg-primary-container text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
