# Futebol (campanha do lançamento, 19/10/2026)

O pedido do Pedro, em 19/10:
- O mesmo homem do vídeo 2 da Pipoca (o da cidade) joga bola com o filho.
- Ele para pra olhar o celular, e o menino fica meio desanimado.
- Corta pro app do Legalizaí emitindo a nota, com a mensagem de sucesso.
- Ele ri e volta a brincar, a criança ri junto e os dois saem de cena.
- Na hora em que ele pega o celular entra "Somos 100% Digital" no meio da tela, em Sora.
- Quando eles voltam a brincar, 1 s antes de saírem de cena, entra "E 100% Humanos".
- O filme sai em 10 s e em 15 s.

Os dois vídeos que ele mandou, em `fonte/`, são referência de ação. O 6012401 tem o menino na praia do lago e o 1473285, pai e filha no gramado.

## A versão 4 (a que vale), na praia de Copacabana

Depois da versão 3, o Pedro pediu (20/10):
- "volte a ideia da praia, como se fosse em copacabana. Eles jogam a bola dando passes um para o outro, ele pega o celular, a criança fica triste e ele clica em emitir nota, depois disso ele guarda o celular no bolso, e eles começam a sorrir e o Pai pega a criança no colo e sai de cena. Tudo suave mas não precisa ser em câmera lenta";
- "Se preferir use Premiere ou pesquise outro modelo de IA para esses vídeos realistas" (o Premiere não está instalado nesta máquina; ele escolheu o Veo 3.1);
- "Coloca qualquer outra cor na blusa do menino menos vermelho" (ficou amarela);
- "Essa bola [...] é uma bola de futebol americano, e falo de futebol brasileiro".

| Plano | O que acontece | Arquivo |
|---|---|---|
| A | Um take só: passes (o pai em 0,0 s, o menino devolve em ~1,1, o pai passa de novo em ~2,6); o menino pega a bola na mão (3,7 a 4,3); o pai tira o celular do bolso (3,7 a 4,6) e olha a tela (5,2) | `plano4/A.mp4` (Veo 3.1, 6 s, job 1d3bd54a), de `hero4/a0-nb-amarela-852eb341.png` |
| K | Close do menino triste com a bola; de 3,0 a 4,0 ele olha a bola, cabisbaixo | `plano4/K.mp4` (Veo 3.1, 4 s, job 3f07f657), de `hero4/k0-amarela.png` (media 2ee66667); sem o vermelho que sobrou na barra: `plano4/K-limpo.mp4` |
| P | Por cima do ombro: o dedo encosta em "Emitir nota" no quadro 22 (0,92 s), solta no 30 e sai do celular no 37 | `plano4/P.mp4` (Veo 3.1, 6 s, job 5ad73db2), de `hero4/k-p0-resumo.png` (media 8dc07987); com a tela do app: `plano4/P-tela.mp4` |
| B | Ele termina de guardar o celular (0,0), os dois sorriem, ele chega no menino (~2,8), ergue no colo (até ~4,5) e sai de cena (~7,7) | `plano4/B.mp4` (Veo 3.1, 8 s, job 658defa7), de `hero4/b0-nb-amarela-cb11fa17.png` |

O primeiro plano A (`plano4/A-bola-americana.mp4`) não serve: o pedido dizia "football", e o Veo trocou a bola de futebol por uma de futebol americano no meio do take.

Os tempos, todos na velocidade normal (sem rampa):

| Plano | 10 s | 15 s |
|---|---|---|
| A | 0 a 2,71 s (2,50 a 5,21 s do take) | 0 a 4,29 s (1,00 a 5,29 s) |
| K | 2,71 a 3,29 s (3,40 a 3,98 s) | 4,29 a 5,12 s (3,16 a 3,99 s) |
| P | 3,29 a 5,21 s (0,75 a 2,67 s) | 5,12 a 7,29 s (0,65 a 2,82 s) |
| B | 5,21 a 10,00 s (2,92 a 7,71 s) | 7,29 a 15,00 s (0,00 a 7,71 s) |

No de 10 s não cabem a guardada do celular e a caminhada até o menino: o final começa com ele já chegando. O de 15 s tem tudo.

Textos: Sora 700, `#FAF8F5`, 84 px, centralizados, com sombra suave (a areia e o céu claros apagam o branco sozinho). "Somos 100% Digital" vai a 30% da altura quando ele pega o celular, acima da cabeça do menino (a 42% passava pelo rosto dele), e encosta só no peito do pai. "E 100% Humanos" vai a 42% no último segundo.

Som: o som de cada take do Veo (mar, areia, riso), a vibração do M1 da versão 1 logo antes de ele levar a mão ao bolso e uma cama do mar tirada do P. O whisper não acha fala (no de 10 s ele inventa "Legendas pela comunidade de Amara.org" em ruído, com 13% de certeza).

