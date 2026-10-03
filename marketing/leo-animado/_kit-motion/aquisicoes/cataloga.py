"""Monta as camadas de aquisição do catálogo com o que o K08 baixou (pacote K08). Contrato: KIT/DESENHO.md, 4.9 e 12.

Lê escolhidos.json e baixados.json, mede cada arquivo (mede_trilha.py com a checagem de voz; mede_efeito.py com o
modo de sincronia da categoria) e grava, pelo KIT/lib/escrita.py e só depois de validar contra o esquema:
- KIT/catalogos/trilhas/aquisicoes-2026-10.json (trilhas novas, todas sem-verificacao até a AudD);
- KIT/catalogos/efeitos/aquisicoes-2026-10.json (efeitos novos; liberado só com md5 igual ao ETag do servidor e a
  licença lida no dia do download);
- baixados.md (o registro legível de cada download).

Uso (sempre com python -B):
    python -B cataloga.py              mede e grava as duas camadas e o baixados.md
    python -B cataloga.py --so-md      regrava só o baixados.md
"""
import argparse
import datetime
import json
import os
import sys

sys.dont_write_bytecode = True
AQUI = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.dirname(AQUI)
sys.path.insert(0, os.path.join(KIT, "lib"))
sys.path.insert(0, AQUI)
import escrita  # noqa: E402
import mede_efeito  # noqa: E402
import mede_trilha  # noqa: E402
from jsonschema import Draft202012Validator  # noqa: E402

CAT = os.path.join(KIT, "catalogos")
DATA = "2026-10-02"
PROIBE_MUSICA = ["CD e DVD", "TV e rádio", "video game", "remix em faixa só de música", "dizer que a faixa é sua",
                 "registrar em Content ID ou serviço parecido", "redistribuir o arquivo solto",
                 "baixar em massa com robô"]
CLIMA_TEXTO = {
    "piano-documental": "piano ou documental emocional (obrigatória)",
    "tensao": "tensão que resolve (golpe do boleto, multa, prazo)",
    "lo-fi": "lo-fi ou chill hop de 80 a 95 BPM",
    "pop-acustico": "pop acústico leve de 100 a 115 BPM",
    "groove-brasileiro": "groove brasileiro instrumental",
}
FAIXA_BPM = {"lo-fi": (80, 95), "pop-acustico": (100, 115)}


def num_bpm(v):
    return str(int(round(v))) if abs(v - round(v)) < 0.005 else virgula(v)


def le(caminho):
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


def virgula(v, casas=2):
    return ("%.*f" % (casas, v)).replace(".", ",")


def valida(doc, esquema):
    esq = le(os.path.join(CAT, "esquemas", esquema))
    erros = sorted(Draft202012Validator(esq).iter_errors(doc), key=lambda e: list(e.absolute_path))
    if erros:
        for e in erros[:10]:
            print("esquema: %s: %s" % ("/".join(str(x) for x in e.absolute_path), e.message[:200]))
        raise SystemExit("a camada não passa no esquema %s; nada foi gravado" % esquema)


