---
tipo: prompts de imagem
data: 2026-10-30
para: Léo 3D por peças (corpo sem roupa + camisa, gravata e óculos separados)
---

# Prompts do Léo por peças

**Por quê:** os geradores 3D fundem tudo o que encosta (óculos no rosto, gravata no pescoço, camisa no corpo) e deixam os olhos pretos. Gerando o corpo sem nada, e cada peça à parte, o corpo sai inteiro (barriga, pelo, olhos) e as peças viram objetos separados no Blender: dá para puxar a camisa e mostrar a barriga, trocar de roupa e piscar.

**Como usar no Gemini (grátis):** uma conversa nova por imagem. Anexar a vista indicada (de `entradas/geradas/`) e, quando pedir, também `vista-frente.png` como referência de identidade. Salvar o resultado em `entradas/pecas/` com o nome indicado. Se mudar pose, enquadramento, escala ou fundo, gerar de novo.

## Corpo sem roupa (uma por vista: frente, esquerda, costas, direita, esquerda-45, direita-45, topo, base)

Anexar `vista-<nome>.png` (primeira) e `vista-frente.png` (segunda). Salvar como `corpo-<nome>.png`.

```
Edit the FIRST image. Remove ONLY the coral polo shirt, the black bow tie and the round glasses. Keep the exact same meerkat character: same pose, same camera angle, same framing, same scale, same lighting, same plain gray background, same proportions, same smile, same tail, same feet. Where the clothes were, show his natural meerkat body: continuous tan fur on shoulders and arms, a lighter cream-colored fur on the chest and round soft belly, darker horizontal stripes across the back. Where the glasses were, show his natural face: large shiny dark-brown eyes with the dark eye patches of a meerkat, no marks from glasses. The second image is only an identity reference of the same character. Photoreal 3D CGI render, same style as the original. Nothing else changes.
```

## Camisa sozinha (`camisa-frente-costas.png`)

Anexar `vista-frente.png` e `vista-costas.png`.

```
Show ONLY the coral polo shirt from these images, with no character and no body, on a plain light gray studio background, soft even light, photoreal 3D CGI render. Two orthographic views side by side: front and back. Invisible-mannequin shape: hollow, keeping the exact shape it has when worn by this small upright meerkat. Short sleeves, polo collar, two buttons, the small white square badge with a coral check mark on the wearer's left chest (viewer's right in the front view). Same coral color, fabric and folds as the references. No text, no labels.
```

## Gravata sozinha (`gravata.png`)

Anexar `vista-frente.png`.

```
Show ONLY the black satin bow tie from this image, with no character, on a plain light gray studio background, soft even light, photoreal 3D CGI render. Three orthographic views side by side: front, side and top. Same size, shape, knot and material as in the reference. No text, no labels.
```

## Óculos sozinhos (`oculos.png`)

Anexar `vista-frente.png` e `vista-esquerda.png`.

```
Show ONLY the round glasses from these images, with no character, on a plain light gray studio background, soft even light, photoreal 3D CGI render. Three orthographic views side by side: front, top and side (showing the full temples). Thin round dark-metal wire frame, small bridge, clear transparent lenses, same size and proportion as on the character. No text, no labels.
```
