/**
 * Knowledge base for the NPlayer.IA chatbot.
 * Grounded in Hospital Pequeno Príncipe (HPP) Quality Manual.
 * Fontes: Manual de Qualidade CT + 1º Dia - Conhecendo a CT + Código de Conduta Home Office
 */
export const HPP_KNOWLEDGE = `

=== SOBRE A CT — CAPTAÇÃO TELEFÔNICA ===
- Missão: "Salvando vidas através do telefone."
- A CT é responsável por captar doadores via ligação telefônica para o Hospital Pequeno Príncipe.
- Foco principal: Pessoas Físicas (PF). Persona: faixa etária entre 40 e 60 anos.
- Mobilizamos a sociedade de várias cidades e estados além do Paraná a apoiar o maior hospital pediátrico do Brasil.

=== PRODUTO — ADOTE UM LEITO ===
- Recurso de uso livre do hospital — pode ser direcionado para qualquer necessidade no momento.
- Exemplos de uso: manutenção dos leitos, reformas, compras de insumos médicos e equipamentos.
- Não vai para setor específico.

=== VALORES E PARCELAS ===
- Valor mínimo: R$ 15,00
- Valor máximo (CT): R$ 4.999,99. Acima de R$ 5.000,00 encaminhar para o PEP.
- Ticket médio: R$ 30,00.
- Doação continuada: igual ou superior a 12 meses.
- Doação pontual: inferior a 12 meses (obrigatório ofertar PIX).

=== FORMAS DE PAGAMENTO ===
- Conta de Luz (Cias de Energia): Copel, Cocel, Celesc. Mínimo R$ 15,00. Sempre lançar como INDETERMINADO.
- Cartão de Crédito: Amex, Diners, Elo, Mastercard, Visa. Mínimo R$ 15,00. Permitido contas digitais.
- Débito em Conta: BB, Bradesco, Itaú, Santander, Sicredi. Mínimo R$ 15,00. Somente conta corrente — NÃO permitido contas digitais.
- PIX: Somente pontual (inferior a 12 meses). Chave: doe@hpp.org.br. Liberado somente após período de experiência (90 dias).

=== FLUXO DE CAPTAÇÃO ===
Mailing → Ligações via Discador → Fechamento da Doação → Lançamento em Sistema → Qualidade → Financeiro → Recurso para o Hospital.

=== REGRAS GERAIS ===
- Foco: captar doadores novos.
- Verificar no sistema se já existe doação ativa antes de lançar.
- Gravação obrigatória para todas as doações (checklist Weon), exceto link de LP ou Multicanal.
- Cadastro sempre em nome do titular.
- Lançar no mês vigente da gravação.

=== TIPOS DE DOADORES ===
- Novos: Primeira vez na base.
- Renovação: Reativação após 6 meses do último pagamento. Somente RDI faz ativa; CT faz apenas receptiva.
- PF e PJ (foco principal em PF).

=== MULTICANAL (WHATSAPP) ===
- Válido para Copel e Débito Automático.
- Exige texto padrão de autorização e print no Bell.
- Não precisa de checklist gravado.

=== INELEGIBILIDADE E REGRAS CRÍTICAS ===
- Inelegível: Reativação mais de 2 vezes na mesma UC/conta se nunca caiu doação.
- Proibido induzir cancelamento de outro bloco. Se o doador pedir, avisar o gestor.
- LGPD: Informar que a ligação é gravada ANTES de coletar dados.
- Inaptidão: Não lançar se o doador não puder tomar decisões sozinho (doença, etc.).

=== REDE MAIS AMIGOS ===
- Benefício de descontos de 5% a 50% em mais de 500 estabelecimentos.
- Critério: mínimo R$ 40,00 (indeterminado) ou 12 parcelas.
- R$ 60,00 (indeterminado) dá direito a 2 acessos.

=== DADOS OBRIGATÓRIOS DO DOADOR ===
Nome do titular, CPF (confirmar ao menos 2 números), Data de Nascimento, Endereço Completo, Telefone, E-mail.

=== DISCURSO E ENCANTAMENTO ===
- Falar de "sonhos para o futuro" (ex: construção do PP Norte).
- Não dar exatidão em números de custos — usar "aproximadamente" ou "cerca de".
- Checklist deve ser realizado ao final de todas as doações efetivadas.

=== VALORES DA EQUIPE CT ===
1. SOMOS UM TIME — Pensamento coletivo, apoio mútuo, comemoramos conquistas de todos.
2. VESTIMOS A CAMISA — Cumpro combinados, me autogerencio, penso no HPP como um todo.
3. TEMOS PAIXÃO PELO DESAFIO — Me autodesafio, proponho novas ideias, tenho espírito vencedor.
4. BUSCAMOS EXCELÊNCIA CONTÍNUA — Absorvo treinamentos, me atualizo sobre o hospital, preencho sistemas com informação assertiva, busco feedback, assumo erros e melhoro.
5. FALAMOS E AGIMOS COM VERDADE E RESPEITO — Passo informações corretas sem omissões, sou coerente entre o que digo e faço, respeito diversidade de opiniões.
6. CURTIMOS A JORNADA COM FELICIDADE — Levo os dias com bom humor, me orgulho da trajetória, cuido da saúde mental.
7. PREZAMOS PELA HUMANIZAÇÃO — Comunicação assertiva e não violenta, sou empático, respeito a diversidade, sou proativo para ajudar.

=== PERFIL CHA DO CAPTADOR ===
- Comunicação, Negociação, Organização
- Criatividade, Proatividade, Auto gerenciável
- Espírito vencedor, Paixão pelo desafio, Resiliência
- Inteligência Emocional, Interesse por causas sociais

=== CÓDIGO DE CONDUTA — HOME OFFICE ===

AMBIENTE DE TRABALHO:
- Estabeleça um lugar iluminado, arejado e confortável conforme NR17.
- Não posicione o equipamento próximo a TV ou local com fluxo constante de pessoas.
- Mantenha o ambiente organizado — desorganização é fonte de distração e queda de produtividade.

EVITE DISTRAÇÕES:
- Domésticas: lavar louça, faxina, cuidar de animais ou crianças durante o expediente.
- Eletrônicas: redes sociais, internet pessoal, televisão.
- Interrupções: oriente familiares e colegas de casa a não interromperem durante o trabalho.
- Distrações reduzem foco, aumentam tempo de tarefa, diminuem qualidade e prejudicam a saúde mental.

HORÁRIOS E PAUSAS:
- Respeite os horários de entrada e saída.
- Pausas obrigatórias: modelo 10-20-10 (descanso + lanche).
- Participe da ginástica laboral — o link é enviado no grupo laboral.

SAÚDE E BEM-ESTAR:
- Beba água e alimente-se de forma saudável — cuidar da voz é parte do trabalho de captador.
- Hidratar-se bem aumenta disposição e qualidade das ligações.

USO DOS EQUIPAMENTOS:
- Use e cuide dos equipamentos conforme treinamento NR17.
- Em home office, internet e energia elétrica são responsabilidade do colaborador.

COMUNICAÇÃO E REUNIÕES:
- Esteja sempre com câmera ligada e vestimenta adequada nas reuniões.
- Seja pontual ao entrar nas reuniões.
- Interaja, dê sua opinião e faça anotações relevantes.

RESPEITO E PROFISSIONALISMO:
- Valorize as opiniões, respeite o tempo e os limites dos colegas e gestores.
- Mantenha comunicação clara e educada mesmo à distância.
- Respeito e profissionalismo fortalecem a confiança e a colaboração da equipe.
`;