As finais são `montagem4/futebol-copacabana-10s.mp4` (240 quadros, −17,2 LUFS) e `montagem4/futebol-copacabana-15s.mp4` (360 quadros, −18,3 LUFS), ligadas em `marketing/final/Filme Futebol (campanha do lançamento)/`.

### Como refazer a versão 4

1. **Camiseta amarela nos quadros-chave:** `troca_cor_lab.py` (peso pelo a* do Lab: camiseta de 40 a 64, pele até 29) e, na bermuda preta do close, `tinge_bermuda.py`. As imagens com o menino em plano aberto caíram no filtro "nsfw" do Higgsfield na subida (falso alarme), então o plano aberto e o final foram recoloridos dentro do Higgsfield, editando a imagem gerada lá com o close amarelo como referência.
2. **Tela real no quadro do celular:** `quadro_com_tela.py` (Pipoca) sobre `hero4/p0-verde-amarela.png` com `app/telas/resumo.png`.
3. **Os takes:** Veo 3.1, `veo-3-1-fast`, qualidade `high` (32 créditos a cada 8 s), só com `start_image`. Pedir "soccer ball" redonda, branca com pentágonos pretos, nunca "football".
4. **Vermelho que sobrou no close:** `python -I tira_vermelho_video.py plano4/K.mp4 plano4/K-limpo.mp4 "650,450,1450,1080" --amin=18` (só perto da camiseta e abaixo da gola, pra a boca não amarelar).
5. **Gravação do toque com espera:** `python -I app/edita_gravacao.py app/gravacao2 app/gravacao2-solta 0.333 0.3125`. O botão fica apertado 0,333 s (o dedo no botão), volta ao normal enquanto o dedo sai e a nota emitida entra 0,3125 s depois.
6. **Tela no celular:** `python -I app/sobrepoe_gravacao.py plano4/P.mp4 app/gravacao2-solta plano4/P-tela.mp4 -2.6715 "--caixa=640,380,1000,900" "--claro=218,19" "--tela-prop=0.4135" "--prop-lados=0.403,0.424" "--cresce=1.012" --borrao`. O `--claro` separa o branco da tela da areia (a tela tem branco acima de 228 com cor abaixo de 17; a areia fica entre 189 e 216, com cor acima de 22). As proporções saem de `app/mede_altura_tela.py`: a tela desse celular é mais comprida que o app (0,41 contra 0,46) e aparece em trapézio. O app ganha altura repetindo a faixa cinza abaixo da barra de status, sem esticar.
7. **Montar:** `python -I monta_praia.py 10 montagem4/futebol-copacabana-10s.mp4` e o mesmo com `15`.

## A versão 3 (a da quadra, em _versoes-anteriores)

Depois da versão 2, o Pedro pediu:
- "claramente uma IA [...] preciso que seja bem mais realista";
- "toda vez que o homem pega o celular para clicar, tem um travamento e um mini corte [...] preciso que ele pegue o celular, clique na tela de emitir nota, tudo sem corte e com velocidade normal, sem lentidão";
- "troque o cenário para ser em uma quadra, coloque o menino e o Pai com chuteiras";
- "Adicione também o Drama do pai ter que pedir o menino parar fazendo um pare com a mão bem de leve";
- "O maior problema estão sendo essas telas, preciso que elas sejam de responsividade igual ao app que está no Repo Legalizei, fazendo o Check quando ele clica em emitir nota".

O que mudou:
- **O lugar e a imagem.** Uma quadra de society de bairro, com alambrado, muro descascado e céu nublado, e os dois de chuteira. Os quadros-chave são do Nano Banana 2.1 (2k, 16:9; o FLUX 3 inventou brasão na camiseta e saiu), e o movimento é do Kling 3.0 Omni com quadro inicial e final (`kling_o3_flf`, pro, 14,4 créditos por 8 s). Um grão leve e igual no filme todo, como vídeo de celular.
- **O menino** continua gerado: exceção à regra P35 pedida pelo Pedro.
- **O celular é um take só.** Ele tira o celular do bolso e toca em "Emitir nota", sem corte. Só a aproximação do dedo anda mais rápido, dentro do mesmo take (pedaços seguidos do mesmo arquivo em velocidades diferentes).
- **A tela é o app de verdade.** É a gravação do protótipo do repositório (`C:/Legalizei/legalizei/app`, tela /emitir), colada no celular que se mexe, desde a subida. O botão muda de cor só com o dedo nele, e o check da nota emitida aparece com o dedo já fora do celular.
- **A aliança** fica só na mão esquerda. O Kling pôs uma na mão direita no take do celular, e ela sai quadro a quadro (`tira_anel.py`).

