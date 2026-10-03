// Extensão "tradicional-vs-legalizai" do kit de motion: o objeto "palco-tvl" (as vitrines do carrossel presas ao
// mundo, a luz do carrossel, a argila do lado Tradicional, os cartões que saem da tela, a fileira de placas, a
// moeda, o sino e as sombras) e a camada 2D "pilula-comenta". Contrato: KIT/DESENHO.md, seção 4.10.
// O render só LÊ o estado (st.canais.palco, st.canais["p:<peça>"], st.obj do aparelho e st.cam): quem anima são as
// batidas (batidas.ts). Os objetos de argila e as texturas vêm do carrossel de 05/10 (src/carrossel-2026-10-05),
// só importados.
import React from "react";
import * as THREE from "three";
import { esperaSora } from "../../../carrossel-2026-10-05/fonte";
import { SombraContato } from "../../../carrossel-2026-10-05/cena/sombra";
import { texSombraBlob } from "../../../carrossel-2026-10-05/cena/texturas";
import { cameraRender, matrizRig, poseRender } from "../../nucleo/pose";
import { desprojeta, matrizesCamera, projetaPonto } from "../../nucleo/projecao";
import type { Estado, ObjetoProps } from "../../nucleo/tipos";
import type { CamadaExtensao, FabricaObjeto, RenderExtensao } from "../../render/tipos-render";
import {
  MESA, P, TIPO_PALCO, centroPlaca, larguraNaTela, larguraNoMundo, noMundo, num, palcoDe, pontoNaTela, pousoDe,
  type Canal, type ConteudoPalco, type Palco,
} from "./comum";
import { criaVitrines, mascaraVitrine, novaMascara } from "./palco/vitrines";
import { cfgLuz, criaChave, criaVarreduraFria, instalaLuz } from "./palco/luz";
import { criaPeca, criaPlanos, poseFolhaVoo, type PecaFria } from "./palco/pecas";
import { CartaoTela, LARGURA_CARTAO, MOEDA_RAIO, PLACA, criaFaisca, criaMoeda, criaPlaca, criaSino, texEntregue, texPlaca, type OpCartao } from "./palco/cartoes";

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const V = () => new THREE.Vector3();

type Pouso = { x: number; y: number; z: number; s: number };

/** peça do lado quente que sai da tela: a pose colada na tela (pelo aparelho do quadro) e a pose de pouso */
type PecaQuente = {
  id: string;
  raiz: THREE.Object3D;
  blob: THREE.Mesh | null;
  aplica(c: Canal, t: number, ap: PoseAparelho): void;
};

type PoseAparelho = { matriz: THREE.Matrix4; q: THREE.Quaternion; escala: number };

const _p = V();
const _q = new THREE.Quaternion();
const _qa = new THREE.Quaternion();
const _e = new THREE.Euler();
const ARCO = new THREE.Vector3(0, 1, 0.4).normalize();
const ORIGEM = new THREE.Vector3();

/** junta a pose colada (na tela) com a de pouso por k = 1 - prende, com o arco do voo */
function posePresa(raiz: THREE.Object3D, ap: PoseAparelho, u: number, v: number, sTela: number, livre: { p: THREE.Vector3; q: THREE.Quaternion; s: number }, prende: number, arco: number) {
  const k = 1 - clamp01(prende);
  const loc = pontoNaTela(u, v, 0.0009);
  _p.set(loc[0], loc[1], loc[2]).applyMatrix4(ap.matriz);
  raiz.position.copy(_p).lerp(livre.p, k).addScaledVector(ARCO, arco * Math.sin(Math.PI * k));
  _qa.copy(ap.q);
  raiz.quaternion.copy(_qa).slerp(livre.q, k);
  const s = lerp(sTela * ap.escala, livre.s, k);
  raiz.scale.setScalar(Math.max(0.0001, s));
}

