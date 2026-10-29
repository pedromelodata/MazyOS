"""Caminhos fixos do Léo 3D no EDIT-ADMIN (Etapa 0 do PLANO.md)."""
from pathlib import Path

# Blender 5.2 LTS fixo em tudo (regra 6 do PLANO.md); conferido em 29/10/2026: 5.2.0 LTS
BLENDER = Path(r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe")
BLENDER_VERSAO = (5, 2)

RAIZ = Path(__file__).resolve().parents[1]
ENTRADAS = RAIZ / "entradas"
GERACOES = RAIZ / "geracoes"
RENDERS = RAIZ / "renders"
TAKES = RAIZ / "takes"

# Ferramentas fora do repo (Etapa 1): venv com onnxruntime e o modelo de recorte de fundo
# BiRefNet general lite (o mesmo do rembg, baixado do release dele; md5 4fab47adc4ff364be1713e97b7e66334)
FERRAMENTAS = Path(r"C:\Users\EDIT-ADMIN\.leo3d")
PY_FERRAMENTAS = FERRAMENTAS / "venv" / "Scripts" / "python.exe"
MODELO_RECORTE = FERRAMENTAS / "modelos" / "birefnet-general-lite.onnx"
