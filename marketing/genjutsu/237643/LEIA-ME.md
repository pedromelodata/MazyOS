# Genjutsu no parque (campanha do lançamento, 20/10/2026)

O pedido do Pedro, em 20/10: "Faça um genjutsu usando esse vídeo para o nosso tema", com o vídeo de banco `fonte/237643.mp4` (hardlink do Downloads). É um pai e uma filha brincando de bater palmas num parque de outono: 4K vertical, 50 quadros por segundo, 8,7 s, **sem som**.

O tema da campanha: a pessoa resolve no celular, pelo app, e volta pra quem ama. O vídeo de banco fica inteiro como a parte de gente de verdade, e os planos gerados contam o que vem antes:

| Plano | O que acontece | Arquivo |
|---|---|---|
| T | De lado, no mesmo quadro do banco: ele no celular, a menina esperando com as mãos pra cima; ele ergue a cabeça pra ela. Só os quadros 0 a 49 servem (o resto põe o celular num bolso que não existe, no peito) | `plano/T.mp4` (Kling 3.0 Omni, 6 s, job 1c135be6), de `hero/a0-852adcf7.png` até o primeiro quadro do banco. Sem a aliança a mais: `plano/T-sem-anel.mp4`. No quadro do banco: `plano/T-alinhado.mp4` |
| P | Por cima do ombro: o dedo encosta em "Emitir nota" no quadro 81, sai do botão no 87 e do celular no 92 (a nota emitida entra no 92 e o check fecha em ~110). A menina ao fundo, rindo | `plano/P.mp4` (Veo 3.1, 6 s, job 5b294295), de `hero/k-p0-resumo.png` (media a2a573a6). Com a tela de verdade: `plano/P-tela.mp4` |
| T2 | De lado: ele baixa o celular, que sai pela borda de baixo em 1,3 s, descansa as mãos vazias no joelho e ergue as mãos pra brincar. Do quadro 102 em diante o Kling segura a pose parada: a emenda com o banco é no 96 | `plano/T2.mp4` (Kling 3.0 Omni, 5 s, job 5534463b), do quadro 49 de T sem a aliança (`hero/t49-sem-anel.png`, media 44c2c4f3) até o primeiro quadro do banco (media fde84378). No quadro do banco e com a fusão: `plano/T2-emenda.mp4` |
| S | O vídeo de banco em 24 quadros, com o som gerado em cima dele | `plano/S-24.mp4` e, com o som, `plano/S-24-som.mp4` |

Os filmes, todos na velocidade normal:

| Plano | 15 s | 10 s |
|---|---|---|
| T | 0 a 1,75 s (quadros 0 a 41) | fora |
| P | 1,75 a 4,54 s (quadros 64 a 130) | 0 a 2,29 s (quadros 64 a 118) |
| T2 | 4,54 a 8,58 s (quadros 0 a 96) | 2,29 a 6,33 s |
| S | 8,58 a 15,00 s (do quadro 3 do banco) | 6,33 a 10,00 s |

O de 10 s perde a abertura de lado (ele no celular com a menina esperando) e a gargalhada do pai: começa direto no toque, com a menina esperando ao fundo.

As finais são `montagem/genjutsu-3-parque-10s.mp4` e `montagem/genjutsu-3-parque-15s.mp4` (240 e 360 quadros, 1080x1920, −21,6 LUFS), ligadas em `marketing/final/Filme Parque (campanha do lançamento)/`. Sem texto, sem música e sem legenda, como os outros filmes Genjutsu.

## O som

O vídeo de banco veio mudo. O som dele é do Seedance 2.5 em modo de edição de vídeo, com som (`video_edit` a 480p, 31 créditos, job 38788eed): o modelo recebe o próprio vídeo (`plano/S-24-480.mp4`) e devolve o mesmo movimento, quadro a quadro, com as palmas, a gargalhada e o ambiente. Só o som é usado. As palmas caem em 0,58, 1,45, 2,42, 3,75, 4,85, 6,45 e 7,95 s, nos mesmos instantes em que as mãos se encontram.

O modelo inventou duas vozes, que saem com rampa de 80 ms:
- uma exclamação em 2,9 s que começa com chiado de "s" e soa como "Sí!" (o whisper lê "C");
- uma frase em voz de homem entre 6,85 e 7,55 s (o whisper lê "It's good me").

O ambiente dos takes gerados não bate com o do banco:
- o Kling (T e T2) traz um ronco de vento forte, quase todo entre 60 e 150 Hz, com piso de −24 a −26 dBFS;
- o Veo (P) fica em −44;
- o som do banco, em −54, quase silêncio entre as palmas.

