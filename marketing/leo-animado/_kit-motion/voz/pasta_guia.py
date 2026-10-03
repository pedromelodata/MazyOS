"""Monta a pasta voz/ da peça do guia (KIT/pecas/guia-pronta-2026-10-14/voz/). Pacote K03, DESENHO.md seções 8 e 11.

Uso (no PY, sempre com -B):
    python -B pasta_guia.py [--forca]

Faz, sempre pelo KIT/lib/escrita.py:
- narr-dylan.wav e narr-pedro-raw.wav: hardlinks (escrita.liga) de GP/vo/; só leitura: nenhum script do kit
  grava por cima de hardlink. O md5 do narr-dylan.wav é conferido contra o REF antes de ligar;
- narracao.json: CÓPIA (escrita.copia, nunca link) da RM/src/guia/narracao.json, conferida pelo md5 do REF
  antes e depois (de548fb7302f40fe57156dae9581d467). É a referência da regressão: nada a reescreve;
- narr-dylan-sem-fecho.wav: o narr-dylan.wav com zeros a partir de 15,0 s, mesmo comprimento (48 kHz, mono,
  16 bits), pra a cenas-kit.json provar o fecho como asset;
- roteiro.md: o roteiro do guia remontado das 50 palavras da narração de referência (7 frases e as chaves
  6, 9, 16, 26, 36, 42 e 49), com título, pilar, público, capa e batidas.
O que já está certo fica como está. Arquivo diferente do esperado para com erro; com --forca a cópia, a voz
sem fecho e o roteiro são refeitos (os hardlinks nunca são regravados).
"""
import argparse
import json
import os
import re
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np  # noqa: E402

import alinha  # noqa: E402  (só o leitor de roteiro; o whisper não é carregado)
import comum  # noqa: E402
from comum import ErroVoz, escrita  # noqa: E402

PECA = "guia-pronta-2026-10-14"
PASTA = os.path.join(comum.KIT, "pecas", PECA)
VOZ_GUIA = os.path.join(PASTA, "voz")
NARRACAO_ORIGINAL = os.path.join(comum.RM, "src", "guia", "narracao.json")
CORTE_FECHO = 15.0
CHAVES = [6, 9, 16, 26, 36, 42, 49]
LIGAR = [("narr-dylan.wav", os.path.join(comum.GP, "vo", "narr-dylan.wav"), comum.MD5_NARR_DYLAN_REF),
         ("narr-pedro-raw.wav", os.path.join(comum.GP, "vo", "narr-pedro-raw.wav"), None)]

CABECALHO = """# Roteiro: O app fazendo a guia do mês, sem site do governo

Peça de 14/10/2026 (reel da guia, motion 3D). Roteiro remontado em 02/10/2026 pelo `KIT/voz/pasta_guia.py`
a partir das 50 palavras da narração aprovada (`RM/src/guia/narracao.json`, conferida pelo md5 do REF). É o
roteiro que o `alinha.py` usa na regressão do kit. O texto de cada palavra é o da legenda aprovada.

## Título

O app fazendo a guia do mês, sem site do governo

## Pilar

17, Facilidade do app: a tela do app fazendo o trabalho (demonstração vale mais que promessa).

## Público

Não declarado na cena do guia (`fatos.publico` null: a regressão espera esse aviso). O valor que aparece na
tela é fictício (empresa de exemplo do app, declarado em `fatos.exemplos` da cena) e não é guia de MEI (F063).

## Capa

- Título: O app fazendo a guia do mês
- Destaque: guia

## Narração

<!-- Uma frase da legenda por linha; a palavra-chave entre asteriscos. -->

"""

