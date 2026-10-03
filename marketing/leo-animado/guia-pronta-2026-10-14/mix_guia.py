# Mix do reel "O app fazendo a guia do mês" (14/10), versão motion:
#   narração (clone de voz do Pedro, Higgsfield seed_audio, convertida pro timbre Dylan) + trilha "Talent in the Air"
#   (Diego Nava via Mixkit 473, Mixkit Stock Music Free License, sem crédito obrigatório; FONTES-musica-v2.md)
#   + efeitos do Pixabay, do Mixkit e sintetizados,
#   cada um no quadro do evento da coreografia (src/guia/coreografia.ts).
#   python mix_guia.py  -> remotion/public-guia/mix-guia.wav e audio/mix-guia.wav (48 kHz, -14 LUFS, pico -1,5 dBTP)
import json, os, shutil, subprocess, sys
import numpy as np
sys.path.insert(0, r"C:\MKT-INSTA\Content Legalizai\marketing\leo-animado\precificacao-2026-10-02\src")
from sfx import SR, Track, db, s_burst, s_chime, s_clack, s_pop, s_swish, s_thump, s_tick, s_whoosh, band, fade_in, rng

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = r"C:\MKT-INSTA\Content Legalizai\marketing\leo-animado\precificacao-2026-10-02\remotion\public-guia\mix-guia.wav"
OUT = os.path.join(HERE, "audio", "mix-guia.wav")
EXT = r"C:\MKT-INSTA\Content Legalizai\marketing\leo-animado\_assets-externos\pixabay"
MV2 = os.path.join(os.path.dirname(EXT), "musica-v2")
MIX = os.path.join(os.path.dirname(EXT), "mixkit", "sfx")
# Desenho de som. "v2": o da V2 que o Pedro aprovou (ele pediu a trilha da V2 inteira de volta em 02/10: música E
# efeitos). "auditoria": a versão enxuta de 01/10 (um clique só, whoosh invertido no flip, tiques do contador).
EFEITOS = "v2"
# Decisão do Pedro em 02/10: volta a "Talent in the Air" (01), a trilha da V2, mesmo depois da verificação de licença
# de 01/10 apontar que um terceiro relançou o mesmo áudio com ISRC próprio (QZNWR2003793; risco de reivindicação ou
# de áudio silenciado no Instagram). Antes de postar: subir não listado no YouTube e guardar print da licença.
# A "House One" (04) segue como alternativa verificada (render v3).
MUSIC = os.path.join(MV2, "01_talent-in-the-air_diego-nava_mixkit-473_122bpm.mp3")
# 122 BPM (batida a cada 0,4918 s): começando em 5,448 s a música para 2 tempos no "parte é só" (9,3 a 10,27 s) e
# volta com bumbo e acordes no tempo 1 em 10,30 s, o toque no "Pagar agora"; contratempo em 10,546
M_START = 5.448
DUR = 18.0


