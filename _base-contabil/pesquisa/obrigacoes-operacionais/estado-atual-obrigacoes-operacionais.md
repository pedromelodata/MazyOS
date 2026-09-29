---
tipo: operacao
status: vivo
data: 2026-08-28
assunto: estado-obrigacoes-operacionais
tags: [pesquisa, mei, torre-de-controle]
---

# 📍 Onde estamos — obrigações operacionais (pós-constituição)

> Nota de estado. Abriu sessão nova aqui? Lê esta primeiro — conta onde paramos, sem precisar do histórico da conversa anterior.

## Por quê

Depois de fechar a pesquisa de CNAE (fonte confiável, 90→87 certeza), o Pedro pediu a próxima fase: mapear o que o produto precisa OFERECER de funcionalidade pro cliente já constituído — o que ele tem que fazer todo mês/ano pra continuar regular. Começa por **MEI** (mais simples), **ME/Simples Nacional fica pra depois**.

## O que já está feito (29/08)

1. ✅ **Pesquisa própria** (3 frentes, WebSearch/WebFetch): contábil/DAS-MEI/NF · DASN-SIMEI/desenquadramento · MEI-empregador + base pro ME.
2. ✅ **Prompt Gemini** rodado pelo Pedro, resultado em 2 arquivos (`Downloads/Obrigações Fiscais MEI e ME.md` + `Downloads/Obrigatoriedade NFS-e Nacional MEI.md`), arquivado em [[resultado-pesquisa-mei-obrigacoes-28-08]].
3. ✅ **Cruzamento fechado** — [[mei-obrigacoes-operacionais]] é o doc fonte-verdade resultante, com confiança marcada linha a linha.
4. ✅ **Primeiro mapeamento oficial de funcionalidades** — [[mei-mapeamento-funcionalidades]], 14 itens classificados imprescindível×sugestão, com justificativa e dependência de órgão externo × ajuste interno.
5. ✅ **Cobertura InfoSimples checada** (29/08, https://infosimples.com/consultas/): confirma DAS-MEI/FGTS/DASN-SIMEI/CNPJ/situação fiscal via consulta (boa parte RPA, exige credencial do cliente); confirma GAP em emissão de NFS-e nova (exige integração direta gov.br/nfse ou parceiro) e em eSocial (sem cobertura, Dataprev descontinuou).

## O achado que mais importa

**NFS-e Nacional é obrigatória pro MEI desde 01/09/2023**, via API federal única (gov.br/nfse), sem certificado digital, municípios proibidos de manter sistema próprio. BH confirmado bloqueado (Portaria SMFA 042/2023). Isso simplifica MUITO o emissor de NF do produto — não precisa integração por prefeitura, é uma API só.

Segundo achado grande: **não existe nenhuma ferramenta oficial de monitoramento do teto de faturamento do MEI.** É manual, sem alerta. Vira o diferencial mais forte do portal MEI.

## Pendências (não bloqueiam)

1. Tabela exata NR-05 (headcount × grau de risco → CIPA obrigatória) — só relevante pra fase ME (múltiplos empregados).
2. Custo/teto do exame periódico do MEI-empregador (pra estimar custo no produto).
3. Mecanismo exato do cruzamento e-Financeira × NFS-e que dispara desenquadramento de ofício (LC123 art.29).

## Próximo passo

Debater as 4 perguntas abertas de [[mei-mapeamento-funcionalidades]] (monitor de teto no V1 ou fase 2? módulo de folha vale a pena sem API de eSocial? emissor de NF — credenciamento direto ou parceiro tipo Focus NFe? DASN-SIMEI fica manual mesmo?) e, depois de fechado, começar a fase **ME/Simples Nacional geral** — a seção 7 de [[mei-obrigacoes-operacionais]] já é o ponto de partida (reaproveitada, não pesquisa do zero).

## Links
- [[mei-obrigacoes-operacionais]] · [[mei-mapeamento-funcionalidades]] · [[resultado-pesquisa-mei-obrigacoes-28-08]]
