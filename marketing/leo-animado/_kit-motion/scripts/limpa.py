"""Limpeza do Temp depois de render e stills (pacote K07). Contrato: KIT/DESENHO.md, seções 7.1, 7.4 e 13.

Apaga, dentro do %TEMP%, só pastas com os nomes da constante PADROES (as que o Remotion e o Chrome deixam):
remotion-webpack-bundle-*, puppeteer_dev_chrome_profile-*, react-motion-render* e remotion-*.
Por padrão só as criadas (ou mexidas) depois do início do comando; com --tudo, todas com esses nomes.
Nunca segue link (link simbólico ou junção é apagado como link, sem entrar), nunca sai do %TEMP% e nunca
apaga arquivo solto na raiz do Temp nem a pasta claude/ (scratchpad das sessões).

Uso (sempre com python -B):
    python -B limpa.py [--tudo] [--desde <segundos desde a época | -<N>min>] [--simula] [--json]
Importável: limpa(desde=None, tudo=False, simula=False) -> {"apagadas", "falhas", "bytes", "temp"}
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import json  # noqa: E402
import os  # noqa: E402
import stat  # noqa: E402
import time  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402

PADROES = ("remotion-webpack-bundle-", "puppeteer_dev_chrome_profile-", "react-motion-render", "remotion-")
_REPARSE = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
INICIO = time.time()


def _e_link(st):
    return stat.S_ISLNK(st.st_mode) or bool(getattr(st, "st_file_attributes", 0) & _REPARSE)


def _criado(st):
    # no Windows (Python 3.11) st_ctime é a criação; st_birthtime vem no 3.12
    return getattr(st, "st_birthtime", st.st_ctime)


def candidatas(desde=None, tudo=False):
    """Pastas do Temp com nome de PADROES (sem link); sem --tudo, só as criadas ou mexidas desde `desde`."""
    raiz = comum.temp()
    desde = INICIO if desde is None else desde
    out = []
    with os.scandir(raiz) as it:
        for e in it:
            if not e.name.startswith(PADROES):
                continue
            try:
                st = os.lstat(e.path)
            except OSError:
                continue
            if _e_link(st) or not stat.S_ISDIR(st.st_mode):
                continue
            if os.path.dirname(os.path.realpath(e.path)).replace("\\", "/").casefold() != raiz.casefold():
                continue
            if not tudo and max(_criado(st), st.st_mtime) < desde - 1.0:
                continue
            out.append(comum.barra(e.path))
    return sorted(out)


def _tamanho(p):
    total = 0
    pilha = [p]
    while pilha:
        atual = pilha.pop()
        try:
            with os.scandir(atual) as it:
                for e in it:
                    try:
                        st = e.stat(follow_symlinks=False)
                    except OSError:
                        continue
                    if _e_link(st):
                        continue
                    if stat.S_ISDIR(st.st_mode):
                        pilha.append(e.path)
                    else:
                        total += st.st_size
        except OSError:
            pass
    return total


def _remove_arquivo(p):
    try:
        os.unlink(p)
    except PermissionError:
        os.chmod(p, stat.S_IWRITE)
        os.unlink(p)


def apaga_arvore(pasta):
    """Apaga a árvore sem seguir link: link (ou junção) é removido como link, sem entrar."""
    with os.scandir(pasta) as it:
        entradas = list(it)
    for e in entradas:
        st = e.stat(follow_symlinks=False)
        if _e_link(st):
            if stat.S_ISDIR(st.st_mode) or e.is_dir(follow_symlinks=False):
                os.rmdir(e.path)  # remove a junção ou o link de pasta, nunca o alvo
            else:
                _remove_arquivo(e.path)
        elif stat.S_ISDIR(st.st_mode):
            apaga_arvore(e.path)
        else:
            _remove_arquivo(e.path)
    os.rmdir(pasta)


def limpa(desde=None, tudo=False, simula=False, tentativas=12):
    """Apaga as candidatas (com algumas tentativas: o Chrome segura o perfil por um instante depois de fechar)."""
    raiz = comum.temp()
    res = {"temp": raiz, "apagadas": [], "falhas": [], "bytes": 0, "simula": simula}
    for p in candidatas(desde, tudo):
        tam = _tamanho(p)
        if simula:
            res["apagadas"].append(p)
            res["bytes"] += tam
            continue
        erro = None
        for _ in range(tentativas):
            try:
                apaga_arvore(p)
                erro = None
                break
            except FileNotFoundError:
                erro = None
                break
            except OSError as e:
                erro = e
                time.sleep(0.25)
        if erro is None and not os.path.exists(p):
            res["apagadas"].append(p)
            res["bytes"] += tam
        else:
            res["falhas"].append({"pasta": p, "erro": str(erro)})
    return res


def _desde(txt):
    if txt is None:
        return None
    txt = txt.strip()
    if txt.endswith("min"):
        return time.time() - abs(float(txt[:-3])) * 60
    return float(txt)


def main(argv=None):
    comum.utf8()
    ap = argparse.ArgumentParser(prog="limpa.py", description="Apaga do Temp as pastas do Remotion e do Chrome (K07).")
    ap.add_argument("--tudo", action="store_true", help="todas as pastas com esses nomes, de qualquer hora")
    ap.add_argument("--desde", help="só as criadas desde este instante (segundos desde a época, ou -<N>min)")
    ap.add_argument("--simula", action="store_true", help="só lista")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    r = limpa(_desde(a.desde), a.tudo, a.simula)
    if a.json:
        print(json.dumps(r, ensure_ascii=False, indent=2))
    else:
        verbo = "apagaria" if a.simula else "apagou"
        print("Temp: %s" % r["temp"])
        for p in r["apagadas"]:
            print("  %s %s" % (verbo, p))
        for f in r["falhas"]:
            print("  NÃO apagou %s (%s): tente de novo com o processo fechado" % (f["pasta"], f["erro"]))
        print("%s %d pasta(s), %.1f MB; %d falha(s)" % (verbo, len(r["apagadas"]), r["bytes"] / 1048576, len(r["falhas"])))
    return 1 if r["falhas"] else 0


if __name__ == "__main__":
    sys.exit(main())
