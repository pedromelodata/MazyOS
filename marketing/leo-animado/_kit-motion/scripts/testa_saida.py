"""Testes do script de saída sem render (pacote K07). Contrato: KIT/DESENHO.md, seção 7; pacote K07.

Monta a peça de teste KIT/pecas/_teste-saida/ e roda os testes da lista do pacote, cada um com o número medido:
props, eventos, fatos (o guia passa; o roteiro de erro trava), mix, quadros, qc_legenda, telas (e --so-liga),
juncao (--mudo com o MUDO4), confere, capa, entregar (raiz falsa), vigia, limpa, doutor e ext-liga/ext-desliga, mais
provas a mais: kit.py --help e final --simula, aspas num .cmd (o caminho do npx.cmd do render), extensões em Node
(uma boa e uma quebrada, isoladas), nova (numa pasta do scratchpad) e o caminho --cena com sufixo.
Grava o resultado em KIT/pecas/_teste-saida/resultado-testes.json e, no fim (sem --mantem), apaga os arquivos grandes
de teste, a raiz falsa e os links de RM/public-kit/pecas/_teste-saida/.

A peça de teste (regra do pacote): os wav entram por hardlink (voz/narr-dylan.wav do GP/vo/); os JSON e o roteiro
entram por CÓPIA (cenas.json da cena do guia do K02, voz/narracao.json do REF/_referencia/ e voz/roteiro.md da pasta
voz do guia, do K03), nunca por link. A cópia da cena ganha capa e título de teste. Nada vai pro FINAL real: o teste
do entregar usa uma raiz falsa no scratchpad.

Uso (sempre com python -B):
    python -B testa_saida.py --prepara                       só monta a peça de teste
    python -B testa_saida.py [--so t1,t2] [--scratch <pasta>] [--mantem]
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import contextlib  # noqa: E402
import copy  # noqa: E402
import datetime  # noqa: E402
import io  # noqa: E402
import json  # noqa: E402
import os  # noqa: E402
import shutil  # noqa: E402
import subprocess  # noqa: E402
import time  # noqa: E402
import wave  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
from comum import escrita  # noqa: E402

PECA = "_teste-saida"
PASTA = comum.PECAS + "/" + PECA
GUIA = comum.PECAS + "/guia-pronta-2026-10-14"
REF_DIR = GUIA + "/_referencia"
TITULO_TESTE = "Teste do script de saída do kit (não entregar)"
MUDO4 = comum.GP + "/out/guia-v4-telas-novas-mudo.mp4"
V4 = comum.FINAL + "/2026-10-14 O app fazendo a guia do mês, sem site do governo/GUIA-PRONTA-motion-v4.mp4"
MIX_GUIA = comum.GP + "/audio/mix-guia.wav"
STILLS_GUIA = comum.KIT + "/provas/render/stills-guia"
MD5_FLUXO_V4 = "6ddbb29b1b005e7b209b040924ed1f17"
CREDITO_APROVADO = "Modelos 3D: celular por polyman Studio e relógio por alboxer2000_ (Sketchfab, CC BY 4.0), modificados"
SCRATCH_PADRAO = "C:/Users/EDIT-A~1/AppData/Local/Temp/claude/c--MKT-INSTA/9f25c963-3802-4688-87c4-1ffb83432d65/scratchpad"
KIT_PY = comum.KIT + "/scripts/kit.py"

# tabela da seção 6 (perfil v2, modo legado): ordem, t, som, args, ganho, inverte, batida
TABELA_6 = [
    (0, 0.0, "sint-s_whoosh", [0.5, 400, 6000], -32, False, "gancho-giro-varredura"),
    (1, 0.82, "sint-s_brilho", [0.75], -38, False, "gancho-giro-varredura"),
    (2, 1.84, "sint-s_swish", [0.13], -37, False, "nao-de-cabeca"),
    (3, 2.0, "sint-s_swish", [0.13], -38, False, "nao-de-cabeca"),
    (4, 2.16, "sint-s_swish", [0.13], -39, False, "nao-de-cabeca"),
    (5, 3.52, "pixabay-405445", [], -26, False, "mergulho-abre-app"),
    (6, 3.72, "pixabay-197886", [], -29, False, "mergulho-abre-app"),
    (7, 4.24, "sint-s_chime", [1975.5, 0.6], -35, False, "card-contador"),
    (8, 4.3, "sint-s_processa", [4.3, 5.5], 0, False, "card-contador"),
    (9, 5.66, "pixabay-186577", [], -30, False, "empurrar-tela"),
    (10, 6.12, "sint-s_whoosh", [0.45, 400, 7000], -29, False, "objeto-sai-da-tela"),
    (11, 6.18, "sint-s_papel", [0.3], -30, False, "objeto-sai-da-tela"),
    (12, 7.22, "sint-s_papel", [0.22], -33, False, "objeto-sai-da-tela"),
    (13, 7.76, "sint-s_swish", [0.3], -32, False, "objeto-sai-da-tela"),
    (14, 7.76, "pixabay-405445", [], -29, False, "objeto-sai-da-tela"),
    (15, 8.04, "sint-s_vibra", [0.16], -25, False, "relogio-notificacao"),
    (16, 8.22, "sint-s_vibra", [0.18], -26, False, "relogio-notificacao"),
    (17, 8.07, "pixabay-570438", [], -25, False, "relogio-notificacao"),
    (18, 8.93, "sint-s_swish", [0.28], -32, False, "relogio-notificacao"),
    (19, 8.88, "mixkit-166", [], -27, False, "flip-troca-escondida"),
    (20, 9.7, "mixkit-1897", [], -36, False, "flip-troca-escondida"),
    (21, 9.62, "sint-s_whoosh", [0.5, 500, 7000], -33, False, "flip-troca-escondida"),
    (22, 10.12, "sint-s_tick", [2900], -38, False, "toque-botao"),
    (23, 10.29, "mixkit-1109", [], -22, False, "toque-botao"),
    (24, 10.42, "mixkit-2867", [], -26, False, "toque-botao"),
    (25, 10.95, "sint-s_whoosh", [0.55, 350, 6000], -33, False, "recuo-camera"),
    (26, 11.74, "sint-s_brilho", [0.7], -36, False, "recuo-camera"),
    (27, 13.45, "sint-s_whoosh", [0.45, 400, 6500], -32, False, "fecho-simbolo"),
    (28, 14.58, "sint-s_whoosh", [0.45, 400, 7000], -31, True, "fecho-simbolo"),
    (29, 14.97, "sint-s_pop", [900, 420, 0.1, 34], -29, False, "fecho-simbolo"),
    (30, 15.96, "sint-s_chime", [1567.98, 0.9], -33, False, "fecho-simbolo"),
    (31, 16.0, "sint-s_chime", [2093.0, 0.7], -39, False, "fecho-simbolo"),
    (32, 16.95, "sint-s_swish", [0.3], -33, False, "fecho-simbolo"),
    (33, 15.3, "pixabay-316482", [], -28, False, "link-bio"),
    (34, 17.05, "sint-s_whoosh", [0.6, 300, 5000], -33, False, "volta-loop"),
]


# ---------- peça de teste ----------
def prepara():
    """Monta a peça de teste (idempotente: o que já está igual fica)."""
    feitos = []
    os.makedirs(PASTA + "/voz", exist_ok=True)
    os.makedirs(PASTA + "/telas/receitas", exist_ok=True)
    cena = comum.le_json(GUIA + "/cenas.json")
    cena["peca"] = PECA
    cena["titulo"] = TITULO_TESTE
    cena["capa"] = {"quadro": 0, "titulo": "O app fazendo a guia do mês", "destaque": "guia"}
    cena["notas"] = ("Peça de teste do script de saída (K07): cópia da cena do guia (KIT/pecas/guia-pronta-2026-10-14/"
                     "cenas.json, do K02) com a peça, o título e a capa de teste. A narração e o roteiro são cópias; a "
                     "voz é hardlink do GP/vo/narr-dylan.wav. Não entregar no FINAL de verdade.")
    _grava_json_se_mudou(PASTA + "/cenas.json", cena, feitos)
    erro = copy.deepcopy(cena)
    for ex in erro["telas"]["inicioPagar"]["extras"]:
        if ex["tipo"] == "botao":
            ex["retorno"] = "Pago"
    erro["capa"] = None
    erro["notas"] = "Cena de teste da trava de fatos (K07): o retorno do botão diz 'Pago' (tem que dar erro)."
    _grava_json_se_mudou(PASTA + "/cenas-fatos-erro.json", erro, feitos)
    _copia_se_mudou(REF_DIR + "/narracao.json", PASTA + "/voz/narracao.json", feitos)
    _copia_se_mudou(GUIA + "/voz/roteiro.md", PASTA + "/voz/roteiro.md", feitos)
    with open(GUIA + "/voz/roteiro.md", encoding="utf-8") as f:
        rot = f.read()
    rot = rot.replace("Chegando em *breve*.", "Chegando em *breve*.\nFaça você mesmo no *portal*.\nCusta só *R$ 75,90* por mês.")
    rot = rot.replace("| fim do vídeo |", "| pagar (37) | toque-botao | o botão mostra \"Pago\" na tela |\n| fim do vídeo |")
    rot = rot.replace("# Roteiro: ", "# Roteiro de teste da trava de fatos (K07): ", 1)
    _grava_texto_se_mudou(PASTA + "/roteiro-fatos-erro.md", rot, feitos)
    info = escrita.liga(comum.GP + "/vo/narr-dylan.wav", PASTA + "/voz/narr-dylan.wav")
    feitos.append("voz/narr-dylan.wav (hardlink, st_nlink %d)" % info["st_nlink"])
    for n in ("guia-splash", "guia-inicio", "guia-inicio-pagar", "guia-imposto"):
        _copia_se_mudou(comum.KIT + "/telas/receitas/%s.json" % n, PASTA + "/telas/receitas/%s.json" % n, feitos)
    return feitos


def _grava_json_se_mudou(caminho, obj, feitos):
    _grava_texto_se_mudou(caminho, json.dumps(obj, ensure_ascii=False, indent=2) + "\n", feitos)


def _grava_texto_se_mudou(caminho, texto, feitos):
    if os.path.isfile(caminho):
        with open(caminho, encoding="utf-8") as f:
            if f.read() == texto:
                return
    escrita.grava_texto(caminho, texto)
    feitos.append(os.path.relpath(caminho, PASTA).replace("\\", "/"))


def _copia_se_mudou(origem, destino, feitos):
    if os.path.isfile(destino) and escrita.md5(destino) == escrita.md5(origem):
        return
    escrita.copia(origem, destino)
    feitos.append(os.path.relpath(destino, PASTA).replace("\\", "/") + " (cópia)")


# ---------- ajudantes ----------
def kit(*args, env=None, timeout=1200):
    """Roda o kit.py e devolve (código, saída)."""
    e = comum.env_python()
    if env:
        e.update(env)
    r = subprocess.run([comum.PY, "-B", KIT_PY] + [str(a) for a in args], capture_output=True, text=True,
                       encoding="utf-8", errors="replace", env=e, timeout=timeout)
    return r.returncode, (r.stdout or "") + (r.stderr or "")


def no(cli, *args, env=None):
    e = dict(os.environ)
    if env:
        e.update(env)
    r = subprocess.run([comum.NODE, comum.CLI + "/" + cli] + [str(a) for a in args], capture_output=True, text=True,
                       encoding="utf-8", errors="replace", cwd=comum.RM, env=e, timeout=600)
    return r.returncode, (r.stdout or "") + (r.stderr or "")


def le_wav(p):
    import numpy as np
    w = wave.open(p, "rb")
    d = w.readframes(w.getnframes())
    par = w.getparams()
    w.close()
    return np.frombuffer(d, np.int16), par


def foto_arvore(raiz):
    """{caminho relativo: (tamanho, st_ino, st_nlink)} de uma árvore (pastas com None)."""
    out = {}
    for r, dirs, arqs in os.walk(raiz):
        for d in dirs:
            out[os.path.relpath(os.path.join(r, d), raiz).replace("\\", "/") + "/"] = None
        for a in arqs:
            p = os.path.join(r, a)
            st = os.stat(p)
            out[os.path.relpath(p, raiz).replace("\\", "/")] = (st.st_size, st.st_ino, st.st_nlink)
    return out


@contextlib.contextmanager
def silencio():
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        yield buf


class Testes:
    def __init__(self, scratch):
        self.scratch = comum.barra(os.path.realpath(scratch))
        self.res = []

    def registra(self, nome, ok, medido, criterio, detalhe=None):
        self.res.append({"teste": nome, "ok": bool(ok), "medido": medido, "criterio": criterio, "detalhe": detalhe})
        print("[%s] %-16s %s" % ("ok" if ok else "FALHOU", nome, medido), flush=True)

    # 1. props
    def t_props(self):
        cod, out = kit("props", PECA)
        props = comum.le_json(PASTA + "/props.json") if cod == 0 else {}
        av = props.get("avisos", [])
        esperados = {
            "créditos CC BY": any(a.startswith("créditos CC BY") for a in av),
            "LINK DA BIO #F2643C": any(a.startswith("LINK DA BIO em #F2643C") for a in av),
            "prévia real": any("protótipo Next.js" in a for a in av),
        }
        ok = cod == 0 and all(esperados.values()) and props.get("creditoLegenda") == CREDITO_APROVADO
        self.registra("props", ok, "código %d, 0 erro, %d avisos; esperados: %s; creditoLegenda aprovado: %s"
                      % (cod, len(av), ", ".join("%s %s" % (k, "sim" if v else "NÃO") for k, v in esperados.items()),
                         props.get("creditoLegenda") == CREDITO_APROVADO),
                      "sem erro, com os avisos de créditos, LINK DA BIO #F2643C e 'prévia real'", {"avisos": av})

    # 2. eventos
    def t_eventos(self):
        cod, out = kit("eventos", PECA)
        doc = comum.le_json(PASTA + "/eventos.json")
        evs = doc["eventos"]
        fx = comum.le_json(comum.KIT + "/audio/_regressao/eventos-guia-v2.json")
        fx_ev = fx["eventos"] if isinstance(fx, dict) else fx
        r6 = lambda x: round(float(x) * 1e6) / 1e6  # noqa: E731

        def args_iguais(a, b):
            return len(a) == len(b) and all((abs(x - y) < 1e-9) if isinstance(x, (int, float)) and isinstance(y, (int, float))
                                            else x == y for x, y in zip(a, b))

        dif_tab, dif_fx = [], []
        for i, (ordem, t, som, args, ganho, inv, origem) in enumerate(TABELA_6):
            if i >= len(evs):
                dif_tab.append("falta o evento %d" % i)
                continue
            e = evs[i]
            tr = e.get("transpor") or None
            if (e["ordem"] != ordem or r6(e["t"]) != r6(t) or e["som"] != som or not args_iguais(e.get("args", []), args)
                    or e["ganhoDb"] != ganho or bool(e.get("inverte")) != inv or e.get("filtro") or tr
                    or str(e["origem"]).split("#")[0] != origem):
                dif_tab.append("evento %d: %s" % (i, json.dumps(e, ensure_ascii=False)))
        for i, f in enumerate(fx_ev):
            if i >= len(evs):
                dif_fx.append("falta o evento %d" % i)
                continue
            e = evs[i]
            campos = ("ordem", "som", "ganhoDb")
            if (any(e.get(c) != f.get(c) for c in campos) or r6(e["t"]) != r6(f["t"])
                    or not args_iguais(e.get("args", []), f.get("args", [])) or bool(e.get("inverte")) != bool(f.get("inverte"))
                    or (e.get("filtro") or None) != (f.get("filtro") or None)
                    or (e.get("transpor") or None) != (f.get("transpor") or None)):
                dif_fx.append("evento %d" % i)
        ok = cod == 0 and len(evs) == 35 and len(fx_ev) == 35 and not dif_tab and not dif_fx
        self.registra("eventos", ok, "%d eventos; tabela da seção 6: %d diferença(s); eventos-guia-v2.json (K05): %d "
                      "diferença(s); perfil %s, ruído %s" % (len(evs), len(dif_tab), len(dif_fx), doc["perfil"],
                                                              doc["modoRuido"]),
                      "35 eventos iguais à tabela da seção 6 e à fixture do K05", {"tabela": dif_tab, "fixture": dif_fx})

    # 3. fatos
    def t_fatos(self):
        cod, out = kit("fatos", PECA)
        d = comum.le_json(PASTA + "/qc/fatos.json")
        exemplo = [n for n in d["numeros"] if n["texto"] == "R$ 178,31" and n["fato"] == "exemplo"]
        dia20 = [n for n in d["numeros"] if n["texto"] == "dia 20" and "F062" in (n.get("fatos") or [])]
        governo = [a for a in d["avisos"] if "site do governo" in a["mensagem"]]
        ok_guia = cod == 0 and not d["erros"] and exemplo and dia20 and governo
        cod2, _ = kit("props", PECA, "--cena", "cenas-fatos-erro.json")
        cod3, out3 = kit("fatos", PECA, "--cena", "cenas-fatos-erro.json", "--roteiro", "roteiro-fatos-erro.md")
        e = comum.le_json(PASTA + "/qc/fatos-fatos-erro.json")
        pega = {
            "faça você mesmo (regra 4)": any(x["regra"] == 4 and "você mesmo" in x["mensagem"] for x in e["erros"]),
            "R$ 75,90 sem exemplo (regra 1)": any(x["regra"] == 1 and "R$ 75,90" in x["mensagem"] for x in e["erros"]),
            "'pago' na tela (regra 4)": any(x["regra"] == 4 and "'pago'" in x["mensagem"] for x in e["erros"]),
        }
        cita = all(x.get("origem") and "regra" in x["mensagem"] for x in e["erros"])
        ok_erro = cod2 == 0 and cod3 == 1 and all(pega.values()) and cita
        self.registra("fatos", ok_guia and ok_erro,
                      "guia: código %d, %d erro(s), %d aviso(s) (R$ 178,31 exemplo: %s; dia 20 no FATOS: %s; site do "
                      "governo como aviso: %s); roteiro de erro: código %d, %d erro(s): %s; todas citam regra e origem: %s"
                      % (cod, len(d["erros"]), len(d["avisos"]), bool(exemplo), bool(dia20), bool(governo), cod3,
                         len(e["erros"]), ", ".join("%s %s" % (k, "sim" if v else "NÃO") for k, v in pega.items()), cita),
                      "o guia passa com 0 erro; o roteiro de erro dá código 1 e cita as regras",
                      {"guia": {"avisos": [a["mensagem"] for a in d["avisos"]], "numeros": d["numeros"]},
                       "erro": [{"mensagem": x["mensagem"], "origem": x["origem"], "onde": x["onde"]} for x in e["erros"]]})

    # 4. mix
    def t_mix(self):
        cod, out = kit("mix", PECA)
        a, pa = le_wav(PASTA + "/audio/mix.wav")
        b, pb = le_wav(MIX_GUIA)
        import numpy as np
        mesmo = len(a) == len(b) and pa[:3] == pb[:3]
        dmax = int(np.abs(a.astype(np.int32) - b.astype(np.int32)).max()) if mesmo else None
        ndif = int((a != b).sum()) if mesmo else None
        md5 = escrita.md5(PASTA + "/audio/mix.wav")
        ok = cod == 0 and mesmo and dmax is not None and dmax <= 1
        self.registra("mix", ok, "código %d; %d amostras por canal; diferença máxima %s LSB, %s amostra(s) diferente(s); "
                      "md5 %s (o do REF é 80dd068e3dde76d25812766e54cf7d18)" % (cod, len(a) // 2, dmax, ndif, md5),
                      "int16 iguais ao GP/audio/mix-guia.wav (tolerância de 1 LSB, critério do K05)")

    # 5. quadros e 6. legenda
    def t_qc(self):
        cod, out = kit("qc", PECA)
        q = comum.le_json(PASTA + "/qc/quadros.json")
        tfim = q.get("tFim") or {}
        ok_q = q["total"] == 540 and len(q["quadros"]) == 540 and tfim.get("t") == 18 and "amb" in tfim and "estado" in tfim
        self.registra("quadros", ok_q, "%d quadros (total %d), tFim em t = %s com a camada ambiente e o estado; %d âncoras"
                      % (len(q["quadros"]), q["total"], tfim.get("t"), len(q.get("ancoras") or [])),
                      "540 quadros e a entrada tFim")
        leg = comum.le_json(PASTA + "/qc/legenda.json")
        fm = leg["folgaMinima"]
        ok_l = cod == 0 and leg["ok"] and not leg["invasoes"]
        self.registra("qc_legenda", ok_l, "0 invasão no guia com as margens calibradas (%.0f px cheia, %.0f px na "
                      "transição); folga mínima real do guia: %.2f px com a frase cheia (quadro %d) e %.2f px na "
                      "transição (quadro %d, opacidade %.2f); %d quadro(s) em alerta abaixo de 8 px"
                      % (leg["margens"]["cheiaPx"], leg["margens"]["transicaoPx"], fm["cheia"]["folga"], fm["cheia"]["q"],
                         fm["transicao"]["folga"], fm["transicao"]["q"], fm["transicao"]["opacidade"],
                         len(leg["quadrosPerto"])),
                      "sem invasão no guia (a margem é calibrada no guia aprovado)")

    # 7. telas
    def t_telas(self):
        import numpy as np
        from PIL import Image
        cod, out = kit("telas", PECA)
        nomes = ["tela-splash.png", "tela-inicio.png", "tela-inicio-pagar.png", "tela-imposto.png"]
        iguais, links = [], []
        for n in nomes:
            a = np.asarray(Image.open(PASTA + "/telas/" + n).convert("RGB"))
            b = np.asarray(Image.open(REF_DIR + "/" + n).convert("RGB"))
            iguais.append(a.shape == b.shape and bool(np.array_equal(a, b)))
            d = comum.PUBLIC_KIT + "/pecas/%s/telas/%s" % (PECA, n)
            links.append(os.path.isfile(d) and os.path.samefile(d, PASTA + "/telas/" + n) and os.stat(d).st_nlink >= 2)
        reg = comum.le_json(PASTA + "/telas/regioes.json")
        reg_ok = reg == comum.le_json(GUIA + "/cenas.json")["regioes"]
        antes = {n: (os.stat(PASTA + "/telas/" + n).st_mtime_ns, os.stat(PASTA + "/telas/" + n).st_ino)
                 for n in nomes + ["qa.jpg", "regioes.json"]}
        cod2, out2 = kit("telas", PECA, "--so-liga")
        depois = {n: (os.stat(PASTA + "/telas/" + n).st_mtime_ns, os.stat(PASTA + "/telas/" + n).st_ino) for n in antes}
        nao_remontou = antes == depois and "monta.py" not in out2
        ok = cod == 0 and cod2 == 0 and all(iguais) and all(links) and reg_ok and nao_remontou
        self.registra("telas", ok, "4 PNG iguais pixel a pixel às do REF: %d de 4; ligadas no public-kit (st_nlink >= 2): "
                      "%d de 4; regioes.json igual às regiões da cena do guia: %s; --so-liga sem remontar: %s"
                      % (sum(iguais), sum(links), reg_ok, nao_remontou),
                      "as 4 PNG iguais às do REF, ligadas; --so-liga não remonta")

    # 8. junção
    def t_juncao(self):
        st_mudo = os.stat(MUDO4)
        velho = PASTA + "/saida/juncao.json"
        if os.path.isfile(velho):
            os.remove(velho)  # o relatório velho não pode passar por resultado desta rodada
        cod, out = kit("juncao", PECA, "--mudo", MUDO4)
        j = comum.le_json(PASTA + "/saida/juncao.json")
        final = PASTA + "/saida/%s.mp4" % PECA
        a = comum.audio_mono(final)
        b = comum.audio_mono(V4)
        ca = comum.compara_audio(a, b)
        st_mudo2 = os.stat(MUDO4)
        intacto = (st_mudo.st_nlink, st_mudo.st_size, st_mudo.st_mtime_ns) == (st_mudo2.st_nlink, st_mudo2.st_size,
                                                                               st_mudo2.st_mtime_ns)
        md5_final = escrita.md5(final)
        ok = (cod == 0 and abs(j["I"] + 14.0) <= 0.1 and j["TP"] <= -1.5 and j["md5FluxoVideo"] == MD5_FLUXO_V4
              and ca["atrasoAmostras"] == 0 and ca["correlacao"] >= 0.999 and abs(ca["diferencaNivelDb"]) <= 0.15 and intacto)
        self.registra("juncao", ok, "código %d; I %.1f LUFS, pico real %.1f dBTP, volume=%.2fdB em %d volta(s); fluxo de "
                      "vídeo %s; áudio contra o V4: atraso %d, correlação %.6f, nível %+.3f dB; final md5 %s (%s o arquivo "
                      "do V4); MUDO4 intacto, sem cópia nem link (st_nlink %d): %s"
                      % (cod, j["I"], j["TP"], j["ganhoDb"], len(j["voltas"]), j["md5FluxoVideo"], ca["atrasoAmostras"],
                         ca["correlacao"], ca["diferencaNivelDb"], md5_final,
                         "igual a" if md5_final == "d668c81becc241a3d8d92b10b2745af5" else "diferente de",
                         st_mudo2.st_nlink, intacto),
                      "I -14,0 +- 0,1; pico <= -1,5 dBTP; fluxo 6ddbb29b...; correlação >= 0,999, atraso 0, nível <= 0,15 dB")

    # 8b. junção com duração fracionária (rodada 4, 03/10): o áudio com quadros/30 s e a junção sem cortar quadro
    def t_juncao_fracao(self):
        """Três durações em que a fração de quadro arredonda pra cima (antes, a junção cortava 2 a 4 quadros do fim):
        27,52 s (a peça de 05/10, 826 quadros), 18,03 s (541) e 22,19 s (666). Em cada uma, com arquivos minúsculos
        num temporário: (1) o comando de junção com o mix do tamanho antigo, round(duração x 48000), corta quadros;
        (2) o mixa.py novo grava quadros x 1600 amostras; (3) a junção com esse mix sai com todos os quadros e o fluxo
        de vídeo igual ao do mudo; (4) a junção com o mix antigo também, completando o silêncio que faltava (o
        completa_mix.py da peça de 05/10, agora dentro do kit). Mais um controle em 33,41 s, que arredonda pra baixo:
        o mix antigo sobra e a junção corta o excesso."""
        import math
        import tempfile
        sys.path.insert(0, comum.KIT + "/audio")
        import mixa
        import juncao
        raiz = tempfile.mkdtemp(prefix="kit-juncao-fracao-")
        nome = "_teste-juncao-fracao"  # peça de teste: o portão da trava de fatos só avisa
        pasta = raiz + "/" + nome
        casos, medidas = [(27.52, True), (18.03, True), (22.19, True), (33.41, False)], []
        try:
            os.makedirs(pasta + "/saida")
            efeitos, trilhas = mixa.carrega_catalogos()
            for dur, arredonda_pra_cima in casos:
                q = int(math.floor(dur * 30 + 0.5))  # o Math.round do props.ts
                n_antigo = int(round(dur * 48000))   # o que o mixa.py gravava antes
                mudo = pasta + "/saida/%s-mudo.mp4" % nome
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=size=160x288:rate=30",
                                "-frames:v", str(q), "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt",
                                "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
                                mudo], check=True)
                props = {"versao": 1, "peca": nome, "duracao": dur, "quadros": q, "fps": 30, "voz": None,
                         "trilha": None, "sons": {"perfil": "v2", "modoRuido": "por-evento"}}
                escrita.grava_json(pasta + "/props.json", props)
                eventos = {"versao": 1, "peca": nome, "duracao": dur, "perfil": "v2", "modoRuido": "por-evento",
                           "eventos": [{"ordem": 0, "t": 0.5, "som": "sint-s_pop", "args": [900, 420, 0.1, 34],
                                        "ganhoDb": -20, "origem": "teste#0"},
                                       {"ordem": 1, "t": dur - 1.0, "som": "sint-s_pop", "args": [900, 420, 0.1, 34],
                                        "ganhoDb": -20, "origem": "teste#1"}]}
                # (2) o mixa.py novo
                with silencio():
                    rel_mix = mixa.mixa(pasta, props, eventos, pasta + "/audio/mix.wav", catalogos=(efeitos, trilhas))
                amostras_novas = rel_mix["formato"]["amostras"]
                # o mix do tamanho antigo, a partir do novo (corta ou completa com silêncio)
                with wave.open(pasta + "/audio/mix.wav", "rb") as w:
                    par = w.getparams()
                    dados = w.readframes(par.nframes)
                dados_antigo = dados[:n_antigo * 4] + b"\x00" * max(0, (n_antigo - par.nframes) * 4)
                buf = io.BytesIO()
                with wave.open(buf, "wb") as o:
                    o.setnchannels(2)
                    o.setsampwidth(2)
                    o.setframerate(48000)
                    o.writeframes(dados_antigo)
                escrita.grava_bytes(pasta + "/audio/mix-antigo.wav", buf.getvalue())
                # (1) o comando de junção de antes, com o mix antigo
                tmp = pasta + "/saida/antes.mp4"
                juncao._ffmpeg_juncao(mudo, pasta + "/audio/mix-antigo.wav", 0.0, tmp)
                q_antes = juncao.quadros_do_video(tmp)[0]
                os.remove(tmp)
                peca = comum.Peca(pasta)
                # (3) e (4) a junção nova, com o mix novo e com o antigo
                res = {}
                for rot, mix in (("novo", pasta + "/audio/mix.wav"), ("antigo", pasta + "/audio/mix-antigo.wav")):
                    with silencio():
                        j = juncao.junta(peca, mudo, mix, pasta + "/saida/final-%s.mp4" % rot)
                    res[rot] = j
                    os.remove(j["saida"])
                ok_caso = (amostras_novas == q * 1600
                           and (q_antes < q if arredonda_pra_cima else q_antes == q)
                           and all(res[r]["quadrosFinal"] == q and res[r]["videoIgualAoMudo"] for r in res)
                           and res["novo"]["mixExato"]["completadoComSilencio"] == 0
                           and res["novo"]["mixExato"]["cortado"] == 0
                           and (res["antigo"]["mixExato"]["completadoComSilencio"] == q * 1600 - n_antigo
                                if arredonda_pra_cima else res["antigo"]["mixExato"]["cortado"] == n_antigo - q * 1600))
                medidas.append({"duracao": dur, "quadros": q, "amostrasAntigas": n_antigo, "amostrasNovas": amostras_novas,
                                "quadrosAntes": q_antes, "quadrosMixNovo": res["novo"]["quadrosFinal"],
                                "quadrosMixAntigo": res["antigo"]["quadrosFinal"],
                                "completado": res["antigo"]["mixExato"]["completadoComSilencio"],
                                "cortado": res["antigo"]["mixExato"]["cortado"],
                                "videoIgual": [res[r]["videoIgualAoMudo"] for r in res], "ok": ok_caso})
        finally:
            shutil.rmtree(raiz, ignore_errors=True)  # só a pasta que o teste criou
        ok = len(medidas) == len(casos) and all(m["ok"] for m in medidas)
        self.registra("juncao fração", ok, "; ".join(
            "%s s (%d quadros): antes %d quadros com o mix de %d amostras; o mixa.py novo grava %d; a junção nova sai com "
            "%d (mix novo) e %d (mix antigo %s %d amostras), vídeo igual ao mudo: %s"
            % (str(m["duracao"]).replace(".", ","), m["quadros"], m["quadrosAntes"], m["amostrasAntigas"],
               m["amostrasNovas"], m["quadrosMixNovo"], m["quadrosMixAntigo"],
               "completado com" if m["completado"] else "cortado em", m["completado"] or m["cortado"],
               all(m["videoIgual"])) for m in medidas),
            "nas 3 frações que arredondam pra cima, a junção antiga corta e a nova sai com todos os quadros; o mix novo "
            "tem quadros x 1600 amostras; o controle (33,41 s) corta o excesso do mix antigo", {"medidas": medidas})

    # 9. conferência
    def t_confere(self):
        cod_e, _ = kit("confere", PECA, "--stills", STILLS_GUIA, "--matriz", "bt601-cheia", "--sem-whisper")
        rel_e = comum.le_json(PASTA + "/saida/relatorio.json")
        cor_e = [i for i in rel_e["itens"] if i["nome"] == "cor"][0]
        min_errada = min(x["media"] for x in cor_e["detalhe"])
        cod, out = kit("confere", PECA, "--stills", STILLS_GUIA)
        rel = comum.le_json(PASTA + "/saida/relatorio.json")
        it = {i["nome"]: i for i in rel["itens"]}
        cor = it["cor"]["detalhe"]
        fala = it["fala"]["detalhe"]
        with open(PASTA + "/saida/creditos.txt", encoding="utf-8") as f:
            cred = f.read().strip()
        folha_ok = os.path.isfile(PASTA + "/saida/folha.jpg")
        n_fala = int(it["fala"]["medido"].split(" de ")[0])
        ok = (cod_e == 1 and not cor_e["ok"] and min_errada >= 2 and cod == 0 and rel["ok"] and it["cor"]["ok"]
              and n_fala == 50 and folha_ok and cred == CREDITO_APROVADO)
        self.registra("confere", ok, "matriz certa: %d stills, pior média %.4f (quadro %d); matriz errada (bt601, faixa "
                      "cheia): reprova, menor média %.4f; whisper small: %s; folha gerada: %s; creditos.txt com o texto "
                      "aprovado: %s; todas as conferências: %s"
                      % (len(cor), max(x["media"] for x in cor), max(cor, key=lambda x: x["media"])["quadro"], min_errada,
                         it["fala"]["medido"], folha_ok, cred == CREDITO_APROVADO, "passaram" if rel["ok"] else "FALHARAM"),
                      "still contra o quadro passa com a matriz certa e reprova (>= 2) com a errada; 50 palavras; folha; "
                      "creditos.txt aprovado", {"cor": cor, "corErrada": cor_e["detalhe"], "fala": fala})

    # 10. capa
    def t_capa(self):
        from PIL import Image
        cod, out = kit("capa", PECA, "--still", STILLS_GUIA + "/kitmotion-guia-0000.png", "--titulo",
                       "O app fazendo a guia do mês")
        d = comum.le_json(PASTA + "/saida/capa.json")
        png = Image.open(PASTA + "/saida/capa.png")
        grade = Image.open(PASTA + "/saida/capa-grade.jpg")
        trav = comum.tem_travessao(d["titulo"])
        ok = (cod == 0 and png.size == (1080, 1920) and grade.size == (540, 675) and d["dentroDa4x5"] and not trav
              and not d["erros"])
        self.registra("capa", ok, "capa.png %dx%d e capa-grade.jpg %dx%d; título em %d px, %d linha(s) (%s); faixa %s "
                      "dentro da área 4:5 (y 285 a 1635): %s; travessão no título: %s"
                      % (png.size[0], png.size[1], grade.size[0], grade.size[1], d["tamanhoFonte"], len(d["linhas"]),
                         " / ".join(d["linhas"]), d["faixa"], d["dentroDa4x5"], "sim" if trav else "zero"),
                      "capa.png 1080x1920 e capa-grade.jpg, título na área 4:5, zero travessão")

    # 11. entregar
    def t_entregar(self):
        raiz = self.scratch + "/final-falso"
        videos = self.scratch + "/videos-falso"
        for p in (raiz, videos):
            if os.path.isdir(p):
                shutil.rmtree(p)
        props = comum.le_json(PASTA + "/props.json")
        proposta = "%s %s" % (props["dataPost"], props["titulo"])
        ant = raiz + "/" + proposta + "/GUIA-TESTE-motion-v1.mp4"
        os.makedirs(os.path.dirname(ant))
        os.makedirs(videos + "/sub")
        conteudo = b"versao anterior falsa do teste do entregar (K07)"
        escrita.grava_bytes(ant, conteudo)
        os.link(ant, videos + "/sub/GUIA-TESTE-motion-v1.mp4")
        md5_ant = escrita.md5(ant)
        foto_final = foto_arvore(comum.FINAL)
        cod_s, out_s = kit("entregar", PECA, "--simula")
        cod_r, out_r = kit("entregar", PECA)
        cod, out = kit("entregar", PECA, "--raiz-final", raiz, "--videos", videos)
        foto_final2 = foto_arvore(comum.FINAL)
        movida = raiz + "/_versoes-anteriores/" + proposta + "/GUIA-TESTE-motion-v1.mp4"
        novo = raiz + "/" + proposta + "/%s.mp4" % PECA
        aviso_ok = "também existe em outro lugar" in out and (videos + "/sub/GUIA-TESTE-motion-v1.mp4") in out
        movida_ok = os.path.isfile(movida) and not os.path.exists(ant) and escrita.md5(movida) == md5_ant
        videos_ok = os.path.isfile(videos + "/sub/GUIA-TESTE-motion-v1.mp4") and os.path.samefile(
            movida, videos + "/sub/GUIA-TESTE-motion-v1.mp4")
        novo_ok = os.path.isfile(novo) and os.path.samefile(novo, PASTA + "/saida/%s.mp4" % PECA) and os.stat(novo).st_nlink >= 2
        cod2, out2 = kit("entregar", PECA, "--raiz-final", raiz, "--videos", videos)
        ok = (cod_s == 0 and cod_r == 2 and foto_final == foto_final2 and cod == 0 and aviso_ok and movida_ok
              and videos_ok and novo_ok and cod2 == 0 and "já entregue" in out2)
        self.registra("entregar", ok, "raiz falsa: anterior movida pra _versoes-anteriores/ com o mesmo conteúdo: %s; "
                      "aviso de st_nlink > 1 com o caminho da outra ocorrência: %s; o par em Vídeos falso continua: %s; "
                      "final novo por hardlink (st_nlink %d): %s; de novo: 'já entregue', nada sobrescrito: %s; sem "
                      "--raiz-final: --simula código %d e de verdade código %d (recusado); FINAL real intacto (%d "
                      "entradas iguais): %s"
                      % (movida_ok, aviso_ok, videos_ok, os.stat(novo).st_nlink if os.path.isfile(novo) else 0, novo_ok,
                         cod2 == 0 and "já entregue" in out2, cod_s, cod_r, len(foto_final), foto_final == foto_final2),
                      "anterior em _versoes-anteriores, aviso com o caminho, novo por hardlink, nada sobrescrito; FINAL "
                      "real intocado", {"saida": out[-1500:]})

    # 12. vigia
    def t_vigia(self):
        import vigia
        parcial = PASTA + "/saida/vigia-saida-parcial.mp4"
        escrita.grava_bytes(parcial, b"parcial falsa do teste do vigia", cria_pasta=True)
        limite = escrita.livre_mb() + 100000
        t0 = time.time()
        with silencio():
            cod, info = vigia.roda([comum.PY, "-c", "import time; time.sleep(60)"], saida=parcial, limite_mb=limite)
        dur = time.time() - t0
        vivo = info.get("processo_vivo")
        cod2, info2 = vigia.roda([comum.PY, "-c", "import time; time.sleep(1)"], limite_mb=1)
        ok = (cod == 1 and info.get("abortou") and info["segundos_ate_matar"] <= 4 and not vivo
              and not os.path.exists(parcial) and cod2 == 0 and not info2.get("abortou"))
        self.registra("vigia", ok, "limite %.0f MB (acima do livre): matou em %.2f s (taskkill código %d), processo vivo "
                      "depois: %s, saída falsa apagada: %s, código %d, %.2f s no total; com limite de 1 MB o processo de "
                      "1 s terminou sozinho (código %d)"
                      % (limite, info["segundos_ate_matar"], info["taskkill"]["codigo"], vivo, not os.path.exists(parcial),
                         cod, dur, cod2),
                      "mata em até 4 s, apaga a saída falsa e sai com código 1")

    # 13. limpa
    def t_limpa(self):
        import limpa
        tmp = comum.temp()
        alvo = self.scratch + "/k07-alvo-juncao"
        os.makedirs(alvo, exist_ok=True)
        escrita.grava_texto(alvo + "/sentinela.txt", "não pode ser apagado pelo limpa")
        velha = tmp + "/remotion-k07-teste-velha-%d" % os.getpid()
        os.makedirs(velha)
        escrita.grava_texto(velha + "/x.txt", "velha")
        time.sleep(1.3)
        t0 = time.time()
        nova = tmp + "/remotion-k07-teste-limpa-%d" % os.getpid()
        fora = tmp + "/k07-teste-nao-apagar-%d" % os.getpid()
        os.makedirs(nova + "/sub")
        os.makedirs(fora)
        escrita.grava_texto(nova + "/sub/arquivo.txt", "apagar")
        escrita.grava_texto(fora + "/arquivo.txt", "fica")
        r = subprocess.run(["cmd", "/c", "mklink", "/J", (nova + "/juncao").replace("/", "\\"), alvo.replace("/", "\\")],
                           capture_output=True, text=True)
        juncao_criada = r.returncode == 0
        res = limpa.limpa(desde=t0)
        nova_apagada = not os.path.exists(nova)
        velha_ficou = os.path.isdir(velha)
        fora_ficou = os.path.isdir(fora)
        alvo_intacto = os.path.isfile(alvo + "/sentinela.txt")
        limpa.apaga_arvore(velha)
        shutil.rmtree(fora)
        shutil.rmtree(alvo)
        ok = nova_apagada and velha_ficou and fora_ficou and alvo_intacto and juncao_criada and not res["falhas"]
        self.registra("limpa", ok, "pasta falsa com nome de padrão criada depois do início: apagada (%s); a de antes do "
                      "início ficou (%s); pasta fora do padrão ficou (%s); junção dentro dela apagada como link, o alvo "
                      "fora do Temp intacto (%s); %d apagada(s), %d falha(s)"
                      % (nova_apagada, velha_ficou, fora_ficou, alvo_intacto, len(res["apagadas"]), len(res["falhas"])),
                      "apaga só as pastas de padrão criadas durante o comando, sem seguir link nem sair do Temp")

    # 14. doutor
    def t_doutor(self):
        import ambiente
        with silencio() as buf1:
            rel = ambiente.doutor()
        refs = [i for i in rel.itens if i["nome"].startswith("referência")]
        ok_real = refs and all(i["nivel"] == "ok" for i in refs)
        pasta = self.scratch + "/k07-ref-alterada"
        os.makedirs(pasta, exist_ok=True)
        ref = comum.le_json(GUIA + "/_referencia.json")
        for a in ref["arquivos"]:
            if a.get("copia"):
                a["copia"] = comum.barra(os.path.join(GUIA, a["copia"]))
            if a["id"] == "tela-splash":
                a["md5"] = "0" * 32
        escrita.grava_json(pasta + "/_referencia.json", ref)
        with silencio() as buf2:
            rel2 = ambiente.doutor(referencia=pasta + "/_referencia.json", rapido=True)
        verm = [i for i in rel2.itens if i["nivel"] == "vermelho" and i["nome"].startswith("referência")]
        ok_alt = len(verm) == 1 and "tela-splash" in verm[0]["mensagem"] and "MUDOU" in verm[0]["mensagem"]
        shutil.rmtree(pasta)
        cod, out = kit("doutor", "--rapido")
        ok = ok_real and ok_alt
        self.registra("doutor", ok, "com o REF real: %s; com a cópia alterada (md5 da tela-splash trocado): %d item "
                      "vermelho ('%s'); doutor completo: %d item(ns), %d vermelho(s), %d aviso(s)"
                      % ("; ".join("%s %s" % (i["nome"], i["mensagem"]) for i in refs), len(verm),
                         verm[0]["mensagem"][:120] if verm else "", len(rel.itens), len(rel.vermelhos),
                         sum(1 for i in rel.itens if i["nivel"] == "aviso")),
                      "com o REF real, tudo igual; com a cópia alterada, o aviso vermelho aparece",
                      {"itens": rel.itens})

    # 15. ext-liga e ext-desliga
    def t_ext(self):
        base = self.scratch + "/k07-ext-teste"
        if os.path.isdir(base):
            shutil.rmtree(base)
        os.makedirs(base + "/pasta/sub")
        escrita.grava_bytes(base + "/arquivo-teste.png", b"\x89PNG teste do ext-liga (K07)")
        escrita.grava_texto(base + "/pasta/a.txt", "a")
        escrita.grava_texto(base + "/pasta/sub/b.txt", "b")
        escrita.grava_texto(base + "/pasta/c.json", "{}")
        midia = {"versao": 1, "links": [
            {"origem": base + "/arquivo-teste.png", "destino": "pecas/%s/ext-teste/arquivo-teste.png" % PECA},
            {"origem": base + "/pasta", "destino": "pecas/%s/ext-teste/pasta" % PECA, "padrao": "**/*.txt"}]}
        escrita.grava_json(base + "/midia.json", midia)
        antes = foto_arvore(comum.PUBLIC_KIT)
        cod1, out1 = kit("ext-liga", "teste-k07", "--midia", base + "/midia.json")
        destinos = [comum.PUBLIC_KIT + "/pecas/%s/ext-teste/%s" % (PECA, r) for r in
                    ("arquivo-teste.png", "pasta/a.txt", "pasta/sub/b.txt")]
        ligados = [os.path.isfile(d) and os.stat(d).st_nlink >= 2 for d in destinos]
        json_fora = not os.path.exists(comum.PUBLIC_KIT + "/pecas/%s/ext-teste/pasta/c.json" % PECA)
        cod2, out2 = kit("ext-desliga", "teste-k07", "--midia", base + "/midia.json")
        depois = foto_arvore(comum.PUBLIC_KIT)
        origens = all(os.path.isfile(p) and os.stat(p).st_nlink == 1 for p in
                      (base + "/arquivo-teste.png", base + "/pasta/a.txt", base + "/pasta/sub/b.txt"))
        shutil.rmtree(base)
        ok = cod1 == 0 and all(ligados) and json_fora and cod2 == 0 and antes == depois and origens
        self.registra("ext", ok, "ext-liga: %d de 3 arquivos ligados (st_nlink >= 2), o .json fora do padrão ficou fora: "
                      "%s; ext-desliga: public-kit igual ao de antes (%d entradas): %s; origens intactas (st_nlink 1): %s"
                      % (sum(ligados), json_fora, len(antes), antes == depois, origens),
                      "liga e desliga pelo midia.json de teste e o public-kit volta ao estado de antes")

    # provas a mais
    def t_ajuda_simula(self):
        cod, out = kit("--help")
        nomes = ["doutor", "nova", "palavras", "batidas", "trilhas", "telas", "voz-prepara", "voz-recebe", "voz-alinha",
                 "voz-monta", "props", "eventos", "fatos", "qc", "mix", "stills", "previa", "capa", "render", "juncao",
                 "confere", "final", "entregar", "ext-liga", "ext-desliga", "limpa", "audd"]
        faltam = [n for n in nomes if ("    " + n) not in out]
        cod2, sim = kit("final", PECA, "--simula")
        esperado = ('npx remotion render src/index.ts KitMotion "%s/saida/%s-mudo.mp4" --props="%s/props.json" '
                    '--public-dir=public-kit --binaries-directory="C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/'
                    'precificacao-2026-10-02/remotion/bin" --browser-executable="C:/Users/EDIT-ADMIN/AppData/Local/'
                    'ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe" '
                    '--gl=angle --concurrency=3 --crf=15 --x264-preset=slow --muted --color-space=bt709' % (PASTA, PECA, PASTA))
        ordem = [sim.find("== %s" % e) for e in ("props", "eventos", "fatos", "qc", "mix", "stills", "render", "junção",
                                                  "conferência", "limpa")]
        em_ordem = all(x >= 0 for x in ordem) and ordem == sorted(ordem)
        tem_cmd = esperado in sim
        sem_thread = "thread" not in sim.lower()
        ok = cod == 0 and not faltam and cod2 == 0 and em_ordem and tem_cmd and sem_thread
        self.registra("ajuda e simula", ok, "--help lista os %d comandos da seção 7.1 (faltam: %s); final --simula: "
                      "etapas na ordem com fatos antes do render: %s; comando de render exato da seção 7.4: %s; sem opção "
                      "de thread: %s" % (len(nomes), ", ".join(faltam) or "nenhum", em_ordem, tem_cmd, sem_thread),
                      "--help com todos os comandos; final --simula com a sequência completa e o render exato")

    def t_aspas_cmd(self):
        cmd = self.scratch + "/k07-mostra-args.cmd"
        # o npx.cmd repassa os argumentos com %* pro npx-cli.js, como este .cmd (o -- separa as opções do node)
        escrita.grava_texto(cmd, "@node -e \"console.log(JSON.stringify(process.argv.slice(1)))\" -- %*\n")
        args = ["--props=C:/MKT-INSTA/Content Legalizai/marketing/x.json", "C:/pasta com espaço/saida-mudo.mp4",
                "--binaries-directory=C:/MKT-INSTA/Content Legalizai/remotion/bin", "--gl=angle"]
        r = subprocess.run([cmd] + args, capture_output=True, text=True, encoding="utf-8", errors="replace")
        os.remove(cmd)
        try:
            chegou = json.loads(r.stdout.strip().splitlines()[-1])
        except (ValueError, IndexError):
            chegou = None
        ok = chegou == args
        self.registra("aspas no .cmd", ok, "argumentos com espaço e '=' passados por um .cmd (o caminho do npx.cmd do "
                      "render) chegam iguais ao node: %s" % ok, "os 4 argumentos chegam inteiros", {"chegou": chegou})

    def t_extensoes_node(self):
        pasta = self.scratch + "/k07-ext-node"
        if os.path.isdir(pasta):
            shutil.rmtree(pasta)
        os.makedirs(pasta + "/boa")
        os.makedirs(pasta + "/quebrada")
        boa = (
            "import gsap from \"gsap\";\n"
            "import { CustomEase } from \"gsap/CustomEase\";\n"
            "// extensão de teste do K07: usa o gsap e o CustomEase do núcleo (uma instância só)\n"
            "if (!CustomEase.get(\"kitTesteK07\")) CustomEase.create(\"kitTesteK07\", \"M0,0 C0.3,0 0.7,1 1,1\");\n"
            "export const batidas = {\n"
            "  \"teste-k07\": {\n"
            "    id: \"teste-k07\", camada: \"2d\", descricao: \"batida de teste do K07\", ancoras: [\"inicio\"],\n"
            "    padrao: { t: 1.5, camada: \"selo-teste\" },\n"
            "    sons: { v2: [{ som: \"sint-s_swish\", em: \"inicio\", desloc: 0, ganhoDb: -30, args: [0.2] }] },\n"
            "    aplica(tl, st, p, ctx) {\n"
            "      const t = ctx.t(p.t);\n"
            "      tl.to(st.canais[p.camada], { op: 1, duration: 0.3, ease: \"kitTesteK07\" }, t);\n"
            "      ctx.som({ inicio: t });\n"
            "      ctx.publica(\"easeTeste\", gsap.parseEase(\"kitTesteK07\") ? \"ok\" : \"falta\");\n"
            "    },\n"
            "  },\n"
            "};\n"
            "export const camadas = { \"selo-teste\": { descricao: \"camada de teste\", params: {}, canais: [\"op\"] } };\n")
        escrita.grava_texto(pasta + "/boa/batidas.ts", boa)
        escrita.grava_texto(pasta + "/quebrada/batidas.ts", "export const batidas = { quebrada: ;\n")
        env = {"KIT_EXT_DIR": pasta}
        cod, out = no("batidas.mjs", "--json", env=env)
        j = json.loads(out[out.find("{"):out.rfind("}") + 1]) if "{" in out else {}
        exts = {e["nome"]: e for e in j.get("extensoes", [])}
        boa_ok = exts.get("boa", {}).get("ok") and "teste-k07" in [b["id"] for b in j.get("batidas", [])]
        quebrada_off = exts.get("quebrada") is not None and not exts["quebrada"]["ok"] and any(
            "EXT_ERRO quebrada" in a for a in j.get("avisos", []))
        # uma peça no scratchpad que usa a batida e a camada da extensão boa; o nome com "_" é de peça de teste (desde
        # 03/10 a Talent in the Air, a trilha da cena do guia, só passa no 14/10 ou em peça de teste)
        peca = pasta + "/_peca-ext"
        os.makedirs(peca + "/voz")
        cena = comum.le_json(PASTA + "/cenas.json")
        cena["peca"] = "_peca-ext"
        cena["camadas"] = [{"id": "selo", "tipo": "selo-teste", "estado": {"op": 0}}]
        cena["batidas"].append({"id": "teste-k07", "params": {"t": 1.5, "camada": "selo"}})
        escrita.grava_json(peca + "/cenas.json", cena)
        escrita.copia(PASTA + "/voz/narracao.json", peca + "/voz/narracao.json")
        c1, o1 = no("props.mjs", peca, env=env)
        c2, o2 = no("eventos.mjs", peca, env=env)
        evs = comum.le_json(peca + "/eventos.json")["eventos"] if c2 == 0 else []
        som_ext = [e for e in evs if str(e["origem"]).startswith("teste-k07")]
        cena2 = dict(cena, batidas=cena["batidas"] + [{"id": "quebrada"}])
        escrita.grava_json(peca + "/cenas-pede-quebrada.json", cena2)
        c3, o3 = no("props.mjs", peca, "--cena", "cenas-pede-quebrada.json", env=env)
        msg_desligada = "extensão desligada por erro" in o3
        c4, o4 = no("props.mjs", peca)  # sem a extensão: a camada não é conhecida
        sem_ext_erro = c4 == 1 and "camada de tipo desconhecido" in o4
        shutil.rmtree(pasta)
        ok = cod == 0 and boa_ok and quebrada_off and c1 == 0 and c2 == 0 and len(som_ext) == 1 and abs(
            som_ext[0]["t"] - 1.5) < 1e-9 and c3 == 1 and msg_desligada and sem_ext_erro
        self.registra("extensões node", ok, "extensão boa ligada (batida e camada no registro): %s; quebrada desligada com "
                      "EXT_ERRO: %s; peça com a camada e a batida da extensão: props código %d, eventos código %d, som da "
                      "extensão em t = %s; cena que pede a batida da quebrada: código %d com o aviso da extensão "
                      "desligada: %s; sem a extensão a camada é recusada: %s"
                      % (boa_ok, quebrada_off, c1, c2, som_ext[0]["t"] if som_ext else None, c3, msg_desligada,
                         sem_ext_erro),
                      "cada extensão carrega isolada; a que quebra fica desligada e só a peça que pede algo dela falha")

    def t_nova(self):
        base = self.scratch + "/k07-nova"
        if os.path.isdir(base):
            shutil.rmtree(base)
        os.makedirs(base)
        alvo = base + "/2026-10-30-teste-nova"
        cod, out = kit("nova", alvo)
        cena = comum.le_json(alvo + "/cenas.json") if cod == 0 else {}
        ok_arqs = all(os.path.exists(alvo + "/" + r) for r in ("cenas.json", "roteiro.md", "telas/receitas/_modelo.json",
                                                               "voz"))
        ok_cena = cena.get("peca") == "2026-10-30-teste-nova" and cena.get("dataPost") == "2026-10-30"
        cod2, out2 = kit("nova", alvo)
        shutil.rmtree(base)
        ok = cod == 0 and ok_arqs and ok_cena and cod2 == 2
        self.registra("nova", ok, "peça criada com cenas.json (peca e dataPost trocados: %s), roteiro.md e "
                      "telas/receitas/_modelo.json: %s; de novo na mesma pasta: código %d (recusa)" % (ok_cena, ok_arqs, cod2),
                      "cria a pasta da peça dos modelos e nunca grava por cima")

    def t_cena_sufixo(self):
        cod, out = kit("qc", PECA, "--cena", "cenas-fatos-erro.json")
        arqs = [PASTA + "/props-fatos-erro.json", PASTA + "/qc/quadros-fatos-erro.json", PASTA + "/qc/legenda-fatos-erro.json",
                PASTA + "/qc/fatos-fatos-erro.json"]
        ok = cod == 0 and all(os.path.isfile(a) for a in arqs)
        cod2, out2 = kit("palavras", PECA)
        ok = ok and cod2 == 0 and "chave da frase" in out2
        cod3, out3 = kit("voz-monta", PECA)
        ok = ok and cod3 == 0
        self.registra("--cena e outros", ok, "--cena cenas-fatos-erro.json grava com o sufixo -fatos-erro (props, "
                      "qc/quadros, qc/legenda, qc/fatos): %s; palavras: código %d; voz-monta com fecho embutido: código %d "
                      "(só relata)" % (all(os.path.isfile(a) for a in arqs), cod2, cod3),
                      "sufixo da cena nas saídas; comandos de leitura funcionam")

    def t_caminho_kit(self):
        """Ensaio do caminho da rodada 2 do K12 na peça de teste: voz-alinha --sem-refino pelo kit.py, cena no molde da
        cenas-kit.json (narração realinhada, telas por peça no public-kit e regiões do telas/regioes.json)."""
        saida_narr = "voz/narracao-kit-teste.json"
        args = ["voz-alinha", PECA, "--saida", saida_narr, "--sem-refino"]
        if os.path.isfile(PASTA + "/" + saida_narr):
            args.append("--forca")
        cod_v, out_v = kit(*args)
        n = comum.le_json(PASTA + "/" + saida_narr) if cod_v == 0 else {}
        cena = comum.le_json(GUIA + "/cenas-kit.json")
        cena["peca"] = PECA
        cena["titulo"] = TITULO_TESTE
        cena["narracao"] = saida_narr
        cena["voz"] = dict(cena["voz"], arquivo="voz/narr-dylan.wav")
        for k, tl in cena["telas"].items():
            tl["arquivo"] = tl["arquivo"].replace("pecas/guia-pronta-2026-10-14/", "pecas/%s/" % PECA)
        cena["notas"] = "Ensaio do K07 do caminho da cenas-kit.json (rodada 2 do K12) na peça de teste."
        escrita.grava_json(PASTA + "/cenas-kit-teste.json", cena)
        c1, o1 = kit("props", PECA, "--cena", "cenas-kit-teste.json")
        c2, o2 = kit("eventos", PECA, "--cena", "cenas-kit-teste.json")
        c3, o3 = kit("qc", PECA, "--cena", "cenas-kit-teste.json")
        props = comum.le_json(PASTA + "/props-kit-teste.json") if c1 == 0 else {}
        evs = comum.le_json(PASTA + "/eventos-kit-teste.json")["eventos"] if c2 == 0 else []
        dts = [abs(e["t"] - TABELA_6[i][1]) for i, e in enumerate(evs) if i < len(TABELA_6)]
        mesma_ordem = [e["som"] for e in evs] == [r[2] for r in TABELA_6]
        leg = comum.le_json(PASTA + "/qc/legenda-kit-teste.json") if os.path.isfile(PASTA + "/qc/legenda-kit-teste.json") else {}
        fm = (leg.get("folgaMinima") or {})
        ok = (cod_v == 0 and len(n.get("words", [])) == 50 and c1 == 0 and c2 == 0 and len(evs) == 35 and mesma_ordem
              and max(dts) <= 0.08 and abs(props.get("tFecho", 0) - 15.0) <= 0.05)
        self.registra("caminho kit", ok, "voz-alinha --sem-refino pelo kit.py: código %d, %d palavras, tFecho %s; props e "
                      "eventos com a cena no molde da cenas-kit (telas da peça no public-kit, regiões do arquivo): códigos "
                      "%d e %d, %d eventos na mesma ordem e sons, maior |dt| %.3f s, tFecho %.2f; qc: código %d, %d "
                      "quadro(s) com invasão, folga mínima %.2f px cheia e %.2f px na transição"
                      % (cod_v, len(n.get("words", [])), n.get("tFecho"), c1, c2, len(evs), max(dts) if dts else -1,
                         props.get("tFecho", -1), c3, len(leg.get("quadrosComInvasao") or []),
                         (fm.get("cheia") or {}).get("folga", 0), (fm.get("transicao") or {}).get("folga", 0)),
                      "0 erro; 35 eventos com |dt| <= 0,08 s; tFecho 15,00 +- 0,05 (o qc só registra)")

    def t_simulas(self):
        """Os comandos que gastam disco ou rede, só em --simula, e os de leitura de verdade."""
        checks = {}
        cod, out = kit("previa", PECA, "--simula")
        checks["previa --simula (props, eventos, fatos, qc, mix, stills, folha)"] = cod == 0 and all(
            x in out for x in ("props.mjs", "eventos.mjs", "fatos.py", "quadros.mjs", "mixa.py", "stills.mjs", "folha.py"))
        cod, out = kit("stills", PECA, "--quadros", "0,135", "--composicoes", "KitMotion,GuiaPronta", "--lote", "10",
                       "--apaga", "--simula")
        checks["stills KitMotion e GuiaPronta no mesmo bundle"] = cod == 0 and "KitMotion, GuiaPronta nos quadros 0, 135" in out
        cod, out = kit("render", PECA, "--trecho", "9.0:10.5", "--simula")
        checks["render --trecho 9.0:10.5 dá --frames=270-314"] = cod == 0 and "--frames=270-314" in out and "-trecho-270-314-mudo.mp4" in out
        cod, out = kit("audd", "--simula")
        checks["audd --simula"] = cod == 0 and "audd.py" in out and "--proximo-lote" in out
        cod, out = kit("voz-alinha", PECA, "--cena", "cenas.json", "--wav", "voz/narr-dylan.wav", "--saida",
                       "voz/narracao-teste.json", "--simula")
        checks["voz-alinha repassa --wav e --saida no PYW"] = cod == 0 and comum.PYW in out and "--saida" in out and "--wav" in out
        cod, out = kit("batidas")
        # com as extensões (abertura, precificacao e as de peça) o total passa de 13; o núcleo continua com 13
        checks["batidas (13 do núcleo)"] = cod == 0 and "(13 do núcleo)" in out
        cod, out = kit("trilhas", "--status", "liberado")
        checks["trilhas --status liberado"] = cod == 0 and "mixkit-04-house-one" in out
        ok = all(checks.values())
        self.registra("simulas e leitura", ok, "; ".join("%s: %s" % (k, "ok" if v else "FALHOU") for k, v in checks.items()),
                      "os comandos aparecem com os argumentos certos, sem gastar disco nem rede")

    # ---------- limpeza ----------
    def limpa_raiz_falsa(self):
        """A raiz falsa e o Vídeos falso (com hardlinks do final de teste): saem primeiro."""
        apagados = []
        for p in (self.scratch + "/final-falso", self.scratch + "/videos-falso"):
            if os.path.isdir(p):
                shutil.rmtree(p)
                apagados.append((p, None))
        return apagados

    def limpa_fim(self):
        apagados = self.limpa_raiz_falsa()
        for rel in ("saida/%s.mp4" % PECA, "audio/mix.wav", "saida/capa.png", "saida/folha.jpg"):
            p = PASTA + "/" + rel
            if os.path.isfile(p):
                if os.stat(p).st_nlink == 1:
                    apagados.append(("_teste-saida/" + rel, os.path.getsize(p)))
                    os.remove(p)
                else:
                    apagados.append(("NÃO apagado (hardlink): _teste-saida/" + rel, None))
        pk = comum.PUBLIC_KIT + "/pecas/" + PECA
        if os.path.isdir(pk):
            for r, _d, arqs in os.walk(pk):
                for a in arqs:
                    p = os.path.join(r, a)
                    apagados.append(("public-kit/" + comum.barra(os.path.relpath(p, comum.PUBLIC_KIT)), os.path.getsize(p)))
            shutil.rmtree(pk)
        return apagados


ORDEM = ["props", "eventos", "fatos", "mix", "qc", "telas", "caminho_kit", "juncao", "juncao_fracao", "confere", "capa",
         "entregar", "vigia", "limpa", "doutor", "ext", "ajuda_simula", "aspas_cmd", "extensoes_node", "nova", "cena_sufixo",
         "simulas"]


def main(argv=None):
    comum.utf8()
    ap = argparse.ArgumentParser(prog="testa_saida.py", description="Testes do script de saída (K07), sem render.")
    ap.add_argument("--prepara", action="store_true", help="só monta a peça de teste")
    ap.add_argument("--so", help="só estes testes (separados por vírgula)")
    ap.add_argument("--scratch", default=SCRATCH_PADRAO, help="pasta de rascunho pra raiz falsa e arquivos de teste")
    ap.add_argument("--mantem", action="store_true", help="não apaga os arquivos grandes nem os links no fim")
    a = ap.parse_args(argv)
    feitos = prepara()
    print("peça de teste: %s (%s)" % (PASTA, ", ".join(feitos) if feitos else "nada mudou"))
    if a.prepara:
        return 0
    escrita.exige_disco(comum.DISCO_RENDER_MB + 15, "os testes do K07 (a junção grava 9 MB)")
    t = Testes(a.scratch)
    t.limpa_raiz_falsa()  # sobra de uma rodada com --mantem: o final ligado lá impediria a junção (hardlink)
    so = [x.strip() for x in a.so.split(",")] if a.so else ORDEM
    inicio = datetime.datetime.now()
    disco0 = escrita.livre_mb()
    for nome in ORDEM:
        if nome not in so:
            continue
        try:
            getattr(t, "t_" + nome)()
        except Exception as e:  # noqa: BLE001
            t.registra(nome, False, "erro no teste: %s: %s" % (type(e).__name__, e), "rodar sem erro")
    apagados = [] if a.mantem else t.limpa_fim()
    doc = {"versao": 1, "pacote": "K07", "inicio": inicio.isoformat(timespec="seconds"),
           "fim": datetime.datetime.now().isoformat(timespec="seconds"), "discoInicialMb": round(disco0),
           "discoFinalMb": round(escrita.livre_mb()), "testes": t.res, "passaram": sum(1 for r in t.res if r["ok"]),
           "total": len(t.res), "apagadosNoFim": apagados}
    escrita.grava_json(PASTA + "/resultado-testes.json", doc)
    print("\n%d de %d testes passaram; resultado em %s/resultado-testes.json; disco %d -> %d MB"
          % (doc["passaram"], doc["total"], PASTA, doc["discoInicialMb"], doc["discoFinalMb"]))
    for x in apagados:
        print("  apagado no fim: %s%s" % (x[0], (" (%d bytes)" % x[1]) if x[1] else ""))
    return 0 if doc["passaram"] == doc["total"] else 1


if __name__ == "__main__":
    sys.exit(main())
