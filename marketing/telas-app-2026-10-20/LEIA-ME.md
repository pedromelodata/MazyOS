# Telas do app de 20/10/2026

Esta pasta tem as telas do app Legalizaí capturadas hoje, 20/10/2026, do protótipo do repositório Legalizei (commit ce04ce32, o pull de hoje), rodando numa cópia isolada.
A persona é fictícia: Rafael Teixeira Lima (P03), CNPJ 33.333.333/0001-33. As telas do MEI e da abertura mostram a Ana Beatriz Ramos, também fictícia. Uma trava recusou toda tela com dado da sua empresa: a /conferencia ficou fora porque mostrava o nome Pedro.
São 121 telas: 79 que já existiam em 02/10 (51 com visual novo e 28 iguais), 41 telas novas e o recorte do limite do MEI pro Fenacon 3. Nove telas de 02/10 saíram do app.
Cada tela foi lida por um revisor e conferida por um checador. O resultado completo, tela por tela, está em `_revisao.json`. A comparação é com a pasta `telas-app-2026-10-02`.

| Pronta | Com recorte | Não usar | Tela fiscal (entre todas) |
|---|---|---|---|
| 29 | 76 | 16 | 19 |

## O que mudou no visual

Valem pro app inteiro: ícones de um conjunto só, botão principal no coral 600, os cartões de explicação azuis ou verdes viraram cartões brancos com borda e um "i" preto, o carregando passou de azul pra roxo e a barra de baixo virou só ícones, com um botão coral de "+" no lugar do NF-e.

**Entrada e abertura ME.** `welcome`, `entrada`, `dados`, `conta`, `revisar` e `retomar` estão iguais. `entrada-intencao-abrir` diz "Página inicial" no topo. `gate-etapa-faixa` ganhou o link "Faturo mais de R$ 30 mil por mês". `gate-etapa-triagem` ganhou o cartão "Quando não dá pra abrir pelo app", que empurrou a prancheta pra trás do botão. `dossie_nome` avisa que a gente acrescenta LTDA e ficou bege. `plano` mostra R$ 99 nos 3 primeiros meses e depois R$ 139 (o Léo tapa o "mês."). `pagamento` tem 3 opções (cartão, Pix, boleto). `aguardando` virou "Pix gerado". `assinatura` passou a dizer "nível ouro". `home-dia1` ficou com o chip do CNPJ quase ilegível. Telas novas: `iniciar-viabilidade`, `dossie_nome_rodada-2`, `guia` (taxa da Junta, R$ 281,08) e `agendar`.

**Migração.** As telas `migrar_*` só trocaram os cartões azuis e verdes pelos brancos; `migrar_socios` ficou bege e `migrar_transferencia` com o carregando roxo. `migrar_contrato`, `migrar_plano` e `migrar_dados` estão iguais.

**Abertura MEI.** `mei_faturamento`, `mei_atividade`, `mei_atividade-secundarias` e `mei_impedimentos` estão iguais. `mei_status`, `mei_certificado` e `mei_proximos-passos` só mudaram de cor. A novidade é que o fluxo do MEI saiu inteiro pela primeira vez: 14 telas novas (`mei_conta`, `mei_plano`, `mei_pagamento`, `mei_titular`, `mei_empresa`, `mei_endereco`, `mei_nome`, `mei_revisar`, `mei_aguardando`, `mei_certificado_pagar` e as quatro `mei_splash-*`) mais o `inicio-regime-mei`, que é o Início do MEI e continua com o visual de julho.

**Início e Home.** `inicio` foi refeita: cabeçalho com WhatsApp, sino e avatar, cartão escuro em forma de pasta ("Só você resolve", "+1 aviso"), atalhos em grade 2x2 e a aba coral "Vigia fiscal" no pé. Saíram o cartão "Pagar agora" e a grade com Fator R. `avisos` virou central com abas Avisos e Histórico e cartões brancos. `perfil` ganhou avatar bege, mas o cartão do faturamento estoura a largura. Novas: `perfil_conta` e `sessao-encerrada`.

**Impostos e guias.** `impostos` virou "Seu imposto · Você paga no seu banco. A gente confere.", com "Ver guia" no lugar de "Pagar". `impostos_aliquotas` virou "Como a guia é calculada", com a guia aberta em 6 partes. `impostos_guias` ganhou subtítulo novo (o antigo dizia que a gente pagava) e 4 filtros. `impostos_pagar` agora é o detalhe da guia do INSS do pró-labore, com "Sai dia / Vence". `obrigacoes` virou uma linha do tempo com "A gente entrega" e "Paga". Nova: `impostos_simular`.

**Notas.** `emitir` foi refeita: entraram desconto, "O que foi feito" e "Onde o serviço foi prestado", e o serviço vem escolhido sem código de atividade nem alíquota. `notas` mostra outubro vazio. `notas_detalhe` virou DANFSE padrão nacional. Novas: `notas_importar` e `notas_recebidas` (esta saiu vazia).

