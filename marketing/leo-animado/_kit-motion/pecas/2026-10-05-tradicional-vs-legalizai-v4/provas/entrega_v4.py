"""entrega da v4 (a v3 com a narração corrigida) do reel de 05/10 na pasta Final (como na v2: o kit.py entregar recusa gravar em _versoes-anteriores):
a v3 vai pra _versoes-anteriores/<proposta>/ com o sufixo -v3 (renomeando, sem copiar: os links continuam), a v4 entra
na pasta da proposta como link do saida/ do kit, e o link da pasta Vídeos passa pra v4. Nada é apagado de verdade: a v3
continua no saida/ da peça v3 e em _versoes-anteriores.
uso: python entrega_v4.py [--simula]"""
import hashlib
import os
import sys

FINAL = r"C:\MKT-INSTA\Content Legalizai\marketing\final"
PROP = "2026-10-05 Contabilidade tradicional vs Legalizaí"
KIT = r"C:\MKT-INSTA\Content Legalizai\marketing\leo-animado\_kit-motion\pecas"
NOVO_MP4 = os.path.join(KIT, "2026-10-05-tradicional-vs-legalizai-v4", "saida", "2026-10-05-tradicional-vs-legalizai-v4.mp4")
NOVO_CAPA = os.path.join(KIT, "2026-10-05-tradicional-vs-legalizai-v4", "saida", "capa.png")
ANT_MP4 = os.path.join(KIT, "2026-10-05-tradicional-vs-legalizai-v3", "saida", "2026-10-05-tradicional-vs-legalizai-v3.mp4")
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
for p in (mp4, capa, NOVO_MP4, NOVO_CAPA, ANT_MP4):
    if not os.path.isfile(p):
        sys.exit(f"falta: {p}")
if md5(mp4) == md5(NOVO_MP4):
    sys.exit("a pasta da proposta já está com a v4: nada a fazer")
if md5(mp4) != md5(ANT_MP4):
    sys.exit("o vídeo da pasta da proposta não é a v3 do kit: parei sem mexer")
ant_guardada = os.path.join(antigas, "TRADICIONAL-VS-LEGALIZAI-motion-v3.mp4")
passos = [
    ("mkdir", antigas, None),
    ("rename", mp4, ant_guardada),
    ("rename", capa, os.path.join(antigas, "capa-do-reel-v3.png")),
    ("link", NOVO_MP4, mp4),
    ("link", NOVO_CAPA, capa),
]
if os.path.isfile(VIDEOS):
    passos += [("unlink-se-ant", VIDEOS, ant_guardada), ("link", NOVO_MP4, VIDEOS)]
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
    elif op == "unlink-se-ant":
        # só tira o link da pasta Vídeos se ele for o mesmo conteúdo da v3 guardada
        if md5(a) != md5(b):
            sys.exit(f"o arquivo da pasta Vídeos não é a v3 guardada; não mexi: {a}")
        os.remove(a)
if not SIMULA:
    print("conferência:")
    print("  proposta = v4:", md5(mp4) == md5(NOVO_MP4), "| capa = v4:", md5(capa) == md5(NOVO_CAPA))
    print("  Vídeos = v4:", os.path.isfile(VIDEOS) and md5(VIDEOS) == md5(NOVO_MP4))
    print("  v3 guardada:", md5(ant_guardada), "(a do kit:", md5(ANT_MP4) + ")")
