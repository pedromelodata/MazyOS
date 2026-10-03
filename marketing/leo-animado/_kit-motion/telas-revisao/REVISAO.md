# Revisão das telas de 02/10 (K13)

Revisão por regra das 88 capturas de `marketing/telas-app-2026-10-02/` (protótipo Next.js do repositório Legalizei @ab68dbc, capturado em 02/10 às 11:24) contra o `_base-contabil/FATOS.md` e o `PROIBIDO.md`, mais a medição das regiões das telas que o kit e as peças de outubro usam. Feita em 02/10/2026.

- Sobreposição do catálogo: `KIT/catalogos/telas/revisao-2026-10-02.json` (camada `revisao-2026-10-02`, um item por tela com `status`, `motivo`, `regras`, `categorias`, `cortes`, `regioes`, `mudancas`, `publico`, `servePecaMei` e `notas`).
- Folhas de contato por grupo do manifesto: `KIT/telas-revisao/folha-<grupo>-<n>.jpg` (status embaixo de cada tela, cortes em vermelho).
- Caixas em px da captura 1290x2796, `[x0, y0, x1, y1]` com fim exclusivo.

**Aviso de 'tela real':** as 88 telas são do protótipo Next.js, não do app Flutter (o app de verdade desde 14/09). Chamar qualquer uma de 'tela real do app' ou 'prévia real' depende do Pedro.

## Resumo

- 88 telas: **8 liberadas**, **36 aceitas com risco** (só com os cortes) e **44 reprovadas**.
- Das reprovadas, 11 são erro de captura: 9 páginas 404 e 2 estados vazios. As outras 33 caem por regra.
- Nenhuma das 88 mostra valor do DAS do MEI (F063). 15 servem pra peça de MEI com os cortes.
- Travessão (P26) em 15 telas: 14 com o caractere visível (o OCR achou todos menos o segundo da migrar_contador, que veio do cruzamento com o código do protótipo) e o login, com traço dos dois lados do 'ou entre com'. A marca escrita sem acento aparece como texto em 9 telas (o wordmark da logo não conta).
- As constantes do guia continuam valendo nas capturas novas (card, valor, esqueleto, botão Pagar, barra de abas e colas); só o BOTAO_VER legado segue 82 px fora do centro, como já se sabia.

### Por grupo do manifesto

| grupo | telas | liberado | aceito com risco | reprovado |
|---|---|---|---|---|
| entrada | 15 | 2 | 8 | 5 |
| n4-veredito | 7 | 2 | 1 | 4 |
| saidas-triagem | 3 | 0 | 0 | 3 |
| ramo-mei | 10 | 0 | 6 | 4 |
| dinheiro | 5 | 1 | 0 | 4 |
| migrar-pos-pagamento | 7 | 0 | 3 | 4 |
| pausas | 2 | 1 | 1 | 0 |
| dossie | 6 | 2 | 4 | 0 |
| b4 | 7 | 0 | 2 | 5 |
| portal | 25 | 0 | 10 | 15 |
| fora | 1 | 0 | 1 | 0 |

## As melhores pra peça

| tela | pra quê | o que sai |
|---|---|---|
| inicio | card da guia (base das telas do guia): 'Vence dia 20', 'Seu imposto de junho', R$ 178,31 e 'Pagar agora' | card da empresa, 'No resto, você está em dia', 'Seu negócio' e 'Próximos vencimentos' |
| impostos_pagar | valor do imposto do mês e os três botões ('Baixar guia (PDF)', 'Ver a guia', 'Enviar guia') | 'De onde vem esse valor' e 'Como pagar' |
| splash | logo negativa sobre o coral, abertura ou fecho | nada |
| mei_faturamento | MEI: teto de R$ 81.000 por ano (F051) e o aviso de perto do limite (F044) | 'É a única conta que decide se ele serve pra você' |
| mei_proximos-passos | MEI: 'O registro em si só pode ser feito por você, com sua conta gov.br' (F071) | passos 1 e 2 e o botão do Portal |
| mei_status | MEI: linha do tempo 'Registro do seu MEI' (o andamento no app) | texto do card escuro, 'A conferência é humana' e o link do WhatsApp |
| entrada-intencao-abrir | escolha MEI ou ME com as casas 3D, sem preço | link do WhatsApp |
| migrar_transferencia | ME: linha do tempo da troca de contador (F143); peça de 23/10, recorte y 1312 a 1902 | subtítulo, 'Quanto tempo leva', linha azul, cadeado e link |
| emitir | título, bolhas até x 712 e o campo de valor (peça de 30/10) | 'Repetir última nota', data e 'O serviço' (alíquota 6% e prefeitura) |
| retomar | porta de CPF com a pasta 3D | nada (liberada) |
| conta | criação de acesso com o Léo, sem login social (ME) | nada (liberada; em MEI, a linha da Junta) |
| gate-etapa-faixa | faixas de faturamento do ME com notas 3D | nada (liberada) |
| dossie_atividade e dossie_cnae-secundarios | escolha do CNAE (ME) | nada (liberadas; não afirmar anexo) |
| migrar_cnpj | pedido do CNPJ na migração (ME) | nada (liberada) |

