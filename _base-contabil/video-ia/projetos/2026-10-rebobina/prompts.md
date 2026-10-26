---
tipo: prompts do projeto (versionados)
projeto: "[[projeto|Rebobina]]"
regra: "nunca apagar versão: v2 entra embaixo da v1 com o que mudou e por quê; o que funcionou leva ✅"
---

# Prompts da Rebobina

Âncoras do P1, iguais em todo prompt (A-011): *navy blue linen shirt with sleeves rolled to mid-forearm · stainless steel watch with black leather strap on the LEFT wrist · thin gold wedding band on the left ring finger · nothing on the right wrist*.

## Etapa 2 · Folhas de referência (Gemini, conversa nova para cada uma)

### REF-P1 · v1
```
Photorealistic character reference sheet of a man's forearms and hands only. No face, no head, no torso above the chest.
He is around 35 years old, Brazilian, light-medium brown skin, short dark arm hair, clean short nails.
He wears a navy blue linen shirt with the sleeves rolled to mid-forearm, a stainless steel watch with a black leather strap on the LEFT wrist, and a thin gold wedding band on the left ring finger. Nothing on the right wrist.
Show 4 views in a clean 2x2 grid on a plain light warm-gray background:
1. both hands typing on a silver laptop keyboard
2. right hand holding a pen, writing on paper
3. right hand holding a smartphone with a plain green screen
4. both hands resting flat on a light wooden table
Soft natural window light, 35mm photograph, realistic skin texture, true-to-life colors.
No text, no logos, no jewelry other than the watch and the ring.
```
Resultado: ❌ fria, sem graça, estranha (Pedro, 25/10). Fundo cinza de estúdio e luz neutra mataram a vida (A-014).

### REF-P1 · v2 (conversa nova) · estilo Luz Coral
O que mudou: sai o fundo cinza, entra a encenação num apartamento real na golden hour; cada quadro é um plano da gramática; a cor das âncoras travada por extenso.
```
Character reference sheet: 4 cinematic frames in a clean 2x2 grid showing the SAME man's forearms and hands only, never his face, inside a warm Brazilian apartment at golden hour.
Identity locks, identical in all 4 frames: around 35 years old, Brazilian, light-medium brown skin, short dark arm hair, clean short nails; navy blue linen shirt with sleeves rolled to mid-forearm; stainless steel watch with a black leather strap on the LEFT wrist; thin gold wedding band on the left ring finger; nothing on the right wrist. The shirt stays true navy blue and the strap true black in every frame despite the warm light.
1. Macro close-up, 85mm: both hands typing on a silver laptop, low sun catching the knuckles with a coral rim light.
2. Macro close-up, 85mm: right hand writing with a pen on paper, dust floating in a warm sunbeam.
3. Over-the-shoulder, 50mm, chest down: right hand holding a smartphone in portrait, the screen solid flat chroma green.
4. Table-height, 35mm: both hands resting relaxed on a light oak table next to a coral ceramic mug.

STYLE "LUZ CORAL": cinematic still from a contemporary Brazilian drama, shot on ARRI Alexa 35 with an anamorphic-look 40mm lens at f/2. Color grade: warm golden-hour split-toning; highlights and skin glow in soft coral and apricot tones (#F47F58, #F5A184), natural warm midtones, shadows in deep ink charcoal-blue (#1B1E24), never pure black. Motivated light only: low warm sun or warm practical lamps as the key light, a gentle coral rim light along edges and hands, soft atmospheric haze catching the light, subtle bloom and halation on bright sources, oval bokeh in the background. Fine organic 35mm film grain, slight vignette. Natural skin texture, real materials. Rich but restrained saturation; exactly one coral object anchors the frame. Avoid: teal-and-orange cliché, HDR look, oversaturation, plastic skin, heavy lens flares, CGI look, any text.
MOOD "HORA DEVOLVIDA": golden hour, low sun streaming through the window, warm coral light dominant, airy and calm, soft contrast.
```
Resultado: ✅ **look aprovado** (Pedro: "ficou bem melhor") · `Gemini_Generated_Image_5oi3pb5oi3pb5oi3` · defeitos de identidade, corrigir por edição (v2.1):
- quadro 2: a mão da aliança (esquerda) está **sem o relógio**;
- quadro 3: aliança numa mão e relógio na outra; **aparecem barba, bochecha e orelha** (fura o "sem rosto");
- quadros 1 e 2: mesa branca/cinza, no 4 é carvalho (não corrigir aqui: a mesa vem do cenário C1);
- geral: sombras leitosas, sem o ink (o "soft contrast" do humor lavou o quadro) → estilo v1.1 + passada de cor.

### REF-P1 · v2.1 (edição) · ❌ não rodar: correção pontual não funciona no Gemini (Pedro, 25/10; A-016)
```
Keep the exact same 4 frames, composition, light, colors and style. Only fix the jewelry and the framing of the man:
- In ALL 4 frames, the stainless steel watch with black leather strap and the thin gold wedding band are BOTH on his LEFT hand and LEFT wrist. His right hand has no ring and no watch.
- Frame 2 (writing): the left hand resting on the paper wears the ring AND the steel watch with black strap on its wrist.
- Frame 3 (phone): the head is completely out of frame: no beard, no cheek, no ear. Only shoulder, arm and hands. Ring and watch on the same left hand.
Change nothing else.
```
Resultado: —

