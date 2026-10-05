// Peças frias do palco de argila (render): os objetos do carrossel de 05/10, só importados por objetos/argila.ts
// (pilha, carimbo, pasta, despertador, envelope em pé, envelope aberto, lupa, caneta e prancheta), presos ao chão
// da vitrine fria. Cada uma lê o canal "p:<id>" (deslocamentos sobre a pose de repouso, escala, visibilidade e os
// canais do tipo). A vitrine corta a argila por planos de recorte presos à borda dos painéis (fabrica.ts os acerta
// a cada quadro pela câmera): o que sai pela esquerda some exatamente na borda desenhada. As trocas da vitrine fria
// não atravessam o chão: a peça encolhe e cresce no próprio pé (canal enc, pivô em opcoes.pivo). Sem vitrine, os
// planos das paredes ficam longe e só o chão corta.
import * as THREE from "three";
import {
  calendarioMesa, carimbo, caneta, envelopeAberto, envelopeEmPe, despertador, giroSegundos, lupa, pastaComDobradica, pilha, ponteiroSegundos,
  ponteirosCorrendo, prancheta, tremorDaPilha,
} from "../objetos/argila";
import { MESA, num, type Canal, type PecaDef } from "./modelo";

/** o formulário de cima da pilha que voa pra pasta (fabrica.ts calcula a pose a cada quadro) */
export type VooFolha = {
  /** o grupo que leva a folha (matrixAutoUpdate desligado: a matriz é a pose no mundo do quadro) */
  holder: THREE.Group;
  /** a folha (o mesmo plano pintado da pilha, com o material recortado pela vitrine) */
  doc: THREE.Mesh;
  /** a folha sobre o maço de cima, no espaço do maço */
  docLocal: THREE.Matrix4;
  /** o maço de cima da pilha */
  maco: THREE.Object3D;
  /** a marca do carimbo (filha da folha) */
  marca: THREE.Mesh | null;
  /** id da pasta de destino */
  pasta: string;
};

export type PecaFria = {
  id: string;
  def: PecaDef;
  raiz: THREE.Group;
  /** o modelo do carrossel (filho da raiz) */
  modelo: THREE.Object3D;
  /** todos os materiais da peça (cópias só dela, com os planos de recorte) */
  materiais: THREE.Material[];
  /** pilha com opcoes.voaPara */
  voo?: VooFolha;
  /** pasta: pose (no espaço do modelo) da folha que entra nela, com as folhas descendo k (0 a 1) */
  vagaFolha?(k: number, saida: THREE.Matrix4): THREE.Matrix4;
  aplica(c: Canal, t: number): void;
};

/** planos de recorte da vitrine fria: chão, parede da esquerda e o vão (este se abre na fusão) */
export type PlanosFrio = { chao: THREE.Plane; esq: THREE.Plane; dir: THREE.Plane; lista: THREE.Plane[] };

export function criaPlanos(borda: number, vao: number): PlanosFrio {
  const chao = new THREE.Plane(new THREE.Vector3(0, 1, 0), -MESA + 0.0002);
  const esq = new THREE.Plane(new THREE.Vector3(1, 0, 0), borda);
  const dir = new THREE.Plane(new THREE.Vector3(-1, 0, 0), -vao);
  return { chao, esq, dir, lista: [chao, esq, dir] };
}

/** troca os materiais da peça por cópias só dela, com os planos de recorte (os materiais memorizados do carrossel
 *  ficam intactos; cópia por peça porque a opacidade do fecho é por peça) */
function recorta(o: THREE.Object3D, planos: PlanosFrio, lista: THREE.Material[]): void {
  const copias = new Map<string, THREE.Material>();
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (!m.isMesh) return;
    const troca = (mat: THREE.Material) => {
      let c = copias.get(mat.uuid);
      if (!c) {
        c = mat.clone();
        c.clippingPlanes = planos.lista;
        c.clipShadows = true;
        c.userData.argilaOpacidade = c.opacity;
        c.userData.argilaTransparente = c.transparent;
        copias.set(mat.uuid, c);
        lista.push(c);
      }
      return c;
    };
    m.material = Array.isArray(m.material) ? m.material.map(troca) : troca(m.material);
  });
}

/** opacidade da peça inteira (o fecho some com o painel): transparente só enquanto alfa < 1 */
function aplicaAlfa(lista: THREE.Material[], alfa: number, estado: { a: number }): void {
  const a = Math.max(0, Math.min(1, alfa));
  if (Math.abs(a - estado.a) < 1e-4) return;
  estado.a = a;
  for (const m of lista) {
    const opaca = a >= 0.999;
    const tr = opaca ? !!m.userData.argilaTransparente : true;
    if (m.transparent !== tr) {
      m.transparent = tr;
      m.needsUpdate = true;
    }
    m.opacity = (typeof m.userData.argilaOpacidade === "number" ? m.userData.argilaOpacidade : 1) * a;
  }
}

