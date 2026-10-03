import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Peças básicas dos objetos procedurais (metros, escala de vitrine). Geometria sempre arredondada:
// RoundedBox, Lathe e Extrude com bisel, nunca aresta viva.

export function caixa(w: number, h: number, d: number, r: number, seg = 3) {
  return new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2) * 0.999);
}

export function malha(geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

/** contorno de retângulo arredondado (arcos de verdade) */
export function retArredondado(w: number, h: number, r: number, cx = 0, cy = 0) {
  const s = new THREE.Shape();
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;
  const x1 = cx + w / 2;
  const y1 = cy + h / 2;
  const k = Math.min(r, w / 2, h / 2);
  s.moveTo(x0 + k, y0);
  s.lineTo(x1 - k, y0);
  s.absarc(x1 - k, y0 + k, k, -Math.PI / 2, 0, false);
  s.lineTo(x1, y1 - k);
  s.absarc(x1 - k, y1 - k, k, 0, Math.PI / 2, false);
  s.lineTo(x0 + k, y1);
  s.absarc(x0 + k, y1 - k, k, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + k);
  s.absarc(x0 + k, y0 + k, k, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** normais suaves numa geometria extrudada (tira uv e normal, funde os vértices repetidos e recalcula) */
export function suaviza(geo: THREE.BufferGeometry) {
  geo.deleteAttribute("uv");
  geo.deleteAttribute("normal");
  const g = mergeVertices(geo, 1e-6);
  g.computeVertexNormals();
  return g;
}

/** placa de espessura dada a partir de um contorno, com bisel arredondado, centrada em z */
export function placa(shape: THREE.Shape, espessura: number, bisel: number, curvas = 12) {
  const prof = Math.max(0.00005, espessura - 2 * bisel);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: prof, bevelEnabled: true, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 4, curveSegments: curvas });
  geo.translate(0, 0, -prof / 2);
  return suaviza(geo);
}

/** placa retangular arredondada: o tamanho final já conta o bisel */
export function placaRet(w: number, h: number, espessura: number, raio: number, bisel: number) {
  return placa(retArredondado(w - 2 * bisel, h - 2 * bisel, Math.max(0.0004, raio - bisel)), espessura, bisel);
}

/** gerador pseudoaleatório com semente (a pilha sai igual em toda renderização) */
export function semente(s: number) {
  let v = s % 2147483647;
  if (v <= 0) v += 2147483646;
  return () => (v = (v * 16807) % 2147483647) / 2147483647;
}

/** plano curvo de papel (a curvinha do folhaPapel do guia, com intensidade ajustável) */
export function planoPapel(w: number, h: number, curva = 6, onda = 0.004) {
  const geo = new THREE.PlaneGeometry(w, h, 12, 16);
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    p.setZ(i, -curva * x * x + onda * Math.sin(y * 40));
  }
  geo.computeVertexNormals();
  return geo;
}
