"""Trava de conteúdo do kit: kit.py fatos (pacote K07). Contrato: KIT/DESENHO.md, seção 7.2; memórias
conteudo-so-com-base-contabil, nunca-orientar-fazer-sozinho e feedback-valores-ficticios-nitidos.

Confere o texto da peça contra o BASE/FATOS.md e o BASE/PROIBIDO.md (os dois só leitura):
- o roteiro (<peça>/roteiro.md ou, se não existir, <peça>/voz/roteiro.md; --roteiro troca), nas seções Narração e
  Batidas; sem roteiro, confere só o texto das props, com aviso;
- do props<sufixo>.json: as palavras da narração (por frase), o mostrador, o conteúdo dos objetos (na folha DAS e no
  comprovante, os dados padrão do pintor que a cena não trocou também contam como texto visível, e o valor some com
  mostraValor false; no palco de argila, o valor do cartão do imposto que a cena declara em conteudo.pecas), a
  etiqueta da pílula, os extras de tela (rótulo, retorno e o contador, sempre lido em R$: o telaKit desenha o R$ em
  qualquer formato), o link, os textos das camadas e o título da capa;
- a origem de cada tela e de cada imagem de camada 2D que é tela (src telas/<png> ou pecas/<peça>/telas/<png>): a
  receita da peça ou, sem receita, o nome do arquivo no catálogo de telas. Tela sem origem e captura reprovada dão
  erro em qualquer peça; em peça conferida como MEI, captura que não serve MEI também.
Público (F063 por padrão, rodada 4, 03/10): fatos.publico é obrigatório ("ME", "MEI" ou "todos"; "ambos" é o nome
antigo de "todos"). Vazio é erro e, como "MEI" e "todos", a peça é conferida como MEI, a regra mais restrita: só
"ME" deixa aparecer valor de guia.
Indexa os fatos pelo código (F0xx) com o status (USAR, NÃO USAR, CONFLITO), o que eles afirmam (a frase do fato
e a linha "Número:"; o "Cuidado:" fica fora, porque cita o que NÃO se diz) e o "Vale pra" (com mais de um fato pro
mesmo número, o primeiro citado é o que vale pro público da peça) e aplica as REGRAS abaixo.
Grava qc/fatos<sufixo>.json ({erros, avisos, numeros: [{texto, onde, fato}]}, mais o md5 das props, do roteiro e da
base e a versão das regras: o render, a junção e a entrega conferem que a trava é das props de hoje) e sai com código
1 se houver erro. Sem opção de ignorar: o conserto é mudar o texto ou declarar o valor fictício em fatos.exemplos da
cena, com a origem. A peça é o nome da PASTA (props com "peca" de outra pasta são recusadas).

Uso (sempre com python -B):
    python -B fatos.py <peça> [--cena <arquivo>] [--roteiro <arquivo>] [--json]
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import datetime  # noqa: E402
import json  # noqa: E402
import os  # noqa: E402
import re  # noqa: E402
import unicodedata  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
from comum import escrita  # noqa: E402

if comum.KIT + "/catalogos" not in sys.path:
    sys.path.insert(0, comum.KIT + "/catalogos")
import catalogo  # noqa: E402

FATOS_MD = escrita.BASE + "/FATOS.md"
PROIBIDO_MD = escrita.BASE + "/PROIBIDO.md"
# muda quando as regras mudam: o render, a junção e a entrega recusam a trava gravada com regras de outra versão
VERSAO_REGRAS = "2026-10-03-r4"

REGRAS = [
    {"n": 1, "nome": "valor em R$",
     "faz": "passa se estiver em fatos.exemplos da cena (valor fictício declarado, com origem) ou num fato do FATOS "
            "com status USAR; fato em CONFLITO ou NÃO USAR, o F063 (valor da guia do MEI), preço morto ou nenhum fato "
            "dão erro; exemplo sem origem não vale e dá erro",
     "origem": "BASE/PROIBIDO.md P36 (número sem id de fato) e P37 (preço antigo); BASE/FATOS.md (status USAR); F063"},
    {"n": 2, "nome": "percentual",
     "faz": "igual ao R$; a palavra 'alíquota', conta montada com percentual e percentual 'fixo' ('6% fixo') dão erro",
     "origem": "BASE/PROIBIDO.md P14 (6% fixo ou alíquota como cálculo) e P36"},
    {"n": 3, "nome": "dia, data e prazo",
     "faz": "'dia N', 'N dias' (e '1 dia'), 'até o dia N', datas ('31/05', '31.05', '31-05-2026', '31/12/2026', "
            "'31 de maio', '31 maio') e prazo em horas ou minutos ('24h', '48 horas', '5 minutinhos') precisam bater "
            "com um fato USAR (ou com fatos.exemplos, com origem); prazo prometido ('em minutos', 'em 1 dia', 'em um "
            "dia', 'no mesmo dia', 'em uma hora', 'em 1 semana', 'CNPJ pronto rápido') dá erro; as datas fictícias do "
            "pintor (vencimento 20/07/2026 do DAS de exemplo) passam",
     "origem": "BASE/PROIBIDO.md P01 (prazo em horas e minutos) e P36; BASE/FATOS.md (ex.: F062, F065, F077)"},
    {"n": 4, "nome": "termos proibidos",
     "faz": "erro: fazer sozinho ('faz/faça você mesmo' e 'sozinho', 'por conta própria' ou 'por si só' com qualquer "
            "verbo, inclusive no passado: 'abri meu MEI sozinha', 'gere sua guia sozinho'), 'quem abre (o CNPJ) é "
            "você' e 'é você quem abre', 'canal oficial', 'fecha a aba', entrar, acessar, abrir, usar ou ir até o "
            "portal (do Simples, do empreendedor), o site ou o app da Receita ou do governo, o e-CAC, o PGMEI, o "
            "SIMEI, o emissor ou o app MEI, e 'no portal' como lugar da ação ('No portal, clique em Emitir Guia'), "
            "'abrir MEI é de graça' (grátis perto de abrir ou de MEI), 'portal do empreendedor', 'emissor nacional', "
            "'gov.br' e 'gov br' (menos na frase do F071, que vira aviso), promessa de resultado (garantido, zero "
            "multa, sem risco), escassez inventada (só hoje, últimas vagas), loja ou download (baixe agora, já "
            "disponível, App Store), 'ao vivo', concorrente pelo nome, 'imposto novo', 'link abaixo', bastidor (id "
            "de fato ou do PROIBIDO, 'minha base'), 'APP EM CONSTRUÇÃO', travessão e os outros traços longos, a "
            "gente pagando a guia ('eu já paguei sua guia') e pagamento como status em texto visível ('pago', 'guia "
            "paga', 'Status: paga', 'Pagamento OK', 'Liquidada'). A negação só rebaixa pra aviso quando governa o "
            "verbo na mesma oração ('sem entrar no site do governo', 'não precisa fazer nada sozinho'); separada "
            "por vírgula ou dois-pontos, ou com outras palavras no meio ('Sem complicação, entre no portal'), não "
            "rebaixa a forma direta",
     "origem": "BASE/PROIBIDO.md P38 e memória nunca-orientar-fazer-sozinho (fazer sozinho, portal, emissor, gov.br, "
               "quem abre é você, canal oficial, é de graça); P03, P09, P11, P21 (a gente paga a guia), P25, P27, "
               "P31, P32, P33; P26 (travessão); P01 (ADR L272: copy de pagamento não promete confirmação) e DESENHO "
               "seção 5, toque-botao ('pago'); memória feedback-tirar-o-obvio (selo de construção vetado)"},
    {"n": 5, "nome": "avisos de revisão",
     "faz": "aviso: 'pago' e pagamento como status na narração, 'quitado', 'você mesmo', 'site do governo' (conferir "
            "o sentido), 'na hora' (prazo de abertura, P01), fazer sozinho ou portal negados na mesma oração, "
            "concorrente que também é verbo (agilize, facilite) e valor fictício declarado",
     "origem": "DESENHO seção 7.2; BASE/FATOS.md F063 e F071; BASE/PROIBIDO.md P01, P27 e P38"},
    {"n": 6, "nome": "valor de guia em peça conferida como MEI",
     "faz": "fatos.publico vazio ou fora de ME, MEI e todos dá erro; peça com publico 'MEI', 'todos' ou vazio é "
            "conferida como MEI: valor em R$ ligado a guia, DAS ou imposto dá erro (inclusive o contador de tela, em "
            "qualquer formato, o valor padrão da folha DAS e do comprovante sem mostraValor false e o valor do cartão "
            "do imposto do palco de argila), e tela ou imagem de camada 2D cuja captura de origem não serve peça de "
            "MEI (servePecaMei diferente de true, como as telas do guia, que mostram o valor de exemplo) também",
     "origem": "BASE/FATOS.md F063 (o valor da guia do MEI não se cita); BASE/PROIBIDO.md P13; catálogo de telas "
               "(servePecaMei)"},
    {"n": 7, "nome": "origem das telas",
     "faz": "tela, ou imagem de camada 2D que é tela, sem origem no catálogo de telas (nem pela receita da peça, nem "
            "pelo nome do arquivo) ou com a captura de origem reprovada dá erro, em qualquer público",
     "origem": "KIT/catalogos/telas (revisão por regra das telas, KIT/telas-revisao/REVISAO.md)"},
]


def norm(s):
    """Sem acento, minúsculo e com espaços simples (pra procurar termos)."""
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", s.casefold()).strip()


# ---------- valores ----------
RX_REAL = re.compile(r"R\$\s?(\d[\d.]*)(?:,(\d{2}))?(\s?mil\b)?")
RX_PCT = re.compile(r"(\d+(?:[,.]\d+)?)\s?%")
RX_DIA = re.compile(r"\b(?:ate o )?dia (\d{1,2})\b")
RX_DIAS = re.compile(r"\b(\d+) dias?\b")  # "1 dia" também (P01: "CNPJ em 1 dia")
MESES = {"janeiro": 1, "fevereiro": 2, "marco": 3, "abril": 4, "maio": 5, "junho": 6, "julho": 7, "agosto": 8,
         "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12}
# dd/mm, dd/mm/aaaa; com ponto ou hífen, só com dois dígitos no dia e no mês ("15.06", "15-06-2027"), pra "4.9" e
# "CC BY 4.0" não virarem data
RX_DATA_NUM = re.compile(r"(?<![\d/.,-])(?:(\d{1,2})/(\d{1,2})(?:/(\d{4}|\d{2}))?(?![\d/])|"
                         r"(\d{2})([.-])(\d{2})(?:\5(\d{4}|\d{2}))?(?![\d.-]?\d))")
RX_DATA_EXT = re.compile(r"\b(\d{1,2})(?:o|º)?\s+(?:de\s+)?(" + "|".join(MESES) + r")(?:\s+(?:de\s+)?(\d{4}))?\b")
RX_HORAS = re.compile(r"\b(\d+(?:[,.]\d+)?)\s?(h|hs|hr|hrs|hora|horas|min|mins|minuto|minutos|minutinho|minutinhos)\b")
# número por extenso num prazo ("em uma hora", "em cinco minutos")
NUMEROS_EXTENSO = {"um": 1, "uma": 1, "dois": 2, "duas": 2, "tres": 3, "quatro": 4, "cinco": 5, "seis": 6, "sete": 7,
                   "oito": 8, "nove": 9, "dez": 10, "quinze": 15, "vinte": 20, "trinta": 30, "meia": 0.5, "meio": 0.5}
_UNIDADE = (r"dia|dias|diazinho|semana|semanas|hora|horas|horinha|minuto|minutos|minutinho|minutinhos|segundo|"
            r"segundos|instante|instantes|mes|meses")
# prazo prometido (P01): "em <número> <unidade>", "no mesmo dia", "em poucos minutos", "CNPJ pronto rápido"
RX_PRAZO_PROMETIDO = re.compile(
    r"\bem\s+(?:(\d+(?:[,.]\d+)?)|(" + "|".join(NUMEROS_EXTENSO) + r"|poucos|poucas|alguns|algumas))\s+(?:(?:so|apenas)\s+)?("
    + _UNIDADE + r")\b|\bem\s+(minutos|minutinhos|segundos|instantes|horas)\b|\bno\s+mesmo\s+dia\b|"
    r"\bcnpj\s+pronto\s+rapido\b")


def centavos(m):
    inteiro = int(m.group(1).replace(".", ""))
    cent = int(m.group(2)) if m.group(2) else 0
    v = inteiro * 100 + cent
    if m.group(3):
        v *= 1000
    return v


def reais(texto):
    """[(texto achado, valor em centavos)]"""
    return [(m.group(0).strip(), centavos(m)) for m in RX_REAL.finditer(texto or "")]


def percentuais(texto):
    return [(m.group(0).strip(), float(m.group(1).replace(",", "."))) for m in RX_PCT.finditer(texto or "")]


def prazos(texto):
    """[(texto, chave)] com chave 'dia N' ou 'N dias' (sobre o texto normalizado)."""
    t = norm(texto)
    out = [(m.group(0), "dia %d" % int(m.group(1))) for m in RX_DIA.finditer(t)]
    out += [(m.group(0), "%d dias" % int(m.group(1))) for m in RX_DIAS.finditer(t)]
    return out


def datas(texto):
    """[(texto achado, 'dd/mm', 'dd/mm/aaaa' ou None)] de 'dd/mm', 'dd/mm/aaaa', 'dd.mm', 'dd-mm-aaaa' e 'N [de] <mês>
    [de aaaa]' (dia de 1 a 31 e mês de 1 a 12; o resto, como '50/50', não é data)."""
    t = norm(texto)
    out = []
    for m in RX_DATA_NUM.finditer(t):
        if m.group(1) is not None:
            d, mes, ano = int(m.group(1)), int(m.group(2)), m.group(3)
        else:
            d, mes, ano = int(m.group(4)), int(m.group(6)), m.group(7)
        if 1 <= d <= 31 and 1 <= mes <= 12:
            if ano and len(ano) == 2:
                ano = "20" + ano
            out.append((m.group(0), "%02d/%02d" % (d, mes), ("%02d/%02d/%s" % (d, mes, ano)) if ano else None))
    for m in RX_DATA_EXT.finditer(t):
        d, mes = int(m.group(1)), MESES[m.group(2)]
        if 1 <= d <= 31:
            ano = m.group(3)
            out.append((m.group(0), "%02d/%02d" % (d, mes), ("%02d/%02d/%s" % (d, mes, ano)) if ano else None))
    return out


