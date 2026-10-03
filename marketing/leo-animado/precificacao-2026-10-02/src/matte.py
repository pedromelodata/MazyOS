# Recorte do Léo (canal alfa) quadro a quadro, sobre o fundo papel uniforme dos takes.
# Fundo = região clara LIGADA À BORDA do quadro (badge branco, dentes e brilho do olho ficam opacos);
# borda do pelo com alfa suave pela distância de cor; despill tira o halo claro.
import numpy as np, cv2

BG = np.array([250, 248, 245], np.float32)
_bg_lab = cv2.cvtColor(BG.astype(np.uint8)[None, None, :], cv2.COLOR_RGB2LAB)[0, 0].astype(np.float32)

def delta_e(rgb):
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
    dl = (lab[..., 0] - _bg_lab[0]) * (100 / 255)
    da = lab[..., 1] - _bg_lab[1]; db = lab[..., 2] - _bg_lab[2]
    return np.sqrt(dl * dl + da * da + db * db)

def matte(rgb, lo=2.5, hi=11.0):
    """rgb uint8 HxWx3 (fundo já normalizado pra #FAF8F5) -> (rgb_despill uint8, alpha uint8)."""
    h, w, _ = rgb.shape
    small = cv2.resize(rgb, (w // 2, h // 2), interpolation=cv2.INTER_AREA)
    de_s = delta_e(small)
    cand = (de_s < 7.0).astype(np.uint8)
    n, lab = cv2.connectedComponents(cand, connectivity=4)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    border = border[border > 0]
    bgc = np.isin(lab, border).astype(np.uint8)
    bgc = cv2.dilate(bgc, np.ones((3, 3), np.uint8), 1)          # inclui a faixa de transição
    bgc = cv2.resize(bgc, (w, h), interpolation=cv2.INTER_NEAREST).astype(bool)
    de = delta_e(rgb)
    soft = np.clip((de - lo) / (hi - lo), 0, 1); soft = soft * soft * (3 - 2 * soft)
    a = np.where(bgc, soft, 1.0).astype(np.float32)
    a = cv2.GaussianBlur(a, (3, 3), 0)
    # despill: tira a mistura com o papel nas bordas semi-transparentes
    f = rgb.astype(np.float32)
    edge = (a > 0.02) & (a < 0.98)
    aa = np.maximum(a, 0.12)[..., None]
    un = (f - (1 - aa) * BG[None, None, :]) / aa
    f = np.where(edge[..., None], np.clip(un, 0, 255), f)
    return f.astype(np.uint8), (a * 255).round().astype(np.uint8)