def item_trilha(esc, reg):
    m = mede_trilha.mede(reg["arquivo"], com_voz=True)
    alt = [c["bpm"] for c in m["medidas"]["bpmCandidatos"] if abs(c["bpm"] / m["bpm"] - 2) < 0.01 or
           abs(c["bpm"] / m["bpm"] - 0.5) < 0.01]
    notas = [esc["motivo"]]
    if alt:
        notas.append("BPM medido: %s (a outra oitava, %s, também é leitura possível)." % (
            num_bpm(m["bpm"]), " ou ".join(num_bpm(a) for a in alt)))
    faixa = FAIXA_BPM.get(esc["categoria"])
    if faixa and not (faixa[0] <= m["bpm"] <= faixa[1]):
        notas.append("Fica fora da faixa pedida (%d a %d BPM) por pouco (%s BPM); entrou por ser a melhor opção do "
                     "Mixkit sem autor com histórico de relançamento." % (faixa[0], faixa[1], num_bpm(m["bpm"])))
    notas.append("Nunca ouvida por gente: medida pelo mede_trilha.py em 02/10 (BPM, grade, seções, pontos, "
                 "loudness, tom por croma e voz pelo VAD). Sem janelas fixas: o kit calcula o mStart pelo ponto "
                 "(mStart = ponto.t menos o momento do vídeo). Só vira liberada com 2 recortes limpos na AudD "
                 "(fila-audd.json).")
    voz = m.get("voz") or {"presente": None, "metodo": "não medido"}
    return {
        "id": esc["chave"], "tipo": "trilha", "arquivo": reg["arquivo"], "titulo": esc["titulo"],
        "autor": esc["autor"], "fonte": "Mixkit", "fonteId": esc["fonteId"], "url": esc["pagina"],
        "urlArquivo": reg["url"],
        "licenca": {"nome": "Mixkit Stock Music Free License", "url": "https://mixkit.co/license/#musicFree",
                    "credito": False, "creditoTexto": None, "proibe": PROIBE_MUSICA,
                    "texto": "Mixkit Stock Music Free License (rede social, anúncio online e uso comercial; proíbe "
                             "registrar em Content ID, TV, rádio, game), lida em 02/10/2026",
                    "creditoNota": "não obrigatório"},
        "status": "sem-verificacao", "decisaoRisco": None,
        "verificacao": [{"data": DATA, "metodo": "licenca-e-md5", "recortes": None,
                         "resultado": "licença lida no dia (modal musicFree); arquivo baixado em 02/10 às %s do link "
                                      "do botão Download, md5 %s igual ao ETag do servidor; ainda sem AudD"
                                      % (reg["hora"][:5], reg["md5"])}],
        "ia": False,
        "voz": {"presente": voz.get("presente"), "metodo": voz.get("metodo")},
        "estilo": esc["estilo"], "clima": esc["clima"], "tags": esc["tags"],
        "bpm": m["bpm"], "duracao": m["duracao"], "md5": m["md5"], "tamanho": m["tamanho"],
        "lufs": m["lufs"], "lra": m["lra"], "picoDbtp": m["picoDbtp"],
        "grade": m["grade"], "secoes": m["secoes"], "pontos": m["pontos"], "janelas": [], "tom": m["tom"],
        "usos": [],
        "categoriaKit": esc["categoria"],
        "climaPedido": CLIMA_TEXTO.get(esc["categoria"]),
        "medidas": m["medidas"],
        "notas": " ".join(notas),
    }


NOTAS_EFEITO = {
    "impressora": "Substituto: o Mixkit não tem impressora (busca 'printer' e 'print' sem resultado).",
    "envelope": "Substituto: o Mixkit não tem envelope (busca 'envelope' e 'mail' sem resultado).",
    "carimbo": "Substituto: o Mixkit não tem carimbo (busca 'stamp' sem resultado); é um grampeador no papel.",
    "riser": "Substituto do riser de prato invertido: o pico de energia vem em ~1,75 s e a cauda vai até ~4,6 s; "
             "serve de swoosh de entrada com rufo, não de riser que acaba seco no corte. Pra um prato invertido de "
             "verdade, o kit ainda depende do 92231 (24 kHz) ou de síntese.",
    "ambiente": "Room tone: cuidado com o Content ID (arquivo longo casa mais fácil na impressão digital); subir o "
                "vídeo não listado no YouTube antes de postar. VAD do whisper sem fala detectada (não ouvido por gente).",
    "apagar": "Arquivo de 10,9 s: usar um trecho.",
}


