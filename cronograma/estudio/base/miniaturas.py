# 22/10 (Pedro): as miniaturas da grade de assets do editor de Design (estudio/base/miniaturas/<nome>.webp). A grade
# baixava o PNG inteiro de cada asset (o Léo chega a 4,5 MB, a categoria Léo soma uns 37 MB) a cada vez que alguém abre
# a aba Assets pelo link público. A miniatura é WEBP com alfa, lado maior de 320 px; o canvas e a exportação continuam
# usando o arquivo original. SVG não ganha miniatura (já é leve: a rota manda o próprio SVG).
# 22/10 (Pedro: "demorando muito para carregar"): também a versão de tela (estudio/base/telas/<nome>.webp), WEBP com
# alfa e lado maior de 1200 px, que o canvas do editor mostra (o Destaque 03 baixava 8,5 MB de PNG pra abrir). A
# exportação continua no arquivo original, na qualidade máxima.
# O servidor (estudio-assets.mjs) serve GET /api/estudio/assets/:id/miniatura e /tela: a versão quando ela existe,
# senão o original. Rodar depois do montar-banco.py ou do importar-atelie.py, com o Python do venv do corte-viral:
#   "C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe" -I estudio/base/miniaturas.py
import json
import sys
from pathlib import Path

from PIL import Image

BASE = Path(__file__).resolve().parent
ASSETS = BASE / 'assets'
# (pasta, lado maior em px, qualidade do WEBP)
VERSOES = [(BASE / 'miniaturas', 320, 82), (BASE / 'telas', 1200, 86)]


def main():
    cat = json.loads((BASE / 'catalogo.json').read_text(encoding='utf-8'))
    for pasta, lado, qualidade in VERSOES:
        pasta.mkdir(exist_ok=True)
        feitas = set()
        total = 0
        for a in cat['assets']:
            arq = ASSETS / a['arquivo']
            if arq.suffix.lower() not in ('.png', '.jpg', '.webp'):
                continue
            im = Image.open(arq).convert('RGBA')
            im.thumbnail((lado, lado), Image.LANCZOS)
            destino = pasta / f'{arq.stem}.webp'
            im.save(destino, 'WEBP', quality=qualidade, method=6)
            feitas.add(destino.name)
            total += destino.stat().st_size
        # versão de asset que saiu do catálogo sai junto
        for p in pasta.iterdir():
            if p.name not in feitas:
                p.unlink()
        print(pasta.name, len(feitas), 'arquivos,', round(total / 1024, 1), 'KB')


if __name__ == '__main__':
    sys.exit(main())
