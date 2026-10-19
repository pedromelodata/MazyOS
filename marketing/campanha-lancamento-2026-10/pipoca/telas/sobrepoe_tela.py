"""Põe a tela real do app por cima da tela que o modelo desenhou (sem tela verde em nenhum momento).

O vídeo foi gerado a partir de quadros-chave que já tinham a tela do app; o modelo redesenha a tela e embaralha o
texto pequeno. Aqui a tela real volta, quadro a quadro, no lugar exato da tela desenhada:
- a tela é o que parece interface (claro e pouco saturado, ou o laranja do botão); os buracos do texto são fechados e
  o que entra pela borda (o dedo) fica de fora, então o dedo continua na frente
- o entalhe e os cantos arredondados (escuros) ficam como o modelo desenhou
- cantos da tela pelo casco da interface, 4 pontos com correção de canto coberto, suavizados no tempo
- a tela real ganha o brilho medido da tela desenhada, o mesmo grão e a mesma maciez

Uso (venv do corte-viral):
  python -I sobrepoe_tela.py ENTRADA.mp4 SAIDA.mp4 "0:tela-2-emitir-preenchida.png" [--toque=t0-t1:x0,y0,x1,y1]
  python -I sobrepoe_tela.py ENTRADA.mp4 SAIDA.mp4 "0:tela.png" --quadros   (folha da máscara pra conferir)
  --fixa   celular quase parado: cantos pela mediana dos quadros bons + deslocamento pelo topo do aparelho
  --caixa=x0,y0,x1,y1   onde a tela está no 1º quadro (fundo claro atrás do celular confunde a detecção)
  --retangulo   cantos pelo menor retângulo (celular pequeno e de frente, num plano aberto)
  --borda=2     a tela real cresce 2 px por cima da borda da tela desenhada (some o fio cinza)
  --alfa=regiao o alfa antigo, pela região da interface quadro a quadro (deixa um tracejado na borda; não usar)
A tela real cobre o quadrilátero inteiro, e só o dedo, a mão, o entalhe e os cantos arredondados ficam na frente.
"""
import json
import os
import subprocess
import sys

import cv2
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
args = [a for a in sys.argv[1:] if not a.startswith("--")]
entrada, saida = args[0], args[1]
seq = []
for a in args[2:]:
    t, f = a.split(":", 1)
    seq.append((float(t), cv2.imread(os.path.join(AQUI, f))))
TOQUES = []
for a in sys.argv[1:]:
    if a.startswith("--toque="):
        tempo, ret = a[8:].split(":")
        t0, t1 = map(float, tempo.split("-"))
        TOQUES.append((t0, t1, [float(v) for v in ret.split(",")]))
SO_FOLHA = "--quadros" in sys.argv

LE = "scale=in_color_matrix=bt709:in_range=tv:flags=accurate_rnd+full_chroma_int+bitexact,format=bgr24"
GRAVA = "scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int+bitexact,format=yuv420p"
info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                  "stream=width,height,r_frame_rate", "-of", "json", entrada],
                                 capture_output=True, text=True, check=True).stdout)["streams"][0]
W, H = info["width"], info["height"]
num, den = map(int, info["r_frame_rate"].split("/"))
fps = num / den
bruto = subprocess.run(["ffmpeg", "-v", "error", "-i", entrada, "-vf", LE, "-f", "rawvideo", "-"],
                       capture_output=True, check=True).stdout
quadros = np.frombuffer(bruto, np.uint8).reshape(-1, H, W, 3)
n = len(quadros)


def mascara_interface(f):
    """Interface: claro e pouco saturado (fundo, cartões), ou o laranja do botão. Pele fica fora (meio saturada)."""
    x = f.astype(np.int16)
    b, g, r = x[..., 0], x[..., 1], x[..., 2]
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    claro = (mn > 150) & (mx - mn < 28)
    laranja = (r > 150) & (g < 0.62 * r) & (b < 0.45 * r)
    verde_ok = (g > r) & (g > b) & (mn > 120)          # o selo verde claro de nota emitida
    m = (claro | laranja | verde_ok).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    return m


RETANGULO = "--retangulo" in sys.argv
ALFA_REGIAO = "--alfa=regiao" in sys.argv     # o jeito antigo: o alfa é a própria região da interface (deixa tracejado)
BORDA = 0
for a_ in sys.argv[1:]:
    if a_.startswith("--borda="):
        BORDA = int(a_[8:])
