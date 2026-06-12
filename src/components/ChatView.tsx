import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Loader2, Download, Copy, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { parseGeminiError } from '../services/geminiService';
import { submitCorrection } from '../services/correctionService';
import { registrarMensagem, avaliarMensagem } from '../services/metricsService';
import { HPP_KNOWLEDGE } from '../constants/knowledgeBase';
import ReactMarkdown from 'react-markdown';

const AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPO-NmdE1NB9QeXLddpbN7LJi7gT0WnLtAewyoIkGBhO25w2gt8YMl2WIPGcwODMN_xMW7_Fa86YAroC26D1imVz8OXxPj7p1bNgJOcqEXjeP8acCAS3PJ4di_WN-w4aDLMi35hqR7gPHEqwTgZpUWFHPhCYPPjcwaYtSmeJv6Y2UgqHoV4EtCjqpJPswMuEXSNlqv3PQB68tD1qnGxyydoLBRpImaxsJDeIFhD21Ag1tcuXaRFX98jpIhTyeldqgL86V1Z1X3i8w';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

interface Message {
  role: 'user' | 'bot';
  text: string;
  time: string;
  // ID do registro no chat_logs (apenas mensagens do bot)
  chatLogId?: string;
  // avaliação já dada para esta mensagem (null = ainda não avaliou)
  satisfacao?: 1 | 3 | null;
}

