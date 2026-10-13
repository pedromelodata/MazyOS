import json, re
W = json.load(open(r"C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion/src/cinco/legenda.json", encoding="utf-8"))["words"]
FPS, OFF = 30, 0.25
nrm = lambda s: re.sub(r"[^\w%.]", "", s.lower()).rstrip(".")


def idx(txt, n=1):
    c = 0
    for i, w in enumerate(W):
        if nrm(w["t"]) == nrm(txt):
            c += 1
            if c == n:
                return i
    raise SystemExit("palavra " + txt)


fq = lambda t: int(round(t * FPS))
tc = lambda f: "0:00:%02d:%02d" % (f // FPS, f % FPS)
FR = [("Ainda", 1, "CPF?", 1), ("Cinco", 1, "CNPJ.", 1), ("Um:", 1, "fixa.", 1), ("Fature", 1, "mês.", 1), ("Dois:", 1, "6%,", 1),
      ("de*", 0, "bolso.", 1), ("Três:", 1, "aposentadoria.", 1), ("Quatro:", 1, "calcula.", 1), ("Você", 1, "paga.", 1),
      ("Cinco:", 2, "honorário.", 1), ("clique", 1, "chegando.", 1)]
plan, dst, mapa = [], 3, {}
for k, (a, na, b, nb) in enumerate(FR):
    ia = idx("6%,") + 1 if a == "de*" else idx(a, na)
    ib = idx(b, nb)
    si = max(0, fq(W[ia]["s"] - OFF) - 2)
    so = fq(W[ib]["e"] - OFF) + 2
    plan.append((k + 1, si, so, dst, ia, ib))
    for i in range(ia, ib + 1):
        mapa[i] = dst + (fq(W[i]["s"] - OFF) - si)
    dst += (so - si) + 1
fim_narr = plan[-1][3] + plan[-1][2] - plan[-1][1]
FI = fim_narr + 4
TOTAL = 1200
P, T = "papel", "tinta"
# tomadas: (entrada, fundo, camadas). Camada: (texto, estilo, px, cor, x, y); x None = centro (540)
TOM = [
    (("Ainda", 1), P, [("Ainda recebe pelo", "Sora", 72, "tinta", None, 860), ("seu trabalho", "Sora", 150, "tinta", None, 1010)]),
    (("no", 1), T, [("no", "Sora", 80, "papel", None, 820), ("CPF?", "Sora", 260, "coral", None, 1050)]),
    (("Cinco", 1), P, [("5", "Sora", 520, "coral", None, 920), ("motivos", "Serif", 170, "tinta", None, 1240), ("FITA", "", 0, "", None, 0)]),
    (("pra", 1), T, [("pra ter", "Sora", 90, "papel", None, 820), ("CNPJ.", "Sora", 230, "coral", None, 1040)]),
    (("Um:", 1), P, [("1", "Sora", 460, "coral", None, 860), ("no MEI,", "Sora", 120, "tinta", None, 1150)]),
    (("a", 1), T, [("a guia é", "Sora", 100, "papel", None, 850), ("fixa.", "Serif", 230, "coral", None, 1060)]),
    (("Fature", 1), P, [("Fature de", "Sora", 100, "tinta", None, 820), ("R$ 1", "Sora", 300, "coral", None, 1080)]),
    (("até", 1), T, [("até o teto de", "Sora", 90, "papel", None, 760), ("R$ 81 mil", "Sora", 200, "coral", None, 960), ("por ano", "Sora", 80, "papel", None, 1110)]),
    (("exatamente", 1), P, [("exatamente", "Serif", 190, "coral", None, 980)]),
    (("6.750", 1), P, [("R$ 6.750", "Sora", 230, "tinta", None, 930), ("por mês", "Serif", 140, "coral", None, 1110), ("FITA", "", 0, "", None, 0)]),
    (("Dois:", 1), T, [("2", "Sora", 460, "coral", None, 880), ("numa microempresa", "Sora", 96, "papel", None, 1130)]),
    (("que", 1), P, [("que começa em", "Sora", 96, "tinta", None, 780), ("6%", "Sora", 420, "coral", None, 1100)]),
    (("de*", 0), T, [("de R$ 10 mil,", "Sora", 96, "papel", None, 760), ("R$ 600", "Sora", 240, "coral", None, 980), ("de imposto", "Sora", 90, "papel", None, 1130)]),
    (("e*", 0), P, [("R$ 9.400", "Sora", 230, "tinta", None, 930), ("no bolso.", "Serif", 170, "coral", None, 1120)]),
    (("Três:", 1), T, [("3", "Sora", 460, "coral", None, 880), ("na microempresa,", "Sora", 96, "papel", None, 1130)]),
    (("seu", 2), P, [("IMG 12-tela-pro-labore.png escala 31%, giro -5, sombra", "", 0, "", None, 730), ("seu salário", "Sora", 110, "tinta", None, 1270), ("de dono", "Serif", 150, "coral", None, 1420)]),
    (("recolhe", 1), T, [("recolhe", "Sora", 100, "papel", None, 840), ("INSS", "Sora", 260, "coral", None, 1080)]),
    (("pra", 2), P, [("pra sua", "Sora", 100, "tinta", None, 860), ("aposentadoria.", "Serif", 125, "coral", None, 1040), ("FITA", "", 0, "", None, 0)]),
    (("Quatro:", 1), T, [("IMG 13-celular-imposto.png escala 72%", "", 0, "", 760, 900), ("4", "Sora", 380, "coral", 280, 720), ("o app", "Sora", 90, "papel", 280, 980), ("calcula.", "Serif", 120, "coral", 300, 1140)]),
    (("Você", 1), P, [("IMG 11-tela-emitir-nota.png escala 32%, sombra", "", 0, "", None, 700), ("Você emite a nota", "Sora", 90, "tinta", None, 1290), ("e paga.", "Serif", 150, "coral", None, 1430)]),
    (("Cinco:", 2), T, [("5", "Sora", 460, "coral", None, 880), ("a abertura", "Sora", 110, "papel", None, 1140)]),
    (("é", 2), P, [("IMG 14-celular-empresa-nasceu.png escala 72%", "", 0, "", 760, 900), ("é com a", "Sora", 90, "tinta", 280, 860), ("gente,", "Serif", 150, "coral", 290, 1020)]),
    (("sem", 1), T, [("sem", "Sora", 110, "papel", None, 840), ("honorário.", "Serif", 180, "coral", None, 1040)]),
    (("clique", 1), P, [("clique no", "Sora", 100, "tinta", None, 820), ("PILULA coral 620x150, cantos 75", "", 0, "", None, 1030), ("LINK DA BIO", "Sora", 80, "branco", None, 1058)]),
    (("e*2", 0), T, [("entre na", "Sora", 90, "papel", None, 760), ("lista de espera", "Serif", 150, "coral", None, 940), ("do app que tá chegando.", "Sora", 64, "papel", None, 1100)]),
]
ini = []
for (p, n), fundo, cam in TOM:
    if p == "de*":
        i = idx("6%,") + 1
    elif p == "e*":
        i = idx("9.400") - 2
    elif p == "e*2":
        i = idx("entre") - 1
    elif p == "6.750":
        i = idx("6.750")
    else:
        i = idx(p, n)
    ini.append((mapa[i] - 2 if ini else 0, fundo, cam, i))
ini.append((FI - 3, P, [("FECHO", "", 0, "", None, 0)], None))
L = []
L.append("""# Cinco motivos pra ter CNPJ, 40 s, edição manual no After Effects (13/10/2026)

Pedido do Pedro: "acesse meu computador usando o computador use e edite manualmente o vídeo todo, fazendo tudo de forma
manual, mexendo na timeline, adicionando efeitos, como um editor mesmo" e "Fazendo cortes, adicionando músicas e etc.
Faça o vídeo com duração de 40 segundos, seguindo esse modelo de motion" (pin "Motion inspiration - Frames", de
imran__visuals: corte seco a cada 1 a 2 s, fundo creme e fundo preto com luz se alternando, tipografia bold com uma
palavra em vermelho, objeto recortado, fita curva cruzando a tela, tela de app). Ele quer saber o desempenho e o custo.

Tudo na interface do AE, à mão (sem script). Material em `material/`. Projeto: `CINCO-40S-MANUAL.aep` nesta pasta.

## Estilo (a marca Legalizaí no lugar do vermelho da referência)

- Comp `CINCO-40S`: 1080 x 1920, 30 qps, 0:00:40:00, motion blur ligado na comp e em toda camada que se mexe.
- **papel:** sólido #FAF8F5, texto #15171C. **tinta:** sólido #15171C com a Rampa de gradiente radial (#2A2E38 no
  meio, #0E0F12 na borda), texto #FAF8F5. Destaque sempre coral #F2643C; no fundo tinta, o destaque leva Brilho.
- Fontes: **Sora ExtraBold** (texto e números) e **DM Serif Display Italic** (palavra de ênfase). Nenhuma outra.
- Texto centralizado (parágrafo ao centro), x = 540 quando a tabela não diz outro x. Margem: nada fora de x 96 a 984 e
  y 240 a 1560 (fundo e fita podem ir até a borda). Texto não encosta em texto nem em imagem.
- Entrada de cada camada (corte seco, sem saída): Escala 60% no começo da tomada, 106% 4 quadros depois e 100% mais 3
  quadros depois, com Desaceleração suave (F9). A camada de destaque entra 3 quadros depois da primeira, com giro de -4
  a 0. Depois da primeira tomada pronta, duplicar (Ctrl+D), levar pro tempo da próxima (tecla [) e trocar o texto, ou
  copiar e colar os quadros-chave: é o jeito rápido de editor.
- **FITA:** camada de forma feita com a Caneta, uma curva larga cruzando a tela de um canto ao outro, traço #DCD6CE de
  70 px, sem preenchimento, atrás do texto; Aparar caminhos com o Fim de 0 a 100% nos primeiros 10 quadros da tomada.
- **PILULA:** retângulo arredondado coral; texto branco (#FFFFFF) por cima.
- **FECHO** (papel): "Vai," Sora ExtraBold 106 px #15171C, alinhado à esquerda, começando em x 126, y 822;
  `20-logo-ai-tinta.png` a 44,7% com o centro em (659, 822); `21-logo-ai-coral.png` igual, por cima, com a opacidade de
  0 a 100% em 4 quadros a partir de 0:00:39:12 (o "aí" acende quando é dito); pílula LINK DA BIO pequena (330 x 70,
  coral, texto branco Sora ExtraBold 34 px) com o centro em (540, 995), entrando em 0:00:39:20.
- Tela do app (PNG de fundo branco) leva Sombra projetada (preto, 40%, distância 20, suavidade 60).
""")
L.append("## Som\n")
L.append("Narração: importar `01-narracao.wav`, pôr na comp no quadro 0 e fazer 11 cópias. Em cada cópia: ir ao tempo "
         "\"entra\" e Alt+[, ir ao \"sai\" e Alt+], ir ao \"vai pra\" e tecla [. No fim, apagar a camada original.\n")
L.append("| # | trecho | entra (Alt+[) | sai (Alt+]) | vai pra (tecla [) |")
L.append("|---|---|---|---|---|")
for k, si, so, d, ia, ib in plan:
    L.append("| %d | %s | %s | %s | %s |" % (k, " ".join(w["t"] for w in W[ia:ib + 1]), tc(si), tc(so), tc(d)))
L.append("\n- Fecho: `02-fecho-vai-legalizai.wav` inteiro, com a entrada em %s; Níveis de áudio -1,3 dB." % tc(FI))
L.append("- Trilha: `03-trilha-house-one.mp3` (liberada), começando 51,711 s dentro da faixa: coluna Início = -0:00:51:21. "
         "Níveis de áudio: -60 dB em 0, -33 dB em 0:00:00:15, -33 dB em 0:00:38:15, -60 dB em 0:00:40:00.")
L.append("- A narração fica em 0 dB. O nível final (-14 LUFS) é na exportação.\n")
L.append("## Tomadas (corte seco; as camadas da tomada começam no \"de\" e acabam no \"até\")\n")
L.append("| # | de | até | fundo | camadas: texto, fonte, px, cor, (x, y) |")
L.append("|---|---|---|---|---|")
for j, (f, fundo, cam, i) in enumerate(ini):
    f2 = ini[j + 1][0] if j + 1 < len(ini) else TOTAL
    cs = []
    for (tx, fo, px, cor, x, y) in cam:
        if tx == "FITA":
            cs.append("FITA")
        elif tx == "FECHO":
            cs.append("FECHO (ver Estilo)")
        elif tx.startswith("IMG") or tx.startswith("PILULA"):
            cs.append("%s (%d, %d)" % (tx, x or 540, y))
        else:
            fonte = "Sora ExtraBold" if fo == "Sora" else "DM Serif Display Italic"
            cs.append("\"%s\" %s %d %s (%d, %d)" % (tx, fonte, px, cor, x or 540, y))
    L.append("| %d | %s | %s | %s | %s |" % (j + 1, tc(f), tc(f2), fundo, "; ".join(cs)))
L.append("""
## Exportar

Composição > Adicionar à fila do Adobe Media Encoder; H.264, 1080 x 1920, 30 qps, taxa alta; Normalização de volume
(ITU BS.1770) em -14 LUFS com pico -1,5 dB se o AME oferecer; saída `saida/CINCO-40S-MANUAL.mp4` nesta pasta.
""")
open(r"C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/cinco-motivos-ae/manual-40s/ROTEIRO.md", "w", encoding="utf-8").write("\n".join(L))
print("ok", len(ini), "tomadas; fecho", tc(FI), "fim da voz", tc(FI + fq(1.22)))

# JSON pro gerador do AE
tomadas = []
for j, (f, fundo, cam, i) in enumerate(ini):
    f2 = ini[j + 1][0] if j + 1 < len(ini) else TOTAL
    tomadas.append({"n": j + 1, "de": f, "ate": f2, "fundo": fundo, "camadas": [list(c) for c in cam]})
json.dump({"fps": FPS, "total": TOTAL, "fecho": FI,
           "narracao": [{"n": k, "entra": si, "sai": so, "vai": d} for k, si, so, d, ia, ib in plan],
           "tomadas": tomadas},
          open(r"C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/cinco-motivos-ae/manual-40s/roteiro40.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("json ok")