### REF-P1 · v3 (CONVERSA NOVA) · regenerar com as travas no prompt
A v2.1 (edição) não foi rodada: correção pontual no Gemini não funciona (A-016). O que mudou da v2: cada quadro diz QUAL mão faz o quê e onde estão as joias; o quadro 3 troca de ângulo para a cabeça não caber; humor v1.1 (sombra ink).
```
Character reference sheet: 4 cinematic frames in a clean 2x2 grid showing the SAME man's forearms and hands only, inside a warm Brazilian apartment at golden hour, at a light oak wooden table. His head and face never appear in any frame.
Identity locks, identical in all 4 frames: around 35 years old, Brazilian, light-medium brown skin, short dark arm hair, clean short nails; navy blue linen shirt with sleeves rolled to mid-forearm. His LEFT hand always wears BOTH the thin gold wedding band (ring finger) AND the stainless steel watch with black leather strap (left wrist). His RIGHT hand and wrist are always bare: no ring, no watch, no bracelet. The shirt stays true navy blue and the strap true black despite the warm light.
1. Macro close-up, 85mm: both hands typing on a silver laptop; the left hand with the ring and the watch is clearly visible in the foreground; low sun catching the knuckles with a coral rim light.
2. Macro close-up, 85mm: the bare right hand writes with a pen on paper; the left hand rests flat on the paper showing the ring and the watch; dust floating in a warm sunbeam.
3. High angle from behind and above his right shoulder, 50mm, the frame cut at the shoulder line so no head, beard, cheek or ear can appear: his left hand (ring and watch visible) holds a smartphone in portrait, the screen solid flat chroma green; the bare right index finger hovers near the screen.
4. Table-height, 35mm: both hands resting relaxed on the oak table; the left hand with the ring and the watch sits next to a coral ceramic mug.

STYLE "LUZ CORAL": cinematic still from a contemporary Brazilian drama, shot on ARRI Alexa 35 with an anamorphic-look 40mm lens at f/2. Color grade: warm golden-hour split-toning; highlights and skin glow in soft coral and apricot tones (#F47F58, #F5A184), natural warm midtones, shadows in deep ink charcoal-blue (#1B1E24), never pure black. Motivated light only: low warm sun or warm practical lamps as the key light, a gentle coral rim light along edges and hands, soft atmospheric haze catching the light, subtle bloom and halation on bright sources, oval bokeh in the background. Fine organic 35mm film grain, slight vignette. Natural skin texture, real materials. Rich but restrained saturation; exactly one coral object anchors the frame. Avoid: teal-and-orange cliché, HDR look, oversaturation, plastic skin, heavy lens flares, CGI look, any text.
MOOD "HORA DEVOLVIDA": golden hour, low sun streaming through the window, warm coral light dominant, airy and calm; keep deep ink charcoal-blue in the shadows for depth, never a milky or washed-out image.
```
Resultado: ✅ **aprovada** · `Gemini_Generated_Image_25twgo25twgo25tw` · quadros 1, 2 e 4 perfeitos (aliança + relógio só na esquerda, direita nua, mesa de carvalho, sombra com mais ink que a v2). Quadro 3 ainda mostra barba e não mostra a aliança (escondida atrás do celular) → **descartado por recorte**, não por nova geração: a referência oficial é `assets/REF-P1.jpg` (só os quadros 1, 2 e 4). Nota: entraram cortinas coral além do objeto coral; fica, porque dá rebatimento quente, mas no C1 a âncora segue sendo a almofada.

### REF-P2 · v1
```
Photorealistic character reference sheet of a child's hand and forearm only. No face, no body.
The child is about 6 years old, light-medium brown skin, small hand, short nails.
He wears a soft knit sweater in warm coral color (#F2643C), the sleeve slightly long, covering the wrist.
Show 3 views in a row on a plain light warm-gray background:
1. the small hand reaching forward, open
2. the small hand gently pulling an adult man's hand by two fingers (adult wears a navy blue rolled sleeve and a steel watch with black strap)
3. the small hand holding the adult hand, both relaxed
Soft natural light, 35mm photograph, realistic, true-to-life colors. No text, no logos.
```
Resultado: —

## Etapa 3 · Cenário vazio (Gemini)

### C1-19h · v1 (conversa nova)
```
Photorealistic interior of a small apartment dining corner in Belo Horizonte, Brazil, at 7 pm, blue hour. Vertical 9:16 frame.
Camera: fixed, high three-quarter angle looking down at a light oak wooden dining table. The table fills the lower two thirds of the frame; the key area is the center of the frame.
On the table, neatly arranged: an open silver laptop, one small tidy stack of papers, a full white ceramic coffee mug, a pen, a smartphone lying face down.
One wooden chair at the near side of the table with a coral cushion.
Upper third: a large window with a soft blue-hour sky and the first warm city lights of Belo Horizonte's hills; a pendant lamp above the table, switched OFF; a small green plant on the windowsill.
Warm, calm, minimal, lived-in home. Soft natural light from the window.
Shot on 35mm, realistic, subtle film grain, true-to-life colors.
No people, no text, no wall clock, no logos.
```
Resultado: — (substituído pela v2 antes de rodar)

