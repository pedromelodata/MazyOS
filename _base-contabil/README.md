# Base contábil do conteúdo

Esta pasta é a base factual de TODO conteúdo do Legalizaí (reel, carrossel, estático, stories,
legenda, anúncio, ideia do Banco de Ideias). Existe porque roteiro inventado vira multa.

## A regra

**O vault do produto é a fonte da verdade. Re-sincronize antes de produzir.**

```
node scripts/sincronizar-base-contabil.mjs
```

O script copia de novo a mesma lista de arquivos do vault, grava o commit e a data abaixo e avisa
se algum arquivo mudou. Se mudou, revise `FATOS.md` e `PROIBIDO.md` contra o que mudou ANTES de
escrever qualquer peça. Quando o vault e esta pasta discordarem, o vault vence.

## Os arquivos escritos à mão (o script nunca mexe neles)

| Arquivo | Pra que serve |
|---|---|
| `FATOS.md` | A lista aprovada de fatos pra conteúdo. Cada fato tem id (F001...), número, pra quem vale, validade, fonte e o que NÃO afirmar. Número, data, regra, preço ou fato legal que não está aqui não entra na peça |
| `PROIBIDO.md` | O que nenhum conteúdo pode dizer, prometer ou mostrar |
| `DIVERGENCIAS.md` | Onde a memória do workspace e os dados do app contradizem o vault, com a linha exata a trocar. Quem aprova mudança em `_memoria/` é o Pedro |
| `_manifesto.json` | Gerado pelo script: commit do vault e sha256 de cada cópia |

## Como usar numa peça

1. Rode o script (ou confira abaixo que a sincronização é recente).
2. Leia `FATOS.md` e `PROIBIDO.md` inteiros.
3. Todo número, data, prazo, preço, percentual, regra ou afirmação legal da peça cita o id do
   fato (ex.: `F003`) no campo Fontes. Sem id, não entra. O que não está em `FATOS.md` não é dito,
   ou é dito como "confirma com a gente", do jeito que as notas do vault mandam.
4. Fato marcado **CONFLITO** ou **NÃO USAR** não vai pra peça até o Pedro decidir.
5. As cópias nas subpastas são fiéis ao vault, inclusive com travessão e com o artefato
   "Legalizai Story Book" (que no original era "Legalizei"). Nada disso se copia pra peça.

## Por que o Léo do WhatsApp é a régua

A base `base-legalizai/` é a que o agente Léo usa pra atender cliente real, validada pelo time e
com regra dura: "Número nunca sai de memória". O conteúdo do Instagram fala com o mesmo público,
no mesmo nome. Se o WhatsApp não pode afirmar, o Reel também não.

<!-- sincronizar:inicio (bloco reescrito por scripts/sincronizar-base-contabil.mjs; não edite aqui dentro) -->

## Proveniência (gerado pelo script)

- Vault: `C:\Legalizei\legalizei`
- Commit: `9af83e7bb5e09715ed00213885b2be1f2dbf12b9`
- Data do commit: 2026-10-21 (Pedro Berg)
- Assunto do commit: /fechar 21/10 (2º): §Agora do 118º flow (marketing: volume semanal travado, calendário de 26/10 pelo motor atelie, anatomia do orgânico no padrão do Mauro), ADR, memória e reporte
- Sincronizado em: 2026-10-21 16:16
- Arquivos copiados: 53 (sha256 de cada um em `_manifesto.json`)
- Os arquivos copiados estavam iguais ao commit (sem mudança local no vault)

### Base oficial do Léo (a que o agente do WhatsApp lê antes de afirmar)

