# Contrato de dado — Peça (Legalizai)

> Espelha `lib/tipos.ts::Peca` do Ateliê. Campos idênticos ao PS mantêm o nome; campos NOVOS
> (persona/dial/mote/estágio funil) vêm do que o `legalizai-copywriter.md` já usava em prosa —
> não inventei, só dei tipo/enum a um campo que já existia como texto livre. Marcado `🆕` = não
> existe no `Peca` do Ateliê.
>
> **v2 (26/08)** — 3 campos novos aplicados (`vozNarrativa`, `valorExplicito`, `excecaoAntiRepeticao`),
> propostos na validação do item 18 do `mkt/estrategia/mapa-itens-travados-criacao-post.md`, pra
> tornar auditáveis 3 decisões tomadas na mesma rodada (regra do Léo aparecer quando fala em 1ª
> pessoa, mix de posts com valor explícito x suspense, anti-repetição virar alerta em vez de bloqueio).
>
> **v3 (26/08, mesmo dia)** — `personaAlvo` estava desatualizado (só A/B/C) desde que as Dorsais D e E
> foram criadas; corrigido pra incluir as 5. Campo novo `personaVolante` (nullable) pra referenciar
> um dos 18 volantes quando a peça mira um recorte específico. Achado na auditoria de sincronismo
> pedida pelo Pedro — ver `decisoes-marca.md` 26/08.

```
id            string   — slug único, ex: "mote-a1-por-quem-entende"
titulo        string   — nome interno da variação, ex: "A1 — por quem entende"
campanha      string   — ex: "primeira-campanha"
mote          "A"|"B"|"C"                      🆕 — agrupador da campanha (institucional/MEI/ME)
pilar         number (1-15)                     — v3 26/08: renumeração completa liberada por Pedro
                                     (peças antigas atualizadas, não quebra nada). 13 ativos (1-13) +
                                     2 em standby (14-Prova/reação, 15-Participativo/UGC, ainda válidos
                                     como valor, só pausados na pauta ativa) — ver estrategia-organica.md
                                     §Camada 1 pra lista viva e o significado de cada número
personaAlvo   "A"|"B"|"C"|"D"|"E"|"geral"       🆕 v3 (26/08) — dorsal-alvo, de metodologia-personas.md.
                                     Atualizado: eram só A/B/C, agora 5 dorsais (D-"MEI de vida toda",
                                     E-"Começa Certo"). Ver ds/legalizai/personas.json (índice) +
                                     pesquisa/personas/persona-<letra>-*.md (conteúdo real completo,
                                     o JSON NÃO substitui isso).
personaVolante  string | null        🆕 v3 (26/08) — id do volante quando a peça mira um recorte
                                     específico dentro da dorsal (ex: "a1", "b3", "d1"), null se a
                                     peça fala pra dorsal inteira. Lista completa (18) em
                                     pesquisa/metodologia-personas.md §Volantes.
dialIronia    "zero"|"baixo"|"medio"|"alto"     🆕 — de personagem-leo.md §5
estagioFunil  "topo"|"meio"|"fundo"|"fundo-intencao"  🆕 — "fundo-intencao" = waitlist (produto não lançou)
formato       "estatico"|"carrossel"|"reels"|"legenda-avulsa"|"email"  — igual espírito do Formato do Ateliê, enum próprio
vozNarrativa  "leo"|"pedro-pessoa"|"institucional-nos"   🆕 v2 — quem fala na peça. Se "leo", o campo
                                     `personagemPresente` abaixo TEM que ser true (regra dura 26/08,
                                     decisoes-marca.md — Léo em 1ª pessoa exige aparecer visualmente).
personagemPresente  boolean          🆕 v2 — o Léo aparece visualmente na peça (imagem/vídeo)? Existe
                                     pra dar ao QA como checar a regra acima — sem este campo a regra
                                     era só promessa verbal, não auditável.
valorExplicito  boolean              🆕 v2 — a peça cita o valor real da oferta (preço/data) ou é peça
                                     de puro suspense/FOMO sem número? Existe pra calcular o mix
                                     (decisoes-marca.md 25/08 autoriza os dois tipos convivendo).
excecaoAntiRepeticao: {              🆕 v2 — preenchido só quando a peça REPETE pilar/ângulo/headline
  ativa       boolean                de propósito (decisoes-marca.md 26/08: anti-repetição virou
  motivo      string                 alerta, não bloqueio — Pedro pode burlar, mas o motivo fica
}                                     registrado pra quem olhar o histórico depois entender por quê.
copy: {
  headline    string
  corpo       string   — equivale a "corpo"/"legenda" do Ateliê
  cta         string
}
templateIdTexto   string   — id de ds/legalizai/templates-texto.json (10 portados do PS, ver arquivo)
templateIdImagem  string | null   — id de ds/legalizai/templates-imagem.json — null se ainda não decidido
                                     (⚠️ ver AVISO_DE_COMPATIBILIDADE_REAL no arquivo — maioria pendente)
autoCheckDoModelo   string[]   🆕 — os itens ✅/⚠️ que o legalizai-copywriter já declarava (mantido,
                                    igual você pediu) — é AUTO-RELATO do modelo, não validação real
validacao: {                  — EQUIVALENTE ao lib/qa.ts do Ateliê, mas calculado por código, não pelo modelo
  travessao          "ok"|"alerta"
  concorrenteNomeado  "ok"|"alerta"        — v2: lista populada 26/08 (ds/legalizai/voz.json), regra ATIVA
  qualificadorSimplesNacional  "desativada"  — v2: RELAXADA 26/08, deixou de ser obrigatória (critério editorial)
  meiSemContadorHumano  "ok"|"alerta"      🆕 v2 — substitui o qualificador acima como regra dura real
                                              (jamais contador humano prometido no contexto MEI)
  garantiaIncondicional        "ok"|"alerta"
  nomeAntigoMarca               "ok"|"alerta-revisar"
  alertas             string[]
}
guardian: {                   🆕 — o Ateliê não tem 2º agente separado, isto é específico do Legalizai
  veredito     "APROVADO"|"CORRIGIR"|"REJEITADO"|"pendente"
  notas        string
  data         string (ISO)
}
etapa         "ideia"|"aprovada"|"pronta"       — igual ao Etapa do Ateliê
status        "rascunho"|"aprovado"|"no-ar"     — igual ao Status do Ateliê
origem        string   — rastreio de onde a peça veio (ex: "migrado de mkt/campanhas/2026-08-primeira-campanha/copy.md")
```

## O que ainda falta (não inventado, listado)

- `templateIdImagem` — decisão de design, pendente por peça (ver `ds/legalizai/templates-imagem.json`).
- Nenhum `id` de mockup 3D específico (iPhone/card) estruturado — hoje só existe como script solto
  (`edicao_video/blender/iphone`, `card-3d.py`), não como catálogo consultável.
- Campo de imagem final (`imagem.arquivo` no Ateliê) — não existe ainda porque não há geração
  automatizada; as imagens da campanha real são `.psd`/`.jpg` manuais, fora deste schema por ora.
