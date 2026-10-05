// Objeto "glb" genérico (dono K06): qualquer GLB do catálogo, com tint de material por nome (objeto.cores),
// tela estática opcional (malhaTela + telaInicial, com a imagem da tela da cena) e texturaMalha: troca o mapa de
// uma malha nomeada por uma CanvasTexture de um pintor (no glb-calendario-mesa, a página da frente vira o
// calendário em pt-BR do PintorCalendarioMesa). O cache do GLB é compartilhado: material mexido é sempre clonado.
// Frente MODELOS NO RENDER (03/10): GLB com esqueleto é clonado pelo SkeletonUtils (o clone(true) não religa os
// ossos e a pasta-animada saía com 2,8 m); o pivô do catálogo entra pelo aplicaBase; objeto.materiais ajusta cada
// material pelo nome (cor, rugosidade, metálico, envMap, opacidade, transmissão, sem textura, sem luz, normais
// suaves e troca de matiz dentro da textura), sempre num clone.
import * as THREE from "three";
import { clone as cloneComEsqueleto } from "three/examples/jsm/utils/SkeletonUtils.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { AjusteMaterial, Estado, ObjetoProps, TrocaMatiz } from "../../nucleo/tipos";
import { PintorCalendarioMesa, type ParamsCalendario } from "../pintores/calendarioMesa";
import { PintorComprovante, type DadosComprovante } from "../pintores/comprovante";
import { PintorFolhaKit, type DadosDas } from "../pintores/folhaDas";
import type { FabricaObjeto } from "../tipos-render";
import { aplicaBase } from "./aparelho";

/** cor que multiplica a textura pintada na malha (a do material da folha do guia) */
export const COR_PAPEL_MALHA = "#EEE7DD";

/** pintor de malha: a textura e o desenho do quadro (os estáticos pintam uma vez só) */
export type PintorMalha = { tex: THREE.Texture; pinta(st: Estado, t: number): void };
export type CriaPintorMalha = (canvas: [number, number], flipY: boolean, params: Record<string, unknown>) => PintorMalha;

const PINTORES_MALHA: Record<string, CriaPintorMalha> = {
  calendarioMesa: (canvas, flipY, params) => {
    const p = new PintorCalendarioMesa(params as Partial<ParamsCalendario>, canvas, flipY);
    return { tex: p.tex, pinta: () => p.pinta() };
  },
  folhaDas: (canvas, flipY, params) => {
    const p = new PintorFolhaKit(params as Partial<DadosDas>, canvas, flipY);
    return { tex: p.tex, pinta: () => p.pinta() };
  },
  comprovante: (canvas, flipY, params) => {
    const p = new PintorComprovante(params as Partial<DadosComprovante>, canvas, flipY);
    return { tex: p.tex, pinta: () => p.pinta() };
  },
};

/** extensão pode registrar pintor de malha com nome próprio (nunca troca um que já existe) */
export function registraPintorMalha(nome: string, cria: CriaPintorMalha): boolean {
  if (PINTORES_MALHA[nome]) return false;
  PINTORES_MALHA[nome] = cria;
  return true;
}

/** nome como o GLTFLoader grava (espaço vira "_") */
const normaliza = (s: string) => s.replace(/\s+/g, "_");

/** malhas sob o nó com esse nome (aceita o nome do arquivo, com espaço, ou o do three, com "_") */
export function malhasPorNome(raiz: THREE.Object3D, nome: string): THREE.Mesh[] {
  const alvo = normaliza(nome);
  const nos: THREE.Object3D[] = [];
  raiz.traverse((o) => {
    const n1 = normaliza(o.name || "");
    const n2 = normaliza(String((o.userData && o.userData.name) || ""));
    if (n1 === alvo || n2 === alvo || n1.startsWith(alvo + "_") || n2.startsWith(alvo + " ") || n2.startsWith(alvo + "_")) nos.push(o);
  });
  const malhas: THREE.Mesh[] = [];
  for (const n of nos) {
    n.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && malhas.indexOf(o as THREE.Mesh) < 0) malhas.push(o as THREE.Mesh);
    });
  }
  return malhas;
}

const materiais = (m: THREE.Mesh): THREE.Material[] => (Array.isArray(m.material) ? m.material : [m.material]);

