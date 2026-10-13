#!/usr/bin/env bash
# Reel de 40 s em um take só: o vídeo do Remotion (Cinco40Take, saida/take40-mudo.mp4) com o som do After Effects
# (saida/som-40s.aif: narração cortada, fecho e House One, render pelo MCP), loudnorm em duas passadas pra -14 LUFS.
# Uso: bash take40.sh [vídeo mudo] [saída]   (padrão: saida/take40-mudo.mp4 -> saida/CINCO-40S.mp4)
set -eu
cd "$(dirname "$0")"
MUDO="${1:-saida/take40-mudo.mp4}"; OUT="${2:-saida/CINCO-40S.mp4}"
J=$(ffmpeg -hide_banner -i saida/som-40s.aif -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
v() { echo "$J" | grep "\"$1\"" | sed -E 's/.*: "(.*)".*/\1/'; }
ffmpeg -v error -y -i "$MUDO" -i saida/som-40s.aif -map 0:v:0 -map 1:a:0 -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(v input_i):measured_TP=$(v input_tp):measured_LRA=$(v input_lra):measured_thresh=$(v input_thresh):offset=$(v target_offset):linear=true,aresample=48000" \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"
ffprobe -v error -count_frames -show_entries stream=codec_name,width,height,r_frame_rate,nb_read_frames:format=duration,size -of compact "$OUT"
ffmpeg -hide_banner -i "$OUT" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1