### C1-19h · v2 (conversa nova) · estilo Luz Coral · vira "C1-18h"
O que mudou: blue hour → **golden hour** (em BH o sol se põe por volta das 18h15 no fim de outubro, então a cena é 18h); plano MESA da gramática; sol rasante entrando pela janela; a almofada coral é a âncora do quadro.
```
Interior of a small apartment dining corner in Belo Horizonte, Brazil, at 6 pm, golden hour. Vertical 9:16 frame.
Camera: locked-off, 35mm, high three-quarter angle looking down at a light oak wooden dining table. The table fills the lower two thirds of the frame; the key area is the center of the frame; the upper third stays calm.
On the table, neatly arranged: an open silver laptop, one small tidy stack of papers, a full white ceramic coffee mug with a thin curl of steam, a pen, a smartphone lying face down.
The back of one wooden chair at the bottom edge of the frame, with a coral cushion.
Upper third: a large window; low sun streaming in sideways, long warm shadows of the window frame stretching across the table; the hills of Belo Horizonte glowing outside; a pendant lamp above the table, switched OFF; a small green plant on the windowsill backlit by the sun.
Warm, calm, minimal, lived-in home. No people, no wall clock, no logos.

STYLE "LUZ CORAL": cinematic still from a contemporary Brazilian drama, shot on ARRI Alexa 35 with an anamorphic-look 40mm lens at f/2. Color grade: warm golden-hour split-toning; highlights and skin glow in soft coral and apricot tones (#F47F58, #F5A184), natural warm midtones, shadows in deep ink charcoal-blue (#1B1E24), never pure black. Motivated light only: low warm sun or warm practical lamps as the key light, a gentle coral rim light along edges and hands, soft atmospheric haze catching the light, subtle bloom and halation on bright sources, oval bokeh in the background. Fine organic 35mm film grain, slight vignette. Natural skin texture, real materials. Rich but restrained saturation; exactly one coral object anchors the frame. Avoid: teal-and-orange cliché, HDR look, oversaturation, plastic skin, heavy lens flares, CGI look, any text.
MOOD "HORA DEVOLVIDA": golden hour, low sun streaming through the window, warm coral light dominant, airy and calm; keep deep ink charcoal-blue in the shadows for depth, never a milky or washed-out image.
```
Resultado: ✅ **aprovado de primeira** (Pedro: "bom demais") · `Gemini_Generated_Image_u1wvjzu1wvjzu1wv` → `assets/C1-18h.jpg`. Sol rasante com sombra longa na mesa, morros de BH, névoa, vapor na caneca, parede em ink azul (a sombra ink que faltou na REF v2 veio aqui), luminária apagada, planta em contraluz, almofada coral como âncora, sem relógio. Dois achados que mudam os próximos prompts:
- **O notebook está virado para a ESQUERDA** (para quem senta no banco da lateral), e a cadeira da almofada está vazia, em primeiro plano. → as mãos dele entram **pela borda esquerda**, não por baixo; assim ninguém precisa "sentar" na cadeira da frente (o que colocaria a cabeça dele no quadro) e ela fica vazia, que é a imagem do tempo devolvido.
- O celular está de tela para cima (pedido: para baixo). Não atrapalha: o celular do T2 é outro plano (F3).

> REF-P2 dispensada: a criança não está em nenhuma imagem de início, entra só pela descrição do T3.

### C1-23h · v1 · ⏭️ substituído pela v2 (humor HORA CHATA) antes de rodar
```
Keep the exact same composition, camera angle, furniture and object positions exactly.
Only change the time: it is now 11:45 pm.
- The window shows dark night with distant city lights.
- The pendant lamp above the table is ON, casting warm tungsten light on the table.
- The coffee mug is empty, with a dried coffee ring.
- The table is now covered with many scattered papers, receipts, open folders and yellow sticky notes around the laptop, some papers overlapping the edge.
Do not add people. No text, no clock.
```
Resultado: —

### C1-23h · v2 (CONVERSA NOVA, anexando `assets/C1-18h.jpg`) · humor HORA CHATA
É mudança de ESTADO do cenário, onde o "only change" funciona (A-002); não é correção de detalhe (A-016).
```
Edit the attached image.
Keep the exact same composition, camera angle, furniture, laptop, mug, chair and object positions exactly.
Only change the time: it is now 11:45 pm.
- The window shows dark night: the hills of Belo Horizonte are black silhouettes dotted with small warm city lights; no sun, no sunbeams, no long sun shadows anymore.
- The pendant lamp above the table is ON, casting a single warm tungsten pool of light on the table; everything outside it falls into deep ink-blue shadow.
- The coffee mug is empty, no steam, with a dried coffee ring.
- The table is now covered with many scattered papers, receipts, open folders and yellow sticky notes around the laptop, some papers overlapping the edge.
- The laptop screen glows softly.
Do not add people. No text, no clock.
MOOD "HORA CHATA": night, a single warm tungsten pool of light on the table from the lamp; everything outside it falls into deep ink-blue shadow; higher contrast, slightly claustrophobic; the coral glow is confined to the lamp.
```
Resultado: ✅ **aprovado de primeira** (Pedro: "bem demais") · `Gemini_Generated_Image_4d0h5c4d0h5c4d0h` → `assets/C1-23h.jpg`. Notebook, caneca, caneta, celular, cadeira e planta no MESMO lugar do C1-18h (conferido por sobreposição de bordas), janela com BH à noite e o reflexo da luminária no vidro, papel, recibos, post-its e bolinhas de papel amassado. Diferença pequena: a tela do notebook ficou apagada (pedido: acesa) e a poça de luz é mais aberta que o pedido; os dois ficam, porque o F2 e a passada de cor resolvem.

## Etapa 4 · Quadros de início (Gemini, anexando o cenário + REF-P1)

### F1 · v1 (anexar C1-19h + REF-P1)
```
Using the second image as the reference for the man's forearms and hands (navy blue linen shirt with rolled sleeves, stainless steel watch with black leather strap on the LEFT wrist, thin gold wedding band), add his two forearms and hands entering from the bottom edge of the first image, typing on the laptop.
Keep everything else in the first image exactly the same: composition, camera angle, light, objects.
Only forearms and hands are visible. No face, no head.
```
Resultado: —

