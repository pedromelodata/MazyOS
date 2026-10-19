# Pipoca (ideia 1 da campanha do lançamento, 15/10/2026)

O pedido do Pedro, em 15/10:
- Um homem trabalha na mesa, estressado e com muita coisa pra fazer. O rosto dele não aparece, só o torso, a papelada e os braços.
- Chega a mulher dele com uma bacia de pipoca e toca na mão dele. Ele usa aliança, porque é casado com ela.
- No fundo, uma TV passa uma cena bem baixinho.
- Ele pega o celular, abre o app, toca em Emitir nota e deixa o celular na mesa.
- Ele pega a mão dela, ela pega a pipoca e os dois vão pra sala. A câmera fica neles indo pra sala, e o filme fecha aí.

Regras do pedido:
- Sem música, só SFX.
- Sem legenda, porque o Pedro coloca depois.
- Sai take a take, com a melhor qualidade possível.
- O filme final tem duas versões, de 10 s e de 15 s.

O briefing e a auditoria da campanha estão na pasta de cima (`briefing-2026-10-15.md` e `AUDITORIA-E-IDEIAS.md`).

## Os takes que valem: `takes/entrega/`

| Take | Arquivo | O que acontece | Duração | De onde veio |
|---|---|---|---|---|
| 1 | `T1.mp4` | Ele escreve, larga a caneta na folha de cima e suspira. A caneta fica ali até o fim | 6,58 s | MiniMax H3 2K (job 522f5754) + acerto de cor |
| 2 | `T2.mp4` | Ela chega com a bacia de pipoca e pousa a mão sobre a dele, com a câmera parada chegando devagar | 6,58 s | H3 (job 115a991b) + aproximação digital |
| 3 | `T3.mp4` e `T3r.mp4` | Close do celular do ponto de vista dele, com a mesa e a papelada (a TV fica atrás dele, fora do quadro): toca em "Repetir última nota", o valor entra, toca em "Revisar nota", solta e sai a nota emitida | 7,75 s (186 quadros); o `T3r` é o mesmo a 1,45x (131 quadros) | refeito em 19/10: três trechos do H3 (jobs 20d94f00, c946fb1c e 2d408a30) com a tela real nos quadros-chave e colada por cima, juntos pelo `takes/t3k/junta_t3.py` |
| 4 | `T4.mp4` | Ele deixa o celular na mesa, com a tela de nota emitida, e pega a mão dela | 3,79 s | H3 (job e13c97aa) + tela colada |
| 5 | `T5.mp4` | Os dois, de costas, vão pra sala de mãos dadas, e o celular com a nota emitida fica no primeiro plano | 6,58 s | H3 (job c4c04b94) + tela colada |

Os takes 1, 2, 4 e 5 têm 1440x2560 e o 3 tem 1080x1920, todos a 24 fps. O áudio é o foley do próprio modelo, sem música e sem fala, conferido no espectrograma e no whisper.

Cada take foi conferido quadro a quadro:
- **Rosto:** nenhum, conferido na faixa de cima de todos os quadros. No take 5 ele vira um pouco a cabeça no fim, e aparecem a orelha e a linha da barba, sem olho nem boca.
- **Aliança:** uma só, na mão esquerda dele. A dela também fica na mão esquerda, que segura a bacia.
- **Caneta:** sempre na folha de cima, no mesmo lugar, do take 1 ao 5.

## A pós de cada take

- **T1:** no primeiro segundo e meio o H3 mudava a cor, porque o quadro inicial e o final vinham de gradações diferentes. O `takes/pos_take.py cor` mede uma região escura (a parede) e uma clara (os recibos) e leva o começo pra cor do fim.
- **T2:** entre 2,5 e 4 s, a ponta do cabelo dela aparecia na borda de cima, clara e lisa, diferente do cabelo do take 5. O `takes/pos_take.py push` faz uma aproximação lenta de 8,5%, ancorada embaixo, que tira o cabelo do quadro.
- **T3 (refeito em 19/10):** o Pedro reprovou o close antigo com estas palavras: "A tela está bugada, cortada, esticada e desconfigurada, o cara está clicando onde não faz sentido nenhum clicar". Ele também cobrou a TV: ela estava atrás dele na primeira cena. O close novo é do ponto de vista dele e tem três trechos:
  - S1: o dedo sobe e encosta no cartão "Repetir última nota" no quadro 24;
  - S2: o valor já preenchido, o dedo desce e encosta em "Revisar nota" no quadro 64;
  - S3: o dedo fica no botão, solta e sai do celular, e só então entra a nota emitida, no quadro 48 do S3 (no `T3`, o quadro 104).

  A espera de cada trecho é comprimida em 5 quadros. A tela real entra por cima com o `telas/sobrepoe_tela.py`, sem verde: a tela já vai nos quadros-chave, pelo `telas/quadro_com_tela.py`.
