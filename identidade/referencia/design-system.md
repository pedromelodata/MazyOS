---
tipo: verdade
status: vivo
data: 2026-07-16
assunto: design-system
deriva_de: [paleta-cores, decisoes-marca]
etapa: design-system
tags: [marca, design, design-system, tokens, shell, arquetipos, ux]
---

# 🧱 Design System — Legalizei (fundação)

> **O que é:** a fundação que vem ANTES das telas. Nasce do debate de 16/07 (método): construir tela por tela dá um amontoado; construir DS puro dá componente que ninguém usa. Como o protótipo (8 telas) + a LP já pagaram a fase de descoberta, o momento é de **extrair**, não recomeçar.
>
> **Regra que governa este doc: fundação LARGA, componente ESTREITO.**
> Cor, tipo, espaço, raio e motion valem pro **produto inteiro** (são baratos de acertar agora e não dependem de conhecer o portal). Componente só nasce quando uma tela **pede** — zero componente especulativo.
>
> **Critério de entrada** (anti-guru aplicado a design): *"decidir isso agora, sem conhecer o portal, é uma aposta?"* Escala de espaçamento → não é aposta. Card de vencimento com badge → aposta pura, fica fora.
>
> Primitivos de cor em [[paleta-cores]] · decisões travadas em [[decisoes-marca]] · flow em [[reordenacao-flow-cobranca-cedo]].

---

## 0. Shell — o que faz "parecer o mesmo lugar"

> A sensação de coesão em app grande não vem de componente bonito. Vem, nesta ordem: **(1) a moldura não se mexe · (2) ritmo espacial · (3) tokens semânticos**. Quantidade de componente é consequência, nunca causa.

### O produto tem DOIS shells (decisão 16/07)

| | **Wizard** | **App** |
|---|---|---|
| Telas | **N1–N9** (fora, até o pagamento) | **N10 em diante** (dentro) |
| Forma | fullscreen · **sem nav · sem saída lateral** | a casa · navegação persistente |
| Uso | uma vez, linear | recorrente |
| Cresce? | não (finito) | **sim — é onde abas novas nascem** |
| Progresso | barra do wizard | timeline própria do N21 |

**A casa nasce no N9 (pagamento).** Antes disso o sujeito é um lead atravessando um funil; depois, tem uma empresa em andamento e um lugar pra voltar. O teste que separa: *casa é onde você vai ver o que aconteceu enquanto você não estava.* Do N1 ao N8, nada acontece sem ele.

- **O wizard é um MODO, não uma seção.** Não herda cromo de navegação. A pergunta "e o menu?" não existe no N1–N9.
- **UX-32 aposentado** (16/07): a barra do wizard **não continua** na cauda. No B4 o gargalo é a JUCEMG, não o cliente, e o N21 já tem a própria timeline — duas barras medindo a mesma coisa, com a de cima pior.
- **N3 = 3 rotas** (UX-55): *Quero abrir minha empresa* → flow #1 · *Já tenho empresa* → flow #2 · *Entrar na minha conta* → login.

### As 5 pausas, por shell
| Pausa | Onde | Shell |
|---|---|---|
| P1 salvar & retomar | B2 | **app** |
| P2 aguardando pagamento | N9 | **app** (trava N19+N20, não o B4 inteiro) |
| P3 consenso 2º sócio | N19.5 | app |
| P4 assinatura GOV.BR | N23 | app (sai e volta por deep-link) |
| P5 constituição | N21 | app — é o próprio hub |

**Nenhuma pausa é do wizard.** O wizard só anda se o usuário andar; ele não tem espera. Isso simplifica o shell de fora a ponto de ele quase não ter estado.

---

## 1. Ritmo — a camada que o olho lê como "profissional"

> É grid tipográfico aplicado a produto. **Mobile-first** ([[mapa-telas-mobile]]).

### Espaçamento (base 4)
| Token | px | Uso típico |
|---|---|---|
| `space-1` | 4 | colagem (ícone↔label) |
| `space-2` | 8 | interno de chip/badge |
| `space-3` | 12 | interno de input |
| `space-4` | 16 | interno de card · gap de lista |
| `space-5` | **24** | **padding lateral da página** · gap entre blocos |
| `space-6` | 32 | separação de seção |
| `space-7` | 48 | respiro de bloco grande |
| `space-8` | 64 | topo/rodapé de tela |

