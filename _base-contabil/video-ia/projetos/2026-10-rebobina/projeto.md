---
tipo: projeto de vídeo (motor de vídeo por IA)
data: 2026-10-25
status: etapa 2 (folhas de referência) — ver PROGRESSO
roteiro: "[[2026-10-25-roteiros-video-100-digital-100-humana]] §Ideia 1"
uso: "Meta Leads (LD-REB, conjunto ME e RMK) · depois Assinaturas e orgânico (reels)"
---

# Rebobina

**Em uma frase:** a noite inteira perdida com papelada volta para trás com um toque no app, e ele chega a tempo da mão do filho.
**Camadas do mote:** "100% digital." (o toque) · "E 100% humana." (a mão da criança) · "A gente devolve o seu tempo." (a promessa) · "Vai, legaliza aí." (fecho). Versão Leads ganha "Dia 10/11".
**Persona:** A (freelancer PJ, 32 a 42) e B. **Plano:** ME (a peça não fala de contador, então não promete nada ao MEI; mesmo assim roda no conjunto ME).

## 1 · A grande sacada de produção

**3 takes viram 4 momentos.** O take do time-lapse (T1) é usado duas vezes: para a frente (a noite passando) e **invertido na edição** (o rebobinar). Como T1 e T3 têm **o mesmo quadro, câmera travada, às 19h**, o rebobinar termina exatamente onde T3 começa: a emenda é invisível.

## 2 · A bíblia

### Personagens (sem rosto, identidade por âncoras: A-011)

| Código | Quem | Âncoras fixas (iguais em todo prompt) |
|---|---|---|
| **P1** | o PJ, ~35, brasileiro, pele morena clara, **visto só de costas** (nuca de cabelo curto escuro, ombros) ou só mãos | camisa de linho **azul-marinho** com a manga dobrada no meio do antebraço · relógio de aço com **pulseira de couro preta no pulso esquerdo** · **aliança fina dourada** · nada no pulso direito |
| **P2** | o filho, ~6 anos | só mão e antebraço · suéter de tricô **coral** (a cor da marca entra no momento "humana") · mão pequena, unhas curtas |

### Cenário

| Código | O quê |
|---|---|
| **C1** | canto de jantar de um apartamento em BH. Mesa de madeira clara (carvalho), uma cadeira de madeira com almofada coral. Janela grande ao fundo com a cidade. Luminária pendente sobre a mesa. Uma planta pequena. Minimalista, vivido, quente |
| Câmera | **travada**, plano 3/4 de cima, a mesa ocupa os 2/3 de baixo do quadro, a janela o terço de cima. 9:16, ação no miolo (recorte 4:5) |
| Props fixos | notebook prata · caneca branca de cerâmica · caneta · celular · a pilha de papel |
| ⛔ Sem | relógio na parede (A-013: a hora entra na edição) · rosto · texto legível · marca de terceiros |

### Estados de luz

| Estado | Hora | Janela | Luminária | Mesa |
|---|---|---|---|---|
| **18h** ☀️ hora devolvida | início | golden hour, sol rasante entrando de lado, sombras longas da janela na mesa | apagada | arrumada: 1 pilha pequena, caneca cheia com vapor |
| **23h** 🌙 hora chata | fim | noite escura, luzes da cidade ao longe | **acesa**, uma poça de luz quente; o resto em sombra ink | papel espalhado, recibos, pastas abertas, post-its, caneca vazia com a marca do café |

🎨 **Estilo:** todo prompt leva o bloco "Luz Coral" de [[estilo-luz-coral]] (25/10, depois da REF-P1 v1 sair fria). A noite perdida é o humor *hora chata*, o tempo devolvido é *hora devolvida*: o mote vira luz. Onde abaixo estiver "19h", ler **18h** (C1-19h passou a ser a cena das 18h).

## 3 · As imagens (Gemini + Photoshop)

| Código | O quê | Como sai | Usada em |
|---|---|---|---|
| **REF-P1** | folha de referência dos antebraços e mãos do P1 | geração, fundo neutro | base para F1, F2, F3 |
| **REF-P2** | folha de referência da mão do P2 | geração, fundo neutro | descrição no T3 (a criança não está em nenhum quadro de início) |
| **C1-19h** | cenário vazio às 19h | geração | base de tudo |
| **C1-23h** | cenário vazio às 23h | **edição do C1-19h** ("only change") | base do F2 |
| **F1** | C1-19h + mãos do P1 digitando | C1-19h + `assets/REF-P1.jpg` | início do T1 e do T3 |
| **F2** | C1-23h + mãos do P1 tensas sobre os papéis | edição do C1-23h + REF-P1 | fim do T1 (plano A) |
| **F3** | close: mão do P1 segurando o celular de **tela verde** sobre os papéis, às 23h | geração com REF-P1 + C1-23h de referência | início do T2 |
| **TELA** | a tela real do app (emitir nota → nota emitida) | print do protótipo | composta sobre o verde do T2 |

## 4 · Os takes (Flow / Veo 3.1, 8 s cada)

