# DIVERGÊNCIAS: workspace x vault

Onde a memória do workspace, o pacote `identidade/brandmkt/` e os dados do app do cronograma contradizem
o vault. Preços primeiro.

- Conferido contra o commit `64ddda10ab35b406ea2e217bfcc0f530b08e1de3` do vault (21/09/2026), em 25/09/2026
- **Nada em `_memoria/` foi editado.** Quem aprova mudança de memória é o Pedro. A seção 2 traz a linha
  exata e a troca sugerida
- Os dados do app (`cronograma/data/`) e o pacote `identidade/brandmkt/` também não foram editados: só
  listados
- O que já foi corrigido nesta entrega (skills e código do app) está na seção 6
- Onde a linha original tem travessão, ele aparece aqui como `[travessão]` (este arquivo não usa o caractere)
- "F0xx" e "P0x" são os ids de `FATOS.md` e `PROIBIDO.md`

## Resumo

| Onde | O que mais pesa |
|---|---|
| Peças já publicadas no Instagram | reel de 15/09 com R$ 19 e R$ 79 e escassez inventada; post de 28/08 com contador no MEI |
| `_memoria/empresa.md` e `estrategia.md` | R$ 19 e R$ 79 como oferta vigente; "CNPJ <72h"; "baixa sem custo"; simulador como diferencial |
| App do cronograma (dados) | campanha, seed e guia de estilos com R$ 19 e R$ 79; notas que tratam o preço certo (R$ 29 / R$ 99) como o duvidoso; "MEI em qualquer cidade"; guia do MEI de R$ 86,05 |
| `identidade/brandmkt/` | cerca de 150 linhas com R$ 19 e R$ 79 (campanha de agosto, roteiros V1 a V10, peças do ateliê, LP); "sem letra miúda"; prazo de abertura; handle e domínio antigos |

---

## 1. Urgente: peças já publicadas

Estão no banco do cronograma porque vieram do Instagram (sincronização da nossa conta). Decisão do Pedro:
editar a legenda, arquivar ou deixar.

| Onde | O que está no ar | O vault diz |
|---|---|---|
| `cronograma/data/db.json:6023` (reel de 15/09) | "Hoje é o último dia da condição de pré-lançamento (...) MEI por R$19 / ME por R$79 / Depois de hoje, essa condição acaba" | R$ 29 e R$ 99 (F002, F004); promoção vale até 31/12/2026 (F005); "último dia" é escassez inventada (P09) |
| `cronograma/data/db.json:6133` (post de 28/08) | "a contabilidade da sua ME ou MEI (...) Nosso time de contadores (com CRC ativo)"; "Fator R otimizado"; "Chega de pagar 15,5% de imposto" | MEI não tem contador humano (F011, P06); Fator R só pra 15 CNAEs (F084); economia de imposto fora do ângulo (P04) |
| `cronograma/data/db.json:6111` (post de 31/08) | "Você sabe se poderia estar pagando menos?" | ângulo de economia de imposto (P04). Menos grave |

---

## 2. Memória do workspace (`_memoria/`): linhas pra trocar, com aprovação do Pedro

### `_memoria/empresa.md`