Pra igualar, os três takes gerados passam por um corte de graves abaixo de 200 Hz e descem até o piso do P (T −14 dB, T2 −12 dB). Uma cama com o timbre do P vai por baixo do filme todo, a uns −45 dBFS, pra o ambiente não sumir quando a imagem real entra.

## Como refazer

Os scripts em Python rodam no venv do corte-viral (`~/.claude/skills/corte-viral/.venv/Scripts/python.exe -I`). Os do `app/` ficam em `genjutsu/futebol/app/`.

1. **O banco em 24 quadros:** `ffmpeg -i fonte/237643.mp4 -vf "fps=24,scale=1080:1920:flags=lanczos..." plano/S-24.mp4`, e uma cópia em 480p pro Seedance.
2. **A aliança a mais em T** (no banco a aliança fica na mão da palma, e a pulseira na outra):
   ```
   python -I ../futebol/tira_anel.py plano/T.mp4 plano/T-sem-anel.mp4 --ref=0,631,1048 --anel=37,13,106 --de=0 --ate=49
   ```
3. **T e T2 no quadro do banco:** `alinha_fim.py` mede o encaixe do último quadro do take no primeiro do banco (escala de 99,5% e 7 a 8 px de deslocamento). `alinha_take.py` aplica esse encaixe ao take inteiro. `melhor_emenda.py` acha o quadro de emenda antes do trecho parado.
4. **A fusão de 3 quadros na emenda com o banco** (o rosto gerado vira o de verdade sem pulo): `python -I emenda.py plano/T2-alinhado.mp4 96 plano/S-24.mp4 3 plano/T2-emenda.mp4`. Na montagem, o banco entra a partir do quadro 3.
5. **A gravação do toque:** `python -I app/edita_gravacao_toques.py app/gravacao2 app/gravacao2-parque3 "5.734-5.984" 6.192`. É um toque só, o segundo que o Veo fez: o primeiro fica fora do filme.
6. **A tela no celular:**
   ```
   python -I app/sobrepoe_gravacao.py plano/P.mp4 app/gravacao2-parque3 plano/P-tela.mp4 -2.359 "--caixa=230,650,620,1320" "--claro=200,25" "--tela-prop=0.428" "--prop-lados=0.421,0.435" "--cresce=1.012" "--cantos-extra=plano/P-frente.cantos.json" "--placa=93:34:61-92" --borrao
   ```
   - `P-frente.cantos.json` sai do `app/ecc_frente.py`. Ele segue a tela pra frente depois que o laranja do botão desenhado pelo Veo some.
   - O `--placa` tira o dedo da frente da tela pela diferença contra o quadro 93, a mesma tela sem o dedo, alinhada pelos cantos. Assim pega o dedo de qualquer cor, inclusive o brilho claro da ponta e a borda borrada.
   - O polegar que segura o celular vem pela pele, como antes.
7. **Montar:** `python -I monta_parque.py 10 montagem/genjutsu-3-parque-10s.mp4` e o mesmo com `15`.

## As armadilhas

- **A aliança.** O Kling pôs aliança nas duas mãos. Conferir mão por mão contra o banco.
- **O celular que some.** Corte do celular na mão pro jogo com as mãos vazias é furo de continuidade. O T2 mostra ele baixando o celular pra fora do quadro.
- **O bolso inventado.** Pedir "guarda no bolso" fez o Kling enfiar o celular no peito do moletom. Pedir "põe no chão, fora da borda de baixo do quadro" funcionou.
- **O toque duplo.** O Veo fez o dedo apertar, pairar e apertar de novo. Mostrar os dois toques parece app travado, então o filme só mostra o segundo.
- **O dedo na frente da tela.** Pela cor, a pele clara do dedo se confunde com o branco e o laranja claro da tela. A diferença contra o quadro limpo resolve, desde que se tire do núcleo o que tem cor de tela (branco liso, laranja saturado e letra escura), senão a borda do botão desalinhada vira listra.
- **Fala inventada pelo Seedance.** Passar o whisper e olhar o espectrograma: voz é harmônica empilhada, e palavra começa com chiado de consoante.
- **O volume.** As palmas são picos curtos e quase todo o volume vem delas. Acima de −21,6 LUFS, o limitador amassa elas.

# Versão 2 (20/10, à noite)

Os pedidos do Pedro depois da versão 1:
- **Pessoas:** pardas, "estilo Brasil"; a menina de cabelo castanho cacheado; o pai pardo, de cabelo raspado com degradê e camisa de verão.
- **Roteiro:** "A menina deve olhar triste para o Pai quando ele pegar no telefone, ele emite a nota e guarda o celular e ela vai ficar feliz de novo".

