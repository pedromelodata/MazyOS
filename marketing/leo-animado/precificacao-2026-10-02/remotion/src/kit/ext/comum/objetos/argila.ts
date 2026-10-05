// Extensão "comum" do kit de motion: os objetos de argila do carrossel de 05/10/2026 no kit (render).
// Os objetos, os materiais e as texturas são os de src/carrossel-2026-10-05, só importados (o carrossel não muda):
// pilha de papel em maços, carimbo, pasta, despertador, envelope em pé, envelope aberto, lupa, caneta, prancheta,
// moeda com o sinal de pessoa e sino coral. Eles entram de dois jeitos:
// - como peça do palco de argila (palco/pecas.ts e palco/cartoes.ts usam os construtores daqui);
// - como objeto solto da cena, do tipo "argila" (fabricaArgila, itens proc-argila-<forma> do catálogo de modelos, com
//   a forma em render.formaArgila; a cena troca por conteudo.forma):
//   pose, sombra de contato e flutuação do kit, mais os canais próprios em st.canais[id] (tremor da pilha, sobe e
//   achata do carimbo, abre e folhas da pasta). Sem o palco, a luz é a do kit (a argila sai mais clara que no
//   carrossel); com um palco de argila na cena (pode ser sem vitrine e sem peça), a luz é a do carrossel.
// Medidas em metros, origem no meio da base (y = 0 no apoio), menos a lupa, a moeda e o sino (origem no centro).
import * as THREE from "three";
import { carimbo, caneta, envelopeAberto, envelopeEmPe, pasta, pilha, prancheta } from "../../../../carrossel-2026-10-05/objetos/papelaria";
import { despertador } from "../../../../carrossel-2026-10-05/objetos/despertador";
import { lupa, moedaPessoa, sino } from "../../../../carrossel-2026-10-05/objetos/legalizai";
import { argila, corpoPlaca } from "../../../../carrossel-2026-10-05/cena/materiais";
import { texSombraBlob, texSombraRet } from "../../../../carrossel-2026-10-05/cena/texturas";
import { caixa, malha, placa } from "../../../../carrossel-2026-10-05/objetos/base";
import { SombraContato } from "../../../../carrossel-2026-10-05/cena/sombra";
import { esperaSora } from "../../../../carrossel-2026-10-05/fonte";
import { LUZ_PADRAO } from "../../../../carrossel-2026-10-05/luz";
import { aplicaBase } from "../../../render/objetos/aparelho";
import type { Estado } from "../../../nucleo/tipos";
import type { FabricaObjeto } from "../../../render/tipos-render";
import { CANAIS_ARGILA, formaDoObjeto } from "../palco/modelo";

// os construtores, materiais e texturas do carrossel que o palco usa (um lugar só pra entrar no kit)
export {
  argila, caixa, carimbo, caneta, corpoPlaca, despertador, envelopeAberto, envelopeEmPe, esperaSora, LUZ_PADRAO, lupa, malha,
  moedaPessoa, pasta, pilha, placa, prancheta, sino, SombraContato, texSombraBlob, texSombraRet,
};

const num = (x: unknown, p: number) => (typeof x === "number" && isFinite(x) ? x : p);
const k01 = (x: number) => Math.max(0, Math.min(1, x));

// ---------- despertador: o ponteiro dos segundos ----------
const YC_DESPERTADOR = 0.0463;
const FACE_DESPERTADOR = 0.014 / 2 + 0.004;

/** ponteiro dos segundos do despertador (tinta fria, mais fino que os outros): anda em tiques de 1 s */
export function ponteiroSegundos(g: THREE.Object3D): THREE.Group {
  const p = new THREE.Group();
  p.position.set(0, YC_DESPERTADOR, FACE_DESPERTADOR + 0.0027);
  p.add(malha(caixa(0.0009, 0.027, 0.0005, 0.00035, 2), argila("#5D636B", {}, "segundos"), 0, 0.0085, 0));
  p.add(malha(new THREE.CylinderGeometry(0.0014, 0.0014, 0.0006, 16).rotateX(Math.PI / 2), argila("#5D636B", {}, "segundos"), 0, 0, 0.0002));
  g.add(p);
  return p;
}

const easeTique = (u: number) => (u >= 0.14 ? 1 : 1 - Math.pow(1 - u / 0.14, 3));

/** giro do ponteiro dos segundos no instante t (tique de 1 s, começando no 12 + 12 s) */
export function giroSegundos(t: number): number {
  const s = Math.max(0, t);
  const tique = Math.floor(s) + easeTique(s - Math.floor(s));
  return -(2 * Math.PI * (tique + 12)) / 60;
}

