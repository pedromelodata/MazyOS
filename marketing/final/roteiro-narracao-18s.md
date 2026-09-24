# Roteiro de narração — Legalizai 18s (9:16, Meta Ads)

Locução encaixada na grade existente: **116 BPM**, 4 atos × 9 beats, cortes em
**4,655s / 9,310s / 13,966s**, fim em **18,621s** (mesmos números do
`final-18s.html` e do `mix.mjs`).

Regra que guiou a escrita: **a locução não lê a tela**. O texto na tela já entrega
a mensagem inteira sem som — a voz entra por cima empurrando o argumento e
puxando o ritmo. Isso é obrigatório, não estético: Meta toca em mudo por padrão.

- **38 palavras / 18,6s** (~2 palavras por segundo) — deixa ar pros SFX e pros pops de card.
- 8 falas curtas, nenhuma atravessa um corte.
- Duas âncoras cravadas: "Pronto" cai no confete (5,76s) e "Contador de verdade" entra junto com o claim do fecho (15,47s).

---

## Roteiro (versão A — principal)

| Entra | Fala | Na tela nesse momento | Direção |
|---|---|---|---|
| **0,35** | Você diz o que faz. | Logo + "Abrir CNPJ é assim." Halo coral subindo | Abre seco, sem respiração antes. Ponto final firme. |
| **1,85** | Um contador acha o código mais barato. | Pill "Achei o seu encaixe" + card CNAE 6201-5/02 | Peso em **contador** e em **mais barato**. É o diferencial da peça. |
| — | *(respiro 4,40 → 4,65)* | riser 3,45 · whoosh 4,36 · **CORTE 1** | Silêncio proposital: deixa o whoosh limpo. |
| **5,70** | Pronto. | Confete cai + "CNPJ ativo" pipoca | Cai **em cima** do confete (5,76). Alívio, não comemoração. |
| **5,95** | Sua empresa existe. | H2 "Sua empresa **existe**." | Desacelera. É a virada emocional do filme. |
| **7,35** | E a primeira nota sai aqui. | Card "Sua 1ª nota → Emitir agora" | "aqui" quase junto do clique do toque (7,86). |
| — | *(respiro 9,15 → 9,31)* | whoosh 9,01 · **CORTE 2** | |
| **9,55** | Depois, é no automático: | Slab coral entra + "Alíquota e Fator R vigiados" | Sobe uma nota. Dois-pontos audível — a frase continua. |
| **11,45** | a gente calcula, você só paga. | Toque em "Pagar" (11,26) · Maio ✓ Abril ✓ · barra do teto | **você só paga** é a promessa. Bate seco e para. |
| — | *(respiro 13,70 → 13,97)* | riser 12,75 · whoosh 13,67 · **CORTE 3** | |
| **15,45** | Contador de verdade, no WhatsApp. | Wipe abre, claim aparece (15,47) + dupla 3D | Entra na mesma batida do claim. Tom de conversa, não de anúncio. |
| **17,75** | Legalizai. | Lojas · legalizai.com.br · BH·MG | Assinatura. Um beat de ar antes. Termina em 18,6 — não sobra. |

**Texto corrido (pra cabine):**

> Você diz o que faz. / Um contador acha o código mais barato. //
> Pronto. Sua empresa existe. / E a primeira nota sai aqui. //
> Depois, é no automático: / a gente calcula, você só paga. //
> Contador de verdade, no WhatsApp. / Legalizai.

---

## Direção de locução

- **Voz:** adulta, natural, brasileira, sem sotaque de locutor. Alguém explicando pra um amigo que vai abrir MEI — não narrando comercial de banco.
- **Tom:** confiante e leve. Zero urgência forçada, zero "corre que é por tempo limitado".
- **Ritmo:** rápido nos atos 1 e 3, desacelera no 2 ("Sua empresa existe" é o único momento de pausa), e no 4 volta pro tom de conversa.
- **Pronúncia:** **Legalizai** = *le-ga-li-ZÁI* (tônica no final, com "ai" — não "Legalizei"). Nunca soletrar CNPJ na voz; a tela já mostra.
- **O que evitar:** "descomplica", "sem burocracia", "tudo na palma da mão", "revolucionário". Já estão gastos no setor e a peça se vende no concreto.
- **Gravação:** mono, 48 kHz, 24 bit. Picos em torno de **-6 dBFS**, sem compressão pesada na captação — a mix cuida disso.

---

## Versão B (mais direta, CTA no fim)

Mesmos timecodes. Troca o fecho de assinatura por chamada — usar se a campanha for de lista de espera / pré-cadastro em vez de branding.

| Entra | Fala |
|---|---|
| 0,35 | Abrir empresa começa aqui. |
| 1,85 | Você diz o que faz, o contador acha o resto. |
| 5,70 | Pronto. |
| 5,95 | Sua empresa existe. |
| 7,35 | Nota fiscal, no primeiro dia. |
| 9,55 | Imposto? |
| 10,10 | A gente calcula, você só paga. |
| 15,45 | Contador de verdade, no WhatsApp. |
| 17,60 | Entra na lista: legalizai.com.br. |

A linha final da B é 1,0s mais longa — cabe, mas fica sem folga. Se o locutor
alongar, cortar "Entra na lista" e deixar só o site.

---

## Como entrar na mix (prático)

O `mix.mjs` já entrega `marketing/audio/mix/mix-18s.m4a` (trilha + 18 SFX,
loudnorm -14 LUFS). A locução entra **depois**, num segundo passe, com a música
abaixando embaixo da voz.

**1.** Montar um stem único de locução com **18,621s exatos**, com cada fala já
posicionada no timecode da tabela e silêncio no resto. Salvar em
`marketing/audio/vo/vo-18s.wav` (mono, 48 kHz).

**2.** Mixar com ducking automático:

```powershell
ffmpeg -y -i "..\audio\mix\mix-18s.m4a" -i "..\audio\vo\vo-18s.wav" `
  -filter_complex "[1:a]aresample=48000,asplit=2[vo1][vo2];[0:a][vo1]sidechaincompress=threshold=0.03:ratio=8:attack=5:release=250[bed];[bed][vo2]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.0:LRA=9[out]" `
  -map "[out]" -t 18.621 -ar 48000 -c:a aac -b:a 256k "..\audio\mix\mix-18s-vo.m4a"
```

**3.** Casar com os frames já renderizados (mesmo encode do `pipeline/README.md`,
só trocando a faixa de áudio):

```powershell
ffmpeg -y -framerate 30 -i "frames-18\f%05d.png" -i "..\audio\mix\mix-18s-vo.m4a" `
  -c:v libx264 -pix_fmt yuv420p -crf 19 -preset medium -c:a copy -shortest `
  -movflags +faststart legalizai-18s-v13-vo.mp4
```

Não precisa re-renderizar frame nenhum — a locução é só camada de áudio.

---

## Antes de subir a campanha

- **Legenda queimada é obrigatória.** Meta toca em mudo; sem caption, a locução some. O texto das falas é curto justamente pra caber em legenda de uma linha.
- **Se a trilha mudar**, os timecodes acima morrem junto com os do `mix.mjs` — os dois são hardcoded em segundos sobre 116 BPM.
- **Licença da voz:** se for TTS (ElevenLabs et al.), confirmar que o plano cobre uso comercial em anúncio de marca — mesma ressalva que já está no `audio/README.md` pra trilha.