Os arquivos ficam em `plano2/` e `hero2/`. As finais são `montagem/genjutsu-3-parque-v2-10s.mp4` e `-15s.mp4` (240 e 360 quadros), ligadas na pasta final. A versão 1 foi pra `final/_versoes-anteriores/`.

| Plano | O que acontece | Arquivo |
|---|---|---|
| S | O vídeo de banco com as pessoas novas e o movimento de verdade | `plano2/S-edit-som.mp4`: Kling Omni Edit pro (job e9477d96), sem a aliança que ele deixou piscando (`tira_aneis.py`), com o som do Seedance da versão 1 |
| A | De lado: a brincadeira para, ele tira o celular do bolso do outro lado e a menina fica triste, de braços caídos | `plano2/A.mp4` (Kling 3.0 Omni, job 0da2d965), de `hero2/s-sem-anel-q84.png` até `hero2/kf1-triste-f7180b45.png` |
| P | Por cima do ombro, com ela triste ao fundo: o dedo toca "Emitir nota" no quadro 66 e sai do celular no 75, e a nota emitida entra no 76 | `plano2/P.mp4` (Veo 3.1, job df8c43f7). Com a tela de verdade: `plano2/P-tela.mp4` |
| B | Close: ele enfia o celular no bolso da bermuda e a mão sai vazia | `plano2/B.mp4` (Kling 3.0 pro, 3 s sem som, job d20a2769), de `hero2/ins1-a681461a.png`. Espelhado: `plano2/B-espelho.mp4` |
| V3 | De lado: com as mãos já vazias, ele olha pra ela, ela se acende, ri e bate palma, e a brincadeira volta até o primeiro quadro do banco | `plano2/V3.mp4` (Kling 3.0 Omni, job f4e7559d), de `kf1-triste` até `hero2/s-sem-anel-q0.png`. No banco e com a fusão: `plano2/V3-emenda.mp4` |

Os filmes, na velocidade normal:

| Plano | 15 s | 10 s |
|---|---|---|
| A | 0 a 4,00 s (quadros 24 a 119) | fora |
| P | 4,00 a 7,00 s (quadros 42 a 113) | 0 a 2,75 s (42 a 107) |
| B | 7,00 a 8,62 s (quadros 12 a 50) | 2,75 a 4,17 s (14 a 47) |
| V3 | 8,62 a 13,42 s (quadros 78 a 192) | 4,17 a 8,79 s (82 a 192) |
| S | 13,42 a 15,00 s (do quadro 2 do banco) | 8,79 a 10,00 s |

## Como refazer a versão 2

1. **A troca das pessoas:** `kling_video_edit` em `pro`, com o banco e `hero2/f0-novo-9cf496e6.png` (as pessoas novas no primeiro quadro, feitas no Nano Banana 2.1) como referência. Depois a aliança:
   ```
   python -I tira_aneis.py plano2/S-edit.mp4 plano2/S-edit-sem-anel.mp4 "--segs=3,602,811,26,8,-4,-14,0,12;30,520,828,22,8,-9,-14,22,38;48,609,718,28,8,10,-16,43,57;114,512,1019,22,8,-27,-14,106,122;147,503,865,24,8,-12,-14,140,158"
   ```
   O som é o da versão 1 (`plano/S-24-som.mp4`), copiado por cima: o movimento é o mesmo, quadro a quadro.
2. **A gravação do toque:** `app/gravacao2-parque5`, um toque só, de 3,609 a 3,880 s, com a nota emitida em 4,005 s.
3. **Os cantos da tela:** pelas quatro bordas, quadro a quadro, a partir do quadro 0:
   ```
   python -I ../futebol/app/bordas_tela.py plano2/P.mp4 0 "300,751;517,740;562,1232;345,1250" plano2/P-bordas.json --ate=125 --busca=18
   ```
   Do 118 em diante ele baixa o celular rápido e a borda some no borrão; o filme não usa esse trecho.
4. **A tela no celular:**
   ```
   python -I ../futebol/app/sobrepoe_gravacao.py plano2/P.mp4 ../futebol/app/gravacao2-parque5 plano2/P-tela.mp4 -0.859 "--caixa=230,650,620,1320" "--claro=200,25" "--tela-prop=0.424" "--cresce=1.012" "--cantos-fixos=plano2/P-bordas.json:0" "--placa=76:34:0-75" --pele-escura --borrao
   ```
   Do quadro 30 pra trás a tela que o Veo desenhou é outra, e a diferença contra o quadro 76 falha. O filme começa no 42.