def carrega(path, af=None):
    cmd = ["ffmpeg", "-v", "error", "-i", path]
    if af:
        cmd += ["-af", af]
    cmd += ["-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).copy()


def fx(nome):
    return carrega(os.path.join(EXT, "sfx", nome))


def mk(nome):
    # efeitos do Mixkit usados na V2 (Mixkit Sound Effects Free License, sem crédito obrigatório; FONTES-mixkit.md)
    return carrega(os.path.join(MIX, nome))


def v2(nome, af=None):
    # efeitos que passaram na verificação independente de licença de 01/10 (Mixkit Sound Effects Free License)
    return carrega(os.path.join(MV2, "sfx", nome), af)


def s_papel(d=0.24):
    n = int(d * SR)
    x = band(rng.standard_normal(n).astype(np.float32), 1800, 9000)
    env = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
    return fade_in((x * env).astype(np.float32), 2)


def s_vibra(d=0.16):
    # vibração do relógio: zumbido grave com modulação, curto
    tt = np.arange(int(d * SR)) / SR
    x = np.sign(np.sin(2 * np.pi * 172 * tt)) * 0.6 + np.sin(2 * np.pi * 344 * tt) * 0.3
    am = 0.55 + 0.45 * np.sin(2 * np.pi * 28 * tt)
    env = np.minimum(1, tt / 0.01) * np.minimum(1, (d - tt) / 0.03)
    return band((x * am * env).astype(np.float32), 90, 2400)


def s_brilho(d=0.7):
    # brilho de varredura de luz: acordes agudos em glissando bem baixo
    tt = np.arange(int(d * SR)) / SR
    f = 2400 + 1800 * tt / d
    x = sum(np.sin(2 * np.pi * np.cumsum(f * k) / SR) / k for k in (1, 1.5, 2))
    env = np.sin(np.pi * tt / d) ** 2
    return (x * env).astype(np.float32)


def s_processa(t0, t1):
    # V2: "calculando", tiques suaves acelerando e subindo de tom, pra baixo da voz
    out = []
    t = t0
    while t < t1:
        u = (t - t0) / (t1 - t0)
        out.append((t, s_tick(2600 + 1600 * u), -40 + 6 * u))
        t += 0.11 - 0.06 * u
    return out


def s_conta(t0, d, n=16):
    # contador do valor (power3.out em `d` s, como na coreografia): um tique a cada 1/n do caminho, então eles
    # saem juntos no começo e vão espaçando até o valor assentar; tom descendo de leve, pra baixo da voz
    out = []
    ult = -1.0
    for k in range(1, n + 1):
        u = 1 - (1 - k / n) ** (1 / 3)  # inverso de power3.out
        t = t0 + d * u
        if t - ult < 0.035:  # tique colado no anterior vira um só
            continue
        ult = t
        out.append((t, s_tick(3400 - 900 * k / n), -41 + 3 * k / n))
    return out


tr = Track(DUR)
place = tr.place
# A. gancho
place(s_whoosh(0.5, 400, 6000), 0.0, -32)
place(s_brilho(0.75), 0.82, -38)
for i, tt in enumerate((1.84, 2.0, 2.16)):
    place(s_swish(0.13), tt, -37 - i)
# B. mergulho, app abre, calcula, navega, toca e a guia sai
place(fx("whoosh_whoosh-motion_dragon-studio_405445.mp3"), 3.52, -26)
place(fx("pop_ui-pop-up-1_floraphonic_197886.mp3"), 3.72, -29)
place(s_chime(1975.5, 0.6), 4.24, -35)
tiques = s_processa(4.3, 5.5) if EFEITOS == "v2" else s_conta(4.5, 0.9)  # "calcula"
for tt, sig, g in tiques:
    place(sig, tt, g)
place(fx("whoosh_movement-swipe-whoosh-3_floraphonic_186577.mp3"), 5.66, -30)
place(s_whoosh(0.45, 400, 7000), 6.12, -29)
place(s_papel(0.3), 6.18, -30)
# C. "pronta": a guia assenta no ar (sem carimbo na v2); relógio vibra e avisa
place(s_papel(0.22), 7.22, -33)
place(s_swish(0.3), 7.76, -32)
place(fx("whoosh_whoosh-motion_dragon-studio_405445.mp3"), 7.76, -29)
place(s_vibra(0.16), 8.04, -25)
place(s_vibra(0.18), 8.22, -26)
place(fx("ping_ping_dragon-studio_570438.mp3"), 8.07, -25)
# D. (v2) saem relógio e pílula, o iPhone faz um flip no ar, mergulho no card, toque no "pagar" e confirmação
place(s_swish(0.28), 8.93, -32)
if EFEITOS == "v2":
    # V2: whoosh curto do giro, mergulho no card, pouso macio, tique no "só", clique no "pagar" e confirmação
    place(mk("whoosh-flip_fast-small-sweep-transition_mixkit_166.wav"), 8.88, -27)
    place(mk("pouso_pillow-soft-hit_mixkit_1897.wav"), 9.7, -36)
    place(s_whoosh(0.5, 500, 7000), 9.62, -33)
    place(s_tick(2900), 10.12, -38)
    place(mk("clique_select-click_mixkit_1109.wav"), 10.29, -22)
    place(mk("sucesso_confirmation-tone_mixkit_2867.wav"), 10.42, -26)
else:
    # auditoria: whoosh invertido com o ataque seco em 9,18 (arrancada do giro), um clique só e a confirmação com a
    # nota 2 no contratempo (10,546), quando o check fecha
    place(v2("flip_fast-whoosh-transition_mixkit-1490.wav", "areverse"), 8.18, -27)
    place(v2("clique_cool-interface-click-tone_mixkit-2568.wav"), 10.30, -22)
    place(v2("verificado_confirmation-tone_mixkit-2867.wav"), 10.356, -26)
# E. a câmera abre mostrando a tela real verificada, varredura no "real", e o app fecha no splash com o link da bio
place(s_whoosh(0.55, 350, 6000), 10.95, -33)
place(s_brilho(0.7), 11.74, -36)
place(s_whoosh(0.45, 400, 6500), 13.45, -32)
# F. assinatura: o iPhone encolhe até o símbolo do logo, entra "Vai, Legalizaí", o "aí" acende, o link da bio
place(s_whoosh(0.45, 400, 7000)[::-1].copy(), 14.58, -31)          # encolhe (whoosh invertido, chega no símbolo)
place(s_pop(900, 420, 0.1, 34), 14.97, -29)                        # assinatura entra
place(fx("pop_ui-pop-sound_47313572_316482.mp3"), 15.3, -28)       # link da bio
place(s_chime(1567.98, 0.9), 15.96, -33)                           # o "aí" acende em coral, junto com a fala
place(s_chime(2093.0, 0.7), 16.0, -39)
place(s_swish(0.3), 16.95, -33)                                    # assinatura sai
# F. volta pra pose do quadro 0 (loop)
place(s_whoosh(0.6, 300, 5000), 17.05, -33)                       # o iPhone nasce do símbolo e volta pro quadro 0

N = tr.N
# narração: limpa grave, compressão leve, posição 0 (as palavras já estão no tempo do vídeo)
# voz: se já existir a narração convertida pro timbre Dylan (prepara_voz.py + voice_change), usa ela;
# senão, a narração original do clone do Pedro
VOZ = os.path.join(HERE, "vo", "narr-dylan.wav")
if not os.path.exists(VOZ):
    VOZ = os.path.join(HERE, "vo", "narr-pedro-raw.wav")
print("voz:", os.path.basename(VOZ))
vo = carrega(VOZ,
             "highpass=f=75,lowpass=f=14500,acompressor=threshold=0.08:ratio=2.2:attack=8:release=120:makeup=1.6")
voz = np.zeros(N, np.float32)
voz[: min(N, len(vo))] = vo[:N]
voz *= db(-1.0) / (np.abs(voz).max() + 1e-9)
# trilha a partir de M_START, com abaixamento sob a voz
mus = carrega(MUSIC)
i0 = int(M_START * SR)
mus = mus[i0 : i0 + N]
mus = np.pad(mus, (0, N - len(mus)))
hop = SR // 100
nfr = N // hop
ve = np.sqrt((voz[: nfr * hop].reshape(nfr, hop) ** 2).mean(1))
ativo = (ve > 0.02).astype(np.float32)
# ataque 40 ms, soltura 300 ms
duck = np.zeros(nfr, np.float32)
for i in range(nfr):
    alvo = ativo[i]
    k = 0.25 if alvo > duck[i - 1 if i else 0] else 0.033
    duck[i] = duck[i - 1 if i else 0] + (alvo - duck[i - 1 if i else 0]) * k
duck = np.repeat(duck, hop)
duck = np.pad(duck, (0, N - len(duck)), mode="edge")
tf = np.arange(N) / SR
gain = db(-9.0) * (1 - 0.55 * duck) * np.clip(tf / 0.03, 0, 1) * np.clip((DUR - tf) / 0.5, 0, 1)
mix = voz + mus * gain + tr.x

tmp = os.path.join(HERE, "audio", "_mix_raw.wav")
os.makedirs(os.path.dirname(tmp), exist_ok=True)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_f32le", tmp], input=mix.astype(np.float32).tobytes(), check=True)
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", "loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
js = json.loads(m[m.rfind("{"): m.rfind("}") + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=9:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
      f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp, "-af", af, "-ar", str(SR), "-ac", "2", "-c:a", "pcm_s16le", OUT], check=True)
os.remove(tmp)
shutil.copyfile(OUT, PUB)
print("mix ok:", OUT, "entrada I=%s" % js["input_i"])
