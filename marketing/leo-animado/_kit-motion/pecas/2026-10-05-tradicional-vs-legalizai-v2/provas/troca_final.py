"""troca, sem tirar do ar, o vídeo e a capa da v2 já entregues (pasta da proposta e pasta Vídeos) pelo render novo do
saida/: cria o link novo com um nome temporário ao lado e troca com os.replace (atômico no NTFS), então o arquivo nunca
some do caminho que o site e a pasta Final usam."""
import hashlib
import os
import sys

FINAL = r"C:\MKT-INSTA\Content Legalizai\marketing\final\2026-10-05 Contabilidade tradicional vs Legalizaí"
SAIDA = r"C:\MKT-INSTA\Content Legalizai\marketing\leo-animado\_kit-motion\pecas\2026-10-05-tradicional-vs-legalizai-v2\saida"
PARES = [
    (os.path.join(SAIDA, "2026-10-05-tradicional-vs-legalizai-v2.mp4"), os.path.join(FINAL, "TRADICIONAL-VS-LEGALIZAI-motion.mp4")),
    (os.path.join(SAIDA, "capa.png"), os.path.join(FINAL, "capa-do-reel.png")),
    (os.path.join(SAIDA, "2026-10-05-tradicional-vs-legalizai-v2.mp4"), r"C:\Users\EDIT-ADMIN\Videos\TRADICIONAL-VS-LEGALIZAI-motion.mp4"),
]


def md5(p):
    h = hashlib.md5()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


for origem, destino in PARES:
    if not os.path.isfile(origem):
        sys.exit(f"falta a origem: {origem}")
    if os.path.isfile(destino) and md5(destino) == md5(origem):
        print(f"já igual: {destino}")
        continue
    tmp = destino + ".novo"
    if os.path.exists(tmp):
        os.remove(tmp)
    os.link(origem, tmp)
    os.replace(tmp, destino)
    print(f"trocado: {destino} ({md5(destino)})")