**Uma densidade só.** Compact/comfortable é aposta — não construir.

### Tipografia — Sora (todo o sistema, travado 12/07)
| Token | px / line-height / peso | Uso |
|---|---|---|
| `text-display` | 32 / 1.15 / 700 | o número grande (economia no N5/N18), veredito |
| `text-h1` | 26 / 1.2 / 700 | título de tela |
| `text-h2` | 20 / 1.3 / 600 | título de bloco |
| **`text-body`** | **16 / 1.5 / 400** | **corpo padrão** |
| `text-body-strong` | 16 / 1.5 / 600 | ênfase no corpo |
| `text-caption` | 14 / 1.4 / 400 | apoio, legenda |
| `text-micro` | 12 / 1.4 / 500 | carimbo, meta |

> ✅ **`text-body` = 16px — decisão do Pedro (16/07).** Eu tinha proposto 17 pelo nicho leigo; ele optou pelo padrão web. **Consequência que fica registrada:** a acessibilidade do UX-12 ("letra grande") passa a depender **inteiramente da fonte ampliável**, não do default. Se a persona `cida` reclamar de leitura numa rodada futura, **o suspeito é este número.**
>
> **Fonte ampliável é requisito** (UX-12): a escala usa `rem`, nunca px travado.

### Container
- **Mobile-first.** `max-width: 480px` (mobile) · `560px` (tablet+), centrado.
- Padding lateral: **`space-5` (24)**.
- **Altura sem scroll onde couber**: `100dvh` + `min-h-0` (padrão colhido do protótipo).

### Raio
Derivado do próprio logo: o símbolo tem **raio ≈ 0,27 × lado** ([[decisoes-marca]] 12/07). Num ícone de 44px isso dá ~12 — que vira a régua do sistema, não coincidência.

| Token | px | Uso |
|---|---|---|
| `radius-sm` | 8 | chip, badge |
| `radius-md` | **12** | input, botão *(= o raio do símbolo)* |
| `radius-lg` | 16 | card |
| `radius-xl` | 24 | sheet, modal |
| `radius-full` | 999 | pill, avatar |

### Elevação — **sem sombra por padrão**
O fundo é **papel quente** (`ink-50`), não branco. Card = **branco sobre papel + borda hairline** (`ink-200`). Isso já separa, sem sombra, e é coerente com a metáfora de papel.
- `elevation-0` — padrão (borda hairline)
- `elevation-overlay` — só pra sheet/modal, que precisam flutuar de verdade

### Motion (MLP: craft está no escopo)
| Token | ms | Uso |
|---|---|---|
| `motion-micro` | 150 | hover, toggle, foco |
| `motion-default` | 250 | transição de tela, revelar campo |
| `motion-enter` | 400 | entrada de conteúdo, Lottie |

Easing padrão: `ease-out`. **Respeitar `prefers-reduced-motion`** (acessibilidade, UX-12).

---

## 2. Tokens semânticos — a camada que carrega a REGRA

> **A tela nunca escolhe uma cor. Ela pede um PAPEL.**
> Hoje as regras vivem em prosa no [[paleta-cores]] e dependem de alguém lembrar. Viradas token, deixam de ser disciplina e viram física.

### Superfície
| Token | → primitivo | Nota |
|---|---|---|
| `surface-page` | `ink-50` #FAF8F5 | **papel quente, não branco** |
| `surface-card` | `white` | |
| `surface-alt` | `ink-100` | faixa alternada |
| `surface-dark` | `ink-800` | bloco escuro |
| `surface-tint-brand` | `coral-50` | destaque suave |

### Borda
| Token | → primitivo |
|---|---|
| `border-hairline` | `ink-200` |
| `border-strong` | `ink-300` |
| `border-focus` | `coral-600` |

