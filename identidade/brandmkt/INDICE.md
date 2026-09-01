# Legalizaí · pacote de marca, personas, ICP e marketing

Extraído do vault em 2026-09-01. Todo arquivo aqui é cópia fiel do original (github.com/pedromberg-crypto/legalizei). O vault segue sendo a fonte viva: se algo mudar lá, este pacote fica velho.

Ordem de leitura sugerida para alguém novo: **03** (quem é o cliente e o mercado) → **01** (quem é a marca) → **02** (as personas em detalhe) → **04** (o que se faz com isso) → **05** (o motor que gera as peças).

---

## 01-marca · a identidade

| Arquivo | O que é |
|---|---|
| `decisoes-marca.md` | **O ADR, o documento mais importante do pacote.** Log datado de toda decisão travada da marca, com o porquê. As regras duras vivem aqui. Entradas mais recentes no fim do arquivo. |
| `personagem-leo.md` | A bíblia do Léo, o suricato-sentinela. Voz em 1ª pessoa, os 2 pilares (vigilante + astuto), o que nunca vira piada, dial de ironia por persona, descrição física, acervo de falas. |
| `conceito-marca.md` | Essência, propósito, arquétipo (Aliado leve/vitorioso), os 5 traços, tom de voz, a marca É e NÃO É. |
| `marca.md` | Nota-hub da pasta de marca. |
| `naming-defesa.md` | Por que "Legalizaí": 1ª pessoa do pretérito, a conquista do cliente. |
| `paleta-cores.md` | Tokens de cor. Coral #F2643C é a marca, ink #1B1E24 a estrutura. Coral nunca é erro, azul banido como marca, fundo é papel quente. |
| `design-system.md` | Fundação de produto: 2 shells (wizard e app), espaçamento base 4, tipografia Sora, raio derivado do logo, motion. |
| `simbolo-exploracao.md` | Exploração do símbolo. |
| `referencias.md` | Território visual e referências de energia. |
| `logos/` | 6 SVGs: horizontal, negativa clara e escura, app fundo sólido, check negativo. |
| `copy/glossario-tecnico-humano.md` | **~40 termos fiscais traduzidos.** A regra de ouro operacionalizada: todo termo técnico vem traduzido ou escondido. |
| `copy/exemplos-copy-por-tela.md` | Padrão de erro, vazio, sucesso e aviso legal. |
| `copy/roteiro-escalada-mercado.md` e outros 3 | Roteiros institucionais e de investidor já escritos, com narração. |

## 02-personas · quem compra

| Arquivo | O que é |
|---|---|
| `00-metodologia-personas-FONTE-UNICA.md` | **Comece por aqui.** O sistema: dorsais e volantes, os 3 critérios de governança, a matriz mestre (ocasião × persona × oferta × mensagem), tom de voz por dorsal, anti-personas. |
| `persona-a-servico-intelectual.md` | **A "Direto"**, 32-42a, dev, consultor, designer. Canal Google Search. Dor nº1: Fator R. |
| `persona-b-servico-estetico.md` | **B "Construindo"**, 35-50a, beleza e estética. Instagram, 83% do setor. Gatilho: teto do MEI. |
| `persona-c-baixa-familiaridade-digital.md` | **C "Mão na mão"**, 50+, baixa familiaridade digital. WhatsApp e indicação. Não roda tráfego pago frio. |
| `persona-d-mei-puro-permanente.md` | **D "MEI de vida toda"**, quem escolhe ficar pequeno. Exceção de governança registrada. |
| `persona-e-jovem-cnpj.md` | **E "Começa Certo"**, 22-31a, nunca passou por CLT. Confiança 🔴, contraria o dado agregado de idade média. |
| `volantes/` | **18 recortes de campanha**, cada um herdando uma dorsal e ajustando gatilho, canal, objeção e dial de ironia. Todos com pesquisa real de mercado com fonte. |

