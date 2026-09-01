---
tipo: derivado
status: vivo
data: 2026-08-26
assunto: mapa-itens-travados-criacao-post
deriva_de: [personagem-leo, posicionamento, estrategia-organica, mecanicas-engajamento, metodologia-personas, decisoes-marca, matriz-comparativa]
tags: [marketing, atelie, motor, gestor-trafego]
---

# 🗺️ Mapa dos itens travados — o que o motor de posts consulta (v final, 26/08)

> Inventário completo de tudo que está decidido/travado e é lido pelo motor (`atelie/CLAUDE.md`)
> toda vez que se pede um post novo. Esta versão consolida várias rodadas de validação item a item
> (26/08, incluindo o enriquecimento profundo de pilares/personas) — substitui as versões
> anteriores, não é mais um diff incremental.
>
> **Confirmação importante:** todo item marcado ✅/🟡 abaixo já está aplicado nos arquivos REAIS
> que o motor lê (`ds/legalizai/*.json`, `atelie/dados/legalizai/tipos.md`, `atelie/CLAUDE.md`,
> `marca/decisoes-marca.md`) — não é só esta nota de acompanhamento. Se você pedir uma ideia de post
> agora, o motor já usa tudo isto.

## Tabela-resumo (1-18)

| # | Item | Status final |
|---|---|---|
| 1 | Personagem/voz (Léo) | ✅ Validado + 1 regra nova |
| 2 | Posicionamento/claim | ✅ Validado, sem mudança |
| 3 | Pilares de conteúdo (1-15 v3, renumeração completa liberada) | ✅ Fechado — ver `validacao-pilares-blocos-personas.md` |
| 4 | Blocos de pauta (agora 4 blocos) | ✅ Fechado — ver `validacao-pilares-blocos-personas.md` |
| 5 | Personas (5 dorsais A/B/C/D/E + 18 volantes, enriquecidas + pesquisa real 26/08) | ✅ Fechado — ver `validacao-pilares-blocos-personas.md` |
| 6 | Escada de CTA | ✅ Validado, sem mudança |
| 7 | Mecânica de engajamento recorrente | 🟠 Pendente — quer enriquecer depois |
| 8 | CTA canônico ("Vai, legaliza aí.") | ✅ Validado, sem mudança |
| 9 | Templates de texto | ✅ Fechado — 20 hierarquias-guia escolhidas, resto salvo/descartado |
| 10 | Templates de imagem/humano-IA | 🟡 Brief travado, componente real ainda não existe |
| 11 | Tokens visuais | ✅ v2 completo aplicado |
| 12 | Regras duras / QA determinístico | ✅ Validado, evolui organicamente |
| 13 | Vocabulário permitido/proibido | ✅ Aplicado — mudanças reais |
| 14 | Grafia oficial da marca | ✅ Validado ("Legalizaí" com acento) |
| 15 | Preço/oferta de lançamento | ✅ Validado |
| 16 | Cadência de publicação | ✅ Validado — decisão de NÃO travar |
| 17 | Anti-repetição / histórico | ✅ Validado — vira alerta, não bloqueio |
| 18 | Contrato de dado da Peça (schema) | ✅ Aplicado — 3 campos novos |

---

## 1. Personagem/voz da marca (Léo) — ✅

**O que está travado:** suricato-sentinela, fusão vigilante+astuto/matreiro, fala em 1ª pessoa. Ironiza jargão/preço com asterisco/burocracia de fachada; NUNCA ironiza dúvida do cliente, susto fiscal real, a profissão contábil, concorrente por nome. Dial de ironia varia por persona (alto/A, médio/B, baixíssimo-zero/C).

**Regra nova (26/08):** se a copy fala na voz do Léo em 1ª pessoa, ele **precisa aparecer visualmente** na peça — não é mais opcional. Auditável via campos novos `vozNarrativa`/`personagemPresente` (item 18).

