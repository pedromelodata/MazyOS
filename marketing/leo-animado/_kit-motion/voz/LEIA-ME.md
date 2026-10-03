# voz: preparo, recebimento, alinhamento, fecho fixo e montagem da voz

Pacote K03 do kit de motion. Contrato: `KIT/DESENHO.md` (revisão 2), seções 2, 4.5, 4.7, 4.12, 4.13, 8 e 11. Toda gravação passa pelo `KIT/lib/escrita.py` (temporário na mesma pasta, troca com `os.replace`, recusa de hardlink e de caminho protegido). Todo Python roda com `-B` (os scripts também desligam o bytecode por dentro): nenhum `__pycache__`.

Os dois Pythons:

- `PY` = `C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe`: `prepara.py`, `recebe.py`, `monta.py`, `fecho/corta_fecho.py`, `pasta_guia.py` e `compara.py`;
- `PYW` = `C:/Projects/Legalizei_Videos/marketing/filme/escalada/tools/.venv/Scripts/python.exe` (faster-whisper 1.2.1): `alinha.py` e `transcreve.py`. Só o modelo small, já no cache; o `transcreve.py` liga o modo offline do Hugging Face e pede `local_files_only`, então ele para em vez de baixar outro modelo. Nunca `initial_prompt`.

## Arquivos

| arquivo | o que faz |
|---|---|
| `prepara.py <pasta> [--wav voz/narr-pedro-raw.wav] [--forca]` | grava `voz/para-voz.mp4` (preto 360x640, 30 fps, libx264 yuv420p; voz em AAC 192k, 48 kHz, mono; o vídeo dura a voz mais 0,5 s) e mostra o passo do Higgsfield |
| `recebe.py <pasta> <devolvido> [--ref voz/narr-pedro-raw.wav] [--forca]` | extrai `voz/narr-dylan.wav` (48 kHz, mono, 16 bits), mede o atraso contra a voz que foi pro voice_change e desloca se passar de 5 ms |
| `alinha.py <pasta> [--cena] [--wav] [--gap 0.44] [--saida voz/narracao.json] [--forca] [--sem-refino]` | whisper small sem prompt, alinhamento com o roteiro, refino pelo silêncio, tFecho, frases; grava a narração e o `alinhamento.md` |
| `monta.py <pasta> [--cena] [--forca]` | com `voz.fecho "asset"`, grava o `voz.final` da cena (voz mais o fecho fixo em tFecho, nível casado pela loudness); com `"embutido"`, só relata |
| `fecho/corta_fecho.py [--forca] [--sem-whisper]` | recorta o "Vai, Legalizaí" do `GP/vo/narr-dylan.wav` e grava `fecho/vai-legalizai-dylan.wav` e `fecho/fecho.json` |
| `fecho/vai-legalizai-dylan.wav`, `fecho/fecho.json` | o fecho fixo e os dados dele (seção 4.7) |
| `roteiro.modelo.md` | modelo do roteiro de peça nova (o `kit.py nova` copia pra `pecas/<peca>/roteiro.md`) |
| `transcreve.py <áudio> [--ate s]` | o whisper do kit (módulo do `alinha.py`; na linha de comando imprime JSON) |
| `comum.py` | funções comuns (áudio, silêncio, envelope, loudness, atraso, cena, destino) |
| `pasta_guia.py [--forca]` | monta a pasta `voz/` da peça do guia (hardlinks, cópia conferida, voz sem fecho e roteiro) |
| `compara.py` | compara narrações alinhadas contra uma referência (gerou o `comparacao.md` do guia; a regressão pode reaproveitar) |

## Fluxo de uma peça nova

1. Roteiro aprovado em `pecas/<peca>/roteiro.md`, a partir do `roteiro.modelo.md`: seção `## Narração` com uma frase da legenda por linha e a palavra-chave entre asteriscos.
2. TTS no Higgsfield (seed_audio, clone `Pedro-Legalizai`, cerca de 0,007 crédito por caractere) salvo em `pecas/<peca>/voz/narr-pedro-raw.wav`.
3. `PY -B KIT/voz/prepara.py KIT/pecas/<peca>` grava `voz/para-voz.mp4` e mostra o passo seguinte: subir o mp4 (media_upload), rodar o voice_change com `voice_id b847bc29-f184-583a-8ad9-d1f1e16d1a60` (preset Dylan, `voice_type preset`; cerca de 3 créditos por 27 s) e salvar o vídeo devolvido.
4. `PY -B KIT/voz/recebe.py KIT/pecas/<peca> <vídeo devolvido>` grava `voz/narr-dylan.wav` e confere o atraso (o voice_change mantém o tempo).
5. `PYW -B KIT/voz/alinha.py KIT/pecas/<peca>` grava `voz/narracao.json` e `voz/alinhamento.md`. Confira as marcas da tabela (palavra sem par, o whisper ouviu outra coisa, refino).
6. `PY -B KIT/voz/monta.py KIT/pecas/<peca>` grava `voz/voz-final.wav` (a voz com o fecho em tFecho), que o mix usa.

