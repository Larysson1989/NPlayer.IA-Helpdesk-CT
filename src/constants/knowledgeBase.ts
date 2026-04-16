/**
 * Knowledge base for the NPlayer.IA chatbot.
 * Grounded in Hospital Pequeno Príncipe (HPP) Quality Manual.
 */
export const HPP_KNOWLEDGE = `
MANUAL DE QUALIDADE - REGRAS DE DOAÇÕES (CT) - HOSPITAL PEQUENO PRÍNCIPE

1. REGRAS GERAIS:
- Foco: Captar doadores novos.
- Verificação: Sempre verificar no sistema se já existe doação ativa antes de lançar.
- Gravação: Obrigatória para todas as doações (checklist Weon), exceto link de LP ou Multicanal.
- Destinação: Recurso livre (não vai para setor específico).

2. TIPOS DE DOADORES:
- PF e PJ (Foco principal em PF).
- Novos: Primeira vez na base.
- Renovação: Reativação após 6 meses do último pagamento. Somente RDI faz ativa; CT faz apenas receptiva.

3. FORMAS DE PAGAMENTO E VALORES:
- Cias de Energia: Copel, Cocel, Celesc. (Mínimo R$ 15,00). Doações mensais SEMPRE como INDETERMINADO.
- Débito Automático: BB, Bradesco, Itaú, Santander, Sicredi. (Mínimo R$ 15,00).
- Cartão de Crédito: Amex, Diners, Elo, Mastercard, Visa. (Mínimo R$ 15,00).
- PIX: Apenas para doações PONTUAIS (inferior a 12 meses). Chave: doe@hpp.org.br.
- Limite CT: Até R$ 4.999,99. Valores >= R$ 5.000,00 vão para PEP.

4. PARCELAS:
- Continuada: >= 12 meses.
- Pontual: < 12 meses (Obrigatório ofertar PIX).

5. LANÇAMENTO E MULTICANAL:
- Cadastro: Sempre em nome do titular.
- Prazo: Lançar no mês vigente da gravação.
- Multicanal (WhatsApp): Válido para Copel e Débito Automático. Exige texto padrão de autorização e print no Bell. Não precisa de checklist gravado.

6. INELEGIBILIDADE E REGRAS CRÍTICAS:
- Inelegível: Reativação > 2 vezes na mesma UC/conta se nunca caiu doação.
- Outro Bloco: Proibido induzir cancelamento de outro bloco. Se o doador pedir, avisar gestor.
- LGPD: Informar que a ligação é gravada ANTES de coletar dados.
- Inaptidão: Não lançar se o doador não puder tomar decisões sozinho (doença, etc).

7. REDE MAIS AMIGOS:
- Benefício de descontos (5% a 50%) em +500 estabelecimentos.
- Critério: Mínimo R$ 40,00 (indeterminado) ou 12 parcelas.
- R$ 60,00 (indeterminado) dá direito a 2 acessos.

8. DADOS OBRIGATÓRIOS:
- Nome titular, CPF (confirmar ao menos 2 números), Data Nascimento, Endereço Completo, Telefone, E-mail.

9. DISCURSO E ENCANTAMENTO:
- Falar de "sonhos para o futuro" (ex: construção do PP Norte).
- Não dar exatidão em números de custos (usar "aproximadamente", "cerca de").
- Checklist: Deve ser realizado ao final de todas as doações efetivadas.
`;
