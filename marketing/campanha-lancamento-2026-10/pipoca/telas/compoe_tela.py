"""Coloca as telas reais do app na tela verde de um take, quadro a quadro.

- máscara pela chave de verde (o dedo que passa por cima fica fora da máscara e continua na frente da tela)
- cantos da tela pelo casco convexo do verde, reduzido a 4 pontos; suavizados no tempo
- a tela do app entra por perspectiva nesses 4 cantos; tira o verde que vaza na borda dos dedos
- a sequência de telas vem de uma lista (tempo inicial, arquivo) e troca com fusão curta

Uso (venv do corte-viral):
  python -I compoe_tela.py TAKE.mp4 SAIDA.mp4 "0:tela-1-emitir.png" "1.9:tela-2-emitir-preenchida.png" "3.2:tela-3-nota-emitida.png"
  python -I compoe_tela.py TAKE.mp4 --quadros   (só grava a folha da máscara e dos cantos, pra conferir)
Opções (no formato --nome=valor):
  --gira=cw|ccw|180   celular deitado na mesa: gira a tela do app (cw = o topo do app fica pra direita)
  --desfoque=1.6      sigma do desfoque da tela (padrão 0.8); celular fora de foco pede mais
  --fim=3.79          grava só até esse segundo (o resto do take fica de fora)
  --sem-margem        a tela do app preenche o verde inteiro (celular deitado, visto em perspectiva)
  --anel=151          largura em px da faixa em volta da tela onde sai o verde que vazou (padrão 41); a mão
                      que segura o celular por baixo pega o reflexo verde bem longe da borda
"""
import json
import os
import subprocess
import sys

import cv2
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
opcoes = dict(a[2:].split("=", 1) for a in sys.argv[1:] if a.startswith("--") and "=" in a)
args = [a for a in sys.argv[1:] if not a.startswith("--")]
take = args[0]
so_quadros = "--quadros" in sys.argv
saida = None if so_quadros else args[1]
GIRA = {"cw": cv2.ROTATE_90_CLOCKWISE, "ccw": cv2.ROTATE_90_COUNTERCLOCKWISE, "180": cv2.ROTATE_180}
DESFOQUE = float(opcoes.get("desfoque", 0.8))
ANEL = int(opcoes.get("anel", 41)) | 1
FIM = float(opcoes["fim"]) if "fim" in opcoes else None
seq = []
for arg in args[2:]:
    t, f = arg.split(":", 1)
    img = cv2.imread(os.path.join(AQUI, f), cv2.IMREAD_COLOR)
    if "gira" in opcoes:
        img = cv2.rotate(img, GIRA[opcoes["gira"]])
    seq.append((float(t), img))

# leitura e gravação com a matriz BT.709 explícita e conversão exata: o take do modelo vem sem
# etiqueta de cor, os players leem vídeo HD assim como BT.709, e a conversão padrão do ffmpeg
# escurece e puxa a cor uns 2 a 4 pontos
LE = "scale=in_color_matrix=bt709:in_range=tv:flags=accurate_rnd+full_chroma_int+bitexact,format=bgr24"
GRAVA = "scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int+bitexact,format=yuv420p"
info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                  "stream=width,height,r_frame_rate", "-of", "json", take],
                                 capture_output=True, text=True, check=True).stdout)["streams"][0]
W, H = info["width"], info["height"]
num, den = map(int, info["r_frame_rate"].split("/"))
fps = num / den
bruto = subprocess.run(["ffmpeg", "-v", "error", "-i", take, "-vf", LE, "-f", "rawvideo", "-"],
                       capture_output=True, check=True).stdout
quadros = list(np.frombuffer(bruto, np.uint8).reshape(-1, H, W, 3))
print(len(quadros), "quadros", W, "x", H, fps, "fps")


def mascara_verde(fr):
    b, g, r = [fr[:, :, i].astype(np.int16) for i in range(3)]
    m = ((g - np.maximum(r, b)) > 38) & (g > 90)
    m = m.astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    return m


PAISAGEM = opcoes.get("gira") in ("cw", "ccw")


def ordena(q):
    """Cantos na ordem tl, tr, br, bl: sentido horário a partir da ponta esquerda da borda de cima. A borda de cima
    é a mais alta entre as duas longas (tela do app deitada, --gira) ou entre as duas curtas (celular em pé)."""
    c = q.mean(axis=0)
    q = q[np.argsort(np.arctan2(q[:, 1] - c[1], q[:, 0] - c[0]))]
    lados = [np.linalg.norm(q[(k + 1) % 4] - q[k]) for k in range(4)]
    longas_02 = lados[0] + lados[2] > lados[1] + lados[3]
    cand = [0, 2] if longas_02 == PAISAGEM else [1, 3]
    meio_y = [(q[k][1] + q[(k + 1) % 4][1]) / 2 for k in cand]
    return np.roll(q, -cand[int(np.argmin(meio_y))], axis=0)


