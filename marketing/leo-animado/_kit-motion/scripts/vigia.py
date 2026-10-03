"""Vigia de disco do render e dos stills (pacote K07). Contrato: KIT/DESENHO.md, seção 7.4.

Roda um comando e lê o espaço livre do C: logo no começo e a cada 2 s. Abaixo do limite (KIT_LIMITE_DISCO_MB,
padrão 250 MB), mata a árvore do processo (taskkill /T /F /PID), apaga a saída parcial (só se não for hardlink)
e a pasta de Temp própria da execução (temp_privado; a limpeza por janela de tempo saiu em 03/10, porque apagava o
bundle de outra sessão), e sai com código 1 e a mensagem do disco. Se o comando termina sozinho, devolve o código dele.

Pela linha de comando, o vigia também espera a vez na trava de render do kit (trava.py) e roda o comando com TEMP,
TMP e TMPDIR numa pasta própria em <Temp>/kit-motion/, apagada no fim (--sem-trava desliga as duas coisas).

Uso (sempre com python -B):
    python -B vigia.py [--saida <arquivo parcial>] [--limite <MB>] [--intervalo <s>] [--peca <nome>] [--espera <min>]
                       [--sem-trava] -- <comando> [args...]
Importável: roda(cmd, cwd=None, saida=None, limite_mb=None, intervalo=2.0, env=None, temp_privado=None)
            -> (codigo, info)
"""
import sys

sys.dont_write_bytecode = True

import argparse  # noqa: E402
import os  # noqa: E402
import subprocess  # noqa: E402
import time  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path:
    sys.path.insert(0, AQUI)
import comum  # noqa: E402
from comum import escrita  # noqa: E402


def limite_padrao():
    try:
        return float(os.environ.get("KIT_LIMITE_DISCO_MB", comum.LIMITE_VIGIA_MB))
    except ValueError:
        return float(comum.LIMITE_VIGIA_MB)


def mata_arvore(pid):
    """taskkill /T /F /PID: o processo e todos os filhos (node, chrome, ffmpeg do Remotion)."""
    if os.name == "nt":
        r = subprocess.run(["taskkill", "/T", "/F", "/PID", str(pid)], capture_output=True, text=True,
                           encoding="utf-8", errors="replace")
        return r.returncode, (r.stdout + r.stderr).strip()
    os.kill(pid, 9)
    return 0, "kill -9"


def apaga_parcial(saida):
    if not saida or not os.path.lexists(saida):
        return "nenhuma saída parcial"
    try:
        st = os.stat(saida)
    except OSError as e:
        return "não consegui ler a saída parcial: %s" % e
    if st.st_nlink > 1:
        return "a saída %s é hardlink (st_nlink %d): NÃO apaguei" % (saida, st.st_nlink)
    if escrita.protegido(saida):
        return "a saída %s é caminho protegido: NÃO apaguei" % saida
    for _ in range(20):
        try:
            os.remove(saida)
            return "saída parcial apagada: %s" % saida
        except PermissionError:
            time.sleep(0.2)
        except FileNotFoundError:
            return "saída parcial já tinha sumido"
    return "não consegui apagar a saída parcial %s (presa)" % saida


def _apaga_temp_privado(temp_privado):
    """Só a pasta própria da execução; sem ela, nada no Temp (o resto é de outras sessões)."""
    if not temp_privado:
        return {"apagadas": [], "falhas": [], "bytes": 0,
                "nota": "sem Temp próprio: nada apagado no Temp (kit.py limpa <peça> depois)"}
    import trava
    r = trava.apaga_pasta(temp_privado)
    if r["ok"]:
        return {"apagadas": [temp_privado], "falhas": [], "bytes": r["bytes"]}
    return {"apagadas": [], "falhas": [{"pasta": temp_privado, "erro": r["erro"]}], "bytes": 0}


