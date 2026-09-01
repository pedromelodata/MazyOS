---
tipo: derivado
status: vivo
data: 2026-08-28
assunto: taxonomia-pills-n4
deriva_de: [cnae-liso-servico]
tags: [cnae, ux, n4, pills]
---

# 🏷️ Taxonomia de pills do N4 — v2 (87 CNAEs certeza)

> Substitui a v1 de 16/07 (`_arquivo/taxonomia-pills-n4.md`, 9 categorias, 124 CNAEs herdados da Contabilizei, não ratificados). Esta versão agrupa os **CNAEs "atendemos com certeza"** de [[cnae-liso-servico]] (fonte primária, 27/08) em categorias que um leigo reconhece.
>
> 🔄 **28/08:** eram 90/15 categorias. Investigação do eixo de registro setorial ([[cnae-liso-servico]] §"Saíram na correção") tirou `5232-0/00` (agenciamento marítimo, confirmado exige registro federal) e pendurou `3831-9/99`/`3832-7/00` fora da certeza (indício não confirmado). Como os 2 únicos CNAEs da categoria "Recuperação de materiais" eram exatamente esses, a categoria inteira SOME. **87 certeza, 14 categorias.**
>
> ⚠️ **Curada manualmente em conversa (Pedro + Claude, 27/08), não gerada por script** — diferente da v1, que saía de `taxonomia-pills.js`. Se o dataset mudar, esta nota precisa de revisão manual, não só re-rodar um gerador.

## As 14 categorias

| # | Categoria | CNAEs | Exemplo (1ª pessoa) |
|---|---|---|---|
| 1 | Tecnologia e software | 8 | "Desenvolvo sites, apps ou sistemas sob encomenda" |
| 2 | Design | 4* | "Crio design gráfico, de interiores ou de produto" |
| 3 | Foto, vídeo e áudio | 8 | "Fotografo, filmo e edito vídeo ou áudio" |
| 4 | Marketing e publicidade | 6 | "Cuido de redes sociais e faço publicidade pra clientes" |
| 5 | Edição e mídia | 6 | "Edito livros, jornais ou revistas" |
| 6 | Consultoria, pesquisa e tradução | 5 | "Faço consultoria, pesquisa ou tradução pra empresas" |
| 7 | Ensino e cursos | 9 | "Dou aula de idioma, música, dança ou curso profissionalizante" |
| 8 | Arte, cultura e patrimônio | 8 | "Produzo teatro, música, ou represento artista e atleta" |
| 9 | Eventos e entretenimento | 4 | "Organizo eventos, festas ou casas de jogos" |
| 10 | Apoio administrativo | 8 | "Faço serviços de escritório, cobrança e teleatendimento" |
| 11 | Aluguel de equipamentos | 8 | "Alugo equipamentos, móveis ou objetos" |
| 12 | Reparos e manutenção | 10 | "Conserto computador, celular, bicicleta ou relógio" |
| 13 | Salão e beleza | 1 | "Trabalho com cabelo, manicure e pedicure" |
| 14 | Hospedagem | 2 | "Tenho albergue ou pensão" |
| | **87 slots** (87 CNAEs + 1 duplicata − 1 sem pill) | |

*Design conta 4 pela duplicata proposital de `6201-5/02` (Web design) — aparece em Tecnologia **e** Design.

## Composição (CNAE por categoria)

### 1. Tecnologia e software (8)
`6201-5/01` · `6201-5/02` · `6202-3/00` · `6203-1/00` · `6204-0/00` · `6209-1/00` · `6311-9/00` · `6319-4/00`

### 2. Design (4, com duplicata)
`6201-5/02` (dup) · `7410-2/02` · `7410-2/03` · `7410-2/99`

### 3. Foto, vídeo e áudio (8)
`7420-0/01` · `7420-0/03` · `7420-0/04` · `7420-0/05` · `5911-1/02` · `5912-0/01` · `5912-0/02` · `5920-1/00`

### 4. Marketing e publicidade (6)
`7311-4/00` · `7312-2/00` · `7319-0/02` · `7319-0/03` · `7319-0/04` · `7320-3/00`

### 5. Edição e mídia (6)
`5811-5/00` · `5812-3/01` · `5812-3/02` · `5813-1/00` · `5819-1/00` · `6391-7/00`

### 6. Consultoria, pesquisa e tradução (5)
`7210-0/00` · `7220-7/00` · `7490-1/01` · `7490-1/04` · `7490-1/99`

### 7. Ensino e cursos (9)
`8591-1/00` · `8592-9/01` · `8592-9/02` · `8592-9/03` · `8592-9/99` · `8593-7/00` · `8599-6/03` · `8599-6/04` · `8599-6/05`

