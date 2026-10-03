import * as THREE from "three";
import { C } from "../cores";
import { VITRINE_RAIO, type FundoCfg } from "../dados";

// Fundo infinito: quadro em NDC atrás de tudo, sem tone mapping, com o colorspace do guia. Papel em todo o quadro
// e a vitrine em painéis arredondados (raio 24, borda fina): o da esquerda frio (L* 83, com uma luz suave atrás
// dos objetos), o da direita quente com o halo coral. No fecho, um painel só, quente (a fusão). Vinheta quente de
// 3 % e grão de +-0,6 %. As cores vão em linear (THREE.Color converte do hex sRGB) e o colorspace_fragment
// devolve em sRGB. As sombras do chão usam a mesma máscara dos painéis (mascaraVitrine) e nunca vazam pro papel.

const SDF = /* glsl */ `
float sdCaixaArred(vec2 p, vec4 r, float raio) {
  vec2 c = (r.xy + r.zw) * 0.5;
  vec2 h = (r.zw - r.xy) * 0.5 - vec2(raio);
  vec2 q = abs(p - c) - h;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - raio;
}`;

const VERT = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}`;

const FRAG = /* glsl */ `
uniform vec2 uRes;
uniform vec3 uPapel;
uniform vec3 uFrio;
uniform vec3 uFrioLuz;
uniform vec3 uFrioBorda;
uniform vec3 uQuente;
uniform vec3 uQuenteBorda;
uniform vec3 uHaloB;
uniform vec3 uBrilhoCor;
uniform vec4 uTileA;
uniform vec4 uTileB;
uniform float uDois;
uniform float uRaio;
uniform vec2 uHalo;
uniform float uHaloR;
uniform float uHaloI;
uniform vec2 uLuzFria;
uniform vec4 uBrilho;
uniform float uBrilhoI;
uniform float uVinheta;
uniform float uGrao;
${SDF}
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// pinta um painel: preenchimento, borda de 1,5 px por dentro e antisserrilhado de 1 px na borda
vec3 painel(vec3 base, vec2 px, vec4 r, vec3 dentro, vec3 borda, float k) {
  float d = sdCaixaArred(px, r, uRaio);
  float aa = 0.6 * k; // pouco mais de 1 pixel real do buffer
  float cobre = 1.0 - smoothstep(-aa, aa, d);
  float linha = 1.0 - smoothstep(0.75 - aa, 0.75 + aa, abs(d + 0.75));
  vec3 c = mix(dentro, borda, linha * 0.9);
  return mix(base, c, cobre);
}

void main() {
  float k = 1080.0 / uRes.x;
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) * k;
  vec3 c = uPapel;

  // painel quente (direita, ou o único do fecho) com o halo coral
  vec2 dh = (px - uHalo) / uHaloR;
  float g = exp(-2.0 * dot(dh, dh));
  vec3 quente = mix(uQuente, uHaloB, clamp(uHaloI * g, 0.0, 1.0));
  if (uBrilhoI > 0.0) {
    vec2 e = (px - uBrilho.xy) / uBrilho.zw;
    quente = mix(quente, uBrilhoCor, uBrilhoI * exp(-2.2 * dot(e, e)));
  }
  if (uDois > 0.5) {
    // painel frio (esquerda): luz suave atrás dos objetos, mais escuro nas bordas
    vec2 dl = (px - uLuzFria) / vec2(260.0, 330.0);
    float l = exp(-1.6 * dot(dl, dl));
    vec3 frio = mix(uFrio, uFrioLuz, l);
    c = painel(c, px, uTileA, frio, uFrioBorda, k);
    c = painel(c, px, uTileB, quente, uQuenteBorda, k);
  } else {
    c = painel(c, px, uTileB, quente, uQuenteBorda, k);
  }

  // vinheta quente de 3 % nos cantos (escurece mais o azul) e grão de +-0,6 %
  vec2 q = (px / vec2(1080.0, 1350.0) - 0.5) * vec2(1.0, 1.25);
  float vin = smoothstep(0.55, 1.1, length(q));
  c *= vec3(1.0) - uVinheta * vin * vec3(0.8, 1.0, 1.35);
  c += (hash(floor(px)) - 0.5) * 2.0 * uGrao;
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

const v4 = (r: number[]) => new THREE.Vector4(r[0], r[1], r[2], r[3]);

