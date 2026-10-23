# 22/10 (Pedro): monta o banco base de assets do editor de Design do Ateliê (estudio/base/assets e catalogo.json).
# Curadoria dos assets que já existem neste PC: as poses do Léo, a papelada e os papéis voando 3D, os celulares com
# tela real do app, o símbolo 3D, os objetos e ícones de argila (clay), os ícones Fluent 3D usados nas peças, a marca
# (símbolo e logos em SVG), o grifo à mão e os fundos do destaque "Comece por aqui" (feitos pelo fundos.cjs).
# Sem duplicata, sem rascunho (*-raw), sem vídeo. Fora de propósito:
#  - selo e comprovante com selo de argila, e as cenas do DP (cadastro e holerite): o visto deles não é o símbolo da
#    marca (regra do Pedro: todo visto é o simbolo.svg inteiro)
#  - iphone-t7-splash (o fone-splash é o mesmo aparelho com a mesma tela), estrelas de argila (131 px, pequenas
#    demais), lua com estrelas (a lua sozinha já está), voando-a/b e papelada-a (versões sem recorte)
#  - telas chapadas do app (tela chapada é proibida nas peças: o banco tem o celular com a tela dentro)
# O que muda nos arquivos:
#  - as poses do Léo com fundo papel (3, 4, 5, 7, 9, 10 e os bustos) ganham recorte com alfa: o papel ligado à borda
#    sai com alfa suave pela distância de cor (o mesmo método do matte.py do reel de 02/10), a sombra do chão vira
#    preto com alfa (aparece em qualquer fundo) e o GrabCut refina a faixa dos pés
#  - o símbolo 3D (check-3d-recorte.png, fundo escuro da vinheta) sai recortado pela distância pro fundo escuro
#  - tudo com alfa é aparado (sobra transparente fora, 4 px de folga) e fica com o lado maior até 2400 px; os ícones
#    Fluent ficam quadrados como vieram (256 px)
#  - SVG ganha width e height (o navegador desenha SVG sem tamanho errado no canvas da exportação)
# Cada item guarda em "fonte" de onde veio e o recorte (x, y em px do original) e a escala aplicada: o
# importar-destaque.cjs usa isso pra pôr o asset exatamente onde a imagem original estava.
# Roda só neste PC (lê marketing/), com o Python do venv do corte-viral (PIL, numpy, OpenCV):
#   node estudio/base/fundos.cjs
#   "C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe" estudio/base/montar-banco.py
#   "C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe" -I estudio/base/miniaturas.py
# 22/10 (Pedro): os mockups, texturas e manchas de meio-tom do Ateliê original entram pelo importar-atelie.py (lote
# "atelie" no catálogo); este script mantém o lote quando refaz o catálogo. Os bustos do Léo têm a tag "corte reto":
# a área segura deixa eles colados na borda de baixo da página (estudio.mjs)
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

BASE = Path(__file__).resolve().parent
ASSETS = BASE / 'assets'
RAIZ = BASE.parents[2]  # Content Legalizai
MKT = RAIZ / 'marketing'
DQ = MKT / 'destaques' / 'comece-por-aqui' / 'assets'
LADO_MAX = 2400
FOLGA = 4
CRIADO_EM = '2026-10-22T12:00:00.000Z'

LIC_LEO = 'Legalizaí (próprio): o Léo, mascote da marca, gerado no Higgsfield (nano_banana_pro) a partir das referências dele'
LIC_PROPRIO_IA = 'Legalizaí (próprio): gerado no Higgsfield (nano_banana_pro) pra marca'
LIC_CLAY = 'Legalizaí (próprio): ilustração 3D de argila gerada por IA no estilo do design guide'
LIC_FLUENT = 'MIT (Fluent Emoji 3D da Microsoft): uso comercial livre, sem crédito no post; azul e verde trocados pelo coral'
LIC_IPHONE = 'Royalty Free (iPhone 3D do BlenderKit, autor Fiq KM): uso comercial sem crédito; a tela é do app Legalizaí'
LIC_MARCA = 'Legalizaí (marca própria)'
LIC_CODIGO = 'Legalizaí (próprio): feito em código com as cores do design system'
LIC_RENDER = 'Legalizaí (próprio): render do símbolo 3D da vinheta O Check (Blender)'

# ---------- recorte do fundo papel ----------


def lab(rgb):
    l = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
    l[..., 0] *= 100 / 255
    l[..., 1] -= 128
    l[..., 2] -= 128
    return l


def modelo_fundo(rgb, mascara):
    # o papel da foto não é chapado: quadrática por canal ajustada nos pixels de fundo
    h, w, _ = rgb.shape
    ys, xs = np.nonzero(mascara)
    if len(ys) > 200000:
        sel = np.random.default_rng(1).choice(len(ys), 200000, replace=False)
        ys, xs = ys[sel], xs[sel]
    u, v = xs / w, ys / h
    A = np.stack([np.ones_like(u), u, v, u * u, u * v, v * v], 1)
    gy, gx = np.mgrid[0:h, 0:w]
    U, V = gx / w, gy / h
    B = np.stack([np.ones_like(U), U, V, U * U, U * V, V * V], -1)
    out = np.zeros(rgb.shape, np.float32)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A, rgb[ys, xs, c].astype(np.float32), rcond=None)
        out[..., c] = B @ coef
    return np.clip(out, 0, 255)


