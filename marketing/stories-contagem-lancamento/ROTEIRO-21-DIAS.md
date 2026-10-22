# Contagem regressiva do app: 21 stories, uma funcionalidade por dia

Como usar: um bloco por dia, na ordem de postar, de 20/10 (faltam 21) a 09/11 (falta 1); cada stories tem 4 quadros de até 15 palavras, a tela do dia está em `telas/` com o recorte no Q3, e o que depende de você está no fim, em Decisões do Pedro.

Tudo é do plano ME (Simples Nacional), nunca em sequência de MEI. O app chega dia 10 de novembro (sua decisão de 14/10). Nenhuma funcionalidade está confirmada pro dia 10 até o aceite de 03/11.

## Status

| Dia | Data | Faltam | Código | Funcionalidade | Semáforo | No lançamento | Q4 | Tela |
|---|---|---|---|---|---|---|---|---|
| 1 | 20/10, terça | 21 | 2.1 | O DAS do mês: valor, vencimento e composição | verde | não confirmada | enquete | 20-10 2.1 Guia do mês.png |
| 2 | 21/10, quarta | 20 | 3.1 | Emitir NFS-e pedindo só valor e cliente | verde | não confirmada | enquete | 21-10 3.1 Nota fiscal.png |
| 3 | 22/10, quinta | 19 | 4.1 | Pró-labore interativo: mexe e vê o imposto mudar | verde | não confirmada | enquete | 22-10 4.1 Pró-labore interativo.png |
| 4 | 23/10, sexta | 18 | 5.2 | Declarações entregues: DEFIS, DCTF, SPED | amarelo | não confirmada | lista | 23-10 5.2 Declarações entregues.png |
| 5 | 24/10, sábado | 17 | 4.5 | Guia do INSS do pró-labore | verde | não confirmada | teste | 24-10 4.5 Guia do INSS do pró-labore.png |
| 6 | 25/10, domingo | 16 | 8.1 | Cadastro do colaborador: PIS, cargo, dependentes | amarelo | não confirmada | enquete | sem tela |
| 7 | 26/10, segunda | 15 | 4.2 | Fator R com alerta antes de virar a faixa | verde | não confirmada | lista | 26-10 4.2 Aviso do Fator R.png |
| 8 | 27/10, terça | 14 | 6.1 | Documentos da empresa num lugar só | amarelo | não confirmada | enquete | 27-10 6.1 Documentos num lugar só.png |
| 9 | 28/10, quarta | 13 | 8.4 | Guias da folha: INSS, FGTS e IRRF | amarelo | não confirmada | lista | sem tela |
| 10 | 29/10, quinta | 12 | 4.6 | Duplo vínculo: CLT e sócio na mesma conta | verde | não confirmada | enquete | 29-10 4.6 Duplo vínculo.png |
| 11 | 30/10, sexta | 11 | 5.3 | Calendário de obrigações do mês | amarelo | não confirmada | enquete | 30-10 5.3 Calendário de obrigações.png |
| 12 | 31/10, sábado | 10 | 4.4 | Recibo de pró-labore e informe de rendimentos | amarelo | não confirmada | enquete | sem tela |
| 13 | 01/11, domingo | 9 | 8.2 | Lançamentos do mês e fechamento da competência | amarelo | não confirmada | enquete | sem tela |
| 14 | 02/11, segunda | 8 | 5.4 | Vigília fiscal preditiva: avisa antes do problema | verde | não confirmada | enquete | 02-11 5.4 Vigília fiscal.png |
| 15 | 03/11, terça | 7 | 8.3 | Holerite e demonstrativo de pagamento | amarelo | não confirmada | enquete | sem tela |
| 16 | 04/11, quarta | 6 | 4.8 | Alterar pró-labore de mês já processado | amarelo | não confirmada | lista | sem tela |
| 17 | 05/11, quinta | 5 | 6.3 | Emissão de certidão negativa | amarelo | não confirmada | enquete | 05-11 6.3 Certidão negativa.png |
| 18 | 06/11, sexta | 4 | 8.7 | Desligamento e rescisão | amarelo | não confirmada | lista | sem tela |
| 19 | 07/11, sábado | 3 | 2.8 | Débito automático do DAS | amarelo | fora | enquete | sem tela |
| 20 | 08/11, domingo | 2 | 8.5 | Obrigações mensais: eSocial, EFD-Reinf, DCTFWeb | amarelo | não confirmada | teste | 08-11 8.5 Obrigações da folha.png |
| 21 | 09/11, segunda | 1 | 5.6 | Relatórios contábeis: DRE, balanço, razão | amarelo | não confirmada | lista | 09-11 5.6 Relatórios.png |

## O ritmo

Abre com o que mexe no dia a dia (a guia do mês e a nota fiscal) e põe as verdes na frente: seis das sete estão nos dez primeiros dias. Nenhuma família aparece em dois dias seguidos. A folha se espalha em seis dias, de 25/10 a 08/11, e os relatórios ficam em 23/10 e 09/11. Ganchos parecidos ficam a 4 dias ou mais um do outro, e o mesmo aviso do Fator R cai em 26/10 e 02/11. As amarelas ocupam o fim, com o débito automático (o único fora do lançamento) em 07/11.

Lista de espera em 6 dias, nunca em dias seguidos: 1 na semana de 20 a 25/10 (23/10), 2 na de 26/10 a 01/11 (26/10 e 28/10), 2 na de 02 a 08/11 (04/11 e 06/11) e 1 no 09/11. Os de outubro caem nos dias de peça de Conversão do feed. Nos outros dias, o Q4 é enquete ou teste.

## 20/10, terça · faltam 21

**Funcionalidade:** 2.1 O DAS do mês: valor, vencimento e composição (Impostos, plano ME) · verde · não confirmada pro dia 10/11

**Objetivo:** engajamento (enquete no Q4)

**Dor:** Todo mês chega um imposto sem explicação: quanto é, quando vence e de onde saiu aquele número.

**Problema:** O DAS, a guia mensal da ME, é a soma de seis tributos (imposto de renda da empresa, contribuição sobre o lucro, contribuição sobre o faturamento, PIS, INSS da empresa e imposto da prefeitura), cada um arredondado separado, e vence no dia 20 do mês seguinte, indo pro próximo dia útil se cair em dia não útil (F077, F078). Por isso faturamento vezes alíquota erra centavo e o valor parece sair do nada: na conta conferida, R$ 7.910 vezes 6% dava R$ 474,60 e a guia da Receita saiu R$ 474,59 (F078). E a guia tem duas datas que se confundem, a de quando fica disponível e a de quando vence (nó I8 do cru de Impostos).

**Benefício:** No plano ME, o app mostra o DAS do mês sem a pessoa pedir: o valor, a data de vencimento e a composição aberta por tributo, as seis partes já arredondadas somando a guia, com o imposto da prefeitura dentro dela (cartão 2.1 do Léo; nós I29 e I30). A guia é apurada e emitida sozinha no fechamento do mês e aparece em Impostos com valor, vencimento e código de barras (P2.1). O cálculo foi conferido 46 vezes contra guia real (F043). Quem paga é a pessoa, no banco dela (F040).

**Tela:** `telas/20-10 2.1 Guia do mês.png` (captura `impostos.png` de 02/10; o recorte está no Q3)

**Q1** “Quem tem ME conhece essa: a guia de imposto que chega sem explicação.”  
Visual: fundo papel quente, 'guia de imposto' em coral. Figurinha: a contagem regressiva da série.  
Gancho: G57 da curadoria (reels-leo/references/ganchos.md, Gatilhos de Identificação: 'Quem é MEI conhece essa: guia que ninguém explicou'), adaptado pra ME e trocando 'ninguém explicou' por 'chega sem explicação', pra mirar a guia e não o contador de ninguém. Entrega com F040 e F078.

**Q2** “A guia do mês, o DAS, soma seis impostos. A conta de cabeça não bate.”  
Visual: fundo papel quente, seis blocos sem sigla caindo um a um dentro de uma guia.

**Q3** “No plano ME, o imposto do mês chega pronto: valor, vencimento e a conta.”  
Visual: impostos.png, recorte só do cartão escuro ('Vence 20/07', 'Imposto do mês', R$ 178,31 nítido), com o botão 'Pagar' coberto; se recapturar o app atual, emendar o bloco 'A guia, parte por parte' de /impostos/aliquotas.

**Q4** “Você sabe de onde sai o valor do seu imposto?”  
Visual: fundo papel quente. Interação: enquete "Sei explicar" / "Pago sem saber".

**Mudanças na grade:** Q4 era a lista de espera; virou a enquete que o próprio roteiro deixou de reserva, porque 20/10 não tem peça de Conversão no feed e a semana já tem a lista de 23/10. Saíram das fontes o F007 e o F009.

## 21/10, quarta · faltam 20

**Funcionalidade:** 3.1 Emitir NFS-e pedindo só valor e cliente (Notas fiscais, plano ME) · verde · não confirmada pro dia 10/11

**Objetivo:** engajamento (enquete no Q4) · **No feed:** reel do pilar 9 (um contador com CRC responde uma dúvida de ME): dia sem venda, pela skill

**Dor:** Na hora de emitir a nota, a pessoa trava num campo que ninguém explicou e fica com medo de errar.

