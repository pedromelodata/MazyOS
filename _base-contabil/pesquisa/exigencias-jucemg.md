---
tipo: referencia
status: vivo
data: 2026-09-04
assunto: exigencias-jucemg
tags: [jucemg, registro, viabilidade, exigencia, indeferimento, copy, flow]
fonte: material trazido pelo Pedro (04/09), base declarada IN DREI nº 81/2020
confianca: media-alta
---

# ⚖️ Exigências e indeferimento na JUCEMG — o que trava um registro

> Trazido pelo Pedro em 04/09 pra orientar a copy do A1/A2 (o que a gente promete antes do ponto sem volta). **Companheira de** [[2026-08-31-gravacao-jucemg-e-fusao-status]] · [[spec-mvp-v0]] · [[decisoes-marca]].
>
> 🔴 **Confiança média-alta, não ratificada.** A base normativa citada (IN DREI nº 81/2020) confere com o que a gravação de 31/08 mostrou, mas os detalhes de prazo e perda de taxa ainda precisam do double-check do Mauro/Larissa antes de virar promessa escrita em tela. Ver [[fila-validacao-humana]].

## 🎯 O achado que muda a copy

**Indeferir na hora é raro.** O padrão do registro mercantil é o processo cair em **EXIGÊNCIA**: volta pra correção, com prazo de **30 dias**. Só quem não corrige dentro do prazo é indeferido de vez, e aí **perde as taxas já pagas**.

Isso muda o vocabulário do produto: a tela não deveria falar de "recusa" como um fim. O evento comum é "a Junta pediu um ajuste", e o risco real não é o indeferimento, é o **silêncio de 30 dias**.

O rigor da análise é o MESMO pra atividade de baixo e de alto risco: a Junta olha o registro societário, não o alvará.

## 📋 Os 5 pontos de falha comuns

| Variável | Onde costuma quebrar | Por que trava |
| :--- | :--- | :--- |
| **Objeto social** | Texto do contrato divergindo da descrição oficial dos CNAEs do DBE | Objeto não pode ser amplo ("prestação de serviços em geral"): tem que descrever com precisão, espelhando os CNAEs |
| **Endereço da sede** | Diferença mínima de grafia entre viabilidade, carnê do IPTU e contrato | O Redesim acusa divergência por formatação e abreviação ("Av." × "Avenida") |
| **Capital social / quotas** | Soma das quotas que não fecha, ou integralização sem dizer quando e como | O contrato precisa especificar prazo e forma (moeda, bens) |
| **Qualificação dos sócios** | Divergência com a base da Receita (ex.: nome de casada não atualizado no CPF) | Estado civil, RG, órgão emissor, profissão e endereço têm que bater com o dado oficial |
| **Cláusulas obrigatórias** | Falta a Declaração de Desimpedimento ou o enquadramento como ME | Sem a cláusula de desimpedimento (não condenado, apto a administrar), o contrato não passa |

## 🛡️ Três práticas que blindam o processo

1. **Contrato padrão da JUCEMG** (o "Contrato Gerado pelo Sistema" no Integrador) costuma dar **deferimento automático**, por robô, em minutos, sem análise humana.
2. **Evitar CNAE coringa:** excesso de secundárias aumenta o risco de conflito de zoneamento na viabilidade (Prefeitura) e complica a redação do objeto.
3. **GOV.BR nível Prata ou Ouro** pra assinar. Conta Bronze gera exigência imediata, por falta de validade jurídica.

## 🔗 O que isto já explica no nosso flow

- **Por que o A1 existe** com a varredura de 03/09: qualificação do sócio e endereço são 2 dos 5 pontos de falha, e são exatamente os dados que a pessoa digita à mão.
- **Por que o objeto social é derivado dos CNAEs** e entra como leitura no A1: escrever objeto amplo é o ponto de falha nº 1.
- **Por que capital, quotas e profissão a gente preenche por dentro** (`PREENCHIDOS_INTERNAMENTE`): são campos onde o erro do cliente é caro e a padronização nossa é o que dá deferimento automático.
- **Por que a 2ª e a 3ª razão social são reservas nossas** (C7, travado 01/09): nome é o motivo "besta" mais comum de exigência, e 3 variações da mesma ideia caem juntas.
- **A3.1 ("órgão recusa") deveria falar em EXIGÊNCIA**, com o prazo de 30 dias visível. Hoje a tela trata como recusa seca, sem relógio.