| Plano | O que acontece | Arquivo |
|---|---|---|
| A | Um take só: passes, o celular vibra, ele para e faz o "espera" leve com a mão direita, com a esquerda (a da aliança) no bolso | `plano3/A.mp4` (Kling, 10 s, job 2ca373cf), de `hero3/q-nb21-4cc74d84.png` a `hero3/a1-572c19c0.png` |
| K | Close do menino: espera, faz bico e suspira ("hmm" de 1,58 a 2,58 s) | `plano3/K.mp4` (Kling, 5 s, job b3bdcb2c), de `hero3/k0-fcfeff9d.png` |
| P | Um take só por cima do ombro: o celular sobe do bolso (0,3 a 1,0 s), o dedo encosta em "Emitir nota" em 3,42 s e sai do celular em 4,08 s | `plano3/P-sobe.mp4` (Kling, 6 s, job 2daff595), de `hero3/p0-semcel-d4af4211.png` a `hero3/k-p2-emitida.png`. Com a tela do app: `plano3/P-sobe-tela.mp4`. Sem a aliança: `plano3/P-sobe-tela-sem-anel.mp4` (o que entra no filme) |
| B | Ele ri e guarda o celular, os dois voltam a jogar rindo e saem pela câmera (7,1 s) | `plano3/B.mp4` (Kling, 8 s, job f0548e9c), de `hero3/b0-2f0e8b74.png` a `hero3/b1-vazia-811af90f.png` |

Os tempos no filme:

| Plano | 10 s | 15 s |
|---|---|---|
| A | 0 a 2,00 s (6,10 a 8,10 s do take) | 0 a 4,92 s (3,50 a 8,42 s) |
| K | 2,00 a 2,75 s | 4,92 a 6,17 s |
| P | 2,75 a 6,08 s: do quadro 10 do take (o celular subindo) até 4,88 s; de 1,33 a 3,43 s anda a 2,18x | 6,17 a 10,08 s: do quadro 10 até 5,23 s; de 1,38 a 3,48 s anda a 1,74x |
| B | 6,08 a 10,00 s (o meio a 1,5x e a saída a 1,3x) | 10,08 a 15,00 s (o meio a 1,45x) |

O dedo encosta no botão em 4,62 s no de 10 s e em 8,30 s no de 15 s, e a nota emitida aparece em 5,37 s e 9,02 s, com o dedo já fora do celular.

As finais da versão 3 são `montagem3/futebol-quadra-10s.mp4` (240 quadros, −16,8 LUFS) e `montagem3/futebol-quadra-15s.mp4` (360 quadros, −17,0 LUFS), em 1920x1080, 24 fps e BT.709. Estão em `marketing/final/_versoes-anteriores/Filme Futebol (campanha do lançamento)/`, com o sufixo -v3.

Som:
- cada plano leva o som do próprio Kling: passes, chute, risada;
- o "Turma!" que o Kling pôs no começo do B sai (`MUDO`), e os gritos de "ei!" do menino e uma voz no gesto do A descem 10 dB e 18 dB (`ATENUA`);
- o zumbido do celular vibrando vem do M1 da versão 1 (3,05 a 3,85 s, uns 195 Hz);
- uma cama do ar da quadra, com o timbre do P, vai por baixo do filme todo;
- o whisper só acha o "hmm" do menino.

Os textos são Sora 700 (`refs/Sora-wght.ttf`), na cor `#FAF8F5`, com 84 px de corpo, centralizados na largura, com entrada e saída de 4 quadros:
- "Somos 100% Digital" vai no take do celular, a 33% da altura, sobre o muro desfocado: 2,80 a 4,55 s no de 10 s e 6,20 a 8,25 s no de 15 s, saindo antes do toque;
- "E 100% Humanos" vai a 42% da altura, no último segundo.

A versão 2 (na praia do lago, toda no MiniMax H3) e a versão 1 (o menino do vídeo de banco com o pai de outro ator) estão em `marketing/final/_versoes-anteriores/Filme Futebol (campanha do lançamento)/`. As peças delas continuam em `hero2/`, `plano2/` e `montagem2/`, e em `hero/`, `plano/` e `montagem/`.

## Como refazer

Os scripts em Python rodam no venv do corte-viral (`~/.claude/skills/corte-viral/.venv/Scripts/python.exe -I`), nesta pasta.