| Linha | Hoje | Troca sugerida | Fato |
|---|---|---|---|
| 18 | "### Preços (travados, ADR 20/08 com Mauro)" | "### Preços (vault `01-PLANOS-E-OFERTAS`, ADR 17/09)" | F001 a F005 |
| 20 | "Plano MEI: R$49/mês redondo (nunca R$49,90). Oferta lista de espera: R$19 nos 3 primeiros meses" | "Plano MEI: R$49/mês redondo (nunca R$49,90). Promoção: R$29/mês nos 3 primeiros meses, depois R$49, pra quem entra na lista de espera até 31/12/2026" | F001, F002, F005 |
| 21 | "Plano ME: R$139/mês. Oferta lista de espera (exclusiva de anúncio/campanha): R$79 nos 3 primeiros meses (o preço de lançamento pós-lista é R$99→R$139; peça de campanha usa SEMPRE R$79, nunca R$99)" | "Plano ME: R$139/mês. Promoção: R$99/mês nos 3 primeiros meses, depois R$139. É um preço promocional só por plano (acabou a diferença entre preço de campanha e de lançamento). R$19 e R$79 morreram" | F003, F004, F005, F006 |
| 23 | "Garantia 7 dias (CDC art. 49) em todo post de venda. Nunca 'incondicional', nunca 'sem letra miúda'" | manter e acrescentar: "Condição: desistir antes do envio pra Junta devolve tudo; depois, a taxa da Junta não volta. Fidelidade de 12 meses (MEI e ME) a partir do CNPJ; multa de 30% do saldo restante" | F021 a F025 |
| 7 | "Domínio: legalizei.app (legado, ativo)" | "Links de peça (os únicos): legalizai.com.br, legalizai.com.br/em-breve (lista de espera) e instagram.com/legalizai.app" | F009 |
| 9 | "100% pelo celular" | "100% pelo app, no celular ou no computador" | F036 |
| 9 | Claim "A única contabilidade 100% humana e digital" | manter, com nota: "nunca perto de peça de MEI sem dizer que o humano é do plano ME" | F011, P06 |
| 10 | "22 anos de operação real em BH/MG" | "22 anos de operação real em BH" | F148 |
| 11 | "BH/MG como praça inicial (...) Fora do escopo: comércio/varejo inteiro, indústria, construção, transporte, agro, Lucro Presumido/Real" | "Sede em Belo Horizonte (CEP 30000-000 a 31999-999); região metropolitana fora. Fora do escopo: comércio (inclusive e-commerce e revenda), indústria, Anexos I, II e IV, EPP, Lucro Presumido e Real, 5 ou mais sócios, sócio PJ ou no exterior, regularização e baixa de CNPJ" | F026, F028, F030 a F033 |
| 29 | "Hiperlocal BH/MG (ISS de BH, alvará PBH, Junta MG)" | "Hiperlocal BH (ISS de BH, alvará PBH, Junta de Minas)" | F026 |
| 31 | "Custo de saída declarado (migração e baixa sem custo escondido)" | "Regra de saída escrita no contrato desde o primeiro dia (7 dias, fidelidade de 12 meses, multa de 30% do saldo). Baixa de CNPJ não é serviço nosso" | F021 a F025, F033, P07 |
| 32 | "Onboarding rápido (meta CNPJ <72h)" | "Processo que entra certo, sem exigência boba, cada passo visível no painel. Meta interna de prazo não vai pra copy" | F047, P01 |
| 34 | "Simulador de Fator R aberto e grátis, sem pedir e-mail" | tirar da lista de diferenciais de copy até o Pedro confirmar que o simulador está no ar e é um link permitido | F009, F084 |
| 52 | "Fator R: decide entre 6% e 15,5% de alíquota [travessão] LC 123, Anexos III e V" | "Fator R: só pras atividades que ele decide (15 dos 87 CNAEs de ME). Folha de 28% ou mais leva ao Anexo III, que começa por volta de 6%; abaixo, Anexo V, que começa por volta de 15,5%" | F079, F083, F084 |
| 53 e 54 | "ME/EPP no Simples no Brasil: ~7,4 milhões [travessão] Receita Federal dez/2024" e "Instagram no setor beleza: 83% de presença [travessão] Sebrae" | marcar "fora da peça até entrar em FATOS.md com fonte" | P36 |
| 55 | "BH: 3ª capital em aberturas, CNPJ aberto em 11h [travessão] mercado-bh-regional" | "Nunca em peça: tempo de abertura é promessa de prazo" | P01 |

### `_memoria/preferencias.md`

| Linha | Hoje | Troca sugerida | Fato |
|---|---|---|---|
| 35 | "7. Número sem fonte não entra" | "7. Número sem id de fato em `_base-contabil/FATOS.md` não entra (e fato CONFLITO ou NÃO USAR também não)" | P36 |
| 54 | "Topo/meio educativo: 'Simule seu Fator R grátis (link na bio)'" | "Topo/meio educativo: 'Salva pra quando precisar' ou 'Segue pra mais' (sem link)". O simulador só volta se o Pedro confirmar que existe | F009, F084 |
| nova linha | (não existe) | "Antes de qualquer peça: `node scripts/sincronizar-base-contabil.mjs`, depois ler `_base-contabil/FATOS.md` e `PROIBIDO.md`" | README |