**Folha e pró-labore.** `pro-labore` foi refeita: abas de mês, selo "A confirmar", o aviso "Na sua atividade, o imposto da empresa não depende do pró-labore" e a decisão de continuar se pagando num mês sem faturamento. O cartão de arrastar o valor continua lá, mas fica abaixo da dobra e não saiu na imagem. `mais_socios` ganhou INSS, imposto de renda, "Emprego com carteira" e "de 1 a 4 sócios". Novas: `pro-labore_comprovantes` (recibo e informe), `folha`, `folha_admitir`, `folha_mes`, `folha_desligar` e `mais_contratar`.

**Mais e conta.** `mais` virou "Sua empresa" com o Plano ME de R$ 139 e saíram "Contador humano no WhatsApp" e "Débito automático do DAS". `mais_plano` traz a fidelidade de 12 meses. `mais_documentos` ficou com "Da abertura" e "Para a contabilidade", e o bloco "Certidões" saiu. `mais_declaracoes` vem por mês, com "A gente entrega até". `mais_relatorios` perdeu o preço de R$ 19,90 e ganhou um gráfico de barras. `mais_servicos`, `mais_em-dia`, `mais_empresa` e `mais_certificado` mudaram de visual. Novas: `mais_pedidos`, `mais_plano_fatura` e `mais_plano_cancelar`.

**Splash e telas de espera.** `splash` está igual. Novas: as telas laranja de transição `splash-analise`, `splash-atendido` e `splash-atividades`, a escura `splash-recusado` e as de acompanhamento `splash-boleto` (mostra Pix), `splash-nomes` e `splash-pagamento`. Os `veredito_*` e os `saida_*` só trocaram o azul pelo roxo.

## Pode usar já

Prontas e sem conteúdo fiscal (25):

- `avisos.png`: não explique o que a "pausa" faz e evite zoom nos X coral.
- `conta.png`
- `dossie_atividade.png` e `dossie_cnae-secundarios.png`: o código da atividade aparece, mas vem depois do nome.
- `dossie_nome_rodada-2.png`: só em peça de ME; o "sem custo" só vale com a frase inteira.
- `dossie_socio.png` e `dossie_socios.png`
- `emitir.png`: a tela da nota refeita, sem código de atividade nem alíquota.
- `endereco.png`: só em peça de ME. O R$ 49/mês é do endereço fiscal, não do plano MEI.
- `gate-etapa-faixa.png`
- `gate-etapa-triagem.png`: se quiser, corte abaixo do cartão "Quando não dá pra abrir pelo app" (y 1940).
- `inicio-regime-mei-recorte-limite.png`: o card "Uso do limite anual" do MEI, já sem o DAS-MEI e sem o WhatsApp. Não amplie mais que 2x.
- `login.png`
- `mais_pedidos.png`: lista vazia, use do topo até y 1110.
- `mais_plano_fatura.png`: se falar de preço, leve junto o R$ 99 dos 3 primeiros meses.
- `mei_endereco.png`: atenção, mostra "Sobre o seu trabalho", não o endereço.
- `migrar_cnpj.png` e `migrar_cnpj-fase-achou.png`: a segunda não entra na mesma peça que `migrar_socios.png`.
- `retomar.png` e `sessao-encerrada.png`
- `splash.png`, `splash-analise.png`, `splash-atendido.png`, `splash-atividades.png` e `splash-recusado.png`

## Usar com recorte

As telas fiscais com recorte estão na seção seguinte. As coordenadas exatas de cada corte estão no `_revisao.json`.