CAIXA = None
for a_ in sys.argv[1:]:
    if a_.startswith("--caixa="):
        CAIXA = [int(v) for v in a_[8:].split(",")]


def regiao_tela(f, perto=None, janela=None):
    m = mascara_interface(f)
    if janela is not None:
        # fundo claro (janela, camisa branca) também parece interface: procura só perto de onde a tela estava
        x0, y0, x1, y1 = janela
        lim = np.zeros_like(m)
        lim[max(0, y0):min(H, y1), max(0, x0):min(W, x1)] = 1
        m = m * lim
    # junta pedaços da interface separados por um fio escuro (o botão vermelho embaixo do fundo branco)
    m = cv2.dilate(m, np.ones((5, 5), np.uint8))
    nc, lab, st, cen = cv2.connectedComponentsWithStats(m)
    if nc < 2:
        return None, None
    if perto is None:
        k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    else:
        cx, cy = perto
        notas = [(st[i, cv2.CC_STAT_AREA] - 0.02 * ((cen[i][0] - cx) ** 2 + (cen[i][1] - cy) ** 2), i) for i in range(1, nc)]
        k = max(notas)[1]
    comp = cv2.erode((lab == k).astype(np.uint8), np.ones((5, 5), np.uint8))
    # fecha os buracos do texto: fecha com núcleo médio e preenche o que ficou cercado
    fech = cv2.morphologyEx(comp, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    cont, _ = cv2.findContours(fech, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    cheio = np.zeros_like(fech)
    cv2.drawContours(cheio, [max(cont, key=cv2.contourArea)], -1, 1, -1)
    return cheio, comp


def cantos(comp):
    pts = np.column_stack(np.where(comp > 0))[:, ::-1].astype(np.float32)
    casco = cv2.convexHull(pts)
    peri = cv2.arcLength(casco, True)
    ap = None
    for eps in np.linspace(0.01, 0.10, 19):
        a = cv2.approxPolyDP(casco, eps * peri, True)
        if len(a) <= 4:
            ap = a
            break
    if RETANGULO or ap is None or len(ap) != 4:
        q = cv2.boxPoints(cv2.minAreaRect(casco)).astype(np.float32)
    else:
        q = ap[:, 0, :].astype(np.float32)
    c = q.mean(axis=0)
    q = q[np.argsort(np.arctan2(q[:, 1] - c[1], q[:, 0] - c[0]))]
    q = np.roll(q, -int(np.argmin(q.sum(axis=1))), axis=0)
    # canto coberto pelo dedo: o que mais destoa da regra do paralelogramo é trocado pela previsão
    tl, tr, br, bl = q
    prev = np.array([tr + bl - br, tl + br - bl, tr + bl - tl, tl + br - tr])
    err = np.linalg.norm(q - prev, axis=1)
    k = int(np.argmax(err))
    if err[k] > 0.03 * np.linalg.norm(br - tl):
        q[k] = prev[k]
    return q


regioes, quads, pos = [], [], None
janela = CAIXA
if CAIXA is not None:
    pos = ((CAIXA[0] + CAIXA[2]) / 2, (CAIXA[1] + CAIXA[3]) / 2)
for f in quadros:
    cheio, comp = regiao_tela(f, pos, janela)
    if cheio is None:
        regioes.append(regioes[-1] if regioes else np.zeros((H, W), np.uint8))
        quads.append(quads[-1])
        continue
    q = cantos(comp)
    regioes.append(cheio)
    quads.append(q)
    pos = q.mean(axis=0)
    if CAIXA is not None:
        # a janela segue a tela: a caixa do quadro atual, 25% maior
        x0, y0 = q.min(axis=0)
        x1, y1 = q.max(axis=0)
        mw, mh = (x1 - x0) * 0.25, (y1 - y0) * 0.25
        janela = [int(x0 - mw), int(y0 - mh), int(x1 + mw), int(y1 + mh)]
arr = np.array(quads, np.float32)
TELA_ESTAVEL = None
if "--fixa" in sys.argv:
    # celular quase parado na mão: o dedo cobre bordas inteiras em alguns quadros e torce o quadrilátero. Usa a
    # mediana dos quadros bons (quase retângulo, proporção da maioria) e segue só o deslocamento pelo topo do
    # aparelho (entalhe e borda de cima), que o dedo nunca cobre
    def erro(q):
        tl, tr, br, bl = q
        return np.linalg.norm((tl + br) - (tr + bl)) / np.linalg.norm(br - tl)
    prop = np.array([np.linalg.norm(q[1] - q[0]) / np.linalg.norm(q[3] - q[0]) for q in arr])
    bons = [i for i in range(n) if erro(arr[i]) < 0.015 and abs(prop[i] - np.median(prop)) < 0.02]
    if len(bons) < 5:
        bons = list(np.argsort([erro(q) for q in arr])[:max(5, n // 5)])
    ref = int(bons[len(bons) // 2])
    Q0 = np.median(arr[bons], axis=0)
    tl, tr = Q0[0], Q0[1]
    x0_, x1_ = int(min(tl[0], tr[0])) - 20, int(max(tl[0], tr[0])) + 20
    y0_, y1_ = int(min(tl[1], tr[1])) - 60, int(min(tl[1], tr[1])) + 40
    cinza = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) for f in quadros]
    molde = cinza[ref][y0_:y1_, x0_:x1_]
    desl = []
    for i in range(n):
        busca = cinza[i][max(0, y0_ - 40):y1_ + 40, max(0, x0_ - 40):x1_ + 40]
        r_ = cv2.matchTemplate(busca, molde, cv2.TM_CCOEFF_NORMED)
        _, _, _, loc = cv2.minMaxLoc(r_)
        desl.append((loc[0] + max(0, x0_ - 40) - x0_, loc[1] + max(0, y0_ - 40) - y0_))
    desl = np.array(desl, np.float32)
    # os cantos saem da união das regiões de tela de todos os quadros, alinhadas pelo deslocamento: o dedo cobre
    # partes diferentes em cada quadro, e a união é a tela inteira. O menor retângulo que cobre a união é a tela
    uniao = np.zeros((H, W), np.uint8)
    for i in range(n):
        M_ = np.float32([[1, 0, -desl[i][0]], [0, 1, -desl[i][1]]])
        uniao |= cv2.warpAffine(regioes[i], M_, (W, H), flags=cv2.INTER_NEAREST)
    uniao = cv2.morphologyEx(uniao, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    # a mesma união, lisa, é o contorno estável da tela (cantos arredondados e entalhe de fora): a máscara não pisca
    # nem serrilha de um quadro pro outro, e quadro a quadro só se tira dela o dedo
    TELA_ESTAVEL = cv2.morphologyEx(uniao, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    nc_, lab_, st_, _ = cv2.connectedComponentsWithStats(TELA_ESTAVEL)
    if nc_ > 1:
        TELA_ESTAVEL = (lab_ == 1 + int(np.argmax(st_[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
    # borda com antisserrilhado (a tela vem um pouco torta, e a máscara binária fazia degrau na borda inclinada)
    TELA_ESTAVEL = cv2.GaussianBlur((cv2.GaussianBlur(TELA_ESTAVEL.astype(np.float32), (0, 0), 1.5) > 0.5)
                                    .astype(np.float32), (0, 0), 0.8)
    cont, _ = cv2.findContours(uniao, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    Q0 = cv2.boxPoints(cv2.minAreaRect(max(cont, key=cv2.contourArea))).astype(np.float32)
    c_ = Q0.mean(axis=0)
    Q0 = Q0[np.argsort(np.arctan2(Q0[:, 1] - c_[1], Q0[:, 0] - c_[0]))]
    Q0 = np.roll(Q0, -int(np.argmin(Q0.sum(axis=1))), axis=0)
    arr = np.array([Q0 + d for d in desl], np.float32)
    desl_suave = np.array([desl[max(0, i - 2):i + 3].mean(axis=0) for i in range(n)], np.float32)
    print("fixa: quadros bons", len(bons), "de", n, "| deslocamento máx", np.abs(desl).max(axis=0).round(1).tolist(),
          "| tela", Q0.round(1).tolist())
lis = arr.copy()
for i in range(n):
    lis[i] = arr[max(0, i - 2):i + 3].mean(axis=0)
print(n, "quadros; tela no 1º:", lis[0].round(1).tolist(), "| no último:", lis[-1].round(1).tolist())

if SO_FOLHA:
    pasta = os.path.join(os.path.dirname(os.path.abspath(saida)), "_qc")
    os.makedirs(pasta, exist_ok=True)
    tiles = []
    for i in range(0, n, max(1, n // 10)):
        v = quadros[i].copy()
        v[regioes[i] > 0] = (v[regioes[i] > 0] * 0.4 + np.array([255, 0, 255]) * 0.6).astype(np.uint8)
        cv2.polylines(v, [lis[i].astype(np.int32)], True, (0, 255, 255), 3)
        c = lis[i].mean(axis=0).astype(int)
        hh = int(np.linalg.norm(lis[i][3] - lis[i][0]) * 0.65)
        v = v[max(0, c[1] - hh):c[1] + hh, max(0, c[0] - hh // 2):c[0] + hh // 2]
        tiles.append(cv2.resize(v, (260, 520)))
    cv2.imwrite(os.path.join(pasta, os.path.basename(saida) + "_sobre.jpg"), np.hstack(tiles))
    print("folha gravada")
    sys.exit(0)


def tela_no_tempo(t):
    atual = seq[0][1]
    for t0, img in seq:
        if t >= t0:
            atual = img
    ui = atual
    uh, uw = ui.shape[:2]
    for t0, t1, (x0, y0, x1, y1) in TOQUES:
        if t0 <= t <= t1:
            ui = ui.copy()
            ui[int(y0 * uh):int(y1 * uh), int(x0 * uw):int(x1 * uw)] = (
                ui[int(y0 * uh):int(y1 * uh), int(x0 * uw):int(x1 * uw)].astype(np.float32) * 0.86).astype(np.uint8)
    return ui


tmp = saida + ".video.mp4"
p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps),
                      "-i", "-", "-vf", GRAVA, "-c:v", "libx264", "-preset", "slow", "-crf", "14",
                      "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", tmp],
                     stdin=subprocess.PIPE)
for i, f in enumerate(quadros):
    q = lis[i]
    c = q.mean(axis=0)
    q2 = c + (q - c) * 1.012
    ui = tela_no_tempo(i / fps)
    larg = int(np.linalg.norm(q[1] - q[0]))
    alt = int(np.linalg.norm(q[3] - q[0]))
    pad_w, pad_h = int(round(ui.shape[1] * 0.01)), int(round(ui.shape[0] * 0.01))
    uip = cv2.copyMakeBorder(ui, pad_h, pad_h, pad_w, pad_w, cv2.BORDER_REPLICATE)
    uip = cv2.resize(uip, (max(8, int(larg * 1.02) * 2), max(8, int(alt * 1.02) * 2)), interpolation=cv2.INTER_AREA)
    ph, pw = uip.shape[:2]
    M = cv2.getPerspectiveTransform(np.array([[0, 0], [pw, 0], [pw, ph], [0, ph]], np.float32), q2)
    tela = cv2.warpPerspective(uip, M, (W, H), flags=cv2.INTER_AREA).astype(np.float32)
    reg = regioes[i].astype(np.float32)
    # brilho: a tela real fica com o branco medido da tela desenhada (pixels claros da região)
    fm = f.astype(np.float32)
    sel = (reg > 0) & (mascara_interface(f) > 0) & (fm.min(axis=2) > 150)
    tsel = sel & (tela.min(axis=2) > 200)
    if tsel.sum() > 500:
        ganho = np.median(fm[tsel], axis=0) / np.maximum(np.median(tela[tsel], axis=0), 1)
        tela *= np.clip(ganho, 0.6, 1.2)
    tela = cv2.GaussianBlur(tela, (0, 0), 0.7)
    tela += np.random.default_rng(i).normal(0, 2.0, tela.shape[:2])[..., None]
    # a borda da tela desenhada (cinza do antisserrilhado) fica de fora da região: a tela real cresce 2 px por cima dela
    # (o resto do aro escuro continua), senão sobra um fio cinza tracejado em volta
    borda_px = int(BORDA)
    if borda_px > 0:
        reg = cv2.dilate(reg, np.ones((2 * borda_px + 1, 2 * borda_px + 1), np.uint8))
    else:
        reg = cv2.erode(reg, np.ones((3, 3), np.uint8))
    if ALFA_REGIAO:
        alfa = cv2.GaussianBlur(reg, (0, 0), 1.1)
        dentro = np.zeros((H, W), np.float32)
        cv2.fillConvexPoly(dentro, q2.astype(np.int32), 1.0)
        alfa *= dentro
    else:
        # a tela real cobre a tela inteira e só o que tapa a tela de verdade fica na frente: o dedo e a mão. A borda da
        # região da interface é serrilhada (o cinza do aro entra e sai do limiar), e usar a região como alfa deixava um
        # tracejado em volta da tela. Com --fixa, a forma da tela é a união lisa de todos os quadros, que segue o
        # deslocamento do aparelho; sem --fixa, o quadrilátero. O que não é interface dentro dela só vale como oclusão
        # se tiver corpo (abertura de 5 px e área mínima), então o fio da borda some e o dedo fica
        if TELA_ESTAVEL is not None:
            M_ = np.float32([[1, 0, desl_suave[i][0]], [0, 1, desl_suave[i][1]]])
            forma = cv2.warpAffine(TELA_ESTAVEL, M_, (W, H), flags=cv2.INTER_LINEAR)
            # a união costuma ficar uns pixels pra dentro da borda real da tela; estende até a moldura (escura), pra
            # que nada do que o modelo desenhou na beirada (numa transição, o laranja da outra tela) apareça
            luma_ = f[..., 0] * 0.114 + f[..., 1] * 0.587 + f[..., 2] * 0.299
            ext_ = cv2.dilate((forma > 0.5).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
            ext_ = (ext_ > 0) & (luma_ > 95)
            forma = np.maximum(forma, cv2.GaussianBlur(ext_.astype(np.float32), (0, 0), 0.8))
        else:
            forma = np.zeros((H, W), np.float32)
            cv2.fillConvexPoly(forma, q2.astype(np.int32), 1.0)
            forma = cv2.GaussianBlur(forma, (0, 0), 0.8)
        if TELA_ESTAVEL is None:
            occ = ((forma > 0.5) & (reg == 0)).astype(np.uint8)
            area_min = 150
        else:
            # com a forma estável, o entalhe e os cantos já ficam de fora dela: dentro, só pele tapa a tela, e a região
            # da interface do quadro nem entra (numa transição inventada pelo modelo, a barra escura parte a interface e
            # a metade solta ficava sem tela real). Pele, mesmo na contraluz, tem saturação abaixo de 0,55; o laranja e o
            # vermelho do app passam de 0,7. A beirada antisserrilhada do texto e do botão parece pele, mas é fina: a
            # abertura de 7 px tira, e o dedo (40 px ou mais) fica
            x_ = f.astype(np.int16)
            b_, g_, r_ = x_[..., 0], x_[..., 1], x_[..., 2]
            mx_ = np.maximum(np.maximum(r_, g_), b_)
            mn_ = np.minimum(np.minimum(r_, g_), b_)
            pele = ((r_ > g_ + 8) & (g_ > b_) & (r_ - b_ > 25) & (mn_ < 200) & (r_ > 70) & (g_ > 0.52 * r_)
                    & (mx_ - mn_ < 0.55 * mx_)).astype(np.uint8)
            pele = cv2.morphologyEx(pele, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
            occ = ((forma > 0.5) & (pele > 0)).astype(np.uint8)
            area_min = 600
        occ = cv2.morphologyEx(occ, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
        nc_, lab_, st_, _ = cv2.connectedComponentsWithStats(occ)
        if TELA_ESTAVEL is not None:
            # dedo e mão sempre entram por fora da tela: a mancha que não encosta na borda da forma não tapa nada
            dentro_ = (forma > 0.5).astype(np.uint8)
            borda_f = dentro_ - cv2.erode(dentro_, np.ones((17, 17), np.uint8))
        for k_ in range(1, nc_):
            if st_[k_, cv2.CC_STAT_AREA] < area_min:
                occ[lab_ == k_] = 0
            elif TELA_ESTAVEL is not None and not np.any(borda_f[lab_ == k_]):
                occ[lab_ == k_] = 0
        occ = cv2.dilate(occ, np.ones((3, 3), np.uint8))
        alfa = forma * (1 - cv2.GaussianBlur(occ.astype(np.float32), (0, 0), 1.1))
    out = fm * (1 - alfa[..., None]) + tela * alfa[..., None]
    p.stdin.write(np.clip(out, 0, 255).astype(np.uint8).tobytes())
p.stdin.close()
p.wait()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-i", entrada, "-map", "0:v", "-map", "1:a?", "-c:v", "copy",
                "-c:a", "copy", saida], check=True)
os.remove(tmp)
print("ok", saida)