### 8. Arte, cultura e patrimônio (8)
`9001-9/01` · `9001-9/02` · `9001-9/03` · `9001-9/04` · `9002-7/01` · `9002-7/02` · `9102-3/02` · `7490-1/05`

### 9. Eventos e entretenimento (4)
`9319-1/01` · `9329-8/03` · `9329-8/04` · `8230-0/01`

### 10. Apoio administrativo (8)
`8211-3/00` · `8219-9/01` · `8219-9/99` · `8220-2/00` · `8291-1/00` · `8292-0/00` · `8299-7/03` · `8299-7/07`

### 11. Aluguel de equipamentos (8)
`7721-7/00` · `7722-5/00` · `7723-3/00` · `7729-2/01` · `7729-2/02` · `7729-2/03` · `7729-2/99` · `7733-1/00`

### 12. Reparos e manutenção (10)
`9511-8/00` · `9512-6/00` · `9521-5/00` · `9529-1/01` · `9529-1/02` · `9529-1/03` · `9529-1/04` · `9529-1/05` · `9529-1/06` · `9529-1/99`

### 13. Salão e beleza (1)
`9602-5/01`

### 14. Hospedagem (2)
`5590-6/01` · `5590-6/03`

## Fora de pill, achados só pelo textarea (1)
`9609-2/02` (agências matrimoniais/matchmaking) — continua nos 87 atendidos, mas não justifica pill própria: nicho demais e sem categoria vizinha honesta. Mesma doutrina "pill estreita, não valida" (17/07) — a pessoa ainda descreve no textarea, é lá que a IA cruza.

> 🔴 **Agenciamento marítimo (era 5232-0/00) SAIU DE VEZ, não é mais "fora de pill" — é "não atende".** Confirmado 28/08: exige habilitação federal (Receita Federal, Siscomex/RADAR aduaneiro). Ver [[cnae-liso-servico]].
>
> 🟡 **Recuperação de metal e de plástico (eram 2 CNAEs da divisão 38) também saíram**, mas por motivo diferente: pendentes, não descartados. Indício de exigência de CTF/APP (IBAMA), não confirmado. Por isso a categoria "Recuperação de materiais" inteira sumiu da lista acima — reaparece se a pesquisa confirmar "não exige" pros dois.

## O que mudou vs a v1 (16/07, arquivada)

1. **Categorias caíram de 9 pra 15** — a v1 tinha "sacos" (Eventos/Cultura/Esporte e Limpeza/Manutenção/Reparos, nomeados como tal na própria nota v1) que misturavam atividades sem identidade comum. A v2 quebra mais fino.
2. **"Conserto de veículos" (funilaria/mecânica) SOME.** Não existe CNAE de oficina automotiva nos 90 certeza — cai em `verificar-licenciamento` (risco médio/alto), não é `liso`. A lista antiga prometia algo que a base de hoje não sustenta.
3. **"Manutenção de máquinas" (industrial) SOME** pelo mesmo motivo (divisão 33, `verificar-licenciamento` no roadmap de [[cnae-liso-servico]]).
4. **"Conserto de eletrônicos" sobrevive**, fundido dentro de "Reparos e manutenção".
5. Achado no debate (27/08): categoria "Agenciamento" inicial forçava 3 CNAEs sem relação (marítimo · esportivo/cultural · matrimonial) só pela palavra em comum. Corrigido: agenciamento esportivo/cultural foi pra "Arte, cultura e patrimônio" (combina); marítimo e matrimonial saíram de pill (ver seção acima).
6. **"Cerimonialista de casamento" não é "agência matrimonial"** — são profissões diferentes (matchmaking × organização do evento). Cerimonialista já tem casa: `8230-0/01`, dentro de "Eventos e entretenimento".
7. **28/08 — categoria "Recuperação de materiais" SOME.** O eixo de registro setorial (`cnae-verifica-atende.js`) achou que os 2 CNAEs dessa categoria nunca tiveram essa checagem específica rodada neles. Investigado: `3831-9/99`/`3832-7/00` seguem pendentes (indício de CTF/APP IBAMA, não confirmado), e `5232-0/00` (marítimo, que já estava fora de pill) confirmou exigência real e foi descartado de vez. 15→14 categorias.

## Próximo passo (não feito ainda)
Se a pesquisa confirmar "não exige registro setorial" pros 2 pendentes, a categoria "Recuperação de materiais" volta (2 CNAEs, mesma composição de antes) — atualizar `PILLS` em `app/src/components/gate-telas.tsx` nesse momento.

## Links
- [[cnae-liso-servico]] · [[fundamentos-cnae]] · [[cnae-matriz-governo]]
