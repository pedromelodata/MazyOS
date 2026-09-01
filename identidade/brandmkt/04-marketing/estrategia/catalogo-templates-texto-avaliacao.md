---
tipo: derivado
status: vivo
data: 2026-08-26
assunto: catalogo-templates-texto-avaliacao
deriva_de: [mapa-itens-travados-criacao-post]
tags: [marketing, atelie, templates, item-9]
---

# 📐 Catálogo de templates de texto — avaliação pra decisão (item 9)

> Lido direto do código-fonte real (`Projetos/atelie/components/templates/registry.tsx` +
> `promovidos.tsx`, 26/08) — não é a lista de categorias do catálogo-resumo, é CADA template
> individual, o que ele mostra e minha nota de adaptação pro Legalizai. Cobre os 34 templates das
> categorias mais transferíveis (Oferta, Oferta claros, Prova social, Identidade) + resumo do resto.

## OFERTA (17) — bloco mais relevante pro pilar 5

| Template | O que mostra (estrutura real) | Nota de adaptação pro Legalizai |
|---|---|---|
| `preco-hero` | Fundo escuro + onda sonora de fundo · pill "a partir de" · preço GIGANTE centralizado · headline curta · CTA com seta | Direto — troca "a partir de R$19,90" por MEI/ME real, remove onda sonora (específica de música) |
| `fone-previa` | Fone de ouvido 3D grande à direita · pill "ouça antes" · preço + CTA | **Não serve** — conceito é "ouvir prévia de música antes de comprar", sem equivalente no Legalizai |
| `cta-gigante` | Sem preço · ícone + headline-pergunta grande + CTA | Fácil — bom pra CTA institucional tipo "Pronto pra simplificar sua contabilidade?" |
| `cupom` | Selo + código de cupom com borda tracejada + texto de desconto + CTA | Adaptável pra oferta de lançamento (ex.: cupom "FUNDADOR") |
| `beneficios` | Lista de 4 itens com check + preço + CTA | **Muito bom** — lista de diferencial real (preço fechado, contador humano, garantia 7 dias) + preço + CTA |
| `foto-preco` | Foto de fundo + pill "comece agora" + headline + "a partir de" + CTA | Bom com foto de Léo/humano-IA (item 10) |
| `garantia` | Selo circular com check + "7 dias" + headline + CTA | **Encaixe perfeito** — Legalizai JÁ TEM garantia real de 7 dias (CDC art.49), é literalmente o mesmo mecanismo |
| `ancora-valor` | Preço "âncora" riscado + preço real grande + headline + CTA | **Muito bom** — mecanismo de ancoragem que o posicionamento já usa (preço de/por) |
| `urgencia` | Prazo + desconto grande + CTA | ⚠️ só usar com prazo REAL (regra dura de escassez, ex.: 31/12/2026) |
| `tres-passos` | Lista numerada de 3 passos + CTA | Bom pro processo de abertura/migração em 3 passos |
| `combo-3d` | Objeto 3D (caixa de som) + selo "pack" + preço + CTA | Fraco — específico de pack de produto físico, sem equivalente direto |
| `flash-sale` | Desconto grande + "termina hoje" + CTA | ⚠️ mesma ressalva de escassez real |
| `vinil-3d-oferta` | Objeto 3D (vinil) + headline + preço + CTA | Troca o objeto 3D por device iPhone (já existe asset 3D do Legalizai) |
| `prova-escassez` | Número grande (+2.000) + headline + escassez + CTA "entrar pra lista" | Bom cruzando pilar 5+6, mas número precisa ser real (anti-guru) |
| `foto-prova-cta` | Foto + estrelas + citação de depoimento + CTA | Serve pro founder-made (Pedro/CNPJ) até ter depoimento real |
| `link-na-bio` | QR code + headline + "link na bio" + preço + CTA | Bom pra Stories/bio |
| `foto-sazonal` | Foto + pill de ocasião + headline + cupom + CTA | Bom pra datas sazonais (ex.: prazo DASN-SIMEI maio) |

## OFERTA CLAROS (7) — mesmas 7 ideias acima, versão fundo claro/papel

| Template | Nota |
|---|---|
| `preco-hero-claro` | Mesma leitura do `preco-hero`, fundo claro |
| `cupom-claro` | Mesma leitura do `cupom`, fundo claro |
| `beneficios-claro` | Mesma leitura do `beneficios`, fundo claro — **também muito bom** |
| `presente-3d-claro` | **Não serve** — objeto 3D é "presente" (dar de presente), conceito não existe no Legalizai |
| `flash-claro` | Mesma ressalva de escassez real |
| `ancora-clara` | Mesma leitura do `ancora-valor`, fundo claro — **também muito bom** |
| `foto-claro-preco` | Mesma leitura do `foto-preco`, fundo claro |

## PROVA SOCIAL (7) — pilar 6

