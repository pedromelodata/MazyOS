"""Sintetizados do kit de motion do Legalizaí (pacote K05).

Contrato: KIT/DESENHO.md, seções 1 (decisão 5), 4.3, 4.6 e 6.

O que tem aqui:
- o sfx.py original da precificação (PR/src/sfx.py), importado por sys.path, sem cópia e sem alteração;
  SR, Track, db, band, fade_in, pk e as funções s_* dele são reexportados por este módulo;
- os sintetizados que só existiam no GP/mix_guia.py (s_papel, s_vibra, s_brilho, s_processa e s_conta), com o
  código exato de lá; a única mudança é que o ruído é lido como sfx.rng na hora da chamada (no modo de ruído
  legado é o mesmo objeto do sfx.py; no modo por-evento, com_semente troca o gerador durante o som);
- s_assinatura(tom, d): a assinatura sonora proposta (pop curto, duas notas em quinta no tom e um brilho bem baixo);
- gera(som_id, args, catalogo): chama o sintetizado de um id do catálogo de efeitos e devolve o sinal, ou a lista
  de (t, sinal, ganho) nos compostos (s_processa e s_conta);
- com_semente(n): troca o gerador de ruído do sfx.py por np.random.default_rng(n) dentro de um bloco with.

Sempre com python -B (ou PYTHONDONTWRITEBYTECODE=1): importar o sfx.py original sem isso gravaria em
PR/src/__pycache__, que já existe e não é do kit. Este módulo liga sys.dont_write_bytecode antes de importar.
"""
import sys

sys.dont_write_bytecode = True

import contextlib  # noqa: E402
import os  # noqa: E402

import numpy as np  # noqa: E402

PR_SRC = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/src"
SFX_ORIGINAL = os.path.join(PR_SRC, "sfx.py")


def _mesmo_arquivo(a, b):
    return os.path.normcase(os.path.abspath(a)) == os.path.normcase(os.path.abspath(b))


# importa o sfx.py original por sys.path e tira a pasta do caminho logo depois, pra nenhum outro módulo do PR/src
# (render, timeline, voz, mix...) ficar na frente de um módulo do kit
_pos = None
if PR_SRC not in sys.path:
    sys.path.insert(0, PR_SRC)
    _pos = PR_SRC
try:
    import sfx  # noqa: E402
finally:
    if _pos is not None and _pos in sys.path:
        sys.path.remove(_pos)
if not _mesmo_arquivo(sfx.__file__, SFX_ORIGINAL):
    raise ImportError("o módulo sfx carregado não é o original do PR/src: %s" % sfx.__file__)

from sfx import (  # noqa: E402,F401
    SR, Track, band, db, fade_in, pk,
    s_bubble, s_burst, s_check, s_chime, s_clack, s_pop, s_riser, s_ring, s_roll, s_swish, s_thump, s_tick,
    s_whoosh,
)

# semente do gerador global do sfx.py (linha "rng = np.random.default_rng(11)"); é a do modo de ruído legado
SEMENTE_LEGADO = 11

# funções do sfx.py original e as deste módulo, por nome (o gera() resolve o id do catálogo por elas)
FUNCOES_SFX = ("s_pop", "s_bubble", "s_tick", "s_chime", "s_check", "s_whoosh", "s_riser", "s_thump", "s_roll",
               "s_burst", "s_ring", "s_clack", "s_swish")
FUNCOES_KIT = ("s_papel", "s_vibra", "s_brilho", "s_processa", "s_conta", "s_assinatura")


class ErroSintese(Exception):
    """Id ou argumento de sintetizado que não dá pra gerar."""


def __getattr__(nome):
    # sfx_kit.rng devolve sempre o gerador atual do sfx.py (o com_semente troca ele durante um som)
    if nome == "rng":
        return sfx.rng
    raise AttributeError("o módulo sfx_kit não tem %r" % nome)


# ---------------------------------------------------------------------------------------------------------------
# Sintetizados do GP/mix_guia.py (código exato de lá; o ruído vem de sfx.rng na hora da chamada)
# ---------------------------------------------------------------------------------------------------------------

def s_papel(d=0.24):
    n = int(d * SR)
    x = band(sfx.rng.standard_normal(n).astype(np.float32), 1800, 9000)
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


