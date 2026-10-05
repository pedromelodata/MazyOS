# Kit de motion do Legalizaí

O kit faz vídeos curtos de motion (9:16, 30 fps) no estilo do reel da guia de 14/10: celular 3D com a tela do app, legenda Apple, os efeitos aprovados, o fecho "Vai, Legalizaí" e o fim em loop. Cada vídeo é uma pasta em `KIT/pecas/` com um `cenas.json` (o que aparece e quando), a narração alinhada e as telas. Um script só, o `kit.py`, monta tudo, confere o texto contra o FATOS, renderiza, mede o resultado e entrega na pasta final. Quanto tempo um vídeo novo leva de verdade está na seção "Quanto tempo leva um vídeo novo": com o que o kit já tem, uns 3h45 de trabalho (3h10 a 4h40, contando a revisão independente e a correção depois dela), 15 a 20 min de máquina e 3 aprovações do Pedro; com cena nova, uns 5h30.

Este README é o passo a passo. As regras e o que conferir antes de postar estão no `KIT/CHECKLIST.md`. O status e a licença de cada trilha, efeito, modelo e tela estão no `KIT/FONTES.md`. O contrato técnico é o `KIT/DESENHO.md` (ninguém edita).

## Siglas e as linhas que abrem tudo

Os comandos são pro Git Bash. Copie estas linhas uma vez em cada terminal novo:

```bash
PY="C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe"
KIT="C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion"
RM="C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion"
PECA="2026-10-21-nome-curto"
```

`PECA` é o nome da pasta do vídeo: a data do post e um nome curto, sem espaço e sem acento. Troque pelo do seu vídeo. Peça de teste começa com `_` (seção "Peça de teste").

Siglas usadas nos documentos do kit:

- `KIT` = `C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion`
- `RM` = `C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion` (o projeto Remotion)
- `GP` = `C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/guia-pronta-2026-10-14` (o reel da guia original)
- `FINAL` = `C:/MKT-INSTA/Content Legalizai/marketing/final` (vídeos prontos, uma pasta por proposta)
- `BASE` = `C:/MKT-INSTA/Content Legalizai/_base-contabil` (`FATOS.md` e `PROIBIDO.md`)
- `MEM` = `C:/Users/EDIT-ADMIN/.claude/projects/c--MKT-INSTA/memory` (a memória do projeto)

Todo comando aceita `--help` (mostra as opções) e `--simula` (mostra o que faria, sem fazer). A lista completa está no fim deste arquivo.

## Quanto tempo leva um vídeo novo

Medido nos registros das sessões de 02 e 03/10/2026 e recalculado pela verificação de completude da rodada 3 do kit (03/10). A meta antiga, de 45 a 75 min de trabalho, não se confirmou, e a conta de 2h45 da rodada 2 também não: ela deixava de fora a revisão independente e a correção que vem depois dela, que toda peça teve. São três relógios diferentes:

- **Máquina:** os comandos rodando (render, stills, prévia, whisper, fila do Higgsfield). Não depende de ninguém, mas depende de disco livre e da vez na trava de render.
- **Trabalho:** o de quem monta, nas sessões do Claude: roteiro, voz, telas, cena, ajustes, final, conferência à mão, **a revisão independente** (imagem, regras e áudio, por outras sessões) **e a correção que vem depois dela**.
- **Espera do Pedro:** os portões em que ele aprova (o roteiro antes da voz; a prévia, o mix e a capa antes do render; o final antes de postar) e as decisões que só ele toma.

**A base: a peça de 05/10** ("Contabilidade tradicional vs Legalizaí": 27,5 s, 37 batidas, 22 delas novas numa extensão própria, que desde 03/10 são do kit, seção "Biblioteca de batidas"; objetos de argila vindos do carrossel e 8 telas por receita). Ela foi das 19:59 de 02/10 às 00:52 de 03/10: 4h53 de relógio, com uns 30 min de máquina e nenhum portão do Pedro (as aprovações dele ficaram pendentes). Por etapa:

| etapa | relógio | máquina dentro dela |
|---|---|---|
| roteiro, mais a revisão das regras | 60 min (39 + 21) | quase nada |
| voz: TTS, voice_change, o gancho refeito, alinhamento e fecho | 33 min | uns 5 min (fila do Higgsfield e whisper) |
| montagem: 8 receitas de tela, 22 batidas novas em código, a cena, a prévia e a capa | 70 min | uns 9 min (2 prévias de 1,7 min e stills de conferência) |
| final: render, junção, conferência e um conserto com render de novo | 23 min | uns 6 min (2 renders de 78 s) |
| revisão independente (imagem, regras e áudio, em paralelo) | 29 min | uns 3 min |
| correção depois da revisão | 1h15 (de 23:37 a 00:52) | uns 4 min (stills de 85 s, render de 88 s e stills de novo) |

Ela reaproveitou o carrossel feito antes, das 17:13 às 19:56 (argila, luz, conceito e 5 receitas de tela), e a volta do Pedro ainda não aconteceu.

**O teste de usuário novo** (02/10, de 23:06 a 23:44: peça de 9 s com 3 batidas prontas, narração reaproveitada e 2 receitas do guia) levou 13 min de trabalho, uns 2 min de máquina (prévia 26 s, capa 7,5 s, final 57 s e conferência 8 s) e 25 min esperando disco (o C: caiu a 272 MB).

**O que esperar: o tempo médio realista** de uma peça no estilo do guia. **O trabalho já conta a revisão independente e a correção depois dela**, e uma volta de correção depois do Pedro:

| tipo de peça | trabalho, com a revisão independente e a correção | máquina (dentro do trabalho) | tempo do Pedro | relógio |
|---|---|---|---|---|
| variação curta: narração que já existe, batidas e telas prontas, 8 a 12 s | 15 a 30 min | 2 a 5 min | 5 min (o final) | menos de 1 h |
| peça nova de 18 a 28 s só com o que o kit já tem (batidas, objetos e telas com receita) | **uns 3h45** (3h10 a 4h40) | 15 a 20 min | 25 a 40 min, em 3 portões, contando o YouTube não listado | 5 a 6 h no mesmo dia; com meio dia por portão, 1,5 a 2 dias |
| peça com cena nova (batidas novas numa extensão ou objeto feito em código), como foi a de 05/10 | **uns 5h30** (5h a 6h) reaproveitando objeto e luz prontos; 6h30 a 7h sem eles | 25 a 35 min | 35 a 50 min, em 4 portões (os stills da cena nova são o quarto) | 7 a 8 h no mesmo dia; senão, 2 dias |

Uma peça no estilo da de 05/10 (vitrines, argila do carrossel, cartões saindo da tela) agora é "só com o que o kit já tem": desde 03/10 o palco de argila, os objetos e as batidas dela estão na extensão comum (seção "Biblioteca de batidas").

Na peça nova só com o que existe, o trabalho se divide assim: roteiro e conferência das regras, 40 a 55 min; voz, 25 a 35; montagem (telas, cena, prévia, capa e ajustes), 40 a 60; final e conferência à mão, 15 a 20; **revisão independente, 20 a 30; correção depois dela, 30 a 45**; uma volta de correção depois do Pedro, 20 a 35. A máquina: voz uns 2 min, prévia 1,5 a 2 min, capa 10 s e final 1,5 a 2,5 min (o render leva uns 3 s por segundo de vídeo: 52 s pra 18 s e 78 s pra 27,5 s), contando um segundo final, que a revisão quase sempre pede.

Premissas da conta: uma revisão independente, com a correção dela; uma volta do Pedro; no caso com cena nova, o reaproveitamento de objeto e luz prontos, como a peça de 05/10 reaproveitou o carrossel; e o tempo de resposta do Pedro, que não foi medido (os relógios supõem até 30 min por portão, ou meio dia).

Fora da conta, e soma quando acontece:

- disco: o render pede 400 MB livres; no teste de 02/10 foram 25 min de espera, e uma sessão de construção do kit esperou 2h20;
- a vez na trava de render, com outra sessão renderizando (o kit espera sozinho, até 40 min);
- trilha que não seja as 2 liberadas: depende da AudD (dias) e do ouvido do Pedro;
- modelo 3D que ainda não está no catálogo: download, limpeza, catálogo e prova (`KIT/modelos/LEIA-ME.md`); os 44 que já entram não custam nada a mais;
- sessão que lê este README pela primeira vez: mais 15 a 20 min.

O corte de quadros na junção, que a peça de 05/10 contornou à mão, foi consertado em 03/10 (seção "Problemas conhecidos") e não soma mais.

## Antes de começar: o doutor

```bash
"$PY" -B "$KIT/scripts/kit.py" doutor
```

Leva 5 a 7 s (medido: 6,9 s). Confere o ffmpeg 9, o node 26, a pasta `RM/bin` com caminho absoluto, o navegador do render, a fonte Sora, os dois Pythons, o whisper small, os hardlinks do public-kit, mídia de extensão ligada, os catálogos, a referência congelada do guia, o disco e quem está renderizando.

- Tudo `ok`: pode seguir.
- `VERMELHO` na referência: algo do reel da guia mudou. Pare e avise; não regrave nada do `GP`.
- Disco: o render pede 400 MB livres e os stills, 250 MB. Abaixo de 500 MB o doutor avisa. Liberar espaço é decisão do Pedro.
- Trava de render e renders rodando: o doutor diz se a trava está livre ou com quem (peça, comando, PID e desde quando), lista os renders do Remotion rodando agora (do kit ou de fora dele) e as pastas de Temp esquecidas, por peça. Render rodando não é erro: o kit espera a vez sozinho.
- Aviso de mídia de extensão ligada: rode o `ext-desliga` (seção "Uma camada 2D").
- Aviso de pastas de render na raiz do Temp: são de render fora do kit ou de antes da trava. `kit.py limpa --tudo` apaga, e o kit recusa enquanto alguém renderiza. Sobras de uma peça só: `kit.py limpa "$PECA"`.