**Símbolo/emoji:** segue em aberto (§Perguntas em aberto de `personagem-leo.md`, sem prazo). Esclarecido: SVG não vira emoji Unicode de verdade (exigiria proposta formal ao Unicode Consortium, processo de anos, resultado seria público, não exclusivo). Vai virar **ícone/selo próprio** (SVG mestre → PNG transparente em 2 tamanhos) quando o Pedro trouxer o arquivo — uso como marca d'água/selo recorrente ou sticker de Stories, nunca como caractere inline.

**Onde mora:** `marca/personagem-leo.md` (original) · `marca/decisoes-marca.md` 2026-08-26 (regra nova) · `atelie/dados/legalizai/tipos.md` (campos `vozNarrativa`/`personagemPresente`) · `ds/legalizai/voz.json > regrasComportamentais_naoRedutiveisAPalavra` (regra replicada).

**Interfere em:** #3/#4 (pilares 2/3 são "donos" dele) · #9/#10 (templates precisam prever espaço pra ele aparecer) · #13 (verbal tics/frases).

---

## 2. Posicionamento/claim — ✅

Sem mudança nesta rodada. Statement, categoria mental, diferenciais (preço fechado sem asterisco, contador humano no plano de entrada do Simples Nacional). **Onde mora:** `mkt/estrategia/posicionamento.md`.

---

## 3. Pilares de conteúdo (1-15, numeração v3, era 1-9 + momentâneo) — ✅ Fechado

Revisão completa 26/08, 2 rodadas: pilar Fator R removido (virou sub-tema do 7), 2 pilares antigos pausados (14-Prova/reação, 15-Participativo/UGC standby), 7 pilares novos no total (3-Nossa origem, 5-Mitos/crenças erradas, 6-Calendário fiscal, 7-Educação fiscal/enquadramento, 11-Migração, 12-Gestão do dinheiro do dono, 13-Documentação em dia), pilar 8-Diferencial enriquecido de 4 pra 9 ângulos, Léo deixa de ser dono exclusivo de nenhum pilar. **Renumeração completa liberada por Pedro na 2ª rodada** (as 12 peças da campanha ainda não tinham subido, sem problema em alterar) — números agora sequenciais sem gaps, 12 peças `.json` já atualizadas (`pilar: 5` → `pilar: 10`). Detalhe completo em `mkt/estrategia/validacao-pilares-blocos-personas.md` §3. **Onde mora:** `mkt/estrategia/estrategia-organica.md` §Camada 1 (v3) + `marca/personagem-leo.md` §11 (v3).

---

## 4. Blocos de pauta (era 40/40/20, agora 4 blocos) — ✅ Fechado

De 3 blocos pra 4 (Afeto/Marca 20% · Educação/Dor 30% · Diferencial/Confiança 25% · Conversão/Produto 25%), respondendo à pergunta de quantos blocos fazem sentido com mais pilares ativos. Detalhe completo em `validacao-pilares-blocos-personas.md` §4. **Onde mora:** `mkt/estrategia/estrategia-organica.md` §Camada 1.

---

## 5. Personas (era A/B/C, agora 5 dorsais A/B/C/D/E + 18 volantes) — ✅ Fechado

Várias rodadas no mesmo dia (26/08): Dorsal D ("MEI de vida toda") criada por decisão direta; volante `a4-jovem-cnpj-servico-intelectual` nasceu sob A e foi **promovida a Dorsal E** ("Começa Certo") horas depois — 2 exceções de governança registradas, ambas com confiança rebaixada (🔴/🟡) por contradizerem ou não terem lastro no dado agregado de mercado. Auditoria de CNAE gerou 11 volantes novas, depois 2 removidas (`b4-nutricionista`, `c2-artesão`) e 1 simplificada (`a3-designer`) — total final **18 volantes**. Doutrina nova: dial de ironia ajustável por volante, não herança rígida.