## As perigosas (parecem boas e têm armadilha)

| tela | armadilha |
|---|---|
| inicio | o bloco 'Seu negócio' chama o teto do ME de 'limite do Simples' (R$ 321.600, F082) e traz alíquota 6% 'A menor possível' e Fator R; 'No resto, você está em dia' é promessa |
| impostos_pagar | 'Faturou R$ 4.200 · 6% do Simples' não fecha com R$ 178,31 (daria 252); 'Como pagar' cita Pix e lotérica e 'a gente atualiza aqui' |
| impostos | a vigília repete o 'limite' de R$ 321.600 (é o teto do ME) e o subtítulo diz 'você paga por aqui' |
| mei_faturamento | 'É a única conta que decide' contradiz o F056, e os cartões tratam R$ 6.750 como corte do mês (o F051 diz que é média de um teto anual) |
| endereco-regime-mei | 'Como MEI, você abre de qualquer cidade do Brasil' (F027 em conflito) |
| mei_proximos-passos | os passos 1 e 2 ensinam o gov.br e o Portal (P38), e o botão abre o Portal |
| welcome e entrada | 'Quem resolve é gente de verdade', '22 anos de escritório contábil em BH' e 'mais de 22 anos de história em Belo Horizonte': gente e BH em peça de MEI (P06, F027, F148) |
| obrigacoes | calendário errado: em julho de 2026 o dia 14 é terça e o 20 é segunda, e o PGDAS-D aparece em 15/07 (vence dia 20, F092) |
| mais_declaracoes e mais_em-dia | DEFIS 'em maio/2027' (F095, F098) e PGDAS-D em 15/06 |
| mais_socios | 'O seu plano comporta até 2 sócios' contra o F032 (1 a 4) e pró-labore abaixo do piso (F114) |
| plano, migrar_plano e pagamento | R$ 139 bate com o F003, mas aparece como 'Você paga hoje' sem a promoção de R$ 99 (F004, F005), junto de 'Sem letra miúda', 'Grátis' e o logo do Pix |
| migrar_contrato | 'você recebe tudo de volta' sem a condição do F022 e o card do 'escritório de verdade' |
| emitir | 'Alíquota 6%' e 'os códigos que a prefeitura exige' no bloco do serviço; a data mostra o dia da captura |
| login | o divisor 'ou entre com' tem traço dos dois lados (lê como travessão) e os botões trazem Google e Apple |
| mais_certificado | emissora com o nome de uma certificadora real e 'Emitir nota em segundos' |
| painel_recusa | é a única linha do tempo de abertura do ME capturada, mas no estado de erro vermelho (P23) |

## Páginas de erro

Detectadas por imagem (0,2% de pixels não brancos e o mesmo md5 `e26d634e3f17067c83748e0ad7ec4d84`), por texto (OCR lê '404' e 'This page could not be found.') e pelo código (a rota não tem `page.tsx` no repositório @ab68dbc, apesar de continuar no catálogo `app/src/lib/telas-flow.ts`). Recapturar dá o mesmo 404: a página foi apagada.

