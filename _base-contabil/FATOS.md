# FATOS aprovados pra conteúdo

A lista fechada do que o conteúdo do Legalizaí pode afirmar. Número, data, prazo, preço, percentual,
regra de órgão ou afirmação legal que não está aqui NÃO entra na peça.

- Conferido contra o commit `64ddda10ab35b406ea2e217bfcc0f530b08e1de3` do vault (21/09/2026), em 25/09/2026
- Só entra fato escrito nas notas do vault. Nada veio de memória. Onde a nota é ambígua, o fato cita o
  trecho e diz que é ambíguo
- Como citar: o id vai no campo Fontes da peça, no molde `F077 · 07-OBRIGACOES-MENSAIS §5`. O id nunca
  aparece no texto publicado (PROIBIDO P33)

## Como ler

Cada fato tem: id e título, status, a afirmação em português simples, o número com unidade, pra quem vale,
a validade, a fonte e a linha **Cuidado** (o que NÃO afirmar a partir dele).

**Status**
- **USAR**: pode ir pra peça, respeitando o Cuidado
- **NÃO USAR**: está numa nota, mas a própria nota (ou a base do Léo) manda não citar, ou está marcado
  como não conferido. Fica aqui pra ninguém "descobrir" o número de novo e usar
- **CONFLITO**: duas notas do vault discordam. Fica fora da peça até o Pedro decidir. As duas versões
  estão escritas

**Hierarquia das fontes** (quando discordam, vale a de cima, e o fato é marcado)
1. `base-legalizai/00..12` (a base que o Léo usa com cliente real, notas de 04/09 a 19/09/2026)
2. `marca/decisoes-marca.md` (ADR), citado como "ADR L000" (linha)
3. Pesquisa com status 🟢 e norma citada (`pesquisa/...`)
4. `fontes-literais/` (capturas literais de relatórios do Gemini; a "confiança" escrita nelas é a nota que o
   próprio relatório se deu, não uma verificação do Legalizaí)

**Abreviações das fontes** (todas relativas a `_base-contabil/`)

| Sigla | Arquivo |
|---|---|
| `01`...`12` | `base-legalizai/01-PLANOS-E-OFERTAS.md` ... `base-legalizai/12-GATE-DE-SAIDA.md` |
| ADR | `marca/decisoes-marca.md` |
| SOUL · VENDAS | `leo/00-SOUL-personalidade.md` · `leo/skill-vendas.md` |
| MEI-OBRIG | `pesquisa/obrigacoes-operacionais/mei-obrigacoes-operacionais.md` |
| MEI-BRUTO | `pesquisa/obrigacoes-operacionais/resultado-pesquisa-mei-obrigacoes-28-08.md` |
| ABERT-MEI | `pesquisa/abertura-mei/abertura-mei-processo.md` |
| FISCAL-BH | `pesquisa/fiscal-simples-bh-2026.md` |
| ROTINA · AUDIT | `pesquisa/rotina-fiscal/2026-09-09-rotina-me-simples-bh.md` · `...-verificacao-auditoria-tributaria.md` |
| JUCEMG-EX | `pesquisa/exigencias-jucemg.md` |
| LIT-FECH · LIT-LAC | `fontes-literais/2026-09-14-fechamento-motor-fiscal-LITERAL.md` · `...-lacunas-motor-fiscal-LITERAL.md` |
| LIT-DEFIS · LIT-ELEG | `fontes-literais/2026-09-15-defis-e-canais-LITERAL.md` · `...-elegibilidade-simples-LITERAL.md` |
| LIT-PRO · LIT-RED | `fontes-literais/2026-09-15-pro-labore-por-socio-LITERAL.md` · `2026-09-16-redutor-irrf-consulta-LITERAL.md` |
| LIT-RISCO · LIT-ANEXOS | `fontes-literais/2026-09-18-risco-medio-liberacao-bh-LITERAL.md` · `...-transcricao-anexos-risco-bh-LITERAL.md` |
| ORG · POS | `estrategia/estrategia-organica.md` · `estrategia/posicionamento.md` |

## Resumo

| Grupo | Ids | Fatos | USAR | NÃO USAR | CONFLITO |
|---|---|---|---|---|---|
| A. Preços e planos | F001 a F025 | 25 | 24 | 1 | 0 |
| B. Escopo do Legalizaí | F026 a F050 | 25 | 24 | 0 | 1 |
| C. MEI | F051 a F076 | 26 | 22 | 3 | 1 |
| D. ME e Simples Nacional | F077 a F112 | 36 | 30 | 3 | 3 |
| E. Pró-labore | F113 a F122 | 10 | 7 | 2 | 1 |
| F. NFS-e nacional | F123 a F128 | 6 | 3 | 2 | 1 |
| G. Abertura e troca de contador | F129 a F147 | 19 | 13 | 5 | 1 |
| H. Calendário fiscal | índice | 0 novos (15 datas, cada uma aponta pro fato) | | | |
| I. Institucional | F148 | 1 | 1 | 0 | 0 |
| **Total** | | **148** | **124** | **16** | **8** |

---

## A. Preços e planos (F001 a F025)

**F001 · Mensalidade do plano MEI** · USAR
O plano MEI custa R$ 49 por mês.
- Número: R$ 49 por mês · Vale pra: plano MEI · Validade: preço cheio vigente; é o valor do 4º mês em diante pra quem entra na promoção
- Fonte: `01` §1 · ADR L507 (17/09/2026)
- Cuidado: nunca "R$ 49,90" (morto, ADR L103). O endereço fiscal também custa R$ 49 (F016): diga sempre de qual dos dois está falando.

**F002 · Promoção do plano MEI** · USAR
Nos 3 primeiros meses o plano MEI sai por R$ 29 por mês; depois vai pra R$ 49.
- Número: R$ 29 por mês, 3 meses · Vale pra: plano MEI, quem entra na lista de espera · Validade: até 31/12/2026 (F005)
- Fonte: `01` §1 e §5 · ADR L507
- Cuidado: sempre os dois números juntos (o promocional e o cheio) e a data de validade; "com promoção nos 3 primeiros meses" sem dizer quanto é meia resposta (VENDAS §3).

**F003 · Mensalidade do plano ME** · USAR
O plano ME (Microempresa no Simples Nacional) custa R$ 139 por mês.
- Número: R$ 139 por mês · Vale pra: plano ME · Validade: preço cheio vigente; valor do 4º mês em diante
- Fonte: `01` §2 · ADR L507
- Cuidado: existe outro "R$ 139" no vault, de uma taxa de desenquadramento, sem relação com o plano (ADR L507).

**F004 · Promoção do plano ME** · USAR
Nos 3 primeiros meses o plano ME sai por R$ 99 por mês; depois vai pra R$ 139.
- Número: R$ 99 por mês, 3 meses · Vale pra: plano ME, quem entra na lista de espera · Validade: até 31/12/2026 (F005)
- Fonte: `01` §2 e §5 · ADR L507
- Cuidado: é o único promocional do ME. Não existe "R$ 99 de lançamento e outro valor de lista" (F005).

**F005 · Validade e regra da promoção** · USAR
A promoção vale até 31/12/2026 e quem garante é quem entra na lista de espera. É um preço promocional só por plano: não existe mais diferença entre promoção de lançamento e promoção de lista de espera. Depois dos 3 primeiros meses, o valor vai pro cheio.
- Número: 31/12/2026; 3 meses · Vale pra: MEI e ME · Validade: até 31/12/2026
- Fonte: `01` §5 · ADR L507
- Cuidado: a data é real e pode ser usada como gatilho, escrita com dia, mês e ano (VENDAS §8.2). Proibido inventar escassez ("só hoje", "últimas vagas", "vagas de fundador") (PROIBIDO P09).

**F006 · Preços antigos morreram** · NÃO USAR
Os valores de promoção R$ 19 (MEI) e R$ 79 (ME) expiraram e não existem mais.
- Número: R$ 19 e R$ 79 (mortos) · Vale pra: ninguém · Validade: expirados antes de 17/09/2026
- Fonte: `01` topo · ADR L507 ("Os tiers de R$19 e R$79 estão mortos")
- Cuidado: nunca escrever esses números. Se aparecerem em ideia, peça antiga, memória ou pedido, a peça usa F002 e F004 e avisa a divergência.

**F007 · O que a lista de espera é** · USAR
A lista de espera garante o preço promocional dos 3 primeiros meses dentro da validade, não cobra nada na entrada, não compromete com contratação e serve pra pessoa ser avisada quando o app abrir. Quem entra é a própria pessoa, pelo link.
- Número: não tem · Vale pra: MEI e ME · Validade: pré-lançamento
- Fonte: `01` §5 · VENDAS §8.4 e §8.5
- Cuidado: não prometer nada além disso. Nunca "te coloquei na lista".

**F008 · App em pré-lançamento** · USAR
O app está em pré-lançamento: ainda não existe link de download nem nome na loja. A lista de espera é o passo que existe hoje.
- Número: não tem · Vale pra: todos · Validade: até o lançamento (sem data nas notas)
- Fonte: `01` §5 · `02` topo
- Cuidado: nada de "baixe agora", "já disponível", nome de loja ou data de lançamento (PROIBIDO P11). Fale "o app que tá chegando".

**F009 · Os três links** · USAR
Os únicos links da Legalizaí são: lista de espera `https://www.legalizai.com.br/em-breve`, site `https://www.legalizai.com.br` e Instagram `https://www.instagram.com/legalizai.app/`. E-mail e telefone não estão na base.
- Número: não tem · Vale pra: todos · Validade: vigente
- Fonte: `01` §5
- Cuidado: nenhum outro link (nem simulador, nem domínio antigo). Em reel orgânico o CTA é "link da bio" (PROIBIDO P32).

**F010 · O que o plano MEI inclui** · USAR
O plano MEI inclui abertura sem honorário, manutenção mensal, emissão de guias e assistente virtual de contabilidade.
- Número: não tem · Vale pra: plano MEI · Validade: vigente
- Fonte: `01` §1
- Cuidado: "assistente virtual" é o suporte do MEI. Ver F011 e F012.

**F011 · MEI não tem contador humano** · USAR
O plano MEI não inclui contador humano dedicado. O suporte do MEI é virtual. Contador com CRC é do plano ME.
- Número: não tem · Vale pra: plano MEI · Validade: vigente
- Fonte: `01` §1 · `00` §4 · ADR L115 (26/08/2026)
- Cuidado: nem dito, nem insinuado, nem por imagem (PROIBIDO P06). Dizer isso sem ser perguntado é argumento, não risco (VENDAS §3).

**F012 · MEI e certificado digital** · USAR
O plano MEI não inclui certificado digital (decisão de 28/08). O MEI não precisa de certificado pra emitir nota fiscal de serviço.
- Número: não tem · Vale pra: MEI · Validade: vigente desde 28/08/2026
- Fonte: `01` §1 · `07` §1 · ADR L190
- Cuidado: nunca usar o certificado como contrapartida da fidelidade do MEI (F024).

**F013 · O que o plano ME inclui** · USAR
O plano ME inclui contador humano com registro no CRC cuidando da rotina fiscal, o app com acompanhamento e o certificado digital e-CNPJ incluso, sem custo extra.
- Número: não tem · Vale pra: plano ME · Validade: vigente
- Fonte: `01` §2 · `07` §2
- Cuidado: o contador cuida das declarações e do caso fora do padrão; o cálculo do mês é do sistema (F040, F042). Nunca "nossos contadores fazem essa conta mês a mês" (PROIBIDO P21).