/** marca do carimbo: moldura arredondada dupla e três barras, em tinta fria (frio-700), com falhas de tinta de
 *  borracha. Nunca coral. Textura com alfa (a folha aparece por baixo). */
function texMarca(): THREE.CanvasTexture {
  const W = 296;
  const H = 200;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  g.clearRect(0, 0, W, H);
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };
  g.strokeStyle = "rgba(93,99,107,0.92)";
  g.lineWidth = 11;
  rr(14, 14, W - 28, H - 28, 22);
  g.stroke();
  g.lineWidth = 4;
  rr(32, 32, W - 64, H - 64, 12);
  g.stroke();
  g.fillStyle = "rgba(93,99,107,0.9)";
  const barra = (x: number, y: number, w: number, h: number) => {
    rr(x, y, w, h, h / 2);
    g.fill();
  };
  barra(58, 62, 180, 20);
  barra(58, 96, 130, 14);
  barra(58, 124, 156, 14);
  // falhas de tinta (borracha): pontinhos que tiram o alfa, sempre os mesmos
  g.globalCompositeOperation = "destination-out";
  let s = 97;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 420; i++) {
    g.fillStyle = `rgba(0,0,0,${0.25 + 0.5 * rnd()})`;
    g.beginPath();
    g.arc(rnd() * W, rnd() * H, 0.6 + 2.2 * rnd(), 0, Math.PI * 2);
    g.fill();
  }
  g.globalCompositeOperation = "source-over";
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _piv = new THREE.Vector3();
const _e = new THREE.Euler();

