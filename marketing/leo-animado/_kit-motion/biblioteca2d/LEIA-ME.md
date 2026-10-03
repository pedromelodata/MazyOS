# Biblioteca 2D da precificação

Os elementos 2D do reel de 02/10 ("3 sinais de que você já pode cobrar mais caro", já publicado nas versões motion
e b-roll) agora entram em qualquer peça do kit. Mesmo desenho, mesmos números: o código original não mudou, o kit só
importa. Quem mexe no código lê `RM/src/kit/ext/precificacao/LEIA-ME.md`; o catálogo completo está em
`KIT/catalogos/biblioteca2d/base.json` (e os assets do Léo, b-roll, vinheta, clay, ícones e Higgsfield em
`KIT/catalogos/assets/base.json`).

## O que tem

Elementos (cada um vira uma camada `p2d-<Nome>` na cena):

| camada | o que aparece |
|---|---|
| `p2d-At` | texto grande em caixa (o "mais caro" do gancho) |
| `p2d-Bg` | fundo de tela cheia: papel, escuro ou coral, com a trama de pontos |
| `p2d-Numeral` | número gigante (cheio ou só contorno) |
| `p2d-Sticker` | ícone clay num disco branco (calendário, campanha, gráfico, lâmpada, medidor) |
| `p2d-ClayCard` | cartão com animação clay (cadastro ou calculadora) |
| `p2d-Bubble` | balão de conversa |
| `p2d-Calendar` | agenda do mês acendendo em diagonal |
| `p2d-Stamp` | carimbo coral |
| `p2d-HangTag` | etiqueta de preço com "R$" |
| `p2d-Padlock` | cadeado que fecha |
| `p2d-YearOdo` | ano rolando (2024, 2025, 2026) |
| `p2d-Check` | caixinha de checklist que se marca |
| `p2d-NumDot` | bolinha numerada |
| `p2d-AlarmClock` | despertador (ponteiros e toque) |
| `p2d-BigArrow` | seta grande pra cima |
| `p2d-Rays` | raios girando |
| `p2d-Confetti` | confete |
| `p2d-Phone` | celular com a tela de abertura do app |
| `p2d-Eye` | olho que abre e olha de lado |
| `p2d-TetoCard` | medidor do teto do MEI |
| `p2d-CommentIcon` | balão de comentário "digitando" |
| `p2d-Pill` | pílula de texto |
| `p2d-Sparkle` | brilho de quatro pontas |
| `p2d-grupo` | uma cena 2D: junta elementos, tem fundo e câmera, e recebe transições e cortes |
| `p2d-legenda` | a legenda (e o fecho) por cima das cenas 2D de tela cheia |

Movimentos (batidas):

| batida | o que faz |
|---|---|
| `p2d-entra` | o elemento aparece com um pop (cresce passando um pouco e assenta) |
| `p2d-sai` | o elemento some |
| `p2d-mola` | um soco de mola (escala, giro ou posição); na cena inteira, é o "soco de câmera" |
| `p2d-treme` | tremida curta (a do carimbo e do "reajustar") |
| `p2d-canal` | anima uma parte do elemento: a agenda acendendo, o check marcando, o cadeado fechando, o confete voando... |
| `p2d-transicao` | troca de cena: íris, empurrão, zoom, subida ou cortina |
| `p2d-corte` | corte de cena: chicote pro lado ou pra cima, zoom com desfoque, flash ou a volta do loop |

Cada movimento já vem com o som que o reel de 02/10 usou nele (quando tinha).

## Como pôr numa cena

1. Na `cenas.json` da peça, em `camadas`, declare os elementos com um `id`, o `tipo` e a posição (`x`, `y`):
   `{"id": "agenda", "tipo": "p2d-Calendar", "month": "OUT", "x": 540, "y": 1180}`.
2. Em `batidas`, prenda cada movimento a uma palavra da narração (o `kit.py palavras <peça>` lista os índices):
   `{"id": "p2d-entra", "params": {"camada": "agenda", "t": {"palavra": 24, "desloc": -0.05}}}`.
3. Cena 2D de tela cheia: crie grupos (`p2d-grupo` com `fundo`), ponha `"grupo": "<id do grupo>"` em cada elemento
   e troque de grupo com `p2d-transicao` ou `p2d-corte`. Liste os grupos na ordem em que aparecem. Como o fundo 2D
   cobre a legenda do kit, acrescente uma `p2d-legenda` (com `modos` pra trocar a cor da legenda conforme o fundo).
4. Rode a conferência sem render: `kit.py props`, `kit.py eventos`, `kit.py qc` e `kit.py fatos` da peça. Erro trava
   (por exemplo: carimbo com "pago", confete perto de "pagar", grupo que não existe).
5. Se usar `p2d-Sticker`, `p2d-ClayCard`, `p2d-TetoCard` ou `p2d-Phone`, ligue a mídia antes de stills ou render e
   desligue logo depois:

```
PY -B KIT/scripts/kit.py ext-liga precificacao
PY -B KIT/scripts/kit.py ext-desliga precificacao
```

(PY = `C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe`.)

## Exemplos

Em `exemplos/`, três fragmentos de `cenas.json` (as `camadas` e as `batidas` pra colar na cena), presos à narração
do reel da guia (14/10):

