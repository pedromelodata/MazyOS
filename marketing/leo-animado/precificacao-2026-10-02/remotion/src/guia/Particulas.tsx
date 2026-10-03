import React, { useMemo } from "react";
import * as THREE from "three";
import type { Estado } from "./estado";

// Partículas determinísticas (função só do estado do quadro, nada acumulado): o render em várias abas e
// fora de ordem sai igual. Quatro sistemas: poeira ambiente (camada de fundo), faíscas que convergem pro card
// ("calcula"), estouro no carimbo e na pílula "dia 20", e poeira do pouso na mesa.
const N_AMB = 110;
const N_CONV = 210; // 70 faíscas x 3 pontos de rastro
const N_B1 = 70;
const N_B2 = 46;
const N_B3 = 36; // verificado do pagar (anel de faíscas em volta do botão)
const N_POE = 48;
const N = N_AMB + N_CONV + N_B1 + N_B2 + N_B3 + N_POE;

const CORES = {
  coral: new THREE.Color("#F2643C"),
  coral2: new THREE.Color("#F7A386"),
  coral6: new THREE.Color("#DD4E27"),
  bege: new THREE.Color("#E2D3C1"),
  verde: new THREE.Color("#1DA26E"),
  verde2: new THREE.Color("#7CD3AE"),
};

