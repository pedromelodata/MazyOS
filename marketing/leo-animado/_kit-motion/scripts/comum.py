"""Comum dos scripts de saída do kit de motion do Legalizaí (pacote K07). Contrato: KIT/DESENHO.md, seção 7.

Constantes (siglas do DESENHO), a peça (pasta, cena e sufixo das saídas), a execução de comandos (com o modo
--simula), as medidas do ffmpeg (loudness, md5 do fluxo de vídeo, quadro decodificado, áudio em memória) e a
leitura de JSON. Quem grava é sempre o KIT/lib/escrita.py (K01). Sempre com python -B.
"""
import sys

sys.dont_write_bytecode = True

import json  # noqa: E402
import os  # noqa: E402
import re  # noqa: E402
import shlex  # noqa: E402
import subprocess  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__)).replace("\\", "/")
KIT = os.path.dirname(AQUI)
if not os.path.isfile(os.path.join(KIT, "lib", "escrita.py")):
    KIT = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion"
if os.path.join(KIT, "lib") not in sys.path:
    sys.path.insert(0, os.path.join(KIT, "lib"))
import escrita  # noqa: E402

LEO = os.path.dirname(KIT)
PR = LEO + "/precificacao-2026-10-02"
RM = PR + "/remotion"
GP = LEO + "/guia-pronta-2026-10-14"
PUBLIC_KIT = RM + "/public-kit"
BIN = RM + "/bin"
SORA = PUBLIC_KIT + "/Sora-wght.ttf"
CLI = RM + "/src/kit/cli"
STILLS_MJS = RM + "/src/kit/render/stills.mjs"
PECAS = KIT + "/pecas"
FINAL = escrita.FINAL
VIDEOS = escrita.VIDEOS
BASE = escrita.BASE
PY = escrita.PY
PYW = "C:/Projects/Legalizei_Videos/marketing/filme/escalada/tools/.venv/Scripts/python.exe"
CHROME = escrita.CHROME
MODELO_WHISPER = escrita.MODELO_WHISPER
NODE = "node"
NPX = "npx.cmd" if os.name == "nt" else "npx"

# limites de disco (seção 7.1 e 7.4)
DISCO_AVISO_MB = 500
DISCO_RENDER_MB = 400
DISCO_STILLS_MB = 250
LIMITE_VIGIA_MB = 250

# travessão, meia-risca e os outros traços longos (o sinal de menos lê como meia-risca): proibidos em qualquer texto
TRAVESSOES = ("\u2014", "\u2013", "\u2012", "\u2015", "\u2212", "\u2e3a", "\u2e3b", "\ufe31", "\ufe32", "\ufe58")


class ErroSaida(RuntimeError):
    """Erro de uso ou de etapa, com o código de saída."""

    def __init__(self, msg, codigo=1):
        super().__init__(msg)
        self.codigo = codigo


_ARGPARSE_PT = {
    "usage: ": "uso: ",
    "positional arguments": "argumentos",
    "options": "opções",
    "optional arguments": "opções",
    "show this help message and exit": "mostra esta ajuda e sai",
    "the following arguments are required: %s": "faltam os argumentos: %s",
    "unrecognized arguments: %s": "argumentos desconhecidos: %s",
    "%(prog)s: error: %(message)s\n": "%(prog)s: erro: %(message)s\n",
    "invalid choice: %(value)r (choose from %(choices)s)": "escolha inválida: %(value)r (escolha entre %(choices)s)",
    "expected one argument": "esperava um valor",
    "argument %(argument_name)s: %(message)s": "argumento %(argument_name)s: %(message)s",
    "invalid %(type)s value: %(value)r": "valor %(type)s inválido: %(value)r",
    "expected at least one argument": "esperava pelo menos um valor",
}


def utf8():
    """stdout e stderr em UTF-8, e as mensagens padrão do argparse em português."""
    for f in (sys.stdout, sys.stderr):
        try:
            f.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass
    import argparse
    if not getattr(argparse, "_kit_pt", False):
        original = argparse._
        argparse._ = lambda s: _ARGPARSE_PT.get(s, original(s))
        argparse._kit_pt = True