# ---------------------------------------------------------------------------------------------------------------
# Assinatura sonora (proposta: o Pedro ouve antes de virar padrão; o fecho aprovado do guia continua sol6 + dó7)
# ---------------------------------------------------------------------------------------------------------------

# tom: (nome da nota de baixo, nota MIDI, nome da nota de cima, nota MIDI); as quatro são quintas justas
TONS_ASSINATURA = {
    "do": ("dó6", 84, "sol6", 91),
    "mi": ("mi6", 88, "si6", 95),
    "la": ("lá5", 81, "mi6", 88),
    "re": ("ré6", 86, "lá6", 93),
}
_SEM_ACENTO = {"dó": "do", "ré": "re", "lá": "la"}

# receita da assinatura (segundos e ganhos relativos, antes da normalização)
ASSINATURA_POP = (0.0, 0.7)            # s_pop(900, 420, 0.1, 34) no começo
ASSINATURA_NOTA1 = (0.07, 1.0, 0.9)    # s_chime da nota de baixo: início, ganho, duração
ASSINATURA_NOTA2 = (0.19, 0.75, 0.9)   # s_chime da nota de cima, 0,12 s depois e um pouco mais baixa
ASSINATURA_BRILHO = (0.55, 0.1, 0.03)  # s_brilho de 0,55 s, ganho 0,1 (cerca de -20 dB), terminando 0,03 s antes do fim
ASSINATURA_FADE = 0.04                 # fade de saída


def freq_midi(nota):
    """Frequência em Hz da nota MIDI (lá 440)."""
    return 440.0 * 2 ** ((nota - 69) / 12)


def tom_assinatura(tom):
    """Normaliza o nome do tom ('do', 'dó', 'DO' viram 'do'); erro se não for dó, mi, lá ou ré."""
    t = str(tom).strip().lower()
    t = _SEM_ACENTO.get(t, t)
    if t not in TONS_ASSINATURA:
        raise ErroSintese("tom da assinatura desconhecido: %r (use do, mi, la ou re)" % (tom,))
    return t


def s_assinatura(tom="do", d=1.2):
    """Assinatura sonora: pop curto, duas notas s_chime em quinta no tom e um brilho bem baixo no fim, normalizada.

    tom: 'do' (dó6 + sol6), 'mi' (mi6 + si6), 'la' (lá5 + mi6) ou 're' (ré6 + lá6). d: duração total, de 1,0 a 1,5 s.
    Não usa ruído (o resultado é sempre o mesmo). Devolve float32 com pico 1,0 (o place() normaliza de novo).
    """
    _, m1, _, m2 = TONS_ASSINATURA[tom_assinatura(tom)]
    d = float(d)
    if not 1.0 <= d <= 1.5:
        raise ErroSintese("duração da assinatura fora de 1,0 a 1,5 s: %r" % (d,))
    n = int(round(d * SR))
    y = np.zeros(n, np.float32)

    def soma(sig, t, ganho):
        i = int(round(t * SR))
        j = min(n, i + len(sig))
        if j > i:
            y[i:j] += (sig[: j - i] * ganho).astype(np.float32)

    soma(s_pop(900, 420, 0.1, 34), ASSINATURA_POP[0], ASSINATURA_POP[1])
    soma(s_chime(freq_midi(m1), ASSINATURA_NOTA1[2]), ASSINATURA_NOTA1[0], ASSINATURA_NOTA1[1])
    soma(s_chime(freq_midi(m2), ASSINATURA_NOTA2[2]), ASSINATURA_NOTA2[0], ASSINATURA_NOTA2[1])
    db_, ganho_b, folga = ASSINATURA_BRILHO
    soma(s_brilho(db_), d - db_ - folga, ganho_b)
    k = int(ASSINATURA_FADE * SR)
    y[-k:] *= np.linspace(1, 0, k).astype(np.float32)
    return pk(y)


# ---------------------------------------------------------------------------------------------------------------
# Gerador de ruído
# ---------------------------------------------------------------------------------------------------------------

@contextlib.contextmanager
def com_semente(n):
    """Troca sfx.rng por np.random.default_rng(n) dentro do bloco e devolve o original no fim (modo por-evento)."""
    original = sfx.rng
    sfx.rng = np.random.default_rng(int(n))
    try:
        yield sfx.rng
    finally:
        sfx.rng = original


