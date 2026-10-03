# Reel animado do Léo: "3 sinais de que você já pode cobrar mais caro" (peça de 02/10, pilar 16).
# Compõe cada quadro em memória (PIL/numpy) e manda em rawvideo pro ffmpeg; nenhuma sequência de PNG.
#   python render.py                 -> vídeo mudo em out/leo-video.mp4
#   python render.py --qc 0.5        -> folha de contato (um quadro a cada 0,5 s) em qa/
#   python render.py --frames 3.3,9.5 -> quadros soltos em qa/
import json, math, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.abspath(os.path.join(ROOT, "..", "..", ".."))
P = lambda *a: os.path.join(ROOT, *a)

W, H, FPS = 1080, 1920, 30
BG = (250, 248, 245)       # papel #FAF8F5
INK = (27, 30, 36)         # #1B1E24
INK2 = (82, 78, 72)        # #524E48
CORAL = (242, 100, 60)     # #F2643C (forma/ilustração)
CORAL6 = (221, 78, 39)     # #DD4E27 (palavra de destaque)
CORAL7 = (184, 61, 28)     # #B83D1C (texto da tag)
TINT = (254, 243, 238)     # #FEF3EE
HAIR = (227, 222, 215)     # #E3DED7
ALT = (241, 238, 233)      # #F1EEE9
WHITE = (255, 255, 255)
FONT = r"C:\Users\EDIT-ADMIN\AppData\Local\Microsoft\Windows\Fonts\Sora-wght.ttf"

# ---------------------------------------------------------------- utilidades
_fc = {}
def font(size, wght=800):
    k = (int(size), wght)
    if k not in _fc:
        f = ImageFont.truetype(FONT, int(size))
        f.set_variation_by_axes([wght])
        _fc[k] = f
    return _fc[k]

def clamp01(x): return 0.0 if x < 0 else 1.0 if x > 1 else x
def lerp(a, b, t): return a + (b - a) * t
def out_cubic(t): t = clamp01(t); return 1 - (1 - t) ** 3
def in_out_cubic(t):
    t = clamp01(t)
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2
def out_back(t, s=1.9):
    t = clamp01(t); t -= 1
    return 1 + (s + 1) * t ** 3 + s * t ** 2
def smooth(t): t = clamp01(t); return t * t * (3 - 2 * t)

SS = 3  # supersampling dos desenhos vetoriais

def rrect(size, radius, fill, outline=None, width=0):
    """Retângulo arredondado anti-aliased (desenhado em SSx e reduzido)."""
    w, h = size
    im = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w * SS - 1, h * SS - 1), radius * SS, fill=fill,
                        outline=outline, width=int(width * SS))
    return im.resize((w, h), Image.LANCZOS)

def shadow_of(sprite, blur=18, alpha=0.10, grow=0):
    a = sprite.split()[-1]
    pad = blur * 3
    base = Image.new("L", (sprite.width + 2 * pad, sprite.height + 2 * pad), 0)
    base.paste(a, (pad, pad))
    base = base.filter(ImageFilter.GaussianBlur(blur))
    sh = Image.new("RGBA", base.size, INK + (0,))
    sh.putalpha(base.point(lambda v: int(v * alpha)))
    return sh, pad

def with_shadow(sprite, blur=18, alpha=0.10, dy=10):
    sh, pad = shadow_of(sprite, blur, alpha)
    out = Image.new("RGBA", sh.size, (0, 0, 0, 0))
    out.alpha_composite(sh, (0, dy))
    out.alpha_composite(sprite, (pad, pad))
    out.info["pad"] = pad
    return out

def text_sprite(s, size, color, wght=800, track=0.0):
    """Texto com caixa de altura fixa por tamanho (ascendente + descendente): todas as palavras do
    mesmo tamanho dividem a mesma linha de base, guardada em im.info['base']."""
    f = font(size, wght)
    asc, desc = f.getmetrics()
    hgt = asc + desc + 8
    if track == 0:
        l, t, r, b = f.getbbox(s, anchor="ls")
        im = Image.new("RGBA", (r - l + 8, hgt), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((4 - l, 4 + asc), s, font=f, fill=color, anchor="ls")
    else:  # letter-spacing manual
        widths = [f.getlength(c) for c in s]
        tw = int(sum(widths) + track * size * (len(s) - 1)) + 8
        im = Image.new("RGBA", (tw, hgt), (0, 0, 0, 0))
        d = ImageDraw.Draw(im); x = 4
        for c, wd in zip(s, widths):
            d.text((x, 4 + asc), c, font=f, fill=color, anchor="ls"); x += wd + track * size
    im.info["base"] = 4 + asc
    return im

def ink_box(tx):
    return tx.getchannel("A").getbbox()

def put_center(im, tx, cx, cy):
    """Cola o texto com o centro da TINTA (não da caixa) em (cx, cy)."""
    x0, y0, x1, y1 = ink_box(tx)
    im.alpha_composite(tx, (max(0, int(round(cx - (x0 + x1) / 2))), max(0, int(round(cy - (y0 + y1) / 2)))))

def put_left(im, tx, x, cy):
    x0, y0, x1, y1 = ink_box(tx)
    im.alpha_composite(tx, (max(0, int(round(x - x0))), max(0, int(round(cy - (y0 + y1) / 2)))))

def ink_size(tx):
    x0, y0, x1, y1 = ink_box(tx); return x1 - x0, y1 - y0

def paste(canvas, sprite, cx, cy, scale=1.0, alpha=1.0, rot=0.0):
    """Cola sprite centrado em (cx, cy) com escala, opacidade e rotação."""
    if alpha <= 0.003 or scale <= 0.01: return
    sp = sprite
    if abs(scale - 1) > 1e-3:
        sp = sp.resize((max(1, round(sp.width * scale)), max(1, round(sp.height * scale))), Image.BICUBIC)
    if abs(rot) > 0.05:
        sp = sp.rotate(rot, resample=Image.BICUBIC, expand=True)
    if alpha < 0.999:
        a = sp.split()[-1].point(lambda v: int(v * alpha))
        sp = sp.copy(); sp.putalpha(a)
    x = int(round(cx - sp.width / 2)); y = int(round(cy - sp.height / 2))
    canvas.alpha_composite(sp, (x, y)) if (x >= 0 and y >= 0 and x + sp.width <= W and y + sp.height <= H) \
        else _paste_clip(canvas, sp, x, y)

def _paste_clip(canvas, sp, x, y):
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(W, x + sp.width), min(H, y + sp.height)
    if x1 <= x0 or y1 <= y0: return
    canvas.alpha_composite(sp.crop((x0 - x, y0 - y, x1 - x, y1 - y)), (x0, y0))

def pop(t, t0, dur=0.24, s0=0.55, over=1.9):
    """(escala, alfa, dy) de uma entrada com overshoot."""
    p = (t - t0) / dur
    if p <= 0: return 0.0, 0.0, 0.0
    sc = lerp(s0, 1.0, out_back(p, over))
    return sc, clamp01(p / 0.35), (1 - out_cubic(p)) * 26

def leave(t, t1, dur=0.18):
    """fator de saída (1 -> 0) a partir de t1."""
    if t < t1: return 1.0
    return 1 - out_cubic((t - t1) / dur)

# ---------------------------------------------------------------- narração e palavras
def load_audio(path, sr=48000):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)

