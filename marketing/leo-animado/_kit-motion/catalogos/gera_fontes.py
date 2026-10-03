"""Gera o FONTES consolidado do kit de motion do Legalizaí a partir dos catálogos mesclados (pacote K01).

Uso: python -B gera_fontes.py --saida <arquivo.md>

O arquivo final do kit é KIT/FONTES.md (dono K11, que roda este gerador). O texto traz, por catálogo, status,
licença, link e crédito; os textos de legenda prontos (só licenca.creditoLegenda, nunca o licenca.credito, que pode
citar título com marca; crédito que cita marca trava a geração); as trilhas liberadas, aceitas com risco (com a
decisaoRisco: quem, quando e em que peça vale), sem verificação e reprovadas (a Epidemic com a decisão de 02/10 e os
finais a trocar, inclusive os da vinheta O Check, com som de origem não confirmada); as decisões de risco pendentes
do Pedro; e as pendências que só o Pedro decide (a da AudD sai da fila, KIT/aquisicoes/fila-audd.json). A nota do
app (notaApp) das telas não entra aqui.
"""
import argparse
import datetime
import json
import os
import re
import sys

sys.dont_write_bytecode = True
AQUI = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.dirname(AQUI)
for p in (AQUI, os.path.join(KIT, "lib")):
    if p not in sys.path:
        sys.path.insert(0, p)
import catalogo  # noqa: E402
import escrita  # noqa: E402

FILA_AUDD = os.path.join(KIT, "aquisicoes", "fila-audd.json")
COMANDO = '"$PY" -B "$KIT/catalogos/gera_fontes.py" --saida "$KIT/FONTES.md"'

PENDENCIAS_FIXAS = [
    "Token grátis da AudD na conta do Pedro (300 consultas no cadastro, sem cartão): fecha a fila num dia e documenta "
    "o uso.",
    "Crédito CC BY que falta na legenda do reel de 14/10: usar o texto aprovado da seção 'Textos de legenda prontos'.",
    "Licença de empresa do Remotion (exigida acima de 3 pessoas).",
    "Cor da pílula LINK DA BIO: coral-600 #DD4E27 (regra da marca e padrão das peças novas) ou coral-500 #F2643C (a "
    "do V4 do guia, que só a cena do guia mantém).",
    "Tela real: as capturas dos dois conjuntos (2026-09 e 2026-10-02) são do protótipo Next.js, não do app Flutter. "
    "Quais valem como 'tela real' ou 'prévia real' depende do Pedro.",
    "Trocar o som dos finais com Epidemic ou com indício dela (lista na seção das trilhas reprovadas), ou usar a vinheta "
    "O Check muda.",
]

# Texto que nunca pode sair no FONTES (crédito com marca vai só no catálogo, no campo licenca.credito).
PROIBIDO = re.compile(r"(?i)\bapple\b")


def _cel(v):
    if v is None or v == "":
        return "-"
    return str(v).replace("|", "/").replace("\n", " ")


def _tabela(cab, linhas):
    out = ["| " + " | ".join(cab) + " |", "|" + "---|" * len(cab)]
    for ln in linhas:
        out.append("| " + " | ".join(_cel(c) for c in ln) + " |")
    return out


def _link_modelo(m):
    return m.get("urlSemMarca") or m.get("url") or m.get("arquivo")


def _decisao_curta(it):
    """Coluna 'decisão de risco': quem e quando, e onde vale; 'pendente (Pedro)'; ou '-' fora do aceito-com-risco."""
    if it.get("status") != "aceito-com-risco":
        return "-"
    d, prob = catalogo.decisao(it)
    if d is None:
        return "FALTA (%s)" % prob
    if d.get("pendente") is True:
        return "pendente (%s): fora do padrão" % d["quem"]
    nomes = [p for p in d["pecas"] if p != "*"]
    if catalogo.quem_decide(d):
        alcance = ", ".join(nomes) if nomes else "nenhuma peça nova"
        extra = "; '*' não vale pra peça nova" if "*" in d["pecas"] else ""
    else:
        # decisão de agente: provisória; em peça nova não vale (só na do guia, se ela estiver na lista ou com '*')
        guia = catalogo.PECA_GUIA in nomes or "*" in d["pecas"]
        alcance = catalogo.PECA_GUIA if guia else "nenhuma peça nova"
        extra = "; decisão de agente, provisória: em peça nova, confirmar com o Pedro"
    return "%s, %s; vale em %s%s" % (d["quem"], catalogo.data_br(d["quando"]), alcance, extra)