def ruido_novo():
    """Verdadeiro se o gerador global do sfx.py está no estado de um processo novo (semente 11, nada consumido)."""
    return sfx.rng.bit_generator.state == np.random.default_rng(SEMENTE_LEGADO).bit_generator.state


def reinicia_legado():
    """Volta o gerador global do sfx.py ao estado inicial da semente 11, no mesmo objeto (não troca o gerador)."""
    sfx.rng.bit_generator.state = np.random.default_rng(SEMENTE_LEGADO).bit_generator.state


def semente_de(origem):
    """Semente por evento: crc32 da origem em UTF-8 (seção 4.6; o mesmo crc32 do nucleo/sons.ts do K02)."""
    import zlib
    return zlib.crc32(str(origem).encode("utf-8")) & 0xFFFFFFFF


# ---------------------------------------------------------------------------------------------------------------
# Catálogo
# ---------------------------------------------------------------------------------------------------------------

def _indice_efeitos(catalogo):
    if catalogo is None:
        kit = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        pasta = os.path.join(kit, "catalogos")
        if not os.path.isfile(os.path.join(pasta, "catalogo.py")):
            pasta = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion/catalogos"
        if pasta not in sys.path:
            sys.path.insert(0, pasta)
        import catalogo as _cat
        return _cat.indice("efeitos")
    if isinstance(catalogo, dict) and isinstance(catalogo.get("itens"), list):
        return {it["id"]: it for it in catalogo["itens"]}
    if isinstance(catalogo, list):
        return {it["id"]: it for it in catalogo}
    return catalogo


def funcao_do_item(item):
    """A função Python do sintetizado (pelo campo sintese.modulo e sintese.funcao do catálogo)."""
    s = item.get("sintese") or {}
    mod, nome = s.get("modulo"), s.get("funcao")
    if not mod or not nome:
        raise ErroSintese("%s: sintese.modulo e sintese.funcao faltando no catálogo" % item.get("id"))
    if _mesmo_arquivo(mod, SFX_ORIGINAL):
        fonte, nomes = sfx, FUNCOES_SFX
    elif _mesmo_arquivo(mod, __file__) or os.path.basename(mod).lower() == "sfx_kit.py":
        fonte, nomes = sys.modules[__name__], FUNCOES_KIT
    else:
        raise ErroSintese("%s: módulo de sintetizado desconhecido: %s (o mix só conhece o sfx.py e o sfx_kit.py)"
                          % (item.get("id"), mod))
    if nome not in nomes or not callable(getattr(fonte, nome, None)):
        raise ErroSintese("%s: a função %s não existe em %s" % (item.get("id"), nome, mod))
    return getattr(fonte, nome)


def gera(som_id, args=None, catalogo=None):
    """Gera o sintetizado do id do catálogo de efeitos com os args (na ordem da função Python).

    catalogo: o índice {id: item} dos efeitos, o resultado de catalogo.carrega('efeitos') ou None (carrega sozinho).
    Devolve o sinal (np.ndarray) ou, nos compostos, a lista de (t, sinal, ganho) na ordem da função. O ruído vem de
    sfx.rng: chame dentro de com_semente(n) pra ter semente por evento.
    """
    idx = _indice_efeitos(catalogo)
    item = idx.get(som_id)
    if item is None:
        raise ErroSintese("efeito não está no catálogo: %s" % som_id)
    if item.get("tipo") != "sintetizado":
        raise ErroSintese("%s não é sintetizado (tipo %s); arquivo é decodificado pelo mixa.py"
                          % (som_id, item.get("tipo")))
    fn = funcao_do_item(item)
    a = list(args) if args else []
    nomes = (item.get("sintese") or {}).get("args")
    if isinstance(nomes, list) and len(a) > len(nomes):
        raise ErroSintese("%s: %d argumentos, mas a função %s recebe %d (%s)"
                          % (som_id, len(a), fn.__name__, len(nomes), ", ".join(nomes)))
    try:
        out = fn(*a)
    except TypeError as e:
        raise ErroSintese("%s: argumentos %r não servem pra %s (%s)" % (som_id, a, fn.__name__, e))
    if (item.get("sintese") or {}).get("composto"):
        return [(t, sig, g) for t, sig, g in out]
    return out