def horas(texto):
    """[(texto achado, chave 'N h' ou 'N min')] de prazo em horas ou minutos."""
    out = []
    for m in RX_HORAS.finditer(norm(texto)):
        n = float(m.group(1).replace(",", "."))
        un = "h" if m.group(2).startswith("h") else "min"
        out.append((m.group(0), "%g %s" % (n, un)))
    return out


def prazos_prometidos(texto):
    """[(texto achado, chave ou None)] de prazo prometido (P01) que o prazos() e o horas() não pegam: número por extenso
    ('em um dia', 'em uma hora'), semana, mês e segundo ('em 1 semana'), 'em minutos', 'no mesmo dia' e 'CNPJ pronto
    rápido'. A chave ('1 dias', '1 h', '5 min') deixa passar o prazo que é fato USAR; sem chave, é sempre erro."""
    out = []
    for m in RX_PRAZO_PROMETIDO.finditer(norm(texto)):
        num, ext, un = m.group(1), m.group(2), m.group(3)
        if num is not None and un and un.startswith(("dia", "hora", "minut")):
            continue  # "em 1 dia", "em 2 horas", "em 5 minutinhos": o prazos() e o horas() já conferem contra o FATOS
        n = float(num.replace(",", ".")) if num is not None else NUMEROS_EXTENSO.get(ext or "")
        chave = None
        if n is not None and un:
            if un.startswith("dia"):
                chave = "%d dias" % n if n == int(n) else None
            elif un.startswith("hora"):
                chave = "%g h" % n
            elif un.startswith("minut"):
                chave = "%g min" % n
        out.append((m.group(0), chave))
    return out


def brl(v):
    """178.31 -> 'R$ 178,31'; 1234.5 -> 'R$ 1.234,50'"""
    inteiro, dec = ("%.2f" % float(v)).split(".")
    grupos = []
    while len(inteiro) > 3:
        grupos.insert(0, inteiro[-3:])
        inteiro = inteiro[:-3]
    grupos.insert(0, inteiro)
    return "R$ %s,%s" % (".".join(grupos), dec)


# ---------- base ----------
RX_FATO = re.compile(r"^\*\*(F\d{3}) · (.+?)\*\* · (USAR|NÃO USAR|CONFLITO)\s*$")
RX_PROIB = re.compile(r"^\*\*(P\d{2})\. (.+?)\*\*(.*)$")


def le_fatos(caminho=FATOS_MD):
    """{id: {id, titulo, status, afirma (frase + Número + versões), linha}}"""
    fatos = {}
    atual = None
    with open(caminho, encoding="utf-8") as f:
        linhas = f.read().splitlines()
    for i, ln in enumerate(linhas, 1):
        m = RX_FATO.match(ln)
        if m:
            atual = {"id": m.group(1), "titulo": m.group(2), "status": m.group(3), "frase": [], "numero": "",
                     "versoes": [], "linha": i}
            fatos[atual["id"]] = atual
            continue
        if atual is None:
            continue
        if ln.startswith("## ") or ln.strip() == "---":
            atual = None
            continue
        s = ln.strip()
        if not s:
            continue
        if s.startswith("- Número:"):
            partes = s[len("- Número:"):].split(" · ")
            atual["numero"] = partes[0].strip()
            for p in partes[1:]:
                if p.strip().startswith("Vale pra:"):
                    atual["valePra"] = p.strip()[len("Vale pra:"):].strip()
        elif s.startswith("- Versão"):
            atual["versoes"].append(s.split(":", 1)[1].strip() if ":" in s else s)
        elif s.startswith("- "):
            continue  # Fonte, Cuidado, Vale pra: não afirmam valor
        elif not atual["numero"]:
            atual["frase"].append(s)
    for f in fatos.values():
        f["afirma"] = " ".join(f["frase"] + [f["numero"]] + f["versoes"])
    return fatos


