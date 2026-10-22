# 22/10 (Pedro): "use com base no original". Traz pro banco base do estúdio o que é GENÉRICO no Ateliê original
# (github.com/pedromberg-crypto/atelie, commit bdc7b76, o app em que o Pedro edita imagens hoje). Esse commit ainda tem
# peças, fotos, telas e logos de OUTRA marca: nada disso entra. Só entra o que não tem marca e tem licença que permite.
# Entra (lote "atelie" no catalogo.json, com a origem de cada um em "fonte"):
#  - 13 mockups de celular com tela branca (referencias/presente-sonoro/mockup-bases): 8 com mão, 5 sem mão. São os
#    "device PNG do Freepik" do _FORMULA-MOCKUP.md do Ateliê, sem marca nenhuma na tela. Recorte e alfa como vieram,
#    só aparados (sobra transparente fora) e com o lado maior até 2400 px
#  - 4 texturas (referencias/_universal/texturas, "Freepik, plano Premium, uso comercial", README de 18/06/2026):
#    as três de meio-tom em onda e o papel amassado. Viram camada com alfa (a cor é a tinta da marca e a força vem do
#    alfa), porque o editor não tem modo de mistura: o multiply do Ateliê vira transparência aqui
#  - 5 manchas de meio-tom (referencias/_universal/assets/halftone-blobs, SVG do Freepik recortado pelo Ateliê),
#    recoloridas do âmbar da outra marca pro coral da marca, em SVG (vetor, nítido em qualquer tamanho)
# Fica fora (e por quê):
#  - imagens-entrada/presente-sonoro (peças prontas e testes de mockup com a tela de outra marca), referencias/
#    presente-sonoro/mobile-site e letras (telas e prints de outra marca), encaixe-lancamento.png (tela de outra marca),
#    _bg-sala-lancamento.png (sala gerada no look âmbar da outra marca, licença não registrada), public/brand e
#    public/fonts (logo e fonte Clash Display de outra marca)
#  - os objetos 3D do Ateliê (fone, vinil, presente, carta...): vivem fora do repo (trafego-pago/criativos/aprovados/
#    marca/), não estão no clone
#  - formas Memphis, geométricas e estrelas (assets/geo-a, geo-b, memphis, stars-burst): enfeite decorativo, fora pela
#    regra do Pedro (13/10: enfeite decorativo fora; REGRAS_DESIGN do estúdio)
#  - paper-grao-cinza.svg (na verdade um bokeh rosa e verde fora da paleta), lightleak-escuro.svg (luz âmbar da outra
#    marca), halftone-speckle-claro.svg (grunge) e halftone-dots-tile.svg (o ladrilho sai quebrado no render)
# Roda só neste PC, com o Python do venv do corte-viral (PIL, numpy) e o Edge (render dos SVG, só como <img>, sem
# script). O clone fica fora do repo; o caminho vai no argumento:
#   "C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe" -I estudio/base/importar-atelie.py <clone>
# Depois: estudio/base/miniaturas.py (as miniaturas da grade). O montar-banco.py mantém o lote "atelie" quando refaz o
# catálogo.
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