**Um render ou stills por vez na máquina, também entre sessões: o kit garante sozinho.** O render, os stills, a prévia, a capa e o final esperam a vez numa trava única e mostram quem está na frente; quem está com ela fica registrado em `C:/Users/EDIT-ADMIN/AppData/Local/Temp/kit-motion/trava-render.json` (PID, hora, peça e comando). A espera vai até 40 min (`--espera N` muda). Esgotado o tempo, o comando sai com código 3 sem rodar nada. Render de fora do kit, como um `npx remotion render` direto, também é esperado. Cada execução roda o Remotion e o Chrome num Temp próprio, dentro dessa mesma pasta `kit-motion`, e apaga só ele no fim: a limpeza de uma sessão não derruba mais o render de outra. Pra ver só esse pedaço do doutor:

```bash
"$PY" -B "$KIT/scripts/trava.py"
```

## Passo a passo de um vídeo novo

Os tempos de cada passo são de 02/10/2026, num vídeo de 18 s, e conferem com o teste de usuário novo. "Medido" quer dizer cronometrado; o resto é estimativa. O total está na seção "Quanto tempo leva um vídeo novo".

### 1. Criar a pasta da peça

```bash
"$PY" -B "$KIT/scripts/kit.py" nova "$PECA"
```

Cria `KIT/pecas/$PECA/` com o `cenas.json` (copiado do `KIT/pecas/_modelo/cenas.json`), o `roteiro.md` (do `KIT/voz/roteiro.modelo.md`), `telas/receitas/_modelo.json` e a pasta `voz/`. Troca na cena só o nome da peça (`peca` e o caminho das telas) e, quando o nome começa com a data (`2026-10-21-...` ou, em peça de teste, `_2026-10-21-...`), o `dataPost`; com nome sem data, o `dataPost` fica `AAAA-MM-DD` e você preenche. O texto de ajuda da cena fica como está. Nunca grava por cima. Tempo: 1 s (medido: 0,16 s).

### 2. Roteiro aprovado batida por batida

Preencha o `roteiro.md` da peça: título da proposta, pilar, público (ME, MEI ou os dois), capa, a narração e a tabela de batidas. O título também vai no `titulo` da cena (passo 6): é ele, com o `dataPost`, que vira a pasta `FINAL/<dataPost> <título>/`.

- Narração: uma frase da legenda por linha, com a palavra-chave de cada frase entre asteriscos (`*pronta*`). O fecho não entra: ele é fixo.
- Batidas: qual movimento cai em qual palavra, e o que a imagem faz nessa hora.
- Fato só do `BASE/FATOS.md`. Nada que ensine a fazer sozinho: o caminho é sempre o app.

**Quanto cabe: o fecho fixo ocupa o fim.** Faça a conta antes de gastar crédito na voz:

- duração = fim da fala + 3,44 s (o tFecho fica 0,44 s depois da última palavra, e o vídeo acaba 3 s depois dele);
- o app começa a fechar 1,55 s antes do tFecho; as batidas de conteúdo cabem de 0,1 s até aí;
- a última frase toca enquanto o app fecha: ela tem de ser uma frase de saída, que não precisa de imagem (como "Chegando em breve.");
- o quadro 0 mostra o splash, porque o fecho volta pro splash e o loop é conferido; então a primeira batida de conteúdo abre o app (`mergulho-abre-app`, do `splash` pra outra tela);
- o som de uma batida pode vir antes do `t` dela (o whoosh do mergulho toca 0,08 s antes), e som antes de 0 s é erro ("tempo fora do vídeo"): comece em 0,1 s ou mais.

Exemplo de 9 s (o teste de 02/10): fala até 5,56 s, tFecho 6,00 s, duração 9,00 s e o app fechando em 4,45 s. Couberam 3 batidas de conteúdo. No guia, de 18 s, a fala vai até 14,56 s e o app fecha em 13,45 s.

Pra ver os movimentos que existem (a lista comentada está na seção "Biblioteca de batidas"), com os padrões e os sons de cada um:

```bash
"$PY" -B "$KIT/scripts/kit.py" batidas
```

O Pedro aprova o roteiro antes de gerar a voz. Tempo: 30 a 45 min, mais a revisão dele.

### 3. Voz

1. TTS no Higgsfield: seed_audio com o clone `Pedro-Legalizai` (id `e43fbc58-8149-4319-85de-cf713696b8a4`), cerca de 0,007 crédito por caractere (290 caracteres dão 2 créditos). Salve como `voz/narr-pedro-raw.wav` na pasta da peça.
2. Prepare o vídeo leve que o voice_change pede:

```bash
"$PY" -B "$KIT/scripts/kit.py" voz-prepara "$PECA"
```

3. No Higgsfield, suba o `voz/para-voz.mp4` e rode o voice_change com o timbre Dylan (preset `b847bc29-f184-583a-8ad9-d1f1e16d1a60`, cerca de 3 créditos por 27 s). Baixe o vídeo devolvido e guarde o caminho dele em `VIDEO`.
4. Extraia a voz e confira o atraso:

```bash
VIDEO="C:/caminho/do/video-devolvido.mp4"
"$PY" -B "$KIT/scripts/kit.py" voz-recebe "$PECA" "$VIDEO"
```

Sai `voz/narr-dylan.wav`, com o atraso conferido (o voice_change mantém o tempo). Tempo: 20 a 30 min, com a fila do Higgsfield e a escuta.

**Narração que já existe** (versão de um reel, teste sem gastar crédito): grave o trecho como arquivo novo em `voz/narr-dylan.wav` da peça (48 kHz, mono, 16 bits, sem o fecho, cortado num silêncio) pelo `KIT/lib/escrita.py`, nunca por hardlink do `GP`, e siga do passo 4. Ficam de fora o TTS, o `voz-prepara` e o `voz-recebe`. Troque a origem, o trecho e o `<peça>` das duas primeiras linhas (no teste de 02/10, o trecho de 8,95 a 14,90 s do `GP/vo/narr-dylan.wav`; levou 10 s):

```bash
"$PY" -B - <<'FIM'
import io, subprocess, sys, wave
ORIGEM, DE, ATE = "C:/caminho/da/narracao.wav", 8.95, 14.90
DESTINO = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion/pecas/<peça>/voz/narr-dylan.wav"
sys.path.insert(0, "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion/lib")
import escrita
pcm = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(DE), "-to", str(ATE), "-i", ORIGEM, "-ac", "1", "-ar", "48000",
                      "-f", "s16le", "-"], capture_output=True, check=True).stdout
buf = io.BytesIO()
with wave.open(buf, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000); w.writeframes(pcm)
escrita.grava_bytes(DESTINO, buf.getvalue())
FIM
```

### 4. Alinhamento e fecho

```bash
"$PY" -B "$KIT/scripts/kit.py" voz-alinha "$PECA"
"$PY" -B "$KIT/scripts/kit.py" voz-monta "$PECA"
```

O `voz-alinha` roda o whisper small, sem prompt, e grava `voz/narracao.json` (palavras, frases, tFecho e duração) e `voz/alinhamento.md`. Confira as marcas do `alinhamento.md` (palavra sem par, refino). O texto da legenda vem do roteiro; o whisper só dá o tempo. Em peça nova vale o alinhamento padrão, com o refino pelo silêncio; o `--sem-refino` foi usado só na regressão do guia.

O `voz-monta` põe o fecho fixo "Vai, Legalizaí" no tFecho, com o nível casado pela fala, e grava `voz/voz-final.wav`. Tempo: 10 s (medido: 9,4 s no guia; 6,3 s + 4,0 s no teste), mais uns 2 min de conferência.

### 5. Telas

As 4 telas do guia já têm receita pronta em `KIT/telas/receitas/`: `guia-splash.json`, `guia-inicio.json`, `guia-inicio-pagar.json` e `guia-imposto.json` (as `guia-v3-*` são das telas antigas). Se servem, copie as que usar pra `telas/receitas/` da peça. Pra tela nova, escolha a captura pela revisão das telas (`KIT/telas-revisao/REVISAO.md`): só as liberadas, ou as aceitas com risco com os cortes que ela manda. Escreva uma receita por tela; o `_modelo.json` explica cada campo. Depois:

```bash
"$PY" -B "$KIT/scripts/kit.py" telas "$PECA"
```

Saem as PNG, o `telas/regioes.json` e a folha `telas/qa.jpg`, e as telas ficam ligadas no public-kit. Olhe o `qa.jpg`. Tempo: 2 s por rodada (medido: 0,56 s com 2 receitas prontas do guia, iguais ao REF); 10 a 20 min pra escrever uma receita nova.

### 6. Cena

Edite o `cenas.json` da peça. Comece pelo `titulo` (o título da proposta do roteiro) e pelo `dataPost` (`AAAA-MM-DD`, a data do post): os dois viram a pasta final, e o `kit.py props` recusa título vazio ou data fora do formato. Depois: objetos (qualquer um dos 44 modelos do catálogo que entram numa peça; tamanho, orientação, cor e o GLB no public-kit na seção "Um modelo 3D"), telas, trilha, batidas presas às palavras, fatos (público e valores de exemplo, com a origem) e capa. Cada bloco do modelo tem um `_ajuda` explicando o campo. Pra ver o índice e o tempo de cada palavra:

```bash
"$PY" -B "$KIT/scripts/kit.py" palavras "$PECA"
```

Duas regras da cena que o kit trava (rodada 4, 03/10):

