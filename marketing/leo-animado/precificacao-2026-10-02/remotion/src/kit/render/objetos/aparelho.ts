// Objeto "aparelho" (dono K06): o celular GLB com a malha da tela pintada pelo PintorTelaKit e o vidro frontal
// das props, montado como o phoneRig do src/guia/Cena3D.tsx (mesma ordem de criação: pintor, clone, material
// da tela, rig, vidro).
import * as THREE from "three";
import type { ObjetoProps, PropsKit } from "../../nucleo/tipos";
import { findMesh } from "../carrega";
import { PintorTelaKit } from "../pintores/telaKit";
import type { FabricaObjeto, RecursosCena } from "../tipos-render";

/** vidro da frente inteiro (cobre a borda preta também), só reflexo: aditivo com difuso preto */
export function vidroFrontal(v: { largura: number; altura: number; raio: number; z: number }) {
  const w = v.largura;
  const h = v.altura;
  const r = v.raio;
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const m = new THREE.Mesh(
    new THREE.ShapeGeometry(s, 12),
    new THREE.MeshStandardMaterial({ color: "#000000", roughness: 0.04, metalness: 0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: 1.3 }),
  );
  m.position.z = v.z;
  m.renderOrder = 5;
  return m;
}

/** rotação base e escala do catálogo aplicadas no clone (no celular: y = π, pra tela olhar pra câmera) e o pivô
 *  (o.pivo, calculado pelo montaProps a partir de render.pivo: o clone anda dentro do rig pra o centro da caixa
 *  cair na origem; sem pivô, fica na origem do arquivo, como o celular e o relógio do guia) */
export function aplicaBase(clone: THREE.Object3D, o: ObjetoProps) {
  const rb = o.rotacaoBase;
  if (rb && (rb[0] !== 0 || rb[1] !== 0 || rb[2] !== 0)) clone.rotation.set(rb[0], rb[1], rb[2]);
  if (typeof o.escala === "number" && o.escala !== 1) clone.scale.multiplyScalar(o.escala);
  const p = o.pivo;
  if (p && (p[0] !== 0 || p[1] !== 0 || p[2] !== 0)) clone.position.set(p[0], p[1], p[2]);
}

/** imagens de todas as telas da cena, por chave */
export function imagensDasTelas(props: PropsKit, recursos: RecursosCena): Record<string, HTMLImageElement> {
  const imgs: Record<string, HTMLImageElement> = {};
  for (const k of Object.keys(props.telas || {})) imgs[k] = recursos.imagem(props.telas[k].arquivo);
  return imgs;
}

export const fabricaAparelho: FabricaObjeto = {
  arquivos(o, props) {
    return {
      glb: o.arquivo ? [o.arquivo] : [],
      imagens: Object.keys(props.telas || {}).map((k) => props.telas[k].arquivo),
    };
  },
  cria({ objeto: o, props, recursos }) {
    if (!o.arquivo) throw new Error(`aparelho ${o.id}: falta o arquivo do GLB (render.publicKit do catálogo)`);
    const tela = new PintorTelaKit(imagensDasTelas(props, recursos), props.telas, props.regioes, o.telaPx || [1290, 2796], o.flipY !== false);
    const phone = recursos.glb(o.arquivo).clone(true);
    aplicaBase(phone, o);
    const tm = findMesh(phone, o.malhaTela || "Tela");
    if (tm) tm.material = new THREE.MeshBasicMaterial({ map: tela.tex, toneMapped: false });
    else console.warn("KIT_AVISO", `aparelho ${o.id}: malha "${o.malhaTela || "Tela"}" não achada; a tela não é pintada`);
    const rig = new THREE.Group();
    if (o.vidro) rig.add(phone, vidroFrontal(o.vidro));
    else rig.add(phone);
    return {
      raiz: rig,
      sombra: o.sombra,
      pinta(st) {
        const ts = st.telas[o.id];
        if (ts) tela.pinta(ts);
      },
    };
  },
};
