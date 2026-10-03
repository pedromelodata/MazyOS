"""Medição de uma trilha pro catálogo do kit de motion do Legalizaí (pacote K08).

Contrato: KIT/DESENHO.md, seções 4.9 (campos da trilha) e 12 (aquisições).
Só lê o arquivo; não grava nada. Saída: JSON no stdout com os campos do esquema de trilhas
(bpm, duracao, md5, tamanho, lufs, lra, picoDbtp, grade, secoes, pontos, janelas, tom e, com --voz, voz),
mais "medidas" com os números brutos e a sugestão dos 2 recortes da AudD.

Uso (sempre com python -B):
    python -B mede_trilha.py <arquivo> [--voz] [--compacto]

Como mede:
- BPM e grade: onset de graves (35 a 160 Hz) somado ao fluxo espectral (log da magnitude, só a parte que sobe),
  num STFT de 1024 pontos com passo de 128 amostras a 22,05 kHz (5,8 ms). Pente de 60 a 200 BPM sobre a
  autocorrelação do onset (múltiplos 1 a 8 do período, com preferência suave perto de 115 BPM pra escolher a
  oitava; sem pulso de graves, como piano e cordas, a preferência vai pra 80 BPM), refinado de 0,01 em 0,01 BPM pela dobra do onset no período. A fase (batida0) sai da dobra do
  envelope de graves em passos de 1 ms (subida mais íngreme) ou, sem grave marcado, da dobra do onset. O atraso
  de cada detector é calibrado numa faixa sintética com bumbos em instantes conhecidos (erro medido na saída).
- Tempo 1 (tempo1_0): as entradas e quedas de seção caem no tempo 1. Pra cada um dos 4 deslocamentos possíveis,
  soma as mudanças grandes de energia (cheia e graves) batida a batida; ganha o deslocamento com mais mudança.
  Sem mudança suficiente, usa o acento dos graves (confiança baixa). Testa compasso 3 contra 4.
- Seções: RMS em janelas de 2 s (a partir de 0 s), cheia e só graves; fronteira onde o nível muda 3 dB ou mais
  (ou o grave 6 dB); a fronteira é refinada num RMS de 50 ms e presa na batida mais próxima.
- Pontos: volta, drop, entrada e parada, com id "<tipo>-<t com 3 casas>" (t no tempo da batida). Paradas curtas
  (1 a 4 batidas com o nível 9 dB abaixo da vizinhança) também viram parada e volta.
- Sem janelas fixas: "janelas" sai vazio; o kit calcula o mStart pelo ponto (mStart = ponto.t - momento do vídeo).
- Loudness: ebur128 do ffmpeg (I, LRA e pico real). Tom: croma (55 Hz a 2 kHz) contra os perfis de
  Krumhansl, com a sugestão de transposição do 2867 (que é dó) na nota; transporVerificado fica null.
- --voz: VAD Silero do faster-whisper (venv do whisper, modelo small já em cache, sem initial_prompt e sem
  baixar nada) e, onde o VAD acusar fala, transcrição curta pra ver se sai palavra com probabilidade alta.
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

SR = 22050
NFFT = 1024
HOP = 128
FPS = SR / HOP
PYW = "C:/Projects/Legalizei_Videos/marketing/filme/escalada/tools/.venv/Scripts/python.exe"
NOMES = ["dó", "dó#", "ré", "ré#", "mi", "fá", "fá#", "sol", "sol#", "lá", "lá#", "si"]
MAIOR = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MENOR = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


def virgula(v, casas=2):
    return ("%.*f" % (casas, v)).replace(".", ",")


def db(v):
    """Variação em dB com sinal, sem casa decimal (ex.: '+6 dB', '-4 dB')."""
    return "%+d dB" % int(round(v))


ARTIGO = {"final": "o final", "silêncio": "o silêncio", "quebra": "a quebra", "média": "a seção média",
          "cheia": "a seção cheia", "intro": "a intro"}


# leitura

def md5(caminho):
    h = hashlib.md5()
    with open(caminho, "rb") as f:
        for bloco in iter(lambda: f.read(1 << 20), b""):
            h.update(bloco)
    return h.hexdigest()


def duracao_ffprobe(caminho):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", caminho],
                         capture_output=True, text=True, check=True).stdout
    return float(json.loads(out)["format"]["duration"])


def decodifica(caminho, sr=SR):
    cmd = ["ffmpeg", "-v", "error", "-i", caminho, "-vn", "-ac", "1", "-ar", str(sr), "-f", "f32le",
           "-acodec", "pcm_f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def loudness(caminho):
    e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", caminho, "-af", "ebur128=peak=true",
                        "-f", "null", "-"], capture_output=True, text=True).stderr
    resumo = e[e.rfind("Summary:"):] if "Summary:" in e else e

    def num(rx):
        m = re.search(rx, resumo)
        return float(m.group(1)) if m and m.group(1) not in ("-inf", "inf") else None

    return num(r"I:\s+(-?[\d.]+|-?inf) LUFS"), num(r"LRA:\s+(-?[\d.]+|-?inf) LU"), \
        num(r"Peak:\s+(-?[\d.]+|-?inf) dBFS")


# sinais auxiliares

def passa_faixa(x, lo, hi, borda_lo=15.0, borda_hi=70.0, sr=SR):
    """Passa-faixa de fase zero pela FFT, com bordas em cosseno (sem atraso)."""
    n = len(x)
    N = 1 << int(np.ceil(np.log2(n)))
    X = np.fft.rfft(x, N)
    f = np.fft.rfftfreq(N, 1 / sr)
    H = np.zeros_like(f)
    H[(f >= lo) & (f <= hi)] = 1.0
    sobe = (f >= lo - borda_lo) & (f < lo)
    H[sobe] = np.sin(0.5 * np.pi * (f[sobe] - (lo - borda_lo)) / borda_lo) ** 2
    desce = (f > hi) & (f <= hi + borda_hi)
    H[desce] = np.cos(0.5 * np.pi * (f[desce] - hi) / borda_hi) ** 2
    return np.fft.irfft(X * H, N)[:n]


def media_movel(v, n):
    if n <= 1:
        return v.copy()
    c = np.concatenate([[0.0], np.cumsum(v)])
    meio = n // 2
    idx = np.arange(len(v))
    lo = np.clip(idx - meio, 0, len(v))
    hi = np.clip(idx - meio + n, 0, len(v))
    return (c[hi] - c[lo]) / np.maximum(1, hi - lo)


def stft_mag(x, nfft=NFFT, hop=HOP):
    w = np.hanning(nfft)
    xp = np.concatenate([np.zeros(nfft // 2), x, np.zeros(nfft // 2)])
    n = 1 + (len(xp) - nfft) // hop
    out = np.empty((n, nfft // 2 + 1), np.float32)
    base = np.arange(nfft)[None, :]
    for s in range(0, n, 2048):
        idx = np.arange(s, min(n, s + 2048))
        quadros = xp[idx[:, None] * hop + base] * w
        out[idx] = np.abs(np.fft.rfft(quadros, axis=1)).astype(np.float32)
    return out


def funcao_onset(M):
    L = np.log1p(100.0 * M.astype(np.float64))
    d = np.diff(L, axis=0, prepend=L[:1])
    np.maximum(d, 0, out=d)
    f = np.fft.rfftfreq(NFFT, 1 / SR)
    graves = (f >= 35) & (f <= 160)
    o_cheio = d.sum(1)
    o_grave = d[:, graves].sum(1)
    o = o_grave / (o_grave.std() + 1e-9) + o_cheio / (o_cheio.std() + 1e-9)
    o = o - media_movel(o, int(0.4 * FPS))
    return np.maximum(o, 0)


def envelope_grave_ms(xg):
    """Envelope RMS de 5 ms do sinal (aqui, só de graves), amostrado a cada 1 ms."""
    e = np.sqrt(media_movel(xg ** 2, int(0.005 * SR)))
    passo = SR / 1000.0
    idx = (np.arange(int(len(xg) / passo)) * passo).astype(int)
    return e[idx]


def nivel_ms(env, a, b):
    a, b = max(0, int(round(a * 1000))), min(len(env), int(round(b * 1000)))
    if b <= a:
        return -120.0
    return float(20 * np.log10(np.sqrt(np.mean(env[a:b] ** 2)) + 1e-9))


def ataque_local(env, envg, t, subindo):
    """Quanto o nível (cheio + graves) sobe logo depois da batida t (ou cai, numa fronteira de queda)."""
    if subindo:
        return (nivel_ms(env, t, t + 0.08) - nivel_ms(env, t - 0.15, t - 0.02)) +             (nivel_ms(envg, t, t + 0.08) - nivel_ms(envg, t - 0.15, t - 0.02))
    return (nivel_ms(env, t - 0.25, t) - nivel_ms(env, t, t + 0.25)) +         (nivel_ms(envg, t - 0.25, t) - nivel_ms(envg, t, t + 0.25))


# tempo e grade

def autocorrelacao(o):
    o = o - o.mean()
    n = len(o)
    N = 1 << int(np.ceil(np.log2(2 * n)))
    F = np.fft.rfft(o, N)
    a = np.fft.irfft(F * np.conj(F), N)[:n]
    return a / (a[0] + 1e-12)


def pente(a, bpm):
    P = 60.0 / bpm * FPS
    ks = [k for k in range(1, 9) if k * P < len(a) - 2]
    if not ks:
        return 0.0
    return float(np.mean(np.interp([k * P for k in ks], np.arange(len(a)), a)))


def dobra(sinal, taxa, periodo, nfase=96, ini=0.0):
    """Média do sinal dobrado no período: devolve (perfil, fases em s)."""
    dur = len(sinal) / taxa
    nb = int((dur - ini - periodo) / periodo)
    if nb < 2:
        nb = 2
    fases = np.arange(nfase) / nfase * periodo
    t = ini + fases[:, None] + np.arange(nb)[None, :] * periodo
    v = np.interp(t * taxa, np.arange(len(sinal)), sinal)
    return v.mean(1), fases


def estima_tempo(o, centro=115.0):
    a = autocorrelacao(o)
    bpms = np.arange(60.0, 200.01, 0.5)
    prior = np.exp(-0.5 * (np.log2(bpms / centro) / 0.9) ** 2)
    cru = np.array([pente(a, b) for b in bpms])
    sc = cru * prior
    ordem = np.argsort(-sc)
    bpm0 = float(bpms[ordem[0]])
    # refino de 0,01 em 0,01 pela dobra do onset
    melhores = []
    for b in np.arange(bpm0 - 1.5, bpm0 + 1.5001, 0.01):
        perfil, _ = dobra(o, FPS, 60.0 / b, nfase=64)
        melhores.append((float(perfil.max() - perfil.mean()), b))
    melhores.sort(reverse=True)
    bpm = round(float(melhores[0][1]), 2)
    candidatos = []
    for alt in (bpm / 2, bpm * 2, bpm * 1.5, bpm / 1.5):
        if 60 <= alt <= 200:
            candidatos.append({"bpm": round(alt, 2), "pente": round(pente(a, alt), 3)})
    return bpm, round(pente(a, bpm), 3), candidatos


def fase_onset(o, periodo):
    perfil, fases = dobra(o, FPS, periodo, nfase=200)
    k = int(np.argmax(perfil))
    a, b, c = perfil[k - 1], perfil[k], perfil[(k + 1) % len(perfil)]
    d = 0.5 * (a - c) / (a - 2 * b + c) if (a - 2 * b + c) != 0 else 0.0
    nitidez = float((perfil.max() - perfil.mean()) / (perfil.std() + 1e-12))
    return float((fases[k] + d * (fases[1] - fases[0])) % periodo), nitidez


def fase_grave(env_ms, periodo):
    perfil, fases = dobra(env_ms, 1000.0, periodo, nfase=max(32, int(round(periodo * 1000))))
    sobe = np.roll(perfil, -1) - perfil
    k = int(np.argmax(sobe))
    nitidez = float((perfil.max() - perfil.min()) / (perfil.mean() + 1e-12))
    return float(fases[k] % periodo), nitidez


def faixa_sintetica(dur=30.0, bpm=120.0, t0=0.25):
    """Bumbo (queda de 120 a 50 Hz) em t0 + n*período, chimbal no contratempo e um pad: calibra os detectores."""
    rng = np.random.default_rng(7)
    n = int(dur * SR)
    x = np.zeros(n)
    P = 60.0 / bpm
    tk = np.arange(int(0.3 * SR)) / SR
    freq = 50 + 70 * np.exp(-tk / 0.03)
    fase = 2 * np.pi * np.cumsum(freq) / SR
    bumbo = np.sin(fase) * np.exp(-tk / 0.12)
    bumbo[:int(0.002 * SR)] += rng.normal(0, 0.3, int(0.002 * SR))
    chimbal = rng.normal(0, 1, int(0.04 * SR)) * np.exp(-np.arange(int(0.04 * SR)) / SR / 0.01)
    chimbal = np.diff(chimbal, prepend=0) * 0.15
    t = t0
    while t < dur - 0.3:
        i = int(round(t * SR))
        x[i:i + len(bumbo)] += 0.8 * bumbo[:n - i]
        j = int(round((t + P / 2) * SR))
        if j + len(chimbal) < n:
            x[j:j + len(chimbal)] += chimbal
        t += P
    tt = np.arange(n) / SR
    x += 0.05 * np.sin(2 * np.pi * 220 * tt) + 0.04 * np.sin(2 * np.pi * 330 * tt)
    return x, t0, P


def calibra():
    x, t0, P = faixa_sintetica()
    o = funcao_onset(stft_mag(x))
    fo, _ = fase_onset(o, P)
    fg, _ = fase_grave(envelope_grave_ms(passa_faixa(x, 35, 160)), P)

    def erro(f):
        d = (f - t0) % P
        return d - P if d > P / 2 else d

    return {"onset": round(erro(fo), 4), "grave": round(erro(fg), 4)}


def energia_batidas(x, xg, batidas):
    E, G = [], []
    for i in range(len(batidas) - 1):
        a, b = int(batidas[i] * SR), int(batidas[i + 1] * SR)
        if b <= a:
            E.append(-120.0)
            G.append(-120.0)
            continue
        E.append(10 * np.log10(np.mean(x[a:b] ** 2) + 1e-12))
        G.append(10 * np.log10(np.mean(xg[a:b] ** 2) + 1e-12))
    return np.array(E), np.array(G)


def mudancas_batida(E, G):
    """Mudança de nível batida a batida (dB), com teto, sem contar a saída do silêncio digital."""
    dE = np.diff(E, prepend=E[:1])
    dG = np.diff(G, prepend=G[:1])
    anterior = np.concatenate([[E[0]], E[:-1]])
    silencio = (E < -60) | (anterior < -60)
    dE[silencio] = 0
    dG[silencio] = 0
    return dE, dG


def com_teto(dE, dG):
    return np.clip(dE, -15, 15), np.clip(dG, -20, 20)


def acha_tempo1(bordas, dE, dG, o_bat):
    """Deslocamento do tempo 1. As fronteiras de subida (já presas na batida do ataque) pesam o dobro e as de
    queda, metade; depois entram as subidas batida a batida. Quedas valem um quarto: costumam vir antes do tempo 1."""
    dE, dG = com_teto(dE, dG)
    sobe = np.maximum(dE - 2.0, 0) + 0.7 * np.maximum(dG - 3.0, 0)
    cai = np.maximum(-dE - 2.0, 0) + 0.7 * np.maximum(-dG - 3.0, 0)
    peso = sobe + 0.25 * cai
    res = {}
    for m in (4, 3):
        sc = np.array([peso[r::m].sum() for r in range(m)], dtype=float)
        for b in bordas:
            sc[b["idx"] % m] += (2.0 if b["subindo"] else 0.5) * b["peso"]
        res[m] = sc
    s4, s3 = res[4], res[3]
    conc4 = s4.max() / (s4.mean() + 1e-9)
    conc3 = s3.max() / (s3.mean() + 1e-9)
    compasso = 3 if (conc3 > 1.3 * conc4 and s3.sum() > 20) else 4
    sc = res[compasso]
    total = float(sc.sum())
    r = int(np.argmax(sc))
    if total < 12.0:
        acento = np.array([o_bat[q::compasso].mean() if len(o_bat[q::compasso]) else 0 for q in range(compasso)])
        return int(np.argmax(acento)), compasso, "baixa", "sem mudança de seção suficiente; tempo 1 pelo acento dos graves"
    ordem = np.sort(sc)[::-1]
    razao = float(ordem[0] / (total + 1e-9))
    margem = float(ordem[0] / (ordem[1] + 1e-9))
    conf = "alta" if (razao >= 0.5 and margem >= 2.0) else ("media" if (razao >= 0.38 and margem >= 1.3) else "baixa")
    n_sobe = sum(1 for b in bordas if b["subindo"])
    if n_sobe <= 1 and conf == "alta":
        conf = "media"  # uma entrada só não basta pra confiança alta
    nota = ("tempo 1 pelas entradas e quedas de seção (%d fronteiras, %d de subida; %.0f%% do peso no deslocamento "
            "escolhido)" % (len(bordas), n_sobe, 100 * razao))
    if compasso == 3:
        nota += "; as mudanças se concentram de 3 em 3 batidas (compasso ternário provável)"
    return r, compasso, conf, nota


# seções e pontos

def rms_janelas_db(x, jan_s):
    n = int(jan_s * SR)
    k = len(x) // n
    r = list(np.sqrt((x[:k * n].reshape(k, n) ** 2).mean(1)))
    resto = x[k * n:]
    if len(resto) > 0.25 * n:
        r.append(np.sqrt(np.mean(resto ** 2)))
    return 20 * np.log10(np.array(r) + 1e-9)


def segmenta(x, xg, dur, batidas, dE, dG, env, envg):
    """Seções pelo RMS de 2 s; cada fronteira é refinada no RMS de 50 ms e presa na batida (até 2 batidas
    pra cada lado) onde o nível e o grave mais sobem logo depois da batida (ou mais caem, numa queda),
    medido no envelope de 1 ms."""
    R = rms_janelas_db(x, 2.0)
    G = rms_janelas_db(xg, 2.0)
    n = len(R)
    corte = [0]
    for i in range(1, n):
        if abs(R[i] - R[i - 1]) >= 3.0 or abs(G[i] - G[i - 1]) >= 6.0:
            corte.append(i)
    corte.append(n)
    segs = [[corte[k], corte[k + 1]] for k in range(len(corte) - 1) if corte[k + 1] > corte[k]]

    def nivel(sg):
        return float(np.mean(R[sg[0]:sg[1]])), float(np.mean(G[sg[0]:sg[1]]))

    mudou = True
    while mudou and len(segs) > 1:
        mudou = False
        for k in range(len(segs)):  # funde o que tem menos de 2 janelas (4 s) no vizinho mais parecido
            sg = segs[k]
            if sg[1] - sg[0] < 2 and 0 < k < len(segs) - 1:
                a = abs(nivel(segs[k - 1])[0] - nivel(sg)[0])
                b = abs(nivel(segs[k + 1])[0] - nivel(sg)[0])
                v = k - 1 if a <= b else k + 1
                lo, hi = min(v, k), max(v, k)
                segs[lo:hi + 1] = [[segs[lo][0], segs[hi][1]]]
                mudou = True
                break
        if mudou:
            continue
        for k in range(1, len(segs)):  # funde vizinhos com nível parecido
            (r1, g1), (r2, g2) = nivel(segs[k - 1]), nivel(segs[k])
            if abs(r1 - r2) < 2.5 and abs(g1 - g2) < 4.0:
                segs[k - 1:k + 1] = [[segs[k - 1][0], segs[k][1]]]
                mudou = True
                break
    fino = rms_janelas_db(x, 0.05)
    fino_g = rms_janelas_db(xg, 0.05)
    bordas = []
    for k in range(1, len(segs)):
        i = segs[k][0]
        (ra, ga), (rb, gb) = nivel(segs[k - 1]), nivel(segs[k])
        subindo = (rb - ra) + 0.5 * (gb - ga) > 0
        lo, hi = max(1, int((2 * i - 2.5) / 0.05)), min(len(fino) - 20, int((2 * i + 2.5) / 0.05))
        melhor, tm = 0.0, 2.0 * i
        for j in range(lo, max(lo + 1, hi)):
            v = abs(np.mean(fino[j:j + 20]) - np.mean(fino[max(0, j - 20):j])) + \
                0.5 * abs(np.mean(fino_g[j:j + 20]) - np.mean(fino_g[max(0, j - 20):j]))
            if v > melhor:
                melhor, tm = v, j * 0.05
        i0 = int(np.argmin(np.abs(batidas - tm)))
        cand = list(range(max(1, i0 - 2), min(len(dE) - 1, i0 + 2) + 1)) or [i0]
        muda = [ataque_local(env, envg, float(batidas[c]), subindo) for c in cand]
        im = cand[int(np.argmax(muda))]
        peso = min(abs(rb - ra), 15.0) + 0.5 * min(abs(gb - ga), 20.0)
        bordas.append({"k": k, "idx": im, "t": float(batidas[im]), "tGrosso": tm, "peso": peso, "subindo": subindo})
    # fronteiras fora de ordem (duas presas na mesma batida): funde as seções
    k = 1
    while k < len(bordas):
        if bordas[k]["t"] <= bordas[k - 1]["t"]:
            j = bordas[k]["k"]
            segs[j - 1:j + 1] = [[segs[j - 1][0], segs[j][1]]]
            del bordas[k]
            for b in bordas[k:]:
                b["k"] -= 1
        else:
            k += 1
    med_r = float(np.median(R))
    med_g = float(np.median(G))
    niveis = [nivel(sg) for sg in segs]
    cheias = [k for k, (r, g) in enumerate(niveis) if r >= med_r - 2]
    primeira = cheias[0] if cheias else 0
    ultima = cheias[-1] if cheias else len(segs) - 1
    rot = []
    for k in range(len(segs)):
        r, g = niveis[k]
        if r < -60:
            nome = "silêncio"
        elif k < primeira and r < med_r - 2:
            nome = "intro"
        elif k > ultima and r < med_r - 2:
            nome = "final"
        elif r < med_r - 5:
            nome = "quebra"
        elif r < med_r - 2:
            nome = "média"
        else:
            nome = "cheia"
        rot.append({"nome": nome, "r": r, "g": g, "semGrave": g < med_g - 12})
    return {"R": R, "G": G, "rot": rot, "bordas": bordas, "dur": dur}


def monta_secoes_pontos(sg, batidas, tempos1, periodo, E):
    rot, bordas, dur = sg["rot"], sg["bordas"], sg["dur"]
    ts = [0.0] + [b["t"] for b in bordas] + [dur]

    def eh_tempo1(t):
        return bool(len(tempos1)) and bool(np.min(np.abs(tempos1 - t)) < 1e-6)

    compasso = int(round((tempos1[1] - tempos1[0]) / periodo)) if len(tempos1) > 1 else 4

    def onde_cai(t):
        if eh_tempo1(t):
            return "no tempo 1"
        k = int(round((t - tempos1[0]) / periodo)) % compasso if len(tempos1) else 0
        prox = tempos1[tempos1 > t + 1e-6]
        extra = (" (antecipa o tempo 1 de %s)" % virgula(float(prox[0]), 3)) if (len(prox) and k == compasso - 1) else ""
        return "na batida %d do compasso%s" % (k + 1, extra)

    secoes = []
    for k, r in enumerate(rot):
        desc = "%s (%s dB; graves %s dB%s)" % (r["nome"], virgula(r["r"], 0), virgula(r["g"], 0),
                                              ", sem grave" if r["semGrave"] else "")
        secoes.append({"de": round(ts[k], 3), "ate": round(ts[k + 1], 3), "desc": desc, "_rot": r["nome"]})
    pontos = []
    for b in bordas:
        a, c = rot[b["k"] - 1], rot[b["k"]]
        dr, dg = c["r"] - a["r"], c["g"] - a["g"]
        t = b["t"]
        onde = onde_cai(t)
        forca = min(abs(dr), 40) + 0.5 * min(abs(dg), 40)
        if dr >= 4.0 or dg >= 8.0:
            if a["nome"] == "silêncio":
                tipo, desc = "entrada", "primeiro som %s (%s)" % (onde, ARTIGO.get(c["nome"], c["nome"]))
            elif a["nome"] == "intro":
                tipo = "entrada"
                desc = "entra %s depois da intro %s (%s; graves %s)" % (
                    ARTIGO.get(c["nome"], c["nome"]), onde, db(dr), db(dg))
            elif dg >= 18.0 and (a["semGrave"] or a["nome"] == "quebra"):
                tipo = "drop"
                desc = "drop: o grave entra %s depois d%s (%s no grave; %s no total)" % (
                    onde, ARTIGO.get(a["nome"], a["nome"]), db(dg), db(dr))
            elif a["nome"] in ("quebra", "média"):
                tipo = "volta"
                desc = "a banda volta depois d%s %s (%s; graves %s)" % (ARTIGO.get(a["nome"], a["nome"]), onde, db(dr),
                                                                     db(dg))
            else:
                tipo = "entrada"
                desc = "entra %s %s (%s; graves %s)" % (ARTIGO.get(c["nome"], c["nome"]), onde, db(dr), db(dg))
            pontos.append({"t": t, "tipo": tipo, "desc": desc, "_forca": forca})
        elif dr <= -6.0:
            if c["nome"] == "silêncio":
                desc = "o som acaba %s (cai pro silêncio)" % onde
            else:
                desc = "o nível cai %s (%s; graves %s): começa %s" % (onde, db(dr), db(dg), ARTIGO.get(c["nome"], c["nome"]))
            pontos.append({"t": t, "tipo": "parada", "desc": desc, "_forca": forca})
    # paradas curtas (1 a 4 batidas) pela energia batida a batida
    if len(E) > 20:
        ref = np.array([np.median(np.concatenate([E[max(0, i - 8):i], E[i + 1:i + 9]])) for i in range(len(E))])
        baixo = E < ref - 9.0
        i = 1
        while i < len(E) - 1:
            if baixo[i] and not baixo[i - 1] and E[i - 1] >= ref[i - 1] - 3 and E[i - 1] > -60:
                j = i
                while j < len(E) and baixo[j]:
                    j += 1
                if 1 <= j - i <= 4 and j < len(E) and E[j] >= ref[j] - 3 and E[j] > -60:
                    prof = float(np.max(ref[i:j] - E[i:j]))
                    t1, t2 = float(batidas[i]), float(batidas[j])
                    plural = "s" if j - i > 1 else ""
                    pontos.append({"t": t1, "tipo": "parada", "desc": "parada de %d batida%s (%s)" % (
                        j - i, plural, db(-prof)), "_forca": prof})
                    pontos.append({"t": t2, "tipo": "volta", "desc": "volta depois da parada de %d batida%s, %s" % (
                        j - i, plural, onde_cai(t2)), "_forca": prof + 1})
                i = j
            else:
                i += 1
    pontos.sort(key=lambda p: -p["_forca"])
    escolhidos = []
    for p in pontos:
        if all(abs(p["t"] - q["t"]) > 0.5 * periodo for q in escolhidos):
            escolhidos.append(p)
        if len(escolhidos) >= 14:
            break
    escolhidos.sort(key=lambda p: p["t"])
    saida = [{"id": "%s-%.3f" % (p["tipo"], p["t"]), "t": round(p["t"], 3), "tipo": p["tipo"], "desc": p["desc"]}
             for p in escolhidos]
    return secoes, saida


def recortes_audd(secoes, dur, n=2, jan=20.0):
    boas = [(s["de"], s["ate"]) for s in secoes if s["_rot"] in ("cheia", "média")]

    def cabe(s, lista):
        return any(a <= s and s + jan <= b for a, b in lista)

    cand = [s for s in range(8, int(dur - jan - 8) + 1) if cabe(s, boas)]
    if len(cand) < 2:
        cand = [s for s in range(8, int(dur - jan - 8) + 1)]
    if not cand:
        return [0]
    alvo1, alvo2 = 0.3 * dur, 0.68 * dur
    s1 = min(cand, key=lambda s: abs(s - alvo1))
    resto = [s for s in cand if abs(s - s1) >= 30]
    if not resto:
        resto = [s for s in cand if abs(s - s1) >= jan] or [s1]
    s2 = min(resto, key=lambda s: abs(s - alvo2))
    return sorted({int(s1), int(s2)})[:n]


# tom

def tom(x):
    nfft, hop = 8192, 4096
    w = np.hanning(nfft)
    f = np.fft.rfftfreq(nfft, 1 / SR)
    ok = (f >= 55) & (f <= 2000)
    pc = (np.round(12 * np.log2(f[ok] / 440.0) + 69).astype(int)) % 12
    quadros = []
    for s in range(0, len(x) - nfft, hop):
        X = np.abs(np.fft.rfft(x[s:s + nfft] * w))[ok] ** 2
        c = np.zeros(12)
        np.add.at(c, pc, X)
        quadros.append(c)
    if not quadros:
        return None
    C = np.array(quadros)
    en = C.sum(1)
    C = C[en >= np.median(en)]
    croma = (C / (C.sum(1, keepdims=True) + 1e-12)).sum(0)
    res = []
    for t in range(12):
        res.append((float(np.corrcoef(croma, np.roll(MAIOR, t))[0, 1]), t, "maior"))
        res.append((float(np.corrcoef(croma, np.roll(MENOR, t))[0, 1]), t, "menor"))
    res.sort(reverse=True)
    r, t, modo = res[0]
    triade = {t, (t + (4 if modo == "maior" else 3)) % 12, (t + 7) % 12}
    if 0 in triade:
        sug = "o 2867 (dó) cabe no tom original"
    else:
        s = t if t <= 6 else t - 12
        sug = "sugestão: o 2867 %s %d semitons (dó vira %s); testar no ouvido" % (
            "sobe" if s > 0 else "desce", abs(s), nome_nota(t, "maior"))
    seg = res[1]
    return {"texto": "%s %s" % (nome_nota(t, modo), modo), "conf": round(r, 2), "naJanela": None,
            "transporVerificado": None,
            "nota": "tom por croma (potência de 55 Hz a 2 kHz, perfis de Krumhansl); segundo candidato: %s %s (%s). %s"
                    % (nome_nota(seg[1], seg[2]), seg[2], virgula(seg[0]), sug)}


def nome_nota(pc, modo):
    bemol_maior = {1: "réb", 3: "mib", 8: "láb", 10: "sib"}
    bemol_menor = {3: "mib", 10: "sib"}
    tab = bemol_maior if modo == "maior" else bemol_menor
    return tab.get(pc, NOMES[pc])


# voz

VOZ_SCRIPT = r'''
import json, subprocess, sys
import numpy as np
from faster_whisper.vad import get_speech_timestamps, VadOptions
arq = sys.argv[1]
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", arq, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
a = np.frombuffer(raw, np.float32).copy()
ts = get_speech_timestamps(a, VadOptions(threshold=0.5, min_speech_duration_ms=250, min_silence_duration_ms=500))
fala = sum(t["end"] - t["start"] for t in ts) / 16000.0
dur = len(a) / 16000.0
res = {"segmentos": len(ts), "falaS": round(fala, 2), "fracao": round(fala / max(dur, 1e-9), 3), "palavras": []}
if ts:
    from faster_whisper import WhisperModel
    m = WhisperModel("small", device="cpu", compute_type="int8", local_files_only=True)
    pedacos, total = [], 0.0
    for t in sorted(ts, key=lambda t: t["start"] - t["end"])[:6]:
        s, e = t["start"], min(t["end"], t["start"] + 8 * 16000)
        pedacos.append(a[s:e]); total += (e - s) / 16000.0
        if total > 30: break
    clip = np.concatenate([np.concatenate([p, np.zeros(8000, np.float32)]) for p in pedacos])
    segs, info = m.transcribe(clip, word_timestamps=True, vad_filter=False, condition_on_previous_text=False)
    for sg in segs:
        for w in (sg.words or []):
            res["palavras"].append({"w": w.word.strip(), "p": round(float(w.probability), 2)})
    res["idioma"] = info.language
print(json.dumps(res, ensure_ascii=False))
'''


def mede_voz(caminho):
    if not os.path.isfile(PYW):
        return {"presente": None, "metodo": "não medido (venv do whisper ausente)"}
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1", HF_HUB_OFFLINE="1")
    r = subprocess.run([PYW, "-B", "-c", VOZ_SCRIPT, caminho], capture_output=True, text=True, env=env,
                       encoding="utf-8", errors="replace")
    if r.returncode != 0:
        return {"presente": None, "metodo": "VAD falhou: %s" % r.stderr.strip()[-300:]}
    j = json.loads(r.stdout.strip().splitlines()[-1])
    fortes = [w for w in j.get("palavras", []) if w["p"] >= 0.6 and re.search(r"\w", w["w"])]
    presente = j["fracao"] >= 0.15 and len(fortes) >= 3
    duvida = (j["fracao"] >= 0.05 or len(fortes) >= 2) and not presente
    metodo = ("VAD Silero do faster-whisper: %s s de fala provável (%s%% da faixa, %d trechos); whisper small sem "
              "prompt nesses trechos: %d palavras com probabilidade de 0,6 ou mais%s. Não ouvido por gente."
              % (virgula(j["falaS"], 1), virgula(100 * j["fracao"], 1), j["segmentos"], len(fortes),
                 (" (" + ", ".join(w["w"] for w in fortes[:6]) + ")") if fortes else ""))
    return {"presente": True if presente else (None if duvida else False), "metodo": metodo,
            "vad": {k: v for k, v in j.items() if k != "palavras"}, "palavrasFortes": len(fortes)}


# principal

def mede(caminho, com_voz=False):
    x = decodifica(caminho)
    dur = duracao_ffprobe(caminho)
    xg = passa_faixa(x, 35, 160)
    M = stft_mag(x)
    o = funcao_onset(M)
    bpm, forca_pente, candidatos = estima_tempo(o)
    env_ms = envelope_grave_ms(xg)
    fg, nit_g = fase_grave(env_ms, 60.0 / bpm)
    centro = 115.0
    if nit_g < 0.5:
        # sem pulso de graves (piano, cordas, ambiente): a oitava mais lenta é a mais provável
        centro = 80.0
        bpm, forca_pente, candidatos = estima_tempo(o, centro)
        fg, nit_g = fase_grave(env_ms, 60.0 / bpm)
    periodo = 60.0 / bpm
    cal = calibra()
    fo, nit_o = fase_onset(o, periodo)
    fo_c = (fo - cal["onset"]) % periodo
    fg_c = (fg - cal["grave"]) % periodo
    dif = (fg_c - fo_c) % periodo
    dif = dif - periodo if dif > periodo / 2 else dif
    if nit_g >= 0.6 and abs(dif) <= 0.03:
        batida0, metodo_fase = fg_c, "fase pelo envelope de graves (1 ms)"
    else:
        batida0, metodo_fase = fo_c, "fase pelo onset (5,8 ms)"
    batidas = np.arange(batida0, dur + periodo, periodo)
    E, Gb = energia_batidas(x, xg, batidas)
    dE, dG = mudancas_batida(E, Gb)
    o_bat = np.interp(batidas * FPS, np.arange(len(o)), o)[:len(E)]
    env_cheio = envelope_grave_ms(x)
    sg = segmenta(x, xg, dur, batidas, dE, dG, env_cheio, env_ms)
    r, compasso, conf, nota_t1 = acha_tempo1(sg["bordas"], dE, dG, o_bat)
    tempo1 = (batida0 + r * periodo) % (compasso * periodo)
    tempos1 = np.arange(tempo1, dur + periodo, compasso * periodo)
    # os tempos 1 são batidas da grade (a menos de arredondamento)
    tempos1 = np.array([batidas[int(np.argmin(np.abs(batidas - t)))] for t in tempos1])
    secoes, pontos = monta_secoes_pontos(sg, batidas, tempos1, periodo, E)
    R2, G2 = sg["R"], sg["G"]
    rec = recortes_audd(secoes, dur)
    lufs, lra, tp = loudness(caminho)
    t = tom(x)
    out = {
        "arquivo": os.path.abspath(caminho).replace("\\", "/"),
        "md5": md5(caminho),
        "tamanho": os.path.getsize(caminho),
        "duracao": round(dur, 3),
        "bpm": bpm,
        "lufs": lufs,
        "lra": lra,
        "picoDbtp": tp,
        "grade": {
            "batida0": round(batida0, 3),
            "periodo": round(periodo, 4),
            "tempo1_0": round(tempo1, 3),
            "compasso": compasso,
            "confianca": conf,
            "nota": "%s; %s; calibração na faixa sintética: erro de %s ms (onset) e %s ms (graves), já descontado"
                    % (metodo_fase, nota_t1, virgula(1000 * cal["onset"], 1), virgula(1000 * cal["grave"], 1)),
        },
        "secoes": [{k: v for k, v in s.items() if not k.startswith("_")} for s in secoes],
        "pontos": pontos,
        "janelas": [],
        "tom": t,
        "medidas": {
            "energia2s": [round(float(v)) for v in R2],
            "graves2s": [round(float(v)) for v in G2],
            "bpmCandidatos": candidatos,
            "forcaPente": forca_pente,
            "centroPreferencia": centro,
            "nitidezOnset": round(nit_o, 2),
            "nitidezGraves": round(nit_g, 2),
            "calibracao": cal,
            "recortesAudd": rec,
            "medidoPor": "KIT/aquisicoes/mede_trilha.py",
        },
    }
    if com_voz:
        out["voz"] = mede_voz(caminho)
    return out


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    ap = argparse.ArgumentParser(prog="mede_trilha.py", description="Mede uma trilha (JSON no stdout).")
    ap.add_argument("arquivo")
    ap.add_argument("--voz", action="store_true", help="roda o VAD do faster-whisper (venv do whisper)")
    ap.add_argument("--compacto", action="store_true", help="JSON numa linha")
    a = ap.parse_args(argv)
    if not os.path.isfile(a.arquivo):
        print("arquivo não existe: %s" % a.arquivo, file=sys.stderr)
        return 1
    print(json.dumps(mede(a.arquivo, a.voz), ensure_ascii=False, indent=None if a.compacto else 2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
