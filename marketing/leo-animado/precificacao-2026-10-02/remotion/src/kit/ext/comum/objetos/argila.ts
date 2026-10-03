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