def barra(p):
    return os.fspath(p).replace("\\", "/")


def le_json(caminho):
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


def env_python():
    e = dict(os.environ)
    e["PYTHONDONTWRITEBYTECODE"] = "1"
    e["PYTHONIOENCODING"] = "utf-8"
    return e


# ---------- peça ----------

def pasta_peca(arg):
    """Pasta da peça: caminho absoluto ou nome dentro de KIT/pecas."""
    if not arg:
        raise ErroSaida("falta a peça (nome em KIT/pecas ou caminho absoluto)", 2)
    p = os.path.abspath(arg) if os.path.isabs(arg) else os.path.join(PECAS, arg)
    return barra(p)


def sufixo_cena(caminho_cena):
    """cenas.json dá ""; cenas-kit.json dá "-kit"; outra.json dá "-outra" (igual ao _runtime.mjs)."""
    nome = os.path.basename(caminho_cena)
    if nome == "cenas.json":
        return ""
    m = re.match(r"(?i)^cenas-(.+)\.json$", nome)
    if m:
        return "-" + m.group(1)
    return "-" + re.sub(r"(?i)\.json$", "", nome)


def confere_nome_peca(doc, nome_pasta, oque, caminho):
    """O campo "peca" da cena ou das props tem de ser o nome da pasta: as travas (trilha aceita com risco, modelos
    aceitos com risco e a exceção da peça de teste) valem pela PASTA. Cena copiada de outra peça, ou pasta de teste
    renomeada, é recusada com o conserto (rodada 4, 03/10)."""
    campo = doc.get("peca") if isinstance(doc, dict) else None
    if campo == nome_pasta:
        return
    if oque == "cena":
        conserto = ("se a cena veio de outra peça, troque \"peca\" por \"%s\" (a decisão de risco da outra peça não vem "
                    "junto); se você renomeou a pasta, faça o mesmo e rode kit.py props de novo" % nome_pasta)
    else:
        conserto = "rode kit.py props %s de novo (as props são de outra pasta ou de antes de renomear)" % nome_pasta
    raise ErroSaida("%s %s diz \"peca\": %s, mas a pasta é %s: as travas valem pela pasta, nunca pelo campo da %s; %s"
                    % ("a cena" if oque == "cena" else "as props", caminho, json.dumps(campo, ensure_ascii=False),
                       nome_pasta, oque, conserto), 2)


class Peca:
    """A peça: pasta, cena (--cena) e o sufixo das saídas. O nome da peça é o nome da PASTA (as travas valem por ele);
    le_cena e le_props recusam "peca" diferente da pasta."""

    def __init__(self, arg, cena=None, exige=True):
        self.arg = arg
        self.pasta = pasta_peca(arg)
        self.nome = os.path.basename(self.pasta.rstrip("/"))
        if exige and not os.path.isdir(self.pasta):
            raise ErroSaida("a pasta da peça não existe: %s" % self.pasta, 2)
        if cena:
            self.cena = barra(cena if os.path.isabs(cena) else os.path.join(self.pasta, cena))
        else:
            self.cena = barra(os.path.join(self.pasta, "cenas.json"))
        self.sufixo = sufixo_cena(self.cena)
        self.nome_cena = os.path.basename(self.cena)

    def caminho(self, *partes):
        return barra(os.path.join(self.pasta, *partes))

    def saida(self, base, ext, sub=""):
        """<pasta>/<sub>/<base><sufixo><ext>"""
        return barra(os.path.join(self.pasta, sub, "%s%s%s" % (base, self.sufixo, ext)))

    @property
    def props(self):
        return self.saida("props", ".json")

    @property
    def eventos(self):
        return self.saida("eventos", ".json")

    @property
    def quadros(self):
        return self.saida("quadros", ".json", "qc")

    @property
    def legenda(self):
        return self.saida("legenda", ".json", "qc")

    @property
    def fatos(self):
        return self.saida("fatos", ".json", "qc")

    @property
    def mix(self):
        return self.saida("mix", ".wav", "audio")

    def mudo(self):
        return barra(os.path.join(self.pasta, "saida", "%s%s-mudo.mp4" % (self.nome, self.sufixo)))

    def final(self):
        return barra(os.path.join(self.pasta, "saida", "%s%s.mp4" % (self.nome, self.sufixo)))

    @property
    def teste(self):
        """Peça de teste: o nome da PASTA começa com '_' (nunca o campo "peca" da cena)."""
        return self.nome.startswith("_")

    def le_cena(self, confere_nome=True):
        if not os.path.isfile(self.cena):
            raise ErroSaida("a cena não existe: %s" % self.cena, 2)
        cena = le_json(self.cena)
        if confere_nome:
            confere_nome_peca(cena, self.nome, "cena", self.cena)
        return cena

    def le_props(self, confere_nome=True):
        if not os.path.isfile(self.props):
            raise ErroSaida("as props não existem: %s (rode kit.py props %s%s)"
                            % (self.props, self.arg, (" --cena " + self.nome_cena) if self.sufixo else ""))
        props = le_json(self.props)
        if confere_nome:
            confere_nome_peca(props, self.nome, "props", self.props)
        return props

    def args_cena(self):
        """['--cena', <arquivo>] quando a cena não é a padrão."""
        return [] if self.nome_cena == "cenas.json" and os.path.dirname(self.cena) == self.pasta else ["--cena", self.cena]


