import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Crown, MoreVertical, PlusCircle, Smile } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { parseGeminiError } from "../services/geminiService";
import { HPP_KNOWLEDGE } from '../constants/knowledgeBase';
import ReactMarkdown from 'react-markdown';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

const AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPO-NmdE1NB9QeXLddpbN7LJi7gT0WnLtAewyoIkGBhO25w2gt8YMl2WIPGcwODMN_xMW7_Fa86YAroC26D1imVz8OXxPj7p1bNgJOcqEXjeP8acCAS3PJ4di_WN-w4aDLMi35hqR7gPHEqwTgZpUWFHPhCYPPjcwaYtSmeJv6Y2UgqHoV4EtCjqpJPswMuEXSNlqv3PQB68tD1qnGxyydoLBRpImaxsJDeIFhD21Ag1tcuXaRFX98jpIhTyeldqgL86V1Z1X3i8w';
const USER_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHp1RvZmB7xBh7bUfqrdhK8P1hzcRTxwINDjS_PjKNDi1uBj3ROuw5IMXyJ0NvBx6K9AruQRaPu-RiY-QBtmxBX79FJXVeJA4OeQJfRszxAF0xFs-7tSvQBzqP_PYjfpbO_Nf5DPrchtRJu8av1w2cxhgH1OrEybIpvA9tvQ4qYMrqaSe144T2KMaTDX4p6HiguYyU3T1YtizaUCjMu08jhgMExonngGt-TWOOysocsfkBibegjx_d0W-53Co8rXhNQvOQ6DS4Q6A';

interface Message {
  role: 'user' | 'bot';
  text: string;
  time: string;
}

interface User {
  email: string;
  name: string;
  matricula?: string;
  telefone?: string;
}

const CHAT_PATTERN = `data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23004c89' fill-opacity='0.1'%3E%3Cpath d='M12 12h30c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2h-20L12 44V34h-2c-1.1 0-2-.9-2-2V14c0-1.1.9-2 2-2z'/%3E%3Cpath d='M60 55h20c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2h-12l-6 6v-6h-2c-1.1 0-2-.9-2-2V57c0-1.1.9-2 2-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E`;

export default function Chatbot({ 
  isEmbedded = false, 
  user,
  messages,
  setMessages
}: { 
  isEmbedded?: boolean, 
  user: User,
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
}) {
  const SYSTEM_PROMPT = `Você é o "Príncipe", o assistente de IA do NPlayer.IA para a equipe de captação do Hospital Pequeno Príncipe (HPP).

O usuário atual é **${user.name}**. Sempre que se referir a ele, use markdown para deixar o nome **${user.name}** em negrito.

PERSONALIDADE E COMPORTAMENTO HUMANO:
- Reatividade Natural: Responda diretamente ao que o usuário disse. Se ele apenas deu um "Oi", responda com um "Oi" caloroso chamando-o pelo nome **${user.name}** (sempre em negrito usando markdown) e pergunte como ele está ou como pode ajudar.
- Conversa, não Discurso: Mantenha a troca leve. Não use textos longos. Seja breve e atencioso.
- Empatia e Acolhimento: Use um tom de voz de um colega de trabalho que está ali para apoiar, não de um robô de suporte.
- Encantamento e Rapport: Valide o sentimento do usuário. Se ele estiver com pressa, seja rápido. Se estiver em dúvida, seja paciente.

DIRETRIZES DE ATENDIMENTO:
1. Resposta Direta: Atenda ao contexto imediato da mensagem recebida.
2. Sem Overload: Não ofereça todos os temas (valores, pagamentos, etc) se não for solicitado. Deixe a conversa fluir naturalmente.
3. Evitar Alucinações: Use a base de conhecimento apenas quando houver uma dúvida técnica. Se não souber, direcione à supervisão com gentileza.
4. Validação: Pergunte se a dúvida foi sanada apenas após uma explicação técnica.
5. NPS: Solicite a nota (0-10) apenas quando o atendimento for claramente finalizado.

BASE DE CONHECIMENTO (MANUAL DE QUALIDADE):
${HPP_KNOWLEDGE}

Lembre-se: O objetivo é ser um apoio próximo e humano para o captador brilhar no telefone.`;

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInput(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setMessages(prev => [...prev, { 
        role: 'user', 
        text: `📎 Anexo: ${file.name}`, 
        time: timeStr 
      }]);
      // Reset input
      e.target.value = '';
    }
  };

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
        model: 'gemini-3-flash-preview',
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
        <div className="flex-1 overflow-y-auto p-6 chat-scroll bg-slate-50 relative">
          <div 
            className="absolute inset-0 pointer-events-none z-0"
            style={{ 
              backgroundImage: `url("${CHAT_PATTERN}")`,
              backgroundRepeat: 'repeat',
              backgroundSize: '120px'
            }}
          />
          
          <div className="relative z-10 space-y-6 flex flex-col">
            <div className="flex justify-center">
              <span className="px-4 py-1 rounded-full bg-surface-container-highest/80 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Hoje</span>
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
                  <div className={`p-4 rounded-2xl shadow-md backdrop-blur-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary/95 text-white rounded-br-none' 
                      : 'bg-white/95 text-on-surface rounded-bl-none'
                  }`}>
                    <div className="text-sm leading-relaxed [&_strong]:font-bold [&_b]:font-bold">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
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
                <div className="bg-slate-100/80 backdrop-blur-sm px-4 py-3 rounded-2xl flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0 relative">
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full right-4 mb-4 z-[70] shadow-2xl rounded-2xl overflow-hidden"
              >
                <EmojiPicker 
                  onEmojiClick={onEmojiClick}
                  autoFocusSearch={false}
                  width={320}
                  height={400}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3 bg-surface-container-highest rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-on-surface-variant hover:text-primary transition-colors"
            >
              <PlusCircle size={20} />
            </button>
            <input 
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm placeholder:text-slate-400 py-2" 
              placeholder="Escreva sua mensagem..." 
              type="text"
            />
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`transition-colors ${showEmojiPicker ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
              >
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