### F1 · v2 (conversa nova; anexar `assets/C1-18h.jpg` + `assets/REF-P1.jpg`) · mãos pela ESQUERDA
O que mudou: as mãos entram pela borda esquerda (o notebook está virado para lá); cada mão com o seu lado (A-015); a cadeira da almofada fica vazia.
```
Using the second image as the reference for the man's forearms and hands, add his two forearms and hands to the first image, entering from the LEFT edge of the frame, typing on the laptop, as if he sits on the left side of the table just out of frame.
His LEFT hand wears both the thin gold wedding band and the stainless steel watch with black leather strap; his RIGHT hand and wrist are bare. Navy blue linen shirt, sleeves rolled to mid-forearm, true navy color.
The golden sunlight from the window falls across his forearms with a soft coral rim light on the edges.
Keep everything else in the first image exactly the same: composition, camera angle, light, objects. The chair with the coral cushion in the foreground stays empty.
Only forearms and hands are visible: no head, no face, no shoulders.
```
Resultado: ❌ `Gemini_Generated_Image_pgk9kfpgk9kfpgk9` · cenário intacto (alinhado 0,0) e joias certas, mas os braços entram de lado, flutuando, digitando um notebook que **está virado para a câmera/cadeira**, não para a esquerda. **Erro meu de leitura do C1-18h** (Pedro pegou: "os braços estão de um lado mas os elementos mantiveram a mesma posição"). A tela do notebook olha para a cadeira da almofada: quem digita SENTA NELA (A-019).
Se falhar (mexer no cenário ou na mão): conversa nova, mesmas imagens, e pedir a cena INTEIRA de novo descrevendo o C1 + as mãos, em vez de "add" (A-016).

### F1 · v3 (conversa nova; anexar 1º `assets/C1-18h.jpg`, 2º `assets/REF-P1.jpg`) · ele SENTADO NA CADEIRA, de costas
O que mudou: ele senta na cadeira da almofada, de frente para o notebook; a câmera fica onde está, atrás e acima dele; em primeiro plano só costas, ombros e nuca, desfocados. Rosto impossível pelo ângulo (A-015).
```
Using the second image as the reference for the man's forearms and hands, place the man in the first image, sitting on the wooden chair with the coral cushion in the foreground, facing the table and the laptop.
The camera stays exactly where it is, behind and above him. In the foreground at the bottom of the frame we see only his back, his shoulders in the navy blue linen shirt and the back of his head with short dark hair, softly out of focus. His face is never visible.
His forearms rest on the table edge and both hands type on the laptop keyboard. His LEFT hand wears both the thin gold wedding band and the stainless steel watch with black leather strap; his RIGHT hand and wrist are bare. Sleeves rolled to mid-forearm, true navy blue.
The golden sunlight from the window falls on his hands and outlines his shoulders and hair with a soft coral rim light.
Keep everything else in the first image exactly the same: composition, camera angle, light, the laptop, mug, papers, pen, phone and all positions. Only add the man.
```
Resultado: 🟡 `Gemini_Generated_Image_x011uex011uex011` · melhorou (sentado de costas, nuca e luz lindas, relógio à esquerda), mas o notebook continua de lado, à esquerda dele, e ele digita torto (Pedro: "não parece natural"). Raiz: o "keep everything exactly the same" prende o notebook onde estava no cenário vazio, e lá ele não estava na frente de ninguém. A cabeça dele também cobre o centro da mesa (some a pilha de papel).

### F1 · v4 (conversa nova; anexar 1º `assets/C1-18h.jpg`, 2º `assets/REF-P1.jpg`) · cena INTEIRA nova, com ele dentro
O que mudou (A-020): não se "adiciona" gente num cenário vazio que não foi pensado para ela. O cenário vazio vira só **referência de sala, luz e estilo**, e a cena nasce com o homem e o notebook **na frente dele**. Câmera por trás e um pouco à direita: a cabeça e o ombro ficam no canto de baixo à esquerda e a mesa respira à direita.
```
Create a new image. Use the first image as the reference for the room, the window, the light, the colors and the style. Use the second image as the reference for the man's forearms and hands.
Same dining corner in Belo Horizonte at 6 pm, golden hour: the same light oak table, the window with the glowing hills, the pendant lamp switched off, the backlit plant, a white mug with a thin curl of steam, a small tidy stack of papers, a pen and a phone on the table.
The man sits at the table on the wooden chair with the coral cushion, facing the window. The silver laptop is open on the table directly in front of him, centered on his body, its screen facing him; his hands rest naturally on its keyboard, typing.
Camera: locked-off, 35mm, vertical 9:16, high angle from behind him and slightly to his right. His right shoulder, part of his back in the navy blue linen shirt and the back of his head with short dark hair fill the lower left of the frame, softly out of focus. We look past his right shoulder at his hands on the keyboard, the mug and the papers. His face is never visible, not even in profile.
His LEFT hand wears both the thin gold wedding band and the stainless steel watch with black leather strap; his RIGHT hand and wrist are bare. Sleeves rolled to mid-forearm, true navy blue. The coral cushion stays visible on the chair.
The low sun from the window outlines his hair and shoulder with a soft coral rim light and falls across his hands. No text, no wall clock, no logos.

STYLE "LUZ CORAL": cinematic still from a contemporary Brazilian drama, shot on ARRI Alexa 35 with an anamorphic-look 40mm lens at f/2. Color grade: warm golden-hour split-toning; highlights and skin glow in soft coral and apricot tones (#F47F58, #F5A184), natural warm midtones, shadows in deep ink charcoal-blue (#1B1E24), never pure black. Motivated light only: low warm sun or warm practical lamps as the key light, a gentle coral rim light along edges and hands, soft atmospheric haze catching the light, subtle bloom and halation on bright sources, oval bokeh in the background. Fine organic 35mm film grain, slight vignette. Natural skin texture, real materials. Rich but restrained saturation; exactly one coral object anchors the frame. Avoid: teal-and-orange cliché, HDR look, oversaturation, plastic skin, heavy lens flares, CGI look, any text.
MOOD "HORA DEVOLVIDA": golden hour, low sun streaming through the window, warm coral light dominant, airy and calm; keep deep ink charcoal-blue in the shadows for depth, never a milky or washed-out image.
```
Resultado: ❌ (Pedro, 25/10) ele fora da cadeira, os objetos para um lado e ele para o outro. 3ª falha seguida de composição. Raiz (A-021): (1) o C1-18h anexado impõe o layout antigo (notebook à esquerda, cadeira no centro) e briga com o pedido; (2) posição dada em coordenada da IMAGEM ("lower left", "slightly to his right") é o que o Gemini mais erra.