| Arquivo | O que cobrir ou cortar | Por quê (regra) |
|---|---|---|
| aguardando.png | "te avisa no WhatsApp" e o link do WhatsApp; ou só a lista de etapas (y 760 a 2240) | WhatsApp (3) |
| assinatura.png | cartão do GOV.BR, fileira de convite, link do WhatsApp e o "leva uns minutos" do subtítulo | nível do gov.br sem base (F137), WhatsApp (3), prazo (P01) |
| certificado.png | quadro "Pra que serve isso" inteiro e o subtítulo da procuração; ficam título e botões | "a gente paga a guia" (P21), procuração (F036, F133), travessão (P26) |
| dados.png | linha "A gente usa pra te avisar de cada etapa." | aviso fora do app (P12, 3) |
| dossie_empresa.png | endereço e CEP da Rua dos Timbiras; link do WhatsApp | rua real de BH; WhatsApp (3) |
| dossie_nome.png | linha "feitas pra passar nos critérios da Junta"; link do WhatsApp | soa como nome aprovado com certeza (P02, F134); WhatsApp (3) |
| endereco-regime-mei.png | "Como MEI, você abre de qualquer cidade do Brasil." | F027 em conflito |
| entrada.png | selo "mais de 22 anos de história" | F148 e marca digital pura |
| entrada-intencao-abrir.png | link do WhatsApp, ou cortar em y 1060 | WhatsApp (3) |
| entrada-intencao-migrar.png | subtítulo ("se a cidade importa") e link do WhatsApp | F027 em conflito; WhatsApp (3) |
| home-dia1.png | chip do CNPJ ilegível, barra solta no meio, link do WhatsApp; em peça de MEI, o passo do certificado | tela quebrada (12); WhatsApp (3); certificado incluso só no ME (F012, F013) |
| inicio.png | ícone do WhatsApp e a Vigia fiscal ("R$ 0.00" e "20%"); confirmar o "Pronta em segundos" | WhatsApp (3); sobra de teste (12); prazo (7). Se o cartão do pró-labore for o destaque, vira fiscal |
| mais.png | WhatsApp, nome "Ana Beatriz Ramos" no cartão da conta, preços dos serviços e a regra dos R$ 50 | WhatsApp (3); duas personas na mesma tela (12); preço e regra sem fato (P37, P36) |
| mais_certificado.png | "a renovação começa sozinha" e o cartão "Renovação é rotina"; só peça de ME | promessa sem base (P12, P36); F012, F013 |
| mais_documentos.png | linha "Dispensa de alvará" e o selo "Sem custo" da declaração de faturamento | F138; "sem custo" fora do FATOS (P10) |
| mais_em-dia.png | "a próxima é em 30/10/2026. Incluso no plano." | serviço sem base (P12, P36) |
| mais_empresa.png | "próxima conferência automática" e "colar no WhatsApp" | P12; WhatsApp (3) |
| mais_plano.png | parágrafo dos R$ 50 com "aí devolvemos"; confirmar "Cartão, Pix ou boleto"; R$ 139 só com o R$ 99 junto | P36, P12; F004 |
| mais_servicos.png | todos os preços, o cartão da regra dos R$ 50 e o "cotado antes" repetido; sobram título e "Ver seus pedidos" | preço sem fato (P37, P36); sobra de teste (12) |
| mei_atividade.png | aviso de lista vazia e o branco do meio | tela vazia (12) |
| mei_atividade-secundarias.png | "dá pra incluir depois, de graça, no Portal" e o branco | fazer sozinho (P38); tela vazia (12) |
| mei_faturamento.png | "É a única conta que decide se ele serve pra você." | F056, F058, F076 |
| mei_impedimentos.png | terceira pergunta (benefícios do INSS), ou cortar acima dela | regra sem fonte no FATOS |
| mei_status.png | cartão escuro do topo, "A conferência é humana: alguém lê...", link do WhatsApp | prazo (P01); humano no MEI (P06); WhatsApp (3) |
| migrar_contador.png | cartão do topo, nota de baixo, e-mail e telefone do contador de exemplo | travessão (P26); dado que pode ser real |
| migrar_dados.png | subtítulo | travessão (P26) |
| migrar_diagnostico.png | primeira frase do cartão ("libera a gente pra emitir sua nota, pagar sua guia") | P21, F127 |
| migrar_gov.png | subtítulo, cartão da procuração ("pagar DAS") e a linha "É o nível que o e-CAC aceita" | travessão (P26), P21, F137 |
| migrar_socios.png | rótulo "Vínculo com o INSS" do topo; não juntar com `migrar_cnpj-fase-achou` | texto errado (12); a outra tela mostra a mesma empresa com um sócio só |
| migrar_transferencia.png | subtítulo, cartão "Quanto tempo leva" inteiro, link do WhatsApp | travessão (P26); prazo da troca (F142); WhatsApp (3) |
| migrar_transferencia-estado-travado.png | caixa rosa (fica só o título), "A abertura roda uma vez só", link do WhatsApp | P03, F142, P26; texto errado (12); WhatsApp (3) |
| notas_detalhe.png | "Cliente do histórico" e "Serviço prestado (histórico da persona)" | sobra de teste (12) |
| pagamento.png | cartão "O caminho mais rápido"; o preço só em peça de ME | afirmação sem fato e rapidez (P36, P01); preço (8) |
| pagamento-fluxo-migrar.png | "R$ 139,00 hoje", cartão "O caminho mais rápido", cartão verde cortado acima do botão | migração sem preço (decisão de 14/10); P36, P01; tela quebrada (12) |
| painel_recusa.png | bloco "Pague a guia da Junta" ("cerca de 1 minuto") e link do WhatsApp; só peça de ME | taxa antes da viabilidade (F018, F037), número sem fato (P36); WhatsApp (3); F072 |
| perfil.png | "Sua alíquota hoje é 6%", a fileira dos três cartões, "atividade principal" repetido e o cartão Senha cortado | alíquota (5); tela quebrada (12) |
| plano.png | "Sem letra miúda", "Processo contábil 100% grátis", "em torno de um salário mínimo" e o selo "Plano único"; só peça de ME | P05; P10 e F015; número sem fonte; existem dois planos (8) |
| revisar.png | "Corrigir pelo WhatsApp", o link de baixo, e o cartão Você em close (RG, Rua dos Timbiras, telefone); só peça de ME | WhatsApp (3); dado com cara de real; F072 |
| saida_cnpj-inapto.png | título "Seu caso pede uma pessoa", parágrafo e botão da regularização, nota com travessão; fica o cartão "CNPJ irregular" | P07, F033, P06, P26 |
| veredito_atende.png | cartão "Imposto mais baixo", selo "94% compatível", topo "Legalizai" e o 3º cartão cortado | P04; P36; grafia; tela quebrada (12) |
| veredito_nao-atende.png | parágrafo da Legalize Digital, título "Seu caso pede uma pessoa", botão "Falar com o time", nota com travessão; fica o cartão "Comércio" | F1003; P07, P06, F030; P26 |
| welcome.png | linha "22 anos de escritório contábil em BH"; nunca em peça de MEI | P30, F1003; P06 |
| agendar.png | "ou WhatsApp", cartão "Tenho 30 minutos agora", "cerca de 30 minutos" e o horário de atendimento; só ME e confirmar a premissa | WhatsApp (3); número sem fato (P36); assinatura pelo app (F036) |
| folha.png | "Até 10 colaboradores", a frase "o que a folha faz com o seu imposto" e o branco de baixo; só ME | número sem fonte; Fator R (P14, P15); F059 |
| folha_admitir.png | nota do nome social; só ME | regra de órgão sem fato (P36); F059 |
| iniciar-viabilidade.png | "Pode sair em minutos." e "Pague quando quiser. Ela não espera a análise"; só ME | P01; F018; F072 |
| mei_aguardando.png | "te avisa no WhatsApp", link, "1 a 3 dias úteis" (dois lugares) e "Ver o boleto de R$ 49" | WhatsApp (3); prazo (P01); falta o R$ 29 (F002) |
| mei_conta.png | bloco do WhatsApp | WhatsApp (3) |
| mei_empresa.png | endereço na Rua dos Timbiras e o bloco "Capital social" ("ninguém confere") | rua real de BH; F039 |
| mei_pagamento.png | caixa do aceite inteira; "R$ 49 hoje" | grafia, fazer sozinho (P38); falta o R$ 29 (F002) |
| mei_plano.png | "Abrir é grátis", "Sem letra miúda", cartão "Notas fiscais sem limite" e o cartão cortado do monitor do teto | P10; P05; sem fonte; F044; preço só com o R$ 29 e a validade (F002) |
| mei_revisar.png | "você vai finalizar no Portal", a ocupação de manutenção de computador, o telefone (31) 98765-4321, o bloco "A empresa" e o endereço do pé | P38; P16; telefone com cara de real; F072 |
| mei_splash-atividades.png | cartão "O que você já preencheu" (traços no lugar dos dados) | travessão (P26); resumo vazio (12) |
| mei_splash-boleto.png | o mesmo da `mei_aguardando`, que é igual pixel por pixel | WhatsApp (3); P01; F002 |
| mei_splash-pagamento.png | "te avisa no WhatsApp" e o link; o "e é rápido" não vai pra fala | WhatsApp (3); P01 |
| mei_splash-recusado.png | caixa do aceite e "R$ 49 hoje"; não isolar o "cai na hora" | P38, grafia; F002; P01 |
| mei_titular.png | cartão "O que você já preencheu" | travessão (P26); resumo vazio (12) |
| notas_importar.png | "Escolher arquivo Nenhum arquivo escolhido" e o cartão tracejado cortado; o subtítulo, se a peça puder sugerir emitir fora | sobra de teste (12); P38 |
| perfil_conta.png | cartão cortado no pé (cortar abaixo de "Vale saber") | tela quebrada (12) |
| splash-boleto.png | "te avisa no WhatsApp", o link e o aviso do cadeado cortado | WhatsApp (3); tela quebrada (12) |
| splash-nomes.png | "te avisa no WhatsApp" e o link; "cerca de 1 minuto" se a peça falar de tempo | WhatsApp (3); P01 |
| splash-pagamento.png | "te avisa no WhatsApp" e o link; "Leva cerca de 2 minutos" se a peça falar de tempo | WhatsApp (3); P01 |