**F014 · Preço do certificado fora da Legalizaí** · USAR
Fora da Legalizaí, certificadoras cobram em torno de R$ 209 por ano pelo certificado digital.
- Número: em torno de R$ 209 por ano · Vale pra: referência de mercado (o certificado vem incluso no plano ME) · Validade: nota de 17/09/2026
- Fonte: `01` §2 · `07` §2
- Cuidado: é preço de terceiro e aproximado. Sempre "em torno de", nunca valor exato.

**F015 · Abertura sem honorário** · USAR
A Legalizaí não cobra honorário pra abrir a empresa. A receita é a mensalidade.
- Número: não tem · Vale pra: MEI e ME · Validade: vigente
- Fonte: `01` §1 e §2
- Cuidado: "sem honorário" não é "grátis": no ME existe a taxa da Junta, que é do Estado (F018). Nada de "sem custo extra na abertura" (ADR L260, PROIBIDO P10).

**F016 · Endereço fiscal** · USAR
Quem não tem endereço em BH (ou só tem endereço residencial que não pode receber a empresa, ou mora em apartamento sem cumprir a regra da Prefeitura) pode usar o endereço do escritório da Legalizaí em BH como sede. Custa R$ 49 por mês, somado à mensalidade do plano, cobrança recorrente. Aprovação automática. Não se aplica ao MEI.
- Número: R$ 49 por mês · Vale pra: só plano ME · Validade: vigente
- Fonte: `03` §1 · `09` §1 · `12` §5
- Cuidado: o preço e a condição vão na mesma peça da oferta (oferecer sem o valor faz parecer cortesia). R$ 49 coincide com o plano MEI (F001).

**F017 · Plano ME com endereço fiscal** · USAR
Plano ME com endereço fiscal são dois itens de cobrança: R$ 148 nos 3 primeiros meses e R$ 188 depois.
- Número: R$ 148 (3 meses) e R$ 188 (depois) · Vale pra: plano ME com endereço fiscal · Validade: até 31/12/2026 pro promocional
- Fonte: ADR L507
- Cuidado: o endereço fiscal não se funde ao plano: são dois itens (ADR L507).

**F018 · Taxa da Junta Comercial de Minas (JUCEMG)** · USAR
Na abertura da ME existe a taxa da JUCEMG de R$ 281,08. Cobre dois atos no mesmo processo (o contrato e o enquadramento de Microempresa), vai inteira pro Estado de Minas, aparece separada na tela e é cobrada só quando a viabilidade volta deferida, não junto com o plano. O MEI é isento dessa taxa.
- Número: R$ 281,08 · Vale pra: ME (MEI isento) · Validade: valor da guia real de 01/09/2026
- Fonte: `03` §2 · `02` §2 (item 7) · ADR L231 e L489
- Cuidado: R$ 268,51 (FISCAL-BH, rodada 4) e R$ 288 são versões antigas, superadas pelo ADR L489 ("Nem 268,51, nem 288"). Não é mensalidade nem margem nossa.

**F019 · Taxa da Junta não volta depois do protocolo** · USAR
Depois que o processo é protocolado na Junta, o Estado já prestou o serviço e não existe devolução da taxa, nem por nós nem por eles. Antes de autorizar o envio, nada disso aconteceu.
- Número: não tem · Vale pra: ME · Validade: vigente
- Fonte: `03` §2 · `10` §2
- Cuidado: dizer isso na entrada, não esconder.

**F020 · Serviço e taxa separados na tela** · USAR
Na tela de pagamento, a Legalizaí separa visualmente o que é serviço nosso e o que é taxa de governo. O cliente nunca paga sem ver pra onde vai cada parte.
- Número: não tem · Vale pra: MEI e ME · Validade: descrição do produto (app em pré-lançamento, F008)
- Fonte: `02` §4
- Cuidado: não descrever tela ou botão além do que a nota diz.

**F021 · 7 dias pra desistir** · USAR
A pessoa tem 7 dias pra desistir e receber o dinheiro de volta, com base no direito de arrependimento do Código de Defesa do Consumidor (art. 49), que vale pra contratação feita fora de loja física.
- Número: 7 dias · Vale pra: MEI e ME · Validade: vigente
- Fonte: `10` §1
- Cuidado: diga "7 dias pra mudar de ideia, com dinheiro de volta". Nunca "sem letra miúda" nem "incondicional" (PROIBIDO P05), e sempre com a condição de F022.

**F022 · A condição honesta dos 7 dias** · USAR
Desistir antes de autorizar o envio pra Junta devolve tudo, porque nada foi gasto. Depois que a empresa foi aberta, o serviço já foi executado: a taxa paga ao Estado não volta e a regra de cancelamento do plano vale normalmente.
- Número: não tem · Vale pra: MEI e ME · Validade: vigente
- Fonte: `10` §1 e §2
- Cuidado: nunca "receber tudo de volta" sem essa condição.

**F023 · Fidelidade de 12 meses** · USAR
O plano tem fidelidade de 12 meses, contados a partir da emissão do CNPJ. Vale pros dois planos, MEI e ME.
- Número: 12 meses · Vale pra: MEI e ME · Validade: vigente
- Fonte: `10` §3
- Cuidado: nunca "sem fidelidade" nem "cancela quando quiser" sem essa regra (SOUL, Casos que já deram errado).

**F024 · A contrapartida da fidelidade** · USAR
No ME, a contrapartida é abertura sem honorário, certificado digital incluso e o preço promocional dos primeiros meses. No MEI, é abertura sem honorário e o preço promocional, e só.
- Número: não tem · Vale pra: MEI e ME (diferente em cada um) · Validade: vigente
- Fonte: `10` §3
- Cuidado: nunca usar o certificado pra justificar a fidelidade do MEI.

**F025 · Multa de cancelamento** · USAR
Cancelar dentro da fidelidade tem multa de 30% sobre o saldo restante do período, ou seja, sobre as parcelas que ainda iam vencer, nunca sobre o que já foi pago. Fora da fidelidade, cancela quando quiser, respeitando o aviso do contrato.
- Número: 30% do saldo restante · Vale pra: MEI e ME · Validade: vigente
- Fonte: `10` §4
- Cuidado: nunca calcular a multa de um caso, negociar ou prometer isenção.

---

## B. Escopo do Legalizaí (F026 a F050)

**F026 · Sede em Belo Horizonte** · USAR
A Legalizaí atende empresa com sede em Belo Horizonte. A faixa de CEP de BH vai de 30000-000 a 31999-999.
- Número: CEP 30000-000 a 31999-999 · Vale pra: MEI e ME (ver F027 sobre o MEI) · Validade: vigente (nota de 17/09/2026)
- Fonte: `09` §1
- Cuidado: nunca "BH/MG" ou "Minas Gerais" como área atendida: é só a cidade de BH.

**F027 · MEI fora de BH** · CONFLITO
- Versão 1: ADR L68 (03/08/2026, travado): "MEI não tem o limite geográfico do MLP", "a Legalizai consegue abrir MEI de qualquer cidade do Brasil, só o ME/Simples é que hoje só atende BH/MG".
- Versão 2: `09` §1 (17/09/2026): "A gente atende empresa com sede em Belo Horizonte", sem exceção pro MEI; e a saída pra quem não tem endereço em BH (endereço fiscal) é "só no plano ME" (`09` §1, `12` §5, `03` §1: "Não se aplica ao MEI").
- Cuidado: até o Pedro decidir, nenhuma peça diz "MEI em qualquer cidade" nem "MEI só em BH".

**F028 · Região metropolitana fora** · USAR
Cidade da região metropolitana (Contagem, Betim, Nova Lima, Santa Luzia e vizinhas) não entra hoje: a Junta é a mesma, mas a Prefeitura e o ISS são outros, e o processo é calibrado pra BH.
- Número: não tem · Vale pra: todos · Validade: vigente
- Fonte: `09` §1
- Cuidado: sem data pra quando vai atender (PROIBIDO P08). A saída que existe é o endereço fiscal no ME (F016).

**F029 · Onde o dono mora não importa** · USAR
O que vale é o endereço da empresa. Quem mora em outra cidade ou outro estado pode ter empresa sediada em BH, e o sócio de outro estado assina do celular dele, com a conta gov.br.
- Número: não tem · Vale pra: MEI e ME · Validade: vigente
- Fonte: `09` §1 · `04` (Atrito)
- Cuidado: pro MEI de fora de BH, ver F027.

**F030 · Só serviço** · USAR
A Legalizaí atende atividade de serviço. Comércio e loja estão fora, inclusive e-commerce, revenda e indústria. Pode ter atividade principal e secundárias no mesmo CNPJ, mas todas precisam ser de serviço.
- Número: não tem · Vale pra: MEI e ME · Validade: vigente
- Fonte: `09` §2 · `12` §6 · SOUL (Verdade acima de tudo)
- Cuidado: na peça que fala do limite, dizer o que a gente cuida, com a palavra "serviço" (`12` §6).

**F031 · Regimes e anexos atendidos** · USAR
A Legalizaí atende MEI e ME no Simples Nacional, só nos Anexos III e V. Anexo I (comércio), Anexo II (indústria) e Anexo IV (construção civil, limpeza, vigilância, advocacia) estão fora. EPP, Lucro Presumido e Lucro Real também.
- Número: não tem · Vale pra: todos · Validade: vigente
- Fonte: `09` §2 · `05` §2
- Cuidado: não citar alíquota dos anexos que a gente não atende (`05` §2).

**F032 · Sócios** · USAR
De 1 a 4 sócios, todos pessoa física e domiciliados no Brasil. Fora: 5 ou mais sócios, sócio pessoa jurídica, sócio no exterior.
- Número: 1 a 4 sócios · Vale pra: ME · Validade: vigente
- Fonte: `09` §2
- Cuidado: sócio na Legalizaí não tem benefício (plano de saúde, vale): isso não faz parte do produto (`09` §2).

**F033 · Só abertura ou migração** · USAR
A Legalizaí atende empresa nascendo (abertura) ou migração de quem já tem CNPJ. Regularização não: empresa abandonada, baixa de CNPJ, dívida antiga e passivo pendente não estão no produto, nem com o time humano.
- Número: não tem · Vale pra: todos · Validade: vigente
- Fonte: `09` §2 · `skill-escalacao` §4
- Cuidado: nunca "a gente resolve seu passivo" nem "baixa sem custo" (PROIBIDO P07).

**F034 · Quantos CNAEs** · USAR
São 87 CNAEs de ME atendidos (65 no Anexo III fixo, 15 que o Fator R decide, 7 em revisão) e 51 CNAEs de MEI.
- Número: 87 (65 + 15 + 7) e 51 · Vale pra: ME e MEI · Validade: lista revalidada, nota de 17/09/2026
- Fonte: `09` §4 · `11` §2
- Cuidado: não afirmar anexo, alíquota ou atendimento de um código específico (PROIBIDO P16). Pros 7 em revisão, nenhuma afirmação. Contagens antigas (103, 124, 460) estão superadas.

**F035 · As 15 categorias do app** · USAR
O app oferece 15 categorias de serviço: tecnologia e software; design; foto, vídeo e áudio; marketing e publicidade; edição e mídia; consultoria, pesquisa e tradução; ensino e cursos; arte, cultura e patrimônio; eventos e entretenimento; apoio administrativo; aluguel de equipamentos; reparos e manutenção; salão e beleza; hospedagem; atividade regulamentada.
- Número: 15 categorias · Vale pra: MEI e ME · Validade: vigente
- Fonte: `11` §4
- Cuidado: atender uma categoria não quer dizer que a profissão pode ser MEI (`05` §4C, `09` §0).