def silences(x, sr=48000, thr=-40, mind=0.08):
    hop = 480; n = len(x) // hop
    db = 20 * np.log10(np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, 1)) + 1e-9)
    s = db < thr; out = []; i = 0
    while i < n:
        if s[i]:
            j = i
            while j < n and s[j]: j += 1
            if (j - i) * hop / sr >= mind: out.append((i * hop / sr, j * hop / sr))
            i = j
        else: i += 1
    return out

def words_refined():
    ws = json.load(open(P("vo", "words-leo.json"), encoding="utf-8"))
    sil = silences(load_audio(P("vo", "narr-leo.wav")))
    for w in ws:
        for a, b in sil:
            if a - 0.01 <= w["s"] < b - 0.02:
                w["s"] = b
    for i in range(len(ws) - 1):
        ws[i]["e"] = max(ws[i]["e"], ws[i]["s"] + 0.05)
    return ws

WORDS = words_refined()
T = lambda i: WORDS[i]["s"]          # início da palavra i
TE = lambda i: WORDS[i]["e"]
NARR_END = TE(len(WORDS) - 1)
END_T0 = NARR_END + 0.18             # começa o cartão final
DUR = END_T0 + 1.95                  # duração total

# ---------------------------------------------------------------- Léo (takes)
TAKES = json.load(open(P("vo", "takes.json")))
OFFS = {}
if os.path.exists(P("takes", "offsets.json")):
    OFFS = json.load(open(P("takes", "offsets.json")))

class TakeReader:
    """Decodifica o take inteiro pra memória (rgb24) e tira as piscadas em excesso (olhos_fix)."""
    def __init__(self, path, name=None):
        info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                          "stream=width,height,r_frame_rate", "-of", "json", path],
                                         capture_output=True, check=True).stdout)["streams"][0]
        self.w, self.h = info["width"], info["height"]
        num, den = map(int, info["r_frame_rate"].split("/")); self.fps = num / den
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                             capture_output=True, check=True).stdout
        self.frames = np.frombuffer(raw, np.uint8).reshape(-1, self.h, self.w, 3)
        if name:
            import olhos_fix
            self.frames = olhos_fix.fix(name, self.frames, self.fps)
    def at(self, tau):
        i = int(round(tau * self.fps))
        return self.frames[min(max(i, 0), len(self.frames) - 1)]

_takes = {}
HERO = None
def take_reader(name):
    if name not in _takes:
        p = P("takes", f"{name}.mp4")
        _takes[name] = TakeReader(p, name) if os.path.exists(p) else None
    return _takes[name]

def leo_frame(t):
    """Quadro do Léo (numpy HxWx3, 720x1280) no tempo global t."""
    global HERO
    for k, tk in enumerate(TAKES):
        last = k == len(TAKES) - 1
        if t < tk["fim"] or last:
            rd = take_reader(tk["take"])
            if rd is None:
                if HERO is None:
                    HERO = np.asarray(Image.open(P("hero", "hero-1080.png")).convert("RGB").resize((720, 1280), Image.LANCZOS))
                return HERO
            tau = t - tk["ini"] + tk["pre"] + OFFS.get(tk["take"], 0.0)
            return rd.at(tau)

# fundo: modelo plano por canal tirado das bordas vazias, corrigido só nos tons quase brancos
_yy, _xx = None, None
def normalize_bg(fr):
    global _yy, _xx
    h, w, _ = fr.shape
    a = fr.astype(np.float32)
    if _yy is None:
        _yy, _xx = np.mgrid[0:h, 0:w].astype(np.float32)
    m = np.zeros((h, w), bool)
    m[: int(h * 0.19), :] = True
    sub = np.zeros_like(m); sub[::6, ::6] = True
    sel = m & sub
    ys, xs = _yy[sel], _xx[sel]
    A = np.stack([np.ones_like(xs), xs / w, ys / h], 1)
    vals = a[sel]
    lumv = vals.mean(1)
    ok = lumv > 200  # ignora pelo/objeto que invada a borda
    cor = np.median(vals[ok], axis=0) if ok.any() else np.array(BG, np.float32)
    model = cor[None, None, :].astype(np.float32)
    bgl = float(np.mean(cor))
    lum = a.mean(2, keepdims=True)
    wgt = np.clip((lum - 205) / max(bgl - 205, 1), 0, 1); wgt = wgt * wgt * (3 - 2 * wgt)
    out = a + (np.array(BG, np.float32)[None, None, :] - model) * wgt
    return np.clip(out, 0, 255).astype(np.uint8)