/** troca o material de uma malha por um clone (uma vez por material de origem) */
function clonaMaterial(m: THREE.Mesh, origem: THREE.Material, novo: THREE.Material) {
  if (Array.isArray(m.material)) m.material = m.material.map((x) => (x === origem ? novo : x));
  else if (m.material === origem) m.material = novo;
}

/** clone do GLB do cache: com SkinnedMesh, pelo SkeletonUtils (religa os ossos); senão, clone(true) */
export function clonaModelo(origem: THREE.Object3D): THREE.Object3D {
  let temEsqueleto = false;
  origem.traverse((x) => {
    if ((x as THREE.SkinnedMesh).isSkinnedMesh) temEsqueleto = true;
  });
  return temEsqueleto ? cloneComEsqueleto(origem) : origem.clone(true);
}

// ---------- troca de matiz dentro da textura (materiais.<nome>.matiz) ----------
const GLSL_MATIZ_FUNCOES = `
uniform vec4 kitMatizDe[KIT_MATIZ_N];
uniform vec3 kitMatizPara[KIT_MATIZ_N];
uniform vec2 kitMatizTol[KIT_MATIZ_N];
vec3 kitRgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
`;
const GLSL_MATIZ_APLICA = `
{
  vec3 kitLin = diffuseColor.rgb;
  vec3 kitHsv = kitRgb2hsv(pow(max(kitLin, vec3(0.0)), vec3(1.0 / 2.2)));
  float kitLum = dot(kitLin, vec3(0.2126, 0.7152, 0.0722));
  vec3 kitSai = kitLin;
  for (int i = 0; i < KIT_MATIZ_N; i++) {
    float dh = abs(kitHsv.x - kitMatizDe[i].x);
    dh = min(dh, 1.0 - dh);
    float tol = kitMatizTol[i].x;
    float sm = kitMatizTol[i].y;
    float peso = (1.0 - smoothstep(tol * 0.6, tol, dh)) * smoothstep(sm * 0.6, sm, kitHsv.y);
    vec3 novo = kitMatizPara[i] * clamp(kitLum / max(kitMatizDe[i].w, 1.0e-4), 0.0, 2.0);
    kitSai = mix(kitSai, novo, peso);
  }
  diffuseColor.rgb = kitSai;
}
`;

/** matiz (0 a 1) de uma cor sRGB em hex, pela mesma conta do shader */
function matizDe(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const mx = Math.max(r, g, b);
  const d = mx - Math.min(r, g, b);
  if (d < 1e-6) return 0;
  let h = mx === r ? (g - b) / d : mx === g ? 2 + (b - r) / d : 4 + (r - g) / d;
  h /= 6;
  return h < 0 ? h + 1 : h;
}

function aplicaMatiz(mat: THREE.Material, trocas: TrocaMatiz[]) {
  const n = Math.min(4, trocas.length);
  if (!n) return;
  const de: THREE.Vector4[] = [];
  const para: THREE.Vector3[] = [];
  const tol: THREE.Vector2[] = [];
  for (let i = 0; i < n; i++) {
    const t = trocas[i];
    const cDe = new THREE.Color(t.de); // linear (o three converte o hex sRGB)
    const cPara = new THREE.Color(t.para);
    de.push(new THREE.Vector4(matizDe(t.de), 0, 0, 0.2126 * cDe.r + 0.7152 * cDe.g + 0.0722 * cDe.b));
    para.push(new THREE.Vector3(cPara.r, cPara.g, cPara.b));
    tol.push(new THREE.Vector2((typeof t.tolerancia === "number" ? t.tolerancia : 25) / 360, typeof t.satMin === "number" ? t.satMin : 0.12));
  }
  const m = mat as THREE.Material & { defines?: Record<string, unknown> };
  m.defines = { ...(m.defines || {}), KIT_MATIZ_N: n };
  m.onBeforeCompile = (shader) => {
    shader.uniforms.kitMatizDe = { value: de };
    shader.uniforms.kitMatizPara = { value: para };
    shader.uniforms.kitMatizTol = { value: tol };
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\n" + GLSL_MATIZ_FUNCOES)
      .replace("#include <map_fragment>", "#include <map_fragment>\n" + GLSL_MATIZ_APLICA);
  };
  m.customProgramCacheKey = () => "kitMatiz" + n;
  m.needsUpdate = true;
}

