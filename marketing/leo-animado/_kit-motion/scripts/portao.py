"""Portões de saída do kit de motion do Legalizaí (rodada 4, 03/10/2026).

O render (kit.py render e o render do kit.py final), a junção (kit.py juncao e o juncao.py direto) e a entrega
(kit.py entregar e o entregar.py direto) exigem a trava de fatos ok: o qc/fatos<sufixo>.json sem erro, gravado com as
regras de hoje e com as props, o roteiro e a base (FATOS e PROIBIDO) de agora. A entrega exige também o relatório do
confere ok (saida/relatorio<sufixo>.json) do mesmo mp4 que vai ser entregue (o md5 do arquivo) e das mesmas props.

Sem opção de ignorar. A única exceção é a peça de teste (o nome da PASTA começa com '_'): passa com aviso, porque o
entregar só leva peça de teste pra uma raiz falsa.

Importável:
    problemas_fatos(peca) -> [frase]           o que falta na trava de fatos ([] quando está ok)
    problemas_relatorio(peca, mp4) -> [frase]  o que falta no relatório do confere pra esse mp4
    exige(peca, etapa, problemas)              levanta comum.ErroSaida (código 2) ou, em peça de teste, só avisa
"""
import sys

sys.dont_write_bytecode = True

import os  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
from comum import escrita  # noqa: E402


def problemas_fatos(peca):
    """[] quando a trava de fatos está ok pras props de hoje; senão, a lista do que falta."""
    import fatos  # aqui dentro: o fatos.py importa o comum e o catálogo
    return fatos.problemas_trava(peca)


def problemas_relatorio(peca, mp4):
    """[] quando o relatório do confere da peça está ok e é deste mp4 e das props de hoje; senão, o que falta."""
    caminho = peca.saida("relatorio", ".json", "saida")
    cmd = "kit.py confere %s%s%s" % (peca.nome, (" --cena " + peca.nome_cena) if peca.sufixo else "",
                                     (' --video "%s"' % mp4) if os.path.abspath(mp4) != os.path.abspath(peca.final())
                                     else "")
    if not os.path.isfile(caminho):
        return ["falta o relatório do confere (%s): rode %s" % (comum.barra(os.path.relpath(caminho, peca.pasta)), cmd)]
    try:
        doc = comum.le_json(caminho)
    except ValueError as e:
        return ["%s ilegível (%s): rode %s" % (caminho, e, cmd)]
    probs = []
    if doc.get("ok") is not True:
        falhas = [i.get("nome") for i in doc.get("itens") or [] if not i.get("ok")]
        probs.append("o relatório do confere não passou (%s): conserte e rode %s" % (", ".join(falhas) or "ok falso",
                                                                                      cmd))
    if not doc.get("md5Video"):
        probs.append("o relatório é de antes da rodada 4 (sem o md5 do vídeo): rode %s" % cmd)
    elif not os.path.isfile(mp4):
        probs.append("o mp4 a entregar não existe: %s" % mp4)
    elif doc["md5Video"] != escrita.md5(mp4):
        probs.append("o relatório é de outro vídeo (md5 %s; o que vai ser entregue, %s, tem %s): rode %s"
                     % (doc["md5Video"], os.path.basename(mp4), escrita.md5(mp4), cmd))
    if os.path.isfile(peca.props) and doc.get("propsMd5") != escrita.md5(peca.props):
        probs.append("as props mudaram depois do confere: rode %s" % cmd)
    return probs


def exige(peca, etapa, problemas, saida=print):
    """Com problema, recusa a etapa (comum.ErroSaida, código 2), sem opção de ignorar. Peça de teste (pasta com '_')
    passa com aviso. Devolve a lista de problemas (vazia quando passou limpo)."""
    if not problemas:
        return []
    if peca.teste:
        for p in problemas:
            saida("AVISO (peça de teste %s, %s segue): %s" % (peca.nome, etapa, p))
        return problemas
    raise comum.ErroSaida("%s recusado(a): %s. Não há opção de ignorar: só peça de teste (pasta com '_' no nome) passa"
                          % (etapa, "; ".join(problemas)), 2)