**F036 · Tudo pelo app, assinatura do próprio titular** · USAR
A jornada é 100% pelo aplicativo, no celular ou no computador, sem papel, cartório ou ida a repartição. A assinatura é digital, com a conta gov.br do próprio titular. A Legalizaí não assina por procuração.
- Número: não tem · Vale pra: ME (o MEI, ver F071) · Validade: descrição do produto (pré-lançamento, F008)
- Fonte: `02` §1 · `03` §2
- Cuidado: "100% pelo celular" é meia verdade (também no computador). Motivo de não usar procuração: F133.

**F037 · A ordem das etapas** · USAR
1) dados básicos e escolha do caminho; 2) endereço da empresa e categoria de atividade; 3) cadastro e pagamento do plano; 4) dossiê (atividade, dados pessoais, sócios, endereço com IPTU, nome da empresa); 5) revisão ("Está tudo certo?", com "Ajustar" em cada bloco); 6) autorização do envio pra Junta (ponto sem volta); 7) taxa da Junta, quando a viabilidade volta deferida; 8) acompanhamento no painel até o CNPJ sair.
- Número: 8 etapas · Vale pra: abertura de ME · Validade: descrição do produto
- Fonte: `02` §2
- Cuidado: a revisão não vem antes do pagamento do plano (`02` §2). Nenhum prazo por etapa.

**F038 · Corrigir um dado** · USAR
Antes de autorizar o envio, corrigir é tranquilo e sem custo, pelo "Ajustar" na revisão. Depois de autorizar, o processo já está na Junta: mudar dado significa cancelar a viabilidade e refazer, e a taxa paga ao Estado não volta.
- Número: não tem · Vale pra: ME · Validade: descrição do produto
- Fonte: `02` §3 · `08` (itens 11 e 12)
- Cuidado: não prometer conserto depois do envio.

**F039 · O que a gente preenche por dentro** · USAR
Capital social, tipo de sociedade, metragem do imóvel, profissão no contrato, qualificação de sócio nos sistemas do governo e outros campos oficiais são preenchidos pela Legalizaí, com valor padrão decidido pra esse perfil de empresa. Se o caso pedir algo diferente, quem olha é o contador.
- Número: não tem · Vale pra: ME · Validade: descrição do produto
- Fonte: `08` (Coisas que a gente NÃO pergunta)
- Cuidado: não inventar o valor padrão de nenhum desses campos.

**F040 · Quem faz o quê no dia a dia** · USAR
O cliente emite a nota de cada serviço (pelo app, em poucos campos) e paga a guia. O sistema soma o faturamento, descobre o anexo e a alíquota, calcula o imposto, emite a guia, acompanha o Fator R e ajusta o pró-labore, e monitora o teto do MEI. A Legalizaí avisa prazos e vencimentos pelo app e pelo WhatsApp. No ME, o contador com CRC entrega as declarações (PGDAS, DEFIS) e decide o caso fora do padrão.
- Número: não tem · Vale pra: MEI e ME · Validade: descrição do produto
- Fonte: `07` §3 · `02` §5
- Cuidado: o DAS é guia do governo; a Legalizaí calcula, emite e entrega pronta. Nunca "você soma", "você não pode errar o anexo", nem "eu paguei sua guia" (PROIBIDO P21).

**F041 · Emitir nota pelo app** · USAR
Emitir nota fiscal é funcionalidade do app nos dois planos, ME e MEI: a pessoa põe os dados de quem vai receber a nota, o valor, e emite. São poucos campos, o resto o sistema já preenche.
- Número: não tem · Vale pra: MEI e ME · Validade: descrição do produto (pré-lançamento, F008)
- Fonte: `07` §4 · `07` §1
- Cuidado: não descrever tela, botão ou campo que não está na base. Medo de emitir: primeiro a simplicidade, depois, em uma frase, "tem gente de verdade pra orientar" (e no MEI isso não pode virar contador humano).

**F042 · Onde entra o contador** · USAR
O contador com CRC entra nas declarações e no caso fora do padrão. O cálculo do mês é do sistema, automático.
- Número: não tem · Vale pra: plano ME · Validade: vigente
- Fonte: `07` §3 · `05` §2
- Cuidado: nunca "o contador vê o valor e a alíquota". Contador é diferencial real do ME, nunca alvo de piada.

**F043 · O cálculo foi conferido contra guia real** · USAR
O cálculo fiscal foi conferido contra guia real da Receita: 46 conferências contra documento emitido e 162 meses de empresa simulados, sem falha. Foi validado por contador especializado em 16/09/2026.
- Número: 46 conferências; 162 meses; 16/09/2026 · Vale pra: cálculo do DAS da ME · Validade: conferência de 16/09/2026
- Fonte: `06` topo e §6 ("verdade verificável e pode ser dito")
- Cuidado: não transformar em "zero erro garantido" pro caso da pessoa (PROIBIDO P03).

**F044 · Monitoramento do teto do MEI** · USAR
O governo não avisa quem estoura o teto do MEI: não existe ferramenta oficial de monitoramento, é manual e sem alerta. A Legalizaí monitora isso.
- Número: não tem · Vale pra: MEI · Validade: vigente
- Fonte: `07` §1 ("esse é um diferencial real") · MEI-OBRIG §5 (🟢)
- Cuidado: sempre com o valor do teto junto (F051).

**F045 · Prova antes de pagar** · USAR
No app, antes de qualquer pagamento, aparecem o CNPJ da Legalizaí, o CRC do contador e o contrato inteiro pra ler. Nada é assinado antes disso.
- Número: não tem · Vale pra: MEI e ME · Validade: descrição do produto
- Fonte: `04` (Topo de funil, "Isso é golpe?")
- Cuidado: dizer onde a prova está, nunca "te mando por DM" (PROIBIDO P12).

**F046 · O Léo é automatizado** · USAR
O Léo é o atendimento automatizado da Legalizaí. Assunto sério ele passa pra gente de verdade.
- Número: não tem · Vale pra: canal de atendimento · Validade: vigente
- Fonte: `00` §6
- Cuidado: nunca apresentar o Léo como humano, como o Pedro ou como contador (PROIBIDO P30).

**F047 · A fila é do órgão** · USAR
Depois que o processo entra na Junta, a fila é do órgão (Junta e Receita), não da Legalizaí. O que a Legalizaí garante é o processo entrar certo, sem exigência boba, e a pessoa ver cada passo no painel.
- Número: não tem · Vale pra: abertura · Validade: vigente
- Fonte: `09` §5 · `04` ("Em quantos dias sai meu CNPJ?") · `02` §2 (item 8)
- Cuidado: nunca cravar dias, horas ou minutos (PROIBIDO P01).

**F048 · Por que o app pergunta o vínculo de INSS** · USAR
O app pergunta se a pessoa já contribui por fora (CLT, aposentadoria, outro CNPJ) pra evitar recolher INSS duas vezes sobre o mesmo teto.
- Número: não tem · Vale pra: ME · Validade: descrição do produto
- Fonte: `08` (item 7) · `06` §4
- Cuidado: não calcular o INSS do caso.

**F049 · Por que o app pede RG, estado civil e regime de bens** · USAR
O contrato social exige qualificação civil completa de cada sócio (art. 997 do Código Civil).
- Número: não tem · Vale pra: ME · Validade: vigente
- Fonte: `08` (item 6)
- Cuidado: dado sensível nunca é pedido em comentário ou DM (PROIBIDO P34).

**F050 · Sócio administrador assina sozinho** · USAR
Por padrão, qualquer sócio administrador age e assina sozinho pela empresa no dia a dia. Assinatura de todos só é exigida em atos extraordinários (vender bem da sociedade, por exemplo).
- Número: não tem · Vale pra: ME com sócios · Validade: padrão do contrato da Legalizaí
- Fonte: `03` §2
- Cuidado: é o padrão do contrato gerado; caso diferente é do contador.

---

## C. MEI (F051 a F076)

**F051 · Teto do MEI** · USAR
O teto de faturamento do MEI é R$ 81.000 por ano, média de R$ 6.750 por mês. Está congelado desde 2018 (a LC 155/2016 elevou de R$ 60 mil pra R$ 81 mil).
- Número: R$ 81.000 por ano (média R$ 6.750 por mês) · Vale pra: MEI · Validade: vigente em 2026
- Fonte: `09` §3 · `07` §1 · `05` §4 · MEI-OBRIG §5 (LC 123/2006 art. 18-A)
- Cuidado: sempre escrever o valor junto de "teto do MEI" (`09` §3). O teto é anual: R$ 6.750 é média, não limite do mês.

**F052 · Proposta de teto maior não é lei** · NÃO USAR
Há projeto de lei em tramitação propondo teto de R$ 130 mil a R$ 140 mil. Não é lei.
- Número: R$ 130 mil a R$ 140 mil (proposta) · Vale pra: ninguém · Validade: nota de 28/08/2026
- Fonte: MEI-OBRIG §5 · MEI-BRUTO §5
- Cuidado: nunca usar como valor vigente nem prometer que "vai subir".

**F053 · Teto no ano de abertura** · USAR
Quem abre o MEI no meio do ano tem teto proporcional: R$ 6.750 vezes os meses ativos. O mês de abertura conta inteiro, mesmo se abriu no último dia.
- Número: R$ 6.750 por mês ativo · Vale pra: MEI no ano de abertura · Validade: vigente
- Fonte: MEI-OBRIG §5 (🟢) · MEI-BRUTO §5
- Cuidado: não fazer a conta do caso de alguém.

**F054 · Estouro do teto até 20%** · USAR
Se o faturamento do ano passar do teto em até 20% (de R$ 81.000,01 a R$ 97.200,00), o efeito é só a partir de 1º de janeiro do ano seguinte, e o DAS complementar cobra só o excedente, pelas alíquotas de ME, sem juros nem multa.
- Número: até 20%; R$ 81.000,01 a R$ 97.200,00 · Vale pra: MEI · Validade: vigente
- Fonte: MEI-OBRIG §5 (🟢, LC 123/2006 art. 18-A §7º I e II)
- Cuidado: tom de informação, sem susto (PROIBIDO P23).

**F055 · Estouro do teto acima de 20%** · USAR
Se passar de 20% do teto (acima de R$ 97.200,01), o desenquadramento é retroativo: à data de abertura, se foi no próprio ano, ou a 1º de janeiro. Tudo é recalculado como ME, com juros e multa.
- Número: acima de R$ 97.200,01 · Vale pra: MEI · Validade: vigente
- Fonte: MEI-OBRIG §5 (🟢, LC 123/2006 art. 18-A §7º)
- Cuidado: é justamente o risco que o monitoramento (F044) previne. Sem terrorismo fiscal.

**F056 · MEI é filtro jurídico** · USAR
MEI não é "o Simples com teto menor": a lista de ocupações permitidas é própria e fechada (Anexo XI da resolução do Comitê Gestor). Quando a atividade não cabe no MEI, o caminho é ME no Simples Nacional, e isso é boa notícia.
- Número: não tem · Vale pra: MEI · Validade: vigente
- Fonte: `03` §4 · `05` §4 · ABERT-MEI (Elegibilidade, item 5)
- Cuidado: a lista não está no vault. Ninguém afirma de cabeça se uma profissão entra (F057).