**Problema:** Sem o app, a nota pede os códigos que o órgão exige (atividade, serviço e município), que ninguém sabe de cabeça. Código errado sai nota errada, e o valor da nota é o que vira o imposto do mês.

**Benefício:** No app do plano ME, a pessoa diz só pra quem é a nota e o valor. Os códigos que o órgão exige já vêm preenchidos do cadastro, a gente transmite, e a nota volta pronta, com número e arquivo pra baixar (PDF e XML), e o valor já entra somado na receita do mês.

**Tela:** `telas/21-10 3.1 Nota fiscal.png` (captura `emitir.png` de 02/10; o recorte está no Q3)

**Q1** “Travou num campo da nota fiscal? Não é só você.”  
Visual: fundo papel quente, Sora. Figurinha: a contagem regressiva da série.  
Gancho: G58 da curadoria (Gatilhos de Identificação: 'Se você já travou tentando abrir empresa, não é só você'), adaptado da abertura pra nota; o molde original é o banco 958. A dor bate com o travamento real 'não saber o que preencher' da base (07 §4). O Q3 usa as palavras do G92 ('pra quem é e quanto é').

**Q2** “Sem o app, sobra campo técnico que ninguém explicou.”  
Visual: fundo papel quente, texto em tinta escura (sem coral, que não é cor de erro). Sem mostrar portal do governo.

**Q3** “No app do plano ME, a nota tem poucos campos. O código vem pronto.”  
Visual: emitir.png no recorte aprovado do broll.md (L07): "Pra quem é a nota?" e "Qual o valor?", dentro da moldura do celular, sem selo; fora do recorte o bloco "O serviço" (código de atividade e a alíquota de exemplo, P16 e P14). Valores de exemplo nítidos.

**Q4** “Quanto tempo você leva pra emitir uma nota hoje?”  
Visual: fundo papel quente. Interação: enquete "Minutos" / "Uma eternidade".

**Mudanças na grade:** Q4 era a lista de espera; 21/10 é o dia do reel do pilar 9, e a skill de stories não põe venda nesse dia. Virou uma enquete nova, sem fato e sem número (precisa do seu ok). Q3: o recorte do roteiro ia até a linha do código de atividade; o broll.md (L07) manda cortar o bloco "O serviço". Fiquei com o recorte aprovado.

## 22/10, quinta · faltam 19

**Funcionalidade:** 4.1 Pró-labore interativo: mexe e vê o imposto mudar (Pró-labore e sócios, plano ME) · verde · não confirmada pro dia 10/11

**Objetivo:** engajamento (enquete no Q4)

**Dor:** Você decide quanto se paga todo mês sem ver o que esse valor faz com o imposto.

**Problema:** O pró-labore parece um campo de valor, mas é o salário oficial do dono: puxa o INSS e o imposto de renda do sócio e, nas atividades em que o Fator R decide, a alíquota da empresa. São impostos que andam em direções opostas, e sem ver a conta o valor é escolhido no escuro ou repetido mês a mês sem saber o efeito.

**Benefício:** Na tela do pró-labore o app já traz o valor sugerido, a pessoa arrasta e vê na hora o que muda (INSS, imposto de renda e o imposto da empresa) e depois confirma o valor do mês, que segue pra declaração. A conta aparece em vez de pedir confiança, e a decisão é da pessoa: a casa só sugere (P5.2, P5.3, P5.6).

**Tela:** `telas/22-10 4.1 Pró-labore interativo.png` (captura `pro-labore.png` de 02/10; o recorte está no Q3)

**Q1** “Seu salário de dono mexe no imposto. Você já viu essa conta?”  
Visual: Fundo papel quente da marca, texto em Sora. Figurinha: a contagem regressiva da série.  
Gancho: G40 (curadoria, Educativo Rápido: "Pró-labore é o seu salário de dono"), adaptado à dor

**Q2** “Puxa o INSS da aposentadoria e o imposto de renda. Sem a conta, é chute.”  
Visual: Fundo papel quente da marca, texto em Sora.

**Q3** “No plano ME, você arrasta o valor e vê o imposto mudar na hora.”  
Visual: Tela pro-labore.png recortada só no card "E se você mudasse?", de y 1540 a 2445 (o controle de arrastar, "Sai do seu bolso por mês", Imposto e INSS). O rótulo "28% do que você fatura", na linha do valor logo acima do controle, vai coberto com o fundo branco do card (Fator R, P15). Fora do recorte: o card escuro de cima, o card "Ganhe uma folga" e tudo abaixo do controle de arrastar ("mín. R$ 1.621", o botão NF-e e a barra de abas).

**Q4** “Você ia querer ver essa conta antes de decidir quanto se paga?”  
Visual: Fundo papel quente da marca, texto em Sora. Interação: Enquete: "Sim" / "Já vejo".

## 23/10, sexta · faltam 18

**Funcionalidade:** 5.2 Declarações entregues: DEFIS, DCTF, SPED (Estar em dia, plano ME) · amarelo · não confirmada pro dia 10/11

**Objetivo:** vendas (lista de espera no Q4) · **No feed:** reel do pilar 11 (trocar de contador): dia de lista

**Dor:** O governo pede declaração todo mês e todo ano só pra confirmar o imposto que já foi pago, e esse trabalho fica invisível pra quem tem a empresa.

**Problema:** São várias declarações, cada uma com sigla e prazo próprio: a do Simples todo mês até o dia 20 (F092), a da folha todo mês no dia 15 (F101) e a anual até 31/03 (F095). Sem a anual, a do mês trava a partir de março (F097). E o dono não tem um lugar pra ver o que já foi entregue nem pra achar o comprovante.

**Benefício:** No plano ME, quem entrega as declarações é o contador com CRC, incluso na mensalidade, e o cliente não preenche nada (F094). A tela Declarações mostra o que a gente entrega ao governo, separado em todo mês e todo ano, com a situação de cada uma (entregue, no prazo) e o comprovante pra baixar, guardado também em Documentos. Pela regra da spec, a tela abre no último mês com dado, nunca num mês vazio: ela é a prova de que a contabilidade está funcionando.

**Tela:** `telas/23-10 5.2 Declarações entregues.png` (recaptura de 20/10 com o visual atual, persona fictícia P03 e data do ensaio em 31/10/2026; arquivos e cuidados em `marketing/telas-app-2026-10-20-declaracoes/LEIA-ME.md`; a de 02/10 ficou em `telas/_versoes-anteriores`)

**Q1** “Um papel pedindo outro papel. Todo dono de empresa já viu isso.”  
Visual: fundo papel quente, pilha de formulários em argila, o de cima com um carimbo apontando pro de baixo. Figurinha: a contagem regressiva da série.  
Gancho: G63 (Gatilhos de Identificação, curadoria ganchos.md), adaptado; entrega com F094

**Q2** “Declaração todo mês, outra todo ano. Cada uma com prazo e sigla própria.”  
Visual: as siglas em argila aparecendo uma por vez e virando nome de gente: 'a do Simples', 'a da folha', 'a do ano'.

**Q3** “Em breve no plano ME: o contador entrega, você só vê o comprovante.”  
Visual: recorte 2 da tela Declarações de 20/10: "Todo mês · setembro de 2026" e os três cartões com "Entregue em 12/10/2026" e "Recibo". Fora: o título e o subtítulo (repete o Q3), outubro, meses anteriores, "Todo ano" e o cartão do livro caixa. Tela fiscal, com o ok do Pedro.