### `_memoria/estrategia.md`

| Linha | Hoje | Troca sugerida | Fato |
|---|---|---|---|
| 12 | "Oferta ativa até 31/12/2026: MEI R$19→R$49 e ME R$79→R$139 nos 3 primeiros meses." | "Oferta ativa até 31/12/2026: MEI R$29→R$49 e ME R$99→R$139 nos 3 primeiros meses (um preço promocional só por plano)." | F002, F004, F005 |
| 51 | "Gatilhos sazonais do calendário fiscal: DASN-SIMEI (maio), IRPF (mar-mai), (...)" | manter DASN-SIMEI (31/05, F065); marcar IRPF como "sem fato em FATOS.md: peça de IRPF precisa de fato antes" | F065, P36 |

### `CLAUDE.md` (não é memória, mas aponta pra fonte velha; também não editei)

| Linha | Hoje | Troca sugerida |
|---|---|---|
| 125 e 126 | "Em conflito entre documentos, a autoridade é o ADR `identidade/brandmkt/01-marca/decisoes-marca.md`" | "Em conflito, vale o vault: `_base-contabil/base-legalizai/` pra fato e `_base-contabil/marca/decisoes-marca.md` (ADR sincronizado) pra marca. `identidade/brandmkt/` é cópia de 01/09" |
| 130 | "Antes de qualquer peça: ler `_memoria/*.md` + `identidade/design-guide.md`" | acrescentar: "e `_base-contabil/FATOS.md` + `PROIBIDO.md`, depois de rodar `node scripts/sincronizar-base-contabil.mjs`" |

---

## 3. App do cronograma: dados (`cronograma/data/`)

`seed.json`, `ideias.json` e `biblioteca.json` alimentam o banco no boot: entrada que ninguém editou no
app recebe a correção desses arquivos; a que foi editada, não. Por isso a correção vale nos dois lugares.

### 3.1 Preços

| Onde | Hoje | Troca | Fato |
|---|---|---|---|
| `db.json:131` e `seed.json:32` (objetivo da campanha `cmp_prelancamento`, vai pro prompt do chat) | "Oferta real até 31/12/2026: MEI R$19 e ME R$79 nos 3 primeiros meses (depois R$49 e R$139)." | "Oferta real até 31/12/2026: MEI R$29 e ME R$99 nos 3 primeiros meses (depois R$49 e R$139)." | F002, F004, F005 |
| `estilos.json:135` (guia do estilo Vendas, vai pro prompt) | "Na lista, o plano MEI sai por R$19 e o ME por R$79 nos 3 primeiros meses; depois, R$49 e R$139. (...)" | R$29 e R$99 | F002, F004 |
| `db.json:2325` e `ideias.json:650` (narração da ideia de oferta) | "Mensalidade do ME: R$79 nos 3 primeiros meses (...)", "Mensalidade do MEI: R$19 (...)" | R$99 e R$29 | F002, F004 |
| `ideias.json:640` (descrição da mesma ideia) | cita os preços antigos | R$29 e R$99 | F002, F004 |
| `db.json:855`, `db.json:1088`, `db.json:2329`, `ideias.json:654`, `biblioteca.json:655`, `biblioteca.json:865` (fontes) | "decisoes-marca.md, ADR 20/08/2026 (...) MEI R$19 (...) ME R$79 (...)" | "`01-PLANOS-E-OFERTAS` e ADR 17/09/2026: MEI R$29 e ME R$99 nos 3 primeiros meses, depois R$49 e R$139" | F002, F004 |
| `db.json:2340`, `4197`, `5368`, `5937`, `5954` (notas das peças de outubro) | tratam R$29 / R$99 do calendário como "a confirmar" e R$19 / R$79 como o oficial ("PREÇO A CONFIRMAR", "Nenhum número entra até o Pedro confirmar") | o calendário estava certo: R$29 e R$99 são os vigentes. Tirar o aviso; os preços podem entrar com os ids | F002, F004, F006 |
| `db.antes-*.json` (7 backups, de 14 a 19 ocorrências de R$19/R$79 cada) | preços antigos | não restaurar sem trocar os preços. A nota `db.json:4197` diz que a versão com número "volta" desse backup | F006 |