**F057 · As duas únicas listas de profissão** · USAR
Fotógrafo (e foto, vídeo e áudio) pode ser MEI, e a Legalizaí atende. Desenvolvimento de software, medicina, engenharia, arquitetura, advocacia, contabilidade e consultoria não podem ser MEI (atividade intelectual, científica, técnica ou regulamentada, art. 966 do Código Civil) e vão de ME.
- Número: 1 que pode, 7 que não podem · Vale pra: MEI · Validade: vigente
- Fonte: `05` §4C · `03` §4
- Cuidado: fora dessas duas listas não existe julgamento: a resposta é "a confirmação acontece no app, quando você descreve o que faz, e se não couber, o ME resolve" (PROIBIDO P16).

**F058 · MEI não pode ter outra empresa** · USAR
Quem é MEI não pode ser titular, sócio ou administrador de outra empresa; a Receita cruza o CPF. Quem entra numa ME como sócio precisa desenquadrar ou dar baixa no MEI.
- Número: não tem · Vale pra: MEI · Validade: vigente
- Fonte: ABERT-MEI (Elegibilidade, item 2, 🟢) · LIT-ELEG L83, L89 (Res. CGSN 140/2018 art. 115 §2º IV)
- Cuidado: baixa de MEI é regularização e a Legalizaí não faz (F033).

**F059 · MEI com funcionário: no máximo 1** · USAR
O MEI pode ter no máximo 1 empregado, recebendo salário mínimo ou o piso da categoria.
- Número: 1 empregado · Vale pra: MEI · Validade: vigente
- Fonte: MEI-OBRIG §6 (🟢, LC 123/2006 art. 18-C) · ABERT-MEI (Elegibilidade, item 4)
- Cuidado: a base não diz que o app faz a folha do MEI empregador. Não prometer.

**F060 · Custos do funcionário do MEI** · USAR
No MEI com empregado, a contribuição patronal é reduzida a 3% sobre a folha e o FGTS é 8%. Tudo sai numa guia única (DAE: INSS 3%, FGTS 8% e IRRF se houver), que vence dia 20 desde a folha de março de 2024.
- Número: 3%; 8%; dia 20 · Vale pra: MEI com empregado · Validade: dia 20 desde a folha de março/2024
- Fonte: MEI-OBRIG §6 (🟢, LC 123/2006 art. 18-C §1º; Lei 14.438/2022)
- Cuidado: não prometer que o app faz essa guia (F059).

**F061 · 13º do funcionário do MEI** · USAR
No MEI com empregado, a 1ª parcela do 13º vai até 30/11 e a 2ª até 20/12.
- Número: 30/11 e 20/12 · Vale pra: MEI com empregado · Validade: todo ano
- Fonte: MEI-OBRIG §6 (🟢)
- Cuidado: mesmo aviso de F059.

**F062 · A guia mensal do MEI (DAS)** · USAR
O imposto do MEI é uma guia fixa por mês (DAS), que vence no dia 20 do mês seguinte e é devida mesmo em mês sem faturamento. Se o dia 20 cair em fim de semana ou feriado bancário nacional, prorroga pro próximo dia útil, sem encargo. No MEI não tem alíquota: fature 500 ou 5 mil no mês, a guia é a mesma.
- Número: dia 20 · Vale pra: MEI · Validade: vigente
- Fonte: `07` §1 · `05` §4A · SOUL (Calibragem) · MEI-OBRIG §2 (🟢, LC 123 art. 40 e Res. CGSN 140 art. 40, como a nota cita)
- Cuidado: o valor da guia não entra (F063).

**F063 · Valor da guia do MEI em 2026** · CONFLITO
- Versão 1: MEI-OBRIG §2 (🟢, 28/08/2026): INSS R$ 81,05 (5% do salário mínimo de R$ 1.621) mais ISS R$ 5,00 (serviço), total de R$ 86,05 por mês pro MEI de serviço puro (Lei 8.212/91 art. 21 §2º II "a" e LC 123 art. 18-A §3º V).
- Versão 2: `07` §1 (17/09/2026): "O valor exato de 2026 não está travado aqui, então você não cita número. Diga que é guia fixa e que o app mostra o valor certo."
- Cuidado: a base mais nova proíbe o número. Na peça: "guia fixa por mês, o app mostra o valor certo". R$ 86,05 e R$ 81,05 não entram (estão no `estilos.json` e no banco do cronograma: ver DIVERGENCIAS).

**F064 · Quando o MEI vale mais a pena** · USAR
Quem fatura até o teto do MEI e tem atividade que pode ser MEI deve ir de MEI. Motivos, pela base: o imposto é guia fixa, que não cresce com cada nota (na ME quem fatura R$ 5 mil no mês paga por volta de 6%, perto de R$ 300, e a guia fixa do MEI sai bem menos); o plano é mais barato que o do ME; a rotina é mais leve (uma declaração por ano, sem certificado pra emitir nota); a Legalizaí fica de olho no teto e, se crescer, migra pra ME. E o suporte do MEI é assistente virtual, sem contador humano.
- Número: R$ 5 mil; por volta de 6%; perto de R$ 300 · Vale pra: quem está decidindo entre MEI e ME · Validade: vigente
- Fonte: `05` §4A · VENDAS §4
- Cuidado: "perto de R$ 300" é aproximação da própria base (ME, Anexo III, 1ª faixa). O valor exato da guia do MEI não se cita (F063). Numa peça, um motivo por vez (VENDAS §4).

**F065 · Declaração anual do MEI (DASN-SIMEI)** · USAR
Uma vez por ano o MEI entrega a DASN-SIMEI, informando o faturamento bruto do ano anterior (separado entre comércio e serviço) e se teve empregado. O prazo é 31 de maio do ano seguinte.
- Número: 31/05 · Vale pra: MEI · Validade: todo ano
- Fonte: `07` §1 ("uma vez por ano, informando o faturamento") · MEI-OBRIG §4 (🟢, Res. CGSN 140 art. 109)
- Cuidado: a base diz que "a gente avisa quando a data chega"; não prometer que o app transmite a declaração.

**F066 · Multa da DASN-SIMEI atrasada** · USAR
Entregar a DASN-SIMEI atrasada gera multa de 2% ao mês sobre os tributos declarados, com mínimo de R$ 50 (R$ 25 se entregue antes de qualquer ação de ofício) e máximo de 20%.
- Número: 2% ao mês; mínimo R$ 50 (ou R$ 25); teto 20% · Vale pra: MEI · Validade: vigente
- Fonte: MEI-OBRIG §4 (🟢, Lei 8.981/1995 e IN RFB 2.119/2022)
- Cuidado: informar, nunca assustar (PROIBIDO P23).

**F067 · CNPJ inapto por falta de declaração** · USAR
O CNPJ pode ficar inapto depois de 90 dias sem entregar obrigação acessória, o que bloqueia emissão de nota, crédito e regularidade.
- Número: 90 dias · Vale pra: MEI (é o contexto da nota) · Validade: vigente
- Fonte: MEI-OBRIG §4 (🟢, IN RFB 2.119/2022 art. 81 com Lei 9.430/96 art. 38 I, como a nota cita; MEI-BRUTO cita "art.81 da Lei 9.430/96")
- Cuidado: a citação da norma varia entre as duas notas; não escrever o número do artigo. Tom de informação.

**F068 · Relatório mensal e dispensa de contabilidade** · USAR
O MEI é dispensado de escrituração contábil formal. No lugar existe o Relatório Mensal de Receitas Brutas, preenchido todo mês, com o mesmo prazo do DAS (dia 20).
- Número: dia 20 · Vale pra: MEI · Validade: vigente
- Fonte: MEI-OBRIG §1 (🟢, Res. CGSN 140/2018 art. 106 §1º)
- Cuidado: a base do Léo não diz que o app faz esse relatório. Não prometer.

**F069 · Guardar documentos por 5 anos** · USAR
Nota emitida e recebida (e os arquivos dela) se guarda por 5 anos, contados do exercício seguinte ao do lançamento.
- Número: 5 anos · Vale pra: MEI (contexto da nota) · Validade: vigente
- Fonte: MEI-OBRIG §1 (🟢, CTN, Lei 5.172/1966)
- Cuidado: não prometer que o app guarda (não está na base).

**F070 · Quando o MEI emite nota** · USAR
Pra pessoa física, o MEI é dispensado de emitir nota, salvo se o cliente pedir. Pra empresa (PJ), é sempre obrigatório, exceto se a empresa compradora emitir nota de entrada por conta própria.
- Número: não tem · Vale pra: MEI · Validade: vigente
- Fonte: MEI-OBRIG §3 (🟢, LC 123 art. 26 §6º II; Res. CGSN 140 art. 106 II "a")
- Cuidado: "não precisa de nota pra PF" nunca vira conselho de não declarar faturamento.

**F071 · Como um MEI é aberto** · USAR
O único canal oficial de abertura do MEI é o Portal do Empreendedor (serviço "Formalize-se"). É gratuito, exige conta gov.br nível prata ou ouro do próprio titular e não existe procuração nem integração que permita outra pessoa abrir no lugar dele: quem clica é o titular.
- Número: não tem · Vale pra: MEI · Validade: pesquisa de 28/08/2026
- Fonte: ABERT-MEI §1 e §2 (🟢)
- Cuidado: nunca dizer que a gente abre o MEI com a senha da pessoa, nem pedir senha gov.br (PROIBIDO P34). O "CNPJ na hora" do portal não vira promessa nossa (PROIBIDO P01).

**F072 · O que o MEI não tem na abertura** · USAR
Na abertura do MEI não há consulta de viabilidade (extinta, Res. CGSIM 61/2020), não há contrato social (o CCMEI é o documento), não há taxa da Junta, não precisa de certificado digital, e a razão social é gerada automaticamente (8 primeiros dígitos do CNPJ mais o nome civil, Lei 14.195/2021).
- Número: 8 dígitos · Vale pra: MEI · Validade: vigente
- Fonte: ABERT-MEI §2 (🟢)
- Cuidado: nenhum prazo.

**F073 · Primeira guia do MEI** · USAR
A primeira guia do MEI vence no dia 20 do mês seguinte ao da formalização. Abriu em fevereiro, primeira guia em 20 de março.
- Número: dia 20 do mês seguinte · Vale pra: MEI novo · Validade: vigente
- Fonte: ABERT-MEI (Depois de aberto, 🟢)
- Cuidado: o valor da guia não entra (F063).

**F074 · Taxas municipais do MEI em BH** · NÃO USAR
A pesquisa diz que o MEI é isento das taxas municipais anuais de BH (TFLF e TFS), citando só "Art. 21 da legislação municipal BH".
- Número: não tem · Vale pra: MEI em BH · Validade: pesquisa de 28/08/2026
- Fonte: ABERT-MEI §2 (tabela)
- Cuidado: a norma é citada de forma vaga (sem nome da lei). Não afirmar até o contador confirmar.

**F075 · Retirada de lucro sem imposto no MEI** · NÃO USAR
A pesquisa diz que, sem contabilidade regular, o lucro isento que o MEI pode retirar fica limitado a 8% (comércio) ou 32% (serviço) da receita bruta.
- Número: 8% e 32% · Vale pra: MEI · Validade: pesquisa de 28/08/2026
- Fonte: MEI-OBRIG §1 (🟡, só uma pesquisa confirmou, Lei 9.249/1995 art. 15)
- Cuidado: marcado 🟡 na própria nota. Não entra na peça.

