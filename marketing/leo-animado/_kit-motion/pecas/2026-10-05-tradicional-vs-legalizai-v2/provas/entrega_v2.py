"""entrega da v2 do reel de 05/10 na pasta Final (o kit.py entregar recusou criar a subpasta de _versoes-anteriores):
a v1 vai pra _versoes-anteriores/<proposta>/ com o sufixo -v1 (renomeando, sem copiar: os links continuam), a v2 entra
na pasta da proposta como link do saida/ do kit, e o link da pasta Vídeos passa pra v2. Nada é apagado de verdade: a v1
continua no saida/ da peça v1 e em _versoes-anteriores."""
import hashlib
import os
import sys

FINAL = r"C:\MKT-INSTA\Content Legalizai\marketing\final"
PROP = "2026-10-05 Contabilidade tradicional vs Legalizaí"
KIT = r"C:\MKT-INSTA\Content Legalizai\marketing\leo-animado\_kit-motion\pecas"
V2_MP4 = os.path.join(KIT, "2026-10-05-tradicional-vs-legalizai-v2", "saida", "2026-10-05-tradicional-vs-legalizai-v2.mp4")
V2_CAPA = os.path.join(KIT, "2026-10-05-tradicional-vs-legalizai-v2", "saida", "capa.png")
VIDEOS = r"C:\Users\EDIT-ADMIN\Videos\TRADICIONAL-VS-LEGALIZAI-motion.mp4"
SIMULA = "--simula" in sys.argv


def md5(p):
    h = hashlib.md5()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


pasta = os.path.join(FINAL, PROP)
antigas = os.path.join(FINAL, "_versoes-anteriores", PROP)
mp4 = os.path.join(pasta, "TRADICIONAL-VS-LEGALIZAI-motion.mp4")
capa = os.path.join(pasta, "capa-do-reel.png")
for p in (mp4, capa, V2_MP4, V2_CAPA):
    if not os.path.isfile(p):
        sys.exit(f"falta: {p}")
if md5(mp4) == md5(V2_MP4):
    sys.exit("a pasta da proposta já está com a v2: nada a fazer")
passos = [
    ("mkdir", antigas, None),
    ("rename", mp4, os.path.join(antigas, "TRADICIONAL-VS-LEGALIZAI-motion-v1.mp4")),
    ("rename", capa, os.path.join(antigas, "capa-do-reel-v1.png")),
    ("link", V2_MP4, mp4),
    ("link", V2_CAPA, capa),
]
if os.path.isfile(VIDEOS):
    passos += [("unlink-se-v1", VIDEOS, os.path.join(antigas, "TRADICIONAL-VS-LEGALIZAI-motion-v1.mp4")), ("link", V2_MP4, VIDEOS)]
for op, a, b in passos:
    print(f"{'(simulação) ' if SIMULA else ''}{op}: {a}{'  ->  ' + b if b else ''}")
    if SIMULA:
        continue
    if op == "mkdir":
        os.makedirs(a, exist_ok=True)
    elif op == "rename":
        if os.path.exists(b):
            sys.exit(f"já existe, nada sobrescrito: {b}")
        os.rename(a, b)
    elif op == "link":
        if os.path.exists(b):
            sys.exit(f"já existe, nada sobrescrito: {b}")
        os.link(a, b)
    elif op == "unlink-se-v1":
        # só tira o link da pasta Vídeos se ele for o mesmo arquivo da v1 guardada (mesmo conteúdo)
        if md5(a) != md5(b):
            sys.exit(f"o arquivo da pasta Vídeos não é a v1 guardada; não mexi: {a}")
        os.remove(a)
if not SIMULA:
    print("conferência:")
    print("  proposta = v2:", md5(mp4) == md5(V2_MP4), "| capa = v2:", md5(capa) == md5(V2_CAPA))
    print("  Vídeos = v2:", os.path.isfile(VIDEOS) and md5(VIDEOS) == md5(V2_MP4))
    print("  v1 guardada:", md5(os.path.join(antigas, "TRADICIONAL-VS-LEGALIZAI-motion-v1.mp4")))