### F1 · v5 (conversa nova; anexar SÓ `assets/REF-P1.jpg`) · simétrico, tudo amarrado NELE
O que mudou (A-021): sai o cenário anexado (só texto descreve a sala); composição simétrica, câmera exatamente atrás dele; cada objeto é posicionado em relação ao CORPO dele ("in front of him", "to his right"), nunca em coordenada da imagem; a frase de composição vem primeiro. A almofada coral fica no assento, escondida por ele: aparece quando ele levanta no T3. A âncora coral visível passa a ser a caneca (igual à REF).
```
A man seated on a wooden chair at a light oak dining table, seen from directly behind, perfectly centered and symmetrical, high angle, vertical 9:16, locked-off 35mm camera.
He sits fully on the chair, his back straight against it, facing the window. His back, his shoulders in a navy blue linen shirt and the back of his head with short dark hair fill the bottom third of the frame, softly out of focus. His face is never visible.
Directly in front of him on the table: an open silver laptop facing him, and his two hands typing on its keyboard, elbows slightly out to the sides. To his right on the table: a coral ceramic mug with a thin curl of steam, a pen and a phone. To his left on the table: a small tidy stack of papers.
Beyond the table: a large window at 6 pm golden hour with the hills of Belo Horizonte glowing, a pendant lamp switched off hanging above the table, a small plant backlit on the windowsill, deep ink-blue walls.
Use the attached image as the reference for his forearms and hands: his LEFT hand wears the thin gold wedding band and the stainless steel watch with black leather strap; his RIGHT hand is bare.
The low sun outlines his hair and shoulders with a soft coral rim light. No text, no wall clock, no logos.

STYLE "LUZ CORAL": cinematic still from a contemporary Brazilian drama, shot on ARRI Alexa 35 with an anamorphic-look 40mm lens at f/2. Color grade: warm golden-hour split-toning; highlights and skin glow in soft coral and apricot tones (#F47F58, #F5A184), natural warm midtones, shadows in deep ink charcoal-blue (#1B1E24), never pure black. Motivated light only: low warm sun or warm practical lamps as the key light, a gentle coral rim light along edges and hands, soft atmospheric haze catching the light, subtle bloom and halation on bright sources, oval bokeh in the background. Fine organic 35mm film grain, slight vignette. Natural skin texture, real materials. Rich but restrained saturation; exactly one coral object anchors the frame. Avoid: teal-and-orange cliché, HDR look, oversaturation, plastic skin, heavy lens flares, CGI look, any text.
MOOD "HORA DEVOLVIDA": golden hour, low sun streaming through the window, warm coral light dominant, airy and calm; keep deep ink charcoal-blue in the shadows for depth, never a milky or washed-out image.
```
Resultado: ✅ **aprovado** (Pedro: "agora sim, mais interessante") · `Gemini_Generated_Image_grpzkngrpzkngrpz` → `assets/F1.jpg`. Sentado na cadeira, centrado, notebook na frente dele, caneca coral com vapor e celular à direita dele, papéis à esquerda, janela dourada com BH, luminária apagada, parede ink, contraluz no cabelo, relógio no pulso esquerdo. A cabeça cobre a tela (bom: nada de interface para inventar). A aliança não aparece: fica para o T2. A simetria + posição amarrada ao corpo resolveu de primeira (A-021 validado).

### F2 · v4 (conversa nova; anexar SÓ `assets/F1.jpg`) · edição de ESTADO do F1 (A-018)
O F2 sai do F1, não do C1-23h: assim homem, mesa e notebook ficam no mesmo lugar e o time-lapse emenda.
```
Edit the attached image.
Keep the exact same composition, camera angle, the man, his position on the chair, the laptop, mug, chair and all object positions exactly.
Only change the time: it is now 11:45 pm, and he is tired.
- The window shows dark night: the hills of Belo Horizonte are black silhouettes dotted with small warm city lights; no sun, no sunbeams.
- The pendant lamp above the table is ON, casting a single warm tungsten pool of light on the table; everything outside it falls into deep ink-blue shadow.
- The coral mug is empty, no steam.
- The table is covered with many scattered papers, receipts, open folders and yellow sticky notes on both sides of the laptop.
- His shoulders are slightly slumped; his bare right hand rubs the back of his neck while his left hand, with the ring and the watch, stays on the keyboard. His face is still never visible.
No text, no clock.
MOOD "HORA CHATA": night, a single warm tungsten pool of light on the table from the lamp; everything outside it falls into deep ink-blue shadow; higher contrast, slightly claustrophobic; the coral glow is confined to the lamp.
```
Resultado: ✅ **aprovado com 1 retoque** (Pedro: "gostei") · `Gemini_Generated_Image_sd74shsd74shsd74` → `assets/F2-bruto.jpg`. Mesa, cadeira, homem e notebook alinhados ao F1 (0,0 por bordas; a janela não mede porque o conteúdo mudou de dia para noite, mas a moldura está no mesmo lugar). Noite com BH, reflexo da luminária no vidro, poça de luz, papelada, recibos, post-it até na tela, caneca coral vazia, a mão na nuca contando o cansaço. ⚠️ **A aliança foi para a mão DIREITA** (a da nuca): retirar no Photoshop com a ferramenta Remover (A-004: o que o Gemini não corrige, o Photoshop corrige) e salvar como `assets/F2.jpg`.

