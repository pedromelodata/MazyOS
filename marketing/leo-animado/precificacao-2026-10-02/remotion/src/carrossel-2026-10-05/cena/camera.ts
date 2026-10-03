import * as THREE from "three";
import type { CamCfg } from "../dados";

// Câmera padrão de todas as telas (ESPEC 2.5) e o encaixe dos objetos pelas caixas de tela.
// PerspectiveCamera manual, elevação de 12°, distância de 0,93 m, alvo no meio do palco a 0,075 m do chão.
// O deslocamento de lente vem do setViewOffset(1080, 2*cy, 0, 0, 1080, 1350): o centro óptico fica em y = cy
// sem inclinar mais a câmera. O fov sai da escala: tan(fov/2) = cy / (distância * px por metro).

export const W = 1080;
export const H = 1350;
export const DISTANCIA = 0.93;
export const ELEVACAO = 12;
export const ALVO_Y = 0.075;

export type Caixa = [number, number, number, number]; // x0, y0, x1, y1 em px do quadro

type CameraManual = THREE.PerspectiveCamera & { manual?: boolean };

export function configuraCamera(cam: THREE.PerspectiveCamera, c: CamCfg) {
  const el = THREE.MathUtils.degToRad(ELEVACAO);
  const alvo = new THREE.Vector3(0, ALVO_Y, 0);
  (cam as CameraManual).manual = true; // o R3F não mexe no aspect nem desfaz o deslocamento de lente
  cam.up.set(0, 1, 0);
  cam.position.set(alvo.x, alvo.y + DISTANCIA * Math.sin(el), alvo.z + DISTANCIA * Math.cos(el));
  cam.lookAt(alvo);
  cam.near = 0.02;
  cam.far = 6;
  cam.zoom = 1;
  cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(c.cy / (DISTANCIA * c.s)));
  cam.setViewOffset(W, 2 * c.cy, 0, 0, W, H); // também acerta o aspect (1080 / 2cy) e a projeção
  cam.updateMatrixWorld(true);
}

const _v = new THREE.Vector3();

/** ponto do mundo em px do quadro 1080 x 1350 */
export function projeta(p: THREE.Vector3, cam: THREE.Camera): [number, number] {
  _v.copy(p).project(cam);
  return [((_v.x + 1) / 2) * W, ((1 - _v.y) / 2) * H];
}

/** raio do pixel (px, py) até o plano horizontal y = h */
export function noPlanoY(px: number, py: number, h: number, cam: THREE.PerspectiveCamera): THREE.Vector3 {
  const p = new THREE.Vector3((px / W) * 2 - 1, 1 - (py / H) * 2, 0.5).unproject(cam);
  const dir = p.sub(cam.position).normalize();
  const t = (h - cam.position.y) / dir.y;
  return cam.position.clone().addScaledVector(dir, t);
}

/** raio do pixel (px, py) até o plano vertical z = z0 (de frente pra câmera) */
export function noPlanoZ(px: number, py: number, z0: number, cam: THREE.PerspectiveCamera): THREE.Vector3 {
  const p = new THREE.Vector3((px / W) * 2 - 1, 1 - (py / H) * 2, 0.5).unproject(cam);
  const dir = p.sub(cam.position).normalize();
  const t = (z0 - cam.position.z) / dir.z;
  return cam.position.clone().addScaledVector(dir, t);
}

/** caixa de tela de um objeto: projeta os vértices de todas as malhas visíveis (marcadas com
 *  userData.foraDaCaixa ficam de fora, como planos de sombra e luzes) */
export function caixaTela(obj: THREE.Object3D, cam: THREE.Camera): Caixa {
  obj.updateWorldMatrix(true, true);
  const b: Caixa = [Infinity, Infinity, -Infinity, -Infinity];
  obj.traverseVisible((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || m.userData.foraDaCaixa) return;
    const pos = m.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (!pos) return;
    const passo = Math.max(1, Math.floor(pos.count / 60000));
    for (let i = 0; i < pos.count; i += passo) {
      _v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).project(cam);
      const px = ((_v.x + 1) / 2) * W;
      const py = ((1 - _v.y) / 2) * H;
      if (px < b[0]) b[0] = px;
      if (py < b[1]) b[1] = py;
      if (px > b[2]) b[2] = px;
      if (py > b[3]) b[3] = py;
    }
  });
  return b;
}

/** caixa do mundo (só malhas visíveis e que contam) */
export function caixaMundo(obj: THREE.Object3D): THREE.Box3 {
  obj.updateWorldMatrix(true, true);
  const box = new THREE.Box3();
  const tmp = new THREE.Box3();
  obj.traverseVisible((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || m.userData.foraDaCaixa) return;
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    tmp.copy(m.geometry.boundingBox as THREE.Box3).applyMatrix4(m.matrixWorld);
    box.union(tmp);
  });
  return box;
}