## Tela fiscal (só com o seu ok)

Mostram imposto, pró-labore, INSS, folha ou guia. Valor de exemplo pode ficar nítido, mas nenhuma vai ao ar sem o seu ok.

- `dossie_vinculo.png` (pronta): cobrir "Isso muda o imposto que a empresa paga." O que muda é o INSS do sócio.
- `impostos_guias.png` (pronta): lista de guias com o subtítulo novo, que já diz que o pagamento é seu, no banco.
- `impostos_simular.png` (pronta): a estimativa saiu zerada. Pra mostrar a guia simulada, recapturar com um valor digitado.
- `mais_contratar.png` (pronta): calculadora de quanto custa contratar; cortar acima de "Outros benefícios".
- `blog.png`: cobrir os dois posts do Fator R e conferir o "Sua primeira nota fiscal, passo a passo" (P38). Só o topo (y 0 a 900) não é fiscal.
- `impostos.png`: cobrir o WhatsApp do topo.
- `impostos_aliquotas.png`: só o cartão da alíquota (y até 1320). A tabela sai: COFINS cortada em "R$ 11", "PIS PIS" e a linha do IRPJ.
- `impostos_pagar.png`: cobrir "Imposto de renda · zero nesta faixa" (P17).
- `mais_declaracoes.png`: cortar o cartão da DCTFWeb, que diz 30/10/2026 (a base diz dia 15, F101).
- `mais_relatorios.png`: cobrir o sinal de menos antes de R$ 4.320,00 (na Sora parece traço médio) e o subtítulo "Sem jargão de contador" (P22).
- `mais_socios.png`: cobrir "Imposto de renda R$ 0,00" (P17).
- `migrar_ativa.png`: cobrir o título "O primeiro ganho já está na mesa", os dois cartões do Fator R (P04, P14, P15) e o WhatsApp.
- `obrigacoes.png`: cortar o cabeçalho ("Outubro De 2026" e bolinhas fora de ordem), o item de 30/10 com a nota do sábado e o rodapé (prazo da DCTFWeb em conflito com o F101).
- `pro-labore.png`: cobrir "INSS e IR do mês R$ 178,31" (regra 4) e cortar a barra de baixo.
- `folha_mes.png`: folha vazia; cortar o rodapé "está em validação com o nosso departamento pessoal".
- `guia.png`: taxa da Junta de R$ 281,08, que bate com o F018. Só peça de ME, e cobrir o cartão "O caminho mais rápido".
- `inicio-regime-mei.png`: nunca a tela inteira. Tem o DAS-MEI de R$ 76,90 duas vezes (F063), um MEI de desenvolvimento de software (F057, F072) e "R$ 38.400 nos últimos 12 meses" ao lado de 14%, conta que não fecha. Use o recorte do limite.
- `pro-labore_comprovantes.png`: cobrir "Imposto de renda retido R$ 0,00" (P17) e o seletor de mês cortado; cortar abaixo de "Baixar o recibo".

