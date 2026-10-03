import type * as THREE from "three";
import { loadGLB, loadImage } from "../../guia/assets3d";
import { esperaSora } from "../fonte";

// Carregamento do que cada tela usa (public-carrossel, só hardlinks): o iPhone, a tela do app montada pelo
// monta.py, o símbolo da marca e a Sora (as texturas em canvas só pintam depois da fonte carregada).

export type Assets = { iphone: THREE.Object3D | null; tela: HTMLImageElement | null; simbolo: HTMLImageElement };

export const TELA_DO_QUADRO: (string | null)[] = [
  "telas/tela-splash.png",
  "telas/tela-home-dia1.png",
  "telas/tela-inicio-pagar.png",
  "telas/tela-declaracoes.png",
  "telas/tela-splash.png", // tela 4: o splash, com os cartões do F020 saindo da tela (plano e pagamento seguem reprovados)
  "telas/tela-splash.png",
  "telas/tela-documentos.png",
];

export async function carregaAssets(n: number): Promise<Assets> {
  const caminhoTela = TELA_DO_QUADRO[n] ?? null;
  const [iphone, tela, simbolo] = await Promise.all([
    caminhoTela ? loadGLB("3d/iphone.glb") : Promise.resolve(null),
    caminhoTela ? loadImage(caminhoTela) : Promise.resolve(null),
    loadImage("marca/simbolo.svg"),
    esperaSora([600, 700, 800]),
  ]);
  return { iphone, tela, simbolo };
}
