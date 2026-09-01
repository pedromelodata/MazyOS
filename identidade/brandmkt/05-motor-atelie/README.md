# Ateliê Legalizai — motor OFICIAL de criação de posts (local, sem API)

> Réplica adaptada do método `chat→peça` do Ateliê (`Projetos/atelie/metodo-replicavel/FLUXO-CHAT-A-PECA.md`),
> aplicada aos dados reais do Legalizai. Feita a partir do cruzamento em
> `Projetos/atelie/metodo-replicavel/CRUZAMENTO-LEGALIZAI.md` — toda decisão tomada ali foi executada aqui.
>
> **Sem API viva.** A "geração" acontece aqui mesmo, no Claude Code: você pede o post direto nesta pasta,
> eu leio a estratégia (ver `CLAUDE.md`) e escrevo a peça como JSON estruturado (não mais só texto solto
> em `.md`). Se validar, liga API depois — a estrutura já fica pronta pra isso.
>
> **Migração 2026-08-25 (ver ADR em `marca/decisoes-marca.md`):** os 2 agentes antigos
> (`legalizai-copywriter`/`legalizai-guardian`) foram **arquivados** em
> `../_arquivo/agentes-antigos-marketing/` — preservados, não usar, não recriar em `.claude/agents/`.
> Este `atelie/` é o motor oficial daqui pra frente. Ler `CLAUDE.md` — ele manda sobre o ritual de
> BOOT do vault pra pedido de post.

## Estrutura

```
dados/legalizai/
  estrategia/           ⚠️ SNAPSHOT congelado de 2026-08-25, só referência histórica — o motor NÃO
                         lê daqui. Fonte viva = os originais (`../marca/`, `../mkt/estrategia/`,
                         `../pesquisa/`), ver ordem de leitura em `CLAUDE.md`.
  tipos.md               contrato da Peça — schema completo, campos novos marcados 🆕
  primeira-campanha/
    campanha.json
    pecas/*.json          as 12 peças REAIS da campanha, migradas de copy.md + guardian-log.md
                           (headline/corpo/cta exatos, veredito real do guardian, zero texto inventado)

ds/legalizai/
  personagem-leo.md       cópia literal do doc de voz (prosa completa)
  voz.json                🆕 extração estruturada: proibidas/preferidas/qualificador — usar JUNTO com o .md acima
  tokens.json             paleta/fonte/raio — de decisoes-marca.md
  regras.json             QA determinístico (equivalente a lib/qa.ts) — o que é checável por código
  ctas.json               escada de CTA (mecanicas-engajamento.md) + os CTAs reais de waitlist já usados
  personas.json           🆕 índice de 5 dorsais (A/B/C/D/E) + 18 volantes + dial de ironia — Legalizai
                          tem isso, Ateliê não. Só índice (26/08); profundidade real fica em
                          ../../pesquisa/personas/*.md
  templates-texto.json    10 templates de TEXTO portados do Presente Sonoro, com nota honesta de adaptação
  templates-imagem.json   10 receitas de enquadramento portadas — ⚠️ compatibilidade BAIXA, ver arquivo

demo/index.html          página local, abre direto no navegador (duplo clique), sem servidor.
                          Mostra: Criar (exemplo de conversa real) · Planejamento (12 peças, QA ao vivo,
                          filtro por mote/persona) · Log·Estado (calculado ao vivo em JS, igual
                          resumoEstado() do Ateliê — não é arquivo estático).
```

## O que está 100% real (zero invenção)

- As 12 peças: headline/corpo/cta copiados literal de `copy.md`, veredito copiado literal de `guardian-log.md`.
- Os 4 docs de estratégia + `decisoes-marca.md`: cópia de arquivo, não retranscrição.
- `tokens.json`, `ctas.json`, `personas.json`, `personagem.json`: cada valor cita a linha/seção de origem.

## O que é extração minha (honesta, mas é leitura + estruturação, não achado pronto)

- `voz.json` — as regras em prosa viraram lista de termos porque você pediu; a lista de **concorrentes
  nomeados** ficou vazia porque não veio em nenhum documento que você me deu.
- `templates-texto.json`/`templates-imagem.json` — mapeamento PS→Legalizai por template é meu raciocínio
  (ex: MOTE B/C usa T07 "oferta" porque tem preço+CTA, igual o T07 do PS) — decisão de qual usar de fato é sua.

## O que ainda falta (listado no `tipos.md` e nos próprios JSONs, campo por campo)

1. `templateIdImagem` de cada peça — nenhuma decidida ainda (ver `AVISO_DE_COMPATIBILIDADE_REAL`).
2. Lista de concorrentes nomeados.
3. Onde a versão com API vai morar de fato (esta pasta é só demo local).
4. Se a inconsistência "Legalizai! 🎉" vs "Legalizai Story Book! 🎉" (achada em `voz.json`) tem resposta certa.

## Como usar agora

1. Abra `demo/index.html` no navegador (duplo clique) pra ver a estrutura funcionando com o dado real.
2. Pra pedir peça NOVA: abra sessão do Claude Code dentro desta pasta (`atelie/`) e só peça — o
   `CLAUDE.md` carrega sozinho, lê a estratégia na ordem certa (originais, não as cópias) e devolve o
   JSON no formato de `tipos.md`. Você decide se aprova; só então vira arquivo novo em
   `dados/legalizai/<campanha>/pecas/`.