/** altura do vértice mais baixo do objeto, no mundo */
export function minimoY(obj: THREE.Object3D): number {
  obj.updateWorldMatrix(true, true);
  let min = Infinity;
  obj.traverseVisible((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || m.userData.foraDaCaixa) return;
    const pos = m.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    if (!pos) return;
    const passo = Math.max(1, Math.floor(pos.count / 60000));
    for (let i = 0; i < pos.count; i += passo) {
      _v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
      if (_v.y < min) min = _v.y;
    }
  });
  return min;
}

/** põe o ponto mais baixo do objeto em y = base (objeto filho direto do grupo de objetos, sem escala no pai) */
export function assenta(obj: THREE.Object3D, base = 0) {
  const min = minimoY(obj);
  if (isFinite(min)) obj.position.y += base - min;
  obj.updateWorldMatrix(true, true);
}

export type Escala = "altura" | "largura" | "cabe" | null;
export type OpEncaixe = {
  base?: number; // altura (m) do plano em que o ponto mais baixo do objeto está (chão = 0)
  escala?: Escala;
  limites?: [number, number]; // limites da escala em relação à escala modelada
  apoio?: boolean; // reassenta no plano da base a cada passo (objetos no chão)
  soX?: boolean; // resolve só o x (o z fica como está)
};

/** Encaixa o objeto na caixa alvo: o meio da base da caixa projetada vai pro meio da base da caixa alvo,
 *  andando no plano y = base. Com escala, ajusta também o tamanho (dentro dos limites). */
export function encaixa(obj: THREE.Object3D, alvo: Caixa, cam: THREE.PerspectiveCamera, op: OpEncaixe = {}): Caixa {
  const base = op.base ?? 0;
  const [smin, smax] = op.limites ?? [0.85, 1.2];
  const s0 = obj.scale.x;
  if (op.apoio !== false) assenta(obj, base);
  for (let it = 0; it < 14; it++) {
    let c = caixaTela(obj, cam);
    if (op.escala) {
      const kh = (alvo[3] - alvo[1]) / Math.max(1, c[3] - c[1]);
      const kw = (alvo[2] - alvo[0]) / Math.max(1, c[2] - c[0]);
      const k = op.escala === "altura" ? kh : op.escala === "largura" ? kw : Math.min(kh, kw);
      const s = THREE.MathUtils.clamp(obj.scale.x * k, s0 * smin, s0 * smax);
      obj.scale.setScalar(s);
      if (op.apoio !== false) assenta(obj, base);
      c = caixaTela(obj, cam);
    }
    const ax = (c[0] + c[2]) / 2;
    const ay = c[3];
    const tx = (alvo[0] + alvo[2]) / 2;
    const ty = alvo[3];
    if (Math.abs(ax - tx) < 0.25 && (op.soX || Math.abs(ay - ty) < 0.25) && it > 0) break;
    const pa = noPlanoY(ax, ay, base, cam);
    const pt = noPlanoY(tx, op.soX ? ay : ty, base, cam);
    obj.position.x += pt.x - pa.x;
    if (!op.soX) obj.position.z += pt.z - pa.z;
    if (op.apoio !== false) assenta(obj, base);
  }
  return caixaTela(obj, cam);
}

/** Encaixe de objeto que flutua: o centro da caixa projetada vai pro centro da caixa alvo, andando no plano
 *  vertical z = z0 (de frente pra câmera). */
export function encaixaVertical(obj: THREE.Object3D, alvo: Caixa, cam: THREE.PerspectiveCamera, z0: number, op: { escala?: Escala; limites?: [number, number] } = {}): Caixa {
  const [smin, smax] = op.limites ?? [0.85, 1.2];
  const s0 = obj.scale.x;
  obj.position.z = z0;
  for (let it = 0; it < 14; it++) {
    let c = caixaTela(obj, cam);
    if (op.escala) {
      const kh = (alvo[3] - alvo[1]) / Math.max(1, c[3] - c[1]);
      const kw = (alvo[2] - alvo[0]) / Math.max(1, c[2] - c[0]);
      const k = op.escala === "altura" ? kh : op.escala === "largura" ? kw : Math.min(kh, kw);
      obj.scale.setScalar(THREE.MathUtils.clamp(obj.scale.x * k, s0 * smin, s0 * smax));
      c = caixaTela(obj, cam);
    }
    const ax = (c[0] + c[2]) / 2;
    const ay = (c[1] + c[3]) / 2;
    const tx = (alvo[0] + alvo[2]) / 2;
    const ty = (alvo[1] + alvo[3]) / 2;
    if (Math.abs(ax - tx) < 0.25 && Math.abs(ay - ty) < 0.25 && it > 0) break;
    const pa = noPlanoZ(ax, ay, z0, cam);
    const pt = noPlanoZ(tx, ty, z0, cam);
    obj.position.x += pt.x - pa.x;
    obj.position.y += pt.y - pa.y;
  }
  return caixaTela(obj, cam);
}

/** Ajusta uma coordenada local do objeto (filho de um apoio, como o carimbo na pilha) até o centro x da caixa
 *  projetada bater com alvoX. Newton com derivada numérica, preso a +-limite do valor inicial. */
