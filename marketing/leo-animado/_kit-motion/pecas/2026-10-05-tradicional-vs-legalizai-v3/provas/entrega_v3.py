"""entrega da v3 do reel de 05/10 na pasta Final (como na v2: o kit.py entregar recusa gravar em _versoes-anteriores):
a v2 vai pra _versoes-anteriores/<proposta>/ com o sufixo -v2 (renomeando, sem copiar: os links continuam), a v3 entra
na pasta da proposta como link do saida/ do kit, e o link da pasta Vídeos passa pra v3. Nada é apagado de verdade: a v2
continua no saida/ da peça v2 e em _versoes-anteriores.
uso: python entrega_v3.py [--simula]"""
import hashlib
import os
import sys

FINAL = r"C:\MKT-INSTA\Content Legalizai\marketing\final"
PROP = "2026-10-05 Contabilidade tradicional vs Legalizaí"
KIT = r"C:\MKT-INSTA\Content Legalizai\marketing\leo-animado\_kit-motion\pecas"
V3_MP4 = os.path.join(KIT, "2026-10-05-tradicional-vs-legalizai-v3", "saida", "2026-10-05-tradicional-vs-legalizai-v3.mp4")
V3_CAPA = os.path.join(KIT, "2026-10-05-tradicional-vs-legalizai-v3", "saida", "capa.png")
V2_MP4 = os.path.join(KIT, "2026-10-05-tradicional-vs-legalizai-v2", "saida", "2026-10-05-tradicional-vs-legalizai-v2.mp4")
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
for p in (mp4, capa, V3_MP4, V3_CAPA, V2_MP4):
    if not os.path.isfile(p):
        sys.exit(f"falta: {p}")
if md5(mp4) == md5(V3_MP4):
    sys.exit("a pasta da proposta já está com a v3: nada a fazer")
if md5(mp4) != md5(V2_MP4):
    sys.exit("o vídeo da pasta da proposta não é a v2 do kit: parei sem mexer")
v2_guardada = os.path.join(antigas, "TRADICIONAL-VS-LEGALIZAI-motion-v2.mp4")
passos = [
    ("mkdir", antigas, None),
    ("rename", mp4, v2_guardada),
    ("rename", capa, os.path.join(antigas, "capa-do-reel-v2.png")),
    ("link", V3_MP4, mp4),
    ("link", V3_CAPA, capa),
]
if os.path.isfile(VIDEOS):
    passos += [("unlink-se-v2", VIDEOS, v2_guardada), ("link", V3_MP4, VIDEOS)]
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
    elif op == "unlink-se-v2":
        # só tira o link da pasta Vídeos se ele for o mesmo conteúdo da v2 guardada
        if md5(a) != md5(b):
            sys.exit(f"o arquivo da pasta Vídeos não é a v2 guardada; não mexi: {a}")
        os.remove(a)
if not SIMULA:
    print("conferência:")
    print("  proposta = v3:", md5(mp4) == md5(V3_MP4), "| capa = v3:", md5(capa) == md5(V3_CAPA))
    print("  Vídeos = v3:", os.path.isfile(VIDEOS) and md5(VIDEOS) == md5(V3_MP4))
    print("  v2 guardada:", md5(v2_guardada), "(a do kit:", md5(V2_MP4) + ")")
