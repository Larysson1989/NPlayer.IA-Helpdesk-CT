import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { parseGeminiError } from '../services/geminiService';
import { HPP_KNOWLEDGE } from '../constants/knowledgeBase';
import ReactMarkdown from 'react-markdown';

const AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPO-NmdE1NB9QeXLddpbN7LJi7gT0WnLtAewyoIkGBhO25w2gt8YMl2WIPGcwODMN_xMW7_Fa86YAroC26D1imVz8OXxPj7p1bNgJOcqEXjeP8acCAS3PJ4di_WN-w4aDLMi35hqR7gPHEqwTgZpUWFHPhCYPPjcwaYtSmeJv6Y2UgqHoV4EtCjqpJPswMuEXSNlqv3PQB68tD1qnGxyydoLBRpImaxsJDeIFhD21Ag1tcuXaRFX98jpIhTyeldqgL86V1Z1X3i8w';

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
  avatar?: string;
}

interface ChatViewProps {
  user: User;
  initialQuery: string;
  onBack: () => void;
}

export default function ChatView({ user, initialQuery, onBack }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const didSendInitial = useRef(false);

  const SYSTEM_PROMPT = `Você é o "Príncipe", o assistente de IA do NPlayer.IA para a equipe de captação do Hospital Pequeno Príncipe (HPP).

O usuário atual é **${user.name}**. Sempre que se referir a ele, use markdown para deixar o nome em negrito.

PERSONALIDADE E COMPORTAMENTO HUMANO:
- Reatividade Natural: Responda diretamente ao que o usuário disse.
- Conversa, não Discurso: Seja breve e atencioso. Não use textos longos.
- Empatia e Acolhimento: Tom de colega de trabalho, não de robô de suporte.
- Encantamento e Rapport: Valide o sentimento do usuário.

DIRETRIZES DE ATENDIMENTO:
1. Resposta Direta: Atenda ao contexto imediato da mensagem recebida.
2. Sem Overload: Não ofereça todos os temas se não for solicitado.
3. Evitar Alucinações: Use a base de conhecimento apenas para dúvidas técnicas.
4. Validação: Pergunte se a dúvida foi sanada apenas após uma explicação técnica.
5. NPS: Solicite nota (0-10) apenas quando o atendimento for claramente finalizado.

BASE DE CONHECIMENTO:
${HPP_KNOWLEDGE}`;

  const getTime = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', text: text.trim(), time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    resetTextarea();
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('Chave de API não configurada.');

      const ai = new GoogleGenAI({ apiKey });

      // ✅ CORRIGIDO: gemini-2.0-flash → gemini-2.5-flash
      const result = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: text.trim(),
        config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.7 },
      });

      const botMsg: Message = { role: 'bot', text: '', time: getTime() };
      setMessages(prev => [...prev, botMsg]);
      let fullResponse = '';

      for await (const chunk of result) {
        if (chunk.text) {
          fullResponse += chunk.text;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], text: fullResponse };
            return updated;
          });
        }
      }
    } catch (err: any) {
      const errorMessage = parseGeminiError(err);
      setMessages(prev => [...prev, { role: 'bot', text: errorMessage, time: getTime() }]);
    } finally {
      setLoading(false);
    }
  };

  // Envia a query inicial automaticamente
  useEffect(() => {
    if (initialQuery && !didSendInitial.current) {
      didSendInitial.current = true;
      sendMessage(initialQuery);
    }
  }, []);

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const resetTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleTextareaInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const firstName = user.name.split(' ')[0];

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* ── HEADER ── */}
      <header className="h-16 border-b border-slate-200 flex items-center gap-4 px-6 bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <img src={AVATAR} alt="Príncipe" className="w-9 h-9 rounded-full object-cover border-2 border-primary/20" />
          <div>
            <p className="font-bold text-sm text-slate-800 leading-none">Príncipe</p>
            <p className="text-xs text-emerald-500 font-medium mt-0.5">Online</p>
          </div>
        </div>
        <div className="ml-auto">
          <span className="text-xl font-bold text-primary tracking-tight">
            NPlayer.<span className="text-yellow-400">IA</span>
          </span>
        </div>
      </header>

      {/* ── MENSAGENS ── */}
      <main className="flex-1 overflow-y-auto px-4 py-8 bg-slate-50">
        <div className="max-w-3xl mx-auto w-full space-y-6">

          {/* Aguardando primeira resposta */}
          {messages.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <img src={AVATAR} alt="Príncipe" className="w-16 h-16 rounded-full mx-auto mb-4 border-4 border-primary/10" />
              <p className="text-slate-400 text-sm">Iniciando conversa...</p>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className="shrink-0 mt-1">
                  {msg.role === 'bot' ? (
                    <img src={AVATAR} alt="Príncipe" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                      {firstName[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Balão */}
                <div className={`flex flex-col gap-1 max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <p className="text-[11px] font-medium text-slate-400 px-1">
                    {msg.role === 'bot' ? 'Príncipe' : firstName} · {msg.time}
                  </p>
                  <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'
                  }`}>
                    {msg.role === 'bot' ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>,
                          li: ({ children }) => <li>{children}</li>,
                          code: ({ children }) => (
                            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <img src={AVATAR} alt="Príncipe" className="w-8 h-8 rounded-full object-cover shrink-0 mt-1" />
              <div className="bg-white border border-slate-100 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ── INPUT ── */}
      <div className="border-t border-slate-200 bg-white px-4 py-4 shrink-0">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-end gap-3 bg-slate-100 rounded-2xl px-4 py-3">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onInput={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem... (Enter para enviar)"
              disabled={loading}
              className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-800 placeholder:text-slate-400 max-h-40 leading-relaxed disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="shrink-0 w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Enviar"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            O NPlayer.IA pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </div>

    </div>
  );
}