### 3.2 Contrato e garantia

| Onde | Hoje | Troca | Fato |
|---|---|---|---|
| `db.json:3284`, `3608`, `4137`, `4175`, `4192`, `5918`, `5972` | "7 dias pra mudar de ideia e receber tudo de volta" | "7 dias pra mudar de ideia, com dinheiro de volta" e a condição (antes do envio pra Junta) | F021, F022 |
| `db.json:2325` | "No ME, permanência mínima de 12 meses a partir do CNPJ. Cancelou antes, multa de 30% do que falta." | vale pros dois planos: "No MEI e no ME, fidelidade de 12 meses a partir do CNPJ (...)" | F023, F025 |

### 3.3 Escopo e promessas

| Onde | Hoje | Troca | Fato |
|---|---|---|---|
| `estilos.json:155`, `db.json:2296`, `2885`, `3139`, `3149`, `3158`, `5918`, `ideias.json:622` | "MEI atende qualquer cidade", "No plano MEI, em qualquer cidade (...)", "MEI, em qualquer cidade. ME, por enquanto, só em BH." | tirar até o Pedro decidir: o vault está em conflito | F027 |
| `db.json:2060` e `ideias.json:399` (notas) | "Não publicar na mesma semana de peça de vendas que cite o prazo de abertura do app" | não existe peça que cite prazo de abertura (P01); a nota pode dizer só "não publicar perto de peça de vendas" | P01 |

### 3.4 Números fiscais

| Onde | Hoje | Troca | Fato |
|---|---|---|---|
| `estilos.json:26`, `76`, `316`, `607`; `biblioteca.json:407`; `db.json:581`, `3308`, `3312`, `3316`, `5223`, `5224`, `5238`, `5241`, `5263`, `5265`, `5273` | guia do MEI de R$ 86,05 (R$ 81,05 de INSS + R$ 5 de ISS), com fonte "notícia de 02/01/2026 da Receita" | tirar o número: "guia fixa por mês, o app mostra o valor certo". A base do Léo (`07` §1) diz que o valor de 2026 "não está travado". Se o Pedro quiser usar R$ 86,05, o caminho é travar o valor no vault (`07` §1) e re-sincronizar | F063 |
| `estilos.json:749`, `db.json:1625`, `ideias.json:5` | simulador de Fator R grátis como CTA | pendente de o Pedro confirmar que o simulador existe e é link permitido (hoje não está entre os três) | F009 |

---

## 4. `identidade/brandmkt/` (cópia de 01/09/2026; o vault vence)

Como é cópia, a saída mais limpa é re-extrair o pacote do vault ou marcar os arquivos de campanha de
agosto como históricos. Lista pra quem for reaproveitar alguma peça. Abreviações: `bm/` =
`identidade/brandmkt/`, `camp/` = `bm/04-marketing/campanha-2026-08/`, `V1..V10` =
`bm/04-marketing/roteiros-venda-simples-NOVOS/`, `pecas/` = `bm/05-motor-atelie/pecas/`.

### 4.1 Preços (R$ 19, R$ 79 e R$ 49,90)

