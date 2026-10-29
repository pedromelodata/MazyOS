---
tipo: prompts de imagem
data: 2026-10-29
para: os 4 espaços do Hunyuan (Multiple Images) que a folha não tem
---

# Prompts das vistas extras do Léo

O Hunyuan aceita 8 vistas: Front, Back, Left, Right (essas 4 saem da folha, em `vistas/`) e Left 45°, Right 45°, Top, Bottom, que a folha não tem e saem destes prompts.

**Convenção do Hunyuan** (conferida nas miniaturas de exemplo do site, 29/10):
- Left e Left 45°: o nariz aponta para a **esquerda da imagem** (a câmera está do lado esquerdo do Léo, o do selo).
- Right e Right 45°: o nariz aponta para a **direita da imagem**.
- Top: câmera bem em cima; a frente do Léo fica para **baixo** na imagem e a cauda para cima.
- Bottom: câmera bem embaixo; a frente do Léo fica para **cima** na imagem e a cauda para baixo.

**Como usar:** uma conversa nova por vista. Anexar `REF-leo-folha.png` e `REF-leo-frente.png`. Colar o bloco comum e, logo abaixo, o bloco da vista. A imagem que sair vai para `entradas/geradas/vista-<nome>-bruta.png`, e o Claude recorta e alinha com as vistas da folha (mesma escala, mesmo quadro).

**Conferir antes de aceitar:** óculos redondos finos, gravata-borboleta preta, selo branco com check no peito **esquerdo do Léo**, camisa coral de manga curta, mancha escura nas orelhas, listras escuras nas costas, ponta da cauda escura, cauda curvando para o lado esquerdo do Léo. Se trocar de lado, espelhar ou mudar a pose, gerar de novo.

## Bloco comum (colar em toda vista)

```
Use the attached images as the only reference. They show one character from the front, his left side, his right side and the back. Create ONE new image of this exact same character from a new camera angle (described below).

Keep the design identical, nothing added, nothing removed: an anthropomorphic meerkat standing upright on his hind legs, thin round gold-wire glasses, black bow tie, coral polo shirt with short sleeves and two buttons, a small white square badge with a check mark on HIS LEFT chest (on the viewer's right in the front view), tan fur with darker stripes on the back, dark ear patches, dark eye patches, long thin tail with a dark tip that curves toward HIS LEFT side.

Same pose as the reference: standing straight, arms relaxed down along the body, hands slightly forward, feet slightly apart. Same proportions, same head size, same materials and fur detail, same photoreal 3D CGI render style.

Camera: long lens, almost orthographic, no perspective distortion. Full body, whole character inside the frame, centered, with margin around him. Soft even studio light, no strong shadows, no ground shadow. Plain pure white background. Square image. No text, no labels, no arrows, no extra characters, no props. Do not mirror the character.
```

## Left 45° (`vista-esquerda-45`)

```
New camera angle: three-quarter view from HIS LEFT side. The camera is rotated 45 degrees from the front toward his left side, at chest height, level. His nose points toward the LEFT edge of the image. We see his face in three-quarter and his left side; the white check-mark badge on his left chest faces the camera and is clearly visible. His tail is behind him, on the right side of the image, curving toward the camera.
```

## Right 45° (`vista-direita-45`)

```
New camera angle: three-quarter view from HIS RIGHT side. The camera is rotated 45 degrees from the front toward his right side, at chest height, level. His nose points toward the RIGHT edge of the image. We see his face in three-quarter and his right side; the badge on his left chest is on the far side, small and foreshortened near the right edge of his chest. His tail is behind him, toward the left side of the image, its tip curving back behind his feet.
```

## Top (`vista-topo`)

```
New camera angle: top view. The camera is directly above the character, looking straight down at 90 degrees (bird's-eye, orthographic). His front faces the BOTTOM edge of the image and his back faces the TOP edge. We see the top of his head and his two ears, the rims of the glasses and the tip of his nose sticking out toward the bottom of the image, his shoulders and the coral shirt seen from above, his arms along his sides, the toes of his feet just peeking out below the head, and his tail lying behind him toward the TOP of the image, its tip curving toward the RIGHT side of the image (his left).
```

## Bottom (`vista-base`)

```
New camera angle: bottom view. The camera is directly below the character, looking straight up at 90 degrees (worm's-eye, orthographic), as if through a glass floor. His front faces the TOP edge of the image and his back faces the BOTTOM edge. We see the soles of both feet with their toes and claws in the foreground, the legs strongly foreshortened, the lower edge of the coral shirt and the light belly fur, his hands, his chin and the underside of his snout toward the top of the image, and the underside of his tail toward the BOTTOM of the image, its tip curving toward the RIGHT side of the image (his left).
```
