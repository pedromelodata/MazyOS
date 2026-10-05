// Prova de colisão do kit (kit.py colisao; 05/10/2026). Quadro a quadro, acusa objeto 3D entrando em outro, objeto 3D
// na faixa da legenda (com a legenda na tela) ou atrás do fecho (logo "Vai, Legalizaí" e pílula do link, com eles na
// tela) e o toque aparente: dois corpos que se cobrem na tela quase encostando em 3D (de frente, a junção lê como um
// entrando no outro). Só roda com props.prova.colisao: o Cena3DKit chama depois das poses, do pinta e das matrizes de
// mundo; sem a prop, nada daqui roda e o quadro sai igual. Não muda nada da cena (lê matrizes e geometrias; a BVH é
// montada numa cópia da geometria) e escreve no console as linhas que o RM/src/kit/cli/colisao.mjs junta:
//   [PROVA] {q, t, corpos, malhas, pares, sobre, zonas, ms, ms3d, msSobre}   uma por quadro testado
//   [COLISAO] {q, a, b, prof, tipo, malhas, px, permitido?}    corpos que se cruzam além da tolerância
//   [CONTATO] {q, a, b, prof, tipo}                             se tocam até a tolerância (encostar não é colidir)
//   [FAIXA] {q, corpo, zona, ret, invade}                       corpo 3D na faixa da legenda, no fecho ou no link
//   [SOBREPOE] {q, a, b, area, folga, frente, px}               silhuetas que se cobrem na tela, sem contato 3D, com
//                                                              folga de até 10 cm na linha de visão (o kit.py decide
//                                                              o que é toque)
//   [PROVA_ERRO] {q, erro}
// Corpos: os nós marcados com userData.corpo (o palco de argila marca cada peça; a folha que voa da pilha é
// "<peça>:folha"; peça presa a outra, como o carimbo, é um corpo à parte) e, nos objetos sem marca, a raiz do objeto
// (id = objeto.id). A malha pertence ao corpo marcado mais próximo acima dela; no objeto palco (tipo "palco..."),
// malha sem corpo marcado (vitrines, chão, sombras) fica de fora. Também ficam de fora: malha invisível (ela ou um
// ancestral com visible false), sprite, pontos, linhas, material com opacidade < 0,02, o que tiver
// userData.argilaSemSombra, ignoraCaixa, foraDaCaixa ou semColisao (nela ou num ancestral) e a película (plano
// transparente que não escreve profundidade: a face pintada dos cartões e das placas, o selo, a marca do carimbo e o
// vidro da frente do aparelho; o corpo de verdade fica logo atrás dela).
// Contato permitido: userData.encostaEm (id ou lista de ids de corpo) no nó do corpo vale no quadro em que estiver lá;
// os pares de props.prova.colisao.permitidos valem sempre. O par permitido sai marcado, sem contar.
// Teste: OBB por malha (caixa da geometria + matrixWorld) entre malhas de corpos diferentes; nos pares que a OBB
// acusa além da tolerância, interseção triângulo a triângulo pela three-mesh-bvh (só conta o trecho que os planos de
// recorte dos dois materiais deixam ver) e, sem cruzamento de superfície, a malha inteira dentro da outra (malha
// fechada: paridade do raio). Profundidade (aproximada, por cima): a menor sobreposição das projeções dos vértices
// dos dois nos eixos das duas OBBs, nos cruzamentos deles e nas normais do contato.
// Faixas: retângulo do corpo pelos cantos das OBBs projetados e, se ele entra, pelos vértices visíveis.
// Sobreposição na tela: a silhueta de cada corpo rasterizada em células de 4 px (os triângulos projetados, com a
// profundidade mais perto e mais longe por célula); no par que se cobre (64 px² ou mais) e não cruzou nem encostou em
// 3D, a folga é a distância, na linha de visão, entre onde um acaba e o outro começa (a 4ª menor das células em comum).
// Custo limitado (uma passada pelos triângulos): a distância exata entre malhas pela BVH explodia entre superfícies
// quase paralelas (cartão na frente da tela) e derrubou a aba em 05/10.
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import type { ExtendedTriangle } from "three-mesh-bvh";
import { cameraRender } from "../nucleo/pose";
import { matrizesCamera } from "../nucleo/projecao";
import type { CamSt, ConfColisao, Estado, ObjetoProps, PropsKit } from "../nucleo/tipos";

/** até aqui (metros) é encostar, não colidir */
export const TOLERANCIA_PADRAO = 0.0006;
/** marcas de userData que tiram da prova a malha e tudo embaixo do nó marcado */
const MARCAS_FORA = ["argilaSemSombra", "ignoraCaixa", "foraDaCaixa", "semColisao"];
/** opacidade abaixo da qual a malha não conta */
const OPACIDADE_MIN = 0.02;
/** pontos de cruzamento visíveis por par de malhas (bastam pro ponto e a normal do contato) */
const MAX_PONTOS = 96;
/** pares de triângulos testados por par de malhas, no máximo (superfícies coplanares geram pares sem fim) */
const MAX_TESTES = 150000;
/** geometrias com BVH guardada, no máximo */
const MAX_BVH = 200;
/** invasão mínima de faixa que conta (px) */
const MIN_FAIXA_PX = 0.5;
/** px por lado da célula da silhueta (sobreposição na tela) */
const CELULA = 4;
/** sobreposição mínima na tela, em células (4 células = 64 px²) */
const MIN_CELULAS = 4;
/** até onde a folga da sobreposição (na linha de visão) é relatada (metros): mais longe que isso, é só camada */
const FOLGA_MAX = 0.1;

type ItemCena = { objeto: ObjetoProps; m: { raiz: THREE.Object3D } };
type Atributo = THREE.BufferAttribute | THREE.InterleavedBufferAttribute;