### F2 · v1 (anexar C1-23h + REF-P1)
```
Using the second image as the reference for the man's forearms and hands (navy blue linen shirt with rolled sleeves, stainless steel watch with black leather strap on the LEFT wrist, thin gold wedding band), add his two forearms and hands entering from the bottom edge of the first image, in the same position as someone working at the laptop: the right hand holding a pen over the scattered papers, the left hand pressing flat and tense on a pile of receipts.
Keep everything else in the first image exactly the same: composition, camera angle, light, objects.
Only forearms and hands are visible. No face, no head.
```
Resultado: —

### F2 · v2 · ⏭️ substituído pela v3 antes de rodar (mesmo erro do F1 v2)
```
Using the second image as the reference for the man's forearms and hands, add his two forearms and hands to the first image, entering from the LEFT edge of the frame, at the laptop, as if he sits on the left side of the table just out of frame: his bare RIGHT hand holds a pen over the scattered papers; his LEFT hand, wearing the thin gold wedding band and the stainless steel watch with black leather strap, presses flat and tense on a pile of receipts. Navy blue linen shirt, sleeves rolled to mid-forearm, true navy color.
The warm lamp light catches the hands; the rest of the room stays in deep ink-blue shadow.
Keep everything else in the first image exactly the same: composition, camera angle, light, objects. The chair with the coral cushion in the foreground stays empty.
Only forearms and hands are visible: no head, no face, no shoulders.
```
Resultado: —

### F2 · v3 · ⏭️ substituído pela v4 (o F2 agora sai do F1 por edição de estado)
O F1 vencedor entra como referência do homem (costas, nuca, mãos) para ele ser o MESMO nos dois quadros do T1.
```
Place the same man from the second image, in the same position on the chair with the coral cushion, into the first image: seen from behind, only his back, navy blue shirt, shoulders and the back of his head with short dark hair in the foreground, softly out of focus, face never visible.
Now it is late at night and he is tired: his shoulders are slightly slumped; his bare RIGHT hand holds a pen over the scattered papers; his LEFT hand, with the thin gold wedding band and the steel watch with black strap, presses flat on a pile of receipts.
The warm lamp light falls on his hands and the top of his head; the rest stays in deep ink-blue shadow.
Keep everything else in the first image exactly the same: composition, camera angle, light, all objects and positions. Only add the man.
```
Resultado: —

### F3 · v1 · ⏭️ substituído pela v2 (mesa e luz vêm do F2)
```
Photorealistic close-up, vertical 9:16, high angle looking down.
The man's right hand (use the reference: navy blue linen rolled sleeve; his left wrist with the steel watch and black strap is partly visible at the bottom resting on the papers) holds a smartphone in portrait orientation, raised slightly above a messy table full of scattered papers and receipts, at night under warm tungsten lamp light (use the first image for the table and light).
The phone screen is solid pure chroma green (#00FF00), completely flat and evenly lit, no reflections, no icons, no glare. His thumb hovers just above the lower center of the screen.
Background: the papers softly out of focus.
Shot on 35mm, realistic. No text, no face.
```
Resultado: —

### F3 · v2 (conversa nova; anexar 1º `assets/F2-bruto.jpg`, 2º `assets/REF-P1.jpg`) · close do celular, plano MÃO
O que mudou da v1: a mesa, a luz e a caneca coral vêm do F2 (é a mesma noite); composição simples e amarrada à mão (A-021); o estilo com humor HORA CHATA. A mão que segura é a ESQUERDA (aliança e relógio aparecem juntos) e o polegar dela é que vai tocar no T2.
```
Create a new image: a macro close-up, vertical 9:16, high angle looking straight down at a messy wooden table at night, the same table, papers, receipts, yellow sticky notes and coral mug as in the first image.
In the center of the frame, the man's LEFT hand holds a smartphone in portrait orientation, raised slightly above the papers. Use the second image as the reference for his hand: the thin gold wedding band on the ring finger and the stainless steel watch with black leather strap on the wrist are both clearly visible; navy blue linen sleeve rolled to mid-forearm. His thumb hovers just above the lower center of the screen. No other hand in the frame.
The phone screen is solid pure chroma green (#00FF00), completely flat and evenly lit, no reflections, no icons, no glare.
The papers around are softly out of focus; the coral mug blurred at the edge of the frame. No face, no text.
Cinematic still from a contemporary Brazilian drama, ARRI Alexa 35, 85mm macro lens at f/1.8. Warm tungsten lamp light from above falls on the hand with a soft coral rim along the fingers; everything outside the pool of light falls into deep ink charcoal-blue shadow (#1B1E24), never pure black. Fine organic 35mm film grain, slight vignette, natural skin texture. Avoid: HDR look, oversaturation, plastic skin, CGI look.
MOOD "HORA CHATA": night, a single warm tungsten pool of light; higher contrast, slightly claustrophobic.
```
Resultado: ❌ `Gemini_Generated_Image_1qdz2j1qdz2j1qdz` · luz, papelada, caneca coral e o verde chapado ótimos, mas **o notebook sumiu** (Pedro: o fundo do celular deveria ser o notebook): o celular ocupa o lugar dele, e o corte F2 → F3 perde a continuidade. E a aliança foi para o **indicador** (deveria ser o anelar). Raiz: o prompt falava da mesa e da caneca e calou o notebook (A-022).

