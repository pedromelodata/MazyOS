"""Mídia de extensão no public-kit: kit.py ext-liga e ext-desliga (pacote K07). Contrato: KIT/DESENHO.md, 4.10.

O midia.json da extensão (RM/src/kit/ext/<nome>/midia.json): {versao: 1, links: [{origem, destino, padrao?}]}
- origem: caminho absoluto (arquivo, ou pasta quando há padrao);
- destino: relativo ao RM/public-kit (o arquivo, ou a pasta onde a árvore da origem entra);
- padrao: glob relativo à origem (ex.: "**/*.png"), só quando a origem é pasta.
ext-liga liga cada arquivo por hardlink (escrita.liga, conferindo tamanho e st_nlink); nada é copiado.
ext-desliga só apaga o link cujo inode é o da origem (arquivo que não é o mesmo da origem fica, com aviso) e tira
as pastas que ficaram vazias, sem passar da raiz do public-kit nem das pastas fixas (ext/, pecas/, telas/...).

Importável: pares(midia) -> [(origem, destino)]; liga(nome, midia=None, simula=False); desliga(...)
"""
import sys

sys.dont_write_bytecode = True

import glob  # noqa: E402
import os  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
from comum import escrita  # noqa: E402

# pastas do public-kit que nunca são removidas, mesmo vazias
FIXAS = {"", "ext", "pecas", "telas", "marca", "3d"}


def caminho_midia(nome):
    return comum.barra(os.path.join(comum.RM, "src", "kit", "ext", nome, "midia.json"))


def pares(midia, public_kit=None):
    """Expande os links do midia.json em pares (origem, destino) absolutos."""
    pk = os.path.abspath(public_kit or comum.PUBLIC_KIT)
    if not isinstance(midia, dict) or midia.get("versao") != 1 or not isinstance(midia.get("links"), list):
        raise comum.ErroSaida("midia.json fora do contrato: precisa de {versao: 1, links: [...]}", 2)
    out = []
    for i, ln in enumerate(midia["links"]):
        origem, destino, padrao = ln.get("origem"), ln.get("destino"), ln.get("padrao")
        if not origem or not os.path.isabs(origem):
            raise comum.ErroSaida("links[%d]: origem precisa ser caminho absoluto" % i, 2)
        if not destino or os.path.isabs(destino) or ".." in destino.replace("\\", "/").split("/"):
            raise comum.ErroSaida("links[%d]: destino precisa ser relativo ao public-kit, sem '..'" % i, 2)
        dest_abs = os.path.abspath(os.path.join(pk, destino))
        if not (dest_abs + os.sep).lower().startswith(pk.lower() + os.sep):
            raise comum.ErroSaida("links[%d]: o destino sai do public-kit" % i, 2)
        if padrao:
            if not os.path.isdir(origem):
                raise comum.ErroSaida("links[%d]: com padrao, a origem precisa ser pasta: %s" % (i, origem), 2)
            achados = sorted(p for p in glob.glob(os.path.join(origem, padrao), recursive=True) if os.path.isfile(p))
            for p in achados:
                rel = os.path.relpath(p, origem)
                out.append((comum.barra(p), comum.barra(os.path.join(dest_abs, rel))))
        else:
            if not os.path.isfile(origem):
                raise comum.ErroSaida("links[%d]: a origem não existe ou não é arquivo: %s" % (i, origem), 2)
            out.append((comum.barra(origem), comum.barra(dest_abs)))
    return out


def _le(nome, midia):
    arq = midia or caminho_midia(nome)
    if not os.path.isfile(arq):
        raise comum.ErroSaida("a extensão %s não tem midia.json (%s)" % (nome, arq), 2)
    return arq, comum.le_json(arq)


def liga(nome, midia=None, simula=False):
    arq, doc = _le(nome, midia)
    rel = {"extensao": nome, "midia": comum.barra(arq), "ligados": [], "jaLigados": [], "simula": simula}
    lista = pares(doc)
    for origem, destino in lista:
        if escrita.protegido(destino):
            raise comum.ErroSaida("destino protegido: %s" % destino, 2)
        if os.path.lexists(destino):
            if os.path.isfile(destino) and os.path.samefile(origem, destino):
                rel["jaLigados"].append(destino)
                continue
            raise comum.ErroSaida("%s já existe e não é a origem %s: nada foi ligado depois deste" % (destino, origem))
        if simula:
            print("  ligaria %s  ->  %s" % (origem, destino))
            rel["ligados"].append(destino)
            continue
        info = escrita.liga(origem, destino, cria_pasta=True)
        rel["ligados"].append(info["destino"])
    print("ext-liga %s: %d %s, %d já ligado(s) (%s)" % (nome, len(rel["ligados"]), "a ligar" if simula else "ligado(s)",
                                                       len(rel["jaLigados"]), rel["midia"]))
    if rel["ligados"] and not simula:
        print("  lembrete: a mídia entra no bundle de todo render; desligue depois (kit.py ext-desliga %s)" % nome)
    return rel


def desliga(nome, midia=None, simula=False):
    arq, doc = _le(nome, midia)
    rel = {"extensao": nome, "midia": comum.barra(arq), "apagados": [], "ficaram": [], "pastas": [], "simula": simula}
    pk = os.path.abspath(comum.PUBLIC_KIT)
    pastas = set()
    for origem, destino in pares(doc):
        if not os.path.lexists(destino):
            continue
        if os.path.isfile(destino) and os.path.isfile(origem) and os.path.samefile(origem, destino):
            if simula:
                print("  apagaria o link %s" % destino)
            else:
                os.remove(destino)  # só o link (mesmo inode da origem); a origem fica
            rel["apagados"].append(destino)
            pastas.add(os.path.dirname(os.path.abspath(destino)))
        else:
            rel["ficaram"].append(destino)
            print("  AVISO: %s não é link da origem (outro inode): ficou" % destino)
    # pastas vazias, de baixo pra cima, sem passar das fixas
    for p in sorted(pastas, key=lambda x: -len(x)):
        atual = p
        while True:
            relp = comum.barra(os.path.relpath(atual, pk))
            if relp in FIXAS or relp == "." or relp.startswith(".."):
                break
            if os.path.isdir(atual) and not os.listdir(atual):
                if not simula:
                    os.rmdir(atual)
                rel["pastas"].append(comum.barra(atual))
                atual = os.path.dirname(atual)
            else:
                break
    print("ext-desliga %s: %d link(s) %s, %d ficaram, %d pasta(s) vazia(s) %s"
          % (nome, len(rel["apagados"]), "a apagar" if simula else "apagado(s)", len(rel["ficaram"]), len(rel["pastas"]),
             "a remover" if simula else "removida(s)"))
    return rel