| Take | Imagem | Movimento (um gesto) | Plano |
|---|---|---|---|
| **T1** | F1 → F2 | time-lapse 19h → 23h: céu escurece, luminária acende, papel acumula, caneca esvazia; mãos trabalhando em velocidade | **A:** início + fim (A-012) · **B:** só F1 + time-lapse no prompt |
| **T2** | F3 | velocidade real: o polegar toca a tela **uma vez**, abaixa o celular e o deita sobre os papéis; a mão relaxa | câmera quase parada |
| **T3** | F1 | velocidade real: ele digita, sentado de costas na cadeira da almofada; aos 2 s a mão do P2 (manga coral) entra pela direita e puxa a mão direita dele; ele fecha o notebook pela metade, **levanta e sai pela direita com a criança, sempre de costas**; 2 s finais com **a cadeira coral vazia** na luz dourada | câmera travada, mesmo quadro do T1 |

## 5 · A montagem (Adobe Express, 15 s)

| Tempo | Trecho | Texto na tela | Som |
|---|---|---|---|
| 0,0 a 3,5 | T1 acelerado (~2,3x) | contador de hora no canto, mono: **18:04 → 23:47** | música subindo fraca |
| 3,5 a 5,5 | T2 com a TELA composta (toque → "Nota emitida") | **"100% digital."** | silêncio, só a vibração |
| 5,5 a 8,5 | **T1 invertido** (~2,7x) | contador voltando **23:47 → 18:04** | a música de trás para a frente |
| 8,5 a 13,0 | T3 | **"E 100% humana."** quando a mão da criança entra | a música volta, descendo, leve |
| 13,0 a 15,0 | fecho: fundo claro, o Léo (render existente) | **"A gente devolve o seu tempo."** · logo · "Vai, legaliza aí." (Leads: + "Dia 10/11") | a trilha fecha |

Versões: 9:16 (reels, stories) e 4:5 (feed, recorte central). Sem efeito sobrando no rebobinar: o próprio movimento invertido basta (briefing 15/10: seco e limpo).

## 6 · Orçamento de créditos

T1 em Fast (A e B) para escolher o plano · depois T1, T2 e T3 em Quality, até 2 tentativas cada: **~600 créditos** em Quality + os testes em Fast.

## 7 · PROGRESSO (atualizar a cada vencedor)

| Etapa | Item | Status | Vencedor (arquivo) | Nota |
|---|---|---|---|---|
| 0 | roteiro de takes | ✅ 25/10 | este doc | |
| 1 | bíblia | ✅ 25/10 | este doc | |
| 2 | REF-P1 | ✅ 25/10 (v3, recortada) | `assets/REF-P1.jpg` ← `Gemini_Generated_Image_25twgo25twgo25tw` | quadros 1, 2, 4; A-014 a A-017 |
| 2 | REF-P2 | ⏭️ dispensada | | a criança só entra pela descrição do T3 |
| 3 | C1-18h | ✅ 25/10 | `assets/C1-18h.jpg` ← `Gemini_Generated_Image_u1wvjzu1wvjzu1wv` | notebook virado à esquerda: mãos entram pela ESQUERDA |
| 3 | C1-23h | ✅ 25/10 | `assets/C1-23h.jpg` ← `Gemini_Generated_Image_4d0h5c4d0h5c4d0h` | alinhado ao C1-18h; edição em conversa nova funcionou |
| 4 | F1 | ✅ 25/10 (v5, 5ª tentativa) | `assets/F1.jpg` ← `Gemini_Generated_Image_grpzkngrpzkngrpz` | de costas, centrado; A-019 a A-021 |
| 4 | F2 | 🟡 25/10 aprovado, falta tirar a aliança da mão direita (Photoshop) | `assets/F2-bruto.jpg` ← `Gemini_Generated_Image_sd74shsd74shsd74` → `assets/F2.jpg` | alinhado ao F1 |
| 4 | F3 | ✅ 25/10 (v3) | `assets/F3.jpg` ← `Gemini_Generated_Image_9f9d489f9d489f9d` | notebook atrás (A-022) |
| 5 | Photoshop (cor, verde, retoques) | ⬜ | | |
| 5 | TELA do app | ⬜ | | |
| 6 | T1 plano A (Fast) | 🟡 v2 método ✅, 3 defeitos (perfil 2,0 s, cresce 1-2 s, duas mãos) → v3 | `takes/T1-A-v2-fast.mp4` | A-012 validado |
| 6 | T1 plano B (Fast) | ⏸️ reserva (o A segura câmera e luz) | | |
| 6 | T1 final (Quality) | ⬜ | | |
| 6 | T2 (Quality) | ⬜ | | |
| 6 | T3 (Quality) | ⬜ | | |
| 7 | conferência | ⬜ | | |
| 8 | montagem 9:16 | ⬜ | | |
| 8 | montagem 4:5 | ⬜ | | |
| ❤️ | **teste do coração** (briefing 15/10) | ⬜ | | mandar para a mãe/esposa: "que coisa linda" ou "é, bom"? |
