"""Assinatura sonora do Legalizaí: gera as quatro propostas (pacote K05).

Contrato: KIT/DESENHO.md, seção 12 (assinatura sonora do fecho, código próprio, uma por tom) e Anexo A.2b.

Uso (sempre com python -B):
  python -B assinatura.py [--d 1.2] [--saida <pasta>]

Grava assinatura/assinatura-do.wav, -mi.wav, -la.wav e -re.wav (48 kHz, mono, 16 bits, pico em -1 dBFS, menos de
150 KB cada) e assinatura/assinatura.json, pelo KIT/lib/escrita.py. Status: proposta. O Pedro ouve antes de virar
padrão; até lá o fecho aprovado do guia continua o de sempre (s_chime sol6 + dó7 no "aí").

A receita está no sfx_kit.s_assinatura: pop curto s_pop(900, 420, 0.1, 34), duas notas s_chime em quinta no tom
(a de cima 0,12 s depois e um pouco mais baixa) e um brilho s_brilho bem baixo no fim, normalizado.
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import datetime  # noqa: E402
import io  # noqa: E402
import math  # noqa: E402
import os  # noqa: E402
import tempfile  # noqa: E402
import wave  # noqa: E402

import numpy as np  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
KIT_PADRAO = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion"
KIT = os.path.dirname(AQUI) if os.path.isfile(os.path.join(os.path.dirname(AQUI), "catalogos", "catalogo.py")) \
    else KIT_PADRAO
for _p in (os.path.join(KIT, "lib"), AQUI):
    if _p not in sys.path:
        sys.path.insert(0, _p)

import escrita  # noqa: E402
import sfx_kit  # noqa: E402
import trilha as trilha_kit  # noqa: E402

STATUS = "proposta: o Pedro ouve antes de virar padrão"
PICO_ARQUIVO_DB = -1.0
LIMITE_BYTES = 150 * 1000
TONS = ("do", "mi", "la", "re")
NOMES_TOM = {"do": "dó", "mi": "mi", "la": "lá", "re": "ré"}
COMBINA = {
    "do": "dó: o tom dos efeitos em dó do acervo (1109, 2867, 2870, s_check); Let's Move tem tom incerto (dó maior 0,59)",
    "mi": "mi: o fecho da precificação (mi6 + si6); combina com trilha em mi (Summer Fashion)",
    "la": "lá: combina com a House One (lá maior / fá# menor)",
    "re": "ré: alternativa mais aguda que o lá, mesma família (ré6 + lá6)",
}


def br(x, casas=2):
    """Número com vírgula decimal, pras mensagens em português."""
    return (("%." + str(casas) + "f") % x).replace(".", ",")


def wav_mono16(y):
    """Bytes de WAV PCM 16 bits, 48 kHz, mono."""
    q = np.clip(np.rint(np.asarray(y, np.float64) * 32768.0), -32768, 32767).astype("<i2")
    b = io.BytesIO()
    with wave.open(b, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sfx_kit.SR)
        w.writeframes(q.tobytes())
    return b.getvalue()


def mede(dados, dur):
    """Loudness e pico real pelo ebur128 do ffmpeg (num temporário no Temp, apagado no fim)."""
    fd, tmp = tempfile.mkstemp(prefix="kit-assinatura-", suffix=".wav")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(dados)
        return trilha_kit.mede_janela(tmp, 0.0, dur)
    finally:
        try:
            os.remove(tmp)
        except OSError:
            pass


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass
    ap = argparse.ArgumentParser(description="Gera as quatro propostas de assinatura sonora (pacote K05).")
    ap.add_argument("--d", type=float, default=1.2, help="duração em segundos (1,0 a 1,5; padrão 1,2)")
    ap.add_argument("--saida", default=os.path.join(AQUI, "assinatura"))
    a = ap.parse_args(argv)
    pasta = os.path.abspath(a.saida)
    arquivos = []
    for tom in TONS:
        y = sfx_kit.s_assinatura(tom, a.d)
        y = y * sfx_kit.db(PICO_ARQUIVO_DB)
        dados = wav_mono16(y)
        if len(dados) >= LIMITE_BYTES:
            print("erro: assinatura-%s.wav teria %d bytes (limite %d)" % (tom, len(dados), LIMITE_BYTES))
            return 2
        caminho = escrita.grava_bytes(os.path.join(pasta, "assinatura-%s.wav" % tom), dados, cria_pasta=True)
        n1, m1, n2, m2 = sfx_kit.TONS_ASSINATURA[tom]
        med = mede(dados, a.d)
        pico = float(np.abs(y).max())
        arquivos.append({
            "tom": NOMES_TOM[tom],
            "arquivo": os.path.basename(caminho),
            "notas": [n1, n2],
            "freqsHz": [round(sfx_kit.freq_midi(m1), 3), round(sfx_kit.freq_midi(m2), 3)],
            "intervalo": "quinta justa",
            "duracao": round(len(y) / sfx_kit.SR, 6),
            "sr": sfx_kit.SR, "canais": 1, "bits": 16,
            "tamanho": len(dados),
            "md5": escrita.md5(caminho),
            "picoDbfs": round(20 * math.log10(pico), 2),
            "lufs": med["I"], "picoRealDbtp": med["picoDbtp"],
            "evento": {"som": "sint-s_assinatura", "args": [tom, a.d]},
            "combina": COMBINA[tom],
        })
        print("%s: %s (%d bytes, %s + %s, %s LUFS)" % (tom, caminho, len(dados), n1, n2, br(med["I"], 1)))
    doc = {
        "versao": 1,
        "status": STATUS,
        "geradoEm": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "geradoPor": "KIT/audio/assinatura.py (K05)",
        "funcao": "KIT/audio/sfx_kit.py: s_assinatura(tom='do', d=1.2)",
        "catalogo": "sint-s_assinatura (efeitos/base.json; args do catálogo ainda null, a função tem tom e d)",
        "receita": [
            "pop curto s_pop(900, 420, 0.1, 34) em 0 s, ganho %s" % br(sfx_kit.ASSINATURA_POP[1]),
            "nota de baixo do tom: s_chime(f, %s) em %s s, ganho %s"
            % (sfx_kit.ASSINATURA_NOTA1[2], br(sfx_kit.ASSINATURA_NOTA1[0]), br(sfx_kit.ASSINATURA_NOTA1[1])),
            "nota de cima (quinta justa): s_chime(f, %s) em %s s, ganho %s"
            % (sfx_kit.ASSINATURA_NOTA2[2], br(sfx_kit.ASSINATURA_NOTA2[0]), br(sfx_kit.ASSINATURA_NOTA2[1])),
            "brilho s_brilho(%s) bem baixo, ganho %s, terminando %s s antes do fim"
            % (sfx_kit.ASSINATURA_BRILHO[0], br(sfx_kit.ASSINATURA_BRILHO[1]), br(sfx_kit.ASSINATURA_BRILHO[2])),
            "fade de saída de %d ms, normalizado (pico 1,0 na função; %s dBFS no arquivo)"
            % (round(sfx_kit.ASSINATURA_FADE * 1000), br(PICO_ARQUIVO_DB, 0)),
        ],
        "ruido": "não usa ruído: o som é sempre o mesmo, em qualquer modo de ruído",
        "padraoAtual": "o fecho aprovado do guia continua sol6 + dó7 (s_chime 1567.98 e 2093.0 no 'aí', 15,96 e "
                       "16,00 s); a assinatura só vira padrão depois que o Pedro ouvir as quatro",
        "naoFoiOuvida": "medida, não escutada (riscos do DESENHO, seção 14)",
        "arquivos": arquivos,
    }
    print(escrita.grava_json(os.path.join(pasta, "assinatura.json"), doc, cria_pasta=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