## Não usar

- `blog_post.png`: o post inteiro ensina Fator R e alíquota (P14, P15) e promete economia (P04).
- `folha_desligar.png`: vazia.
- `mais_colaborador.png`: promete a folha do MEI empregador (F059) e tem travessão.
- `mais_plano_cancelar.png`: "Multa de R$ 20" sem fonte, "sai sem multa" (F025) e "Legalizai" sem acento.
- `mei_certificado.png` e `mei_certificado_pagar.png`: o MEI não precisa de certificado (F012, F124), e os R$ 209 por ano aparecem como cobrança nossa (F014).
- `mei_nome.png`: a regra da razão social contradiz o F072, e o modelo aparece vazio.
- `mei_proximos-passos.png`: é o passo a passo no Portal do Empreendedor (P38).
- `migrar_contrato.png` e `migrar_plano.png`: preço e fidelidade da migração ainda sem decisão sua, "grátis" e "recebe tudo de volta".
- `notas.png` e `notas_recebidas.png`: outubro vazio. Recapturar em setembro, mês em que a persona tem nota.
- `processos.png`: painel interno de desenvolvimento.
- `saida_regime-nao-suportado.png`: diz que a equipe resolve Lucro Presumido (F031, P07).
- `veredito_descartado.png`: "CNAE 0000-0/00" e travessão.
- `veredito_waitlist.png`: promete avisar quando abrir (P12, P08) e diz que não abre atividade regulamentada, que está nas 15 categorias (F035).

## Telas que saíram do app

As rotas destas 9 telas de 02/10 não existem mais no código (dão erro 404 hoje): `contrato`, `mei_saida_ja-tem-cnpj`, `mei_saida_servidor`, `painel`, `saida_exterior`, `saida_fora-bh`, `saida_socio-pj`, `saida_socios` e `termo`. O cartão novo "Quando não dá pra abrir pelo app", na `gate-etapa-triagem`, parece cobrir parte desses casos (servidor público e outra empresa).

A lista de imagens da skill de reels (broll.md) ainda aponta pra duas delas: L03 usa `contrato.png` e L04 usa `painel.png`. O acompanhamento da abertura hoje está em `aguardando`, `splash-nomes` e `splash-pagamento`.

## Telas novas que o catálogo não tinha

O catálogo de telas do repositório (app/src/lib/telas-flow.ts) está atrasado: ainda lista as 9 que saíram e não lista 41 telas que existem. Elas foram capturadas por uma lista própria (`_manifesto-extras.json`), que também refez a `splash`: ela está no catálogo, mas saiu em branco na primeira passada.

- **Splash e espera (8):** `splash-analise`, `splash-atendido`, `splash-atividades`, `splash-boleto`, `splash-nomes`, `splash-pagamento`, `splash-recusado`, `sessao-encerrada`.
- **MEI (15):** `inicio-regime-mei`, `mei_conta`, `mei_plano`, `mei_pagamento`, `mei_titular`, `mei_empresa`, `mei_endereco`, `mei_nome`, `mei_revisar`, `mei_aguardando`, `mei_certificado_pagar`, `mei_splash-atividades`, `mei_splash-boleto`, `mei_splash-pagamento`, `mei_splash-recusado`.
- **Abertura ME (4):** `dossie_nome_rodada-2`, `iniciar-viabilidade`, `agendar`, `guia`.
- **Impostos (1):** `impostos_simular`.
- **Folha e pró-labore (6):** `folha`, `folha_admitir`, `folha_mes`, `folha_desligar`, `mais_contratar`, `pro-labore_comprovantes`.
- **Mais e conta (4):** `mais_pedidos`, `mais_plano_fatura`, `mais_plano_cancelar`, `perfil_conta`.
- **Notas (2):** `notas_importar`, `notas_recebidas`.
- **Interna (1):** `processos`.

