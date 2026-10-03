"""Teste do kit_modelos (frente MODELOS NO RENDER, 03/10): ligar e desligar os GLB da peça no public-kit, sem render.

Cria duas peças temporárias em KIT/pecas (uma de teste, _teste-modelos-<pid>, e uma em andamento,
2026-10-03-teste-modelos-<pid>), liga e desliga dois GLB pequenos da biblioteca (glb-papel-pilha-documento e
glb-sino-mesa) em RM/public-kit/3d/biblioteca/ e confere:
- liga: hardlink com o inode da origem; o fixo (glb-video-iphone) fica como está; o procedural não tem arquivo; ligar
  de novo não faz nada;
- destino com outro arquivo: recusa e não mexe;
- desliga: tira só os links da peça; fica o que a peça em andamento usa; a pasta 3d/biblioteca sai quando esvazia;
- com a trava de render ocupada, o desliga recusa (código 3);
- catalogo.entra_no_render: .blend, decisão pendente, liberado, aceito com risco (com e sem a peça da decisão).
No fim apaga as duas peças e confere que nada ficou no public-kit. Recusa rodar com render rodando ou com os dois GLB
já ligados por alguma peça (pra não mexer no trabalho de ninguém).

Uso: python -B testa_modelos.py        (código 0 passou, 1 falhou, 3 pulado)
"""
import sys

sys.dont_write_bytecode = True

import json  # noqa: E402
import os  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
import kit_modelos  # noqa: E402
import limpa  # noqa: E402
import trava  # noqa: E402
from comum import escrita  # noqa: E402
from kit_modelos import catalogo  # noqa: E402

GLB = ("glb-papel-pilha-documento", "glb-sino-mesa")
ESTRANHO = "glb-caneca"  # destino ocupado por outro arquivo (o teste grava um arquivo falso lá e apaga no fim)
falhas = []


def confere(nome, ok, visto=""):
    print("[%s] %s%s" % ("ok" if ok else "FALHA", nome, (": %s" % visto) if visto != "" else ""))
    if not ok:
        falhas.append(nome)


def destino(mid):
    return comum.barra(os.path.join(comum.PUBLIC_KIT, *catalogo.indice("modelos")[mid]["render"]["publicKit"].split("/")))


def cria_peca(nome, objetos):
    pasta = os.path.join(comum.PECAS, nome)
    cena = {"versao": 1, "peca": nome, "titulo": "teste do kit_modelos", "objetos": objetos}
    escrita.grava_json(os.path.join(pasta, "cenas.json"), cena, cria_pasta=True)
    return comum.Peca(nome)


