---
tipo: método (motor de vídeo por IA)
data: 2026-10-25
status: vivo; cada projeto alimenta o aprendizados.md
sucede: "[[leo-cena-imagem-e-video-fluxo]] (25/10, peça das eleições) — aquele doc segue valendo para o estático do Léo; o fluxo de VÍDEO mora aqui"
---

# Motor de vídeo por IA

Como sai um vídeo de 15 s, da imagem do personagem até a montagem. Nasceu da peça das eleições (Léo votando, 25/10) e evolui a cada projeto: **todo erro vira linha no [[aprendizados]]**, e toda regra abaixo cita o aprendizado que a criou.

## A estrutura

```
marca/video-ia/
  README.md          ← este método
  aprendizados.md    ← log A-NNN (o que deu certo, o que falhou, a regra que nasceu)
  projetos/<AAAA-MM-slug>/
    projeto.md       ← bíblia (personagens, cenário, luz) + takes + montagem + PROGRESSO
    prompts.md       ← todo prompt, versionado (v1, v2…), com o resultado de cada um
```

🔑 **O progresso mora no arquivo, não na conversa.** Ao fim de cada etapa: o vencedor (nome do arquivo do Gemini/Flow) vai para a tabela de progresso do `projeto.md`, e o prompt que funcionou fica marcado ✅ no `prompts.md`. Assim qualquer janela retoma do ponto exato.

## As 8 etapas

| # | Etapa | Ferramenta | Sai |
|---|---|---|---|
| 0 | **Roteiro de takes** | aqui | cada take = 1 gesto, 8 s, com imagem de início definida |
| 1 | **Bíblia** | aqui | personagens, cenário, luz, props, âncoras de identidade |
| 2 | **Folhas de referência** dos personagens | Gemini | uma imagem por personagem, só ele, fundo neutro |
| 3 | **Cenário vazio** (e seus estados de luz) | Gemini | o cenário sem gente; os outros estados saem por EDIÇÃO dele |
| 4 | **Quadros de início** | Gemini | a cena COM o personagem nasce inteira, com o cenário vazio e a REF anexados como referência (A-020); os outros estados saem por edição dela |
| 5 | **Correção** | Photoshop | o que o Gemini não corrige (A-004), cor, tela verde |
| 6 | **Takes** | Flow / Veo 3.1 | 1 sessão por take; Fast para testar, Quality para valer |
| 7 | **Conferência** | ffmpeg | tira de quadros, revisar sem assistir |
| 8 | **Montagem** | Adobe Express | cortes, texto, som, "FIM"/fecho, as versões (9:16 e 4:5) |

## 🎨 O estilo: "Luz Coral"

**Todo prompt, da folha de referência ao take, termina com o BLOCO ESTILO + um HUMOR** de [[estilo-luz-coral]] (grade coral nas altas luzes e ink nas sombras, luz motivada, contraluz coral, névoa, lente anamórfica, grão de filme) e usa só os **4 planos** da gramática de câmera (MESA · MÃO · OMBRO · ENTRADA). Vida desde a primeira imagem (A-014). A passada final de cor (mapa de gradiente / LUT "Luz Coral") unifica o que a IA desviar. Exceção única: a tela verde.

## As regras (cada uma com o aprendizado que a criou)

**Roteiro**
- **Um gesto por take.** Gesto contado ("4 toques + 1") é o ponto fraco do Veo: errou a contagem duas vezes seguidas (A-006). Se a história precisa de contagem, parte em takes de um gesto e emenda na edição.
- **Gesto simples e orgânico rende o melhor take** (ajeitar os óculos saiu de primeira, A-007).
- **Tudo o que a IA erra em detalhe sai da IA:** relógio, número, texto, tela de app. Vai para a edição (sobreposição) ou para a tela verde (A-008, A-009).
- **Pensar a montagem antes de gerar:** preparação → ação → reação; o take que vai invertido ou reaproveitado se decide no roteiro (A-010).

**Imagem (Gemini)**
- **Um elemento por vez:** fundo sozinho, depois o personagem, depois o objeto (A-001).
- **Edição, não geração:** "Keep the exact same composition… Only change…" preserva o resto (A-002). Os estados de luz do mesmo cenário saem assim. **Sempre em conversa nova, com a imagem anexada e o prompt abrindo com "Edit the attached image."** (Pedro, 25/10: conversa velha trava, A-003).
- **Conversa travou (devolve a mesma imagem) = conversa nova** (A-003).
- **Correção de detalhe não se pede ao Gemini:** regenera em conversa nova com a trava escrita no prompt (A-016). "Only change" é só para mudar o ESTADO do cenário.
- **Âncora com lado:** dizer em cada quadro qual mão faz o quê e onde está cada joia; escolher o ângulo que torna o erro impossível (cabeça fora pelo enquadramento, não pelo pedido) (A-015).
- **Personagem humano sem rosto se segura por ÂNCORAS:** roupa de cor única, relógio, aliança, a mesma manga. É o que o olho reconhece de take a take (A-011).
- **Composição:** a frase de enquadramento vem primeiro; simetria quando der; objeto posicionado em relação ao CORPO da pessoa, nunca em coordenada da imagem; não anexar imagem cujo layout contradiz o pedido (A-021).
- **Texto em objeto vem em branco** e entra no editor (A-005).
- **Prompt em inglês, curto por bloco:** sujeito, ação, cenário, câmera, luz, estilo, o que NÃO pode.

**Vídeo (Flow / Veo 3.1)**
- Agente: confirmar antes de gerar = Sempre; 9:16; **Fast para testar o movimento, Quality para o take final**; x2 quando o gesto for difícil.
- Prompt abre com: *"Generate a video with Veo 3.1, vertical 9:16, 8 seconds, using the attached image as the FIRST FRAME. Do not create a new image."* Conferir na confirmação que usa A SUA imagem.
- **Uma sessão por take** (o agente reaproveita imagens da sessão).
- **Só imagem de início** é o padrão (A-004). **Início + fim** só quando o take é uma TRANSFORMAÇÃO do mesmo quadro (time-lapse, mudança de luz) e as duas imagens saíram por edição uma da outra (A-012, a testar na Rebobina).
- **Câmera travada** sempre que dois takes precisam emendar ou um vai invertido (A-010).
- **Tela de celular = verde puro (#00FF00)**; a tela real do app entra por cima na montagem (A-009).
- Refazer um take: anexar o vídeo anterior como referência e dizer só o que muda (A-006).

**Montagem**
- Cortes secos; texto ≥ 1,5 s na tela; uma frase por vez, numa linha.
- Som, trilha e fecho só na edição, nunca na IA. Notificação sem "plim": vibração (briefing 15/10).
- **Gerar em 9:16 com a ação no miolo:** o 4:5 do feed é um recorte central (sobra 285 px em cima e embaixo), então nada importante nas bordas.

## Créditos

Veo 3.1 Quality: 100 créditos por vídeo de 8 s (medido 25/10). Orçar por projeto: takes × 2 tentativas em Quality + testes em Fast.

## Projetos

| Projeto | Status | Pasta |
|---|---|---|
| Léo votando (eleições, 25/10) | ✅ entregue (o take dos 4+1 ficou no plano B) | registro em [[leo-cena-imagem-e-video-fluxo]] |
| **Rebobina** (100% digital e 100% humana) | 🟡 em produção | `projetos/2026-10-rebobina/` |