- **T4:** sai cortado em 3,79 s, porque a partir de 3,9 s aparece uma aliança na mão direita dele no aperto de mãos.
- **T4 e T5:** a tela "Nota emitida" foi colada deitada, com o topo do app pra direita. No T5 ela leva o mesmo desfoque do celular, que está fora de foco.

## Como refazer

Os comandos rodam no venv do corte-viral (`~/.claude/skills/corte-viral/.venv/Scripts/python.exe -I`).

```
cd telas
python -I edita_telas.py
python -I compoe_tela.py ../takes/T3-v1-verde.mp4 ../takes/T3-v2.mp4 "0:tela-1-emitir.png" "0.50:tela-2-emitir-preenchida.png" "3.72:tela-3-nota-emitida.png"
python -I compoe_tela.py ../takes/h3/T4-h3-verde.mp4 ../takes/h3/T4-h3.mp4 "0:tela-3-nota-emitida.png" --gira=cw --fim=3.79 --sem-margem --anel=301
python -I compoe_tela.py ../takes/h3/T5-h3-verde.mp4 ../takes/h3/T5-h3.mp4 "0:tela-3-nota-emitida.png" --gira=cw --desfoque=2.1 --sem-margem --anel=151
cd ../takes
python -I pos_take.py cor h3/T1-h3-v2.mp4 h3/T1-h3-v2-cor.mp4 --escuro 100:550,800:1400 --claro 2300:2540,900:1400 --ref 55:75 --ate 75
python -I pos_take.py push h3/T2-h3-v2.mp4 h3/T2-h3-v2-push.mp4 --ancora 0.35,1.0 --chaves 0:1.0,58:1.07,157:1.085
```

O `python -I compoe_tela.py TAKE.mp4 --quadros` grava a folha da máscara e dos cantos em `_qc/`, pra conferir antes de compor. O ponto vermelho marca o canto que recebe o canto de cima, à esquerda, da tela do app.

O take 3 de 19/10 e a montagem:

```
cd telas
python -I sobrepoe_tela.py ../takes/t3k/S1.mp4 ../takes/t3k/S1-tela.mp4 "0:tela-1-emitir.png" --fixa "--toque=0.99-7:0.056,0.0815,0.944,0.152"
python -I sobrepoe_tela.py ../takes/t3k/S2.mp4 ../takes/t3k/S2-tela.mp4 "0:tela-2-emitir-preenchida.png" --fixa "--toque=2.65-7:0.063,0.931,0.936,0.982"
python -I sobrepoe_tela.py ../takes/t3k/S3.mp4 ../takes/t3k/S3-tela.mp4 "0:tela-2-emitir-preenchida.png" "1.98:tela-3-nota-emitida.png" --fixa --borda=2 "--toque=0-1.87:0.063,0.931,0.936,0.982"
cd ../takes/t3k
python -I junta_t3.py T3-montado.mp4
python -I junta_t3.py T3-montado-rapido.mp4 1.45
cp T3-montado.mp4 ../entrega/T3.mp4
cp T3-montado-rapido.mp4 ../entrega/T3r.mp4
cd ../..
python -I monta.py 15 montagem/pipoca-15s.mp4
python -I monta.py 10 montagem/pipoca-10s.mp4
```

Depois do `monta.py`, cada filme passa por um `loudnorm=I=-16:TP=-1.5:LRA=11` de uma passada (`-c:v copy`), que acerta o volume. O `--toque` deixa o botão escuro só nos quadros em que a ponta do dedo está nele. Os quadros de contato e de saída foram achados com zoom 1:1, quadro a quadro.

Os quadros-chave do take 3 estão em `hero/t3k/`, com estes media_id:
- `k0-tela1`: 4ea2e218
- `k1a-tela1-toque`: a5f54a19
- `k1b-tela2`: f5f3a121
- `k2a-tela2-toque`: 22f421fa
- `k2b-tela3`: 731968f0
- `k3-tela3`: 4a2b82ae

