"""Verificação independente dos efeitos que já existiam no kit (pacote K08). Contrato: KIT/DESENHO.md, seção 12.

- Mixkit 166, 1109, 1897 e 3115: baixa o WAV servido em assets.mixkit.co/active_storage/sfx/<id>/<id>.wav só na
  memória (curl pro stdout, nada gravado), compara o md5 com o do arquivo local e o do catálogo (e com o ETag do
  servidor). Igual vira liberado, com a licença lida no dia.
- Os 20 do Pixabay: a página devolve 403 a robô (curl e urllib, testado em 02/10) e este pacote não tem navegador
  de verdade; ficam sem-verificacao com a nota do 403, sem nenhuma tentativa de abrir a página.
Grava KIT/catalogos/efeitos/verificacoes.json pelo KIT/lib/escrita.py (sobreposição: só troca campos de itens que
já existem; a lista 'verificacao' é concatenada).

Uso (sempre com python -B):
    python -B confere_existentes.py
"""
import datetime
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time

sys.dont_write_bytecode = True
AQUI = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.dirname(AQUI)
sys.path.insert(0, os.path.join(KIT, "lib"))
sys.path.insert(0, os.path.join(KIT, "catalogos"))
import escrita  # noqa: E402
import catalogo  # noqa: E402

VERIF = os.path.join(KIT, "catalogos", "efeitos", "verificacoes.json")
MIXKIT = ["mixkit-166", "mixkit-1109", "mixkit-1897", "mixkit-3115"]
NOTA_403 = "página não conferida: Pixabay bloqueia robô (403); conferir no navegador ou com o Pedro"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36"


def servido(url):
    c = shutil.which("curl")
    cab = subprocess.run([c, "-sS", "-I", "--max-time", "60", "-A", UA, url], capture_output=True)
    etag = None
    for ln in cab.stdout.decode("latin-1").splitlines():
        if ln.lower().startswith("etag:"):
            etag = ln.split(":", 1)[1].strip().strip('"')
    r = subprocess.run([c, "-sS", "-f", "--max-time", "120", "--max-filesize", str(15 * 1024 * 1024), "-A", UA, url],
                       capture_output=True)
    if r.returncode != 0:
        raise RuntimeError("download em memória falhou: %s" % r.stderr.decode("utf-8", "replace")[-200:])
    return hashlib.md5(r.stdout).hexdigest(), len(r.stdout), etag


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    agora = datetime.datetime.now().astimezone()
    hoje = agora.strftime("%Y-%m-%d")
    idx = {it["id"]: it for it in catalogo.carrega("efeitos", estrito=False)["itens"]}
    doc = {"versao": 1, "camada": "verificacoes", "tipo": "efeitos",
           "descricao": "Sobreposição do K08: verificação independente dos efeitos que já existiam (md5 do WAV "
                        "servido pelo Mixkit, baixado só na memória) e a nota do 403 nos do Pixabay.",
           "itens": {}}
    if os.path.isfile(VERIF):
        with open(VERIF, encoding="utf-8") as f:
            doc = json.load(f)
    for i in MIXKIT:
        it = idx[i]
        local = escrita.md5(it["arquivo"])
        h, n, etag = servido(it["urlArquivo"])
        igual = (h == local == it["md5"])
        hora = datetime.datetime.now().astimezone().strftime("%H:%M")
        res = ("WAV servido hoje às %s em %s, baixado só na memória (%d bytes): md5 %s %s ao do arquivo local%s; "
               "licença Mixkit Sound Effects Free License lida em 02/10" % (
                   hora, it["urlArquivo"], n, h, "igual" if igual else "DIFERENTE",
                   " e ao ETag do servidor" if etag == h else ""))
        reg = doc["itens"].setdefault(i, {"verificacao": []})
        reg["verificacao"] = [e for e in reg["verificacao"] if e.get("metodo") != "md5-servido-e-licenca"]
        reg["verificacao"].append({"data": hoje, "metodo": "md5-servido-e-licenca", "recortes": None,
                                   "resultado": res})
        if igual:
            reg["status"] = "liberado"
            reg["notaVerificacao"] = "verificação independente de 02/10: md5 igual ao servido pelo Mixkit"
        else:
            reg["status"] = "sem-verificacao"
            reg["notaVerificacao"] = "o md5 local não bate com o servido em 02/10: baixar de novo antes de usar"
        print("%-12s %s %s" % (i, "liberado" if igual else "DIFERENTE", h))
        time.sleep(1.5)
    n403 = 0
    for i, it in idx.items():
        if it.get("fonte") == "Pixabay":
            reg = doc["itens"].setdefault(i, {"verificacao": []})
            if not any(e.get("metodo") == "pagina-pixabay" for e in reg["verificacao"]):
                reg["verificacao"].append({"data": hoje, "metodo": "pagina-pixabay", "recortes": None,
                                           "resultado": NOTA_403})
            reg["notaVerificacao"] = NOTA_403
            n403 += 1
    doc["atualizadoEm"] = agora.strftime("%Y-%m-%dT%H:%M:%S%z")
    escrita.grava_json(VERIF, doc)
    print("gravado: %s (%d do Mixkit conferidos, %d do Pixabay com a nota do 403)" % (VERIF, len(MIXKIT), n403))
    return 0


if __name__ == "__main__":
    sys.exit(main())