/** material novo com o ajuste do catálogo (sempre a partir de um clone; o original do cache fica intacto) */
function materialAjustado(origem: THREE.Material, aj: AjusteMaterial, cor: string | undefined): THREE.Material {
  const base = origem as THREE.MeshPhysicalMaterial;
  let novo: THREE.Material;
  if (aj.semLuz) {
    // a cor exata da textura (o símbolo da marca): sem luz e sem tone mapping
    novo = new THREE.MeshBasicMaterial({
      name: base.name, map: aj.semMapa ? null : base.map || null, color: base.color ? base.color.clone() : new THREE.Color(1, 1, 1),
      transparent: base.transparent, opacity: base.opacity, side: base.side, alphaTest: base.alphaTest, toneMapped: false,
    });
  } else novo = origem.clone();
  const n = novo as THREE.MeshPhysicalMaterial;
  if (cor && n.color) n.color.set(cor);
  if (aj.cor && n.color) n.color.set(aj.cor);
  if (aj.semMapa && "map" in n) n.map = null;
  if (!aj.semLuz) {
    if (typeof aj.rugosidade === "number" && "roughness" in n) n.roughness = aj.rugosidade;
    if (typeof aj.metalico === "number" && "metalness" in n) n.metalness = aj.metalico;
    if (typeof aj.envMap === "number" && "envMapIntensity" in n) n.envMapIntensity = aj.envMap;
    if (typeof aj.transmissao === "number" && "transmission" in n) n.transmission = aj.transmissao;
    if (aj.emissivo && n.emissive) n.emissive.set(aj.emissivo);
    if (typeof aj.intensidadeEmissiva === "number" && "emissiveIntensity" in n) n.emissiveIntensity = aj.intensidadeEmissiva;
  }
  if (typeof aj.opacidade === "number") {
    n.opacity = aj.opacidade;
    if (aj.opacidade < 1) n.transparent = true;
  }
  if (typeof aj.transparente === "boolean") n.transparent = aj.transparente;
  if (n.transparent && typeof aj.opacidade === "number" && aj.opacidade < 1) n.depthWrite = false;
  if (aj.dupla === true) n.side = THREE.DoubleSide;
  if (aj.normaisSuaves) n.flatShading = false;
  if (aj.matiz && aj.matiz.length) aplicaMatiz(n, aj.matiz);
  n.needsUpdate = true;
  return novo;
}

/** junta os vértices e recalcula as normais (malha sem normais no arquivo sai facetada; o pote de vidro some) */
function suavizaNormais(m: THREE.Mesh) {
  const g = m.geometry.clone();
  g.deleteAttribute("normal");
  const junta = mergeVertices(g, 1e-4);
  junta.computeVertexNormals();
  m.geometry = junta;
}

/** aplica cores (tint simples) e materiais (ajuste completo) no modelo clonado: um material novo por material de
 *  origem; "*" vale pra todos os materiais */
function ajustaMateriais(modelo: THREE.Object3D, cores: Record<string, string>, ajustes: Record<string, AjusteMaterial>, rotulo: string) {
  const nomesCores = Object.keys(cores);
  const nomesAj = Object.keys(ajustes);
  if (!nomesCores.length && !nomesAj.length) return;
  const novos = new Map<THREE.Material, THREE.Material>();
  const achados = new Set<string>();
  const suavizar: THREE.Mesh[] = [];
  modelo.traverse((x) => {
    const m = x as THREE.Mesh;
    if (!m.isMesh) return;
    for (const mat of materiais(m)) {
      const aj: AjusteMaterial = { ...(ajustes["*"] || {}), ...(ajustes[mat.name] || {}) };
      const cor = cores[mat.name];
      const temAj = Object.keys(aj).length > 0;
      if (!cor && !temAj) continue;
      if (cor) achados.add(mat.name);
      if (ajustes[mat.name]) achados.add(mat.name);
      let novo = novos.get(mat);
      if (!novo) {
        if (temAj) novo = materialAjustado(mat, aj, cor);
        else {
          novo = mat.clone();
          const comCor = novo as THREE.Material & { color?: THREE.Color };
          if (comCor.color) comCor.color.set(cor as string);
        }
        novos.set(mat, novo);
      }
      clonaMaterial(m, mat, novo);
      if (aj.normaisSuaves && suavizar.indexOf(m) < 0) suavizar.push(m);
    }
  });
  for (const m of suavizar) suavizaNormais(m);
  for (const nome of nomesCores.concat(nomesAj)) {
    if (nome !== "*" && !achados.has(nome)) console.warn("KIT_AVISO", `glb ${rotulo}: material "${nome}" (cores ou materiais) não achado no modelo`);
  }
}