| Arquivo aqui | Origem no vault | Pra que serve |
|---|---|---|
| `base-legalizai/SKILL.md` | `execucao/agente-whatsapp-vault/skills-legalizai/base-legalizai/SKILL.md` | Índice da base oficial que o Léo do WhatsApp consulta. Regra: número nunca sai de memória |
| `base-legalizai/00-DIRETRIZES-SEGURANCA.md` | `execucao/agente-whatsapp-vault/skills-legalizai/base-legalizai/references/00-DIRETRIZES-SEGURANCA.md` | O que o Léo nunca faz (concorrente, "sem letra miúda", contador no MEI, prazo de abertura, valor de imposto do caso) |
| `base-legalizai/01-PLANOS-E-OFERTAS.md` | `execucao/agente-whatsapp-vault/skills-legalizai/base-legalizai/references/01-PLANOS-E-OFERTAS.md` | Preços, promoção, validade, o que cada plano inclui, lista de espera e os 3 links |
| `base-legalizai/02-PRODUTO-E-USABILIDADE.md` | `execucao/agente-whatsapp-vault/skills-legalizai/base-legalizai/references/02-PRODUTO-E-USABILIDADE.md` | Ordem real das etapas do app, corrigir dado, pré-lançamento |
| `base-legalizai/03-REGRAS-DOS-ORGAOS.md` | `execucao/agente-whatsapp-vault/skills-legalizai/base-legalizai/references/03-REGRAS-DOS-ORGAOS.md` | Prefeitura de BH (IPTU, apartamento), endereço fiscal, taxa da JUCEMG, Receita, quem pode ser MEI |
| `base-legalizai/04-QUEBRA-OBJECOES.md` | `execucao/agente-whatsapp-vault/skills-legalizai/base-legalizai/references/04-QUEBRA-OBJECOES.md` | Objeções por estágio de funil, com a estrutura da resposta |
| `base-legalizai/05-DICIONARIO-CNAE-TRIBUTARIO.md` | `execucao/agente-whatsapp-vault/skills-legalizai/base-legalizai/references/05-DICIONARIO-CNAE-TRIBUTARIO.md` | CNAE, Anexos III e V, Fator R, MEI x ME e a régua de profissão |
| `base-legalizai/06-CALCULO-FISCAL.md` | `execucao/agente-whatsapp-vault/skills-legalizai/base-legalizai/references/06-CALCULO-FISCAL.md` | Como o DAS da ME é calculado, faixas, Fator R, pró-labore, INSS e IRRF do sócio |
| `base-legalizai/07-OBRIGACOES-MENSAIS.md` | `execucao/agente-whatsapp-vault/skills-legalizai/base-legalizai/references/07-OBRIGACOES-MENSAIS.md` | Rotina do MEI e da ME, quem faz o quê, nota fiscal, prazos |
| `base-legalizai/08-MAPA-DO-DOSSIE.md` | `execucao/agente-whatsapp-vault/skills-legalizai/base-legalizai/references/08-MAPA-DO-DOSSIE.md` | Campo a campo do app de abertura e o motivo de cada um |
| `base-legalizai/09-ESCOPO-E-LIMITES.md` | `execucao/agente-whatsapp-vault/skills-legalizai/base-legalizai/references/09-ESCOPO-E-LIMITES.md` | Pra quem a gente atende: BH, serviço, MEI e ME, os dois tetos, sócios, CNAEs |
| `base-legalizai/10-CONTRATO-GARANTIA-CANCELAMENTO.md` | `execucao/agente-whatsapp-vault/skills-legalizai/base-legalizai/references/10-CONTRATO-GARANTIA-CANCELAMENTO.md` | 7 dias, fidelidade de 12 meses, multa de 30% |
| `base-legalizai/11-COMO-CONSULTAR-CNAE.md` | `execucao/agente-whatsapp-vault/skills-legalizai/base-legalizai/references/11-COMO-CONSULTAR-CNAE.md` | O que é proibido afirmar sobre um CNAE específico e as 15 categorias do app |
| `base-legalizai/12-GATE-DE-SAIDA.md` | `execucao/agente-whatsapp-vault/skills-legalizai/base-legalizai/references/12-GATE-DE-SAIDA.md` | Como dizer não sem perder a pessoa |

### Voz do Léo

| Arquivo aqui | Origem no vault | Pra que serve |
|---|---|---|
| `leo/00-SOUL-personalidade.md` | `execucao/agente-whatsapp-vault/00-SOUL-personalidade.md` | Quem o Léo é e como ele soa (ritmo, humor, quando fica sério) |
| `leo/personagem-leo.md` | `marca/personagem-leo.md` | Bíblia do personagem Léo: pilares, o que ironiza, bordões, pilares de conteúdo, visual |
| `leo/skill-atendimento.md` | `execucao/agente-whatsapp-vault/skills-legalizai/atendimento/SKILL.md` | Skill de atendimento do Léo (piso da conversa, checklist antes de enviar) |
| `leo/skill-vendas.md` | `execucao/agente-whatsapp-vault/skills-legalizai/vendas/SKILL.md` | Skill de vendas do Léo (qualificação, preço em dois tempos, lista de espera, nunca em venda) |
| `leo/skill-escalacao.md` | `execucao/agente-whatsapp-vault/skills-legalizai/escalacao/SKILL.md` | Skill de escalação do Léo (multa, cancelamento, prejuízo: humor desligado) |