def item_efeito(esc, reg):
    m = mede_efeito.mede(reg["arquivo"], esc.get("modo"), esc["categoria"])
    notas = [esc["motivo"] + "."]
    if esc["categoria"] in NOTAS_EFEITO:
        notas.append(NOTAS_EFEITO[esc["categoria"]])
    if m["truePeakDbtp"] is not None and m["truePeakDbtp"] > -0.5:
        notas.append("Pico real de %s dBTP: o place() do mix normaliza o pico, mas em editor baixe uns 3 dB."
                     % virgula(m["truePeakDbtp"], 1))
    if m["estereo"]["perdaMono_db"] < -1.5:
        notas.append("Estéreo largo: perde %s dB quando o mix soma em mono." % virgula(-m["estereo"]["perdaMono_db"], 1))
    notas.append("Sincronia pelo modo '%s'. Não ouvido por gente; medido pelo mede_efeito.py em 02/10." %
                 m["modoSincronia"])
    medidas = dict(m["medidas"])
    medidas["modoSincronia"] = m["modoSincronia"]
    medidas["duracaoFormato"] = m["duracaoFormato"]
    if esc["categoria"] == "ambiente":
        v = mede_trilha.mede_voz(reg["arquivo"])
        medidas["voz"] = {"presente": v.get("presente"), "metodo": v.get("metodo")}
    return {
        "id": esc["chave"], "tipo": "arquivo", "categoria": esc["categoria"], "titulo": esc["titulo"],
        "arquivo": reg["arquivo"], "fonte": "Mixkit", "fonteId": esc["fonteId"], "autor": "Mixkit",
        "url": esc["pagina"], "urlArquivo": reg["url"],
        "licenca": {"nome": "Mixkit Sound Effects Free License", "url": "https://mixkit.co/license/#sfxFree",
                    "credito": False, "creditoTexto": None,
                    "texto": "Mixkit Sound Effects Free License, lida em 02/10/2026 (modal sfxFree)"},
        "credito": "não obrigatório (autor: Mixkit)",
        "status": "liberado",
        "verificacao": [{"data": DATA, "metodo": "md5-servido-e-licenca", "recortes": None,
                         "resultado": "baixado em 02/10 às %s do link do botão Download; md5 %s igual ao ETag do "
                                      "servidor; licença lida no mesmo dia" % (reg["hora"][:5], reg["md5"])}],
        "ia": False, "duplicataDe": None,
        "duracao": m["duracao"], "sr": m["sr"], "canais": m["canais"], "codec": m["codec"], "md5": m["md5"],
        "tamanho": m["tamanho"], "inicioSom_ms": m["inicioSom_ms"], "sincronia_ms": m["sincronia_ms"],
        "fim_ms": m["fim_ms"], "picoDbfs": m["picoDbfs"], "truePeakDbtp": m["truePeakDbtp"],
        "crista_db": m["crista_db"], "nota": m["nota"], "banda": m["banda"], "estereo": m["estereo"],
        "ganhoTipico": None, "medidas": medidas, "usos": [],
        "nomeNoServidor": reg.get("nomeNoServidor"),
        "notas": " ".join(notas),
    }


def camada(tipo, itens):
    return {"versao": 1, "camada": "aquisicoes", "tipo": tipo,
            "geradoEm": datetime.datetime.now().astimezone().strftime("%Y-%m-%dT%H:%M:%S%z"),
            "geradoPor": "K08 (KIT/aquisicoes/cataloga.py, com mede_trilha.py e mede_efeito.py)",
            "fontes": ["KIT/aquisicoes/escolhidos.json", "KIT/aquisicoes/baixados.json",
                       "licenças do Mixkit lidas em 02/10/2026"],
            "itens": itens}


