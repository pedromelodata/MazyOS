"""Junção do vídeo mudo com o mix, com a loudness corrigida (pacote K07). Contrato: KIT/DESENHO.md, seção 7.6.

    ffmpeg -i mudo.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -af volume=<G>dB
           -shortest -movflags +faststart final.mp4

G começa em 0; mede o arquivo final (ebur128=peak=true), corrige G por -14,0 - I e refaz até |erro| <= 0,1 LU (no
máximo 3 voltas). Se o pico real passar de -1,5 dBTP, aplica o alimiter no wav (num temporário no Temp, com o
ganho já aplicado e a latência compensada) antes do AAC e mede de novo. Nunca grava por cima de entrada: cada
volta grava num temporário da pasta de saída, e só o certo troca de lugar com o final (os.replace). O vídeo vai
com -c:v copy (as etiquetas bt709 ficam como saíram do render; o md5 do fluxo de vídeo é conferido).
--mudo <mp4> usa um mudo de fora da peça, sem copiar nem ligar (o teste do K07 usa o MUDO4 assim).

Áudio do tamanho exato do vídeo (rodada 4, 03/10): o -shortest corta o vídeo quando o áudio é mais curto. O props.ts
arredonda os quadros (duração x 30) e o mixa.py antigo arredondava as amostras (duração x 48000): com a fração de
quadro arredondada pra cima, o mix ficava até meio quadro mais curto e a junção cortava 2 a 4 quadros do fim (823 de
826 na peça de 05/10). Agora o mixa.py grava quadros x 48000 / fps amostras, e a junção completa com silêncio (ou
corta) o mix que difere do vídeo em até um quadro, como o completa_mix.py que a peça de 05/10 rodou à mão: o mix
continua igual e o temporário exato vai pro Temp. Diferença maior que um quadro é erro (o mix é de outra versão das
props). O final tem de sair com os mesmos quadros do mudo.

Portão (rodada 4): a junção exige a trava de fatos ok das props de hoje (portao.py), sem opção de ignorar; peça de
teste (pasta com '_') passa com aviso.

Uso (sempre com python -B):
    python -B juncao.py <peça> [--cena <arquivo>] [--mudo <mp4>] [--mix <wav>] [--saida <mp4>] [--forca]
Grava saida/<peça><sufixo>.mp4 e saida/juncao<sufixo>.json.
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import datetime  # noqa: E402
import io  # noqa: E402
import os  # noqa: E402
import subprocess  # noqa: E402
import tempfile  # noqa: E402
import wave  # noqa: E402
from fractions import Fraction  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
import portao  # noqa: E402
from comum import escrita  # noqa: E402

ALVO_I = -14.0
TOL_I = 0.1
TETO_TP = -1.5
VOLTAS = 3
SR = 48000


def quadros_do_video(mp4):
    """(quadros, fps como Fraction) do primeiro fluxo de vídeo: nb_frames do ffprobe, ou a contagem dos pacotes."""
    s = comum.sonda(mp4)
    v = [x for x in s["streams"] if x.get("codec_type") == "video"]
    if not v:
        raise comum.ErroSaida("%s não tem fluxo de vídeo" % mp4, 2)
    v = v[0]
    num, den = (int(x) for x in str(v.get("r_frame_rate") or "30/1").split("/"))
    fps = Fraction(num, den or 1)
    nq = int(v.get("nb_frames") or 0)
    if nq <= 0:
        r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries",
                            "stream=nb_read_packets", "-of", "csv=p=0", mp4], capture_output=True, text=True)
        try:
            nq = int(r.stdout.strip().splitlines()[0])
        except (ValueError, IndexError):
            raise comum.ErroSaida("não deu pra contar os quadros de %s" % mp4)
    return nq, fps


def amostras_do_video(quadros, fps, sr=SR):
    """Amostras de áudio que cabem exatamente em `quadros` quadros (30 fps: 1600 por quadro)."""
    return int(round(Fraction(quadros) * sr / fps))


def mix_exato(mix, quadros, fps):
    """(wav do tamanho exato do vídeo, info). Igual ao mix quando já bate; senão, um temporário no Temp com o mix
    completado com silêncio (ou cortado) até quadros/fps, como o completa_mix.py da peça de 05/10. Diferença de mais
    de um quadro é erro."""
    with wave.open(mix, "rb") as w:
        par = w.getparams()
        if par.framerate != SR:
            raise comum.ErroSaida("o mix %s está em %d Hz; a junção espera %d Hz (refaça com kit.py mix)"
                                  % (mix, par.framerate, SR), 2)
        n = par.nframes
        alvo = amostras_do_video(quadros, fps)
        info = {"arquivo": mix, "amostras": n, "alvo": alvo, "quadros": quadros, "fps": str(fps),
                "completadoComSilencio": 0, "cortado": 0}
        if n == alvo:
            return mix, info
        um_quadro = int(round(SR / fps))
        if abs(alvo - n) > um_quadro:
            raise comum.ErroSaida("o mix tem %d amostras (%.4f s) e o vídeo pede %d (%d quadros a %s fps, %.4f s): "
                                  "diferença de mais de um quadro, o mix é de outra versão das props; rode kit.py mix "
                                  "de novo" % (n, n / SR, alvo, quadros, fps, alvo / SR), 2)
        dados = w.readframes(n)
    if alvo > n:
        dados += b"\x00" * ((alvo - n) * par.sampwidth * par.nchannels)
        info["completadoComSilencio"] = alvo - n
    else:
        dados = dados[:alvo * par.sampwidth * par.nchannels]
        info["cortado"] = n - alvo
    buf = io.BytesIO()
    with wave.open(buf, "wb") as o:
        o.setnchannels(par.nchannels)
        o.setsampwidth(par.sampwidth)
        o.setframerate(par.framerate)
        o.writeframes(dados)
    fd, tmp = tempfile.mkstemp(prefix="kit-juncao-mix-exato-", suffix=".wav")
    os.close(fd)
    with open(tmp, "wb") as f:
        f.write(buf.getvalue())
    info["temporario"] = comum.barra(tmp)
    return tmp, info


def _ffmpeg_juncao(mudo, wav, ganho, destino):
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", mudo, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
           "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-af", "volume=%.2fdB" % ganho, "-shortest",
           "-movflags", "+faststart", destino]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        raise comum.ErroSaida("ffmpeg da junção falhou: %s" % r.stderr.strip()[-600:])
    return cmd


def _limitado(wav, ganho, tp):
    """wav com o ganho e o alimiter (latência compensada), num temporário no Temp. Devolve (caminho, limite_db)."""
    limite_db = min(-2.0, TETO_TP - (tp - TETO_TP) - 0.5)
    fd, tmp = tempfile.mkstemp(prefix="kit-juncao-", suffix=".wav")
    os.close(fd)
    af = "volume=%.2fdB,alimiter=limit=%.6f:level=false:latency=true:attack=5:release=50" % (ganho, 10 ** (limite_db / 20))
    r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-af", af, "-c:a", "pcm_f32le", tmp],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        os.remove(tmp)
        raise comum.ErroSaida("alimiter falhou: %s" % r.stderr.strip()[-400:])
    return tmp, limite_db, af


def junta(peca, mudo=None, mix=None, saida=None, forca=False):
    mudo = comum.barra(os.path.abspath(mudo)) if mudo else peca.mudo()
    mix = comum.barra(os.path.abspath(mix)) if mix else peca.mix
    saida = comum.barra(os.path.abspath(saida)) if saida else peca.final()
    for nome, p in (("mudo", mudo), ("mix", mix)):
        if not os.path.isfile(p):
            raise comum.ErroSaida("o %s não existe: %s" % (nome, p), 2)
    for p in (mudo, mix):
        if os.path.abspath(p).casefold() == os.path.abspath(saida).casefold():
            raise comum.ErroSaida("a saída não pode ser uma entrada: %s" % saida, 2)
    if escrita.protegido(saida):
        raise comum.ErroSaida("a saída é caminho protegido: %s" % saida, 2)
    if os.path.exists(saida) and os.stat(saida).st_nlink > 1 and not forca:
        raise comum.ErroSaida("recusado: %s é hardlink (st_nlink %d; provavelmente já entregue no FINAL); grave com "
                              "--saida num caminho novo" % (saida, os.stat(saida).st_nlink))
    # portão: a trava de fatos das props de hoje (sem opção de ignorar; peça de teste passa com aviso)
    avisos_portao = portao.exige(peca, "a junção", portao.problemas_fatos(peca))
    pasta = os.path.dirname(saida)
    os.makedirs(pasta, exist_ok=True)
    estimado = (os.path.getsize(mudo) + 192000 / 8 * 30 + 2e6) / 1048576
    escrita.exige_disco(comum.DISCO_RENDER_MB + estimado, "a junção (%s)" % os.path.basename(saida))
    md5_mudo = comum.md5_fluxo_video(mudo)
    quadros, fps = quadros_do_video(mudo)
    if os.path.isfile(peca.props):
        pq = peca.le_props().get("quadros")
        if isinstance(pq, int) and pq != quadros:
            raise comum.ErroSaida("o mudo tem %d quadros e as props pedem %d: o mudo é de outra versão das props; rode "
                                  "kit.py render de novo" % (quadros, pq), 2)
    rel = {"versao": 2, "peca": peca.nome, "cena": peca.nome_cena, "mudo": mudo, "mix": mix, "saida": saida,
           "feitoEm": datetime.datetime.now().isoformat(timespec="seconds"), "alvo": {"I": ALVO_I, "tolerancia": TOL_I,
           "picoRealMax": TETO_TP}, "voltas": [], "limitador": None, "md5FluxoVideoMudo": md5_mudo,
           "quadrosMudo": quadros, "fps": str(fps), "avisosPortao": avisos_portao}
    base, info_mix = mix_exato(mix, quadros, fps)
    rel["mixExato"] = info_mix
    if info_mix["completadoComSilencio"] or info_mix["cortado"]:
        print("mix: %d amostras; o vídeo pede %d (%d quadros a %s fps): %s (o mix fica como está; o exato vai pro Temp)"
              % (info_mix["amostras"], info_mix["alvo"], quadros, fps,
                 ("completado com %d amostras de silêncio" % info_mix["completadoComSilencio"])
                 if info_mix["completadoComSilencio"] else "cortado em %d amostras" % info_mix["cortado"]), flush=True)
    entrada = base
    tmp_lim = None
    ganho = 0.0
    fd, tmp = tempfile.mkstemp(prefix=".tmp-juncao-", suffix=".mp4", dir=pasta)
    os.close(fd)
    try:
        volta = 0
        while True:
            volta += 1
            cmd = _ffmpeg_juncao(mudo, entrada, ganho if tmp_lim is None else 0.0, tmp)
            m = comum.loudness(tmp)
            rel["voltas"].append({"volta": volta, "ganhoDb": round(ganho, 2), "I": m["I"], "TP": m["TP"], "LRA": m["LRA"],
                                  "limitador": tmp_lim is not None})
            print("volta %d: volume=%.2fdB%s -> I %.1f LUFS, pico real %.1f dBTP, LRA %.1f LU"
                  % (volta, ganho, " (com alimiter no wav)" if tmp_lim else "", m["I"], m["TP"], m["LRA"]))
            erro = ALVO_I - m["I"]
            if m["TP"] > TETO_TP and tmp_lim is None:
                tmp_lim, limite_db, af = _limitado(base, ganho, m["TP"])
                entrada = tmp_lim
                rel["limitador"] = {"limiteDb": round(limite_db, 2), "filtro": af, "motivo": "pico real %.1f dBTP" % m["TP"]}
                continue
            if abs(erro) <= TOL_I or volta >= VOLTAS + (1 if tmp_lim is not None else 0):
                break
            ganho += erro
            if tmp_lim is not None:
                os.remove(tmp_lim)
                tmp_lim, limite_db, af = _limitado(base, ganho, m["TP"])
                entrada = tmp_lim
                rel["limitador"]["filtro"] = af
        final = rel["voltas"][-1]
        rel["comando"] = comum.mostra(cmd)
        rel["ganhoDb"] = final["ganhoDb"]
        rel["I"], rel["TP"], rel["LRA"] = final["I"], final["TP"], final["LRA"]
        rel["md5FluxoVideo"] = comum.md5_fluxo_video(tmp)
        rel["videoIgualAoMudo"] = rel["md5FluxoVideo"] == md5_mudo
        rel["quadrosFinal"] = quadros_do_video(tmp)[0]
        rel["quadrosIguais"] = rel["quadrosFinal"] == quadros
        rel["ok"] = (abs(ALVO_I - final["I"]) <= TOL_I and final["TP"] <= TETO_TP and rel["videoIgualAoMudo"]
                     and rel["quadrosIguais"])
        os.replace(tmp, saida)
        tmp = None
    finally:
        if tmp and os.path.exists(tmp):
            os.remove(tmp)
        if tmp_lim and os.path.exists(tmp_lim):
            os.remove(tmp_lim)
        if base != mix and os.path.exists(base):
            os.remove(base)  # o mix exato do Temp (o mix da peça fica como está)
    rel["tamanho"] = os.path.getsize(saida)
    rel["md5"] = escrita.md5(saida)
    escrita.grava_json(peca.saida("juncao", ".json", "saida"), rel, cria_pasta=True)
    return rel


def main(argv=None):
    comum.utf8()
    ap = argparse.ArgumentParser(prog="juncao.py", description="Junta o mudo e o mix com a loudness certa (K07, 7.6).")
    ap.add_argument("peca")
    ap.add_argument("--cena")
    ap.add_argument("--mudo", help="um mudo de fora da peça (só leitura; nada é copiado nem ligado)")
    ap.add_argument("--mix", help="outro mix (padrão audio/mix<sufixo>.wav)")
    ap.add_argument("--saida", help="outro destino (padrão saida/<peça><sufixo>.mp4)")
    ap.add_argument("--forca", action="store_true", help="grava mesmo se a saída for hardlink (troca só a entrada)")
    a = ap.parse_args(argv)
    try:
        peca = comum.Peca(a.peca, a.cena)
        r = junta(peca, a.mudo, a.mix, a.saida, a.forca)
    except (comum.ErroSaida, escrita.EscritaRecusada, escrita.DiscoInsuficiente) as e:
        print("erro: %s" % e)
        return getattr(e, "codigo", 1)
    print("final: %s (%d bytes)" % (r["saida"], r["tamanho"]))
    print("  volume=%.2fdB, I %.1f LUFS, pico real %.1f dBTP, LRA %.1f LU, %d volta(s)%s"
          % (r["ganhoDb"], r["I"], r["TP"], r["LRA"], len(r["voltas"]), ", com alimiter" if r["limitador"] else ""))
    print("  fluxo de vídeo md5 %s (%s o do mudo); %d quadros (o mudo tem %d)%s"
          % (r["md5FluxoVideo"], "igual ao" if r["videoIgualAoMudo"] else "DIFERENTE do", r["quadrosFinal"],
             r["quadrosMudo"], "" if r["quadrosIguais"] else ": a junção CORTOU quadros"))
    mx = r["mixExato"]
    if mx["completadoComSilencio"] or mx["cortado"]:
        print("  mix %s até %d amostras (%d quadros a %s fps), o mesmo que o completa_mix.py da peça de 05/10"
              % ("completado com %d amostras de silêncio" % mx["completadoComSilencio"] if mx["completadoComSilencio"]
                 else "cortado em %d amostras" % mx["cortado"], mx["alvo"], mx["quadros"], mx["fps"]))
    print("resultado: %s" % ("ok" if r["ok"] else "FORA DO ALVO"))
    return 0 if r["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
