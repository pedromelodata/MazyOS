"""Testes das travas de regra do kit (frente TRAVAS DE REGRA, 03/10/2026), sem render e sem gravar no kit.

Prova, em processo (o que precisa de arquivo vai pra uma pasta temporária que o teste apaga no fim):
- trava de fatos (scripts/fatos.py): as frases literais do BASE/PROIBIDO.md e as variações (P01, P03, P09, P11, P14,
  P25, P27, P31, P32, P33, P38), datas e prazos contra o FATOS, pagamento como status, gov br, os outros traços longos,
  exemplo sem origem, e a trava do F063 (folha DAS e comprovante com o valor padrão do pintor, tela que não serve MEI)
  e a tela de captura reprovada; o guia continua passando com 0 erro;
- regra da trilha (catalogo.confere_trilha, a mesma do montaProps), no mixa.py (trilha_da_peca) e no confere.py
  (confere_licencas): só liberada, ou aceito-com-risco com a decisaoRisco do catálogo que vale pra peça;
- telas por receita (telas/monta.py): captura reprovada recusada, peça de MEI só com captura que serve MEI, aviso de
  corte com regra que fica visível (e nenhum quando o preparo apaga o corte);
- validador (catalogos/valida.py) numa cópia do catálogo: decisaoRisco em texto livre, crédito com marca e licença
  da Epidemic fora do reprovado dão erro.

Rodada 4 (03/10/2026), um bloco por item do pedido:
- item 1, junção: o mixa.py grava quadros x 1600 amostras (27,52 s, 18,03 s e 22,19 s, que antes davam menos) e a
  junção completa ou corta o mix que difere em até um quadro e recusa o resto (a prova com vídeo de verdade é o
  testa_saida.py --so juncao_fracao);
- item 2, travas pela pasta: a cena do guia copiada pra outra pasta e a pasta de teste renomeada são recusadas no
  comum.Peca, no props.mjs e no fatos.py; o mixa.py e o confere.py decidem a trilha pela pasta;
- item 3, F063 por padrão: público vazio e "todos" conferidos como MEI, o contador em qualquer formato lido em R$, o
  cartão do imposto do palco de argila e a tela do guia como imagem 2D;
- item 4, trava de fatos: as formas diretas do P38 e do P01, datas com ponto e hífen e pagamento como status, com a
  negação que só rebaixa na mesma oração (e o e-CAC, sem pulo);
- item 5, portões: render, junção e entrega recusam sem a trava de fatos ok, e a entrega, sem o relatório do confere
  ok do mesmo mp4; peça de teste passa com aviso;
- item 6, tela sem origem no catálogo: erro em peça de ME (fatos.py, confere.py e monta.py);
- item 7, baixos: marca colada a número ou hífen, licença CC Attribution, NC e Epidemic pela fonte, e decisão de agente
  ou com '*' que não vale pra peça nova.

Uso (sempre com python -B): python -B testa_regras.py [--mantem]
Código de saída: 0 passou; 1 falhou.
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import contextlib  # noqa: E402
import copy  # noqa: E402
import io  # noqa: E402
import json  # noqa: E402
import os  # noqa: E402
import shutil  # noqa: E402
import subprocess  # noqa: E402
import tempfile  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
from comum import escrita  # noqa: E402

for _p in (comum.KIT + "/catalogos", comum.KIT + "/telas", comum.KIT + "/audio"):
    if _p not in sys.path:
        sys.path.insert(0, _p)
import catalogo  # noqa: E402
import fatos  # noqa: E402

RESULTADOS = []


def registra(nome, ok, detalhe=""):
    RESULTADOS.append((nome, bool(ok)))
    print("[%s] %s%s" % ("ok" if ok else "FALHA", nome, ("  (" + detalhe + ")") if detalhe else ""), flush=True)


# ---------- trava de fatos ----------
BASE = None


def avalia(textos, publico="ME", exemplos=None, objetos=None, telas=None, tipo="visivel"):
    """Roda o fatos.confere num conjunto mínimo: cada texto vira um trecho do tipo dado."""
    props = {"fatos": {"publico": publico, "exemplos": exemplos or []}, "objetos": objetos or []}
    trechos = [fatos.Trecho(t, "teste %d" % i, tipo) for i, t in enumerate(textos)]
    trechos += fatos.trechos_props(props)
    return fatos.confere(trechos, props, BASE, telas)


def testa_fatos():
    global BASE
    BASE = fatos.Base()
    registra("fatos: o FATOS indexa datas (31/05, 30/11, 20/12, 31/12/2026)",
             all(k in BASE.idx_data for k in ("31/05", "30/11", "20/12", "31/12/2026")),
             "%d chaves de data" % len(BASE.idx_data))
    # frases que têm de dar erro (regra 4, 3, 2 ou 1), em texto visível e na narração
    erro = [
        ("quem abre é você", 4), ("canal oficial, fecha a aba", 4), ("Entre no portal do Simples e emita", 4),
        ("faça você mesma", 4), ("dá pra fazer sozinho", 4), ("abrir sozinho no gov br", 4), ("acesse o e-CAC", 4),
        ("6% fixo", 2), ("CNPJ em 24h", 3), ("sai em minutos", 3), ("CNPJ pronto rápido", 3),
        ("até 15/06", 3), ("31/12/2027", 3), ("Contabilizei cobra mais", 4), ("baixe agora", 4),
        ("zero multa garantido", 4), ("link abaixo", 4), ("ao vivo com você", 4), ("só hoje", 4),
        ("imposto novo da reforma", 4), ("isso está no F062", 4), ("nossa base: FATOS.md", 4),
        ("Vence " + chr(0x2015) + " dia 20", 4), ("Vence " + chr(0x2012) + " dia 20", 4),
        ("Vence " + chr(0x2212) + " dia 20", 4), ("já disponível na App Store", 4), ("últimas vagas de fundador", 4),
        ("Nubank", 4),
        # rodada 4 (item 4): as formas diretas do P38 e as variações (antes passavam com 0 erro)
        ("Acesse o portal do Simples Nacional e emita sua guia", 4), ("Acesse o e-CAC e baixe a guia", 4),
        ("Abra o PGMEI e gere o boleto", 4), ("No portal, clique em Emitir Guia", 4),
        ("Acesse o site da Receita Federal", 4), ("Pelo aplicativo MEI do governo você emite a guia", 4),
        ("Eu abri meu MEI sozinha", 4), ("Gere sua guia sozinho", 4), ("Quem abre o CNPJ é você", 4),
        ("É você quem abre", 4), ("Abrir MEI é de graça", 4), ("vá até o portal do empreendedor", 4),
        # a negação de outra oração (vírgula, dois-pontos) ou com outras palavras no meio não rebaixa a forma direta
        ("Sem complicação, entre no portal do Simples", 4), ("Sem custo: abra seu MEI sozinho", 4),
        ("Não espere: entre no portal", 4), ("Sem complicação nenhuma acesse o e-CAC", 4),
        # P01: prazo prometido, inclusive por extenso
        ("CNPJ em 1 dia", 3), ("CNPJ no mesmo dia", 3), ("sai em uma hora", 3), ("pronto em 5 minutinhos", 3),
        ("abre em 1 semana", 3), ("em um dia útil", 3),
        # datas com ponto, com hífen e sem o "de"
        ("até 15.06", 3), ("vence 15-06-2027", 3), ("até 15 junho", 3),
        # pagamento como status (rótulo, OK, liquidada) e a gente pagando a guia (P21)
        ("Status: paga", 4), ("Pagamento OK", 4), ("Liquidada", 4), ("Eu já paguei sua guia", 4),
    ]
    for texto, regra in erro:
        r = avalia([texto])
        ok = any(e["regra"] == regra for e in r.erros)
        registra("fatos: erro em %r (regra %d)" % (texto, regra), ok, "; ".join(e["mensagem"][:90] for e in r.erros))
    # a narração também pega (não é só texto de tela)
    for texto in ("Acesse o e-CAC e baixe a guia", "Eu abri meu MEI sozinha", "CNPJ em 1 dia", "Eu já paguei sua guia"):
        r = avalia([texto], tipo="narracao")
        registra("fatos: erro em %r também na narração" % texto, bool(r.erros), "; ".join(e["mensagem"][:80] for e in r.erros))
    # a negação que governa o verbo na mesma oração rebaixa pra aviso
    for texto in ("você não precisa entrar no portal", "nunca mais abra o e-CAC", "sem entrar no site do governo"):
        r = avalia([texto])
        registra("fatos: %r é aviso (negação na mesma oração)" % texto, not r.erros and any(a["regra"] == 5 for a in r.avisos),
                 "; ".join(e["mensagem"][:80] for e in r.erros))
    # texto na tela com pagamento como status: erro; na narração: aviso
    for texto in ("Guia paga", "pagamento confirmado", "Paga", "DAS pago"):
        rv = avalia([texto])
        rn = avalia([texto], tipo="narracao")
        registra("fatos: %r é erro na tela e aviso na narração" % texto,
                 any(e["regra"] == 4 for e in rv.erros) and not rn.erros and any(a["regra"] == 5 for a in rn.avisos))
    # o que tem de passar
    passa = ["até 31/05", "31 de maio", "Vence dia 20.", "você só confirma na sua conta gov.br", "Você paga a guia",
             "sem entrar no site do governo", "a gente cuida da papelada", "não precisa fazer nada sozinho",
             "Licença CC BY 4.0", "nota 4.9", "Você só paga.", "O sistema calcula, emite a guia e te avisa."]
    for texto in passa:
        r = avalia([texto])
        registra("fatos: %r passa sem erro" % texto, not r.erros, "; ".join(e["mensagem"][:90] for e in r.erros))
    r = avalia(["Agilize sua rotina"])
    registra("fatos: 'agilize' (verbo e concorrente) vira aviso", not r.erros and any("agilize" in a["mensagem"] for a in r.avisos))
    # exemplo sem origem: erro, e o valor não vale
    r = avalia(["O plano sai por R$ 59 por mês"], exemplos=[{"texto": "R$ 59"}])
    registra("fatos: exemplo sem origem dá erro e o R$ 59 não passa",
             any("sem origem" in e["mensagem"] for e in r.erros) and any("R$ 59 não está no FATOS" in e["mensagem"] for e in r.erros))
    r = avalia(["O plano sai por R$ 59 por mês"], exemplos=[{"texto": "R$ 59", "origem": "teste"}])
    registra("fatos: o mesmo exemplo com origem passa (aviso de exemplo)", not r.erros)
    r = avalia(["contrato de 12/03/2026"], exemplos=[{"texto": "12/03/2026", "origem": "tela Documentos do app"}])
    registra("fatos: data fictícia declarada em fatos.exemplos passa", not r.erros)
    # F063: folha DAS e comprovante com o valor padrão do pintor, em peça de MEI
    folha = {"id": "guia", "modelo": "proc-folha-das", "tipo": "folha"}
    comp = {"id": "comp", "modelo": "proc-comprovante", "tipo": "comprovante"}
    ex = [{"texto": "R$ 178,31", "origem": "empresa de exemplo do app"}]
    r = avalia([], publico="MEI", exemplos=ex, objetos=[folha])
    registra("fatos: folha DAS sem conteudo em peça de MEI dá erro 6 (valor padrão do pintor)",
             any(e["regra"] == 6 and "folha DAS guia" in e["onde"] for e in r.erros))
    r = avalia([], publico="MEI", exemplos=ex, objetos=[comp])
    registra("fatos: comprovante sem conteudo em peça de MEI dá erro 6", any(e["regra"] == 6 for e in r.erros))
    f2 = dict(folha, conteudo={"mostraValor": False})
    c2 = dict(comp, conteudo={"mostraValor": False})
    r = avalia([], publico="MEI", exemplos=ex, objetos=[f2, c2])
    registra("fatos: folha e comprovante com mostraValor false passam em peça de MEI", not r.erros,
             "; ".join(e["mensagem"][:90] for e in r.erros))
    r = avalia([], publico="ME", exemplos=ex, objetos=[folha])
    registra("fatos: a mesma folha em peça de ME passa (datas fictícias do pintor ficam de fora)", not r.erros,
             "; ".join(e["mensagem"][:90] for e in r.erros))
    # telas: origem pelo catálogo
    idx = catalogo.indice("telas")
    telas_mei = [("tela inicio", idx["montada-tela-inicio"], "nome do arquivo"),
                 ("tela splash", idx["montada-tela-splash"], "nome")]
    r = avalia([], publico="MEI", telas=telas_mei)
    registra("fatos: tela do guia com valor em peça de MEI dá erro 6 (só ela)",
             [e["onde"] for e in r.erros if e["regra"] == 6] == ["tela inicio"])
    r = avalia([], publico="ME", telas=[("tela x", idx["tela0210-migrar_plano"], "receita")])
    registra("fatos: tela de captura reprovada dá erro 7", any(e["regra"] == 7 for e in r.erros))
    # ---------- item 6: tela sem origem no catálogo dá erro em qualquer peça ----------
    r = avalia([], publico="ME", telas=[("tela plano", None, "sem receita e sem item com esse nome de arquivo")])
    registra("item 6: tela sem origem no catálogo em peça de ME dá erro 7", any(e["regra"] == 7 and "sem origem" in
                                                                                  e["mensagem"] for e in r.erros))
    props_tela = {"telas": {"plano": {"arquivo": "pecas/2026-10-23-tela-aud/telas/plano-copiado.png"}},
                  "camadas": [{"id": "pasta", "tipo": "imagem", "src": "telas/tela-inicio.png"},
                              {"id": "logo", "tipo": "imagem", "src": "marca/simbolo.svg"}]}
    t = fatos.telas_da_peca(props_tela)
    registra("item 6: telas_da_peca acha a tela sem origem e a imagem 2D de tela (e deixa o logo de fora)",
             [o for o, it, _v in t] == ["tela plano", "camada pasta (src telas/tela-inicio.png, imagem 2D de tela)"]
             and t[0][1] is None and t[1][1]["id"] == "montada-tela-inicio", str([(o, (it or {}).get("id")) for o, it, _v in t]))
    # ---------- item 3: F063 por padrão ----------
    folha = {"id": "guia", "modelo": "proc-folha-das", "tipo": "folha"}
    for pub in ("", None, "todos", "ambos"):
        r = avalia([], publico=pub, exemplos=ex, objetos=[folha])
        registra("item 3: público %r é conferido como MEI (folha DAS com valor dá erro 6)" % (pub,),
                 any(e["regra"] == 6 and "folha DAS guia" in e["onde"] for e in r.erros))
    r = avalia([], publico="", exemplos=ex)
    registra("item 3: público vazio é erro (declare ME, MEI ou todos)", any(e["regra"] == 6 and "fatos.publico vazio" in
                                                                            e["mensagem"] for e in r.erros))
    props_cont = {"fatos": {"publico": "MEI", "exemplos": [{"texto": "R$ 75,90", "origem": "teste"}]},
                  "telas": {"inicio": {"arquivo": "telas/tela-splash.png", "extras": [
                      {"tipo": "contador", "regiao": "valor", "valor": 75.9, "formato": "decimal"}]}}}
    tr = fatos.trechos_props(props_cont)
    r = fatos.confere(tr, props_cont, BASE, [])
    registra("item 3: contador com formato diferente de brl é lido em R$ e dá erro 6 em peça de MEI",
             any(t_.texto == "R$ 75,90" for t_ in tr) and any(e["regra"] == 6 and "contador" in e["onde"] for e in r.erros))
    palco = {"id": "palco", "modelo": "proc-palco-argila", "tipo": "palco-argila", "conteudo": {"pecas": {
        "imposto": {"tipo": "cartao-imposto", "lado": "quente", "opcoes": {"tela": "inicio", "valor": 75.9}}}}}
    r = avalia([], publico="MEI", exemplos=[{"texto": "R$ 75,90", "origem": "teste"}], objetos=[palco])
    registra("item 3: cartão do imposto do palco de argila em peça de MEI dá erro 6",
             any(e["regra"] == 6 and "cartão do imposto imposto" in e["onde"] for e in r.erros))
    props_2d = {"fatos": {"publico": "MEI", "exemplos": []},
                "camadas": [{"id": "pasta", "tipo": "imagem", "src": "telas/tela-inicio.png", "x": 800}]}
    r = fatos.confere(fatos.trechos_props(props_2d), props_2d, BASE, fatos.telas_da_peca(props_2d))
    registra("item 3: tela do guia como imagem 2D em peça de MEI dá erro 6",
             any(e["regra"] == 6 and e["onde"].startswith("camada pasta") for e in r.erros))
    import confere
    with contextlib.redirect_stdout(io.StringIO()):
        rl = confere.confere_licencas(confere.Conf(), {"peca": "2026-10-20-mei", "fatos": {"publico": "todos"},
                                                       "objetos": [palco], "telas": props_cont["telas"],
                                                       "camadas": props_2d["camadas"]}, "2026-10-20-mei")
    txt = " | ".join(rl["erros"])
    registra("item 3: o confere repete o F063 com público 'todos' (cartão do imposto, contador e imagem 2D)",
             "cartão do imposto" in txt and "contador" in txt and "camada pasta" in txt, txt[:300])
    # o guia de verdade continua passando
    p = comum.Peca("guia-pronta-2026-10-14", None)
    props = p.le_props()
    tr = fatos.trechos_roteiro(fatos.acha_roteiro(p)) + fatos.trechos_props(props)
    r = fatos.confere(tr, props, BASE, fatos.telas_da_peca(props))
    registra("fatos: o guia passa com 0 erro", not r.erros, "%d aviso(s)" % len(r.avisos))


# ---------- trilha ----------
def testa_trilha():
    tr = catalogo.indice("trilhas")
    talent = tr["mixkit-01-talent-in-the-air"]
    e, a = catalogo.confere_trilha(talent, "guia-pronta-2026-10-14")
    registra("trilha: Talent na peça de 14/10 passa com aviso da decisão", not e and len(a) == 1)
    e, a = catalogo.confere_trilha(talent, "2026-10-20-nova")
    registra("trilha: Talent em peça nova dá erro", bool(e) and "não vale pra peça 2026-10-20-nova" in e[0])
    e, a = catalogo.confere_trilha(talent, "_teste-x")
    registra("trilha: Talent em peça de teste passa com aviso", not e and "peça de teste" in a[0])
    e, a = catalogo.confere_trilha(tr["mixkit-04-house-one"], "2026-10-20-nova")
    registra("trilha: House One (liberada) passa sem aviso", not e and not a)
    e, a = catalogo.confere_trilha(tr["pixabay-03-summer-fashion"], "2026-10-20-nova")
    registra("trilha: sem verificação dá erro", bool(e) and "sem-verificacao" in e[0])
    e, a = catalogo.confere_trilha(tr["previa-mixkit-04-house-one"], "2026-10-20-nova")
    registra("trilha: prévia de audição dá erro", bool(e) and "prévia de audição" in e[0])
    e, a = catalogo.confere_trilha(tr["epidemic-palmy-sway"], "guia-pronta-2026-10-14")
    registra("trilha: Epidemic dá erro", bool(e) and "Epidemic" in e[0])
    velho = dict(talent, decisaoRisco="Pedro, 02/10/2026: só nesta peça")
    e, a = catalogo.confere_trilha(velho, "guia-pronta-2026-10-14")
    registra("trilha: decisaoRisco em texto livre dá erro", bool(e) and "texto livre" in e[0])
    pend = dict(talent, decisaoRisco={"quem": "Pedro", "quando": None, "pecas": [], "pendente": True,
                                      "pergunta": "usar?", "texto": "pendente"})
    e, a = catalogo.confere_trilha(pend, "guia-pronta-2026-10-14")
    registra("trilha: decisão pendente dá erro", bool(e) and "pendente" in e[0])
    # mixa.py: a mesma regra
    import mixa
    av = []
    try:
        mixa.trilha_da_peca({"peca": "2026-10-20-nova", "trilha": {"id": talent["id"], "mStart": 5.448,
                                                                     "decisaoRisco": "texto qualquer"}}, tr, av)
        registra("mixa: Talent em peça nova é recusada mesmo com texto em decisaoRisco", False)
    except mixa.ErroMix as e:
        registra("mixa: Talent em peça nova é recusada mesmo com texto em decisaoRisco", "não vale pra peça" in str(e))
    av = []
    it, t = mixa.trilha_da_peca({"peca": "guia-pronta-2026-10-14", "trilha": {"id": talent["id"], "mStart": 5.448}},
                                tr, av)
    registra("mixa: Talent na peça de 14/10 passa com o aviso da decisão", it is not None and len(av) == 1)
    # confere.py: a conferência de licenças no fim
    import confere
    p = comum.Peca("guia-pronta-2026-10-14", None)
    props = p.le_props()
    with contextlib.redirect_stdout(io.StringIO()):  # a linha [ok]/[FALHA] da conferência fica fora do teste
        r = confere.confere_licencas(confere.Conf(), props)
    registra("confere: licenças do guia sem erro", not r["erros"])
    nova = copy.deepcopy(props)
    nova["peca"] = "2026-10-20-nova"
    nova["fatos"]["publico"] = "MEI"
    nova["creditoLegenda"] = "Modelos 3D: 'Wallet' por Poly by Google (Poly Pizza, CC BY 3.0), modificado"
    with contextlib.redirect_stdout(io.StringIO()):
        r = confere.confere_licencas(confere.Conf(), nova)
    txt = " | ".join(r["erros"])
    registra("confere: peça nova de MEI com a Talent, a folha com valor, tela do guia e crédito com marca dá erro",
             all(x in txt for x in ("não vale pra peça", "mostraValor", "não serve peça de MEI", "cita marca")), txt[:300])


# ---------- telas ----------
def testa_telas(tmp):
    import monta
    pasta = os.path.join(tmp, "receitas")
    os.makedirs(pasta, exist_ok=True)

    def receita(nome, corpo):
        caminho = os.path.join(pasta, nome)
        escrita.grava_json(caminho, corpo)
        return monta.le_receita(caminho)

    base = {"fonte": {"conjunto": "2026-10-02", "arquivo": "inicio.png"}, "fundo": "#FFFFFF",
            "cola": [{"caixa": [0, 1100, 1290, 1240], "y": 900}]}
    rec = receita("cruza.json", dict(base, saida="cruza.png"))
    info = monta.confere_catalogo(rec, "ME")
    registra("telas: cola que mostra o corte P12 do Início dá aviso de corte visível",
             any(c["regra"] == "P12" for c in info["cortesVisiveis"]), str(info["cortesVisiveis"]))
    rec = receita("apaga.json", dict(base, saida="apaga.png",
                                     preparo=[{"op": "apaga", "caixa": [60, 1105, 1230, 1236], "amostra": [5, 1100]}]))
    info = monta.confere_catalogo(rec, "ME")
    registra("telas: com o preparo apagando o corte, nenhum aviso", not info["cortesVisiveis"], str(info["cortesVisiveis"]))
    try:
        monta.confere_catalogo(rec, "MEI")
        registra("telas: peça de MEI com o Início (servePecaMei false) é recusada", False)
    except monta.ErroReceita as e:
        registra("telas: peça de MEI com o Início (servePecaMei false) é recusada", "não serve peça de MEI" in str(e))
    rec = receita("splash.json", {"saida": "splash.png", "fonte": {"conjunto": "2026-10-02", "arquivo": "splash.png"},
                                  "modo": "inteira"})
    info = monta.confere_catalogo(rec, "MEI")
    registra("telas: peça de MEI com a splash (servePecaMei true) passa", info["id"] == "tela0210-splash")
    rec = receita("reprovada.json", {"saida": "plano.png", "fonte": {"conjunto": "2026-10-02",
                                                                      "arquivo": "migrar_plano.png"},
                                     "modo": "inteira"})
    try:
        monta.confere_catalogo(rec, "ME")
        registra("telas: captura reprovada é recusada", False)
    except monta.ErroReceita as e:
        registra("telas: captura reprovada é recusada", "reprovada no catálogo" in str(e))
    # as receitas que existem não cruzam corte com regra
    achados = []
    for p in sorted(__import__("glob").glob(comum.KIT + "/telas/receitas/*.json")) + \
            sorted(__import__("glob").glob(comum.KIT + "/telas/receitas/rascunhos/*.json")) + \
            sorted(__import__("glob").glob(comum.KIT + "/pecas/*/telas/receitas/*.json")):
        if os.path.basename(p).startswith("_"):
            continue
        info = monta.confere_catalogo(monta.le_receita(p), None)
        if info["cortesVisiveis"]:
            achados.append(p)
    registra("telas: nenhuma receita do kit nem das peças mostra corte com regra", not achados, "; ".join(achados))


# ---------- validador numa cópia do catálogo ----------
def testa_valida(tmp):
    copia = os.path.join(tmp, "kit")
    shutil.copytree(comum.KIT + "/catalogos", copia + "/catalogos")
    shutil.copytree(comum.KIT + "/lib", copia + "/lib")
    sob = copia + "/catalogos/modelos/revisao-travas.json"
    d = json.load(open(sob, encoding="utf-8"))
    d["itens"]["glb-video-iphone"]["decisaoRisco"] = "Pedro, 02/10: pode usar"
    d["itens"]["glb-calendario-mesa"] = {"licenca": {"creditoLegenda": {"trecho": "'Calendar' por Google",
                                                                        "fonte": "Poly Pizza", "licenca": "CC BY 3.0"}}}
    escrita.grava_json(sob, d)
    sob = copia + "/catalogos/efeitos/revisao-travas.json"
    d = json.load(open(sob, encoding="utf-8"))
    d["itens"]["receita-mix-precificacao"]["status"] = "liberado"
    escrita.grava_json(sob, d)
    r = subprocess.run([comum.PY, "-B", copia + "/catalogos/valida.py", "--rapido", "--json"], capture_output=True,
                       text=True, encoding="utf-8", env=comum.env_python())
    out = json.loads(r.stdout) if r.stdout.strip().startswith("{") else {"erros": [r.stdout + r.stderr]}
    erros = " | ".join(out["erros"])
    registra("valida: decisaoRisco em texto livre num aceito-com-risco dá erro",
             "glb-video-iphone: aceito-com-risco sem decisaoRisco estruturada" in erros)
    registra("valida: crédito de legenda com Google dá erro", "glb-calendario-mesa: creditoLegenda.trecho cita marca" in erros)
    registra("valida: receita com a Epidemic na licença fora do reprovado dá erro",
             "receita-mix-precificacao: a licença cita a Epidemic" in erros)
    registra("valida: só esses 3 erros", len(out["erros"]) == 3, erros[:400])


# ---------- item 1: o mix com quadros/30 s e a junção que completa o mix antigo ----------
def testa_juncao_unidade(tmp):
    import math
    import wave
    import mixa
    import juncao
    for dur in (27.52, 18.03, 22.19):
        q = int(math.floor(dur * 30 + 0.5))
        n, q2, _fps = mixa.amostras_do_video({"duracao": dur, "quadros": q, "fps": 30}, dur)
        n_sem, q3, _ = mixa.amostras_do_video({"duracao": dur, "fps": 30}, dur)
        registra("item 1: %s s: o mix tem quadros x 1600 amostras (%d, %d quadros; antes, %d)"
                 % (str(dur).replace(".", ","), n, q, int(round(dur * 48000))),
                 n == q * 1600 == n_sem and q2 == q3 == q and n > int(round(dur * 48000)))

    def wav(caminho, amostras):
        with wave.open(caminho, "wb") as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(48000)
            w.writeframes(b"\x01\x00" * 2 * amostras)
        return caminho

    q = 826
    curto = wav(os.path.join(tmp, "mix-curto.wav"), 1320960)  # o mix da peça de 05/10 (27,52 s)
    exato, info = juncao.mix_exato(curto, q, juncao.Fraction(30))
    with wave.open(exato, "rb") as w:
        n_exato = w.getnframes()
    os.remove(exato)
    registra("item 1: a junção completa o mix curto com 640 amostras de silêncio (o completa_mix.py da 05/10)",
             n_exato == 1321600 and info["completadoComSilencio"] == 640 and exato != curto, str(info))
    longo = wav(os.path.join(tmp, "mix-longo.wav"), 1321600 + 700)
    exato, info = juncao.mix_exato(longo, q, juncao.Fraction(30))
    with wave.open(exato, "rb") as w:
        n_exato = w.getnframes()
    os.remove(exato)
    registra("item 1: a junção corta o mix que sobra menos de um quadro", n_exato == 1321600 and info["cortado"] == 700)
    certo = wav(os.path.join(tmp, "mix-certo.wav"), 1321600)
    mesmo, info = juncao.mix_exato(certo, q, juncao.Fraction(30))
    registra("item 1: o mix do tamanho certo vai como está", mesmo == certo and not info["completadoComSilencio"])
    errado = wav(os.path.join(tmp, "mix-errado.wav"), 1321600 - 4000)
    try:
        juncao.mix_exato(errado, q, juncao.Fraction(30))
        registra("item 1: mix com mais de um quadro de diferença é recusado", False)
    except comum.ErroSaida as e:
        registra("item 1: mix com mais de um quadro de diferença é recusado", "outra versão das props" in str(e))


# ---------- item 2: travas pela PASTA da peça ----------
def _peca_falsa(tmp, nome, cena=None, props=None):
    pasta = os.path.join(tmp, nome)
    os.makedirs(os.path.join(pasta, "voz"), exist_ok=True)
    if cena is not None:
        escrita.grava_json(os.path.join(pasta, "cenas.json"), cena)
    if props is not None:
        escrita.grava_json(os.path.join(pasta, "props.json"), props)
    return comum.barra(pasta)


def testa_pasta(tmp):
    guia = comum.Peca("guia-pronta-2026-10-14", None)
    cena = guia.le_cena()
    props = guia.le_props()
    # a cena do guia copiada pra outra pasta (só título e data novos; o "peca" continua o do guia)
    copia = dict(cena, titulo="Teste de auditoria", dataPost="2026-10-20")
    pasta = _peca_falsa(tmp, "2026-10-20-teste-aud", copia, props)
    escrita.copia(guia.caminho("voz", "narracao.json"), os.path.join(pasta, "voz", "narracao.json"))
    p = comum.Peca(pasta)
    for oque, fn in (("cena", p.le_cena), ("props", p.le_props)):
        try:
            fn()
            registra("item 2: comum.Peca recusa %s do guia copiada pra outra pasta" % oque, False)
        except comum.ErroSaida as e:
            registra("item 2: comum.Peca recusa %s do guia copiada pra outra pasta" % oque,
                     "a pasta é 2026-10-20-teste-aud" in str(e) and e.codigo == 2)
    md5_antes = escrita.md5(p.props)
    r = subprocess.run([comum.NODE, comum.CLI + "/props.mjs", pasta], capture_output=True, text=True, encoding="utf-8",
                       errors="replace", cwd=comum.RM, timeout=600)
    saida = (r.stdout or "") + (r.stderr or "")
    registra("item 2: o props.mjs recusa a cena do guia copiada pra outra pasta (nada gravado)", r.returncode == 2 and
             "a pasta é 2026-10-20-teste-aud" in saida and escrita.md5(p.props) == md5_antes,
             saida.strip().splitlines()[-1][:200] if saida.strip() else "")
    try:
        fatos.roda(p)
        registra("item 2: o fatos.py recusa as props de outra pasta", False)
    except comum.ErroSaida as e:
        registra("item 2: o fatos.py recusa as props de outra pasta", "as travas valem pela pasta" in str(e))
    import mixa
    tr = catalogo.indice("trilhas")
    try:
        mixa.trilha_da_peca(props, tr, [], mixa.nome_da_pasta(pasta))
        registra("item 2: o mixa.py decide a Talent pela pasta (as props do guia noutra pasta: recusa)", False)
    except mixa.ErroMix as e:
        registra("item 2: o mixa.py decide a Talent pela pasta (as props do guia noutra pasta: recusa)",
                 "não vale pra peça 2026-10-20-teste-aud" in str(e))
    import confere
    with contextlib.redirect_stdout(io.StringIO()):
        rl = confere.confere_licencas(confere.Conf(), props, "2026-10-20-teste-aud")
    registra("item 2: o confere decide a Talent pela pasta", any("não vale pra peça 2026-10-20-teste-aud" in e
                                                                for e in rl["erros"]))
    # a peça de teste renomeada pra publicar: o "peca" com '_' numa pasta sem '_' não vale como teste
    teste = dict(props, peca="_qualquer")
    p2 = comum.Peca(_peca_falsa(tmp, "2026-10-21-publica", dict(cena, peca="_qualquer"), teste))
    try:
        p2.le_props()
        registra("item 2: pasta de teste renomeada (campo '_qualquer', pasta sem '_') é recusada", False)
    except comum.ErroSaida as e:
        registra("item 2: pasta de teste renomeada (campo '_qualquer', pasta sem '_') é recusada",
                 "a pasta é 2026-10-21-publica" in str(e))
    try:
        mixa.trilha_da_peca(teste, tr, [], "2026-10-21-publica")
        registra("item 2: o mixa.py não trata como teste a pasta sem '_' (campo '_qualquer')", False)
    except mixa.ErroMix as e:
        registra("item 2: o mixa.py não trata como teste a pasta sem '_' (campo '_qualquer')", "não vale pra peça" in str(e))
    av = []
    it, _t = mixa.trilha_da_peca(teste, tr, av, "_pasta-de-teste")
    registra("item 2: na pasta de teste (com '_') a Talent passa com aviso", it is not None and
             any("peça de teste" in a for a in av))


# ---------- item 5: render, junção e entrega exigem a trava de fatos ok (e a entrega, o relatório) ----------
def testa_portoes(tmp):
    import portao
    guia = comum.Peca("guia-pronta-2026-10-14", None)
    props = dict(guia.le_props(), peca="2026-10-22-portao", titulo="Teste do portão (não entregar)",
                 dataPost="2026-10-22", trilha={"id": "mixkit-04-house-one", "mStart": 51.711, "ganhoDb": -6.7})
    pasta = _peca_falsa(tmp, "2026-10-22-portao", None, props)
    os.makedirs(os.path.join(pasta, "saida"), exist_ok=True)
    mp4 = os.path.join(pasta, "saida", "2026-10-22-portao.mp4")
    escrita.grava_bytes(mp4, b"final falso do teste do portao")
    escrita.grava_bytes(os.path.join(pasta, "saida", "2026-10-22-portao-mudo.mp4"), b"mudo falso")
    p = comum.Peca(pasta)

    def kit(*args):
        r = subprocess.run([comum.PY, "-B", comum.KIT + "/scripts/kit.py"] + list(args), capture_output=True, text=True,
                           encoding="utf-8", errors="replace", env=comum.env_python(), timeout=600)
        return r.returncode, (r.stdout or "") + (r.stderr or "")

    probs = portao.problemas_fatos(p)
    registra("item 5: sem a trava de fatos, o portão aponta o que falta", any("não rodou" in x for x in probs), "; ".join(probs))
    cod, out = kit("render", pasta)
    registra("item 5: o kit.py render recusa sem a trava de fatos (código 2, nada renderizado)",
             cod == 2 and "o render recusado" in out and "Não há opção de ignorar" in out, out.strip()[-200:])
    escrita.grava_bytes(os.path.join(pasta, "audio", "mix.wav"), b"mix falso", cria_pasta=True)
    cod, out = kit("juncao", pasta)  # nem chega no ffmpeg: o portão vem antes
    registra("item 5: a junção recusa sem a trava de fatos", cod == 2 and "a junção recusado" in out, out.strip()[-200:])
    raiz = os.path.join(tmp, "final-falso")
    cod, out = kit("entregar", pasta, "--raiz-final", raiz)
    registra("item 5: o entregar recusa sem a trava de fatos e sem o relatório do confere",
             cod == 2 and "a entrega recusado" in out and "falta o relatório do confere" in out and not os.path.isdir(raiz),
             out.strip()[-240:])
    # a trava de fatos ok (o fatos.py de verdade, sem roteiro) e um relatório ok de outro vídeo: a entrega ainda recusa
    with contextlib.redirect_stdout(io.StringIO()):
        doc, _s = fatos.roda(p)
    rel = {"versao": 2, "ok": True, "itens": [], "md5Video": "0" * 32, "propsMd5": escrita.md5(p.props)}
    escrita.grava_json(p.saida("relatorio", ".json", "saida"), rel)
    probs = portao.problemas_fatos(p) + portao.problemas_relatorio(p, mp4)
    registra("item 5: com a trava ok e o relatório de outro vídeo, a entrega ainda recusa",
             doc["ok"] and len(probs) == 1 and "relatório é de outro vídeo" in probs[0], "; ".join(probs))
    rel["md5Video"] = escrita.md5(mp4)
    escrita.grava_json(p.saida("relatorio", ".json", "saida"), rel)
    cod, out = kit("entregar", pasta, "--raiz-final", raiz)
    registra("item 5: com a trava de fatos e o relatório ok do mesmo mp4, o entregar entrega (raiz falsa)",
             cod == 0 and os.path.isfile(os.path.join(raiz, "2026-10-22 Teste do portão (não entregar)",
                                                       "2026-10-22-portao.mp4")), out.strip()[-200:])
    # props mudaram depois da trava: render recusa de novo
    escrita.grava_json(p.props, dict(props, titulo="Teste do portão (mudou)"))
    probs = portao.problemas_fatos(p)
    registra("item 5: props que mudaram depois da trava pedem a trava de novo", any("props mudaram" in x for x in probs))
    # peça de teste: passa com aviso
    pt = comum.Peca(_peca_falsa(tmp, "_2026-10-22-portao-teste", None, dict(props, peca="_2026-10-22-portao-teste")))
    with contextlib.redirect_stdout(io.StringIO()) as buf:
        av = portao.exige(pt, "o render", portao.problemas_fatos(pt))
    registra("item 5: peça de teste (pasta com '_') passa com aviso", bool(av) and "AVISO (peça de teste" in buf.getvalue())


# ---------- item 7: marca colada, licença CC Attribution, NC e Epidemic pela fonte, decisão de agente ----------
def testa_baixos(tmp):
    casos = {"'iPhone15 Pro' por Fulano": "iphone", "'iPhone-15' por X": "iphone", "'Apple-Watch Ultra' por Y":
             "apple-watch", "AppleWatch": "applewatch", "CasioF91W por Z": "casio", "'Post-it Notes' por W": "post-it",
             "'GoPro Hero' por K": "gopro", "celular por polyman Studio": None, "relógio por alboxer2000_": None,
             "pixelado": None}
    for texto, esperado in casos.items():
        achou = catalogo.marca_em(texto)
        registra("item 7: marca em %r: %s" % (texto, esperado or "nenhuma"), achou == esperado, str(achou))
    for nome, ccby, restrita in (("CC Attribution 4.0", True, None), ("Creative Commons Attribution 4.0", True, None),
                                 ("CC BY-NC 4.0", True, "NC"), ("CC BY-ND 4.0", True, "ND"),
                                 ("Licença do Pixabay (atribuição não é necessária)", False, None)):
        registra("item 7: licença %r: CC BY %s, restrita %s" % (nome, ccby, restrita),
                 catalogo.cc_by(nome) == ccby and catalogo.licenca_restrita(nome) == restrita)
    registra("item 7: Epidemic pela fonte, num efeito com licença de outro nome",
             catalogo.cita_epidemic({"id": "x", "fonte": "Epidemic Sound", "licenca": {"nome": "padrão"}}))
    d_agente = {"quem": "agente de teste", "quando": "2026-10-03", "pecas": ["*"], "texto": "t"}
    d_pedro_estrela = dict(d_agente, quem="Pedro")
    d_agente_nome = dict(d_agente, pecas=["2026-10-20-nova"])
    d_pedro_nome = dict(d_agente, quem="Pedro", pecas=["2026-10-20-nova"])
    registra("item 7: decisão de agente com '*' não vale pra peça nova (vale no guia)",
             not catalogo.decisao_vale(d_agente, "2026-10-20-nova") and catalogo.decisao_vale(d_agente, catalogo.PECA_GUIA))
    registra("item 7: decisão do Pedro com '*' também não vale pra peça nova", not catalogo.decisao_vale(d_pedro_estrela,
                                                                                                         "2026-10-20-nova"))
    registra("item 7: decisão de agente com a peça escrita não vale pra peça nova",
             not catalogo.decisao_vale(d_agente_nome, "2026-10-20-nova"))
    registra("item 7: decisão do Pedro com a peça escrita vale", catalogo.decisao_vale(d_pedro_nome, "2026-10-20-nova"))
    talent = dict(catalogo.indice("trilhas")["mixkit-01-talent-in-the-air"], decisaoRisco=d_agente)
    e, _a = catalogo.confere_trilha(talent, "2026-10-20-nova")
    registra("item 7: Talent com decisão de agente '*' em peça nova dá erro", bool(e) and "de agente" in e[0], e[0][:160] if e else "")
    # valida.py numa cópia do catálogo: CC Attribution sem crédito, NC e efeito da Epidemic pela fonte
    copia = os.path.join(tmp, "kit-baixos")
    shutil.copytree(comum.KIT + "/catalogos", copia + "/catalogos")
    shutil.copytree(comum.KIT + "/lib", copia + "/lib")
    sob = copia + "/catalogos/modelos/revisao-travas.json"
    d = json.load(open(sob, encoding="utf-8"))
    d["itens"]["glb-despertador"] = {"licenca": {"nome": "CC Attribution 4.0", "creditoLegenda": None}}
    d["itens"]["glb-calendario-mesa"] = {"licenca": {"nome": "CC BY-NC 4.0"}}
    escrita.grava_json(sob, d)
    sob = copia + "/catalogos/efeitos/revisao-travas.json"
    d = json.load(open(sob, encoding="utf-8"))
    d["itens"]["mixkit-166"] = {"fonte": "Epidemic Sound", "licenca": {"nome": "licença padrão"}}
    escrita.grava_json(sob, d)
    r = subprocess.run([comum.PY, "-B", copia + "/catalogos/valida.py", "--rapido", "--json"], capture_output=True,
                       text=True, encoding="utf-8", env=comum.env_python())
    out = json.loads(r.stdout) if r.stdout.strip().startswith("{") else {"erros": [r.stdout + r.stderr]}
    erros = " | ".join(out["erros"])
    registra("item 7: valida: 'CC Attribution 4.0' sem crédito de legenda dá erro",
             "glb-despertador: licença CC BY sem licenca.creditoLegenda" in erros, erros[:300])
    registra("item 7: valida: licença NC fora do reprovado dá erro", "glb-calendario-mesa: licença NC" in erros)
    registra("item 7: valida: efeito da Epidemic pela fonte fora do reprovado dá erro",
             "efeitos/mixkit-166: a licença cita a Epidemic" in erros)


def main(argv=None):
    comum.utf8()
    ap = argparse.ArgumentParser(prog="testa_regras.py", description="Testes das travas de regra do kit.")
    ap.add_argument("--mantem", action="store_true", help="não apaga a pasta temporária")
    a = ap.parse_args(argv)
    tmp = tempfile.mkdtemp(prefix="kit-travas-")
    try:
        testa_fatos()
        testa_trilha()
        testa_telas(tmp)
        testa_valida(tmp)
        testa_juncao_unidade(tmp)
        testa_pasta(tmp)
        testa_portoes(tmp)
        testa_baixos(tmp)
    finally:
        if not a.mantem:
            shutil.rmtree(tmp, ignore_errors=True)  # só a pasta que o teste criou
        else:
            print("pasta temporária mantida: %s" % tmp)
    falhas = [n for n, ok in RESULTADOS if not ok]
    print("\nresultado: %s (%d de %d)" % ("PASSOU" if not falhas else "FALHOU", len(RESULTADOS) - len(falhas),
                                         len(RESULTADOS)))
    return 0 if not falhas else 1


if __name__ == "__main__":
    sys.exit(main())
