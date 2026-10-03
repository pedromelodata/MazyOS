// Projeção e desprojeção com o math do three (contrato: KIT/DESENHO.md, seções 4.2 e 5; dono K02).
// Câmera igual à do render: PerspectiveCamera com fov da câmera, near 0,005, far 20, aspect largura/altura,
// posição (x, y, z) olhando pro alvo (tx, ty, tz) com o "up" (0, 1, 0). Sem WebGL e sem DOM.
import { Euler, MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import type { CamSt, Obj, ObjetoProps } from "./tipos";
import { matrizRig } from "./pose";

export type OpcoesProjecao = { largura?: number; altura?: number; near?: number; far?: number };

const PADRAO = { largura: 1080, altura: 1920, near: 0.005, far: 20 };

export type Camera3 = { mundo: Matrix4; vista: Matrix4; projecao: Matrix4; projecaoInversa: Matrix4; posicao: Vector3 };

/** as matrizes que a PerspectiveCamera do three monta pra esta câmera (lookAt pelo mesmo caminho do Object3D) */
export function matrizesCamera(cam: CamSt, op: OpcoesProjecao = {}): Camera3 {
  const largura = op.largura || PADRAO.largura;
  const altura = op.altura || PADRAO.altura;
  const near = op.near || PADRAO.near;
  const far = op.far || PADRAO.far;
  const posicao = new Vector3(cam.x, cam.y, cam.z);
  const alvo = new Vector3(cam.tx, cam.ty, cam.tz);
  const rot = new Matrix4().lookAt(posicao, alvo, new Vector3(0, 1, 0)); // câmera: olho na posição
  const q = new Quaternion().setFromRotationMatrix(rot);
  const mundo = new Matrix4().compose(posicao, q, new Vector3(1, 1, 1));
  const vista = mundo.clone().invert();
  const aspect = largura / altura;
  const top = near * Math.tan(MathUtils.DEG2RAD * 0.5 * cam.fov);
  const h = 2 * top;
  const w = aspect * h;
  const left = -0.5 * w;
  const projecao = new Matrix4().makePerspective(left, left + w, top, top - h, near, far);
  return { mundo, vista, projecao, projecaoInversa: projecao.clone().invert(), posicao };
}

export type PontoTela = { px: number; py: number; ndcZ: number; atras: boolean };

/** ponto do mundo em px do quadro (1080x1920 por padrão) */
export function projetaPonto(p: Vector3 | [number, number, number], cam: CamSt | Camera3, op: OpcoesProjecao = {}): PontoTela {
  const c = "vista" in cam ? cam : matrizesCamera(cam, op);
  const largura = op.largura || PADRAO.largura;
  const altura = op.altura || PADRAO.altura;
  const v = Array.isArray(p) ? new Vector3(p[0], p[1], p[2]) : p.clone();
  v.applyMatrix4(c.vista);
  const atras = v.z >= 0; // na frente da câmera o z da vista é negativo
  v.applyMatrix4(c.projecao);
  return { px: ((v.x + 1) / 2) * largura, py: ((1 - v.y) / 2) * altura, ndcZ: v.z, atras };
}

/** os 8 cantos de uma caixa {min, max} */
export function cantosCaixa(caixa: { min: [number, number, number]; max: [number, number, number] }): Vector3[] {
  const [a, b] = [caixa.min, caixa.max];
  const out: Vector3[] = [];
  for (const x of [a[0], b[0]]) for (const y of [a[1], b[1]]) for (const z of [a[2], b[2]]) out.push(new Vector3(x, y, z));
  return out;
}

/** caixa do catálogo (espaço do modelo, já com a escala) levada pro espaço do rig pela rotacaoBase
 *  (Euler na ordem padrão do three, "XYZ", como o phone.rotation.y = π do Cena3D.tsx) */
export function caixaNoRig(
  caixa: { min: [number, number, number]; max: [number, number, number] },
  rotacaoBase?: [number, number, number],
): { min: [number, number, number]; max: [number, number, number] } {
  if (!rotacaoBase || (rotacaoBase[0] === 0 && rotacaoBase[1] === 0 && rotacaoBase[2] === 0)) {
    return { min: [caixa.min[0], caixa.min[1], caixa.min[2]], max: [caixa.max[0], caixa.max[1], caixa.max[2]] };
  }
  const m = new Matrix4().makeRotationFromEuler(new Euler(rotacaoBase[0], rotacaoBase[1], rotacaoBase[2], "XYZ"));
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const c of cantosCaixa(caixa)) {
    c.applyMatrix4(m);
    const arr = [c.x, c.y, c.z];
    for (let i = 0; i < 3; i++) {
      // limpa o -0 e o ruído do sen(π) (caixa em metros: 1e-9 m de resolução basta)
      const r = Math.round(arr[i] * 1e9) / 1e9;
      const v = r === 0 ? 0 : r;
      if (v < min[i]) min[i] = v;
      if (v > max[i]) max[i] = v;
    }
  }
  return { min, max };
}

export type CaixaProjetada = { pontos: Array<[number, number]>; atras: boolean; visivel: boolean };

/** projeta os 8 cantos da caixa do objeto (já no espaço do rig) pra px do quadro.
 *  `pose` deve vir com a flutuação (poseRender) e `cam` com a deriva (cameraRender), como no render. */
export function projetaCaixa(objeto: ObjetoProps, pose: Obj, cam: CamSt, op: OpcoesProjecao = {}): CaixaProjetada | null {
  if (!objeto.caixa) return null;
  const rig = matrizRig(pose);
  const c = matrizesCamera(cam, op);
  let atras = false;
  const pontos: Array<[number, number]> = [];
  for (const canto of cantosCaixa(objeto.caixa)) {
    canto.applyMatrix4(rig.matriz);
    const p = projetaPonto(canto, c, op);
    if (p.atras) atras = true;
    pontos.push([p.px, p.py]);
  }
  return { pontos, atras, visivel: rig.visivel };
}

/** ponto da tela (px, py) levado ao plano z = zPlano do mundo, pela câmera dada (sem deriva, se for o estado) */
export function desprojeta(px: number, py: number, cam: CamSt, zPlano = 0, op: OpcoesProjecao = {}): { x: number; y: number; z: number } {
  const largura = op.largura || PADRAO.largura;
  const altura = op.altura || PADRAO.altura;
  const c = matrizesCamera(cam, op);
  const nx = (px / largura) * 2 - 1;
  const ny = 1 - (py / altura) * 2;
  const perto = new Vector3(nx, ny, -1).applyMatrix4(c.projecaoInversa).applyMatrix4(c.mundo);
  const longe = new Vector3(nx, ny, 1).applyMatrix4(c.projecaoInversa).applyMatrix4(c.mundo);
  const dir = longe.sub(perto);
  if (Math.abs(dir.z) < 1e-12) throw new Error("desprojeta: o raio é paralelo ao plano");
  const k = (zPlano - perto.z) / dir.z;
  return { x: perto.x + dir.x * k, y: perto.y + dir.y * k, z: zPlano };
}