def le_proibidos(caminho=PROIBIDO_MD):
    """Valores em R$ citados no enunciado dos itens do PROIBIDO (ex.: P37, preços mortos): {centavos: Pxx}"""
    valores = {}
    atual, texto = None, []

    def fecha():
        if atual:
            for t, v in reais(" ".join(texto)):
                valores.setdefault(v, (atual, t))

    with open(caminho, encoding="utf-8") as f:
        for ln in f.read().splitlines():
            m = RX_PROIB.match(ln)
            if m:
                fecha()
                atual, texto = m.group(1), [m.group(3)]
                continue
            if atual is None:
                continue
            if ln.startswith("- ") or ln.startswith("## ") or not ln.strip():
                fecha()
                atual, texto = None, []
                continue
            texto.append(ln)
    fecha()
    return valores


class Base:
    def __init__(self):
        self.fatos = le_fatos()
        self.proibidos = le_proibidos()
        self.idx_real = {}
        self.idx_pct = {}
        self.idx_prazo = {}
        self.idx_data = {}
        self.idx_horas = {}
        for f in self.fatos.values():
            for _t, v in reais(f["afirma"]):
                self.idx_real.setdefault(v, []).append(f["id"])
            for _t, v in percentuais(f["afirma"]):
                self.idx_pct.setdefault(round(v, 6), []).append(f["id"])
            for _t, k in prazos(f["afirma"]):
                self.idx_prazo.setdefault(k, []).append(f["id"])
            for _t, ddmm, completa in datas(f["afirma"]):
                self.idx_data.setdefault(ddmm, []).append(f["id"])
                if completa:
                    self.idx_data.setdefault(completa, []).append(f["id"])
            for _t, k in horas(f["afirma"]):
                self.idx_horas.setdefault(k, []).append(f["id"])

    def acha(self, idx, chave, publico=None):
        """(fatos USAR, todos os fatos) pra uma chave do índice. Com o público da peça, os USAR que valem pra ele vêm
        primeiro (o 'Vale pra' do fato): o 'dia 20' de uma peça de ME cita o F077 (guia da ME), não o F060 (guia do
        funcionário do MEI)."""
        ids = sorted(set(idx.get(chave, [])))
        usar = [i for i in ids if self.fatos[i]["status"] == "USAR" and i != "F063"]
        if publico:
            usar.sort(key=lambda i: (-self.vale_pra(i, publico), i))
        return usar, ids

    def vale_pra(self, fid, publico):
        """2 quando o 'Vale pra' do fato é o público da peça ('ME', 'plano ME', 'MEI', 'MEI e ME'); 1 quando é 'todos'
        ou quando o fato não diz; 0 quando é de outro público ou de um caso particular ('MEI com empregado')."""
        v = norm(self.fatos[fid].get("valePra") or "")
        if not v:
            return 1
        if v.startswith(("todos", "mei e me", "me e mei")):
            return 2 if publico in ("todos", "ambos") else 1
        if publico == "MEI":
            if re.search(r"(?<![a-z])mei(?![a-z])", v):
                if "mei isento" in v:
                    return 0
                return 1 if re.search(r"(?<![a-z])mei com\b", v) else 2
            return 0
        if publico == "ME":
            if re.search(r"(?<![a-z])me(?![a-z])", v):
                return 1 if re.search(r"(?<![a-z])me com\b", v) else 2
            return 0
        return 1


# ---------- texto da peça ----------
class Trecho:
    def __init__(self, texto, onde, tipo, contador=False, guia=False, padrao=False):
        self.texto = texto or ""
        self.onde = onde
        self.tipo = tipo  # narracao | visivel | roteiro-batidas
        self.contador = contador
        self.guia = guia  # valor ligado a guia (contador de tela, valor da folha DAS e do comprovante)
        self.padrao = padrao  # dado padrão do pintor (a cena não trocou): as datas fictícias do kit passam


def acha_roteiro(peca, arg=None):
    if arg:
        p = arg if os.path.isabs(arg) else os.path.join(peca.pasta, arg)
        if not os.path.isfile(p):
            raise comum.ErroSaida("o roteiro não existe: %s" % p, 2)
        return comum.barra(p)
    for rel in ("roteiro.md", "voz/roteiro.md"):
        p = os.path.join(peca.pasta, rel)
        if os.path.isfile(p):
            return comum.barra(p)
    return None


def trechos_roteiro(caminho):
    with open(caminho, encoding="utf-8") as f:
        bruto = f.read()
    # comentários HTML ficam fora (mantendo as quebras de linha, pra a linha citada ser a do arquivo)
    sem = re.sub(r"<!--.*?-->", lambda m: "\n" * m.group(0).count("\n"), bruto, flags=re.S)
    out = []
    secao = None
    for i, ln in enumerate(sem.splitlines(), 1):
        if ln.startswith("## "):
            nome = norm(ln[3:])
            secao = "Narração" if nome.startswith("narracao") else ("Batidas" if nome.startswith("batidas") else None)
            continue
        if ln.startswith("# "):
            secao = None
            continue
        s = ln.strip()
        if not secao or not s or s.startswith(">"):
            continue
        if secao == "Narração":
            out.append(Trecho(s.replace("*", ""), "roteiro (Narração, linha %d)" % i, "narracao"))
        else:
            if s.startswith("|"):
                celulas = [c.strip() for c in s.strip("|").split("|")]
                if all(re.fullmatch(r":?-{3,}:?", c) for c in celulas if c):
                    continue
                if norm(celulas[0]) in ("palavra",) and len(celulas) >= 2 and norm(celulas[1]) == "batida":
                    continue  # cabeçalho da tabela
                s = " | ".join(celulas)
            out.append(Trecho(s, "roteiro (Batidas, linha %d)" % i, "roteiro-batidas"))
    return out


# Params de camada que são CSS da camada, não texto que aparece: a origem da transformação ("50% 58%" do p2d-grupo,
# "50% 100%" da imagem da abertura), o padding, o espaçamento e as sombras. Lidos como texto, a origem virava
# percentual sem fato e travava a peça (prova da biblioteca 2D no navegador, 03/10: "50% 6%" da p2d-HangTag).
ESTILO_CAMADA = ("id", "tipo", "estado", "origem", "origemAchata", "padding", "espacamento", "sombra", "sombraTexto",
                 "border", "src")  # src é o caminho da imagem (a origem dela é conferida à parte, como tela)


def _textos(x, saida, pular=("id", "tipo", "estado")):
    if isinstance(x, str):
        saida.append(x)
    elif isinstance(x, list):
        for v in x:
            _textos(v, saida, pular)
    elif isinstance(x, dict):
        for k, v in x.items():
            if k not in pular:
                _textos(v, saida, pular)


# Dados padrão dos pintores (RM/src/kit/render/pintores/folhaDas.ts e comprovante.ts): o que a folha DAS e o
# comprovante mostram quando a cena não traz conteudo. Identificadores inválidos de propósito, NÃO CORRIGIR.
DADOS_DAS_PADRAO = {
    "titulo1": "Documento de Arrecadação", "titulo2": "do Simples Nacional",
    "razaoSocial": "ANA BEATRIZ RAMOS DESENV. DE SOFTWARE", "cnpj": "54.321.000/0001-09", "periodo": "Junho/2026",
    "vencimento": "20/07/2026", "numeroDocumento": "07.20.26182.5730941-8", "pagarAte": "20/07/2026",
    "valor": "R$ 178,31", "linhaDigitavel": "85830000001 7  78310328262 6  01072026182 9  57309418419 1",
}
ROTULOS_DAS = ("Razão Social", "CNPJ", "Período de Apuração", "Data de Vencimento", "Número do Documento",
               "Pagar este documento até", "Valor Total do Documento", "Observações", "AUTENTICAÇÃO MECÂNICA")
DADOS_COMPROVANTE_PADRAO = {
    "titulo": "Comprovante de pagamento", "linha": "Documento de Arrecadação do Simples Nacional",
    "razaoSocial": DADOS_DAS_PADRAO["razaoSocial"], "cnpj": DADOS_DAS_PADRAO["cnpj"],
    "periodo": DADOS_DAS_PADRAO["periodo"], "vencimento": DADOS_DAS_PADRAO["vencimento"],
    "numeroDocumento": DADOS_DAS_PADRAO["numeroDocumento"], "valor": DADOS_DAS_PADRAO["valor"],
    "linhaDigitavel": DADOS_DAS_PADRAO["linhaDigitavel"], "autenticacao": "5D2C.81A7.0F39.E46B.92C0.7A15.3E",
}
ROTULOS_COMPROVANTE = ("Razão Social", "CNPJ", "Período de Apuração", "Data de Vencimento", "Número do Documento",
                       "Valor Total do Documento", "Autenticação", "Linha digitável")