def _credito_legenda(m):
    cl = (m.get("licenca") or {}).get("creditoLegenda")
    if cl:
        return "%s (%s, %s)" % (cl["trecho"], cl["fonte"], cl["licenca"])
    d, _p = catalogo.decisao(m)
    if d and d.get("pendente") is True and catalogo.CC_BY.search((m.get("licenca") or {}).get("nome") or ""):
        return "fora do padrão: o crédito exigido cita marca (decisão do Pedro pendente)"
    obrig = (m.get("licenca") or {}).get("creditoObrigatorio")
    return "dispensa" if obrig is False else "não verificado"


def _pendencia_audd(trilhas):
    """A pendência da AudD com as datas da fila (dataProvavel, senão dataPrevista) e o estado do catálogo."""
    sem = [t for t in trilhas if t.get("tipo") == "trilha" and t["status"] == "sem-verificacao"]
    lib = [t for t in trilhas if t.get("tipo") == "trilha" and t["status"] == "liberado"]
    estado = ("Até lá as %d trilhas sem verificação ficam fora das peças, e o kit só tem %d trilhas liberadas (%s)."
              % (len(sem), len(lib), ", ".join(t["titulo"] for t in lib)))
    try:
        with open(FILA_AUDD, encoding="utf-8") as f:
            fila = json.load(f)
    except (OSError, ValueError) as e:
        return "AudD: a fila (%s) não deu pra ler (%s). %s" % (FILA_AUDD, e, estado)
    pend = [c for c in fila.get("consultas") or [] if c.get("estado") == "pendente"]
    if not pend:
        return "AudD: nenhuma consulta pendente na fila (KIT/aquisicoes/fila-audd.json). %s" % estado
    por_dia = {}
    for c in pend:
        dia = c.get("dataProvavel") or c.get("dataPrevista") or "sem data"
        por_dia[dia] = por_dia.get(dia, 0) + 1
    dias = ", ".join("%d em %s" % (n, catalogo.data_br(d)) for d, n in sorted(por_dia.items()))
    return ("AudD: %d consultas pendentes na fila (KIT/aquisicoes/fila-audd.json): %s (datas prováveis da fila, com a "
            "cota anônima de %s por dia; cada dia sem rodada empurra o resto um dia). Lembrete ou agendamento "
            "combinado com o Pedro. %s" % (len(pend), dias, fila.get("cotaDiaria", 10), estado))


