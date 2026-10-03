// Poeira de luz da camada ambiente (dono K06): o primeiro sistema do src/guia/Particulas.tsx, sozinho.
// 110 partículas, a mesma semente 20261014 e a mesma ordem de sorteio do original (6 valores e depois a cor, por
// partícula): as 110 primeiras do original são exatamente estas, e as outras 410 de lá ficam com alfa 0 no guia
// (faíscas, estouros e poeira do pouso nunca animam), então o quadro sai igual. Determinística: função só do
// tempo, nada acumulado (render em várias abas e fora de ordem sai igual).
import React, { useMemo } from "react";
import * as THREE from "three";

export const N_POEIRA = 110;
export const SEMENTE_POEIRA = 20261014;

const CORES = {
  coral: new THREE.Color("#F2643C"),
  coral2: new THREE.Color("#F7A386"),
  bege: new THREE.Color("#E2D3C1"),
};

function rnd(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

type Base = { a: number; b: number; c: number; d: number; e: number; f: number; cor: THREE.Color; tam: number };

export const Particulas: React.FC<{ t: number; intensidade: number; tex: THREE.Texture; altura?: number; fov?: number }> = ({ t, intensidade, tex, altura = 1920, fov = 30 }) => {
  const { geo, base } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N_POEIRA * 3), 3));
    g.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(N_POEIRA * 3), 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(N_POEIRA), 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(N_POEIRA), 1));
    const r = rnd(SEMENTE_POEIRA);
    const bs: Base[] = [];
    const pick = (opts: [THREE.Color, number][]) => {
      let x = r();
      for (const [c, p] of opts) { if ((x -= p) <= 0) return c; }
      return opts[0][0];
    };
    for (let i = 0; i < N_POEIRA; i++) {
      const v = Array.from({ length: 6 }, () => r());
      const cor = pick([[CORES.coral2, 0.45], [CORES.bege, 0.4], [CORES.coral, 0.15]]);
      const tam = 0.0016 + 0.0034 * v[3];
      bs.push({ a: v[0], b: v[1], c: v[2], d: v[3], e: v[4], f: v[5], cor, tam });
    }
    return { geo: g, base: bs };
  }, []);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTex: { value: tex }, uScale: { value: altura / (2 * Math.tan(((fov / 2) * Math.PI) / 180)) } },
        vertexShader: `
          attribute float aSize; attribute float aAlpha; attribute vec3 aCol;
          varying float vA; varying vec3 vC; uniform float uScale;
          void main(){
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = aSize * uScale / max(0.02, -mv.z);
            vA = aAlpha; vC = aCol;
          }`,
        fragmentShader: `
          uniform sampler2D uTex; varying float vA; varying vec3 vC;
          void main(){
            vec4 tx = texture2D(uTex, gl_PointCoord);
            if (tx.a * vA < 0.01) discard;
            gl_FragColor = vec4(vC, tx.a * vA);
            #include <colorspace_fragment>
          }`,
        transparent: true,
        depthWrite: false,
      }),
    [tex, altura, fov],
  );

  // posição de cada partícula neste quadro
  const P = geo.attributes.position as THREE.BufferAttribute;
  const C = geo.attributes.aCol as THREE.BufferAttribute;
  const S = geo.attributes.aSize as THREE.BufferAttribute;
  const A = geo.attributes.aAlpha as THREE.BufferAttribute;
  for (let i = 0; i < N_POEIRA; i++) {
    const b = base[i];
    const [a0, b0, c0, d0, e0, f0] = [b.a, b.b, b.c, b.d, b.e, b.f];
    // poeira de luz flutuando em volta, subindo devagar (loop de 17 s pra emendar)
    const vel = 0.004 + 0.008 * b0;
    const yy = -0.13 + ((b0 * 0.36 + vel * t + 0.36) % 0.36);
    const x = -0.24 + 0.48 * a0 + Math.sin(t * (0.4 + c0 * 0.5) + e0 * 6.28) * 0.008;
    const y = yy;
    const z = -0.3 + 0.42 * c0;
    const borda = cl((yy + 0.13) / 0.05) * cl((0.23 - yy) / 0.05);
    const pisca = 0.65 + 0.35 * Math.sin(t * (1.2 + f0 * 2) + d0 * 6.28);
    const al = intensidade * (0.18 + 0.4 * e0) * pisca * borda;
    const sz = b.tam * (1 + 1.2 * cl((z + 0.05) / 0.2)); // as mais perto da câmera ficam maiores (bokeh)
    P.setXYZ(i, x, y, z);
    C.setXYZ(i, b.cor.r, b.cor.g, b.cor.b);
    S.setX(i, sz);
    A.setX(i, al);
  }
  P.needsUpdate = true;
  C.needsUpdate = true;
  S.needsUpdate = true;
  A.needsUpdate = true;
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={8} />;
};
