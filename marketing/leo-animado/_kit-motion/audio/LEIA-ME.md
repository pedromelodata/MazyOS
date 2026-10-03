# Áudio do kit: mixador por eventos (pacote K05)

Contrato: `KIT/DESENHO.md` (revisão 2), seções 1 (decisão 5), 4.3, 4.4, 4.6, 4.12, 6 e 13.

## Aviso que vale antes de tudo

- **O perfil de efeitos aprovado é o `v2`** (o da V2 do guia, `EFEITOS = "v2"` no `GP/mix_guia.py`). É o padrão do kit.
- Pra o Pedro, "trilha" é o som inteiro: música **e** efeitos. **Não se troca efeito aprovado sem avisar o Pedro.** Trocar um whoosh, tirar o pouso ou mudar o clique do "pagar" é mudar a trilha que ele aprovou.
- O perfil `enxuto` (o da auditoria de 01/10) existe por batida, mas só entra com o OK dele.

## O que tem aqui

| arquivo | o que faz |
|---|---|
| `sfx_kit.py` | importa o `PR/src/sfx.py` original por `sys.path` (sem cópia, sem alteração) e reexporta `SR`, `Track`, `db`, `band`, `fade_in`, `pk` e as funções `s_*`. Traz os sintetizados que só existiam no `GP/mix_guia.py` (`s_papel`, `s_vibra`, `s_brilho`, `s_processa`, `s_conta`, com o código exato de lá), a `s_assinatura`, o `gera(som_id, args, catalogo)` e o `com_semente(n)` |
| `mixa.py` | o mixador: props e eventos da peça viram `audio/mix.wav` |
| `trilha.py` | janela da trilha pelo ponto do catálogo, loudness da janela, ganho automático e transposição |
| `testa_guia.py` | a prova contra o `GP/audio/mix-guia.wav` e as outras conferências do pacote |
| `assinatura.py` | gera as quatro propostas de assinatura sonora em `assinatura/` |
| `_regressao/eventos-guia-v2.json` | a tabela da seção 6 no formato da seção 4.6 (35 eventos, perfil v2, ruído legado) |
| `assinatura/` | `assinatura-do.wav`, `-mi.wav`, `-la.wav`, `-re.wav` e `assinatura.json` (status: proposta) |

Tudo em Python roda com `-B` (ou `PYTHONDONTWRITEBYTECODE=1`): importar o `sfx.py` original sem isso gravaria em `PR/src/__pycache__`, que já existe e não é do kit. Os módulos daqui também ligam `sys.dont_write_bytecode` antes de importar qualquer coisa.

## Comandos

```
PY=C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe

# mix de uma peça (é o que o kit.py mix chama)
$PY -B mixa.py KIT/pecas/<peça> [--props props.json] [--eventos eventos.json] [--saida audio/mix.wav] [--stems] [--relatorio] [--forca]

# prova do guia e conferências (sem --pasta, usa um temporário no Temp e apaga no fim)
$PY -B testa_guia.py [--pasta <pasta de teste>] [--guarda] [--registra] [--so-guia]

# janela da trilha: mStart pelo ponto, loudness e ganho automático
$PY -B trilha.py janela mixkit-04-house-one 10.3 [--ponto volta-62.011] [--dur 17]

# as quatro assinaturas
$PY -B assinatura.py [--d 1.2]
```

Caminhos relativos do `mixa.py` são relativos à pasta da peça. A saída é gravada por temporário e `os.replace` (`KIT/lib/escrita.py`), que recusa caminho protegido e hardlink (st_nlink > 1) sem `--forca`. O intermediário em f32 vai pra um temporário no Temp e é apagado no fim. O kit **não** grava em `GP/` nem em `RM/public-guia/` (o `mix_guia.py` original copiava o mix pra lá; o kit não copia).

## Como o mix funciona

Na mesma ordem e com as mesmas contas do `GP/mix_guia.py`:

1. **Efeitos**, na ordem do `eventos.json` (a ordem de emissão das batidas). Cada evento entra pelo `Track.place` do `sfx.py`: o pico do som é normalizado em 0 dBFS e recebe o `ganhoDb` do evento.
   - Sintetizado: a função do catálogo (`sintese.modulo` e `sintese.funcao`, no `sfx.py` ou no `sfx_kit.py`) com os `args` na ordem da função Python.
   - Composto (`sint-s_processa`, `sint-s_conta`): um evento só; a função devolve a lista de `(t, sinal, ganho)` e cada tique entra na ordem dela, no tempo dela (absoluto), com o `ganhoDb` do evento somado ao ganho interno (0 no guia).
   - Arquivo: decodificado com `ffmpeg -v error -i <arquivo> [-af filtro] -ac 1 -ar 48000 -f f32le -`, o mesmo comando do `carrega()` do `mix_guia.py`. Sem filtro e sem transposição não entra `-af` nenhum.
   - `inverte`: `sinal[::-1].copy()` (o whoosh que "chega" no símbolo).
   - `ancora: "sincronia"`: o arquivo começa em `t - sincronia_ms/1000` (o ponto de sincronia do catálogo cai em `t`). Com transposição de fita o ponto encolhe junto; com `areverse` ou `inverte` ele é contado do fim.
   - `transpor n`, só com n diferente de 0: método `fita` (padrão), `asetrate = taxa original x 2^(n/12)` e depois `aresample=48000` (tom e tempo juntos, como no v3); com `transporMetodo: "tom"`, o `rubberband` do ffmpeg (só o tom). `transpor: "trilha"` usa o `tom.transporVerificado` da trilha. **Transpor 0 ou ausente = nenhum filtro.** Com a Talent in the Air o 2867 entra no tom original.
   - Efeito `reprovado` no catálogo para o mix; `sem-verificacao` vira aviso.
2. **Voz**: com `voz.fecho "embutido"`, o `voz.arquivo` (o guia); com `"asset"`, o `voz.final` gravado pelo `kit.py voz-monta` (erro claro se ele não existir). Cadeia `highpass=f=75,lowpass=f=14500,acompressor=threshold=0.08:ratio=2.2:attack=8:release=120:makeup=1.6`, posição 0, pico normalizado em -1 dBFS.
3. **Trilha**: decodificada **inteira**, sem `-ss`, e fatiada no numpy a partir de `mStart` (`int(mStart * 48000)`). Ganho em dB (ou `"auto"`: -22,1 menos o LUFS da janela), abaixamento de 55% sob a voz (RMS de 10 ms, limiar 0,02, subida 0,25 e descida 0,033 por janela), fade de entrada de 0,03 s e de saída de 0,5 s, e a automação `[[s, dB]]` da cena quando houver. Trilha `reprovado` (todas as da Epidemic) para o mix; trilha que não está `liberado` só entra pela `decisaoRisco` do catálogo que vale pra peça, conferida pelo nome da PASTA da peça (desde 03/10, rodada 4: nunca pelo campo `peca` das props; em peça nova, só a decisão do Pedro com a peça escrita). Efeito que vem da Epidemic (pela fonte, url, licença ou arquivo) ou com licença NC ou ND também para o mix.
4. **Saída**: voz + trilha + efeitos, intermediário f32 no Temp, loudnorm em duas passadas (I -14, TP -1,5, LRA 9, `linear=true`) e WAV de 48 kHz, 16 bits, estéreo (o mono duplicado).

**Tamanho do mix (rodada 4, 03/10).** O mix tem sempre `quadros x 48000 / fps` amostras (1.600 por quadro a 30 fps), o tamanho exato do vídeo, e não mais `round(duracao x 48000)`. O `props.ts` arredonda os quadros (duração x 30): quando a fração de quadro arredondava pra cima, o mix saía até meio quadro mais curto e o `-shortest` da junção cortava 2 a 4 quadros do fim (823 de 826 na peça de 05/10, que contornou à mão com o `completa_mix.py` e o `audio/mix-826q.wav`). O conteúdo até a duração da cena é o mesmo de antes: a trilha some no fim da duração e o que sobra até o último quadro é o silêncio que o `completa_mix.py` punha; no guia (540 quadros, 18 s) o mix sai igual bit a bit. Sem `props.quadros`, os quadros saem como no `props.ts` (o `Math.round` de duração x fps). O relatório grava `formato.quadros`, `formato.fps` e `formato.duracaoVideo`. A junção (`KIT/scripts/juncao.py`) completa ou corta o mix antigo que difere em até um quadro.

