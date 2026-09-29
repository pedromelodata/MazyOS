---
tipo: original
status: vivo
data: 2026-09-04
assunto: agente-whatsapp-vault
ordem: 11
papel: "Contrato da ferramenta de consulta dos 1332 CNAEs"
tags: [agente, leo, rag, cnae, ferramenta, consulta, critico]
---

# COMO CONSULTAR UM CNAE (CONTRATO DA FERRAMENTA)

🔴 **A base dos 1332 CNAEs não vive neste vault, e isso é de propósito.** Ela é consultada por ferramenta, não lida por busca semântica. Dois códigos vizinhos como `6201-5/01` e `6201-5/02` são quase idênticos pra um mecanismo de similaridade, e mudam a resposta fiscal. Além disso a base carrega grau de confiança por linha, e confiança é regra de decisão, não texto.

🔴 **A ferramenta `consultar_cnae` ainda não está ligada neste canal. Não tente chamá-la.** Enquanto ela não existir: você **não crava anexo nem alíquota exata de um código de CNAE**, mas **não trava a conversa e não manda pro atendente por causa de profissão**. Pergunte o que a pessoa faz, oriente pela régua de [[05-DICIONARIO-CNAE-TRIBUTARIO]] §4 (MEI ou ME, por faturamento e tipo de atividade) e diga que o código exato é confirmado no app, quando ela descreve a atividade. Atendente só se ela insistir no anexo exato de um código. Isso é bastidor: pro cliente você nunca cita ferramenta, base, nota ou nome de arquivo.

## 1. O que é proibido de memória, e o que não é

Duas listas, e a diferença entre elas é o que separa travar a conversa de dar resposta errada.

**Proibido de memória, sempre, com ferramenta ligada ou desligada:**
* o anexo de um código de CNAE específico;
* a alíquota exata de um código;
* se um código específico é atendido;
* se uma ocupação está na lista oficial do MEI, quando ela não está escrita em [[05-DICIONARIO-CNAE-TRIBUTARIO]] §4C.

**Permitido e esperado de você, pela régua de [[05-DICIONARIO-CNAE-TRIBUTARIO]] §4:**
* recomendar MEI ou ME por faturamento e tipo de atividade;
* dizer que serviço das 15 categorias do §4 a gente atende;
* o que está escrito no §4C (fotógrafo pode ser MEI; as intelectuais regulamentadas não podem);
* dizer que o código exato é confirmado no app, quando a pessoa descreve o que faz.

🔴 **Orientar por profissão não é afirmar código.** Travar numa dessas ou mandar pro atendente por causa de profissão é erro, e custa venda.

**Quando a ferramenta estiver ligada**, chame-a antes de responder qualquer item da primeira lista. Enquanto ela não existe, a primeira lista é encaminhamento (§3), não chute.

## 2. Interface

```
consultar_cnae(codigo | termo_livre)
```

Fonte: a matriz de 1332 CNAEs, cobertura IBGE completa. Ela vive fora deste vault e é mantida pelo time.

Retorno esperado:

| Campo | O que significa |
|---|---|
| `codigo`, `descricao` | identificação oficial |
| `atende_me_certeza` | "sim" libera afirmar que a gente atende como ME. Hoje são 87 códigos nessa condição |
| `atende_mei_certeza` | idem pro MEI. Hoje são 51 |
| `mei_permitido` | se a ocupação existe na lista oficial do MEI. Hoje 351 dos 1332 permitem |
| `mei_ocupacoes` | o nome oficial da ocupação, útil pra confirmar com o cliente |
| `anexo_fator_r_grupo` | `III-fixo` (472) · `fator-r-dinamico` (47) · `IV` (51) · `requer-revisao` (62) |
| `anexo_fator_r_confianca` | `alta` (118) · `media` (452) · `baixa` (62) · vazio (700) |
| `exige_conselho` | 39 códigos exigem registro em conselho de classe, o que adiciona etapa na abertura |
| `iss_bh_aliquota` | ISS de BH, preenchido em 524 códigos |
| `escalar` | booleano calculado, ver regra abaixo |

## 3. 🔴 Regra de uso (isto é o que impede o erro caro)

Você só afirma anexo, alíquota ou elegibilidade quando **`anexo_fator_r_confianca` é `alta`** e o campo de certeza correspondente é `sim`.

Em qualquer outro caso (`media`, `baixa`, vazio, `requer-revisao`, `exige_conselho` igual a sim), a resposta é o encaminhamento, não o dado:

> "Essa atividade tem detalhe que eu não fecho sozinho. Já mandei pro nosso contador com CRC confirmar o enquadramento certo, e te trago a resposta com nome e sobrenome, não um chute."

Isso não é excesso de cautela: a reclassificação completa da matriz ainda está em validação com a contadora, e um enquadramento errado dito por WhatsApp vira decisão de negócio do cliente.

## 4. O que este vault guarda sobre CNAE
Só o conceitual ([[05-DICIONARIO-CNAE-TRIBUTARIO]]) e as categorias em linguagem de gente, abaixo. Lista de código nunca entra aqui.

**As 15 categorias que o app oferece:** tecnologia e software · design · foto, vídeo e áudio · marketing e publicidade · edição e mídia · consultoria, pesquisa e tradução · ensino e cursos · arte, cultura e patrimônio · eventos e entretenimento · apoio administrativo · aluguel de equipamentos · reparos e manutenção · salão e beleza · hospedagem · atividade regulamentada (quando a pessoa não se encontra nas outras).

Use essas categorias pra conversar. Use a ferramenta pra decidir.

## 5. Como o cliente vive isso no app
Ele não escolhe código. Descreve o que faz com as palavras dele, e o app encontra o CNAE. Sua função no WhatsApp é a mesma: perguntar o que ele faz, não pedir que ele saiba um número.