**4 frentes de enriquecimento aplicadas às 5 dorsais** (não aos volantes, que herdam): banco de calibragem antes/depois (10-11 pares por pilar), mapeamento de pilar com razão (16 linhas), reação a crítica/ataque (5 cenários), referência visual fixa + prompt de imagem ("nano banana"). Rodada de correção pós-teste de imagem: gênero não-intencional corrigido em C/E, C recalibrada pra predominantemente masculina (achado de campo do Pedro), idade da D travada em 30-50, +5 objeções secundárias por persona, nova seção "Voz própria" (distinta de "Tom de voz") em todas as 5.

**Pesquisa real (Google Search, 26/08):** as 18 volantes ganharam seção "Pesquisa real" com dado citado (idade/gênero/renda/canais/reclamação/vocabulário/ambiente), fonte `Pesquisa Perfis Microempreendedores Belo Horizonte.md`. As 5 dorsais ganharam "Pesquisa real agregada" sintetizando os sub-perfis de cada grupo. Achado mais forte: 93% das novas empresas do setor de chaveiro em 2025 foram MEI — primeiro dado real que sustenta a existência da Dorsal D. Persona E permanece sem validação de dado (honestidade registrada, confiança 🔴 mantida).

Total: **23 personas documentadas** (5 dorsais + 18 volantes). Detalhe completo em `validacao-pilares-blocos-personas.md` §5. **Onde mora:** `pesquisa/metodologia-personas.md` + `pesquisa/personas/` (5 arquivos de dorsal + `pesquisa/personas/volantes/` com 18 arquivos).

---

## 6. Escada de CTA — ✅

Sem mudança. Nível 1 (engajamento: save/share/comentário) e nível 2 (funil, por estágio). Regra dura: orgânico de topo não força funil. **Onde mora:** `mkt/estrategia/mecanicas-engajamento.md` + `ds/legalizai/ctas.json`.

---

## 7. Mecânica de engajamento recorrente — 🟠 Pendente (aprofundada 26/08, aguardando validação do Pedro)

"Pergunta que ninguém explica" — Pedro gostou, pediu pra enriquecer antes de travar. Aprofundamento feito: calibração por dorsal (como cada uma participa/reage, risco a evitar), papel do Léo na mecânica (aparece só se narrar em 1ª pessoa, regra do item 1), script de remarketing DM de exemplo, métricas de sucesso, regra de anti-repetição aplicada a esta mecânica específica, e uma **proposta de 2ª mecânica** ("Antes/Depois calibrado", reaproveitando o banco de calibragem das 5 dorsais) registrada como opção, não como decisão. **Ainda não travado** — falta validação do Pedro sobre o aprofundamento e decisão sobre a 2ª mecânica. **Onde mora:** `mkt/estrategia/mecanicas-engajamento.md`.

---

## 8. CTA canônico ("Vai, legaliza aí.") — ✅

Sem mudança. Fecho travado de convite/ação. **Onde mora:** `marca/personagem-leo.md` §6.

---

## 9. Templates de texto — ✅ Fechado

**Decisão final (26/08):** decidir template a template sem componente visual próprio construído é trabalho difícil de fazer bem agora — Pedro não vai gastar tempo nisso hoje. Catálogo completo é 90 templates únicos (107 IDs), 100% padronizado pro Presente Sonoro.

**O que foi feito:**
- **20 templates** escolhidos de forma variada entre as categorias mais transferíveis (Oferta 9, Oferta claros 2, Prova social 3, Identidade 2, Novos 4) viraram **`hierarquiasSugeridas_20`** em `ds/legalizai/templates-texto.json` — cada um é só a HIERARQUIA DE TEXTO (headline/subhead/CTA/lista/preço, ordem certa), sem o visual do PS. Servem de sugestão quando o motor propõe uma peça; **o Pedro monta cada peça manualmente por enquanto**, isto não vira render automático.
- **Os outros 70** ficam descartados por ora, sem apagar nada — catálogo completo salvo em `mkt/estrategia/catalogo-templates-texto-avaliacao.md` (34 detalhados) + `Projetos/atelie/metodo-replicavel/CATALOGO-TEMPLATES-TEXTO.md` (90 nomes/categoria), recuperável quando quiser revisitar.
- **Guia de construção de componente próprio** documentado em `catalogo-templates-texto-avaliacao.md` §Guia — o que preservar do padrão PS (frame+escala, dado separado do componente, safe-zone) e o que redesenhar do zero (elementos de áudio, objetos 3D, paleta).

