// Objeto "folha" (dono K06): a guia de papel do src/guia/Cena3D.tsx (folhaPapel), com a curva, o material e a
// sombra retangular vindos do bloco render do catálogo (proc-folha-das) e o conteúdo do PintorFolhaKit.
// O papel também serve ao comprovante (mesma montagem, outro pintor).
import * as THREE from "three";
import type { ObjetoProps } from "../../nucleo/tipos";
import { PintorFolhaKit, type DadosDas } from "../pintores/folhaDas";
import { texturaSombraRet } from "../pintores/texturas";
import type { FabricaObjeto } from "../tipos-render";

export type RenderPapel = {
  plano: { largura: number; altura: number; segmentos: [number, number]; curva: number; ondula: number; freqOndula: number };
  canvas: [number, number];
  material: { cor: string; rugosidade: number; envMap: number };
  sombraRet: { x: number; y: number; z: number; opacidade: number };
};

/** o render da proc-folha-das (o mesmo do catálogo), pra quando a cena não traz o bloco */
export const RENDER_FOLHA_PADRAO: RenderPapel = {
  plano: { largura: 0.068, altura: 0.096, segmentos: [12, 16], curva: -6, ondula: 0.004, freqOndula: 40 },
  canvas: [720, 1016],
  material: { cor: "#EEE7DD", rugosidade: 1, envMap: 0.45 },
  sombraRet: { x: 0.004, y: -0.007, z: -0.014, opacidade: 0.42 },
};

export function renderPapel(o: ObjetoProps, padrao: RenderPapel): RenderPapel {
  const r = (o.render || {}) as Partial<RenderPapel>;
  return {
    plano: { ...padrao.plano, ...(r.plano || {}) },
    canvas: r.canvas || padrao.canvas,
    material: { ...padrao.material, ...(r.material || {}) },
    sombraRet: { ...padrao.sombraRet, ...(r.sombraRet || {}) },
  };
}

/** papel curvo com a textura e a sombra retangular como filha (a folhaPapel do Cena3D.tsx) */
export function papelCurvo(tex: THREE.Texture, r: RenderPapel) {
  const P = r.plano;
  const geo = new THREE.PlaneGeometry(P.largura, P.altura, P.segmentos[0], P.segmentos[1]);
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    p.setZ(i, P.curva * x * x + P.ondula * Math.sin(y * P.freqOndula)); // curvinha de papel de verdade
  }
  geo.computeVertexNormals();
  const folha = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, color: r.material.cor, roughness: r.material.rugosidade, metalness: 0, envMapIntensity: r.material.envMap, side: THREE.DoubleSide }));
  const S = r.sombraRet;
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(P.largura * 1.5, P.altura * 1.4), new THREE.MeshBasicMaterial({ map: texturaSombraRet(), transparent: true, depthWrite: false, opacity: S.opacidade, toneMapped: false }));
  // atrás do ponto mais fundo da curva: mais perto, a sombra atravessava o papel e manchava a linha digitável
  sh.position.set(S.x, S.y, S.z);
  sh.renderOrder = 2;
  // a sombra é filha do papel (entra na caixa da sombra de contato, como no original), mas não é o objeto:
  // o KitProvaModelo tira ela da caixa medida
  sh.userData.ignoraCaixa = true;
  folha.add(sh);
  return folha;
}

export const fabricaFolha: FabricaObjeto = {
  cria({ objeto: o }) {
    const r = renderPapel(o, RENDER_FOLHA_PADRAO);
    const papel = new PintorFolhaKit((o.conteudo || null) as Partial<DadosDas> | null, r.canvas, o.flipY !== false);
    const folha = papelCurvo(papel.tex, r);
    return {
      raiz: folha,
      sombra: o.sombra,
      pinta() {
        papel.pinta();
      },
    };
  },
};
