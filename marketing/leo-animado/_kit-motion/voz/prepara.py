"""Prepara a narração pro voice_change do Higgsfield (timbre Dylan). Pacote K03, DESENHO.md seções 2 e 8.

Uso (no PY, sempre com -B):
    python -B prepara.py <pasta da peça> [--wav voz/narr-pedro-raw.wav] [--forca]

Grava <pasta>/voz/para-voz.mp4: vídeo preto 360x640 a 30 fps (libx264, yuv420p) que dura a voz mais 0,5 s,
com a voz inteira em AAC 192k a 48 kHz, mono. O mp4 sai num temporário da mesma pasta e entra pelo
KIT/lib/escrita.py (troca com os.replace). Não sobrescreve um para-voz.mp4 existente sem --forca e nunca
grava em hardlink. No fim mostra o passo seguinte no Higgsfield.

A voz é decodificada pelo ffmpeg em mono a 48 kHz (a mesma mistura do PR/src/timeline.py). Se o pico passar
de 0,98 (a mistura dos dois canais do TTS pode passar de 0 dBFS), ela é abaixada só o necessário, e o script
avisa: o nível não importa pro voice_change e o monta.py casa o fecho pela loudness da fala.
"""
import argparse
import math
import os
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comum  # noqa: E402
from comum import ErroVoz, escrita, fmt, relativo  # noqa: E402

PICO_MAX = 0.98
FOLGA_VIDEO = 0.5
CREDITOS_POR_27S = 3.0


def prepara(pasta, wav_rel, forca):
    pasta = os.path.abspath(pasta)
    if not os.path.isdir(pasta):
        raise ErroVoz("a pasta da peça %s não existe" % pasta)
    wav = comum.na_pasta(pasta, wav_rel)
    if not os.path.isfile(wav):
        raise ErroVoz("a voz %s não existe (grave o TTS em voz/narr-pedro-raw.wav ou passe --wav)" % wav)
    pasta_voz = os.path.join(pasta, "voz")
    destino = comum.confere_destino(os.path.join(pasta_voz, "para-voz.mp4"), forca,
                                    "use --forca pra regravar (o voice_change já pode ter usado este arquivo)")

    x = comum.carrega(wav)
    if len(x) == 0:
        raise ErroVoz("a voz %s está vazia" % wav)
    dur = len(x) / comum.SR
    pico = float(abs(x).max())
    ganho_db = 0.0
    if pico > PICO_MAX:
        ganho = PICO_MAX / pico
        x = x * ganho
        ganho_db = 20 * math.log10(ganho)
    dur_video = dur + FOLGA_VIDEO

    if not os.path.isdir(pasta_voz):
        os.makedirs(pasta_voz)  # pasta voz/ da própria peça
    fd, tmp = tempfile.mkstemp(prefix=".tmp-ffmpeg-", suffix=".mp4", dir=pasta_voz)
    os.close(fd)
    try:
        cmd = ["ffmpeg", "-y", "-v", "error",
               "-f", "lavfi", "-i", "color=c=black:s=360x640:r=30:d=%.3f" % dur_video,
               "-f", "f32le", "-ar", str(comum.SR), "-ac", "1", "-i", "-",
               "-map", "0:v", "-map", "1:a",
               "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p",
               "-c:a", "aac", "-b:a", "192k", "-ar", str(comum.SR), "-ac", "1",
               "-movflags", "+faststart", "-f", "mp4", tmp]
        r = subprocess.run(cmd, input=x.astype("float32").tobytes(), capture_output=True)
        if r.returncode != 0:
            raise ErroVoz("o ffmpeg falhou: %s" % r.stderr.decode("utf-8", "replace").strip())
        info = comum.sonda(tmp)
        v = [s for s in info["streams"] if s.get("codec_type") == "video"]
        a = [s for s in info["streams"] if s.get("codec_type") == "audio"]
        if not v or not a:
            raise ErroVoz("o mp4 temporário saiu sem vídeo ou sem áudio")
        dv, da = float(v[0].get("duration") or 0), float(a[0].get("duration") or 0)
        if abs(dv - dur_video) > 0.05 or abs(da - dur) > 0.05:
            raise ErroVoz("durações fora do esperado: vídeo %.3f s (esperado %.3f) e áudio %.3f s (esperado %.3f)"
                          % (dv, dur_video, da, dur))
        with open(tmp, "rb") as f:
            dados = f.read()
        escrita.grava_bytes(destino, dados)
    finally:
        try:
            os.remove(tmp)
        except OSError:
            pass
    return {"destino": destino, "wav": wav, "dur": dur, "dur_video": dv, "dur_audio": da, "pico": pico,
            "ganho_db": ganho_db, "tamanho": len(dados), "video": v[0], "audio": a[0]}


def _main(argv):
    comum.utf8()
    ap = argparse.ArgumentParser(description="Grava voz/para-voz.mp4 (vídeo preto leve com a voz) pro voice_change.")
    ap.add_argument("pasta", help="pasta da peça (KIT/pecas/<peca>)")
    ap.add_argument("--wav", default="voz/narr-pedro-raw.wav", help="voz do TTS (padrão voz/narr-pedro-raw.wav)")
    ap.add_argument("--forca", action="store_true", help="regrava um para-voz.mp4 que já existe")
    a = ap.parse_args(argv)
    try:
        r = prepara(a.pasta, a.wav, a.forca)
    except (ErroVoz, escrita.EscritaRecusada, escrita.DiscoInsuficiente) as e:
        print("erro: %s" % e, file=sys.stderr)
        return 1
    pasta = os.path.abspath(a.pasta)
    custo = math.ceil(CREDITOS_POR_27S * r["dur_video"] / 27.0 * 10) / 10
    print("ok: %s (%d bytes)" % (relativo(pasta, r["destino"]), r["tamanho"]))
    print("  voz: %s, %s s; vídeo preto 360x640 30 fps com %s s; áudio AAC 192k 48 kHz mono com %s s"
          % (relativo(pasta, r["wav"]), fmt(r["dur"], 3), fmt(r["dur_video"], 3), fmt(r["dur_audio"], 3)))
    if r["ganho_db"] < 0:
        print("  aviso: o pico da mistura mono era %s (acima de 0 dBFS); a voz foi abaixada %s dB pra não estourar"
              % (fmt(r["pico"], 3), fmt(-r["ganho_db"], 2)))
    ref = "" if a.wav == "voz/narr-pedro-raw.wav" else ' --ref "%s"' % comum.barra(r["wav"])
    print()
    print("Passo seguinte, no Higgsfield (voice_change):")
    print("  1. suba o voz/para-voz.mp4 (media_upload) e confirme o media_id;")
    print("  2. voice_change com video_id = <media_id>, voice_id = %s (preset Dylan), voice_type = preset;"
          % comum.PRESET_DYLAN)
    print("     custo estimado: %s créditos (3 créditos por 27 s de vídeo);" % fmt(custo, 1))
    print("  3. salve o vídeo devolvido (de preferência dentro da pasta da peça) e rode:")
    print('     "%s" -B "%s" "%s" "<vídeo devolvido>"%s'
          % (comum.PY, comum.barra(os.path.join(comum.VOZ, "recebe.py")), comum.barra(pasta), ref))
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