/** o que a prova guarda de cada geometria (refeito se a posição ou o índice mudar) */
type Geo = {
  pos: Atributo;
  idx: THREE.BufferAttribute | null;
  versao: string;
  caixa: THREE.Box3;
  plano: boolean;
  bvh: MeshBVH | null;
  fechada: boolean | null;
};

/** caixa orientada no mundo: centro, eixos ortonormais e meias medidas; min e max: a caixa alinhada que a contém */
type Obb = { c: THREE.Vector3; u: THREE.Vector3[]; h: number[]; min: THREE.Vector3; max: THREE.Vector3 };

type Corpo = { id: string; malhas: Malha[]; encosta: string[] };

type Malha = {
  mesh: THREE.Mesh;
  corpo: Corpo;
  geo: Geo;
  obb: Obb;
  nome: string;
  /** planos de recorte do material (no mundo), com o recorte ligado no renderer */
  planos: THREE.Plane[] | null;
  /** clipIntersection false: some o que estiver do lado negativo de qualquer plano */
  uniao: boolean;
};

type Achado = { a: string; b: string; prof: number; tipo: "cruza" | "dentro"; malhas: [string, string]; ponto: THREE.Vector3 };

type Ret = { x0: number; y0: number; x1: number; y1: number };

const V = () => new THREE.Vector3();
const _p = V();
const _q = V();
const _n1 = V();
const _n2 = V();
const _t = V();
const _l = V();
const _linha = new THREE.Line3();
const _inv = new THREE.Matrix4();
const _bParaA = new THREE.Matrix4();
const _nm = new THREE.Matrix3();
const _raio = new THREE.Ray();
const RAIOS = [V().set(0.5773, 0.5774, 0.5775).normalize(), V().set(-0.31, 0.9, 0.307).normalize(), V().set(0.712, -0.2, -0.673).normalize()];

const GEOS = new WeakMap<THREE.BufferGeometry, Geo>();
const COM_BVH: Geo[] = [];
const MUNDO = new WeakMap<THREE.Mesh, { quadro: number; v: Float32Array }>();
const TELA = new WeakMap<THREE.Mesh, { quadro: number; v: Float32Array }>();
let ultimoQ = -1;
let quadroProva = 0;
let ctx2d: CanvasRenderingContext2D | null = null;

const r6 = (x: number) => Math.round(x * 1e6) / 1e6;
const r1 = (x: number) => Math.round(x * 10) / 10;
const mensagem = (e: unknown) => (e instanceof Error ? e.message : String(e));
const emite = (tipo: string, dado: Record<string, unknown>) => console.log(`[${tipo}] ${JSON.stringify(dado)}`);

const versaoDe = (a: Atributo) =>
  (a as THREE.InterleavedBufferAttribute).isInterleavedBufferAttribute ? (a as THREE.InterleavedBufferAttribute).data.version : (a as THREE.BufferAttribute).version;

// ---------- geometria ----------
function geoDe(g: THREE.BufferGeometry): Geo | null {
  const pos = g.getAttribute("position") as Atributo | undefined;
  if (!pos || pos.count < 3) return null;
  const idx = g.getIndex();
  const versao = `${versaoDe(pos)}|${idx ? idx.version : -1}|${pos.count}|${idx ? idx.count : 0}`;
  const velho = GEOS.get(g);
  if (velho && velho.pos === pos && velho.idx === idx && velho.versao === versao) return velho;
  const caixa = new THREE.Box3().setFromBufferAttribute(pos as THREE.BufferAttribute);
  const s = caixa.getSize(V());
  const menor = Math.min(s.x, s.y, s.z);
  const maior = Math.max(s.x, s.y, s.z);
  const geo: Geo = { pos, idx, versao, caixa, plano: menor <= Math.max(1e-9, maior * 1e-4), bvh: null, fechada: null };
  GEOS.set(g, geo);
  return geo;
}

/** BVH numa cópia da geometria (a mesma posição; o índice copiado): a BVH reordena o índice de quem recebe, e a
 *  geometria do render não pode mudar. No máximo MAX_BVH guardadas: o cartão que voa troca de geometria a cada
 *  largura, e a aba não pode acumular uma BVH por quadro (a mais velha sai e é refeita se voltar) */
function bvhDe(geo: Geo, g: THREE.BufferGeometry): MeshBVH {
  if (geo.bvh) return geo.bvh;
  const copia = new THREE.BufferGeometry();
  copia.setAttribute("position", geo.pos);
  if (geo.idx) copia.setIndex(new THREE.BufferAttribute((geo.idx.array as Uint32Array).slice(), 1));
  for (const gr of g.groups) copia.addGroup(gr.start, gr.count, gr.materialIndex);
  copia.setDrawRange(g.drawRange.start, g.drawRange.count);
  geo.bvh = new MeshBVH(copia);
  COM_BVH.push(geo);
  while (COM_BVH.length > MAX_BVH) {
    const velho = COM_BVH.shift();
    if (velho && velho !== geo) velho.bvh = null;
  }
  return geo.bvh;
}

/** malha fechada: vértices fundidos pela posição e nenhuma aresta com um triângulo só */
function fechadaDe(geo: Geo): boolean {
  if (geo.fechada !== null) return geo.fechada;
  const pos = geo.pos;
  const qz = Math.max(1e-12, geo.caixa.min.distanceTo(geo.caixa.max) * 1e-6);
  const ids = new Int32Array(pos.count);
  const mapa = new Map<string, number>();
  for (let i = 0; i < pos.count; i++) {
    const k = `${Math.round(pos.getX(i) / qz)},${Math.round(pos.getY(i) / qz)},${Math.round(pos.getZ(i) / qz)}`;
    let v = mapa.get(k);
    if (v === undefined) {
      v = mapa.size;
      mapa.set(k, v);
    }
    ids[i] = v;
  }
  const N = mapa.size;
  const arestas = new Map<number, number>();
  const conta = (a: number, b: number) => {
    const k = a < b ? a * N + b : b * N + a;
    arestas.set(k, (arestas.get(k) || 0) + 1);
  };
  const idx = geo.idx;
  const n = idx ? idx.count : pos.count;
  let tris = 0;
  for (let i = 0; i + 2 < n; i += 3) {
    const a = ids[idx ? idx.getX(i) : i];
    const b = ids[idx ? idx.getX(i + 1) : i + 1];
    const c = ids[idx ? idx.getX(i + 2) : i + 2];
    if (a === b || b === c || a === c) continue;
    conta(a, b);
    conta(b, c);
    conta(c, a);
    tris++;
  }
  let fechada = tris >= 4;
  arestas.forEach((v) => {
    if (v === 1) fechada = false;
  });
  geo.fechada = fechada;
  return fechada;
}

