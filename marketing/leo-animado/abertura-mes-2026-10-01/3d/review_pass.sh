#!/usr/bin/env bash
# Uma rodada de revisão do img2threejs pra passada atual: gera a fábrica, sincroniza no Remotion,
# renderiza referência (com e sem mapas) + 4 órbitas, roda Tier 1, multi-ângulo e a folha comparativa.
#   bash review_pass.sh <pass-id> <tag>
set -e
PASS="$1"; TAG="$2"
HERE="/c/MKT-INSTA/Content Legalizai/marketing/leo-animado/abertura-mes-2026-10-01/3d"
REM="/c/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion"
PY=/c/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe
F=~/.claude/skills/img2threejs/forge
B="C:/Users/EDIT-ADMIN/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe"
export PYTHONIOENCODING=utf-8
cd "$HERE"
$PY $F/stage2_spec/validate_sculpt_spec.py object-sculpt-spec.json --strict-quality | head -1
$PY $F/stage3_build/generate_threejs_factory.py object-sculpt-spec.json --out src/createClayCalendarModel.ts --pass-id "$PASS" --force > /dev/null
$PY sync_factory.py | tail -1
cp -lf pbr/*/*.png "$REM/public-abertura/" 2>/dev/null || cp -f pbr/*/*.png "$REM/public-abertura/"
cd "$REM"
for v in "-34 24 reference false ref" "-34 24 reference true stripped" "0 8 neutral false front" "60 15 neutral false right" "180 10 neutral false rear" "-90 10 neutral false left" "-34 24 grazing false grazing"; do
  set -- $v
  npx remotion still src/index.ts CalendarioReview "$(cygpath -w "$HERE/renders/$TAG-$5.png")" --frame=0 --gl=angle \
    --props="{\"azimuth\":$1,\"elevation\":$2,\"mode\":\"$3\",\"stripMaps\":$4}" --public-dir="$(cygpath -w "$PWD/public-abertura")" \
    --browser-executable="$B" --binaries-directory="$(cygpath -w "$PWD/bin")" --log=error > /dev/null 2>&1
done
cd "$HERE"
$PY $F/stage4_review/diagnose_render.py --reference ref-calendario.png --render renders/$TAG-ref.png --map-stripped-render renders/$TAG-stripped.png \
  --spec object-sculpt-spec.json --pass-id "$PASS" --in-place --json > evidence/tier1-$TAG.json 2>&1 || true
$PY -c "
import json;t=open('evidence/tier1-$TAG.json').read(); d=json.loads(t[t.index('{'):]); c=d['checks']
print('tier1', d['passed'], 'IoU', c['silhouetteIoU'], 'aspect', c['aspectRatioDelta'], 'scale', c['scaleDelta'], 'dEmax', c['colorDelta']['maxDeltaE'], d.get('failures'))"
$PY $F/stage4_review/diagnose_render_multi_angle.py --reference renders/$TAG-ref.png --orbit renders/$TAG-front.png --orbit renders/$TAG-right.png \
  --orbit renders/$TAG-left.png --orbit renders/$TAG-rear.png --json > evidence/multi-angle-$TAG.json 2>&1 || true
grep '"degenerate": ' evidence/multi-angle-$TAG.json | tail -1
$PY $F/stage4_review/make_comparison_sheet.py --reference ref-calendario.png --render renders/$TAG-ref.png --out renders/cmp-$TAG.png --json > /dev/null 2>&1
$PY -c "
from PIL import Image
ims=[Image.open('renders/$TAG-%s.png'%n).convert('RGB').resize((260,260)) for n in ['front','right','rear','left','grazing']]
o=Image.new('RGB',(5*265,260),'white'); [o.paste(im,(i*265,0)) for i,im in enumerate(ims)]; o.save('renders/orbit-$TAG.jpg')"
echo "revisão $PASS ($TAG) pronta"
