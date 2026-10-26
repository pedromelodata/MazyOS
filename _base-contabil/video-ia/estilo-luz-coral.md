---
tipo: estilo visual (motor de vídeo por IA)
data: 2026-10-25
status: v1.1, look aprovado na REF-P1 v2 (25/10)
fontes: "[[paleta-cores]] (coral-300/400/500, ink-800/900) · pedido do Pedro 25/10: tonalidade golden hour com o coral e o dark, cinematográfico, valendo para imagem E vídeo"
---

# Estilo "Luz Coral"

**A ideia:** todo quadro da Legalizaí parece tirado do **mesmo filme**: luz de fim de tarde, altas luzes em coral, sombras em ink (nunca preto puro). É a paleta da marca virando **luz**, não cor pintada. Vale para imagem, vídeo e para a passada final de cor.

## 1 · As 6 camadas do estilo

| Camada | Regra | Por quê |
|---|---|---|
| **Cor (grade)** | split-tone: altas luzes e pele em **coral e damasco** (`#F47F58`, `#F5A184`), meios-tons quentes e naturais, sombras em **ink azul-carvão** (`#1B1E24`, `#24262C`), nunca preto | o gradiente coral → dark da marca, aplicado como luz |
| **Luz** | só **luz motivada**: sol baixo pela janela ou abajur quente como luz principal; **contraluz coral** contornando mão, borda e objeto; névoa leve no ar pegando a luz; brilho suave (bloom/halation) nas fontes | dá vida e profundidade sem parecer efeito |
| **Lente e textura** | cinema digital (ARRI Alexa 35) com lente de look anamórfico 40 mm, f/2; desfoque com bokeh oval; grão fino de filme 35 mm; vinheta leve | o "cinematic" que pede, sem filtro de app |
| **Âncora coral** | **um** objeto coral por quadro (almofada, suéter, caneca, capa de caderno) | a marca no quadro sem logo |
| **Composição** | ação no miolo (recorte 4:5); **terço de cima calmo** para o texto; muito espaço negativo | as regras do motor + lettering |
| **Saturação** | rica mas contida | coral demais vira laranja de propaganda |

## 2 · Dois humores, mesmo filme

O grade é sempre o mesmo; muda o **equilíbrio** entre o coral e o ink. É o próprio mote em luz: o que aperta é ink, o que devolve é coral.

| Humor | Quando | Como |
|---|---|---|
| ☀️ **Hora devolvida** | o tempo livre, a família, o "100% humana", o fecho | golden hour, sol baixo entrando pela janela, coral dominante, ar leve, contraste suave |
| 🌙 **Hora chata** | a papelada, a pressão, a noite | noite, **uma poça de luz quente** de abajur sobre a mesa, o resto cai em sombra ink azul, contraste maior, quadro mais fechado; o coral fica preso na luminária |

## 3 · A gramática de câmera (4 planos, nada fora deles)

| Plano | Lente | Uso | Movimento |
|---|---|---|---|
| **MESA** | 35 mm, 3/4 de cima | estado, passagem de tempo, emendas | **travado** |
| **MÃO** | 85 mm macro, f/1.8 | o gesto (toque, caneta, mão que puxa) | quase parado, respiração de câmera na mão |
| **OMBRO** | 50 mm, sobre o ombro, do peito para baixo | o ponto de vista dele, sem rosto | aproximação lenta (5 a 10%) |
| **ENTRADA** | 35 mm, na altura da mesa | a mão de alguém entrando no quadro, o momento humano | travado ou deslize lateral lento |

⛔ Sem: drone, pan rápido, zoom, câmera girando, close de rosto.

## 4 · Os blocos prontos (colar no fim de todo prompt)

**BLOCO ESTILO (imagem e vídeo):**
```
STYLE "LUZ CORAL": cinematic still from a contemporary Brazilian drama, shot on ARRI Alexa 35 with an anamorphic-look 40mm lens at f/2. Color grade: warm golden-hour split-toning; highlights and skin glow in soft coral and apricot tones (#F47F58, #F5A184), natural warm midtones, shadows in deep ink charcoal-blue (#1B1E24), never pure black. Motivated light only: low warm sun or warm practical lamps as the key light, a gentle coral rim light along edges and hands, soft atmospheric haze catching the light, subtle bloom and halation on bright sources, oval bokeh in the background. Fine organic 35mm film grain, slight vignette. Natural skin texture, real materials. Rich but restrained saturation; exactly one coral object anchors the frame. Avoid: teal-and-orange cliché, HDR look, oversaturation, plastic skin, heavy lens flares, CGI look, any text.
```

**HUMOR (escolher um):**
```
MOOD "HORA DEVOLVIDA": golden hour, low sun streaming through the window, warm coral light dominant, airy and calm; keep deep ink charcoal-blue in the shadows for depth, never a milky or washed-out image.
```
> v1.1 (25/10): o "soft contrast" da v1 deixou a REF-P1 v2 leitosa; trocado por sombra ink obrigatória (A-015).
```
MOOD "HORA CHATA": night, a single warm tungsten pool of light on the table from the lamp; everything outside it falls into deep ink-blue shadow; higher contrast, slightly claustrophobic; the coral glow is confined to the lamp.
```

**SÓ NO VÍDEO (Veo), além dos dois acima:**
```
Cinematic 24 fps with natural 180-degree shutter motion blur. Keep the exact color grade, light and haze of the first frame for the whole video: no color shifts, no exposure jumps.
```

## 5 · Onde o estilo NÃO entra

- ~~Folhas de referência em luz neutra~~ **revogado no mesmo dia (Pedro, 25/10):** a REF-P1 v1, em fundo cinza de estúdio, saiu *"fria, sem graça, estranha"*. Referência sem vida contamina tudo o que nasce dela (A-014). **A referência entra no estilo, no humor "hora devolvida"**, encenada num lugar real (não grade em fundo cinza), com uma trava: a cor real das âncoras é dita por extenso ("the shirt stays true navy blue") para o grade não mudá-la.
- **Tela verde:** o verde segue puro e chapado, sem grade (senão o recorte falha).

## 6 · A passada final de cor (a IA desvia, a edição unifica)

Mesmo com o bloco, cada imagem e cada take sai um pouco diferente. Por isso a última camada é **sempre** a mesma receita:
- **Photoshop (estáticos e quadros de início):** Mapa de gradiente `#1B1E24` → `#8C2F16` → `#F5A184`, mesclagem **Luz suave**, opacidade **10 a 15%**. Salvar como predefinição "Luz Coral". Depois as camadas de cor que já validamos (Vibração, Matiz, Curva em S).
- **Vídeo:** exportar do Photoshop a mesma correção como LUT (`Arquivo > Exportar > Tabelas de pesquisa de cores`, `.cube`) e aplicar em todos os takes no editor que aceitar LUT. No Adobe Express, que não aceita LUT, repetir à mão os mesmos ajustes em todos os trechos.