def main():
    comum.utf8()
    e = trava.estado()
    if trava.ocupada(e) or [g for g in (e["renders"] or []) if not g["orfao"]]:
        print("PULADO: tem render rodando (o teste mexe no public-kit)")
        return 3
    for mid in GLB + (ESTRANHO,):
        if os.path.lexists(destino(mid)):
            print("PULADO: %s já está ligado no public-kit por alguma peça" % mid)
            return 3
    pid = os.getpid()
    teste = "_teste-modelos-%d" % pid
    andamento = "2026-10-03-teste-modelos-%d" % pid
    idx = catalogo.indice("modelos")
    try:
        p1 = cria_peca(teste, [{"id": "a", "modelo": GLB[0]}, {"id": "b", "modelo": GLB[1]},
                               {"id": "c", "modelo": "proc-folha-das"}, {"id": "d", "modelo": "glb-video-iphone"}])
        p2 = cria_peca(andamento, [{"id": "b", "modelo": GLB[1]}])
        saida = []
        r = kit_modelos.liga(p1, saida=saida.append)
        st = {mid: os.stat(destino(mid)) for mid in GLB if os.path.isfile(destino(mid))}
        confere("liga os 2 GLB da biblioteca", sorted(m for m, _r in r["ligados"]) == sorted(GLB), r["ligados"])
        confere("hardlink com o inode da origem", all(os.path.samefile(idx[m]["arquivo"], destino(m)) for m in GLB),
                {m: s.st_nlink for m, s in st.items()})
        confere("o fixo do guia fica como está (já no public-kit)", ("glb-video-iphone", "3d/iphone.glb") in r["jaLigados"],
                r["jaLigados"])
        confere("procedural sem arquivo (não aparece)", all(m != "proc-folha-das" for m, _x in r["ligados"] + r["jaLigados"]))
        r = kit_modelos.liga(p1, saida=saida.append)
        confere("ligar de novo não faz nada", not r["ligados"] and len(r["jaLigados"]) == 3, r)
        # destino com outro arquivo
        outro = cria_peca("_teste-modelos-outro-%d" % pid, [{"id": "x", "modelo": ESTRANHO}])
        d_caneca = destino(ESTRANHO)
        escrita.grava_bytes(d_caneca, b"nao e o glb", cria_pasta=True)
        try:
            kit_modelos.liga(outro, saida=saida.append)
            confere("destino com outro arquivo: recusa", False, "ligou por cima")
        except comum.ErroSaida as ex:
            confere("destino com outro arquivo: recusa", "não é o GLB" in str(ex), str(ex)[:120])
        confere("o arquivo estranho ficou intacto", open(d_caneca, "rb").read() == b"nao e o glb")
        os.remove(d_caneca)
        limpa.apaga_arvore(outro.pasta)
        # trava ocupada: o desliga recusa
        with trava.render(teste, "teste-modelos", espera_min=0.1, intervalo_s=0.1):
            try:
                kit_modelos.desliga(p1, saida=saida.append)
                confere("com a trava ocupada o desliga recusa", False, "desligou")
            except comum.ErroSaida as ex:
                confere("com a trava ocupada o desliga recusa", ex.codigo == 3, str(ex)[:120])
        confere("depois da recusa os links continuam", all(os.path.isfile(destino(m)) for m in GLB))
        # desliga da peça de teste: fica o que a peça em andamento usa
        r = kit_modelos.desliga(p1, saida=saida.append)
        confere("desliga tira o link só da peça", [m for m, _r in r["desligados"]] == [GLB[0]] and
                not os.path.lexists(destino(GLB[0])), r["desligados"])
        confere("fica o GLB que a peça em andamento usa", os.path.isfile(destino(GLB[1])) and
                any("usado também por %s" % andamento in mot for _r, mot in r["ficaram"]), r["ficaram"])
        lig = kit_modelos.ligados()
        confere("ligados() mostra o que ficou e quem usa", len(lig) == 1 and lig[0]["id"] == GLB[1] and
                andamento in lig[0]["pecas"] and lig[0]["mesmoArquivo"], json.dumps(lig, ensure_ascii=False)[:200])
        r = kit_modelos.desliga(p2, saida=saida.append)
        confere("desliga da peça em andamento tira o resto", [m for m, _r in r["desligados"]] == [GLB[1]])
        confere("a pasta 3d/biblioteca sai quando esvazia", not os.path.isdir(kit_modelos.PASTA))
        # entra_no_render
        casos = [("blend-simbolo-vinheta", None, "não"), ("glb-camera-fotografica", None, "não"),
                 ("glb-despertador", None, "sim"), ("glb-celular-iphone15-limpo", None, "com aviso"),
                 ("glb-celular-iphone15-limpo", "guia-pronta-2026-10-14", "sim"), ("proc-cena-guia", None, "não"),
                 ("proc-calendario-clay-img2threejs", None, "sim"), ("blend-iphone17-preparado", None, "não")]
        for mid, peca, esperado in casos:
            v, mot = catalogo.entra_no_render(idx[mid], peca)
            confere("entra_no_render(%s%s) = %s" % (mid, ", " + peca if peca else "", esperado), v == esperado, mot[:90])
    finally:
        for nome in (teste, andamento, "_teste-modelos-outro-%d" % pid):
            pasta = os.path.join(comum.PECAS, nome)
            if os.path.isdir(pasta):
                limpa.apaga_arvore(pasta)
        for mid in GLB + (ESTRANHO,):
            d = destino(mid)
            if os.path.lexists(d):  # não existia no começo (conferido): é deste teste
                os.remove(d)
        if os.path.isdir(kit_modelos.PASTA) and not os.listdir(kit_modelos.PASTA):
            os.rmdir(kit_modelos.PASTA)
    confere("nada ficou no public-kit (3d/biblioteca)", not os.path.isdir(kit_modelos.PASTA))
    print("\nresultado: %s (%d falha(s))" % ("PASSOU" if not falhas else "FALHOU", len(falhas)))
    return 0 if not falhas else 1


if __name__ == "__main__":
    sys.exit(main())