# layouts: escala s (1 = take cheio em 1080x1920), centro x e deslocamento vertical (take ancorado na base)
LAYOUT = {
    "HOOK":   dict(s=0.86, cx=540, dy=95),
    "RIGHT":  dict(s=0.80, cx=745, dy=0),
    "LEFT":   dict(s=0.80, cx=335, dy=0),
    "CENTER": dict(s=0.84, cx=540, dy=0),
    "CLOSE":  dict(s=1.12, cx=540, dy=265),
    "END":    dict(s=0.72, cx=540, dy=0),
}

def seq():
    return [  # (tempo em que o layout já está no lugar, layout)
        (0.0, "HOOK"),
        (T(10), "RIGHT"),     # Um
        (T(17), "LEFT"),      # Dois
        (T(25), "RIGHT"),     # Três
        (T(35), "CENTER"),    # Bateu dois?
        (T(42), "CLOSE"),     # Cobrar mais é...
        (T(51), "RIGHT"),     # E no app...
        (T(70), "CENTER"),    # Comenta aqui
        (END_T0 + 0.10, "END"),
    ]
SEQ = seq()
TR = 0.40  # duração da troca de layout (termina no início da frase)

PUNCH = [T(9), T(13), T(21), T(29), T(41), T(50), T(60), T(76)]  # palavras de destaque

def leo_transform(t):
    cur = SEQ[0][1]; prev = cur; k = 0.0; seg_t0 = 0.0
    for i, (ts, name) in enumerate(SEQ):
        if t >= ts - TR:
            prev = SEQ[i - 1][1] if i > 0 else name
            cur = name; k = in_out_cubic((t - (ts - TR)) / TR); seg_t0 = ts
    a, b = LAYOUT[prev], LAYOUT[cur]
    s = lerp(a["s"], b["s"], k); cx = lerp(a["cx"], b["cx"], k); dy = lerp(a["dy"], b["dy"], k)
    # respiração de câmera: push-in lento dentro de cada layout
    nxt = [ts for ts, _ in SEQ if ts > seg_t0]
    seg_len = (nxt[0] - seg_t0) if nxt else 2.0
    s *= 1 + 0.025 * clamp01((t - seg_t0) / max(seg_len, 0.5))
    for tp in PUNCH:  # soco curto na palavra forte
        d = t - tp
        if 0 <= d < 0.32:
            s *= 1 + 0.022 * math.sin(math.pi * d / 0.32) * (1 - d / 0.32 * 0.3)
    return s, cx, dy

def draw_leo(canvas, t):
    fr = normalize_bg(leo_frame(t))
    s, cx, dy = leo_transform(t)
    tw, th = int(round(W * s)), int(round(H * s))
    img = Image.fromarray(fr).resize((tw, th), Image.LANCZOS)
    up = tw / fr.shape[1]  # >1 = ampliando o take
    img = img.filter(ImageFilter.UnsharpMask(radius=1.0, percent=int(18 + 30 * clamp01(up - 0.9)), threshold=2))
    x = int(round(cx - tw / 2)); y = int(round(H + dy - th))
    # borda com feather (o fundo já é o papel; isso só esconde resíduo)
    mask = Image.new("L", (tw, th), 255)
    fe = 22; md = ImageDraw.Draw(mask)
    for i in range(fe):
        v = int(255 * (i + 1) / (fe + 1))
        md.rectangle((i, i, tw - 1 - i, th - 1 + fe), outline=v)
    rgba = img.convert("RGBA"); rgba.putalpha(mask)
    _paste_clip(canvas, rgba, x, y)

# ---------------------------------------------------------------- lettering
def clean(wd):
    return wd.strip().strip(".,;:").upper()

class Block:
    """Bloco de lettering: linhas de palavras (índices), cada palavra entra no seu início de fala."""
    def __init__(self, lines, t_out, cy, size=86, coral=(), big=(), labels=None, t_in=None, out_dur=0.18):
        self.lines, self.t_out, self.cy, self.size = lines, t_out, cy, size
        self.out_dur = out_dur
        self.coral, self.big = set(coral), dict(big)
        self.labels = labels or {}
        self.t_in = t_in or {}
        self._layout()
    def _txt(self, i):
        return self.labels.get(i, clean(WORDS[i]["w"]) if isinstance(i, int) else i)
    def _layout(self):
        maxw = 940
        size = self.size
        while True:
            rows = []
            for ln in self.lines:
                sp = []
                for i in ln:
                    sz = self.big[i] * size / self.size if i in self.big else size
                    col = CORAL6 if i in self.coral else INK
                    sp.append((i, text_sprite(self._txt(i), sz, col)))
                gap = size * 0.26
                # largura pela tinta (a caixa tem 4 px de folga de cada lado)
                wid = sum(s.width - 8 for _, s in sp) + gap * (len(sp) - 1)
                rs = max((self.big[i] * size / self.size if i in self.big else size) for i in ln)
                rows.append((sp, wid, rs, gap))
            if max(r[1] for r in rows) <= maxw or size < 40: break
            size -= 4
        self.rows = rows
        CAP = 0.72  # altura de maiúscula do Sora em em
        pitch = [r[2] * 1.10 for r in rows]
        total = CAP * rows[0][2] + sum(pitch[1:])
        base = self.cy - total / 2 + CAP * rows[0][2]
        self.items = []
        for k, (sp, wid, rs, gap) in enumerate(rows):
            if k: base += pitch[k]
            x = W / 2 - wid / 2
            for i, s in sp:
                top = base - s.info["base"]
                self.items.append((i, s, x - 4 + s.width / 2, top + s.height / 2))
                x += s.width - 8 + gap
    def start(self, i):
        return self.t_in.get(i, T(i) if isinstance(i, int) else 0)
    def draw(self, cv, t):
        fo = leave(t, self.t_out, self.out_dur)
        if fo <= 0: return
        up = (1 - fo) * 40
        for i, s, x, y in self.items:
            t0 = self.start(i) - 0.04
            sc, al, dyy = pop(t, t0, dur=0.26 if i in self.coral else 0.22, over=2.4 if i in self.coral else 1.7)
            if al <= 0: continue
            paste(cv, s, x, y + dyy - up, sc, al * fo)

