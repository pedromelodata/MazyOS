"""Entrega do final na pasta da proposta (pacote K07). Contrato: KIT/DESENHO.md, seção 7.5; memória
feedback-pasta-final-por-proposta.

- Raiz: FINAL (padrão) ou --raiz-final <pasta> (os testes usam sempre uma raiz falsa no scratchpad).
- Pasta: <raiz>/<dataPost> <titulo>/ (o título da proposta, como no reel.md; vem das props). Título vazio ou dataPost
  que não seja uma data AAAA-MM-DD de verdade (o "AAAA-MM-DD" do modelo, por exemplo) são recusados.
- Versão anterior (mesmo nome base ou qualquer mp4 anterior da proposta): vai pra
  <raiz>/_versoes-anteriores/<dataPost> <titulo>/ por move (nunca apaga). Se ela tiver st_nlink > 1, avisa que
  ela também existe em outro lugar e procura a outra ocorrência pelo inode em C:/Users/EDIT-ADMIN/Videos/ (até 2
  níveis, só leitura; --videos troca a pasta, pro teste) e mostra o caminho.
- Final novo: entra por hardlink (escrita.liga com permite_final=True); nunca sobrescreve (nome que já existe é
  erro). Se o mesmo arquivo já está entregue (mesmo inode), não faz nada.
- Mostra a linha pra pôr no FINAL/LEIA-ME.md, sem editar esse arquivo.
- Peça de teste (nome da PASTA começando com "_") só entrega numa raiz falsa (--raiz-final): trava contra entregar
  teste no FINAL de verdade (na raiz real, só --simula, que não grava nada).
- Portões (rodada 4, 03/10; portao.py): a entrega exige a trava de fatos ok das props de hoje e o relatório do
  confere ok do mesmo mp4 que vai ser entregue (o md5 do arquivo, também com --arquivo) e das mesmas props. Sem opção
  de ignorar; peça de teste passa com aviso. As props com "peca" de outra pasta são recusadas.

Uso (sempre com python -B):
    python -B entregar.py <peça> [--cena <arquivo>] [--raiz-final <pasta>] [--videos <pasta>] [--nome <arquivo.mp4>]
                          [--arquivo <mp4>] [--simula]
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import datetime  # noqa: E402
import os  # noqa: E402
import re  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
import portao  # noqa: E402
from comum import escrita  # noqa: E402

_PROIBIDOS_NOME = re.compile(r'[<>:"/\\|?*]')
_VERSAO = re.compile(r"(?i)([-_ ]v\d+|[-_ ]\d{8,}|[ ]\(.*\))$")
_DATA = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def data_valida(texto):
    """AAAA-MM-DD e uma data que existe (2026-02-30 não)."""
    if not isinstance(texto, str) or not _DATA.match(texto):
        return False
    try:
        datetime.date.fromisoformat(texto)
        return True
    except ValueError:
        return False


def nome_base(nome):
    """Nome sem extensão e sem o sufixo de versão (-v4, data, '(anterior ...)')."""
    b = os.path.splitext(nome)[0]
    while True:
        n = _VERSAO.sub("", b)
        if n == b:
            return b.casefold()
        b = n


def procura_inode(alvo, pasta, niveis=2):
    """Outras ocorrências (hardlinks) de `alvo` dentro de `pasta`, até `niveis` níveis, só leitura."""
    try:
        st = os.stat(alvo)
    except OSError:
        return []
    achados = []
    if not os.path.isdir(pasta):
        return achados

    def anda(p, nivel):
        try:
            with os.scandir(p) as it:
                for e in it:
                    try:
                        if e.is_symlink():
                            continue
                        if e.is_file(follow_symlinks=False):
                            # no Windows o DirEntry.stat() vem com st_ino e st_dev zerados: só o os.stat traz o inode
                            s = os.stat(e.path, follow_symlinks=False)
                            if s.st_ino == st.st_ino and s.st_dev == st.st_dev and \
                                    comum.barra(os.path.abspath(e.path)).casefold() != comum.barra(os.path.abspath(alvo)).casefold():
                                achados.append(comum.barra(e.path))
                        elif e.is_dir(follow_symlinks=False) and nivel < niveis:
                            anda(e.path, nivel + 1)
                    except OSError:
                        continue
        except OSError:
            return

    anda(pasta, 1)
    return achados


def destino_livre(pasta, nome):
    """Nome que ainda não existe na pasta (acrescenta a data de modificação e um número, se precisar)."""
    alvo = os.path.join(pasta, nome)
    if not os.path.lexists(alvo):
        return alvo
    raiz, ext = os.path.splitext(nome)
    for i in range(1, 100):
        cand = os.path.join(pasta, "%s (anterior %d)%s" % (raiz, i, ext))
        if not os.path.lexists(cand):
            return cand
    raise comum.ErroSaida("não achei nome livre em %s pra %s" % (pasta, nome))


def entrega(peca, raiz=None, videos=None, nome=None, arquivo=None, simula=False, so_mesmo_nome=False):
    raiz = comum.barra(os.path.abspath(raiz)) if raiz else escrita.FINAL
    videos = comum.barra(os.path.abspath(videos)) if videos else escrita.VIDEOS
    raiz_real = raiz.casefold() == escrita.FINAL.casefold()
    if peca.nome.startswith("_") and raiz_real:
        if not simula:
            raise comum.ErroSaida("a peça %s é de teste (nome começa com '_'): só entrega numa raiz falsa (--raiz-final)"
                                  % peca.nome, 2)
        print("(peça de teste na raiz real: só simulação; a entrega de verdade é recusada)")
    props = peca.le_props()
    titulo = (props.get("titulo") or "").strip()
    data = (props.get("dataPost") or "").strip()
    if not titulo:
        raise comum.ErroSaida("as props não têm titulo (o título da proposta): preencha \"titulo\" na cena e rode "
                              "kit.py props de novo", 2)
    if not data_valida(data):
        raise comum.ErroSaida("o dataPost das props não é uma data AAAA-MM-DD (%r): preencha \"dataPost\" na cena com a "
                              "data do post e rode kit.py props de novo (a pasta final é <dataPost> <titulo>)"
                              % props.get("dataPost"), 2)
    if comum.tem_travessao(titulo):
        raise comum.ErroSaida("o título tem travessão: %s" % titulo, 2)
    if _PROIBIDOS_NOME.search(titulo):
        raise comum.ErroSaida("o título tem caractere que não pode em nome de pasta (<>:\"/\\|?*): %s" % titulo, 2)
    proposta = ("%s %s" % (data, titulo)).strip()
    origem = comum.barra(os.path.abspath(arquivo)) if arquivo else peca.final()
    if not os.path.isfile(origem):
        raise comum.ErroSaida("o final não existe: %s (rode kit.py juncao e confere antes)" % origem, 2)
    # portões: a trava de fatos das props de hoje e o relatório do confere deste mp4 (sem opção de ignorar; peça de
    # teste passa com aviso)
    avisos_portao = portao.exige(peca, "a entrega", portao.problemas_fatos(peca) +
                                 portao.problemas_relatorio(peca, origem))
    nome = nome or ("%s%s.mp4" % (peca.nome, peca.sufixo))
    if _PROIBIDOS_NOME.search(nome) or not nome.lower().endswith(".mp4"):
        raise comum.ErroSaida("nome de arquivo inválido: %s" % nome, 2)
    pasta = comum.barra(os.path.join(raiz, proposta))
    pasta_ant = comum.barra(os.path.join(raiz, "_versoes-anteriores", proposta))
    destino = comum.barra(os.path.join(pasta, nome))
    rel = {"raiz": raiz, "raizReal": raiz_real, "pasta": pasta, "origem": origem, "destino": destino, "movidas": [],
           "avisos": list(avisos_portao), "simula": simula}
    print("entrega de %s" % origem)
    print("  pasta da proposta: %s%s" % (pasta, "" if os.path.isdir(pasta) else " (nova)"))

    # já entregue: o mesmo arquivo (mesmo inode) já está na pasta
    if os.path.isdir(pasta):
        for n in sorted(os.listdir(pasta)):
            p = os.path.join(pasta, n)
            if os.path.isfile(p) and os.path.samefile(p, origem):
                print("  já entregue: %s é o mesmo arquivo (mesmo inode); nada a fazer" % comum.barra(p))
                rel["jaEntregue"] = comum.barra(p)
                return rel

    # versões anteriores: mesmo nome base, ou qualquer mp4 anterior da proposta
    anteriores = []
    if os.path.isdir(pasta):
        base = nome_base(nome)
        for n in sorted(os.listdir(pasta)):
            p = os.path.join(pasta, n)
            if not (os.path.isfile(p) and n.lower().endswith(".mp4")):
                continue
            if so_mesmo_nome and nome_base(n) != base:
                rel["avisos"].append("ficou na pasta (outro nome base): %s" % n)
                continue
            anteriores.append(p)
    for p in anteriores:
        st = os.stat(p)
        novo = comum.barra(destino_livre(pasta_ant, os.path.basename(p)))
        item = {"de": comum.barra(p), "para": novo, "st_nlink": st.st_nlink}
        if st.st_nlink > 1:
            outras = procura_inode(p, videos)
            item["outrasOcorrencias"] = outras
            aviso = ("a versão anterior também existe em outro lugar (por exemplo %s/); lá continua a versão antiga: "
                     "trocar à mão" % videos)
            if outras:
                aviso += ". Outra ocorrência: %s" % "; ".join(outras)
            else:
                aviso += ". Em %s (até 2 níveis) não achei outra ocorrência; ela pode estar numa pasta de trabalho" % videos
            rel["avisos"].append(aviso)
            print("  AVISO: %s (st_nlink %d)" % (aviso, st.st_nlink))
        print("  %s versão anterior: %s  ->  %s" % ("moveria" if simula else "move", item["de"], novo))
        if not simula:
            escrita.move(p, novo, permite_final=True, cria_pasta=True)
        rel["movidas"].append(item)

    # final novo por hardlink, sem sobrescrever
    if os.path.lexists(destino) and not simula:
        raise comum.ErroSaida("já existe %s e não é o mesmo arquivo: nada foi ligado" % destino)
    print("  %s final: %s  ->  %s" % ("ligaria" if simula else "liga", origem, destino))
    if not simula:
        info = escrita.liga(origem, destino, permite_final=True, cria_pasta=True)
        rel["liga"] = info
        print("  ok: st_nlink %d, %d bytes" % (info["st_nlink"], info["tamanho"]))
    hoje = datetime.date.today().strftime("%d/%m/%Y")
    linha = "- `%s/%s`: final de %s (kit de motion, peça `%s`)" % (proposta, nome, hoje, peca.nome)
    if anteriores:
        linha += "; a versão anterior foi pra `_versoes-anteriores/%s/`" % proposta
    cred = props.get("creditoLegenda")
    if cred:
        linha += ". Crédito na legenda do post: \"%s\"" % cred
    rel["linhaLeiaMe"] = linha
    print("\nLinha pro %s/LEIA-ME.md (não editei o arquivo):\n%s" % (raiz, linha))
    return rel


def main(argv=None):
    comum.utf8()
    ap = argparse.ArgumentParser(prog="entregar.py", description="Entrega o final na pasta da proposta (K07).")
    ap.add_argument("peca")
    ap.add_argument("--cena")
    ap.add_argument("--raiz-final", help="raiz da pasta final (padrão FINAL; testes: uma raiz falsa)")
    ap.add_argument("--videos", help="onde procurar a outra ocorrência da versão anterior (padrão Vídeos/)")
    ap.add_argument("--nome", help="nome do arquivo na pasta da proposta (padrão <peça><sufixo>.mp4)")
    ap.add_argument("--arquivo", help="o mp4 a entregar (padrão saida/<peça><sufixo>.mp4)")
    ap.add_argument("--so-mesmo-nome", action="store_true",
                    help="só trata como versão anterior o mp4 de mesmo nome base (os outros ficam, com aviso)")
    ap.add_argument("--simula", action="store_true")
    a = ap.parse_args(argv)
    try:
        peca = comum.Peca(a.peca, a.cena)
        entrega(peca, a.raiz_final, a.videos, a.nome, a.arquivo, a.simula, a.so_mesmo_nome)
    except (comum.ErroSaida, escrita.EscritaRecusada) as e:
        print("erro: %s" % e)
        return getattr(e, "codigo", 1)
    return 0


if __name__ == "__main__":
    sys.exit(main())
