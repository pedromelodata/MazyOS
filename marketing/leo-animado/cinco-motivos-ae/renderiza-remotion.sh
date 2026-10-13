#!/usr/bin/env bash
# Render da versão Remotion (v3 em diante): composição CincoMotivos, muda, bt709. O som entra no final.sh (copia).
# Uso: bash renderiza-remotion.sh [saída.mp4] [composição]   (a v9 usa a CincoV9: a base do AE com o celular por cima)
set -eu
AQUI="$(cd "$(dirname "$0")" && pwd)"
RM="C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion"
OUT="${1:-$(cygpath -m "$AQUI")/saida/cinco-motivos-mudo-v3.mp4}"
COMP="${2:-CincoMotivos}"
cd "$RM"
npx remotion render src/index.ts "$COMP" "$OUT" --public-dir=public-cinco --binaries-directory="$RM/bin" \
  --browser-executable="C:/Users/EDIT-ADMIN/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe" \
  --gl=angle --concurrency=4 --color-space=bt709 --codec=h264 --crf=18 --muted
# o render deixa perfis do Chrome e bundles no Temp (lotam o disco)
TMPW="$(cygpath -u "$TEMP")"
for d in "$TMPW"/puppeteer_dev_chrome_profile-* "$TMPW"/remotion-webpack-bundle-* "$TMPW"/react-motion-render*; do
  [ -e "$d" ] && { rm -rf "${d:?}" 2>/dev/null || true; }
done
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,color_space,color_range:format=duration -of compact "$OUT"