| Onde | O que tem |
|---|---|
| `bm/INDICE.md:115` | "Oferta de campanha (lista de espera): ME R$79 e MEI R$19 nos 3 primeiros meses" |
| `bm/01-marca/decisoes-marca.md:104`, `105`, `111` | R$19→R$49 e R$79→R$139 como oferta, sem marca de expirado (o vault tem a correção no ADR L507, que esta cópia não tem) |
| `bm/01-marca/decisoes-marca.md:71`, `76`, `95` | "Plano MEI: R$49,90/mês (...) certificado digital incluso" (revertido depois, sem marca) |
| `pecas/campanha.json:5` | "MEI R$19→R$49 e ME R$79→R$139" |
| `pecas/mote-b1` a `mote-b4` (linhas 12 a 14) | MEI a R$ 19 |
| `pecas/mote-c1` a `mote-c4` (linhas 12 a 14, 28 e 29) | ME a R$ 79 |
| `camp/copy.md` | MEI R$ 19 nas linhas 144, 159, 162, 187, 190, 216, 219, 246, 249; ME R$ 79 nas linhas 273, 275, 278, 279, 288, 291, 316, 319, 344, 347, 376, 379, 395; notas em 16, 407, 408, 416. A linha 275 diz que R$ 99 "vira o preço de LANÇAMENTO fora desta campanha" (não existe mais) |
| `camp/roteiros-video.md` | MEI nas linhas 153, 164, 172, 173, 184, 185, 188, 219, 231, 233; ME nas linhas 261, 270, 280, 292, 295, 312, 326, 339, 358 |
| `V1` a `V10` | ME a R$ 79 em V1:3,14,15,16 · V2:15 · V3:13 · V4:11,13,14 · V5:15 · V6:13,19 · V7:12 · V8:12 · V9:12 · V10:1,4,5,9,12,13,18,19 (o gancho do V10 é o preço: "O que cabe em R$79") |
| `camp/handoff-lp-copy.md:24` e `61` | texto novo da LP com R$ 19 e R$ 79 |
| `camp/brief.md:21`, `22`, `67`, `68`, `70`, `112` | R$ 19 e R$ 79; linha 70: "Toda copy desta campanha usa ME R$79, nunca R$99" |
| `camp/prompts-imagem.md:45`, `57`, `64`, `71` | cards "R$19 → R$49" e "R$79 → R$139" |
| `camp/guardian-log.md:79`, `97`, `145` | a auditoria da campanha valida "R$79 nunca R$99" |
| `bm/04-marketing/estrategia/mapa-itens-travados-criacao-post.md:175` | "MEI R$19→R$49/mês, ME R$79→R$139/mês" |
| R$ 49,90 como preço do MEI | `bm/04-marketing/estrategia/posicionamento.md:45`; `2026-08-12-estrategia-mkt-para-validacao.md:73, 136, 496, 502, 504, 528, 748`; `bm/03-icp-mercado/economia-preco-cac.md:42, 48, 50, 84, 126, 168`; `concorrentes/matriz-comparativa.md:18, 35`; `concorrentes/insights-estrategicos.md:54` (vault: R$ 49, F001) |
| certificado na conta do MEI | `economia-preco-cac.md:57, 87, 128`; `estrategia-mkt-para-validacao.md:748, 750, 818`; `decisoes-marca.md:139` (vault: MEI sem certificado, F012, F024) |
| endereço fiscal sem preço e sem restrição de plano | `decisoes-marca.md:141`, `145` (vault: R$ 49/mês, só ME, F016) |
| `BUNDLE-01`, `03`, `04`, `05` | cópias concatenadas das mesmas linhas (parte é o R$ 49,90 de concorrente, que não é erro) |

### 4.2 Contrato e garantia

| Onde | O que tem | Fato |
|---|---|---|
| `camp/handoff-lp-copy.md:23` (texto novo da LP) | "Preço fechado, sem letra miúda." | P05 |
| `bm/04-marketing/estrategia/estrategia-organica.md:74` | "7 dias pra mudar de ideia. Dinheiro de volta, sem letra miúda." (mesmo erro no vault, ver FATOS, Conflitos) | P05 |
| `bm/02-personas/persona-a-servico-intelectual.md:93` | "Sem fidelidade-surpresa. Cancela quando quiser, sem multa escondida no contrato." | F023, F025 |
| `bm/02-personas/persona-b-servico-estetico.md:93` | "Sem letra miúda, sem mensalidade que sobe do nada (...) O preço que combinamos hoje continua sendo o de amanhã." (o preço sobe depois de 3 meses) | P05, F002 |
| `persona-e:96` | "Se não gostar, cancela igual cancelaria qualquer assinatura." | F023 |
| `camp/brief.md:82` | "sem taxa de saída punitiva" | F025 |
| `bm/05-motor-atelie/ds/ctas.json:22`, `mecanicas-engajamento.md:116`, `estrategia-mkt:457` | "sem fidelidade-surpresa" sem dizer a fidelidade | F023 |

### 4.3 Escopo e promessas

