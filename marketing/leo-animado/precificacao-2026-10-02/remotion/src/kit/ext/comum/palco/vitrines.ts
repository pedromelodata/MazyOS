// Vitrines do palco de argila (render): os dois painéis arredondados do carrossel de 05/10 (raio 24, borda fina),
// presos ao mundo. A cada quadro as âncoras de mundo (modelo.ts, Vitrine) são projetadas pela câmera do quadro e viram dois
// retângulos em px; um quadro em NDC desenha os painéis por cima do papel do kit (passe opaco, logo depois do
// fundo, com mistura alfa), com a luz suave atrás da argila, o halo coral, o brilho do splash no chão, a
// varredura fria, o fio do vão, a fusão das duas vitrines e o grão. As sombras do chão usam a mesma máscara.
import * as THREE from "three";

/** SDF de caixa arredondada com um raio por canto, em px com y pra baixo: r = (x0, y0, x1, y1); raio = (sup.esq,
 *  sup.dir, inf.dir, inf.esq) */
export const SDF_GLSL = /* glsl */ `
float argilaCaixa(vec2 p, vec4 r, vec4 raio) {
  vec2 c = (r.xy + r.zw) * 0.5;
  vec2 h = max((r.zw - r.xy) * 0.5, vec2(0.0));
  vec2 q = p - c;
  float rr = q.x < 0.0 ? (q.y < 0.0 ? raio.x : raio.w) : (q.y < 0.0 ? raio.y : raio.z);
  rr = min(rr, min(h.x, h.y));
  vec2 d = abs(q) - h + rr;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - rr;
}`;

export type UniformesMascara = {
  uRes: { value: THREE.Vector2 };
  uA: { value: THREE.Vector4 };
  uB: { value: THREE.Vector4 };
  uRA: { value: THREE.Vector4 };
  uRB: { value: THREE.Vector4 };
  uU: { value: THREE.Vector4 };
  uRU: { value: THREE.Vector4 };
  uFusao: { value: number };
  uAlfa: { value: number };
};

export function novaMascara(): UniformesMascara {
  return {
    uRes: { value: new THREE.Vector2(1080, 1920) },
    uA: { value: new THREE.Vector4(72, 640, 528, 1600) },
    uB: { value: new THREE.Vector4(552, 640, 1008, 1600) },
    uRA: { value: new THREE.Vector4(24, 24, 24, 24) },
    uRB: { value: new THREE.Vector4(24, 24, 24, 24) },
    uU: { value: new THREE.Vector4(72, 640, 1008, 1600) },
    uRU: { value: new THREE.Vector4(24, 24, 24, 24) },
    uFusao: { value: 0 },
    uAlfa: { value: 1 },
  };
}

/** prende um material (sombra de contato, sombra da luz chave, sombras-blob) dentro dos painéis: o alfa some nos
 *  últimos 8 px antes da borda; nada vaza pro papel nem atravessa o vão (técnica do carrossel, com os painéis do quadro) */
export function mascaraVitrine<T extends THREE.Material>(mat: T, m: UniformesMascara): T {
  const anterior = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    anterior.call(mat, shader, renderer);
    shader.uniforms.argilaResM = m.uRes;
    shader.uniforms.argilaAM = m.uA;
    shader.uniforms.argilaBM = m.uB;
    shader.uniforms.argilaRAM = m.uRA;
    shader.uniforms.argilaRBM = m.uRB;
    shader.uniforms.argilaUM = m.uU;
    shader.uniforms.argilaRUM = m.uRU;
    shader.uniforms.argilaFusaoM = m.uFusao;
    shader.uniforms.argilaAlfaM = m.uAlfa;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform vec2 argilaResM;
uniform vec4 argilaAM;
uniform vec4 argilaBM;
uniform vec4 argilaRAM;
uniform vec4 argilaRBM;
uniform vec4 argilaUM;
uniform vec4 argilaRUM;
uniform float argilaFusaoM;
uniform float argilaAlfaM;
${SDF_GLSL}`,
      )
      .replace(
        "#include <tonemapping_fragment>",
        `{
  vec2 pxm = vec2(gl_FragCoord.x, argilaResM.y - gl_FragCoord.y) * (1080.0 / argilaResM.x);
  // separadas: as duas vitrines; fundidas: o painel único (sem a costura do vão)
  float dm = mix(min(argilaCaixa(pxm, argilaAM, argilaRAM), argilaCaixa(pxm, argilaBM, argilaRBM)), argilaCaixa(pxm, argilaUM, argilaRUM), argilaFusaoM);
  gl_FragColor.a *= (1.0 - smoothstep(-8.0, -1.0, dm)) * argilaAlfaM;
}
#include <tonemapping_fragment>`,
      );
  };
  mat.customProgramCacheKey = () => "argila-mascara-vitrine";
  mat.needsUpdate = true;
  return mat;
}