export function criaFundo(f: FundoCfg) {
  const b = f.brilho;
  const dois = f.vitrines.length > 1;
  const tileB = dois ? f.vitrines[1] : f.vitrines[0];
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uRes: { value: new THREE.Vector2(1080, 1350) },
      uPapel: { value: new THREE.Color(C.papel) },
      uFrio: { value: new THREE.Color(C.vitrineFrio) },
      uFrioLuz: { value: new THREE.Color(C.vitrineFrioLuz) },
      uFrioBorda: { value: new THREE.Color(C.vitrineFrioBorda) },
      uQuente: { value: new THREE.Color(C.vitrineQuente) },
      uQuenteBorda: { value: new THREE.Color(C.vitrineQuenteBorda) },
      uHaloB: { value: new THREE.Color(C.coral100) },
      uBrilhoCor: { value: new THREE.Color(C.coral300) },
      uTileA: { value: v4(dois ? f.vitrines[0] : [0, 0, 0, 0]) },
      uTileB: { value: v4(tileB) },
      uDois: { value: dois ? 1 : 0 },
      uRaio: { value: VITRINE_RAIO },
      uHalo: { value: new THREE.Vector2(f.halo[0], f.halo[1]) },
      uHaloR: { value: 270 },
      uHaloI: { value: f.haloI },
      uLuzFria: { value: new THREE.Vector2(...(f.luzFria ?? [292, 900])) },
      uBrilho: { value: b ? new THREE.Vector4(b.cx, b.cy, b.rx, b.ry) : new THREE.Vector4(0, 0, 1, 1) },
      uBrilhoI: { value: b ? b.i : 0 },
      uVinheta: { value: 0.03 },
      uGrao: { value: 0.006 },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  m.frustumCulled = false;
  m.renderOrder = -10;
  m.userData.foraDaCaixa = true;
  m.userData.semSombra = true;
  return m;
}

/** uniformes compartilhados da máscara dos painéis (resolução real do buffer e as caixas em px de 1080) */
export type Mascara = {
  uResM: { value: THREE.Vector2 };
  uTileMA: { value: THREE.Vector4 };
  uTileMB: { value: THREE.Vector4 };
  uTileMR: { value: number };
};

export function criaMascara(f: FundoCfg): Mascara {
  const dois = f.vitrines.length > 1;
  return {
    uResM: { value: new THREE.Vector2(1080, 1350) },
    uTileMA: { value: v4(dois ? f.vitrines[0] : [0, 0, 0, 0]) },
    uTileMB: { value: v4(dois ? f.vitrines[1] : f.vitrines[0]) },
    uTileMR: { value: VITRINE_RAIO },
  };
}

/** Prende o material (sombra de contato, sombra da chave, sombras-blob) dentro dos painéis: o alfa some nos
 *  últimos 8 px antes da borda, então nenhuma sombra passa pro papel nem atravessa o vão do meio. */
export function mascaraVitrine<T extends THREE.Material>(mat: T, m: Mascara): T {
  const anterior = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    anterior?.call(mat, shader, renderer);
    Object.assign(shader.uniforms, m);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform vec2 uResM;
uniform vec4 uTileMA;
uniform vec4 uTileMB;
uniform float uTileMR;
${SDF}`,
      )
      .replace(
        "#include <tonemapping_fragment>",
        `{
  vec2 pxm = vec2(gl_FragCoord.x, uResM.y - gl_FragCoord.y) * (1080.0 / uResM.x);
  float dm = 1.0e5;
  if (uTileMA.z > uTileMA.x) dm = min(dm, sdCaixaArred(pxm, uTileMA, uTileMR));
  if (uTileMB.z > uTileMB.x) dm = min(dm, sdCaixaArred(pxm, uTileMB, uTileMR));
  gl_FragColor.a *= 1.0 - smoothstep(-8.0, -1.0, dm);
}
#include <tonemapping_fragment>`,
      );
  };
  mat.customProgramCacheKey = () => "carrossel-mascara-vitrine";
  mat.needsUpdate = true;
  return mat;
}

/** acerta a resolução real do buffer (com dpr 2 o px do shader continua em 1080 x 1350) */
export function acertaResolucao(fundo: THREE.Mesh, gl: THREE.WebGLRenderer, m: Mascara) {
  const v = new THREE.Vector2();
  gl.getDrawingBufferSize(v);
  ((fundo.material as THREE.ShaderMaterial).uniforms.uRes.value as THREE.Vector2).copy(v);
  m.uResM.value.copy(v);
}
