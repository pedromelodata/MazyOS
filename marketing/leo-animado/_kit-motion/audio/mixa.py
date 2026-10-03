"""Mixador do kit de motion do Legalizaí, por eventos (pacote K05).

Contrato: KIT/DESENHO.md, seções 1 (decisão 5), 4.3, 4.4 (voz), 4.6, 4.12, 6 e 13.

Uso (sempre com python -B):
  python -B mixa.py <pasta da peça> [--props props.json] [--eventos eventos.json] [--saida audio/mix.wav]
                    [--stems] [--relatorio] [--forca]

Caminhos relativos são relativos à pasta da peça. Saída em 48 kHz, 16 bits, estéreo (o mono duplicado), com a
loudness pelo loudnorm em duas passadas, gravada por temporário e os.replace (KIT/lib/escrita.py). O intermediário em
f32 fica num temporário do Temp e é apagado no fim; nada vai pra pasta da peça além da saída e do relatório.

O mix, na ordem do GP/mix_guia.py (seção 6 do DESENHO):
  1. efeitos: os eventos na ordem do arquivo. Sintetizado: a função do catálogo (sfx.py ou sfx_kit.py) com os args;
     composto (sint-s_processa, sint-s_conta): cada tique na ordem da função, com o ganhoDb do evento somado ao ganho
     interno. Arquivo: decodificado com 'ffmpeg -v error -i <arquivo> [-af filtro] -ac 1 -ar 48000 -f f32le -'.
     inverte: sinal[::-1].copy(). ancora 'sincronia': o arquivo começa em t - sincronia_ms/1000. transpor n (só com
     n diferente de 0): método fita (asetrate = taxa original x 2^(n/12), depois aresample=48000) ou, com
     transporMetodo 'tom', o rubberband do ffmpeg. Cada som entra pelo Track.place do sfx.py (pico normalizado em
     0 dBFS e o ganho do evento).
     Ruído: no modo 'legado' o gerador global do sfx.py (semente 11) é consumido na ordem dos eventos, sem troca (a
     sequência do mix_guia.py); no 'por-evento' cada som é gerado dentro de com_semente(semente do evento).
  2. voz: com voz.fecho 'embutido', voz.arquivo; com 'asset', voz.final (gravado pelo voz-monta). Cadeia
     highpass 75, lowpass 14500, acompressor e pico normalizado em -1 dBFS.
  3. trilha: decodificada inteira, sem -ss, e fatiada a partir de mStart; ganho (ou 'auto'), abaixamento sob a voz
     (RMS de 10 ms, limiar 0,02, subida 0,25 e descida 0,033 por janela), fade de entrada e de saída.
  4. voz + trilha + efeitos, loudnorm em duas passadas (I -14, TP -1,5, LRA 9, linear) e a saída.

Tamanho (rodada 4, 03/10): o mix tem sempre quadros/fps segundos, quadros x 48000 / fps amostras (1600 por quadro a
30 fps), o tamanho exato do vídeo, e não round(duracao x 48000): o props.ts arredonda os quadros (duracao x 30) e,
com a fração de quadro arredondada pra cima, o mix ficava mais curto e o -shortest da junção cortava 2 a 4 quadros do
fim (o completa_mix.py da peça de 05/10). O conteúdo até a duração da cena é o mesmo de antes (a trilha some no fim da
duração; o que sobra até o último quadro é o silêncio que o completa_mix.py punha); no guia (540 quadros, 18 s) o mix
sai igual bit a bit.

Trilha (rodada 4): a regra vale pelo nome da PASTA da peça, nunca pelo campo "peca" das props (props copiadas de
outra peça não levam a decisão dela).
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import datetime  # noqa: E402
import hashlib  # noqa: E402
import io  # noqa: E402
import json  # noqa: E402
import math  # noqa: E402
import os  # noqa: E402
import subprocess  # noqa: E402
import tempfile  # noqa: E402
import wave  # noqa: E402
from contextlib import nullcontext  # noqa: E402

import numpy as np  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
KIT_PADRAO = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion"
KIT = os.path.dirname(AQUI) if os.path.isfile(os.path.join(os.path.dirname(AQUI), "catalogos", "catalogo.py")) \
    else KIT_PADRAO
for _p in (os.path.join(KIT, "catalogos"), os.path.join(KIT, "lib"), AQUI):
    if _p not in sys.path:
        sys.path.insert(0, _p)

import escrita  # noqa: E402
import catalogo  # noqa: E402
import sfx_kit  # noqa: E402
import trilha as trilha_kit  # noqa: E402
from sfx_kit import SR, Track, db  # noqa: E402

# cadeia da voz e loudnorm: as mesmas strings do GP/mix_guia.py
CADEIA_VOZ = "highpass=f=75,lowpass=f=14500,acompressor=threshold=0.08:ratio=2.2:attack=8:release=120:makeup=1.6"
LOUDNORM = "loudnorm=I=-14:TP=-1.5:LRA=9"
PADROES_TRILHA = {"abaixamento": 0.55, "fadeIn": 0.03, "fadeOut": 0.5}
MODOS_RUIDO = ("legado", "por-evento")
METODOS_TRANSPOR = ("fita", "tom")


class ErroMix(Exception):
    """Entrada que não dá pra mixar (mensagem em português)."""


def br(x, casas=2, sinal=False):
    """Número com vírgula decimal, pras mensagens em português."""
    return ((("%+." if sinal else "%.") + str(casas) + "f") % x).replace(".", ",")


# ---------------------------------------------------------------------------------------------------------------
# Entrada
# ---------------------------------------------------------------------------------------------------------------

def caminho_peca(pasta, p):
    """Caminho relativo à pasta da peça (absoluto passa direto)."""
    if p is None:
        return None
    return p if os.path.isabs(p) else os.path.normpath(os.path.join(pasta, p))


def le_json(caminho, oque):
    if not os.path.isfile(caminho):
        raise ErroMix("%s não existe: %s" % (oque, caminho))
    try:
        with open(caminho, encoding="utf-8") as f:
            return json.load(f)
    except ValueError as e:
        raise ErroMix("%s não é JSON válido (%s): %s" % (oque, e, caminho))


def carrega_catalogos():
    """(efeitos, trilhas) como índices {id: item}, pelo carregador do K01."""
    try:
        return catalogo.indice("efeitos"), catalogo.indice("trilhas")
    except catalogo.ErroCatalogo as e:
        raise ErroMix("catálogo com erro (rode catalogos/valida.py): %s" % e)


def _numero(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)


def confere_eventos(eventos):
    """Confere o formato dos eventos (seção 4.6); levanta ErroMix com o primeiro problema."""
    if not isinstance(eventos, list):
        raise ErroMix("eventos.json: 'eventos' precisa ser uma lista")
    for k, ev in enumerate(eventos):
        rot = "evento %d (%s)" % (k, ev.get("origem", "?") if isinstance(ev, dict) else "?")
        if not isinstance(ev, dict):
            raise ErroMix("%s: não é um objeto" % rot)
        if not _numero(ev.get("t")):
            raise ErroMix("%s: t precisa ser número" % rot)
        if not isinstance(ev.get("som"), str) or not ev["som"]:
            raise ErroMix("%s: falta o som" % rot)
        if not _numero(ev.get("ganhoDb")):
            raise ErroMix("%s: ganhoDb precisa ser número" % rot)
        if "args" in ev and not isinstance(ev["args"], list):
            raise ErroMix("%s: args precisa ser lista" % rot)
        if ev.get("ancora", "inicio") not in ("inicio", "sincronia"):
            raise ErroMix("%s: ancora inválida: %r" % (rot, ev.get("ancora")))
        tr = ev.get("transpor")
        if tr is not None and tr != "trilha" and not _numero(tr):
            raise ErroMix("%s: transpor inválido: %r" % (rot, tr))
        if ev.get("transporMetodo", "fita") not in METODOS_TRANSPOR:
            raise ErroMix("%s: transporMetodo inválido: %r (use fita ou tom)" % (rot, ev.get("transporMetodo")))
        if "semente" in ev and (isinstance(ev["semente"], bool) or not isinstance(ev["semente"], int)):
            raise ErroMix("%s: semente precisa ser inteiro" % rot)


# ---------------------------------------------------------------------------------------------------------------
# Decodificação (o carrega() do GP/mix_guia.py)
# ---------------------------------------------------------------------------------------------------------------

def comando_decode(caminho, af=None):
    """O comando do carrega() do mix_guia.py: sem filtro, nenhum -af."""
    cmd = ["ffmpeg", "-v", "error", "-i", caminho]
    if af:
        cmd += ["-af", af]
    cmd += ["-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    return cmd


def decodifica(caminho, af=None):
    """(sinal float32 mono 48 kHz, comando)."""
    if not caminho or not os.path.isfile(caminho):
        raise ErroMix("arquivo de áudio não existe: %s" % caminho)
    cmd = comando_decode(caminho, af)
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        raise ErroMix("o ffmpeg não decodificou %s: %s" % (caminho, r.stderr.decode("utf-8", "replace")[-400:]))
    return np.frombuffer(r.stdout, np.float32).copy(), cmd


def taxa_original(item):
    """Taxa de amostragem do arquivo (do catálogo, ou pelo ffprobe)."""
    sr = item.get("sr")
    if _numero(sr) and sr > 0:
        return int(sr)
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=sample_rate",
                        "-of", "default=noprint_wrappers=1:nokey=1", item["arquivo"]], capture_output=True, text=True)
    try:
        return int(r.stdout.strip().splitlines()[0])
    except (ValueError, IndexError):
        raise ErroMix("não deu pra ler a taxa de amostragem de %s" % item.get("arquivo"))


def resolve_transpor(ev, props, trilha_item):
    """Semitons do evento: número, 'trilha' (trilha.transporVerificado) ou ausente. 0 vira None (nenhum filtro)."""
    tr = ev.get("transpor")
    if tr is None:
        return None
    if tr == "trilha":
        t = (props.get("trilha") or {}) if isinstance(props, dict) else {}
        if _numero(t.get("transporVerificado")):
            n = t["transporVerificado"]
        elif trilha_item is not None:
            n = trilha_kit.transposicao(trilha_item)
        else:
            n = 0
    else:
        n = tr
    return None if n == 0 else n


def metodo_transpor(ev, props):
    m = ev.get("transporMetodo") or ((props.get("sons") or {}).get("transporMetodo") if isinstance(props, dict)
                                     else None) or "fita"
    if m not in METODOS_TRANSPOR:
        raise ErroMix("transporMetodo inválido: %r (use fita ou tom)" % m)
    return m


def filtro_evento(ev, item, props, trilha_item=None):
    """(filtro ffmpeg do evento ou None, semitons ou None, método). Transpor 0 ou ausente: nenhum filtro."""
    partes = []
    if ev.get("filtro"):
        partes.append(ev["filtro"])
    n = resolve_transpor(ev, props, trilha_item)
    metodo = metodo_transpor(ev, props)
    if n is not None:
        fator = 2 ** (n / 12.0)
        if metodo == "tom":
            partes.append("rubberband=pitch=%.6f" % fator)
        else:
            partes.append("asetrate=%d,aresample=%d" % (int(round(taxa_original(item) * fator)), SR))
    return (",".join(partes) or None), n, metodo


def comando_evento(ev, item, props=None, trilha_item=None):
    """O comando de decode que o mix usa pra um evento de arquivo (o relatório e o teste usam)."""
    af, _, _ = filtro_evento(ev, item, props or {}, trilha_item)
    return comando_decode(item["arquivo"], af)


# ---------------------------------------------------------------------------------------------------------------
# Efeitos
# ---------------------------------------------------------------------------------------------------------------

def _registro_place(sig, t, ganho, n_total):
    """Onde o Track.place põe o sinal (a mesma conta dele): amostra, tempo real, pico e o tempo do pico."""
    i = int(round(t * SR))
    reg = {"amostra": i, "tAmostra": round(i / SR, 6), "duracao": round(len(sig) / SR, 6), "ganhoDb": ganho}
    if i >= n_total:
        reg["fora"] = "começa depois do fim do vídeo: não entrou no mix"
        return reg
    s, i2 = sig, i
    if i < 0:
        s, i2 = sig[-i:], 0
        reg["cortadoNoInicio_s"] = round(-i / SR, 6)
        reg["tAmostra"] = 0.0
    j = min(n_total, i2 + len(s))
    parte = s[: j - i2]
    if parte.size == 0:
        reg["fora"] = "nada do sinal cabe no vídeo"
        return reg
    a = np.abs(parte)
    k = int(a.argmax())
    topo = float(np.abs(sig).max())
    nivel = float(a[k]) / (topo + 1e-9) * db(ganho)
    reg["picoDbfs"] = round(20 * math.log10(nivel), 2) if nivel > 0 else None
    reg["tPico"] = round((i2 + k) / SR, 6)
    if j - i2 < len(s):
        reg["cortadoNoFim_s"] = round((len(s) - (j - i2)) / SR, 6)
    return reg


def _status_efeito(item, avisos, vistos):
    st = item.get("status")
    if st == "reprovado":
        raise ErroMix("efeito reprovado no catálogo: %s" % item["id"])
    if catalogo.cita_epidemic(item):
        raise ErroMix("efeito %s vem da Epidemic (fonte, url, licença ou arquivo): reprovado em tudo" % item["id"])
    restrita = catalogo.licenca_restrita(item.get("licenca"))
    if restrita:
        raise ErroMix("efeito %s com licença %s: não serve conteúdo de marca" % (item["id"], restrita))
    if st != "liberado" and item["id"] not in vistos:
        vistos.add(item["id"])
        avisos.append("efeito %s está '%s' no catálogo" % (item["id"], st))


def monta_efeitos(eventos, dur, modo_ruido, efeitos, props=None, trilha_item=None, avisos=None):
    """Põe os eventos num Track do sfx.py, na ordem da lista. Devolve (track, registros por evento)."""
    if modo_ruido not in MODOS_RUIDO:
        raise ErroMix("modoRuido inválido: %r (use legado ou por-evento)" % (modo_ruido,))
    avisos = avisos if avisos is not None else []
    props = props or {}
    tr = Track(dur)
    registros, vistos = [], set()
    if modo_ruido == "legado" and not sfx_kit.ruido_novo():
        # o mesmo objeto do sfx.py, de volta ao estado da semente 11 (o mix_guia.py roda num processo novo)
        sfx_kit.reinicia_legado()
        avisos.append("o gerador do sfx.py já tinha sido usado neste processo: voltou ao estado inicial da semente 11")
    for k, ev in enumerate(eventos):
        som = ev["som"]
        item = efeitos.get(som)
        if item is None:
            raise ErroMix("evento %d: o efeito %s não está no catálogo" % (k, som))
        _status_efeito(item, avisos, vistos)
        tipo = item.get("tipo")
        g = ev["ganhoDb"]
        reg = {"ordem": ev.get("ordem", k), "som": som, "origem": ev.get("origem"), "tipo": tipo, "t": ev["t"],
               "ganhoDb": g, "status": item.get("status")}
        if ev.get("args"):
            reg["args"] = ev["args"]
        if ev.get("inverte"):
            reg["inverte"] = True
        semente = None
        if modo_ruido == "por-evento":
            semente = ev["semente"] if "semente" in ev else sfx_kit.semente_de(ev.get("origem", "evento#%d" % k))
            reg["semente"] = semente
        ctx = sfx_kit.com_semente(semente) if semente is not None else nullcontext()
        with ctx:
            if tipo == "sintetizado":
                if ev.get("filtro") or resolve_transpor(ev, props, trilha_item) is not None:
                    raise ErroMix("evento %d (%s): filtro e transpor só valem pra arquivo; no sintetizado, mude os "
                                  "args" % (k, som))
                if ev.get("ancora") == "sincronia":
                    avisos.append("evento %d (%s): ancora 'sincronia' não vale pra sintetizado; entrou pelo início"
                                  % (k, som))
                res = sfx_kit.gera(som, ev.get("args"), efeitos)
                reg["funcao"] = "%s(%s)" % (item["sintese"]["funcao"], ", ".join(repr(a) for a in ev.get("args") or []))
                if (item.get("sintese") or {}).get("composto"):
                    if ev.get("inverte"):
                        raise ErroMix("evento %d (%s): inverte não vale pra sintetizado composto" % (k, som))
                    tiques = []
                    for t_i, sig_i, g_i in res:
                        gt = g_i + g
                        tiques.append(dict(_registro_place(sig_i, t_i, gt, tr.N), t=round(float(t_i), 6)))
                        tr.place(sig_i, t_i, gt)
                    reg["tiques"] = tiques
                    reg["nTiques"] = len(tiques)
                    if tiques:
                        reg["tAmostra"] = tiques[0]["tAmostra"]
                        dentro = [x for x in tiques if x.get("picoDbfs") is not None]
                        if dentro:
                            maior = max(dentro, key=lambda x: x["picoDbfs"])
                            reg["picoDbfs"], reg["tPico"] = maior["picoDbfs"], maior["tPico"]
                else:
                    sig = res
                    if ev.get("inverte"):
                        sig = sig[::-1].copy()
                    reg.update(_registro_place(sig, ev["t"], g, tr.N))
                    tr.place(sig, ev["t"], g)
            elif tipo == "arquivo":
                af, n, metodo = filtro_evento(ev, item, props, trilha_item)
                sig, cmd = decodifica(item["arquivo"], af)
                reg["arquivo"] = item["arquivo"]
                reg["comando"] = cmd
                if af:
                    reg["filtro"] = af
                if n is not None:
                    reg["transpor"], reg["transporMetodo"] = n, metodo
                t0 = ev["t"]
                if ev.get("ancora") == "sincronia":
                    sinc = item.get("sincronia_ms")
                    if not _numero(sinc):
                        raise ErroMix("evento %d (%s): ancora 'sincronia' sem sincronia_ms no catálogo" % (k, som))
                    s = sinc / 1000.0
                    if n is not None and metodo == "fita":
                        s = s / 2 ** (n / 12.0)  # a fita acelera junto com o tom
                    if "areverse" in (ev.get("filtro") or ""):
                        s = len(sig) / SR - s
                    if ev.get("filtro") and "areverse" not in ev["filtro"]:
                        avisos.append("evento %d (%s): o filtro %r pode mover o ponto de sincronia"
                                      % (k, som, ev["filtro"]))
                    if ev.get("inverte"):
                        s = len(sig) / SR - s
                    reg["ancora"] = "sincronia"
                    reg["sincronia_s"] = round(s, 6)
                    t0 = ev["t"] - s
                if ev.get("inverte"):
                    sig = sig[::-1].copy()
                reg.update(_registro_place(sig, t0, g, tr.N))
                tr.place(sig, t0, g)
            else:
                raise ErroMix("evento %d: %s é do tipo %s, não é som (receita e truque ficam só no catálogo)"
                              % (k, som, tipo))
        registros.append(reg)
    return tr, registros


# ---------------------------------------------------------------------------------------------------------------
# Voz e trilha (GP/mix_guia.py, linhas 159 a 191)
# ---------------------------------------------------------------------------------------------------------------

def arquivo_voz(pasta, props):
    """Caminho da voz: voz.arquivo com fecho 'embutido'; voz.final com 'asset'. None quando a peça não tem voz."""
    v = props.get("voz")
    if not v:
        return None
    fecho = v.get("fecho")
    if fecho == "embutido":
        arq = v.get("arquivo")
        if not arq:
            raise ErroMix("props.voz.arquivo faltando (fecho 'embutido')")
    elif fecho == "asset":
        arq = v.get("final")
        if not arq:
            raise ErroMix("props.voz.final faltando (fecho 'asset'): rode o kit.py voz-monta antes do mix")
        if not os.path.isfile(caminho_peca(pasta, arq)):
            raise ErroMix("a voz final não existe: %s. Ela é gravada pelo voz-monta (kit.py voz-monta <peça>): rode "
                          "ele antes do mix" % caminho_peca(pasta, arq))
    else:
        raise ErroMix("props.voz.fecho inválido: %r (use embutido ou asset)" % (fecho,))
    caminho = caminho_peca(pasta, arq)
    if not os.path.isfile(caminho):
        raise ErroMix("a voz não existe: %s" % caminho)
    return caminho


def monta_voz(caminho, N):
    """A voz na posição 0 com a cadeia do mix_guia.py e o pico em -1 dBFS. (voz, comando)."""
    voz = np.zeros(N, np.float32)
    if caminho is None:
        return voz, None
    vo, cmd = decodifica(caminho, CADEIA_VOZ)
    voz[: min(N, len(vo))] = vo[:N]
    voz *= db(-1.0) / (np.abs(voz).max() + 1e-9)
    return voz, cmd


def nome_da_pasta(pasta):
    """O nome da peça é o nome da PASTA (KIT/pecas/<peça>): as travas valem por ele, nunca pelo campo "peca"."""
    return os.path.basename(os.path.normpath(os.path.abspath(pasta)))


def trilha_da_peca(props, trilhas, avisos, peca=None):
    """(item do catálogo, campos da trilha nas props) ou (None, None) quando a peça não tem trilha. peca é o nome da
    PASTA da peça (o mixa() passa); sem ele, vale o campo das props (só pra teste)."""
    t = props.get("trilha")
    if not t or not t.get("id"):
        avisos.append("peça sem trilha")
        return None, None
    item = trilhas.get(t["id"])
    if item is None:
        raise ErroMix("trilha não está no catálogo: %s" % t["id"])
    peca = peca or props.get("peca")
    if props.get("peca") and props.get("peca") != peca:
        avisos.append("as props dizem peca %r e a pasta é %s: a regra da trilha valeu pela pasta" % (props.get("peca"),
                                                                                                   peca))
    # a mesma regra do montaProps (catalogo.confere_trilha): só trilha liberada, ou aceito-com-risco com a decisaoRisco
    # do catálogo valendo pra peça; sem verificação e prévia nunca entram; o texto em decisaoRisco das props não libera
    erros_t, avisos_t = catalogo.confere_trilha(item, peca)
    if erros_t:
        raise ErroMix("; ".join(erros_t))
    avisos.extend(avisos_t)
    if not _numero(t.get("mStart")) or t["mStart"] < 0:
        raise ErroMix("props.trilha.mStart inválido: %r" % (t.get("mStart"),))
    return item, t


def monta_trilha(item, t, voz, N, dur, avisos):
    """Trilha inteira decodificada, fatiada a partir de mStart, com abaixamento e fades. (mus, gain, info)."""
    if item is None:
        return np.zeros(N, np.float32), np.zeros(N), None
    info = {"id": item["id"], "arquivo": item["arquivo"], "mStart": t["mStart"], "status": item.get("status")}
    ganho = t.get("ganhoDb", "auto")
    if ganho == "auto":
        med = trilha_kit.mede_janela(item["arquivo"], t["mStart"], dur)
        ganho = trilha_kit.ganho_auto(med["I"])
        info["ganhoAuto"] = {"lufsJanela": med["I"], "regra": "-22,1 menos o LUFS da janela", "ganhoDb": ganho}
    elif not _numero(ganho):
        raise ErroMix("props.trilha.ganhoDb inválido: %r" % (ganho,))
    abaixa = t.get("abaixamento", PADROES_TRILHA["abaixamento"])
    fi = t.get("fadeIn", PADROES_TRILHA["fadeIn"])
    fo = t.get("fadeOut", PADROES_TRILHA["fadeOut"])
    for nome, v in (("abaixamento", abaixa), ("fadeIn", fi), ("fadeOut", fo)):
        if not _numero(v) or v < 0 or (nome != "abaixamento" and v == 0):
            raise ErroMix("props.trilha.%s inválido: %r" % (nome, v))
    M_START = t["mStart"]
    DUR = dur
    # trilha a partir de M_START, com abaixamento sob a voz
    mus, cmd = decodifica(item["arquivo"])
    i0 = int(M_START * SR)
    mus = mus[i0 : i0 + N]
    if len(mus) < N:
        avisos.append("a trilha acaba %s s antes do fim do vídeo (completada com silêncio)" % br((N - len(mus)) / SR, 3))
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
    gain = db(ganho) * (1 - abaixa * duck) * np.clip(tf / fi, 0, 1) * np.clip((DUR - tf) / fo, 0, 1)
    auto = t.get("automacao")
    if auto:
        # ordena só pelo tempo, estável: o degrau [t, 8], [t, 0] do catálogo fica na ordem escrita (03/10)
        pts = sorted(((float(a), float(b)) for a, b in auto), key=lambda p: p[0])
        gain = gain * db(np.interp(tf, [p[0] for p in pts], [p[1] for p in pts]))
        info["automacao"] = [list(p) for p in pts]
    info.update({"amostraInicial": i0, "ganhoDb": ganho, "abaixamento": abaixa, "fadeIn": fi, "fadeOut": fo,
                 "comando": cmd, "decodeInteiro": True})
    return mus, gain, info


# ---------------------------------------------------------------------------------------------------------------
# Loudnorm e saída
# ---------------------------------------------------------------------------------------------------------------

def mede_loudnorm(caminho):
    """A medição do loudnorm (print_format json) de um arquivo."""
    m = subprocess.run(["ffmpeg", "-hide_banner", "-i", caminho, "-af", LOUDNORM + ":print_format=json", "-f",
                        "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace").stderr
    try:
        return json.loads(m[m.rfind("{"): m.rfind("}") + 1])
    except ValueError:
        raise ErroMix("o loudnorm não devolveu a medição de %s: %s" % (caminho, m[-400:]))


def modo_passada2(js, alvo_i=-14.0, alvo_tp=-1.5, alvo_lra=9.0):
    """O modo que o loudnorm do ffmpeg usa na passada 2 com linear=true (a regra do af_loudnorm.c): linear só se o
    ganho linear não passar o pico alvo e a LRA medida couber na LRA alvo; senão ele volta pro modo dinâmico."""
    mi, mtp, mlra = float(js["input_i"]), float(js["input_tp"]), float(js["input_lra"])
    pico = mtp + (alvo_i - mi)
    if pico <= alvo_tp and mlra <= alvo_lra:
        return {"modo": "linear", "ganhoLinearDb": round(alvo_i - mi, 2)}
    motivo = ("o ganho linear de %s dB levaria o pico real a %s dBTP (alvo %s)"
              % (br(alvo_i - mi, 2, True), br(pico, 2, True), br(alvo_tp, 1)) if pico > alvo_tp else
              "a LRA medida (%s) passa da alvo (%s)" % (br(mlra, 1), br(alvo_lra, 1)))
    return {"modo": "dinamico", "motivo": motivo + ": o loudnorm voltou pro modo dinâmico, por isso a saída não "
            "chega a -14 LUFS (a junção corrige o nível)"}


def masteriza(mix, saida_tmp, pasta_tmp):
    """Intermediário f32 no Temp, loudnorm em duas passadas (como no mix_guia.py) e a saída em saida_tmp."""
    fd, tmp = tempfile.mkstemp(prefix="kit-mix-f32-", suffix=".wav", dir=pasta_tmp)
    os.close(fd)
    try:
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a",
                        "pcm_f32le", tmp], input=mix.astype(np.float32).tobytes(), check=True)
        js = mede_loudnorm(tmp)
        af = (f"loudnorm=I=-14:TP=-1.5:LRA=9:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
              f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:"
              f"linear=true")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp, "-af", af, "-ar", str(SR), "-ac", "2", "-c:a",
                        "pcm_s16le", saida_tmp], check=True)
    finally:
        try:
            os.remove(tmp)
        except OSError:
            pass
    return js, af


def le_wav_int16(dados):
    """(amostras int16 com forma (n, canais), taxa) de bytes de WAV PCM 16 bits."""
    with wave.open(io.BytesIO(dados), "rb") as w:
        if w.getsampwidth() != 2:
            raise ErroMix("WAV não é de 16 bits")
        n, c, sr = w.getnframes(), w.getnchannels(), w.getframerate()
        return np.frombuffer(w.readframes(n), "<i2").reshape(-1, c), sr


def wav_int16(x_mono, canais=2):
    """Bytes de WAV PCM 16 bits, 48 kHz, com o mono repetido nos canais (a conversão do ffmpeg: rint(x*32768))."""
    q = np.clip(np.rint(np.asarray(x_mono, np.float64) * 32768.0), -32768, 32767).astype("<i2")
    if canais > 1:
        q = np.repeat(q[:, None], canais, axis=1)
    b = io.BytesIO()
    with wave.open(b, "wb") as w:
        w.setnchannels(canais)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(q.tobytes())
    return b.getvalue()


def caminho_irmao(saida, sufixo, ext):
    base, _ = os.path.splitext(saida)
    return base + sufixo + ext


def exige_espaco(N, stems):
    # intermediário f32 (4 bytes por amostra), saída e o temporário dela (estéreo de 16 bits), mais os stems
    arquivos = [N * 4, N * 4, N * 4] + ([N * 4] * 3 if stems else [])
    total = sum(arquivos) / escrita.MB
    minimo = (400 if max(arquivos) > 5 * escrita.MB else 50) + total
    try:
        escrita.exige_disco(minimo, "o mix (%s MB de arquivos)" % br(total, 1))
    except escrita.DiscoInsuficiente as e:
        raise ErroMix(str(e))


def _md5_bytes(b):
    return hashlib.md5(b).hexdigest()


def _versao_ffmpeg():
    try:
        return subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True).stdout.splitlines()[0]
    except (OSError, IndexError):
        return None


def amostras_do_video(props, dur):
    """(N, quadros, fps): o mix tem exatamente quadros/fps segundos, quadros x 48000 / fps amostras (1600 por quadro a
    30 fps), o tamanho do vídeo. Sem props.quadros, os quadros saem como no props.ts (Math.round(duracao x fps))."""
    fps = props.get("fps", 30)
    if not _numero(fps) or fps <= 0:
        raise ErroMix("props.fps inválido: %r" % (fps,))
    q = props.get("quadros")
    if isinstance(q, bool) or not isinstance(q, int) or q <= 0:
        q = int(math.floor(dur * fps + 0.5))
    n = q * SR / float(fps)
    N = int(round(n))
    if abs(n - N) > 1e-6:
        raise ErroMix("%d quadros a %s fps não dão um número inteiro de amostras a %d Hz (%.4f)" % (q, fps, SR, n))
    return N, q, fps


def mixa(pasta, props, doc_eventos, saida, stems=False, relatorio=False, forca=False, catalogos=None,
         caminho_props=None, caminho_eventos=None):
    """Faz o mix e grava a saída (e, se pedido, os stems e o relatório). Devolve o relatório (dict)."""
    avisos = []
    efeitos, trilhas = catalogos or carrega_catalogos()
    eventos = doc_eventos.get("eventos") if isinstance(doc_eventos, dict) else doc_eventos
    confere_eventos(eventos)
    dur = props.get("duracao")
    if not _numero(dur) or dur <= 0:
        raise ErroMix("props.duracao inválida: %r" % (dur,))
    peca = nome_da_pasta(pasta)
    if isinstance(doc_eventos, dict) and _numero(doc_eventos.get("duracao")) and doc_eventos["duracao"] != dur:
        avisos.append("eventos.json diz duracao %s e as props %s: valeu a das props" % (doc_eventos["duracao"], dur))
    sons = props.get("sons") or {}
    modo_props = sons.get("modoRuido")
    modo_ev = doc_eventos.get("modoRuido") if isinstance(doc_eventos, dict) else None
    if modo_props and modo_ev and modo_props != modo_ev:
        raise ErroMix("modoRuido diferente nas props (%s) e no eventos.json (%s): gere os eventos de novo"
                      % (modo_props, modo_ev))
    modo = modo_ev or modo_props or "por-evento"
    perfil = (doc_eventos.get("perfil") if isinstance(doc_eventos, dict) else None) or sons.get("perfil")
    if perfil and perfil != "v2":
        avisos.append("perfil de som '%s': o aprovado pelo Pedro é o v2 (não trocar efeito aprovado sem avisar)"
                      % perfil)
    # o tamanho exato do vídeo (quadros x 48000 / fps), não round(duracao x 48000): o -shortest da junção cortava o fim
    N, quadros, fps = amostras_do_video(props, dur)
    dur_video = N / float(SR)
    exige_espaco(N, stems)
    trilha_item, trilha_props = trilha_da_peca(props, trilhas, avisos, peca)

    # 1. efeitos
    tr, registros = monta_efeitos(eventos, dur_video, modo, efeitos, props, trilha_item, avisos)
    if tr.N != N:
        raise ErroMix("o Track do sfx.py saiu com %d amostras e o vídeo pede %d" % (tr.N, N))
    # 2. voz: limpa grave, compressão leve, posição 0 (as palavras já estão no tempo do vídeo)
    cam_voz = arquivo_voz(pasta, props)
    if cam_voz is None:
        avisos.append("peça sem voz")
    voz, cmd_voz = monta_voz(cam_voz, N)
    # 3. trilha
    mus, gain, info_trilha = monta_trilha(trilha_item, trilha_props, voz, N, dur, avisos)
    # 4. soma e saída
    mix = voz + mus * gain + tr.x

    pasta_tmp = tempfile.gettempdir()
    fd, saida_tmp = tempfile.mkstemp(prefix="kit-mix-saida-", suffix=".wav", dir=pasta_tmp)
    os.close(fd)
    try:
        js, af2 = masteriza(mix, saida_tmp, pasta_tmp)
        medida_saida = trilha_kit.mede_janela(saida_tmp, 0.0, dur_video)  # ebur128, como o REF e a junção medem
        with open(saida_tmp, "rb") as f:
            dados = f.read()
    finally:
        try:
            os.remove(saida_tmp)
        except OSError:
            pass
    q, _ = le_wav_int16(dados)
    if q.shape[0] != N:
        # o loudnorm não muda o tamanho; se um dia mudar, o mix volta ao tamanho do vídeo (silêncio ou corte no fim)
        avisos.append("o loudnorm devolveu %d amostras e o vídeo pede %d: ajustado no fim" % (q.shape[0], N))
        q = np.pad(q, ((0, max(0, N - q.shape[0])), (0, 0)))[:N]
        b = io.BytesIO()
        with wave.open(b, "wb") as w:
            w.setnchannels(q.shape[1])
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(np.ascontiguousarray(q).astype("<i2").tobytes())
        dados = b.getvalue()
    final = escrita.grava_bytes(saida, dados, forca=forca, cria_pasta=True)

    # ganho efetivo do loudnorm (mínimos quadrados entre o mix antes e o canal 1 da saída)
    out = q[:, 0].astype(np.float64) / 32768.0
    pre = mix.astype(np.float32).astype(np.float64)
    den = float(np.dot(pre, pre))
    g_eff = float(np.dot(pre, out)) / den if den > 0 else 0.0
    resid = float(np.sqrt(np.mean((out - g_eff * pre) ** 2)) / (np.sqrt(np.mean(out ** 2)) + 1e-12))
    rel = {
        "versao": 1,
        "geradoPor": "KIT/audio/mixa.py (K05)",
        "geradoEm": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "peca": peca,
        "pecaDasProps": props.get("peca"),
        "pasta": os.path.abspath(pasta),
        "props": caminho_props,
        "eventos": caminho_eventos,
        "saida": final,
        "md5": _md5_bytes(dados),
        "tamanho": len(dados),
        "formato": {"sr": SR, "bits": 16, "canais": 2, "amostras": int(q.shape[0]), "duracao": dur,
                    "quadros": quadros, "fps": fps, "duracaoVideo": round(dur_video, 6),
                    "regra": "amostras = quadros x 48000 / fps (o tamanho exato do vídeo; a junção não corta quadro)"},
        "perfil": perfil,
        "modoRuido": modo,
        "ruido": ("gerador global do sfx.py (semente 11) consumido na ordem dos eventos" if modo == "legado"
                  else "um gerador por evento: np.random.default_rng(semente), semente = crc32(origem)"),
        "voz": {"arquivo": cam_voz, "fecho": (props.get("voz") or {}).get("fecho"), "cadeia": CADEIA_VOZ,
                "comando": cmd_voz, "picoNormalizado_dbfs": -1.0 if cam_voz else None},
        "trilha": info_trilha,
        "loudnorm": {
            "entrada": {"I": float(js["input_i"]), "TP": float(js["input_tp"]), "LRA": float(js["input_lra"]),
                        "thresh": float(js["input_thresh"]), "offset": float(js["target_offset"]),
                        "medidaPor": "loudnorm, passada 1"},
            "saida": {"I": medida_saida["I"], "TP": medida_saida["picoDbtp"], "LRA": medida_saida["LRA"],
                      "medidaPor": "ebur128=peak=true do ffmpeg no arquivo gravado"},
            "passada2": modo_passada2(js),
            "filtroPassada2": af2,
            "ganhoMedioDb": round(20 * math.log10(g_eff), 3) if g_eff > 0 else None,
            "residuoDoGanhoMedio": round(resid, 6),
        },
        "eventos": registros,
        "avisos": avisos,
        "ambiente": {"python": sys.version.split()[0], "numpy": np.__version__, "ffmpeg": _versao_ffmpeg(),
                     "sfx": sfx_kit.sfx.__file__},
    }
    if stems:
        rel["stems"] = {}
        for nome, x in (("voz", voz), ("trilha", mus * gain), ("efeitos", tr.x)):
            caminho = caminho_irmao(final, "-" + nome, ".wav")
            b = wav_int16(np.asarray(x, np.float64) * g_eff)
            rel["stems"][nome] = escrita.grava_bytes(caminho, b, forca=forca, cria_pasta=True)
        nota = ("stems antes do loudnorm, multiplicados pelo ganho médio dele (%s dB, mínimos quadrados entre o mix "
                "antes e depois), 48 kHz, 16 bits, estéreo. " % br(rel["loudnorm"]["ganhoMedioDb"] or 0.0, 3))
        if rel["loudnorm"]["passada2"]["modo"] == "linear":
            nota += "Com o loudnorm linear, a soma dos três dá o mix com diferença de arredondamento."
        else:
            nota += ("O loudnorm voltou pro modo dinâmico (ganho que varia no tempo): a soma dos três fica perto do "
                     "mix, mas não igual. Pra remixar, use os stems como base e refaça a loudness.")
        rel["stemsNota"] = nota
    if relatorio:
        rel["relatorio"] = escrita.grava_json(caminho_irmao(final, "", ".json"), rel, forca=forca, cria_pasta=True)
    return rel


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass
    ap = argparse.ArgumentParser(description="Mixador do kit por eventos (pacote K05). Sempre com python -B.")
    ap.add_argument("pasta", help="pasta da peça (KIT/pecas/<peça>)")
    ap.add_argument("--props", default="props.json")
    ap.add_argument("--eventos", default="eventos.json")
    ap.add_argument("--saida", default=os.path.join("audio", "mix.wav"))
    ap.add_argument("--stems", action="store_true", help="grava também voz, trilha e efeitos separados")
    ap.add_argument("--relatorio", action="store_true", help="grava o relatório .json ao lado da saída")
    ap.add_argument("--forca", action="store_true", help="grava mesmo se a saída for hardlink (st_nlink > 1)")
    a = ap.parse_args(argv)
    pasta = os.path.abspath(a.pasta)
    if not os.path.isdir(pasta):
        print("erro: a pasta da peça não existe: %s" % pasta)
        return 2
    try:
        cp, ce, cs = caminho_peca(pasta, a.props), caminho_peca(pasta, a.eventos), caminho_peca(pasta, a.saida)
        props = le_json(cp, "props")
        doc = le_json(ce, "eventos")
        rel = mixa(pasta, props, doc, cs, stems=a.stems, relatorio=a.relatorio, forca=a.forca, caminho_props=cp,
                   caminho_eventos=ce)
    except (ErroMix, escrita.EscritaRecusada, sfx_kit.ErroSintese, trilha_kit.ErroTrilha) as e:
        print("erro: %s" % e)
        return 2
    ln = rel["loudnorm"]
    print("mix ok: %s" % rel["saida"])
    print("  md5 %s, %d bytes, %d eventos, ruído %s, perfil %s"
          % (rel["md5"], rel["tamanho"], len(rel["eventos"]), rel["modoRuido"], rel["perfil"]))
    fm = rel["formato"]
    print("  %d amostras = %d quadros a %s fps (%s s, o tamanho exato do vídeo; a duração da cena é %s s)"
          % (fm["amostras"], fm["quadros"], fm["fps"], br(fm["duracaoVideo"], 6), br(fm["duracao"], 3)))
    print("  loudnorm: entrada I=%s LUFS; saída I=%s LUFS e pico real %s dBTP (ebur128); passada 2 %s"
          % (br(ln["entrada"]["I"]), br(ln["saida"]["I"], 1), br(ln["saida"]["TP"], 1), ln["passada2"]["modo"]))
    if rel.get("relatorio"):
        print("  relatório: %s" % rel["relatorio"])
    for nome, c in (rel.get("stems") or {}).items():
        print("  stem %s: %s" % (nome, c))
    for av in rel["avisos"]:
        print("  aviso: %s" % av)
    return 0


if __name__ == "__main__":
    sys.exit(main())