export function criaPeca(id: string, def: PecaDef, planos: PlanosFrio, pais: Record<string, PecaFria>): PecaFria {
  const op = (def.opcoes || {}) as Record<string, unknown>;
  const raiz = new THREE.Group();
  raiz.name = `argila-${id}`;
  // corpo da prova de colisão (cada peça é um corpo; a presa a outra, como o carimbo, é um corpo à parte)
  raiz.userData.corpo = id;
  let modelo: THREE.Object3D;
  let extra: (c: Canal, t: number) => void = () => undefined;
  let prepVoo: (() => VooFolha | undefined) | null = null;
  let vagaFolha: PecaFria["vagaFolha"];
  switch (def.tipo) {
    case "pilha": {
      const macos = Array.isArray(op.macos) ? (op.macos as number[]) : [0.013, 0.012, 0.014, 0.012];
      modelo = pilha(macos, { doc: true, semente: num(op.semente, 7) });
      const treme = tremorDaPilha(modelo);
      extra = (c, t) => treme(num(c.tremor, 0), t);
      if (typeof op.voaPara === "string") {
        const destino = op.voaPara;
        const topoPilha = num((modelo.userData || {}).topo, 0);
        const comMarca = op.marca === true;
        // depois do recorte (o material da folha já sai com os planos da vitrine): a folha sai do maço de cima
        prepVoo = () => {
          const maco = modelo.children[modelo.children.length - 1];
          const doc = maco.children[0] as THREE.Mesh | undefined;
          if (!doc || !(doc as THREE.Mesh).isMesh) return undefined;
          doc.updateMatrix();
          const docLocal = doc.matrix.clone();
          maco.remove(doc);
          doc.position.set(0, 0, 0);
          doc.rotation.set(0, 0, 0);
          doc.scale.set(1, 1, 1);
          const holder = new THREE.Group();
          holder.name = `argila-${id}-folha`;
          holder.userData.corpo = `${id}:folha`;
          holder.matrixAutoUpdate = false;
          holder.add(doc);
          let marca: THREE.Mesh | null = null;
          if (comMarca) {
            // pegada da borracha do carimbo (o carimbo fica em x 0,006, z 0,004 do topo da pilha, girado 0,13)
            const cx = num(op.marcaX, 0.006);
            const cz = num(op.marcaZ, 0.004);
            const cry = num(op.marcaRy, 0.13);
            const pegada = new THREE.Matrix4().compose(
              new THREE.Vector3(cx, topoPilha, cz),
              new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, cry, 0, "YXZ")),
              new THREE.Vector3(1, 1, 1),
            );
            maco.updateMatrix();
            const docNoModelo = new THREE.Matrix4().multiplyMatrices(maco.matrix, docLocal);
            const local = new THREE.Matrix4().copy(docNoModelo).invert().multiply(pegada);
            const mat = new THREE.MeshStandardMaterial({
              map: texMarca(), transparent: true, depthWrite: false, roughness: 0.95, metalness: 0, envMapIntensity: 0.35,
              polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, opacity: 0,
            });
            mat.clippingPlanes = planos.lista;
            marca = new THREE.Mesh(new THREE.PlaneGeometry(0.036, 0.0243), mat);
            marca.matrixAutoUpdate = false;
            marca.matrix.copy(local);
            // um tico acima do papel (no eixo z da folha, que é a normal dela)
            marca.matrix.multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.00012));
            marca.renderOrder = 3;
            marca.visible = false;
            marca.castShadow = false;
            marca.receiveShadow = false;
            doc.add(marca);
          }
          return { holder, doc, docLocal, maco, marca, pasta: destino };
        };
      }
      break;
    }
    case "carimbo": {
      modelo = carimbo();
      break;
    }
    case "pasta": {
      // a frente gira no pé (dobradiça embaixo): abre = 1 inclina 0,24 rad pra frente, 0 fecha (sem trocar modelo)
      const pd = pastaComDobradica(num(op.folhas, 3), op.docFrente === true, num(op.abreRad, 0.24));
      modelo = pd.modelo;
      extra = (c) => pd.aplica(num(c.abre, 0), num(c.folhas, 0));
      // a folha que entra fica entre as folhas da pasta e a frente, de pé, com o topo um tico acima das outras
      vagaFolha = (k, saida) => pd.vagaFolha(k, saida);
      break;
    }
    case "despertador": {
      const tam = num(op.tamanho, 0.062);
      modelo = despertador(tam);
      // o canal corre (05/10) gira as horas e os minutos; com 0 (o padrão) o despertador fica como antes
      const corre = ponteirosCorrendo(modelo);
      const seg = op.segundos === true ? ponteiroSegundos(modelo) : null;
      extra = (c, t) => {
        const k = num(c.corre, 0);
        if (k !== 0) corre(k);
        if (seg) seg.rotation.z = giroSegundos(t) - 2 * Math.PI * 6 * k;
      };
      break;
    }
    case "calendario": {
      // calendário de mesa (05/10): opcoes.dia (o primeiro dia) e opcoes.folhas; o canal vira passa as folhas
      const cal = calendarioMesa(num(op.dia, 8), Math.max(1, Math.round(num(op.folhas, 6))));
      modelo = cal.modelo;
      extra = (c) => cal.aplica(num(c.vira, 0));
      break;
    }
    case "envelope": {
      modelo = envelopeEmPe();
      break;
    }
    case "envelope-aberto": {
      modelo = envelopeAberto();
      break;
    }
    case "lupa": {
      modelo = lupa();
      break;
    }
    case "caneta": {
      modelo = caneta();
      break;
    }
    case "prancheta": {
      modelo = prancheta();
      break;
    }
    default:
      throw new Error(`peça fria de tipo desconhecido: ${def.tipo} (${id})`);
  }
  const materiais: THREE.Material[] = [];
  recorta(modelo, planos, materiais);
  raiz.add(modelo);
  const voo = prepVoo ? prepVoo() : undefined;

  const pai = def.pai ? pais[def.pai] : null;
  if (def.pai && !pai) throw new Error(`a peça ${id} pede o pai ${def.pai}, que ainda não foi criado`);
  const topoPai = pai ? num(((pai.raiz.children[0] as THREE.Object3D).userData || {}).topo, 0) : 0;
  if (pai) (pai.raiz.children[0] as THREE.Object3D).add(raiz);
  // pivô da troca (no espaço do modelo): o pé da peça; a lupa encolhe pela ponta do cabo
  const pv = Array.isArray(op.pivo) ? (op.pivo as number[]) : [0, 0, 0];
  const pivo = new THREE.Vector3(num(pv[0], 0), num(pv[1], 0), num(pv[2], 0));
  const estAlfa = { a: 1 };

  return {
    id,
    def,
    raiz,
    modelo,
    materiais,
    voo,
    vagaFolha,
    aplica(c, t) {
      // escala nunca zero (matriz sem inversa); abaixo de 0,0015 a peça fica invisível
      const enc = Math.max(1e-4, num(c.enc, 1));
      const s = def.s * num(c.s, 1);
      const vis = num(c.vis, 1);
      if (pai) {
        const sobe = num(c.sobe, 0);
        const ach = num(c.achata, 0);
        raiz.position.set(def.x + num(c.x, 0), topoPai + def.y + num(c.y, 0) + sobe, def.z + num(c.z, 0));
        raiz.rotation.set(def.rx + num(c.rx, 0), def.ry + num(c.ry, 0), def.rz + num(c.rz, 0), "YXZ");
        raiz.scale.set(s * enc * (1 + ach * 0.5), s * enc * (1 - ach), s * enc * (1 + ach * 0.5));
      } else {
        raiz.position.set(def.x + num(c.x, 0), MESA + def.y + num(c.y, 0), def.z + num(c.z, 0));
        _e.set(def.rx + num(c.rx, 0), def.ry + num(c.ry, 0), def.rz + num(c.rz, 0), "YXZ");
        raiz.rotation.copy(_e);
        raiz.scale.set(s * enc, s * enc * num(c.sy, 1), s * enc);
        if (enc < 0.9999 && (pivo.x !== 0 || pivo.y !== 0 || pivo.z !== 0)) {
          // o pivô fica parado: posição + R·(s·(1 - enc)·pivô)
          _q.setFromEuler(_e);
          _piv.copy(pivo).multiplyScalar(s * (1 - enc)).applyQuaternion(_q);
          raiz.position.add(_piv);
        }
      }
      raiz.visible = vis > 0.001 && s * enc > 0.0015;
      aplicaAlfa(materiais, num(c.alfa, 1), estAlfa);
      extra(c, t);
    },
  };
}

