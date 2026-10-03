// Cena 3D do kit por dados (dono K06): port do src/guia/Cena3D.tsx. Mesmas luzes; RoomEnvironment com 0,035 e
// intensidade 1,45; NeutralToneMapping com exposição 1; fundo de papel em shader preso na câmera; sombras de
// contato pelo poeSombra; varredura de luz com rectAreaLight por props.ambiente.varredura; poeira; poses pelo
// nucleo/pose.ts (deriva da câmera e flutuação por tipo). Os objetos são criados na ordem de props.objetos e as
// primitivas entram na mesma ordem do original (aparelho, relógio, folha, sombras, poeira). A pílula do original
// (o "chip") não existe no guia: só aparece quando a cena declara um objeto do tipo pilula.
// Ordem de criação = a do original (assets, objetos, fundo, sombras, luzes e poeira): o three ordena os
// opacos pelo id do material e desempata os transparentes pelo id do objeto, então a ordem conta pro pixel.
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { cancelRender } from "remotion";
import { aplicaRig, cameraRender, poseRender } from "../nucleo/pose";
import type { Estado, ObjetoProps, PropsKit } from "../nucleo/tipos";
import { loadGLB, loadImage, studioEnv, useCenaPronta } from "./carrega";
import { Particulas } from "./Particulas";
import { texturaFaisca, texturaSombra } from "./pintores/texturas";
import type { FabricaObjeto, ObjetoMontado, RecursosCena } from "./tipos-render";
import { fabricaAparelho } from "./objetos/aparelho";
import { fabricaRelogio } from "./objetos/relogio";
import { fabricaFolha } from "./objetos/folha";
import { fabricaPilula } from "./objetos/pilula";
import { fabricaComprovante } from "./objetos/comprovante";
import { fabricaGlb } from "./objetos/glb";

/** altura do papel (pé do celular em pé) */
export const MESA = -0.0905;

/** fábricas dos tipos de objeto do núcleo (seção 4.2) */
export const FABRICAS_NUCLEO: Record<string, FabricaObjeto> = {
  aparelho: fabricaAparelho,
  relogio: fabricaRelogio,
  folha: fabricaFolha,
  pilula: fabricaPilula,
  comprovante: fabricaComprovante,
  glb: fabricaGlb,
};

let rectAreaPronto = false;
/** tabelas do RectAreaLight: o Cena3D.tsx do guia já inicia no import; aqui só se ninguém iniciou
 *  (o init do three não é idempotente: recriaria as texturas LTC) */
export function iniciaRectArea() {
  if (rectAreaPronto) return;
  const U = THREE.UniformsLib as unknown as Record<string, unknown>;
  if (!U.LTC_FLOAT_1) RectAreaLightUniformsLib.init();
  rectAreaPronto = true;
}