**Onde mora:** `ds/legalizai/templates-texto.json` (v2, contém os 10 originais + `hierarquiasSugeridas_20`) · `mkt/estrategia/catalogo-templates-texto-avaliacao.md`.

---

## 10. Templates de imagem / humano-IA — 🟡 Brief travado, componente ainda não existe

Mesma realidade do item 9: requisito está travado, construção real fica pra quando o Pedro voltar nessa parte.

**Brief travado (26/08):**
- Estilo: **fotorrealista** (não estilizado).
- Tensão conhecida: card do CONTADOR específico continua exigindo foto real autorizada ou ilustração (regra já travada no guardian, `roteiros-video.md` 20/08) — humano-IA fotorrealista serve pra CLIENTE/cena de uso, não pra fingir ser o contador real.
- Combo de variações: cliente sozinho · contador sozinho · ambos juntos · ambos separados · ambiente escritório · ambiente rua (MEI prestador de serviço).
- Diversidade: idade 18+, tom de pele amplo, todos os gêneros, **etnia travada em características brasileiras** (atenção ao sudeste, praça de ataque inicial).
- Referência de profissão/idade: as 3 dorsais + volantes de `pesquisa/personas/`.
- Referência de CNAE: **124 CNAEs "Real" confirmados** (`pesquisa/cnae-matriz/limpeza-260-servico.md`) — cresce conforme o escopo atendido aumentar.

**Onde mora:** `ds/legalizai/templates-imagem.json > briefHumanoIA` (v2) · `marca/decisoes-marca.md` 2026-08-26.

**Interfere em:** #9 (mesmo par templateIdTexto/templateIdImagem) · #11 (tokens visuais aplicados na composição).

---

## 11. Tokens visuais — ✅ v2 completo

Reescrito a partir da leitura minuciosa de `marca/identidade-visual/design-system.html` (1006 linhas): escala de cor completa (coral 50-900, ink 50-900, 4 estados), tipografia completa (display/h1/h2/body/caption/micro), raio completo (sm/md/lg/xl/full), espaçamento base-4 (space-1 a space-8), motion (3 durações), gradiente (4 receitas reais). Faltando de propósito (ausência real, não omissão): guia de fotografia/ilustração de marca (é o item 10), paleta do personagem Léo (só em prosa), grid/safe-zone por formato.

**Onde mora:** `ds/legalizai/tokens.json` (v2).

---

## 12. Regras duras / QA determinístico — ✅

Mantido como está, evolui organicamente com as peças. 7 regras: `travessao`, `garantia-incondicional`, `garantia-sem-letra-miuda`, `marca-nome-antigo`, `concorrente-nomeado` (ativa desde 26/08), `escassez-simulada`, `mei-sem-contador-humano` (nova, substitui `qualificador-simples-nacional`, agora desativada). **Onde mora:** `ds/legalizai/regras.json`.

---

## 13. Vocabulário permitido/proibido — ✅ Aplicado

