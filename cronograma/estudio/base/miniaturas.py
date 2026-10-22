# 22/10 (Pedro): as miniaturas da grade de assets do editor de Design (estudio/base/miniaturas/<nome>.webp). A grade
# baixava o PNG inteiro de cada asset (o Léo chega a 4,5 MB, a categoria Léo soma uns 37 MB) a cada vez que alguém abre
# a aba Assets pelo link público. A miniatura é WEBP com alfa, lado maior de 320 px; o canvas e a exportação continuam
# usando o arquivo original. SVG não ganha miniatura (já é leve: a rota manda o próprio SVG).
# O servidor (estudio-assets.mjs) serve GET /api/estudio/assets/:id/miniatura: a miniatura quando ela existe e é mais
# nova que o asset, senão o original. Rodar depois do montar-banco.py ou do importar-atelie.py, com o Python do venv
# do corte-viral:
#   "C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe" -I estudio/base/miniaturas.py
import json
import sys
from pathlib import Path

from PIL import Image

BASE = Path(__file__).resolve().parent
ASSETS = BASE / 'assets'
MINI = BASE / 'miniaturas'
LADO = 320


def main():
    MINI.mkdir(exist_ok=True)
    cat = json.loads((BASE / 'catalogo.json').read_text(encoding='utf-8'))
    feitas = set()
    total = 0
    for a in cat['assets']:
        arq = ASSETS / a['arquivo']
        if arq.suffix.lower() not in ('.png', '.jpg', '.webp'):
            continue
        im = Image.open(arq).convert('RGBA')
        im.thumbnail((LADO, LADO), Image.LANCZOS)
        destino = MINI / f'{arq.stem}.webp'
        im.save(destino, 'WEBP', quality=82, method=6)
        feitas.add(destino.name)
        total += destino.stat().st_size
    # miniatura de asset que saiu do catálogo sai junto
    for p in MINI.iterdir():
        if p.name not in feitas:
            p.unlink()
    print(len(feitas), 'miniaturas,', round(total / 1024, 1), 'KB')


if __name__ == '__main__':
    sys.exit(main())