O que tem em cada pasta:
- `takes/h3/`: os brutos do H3. Os `*-verde.mp4` têm a tela verde, e os `T1-h3.mp4` e `T2-h3.mp4` são a primeira versão, em que a caneta sumia.
- `takes/T1-v1.mp4` e `takes/T2-v1.mp4`: a versão do Cinema Studio, com duas alianças, que não vale mais.
- `takes/teste-modelos/`: a comparação dos três modelos que escolheu o H3.

## Os quadros-chave no Higgsfield

| Quadro | Arquivo | media_id |
|---|---|---|
| T1, início | `hero/t1-start.png` | 9bf7708d-4739-4a3a-a280-1c2c1c885006 |
| T1, fim, que é o início do T2 | `hero/h3-t1-fim.png` | e3558353-cb04-44dc-b194-54247471ccee |
| T2, fim | `hero/h3-t2-fim.png` | 09b27b73-6697-427d-8c5c-efbdac3050fb |
| T3, início | `hero/t3-ini.png` | 61777c69-d213-48f1-834b-56d51a789e27 |
| T4, início | `hero/h3-t4-ini.png` | 760d474a-4996-4b98-9804-73b31a6aebdd |
| T4, fim (não usado: nele era ela quem pousava a mão) | `hero/h3-t4-fim.png` | 2857d49a-ab9b-45af-a4c7-c729b6f1fa12 |
| T5, início | `hero/h3-t5-ini.png` | d1a91fe2-d600-4eca-be17-84b300da002c |
| T5, fim | `hero/h3-t5-fim.png` | 13e36237-8ff5-4e7f-8ce8-8f63e9d5937c |

Os outros PNGs da `hero/` são candidatos do nano banana pro que não foram escolhidos, e o nome de cada um traz o job.

Como o H3 foi usado:
- **Parâmetros:** `minimax_h3`, 9:16, `duration` 6 (sai com 6,58 s), `resolution` 2K. Cada take custa 12 créditos.
- **Preset:** recusar sempre o "IN THE DARK" (`declined_preset_id` 24bae836-2c4a-48e0-89b6-49fcc0b21612).
- **O que todo prompt diz:**
  - "exactly one ring: a gold wedding band on his LEFT hand; his RIGHT hand has no ring";
  - nenhum rosto, queixo ou pescoço no quadro;
  - a caneta fica na folha;
  - no som, "no music and no voices", com o foley pedido.

## As armadilhas

- **A segunda aliança:** os modelos de imagem (nano banana) e de vídeo (Cinema Studio, Gemini) põem aliança também na mão direita. O H3 respeita a regra, mas no aperto de mãos do T4 a aliança voltou. É preciso conferir mão por mão, com zoom de 2 em 2 quadros.
- **A cor:** o take do H3 vem sem etiqueta de cor. Os dois scripts leem e gravam com a matriz BT.709 explícita e a conversão exata (`accurate_rnd+full_chroma_int+bitexact`). A conversão padrão do ffmpeg 9 desta máquina escurece e puxa a cor de 2 a 4 pontos.
- **O verde vazado:** a mão que segura o celular por baixo pega o reflexo verde longe da borda. A faixa larga (`--anel`) tira esse verde só de tom quente, com um teto mais baixo pra pele na meia-luz.
- **O disco:** o C: vive em 99%. Um quadro de QA em PNG pesa uns 70 MB por take, então as pastas `_qc/` ficam fora do git.

- **O toque no celular:** o botão age quando o dedo solta. A tela seguinte só entra quando o dedo já saiu do celular inteiro, inclusive da borda de baixo. Senão, a ponta aparece em cima de "Cancelar nota" ou "Enviar ao cliente", e o Pedro vê. Miniatura a 0,25 s não mostra isso.
- **A tela verde:** não usar mais. O Pedro pediu a tela gerada direto, "como nos vídeos de motion".

## Os filmes

- `montagem/pipoca-15s.mp4` e `montagem/pipoca-10s.mp4`, em 1080x1920, sem música e sem legenda.
- As versões feitas sobre os dois vídeos de banco, pelo Genjutsu e pelo H3, estão em `marketing/genjutsu/pipoca/` (LEIA-ME próprio).
- As finais ficam ligadas em `marketing/final/Filme Pipoca (campanha do lançamento)/`.

## O que falta

- As decisões que estão com o Pedro (`AUDITORIA-E-IDEIAS.md` §6): o mote, os filmes só pra ME, a fonte das imagens e o CRC com o Mauro.