// ---------- pasta com a frente na dobradiça ----------
export type PastaMontada = {
  modelo: THREE.Object3D;
  /** abre (1 inclina a frente abreRad pra frente, 0 fecha) e folhas (0 pra fora, 1 dentro), de 0 a 1 */
  aplica(abre: number, folhas: number): void;
  /** pose (no espaço do modelo) da folha que entra na pasta, com as folhas descendo k (0 a 1) */
  vagaFolha(k: number, saida: THREE.Matrix4): THREE.Matrix4;
};

/** a pasta do carrossel com a frente presa numa dobradiça embaixo (o mesmo modelo, sem troca) */
export function pastaComDobradica(folhas: number, docFrente: boolean, abreRad: number): PastaMontada {
  const modelo = pasta(folhas, docFrente);
  // filhos do pasta() do carrossel: costas, aba, frente, fundo, folhas (3) e o cabeçalho (docFrente)
  const frente = modelo.children[2];
  const lista = modelo.children.slice(4) as THREE.Object3D[];
  const HF = 0.096;
  // a frente gira no pé (dobradiça embaixo): abre = 1 inclina abreRad pra frente, 0 fecha (sem trocar modelo)
  const dobra = new THREE.Group();
  dobra.name = "dobra-frente";
  dobra.position.set(0, 0.002, frente.position.z);
  modelo.remove(frente);
  frente.position.set(0, HF / 2 - 0.002, 0);
  dobra.add(frente);
  modelo.add(dobra);
  const yFolhas = lista.map((f) => f.position.y);
  return {
    modelo,
    aplica(abre, kFolhas) {
      dobra.rotation.x = abreRad * k01(abre);
      const k = k01(kFolhas);
      lista.forEach((f, i) => {
        const ki = k01((k - (i % 3) * 0.14) / 0.72);
        f.position.y = yFolhas[i] - 0.034 * ki;
      });
    },
    vagaFolha(k, saida) {
      // a folha que entra fica entre as folhas da pasta e a frente, de pé, com o topo um tico acima das outras
      const ki = k01(k / 0.72);
      return saida.makeTranslation(0.0004, 0.1125 - 0.1015 / 2 - 0.034 * ki, 0.0009);
    },
  };
}

// ---------- despertador: as horas correndo (acréscimo de 05/10, v3 da peça de 05/10) ----------
/** os ponteiros das horas e dos minutos do despertador do carrossel (os dois grupos com giro em z dentro do corpo,
 *  nessa ordem). Devolve o "corre": voltas do ponteiro dos minutos (o das horas anda 1/12 disso), o tempo passando
 *  depressa. Com 0, os ponteiros ficam nos 10h10 do carrossel. */
export function ponteirosCorrendo(g: THREE.Object3D): (corre: number) => void {
  const corpo = g.children[0] as THREE.Object3D;
  const ponteiros = corpo.children.filter((x) => (x as THREE.Group).isGroup) as THREE.Group[];
  const base = ponteiros.map((p) => p.rotation.z);
  return (corre) => {
    if (ponteiros.length < 2) return;
    ponteiros[1].rotation.z = base[1] - 2 * Math.PI * corre;
    ponteiros[0].rotation.z = base[0] - (2 * Math.PI * corre) / 12;
  };
}

// ---------- calendário de mesa (acréscimo de 05/10, v3): a espera, com os dias virando ----------
/** medidas do calendário de mesa em barraca: duas placas que se encontram no alto (inclinadas), as folhas presas
 *  na espiral do alto e penduradas na placa da frente. Origem no chão, no meio da base da placa da frente. */
export const CALENDARIO = { W: 0.07, H: 0.085, esp: 0.0045, inclina: 0.28, folhaW: 0.064, folhaH: 0.07, espFolha: 0.0007 };