BASE = Path(__file__).resolve().parent
ASSETS = BASE / 'assets'
LADO_MAX = 2400
FOLGA = 4
CRIADO_EM = '2026-10-22T12:00:00.000Z'
LOTE = 'atelie'
EDGE = Path(r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
TINTA = (0x1B, 0x1E, 0x24)
CORAL = '#f2643c'
AMBAR_OUTRA_MARCA = re.compile(r'#f9913c', re.I)

LIC_MOCKUP = ('Freepik, pela conta do Ateliê do Pedro (device PNG do _FORMULA-MOCKUP.md): uso comercial. O Ateliê usa o '
              'plano Premium (sem crédito), mas não registrou o plano do dia do download: se foi o grátis, pede o crédito '
              '"Designed by Freepik"')
LIC_TEXTURA = 'Freepik, plano Premium (uso comercial sem crédito), baixada pelo Ateliê do Pedro em 18/06/2026'
LIC_MEIO_TOM = ('Freepik, SVG recortado pelo Ateliê do Pedro (scripts/extrair-assets.mjs) e recolorido no coral: uso '
                'comercial. O plano do download não ficou registrado: se foi o grátis, pede o crédito "Designed by Freepik"')

USO_MOCKUP = (' A tela é branca e lisa: pôr por cima uma tela do app (imagem enviada ou do banco), girada no mesmo ângulo, '
              'ou um texto curto dentro dela. Tela branca sozinha não vai pro post (tela chapada vazia).')

# (arquivo no clone, nome no banco, título, categoria, tags, descrição). 22/10 (achado da revisão): o com-mao-1mao-diagonal
# ficou fora: tem a marca d'água do Gemini (a estrela no canto do aparelho)
MOCKUPS = [
    ('com-mao-1mao-frontal-a', 'mockup-mao-inclinado', 'Celular na mão, inclinado', 'foto',
     ['mockup', 'celular', 'mão', 'inclinado', 'tela branca'],
     'Mão de pele clara segurando um celular preto inclinado pra direita, com a tela branca. A mão entra pela borda de baixo, o celular fica no alto.'),
    ('com-mao-1mao-frontal-b', 'mockup-mao-de-frente', 'Celular na mão, de frente', 'foto',
     ['mockup', 'celular', 'mão', 'de frente', 'reto', 'tela branca'],
     'Mão segurando um celular preto reto, de frente pra câmera, com a tela branca. Bom pra encaixar uma tela do app sem girar.'),
    ('com-mao-1mao-frontal-c', 'mockup-mao-de-frente-pele-negra', 'Celular na mão de pele negra, de frente', 'foto',
     ['mockup', 'celular', 'mão', 'de frente', 'reto', 'pele negra', 'tela branca'],
     'Mão de pele negra segurando um celular preto reto, de frente, com a tela branca. A mão entra pela borda de baixo e pela direita.'),
    ('com-mao-1mao-frontal-d', 'mockup-mao-inclinado-direita', 'Celular na mão, inclinado pra direita', 'foto',
     ['mockup', 'celular', 'mão', 'inclinado', 'tela branca'],
     'Mão vindo da esquerda segurando um celular inclinado pra direita, com a tela branca. Deixa espaço livre em cima e à direita.'),
    ('com-mao-2maos-frontal-b', 'mockup-duas-maos-de-frente', 'Celular nas duas mãos, de frente', 'foto',
     ['mockup', 'celular', 'duas mãos', 'de frente', 'reto', 'tela branca'],
     'Duas mãos segurando um celular reto, de frente, como quem está usando o app. Tela branca no meio, as mãos entram pela borda de baixo.'),
    ('com-mao-2maos-frontal', 'mockup-duas-maos-inclinado', 'Celular nas duas mãos, inclinado', 'foto',
     ['mockup', 'celular', 'duas mãos', 'inclinado', 'tela branca'],
     'Duas mãos segurando um celular grande, levemente inclinado, com a tela branca. Close de perto, bom pra tela que precisa ser lida.'),
    ('com-mao-toque', 'mockup-mao-tocando', 'Celular na mão, dedo tocando a tela', 'foto',
     ['mockup', 'celular', 'mão', 'toque', 'dedo', 'tela branca'],
     'Uma mão segura o celular inclinado e o dedo da outra toca a tela branca. Bom pra mostrar uma ação no app (apertar um botão).'),
    ('sem-mao-1ap-diagonal-a', 'mockup-celular-em-pe', 'Celular em pé, levemente girado', '3d',
     ['mockup', 'celular', 'sem mão', 'em pé', 'tela branca'],
     'Celular preto sozinho, em pé e levemente girado, com a tela branca, sem mão. Alto e estreito, bom ao lado de um texto.'),
    ('sem-mao-1ap-diagonal-b', 'mockup-celular-diagonal', 'Celular em diagonal', '3d',
     ['mockup', 'celular', 'sem mão', 'diagonal', 'tela branca'],
     'Celular sozinho em diagonal (inclinado pra direita), moldura escura com borda acobreada, tela branca, sem mão.'),
    ('sem-mao-2ap', 'mockup-dois-celulares', 'Dois celulares', '3d',
     ['mockup', 'celular', 'sem mão', 'dois aparelhos', 'tela branca'],
     'Dois celulares inclinados, um na frente do outro (um preto, um prata), com as telas brancas. Bom pra antes e depois ou duas telas do app.'),
    ('sem-mao-3ap-a', 'mockup-tres-celulares-leque', 'Três celulares em diagonal', '3d',
     ['mockup', 'celular', 'sem mão', 'três aparelhos', 'tela branca'],
     'Três celulares pretos inclinados em fila diagonal (um em cima à esquerda, um no meio na frente, um embaixo à direita), com as telas brancas. Bom pra mostrar três telas do app.'),
    ('sem-mao-3ap-b', 'mockup-tres-celulares-espalhados', 'Três celulares espalhados', '3d',
     ['mockup', 'celular', 'sem mão', 'três aparelhos', 'tela branca'],
     'Três celulares com as telas brancas: dois menores empilhados à esquerda e um grande à direita. Composição grande, ocupa a página toda.'),
]

# (arquivo no clone, nome, título, tags, descrição, largura e altura do render)
TEXTURAS_SVG = [
    ('grain-escuro-02.svg', 'textura-meio-tom-onda', 'Textura de meio-tom em onda', ['textura', 'meio-tom', 'pontos', 'onda'],
     'Pontos de meio-tom em tinta formando ondas suaves, com fundo transparente. Textura pra ir por cima do fundo claro, com opacidade baixa (10 a 25%), e pode passar da borda.',
     2400, 1500),
    ('grain-escuro-01.svg', 'textura-meio-tom-degrade', 'Textura de meio-tom em degradê', ['textura', 'meio-tom', 'pontos', 'degradê'],
     'Pontos de meio-tom em tinta que crescem nas pontas e somem no meio, com fundo transparente. Textura de fundo claro, com opacidade baixa (10 a 25%); pode passar da borda.',
     2400, 1200),
    ('textura-amassada-escura.svg', 'textura-meio-tom-ondas-largas', 'Textura de meio-tom em ondas largas', ['textura', 'meio-tom', 'pontos', 'ondas'],
     'Pontos de meio-tom em tinta desenhando ondas largas, como um tecido, com fundo transparente. Textura de fundo claro, com opacidade baixa (10 a 25%); pode passar da borda.',
     2250, 1500),
]
PAPEL = ('paper-amassado-claro.png', 'textura-papel-amassado', 'Textura de papel amassado', ['textura', 'papel', 'amassado', 'vinco'],
         'Vincos e sombras de papel amassado, em tinta com fundo transparente. Vai por cima do fundo papel pra dar a metáfora do papel, com opacidade de 20 a 50%; cobre a página e pode passar da borda.')

MEIO_TOM = [
    ('01', 'meio-tom-circulo', 'Mancha de meio-tom redonda', ['círculo', 'redonda'], 'Mancha redonda de pontos de meio-tom em coral, os pontos maiores no meio.'),
    ('02', 'meio-tom-elipse', 'Mancha de meio-tom achatada', ['elipse', 'sombra', 'chão'], 'Mancha achatada de pontos de meio-tom em coral, como uma sombra no chão: vai embaixo de um objeto ou do Léo.'),
    ('03', 'meio-tom-onda', 'Mancha de meio-tom em onda', ['onda', 'curva', 'movimento'], 'Pontos de meio-tom em coral numa onda que sobe pra direita: dá movimento a um canto da página.'),
    ('06', 'meio-tom-quadrado', 'Mancha de meio-tom quadrada', ['quadrado', 'cantos redondos'], 'Mancha quadrada de cantos redondos, de pontos de meio-tom em coral bem cheios.'),
    ('09', 'meio-tom-degrade', 'Mancha de meio-tom em degradê', ['degradê', 'suave', 'redonda'], 'Mancha redonda de meio-tom em coral que some nas bordas: brilho de pontos, bem suave.'),
]
USO_MEIO_TOM = ' Partícula de fundo: atrás dos objetos e do texto, com opacidade de 30 a 80%, pode passar da borda. Uma por página, no máximo.'


def aparar(im, folga=FOLGA):
    a = np.asarray(im.getchannel('A'))
    ys, xs = np.nonzero(a > 2)
    if not len(ys):
        return im, (0, 0)
    x0, y0 = max(0, xs.min() - folga), max(0, ys.min() - folga)
    x1, y1 = min(im.width, xs.max() + 1 + folga), min(im.height, ys.max() + 1 + folga)
    return im.crop((x0, y0, x1, y1)), (int(x0), int(y0))


def reduzir(im):
    lado = max(im.size)
    if lado <= LADO_MAX:
        return im, 1.0
    e = LADO_MAX / lado
    novo = (max(1, round(im.width * e)), max(1, round(im.height * e)))
    return im.convert('RGBa').resize(novo, Image.LANCZOS).convert('RGBA'), novo[0] / im.width


def render_svg(svg, w, h, fundo='#ffffff'):
    """O SVG desenhado pelo Edge headless como <img> (sem script) num fundo chapado. Devolve a imagem RGB."""
    pasta = Path(tempfile.mkdtemp(prefix='estudio-svg-'))
    html = pasta / 'p.html'
    html.write_text(f'<!doctype html><html><body style="margin:0;background:{fundo}"><img src="{Path(svg).resolve().as_uri()}" '
                    f'style="width:{w}px;height:{h}px;display:block"></body></html>', encoding='utf-8')
    saida = pasta / 'render.png'
    subprocess.run([str(EDGE), '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
                    f'--user-data-dir={pasta / "perfil"}', f'--window-size={w},{h}', '--virtual-time-budget=8000',
                    f'--screenshot={saida}', html.as_uri()], capture_output=True, timeout=240)
    if not saida.exists():
        raise SystemExit(f'o Edge não desenhou {Path(svg).name}')
    return Image.open(saida).convert('RGB')


def tinta_com_alfa(alfa, maximo=1.0):
    """Camada na cor da tinta, com a força no alfa (0 a 1)."""
    a = np.clip(alfa * maximo, 0, 1)
    h, w = a.shape
    rgb = np.empty((h, w, 3), np.uint8)
    rgb[...] = TINTA
    return Image.fromarray(np.dstack([rgb, np.round(a * 255).astype(np.uint8)]), 'RGBA')


def luminancia(im):
    return np.asarray(im.convert('L'), np.float32) / 255


def item(nome, titulo, categoria, tags, descricao, licenca, arquivo, largura, altura, tipo, fonte):
    return {
        'id': f'ast_base_{nome}', 'nome': titulo, 'categoria': categoria, 'tags': tags, 'descricao': descricao,
        'origem': 'base', 'largura': int(largura), 'altura': int(altura), 'tipo': tipo,
        'tamanho': (ASSETS / arquivo).stat().st_size, 'licenca': licenca,
        # 22/10 (achado da revisão): Freepik com o plano do download não confirmado nasce escondido (a IA não escolhe e a
        # grade não mostra) até o Pedro confirmar o plano; o time mostra de novo pelo editor
        'oculto': licenca in (LIC_MOCKUP, LIC_MEIO_TOM),
        'criadoEm': CRIADO_EM, 'criadoPor': 'Legalizaí', 'arquivo': arquivo, 'fonte': fonte, 'lote': LOTE,
    }


def svg_limpo(texto, escala=4):
    """SVG sem cabeçalho, sem id, com width e height (o canvas da exportação precisa) e no coral da marca."""
    if re.search(r'<script|foreignObject|href\s*=|<image', texto, re.I):
        raise SystemExit('SVG com script, link ou imagem embutida não entra')
    vb = re.search(r'viewBox="([\d.\s-]+)"', texto)
    _, _, vw, vh = [float(x) for x in vb.group(1).split()]
    s = re.sub(r'<\?xml[^>]*>\s*', '', texto)
    s = re.sub(r'\s(id|data-name)="[^"]*"', '', s)
    s = AMBAR_OUTRA_MARCA.sub(CORAL, s)
    w, h = round(vw * escala), round(vh * escala)
    s = s.replace('<svg ', f'<svg width="{w}" height="{h}" ', 1)
    return s.strip() + '\n', w, h


def main():
    if len(sys.argv) < 2:
        raise SystemExit('uso: importar-atelie.py <pasta do clone do Ateliê original>')
    clone = Path(sys.argv[1]).resolve()
    ref = clone / 'referencias'
    if not (ref / 'presente-sonoro' / 'mockup-bases').is_dir():
        raise SystemExit(f'{clone} não parece o clone do Ateliê (falta referencias/presente-sonoro/mockup-bases)')
    origem = lambda p: f'atelie-original@bdc7b76/{Path(p).resolve().relative_to(clone).as_posix()}'
    novos = []
    for arq, nome, titulo, categoria, tags, descricao in MOCKUPS:
        p = ref / 'presente-sonoro' / 'mockup-bases' / f'{arq}.png'
        im = Image.open(p).convert('RGBA')
        im, (x0, y0) = aparar(im)
        im, escala = reduzir(im)
        im.save(ASSETS / f'{nome}.png', optimize=True)
        novos.append(item(nome, titulo, categoria, tags, descricao + USO_MOCKUP, LIC_MOCKUP, f'{nome}.png', im.width, im.height,
                          'image/png', {'arquivo': origem(p), 'x': x0, 'y': y0, 'escala': round(escala, 6)}))
        print('ok', nome, im.size)
    for arq, nome, titulo, tags, descricao, w, h in TEXTURAS_SVG:
        p = ref / '_universal' / 'texturas' / arq
        # pontos pretos sobre transparente: no fundo branco, a escuridão é a força do ponto
        alfa = 1 - luminancia(render_svg(p, w, h))
        im = tinta_com_alfa(alfa)
        im.save(ASSETS / f'{nome}.png', optimize=True)
        novos.append(item(nome, titulo, 'fundo', tags, descricao, LIC_TEXTURA, f'{nome}.png', im.width, im.height, 'image/png',
                          {'arquivo': origem(p), 'x': 0, 'y': 0, 'escala': round(w / 1000, 6)}))
        print('ok', nome, im.size)
    arq, nome, titulo, tags, descricao = PAPEL
    p = ref / '_universal' / 'texturas' / arq
    lum = luminancia(Image.open(p))
    claro, escuro = np.percentile(lum, 98), np.percentile(lum, 1)
    # o vinco é o quanto o papel escurece em relação ao branco dele; o alfa fica até 70% (a camada pede pouca força)
    alfa = np.clip((claro - lum) / max(1e-3, claro - escuro), 0, 1) ** 0.9
    im = tinta_com_alfa(alfa, 0.7)
    im, escala = reduzir(im)
    im.save(ASSETS / f'{nome}.png', optimize=True)
    novos.append(item(nome, titulo, 'fundo', tags, descricao, LIC_TEXTURA, f'{nome}.png', im.width, im.height, 'image/png',
                      {'arquivo': origem(p), 'x': 0, 'y': 0, 'escala': round(escala, 6)}))
    print('ok', nome, im.size)
    for n, nome, titulo, tags, descricao in MEIO_TOM:
        p = ref / '_universal' / 'assets' / 'halftone-blobs' / f'{n}.svg'
        s, w, h = svg_limpo(p.read_text(encoding='utf-8'))
        (ASSETS / f'{nome}.svg').write_text(s, encoding='utf-8')
        novos.append(item(nome, titulo, 'fundo', ['meio-tom', 'pontos', 'coral', 'partícula', *tags], descricao + USO_MEIO_TOM,
                          LIC_MEIO_TOM, f'{nome}.svg', w, h, 'image/svg+xml', {'arquivo': origem(p), 'x': 0, 'y': 0, 'escala': 4}))
        print('ok', nome, (w, h))

    cat_arq = BASE / 'catalogo.json'
    cat = json.loads(cat_arq.read_text(encoding='utf-8'))
    ids_novos = {a['id'] for a in novos}
    ficam = [a for a in cat['assets'] if a.get('lote') != LOTE and a['id'] not in ids_novos]
    # o que saiu do lote nesta rodada também sai da pasta
    for a in cat['assets']:
        if a.get('lote') == LOTE and a['id'] not in ids_novos:
            (ASSETS / a['arquivo']).unlink(missing_ok=True)
    cat['assets'] = ficam + novos
    cat['totalBytes'] = sum(a['tamanho'] for a in cat['assets'])
    texto = json.dumps(cat, ensure_ascii=False, indent=2) + '\n'
    if '\u2014' in texto or '\u2013' in texto:
        raise SystemExit('travessão no catálogo')
    cat_arq.write_text(texto, encoding='utf-8')
    lote_mb = sum(a['tamanho'] for a in novos) / 1024 / 1024
    print(len(novos), 'assets do Ateliê,', round(lote_mb, 1), 'MB; banco com', len(cat['assets']), 'assets,',
          round(cat['totalBytes'] / 1024 / 1024, 1), 'MB')


if __name__ == '__main__':
    sys.exit(main())