### Texto
| Token | → primitivo | Regra |
|---|---|---|
| `text-primary` | `ink-900` | |
| `text-secondary` | `ink-600` | |
| `text-tertiary` | `ink-500` | |
| `text-muted` | `ink-400` | ⚠️ **só placeholder/disabled. NUNCA texto de leitura** (falha AA) |
| `text-on-brand` | `white` | só sobre `action-primary-fill`, **≥18,66px bold** |
| `text-on-dark` | `white` | |

### Ação
| Token | → primitivo | Regra |
|---|---|---|
| `action-primary-fill` | `coral-600` | AA **só em texto grande** (≥18,66px bold / ≥24px) |
| `action-primary-fill-sm` | `coral-700` | **botão pequeno usa 700** (regra travada 12/07) |
| `action-primary-hover` | `coral-700` | **hover ESCURECE**, nunca clareia pra 500 |
| `action-primary-text` | `white` | |
| `action-dark-fill` | `ink-900` | CTA escuro ("séria no motor") |
| `action-secondary` | transparente + `border-strong` | |

### Marca
| Token | → primitivo | Regra |
|---|---|---|
| `brand` | `coral-500` | ⚠️ **SÓ logo/wordmark/identidade. Nunca fill de botão** |

### Estado (funcional — estado do CNPJ)
| Papel | tint | base | texto |
|---|---|---|---|
| `state-success` (em dia) | `#E7F6EF` | `#17A06A` | `#0B5E40` |
| `state-warning` (vence em breve) | `#FDF3E1` | `#F5A524` | `#98600A` |
| `state-danger` (vencido / precisa de você) | `#FCEBEB` | `#E03E43` | `#971F25` |
| `state-info` (dica) | `#EBF2FC` | `#3B82E0` | `#2360B8` |

### 🔒 As 4 regras duras
1. **Nenhuma tela toca primitivo.** Tela que escreve `#F2643C` é bug, não estilo.
2. **Coral nunca é erro.** Erro = crimson **+ ícone + texto**. Coral e vermelho são hues vizinhos: a distinção vem de forma, não de matiz.
3. **`text-muted` (ink-400) nunca é texto de leitura.**
4. **Azul nunca é marca.** O info-blue é funcional, uso mínimo.

---

## 3. Arquétipos — as situações que se repetem

> A pergunta certa não é *"quais componentes preciso?"*, é *"quais **situações** se repetem?"*.
> **Isto é DERIVADO, não inventado:** o [[mapa-ramificacoes-flow]] já era um inventário de arquétipos escrito em linguagem de produto (~19 condicionais em 3 tipos · **5 saídas terminais compartilhando 1 template**).

| # | Arquétipo | Onde | Nota |
|---|---|---|---|
| **A1** | **Pergunta** (input / escolha / toggle) | N4, N10–N16 | o mais comum. Erro **inline**, nunca modal |
| **A2** | **Veredito** 🟢/🟡/🔴 | N4 | estado + rota. Regra de ouro: **nunca veredito com baixa confiança** |
| **A3** | **Argumento/prova** | N5 (3 modos), N17 | número grande + **carimbo de estimativa** + "baixar o porquê" |
| **A4** | **Simulador** | N18 | input + resultado + expander de memória |
| **A5** | **Recap/revisão** | N7, N19 | lista por seção + editar volta ao passo |
| **A6** | **Aceite** (gate jurídico) | N8, N20 | leitura + **botão único grande**. Conteúdo legal **nunca** atrás de expander |
| **A7** | **Espera** | P2–P5 | estado + previsão honesta + aviso proativo |
| **A8** | **Painel/timeline** | N21 | 9 etapas × 4 estados (✅ ⏳ ⬜ 🔴) |
| **A9** | **Saída graciosa** | 5 saídas terminais | **1 template só**: barra + explica + captura + roteia (+ dossiê, UX-35) |
| **A10** | **Erro recuperável** | C1, N21 🔴 | "precisa de você" + ação concreta, **dentro** do pipeline |

### Transversais — NÃO são arquétipos de tela
Atravessam todos. Marcar a diferença agora evita virar componente errado.
- **Expander de profundidade** (UX-48/47/26/34) — default fechado, pra todos. Auto-seleção sem flag.
- **Carimbo de estimativa** (UX-26) — obrigatório em qualquer número projetado.
- **Idempotência visível** (UX-38) — "seu progresso está salvo, nada foi cobrado nem aberto duas vezes".
- **Handoff humano com dossiê** (UX-35) — toda saída entrega o que já foi preenchido.

