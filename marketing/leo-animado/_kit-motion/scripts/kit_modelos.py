"""Modelos 3D da peça no public-kit: kit.py modelos (frente MODELOS NO RENDER, 03/10). Contrato: KIT/DESENHO.md,
seções 1 (item 7), 4.9 e 7.1; regra de entrada: catalogo.entra_no_render (a mesma do montaProps).

Os GLB do catálogo entram no render pelo render.publicKit. O celular e o relógio do guia ficam fixos no public-kit
(3d/iphone.glb e 3d/watch.glb, hardlinks do public-guia). Os outros ficam na biblioteca (EXT/modelos-3d e
EXT/kit-2026-10/modelos-3d) e entram por hardlink em RM/public-kit/3d/biblioteca/<id>.glb só quando uma peça usa:
- liga(peca): liga os GLB dos objetos da cena (escrita.liga: hardlink, mesmo tamanho, st_nlink 2 ou mais); o
  kit.py props, stills, prévia, capa, render e final chamam sozinhos (stills e render dentro da trava de render);
- desliga(peca): tira os links desta peça da pasta 3d/biblioteca/ (só arquivo com o inode da origem do catálogo);
  fica o que outra peça em andamento (KIT/pecas/*/cenas*.json, fora o _modelo, as de teste e as já entregues) ainda
  usa; recusa com render rodando, porque o bundle copia o public-kit no começo (kit.py limpa <peça> --entregue
  também desliga);
- ligados(): os links da pasta 3d/biblioteca/ (pro doutor), com o id do catálogo e as peças que usam.
Nada é copiado: o bundle do Remotion copia o public-kit inteiro pro Temp a cada render, por isso a biblioteca
inteira nunca entra, só os GLB da peça, e saem depois.

Importável: modelos_da_cena(cena), pares(ids), liga(peca, simula=False), desliga(peca, simula=False), ligados()
"""
import sys

sys.dont_write_bytecode = True

import glob  # noqa: E402
import json  # noqa: E402
import os  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
from comum import escrita  # noqa: E402

if os.path.join(comum.KIT, "catalogos") not in sys.path:
    sys.path.insert(0, os.path.join(comum.KIT, "catalogos"))
import catalogo  # noqa: E402

PASTA = comum.barra(os.path.join(comum.PUBLIC_KIT, *catalogo.PUBLIC_BIBLIOTECA.split("/")))


def _sem_comentario(x):
    if isinstance(x, dict):
        return {k: _sem_comentario(v) for k, v in x.items() if not str(k).startswith("_")}
    if isinstance(x, list):
        return [_sem_comentario(v) for v in x]
    return x


def modelos_da_cena(cena):
    """Os ids de modelo dos objetos da cena, na ordem (sem repetir; _objetosOpcionais e comentários ficam fora)."""
    out = []
    for o in (_sem_comentario(cena or {}).get("objetos") or []):
        mid = o.get("modelo") if isinstance(o, dict) else None
        if isinstance(mid, str) and mid and mid not in out:
            out.append(mid)
    return out


def _destino(rel):
    return comum.barra(os.path.join(comum.PUBLIC_KIT, *rel.split("/")))


def pares(ids, idx=None):
    """[(id, origem, destino, rel, entra, motivo)] dos GLB da lista que têm render.publicKit; procedural e objeto de
    extensão ficam fora (não têm arquivo); o resto volta com destino None e o motivo."""
    idx = idx if idx is not None else catalogo.indice("modelos")
    out = []
    for mid in ids:
        it = idx.get(mid)
        if it is None:
            out.append((mid, None, None, None, "não", "o modelo não está no catálogo"))
            continue
        entra, motivo = catalogo.entra_no_render(it)
        r = it.get("render") if isinstance(it.get("render"), dict) else {}
        if it.get("tipo") != "glb":
            continue
        rel = r.get("publicKit")
        if entra == "não" or not rel:
            out.append((mid, it.get("arquivo"), None, rel, entra, motivo))
            continue
        out.append((mid, comum.barra(it["arquivo"]), _destino(rel), rel, entra, motivo))
    return out


def _entregue(pasta):
    """A peça já foi entregue: um mp4 de saida/ (fora o mudo) com hardlink fora da peça."""
    for f in glob.glob(os.path.join(pasta, "saida", "*.mp4")):
        if not f.endswith("-mudo.mp4") and os.stat(f).st_nlink >= 2:
            return True
    return False


