#!/usr/bin/env bash
# Reel de 40 s pelo prompt do Pedro (13/10/2026): o vídeo do Remotion (Cinco40Prompt, saida/prompt40-mudo.mp4) com o
# som do mix-prompt40.py (saida/som-prompt40.wav: narração numa tomada só e House One), loudnorm em duas passadas pra
# -14 LUFS. O vídeo é recodificado com -tune grain pra o preto com brilho não virar faixas.
# Uso: bash junta-prompt40.sh   (saída: saida/CINCO-40S-prompt.mp4)
set -eu
cd "$(dirname "$0")"
SOM=saida/som-prompt40.wav; OUT=saida/CINCO-40S-prompt.mp4
J=$(ffmpeg -hide_banner -i "$SOM" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
v() { echo "$J" | grep "\"$1\"" | sed -E 's/.*: "(.*)".*/\1/'; }
ffmpeg -v error -y -i saida/prompt40-mudo.mp4 -i "$SOM" -map 0:v:0 -map 1:a:0 \
  -c:v libx264 -profile:v high -preset slow -tune grain -crf 21 -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(v input_i):measured_TP=$(v input_tp):measured_LRA=$(v input_lra):measured_thresh=$(v input_thresh):offset=$(v target_offset):linear=true,aresample=48000" \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest "$OUT"
ffprobe -v error -count_frames -show_entries stream=codec_name,width,height,r_frame_rate,nb_read_frames:format=duration,size -of compact "$OUT"
ffmpeg -hide_banner -i "$OUT" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1