Sobre o loudnorm: na passada 2 o ffmpeg só fica linear se o ganho linear não levar o pico real acima de -1,5 dBTP (e se a LRA medida couber em 9). No guia a entrada tem -20,6 LUFS e pico de -0,6 dBTP; o ganho linear de +6,6 dB levaria o pico a +6,0 dBTP, então o loudnorm volta pro modo dinâmico e a saída fica em -15,2 LUFS e -4,4 dBTP pelo ebur128 (os números do REF; é o "linear que não chega a -14" do DESENHO). A junção do vídeo corrige o nível. O relatório registra o modo da passada 2 e o motivo.

## A ordem do ruído

Os sintetizados com ruído (`s_whoosh`, `s_swish`, `s_tick`, `s_papel`, `s_riser`, `s_thump`, `s_burst`, `s_clack`, `s_roll`, `s_processa`, `s_conta`) tiram números do gerador `sfx.rng`. Dois modos (`sons.modoRuido` da cena, gravado no `eventos.json`):

- **`legado`** (só a regressão do guia): o gerador global do `sfx.py` (PCG64, semente 11) é consumido na ordem dos eventos, sem troca, exatamente como o `mix_guia.py`. Isso amarra cada som à posição dele na lista: acrescentar, tirar ou reordenar um som com ruído muda o ruído de **todos** os que vêm depois. Num processo novo o gerador já está no estado inicial; se o mesmo processo mixar de novo, o mixador volta o estado do mesmo objeto pra semente 11 e avisa.
- **`por-evento`** (o padrão das peças novas): cada som é gerado dentro de `com_semente(semente)`, com `semente = crc32(origem)` (o `nucleo/sons.ts` do K02 grava a semente no evento; se faltar, o mixador calcula do mesmo jeito). O som de um evento não muda quando outro é acrescentado ou tirado. Arquivos não usam ruído.

Eventos sem ruído (arquivos, `s_chime`, `s_pop`, `s_brilho`, `s_vibra`, `s_assinatura`) podem mudar de lugar na lista sem mexer no ruído. No guia, o `pixabay-316482` (link-bio) fica no fim da lista e no `mix_guia.py` ele entra antes dos dois chimes: dá no mesmo, porque a cauda decodificada dele é zero exato a partir de 0,312 s.

## Perfis

- `v2`: **o aprovado**. Gancho com whoosh e brilho; três swishes no "não"; whoosh 405445 no mergulho e pop 197886 quando o app abre; chime e os tiques de "processando" no card; swipe 186577; papel e whoosh na guia; vibração dupla e ping 570438 no relógio; whoosh 166, pouso 1897 e whoosh sintetizado no flip; tique, clique 1109 e verificado 2867 no "pagar"; whoosh e brilho no recuo; whoosh, whoosh invertido, pop, dois chimes (sol6 + dó7) e swish no fecho; pop 316482 no link; whoosh na volta do loop. A tabela completa está na seção 6 do DESENHO e em `_regressao/eventos-guia-v2.json`.
- `enxuto`: o da auditoria de 01/10 (um clique só, o 1490 invertido no flip, o contador `s_conta`). Fica disponível por batida, só com o OK do Pedro.

## Formato dos eventos (seção 4.6)

`{versao: 1, peca, cena, duracao, perfil, modoRuido, eventos: [...]}`, cada evento `{ordem, t, som, ganhoDb, args?, filtro?, inverte?, ancora?, transpor?, transporMetodo?, semente?, origem}`. `t` em segundos com 6 casas; `origem` é `<batida>#<índice do som>` (ou `cena#<índice>` nos extras). `transpor` só aparece quando é diferente de 0.

## Relatório e stems

- `--relatorio` grava o JSON ao lado da saída (`audio/mix.json`, ou `audio/mix-kit.json` pra `--saida audio/mix-kit.wav`): md5 e formato da saída, voz e trilha com os comandos de decode, cada evento com o tempo pedido, a amostra real (`amostra`, `tAmostra`), o pico (`picoDbfs` e `tPico`), o comando de decode dos arquivos e os tiques dos compostos; loudness de entrada (passada 1 do loudnorm) e de saída (ebur128 no arquivo), o modo da passada 2 e os avisos.
- `--stems` grava `audio/mix-voz.wav`, `mix-trilha.wav` e `mix-efeitos.wav` (48 kHz, 16 bits, estéreo), multiplicados pelo ganho médio do loudnorm. Com o loudnorm no modo dinâmico (o caso do guia) a soma deles fica perto do mix, mas não igual.

## Janela da trilha (`trilha.py`)

