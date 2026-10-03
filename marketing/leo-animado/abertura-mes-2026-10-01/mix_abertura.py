# Mix do vídeo "Abertura do mês" (sem narração): trilha "Brand New Beginning" (Öman, Epidemic) a partir de 33,0 s
# (virada da música em 1,0 s do vídeo) + efeitos sintetizados nos tempos da linha do tempo GSAP (Abertura.tsx).
#   python mix_abertura.py  -> remotion/public-abertura/mix-abertura.wav (48 kHz, -14 LUFS, pico -1,5 dBTP)
import json, os, subprocess, sys
import numpy as np
sys.path.insert(0, r"C:\MKT-INSTA\Content Legalizai\marketing\leo-animado\precificacao-2026-10-02\src")
from sfx import (SR, Track, db, s_bubble, s_burst, s_check, s_chime, s_clack, s_pop, s_riser, s_swish, s_thump, s_tick, s_whoosh, band, tt, fade_in, rng)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = r"C:\MKT-INSTA\Content Legalizai\marketing\leo-animado\precificacao-2026-10-02\remotion\public-abertura\mix-abertura.wav"
DUR = 18.0
MUSIC = os.path.join(HERE, "audio", "trilha-brand-new-beginning.mp3")
START = 33.0

def s_paper(d=0.22):
    # papel deslizando: ruído filtrado com envelope curto
    n = int(d * SR); x = band(rng.standard_normal(n).astype(np.float32), 1800, 9000)
    env = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
    return fade_in((x * env).astype(np.float32), 2)

tr = Track(DUR); place = tr.place
# 1. gancho
place(s_riser(0.45, 420, 1250), 0.55, -31)
place(s_whoosh(0.34, 700, 8000), 0.98, -27)
place(s_paper(0.28), 1.02, -27)
place(s_burst(9, 0.3), 1.04, -29)
place(s_thump(120, 55, 0.25), 1.0, -27)
place(s_whoosh(0.3, 500, 6000), 2.68, -32)
# 2. comprovante + carimbo
place(s_whoosh(0.4, 400, 6000), 2.98, -29)
place(s_paper(0.3), 3.1, -30)
place(s_tick(2600), 3.55, -32)
place(s_swish(0.24), 4.05, -34)
place(s_thump(150, 60, 0.3), 4.5, -19)
place(s_clack(), 4.5, -22)
place(s_burst(8, 0.25), 4.53, -30)
place(s_whoosh(0.28, 600, 7000), 5.68, -33)
# 3. prova + pasta
place(s_swish(0.3), 6.55, -31)
place(s_pop(700, 300, 0.14, 26), 7.47, -26)
place(s_whoosh(0.32, 500, 6000), 7.95, -30)
place(s_pop(300, 140, 0.18, 18), 8.32, -22)
place(s_thump(110, 50, 0.22), 8.32, -29)
place(s_whoosh(0.3, 500, 6000), 8.68, -32)
# 4. dia 20
place(s_whoosh(0.42, 350, 5500), 8.98, -28)
place(s_thump(120, 55, 0.25), 9.55, -29)
place(s_check(), 10.0, -24)
place(s_burst(9, 0.3), 10.03, -30)
place(s_whoosh(0.3, 500, 6000), 11.72, -32)
# 5. app
place(s_whoosh(0.45, 300, 5000), 11.98, -28)
place(s_tick(2400), 12.55, -32)
place(s_paper(0.3), 13.0, -28)
place(s_chime(1568.0, 0.8), 13.5, -27)
place(s_pop(1200, 600, 0.09, 40), 13.5, -27)
place(s_burst(8, 0.25), 13.53, -31)
place(s_whoosh(0.3, 500, 6000), 14.72, -32)
# 6. CTA
place(s_whoosh(0.6, 250, 4000), 14.98, -30)
for k, f in enumerate([2093.0, 2637.0, 2349.0]):
    place(s_chime(f, 0.6), 15.6 + 0.45 * k, -36)
place(s_bubble(), 16.3, -24)
place(s_pop(1300, 700, 0.08, 45), 17.5, -31)

N = tr.N
mus = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{START:.3f}", "-i", MUSIC, "-t", f"{DUR + 0.2:.3f}", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                     capture_output=True, check=True).stdout
mus = np.frombuffer(mus, np.float32).copy()[:N]
mus = np.pad(mus, (0, N - len(mus)))
tf = np.arange(N) / SR
gain = db(-9.0) * np.clip(tf / 0.04, 0, 1) * np.clip((DUR - tf) / 0.8, 0, 1) ** 1.2
mix = mus * gain + tr.x
tmp = os.path.join(HERE, "out", "_mix_raw.wav"); os.makedirs(os.path.dirname(tmp), exist_ok=True)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_f32le", tmp], input=mix.astype(np.float32).tobytes(), check=True)
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", "loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
js = json.loads(m[m.rfind("{"): m.rfind("}") + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=9:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
      f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp, "-af", af, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", OUT], check=True)
os.remove(tmp)
print("mix ok:", OUT, "entrada I=%s" % js["input_i"])