# ---------- comandos ----------

def mostra(cmd, cwd=None):
    """Texto de um comando pra mostrar (com aspas onde precisa)."""
    if isinstance(cmd, str):
        txt = cmd
    else:
        partes = []
        for a in cmd:
            a = str(a)
            if a == "" or re.search(r"[\s\"'&|<>^()]", a):
                partes.append('"%s"' % a.replace('"', '\\"'))
            else:
                partes.append(a)
        txt = " ".join(partes)
    return ("(cwd %s) " % cwd if cwd else "") + txt


def roda(cmd, cwd=None, simula=False, captura=False, env=None, timeout=None, texto=None, rotulo=None):
    """Roda um comando (lista, sem shell). Com simula, só mostra. Devolve o código (ou o CompletedProcess com captura)."""
    linha = texto or mostra(cmd, cwd)
    if rotulo:
        print("[%s] %s" % (rotulo, linha), flush=True)
    else:
        print("$ " + linha, flush=True)
    if simula:
        return 0 if not captura else subprocess.CompletedProcess(cmd, 0, "", "")
    r = subprocess.run([str(c) for c in cmd], cwd=cwd, env=env or env_python(), timeout=timeout,
                       capture_output=captura, text=captura, encoding="utf-8" if captura else None,
                       errors="replace" if captura else None)
    return r if captura else r.returncode


def divide(texto):
    """Lista de argumentos a partir de um texto (aspas como no shell)."""
    return shlex.split(texto, posix=True)


# ---------- ffmpeg ----------

def sonda(arquivo):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", arquivo],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        raise ErroSaida("ffprobe falhou em %s: %s" % (arquivo, r.stderr.strip()))
    return json.loads(r.stdout)


def md5_fluxo_video(arquivo):
    """md5 do fluxo de vídeo (ffmpeg -map 0:v -c copy -f md5 -), o mesmo método do REF."""
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", arquivo, "-map", "0:v", "-c", "copy", "-f", "md5", "-"],
                       capture_output=True, text=True)
    if r.returncode != 0:
        raise ErroSaida("md5 do fluxo de vídeo falhou em %s: %s" % (arquivo, r.stderr.strip()))
    m = re.search(r"MD5=([0-9a-f]{32})", r.stdout)
    return m.group(1) if m else None


_RE_I = re.compile(r"I:\s*(-?[\d.]+|-inf)\s*LUFS")
_RE_LRA = re.compile(r"LRA:\s*(-?[\d.]+)\s*LU\b")
_RE_TP = re.compile(r"Peak:\s*(-?[\d.]+|-inf)\s*dBFS")