O `kit.py` (K07) chama esses scripts como `voz-prepara`, `voz-recebe`, `voz-alinha` e `voz-monta`.

## Contratos

`narracao.json` (seção 4.7): `{tFecho, duracao, roteiro, audio, fps, words: [{i, t, s, e}], phrases: [{w, key, title, s, e, out}]}`. `roteiro` e `audio` são relativos à pasta da peça (absolutos quando o arquivo fica fora dela). `t` é a palavra do roteiro, com acento e pontuação. `out` de cada frase é o início da próxima menos 0,02; o da última, tFecho menos 0,02. tFecho = fim da última palavra mais o gap (0,44), arredondado a 0,01; duracao = tFecho + 3,0.

`fecho/fecho.json` (seção 4.7): `id`, `arquivo` (relativo à pasta `fecho/`), `origem`, `inicioNoOriginal` 15.0, `duracao`, `vai` [0.01, 0.27], `legalizai` [0.46, 1.22], `fimFricativaZ`, `aiAcende` 0.94, `lufsFala`, `refNarracaoLufs`, `texto`, `voz`, mais `corte` e `conferencia` (envelope, fricativa, whisper e colagem). O `montaProps` (K02) lê o `aiAcende`.

## Regras do alinhamento (o que foi decidido aqui)

- **Refino do início** como o `PR/src/timeline.py`: silêncio abaixo de -40 dB (dBFS do RMS em quadros de 10 ms) por 80 ms ou mais; começo que cai dentro de uma pausa (de 0,01 s antes do começo dela até 0,02 s antes do fim) vai pro fim dela. Duas travas do kit: a primeira palavra não é refinada (a legenda da primeira frase entra no quadro 0, gancho e emenda do loop, como no guia aprovado) e o início refinado não passa do começo da palavra seguinte (quando duas palavras caem na mesma pausa, só a de depois vai pro fim dela). Depois, `e >= s + 0,05`.
- **Limiar absoluto.** Os -40 dB valem sobre o nível do arquivo, como no timeline.py. A voz Dylan do guia é uns 9 dB mais baixa que o TTS (-28,9 LUFS), então ela acha mais pausas que o TTS do Pedro.
- **Fim da última palavra (tFecho).** O whisper estica ou corta a última palavra conforme o que vem depois: no guia, com o fecho embutido logo depois, ele corta o "breve" em 14,16 s; sem o fecho, dá 14,56 s; com 3 s de zeros depois, 14,64 s. Quando há fala depois do roteiro (como o fecho embutido) ou mais de 0,78 s de áudio depois do fim acústico da última palavra, o `alinha.py` transcreve de novo só até o ponto padrão (o começo dessa fala, ou o fim acústico mais 0,78 s, o que vier antes; sempre pelo menos 0,2 s depois do começo da última palavra) e usa o fim que o whisper dá ali, se ele achar a mesma palavra no mesmo lugar (até 0,15 s de diferença no começo). Os 0,78 s são a pausa do guia aprovado entre o fim acústico do "breve" (14,23 s) e o fecho (15,01 s).
- **Destino.** Se a saída ou o relatório já existirem, o `alinha.py` para antes do whisper e pede `--saida` ou `--forca`. Nunca grava em hardlink, e nunca regrava um arquivo com o md5 da narração de referência do guia, nem com `--forca`.
- `--sem-refino` existe só pra comparação (ele deixa o início como o whisper deu).

## Outras decisões

