"""Comparação de stills do render do kit (pacote K06; contrato: KIT/DESENHO.md, seções 7.4 e 11).

Roda no Python do corte-viral, sempre com -B:
    PY = C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe

Medidas por par de imagens (RGB, 8 bits): diferença absoluta máxima, média da diferença absoluta (todos os
canais e pixels) e porcentagem de pixels com diferença acima de 2 em algum canal. Também o md5 dos pixels
(identidade de verdade, independente do codificador do PNG).

Quadro do V4 decodificado em memória, sem gravar nada:
    ffmpeg -i <V4> -vf select=eq(n\\,K),scale=in_color_matrix=bt709:in_range=tv:out_range=full,format=rgb24
           -frames:v 1 -f rawvideo -
(com vários quadros, um só comando: select com eq(n,a)+eq(n,b)+... e -fps_mode passthrough).

Comandos:
    pares <a.png> <b.png> [<a2.png> <b2.png> ...]
    base registra <pasta dos png> <pasta linha-de-base> --rotulo <nome>
    base confere <pasta depois> <pasta antes> --saida <json>
    lote <manifesto.json> --resultado <json> [--v4 <mp4>] [--miniaturas <pasta>] [--kit KitMotion] [--ref GuiaPronta]
    v4 <png> <quadro> [--v4 <mp4>]
    folha --resultado <json> --miniaturas <pasta> --saida <jpg>
    tabela --resultado <json>

Toda gravação passa pelo KIT/lib/escrita.py (temporário na mesma pasta e os.replace).
"""
import argparse
import hashlib
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion/lib")
import escrita  # noqa: E402

import numpy as np  # noqa: E402
from PIL import Image, ImageDraw, ImageFont  # noqa: E402

V4 = "C:/MKT-INSTA/Content Legalizai/marketing/final/2026-10-14 O app fazendo a guia do mês, sem site do governo/GUIA-PRONTA-motion-v4.mp4"
FONTE = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/public-guia/Sora-wght.ttf"
LARGURA, ALTURA = 1080, 1920


def carrega(caminho):
    """RGB uint8 (H, W, 3) e o mínimo do alfa (255 quando não há alfa)."""
    im = Image.open(caminho)
    im.load()
    alfa_min = 255
    if im.mode in ("RGBA", "LA"):
        alfa_min = int(np.asarray(im.getchannel("A")).min())
    return np.asarray(im.convert("RGB")), alfa_min


def md5_pixels(arr):
    return hashlib.md5(np.ascontiguousarray(arr).tobytes()).hexdigest()


def estatisticas(a, b):
    if a.shape != b.shape:
        return {"erro": "tamanhos diferentes %s e %s" % (a.shape, b.shape)}
    d = np.abs(a.astype(np.int16) - b.astype(np.int16))
    return {
        "maximo": int(d.max()),
        "media": round(float(d.mean()), 6),
        "pct_acima_2": round(float((d.max(axis=2) > 2).mean() * 100.0), 6),
        "pixels_diferentes": int((d.max(axis=2) > 0).sum()),
    }


def decodifica_v4(quadros, mp4=V4):
    """{quadro: RGB uint8} decodificado em memória (um comando só pra lista toda)."""
    qs = sorted(set(int(q) for q in quadros))
    sel = "+".join("eq(n\\,%d)" % q for q in qs)
    vf = "select=%s,scale=in_color_matrix=bt709:in_range=tv:out_range=full,format=rgb24" % sel
    cmd = ["ffmpeg", "-v", "error", "-nostdin", "-i", mp4, "-vf", vf, "-fps_mode", "passthrough",
           "-frames:v", str(len(qs)), "-f", "rawvideo", "-"]
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        raise RuntimeError("ffmpeg falhou: %s" % r.stderr.decode("utf-8", "replace")[-800:])
    tam = LARGURA * ALTURA * 3
    if len(r.stdout) != tam * len(qs):
        raise RuntimeError("ffmpeg devolveu %d bytes, esperava %d (%d quadros)" % (len(r.stdout), tam * len(qs), len(qs)))
    return {q: np.frombuffer(r.stdout[i * tam:(i + 1) * tam], dtype=np.uint8).reshape(ALTURA, LARGURA, 3) for i, q in enumerate(qs)}


def miniatura(arr, largura=135):
    im = Image.fromarray(arr)
    h = round(arr.shape[0] * largura / arr.shape[1])
    return im.resize((largura, h), Image.LANCZOS)