5. **O close do bolso:**
   - a imagem é do Nano Banana 2.1 (`hero2/ins1-a681461a.png`), com duas referências: a primeira tentativa (9995c861) e um recorte do quadril tirado do V3 (`hero2/v3-q100-quadril.png`), pra ele sair sentado no banco baixo, como nos outros planos;
   - o vídeo é do Kling 3.0 pro, 3 s, sem som (5,25 créditos);
   - a imagem saiu com ele virado pro outro lado. O espelho deixa ele olhando pro mesmo lado dos outros planos, e a mão vira a esquerda, a que segura o celular no toque:
   ```
   ffmpeg -i plano2/B.mp4 -vf "hflip,scale=1080:1936:flags=lanczos,crop=1080:1920:0:8" -an plano2/B-espelho.mp4
   ```
6. **O V3 no banco:**
   ```
   python -I alinha_fim.py plano2/V3.mp4 192 plano2/S-edit-som.mp4 _qc/V3_afim.jpg
   python -I alinha_take.py plano2/V3.mp4 _qc/V3_afim.jpg.afim.npy plano2/V3-alinhado.mp4
   python -I emenda.py plano2/V3-alinhado.mp4 192 plano2/S-edit-som.mp4 2 plano2/V3-emenda.mp4
   ```
   O V3 não para no fim: o último quadro já é o do banco. A fusão é de 2 quadros, e o banco entra do quadro 2.
7. **Montar:** `python -I monta_parque2.py 10 montagem/genjutsu-3-parque-v2-10s.mp4` e `python -I monta_parque2.py 15 montagem/genjutsu-3-parque-v2-15s-texto.mp4`.
   - O de 15 s é o escolhido pelo Pedro (21/10). Ele sai com a camada de sombra (preto a 18%, feita no YUV) e os dois textos em Sora 700, 64 px, no meio, a 15,5% da altura: acima do celular e das cabeças, dentro da margem de cima.
   - "Somos 100% Digital" vai de 2,92 s (o celular aparece na mão dele) a 6,85 s. "E 100% Humanos" vai de 10,17 s (as mãos dos dois voltam a se encontrar) até o fim.
   - No plano do toque, o fim de "Digital" encosta na nuca do pai, porque é o único espaço livre no meio acima do celular.
   - O de 15 s sem texto (`genjutsu-3-parque-v2-15s.mp4`) saiu da pasta final.
8. **A trilha e o coral (21/10, à tarde):**
   - o "100% Humanos" saiu em coral #F2643C, com o "E" em branco;
   - a trilha é a "Masking the Masters" (Mixkit 552), a partir de 58,0 s, com a orquestra explodindo na palma de 10,19 s;
   - dois cortes andaram uns quadros pra cair nos acentos dela (3,88 e 8,67 s);
   - a final é `montagem/genjutsu-3-parque-v2-15s-trilha.mp4`, de `python -I monta_parque2.py 15 montagem/genjutsu-3-parque-v2-15s-trilha.mp4`;
   - a licença, a checagem da AudD e o mapa da música estão em `musica/FONTES.md`.

## As armadilhas da versão 2

- **O celular que some da mão.** Nas três voltas pedidas ao Kling (V, V2 e V3), o celular foi pro bolso do peito ou sumiu na altura da coxa. A saída foi um close dele guardando o celular no bolso da bermuda, entre o toque e a volta, e o V3 só a partir do quadro 74, com as mãos já vazias.
- **O close em outra pose.** Sem referência, o Nano Banana pôs ele em pé. Com um recorte do próprio V3, ele sai sentado no banco.
- **Os cantos que vêm do quadro-chave.** Os cantos medidos na imagem de partida do Veo estavam uns 15 px fora no alto à direita, e o ECC entortou a borda de cima. A tela colada passou da borda do celular. O `bordas_tela.py` mede as quatro bordas pela passagem da moldura escura pra tela clara e não usa o conteúdo da tela.
- **O dedo de pele marrom rasgado.** Com `--placa`, o marrom saturado do dedo caía no teste do laranja do botão, e a sombra do dedo no da letra escura. O `--pele-escura` resolve: só conta como laranja o bem saturado, e só conta como escuro o traço fino de letra.
- **A risada da menina.** O Kling pôs um gritinho de alegria dela quando ela se acende (3,8 a 4,8 s do V3). Ficou: o whisper lê "Ha ha!", e não é fala. Nas palmas, o whisper inventa palavra em cingalês; o espectrograma mostra que é só palma.
- **O volume.** As palmas do V3 e do banco batem perto de 0 dBFS. O de 10 s ficou em −18,3 LUFS, e o de 15 s em −19,5.
