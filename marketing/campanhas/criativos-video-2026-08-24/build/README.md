# Build — leva de criativos 9:16

Pipeline AE-first. A fonte da verdade é este `jsx/` mais o roteiro correspondente em
[`../roteiros/`](../roteiros/). O `.aep` é artefato reconstruível: se ele sumir, rodar os
scripts na ordem devolve o projeto inteiro.

Todos os scripts são **idempotentes**: apagam e recriam o que é deles, então podem rodar
quantas vezes for preciso sem duplicar comp nem camada.

---

## Ordem de execução

| Ordem | Script | O que faz |
|---|---|---|
| 1 | `00-tokens-9x16.jsx` | comp `_CONTROLE` com 16 Color Controls no null `CORES` |
| 2 | `10-estrutura-9x16.jsx` | pastas, `GUIA-safe` e a fábrica `REELS_novoMaster(nome, frames)` |
| 3 | `20-precomps-9x16.jsx` | `PRE-grain`, `PRE-traco` e as fábricas de texto, ease, super de condição e end card |
| 4 | `80-c8-varredura.jsx` | a peça 8: `PRE-tira-12`, `C8-ABERTO`, `C8-FECHADO`, `MASTER-C8-VARREDURA` |

Os scripts 1 a 3 são **template**: as outras cinco peças da leva reusam eles sem alteração.
Só o `8N-*.jsx` muda por peça.

## Como rodar

**Pelo bridge MCP** (preferido, é como o *escalada* foi feito): com o After Effects aberto e o
painel **Window → mcp-bridge-auto.jsx** aberto, o Claude executa via `run-script`.

**Na mão, sem bridge** (funciona igual): no After Effects, **File → Scripts → Run Script File…**
e escolher cada `.jsx` na ordem acima. Os scripts não dependem do bridge para nada.

## Régua 1080×1920

```
GUIA-safe .......... 936x1320   ·  x 72 a 1008  ·  y 300 a 1620
Centro óptico ...... y 790      ·  é onde mora a âncora display
Palco .............. y 360 a 1140
Legenda queimada ... baseline y 1440 (mote A, 1 linha)
                     baseline y 1320 (motes B e C, porque o super ocupa o rodapé)
Super de condição .. baselines y 1420 / 1460 / 1500  ·  só motes B e C
Corredor do Instagram (PROIBIDO): banda direita x >= 880, banda inferior y >= 1650
```

## Regras que os scripts fazem cumprir sozinhos

- **Assert anti-blur.** O `80-*` varre o projeto inteiro e **lança erro** se achar qualquer efeito
  com `Blur` no matchName. Blur direcional reprova no build, então é checado por script e não
  pelo olho. O que roda na tira é o **motion blur nativo da composição** (shutter 180),
  desligado em toda camada tipográfica sem exceção.
- **Resolução de fonte.** O `20-*` sonda os nomes possíveis da Sora e **falha alto** se não achar,
  em vez de deixar o AE cair numa fonte substituta silenciosamente.
- **Orçamento de coral.** Na peça 8 são 2 acendimentos de um teto de 2, e eles nunca coexistem:
  entre f50 e f267 não há um pixel de coral no palco. Por isso as palavras fortes de B5 e B6 são
  ink e não coral. **Esta peça não tem folga: qualquer acendimento novo reprova.**
- **Super de condição em mote A** nasce criado e **desligado**, pra servir de template às peças
  de mote B e C sem retiming.

## Assets que os scripts importam

| Asset | Caminho | Estado |
|---|---|---|
| Tela real do app | `marketing/telas-app/obrigacoes.png` (1290×2796) | existe |
| Logo | `identidade/logos/legalizai-logo-horizontal.svg` | existe |

Crop auditado da tela: `crop=816:490:354:1406`, escala 1,147× em quadro = 936×562.
Varrido pixel a pixel: zero coral, zero verde, zero azul, zero travessão, zero valor monetário.
Ficam **fora** do crop, com folga medida, o `R$ 178,31` e o botão coral `Ver a guia`.

## O que ainda falta pra fechar a peça 8

1. **Locução.** Nenhum áudio foi gravado. As janelas de fala estão no roteiro, o WhisperX
   sincroniza depois. O `.venv` do WhisperX está em `marketing/filme/escalada/tools/`.
2. **SFX e trilha.** O roteiro especifica tick de relógio, whoosh de papel, clack, traço de tinta,
   sino do `ai` e o comportamento de stems.
3. **Gates humanos**, listados no fim do roteiro. O mais sério é o mês-alvo: o roteiro usa
   **JULHO**, que é o mês da tela real, e isso pode não fechar com a data de veiculação
   (Ressalva 1). Trocar o mês é mudar a constante `ALVO` no topo do `80-*`.
4. **Espaço em disco.** O render precisa de folga que a máquina não tem hoje.

## Estado do disco

Uma única SSD de 120 GB, sem segundo drive. Depois da limpeza desta sessão o livre saiu de
204 MB para cerca de 3 GB. Dá pra montar os comps e renderizar peça curta uma de cada vez,
limitando o disk cache do AE. Não dá pra trabalhar com conforto, e o alvo declarado no roteiro
é 30 GB.