/** pose no mundo da folha que voa da pilha pra pasta (k de 0 a 1), com um arco por cima da pasta; devolve se a
 *  folha aparece */
export function poseFolhaVoo(
  v: VooFolha, pilhaPf: PecaFria, pastaPf: PecaFria | undefined, cPilha: Canal, cPasta: Canal | undefined,
): boolean {
  const k = Math.max(0, Math.min(1, num(cPilha.voa, 0)));
  const marca = Math.max(0, Math.min(1, num(cPilha.marca, 0)));
  if (v.marca) {
    (v.marca.material as THREE.MeshStandardMaterial).opacity = marca * 0.92;
    v.marca.visible = marca > 0.001;
  }
  pilhaPf.raiz.updateMatrixWorld(true);
  const m0 = new THREE.Matrix4().multiplyMatrices(v.maco.matrixWorld, v.docLocal);
  const visPilha = pilhaPf.raiz.visible;
  if (k <= 0.0001 || !pastaPf || !pastaPf.vagaFolha) {
    v.holder.matrix.copy(m0);
    v.holder.matrixWorldNeedsUpdate = true;
    v.holder.visible = visPilha;
    aplicaAlfaFolha(v, num(cPilha.alfa, 1));
    return v.holder.visible;
  }
  pastaPf.raiz.updateMatrixWorld(true);
  const vaga = pastaPf.vagaFolha(num(cPasta ? cPasta.folhas : 0, 0), new THREE.Matrix4());
  const m1 = new THREE.Matrix4().multiplyMatrices(pastaPf.modelo.matrixWorld, vaga);
  const p0 = new THREE.Vector3();
  const q0 = new THREE.Quaternion();
  const s0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  const q1 = new THREE.Quaternion();
  const s1 = new THREE.Vector3();
  m0.decompose(p0, q0, s0);
  m1.decompose(p1, q1, s1);
  // Bézier quadrática: o controle fica acima da boca da pasta, então a folha desce de pé pra dentro dela
  const ctrl = new THREE.Vector3(p1.x * 0.7 + p0.x * 0.3, Math.max(p0.y, p1.y) + 0.07 * s1.y, p1.z);
  const a = (1 - k) * (1 - k);
  const b = 2 * (1 - k) * k;
  const d = k * k;
  _v.set(a * p0.x + b * ctrl.x + d * p1.x, a * p0.y + b * ctrl.y + d * p1.y, a * p0.z + b * ctrl.z + d * p1.z);
  // fica de pé antes de descer na pasta
  _q.copy(q0).slerp(q1, Math.min(1, k * 1.45));
  const sv = s0.clone().lerp(s1, k);
  _m.compose(_v, _q, sv);
  v.holder.matrix.copy(_m);
  v.holder.matrixWorldNeedsUpdate = true;
  v.holder.visible = k < 0.5 ? visPilha || pastaPf.raiz.visible : pastaPf.raiz.visible;
  aplicaAlfaFolha(v, Math.min(num(cPilha.alfa, 1), num(cPasta ? cPasta.alfa : 1, 1)));
  return v.holder.visible;
}

function aplicaAlfaFolha(v: VooFolha, alfa: number) {
  const m = v.doc.material as THREE.Material;
  const a = Math.max(0, Math.min(1, alfa));
  if (m.userData.argilaOpacidade === undefined) {
    m.userData.argilaOpacidade = m.opacity;
    m.userData.argilaTransparente = m.transparent;
  }
  const tr = a < 0.999 ? true : !!m.userData.argilaTransparente;
  if (m.transparent !== tr) {
    m.transparent = tr;
    m.needsUpdate = true;
  }
  m.opacity = m.userData.argilaOpacidade * a;
}
