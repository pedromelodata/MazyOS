#!/usr/bin/env bash
# Codificação final do reel: o vídeo mudo + o mix (loudnorm em duas passadas pra -14 LUFS), AAC 192k; a capa (quadro do
# "5 motivos"); e a folha de conferência (um quadro por cena). O vídeo do AE é recodificado (H.264 alto CRF 20, bt709);
# o do Remotion já sai bt709 e vai copiado (terceiro argumento "copia").
# Uso: bash final.sh <versão> [vídeo mudo] [copia]
set -eu
AQUI="$(cd "$(dirname "$0")" && pwd)"; cd "$AQUI"
V="${1:-v1}"
MUDO="${2:-saida/cinco-motivos-mudo.mp4}"; OUT="saida/CINCO-MOTIVOS-motion-$V.mp4"
if [ "${3:-}" = "copia" ]; then VID="-c:v copy"; else VID="-c:v libx264 -profile:v high -preset slow -crf 20 -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv"; fi
J=$(ffmpeg -hide_banner -i audio/mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
mi=$(echo "$J" | grep input_i | sed -E 's/.*: "(.*)".*/\1/'); mtp=$(echo "$J" | grep input_tp | sed -E 's/.*: "(.*)".*/\1/')
mlra=$(echo "$J" | grep input_lra | sed -E 's/.*: "(.*)".*/\1/'); mth=$(echo "$J" | grep input_thresh | sed -E 's/.*: "(.*)".*/\1/')
off=$(echo "$J" | grep target_offset | sed -E 's/.*: "(.*)".*/\1/')
ffmpeg -v error -y -i "$MUDO" -i audio/mix.wav -map 0:v:0 -map 1:a:0 $VID \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$mi:measured_TP=$mtp:measured_LRA=$mlra:measured_thresh=$mth:offset=$off:linear=true,aresample=48000" \
  -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$OUT"
ffmpeg -v error -y -ss 4.4 -i "$OUT" -frames:v 1 "saida/capa-$V.png"
ffmpeg -v error -y -i "$OUT" -vf "select='eq(n\,45)+eq(n\,125)+eq(n\,230)+eq(n\,290)+eq(n\,430)+eq(n\,545)+eq(n\,720)+eq(n\,840)+eq(n\,950)+eq(n\,1010)+eq(n\,1125)+eq(n\,1210)',scale=270:-1,tile=6x2" -frames:v 1 "saida/folha-$V.jpg"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact "$OUT"
ffmpeg -hide_banner -i "$OUT" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1