| Template | O que mostra | Nota |
|---|---|---|
| `print-conversa` | Print de DM/conversa real: avatar + nome + estrelas + bolhas de chat | **Muito bom** pra founder-made ou depoimento real futuro |
| `nota-cheia` | Estrelas + citação grande + nome/contexto | Depoimento clássico, direto |
| `reacao-real` | Foto + estrelas + citação + contexto | Direto |
| `voz-emociona` | Ícone de microfone 3D + citação + estrelas | Fraco — específico de "voz cantando" |
| `mural-provas` | 2 citações lado a lado, borda à esquerda | Bom pra mostrar múltiplos depoimentos de uma vez |
| `depoimento-claro` | Fundo claro, aspas 3D + citação + estrelas + contexto | Direto |
| `conversa-clara` | Igual `print-conversa`, fundo claro | Direto |

## IDENTIDADE (3)

| Template | O que mostra | Nota |
|---|---|---|
| `marca-centrada` | Logo vertical + tagline pequena | Fácil adaptar pro rebrand coral |
| `bloco-sonoro` | Logo + textura de fundo (onda sonora) + tagline | Padrão reaproveitável trocando a textura (onda sonora → outra textura de marca) |
| `foto-assinatura` | Foto + linha + logo + tagline centralizado na base | Bom pra fechar carrossel ou peça de marca |

## Resto do catálogo (56 templates) — resumo, menos prioritário

- **Núcleo clássico T01-T09 (9) + Depoimento/CTA final/Players/Carrossel (13)** — já portados em `ds/legalizai/templates-texto.json`, você já os tem.
- **Novos (20)** — mix geral de layout (split-diagonal, comparativo, linha-do-tempo, mosaico, bilhete, polaroid, etc.). Maioria é estrutura de composição reaproveitável (ex.: `comparativo` = split "problema × solução", ótimo pra "contabilidade tradicional × Legalizai"; `linha-do-tempo` = 3 passos, redundante com `tres-passos`), mas boa parte tem elemento específico de presente/música (`save-the-date` = aniversário, `grid-generos` = gêneros musicais, `contagem-regressiva` = contagem pra aniversário) que não se aplica.
- **Teste_assets (9)** e **Teste_claros (5)** — são "banco de assets gráficos" (halftone, geométrico, estrelas) sobre headline — reaproveitáveis como fundo decorativo, mas dependem de asset gráfico próprio do Legalizai pra substituir os SVGs de teste do PS (nenhum foi feito ainda).
- **Players (4)** — 100% específico de tocar música (player, vinil, capa de álbum) — sem equivalente no Legalizai, categoria inteira descartável.

## Decisão final (26/08) — Pedro

Construir componentes visuais PRÓPRIOS do Legalizai é trabalho futuro, difícil de decidir sem ter algo real pra testar. Por ora: **20 templates escolhidos de forma variada** (não só os "melhores encaixes") viraram **sugestão de hierarquia de TEXTO** (headline/subhead/CTA/lista/preço, sem o visual do PS) em `ds/legalizai/templates-texto.json > hierarquiasSugeridas_20` — servem de guia quando o motor propõe uma peça, mas o Pedro monta cada peça manualmente por enquanto. **Os outros 70 ficam descartados por ora**, sem apagar nada — o catálogo completo (90) continua salvo aqui nesta nota + em `Projetos/atelie/metodo-replicavel/CATALOGO-TEMPLATES-TEXTO.md`, recuperável quando ele quiser revisitar.

## Guia pra quando construir os componentes visuais próprios (pedido explícito do Pedro pra quando ele voltar nisso)

Coisas a manter do padrão do Presente Sonoro (funcionam bem, não são específicas de música):
- **Frame fixo + escala** — cada template é desenhado num tamanho-base (360×450 = feed 4:5) e escala por transform; usar o mesmo princípio evita recalcular layout por formato.
- **Dado separado do componente (`peca.slots` + `peca.copy`)** — o componente só RENDERIZA, os textos vêm de fora (headline/subhead/cta/preço como props/slots). Esse é o padrão que faz um template servir pra 20 peças diferentes sem tocar código.
- **`overrides.bg`** — permite trocar o fundo/cor de um template sem duplicar o componente. Útil pro Legalizai ter 1 template com variante escura/clara sem 2 arquivos.
- **Zona de segurança de texto (safe-zone)** — o `Promo()` do PS já reserva margem (6%) pra texto não colar na borda; vale manter.

Coisas a redesenhar do zero (são as que dependem 100% de asset visual do Presente Sonoro):
- Trocar `SoundWave`/`MirrorBars`/`Equalizer` (elementos de áudio) por elementos próprios do Legalizai (ex.: ícone do Léo, textura de marca, ou nada).
- Trocar os objetos 3D (`vinil-3d`, `fone-3d`, `presente-3d`, `caixa-som-3d`) pelos assets 3D que o Legalizai já tem (device iPhone, card coral) ou pelos que vierem do item 10 (humano-IA fotorrealista).
- Trocar a paleta âmbar/creme do PS pelos tokens reais do Legalizai (`ds/legalizai/tokens.json` v2, já completo).

Sugestão de por onde começar quando voltar: os 9 templates de **Oferta** já mapeados aqui (`garantia`, `beneficios`, `ancora-valor` primeiro — são os que menos precisam de asset visual novo, só troca de cor/texto) são o menor esforço pro maior retorno.

## Links
- [[mapa-itens-travados-criacao-post]]