def roda(cmd, cwd=None, saida=None, limite_mb=None, intervalo=2.0, env=None, temp_privado=None):
    """Roda `cmd` vigiando o disco. Devolve (codigo, info). temp_privado: a pasta de Temp da execução (é a única que
    o vigia apaga se abortar)."""
    limite = limite_padrao() if limite_mb is None else float(limite_mb)
    inicio = time.time()
    info = {"limite_mb": limite, "intervalo_s": intervalo, "inicio": inicio, "leituras": 0, "minimo_mb": None,
            "abortou": False}
    p = subprocess.Popen([str(c) for c in cmd], cwd=cwd, env=env or comum.env_python())
    info["pid"] = p.pid
    while True:
        livre = escrita.livre_mb()
        info["leituras"] += 1
        info["minimo_mb"] = livre if info["minimo_mb"] is None else min(info["minimo_mb"], livre)
        if livre < limite:
            t_mata = time.time()
            cod_kill, msg_kill = mata_arvore(p.pid)
            try:
                p.wait(timeout=15)
            except subprocess.TimeoutExpired:
                pass
            info.update({"abortou": True, "livre_mb": round(livre, 1), "segundos_ate_matar": round(t_mata - inicio, 3),
                         "taskkill": {"codigo": cod_kill, "saida": msg_kill[:400]},
                         "processo_vivo": p.poll() is None})
            info["parcial"] = apaga_parcial(saida)
            info["temp"] = _apaga_temp_privado(temp_privado)
            msg = ("disco: %.0f MB livres no C:, abaixo do limite de %.0f MB (KIT_LIMITE_DISCO_MB): o processo %d foi "
                   "interrompido; %s; %d pasta(s) do Temp apagada(s) (só a própria)"
                   % (livre, limite, p.pid, info["parcial"], len(info["temp"]["apagadas"])))
            info["mensagem"] = msg
            print("VIGIA: " + msg, flush=True)
            return 1, info
        try:
            codigo = p.wait(timeout=intervalo)
            info["duracao_s"] = round(time.time() - inicio, 2)
            info["codigo"] = codigo
            return codigo, info
        except subprocess.TimeoutExpired:
            continue


def main(argv=None):
    comum.utf8()
    argv = list(sys.argv[1:] if argv is None else argv)
    if "--" not in argv:
        print(__doc__)
        return 2
    i = argv.index("--")
    ap = argparse.ArgumentParser(prog="vigia.py", description="Vigia de disco (K07).")
    ap.add_argument("--saida", help="saída parcial a apagar se o disco acabar")
    ap.add_argument("--limite", type=float, help="limite em MB (padrão KIT_LIMITE_DISCO_MB ou 250)")
    ap.add_argument("--intervalo", type=float, default=2.0)
    ap.add_argument("--cwd")
    ap.add_argument("--peca", help="nome da peça (ou rótulo) que aparece na trava e no doutor (padrão 'vigia')")
    ap.add_argument("--espera", type=float, help="minutos de espera pela trava de render (padrão 40)")
    ap.add_argument("--sem-trava", action="store_true",
                    help="não espera a trava de render nem usa Temp próprio (só pra comando que não renderiza)")
    a = ap.parse_args(argv[:i])
    cmd = argv[i + 1:]
    if not cmd:
        print("falta o comando depois de --")
        return 2
    if a.sem_trava:
        codigo, info = roda(cmd, cwd=a.cwd, saida=a.saida, limite_mb=a.limite, intervalo=a.intervalo)
    else:
        import trava
        rotulo = a.peca or "vigia"
        try:
            with trava.render(rotulo, "vigia: " + " ".join(cmd)[:120], espera_min=a.espera):
                with trava.temp_proprio(rotulo, "vigia") as tmp:
                    print("vigia: Temp próprio %s" % tmp, flush=True)
                    codigo, info = roda(cmd, cwd=a.cwd, saida=a.saida, limite_mb=a.limite, intervalo=a.intervalo,
                                        env=trava.env_temp(tmp), temp_privado=tmp)
        except comum.ErroSaida as e:
            print("erro: %s" % e)
            return e.codigo
    if info.get("abortou"):
        print("vigia: abortado em %.2f s (%d leitura(s) do disco)" % (info["segundos_ate_matar"], info["leituras"]))
    return codigo


if __name__ == "__main__":
    sys.exit(main())
