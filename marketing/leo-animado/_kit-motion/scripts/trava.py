"""Trava de render entre sessões e Temp próprio por execução (kit de motion do Legalizaí; frente README e saída, 03/10).
Contrato: KIT/DESENHO.md, seções 7.1 e 7.4 (um render ou um stills por vez na máquina, também entre sessões).

Por quê: a limpeza do Temp por janela de tempo de uma execução apagava o bundle e o perfil do Chrome de outra (em 02/10
um render caiu no quadro 449 assim), e nenhum comando mostrava quem estava renderizando.

- Trava: o arquivo <Temp>/kit-motion/trava-render.lock fica travado pelo sistema (msvcrt.locking em 1 byte) enquanto
  o processo dono vive; se ele morre, o Windows solta sozinho. Ao lado, <Temp>/kit-motion/trava-render.json diz quem
  está com ela: PID, hora de criação do processo (contra PID reaproveitado), hora de início, peça, comando e linha de
  comando. Quem chega espera a vez (padrão até 40 min: KIT_TRAVA_ESPERA_MIN ou --espera do kit.py; confere a cada
  20 s: KIT_TRAVA_INTERVALO_S) e mostra quem está na frente. Com a trava na mão, ainda espera render de fora do kit
  (node com "remotion render", "remotion still" ou stills.mjs, e chrome-headless-shell com o perfil do Remotion) que
  não seja da própria árvore de processos. Esgotado o tempo, sai com erro (código 3) sem rodar nada.
- Reentrante no mesmo processo (o kit.py final segura uma vez pros stills e o render). Processo filho do dono
  (KIT_TRAVA_TOKEN no ambiente igual ao token da trava) segue sem travar de novo.
- Temp próprio: cada render e cada stills roda o Remotion e o Chrome com TEMP, TMP e TMPDIR numa pasta só dele,
  <Temp>/kit-motion/r<pid>-<hhmmss>-<x>/ (com dono.json: peça, comando, PID); no fim só essa pasta é apagada. Assim a
  limpeza de uma sessão nunca chega no bundle de outra.
- Sobras: pasta própria cujo dono morreu (sessão fechada no meio do render) ou que não deu pra apagar. O doutor lista;
  kit.py limpa <peça> apaga só as da peça; kit.py limpa --tudo apaga as de todas, só sem render rodando.

Os dois arquivos da trava ficam no Temp e não são do projeto: o .lock nunca é escrito (só travado) e o .json é gravado
pelo KIT/lib/escrita.py (temporário e troca).

Uso (sempre com python -B):
    python -B trava.py [--json]       estado: a trava, os renders rodando e as sobras (o mesmo que o doutor mostra)
Importável:
    with trava.render(peca, "render", espera_min=None): ...        espera a vez e segura a trava
    with trava.temp_proprio(peca, "render") as pasta: env = trava.env_temp(pasta)
    trava.estado(), trava.renders(), trava.sobras(peca=None), trava.limpa_sobras(peca=None, simula=False)
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import contextlib  # noqa: E402
import datetime  # noqa: E402
import json  # noqa: E402
import os  # noqa: E402
import re  # noqa: E402
import secrets  # noqa: E402
import subprocess  # noqa: E402
import time  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
import limpa  # noqa: E402
from comum import escrita  # noqa: E402


def _temp_longo():
    """O Temp do usuário com o nome longo, igual pra todas as sessões (não depende do TEMP de quem chama)."""
    base = os.environ.get("LOCALAPPDATA")
    if base:
        p = os.path.join(base, "Temp")
        if os.path.isdir(p):
            return comum.barra(os.path.realpath(p))
    return comum.temp()


TEMP = _temp_longo()
PASTA = TEMP + "/kit-motion"
ARQ_TRAVA = PASTA + "/trava-render.lock"
ARQ_INFO = PASTA + "/trava-render.json"
RX_PASTA = re.compile(r"^r(\d+)-\d{6}-[0-9a-f]{4}$")
ESPERA_MIN_PADRAO = 40.0
INTERVALO_S_PADRAO = 20.0
AVISO_A_CADA_S = 60.0
CODIGO_ESPERA = 3

# render do Remotion visto pela linha de comando (só em node.exe): npx remotion render/still, remotion-cli.js, stills.mjs
RX_RENDER = re.compile(r"(?i)(remotion(?:-cli\.js|\.cmd)?[\"']?\s+(?:render|still|benchmark)\b|stills\.mjs)")
PERFIL_REMOTION = "puppeteer_dev_chrome_profile"


# ---------- processos (Windows, sem psutil) ----------
if os.name == "nt":
    import ctypes
    from ctypes import wintypes

    _k32 = ctypes.WinDLL("kernel32", use_last_error=True)
    _k32.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    _k32.OpenProcess.restype = wintypes.HANDLE
    _k32.GetExitCodeProcess.argtypes = [wintypes.HANDLE, ctypes.POINTER(wintypes.DWORD)]
    _k32.GetExitCodeProcess.restype = wintypes.BOOL
    _k32.GetProcessTimes.argtypes = [wintypes.HANDLE] + [ctypes.POINTER(wintypes.FILETIME)] * 4
    _k32.GetProcessTimes.restype = wintypes.BOOL
    _k32.CloseHandle.argtypes = [wintypes.HANDLE]
    _k32.CloseHandle.restype = wintypes.BOOL

_CONSULTA = 0x1000  # PROCESS_QUERY_LIMITED_INFORMATION
_ATIVO = 259  # STILL_ACTIVE


def _pid(x):
    try:
        v = int(x)
    except (TypeError, ValueError):
        return 0
    return v if v > 0 else 0


def vivo(pid):
    """O processo existe e não terminou."""
    pid = _pid(pid)
    if not pid:
        return False
    if os.name != "nt":
        try:
            os.kill(pid, 0)
            return True
        except PermissionError:
            return True
        except OSError:
            return False
    h = _k32.OpenProcess(_CONSULTA, False, pid)
    if not h:
        return ctypes.get_last_error() == 5  # acesso negado: existe (protegido ou de outro usuário)
    try:
        cod = wintypes.DWORD()
        if not _k32.GetExitCodeProcess(h, ctypes.byref(cod)):
            return True
        return cod.value == _ATIVO
    finally:
        _k32.CloseHandle(h)


def criado(pid):
    """Hora de criação do processo (FILETIME: unidades de 100 ns desde 1601) ou None."""
    pid = _pid(pid)
    if not pid or os.name != "nt":
        return None
    h = _k32.OpenProcess(_CONSULTA, False, pid)
    if not h:
        return None
    try:
        c, e, k, u = wintypes.FILETIME(), wintypes.FILETIME(), wintypes.FILETIME(), wintypes.FILETIME()
        if not _k32.GetProcessTimes(h, ctypes.byref(c), ctypes.byref(e), ctypes.byref(k), ctypes.byref(u)):
            return None
        return (int(c.dwHighDateTime) << 32) | int(c.dwLowDateTime)
    finally:
        _k32.CloseHandle(h)


def mesmo_processo(pid, criado_registrado):
    """O PID está vivo e é o mesmo processo registrado (a hora de criação bate, quando foi registrada)."""
    if not vivo(pid):
        return False
    if not criado_registrado:
        return True
    atual = criado(pid)
    return atual is None or int(atual) == int(criado_registrado)


_PS_TABELA = (
    "[Console]::OutputEncoding=[Text.Encoding]::UTF8; "
    "Get-CimInstance Win32_Process | ForEach-Object { $c=$null; "
    "if (@('node.exe','chrome-headless-shell.exe','remotion.exe') -contains $_.Name) { $c=$_.CommandLine }; "
    "[pscustomobject]@{p=$_.ProcessId; pp=$_.ParentProcessId; n=$_.Name; c=$c; "
    "t=$(if ($_.CreationDate) { $_.CreationDate.ToString('yyyy-MM-dd HH:mm:ss') } else { $null })} } "
    "| ConvertTo-Json -Compress")


def tabela_processos():
    """{pid: {p, pp, n, c, t}} de todos os processos (linha de comando só de node, chrome-headless-shell e remotion),
    pelo PowerShell (Get-CimInstance). None se não deu pra ler."""
    if os.name != "nt":
        return None
    try:
        r = subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", _PS_TABELA],
                           capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=60)
        dados = json.loads(r.stdout) if r.stdout.strip() else []
    except (OSError, subprocess.TimeoutExpired, ValueError):
        return None
    if isinstance(dados, dict):
        dados = [dados]
    return {int(d["p"]): d for d in dados if isinstance(d, dict) and d.get("p") is not None}


def _descendentes(tab, raiz):
    filhos = {}
    for pid, d in tab.items():
        filhos.setdefault(int(d.get("pp") or 0), []).append(pid)
    out, pilha = set(), [int(raiz)]
    while pilha:
        atual = pilha.pop()
        for f in filhos.get(atual, []):
            if f not in out and f != atual:
                out.add(f)
                pilha.append(f)
    return out


def _e_render(d):
    return (d.get("n") or "").lower() == "node.exe" and bool(RX_RENDER.search(d.get("c") or ""))


def _e_chrome_remotion(d):
    return (d.get("n") or "").lower() == "chrome-headless-shell.exe" and PERFIL_REMOTION in (d.get("c") or "")


def renders(tab=None):
    """Renders do Remotion rodando agora, agrupados pela raiz (o node mais alto da cadeia que roda render, still ou
    stills.mjs; sem ele, o node pai do Chrome). Cada um: {pid, desde, cmd, chromes, orfao, meu, doDono}.
    meu: da árvore deste processo; doDono: da árvore de quem está com a trava; orfao: Chrome do Remotion sem pai vivo
    (render que morreu: não se espera por ele). None se a tabela de processos não pôde ser lida."""
    tab = tabela_processos() if tab is None else tab
    if tab is None:
        return None
    meus = _descendentes(tab, os.getpid()) | {os.getpid()}
    info = le_info() or {}
    dono = _pid(info.get("pid")) if info.get("estado") == "ocupada" else 0
    do_dono = (_descendentes(tab, dono) | {dono}) if dono and dono in tab else set()

    def raiz_de(pid):
        cadeia, atual, vistos = [], pid, set()
        while atual in tab and atual not in vistos:
            vistos.add(atual)
            cadeia.append(atual)
            atual = int(tab[atual].get("pp") or 0)
        renders_na_cadeia = [x for x in cadeia if _e_render(tab[x])]
        if renders_na_cadeia:
            return renders_na_cadeia[-1], False
        nodes = [x for x in cadeia if (tab[x].get("n") or "").lower() == "node.exe"]
        if nodes:
            return nodes[0], False
        # sem node na cadeia: o processo principal do Chrome é a raiz; sem pai vivo, é órfão (o render morreu)
        chromes = [x for x in cadeia if (tab[x].get("n") or "").lower() == "chrome-headless-shell.exe"]
        topo = chromes[-1] if chromes else pid
        return topo, int(tab[topo].get("pp") or 0) not in tab

    grupos = {}
    for pid, d in tab.items():
        if _e_render(d) or _e_chrome_remotion(d):
            raiz, orfao = raiz_de(pid)
            g = grupos.setdefault(raiz, {"pid": raiz, "desde": tab[raiz].get("t"), "nome": tab[raiz].get("n"),
                                         "cmd": re.sub(r"\s+", " ", (tab[raiz].get("c") or "")).strip()[:200],
                                         "chromes": 0, "orfao": orfao, "meu": raiz in meus, "doDono": raiz in do_dono})
            if _e_chrome_remotion(d):
                g["chromes"] += 1
    return sorted(grupos.values(), key=lambda g: (g["desde"] or "", g["pid"]))


def renders_de_fora(tab=None):
    """Renders vivos que não são deste processo nem órfãos (None se não deu pra ler os processos)."""
    rs = renders(tab)
    if rs is None:
        return None
    return [g for g in rs if not g["meu"] and not g["orfao"]]


def descreve_render(g):
    quem = "do kit (com a trava)" if g.get("doDono") else ("deste processo" if g.get("meu") else "fora do kit")
    if g.get("orfao"):
        quem = "órfão (o render que abriu já morreu)"
    cmd = g.get("cmd") or g.get("nome") or "?"
    return "PID %s %s, desde %s, %d chrome(s): %s" % (g["pid"], quem, g.get("desde") or "?", g.get("chromes", 0), cmd)


# ---------- a trava ----------
def le_info():
    try:
        with open(ARQ_INFO, encoding="utf-8") as f:
            d = json.load(f)
        return d if isinstance(d, dict) else None
    except (OSError, ValueError):
        return None


def _grava_info(doc):
    for _ in range(40):
        try:
            escrita.grava_json(ARQ_INFO, doc, cria_pasta=True)
            return True
        except PermissionError:
            time.sleep(0.05)  # alguém lendo o arquivo naquele instante
    return False


def _tranca(fd):
    os.lseek(fd, 0, 0)
    if os.name == "nt":
        import msvcrt
        try:
            msvcrt.locking(fd, msvcrt.LK_NBLCK, 1)
            return True
        except OSError:
            return False
    import fcntl
    try:
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        return True
    except OSError:
        return False


def _destranca(fd):
    os.lseek(fd, 0, 0)
    try:
        if os.name == "nt":
            import msvcrt
            msvcrt.locking(fd, msvcrt.LK_UNLCK, 1)
        else:
            import fcntl
            fcntl.flock(fd, fcntl.LOCK_UN)
    except OSError:
        pass


def _abre_trava():
    os.makedirs(PASTA, exist_ok=True)
    flags = os.O_RDWR | os.O_CREAT | getattr(os, "O_BINARY", 0) | getattr(os, "O_NOINHERIT", 0)
    return os.open(ARQ_TRAVA, flags, 0o666)


def trava_solta():
    """Confere no sistema se a trava está solta agora (tenta e solta na hora). None se não deu pra abrir."""
    if _ESTADO["nivel"] > 0:
        return False
    try:
        fd = _abre_trava()
    except OSError:
        return None
    try:
        if _tranca(fd):
            _destranca(fd)
            return True
        return False
    finally:
        os.close(fd)


def _nome_base(peca):
    """O nome da pasta da peça (sem o sufixo da cena)."""
    if peca is None:
        return "?"
    if isinstance(peca, str):
        return peca
    return getattr(peca, "nome", None) or str(peca)


def _nome(peca):
    """O nome pra mostrar: a peça e o sufixo da cena (guia-pronta-2026-10-14-kit)."""
    if peca is None or isinstance(peca, str):
        return _nome_base(peca)
    return _nome_base(peca) + (getattr(peca, "sufixo", "") or "")


def _hora(epoch):
    return datetime.datetime.fromtimestamp(epoch).strftime("%H:%M:%S") if epoch else "?"


def descreve_info(info):
    if not info:
        return "alguém (sem registro legível da trava)"
    idade = (time.time() - float(info.get("epoch") or time.time())) / 60.0
    return "%s (%s), PID %s, desde %s (há %.0f min)" % (info.get("peca", "?"), info.get("comando", "?"),
                                                         info.get("pid", "?"), _hora(info.get("epoch")), idade)


def _espera_padrao():
    try:
        return float(os.environ.get("KIT_TRAVA_ESPERA_MIN", ESPERA_MIN_PADRAO))
    except ValueError:
        return ESPERA_MIN_PADRAO


def _intervalo_padrao():
    try:
        return max(0.2, float(os.environ.get("KIT_TRAVA_INTERVALO_S", INTERVALO_S_PADRAO)))
    except ValueError:
        return INTERVALO_S_PADRAO


_ESTADO = {"fd": None, "token": None, "nivel": 0, "info": None, "env_antes": None}


def _espera_renders_de_fora(limite, intervalo, espera_min, saida):
    aviso_em = 0.0
    avisou_tabela = False
    while True:
        fora = renders_de_fora()
        if fora is None:
            if not avisou_tabela:
                saida("trava de render: não consegui ler os processos (PowerShell); sigo só com a trava")
            return
        if not fora:
            return
        agora = time.time()
        lista = "; ".join(descreve_render(g) for g in fora)
        if agora >= limite:
            raise comum.ErroSaida("trava de render: esperei %.0f min e ainda há render fora do kit rodando (%s). Nada "
                                  "foi rodado; veja kit.py doutor" % (espera_min, lista), CODIGO_ESPERA)
        if agora >= aviso_em:
            saida("trava de render: com a trava, esperando render fora do kit terminar: %s (tempo-limite %.0f min)"
                  % (lista, espera_min))
            aviso_em = agora + AVISO_A_CADA_S
        time.sleep(min(intervalo, max(0.2, limite - agora)))


@contextlib.contextmanager
def render(peca, comando, espera_min=None, intervalo_s=None, simula=False, saida=print):
    """Espera a vez e segura a trava de render (reentrante). Esgotado o tempo, ErroSaida com código 3."""
    nome = _nome(peca)
    if simula:
        saida("$ (trava de render: espera a vez em %s, até %.0f min; Temp próprio em %s/r<pid>-...)"
              % (ARQ_TRAVA, _espera_padrao() if espera_min is None else float(espera_min), PASTA))
        yield None
        return
    if _ESTADO["nivel"] > 0:
        _ESTADO["nivel"] += 1
        try:
            yield _ESTADO["info"]
        finally:
            _ESTADO["nivel"] -= 1
        return
    info = le_info()
    token_env = os.environ.get("KIT_TRAVA_TOKEN")
    if (token_env and info and info.get("estado") == "ocupada" and info.get("token") == token_env
            and mesmo_processo(info.get("pid"), info.get("criado"))):
        saida("trava de render: dentro da trava do processo pai (%s)" % descreve_info(info))
        yield info
        return
    espera_min = _espera_padrao() if espera_min is None else float(espera_min)
    intervalo = _intervalo_padrao() if intervalo_s is None else max(0.05, float(intervalo_s))
    t0 = time.time()
    limite = t0 + espera_min * 60.0
    fd = _abre_trava()
    pegou = False
    doc = None
    try:
        aviso_em = 0.0
        while True:
            if _tranca(fd):
                pegou = True
                break
            agora = time.time()
            quem = descreve_info(le_info())
            if agora >= limite:
                raise comum.ErroSaida("trava de render: esperei %.0f min e a trava continua com %s. Nada foi rodado; "
                                      "veja kit.py doutor (KIT_TRAVA_ESPERA_MIN ou --espera aumentam a espera)"
                                      % (espera_min, quem), CODIGO_ESPERA)
            if agora >= aviso_em:
                saida("trava de render: esperando a vez de %s (%s); na frente: %s; tempo-limite %.0f min"
                      % (nome, comando, quem, espera_min))
                aviso_em = agora + AVISO_A_CADA_S
            time.sleep(min(intervalo, max(0.05, limite - agora)))
        token = secrets.token_hex(8)
        doc = {"versao": 1, "estado": "ocupada", "pid": os.getpid(), "criado": criado(os.getpid()), "token": token,
               "peca": nome, "comando": comando, "inicio": datetime.datetime.now().isoformat(timespec="seconds"),
               "epoch": time.time(), "cwd": comum.barra(os.getcwd()), "linha": " ".join(sys.argv)[:400]}
        _grava_info(doc)
        _ESTADO.update(fd=fd, token=token, nivel=1, info=doc, env_antes=os.environ.get("KIT_TRAVA_TOKEN"))
        os.environ["KIT_TRAVA_TOKEN"] = token
        _espera_renders_de_fora(limite, intervalo, espera_min, saida)
        esperou = time.time() - t0
        if esperou >= 1.0:
            saida("trava de render: a vez chegou depois de %.0f s de espera" % esperou)
        yield doc
    finally:
        if pegou:
            fim = {"versao": 1, "estado": "livre", "ultimo": doc,
                   "fim": datetime.datetime.now().isoformat(timespec="seconds"), "epoch": time.time()}
            try:
                _grava_info(fim)
            except Exception:  # noqa: BLE001
                pass
            antes = _ESTADO["env_antes"]
            if antes is None:
                os.environ.pop("KIT_TRAVA_TOKEN", None)
            else:
                os.environ["KIT_TRAVA_TOKEN"] = antes
            _destranca(fd)
            _ESTADO.update(fd=None, token=None, nivel=0, info=None, env_antes=None)
        os.close(fd)


# ---------- Temp próprio ----------
def env_temp(pasta, base=None):
    """Ambiente com TEMP, TMP e TMPDIR na pasta própria (o Node, o Remotion e o Chrome criam tudo lá)."""
    env = dict(base) if base is not None else comum.env_python()
    win = pasta.replace("/", "\\") if os.name == "nt" else pasta
    env["TEMP"] = env["TMP"] = env["TMPDIR"] = win
    return env


def _dentro_da_pasta(p):
    alvo = comum.barra(os.path.realpath(p)).casefold()
    return os.path.dirname(alvo) == comum.barra(os.path.realpath(PASTA)).casefold() and bool(
        RX_PASTA.match(os.path.basename(alvo)))


def apaga_pasta(p, tentativas=40):
    """Apaga uma pasta própria (só dentro de <Temp>/kit-motion, sem seguir link). {ok, bytes, erro}."""
    if not _dentro_da_pasta(p):
        return {"ok": False, "bytes": 0, "erro": "fora de %s ou nome fora do padrão: não apaguei" % PASTA}
    if not os.path.isdir(p):
        return {"ok": True, "bytes": 0, "erro": None}
    tam = limpa._tamanho(p)
    erro = None
    for _ in range(tentativas):
        try:
            limpa.apaga_arvore(p)
            erro = None
            break
        except FileNotFoundError:
            erro = None
            break
        except OSError as e:  # o Chrome segura o perfil por um instante depois de fechar
            erro = e
            time.sleep(0.25)
    ok = not os.path.exists(p)
    return {"ok": ok, "bytes": tam if ok else 0, "erro": None if ok else str(erro)}


@contextlib.contextmanager
def temp_proprio(peca, comando, simula=False, saida=print):
    """Cria <Temp>/kit-motion/r<pid>-<hhmmss>-<x>/ com o dono.json e apaga só ela no fim."""
    if simula:
        yield None
        return
    os.makedirs(PASTA, exist_ok=True)
    pasta = None
    for _ in range(20):
        cand = "%s/r%d-%s-%s" % (PASTA, os.getpid(), time.strftime("%H%M%S"), secrets.token_hex(2))
        try:
            os.makedirs(cand)
            pasta = cand
            break
        except FileExistsError:
            continue
    if pasta is None:
        raise comum.ErroSaida("não consegui criar a pasta própria no Temp (%s)" % PASTA)
    dono = {"versao": 1, "pid": os.getpid(), "criado": criado(os.getpid()), "peca": _nome_base(peca),
            "rotulo": _nome(peca), "comando": comando, "inicio": datetime.datetime.now().isoformat(timespec="seconds"),
            "epoch": time.time()}
    escrita.grava_json(pasta + "/dono.json", dono)
    try:
        yield pasta
    finally:
        r = apaga_pasta(pasta)
        if r["ok"]:
            saida("Temp próprio apagado: %s (%.1f MB)" % (pasta, r["bytes"] / 1048576))
        else:
            saida("AVISO: o Temp próprio ficou: %s (%s); kit.py limpa %s apaga depois" % (pasta, r["erro"], _nome(peca)))


# ---------- sobras ----------
def sobras(peca=None):
    """Pastas próprias em <Temp>/kit-motion: [{pasta, peca, comando, pid, vivo, inicio, mb}] (peca filtra)."""
    out = []
    if not os.path.isdir(PASTA):
        return out
    with os.scandir(PASTA) as it:
        entradas = sorted(it, key=lambda e: e.name)
    for e in entradas:
        if not RX_PASTA.match(e.name):
            continue
        try:
            if not e.is_dir(follow_symlinks=False):
                continue
        except OSError:
            continue
        dono = None
        try:
            with open(os.path.join(e.path, "dono.json"), encoding="utf-8") as f:
                dono = json.load(f)
        except (OSError, ValueError):
            dono = None
        pid = _pid((dono or {}).get("pid")) or _pid(RX_PASTA.match(e.name).group(1))
        v = mesmo_processo(pid, (dono or {}).get("criado"))
        item = {"pasta": comum.barra(e.path), "peca": (dono or {}).get("peca"), "rotulo": (dono or {}).get("rotulo"),
                "comando": (dono or {}).get("comando"), "pid": pid, "vivo": v, "inicio": (dono or {}).get("inicio"),
                "mb": limpa._tamanho(e.path) / 1048576}
        if peca is not None and (item["peca"] or "").casefold() != _nome_base(peca).casefold():
            continue
        out.append(item)
    return out


def limpa_sobras(peca=None, simula=False):
    """Apaga as pastas próprias de dono morto (só da peça, quando dada). {apagadas, ficaram, falhas, bytes}."""
    res = {"apagadas": [], "ficaram": [], "falhas": [], "bytes": 0, "simula": simula}
    for s in sobras(peca):
        if s["vivo"]:
            res["ficaram"].append(s)
            continue
        if simula:
            res["apagadas"].append(s)
            res["bytes"] += int(s["mb"] * 1048576)
            continue
        r = apaga_pasta(s["pasta"])
        if r["ok"]:
            res["apagadas"].append(s)
            res["bytes"] += r["bytes"]
        else:
            res["falhas"].append(dict(s, erro=r["erro"]))
    return res


# ---------- estado (doutor) ----------
def estado():
    """{info, trava: {...}|None, solta: bool|None, renders: [...]|None, sobras: [...], arquivo}"""
    info = le_info()
    trava = None
    if info and info.get("estado") == "ocupada":
        trava = dict(info, viva=mesmo_processo(info.get("pid"), info.get("criado")))
    return {"info": info, "trava": trava, "solta": trava_solta(), "renders": renders(), "sobras": sobras(),
            "arquivo": ARQ_TRAVA}


def ocupada(e=None):
    """Alguém está com a trava agora (pelo sistema e pelo registro)."""
    e = estado() if e is None else e
    t = e["trava"]
    return bool(t and t["viva"] and e["solta"] is not True) or e["solta"] is False


def resumo(e=None):
    """Linhas do estado (pro doutor e pra linha de comando): [(nivel, nome, mensagem)]. Nunca 'vermelho'."""
    e = estado() if e is None else e
    linhas = []
    t = e["trava"]
    info = e.get("info") or {}
    if ocupada(e):
        linhas.append(("aviso", "trava de render", "OCUPADA: %s. Render e stills de outra peça esperam a vez (até "
                       "%.0f min; --espera N muda)" % (descreve_info(t or info), _espera_padrao())))
    elif t and not t["viva"]:
        linhas.append(("info", "trava de render", "livre (o último dono, %s, morreu sem soltar e o sistema soltou)"
                       % descreve_info(t)))
    else:
        ult = info.get("ultimo") if info.get("estado") == "livre" else None
        fim = (info.get("fim") or "")[11:19]
        extra = (" (a última: %s, %s, até %s)" % (ult.get("peca"), ult.get("comando"), fim or "?")) if ult else ""
        linhas.append(("ok", "trava de render", "livre%s" % extra))
    rs = e["renders"]
    if rs is None:
        linhas.append(("aviso", "renders rodando", "não consegui ler os processos (PowerShell)"))
    elif not rs:
        linhas.append(("ok", "renders rodando", "nenhum (node com remotion render/still ou stills.mjs, e "
                       "chrome-headless-shell com o perfil do Remotion)"))
    else:
        for g in rs:
            linhas.append(("aviso", "render rodando", descreve_render(g)))
    sob = e["sobras"]
    mortas = [s for s in sob if not s["vivo"]]
    vivas = [s for s in sob if s["vivo"]]
    if vivas:
        linhas.append(("info", "Temp próprio em uso", "; ".join("%s (%s, PID %s)" % (s["rotulo"] or s["peca"],
                                                                                     s["comando"], s["pid"])
                                                              for s in vivas)))
    if mortas:
        por_peca = {}
        for s in mortas:
            por_peca.setdefault(s["peca"] or "?", []).append(s)
        txt = "; ".join("%s: %d pasta(s), %.1f MB" % (k, len(v), sum(x["mb"] for x in v)) for k, v in por_peca.items())
        linhas.append(("aviso", "sobras de render", "%s, de execução que já acabou: kit.py limpa <peça>" % txt))
    else:
        linhas.append(("ok", "sobras de render", "nenhuma pasta própria esquecida em %s" % PASTA))
    return linhas


def main(argv=None):
    comum.utf8()
    ap = argparse.ArgumentParser(prog="trava.py", description="Estado da trava de render do kit, dos renders rodando "
                                 "e das sobras de Temp próprio.")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    e = estado()
    if a.json:
        print(json.dumps(e, ensure_ascii=False, indent=2))
        return 0
    for nivel, nome, msg in resumo(e):
        print("[%-8s] %-22s %s" % (nivel, nome, msg))
    return 0


if __name__ == "__main__":
    sys.exit(main())
