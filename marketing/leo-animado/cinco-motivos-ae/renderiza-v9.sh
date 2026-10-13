#!/usr/bin/env bash
# Renderiza a base da v9 (CINCO-MOTIVOS-v9.aep, comp CINCO-MOTIVOS-BASE) pelo aerender em blocos de quadros, um
# processo por bloco (a memória do aerender acumula; e o render inteiro na interface derrubou o AE em 13/10, com o
# disco cheio e quase sem arquivo de paginação), e junta os blocos com o ffmpeg, sem reencodar.
# Uso: bash renderiza-v9.sh [saida.mp4] [tamanho do bloco]
set -u
AQUI="$(cd "$(dirname "$0")" && pwd)"
SAIDA="${1:-$AQUI/saida/base-ae-v9.mp4}"
BLOCO="${2:-150}"
TOTAL=1455
AE="/c/Program Files/Adobe/Adobe After Effects 2026/Support Files"
TMP="$AQUI/saida/blocos-v9"
mkdir -p "$TMP"
: > "$TMP/lista.txt"
for ((s = 0; s < TOTAL; s += BLOCO)); do
  e=$((s + BLOCO - 1)); ((e >= TOTAL)) && e=$((TOTAL - 1))
  out="$TMP/b$(printf %04d "$s").mp4"
  n=$(ffprobe -v error -select_streams v -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$out" 2>/dev/null)
  if [ "$n" != "$((e - s + 1))" ]; then
    rm -f "$out"
    "$AE/aerender.exe" -project "$(cygpath -w "$AQUI/CINCO-MOTIVOS-v9.aep")" -comp "CINCO-MOTIVOS-BASE" \
      -RStemplate "Melhores configurações" -OMtemplate "H.264 - Corresponder configurações de renderização - 40 Mbps" \
      -mem_usage 5 40 -mfr ON 60 -s "$s" -e "$e" -output "$(cygpath -w "$out")" > "$TMP/b$s.log" 2>&1
    n=$(ffprobe -v error -select_streams v -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$out" 2>/dev/null)
  fi
  echo "bloco $s-$e: $n quadros ($(date +%H:%M:%S))"
  [ "$n" = "$((e - s + 1))" ] || { echo "bloco incompleto; veja $TMP/b$s.log"; tail -5 "$TMP/b$s.log"; exit 1; }
  echo "file '$(cygpath -w "$out")'" >> "$TMP/lista.txt"
done
ffmpeg -v error -y -f concat -safe 0 -i "$TMP/lista.txt" -c copy "$SAIDA" && echo "junto: $SAIDA"
ffprobe -v error -count_frames -show_entries stream=codec_name,width,height,r_frame_rate,nb_read_frames,pix_fmt:format=duration -of compact "$SAIDA"