export const fabricaGlb: FabricaObjeto = {
  arquivos(o, props) {
    const imagens: string[] = [];
    if (o.malhaTela && o.telaInicial && props.telas && props.telas[o.telaInicial]) imagens.push(props.telas[o.telaInicial].arquivo);
    return { glb: o.arquivo ? [o.arquivo] : [], imagens };
  },
  cria({ objeto: o, props, recursos }) {
    if (!o.arquivo) throw new Error(`glb ${o.id}: falta o arquivo (render.publicKit do catálogo, ou o caminho no public)`);
    const modelo = clonaModelo(recursos.glb(o.arquivo));
    aplicaBase(modelo, o);
    // tint: cores {"<nome do material>": "#hex"}; ajuste: materiais {"<nome do material>": {...}} (catálogo + cena)
    ajustaMateriais(modelo, o.cores || {}, o.materiais || {}, o.id);
    // tela estática opcional
    if (o.malhaTela && o.telaInicial && props.telas && props.telas[o.telaInicial]) {
      const img = recursos.imagem(props.telas[o.telaInicial].arquivo);
      const [w, h] = o.telaPx || [img.naturalWidth || img.width, img.naturalHeight || img.height];
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = o.flipY !== false;
      tex.anisotropy = 8;
      const telas = malhasPorNome(modelo, o.malhaTela);
      for (const m of telas) m.material = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
      if (!telas.length) console.warn("KIT_AVISO", `glb ${o.id}: malha da tela "${o.malhaTela}" não achada`);
    }
    // texturaMalha: o mapa de uma malha nomeada vira a CanvasTexture de um pintor
    let pintor: PintorMalha | null = null;
    const tm = o.texturaMalha;
    if (tm) {
      const cria = PINTORES_MALHA[tm.pintor];
      if (!cria) throw new Error(`glb ${o.id}: pintor de malha desconhecido: "${tm.pintor}" (existem: ${Object.keys(PINTORES_MALHA).join(", ")})`);
      const flipY = tm.flipY === true; // padrão false: a convenção do glTF (UV com v = 0 no topo da imagem)
      pintor = cria(tm.canvas || [512, 512], flipY, (tm.params || {}) as Record<string, unknown>);
      pintor.tex.colorSpace = THREE.SRGBColorSpace;
      const malhas = malhasPorNome(modelo, tm.malha);
      const nomeMaterial = (tm as { material?: string }).material;
      // a malha da página pode ter várias primitivas: troca só a que já tem mapa (ou a do material pedido)
      const alvos = malhas.filter((m) => materiais(m).some((mat) => (nomeMaterial ? mat.name === nomeMaterial : !!(mat as THREE.MeshStandardMaterial).map)));
      for (const m of alvos.length ? alvos : malhas) {
        for (const mat of materiais(m)) {
          if (nomeMaterial ? mat.name !== nomeMaterial : alvos.length && !(mat as THREE.MeshStandardMaterial).map) continue;
          const novo = mat.clone() as THREE.MeshStandardMaterial;
          novo.map = pintor.tex;
          // multiplicador do papel (o mesmo #EEE7DD da folha do guia): com as luzes do kit, branco puro estoura e
          // o coral vira salmão; texturaMalha.cor troca (acréscimo do K06)
          if (novo.color) novo.color.set(((tm as { cor?: string }).cor) || COR_PAPEL_MALHA);
          novo.needsUpdate = true;
          clonaMaterial(m, mat, novo);
        }
      }
      if (!malhas.length) console.warn("KIT_AVISO", `glb ${o.id}: malha "${tm.malha}" da texturaMalha não achada`);
    }
    const rig = new THREE.Group();
    rig.add(modelo);
    const p = pintor;
    const anima = nosAnimados(modelo, o);
    return {
      raiz: rig,
      sombra: o.sombra,
      pinta: p || anima ? (st: Estado, t: number) => {
        if (p) p.pinta(st, t);
        if (anima) anima(st);
      } : undefined,
    };
  },
};

