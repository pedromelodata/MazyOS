"""Testes da trava de render, do Temp próprio, das sobras e das correções da verificação da peça nova (frente README e
saída, 03/10). Sem render: os "renders" são processos falsos (python e node que só esperam).

 1. espera: com outro processo segurando a trava, o estado (o que o doutor mostra) traz o dono; quem chega espera e,
    com tempo-limite curto, sai com código 3 sem rodar; com tempo, pega a vez quando o dono solta.
 2. dono morto: o sistema solta a trava; a próxima execução pega na hora e o registro mostra o dono como morto.
 3. reentrante e filho: dentro da trava, a mesma trava no mesmo processo e num filho (KIT_TRAVA_TOKEN) não espera.
 4. render de fora do kit (node com stills.mjs na linha de comando, sem a trava): quem tem a trava espera ele acabar;
    com tempo curto, sai com código 3 e solta a trava.
 5. Temp próprio: o node filho cria tudo na pasta própria (os.tmpdir) e a pasta some no fim.
 6. vigia abortando: apaga só a pasta própria; uma pasta com nome do Remotion criada na raiz do Temp logo antes fica
    (a limpeza por janela de tempo, que apagava o bundle de outra sessão, saiu).
 7. kit.py limpa <peça>: só as pastas próprias de dono morto daquela peça; a de outra peça e a de dono vivo ficam.
 8. kit.py limpa --tudo recusa com a trava ocupada.
 9. kit.py nova: _AAAA-MM-DD-slug preenche o dataPost; a ajuda da cena fica intacta; nome sem data deixa AAAA-MM-DD e
    avisa.
10. props: titulo vazio, dataPost "AAAA-MM-DD" e data que não existe dão erro; sem dataPost dá aviso; trilha cuja janela
    tem automação, numa cena sem automação, dá o aviso com a automação deslocada pro momento da peça.
11. entregar e limpa --entregue: dataPost inválido recusado; limpa --entregue recusado antes da entrega; peça de teste
    entregue na raiz falsa; depois, limpa --entregue apaga stills e mudo e desliga as telas, e o final e as PNG ficam;
    telas --desliga sem nada ligado não erra.
12. mixa: o degrau da automação no mesmo instante ([t, 8], [t, 0]) fica na ordem escrita (+8 dB antes, 0 depois).

Uso (sempre com python -B):
    python -B testa_trava.py [--so 1,2,...] [--scratch <pasta>]
Grava o resultado em <scratch>/testa-trava/resultado.json e apaga o que criou (peças de teste, raiz falsa, links no
public-kit e pastas no Temp). Rode sem render de verdade rodando: os testes seguram a trava por alguns segundos.
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import datetime  # noqa: E402
import io  # noqa: E402
import json  # noqa: E402
import os  # noqa: E402
import shutil  # noqa: E402
import subprocess  # noqa: E402
import time  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
import trava  # noqa: E402
import vigia  # noqa: E402
from comum import escrita  # noqa: E402

SCRATCH_PADRAO = "C:/Users/EDIT-A~1/AppData/Local/Temp/claude/c--MKT-INSTA/9f25c963-3802-4688-87c4-1ffb83432d65/scratchpad"
KIT_PY = comum.KIT + "/scripts/kit.py"
PASTA_SCRIPTS = comum.barra(AQUI)
TESTE_SAIDA = comum.PECAS + "/_teste-saida"


def env_filho(extra=None):
    e = comum.env_python()
    e["PYTHONPATH"] = PASTA_SCRIPTS
    if extra:
        e.update(extra)
    return e


def kit(*args, timeout=600):
    r = subprocess.run([comum.PY, "-B", KIT_PY] + [str(a) for a in args], capture_output=True, text=True,
                       encoding="utf-8", errors="replace", env=env_filho(), timeout=timeout)
    return r.returncode, (r.stdout or "") + (r.stderr or "")


def mata(proc):
    """O processo e os filhos (o python do venv é um lançador: o interpretador é filho dele)."""
    if proc.poll() is None:
        subprocess.run(["taskkill", "/T", "/F", "/PID", str(proc.pid)], capture_output=True)
    try:
        proc.wait(10)
    except subprocess.TimeoutExpired:
        pass


SEGURA = r'''
import os, sys, time
import trava
with trava.render(%r, "teste-segura", espera_min=0.5, intervalo_s=0.3):
    print("PEGOU %%d" %% os.getpid(), flush=True)
    time.sleep(%f)
print("SOLTOU", flush=True)
'''


def segura(peca, segundos):
    """Outro processo com a trava por N segundos. Devolve (Popen, pid do interpretador)."""
    p = subprocess.Popen([comum.PY, "-B", "-c", SEGURA % (peca, segundos)], stdout=subprocess.PIPE, text=True,
                         encoding="utf-8", errors="replace", env=env_filho())
    linha = p.stdout.readline().strip()
    if not linha.startswith("PEGOU"):
        mata(p)
        raise RuntimeError("o processo de teste não pegou a trava: %r" % linha)
    return p, int(linha.split()[1])


def pid_morto():
    r = subprocess.Popen([comum.PY, "-B", "-c", "import os; print(os.getpid())"], stdout=subprocess.PIPE, text=True)
    pid = int(r.stdout.read().strip())
    r.wait()
    t0 = time.time()
    while trava.vivo(pid) and time.time() - t0 < 10:
        time.sleep(0.1)
    return pid


def png_pequeno():
    from PIL import Image
    buf = io.BytesIO()
    Image.new("RGB", (8, 8), (250, 248, 245)).save(buf, "PNG")
    return buf.getvalue()


class Testes:
    def __init__(self, scratch):
        self.base = comum.barra(os.path.realpath(scratch)) + "/testa-trava"
        os.makedirs(self.base, exist_ok=True)
        self.res = []
        self.criadas_temp = []

    def registra(self, nome, ok, medido, criterio):
        self.res.append({"teste": nome, "ok": bool(ok), "medido": medido, "criterio": criterio})
        print("[%s] %-22s %s" % ("ok" if ok else "FALHOU", nome, medido), flush=True)

    # 1
    def t_espera(self):
        p, pid = segura("_teste-trava-a", 6.0)
        try:
            e = trava.estado()
            dono_ok = trava.ocupada(e) and int(e["trava"]["pid"]) == pid
            linha = [m for _nivel, _nome, m in trava.resumo(e) if "OCUPADA" in m]
            msgs = []
            t0 = time.time()
            try:
                with trava.render("_teste-trava-b", "teste-curto", espera_min=0.03, intervalo_s=0.3, saida=msgs.append):
                    curto = "rodou"
            except comum.ErroSaida as ex:
                curto = ex.codigo
            dur_curto = time.time() - t0
            t1 = time.time()
            with trava.render("_teste-trava-b", "teste-espera", espera_min=0.5, intervalo_s=0.3, saida=msgs.append):
                espera = time.time() - t1
                eu = int(trava.le_info()["pid"]) == os.getpid()
            solta = trava.trava_solta()
        finally:
            mata(p)
        avisou = any("esperando a vez" in m and str(pid) in m for m in msgs)
        ok = dono_ok and bool(linha) and curto == 3 and 1.5 <= dur_curto < 6 and espera >= 1.5 and eu and solta and avisou
        self.registra("1 espera", ok, "dono no estado (PID %d): %s; doutor: %s; tempo curto (1,8 s): código %s em %.1f s; "
                      "com tempo: pegou a vez depois de %.1f s (dono = este processo: %s); solta no fim: %s; aviso com "
                      "quem está na frente: %s" % (pid, dono_ok, (linha[0][:90] if linha else "nada"), curto, dur_curto,
                                                   espera, eu, solta, avisou),
                      "quem chega espera e mostra o dono; tempo esgotado dá código 3 sem rodar")

    # 2
    def t_dono_morto(self):
        p, pid = segura("_teste-trava-morto", 60.0)
        mata(p)
        e = trava.estado()
        registro_morto = bool(e["trava"]) and int(e["trava"]["pid"]) == pid and not e["trava"]["viva"]
        msgs = []
        t0 = time.time()
        with trava.render("_teste-trava-c", "teste-morto", espera_min=0.2, intervalo_s=0.2, saida=msgs.append):
            pegou = time.time() - t0
        ok = registro_morto and pegou < 5
        self.registra("2 dono morto", ok, "registro com o PID %d morto: %s; a próxima pegou em %.1f s (o sistema soltou a "
                      "trava)" % (pid, registro_morto, pegou), "trava de processo morto não prende ninguém")

    # 3
    def t_reentrante(self):
        filho = ("import trava\nwith trava.render('_teste-trava-filho', 'filho', espera_min=0.02):\n"
                 "    print('FILHO DENTRO')\n")
        with trava.render("_teste-trava-d", "teste-pai", espera_min=0.2, saida=lambda m: None):
            with trava.render("_teste-trava-d", "teste-reentra", espera_min=0.01, saida=lambda m: None):
                nivel = trava._ESTADO["nivel"]
            t0 = time.time()
            r = subprocess.run([comum.PY, "-B", "-c", filho], capture_output=True, text=True, encoding="utf-8",
                               errors="replace", env=env_filho({"KIT_TRAVA_TOKEN": os.environ.get("KIT_TRAVA_TOKEN", "")}),
                               timeout=60)
            dur = time.time() - t0
        out = r.stdout + r.stderr
        ok = nivel == 2 and r.returncode == 0 and "FILHO DENTRO" in out and "dentro da trava do processo pai" in out \
            and dur < 10 and os.environ.get("KIT_TRAVA_TOKEN") is None
        self.registra("3 reentrante e filho", ok, "nível dentro da segunda: %d; filho com o token: código %d em %.1f s, "
                      "'dentro da trava do processo pai': %s; token limpo depois: %s"
                      % (nivel, r.returncode, dur, "dentro da trava do processo pai" in out,
                         os.environ.get("KIT_TRAVA_TOKEN") is None),
                      "a mesma trava no mesmo processo e no filho do dono não espera")

    # 4
    def t_de_fora(self):
        espera_fora = ("import time, trava, comum\nt0 = time.time()\ntry:\n"
                       "    with trava.render('_teste-trava-e', 'teste-fora', espera_min=%f, intervalo_s=0.5):\n"
                       "        print('RODOU %%.1f' %% (time.time() - t0), flush=True)\n"
                       "except comum.ErroSaida as e:\n"
                       "    print('ESGOTOU %%d %%.1f' %% (e.codigo, time.time() - t0), flush=True)\n")
        falso = subprocess.Popen(["node", "-e", "setTimeout(() => {}, 7000)", "stills.mjs", "teste-trava-render-falso"])
        try:
            time.sleep(1.0)
            visto = [g for g in (trava.renders() or []) if g["pid"] == falso.pid]
            r = subprocess.run([comum.PY, "-B", "-c", espera_fora % 0.5], capture_output=True, text=True,
                               encoding="utf-8", errors="replace", env=env_filho(), timeout=120)
        finally:
            mata(falso)
        out1 = r.stdout + r.stderr
        rodou = [x for x in out1.splitlines() if x.startswith("RODOU")]
        t_rodou = float(rodou[0].split()[1]) if rodou else 0.0
        falso2 = subprocess.Popen(["node", "-e", "setTimeout(() => {}, 30000)", "stills.mjs", "teste-trava-render-falso"])
        try:
            time.sleep(1.0)
            r2 = subprocess.run([comum.PY, "-B", "-c", espera_fora % 0.04], capture_output=True, text=True,
                                encoding="utf-8", errors="replace", env=env_filho(), timeout=120)
            solta = trava.trava_solta()
        finally:
            mata(falso2)
        out2 = r2.stdout + r2.stderr
        ok = (bool(visto) and visto[0]["meu"] and t_rodou >= 3 and "esperando render fora do kit" in out1
              and "ESGOTOU 3" in out2 and solta)
        self.registra("4 render de fora", ok, "node falso com stills.mjs visto pelo estado: %s; outro processo esperou ele "
                      "acabar e rodou depois de %.1f s ('esperando render fora do kit': %s); com tempo curto: %s; a trava "
                      "ficou solta: %s" % (bool(visto), t_rodou, "esperando render fora do kit" in out1,
                                           "código 3" if "ESGOTOU 3" in out2 else out2.strip()[-120:], solta),
                      "render do Remotion sem a trava também é esperado; tempo esgotado solta a trava")

    # 5
    def t_temp_proprio(self):
        js = ("const fs=require('fs'),os=require('os'),path=require('path');"
              "const d=fs.mkdtempSync(path.join(os.tmpdir(),'remotion-webpack-bundle-'));"
              "console.log(os.tmpdir());console.log(d)")
        msgs = []
        with trava.temp_proprio("_teste-trava-f", "teste-temp", saida=msgs.append) as pasta:
            r = subprocess.run(["node", "-e", js], capture_output=True, text=True, env=trava.env_temp(pasta))
            linhas = r.stdout.split()
            dentro = (len(linhas) == 2 and os.path.normcase(linhas[0]) == os.path.normcase(pasta.replace("/", "\\"))
                      and os.path.isdir(linhas[1]))
            listada = [s for s in trava.sobras("_teste-trava-f") if s["pasta"] == pasta and s["vivo"]]
        apagada = not os.path.exists(pasta)
        ok = dentro and bool(listada) and apagada and any("Temp próprio apagado" in m for m in msgs)
        self.registra("5 Temp próprio", ok, "o node criou o bundle falso dentro da pasta própria: %s; listada como em uso "
                      "(dono vivo): %s; apagada no fim: %s" % (dentro, bool(listada), apagada),
                      "TEMP, TMP e TMPDIR na pasta própria; só ela é apagada")

    # 6
    def t_vigia(self):
        isca = comum.temp() + "/remotion-teste-trava-isca-%d" % os.getpid()
        with trava.temp_proprio("_teste-trava-g", "teste-vigia", saida=lambda m: None) as pasta:
            escrita.grava_texto(pasta + "/arquivo.txt", "apagar")
            os.makedirs(isca, exist_ok=True)
            escrita.grava_texto(isca + "/fica.txt", "não pode ser apagado pelo vigia")
            limite = escrita.livre_mb() + 100000
            buf = io.StringIO()
            sys_out = sys.stdout
            sys.stdout = buf
            try:
                cod, info = vigia.roda([comum.PY, "-c", "import time; time.sleep(30)"], limite_mb=limite,
                                       env=trava.env_temp(pasta), temp_privado=pasta)
            finally:
                sys.stdout = sys_out
            propria_apagada = not os.path.exists(pasta)
        isca_ficou = os.path.isfile(isca + "/fica.txt")
        shutil.rmtree(isca, ignore_errors=True)
        ok = cod == 1 and info.get("abortou") and propria_apagada and isca_ficou and info["temp"]["apagadas"] == [pasta]
        self.registra("6 vigia", ok, "abortou (código %d); apagou só a pasta própria: %s; a pasta com nome do Remotion "
                      "criada na raiz do Temp logo antes ficou: %s" % (cod, propria_apagada, isca_ficou),
                      "abortando, o vigia não apaga nada fora da pasta própria")

    # 7
    def t_limpa_peca(self):
        morto = pid_morto()
        os.makedirs(trava.PASTA, exist_ok=True)
        pastas = {}
        for chave, peca, pid, criado in (("x-morto", "_teste-trava-x", morto, None),
                                         ("y-morto", "_teste-trava-y", morto, None),
                                         ("x-vivo", "_teste-trava-x", os.getpid(), trava.criado(os.getpid()))):
            nome = "r%d-%s-%s" % (pid, time.strftime("%H%M%S"), os.urandom(2).hex())
            p = trava.PASTA + "/" + nome
            os.makedirs(p)
            escrita.grava_json(p + "/dono.json", {"versao": 1, "pid": pid, "criado": criado, "peca": peca,
                                                  "rotulo": peca, "comando": "teste", "inicio": "", "epoch": 0})
            escrita.grava_bytes(p + "/lixo.bin", b"0" * 2048)
            pastas[chave] = p
        resumo = [m for _n, nome, m in trava.resumo() if nome == "sobras de render"]
        cod_s, out_s = kit("limpa", "_teste-trava-x", "--simula")
        simula_nada = all(os.path.isdir(p) for p in pastas.values())
        cod, out = kit("limpa", "_teste-trava-x")
        x_morto_foi = not os.path.exists(pastas["x-morto"])
        y_ficou = os.path.isdir(pastas["y-morto"])
        x_vivo_ficou = os.path.isdir(pastas["x-vivo"])
        for p in pastas.values():
            if os.path.isdir(p):
                trava.apaga_pasta(p)
        ok = (cod_s == 0 and simula_nada and cod == 0 and x_morto_foi and y_ficou and x_vivo_ficou and resumo
              and "_teste-trava-y" in resumo[0])
        self.registra("7 limpa da peça", ok, "doutor lista as sobras por peça: %s; --simula não apagou: %s; kit.py limpa "
                      "_teste-trava-x apagou a dela de dono morto: %s; a de outra peça ficou: %s; a de dono vivo ficou: %s"
                      % ((resumo[0][:80] if resumo else "nada"), simula_nada, x_morto_foi, y_ficou, x_vivo_ficou),
                      "só as sobras da própria peça, e só de execução que já acabou")

    # 8
    def t_limpa_tudo(self):
        p, pid = segura("_teste-trava-h", 8.0)
        try:
            cod, out = kit("limpa", "--tudo", "--simula")
        finally:
            mata(p)
        ok = cod == 3 and "nada foi apagado" in out and str(pid) in out
        self.registra("8 limpa --tudo", ok, "com a trava ocupada (PID %d): código %d, '%s'"
                      % (pid, cod, out.strip().splitlines()[-1][:110] if out.strip() else ""),
                      "a limpeza geral recusa enquanto alguém renderiza")

    # 9
    def t_nova(self):
        com = self.base + "/_2026-10-30-teste-trava"
        sem = self.base + "/teste-trava-sem-data"
        for p in (com, sem):
            if os.path.isdir(p):
                shutil.rmtree(p)
        cod, out = kit("nova", com)
        c = comum.le_json(com + "/cenas.json") if cod == 0 else {}
        with open(comum.PECAS + "/_modelo/cenas.json", encoding="utf-8") as f:
            ajuda_modelo = json.load(f)["_ajuda"]
        ok_com = (c.get("peca") == "_2026-10-30-teste-trava" and c.get("dataPost") == "2026-10-30"
                  and c.get("telas", {}).get("splash", {}).get("arquivo") == "pecas/_2026-10-30-teste-trava/telas/tela-splash.png"
                  and c.get("_ajuda") == ajuda_modelo and "aviso" not in out)
        cod2, out2 = kit("nova", sem)
        c2 = comum.le_json(sem + "/cenas.json") if cod2 == 0 else {}
        ok_sem = c2.get("dataPost") == "AAAA-MM-DD" and c2.get("peca") == "teste-trava-sem-data" and \
            "não segue AAAA-MM-DD-slug" in out2 and "troque pela data do post" in out2
        shutil.rmtree(com, ignore_errors=True)
        shutil.rmtree(sem, ignore_errors=True)
        ok = cod == 0 and ok_com and cod2 == 0 and ok_sem
        self.registra("9 nova", ok, "_2026-10-30-teste-trava: peca, dataPost 2026-10-30 e telas trocados, ajuda igual à do "
                      "modelo: %s; nome sem data: dataPost AAAA-MM-DD, aviso do nome e do dataPost: %s" % (ok_com, ok_sem),
                      "só os campos mudam; a ajuda da cena fica intacta")

    # 10
    def t_props(self):
        p = self.base + "/_teste-trava-props"
        if os.path.isdir(p):
            shutil.rmtree(p)
        os.makedirs(p + "/voz")
        escrita.copia(TESTE_SAIDA + "/voz/narracao.json", p + "/voz/narracao.json")
        base = comum.le_json(TESTE_SAIDA + "/cenas.json")
        base["peca"] = "_teste-trava-props"
        casos = {}

        def caso(nome, muda):
            c = json.loads(json.dumps(base))
            muda(c)
            escrita.grava_json(p + "/" + nome, c)
            r = subprocess.run([comum.NODE, comum.CLI + "/props.mjs", p, "--cena", nome], capture_output=True, text=True,
                               encoding="utf-8", errors="replace", cwd=comum.RM, timeout=300)
            casos[nome] = (r.returncode, r.stdout + r.stderr)

        caso("cenas-titulo.json", lambda c: c.update(titulo="  "))
        caso("cenas-data-modelo.json", lambda c: c.update(dataPost="AAAA-MM-DD"))
        caso("cenas-data-errada.json", lambda c: c.update(dataPost="2026-02-30"))
        caso("cenas-sem-data.json", lambda c: c.pop("dataPost", None))

        def lets(c, auto):
            c["trilha"] = {"id": "mixkit-05-lets-move", "momento": {"palavra": 20}, "ponto": "entrada-16.035",
                           "ganhoDb": "auto", "automacao": auto}
        caso("cenas-lets.json", lambda c: lets(c, []))
        caso("cenas-lets-auto.json", lambda c: lets(c, [[0, 8], [5.48, 8], [5.48, 0]]))
        cod_t, out_t = casos["cenas-titulo.json"]
        cod_m, out_m = casos["cenas-data-modelo.json"]
        cod_e, out_e = casos["cenas-data-errada.json"]
        cod_s, out_s = casos["cenas-sem-data.json"]
        cod_l, out_l = casos["cenas-lets.json"]
        cod_a, out_a = casos["cenas-lets-auto.json"]
        sugerida = "[[0,8],[5.48,8],[5.48,0]]" in out_l
        shutil.rmtree(p, ignore_errors=True)
        ok = (cod_t == 1 and "titulo vazio" in out_t and cod_m == 1 and "AAAA-MM-DD" in out_m and cod_e == 1
              and "2026-02-30" in out_e and cod_s == 0 and "sem dataPost" in out_s and cod_l == 0 and sugerida
              and cod_a == 0 and "sobe a trilha por automação" not in out_a)
        self.registra("10 props", ok, "titulo vazio: código %d; dataPost AAAA-MM-DD: código %d; 2026-02-30: código %d; "
                      "sem dataPost: código %d com aviso; Let's Move no momento 5,48 s sem automação: aviso com "
                      "[[0,8],[5.48,8],[5.48,0]]: %s; com a automação: sem aviso: %s"
                      % (cod_t, cod_m, cod_e, cod_s, sugerida, "sobe a trilha por automação" not in out_a),
                      "título e data da proposta travam no props; a automação da janela é lembrada")

    # 11
    def t_entrega_e_sobras(self):
        p = self.base + "/_teste-trava-entrega"
        nao = self.base + "/teste-trava-nao-entregue"
        raiz = self.base + "/final-falso"
        videos = self.base + "/videos-falso"
        pk = comum.PUBLIC_KIT + "/pecas/_teste-trava-entrega"
        for x in (p, nao, raiz, videos):
            if os.path.isdir(x):
                shutil.rmtree(x)
        os.makedirs(videos)
        props = {"versao": 1, "peca": "_teste-trava-entrega", "titulo": "Teste da trava (não entregar)",
                 "dataPost": "2026-10-30", "creditoLegenda": None}
        escrita.grava_json(p + "/props.json", props, cria_pasta=True)
        escrita.grava_json(p + "/props-data-modelo.json", dict(props, dataPost="AAAA-MM-DD"))
        escrita.grava_bytes(p + "/saida/_teste-trava-entrega.mp4", b"final falso do teste da trava", cria_pasta=True)
        escrita.grava_bytes(p + "/saida/_teste-trava-entrega-mudo.mp4", b"mudo falso" * 100)
        escrita.grava_bytes(p + "/provas/stills/KitMotion-0000.png", png_pequeno(), cria_pasta=True)
        escrita.grava_bytes(p + "/provas/stills/capa-KitMotion-0050.png", png_pequeno())
        escrita.grava_bytes(p + "/telas/tela-x.png", png_pequeno(), cria_pasta=True)
        escrita.grava_json(nao + "/props.json", dict(props, peca="teste-trava-nao-entregue"), cria_pasta=True)
        escrita.grava_bytes(nao + "/saida/teste-trava-nao-entregue.mp4", b"final falso", cria_pasta=True)
        escrita.grava_bytes(nao + "/provas/stills/KitMotion-0000.png", png_pequeno(), cria_pasta=True)
        try:
            cod_d, out_d = kit("entregar", p, "--cena", "cenas-data-modelo.json", "--raiz-final", raiz)
            cod_n, out_n = kit("limpa", nao, "--entregue")
            nao_intacto = os.path.isfile(nao + "/provas/stills/KitMotion-0000.png")
            cod_l, out_l = kit("telas", p, "--so-liga")
            ligada = os.path.isfile(pk + "/telas/tela-x.png") and os.path.samefile(pk + "/telas/tela-x.png",
                                                                                   p + "/telas/tela-x.png")
            cod_e, out_e = kit("entregar", p, "--raiz-final", raiz, "--videos", videos)
            nl_final = os.stat(p + "/saida/_teste-trava-entrega.mp4").st_nlink
            cod_s, out_s = kit("limpa", p, "--entregue", "--simula")
            simula_nada = os.path.isfile(p + "/provas/stills/KitMotion-0000.png") and os.path.isfile(pk + "/telas/tela-x.png")
            cod_r, out_r = kit("limpa", p, "--entregue")
            stills_foram = not os.listdir(p + "/provas/stills")
            mudo_foi = not os.path.exists(p + "/saida/_teste-trava-entrega-mudo.mp4")
            links_foram = not os.path.exists(pk)
            final_ficou = os.path.isfile(p + "/saida/_teste-trava-entrega.mp4") and \
                os.stat(p + "/saida/_teste-trava-entrega.mp4").st_nlink == 2
            png_ficou = os.path.isfile(p + "/telas/tela-x.png")
            cod_dl, out_dl = kit("telas", p, "--desliga")
        finally:
            if os.path.isdir(pk):
                shutil.rmtree(pk)
            for x in (p, nao, raiz, videos):
                shutil.rmtree(x, ignore_errors=True)
        ok = (cod_d == 2 and "não é uma data" in out_d and cod_n == 2 and "ainda não foi entregue" in out_n
              and nao_intacto and cod_l == 0 and ligada and cod_e == 0 and nl_final == 2 and cod_s == 0 and simula_nada
              and cod_r == 0 and stills_foram and mudo_foi and links_foram and final_ficou and png_ficou and cod_dl == 0
              and "nada ligado" in out_dl)
        self.registra("11 entrega e sobras", ok, "dataPost AAAA-MM-DD na entrega: código %d; limpa --entregue antes da "
                      "entrega: código %d (nada apagado: %s); entrega na raiz falsa: código %d (st_nlink %d); --simula "
                      "não apagou: %s; limpa --entregue: stills %s, mudo %s, links do public-kit %s; final (st_nlink 2) e "
                      "PNG da peça ficaram: %s; telas --desliga sem nada ligado: código %d"
                      % (cod_d, cod_n, nao_intacto, cod_e, nl_final, simula_nada, "apagados" if stills_foram else "FICARAM",
                         "apagado" if mudo_foi else "FICOU", "desligados" if links_foram else "FICARAM",
                         final_ficou and png_ficou, cod_dl),
                      "data inválida trava a entrega; sobras só depois da entrega; o final e as telas da peça ficam")

    # 12
    def t_mixa(self):
        import numpy as np
        sys.path.insert(0, comum.KIT + "/audio")
        import mixa
        _ef, trilhas = mixa.carrega_catalogos()
        item = trilhas["mixkit-05-lets-move"]
        sr = mixa.SR
        n = int(sr * 6)
        t = {"mStart": 5.735, "ganhoDb": -8.1, "automacao": [[0, 8], [2.0, 8], [2.0, 0]], "abaixamento": 0.55,
             "fadeIn": 0.03, "fadeOut": 0.5}
        _mus, gain, info = mixa.monta_trilha(item, t, np.zeros(n, np.float32), n, 6.0, [])
        antes = 20 * np.log10(gain[int(1.0 * sr)])
        depois = 20 * np.log10(gain[int(4.0 * sr)])
        ok = abs((antes - depois) - 8.0) < 0.01 and info["automacao"] == [[0.0, 8.0], [2.0, 8.0], [2.0, 0.0]]
        self.registra("12 mixa automação", ok, "Let's Move com [[0,8],[2,8],[2,0]]: ganho em 1 s %.2f dB, em 4 s %.2f dB "
                      "(diferença %.2f dB); ordem guardada: %s" % (antes, depois, antes - depois, info["automacao"]),
                      "+8 dB antes do degrau e 0 depois (antes de 03/10 o degrau invertia e ficava +8 até o fim)")


ORDEM = [("1", "t_espera"), ("2", "t_dono_morto"), ("3", "t_reentrante"), ("4", "t_de_fora"), ("5", "t_temp_proprio"),
         ("6", "t_vigia"), ("7", "t_limpa_peca"), ("8", "t_limpa_tudo"), ("9", "t_nova"), ("10", "t_props"),
         ("11", "t_entrega_e_sobras"), ("12", "t_mixa")]


def main(argv=None):
    comum.utf8()
    ap = argparse.ArgumentParser(prog="testa_trava.py", description="Testes da trava de render e das correções de 03/10.")
    ap.add_argument("--so", help="só estes testes (números separados por vírgula)")
    ap.add_argument("--scratch", default=SCRATCH_PADRAO)
    a = ap.parse_args(argv)
    e = trava.estado()
    rodando = [g for g in (e["renders"] or []) if not g["orfao"]]
    if trava.ocupada(e) or rodando:
        print("há render rodando agora (%s): os testes seguram a trava; rode depois"
              % "; ".join([trava.descreve_info(e["trava"] or e["info"])] if trava.ocupada(e) else []
                          + [trava.descreve_render(g) for g in rodando]))
        return 3
    t = Testes(a.scratch)
    so = set(x.strip() for x in a.so.split(",")) if a.so else None
    inicio = datetime.datetime.now()
    for num, nome in ORDEM:
        if so and num not in so:
            continue
        try:
            getattr(t, nome)()
        except Exception as ex:  # noqa: BLE001
            t.registra(num + " " + nome[2:], False, "erro no teste: %s: %s" % (type(ex).__name__, ex), "rodar sem erro")
    # os testes 2 e 8 matam o dono no meio: uma volta limpa na trava deixa o registro "livre" pro doutor
    try:
        with trava.render("testa_trava", "fim dos testes", espera_min=0.2, saida=lambda m: None):
            pass
    except comum.ErroSaida as ex:
        print("aviso: não consegui deixar a trava livre no registro: %s" % ex)
    sobra = trava.sobras()
    doc = {"versao": 1, "inicio": inicio.isoformat(timespec="seconds"),
           "fim": datetime.datetime.now().isoformat(timespec="seconds"), "testes": t.res,
           "passaram": sum(1 for r in t.res if r["ok"]), "total": len(t.res),
           "sobrasNoTemp": [s["pasta"] for s in sobra if (s["peca"] or "").startswith("_teste-trava")]}
    escrita.grava_json(t.base + "/resultado.json", doc)
    print("\n%d de %d testes passaram; resultado em %s/resultado.json" % (doc["passaram"], doc["total"], t.base))
    return 0 if doc["passaram"] == doc["total"] else 1


if __name__ == "__main__":
    sys.exit(main())