def diferenca_visivel(a, b, ganho=40):
    """mapa da diferença ampliado (pra enxergar 1 nível de diferença) em RGB."""
    d = np.abs(a.astype(np.int16) - b.astype(np.int16)).max(axis=2)
    v = np.clip(d * ganho, 0, 255).astype(np.uint8)
    rgb = np.stack([v, (v * 0.45).astype(np.uint8), (v * 0.25).astype(np.uint8)], axis=2)
    return rgb


def _le_json(caminho, padrao):
    if os.path.exists(caminho):
        with open(caminho, encoding="utf-8") as f:
            return json.load(f)
    return padrao


# ---------- comandos ----------

def cmd_pares(args):
    if len(args.arquivos) % 2:
        sys.exit("pares: passe os arquivos de dois em dois")
    pior = 0
    for i in range(0, len(args.arquivos), 2):
        a, _ = carrega(args.arquivos[i])
        b, _ = carrega(args.arquivos[i + 1])
        e = estatisticas(a, b)
        pior = max(pior, e.get("maximo", 999))
        print(os.path.basename(args.arquivos[i]), "x", os.path.basename(args.arquivos[i + 1]), json.dumps(e))
    return 0 if pior == 0 else 1


def cmd_base_registra(args):
    pasta, destino = args.pasta, args.destino
    nomes = sorted(n for n in os.listdir(pasta) if n.lower().endswith(".png"))
    mini = os.path.join(destino, "miniaturas")
    itens = []
    for n in nomes:
        p = os.path.join(pasta, n)
        arr, alfa = carrega(p)
        jpg = os.path.join(mini, os.path.splitext(n)[0] + ".jpg")
        im = miniatura(arr)
        from io import BytesIO
        buf = BytesIO()
        im.save(buf, "JPEG", quality=80)
        escrita.grava_bytes(jpg, buf.getvalue(), cria_pasta=True)
        itens.append({"arquivo": n, "md5Arquivo": escrita.md5(p), "md5Pixels": md5_pixels(arr), "tamanho": os.path.getsize(p),
                      "dimensao": [int(arr.shape[1]), int(arr.shape[0])], "alfaMinimo": alfa, "miniatura": "miniaturas/" + os.path.basename(jpg)})
        print(n, itens[-1]["md5Pixels"])
    reg = {"versao": 1, "rotulo": args.rotulo, "pasta": pasta, "itens": itens}
    escrita.grava_json(os.path.join(destino, args.rotulo + ".json"), reg, cria_pasta=True)
    return 0


def cmd_base_confere(args):
    nomes = sorted(n for n in os.listdir(args.antes) if n.lower().endswith(".png"))
    linhas = []
    falhou = False
    for n in nomes:
        pa = os.path.join(args.antes, n)
        pd = os.path.join(args.depois, n)
        if not os.path.exists(pd):
            linhas.append({"arquivo": n, "erro": "não existe depois"})
            falhou = True
            continue
        a, _ = carrega(pa)
        d, _ = carrega(pd)
        e = estatisticas(d, a)
        e.update({"arquivo": n, "md5PixelsAntes": md5_pixels(a), "md5PixelsDepois": md5_pixels(d),
                  "md5ArquivoAntes": escrita.md5(pa), "md5ArquivoDepois": escrita.md5(pd)})
        e["identico"] = e["md5PixelsAntes"] == e["md5PixelsDepois"] and e.get("maximo") == 0
        falhou = falhou or not e["identico"]
        linhas.append(e)
        print(n, "idêntico" if e["identico"] else "DIFERENTE", json.dumps({k: e[k] for k in ("maximo", "media", "pct_acima_2")}))
    escrita.grava_json(args.saida, {"versao": 1, "antes": args.antes, "depois": args.depois, "itens": linhas, "passou": not falhou}, cria_pasta=True)
    return 1 if falhou else 0


def _chave(e):
    return (e.get("maximo", 999), e.get("media", 999.0))