| tela | rota | página apagada em (commit) / motivo | dá pra recapturar? |
|---|---|---|---|
| contrato | /contrato | 30/08 (9e09e5c) | não |
| mei_saida_ja-tem-cnpj | /mei/saida/ja-tem-cnpj | 07/09 (b52c270) | não |
| mei_saida_servidor | /mei/saida/servidor | 07/09 (b52c270) | não |
| painel | /painel | 07/09 (22b2150) | não |
| saida_exterior | /saida/exterior | 30/08 (d0eb2b2) | não |
| saida_fora-bh | /saida/fora-bh | 30/08 (d0eb2b2) | não |
| saida_socio-pj | /saida/socio-pj | 30/08 (d0eb2b2) | não |
| saida_socios | /saida/socios | 30/08 (d0eb2b2) | não |
| termo | /termo | 01/09 (e8b3738) | não |
| mei_atividade | /mei/atividade | estado vazio: rota aberta sem `?cat=` | sim, com `/mei/atividade?cat=foto` |
| mei_atividade-secundarias | /mei/atividade-secundarias | estado vazio: rota aberta sem `?cat=` | sim, com `/mei/atividade-secundarias?cat=foto` |

Consequência: o `/painel` (andamento da abertura do ME) não existe mais. A peça de 09/10 ('O sufoco burocrático') usava a linha do tempo dele; hoje as opções são a `painel_recusa` recomposta sem o vermelho, a `mei_status` (MEI) ou pedir a tela ao Pedro.

## Ramo MEI: o que serve sem valor do DAS do MEI

Nenhuma das 10 capturas do ramo MEI mostra valor do DAS do MEI (F063). O que serve, com os cortes:

| tela | status | serve pra MEI | resumo |
|---|---|---|---|
| endereco-regime-mei | aceito com risco | sim | cortar 'qualquer cidade' |
| mei_impedimentos | aceito com risco | sim | cortar a 3ª pergunta |
| mei_saida_ja-tem-cnpj | reprovado | não | 404: página de erro |
| mei_saida_servidor | reprovado | não | 404: página de erro |
| mei_faturamento | aceito com risco | sim | teto do MEI; cortar 'única conta' |
| mei_atividade | reprovado | não | estado vazio (sem categoria) |
| mei_atividade-secundarias | reprovado | não | estado vazio e 'no Portal' |
| mei_status | aceito com risco | sim | linha do tempo do MEI serve |
| mei_certificado | aceito com risco | sim | só o topo e a caixa verde |
| mei_proximos-passos | aceito com risco | sim | topo serve; passos ensinam o Portal |

Fora do ramo, também servem pra peça de MEI com os cortes: dados, emitir, entrada, entrada-intencao-abrir, entrada-intencao-migrar, login, retomar, splash, welcome. A Início no modo MEI (`/inicio?regime=mei`) e a emissão de nota no modo MEI continuam sem captura.

## Medições e constantes do guia

