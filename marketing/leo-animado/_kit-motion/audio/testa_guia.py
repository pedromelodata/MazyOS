"""Prova do mixador do kit contra o GP/audio/mix-guia.wav e as outras conferências do pacote K05.

Contrato: KIT/DESENHO.md, seções 6 e 11 (rodada 1, passo 5).

Uso (sempre com python -B):
  python -B testa_guia.py [--pasta <pasta de teste>] [--guarda] [--registra] [--so-guia]

Sem --pasta, a pasta de teste é um temporário no Temp, apagado no fim. Os WAV de teste são apagados no fim (menos
com --guarda); os JSON ficam na pasta de teste. --registra grava o resultado também em
_regressao/resultado-testa-guia.json, ao lado da fixture. Nada é gravado em GP/ nem em RM/public-guia/.

Provas:
  1. guia bit a bit: o mixa.py com _regressao/eventos-guia-v2.json, voz GP/vo/narr-dylan.wav, trilha
     mixkit-01-talent-in-the-air a partir de 5,448 s a -9,0 dB e 18 s, contra o GP/audio/mix-guia.wav, amostra a
     amostra (int16). Se diferir, o resultado aponta o evento que cobre as amostras diferentes (limite: 1 LSB).
  2. comando do 2867: o decode do evento mixkit-2867 (transpor ausente, 0 e 'trilha' com a Talent) contra o
     carrega() do próprio GP/mix_guia.py, lido pela árvore do Python e executado com um subprocess falso.
  3. por-evento: duas rodadas do mixa.py com semente por evento dão o mesmo md5.
  4. estabilidade: no modo por-evento, um efeito a mais no começo da lista não muda os outros sons (no legado muda).
  5. sincronia: pixabay-405445 com ancora 'sincronia' em t = 1,0 tem o pico em 1,000 ± 0,005 s (no relatório, na
     trilha de efeitos e no arquivo final, onde a posição sai da correlação com o próprio efeito).
  6. assinaturas: os 4 WAV existem, 48 kHz, mono, 16 bits e menos de 150 KB.
  7. limpeza: PR/src/__pycache__ igual ao do começo, nenhum __pycache__ novo e zero travessão em KIT/audio.
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import ast  # noqa: E402
import copy  # noqa: E402
import datetime  # noqa: E402
import json  # noqa: E402
import os  # noqa: E402
import shutil  # noqa: E402
import subprocess  # noqa: E402
import tempfile  # noqa: E402
import wave  # noqa: E402
import zlib  # noqa: E402

import numpy as np  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
KIT_PADRAO = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion"
KIT = os.path.dirname(AQUI) if os.path.isfile(os.path.join(os.path.dirname(AQUI), "catalogos", "catalogo.py")) \
    else KIT_PADRAO
for _p in (os.path.join(KIT, "catalogos"), os.path.join(KIT, "lib"), AQUI):
    if _p not in sys.path:
        sys.path.insert(0, _p)

import escrita  # noqa: E402

LEO = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado"
GP = LEO + "/guia-pronta-2026-10-14"
PR_SRC = LEO + "/precificacao-2026-10-02/src"
MIX_GUIA = GP + "/audio/mix-guia.wav"
MIX_GUIA_PY = GP + "/mix_guia.py"
VOZ_GUIA = GP + "/vo/narr-dylan.wav"
FIXTURE = os.path.join(AQUI, "_regressao", "eventos-guia-v2.json")
MIXA = os.path.join(AQUI, "mixa.py")
ASSINATURAS = os.path.join(AQUI, "assinatura")
SR = 48000
MD5_MIX_GUIA_REF = "80dd068e3dde76d25812766e54cf7d18"  # o do REF (KIT/pecas/guia-pronta-2026-10-14/_referencia.json)

PROPS_GUIA = {
    "versao": 1,
    # peça de teste (nome com "_"): desde 03/10 a Talent in the Air só passa na peça da decisão do catálogo
    # (guia-pronta-2026-10-14) ou, com aviso, em peça de teste (catalogo.confere_trilha)
    "peca": "_teste-guia-k05",
    "duracao": 18.0,
    "voz": {"arquivo": VOZ_GUIA, "fecho": "embutido", "final": None},
    "trilha": {"id": "mixkit-01-talent-in-the-air", "mStart": 5.448, "ganhoDb": -9.0, "transporVerificado": 0,
               "status": "aceito-com-risco",
               "decisaoRisco": "Pedro, 02/10/2026: trilha da V2 mesmo relançada por terceiro; só na peça de 14/10",
               "abaixamento": 0.55, "fadeIn": 0.03, "fadeOut": 0.5},
    "sons": {"perfil": "v2", "modoRuido": "legado", "extras": [], "remover": []},
}


def br(x, casas=2):
    return (("%." + str(casas) + "f") % x).replace(".", ",")


def md5_arquivo(c):
    return escrita.md5(c)


def le_wav(c):
    with wave.open(c, "rb") as w:
        info = {"canais": w.getnchannels(), "sr": w.getframerate(), "bits": 8 * w.getsampwidth(),
                "amostras": w.getnframes()}
        q = np.frombuffer(w.readframes(w.getnframes()), "<i2").reshape(-1, w.getnchannels())
    return q, info


def roda_mixa(pasta, props, eventos, saida, extra=()):
    cmd = [sys.executable, "-B", MIXA, pasta, "--props", props, "--eventos", eventos, "--saida", saida] + list(extra)
    amb = dict(os.environ, PYTHONDONTWRITEBYTECODE="1", PYTHONIOENCODING="utf-8")
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", env=amb)
    return r.returncode, (r.stdout + r.stderr).strip()


# ---------------------------------------------------------------------------------------------------------------
# 1. guia bit a bit
# ---------------------------------------------------------------------------------------------------------------

def responsaveis(dif_idx, rel, n_max=12):
    """Agrupa as amostras diferentes em trechos e lista os eventos (e tiques) que cobrem cada trecho."""
    if dif_idx.size == 0:
        return []
    cortes = np.nonzero(np.diff(dif_idx) > 480)[0]
    inicios = np.concatenate([[0], cortes + 1])
    fins = np.concatenate([cortes, [dif_idx.size - 1]])
    vaos = []
    for ev in rel.get("eventos", []):
        partes = ev.get("tiques") or [ev]
        for p in partes:
            if "amostra" in p and "fora" not in p:
                a = max(0, p["amostra"])
                vaos.append((a, a + int(round(p["duracao"] * SR)), ev.get("ordem"), ev.get("som"), ev.get("origem")))
    out = []
    for a, b in list(zip(inicios, fins))[:n_max]:
        i0, i1 = int(dif_idx[a]), int(dif_idx[b])
        quem = sorted({(o, s, g) for (x0, x1, o, s, g) in vaos if x0 <= i1 and x1 > i0}, key=lambda x: x[0])
        out.append({"de_s": round(i0 / SR, 6), "ate_s": round(i1 / SR, 6), "amostras": int(b - a + 1),
                    "eventos": [{"ordem": o, "som": s, "origem": g} for o, s, g in quem] or
                    ["nenhum efeito cobre o trecho: voz, trilha ou loudnorm"]})
    return out


def prova_guia(pasta, res):
    props = os.path.join(pasta, "props-guia.json")
    escrita.grava_json(props, PROPS_GUIA)
    saida = os.path.join(pasta, "audio", "mix-guia-kit.wav")
    cod, txt = roda_mixa(pasta, props, FIXTURE, saida, ["--relatorio"])
    p = {"prova": "guia bit a bit", "passou": False, "saidaMixa": txt.splitlines()[:12]}
    res["provas"].append(p)
    if cod != 0:
        p["detalhe"] = "o mixa.py falhou (código %d)" % cod
        return None
    with open(os.path.splitext(saida)[0] + ".json", encoding="utf-8") as f:
        rel = json.load(f)
    a, ia = le_wav(saida)
    b, ib = le_wav(MIX_GUIA)
    p.update({"kit": {"arquivo": saida, "md5": md5_arquivo(saida), "tamanho": os.path.getsize(saida), **ia},
              "referencia": {"arquivo": MIX_GUIA, "md5": md5_arquivo(MIX_GUIA), "tamanho": os.path.getsize(MIX_GUIA),
                             "md5DoRef": MD5_MIX_GUIA_REF, **ib},
              "loudnorm": rel["loudnorm"]})
    if a.shape != b.shape:
        p["detalhe"] = "formas diferentes: kit %s, referência %s" % (a.shape, b.shape)
        return rel
    d = np.abs(a.astype(np.int32) - b.astype(np.int32))
    n_dif = int(np.count_nonzero(d))
    p.update({"amostrasComparadas": int(a.size), "amostrasDiferentes": n_dif, "diferencaMaxLsb": int(d.max()),
              "iguaisAmostraAAmostra": n_dif == 0, "iguaisByteAByte": p["kit"]["md5"] == p["referencia"]["md5"]})
    if n_dif:
        idx = np.nonzero(d.max(axis=1))[0]
        p["responsaveis"] = responsaveis(idx, rel)
    p["passou"] = n_dif == 0 or int(d.max()) <= 1
    p["detalhe"] = ("int16 idênticos (%d amostras por canal)%s" % (a.shape[0], ", e o arquivo é igual byte a byte"
                                                                    if p["iguaisByteAByte"] else "")
                    if n_dif == 0 else "%d amostras diferentes, no máximo %d LSB" % (n_dif, int(d.max())))
    return rel


# ---------------------------------------------------------------------------------------------------------------
# 2. comando do 2867
# ---------------------------------------------------------------------------------------------------------------

def comando_do_mix_guia():
    """Executa o carrega() e o mk() do GP/mix_guia.py (lidos pela árvore do Python) com um subprocess falso e devolve
    o comando que o mix_guia.py usa pro 2867 do perfil v2. Nada do mix_guia.py roda além dessas duas funções."""
    with open(MIX_GUIA_PY, encoding="utf-8") as f:
        arvore = ast.parse(f.read(), MIX_GUIA_PY)
    nos, nome_2867 = [], None
    for no in arvore.body:
        if isinstance(no, ast.Assign) and any(isinstance(t, ast.Name) and t.id in ("EXT", "MIX") for t in no.targets):
            nos.append(no)
        elif isinstance(no, ast.FunctionDef) and no.name in ("carrega", "mk"):
            nos.append(no)
        elif isinstance(no, ast.If):
            teste = no.test
            if isinstance(teste, ast.Compare) and isinstance(teste.left, ast.Name) and teste.left.id == "EFEITOS" \
                    and any(isinstance(c, ast.Constant) and c.value == "v2" for c in teste.comparators):
                for sub in ast.walk(ast.Module(body=no.body, type_ignores=[])):
                    if isinstance(sub, ast.Call) and isinstance(sub.func, ast.Name) and sub.func.id == "mk" and \
                            sub.args and isinstance(sub.args[0], ast.Constant) and "2867" in str(sub.args[0].value):
                        nome_2867 = sub.args[0].value
    if nome_2867 is None:
        raise RuntimeError("não achei o mk(...2867...) do perfil v2 no mix_guia.py")
    registro = []

    class _Resultado:
        stdout = b""

    class _SubprocessFalso:
        @staticmethod
        def run(cmd, **kw):
            registro.append(list(cmd))
            return _Resultado()

    ns = {"os": os, "np": np, "SR": SR, "subprocess": _SubprocessFalso}
    exec(compile(ast.Module(body=nos, type_ignores=[]), MIX_GUIA_PY, "exec"), ns)
    ns["mk"](nome_2867)
    return registro[0], nome_2867


def decodifica(cmd):
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)


def prova_2867(rel, res):
    import mixa
    p = {"prova": "comando de decode do 2867 (transpor 0)", "passou": False}
    res["provas"].append(p)
    cmd_orig, nome = comando_do_mix_guia()
    efeitos, trilhas = mixa.carrega_catalogos()
    item = efeitos["mixkit-2867"]
    ev_rel = next((e for e in (rel or {}).get("eventos", []) if e.get("som") == "mixkit-2867"), None)
    cmd_fixture = ev_rel.get("comando") if ev_rel else None
    base = {"t": 10.42, "som": "mixkit-2867", "ganhoDb": -26}
    props = {"trilha": {"id": "mixkit-01-talent-in-the-air", "transporVerificado": 0}}
    tal = trilhas["mixkit-01-talent-in-the-air"]
    variantes = {
        "sem transpor": mixa.comando_evento(base, item, props, tal),
        "transpor 0": mixa.comando_evento(dict(base, transpor=0), item, props, tal),
        "transpor 'trilha' com a Talent (transporVerificado 0)": mixa.comando_evento(dict(base, transpor="trilha"),
                                                                                      item, props, tal),
    }
    contraste = mixa.comando_evento(dict(base, transpor=1), item, props, tal)
    so_caminho = lambda c: c[:4] + c[5:]  # noqa: E731
    iguais_menos_caminho = all(so_caminho(c) == so_caminho(cmd_orig) for c in variantes.values())
    mesmas = all(c == variantes["sem transpor"] for c in variantes.values())
    md5_kit, md5_orig = md5_arquivo(item["arquivo"]), md5_arquivo(cmd_orig[4])
    sinal_igual = bool(np.array_equal(decodifica(variantes["transpor 0"]), decodifica(cmd_orig)))
    copia = efeitos.get("mixkit-2867-copia")
    cmd_copia = mixa.comando_evento(base, copia, props, tal) if copia else None
    copia_igual = bool(cmd_copia) and so_caminho(cmd_copia) == so_caminho(cmd_orig) and \
        os.path.normcase(os.path.normpath(cmd_copia[4])) == os.path.normcase(os.path.normpath(cmd_orig[4]))
    p.update({
        "comandoMixGuia": cmd_orig, "chamadaNoMixGuia": "mk(%r), perfil v2" % nome,
        "comandoKitNaFixture": cmd_fixture, "comandosKit": variantes,
        "contrasteTranspor1": contraste,
        "argumentosIguaisMenosOCaminho": iguais_menos_caminho,
        "transpor0IgualAoSemTranspor": mesmas,
        "fixtureIgualAoComandoDoKit": cmd_fixture == variantes["sem transpor"],
        "md5Entradas": {"kit (catálogo mixkit-2867)": md5_kit, "mix_guia.py (mixkit/sfx)": md5_orig},
        "sinalDecodificadoIdentico": sinal_igual,
        "comandoComMixkit2867Copia": cmd_copia,
        "copiaEMesmoComandoDoMixGuia": copia_igual,
    })
    p["passou"] = iguais_menos_caminho and mesmas and md5_kit == md5_orig and sinal_igual and \
        p["fixtureIgualAoComandoDoKit"] and "-af" not in variantes["transpor 0"]
    p["detalhe"] = ("o mesmo comando do carrega() do mix_guia.py, sem -af; só o caminho de entrada muda (o catálogo "
                    "aponta pro musica-v2/sfx, mesmo md5 %s da cópia que o mix_guia.py lê; sinal decodificado "
                    "idêntico). Com o mixkit-2867-copia o comando é o do mix_guia.py (só muda a barra do caminho)"
                    % md5_kit)


# ---------------------------------------------------------------------------------------------------------------
# 3 e 4. modo por-evento
# ---------------------------------------------------------------------------------------------------------------

def eventos_por_evento():
    with open(FIXTURE, encoding="utf-8") as f:
        doc = json.load(f)
    doc = copy.deepcopy(doc)
    doc["modoRuido"] = "por-evento"
    doc["notas"] = "cópia de teste da fixture no modo por-evento (semente = crc32 da origem)"
    for ev in doc["eventos"]:
        ev["semente"] = zlib.crc32(ev["origem"].encode("utf-8")) & 0xFFFFFFFF
    return doc


def prova_por_evento(pasta, res, md5_legado):
    p = {"prova": "por-evento: duas rodadas, mesmo md5", "passou": False}
    res["provas"].append(p)
    doc = eventos_por_evento()
    cev = os.path.join(pasta, "eventos-por-evento.json")
    escrita.grava_json(cev, doc)
    props = copy.deepcopy(PROPS_GUIA)
    props["sons"]["modoRuido"] = "por-evento"
    cpr = os.path.join(pasta, "props-por-evento.json")
    escrita.grava_json(cpr, props)
    md5s = []
    for k in (1, 2):
        saida = os.path.join(pasta, "audio", "mix-por-evento-%d.wav" % k)
        cod, txt = roda_mixa(pasta, cpr, cev, saida)
        if cod != 0:
            p["detalhe"] = "o mixa.py falhou na rodada %d: %s" % (k, txt[-300:])
            return
        md5s.append(md5_arquivo(saida))
    p.update({"md5Rodada1": md5s[0], "md5Rodada2": md5s[1], "md5Legado": md5_legado,
              "diferenteDoLegado": md5s[0] != md5_legado})
    p["passou"] = md5s[0] == md5s[1]
    p["detalhe"] = ("as duas rodadas dão %s; o legado dá %s (as sementes mudam o ruído, como esperado)"
                    % (md5s[0], md5_legado))


def prova_estabilidade(res):
    import mixa
    p = {"prova": "estabilidade por evento (um efeito a mais não muda os outros)", "passou": False}
    res["provas"].append(p)
    efeitos, _ = mixa.carrega_catalogos()
    doc = eventos_por_evento()
    evs = doc["eventos"]
    extra = {"ordem": -1, "t": 12.6, "som": "sint-s_whoosh", "ganhoDb": -30, "args": [0.3, 400, 6000],
             "origem": "teste-extra#0"}
    extra["semente"] = zlib.crc32(extra["origem"].encode("utf-8")) & 0xFFFFFFFF
    fora = np.ones(int(round(18.0 * SR)), bool)
    i0 = int(round(12.6 * SR))
    fora[i0: i0 + int(0.3 * SR) + 1] = False  # o trecho do efeito a mais (12,6 a 12,9 s não cruza nenhum outro som)
    x1 = mixa.monta_efeitos(evs, 18.0, "por-evento", efeitos)[0].x
    x2 = mixa.monta_efeitos([extra] + evs, 18.0, "por-evento", efeitos)[0].x
    leg = [dict((k, v) for k, v in e.items() if k != "semente") for e in evs]
    ex_leg = dict((k, v) for k, v in extra.items() if k != "semente")
    l1 = mixa.monta_efeitos(leg, 18.0, "legado", efeitos)[0].x
    l2 = mixa.monta_efeitos([ex_leg] + leg, 18.0, "legado", efeitos)[0].x
    dif_pe = int(np.count_nonzero(x1[fora] != x2[fora]))
    dif_leg = int(np.count_nonzero(l1[fora] != l2[fora]))
    p.update({"amostrasDiferentesForaDoExtra_porEvento": dif_pe, "amostrasDiferentesForaDoExtra_legado": dif_leg,
              "extra": extra})
    p["passou"] = dif_pe == 0 and dif_leg > 0
    p["detalhe"] = ("por-evento: %d amostras mudam fora do efeito a mais; legado: %d (o ruído de todos os sons depois "
                    "dele muda)" % (dif_pe, dif_leg))


# ---------------------------------------------------------------------------------------------------------------
# 5. sincronia
# ---------------------------------------------------------------------------------------------------------------

def prova_sincronia(pasta, res):
    import mixa
    p = {"prova": "ancora sincronia (pixabay-405445 em t = 1,0)", "passou": False}
    res["provas"].append(p)
    efeitos, _ = mixa.carrega_catalogos()
    ev = {"ordem": 0, "t": 1.0, "som": "pixabay-405445", "ganhoDb": -20, "ancora": "sincronia",
          "origem": "teste-sincronia#0"}
    tr, regs = mixa.monta_efeitos([ev], 3.0, "por-evento", efeitos)
    t_mem = float(np.argmax(np.abs(tr.x))) / SR
    props = {"versao": 1, "peca": "teste-sincronia-k05", "duracao": 3.0, "voz": None, "trilha": None,
             "sons": {"perfil": "v2", "modoRuido": "por-evento", "extras": [], "remover": []}}
    cpr, cev = os.path.join(pasta, "props-sincronia.json"), os.path.join(pasta, "eventos-sincronia.json")
    escrita.grava_json(cpr, props)
    escrita.grava_json(cev, {"versao": 1, "peca": props["peca"], "cena": "teste", "duracao": 3.0, "perfil": "v2",
                             "modoRuido": "por-evento", "eventos": [ev]})
    saida = os.path.join(pasta, "audio", "mix-sincronia.wav")
    cod, txt = roda_mixa(pasta, cpr, cev, saida, ["--relatorio"])
    if cod != 0:
        p["detalhe"] = "o mixa.py falhou: %s" % txt[-300:]
        return
    with open(os.path.splitext(saida)[0] + ".json", encoding="utf-8") as f:
        rel = json.load(f)
    q, _ = le_wav(saida)
    y = q[:, 0].astype(np.float64) / 32768.0
    # no arquivo final o loudnorm (modo dinâmico, com limitador de pico) muda a altura relativa dos pulsos do whoosh;
    # a posição do efeito sai da correlação com o próprio sinal decodificado (imune ao ganho)
    sig, _ = mixa.decodifica(efeitos["pixabay-405445"]["arquivo"])
    k_pico = int(np.argmax(np.abs(sig)))
    esperado = int(round((1.0 - efeitos["pixabay-405445"]["sincronia_ms"] / 1000.0) * SR))
    folga = int(0.05 * SR)
    a0 = max(0, esperado - folga)
    seg = y[a0: esperado + folga + len(sig)]
    lag = a0 + int(np.argmax(np.correlate(seg, sig.astype(np.float64), "valid")))
    t_corr = (lag + k_pico) / SR
    t_amostra_final = float(np.argmax(np.abs(y))) / SR
    r0 = rel["eventos"][0]
    p.update({"sincronia_ms": efeitos["pixabay-405445"].get("sincronia_ms"), "inicioDoArquivo_s": r0.get("tAmostra"),
              "tPicoRelatorio": r0.get("tPico"), "tPicoNosEfeitos": round(t_mem, 6),
              "tPicoNoArquivoFinalPorCorrelacao": round(t_corr, 6),
              "maiorAmostraNoArquivoFinal_s": round(t_amostra_final, 6),
              "loudnormPassada2": rel["loudnorm"]["passada2"],
              "nota": ("a maior amostra do arquivo final não serve de medida: o loudnorm no modo dinâmico limita o pico "
                       "real e outro pulso do whoosh fica mais alto; a posição do efeito no arquivo final sai da "
                       "correlação com o sinal decodificado")})
    p["passou"] = all(abs(x - 1.0) <= 0.005 for x in (r0["tPico"], t_mem, t_corr))
    p["detalhe"] = ("pico em %s s no relatório, %s s na trilha de efeitos e %s s no arquivo final (posição pela "
                    "correlação)" % (br(r0["tPico"], 4), br(t_mem, 4), br(t_corr, 4)))


# ---------------------------------------------------------------------------------------------------------------
# 6 e 7. assinaturas, __pycache__ e travessão
# ---------------------------------------------------------------------------------------------------------------

def prova_assinaturas(res):
    p = {"prova": "assinaturas (4 WAV, 48 kHz, mono, menos de 150 KB)", "passou": False, "arquivos": []}
    res["provas"].append(p)
    ok = True
    for tom in ("do", "mi", "la", "re"):
        c = os.path.join(ASSINATURAS, "assinatura-%s.wav" % tom)
        if not os.path.isfile(c):
            p["arquivos"].append({"tom": tom, "existe": False})
            ok = False
            continue
        _, info = le_wav(c)
        tam = os.path.getsize(c)
        bom = info["sr"] == SR and info["canais"] == 1 and info["bits"] == 16 and tam < 150 * 1000
        ok = ok and bom
        p["arquivos"].append(dict(info, tom=tom, tamanho=tam, ok=bom))
    p["passou"] = ok
    p["detalhe"] = ", ".join("%s %d bytes" % (a["tom"], a.get("tamanho", 0)) for a in p["arquivos"])


def retrato_pycache():
    """(arquivos do PR/src/__pycache__ com tamanho e mtime, pastas __pycache__ da árvore do leo-animado)."""
    pr = {}
    pc = os.path.join(PR_SRC, "__pycache__")
    if os.path.isdir(pc):
        for n in sorted(os.listdir(pc)):
            st = os.stat(os.path.join(pc, n))
            pr[n] = [st.st_size, st.st_mtime_ns]
    pastas = []
    for raiz, dirs, _ in os.walk(LEO):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".git")]
        if "__pycache__" in dirs:
            pastas.append(os.path.join(raiz, "__pycache__").replace("\\", "/"))
    return pr, sorted(pastas)


def prova_limpeza(res, antes):
    p = {"prova": "sem __pycache__ novo e zero travessão em KIT/audio", "passou": False}
    res["provas"].append(p)
    depois = retrato_pycache()
    trav = {}
    for raiz, _, arqs in os.walk(AQUI):
        for n in arqs:
            c = os.path.join(raiz, n)
            if os.path.splitext(n)[1].lower() in (".wav",):
                continue
            with open(c, "rb") as f:
                txt = f.read().decode("utf-8", "replace")
            k = txt.count("\u2014") + txt.count("\u2013")
            if k:
                trav[c] = k
    p.update({"prSrcPycacheIgual": antes[0] == depois[0], "pastasPycacheAntes": antes[1],
              "pastasPycacheDepois": depois[1], "travessoesEmKitAudio": trav})
    p["passou"] = antes[0] == depois[0] and antes[1] == depois[1] and not trav
    p["detalhe"] = ("PR/src/__pycache__ %s; pastas __pycache__: %d antes e %d depois; travessões: %d"
                    % ("igual" if p["prSrcPycacheIgual"] else "MUDOU", len(antes[1]), len(depois[1]),
                       sum(trav.values())))


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass
    ap = argparse.ArgumentParser(description="Prova do mixador do kit contra o mix-guia.wav (pacote K05).")
    ap.add_argument("--pasta", default=None, help="pasta de teste (padrão: um temporário no Temp); o nome dela começa "
                    "com '_' (peça de teste), senão a Talent in the Air é recusada (a trilha vale pela pasta)")
    ap.add_argument("--guarda", action="store_true", help="não apaga os WAV de teste no fim")
    ap.add_argument("--registra", action="store_true", help="grava o resultado em _regressao/resultado-testa-guia.json")
    ap.add_argument("--so-guia", action="store_true", help="só as provas 1 e 2")
    a = ap.parse_args(argv)
    antes = retrato_pycache()
    criada = a.pasta is None
    # desde a rodada 4 (03/10) a regra da trilha vale pelo nome da PASTA da peça: a pasta de teste tem o nome da peça de
    # teste das props (com '_'), pra a Talent in the Air passar com o aviso de peça de teste
    raiz_tmp = tempfile.mkdtemp(prefix="k05-testa-guia-") if criada else None
    pasta = os.path.join(raiz_tmp, PROPS_GUIA["peca"]) if criada else os.path.abspath(a.pasta)
    if escrita.protegido(pasta):
        print("erro: a pasta de teste é protegida: %s" % pasta)
        return 2
    os.makedirs(os.path.join(pasta, "audio"), exist_ok=True)
    try:
        escrita.exige_disco(100, "o teste do mix")
    except escrita.DiscoInsuficiente as e:
        print("erro: %s" % e)
        return 2
    res = {"versao": 1, "geradoPor": "KIT/audio/testa_guia.py (K05)",
           "geradoEm": datetime.datetime.now().astimezone().isoformat(timespec="seconds"), "pasta": pasta,
           "fixture": FIXTURE, "provas": []}
    try:
        rel = prova_guia(pasta, res)
        prova_2867(rel, res)
        if not a.so_guia:
            prova_por_evento(pasta, res, res["provas"][0].get("kit", {}).get("md5"))
            prova_estabilidade(res)
            prova_sincronia(pasta, res)
            prova_assinaturas(res)
        prova_limpeza(res, antes)
    finally:
        if not a.guarda:
            for raiz, _, arqs in os.walk(os.path.join(pasta, "audio")):
                for n in arqs:
                    if n.lower().endswith(".wav"):
                        os.remove(os.path.join(raiz, n))
    res["passou"] = all(p["passou"] for p in res["provas"])
    escrita.grava_json(os.path.join(pasta, "resultado-testa-guia.json"), res)
    if a.registra:
        escrita.grava_json(os.path.join(AQUI, "_regressao", "resultado-testa-guia.json"), res, cria_pasta=True)
    for p in res["provas"]:
        print("[%s] %s: %s" % ("ok" if p["passou"] else "FALHOU", p["prova"], p.get("detalhe", "")))
        for r in p.get("responsaveis", []):
            print("       %s a %s s (%d amostras): %s" % (br(r["de_s"], 3), br(r["ate_s"], 3), r["amostras"], r["eventos"]))
    if criada and not a.guarda:
        shutil.rmtree(raiz_tmp, ignore_errors=True)
        onde = os.path.join(AQUI, "_regressao", "resultado-testa-guia.json") if a.registra else \
            "nenhum lugar (pasta temporária apagada; use --registra, --pasta ou --guarda)"
    else:
        onde = os.path.join(pasta, "resultado-testa-guia.json")
    print("resultado: %s (detalhes em %s)" % ("PASSOU" if res["passou"] else "FALHOU", onde))
    return 0 if res["passou"] else 1


if __name__ == "__main__":
    sys.exit(main())
