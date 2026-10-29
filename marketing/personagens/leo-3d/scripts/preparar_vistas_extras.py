"""Etapa 1: prepara o Top e o Bottom (gerados em fundo preto) para o Multiple Images do Hunyuan.

Uso (com o Python do venv de ferramentas):
    C:\\Users\\EDIT-ADMIN\\.leo3d\\venv\\Scripts\\python.exe -I preparar_vistas_extras.py <bottom> <top>

Sai em entradas/geradas/:
    vista-base-bruta.<ext>, vista-topo-bruta.<ext>   cópias das imagens como vieram
    vista-base.png, vista-topo.png                   fundo cinza igual ao das outras 6 vistas
    conferencia-base-topo.png                        as duas lado a lado com a máscara, para conferir cauda e pelo

Troca de fundo: com fundo preto puro, o pixel é alfa * cor do Léo, então o novo pixel é
pixel + (1 - alfa) * cinza. Assim a borda do pelo não fica com halo escuro.

O Top é girado 180 graus: no exemplo do Hunyuan, a vista de cima tem a frente para BAIXO
na imagem (a câmera sobe por cima da cabeça a partir da frente) e a de baixo tem a frente para CIMA.
"""
import shutil
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ambiente import ENTRADAS, MODELO_RECORTE  # noqa: E402
from recortar_vistas import mascara  # noqa: E402

SAIDA = ENTRADAS / "geradas"
CINZA = np.array((188, 187, 187), dtype=np.float32)  # fundo das outras 6 vistas, medido no print do Hunyuan
PRETO_MAX = 8        # o fundo tem de ser preto puro para a conta da troca valer


def trocar_fundo(im, alfa):
    px = np.asarray(im.convert("RGB"), dtype=np.float32)
    novo = px + (1 - alfa[..., None]) * CINZA
    return Image.fromarray(np.clip(novo, 0, 255).round().astype(np.uint8), "RGB")


def main():
    bottom, top = (Path(a) for a in sys.argv[1:3])
    SAIDA.mkdir(parents=True, exist_ok=True)
    sessao = ort.InferenceSession(str(MODELO_RECORTE), providers=["CPUExecutionProvider"])
    prontas, mascaras = [], []
    for origem, nome, girar in ((bottom, "base", False), (top, "topo", True)):
        shutil.copyfile(origem, SAIDA / f"vista-{nome}-bruta{origem.suffix.lower()}")
        im = Image.open(origem).convert("RGB")
        canto = np.asarray(im, dtype=np.int32)[:40].max()
        if canto > PRETO_MAX:
            sys.exit(f"{origem}: fundo não é preto puro (máximo {canto} no alto da imagem)")
        alfa = mascara(sessao, im)
        q = trocar_fundo(im, alfa)
        m = Image.fromarray((alfa * 255).astype(np.uint8))
        if girar:
            q, m = q.rotate(180), m.rotate(180)
        q.save(SAIDA / f"vista-{nome}.png", optimize=True)
        prontas.append(q)
        mascaras.append(m.convert("RGB"))
        print(nome, im.size, "girada 180" if girar else "sem giro")

    w, h = prontas[0].size
    folha = Image.new("RGB", (w * 4, h), (40, 40, 40))
    for i, im in enumerate(prontas + mascaras):
        folha.paste(im.resize((w, h)), (i * w, 0))
    folha.save(SAIDA / "conferencia-base-topo.png", optimize=True)


if __name__ == "__main__":
    main()
