"""Fila de render do Léo 3D no próprio PC, dia e noite, que retoma sozinha (PLANO.md, Etapa 0 e Etapa 8).

Uso:
    python render_lote.py rodar     processa a fila até esvaziar (a tarefa agendada chama este)
    python render_lote.py status    mostra os trabalhos e quantos quadros já saíram

Cada trabalho é um JSON em renders/fila/ (ordem pelo nome do arquivo):
    {
      "blend": "caminho do .blend (relativo à pasta leo-3d ou absoluto)",
      "saida": "renders/<nome>/quadro_####.png",
      "inicio": 1,
      "fim": 720,
      "motor": "CYCLES",          opcional; sem ele vale o do .blend
      "dispositivo": "OPTIX",     opcional; OPTIX, CUDA ou CPU
      "alfa": true                opcional; PNG RGBA com fundo transparente
    }

Retomada: o Blender roda com use_overwrite desligado e use_placeholder ligado, então pula o que já saiu.
Antes de cada trabalho, o quadro cortado no meio (placeholder vazio ou PNG sem o fim) é apagado e refeito.
Com renders/fila/PAUSA presente, nada começa. Com menos de MIN_LIVRE_GB no disco, a fila para.
"""
import ctypes
import datetime as dt
import json
import os
import shutil
import subprocess
import sys
import threading
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ambiente import BLENDER, RAIZ, RENDERS  # noqa: E402

FILA = RENDERS / "fila"
FEITOS = FILA / "feitos"
LOGS = RENDERS / "logs"
TRAVA = FILA / ".rodando"
PAUSA = FILA / "PAUSA"

MIN_LIVRE_GB = 3.0
TEMP_ALERTA_C = 83
INTERVALO_TEMP_S = 30

SEM_JANELA = 0x08000000  # CREATE_NO_WINDOW
PRIORIDADE_BAIXA = 0x00004000  # BELOW_NORMAL_PRIORITY_CLASS: o PC continua usável durante a fila

# Roda dentro do Blender depois de abrir o .blend. Recebe o trabalho em JSON pela variável LEO_TRABALHO.
PREPARO = r"""
import bpy, json, os
t = json.loads(os.environ["LEO_TRABALHO"])
cena = bpy.context.scene
r = cena.render
r.use_overwrite = False
r.use_placeholder = True
if t.get("motor"):
    r.engine = t["motor"]
if t.get("alfa", True):
    r.film_transparent = True
    r.image_settings.file_format = "PNG"
    r.image_settings.color_mode = "RGBA"
if r.engine == "CYCLES":
    disp = t.get("dispositivo", "OPTIX")
    if disp == "CPU":
        cena.cycles.device = "CPU"
    else:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = disp
        prefs.get_devices()
        for d in prefs.devices:
            d.use = d.type == disp
        cena.cycles.device = "GPU"
print("LEO_PREPARO ok", r.engine, cena.cycles.device if r.engine == "CYCLES" else "")
"""


def agora():
    return dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def log(msg):
    LOGS.mkdir(parents=True, exist_ok=True)
    linha = f"{agora()}  {msg}"
    with open(LOGS / "fila.log", "a", encoding="utf-8") as f:
        f.write(linha + "\n")
    if sys.stdout:
        print(linha)


def processo_vivo(pid):
    h = ctypes.windll.kernel32.OpenProcess(0x1000, False, pid)  # PROCESS_QUERY_LIMITED_INFORMATION
    if not h:
        return False
    codigo = ctypes.c_ulong()
    ctypes.windll.kernel32.GetExitCodeProcess(h, ctypes.byref(codigo))
    ctypes.windll.kernel32.CloseHandle(h)
    return codigo.value == 259  # STILL_ACTIVE


def pegar_trava():
    FILA.mkdir(parents=True, exist_ok=True)
    if TRAVA.exists():
        try:
            pid = json.loads(TRAVA.read_text(encoding="utf-8"))["pid"]
            if processo_vivo(pid):
                return False
        except (ValueError, KeyError):
            pass
        log("trava antiga sem processo vivo: a fila caiu e está sendo retomada")
    TRAVA.write_text(json.dumps({"pid": os.getpid(), "inicio": agora()}), encoding="utf-8")
    return True


def caminho(p):
    p = Path(p)
    return p if p.is_absolute() else RAIZ / p


def quadro(saida, n):
    """Caminho do quadro n no padrão do Blender (#### vira o número com zeros)."""
    s = str(saida)
    i = s.find("#")
    j = i
    while j < len(s) and s[j] == "#":
        j += 1
    return Path(s[:i] + str(n).zfill(j - i) + s[j:])


def quadro_inteiro(p):
    if not p.exists() or p.stat().st_size == 0:
        return False
    if p.suffix.lower() == ".png":
        with open(p, "rb") as f:
            f.seek(-12, os.SEEK_END)
            return f.read(12)[4:8] == b"IEND"
    return True