function rnd(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

type Base = { a: number[]; b: number[]; c: number[]; d: number[]; e: number[]; f: number[]; cor: THREE.Color; tam: number };

export const Particulas: React.FC<{
  t: number; st: Estado; tex: THREE.Texture;
  alvoCard: THREE.Vector3; alvoCarimbo: THREE.Vector3; alvoChip: THREE.Vector3; alvoPouso: THREE.Vector3; alvoBotao: THREE.Vector3;
}> = ({ t, st, tex, alvoCard, alvoCarimbo, alvoChip, alvoPouso, alvoBotao }) => {
  const { geo, base } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(N), 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(N), 1));
    const r = rnd(20261014);
    const bs: Base[] = [];
    const pick = (opts: [THREE.Color, number][]) => {
      let x = r();
      for (const [c, p] of opts) { if ((x -= p) <= 0) return c; }
      return opts[0][0];
    };
    for (let i = 0; i < N; i++) {
      const v = Array.from({ length: 6 }, () => r());
      let cor = CORES.coral;
      let tam = 0.003;
      if (i < N_AMB) { cor = pick([[CORES.coral2, 0.45], [CORES.bege, 0.4], [CORES.coral, 0.15]]); tam = 0.0016 + 0.0034 * v[3]; }
      else if (i < N_AMB + N_CONV) { cor = pick([[CORES.coral, 0.6], [CORES.coral2, 0.25], [CORES.coral6, 0.15]]); tam = 0.0022 + 0.0026 * v[3]; }
      else if (i < N_AMB + N_CONV + N_B1 + N_B2) { cor = pick([[CORES.coral, 0.5], [CORES.coral2, 0.3], [CORES.coral6, 0.2]]); tam = 0.0018 + 0.0032 * v[3]; }
      else if (i < N_AMB + N_CONV + N_B1 + N_B2 + N_B3) { cor = pick([[CORES.verde, 0.55], [CORES.verde2, 0.25], [CORES.coral, 0.2]]); tam = 0.0006 + 0.0008 * v[3]; }
      else { cor = pick([[CORES.bege, 0.75], [CORES.coral2, 0.25]]); tam = 0.0012 + 0.002 * v[3]; }
      bs.push({ a: [v[0]], b: [v[1]], c: [v[2]], d: [v[3]], e: [v[4]], f: [v[5]], cor, tam });
    }
    return { geo: g, base: bs };
  }, []);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTex: { value: tex }, uScale: { value: 1920 / (2 * Math.tan((15 * Math.PI) / 180)) } },
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
    [tex],
  );

  // ---------- posição de cada partícula neste quadro ----------
  const P = geo.attributes.position as THREE.BufferAttribute;
  const C = geo.attributes.aCol as THREE.BufferAttribute;
  const S = geo.attributes.aSize as THREE.BufferAttribute;
  const A = geo.attributes.aAlpha as THREE.BufferAttribute;
  const pa = st.part;
  for (let i = 0; i < N; i++) {
    const b = base[i];
    const [a0, b0, c0, d0, e0, f0] = [b.a[0], b.b[0], b.c[0], b.d[0], b.e[0], b.f[0]];
    let x = 0, y = 0, z = 0, al = 0, sz = b.tam;
    let cor = b.cor;
    if (i < N_AMB) {
      // poeira de luz flutuando em volta, subindo devagar (loop de 17 s pra emendar)
      const vel = 0.004 + 0.008 * b0;
      const yy = -0.13 + ((b0 * 0.36 + vel * t + 0.36) % 0.36);
      x = -0.24 + 0.48 * a0 + Math.sin(t * (0.4 + c0 * 0.5) + e0 * 6.28) * 0.008;
      y = yy;
      z = -0.3 + 0.42 * c0;
      const borda = cl((yy + 0.13) / 0.05) * cl((0.23 - yy) / 0.05);
      const pisca = 0.65 + 0.35 * Math.sin(t * (1.2 + f0 * 2) + d0 * 6.28);
      al = pa.amb * (0.18 + 0.4 * e0) * pisca * borda;
      sz = b.tam * (1 + 1.2 * cl((z + 0.05) / 0.2)); // as mais perto da câmera ficam maiores (bokeh)
    } else if (i < N_AMB + N_CONV) {
      // faíscas que convergem pro card: curva de Bézier de um ponto em volta até o alvo, com atraso por partícula
      const k0 = i - N_AMB;
      const k = Math.floor(k0 / 3); // faísca
      const rastro = k0 % 3; // 0 = cabeça, 1 e 2 = cauda
      const br = base[N_AMB + k * 3]; // a cauda usa os mesmos parâmetros da cabeça
      const [a0c, b0c, c0c] = [br.a[0], br.b[0], br.c[0]];
      cor = br.cor; // cauda da mesma cor da cabeça
      const atraso = (k / (N_CONV / 3)) * 0.55;
      const u = cl((pa.conv - atraso) / 0.42 - rastro * 0.035);
      if (u > 0 && u < 1) {
        const ang = a0c * Math.PI * 2;
        const raio = 0.045 + 0.06 * b0c; // nasce dentro do quadro (o recorte do mergulho tem ~5 cm de meia largura)
        const sx = alvoCard.x + Math.cos(ang) * raio;
        const sy = alvoCard.y + Math.sin(ang) * raio * 0.9;
        const sz0 = alvoCard.z + 0.02 + 0.08 * c0c;
        const mx = (sx + alvoCard.x) / 2 + Math.cos(ang + 1.6) * 0.05;
        const my = (sy + alvoCard.y) / 2 + Math.sin(ang + 1.6) * 0.05;
        const mz = (sz0 + alvoCard.z) / 2 + 0.03;
        const e = u * u; // acelera chegando no card
        const q = 1 - e;
        x = q * q * sx + 2 * q * e * mx + e * e * alvoCard.x;
        y = q * q * sy + 2 * q * e * my + e * e * alvoCard.y;
        z = q * q * sz0 + 2 * q * e * mz + e * e * alvoCard.z;
        al = Math.sin(Math.PI * cl(u * 1.15)) * (rastro === 0 ? 0.95 : rastro === 1 ? 0.5 : 0.25);
        sz = base[N_AMB + k * 3].tam * (1.4 - 0.9 * u) * (rastro === 0 ? 1 : rastro === 1 ? 0.75 : 0.55);
      }
    } else if (i < N_AMB + N_CONV + N_B1 + N_B2) {
      // estouros: carimbo (burst1) e pílula do dia 20 (burst2)
      const no1 = i < N_AMB + N_CONV + N_B1;
      const k = no1 ? pa.burst1 : pa.burst2;
      const o = no1 ? alvoCarimbo : alvoChip;
      if (k > 0 && k < 1) {
        const tau = k * 0.9;
        const th = a0 * Math.PI * 2;
        const ph = Math.acos(1 - b0 * 1.6); // mais pra frente (na direção da câmera)
        const v = (no1 ? 0.12 : 0.09) + 0.16 * c0;
        const dx = Math.sin(ph) * Math.cos(th);
        const dy = Math.sin(ph) * Math.sin(th);
        const dz = Math.cos(ph);
        const arr = (1 - Math.exp(-tau * 5)) / 5; // arrasto
        x = o.x + dx * v * arr;
        y = o.y + dy * v * arr - 0.06 * tau * tau;
        z = o.z + dz * v * arr * 0.6;
        al = Math.pow(1 - k, 1.4) * (0.6 + 0.4 * d0);
        sz = b.tam * (1 + 0.6 * (1 - k));
      }
    } else if (i < N_AMB + N_CONV + N_B1 + N_B2 + N_B3) {
      // verificado: estouro curto e contido saindo do botão, pra frente e pros lados (o card é pequeno no quadro)
      const k = pa.burst3;
      if (k > 0 && k < 1) {
        // nasce na borda do botão (elipse do tamanho dele) e voa pra fora, sem passar por cima do texto do card
        const tau = k * 0.9;
        const th = a0 * Math.PI * 2;
        const ex = Math.cos(th);
        const ey = Math.sin(th);
        const v = 0.035 + 0.05 * c0;
        const arr = (1 - Math.exp(-tau * 7)) / 7;
        x = alvoBotao.x + ex * (0.012 + v * arr * 1.4);
        y = alvoBotao.y + ey * (0.0045 + v * arr * 0.7) - 0.02 * tau * tau;
        z = alvoBotao.z + 0.003;
        al = Math.pow(1 - k, 2) * (0.75 + 0.25 * d0);
        sz = b.tam * (1 + 0.4 * (1 - k));
      }
    } else {
      // poeira do pouso: anel rasante saindo da pegada do iPhone na mesa
      const k = pa.poeira;
      if (k > 0 && k < 1) {
        const tau = k * 0.9;
        const th = a0 * Math.PI * 2;
        const v = 0.05 + 0.08 * b0;
        const arr = (1 - Math.exp(-tau * 4)) / 4;
        x = alvoPouso.x + Math.cos(th) * (0.05 + v * arr);
        z = alvoPouso.z + Math.sin(th) * (0.09 + v * arr);
        y = alvoPouso.y + 0.01 * c0 + 0.03 * arr;
        al = Math.pow(1 - k, 1.2) * 0.55;
      }
    }
    P.setXYZ(i, x, y, z);
    C.setXYZ(i, cor.r, cor.g, cor.b);
    S.setX(i, sz);
    A.setX(i, al);
  }
  P.needsUpdate = true;
  C.needsUpdate = true;
  S.needsUpdate = true;
  A.needsUpdate = true;
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={8} />;
};
