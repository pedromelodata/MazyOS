"""Folha de contato (pacote K07). Contrato: KIT/DESENHO.md, seção 7.7 (folha) e 7.1 (prévia).

Mesmo método do PR/src/folha_take.py: quadros a cada 0,5 s, 10 colunas de 216x384 com o tempo escrito em cima
("1.5s"), fundo (30, 30, 30), JPEG qualidade 88. Diferença: aqui o ffmpeg já entrega só os quadros da folha,
reduzidos (filtro select e scale com a matriz bt709 faixa tv), em vez de decodificar o vídeo inteiro na memória
(540 quadros de 1080x1920 dariam 3,4 GB).
Também monta a folha a partir de PNG (a prévia: os stills das batidas), com o quadro e o tempo tirados do nome
(...-0135.png é o quadro 135).

Uso (sempre com python -B):
    python -B folha.py <video.mp4> <saida.jpg> [--passo 0.5] [--colunas 10]
    python -B folha.py --pngs <pasta ou png...> <saida.jpg> [--fps 30] [--colunas 6]
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import glob  # noqa: E402
import io  # noqa: E402
import os  # noqa: E402
import re  # noqa: E402
import subprocess  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
from comum import escrita  # noqa: E402

LARGURA = 216
ALTURA = 384
RX_QUADRO = re.compile(r"(\d+)\.png$", re.I)


def _grava_jpg(img, saida):
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=88)
    escrita.grava_bytes(saida, buf.getvalue(), cria_pasta=True)
    return len(buf.getvalue())


def _folha(miniaturas, rotulos, colunas, saida, tw, th):
    from PIL import Image, ImageDraw
    linhas = (len(miniaturas) + colunas - 1) // colunas
    folha = Image.new("RGB", (colunas * tw, max(1, linhas) * (th + 20)), (30, 30, 30))
    d = ImageDraw.Draw(folha)
    for k, (im, rot) in enumerate(zip(miniaturas, rotulos)):
        x, y = (k % colunas) * tw, (k // colunas) * (th + 20)
        folha.paste(im, (x, y + 20))
        d.text((x + 4, y + 3), rot, fill=(255, 255, 255))
    return folha, _grava_jpg(folha, saida)


def folha_video(video, saida, passo=0.5, colunas=10):
    from PIL import Image
    import numpy as np
    s = comum.sonda(video)
    v = [x for x in s["streams"] if x.get("codec_type") == "video"][0]
    w, h = int(v["width"]), int(v["height"])
    a, b = map(int, v.get("r_frame_rate", "30/1").split("/"))
    fps = a / b
    n = int(v.get("nb_frames") or 0) or int(round(float(s["format"]["duration"]) * fps))
    tw, th = LARGURA, int(round(LARGURA * h / w))
    idx = sorted(set(min(int(round(t * fps)), n - 1) for t in np.arange(0, n / fps, passo)))
    k = passo * fps
    if abs(k - round(k)) < 1e-9 and idx == list(range(0, n, int(round(k)))):
        sel = "not(mod(n\\,%d))" % int(round(k))
    else:
        sel = "+".join("eq(n\\,%d)" % i for i in idx)
    vf = "select='%s',scale=%d:%d:flags=lanczos:in_color_matrix=bt709:in_range=tv:out_range=full,format=rgb24" % (sel, tw, th)
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", vf, "-fps_mode", "passthrough", "-f", "rawvideo", "-"],
                       capture_output=True)
    if r.returncode != 0:
        raise comum.ErroSaida("ffmpeg falhou na folha: %s" % r.stderr.decode("utf-8", "replace")[-400:])
    tam = tw * th * 3
    qs = [np.frombuffer(r.stdout[i * tam:(i + 1) * tam], np.uint8).reshape(th, tw, 3)
          for i in range(len(r.stdout) // tam)]
    if len(qs) != len(idx):
        raise comum.ErroSaida("a folha esperava %d quadros e o ffmpeg deu %d" % (len(idx), len(qs)))
    mini = [Image.fromarray(q) for q in qs]
    rot = ["%.1fs" % (i / fps) for i in idx]
    _f, nbytes = _folha(mini, rot, colunas, saida, tw, th)
    return {"saida": comum.barra(saida), "quadros": idx, "fps": fps, "passo": passo, "bytes": nbytes,
            "tamanho": [colunas * tw, ((len(idx) + colunas - 1) // colunas) * (th + 20)]}


def folha_pngs(pngs, saida, fps=30, colunas=6):
    from PIL import Image
    lista = []
    for p in pngs:
        if os.path.isdir(p):
            lista += sorted(glob.glob(os.path.join(p, "*.png")))
        else:
            lista.append(p)
    if not lista:
        raise comum.ErroSaida("nenhum PNG pra folha")
    mini, rot = [], []
    for p in lista:
        im = Image.open(p).convert("RGB")
        th = int(round(LARGURA * im.height / im.width))
        mini.append(im.resize((LARGURA, th), Image.LANCZOS))
        m = RX_QUADRO.search(os.path.basename(p))
        q = int(m.group(1)) if m else None
        rot.append(("q%d %.2fs" % (q, q / fps)) if q is not None else os.path.basename(p)[:28])
    th = mini[0].height
    _f, nbytes = _folha(mini, rot, colunas, saida, LARGURA, th)
    return {"saida": comum.barra(saida), "pngs": [comum.barra(p) for p in lista], "bytes": nbytes}


def main(argv=None):
    comum.utf8()
    ap = argparse.ArgumentParser(prog="folha.py", description="Folha de contato (K07).")
    ap.add_argument("entrada", nargs="+", help="vídeo (ou, com --pngs, pastas e PNG) e por último a saída .jpg")
    ap.add_argument("--pngs", action="store_true")
    ap.add_argument("--passo", type=float, default=0.5)
    ap.add_argument("--colunas", type=int)
    ap.add_argument("--fps", type=float, default=30)
    a = ap.parse_args(argv)
    if len(a.entrada) < 2:
        print("uso: folha.py <video> <saida.jpg> | folha.py --pngs <png...> <saida.jpg>")
        return 2
    *ents, saida = a.entrada
    try:
        if a.pngs:
            r = folha_pngs(ents, saida, a.fps, a.colunas or 6)
        else:
            r = folha_video(ents[0], saida, a.passo, a.colunas or 10)
    except (comum.ErroSaida, escrita.EscritaRecusada) as e:
        print("erro: %s" % e)
        return 1
    print("folha: %s (%d bytes)" % (r["saida"], r["bytes"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
