"""Medidas da regressão do guia pelo kit (pacote K12). Contrato: KIT/DESENHO.md, seção 11.

Só mede e compara: quem gera é o kit.py (props, eventos, fatos, mix, telas, stills, render, junção, conferência e
capa). Roda no PY (Python do corte-viral), sempre com -B. Toda gravação passa pelo KIT/lib/escrita.py (temporário
na mesma pasta e os.replace). O V4 nunca é copiado: é lido do caminho dele, em memória.

Comandos:
    eventos <eventos.json> --saida <json> [--tol-t 0] [--rotulo x]
        contra a tabela da seção 6 do DESENHO (lida do próprio DESENHO.md) e a fixture do K05
        (KIT/audio/_regressao/eventos-guia-v2.json). Com --tol-t 0: t igual em 6 casas; com --tol-t > 0
        (rodada 2): |dt| <= tol em cada evento e nos argumentos de tempo do sint-s_processa.
    wav-bits <a.wav> <b.wav> --saida <json>          amostra a amostra (int16)
    audio <a> <b> --saida <json> [--de s] [--ate s]  mono 48 kHz em memória: atraso, correlação e nível
    voz <voz-final.wav> --tfecho <s> --saida <json>  correlação com o GP/vo/narr-dylan.wav de 0 a 18 s e o
                                                      começo do fecho (correlação com o asset do K03)
    telas --saida <json>                             as 4 telas da peça contra GP/assets/telas e _referencia, e o
                                                      regioes.json contra as constantes da seção 4.8
    video <mp4> --saida <json> [--psnr <log>] [--ssim <log>]
        md5 do fluxo de vídeo, formato (540 quadros, 30 fps, 1080x1920, yuv420p, bt709 tv) e, com --psnr e
        --ssim, PSNR e SSIM contra o V4 (stats_file pro stdout, gravado pelo escrita.py)
    lote <manifesto>                                 depois de cada lote do kit.py stills: chama o compara.py do
                                                      K06 (lote) com o V4 e grava em provas/r1-stills/
    pares <a.png> <b.png> [...] --saida <json> [--miniaturas <pasta>]
    periodico <quadros.json> --saida <json>          660 quadros, tFim, camada ambiente e emenda do loop
    folha-contato --saida <jpg> --video rotulo=<mp4> [...]
    folha-diferencas --saida <jpg> --stills <json> --miniaturas <pasta> [--extra <json>]
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import hashlib  # noqa: E402
import io  # noqa: E402
import json  # noqa: E402
import math  # noqa: E402
import os  # noqa: E402
import re  # noqa: E402
import subprocess  # noqa: E402
import wave  # noqa: E402

KIT = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion"
sys.path.insert(0, KIT + "/lib")
sys.path.insert(0, KIT + "/scripts")
import escrita  # noqa: E402
import comum  # noqa: E402  (K07: medidas do ffmpeg, só leitura)

import numpy as np  # noqa: E402
from PIL import Image, ImageDraw, ImageFont  # noqa: E402

PECA = KIT + "/pecas/guia-pronta-2026-10-14"
PROVAS = PECA + "/provas"
DESENHO = KIT + "/DESENHO.md"
FIXTURE = KIT + "/audio/_regressao/eventos-guia-v2.json"
GP = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/guia-pronta-2026-10-14"
V4 = ("C:/MKT-INSTA/Content Legalizai/marketing/final/2026-10-14 O app fazendo a guia do mês, sem site do governo/"
      "GUIA-PRONTA-motion-v4.mp4")
NARR_DYLAN = GP + "/vo/narr-dylan.wav"
FECHO_WAV = KIT + "/voz/fecho/vai-legalizai-dylan.wav"
COMPARA_K06 = KIT + "/provas/render/compara.py"
FONTE = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/public-kit/Sora-wght.ttf"
FLUXO_V4 = "6ddbb29b1b005e7b209b040924ed1f17"
SR = 48000

REGIOES_48 = {  # DESENHO, seção 4.8
    "card": {"x": 72, "y": 424, "w": 1146, "h": 486, "r": 46},
    "valor": {"x": 125, "y": 682, "fonte": "600 59px Sora", "cor": "#1B1E24"},
    "esqueleto": {"x": 123, "y": 739, "w": 389, "h": 119, "r": 28},
    "botaoPagar": {"x": 123, "y": 739, "w": 389, "h": 119, "r": 28},
    "botaoVer": {"x": 270, "y": 2676},
}
TELAS = ["tela-splash.png", "tela-inicio.png", "tela-inicio-pagar.png", "tela-imposto.png"]


def grava_json(caminho, obj):
    escrita.grava_json(caminho, obj, forca=False, cria_pasta=True)
    print("gravado: %s" % caminho)


def le_json(caminho):
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------- eventos

def tabela_secao6():
    """As 35 linhas da tabela-mestra (seção 6), lidas do DESENHO.md."""
    with open(DESENHO, encoding="utf-8") as f:
        texto = f.read()
    ini = texto.index("## 6. Tabela-mestra")
    fim = texto.index("## 7.", ini)
    linhas = []
    rx = re.compile(r"^\|\s*(\d+)\s*\|\s*([\d.]+)\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*([^|]+?)\s*\|\s*(sim|não)\s*\|"
                    r"\s*([^|]+?)\s*\|\s*$")
    for ln in texto[ini:fim].splitlines():
        m = rx.match(ln)
        if not m:
            continue
        som = m.group(3)
        inverte = "(inverte)" in som
        som = som.replace("(inverte)", "").strip()
        args = [float(x) for x in m.group(4).split(",")] if m.group(4).strip() else None
        ganho = float(re.match(r"-?[\d.]+", m.group(5)).group(0))
        linhas.append({"ordem": int(m.group(1)), "t": float(m.group(2)), "som": som, "args": args, "ganhoDb": ganho,
                       "inverte": inverte, "ruido": m.group(6) == "sim", "batida": m.group(7)})
    return linhas


def _norm_ev(e):
    tr = e.get("transpor")
    return {"t": float(e["t"]), "som": e["som"], "args": [float(x) for x in e["args"]] if e.get("args") else None,
            "ganhoDb": float(e.get("ganhoDb", 0)), "filtro": e.get("filtro") or None, "inverte": bool(e.get("inverte")),
            "transpor": None if (tr in (None, 0, 0.0)) else tr, "origem": e.get("origem")}


def compara_eventos(meus, ref, tol_t, nome_ref, args_tempo=("sint-s_processa",)):
    difs = []
    maior_dt = 0.0
    if len(meus) != len(ref):
        difs.append({"erro": "contagem %d contra %d" % (len(meus), len(ref))})
    for i, (a, b) in enumerate(zip(meus, ref)):
        a, b = _norm_ev(a), _norm_ev(b)
        campos = []
        dt = abs(a["t"] - b["t"])
        maior_dt = max(maior_dt, dt)
        if tol_t == 0:
            if round(a["t"], 6) != round(b["t"], 6):
                campos.append("t %.6f contra %.6f" % (a["t"], b["t"]))
        elif dt > tol_t + 1e-9:
            campos.append("|dt| %.6f > %.3f" % (dt, tol_t))
        if a["som"] != b["som"]:
            campos.append("som %s contra %s" % (a["som"], b["som"]))
        aa, ba = a["args"], b["args"]
        if (aa is None) != (ba is None) or (aa and len(aa) != len(ba)):
            campos.append("args %s contra %s" % (aa, ba))
        elif aa:
            for k, (x, y) in enumerate(zip(aa, ba)):
                if a["som"] in args_tempo and tol_t > 0:
                    if abs(x - y) > tol_t + 1e-9:
                        campos.append("arg %d (tempo) %s contra %s" % (k, x, y))
                elif abs(x - y) > 1e-9:
                    campos.append("arg %d %s contra %s" % (k, x, y))
        if abs(a["ganhoDb"] - b["ganhoDb"]) > 1e-9:
            campos.append("ganho %s contra %s" % (a["ganhoDb"], b["ganhoDb"]))
        if "filtro" in b and a["filtro"] != b.get("filtro"):
            campos.append("filtro %s contra %s" % (a["filtro"], b.get("filtro")))
        if a["inverte"] != b["inverte"]:
            campos.append("inverte %s contra %s" % (a["inverte"], b["inverte"]))
        if a["transpor"] != b["transpor"]:
            campos.append("transpor %s contra %s" % (a["transpor"], b["transpor"]))
        if campos:
            difs.append({"i": i, "origem": a["origem"], "campos": campos})
    return {"contra": nome_ref, "eventos": len(meus), "referencia": len(ref), "diferencas": difs,
            "maiorDt": round(maior_dt, 6), "passou": not difs}


def cmd_eventos(a):
    ev = le_json(a.eventos)
    meus = ev["eventos"]
    tab = tabela_secao6()
    tab_ev = [{"t": x["t"], "som": x["som"], "args": x["args"], "ganhoDb": x["ganhoDb"], "inverte": x["inverte"],
               "origem": x["batida"]} for x in tab]
    fx = le_json(FIXTURE)["eventos"]
    r1 = compara_eventos(meus, tab_ev, a.tol_t, "tabela da seção 6 (DESENHO.md, %d linhas)" % len(tab))
    r2 = compara_eventos(meus, fx, a.tol_t, "fixture do K05 (%s)" % os.path.basename(FIXTURE))
    # deslocamentos por evento (rodada 2: a narração realinhada move as batidas presas a palavra)
    desloc = [{"i": i, "origem": e.get("origem"), "som": e["som"], "t": e["t"], "tRef": tab_ev[i]["t"],
               "dt": round(e["t"] - tab_ev[i]["t"], 6)} for i, e in enumerate(meus) if i < len(tab_ev)]
    movidos = [d for d in desloc if abs(d["dt"]) > 1e-6]
    doc = {"versao": 1, "rotulo": a.rotulo, "eventos": a.eventos, "perfil": ev.get("perfil"),
           "modoRuido": ev.get("modoRuido"), "duracao": ev.get("duracao"), "tolT": a.tol_t,
           "contraTabela": r1, "contraFixture": r2, "movidos": movidos, "passou": r1["passou"] and r2["passou"]}
    grava_json(a.saida, doc)
    print("%s: %d eventos; tabela: %s (%d dif.); fixture: %s (%d dif.); maior |dt| %.6f s; movidos %d" % (
        a.rotulo or a.eventos, len(meus), "ok" if r1["passou"] else "FALHA", len(r1["diferencas"]),
        "ok" if r2["passou"] else "FALHA", len(r2["diferencas"]), r1["maiorDt"], len(movidos)))
    for d in r1["diferencas"][:12] + r2["diferencas"][:12]:
        print("   ", d)
    return 0 if doc["passou"] else 1


# ---------------------------------------------------------------- áudio

def le_wav_int16(caminho):
    with wave.open(caminho, "rb") as w:
        n, c, sw, sr = w.getnframes(), w.getnchannels(), w.getsampwidth(), w.getframerate()
        dados = w.readframes(n)
    if sw != 2:
        raise SystemExit("%s: só wav de 16 bits (sampwidth %d)" % (caminho, sw))
    return np.frombuffer(dados, np.int16).reshape(-1, c), sr


def cmd_wav_bits(a):
    x, sx = le_wav_int16(a.a)
    y, sy = le_wav_int16(a.b)
    doc = {"a": a.a, "b": a.b, "md5A": escrita.md5(a.a), "md5B": escrita.md5(a.b), "srA": sx, "srB": sy,
           "formaA": list(x.shape), "formaB": list(y.shape)}
    if x.shape == y.shape and sx == sy:
        d = np.abs(x.astype(np.int32) - y.astype(np.int32))
        doc.update({"amostrasPorCanal": int(x.shape[0]), "canais": int(x.shape[1]), "maxLsb": int(d.max()),
                    "amostrasDiferentes": int((d > 0).sum()), "acimaDe1Lsb": int((d > 1).sum())})
        doc["passou"] = doc["maxLsb"] <= 1
    else:
        doc["passou"] = False
        doc["erro"] = "formato diferente"
    grava_json(a.saida, doc)
    print(json.dumps({k: doc[k] for k in doc if k not in ("a", "b")}, ensure_ascii=False))
    return 0 if doc["passou"] else 1


def _janela(sinal, de, ate):
    i0 = int(round((de or 0) * SR))
    i1 = len(sinal) if ate is None else int(round(ate * SR))
    s = sinal[i0:i1]
    if ate is not None and len(s) < i1 - i0:
        s = np.concatenate([s, np.zeros(i1 - i0 - len(s), np.float32)])
    return s


def cmd_audio(a):
    x = _janela(comum.audio_mono(a.a, SR), a.de, a.ate)
    y = _janela(comum.audio_mono(a.b, SR), a.de, a.ate)
    r = comum.compara_audio(x, y)
    doc = {"a": a.a, "b": a.b, "de": a.de, "ate": a.ate, "sr": SR, "mono": True, **r,
           "atrasoMs": round(r["atrasoAmostras"] * 1000.0 / SR, 3)}
    grava_json(a.saida, doc)
    print("atraso %d amostras (%.3f ms), correlação %.6f, nível %.3f dB" % (r["atrasoAmostras"], doc["atrasoMs"],
                                                                            r["correlacao"], r["diferencaNivelDb"]))
    return 0


def _ncc_lag(sinal, molde, de, ate):
    """Posição (amostra) do molde dentro de sinal[de:ate] pela correlação normalizada (FFT)."""
    seg = sinal[de:ate].astype(np.float64)
    m = molde.astype(np.float64)
    n = len(seg) + len(m)
    tam = 1 << int(np.ceil(np.log2(n)))
    xc = np.fft.irfft(np.fft.rfft(seg, tam) * np.conj(np.fft.rfft(m, tam)), tam)[:len(seg) - len(m) + 1]
    c2 = np.concatenate([[0.0], np.cumsum(seg * seg)])
    energia = c2[len(m):] - c2[:len(seg) - len(m) + 1]
    ncc = xc / (np.sqrt(np.maximum(energia, 1e-20)) * np.sqrt(np.dot(m, m)) + 1e-30)
    k = int(np.argmax(ncc))
    return de + k, float(ncc[k])


def cmd_voz(a):
    vf = comum.audio_mono(a.voz, SR)
    ref = comum.audio_mono(NARR_DYLAN, SR)
    x, y = _janela(vf, 0, 18.0), _janela(ref, 0, 18.0)
    r = comum.compara_audio(x, y)
    fecho = comum.audio_mono(FECHO_WAV, SR)
    alvo = int(round(a.tfecho * SR))
    pos, ncc = _ncc_lag(vf, fecho, max(0, alvo - int(0.25 * SR)), min(len(vf), alvo + int(0.25 * SR) + len(fecho)))
    inicio = pos / SR
    doc = {"voz": a.voz, "md5": escrita.md5(a.voz), "ref": NARR_DYLAN, "janela": [0, 18.0], **r,
           "fecho": {"asset": FECHO_WAV, "tFecho": a.tfecho, "inicioMedido": round(inicio, 6),
                     "desvioMs": round((inicio - a.tfecho) * 1000.0, 3), "correlacaoNoInicio": round(ncc, 6)},
           "amostras": int(len(vf)), "duracao": round(len(vf) / SR, 6)}
    doc["passou"] = r["correlacao"] >= 0.98 and abs(doc["fecho"]["desvioMs"]) <= 1.0
    grava_json(a.saida, doc)
    print("voz-final: correlação %.6f com o narr-dylan (0 a 18 s), atraso %d, nível %.3f dB; fecho em %.6f s "
          "(desvio %.3f ms, ncc %.6f)" % (r["correlacao"], r["atrasoAmostras"], r["diferencaNivelDb"], inicio,
                                          doc["fecho"]["desvioMs"], ncc))
    return 0 if doc["passou"] else 1


# ---------------------------------------------------------------- telas

def _rgb(caminho):
    return np.asarray(Image.open(caminho).convert("RGB"))


def _md5_pixels(arr):
    return hashlib.md5(np.ascontiguousarray(arr).tobytes()).hexdigest()


def cmd_telas(a):
    itens = []
    ok = True
    for n in TELAS:
        pp, pg, pr = PECA + "/telas/" + n, GP + "/assets/telas/" + n, PECA + "/_referencia/" + n
        ap, ag, ar = _rgb(pp), _rgb(pg), _rgb(pr)
        it = {"tela": n, "md5Peca": escrita.md5(pp), "md5GP": escrita.md5(pg), "md5Ref": escrita.md5(pr),
              "pixelsPeca": _md5_pixels(ap), "pixelsGP": _md5_pixels(ag), "pixelsRef": _md5_pixels(ar),
              "maxContraGP": int(np.abs(ap.astype(np.int16) - ag).max()) if ap.shape == ag.shape else None,
              "maxContraRef": int(np.abs(ap.astype(np.int16) - ar).max()) if ap.shape == ar.shape else None,
              "tamanho": list(ap.shape[:2][::-1]), "stNlinkPeca": os.stat(pp).st_nlink}
        it["igual"] = it["maxContraGP"] == 0 and it["maxContraRef"] == 0
        ok = ok and it["igual"]
        itens.append(it)
        print("%-22s peça x GP max %s, peça x REF max %s, md5 %s" % (n, it["maxContraGP"], it["maxContraRef"],
                                                                      it["md5Peca"]))
    reg = le_json(PECA + "/telas/regioes.json")
    difs = []
    for nome, esperado in REGIOES_48.items():
        tem = reg.get(nome)
        if tem is None:
            difs.append("%s: falta" % nome)
            continue
        for k, v in esperado.items():
            if tem.get(k) != v:
                difs.append("%s.%s: %r contra %r" % (nome, k, tem.get(k), v))
    extras = sorted(set(reg) - set(REGIOES_48))
    doc = {"telas": itens, "regioes": {"arquivo": PECA + "/telas/regioes.json", "diferencas": difs, "extras": extras},
           "passou": ok and not difs}
    grava_json(a.saida, doc)
    print("regiões: %s (%d diferença(s), extras %s)" % ("iguais às constantes" if not difs else "DIFERENTES", len(difs),
                                                         extras))
    return 0 if doc["passou"] else 1


# ---------------------------------------------------------------- vídeo

def sonda_video(mp4):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries",
                        "stream=codec_name,profile,width,height,r_frame_rate,avg_frame_rate,pix_fmt,color_space,"
                        "color_range,color_transfer,color_primaries,nb_frames,nb_read_frames,duration",
                        "-of", "json", mp4], capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        raise SystemExit("ffprobe falhou: %s" % r.stderr[-500:])
    return json.loads(r.stdout)["streams"][0]


def _stats(mp4, filtro):
    """psnr ou ssim contra o V4, com o stats_file no stdout; devolve (texto do stats, resumo do stderr)."""
    cmd = ["ffmpeg", "-nostats", "-hide_banner", "-i", mp4, "-i", V4, "-lavfi",
           "[0:v][1:v]%s=stats_file=-" % filtro, "-f", "null", "-"]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        raise SystemExit("ffmpeg %s falhou: %s" % (filtro, r.stderr[-800:]))
    resumo = [ln for ln in r.stderr.splitlines() if "Parsed_%s" % filtro in ln]
    return r.stdout, (resumo[-1] if resumo else ""), " ".join(cmd)


def _f(x):
    return float("inf") if x in ("inf", "+inf") else float(x)


def cmd_video(a):
    s = sonda_video(a.mp4)
    num, den = map(int, s["r_frame_rate"].split("/"))
    fluxo = comum.md5_fluxo_video(a.mp4)
    fmt = {"codec": s.get("codec_name"), "perfil": s.get("profile"), "tamanho": "%sx%s" % (s["width"], s["height"]),
           "fps": num / den, "quadros": int(s.get("nb_read_frames") or s.get("nb_frames") or 0),
           "pix_fmt": s.get("pix_fmt"), "color_space": s.get("color_space"), "color_range": s.get("color_range"),
           "color_transfer": s.get("color_transfer"), "color_primaries": s.get("color_primaries")}
    fmt_ok = (fmt["tamanho"] == "1080x1920" and abs(fmt["fps"] - 30) < 1e-9 and fmt["quadros"] == a.quadros
              and fmt["pix_fmt"] == "yuv420p" and fmt["color_space"] == "bt709" and fmt["color_range"] == "tv")
    doc = {"mp4": a.mp4, "bytes": os.path.getsize(a.mp4), "md5Arquivo": escrita.md5(a.mp4), "md5FluxoVideo": fluxo,
           "md5FluxoV4": FLUXO_V4, "fluxoIgualAoV4": fluxo == FLUXO_V4, "formato": fmt, "formatoOk": fmt_ok}
    if a.psnr:
        txt, resumo, cmd = _stats(a.mp4, "psnr")
        escrita.grava_texto(a.psnr, txt, cria_pasta=True)
        por = [_f(m.group(1)) for m in re.finditer(r"psnr_avg:(\S+)", txt)]
        m = re.search(r"average:(\S+) min:(\S+) max:(\S+)", resumo)
        finitos = [p for p in por if math.isfinite(p)]
        doc["psnr"] = {"log": a.psnr, "comando": cmd, "resumo": resumo.split("] ", 1)[-1],
                       "quadros": len(por), "media": _f(m.group(1)) if m else None,
                       "minimoPorQuadro": min(por) if por else None, "quadrosInfinitos": len(por) - len(finitos),
                       "piores": sorted([(round(p, 3), i) for i, p in enumerate(por) if math.isfinite(p)])[:8]}
        print("PSNR: %s; mínimo por quadro %s; %d de %d quadros idênticos (inf)" % (
            doc["psnr"]["resumo"], doc["psnr"]["minimoPorQuadro"], doc["psnr"]["quadrosInfinitos"], len(por)))
    if a.ssim:
        txt, resumo, cmd = _stats(a.mp4, "ssim")
        escrita.grava_texto(a.ssim, txt, cria_pasta=True)
        por = [float(m.group(1)) for m in re.finditer(r"All:([\d.]+)", txt)]
        m = re.search(r"All:([\d.]+)", resumo)
        doc["ssim"] = {"log": a.ssim, "comando": cmd, "resumo": resumo.split("] ", 1)[-1], "quadros": len(por),
                       "media": float(m.group(1)) if m else None, "minimoPorQuadro": min(por) if por else None}
        print("SSIM: %s; mínimo por quadro %s" % (doc["ssim"]["resumo"], doc["ssim"]["minimoPorQuadro"]))
    grava_json(a.saida, doc)
    print("fluxo %s (%s ao V4); formato %s: %s" % (fluxo, "IGUAL" if doc["fluxoIgualAoV4"] else "diferente",
                                                    "ok" if fmt_ok else "FORA", json.dumps(fmt, ensure_ascii=False)))
    return 0


# ---------------------------------------------------------------- stills

def cmd_lote(a):
    """Depois de um lote do kit.py stills (GuiaPronta e KitMotion): o compara.py do K06, com o V4."""
    cmd = [comum.PY, "-B", COMPARA_K06, "lote", a.manifesto, "--resultado", PROVAS + "/r1-stills/kitmotion-x-guiapronta.json",
           "--v4", V4, "--miniaturas", PROVAS + "/r1-stills/miniaturas"]
    r = subprocess.run(cmd, env=comum.env_python())
    return r.returncode


def cmd_guarda_amostra(a):
    """Move os PNG de uma execução do kit.py stills pra provas/stills/amostras/ com o número da amostra (cada execução
    é um bundle e abas novas: é assim que se mede a variação do próprio GuiaPronta entre abas)."""
    pasta = PROVAS + "/stills"
    feitos = []
    for comp in a.composicoes.split(","):
        for q in a.quadros:
            o = "%s/%s%s-%04d.png" % (pasta, comp, a.sufixo, q)
            d = "%s/amostras/%s%s-%04d-a%d.png" % (pasta, comp, a.sufixo, q, a.amostra)
            escrita.move(o, d, cria_pasta=True)
            feitos.append(d)
    print("amostra %d: %d PNG em %s/amostras" % (a.amostra, len(feitos), pasta))
    return 0


def cmd_reamostra(a):
    """Junta as amostras guardadas num manifesto e chama o compara.py do K06 (lote): vale o melhor par entre abas."""
    pasta = PROVAS + "/stills/amostras"
    arquivos = []
    for n in sorted(os.listdir(pasta)):
        m = re.match(r"^(GuiaPronta|KitMotion)(-[a-z0-9-]+)?-(\d{4})-a(\d+)\.png$", n)
        if m:
            arquivos.append({"composicao": m.group(1), "prefixo": m.group(1) + (m.group(2) or "") + "-",
                             "quadro": int(m.group(3)), "amostra": int(m.group(4)), "arquivo": pasta + "/" + n})
    man = pasta + "/manifesto-amostras.json"
    escrita.grava_json(man, {"lote": 0, "arquivos": arquivos}, cria_pasta=True)
    cmd = [comum.PY, "-B", COMPARA_K06, "lote", man, "--resultado", a.resultado, "--v4", V4]
    r = subprocess.run(cmd, env=comum.env_python())
    return r.returncode


def _estat(x, y):
    d = np.abs(x.astype(np.int16) - y.astype(np.int16))
    return {"maximo": int(d.max()), "media": round(float(d.mean()), 6),
            "pixelsDiferentes": int((d.max(axis=2) > 0).sum()), "pctAcima2": round(float((d.max(axis=2) > 2).mean() * 100), 4)}


def _mini(arr, largura=108):
    im = Image.fromarray(arr)
    return im.resize((largura, round(arr.shape[0] * largura / arr.shape[1])), Image.LANCZOS)


def _jpg(im, q=80):
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=q)
    return buf.getvalue()


def _dif_visivel(x, y, ganho=40):
    d = np.abs(x.astype(np.int16) - y.astype(np.int16)).max(axis=2)
    v = np.clip(d * ganho, 0, 255).astype(np.uint8)
    return np.stack([v, (v * 0.45).astype(np.uint8), (v * 0.25).astype(np.uint8)], axis=2)


def cmd_pares(a):
    if len(a.arquivos) % 2:
        raise SystemExit("pares: de dois em dois")
    itens = []
    for i in range(0, len(a.arquivos), 2):
        pa, pb = a.arquivos[i], a.arquivos[i + 1]
        x, y = _rgb(pa), _rgb(pb)
        e = _estat(x, y)
        e.update({"a": pa, "b": pb, "md5PixelsA": _md5_pixels(x), "md5PixelsB": _md5_pixels(y)})
        m = re.search(r"(\d{4})\.png$", pa)
        e["quadro"] = int(m.group(1)) if m else None
        if a.miniaturas and e["quadro"] is not None:
            escrita.grava_bytes(os.path.join(a.miniaturas, "%04d-a.jpg" % e["quadro"]), _jpg(_mini(x)), cria_pasta=True)
            escrita.grava_bytes(os.path.join(a.miniaturas, "%04d-dif.jpg" % e["quadro"]), _jpg(_mini(_dif_visivel(x, y))),
                                cria_pasta=True)
        itens.append(e)
        print("%s x %s: max %d, média %.6f, px diferentes %d" % (os.path.basename(pa), os.path.basename(pb), e["maximo"],
                                                                 e["media"], e["pixelsDiferentes"]))
    grava_json(a.saida, {"versao": 1, "itens": itens})
    return 0


# ---------------------------------------------------------------- periódico

CAM = ["x", "y", "z", "tx", "ty", "tz", "fov"]
OBJ = ["x", "y", "z", "rx", "ry", "rz", "s", "vis"]


def _vet(fr, ent):
    if ent == "camera":
        return np.array([float(fr["cam"][k]) for k in CAM])
    return np.array([float(fr["obj"][ent]["pose"][k]) for k in OBJ])


def cmd_periodico(a):
    q = le_json(a.quadros)
    qs = q["quadros"]
    n = len(qs)
    tfim = q.get("tFim")
    amb0, ambf = q.get("amb0") or {}, (tfim or {}).get("amb") or {}
    difs_amb = {"cam.x": abs(amb0["cam"]["x"] - ambf["cam"]["x"]), "cam.y": abs(amb0["cam"]["y"] - ambf["cam"]["y"])}
    for k in amb0.get("objetos", {}):
        for c in ("y", "rz"):
            difs_amb["%s.%s" % (k, c)] = abs(amb0["objetos"][k][c] - ambf["objetos"][k][c])
    amb_max = max(difs_amb.values())
    ents = ["camera"] + [o["id"] for o in q["objetos"]]
    por = {}
    for ent in ents:
        v = np.stack([_vet(fr, ent) for fr in qs])
        passos = np.abs(np.diff(v, axis=0)).max(axis=1)
        p95 = float(np.percentile(passos, 95))
        emenda = float(np.abs(v[-1] - v[0]).max())
        comp = {k: float(abs(v[-1][i] - v[0][i])) for i, k in enumerate(CAM if ent == "camera" else OBJ)}
        vis = None if ent == "camera" else (float(qs[0]["obj"][ent]["pose"]["vis"]), float(qs[-1]["obj"][ent]["pose"]["vis"]))
        conta = ent == "camera" or not (vis[0] <= 0.001 and vis[1] <= 0.001)
        por[ent] = {"emenda": emenda, "p95Vizinhos": p95, "maiorPasso": float(passos.max()),
                    "medianaPassos": float(np.median(passos)), "passoQ0aQ1": float(passos[0]),
                    "passoPenultimoAoUltimo": float(passos[-1]), "passou": emenda <= p95, "conta": conta,
                    "visQuadro0eUltimo": vis, "porComponente": comp}
    # emenda da timeline (sem a camada ambiente): estado do quadro 0 contra o de t = duração
    e0, ef = qs[0].get("estado"), (tfim or {}).get("estado")
    est = None
    if e0 and ef:
        est = max(abs(float(e0["cam"][k]) - float(ef["cam"][k])) for k in CAM)
        for oid in e0["obj"]:
            if e0["obj"][oid].get("vis", 1) <= 0.001 and ef["obj"][oid].get("vis", 1) <= 0.001:
                continue
            est = max(est, max(abs(float(e0["obj"][oid][k]) - float(ef["obj"][oid][k])) for k in OBJ))
    contam = [e for e in ents if por[e]["conta"]]
    doc = {"quadros": a.quadros, "duracao": q.get("duracao"), "total": q.get("total"), "contados": n,
           "periodico": q.get("periodico"), "tFim": {"existe": tfim is not None, "t": (tfim or {}).get("t")},
           "ambiente": {"maxDif": amb_max, "porCampo": difs_amb, "limite": 1e-9, "passou": amb_max <= 1e-9},
           "emenda": por, "estadoTimeline": {"maxDif": est, "limite": 1e-5}, "contam": contam,
           "passou": (n == 660 and tfim is not None and abs(float(tfim["t"]) - 22.0) < 1e-9 and amb_max <= 1e-9
                      and all(por[e]["passou"] for e in contam))}
    grava_json(a.saida, doc)
    print("quadros %d, tFim t=%s, periodico %s; ambiente t=22 x t=0: %.3e" % (n, (tfim or {}).get("t"), q.get("periodico"),
                                                                             amb_max))
    for e in ents:
        p = por[e]
        print("  %-9s emenda %.4e  p95 %.4e  maior passo %.4e  passos 0>1 %.4e e 658>659 %.4e  %s%s" % (
            e, p["emenda"], p["p95Vizinhos"], p["maiorPasso"], p["passoQ0aQ1"], p["passoPenultimoAoUltimo"],
            "ok" if p["passou"] else "ACIMA",
                                                                         "" if p["conta"] else " (invisível nas duas pontas: não conta)"))
    print("estado da timeline t=0 x t=22: %s" % est)
    return 0 if doc["passou"] else 1


# ---------------------------------------------------------------- folhas

def _fonte(tam, peso=600):
    try:
        f = ImageFont.truetype(FONTE, tam)
        f.set_variation_by_axes([peso])
        return f
    except Exception:
        return ImageFont.load_default()


def _quadros_video(mp4, quadros, w, h):
    sel = "+".join("eq(n\\,%d)" % q for q in quadros)
    vf = "select=%s,scale=%d:%d:flags=lanczos:in_color_matrix=bt709:in_range=tv:out_range=full,format=rgb24" % (sel, w, h)
    r = subprocess.run(["ffmpeg", "-v", "error", "-nostdin", "-i", mp4, "-vf", vf, "-fps_mode", "passthrough",
                        "-frames:v", str(len(quadros)), "-f", "rawvideo", "-"], capture_output=True)
    if r.returncode != 0:
        raise SystemExit("ffmpeg: %s" % r.stderr.decode("utf-8", "replace")[-500:])
    tam = w * h * 3
    return [np.frombuffer(r.stdout[i * tam:(i + 1) * tam], np.uint8).reshape(h, w, 3) for i in range(len(r.stdout) // tam)]


def cmd_dif_video(a):
    """Quadros de um mp4 contra os do V4 (decodificados em memória, bt709 faixa tv): estatística e miniaturas."""
    qs = sorted(set(a.quadros))
    xa = _quadros_video(a.mp4, qs, 1080, 1920)
    xb = _quadros_video(V4, qs, 1080, 1920)
    itens = []
    for q, x, y in zip(qs, xa, xb):
        e = _estat(x, y)
        e["quadro"] = q
        itens.append(e)
        escrita.grava_bytes(os.path.join(a.miniaturas, "%s-%04d-a.jpg" % (a.rotulo, q)), _jpg(_mini(x)), cria_pasta=True)
        escrita.grava_bytes(os.path.join(a.miniaturas, "%s-%04d-dif.jpg" % (a.rotulo, q)),
                            _jpg(_mini(_dif_visivel(x, y, a.ganho))), cria_pasta=True)
        print("%s quadro %d: max %d, média %.4f, px diferentes %d" % (a.rotulo, q, e["maximo"], e["media"],
                                                                      e["pixelsDiferentes"]))
    grava_json(a.saida, {"versao": 1, "mp4": a.mp4, "contra": V4, "ganhoMiniatura": a.ganho, "itens": itens})
    return 0


def cmd_folha_contato(a):
    quadros = list(range(0, 540, 30)) + [539]
    w, h = 84, 149
    videos = []
    for item in a.video:
        rot, mp4 = item.split("=", 1)
        videos.append((rot, mp4, _quadros_video(mp4, quadros, w, h)))
    margem, rot_w = 8, 132
    larg = rot_w + len(quadros) * (w + 4) + margem
    alt = 52 + len(videos) * (h + 8) + 22
    folha = Image.new("RGB", (larg, alt), (250, 248, 245))
    dr = ImageDraw.Draw(folha)
    dr.text((margem, 8), a.titulo, fill=(27, 30, 36), font=_fonte(17, 700))
    f2 = _fonte(12, 600)
    for j, q in enumerate(quadros):
        dr.text((rot_w + j * (w + 4), 34), "%.0fs" % (q / 30.0) if q < 539 else "q539", fill=(82, 78, 72), font=f2)
    for i, (rot, _mp4, ims) in enumerate(videos):
        y0 = 52 + i * (h + 8)
        dr.multiline_text((margem, y0 + h // 2 - 18), rot.replace("|", "\n"), fill=(27, 30, 36), font=_fonte(13, 700),
                          spacing=3)
        for j, arr in enumerate(ims):
            folha.paste(Image.fromarray(arr), (rot_w + j * (w + 4), y0))
    dados = _jpg(folha, 72)
    escrita.grava_bytes(a.saida, dados, cria_pasta=True)
    print("folha de contato: %s %s, %d bytes" % (a.saida, folha.size, len(dados)))
    return 0


def cmd_folha_diferencas(a):
    res = le_json(a.stills)
    linhas = res["quadros"]
    reamostra = {r["quadro"]: r for r in le_json(a.reamostra)["quadros"]} if a.reamostra else {}
    cw, ch = 60, 107
    cols = 9
    bloco = 3 * cw + 10
    extra = le_json(a.extra) if a.extra else None
    n_lin = (len(linhas) + cols - 1) // cols
    alt_extra = 0
    if extra:
        alt_extra = 40 + len(extra["linhas"]) * (ch + 26)
    larg = cols * bloco + 10
    alt = 66 + n_lin * (ch + 20) + alt_extra + 10
    folha = Image.new("RGB", (larg, alt), (250, 248, 245))
    dr = ImageDraw.Draw(folha)
    f1, f2 = _fonte(15, 700), _fonte(10, 600)
    dr.text((10, 8), a.titulo, fill=(27, 30, 36), font=f1)
    dr.text((10, 30), "rodada 1, por quadro: KitMotion | dif. KitMotion x GuiaPronta (x40) | dif. GuiaPronta x V4 (x12)",
            fill=(82, 78, 72), font=f2)
    dr.text((10, 44), "máx e média da dif. KitMotion x GuiaPronta; V4 = média da dif. GuiaPronta x V4", fill=(82, 78, 72), font=f2)
    for i, r in enumerate(linhas):
        q = r["quadro"]
        x0 = 10 + (i % cols) * bloco
        y0 = 62 + (i // cols) * (ch + 20)
        for j, nome in enumerate(("kit", "dif", "difv4")):
            p = os.path.join(a.miniaturas, "%04d-%s.jpg" % (q, nome))
            if os.path.exists(p):
                folha.paste(Image.open(p).convert("RGB").resize((cw, ch), Image.LANCZOS), (x0 + j * cw, y0))
        kc = r["kitContraRef"]
        txt = "q%d máx %d m %.3f" % (q, kc["maximo"], kc["media"])
        if q in reamostra:
            txt = "q%d 1 aba: máx %d; 3 abas: %d" % (q, kc["maximo"], reamostra[q]["kitContraRef"]["maximo"])
        elif "refContraV4" in r:
            txt += " V4 %.2f" % r["refContraV4"]["media"]
        dr.text((x0, y0 + ch + 3), txt, fill=(176, 58, 28) if q in reamostra else (27, 30, 36), font=f2)
    if extra:
        y = 62 + n_lin * (ch + 20) + 6
        dr.text((10, y), extra["titulo"], fill=(27, 30, 36), font=f1)
        y += 26
        for ln in extra["linhas"]:
            x = 10
            dr.text((x, y + ch // 2 - 6), ln["rotulo"], fill=(27, 30, 36), font=f2)
            x += 120
            for cel in ln["celulas"]:
                if os.path.exists(cel["img"]):
                    folha.paste(Image.open(cel["img"]).convert("RGB").resize((cw, ch), Image.LANCZOS), (x, y))
                dr.text((x, y + ch + 3), cel.get("texto", ""), fill=(27, 30, 36), font=f2)
                x += cw + (14 if cel.get("fimGrupo") else 2)
            y += ch + 26
    dados = _jpg(folha, 72)
    escrita.grava_bytes(a.saida, dados, cria_pasta=True)
    print("folha de diferenças: %s %s, %d bytes" % (a.saida, folha.size, len(dados)))
    return 0


def main(argv):
    ap = argparse.ArgumentParser(prog="mede.py", description="medidas da regressão do guia (K12)")
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("eventos")
    p.add_argument("eventos")
    p.add_argument("--saida", required=True)
    p.add_argument("--tol-t", type=float, default=0.0)
    p.add_argument("--rotulo", default=None)
    p = sub.add_parser("wav-bits")
    p.add_argument("a")
    p.add_argument("b")
    p.add_argument("--saida", required=True)
    p = sub.add_parser("audio")
    p.add_argument("a")
    p.add_argument("b")
    p.add_argument("--saida", required=True)
    p.add_argument("--de", type=float, default=None)
    p.add_argument("--ate", type=float, default=None)
    p = sub.add_parser("voz")
    p.add_argument("voz")
    p.add_argument("--tfecho", type=float, required=True)
    p.add_argument("--saida", required=True)
    p = sub.add_parser("telas")
    p.add_argument("--saida", required=True)
    p = sub.add_parser("video")
    p.add_argument("mp4")
    p.add_argument("--saida", required=True)
    p.add_argument("--quadros", type=int, default=540)
    p.add_argument("--psnr")
    p.add_argument("--ssim")
    p = sub.add_parser("lote")
    p.add_argument("manifesto")
    p = sub.add_parser("guarda-amostra")
    p.add_argument("--amostra", type=int, required=True)
    p.add_argument("--quadros", type=lambda s: [int(x) for x in s.split(",")], required=True)
    p.add_argument("--composicoes", default="GuiaPronta,KitMotion")
    p.add_argument("--sufixo", default="")
    p = sub.add_parser("reamostra")
    p.add_argument("--resultado", required=True)
    p = sub.add_parser("pares")
    p.add_argument("arquivos", nargs="+")
    p.add_argument("--saida", required=True)
    p.add_argument("--miniaturas")
    p = sub.add_parser("periodico")
    p.add_argument("quadros")
    p.add_argument("--saida", required=True)
    p = sub.add_parser("dif-video")
    p.add_argument("mp4")
    p.add_argument("--quadros", type=lambda s: [int(x) for x in s.split(",")], required=True)
    p.add_argument("--rotulo", required=True)
    p.add_argument("--miniaturas", required=True)
    p.add_argument("--saida", required=True)
    p.add_argument("--ganho", type=int, default=12)
    p = sub.add_parser("folha-contato")
    p.add_argument("--saida", required=True)
    p.add_argument("--video", action="append", required=True, help="rotulo=<mp4>")
    p.add_argument("--titulo", default="Folha de contato: um quadro por segundo")
    p = sub.add_parser("folha-diferencas")
    p.add_argument("--saida", required=True)
    p.add_argument("--stills", required=True)
    p.add_argument("--miniaturas", required=True)
    p.add_argument("--extra")
    p.add_argument("--reamostra")
    p.add_argument("--titulo", default="Folha de diferenças da regressão do guia pelo kit (K12)")
    a = ap.parse_args(argv)
    fn = {"eventos": cmd_eventos, "wav-bits": cmd_wav_bits, "audio": cmd_audio, "voz": cmd_voz, "telas": cmd_telas,
          "video": cmd_video, "lote": cmd_lote, "guarda-amostra": cmd_guarda_amostra, "reamostra": cmd_reamostra,
          "pares": cmd_pares, "periodico": cmd_periodico, "dif-video": cmd_dif_video,
          "folha-contato": cmd_folha_contato, "folha-diferencas": cmd_folha_diferencas}[a.cmd]
    return fn(a)


if __name__ == "__main__":
    comum.utf8()
    sys.exit(main(sys.argv[1:]))