BATIDAS = """
## Batidas

| palavra | batida | o que a imagem faz |
|---|---|---|
| Veja (0) | gancho-giro-varredura, em 0 s | o aparelho gira e assenta com mola, a câmera aproxima devagar e uma varredura de luz passa na lateral |
| sem (9) | nao-de-cabeca, 0,02 s antes da palavra | o aparelho balança a cabeça num "não" de personagem |
| pausa depois de "governo." | mergulho-abre-app, em 3,6 s | a câmera mergulha na tela e o app abre |
| sistema (16) e calcula (17) | card-contador | o card acende em coral, o valor conta até o número fictício da cena e o brilho passa no esqueleto do botão |
| e emite (20 e 21) | empurrar-tela, em 5,7 s | a tela do imposto entra pela direita e a anterior recua |
| a guia (22 e 23) até pronta (26) | objeto-sai-da-tela, nasce em 6,08 s e assenta 0,05 s antes de "pronta," | a guia de papel nasce na tela, voa, assenta de frente e sai pela esquerda |
| com o dia que vence (27 a 31) | relogio-notificacao, em 7,8 s | o relógio entra com o aviso do app no mostrador, vibra duas vezes e sai |
| A sua parte (32 a 34) | flip-troca-escondida, em 8,98 s | o aparelho dá uma volta no ar e a tela troca escondida no verso |
| só pagar (36 e 37) | toque-botao, na palavra 37 | pulso no "só", toque e aperto no "pagar", e o botão mostra o retorno do app |
| prévia real (41 e 42) | recuo-camera, em 10,95 s, com a varredura 0,1 s antes de "real" | a câmera recua, a luz varre o aparelho e ele gira devagar mostrando a tela |
| Chegando em breve (47 a 49) e o fecho | fecho-simbolo e link-bio | o app fecha no splash, o aparelho encolhe até o símbolo do logo, entra "Vai," com o logo e o "aí" acende quando é falado; a pílula do LINK DA BIO entra junto |
| fim do vídeo | volta-loop, 0,95 s antes do fim | o aparelho nasce do símbolo e volta pra pose do quadro 0 (loop) |
"""


def linhas_do_roteiro(narr):
    """Uma linha por frase da narração, com a palavra-chave entre asteriscos (pontuação fora deles)."""
    linhas = []
    for p in narr["phrases"]:
        toks = []
        for i in p["w"]:
            t = narr["words"][i]["t"]
            if i == p["key"]:
                m = re.match(r"^(.*?)([.,!?;:]*)$", t)
                toks.append("*%s*%s" % (m.group(1), m.group(2)))
            else:
                toks.append(t)
        linhas.append(" ".join(toks))
    return linhas


def texto_roteiro(narr):
    return CABECALHO + "\n".join(linhas_do_roteiro(narr)) + "\n" + BATIDAS


def confere_roteiro(caminho, narr):
    """O roteiro lido pelo alinha.py tem de dar as mesmas palavras, frases e chaves da narração de referência."""
    frases = alinha.le_roteiro(caminho)
    textos = [t["texto"] for f in frases for t in f["tokens"]]
    if textos != [w["t"] for w in narr["words"]]:
        raise ErroVoz("o roteiro não dá as mesmas 50 palavras da referência")
    k0, chaves, ws = 0, [], []
    for f in frases:
        idx = list(range(k0, k0 + len(f["tokens"])))
        k0 += len(f["tokens"])
        marcadas = [idx[j] for j, t in enumerate(f["tokens"]) if t["chave"]]
        chaves.append(marcadas[0] if marcadas else idx[-1])
        ws.append(idx)
    if ws != [p["w"] for p in narr["phrases"]] or chaves != [p["key"] for p in narr["phrases"]]:
        raise ErroVoz("o roteiro não dá as mesmas frases e chaves da referência")
    return len(textos), len(frases), chaves


