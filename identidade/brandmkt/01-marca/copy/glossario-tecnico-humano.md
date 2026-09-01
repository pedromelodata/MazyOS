---
tipo: referencia
status: vivo
data: 2026-08-05
assunto: copy-tom-de-voz
deriva_de: [conceito-marca, decisoes-marca]
tags: [marca, copy, glossario]
---

# 📖 Glossário técnico → humano

> Fecha o item **K** do [[parking-lot]] (achado do 25º flow, 2026-08-05): faltava tradução operacional da regra de ouro do tom de voz (`conceito-marca.md` §5 — *"todo termo técnico vem traduzido OU escondido"*). Esta nota é a lista extensa de vocabulário que faltava. Usar como checklist em toda auditoria de copy (rubrica D1-D11, [[metodo-varredura-flow]]).

## Como usar
Cada termo tem: **o que é** (definição curta, correta) · **como o produto fala** (a tradução real, puxada de copy já escrita e aprovada no código — não inventada agora) · **onde aparece** no flow. Termo sem tradução ainda testada em tela vem marcado 🟡 (proposta, não validada em produção).

Regra herdada de `conceito-marca.md` §5: **nunca exibir o termo técnico cru sem tradução ao lado ou em vez dele.** Esconder é válido quando o dado não muda a decisão do cliente (ex.: NBS na nota fiscal); traduzir é obrigatório quando o termo aparece porque o cliente precisa decidir ou entender algo.

---

## Constituição / abertura

| Termo | O que é | Como o produto fala | Onde aparece |
|---|---|---|---|
| **CNAE** | Código de 7 dígitos que classifica a atividade econômica na Receita | "o que sua empresa faz, no código que o governo usa" / no gate, nem aparece o código — aparece a atividade em português (`ConteudoCnae`) | E4 (gate), C1-C7 (constituição) |
| **Objeto social** | Descrição formal da atividade no contrato social | "o que sua empresa vai fazer, escrito no contrato" | C (constituição) |
| **Capital social** | Valor declarado como investimento inicial dos sócios | "quanto vocês declaram que investiram pra abrir" | C (constituição, dossiê) |
| **Viabilidade (JUCEMG)** | Consulta prévia que confirma se o nome/atividade pode ser registrado no endereço | "checagem antes de registrar, pra não travar depois" | C, A (aprovação) |
| **Situação cadastral** | Status do CNPJ na Receita (ativa/baixada/suspensa/inapta) | "se sua empresa está ativa hoje" | E4.2 (migrar), `/migrar/cnpj` |
| **Alvará** | Licença municipal de funcionamento | "autorização da prefeitura pra funcionar" | `/mais/documentos` |
| **IPTU (índice)** | Número do imóvel usado pra validar endereço na JUCEMG | 🟡 proposta: "número do seu IPTU, pra confirmar o endereço" | C (dossiê, campo obrigatório) |
| **JUCEMG** | Junta Comercial de Minas Gerais — quem registra a empresa | "a Junta" (nunca a sigla sozinha) | C, A (aprovação) |
| **Protocolo (JUCEMG)** | Número de acompanhamento do pedido de registro | "o número que acompanha seu pedido" | A (timeline de aprovação) |
| **DAE** | Documento de Arrecadação Estadual — a taxa que se paga pra Junta processar | "a taxa da Junta" | N9/pagamento, N20/termo (nunca reembolsável, `wizard-cauda.tsx`) |

## Tributário / mensal

