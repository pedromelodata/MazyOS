"""Recorta o fecho fixo "Vai, Legalizaí" da voz Dylan do guia. Pacote K03, DESENHO.md seções 1 (item 9), 4.7 e 8.

Uso (no PY, sempre com -B):
    python -B corta_fecho.py [--forca] [--sem-whisper]

Origem: GP/vo/narr-dylan.wav (só leitura; o md5 é conferido contra o REF). O recorte começa em 15,0 s e vai até
o primeiro trecho de 150 ms abaixo de -50 dB depois de 16,22 s (no máximo 17,0 s), com fade de saída de 12 ms.
Grava, pelo KIT/lib/escrita.py:
- vai-legalizai-dylan.wav (48 kHz, mono, 16 bits);
- fecho.json (seção 4.7): inicioNoOriginal, duracao, vai [0.01, 0.27] e legalizai [0.46, 1.22] (conferidos
  com o envelope e com o whisper), fimFricativaZ (fim da energia acima de 3,5 kHz do "z"), aiAcende 0.94 (no
  guia, ui.ai acende em 15,94 s), lufsFala (do recorte), refNarracaoLufs (narração do guia de 0 a 14,6 s),
  texto e voz, mais a conferência: o que o whisper small ouve no recorte (sem prompt; "Bye" no lugar de "Vai"
  é conhecido) e a correlação do recorte colado de volta em 15,0 s com o original de 15,0 a 16,6 s.
O whisper roda no PYW (KIT/voz/transcreve.py), chamado como subprocesso com -B.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(AQUI))
import numpy as np  # noqa: E402

import comum  # noqa: E402
from comum import ErroVoz, escrita, fmt  # noqa: E402

ORIGEM = os.path.join(comum.GP, "vo", "narr-dylan.wav")
ORIGEM_ROTULO = "GP/vo/narr-dylan.wav"
ID = comum.FECHO_PADRAO
WAV = ID + ".wav"
INICIO = 15.0
BUSCA_FIM_DE = 16.22
FIM_MAX = 17.0
QUIETO_DB = -50.0
QUIETO_S = 0.150
FADE_S = 0.012
REF_NARRACAO_ATE = 14.6
VAI = [0.01, 0.27]
LEGALIZAI = [0.46, 1.22]
AI_ACENDE = 0.94
CORTE_HF = 3500.0
COLAGEM_ATE = 16.6
TOLERANCIA_S = 0.02


def fim_do_corte(x, sr):
    """Começo do primeiro trecho de 150 ms em que todo quadro de 10 ms fica abaixo de -50 dB, a partir de 16,22 s."""
    db = comum.envelope_db(x, sr, 0.010, 0.001)  # quadro k cobre [k ms, k ms + 10 ms)
    largura = int(round((QUIETO_S - 0.010) * 1000)) + 1
    k0, kmax = int(round(BUSCA_FIM_DE * 1000)), int(round(FIM_MAX * 1000))
    for k in range(k0, kmax + 1):
        if k + largura > len(db):
            break
        if db[k:k + largura].max() < QUIETO_DB:
            return k / 1000.0, "primeiro trecho de 150 ms abaixo de -50 dB depois de 16,22 s"
    return FIM_MAX, "nenhum trecho de 150 ms abaixo de -50 dB até 17,0 s: corte no máximo"


def trechos_de_fala(y, sr, limiar=-40.0, juntar=0.080, minimo=0.030):
    """Trechos acima de -40 dB (quadros de 10 ms a cada 1 ms), juntando buracos menores que 80 ms."""
    db = comum.envelope_db(y, sr, 0.010, 0.001)
    acima = db > limiar
    trechos, k = [], 0
    while k < len(acima):
        if acima[k]:
            j = k
            while j < len(acima) and acima[j]:
                j += 1
            trechos.append([k, j - 1])
            k = j
        else:
            k += 1
    juntos = []
    for a, b in trechos:
        if juntos and (a - juntos[-1][1]) / 1000.0 < juntar:
            juntos[-1][1] = b
        else:
            juntos.append([a, b])
    # tempo = centro da janela de 10 ms
    return [[round(a / 1000.0 + 0.005, 3), round(b / 1000.0 + 0.005, 3)] for a, b in juntos
            if (b - a) / 1000.0 >= minimo]


def fricativa_z(y, sr, faixa):
    """Pico e fim da energia acima de 3,5 kHz (razão sobre o total, quadros Hann de 10 ms a cada 1 ms,
    suavizada em 5 ms) dentro do "Legalizaí": o fim é onde a razão cai 10 dB abaixo do pico."""
    jan, passo = int(0.010 * sr), int(0.001 * sr)
    win = np.hanning(jan)
    n = (len(y) - jan) // passo + 1
    fr = np.fft.rfftfreq(jan, 1.0 / sr)
    alto = fr >= CORTE_HF
    hf, tot = np.zeros(n), np.zeros(n)
    for k in range(n):
        s = np.abs(np.fft.rfft(y[k * passo:k * passo + jan] * win)) ** 2
        hf[k], tot[k] = s[alto].sum(), s.sum()
    nucleo = np.ones(5) / 5.0
    razao = 10 * np.log10((np.convolve(hf, nucleo, "same") + 1e-20) / (np.convolve(tot, nucleo, "same") + 1e-20))
    t = (np.arange(n) * passo + jan / 2.0) / sr
    dentro = np.where((t >= faixa[0]) & (t <= faixa[1]))[0]
    ip = int(dentro[np.argmax(razao[dentro])])
    j = ip
    while j < n - 1 and razao[j] > razao[ip] - 10.0:
        j += 1
    return round(float(t[ip]), 3), round(float(t[j]), 3), round(float(razao[ip]), 1)


def whisper_no_recorte(caminho):
    script = os.path.join(comum.VOZ, "transcreve.py")
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1", HF_HUB_OFFLINE="1", PYTHONIOENCODING="utf-8")
    r = subprocess.run([comum.PYW, "-B", script, caminho], capture_output=True, env=env)
    if r.returncode != 0:
        raise ErroVoz("o whisper não rodou no recorte: %s" % r.stderr.decode("utf-8", "replace").strip()[-400:])
    return json.loads(r.stdout.decode("utf-8"))


def corta(forca=False, com_whisper=True):
    destino_wav = os.path.join(AQUI, WAV)
    destino_json = os.path.join(AQUI, "fecho.json")
    comum.confere_destino(destino_wav, forca)
    comum.confere_destino(destino_json, forca)
    md5_origem = escrita.md5(ORIGEM)
    if md5_origem != comum.MD5_NARR_DYLAN_REF:
        raise ErroVoz("o %s mudou desde o REF (md5 %s, esperado %s): pare e avise" % (ORIGEM_ROTULO, md5_origem,
                                                                                     comum.MD5_NARR_DYLAN_REF))
    sr, ch, x16 = comum.le_wav16(ORIGEM)
    if sr != comum.SR or ch != 1:
        raise ErroVoz("o %s não é 48 kHz mono (%d Hz, %d canais)" % (ORIGEM_ROTULO, sr, ch))
    x16 = x16[:, 0]
    x = x16.astype(np.float64) / 32768.0
    fim, criterio = fim_do_corte(x, sr)
    i0, i1 = int(round(INICIO * sr)), int(round(fim * sr))
    y = x[i0:i1].copy()
    nf = int(round(FADE_S * sr))
    y[-nf:] *= np.linspace(1.0, 0.0, nf)
    y16, estouros = comum.para_int16(y)
    if estouros:
        raise ErroVoz("o recorte estourou (%d amostras)" % estouros)
    dur = len(y16) / sr

    # conferências
    trechos = trechos_de_fala(y16.astype(np.float64) / 32768.0, sr)
    if len(trechos) < 2:
        raise ErroVoz("o envelope do recorte não mostrou as duas palavras (achou %s)" % trechos)
    env_vai, env_leg = trechos[0], trechos[1]
    pico_z, fim_z, razao_z = fricativa_z(y16.astype(np.float64) / 32768.0, sr, LEGALIZAI)
    lufs_fala = comum.lufs(y16.astype(np.float32) / 32768.0, sr)
    ref_lufs = comum.lufs(x[:int(round(REF_NARRACAO_ATE * sr))].astype(np.float32), sr)
    colado = np.zeros(len(x))
    colado[i0:i0 + len(y16)] = y16 / 32768.0
    a, b = int(round(INICIO * sr)), int(round(COLAGEM_ATE * sr))
    corr = comum.pearson(colado[a:b], x[a:b])

    whisper = None
    if com_whisper:
        # o whisper ouve uma cópia temporária do recorte (no Temp do sistema, apagada logo depois)
        fd, tmp = tempfile.mkstemp(prefix="k03-fecho-", suffix=".wav")
        try:
            with os.fdopen(fd, "wb") as f:
                f.write(comum.wav_bytes(y16))
            w = whisper_no_recorte(tmp)
        finally:
            try:
                os.remove(tmp)
            except OSError:
                pass
        whisper = {"texto": w["texto"], "palavras": w["palavras"], "modelo": w.get("whisper")}
    escrita.grava_bytes(destino_wav, comum.wav_bytes(y16))

    def confere(medido, contrato):
        return abs(medido[0] - contrato[0]) <= TOLERANCIA_S and abs(medido[1] - contrato[1]) <= TOLERANCIA_S

    fj = {
        "id": ID,
        "arquivo": WAV,
        "origem": ORIGEM_ROTULO,
        "origemMd5": md5_origem,
        "inicioNoOriginal": INICIO,
        "fimNoOriginal": round(fim, 3),
        "duracao": round(dur, 3),
        "sr": sr,
        "canais": 1,
        "bits": 16,
        "amostras": int(len(y16)),
        "md5": escrita.md5(destino_wav),
        "vai": VAI,
        "legalizai": LEGALIZAI,
        "fimFricativaZ": fim_z,
        "aiAcende": AI_ACENDE,
        "lufsFala": lufs_fala,
        "refNarracaoLufs": ref_lufs,
        "texto": "Vai, Legalizaí",
        "voz": "Dylan (voice_change, preset %s)" % comum.PRESET_DYLAN,
        "corte": {"criterio": criterio, "fadeSaida_ms": int(round(FADE_S * 1000)),
                  "refNarracao": "LUFS do %s de 0 a %s s" % (ORIGEM_ROTULO, fmt(REF_NARRACAO_ATE, 1))},
        "conferencia": {
            "envelope": {"metodo": "acima de -40 dB, quadros de 10 ms a cada 1 ms (centro), buracos < 80 ms juntos",
                         "vai": env_vai, "legalizai": env_leg,
                         "confereVai": confere(env_vai, VAI), "confereLegalizai": confere(env_leg, LEGALIZAI)},
            "fricativaZ": {"metodo": "razão da energia acima de 3,5 kHz sobre o total, quadros Hann de 10 ms a cada "
                                     "1 ms, suavizada em 5 ms; fim onde cai 10 dB abaixo do pico",
                           "pico": pico_z, "razaoPicoDb": razao_z, "fim": fim_z},
            "aiAcende": "0,94 s: no guia (V4), ui.ai acende em 15,94 s, perto do pico da fricativa do 'z' "
                        "(%s s) e antes do fim dela (%s s)" % (fmt(pico_z, 3), fmt(fim_z, 3)),
            "whisper": whisper,
            "colagem": {"descricao": "recorte colado de volta em 15,0 s contra o %s de 15,0 a 16,6 s" % ORIGEM_ROTULO,
                        "correlacao": round(corr, 6)},
        },
        "notas": [
            "O texto exibido é sempre 'Vai, Legalizaí' (o nome, Legaliz-aí, rápido), venha o que vier do whisper.",
            "O que o whisper small sem prompt ouve depende do contexto: no recorte isolado, %s; no "
            "narr-dylan.wav inteiro do guia, 'vai legalizar i.' (alinhamento-kit.md de 02/10); numa gravação "
            "anterior ouvia 'Bye' no lugar do 'Vai'. Por isso o texto vem do roteiro e o whisper só confere o tempo."
            % (("'%s'" % whisper["texto"]) if whisper else "não conferido (--sem-whisper)"),
            "O arquivo fica ao lado deste fecho.json (campo arquivo, relativo a esta pasta).",
        ],
    }
    escrita.grava_json(destino_json, fj)
    return fj, destino_wav, destino_json


def _main(argv):
    comum.utf8()
    ap = argparse.ArgumentParser(description="Recorta o fecho 'Vai, Legalizaí' do GP/vo/narr-dylan.wav.")
    ap.add_argument("--forca", action="store_true", help="regrava o wav e o json que já existem")
    ap.add_argument("--sem-whisper", action="store_true", help="não confere com o whisper (não recomendado)")
    a = ap.parse_args(argv)
    try:
        fj, w, j = corta(a.forca, not a.sem_whisper)
    except (ErroVoz, escrita.EscritaRecusada, escrita.DiscoInsuficiente) as e:
        print("erro: %s" % e, file=sys.stderr)
        return 1
    c = fj["conferencia"]
    print("ok: %s e %s" % (comum.barra(w), comum.barra(j)))
    print("  recorte %s a %s s do %s (%s s, %d amostras); %s"
          % (fmt(fj["inicioNoOriginal"], 2), fmt(fj["fimNoOriginal"], 3), ORIGEM_ROTULO, fmt(fj["duracao"], 3),
             fj["amostras"], fj["corte"]["criterio"]))
    print("  envelope: vai %s, legalizai %s (contrato %s e %s)" % (c["envelope"]["vai"], c["envelope"]["legalizai"],
                                                                     fj["vai"], fj["legalizai"]))
    print("  fricativa do z: pico %s s, fim %s s; aiAcende %s s" % (fmt(c["fricativaZ"]["pico"], 3),
                                                                   fmt(fj["fimFricativaZ"], 3), fmt(fj["aiAcende"])))
    print("  loudness: fala do fecho %s LUFS; narração do guia (0 a 14,6 s) %s LUFS" % (fmt(fj["lufsFala"], 2),
                                                                                      fmt(fj["refNarracaoLufs"], 2)))
    if c["whisper"]:
        print("  whisper no recorte: %s" % " | ".join("%s %s-%s (p %s)" % (p["w"], fmt(p["s"]), fmt(p["e"]),
                                                                            fmt(p["p"])) for p in c["whisper"]["palavras"]))
    print("  colado de volta em 15,0 s contra o original (15,0 a 16,6 s): correlação %s"
          % fmt(c["colagem"]["correlacao"], 6))
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