/** vértices da malha no mundo (uma vez por quadro) */
function mundoDe(ma: Malha): Float32Array {
  const c = MUNDO.get(ma.mesh);
  if (c && c.quadro === quadroProva) return c.v;
  const pos = ma.geo.pos;
  const v = c && c.v.length === pos.count * 3 ? c.v : new Float32Array(pos.count * 3);
  const e = ma.mesh.matrixWorld.elements;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    v[i * 3] = e[0] * x + e[4] * y + e[8] * z + e[12];
    v[i * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
    v[i * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
  }
  MUNDO.set(ma.mesh, { quadro: quadroProva, v });
  return v;
}

// ---------- caixas orientadas ----------
/** OBB no mundo: eixos ortonormais tirados das colunas da matriz (com cisalhamento, a caixa cresce pra conter o
 *  paralelepípedo) */
function obbDe(geo: Geo, mw: THREE.Matrix4): Obb {
  const e = mw.elements;
  const hl = geo.caixa.getSize(V()).multiplyScalar(0.5);
  const col = [V().set(e[0], e[1], e[2]).multiplyScalar(hl.x), V().set(e[4], e[5], e[6]).multiplyScalar(hl.y), V().set(e[8], e[9], e[10]).multiplyScalar(hl.z)];
  const u0 = V().set(e[0], e[1], e[2]);
  if (u0.lengthSq() < 1e-30) u0.set(1, 0, 0);
  u0.normalize();
  const u1 = V().set(e[4], e[5], e[6]);
  u1.addScaledVector(u0, -u1.dot(u0));
  if (u1.lengthSq() < 1e-30) {
    // coluna degenerada: qualquer eixo perpendicular ao primeiro
    u1.set(0, 1, 0);
    if (Math.abs(u0.y) > 0.9) u1.set(1, 0, 0);
    u1.addScaledVector(u0, -u1.dot(u0));
  }
  u1.normalize();
  const u2 = V().crossVectors(u0, u1).normalize();
  const u = [u0, u1, u2];
  const h = u.map((ui) => Math.abs(ui.dot(col[0])) + Math.abs(ui.dot(col[1])) + Math.abs(ui.dot(col[2])));
  const c = geo.caixa.getCenter(V()).applyMatrix4(mw);
  const ext = V().set(
    h[0] * Math.abs(u0.x) + h[1] * Math.abs(u1.x) + h[2] * Math.abs(u2.x),
    h[0] * Math.abs(u0.y) + h[1] * Math.abs(u1.y) + h[2] * Math.abs(u2.y),
    h[0] * Math.abs(u0.z) + h[1] * Math.abs(u1.z) + h[2] * Math.abs(u2.z),
  );
  return { c, u, h, min: c.clone().sub(ext), max: c.clone().add(ext) };
}

/** menor sobreposição das duas OBBs nos 15 eixos do teorema do eixo separador (negativa: separadas) */
function satObb(A: Obb, B: Obb): number {
  _t.subVectors(B.c, A.c);
  let menor = Infinity;
  const eixo = (L: THREE.Vector3): boolean => {
    const len = L.length();
    if (len < 1e-9) return true;
    const lx = L.x / len;
    const ly = L.y / len;
    const lz = L.z / len;
    let ra = 0;
    let rb = 0;
    for (let i = 0; i < 3; i++) {
      ra += A.h[i] * Math.abs(A.u[i].x * lx + A.u[i].y * ly + A.u[i].z * lz);
      rb += B.h[i] * Math.abs(B.u[i].x * lx + B.u[i].y * ly + B.u[i].z * lz);
    }
    const ov = ra + rb - Math.abs(_t.x * lx + _t.y * ly + _t.z * lz);
    if (ov < menor) menor = ov;
    return ov >= 0;
  };
  for (let i = 0; i < 3; i++) if (!eixo(A.u[i])) return menor;
  for (let i = 0; i < 3; i++) if (!eixo(B.u[i])) return menor;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (!eixo(_l.crossVectors(A.u[i], B.u[j]))) return menor;
  return menor;
}

/** profundidade aproximada (por cima): a menor sobreposição das projeções dos vértices dos dois nos eixos dados */
function profundidade(A: Malha, B: Malha, extras: THREE.Vector3[]): number {
  const va = mundoDe(A);
  const vb = mundoDe(B);
  const eixos: THREE.Vector3[] = A.obb.u.concat(B.obb.u);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const c = V().crossVectors(A.obb.u[i], B.obb.u[j]);
      if (c.lengthSq() > 1e-12) eixos.push(c.normalize());
    }
  }
  for (const x of extras) if (x.lengthSq() > 1e-12) eixos.push(x.clone().normalize());
  let menor = Infinity;
  for (const L of eixos) {
    let a0 = Infinity;
    let a1 = -Infinity;
    let b0 = Infinity;
    let b1 = -Infinity;
    for (let i = 0; i < va.length; i += 3) {
      const d = va[i] * L.x + va[i + 1] * L.y + va[i + 2] * L.z;
      if (d < a0) a0 = d;
      if (d > a1) a1 = d;
    }
    for (let i = 0; i < vb.length; i += 3) {
      const d = vb[i] * L.x + vb[i + 1] * L.y + vb[i + 2] * L.z;
      if (d < b0) b0 = d;
      if (d > b1) b1 = d;
    }
    const ov = Math.min(a1 - b0, b1 - a0);
    if (ov < menor) menor = ov;
  }
  return Math.max(0, menor);
}