export function ajustaCentroX(obj: THREE.Object3D, alvoX: number, cam: THREE.Camera, eixo: "x" | "z" = "x", limite = 0.05) {
  const v0 = obj.position[eixo];
  const mede = () => {
    const c = caixaTela(obj, cam);
    return (c[0] + c[2]) / 2;
  };
  let v = v0;
  for (let i = 0; i < 8; i++) {
    obj.position[eixo] = v;
    const f0 = mede() - alvoX;
    if (Math.abs(f0) < 0.4) break;
    const h = 0.002;
    obj.position[eixo] = v + h;
    const d = (mede() - alvoX - f0) / h;
    if (Math.abs(d) < 1e-3) break;
    v = THREE.MathUtils.clamp(v - f0 / d, v0 - limite, v0 + limite);
  }
  obj.position[eixo] = v;
  obj.updateWorldMatrix(true, true);
}

/** Garante que o objeto não fica por cima da tela do app: se a caixa projetada dele invade a caixa projetada da
 *  malha da tela, empurra o objeto pra esquerda no chão até sobrar a margem. */
export function afastaDaTela(obj: THREE.Object3D, tela: THREE.Object3D, cam: THREE.PerspectiveCamera, margem = 6) {
  const ct = caixaTela(tela, cam);
  for (let i = 0; i < 8; i++) {
    const c = caixaTela(obj, cam);
    const sobreV = c[3] > ct[1] && c[1] < ct[3];
    const excesso = c[2] - (ct[0] - margem);
    if (!sobreV || excesso <= 0.3) break;
    const pa = noPlanoY(c[2], c[3], 0, cam);
    const pt = noPlanoY(c[2] - excesso, c[3], 0, cam);
    obj.position.x += pt.x - pa.x;
    obj.position.z += pt.z - pa.z;
    obj.updateWorldMatrix(true, true);
  }
}

/** Separa dois objetos no chão: enquanto as caixas do mundo se cruzam, anda com `mover` no eixo dado. */
export function separa(mover: THREE.Object3D, fixo: THREE.Object3D, eixo: "x" | "z", passo: number, max = 30) {
  for (let i = 0; i < max; i++) {
    const a = caixaMundo(mover);
    const b = caixaMundo(fixo);
    if (!a.intersectsBox(b)) break;
    mover.position[eixo] += passo;
    mover.updateWorldMatrix(true, true);
  }
}

/** Separação precisa: anda com `mover` até nenhum vértice dele cair dentro da caixa do `fixo` no espaço local
 *  do fixo (serve pra pilha, pasta, despertador: objetos que são quase uma caixa no próprio eixo). Devolve
 *  quantos passos andou. Começando encostado por dentro, termina encostado por fora (contato de verdade). */
export function separaPreciso(mover: THREE.Object3D, fixo: THREE.Object3D, eixo: "x" | "z", passo: number, margem = 0.0006, max = 80) {
  fixo.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(fixo.matrixWorld).invert();
  const local = new THREE.Box3();
  const tmp = new THREE.Box3();
  const mat = new THREE.Matrix4();
  fixo.traverseVisible((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || m.userData.foraDaCaixa) return;
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    mat.multiplyMatrices(inv, m.matrixWorld);
    tmp.copy(m.geometry.boundingBox as THREE.Box3).applyMatrix4(mat);
    local.union(tmp);
  });
  const esc = new THREE.Vector3();
  fixo.getWorldScale(esc);
  local.expandByScalar(margem / Math.max(1e-6, esc.x));
  const dentro = () => {
    mover.updateWorldMatrix(true, true);
    let bateu = false;
    mover.traverseVisible((o) => {
      if (bateu) return;
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.userData.foraDaCaixa) return;
      const pos = m.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
      if (!pos) return;
      const p = Math.max(1, Math.floor(pos.count / 4000));
      for (let i = 0; i < pos.count; i += p) {
        _v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).applyMatrix4(inv);
        if (local.containsPoint(_v)) {
          bateu = true;
          return;
        }
      }
    });
    return bateu;
  };
  let n = 0;
  while (n < max && dentro()) {
    mover.position[eixo] += passo;
    n++;
  }
  mover.updateWorldMatrix(true, true);
  return n;
}

/** Escala o objeto (em volta da origem, na base) até o topo da caixa projetada chegar em topoPx. */
export function ajustaEscalaTopo(obj: THREE.Object3D, topoPx: number, cam: THREE.Camera, limites: [number, number], base = 0) {
  const s0 = obj.scale.x;
  for (let i = 0; i < 12; i++) {
    const c = caixaTela(obj, cam);
    const k = (c[3] - topoPx) / Math.max(1, c[3] - c[1]);
    const s = THREE.MathUtils.clamp(obj.scale.x * k, s0 * limites[0], s0 * limites[1]);
    if (Math.abs(s - obj.scale.x) < 1e-4) break;
    obj.scale.setScalar(s);
    assenta(obj, base);
  }
}
