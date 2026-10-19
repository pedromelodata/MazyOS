# Pipoca sobre os vídeos de banco (Genjutsu, 19/10/2026)

O pedido do Pedro, em 19/10: recriar os dois vídeos de banco desta pasta com a narrativa da Pipoca, usando o Genjutsu do Higgsfield pra não recriar nada do zero.
- **Vídeo 1:** `6034806_Computer_Business_1280x720.mp4`, o escritório com o jardim.
- **Vídeo 2:** `6037559_Office_Interior_1280x720.mp4`, o escritório com a cidade.

O que ele pediu:
- O filme tem 10 s, e a campanha pede também a versão de 15 s.
- Ele fica estressado trabalhando.
- A mulher chega com a pipoca e chama ele. Ela é branca, tem cabelo castanho e unhas pretas.
- O celular fica deitado na mesa, nunca em pé do nada. Só depois que ela toca nele é que ele pega o celular.
- Corta pro close dele tocando na tela de emitir nota, já com o valor preenchido, e aparece o check de que deu tudo certo.
- Volta pro plano aberto e ele sai com ela. Sobre a saída do vídeo 2, ele disse: "Esse tá perfeito, só aumentar mais o tempo dele saindo e deixando a cadeira sozinha".

## Os filmes: `montagem/`

| Arquivo | Vídeo de banco | Cadeira vazia no fim |
|---|---|---|
| `genjutsu-1-jardim-10s.mp4` | 6034806 | 1 s |
| `genjutsu-1-jardim-15s.mp4` | 6034806 | 1,9 s |
| `genjutsu-2-cidade-10s.mp4` | 6037559 | 1,6 s |
| `genjutsu-2-cidade-15s.mp4` | 6037559 | 2,8 s |

Todos saem em 16:9, 1920x1080, 24 fps e BT.709, sem música e sem legenda. A saída roda sempre na velocidade normal, e no de 10 s o que acelera é o começo (o estresse a 1,6x e a chegada dela a 1,25x ou 1,35x). O tempo que sobra vira a cadeira vazia: o último quadro segue com uma aproximação bem lenta e grão.

## Os pedaços

**Vídeo 1** (`v1b/` e `insert/`):

| Pedaço | De onde veio | O que acontece |
|---|---|---|
| `v1b/A1.mp4` | MiniMax H3, 8 s (job 8ad14a2f), do quadro `a0-b45654c7` ao `a1-5726f435` | Estresse de 0 a 3 s; ela entra em 3,5 s e toca nele em 5 s; ele pega o celular, que estava de tela pra baixo, entre 6,75 e 7 s |
| `insert/I-S1b-tela.mp4` | H3 + tela real por cima | O dedo vem e encosta em "Revisar nota" no quadro 23; R$ 1.200,00 já preenchido |
| `insert/I-S2-tela.mp4` | H3 + tela real por cima | Botão apertado até o quadro 14, o dedo solta, e a nota emitida entra no 19, com o dedo já fora do celular |
| `v1b/C1.mp4` | H3, 6 s (job 7fd67111), do quadro `c0-71be5a9d` | Ele levanta entre 2,5 e 3 s, pega a mão dela em 3,25 s, e os dois saem até 6,4 s; o celular fica na mesa |

**Vídeo 2** (`oi2/` e `oi2/insert/`):

| Pedaço | De onde veio | O que acontece |
|---|---|---|
| `oi2/oi-kling2.mp4` | Kling 3.0 Omni Edit sobre o vídeo de banco (job 666200e9) | Base: põe a mulher e o celular deitado. Dele saem os quadros `k2_f0` (media bb34ea85) e `k2_f144` (07f8689c) |
| `oi2/A2.mp4` | H3, 8 s (job e7c8a248), do `k2_f0` ao `pega_f150` (media 1053780d) | Estresse de 1 a 3 s; ela entra em 4,5 s e toca nele em 5,25 s; ele olha pra ela em 6 s e estica o braço até a mesa |
| `oi2/insert/J-S1-tela.mp4` | H3 (job a473f828) + tela real | O dedo encosta em "Revisar nota" no quadro 64 |
| `oi2/insert/J-S2-tela.mp4` | H3 (job dda9490e) + tela real | Botão apertado até o quadro 29, o dedo solta, e a nota emitida entra no 31 |
| `oi2/V2-saida.mp4` | H3, 6 s (job e48b2d4b), do quadro `c0v2-b21ecb30` | Ele levanta entre 2 e 2,75 s, pega a mão dela entre 3 e 4 s, os dois saem até 5,3 s, e a cadeira fica vazia até o fim. Aprovado pelo Pedro |

A referência da mulher é a media 6e70c2cc (em `refs/`). As telas do app sobem como media e823e58e (tela 2, emitir com o valor) e 5dbc0258 (tela 3, nota emitida).