### F3 · v3 (conversa nova; anexar 1º `assets/F2-bruto.jpg`, 2º `assets/REF-P1.jpg`) · ponto de vista dele, notebook atrás do celular
```
Create a new image: his point of view at night, looking down from where he sits at the table in the first image. Vertical 9:16.
Behind the phone, directly in front of him, the open silver laptop from the first image fills the upper half of the frame: its keyboard and the lower part of its glowing screen, with a yellow sticky note on the screen edge, softly out of focus. Scattered papers and receipts on both sides of the laptop; the coral mug at the right edge of the frame, blurred.
In the center of the frame, his LEFT hand holds a smartphone in portrait orientation between his eyes and the laptop, his left forearm entering from the bottom left in a navy blue rolled sleeve. His left thumb rests on the left side of the phone and hovers over the lower center of the screen; his other four fingers wrap the right edge of the phone. The thin gold wedding band is on his RING finger (the fourth finger), visible on the right edge of the phone; the stainless steel watch with black leather strap is on his left wrist. Use the second image as the reference for the hand. No other hand in the frame.
The phone screen is solid pure chroma green (#00FF00), completely flat and evenly lit, no reflections, no icons, no glare. No face, no text.
Cinematic still from a contemporary Brazilian drama, ARRI Alexa 35, 50mm lens at f/2, focus on the phone and the hand. Warm tungsten lamp light from above falls on the hand with a soft coral rim along the fingers; the laptop screen adds a faint cool glow; everything outside the pool of light falls into deep ink charcoal-blue shadow (#1B1E24), never pure black. Fine organic 35mm film grain, slight vignette, natural skin texture. Avoid: HDR look, oversaturation, plastic skin, CGI look.
MOOD "HORA CHATA": night, a single warm tungsten pool of light; higher contrast, slightly claustrophobic.
```
Resultado: ✅ **aprovado** (Pedro: "curti") · `Gemini_Generated_Image_9f9d489f9d489f9d` → `assets/F3.jpg`. Notebook atrás com os post-its na tela (continuidade com o F2), papelada, caneca coral à direita, verde chapado, relógio no pulso esquerdo; plano por cima do ombro esquerdo, com a nuca desfocada à direita (dá realismo). A aliança não aparece (dedos atrás do celular): aceito, o relógio identifica. Luz menos coral que o F1/F2: a passada de cor unifica.

## Etapa 6 · Takes (Flow, modo Agente, uma sessão por take)

### T1 plano A · v2 (Fast) · anexar 1º `assets/F1.jpg` (FIRST), 2º `assets/F2.jpg` (LAST)
O que mudou da v1: 18h (não 19h); a cena é a do F1/F2 (ele de costas, centrado); o estilo de vídeo; o fim termina no gesto do F2 (mão na nuca).
```
Generate a video with Veo 3.1, vertical 9:16, 8 seconds, using the first attached image as the FIRST FRAME and the second attached image as the LAST FRAME. Do not create new images.
Static locked-off camera, no camera movement at all.
Time-lapse of an evening passing from 6 pm to 11:45 pm: the golden sunlight fades, the window sky turns to dusk and then to night with the city lights of Belo Horizonte appearing, the pendant lamp switches on, papers, receipts and sticky notes progressively pile up on both sides of the laptop, the steam disappears and the coral mug empties.
The man, seen only from behind, stays seated on the same chair the whole time, typing in fast motion; small natural fast-motion movements of his head and shoulders; at the very end his shoulders slump and his right hand goes to the back of his neck. His face is never visible.
Cinematic 24 fps with natural 180-degree shutter motion blur. Keep the exact color grade, light and haze of the first frame for the whole video: no color shifts, no exposure jumps.
Realistic. No text. No added sound effects.
```
Resultado: 🟡 `Man_working_at_laptop_evening_1080p_20261025194116` → `takes/T1-A-v2-fast.mp4` (quadros em `takes/T1-A-v2-fast-quadros.jpg`, 4 por segundo). **O método funcionou** (A-012 validado): câmera travada (mesa parada medida por script), o dia vira noite sem pulo, as luzes de BH acendem, a luminária liga, a papelada cresce, o vapor some e termina no F2. Três defeitos:
- **2,0 s: ele vira a cabeça e aparece o perfil** (nariz e bochecha). Fura o "sem rosto" e, no rebobinar, vira um flash de rosto.
- **1,0 a 2,0 s: ele se inclina e "cresce"**, os ombros abrem e quase levanta. Parece pulo de escala.
- **6,5 a 7,3 s: as DUAS mãos vão à nuca**, depois fica uma. Pedido: só a direita.
- (não é defeito) **2,25 a 2,5 s: papéis voando** para a mesa: no rebobinar eles voltam voando, fica ótimo. Manter.
Trecho limpo, se nada melhorar: 3,0 a 8,0 s.

### T1 plano A · v3 (Fast) · anexar 1º `assets/F1.jpg` (FIRST), 2º `assets/F2.jpg` (LAST)
O que mudou: trava de cabeça e de postura escrita, uma mão só na nuca, e os papéis voando assumidos. O plano B fica de reserva: o A já provou que segura câmera e luz.
```
Generate a video with Veo 3.1, vertical 9:16, 8 seconds, using the first attached image as the FIRST FRAME and the second attached image as the LAST FRAME. Do not create new images.
Static locked-off camera, no camera movement at all.
Time-lapse of an evening passing from 6 pm to 11:45 pm: the golden sunlight fades, the window sky turns to dusk and then to night with the city lights of Belo Horizonte appearing, the pendant lamp switches on, new papers, receipts and sticky notes keep landing on the table and pile up on both sides of the laptop, the steam disappears and the coral mug empties.
The man, seen only from behind, stays seated on the same chair the whole time, typing in fast motion. His head always faces the laptop and never turns to the side: his face and profile are never visible. His posture and size stay the same: he never stands up, never leans forward, never gets closer to the camera. In the last second only his right hand goes to the back of his neck while his left hand stays on the keyboard.
Cinematic 24 fps with natural 180-degree shutter motion blur. Keep the exact color grade, light and haze of the first frame for the whole video: no color shifts, no exposure jumps.
Realistic. No text. No added sound effects.
```
Resultado: —

