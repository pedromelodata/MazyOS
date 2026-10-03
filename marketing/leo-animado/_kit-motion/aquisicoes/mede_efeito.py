"""Medição de um efeito sonoro pro catálogo do kit de motion do Legalizaí (pacote K08).

Contrato: KIT/DESENHO.md, seções 4.3 (âncora de sincronia) e 4.9 (campos do efeito).
Só lê o arquivo; não grava nada. Saída: JSON no stdout com os campos do esquema de efeitos.

Uso (sempre com python -B):
    python -B mede_efeito.py <arquivo> [--modo ataque|pico|inicio] [--categoria <c>] [--compacto]

Campos medidos:
- duracao (s), sr, canais, codec (ffprobe), md5 e tamanho;
- inicioSom_ms: primeiro instante em que o envelope RMS de 5 ms passa de (máximo - 40 dB);
- sincronia_ms: o instante do arquivo que cai no evento. Modo "ataque": a primeira subida de pelo menos
  6 dB em 10 ms (o ponto em que a subida chega a 3 dB do topo dela); modo "pico": o pico de energia do
  envelope (whoosh, swoosh, riser, papel deslizando); modo "inicio": o começo do som (ambiente, room tone).
  Sem --modo, o modo sai da categoria (tabela MODO_POR_CATEGORIA);
- fim_ms: último instante acima de (máximo - 40 dB);
- picoDbfs (amostra), truePeakDbtp (ebur128 do ffmpeg), crista_db (pico menos o maior RMS de 50 ms);
- nota: frequência dominante pela FFT, com nome da nota em pt-BR e desvio em cents (ou "não tonal");
- banda: porcentagem da energia abaixo de 300 Hz, de 300 Hz a 2 kHz, de 2 a 6 kHz e acima de 6 kHz, e o centróide;
- estereo: correlação L/R e perda de nível quando o mix soma em mono (-ac 1);
- medidas: os números brutos (ataques, picos espectrais, segmentos de nota, -20 dB, planura, periodicidade).
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys

import numpy as np

sys.dont_write_bytecode = True

NOMES = ["dó", "dó#", "ré", "ré#", "mi", "fá", "fá#", "sol", "sol#", "lá", "lá#", "si"]
LETRAS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

# modo de sincronia padrão por categoria (seção 4.3: âncora "sincronia")
MODO_POR_CATEGORIA = {
    "toque": "ataque", "clique": "ataque", "digitacao": "ataque", "apagar": "ataque", "notificacao": "ataque",
    "erro": "ataque", "obturador": "ataque", "caneta": "ataque", "toggle": "ataque", "rolagem": "ataque",
    "bipe": "ataque", "impacto": "ataque", "papel-amassando": "ataque", "carimbo": "ataque", "pop": "ataque",
    "verificado": "ataque", "sucesso": "ataque",
    "swoosh": "pico", "whoosh": "pico", "riser": "pico", "swell": "pico", "papel-deslizando": "pico",
    "papel-virando": "pico", "papel": "pico", "envelope": "pico", "impressora": "inicio",
    "ambiente": "inicio", "room-tone": "inicio",
}


def nota(f):
    if not f or f <= 0:
        return None
    n = 12 * np.log2(f / 440.0) + 69
    r = int(round(n))
    c = int(round((n - r) * 100))
    return "%s%d %s %+dc" % (LETRAS[r % 12], r // 12 - 1, NOMES[r % 12], c)


def sonda(caminho):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
                          "stream=sample_rate,channels,codec_name:format=duration", "-of", "json", caminho],
                         capture_output=True, text=True, check=True).stdout
    j = json.loads(out)
    st = j["streams"][0]
    return int(st["sample_rate"]), int(st["channels"]), st.get("codec_name"), float(j["format"]["duration"])


def decodifica(caminho, canais):
    cmd = ["ffmpeg", "-v", "error", "-i", caminho, "-vn", "-f", "f32le", "-acodec", "pcm_f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy().reshape(-1, canais)


def pico_real(caminho):
    e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", caminho, "-af", "ebur128=peak=true",
                        "-f", "null", "-"], capture_output=True, text=True).stderr
    m = re.findall(r"Peak:\s+(-?inf|-?[\d.]+) dBFS", e)
    return float(m[-1]) if m and m[-1] not in ("-inf", "inf") else None


def md5(caminho):
    h = hashlib.md5()
    with open(caminho, "rb") as f:
        for bloco in iter(lambda: f.read(1 << 20), b""):
            h.update(bloco)
    return h.hexdigest()


def envelope_db(p, sr, janela_ms=5, passo_ms=1):
    n = len(p)
    passo = max(1, int(sr * passo_ms / 1000))
    jan = max(2, int(sr * janela_ms / 1000))
    c = np.concatenate([[0.0], np.cumsum(p, dtype=np.float64)])
    idx = np.arange(0, n, passo)
    lo = np.maximum(0, idx - jan // 2)
    hi = np.minimum(n, idx + jan // 2)
    rms = np.sqrt((c[hi] - c[lo]) / np.maximum(1, hi - lo))
    return 20 * np.log10(rms + 1e-12), idx / sr


def ataques(e, t, emax, faixa=25.0, subida=6.0, separa=0.03):
    """Subidas de pelo menos `subida` dB em 10 ms (passo de 1 ms), acima de (emax - faixa)."""
    k = 10
    sobe = np.full_like(e, -99.0)
    if len(e) > k:
        minimo = np.lib.stride_tricks.sliding_window_view(e, k)[:-1].min(1)
        sobe[k:] = e[k:] - minimo[:len(e) - k]
    out = []
    i = k
    while i < len(e):
        if sobe[i] >= subida and e[i] > emax - faixa:
            j = i
            while j + 1 < len(e) and e[j + 1] >= e[j]:
                j += 1
            a = i - k + int(np.argmax(e[i - k:j + 1] >= e[j] - 3))
            if not out or t[a] - out[-1][0] >= separa:
                out.append((float(t[a]), float(sobe[i]), float(e[j])))
            i = j + int(separa * 1000)
        else:
            i += 1
    return out


def espectro(m, sr, i0, i1, nfft=4096):
    seg = m[i0:i1]
    if len(seg) < nfft:
        seg = np.pad(seg, (0, nfft - len(seg)))
    passo = nfft // 4
    w = np.hanning(nfft)
    quadros = [np.abs(np.fft.rfft(seg[s:s + nfft] * w)) ** 2 for s in range(0, len(seg) - nfft + 1, passo)]
    return np.array(quadros), np.fft.rfftfreq(nfft, 1 / sr), passo


def picos_espectrais(spec, f, n=6, piso_db=-30, fmin=60, fmax=16000):
    s = 10 * np.log10(spec + 1e-20)
    ok = (f >= fmin) & (f <= fmax)
    if not ok.any():
        return []
    smax = s[ok].max()
    res = []
    for i in range(2, len(s) - 2):
        if ok[i] and s[i] > s[i - 1] and s[i] >= s[i + 1] and s[i] > s[i - 2] and s[i] >= s[i + 2] \
                and s[i] > smax + piso_db:
            a, b, c = s[i - 1], s[i], s[i + 1]
            d = 0.5 * (a - c) / (a - 2 * b + c) if (a - 2 * b + c) != 0 else 0
            res.append((float(f[i] + d * (f[1] - f[0])), float(b - smax)))
    res.sort(key=lambda r: -r[1])
    return res[:n]


def mede(caminho, modo=None, categoria=None):
    sr, canais, codec, dur_fmt = sonda(caminho)
    x = decodifica(caminho, canais)
    n = len(x)
    dur = n / sr
    pad = int(0.02 * sr)  # 20 ms de silêncio na frente, pra pegar ataque no quadro 0
    off = pad / sr
    x = np.vstack([np.zeros((pad, canais), x.dtype), x])
    pico = float(np.abs(x).max())
    pico_db = 20 * np.log10(pico + 1e-12)
    p = (x.astype(np.float64) ** 2).mean(1)
    w50 = int(0.05 * sr)
    c50 = np.concatenate([[0.0], np.cumsum(p)])
    rms50 = np.sqrt((c50[w50:] - c50[:-w50]) / w50).max() if len(p) > w50 else np.sqrt(c50[-1] / max(1, len(p)))
    crista = float(pico_db - 20 * np.log10(rms50 + 1e-12))
    m = x.mean(1).astype(np.float64)
    e, t = envelope_db(p, sr)
    t = t - off
    emax = float(e.max())
    t_pico = float(t[int(e.argmax())])
    a40 = np.where(e > emax - 40)[0]
    a20 = np.where(e > emax - 20)[0]
    ini40, ini20 = float(t[a40[0]]), float(t[a20[0]])
    fim40, fim20 = float(t[a40[-1]]), float(t[a20[-1]])
    ats = ataques(e, t, emax)
    if canais >= 2:
        L, R = x[:, 0].astype(np.float64), x[:, 1].astype(np.float64)
        corr = float(np.dot(L, R) / (np.sqrt(np.dot(L, L) * np.dot(R, R)) + 1e-20))
        perda_mono = float(10 * np.log10((m ** 2).sum() / (p.sum() + 1e-20) + 1e-20))
    else:
        corr, perda_mono = 1.0, 0.0
    # espectro na parte ativa (até 30 dB abaixo do máximo do envelope)
    i0 = int((ini40 + off) * sr)
    i1 = max(i0 + 512, int((float(t[np.where(e > emax - 30)[0][-1]]) + off + 0.005) * sr))
    nfft = 4096 if (i1 - i0) >= 4096 else 2048
    P, f, passo = espectro(m, sr, i0, i1, nfft)
    fe = P.sum(1)
    ativos = fe > fe.max() * 10 ** (-25 / 10)
    Pm = P[ativos].mean(0)
    tot = Pm[f >= 20].sum() + 1e-20
    bandas = {
        "<300": float(Pm[(f >= 20) & (f < 300)].sum() / tot * 100),
        "300-2k": float(Pm[(f >= 300) & (f < 2000)].sum() / tot * 100),
        "2k-6k": float(Pm[(f >= 2000) & (f < 6000)].sum() / tot * 100),
        ">6k": float(Pm[f >= 6000].sum() / tot * 100),
    }
    centroide = float((Pm * f).sum() / (Pm.sum() + 1e-20))
    faixa = (f >= 100) & (f <= min(12000, sr / 2 - 100))
    planuras = []
    for k in np.where(ativos)[0]:
        s = P[k][faixa] + 1e-20
        planuras.append(float(np.exp(np.log(s).mean()) / s.mean()))
    pk = picos_espectrais(Pm, f, n=6)
    mascara = np.zeros_like(f, bool)
    df = f[1] - f[0]
    for fr, _ in pk:
        j = int(round(fr / df))
        mascara[max(0, j - 2):j + 3] = True
    picosidade = float(Pm[mascara & (f >= 60)].sum() / (Pm[f >= 60].sum() + 1e-20))
    planura = float(np.median(planuras)) if planuras else None
    # notas no tempo: frequência dominante por quadro
    tq = (np.arange(len(P)) * passo + nfft / 2) / sr + i0 / sr - off
    dom = []
    for k in range(len(P)):
        if not ativos[k]:
            dom.append(None)
            continue
        pp = picos_espectrais(P[k], f, n=1, piso_db=-10)
        dom.append(pp[0][0] if pp else None)
    segs, cur = [], None
    for k, d in enumerate(dom):
        if d is None:
            if cur:
                segs.append(cur)
            cur = None
            continue
        if cur and abs(d / cur["f"] - 1) < 0.03:
            cur["fs"].append(d)
            cur["f"] = float(np.median(cur["fs"]))
        else:
            if cur:
                segs.append(cur)
            cur = {"t": float(tq[k] - nfft / 2 / sr), "f": d, "fs": [d]}
    if cur:
        segs.append(cur)
    segmentos = [{"t_ms": round(max(0.0, s_["t"]) * 1000), "hz": round(s_["f"], 1), "nota": nota(s_["f"])}
                 for s_ in segs if len(s_["fs"]) >= 2]
    periodicidade = None
    if dur > 2.5:
        el = 10 ** (e / 20)
        el = el - el.mean()
        n_el = len(el)
        N = 1 << int(np.ceil(np.log2(2 * n_el)))
        F = np.fft.rfft(el, N)
        ac = np.fft.irfft(F * np.conj(F), N)[:n_el]
        lo, hi = 200, min(len(ac) - 1, 1600)
        if hi > lo and ac[0] > 0:
            j = lo + int(np.argmax(ac[lo:hi]))
            periodicidade = {"periodo_s": round(j * 0.001, 3), "bpm": round(60 / (j * 0.001), 1),
                             "forca": round(float(ac[j] / ac[0]), 2)}
    # nota: tonal quando a energia se concentra em poucos picos
    tonal = picosidade >= 0.5 and pk
    if tonal:
        f0 = pk[0][0]
        txt_nota = "%s (%.0f Hz)" % (nota(f0), f0)
        if len(pk) > 1:
            txt_nota += "; parciais em " + ", ".join("%.0f" % a for a, _ in pk[1:4]) + " Hz"
    else:
        txt_nota = "não tonal; centróide ~%.0f Hz" % centroide
    # sincronia
    modo_usado = modo or MODO_POR_CATEGORIA.get((categoria or "").casefold(), "ataque")
    if modo_usado == "ataque":
        sinc = ats[0][0] if ats else t_pico
        if not ats:
            modo_usado = "pico (sem subida de 6 dB em 10 ms)"
    elif modo_usado == "pico":
        sinc = t_pico
    else:
        sinc = ini40
    sinc = max(0.0, sinc)
    return {
        "arquivo": os.path.abspath(caminho).replace("\\", "/"),
        "md5": md5(caminho),
        "tamanho": os.path.getsize(caminho),
        "duracao": round(dur, 3),
        "duracaoFormato": round(dur_fmt, 3),
        "sr": sr,
        "canais": canais,
        "codec": codec,
        "inicioSom_ms": round(max(0.0, ini40) * 1000),
        "sincronia_ms": round(sinc * 1000),
        "modoSincronia": modo_usado,
        "fim_ms": round(fim40 * 1000),
        "picoDbfs": round(pico_db, 2),
        "truePeakDbtp": pico_real(caminho),
        "crista_db": round(crista, 1),
        "nota": txt_nota,
        "banda": {"pct": {k: round(v) for k, v in bandas.items()}, "centroide_hz": round(centroide)},
        "estereo": {"corr": round(corr, 3), "perdaMono_db": round(perda_mono, 2)},
        "medidas": {
            "inicio_ms_-20": round(ini20 * 1000), "pico_env_ms": round(t_pico * 1000),
            "fim_ms_-20": round(fim20 * 1000), "env_max_db": round(emax, 1),
            "ataques": [{"ms": round(a[0] * 1000), "subida_db": round(a[1], 1), "nivel_db": round(a[2], 1)}
                        for a in ats[:10]],
            "n_ataques": len(ats),
            "picos": [{"hz": round(a, 1), "db": round(b, 1), "nota": nota(a)} for a, b in pk],
            "segmentos": segmentos[:8],
            "planura": round(planura, 3) if planura is not None else None,
            "picosidade": round(picosidade, 2),
            "periodicidade": periodicidade,
        },
    }


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    ap = argparse.ArgumentParser(prog="mede_efeito.py", description="Mede um efeito sonoro (JSON no stdout).")
    ap.add_argument("arquivo")
    ap.add_argument("--modo", choices=["ataque", "pico", "inicio"])
    ap.add_argument("--categoria")
    ap.add_argument("--compacto", action="store_true", help="JSON numa linha")
    a = ap.parse_args(argv)
    if not os.path.isfile(a.arquivo):
        print("arquivo não existe: %s" % a.arquivo, file=sys.stderr)
        return 1
    r = mede(a.arquivo, a.modo, a.categoria)
    print(json.dumps(r, ensure_ascii=False, indent=None if a.compacto else 2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