O resto das pastas (`cb2-*`, `oi-*`, `insert/I-S1*` sem o b, `oi2/V2-pre-estresse.mp4`, `oi2/V2-pega-celular.mp4`) são tentativas que não entraram. A mais importante delas é o celular em pé, que o Pedro recusou.

## Como refazer

Tudo roda no venv do corte-viral (`~/.claude/skills/corte-viral/.venv/Scripts/python.exe -I`). A tela real entra pelo `sobrepoe_tela.py`, que fica em `marketing/campanha-lancamento-2026-10/pipoca/telas/` e é chamado de lá:

```
python -I sobrepoe_tela.py "$G/I-S1b.mp4" "$G/I-S1b-tela.mp4" "0:tela-2-emitir-preenchida.png" --borda=2 --fixa "--caixa=1080,250,1470,940" "--toque=0.95-4:0.063,0.931,0.936,0.982"
python -I sobrepoe_tela.py "$G/I-S2.mp4" "$G/I-S2-tela.mp4" "0:tela-2-emitir-preenchida.png" "0.77:tela-3-nota-emitida.png" --fixa --borda=2 "--caixa=1050,200,1500,980" "--toque=0-0.59:0.063,0.931,0.936,0.982"
python -I sobrepoe_tela.py "$J/J-S1.mp4" "$J/J-S1-tela.mp4" "0:tela-2-emitir-preenchida.png" --fixa --borda=2 "--caixa=1100,350,1480,990" "--toque=2.65-7:0.063,0.931,0.936,0.982"
python -I sobrepoe_tela.py "$J/J-S2.mp4" "$J/J-S2-tela.mp4" "0:tela-2-emitir-preenchida.png" "1.27:tela-3-nota-emitida.png" --fixa --borda=2 "--caixa=1100,350,1480,990" "--toque=0-1.22:0.063,0.931,0.936,0.982"
```

Aqui, `$G` é `genjutsu/pipoca/insert` e `$J` é `genjutsu/pipoca/oi2/insert`. Depois, nesta pasta:

```
python -I monta_genjutsu.py v1 10 montagem/genjutsu-1-jardim-10s.mp4
python -I monta_genjutsu.py v1 15 montagem/genjutsu-1-jardim-15s.mp4
python -I monta_genjutsu.py v2 10 montagem/genjutsu-2-cidade-10s.mp4
python -I monta_genjutsu.py v2 15 montagem/genjutsu-2-cidade-15s.mp4
```

Os cortes de cada versão ficam no `PLANOS` do `monta_genjutsu.py`.

## As armadilhas

- **A emenda da tela.** Com o alfa antigo, pela região da interface quadro a quadro, sobrava um tracejado fino em volta da tela. Sem `--fixa`, sobrava também uma faixa da tela desenhada pelo modelo, porque os cantos saíam pequenos. Agora a forma da tela é a união lisa de todos os quadros, que segue o aparelho, e só o dedo e a mão recortam a área. Todo close usa `--fixa`. Conferir a borda com o `telas/borda_tela.py` (bruto e colado lado a lado, ampliado) e o toque com o `telas/folha_quadros.py` (todo quadro de um trecho, recortado).
- **A tela verde não serve.** O Pedro pediu a tela do app gerada direto, como nos vídeos de motion. A tela real vai no quadro-chave (`quadro_com_tela.py`), o H3 gera entre quadros que já têm a tela, e o `sobrepoe_tela.py` cola a tela real quadro a quadro em cima da que o modelo desenhou, com o dedo na frente.
- **O botão age quando o dedo solta.** O botão fica escuro (`--toque`) só nos quadros em que a ponta do dedo está nele. A tela seguinte só entra quando o dedo já saiu do celular inteiro, inclusive da borda de baixo. Antes disso, o dedo aparece em cima de "Cancelar nota" ou "Enviar ao cliente". Conferir o contato e a saída com zoom 1:1, quadro a quadro.
- **O celular duplicado.** No A2, quando ele pega o celular, o H3 inventa um segundo aparelho e o primeiro fica na mesa. Por isso o corte pro close cai antes, no quadro 161. Depois de toda pegada, conferir a mesa.
- **A fala inventada.** O som do H3 pode trazer fala sem sentido. No A1 ela fala algo que o whisper lê como russo, entre 4,3 e 5,95 s, e a montagem tira esse trecho. Rodar o whisper e olhar o espectrograma de todo pedaço.
- **O H3 de 4 s falha.** Usar 6 ou 8 s.
- **O Kling Omni Edit não cria ação.** Ele mantém o movimento do vídeo de base e acrescenta gente e objeto, mas não faz ninguém ficar estressado.
- **O disco.** O C: vive em 99%, então as folhas de conferência ficam em `_qc/`.