def cantos(m):
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n < 2:
        return None
    k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
    pts = np.column_stack(np.where(lab == k))[:, ::-1].astype(np.float32)
    casco = cv2.convexHull(pts)
    # celular deitado na mesa (--gira): a tela fica torta na imagem, e os cantos saem do casco simplificado até
    # sobrar um quadrilátero
    if PAISAGEM:
        peri = cv2.arcLength(casco, True)
        for eps in np.linspace(0.01, 0.12, 23):
            ap = cv2.approxPolyDP(casco, eps * peri, True)
            if len(ap) <= 4:
                break
        if len(ap) == 4:
            return ordena(ap[:, 0, :].astype(np.float32))
    # celular em pé na mão: os pontos do casco mais extremos nas diagonais (o dedo que cobre um canto é
    # corrigido depois pela regra do paralelogramo)
    s = casco[:, 0, 0] + casco[:, 0, 1]
    d = casco[:, 0, 0] - casco[:, 0, 1]
    tl = casco[np.argmin(s), 0]
    br = casco[np.argmax(s), 0]
    tr = casco[np.argmax(d), 0]
    bl = casco[np.argmin(d), 0]
    return np.array([tl, tr, br, bl], dtype=np.float32)


mascaras = [mascara_verde(f) for f in quadros]
cs = [cantos(m) for m in mascaras]
# preenche falhas e suaviza os cantos no tempo (média móvel de 5 quadros)
ultimo = None
for i in range(len(cs)):
    if cs[i] is None:
        cs[i] = ultimo
    ultimo = cs[i]


def corrige_canto(q, lim=10.0):
    """Canto coberto por dedo: o casco puxa ele pra dentro. Pela regra do paralelogramo, cada canto
    é previsto pelos outros três; o que mais destoa (acima de lim px) é trocado pela previsão."""
    tl, tr, br, bl = q
    prev = np.array([tr + bl - br, tl + br - bl, tr + bl - tl, tl + br - tr])
    err = np.linalg.norm(q - prev, axis=1)
    k = int(np.argmax(err))
    if err[k] > lim:
        q = q.copy()
        q[k] = prev[k]
    return q


cs = [corrige_canto(np.array(c, dtype=np.float32)) for c in cs]
arr = np.array(cs)
lis = arr.copy()
for i in range(len(arr)):
    a, b = max(0, i - 2), min(len(arr), i + 3)
    lis[i] = arr[a:b].mean(axis=0)

