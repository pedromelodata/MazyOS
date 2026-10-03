// Pose de render: camada ambiente (deriva da câmera e flutuação por tipo) e matriz do rig
// (contrato: KIT/DESENHO.md, seções 4.2 e 5; dono K02). As fórmulas são as do src/guia/Cena3D.tsx
// (linhas 128 a 133 e 206 a 241), escritas na mesma ordem de operações pra dar o mesmo número.
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import type { Object3D } from "three";
import type { CamSt, Flutuacao, Obj, ObjSt, ObjetoProps, PropsKit } from "./tipos";

/** flutuação padrão por tipo (tabela da seção 4.2) */
export const FLUTUACAO_POR_TIPO: Record<string, Flutuacao | null> = {
  aparelho: { amp: 0.0018, freq: 1.7, fase: 0, desligaSeRxMaior: 1 }, // y + sen(1,7t)·0,0018, só se rx <= 1
  relogio: { amp: 0.0015, freq: 2.1, fase: 1 }, // y + sen(2,1t + 1)·0,0015 (o buzz vem à parte)
  folha: { amp: 0.002, freq: 2.3, fase: 2, rzAmp: 0.02, rzFreq: 1.9, rzFase: 0 }, // y + sen(2,3t + 2)·0,002; rz + sen(1,9t)·0,02
  pilula: { amp: 0.0014, freq: 2.6, fase: 0.5 }, // a do chip no Cena3D.tsx
  comprovante: { amp: 0.002, freq: 2.3, fase: 2, rzAmp: 0.02, rzFreq: 1.9, rzFase: 0 }, // a mesma da folha
  glb: null, // nenhuma: a cena liga com `flutuacao`
};

/** deriva lenta de câmera na mão: x + sen(0,35t)·0,0028 e y + sen(0,27t + 1)·0,0018 (o alvo não deriva) */
export const DERIVA = {
  x: { amp: 0.0028, freq: 0.35, fase: 0 },
  y: { amp: 0.0018, freq: 0.27, fase: 1 },
};

/** vibração do relógio (rz + buzz·0,05·sen(140t)): não é camada ambiente, é movida pela timeline */
export const BUZZ = { amp: 0.05, freq: 140 };

type ComAmbiente = Pick<PropsKit, "ambiente" | "duracao">;

/** modo periódico (seção 5): f vira 2πk/duracao com k = max(1, round(f·duracao/2π)); senão f fica igual */
export function frequencia(f: number, periodico: boolean, duracao: number): number {
  if (!periodico) return f;
  const k = Math.max(1, Math.round((f * duracao) / (2 * Math.PI)));
  return (2 * Math.PI * k) / duracao;
}

export function flutuacaoDe(o: ObjetoProps): Flutuacao | null {
  if (o.flutuacao) return o.flutuacao;
  const f = FLUTUACAO_POR_TIPO[o.tipo];
  return f === undefined ? null : f;
}

/** câmera do quadro: estado + deriva na posição (o alvo não deriva) */
export function cameraRender(cam: CamSt, t: number, props: ComAmbiente): CamSt {
  const amb = props.ambiente;
  if (!amb.deriva) return { ...cam };
  const per = amb.periodico;
  const D = props.duracao;
  const drx = Math.sin(t * frequencia(DERIVA.x.freq, per, D) + DERIVA.x.fase) * DERIVA.x.amp;
  const dry = Math.sin(t * frequencia(DERIVA.y.freq, per, D) + DERIVA.y.fase) * DERIVA.y.amp;
  return { x: cam.x + drx, y: cam.y + dry, z: cam.z, tx: cam.tx, ty: cam.ty, tz: cam.tz, fov: cam.fov };
}