**Q4** “O app chega dia 10 de novembro. Entrar na lista não cobra nem compromete.”  
Visual: fundo papel quente, a data em coral. Interação: link 'Entrar na lista' (https://www.legalizai.com.br/em-breve).

## 24/10, sábado · faltam 17

**Funcionalidade:** 4.5 Guia do INSS do pró-labore (Pró-labore e sócios, plano ME) · verde · não confirmada pro dia 10/11

**Objetivo:** engajamento (teste no Q4)

**Dor:** Todo mês aparece uma segunda guia, a do INSS do sócio, que depende de declarações que ninguém vê.

**Problema:** Pra guia do INSS do pró-labore existir, o valor precisa passar pela folha digital do governo (eSocial, dia 15) e pela declaração da folha (DCTFWeb, dia 15), e só então sai a guia (DARF, dia 20, que antecipa se cair em dia não útil). Ela junta INSS e imposto de renda e é uma por sócio.

**Benefício:** Depois que a pessoa confirma o valor do mês, a casa transmite o pró-labore, consolida a declaração e devolve a guia numerada, que aparece em Impostos junto com a guia do mês (P5.7). Uma por sócio, com o teto do INSS e a tabela do imposto de renda de cada um (F117, pacote P8). A pessoa só paga.

**Tela:** `telas/24-10 4.5 Guia do INSS do pró-labore.png` (captura `impostos_guias.png` de 02/10; o recorte está no Q3)

**Q1** “Aquele momento em que você descobre que tem uma segunda guia todo mês.”  
Visual: Fundo papel quente da marca, texto em Sora. Figurinha: a contagem regressiva da série.  
Gancho: banco 969 (Gatilhos de Identificação, reels: "Aquele momento de [situação específica em área] que todo mundo passa mas ninguém conta"), adaptado à dor

**Q2** “Ela junta INSS e imposto de renda, e depende de dois sistemas do governo.”  
Visual: Fundo papel quente da marca, texto em Sora.

**Q3** “No plano ME, a guia do INSS chega pronta, já declarada. Você só paga.”  
Visual: Tela impostos_guias.png recortada de y 1090 a 1620: "Guias de junho" e os dois cartões, "Imposto do mês" e "INSS do pró-labore" (A vencer, vence 20/07, valores de exemplo nítidos), dentro da moldura do celular, sem selo. Fora do recorte: o título, o subtítulo "Todo imposto que a gente calculou e pagou por você" (P21), o seletor do mês com o total, a busca e os filtros.

**Q4** “Salário de dono: quanto vira INSS?”  
Visual: Fundo papel quente da marca, texto em Sora. Interação: Teste: "11%, até o teto" (certa) / "Vem no imposto da empresa".

**Mudanças na grade:** a tela era o impostos.png, onde o card do INSS saía cortado na borda do carrossel ("INSS do pr", "R$ 1"). Trocada pelo impostos_guias.png, que mostra a guia do INSS do pró-labore inteira, ao lado do imposto do mês e sem botão "Pagar".

## 25/10, domingo · faltam 16

**Funcionalidade:** 8.1 Cadastro do colaborador: PIS, cargo, dependentes (Folha de pagamento, plano ME) · amarelo · não confirmada pro dia 10/11

**Objetivo:** engajamento (enquete no Q4)

**Dor:** Contratar a primeira pessoa e descobrir que o registro pede uma pilha de dados e documentos.

**Problema:** A ficha do registro pede dados pessoais, documentos (RG, CPF, o número de cadastro do trabalhador, que é o PIS, e a carteira de trabalho), filhos, cargo pela lista oficial e dependentes. Um dado errado e o envio ao governo volta recusado, e marcar dependente por padrão erra o imposto de renda do colaborador.

**Benefício:** No plano ME, o app pede a ficha campo por campo, o cargo se escolhe pelo nome na lista oficial, cada dependente vem explicado, e com o dado certo no app não precisa mandar cópia de documento. A admissão sai assinada com o certificado da empresa e o recibo fica guardado.

**Tela:** sem tela (fundo da marca)

**Q1** “Travou no registro do primeiro colaborador? Não é só você.”  
Visual: fundo papel quente, texto em Sora. Figurinha: a contagem regressiva da série.  
Gancho: G58, curadoria, Gatilhos de Identificação ("Se você já travou tentando abrir empresa, não é só você"), adaptado ao registro do colaborador

**Q2** “A ficha pede documento, filho, cargo, dependente. E cada campo vem sem explicação.”  
Visual: fundo papel quente, texto em Sora.

**Q3** “Em breve no plano ME: campo por campo no app, sem mandar cópia de documento.”  
Visual: fundo papel quente, texto em Sora; sem print (não há tela de ME desta funcionalidade na captura de 02/10).

**Q4** “Você já tem colaborador com carteira assinada?”  
Visual: fundo papel quente. Interação: enquete "Já tenho" / "Penso em contratar".

**Mudanças na grade:** Q2 era "A ficha pede documento, filho, cargo, dependente. Um dado errado e o registro volta." O "registro volta" é regra do envio ao governo que vem do vault, não do FATOS (P36, a mesma regra que trocou o Q2 de 21/10 e de 05/11). Ficou a dor, sem regra.

## 26/10, segunda · faltam 15

**Funcionalidade:** 4.2 Fator R com alerta antes de virar a faixa (Pró-labore e sócios, plano ME) · verde · não confirmada pro dia 10/11

**Objetivo:** vendas (lista de espera no Q4) · **No feed:** reel do pilar 12 (pró-labore): dia de lista

**Dor:** Descobrir que o imposto da empresa subiu só quando a guia chega mais cara.

**Problema:** Nas atividades em que o Fator R decide (15 dos 87 CNAEs de ME atendidos), a alíquota depende da folha paga, pró-labore incluído, sobre o faturamento dos últimos 12 meses. A conta olha pra trás e muda todo mês, até sem ninguém mexer em nada, e o pró-labore pago hoje só faz efeito nos meses seguintes. Quem só olha o mês corrente percebe tarde.

**Benefício:** O app acompanha a conta dos 12 meses e avisa, no app, quando a empresa está perto de perder a tributação pelo Anexo III, com a distância e o valor de pró-labore que resolve (P5.11). Mostra o número e a folga, sem nomear o jargão e sem prometer alíquota menor. O cálculo existe e o gatilho do aviso ainda não (P5.11 amarelo): em breve.

**Tela:** `telas/26-10 4.2 Aviso do Fator R.png` (captura `pro-labore.png` de 02/10; o recorte está no Q3)

**Q1** “O imposto da sua empresa depende do seu salário de dono? Saberia antes de subir?”  
Visual: Fundo papel quente da marca, texto em Sora. Figurinha: a contagem regressiva da série.  
Gancho: banco 852 (Perguntas Que Prendem, reels: "Você saberia identificar [problema em área] antes de virar crise?"), adaptado à dor

**Q2** “Em algumas atividades, sim. E corrigir hoje só faz efeito nos meses seguintes.”  
Visual: Fundo papel quente da marca, texto em Sora.

**Q3** “Em breve no plano ME: o app avisa antes e mostra quanto falta.”  
Visual: Tela pro-labore.png recortada só no card coral "Ganhe uma folga" (o aviso com o valor que resolve). Fora do recorte: o card escuro de cima, com a pílula "No limite".

**Q4** “O app chega dia 10 de novembro. A lista não cobra nada.”  
Visual: Fundo papel quente da marca, texto em Sora. Interação: Figurinha de link "Entrar na lista" (https://www.legalizai.com.br/em-breve).

## 27/10, terça · faltam 14

**Funcionalidade:** 6.1 Documentos da empresa num lugar só (Documentos e certificado, plano ME) · amarelo · não confirmada pro dia 10/11

**Objetivo:** engajamento (enquete no Q4)

**Dor:** Pediram o contrato social ou o cartão CNPJ, e começa a caça ao papel em e-mail antigo, pasta e celular.

**Problema:** Cada documento nasce num órgão diferente (contrato na Junta, cartão CNPJ na Receita, inscrição e alvará na Prefeitura) e fica espalhado. Não existe um lugar que junte os papéis da empresa.

**Benefício:** No app do plano ME, os documentos de nascimento da empresa (contrato social, cartão CNPJ, inscrição municipal, dispensa de alvará e opção pelo Simples) ficam num lugar só, prontos pra baixar quando precisar. A mesma pasta recebe o que a pessoa entrega pra contabilidade (contrato de empréstimo, compra de bem, aporte de sócio).

**Tela:** `telas/27-10 6.1 Documentos num lugar só.png` (captura `mais_documentos.png` de 02/10; o recorte está no Q3)

**Q1** “Caçar papel da empresa em e-mail antigo: quem nunca?”  
Visual: fundo papel quente, Sora. Figurinha: a contagem regressiva da série.  
Gancho: G96 da curadoria (Gatilhos de Identificação: 'Fila de órgão pra resolver um papel: quem nunca?'), adaptado da fila pro papel espalhado. 'Caçar papel' é a palavra do mote do lançamento no reporte ao Mauro de 15/10.

**Q2** “Contrato na Junta, cartão CNPJ na Receita, inscrição na Prefeitura. Cada um num canto.”  
Visual: fundo papel quente; os três nomes entrando um por vez, cada um num canto do quadro.

**Q3** “Em breve no app do plano ME: os papéis da empresa num lugar só.”  
Visual: mais_documentos.png recortada de y 1050 a 1605 (Cartão CNPJ, dispensa de licenciamento e opção pelo Simples), dentro da moldura do celular, sem selo. O recorte pula a linha 'Certificado da condição de MEI/ME' do png de 02/10.

**Q4** “Qual papel da empresa mais te pedem?”  
Visual: fundo papel quente. Interação: enquete 'Contrato social' / 'Cartão CNPJ'.

## 28/10, quarta · faltam 13

**Funcionalidade:** 8.4 Guias da folha: INSS, FGTS e IRRF (Folha de pagamento, plano ME) · amarelo · não confirmada pro dia 10/11

**Objetivo:** vendas (lista de espera no Q4) · **No feed:** reel do pilar 10 (preço do plano): dia de lista

**Dor:** Contratou alguém e o mês, que tinha a guia do imposto, ganhou mais guia, com INSS, fundo de garantia e imposto de renda do colaborador.

**Problema:** Cada valor da folha tem a sua conta e o seu caminho: o INSS e o imposto de renda do colaborador saem pela declaração da folha e o fundo de garantia sai à parte. O valor depende de cada lançamento do mês. Na ME dos Anexos III e V, o INSS da empresa já vai dentro do DAS, a guia do imposto do mês.

**Benefício:** No plano ME, fechou a folha, as guias saem prontas e entram na mesma lista das guias do imposto do mês. O pagamento é do dono, e no app ele marca a guia como paga.

**Tela:** sem tela (fundo da marca)

**Q1** “Quem tem colaborador conhece essa: todo mês chega mais guia.”  
Visual: fundo papel quente, texto em Sora. Figurinha: a contagem regressiva da série.  
Gancho: G57, curadoria, Gatilhos de Identificação ("Quem é MEI conhece essa: guia que ninguém explicou"), adaptado pra quem tem colaborador, sem MEI, e com a dor do dia no lugar de "ninguém explicou", pelo mesmo motivo do 20/10: mirar a guia, não o contador de ninguém

**Q2** “INSS, fundo de garantia, imposto de renda. Cada um com a sua conta.”  
Visual: fundo papel quente, texto em Sora.

**Q3** “Em breve no plano ME: as guias da folha chegam prontas. Você só paga.”  
Visual: fundo papel quente, texto em Sora; sem print (impostos_guias.png não mostra guia da folha).

**Q4** “Entrar na lista não cobra nada e não te compromete.”  
Visual: fundo papel quente. Interação: link 'Entrar na lista' (https://www.legalizai.com.br/em-breve).

**Mudanças na grade:** Q1 era "Quem tem colaborador conhece essa: guia que ninguém explicou."; com colaborador, quase todo mundo já tem contador, e o "ninguém explicou" lê como recado pra ele (o 20/10 já tinha trocado pelo mesmo motivo). Q4 era "Lista de espera no link da bio", sem figurinha: a skill de stories fecha a venda com a figurinha de link da lista (o "link da bio" é do reel, P32), como nos outros quatro dias de lista.

## 29/10, quinta · faltam 12

**Funcionalidade:** 4.6 Duplo vínculo: CLT e sócio na mesma conta (Pró-labore e sócios, plano ME) · verde · não confirmada pro dia 10/11

**Objetivo:** engajamento (enquete no Q4)

**Dor:** Ter carteira assinada, ser sócio e não saber se está pagando INSS duas vezes.

**Problema:** O teto do INSS é da pessoa, não da empresa: o emprego de carteira já consome parte dele. Se a empresa não sabe do outro vínculo, o INSS do pró-labore sai como se o teto estivesse inteiro.

**Benefício:** Na abertura, que a gente faz, o app pergunta se a pessoa já contribui por fora (carteira, aposentadoria, autônomo, outra empresa), e esse dado entra no cálculo do INSS do pró-labore, pra não recolher duas vezes sobre o mesmo teto (F048, P5.3, cru L9 e L24). A tela que mostra a folga até o teto ainda não existe (nota 4.6).

**Tela:** `telas/29-10 4.6 Duplo vínculo.png` (captura `dossie_vinculo.png` de 02/10; o recorte está no Q3)

**Q1** “Carteira assinada não impede você de ser sócio. Mas muda o seu INSS.”  
Visual: Fundo papel quente da marca, texto em Sora. Figurinha: a contagem regressiva da série.  
Gancho: G21 (curadoria, Curiosidades e Fatos: "Carteira assinada não impede você de ser sócio de uma ME"), adaptado à dor

**Q2** “O teto do INSS é da pessoa. O emprego de carteira já usa parte.”  
Visual: Fundo papel quente da marca, texto em Sora.

**Q3** “No plano ME, o app pergunta isso pra não recolher duas vezes no mesmo teto.”  
Visual: Tela dossie_vinculo.png recortada na pergunta "Você já contribui pro INSS por fora?", na linha "Vale emprego de carteira, aposentadoria, autônomo ou sócio de outra empresa" e nos botões Não e Sim. O subtítulo "Isso muda o imposto que a empresa paga" fica entre a pergunta e a linha de baixo: vai coberto com o fundo da tela, não sai só no recorte.

**Q4** “Você tem carteira assinada e também é sócio?”  
Visual: fundo papel quente. Interação: enquete "Tenho os dois" / "Ainda não".

**Mudanças na grade:** Q4 era a lista de espera; virou a enquete que o próprio roteiro deixou de reserva. Com isso some a exceção dos 7 dias (o público inclui quem a gente ainda vai abrir).

## 30/10, sexta · faltam 11

**Funcionalidade:** 5.3 Calendário de obrigações do mês (Estar em dia, plano ME) · amarelo · não confirmada pro dia 10/11

**Objetivo:** engajamento (enquete no Q4) · **No feed:** reel do pilar 16 (a nota fiscal muda de nome)

**Dor:** Cada obrigação da empresa vence num dia diferente, e o dono não tem uma lista do mês que diga o que é dele e o que já está sendo feito.

**Problema:** As datas se espalham: a folha e a declaração dela no dia 15 (F102, F101), a guia do Simples e a declaração do mês no dia 20 (F077, F092), o INSS e o IR do sócio também no dia 20 (F103). E o fim de semana muda de uma pra outra: a guia do Simples vai pro dia útil seguinte e a do sócio volta pro anterior (F077, F103). Sem um calendário único, o dono confere data por data e não sabe o que é dele e o que é do contador.

**Benefício:** No plano ME, o calendário mostra as obrigações do mês dia a dia, com bolinha nos dias que têm alguma coisa, e separa o que a gente entrega ('A gente entrega, nada a fazer', 'Em preparação pela gente') do que é da pessoa (pagar a guia, emitir as notas). Pela spec, entram só as obrigações do perfil da empresa, sem lista genérica pra todo mundo.

**Tela:** `telas/30-10 5.3 Calendário de obrigações.png` (captura `obrigacoes.png` de 02/10; o recorte está no Q3)

**Q1** “Se você já se perdeu nas datas da empresa, não é só você.”  
Visual: fundo papel quente, folhas de calendário em argila caindo fora de ordem. Figurinha: a contagem regressiva da série.  
Gancho: banco 958 (Gatilhos de Identificação, reel), adaptado. Nenhum dia citado no gancho, pra não virar série de prazo (pilar 6 em standby)

**Q2** “Datas diferentes. No fim de semana, uma guia vai pra frente, outra pra trás.”  
Visual: duas guias em argila sobre um calendário, uma deslizando pra segunda, a outra recuando pra sexta.

**Q3** “Em breve no plano ME: o calendário separa o que é seu do nosso.”  
Visual: obrigacoes.png em recorte nos cards de 15/07 ('A gente entrega, nada a fazer') e 20/07 (a guia a pagar, valor de exemplo nítido), com o título 'DAS de junho' coberto (sigla sem tradução; ficam o valor e o 'Ver a guia'); cortar a faixa dos dias da semana e o card 'Declaração de julho, 31/07'.

**Q4** “Você tem todas as datas da empresa num lugar só?”  
Visual: fundo papel quente. Interação: enquete 'Tenho' / 'Tá tudo espalhado'.

## 31/10, sábado · faltam 10

**Funcionalidade:** 4.4 Recibo de pró-labore e informe de rendimentos (Pró-labore e sócios, plano ME) · amarelo · não confirmada pro dia 10/11

**Objetivo:** engajamento (enquete no Q4)

**Dor:** Precisar comprovar o que a própria empresa te pagou e não achar o papel.

**Problema:** O recibo de cada mês e o informe de rendimentos do ano dependem de alguém montar, e o informe só fecha quando a contabilidade do ano fecha sem pendência. No desenho atual, o processo do pró-labore (P5) declara e gera a guia, mas nenhum passo produz o recibo nem o informe anual.

**Benefício:** Documento gerado pelo próprio sistema, sem API externa: o recibo de cada mês e o informe do ano no mesmo lugar do pró-labore, pra baixar e usar na declaração de imposto de renda. Quando algo trava o informe, o app diz o que trava (nota 4.4; cru L28 a L32). Sem processo ainda: em breve.

**Tela:** sem tela (fundo da marca)

**Q1** “Comprovar o que a própria empresa te paga: um papel pedindo outro papel.”  
Visual: Fundo papel quente da marca, texto em Sora. Figurinha: a contagem regressiva da série.  
Gancho: G63 (curadoria, Gatilhos de Identificação: "Todo dono de empresa pequena já viu isso: um papel pedindo outro papel"), adaptado à dor

**Q2** “Recibo de cada mês, informe do ano. Quando precisa, cada um está num lugar.”  
Visual: Fundo papel quente da marca, texto em Sora.

**Q3** “Em breve no app do plano ME: os dois num lugar só, gerados pelo sistema.”  
Visual: Sem tela do app (não há captura da rota /pro-labore/comprovantes). Fundo da marca com um ícone de documento do kit; nada de tela inventada.

**Q4** “Você sabe onde está o recibo do que a empresa te pagou?”  
Visual: Fundo papel quente da marca, texto em Sora. Interação: Enquete: "Sei" / "Vou caçar".

## 01/11, domingo · faltam 9

**Funcionalidade:** 8.2 Lançamentos do mês e fechamento da competência (Folha de pagamento, plano ME) · amarelo · não confirmada pro dia 10/11

**Objetivo:** engajamento (enquete no Q4)

**Dor:** Todo mês a folha volta pra mesa: salário, desconto, falta, hora extra, comissão, adiantamento.

**Problema:** Sem ferramenta, a folha se remonta a cada mês, linha por linha, e cada exceção puxa outra conta, como o descanso semanal da falta e da hora extra. E lançar o líquido como salário diminui o INSS e o fundo de garantia do colaborador.

**Benefício:** No plano ME, o fixo de cada colaborador (salário e descontos combinados) se repete sozinho. Você só avisa as exceções do mês: falta com a data, hora extra com a quantidade, desconto com valor. O descanso semanal entra sozinho, o que não cabe na lista vai pro atendimento lançar, e a folha fecha com cada valor no lugar certo.

**Tela:** sem tela (fundo da marca)

**Q1** “Cansou de montar a folha do zero todo mês?”  
Visual: fundo papel quente, texto em Sora. Figurinha: a contagem regressiva da série.  
Gancho: banco 970, Gatilhos de Identificação ("Se você está cansado de [ciclo que se repete em área], esse vídeo tem uma explicação"), adaptado à folha do mês

**Q2** “Salário, desconto, falta, hora extra. E cada uma puxa outra conta.”  
Visual: fundo papel quente, texto em Sora.

**Q3** “Em breve no plano ME: o fixo se repete sozinho. Você avisa o que mudou.”  
Visual: fundo papel quente, texto em Sora; sem print (a tela /folha/mes não está na captura de 02/10).

**Q4** “O que mais muda na sua folha de um mês pro outro?”  
Visual: fundo papel quente. Interação: enquete "Hora extra" / "Falta".

## 02/11, segunda · faltam 8

**Funcionalidade:** 5.4 Vigília fiscal preditiva: avisa antes do problema (Estar em dia, plano ME) · verde · não confirmada pro dia 10/11

**Objetivo:** engajamento (enquete no Q4)

**Dor:** Em algumas atividades, o imposto da empresa pode mudar por causa de uma conta que fica nos bastidores, e o dono só fica sabendo quando a guia já veio diferente.

**Problema:** Nessas atividades (15 dos 87 códigos de ME atendidos, F084), quem decide entre a alíquota de por volta de 6% e a de por volta de 15,5% é o Fator R: a folha dos últimos 12 meses, com o pró-labore, dividida pelo faturamento dos 12 meses (F083, F079). Como a conta olha pra trás e só conta o que foi pago (F086), corrigir depois demora: numa simulação nossa, foram 11 meses com a folha já certa (F087).

**Benefício:** O app acompanha o Fator R dos 12 meses e avisa antes de a empresa perder o Anexo III, com a distância pros 28% e o valor de pró-labore que resolve (P5.11, o diferencial nº 2 do produto). Hoje a vigília cobre só o Fator R: o teto do ME e a virada de faixa do faturamento ainda não têm passo (estão só no cru, E20 a E23).

**Tela:** `telas/02-11 5.4 Vigília fiscal.png` (captura `avisos.png` de 02/10; o recorte está no Q3)

**Q1** “Se o seu imposto fosse mudar, você saberia antes da guia chegar?”  
Visual: fundo papel quente, uma guia em argila chegando dentro de um envelope fechado. Figurinha: a contagem regressiva da série.  
Gancho: banco 852 (Perguntas Que Prendem, reel: 'Você saberia identificar [problema em área] antes de virar crise?'), adaptado

**Q2** “Em algumas atividades, a conta do imposto olha 12 meses pra trás. Corrigir tarde demora.”  
Visual: régua de 12 meses em argila, os meses acendendo um por vez, de trás pra frente.

**Q3** “Em breve no plano ME: o app vigia essa conta e avisa antes da virada.”  
Visual: avisos.png em recorte só no card 'De olho no seu Fator R'; cortar os outros avisos.

**Q4** “Você sabia que, em algumas atividades, o quanto você se paga mexe no imposto?”  
Visual: fundo papel quente. Interação: enquete 'Sabia' / 'Não sabia'.

## 03/11, terça · faltam 7

**Funcionalidade:** 8.3 Holerite e demonstrativo de pagamento (Folha de pagamento, plano ME) · amarelo · não confirmada pro dia 10/11

**Objetivo:** engajamento (enquete no Q4)

**Dor:** No dia do pagamento o colaborador pede o holerite e o dono não tem de onde tirar.

**Problema:** O holerite precisa mostrar cada valor que o colaborador recebe e cada desconto, e alguém tem que montar o recibo de cada um, todo mês.

**Benefício:** No plano ME, quando a folha fecha, o colaborador recebe o holerite e o dono vê o valor de cada um e um relatório com todos. As guias continuam sendo do dono pagar; o colaborador só recebe o recibo.

**Tela:** sem tela (fundo da marca)

**Q1** “Dia do pagamento e o colaborador pergunta: cadê meu holerite?”  
Visual: fundo papel quente, texto em Sora. Figurinha: a contagem regressiva da série.  
Gancho: banco 967, Gatilhos de Identificação ("Você provavelmente se reconhece nessa situação: [descrição de cenário universal]"), adaptado ao pedido do holerite

**Q2** “Montar o recibo de cada um, com cada desconto, todo mês, cansa.”  
Visual: fundo papel quente, texto em Sora.

**Q3** “Em breve no plano ME: fechou a folha, sai o holerite de cada um.”  
Visual: fundo papel quente, texto em Sora; sem print (a tela /folha/mes não está na captura de 02/10).

**Q4** “Seu colaborador já te pediu o holerite?”  
Visual: fundo papel quente. Interação: enquete "Já pediu" / "Ainda não tenho colaborador".

**Mudanças na grade:** Q2 era "Cada desconto precisa aparecer no recibo. E montar um por um cansa." O "precisa aparecer" é regra do holerite que não está no FATOS (P36). Ficou o trabalho de montar, sem regra.

## 04/11, quarta · faltam 6

**Funcionalidade:** 4.8 Alterar pró-labore de mês já processado (Pró-labore e sócios, plano ME) · amarelo · não confirmada pro dia 10/11

**Objetivo:** vendas (lista de espera no Q4)

**Dor:** Perceber que o salário de dono de um mês passado ficou errado e não saber o que corrigir arrasta.

**Problema:** Mês ainda não declarado volta pro fluxo normal do mês; mês já declarado não: é retificação da declaração e exige contador. E, nas atividades em que o Fator R decide, mexer num mês de folha altera a janela de 12 meses, o que pode mudar o anexo de vários meses (cru L33 e L34).

**Benefício:** A pessoa pede a correção dentro do app, como serviço avulso com o preço aberto antes de aceitar (P4.1, P4.2), e o contador do plano ME refaz a declaração. A nota diz que o P4 cobre pedir e cobrar, não executar. Sem processo próprio: em breve.

**Tela:** sem tela (fundo da marca)

**Q1** “Precisou mudar o salário de dono de um mês passado? Não é só você.”  
Visual: Fundo papel quente da marca, texto em Sora. Figurinha: a contagem regressiva da série.  
Gancho: banco 958 (Gatilhos de Identificação, reels: "Se você já travou em [situação específica], não é só você"; a mesma base da G58 da curadoria), adaptado à dor

**Q2** “E aí vem a dúvida: dá pra corrigir? E quem corrige?”  
Visual: Fundo papel quente da marca, texto em Sora.

**Q3** “Em breve no plano ME: você pede no app e o contador refaz a declaração.”  
Visual: Sem tela do app que mostre o pedido. Fundo da marca; nada de tela inventada.

**Q4** “O app chega dia 10 de novembro. A lista não cobra nada.”  
Visual: Fundo papel quente da marca, texto em Sora. Interação: Figurinha de link "Entrar na lista" (https://www.legalizai.com.br/em-breve).

**Mudanças na grade:** Q2 era "Mês já declarado não muda num toque. Tem que refazer a declaração dele." A retificação é regra que vem do vault (nota 4.7, cru L34), não do FATOS (P36). Ficou a dor do dia, e o Q3 diz o que o app faz.

## 05/11, quinta · faltam 5

**Funcionalidade:** 6.3 Emissão de certidão negativa (Documentos e certificado, plano ME) · amarelo · não confirmada pro dia 10/11

**Objetivo:** engajamento (enquete no Q4)

**Dor:** Banco, dono do imóvel ou cliente grande pede a certidão negativa, e tirar vira mais uma tarefa de órgão no meio do dia.

**Problema:** Cada órgão (Receita e Procuradoria, Prefeitura de BH, Estado de MG) tem a sua certidão e o seu caminho. E se aparece débito, a certidão não sai, e descobrir o que travou é outra busca.

**Benefício:** No plano ME, a pessoa pede a certidão no app, escolhendo o órgão; a gente emite e entrega o documento no app. Se houver débito que impede a certidão, o app mostra qual é e o caminho. É serviço avulso, cobrado à parte.

**Tela:** `telas/05-11 6.3 Certidão negativa.png` (captura `mais_documentos.png` de 02/10; o recorte está no Q3)

**Q1** “Todo dono de empresa já ouviu: manda a certidão negativa?”  
Visual: fundo papel quente, Sora. Figurinha: a contagem regressiva da série.  
Gancho: G63 da curadoria (Gatilhos de Identificação: 'Todo dono de empresa pequena já viu isso: um papel pedindo outro papel'), adaptado: o papel pedido é a certidão negativa.

**Q2** “Ela prova que a empresa está em dia. E tirar vira mais uma tarefa.”  
Visual: fundo papel quente, texto em tinta escura.

**Q3** “Em breve no app do plano ME: você pede, a gente tira e entrega.”  
Visual: mais_documentos.png recortada de y 1680 a 1960 (título 'Certidões' e só a linha 'Certidão negativa (CND) federal, emitida em 20/07/2026'; a linha da inscrição municipal, que não é certidão, fica fora), dentro da moldura do celular, sem selo.

**Q4** “Já te pediram certidão negativa da empresa?”  
Visual: fundo papel quente. Interação: enquete 'Já pediram' / 'Ainda não'.

## 06/11, sexta · faltam 4

**Funcionalidade:** 8.7 Desligamento e rescisão (Folha de pagamento, plano ME) · amarelo · não confirmada pro dia 10/11

**Objetivo:** vendas (lista de espera no Q4)

**Dor:** Desligar um colaborador já é uma conversa difícil, e ainda vem a conta da rescisão.

**Problema:** A rescisão junta saldo de salário, férias e 13º proporcionais, aviso prévio e multa do fundo de garantia quando cabem, e cada parte tem a sua regra de INSS, fundo de garantia e imposto de renda. O desligamento ainda precisa ser informado e enviado ao governo.

**Benefício:** No plano ME, você diz o motivo; o app calcula a rescisão parte por parte, envia o desligamento ao governo e te entrega o termo de rescisão e a guia do fundo de garantia. Justa causa não é no automático: o atendimento conduz com você.

**Tela:** sem tela (fundo da marca)

**Q1** “Desligar alguém tem uma conta mais complexa do que parece.”  
Visual: fundo papel quente, texto em Sora. Figurinha: a contagem regressiva da série.  
Gancho: banco 607, Curiosidades e Fatos ("A razão pela qual [coisa aparentemente simples] é mais complexa do que parece"), adaptado à rescisão

**Q2** “Saldo de salário, férias, 13º, aviso prévio. Cada parte com a sua regra.”  
Visual: fundo papel quente, texto em Sora.

**Q3** “Em breve no plano ME: você diz o motivo, o app calcula cada parte.”  
Visual: fundo papel quente, texto em Sora; sem print (as telas /folha e /folha/desligar não estão na captura de 02/10).

**Q4** “Entrar na lista não cobra nada e não te compromete.”  
Visual: fundo papel quente. Interação: link 'Entrar na lista' (https://www.legalizai.com.br/em-breve).

**Mudanças na grade:** Q4 era "Lista de espera no link da bio", sem figurinha: a skill de stories fecha a venda com a figurinha de link da lista (o "link da bio" é do reel, P32), como nos outros dias de lista.

## 07/11, sábado · faltam 3

**Funcionalidade:** 2.8 Débito automático do DAS (Impostos, plano ME) · amarelo · fora pro dia 10/11

**Objetivo:** engajamento (enquete no Q4)

**Dor:** Todo mês a pessoa precisa lembrar do imposto e pagar guia por guia; se o vencimento passa, a conta cresce.

**Problema:** O DAS da ME vence todo mês, no dia 20 do mês seguinte (F077), e pago depois do vencimento vem multa de mora por dia, até um teto, mais juros (F100). A guia é paga pela própria pessoa, no banco dela (F040): a Legalizaí não intermedia pagamento, decisão travada em 27/07 (nó I9 do cru de Impostos). Débito automático tiraria o lembrar do caminho, mas exige mandato bancário, o mesmo problema da cobrança recorrente (nota 2.8 e nó I35).

**Benefício:** Pela nota do vault, o débito automático do DAS seria um benefício de plano, com mandato bancário, pra guia sair da conta sem a pessoa lembrar; não é o 'pagar o DAS no app', que saiu do escopo em 12/09. Hoje ele não existe: o app só registra o interesse e diz que ainda não existe, sem prometer data (nó I35; cartão 2.8 do Léo, 'promessa: nao'). O que existe no lugar é a guia pronta no app, com valor e vencimento, pra pagar no banco (F040, P2.1).

**Tela:** sem tela (fundo da marca)

**Q1** “Pra quem cansou de lembrar do imposto todo mês.”  
Visual: fundo papel quente, folhinha de calendário virando os meses em 3 letras (JAN, FEV, MAR). Figurinha: a contagem regressiva da série.  
Gancho: G59 da curadoria (reels-leo/references/ganchos.md, Gatilhos de Identificação: 'Esse vídeo é pra quem cansou de papelada'), adaptado pra dor de lembrar o imposto todo mês. Entrega com F077 e F040.

**Q2** “Cada DAS, guia do imposto da ME, se paga na mão. Atrasou: multa e juros.”  
Visual: fundo papel quente, uma guia de papel por vez, sem número de multa na tela; tom sério, sem susto.

**Q3** “Débito automático ainda não tem. No app, a guia chega pronta pra pagar.”  
Visual: sem tela do app (mais.png não serve); fundo papel quente com a guia pronta em ilustração, sem imitar tela.

**Q4** “Se tivesse débito automático do imposto, você usaria?”  
Visual: fundo papel quente. Interação: enquete 'Usaria' / 'Prefiro pagar eu'.

## 08/11, domingo · faltam 2

**Funcionalidade:** 8.5 Obrigações mensais: eSocial, EFD-Reinf, DCTFWeb (Folha de pagamento, plano ME) · amarelo · não confirmada pro dia 10/11

**Objetivo:** engajamento (teste no Q4)

**Dor:** Ter colaborador cria compromisso com o governo todo mês, um papel pedindo outro papel.

**Problema:** Todo mês a folha precisa ir pro governo (eSocial) e depois ser declarada (DCTFWeb), as duas com vencimento no dia 15, antecipando se cair em dia não útil. A declaração da folha entregue atrasada tem multa mínima de R$ 200 sem movimento e de R$ 500 nos demais casos.

**Benefício:** No plano ME, o envio da folha e a declaração do mês ficam com a gente, a partir do fechamento da folha. No calendário do app a obrigação aparece com a data e o aviso de que a gente entrega, sem tarefa pra você.

**Tela:** `telas/08-11 8.5 Obrigações da folha.png` (captura `obrigacoes.png` de 02/10; o recorte está no Q3)

**Q1** “Contratou alguém? Agora é um papel pedindo outro papel, todo mês.”  
Visual: fundo papel quente, texto em Sora. Figurinha: a contagem regressiva da série.  
Gancho: G63, curadoria, Gatilhos de Identificação ("Todo dono de empresa pequena já viu isso: um papel pedindo outro papel"), adaptado às declarações da folha

**Q2** “Todo mês a folha vai pro governo. E depois ainda vira declaração.”  
Visual: fundo papel quente, texto em Sora.

**Q3** “Em breve no plano ME: isso sai da sua lista de tarefas.”  
Visual: obrigacoes.png recortada só no cartão "Declaração mensal · A gente entrega, nada a fazer", sem a data 15/07 ao lado e sem o calendário em cima (o 15 é a resposta do teste do Q4); cortar o menu de baixo.

**Q4** “Quando vence a declaração da folha?”  
Visual: fundo papel quente. Interação: teste "Dia 15 de cada mês" (certa) / "Junto com o imposto".

## 09/11, segunda · falta 1

**Funcionalidade:** 5.6 Relatórios contábeis: DRE, balanço, razão (Estar em dia, plano ME) · amarelo · não confirmada pro dia 10/11

**Objetivo:** vendas (lista de espera no Q4)

**Dor:** Quem tem empresa quer saber se o mês foi bom, e o relatório que responde isso chega com nome técnico.

**Problema:** Os relatórios contábeis (DRE, balanço, razão) são onde está quanto entrou, quanto saiu e quanto sobrou, mas vêm em linguagem de contabilidade e longe do dia a dia do dono. A resposta simples fica escondida atrás de sigla.

**Benefício:** No plano ME, a tela Relatórios mostra o dinheiro da empresa em português e deixa baixar o resultado do mês (quanto entrou, quanto saiu e quanto sobrou), os impostos pagos guia por guia e o pró-labore e as retiradas do ano. Pelo cru (E27 e E28), os relatórios do período saem do que está lançado no app, sem conciliação bancária (decisão de 04/10) e com o lucro declarado pelo cliente.

**Tela:** `telas/09-11 5.6 Relatórios.png` (captura `mais_relatorios.png` de 02/10; o recorte está no Q3)

**Q1** “Relatório da sua empresa não precisava vir em contabilês.”  
Visual: fundo papel quente, uma folha em argila coberta de siglas. Figurinha: a contagem regressiva da série.  
Gancho: G33 (Polêmicas e Opiniões, curadoria ganchos.md: 'Papelada pra abrir empresa não precisava ser assim'), adaptado

**Q2** “Quanto entrou, saiu e sobrou fica escondido atrás de nomes como DRE e balanço.”  
Visual: as siglas em argila se abrindo e mostrando três setas: entrou, saiu, sobrou.

**Q3** “Em breve no plano ME: o resultado do mês em português, pronto pra baixar.”  
Visual: mais_relatorios.png recortada de y 2130 a 2655, nos cartões 'Resultado do mês' e 'Impostos pagos' da lista 'Baixar relatório'; cortar o subtítulo, o cartão escuro com o preço, os três números de cima, a linha com cadeado e o cartão 'Pró-labore e retiradas', que sai cortado no pé da captura.

**Q4** “Quer ver o seu assim? Entrar na lista não cobra nada e não te compromete.”  
Visual: fundo papel quente. Interação: link 'Entrar na lista' (https://www.legalizai.com.br/em-breve).

## 10/11, terça · É hoje (opcional)

Sem funcionalidade nova. Só posta se o app estiver mesmo no ar. Sem preço e sem os 7 dias pela mesma regra dos dias de lista. Nada de nome de loja enquanto a base não tiver.

**Q1** “O que você faria com o tempo que gasta com papelada?”  
Visual: fundo papel quente, texto em Sora. Figurinha: nenhuma (a contagem terminou; quem pediu lembrete já foi avisado).  
Gancho: G56 da curadoria (Perguntas Que Prendem), sem adaptação

**Q2** “É hoje: o app Legalizaí chegou.”  
Visual: tela de abertura do app na versão que for ao ar (capturar no dia), "chegou" em coral.

**Q3** “Toca no link e conhece o app.”  
Visual: fundo papel quente. Interação: link "Conhecer o app" pro site https://www.legalizai.com.br (F009), ou pro endereço novo, se a base ganhar um no dia.

## Decisões do Pedro

### Pra série inteira

1. **A data vai ao ar amanhã.** O F008 e o P11 da base ainda dizem que não há data de lançamento e proíbem dizer uma; a skill de stories só aceita contagem regressiva de data que está no FATOS. A série inteira se apoia na sua decisão de 14/10 (o app chega dia 10/11). Antes de 20/10: pôr a data no F008 e no P11 e liberar a mecânica da contagem.
2. **Nenhuma das 21 está confirmada pro dia 10/11.** O aceite das funcionalidades é em 03/11. As amarelas (menos o débito automático, que diz que ainda não tem) e as duas verdes cujo aviso ainda não existe (4.2 e 5.4) saem com "Em breve"; as outras verdes dizem como funciona, sem dizer que funciona no dia 10. Do dia 04/11 em diante (dias 16 a 21) dá pra tirar o "Em breve" das que passarem e trocar as que caírem.
3. **O cronograma já tem stories pra esses dias.** De 20 a 31/10 o cronograma tem um stories do dia por data (status ideia), e 8 deles são de vendas, de 22 a 29/10 seguidos. Com a contagem rodando junto, o teto de vendas (até 2 por semana, nunca em dias seguidos) estoura. Recomendo: a contagem vira o stories do dia de 20/10 a 09/11 e os do cronograma nesse período ficam ocultos. Os dias de lista da contagem já caem nas peças de Conversão do feed: 23/10 (pilar 11), 26/10 (pilar 12) e 28/10 (pilar 10); 21/10, dia do reel do pilar 9, ficou sem venda. Novembro ainda não tem feed no cronograma (a última peça marcada é de 30/10): 04/11, 06/11 e 09/11 devem casar com a peça de Conversão (pilar 10, 11 ou 12) quando ela for marcada; se algum desses dias não tiver peça de Conversão, o Q4 dele vira enquete.
4. **Uma figurinha de contagem só.** Criar a contagem no 20/10, com o título "App Legalizaí", e reusar a mesma nos 21 dias: quem tocar em "lembrar" é avisado no dia 10/11. Os roteiros traziam títulos diferentes, e "Chega dia 10 de novembro" repetia a data que a contagem já mostra.
5. **Fator R duas vezes.** O 4.2 (26/10) e o 5.4 (02/11) são o mesmo aviso, com ganchos da mesma origem, e a G49 já é a peça de Fator R do cronograma (P15). Precisa do seu ok pros dois; se cortar um, sai o 5.4 e entra a 2.2 ou a 2.3.
6. **Débito automático (07/11).** Recomendo trocar: não existe e não entra no lançamento. Detalhe no dia.
7. **Ganchos parecidos.** "Não é só você" abre 4 dias (21/10, 25/10, 30/10 e 04/11), "um papel pedindo outro papel" abre 3 (23/10, 31/10 e 08/11), "Quem tem... conhece essa" (G57) abre 2 (20/10 e 28/10) e "cansou de... todo mês" abre 2 (01/11 e 07/11). Ficaram de 4 a 8 dias de distância um do outro. Se quiser mais variedade, troco dois ou três por outros da curadoria.
8. **Vendas sem preço e sem os 7 dias.** Os 6 dias de lista falam com quem já tem CNPJ ou troca de contador, e a regra de venda da migração (preço e 7 dias) está com você desde 14/10. Até você decidir, a lista vai sem preço e sem os 7 dias.
9. **Telas.** Todas as capturas são de 02/10, e as cópias em telas/ são a captura inteira: o recorte de cada uma está no Q3. Só o emitir.png (L07) e o avisos.png (L08, "conferir antes de usar") estão na lista aprovada do broll.md; as outras precisam do seu ok (o 24/10 agora usa o impostos_guias.png, que mostra a guia do INSS do pró-labore inteira). Dá pra recapturar do app de hoje: /impostos com "Ver a guia" (2.1), /impostos/aliquotas (2.1), /mais/documentos (6.1, 6.3), /folha/admitir (8.1), /folha/mes (8.2, 8.3, 8.4), /folha/desligar (8.7), /pro-labore/comprovantes (4.4) e o bloco "Mudar o pró-labore de outro mês" em /pro-labore (4.8). Sem tela, 8 dias vão em fundo da marca.
10. **10/11, "É hoje".** Só vai ao ar com o app no ar e com a base atualizada no F008, no F009 e no P11: hoje a base proíbe "baixe agora", "já disponível", nome de loja e link fora dos três.

### Dia a dia

**20/10 · 2.1 O DAS do mês: valor, vencimento e composição**

1. Verde, mas sem confirmação pro dia 10 (o pacote de Impostos ainda é esqueleto e o aceite é em 03/11). O texto diz como funciona, sem dizer que no dia 10 a guia já aparece.
2. A tela de 02/10 tem o botão "Pagar" e o subtítulo "você paga por aqui", que saíram do app. Use só o recorte do cartão escuro com o botão coberto, ou recapture /impostos.
3. O "e a conta" do Q3 não aparece em nenhuma captura de 02/10: a conta parte por parte está hoje em /impostos/aliquotas. Recapturar, ou tirar "e a conta" do Q3.

**21/10 · 3.1 Emitir NFS-e pedindo só valor e cliente**

1. Verde e centro do mote, mas não confirmada até o aceite de 03/11.
2. O Q2 ficou "Sem o app, sobra campo técnico que ninguém explicou." porque a regra do código de serviço vem do vault do produto e não do FATOS. Se você aceitar o vault como fonte, volta "A nota pede código de serviço que ninguém decorou. Código errado, nota errada."
3. Q4 novo (enquete) e recorte do Q3 trocado pelo aprovado no broll.md: ver "Mudanças na grade".

**22/10 · 4.1 Pró-labore interativo: mexe e vê o imposto mudar**

1. Recorte só no card "E se você mudasse?". O card escuro de cima tem "Economia vs imposto cheio R$ 570/mês" (promessa de economia, P04) e "Esse número decide o seu imposto" (P15). O rótulo "28% do que você fatura" é Fator R e fica na linha logo acima do controle de arrastar: no recorte ele vai coberto com o fundo do card, pra o controle continuar no quadro; ou recapturar.
2. O pacote do pró-labore ainda é esqueleto: não confirmada pro dia 10.
3. O broll.md marca o pro-labore.png como tela fiscal: precisa do seu ok pra ir ao ar.

**23/10 · 5.2 Declarações entregues: DEFIS, DCTF, SPED**

1. Amarela (tem tela, não tem processo): "Em breve" no Q3. Vai ao ar antes do aceite, então fica.
2. Conversa com o reel do dia (trocar de contador): é dia de lista, sem preço e sem os 7 dias, porque quem troca de contador já tem CNPJ e a regra de venda da migração está com você desde 14/10.
3. O nome cita SPED, que não vale pro nosso perfil: o texto não fala de SPED. Na tela, cortar "Próxima: maio/2027" e a caixa rosa ("entregue no prazo" soa garantia, P03).

**24/10 · 4.5 Guia do INSS do pró-labore**

1. Tela trocada na revisão: no impostos.png o card do INSS saía cortado na borda do carrossel. O impostos_guias.png mostra a guia do INSS do pró-labore inteira, ao lado do imposto do mês, sem botão "Pagar". Cortar o subtítulo "Todo imposto que a gente calculou e pagou por você" (P21) e o total do mês. Não está na lista aprovada do broll.md: precisa do seu ok.
2. No teste, a certa diz "até o teto" porque quem tem carteira assinada paga menos (F116).
3. Verde, mas sem confirmação pro dia 10 (o pacote do pró-labore ainda é esqueleto e o aceite é em 03/11). O texto diz como funciona, sem dizer que no dia 10 a guia já aparece.

**25/10 · 8.1 Cadastro do colaborador: PIS, cargo, dependentes**

1. Sem tela: o mais_colaborador.png é do MEI e tem travessão. A tela de ME hoje é /folha/admitir: recapturar se quiser print.
2. A folha entra no lançamento por decisão sua de 08/10, mas está em esqueleto e sem integração com o eSocial: "Em breve" até o aceite.
3. Teto de 10 colaboradores e R$ 39 por colaborador não estão no FATOS: ficaram fora.
4. Q2 trocado na revisão: "Um dado errado e o registro volta" é regra do envio ao governo que vem do vault, não do FATOS (P36). Se você aceitar o vault como fonte, volta a frase.

**26/10 · 4.2 Fator R com alerta antes de virar a faixa**

1. Fator R: o P15 deixa uma peça só no cronograma, e a G49 já é essa peça. Este é o primeiro de dois stories do mesmo aviso (o outro é o 5.4, em 02/11). Precisa do seu ok, ou um dos dois sai.
2. O gatilho do aviso ainda não existe: "Em breve" no Q3, sem dizer quando avisa. Aviso só no app.
3. Conversa com o reel do dia (pró-labore): é dia de lista, sem preço e sem os 7 dias. Tela: só o card coral "Ganhe uma folga"; nunca o impostos_aliquotas.png.
4. O card "Ganhe uma folga" diz "Pague R$ 1.800 e a empresa fica longe do imposto maior": pode ler como promessa de imposto menor (P04; Fator R só como recurso do app). A frase ocupa o meio do card e não dá pra tirar só ela no recorte. Precisa do seu ok; senão, recapturar com outro texto ou o dia vai sem tela.

**27/10 · 6.1 Documentos da empresa num lugar só**

1. Amarela, pacote esqueleto e, no protótipo, o baixar ainda é ensaio: "Em breve".
2. O png de 02/10 tem a linha "Certificado da condição de MEI/ME", que saiu do app e poria MEI na peça. O recorte pula a linha; melhor recapturar /mais/documentos.
3. Se o Q2 (de que órgão vem cada papel) ler como caminho pra fazer sozinho (P38), troca por "Cada papel da empresa sai de um órgão. E fica cada um num canto."

**28/10 · 8.4 Guias da folha: INSS, FGTS e IRRF**

1. Sem tela: o impostos_guias.png não mostra guia da folha e diz "calculou e pagou por você" (P21). A guia da folha está hoje em /folha/mes.
2. Dia de lista (o reel do dia é o do preço), com a figurinha de link da lista, sem preço e sem os 7 dias: quem tem colaborador já tem CNPJ.
3. Prazo do fundo de garantia não está no FATOS: nenhuma data no texto. Folha em esqueleto: "Em breve".

**29/10 · 4.6 Duplo vínculo: CLT e sócio na mesma conta**

1. A nota diz PARCIAL: o vínculo entra no cálculo, mas a tela da folga até o teto não existe. O stories não promete essa tela.
2. Tela: o subtítulo "Isso muda o imposto que a empresa paga" está errado (o que muda é o INSS do sócio): cobrir no quadro ou corrigir na tela. Não usar o mais_socios.png ("até 2 sócios", e o F032 diz 1 a 4).
3. Q4 virou enquete: ver "Mudanças na grade".
4. Verde, mas sem confirmação pro dia 10 (o pacote do pró-labore ainda é esqueleto e o aceite é em 03/11): o texto diz como funciona, sem dizer que funciona no dia 10.

**30/10 · 5.3 Calendário de obrigações do mês**

1. Amarela: "Em breve".
2. A tela de 02/10 tem os dias da semana errados (20/07/2026 aparece como domingo): cortar a faixa dos dias ou recapturar. Cortar "Declaração de julho, 31/07" e cobrir "DAS de junho".
3. Confirmar se o calendário segue no app que vai pra loja: no manifesto a rota é "exploração mantida a pedido do Pedro", e a Home de 14/10 tirou as próximas datas. O stories fala do calendário, sem série de prazo (pilar 6 em standby).

**31/10 · 4.4 Recibo de pró-labore e informe de rendimentos**

1. Amarela, sem processo: "Em breve". Não prometer que o informe sai sempre (ele trava com pendência).
2. Sem tela: /pro-labore/comprovantes existe no código desde 06/10, fora da captura de 02/10; dá pra recapturar.

**01/11 · 8.2 Lançamentos do mês e fechamento da competência**

1. Sem tela: /folha/mes fica fora da captura, e a própria tela avisa que a conta é estimativa em validação.
2. Folha em esqueleto: "Em breve". Fechamento no dia 30 e salário até o 5º dia útil não estão no FATOS: ficaram fora.

**02/11 · 5.4 Vigília fiscal preditiva: avisa antes do problema**

1. Segundo stories do Fator R na série (o primeiro é o 4.2, em 26/10), além da G49 (P15). Se for pra cortar um, é este; no lugar, uma verde de Impostos: 2.2 Baixar a guia ou 2.3 Histórico de guias pagas.
2. O gatilho do aviso ainda não existe: "Em breve".
3. O avisos.png de 02/10 pode não bater com o app de 10/11 (os avisos mudaram de lugar em 19/10), e o card diz "pode subir pra 15,5%" sem o "por volta de" do F079. Pra zero risco, recortar só o título "De olho no seu Fator R".

**03/11 · 8.3 Holerite e demonstrativo de pagamento**

1. Sem tela: o holerite sai de /folha/mes, fora da captura de 02/10.
2. Folha em esqueleto: "Em breve". 03/11 é o dia do aceite: deste dia em diante dá pra ajustar o Q3 pelo resultado.
3. Q2 trocado na revisão: "Cada desconto precisa aparecer no recibo" é regra do holerite que não está no FATOS (P36). Se você aceitar o vault como fonte, volta a frase.

**04/11 · 4.8 Alterar pró-labore de mês já processado**

1. No vault hoje ela é 4.7 (renumerada em 14/09); no PDF que foi ao Mauro é 4.8.
2. Amarela, avulsa e sem processo: "Em breve". O preço da correção não está no FATOS: nenhum valor no stories.
3. Sem tela: o bloco "Mudar o pró-labore de outro mês" existe em /pro-labore no código, fora da captura. Dia de lista: casar com a peça de Conversão do feed de novembro quando ela for marcada.
4. Q2 trocado na revisão: "Mês já declarado não muda num toque. Tem que refazer a declaração dele." é regra de retificação que vem do vault, não do FATOS (P36). Se você aceitar o vault como fonte, volta a frase.
5. É serviço avulso, cobrado à parte, e o Q3 não diz. Se quiser deixar dito, o Q3 vira "Em breve no plano ME, serviço à parte: você pede, o contador refaz a declaração." (15 palavras).

**05/11 · 6.3 Emissão de certidão negativa**

1. Amarela e avulsa (o processo cobre pedir e cobrar, não executar; a pesquisa das certidões da Prefeitura e do Estado está aberta): "Em breve". Sem preço (o png mostra R$ 35,90, provisório).
2. Se quiser deixar dito que é cobrado à parte, o Q3 vira "Em breve no plano ME, serviço à parte: você pede, a gente entrega."
3. Tela: o recorte agora vai de y 1680 a 1960 e mostra só a certidão negativa (antes ia até 2145 e pegava a inscrição municipal). Outra opção aprovada no broll.md (L08): o card "Sua CND ficou pronta" do avisos.png ("A certidão negativa que você pediu já está em Documentos"), que mostra o pedido chegando. Nunca o mais_servicos.png (travessão, selo "Mais pedido", preço sem fato). Nunca "a gente regulariza seu débito" (P07).

**06/11 · 8.7 Desligamento e rescisão**

1. Sem tela: /folha/desligar fica fora da captura, e o cálculo da rescisão ainda não foi validado com a Karla.
2. Dia de lista, com a figurinha de link da lista, sem preço e sem os 7 dias. Prazo de 10 dias e multa de 40% não estão no FATOS: fora.
3. Folha em esqueleto: "Em breve", e só sai se passar no aceite.

**07/11 · 2.8 Débito automático do DAS**

1. Recomendo trocar este dia: o débito automático não existe e não entra em 10/11 (o cartão do Léo diz "promessa: nao", nem "em breve"). Ficou perto do fim por ser o mais incerto da lista. Troca sugerida: 2.2 Baixar a guia e copiar o código de barras (impostos_pagar.png) ou 2.3 Histórico de guias pagas (impostos_guias.png), com os cuidados de tela que o roteiro dela trouxer.
2. Se ficar, é um stories de escuta: diz que ainda não tem e mede o interesse na enquete. A contagem do Q1 pode sugerir que o débito chega dia 10; o Q3 desfaz, mas o risco fica.
3. Sem tela: o mais.png mostra o débito automático como incluso, contador humano no WhatsApp e R$ 149/mês, tudo superado.

**08/11 · 8.5 Obrigações mensais: eSocial, EFD-Reinf, DCTFWeb**

1. Tela: recortar só o cartão "Declaração mensal · A gente entrega, nada a fazer", sem a data 15/07 (é a resposta do teste) e sem o menu antigo de baixo.
2. EFD-Reinf não está no FATOS: fora do texto. O envio ao eSocial ainda não tem integração: "Em breve".
3. O cartão "Declaração mensal" não diz que é a da folha, e na mesma leva de capturas o avisos.png chama a entrega do dia 15 de "PGDAS-D", que é a declaração do Simples. A tela mostra o "a gente entrega, nada a fazer", não a declaração da folha nomeada: se quiser ela com nome, recapturar /obrigacoes no app de hoje.

**09/11 · 5.6 Relatórios contábeis: DRE, balanço, razão**

1. Amarela: "Em breve" (tirar se passar no aceite de 03/11). Fecha a série com o mote do lançamento ("sem contabilês") e a lista.
2. Tela: cortar "por R$ 19,90/mês" (preço fora do FATOS), "Sem jargão de contador" (P22) e "Depois do imposto" (trava de 14/09). Recapturar com rolagem: o "quanto sobrou" sai truncado, e o cartão "Pró-labore e retiradas" sai cortado no pé da captura (por isso ficou fora do recorte).
4. Dia de lista sem peça de feed marcada ainda: casar com a peça de Conversão de 09/11 quando ela for marcada (ver Pra série inteira, item 3).
3. Sem conciliação bancária (04/10), o "quanto saiu" vem só do que está lançado no app: confirmar com o time antes de o Q2 falar em "saiu e sobrou".

As notas completas da checagem de cada roteiro, com as fontes, estão em `roteiro-21-dias.json`.