### Marca

| Arquivo aqui | Origem no vault | Pra que serve |
|---|---|---|
| `marca/decisoes-marca.md` | `marca/decisoes-marca.md` | ADR da marca (entradas mais novas no fim). Autoridade em conflito de marca |
| `marca/glossario-tecnico-humano.md` | `marca/copy/glossario-tecnico-humano.md` | Termo técnico e a tradução em fala de gente |
| `marca/exemplos-copy-por-tela.md` | `marca/copy/exemplos-copy-por-tela.md` | Exemplos de copy de tela do app |

### Fontes legais literais

| Arquivo aqui | Origem no vault | Pra que serve |
|---|---|---|
| `fontes-literais/2026-09-14-fechamento-motor-fiscal-LITERAL.md` | `pesquisa/fontes/2026-09-14-fechamento-motor-fiscal-LITERAL.md` | Fonte legal literal: fechamento do motor fiscal |
| `fontes-literais/2026-09-14-lacunas-motor-fiscal-LITERAL.md` | `pesquisa/fontes/2026-09-14-lacunas-motor-fiscal-LITERAL.md` | Fonte legal literal: lacunas do motor fiscal |
| `fontes-literais/2026-09-15-defis-e-canais-LITERAL.md` | `pesquisa/fontes/2026-09-15-defis-e-canais-LITERAL.md` | Fonte legal literal: DEFIS e canais |
| `fontes-literais/2026-09-15-elegibilidade-simples-LITERAL.md` | `pesquisa/fontes/2026-09-15-elegibilidade-simples-LITERAL.md` | Fonte legal literal: quem pode optar pelo Simples |
| `fontes-literais/2026-09-15-pro-labore-por-socio-LITERAL.md` | `pesquisa/fontes/2026-09-15-pro-labore-por-socio-LITERAL.md` | Fonte legal literal: pró-labore por sócio, INSS e IRRF |
| `fontes-literais/2026-09-16-redutor-irrf-consulta-LITERAL.md` | `pesquisa/fontes/2026-09-16-redutor-irrf-consulta-LITERAL.md` | Fonte legal literal: redutor do IRRF 2026 |
| `fontes-literais/2026-09-18-risco-medio-liberacao-bh-LITERAL.md` | `pesquisa/fontes/2026-09-18-risco-medio-liberacao-bh-LITERAL.md` | Fonte legal literal: risco médio e liberação em BH |
| `fontes-literais/2026-09-18-transcricao-anexos-risco-bh-LITERAL.md` | `pesquisa/fontes/2026-09-18-transcricao-anexos-risco-bh-LITERAL.md` | Fonte legal literal: anexos de risco de BH transcritos |

### Pesquisa fiscal, rotina, obrigações e abertura

| Arquivo aqui | Origem no vault | Pra que serve |
|---|---|---|
| `pesquisa/fiscal-simples-bh-2026.md` | `pesquisa/fiscal-simples-bh-2026.md` | Pesquisa fiscal Simples, ME de serviço, BH 2026 (bloco CONSOLIDADO no fim) |
| `pesquisa/exigencias-jucemg.md` | `pesquisa/exigencias-jucemg.md` | O que trava um registro na JUCEMG (exigência x indeferimento) |
| `pesquisa/rotina-fiscal/2026-09-09-rotina-me-simples-bh.md` | `pesquisa/rotina-fiscal/2026-09-09-rotina-me-simples-bh.md` | Rotina fiscal da ME do Simples em BH |
| `pesquisa/rotina-fiscal/2026-09-09-verificacao-auditoria-tributaria.md` | `pesquisa/rotina-fiscal/2026-09-09-verificacao-auditoria-tributaria.md` | Auditoria que confere a rotina fiscal |
| `pesquisa/obrigacoes-operacionais/estado-atual-obrigacoes-operacionais.md` | `pesquisa/obrigacoes-operacionais/estado-atual-obrigacoes-operacionais.md` | Estado da pesquisa de obrigações do MEI |
| `pesquisa/obrigacoes-operacionais/mei-obrigacoes-operacionais.md` | `pesquisa/obrigacoes-operacionais/mei-obrigacoes-operacionais.md` | Obrigações do MEI: DAS, nota, DASN-SIMEI, teto, MEI empregador |
| `pesquisa/obrigacoes-operacionais/mei-mapeamento-funcionalidades.md` | `pesquisa/obrigacoes-operacionais/mei-mapeamento-funcionalidades.md` | Obrigações do MEI viradas em funcionalidade (não é promessa de produto) |
| `pesquisa/obrigacoes-operacionais/resultado-pesquisa-mei-obrigacoes-28-08.md` | `pesquisa/obrigacoes-operacionais/resultado-pesquisa-mei-obrigacoes-28-08.md` | Resultado bruto da pesquisa de obrigações do MEI |
| `pesquisa/abertura-mei/abertura-mei-processo.md` | `pesquisa/abertura-mei/abertura-mei-processo.md` | Como um MEI é aberto (canal oficial, o que é grátis, quem clica) |
| `pesquisa/abertura-mei/resultado-pesquisa-abertura-mei-28-08.md` | `pesquisa/abertura-mei/resultado-pesquisa-abertura-mei-28-08.md` | Resultado bruto da pesquisa de abertura de MEI |