| constante | esperado | medido | confere |
|---|---|---|---|
| card (montada) | {72, 424, 1146, 486, r 46} | captura [72, 552, 1218, 1038]; montada [72, 424, 1218, 910] | sim |
| valor | Sora 600 59px, x 125, base 682 | o desenho do tela.ts cai em [130, 633, 390, 692]; a captura levada pra montada dá [128, 632, 392, 692] | sim |
| esqueleto | {123, 739, 389, 119, r 28} | montada [123, 739, 513, 859] (#F7E4DC) | sim |
| botaoPagar | {123, 739, 389, 119, r 28} | captura [123, 867, 513, 987]; montada [123, 739, 513, 859] (#B83D1C) | sim |
| barra de abas | pílula (48, 2574, 1243, 2764); NF-e (553, 2484, 738, 2671) | pílula [48, 2574, 1242, 2766]; NF-e [552, 2484, 738, 2670] | sim (1 a 2 px de antisserrilhado) |
| colas do Início | [0,70,1290,116], [0,178,1290,264], [0,548,1290,1042] | 'Início' [75, 79, 174, 109]; 'Bom te ver, Ana' [78, 185, 684, 256]; card [72, 552, 1218, 1038] | sim |
| colas do Imposto | [0,106,1290,159], [0,236,1290,336], [0,2428,1290,2756] | cabeçalho [93, 115, 476, 151]; valor [78, 247, 426, 325]; botões [72, 2436, 1218, 2748] | sim |
| BOTAO_VER | x 270, y 2676 (legado) | botão [72, 2604, 633, 2748], centro x 352, y 2676 | não: 82 px à esquerda (manter na regressão, usar 352 nas receitas novas) |
| splash | igual à montada | logo [315, 1332, 975, 1462]; a montada é esta captura pixel a pixel | sim |

Regiões medidas (numpy e cv2) e gravadas em `regioes` na sobreposição: splash (logo, símbolo, palavra), inicio (13 regiões, inclusive a pílula das abas e o NF-e), impostos_pagar (cabeçalho, valor, cards, os três botões com centro), impostos (card escuro do mês), emitir (16 regiões, bolhas uma a uma), migrar_transferencia (passos, linha azul, linha vertical em x 96 a 99 e o recorte de 23/10), mei_faturamento, mei_status, mei_proximos-passos, mei_certificado, mei_impedimentos e endereco-regime-mei (97 regiões ao todo, em 12 telas).

Mudanças de posição medidas: no Imposto do mês o cabeçalho desceu 18 px e o valor 36 px (as colas do `monta_telas.py` de 02/10 já levam isso em conta); na migrar_transferencia a linha do tempo desceu 72 px; o Início e a emitir ficaram nas mesmas posições.

## O que mudou do conjunto antigo

- Fundo: 85 telas com #FFFFFF no pixel (5, 1400); a splash segue coral #F2643C, a welcome ficou escura (#522E27) e o login segue ink #24262C. No conjunto antigo o fundo era papel #FAF8F5.
- 70 telas têm nome igual ao do conjunto antigo; 18 são novas (certificado, dados, dossie_atividade, endereco, endereco-regime-mei, mei_atividade, mei_atividade-secundarias, mei_certificado, mei_faturamento, mei_impedimentos, mei_proximos-passos, mei_saida_ja-tem-cnpj, mei_saida_servidor, mei_status, migrar_dados, migrar_gov, migrar_socios, saida_socio-pj).
- 10 telas antigas não têm par em 02/10: ativa, dossie_natureza, encaixe, entrada-intencao-abrir-regime-me, gate, home-campea, impostos-neutro, pagamento-cenario-empresa-paga-v-0, plano-cenario-empresa-paga-v-0, revisar-cenario-empresa-paga-v-0.
- Status que melhoraram em relação ao inventário antigo: aguardando (reprovado para aceito com risco), conta (aceito com risco para liberado), dossie_cnae-secundarios (reprovado para liberado), dossie_empresa (reprovado para aceito com risco), dossie_socio (aceito com risco para liberado), dossie_vinculo (reprovado para aceito com risco), gate-etapa-faixa (aceito com risco para liberado), revisar (reprovado para aceito com risco).
- Status que pioraram: painel (aceito com risco para reprovado).
- Preços: R$ 195 e R$ 463,51 sumiram; o plano aparece a R$ 139 (F003), mas sempre sem a promoção. O menu Mais continua com o plano de R$ 149 e avulsos sem base.
- Saíram o login social da criação de conta, o veredito com 'imposto baixo' nas outras opções, os cartões de preço da escolha MEI ou ME, o 'qualquer cidade' da escolha de abrir e o endereço real da dossie_socio. Entraram o Léo em quatro telas (welcome, dados, conta e plano), os ícones 3D e o ramo MEI.
- Cada item da sobreposição tem `mudancas` com o fundo antigo e o novo, a diferença em cinza a 1/8 (`difCinza8`), as linhas de OCR iguais, o layout e os textos.

## O que perguntar ao Pedro

1. **Tela real.** As 88 telas são do protótipo Next.js (@ab68dbc), não do app Flutter. Ele aceita chamar alguma de 'tela real do app' ou 'prévia real' (pilar 17, peças de 12/10 e 14/10), ou a fala muda?
2. **Telas que não existem mais.** /painel, /termo, /contrato e as seis saídas foram apagadas do protótipo entre 30/08 e 07/09 (seguem só no catálogo). Pra peça de 09/10, qual andamento mostrar: a painel_recusa sem o vermelho, a mei_status ou uma tela nova?
3. **Modo MEI.** A Início no modo MEI e a emissão no modo MEI não foram capturadas. Recapturar (`/inicio?regime=mei`) antes das peças de MEI?
4. **Recaptura do ramo MEI.** Recapturar `/mei/atividade` e `/mei/atividade-secundarias` com `?cat=foto`?
5. **Preço sem promoção.** As telas de plano e pagamento mostram 'R$ 139 hoje' sem os R$ 99 dos 3 primeiros meses. Pode aparecer assim em peça, ou só com a promoção junto (F004, F005)?
6. **Escritório e 'mais de 22 anos'.** O selo da entrada diz 'mais de 22 anos de história em Belo Horizonte' (o F148 dá 22 anos ou mais de 20) e a welcome diz 'Quem resolve é gente de verdade'. Pode em peça de ME?
7. **WhatsApp nas telas.** Quase todas as telas têm 'Tirar uma dúvida no WhatsApp' ou 'Chama no WhatsApp'. A revisão corta (P11, F009). Ele prefere manter em alguma?
8. **Grafia do app.** O app escreve a marca sem acento em 9 telas (ADR L340, em aberto). Redesenhar o texto nessas telas ou só cortar?
9. **Léo nas telas.** A welcome, a dados, a conta e a plano trazem a arte do Léo do protótipo. Pode usar essa arte em peça (origem não conferida)?
10. **'Nosso time está conferindo' no MEI.** A mei_status fala de conferência humana. Fica no limite da P06: pode aparecer em peça de MEI sem a linha 'A conferência é humana'?
11. **R$ 6.750 por mês.** A mei_faturamento usa R$ 6.750 como corte do mês; o F051 diz que é média de um teto anual. Pode mostrar os cartões assim?
12. **Telas com erro de fato no protótipo.** obrigacoes (dias da semana e PGDAS-D), mais_declaracoes e mais_em-dia (DEFIS em maio), mais_socios (até 2 sócios) e o 'limite do Simples' do Início: avisar o time do app?

## Arquivos

- `KIT/catalogos/telas/revisao-2026-10-02.json`: a sobreposição (88 itens; passa no `valida.py` do K01).
- `KIT/telas-revisao/REVISAO.md`: este arquivo.
- 16 folhas de contato: `folha-b4-1.jpg`, `folha-dinheiro-1.jpg`, `folha-dossie-1.jpg`, `folha-entrada-1.jpg`, `folha-entrada-2.jpg`, `folha-fora-1.jpg`, `folha-migrar-pos-pagamento-1.jpg`, `folha-n4-veredito-1.jpg`, `folha-pausas-1.jpg`, `folha-portal-1.jpg`, `folha-portal-2.jpg`, `folha-portal-3.jpg`, `folha-portal-4.jpg`, `folha-ramo-mei-1.jpg`, `folha-ramo-mei-2.jpg`, `folha-saidas-triagem-1.jpg`.

## Como foi feito

1. OCR do Windows (pt-BR) nas 88 capturas novas e nas 80 antigas: texto e caixa de cada linha e palavra.
2. Busca dos padrões das regras no texto (travessão, a marca sem acento, R$, %, WhatsApp, Portal, gov.br, contador e escritório, tempo, BH, domínios) e cruzamento com os 3.256 trechos com travessão do código do protótipo, pra achar travessão que o OCR perdeu.
3. Folhas de contato a 1/5 e recortes pequenos pra o que só se vê na imagem: logos de terceiros, fotos, erro em vermelho, traço ao lado de texto e as ilustrações.
4. Caixas dos cortes e das regiões medidas com numpy e cv2 a partir das linhas de OCR (fundo pela mediana da borda, componentes conexos pra botões e cards), conferidas desenhadas sobre as telas.
5. Páginas de erro por imagem, por texto e pelo código (rotas sem `page.tsx` e o commit que apagou cada uma).
6. Constantes do guia conferidas na captura e nas montadas de `GP/assets/telas/` (só leitura), e o valor redesenhado com a fonte e a posição do `tela.ts`.
