#!/usr/bin/env bash
# Renderiza o CINCO-MOTIVOS.aep pelo aerender em blocos de quadros (um processo por bloco: a memória do aerender
# acumula e trava num render inteiro) e junta os blocos com o ffmpeg, sem reencodar.
# Uso: bash renderiza.sh <saida-muda.mp4> [tamanho do bloco]
set -u
AQUI="$(cd "$(dirname "$0")" && pwd)"
SAIDA="${1:?informe o mp4 de saída}"
BLOCO="${2:-200}"
TOTAL=1299
AE="/c/Program Files/Adobe/Adobe After Effects 2026/Support Files"
TMP="$AQUI/saida/blocos-v2"
rm -rf "${TMP:?}"; mkdir -p "$TMP"
: > "$TMP/lista.txt"
for ((s = 0; s < TOTAL; s += BLOCO)); do
  e=$((s + BLOCO - 1)); ((e >= TOTAL)) && e=$((TOTAL - 1))
  out="$TMP/b$(printf %04d "$s").mp4"
  "$AE/aerender.exe" -project "$(cygpath -w "$AQUI/CINCO-MOTIVOS.aep")" -comp "CINCO-MOTIVOS" -mem_usage 5 40 -s "$s" -e "$e" -output "$(cygpath -w "$out")" > "$TMP/b$s.log" 2>&1
  n=$(ffprobe -v error -select_streams v -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$out" 2>/dev/null)
  echo "bloco $s-$e: $n quadros"
  [ "$n" = "$((e - s + 1))" ] || { echo "bloco incompleto; veja $TMP/b$s.log"; tail -5 "$TMP/b$s.log"; exit 1; }
  echo "file '$(cygpath -w "$out")'" >> "$TMP/lista.txt"
done
ffmpeg -v error -y -f concat -safe 0 -i "$TMP/lista.txt" -c copy "$SAIDA" && echo "junto: $SAIDA"
