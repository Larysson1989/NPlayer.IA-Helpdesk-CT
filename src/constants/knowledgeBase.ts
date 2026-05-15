/**
 * Knowledge base for the NPlayer.IA chatbot.
 * Grounded in Hospital Pequeno Príncipe (HPP) Quality Manual.
 * Fontes: Manual CT + 1º Dia + Código de Conduta HO + Ementa Qualidade CT - Projeto Príncipe
 */
export const HPP_KNOWLEDGE = `

=== SOBRE A CT — CAPTAÇÃO TELEFÔNICA ===
- Missão: "Salvando vidas através do telefone."
- Foco principal: Pessoas Físicas (PF). Persona: faixa etária entre 40 e 60 anos.
- Mobilizamos a sociedade de várias cidades e estados além do Paraná a apoiar o maior hospital pediátrico do Brasil.

=== PRODUTO — ADOTE UM LEITO ===
- Recurso de uso livre do hospital — manutenção de leitos, reformas, insumos médicos e equipamentos.
- Não vai para setor específico.

=== VALORES E PARCELAS ===
- Valor mínimo: R$ 15,00 | Ticket médio: R$ 30,00 | Máximo CT: R$ 4.999,99 (acima → PEP).
- Doação continuada: >= 12 meses. Doação pontual: < 12 meses (obrigatório ofertar PIX).

=== FORMAS DE PAGAMENTO ===
- Conta de Luz: Copel, Cocel, Celesc. Mínimo R$ 15,00. Sempre lançar como INDETERMINADO.
- Cartão de Crédito: Amex, Diners, Elo, Mastercard, Visa. Mínimo R$ 15,00. Permitido contas digitais.
- Débito em Conta: BB, Bradesco, Itaú, Santander, Sicredi. Mínimo R$ 15,00. Somente conta corrente — NÃO permitido contas digitais.
- PIX: Somente pontual (< 12 meses). Chave: doe@hpp.org.br. Liberado após 90 dias de experiência.

=== FLUXO DE CAPTAÇÃO ===
Mailing → Ligações via Discador → Fechamento → Lançamento no Sistema → Qualidade → Financeiro → Recurso ao Hospital.

=== REGRAS GERAIS ===
- Verificar no sistema se já existe doação ativa antes de lançar.
- Gravação obrigatória (checklist Weon), exceto link de LP ou Multicanal.
- Cadastro sempre em nome do titular. Lançar no mês vigente da gravação.

=== TIPOS DE DOADORES ===
- Novos: Primeira vez na base.
- Renovação: Reativação após 6 meses do último pagamento. Somente RDI faz ativa; CT faz apenas receptiva.

=== MULTICANAL (WHATSAPP) ===
- Válido para Copel e Débito Automático.
- Exige texto padrão de autorização e print no Bell. Não precisa de checklist gravado.

=== INELEGIBILIDADE E REGRAS CRÍTICAS ===
- Inelegível: Reativação mais de 2 vezes na mesma UC/conta se nunca caiu doação.
- Proibido induzir cancelamento de outro bloco. Se o doador pedir, avisar o gestor.
- LGPD: Informar que a ligação é gravada ANTES de coletar qualquer dado pessoal.
- Inaptidão: Não lançar se o doador não puder tomar decisões sozinho.

=== REDE MAIS AMIGOS ===
- Descontos de 5% a 50% em +500 estabelecimentos.
- Critério: mínimo R$ 40,00 indeterminado ou 12 parcelas. R$ 60,00 = 2 acessos.

=== DADOS OBRIGATÓRIOS DO DOADOR ===
Nome completo, Tipo de Pessoa (PF/PJ), CPF (confirmar ao menos 2 dígitos com o doador), Data de Nascimento, Endereço Completo (CEP, Rua, Número, Complemento, Bairro, Cidade, Estado), Telefone, E-mail.

=== DISCURSO E ENCANTAMENTO ===
- Falar de "sonhos para o futuro" (ex: construção do PP Norte).
- Não dar exatidão em custos — usar "aproximadamente" ou "cerca de".
- Checklist realizado ao final de todas as doações efetivadas.

=== MÓDULO 1 — POSTURA E MONITORIA (DO ALÔ AO TCHAU) ===

COMPORTAMENTO OPERACIONAL — PROIBIÇÕES:
- Mastigar ou bocejar em linha.
- Demonstrar indiferença ao doador.
- Segurar ou desligar chamada de forma inadequada.

VÍCIOS DE LINGUAGEM A ELIMINAR:
- Repetitividade excessiva de "sr/sra", "tá", "aham", "tipo", "né".
- Uso de gírias em qualquer momento da ligação.

DISCURSO E RISCOS DE IMAGEM — TEMAS PROIBIDOS:
- Religião, política e orientação sexual são assuntos estritamente proibidos.
- Nunca usar palavras de baixo calão.
- Identificar inaptidão do doador (doença, confusão mental) e não lançar nesses casos.

=== MÓDULO 2 — AUDITORIA E CONFORMIDADE LGPD ===

PILARES DA AUDITORIA:
1. Gravação da ligação
2. Exatidão dos dados cadastrais
3. Checklist completo
4. Lançamento correto no sistema
5. Cumprimento das regras contratuais

LGPD NA PRÁTICA:
- O aviso "Esta ligação está sendo gravada" deve ser feito OBRIGATORIAMENTE antes de solicitar ou confirmar qualquer dado pessoal do doador.
- Sem esse aviso, a doação está em não conformidade legal.

=== MÓDULO 3 — PARAMETRIZAÇÃO DE CADASTROS (SISTEMA BELL) ===

DADOS OBRIGATÓRIOS:
- Nome completo, Tipo de Pessoa (Física/Jurídica), CPF, Data de Nascimento, Telefone, E-mail.

ESTRUTURAÇÃO DE ENDEREÇO:
- Padrão: CEP → Rua → Número → Complemento → Bairro → Cidade → Estado.
- Tratar duplicidade de endereços antes de salvar.

HISTÓRICO BELL — REGRA OBRIGATÓRIA:
- Estrutura: Telefone falado + Breve relato humanizado e relevante do atendimento.
- O histórico é base de dados institucional — deve ser claro, verdadeiro e útil para quem vier depois.

=== MÓDULO 4 — RITO DO CHECKLIST ===

REGRA DE OURO:
- O checklist é momento EXCLUSIVO de fala do captador.
- PROIBIDO usar esse momento para confirmar dados com o doador — é leitura unilateral para fins de auditoria e exigência contratual.

ESTRUTURA DO SCRIPT DE FECHAMENTO (ordem obrigatória):
1. Data
2. Nome Completo
3. CPF
4. Valor
5. Quantidade e tipo de parcelas
6. Companhia de Energia (se aplicável)
7. UC (Unidade Consumidora)
8. Vencimento
9. Endereço completo
10. Contatos (telefone e e-mail)

VOCALIZAÇÃO OBRIGATÓRIA:
- CPF: doador fala 2 dígitos → captador vocaliza o CPF completo no checklist.
- Parcelas: vocalizar quantidade E tipo (pontual ou continuada/indeterminada).

=== MÓDULO 5 — REGRAS POR COMPANHIA DE ENERGIA ===

COPEL e COCEL:
- Permite autorização por cônjuge (com dados do titular).
- Doação de terceiros: apenas com autorização do titular em linha.
- Titular falecido: autorização somente pelo cônjuge.

CELESC:
- PROIBIDA autorização por cônjuge.
- PROIBIDA doação em nome de titular falecido.
- Terceiros: apenas com autorização do titular em linha.
- Lançamento obrigatoriamente no nome do titular.

=== MÓDULO 6 — VENCIMENTOS, LANÇAMENTOS E PREVENÇÃO DE RETORNOS ===

MATRIZ DE PRAZOS (D+):
- Cartão de Crédito: D+0
- Copel / Cocel: D+9
- Celesc: D+29
- Débito em Conta: D+9 ou D+44

ESTRATÉGIA DE DÉBITO EM CONTA:
- Oferta prioritária entre os dias 05 e 15 do mês (maior adimplência).
- Evitar oferta a partir do dia 20.

ERROS CRÍTICOS QUE GERAM RETORNO (evite sempre):
- UC incorreta ou companhia de energia errada.
- Dados bancários incorretos no débito.
- Falha na autorização de terceiros.
- CPF não confirmado com o doador.
- Placa solar não identificada (inapto para débito na conta de luz).

=== VALORES DA EQUIPE CT ===
1. SOMOS UM TIME
2. VESTIMOS A CAMISA
3. TEMOS PAIXÃO PELO DESAFIO
4. BUSCAMOS EXCELÊNCIA CONTÍNUA
5. FALAMOS E AGIMOS COM VERDADE E RESPEITO
6. CURTIMOS A JORNADA COM FELICIDADE
7. PREZAMOS PELA HUMANIZAÇÃO

=== PERFIL CHA DO CAPTADOR ===
- Comunicação, Negociação, Organização
- Criatividade, Proatividade, Auto gerenciável
- Espírito vencedor, Paixão pelo desafio, Resiliência
- Inteligência Emocional, Interesse por causas sociais

=== CÓDIGO DE CONDUTA — HOME OFFICE ===

AMBIENTE:
- Local iluminado, arejado e confortável conforme NR17.
- Longe de TV ou locais com fluxo de pessoas.

DISTRAÇÕES A EVITAR:
- Domésticas: louça, faxina, animais, crianças durante expediente.
- Eletrônicas: redes sociais, TV, internet pessoal.
- Interrupções de familiares ou colegas de casa.

HORÁRIOS E PAUSAS:
- Respeitar entrada, saída e pausas obrigatórias: modelo 10-20-10.
- Participar da ginástica laboral (link enviado no grupo).

SAÚDE:
- Hidratação e alimentação saudável protegem a voz — ferramenta de trabalho do captador.

EQUIPAMENTOS:
- Cuidar conforme NR17. Internet e energia são responsabilidade do colaborador em home office.

REUNIÕES:
- Câmera ligada, vestimenta adequada, pontualidade, participação ativa com anotações.

RESPEITO E PROFISSIONALISMO:
- Comunicação clara, educada e assertiva mesmo à distância.
- Respeitar tempo, limites e opiniões de colegas e gestores.
`;