def gera():
    tr = catalogo.carrega("trilhas")["itens"]
    ef = catalogo.carrega("efeitos")["itens"]
    mo = catalogo.carrega("modelos")
    te = catalogo.carrega("telas")["itens"]
    bib = catalogo.carrega("biblioteca2d")
    ass = catalogo.carrega("assets")
    idx_mod = {m["id"]: m for m in mo["itens"]}
    marca = catalogo.marca()
    hoje = datetime.datetime.now().astimezone().strftime("%d/%m/%Y %H:%M")
    L = ["# Fontes e licenças do kit de motion", "",
         "> **Arquivo gerado: não edite à mão.** Ele sai dos catálogos do kit (`KIT/catalogos/`). Pra atualizar depois "
         "de mudar um catálogo, rode no Git Bash, com `PY` e `KIT` como no README: `%s`." % COMANDO, "",
         "Gerado por `KIT/catalogos/gera_fontes.py` em %s, a partir dos catálogos mesclados (base, aquisições e "
         "sobreposições)." % hoje, "",
         "Regra do crédito: na legenda do post vai só o texto de `licenca.creditoLegenda` (sem marca nenhuma). O texto "
         "da fonte (`licenca.credito`) fica só no catálogo e nunca vai pra legenda.", "",
         "Regra do status: `aceito-com-risco` só vale com `decisaoRisco` (quem decidiu, quando e em que peça vale); "
         "decisão pendente do Pedro deixa o item fora do padrão (o kit recusa). Trilha sem verificação nunca entra.", ""]

    # Legendas prontas
    L += ["## Textos de legenda prontos", ""]
    guia = catalogo.creditos(["glb-video-iphone", "glb-video-watch"], idx_mod)
    L += ["- Reel da guia (14/10), celular e relógio: **%s**" % guia]
    for m in mo["itens"]:
        if (m.get("licenca") or {}).get("creditoLegenda") and m["id"] not in ("glb-video-iphone", "glb-video-watch"):
            t = catalogo.creditos([m["id"]], idx_mod)
            extra = (" (%s)" % m["notaLicenca"].rstrip(". ")) if m.get("notaLicenca") else ""
            L.append("- `%s`, se aparecer sozinho: %s%s" % (m["id"], t, extra))
    L += ["", "Pra juntar vários modelos na mesma peça: `python -B KIT/catalogos/catalogo.py creditos <id> <id> ...` "
              "(agrupa por fonte e licença, na ordem da cena, e fecha com ', modificado' ou ', modificados').", ""]
    sem_texto = [m["id"] for m in mo["itens"] if _credito_legenda(m).startswith("fora do padrão")]
    if sem_texto:
        L += ["Sem texto pronto, fora do padrão até o Pedro decidir (o crédito exigido pela licença cita marca): %s."
              % ", ".join("`%s`" % i for i in sem_texto), ""]

    # Trilhas
    L += ["## Trilhas", ""]
    trilhas = [t for t in tr if t.get("tipo") == "trilha"]
    lib = [t for t in trilhas if t["status"] == "liberado"]
    L += ["### Liberadas (%d)" % len(lib), ""]
    linhas = []
    for t in lib:
        jan = "; ".join("mStart %s, ponto %s, ganho %s dB" % (j["mStart"], j["ponto"], j["ganhoDb"])
                        for j in t.get("janelas") or [])
        linhas.append([t["id"], t["titulo"], t.get("autor"), t["licenca"]["nome"], t.get("url"),
                       t["licenca"].get("creditoTexto") or "não obrigatório", jan])
    L += _tabela(["id", "título", "autor", "licença", "link", "crédito", "janela medida"], linhas) + [""]
    risco = [t for t in trilhas if t["status"] == "aceito-com-risco"]
    L += ["### Aceitas com risco (%d)" % len(risco), "",
          "Só valem nas peças da decisão (o kit recusa em outra peça; texto na cena não libera).", ""]
    for t in risco:
        d, prob = catalogo.decisao(t)
        L.append("- `%s` (%s, %s): %s. Usos: %s." % (
            t["id"], t["titulo"], t["licenca"]["nome"], catalogo.resumo_decisao(d) if d else "FALTA decisão (%s)" % prob,
            ", ".join("%s %s" % (u["peca"], u.get("versao", "")) for u in t.get("usos") or []) or "nenhum"))
        L.append("  Antes de postar: subir o vídeo não listado no YouTube e guardar print da licença e do card com a "
                 "data.")
    sem = [t for t in trilhas if t["status"] == "sem-verificacao"]
    L += ["", "### Sem verificação (%d): dependem da AudD, não entram em peça" % len(sem), ""]
    linhas = [[t["id"], t["titulo"], t.get("autor"), t["licenca"]["nome"], t.get("url"),
               t["licenca"].get("creditoTexto") or "não obrigatório"] for t in sem]
    L += _tabela(["id", "título", "autor", "licença", "link", "crédito sugerido"], linhas)
    L += ["", "Só viram liberado com 2 recortes limpos na AudD; correspondência com terceiro reprova.", ""]
    rep = [t for t in trilhas if t["status"] == "reprovado"]
    epid = [t for t in rep if t["id"].startswith("epidemic-")]
    outras = [t for t in rep if not t["id"].startswith("epidemic-")]
    L += ["### Reprovadas (%d)" % len(rep), ""]
    for t in outras:
        motivo = (t.get("verificacao") or [{}])[0].get("resultado", "")
        L.append("- `%s` (%s, %s): %s." % (t["id"], t["titulo"], t["fonte"], motivo))
    if epid:
        L += ["", "Epidemic Sound, %d faixas: reprovadas por decisão do Pedro em 02/10/2026 (plano gratuito; não cobre "
                  "conteúdo de marca). Não entram em peça." % len(epid), ""]
        for t in epid:
            L.append("- `%s`: %s, %s" % (t["id"], t["titulo"], t.get("autor")))
    finais = [(u.get("arquivoFinal"), t["titulo"]) for t in epid for u in t.get("usos") or [] if u.get("alerta")]
    # assets cujo próprio som está reprovado (a vinheta O Check: indícios de Epidemic); os assets usados nos finais da
    # Palmy Sway já entram pela trilha acima
    finais += [(u.get("arquivoFinal"), "som com indícios de Epidemic, origem não confirmada: `%s`" % a["id"])
               for a in ass["itens"] if ((a.get("partes") or {}).get("som") or {}).get("status") == "reprovado"
               for u in a.get("usos") or [] if u.get("alerta")]
    if finais:
        L += ["", "Finais já entregues com trilha da Epidemic ou com indício dela (%d): trocar o som antes de postar "
                  "(ou, na vinheta, usar muda); decisão do Pedro pendente." % len(finais), ""]
        for arq, oque in finais:
            L.append("- `%s` (%s)" % (arq, oque))
    prev = [t for t in tr if t.get("tipo") == "previa"]
    L += ["", "### Prévias de audição (%d)" % len(prev), "",
          "Só pra escolher de ouvido: têm a narração da peça de 14/10 e nunca vão como trilha de cena (o kit recusa "
          "prévia em trilha.id; o `kit.py trilhas` lista só o tipo trilha).", ""]
    L += _tabela(["id", "trilha de origem", "status", "decisão de risco"],
                 [[t["id"], t["previaDe"], t["status"], _decisao_curta(t)] for t in prev]) + [""]

    # Efeitos
    L += ["## Efeitos", ""]
    arqs = [e for e in ef if e["tipo"] == "arquivo"]
    linhas = [[e["id"], e["categoria"], e["status"], e["licenca"]["nome"], e.get("url"), e.get("credito"),
               e.get("duplicataDe")] for e in arqs]
    L += ["### Arquivos (%d)" % len(arqs), ""]
    L += _tabela(["id", "categoria", "status", "licença", "link", "crédito", "duplicata de"], linhas) + [""]
    sint = [e for e in ef if e["tipo"] == "sintetizado"]
    L += ["### Sintetizados (%d): código próprio, sem licença de terceiro, sem crédito" % len(sint), ""]
    L += _tabela(["id", "status", "módulo", "função"],
                 [[e["id"], e["status"], os.path.basename(e["sintese"]["modulo"]), e["sintese"]["funcao"]]
                  for e in sint]) + [""]
    rec = [e for e in ef if e["tipo"] == "receita"]
    L += ["### Receitas (%d)" % len(rec), ""]
    L += _tabela(["id", "status", "arquivo", "nota"],
                 [[e["id"], e["status"], e.get("arquivo"), e.get("alerta")] for e in rec]) + [""]

    # Modelos
    L += ["## Modelos 3D (%d)" % len(mo["itens"]), ""]
    entra = {m["id"]: catalogo.entra_no_render(m) for m in mo["itens"]}
    cont = {}
    for e, _mot in entra.values():
        cont[e] = cont.get(e, 0) + 1
    L += ["Entram numa peça: %d sim, %d com aviso (aceitos com risco fora das peças da decisão: confirmar com o Pedro "
          "antes de postar) e %d não (.blend, cena inteira, reprovado ou decisão pendente do Pedro). O GLB da biblioteca "
          "entra no public-kit por hardlink só quando a peça usa (`3d/biblioteca/<id>.glb`, pelo `kit.py modelos`, "
          "`props`, `stills` e `render`); o celular e o relógio do guia ficam fixos. Prova de render de cada um: "
          "`KIT/provas/modelos/render/lote-*.jpg` (campo `provaRender` do catálogo)."
          % (cont.get("sim", 0), cont.get("com aviso", 0), cont.get("não", 0)), ""]

    def _render_curto(m):
        r = m.get("render") if isinstance(m.get("render"), dict) else {}
        e, mot = entra[m["id"]]
        if e == "não":
            return "não: %s" % mot.split(":")[0]
        extra = ("; sHeroi %s" % str(r["sHeroi"]).replace(".", ",")) if r.get("sHeroi") else ""
        return "%s (%s%s)" % (e, r.get("publicKit") or ("procedural: %s" % r.get("tipoObjeto")), extra)

    linhas = [[m["id"], m["tipo"], m["status"], m["licenca"]["nome"], _link_modelo(m), _credito_legenda(m),
               _decisao_curta(m), _render_curto(m)] for m in mo["itens"]]
    L += _tabela(["id", "tipo", "status", "licença", "link", "crédito na legenda", "decisão de risco",
                  "entra no render"], linhas) + [""]
    for m in mo["itens"]:
        d, _p = catalogo.decisao(m)
        if m.get("notaLicenca") and not (d and d.get("pendente") is True):
            L += ["Atenção: `%s`: %s." % (m["id"], m["notaLicenca"].rstrip(". ")), ""]

    # Decisões de risco pendentes (todos os catálogos)
    pend = []
    for tipo in catalogo.TIPOS:
        for it in catalogo.carrega(tipo)["itens"]:
            d, _p = catalogo.decisao(it)
            if d and d.get("pendente") is True:
                pend.append((tipo, it["id"], d))
    L += ["## Decisões de risco pendentes do Pedro (%d)" % len(pend), "",
          "Item aceito com risco com a decisão pendente fica fora do padrão: o kit recusa até a decisão entrar no "
          "catálogo (decisaoRisco numa sobreposição `revisao-*.json` da pasta do tipo, com quem, quando e as peças).", ""]
    for tipo, i, d in pend:
        L.append("- `%s` (%s): %s" % (i, tipo, d.get("pergunta") or d["texto"]))
    L.append("")

    # Telas
    L += ["## Telas do app (%d)" % len(te), "",
          "Licença própria (Legalizaí). As capturas dos dois conjuntos são do protótipo Next.js, não do app Flutter.",
          "Peça de MEI só usa captura com `servePecaMei` true (o kit recusa as outras, F063); captura reprovada nunca "
          "entra; aceita com risco, só com os cortes do item.", ""]
    for conj in ("2026-09", "2026-10-02"):
        its = [t for t in te if t.get("conjunto") == conj and t["tipo"] == "captura"]
        cont = {}
        for t in its:
            cont[t["status"]] = cont.get(t["status"], 0) + 1
        L.append("- conjunto %s: %d capturas (%s)" % (conj, len(its), ", ".join("%s %d" % kv
                                                                                 for kv in sorted(cont.items()))))
    erro404 = [t["id"] for t in te if any("404" in a for a in t.get("avisos") or [])]
    if erro404:
        L.append("- capturas que são a página de erro 404 do servidor (a rota foi apagada do protótipo @ab68dbc; "
                 "recapturar dá o mesmo 404; ficam reprovadas): %s" % ", ".join(erro404))
    L.append("")
    linhas = [[t["id"], t.get("conjunto"), t["tipo"], t["status"],
               {True: "sim", False: "não"}.get(t.get("servePecaMei"), "-"), "própria", t.get("arquivo")] for t in te]
    L += _tabela(["id", "conjunto", "tipo", "status", "serve MEI", "licença", "arquivo"], linhas) + [""]

    # K14
    L += ["## Biblioteca 2D e assets", ""]
    for nome, cat in (("biblioteca2d", bib), ("assets", ass)):
        if not cat["itens"]:
            L.append("- %s: catálogo vazio (o K14 ainda não rodou)." % nome)
            continue
        L += ["### %s (%d)" % (nome, len(cat["itens"])), ""]
        linhas = []
        for a in cat["itens"]:
            lic = a.get("licenca") or {}
            cl = lic.get("creditoLegenda")
            cred = ("%s (%s, %s)" % (cl["trecho"], cl["fonte"], cl["licenca"])) if cl else "-"
            partes = a.get("partes") or {}
            nota = "; ".join("%s %s" % (k, v.get("status")) for k, v in partes.items()) if partes else "-"
            linhas.append([a["id"], a.get("status"), nota, lic.get("nome"), lic.get("url") or a.get("caminho") or
                           a.get("arquivo"), cred])
        L += _tabela(["id", "status", "partes", "licença", "link", "crédito na legenda"], linhas) + [""]
    L.append("")

    # Marca
    f = marca["fonte"]
    L += ["## Marca", "",
          "- Fonte %s (pesos %d a %d): %s, `%s`." % (f["familia"], f["pesos"]["min"], f["pesos"]["max"], f["licenca"],
                                                     f["arquivo"]),
          "- Logos e símbolo: marca própria (%d arquivos em `marca.json`)." % len(marca["logos"]),
          "- LINK DA BIO padrão: %s (%s)." % (marca["componentes"]["link"]["cor"], marca["componentes"]["link"]["nota"]),
          ""]

    # Pendências
    L += ["## Pendências (decisão do Pedro)", ""]
    L += ["- " + p for p in [_pendencia_audd(tr)] + PENDENCIAS_FIXAS]
    if pend:
        L.append("- Decisões de risco pendentes: %d itens (seção 'Decisões de risco pendentes do Pedro')." % len(pend))
    L.append("")
    texto = "\n".join(L)
    for cod in (0x2012, 0x2013, 0x2014, 0x2015, 0x2212, 0x2E3A, 0x2E3B, 0xFE31, 0xFE32, 0xFE58):
        if chr(cod) in texto:
            raise SystemExit("o FONTES gerado tem travessão, meia-risca ou outro traço longo (U+%04X): conferir os "
                             "catálogos" % cod)
    if PROIBIDO.search(texto):
        raise SystemExit("o FONTES gerado cita marca de terceiro num crédito: conferir os catálogos")
    # todo crédito de legenda dos catálogos pela lista única (catalogo.marca_em: também marca colada a número ou hífen)
    for m in mo["itens"] + ass["itens"]:
        lic = m.get("licenca") if isinstance(m.get("licenca"), dict) else {}
        cl = lic.get("creditoLegenda")
        if isinstance(cl, dict):
            achou = catalogo.marca_em(" ".join(str(cl.get(k) or "") for k in ("trecho", "fonte", "licenca")))
            if achou:
                raise SystemExit("crédito de legenda com marca (%s) em %s: conferir os catálogos" % (achou, m["id"]))
    for ln in L:
        if ln.startswith("- Reel da guia") or ("se aparecer sozinho" in ln):
            achou = catalogo.marca_em(ln.split(": ", 1)[-1].split(" (o crédito")[0])
            if achou:
                raise SystemExit("texto de legenda pronto com marca (%s): %s" % (achou, ln))
    return texto


def main(argv=None):
    for s in (sys.stdout, sys.stderr):
        try:
            s.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    p = argparse.ArgumentParser(prog="gera_fontes.py", description="Gera o FONTES consolidado a partir dos catálogos.")
    p.add_argument("--saida", required=True, help="arquivo .md de saída (o KIT/FONTES.md é do K11)")
    a = p.parse_args(argv)
    texto = gera()
    escrita.grava_texto(a.saida, texto, cria_pasta=True)
    print("gravado: %s (%d linhas)" % (a.saida, texto.count("\n") + 1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