**F076 · Servidor público federal e MEI** · USAR
Servidor público federal na ativa é bloqueado na hora de abrir MEI.
- Número: não tem · Vale pra: MEI · Validade: vigente
- Fonte: ABERT-MEI (Elegibilidade, bloqueios, 🟢, Lei 8.112/90 art. 117)
- Cuidado: pra ME, ver F107.

---

## D. ME e Simples Nacional (F077 a F112)

**F077 · A guia mensal da ME (DAS)** · USAR
Na ME do Simples, o imposto mensal (DAS) é um percentual sobre o que a empresa faturou no mês e vence no dia 20 do mês seguinte. Se o dia 20 cair em dia não útil, prorroga pro próximo dia útil.
- Número: dia 20 do mês seguinte · Vale pra: ME · Validade: vigente
- Fonte: `07` §2 e §5 · AUDIT L29 (confirmado: Res. CGSN 140/2018 art. 40 caput e §3º)
- Cuidado: "dia 20" pode ser dito; a data exata de um mês específico o app mostra (`07` §5). Não fixar "dia 21 ou 22" (ROTINA, marcado ambíguo).

**F078 · O DAS tem seis tributos dentro** · USAR
O DAS é a soma de seis tributos (IRPJ, CSLL, COFINS, PIS, CPP e ISS), cada um arredondado separado. Por isso "faturamento vezes 6%" erra centavo: numa empresa conferida, R$ 7.910 vezes 6% daria R$ 474,60 e a guia da Receita saiu R$ 474,59.
- Número: 6 tributos; R$ 7.910; R$ 474,60 e R$ 474,59 · Vale pra: ME · Validade: conferência de 16/09/2026
- Fonte: `06` §1
- Cuidado: 6% e 15,5% são ordem de grandeza, não o cálculo (F079).

**F079 · Alíquota inicial dos Anexos III e V** · USAR
Na primeira faixa (faturamento acumulado de até R$ 180 mil em 12 meses), serviço no Anexo III paga por volta de 6% e no Anexo V por volta de 15,5%.
- Número: por volta de 6% e 15,5%; até R$ 180 mil · Vale pra: ME, Anexos III e V · Validade: vigente em 2026
- Fonte: `05` §2 · `06` §2 · FISCAL-BH D-resíduo (🟢, LC 123 Anexos III e V)
- Cuidado: dizer que é aproximado e que começa nesse patamar. Nunca "6% fixo" (PROIBIDO P14). O ângulo vigente não é economia de imposto (PROIBIDO P04).

**F080 · A alíquota sobe com o faturamento** · USAR
A alíquota é calculada sobre o faturamento acumulado dos últimos 12 meses (RBT12) e sobe conforme a empresa cresce. Pro ME que a Legalizaí atende só existem duas faixas: até R$ 180 mil e de R$ 180 mil a R$ 360 mil. O sistema recalcula sozinho todo mês.
- Número: R$ 180 mil; R$ 360 mil · Vale pra: ME · Validade: vigente
- Fonte: `06` §2
- Cuidado: da 2ª faixa, a base só diz "sobe a partir de 6%" e "sobe a partir de 15,5%" (F081).

**F081 · Alíquota nominal da 2ª faixa** · NÃO USAR
A pesquisa registra a 2ª faixa: Anexo III 11,20% com dedução de R$ 9.360; Anexo V 18,00% com dedução de R$ 4.500.
- Número: 11,20% / R$ 9.360; 18,00% / R$ 4.500 · Vale pra: ME entre R$ 180 mil e R$ 360 mil · Validade: 2026
- Fonte: FISCAL-BH rodada 4 (🟢, LC 123 Anexos III e V)
- Cuidado: é alíquota nominal (a efetiva sai de uma fórmula) e a base (`06` §2) escolheu não passar esse número. Fora da peça.

**F082 · Teto do ME** · USAR
O teto do ME que a Legalizaí atende é R$ 360.000 por ano (R$ 30.000 por mês). Acima disso a empresa vira EPP (Empresa de Pequeno Porte, até R$ 4,8 milhões por ano), e EPP a Legalizaí não atende.
- Número: R$ 360.000 por ano (R$ 30.000 por mês); R$ 4,8 milhões · Vale pra: ME · Validade: vigente
- Fonte: `09` §3 · FISCAL-BH rodada 4 (🟢, LC 123 art. 3º)
- Cuidado: sempre com o valor junto de "teto do ME". Acima de R$ 360 mil nunca "cai no ME" (PROIBIDO P18).

**F083 · Fator R** · USAR
Algumas atividades ficam entre o Anexo III e o V, e quem decide é o Fator R: a folha paga nos últimos 12 meses (incluindo o pró-labore) dividida pelo faturamento dos últimos 12 meses. Igual ou acima de 28%, Anexo III; abaixo, Anexo V. O limiar é seco, sem margem na lei.
- Número: 28% · Vale pra: ME, só atividades que o Fator R decide (F084) · Validade: vigente (estável desde a LC 155/2016, FISCAL-BH A)
- Fonte: `05` §3 · `06` §3 · LIT-FECH L126 e L139 (LC 123 art. 18 §5º-K e §5º-M)
- Cuidado: no cronograma, Fator R tem uma peça só. Nunca como conselho de "ficar em 28%" (PROIBIDO P15).

**F084 · Fator R não vale pra todo mundo** · USAR
Dos 87 CNAEs de ME atendidos, só 15 são decididos pelo Fator R. A maior parte (65) já é Anexo III fixo, e pra esses o Fator R não muda nada.
- Número: 15 de 87; 65 · Vale pra: ME · Validade: vigente
- Fonte: `09` §4 · `05` §3
- Cuidado: não falar de Fator R nem de 28% pra quem é Anexo III fixo: inventa um risco que não existe (PROIBIDO P15).

**F085 · A margem de 30%** · USAR
A Legalizaí trabalha com 30% de Fator R, não com 28% cravado. Os 30% são recomendação da Legalizaí, não a lei.
- Número: 30% · Vale pra: ME com atividade de Fator R · Validade: vigente
- Fonte: `05` §3 · `06` §3
- Cuidado: nunca apresentar 30% como regra legal.

**F086 · Fator R olha pra trás e só conta o que foi pago** · USAR
O Fator R lê os 12 meses anteriores: pró-labore pago hoje só faz efeito nos meses seguintes. E é regime de caixa: só entra o que foi efetivamente pago. Declarar e não pagar infla o número, e a Receita desconsidera.
- Número: 12 meses · Vale pra: ME com atividade de Fator R · Validade: vigente
- Fonte: `06` §3
- Cuidado: não virar susto; a saída é F087.

**F087 · Por que o ajuste começa no mês 1** · USAR
Numa simulação da Legalizaí, corrigir o pró-labore em setembro só devolveu o Anexo III em agosto do ano seguinte: 11 meses pagando a alíquota alta já com a folha certa. Por isso o sistema acompanha o Fator R e ajusta o pró-labore desde o primeiro mês, sozinho, sem o cliente pedir.
- Número: 11 meses · Vale pra: ME com atividade de Fator R · Validade: simulação registrada em `06`
- Fonte: `06` §3 · `05` §3 · `07` §2
- Cuidado: dizer "numa simulação nossa"; não prometer resultado no caso da pessoa.

**F088 · Fator R no mês de abertura** · USAR
No mês de início da empresa: com folha e sem faturamento, o Fator R conta como 0,28; sem folha e com faturamento, como 0,01 (o que leva ao Anexo V); com os dois, é folha dividida por faturamento.
- Número: 0,28; 0,01 · Vale pra: ME nova com atividade de Fator R · Validade: vigente
- Fonte: FISCAL-BH H (🟢, Res. CGSN 140/2018 art. 26 §6º I a III) · AUDIT L100
- Cuidado: tema técnico, só em peça de Fator R.

**F089 · INSS patronal dentro do DAS** · USAR
Nos Anexos III e V, a contribuição patronal ao INSS (CPP, os 20% sobre a folha) já está dentro do DAS: não existe guia separada de INSS patronal. Só no Anexo IV ela é recolhida à parte.
- Número: 20% (fora do Simples) · Vale pra: ME nos Anexos III e V · Validade: vigente
- Fonte: FISCAL-BH D-resíduo (🟢, LC 123 art. 13 VI) · LIT-FECH L200 · MEI-OBRIG §7
- Cuidado: não virar "a ME não paga INSS": o sócio recolhe 11% sobre o pró-labore (F115).

**F090 · INSS patronal no cálculo do Fator R** · CONFLITO
- Versão 1: FISCAL-BH rodada 4: "CPP recolhida no DAS entra no numerador do Fator R? 🟢 SIM" (SC COSIT 17/2021).
- Versão 2: LIT-FECH L96: a CPP "não compõe o numerador do Fator R quando recolhida dentro do DAS nos Anexos III e V"; e L105: a SC COSIT 17/2021 "trata de matérias diversas".
- Cuidado: fora de qualquer peça.

**F091 · Imposto pela nota emitida, não pelo recebido** · USAR
O padrão da ME no Simples é o regime de competência: o imposto incide na emissão da nota, mesmo que o cliente ainda não tenha pago. Existe a opção pelo regime de caixa, feita na apuração de janeiro (ou do mês de início) e irretratável pro ano todo.
- Número: janeiro · Vale pra: ME · Validade: vigente
- Fonte: LIT-FECH L279 e L292 (Res. CGSN 140/2018 art. 16, citação literal)
- Cuidado: não aconselhar a opção pro caso de ninguém (PROIBIDO P19).

**F092 · Declaração mensal (PGDAS-D)** · USAR
Junto com o DAS, a ME entrega todo mês a declaração do Simples (PGDAS-D), até o dia 20 do mês seguinte.
- Número: dia 20 · Vale pra: ME · Validade: vigente
- Fonte: FISCAL-BH G (🟢, Res. CGSN 140 art. 40 e LC 123 art. 21) · `07` §2
- Cuidado: no plano ME quem cuida é o contador com CRC (F094).

**F093 · Mês sem faturamento** · USAR
Mês sem nota emitida não extingue a empresa: a guia só vem sem valor de faturamento, e a declaração do mês é entregue com faturamento zero.
- Número: não tem · Vale pra: ME · Validade: vigente
- Fonte: `07` §2 · AUDIT L96 (esclarecimento operacional, Res. CGSN 140/2018)
- Cuidado: não virar susto de "12 declarações zeradas".

**F094 · Obrigações acessórias no plano ME** · USAR
As obrigações acessórias (PGDAS, DEFIS), que são as declarações que confirmam o faturamento, ficam com o contador com CRC incluso na mensalidade. O cliente não põe a mão.
- Número: não tem · Vale pra: plano ME · Validade: vigente
- Fonte: `07` §2 · `07` §3 · `04` (Atrito, "obrigação acessória")
- Cuidado: tradução da base: "papel que o governo pede só pra confirmar imposto que você já pagou" (`04`).

**F095 · Declaração anual da ME (DEFIS)** · USAR
A ME entrega uma declaração anual, a DEFIS, até 31 de março do ano seguinte.
- Número: 31/03 · Vale pra: ME · Validade: até a mudança de 2027 (F098)
- Fonte: `07` §5 · AUDIT L36 (confirmado, Res. CGSN 140/2018 art. 72 §1º)
- Cuidado: LIT-DEFIS L27 fala em "último dia útil de março"; use 31/03 como a base.