- **O público é obrigatório.** `fatos.publico` é "ME", "MEI" ou "todos"; o modelo nasce vazio e, vazio, o `kit.py props` e o `kit.py fatos` recusam. Só "ME" deixa aparecer valor de guia: "MEI", "todos" e vazio são conferidos como MEI, a regra mais restrita (passo 8).
- **A peça é a pasta.** O `"peca"` da cena tem de ser o nome da pasta da peça. Cena copiada de outra peça (pra uma variação curta, por exemplo) é recusada até você trocar o `"peca"`: a decisão de risco da outra peça (a trilha aceita com risco, os modelos aceitos com risco) não vem junto, e a exceção da peça de teste vale só pra pasta que começa com `_`.

Tempo: 20 a 30 min.

### 7. Prévia

```bash
"$PY" -B "$KIT/scripts/kit.py" previa "$PECA"
```

Gera as props, os eventos de som, a trava de fatos, a checagem da legenda, o mix (`audio/mix.wav`) e um still por momento de batida numa folha (`provas/previa.jpg`). O Pedro olha a folha e ouve o mix antes do render. Na prévia, erro de fatos ou de legenda não para; no final, para. Tempo: cerca de 1 min (medido: 26 s com 15 stills no teste; 1,7 min com 63 stills na peça de 05/10).

Os stills imprimem dezenas de "THREE.Clock: This module has been deprecated" e "warning X4122": são avisos do three.js e do navegador, normais, e não são erro. Se outra sessão estiver renderizando, a prévia espera a vez e diz quem está na frente.

### 8. Fatos

```bash
"$PY" -B "$KIT/scripts/kit.py" fatos "$PECA"
```

Confere o roteiro e todo texto que aparece contra o `BASE/FATOS.md` e o `BASE/PROIBIDO.md`: valor em R$, percentual, datas e prazos (inclusive em horas e minutos, por extenso e com ponto ou hífen: "15.06", "15-06-2027", "15 junho"), prazo prometido ("CNPJ em 1 dia", "no mesmo dia", "em uma hora", "em 5 minutinhos", "em 1 semana"), fazer sozinho com qualquer verbo, inclusive no passado ("Eu abri meu MEI sozinha", "Gere sua guia sozinho"), "quem abre é você" e "é você quem abre", "canal oficial", entrar, acessar, abrir ou usar o portal, o e-CAC, o PGMEI, o site ou o app da Receita ou do governo, e "no portal" como lugar ("No portal, clique em Emitir Guia"), "abrir MEI é de graça", gov.br, promessa de resultado, escassez, download, concorrente, "link abaixo", bastidor, a gente pagando a guia ("Eu já paguei sua guia"), pagamento como status ("pago", "guia paga", "Status: paga", "Pagamento OK", "Liquidada"), travessão e os outros traços e o selo de construção. A negação só rebaixa pra aviso quando governa o verbo na mesma oração ("sem entrar no site do governo", "não precisa fazer nada sozinho"); separada por vírgula ou dois-pontos, ou com outras palavras no meio ("Sem complicação, entre no portal"), não rebaixa a forma direta. Com mais de um fato pro mesmo número, a trava cita primeiro o que vale pro público da peça. Com erro, o final não roda, e não há opção de ignorar. O conserto é mudar o texto ou declarar o valor ou a data fictícia em `fatos.exemplos` da cena, sempre com a origem (sem origem, o exemplo não vale). Tempo: menos de 1 s (medido: 0,2 s).

A trava gravada (`qc/fatos.json`) guarda o md5 das props, do roteiro e da base e a versão das regras: o render, a junção e a entrega conferem que ela é das props de hoje (passo 12).

**F063 por padrão: peça de MEI, pra todos ou sem público.** O valor da guia do MEI nunca aparece, e o kit confere como MEI toda peça que não é "ME" (MEI, todos ou o público vazio, que além disso é erro). Nessas peças, a folha DAS e o comprovante vão com `"conteudo": {"mostraValor": false}` (o valor vira esqueleto), não entra o extra `contador` (ele desenha o valor sempre em R$, em qualquer formato), nem o cartão do imposto do palco de argila, e só entram telas de captura que servem MEI (`servePecaMei` no catálogo; as 4 telas do guia, menos a splash, mostram o valor de exemplo e são recusadas), também como imagem de camada 2D (`src` de tela). O `kit.py telas`, o `kit.py props`, o `kit.py fatos` e o `kit.py confere` travam.

**Tela sem origem no catálogo não entra em peça nenhuma.** Toda tela, e toda imagem de camada 2D que é tela, tem de vir de uma receita da peça com captura do catálogo, ou ser uma das 4 montadas do guia. Print de fora ou captura copiada com outro nome é recusada, em qualquer público.

### 9. Capa

```bash
"$PY" -B "$KIT/scripts/kit.py" capa "$PECA"
```

Grava `saida/capa.png` (1080x1920) e `saida/capa-grade.jpg` (o recorte 4:5 que aparece na grade do perfil), com o título da cena em Sora 800 e a palavra de destaque em coral. `--quadro N` troca o quadro do fundo e `--titulo` troca o título. O nome da marca não vai na capa. O Pedro aprova junto com a prévia. Tempo: uns 10 s (medido: 7,5 s; 1,1 s com um still pronto, `--still`).

### 10. Final

```bash
"$PY" -B "$KIT/scripts/kit.py" final "$PECA"
```

Faz props, eventos, fatos (para com erro), qc da legenda (para com invasão), mix, 6 stills, render com o vigia de disco, junção com a loudness corrigida, conferência e limpeza das sobras da peça. Os stills e o render passam juntos pela trava de render: outra sessão não entra no meio. Saem `saida/$PECA.mp4`, `saida/relatorio.md`, `saida/folha.jpg` e `saida/creditos.txt` (o crédito pronto pra legenda do post). Precisa de 400 MB livres. Tempo: 1 a 2,5 min (medido: 57 s com render de 35 s pra 9 s; uns 70 s com render de 52 s pra 18 s; render de 78 s pra 27,5 s).

Rodando as etapas avulsas (`kit.py render`, `kit.py juncao`), vale o mesmo portão: as duas recusam sem a trava de fatos ok das props de hoje (passo 8), sem opção de ignorar. O mix sai sempre do tamanho exato do vídeo (quadros x 1600 amostras a 30 fps), e a junção completa com silêncio, ou corta, o mix que difere do mudo em até um quadro (um mix feito antes de 03/10) e confere que o final tem os mesmos quadros do mudo. Final com nome próprio: `kit.py juncao "$PECA" --saida "$KIT/pecas/$PECA/saida/NOME-DA-PROPOSTA-motion.mp4"`.

### 11. Conferência

Leia o `saida/relatorio.md`: tudo tem de estar ok. Se ele disser "conferir antes de postar" num efeito do Pixabay, siga o item do CHECKLIST (parte 2). Depois confira o vídeo quadro a quadro, à mão, com a folha `saida/folha.jpg` (parte 2 do CHECKLIST). Pra rodar a conferência automática de novo:

```bash
"$PY" -B "$KIT/scripts/kit.py" confere "$PECA"
```

Tempo: segundos a automática (medido: 8 s); 5 a 10 min a de mão.

A prova de colisão (`kit.py colisao "$PECA"`, uns 60 s; o relatório sai em `qc/colisao.md`) tem de dar zero antes do final: nada 3D entrando em outro, nada 3D na faixa da legenda nem atrás do fecho, e nenhum toque aparente sem `permitidos` ou `encostaEm`.

### 12. Entrega e sobras

```bash
"$PY" -B "$KIT/scripts/kit.py" entregar "$PECA" --simula
"$PY" -B "$KIT/scripts/kit.py" entregar "$PECA"
```

Liga o final (hardlink, sem cópia) em `FINAL/<dataPost> <titulo>/`, move a versão anterior pra `FINAL/_versoes-anteriores/` e avisa se ela também existe em `C:/Users/EDIT-ADMIN/Videos/`. Mostra a linha pra pôr no `FINAL/LEIA-ME.md`: o kit não edita esse arquivo. Recusa título vazio e `dataPost` que não seja uma data. Peça de teste só vai pra uma raiz falsa (seção "Peça de teste"). Tempo: segundos.

**O portão da entrega (rodada 4).** O `entregar` só liga o mp4 com a trava de fatos ok das props de hoje e com o relatório do confere ok **do mesmo mp4** (o `saida/relatorio.json` guarda o md5 do vídeo conferido e o das props). Mexeu nas props ou trocou o vídeo depois do confere: rode o `kit.py fatos` e o `kit.py confere` de novo. Não há opção de ignorar; só peça de teste passa, com aviso. Pra entrar no padrão de nome das pastas do FINAL (`NOME-motion.mp4`), use `--nome`; se o final saiu com nome próprio, `--arquivo` e o confere com o mesmo `--video`:

```bash
"$PY" -B "$KIT/scripts/kit.py" confere "$PECA" --video "$KIT/pecas/$PECA/saida/NOME-DA-PROPOSTA-motion.mp4"
"$PY" -B "$KIT/scripts/kit.py" entregar "$PECA" --arquivo "$KIT/pecas/$PECA/saida/NOME-DA-PROPOSTA-motion.mp4" --nome NOME-DA-PROPOSTA-motion.mp4 --simula
```

Sem `--arquivo`, o `kit.py entregar "$PECA" --nome NOME-DA-PROPOSTA-motion.mp4` entrega o `saida/$PECA.mp4` com esse nome.

Depois da aprovação e da entrega, apague as sobras da peça:

```bash
"$PY" -B "$KIT/scripts/kit.py" limpa "$PECA" --entregue --simula
"$PY" -B "$KIT/scripts/kit.py" limpa "$PECA" --entregue
```