// ---------- recorte ----------
function visivel(p: THREE.Vector3, ma: Malha): boolean {
  const pl = ma.planos;
  if (!pl) return true;
  if (ma.uniao) {
    for (const x of pl) if (x.distanceToPoint(p) < 0) return false;
    return true;
  }
  for (const x of pl) if (x.distanceToPoint(p) >= 0) return true;
  return false;
}

// ---------- corpos e malhas do quadro ----------
function materiais(m: THREE.Mesh): THREE.Material[] {
  return Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
}

/** a malha entra na prova? (devolve o motivo de fora, ou null) */
function foraPorMaterial(mesh: THREE.Mesh, geo: Geo): string | null {
  const mats = materiais(mesh);
  if (!mats.length) return "sem material";
  if (mats.every((x) => x.visible === false)) return "material invisível";
  let opac = 0;
  for (const x of mats) opac = Math.max(opac, x.transparent ? x.opacity : 1);
  if (opac < OPACIDADE_MIN) return "opacidade";
  if (geo.plano && mats.every((x) => x.transparent && x.depthWrite === false)) return "película";
  return null;
}

function listaIds(x: unknown): string[] {
  if (typeof x === "string") return x ? [x] : [];
  if (Array.isArray(x)) return x.filter((y) => typeof y === "string" && y.length > 0) as string[];
  return [];
}

function nomeDe(mesh: THREE.Mesh): string {
  if (mesh.name) return mesh.name;
  const g = mesh.geometry as THREE.BufferGeometry & { type?: string };
  const pai = mesh.parent && mesh.parent.name ? `${mesh.parent.name}/` : "";
  return `${pai}${g.type || "malha"}`;
}

function coletaCorpos(itens: ItemCena[], recorte: boolean): Corpo[] {
  const corpos = new Map<string, Corpo>();
  const corpoDe = (id: string, no: THREE.Object3D): Corpo => {
    let c = corpos.get(id);
    if (!c) {
      c = { id, malhas: [], encosta: [] };
      corpos.set(id, c);
    }
    for (const e of listaIds(no.userData ? no.userData.encostaEm : undefined)) if (c.encosta.indexOf(e) < 0) c.encosta.push(e);
    return c;
  };
  const visita = (x: THREE.Object3D, corpo: Corpo | null) => {
    if (!x.visible) return;
    const ud = (x.userData || {}) as Record<string, unknown>;
    for (const k of MARCAS_FORA) if (ud[k]) return;
    if (typeof ud.corpo === "string" && ud.corpo) corpo = corpoDe(ud.corpo, x);
    const mesh = x as THREE.Mesh;
    const tipo = x as unknown as { isSprite?: boolean; isPoints?: boolean; isLine?: boolean; isInstancedMesh?: boolean; isSkinnedMesh?: boolean };
    if (mesh.isMesh && corpo && !tipo.isInstancedMesh && !tipo.isSkinnedMesh && !tipo.isSprite) {
      const geo = mesh.geometry ? geoDe(mesh.geometry) : null;
      if (geo && mesh.geometry.drawRange.count > 0 && !foraPorMaterial(mesh, geo)) {
        const mat = materiais(mesh).filter((m) => m.clippingPlanes && m.clippingPlanes.length)[0];
        corpo.malhas.push({
          mesh, corpo, geo, obb: obbDe(geo, mesh.matrixWorld), nome: nomeDe(mesh),
          planos: recorte && mat ? (mat.clippingPlanes as THREE.Plane[]) : null,
          uniao: !(mat && mat.clipIntersection),
        });
      }
    }
    for (const filho of x.children) visita(filho, corpo);
  };
  for (const it of itens) {
    const palco = /^palco/.test(String(it.objeto.tipo || ""));
    visita(it.m.raiz, palco ? null : corpoDe(it.objeto.id, it.m.raiz));
  }
  const out: Corpo[] = [];
  corpos.forEach((c) => {
    if (c.malhas.length) out.push(c);
  });
  return out;
}

// ---------- o par de malhas ----------
type Cruzamento = { n: number; ponto: THREE.Vector3; nA: THREE.Vector3; nB: THREE.Vector3 };

/** cruzamento das superfícies (triângulo a triângulo), só onde os dois materiais deixam ver */
function cruza(A: Malha, B: Malha): Cruzamento {
  const bA = bvhDe(A.geo, A.mesh.geometry);
  const bB = bvhDe(B.geo, B.mesh.geometry);
  const mwA = A.mesh.matrixWorld;
  _inv.copy(mwA).invert();
  _bParaA.multiplyMatrices(_inv, B.mesh.matrixWorld);
  _nm.getNormalMatrix(mwA);
  const r: Cruzamento = { n: 0, ponto: V(), nA: V(), nB: V() };
  let testes = 0;
  bA.bvhcast(bB, _bParaA, {
    intersectsTriangles(t1: ExtendedTriangle, t2: ExtendedTriangle) {
      if (++testes > MAX_TESTES) return true;
      const tri = t1 as unknown as { intersectsTriangle(o: THREE.Triangle, alvo: THREE.Line3, silencio: boolean): boolean };
      if (!tri.intersectsTriangle(t2, _linha, true)) return false;
      // coplanares: a three-mesh-bvh devolve o segmento zerado; o ponto fica no meio do triângulo de A
      if (_linha.start.lengthSq() === 0 && _linha.end.lengthSq() === 0) t1.getMidpoint(_p);
      else _linha.getCenter(_p);
      _p.applyMatrix4(mwA);
      if (!visivel(_p, A) || !visivel(_p, B)) return false;
      r.n++;
      r.ponto.add(_p);
      t1.getNormal(_n1).applyMatrix3(_nm).normalize();
      t2.getNormal(_n2).applyMatrix3(_nm).normalize();
      // normais com o mesmo sentido do acumulado (o sinal não importa pro eixo)
      r.nA.addScaledVector(_n1, _n1.dot(r.nA) < 0 ? -1 : 1);
      r.nB.addScaledVector(_n2, _n2.dot(r.nB) < 0 ? -1 : 1);
      return r.n >= MAX_PONTOS;
    },
  });
  return r;
}