| Onde | O que tem | Fato |
|---|---|---|
| `bm/01-marca/decisoes-marca.md:68` e `estrategia-mkt:685` | MEI de qualquer cidade | F027 |
| `bm/04-marketing/estrategia/posicionamento.md:52`, personas A a E ("Local: BH/MG"), `identidade/brand-book.md:14`, roteiro-teaser-investidor (versões D a G: "em Minas Gerais") | área atendida como "BH/MG" ou Minas | F026, F028 |
| `estrategia-mkt:604` | "recusa (...) 3+ sócios" (o vault aceita de 1 a 4) | F032 |
| `estrategia-mkt:318`, `824` | Anexo IV no escopo | F031 |
| `estrategia-mkt:320` | Lucro Presumido "adiado, não descartado" | F031 |
| `bm/INDICE.md:52`, `decisoes-marca.md:144`, `metodologia-personas:90` ("103 CNAEs"); `mapa-itens:132`, `templates-imagem.json:15` ("124 CNAEs") | contagens antigas | F034 |
| `bm/01-marca/copy/narracao-elevenlabs-escalada.md:207`, `320`; `roteiro-escalada-mercado.md:138`, `167` | "Contador de verdade desde o primeiro plano." (o primeiro plano é o MEI) | F011, P06 |
| `persona-c:96`; `roteiro-teaser-investidor:46` | "gente de verdade do outro lado, sempre", "com contador de verdade por trás" sem qualificar o plano | P06 |
| `estrategia-organica.md:77`, `estrategia-mkt:351`, `frente-1:77`, `matriz-comparativa:18` | "CNPJ pronto rápido", "meta <72h" | P01 |
| `narracao-elevenlabs-escalada.md:160`, `211`, `226`; `roteiro-escalada-mercado.md:26, 76, 105, 139, 171, 196, 210`; `roteiro-marca-e-visao:52`; `INDICE:46`; `mercado-bh-regional:22, 33, 37` | "Belo Horizonte abre uma empresa em onze horas" como fala | P01 |
| `frente-1:84`; `funil-conversao:68` | "resposta humana em minutos", "atendimento no primeiro minuto" | P12 |
| `posicionamento.md:59`; `decisoes-marca.md:87`; `mecanicas-engajamento.md:92` | baixa e passivo como serviço ou lead | F033, P07 |
| `roteiros-video.md:39`; V1 a V10 (linhas 10 a 17); `handoff-lp:24` | "ou enquanto a lista estiver aberta, o que vier primeiro" (condição que o vault não tem) | F005, P09 |
| `estrategia-organica.md:158`, `159`; `ctas.json:23` | "vagas fundador" | P09 |

### 4.4 Números fiscais e tom

| Onde | O que tem | Fato |
|---|---|---|
| `bm/01-marca/personagem-leo.md:103` (e cópia em `ds/`) | "Dia 20 o DAS vence. Eu já separei, já paguei, já esqueci." (mesmo erro no vault) | F040, P21 |
| `persona-a:90` | "Já calculei, já separei, você só recebe a confirmação." | F040 |
| `V4:5` e `9` | "PASSOU DE R$6.750 NO MÊS? PARA TUDO." (o teto é anual) | F051 |
| `V3:10`; `INDICE:118` | Fator R pra todo prestador de serviço | F084 |
| `glossario-tecnico-humano.md:43`; `exemplos-copy-por-tela.md:58` | "O que te mantém em 6%", "Sua alíquota: 6% · a menor possível" | F079, P14 |
| `conceito-marca:37`, `posicionamento:84`, `estrategia-mkt:192`, `377`, `ds/voz.json:17` | frase-gatilho "vence dia 15" (dia 15 é eSocial e DCTFWeb; o DAS é dia 20) | F077, F102 |
| `fundamentos-cnae:67` | margem de 30% do Fator R como "decisão em aberto" (o vault fixou como recomendação nossa) | F085 |
| `V3:4`, `V3:13`; `glossario:42`, `43`; `personagem-leo:189`; `roteiro-marca-e-visao:56`, `87`; `narracao:203`; teaser E; `ds/personas.json:11`; `posicionamento:16`; `persona-d:86` | "pagar menos imposto", "custa o dobro de imposto" | P04 |