**F096 · DEFIS atrasada tem multa?** · CONFLITO
- Versão 1: ROTINA L45 e L158: multa de 2% ao mês, mínimo de R$ 200, mais R$ 100 por lote de informação omitida (e a própria nota muda a regra do lote entre as duas linhas).
- Versão 2: AUDIT L42 ("Não existe multa pecuniária pelo mero atraso na transmissão da DEFIS") e LIT-DEFIS L29, citação do Manual do PGDAS-D e DEFIS 2018: "Não há multa pela entrega em atraso da DEFIS".
- Cuidado: nenhum valor de multa de DEFIS entra na peça.

**F097 · Sem DEFIS, a declaração mensal trava** · USAR
Sem a DEFIS entregue, a declaração mensal do Simples (PGDAS-D) fica bloqueada a partir do período de março do ano seguinte.
- Número: março · Vale pra: ME · Validade: vigente
- Fonte: LIT-DEFIS L29 (citação do Manual do PGDAS-D e DEFIS 2018) · AUDIT L42
- Cuidado: no plano ME, quem entrega é o contador (F094). Sem susto.

**F098 · A DEFIS vai acabar como declaração separada** · USAR
A partir de 2027, a DEFIS deixa de ser uma declaração separada: as informações passam a ser prestadas uma vez por ano, entre janeiro e março, dentro do próprio PGDAS-D (Res. CGSN 190/2026).
- Número: 2027; janeiro a março · Vale pra: ME · Validade: a partir de 01/01/2027
- Fonte: LIT-DEFIS L83 e L85 (citação de notícia da Receita, ago/2026) · AUDIT L87
- Cuidado: nenhuma nota sabe se a DEFIS do ano de 2026 (entregue em 2027) ainda é separada (LIT-DEFIS L91), e a AUDIT L16 avisa que os atos de 2026 não foram conferidos em Diário Oficial. Não dizer "a DEFIS acabou".

**F099 · Multa por atraso da declaração mensal** · USAR
Entregar a declaração mensal do Simples (PGDAS-D) atrasada gera multa de 2% ao mês sobre os tributos informados, limitada a 20%, com mínimo de R$ 50 por mês de referência.
- Número: 2% ao mês; teto 20%; mínimo R$ 50 · Vale pra: ME · Validade: vigente
- Fonte: AUDIT L41 (confirmado, LC 123/2006 art. 38-A e Res. CGSN 140/2018 art. 131)
- Cuidado: a afirmação de que a Res. CGSN 183/2025 "endureceu" essa multa foi refutada (AUDIT L45). Informar, nunca assustar.

**F100 · Guia paga em atraso** · USAR
Pagar o DAS depois do vencimento gera multa de mora de 0,33% por dia, limitada a 20%, mais juros pela Selic acumulada a partir do mês seguinte ao vencimento e 1% no mês do pagamento.
- Número: 0,33% ao dia; teto 20%; Selic + 1% · Vale pra: ME e MEI · Validade: vigente
- Fonte: LIT-FECH L223 (Lei 9.430/1996 art. 61 §§2º e 3º) · MEI-OBRIG §2 (🟢, MEI)
- Cuidado: guia paga errada ou multa recebida é caso pra humano, não conta na peça (PROIBIDO P13).

**F101 · Declaração da folha (DCTFWeb)** · USAR
A DCTFWeb é mensal e vence no dia 15 do mês seguinte; se cair em dia não útil, antecipa. Entregar sem movimento atrasada tem multa mínima de R$ 200; nos demais casos, R$ 500.
- Número: dia 15; R$ 200; R$ 500 · Vale pra: ME · Validade: vigente
- Fonte: AUDIT L33 e L43 (confirmado, IN RFB 2.005/2021 arts. 10 e 14 §2º)
- Cuidado: ROTINA cita outra instrução normativa (IN RFB 2.043/2021): não escrever o número da norma. No plano ME é o contador que cuida.

**F102 · eSocial** · USAR
O eSocial (a folha) vence no dia 15; se cair em dia não útil, antecipa.
- Número: dia 15 · Vale pra: ME · Validade: vigente
- Fonte: `07` §5
- Cuidado: "vence dia 15" é do eSocial, não do DAS (o DAS é dia 20, F077).

**F103 · Guia do INSS e IR do sócio (DARF)** · USAR
O DARF com o INSS e o IRRF do sócio vence no dia 20; se cair em dia não útil, antecipa pro dia útil anterior. Em fim de semana, o DAS vai pra frente e o DARF vai pra trás.
- Número: dia 20 · Vale pra: ME com pró-labore · Validade: vigente
- Fonte: `07` §5 · AUDIT L30
- Cuidado: não calcular a data de um mês específico (o app mostra).

**F104 · ISS retido pelo cliente** · USAR
Quando o cliente (tomador) retém o ISS na fonte, a empresa do Simples desconta essa parte do DAS na declaração do mês, e não paga o ISS duas vezes.
- Número: não tem · Vale pra: ME · Validade: vigente
- Fonte: LIT-LAC L79 (LC 123 art. 21 §4º e art. 18 §4º IV) · AUDIT L103 (Lei municipal 8.725/2003 art. 20, BH)
- Cuidado: nenhuma nota lista quais tomadores retêm. Não dizer quem retém.

**F105 · Sócio no exterior ou sócio empresa** · USAR
Sócio residente no exterior impede a empresa de optar pelo Simples (LC 123 art. 17 II). Sócio pessoa jurídica também (LC 123 art. 3º §4º I). A Legalizaí não atende nenhum dos dois.
- Número: não tem · Vale pra: ME · Validade: vigente
- Fonte: FISCAL-BH F (🟢) · LIT-ELEG L27 · `09` §2
- Cuidado: nenhum.

**F106 · CLT não impede CNPJ** · USAR
Ter emprego com carteira assinada não impede ser sócio de uma ME no Simples.
- Número: não tem · Vale pra: ME · Validade: vigente
- Fonte: LIT-ELEG L113 (FAQ gov.br) · FISCAL-BH F (🟢: "Sócio-CLT ... NÃO desenquadram")
- Cuidado: o INSS do pró-labore muda pra quem já tem CLT (F116).

**F107 · Servidor público e ME** · USAR
Servidor público na ativa pode ser sócio cotista de uma empresa, mas não administrador (Lei 8.112/1990 art. 117 X).
- Número: não tem · Vale pra: ME · Validade: vigente
- Fonte: LIT-ELEG L134 e L136 (citação literal do art. 117)
- Cuidado: a regra citada é a do servidor federal. Não estender pra outros regimes sem fonte.

**F108 · Prazo pra empresa nova optar pelo Simples** · CONFLITO
- Versão 1: FISCAL-BH rodada 4 (🟢, Res. CGSN 140/2018 art. 6º): 30 dias da última inscrição, com teto de 60 dias da abertura do CNPJ.
- Versão 2: LIT-LAC L57: "Todo o transcurso de prazo de 180 dias para a opção pelo regime".
- Cuidado: nenhum prazo de opção na peça.

**F109 · Entrar no Simples em janeiro de 2027** · NÃO USAR
Um relatório diz que quem quiser entrar no Simples em janeiro de 2027 precisa pedir entre 1º e 30 de setembro de 2026 (Res. CGSN 190/2026).
- Número: 01/09 a 30/09/2026 · Vale pra: empresa que ainda não é do Simples · Validade: 2026
- Fonte: LIT-FECH L324 (citação de notícia)
- Cuidado: a fonte é notícia citada num relatório, e a AUDIT L16 diz que os atos de 2026 não foram conferidos em Diário Oficial. Fora da peça.

**F110 · Simples Híbrido** · NÃO USAR
A auditoria diz que a empresa que já é do Simples pode escolher recolher CBS e IBS fora do DAS, com opção entre 1º e 30 de setembro de 2026, efeito no 1º semestre de 2027 e arrependimento até novembro.
- Número: 01/09 a 30/09/2026 · Vale pra: ME optante · Validade: 2026 e 2027
- Fonte: AUDIT L86 (Res. CGSN 186/2026 e 190/2026)
- Cuidado: não conferido em Diário Oficial (AUDIT L16). Valem os guarda-corpos do workspace: Simples Híbrido é opcional, IBS e CBS substituem tributos antigos (PROIBIDO P31). Nenhuma data na peça.

**F111 · Como falar de imposto com número** · USAR
A base permite estimativa aproximada sobre um faturamento dado, sempre com o que sobra na mesma frase. O exemplo da base: "de 10 mil, uns 600 de imposto, aproximadamente 9.400 no bolso".
- Número: R$ 10 mil; uns R$ 600; aproximadamente R$ 9.400 · Vale pra: ME, atividade que começa em 6% · Validade: vigente
- Fonte: VENDAS §3 (O gancho do cálculo) · `06` §6
- Cuidado: só esse exemplo e o de F064. Conta nova com número novo não entra (PROIBIDO P13). Sempre "uns", "por volta de", "aproximadamente".

**F112 · Quando é ME** · USAR
Quem passa do teto do MEI, ou tem atividade que não pode ser MEI, vai de ME, e isso é boa notícia: contador com CRC, certificado incluso e o sistema calculando tudo. Se a atividade pode cair em duas alíquotas, a base manda dizer simples: "uma por volta de 6% e outra por volta de 15,5%", e que o sistema acompanha isso todo mês pra deixar a empresa no melhor cenário.
- Número: por volta de 6% e 15,5% · Vale pra: quem está decidindo entre MEI e ME · Validade: vigente
- Fonte: `05` §4B · VENDAS §4
- Cuidado: pra atividade Anexo III fixo, nem tocar em Fator R.

---

## E. Pró-labore (F113 a F122)

**F113 · O que é pró-labore** · USAR
Pró-labore é o salário oficial do dono. Ele recolhe INSS sobre esse valor, o que garante a aposentadoria e sustenta o Fator R quando a atividade depende dele.
- Número: não tem · Vale pra: sócio de ME · Validade: vigente
- Fonte: `07` §2
- Cuidado: o valor do pró-labore do caso da pessoa o app mostra; caso fora do padrão é do contador (`07` §2).

**F114 · Piso do pró-labore** · USAR
O pró-labore não pode ser menor que o salário mínimo do mês de competência: R$ 1.621 em 2026 e R$ 1.518 em 2025. Abaixo do mínimo, a competência não conta pra Previdência.
- Número: R$ 1.621 (2026); R$ 1.518 (2025) · Vale pra: sócio de ME · Validade: 2026 (salário mínimo desde 01/01/2026)
- Fonte: `06` §4 · AUDIT L93 (Decreto 12.797/2025) · LIT-FECH L180 (Lei 8.212/1991 art. 28 §3º)
- Cuidado: não virar recomendação de valor pro caso de ninguém.

**F115 · INSS do sócio** · USAR
O INSS do sócio é 11% sobre o pró-labore, limitado ao teto de R$ 8.475,55. O INSS máximo é R$ 932,31 por mês.
- Número: 11%; teto R$ 8.475,55; máximo R$ 932,31 por mês · Vale pra: sócio de ME · Validade: 2026
- Fonte: `06` §4 · FISCAL-BH D-resíduo (🟢, Lei 8.212/91 art. 21 e Lei 10.666/03 art. 4º)
- Cuidado: o 11% é direto sobre a retirada (a formulação "11% + 20%" foi refutada, FISCAL-BH rodada 2).