/** o primeiro vértice de B (no mundo) está dentro de A? (A fechada; paridade de três raios, dois votos) */
function contem(A: Malha, B: Malha, saida: THREE.Vector3): boolean {
  if (!fechadaDe(A.geo)) return false;
  const pos = B.geo.pos;
  const i0 = B.geo.idx ? B.geo.idx.getX(0) : 0;
  saida.set(pos.getX(i0), pos.getY(i0), pos.getZ(i0)).applyMatrix4(B.mesh.matrixWorld);
  if (!visivel(saida, A) || !visivel(saida, B)) return false;
  const b = bvhDe(A.geo, A.mesh.geometry);
  _inv.copy(A.mesh.matrixWorld).invert();
  _q.copy(saida).applyMatrix4(_inv);
  const eps = 1e-9 * (1 + A.geo.caixa.min.distanceTo(A.geo.caixa.max));
  let votos = 0;
  for (const d of RAIOS) {
    _raio.origin.copy(_q);
    _raio.direction.copy(d);
    const ds = b.raycast(_raio, THREE.DoubleSide).map((h) => h.distance).sort((x, y) => x - y);
    let n = 0;
    let ult = -Infinity;
    for (const x of ds) {
      if (x - ult > eps) n++;
      ult = x;
    }
    if (n % 2 === 1) votos++;
  }
  return votos >= 2;
}

/** as caixas alinhadas se sobrepõem além da tolerância em x, y e z (sobreposição como no eixo separador: quanto
 *  falta empurrar pra separar; um plano de espessura zero atravessando a outra caixa conta) */
const sobrepoe = (a0: number, a1: number, b0: number, b1: number) => Math.min(a1 - b0, b1 - a0);
const caixasCruzam = (A: Obb, B: Obb, tol: number) =>
  sobrepoe(A.min.x, A.max.x, B.min.x, B.max.x) > tol &&
  sobrepoe(A.min.y, A.max.y, B.min.y, B.max.y) > tol &&
  sobrepoe(A.min.z, A.max.z, B.min.z, B.max.z) > tol;

// ---------- faixas 2D ----------
function medeTexto(texto: string, fonte: string): { w: number; h: number } {
  if (!ctx2d) ctx2d = document.createElement("canvas").getContext("2d");
  if (!ctx2d) return { w: 0, h: 0 };
  ctx2d.font = fonte;
  const m = ctx2d.measureText(texto);
  return { w: m.width, h: (m.fontBoundingBoxAscent || 0) + (m.fontBoundingBoxDescent || 0) };
}

/** retângulos 2D com que o 3D não pode cruzar neste quadro: a faixa da legenda (com frase na tela), o fecho e a
 *  pílula do link (com eles na tela), em px do quadro */
function zonasDoQuadro(st: Estado, t: number, props: PropsKit, conf: ConfColisao): Array<{ zona: string; r: Ret }> {
  const out: Array<{ zona: string; r: Ret }> = [];
  const W = props.largura || 1080;
  if (conf.faixaLegenda !== false && props.legenda && props.narracao) {
    // os mesmos instantes da LegendaApple: entra em p.s - 0,1 (título: -0,3) e sai até p.out - 0,26 + 0,15
    const naTela = (props.narracao.phrases || []).some((p) => {
      const tin = p.title ? -0.3 : p.s - 0.1;
      return t >= tin && t <= p.out - 0.26 + 0.15;
    });
    if (naTela) {
      const L = props.legenda;
      const x0 = typeof L.esquerda === "number" ? L.esquerda : 60;
      const w = typeof L.largura === "number" ? L.largura : 960;
      out.push({ zona: "legenda", r: { x0, y0: L.top, x1: x0 + w, y1: L.top + L.altura } });
    }
  }
  const F = props.fecho;
  if (conf.faixaFecho !== false && F) {
    if (st.ui.assina > 0.01) {
      // a fila "Vai," + logo, centrada, com a escala do Fecho em volta do meio da caixa
      const L = F.layout;
      const vai = medeTexto("Vai,", `800 ${L.tamanhoVai}px Sora`).w - 0.035 * L.tamanhoVai * 4;
      const w = Math.max(0, vai) + L.gap + L.larguraLogo;
      const s = 0.86 + 0.14 * st.ui.assina;
      const cy = L.top + L.altura / 2;
      out.push({ zona: "fecho", r: { x0: W / 2 - (w * s) / 2, y0: cy - (L.altura * s) / 2, x1: W / 2 + (w * s) / 2, y1: cy + (L.altura * s) / 2 } });
    }
    if (st.ui.link > 0.01 && F.link) {
      // a pílula do LinkBio: texto em 800, espaçamento 0,06 em, padding 16k x 38k, escala 0,7 + 0,3 link
      const lk = F.link;
      const k = lk.tamanho / 34;
      const m = medeTexto(lk.texto, `800 ${lk.tamanho}px Sora`);
      const w = m.w + 0.06 * lk.tamanho * Array.from(lk.texto).length + 2 * 38 * k;
      const h = (m.h > 0 ? m.h : lk.tamanho * 1.26) + 2 * 16 * k;
      const s = 0.7 + 0.3 * st.ui.link;
      const cy = lk.top + h / 2;
      out.push({ zona: "link", r: { x0: W / 2 - (w * s) / 2, y0: cy - (h * s) / 2, x1: W / 2 + (w * s) / 2, y1: cy + (h * s) / 2 } });
    }
  }
  return out;
}

/** ponto do mundo em px do quadro (out[0], out[1]) e 1/profundidade (out[2], se couber); false atrás da câmera */
type Projeta = (x: number, y: number, z: number, out: number[]) => boolean;

