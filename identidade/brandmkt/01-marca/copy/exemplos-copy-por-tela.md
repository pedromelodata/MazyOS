---
tipo: referencia
status: vivo
data: 2026-08-05
assunto: copy-tom-de-voz
deriva_de: [conceito-marca, decisoes-marca]
tags: [marca, copy, exemplos]
---

# ✍️ Exemplos de copy por tipo de tela

> Fecha o item **K** do [[parking-lot]] junto com [[glossario-tecnico-humano]]. `conceito-marca.md` §5 tinha só 2-3 exemplos do/don't gerais — faltava um padrão por TIPO de tela (erro, vazio, sucesso, aviso legal), que é o que se repete centenas de vezes no flow. Todos os exemplos abaixo são copy **real, já em produção** (não inventada pra esta nota) — cada um cita o arquivo-fonte.

## Como usar
Ao escrever ou auditar uma tela nova, identifique o tipo (pode ser mais de um) e siga o padrão da seção correspondente. Ligado à rubrica [[metodo-varredura-flow]] (D1-D11) — isto aqui é o "com o quê comparar", a rubrica é o "como comparar".

---

## 1. Erro / bloqueio (`Aviso variante="danger"`)

**Padrão:** nomeia o fato sem culpar o cliente → diz exatamente o que precisa dele → dá a ação, não só o problema.

> "A prefeitura recusou a nota. Precisa de você: um dado do tomador veio errado. Toque pra corrigir e reemitir."
> — `ui/aviso.stories.tsx`

**Estrutura:** `[quem/o que causou] + [o que falta do cliente] + [ação clara, verbo no imperativo]`.

**Não fazer:**
- "Erro ao processar solicitação" (sem dono, sem próximo passo)
- "Falha na integração com a Prefeitura de Belo Horizonte" (jargão de log, não de conversa)
- Qualquer copy que sugira culpa ("Você preencheu errado") em vez de fato neutro ("um dado veio errado")

---

## 2. Vazio (primeiro uso / lista sem item)

**Padrão:** ícone neutro (não triste) → título curto nomeando a ausência → 1 frase de contexto (o que vai aparecer ali quando existir) → CTA que resolve a ausência.

> "Nenhuma nota ainda. Quando você emitir sua primeira nota, ela aparece aqui com o status em tempo real. [Emitir minha 1ª nota]"
> — `app/(portal)/notas/page.tsx`

**Estrutura:** `[título: "Nenhum/a X ainda"] + [o que vai aparecer aqui] + [CTA que já resolve, não só "adicionar"]`.

**Não fazer:**
- "Você ainda não tem notas cadastradas no sistema" (formal, sem CTA)
- Estado vazio sem ação nenhuma (deixa o cliente preso)
- Ilustração/copy que soe como falha do cliente por não ter usado ainda

---

## 3. Sucesso (confirmação, conquista)

**Padrão:** confirma o fato em 1 frase → se houver economia/vantagem, mostra ela explícita → tom leve, licença pro "Legalizai Story Book! 🎉" nos marcos grandes (abertura, 1ª nota), tom mais contido nas confirmações recorrentes (guia paga, dado salvo).

> "Abertura grátis. A gente não cobra honorário pra abrir. Você paga só as taxas de governo."
> — `ui/aviso.stories.tsx`

> "Sua alíquota: 6% · a menor possível" (badge de sucesso ao lado do número)
> — `app/(portal)/impostos/aliquotas/page.tsx`

**Estrutura:** `[o que aconteceu, direto] + [por que isso é bom pro cliente, se não for óbvio]`.

**Não fazer:**
- Confete/selo coral em toda confirmação pequena (banido pra P0/A5 — reserva o "grande" pro marco real, [[decisoes-marca]] 30/07)
- Sucesso genérico tipo "Operação concluída com sucesso"

---

## 4. Aviso legal / contratual (o ponto mais sensível — dinheiro, irreversibilidade)

**Padrão:** nomeia o ponto-sem-volta antes de pedir aceite → separa em camadas curtas (1 fato por linha, não parágrafo-bloco) → sempre com contrapartida visível quando existir (o que o cliente ganha em troca do risco) → o texto do checkbox repete o essencial em 1 frase, não remete só a "Termos".

> "A partir daqui, não dá pra desfazer. É o ponto sem volta: o que a Junta registrar a partir de agora não tem como ser desfeito. Vale conferir tudo antes de autorizar."
> + camadas separadas: "Você autoriza esta abertura de forma expressa, aqui, marcando o aceite." / "A taxa da Junta não é reembolsável depois que a gente registra, porque ela vai pro governo, não pra gente." / "O nosso serviço você cancela quando quiser, respeitando o prazo do plano."
> — `components/wizard-cauda.tsx` (`TermoView`)

**Estrutura:** `[aviso de irreversibilidade em warning, isolado] + [camadas: 1 fato = 1 frase, sem juridiquês] + [contrapartida, se existir] + [checkbox reafirma o essencial]`.

**Não fazer:**
- Bloco único de texto jurídico ("Ao clicar em Aceitar você concorda com os Termos de Uso e Política de Privacidade...")
- Esconder a cláusula desfavorável (não-reembolso) — ela aparece nomeada, não em letra miúda
- Prometer algo que o produto não cumpre (ex.: devolução, se a cláusula sair do contrato — reabre decisão, [[decisoes-marca]] 30/07)

---

## Regras transversais (valem pros 4 tipos)
- **Nunca travessão** (`—`) — regra dura de marca, `decisoes-marca.md` 13/07.
- **Termo técnico sempre traduzido ou escondido** — checar [[glossario-tecnico-humano]] antes de escrever qualquer copy fiscal/jurídica.
- **Coral nunca é erro/alerta** — cor de estado vem sempre dos tokens semânticos (info/warning/danger/success), nunca da paleta de marca.
- **1 fato por frase** nas telas de risco/dinheiro — parágrafo-bloco é onde o cliente para de ler.

## Links
- [[glossario-tecnico-humano]] · [[conceito-marca]] §5 · [[decisoes-marca]] · [[metodo-varredura-flow]] · [[auditoria-copy-flow]]