### T1 plano B · v2 (Fast) · anexar só `assets/F1.jpg`
```
Generate a video with Veo 3.1, vertical 9:16, 8 seconds, using the attached image as the FIRST FRAME. Do not create a new image.
Static locked-off camera, no camera movement at all.
Time-lapse of an evening passing from 6 pm to 11:45 pm: the golden sunlight fades, the window sky turns to dusk and then to dark night with the city lights of Belo Horizonte appearing, the pendant lamp above the table switches on with a warm tungsten pool of light while the room falls into deep ink-blue shadow, papers, receipts, open folders and yellow sticky notes progressively pile up on both sides of the laptop, the steam disappears and the coral mug empties.
The man, seen only from behind, stays seated on the same chair the whole time, typing in fast motion; his navy blue shirt and short dark hair stay exactly the same; at the very end his shoulders slump and his right hand goes to the back of his neck. His face is never visible.
Cinematic 24 fps with natural 180-degree shutter motion blur. Keep the exact color grade, light and haze of the first frame for the whole video: no color shifts, no exposure jumps.
Realistic. No text. No added sound effects.
```
Resultado: —

### T1 plano A · v1 · ⏭️ substituído pela v2
```
Generate a video with Veo 3.1, vertical 9:16, 8 seconds, using the first attached image as the FIRST FRAME and the second attached image as the LAST FRAME. Do not create new images.
Static locked-off camera, no camera movement at all.
Time-lapse of an evening passing from 7 pm to 11:45 pm: the window sky darkens from blue hour to night, the pendant lamp switches on, papers progressively pile up and spread across the table, the coffee in the mug goes down until it is empty.
The man's forearms and hands keep working continuously in fast motion: typing, shuffling papers, writing. Only forearms and hands visible, no face.
Realistic, natural. No text. No added sound effects.
```
Resultado: —

### T1 plano B · v1 · ⏭️ substituído pela v2
```
Generate a video with Veo 3.1, vertical 9:16, 8 seconds, using the attached image as the FIRST FRAME. Do not create a new image.
Static locked-off camera, no camera movement at all.
Time-lapse of an evening passing from 7 pm to 11:45 pm: the window sky darkens from blue hour to dark night, the pendant lamp above the table switches on with warm light, papers, receipts, open folders and yellow sticky notes progressively pile up and spread across the table, the coffee in the mug goes down until it is empty.
The man's forearms and hands keep working continuously in fast motion: typing, shuffling papers, writing. His shirt, watch and ring stay exactly the same. Only forearms and hands visible, no face.
Realistic, natural. No text. No added sound effects.
```
Resultado: —

### T2 · v2 (Quality) · anexar `assets/F3.jpg`
O que mudou: a cena do F3 (ponto de vista por cima do ombro, notebook atrás); a nuca em primeiro plano fica parada; a mão é a ESQUERDA; o estilo de vídeo.
```
Generate a video with Veo 3.1, vertical 9:16, 8 seconds, using the attached image as the FIRST FRAME. Do not create a new image.
Real-time, natural speed. Nearly static camera, only a very subtle natural handheld micro-movement.
Second 0 to 2: his left hand holds the phone still.
Second 2 to 3: his left thumb taps the lower center of the screen once, calmly.
Second 3 to 6: he slowly lowers the phone and lays it face down on the table in front of the laptop.
Second 6 to 8: his hand rests on top of the phone and relaxes, fingers loosening; a small exhale moves his shoulder.
The screen stays solid flat chroma green the whole time it is visible. The back of his head in the foreground stays still and out of focus and never turns: his face is never visible. The laptop, papers and coral mug do not move. No text.
Cinematic 24 fps with natural 180-degree shutter motion blur. Keep the exact color grade, light and haze of the first frame for the whole video: no color shifts, no exposure jumps.
```
Resultado: —

### T2 · v1 · ⏭️ substituído pela v2
```
Generate a video with Veo 3.1, vertical 9:16, 8 seconds, using the attached image as the FIRST FRAME. Do not create a new image.
Real-time, natural speed. Nearly static camera, only a very subtle natural handheld micro-movement.
Second 0 to 2: the hand holds the phone still.
Second 2 to 3: his thumb taps the lower center of the screen once, calmly.
Second 3 to 6: he slowly lowers the phone and lays it face down on the papers.
Second 6 to 8: his hand rests on top of the phone and relaxes, fingers loosening.
The screen stays solid flat chroma green the whole time it is visible. Nothing else moves. No face. No text.
```
Resultado: —

### T3 · v1 (Quality) · anexar F1
```
Generate a video with Veo 3.1, vertical 9:16, 8 seconds, using the attached image as the FIRST FRAME. Do not create a new image.
Static locked-off camera, identical framing for the whole video. Real-time, natural speed. The light stays at blue hour, the lamp stays off.
Second 0 to 2: the man's hands keep typing on the laptop.
Second 2 to 4: a small child's hand and forearm, wearing a soft coral knit sweater sleeve, enters from the right side of the frame and gently pulls the man's bare right hand by two fingers.
Second 4 to 6: he stops typing, closes the laptop lid halfway with his left hand, and holds the child's hand.
Second 6 to 8: he stands up from the chair and walks out of the frame to the right with the child, always with his back to the camera, his face never visible. The chair with the coral cushion is left empty, slightly pulled back. The calm table remains, laptop half closed, golden light on the empty chair.
The man is seen only from behind; no faces at any moment. Realistic. No text.
```
Resultado: —