function projetor(cam: CamSt, props: PropsKit): Projeta {
  const W = props.largura || 1080;
  const H = props.altura || 1920;
  const C = matrizesCamera(cam, { largura: W, altura: H });
  const e = new THREE.Matrix4().multiplyMatrices(C.projecao, C.vista).elements;
  return (x, y, z, out) => {
    // w da projeção perspectiva = distância no eixo da câmera
    const w = e[3] * x + e[7] * y + e[11] * z + e[15];
    if (w <= 1e-9) return false;
    out[0] = (((e[0] * x + e[4] * y + e[8] * z + e[12]) / w + 1) / 2) * W;
    out[1] = ((1 - (e[1] * x + e[5] * y + e[9] * z + e[13]) / w) / 2) * H;
    if (out.length > 2) out[2] = 1 / w;
    return true;
  };
}

const retVazio = (): Ret => ({ x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
const poe = (r: Ret, p: number[]) => {
  if (p[0] < r.x0) r.x0 = p[0];
  if (p[0] > r.x1) r.x1 = p[0];
  if (p[1] < r.y0) r.y0 = p[1];
  if (p[1] > r.y1) r.y1 = p[1];
};
const invasao = (a: Ret, b: Ret): [number, number] => [Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)];

/** retângulo do corpo pelos cantos das OBBs (rápido, por cima) */
function retCantos(c: Corpo, pj: Projeta): Ret {
  const r = retVazio();
  const out = [0, 0];
  for (const ma of c.malhas) {
    const o = ma.obb;
    for (let s = 0; s < 8; s++) {
      const a = s & 1 ? 1 : -1;
      const b = s & 2 ? 1 : -1;
      const d = s & 4 ? 1 : -1;
      const x = o.c.x + a * o.h[0] * o.u[0].x + b * o.h[1] * o.u[1].x + d * o.h[2] * o.u[2].x;
      const y = o.c.y + a * o.h[0] * o.u[0].y + b * o.h[1] * o.u[1].y + d * o.h[2] * o.u[2].y;
      const z = o.c.z + a * o.h[0] * o.u[0].z + b * o.h[1] * o.u[1].z + d * o.h[2] * o.u[2].z;
      if (pj(x, y, z, out)) poe(r, out);
    }
  }
  return r;
}

/** vértices da malha em px do quadro e 1/profundidade (três números por vértice), uma vez por quadro (NaN: atrás da
 *  câmera ou cortado pelo recorte) */
function telaDe(ma: Malha, pj: Projeta): Float32Array {
  const c = TELA.get(ma.mesh);
  if (c && c.quadro === quadroProva) return c.v;
  const w = mundoDe(ma);
  const n = w.length / 3;
  const v = c && c.v.length === n * 3 ? c.v : new Float32Array(n * 3);
  const out = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    let ok = true;
    if (ma.planos) {
      _p.set(w[i * 3], w[i * 3 + 1], w[i * 3 + 2]);
      ok = visivel(_p, ma);
    }
    if (ok && pj(w[i * 3], w[i * 3 + 1], w[i * 3 + 2], out)) {
      v[i * 3] = out[0];
      v[i * 3 + 1] = out[1];
      v[i * 3 + 2] = out[2];
    } else {
      v[i * 3] = NaN;
      v[i * 3 + 1] = NaN;
      v[i * 3 + 2] = NaN;
    }
  }
  TELA.set(ma.mesh, { quadro: quadroProva, v });
  return v;
}

/** retângulo do corpo pelos vértices que os planos de recorte deixam ver (o contorno de verdade) */
function retVertices(c: Corpo, pj: Projeta): Ret {
  const r = retVazio();
  const out = [0, 0];
  for (const ma of c.malhas) {
    const v = telaDe(ma, pj);
    for (let i = 0; i < v.length; i += 3) {
      if (Number.isNaN(v[i])) continue;
      out[0] = v[i];
      out[1] = v[i + 1];
      poe(r, out);
    }
  }
  return r;
}

// ---------- sobreposição na tela sem contato 3D ----------
/** silhueta do corpo em células de CELULA px, com a profundidade (distância no eixo da câmera, metros) mais perto e
 *  mais longe dele em cada célula: os triângulos projetados, amostrados no centro da célula (o triângulo menor que uma
 *  célula marca a célula do centro dele). Custo limitado: uma passada pelos triângulos, sem busca entre malhas. */
type Mascara = { x0: number; y0: number; w: number; h: number; perto: Float32Array; longe: Float32Array };