def loudness(arquivo, mapa="0:a:0"):
    """Loudness integrada, LRA e pico real pelo ebur128=peak=true (resumo do fim)."""
    r = subprocess.run(["ffmpeg", "-nostats", "-hide_banner", "-i", arquivo, "-map", mapa, "-af", "ebur128=peak=true",
                        "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        raise ErroSaida("ebur128 falhou em %s: %s" % (arquivo, r.stderr.strip()[-800:]))
    resumo = r.stderr[r.stderr.rfind("Summary:"):]
    pega = lambda rx: float(rx.search(resumo).group(1)) if rx.search(resumo) else None  # noqa: E731
    return {"I": pega(_RE_I), "LRA": pega(_RE_LRA), "TP": pega(_RE_TP)}


MATRIZES = {
    # a certa: o render sai em bt709 faixa tv (memória de 01/10; conferência da seção 7.7)
    "bt709-tv": "scale=in_color_matrix=bt709:in_range=tv:out_range=full,format=rgb24",
    # a errada, só pra prova de que a conferência pega o erro de cor
    "bt601-cheia": "scale=in_color_matrix=bt601:in_range=full:out_range=full,format=rgb24",
}


def quadro_rgb(video, n, matriz="bt709-tv", largura=None, altura=None):
    """Quadro n do vídeo em RGB (numpy HxWx3 uint8), decodificado em memória com a matriz pedida."""
    import numpy as np
    if largura is None or altura is None:
        v = [s for s in sonda(video)["streams"] if s.get("codec_type") == "video"][0]
        largura, altura = int(v["width"]), int(v["height"])
    vf = "select=eq(n\\,%d),%s" % (int(n), MATRIZES[matriz])
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", vf, "-frames:v", "1", "-f", "rawvideo", "-"],
                       capture_output=True)
    if r.returncode != 0 or len(r.stdout) < largura * altura * 3:
        raise ErroSaida("não decodifiquei o quadro %d de %s: %s" % (n, video, r.stderr.decode("utf-8", "replace")[-400:]))
    return np.frombuffer(r.stdout[:largura * altura * 3], np.uint8).reshape(altura, largura, 3)


def audio_mono(arquivo, sr=48000, mapa="0:a:0"):
    """Áudio em float32 mono, decodificado em memória."""
    import numpy as np
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", arquivo, "-map", mapa, "-ac", "1", "-ar", str(sr), "-f", "f32le",
                        "-"], capture_output=True)
    if r.returncode != 0:
        raise ErroSaida("não decodifiquei o áudio de %s: %s" % (arquivo, r.stderr.decode("utf-8", "replace")[-400:]))
    return np.frombuffer(r.stdout, np.float32).copy()


def compara_audio(a, b, busca=4800):
    """Atraso (amostras, por correlação cruzada pela FFT), correlação no atraso e diferença de nível RMS (dB)."""
    import numpy as np
    n = min(len(a), len(b))
    a = a[:n].astype(np.float64)
    b = b[:n].astype(np.float64)
    m = 1 << int(np.ceil(np.log2(2 * n)))
    xc = np.fft.irfft(np.fft.rfft(a, m) * np.conj(np.fft.rfft(b, m)), m)
    lags = np.concatenate([np.arange(0, busca + 1), np.arange(-busca, 0)])
    vals = np.concatenate([xc[:busca + 1], xc[m - busca:]])
    lag = int(lags[int(np.argmax(vals))])
    if lag >= 0:
        x, y = a[lag:], b[:n - lag]
    else:
        x, y = a[:n + lag], b[-lag:]
    corr = float(np.dot(x, y) / (np.sqrt(np.dot(x, x) * np.dot(y, y)) + 1e-30))
    rms = lambda v: float(np.sqrt(np.mean(v * v)) + 1e-30)  # noqa: E731
    nivel = 20 * np.log10(rms(a) / rms(b))
    return {"atrasoAmostras": lag, "correlacao": corr, "diferencaNivelDb": float(nivel)}


def temp():
    """%TEMP% com o nome longo (nunca o curto EDIT-A~1)."""
    import tempfile
    return barra(os.path.realpath(tempfile.gettempdir()))


def tem_travessao(texto):
    return any(t in (texto or "") for t in TRAVESSOES)