Fora dos dois manifestos está o `inicio-regime-mei-recorte-limite.png`, recortado da `inicio-regime-mei` pro beat 4 do Fenacon 3.

## Sobras de teste

Pra mostrar ao time do app. O botão 🧪 de trocar de persona e o aviso de desenvolvimento do navegador ficam escondidos na captura. A revisão não achou outro 🧪 nem a marca Ensaio em nenhuma tela.

- **Painel interno:** `processos` (fluxograma e botão "Passar E2E").
- **Texto de desenvolvimento:** "Valores de referência enquanto fechamos o preço final" (`migrar_plano`); "está em validação com o nosso departamento pessoal" (`folha_mes`); "valor cotado antes" repetido e o "a partir de R$ 89" marcado como falso no código (`mais_servicos`); o manifesto ainda chama o preço de `mais_plano` de "Preço FAKE".
- **Dado de teste na tela:** "Cliente do histórico" e "histórico da persona" (`notas_detalhe`); modelo vazio "Seu nome completo 000.000.000-00" (`mei_nome`); resumo com traços no lugar dos dados (`mei_titular`, `mei_splash-atividades`); campo cru "Escolher arquivo Nenhum arquivo escolhido" (`notas_importar`); "CNAE 0000-0/00" (`veredito_descartado`); duas personas na mesma tela, avatar do Rafael e conta da Ana (`mais`).
- **Erro de tela:** COFINS cortada e "PIS PIS" (`impostos_aliquotas`); "R$ 0.00" com ponto e selo "20%" solto (`inicio`); chip do CNPJ ilegível e barra solta (`home-dia1`); cartão estourado, "10 meses De CNPJ" e "atividade principal · atividade principal" (`perfil`); "Outubro De 2026" (`obrigacoes`, `notas`, `notas_recebidas`) e bolinhas de data fora de ordem (`obrigacoes`); rótulo "Vínculo com o INSS" na migração (`migrar_socios`); "A abertura roda uma vez só" na migração (`migrar_transferencia-estado-travado`); título e botão que se contradizem (`painel_recusa`); o Léo tapando o preço (`plano`).
- **Coisa cortada na borda:** `gate-etapa-triagem`, `mei_certificado`, `veredito_atende`, `pagamento-fluxo-migrar`, `perfil_conta`, `splash-boleto`, `pro-labore_comprovantes` (seletor de mês e informe).
- **Tela vazia:** `folha_desligar`, `notas`, `notas_recebidas`, `mei_atividade`, `mei_atividade-secundarias`, metade de baixo da `folha`, `folha_mes`, `impostos_simular` (estimativa zerada), `mais_pedidos`.
- **Nome do arquivo que não bate com a tela:** `mei_endereco` (mostra "Sobre o seu trabalho"), `mei_splash-atividades` (mostra "Seus dados"), `mei_splash-boleto` (igual à `mei_aguardando`), `splash-boleto` (mostra Pix), `notas_recebidas` (mostra as emitidas).
- **Persona incoerente:** MEI de desenvolvimento de software e números do limite que não fecham (`inicio-regime-mei`); Rua dos Timbiras, rua real de BH (`dossie_empresa`, `mei_empresa`, `revisar`, `mei_revisar`); telefone e e-mail com cara de real (`mei_revisar`, `migrar_contador`).
- **Data do protótipo:** o app acha que hoje é 06/10/2026 (rodapé de `obrigacoes` e datas dos avisos). Por isso aparecem "Setembro de 2026 fecha em 15/10" e "Outubro em curso".
- **Grafia "Legalizai" sem acento:** `endereco`, `entrada`, os `veredito_*`, `agendar`, `migrar_contrato`, `mei_pagamento`, `mei_splash-recusado`, `mais_plano_cancelar`.

## Telas pros roteiros e stories

### Fenacon 1 a 3 (roteiros-2026-10-20/ROTEIROS.md)

- **Fenacon 1, beat 5 (o app entra girando):** `splash.png`, igual à de 02/10. Pronta.
- **Fenacon 1, beat 6 ("soma o que você fatura e vigia o limite de hoje"):** `mei_faturamento.png` desta pasta, que não mudou, recortada só nas quatro faixas, como o roteiro já pede (a frase "É a única conta que decide" fica fora). O recorte do limite faria ao pé da letra o "vigia o limite", mas repete na tela o R$ 81 mil do beat 1 e é a imagem do Fenacon 3. Fico com as faixas.
- **Fenacon 2, beat 4 ("o app fica de olho nisso"):** a recaptura trouxe o card que o roteiro esperava. Entra o `inicio-regime-mei-recorte-limite.png` no lugar da tela de abertura, colado no celular, sem ampliar mais que 2x. O card escreve "R$ 81 mil/ano", que já está na tela no beat 1: se você quiser zero repetição, fica a abertura (`splash.png`). O `inicio.png` é do ME e não entra.
- **Fenacon 3, beat 4 ("o app vigia o teto por você"):** `inicio-regime-mei-recorte-limite.png`, pronto. Já sai sem o DAS-MEI, sem a razão social, sem o "últimos 12 meses" e sem o WhatsApp. O 14% e os R$ 69.600 fecham entre si. Tem 561 x 378 px: se o celular 3D pedir mais que 2x, recapture a rota `/inicio?regime=mei` com escala maior. Nunca a tela inteira (`inicio-regime-mei.png`).