def cmd_lote(args):
    """Um lote do stills.mjs: por quadro, as amostras de cada composição (cada amostra é uma aba nova).
    O GuiaPronta não é determinístico em alguns pixels (ver o relatório): por isso o kit é comparado com cada
    amostra do GuiaPronta, e vale o melhor par; a variação do próprio GuiaPronta entre abas também é medida."""
    with open(args.manifesto, encoding="utf-8") as f:
        man = json.load(f)
    por = {}
    for a in man["arquivos"]:
        por.setdefault(a["quadro"], {}).setdefault(a["composicao"], []).append(a["arquivo"])
    quadros = sorted(por)
    v4 = decodifica_v4(quadros, args.v4) if args.v4 else {}
    res = _le_json(args.resultado, {"versao": 2, "kit": args.kit, "ref": args.ref, "v4": args.v4, "quadros": []})
    feitos = {r["quadro"] for r in res["quadros"]}
    for q in quadros:
        par = por[q]
        if args.kit not in par or args.ref not in par:
            print("quadro %d: falta %s ou %s no lote" % (q, args.kit, args.ref))
            return 1
        ks = [carrega(p) for p in par[args.kit]]
        gs = [carrega(p) for p in par[args.ref]]
        mk = [md5_pixels(k) for k, _ in ks]
        mg = [md5_pixels(g) for g, _ in gs]
        pares = []
        for i, (k, _) in enumerate(ks):
            for j, (g, _) in enumerate(gs):
                pares.append((estatisticas(k, g), i, j))
        pares.sort(key=lambda x: _chave(x[0]))
        melhor, bi, bj = pares[0]
        pior = pares[-1][0]
        linha = {"quadro": q, "amostras": {args.kit: len(ks), args.ref: len(gs)},
                 "md5PixelsKit": mk, "md5PixelsRef": mg, "variantesKit": len(set(mk)), "variantesRef": len(set(mg)),
                 "identico": bool(set(mk) & set(mg)),
                 "kitContraRef": melhor, "kitContraRefPior": pior,
                 "alfaMinimo": min([a for _, a in ks] + [a for _, a in gs])}
        if len(gs) > 1:
            linha["refContraRef"] = sorted([estatisticas(gs[i][0], gs[j][0]) for i in range(len(gs)) for j in range(i + 1, len(gs))], key=_chave)[-1]
        if len(ks) > 1:
            linha["kitContraKit"] = sorted([estatisticas(ks[i][0], ks[j][0]) for i in range(len(ks)) for j in range(i + 1, len(ks))], key=_chave)[-1]
        if q in v4:
            linha["refContraV4"] = estatisticas(gs[0][0], v4[q])
            linha["kitContraV4"] = estatisticas(ks[0][0], v4[q])
        if args.miniaturas:
            from io import BytesIO
            k, g = ks[bi][0], gs[bj][0]
            for nome, arr in (("kit", k), ("dif", diferenca_visivel(k, g)), ("difv4", diferenca_visivel(gs[0][0], v4[q], 12) if q in v4 else None)):
                if arr is None:
                    continue
                buf = BytesIO()
                miniatura(arr, 108).save(buf, "JPEG", quality=82)
                escrita.grava_bytes(os.path.join(args.miniaturas, "%04d-%s.jpg" % (q, nome)), buf.getvalue(), cria_pasta=True)
        if q in feitos:
            res["quadros"] = [r for r in res["quadros"] if r["quadro"] != q]
        res["quadros"].append(linha)
        kc = linha["kitContraRef"]
        rr_ = linha.get("refContraRef", {})
        print("quadro %3d  kit x ref (melhor par): max %s media %.6f >2 %.4f%%  idêntico %s  ref x ref: max %s%s" % (
            q, kc["maximo"], kc["media"], kc["pct_acima_2"], "sim" if linha["identico"] else "não", rr_.get("maximo", "-"),
            ("   ref x V4: media %.4f max %d" % (linha["refContraV4"]["media"], linha["refContraV4"]["maximo"])) if "refContraV4" in linha else ""))
    res["quadros"].sort(key=lambda r: r["quadro"])
    escrita.grava_json(args.resultado, res, cria_pasta=True)
    return 0


def cmd_v4(args):
    a, _ = carrega(args.png)
    v = decodifica_v4([args.quadro], args.v4)[args.quadro]
    print(json.dumps(estatisticas(a, v)))
    return 0