- `janela(trilha, momento, ponto)`: `mStart = ponto.t - momento`, em 6 casas; erro se der negativo ou se passar do fim do arquivo. Sem ponto, usa o da primeira janela do catálogo. Exemplo: House One, ponto `volta-62.011`, momento 10,3 s: `mStart` 51,711.
- `lufs_janela(arquivo, mStart, dur)`: ebur128 do ffmpeg no trecho, nos canais originais do arquivo.
- `ganho_auto(lufs) = -22,1 - lufs`. Calibrado no catálogo, que mediu as janelas em 17 s: Talent in the Air (janela B) dá -13,1 LUFS e -9,0 dB; House One dá -15,4 LUFS e -6,7 dB. Com `ganhoDb: "auto"` o mixador mede a janela com a duração da peça (no guia, 18 s dariam -13,0 LUFS e -9,1 dB).
- `transposicao(trilha)`: o `tom.transporVerificado` (0 quando não há).

## A prova (`testa_guia.py`)

1. O guia bit a bit: o `mixa.py` com a fixture, a voz `GP/vo/narr-dylan.wav`, a Talent in the Air a partir de 5,448 s a -9,0 dB e 18 s refaz o `GP/audio/mix-guia.wav` com os int16 idênticos (e o arquivo igual byte a byte, md5 `80dd068e3dde76d25812766e54cf7d18`, o do REF). Se um dia diferir, o resultado aponta o evento que cobre as amostras diferentes.
2. O comando do 2867: o decode do evento com transpor ausente, 0 ou `"trilha"` (com a Talent) é o mesmo do `carrega()` do `mix_guia.py` (lido pela árvore do Python), sem `-af`. Só o caminho de entrada muda: o catálogo aponta o `mixkit-2867` pro `musica-v2/sfx/`, cópia com o mesmo md5 da que o `mix_guia.py` lê em `mixkit/sfx/`; o sinal decodificado é idêntico.
3. Duas rodadas no modo `por-evento` dão o mesmo md5.
4. No `por-evento`, um efeito a mais no começo da lista não muda nenhuma amostra dos outros; no `legado` muda.
5. `pixabay-405445` com `ancora: "sincronia"` em t = 1,0 tem o pico em 1,000 ± 0,005 s: no relatório, na trilha de efeitos e no arquivo final (lá a posição sai da correlação com o próprio efeito, porque o loudnorm dinâmico limita o pico real e outro pulso do whoosh fica mais alto).
6. As quatro assinaturas existem, em 48 kHz, mono, 16 bits e com menos de 150 KB.
7. Nenhum `__pycache__` novo, o de `PR/src` igual ao do começo, e zero travessão nesta pasta.

Desde a rodada 4 (03/10) a pasta de teste temporária tem o nome da peça de teste das props (`_teste-guia-k05`, dentro de um temporário no Temp), porque a regra da trilha vale pela pasta: a Talent in the Air passa ali com o aviso de peça de teste. Com `--pasta`, use uma pasta cujo nome comece com `_`.

Medido em 02/10 (o último resultado fica em `_regressao/resultado-testa-guia.json` quando o teste roda com `--registra`): as 7 provas passam. Também conferido no mesmo dia: com as props e os eventos que o núcleo do K02 gera da `cenas.json` do guia (`RM/src/kit/testes/props-guia.mjs` e `eventos-guia.mjs`, com a voz apontando pro `GP/vo/narr-dylan.wav`), o `mixa.py` dá o mesmo md5 do `mix-guia.wav`; e a `cenas-periodico-22s.json` (por-evento, 22 s) dá o mesmo md5 em duas rodadas.

## Assinatura sonora (proposta)

`s_assinatura(tom='do', d=1.2)`: pop curto `s_pop(900, 420, 0.1, 34)`, duas notas `s_chime` em quinta no tom (a de cima 0,12 s depois e um pouco mais baixa) e um `s_brilho` bem baixo no fim, com fade de saída e normalizada. Tons: dó (dó6 + sol6), mi (mi6 + si6), lá (lá5 + mi6) e ré (ré6 + lá6). Não usa ruído. Os arquivos ficam em `assinatura/` com `assinatura.json`, status **"proposta: o Pedro ouve antes de virar padrão"**. Até ele ouvir, o fecho aprovado do guia continua sol6 + dó7 (`s_chime` 1567,98 e 2093,0 no "aí"). Nada aqui foi ouvido por gente: foi medido.