- **Atraso (recebe.py).** O envelope RMS de 10 ms (passo de 1 ms) vai em dB, com piso de -80 dB, e o pico ganha interpolação parabólica. Em dB, a fala e as pausas pesam por igual; o envelope linear é puxado pelas vogais fortes, onde o timbre convertido muda a forma do envelope (no guia: linear +1,7 ms, em dB -0,2 ms, pro mesmo arquivo).
- **Mistura mono (prepara.py).** O TTS vem em estéreo de 24 kHz, e a mistura mono do ffmpeg pode passar de 0 dBFS (no guia, pico de 1,167). Nesse caso a voz é abaixada só o necessário (pico 0,98) e o script avisa. O nível não importa pro voice_change, e o `monta.py` casa o fecho pela loudness.
- **Ganho do fecho (monta.py).** LUFS da fala da narração nova menos o `refNarracaoLufs` do `fecho.json`. A fala é medida de 0 até o fim da última palavra mais 0,04 s, a mesma janela do `refNarracaoLufs` (o guia de 0 a 14,6 s). Com a voz do guia, o ganho dá 0,00 dB. Acima de 6 dB o script avisa, e o ganho fica limitado a 12 dB.

## Pasta de voz da peça do guia (`KIT/pecas/guia-pronta-2026-10-14/voz/`)

| arquivo | o que é |
|---|---|
| `narr-dylan.wav`, `narr-pedro-raw.wav` | hardlinks de `GP/vo/` (só leitura: nenhum script grava em hardlink) |
| `narracao.json` | CÓPIA da `RM/src/guia/narracao.json`, md5 `de548fb7302f40fe57156dae9581d467` (o do REF), st_nlink 1. É a referência da regressão: nada a reescreve |
| `roteiro.md` | o roteiro do guia remontado das 50 palavras (7 frases, chaves 6, 9, 16, 26, 36, 42 e 49) |
| `narracao-kit.json`, `alinhamento-kit.md` | o `alinha.py` com `--saida voz/narracao-kit.json` sobre o `narr-dylan.wav` (a narração da `cenas-kit.json`) |
| `narr-dylan-sem-fecho.wav` | o `narr-dylan.wav` com zeros a partir de 15,0 s, mesmo comprimento (a voz da `cenas-kit.json`, que prova o fecho como asset) |
| `comparacao.md` | as narrações do Dylan e do Pedro (com e sem refino) contra a referência |

Refazer a pasta: `PY -B KIT/voz/pasta_guia.py` (o que já está certo fica como está).

## Medido em 02/10/2026

- `alinha.py` no guia (`narracao-kit.json`): 50 palavras e 7 frases, mesmos índices e chaves da referência; desvio de início com mediana 0,000 s e máximo 0,25 s (o "O" e o "e", em que a referência é que está adiantada: o início acústico é 4,17 e 5,73 s, a referência diz 3,98 e 5,48; sem o refino o máximo é 0,06 s); tFecho 15,00 s. Detalhe no `comparacao.md`.
- Sem `--saida`, com a `voz/narracao.json` existente: para antes do whisper e pede `--saida` ou `--forca`; com `--forca` recusa, porque é a cópia do REF.
- `prepara.py` com a narração do guia: `para-voz.mp4` com áudio de 14,680 s e vídeo de 15,200 s.
- `recebe.py` com o `GP/vo/dylan-convertido-fecho3.mp4` contra o `GP/vo/narr-completa.wav`: atraso de -0,2 ms (0 ms na resolução de 1 ms), nada deslocado, e o `narr-dylan.wav` extraído é amostra por amostra o do guia. Com atrasos artificiais de +37 e -120 ms, mede 36,8 e -120,2 ms, desloca e fica em 0,0 ms.
- `corta_fecho.py`: recorte de 15,0 a 16,22 s (1,22 s); envelope vai [0,014; 0,28] e legalizai [0,465; 1,212]; fricativa do "z" com pico em 0,948 s e fim em 0,964 s; fala do fecho -27,77 LUFS e narração do guia -28,87 LUFS; o whisper ouve "Vai, legalizaí." no recorte isolado (e "vai legalizar i." no áudio inteiro); colado de volta em 15,0 s, correlação de 0,999911 com o original de 15,0 a 16,6 s.
- `monta.py` numa pasta de teste, com o `narr-dylan-sem-fecho.wav` e tFecho 15,0 (e também com tFecho "auto"): ganho 0,00 dB, correlação de 0,999989 com o `GP/vo/narr-dylan.wav` de 0 a 18 s, amostra por amostra igual até 16,208 s.
- Com a `cenas-kit.json` no núcleo do K02: 35 eventos na mesma ordem, maior diferença de tempo de 0,02 s contra a `cenas.json`, tFecho 15.