### Pró-labore 1 a 3 (mesmo arquivo)

- **Beat do app nos três (arrastar o valor):** continuam os recortes de `telas-app-2026-10-20-pro-labore` (persona Tiago). Na captura nova, o cartão de arrastar fica abaixo da dobra e não saiu na imagem.
- **Achado:** a persona desta pasta, Rafael (P03), é de atividade em que o imposto da empresa não depende do pró-labore; a própria tela diz isso. É a persona que o Pró-labore 3 pedia pra gravar o arrasto sem o salto do Fator R. Recomendo gravar o arrasto no Edge com a P03 pro Pró-labore 3 e pro 2 (os dois só querem o INSS e o que sai do bolso andando). Pro Pró-labore 1, só se você contar ele como segunda peça de Fator R: aí troca a persona e sai o beat 3.
- Na P03, o cartão escuro junta "INSS e IR do mês": o IR fica coberto, como nas regras dos três. O ok da tela fiscal continua valendo.

### MAT 1 a 3 (roteiros-2026-10-20/ROTEIROS-MAT2.md)

- **MAT 1, beat 4 ("Você só confirma"):** `revisar.png` desta pasta, que não mudou, no mesmo recorte (título "Está tudo certo?" e botão Conferi). O cartão Você (RG, Rua dos Timbiras, telefone) e as duas linhas de WhatsApp ficam fora. É tela de ME, o que serve pro MAT.
- **MAT 1, "e assina":** a `assinatura.png` ganhou visual novo, mas segue com "leva uns minutos" e o cartão "só aceita conta nível ouro" (F137), e mostra a assinatura da Junta, não a do pedido com o MAT. O L09 continua bloqueado: fica o Pedro na câmera.
- **Escolha da guia (MAT 2 e MAT 3):** confirmado, nenhuma das 121 telas mostra essa escolha (Simples puro ou híbrido, IBS e CBS). Procurei também no código do app no commit ce04ce32: não há tela, texto nem rota com híbrido, IBS ou CBS. O MAT 2 e o MAT 3 seguem sem tela do app.

### Stories da contagem (stories-contagem-lancamento/LISTA-21-DIAS.md)

Nove dias melhoram: sete trocam a tela de 02/10 por uma nova melhor e dois que estavam sem tela passam a ter. Um dia piora (05/11).