def recorte_papel(rgb, lo=2.5, hi=11.0, limiar=8.0, piso=0.82):
    """rgb uint8 HxWx3 com fundo papel -> (cor uint8, alfa uint8, fundo float). piso: a faixa do chão (fração da
    altura) onde a sombra pode existir; None no busto (sem chão)."""
    h, w, _ = rgb.shape
    f = rgb.astype(np.float32)
    borda = np.concatenate([f[0], f[-1], f[:, 0], f[:, -1]])
    L = lab(rgb)
    Lm = lab(np.median(borda, 0)[None, None, :])[0, 0]
    bg = modelo_fundo(rgb, np.sqrt(((L - Lm) ** 2).sum(-1)) < 10)
    Lb = lab(bg)
    de = np.sqrt(((L - Lb) ** 2).sum(-1))
    dL = L[..., 0] - Lb[..., 0]
    chao = np.zeros((h, w), bool)
    if piso is not None:
        chao[int(h * piso):] = True
    # sombra do chão: mais escura que o papel, sem cor própria (ou quente, mas lisa: pelo tem fio, sombra não)
    razao = f / np.maximum(bg, 1)
    espalha = razao.max(-1) - razao.min(-1)
    dif = np.maximum(bg - f, 0)
    cosang = dif.sum(-1) / (np.sqrt((dif ** 2).sum(-1)) * np.sqrt(3) + 1e-6)
    lum = f.mean(-1)
    m1, m2 = cv2.blur(lum, (7, 7)), cv2.blur(lum * lum, (7, 7))
    dp = np.sqrt(np.maximum(m2 - m1 * m1, 0))
    lisa = cv2.erode((dp < 3.5).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    neutro = chao & ((espalha < 0.09) | (lisa & (cosang > np.cos(np.radians(12))))) & (dL < 0)
    # fundo = o que é papel (ou sombra dele) e está ligado à borda; gravata, crachá e dentes ficam opacos
    cand = (de < limiar) | neutro
    hp, wp = h // 2, w // 2
    peq = cv2.resize(cand.astype(np.uint8), (wp, hp), interpolation=cv2.INTER_NEAREST)
    n, rot = cv2.connectedComponents(peq, connectivity=4)
    da_borda = set(np.unique(np.concatenate([rot[0], rot[-1], rot[:, 0], rot[:, -1]])).tolist()) - {0}
    reg = np.isin(rot, list(da_borda))
    # buraco de papel preso entre perna, pé e rabo (só no chão)
    if piso is not None:
        de_p = cv2.resize(de, (wp, hp), interpolation=cv2.INTER_AREA)
        dl_p = cv2.resize(dL, (wp, hp), interpolation=cv2.INTER_AREA)
        ne_p = cv2.resize(neutro.astype(np.float32), (wp, hp), interpolation=cv2.INTER_AREA)
        minimo = max(60, int(0.00015 * peq.size))
        for k in range(1, n):
            if k in da_borda:
                continue
            m = rot == k
            if int(m.sum()) < minimo or np.nonzero(m)[0].mean() < piso * hp:
                continue
            if (de_p[m].mean() < 5 and dl_p[m].mean() < 0.8) or ne_p[m].mean() > 0.5:
                reg |= m
    reg = cv2.dilate(reg.astype(np.uint8), np.ones((3, 3), np.uint8), 1)
    reg = cv2.resize(reg, (w, h), interpolation=cv2.INTER_NEAREST).astype(bool)
    suave = np.clip((de - lo) / (hi - lo), 0, 1)
    suave = suave * suave * (3 - 2 * suave)
    a = cv2.GaussianBlur(np.where(reg, suave, 1.0).astype(np.float32), (3, 3), 0)
    sombra = reg & neutro & (dL < -0.5)
    a_sombra = np.clip(1 - lum / np.maximum(bg.mean(-1), 1), 0, 1)
    # despill: a borda semitransparente perde a mistura com o papel
    semi = (a > 0.02) & (a < 0.98) & ~sombra
    aa = np.maximum(a, 0.12)[..., None]
    cor = np.where(semi[..., None], np.clip((f - (1 - aa) * bg) / aa, 0, 255), f)
    cor = np.where(sombra[..., None], 0, cor)
    a = np.where(sombra, a_sombra, a)
    return cor.astype(np.uint8), (np.clip(a, 0, 1) * 255).round().astype(np.uint8), bg


def refinar_chao(rgb, cor, a, bg, piso=0.75):
    """GrabCut na faixa dos pés: o que é fundo vira sombra preta com alfa pela luz (sem mancha clara entre os pés)."""
    h = rgb.shape[0]
    y0 = int(h * piso)
    sub = np.ascontiguousarray(rgb[y0:])
    lum = sub.astype(np.float32).mean(-1)
    m1, m2 = cv2.blur(lum, (7, 7)), cv2.blur(lum * lum, (7, 7))
    dp = np.sqrt(np.maximum(m2 - m1 * m1, 0))
    aa = a[y0:].astype(np.float32) / 255
    mask = np.full(lum.shape, cv2.GC_PR_FGD, np.uint8)
    mask[aa < 0.6] = cv2.GC_PR_BGD
    mask[aa < 0.05] = cv2.GC_BGD
    certo = cv2.erode(((aa > 0.99) & (dp > 7)).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
    mask[certo] = cv2.GC_FGD
    cv2.grabCut(sub, mask, None, np.zeros((1, 65)), np.zeros((1, 65)), 5, cv2.GC_INIT_WITH_MASK)
    fg = (mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)
    fg = cv2.morphologyEx(fg.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)
    a_sombra = np.clip(1 - lum / np.maximum(bg[y0:].mean(-1), 1), 0, 0.7)
    a2 = a.astype(np.float32) / 255
    a2[y0:] = np.where(fg, aa, a_sombra)
    c2 = cor.copy()
    c2[y0:] = np.where(fg[..., None], cor[y0:], 0)
    return c2, (np.clip(a2, 0, 1) * 255).round().astype(np.uint8)


def recorte_escuro(rgb, lo=28.0, hi=70.0):
    """O símbolo 3D sobre o fundo escuro da vinheta: alfa pela distância de cor pro fundo (ajustado nas bordas)."""
    f = rgb.astype(np.float32)
    h, w, _ = rgb.shape
    borda = np.zeros((h, w), bool)
    borda[:40], borda[-40:], borda[:, :40], borda[:, -40:] = True, True, True, True
    bg = modelo_fundo(rgb, borda)
    d = np.sqrt(((f - bg) ** 2).sum(-1))
    a = np.clip((d - lo) / (hi - lo), 0, 1)
    a = a * a * (3 - 2 * a)
    # o que não é ligado ao símbolo (ruído do fundo) sai
    n, rot, st, _ = cv2.connectedComponentsWithStats((a > 0.5).astype(np.uint8), connectivity=8)
    maior = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    corpo = cv2.dilate((rot == maior).astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
    a = np.where(corpo, a, 0).astype(np.float32)
    aa = np.maximum(a, 0.12)[..., None]
    semi = (a > 0.02) & (a < 0.98)
    cor = np.where(semi[..., None], np.clip((f - (1 - aa) * bg) / aa, 0, 255), f)
    return cor.astype(np.uint8), (a * 255).round().astype(np.uint8)


# ---------- utilidades ----------


def aparar(im, folga=FOLGA):
    """Corta a sobra transparente. Devolve (imagem, (x0, y0)) no sistema do original."""
    a = np.asarray(im.getchannel('A'))
    ys, xs = np.nonzero(a > 2)
    if not len(ys):
        return im, (0, 0)
    x0, y0 = max(0, xs.min() - folga), max(0, ys.min() - folga)
    x1, y1 = min(im.width, xs.max() + 1 + folga), min(im.height, ys.max() + 1 + folga)
    return im.crop((x0, y0, x1, y1)), (int(x0), int(y0))


def reduzir(im):
    """Lado maior até 2400 px, com alfa pré-multiplicado (sem franja na borda). Devolve (imagem, escala)."""
    lado = max(im.size)
    if lado <= LADO_MAX:
        return im, 1.0
    e = LADO_MAX / lado
    novo = (max(1, round(im.width * e)), max(1, round(im.height * e)))
    return im.convert('RGBa').resize(novo, Image.LANCZOS).convert('RGBA'), novo[0] / im.width


def rel(p):
    return Path(p).resolve().relative_to(RAIZ).as_posix()


def salvar_png(im, nome):
    destino = ASSETS / f'{nome}.png'
    im.save(destino, optimize=True)
    return destino


def svg_com_tamanho(origem, nome, texto=None):
    s = texto if texto is not None else Path(origem).read_text(encoding='utf-8')
    vb = re.search(r'viewBox="([\d.\s-]+)"', s)
    _, _, vw, vh = [float(x) for x in vb.group(1).split()]
    s = re.sub(r'<\?xml[^>]*>\s*', '', s)
    s = re.sub(r'\s(id|data-name)="[^"]*"', '', s, count=0)
    if ' width=' not in s.split('>', 1)[0]:
        s = s.replace('<svg ', f'<svg width="{vw:g}" height="{vh:g}" ', 1)
    if 'script' in s.lower() or 'foreignobject' in s.lower():
        raise SystemExit(f'{nome}: SVG com script ou foreignObject não entra')
    destino = ASSETS / f'{nome}.svg'
    destino.write_text(s.strip() + '\n', encoding='utf-8')
    return destino, round(vw), round(vh)


# ---------- o banco ----------

POSES = DQ / 'leo-poses'
HERO = MKT / 'leo-animado' / 'precificacao-2026-10-02' / 'hero'
CLAY = MKT / 'leo-animado' / 'abertura-mes-2026-10-01' / 'assets'
ICONES_APP = RAIZ / 'cronograma' / 'public' / 'img' / '3d'
FLUENT = DQ / 'icones'

# (nome, arquivo de origem, processo, categoria, tags, descrição, licença)
# processo: alfa (já tem alfa: apara e reduz), papel (recorta do fundo papel, corpo inteiro), busto (recorta, sem
# chão), escuro (recorta do fundo escuro), quadrado (copia como veio), webp (converte pra PNG e apara), fundo (já
# feito pelo fundos.cjs, sem alfa), luz (já feito pelo fundos.cjs, com alfa)
ITENS = [
    # Léo
    ('leo-apontando-pra-cima', POSES / 'leo1.png', 'alfa', 'leo', ['léo', 'corpo inteiro', 'apontando', 'gancho', 'de frente'],
     'Léo de corpo inteiro, de frente, sorrindo, apontando pra cima e pra direita com o dedo. Bom pra gancho: o texto em cima e o Léo grande embaixo, dentro da área segura, apontando pra ele.', LIC_LEO),
    ('leo-cansado', POSES / 'leo2.png', 'alfa', 'leo', ['léo', 'corpo inteiro', 'cansado', 'dor', 'burocracia'],
     'Léo de corpo inteiro, virado pra direita, cansado, com a pata na testa. Bom pra dor: burocracia, papelada, prazo. Combina com a pilha de papelada ao lado.', LIC_LEO),
    ('leo-bracos-abertos', POSES / 'leo3.png', 'papel', 'leo', ['léo', 'corpo inteiro', 'braços abertos', 'apresentando', 'virada'],
     'Léo de corpo inteiro, de frente, sorrindo, com os dois braços abertos pra cima, apresentando o que está acima dele. Bom pra virada, novidade e lançamento (embaixo dos celulares).', LIC_LEO),
    ('leo-acenando', POSES / 'leo4.png', 'papel', 'leo', ['léo', 'corpo inteiro', 'acenando', 'oi', 'time'],
     'Léo de corpo inteiro, acenando com uma pata erguida, rosto virado pra direita, sorrindo. Bom pra dar oi e apresentar o time.', LIC_LEO),
    ('leo-jogando-pro-alto', POSES / 'leo5.png', 'papel', 'leo', ['léo', 'corpo inteiro', 'jogando', 'alívio', 'papéis'],
     'Léo de corpo inteiro, de lado, virado pra direita, com as patas jogando algo pro alto à direita. Bom pra alívio, tirar a burocracia das costas; combina com os papéis voando acima dele.', LIC_LEO),
    ('leo-bracos-cruzados', POSES / 'leo6.png', 'alfa', 'leo', ['léo', 'corpo inteiro', 'braços cruzados', 'confiante', 'combinado'],
     'Léo de corpo inteiro, de frente, de braços cruzados, confiante. Bom pra promessa e combinado. No fundo coral, pôr o disco de papel atrás (a polo coral some no coral).', LIC_LEO),
    ('leo-apontando-pro-lado', POSES / 'leo7.png', 'papel', 'leo', ['léo', 'corpo inteiro', 'apontando', 'lista', 'esquerda'],
     'Léo de corpo inteiro, virado pra esquerda, apontando pra baixo e pra esquerda. Bom ao lado de uma lista ou de cartões que ficam à esquerda e abaixo dele.', LIC_LEO),
    ('leo-comemorando-punho', POSES / 'leo8.png', 'alfa', 'leo', ['léo', 'corpo inteiro', 'comemorando', 'conquista', 'em dia'],
     'Léo de corpo inteiro, de punho erguido, comemorando de boca aberta. Bom pra conquista, empresa em dia, prazo cumprido.', LIC_LEO),
    ('leo-apontando-pra-baixo', POSES / 'leo9.png', 'papel', 'leo', ['léo', 'corpo inteiro', 'apontando', 'link', 'cta'],
     'Léo de corpo inteiro, de frente, uma pata na cintura e a outra apontando pra baixo e pra direita. Bom em cima do espaço do sticker de link ou de um botão. Recorte feito do fundo papel: no escuro, confira a borda clara do alto da cabeça.', LIC_LEO),
    ('leo-comemorando-bracos', POSES / 'leo10.png', 'papel', 'leo', ['léo', 'corpo inteiro', 'comemorando', 'fecho', 'vai legalizaí'],
     'Léo de corpo inteiro, de frente, os dois braços pra cima, comemorando de boca aberta. Bom pro fecho "Vai, Legalizaí".', LIC_LEO),
    ('leo-busto-sorrindo', HERO / 'hero-v1.png', 'busto', 'leo', ['léo', 'busto', 'sorrindo', 'de frente', 'retrato', 'corte reto'],
     'Léo da cintura pra cima, de frente, sorrindo de boca fechada, braços pra baixo, olhando pra câmera. O corte embaixo é reto: fica colado na borda de baixo da página (a única exceção da área segura, só na base) ou com o corte escondido atrás de um cartão.', LIC_LEO),
    ('leo-busto-patas', HERO / 'hero-patas-v1.png', 'busto', 'leo', ['léo', 'busto', 'explicando', 'patas', 'de frente', 'corte reto'],
     'Léo da cintura pra cima, de frente, sorrindo, com as duas patas abertas na altura do peito, como quem explica ou apresenta. O corte embaixo é reto: fica colado na borda de baixo da página (a única exceção da área segura, só na base) ou com o corte escondido atrás de um cartão.', LIC_LEO),
    # objetos 3D
    ('papelada', DQ / 'papelada.png', 'alfa', '3d', ['papelada', 'burocracia', 'pilha', 'documentos', 'carimbo'],
     'Pilha alta de papelada em 3D realista: folhas, pastas, post-its coral e um carimbo de madeira. A dor da burocracia.', LIC_PROPRIO_IA),
    ('papeis-voando', DQ / 'papeis-voando.png', 'alfa', '3d', ['papéis', 'voando', 'alívio', 'pasta', 'leveza'],
     'Folhas e uma pasta parda em 3D voando pra longe, espalhadas. Alívio: a burocracia indo embora.', LIC_PROPRIO_IA),
    ('simbolo-3d', DQ / 'check-3d-recorte.png', 'escuro', '3d', ['símbolo', 'check', 'visto', 'marca', '3d'],
     'O símbolo da marca em 3D (quadrado coral de cantos redondos com o visto branco), de frente. É o visto oficial em 3D: usar sempre inteiro, nunca cortado.', LIC_RENDER),
    ('celular-tela-coral', MKT / '3d' / 'celulares' / 'renders' / 'iphone-t5.png', 'alfa', '3d', ['celular', 'iphone', 'tela lisa', 'de frente'],
     'iPhone de frente com a tela coral lisa, sem nada escrito. Base pra pôr uma tela do app por cima.', LIC_IPHONE),
    ('celular-inclinado-tela-coral', MKT / '3d' / 'celulares' / 'renders' / 'iphone-t2.png', 'alfa', '3d', ['celular', 'iphone', 'inclinado', 'tela lisa'],
     'iPhone levemente inclinado, em perspectiva, com a tela coral lisa. Dá movimento à peça.', LIC_IPHONE),
    # celulares com tela real do app
    ('celular-tela-criar-acesso', DQ / 'fone-conta.png', 'alfa', 'tela-app', ['celular', 'tela real', 'cadastro', 'criar acesso', 'app'],
     'iPhone de frente com a tela real do app: "Criar acesso" (o cadastro, com o Léo no topo da tela). Tela pronta, sem MEI.', LIC_IPHONE),
    ('celular-tela-abertura', DQ / 'fone-splash.png', 'alfa', 'tela-app', ['celular', 'tela real', 'abertura', 'splash', 'logo'],
     'iPhone de frente com a abertura do app: tela coral com o logo Legalizaí no meio.', LIC_IPHONE),
    ('celular-tela-emitir-nota', DQ / 'fone-emitir.png', 'alfa', 'tela-app', ['celular', 'tela real', 'nota fiscal', 'emitir nota', 'app'],
     'iPhone de frente com a tela real do app: "Emitir nota" (pra quem é a nota, valor e serviço). Tela pronta, sem MEI.', LIC_IPHONE),
    # argila (clay)
    ('comprovante-argila', CLAY / 'comprovante-sem-selo.png', 'alfa', '3d', ['argila', 'clay', 'comprovante', 'guia', 'boleto'],
     'Comprovante de papel em argila creme, com linhas e código de barras, enrolando no alto. Guia, boleto, recibo.', LIC_CLAY),
    ('pasta-argila', CLAY / 'pasta.png', 'alfa', '3d', ['argila', 'clay', 'pasta', 'documentos', 'arquivo'],
     'Pasta de arquivo em argila creme com aba coral e folhas dentro. Documentos organizados.', LIC_CLAY),
    ('lua-argila', CLAY / 'lua-sem-estrelas.png', 'alfa', '3d', ['argila', 'clay', 'lua', 'noite', 'descanso'],
     'Lua crescente em argila creme. Noite, descanso, trabalhar até tarde.', LIC_CLAY),
    ('calendario-argila', ICONES_APP / 'calendario.webp', 'webp', 'icone', ['argila', 'clay', 'calendário', 'prazo', 'data'],
     'Calendário em argila creme com argolas coral e um dia marcado em coral. Prazo, data, mês.', LIC_CLAY),
    ('alvo-argila', ICONES_APP / 'campanha.webp', 'webp', 'icone', ['argila', 'clay', 'alvo', 'meta', 'campanha'],
     'Alvo em argila coral e creme com uma flecha no centro. Meta, objetivo, acertar.', LIC_CLAY),
    ('grafico-argila', ICONES_APP / 'growth.webp', 'webp', 'icone', ['argila', 'clay', 'gráfico', 'crescimento', 'faturamento'],
     'Gráfico de barras subindo em argila, com a seta coral pra cima. Crescimento, faturamento.', LIC_CLAY),
    ('lampada-argila', ICONES_APP / 'lampada.webp', 'webp', 'icone', ['argila', 'clay', 'lâmpada', 'dica', 'ideia'],
     'Lâmpada acesa em argila creme com o miolo coral. Dica, ideia.', LIC_CLAY),
    ('medidor-argila', ICONES_APP / 'metricas.webp', 'webp', 'icone', ['argila', 'clay', 'medidor', 'velocímetro', 'resultado'],
     'Medidor redondo em argila creme com o ponteiro coral. Medir, resultado, desempenho.', LIC_CLAY),
    ('bussola-argila', ICONES_APP / 'inspiracoes.webp', 'webp', 'icone', ['argila', 'clay', 'bússola', 'direção', 'caminho'],
     'Bússola em argila creme com a agulha coral e preta. Direção, caminho certo.', LIC_CLAY),
    ('video-argila', ICONES_APP / 'reels.webp', 'webp', 'icone', ['argila', 'clay', 'vídeo', 'reels', 'play'],
     'Cartões em argila com o botão de play coral. Vídeo, reels.', LIC_CLAY),
]

FLUENT_ITENS = [
    ('aceno', 'Mão acenando, amarela.', ['mão', 'oi', 'acenando']),
    ('ampulheta', 'Ampulheta com areia caindo (o vidro tem azul claro).', ['tempo', 'prazo', 'espera']),
    ('balao', 'Balão de fala lilás claro.', ['conversa', 'fala', 'contabilês']),
    ('brilho', 'Brilhos amarelos de quatro pontas.', ['brilho', 'novidade', 'destaque']),
    ('cafe', 'Xícara de café lilás.', ['café', 'pausa', 'rotina']),
    ('calendario', 'Calendário com um dia marcado em coral.', ['calendário', 'prazo', 'data']),
    ('confete', 'Cone de festa soltando confete colorido.', ['festa', 'comemorar', 'conquista']),
    ('coracao', 'Coração coral.', ['coração', 'humano', 'cuidado']),
    ('dedo-baixo', 'Mão amarela apontando pra baixo.', ['apontar', 'link', 'embaixo']),
    ('envelope', 'Envelope lilás claro.', ['mensagem', 'email', 'aviso']),
    ('escudo', 'Escudo coral.', ['proteção', 'confiável', 'segurança']),
    ('estrela', 'Estrela amarela com brilhos.', ['estrela', 'destaque', 'favorito']),
    ('foguete', 'Foguete subindo (tem detalhe azul).', ['lançamento', 'rápido', 'crescer']),
    ('lupa', 'Lupa com lente coral.', ['transparente', 'olhar de perto', 'conferir']),
    ('maleta', 'Maleta de trabalho vinho.', ['negócio', 'trabalho', 'empresa']),
    ('papel', 'Folha de papel com linhas.', ['papel', 'documento', 'papelada']),
    ('pasta', 'Pasta de arquivo amarela.', ['pasta', 'documentos', 'papelada']),
    ('pena', 'Pena de escrever.', ['assinar', 'leveza', 'escrever']),
    ('predio', 'Prédio público de colunas, cinza.', ['órgão', 'governo', 'prefeitura']),
    ('quebracabeca', 'Peça de quebra-cabeça coral.', ['descomplicado', 'encaixe', 'solução']),
    ('raio', 'Raio laranja.', ['rápido', 'proativa', 'energia']),
    ('relogio', 'Despertador vermelho e amarelo.', ['prazo', 'hora', 'urgente']),
    ('sino', 'Sino amarelo.', ['aviso', 'lembrete', 'notificação']),
]

FUNDOS = [
    ('papel', 'Papel quente (#FAF8F5) com brilho coral leve nos cantos de cima à direita e de baixo à esquerda, e grão de papel. O fundo claro padrão.'),
    ('escuro', 'Escuro da marca (degradê de #2A2E37 a #15171C) com luz coral no alto à esquerda e grão. Pra o problema e a dor.'),
    ('coral', 'Coral da marca (#F2643C) com luz branca no alto à direita, sombra no canto de baixo e grão. Pra o propósito e as capas.'),
    ('vinheta', 'Escuro quente da vinheta O Check (degradê vinho para grafite) com grão. É o fundo do símbolo 3D.'),
]

MARCA = [
    ('simbolo', RAIZ / 'identidade' / 'logos' / 'simbolo.svg', 'Símbolo da marca: quadrado coral de cantos redondos com o visto branco. Todo visto ou check da peça é este símbolo inteiro.', ['símbolo', 'check', 'visto', 'marca']),
    ('logo-horizontal', RAIZ / 'identidade' / 'logos' / 'legalizai-logo-horizontal.svg', 'Logo horizontal Legalizaí (símbolo coral e nome em tinta, o "ai" em coral). Pra fundo claro.', ['logo', 'marca', 'fundo claro']),
    ('logo-negativo-claro', RAIZ / 'identidade' / 'logos' / 'legalizai-logo-negativa-clara.svg', 'Logo horizontal todo branco. Pra fundo escuro ou coral.', ['logo', 'marca', 'fundo escuro', 'branco']),
    ('logo-negativo-escuro', RAIZ / 'identidade' / 'logos' / 'legalizai-logo-negativa-escura.svg', 'Logo horizontal todo em tinta (#1B1E24). Pra fundo claro, numa cor só.', ['logo', 'marca', 'tinta']),
]
SIMBOLO_NEGATIVO = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 211.09 211.09">\n'
                    '  <rect fill="#fff" width="211.09" height="211.09" rx="32.84" ry="32.84"/>\n'
                    '  <path fill="#f2643c" d="M211.09,32.95l-105.47,105.47-33.6-33.6c-13.22-13.22-34.65-13.22-47.87,0h0s60.8,60.8,60.8,60.8c11.41,11.41,29.92,11.41,41.33,0l84.81-84.81v-47.87Z"/>\n'
                    '</svg>')
# o grifo à mão do destaque (<symbol id="risco">): esticado na largura da palavra, o traço estica junto
RABISCO = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 34" preserveAspectRatio="none" overflow="visible">\n'
           '  <path d="M6 22 C 70 8, 150 6, 230 14 S 360 26, 394 12" fill="none" stroke="#F2643C" stroke-width="9" stroke-linecap="round"/>\n'
           '</svg>')


def item(nome, titulo, categoria, tags, descricao, licenca, arquivo, largura, altura, tipo, fonte=None):
    d = {
        'id': f'ast_base_{nome}', 'nome': titulo, 'categoria': categoria, 'tags': tags, 'descricao': descricao,
        'origem': 'base', 'largura': int(largura), 'altura': int(altura), 'tipo': tipo,
        'tamanho': (ASSETS / arquivo).stat().st_size, 'licenca': licenca, 'oculto': False,
        'criadoEm': CRIADO_EM, 'criadoPor': 'Legalizaí', 'arquivo': arquivo,
    }
    if fonte:
        d['fonte'] = fonte
    return d


TITULOS = {
    'leo-apontando-pra-cima': 'Léo apontando pra cima', 'leo-cansado': 'Léo cansado', 'leo-bracos-abertos': 'Léo de braços abertos',
    'leo-acenando': 'Léo acenando', 'leo-jogando-pro-alto': 'Léo jogando pro alto', 'leo-bracos-cruzados': 'Léo de braços cruzados',
    'leo-apontando-pro-lado': 'Léo apontando pro lado', 'leo-comemorando-punho': 'Léo comemorando (punho)',
    'leo-apontando-pra-baixo': 'Léo apontando pra baixo', 'leo-comemorando-bracos': 'Léo comemorando (braços)',
    'leo-busto-sorrindo': 'Léo, busto sorrindo', 'leo-busto-patas': 'Léo, busto explicando', 'papelada': 'Papelada 3D',
    'papeis-voando': 'Papéis voando 3D', 'simbolo-3d': 'Símbolo 3D', 'celular-tela-coral': 'Celular, tela coral lisa',
    'celular-inclinado-tela-coral': 'Celular inclinado, tela coral', 'celular-tela-criar-acesso': 'Celular, tela Criar acesso',
    'celular-tela-abertura': 'Celular, tela de abertura', 'celular-tela-emitir-nota': 'Celular, tela Emitir nota',
    'comprovante-argila': 'Comprovante de argila', 'pasta-argila': 'Pasta de argila', 'lua-argila': 'Lua de argila',
    'calendario-argila': 'Calendário de argila', 'alvo-argila': 'Alvo de argila', 'grafico-argila': 'Gráfico de argila',
    'lampada-argila': 'Lâmpada de argila', 'medidor-argila': 'Medidor de argila', 'bussola-argila': 'Bússola de argila',
    'video-argila': 'Vídeo de argila',
}
NOMES_FLUENT = {
    'aceno': 'Mão acenando', 'ampulheta': 'Ampulheta', 'balao': 'Balão de fala', 'brilho': 'Brilhos', 'cafe': 'Café',
    'calendario': 'Calendário', 'confete': 'Confete', 'coracao': 'Coração', 'dedo-baixo': 'Dedo pra baixo', 'envelope': 'Envelope',
    'escudo': 'Escudo', 'estrela': 'Estrela', 'foguete': 'Foguete', 'lupa': 'Lupa', 'maleta': 'Maleta', 'papel': 'Folha de papel',
    'pasta': 'Pasta amarela', 'pena': 'Pena', 'predio': 'Prédio público', 'quebracabeca': 'Quebra-cabeça', 'raio': 'Raio',
    'relogio': 'Despertador', 'sino': 'Sino',
}


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    catalogo = []
    for nome, origem, processo, categoria, tags, descricao, licenca in ITENS:
        if processo in ('alfa', 'webp'):
            im = Image.open(origem).convert('RGBA')
        elif processo in ('papel', 'busto'):
            rgb = np.asarray(Image.open(origem).convert('RGB'))
            cor, a, bg = recorte_papel(rgb, piso=0.82 if processo == 'papel' else None)
            if processo == 'papel':
                cor, a = refinar_chao(rgb, cor, a, bg)
            im = Image.fromarray(np.dstack([cor, a]), 'RGBA')
        elif processo == 'escuro':
            cor, a = recorte_escuro(np.asarray(Image.open(origem).convert('RGB')))
            im = Image.fromarray(np.dstack([cor, a]), 'RGBA')
        else:
            raise SystemExit(f'processo desconhecido: {processo}')
        im, (x0, y0) = aparar(im)
        im, escala = reduzir(im)
        salvar_png(im, nome)
        fonte = {'arquivo': rel(origem), 'x': x0, 'y': y0, 'escala': round(escala, 6)}
        catalogo.append(item(nome, TITULOS[nome], categoria, tags, descricao, licenca, f'{nome}.png', im.width, im.height, 'image/png', fonte))
        print('ok', nome, im.size)
    for nome, descricao, tags in FLUENT_ITENS:
        origem = FLUENT / f'{nome}.png'
        im = Image.open(origem).convert('RGBA')
        salvar_png(im, f'icone-{nome}')
        fonte = {'arquivo': rel(origem), 'x': 0, 'y': 0, 'escala': 1}
        catalogo.append(item(f'icone-{nome}', NOMES_FLUENT[nome], 'icone', ['fluent', 'ícone 3d', *tags], f'Ícone 3D (Fluent Emoji): {descricao}', LIC_FLUENT, f'icone-{nome}.png', im.width, im.height, 'image/png', fonte))
    print('ok', len(FLUENT_ITENS), 'ícones Fluent')
    for f, descricao in FUNDOS:
        for fmt, rot in (('stories', 'stories 1080x1920'), ('feed', 'feed 1080x1350')):
            nome = f'fundo-{f}-{fmt}'
            im = Image.open(ASSETS / f'{nome}.png')
            catalogo.append(item(nome, f'Fundo {f} ({fmt})', 'fundo', ['fundo', f, fmt], f'{descricao} Tamanho de {rot}.', LIC_CODIGO, f'{nome}.png', im.width, im.height, 'image/png', {'arquivo': 'cronograma/estudio/base/fundos.cjs', 'x': 0, 'y': 0, 'escala': 1}))
    im = Image.open(ASSETS / 'brilho-coral.png')
    catalogo.append(item('brilho-coral', 'Luz coral', 'fundo', ['luz', 'brilho', 'coral', 'fundo escuro'], 'Luz coral redonda e suave, transparente nas bordas. Vai atrás de um objeto no fundo escuro (como a papelada do destaque). Pode passar da borda do quadro.', LIC_CODIGO, 'brilho-coral.png', im.width, im.height, 'image/png', {'arquivo': 'cronograma/estudio/base/fundos.cjs', 'x': 0, 'y': 0, 'escala': 1}))
    im = Image.open(ASSETS / 'disco-papel.png')
    catalogo.append(item('disco-papel', 'Disco de papel', 'fundo', ['disco', 'papel', 'base', 'fundo coral'], 'Disco de papel quente com sombra suave (a imagem tem 100 px de folga em volta do disco pra caber a sombra). Vai atrás do Léo no fundo coral, onde a polo coral sumiria.', LIC_CODIGO, 'disco-papel.png', im.width, im.height, 'image/png', {'arquivo': 'cronograma/estudio/base/fundos.cjs', 'x': 0, 'y': 0, 'escala': 1}))
    for nome, origem, descricao, tags in MARCA:
        destino, w, h = svg_com_tamanho(origem, nome)
        catalogo.append(item(nome, {'simbolo': 'Símbolo', 'logo-horizontal': 'Logo horizontal', 'logo-negativo-claro': 'Logo branco', 'logo-negativo-escuro': 'Logo em tinta'}[nome], 'marca', tags, descricao, LIC_MARCA, destino.name, w, h, 'image/svg+xml', {'arquivo': rel(origem), 'x': 0, 'y': 0, 'escala': 1}))
    destino, w, h = svg_com_tamanho(None, 'simbolo-negativo', SIMBOLO_NEGATIVO)
    catalogo.append(item('simbolo-negativo', 'Símbolo negativo', 'marca', ['símbolo', 'check', 'visto', 'marca', 'branco'], 'Símbolo da marca invertido: quadrado branco com o visto coral. Pro fundo coral (é a capa dos destaques).', LIC_MARCA, destino.name, w, h, 'image/svg+xml', {'arquivo': 'marketing/destaques/comece-por-aqui/quadros/destaque.html', 'x': 0, 'y': 0, 'escala': 1}))
    destino, w, h = svg_com_tamanho(None, 'grifo-coral', RABISCO)
    catalogo.append(item('grifo-coral', 'Grifo coral à mão', 'outro', ['grifo', 'sublinhado', 'rabisco', 'coral'], 'Traço coral feito à mão pra grifar uma palavra (vai embaixo dela, um pouco mais largo que ela). Estica na largura e na altura que receber. Usar pouco: uma palavra por peça.', LIC_MARCA, destino.name, w, h, 'image/svg+xml', {'arquivo': 'marketing/destaques/comece-por-aqui/quadros/destaque.html', 'x': 0, 'y': 0, 'escala': 1}))

    # 22/10 (Pedro): o lote do Ateliê original (importar-atelie.py, lê o clone que não fica neste repo) fica como está.
    # 23/10 (Pedro): também o lote das telas do app capturadas do protótipo ("telas-app", o Início com a Vigia fiscal) e o
    # dos ícones 3D dos carrosséis de 01/09 ("carrossel", o Giro e o 5 sinais, que o carrossel montado da peça usa)
    try:
        antigo = json.loads((BASE / 'catalogo.json').read_text(encoding='utf-8'))
        catalogo += [a for a in antigo.get('assets', []) if a.get('lote') in ('atelie', 'telas-app', 'carrossel') and (ASSETS / a['arquivo']).exists()]
    except FileNotFoundError:
        pass
    ids = [c['id'] for c in catalogo]
    assert len(ids) == len(set(ids)), 'id repetido'
    usados = {c['arquivo'] for c in catalogo}
    sobra = sorted(p.name for p in ASSETS.iterdir() if p.name not in usados)
    if sobra:
        print('AVISO arquivos fora do catálogo:', sobra)
    total = sum(c['tamanho'] for c in catalogo)
    saida = {
        'versao': 1,
        'descricao': 'Banco base de assets do editor de Design do Ateliê (22/10/2026). Montado por estudio/base/montar-banco.py; '
                     'os arquivos estão em estudio/base/assets/. "arquivo" e "fonte" são internos (o servidor não manda pra tela).',
        'geradoEm': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z'),
        'totalBytes': total,
        'assets': catalogo,
    }
    texto = json.dumps(saida, ensure_ascii=False, indent=2) + '\n'
    if '\u2014' in texto or '\u2013' in texto:
        raise SystemExit('travessão no catálogo')
    (BASE / 'catalogo.json').write_text(texto, encoding='utf-8')
    print(len(catalogo), 'assets,', round(total / 1024 / 1024, 1), 'MB')


if __name__ == '__main__':
    sys.exit(main())