# ---------------------------------------------------------------- peças gráficas
def badge(n):
    d = 128
    im = Image.new("RGBA", (d * SS, d * SS), (0, 0, 0, 0))
    ImageDraw.Draw(im).ellipse((0, 0, d * SS - 1, d * SS - 1), fill=CORAL)
    im = im.resize((d, d), Image.LANCZOS)
    put_center(im, text_sprite(str(n), 78, WHITE), d / 2, d / 2)
    return with_shadow(im, blur=14, alpha=0.14, dy=8)

def pill_tag(txt="ME / MEI"):
    f = 27; tx = text_sprite(txt, f, CORAL7, wght=700, track=0.16)
    iw, ih = ink_size(tx)
    w, h = iw + 2 * 40, ih + 2 * 20
    im = rrect((w, h), h // 2, TINT + (255,), outline=CORAL + (255,), width=2.4)
    put_center(im, tx, w / 2, h / 2)
    return im

def bubble(txt, maxw=360):
    f = font(39, 600)
    words, lines, cur = txt.split(), [], ""
    for wd in words:
        tst = (cur + " " + wd).strip()
        if f.getlength(tst) > maxw and cur: lines.append(cur); cur = wd
        else: cur = tst
    lines.append(cur)
    lh = 50
    bw = int(max(f.getlength(l) for l in lines)) + 2 * 30
    bh = lh * len(lines) + 2 * 22
    im = Image.new("RGBA", ((bw + 20) * SS, (bh + 20) * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((20 * SS, 0, (bw + 20) * SS - 1, bh * SS - 1), 30 * SS, fill=WHITE)
    d.polygon([(20 * SS, (bh - 34) * SS), (2 * SS, (bh + 14) * SS), (48 * SS, (bh - 6) * SS)], fill=WHITE)
    im = im.resize((bw + 20, bh + 20), Image.LANCZOS)
    dd = ImageDraw.Draw(im)
    for k, l in enumerate(lines):
        dd.text((20 + 30, 22 + k * lh + 2), l, font=f, fill=INK)
    return with_shadow(im, blur=16, alpha=0.11, dy=8)

def price_chip():
    w, h = 150, 84
    im = rrect((w, h), 42, CORAL + (255,))
    put_left(im, text_sprite("R$", 44, WHITE), 26, h / 2)
    ck = Image.new("RGBA", (40 * SS, 40 * SS), (0, 0, 0, 0))
    ImageDraw.Draw(ck).line([(8 * SS, 21 * SS), (17 * SS, 30 * SS), (33 * SS, 11 * SS)], fill=WHITE, width=6 * SS, joint="curve")
    im.alpha_composite(ck.resize((40, 40), Image.LANCZOS), (w - 58, (h - 40) // 2))
    return with_shadow(im, blur=12, alpha=0.14, dy=6)

def calendar(month, filled):
    w, h = 340, 372
    im = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w * SS - 1, h * SS - 1), 34 * SS, fill=WHITE)
    d.rounded_rectangle((0, 0, w * SS - 1, 84 * SS), 34 * SS, fill=CORAL)
    d.rectangle((0, 50 * SS, w * SS - 1, 84 * SS), fill=CORAL)
    cols, rows, cs, gap = 7, 5, 34, 9
    gx = (w - (cols * cs + (cols - 1) * gap)) // 2
    for r in range(rows):
        for c in range(cols):
            x0 = (gx + c * (cs + gap)) * SS; y0 = (136 + r * (cs + gap)) * SS
            on = filled(r, c)
            d.rounded_rectangle((x0, y0, x0 + cs * SS, y0 + cs * SS), 10 * SS, fill=CORAL if on else ALT)
    im = im.resize((w, h), Image.LANCZOS)
    put_center(im, text_sprite(month, 38, WHITE), w / 2, 33)
    f = font(19, 600); dd = ImageDraw.Draw(im)
    for c, L in enumerate("DSTQQSS"):
        x = gx + c * (cs + gap) + cs / 2 - f.getlength(L) / 2
        dd.text((x, 100), L, font=f, fill=INK2)
    return im

def price_tag():
    w, h = 330, 190
    im = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    nose = 70
    d.rounded_rectangle((nose * SS, 0, w * SS - 1, h * SS - 1), 30 * SS, fill=CORAL)
    d.polygon([(nose * SS + 2, 0), (8 * SS, h * SS / 2 - 26 * SS), (8 * SS, h * SS / 2 + 26 * SS), (nose * SS + 2, h * SS - 1)], fill=CORAL)
    d.ellipse(((nose - 18) * SS, (h / 2 - 14) * SS, (nose + 10) * SS, (h / 2 + 14) * SS), fill=(0, 0, 0, 0))
    im = im.resize((w, h), Image.LANCZOS)
    put_center(im, text_sprite("R$", 92, WHITE), nose + (w - nose) / 2, h / 2)
    return with_shadow(im, blur=16, alpha=0.13, dy=10)

def year_card(y):
    w, h = 300, 120
    im = rrect((w, h), 28, WHITE + (255,))
    put_center(im, text_sprite(str(y), 72, INK), w / 2, h / 2)
    return im

def chip(n, state):  # state 0 contorno, 1 cheio com check
    d = 118
    im = Image.new("RGBA", (d * SS, d * SS), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    if state:
        dr.ellipse((0, 0, d * SS - 1, d * SS - 1), fill=CORAL)
    else:
        dr.ellipse((0, 0, d * SS - 1, d * SS - 1), fill=WHITE, outline=CORAL, width=5 * SS)
    im = im.resize((d, d), Image.LANCZOS)
    if state:
        ck = Image.new("RGBA", (d * SS, d * SS), (0, 0, 0, 0))
        ImageDraw.Draw(ck).line([(30 * SS, 60 * SS), (50 * SS, 80 * SS), (88 * SS, 40 * SS)], fill=WHITE, width=11 * SS, joint="curve")
        im.alpha_composite(ck.resize((d, d), Image.LANCZOS))
    else:
        put_center(im, text_sprite(str(n), 60, CORAL6), d / 2, d / 2)
    return with_shadow(im, blur=12, alpha=0.12, dy=6)

def arrow_up(prog, size=150, col=CORAL):
    """Seta que se desenha de baixo pra cima (prog 0..1)."""
    im = Image.new("RGBA", (size * SS, size * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x = size * SS / 2; y0 = size * SS * 0.92; y1 = size * SS * 0.12
    yc = lerp(y0, y1, out_cubic(prog))
    d.line([(x, y0), (x, yc)], fill=col, width=int(16 * SS))
    if prog > 0.55:
        k = out_back((prog - 0.55) / 0.45)
        hw = 44 * SS * k
        d.line([(x - hw, yc + hw), (x, yc), (x + hw, yc + hw)], fill=col, width=int(16 * SS), joint="curve")
    return im.resize((size, size), Image.LANCZOS)

def trend_arrow(prog, w=190, h=130):
    im = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pts = [(10, 112), (70, 70), (104, 92), (176, 22)]
    pts = [(x * SS, y * SS) for x, y in pts]
    seglens = [math.dist(pts[i], pts[i + 1]) for i in range(3)]
    tot = sum(seglens); L = tot * out_cubic(prog); acc = 0
    drawn = [pts[0]]
    for i in range(3):
        if acc + seglens[i] <= L:
            drawn.append(pts[i + 1]); acc += seglens[i]
        else:
            r = (L - acc) / seglens[i]
            drawn.append((lerp(pts[i][0], pts[i + 1][0], r), lerp(pts[i][1], pts[i + 1][1], r))); break
    d.line(drawn, fill=CORAL, width=int(15 * SS), joint="curve")
    if prog > 0.8:
        k = out_back((prog - 0.8) / 0.2); tip = pts[3]
        d.polygon([(tip[0] + 10 * SS * k, tip[1] - 12 * SS * k), (tip[0] - 40 * SS * k, tip[1] - 4 * SS * k), (tip[0] + 2 * SS * k, tip[1] + 38 * SS * k)], fill=CORAL)
    return im.resize((w, h), Image.LANCZOS)

def phone():
    w, h = 262, 546
    body = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(body)
    d.rounded_rectangle((0, 0, w * SS - 1, h * SS - 1), 46 * SS, fill=INK)
    body = body.resize((w, h), Image.LANCZOS)
    sp = Image.open(os.path.join(REPO, "marketing", "telas-app", "splash.png")).convert("RGB")
    sw, sh = w - 20, h - 20
    sp = sp.resize((sw, sh), Image.LANCZOS)
    m = Image.new("L", (sw * SS, sh * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, sw * SS - 1, sh * SS - 1), 38 * SS, fill=255)
    m = m.resize((sw, sh), Image.LANCZOS)
    body.paste(sp, (10, 10), m)
    isl = rrect((74, 22), 11, INK + (255,)); body.alpha_composite(isl, ((w - 74) // 2, 22))
    return with_shadow(body, blur=22, alpha=0.18, dy=14)

def selo():
    tx = text_sprite("APP EM CONSTRUÇÃO", 21, INK2, wght=700, track=0.14)
    iw, ih = ink_size(tx)
    w, h = iw + 44, ih + 24
    im = rrect((w, h), h // 2, ALT + (255,))
    put_center(im, tx, w / 2, h / 2)
    return im

_meter_cache = {}
def meter(fill_prog, show_val):
    k = (round(fill_prog, 2), round(show_val, 2))
    if k in _meter_cache: return _meter_cache[k]
    w, h = 446, 200
    im = rrect((w, h), 32, WHITE + (255,))
    put_left(im, text_sprite("TETO DO MEI", 25, INK2, wght=700, track=0.12), 30, 44)
    bw, bh, by = w - 60, 26, 80
    im.alpha_composite(rrect((bw, bh), bh // 2, ALT + (255,)), (30, by))
    fw = int(bw * 0.64 * out_cubic(fill_prog))
    if fw > bh: im.alpha_composite(rrect((fw, bh), bh // 2, CORAL + (255,)), (30, by))
    if show_val > 0:
        val = text_sprite("R$ 81 MIL POR ANO", 37, CORAL6)
        a = val.split()[-1].point(lambda v: int(v * clamp01(show_val)))
        val.putalpha(a)
        put_left(im, val, 30, 156 + (1 - out_cubic(show_val)) * 10)
    out = with_shadow(im, blur=18, alpha=0.11, dy=8)
    _meter_cache[k] = out
    return out

def eye(openk):
    w, h = 118, 76
    im = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    hh = h * SS * 0.5 * max(0.08, openk)
    cy = h * SS / 2
    d.ellipse((4 * SS, cy - hh, (w - 4) * SS, cy + hh), fill=WHITE, outline=INK, width=6 * SS)
    if openk > 0.35:
        r = 20 * SS * min(1, openk)
        d.ellipse((w * SS / 2 - r, cy - r, w * SS / 2 + r, cy + r), fill=CORAL)
        d.ellipse((w * SS / 2 - r * 0.42, cy - r * 0.42, w * SS / 2 + r * 0.42, cy + r * 0.42), fill=INK)
    return with_shadow(im.resize((w, h), Image.LANCZOS), blur=10, alpha=0.12, dy=5)

def comment_icon():
    s = 96
    im = Image.new("RGBA", (s * SS, s * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((6 * SS, 8 * SS, 90 * SS, 70 * SS), 26 * SS, outline=INK, width=8 * SS)
    d.polygon([(26 * SS, 66 * SS), (22 * SS, 90 * SS), (48 * SS, 68 * SS)], fill=INK)
    for k in range(3):
        cx = (30 + k * 18) * SS; d.ellipse((cx - 5 * SS, 34 * SS, cx + 5 * SS, 44 * SS), fill=CORAL)
    return im.resize((s, s), Image.LANCZOS)

def load_logo(width):
    lg = Image.open(os.path.join(ROOT, "src", "logo-trim.png")).convert("RGBA")
    return lg.resize((width, round(lg.height * width / lg.width)), Image.LANCZOS)

# ---------------------------------------------------------------- cena
class Scene:
    def __init__(self):
        self.tag = pill_tag()
        self.badges = {n: badge(n) for n in (1, 2, 3)}
        # gancho
        self.hook_top = Block([[0, 1]], t_out=T(10) - 0.30, cy=382, size=150, coral=(0,), big={0: 196},
                              labels={0: "3"}, t_in={0: -0.30})
        self.hook_mid = Block([[2, 3, 4, 5, 6]], t_out=T(10) - 0.30, cy=530, size=46)
        for i in (2, 3, 4, 5, 6):  # linha pequena em cinza
            pass
        self.hook_bot = Block([[7, 8, 9]], t_out=T(10) - 0.30, cy=636, size=104, coral=(9,))
        # sinal 1, 2, 3
        self.b1 = Block([[11, 12], [13, 14], [15, 16]], t_out=T(17) - 0.30, cy=575, size=86, coral=(13,))
        self.b2 = Block([[18, 19], [20, 21], [22, 23, 24]], t_out=T(25) - 0.30, cy=575, size=86, coral=(21,))
        self.b3 = Block([[26, 27, 28], [29, 30, 31], [32, 33, 34]], t_out=T(35) - 0.30, cy=575, size=84, coral=(29,))
        # bateu dois / reajustar
        self.b4a = Block([[35, 36]], t_out=T(37) - 0.16, cy=400, size=112, coral=(36,), labels={36: "DOIS?"}, out_dur=0.12)
        self.b4b = Block([[37, 38, 39], [40, 41]], t_out=T(42) - 0.30, cy=470, size=98, coral=(41,))
        # cresceu (close)
        self.b5a = Block([[42, 43, 44], [45, 46, 47]], t_out=T(48) - 0.16, cy=440, size=92, out_dur=0.12)
        self.b5b = Block([[48, 49], [50]], t_out=T(51) - 0.30, cy=455, size=92, coral=(50,), big={50: 128})
        # app / teto
        self.b6a = Block([[51, 52, 53, 54], [55, 56]], t_out=T(57) - 0.16, cy=520, size=90, labels={53: "APP"}, out_dur=0.12)
        self.b6b = Block([[57, 58, 59, 60], [61, 62, 63, 64]], t_out=T(70) - 0.30, cy=520, size=80, coral=(60,))
        # CTA
        self.b7a = Block([[70, 71]], t_out=T(72) - 0.16, cy=470, size=112, out_dur=0.12)
        self.b7b = Block([[72, 73, 74], [75, 76]], t_out=END_T0 - 0.05, cy=420, size=96, coral=(76,), labels={76: "VOCÊ?"})
        # hook_mid em cinza
        self.hook_mid.items = [(i, self._grey(s), x, y) for i, s, x, y in self.hook_mid.items]
        self.blocks = [self.hook_top, self.hook_mid, self.hook_bot, self.b1, self.b2, self.b3, self.b4a, self.b4b,
                       self.b5a, self.b5b, self.b6a, self.b6b, self.b7a, self.b7b]
        # sprites
        self.bubbles = [bubble("Fechado, pode marcar!"), bubble("Perfeito, combinado."), bubble("Tem horário na semana que vem?")]
        self.chipR = price_chip()
        self.tag_s = price_tag()
        self.years = {y: year_card(y) for y in (2024, 2025, 2026)}
        self.phone = phone(); self.selo = selo(); self.cmt = comment_icon()
        self.chips = {(n, s): chip(n, s) for n in (1, 2, 3) for s in (0, 1)}
        self.logo = load_logo(640)
        self.handle = text_sprite("@legalizai.app", 38, INK2, wght=600)
        # calendários: 3 meses cheios em ondas
        order = sorted([(r, c) for r in range(5) for c in range(7)], key=lambda rc: rc[0] + rc[1])
        self.cal_order = {rc: k for k, rc in enumerate(order)}
        self._cal_cache = {}

    def _grey(self, s):
        a = np.asarray(s).copy(); m = a[..., 3] > 0
        a[..., 0][m], a[..., 1][m], a[..., 2][m] = INK2
        return Image.fromarray(a)

    def cal(self, month, n_on):
        k = (month, n_on)
        if k not in self._cal_cache:
            self._cal_cache[k] = with_shadow(calendar(month, lambda r, c: self.cal_order[(r, c)] < n_on), 18, 0.12, 9)
        return self._cal_cache[k]

    def draw(self, cv, t):
        # tag de assinatura
        ta = leave(t, END_T0, 0.3)
        paste(cv, self.tag, 56 + self.tag.width / 2, 258, 1.0, ta)

        # badges dos sinais
        for n, wi, tout in ((1, 10, T(17) - 0.30), (2, 17, T(25) - 0.30), (3, 25, T(35) - 0.30)):
            sc, al, dyy = pop(t, T(wi) - 0.05, 0.30, 0.3, 2.2)
            fo = leave(t, tout)
            if al > 0 and fo > 0: paste(cv, self.badges[n], 540, 355 + dyy - (1 - fo) * 40, sc, al * fo)

        for b in self.blocks: b.draw(cv, t)
        self.draw_s1(cv, t); self.draw_s2(cv, t); self.draw_s3(cv, t); self.draw_s4(cv, t)
        self.draw_s5(cv, t); self.draw_s6(cv, t); self.draw_s7(cv, t); self.draw_end(cv, t)

    # sinal 1: clientes aceitando o preço (lado esquerdo, Léo à direita)
    def draw_s1(self, cv, t):
        t_out = T(17) - 0.32
        if t > t_out + 0.3 or t < T(10): return
        fo = leave(t, t_out, 0.26); dx = -(1 - fo) * 120
        ys = [930, 1085, 1275]
        for k, (b, wi) in enumerate(zip(self.bubbles, (11, 12, 13))):
            sc, al, dyy = pop(t, T(wi) - 0.02, 0.30, 0.5, 1.8)
            if al > 0:
                paste(cv, b, 44 + b.width / 2 - b.info["pad"] + dx, ys[k] + dyy, sc, al * fo)
        sc, al, dyy = pop(t, T(16) - 0.02, 0.32, 0.3, 2.6)
        if al > 0: paste(cv, self.chipR, 395 + dx, 832 + dyy, sc, al * fo, rot=-8)

    # sinal 2: agenda cheia (lado direito, Léo à esquerda)
    def draw_s2(self, cv, t):
        t_out = T(25) - 0.32
        if t > t_out + 0.3 or t < T(17): return
        fo = leave(t, t_out, 0.26); dx = (1 - fo) * 140
        x0, y0 = 790, 1080
        fill_t0, fill_d = T(21) - 0.05, 0.50
        n_on = int(35 * clamp01((t - fill_t0) / fill_d))
        months = [("OUT", T(19) - 0.10, n_on), ("NOV", T(22) - 0.04, 35), ("DEZ", T(24) - 0.04, 35)]
        shown = [m for m in months if t >= m[1]]
        depth = len(shown) - 1
        for k, (mname, t0, n) in enumerate(shown):
            lvl = depth - k  # 0 = da frente
            sc, al, dyy = pop(t, t0, 0.32, 0.6, 1.6)
            # o cartão de trás sobe o bastante pra mostrar a faixa do mês inteira
            lv = lvl if k == len(shown) - 1 else lvl
            y = y0 - lv * 74 + dyy * 2
            s = sc * (1 - 0.06 * lv)
            paste(cv, self.cal(mname, n), x0 + dx + lv * 14, y, s, al * fo * (1 - 0.10 * lv))

    # sinal 3: mesmo preço há dois anos
    def draw_s3(self, cv, t):
        t_out = T(35) - 0.32
        if t > t_out + 0.3 or t < T(25): return
        fo = leave(t, t_out, 0.26); dx = -(1 - fo) * 120
        t0 = T(27) - 0.06
        if t >= t0:
            p = t - t0
            ang = 16 * math.exp(-3.2 * p) * math.cos(9.5 * p) - 6
            sc, al, dyy = pop(t, t0, 0.3, 0.7, 1.4)
            paste(cv, self.tag_s, 262 + dx, 980 + dyy, sc, al * fo, rot=ang)
        yrs = [(2024, T(32) - 0.04), (2025, T(33) - 0.04), (2026, T(34) - 0.04)]
        cur = [y for y, ts in yrs if t >= ts]
        if cur:
            y = cur[-1]; ts = dict(yrs)[y]
            p = clamp01((t - ts) / 0.16)
            yc = 1215
            prev = cur[-2] if len(cur) > 1 else None
            sc0, al0, _ = pop(t, yrs[0][1], 0.28, 0.6, 1.6)
            card = self.years[y]
            if prev and p < 1:  # virada do contador
                paste(cv, with_shadow(self.years[prev], 14, 0.10, 7), 240 + dx, yc - 18 * p, 1.0, (1 - p) * fo)
                paste(cv, with_shadow(card, 14, 0.10, 7), 240 + dx, yc + 30 * (1 - p), 1.0, p * fo)
            else:
                paste(cv, with_shadow(card, 14, 0.10, 7), 240 + dx, yc, sc0 if not prev else 1.0, (al0 if not prev else 1.0) * fo)

    # bateu dois? / reajustar (Léo no centro)
    def draw_s4(self, cv, t):
        if t < T(35) - 0.05 or t > T(42): return
        fo = leave(t, T(37) - 0.14, 0.2)
        for k, n in enumerate((1, 2, 3)):
            sc, al, dyy = pop(t, T(35) + 0.05 * k, 0.28, 0.4, 2.0)
            on = 1 if (n <= 2 and t >= T(36) + 0.10 * (n - 1)) else 0
            if on:
                sc2, _, _ = pop(t, T(36) + 0.10 * (n - 1), 0.24, 0.8, 3.0)
                sc = sc2
            if al > 0: paste(cv, self.chips[(n, on)], 540 + (k - 1) * 150, 590 + dyy, sc, al * fo)
        # seta de reajuste ao lado do REAJUSTAR
        ta = T(41) - 0.05
        if t >= ta:
            p = clamp01((t - ta) / 0.45)
            fo2 = leave(t, T(42) - 0.30)
            it = [it for it in self.b4b.items if it[0] == 41][0]
            x = it[2] + it[1].width / 2 + 70
            paste(cv, arrow_up(p, 130), min(x, 1000), it[3] - 10 - 20 * out_cubic(p), 1.0, fo2)

    # cresceu (close)
    def draw_s5(self, cv, t):
        ta = T(50) - 0.02
        if t < ta or t > T(51): return
        p = clamp01((t - ta) / 0.5)
        fo = leave(t, T(51) - 0.30)
        it = [it for it in self.b5b.items if it[0] == 50][0]
        paste(cv, trend_arrow(p), it[2] + it[1].width / 2 + 95, it[3] - 30, 1.0, fo)

    # app + teto do MEI (Léo à direita)
    def draw_s6(self, cv, t):
        if t < T(51) - 0.2 or t > T(70): return
        fo = leave(t, T(70) - 0.32, 0.28); dx = -(1 - fo) * 140
        t0 = T(52) - 0.10
        p = clamp01((t - t0) / 0.55)
        if p > 0:
            k = out_back(p, 1.3)
            lift = clamp01((t - (T(62) - 0.1)) / 0.4)
            y = lerp(1480, 1010, k) - 70 * in_out_cubic(lift)
            sc = lerp(1.0, 0.86, in_out_cubic(lift))
            paste(cv, self.phone, 215 + dx, y, sc, clamp01(p * 2) * fo, rot=lerp(-12, -4, k))
            paste(cv, self.selo, 215 + dx, y + 318 * sc, 1.0, clamp01((t - t0 - 0.35) / 0.2) * fo)
        te = T(60) - 0.06  # "olho": o olho abre ao lado da palavra, no lettering
        if t >= te:
            ok = clamp01((t - te) / 0.18)
            blink = 1.0
            tb = t - te - 0.9
            if 0 < tb < 0.2: blink = abs(math.cos(math.pi * tb / 0.2))
            sc, al, dyy = pop(t, te, 0.26, 0.5, 2.2)
            fo_e = leave(t, T(70) - 0.32)
            it = [it for it in self.b6b.items if it[0] == 60][0]
            ex = min(it[2] + (it[1].width - 8) / 2 + 78, W - 70)
            paste(cv, eye(ok * blink), ex, it[3] + 4 + dyy, sc, al * fo_e)
        tm = T(62) - 0.05  # "teto"
        if t >= tm:
            fp = clamp01((t - tm) / 0.9)
            sv = clamp01((t - (T(66) - 0.06)) / 0.25)
            sc, al, dyy = pop(t, tm, 0.3, 0.7, 1.5)
            paste(cv, meter(fp, sv), 262 + dx, 1450 + dyy, sc, al * fo)

    # CTA
    def draw_s7(self, cv, t):
        if t < T(70) - 0.1 or t > END_T0 + 0.3: return
        fo = leave(t, END_T0 - 0.05, 0.22)
        sc, al, dyy = pop(t, T(70) - 0.04, 0.3, 0.4, 2.2)
        fo_icon = leave(t, T(72) - 0.12)
        if al > 0:
            wob = 7 * math.sin(max(0, t - T(70)) * 9) * math.exp(-max(0, t - T(70)) * 2.5)
            paste(cv, self.cmt, 540, 330 + dyy, sc, al * fo * fo_icon, rot=wob)
        for k, n in enumerate((1, 2, 3)):
            sc, al, dyy = pop(t, T(74) + 0.09 * k, 0.28, 0.4, 2.2)
            bob = 5 * math.sin((t - T(74)) * 5 + k * 1.3) if t > T(74) + 0.4 else 0
            if al > 0: paste(cv, self.chips[(n, 0)], 540 + (k - 1) * 150, 655 + dyy + bob, sc * 0.9, al * fo)

    def draw_end(self, cv, t):
        if t < END_T0: return
        sc, al, dyy = pop(t, END_T0 + 0.22, 0.4, 0.6, 1.6)
        paste(cv, self.logo, 540, 610 + dyy, sc, al)
        sc2, al2, dy2 = pop(t, END_T0 + 0.45, 0.3, 0.9, 1.2)
        paste(cv, self.handle, 540, 740 + dy2, 1.0, al2)

# ---------------------------------------------------------------- saída
def frame(scene, t):
    cv = Image.new("RGBA", (W, H), BG + (255,))
    draw_leo(cv, t)
    scene.draw(cv, t)
    return cv.convert("RGB")

def contact(scene, step, path):
    ts = np.arange(0, DUR, step)
    th_w = 270; th_h = 480; cols = 8
    rows = math.ceil(len(ts) / cols)
    sheet = Image.new("RGB", (cols * th_w, rows * (th_h + 30)), (40, 40, 40))
    d = ImageDraw.Draw(sheet)
    for k, t in enumerate(ts):
        im = frame(scene, float(t)).resize((th_w, th_h), Image.LANCZOS)
        x, y = (k % cols) * th_w, (k // cols) * (th_h + 30)
        sheet.paste(im, (x, y + 30)); d.text((x + 6, y + 6), f"{t:.1f}s", fill=(255, 255, 255), font=font(20, 600))
    sheet.save(path, quality=88)

def main():
    scene = Scene()
    args = sys.argv[1:]
    os.makedirs(P("qa"), exist_ok=True); os.makedirs(P("out"), exist_ok=True)
    if args and args[0] == "--qc":
        step = float(args[1]) if len(args) > 1 else 0.5
        contact(scene, step, P("qa", "contato.jpg")); print("qa/contato.jpg", f"DUR={DUR:.2f}"); return
    if args and args[0] == "--frames":
        for s in args[1].split(","):
            frame(scene, float(s)).save(P("qa", f"q_{float(s):05.2f}.png")); print("qa/q_%05.2f.png" % float(s))
        return
    n = int(round(DUR * FPS)); k0 = 0
    out = P("out", "leo-video.mp4")
    if args and args[0] == "--range":  # prévia de um trecho: --range 0,9
        a, b = map(float, args[1].split(","))
        k0, n = int(a * FPS), int(b * FPS)
        out = P("out", f"previa_{a:g}-{b:g}.mp4")
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
                           "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-tune", "animation",
                           "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
                           "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    for k in range(k0, n):
        t = k / FPS
        ff.stdin.write(np.asarray(frame(scene, t)).tobytes())
        if k % 60 == 0: print(f"{k}/{n}", flush=True)
    ff.stdin.close(); ff.wait()
    print("ok", out, f"{n} quadros, {DUR:.2f}s")

if __name__ == "__main__":
    main()
