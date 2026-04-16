import React from 'react';
import { Search, Mic, Brain, HeartHandshake, ShieldCheck, ChevronDown, MessageCircle, Crown } from 'lucide-react';
import { motion } from 'motion/react';

export function SupportPortal() {
  const categories = [
    {
      id: 'abordagem',
      title: 'Abordagem Inicial',
      icon: Mic,
      color: 'bg-primary/10 text-primary',
      hoverColor: 'group-hover:bg-primary group-hover:text-white',
      items: [
        { q: 'Como iniciar a conversa?', a: 'Sempre comece com um sorriso e apresente-se como representante do Hospital Pequeno Príncipe. Use frases como "Você sabia que atendemos crianças de todo o Brasil?"' },
        { q: 'Apresentação da causa', a: 'Foque no impacto social e na excelência do tratamento pediátrico oferecido há mais de 100 anos.' }
      ]
    },
    {
      id: 'objecoes',
      title: 'Tratamento de Objeções',
      icon: Brain,
      color: 'bg-secondary/20 text-on-surface',
      hoverColor: 'group-hover:bg-secondary group-hover:text-on-surface',
      items: [
        { q: '"Não tenho dinheiro agora"', a: 'Destaque que qualquer valor faz a diferença na vida de uma criança e mencione as opções de doação única recorrente de baixo valor.' },
        { q: '"Já ajudo outras ONGs"', a: 'Parabenize a atitude e explique como o apoio ao Pequeno Príncipe complementa o auxílio à saúde infantil de alta complexidade.' }
      ]
    },
    {
      id: 'valores',
      title: 'Valores do Hospital',
      icon: HeartHandshake,
      color: 'bg-surface-container-highest text-on-surface',
      hoverColor: 'group-hover:bg-primary group-hover:text-white',
      items: [
        { q: 'História e Missão', a: 'Nossa missão é promover a saúde da criança e do adolescente por meio da assistência, ensino e pesquisa.' },
        { q: 'Transparência', a: 'Publicamos relatórios anuais de auditoria e prestação de contas detalhada de todos os recursos captados.' }
      ]
    },
    {
      id: 'seguranca',
      title: 'Segurança de Dados (LGPD)',
      icon: ShieldCheck,
      color: 'bg-blue-50 text-primary-container',
      hoverColor: 'group-hover:bg-primary-container group-hover:text-white',
      items: [
        { q: 'Como os dados são protegidos?', a: 'Utilizamos criptografia de ponta a ponta e seguimos rigorosamente a Lei Geral de Proteção de Dados para garantir o sigilo dos doadores.' },
        { q: 'Formas de pagamento seguras', a: 'Trabalhamos apenas com gateways de pagamento certificados PCI DSS, o padrão ouro da indústria financeira.' }
      ]
    }
  ];

  return (
    <main className="pt-24 px-6 max-w-4xl mx-auto pb-32">
      <section className="mb-12">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-headline font-extrabold text-on-surface mb-6 tracking-tight leading-tight"
        >
          Como podemos <span className="text-primary">ajudar</span> seu trabalho hoje?
        </motion.h1>
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="text-on-surface-variant/50" size={20} />
          </div>
          <input 
            className="w-full bg-surface-container-highest border-none rounded-xl py-5 pl-14 pr-6 focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-on-surface-variant/70" 
            placeholder="O que você precisa saber hoje?" 
            type="text"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {categories.map((cat, idx) => (
          <motion.div 
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_12px_32px_rgba(25,28,30,0.04)] hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className={`w-12 h-12 ${cat.color} rounded-xl flex items-center justify-center mb-6 ${cat.hoverColor} transition-colors`}>
              <cat.icon size={24} />
            </div>
            <h3 className="text-xl font-headline font-bold mb-4">{cat.title}</h3>
            <div className="space-y-4">
              {cat.items.map((item, i) => (
                <details key={i} className="group/item">
                  <summary className="flex justify-between items-center font-semibold text-primary cursor-pointer list-none">
                    <span>{item.q}</span>
                    <ChevronDown className="group-open/item:rotate-180 transition-transform" size={20} />
                  </summary>
                  <p className="mt-3 text-on-surface-variant leading-relaxed text-sm">{item.a}</p>
                </details>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <section className="bg-primary rounded-xl p-8 mb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Crown className="text-[120px] text-white rotate-12" size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-white text-2xl font-headline font-bold mb-2">Ainda com dúvidas?</h2>
            <p className="text-white/80 max-w-md">Fale agora com nosso time de suporte especializado em captação.</p>
          </div>
          <button className="bg-secondary text-primary px-8 py-4 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2">
            <MessageCircle size={20} />
            Chamar Suporte
          </button>
        </div>
      </section>
    </main>
  );
}
