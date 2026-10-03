# aquisicoes: trilhas, efeitos e AudD do kit (pacote K08)

Contrato: `KIT/DESENHO.md`, seções 4.9, 4.12, 12 e 13. Tudo aqui roda com o Python do corte-viral e sempre com `-B`:

```bash
PY="C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe"
cd "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion/aquisicoes"
```

Toda gravação passa pelo `KIT/lib/escrita.py` (temporário na mesma pasta e `os.replace`). Os arquivos de áudio ficam em `_assets-externos/kit-2026-10/musica/` e `sfx/`; o catálogo aponta pra eles, nada é copiado.

## Arquivos

| arquivo | o que é |
|---|---|
| `mede_trilha.py <arquivo> [--voz]` | mede uma trilha e devolve JSON no esquema de trilhas: BPM e grade (onset de graves somado ao fluxo espectral, pente de 60 a 200 BPM refinado a 0,01), tempo 1 pelas entradas e quedas de seção, seções por RMS de 2 s, pontos (volta, drop, entrada, parada), loudness (ebur128), LRA, pico real, tom por croma e, com `--voz`, o VAD do faster-whisper. Sem janelas fixas: o kit calcula o mStart pelo ponto |
| `mede_efeito.py <arquivo> [--modo] [--categoria]` | mede um efeito: duração, inicioSom_ms, sincronia_ms (ataque por subida de 6 dB em 10 ms ou pico de energia, conforme a categoria), fim_ms, pico, pico real, crista, nota (FFT), banda e correlação estéreo |
| `audd.py` | fila e consultas da AudD (ver `PLANO-AUDD.md`) |
| `fila-audd.json` | a fila: cada consulta com item, início do recorte, data prevista, data provável e tentativas; mais o histórico |
| `PLANO-AUDD.md` | o plano por dia, os comandos, o lembrete pro Pedro e a sugestão do token |
| `escolhidos.json` | a lista deliberada do que podia ser baixado, com o motivo de cada um, as licenças lidas no dia e o que o Mixkit não tem |
| `baixa.py <chave>` | baixa um item de `escolhidos.json`: confere o disco (para abaixo de 400 MB), o tamanho pelo cabeçalho (até 8 MB), baixa pra memória, confere o md5 contra o ETag do servidor e só então grava |
| `baixados.json` e `baixados.md` | o registro de cada download (URL, página, data, licença, autor, id, md5, tamanho e por que entrou) |
| `cataloga.py` | mede tudo e grava `KIT/catalogos/trilhas/aquisicoes-2026-10.json` e `KIT/catalogos/efeitos/aquisicoes-2026-10.json` (validados contra o esquema antes) e o `baixados.md` |
| `confere_existentes.py` | verificação dos efeitos que já existiam: Mixkit 166, 1109, 1897 e 3115 pelo WAV servido (só na memória); os 20 do Pixabay com a nota do 403. Grava `KIT/catalogos/efeitos/verificacoes.json` |

## Status que este pacote deixa

- 5 trilhas novas (Mixkit), todas `sem-verificacao` até passar na AudD. A de piano (Classical vibes 4) é a obrigatória.
- 28 efeitos novos (Mixkit, WAV original) `liberado`: md5 igual ao ETag do servidor e licença lida no dia do download.
- Mixkit 166, 1109, 1897 e 3115 viraram `liberado` (md5 igual ao servido em 02/10).
- Os 20 efeitos e as 6 trilhas do Pixabay continuam `sem-verificacao`, com a nota "página não conferida: Pixabay bloqueia robô (403); conferir no navegador ou com o Pedro".
- Epidemic: reprovada (decisão de 02/10); nenhuma faixa dela foi tocada.

## Pra acrescentar uma trilha ou um efeito depois

1. Escolher pela listagem do Mixkit (uma página por clima, sem varrer o site) e pôr o item em `escolhidos.json` com o motivo.
2. `df -h /c` e `python -B baixa.py <chave>` (um por vez).
3. `python -B cataloga.py` e, se for trilha, `python -B audd.py --monta-fila`.
4. `python -B ../catalogos/valida.py` (0 erros).

Nada aqui foi ouvido por gente: as medidas são do espectro e do envelope. O Pedro ouve antes de virar padrão.