Mudanças reais:
- **Preferidas travadas não são lista fechada** — servem de semente. 7 variações novas criadas (não travadas): "Já vi essa armadilha, relaxa." · "Prazo apertado é problema meu, não seu." · "Em suricato:" · "Eu já li a letra miúda até de contrato que não é meu. Deformação profissional." · "Enquanto você toca o negócio, eu fico de olho no resto." · "Pergunta que ninguém faz alto, mas todo mundo pensa:" · "Léo, de olho."
- **Frases-gatilho de celebração corrigidas** — "Legalizai Story Book! 🎉" e "Legalizai! 🎉" excluídas (nenhuma fazia sentido). Confirmação/sucesso agora usa **"Vai, Legaliza aí!"**.
- **Qualificador "do Simples Nacional" deixou de ser obrigatório** — vira critério editorial.
- **Regra dura nova:** JAMAIS prometer/insinuar contador humano dedicado no plano MEI (bloqueante).
- **Concorrentes nomeados populados** (uso interno): Contabilizei, Agilize, Contaja, Facilite, Contabilivre, Marvee, ContaAzul, Nubank — trazidos de `pesquisa/concorrentes/matriz-comparativa.md`.

**Onde mora:** `ds/legalizai/voz.json` (v2).

---

## 14. Grafia oficial da marca — ✅

"Legalizaí" **com acento agudo** é a oficial (reverte o padrão sem acento). **Onde mora:** `marca/decisoes-marca.md` 2026-08-25. Pendência de arrumação nos docs antigos que ainda usam sem acento (não presumir corrigido).

---

## 15. Preço/oferta de lançamento — ✅

MEI R$19→R$49/mês, ME R$79→R$139/mês (3 primeiros meses), válido até 31/12/2026. Pode ser dito explícito em conteúdo orgânico também (não só anúncio pago), mas não é obrigatório em todo post — pode conviver com posts de puro suspense. **Onde mora:** `marca/decisoes-marca.md` 2026-08-20 e 2026-08-25.

---

## 16. Cadência de publicação — ✅

Decisão: **NÃO travar** nesta fase inicial ("ainda estamos sentindo o mercado"). Frequência/quantidade fica por sessão, respeitando só anti-repetição e blocos 40/40/20. **Onde mora:** `marca/decisoes-marca.md` 2026-08-26.

---

## 17. Anti-repetição / histórico — ✅

Vira alerta, não bloqueio duro. Pedro pode repetir pilar/ângulo de propósito; o motor tem que sinalizar antes de entregar (campo `excecaoAntiRepeticao`). **Onde mora:** `marca/decisoes-marca.md` 2026-08-26 · `atelie/dados/legalizai/tipos.md`.

---

## 18. Contrato de dado da Peça (schema) — ✅ Aplicado

3 campos novos em `atelie/dados/legalizai/tipos.md`: `vozNarrativa` + `personagemPresente` (item 1), `valorExplicito` (item 15), `excecaoAntiRepeticao` (item 17). Bloco `validacao` atualizado: `qualificadorSimplesNacional` desativado, `meiSemContadorHumano` no lugar. **Nota:** as 12 peças já existentes em `dados/legalizai/primeira-campanha/pecas/*.json` não foram retroativamente atualizadas — ficam com schema antigo até serem tocadas de novo.

---

## Recomendação de recorte pra reunião com o gestor de tráfego

Estratégia de mkt, prontos pra levar: **1, 2, 6, 8, 14, 15**. Em debate interno, não levar ainda: **3, 4, 5, 7, 9, 10**. Operacionais/técnicos: **11, 12, 13, 17, 18** (exceção: lista de concorrentes do 13 pode valer perguntar se tráfego já tem equivalente). **16** é decisão consciente de não travar — vale mencionar que a cadência está deliberadamente fluida.

## Tensões conhecidas (não resolvidas, registradas)

- **#10 × card do contador:** humano-IA fotorrealista não pode representar o contador específico (regra do guardian, 20/08) — só cliente/cena.
- **#15 × #16:** oferta pressiona a pauta, sem teto de volume total documentado pra semana de lançamento.
- **#14:** item mais "viral" — contamina qualquer peça em qualquer canal, exige varredura ampla se mudar de novo.

## Links
- [[personagem-leo]] · [[posicionamento]] · [[estrategia-organica]] · [[mecanicas-engajamento]] · [[metodologia-personas]] · [[decisoes-marca]] · [[matriz-comparativa]] · [[catalogo-templates-texto-avaliacao]]