function mascaraDe(c: Corpo, pj: Projeta, r: Ret, W: number, H: number): Mascara | null {
  const wc = Math.ceil(W / CELULA);
  const hc = Math.ceil(H / CELULA);
  const x0 = Math.max(0, Math.floor(r.x0 / CELULA));
  const y0 = Math.max(0, Math.floor(r.y0 / CELULA));
  const x1 = Math.min(wc - 1, Math.floor(r.x1 / CELULA));
  const y1 = Math.min(hc - 1, Math.floor(r.y1 / CELULA));
  if (!(x1 >= x0 && y1 >= y0)) return null;
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const perto = new Float32Array(w * h).fill(Infinity);
  const longe = new Float32Array(w * h).fill(-Infinity);
  const poeZ = (cx: number, cy: number, z: number) => {
    const i = Math.floor(cx);
    const j = Math.floor(cy);
    if (i < 0 || j < 0 || i >= w || j >= h || !(z > 0)) return;
    const k = j * w + i;
    if (z < perto[k]) perto[k] = z;
    if (z > longe[k]) longe[k] = z;
  };
  for (const ma of c.malhas) {
    const v = telaDe(ma, pj);
    const idx = ma.geo.idx;
    const n = idx ? idx.count : ma.geo.pos.count;
    for (let k = 0; k + 2 < n; k += 3) {
      const a = (idx ? idx.getX(k) : k) * 3;
      const b = (idx ? idx.getX(k + 1) : k + 1) * 3;
      const d = (idx ? idx.getX(k + 2) : k + 2) * 3;
      const ax = v[a] / CELULA - x0;
      const ay = v[a + 1] / CELULA - y0;
      const bx = v[b] / CELULA - x0;
      const by = v[b + 1] / CELULA - y0;
      const dx = v[d] / CELULA - x0;
      const dy = v[d + 1] / CELULA - y0;
      if (Number.isNaN(ax) || Number.isNaN(bx) || Number.isNaN(dx)) continue;
      const ia = v[a + 2];
      const ib = v[b + 2];
      const id = v[d + 2];
      // o centro do triângulo sempre marca (pega o triângulo fino ou menor que a célula)
      poeZ((ax + bx + dx) / 3, (ay + by + dy) / 3, 3 / (ia + ib + id));
      const i0 = Math.max(0, Math.floor(Math.min(ax, bx, dx)));
      const i1 = Math.min(w - 1, Math.floor(Math.max(ax, bx, dx)));
      const j0 = Math.max(0, Math.floor(Math.min(ay, by, dy)));
      const j1 = Math.min(h - 1, Math.floor(Math.max(ay, by, dy)));
      if (i1 < i0 || j1 < j0 || (i0 === i1 && j0 === j1)) continue;
      const area = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
      if (Math.abs(area) < 1e-9) continue;
      for (let j = j0; j <= j1; j++) {
        const py = j + 0.5;
        for (let i = i0; i <= i1; i++) {
          const px = i + 0.5;
          // coordenadas baricêntricas na tela; a profundidade vem de 1/w (linear na tela)
          const la = ((bx - px) * (dy - py) - (by - py) * (dx - px)) / area;
          const lb = ((dx - px) * (ay - py) - (dy - py) * (ax - px)) / area;
          const ld = 1 - la - lb;
          if (la < -1e-9 || lb < -1e-9 || ld < -1e-9) continue;
          const z = 1 / (la * ia + lb * ib + ld * id);
          const kk = j * w + i;
          if (z < perto[kk]) perto[kk] = z;
          if (z > longe[kk]) longe[kk] = z;
        }
      }
    }
  }
  return { x0, y0, w, h, perto, longe };
}

/** as células em comum das duas silhuetas: quantas, o meio delas (px), a folga ao longo da linha de visão (onde a
 *  profundidade de um acaba e a do outro começa; a k-ésima menor, pra célula solta na borda não decidir) e se A fica
 *  na frente na maior parte delas */
function emComum(A: Mascara, B: Mascara, k: number): { n: number; px: number; py: number; folga: number; frenteA: boolean } {
  const x0 = Math.max(A.x0, B.x0);
  const y0 = Math.max(A.y0, B.y0);
  const x1 = Math.min(A.x0 + A.w, B.x0 + B.w);
  const y1 = Math.min(A.y0 + A.h, B.y0 + B.h);
  const menores: number[] = [];
  let n = 0;
  let sx = 0;
  let sy = 0;
  let frente = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const ia = (y - A.y0) * A.w + (x - A.x0);
      const ib = (y - B.y0) * B.w + (x - B.x0);
      if (A.perto[ia] === Infinity || B.perto[ib] === Infinity) continue;
      n++;
      sx += x;
      sy += y;
      frente += A.perto[ia] < B.perto[ib] ? 1 : -1;
      const g = Math.max(B.perto[ib] - A.longe[ia], A.perto[ia] - B.longe[ib]);
      if (menores.length < k || g < menores[menores.length - 1]) {
        menores.push(g);
        menores.sort((p, q) => p - q);
        if (menores.length > k) menores.pop();
      }
    }
  }
  const folga = menores.length ? menores[menores.length - 1] : Infinity;
  return { n, px: n ? (sx / n + 0.5) * CELULA : 0, py: n ? (sy / n + 0.5) * CELULA : 0, folga: Math.max(0, folga), frenteA: frente > 0 };
}