def limpar_cortados(t):
    """Apaga placeholder vazio e PNG cortado no meio, para o Blender refazer esses quadros."""
    saida = caminho(t["saida"])
    apagados = []
    for n in range(t["inicio"], t["fim"] + 1):
        p = quadro(saida, n)
        if p.exists() and not quadro_inteiro(p):
            p.unlink()
            apagados.append(n)
    return apagados


def faltam(t):
    saida = caminho(t["saida"])
    return [n for n in range(t["inicio"], t["fim"] + 1) if not quadro_inteiro(quadro(saida, n))]


def livre_gb():
    return shutil.disk_usage(RAIZ).free / 2**30


def vigiar_temperatura(parar):
    """Registro contínuo da placa enquanto a fila roda; acima de TEMP_ALERTA_C, grava alerta."""
    arq = LOGS / "temperatura.csv"
    novo = not arq.exists()
    while not parar.is_set():
        try:
            r = subprocess.run(
                ["nvidia-smi", "--query-gpu=temperature.gpu,power.draw,utilization.gpu,memory.used",
                 "--format=csv,noheader,nounits"],
                capture_output=True, text=True, timeout=20, creationflags=SEM_JANELA)
            valores = [v.strip() for v in r.stdout.strip().split(",")]
            with open(arq, "a", encoding="utf-8") as f:
                if novo:
                    f.write("hora,temperatura_c,potencia_w,uso_pct,memoria_mib\n")
                    novo = False
                f.write(",".join([agora()] + valores) + "\n")
            if valores and valores[0].isdigit() and int(valores[0]) >= TEMP_ALERTA_C:
                with open(LOGS / "alertas.log", "a", encoding="utf-8") as f:
                    f.write(f"{agora()}  placa a {valores[0]} °C (limite de alerta {TEMP_ALERTA_C} °C)\n")
        except (OSError, subprocess.SubprocessError):
            pass
        parar.wait(INTERVALO_TEMP_S)


def renderizar(nome, t):
    cortados = limpar_cortados(t)
    if cortados:
        log(f"{nome}: refazendo quadros cortados no meio: {cortados}")
    falta = faltam(t)
    if not falta:
        return True
    log(f"{nome}: faltam {len(falta)} de {t['fim'] - t['inicio'] + 1} quadros (primeiro: {falta[0]})")
    saida = caminho(t["saida"])
    saida.parent.mkdir(parents=True, exist_ok=True)
    cmd = [str(BLENDER), "-b", str(caminho(t["blend"])), "--python-expr", PREPARO,
           "-o", str(saida), "-s", str(t["inicio"]), "-e", str(t["fim"]), "-a"]
    env = dict(os.environ, LEO_TRABALHO=json.dumps(t))
    with open(LOGS / f"{nome}.log", "a", encoding="utf-8") as f:
        f.write(f"\n===== {agora()} =====\n")
        f.flush()
        r = subprocess.run(cmd, stdout=f, stderr=subprocess.STDOUT, env=env,
                           creationflags=SEM_JANELA | PRIORIDADE_BAIXA)
    falta = faltam(t)
    log(f"{nome}: Blender saiu com código {r.returncode}; faltam {len(falta)} quadros")
    return not falta


def rodar():
    if PAUSA.exists():
        return
    if not pegar_trava():
        return
    parar = threading.Event()
    threading.Thread(target=vigiar_temperatura, args=(parar,), daemon=True).start()
    try:
        while True:
            if PAUSA.exists():
                log("PAUSA encontrada: a fila para depois do trabalho atual")
                break
            trabalhos = sorted(FILA.glob("*.json"))
            if not trabalhos:
                break
            arq = trabalhos[0]
            t = json.loads(arq.read_text(encoding="utf-8"))
            if livre_gb() < MIN_LIVRE_GB:
                log(f"disco com {livre_gb():.1f} GB livres (mínimo {MIN_LIVRE_GB} GB): fila parada")
                break
            if renderizar(arq.stem, t):
                FEITOS.mkdir(parents=True, exist_ok=True)
                arq.replace(FEITOS / f"{dt.datetime.now():%Y%m%d-%H%M%S}_{arq.name}")
                log(f"{arq.stem}: pronto")
            else:
                log(f"{arq.stem}: ficou incompleto; a próxima rodada da tarefa agendada tenta de novo")
                break
    finally:
        parar.set()
        TRAVA.unlink(missing_ok=True)


def status():
    rodando = TRAVA.exists() and processo_vivo(json.loads(TRAVA.read_text(encoding="utf-8"))["pid"])
    print(f"fila {'rodando' if rodando else 'parada'}{' (PAUSA)' if PAUSA.exists() else ''}; "
          f"disco com {livre_gb():.1f} GB livres")
    for arq in sorted(FILA.glob("*.json")):
        t = json.loads(arq.read_text(encoding="utf-8"))
        total = t["fim"] - t["inicio"] + 1
        print(f"  {arq.stem}: {total - len(faltam(t))} de {total} quadros")


if __name__ == "__main__":
    {"rodar": rodar, "status": status}[sys.argv[1] if len(sys.argv) > 1 else "status"]()