/** pose do quadro: estado + flutuação do tipo (+ buzz no relógio) */
export function poseRender(st: ObjSt, objeto: ObjetoProps, t: number, props: ComAmbiente): Obj {
  const amb = props.ambiente;
  const per = amb.periodico;
  const D = props.duracao;
  let y = st.y;
  let rz = st.rz;
  const fl = amb.flutuacao ? flutuacaoDe(objeto) : null;
  if (fl) {
    const liga = fl.desligaSeRxMaior === undefined || !(st.rx > fl.desligaSeRxMaior);
    if (liga) y = st.y + Math.sin(t * frequencia(fl.freq, per, D) + fl.fase) * fl.amp;
    if (fl.rzAmp) {
      const fz = fl.rzFreq === undefined ? fl.freq : fl.rzFreq;
      rz = st.rz + Math.sin(t * frequencia(fz, per, D) + (fl.rzFase || 0)) * fl.rzAmp;
    }
  }
  if (objeto.tipo === "relogio") rz = rz + st.buzz * BUZZ.amp * Math.sin(t * BUZZ.freq);
  return { x: st.x, y, z: st.z, rx: st.rx, ry: st.ry, rz, s: st.s, vis: st.vis };
}

export type Ambiente = {
  cam: { x: number; y: number };
  objetos: Record<string, { y: number; rz: number }>;
};

/** só a camada ambiente em t (deriva da câmera e flutuação de cada objeto), pro teste e o qc avaliarem em t = duracao */
export function ambienteEm(t: number, props: ComAmbiente & Pick<PropsKit, "objetos">): Ambiente {
  const amb = props.ambiente;
  const per = amb.periodico;
  const D = props.duracao;
  const cam = { x: 0, y: 0 };
  if (amb.deriva) {
    cam.x = Math.sin(t * frequencia(DERIVA.x.freq, per, D) + DERIVA.x.fase) * DERIVA.x.amp;
    cam.y = Math.sin(t * frequencia(DERIVA.y.freq, per, D) + DERIVA.y.fase) * DERIVA.y.amp;
  }
  const objetos: Record<string, { y: number; rz: number }> = {};
  for (const o of props.objetos) {
    const fl = amb.flutuacao ? flutuacaoDe(o) : null;
    let y = 0;
    let rz = 0;
    if (fl) {
      y = Math.sin(t * frequencia(fl.freq, per, D) + fl.fase) * fl.amp;
      if (fl.rzAmp) {
        const fz = fl.rzFreq === undefined ? fl.freq : fl.rzFreq;
        rz = Math.sin(t * frequencia(fz, per, D) + (fl.rzFase || 0)) * fl.rzAmp;
      }
    }
    objetos[o.id] = { y, rz };
  }
  return { cam, objetos };
}

export type Rig = { posicao: Vector3; rotacao: Euler; escala: number; matriz: Matrix4; visivel: boolean };

/** matriz do rig como o `aplica` do Cena3D.tsx: posição, rotação na ordem "YXZ", escala max(0,0001, s) */
export function matrizRig(pose: Obj, extraRy = 0): Rig {
  const posicao = new Vector3(pose.x, pose.y, pose.z);
  const rotacao = new Euler(pose.rx, pose.ry + extraRy, pose.rz, "YXZ");
  const escala = Math.max(0.0001, pose.s);
  const matriz = new Matrix4().compose(posicao, new Quaternion().setFromEuler(rotacao), new Vector3(escala, escala, escala));
  return { posicao, rotacao, escala, matriz, visivel: pose.vis > 0.001 && pose.s > 0.001 };
}

/** o mesmo `aplica` do Cena3D.tsx, num Object3D do three (pro render do K06) */
export function aplicaRig(g: Object3D, pose: Obj, extraRy = 0): void {
  g.position.set(pose.x, pose.y, pose.z);
  g.rotation.set(pose.rx, pose.ry + extraRy, pose.rz, "YXZ");
  g.scale.setScalar(Math.max(0.0001, pose.s));
  g.visible = pose.vis > 0.001 && pose.s > 0.001;
}