def cmd_folha(args):
    res = _le_json(args.resultado, None)
    if not res:
        sys.exit("folha: resultado vazio")
    quadros = [r["quadro"] for r in res["quadros"]]
    cel_w, cel_h = 108, 192
    cols = 9  # 9 quadros por linha, cada quadro com 3 imagens (kit, dif kit x ref, dif ref x V4)
    linhas = (len(quadros) + cols - 1) // cols
    larg = cols * (cel_w * 3 + 10) + 10
    alt = linhas * (cel_h + 34) + 70
    folha = Image.new("RGB", (larg, alt), (250, 248, 245))
    dr = ImageDraw.Draw(folha)
    try:
        f1 = ImageFont.truetype(FONTE, 22)
        f1.set_variation_by_axes([700])
        f2 = ImageFont.truetype(FONTE, 13)
        f2.set_variation_by_axes([600])
    except Exception:
        f1 = f2 = ImageFont.load_default()
    dr.text((10, 12), "K06: KitMotion contra GuiaPronta (diferença x40) e GuiaPronta contra o V4 (diferença x12), por quadro", fill=(27, 30, 36), font=f1)
    dr.text((10, 42), "em cada quadro: still do KitMotion | diferença kit x GuiaPronta | diferença GuiaPronta x V4", fill=(82, 78, 72), font=f2)
    for i, r in enumerate(res["quadros"]):
        q = r["quadro"]
        x0 = 10 + (i % cols) * (cel_w * 3 + 10)
        y0 = 70 + (i // cols) * (cel_h + 34)
        for j, nome in enumerate(("kit", "dif", "difv4")):
            p = os.path.join(args.miniaturas, "%04d-%s.jpg" % (q, nome))
            if os.path.exists(p):
                folha.paste(Image.open(p).convert("RGB").resize((cel_w, cel_h)), (x0 + j * cel_w, y0))
        kc = r["kitContraRef"]
        txt = "q%d  kit max %d m %.3f" % (q, kc["maximo"], kc["media"])
        if "refContraV4" in r:
            txt += "  V4 m %.2f" % r["refContraV4"]["media"]
        dr.text((x0, y0 + cel_h + 4), txt, fill=(27, 30, 36), font=f2)
    from io import BytesIO
    buf = BytesIO()
    folha.save(buf, "JPEG", quality=80)
    escrita.grava_bytes(args.saida, buf.getvalue(), cria_pasta=True)
    print("folha gravada:", args.saida, folha.size, len(buf.getvalue()), "bytes")
    return 0


def cmd_tabela(args):
    res = _le_json(args.resultado, None)
    print("| quadro | kit = GuiaPronta (pixel a pixel) | kit x GuiaPronta, melhor par: máx | média | % px > 2 | GuiaPronta x GuiaPronta (abas): máx | GuiaPronta x V4: média | máx |")
    print("|---:|:---:|---:|---:|---:|---:|---:|---:|")
    for r in res["quadros"]:
        kc = r["kitContraRef"]
        v = r.get("refContraV4", {})
        rr_ = r.get("refContraRef", {})
        print("| %d | %s | %d | %.6f | %.4f | %s | %s | %s |" % (r["quadro"], "sim" if r.get("identico") else "não", kc["maximo"], kc["media"], kc["pct_acima_2"],
              rr_.get("maximo", ""), ("%.4f" % v["media"]) if v else "", v.get("maximo", "")))
    return 0


def main(argv):
    ap = argparse.ArgumentParser(description="comparação de stills do K06")
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("pares")
    p.add_argument("arquivos", nargs="+")
    b = sub.add_parser("base")
    bs = b.add_subparsers(dest="acao", required=True)
    br = bs.add_parser("registra")
    br.add_argument("pasta")
    br.add_argument("destino")
    br.add_argument("--rotulo", required=True)
    bc = bs.add_parser("confere")
    bc.add_argument("depois")
    bc.add_argument("antes")
    bc.add_argument("--saida", required=True)
    lo = sub.add_parser("lote")
    lo.add_argument("manifesto")
    lo.add_argument("--resultado", required=True)
    lo.add_argument("--v4", default=None)
    lo.add_argument("--miniaturas", default=None)
    lo.add_argument("--kit", default="KitMotion")
    lo.add_argument("--ref", default="GuiaPronta")
    v = sub.add_parser("v4")
    v.add_argument("png")
    v.add_argument("quadro", type=int)
    v.add_argument("--v4", default=V4)
    fo = sub.add_parser("folha")
    fo.add_argument("--resultado", required=True)
    fo.add_argument("--miniaturas", required=True)
    fo.add_argument("--saida", required=True)
    ta = sub.add_parser("tabela")
    ta.add_argument("--resultado", required=True)
    a = ap.parse_args(argv)
    if a.cmd == "pares":
        return cmd_pares(a)
    if a.cmd == "base":
        return cmd_base_registra(a) if a.acao == "registra" else cmd_base_confere(a)
    if a.cmd == "lote":
        return cmd_lote(a)
    if a.cmd == "v4":
        return cmd_v4(a)
    if a.cmd == "folha":
        return cmd_folha(a)
    return cmd_tabela(a)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main(sys.argv[1:]))