// ---------- a fábrica do palco ----------
export const fabricaPalco: FabricaObjeto = {
  arquivos(o, props) {
    const pal = palcoDe(props.objetos, o.id);
    const imagens: string[] = [];
    for (const k of Object.keys(pal.pecas)) {
      const tela = (pal.pecas[k].opcoes || {}).tela;
      if (typeof tela === "string") {
        const tl = props.telas[tela];
        if (!tl) throw new Error(`palco: a peça ${k} pede a tela "${tela}", que a cena não tem`);
        if (imagens.indexOf(tl.arquivo) < 0) imagens.push(tl.arquivo);
      }
    }
    return { imagens };
  },
  async cria({ objeto: o, props, recursos, gl }) {
    // as texturas em canvas (formulários, cartão do imposto, pílula Entregue) só pintam com a Sora carregada
    await esperaSora([500, 600, 700, 800]);
    const pal: Palco = palcoDe(props.objetos, o.id);
    const cont = (o.conteudo || {}) as ConteudoPalco;
    const apProps = props.objetos.filter((x) => x.id === pal.aparelho)[0] as ObjetoProps | undefined;
    if (!apProps) throw new Error(`palco: o aparelho "${pal.aparelho}" não está na cena`);
    gl.localClippingEnabled = true;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.VSMShadowMap;

    const raiz = new THREE.Group();
    raiz.name = "palco-tvl";
    const semSombra: THREE.Object3D[] = [];

    // vitrines e máscara das sombras
    const mascara = novaMascara();
    const vit = criaVitrines(mascara);
    raiz.add(vit.malha);
    semSombra.push(vit.malha);

    // luz do carrossel
    const cfg = cfgLuz(cont.luz);
    const chave = criaChave(cfg);
    raiz.add(chave, chave.target);
    const varre = criaVarreduraFria();
    raiz.add(varre);
    instalaLuz(raiz, cfg);

    // chão invisível que recebe a sombra suave da chave (VSM), preso aos painéis. Só embaixo da vitrine fria (a
    // sombra alta do carimbo atravessaria o vão e mancharia a quente); na fusão ele se estende pro painel todo.
    const CHAO_ESQ = -0.6;
    const chao = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1.4).translate(0.5, 0, 0),
      mascaraVitrine(new THREE.ShadowMaterial({ opacity: 0.1, color: new THREE.Color("#2A2018"), depthWrite: false }), mascara),
    );
    chao.rotation.x = -Math.PI / 2;
    chao.position.set(CHAO_ESQ, MESA + 0.0001, 0);
    chao.receiveShadow = true;
    chao.renderOrder = 1;
    raiz.add(chao);
    semSombra.push(chao);

    // sombra de contato (a do carrossel), presa aos painéis; o passe roda logo antes de o plano ser desenhado
    const sombra = new SombraContato({ largura: 0.42, profundidade: 0.32, altura: 0.12, res: 1024, blur: 2.0, escuridao: 1.35, opacidade: 0.6 }, (m) => mascaraVitrine(m, mascara));
    sombra.grupo.position.set(0, MESA, 0);
    raiz.add(sombra.grupo);
    const planoSombra = sombra.grupo.children[0] as THREE.Mesh;
    let passe = false;
    let cena: THREE.Scene | null = null;
    const ocultar: THREE.Object3D[] = [];
    planoSombra.onBeforeRender = (renderer, scene) => {
      if (passe) return;
      passe = true;
      try {
        if (cena !== scene) {
          cena = scene as THREE.Scene;
          ocultar.length = 0;
          for (const x of semSombra) ocultar.push(x);
          // a poeira do kit (pontos) e o fundo de papel ficam fora do passe
          scene.traverse((x) => {
            if ((x as THREE.Points).isPoints) ocultar.push(x);
          });
        }
        sombra.render(renderer, scene as THREE.Scene, ocultar);
      } finally {
        passe = false;
      }
    };

    // ---------- peças frias ----------
    const planos = criaPlanos(pal.vitrine.borda, pal.vitrine.vao);
    const frias: Record<string, PecaFria> = {};
    const idsFrios = Object.keys(pal.pecas).filter((k) => pal.pecas[k].lado === "frio");
    idsFrios.sort((a, b) => (pal.pecas[a].pai ? 1 : 0) - (pal.pecas[b].pai ? 1 : 0));
    for (const id of idsFrios) {
      const pf = criaPeca(id, pal.pecas[id], planos, frias);
      frias[id] = pf;
      if (!pal.pecas[id].pai) raiz.add(pf.raiz);
      if (pf.voo) raiz.add(pf.voo.holder);
    }

    // ---------- peças quentes ----------
    const blobTex = texSombraBlob();
    const novaBlob = () => {
      const b = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        mascaraVitrine(new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }), mascara),
      );
      b.rotation.x = -Math.PI / 2;
      b.renderOrder = 1;
      raiz.add(b);
      semSombra.push(b);
      return b;
    };
    const quentes: PecaQuente[] = [];
    let texPlacas: THREE.Texture | null = null;
    let texSelo: THREE.Texture | null = null;
    let moedaRaiz: THREE.Object3D | null = null;
    const caixa = new THREE.Box3();
    const poeBlob = (b: THREE.Mesh | null, alvo: THREE.Object3D, vis: number) => {
      if (!b) return;
      if (!alvo.visible || vis <= 0.001) {
        b.visible = false;
        return;
      }
      caixa.setFromObject(alvo);
      if (caixa.isEmpty()) {
        b.visible = false;
        return;
      }
      const alt = Math.max(0, caixa.min.y - MESA);
      const larg = Math.max(0.01, caixa.max.x - caixa.min.x) * (1.15 + alt * 6);
      const prof = Math.max(0.03, caixa.max.z - caixa.min.z + 0.02) * (1.2 + alt * 6);
      b.position.set((caixa.min.x + caixa.max.x) / 2 + alt * 0.25, MESA + 0.0004, (caixa.min.z + caixa.max.z) / 2 - alt * 0.3);
      b.scale.set(larg, prof, 1);
      (b.material as THREE.MeshBasicMaterial).opacity = Math.max(0.1, Math.min(0.2, 0.2 - alt * 0.6)) * Math.min(1, vis);
      b.visible = true;
    };

    const livreDe = (p: Pouso, def: { rx: number; ry: number; rz: number }) => ({ p: new THREE.Vector3(p.x, p.y, p.z), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(def.rx, def.ry, def.rz, "YXZ")), s: p.s });

    for (const id of Object.keys(pal.pecas)) {
      const def = pal.pecas[id];
      if (def.lado !== "quente") continue;
      const op = (def.opcoes || {}) as Record<string, unknown>;
      if (def.tipo === "cartao-app" || def.tipo === "cartao-imposto") {
        const tela = String(op.tela);
        const img = recursos.imagem(props.telas[tela].arquivo);
        const reg = op.regiao as { x: number; y: number; w: number; h: number };
        if (!reg || !(reg.w > 0) || !(reg.h > 0)) throw new Error(`palco: o cartão ${id} precisa de opcoes.regiao {x, y, w, h} (a vaga na tela)`);
        const opc: OpCartao = {
          regiao: reg, raio: num(op.raio, 46), raioBaixo: typeof op.raioBaixo === "number" ? op.raioBaixo : undefined,
          compacto: typeof op.compacto === "number" ? op.compacto : undefined,
          raioCompacto: typeof op.raioCompacto === "number" ? op.raioCompacto : undefined,
          corCorpo: String(op.corCorpo || "#FFFFFF"), borda: typeof op.borda === "string" ? op.borda : undefined,
          bordaSo: op.bordaSo === "voo" ? "voo" : "sempre",
        };
        if (def.tipo === "cartao-imposto") {
          opc.imposto = { valor: num(op.valor, 0), rotulo: String(op.rotulo || ""), retorno: String(op.retorno || ""), corBotao: String(op.corBotao || "#B83D1C") };
        }
        const cartao = new CartaoTela(img, opc);
        const r0 = new THREE.Group();
        r0.add(cartao.grupo);
        raiz.add(r0);
        semSombra.push(r0);
        // pouso: o centro e a largura do cartão compacto, em px da câmera de repouso
        const pouso = pousoDe(pal, op.pouso as { px: number; py: number; z: number; larguraPx: number }, cartao.wCompacto * cartao.k);
        const blob = novaBlob();
        const u = reg.x + reg.w / 2;
        const v = reg.y + reg.h / 2;
        const sTela = larguraNaTela(reg.w) / LARGURA_CARTAO;
        quentes.push({
          id, raiz: r0, blob,
          aplica(c, _t, ap) {
            const vis = num(c.vis, 0);
            r0.visible = vis > 0.001;
            if (!r0.visible) return;
            const af = num(c.afunda, 0);
            const livre = livreDe(
              { x: pouso.x + num(c.x, 0), y: pouso.y + num(c.y, 0), z: pouso.z + num(c.z, 0) - 0.0035 * af, s: pouso.s * num(c.s, 1) },
              { rx: def.rx + num(c.rx, 0) + 0.06 * af, ry: def.ry + num(c.ry, 0), rz: def.rz + num(c.rz, 0) },
            );
            const prende = num(c.prende, 1);
            posePresa(r0, ap, u, v, sTela, livre, prende, num(c.arco, 0));
            const ach = num(c.achata, 0);
            if (ach !== 0) r0.scale.set(r0.scale.x * (1 + ach * 0.5), r0.scale.y * (1 - ach), r0.scale.z);
            cartao.pinta(c, prende);
          },
        });
        continue;
      }
      if (def.tipo === "placa") {
        const i = num(op.ordem, 0);
        if (!texPlacas) texPlacas = texPlaca();
        if (op.entregue === true && !texSelo) texSelo = texEntregue();
        const { grupo: g, selo } = criaPlaca(texPlacas, op.entregue === true ? texSelo : null);
        const r0 = new THREE.Group();
        r0.add(g);
        raiz.add(r0);
        semSombra.push(r0);
        const cp = centroPlaca(pal, i);
        const w0 = noMundo(cp, pal.camRepouso);
        const sL = larguraNoMundo(cp, pal.fileira.larguraPx, pal.camRepouso) / PLACA.w;
        // saem da metade de baixo da tela das Declarações (em branco, abaixo do card da apuração)
        const u = 290 + i * 237;
        const v = 1560;
        const sTela = larguraNaTela(200) / PLACA.w;
        const blob = novaBlob();
        quentes.push({
          id, raiz: r0, blob,
          aplica(c, _t, ap) {
            const vis = num(c.vis, 0);
            r0.visible = vis > 0.001;
            if (!r0.visible) return;
            const sa = num(c.salto, 0);
            const livre = livreDe(
              { x: w0.x + num(c.x, 0) + 0.002 * sa, y: w0.y + num(c.y, 0) + 0.012 * sa, z: w0.z + num(c.z, 0) + 0.012 * sa, s: sL * num(c.s, 1) },
              { rx: def.rx + num(c.rx, 0), ry: def.ry + num(c.ry, 0) + 0.14 * sa, rz: def.rz + num(c.rz, 0) - 0.244 * sa },
            );
            posePresa(r0, ap, u, v, sTela, livre, num(c.prende, 1), 0.004);
            if (selo) {
              const ke = clamp01(num(c.entregue, 0));
              selo.visible = ke > 0.001;
              // a pílula entra com um pulo curto (passa 8% e assenta)
              const pop = ke < 0.7 ? (ke / 0.7) * 1.08 : 1.08 - 0.08 * ((ke - 0.7) / 0.3);
              selo.scale.setScalar(Math.max(0.001, pop));
            }
          },
        });
        continue;
      }
      if (def.tipo === "moeda") {
        const { grupo, reflexo } = criaMoeda();
        const r0 = new THREE.Group();
        r0.add(grupo);
        raiz.add(r0);
        semSombra.push(r0);
        moedaRaiz = r0;
        const blob = novaBlob();
        // pouso em px da câmera de repouso (à esquerda e acima da fileira); sai da tela pela origem (px da tela)
        const po = (op.pouso || { px: 650, py: 1056, z: 0.075 }) as { px: number; py: number; z: number };
        const fim = (() => {
          const w = noMundo(po, pal.camRepouso);
          return new THREE.Vector3(w.x, w.y, w.z);
        })();
        const org = (op.origem || { u: 1010, v: 1400 }) as { u: number; v: number };
        const sTela = larguraNaTela(150) / (2 * MOEDA_RAIO);
        const p0 = V();
        const p1 = V();
        quentes.push({
          id, raiz: r0, blob,
          aplica(c, _t, ap) {
            const vis = num(c.vis, 0);
            r0.visible = vis > 0.001;
            if (!r0.visible) return;
            const k = clamp01(num(c.k, 0));
            const loc = pontoNaTela(org.u, org.v, 0.0012);
            p0.set(loc[0], loc[1], loc[2]).applyMatrix4(ap.matriz);
            // controle do arco: no meio, acima e na frente (a moeda passa por cima da fileira, mais perto da câmera)
            p1.copy(p0).lerp(fim, 0.5);
            p1.y = Math.max(p0.y, fim.y) + 0.022;
            p1.z = Math.max(p0.z, fim.z) + 0.016;
            const a = (1 - k) * (1 - k);
            const b = 2 * (1 - k) * k;
            const d = k * k;
            r0.position.set(a * p0.x + b * p1.x + d * fim.x + num(c.x, 0), a * p0.y + b * p1.y + d * fim.y + num(c.y, 0), a * p0.z + b * p1.z + d * fim.z + num(c.z, 0));
            const kk = clamp01(k / 0.35);
            const s = lerp(sTela * ap.escala, def.s * num(c.s, 1), kk * kk * (3 - 2 * kk));
            r0.scale.set(s, s * num(c.sy, 1), s);
            // rola uma volta inteira (2 pi) até o pouso: a pessoa chega em pé, como a moeda do carrossel
            _e.set(def.rx + num(c.rx, 0), def.ry + num(c.ry, 0) + 2 * Math.PI * num(c.giro, 0), def.rz + num(c.rz, 0) - 2 * Math.PI * k, "YXZ");
            _q.setFromEuler(_e);
            r0.quaternion.copy(ap.q).slerp(_q, kk);
            const br = clamp01(num(c.brilho, 0));
            (reflexo.material as THREE.SpriteMaterial).opacity = br;
            reflexo.scale.setScalar(0.014 * (0.6 + 0.8 * br));
            reflexo.visible = br > 0.001;
          },
        });
        continue;
      }
      if (def.tipo === "sino") {
        const g = criaSino();
        const r0 = new THREE.Group();
        r0.add(g);
        raiz.add(r0);
        semSombra.push(r0);
        const po = op.pouso as { px: number; py: number; z: number };
        const w0 = noMundo(po, pal.camRepouso);
        const blob = novaBlob();
        quentes.push({
          id, raiz: r0, blob,
          aplica(c) {
            const vis = num(c.vis, 0);
            const s = def.s * num(c.s, 1);
            r0.visible = vis > 0.001 && s > 0.0015;
            if (!r0.visible) return;
            r0.position.set(w0.x + num(c.x, 0), w0.y + num(c.y, 0), w0.z + num(c.z, 0));
            r0.rotation.set(def.rx + num(c.rx, 0), def.ry + num(c.ry, 0), def.rz + num(c.rz, 0), "YXZ");
            r0.scale.setScalar(s);
          },
        });
        continue;
      }
      if (def.tipo === "faisca") {
        const sp = criaFaisca(String(op.cor || "#F2643C"));
        raiz.add(sp);
        semSombra.push(sp);
        const dl = (Array.isArray(op.desloc) ? op.desloc : [0.02, 0.02, 0.01]) as number[];
        const tam = num(op.tamanho, 0.012);
        quentes.push({
          id, raiz: sp, blob: null,
          aplica(c) {
            const k = clamp01(num(c.k, 0));
            sp.visible = num(c.vis, 0) > 0.001 && k > 0 && k < 1;
            if (!sp.visible) return;
            const base = moedaRaiz ? moedaRaiz.position : ORIGEM;
            sp.position.set(base.x + dl[0], base.y + dl[1], base.z + dl[2]);
            sp.scale.setScalar(tam * Math.sin(Math.PI * k));
            (sp.material as THREE.SpriteMaterial).rotation = k * 1.4;
          },
        });
        continue;
      }
    }

    // a ordem do pinta importa pras faíscas (seguem a moeda): a moeda vem antes
    quentes.sort((a, b) => (a.id.indexOf("faisca") === 0 ? 1 : 0) - (b.id.indexOf("faisca") === 0 ? 1 : 0));

    const tam = new THREE.Vector2();
    const largura = props.largura || 1080;
    const altura = props.altura || 1920;
    const opProj = { largura, altura };
    const ap: PoseAparelho = { matriz: new THREE.Matrix4(), q: new THREE.Quaternion(), escala: 1 };
    // planos de recorte presos à borda desenhada dos painéis: passam pelo olho da câmera e pela linha da borda (no
    // plano z = 0, onde o painel é medido). O que sai pela parede some exatamente na borda, em qualquer profundidade.
    const olho = V();
    const pA = V();
    const pB = V();
    const nrm = V();
    const dentro = V();
    const planoPelaBorda = (pl: THREE.Plane, x: number, ladoDentro: number) => {
      pA.set(x, pal.vitrine.yAncora, 0);
      pB.set(x, pal.vitrine.yAncora + 0.1, 0);
      nrm.copy(pA).sub(olho).cross(pB.clone().sub(olho)).normalize();
      pl.setFromNormalAndCoplanarPoint(nrm, olho);
      dentro.set(x + ladoDentro * 0.01, pal.vitrine.yAncora, 0);
      if (pl.distanceToPoint(dentro) < 0) pl.negate();
    };
    const presos: string[] = Object.keys(frias);

    return {
      raiz,
      sombra: 0,
      pinta(st: Estado, t: number) {
        const pc = st.canais[pal.id] || {};
        // câmera do quadro (com a deriva), a mesma do Cena3DKit
        const cam = cameraRender(st.cam, t, props);
        const C = matrizesCamera(cam, opProj);
        const pr = (x: number, y: number, z: number) => projetaPonto([x, y, z], C, opProj);
        gl.getDrawingBufferSize(tam);
        const u = vit.u;
        u.uRes.value.copy(tam);
        u.uSeed.value = Math.floor(t * props.fps) * 0.618;

        // ---- vitrines: âncoras do mundo projetadas, fusão e escala ----
        const vt = pal.vitrine;
        const xL = pr(-vt.borda, vt.yAncora, 0).px;
        const xLi = pr(-vt.vao, vt.yAncora, 0).px;
        const xRi = pr(vt.vao, vt.yAncora, 0).px;
        const xR = pr(vt.borda, vt.yAncora, 0).px;
        const xm = pr(0, vt.yAncora, 0).px;
        const yT = pr(0, vt.yTopo, vt.zFundo).py;
        const yB = pr(0, MESA, vt.zFrente).py;
        const f = clamp01(num(pc.fusao, 0));
        const e = Math.max(0, num(pc.escala, 1));
        const ex = num(pc.ex, 540);
        const ey = num(pc.ey, 1120);
        const sx = (x: number) => ex + (x - ex) * e;
        const sy = (y: number) => ey + (y - ey) * e;
        // na fusão as bordas de dentro passam 3 px uma da outra: a costura não fica com meia cobertura
        const ax1 = lerp(xLi, xm + 3, f);
        const bx0 = lerp(xRi, xm - 3, f);
        const ro = vt.raio * e;
        const ri = vt.raio * e * (1 - f);
        u.uA.value.set(sx(xL), sy(yT), sx(ax1), sy(yB));
        u.uB.value.set(sx(bx0), sy(yT), sx(xR), sy(yB));
        u.uRA.value.set(ro, ri, ri, ro);
        u.uRB.value.set(ri, ro, ro, ri);
        u.uU.value.set(sx(xL), sy(yT), sx(xR), sy(yB));
        u.uRU.value.set(ro, ro, ro, ro);
        u.uFusao.value = f;
        u.uAquece.value = clamp01(num(pc.aquece, 0));
        const alfaPainel = clamp01(num(pc.alfa, 1));
        u.uAlfa.value = alfaPainel;
        // halo e brilho seguem o aparelho
        const sAp = st.obj[pal.aparelho];
        const poseAp = poseRender(sAp, apProps, t, props);
        const rig = matrizRig(poseAp);
        ap.matriz.copy(rig.matriz);
        ap.q.setFromEuler(rig.rotacao);
        ap.escala = rig.escala;
        const centroAp = pr(poseAp.x, poseAp.y, poseAp.z);
        const raioHalo = Math.abs(pr(poseAp.x + 0.08, poseAp.y, poseAp.z).px - centroAp.px);
        u.uHalo.value.set(sx(centroAp.px), sy(centroAp.py));
        u.uHaloR.value = Math.max(1, raioHalo * e);
        u.uHaloI.value = num(pc.halo, 0.4);
        const piso = pr(poseAp.x, MESA, poseAp.z);
        const rxb = Math.abs(pr(poseAp.x + 0.062, MESA, poseAp.z).px - piso.px);
        u.uBrilho.value.set(sx(piso.px), sy(piso.py), Math.max(1, rxb * e), Math.max(1, rxb * 0.17 * e));
        u.uBrilhoI.value = num(pc.brilho, 0);
        u.uBrilhoNeutro.value = clamp01(num(pc.brilhoNeutro, 0));
        const lf = pr(-0.056, MESA + 0.06, 0);
        const lfr = Math.abs(pr(0.022, MESA + 0.06, 0).px - lf.px);
        u.uLuzFria.value.set(sx(lf.px), sy(lf.py));
        u.uLuzFriaR.value.set(Math.max(1, lfr * e), Math.max(1, lfr * 1.28 * e));
        const vr = clamp01(num(pc.varre, 0));
        const vi = num(pc.varreI, 0) * Math.sin(Math.PI * vr);
        u.uVarre.value.set(lerp(sx(xL) - 70, sx(ax1) + 70, vr), 64, vi);
        u.uFio.value.set((xLi + xRi) / 2, yT, lerp(yT, yB, clamp01(num(pc.fio, 0))), clamp01(num(pc.fioA, 0)));

        // ---- recorte da vitrine fria: paredes presas à borda desenhada (o vão se abre na fusão) ----
        olho.set(cam.x, cam.y, cam.z);
        planoPelaBorda(planos.esq, -vt.borda, +1);
        if (f > 0.001) {
          planos.dir.set(new THREE.Vector3(-1, 0, 0), 1);
        } else {
          planoPelaBorda(planos.dir, -vt.vao, -1);
        }
        chao.scale.x = Math.max(0.001, lerp(-vt.vao, 0.6, f) - CHAO_ESQ);

        // ---- luz de varredura fria ----
        varre.intensity = 7 * vi;
        varre.visible = true;
        const vx = lerp(-0.14, 0.01, vr);
        varre.position.set(vx, MESA + 0.075, 0.12);
        varre.lookAt(vx + 0.01, MESA + 0.035, -0.01);

        // ---- peças ----
        for (const id of presos) {
          const c = st.canais[P + id] || {};
          frias[id].aplica(c, t);
          // no fecho a peça fica presa ao painel: mesmo centro (ex, ey) e mesma escala dele, no plano dela
          if (num(c.painel, 0) > 0.5 && !frias[id].def.pai) {
            const r = frias[id].raiz;
            const q0 = desprojeta(ex, ey, cam, r.position.z, opProj);
            r.position.set(q0.x + (r.position.x - q0.x) * e, q0.y + (r.position.y - q0.y) * e, q0.z + (r.position.z - q0.z) * e);
            r.scale.multiplyScalar(Math.max(0.0001, e));
            r.visible = r.visible && e > 0.002;
          }
        }
        // a folha carimbada: em cima da pilha ou voando pra pasta
        for (const id of presos) {
          const pf = frias[id];
          if (!pf.voo) continue;
          const pd = frias[pf.voo.pasta];
          poseFolhaVoo(pf.voo, pf, pd, st.canais[P + id] || {}, pd ? st.canais[P + pf.voo.pasta] || {} : undefined);
        }
        for (const q of quentes) {
          q.aplica(st.canais[P + q.id] || {}, t, ap);
          if (q.blob) {
            q.raiz.updateMatrixWorld(true);
            poeBlob(q.blob, q.raiz, num((st.canais[P + q.id] || {}).vis, 0));
          }
        }
      },
    };
  },
};