**F116 · O teto é da pessoa** · USAR
O teto do INSS é da pessoa, não da empresa: quem já tem carteira assinada em outra empresa consome parte do teto, e o INSS do pró-labore cai.
- Número: não tem · Vale pra: sócio com outro vínculo · Validade: vigente
- Fonte: `06` §4 · `08` (item 7)
- Cuidado: não calcular o caso.

**F117 · A guia é por sócio** · USAR
Em empresa com 2 ou mais sócios, nunca se soma a folha pra calcular como se fosse uma pessoa só: o teto do INSS é individual e a tabela do IR é progressiva por pessoa.
- Número: não tem · Vale pra: ME com 2 a 4 sócios · Validade: vigente
- Fonte: `06` §4 · LIT-PRO L27 e L45
- Cuidado: nenhum valor.

**F118 · Imposto de renda do pró-labore** · USAR
O IR do pró-labore segue a tabela progressiva, por sócio. O cálculo é do sistema e aparece no app.
- Número: não tem · Vale pra: sócio de ME · Validade: vigente
- Fonte: `06` §4
- Cuidado: a base proíbe citar valor ou faixa de IRRF (PROIBIDO P17). Ver F119 e F120.

**F119 · Redutor do IR em 2026 (Lei 15.270/2025)** · CONFLITO
- Versão 1: FISCAL-BH consolidado #9 (🟢 travado): "IRRF isento na prática até ~R$5.000/mês (Lei 15.270/2025)". LIT-FECH L21 e L47: efeitos desde janeiro de 2026, zera o IRRF até R$ 5.000 e reduz em rampa até R$ 7.350.
- Versão 2: LIT-RED §0 e §7 (16/09/2026, status "parcial"): os parâmetros do redutor "seguem sem fonte primária", "Não marcar o redutor como ratificado com base neste arquivo". Os marcos R$ 5.000 e R$ 7.350 vêm de uma consulta que não entregou o texto da lei.
- E a base (`06` §4) proíbe citar valor ou faixa de IRRF.
- Cuidado: nenhuma peça diz "isento até R$ 5 mil" nem nada do redutor até o contador ratificar e o Pedro liberar.

**F120 · Tabela do IR e desconto simplificado** · NÃO USAR
LIT-RED traz a tabela progressiva de 2026 (isento até R$ 2.428,80; 7,5% até R$ 2.826,65; 15% até R$ 3.751,05; 22,5% até R$ 4.664,68; 27,5% acima) e o desconto simplificado de R$ 607,20.
- Número: os valores acima · Vale pra: sócio de ME · Validade: 2026
- Fonte: LIT-RED §1 e §2
- Cuidado: a base proíbe citar faixa de IRRF (`06` §4), e LIT-PRO L63 e L68 usam outros valores (dedução de R$ 896,00 e desconto de R$ 564,80). Fora da peça.

**F121 · Sócio que trabalha é obrigado a ter pró-labore?** · NÃO USAR
As fontes afirmam isso com confianças diferentes: LIT-FECH L154 e L158 dão "Média" e dizem que é presunção ("A lei cita 'que recebam remuneração'"); LIT-PRO L139 e L143 dão "ALTA" (Lei 8.212/1991 art. 12 V "f"); LIT-FECH L361 diz que não há artigo mandando "sacar R$ 1.621,00".
- Número: não tem · Vale pra: sócio de ME · Validade: não fechado
- Fonte: LIT-FECH L154, L158, L361 · LIT-PRO L139
- Cuidado: não afirmar "é obrigatório por lei". O que a base diz está em F113 e F114.

**F122 · Pró-labore pode ser diferente entre sócios** · USAR
O pró-labore pode ser diferente entre os sócios quando o trabalho, a responsabilidade ou a carga de cada um é diferente, e não precisa ser proporcional às cotas.
- Número: não tem · Vale pra: ME com sócios · Validade: vigente
- Fonte: LIT-PRO L84 (ALTA, Código Civil art. 997 V) e L93 (ALTA, SC COSIT 120/2016)
- Cuidado: o arquivo LIT-PRO não tem frontmatter nem status no vault; a formalização (ata) é MÉDIA (L102): não entra. Não aconselhar o caso de ninguém.

---

## F. NFS-e nacional (F123 a F128)

**F123 · Nota nacional do MEI desde 2023** · USAR
Desde 01/09/2023 a nota de serviço do MEI segue o padrão nacional (Emissor Nacional), e não mais o emissor da prefeitura. Os municípios foram proibidos de manter emissor próprio pro MEI. Em BH, o BHISS foi bloqueado pro MEI na mesma data.
- Número: 01/09/2023 · Vale pra: MEI · Validade: vigente
- Fonte: `07` §1 · MEI-OBRIG §3 (🟢, Res. CGSN 169/2022, 171/2022 e 172/2023; Portaria SMFA 042/2023)
- Cuidado: a base só manda falar disso "se perguntarem"; o foco é que a nota sai pelo app (F041).

**F124 · MEI emite nota sem certificado** · USAR
O MEI emite a nota nacional sem certificado digital: basta login gov.br prata ou ouro, ou usuário e senha.
- Número: não tem · Vale pra: MEI · Validade: vigente
- Fonte: MEI-OBRIG §3 (🟢) · `07` §1 · `01` §1
- Cuidado: nenhum.

**F125 · Primeiro acesso antes da primeira nota** · USAR
Depois de aberto, o MEI de serviço precisa fazer o primeiro acesso no Emissor Nacional antes de emitir: ele não sai emitindo no minuto seguinte à abertura.
- Número: não tem · Vale pra: MEI novo · Validade: vigente
- Fonte: ABERT-MEI (Depois de aberto, 🟢)
- Cuidado: não prometer tempo.

**F126 · Nota nacional pra ME em BH: desde quando** · CONFLITO
- Versão 1: FISCAL-BH G (🟢): em BH, ME e EPP do Simples no Emissor Nacional desde 01/11/2025, com todo mundo a partir de 01/01/2026 (Portaria SMFA 75/2025).
- Versão 2: AUDIT L50: a Portaria SMFA 088/2025 mudou a data pra 01/02/2026 pra todas as empresas prestadoras de serviço de BH.
- Versão 3: AUDIT L51 e MEI-BRUTO (Documento 2): pra todo optante do Simples no país, 01/11/2026 (Res. CGSN 191/2026; "prorrogação pra 01/11/2026", "só pra ME/EPP").
- Cuidado: nenhuma data de obrigatoriedade da nota nacional pra ME na peça.

**F127 · ME em BH precisa de certificado pra emitir nota?** · NÃO USAR
FISCAL-BH (🟡, fonte secundária) diz "NFS-e só pelo Emissor Nacional com certificado digital". Nenhuma outra nota confirma.
- Número: não tem · Vale pra: ME em BH · Validade: não fechado
- Fonte: FISCAL-BH rodada 4 (Novos, ainda 🟡)
- Cuidado: não afirmar nem negar. No plano ME, o certificado já vem incluso (F013).

**F128 · IBS e CBS na nota a partir de 2027** · NÃO USAR
A auditoria diz que, a partir de 01/01/2027, além da nota nacional obrigatória, passam a valer as regras de CBS e IBS (Ato Conjunto RFB/CGIBS 4/2026).
- Número: 01/01/2027 · Vale pra: ME · Validade: 2027
- Fonte: AUDIT L88
- Cuidado: não conferido em Diário Oficial (AUDIT L16). Guarda-corpo do workspace: IBS e CBS substituem tributos antigos, nunca "imposto novo" (PROIBIDO P31).

---

## G. Abertura e troca de contador (F129 a F147)

**F129 · O caminho oficial da ME em BH** · USAR
A abertura de ME de serviço em BH é um processo digital integrado (JUCEMG e Redesim): consulta de viabilidade, cadastro na Receita, integração, pagamento da taxa, assinatura digital, envio e documento registrado. Sai de uma vez o registro na Junta, o CNPJ, a inscrição municipal e o alvará.
- Número: 7 etapas · Vale pra: ME em BH · Validade: vigente
- Fonte: FISCAL-BH E (🟢, JUCEMG, Portal MG, PBH)
- Cuidado: a mesma nota cita "até 1 dia útil" pra baixo risco: isso NÃO vira promessa (PROIBIDO P01). Ela também diz que o certificado ICP-Brasil é pré-requisito da assinatura; a base, mais nova, diz que o cliente assina com a conta gov.br dele (`02` §1, `03` §2), e LIT-RISCO L71 a L73 aceita as duas: vale a base.

**F130 · A regra do apartamento** · USAR
A Prefeitura de BH não libera empresa em apartamento quando nenhum sócio mora no endereço. Por isso o app pergunta se é casa ou apartamento e se o titular mora no local. Já foi visto um processo real sair de indeferido pra deferido só mudando essa resposta.
- Número: não tem · Vale pra: ME em BH · Validade: vigente
- Fonte: `03` §1
- Cuidado: "o que a Prefeitura analisa é o endereço, não você" (`03` §1).

**F131 · O índice do IPTU** · USAR
O índice cadastral do IPTU é obrigatório: sem ele a Prefeitura não localiza o imóvel e o processo para. Fica na guia do IPTU.
- Número: não tem · Vale pra: ME em BH · Validade: vigente
- Fonte: `03` §1 · `08` (item 9)
- Cuidado: nenhum.

**F132 · Imóvel comercial** · USAR
Em imóvel comercial, o IPTU precisa ter destinação compatível e o endereço não pode ter impedimento de zoneamento pra atividade.
- Número: não tem · Vale pra: ME em BH · Validade: vigente
- Fonte: `03` §1
- Cuidado: não afirmar zoneamento de endereço específico.

**F133 · Registro automático e por que não usamos procuração** · USAR
A JUCEMG defere quase na hora quando o processo usa o contrato padrão gerado pelo sistema, sem anexo e sem cláusula extra. Anexar procuração, qualquer anexo ou cláusula personalizada derruba o registro automático e joga o processo pra análise humana, que demora muito mais. Por isso a Legalizaí guia o próprio cliente a assinar com o gov.br dele: é escolha de velocidade.
- Número: não tem · Vale pra: ME · Validade: vigente
- Fonte: `03` §2 · VENDAS §8.6
- Cuidado: "quase na hora" é do registro, não promessa de CNPJ em tempo nenhum (PROIBIDO P01). A medição "constituição em 24h" do ADR L421 está em conflito com a base: ver Conflitos.

**F134 · Nome da empresa** · USAR
A Junta pode recusar o nome por colidência com nome já existente. Por isso o app pede 3 opções de razão social em ordem de prioridade: se a primeira cai, tenta a segunda, depois a terceira; se as três caírem, o app abre uma nova rodada.
- Número: 3 opções · Vale pra: ME · Validade: vigente
- Fonte: `03` §2 · `08` (item 10)
- Cuidado: nenhum.

**F135 · Nome sujo não impede CNPJ** · USAR
Restrição no SPC ou Serasa é problema de crédito, não de registro: não impede abrir CNPJ. O que trava é CPF suspenso ou pendente de regularização na Receita e pendência na Justiça Eleitoral. Com CPF regular, o CNPJ sai.
- Número: não tem · Vale pra: MEI e ME · Validade: vigente
- Fonte: `03` §3 · `04` (Atrito)
- Cuidado: "o CNPJ sai" não é prazo.

**F136 · Exigência da Junta: 30 dias** · NÃO USAR
A nota diz que o comum é o processo cair em exigência (ajuste), com 30 dias pra corrigir, e que quem não corrige é indeferido e perde a taxa.
- Número: 30 dias · Vale pra: ME · Validade: não ratificado
- Fonte: JUCEMG-EX ("Confiança média-alta, não ratificada")
- Cuidado: a própria nota pede double-check antes de virar promessa escrita. Fora da peça. Vocabulário que vale: "a Junta pediu um ajuste" (ADR L310).