Cada dorsal traz: perfil com fonte e grau de confiança, negócio (LTV, indicação), ads, orgânico, criativo, **tom de voz** (como a marca fala com ela) e **voz própria** (como ela mesma fala), objeção principal mais 5 secundárias, jornada, jobs absorvidos, **banco de calibragem antes e depois por pilar**, mapeamento de pilar, reação a crítica, referência visual fixa com prompt de imagem, e pesquisa real agregada.

## 03-icp-mercado · o recorte e o tamanho

| Arquivo | O que é |
|---|---|
| `BASE-ESTRATEGICA.md` | **A fonte-verdade do negócio.** Teses, custo, equity, roadmap, o gate de validação. |
| `PESQUISA-MERCADO.md` | Pesquisa de mercado completa, com fontes e graus de confiança. |
| `mercado-bh-regional.md` | O recorte de BH: cerca de 100 a 175 mil empresas no ICP, abertura em 11h, 3ª capital do país em aberturas. |
| `perfil-microempreendedor-mercado.md` | Perfil demográfico real (IBGE, Sebrae): idade média 40,8 anos, brackets etários, canais por setor. É a fonte que sustenta as personas. |
| `economia-preco-cac.md` | Preço, CAC-alvo (R$30 a R$100 contra LTV de 12 meses), margem, e a razão usuários por atendente. |
| `validacao-ideia.md` | Os 2 gates: validação por pesquisa secundária (aprovado) e o gate empírico do V0 (thresholds em aberto). |
| `metodologia-descoberta.md` | Como a descoberta foi conduzida. |
| `cnae-escopo/` | **O ICP em regra técnica.** `cnae-liso-servico.md` (103 CNAEs confirmados que atendemos), `taxonomia-pills-n4.md` (as 17 categorias de atividade do funil), `cnae-comercio-standby.md` (o que fica fora do V1), `fundamentos-cnae.md`. |
| `concorrentes/` | `matriz-comparativa.md` (6 players, preço e modelo), `insights-estrategicos.md` (os 5 erros estruturais do mercado), `_sintese-paginas-publicas.md`. |

## 04-marketing · a estratégia e a execução

| Arquivo | O que é |
|---|---|
| `estrategia/2026-08-12-estrategia-mkt-para-validacao.md` | **O documento mestre.** 12 blocos: mercado, concorrência, posicionamento, tom, personas, mensagens, conteúdo, economia, funil, canais, métricas, riscos. Cada bloco fecha numa pergunta de validação. |
| `estrategia/posicionamento.md` | Statement, claim travado, categoria mental, os 5 diferenciais, arquétipos, erros a evitar. |
| `estrategia/estrategia-organica.md` | **Os 15 pilares de conteúdo** (13 ativos e 2 em standby), os 4 blocos de pauta, os 9 ângulos rotativos de diferencial, gatilhos evergreen e sazonais, cadência. |
| `estrategia/mecanicas-engajamento.md` | A mecânica-âncora "Pergunta que ninguém explica", 5 mecânicas propostas, escada de CTA em 2 níveis, banco de prompts, calibração por persona. |
| `estrategia/funil-conversao.md` | A jornada completa, etapa a etapa, com métrica e referência. |
| `estrategia/estrutura-funil-trafego.md` | Estrutura de tráfego pago, budget, split por persona. |
| `estrategia/frente-1-captacao-meta-bh.md` | A campanha Meta BH detalhada: públicos, criativos, KPIs, plano de escala. |
| `estrategia/trafego-pago-contabilidade-mercado.md` | Benchmarks do nicho: CPC, CPL, conversão. |
| `estrategia/validacao-pilares-blocos-personas.md` | A rodada de validação que gerou a numeração v3 dos pilares. |
| `estrategia/mapa-itens-travados-criacao-post.md` | Os itens que precisavam de decisão para destravar a criação de posts. |
| `estrategia/catalogo-templates-texto-avaliacao.md` | Avaliação dos templates de texto. |
| `campanha-2026-08/` | A primeira campanha inteira: `brief.md`, `copy.md` (12 peças estáticas), `roteiros-video.md` (12 roteiros), `guardian-log.md` (a auditoria), `prompts-imagem.md`, `handoff-lp-copy.md`, `resultados.md`. |
| `roteiros-venda-simples-NOVOS/` | **Os 10 roteiros novos** de venda do plano ME, gravados por Pedro e time, com hooks direct-response. V1 a V10. |
| `redes-sociais/` | Perfis de Instagram e LinkedIn. |