### 4.5 Links e nome

| Onde | O que tem | Fato |
|---|---|---|
| `bm/04-marketing/README.md:11`, `redes-sociais/perfil-instagram.md:11`, `redes-sociais.md:16`, `31`, `naming-defesa:69` | handle "@legalizai-story-book.app" (artefato; o Instagram é instagram.com/legalizai.app) | F009, P28 |
| `identidade/brand-book.md:12` | "Domínio segue `legalizei.app`" (o site é legalizai.com.br) | F009 |
| `posicionamento:97`, `marca.md:13`, `decisoes-marca:18` | domínio "legalizai-story-book.app" | F009, P28 |
| `identidade/brand-book.md:11`; `roteiro-teaser-investidor:13` | "Legalizai" sem acento como grafia | P28 |
| `posicionamento:70`, `85`; `estrategia-mkt:192, 378, 391, 462, 596`; `perfil-linkedin.md:36` | "Legalizai Story Book! 🎉", "Legalizei! 🎉", "A Legalizai Story Book é (...)" | P28 |
| `ctas.json:20`, `mecanicas-engajamento:62`, `114`, `estrategia-mkt:455` | link de simulador de Fator R ("montei o cálculo específico pro seu caso aqui" também promete cálculo de caso) | F009, P13 |
| `funil-conversao:29`, `52`, `78`; `estrategia-mkt:583`; `ctas.json:23` | "download direto", "comece agora" | F008, P11 |

### 4.6 Travessão em texto publicável

`ctas.json:12` ("Deixa sua pergunta na caixinha [travessão] sem vergonha"); a tagline "(...) Story Book
[travessão] e pronto." em `conceito-marca:61`, `posicionamento:70`, `estrategia-mkt:391`; exemplos "depois"
das personas (ex.: `persona-b:87`). Nos campos de copy de `camp/copy.md`, das `pecas/` e nas falas de V1 a V10
não há travessão.

---

## 5. Vault x vault

As inconsistências dentro do próprio vault estão no fim de `FATOS.md` (seção Conflitos) e marcadas em
`PROIBIDO.md`. As que mais afetam conteúdo: MEI fora de BH (F027), valor da guia do MEI (F063), redutor
do IR (F119), data da nota nacional pra ME (F126), prazo "24h" no ADR x proibição de prazo na base (P01).

---

## 6. Já corrigido nesta entrega (não precisa de aprovação)

| Arquivo | Antes | Agora |
|---|---|---|
| `.claude/skills/reels-leo/SKILL.md` regra 9 | "Preço só o travado (ADR): MEI R$19 → R$49, ME R$79 → R$139" | preço, promoção e validade só de FATOS, grupo A; R$ 19 e R$ 79 marcados como mortos |
| `.claude/skills/reels-leo/SKILL.md` §6 | exemplo de número na tela "R$86,05" | "dia 20, 31/05" (com id) |
| `cronograma/server/agente.mjs` (contexto do tipo Vendas) | "A oferta com número (MEI R$19 e ME R$79 nos 3 primeiros meses, depois R$49 e R$139 (...))" | "os valores saem SÓ de FATOS.md (grupo Preços e planos), com os ids nas fontes" |
| `cronograma/server/agente.mjs` (diferenciais de venda) | "tudo pelo celular, onboarding rápido, custo de saída declarado, hiperlocal BH/MG" | "tudo pelo app, abertura sem honorário, regra de saída escrita no contrato, hiperlocal BH (sede em Belo Horizonte). Nunca prometa prazo de abertura." |
| `cronograma/server/ideias-ia.mjs` e `analise.mjs` | "(contabilidade digital para MEI e ME, BH/MG)" | "(...) com sede em Belo Horizonte" |

**Ainda no código, pra decisão do Pedro:** `cronograma/server/agente.mjs:76` deixa a peça de Fator R usar a
CTA "Simule seu Fator R grátis (link na bio)". O simulador não está entre os três links da base (F009).
A peça de Fator R de 23/09 já foi feita; o PROIBIDO injetado no prompt vence essa linha se o assunto voltar.