| Termo | O que é | Como o produto fala | Onde aparece |
|---|---|---|---|
| **Simples Nacional** | Regime tributário unificado pra pequena empresa | "o regime que a maioria das pequenas usa" — só aparece cru quando o cliente já entende (ex. autodeclaração `/migrar/tributario`) | E3.2, M1b |
| **Anexo III** | Tabela de alíquota do Simples pra maioria dos serviços (6%-33%) | "a tabela mais barata pra prestador de serviço" — a alíquota efetiva (%) importa mais que o nome do anexo pro cliente | `/impostos/aliquotas` (real: "Simples Nacional · Anexo III") |
| **Anexo V** | Tabela de alíquota do Simples quando o Fator R não bate 28% (15,5%-30%) | "a tabela mais cara, que a gente evita com o Fator R" | mesma tela, contraste |
| **Fator R** | `folha ÷ faturamento (12m)` — decide Anexo III (≥28%) × V (<28%) | "o número que decide se você paga menos imposto" / na tela real: "O que te mantém em 6%: o Fator R" | `/impostos/aliquotas`, `/pro-labore`, [[legalize-cnae-fiscalmente-otimo]] |
| **DAS** | Documento de Arrecadação do Simples — a guia mensal unificada | "sua guia do mês" / "o boleto do Simples" | `/impostos`, `/impostos/guias` (real: "Sua guia do DAS de junho fecha dia 20") |
| **PGDAS-D** | Declaração mensal que gera o valor do DAS | "a declaração que calcula sua guia" — "você não preenche nada" | `/mais/declaracoes` |
| **DASN-SIMEI** | Declaração anual obrigatória do MEI | "a declaração anual do MEI" | E3.2 (migrar MEI), sazonalidade de maio ([[estrategia-organica]]) |
| **CPP** | Contribuição Previdenciária Patronal, embutida no DAS | 🟡 proposta: não citar por nome — é parte do "imposto" já calculado, não decisão do cliente | memória de cálculo (`Conta`, `/impostos/aliquotas`) |
| **Pró-labore** | Retirada mensal do sócio, sujeita a INSS/IRRF e input do Fator R | "o que você tira pra você todo mês" | `/pro-labore` (real: "Ajustar meu pró-labore") |
| **INSS (sobre pró-labore)** | Contribuição de 11% sobre o pró-labore, teto R$932,31 | "o desconto do INSS sobre sua retirada" | `/pro-labore` |
| **Regime tributário** | A "categoria" de tributação da empresa (Simples/Presumido/etc.) | "como sua empresa é tributada hoje" | `/migrar/tributario`, `/saida/regime-nao-suportado` |
| **NFS-e** | Nota Fiscal de Serviço eletrônica | "sua nota" (nunca a sigla completa em tela de emissão) | `/emitir`, `/notas` |
| **Tomador** | Quem recebe/paga a nota (o cliente do cliente) | "pra quem é a nota" | `/emitir` |

## Certificado / acesso

| Termo | O que é | Como o produto fala | Onde aparece |
|---|---|---|---|
| **Certificado digital A1** | Arquivo que autentica a empresa digitalmente perante os órgãos | "seu certificado" — o processo de emissão é passivo (parceira liga), nunca "faça upload" no dia-1 (`decisoes-marca.md` 27/07) | `/mais/documentos`, Home dia-1 |
| **Procuração e-CAC** | Autorização digital pra Legalizai atuar em nome do cliente perante a Receita | 🟡 proposta: "autorização pra cuidar da parte da Receita por você" | fase de ativação fiscal (não construída ainda) |

## Migração (flow #2)

| Termo | O que é | Como o produto fala | Onde aparece |
|---|---|---|---|
| **TTRT** | Termo de Transferência de Responsabilidade Técnica — troca de contador, aberto pelo novo e validado pelo antigo no CRC-MG | "a transferência" (nunca a sigla) — quando precisa nomear o risco: "depende do seu contador atual confirmar" | M3-M4 (migrar), `wizard-migrar.tsx` |
| **CRC-MG** | Conselho Regional de Contabilidade de MG — onde a TTRT tramita | "o conselho dos contadores" (se precisar nomear) | M4 |
| **RBT12** | Receita bruta dos últimos 12 meses — base de cálculo do Simples | "seu faturamento dos últimos 12 meses" | E4.2, `/impostos/aliquotas` |

---

## Regra de ouro (herdada, não nova)
> `conceito-marca.md` §5: *"O cliente nunca precisa saber o que é NBS pra emitir a nota."* Esconder > traduzir > sigla crua, nessa ordem de preferência. Sigla crua só quando o cliente já demonstrou saber (autodeclaração, ex. "Simples" em `/migrar/tributario`).

## Termos ainda sem tradução testada (🟡 fila)
Capital social mínimo por natureza jurídica · ICMS/ISS na 6ª faixa (saem do DAS) · desoneração de exportação · Fator R por CNAE variável (lista completa em [[anexo-iii-simples]]).

## Links
- [[conceito-marca]] §5 (regra de ouro, fonte) · [[decisoes-marca]] (travessão zero, tom guerrilha) · [[exemplos-copy-por-tela]] (padrões por tipo de tela) · [[metodo-varredura-flow]] (rubrica de auditoria) · [[anexo-iii-simples]] · [[fiscal-simples-bh-2026]]