/** folha do calendário: faixa fria no alto com os furos da espiral, o dia grande em tinta fria e um traço embaixo */
function texFolhaCalendario(dia: number): THREE.CanvasTexture {
  const W = 512;
  const H = Math.round((W * CALENDARIO.folhaH) / CALENDARIO.folhaW);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  g.fillStyle = "#F3F5F7";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#AEB4BB";
  g.fillRect(0, 0, W, 104);
  g.fillStyle = "#8D939B";
  for (const x of [150, W - 150]) {
    g.beginPath();
    g.arc(x, 46, 15, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#5D636B";
  g.font = "800 300px Sora";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(String(dia), W / 2, 104 + (H - 104) / 2 + 8);
  g.fillStyle = "#D5D9DE";
  g.fillRect(84, H - 62, W - 168, 10);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

const easeFolha = (p: number) => (p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p));

export type CalendarioMontado = { modelo: THREE.Object3D; aplica(vira: number): void };

/** calendário de mesa de argila fria, com 'folhas' folhas a partir do dia 'diaInicial'. O canal vira (0 a folhas)
 *  passa as folhas uma a uma por cima da espiral, até a placa de trás: a parte inteira são as folhas já viradas e a
 *  fração é o giro da folha da vez (com a curva de papel). Nenhuma folha atravessa as placas: o giro é em volta da
 *  espiral, por fora. */
export function calendarioMesa(diaInicial: number, folhas: number): CalendarioMontado {
  const { W, H, esp, inclina: a, folhaW, folhaH, espFolha } = CALENDARIO;
  const g = new THREE.Group();
  g.name = "calendario";
  const frente = new THREE.Group();
  frente.rotation.x = -a;
  frente.add(malha(caixa(W, H, esp, 0.0016, 3), argila("#8D939B"), 0, H / 2, 0));
  g.add(frente);
  const zTras = -2 * H * Math.sin(a);
  const tras = new THREE.Group();
  tras.position.z = zTras;
  tras.rotation.x = a;
  tras.add(malha(caixa(W, H, esp, 0.0016, 3), argila("#8D939B"), 0, H / 2, 0));
  g.add(tras);
  // a espiral no alto (onde as placas se encontram): dois anéis em volta do eixo x
  const topo = new THREE.Vector3(0, H * Math.cos(a), -H * Math.sin(a));
  for (const x of [-0.018, 0.018]) {
    const anel = new THREE.TorusGeometry(0.0058, 0.0009, 10, 32);
    anel.rotateY(Math.PI / 2);
    g.add(malha(anel, argila("#5D636B"), x, topo.y, topo.z));
  }
  // as folhas: penduradas na placa da frente (a 0 é a de fora), cada uma num pivô na espiral. Dentro do pivô, a
  // folha anda em z: na frente fica pra fora da placa da frente (+z) e, depois de passar por cima, pra fora da placa
  // de trás (-z, com a face impressa virada pra placa), como a folha que escorrega em volta do anel. A primeira que
  // vira fica colada na placa de trás e as seguintes por cima dela.
  type Folha = { pivo: THREE.Group; desliza: THREE.Group; zFrente: number; zTras: number };
  const lista: Folha[] = [];
  for (let i = 0; i < folhas; i++) {
    const pivo = new THREE.Group();
    pivo.position.copy(topo);
    const desliza = new THREE.Group();
    desliza.add(malha(caixa(folhaW, folhaH, espFolha * 0.8, 0.0006, 2), argila("#F3F5F7"), 0, -folhaH / 2 - 0.002, 0));
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(folhaW * 0.985, folhaH * 0.985),
      new THREE.MeshStandardMaterial({ map: texFolhaCalendario(diaInicial + i), roughness: 0.9, metalness: 0, envMapIntensity: 0.3 }),
    );
    face.position.set(0, -folhaH / 2 - 0.002, espFolha * 0.4 + 0.00005);
    face.castShadow = false;
    face.receiveShadow = true;
    desliza.add(face);
    pivo.add(desliza);
    g.add(pivo);
    lista.push({ pivo, desliza, zFrente: esp / 2 + (folhas - i) * espFolha + 0.0005, zTras: -(esp / 2 + (i + 1) * espFolha + 0.0005) });
  }
  const giroTotal = 2 * Math.PI - 2 * a;
  const aplica = (vira: number) => {
    lista.forEach((f, i) => {
      const k = easeFolha(k01(vira - i));
      // virada: a folha sobe pela frente, passa por cima da espiral e deita na placa de trás (em leque bem leve)
      f.pivo.rotation.x = -a - (giroTotal + 0.012 * i) * k;
      // a troca de lado do anel acontece lá em cima (k de 0,35 a 0,65), com a folha em pé, longe das placas
      const s = k01((k - 0.35) / 0.3);
      const ss = s * s * (3 - 2 * s);
      f.desliza.position.z = f.zFrente + (f.zTras - f.zFrente) * ss;
    });
  };
  aplica(0);
  return { modelo: g, aplica };
}

// ---------- pilha que treme ----------
/** tremor dos dois maços de cima da pilha (o impacto do carimbo): k de 0 a 1, no instante t */
export function tremorDaPilha(modelo: THREE.Object3D): (k: number, t: number) => void {
  const filhos = modelo.children.slice(-2) as THREE.Object3D[];
  const base = filhos.map((f) => ({ ry: f.rotation.y, x: f.position.x, z: f.position.z }));
  return (k, t) => {
    filhos.forEach((f, i) => {
      const fase = i * 1.7;
      f.rotation.y = base[i].ry + k * 0.022 * Math.sin(t * 2 * Math.PI * 13 + fase);
      f.position.x = base[i].x + k * 0.0011 * Math.sin(t * 2 * Math.PI * 17 + fase);
      f.position.z = base[i].z + k * 0.0008 * Math.cos(t * 2 * Math.PI * 15 + fase);
    });
  };
}

// ---------- objeto solto do tipo "argila" ----------
/** as formas do tipo "argila" (render.formaArgila do catálogo, ou conteudo.forma na cena) */
export const FORMAS_ARGILA = ["pilha", "carimbo", "pasta", "despertador", "envelope", "envelope-aberto", "lupa", "caneta", "prancheta", "moeda", "sino"] as const;
export type FormaArgila = (typeof FORMAS_ARGILA)[number];

type Montado = { modelo: THREE.Object3D; pinta(c: Record<string, number>, t: number): void };

/** constrói uma forma de argila com as opções (as mesmas das peças do palco) */
export function montaArgila(forma: string, op: Record<string, unknown>): Montado {
  const nada = () => undefined;
  switch (forma) {
    case "pilha": {
      const macos = Array.isArray(op.macos) ? (op.macos as number[]) : [0.013, 0.012, 0.014, 0.012];
      const modelo = pilha(macos, { doc: op.doc !== false, semente: num(op.semente, 7) });
      const treme = tremorDaPilha(modelo);
      return { modelo, pinta: (c, t) => treme(num(c.tremor, 0), t) };
    }
    case "carimbo": {
      // o carimbo solto: sobe (m) e achata (o pouso de carimbo) no próprio modelo
      const g = new THREE.Group();
      const m = carimbo();
      g.add(m);
      return {
        modelo: g,
        pinta(c) {
          const ach = num(c.achata, 0);
          m.position.y = num(c.sobe, 0);
          m.scale.set(1 + ach * 0.5, 1 - ach, 1 + ach * 0.5);
        },
      };
    }
    case "pasta": {
      const p = pastaComDobradica(num(op.folhas, 3), op.docFrente === true, num(op.abreRad, 0.24));
      return { modelo: p.modelo, pinta: (c) => p.aplica(num(c.abre, num(op.abre, 0)), num(c.folhas, 0)) };
    }
    case "despertador": {
      const modelo = despertador(num(op.tamanho, 0.062));
      if (op.segundos === true) {
        const p = ponteiroSegundos(modelo);
        return { modelo, pinta: (_c, t) => void (p.rotation.z = giroSegundos(t)) };
      }
      return { modelo, pinta: nada };
    }
    case "envelope":
      return { modelo: envelopeEmPe(), pinta: nada };
    case "envelope-aberto":
      return { modelo: envelopeAberto(), pinta: nada };
    case "lupa":
      return { modelo: lupa(), pinta: nada };
    case "caneta":
      return { modelo: caneta(), pinta: nada };
    case "prancheta":
      return { modelo: prancheta(), pinta: nada };
    case "moeda": {
      // gira (voltas em y) sobre a pose do kit
      const g = new THREE.Group();
      const m = moedaPessoa();
      g.add(m);
      return { modelo: g, pinta: (c) => void (m.rotation.y = 2 * Math.PI * num(c.giro, 0)) };
    }
    case "sino": {
      // balanço (rad em z) sobre a pose do kit
      const g = new THREE.Group();
      const m = sino();
      g.add(m);
      return { modelo: g, pinta: (c) => void (m.rotation.z = num(c.balanco, 0)) };
    }
    default:
      throw new Error(`argila de forma desconhecida: "${forma}" (formas: ${FORMAS_ARGILA.join(", ")})`);
  }
}

/** o objeto solto: a forma, as opções (render.opcoes do catálogo e, por cima, conteudo.opcoes da cena) e os canais
 *  (CANAIS_ARGILA, com o quadro 0 em conteudo.estado; quem anima é a batida objeto-canal) */
export const fabricaArgila: FabricaObjeto = {
  async cria({ objeto: o }) {
    // as texturas em canvas (o formulário da pilha, a folha da prancheta) só pintam com a Sora carregada
    await esperaSora([500, 600, 700, 800]);
    const r = (o.render || {}) as Record<string, unknown>;
    const c = (o.conteudo || {}) as Record<string, unknown>;
    const forma = formaDoObjeto(o);
    const op = { ...((r.opcoes as Record<string, unknown>) || {}), ...((c.opcoes as Record<string, unknown>) || {}) };
    const m = montaArgila(forma, op);
    aplicaBase(m.modelo, o);
    const rig = new THREE.Group();
    rig.name = `argila-${forma}`;
    rig.add(m.modelo);
    const inicial = (c.estado || {}) as Record<string, number>;
    m.pinta({ ...(CANAIS_ARGILA[forma] || {}), ...inicial }, 0);
    return {
      raiz: rig,
      sombra: o.sombra,
      pinta(st: Estado, t: number) {
        const canal = st.canais[o.id] || inicial;
        m.pinta({ ...(CANAIS_ARGILA[forma] || {}), ...canal }, t);
      },
    };
  },
};