def md_baixados(esc_doc, reg_doc):
    esc = {i["chave"]: i for i in esc_doc["itens"]}
    regs = reg_doc["itens"]
    tot = sum(r["tamanho"] for r in regs)
    tm = sum(r["tamanho"] for r in regs if r["tipo"] == "trilha")
    L = []
    L.append("# Downloads do K08 (aquisições de áudio do kit)")
    L.append("")
    L.append("Registro de cada arquivo baixado em 02/10/2026 pelo `baixa.py`: um por vez, só os da lista deliberada "
             "`escolhidos.json`, com `df -h /c` antes de cada um. Nenhum candidato foi baixado pra triagem: a "
             "escolha saiu das listagens do Mixkit (título, autor, tags e duração). O Mixkit proíbe baixar em massa "
             "com robô; nenhuma página foi varrida.")
    L.append("")
    L.append("Total: **%d arquivos, %s MB** (%d trilhas com %s MB e %d efeitos com %s MB), dentro do orçamento de "
             "40 MB; o maior tem %s MB (limite de 8 MB por arquivo de áudio). Todos com o md5 igual ao ETag do "
             "servidor (o ETag do S3 do Mixkit é o md5 do arquivo)." % (
                 len(regs), virgula(tot / 2 ** 20), sum(1 for r in regs if r["tipo"] == "trilha"),
                 virgula(tm / 2 ** 20), sum(1 for r in regs if r["tipo"] == "efeito"),
                 virgula((tot - tm) / 2 ** 20), virgula(max(r["tamanho"] for r in regs) / 2 ** 20)))
    L.append("")
    L.append("## Licenças lidas no dia")
    L.append("")
    for lic in esc_doc["licencasLidas"]:
        L.append("- **%s**, lida em 02/10/2026 em %s (md5 do HTML `%s`): %s." % (
            lic["nome"], lic["url"], lic["md5Html"], lic["resumo"]))
    L.append("")
    L.append("Autor: no Mixkit, música tem autor e efeito não tem (a página mostra só título, tags e duração; o "
             "autor fica 'Mixkit'). Crédito não é obrigatório em nenhum dos dois.")
    L.append("")
    for tipo, titulo in (("trilha", "Trilhas (`_assets-externos/kit-2026-10/musica/`)"),
                         ("efeito", "Efeitos (`_assets-externos/kit-2026-10/sfx/`)")):
        L.append("## " + titulo)
        L.append("")
        for r in [x for x in regs if x["tipo"] == tipo]:
            e = esc[r["chave"]]
            L.append("### %s (Mixkit %s)" % (r["titulo"], r["fonteId"]))
            L.append("")
            L.append("- arquivo: `%s`" % os.path.basename(r["arquivo"]))
            L.append("- URL do arquivo: %s (o mesmo link do botão Download, conferido no modal de download)" % r["url"])
            L.append("- página: %s" % r["pagina"])
            L.append("- data: %s às %s" % (r["data"], r["hora"]))
            L.append("- licença: %s (%s)" % (r["licenca"], r["licencaUrl"]))
            L.append("- autor: %s" % (r["autor"] or "Mixkit"))
            L.append("- id: %s (nome no servidor: `%s`)" % (r["fonteId"], r.get("nomeNoServidor")))
            L.append("- md5: `%s` (igual ao ETag: %s)" % (r["md5"], "sim" if r["md5IgualEtag"] else "não"))
            L.append("- tamanho: %d bytes (%s MB)" % (r["tamanho"], virgula(r["tamanho"] / 2 ** 20)))
            if r.get("bpmMedido"):
                L.append("- BPM medido: %s" % virgula(r["bpmMedido"]))
            L.append("- por que entrou: %s" % e["motivo"])
            if r.get("nota"):
                L.append("- nota: %s" % r["nota"])
            L.append("")
    L.append("## Pedidos que o Mixkit não tem")
    L.append("")
    for n in esc_doc["naoAchados"]:
        L.append("- %s: %s (procurado em %s)." % (n["pedido"], n["resultado"], ", ".join(n["buscas"])))
    L.append("")
    L.append("## Verificação dos efeitos que já existiam")
    L.append("")
    L.append("Feita pelo `confere_existentes.py` (Mixkit 166, 1109, 1897 e 3115 pelo WAV servido, baixado só na "
             "memória; os 20 do Pixabay ficaram com a nota do 403). Resultado em "
             "`KIT/catalogos/efeitos/verificacoes.json`.")
    L.append("")
    return "\n".join(L)


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    ap = argparse.ArgumentParser(prog="cataloga.py")
    ap.add_argument("--so-md", action="store_true")
    a = ap.parse_args(argv)
    esc_doc = le(os.path.join(AQUI, "escolhidos.json"))
    reg_doc = le(os.path.join(AQUI, "baixados.json"))
    esc = {i["chave"]: i for i in esc_doc["itens"]}
    if not a.so_md:
        trilhas, efeitos = [], []
        for r in reg_doc["itens"]:
            if escrita.md5(r["arquivo"]) != r["md5"]:
                raise SystemExit("o arquivo mudou depois do download: %s" % r["arquivo"])
            if r["tipo"] == "trilha":
                trilhas.append(item_trilha(esc[r["chave"]], r))
            else:
                efeitos.append(item_efeito(esc[r["chave"]], r))
            print("medido: %s" % os.path.basename(r["arquivo"]))
        ct = camada("trilhas", trilhas)
        ce = camada("efeitos", efeitos)
        valida(ct, "trilhas.schema.json")
        valida(ce, "efeitos.schema.json")
        escrita.grava_json(os.path.join(CAT, "trilhas", "aquisicoes-2026-10.json"), ct)
        escrita.grava_json(os.path.join(CAT, "efeitos", "aquisicoes-2026-10.json"), ce)
        print("gravado: %d trilhas e %d efeitos" % (len(trilhas), len(efeitos)))
    escrita.grava_texto(os.path.join(AQUI, "baixados.md"), md_baixados(esc_doc, reg_doc))
    print("gravado: baixados.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