---

## 4. Governança — a parte que de fato mata

> **Governança de time é social; governança solo é MECÂNICA.** Ninguém revisa o Pedro. A regra não pode depender de ele lembrar dela às 23h de uma sexta com uma tela faltando — é assim que **toda** dívida de DS solo nasce. Então: **fazer a coisa errada tem que ser mais difícil que fazer a certa.**

- **Nenhuma tela inventa componente.** Ou usa o que existe, ou **promove** conscientemente.
- **Regra dos 3** (com as 2 farol): aparece **nas duas** → promove agora · **em uma só** → fica local e espera a terceira ocorrência · **na terceira** → promove. Duas ocorrências é coincidência; três é padrão.
- **Atrito mecânico:** se `#F2643C` não existir em lugar nenhum pra copiar, ninguém usa. O caminho curto tem que ser o token — não por disciplina, por preguiça. **Projetar pro seu eu cansado.**

### Métrica (anti-guru: dá pra medir)
| O que | Alvo |
|---|---|
| valor hard-coded fora de token | **0** |
| componentes novos por tela | **cai** ao longo das telas |
| tempo da tela N vs tela 1 | **cai** |

> Se a nona tela custar o mesmo que a primeira, **o sistema falhou** e eu estava errado.

---

## 5. As 2 telas-farol (travadas 16/07)

| | Tela | Shell | Por quê |
|---|---|---|---|
| **mais simples** | **N4 — Gate-CNAE** | **fora** | a mais rica do funil (textarea, typewriter, loading, desambiguação, veredito, triagem, faixa) · **já existe no protótipo** pra colher · é a porta do produto |
| **muito complexa** | **N18 — Simulador** | **dentro** | o clímax. Ganhou custo do pró-labore consumindo o CLT (UX-24), aviso de borda (UX-39), veredito do teaser (3 modos), expander de memória (UX-47) |

**Por que essas duas:** a tensão é **dupla** — simples × complexa **e** fora × dentro. Um ponto de cada shell. As farol antigas (T7+T14) viraram N11+N18 e ficaram **as duas dentro do app**: extrair o DS delas daria um sistema que não sabe que o outro lado existe.

**Placeholder travado:** o **N18 nasce com estrutura de card por sócio, renderizando 1 card no caso solo** — o layout já aguenta 2 e o UX-25 (custo por sócio, 🔴 aberto) entra sem retrabalho.

---

## 6. O protótipo é COLHIDO, não portado

`ux-ui/prototipo/` é HTML+Tailwind throwaway. O B2 é **produto**. Aquele código **não vira** o produto — mas não é lixo: é pesquisa paga. **Migra decisão, não arquivo.**

| Colhido do protótipo | Vira |
|---|---|
| altura sem scroll (`100dvh` + `min-h-0`) | regra de layout |
| **CTA colado no rodapé** | **não é gosto, é thumb zone** — princípio de toda tela com ação primária |
| Lottie local (não CDN) | regra de asset |
| placeholder typewriter · confete de aceite | padrão de feedback |
| copy sem travessão | já é regra dura ([[decisoes-marca]] 13/07) |

⚠️ **Portar o HTML importaria a dívida de um throwaway.** Desconfie de mim se eu sugerir.

**Efeito colateral bom:** T1–T6 estarem "velhas" deixa de ser dívida. Elas não serão corrigidas, serão construídas do zero já no sistema, com as 5 rodadas de UX e o UX-48 embutidos.

---

## Links
- [[paleta-cores]] (primitivos) · [[decisoes-marca]] (ADR) · [[legalize-fonte-sora-sistema]]
- [[reordenacao-flow-cobranca-cedo]] (flow N1–N25) · [[mapa-ramificacoes-flow]] (origem dos arquétipos) · [[compilado-ux-flow]] (os 59 itens de UX)
- [[legalize-prototipo-ux]] · [[2026-07-12-lp-construida]] · [[HOME]]