## 05-motor-atelie · como as peças nascem

| Arquivo | O que é |
|---|---|
| `00-CLAUDE-regras-do-motor.md` | **As regras do motor de criação de posts.** Ordem de leitura obrigatória, regras duras, formato de saída, anti-repetição. |
| `README.md` | Estrutura do ateliê. |
| `tipos.md` | O schema de uma peça em JSON. |
| `ds/regras.json` | **QA determinístico:** travessão, garantia incondicional, MEI sem contador humano (bloqueante), concorrente nomeado, escassez simulada. |
| `ds/voz.json` | A voz da marca estruturada, com a lista de concorrentes que nunca se cita. |
| `ds/ctas.json` | A escada de CTA por estágio de funil e os CTAs reais da campanha. |
| `ds/personas.json` | Índice das 5 dorsais e 18 volantes. A profundidade mora em `02-personas/`. |
| `ds/personagem.json` e `ds/personagem-leo.md` | O Léo estruturado para o motor. |
| `ds/tokens.json` | Tokens de design para as peças. |
| `ds/templates-texto.json` e `ds/templates-imagem.json` | Templates disponíveis. |
| `pecas/` | As 12 peças da primeira campanha em JSON, já auditadas, mais o `campanha.json`. |

---

## As regras duras, resumidas

Se você só puder ler uma coisa deste pacote, leia esta lista. Ela vale para qualquer peça pública, sem exceção.

1. **Zero travessão** em copy pública.
2. **Zero concorrente citado por nome.** A guerrilha usa a prática do mercado, nunca nome, cor ou silhueta.
3. **Jamais prometer contador humano dedicado no plano MEI.** MEI tem assistente virtual. Regra bloqueante.
4. **A ironia mira o sistema**, nunca a dúvida ou o erro do cliente, nunca a profissão contábil.
5. **Garantia nunca "incondicional"** nem "sem letra miúda" como promessa.
6. **Escassez só se real.**
7. **Número sem fonte não entra.**
8. **Todo termo técnico vem traduzido ou escondido.**
9. **Se a copy fala na 1ª pessoa do Léo, o Léo aparece visualmente na peça.**
10. **Grafia oficial: Legalizaí**, com acento.

---

## Números que se repetem em tudo

| Dado | Valor | Fonte |
|---|---|---|
| Plano ME | R$139/mês | ADR 05/08 |
| Plano MEI | R$49/mês redondo | ADR 20/08 |
| Oferta de campanha (lista de espera) | ME R$79 e MEI R$19 nos 3 primeiros meses, até 31/12/2026 | ADR 20/08, com o Mauro |
| CAC-alvo | R$30 a R$100, custo único, contra LTV de 12 meses | ADR 18/08 |
| Teto do MEI | R$81 mil/ano, cerca de R$6.750/mês | lei |
| Fator R | decide entre 6% e 15,5% de alíquota de entrada | LC 123, Anexos III e V |
| ME/EPP no Simples no Brasil | ~7,4 milhões | Receita Federal, dez/2024 |
| Penetração do líder | ~50 mil clientes, 0,7% | PESQUISA-MERCADO |
| ICP em BH | ~100 a 175 mil empresas | mercado-bh-regional |
| Instagram no setor beleza | 83% de presença | Sebrae |
| Escritório Legalize Digital | 22 anos em BH | histórico |