Apaga `provas/stills/*.png` (os 6 stills do final e o da capa), os mudos de `saida/`, os links das telas em `RM/public-kit/pecas/$PECA/` e os dos modelos 3D em `RM/public-kit/3d/biblioteca/<id>.glb` (fica o que outra peça em andamento usa), que pesam em todo render seguinte, porque o render copia o public-kit inteiro. Ficam o final, o relatório, a folha, a capa, os créditos e o mix. Só roda com o final já entregue (um mp4 de `saida/` com hardlink fora da peça) e nunca apaga um hardlink. Peça parada no meio do trabalho: `kit.py telas "$PECA" --desliga` tira só os links das telas (`kit.py telas "$PECA" --so-liga` liga de novo).

## Peça de teste

Pra testar o kit sem risco de entregar no FINAL de verdade:

- O nome começa com `_`, de preferência `_AAAA-MM-DD-slug` (por exemplo `_2026-10-30-teste-kit`): o `kit.py nova` preenche o `dataPost` com a data depois do `_`. Com outro nome, preencha o `dataPost` à mão (o `kit.py props` recusa o `AAAA-MM-DD` do modelo).
- O que conta é o nome da **pasta**, nunca o `"peca"` da cena (que tem de ser igual a ele): renomear a pasta de teste pra publicar não leva a exceção junto, e copiar a cena de uma peça de teste pra outra pasta é recusado até trocar o `"peca"`.
- Na peça de teste, os portões do render, da junção e da entrega (trava de fatos e relatório do confere, passo 12) só avisam; a trilha aceita com risco fora da peça da decisão também passa, com aviso.
- O `kit.py entregar` recusa peça com `_` no FINAL de verdade (lá, só o `--simula` roda). A entrega de teste vai pra uma raiz falsa no scratchpad, com `--raiz-final`:

```bash
PECA="_2026-10-30-teste-kit"
FALSO="C:/caminho/do/seu/scratchpad/final-falso"
"$PY" -B "$KIT/scripts/kit.py" entregar "$PECA" --raiz-final "$FALSO" --simula
"$PY" -B "$KIT/scripts/kit.py" entregar "$PECA" --raiz-final "$FALSO"
```

Troque o `FALSO` por uma pasta no scratchpad da sua sessão (a pasta de rascunho que a sessão do Claude recebe). Rodando de novo, sai "já entregue".

No fim do teste, nesta ordem:

1. `kit.py limpa "$PECA" --entregue`: apaga os stills e os mudos e tira os links das telas e dos modelos 3D do public-kit;
2. apague a raiz falsa (`rm -rf "${FALSO:?}"`);
3. apague a pasta da peça em `KIT/pecas/` (`rm -rf "${KIT:?}/pecas/${PECA:?}"`), se não for mais conferir nada.

Não reaproveite a pasta de teste pra uma peça de verdade: crie outra com o nome certo.

## Trilha: como escolher

- **Só as liberadas.** Hoje são 2, as duas house de 120 BPM: House One (`mixkit-04-house-one`, leve e otimista) e Let's Move (`mixkit-05-lets-move`, mais enérgica).
- **A Talent in the Air** (`mixkit-01-talent-in-the-air`) foi relançada por terceiro e vale só no reel de 14/10. Em peça nova, só com decisão do Pedro registrada no catálogo com o nome da pasta da peça (o kit confere pela pasta; decisão de agente e `"*"` não valem pra peça nova).
- **As 11 sem verificação** (6 do Pixabay e 5 novas: piano, tensão, lo-fi, pop acústico e groove brasileiro) só entram depois de 2 recortes limpos na AudD (`kit.py audd`, 10 consultas por dia).
- **Epidemic:** reprovada (plano gratuito do Pedro). O kit recusa.

```bash
"$PY" -B "$KIT/scripts/kit.py" trilhas --status liberado
"$PY" -B "$KIT/catalogos/catalogo.py" mostra mixkit-04-house-one
```

A listagem mostra só as do tipo trilha. As prévias de audição do catálogo (`previa-mixkit-04-house-one`, `previa-mixkit-05-lets-move` e outras) são pro Pedro ouvir: têm a narração do 14/10 embutida, e o kit recusa como trilha de cena.