def _cenas_das_pecas(exceto=None, so_em_andamento=False):
    """{peça: [ids de modelo]} das cenas de KIT/pecas (todas as cenas*.json de cada peça; fora o _modelo). Com
    so_em_andamento, só as peças que ainda não foram entregues e não são de teste (nome com '_'): são as que seguram
    um link compartilhado no desliga (as outras religam sozinhas no props, nos stills e no render)."""
    out = {}
    for c in sorted(glob.glob(os.path.join(comum.PECAS, "*", "cenas*.json"))):
        peca = os.path.basename(os.path.dirname(c))
        if peca == "_modelo" or peca == exceto:
            continue
        if so_em_andamento and (peca.startswith("_") or _entregue(os.path.dirname(c))):
            continue
        try:
            ids = modelos_da_cena(comum.le_json(c))
        except (OSError, ValueError):
            continue
        out.setdefault(peca, [])
        for i in ids:
            if i not in out[peca]:
                out[peca].append(i)
    return out


def liga(peca, simula=False, saida=print):
    """Liga os GLB da cena da peça no public-kit. Devolve {ligados, jaLigados, fora}; levanta ErroSaida se um destino
    existe com outro arquivo (nada é trocado)."""
    ids = modelos_da_cena(peca.le_cena())
    rel = {"peca": peca.nome, "cena": peca.cena, "ligados": [], "jaLigados": [], "fora": []}
    for mid, origem, destino, relp, entra, motivo in pares(ids):
        if destino is None:
            rel["fora"].append((mid, motivo))
            continue
        if not origem or not os.path.isfile(origem):
            raise comum.ErroSaida("o GLB de %s não existe: %s" % (mid, origem))
        if escrita.protegido(destino):
            raise comum.ErroSaida("destino protegido: %s" % destino, 2)
        if os.path.lexists(destino):
            if os.path.isfile(destino) and os.path.samefile(origem, destino):
                rel["jaLigados"].append((mid, relp))
                continue
            raise comum.ErroSaida("%s já existe e não é o GLB de %s (%s): não mexi; confira o render.publicKit no "
                                  "catálogo" % (destino, mid, origem))
        if relp in catalogo.PUBLIC_FIXOS:
            raise comum.ErroSaida("%s é fixo do public-kit e sumiu: o doutor mostra; não religo por aqui" % destino)
        if simula:
            rel["ligados"].append((mid, relp))
            continue
        escrita.liga(origem, destino, cria_pasta=True)
        rel["ligados"].append((mid, relp))
    if rel["ligados"] or rel["jaLigados"] or rel["fora"]:
        partes = []
        if rel["ligados"]:
            partes.append("%d %s (%s)" % (len(rel["ligados"]), "a ligar" if simula else "ligado(s)",
                                           ", ".join(m for m, _r in rel["ligados"])))
        if rel["jaLigados"]:
            partes.append("%d já no public-kit" % len(rel["jaLigados"]))
        for mid, motivo in rel["fora"]:
            partes.append("%s fora (%s)" % (mid, motivo))
        saida("modelos 3D de %s: %s" % (peca.nome, "; ".join(partes)))
    return rel


