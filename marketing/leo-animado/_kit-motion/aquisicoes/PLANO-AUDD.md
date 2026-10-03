# Plano da AudD: checagem de relançamento das trilhas

Pacote K08 do kit de motion. Contrato: `KIT/DESENHO.md`, seção 12 e Anexo A.1b.

## Por que

Licença em dia não basta. Em 01/10, 4 das 6 trilhas do Mixkit apareceram relançadas por terceiro, com outro artista e ISRC próprio (golpe tipo Arulo). Esse relançamento pode silenciar ou reivindicar o reel no Instagram, mesmo com a licença do Mixkit em dia. Por isso toda trilha grátis passa pela impressão digital da AudD antes de virar liberada.

## Regras do `audd.py`

- Cota anônima de 10 consultas por dia. A primeira consulta de cada dia é o teste de cota: erro 901 quer dizer que a cota acabou (talvez a sessão principal já tenha gasto). O lote para ali e o erro fica registrado.
- Cada consulta manda um recorte de 20 s, mono, 22,05 kHz, MP3 de 96 kbps, gerado pelo ffmpeg no stdout e enviado pelo curl. O recorte nunca vai pro disco.
- Recorte limpo = a AudD não acha nada, ou acha uma faixa cuja prévia de loja não é esta gravação (correlação abaixo de 0,25, medida em memória).
- 2 recortes limpos (inícios diferentes) e nenhum duvidoso: a trilha vira liberado.
- A prévia da loja é a mesma gravação e o artista é outro: reprovado, com artista, data e ISRC na nota.
- A prévia é a mesma gravação e o artista é o próprio autor: fica sem-verificacao (distribuição dele, risco de Content ID; decisão do Pedro).
- Correlação intermediária, falta de prévia ou a mesma correspondência em dois recortes: fica sem-verificacao com nota, e o script põe uma nova consulta na fila pro dia seguinte do plano.
- Cada resultado entra na `verificacao` do item em `KIT/catalogos/trilhas/verificacoes.json`. A fila e o histórico ficam em `fila-audd.json`.

## Situação em 02/10

O teste de cota de hoje (consulta d1-01, Summer Fashion a partir de 20 s) foi às 15:01:49 e deu **erro 901**: a cota anônima já estava esgotada. Em 01/10 o último 901 foi às 17:51, então ou a cota é de 24 h corridas, ou a sessão principal gastou a cota hoje. Nenhuma consulta gastou cota. O erro está registrado em `verificacoes.json` (item `pixabay-03-summer-fashion`) e no histórico da fila.

As 22 consultas continuam pendentes. O lote sempre pega as pendentes em ordem, com data prevista até o dia da rodada, no máximo 10 por dia. Então o plano só anda: se a rodada de hoje não acontecer, cada dia passa pro seguinte (campo `dataProvavel` da fila).

## Comando (o mesmo todo dia)

```bash
cd "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion/aquisicoes" && "C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe" -B audd.py --proximo-lote 10
```

Depois de cada rodada:

```bash
cd "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion/aquisicoes" && "C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe" -B audd.py --status
cd "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion/catalogos" && "C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe" -B valida.py
cd "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion/catalogos" && "C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe" -B catalogo.py lista trilhas --status liberado
```

O `--status` mostra o que já foi feito e quantas consultas gastaram cota no dia. O `valida.py` tem de sair com 0 erros.

## Calendário

| dia | data prevista | se hoje falhar | consultas | o que consulta (início do recorte de 20 s) |
|---|---|---|---|---|
| 1 | 02/10 (nova tentativa hoje depois das 18:00) | 03/10 | d1-01 a d1-10 | Summer Fashion 20 e 60 s; Party Dance 46 e 76 s; Afterglow 51 e 101 s; Space Dance 30 e 90 s; Turbo Funk 54 s; Match Out 40 s |
| 2 | 03/10 | 04/10 | d2-01 a d2-10 | Turbo Funk 20 s; Match Out 122 s; e as 4 primeiras trilhas novas, 2 recortes cada: Classical vibes 4 (piano, obrigatória) 42 e 93 s; PlaceIt World 01 29 e 56 s; Lo-Fi 02 29 e 67 s; BRIDGE N° 98 44 e 99 s |
| 3 | 04/10 | 05/10 | d3-01 e d3-02, mais as novas consultas dos duvidosos | Brazil Jazz 42 e 100 s; uma consulta nova pra cada resultado duvidoso dos dias 1 e 2 (o script acrescenta sozinho) |

Os recortes das trilhas novas saíram do `mede_trilha.py` (trecho cheio, longe do começo e do fim). Os do Pixabay são os da seção 12.

## Lembrete pro orquestrador combinar com o Pedro

Texto curto, pra mandar como está:

> Pedro, a checagem de relançamento das trilhas (AudD) ainda precisa de 3 rodadas de 10 consultas, uma por dia. A de hoje esbarrou na cota grátis às 15h. Posso deixar agendado pra rodar sozinho amanhã (03/10), 04/10 e 05/10 de manhã, ou prefere que eu te lembre? É um comando só, leva uns 2 minutos e não baixa nada. Se você criar um token grátis da AudD, dá pra fechar tudo num dia.

Se o Pedro topar o agendamento, cada rodada é o comando acima, de manhã (antes da sessão principal usar a AudD no dia). Se ele preferir lembrete, o texto do lembrete é: "Rodar a AudD do kit (dia N): `audd.py --proximo-lote 10` na pasta `_kit-motion/aquisicoes`".

## Sugestão: token grátis da AudD na conta do Pedro

- Onde: dashboard.audd.io (cadastro com o e-mail dele).
- O que dá (lido em audd.io em 02/10/2026): 300 consultas grátis no cadastro, sem cartão; depois, US$ 5 por 1.000 consultas. O site diz que o grátis é pra avaliação; no volume do kit (umas 30 a 40 consultas por leva de trilhas novas) o custo depois disso é de centavos.
- Por que vale: fecha as 22 consultas pendentes num dia só, em vez de 3, e o uso fica registrado na conta dele (é a prova de que a checagem foi feita).
- Como usar sem deixar o token em arquivo: definir a variável de ambiente só na hora de rodar. O script passa o token pelo próprio curl, sem ele aparecer na linha de comando.

```bash
export AUDD_TOKEN='<token do Pedro>'
cd "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion/aquisicoes" && "C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe" -B audd.py --proximo-lote 40 --cota 40 --ate 2026-10-05
```

Com o token, o `--ate 2026-10-05` adianta as consultas previstas até o dia 3 e o `--cota 40` sobe o limite do dia (a data registrada continua sendo a de verdade). No PowerShell, a primeira linha vira `$env:AUDD_TOKEN = '<token do Pedro>'`. Nunca gravar o token em arquivo do kit.

## Antes de usar uma trilha liberada numa peça

- Subir o vídeo final como não listado no YouTube antes de postar (o Content ID responde em minutos) e guardar print da licença com a data.
- Pixabay: a página não foi conferida neste pacote (o Pixabay devolve 403 a robô). No dia de usar, reconferir no navegador o selo de Content ID, a marcação de IA e o autor.
- Ninguém ouviu as trilhas novas: o Pedro precisa ouvir antes de virarem padrão.
- Epidemic: reprovada (decisão de 02/10); nada a verificar.