### Estratégia orgânica

| Arquivo aqui | Origem no vault | Pra que serve |
|---|---|---|
| `estrategia/estrategia-organica.md` | `mkt/estrategia/estrategia-organica.md` | Estratégia orgânica viva (v4 de 01/09: facilidade, não economia de imposto) |
| `estrategia/mecanicas-engajamento.md` | `mkt/estrategia/mecanicas-engajamento.md` | Mecânicas de engajamento e filtro de sensibilidade |
| `estrategia/posicionamento.md` | `mkt/estrategia/posicionamento.md` | Posicionamento, arquétipo e frases-gatilho |
| `estrategia/2026-10-26-calendario-editorial-semana-26-10-a-01-11.md` | `mkt/redes-sociais/instagram/2026-10-26-calendario-editorial-semana-26-10-a-01-11.md` | Calendário editorial da semana de 26/10 a 01/11 (v2, motor atelie, 21/10): 3 reels, 5 feeds e 5 temas de stories |
| `estrategia/2026-10-15-plano-de-lancamento-reporte.md` | `execucao/mauro/2026-10-15-reporte-wpp.md` | Reporte de 15/10 com o plano de lançamento: fases, oferta, mote e o orgânico (4 a 6 posts por semana, feed às 18h ter/qui/sex) |
| `estrategia/2026-10-21-anatomia-do-organico.pdf` | `execucao/mauro/2026-10-21-anatomia-do-organico.pdf` | A anatomia do orgânico (conteúdo de 24/09) no padrão do reporte, em PDF: pilares, blocos, ângulos, gatilhos, mecânica e regras |
| `estrategia/2026-09-24-anatomia-do-organico.md` | `mkt/estrategia/2026-09-24-anatomia-do-organico.md` | O texto da anatomia do orgânico (24/09), o mesmo conteúdo do PDF de 21/10 |
| `estrategia/2026-10-21-volume-semanal-instagram.md` | `_memoria/legalize-volume-semanal-instagram.md` | Volume semanal travado em 21/10: 3 reels, 5 feeds e 5 temas de stories; calendário pelo motor atelie |
| `estrategia/atelie/00-decisoes-marca.md` | `atelie/dados/legalizai/estrategia/00-decisoes-marca.md` | Cópia do Ateliê, mais antiga que marca/decisoes-marca.md (esta vence) |
| `estrategia/atelie/01-posicionamento.md` | `atelie/dados/legalizai/estrategia/01-posicionamento.md` | Cópia do Ateliê, mais antiga que estrategia/posicionamento.md (esta vence) |
| `estrategia/atelie/02-estrategia-organica.md` | `atelie/dados/legalizai/estrategia/02-estrategia-organica.md` | Cópia do Ateliê SEM a v4 de 01/09 (estrategia/estrategia-organica.md vence) |
| `estrategia/atelie/03-mecanicas-engajamento.md` | `atelie/dados/legalizai/estrategia/03-mecanicas-engajamento.md` | Cópia do Ateliê, mais antiga que estrategia/mecanicas-engajamento.md (esta vence) |
| `estrategia/atelie/04-metodologia-personas.md` | `atelie/dados/legalizai/estrategia/04-metodologia-personas.md` | Metodologia de personas e tom por dorsal |

<!-- sincronizar:fim -->
