"""Download deliberado de UM arquivo escolhido (pacote K08). Contrato: KIT/DESENHO.md, seções 12 e 13.

Regras: só baixa o que está em escolhidos.json; um arquivo por chamada; confere o disco antes (para abaixo de
400 MB livres); confere o tamanho pelo cabeçalho antes de baixar (áudio até 8 MB; nenhum download acima de
15 MB); baixa pelo curl pra memória, confere o tamanho e o md5 contra o ETag do servidor (no Mixkit o ETag do S3
é o md5 do arquivo) e só então grava pelo KIT/lib/escrita.py. Trilha: grava com nome provisório, mede o BPM com o
mede_trilha.py e troca pro nome final NN_titulo_autor_fonte-id_bpm.mp3. Registra tudo em baixados.json.
O Mixkit proíbe baixar em massa com robô: este script nunca varre página nem baixa lista; é um por vez, à mão.

Uso (sempre com python -B):
    python -B baixa.py <chave>            baixa o item <chave> de escolhidos.json
    python -B baixa.py --cabecalho <chave>  só lê o cabeçalho (tamanho, ETag), sem baixar
    python -B baixa.py --lista            lista os escolhidos e se já foram baixados
"""
import argparse
import datetime
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

sys.dont_write_bytecode = True
AQUI = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.dirname(AQUI)
sys.path.insert(0, os.path.join(KIT, "lib"))
sys.path.insert(0, AQUI)
import escrita  # noqa: E402

ESCOLHIDOS = os.path.join(AQUI, "escolhidos.json")
BAIXADOS = os.path.join(AQUI, "baixados.json")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36"
MB = 1024 * 1024
LIMITE_AUDIO = 8 * MB
LIMITE_DOWNLOAD = 15 * MB
MINIMO_LIVRE_MB = 400


def curl():
    c = shutil.which("curl")
    if not c:
        raise SystemExit("curl não encontrado no PATH")
    return c


def le_json(caminho, padrao):
    if not os.path.isfile(caminho):
        return padrao
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


def cabecalho(url):
    r = subprocess.run([curl(), "-sS", "-I", "-L", "--max-time", "60", "-A", UA, url], capture_output=True)
    if r.returncode != 0:
        raise SystemExit("cabeçalho falhou (%d): %s" % (r.returncode, r.stderr.decode("utf-8", "replace")))
    blocos = r.stdout.decode("latin-1").replace("\r", "").strip().split("\n\n")
    ultimo = blocos[-1]
    linhas = ultimo.split("\n")
    status = linhas[0]
    h = {}
    for ln in linhas[1:]:
        if ":" in ln:
            k, v = ln.split(":", 1)
            h[k.strip().casefold()] = v.strip()
    return status, h


def baixa_memoria(url, limite):
    r = subprocess.run([curl(), "-sS", "-f", "-L", "--max-time", "300", "--max-filesize", str(limite), "-A", UA, url],
                       capture_output=True)
    if r.returncode != 0:
        raise SystemExit("download falhou (%d): %s" % (r.returncode, r.stderr.decode("utf-8", "replace")))
    return r.stdout


def slug(texto):
    import unicodedata
    t = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii").casefold()
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t


def registra(item_reg):
    reg = le_json(BAIXADOS, {"versao": 1, "descricao": "registro dos downloads do K08 (um por vez, só os escolhidos)",
                             "itens": []})
    reg["itens"] = [i for i in reg["itens"] if i.get("chave") != item_reg["chave"]] + [item_reg]
    escrita.grava_json(BAIXADOS, reg)