if so_quadros:
    pasta = os.path.join(os.path.dirname(take), "_qc")
    os.makedirs(pasta, exist_ok=True)
    amostra = []
    for i in range(0, len(quadros), max(1, len(quadros) // 12)):
        v = quadros[i].copy()
        v[mascaras[i] > 0] = (255, 0, 255)
        cv2.polylines(v, [lis[i].astype(np.int32)], True, (0, 255, 255), 4)
        # ponto vermelho no canto que recebe o canto de cima à esquerda da tela do app (já girada)
        cv2.circle(v, tuple(int(x) for x in lis[i][0]), 14, (0, 0, 255), -1)
        cv2.putText(v, f"{i / fps:.2f}s", (20, 60), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 4)
        amostra.append(cv2.resize(v, (270, 480)))
    linhas = [np.hstack(amostra[j:j + 6] + [np.zeros_like(amostra[0])] * (6 - len(amostra[j:j + 6]))) for j in range(0, len(amostra), 6)]
    cv2.imwrite(os.path.join(pasta, os.path.splitext(os.path.basename(take))[0] + "_tela.jpg"), np.vstack(linhas))
    print("folha gravada")
    sys.exit(0)


# proporção da tela verde (mediana dos cantos): as telas do app ganham margem branca dos lados em vez de esticar
med = np.median(lis, axis=0)
larg = (np.linalg.norm(med[1] - med[0]) + np.linalg.norm(med[2] - med[3])) / 2
alt = (np.linalg.norm(med[3] - med[0]) + np.linalg.norm(med[2] - med[1])) / 2
prop = larg / alt
print("tela verde: proporção", round(prop, 4))
# celular deitado e visto de lado: a perspectiva achata o retângulo e a proporção medida não vale
for j, (t0, img) in enumerate(seq if "--sem-margem" not in sys.argv else []):
    h, w = img.shape[:2]
    alvo_w = int(round(h * prop))
    if alvo_w > w:
        pad = alvo_w - w
        cor = img[h // 2, 2].tolist()
        img = cv2.copyMakeBorder(img, 0, 0, pad // 2, pad - pad // 2, cv2.BORDER_CONSTANT, value=cor)
    elif alvo_w < w:
        alvo_h = int(round(w / prop))
        pad = alvo_h - h
        cor = img[2, w // 2].tolist()
        img = cv2.copyMakeBorder(img, pad // 2, pad - pad // 2, 0, 0, cv2.BORDER_CONSTANT, value=cor)
    seq[j] = (t0, img)


def tela_no_tempo(t):
    # fusão de 0,18 s entre uma tela e a próxima
    atual = seq[0][1]
    for j in range(len(seq)):
        if t >= seq[j][0]:
            atual = seq[j][1]
            if j + 1 < len(seq) and seq[j + 1][0] - t < 0.18 and t < seq[j + 1][0]:
                pass
    for j in range(1, len(seq)):
        t0 = seq[j][0]
        if t0 <= t < t0 + 0.18:
            a = (t - t0) / 0.18
            a = a * a * (3 - 2 * a)
            return cv2.addWeighted(seq[j - 1][1], 1 - a, seq[j][1], a, 0)
    return atual


tmp = saida + ".video.mp4"
proc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps),
                         "-i", "-", "-vf", GRAVA, "-c:v", "libx264", "-preset", "slow", "-crf", "14",
                         "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", tmp],
                        stdin=subprocess.PIPE)
for i, fr in enumerate(quadros):
    t = i / fps
    if FIM is not None and t >= FIM:
        break
    ui = tela_no_tempo(t)
    h, w = ui.shape[:2]
    # a tela do app ocupa o retângulo verde; pequena margem pra cobrir a borda arredondada
    src = np.array([[0, 0], [w, 0], [w, h], [0, h]], dtype=np.float32)
    dst = lis[i].copy()
    c = dst.mean(axis=0)
    dst = c + (dst - c) * 1.02
    M = cv2.getPerspectiveTransform(src, dst)
    warp = cv2.warpPerspective(ui, M, (W, H), flags=cv2.INTER_CUBIC).astype(np.float32)
    # a tela ganha a mesma maciez e o mesmo grão da imagem (senão parece colada)
    warp = cv2.GaussianBlur(warp, (0, 0), DESFOQUE)
    rng = np.random.default_rng(i)
    warp += rng.normal(0, 2.5, warp.shape[:2])[..., None]
    # luz da tela à noite: um pouco abaixo do branco puro, levemente quente como a cena
    warp = warp * np.array([0.90, 0.93, 0.95], dtype=np.float32)
    # alfa macio da chave de verde
    f32 = fr.astype(np.float32)
    b, g, r = f32[:, :, 0], f32[:, :, 1], f32[:, :, 2]
    verde = np.clip((g - np.maximum(r, b) - 16) / 36, 0, 1)
    verde = cv2.GaussianBlur(verde, (0, 0), 1.2)
    # a chave só vale em volta da tela do celular: tecla verde de calculadora longe dali não vira buraco escuro
    regiao = np.zeros((H, W), np.uint8)
    cv2.fillConvexPoly(regiao, dst.astype(np.int32), 1)
    regiao = cv2.dilate(regiao, np.ones((41, 41), np.uint8)).astype(np.float32)
    verde = verde * cv2.GaussianBlur(regiao, (0, 0), 3)
    # tira o verde que vaza no contorno dos dedos, numa faixa larga em volta da tela
    anel = cv2.dilate((verde > 0.02).astype(np.uint8), np.ones((ANEL, ANEL), np.uint8)).astype(bool)
    # despill pela média: pele (R > G > B) passa intacta; o verde que vazou volta pro tom de pele
    teto = (r + b) / 2 + 6
    # na faixa larga, só em tom quente (R > B: pele, papel, madeira), e tecla verde de calculadora e planta ficam
    # como estão; colado na tela (borda do aro escuro) sai o verde de qualquer cor, senão fica um fio verde em volta
    borda = cv2.dilate((verde > 0.02).astype(np.uint8), np.ones((11, 11), np.uint8)).astype(bool)
    g_limpo = np.where((borda | (anel & (r > b))) & (g > teto), teto, g)
    # pele na meia-luz (a palma embaixo do celular): a média ainda deixa a sombra puxando pro oliva; pele tem o verde
    # a uns 35 a 45% do caminho entre o azul e o vermelho. Papel, pipoca e luz forte ficam de fora pelo brilho
    pele = anel & (np.maximum(np.maximum(r, g_limpo), b) < 170) & (r > b + 15)
    teto_pele = b + 0.45 * (r - b) + 3
    g_limpo = np.where(pele & (g_limpo > teto_pele), teto_pele, g_limpo)
    f32[:, :, 1] = g_limpo
    out = f32 * (1 - verde[..., None]) + warp * verde[..., None]
    proc.stdin.write(np.clip(out, 0, 255).astype(np.uint8).tobytes())
proc.stdin.close()
proc.wait()
# junta o áudio original do take
corte = ["-t", f"{FIM:.4f}"] if FIM is not None else []
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-i", take, "-map", "0:v", "-map", "1:a?", "-c:v", "copy", "-c:a", "copy"] + corte + [saida],
               check=True)
os.remove(tmp)
print("ok", saida)
