#!/usr/bin/env bash
# v9: o Remotion renderiza só o iPhone 3D e a luz (composição CincoV9Celular, com alfa, VP8) nos quadros em que o
# celular aparece, e o ffmpeg cola essa camada por cima da base do AE (saida/base-ae-v9.mp4). Nesta máquina o
# OffthreadVideo não roda (Smart App Control), por isso a base não entra no Remotion.
# Uso: bash junta-v9.sh [saída muda.mp4] [so-junta]   (so-junta: reaproveita o saida/celular-v9.webm, só cola)
set -eu
AQUI="$(cd "$(dirname "$0")" && pwd)"
RM="C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion"
SAIDA="${1:-$AQUI/saida/cinco-motivos-mudo-v9.mp4}"
CEL="$(cygpath -m "$AQUI")/saida/celular-v9.webm"
Q0=905; Q1=1380   # o celular vai de 25,2 + D a 40,62 + D (quadros 912 a 1375), com folga
if [ "${2:-}" != "so-junta" ]; then
cd "$RM"
npx remotion render src/index.ts CincoV9Celular "$CEL" --public-dir=public-cinco-v9 --binaries-directory="$RM/bin" \
  --browser-executable="C:/Users/EDIT-ADMIN/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe" \
  --gl=angle --concurrency=4 --codec=vp8 --pixel-format=yuva420p --image-format=png --video-bitrate=40M --frames=$Q0-$Q1 --muted
TMPW="$(cygpath -u "$TEMP")"
for d in "$TMPW"/puppeteer_dev_chrome_profile-* "$TMPW"/remotion-webpack-bundle-* "$TMPW"/react-motion-render*; do
  [ -e "$d" ] && { rm -rf "${d:?}" 2>/dev/null || true; }
done
fi
cd "$AQUI"
ffmpeg -v error -y -i saida/base-ae-v9.mp4 -c:v libvpx -i "$CEL" \
  -filter_complex "[1:v]setpts=PTS+$Q0/30/TB[c];[0:v][c]overlay=eof_action=pass:format=yuv420,format=yuv420p[v]" -map "[v]" \
  -c:v libx264 -profile:v high -preset slow -crf 18 -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -movflags +faststart "$SAIDA"
ffprobe -v error -count_frames -show_entries stream=codec_name,width,height,r_frame_rate,nb_read_frames,pix_fmt,color_space:format=duration -of compact "$SAIDA"
