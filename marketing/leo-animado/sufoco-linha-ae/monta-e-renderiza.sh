#!/usr/bin/env bash
# Gera o monta.jsx, monta o projeto no After Effects aberto (o -r do AE não roda caminho com espaço, então o script
# vai por uma cópia no Temp) e renderiza pelo aerender.
# Uso: bash monta-e-renderiza.sh <saida.mp4> [--so-monta]
set -u
AQUI="$(cd "$(dirname "$0")" && pwd)"
TMPW="$(cygpath -w "${TEMP:-/tmp}")"
TMPU="$(cygpath -u "$TMPW")"
SAIDA="${1:?informe o mp4 de saída}"
AE="/c/Program Files/Adobe/Adobe After Effects 2026/Support Files"

cd "$AQUI" && node gera.mjs | tail -1 || exit 1
cp "$AQUI/monta.jsx" "$TMPU/sufoco_monta.jsx"
rm -f "$AQUI/monta.log"
powershell -NoProfile -Command "& '$(cygpath -w "$AE/AfterFX.exe")' -r '$TMPW\\sufoco_monta.jsx'" >/dev/null 2>&1
for i in $(seq 1 180); do [ -s "$AQUI/monta.log" ] && break; sleep 2; done
cat "$AQUI/monta.log" 2>/dev/null || { echo "sem log da montagem"; exit 1; }
grep -q "^ok" "$AQUI/monta.log" || exit 1
[ "${2:-}" = "--so-monta" ] && exit 0
"$AE/aerender.exe" -project "$(cygpath -w "$AQUI/SUFOCO-LINHA.aep")" -comp "SUFOCO-LINHA" -output "$(cygpath -w "$SAIDA")" > "$AQUI/aerender.log" 2>&1
grep -a -i "mem.ria\|erro\|error" "$AQUI/aerender.log" | head -5
tail -2 "$AQUI/aerender.log"
