// Objeto "pilula" (dono K06): a pilulaDia20 do src/guia/Cena3D.tsx (o "chip" do original) com a etiqueta da
// texturaDia20 do src/guia/pinturas.ts. Forma, material e etiqueta vêm do render do catálogo (proc-pilula-dia20);
// o texto vem de objeto.conteudo.texto (padrão "dia 20", vencimento do DAS no FATOS). Sombra padrão 0,5.
import * as THREE from "three";
import { texturaEtiqueta } from "../pintores/texturas";
import type { FabricaObjeto } from "../tipos-render";

export type RenderPilula = {
  forma: { largura: number; altura: number; profundidade: number; bisel: number; segmentosBisel: number; segmentosCurva: number };
  material: { cor: string; rugosidade: number; clearcoat: number; clearcoatRugosidade: number; envMap: number };
  etiqueta: { texto: string; fonte: string; cor: string; canvas: [number, number]; fracaoLargura: number; z: number };
};

export const RENDER_PILULA_PADRAO: RenderPilula = {
  forma: { largura: 0.064, altura: 0.026, profundidade: 0.006, bisel: 0.0016, segmentosBisel: 4, segmentosCurva: 24 },
  material: { cor: "#D9481F", rugosidade: 0.42, clearcoat: 0.35, clearcoatRugosidade: 0.3, envMap: 0.6 },
  etiqueta: { texto: "dia 20", fonte: "800 150px Sora", cor: "#FFFFFF", canvas: [640, 256], fracaoLargura: 0.86, z: 0.0048 },
};

export function pilula(r: RenderPilula, texto: string) {
  const F = r.forma;
  const w = F.largura;
  const h = F.altura;
  const raio = h / 2;
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + raio, -h / 2);
  s.lineTo(w / 2 - raio, -h / 2);
  s.absarc(w / 2 - raio, 0, raio, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(-w / 2 + raio, h / 2);
  s.absarc(-w / 2 + raio, 0, raio, Math.PI / 2, (3 * Math.PI) / 2, false);
  const geo = new THREE.ExtrudeGeometry(s, { depth: F.profundidade, bevelEnabled: true, bevelThickness: F.bisel, bevelSize: F.bisel, bevelSegments: F.segmentosBisel, curveSegments: F.segmentosCurva });
  geo.translate(0, 0, -F.profundidade / 2);
  const M = r.material;
  const corpo = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: M.cor, roughness: M.rugosidade, clearcoat: M.clearcoat, clearcoatRoughness: M.clearcoatRugosidade, envMapIntensity: M.envMap }));
  const E = r.etiqueta;
  const largEtiqueta = w * E.fracaoLargura;
  const txt = new THREE.Mesh(
    new THREE.PlaneGeometry(largEtiqueta, largEtiqueta * (E.canvas[1] / E.canvas[0])),
    new THREE.MeshBasicMaterial({ map: texturaEtiqueta({ texto, fonte: E.fonte, cor: E.cor, canvas: E.canvas }), transparent: true, toneMapped: false }),
  );
  txt.position.z = E.z;
  const g = new THREE.Group();
  g.add(corpo, txt);
  return g;
}

export const fabricaPilula: FabricaObjeto = {
  cria({ objeto: o }) {
    const r = (o.render || {}) as Partial<RenderPilula>;
    const R: RenderPilula = {
      forma: { ...RENDER_PILULA_PADRAO.forma, ...(r.forma || {}) },
      material: { ...RENDER_PILULA_PADRAO.material, ...(r.material || {}) },
      etiqueta: { ...RENDER_PILULA_PADRAO.etiqueta, ...(r.etiqueta || {}) },
    };
    const conteudo = (o.conteudo || {}) as { texto?: string };
    const texto = typeof conteudo.texto === "string" && conteudo.texto ? conteudo.texto : R.etiqueta.texto;
    return { raiz: pilula(R, texto), sombra: o.sombra };
  },
};