1. **Gravar o app.** Com o protótipo no ar (`npm --prefix C:/Legalizei/legalizei/app run dev`, porta 3000; no Claude Code é a configuração "legalizei-app" do `.claude/launch.json`), dentro de `app/`:
   ```
   node grava_emissao.mjs gravacao 3.6 600
   ```
   Usa o Playwright do próprio repositório no Edge da máquina (`channel: 'msedge'`), sem baixar navegador. Abre /emitir em 430x932 com escala 2, toque e pt-BR, põe uma barra de status de iPhone (17:42) e esconde o selo 🧪 de teste. Preenche Construtora, R$ 1.200,00 e Propaganda e publicidade, abre o "Confira antes de emitir" e grava a tela (screencast do CDP, quadro a quadro com o tempo) com o toque em "Emitir nota de R$ 1.200,00": o dedo desce 3,6 s depois do começo e segura 0,6 s (na gravação ficou de 3,622 a 4,272 s). O app só troca pra nota emitida (o confete que vira o check laranja, "Nota nº 000005 emitida") quando o dedo solta.
2. **Achar a tela na subida do celular.** O rastreio normal erra o contorno enquanto o celular sobe, então os cantos dos quadros 10 a 26 saem do ECC, de trás pra frente a partir do quadro 26:
   ```
   python -I app/acerta_subida.py plano3/P-sobe.mp4 plano3/P-sobe-tela.mp4.cantos.json plano3/P-subida.cantos.json 26 8 _qc/P_subida_ecc.jpg
   python -I app/lados_subida.py plano3/P-subida.cantos.json --conserta=10
   ```
   O quadro 10 tem a parte de baixo fora da imagem, e o `--conserta` copia os lados do quadro 11. Os quadros 8 e 9 não seguram (o celular só desponta) e ficam fora do filme. O `.cantos.json` de entrada é o de uma passada anterior do passo 3; na primeira vez, rodar o passo 3 sem `--cantos-fixos` pra ele existir.
3. **Colar a gravação no celular** (o vídeo começa 0,192 s antes da gravação, pra o toque e a soltura caírem no dedo):
   ```
   python -I app/sobrepoe_gravacao.py plano3/P-sobe.mp4 app/gravacao plano3/P-sobe-tela.mp4 -0.192 "--caixa=820,560,1180,1076" "--cantos-fixos=plano3/P-subida.cantos.json:10" --borrao
   ```
4. **Tirar a aliança da mão direita:**
   ```
   python -I tira_anel.py plano3/P-sobe-tela.mp4 plano3/P-sobe-tela-sem-anel.mp4 --ref=83,1151,920 --anel=37,11,57 --de=47 --ate=144
   ```
   O anel é marcado à mão no quadro 83, seguido pela pele em volta (fluxo óptico) e acertado pelo desenho dele quadro a quadro. O lugar dele recebe a pele do mesmo dedo, copiada um pouco adiante no eixo do dedo. A partir do quadro 136 sobra um pontinho dourado, mas o filme só usa o take até o quadro 125.
5. **Montar:**
   ```
   python -I monta_futebol.py 10 montagem3/futebol-quadra-10s.mp4
   python -I monta_futebol.py 15 montagem3/futebol-quadra-15s.mp4
   ```
   Os cortes, as velocidades, os textos, o efeito e os trechos de som tirados ficam no começo do `monta_futebol.py`. Depois de renderizar, religar os hardlinks da pasta final.

## As armadilhas

- **A aliança na mão errada.** O Kling põe aliança na mão direita. O QC de mão vai por zoom, take por take, nas duas mãos.
- **A tela desenhada pelo modelo.** O Kling desenha uma tela parecida com o app (branca, letras borradas, botão laranja). Ela não pode aparecer nem um quadro: a tela de verdade entra no primeiro quadro em que o celular é usado, sem fusão, porque a fusão mostra os dois botões ao mesmo tempo.
- **A subida do celular.** A mancha clara da tela borra e pega o brilho da mão, e o contorno pelo retângulo escapa até 30 px. O ECC segue o aparelho inteiro e acerta. A tela leva um borrão curto (um quarto de quadro), porque o Kling borra pouco: com meio quadro ela fica riscada.
- **O texto e as pessoas.** No plano aberto, qualquer altura no meio encosta na mão do "espera" ou no cabelo do menino, por isso o "Somos 100% Digital" foi pro take do celular, sobre o muro. O "E 100% Humanos" passa pelo corpo do pai, nunca pelo rosto.
- **O Higgsfield.** Passar sempre `declined_preset_id` 24bae836-2c4a-48e0-89b6-49fcc0b21612, senão o lote do Kling volta pedindo o preset "IN THE DARK". Imagem e vídeo com criança às vezes caem como "nsfw" por engano: refazer sem palavras como "pele" e "suor".
- **A fala inventada.** O Kling põe fala ("Turma!") e grito que soa como palavra. Passar o whisper no filme pronto (`campanha-lancamento-2026-10/pipoca/telas/fala_no_video.py`).
- **O disco.** O C: enche com a cópia temporária que o Claude Code guarda de cada comando de Bash (`AppData/Local/Temp/claude/bash-edit-diff`, até 500 MB por comando numa pasta com vídeo). Os comandos pesados rodam pelo PowerShell.