**O momento forte é escolhido por palavra.** Cada trilha tem pontos medidos (a volta da banda, um drop). Na cena, `trilha.momento` é a palavra em que a música deve "voltar" (no guia, o toque do "pagar") e `trilha.ponto` é o ponto da trilha (`volta-62.011` na House One, `entrada-16.035` na Let's Move). O kit calcula de onde a trilha começa. Com `"ganhoDb": "auto"`, o volume sai da janela medida. Exemplo:

```json
"trilha": { "id": "mixkit-04-house-one", "momento": { "palavra": 37 }, "ponto": "volta-62.011", "ganhoDb": "auto" }
```

**Automação da janela.** Quando a janela da trilha no catálogo tem `automacao`, copie pra `trilha.automacao` da cena, deslocando os tempos pro seu momento. Hoje é o caso da Let's Move: a intro filtrada sumiria sob a voz, então ela sobe 8 dB até o drop. No catálogo, `[[0, 8], [10.3, 8], [10.3, 0]]` foi medido com o drop em 10,3 s do vídeo; com o drop no seu momento em 5,48 s, fica `[[0, 8], [5.48, 8], [5.48, 0]]`:

```json
"trilha": { "id": "mixkit-05-lets-move", "momento": { "palavra": 20 }, "ponto": "entrada-16.035", "ganhoDb": "auto", "automacao": [[0, 8], [5.48, 8], [5.48, 0]] }
```

O `kit.py props` avisa quando a janela tem automação e a cena não, já com a automação deslocada pro seu momento (pra ficar sem automação de propósito: `[[0, 0]]`). O degrau no mesmo instante funciona: desde 03/10 o mix mantém a ordem escrita dos pontos.

Antes de postar: subir não listado no YouTube e guardar o print da licença (CHECKLIST, parte 2).

## Biblioteca de batidas

São 55 batidas em quatro lugares: 13 do núcleo (o reel da guia), 24 da extensão comum (o palco de argila da peça de 05/10, as de objeto e câmera, a pílula "Comenta aí" e, desde 05/10, a `troca-lado`), 11 da abertura e 7 da precificação (as duas 2D). A lista completa, com os parâmetros padrão e os sons de cada uma, sai do `kit.py batidas` (`--json` pra ler num script).

Como toda batida funciona:

- **Números padrão.** São os do vídeo de onde a batida veio: o reel da guia no núcleo, a peça de 05/10 na comum. A cena manda só o que muda, e numa peça nova isso quase sempre inclui os tempos e os ids dos objetos e das peças.
- **Tempo.** Todo `t` aceita segundos (`2.5`), palavra da narração (`{"palavra": 12, "desloc": 0.04}`), fecho (`{"fecho": -0.4}`), fim do vídeo (`{"fim": -0.95}`), marca da cena e, dentro da batida, `{"desloc": 0.3}` a partir do `t` dela.
- **Som.** Os sons são eventos do perfil v2 (o aprovado), presos às âncoras da batida; viram o `eventos.json` e o mix, e todo id está no catálogo de efeitos (com os usos de cada peça). `"semSom": true` cala a batida; `"sons": [...]` troca a lista só nela. Som novo só com aviso ao Pedro.
- **Parâmetros em português**, com `dur` (segundos), `ease` (as curvas do GSAP, as da marca `lgEntra`, `lgSai` e `lgPousa`, e as do kit com prefixo `kit`, como a `kitPousa5`) e `desloc`.

### Núcleo: o reel da guia (aparelho, tela e câmera)

| batida | o que faz |
|---|---|
| `gancho-giro-varredura` | o aparelho gira até a pose, a câmera aproxima devagar e uma luz varre a lateral (o gancho) |
| `nao-de-cabeca` | o aparelho balança "não" em ry, com pouso |
| `mergulho-abre-app` | a câmera mergulha e o app abre: troca de tela com zoom (do `splash` pra outra) |
| `card-contador` | o card da tela acende, o valor de exemplo conta e o brilho de carregamento passa |
| `empurrar-tela` | uma tela empurra a outra, entrando pela direita |
| `objeto-sai-da-tela` | um objeto (folha DAS, pílula ou comprovante) sai da tela, voa, assenta e sai |
| `relogio-notificacao` | o relógio entra, vibra e mostra a notificação |
| `flip-troca-escondida` | o aparelho dá uma volta e troca a tela enquanto está de costas |
| `toque-botao` | pulso, toque e aperto no botão da tela e o retorno do app ("Código copiado"), sem verde e sem "pago" |
| `recuo-camera` | a câmera recua e mostra o aparelho inteiro, com varredura |
| `fecho-simbolo` | o app fecha, o aparelho encolhe até o símbolo do logo e entra "Vai, Legalizaí" |
| `link-bio` | o "LINK DA BIO" entra embaixo do logo |
| `volta-loop` | o aparelho volta do símbolo pra pose do quadro 0 e o loop emenda |

### Comum: o palco de argila e as de objeto e câmera (vieram da peça de 05/10)

O palco de argila é um objeto da cena (`proc-palco-argila`): as duas vitrines do carrossel (fria e quente, presas ao mundo), a luz calibrada do carrossel, a sombra de contato e as peças que a cena declara (argila: pilha, carimbo, pasta, despertador, envelope, envelope aberto, lupa, caneta e prancheta; e as que saem da tela do aparelho: cartões recortados da tela, placas, moeda, sino e faíscas). Guia completo, com o formato de cada peça: `RM/src/kit/ext/comum/LEIA-ME.md`. Exemplos prontos: `KIT/pecas/_2026-10-03-prova-comum/` (`cenas.json`, o palco com vitrines; `cenas-soltos.json`, a argila solta).

| batida | o que faz |
|---|---|
| `vitrine-luz` | varredura de luz fria na vitrine fria e na argila |
| `vitrine-fio` | fio de luz descendo pelo vão entre as vitrines (o "vs") |
| `palco-luz` | halo coral da vitrine quente, brilho da tela no chão e o tom dele |
| `exibe-objeto` | troca de peças na vitrine fria: o que sai encolhe no pé e o que entra cresce no pé, sem atravessar o chão |
| `carimba` | o carimbo sobe, carimba, achata e volta; as folhas tremem e a marca fica no formulário; com `sai`, o carimbo sai |
| `pasta-leva` | a folha carimbada voa da pilha pra pasta aberta, a pasta fecha e sai pela esquerda |
| `peca-move` | movimento secundário de uma peça (a lupa deslizando) |
| `pasta-endireita` | uma peça se endireita no lugar (a pasta em pé ao lado do aparelho) |
| `cartao-sai-da-tela` | um cartão recortado da tela descola, voa e pousa na frente do aparelho; com `volta`, volta pra vaga |
| `cartao-contador` | o cartão do imposto acende, o valor conta e o brilho passa no esqueleto do botão |
| `toque-cartao` | no cartão fora da tela: vira botão, pulso, toque e aperto, empurrão de câmera e o retorno do app |
| `sino-toca` | o sino coral salta, balança três vezes e sai |
| `fileira-fora-do-padrao` | as placas de documento saem da tela em fileira e uma salta pra fora |
| `moeda-pessoa` | a moeda com o sinal de pessoa sai da tela, gira e pousa; leva a placa de volta pra fileira, que ganha "Entregue" |
| `volta-pra-tela` | placas e moeda voltam pra tela |
| `funde-vitrines` | o vão fecha e as duas vitrines viram um painel só; aparelho e pasta vêm pro meio |
| `palco-fecha` | o painel encolhe até o símbolo do logo junto com o fecho; as peças pedidas vão presas a ele |
| `vitrine-palco` | volta do loop: as vitrines crescem do centro e tudo volta pro quadro 0 |
| `aceno` | ida e volta curta num eixo de qualquer objeto da cena |
| `pose-objeto` | qualquer objeto da cena vai pra uma pose (valores absolutos ou "+=") |
| `aproxima` | só câmera: aproxima devagar, com um riser que acaba onde pedir |
| `objeto-canal` | anima um canal de um objeto solto: abre e folhas da pasta de argila, tremor da pilha, sobe e achata do carimbo, giro da moeda, balanço do sino |
| `pilula-comenta` | a pílula coral "Comenta aí" com o balão entra embaixo do logo e sai com ele (camada 2D, no lugar do `link-bio`) |
| `troca-lado` | a câmera desliza de uma vitrine pra outra, com desfoque de movimento só no 3D (a legenda fica nítida) e whoosh: um lado de cada vez na tela inteira, como passar o carrossel (05/10, v2 da peça de 05/10) |

**Um lado de cada vez, com contato (05/10).** Pra comparar dois jeitos em tela inteira, em vez de lado a lado, o modelo é a peça `2026-10-05-tradicional-vs-legalizai-v2`, com a cena gerada por `provas/cena-v2.js`. Ela tem:

- vitrines largas;
- duas câmeras de repouso, uma em cada lado;
- uma `troca-lado` por troca;
- cada natureza-morta trocada fora de quadro (`peca-move` com `de`);
- peças no chão com sombra (`opcoes.sombraContato`, `pousoMundo`, `fileira.mundo`, `noChao`).

As opções estão no LEIA-ME da extensão comum, seção "Um lado de cada vez, com contato".

Os 11 objetos de argila também entram soltos na cena, como qualquer modelo do catálogo (`proc-argila-pilha`, `proc-argila-carimbo`, `proc-argila-pasta`, `proc-argila-despertador`, `proc-argila-envelope`, `proc-argila-envelope-aberto`, `proc-argila-lupa`, `proc-argila-caneta`, `proc-argila-prancheta`, `proc-argila-moeda` e `proc-argila-sino`). Pra eles saírem com a luz do carrossel (sem ela, a argila fica bem mais clara), ponha na cena um palco sem vitrine, sem aparelho e sem peça e deixe os objetos com `"sombra": 0`:

```json
{ "id": "luz", "modelo": "proc-palco-argila", "pose": {}, "sombra": 0, "conteudo": { "aparelho": null, "vitrine": null, "pecas": {} } }
```

### Abertura e precificação (2D)

- **Abertura** (`ext/abertura`): `texto-entra`, `texto-sai`, `soco`, `estouro`, `carimbo`, `marca-texto`, `entra-em-arco`, `guarda-na-pasta`, `cta-pop`, `virada-de-pagina` e `marca-dia` (o calendário clay). Guia: `RM/src/kit/ext/abertura/LEIA-ME.md`.
- **Precificação** (`ext/precificacao`): `p2d-entra`, `p2d-sai`, `p2d-mola`, `p2d-treme`, `p2d-canal`, `p2d-transicao` e `p2d-corte`, sobre os 23 elementos 2D do reel de 02/10. Guia: `KIT/biblioteca2d/LEIA-ME.md`.

Como usar as duas está na seção "Uma camada 2D".

## Como acrescentar

### Uma batida

Batida nova é código TypeScript. Peça ao Claude e mostre este trecho. As regras:

- Entra numa extensão, nunca no núcleo: a que serve pra qualquer peça vai pra extensão comum (`RM/src/kit/ext/comum/batidas.ts`); a que só faz sentido numa peça, pra `RM/src/kit/ext/<peça>/batidas.ts`. Puro (sem React, sem Remotion, sem DOM). Se ela desenha algo novo, o desenho vai no `render.tsx` da mesma pasta. O formato está em `RM/src/kit/ext/LEIA-ME.md`.
- Levar pro kit o que uma peça criou: antes, prove que a peça sai igual (estado da timeline quadro a quadro e eventos iguais, `props`, `eventos` e `qc` com o mesmo md5, stills contra as variantes de antes), como em `KIT/pecas/2026-10-05-tradicional-vs-legalizai/provas/kit-comum/`.
- Os números padrão são os do vídeo de onde ela veio, e os sons vêm no perfil v2. Som novo só com aviso ao Pedro.
- Nada de redefinir ease que já existe (curva nova ganha o prefixo `kit`) nem de mexer em global do bundle.
- Antes de desenhar o movimento, carregue as skills `motion-design` e `gsap-*` (CHECKLIST, parte 1).
- Nunca mexa no código do kit com um render rodando: o bundle lê o código naquela hora (o `kit.py doutor` mostra se há render rodando).

Provas antes de usar:

```bash
cd "$RM" && npx tsc --noEmit -p src/kit/tsconfig.json
"$PY" -B "$KIT/scripts/kit.py" batidas
```

O tsc tem de dar zero erro, e o `kit.py batidas` tem de mostrar a extensão "ligada". Depois, `kit.py props` e `kit.py eventos` numa peça de teste, e os stills da `GuiaPronta` e da `AberturaMes` iguais à linha de base (`KIT/provas/render/linha-de-base/`). Um erro de import numa extensão derruba o render de todas as composições.

### Uma tela

1. Escolha a captura em `C:/MKT-INSTA/Content Legalizai/marketing/telas-app-2026-10-02/` (88 telas do protótipo, fundo branco), conferindo o status na revisão (`KIT/telas-revisao/REVISAO.md`) e no FONTES.
2. Copie a receita modelo (`KIT/telas/receitas/_modelo.json`) pra `telas/receitas/<nome>.json` da peça. Ela diz a captura, o que vira esqueleto, as faixas coladas e as regiões que as batidas usam (card, valor, botão).
3. Rode `kit.py telas "$PECA"` e olhe o `telas/qa.jpg`.
4. Na cena, em `telas`, aponte o `arquivo` pra `pecas/<peça>/telas/<tela>.png` e ligue os extras (brilho do card, contador, varredura, botão, círculo de toque) às regiões do `telas/regioes.json`.

Sem desfoque: o que não pode aparecer vira esqueleto ou fica fora do recorte. O centro real do botão "Ver a guia" é x 352 (o 270 do guia é legado). As telas são do protótipo Next.js, não do app Flutter: chamar de "tela real" depende do Pedro. Guia completo: `KIT/telas/LEIA-ME.md`.

### Um modelo 3D

**O que entra numa peça (03/10).** Dos 55 modelos do catálogo, 44 entram: 40 direto (24 GLB liberados; os 4 feitos em código do núcleo e da abertura: folha DAS, pílula "dia 20", comprovante e calendário clay; e os 12 da extensão comum: os 11 objetos de argila do carrossel de 05/10 e o palco de argila) e 4 com aviso (o celular e o relógio do guia, nas duas versões; aceitos com risco, com a decisão valendo pra peça de 14/10). Ficam fora 11: os 4 `.blend` (o three.js não carrega; o símbolo da vinheta tem a versão GLB, `glb-simbolo-legalizai`), a `proc-cena-guia` (é a cena inteira do guia, não um objeto) e 6 com decisão pendente do Pedro, que já estão prontos e provados no render, mas o kit recusa até ele decidir (os 3 de crédito "Poly by Google": `glb-carimbo`, `glb-cofrinho` e `glb-carteira`; a câmera fotográfica; os 2 relógios de desenho reconhecível, `glb-relogio-analogico-chronograph` e `glb-relogio-digital`). A pergunta de cada um está no FONTES ("Decisões de risco pendentes do Pedro").

Antes de escolher, veja as provas: `KIT/provas/modelos/render/lote-01.jpg` a `lote-05.jpg` (cada modelo de frente e em 3/4, montado exatamente como numa peça) e `vitrine-kitmotion.jpg` (seis deles numa cena do KitMotion); os objetos de argila em `argila-01.jpg` (com a luz do kit) e `argila-luz-carrossel.jpg` (com a luz do carrossel, a que eles pedem: seção "Biblioteca de batidas"). O FONTES traz o status, o crédito e a coluna "entra no render"; o `kit.py modelos "$PECA"` mostra o mesmo pros modelos da sua cena.

**Como pôr um objeto na cena.** No `cenas.json`, em `objetos` (exemplo completo: `KIT/pecas/_2026-10-03-vitrine-modelos/cenas.json`):

```json
{ "id": "despertador", "modelo": "glb-despertador",
  "pose": { "x": -0.05, "y": 0.06, "z": 0, "rx": 0, "ry": -0.35, "rz": 0, "s": 0.32, "vis": 1 } }
```

- **Orientação e pivô.** Com a pose zerada, todo modelo sai de pé e de frente pra câmera (frente pra +Z, cima pra +Y; os que vêm deitados no arquivo já giram pelo `render.rotacaoBase` do catálogo), no tamanho real em metros e com o centro da caixa na origem (`render.pivo` "centro"): `rx`, `ry`, `rz` e `s` giram e escalam em volta do meio do objeto. O celular e o relógio do guia ficam com a origem do arquivo, que já é o centro deles.
- **Tamanho.** O celular do guia tem 16 cm de altura, e a câmera padrão (z 0,66, fov 30) vê uns 20 x 35 cm no plano z = 0. O `render.sHeroi` do catálogo é o `s` que deixa o objeto com 16 cm na maior medida; pra outro tamanho, `s = sHeroi x tamanho / 0,16` (o despertador, `sHeroi` 0,919, com 5,5 cm: `s` 0,32).
- **Sombra e papel.** A sombra de contato cai no papel em y = -0,0905 (o pé do celular do guia) e enfraquece com a altura. Objeto com o pé abaixo disso fica sem chão. A força vem do catálogo (`render.sombra`); `"sombra": 0` na cena desliga.
- **Flutuar como o celular.** GLB não flutua por padrão: `"flutuacao": {"amp": 0.0015, "freq": 2.1, "fase": 1}`.
- **Cor e material.** O catálogo já traz a cor de marca de cada um (`render.cores` e `render.materiais`; por que, em `render.notaRender`). A cena soma as dela, e a dela vence: `"cores": {"<material>": "#RRGGBB"}` troca a cor de um material; `"materiais": {"<material>": {...}}` ajusta `rugosidade`, `metalico`, `envMap`, `opacidade`, `semLuz` (a cor exata da textura), `semMapa`, `transmissao`, `normaisSuaves` ou troca uma cor dentro da textura (`"matiz": [{"de": "#hex", "para": "#hex"}]`). Os nomes de material (com a cor original e o que o catálogo já ajusta) saem do `"$PY" -B "$KIT/catalogos/catalogo.py" materiais <id>`. Paleta em `KIT/catalogos/marca.json` (azul nunca é marca).
- **Aparelho** (celular, notebooks): `telaInicial` com uma chave de `telas`, ou `"apagada"`.
- **Movimento.** As batidas que mexem em objeto pegam qualquer id da cena, menos as que aceitam só alguns tipos (o `kit.py batidas` mostra; a `objeto-sai-da-tela`, por exemplo, só folha, pílula e comprovante).

**O GLB no public-kit.** O render só enxerga o `RM/public-kit/`. O celular e o relógio do guia ficam lá fixos (`RM/public-kit/3d/iphone.glb` e `RM/public-kit/3d/watch.glb`). Os outros GLB ficam na biblioteca e entram por hardlink em `RM/public-kit/3d/biblioteca/<id>.glb` só quando a peça usa: o `kit.py props` liga os da cena antes de conferir, e os `stills`, a `previa`, a `capa`, o `render` e o `final` religam dentro da trava de render (outra peça pode ter desligado). Nada é copiado, mas o bundle leva o public-kit inteiro pro Temp a cada render: depois da entrega, o `kit.py limpa "$PECA" --entregue` desliga. Fica o que outra peça em andamento usa, e com render rodando o kit recusa. O doutor mostra o que está ligado.

```bash
"$PY" -B "$KIT/scripts/kit.py" modelos "$PECA"            # status, se entra e o caminho de cada modelo da cena; liga os GLB
"$PY" -B "$KIT/scripts/kit.py" modelos "$PECA" --desliga  # tira os links da peça (no meio do trabalho)
```

**Licença.** Aceito com risco só entra pela decisão do catálogo (`decisaoRisco`), conferida pela pasta da peça: fora das peças da decisão, o `kit.py props` avisa pra confirmar com o Pedro antes de postar. Desde 03/10 (rodada 4), em peça nova só vale a decisão do Pedro com a peça escrita pelo nome; decisão de agente (o `quem` não é o Pedro) e `"*"` ficam provisórias e só valem na peça do guia. Pedro liberando um item pra toda peça, ele vira `liberado`, com a decisão registrada. Modelo CC BY ("CC BY", "CC Attribution", "Creative Commons Attribution") põe o crédito sozinho na legenda, sem marca nenhuma, nem colada a número ou hífen ("iPhone15", "Apple-Watch", "GoPro", "Post-it"); o texto sai em `saida/creditos.txt` e no `catalogo.py creditos <id> <id>`. Licença NC (não comercial) ou ND (sem derivações) e qualquer item da Epidemic (pela fonte, url, licença ou arquivo) o kit recusa; SA fica pra decisão do Pedro.

**Já se sabe (provas de 03/10).** Saem certos como numa peça: a pasta com esqueleto (clonada pelo SkeletonUtils, no tamanho certo), o vidro da lâmpada (sem a textura escura do corpo), o símbolo da marca (face sem luz, no coral exato), o despertador e os post-its (troca de matiz pra coral), o envelope (o branco-azulado vira papel e o selo, coral) e o pote (normais suaves, tampa coral). As folhas brancas (`glb-blocos-papel`, `glb-papel-pilha-documento` e `glb-envelope-aberto`) têm pouco contraste no papel claro, e os 10 blocos da `glb-blocos-papel` saem juntos, como uma mesa vista de cima. A caixa medida no render bate com a das props (a diferença máxima é 1,1 mm, o vidro do celular).

**Modelo novo.** Só de licença grátis: Poly Haven e Poly Pizza CC0, ou Sketchfab e Poly Pizza CC BY (com crédito sem marca). Um download por vez, abaixo de 15 MB, com 400 MB livres. Texto e marca saem das texturas; GLB único, sem Draco, com nomes em português. O item entra numa camada nova de aquisições do catálogo (`KIT/catalogos/modelos/`), nunca no `base.json`, e ganha um still de prova. As ferramentas e o passo a passo estão em `KIT/modelos/LEIA-ME.md`. O texto do crédito sai pronto:

```bash
"$PY" -B "$KIT/catalogos/catalogo.py" creditos glb-video-iphone glb-video-watch
```

Depois de entrar no catálogo, o modelo novo ganha o bloco `render` numa sobreposição (`KIT/catalogos/modelos/revisao-render.json` ou um `revisao-*.json` novo): `publicKit` (`3d/biblioteca/<id>.glb`), `rotacaoBase` (frente pra +Z, cima +Y), `pivo` ("centro"), `escala` se o arquivo não for em metros, `cores` ou `materiais` pra cor de marca, `sombra` e `sHeroi`. O `valida.py` confere o caminho, o pivô e os nomes de material contra o GLB. Depois, a prova (uns 20 s por lote de 8, com 400 MB livres e na vez da trava):

```bash
"$PY" -B "$KIT/scripts/kit.py" prova-modelos <id> [<id> ...] --grava-catalogo
```

Ela monta cada modelo pelo `montaProps`, liga o GLB, tira o still de frente e em 3/4 no `KitProvaModelo`, grava a folha de contato do lote em `KIT/provas/modelos/render/`, desliga o GLB e registra o `provaRender` no catálogo. Olhe a folha antes de usar (orientação, cor, material, sombra). Com `--sem-decisao`, o de decisão pendente entra só na prova; numa peça, o kit continua recusando.

### Uma camada 2D (extensões abertura e precificacao)

Duas famílias prontas:

- **abertura** (a "Abertura do mês"): texto que entra e sai, soco, estouro, carimbo, marca-texto, entrada em arco, guarda na pasta, CTA e o calendário clay que vira a página e marca o dia.
- **precificacao** (o reel dos "3 sinais"): os 23 elementos do reel de 02/10 (agenda, carimbo, cadeado, check, despertador, confete, celular, olho e outros), cenas 2D de tela cheia com transição e corte.

Na cena, declare o elemento em `camadas` e prenda o movimento a uma palavra em `batidas`:

```json
"camadas": [ { "id": "agenda", "tipo": "p2d-Calendar", "month": "OUT", "x": 540, "y": 1180 } ],
"batidas": [ { "id": "p2d-entra", "params": { "camada": "agenda", "t": { "palavra": 24, "desloc": -0.05 } } } ]
```

Exemplos prontos: os 3 de `KIT/biblioteca2d/exemplos/` (com still em `KIT/provas/modelos/demo-2d/`), a demo da abertura (`KIT/provas/modelos/demo-abertura/cenas.json`) e a peça de prova `KIT/pecas/_2026-10-03-prova-2d/`, que desenha todos os elementos e movimentos 2D das duas famílias e o fecho por cima de um fundo 2D (folhas de stills em `provas/` da peça, cada still com o que mostra).

**Mídia.** Os elementos `p2d-Sticker`, `p2d-ClayCard`, `p2d-TetoCard` e `p2d-Phone` buscam ícones, quadros clay e a splash no public. Ligue antes dos stills e do render e desligue logo depois, porque o render copia o public-kit inteiro:

```bash
"$PY" -B "$KIT/scripts/kit.py" ext-liga precificacao
"$PY" -B "$KIT/scripts/kit.py" ext-desliga precificacao
```

A abertura não precisa de `ext-liga`: as camadas dela são vetoriais, os 15 mapas do calendário clay já ficam no public-kit e a camada `imagem` mostra um arquivo que já esteja lá (`src`).

**Legenda.** Um fundo 2D de tela cheia cobre a legenda do kit: nesse caso, use a camada `p2d-legenda`. Sem fundo cheio, não use (a legenda sairia duas vezes). Ela fica no z 200: um grupo com `z` maior (a íris do fim usa 300) cobre a legenda e o fecho, então só a íris que fecha o vídeo vai acima dela.

**Cuidados.** Confete nunca na batida de pagar; carimbo sem "pago"; número e medidor do teto só com base no FATOS; o celular 2D mostra a splash do protótipo. As batidas recusam o que fere essas regras.

Guias completos: `KIT/biblioteca2d/LEIA-ME.md` (precificação) e `RM/src/kit/ext/abertura/LEIA-ME.md` (abertura). Tipo de camada novo é código, com as mesmas regras e provas da batida.

A extensão `tradicional-vs-legalizai` (a peça de 05/10) não tem mais batida própria: desde 03/10 ela só registra o palco da peça (`palco-tvl`); as batidas, o palco e os objetos de argila dela estão na extensão comum (seção "Biblioteca de batidas").

## A regressão do reel da guia

O kit refez o reel de 14/10 (o V4 entregue) e passou. Detalhe e comandos em `KIT/pecas/guia-pronta-2026-10-14/REGRESSAO.md` (02/10/2026).

| prova | resultado |
|---|---|
| Rodada 1: identidade (`cenas.json`) | passou em todas as camadas. Estado quadro a quadro com 0 desvio; os 35 eventos de som iguais; mix igual bit a bit; telas iguais pixel a pixel; stills 54 de 54 iguais. O vídeo não repetiu o md5 do V4 (nem o original repete), e passou pelo critério alternativo: PSNR médio 54,58 dB, mínimo 47,62 dB e SSIM 0,999428. Áudio final igual ao do V4 |
| Rodada 2: peça nova (`cenas-kit.json`: telas por receita, narração realinhada e fecho como asset) | passou em todos os limites: eventos até 0,02 s do guia; voz com correlação 0,999989; mix com 0,999592; conferência do `kit.py final` inteira ok; capa ok |
| Modo periódico em 22 s (sem render) | o loop emenda (camada ambiente 3,4e-17; a emenda é do tamanho de um passo normal). Falhou 1 quadro na checagem da legenda (quadro 331, na transição, 2,16 px além da margem) |

Pra próxima regressão: o md5 do vídeo não se repete num render novo, nem no original. Compare vídeo por PSNR e SSIM, e stills com 3 abas (3 rodadas do `kit.py stills`, pelo melhor par).

## Problemas conhecidos e a solução de cada um

- **`--binaries-directory` relativo.** O ffmpeg falha no quadro 0 com "O sistema não pode encontrar o caminho especificado". Solução: caminho absoluto (`RM/bin`). O `kit.py render` já usa, e o doutor confere.
- **yuvj420p sem `--color-space=bt709`.** Sem a opção, o Remotion 4.0.531 entrega faixa cheia em BT.601, e trocar só a etiqueta piora (o papel e o coral mudam). Solução: render sempre com `--color-space=bt709` (o `kit.py render` já passa) e áudio montado com `-c:v copy`. O `kit.py confere` compara o still com o quadro do vídeo (média abaixo de 2).
- **Temp e disco lotados.** Cada render deixa no Temp um bundle de uns 50 MB e um perfil do Chrome de 9 MB; 120 perfis já somaram 931 MB. Solução: render só com 400 MB livres; o vigia (`KIT/scripts/vigia.py`) mata o render abaixo de 250 MB e apaga a saída parcial; cada execução usa um Temp próprio e apaga só ele no fim; `kit.py limpa "$PECA"` apaga o que uma execução interrompida deixou.
- **Duas execuções ao mesmo tempo.** A limpeza do Temp por janela de tempo de uma apagava o bundle da outra (em 02/10 um render caiu no quadro 449 assim). Solução, desde 03/10: a trava de render (um render ou stills por vez na máquina, com espera e tempo-limite), o Temp próprio por execução e o doutor mostrando quem está renderizando. Quem roda `npx remotion render` fora do kit deve usar o `KIT/scripts/vigia.py`, que também espera a trava e usa Temp próprio.
- **Whisper com prompt.** O `initial_prompt` força palavra que não foi dita, e o modelo medium tenta baixar 1,5 GB e lota o disco. Solução: só o small, sem prompt. O texto vem do roteiro; o whisper só dá o tempo. O "Vai" fraco pode sair como "Bye".
- **Primeiro quadro vazio.** Cada aba do render solta o primeiro quadro vazio se não esperar a cena desenhar; e no tempo exato 0 o GSAP não aplica os `set()` do começo (a capa sai sem título). Solução: o KitMotion segura o quadro até a cena desenhar e avança a timeline em t + 0,0001 s. Não mexa nisso.
- **Textura preta do img2threejs.** Sem o re-render depois que a textura carrega, o calendário clay sai preto, com cara de cromo. Solução: a extensão abertura faz esse re-render e nunca troca o gancho global de texturas; os 15 mapas clay ficam na raiz do public-kit.
- **Hardlink sobrescrito.** Gravar no lugar num hardlink muda o arquivo nos dois lugares (as telas do guia entre `GP` e o public do Remotion; o V4 entre `FINAL` e `C:/Users/EDIT-ADMIN/Videos/`). Solução: tudo grava pelo ajudante de escrita segura (`KIT/lib/escrita.py`, ou `RM/src/kit/lib/escrita.mjs` em Node): grava num temporário e troca, recusa hardlink e recusa caminho protegido. Nada de gravar no lugar nesses caminhos (ffmpeg com `-y`, `save` do PIL, editor de texto).
- **Referência que mudou.** O V4 e as telas do guia já foram regravados no lugar (02/10, 11:30). Solução: o registro congelado (`KIT/pecas/guia-pronta-2026-10-14/_referencia.json`); o doutor mostra em VERMELHO o que mudou. Antes de uma regressão: `kit.py doutor`.
- **Pixabay 403.** O Pixabay devolve 403 a robô (curl e urllib). Solução: conferir a página num navegador de verdade, ou com o Pedro. Até lá, o item fica sem verificação, com nota; os 5 efeitos do Pixabay do perfil v2 são conferidos antes de postar (CHECKLIST, parte 2).
- **Avisos do three.js nos stills.** A prévia, a capa e o final imprimem dezenas de "THREE.Clock: This module has been deprecated" e "warning X4122". São normais e não são erro.
- **Legenda em peça periódica.** A margem da transição (-26 px) foi calibrada no guia com pouca sobra; no teste de 22 s, 1 quadro passou dela e o `kit.py qc` parou. Solução até a decisão: ajustar a coreografia (aparelho ou câmera mais baixos naquele trecho). `--ignora-qc` só com o OK do Pedro.
- **GLB que não aparece no render.** O `kit.py props` diz que o arquivo "não existe no RM/public-kit", ou o quadro sai sem o objeto. Solução: rode pelo `kit.py` (o props, os stills e o render ligam os GLB da cena) ou `kit.py modelos "$PECA"`; quem roda `npx remotion render` direto liga antes. Modelo sem `render.publicKit` ou com decisão pendente o kit recusa de propósito (`kit.py modelos "$PECA"` mostra o motivo).
- **Mídia de extensão esquecida.** Com o `ext-liga` ativo, cada render copia mais 7 MB pro Temp. Solução: `ext-desliga` logo depois; o doutor avisa.
- **Camadas 2D no navegador (provadas em 03/10).** Todas as camadas e batidas 2D foram desenhadas no Chrome do render, na peça de prova `KIT/pecas/_2026-10-03-prova-2d/`. Três cuidados saíram dela: um grupo com `z` acima de 200 esconde a `p2d-legenda` e o fecho; sem o `ext-liga`, o quadro que mostra Sticker, ClayCard, TetoCard ou Phone quebra; no `guarda-na-pasta` da abertura, a pasta vai embaixo e à direita do elemento (os deslocamentos são relativos a ele). Detalhes: `RM/src/kit/ext/precificacao/LEIA-ME.md` e `RM/src/kit/ext/abertura/LEIA-ME.md`.
- **Stills que variam entre rodadas.** O mesmo código pode sair com 1 a 6 níveis de diferença em uns 4.000 px do chão embaixo do aparelho e do corpo dele (y 950 a 1500), às vezes com 1 pixel de borda mais longe, de uma rodada pra outra: aconteceu na peça de 05/10 com o código antigo e com o novo. Solução: comparar por variante, com 2 ou 3 rodadas, como na regressão (`KIT/pecas/2026-10-05-tradicional-vs-legalizai/provas/kit-comum/md5-pixels.json`).
- **Argila clara.** Os objetos de argila soltos, sem palco na cena, ficam com a luz do kit e saem bem mais claros que no carrossel. Solução: um palco de argila sem vitrine, sem aparelho e sem peça na cena (seção "Biblioteca de batidas").
- **Folha de prova de modelo por cima de outra.** O `kit.py prova-modelos` numera os lotes a partir do 1 e grava `lote-01.jpg` por cima da que já existe. Solução: com outro nome de folha, `"$PY" -B "$KIT/scripts/prova_modelos.py" <id> [<id> ...] --folha-nome <nome> --grava-catalogo` (a das argilas é `argila-01.jpg`).
- **Capa automática em cima do aparelho.** No guia, o quadro automático (58) pôs a faixa do título sobre o topo do aparelho. Solução: `kit.py capa "$PECA" --quadro N` com outro quadro.
- **A junção cortava quadros do fim (consertado em 03/10).** O `props.ts` arredonda os quadros (duração x 30) e o `mixa.py` arredondava as amostras (duração x 48000): com a fração de quadro arredondada pra cima, o mix ficava até meio quadro mais curto e o `-shortest` da junção cortava 2 a 4 quadros (823 de 826 na peça de 05/10, que contornou com o `completa_mix.py` à mão). Solução: o `mixa.py` grava quadros x 1600 amostras (o tamanho exato do vídeo), a junção completa ou corta o mix que difere em até um quadro e recusa o que difere mais, e confere os quadros do final. Prova: `"$PY" -B "$KIT/scripts/testa_saida.py" --so juncao_fracao --mantem` (27,52 s, 18,03 s e 22,19 s).
- **Cena copiada de outra peça.** As travas da trilha aceita com risco, dos modelos aceitos com risco e da peça de teste valem pela pasta. Desde 03/10 a cena (e as props) com `"peca"` diferente do nome da pasta é recusada no `kit.py` e no `props.mjs`, com o conserto na mensagem: troque o `"peca"` pelo nome da pasta.
- **Render, junção ou entrega sem a trava de fatos.** Desde 03/10 os três recusam sem o `qc/fatos.json` ok das props de hoje, e a entrega também sem o relatório do confere ok do mesmo mp4 (passo 12). Solução: `kit.py fatos` e `kit.py confere` de novo, depois de mexer nas props ou no vídeo.
- **As falhas que a peça de 05/10 achou e ainda estão abertas** (a cor do confere comparando stills velhos, a prévia apagando stills de mesmo nome, a folha sem objeto pequeno, o `qc_legenda` só do aparelho, o `empurrar-tela` desfazendo troca, extensão sem prova antes de publicar, luz por cena, "vs" falado como "versus", loudnorm dinâmico, capa sem opção de faixa e outras): `KIT/PENDENCIAS.md`, com o contorno de cada uma.

## Onde ficam as coisas

```
KIT  (_kit-motion)
  README.md  CHECKLIST.md  FONTES.md   estes documentos (o FONTES é gerado)
  PENDENCIAS.md                        as falhas que a peça de 05/10 achou, com o estado e o contorno de cada uma
  DESENHO.md                           o contrato técnico (ninguém edita)
  scripts/kit.py                       o script único (todos os comandos)
  scripts/trava.py                     a trava de render e o Temp próprio de cada execução
  scripts/portao.py                    os portões do render, da junção e da entrega (trava de fatos e relatório)
  catalogos/                           trilhas, efeitos, modelos, telas, marca, biblioteca 2D e assets
  pecas/_modelo/cenas.json             o modelo de peça nova
  pecas/<peça>/                        um vídeo: cenas.json, roteiro.md, voz/, telas/, qc/, audio/, provas/, saida/
  pecas/guia-pronta-2026-10-14/        a peça da regressão (REGRESSAO.md)
  pecas/_2026-10-03-prova-comum/       exemplos do palco de argila e da argila solta (teste, não entregar)
  voz/                                 alinhamento, fecho fixo e o modelo de roteiro
  telas/                               montagem das telas por receita (receitas prontas do guia em telas/receitas/)
  telas-revisao/REVISAO.md             o que cada tela de 02/10 pode mostrar
  audio/                               mixador, efeitos sintetizados e a assinatura sonora (proposta)
  aquisicoes/                          trilhas e efeitos novos e a fila da AudD
  modelos/                             modelos 3D novos (Blender)
  biblioteca2d/                        guia e exemplos da biblioteca 2D
  provas/                              provas do render e o still de cada modelo
  lib/escrita.py                       gravação segura
RM  (precificacao-2026-10-02/remotion)
  src/kit/                             o código do kit (núcleo, batidas, render, cli)
  src/kit/ext/abertura/                extensão 2D da abertura e o calendário clay
  src/kit/ext/precificacao/            biblioteca 2D da precificação
  src/kit/ext/comum/                   palco de argila, objetos de argila e 23 batidas (vieram da peça de 05/10)
  src/kit/ext/tradicional-vs-legalizai/ o palco da peça de 05/10 (só configuração)
  public-kit/                          o que o render enxerga (só hardlinks)
FINAL  (marketing/final)               vídeos prontos, uma pasta por proposta
Temp/kit-motion  (no Temp do Windows)  a trava de render e o Temp próprio de cada render e stills
```

O detalhe de cada parte está no LEIA-ME dela: `KIT/scripts/LEIA-ME.md`, `KIT/catalogos/LEIA-ME.md`, `KIT/voz/LEIA-ME.md`, `KIT/telas/LEIA-ME.md`, `KIT/audio/LEIA-ME.md`, `KIT/aquisicoes/LEIA-ME.md`, `KIT/modelos/LEIA-ME.md`, `KIT/biblioteca2d/LEIA-ME.md`, `KIT/lib/LEIA-ME.md`, `RM/src/kit/ext/LEIA-ME.md`, `RM/src/kit/ext/abertura/LEIA-ME.md`, `RM/src/kit/ext/precificacao/LEIA-ME.md` e `RM/src/kit/ext/comum/LEIA-ME.md`.

## Todos os comandos

`"$PY" -B "$KIT/scripts/kit.py" <comando> [peça] [opções]`. A peça é o nome da pasta em `KIT/pecas/` (ou um caminho absoluto). `--cena <arquivo>` usa outra cena da peça, e as saídas ganham o sufixo dela. Os comandos que renderizam (`stills`, `previa`, `capa`, `render`, `final` e `colisao`) aceitam `--espera N`: quantos minutos esperar a vez na trava de render (padrão 40).

| comando | o que faz |
|---|---|
| `doutor` | confere o ambiente, os catálogos, a referência congelada, o disco e quem está renderizando |
| `nova` | cria a pasta da peça a partir dos modelos |
| `palavras` | lista as palavras da narração com índice e tempo |
| `batidas` | lista as batidas e as camadas do núcleo e das extensões, com padrões e sons |
| `trilhas` | lista as trilhas do catálogo (`--status`, `--clima`) |
| `telas` | monta as telas pelas receitas e liga no public-kit (`--so-liga` só liga; `--desliga` tira os links da peça) |
| `modelos` | lista os modelos 3D da cena (status, se entram no render, o caminho) e liga os GLB em `RM/public-kit/3d/biblioteca/<id>.glb` (`--desliga` tira os links da peça; `--so-lista` só mostra) |
| `prova-modelos` | still de prova de modelos do catálogo, montados pelo `montaProps`, de frente e 3/4, em lotes, com uma folha de contato por lote em `KIT/provas/modelos/render/` (`--grava-catalogo`, `--sem-decisao`, `--todos`) |
| `voz-prepara` | grava o vídeo leve pro voice_change |
| `voz-recebe` | extrai a voz do vídeo devolvido e confere o atraso |
| `voz-alinha` | whisper small sem prompt e alinhamento com o roteiro |
| `voz-monta` | põe o fecho fixo no tFecho e grava a voz final |
| `props` | grava as props do render (erro para tudo, inclusive título vazio e `dataPost` fora do formato) |
| `eventos` | grava os eventos de som |
| `fatos` | trava de conteúdo contra o FATOS e o PROIBIDO |
| `qc` | posição de cada quadro e checagem da legenda |
| `mix` | mixa voz, trilha e efeitos |
| `stills` | stills de uma ou mais composições (`--quadros`, `--composicoes`, `--lote`) |
| `previa` | props, eventos, fatos, qc, mix, stills e a folha da prévia |
| `capa` | proposta de capa com o título (`--quadro`, `--titulo`, `--destaque`, `--still`) |
| `render` | render mudo na vez da trava, com o vigia de disco e Temp próprio (`--trecho` pra um pedaço); exige a trava de fatos ok |
| `juncao` | junta vídeo e mix com a loudness em -14 LUFS, com o áudio do tamanho exato do vídeo (`--saida` pra outro nome); exige a trava de fatos ok |
| `confere` | conferência do final: formato, som, cor, fala, legenda, loop, texto, licenças, créditos e folha |
| `colisao` | prova de colisão quadro a quadro, na vez da trava de render (uns 50 a 65 s pra 27 s de vídeo; `--de`, `--ate` e `--passo` pra um trecho, `--saida` pra outra pasta): corpo 3D entrando em outro (triângulo a triângulo, com tolerância de 0,6 mm), corpo 3D na faixa da legenda com a legenda na tela, ou atrás do fecho e da pílula do link, e o toque aparente (dois corpos que se cobrem na tela com menos de 40 mm de folga na linha de visão: de frente, lê como um entrando no outro). Grava `qc/colisao.json` e `qc/colisao.md` e sai com código 1 se houver algum. Contato de propósito: `userData.encostaEm` no corpo ou `"colisao": {"permitidos": [["a", "b"]]}` na cena, que também troca `tolerancia`, `aparente` (metros, ou `false`), `faixaLegenda` e `faixaFecho`. O render normal não muda: a prova só liga com a prop `prova`, que só esse comando passa |
| `final` | tudo, de props a conferência, e a limpeza das sobras da peça |
| `entregar` | liga o final na pasta da proposta e move a versão anterior (`--nome`, `--arquivo`; `--raiz-final` pra teste); exige a trava de fatos ok e o relatório do confere ok do mesmo mp4 |
| `ext-liga` | liga no public-kit a mídia de uma extensão |
| `ext-desliga` | desliga essa mídia (só apaga o que o ext-liga ligou) |
| `limpa` | com a peça, apaga só as sobras dela (Temp de execução que já acabou; `--entregue`: stills, mudos e links das telas e dos modelos 3D depois da entrega); `--tudo` apaga as de todas, só sem render rodando |
| `audd` | roda o próximo lote da checagem de trilhas na AudD |
