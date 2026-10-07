"""Prepara uma tomada inteira pro voice_change, como o prepara.py do kit: mono 48 kHz (baixa só o necessário se a
mistura passar de 0,98 de pico), mp4 preto 360x640 a 30 fps com a voz em AAC 192k e o vídeo 0,5 s mais longo que a
voz, +faststart. Nada é cortado nem acelerado.
Uso: PYW -B voz-v8/prepara.py <tomada.wav>   (grava <tomada>-mono.wav e <tomada>-para-voz.mp4)"""
import os, subprocess, sys, wave
import numpy as np

SR = 48000
ent = sys.argv[1]
base = os.path.splitext(ent)[0]
r = subprocess.run(["ffmpeg", "-v", "error", "-i", ent, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True)
x = np.frombuffer(r.stdout, np.float32).copy()
pico = float(np.abs(x).max())
if pico > 0.98:
    x *= 0.98 / pico
    print(f"pico da mistura mono {pico:.3f}: abaixado pra 0,98")
mono = base + "-mono.wav"
with wave.open(mono, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
dur = len(x) / SR
mp4 = base + "-para-voz.mp4"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=c=black:s=360x640:r=30:d={dur + 0.5:.3f}",
                "-i", mono, "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "1", "-movflags", "+faststart", mp4], check=True)
print(f"{mono} ({dur:.2f} s)\n{mp4}")