**F137 · gov.br bronze gera exigência** · NÃO USAR
A nota diz que assinar com gov.br nível bronze gera exigência imediata e que o certo é prata ou ouro.
- Número: não tem · Vale pra: ME · Validade: não ratificado
- Fonte: JUCEMG-EX (não ratificada) · LIT-RISCO L71 a L73 (fonte: site privado)
- Cuidado: pro MEI, prata ou ouro está confirmado (F071). Pro ME, não afirmar.

**F138 · Atividade de baixo risco em BH** · USAR
Em BH, atividade de baixo risco não passa por vistoria prévia. Pra ME, o alvará de localização e funcionamento sai de forma eletrônica, sem vistoria. Pro MEI de baixo risco, o alvará é dispensado.
- Número: não tem · Vale pra: ME e MEI em BH, atividade de baixo risco · Validade: vigente
- Fonte: FISCAL-BH E e J (🟢, Decreto municipal 17.245/2019) · ABERT-MEI §2
- Cuidado: o risco depende da atividade; não afirmar pra uma atividade específica. Os percentuais (95% em FISCAL-BH E, 96% em FISCAL-BH J), o tempo médio e a validade do alvará não entram.

**F139 · Médio risco em BH** · NÃO USAR
LIT-RISCO diz que atividade de médio risco sai com licenciamento automático, por autoinspeção e termo de responsabilidade, sem vistoria prévia.
- Número: não tem · Vale pra: BH · Validade: não fechado
- Fonte: LIT-RISCO L16 e L60 (fonte: blog)
- Cuidado: a própria nota diz que não prova a liberação (L171) e usa fontes de outros estados. Fora da peça.

**F140 · Taxa de fiscalização da Prefeitura (TFLF)** · CONFLITO
- Versão 1: FISCAL-BH rodada 4 (🟡): R$ 168,48, edital em abril, vence 10/05, sem proporcional.
- Versão 2: a mesma nota registra o caso real do Pedro: chegou por volta do dia 40, 4 dias pra pagar, cerca de R$ 161 ("Provavelmente são dois eventos distintos").
- Cuidado: nenhum valor ou data de TFLF na peça.

**F141 · Taxas municipais de BH na abertura** · NÃO USAR
Os valores exatos das taxas municipais de BH e a faixa de preço do e-CNPJ não foram confirmados.
- Número: não tem · Vale pra: ME em BH · Validade: não fechado
- Fonte: FISCAL-BH L e fila-Larissa G (🟡)
- Cuidado: o único custo público confirmado da abertura é a taxa da Junta (F018).

**F142 · Trocar de contador pela Legalizaí** · USAR
Existe um caminho próprio pra migração no app: a pessoa passa os dados da empresa e a Legalizaí conduz a transferência. Quem libera a transferência é o contador atual, então essa parte depende dele. Se travar por motivo fora do controle do cliente, isso está previsto no contrato.
- Número: não tem · Vale pra: ME com CNPJ (migração) · Validade: vigente
- Fonte: `04` (Topo de funil, "Eu já tenho contador")
- Cuidado: não prometer prazo nem que o contador antigo vai colaborar.

**F143 · Os passos oficiais da troca** · USAR
A troca de contador passa por: distrato com o contador antigo (que define a data de corte), transferência de responsabilidade técnica no CRC de Minas, atualização do contador na Receita, Estado e Prefeitura pela Redesim, e nova procuração eletrônica no e-CAC.
- Número: não tem · Vale pra: migração · Validade: vigente
- Fonte: FISCAL-BH I e consolidado #14 (🟢)
- Cuidado: a própria nota manda conferir o número da resolução do CFC e o código do evento da Redesim antes de usar: não escrever número de norma nem código.

**F144 · Obrigações do período antigo** · USAR
As declarações de fatos do período do contador antigo ficam com ele, salvo cláusula expressa no distrato.
- Número: não tem · Vale pra: migração · Validade: vigente
- Fonte: FISCAL-BH I e consolidado #14 (🟢)
- Cuidado: não virar crítica à profissão contábil (PROIBIDO P22).

**F145 · Trocar de contador não zera o Fator R** · USAR
Na migração, o Fator R usa o histórico real dos 12 meses: trocar de contador não zera nada, o CNPJ continua.
- Número: 12 meses · Vale pra: migração de ME com atividade de Fator R · Validade: vigente
- Fonte: FISCAL-BH H (🟢, Res. CGSN 140/18 art. 26)
- Cuidado: tema técnico, só em peça de migração ou de Fator R.

**F146 · Documentos da empresa com o contador antigo** · NÃO USAR
A pesquisa diz que o acervo (XML, guias, bases) pertence à empresa e que reter por inadimplência seria antiético.
- Número: não tem · Vale pra: migração · Validade: não fechado
- Fonte: FISCAL-BH I (fonte: relatório do Gemini citando CFC e Código de Ética, sem número conferido)
- Cuidado: afirmação ética sobre contadores; fora da peça (PROIBIDO P22).

**F147 · Contestar o indeferimento do Simples** · USAR
Se a opção pelo Simples for indeferida, a contestação não suspende nada: durante o processo a empresa não é optante e paga pelas regras das demais empresas.
- Número: não tem · Vale pra: ME · Validade: vigente
- Fonte: LIT-ELEG L170 e L172 (citação literal)
- Cuidado: o regime exato depois do indeferimento varia entre as linhas da nota (Presumido ou Real). Não dizer qual.

---

## H. Calendário fiscal (índice, sem fatos novos)

Cada data aponta pro fato de origem. Na peça, cite o id do fato, não este índice.

| Quando | O quê | Quem | Fato |
|---|---|---|---|
| Dia 15 de cada mês (antecipa) | eSocial | ME com pró-labore | F102 |
| Dia 15 de cada mês (antecipa) | DCTFWeb | ME | F101 |
| Dia 20 de cada mês (prorroga) | DAS da ME | ME | F077 |
| Dia 20 de cada mês | Declaração mensal (PGDAS-D) | ME | F092 |
| Dia 20 de cada mês (antecipa) | DARF do INSS e IR do sócio | ME | F103 |
| Dia 20 de cada mês (prorroga) | DAS do MEI | MEI | F062 |
| Dia 20 de cada mês | Relatório Mensal de Receitas Brutas | MEI | F068 |
| Dia 20 de cada mês | Guia única do funcionário (DAE) | MEI com empregado | F060 |
| Dia 20 do mês seguinte à abertura | Primeira guia do MEI | MEI novo | F073 |
| 31/03 | DEFIS | ME | F095 |
| Março do ano seguinte | Sem DEFIS, a declaração mensal trava | ME | F097 |
| 31/05 | DASN-SIMEI | MEI | F065 |
| 30/11 e 20/12 | 13º do funcionário | MEI com empregado | F061 |
| 31/12/2026 | Fim da promoção de 3 meses | lista de espera | F005 |
| 2027 | DEFIS vira parte do PGDAS-D | ME | F098 |

Datas que NÃO entram (conflito ou não conferidas): nota nacional pra ME (F126), Simples Híbrido (F110), entrada no Simples em 2027 (F109), IBS e CBS na nota (F128), TFLF (F140), prazo de opção pelo Simples (F108).

---

## I. Institucional (F148)

**F148 · O escritório por trás** · USAR
A Legalize, escritório do Mauro (sócio), tem 22 anos de operação real em Belo Horizonte.
- Número: 22 anos · Vale pra: marca · Validade: número registrado em 2026
- Fonte: POS L55 ("A Legalize (22 anos de operação real em BH)") · ORG L51 ("22 anos de Legalize")
- Cuidado: POS L66 diz "mais de 20 anos"; as duas cabem. A marca é digital pura: nunca apresentar a Legalizaí como "braço do escritório tradicional" (ADR, 09/07/2026, "Marca = digital pura").

---

## Conflitos e inconsistências dentro do vault (índice)

Fatos marcados CONFLITO acima:

| Fato | Assunto |
|---|---|
| F027 | MEI fora de BH (ADR L68 x `09` §1) |
| F063 | Valor do DAS do MEI em 2026 (MEI-OBRIG x `07` §1) |
| F090 | INSS patronal no cálculo do Fator R (FISCAL-BH x LIT-FECH) |
| F096 | Multa da DEFIS atrasada (ROTINA x AUDIT e Manual) |
| F108 | Prazo de opção pelo Simples de empresa nova (30/60 dias x 180 dias) |
| F119 | Redutor do IR 2026 (FISCAL-BH 🟢 x LIT-RED sem fonte primária; e `06` §4 proíbe citar) |
| F126 | Data da nota nacional pra ME em BH (01/01/2026 x 01/02/2026 x 01/11/2026) |
| F140 | TFLF (R$ 168,48 x cerca de R$ 161) |

Inconsistências de marca e de copy dentro do vault (tratadas em PROIBIDO):

| Onde | O quê | Vale |
|---|---|---|
| ADR L421 (13/09) x `09` §5 (17/09) e ADR L272 (01/09) | "constituição em BH cabe em 24h... Vira promessa de produto" x "nunca prometer prazo de abertura" | a proibição (PROIBIDO P01) |
| ADR L108 (25/08) x ADR L340 (05/09) | grafia "Legalizaí" travada x "Grafia em aberto" | "Legalizaí" (regra dura do workspace, PROIBIDO P28) |
| ADR L91 x ADR L116 x SOUL | bordão "Vai, legaliza aí" x "Vai, Legaliza aí!" x "Vai, legaliza aí!" | sem conflito de sentido; a caixa da letra não está decidida |
| ORG (ângulo Garantia) x `10` §1 | "Dinheiro de volta, sem letra miúda" x nunca "sem letra miúda" | a proibição (P05) |
| ORG e POS (ângulo sem custo de saída) x `09` §2 | "Migração e baixa, sem custo escondido" x baixa de CNPJ não é feita | a proibição (P07) |
| ORG (ângulo Onboarding) x `09` §5 | "CNPJ pronto rápido" (meta <72h) x nunca prometer prazo | a proibição (P01) |
| ORG (ângulo Fator R) x `01` §5 | "Simulador de Fator R aberto" x só existem três links | sem link de simulador até confirmar que existe |
| ORG (vagas fundador) x ADR L507 | "vagas fundador" x "é um preço só por plano" | sem vagas (P09) |
| POS (statement v2) x `09` §5 | "resolve em minutos o que antes tomava semanas" x nunca prometer prazo | a proibição (P01) |
| `leo/personagem-leo.md` §9 x `07` §3 | "Eu já separei, já paguei, já esqueci" x quem paga a guia é o cliente | `07` §3 (P21) |
| `leo/personagem-leo.md` §9 | "multa de R$500 por guia atrasada" (número sem fonte; as multas reais estão em F099 e F100) | não usar |
| `leo/personagem-leo.md` §6 x ADR L116 | "Legalizei! 🎉" como frase de sucesso x retirada em 26/08 | ADR L116 |
| `04` (Meio de funil) | manda ver o valor do endereço fiscal em "01 §3", mas o `01` §3 diz que o valor saiu de lá (está no `03` §1) | ponteiro velho; o valor é F016 |
| várias cópias | "Legalizai Story Book" no lugar de "Legalizei" (artefato de find/replace) | nunca copiar (P28) |