const VERT = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const FRAG = /* glsl */ `
uniform vec2 uRes;
uniform vec4 uA;
uniform vec4 uB;
uniform vec4 uRA;
uniform vec4 uRB;
uniform vec4 uU;
uniform vec4 uRU;
uniform float uFusao;
uniform float uAquece;
uniform float uAlfa;
uniform vec3 uFrio;
uniform vec3 uFrioLuz;
uniform vec3 uFrioBorda;
uniform vec3 uQuente;
uniform vec3 uQuenteBorda;
uniform vec3 uHaloCor;
uniform vec3 uBrilhoCor;
uniform vec3 uBrilhoClaro;
uniform vec2 uHalo;
uniform float uHaloR;
uniform float uHaloI;
uniform vec2 uLuzFria;
uniform vec2 uLuzFriaR;
uniform vec4 uBrilho;
uniform float uBrilhoI;
uniform float uBrilhoNeutro;
uniform vec3 uVarre;
uniform vec4 uFio;
uniform float uSeed;
uniform float uGrao;
${SDF_GLSL}
float argilaHash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + uSeed) * 43758.5453); }

vec3 corQuente(vec2 px) {
  vec2 dh = (px - uHalo) / uHaloR;
  float g = exp(-2.0 * dot(dh, dh));
  vec3 c = mix(uQuente, uHaloCor, clamp(uHaloI * g, 0.0, 1.0));
  if (uBrilhoI > 0.0) {
    vec2 e = (px - uBrilho.xy) / uBrilho.zw;
    c = mix(c, mix(uBrilhoCor, uBrilhoClaro, uBrilhoNeutro), uBrilhoI * exp(-2.2 * dot(e, e)));
  }
  return c;
}

vec3 corFria(vec2 px) {
  vec2 dl = (px - uLuzFria) / uLuzFriaR;
  vec3 c = mix(uFrio, uFrioLuz, exp(-1.6 * dot(dl, dl)));
  if (uVarre.z > 0.0) {
    // faixa de luz fria atravessando a vitrine (de cima pra baixo levemente inclinada)
    float x = px.x - uVarre.x + (px.y - uLuzFria.y) * 0.18;
    float b = exp(-0.5 * (x * x) / (uVarre.y * uVarre.y));
    c = mix(c, vec3(1.0), 0.32 * uVarre.z * b);
  }
  return c;
}

void main() {
  float k = 1080.0 / uRes.x;
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) * k;
  float aa = 0.6 * k;
  float dA = argilaCaixa(px, uA, uRA);
  float dB = argilaCaixa(px, uB, uRB);
  float dU = argilaCaixa(px, uU, uRU);
  float dMin = min(dA, dB);
  float cobre = 1.0 - smoothstep(-aa, aa, dMin);
  float naQuente = step(dB, dA);
  vec3 q = corQuente(px);
  vec3 f = mix(corFria(px), q, uAquece);
  vec3 c = mix(f, q, naQuente);
  // borda de 1,5 px por dentro: a de cada vitrine, que vira só a de fora quando elas se fundem
  float linhaSep = 1.0 - smoothstep(0.75 - aa, 0.75 + aa, abs(dMin + 0.75));
  float linhaUni = 1.0 - smoothstep(0.75 - aa, 0.75 + aa, abs(dU + 0.75));
  float linha = mix(linhaSep, linhaUni, uFusao);
  vec3 borda = mix(mix(uFrioBorda, uQuenteBorda, uAquece), uQuenteBorda, naQuente);
  c = mix(c, borda, linha * 0.9);
  // vinheta quente de 3 % e grão de +-0,6 % (os do carrossel)
  vec2 vq = (px / vec2(1080.0, 1920.0) - 0.5) * vec2(1.0, 0.85);
  float vin = smoothstep(0.5, 1.05, length(vq));
  c *= vec3(1.0) - 0.03 * vin * vec3(0.8, 1.0, 1.35);
  c += (argilaHash(floor(px)) - 0.5) * 2.0 * uGrao;
  float a = cobre * uAlfa;
  // fio de luz no vão: núcleo de uns 8 a 10 px com brilho leve em volta; a ponta que desce é um degradê vertical
  // longo (sem corte reto) e o começo, lá em cima, também entra em degradê
  if (uFio.w > 0.0 && px.y >= uFio.y - 6.0 && px.y <= uFio.z + 40.0) {
    float dx = abs(px.x - uFio.x);
    float topo = smoothstep(uFio.y - 4.0, uFio.y + 46.0, px.y);
    float ponta = 1.0 - smoothstep(uFio.z - 140.0, uFio.z + 8.0, px.y);
    float corpo = topo * ponta * ponta;
    // o núcleo (uns 8 px) fica no vão, sobre o papel; quem mostra a luz é o brilho que pega na borda dos painéis
    float nucleo = exp(-0.5 * (dx * dx) / (3.2 * 3.2));
    float halo = exp(-0.5 * (dx * dx) / (10.0 * 10.0));
    float cabeca = exp(-0.5 * pow((px.y - (uFio.z - 40.0)) / 46.0, 2.0)) * exp(-0.5 * (dx * dx) / (16.0 * 16.0));
    float fa = clamp(nucleo * corpo + halo * 0.5 * corpo + cabeca * 0.3, 0.0, 1.0) * uFio.w;
    vec3 fc = vec3(1.0, 0.995, 0.985);
    float ao = fa + a * (1.0 - fa);
    c = (fc * fa + c * a * (1.0 - fa)) / max(ao, 1e-5);
    a = ao;
  }
  gl_FragColor = vec4(c, a);
  #include <colorspace_fragment>
}`;