def monta(forca=False):
    rel = []
    if not os.path.isdir(VOZ_GUIA):
        os.makedirs(VOZ_GUIA)  # pasta exclusiva do K03
        rel.append("criei a pasta %s" % comum.barra(VOZ_GUIA))

    # 1. hardlinks
    for nome, origem, md5_ref in LIGAR:
        if md5_ref and escrita.md5(origem) != md5_ref:
            raise ErroVoz("%s mudou desde o REF: pare e avise" % comum.barra(origem))
        info = escrita.liga(origem, os.path.join(VOZ_GUIA, nome))
        rel.append("%s: hardlink de %s (st_nlink %d, %d bytes)" % (nome, comum.barra(origem), info["st_nlink"],
                                                                   info["tamanho"]))

    # 2. cópia conferida da narração de referência
    if escrita.md5(NARRACAO_ORIGINAL) != comum.MD5_NARRACAO_REF:
        raise ErroVoz("a RM/src/guia/narracao.json mudou desde o REF: pare e avise")
    destino = os.path.join(VOZ_GUIA, "narracao.json")
    if os.path.exists(destino) and escrita.md5(destino) == comum.MD5_NARRACAO_REF and os.stat(destino).st_nlink == 1:
        rel.append("narracao.json: cópia já conferida (md5 do REF, st_nlink 1)")
    else:
        if os.path.exists(destino) and not forca:
            raise ErroVoz("voz/narracao.json existe e não é a cópia do REF; confira e rode com --forca pra refazer")
        escrita.copia(NARRACAO_ORIGINAL, destino, forca=False)
        rel.append("narracao.json: copiada da RM/src/guia/narracao.json")
    st = os.stat(destino)
    if escrita.md5(destino) != comum.MD5_NARRACAO_REF or st.st_nlink != 1:
        raise ErroVoz("a cópia da narração não conferiu (md5 ou st_nlink)")
    with open(destino, "r", encoding="utf-8") as f:
        narr = json.load(f)

    # 3. voz sem o fecho
    sr, ch, x = comum.le_wav16(os.path.join(VOZ_GUIA, "narr-dylan.wav"))
    x = x[:, 0]
    i0 = int(round(CORTE_FECHO * sr))
    sem = x.copy()
    sem[i0:] = 0
    destino = os.path.join(VOZ_GUIA, "narr-dylan-sem-fecho.wav")
    if os.path.exists(destino):
        sr2, ch2, y = comum.le_wav16(destino)
        if sr2 == sr and ch2 == 1 and np.array_equal(y[:, 0], sem):
            rel.append("narr-dylan-sem-fecho.wav: já confere")
        elif not forca:
            raise ErroVoz("voz/narr-dylan-sem-fecho.wav existe e não confere; rode com --forca pra refazer")
        else:
            escrita.grava_bytes(destino, comum.wav_bytes(sem))
            rel.append("narr-dylan-sem-fecho.wav: refeito")
    else:
        escrita.grava_bytes(destino, comum.wav_bytes(sem))
        rel.append("narr-dylan-sem-fecho.wav: gravado")
    sr2, ch2, y = comum.le_wav16(destino)
    y = y[:, 0]
    if not (sr2 == sr == comum.SR and ch2 == 1 and len(y) == len(x) and np.array_equal(y[:i0], x[:i0])
            and not y[i0:].any()):
        raise ErroVoz("a voz sem fecho não conferiu")
    rel.append("  %d amostras (%s s) iguais ao narr-dylan.wav até %s s e zeros depois (%d amostras zeradas)"
               % (len(y), comum.fmt(len(y) / sr, 6), comum.fmt(CORTE_FECHO, 1), len(y) - i0))

    # 4. roteiro
    destino = os.path.join(VOZ_GUIA, "roteiro.md")
    texto = texto_roteiro(narr)
    if os.path.exists(destino):
        with open(destino, "r", encoding="utf-8") as f:
            atual = f.read()
        if atual == texto:
            rel.append("roteiro.md: já confere")
        elif not forca:
            raise ErroVoz("voz/roteiro.md existe e é diferente do remontado; rode com --forca pra refazer")
        else:
            escrita.grava_texto(destino, texto)
            rel.append("roteiro.md: refeito")
    else:
        escrita.grava_texto(destino, texto)
        rel.append("roteiro.md: gravado")
    n, nf, chaves = confere_roteiro(destino, narr)
    if chaves != CHAVES:
        raise ErroVoz("chaves do roteiro %s, esperado %s" % (chaves, CHAVES))
    rel.append("  lido pelo alinha.py: %d palavras, %d frases, chaves %s" % (n, nf, ", ".join(map(str, chaves))))
    return rel


def _main(argv):
    comum.utf8()
    ap = argparse.ArgumentParser(description="Monta a pasta voz/ da peça do guia.")
    ap.add_argument("--forca", action="store_true", help="refaz a cópia, a voz sem fecho e o roteiro se diferirem")
    a = ap.parse_args(argv)
    try:
        for linha in monta(a.forca):
            print(linha)
    except (ErroVoz, escrita.EscritaRecusada, escrita.DiscoInsuficiente) as e:
        print("erro: %s" % e, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