| Dia | Funcionalidade | Tela nova | Recorte e cuidado |
|---|---|---|---|
| 20/10 | 2.1 O DAS do mês | **troca:** `impostos.png` | Cartão escuro "Imposto do mês · setembro R$ 900,00 · Paga · Ver guia" (y 580 a 1315) com o subtítulo "Você paga no seu banco. A gente confere." (y 200 a 265). Saiu o botão "Pagar" que a de 02/10 obrigava a cobrir. Cobrir o WhatsApp. O cartão não mostra vencimento; a linha "Como a guia é calculada · A conta em 6 partes" (y 1870 a 2135) casa com o Q2. A tabela de `impostos_aliquotas` não entra. Fiscal. Se o stories de hoje já saiu, fica pro registro |
| 21/10 | 3.1 Emitir NFS-e | **troca:** `emitir.png` | Pronta, com o visual de hoje. Mesmo recorte de antes, "Pra quem é a nota?" e "Qual o valor?" (y 270 a 985). O cartão do serviço agora vem escolhido sem código de atividade nem alíquota ("Fotografia e filmagem", y 2240 a 2540): pode entrar como segundo quadro pro "o código vem pronto" do Q3. A tela inteira ganhou campos (desconto, "O que foi feito", local do serviço), então não mostre ela toda num quadro que diz "poucos campos" |
| 22/10 | 4.1 Pró-labore interativo | não pela captura nova | O cartão de arrastar ficou fora da imagem. Se a cópia em `telas/` ainda for a de 02/10, troque pelo recorte 4 de `telas-app-2026-10-20-pro-labore`, com o IR coberto. Mantenha o Tiago: na P03 o imposto da empresa não muda, e o Q3 diz que muda |
| 23/10 | 5.2 Declarações | **troca (feito em 20/10):** `telas-app-2026-10-20-declaracoes` | Recapturada com a data do ensaio em 31/10/2026: as três declarações de setembro aparecem "Entregue" com "Recibo", sem prazo da DCTFWeb na tela. O recorte 2 já está em `stories-contagem-lancamento/telas/`; a de 02/10 foi pra `_versoes-anteriores`. Fiscal |
| 24/10 | 4.5 Guia do INSS do pró-labore | **troca:** `impostos_guias.png` | Pronta. O subtítulo agora diz "A gente calcula, emite e confere com o órgão; o pagamento é seu, no banco", que é o "Você só paga" do Q3, e não precisa mais ser cortado. Opção: `impostos_pagar.png` (com "Sai dia / Vence"), cobrindo "Imposto de renda · zero nesta faixa". Fiscal |
| 25/10 | 8.1 Cadastro do colaborador | **ganha tela:** `folha_admitir.png` | Passo 1 de 4, campo por campo. Cobrir a nota do nome social (P36). Segue "em breve" |
| 26/10 | 4.2 Aviso do Fator R | nenhuma | A P03 não é de Fator R e o cartão "Ganhe uma folga" não aparece nesta captura. A Vigia fiscal da Home sai com "R$ 0.00" e "20%". Fica a de 02/10 com os cuidados do roteiro, ou recapturar com a persona de Fator R |
| 27/10 | 6.1 Documentos | **troca:** `mais_documentos.png` | "Da abertura" com Contrato social, Cartão CNPJ e Inscrição municipal (y 660 a 1560): são os três papéis do Q2. A "Dispensa de alvará" (F138) fica fora. Já não tem a linha "Certificado da condição de MEI/ME" |
| 28/10 | 8.4 Guias da folha | segue sem tela | `folha_mes.png` está vazia e avisa que a conta "está em validação". Recapturar com um colaborador cadastrado |
| 29/10 | 4.6 Duplo vínculo | igual | A `dossie_vinculo.png` não mudou: mesmo recorte, frase do imposto coberta. Opção nova: `mais_socios.png` agora diz "de 1 a 4 sócios" (caiu o motivo pra não usar) e tem "Emprego com carteira" com o botão "Tenho emprego com carteira"; cobrir o IR. Fiscal |
| 30/10 | 5.3 Calendário de obrigações | **troca:** `obrigacoes.png` | Cartão "Prazos de outubro" até o 4º item (y 745 a 1650): separa "A gente entrega" do que já foi pago, que é o Q3. Fora: o cabeçalho, o item de 30/10, a nota do sábado e o rodapé (DCTFWeb em conflito com o F101). A nota do sábado ilustraria o Q2, mas é justamente o prazo em conflito. Fiscal |
| 31/10 | 4.4 Recibo e informe | **ganha tela:** `pro-labore_comprovantes.png` | "Recibos e informe" é a funcionalidade. Do título até "Baixar o recibo" (y 0 a 2460), com o IR retido e o seletor de mês cobertos. O informe sai cortado no pé: pro "os dois num lugar só" do Q3, recapture com rolagem. Fiscal |
| 01/11 | 8.2 Lançamentos e fechamento | segue sem tela | A folha do mês está vazia |
| 02/11 | 5.4 Vigília fiscal | nenhuma | A central de avisos nova não tem o cartão do Fator R nesta persona, e a Vigia fiscal da Home tem "R$ 0.00" e "20%". Fica a de 02/10 só no título, ou sem tela |
| 03/11 | 8.3 Holerite | segue sem tela | A folha do mês está vazia |
| 04/11 | 4.8 Alterar pró-labore passado | segue sem tela | As abas de mês do pró-labore e o aviso "Mudar antes de 15/10" não mostram o pedido de mudança de um mês já processado |
| 05/11 | 6.3 Certidão negativa | **piora** | O bloco "Certidões" saiu de Documentos: a de 02/10 mostra algo que não está no app desta captura. A certidão só aparece na loja, com preço sem fato. Saída: sem tela, ou o atalho "Documentos · Contrato, certidões" da Home (`inicio.png`, x 665 a 1220, y 1725 a 2060) |
| 06/11 | 8.7 Desligamento | segue sem tela | `folha_desligar.png` está vazia |
| 07/11 | 2.8 Débito automático | segue sem tela | Se trocar pela 2.3 (histórico de guias), há "Guias anteriores" na `impostos.png` e a lista com filtros na `impostos_guias.png`. A `mais.png` nova já não lista o débito automático como incluso |
| 08/11 | 8.5 Obrigações da folha | **troca, com decisão:** `obrigacoes.png` | Só a linha "Pró-labore informado ao governo · A gente entrega" (x 250 a 1220, y 900 a 1080), sem o "15 out", que é a resposta do teste. Atenção: o Q4 diz que a declaração da folha vence dia 15 (F101), mas a mesma tela marca a DCTFWeb pro último dia útil (30/10), e o código do app registra essa divergência. Decida qual vale antes de 08/11 |
| 09/11 | 5.6 Relatórios | **troca:** `mais_relatorios.png` | Saíram o preço e o cadeado. Recorte em "Baixar relatório · Faturamento mês a mês" (y 2290 a 2690), que é o "pronto pra baixar" do Q3; opção de mostrar o gráfico de barras (y 585 a 1575) cobrindo o "650% a mais". Fora: "Sem jargão de contador" (P22) e o cartão do resumo (fiscal, sinal de menos) |

## Como recapturar

O script é o `capturar.mjs` com `--lista` (uma rota por linha; sem a opção, ele usa o catálogo do repositório, que está atrasado). Ele sobe uma cópia isolada do protótipo na porta 3005, troca pra persona fictícia P03 antes de qualquer captura, esconde o botão 🧪 e recusa toda tela que mostrar dado da P0, a sua empresa real (CNPJ, razão social ou o nome Pedro). As imagens saem em 1290 x 2796, sem rolagem: o que fica abaixo da dobra, como o cartão de arrastar do pró-labore e o informe de rendimentos, precisa de captura com rolagem.