def principal(chave, so_cabecalho=False):
    esc = le_json(ESCOLHIDOS, None)
    if esc is None:
        raise SystemExit("escolhidos.json não existe")
    item = next((i for i in esc["itens"] if i["chave"] == chave), None)
    if item is None:
        raise SystemExit("chave fora de escolhidos.json: %s (só se baixa o que foi escolhido)" % chave)
    reg = le_json(BAIXADOS, {"itens": []})
    feito = next((i for i in reg["itens"] if i["chave"] == chave), None)
    if feito and os.path.isfile(feito["arquivo"]) and escrita.md5(feito["arquivo"]) == feito["md5"]:
        print("já baixado e conferido: %s (md5 %s); nada a fazer" % (feito["arquivo"], feito["md5"]))
        return 0
    livre = escrita.livre_mb()
    print("disco: %.0f MB livres no C:" % livre)
    if livre < MINIMO_LIVRE_MB:
        raise SystemExit("PARADO: %.0f MB livres, abaixo de %d MB" % (livre, MINIMO_LIVRE_MB))
    url = item["urlArquivo"]
    status, h = cabecalho(url)
    tam = int(h.get("content-length", "-1"))
    etag = h.get("etag", "").strip('"')
    print("cabeçalho: %s | %d bytes | ETag %s | %s" % (status, tam, etag, h.get("content-disposition", "")))
    if so_cabecalho:
        return 0
    if " 200" not in status:
        raise SystemExit("recusado: o servidor respondeu %s" % status)
    if tam <= 0 or tam > LIMITE_AUDIO:
        raise SystemExit("recusado: %d bytes (limite de 8 MB por arquivo de áudio)" % tam)
    escrita.exige_disco(MINIMO_LIVRE_MB + tam / MB, "baixar %s" % chave)
    dados = baixa_memoria(url, LIMITE_DOWNLOAD)
    h5 = hashlib.md5(dados).hexdigest()
    if len(dados) != tam:
        raise SystemExit("recusado: vieram %d bytes, o cabeçalho dizia %d" % (len(dados), tam))
    etag_ok = bool(re.fullmatch(r"[0-9a-f]{32}", etag)) and etag == h5
    if re.fullmatch(r"[0-9a-f]{32}", etag) and not etag_ok:
        raise SystemExit("recusado: md5 %s diferente do ETag %s" % (h5, etag))
    destino = item["destino"]
    provisorio = destino
    if item["tipo"] == "trilha":
        provisorio = destino.replace("_BPMbpm.mp3", "_baixando.mp3")
    if os.path.exists(provisorio) or (item["tipo"] != "trilha" and os.path.exists(destino)):
        raise SystemExit("recusado: o destino já existe e não confere com o registro: %s" % provisorio)
    escrita.grava_bytes(provisorio, dados, cria_pasta=True)
    if escrita.md5(provisorio) != h5:
        os.remove(provisorio)  # só o arquivo que esta chamada acabou de gravar
        raise SystemExit("recusado: o arquivo gravado não confere com o que veio do servidor")
    final = provisorio
    bpm = None
    if item["tipo"] == "trilha":
        import mede_trilha
        med = mede_trilha.mede(provisorio)
        bpm = med["bpm"]
        final = destino.replace("_BPMbpm.mp3", "_%dbpm.mp3" % int(round(bpm)))
        escrita.move(provisorio, final)
    st = os.stat(final)
    agora = datetime.datetime.now().astimezone()
    item_reg = {
        "chave": chave, "tipo": item["tipo"], "categoria": item.get("categoria"), "titulo": item["titulo"],
        "autor": item.get("autor"), "fonte": item["fonte"], "fonteId": item["fonteId"], "arquivo": final.replace("\\", "/"),
        "url": url, "pagina": item["pagina"], "data": agora.strftime("%Y-%m-%d"), "hora": agora.strftime("%H:%M:%S"),
        "licenca": item["licenca"], "licencaUrl": item["licencaUrl"], "md5": h5, "tamanho": st.st_size,
        "st_nlink": st.st_nlink, "etag": etag, "md5IgualEtag": etag_ok, "ultimaModificacao": h.get("last-modified"),
        "nomeNoServidor": (re.search(r'filename="([^"]+)"', h.get("content-disposition", "")) or [None, None])[1],
        "motivo": item["motivo"], "livreAntesMb": round(livre), "livreDepoisMb": round(escrita.livre_mb()),
    }
    if bpm is not None:
        item_reg["bpmMedido"] = bpm
    registra(item_reg)
    print("baixado: %s (%d bytes, md5 %s, ETag confere: %s)" % (final, st.st_size, h5, "sim" if etag_ok else "não"))
    return 0


def lista():
    esc = le_json(ESCOLHIDOS, {"itens": []})
    reg = {i["chave"]: i for i in le_json(BAIXADOS, {"itens": []})["itens"]}
    for i in esc["itens"]:
        r = reg.get(i["chave"])
        print("%-34s %-8s %-12s %s" % (i["chave"], i["tipo"], ("baixado %d B" % r["tamanho"]) if r else "pendente",
                                       i["titulo"]))
    return 0


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    ap = argparse.ArgumentParser(prog="baixa.py", description="Baixa um arquivo escolhido, com as travas do K08.")
    ap.add_argument("chave", nargs="?")
    ap.add_argument("--cabecalho", action="store_true", help="só lê o cabeçalho, sem baixar")
    ap.add_argument("--lista", action="store_true")
    a = ap.parse_args(argv)
    if a.lista:
        return lista()
    if not a.chave:
        ap.print_help()
        return 2
    return principal(a.chave, a.cabecalho)


if __name__ == "__main__":
    sys.exit(main())