interface User {
  id: string;
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
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionTitle, setCorrectionTitle] = useState('Informação incorreta');
  const [correctionDescription, setCorrectionDescription] = useState('');
  const [savingCorrection, setSavingCorrection] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const didSendInitial = useRef(false);
  const sessionId = useRef<string>(generateUUID());

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

      const result = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: text.trim(),
        config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.7 },
      });

      // Adiciona mensagem do bot com texto vazio (será atualizado via streaming)
      const botMsg: Message = { role: 'bot', text: '', time: getTime(), chatLogId: undefined, satisfacao: null };
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

      // Grava no banco e captura o ID para uso na avaliação
      const chatLogId = await registrarMensagem(user.id, user.name, text.trim(), {
        resposta:   fullResponse,
        session_id: sessionId.current,
      }).catch(() => null);

      // Salva o chatLogId na última mensagem do bot
      if (chatLogId) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], chatLogId };
          return updated;
        });
      }
    } catch (err: any) {
      const errorMessage = parseGeminiError(err);
      setMessages(prev => [...prev, { role: 'bot', text: errorMessage, time: getTime() }]);

      registrarMensagem(user.id, user.name, text.trim(), {
        session_id: sessionId.current,
      }).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const handleAvaliar = async (msgIndex: number, nota: 1 | 3) => {
    const msg = messages[msgIndex];
    if (!msg.chatLogId || msg.satisfacao !== null) return;

    // Otimista: atualiza UI imediatamente
    setMessages(prev => {
      const updated = [...prev];
      updated[msgIndex] = { ...updated[msgIndex], satisfacao: nota };
      return updated;
    });

    // Persiste no banco (fire-and-forget)
    avaliarMensagem(msg.chatLogId, nota).catch(() => {});
  };

  useEffect(() => {
    if (initialQuery && !didSendInitial.current) {
      didSendInitial.current = true;
      sendMessage(initialQuery);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const resetTextarea = () => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
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

  const buildConversationContext = () => {
    const header = [
      'NPlayer.IA - Contexto da Conversa',
      `Usuário: ${user.name}`,
      `E-mail: ${user.email}`,
      `Data: ${new Date().toLocaleString('pt-BR')}`,
      '',
      '--- INÍCIO DO DIÁLOGO ---',
      '',
    ].join('\n');

    const body = messages
      .map((msg) => {
        const author = msg.role === 'user' ? user.name : 'Príncipe';
        return `[${author} - ${msg.time}]\n${msg.text}\n`;
      })
      .join('\n');

    return `${header}${body}\n--- FIM DO DIÁLOGO ---`;
  };

  const handleDownloadTxt = () => {
    const context = buildConversationContext();
    const blob = new Blob([context], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contexto-conversa-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyContext = async () => {
    try {
      await navigator.clipboard.writeText(buildConversationContext());
    } catch {
      // silent
    } finally {
      setShowCopyModal(true);
    }
  };

  const handleOpenCorrectionModal = () => {
    setCorrectionTitle('Informação incorreta');
    setCorrectionDescription('');
    setCorrectionError(null);
    setShowCorrectionModal(true);
  };

  const handleCancelCorrection = () => {
    setCorrectionTitle('Informação incorreta');
    setCorrectionDescription('');
    setCorrectionError(null);
    setShowCorrectionModal(false);
  };

  const handleSubmitCorrection = async () => {
    if (!correctionDescription.trim()) return;
    setSavingCorrection(true);
    setCorrectionError(null);
    try {
      await submitCorrection({
        user_email: user.email,
        user_name: user.name,
        title: correctionTitle,
        description: correctionDescription,
        conversation_context: buildConversationContext(),
      });
      setShowCorrectionModal(false);
      setCorrectionTitle('Informação incorreta');
      setCorrectionDescription('');
      setShowSuccessModal(true);
    } catch {
      setCorrectionError('Erro ao enviar. Tente novamente.');
    } finally {
      setSavingCorrection(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* ── HEADER ── */}
      <header className="h-16 border-b border-slate-200 flex items-center gap-4 px-6 bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500" aria-label="Voltar">
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

          {messages.length === 0 && !loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
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
                <div className="shrink-0 mt-1">
                  {msg.role === 'bot' ? (
                    <img src={AVATAR} alt="Príncipe" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                      {firstName[0].toUpperCase()}
                    </div>
                  )}
                </div>

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

                  {/* Botões de satisfação — só em mensagens do bot com chatLogId */}
                  {msg.role === 'bot' && msg.chatLogId && (
                    <div className="flex items-center gap-1.5 px-1 mt-0.5">
                      {msg.satisfacao === null ? (
                        <>
                          <span className="text-[10px] text-slate-400 mr-0.5">Essa resposta foi útil?</span>
                          <button
                            onClick={() => handleAvaliar(i, 3)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                            title="Sim, foi útil"
                            aria-label="Resposta útil"
                          >
                            <ThumbsUp size={13} />
                          </button>
                          <button
                            onClick={() => handleAvaliar(i, 1)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-50 transition-colors"
                            title="Não foi útil"
                            aria-label="Resposta não útil"
                          >
                            <ThumbsDown size={13} />
                          </button>
                        </>
                      ) : (
                        <span className={`text-[10px] font-medium flex items-center gap-1 ${
                          msg.satisfacao === 3 ? 'text-emerald-500' : 'text-red-400'
                        }`}>
                          {msg.satisfacao === 3
                            ? <><ThumbsUp size={11} /> Obrigado pelo feedback!</>
                            : <><ThumbsDown size={11} /> Feedback registrado</>}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
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
          <div className="bg-slate-100 rounded-2xl px-4 py-3">
            <div className="flex items-end gap-3">
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
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={handleDownloadTxt} disabled={messages.length === 0}
                  className="w-9 h-9 rounded-xl bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label="Baixar TXT" title="Baixar TXT">
                  <Download size={16} />
                </button>
                <button type="button" onClick={handleCopyContext} disabled={messages.length === 0}
                  className="w-9 h-9 rounded-xl bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label="Copiar contexto" title="Copiar">
                  <Copy size={16} />
                </button>
                <button type="button" onClick={handleOpenCorrectionModal} disabled={messages.length === 0}
                  className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label="Registrar correção" title="Correção">
                  <AlertTriangle size={16} />
                </button>
                <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                  className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Enviar" title="Enviar">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            O NPlayer.IA pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </div>

      {/* Modal: copiado */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Copy size={18} /></div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Conteúdo copiado</h3>
                <p className="text-sm text-slate-500">O contexto da conversa foi copiado com sucesso.</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setShowCopyModal(false)} className="h-10 px-4 rounded-xl bg-primary text-white hover:bg-blue-700 transition-colors">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: sucesso correção */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-slate-200 p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Ocorrência registrada!</h3>
            <p className="text-sm text-slate-500 mb-6">Obrigado pelo feedback. Sua correção foi enviada com sucesso.</p>
            <button type="button" onClick={() => setShowSuccessModal(false)} className="h-10 px-6 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors font-medium">Fechar</button>
          </div>
        </div>
      )}

      {/* Modal: registrar correção */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 p-6">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-800">Registrar correção</h3>
              <p className="text-sm text-slate-500 mt-1">Informe o tipo da ocorrência e descreva o problema encontrado.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Título da correção</label>
                <select value={correctionTitle} onChange={(e) => setCorrectionTitle(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary">
                  <option>Informação incorreta</option>
                  <option>Resposta duvidosa</option>
                  <option>Contexto incompleto</option>
                  <option>Procedimento inadequado</option>
                  <option>Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Descrição</label>
                <textarea
                  rows={6}
                  value={correctionDescription}
                  onChange={(e) => setCorrectionDescription(e.target.value.slice(0, 1000))}
                  placeholder="Descreva com detalhes o que estava errado, duvidoso ou incompleto..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none resize-none focus:border-primary"
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{correctionDescription.length}/1000</p>
              </div>
              {correctionError && <p className="text-sm text-red-500">{correctionError}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={handleCancelCorrection} className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
              <button type="button" onClick={handleSubmitCorrection} disabled={savingCorrection || !correctionDescription.trim()}
                className="h-10 px-4 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {savingCorrection ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
