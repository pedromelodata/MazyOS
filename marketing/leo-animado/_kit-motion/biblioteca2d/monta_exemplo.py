"""Monta uma peça de teste a partir de um exemplo da biblioteca 2D (pacote K14).

A cena e a narração vêm da peça do guia (KIT/pecas/guia-pronta-2026-10-14: cópia de conteúdo da cenas.json e da
voz/narracao.json; o narr-dylan.wav entra por hardlink). A cena do guia perde os objetos 3D, as telas e as batidas
dele e ganha as camadas e as batidas do exemplo, a trilha liberada House One, o fecho desligado e publico "ambos".
Toda escrita passa pelo KIT/lib/escrita.py; nada é gravado na peça do guia.

Uso (sempre com python -B):
    PY -B KIT/biblioteca2d/monta_exemplo.py <exemplo.json> <pasta da peça (absoluta)> [--cena cenas-ex.json] [--forca]
Depois:
    PY -B KIT/scripts/kit.py props <pasta da peça> --cena cenas-ex.json   (e eventos, qc, fatos, stills)
Exemplo de pasta: o scratchpad da sessão. Não use KIT/pecas/<peça de verdade>.
"""
import argparse
import copy
import json
import os
import sys

sys.dont_write_bytecode = True
KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(KIT, "lib"))
import escrita  # noqa: E402

GUIA = os.path.join(KIT, "pecas", "guia-pronta-2026-10-14")


def monta(exemplo, pasta, nome_cena="cenas-ex.json", forca=False):
    pasta = os.path.abspath(pasta)
    if os.path.normcase(pasta).startswith(os.path.normcase(GUIA)):
        raise SystemExit("recusado: a peça de teste não pode ficar dentro da peça do guia")
    frag = json.load(open(exemplo, encoding="utf-8"))
    for campo in ("camadas", "batidas"):
        if not isinstance(frag.get(campo), list):
            raise SystemExit("o exemplo precisa de %s (lista)" % campo)
    destino = os.path.join(pasta, nome_cena)
    if os.path.exists(destino) and not forca:
        raise SystemExit("já existe: %s (use --forca pra regravar)" % destino)
    os.makedirs(os.path.join(pasta, "voz"), exist_ok=True)
    narr = os.path.join(pasta, "voz", "narracao.json")
    if not os.path.exists(narr):
        escrita.copia(os.path.join(GUIA, "voz", "narracao.json"), narr)
    wav = os.path.join(pasta, "voz", "narr-dylan.wav")
    info = escrita.liga(os.path.join(GUIA, "voz", "narr-dylan.wav"), wav)
    base = json.load(open(os.path.join(GUIA, "cenas.json"), encoding="utf-8"))
    cena = copy.deepcopy(base)
    cena["peca"] = os.path.basename(pasta)
    cena["titulo"] = "Teste da biblioteca 2D: %s (não entregar)" % os.path.splitext(os.path.basename(exemplo))[0]
    cena["objetos"] = []
    cena["telas"] = {}
    cena["regioes"] = {}
    cena["camadas"] = frag["camadas"]
    cena["batidas"] = frag["batidas"]
    cena["marcas"] = frag.get("marcas", {})
    if "legenda" in frag:
        cena["legenda"] = frag["legenda"]
    cena["trilha"] = {"id": "mixkit-04-house-one", "mStart": 51.711, "ganhoDb": -6.7}
    cena["fecho"] = None
    cena["sons"] = {"perfil": "v2", "modoRuido": "por-evento", "extras": [], "remover": []}
    cena["fatos"] = {"publico": "ambos", "exemplos": []}
    cena["capa"] = None
    cena["notas"] = "Peça de teste da biblioteca 2D (%s). %s" % (os.path.basename(exemplo), frag.get("notas", ""))
    escrita.grava_json(destino, cena, forca=forca)
    print("peça: %s" % pasta)
    print("cena: %s (%d camadas, %d batidas)" % (destino, len(cena["camadas"]), len(cena["batidas"])))
    print("voz: narracao.json por cópia; narr-dylan.wav por hardlink (st_nlink %d)" % info["st_nlink"])
    print("próximo: PY -B KIT/scripts/kit.py props \"%s\" --cena %s" % (pasta, nome_cena))
    return destino


def main(argv=None):
    p = argparse.ArgumentParser(prog="monta_exemplo.py", description="Monta uma peça de teste a partir de um exemplo da biblioteca 2D.")
    p.add_argument("exemplo", help="arquivo do exemplo (KIT/biblioteca2d/exemplos/*.json)")
    p.add_argument("pasta", help="pasta da peça de teste (caminho absoluto, fora de KIT/pecas/guia-pronta-2026-10-14)")
    p.add_argument("--cena", default="cenas-ex.json", help="nome da cena na peça (padrão cenas-ex.json)")
    p.add_argument("--forca", action="store_true", help="regrava a cena se ela já existir")
    a = p.parse_args(argv)
    if not os.path.isabs(a.pasta):
        raise SystemExit("a pasta precisa ser caminho absoluto")
    monta(a.exemplo, a.pasta, a.cena, a.forca)
    return 0


if __name__ == "__main__":
    sys.exit(main())