PINTORES = {"folha": ("folha DAS", DADOS_DAS_PADRAO, ROTULOS_DAS),
            "comprovante": ("comprovante", DADOS_COMPROVANTE_PADRAO, ROTULOS_COMPROVANTE)}


def trechos_pintor(o):
    """Texto visível da folha DAS ou do comprovante: os dados padrão do pintor misturados com o conteudo da cena (o
    que a cena não trocou conta como padrão), sem o valor com mostraValor false, mais os rótulos fixos."""
    nome, padrao, rotulos = PINTORES[o.get("tipo")]
    conteudo = o.get("conteudo") if isinstance(o.get("conteudo"), dict) else {}
    out = []
    mostra = conteudo.get("mostraValor") is not False
    for campo, valor_padrao in padrao.items():
        if campo == "valor" and not mostra:
            continue
        do_conteudo = campo in conteudo and isinstance(conteudo[campo], str)
        texto = conteudo[campo] if do_conteudo else valor_padrao
        onde = "%s %s (%s%s)" % (nome, o.get("id"), campo, "" if do_conteudo else ", padrão do pintor")
        out.append(Trecho(texto, onde, "visivel", guia=(campo == "valor"), padrao=not do_conteudo))
    for k, v in conteudo.items():
        if k not in padrao and k != "mostraValor":
            ts = []
            _textos(v, ts, ())
            for t in ts:
                out.append(Trecho(t, "conteúdo do objeto %s (%s)" % (o.get("id"), k), "visivel"))
    for r in rotulos:
        out.append(Trecho(r, "%s %s (rótulo do pintor)" % (nome, o.get("id")), "visivel", padrao=True))
    return out