// ---------- partes que animam (acréscimo de 05/10, v3 da peça de 05/10) ----------
// conteudo.nos {"<canal>": [{no, prop, por}]}: cada canal do objeto (st.canais[id], que a batida objeto-canal anima)
// move nós nomeados do GLB, somando valor x por à pose do arquivo. prop: rx, ry, rz (rad), x, y, z (m, no espaço do
// nó pai), sx, sy, sz ou s (escala, multiplicando a do arquivo: 1 + valor x por). Ex.: os ponteiros do despertador
// detalhado ({"corre": [{"no": "PonteiroMinutos", "prop": "rz", "por": -6.2832}]}) e a areia da ampulheta.
export type NoAnimado = { no: string; prop: string; por: number };
const PROPS_NO = ["rx", "ry", "rz", "x", "y", "z", "sx", "sy", "sz", "s"];

/** nó pelo nome do arquivo (com espaço) ou do three (com "_"); o primeiro na ordem do traverse */
function noPorNome(raiz: THREE.Object3D, nome: string): THREE.Object3D | null {
  const alvo = normaliza(nome);
  let achado: THREE.Object3D | null = null;
  raiz.traverse((o) => {
    if (achado) return;
    if (normaliza(o.name || "") === alvo || normaliza(String((o.userData && o.userData.name) || "")) === alvo) achado = o;
  });
  return achado;
}

/** a função que aplica os canais nos nós a cada quadro (null quando o objeto não declara conteudo.nos) */
export function nosAnimados(modelo: THREE.Object3D, o: ObjetoProps): ((st: Estado) => void) | null {
  const nos = ((o.conteudo || {}) as { nos?: Record<string, NoAnimado[]> }).nos;
  if (!nos || typeof nos !== "object") return null;
  const alvos: Array<{ canal: string; no: THREE.Object3D; prop: string; por: number; base: number }> = [];
  for (const canal of Object.keys(nos)) {
    for (const d of nos[canal] || []) {
      if (PROPS_NO.indexOf(d.prop) < 0) throw new Error(`glb ${o.id}: canal "${canal}": prop "${d.prop}" desconhecida (${PROPS_NO.join(", ")})`);
      if (typeof d.por !== "number" || !isFinite(d.por)) throw new Error(`glb ${o.id}: canal "${canal}": "por" precisa ser número`);
      const no = noPorNome(modelo, d.no);
      if (!no) {
        console.warn("KIT_AVISO", `glb ${o.id}: nó "${d.no}" do canal "${canal}" não achado`);
        continue;
      }
      alvos.push({ canal, no, prop: d.prop, por: d.por, base: leProp(no, d.prop) });
    }
  }
  if (!alvos.length) return null;
  return (st: Estado) => {
    const c = (st.canais && st.canais[o.id]) || {};
    for (const a of alvos) {
      const v = typeof c[a.canal] === "number" && isFinite(c[a.canal]) ? c[a.canal] : 0;
      escreveProp(a.no, a.prop, a.prop.charAt(0) === "s" ? a.base * (1 + v * a.por) : a.base + v * a.por);
    }
  };
}

function leProp(no: THREE.Object3D, prop: string): number {
  if (prop === "rx") return no.rotation.x;
  if (prop === "ry") return no.rotation.y;
  if (prop === "rz") return no.rotation.z;
  if (prop === "x") return no.position.x;
  if (prop === "y") return no.position.y;
  if (prop === "z") return no.position.z;
  if (prop === "sx" || prop === "s") return no.scale.x;
  if (prop === "sy") return no.scale.y;
  return no.scale.z;
}

function escreveProp(no: THREE.Object3D, prop: string, v: number): void {
  if (prop === "rx") no.rotation.x = v;
  else if (prop === "ry") no.rotation.y = v;
  else if (prop === "rz") no.rotation.z = v;
  else if (prop === "x") no.position.x = v;
  else if (prop === "y") no.position.y = v;
  else if (prop === "z") no.position.z = v;
  else if (prop === "sx") no.scale.x = v;
  else if (prop === "sy") no.scale.y = v;
  else if (prop === "sz") no.scale.z = v;
  else no.scale.setScalar(v);
}

/** o objeto do catálogo que a fábrica glb atende (pro KitProvaModelo e pros testes) */
export function ehGlb(o: ObjetoProps) {
  return o.tipo === "glb" || !o.tipo;
}