export type UniformesVitrine = UniformesMascara & {
  uAquece: { value: number };
  uHalo: { value: THREE.Vector2 };
  uHaloR: { value: number };
  uHaloI: { value: number };
  uLuzFria: { value: THREE.Vector2 };
  uLuzFriaR: { value: THREE.Vector2 };
  uBrilho: { value: THREE.Vector4 };
  uBrilhoI: { value: number };
  uBrilhoNeutro: { value: number };
  uVarre: { value: THREE.Vector3 };
  uFio: { value: THREE.Vector4 };
  uSeed: { value: number };
  uGrao: { value: number };
};

/** cores das vitrines (tokens do carrossel, cores.ts, revisão v3) */
export const CORES_VITRINE = {
  frio: "#C9CFD6",
  frioLuz: "#D3D8DE",
  frioBorda: "#B9C0C8",
  quente: "#FEF3EE",
  quenteBorda: "#F1D5C8",
  halo: "#FBDDD1",
  brilho: "#F5A184",
  brilhoClaro: "#FFF7F2",
};

export function criaVitrines(m: UniformesMascara): { malha: THREE.Mesh; u: UniformesVitrine } {
  const u: UniformesVitrine = {
    ...m,
    uAquece: { value: 0 },
    uHalo: { value: new THREE.Vector2(780, 1040) },
    uHaloR: { value: 340 },
    uHaloI: { value: 0.4 },
    uLuzFria: { value: new THREE.Vector2(300, 1160) },
    uLuzFriaR: { value: new THREE.Vector2(330, 420) },
    uBrilho: { value: new THREE.Vector4(780, 1405, 260, 42) },
    uBrilhoI: { value: 0 },
    uBrilhoNeutro: { value: 0 },
    uVarre: { value: new THREE.Vector3(0, 70, 0) },
    uFio: { value: new THREE.Vector4(540, 640, 640, 0) },
    uSeed: { value: 0 },
    uGrao: { value: 0.006 },
  };
  const c = (h: string) => ({ value: new THREE.Color(h) });
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      ...u,
      uFrio: c(CORES_VITRINE.frio),
      uFrioLuz: c(CORES_VITRINE.frioLuz),
      uFrioBorda: c(CORES_VITRINE.frioBorda),
      uQuente: c(CORES_VITRINE.quente),
      uQuenteBorda: c(CORES_VITRINE.quenteBorda),
      uHaloCor: c(CORES_VITRINE.halo),
      uBrilhoCor: c(CORES_VITRINE.brilho),
      uBrilhoClaro: c(CORES_VITRINE.brilhoClaro),
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthTest: false,
    depthWrite: false,
    transparent: false,
    // passe opaco (logo depois do papel do kit, renderOrder -9) com mistura alfa: o papel aparece fora dos painéis
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  const malha = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  malha.frustumCulled = false;
  malha.renderOrder = -9;
  malha.userData.argilaSemSombra = true;
  return { malha, u };
}