def _numero(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def trechos_cartoes_imposto(o):
    """O valor do cartão do imposto do palco de argila (peça de tipo cartao-imposto em conteudo.pecas da cena): o
    cartão conta de R$ 0,00 até opcoes.valor, sempre em R$ (o pintor dos cartões usa o mesmo formataBrl da tela). As
    peças padrão de um tipo de palco registrado por extensão (o palco-tvl da peça de 05/10) só o montaProps enxerga."""
    out = []
    pecas = ((o.get("conteudo") or {}) if isinstance(o.get("conteudo"), dict) else {}).get("pecas")
    if not isinstance(pecas, dict):
        return out
    for pid, pc in pecas.items():
        if not isinstance(pc, dict) or str(pid).startswith("_") or pc.get("tipo") != "cartao-imposto":
            continue
        op = pc.get("opcoes") if isinstance(pc.get("opcoes"), dict) else {}
        onde = "cartão do imposto %s do palco %s" % (pid, o.get("id"))
        if _numero(op.get("valor")):
            out.append(Trecho(brl(op["valor"]), onde + " (valor que o cartão conta)", "visivel", guia=True))
        if isinstance(op.get("valorTexto"), str):
            out.append(Trecho(op["valorTexto"], onde + " (valorTexto)", "visivel", guia=True))
    return out


def trechos_props(props):
    out = []
    narr = props.get("narracao") or {}
    palavras = narr.get("words") or []
    for k, fr in enumerate(narr.get("phrases") or [], 1):
        texto = " ".join(palavras[i]["t"] for i in fr.get("w", []) if 0 <= i < len(palavras))
        out.append(Trecho(texto, "narração, frase %d (voz e legenda)" % k, "narracao"))
    for o in props.get("objetos") or []:
        if o.get("mostrador"):
            m = o["mostrador"]
            for campo in ("app", "quando", "hora"):
                if m.get(campo):
                    out.append(Trecho(str(m[campo]), "mostrador do %s (%s)" % (o["id"], campo), "visivel"))
            for j, ln in enumerate(m.get("linhas") or [], 1):
                out.append(Trecho(str(ln), "mostrador do %s (linha %d)" % (o["id"], j), "visivel"))
        if o.get("tipo") in PINTORES:
            out += trechos_pintor(o)
        elif o.get("conteudo"):
            ts = []
            _textos(o["conteudo"], ts, ())
            for t in ts:
                out.append(Trecho(t, "conteúdo do objeto %s" % o["id"], "visivel"))
            out += trechos_cartoes_imposto(o)
        if o.get("tipo") == "pilula" and not (o.get("conteudo") or {}).get("texto"):
            etq = ((o.get("render") or {}).get("etiqueta") or {}).get("texto")
            if etq:
                out.append(Trecho(etq, "etiqueta da pílula %s (padrão do catálogo)" % o["id"], "visivel"))
    for chave, tela in (props.get("telas") or {}).items():
        for ex in tela.get("extras") or []:
            if ex.get("tipo") == "botao":
                out.append(Trecho(ex.get("rotulo", ""), "tela %s, botão (rótulo)" % chave, "visivel"))
                out.append(Trecho(ex.get("retorno", ""), "tela %s, botão (retorno)" % chave, "visivel"))
            elif ex.get("tipo") == "contador" and _numero(ex.get("valor")):
                # sempre em R$: o telaKit desenha formataBrl(valor) em qualquer "formato" (o montaProps recusa formato
                # diferente de "brl"); lido como "75.9", o valor escapava da trava
                out.append(Trecho(brl(ex["valor"]), "tela %s, contador (região %s%s)"
                                  % (chave, ex.get("regiao"), (", formato %s" % ex["formato"]) if ex.get("formato") not in
                                     (None, "brl") else ""), "visivel", True))
    fecho = props.get("fecho")
    if fecho and fecho.get("link"):
        out.append(Trecho(fecho["link"].get("texto", ""), "link da bio", "visivel"))
    for c in props.get("camadas") or []:
        ts = []
        _textos(c, ts, ESTILO_CAMADA)
        for t in ts:
            out.append(Trecho(t, "camada %s (%s)" % (c.get("id"), c.get("tipo")), "visivel"))
    capa = props.get("capa")
    if capa:
        out.append(Trecho(capa.get("titulo", ""), "capa (título)", "visivel"))
    return out


def telas_da_peca(props):
    """[(onde, item do catálogo ou None, via)] da origem de cada tela do aparelho e de cada imagem de camada 2D que é
    tela (src telas/<png>, pecas/<peça>/telas/<png> ou nome de arquivo do catálogo de telas): o mesmo critério do
    montaProps."""
    idx = catalogo.indice("telas")
    out = [("tela %s" % k, *catalogo.origem_tela(t.get("arquivo"), t.get("conjunto"), idx))
           for k, t in (props.get("telas") or {}).items()]
    for c in props.get("camadas") or []:
        for campo, src in catalogo.srcs_de_camada(c):
            it, via, eh_tela = catalogo.origem_src(src, idx)
            if eh_tela:
                out.append(("camada %s (%s %s, imagem 2D de tela)" % (c.get("id"), campo, src), it, via))
    return out


# ---------- regras ----------
F071 = norm("você só confirma na sua conta gov.br")
_SOZINHO = ("nunca orientar a fazer sozinho: o caminho é sempre o app (no MEI, o app prepara e o titular só confirma)",
            "BASE/PROIBIDO.md P38; memória nunca-orientar-fazer-sozinho")
# literais: erro mesmo negados (o P38 cita "faz você mesmo"; o portal do empreendedor e o emissor nacional nunca vão
# pra peça). "entra no portal" e "faz sozinho" saíram daqui: os padrões abaixo pegam e olham a negação
TERMOS_ERRO = [
    (norm("faz você mesmo"), "'faz você mesmo'") + _SOZINHO,
    (norm("faça você mesmo"), "'faça você mesmo'") + _SOZINHO,
    (norm("portal do empreendedor"), "'portal do empreendedor'") + _SOZINHO,
    (norm("emissor nacional"), "'emissor nacional'") + _SOZINHO,
    (norm("APP EM CONSTRUÇÃO"), "selo 'APP EM CONSTRUÇÃO'", "vetado pelo Pedro (tirar o óbvio do vídeo)",
     "memória feedback-tirar-o-obvio; DESENHO seção 5"),
]
# Alvos do "entrar no portal": o portal (do Simples, do empreendedor, do MEI), o site, o app ou o sistema da Receita ou
# do governo, o e-CAC, o PGMEI, o PGDAS, o SIMEI, o emissor e o app MEI do governo (texto normalizado)
_ALVOS_PORTAL = (r"portal(?:\s+(?:do|da)\s+(?:simples(?:\s+nacional)?|empreendedor|mei|receita(?:\s+federal)?|governo))?|"
                 r"(?:site|app|aplicativo|sistema|pagina)\s+(?:da|do)\s+(?:receita(?:\s+federal)?|governo|"
                 r"simples(?:\s+nacional)?|mei)|(?:app|aplicativo)\s+(?:do\s+)?mei(?:\s+do\s+governo)?|e-?cac|pgmei|"
                 r"pgdas(?:-?d)?|simei|emissor(?:\s+nacional)?(?:\s+de\s+notas?)?|receita\s+federal")
_VERBOS_ACESSO = (r"entra|entre|entrar|entrando|entrou|entrei|entramos|acessa|acesse|acessar|acessando|acessou|"
                  r"acessei|abre|abra|abrir|abrindo|abriu|abri|use|usa|usar|usando|usou|usei|vai|va|ir|indo|fui|vamos|"
                  r"clica|clique|clicar|loga|logue|logar|consulta|consulte|consultar")
RX_PORTAL_VERBO = re.compile(r"\b(?:%s)\b(?:\s+\S+){0,3}?\s+(?:%s)\b" % (_VERBOS_ACESSO, _ALVOS_PORTAL))
# "no portal" como lugar da ação ("No portal, clique em Emitir Guia"; "Pelo aplicativo MEI do governo você emite")
RX_PORTAL_LUGAR = re.compile(r"\b(?:no|na|num|numa|pelo|pela)\s+(?:seu\s+|sua\s+)?(?:%s)\b" % _ALVOS_PORTAL)
# Frases e variações do PROIBIDO (texto normalizado: sem acento e minúsculo). Cada uma: rx, rótulo, mensagem, origem e
# negável. Negável quer dizer que a negação que governa o trecho na mesma oração ("sem entrar no site do governo", a
# frase do guia; "não precisa fazer nada sozinho") rebaixa pra aviso; a negação de outra oração (separada por vírgula,
# dois-pontos ou ponto) ou com outras palavras no meio ("Sem complicação, entre no portal") não rebaixa a forma direta.
# pula: a chave de outro padrão; o trecho que ele já pegou não conta de novo.
_VERBOS_SOZINHO = (r"faz|faca|fazer|faco|fazendo|fez|fiz|abre|abra|abrir|abrindo|abriu|abri|emite|emita|emitir|"
                   r"emitindo|emitiu|emiti|declara|declare|declarar|declarou|declarei|resolve|resolva|resolver|resolvi|"
                   r"cuida|cuide|cuidar|tira|tire|tirar|preenche|preencha|preencher|preenchi|gera|gere|gerar|gerei|"
                   r"paga|pague|pagar|paguei")
TERMOS_RX = [
    {"rx": re.compile(r"\b(?:sozinh[oa]s?|por conta propria|por si (?:so|mesm[oa]s?))\b"),
     "rotulo": "fazer sozinho", "msg": _SOZINHO[0], "origem": _SOZINHO[1], "negavel": True},
    {"rx": re.compile(r"\b(?:%s)\b(?:\s+\S+){0,3}?\s+voce mesm[oa]s?\b" % _VERBOS_SOZINHO),
     "rotulo": "fazer você mesmo", "msg": _SOZINHO[0], "origem": _SOZINHO[1], "negavel": True},
    {"rx": re.compile(r"\bquem\s+(?:abre|abriu|emite|emitiu|faz|fez|declara|declarou|clica|preenche|resolve|gera|cuida|"
                      r"calcula|soma)\b(?:\s+\S+){0,4}?\s+(?:e|eh|sera|vai ser|foi)\s+voce\b|\b(?:e|eh|sera|foi)\s+voce"
                      r"\s+(?:mesm[oa]\s+)?quem\s+(?:abre|abriu|emite|faz|declara|preenche|resolve|gera|cuida|calcula|"
                      r"soma)\b"),
     "rotulo": "'quem abre é você'", "msg": _SOZINHO[0], "origem": _SOZINHO[1], "negavel": False},
    {"rx": re.compile(r"\bcanal oficial\b"), "rotulo": "'canal oficial'", "msg": _SOZINHO[0], "origem": _SOZINHO[1],
     "negavel": False},
    {"rx": re.compile(r"\bfecha a aba\b"), "rotulo": "'fecha a aba'", "msg": _SOZINHO[0], "origem": _SOZINHO[1],
     "negavel": False},
    {"rx": RX_PORTAL_VERBO, "chave": "portal-verbo", "rotulo": "entrar no portal, no e-CAC ou no site do governo",
     "msg": _SOZINHO[0], "origem": _SOZINHO[1], "negavel": True},
    {"rx": RX_PORTAL_LUGAR, "rotulo": "o portal ou o site do governo como lugar da ação", "msg": _SOZINHO[0],
     "origem": _SOZINHO[1], "negavel": True, "pula": "portal-verbo"},
    {"rx": re.compile(r"\b(?:abrir|abra|abre|abertura|formalizar|formalizacao|mei|cnpj)\b(?:\s+\S+){0,4}?\s+"
                      r"(?:de graca|gratis|gratuit[oa]s?)\b|\b(?:de graca|gratis|gratuit[oa]s?)\b(?:\s+\S+){0,3}?\s+"
                      r"(?:abrir|abertura|formalizar|(?:o|seu|teu) mei|(?:o|seu|teu) cnpj)\b"),
     "rotulo": "'abrir MEI é de graça'", "msg": _SOZINHO[0], "origem": _SOZINHO[1], "negavel": True},
    {"rx": re.compile(r"\b(?:garantid[oa]s?|garantimos|garante que|zero multas?|sem multa nenhuma|sem risco|nunca mais "
                      r"(?:vai )?(?:ter|tera) problemas?|nunca (?:vai )?cair na malha)\b"),
     "rotulo": "promessa de resultado", "msg": "nada de garantir resultado: diga o que o sistema faz, com o id do fato",
     "origem": "BASE/PROIBIDO.md P03", "negavel": False},
    {"rx": re.compile(r"\b(?:so hoje|ultimas vagas|ultima vaga|vagas? de fundador|vagas limitadas|por tempo limitado|"
                      r"corre que (?:acaba|ta acabando|esta acabando)|ultimas unidades)\b"),
     "rotulo": "escassez inventada", "msg": "a única urgência real é a validade da promoção, com a data do FATOS",
     "origem": "BASE/PROIBIDO.md P09", "negavel": False},
    {"rx": re.compile(r"\b(?:baix[ae] (?:o app |o aplicativo )?agora|ja (?:esta |ta )?disponivel|disponivel na "
                      r"(?:app store|play store|loja)|app store|play store|google play|baix[ae] o (?:app|aplicativo)|"
                      r"link de download)\b"),
     "rotulo": "loja ou download", "msg": "o app está em pré-lançamento: sem link de download nem nome na loja (lista "
     "de espera pelo link da bio)", "origem": "BASE/PROIBIDO.md P11", "negavel": False},
    {"rx": re.compile(r"\bao vivo\b"), "rotulo": "'ao vivo'",
     "msg": "termo proibido em copy (no lugar: junto, na hora, com você)", "origem": "BASE/PROIBIDO.md P25",
     "negavel": False},
    {"rx": re.compile(r"\b(?:imposto novo|novo imposto|mei vai pagar mais|simples hibrido (?:e |eh |sera )?"
                      r"obrigatorio)\b"),
     "rotulo": "reforma tributária mal dita",
     "msg": "IBS e CBS substituem tributos antigos; número ou data da reforma só com fato",
     "origem": "BASE/PROIBIDO.md P31", "negavel": False},
    {"rx": re.compile(r"\b(?:link (?:aqui )?(?:abaixo|embaixo)|link na (?:descricao|legenda))\b"),
     "rotulo": "'link abaixo'", "msg": "em reel orgânico é 'link da bio'", "origem": "BASE/PROIBIDO.md P32",
     "negavel": False},
    {"rx": re.compile(r"\b(?:(?:eu|a gente|nos)\s+(?:ja\s+)?(?:paguei|pagamos|pago|paga)\s+(?:a\s+|sua\s+|a sua\s+|"
                      r"o\s+|seu\s+|o seu\s+)?(?:guia|das|imposto|boleto)|ja\s+paguei)\b"),
     "rotulo": "a gente pagando a guia", "msg": "quem paga a guia é o cliente; o sistema calcula, emite e avisa "
     "(\"você paga a guia que chega pronta\")", "origem": "BASE/PROIBIDO.md P21", "negavel": False},
]
RX_BASTIDOR = re.compile(r"\b(?:[fp]\d{2,3}|minha base|fatos\.md|proibido\.md|base contabil)\b")
ORIGEM_PAGO = "BASE/PROIBIDO.md P01 (ADR L272: copy de pagamento não promete confirmação); DESENHO seção 5 (toque-botao)"
ORIGEM_TRAVESSAO = "BASE/PROIBIDO.md P26"
ORIGEM_GOVBR = "BASE/PROIBIDO.md P38; BASE/FATOS.md F071"
RX_PAGO = re.compile(r"\bpago\b")
RX_PAGO_STATUS = re.compile(r"\b(?:(?:guia|das|imposto|boleto|conta|fatura|tributo|parcela|darf|taxa)s?\s+(?:ja\s+)?"
                            r"(?:esta\s+|estao\s+|foi\s+|foram\s+|ficou\s+|ta\s+)?(?:pag[oa]s?|liquidad[oa]s?)|"
                            r"(?:esta|estao|foi|foram|ficou|ta|tao|ja)\s+(?:pag[oa]s?|liquidad[oa]s?))\b")
RX_PAGAMENTO_OK = re.compile(r"\bpagamento (?:confirmado|aprovado|realizado|efetuado|recebido|concluido|feito|"
                             r"compensado|ok)\b")
# rótulo de status ("Status: paga", "Situação: liquidada", "Pagamento OK", "Pagamento: confirmado")
RX_PAGO_ROTULO = re.compile(r"\b(?:status|situacao|pagamento)\s*[:=-]?\s*(?:pag[oa]s?|ok|confirmad[oa]|aprovad[oa]|"
                            r"liquidad[oa]|quitad[oa]|concluid[oa]|efetuad[oa]|realizad[oa])\b")
RX_LIQUIDADO = re.compile(r"\bliquidad[oa]s?\b")
# o rótulo sozinho na tela ("Paga", "✓ Liquidada")
SO_STATUS = ("paga", "pagas", "pago", "pagos", "liquidada", "liquidado", "quitada", "quitado")
RX_QUITADO = re.compile(r"\bquitad[oa]s?\b")
RX_GOVBR = re.compile(r"\bgov\s?\.?\s?br\b")
RX_ALIQUOTA = re.compile(r"\baliquota")
RX_CONTA = re.compile(r"(\d+(?:[,.]\d+)?\s?%\s*(?:x|\*|×|vezes|de|sobre)\s*r\$)|(r\$\s?[\d.,]+(?:\s?mil)?\s*(?:x|\*|×|vezes)\s*\d+(?:[,.]\d+)?\s?%)|(%[^.]*=\s*r\$)")
RX_PCT_FIXO = re.compile(r"\d+(?:[,.]\d+)?\s?%\s*(?:e\s+)?fix[oa]s?\b|\bfix[oa]s?\s+(?:de\s+)?\d+(?:[,.]\d+)?\s?%")
RX_NA_HORA = re.compile(r"\bna hora\b")
RX_GUIA = re.compile(r"\b(guia|das|imposto)\b")
NEGACOES = {"nao", "nunca", "nem", "sem", "jamais", "ninguem"}
# palavras que podem ficar entre a negação e o verbo negado, na mesma oração: auxiliares, pronomes e o que completa
# "não precisa fazer nada", "você não vai precisar", "nunca mais", "nem pense em"
AUX_NEGACAO = {"precisa", "precisam", "precisar", "precisara", "precisarao", "vai", "vao", "vamos", "ira", "irao", "tem",
               "tera", "temos", "que", "de", "mais", "nunca", "jamais", "voce", "voces", "a", "o", "os", "as", "se", "te",
               "lhe", "me", "pra", "para", "mesmo", "mesma", "fica", "ficar", "ficara", "esta", "estar", "estara",
               "estao", "fazer", "faz", "faca", "nada", "tudo", "isso", "nem", "deve", "devem", "pode", "podem", "e",
               "pense", "pensar", "em", "mais", "tera", "teria", "precisaria", "seja", "ser", "sera"}
_PONTUACAO = re.compile(r"[.,;:!?()\[\]{}\"“”|]")


def _negado(t, ini):
    """Verdadeiro quando uma negação ('não', 'nunca', 'nem', 'sem', 'jamais', 'ninguém') governa o trecho que começa em
    ini: na mesma oração (sem vírgula, dois-pontos ou ponto no meio), até 4 palavras antes, e só com auxiliares entre
    ela e o trecho ('não precisa fazer nada sozinho', 'sem entrar no site do governo'). 'Sem complicação, entre no
    portal' e 'Não espere: entre no portal' não são negação da forma direta."""
    antes = t[:ini]
    corte = None
    for m in _PONTUACAO.finditer(antes):
        corte = m.end()
    oracao = antes[corte:] if corte is not None else antes
    palavras = oracao.split()[-5:]
    for k in range(len(palavras) - 1, -1, -1):
        if palavras[k] in NEGACOES:
            entre = palavras[k + 1:]
            return all(p in AUX_NEGACAO for p in entre)
    return False


class Resultado:
    def __init__(self):
        self.erros, self.avisos, self.numeros = [], [], []

    def erro(self, regra, onde, trecho, msg, origem=None):
        self.erros.append({"regra": regra, "origem": origem or REGRAS[regra - 1]["origem"], "onde": onde,
                           "trecho": trecho, "mensagem": "regra %d (%s): %s" % (regra, REGRAS[regra - 1]["nome"], msg)})

    def aviso(self, regra, onde, trecho, msg, origem=None):
        item = {"regra": regra, "origem": origem or REGRAS[regra - 1]["origem"], "onde": onde, "trecho": trecho,
                "mensagem": "regra %d (%s): %s" % (regra, REGRAS[regra - 1]["nome"], msg)}
        if not any(a["mensagem"] == item["mensagem"] and a["onde"] == onde for a in self.avisos):
            self.avisos.append(item)


def _exemplos(fatos_cena, r):
    """{(tipo, chave): exemplo} dos valores fictícios declarados com origem; sem origem, erro e o valor não vale."""
    exemplos = {}
    for i, ex in enumerate(fatos_cena.get("exemplos") or []):
        texto = ex.get("texto", "") if isinstance(ex, dict) else ""
        origem = ex.get("origem") if isinstance(ex, dict) else None
        if not (isinstance(origem, str) and origem.strip()):
            r.erro(1, "cena (fatos.exemplos[%d])" % i, texto, "exemplo \"%s\" sem origem: valor fictício só vale com a "
                   "origem escrita (de onde ele vem)" % texto)
            continue
        for _t, v in reais(texto):
            exemplos[("real", v)] = ex
        for _t, v in percentuais(texto):
            exemplos[("pct", round(v, 6))] = ex
        for _t, ddmm, completa in datas(texto):
            exemplos[("data", completa or ddmm)] = ex
    return exemplos


def confere(trechos, props, base, telas=None):
    """Aplica as regras. telas: [(onde, item do catálogo ou None, via)] da origem das telas e das imagens de camada que
    são tela (telas_da_peca)."""
    r = Resultado()
    fatos_cena = props.get("fatos") or {}
    publico = fatos_cena.get("publico")
    exemplos = _exemplos(fatos_cena, r)
    # F063 por padrão (rodada 4, 03/10): o público é obrigatório; "MEI", "todos" e vazio são conferidos como MEI
    estrito = catalogo.publico_estrito(publico)
    rotulo_mei = "peça %s" % ("de MEI" if publico == "MEI" else "pra todos (conferida como MEI)" if publico in (
        "todos", "ambos") else "com público %s (conferida como MEI, a regra mais restrita)" % catalogo.rotulo_publico(
        publico))
    if publico in (None, ""):
        r.erro(6, "cena (fatos.publico)", "", "fatos.publico vazio: declare \"ME\", \"MEI\" ou \"todos\" (até lá, a peça "
               "é conferida como MEI, a regra mais restrita: nenhum valor de guia aparece)")
    elif publico not in catalogo.PUBLICOS:
        r.erro(6, "cena (fatos.publico)", str(publico), "fatos.publico inválido (%r): use \"ME\", \"MEI\" ou \"todos\" "
               "(conferida como MEI até lá)" % (publico,))

    for tr in trechos:
        t_orig, t = tr.texto, norm(tr.texto)
        guia = tr.contador or tr.guia or bool(RX_GUIA.search(t))
        # regra 1: R$
        for achado, v in reais(t_orig):
            item = {"texto": achado, "onde": tr.onde, "fato": None}
            if v in base.proibidos:
                pid, ptxt = base.proibidos[v]
                r.erro(1, tr.onde, t_orig, "%s é valor proibido (BASE/PROIBIDO.md %s: %s)" % (achado, pid, ptxt))
            elif ("real", v) in exemplos:
                ex = exemplos[("real", v)]
                item["fato"] = "exemplo"
                r.aviso(1, tr.onde, t_orig, "%s é valor fictício declarado em fatos.exemplos (origem: %s): conferir "
                        "que aparece como exemplo" % (achado, ex.get("origem")))
            else:
                usar, ids = base.acha(base.idx_real, v, publico)
                if usar:
                    item["fato"], item["fatos"] = usar[0], usar
                elif ids:
                    st = ", ".join("%s (%s)" % (i, base.fatos[i]["status"]) for i in ids)
                    r.erro(1, tr.onde, t_orig, "%s só aparece em fato que não pode ir pra peça: %s" % (achado, st))
                else:
                    r.erro(1, tr.onde, t_orig, "%s não está no FATOS (status USAR) nem em fatos.exemplos da cena "
                           "(PROIBIDO P36: número sem id de fato)" % achado)
            if guia and estrito:
                r.erro(6, tr.onde, t_orig, "%s ligado a guia, DAS ou imposto numa %s (F063: o valor da guia do MEI "
                       "nunca aparece; folha DAS e comprovante com conteudo.mostraValor false; sem contador de valor e "
                       "sem cartão do imposto; só \"ME\" deixa o valor de exemplo aparecer)" % (achado, rotulo_mei))
            r.numeros.append(item)
        # regra 2: percentual
        for achado, v in percentuais(t_orig):
            item = {"texto": achado, "onde": tr.onde, "fato": None}
            if ("pct", round(v, 6)) in exemplos:
                item["fato"] = "exemplo"
            else:
                usar, ids = base.acha(base.idx_pct, round(v, 6), publico)
                if usar:
                    item["fato"], item["fatos"] = usar[0], usar
                elif ids:
                    st = ", ".join("%s (%s)" % (i, base.fatos[i]["status"]) for i in ids)
                    r.erro(2, tr.onde, t_orig, "%s só aparece em fato que não pode ir pra peça: %s" % (achado, st))
                else:
                    r.erro(2, tr.onde, t_orig, "%s não está no FATOS (status USAR) (PROIBIDO P36)" % achado)
            r.numeros.append(item)
        if RX_ALIQUOTA.search(t):
            r.erro(2, tr.onde, t_orig, "'alíquota' no texto (PROIBIDO P14: alíquota não vira cálculo na peça)")
        if RX_CONTA.search(t):
            r.erro(2, tr.onde, t_orig, "conta montada com percentual (PROIBIDO P14)")
        if RX_PCT_FIXO.search(t):
            r.erro(2, tr.onde, t_orig, "percentual 'fixo' (PROIBIDO P14: nunca diga 6% fixo; 'começa em', dito como "
                   "aproximado)")
        # regra 3: dia, data e prazo
        for achado, chave in prazos(t_orig):
            item = {"texto": achado, "onde": tr.onde, "fato": None}
            usar, ids = base.acha(base.idx_prazo, chave, publico)
            if usar:
                item["fato"], item["fatos"] = usar[0], usar
            elif ids:
                st = ", ".join("%s (%s)" % (i, base.fatos[i]["status"]) for i in ids)
                r.erro(3, tr.onde, t_orig, "'%s' só aparece em fato que não pode ir pra peça: %s" % (achado, st))
            else:
                r.erro(3, tr.onde, t_orig, "'%s' não bate com nenhum fato USAR do FATOS (prazo prometido é PROIBIDO "
                       "P01)" % achado)
            r.numeros.append(item)
        # datas e prazos em horas: no texto publicado (narração e tela); a tabela de Batidas do roteiro descreve a
        # cena e cita data de outra peça ("o reel de 14/10"), e o texto que aparece já vem das props
        for achado, ddmm, completa in (datas(t_orig) if tr.tipo != "roteiro-batidas" else []):
            item = {"texto": achado, "onde": tr.onde, "fato": None}
            if tr.padrao:
                item["fato"] = "padrão do pintor"  # vencimento fictício do DAS de exemplo (dia 20, F062 e F077)
            elif ("data", completa) in exemplos or ("data", ddmm) in exemplos:
                item["fato"] = "exemplo"
            else:
                usar, ids = base.acha(base.idx_data, ddmm, publico)
                # fato USAR que crava ano (31/12/2026): a data da peça com outro ano não bate
                anos = sorted({k[6:] for k, v in base.idx_data.items() if len(k) == 10 and k[:5] == ddmm
                               and set(v) & set(usar)})
                if usar and completa and anos and completa[6:] not in anos:
                    r.erro(3, tr.onde, t_orig, "a data '%s' tem ano diferente do fato (%s: %s)"
                           % (achado, ", ".join(usar), ", ".join(anos)))
                elif usar:
                    item["fato"], item["fatos"] = usar[0], usar
                elif ids:
                    st = ", ".join("%s (%s)" % (i, base.fatos[i]["status"]) for i in ids)
                    r.erro(3, tr.onde, t_orig, "a data '%s' só aparece em fato que não pode ir pra peça: %s"
                           % (achado, st))
                else:
                    r.erro(3, tr.onde, t_orig, "a data '%s' não bate com nenhum fato USAR do FATOS nem com "
                           "fatos.exemplos (PROIBIDO P36)" % achado)
            r.numeros.append(item)
        for achado, chave in (horas(t_orig) if tr.tipo != "roteiro-batidas" else []):
            item = {"texto": achado, "onde": tr.onde, "fato": None}
            usar, ids = base.acha(base.idx_horas, chave, publico)
            if usar:
                item["fato"], item["fatos"] = usar[0], usar
            else:
                r.erro(3, tr.onde, t_orig, "prazo em horas ou minutos ('%s') sem fato USAR: nada de cravar tempo "
                       "(PROIBIDO P01 e P36)" % achado, "BASE/PROIBIDO.md P01 e P36")
            r.numeros.append(item)
        for achado, chave in prazos_prometidos(t_orig):
            idx = base.idx_horas if chave and chave.endswith(("h", "min")) else base.idx_prazo
            usar = base.acha(idx, chave, publico)[0] if chave else []
            if usar:
                r.numeros.append({"texto": achado, "onde": tr.onde, "fato": usar[0], "fatos": usar})
            else:
                r.erro(3, tr.onde, t_orig, "prazo prometido ('%s'): nada de cravar tempo, nem por extenso ('em um "
                       "dia', 'no mesmo dia', 'em uma hora', 'em 1 semana', 'em minutos') (PROIBIDO P01)" % achado,
                       "BASE/PROIBIDO.md P01")
        # regra 4: termos proibidos
        for termo, rotulo, msg, origem in TERMOS_ERRO:
            if termo in t:
                r.erro(4, tr.onde, t_orig, "%s: %s" % (rotulo, msg), origem)
        pegos = {}
        for regra in TERMOS_RX:
            ja = pegos.get(regra.get("pula"), []) if regra.get("pula") else []
            # o trecho já pego pelo padrão do verbo ("entrar no portal") não conta de novo como lugar ("no portal")
            ms = [m for m in regra["rx"].finditer(t) if not any(a < m.end() and m.start() < b for a, b in ja)]
            pegos.setdefault(regra.get("chave") or id(regra), []).extend((m.start(), m.end()) for m in ms)
            # um por regra e trecho: o primeiro que não está negado é erro; todos negados, um aviso
            diretos = [m for m in ms if not (regra["negavel"] and _negado(t, m.start()))]
            if diretos:
                m = diretos[0]
                r.erro(4, tr.onde, t_orig, "%s ('%s'): %s" % (regra["rotulo"], m.group(0), regra["msg"]),
                       regra["origem"])
            elif ms:
                m = ms[0]
                r.aviso(5, tr.onde, t_orig, "%s negado na mesma oração ('%s'): conferir o sentido (%s)"
                        % (regra["rotulo"], m.group(0), regra["msg"]), regra["origem"])
        for m in catalogo.CONCORRENTES.finditer(t):
            nome = m.group(0)
            if nome in catalogo.CONCORRENTES_AMBIGUOS:
                r.aviso(5, tr.onde, t_orig, "'%s' é nome de concorrente e também verbo: conferir o sentido" % nome,
                        "BASE/PROIBIDO.md P27")
            else:
                r.erro(4, tr.onde, t_orig, "concorrente pelo nome ('%s'): nunca, nem pra comparar" % nome,
                       "BASE/PROIBIDO.md P27")
        if tr.tipo in ("narracao", "visivel") and RX_BASTIDOR.search(t):
            r.erro(4, tr.onde, t_orig, "bastidor no texto publicado ('%s'): id de fato, nome de arquivo ou 'minha "
                   "base' ficam só nas Fontes" % RX_BASTIDOR.search(t).group(0), "BASE/PROIBIDO.md P33")
        if comum.tem_travessao(t_orig):
            r.erro(4, tr.onde, t_orig, "travessão, meia-risca ou outro traço longo (zero travessão em fala, tela e "
                   "legenda)", ORIGEM_TRAVESSAO)
        if RX_GOVBR.search(t):
            if F071 in t:
                r.aviso(4, tr.onde, t_orig, "'gov.br' na frase do F071 ('você só confirma na sua conta gov.br'): "
                        "conferir o contexto (o app prepara, o titular só confirma)", ORIGEM_GOVBR)
            else:
                r.erro(4, tr.onde, t_orig, "'gov.br' fora da frase do F071: o caminho é o app", ORIGEM_GOVBR)
        so = re.sub(r"^[^a-z0-9]+|[^a-z0-9]+$", "", t)  # o rótulo sozinho na tela ("Paga", "✓ Liquidada")
        pago = RX_PAGO.search(t) or RX_PAGO_STATUS.search(t) or RX_PAGAMENTO_OK.search(t) or \
            RX_PAGO_ROTULO.search(t) or RX_LIQUIDADO.search(t) or (so in SO_STATUS)
        if pago:
            achado = pago.group(0) if hasattr(pago, "group") else t.strip()
            if tr.tipo == "narracao":
                r.aviso(5, tr.onde, t_orig, "pagamento como status na narração ('%s'): conferir (o app não confirma "
                        "pagamento)" % achado, ORIGEM_PAGO)
            else:
                r.erro(4, tr.onde, t_orig, "pagamento como status em texto na tela ('%s'): o app não confirma "
                       "pagamento (nada de 'pago', 'Status: paga', 'Pagamento OK', 'Liquidada', verde ou confete)"
                       % achado, ORIGEM_PAGO)
        # regra 5: avisos
        if RX_QUITADO.search(t):
            r.aviso(5, tr.onde, t_orig, "'quitado': conferir (o app não confirma pagamento)")
        if "voce mesmo" in t and not any(x in t for x in (norm("faz você mesmo"), norm("faça você mesmo"))):
            r.aviso(5, tr.onde, t_orig, "'você mesmo': conferir se não orienta a fazer sozinho (P38)")
        if "site do governo" in t:
            r.aviso(5, tr.onde, t_orig, "'site do governo': conferir o sentido (o guia promete 'sem entrar no site do "
                    "governo'; nunca mandar a pessoa pro site)")
        if RX_NA_HORA.search(t):
            r.aviso(5, tr.onde, t_orig, "'na hora': conferir que não promete prazo de abertura (PROIBIDO P01)",
                    "BASE/PROIBIDO.md P01")
    # regras 6 e 7: origem das telas e das imagens de camada que são tela
    for onde, item, via in telas or []:
        if item is None:
            r.erro(7, onde, "", "a origem não foi achada no catálogo de telas (%s): tela sem origem não entra em peça "
                   "nenhuma (monte pela receita da peça, com a captura do catálogo; print de fora ou captura copiada "
                   "com outro nome não passa)" % via)
            continue
        if item.get("status") == "reprovado":
            r.erro(7, onde, "", "a captura de origem %s está reprovada no catálogo (%s)"
                   % (item["id"], item.get("resumo") or item.get("motivo") or "ver KIT/telas-revisao/REVISAO.md"))
        if estrito and item.get("servePecaMei") is not True:
            r.erro(6, onde, "", "%s e a captura de origem %s não serve peça de MEI (servePecaMei %s%s): pode mostrar "
                   "valor de guia ou ser só de ME (F063)"
                   % (rotulo_mei, item["id"], item.get("servePecaMei"), ("; " + item["resumo"]) if item.get("resumo")
                      else ""))
    return r


def roda(peca, roteiro=None):
    props = peca.le_props()  # recusa props com "peca" de outra pasta
    base = Base()
    rot = acha_roteiro(peca, roteiro)
    trechos = []
    avisos_extra = []
    if rot:
        trechos += trechos_roteiro(rot)
    else:
        avisos_extra.append("sem roteiro (roteiro.md ou voz/roteiro.md): conferi só o texto das props")
    trechos += trechos_props(props)
    r = confere(trechos, props, base, telas_da_peca(props))
    for a in avisos_extra:
        r.aviso(5, "peça", "", a)
    publico = (props.get("fatos") or {}).get("publico")
    doc = {
        "versao": 2,
        "versaoRegras": VERSAO_REGRAS,
        "peca": peca.nome,  # o nome da PASTA (as props com "peca" de outra pasta são recusadas antes)
        "cena": peca.nome_cena,
        "props": os.path.basename(peca.props),
        "propsMd5": escrita.md5(peca.props),
        "roteiro": rot,
        "roteiroMd5": escrita.md5(rot) if rot else None,
        "publico": publico,
        "conferidaComoMei": catalogo.publico_estrito(publico),
        "feitoEm": datetime.datetime.now().isoformat(timespec="seconds"),
        "base": {"fatos": FATOS_MD, "fatosMd5": escrita.md5(FATOS_MD), "proibido": PROIBIDO_MD,
                 "proibidoMd5": escrita.md5(PROIBIDO_MD), "fatosIndexados": len(base.fatos),
                 "datasIndexadas": len(base.idx_data),
                 "valoresProibidos": sorted("%s (%s)" % (t, p) for p, t in base.proibidos.values())},
        "trechosConferidos": len(trechos),
        "erros": r.erros,
        "avisos": r.avisos,
        "numeros": r.numeros,
        "regras": REGRAS,
        "ok": not r.erros,
    }
    saida = peca.fatos
    escrita.grava_json(saida, doc, cria_pasta=True)
    return doc, saida


def problemas_trava(peca):
    """[] quando a trava de fatos gravada (qc/fatos<sufixo>.json) está ok pras props, o roteiro, a base e as regras de
    hoje; senão, o que falta, uma frase por problema. O render, a junção e a entrega exigem a lista vazia (portao.py)."""
    cmd = "kit.py fatos %s%s" % (peca.nome, (" --cena " + peca.nome_cena) if peca.sufixo else "")
    if not os.path.isfile(peca.fatos):
        return ["a trava de fatos não rodou (falta %s): rode %s" % (comum.barra(os.path.relpath(peca.fatos, peca.pasta)),
                                                                     cmd)]
    try:
        doc = comum.le_json(peca.fatos)
    except ValueError as e:
        return ["%s ilegível (%s): rode %s" % (peca.fatos, e, cmd)]
    probs = []
    erros = doc.get("erros") or []
    if doc.get("ok") is not True or erros:
        probs.append("a trava de fatos deu %d erro(s), o primeiro: %s (conserte o texto, ou declare o exemplo com a "
                     "origem, e rode %s)" % (len(erros), (erros[0].get("mensagem") if erros else "ok falso"), cmd))
    if doc.get("versaoRegras") != VERSAO_REGRAS:
        probs.append("a trava foi gravada com regras de outra versão (%s; hoje %s): rode %s"
                     % (doc.get("versaoRegras") or "antes de 03/10", VERSAO_REGRAS, cmd))
    if not os.path.isfile(peca.props):
        probs.append("as props não existem (%s)" % peca.props)
    elif doc.get("propsMd5") != escrita.md5(peca.props):
        probs.append("as props mudaram depois da trava de fatos: rode %s" % cmd)
    rot_doc = doc.get("roteiro")
    rot_hoje = acha_roteiro(peca)
    if rot_doc and os.path.isfile(rot_doc):
        if doc.get("roteiroMd5") != escrita.md5(rot_doc):
            probs.append("o roteiro mudou depois da trava de fatos (%s): rode %s" % (rot_doc, cmd))
    elif rot_doc:
        probs.append("o roteiro conferido não existe mais (%s): rode %s" % (rot_doc, cmd))
    elif rot_hoje:
        probs.append("a trava rodou sem roteiro e agora a peça tem %s: rode %s" % (rot_hoje, cmd))
    base = doc.get("base") or {}
    if base.get("fatosMd5") != escrita.md5(FATOS_MD) or base.get("proibidoMd5") != escrita.md5(PROIBIDO_MD):
        probs.append("o FATOS ou o PROIBIDO mudou depois da trava de fatos: rode %s" % cmd)
    return probs


def main(argv=None):
    comum.utf8()
    ap = argparse.ArgumentParser(prog="fatos.py", description="Trava de conteúdo do kit (K07, seção 7.2).")
    ap.add_argument("peca")
    ap.add_argument("--cena")
    ap.add_argument("--roteiro", help="outro roteiro (padrão <peça>/roteiro.md ou <peça>/voz/roteiro.md)")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    try:
        peca = comum.Peca(a.peca, a.cena)
        doc, saida = roda(peca, a.roteiro)
    except (comum.ErroSaida, escrita.EscritaRecusada) as e:
        print("erro: %s" % e)
        return getattr(e, "codigo", 1)
    if a.json:
        print(json.dumps(doc, ensure_ascii=False, indent=2))
    else:
        print("fatos: %s (cena %s; roteiro %s)" % (peca.pasta, peca.nome_cena, doc["roteiro"] or "nenhum"))
        print("base: %d fatos indexados; valores proibidos: %s" % (doc["base"]["fatosIndexados"],
                                                                     ", ".join(doc["base"]["valoresProibidos"])))
        print("números (%d):" % len(doc["numeros"]))
        for n in doc["numeros"]:
            fs = ", ".join(n.get("fatos") or ([n["fato"]] if n["fato"] else ["NENHUM"]))
            print("  %-12s %-34s %s" % (n["texto"], fs, n["onde"]))
        print("avisos (%d):" % len(doc["avisos"]))
        for x in doc["avisos"]:
            print("  - %s [%s]" % (x["mensagem"], x["onde"]))
        print("erros (%d):" % len(doc["erros"]))
        for x in doc["erros"]:
            print("  - %s [%s] (origem: %s)" % (x["mensagem"], x["onde"], x["origem"]))
        print("gravado: %s" % saida)
        print("resultado: %s" % ("PASSOU (0 erro)" if doc["ok"] else "ERRO: %d erro(s); o final não sai" % len(doc["erros"])))
    return 0 if doc["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