// ---------- camada 2D: pílula "Comenta aí" (a do fecho do carrossel) ----------
const txt = (x: unknown, p: string) => (typeof x === "string" && x ? x : p);

const Balao: React.FC<{ tam: number }> = ({ tam }) => (
  <svg width={tam} height={tam} viewBox="0 0 30 30" style={{ display: "block" }}>
    <path
      d="M6.5 5h17A3.5 3.5 0 0 1 27 8.5v10a3.5 3.5 0 0 1 -3.5 3.5H14.2l-5.7 4.6V22H6.5A3.5 3.5 0 0 1 3 18.5v-10A3.5 3.5 0 0 1 6.5 5z"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={2.6}
      strokeLinejoin="round"
    />
  </svg>
);

const CamadaPilula: CamadaExtensao = ({ id, st, props }) => {
  const def = (props.camadas || []).filter((c) => c.id === id)[0];
  if (!def) return null;
  const c = st.canais[id] || {};
  const k = num(c.k, 0);
  if (k <= 0.001) return null;
  const tam = num(def.tamanho, 36);
  const z = tam / 34;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: num(def.top, 968), display: "flex", justifyContent: "center", opacity: Math.min(1, k * 1.3) }}>
      <div
        style={{
          scale: `${0.7 + 0.3 * k}`,
          display: "inline-flex",
          alignItems: "center",
          gap: 14 * z,
          background: txt(def.cor, "#DD4E27"),
          color: "#FFFFFF",
          borderRadius: 999,
          padding: `${20 * z}px ${40 * z}px`,
          fontFamily: "Sora",
          fontWeight: 800,
          fontSize: tam,
          lineHeight: 1,
          whiteSpace: "nowrap",
          boxShadow: "0 10px 26px rgba(221,78,39,0.28)",
        }}
      >
        <Balao tam={Math.round(30 * z)} />
        <span>{txt(def.texto, "Comenta aí")}</span>
      </div>
    </div>
  );
};

export const render: RenderExtensao = {
  objetos: { [TIPO_PALCO]: fabricaPalco },
  camadas: { "pilula-comenta": CamadaPilula },
};