// ---------- a prova do quadro ----------
/** testa o quadro e escreve as linhas no console (uma vez por quadro e por aba) */
export function provaColisao(o: { itens: ItemCena[]; st: Estado; t: number; props: PropsKit; gl: THREE.WebGLRenderer }): void {
  const props = o.props;
  const fps = props.fps || 30;
  const q = Math.round(o.t * fps);
  if (q === ultimoQ) return;
  ultimoQ = q;
  const ini = performance.now();
  try {
    const bruto = props.prova ? props.prova.colisao : undefined;
    const conf: ConfColisao = bruto && typeof bruto === "object" ? bruto : {};
    const tol = typeof conf.tolerancia === "number" && conf.tolerancia >= 0 ? conf.tolerancia : TOLERANCIA_PADRAO;
    const permitidos = new Set<string>();
    for (const p of conf.permitidos || []) if (Array.isArray(p) && p.length >= 2) permitidos.add([String(p[0]), String(p[1])].sort().join("|"));
    quadroProva++;
    const corpos = coletaCorpos(o.itens, !!(o.gl && o.gl.localClippingEnabled));
    const malhas: Malha[] = [];
    for (const c of corpos) for (const m of c.malhas) malhas.push(m);
    const camR = cameraRender(o.st.cam, o.t, props); // a câmera do quadro, com a deriva (a mesma do Cena3DKit)
    const pj = projetor(camR, props);
    const W = props.largura || 1080;
    const H = props.altura || 1920;
    // retângulo de cada corpo na tela pelos vértices visíveis (preguiçoso: faixa e sobreposição usam)
    const rets: Array<Ret | undefined> = corpos.map(() => undefined);
    const retDe = (i: number): Ret => {
      let r = rets[i];
      if (!r) {
        r = retVertices(corpos[i], pj);
        rets[i] = r;
      }
      return r;
    };

    // ---- 3D contra 3D ----
    const achados = new Map<string, Achado>();
    let pares = 0;
    const dentroEm = V();
    for (let i = 0; i < malhas.length; i++) {
      const A = malhas[i];
      for (let j = i + 1; j < malhas.length; j++) {
        const B = malhas[j];
        if (A.corpo === B.corpo || !caixasCruzam(A.obb, B.obb, tol)) continue;
        const ov = satObb(A.obb, B.obb);
        if (!(ov > tol)) continue;
        pares++;
        const r = cruza(A, B);
        let tipo: Achado["tipo"] | null = null;
        const ponto = V();
        if (r.n > 0) {
          tipo = "cruza";
          ponto.copy(r.ponto).divideScalar(r.n);
        } else if (contem(A, B, dentroEm) || contem(B, A, dentroEm)) {
          tipo = "dentro";
          ponto.copy(dentroEm);
        }
        if (!tipo) continue;
        const extras: THREE.Vector3[] = [];
        if (r.n > 0 && r.nA.length() > 0.3 * r.n) extras.push(r.nA);
        if (r.n > 0 && r.nB.length() > 0.3 * r.n) extras.push(r.nB);
        const prof = Math.min(ov, profundidade(A, B, extras));
        const [a, b] = A.corpo.id < B.corpo.id ? [A, B] : [B, A];
        const chave = `${a.corpo.id}|${b.corpo.id}`;
        const velho = achados.get(chave);
        if (!velho || prof > velho.prof) achados.set(chave, { a: a.corpo.id, b: b.corpo.id, prof, tipo, malhas: [a.nome, b.nome], ponto });
      }
    }
    const porId = new Map<string, Corpo>();
    for (const c of corpos) porId.set(c.id, c);
    const xy = [0, 0];
    achados.forEach((ac, chave) => {
      const ca = porId.get(ac.a);
      const cb = porId.get(ac.b);
      const permitido = permitidos.has(chave)
        ? "cena"
        : (ca && ca.encosta.indexOf(ac.b) >= 0) || (cb && cb.encosta.indexOf(ac.a) >= 0)
          ? "encostaEm"
          : null;
      if (ac.prof > tol) {
        const px = pj(ac.ponto.x, ac.ponto.y, ac.ponto.z, xy) ? [r1(xy[0]), r1(xy[1])] : null;
        const dado: Record<string, unknown> = { q, a: ac.a, b: ac.b, prof: r6(ac.prof), tipo: ac.tipo, malhas: ac.malhas, px };
        if (permitido) dado.permitido = permitido;
        emite("COLISAO", dado);
      } else {
        emite("CONTATO", { q, a: ac.a, b: ac.b, prof: r6(ac.prof), tipo: ac.tipo });
      }
    });

    // ---- 3D contra as faixas 2D ----
    const zonas = zonasDoQuadro(o.st, o.t, props, conf);
    if (zonas.length) {
      for (let i = 0; i < corpos.length; i++) {
        const c = corpos[i];
        const r0 = retCantos(c, pj);
        for (const z of zonas) {
          const [dx0, dy0] = invasao(r0, z.r);
          if (!(dx0 > MIN_FAIXA_PX && dy0 > MIN_FAIXA_PX)) continue;
          const rv = retDe(i);
          const [dx, dy] = invasao(rv, z.r);
          if (!(dx > MIN_FAIXA_PX && dy > MIN_FAIXA_PX)) continue;
          emite("FAIXA", { q, corpo: c.id, zona: z.zona, ret: [r1(rv.x0), r1(rv.y0), r1(rv.x1), r1(rv.y1)], invade: [r1(dx), r1(dy)] });
        }
      }
    }

    const t3d = performance.now();

    // ---- sobreposição na tela sem contato 3D (o "toque aparente": um passa na frente do outro quase encostando) ----
    let sobre = 0;
    if (conf.aparente !== false) {
      const masc: Array<Mascara | null | undefined> = corpos.map(() => undefined);
      const mascDe = (i: number) => {
        if (masc[i] === undefined) masc[i] = mascaraDe(corpos[i], pj, retDe(i), W, H);
        return masc[i];
      };
      for (let i = 0; i < corpos.length; i++) {
        for (let j = i + 1; j < corpos.length; j++) {
          const [dx, dy] = invasao(retDe(i), retDe(j));
          if (!(dx > 0 && dy > 0)) continue;
          const ca = corpos[i];
          const cb = corpos[j];
          const [x, y] = ca.id < cb.id ? [ca, cb] : [cb, ca];
          const chave = `${x.id}|${y.id}`;
          // o que já cruzou ou encostou em 3D neste quadro, ou é permitido, fica de fora
          if (achados.has(chave) || permitidos.has(chave) || x.encosta.indexOf(y.id) >= 0 || y.encosta.indexOf(x.id) >= 0) continue;
          const ma = mascDe(i);
          const mb = mascDe(j);
          if (!ma || !mb) continue;
          const cm = emComum(ma, mb, MIN_CELULAS);
          if (cm.n < MIN_CELULAS) continue;
          // longe (camada) ou colado na linha de visão (contato de verdade, abaixo da tolerância): não é toque aparente
          if (!(cm.folga < FOLGA_MAX) || cm.folga <= tol) continue;
          emite("SOBREPOE", { q, a: x.id, b: y.id, area: cm.n * CELULA * CELULA, folga: r6(cm.folga), frente: cm.frenteA ? ca.id : cb.id, px: [r1(cm.px), r1(cm.py)] });
          sobre++;
        }
      }
    }
    const tSobre = performance.now();
    const lista: Record<string, number> = {};
    for (const c of corpos) lista[c.id] = c.malhas.length;
    emite("PROVA", {
      q, t: r6(o.t), corpos: lista, malhas: malhas.length, pares, sobre, zonas: zonas.map((z) => z.zona),
      ms: r1(tSobre - ini), ms3d: r1(t3d - ini), msSobre: r1(tSobre - t3d),
    });
  } catch (e) {
    emite("PROVA_ERRO", { q, erro: mensagem(e) });
  }
}