def desliga(peca, simula=False, saida=print, ignora_trava=False):
    """Tira de RM/public-kit/3d/biblioteca/ os links dos GLB da peça (todas as cenas dela) que nenhuma outra peça usa.
    Só apaga arquivo com o inode da origem do catálogo; os fixos nunca. Com render rodando, recusa (código 3)."""
    import trava
    if not ignora_trava and not simula:
        e = trava.estado()
        rodando = [g for g in (e["renders"] or []) if not g["orfao"]]
        if trava.ocupada(e) or rodando:
            quem = trava.descreve_info(e["trava"] or e["info"]) if trava.ocupada(e) else "; ".join(
                trava.descreve_render(g) for g in rodando)
            raise comum.ErroSaida("não desliguei os modelos de %s: tem render rodando (%s); o bundle copia o public-kit "
                                  "no começo e tirar um GLB no meio derruba o render. Rode de novo depois" % (peca.nome, quem),
                                  3)
    ids = []
    for c in sorted(glob.glob(os.path.join(peca.pasta, "cenas*.json"))):
        try:
            for i in modelos_da_cena(comum.le_json(c)):
                if i not in ids:
                    ids.append(i)
        except (OSError, ValueError):
            continue
    outras = _cenas_das_pecas(exceto=peca.nome, so_em_andamento=True)
    res = {"peca": peca.nome, "desligados": [], "ficaram": []}
    for mid, origem, destino, relp, _entra, _motivo in pares(ids):
        if destino is None or relp in catalogo.PUBLIC_FIXOS:
            continue
        if not os.path.lexists(destino):
            continue
        usam = [p for p, lista in outras.items() if mid in lista]
        if usam:
            res["ficaram"].append((relp, "usado também por %s" % ", ".join(usam)))
            continue
        if not (os.path.isfile(destino) and origem and os.path.isfile(origem) and os.path.samefile(origem, destino)):
            res["ficaram"].append((relp, "não é o GLB do catálogo (outro inode): não mexi"))
            continue
        if not simula:
            os.remove(destino)
        res["desligados"].append((mid, relp))
    if not simula and os.path.isdir(PASTA) and not os.listdir(PASTA):
        try:
            os.rmdir(PASTA)
        except OSError:
            pass
    for mid, relp in res["desligados"]:
        saida("  %s %s (%s)" % ("desligaria" if simula else "desligado", relp, mid))
    for relp, motivo in res["ficaram"]:
        saida("  ficou %s (%s)" % (relp, motivo))
    return res


def ligados():
    """[{rel, mb, id, nlink, pecas}] dos arquivos de RM/public-kit/3d/biblioteca/ (id None: não é de catálogo)."""
    out = []
    if not os.path.isdir(PASTA):
        return out
    idx = catalogo.indice("modelos")
    por_rel = {}
    for it in idx.values():
        r = it.get("render") if isinstance(it.get("render"), dict) else {}
        if r.get("publicKit"):
            por_rel[r["publicKit"]] = it
    usos = _cenas_das_pecas()
    for n in sorted(os.listdir(PASTA)):
        p = os.path.join(PASTA, n)
        if not os.path.isfile(p):
            continue
        relp = catalogo.PUBLIC_BIBLIOTECA + "/" + n
        it = por_rel.get(relp)
        st = os.stat(p)
        mesmo = bool(it and os.path.isfile(it.get("arquivo") or "") and os.path.samefile(it["arquivo"], p))
        out.append({"rel": relp, "mb": st.st_size / 1048576.0, "id": it["id"] if it else None, "nlink": st.st_nlink,
                    "mesmoArquivo": mesmo, "pecas": [pc for pc, lista in usos.items() if it and it["id"] in lista]})
    return out


TIPOS_NUCLEO = ("aparelho", "relogio", "folha", "pilula", "comprovante", "glb")


def lista(peca, saida=print):
    """Os modelos da cena da peça: status, se entra no render, o caminho no public-kit e se já está ligado. Objeto com
    tipo de extensão na cena (ex.: o palco da peça de 05/10) só usa o item do catálogo pra licença e crédito."""
    cena = _sem_comentario(peca.le_cena())
    ids = modelos_da_cena(cena)
    tipo_cena = {}
    for o in cena.get("objetos") or []:
        if isinstance(o, dict) and o.get("tipo") and o.get("modelo") and o["tipo"] not in TIPOS_NUCLEO:
            tipo_cena.setdefault(o["modelo"], o["tipo"])
    idx = catalogo.indice("modelos")
    saida("modelos da cena %s (%d):" % (peca.cena, len(ids)))
    for mid in ids:
        it = idx.get(mid)
        if it is None:
            saida("  %-36s NÃO ESTÁ NO CATÁLOGO" % mid)
            continue
        if mid in tipo_cena:
            saida("  %-36s %-16s objeto de extensão (tipo %s na cena): desenhado pela extensão; o item do catálogo dá "
                  "só a licença e o crédito" % (mid, it.get("status"), tipo_cena[mid]))
            continue
        entra, motivo = catalogo.entra_no_render(it, peca.nome)
        r = it.get("render") if isinstance(it.get("render"), dict) else {}
        relp = r.get("publicKit")
        estado = ""
        if relp:
            d = _destino(relp)
            estado = " | %s %s" % (relp, "ligado" if os.path.isfile(d) else "a ligar")
        saida("  %-36s %-16s entra: %-9s %s%s" % (mid, it.get("status"), entra, motivo, estado))
    return ids


if __name__ == "__main__":
    comum.utf8()
    print(json.dumps(ligados(), ensure_ascii=False, indent=1))
