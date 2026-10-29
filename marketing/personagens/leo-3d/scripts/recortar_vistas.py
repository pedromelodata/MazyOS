"""Etapa 1 do PLANO.md: recorta as vistas da folha aprovada para a geração 3D.

Uso (com o Python do venv de ferramentas, que tem o onnxruntime):
    C:\\Users\\EDIT-ADMIN\\.leo3d\\venv\\Scripts\\python.exe recortar_vistas.py

Entra:  entradas/REF-leo-folha.png (4 painéis lado a lado: frente, perfil esquerdo, perfil direito, costas)
        entradas/REF-leo-frente.png (frente sozinha, em resolução maior)
Sai em entradas/vistas/:
    vista-<nome>.png         RGBA, fundo transparente
    vista-<nome>-branco.png  mesma vista sobre branco liso
    prancha-rodada-zero.png  as vistas lado a lado, para conferência

As 4 vistas da folha saem na MESMA escala e com os pés na mesma linha (o fator vem da frente),
cada uma em quadro quadrado próprio. "esquerda" é o lado esquerdo do Léo (o do selo), visto de lado.
"""
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ambiente import ENTRADAS, MODELO_RECORTE  # noqa: E402

SAIDA = ENTRADAS / "vistas"
QUADRO = 1024           # lado do quadro das vistas da folha
QUADRO_ALTA = 2048      # lado do quadro da frente em resolução maior
OCUPA = 0.88            # altura do Léo da frente em relação ao quadro
LIMIAR = 0.5            # alfa a partir do qual o pixel conta para a caixa do Léo

PAINEIS = ["frente", "esquerda", "direita", "costas"]


def mascara(sessao, im):
    """Alfa de 0 a 1 do BiRefNet, com o mesmo pré e pós-processamento do rembg."""
    x = np.asarray(im.convert("RGB").resize((1024, 1024), Image.LANCZOS), dtype=np.float32)
    x = x / max(float(x.max()), 1e-6)
    x = (x - (0.485, 0.456, 0.406)) / (0.229, 0.224, 0.225)
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    pred = sessao.run(None, {sessao.get_inputs()[0].name: x})[0][0, 0]
    pred = 1 / (1 + np.exp(-pred))
    pred = (pred - pred.min()) / max(float(pred.max() - pred.min()), 1e-6)
    m = Image.fromarray((pred * 255).astype(np.uint8)).resize(im.size, Image.LANCZOS)
    return np.asarray(m, dtype=np.float32) / 255


def caixa(alfa):
    ys, xs = np.nonzero(alfa >= LIMIAR)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def recortar(im, alfa):
    rgba = np.dstack([np.asarray(im.convert("RGB")), (alfa * 255).astype(np.uint8)])
    x0, y0, x1, y1 = caixa(alfa)
    return Image.fromarray(rgba, "RGBA").crop((x0, y0, x1, y1))


def no_quadro(recorte, escala, lado):
    """Põe o recorte num quadro quadrado: centrado na horizontal, pés na linha de base comum."""
    w, h = recorte.size
    r = recorte.resize((max(1, round(w * escala)), max(1, round(h * escala))), Image.LANCZOS)
    base = lado - round(lado * (1 - OCUPA) / 2)
    q = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    q.alpha_composite(r, ((lado - r.width) // 2, base - r.height))
    return q


def salvar(q, nome):
    q.save(SAIDA / f"vista-{nome}.png", optimize=True)
    branco = Image.new("RGBA", q.size, (255, 255, 255, 255))
    branco.alpha_composite(q)
    branco.convert("RGB").save(SAIDA / f"vista-{nome}-branco.png", optimize=True)


def main():
    SAIDA.mkdir(parents=True, exist_ok=True)
    sessao = ort.InferenceSession(str(MODELO_RECORTE), providers=["CPUExecutionProvider"])

    folha = Image.open(ENTRADAS / "REF-leo-folha.png")
    larg = folha.width // len(PAINEIS)
    recortes = {}
    for i, nome in enumerate(PAINEIS):
        painel = folha.crop((i * larg, 0, (i + 1) * larg, folha.height))
        recortes[nome] = recortar(painel, mascara(sessao, painel))
        print(nome, "recorte", recortes[nome].size)

    # Uma escala só para as 4 vistas, tirada da altura da frente
    escala = QUADRO * OCUPA / recortes["frente"].height
    quadros = {}
    for nome, r in recortes.items():
        quadros[nome] = no_quadro(r, escala, QUADRO)
        salvar(quadros[nome], nome)
    print(f"escala comum {escala:.3f}")

    frente = Image.open(ENTRADAS / "REF-leo-frente.png")
    r = recortar(frente, mascara(sessao, frente))
    salvar(no_quadro(r, QUADRO_ALTA * OCUPA / r.height, QUADRO_ALTA), "frente-alta")
    print("frente-alta recorte", r.size)

    prancha = Image.new("RGB", (QUADRO * len(PAINEIS), QUADRO), (236, 236, 236))
    for i, nome in enumerate(PAINEIS):
        prancha.paste(quadros[nome], (i * QUADRO, 0), quadros[nome])
    prancha.save(SAIDA / "prancha-rodada-zero.png", optimize=True)


if __name__ == "__main__":
    main()