/** papel da marca com vinheta quente e grão, preso na câmera; `quente` puxa um pouco pro coral */
export function fundo() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uQuente: { value: 0 }, uSeed: { value: 0 } },
    depthWrite: false,
    depthTest: false,
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `
      varying vec2 vUv; uniform float uQuente; uniform float uSeed;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uSeed) * 43758.5453); }
      void main(){
        vec2 q = vUv - vec2(0.5, 0.56);
        q.x *= 0.62;
        float d = length(q);
        vec3 centro = vec3(0.955, 0.939, 0.913); // #FAF8F5 em linear
        vec3 borda = vec3(0.80, 0.752, 0.686);   // #E8E1D8 em linear (vinheta quente)
        vec3 c = mix(centro, borda, smoothstep(0.08, 0.62, d));
        c = mix(c, vec3(0.98, 0.604, 0.448), uQuente * (1.0 - smoothstep(0.0, 0.6, d)) * 0.55);
        c += (h(gl_FragCoord.xy) - 0.5) * 0.012; // grão
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  m.renderOrder = -10;
  m.frustumCulled = false;
  return m;
}

/** fundo do quadro: preso na câmera, cobrindo o quadro, com o grão por quadro */
export function poeFundo(bg: THREE.Mesh, cam: THREE.PerspectiveCamera, quente: number, t: number, fps: number) {
  if (bg.parent !== cam) cam.add(bg);
  const dist = 3;
  const hh = 2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
  bg.position.set(0, 0, -dist);
  bg.scale.set((hh * cam.aspect) / 2, hh / 2, 1);
  const bm = bg.material as THREE.ShaderMaterial;
  bm.uniforms.uQuente.value = quente;
  bm.uniforms.uSeed.value = Math.floor(t * fps) * 0.618;
}

/** sombra de contato no papel */
export function sombra(tex: THREE.Texture, mesa = MESA) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = mesa + 0.0002;
  m.renderOrder = 1;
  return m;
}

/** pega a pegada do objeto no papel (caixa no mundo) pra dimensionar a sombra */
const caixa = new THREE.Box3();
export function poeSombra(sh: THREE.Mesh, alvo: THREE.Object3D, forca: number, mesa = MESA) {
  if (!alvo.visible) { sh.visible = false; return; }
  caixa.setFromObject(alvo);
  const cx = (caixa.min.x + caixa.max.x) / 2;
  const cz = (caixa.min.z + caixa.max.z) / 2;
  const altura = Math.max(0, caixa.min.y - mesa);
  const sx = (caixa.max.x - caixa.min.x) * 1.25 + altura * 0.9 + 0.012;
  const sz = (caixa.max.z - caixa.min.z) * 1.25 + altura * 0.9 + 0.012;
  sh.position.set(cx, mesa + 0.0002, cz);
  sh.scale.set(sx, sz, 1);
  (sh.material as THREE.MeshBasicMaterial).opacity = forca * Math.max(0.12, 1 - altura * 7);
  sh.visible = true;
}

/** arquivos que os objetos pedem, na ordem da cena: primeiro os GLB, depois as imagens (como o original) */
export function arquivosDaCena(objetos: ObjetoProps[], props: PropsKit, fabricas: Record<string, FabricaObjeto>) {
  const glb: string[] = [];
  const imagens: string[] = [];
  for (const o of objetos) {
    const f = fabricas[o.tipo];
    if (!f) throw new Error(`objeto ${o.id}: tipo "${o.tipo}" sem fábrica (núcleo: ${Object.keys(FABRICAS_NUCLEO).join(", ")}; o resto vem de extensão)`);
    const a = f.arquivos ? f.arquivos(o, props) : {};
    for (const g of a.glb || []) if (glb.indexOf(g) < 0) glb.push(g);
    for (const i of a.imagens || []) if (imagens.indexOf(i) < 0) imagens.push(i);
  }
  return { glb, imagens };
}

/** carrega tudo junto (com as fontes do canvas) e devolve os recursos prontos */
export function carregaRecursos(arq: { glb: string[]; imagens: string[] }): Promise<RecursosCena> {
  return Promise.all([
    Promise.all(arq.glb.map((c) => loadGLB(c))),
    Promise.all(arq.imagens.map((c) => loadImage(c))),
    document.fonts.load("800 100px Sora"),
    document.fonts.load("600 40px Sora"),
  ]).then(([glbs, imgs]) => {
    const mg = new Map<string, THREE.Object3D>();
    const mi = new Map<string, HTMLImageElement>();
    arq.glb.forEach((c, i) => mg.set(c, glbs[i] as THREE.Object3D));
    arq.imagens.forEach((c, i) => mi.set(c, imgs[i]));
    return {
      glb(c: string) {
        const g = mg.get(c);
        if (!g) throw new Error(`GLB não carregado: ${c} (declare em arquivos() da fábrica)`);
        return g;
      },
      imagem(c: string) {
        const im = mi.get(c);
        if (!im) throw new Error(`imagem não carregada: ${c} (declare em arquivos() da fábrica)`);
        return im;
      },
      carregaGLB: (c: string) => loadGLB(c) as Promise<THREE.Object3D>,
      carregaImagem: (c: string) => loadImage(c),
    };
  });
}

/** cria os objetos na ordem dada; as fábricas síncronas rodam em sequência, sem esperar as assíncronas */
export function criaObjetos(objetos: ObjetoProps[], props: PropsKit, fabricas: Record<string, FabricaObjeto>, recursos: RecursosCena, gl: THREE.WebGLRenderer) {
  const criados: Array<ObjetoMontado | Promise<ObjetoMontado>> = objetos.map((o) => fabricas[o.tipo].cria({ objeto: o, props, recursos, gl }));
  const temPromessa = criados.some((c) => !!c && typeof (c as Promise<ObjetoMontado>).then === "function");
  return temPromessa ? Promise.all(criados) : (criados as ObjetoMontado[]);
}

type Item = { objeto: ObjetoProps; m: ObjetoMontado; sombra: THREE.Mesh | null; forca: number };
type Montado = { itens: Item[]; bg: THREE.Mesh; faisca: THREE.Texture };

export const Cena3DKit: React.FC<{ st: Estado; t: number; props: PropsKit; fabricas: Record<string, FabricaObjeto> }> = ({ st, t, props, fabricas }) => {
  const { gl, scene, camera, advance } = useThree();
  const [m, setM] = useState<Montado | null>(null);
  useCenaPronta(!!m, advance);

  useEffect(() => {
    let arq: { glb: string[]; imagens: string[] };
    try {
      arq = arquivosDaCena(props.objetos, props, fabricas);
    } catch (e) {
      cancelRender(e);
      return;
    }
    carregaRecursos(arq)
      .then((recursos) => {
        const fecha = (objs: ObjetoMontado[]) => {
          const tSombra = texturaSombra();
          const bg = fundo();
          const itens: Item[] = objs.map((om, i) => {
            const objeto = props.objetos[i];
            const forca = typeof om.sombra === "number" ? om.sombra : objeto.sombra;
            return { objeto, m: om, sombra: null, forca };
          });
          for (const it of itens) if (it.forca > 0) it.sombra = sombra(tSombra);
          setM({ itens, bg, faisca: texturaFaisca() });
        };
        const r = criaObjetos(props.objetos, props, fabricas, recursos, gl);
        if (Array.isArray(r)) fecha(r);
        else r.then(fecha).catch((e) => cancelRender(e));
      })
      .catch((e) => cancelRender(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    gl.toneMapping = THREE.NeutralToneMapping; // Khronos Neutral: não desbota o coral nem o papel
    gl.toneMappingExposure = 1.0;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    scene.environment = studioEnv(gl);
    scene.environmentIntensity = 1.45;
    scene.add(camera);
  }, [gl, scene, camera]);

  if (!m) return null;
  iniciaRectArea();

  // ---------- aplica o estado do quadro ----------
  const cam = camera as THREE.PerspectiveCamera;
  const c = cameraRender(st.cam, t, props); // deriva lenta de câmera na mão (camada ambiente)
  cam.fov = st.cam.fov;
  cam.position.set(c.x, c.y, c.z);
  cam.lookAt(c.tx, c.ty, c.tz);
  cam.updateProjectionMatrix();
  poeFundo(m.bg, cam, st.luz.quente, t, props.fps);

  // poses (com a flutuação por tipo), texturas do quadro e sombras de contato
  for (const it of m.itens) {
    const s = st.obj[it.objeto.id];
    if (s) aplicaRig(it.m.raiz, poseRender(s, it.objeto, t, props), it.m.extraRy || 0);
  }
  for (const it of m.itens) if (it.m.pinta) it.m.pinta(st, t);
  for (const it of m.itens) it.m.raiz.updateMatrixWorld(true);
  for (const it of m.itens) if (it.sombra) poeSombra(it.sombra, it.m.alvoSombra || it.m.raiz, it.forca);

  // varredura de luz: softbox estreito descendo pela lateral do aparelho (em pé) ou passando por cima do verso (deitado)
  const V = props.ambiente.varredura;
  const ap = props.objetos.filter((o) => o.tipo === "aparelho")[0];
  const deitado = !!ap && !!st.obj[ap.id] && st.obj[ap.id].rx > 1;
  const vy = V.yDe - (V.yDe - V.yAte) * st.luz.varre;
  const varreAtiva = st.luz.varre > 0 && st.luz.varre < 1;
  const varrePos: [number, number, number] = deitado ? [-0.16 + 0.32 * st.luz.varre, MESA + 0.13, 0.06] : [V.x, vy, V.z];
  const varreAlvo: [number, number, number] = deitado ? [varrePos[0] * 0.5, MESA, 0] : [0, vy * 0.6, 0];

  return (
    <>
      <directionalLight position={[0.3, 0.6, 0.6]} intensity={1.1} />
      <directionalLight position={[-0.5, 0.25, -0.4]} intensity={1.6} color="#FFE9DC" />
      <hemisphereLight args={["#FFFFFF", "#E9DFD2", 0.35]} />
      {varreAtiva && (
        <rectAreaLight position={varrePos} width={deitado ? 0.5 : V.largura} height={deitado ? 0.05 : V.altura} intensity={(deitado ? 30 : V.intensidade) * Math.sin(Math.PI * st.luz.varre)} color="#FFFFFF"
          onUpdate={(l) => l.lookAt(...varreAlvo)} />
      )}
      {m.itens.map((it) => <primitive key={it.objeto.id} object={it.m.raiz} />)}
      {m.itens.map((it) => (it.sombra ? <primitive key={`sombra-${it.objeto.id}`} object={it.sombra} /> : null))}
      <Particulas t={t} intensidade={props.ambiente.poeira} tex={m.faisca} altura={props.altura} fov={props.camera.fov} />
    </>
  );
};
