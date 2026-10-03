# Prepara a troca de voz pro timbre "Dylan" (a mesma voz do vídeo de precificação, 30/09), quando houver crédito:
#   1. gerar no Higgsfield (seed_audio, clone Pedro-Legalizai) a frase do fecho "Vai, legaliza aí." e salvar em
#      vo/fecho-pedro-raw.wav (custa 0,2 crédito);
#   2. python prepara_voz.py  -> vo/narr-completa.wav (narração + fecho em 15,0 s, 17,5 s no total)
#                               e vo/para-voz.mp4 (vídeo preto leve com esse áudio, pra subir no voice_change);
#   3. voice_change no Higgsfield com o preset Dylan (b847bc29-f184-583a-8ad9-d1f1e16d1a60), cerca de 2 créditos;
#      o voice_change mantém o tempo exato, então nada da edição muda;
#   4. salvar o áudio devolvido como vo/narr-dylan.wav e rodar mix_guia.py (ele usa a voz do Dylan se existir).
import os, subprocess
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
DUR = 18.0
T_FECHO = 15.0  # início da fala "Vai, legaliza aí." (o "aí" acende em coral em 15,62 s; conferir a tônica no whisper)


def carrega(p):
    b = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(b, np.float32).copy()


n = int(DUR * SR)
voz = np.zeros(n, np.float32)
narr = carrega(os.path.join(HERE, "vo", "narr-pedro-raw.wav"))
voz[: min(n, len(narr))] = narr[:n]
fecho_p = os.path.join(HERE, "vo", "fecho-pedro-raw.wav")
fecho2_p = os.path.join(HERE, "vo", "fecho2-pedro-raw.wav")
if os.path.exists(fecho_p) and os.path.exists(fecho2_p):
    # o Pedro pediu "Vai, Legalizaí" (o nome: "Legaliz-aí"), rápido. A gravação "Vai, Legalizaí!" tem o nome certo numa
    # palavra só, mas o "Vai" saiu curto e fraco (o whisper ouviu "Bye") e com 0,73 s de pausa; então junta o "Vai," bem
    # dito da gravação anterior ("Vai, legaliza aí!") com o "Legalizaí" novo, respiro de 0,1 s, e acelera 8%.
    def trecho(x, a, b):
        y = x[int(a * SR): int(b * SR)].copy()
        r = int(0.012 * SR)
        y[:r] *= np.linspace(0, 1, r)
        y[-r:] *= np.linspace(1, 0, r)
        return y
    f1 = carrega(fecho_p)
    f2 = carrega(fecho2_p)
    vai = trecho(f1, 0.40, 0.76)
    legalizai = trecho(f2, 1.28, 2.13)
    junto = np.concatenate([vai, np.zeros(int(0.10 * SR), np.float32), legalizai])
    tmp_in = os.path.join(HERE, "vo", "_fecho_in.wav")
    tmp_out = os.path.join(HERE, "vo", "_fecho_rapido.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", tmp_in], input=junto.tobytes(), check=True)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp_in, "-af", "atempo=1.08", tmp_out], check=True)
    f = carrega(tmp_out)
    os.remove(tmp_in); os.remove(tmp_out)
    print("fecho: %.2f s; 'Legalizaí' começa em +%.2f s" % (len(f) / SR, (len(vai) + 0.10 * SR) / SR / 1.08))
    a = int(T_FECHO * SR)
    b = min(n, a + len(f))
    voz[a:b] += f[: b - a]
else:
    print("aviso: falta a gravação do fecho; sai só a narração")
out_wav = os.path.join(HERE, "vo", "narr-completa.wav")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_s16le", out_wav],
               input=voz.tobytes(), check=True)
out_mp4 = os.path.join(HERE, "vo", "para-voz.mp4")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", f"color=c=black:s=360x640:r=30:d={DUR}", "-i", out_wav,
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", out_mp4], check=True)
print("ok:", out_wav, out_mp4)