| exemplo | o que mostra | precisa de ext-liga |
|---|---|---|
| `exemplo-1-agenda-carimbo.json` | elementos soltos por cima do papel do kit: agenda entrando e acendendo, carimbo DIA 20 com tremida, mola e saída (frase "Ela aparece pronta, com o dia que vence.") | não |
| `exemplo-2-transicao-iris.json` | duas cenas de tela cheia (coral e papel) com transição em íris, soco de câmera, check marcando e a legenda por cima (frases 0 e 1) | não |
| `exemplo-3-corte-zoomblur.json` | calculadora clay no escuro, corte zoomBlur, celular com a splash entrando de baixo e "vence dia 20" (frases 2 e 3) | sim |

Pra testar um exemplo numa peça de teste (a cena e a narração do guia, com o wav por hardlink):

```
PY -B KIT/biblioteca2d/monta_exemplo.py KIT/biblioteca2d/exemplos/exemplo-1-agenda-carimbo.json <pasta absoluta da peça de teste> --cena cenas-ex.json
PY -B KIT/scripts/kit.py props <pasta da peça de teste> --cena cenas-ex.json
PY -B KIT/scripts/kit.py eventos <pasta da peça de teste> --cena cenas-ex.json
PY -B KIT/scripts/kit.py qc <pasta da peça de teste> --cena cenas-ex.json
```

Os três passaram em 02/10 (props, eventos, qc e fatos sem erro; registro em `provas/exemplos.json`) e de novo em
03/10, já com still no navegador: `KIT/provas/modelos/demo-2d/` (`folha-exemplos.jpg` com 8 quadros, um still de cada
exemplo e o `demo-2d.json`), o exemplo 3 com o ext-liga antes e o ext-desliga depois.

## A prova no navegador (todos os elementos e movimentos)

`KIT/pecas/_2026-10-03-prova-2d/` é uma peça de teste com uma cena que desenha os 25 tipos de camada desta
biblioteca, as 7 batidas com as 5 transições e os 5 cortes, as camadas e as batidas da abertura e o fecho por cima
de um fundo 2D. Olhe as folhas em `provas/` da peça antes de escolher um elemento: cada still diz o que mostra.
Também serve de modelo de cena 2D completa (o `cenas.json` dela). Detalhes e como refazer:
`RM/src/kit/ext/precificacao/LEIA-ME.md`, seção "Prova no navegador".

O que a prova ensinou, pra quem monta:

- **Legenda e fecho por cima de grupo:** a `p2d-legenda` fica no z 200. Grupo com `z` maior cobre a legenda e o
  fecho; o z 300 é só da íris do fim (a receita abaixo). O grupo que fica embaixo da legenda usa o z padrão.
- **Mídia:** sem o ext-liga, o quadro que mostra Sticker, ClayCard, TetoCard ou Phone quebra (o still e o render).
- **Numeral de contorno:** o `outline` mostra a emenda interna dos glifos da Sora (no 2 e no 3), igual ao reel de
  02/10. Se incomodar, use o cheio.
- **Aro do Sticker:** o `ring` coral-700 some no fundo coral; use em fundo papel ou escuro.

## Receitas (os números do reel de 02/10)

- **Câmera do Motion.tsx numa cena 2D**: no grupo, `p2d-canal` canal `s` de 1 a 1,04 com `power2.inOut` na duração da
  cena (empurrão lento); em cada palavra forte, `p2d-mola` canal `s` (amp 0,055, f 2,4, amort 6) e canal `rot` (amp
  1,2 ou -1,2, alternando), 0,03 s antes da palavra; tremida com `p2d-treme`.
- **Carimbo**: `p2d-entra` com `s0` 2,4, `ease` "power1.in", `dur` 0,13, `opFracao` 0,333 e uma `p2d-treme` (amp 16)
  no impacto.
- **Agenda enchendo**: `p2d-canal` canal `acende` de 0 a 1 em `dur` + 0,14 s (0,64 s com a agenda de 0,5), ease "none".
  Agenda já cheia, parada: `"estado": {"acende": 1}` na camada.
- **Despertador tocando**: `p2d-mola` no canal `ring` (amp 1, f 13, amort 3,2, dur 0,9) e `p2d-canal` no `spin`.
- **Confete**: `p2d-canal` canal `voo` de 0 a 1 em 1,6 s, ease "none". Nunca na batida de pagar.
- **Clay animado**: `p2d-canal` canal `frame` de 0 a 120 em 2,5 s, ease "none" (o ritmo do original).
- **Íris do fim** (fecha em coral e emenda no começo): um `p2d-grupo` de fundo coral com `z` 300, entrando com
  `p2d-transicao` iris (ox 540, oy 1150, `dur` 0,52) no fim do vídeo. Ela cobre tudo, inclusive a `p2d-legenda` e o
  fecho: deixe o fecho terminar antes dela (na prova, o fecho sai em 32,65 s e a íris fecha de 32,74 a 33,26 s).

## Cuidados de conteúdo

- Confete nunca na batida de pagar: o app não confirma pagamento.
- Carimbo nunca com "pago" (nem "quitado").
- Número (Numeral) e o medidor do teto (TetoCard, que mostra "R$ 81 mil por ano") só com base no FATOS; o medidor só
  em peça que fala do teto do MEI.
- O celular mostra a splash do protótipo: não chamar de "tela real do app".
- Sem o selo APP EM CONSTRUÇÃO (vetado pelo Pedro).
- Texto em tela sem travessão e com "Legalizaí" acentuado; o @ do perfil não passa na trava (use o LINK DA BIO).
- O original foi entregue com a trilha Palmy Sway (Epidemic, reprovada): os elementos estão liberados, a trilha não.
