import React, { useEffect, useLayoutEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { findMesh, loadGLB, loadImage, studioEnv, useCenaPronta } from "./assets3d";
import { PintorTela, TW, TH, CARD, BOTAO_PAGAR } from "./tela";
import { PintorFolha, PintorRelogio, texturaDia20, texturaFaisca, texturaSombra, texturaSombraRet } from "./pinturas";
import type { Estado, Obj } from "./estado";
import { Particulas } from "./Particulas";

RectAreaLightUniformsLib.init();

export const MESA = -0.0905; // altura do papel (pé do iPhone em pé)
const TELA_W = 0.0713;
const TELA_H = 0.154;
const FRENTE = 0.0064; // face da tela no espaço do rig (o modelo gira 180° pra tela olhar pra câmera)

/** posição (no rig do iPhone) de um ponto da tela em px da captura */
export const pontoTela = (px: number, py: number) =>
  new THREE.Vector3((px / TW - 0.5) * TELA_W, (0.5 - py / TH) * TELA_H, FRENTE + 0.0004);

type Montado = {
  phoneRig: THREE.Group; watchRig: THREE.Group; folha: THREE.Mesh; chip: THREE.Group; bg: THREE.Mesh;
  sombras: Record<string, THREE.Mesh>; tela: PintorTela; relogio: PintorRelogio; papel: PintorFolha;
  ondas: THREE.Mesh[]; faisca: THREE.Texture; ondaMesa: THREE.Mesh[];
};

function vidroFrontal() {
  // vidro da frente inteiro (cobre a borda preta também), só reflexo: aditivo com difuso preto
  const w = 0.0748;
  const h = 0.1575;
  const r = 0.0105;
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const m = new THREE.Mesh(
    new THREE.ShapeGeometry(s, 12),
    new THREE.MeshStandardMaterial({ color: "#000000", roughness: 0.04, metalness: 0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: 1.3 }),
  );
  m.position.z = FRENTE + 0.0009;
  m.renderOrder = 5;
  return m;
}

function pilulaDia20() {
  const w = 0.064;
  const h = 0.026;
  const r = h / 2;
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.absarc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(-w / 2 + r, h / 2);
  s.absarc(-w / 2 + r, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.0016, bevelSize: 0.0016, bevelSegments: 4, curveSegments: 24 });
  geo.translate(0, 0, -0.003);
  const corpo = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: "#D9481F", roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 0.6 }));
  const txt = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.86, w * 0.86 * 0.4), new THREE.MeshBasicMaterial({ map: texturaDia20(), transparent: true, toneMapped: false }));
  txt.position.z = 0.0048;
  const g = new THREE.Group();
  g.add(corpo, txt);
  return g;
}

function folhaPapel(tex: THREE.Texture) {
  const geo = new THREE.PlaneGeometry(0.068, 0.096, 12, 16);
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    p.setZ(i, -6 * x * x + 0.004 * Math.sin(y * 40)); // curvinha de papel de verdade
  }
  geo.computeVertexNormals();
  const folha = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, color: "#EEE7DD", roughness: 1, metalness: 0, envMapIntensity: 0.45, side: THREE.DoubleSide }));
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.068 * 1.5, 0.096 * 1.4), new THREE.MeshBasicMaterial({ map: texturaSombraRet(), transparent: true, depthWrite: false, opacity: 0.42, toneMapped: false }));
  // atrás do ponto mais fundo da curva (-0,0109 nas bordas de baixo): em -0,006 a sombra atravessava o papel e
  // manchava a linha digitável e as barras (a "ampulheta" marrom do v2)
  sh.position.set(0.004, -0.007, -0.014);
  sh.renderOrder = 2;
  folha.add(sh);
  return folha;
}

function fundo() {
  // papel da marca com vinheta quente e grão, preso na câmera; `quente` puxa um pouco pro coral
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

function sombra(tex: THREE.Texture) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = MESA + 0.0002;
  m.renderOrder = 1;
  return m;
}

const aplica = (g: THREE.Object3D, o: Obj, extraRy = 0) => {
  g.position.set(o.x, o.y, o.z);
  g.rotation.set(o.rx, o.ry + extraRy, o.rz, "YXZ");
  g.scale.setScalar(Math.max(0.0001, o.s));
  g.visible = o.vis > 0.001 && o.s > 0.001;
};

/** pega a pegada do objeto no papel (caixa no mundo) pra dimensionar a sombra */
const caixa = new THREE.Box3();
function poeSombra(sh: THREE.Mesh, alvo: THREE.Object3D, forca: number) {
  if (!alvo.visible) { sh.visible = false; return; }
  caixa.setFromObject(alvo);
  const cx = (caixa.min.x + caixa.max.x) / 2;
  const cz = (caixa.min.z + caixa.max.z) / 2;
  const altura = Math.max(0, caixa.min.y - MESA);
  const sx = (caixa.max.x - caixa.min.x) * 1.25 + altura * 0.9 + 0.012;
  const sz = (caixa.max.z - caixa.min.z) * 1.25 + altura * 0.9 + 0.012;
  sh.position.set(cx, MESA + 0.0002, cz);
  sh.scale.set(sx, sz, 1);
  (sh.material as THREE.MeshBasicMaterial).opacity = forca * Math.max(0.12, 1 - altura * 7);
  sh.visible = true;
}

export const Cena3D: React.FC<{ st: Estado; t: number }> = ({ st, t }) => {
  const { gl, scene, camera, advance } = useThree();
  const [m, setM] = useState<Montado | null>(null);
  useCenaPronta(!!m, advance);

  useEffect(() => {
    Promise.all([
      loadGLB("3d/iphone.glb"), loadGLB("3d/watch.glb"),
      loadImage("telas/tela-splash.png"), loadImage("telas/tela-inicio.png"), loadImage("telas/tela-imposto.png"), loadImage("telas/tela-inicio-pagar.png"),
      loadImage("marca/simbolo.svg"), document.fonts.load("800 100px Sora"), document.fonts.load("600 40px Sora"),
    ]).then(([ph, wa, sp, ini, imp, iniPag, sim]) => {
      const tela = new PintorTela({ splash: sp, inicio: ini, imposto: imp, inicioPagar: iniPag });
      const relogio = new PintorRelogio(sim);
      const papel = new PintorFolha();
      const phone = (ph as THREE.Object3D).clone(true);
      phone.rotation.y = Math.PI;
      const tm = findMesh(phone, "Tela");
      if (tm) tm.material = new THREE.MeshBasicMaterial({ map: tela.tex, toneMapped: false });
      const phoneRig = new THREE.Group();
      phoneRig.add(phone, vidroFrontal());
      const watch = (wa as THREE.Object3D).clone(true);
      const tw = findMesh(watch, "Tela");
      if (tw) tw.material = new THREE.MeshBasicMaterial({ map: relogio.tex, toneMapped: false });
      const watchRig = new THREE.Group();
      watchRig.add(watch);
      // anéis de vibração em volta do mostrador (no plano da tela do relógio)
      const ondas: THREE.Mesh[] = [];
      for (let i = 0; i < 2; i++) {
        const o = new THREE.Mesh(new THREE.RingGeometry(0.0255, 0.0263, 64), new THREE.MeshBasicMaterial({ color: "#F2643C", transparent: true, depthWrite: false, toneMapped: false }));
        o.position.set(0, 0.019, 0.03);
        o.rotation.x = -0.6;
        watchRig.add(o);
        ondas.push(o);
      }
      const st2 = texturaSombra();
      setM({
        phoneRig, watchRig, folha: folhaPapel(papel.tex), chip: pilulaDia20(), bg: fundo(),
        sombras: { phone: sombra(st2), watch: sombra(st2), folha: sombra(st2), chip: sombra(st2) },
        tela, relogio, papel, ondas, faisca: texturaFaisca(),
        ondaMesa: [0, 1].map(() => { const r = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 96), new THREE.MeshBasicMaterial({ color: "#F2643C", transparent: true, depthWrite: false, toneMapped: false })); r.rotation.x = -Math.PI / 2; r.position.y = MESA + 0.0004; r.renderOrder = 1; return r; }),
      });
    });
  }, []);

  useLayoutEffect(() => {
    gl.toneMapping = THREE.NeutralToneMapping; // Khronos Neutral: não desbota o coral da pílula nem o papel
    gl.toneMappingExposure = 1.0;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    scene.environment = studioEnv(gl);
    scene.environmentIntensity = 1.45;
    scene.add(camera);
  }, [gl, scene, camera]);

  if (!m) return null;

  // ---------- aplica o estado do quadro ----------
  const cam = camera as THREE.PerspectiveCamera;
  // tremida curta nos impactos (carimbo, pouso)
  let shx = 0;
  let shy = 0;
  for (const t0 of st.impactos) {
    const d = t - t0;
    if (d > 0 && d < 0.5) {
      const a = 0.0016 * Math.exp(-d * 9);
      shx += a * Math.sin(d * 70);
      shy += a * Math.cos(d * 55);
    }
  }
  cam.fov = st.cam.fov;
  // deriva lenta de câmera na mão (camada ambiente), sempre somada
  const drx = Math.sin(t * 0.35) * 0.0028;
  const dry = Math.sin(t * 0.27 + 1) * 0.0018;
  cam.position.set(st.cam.x + shx + drx, st.cam.y + shy + dry, st.cam.z);
  cam.lookAt(st.cam.tx + shx * 0.5, st.cam.ty + shy * 0.5, st.cam.tz);
  cam.updateProjectionMatrix();
  // fundo preso na câmera, cobrindo o quadro
  if (m.bg.parent !== cam) cam.add(m.bg);
  const dist = 3;
  const hh = 2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
  m.bg.position.set(0, 0, -dist);
  m.bg.scale.set((hh * cam.aspect) / 2, hh / 2, 1);
  const bm = m.bg.material as THREE.ShaderMaterial;
  bm.uniforms.uQuente.value = st.luz.quente;
  bm.uniforms.uSeed.value = Math.floor(t * 30) * 0.618;

  // respiração ambiente (camada de fundo do movimento): flutuação leve dos aparelhos
  const fl = Math.sin(t * 1.7) * 0.0018;
  aplica(m.phoneRig, { ...st.phone, y: st.phone.y + (st.phone.rx > 1 ? 0 : fl) });
  aplica(m.watchRig, { ...st.watch, y: st.watch.y + Math.sin(t * 2.1 + 1) * 0.0015, rz: st.watch.rz + st.watch.buzz * 0.05 * Math.sin(t * 140) });
  aplica(m.folha, { ...st.folha, y: st.folha.y + Math.sin(t * 2.3 + 2) * 0.002, rz: st.folha.rz + Math.sin(t * 1.9) * 0.02 });
  aplica(m.chip, { ...st.chip, y: st.chip.y + Math.sin(t * 2.6 + 0.5) * 0.0014 });
  m.ondas.forEach((o, i) => {
    const k = st.ondas * 1.4 - i * 0.2;
    const v = k > 0 && k < 1;
    o.visible = v && m.watchRig.visible;
    o.scale.setScalar(1 + 0.45 * Math.max(0, k));
    (o.material as THREE.MeshBasicMaterial).opacity = v ? 0.6 * (1 - k) : 0;
  });
  // texturas desenhadas do quadro
  m.tela.pinta(st.tela);
  m.relogio.pinta(st.relogio, t);
  m.papel.pinta(st.papel);
  // sombras de contato no papel
  m.phoneRig.updateMatrixWorld(true);
  m.watchRig.updateMatrixWorld(true);
  m.folha.updateMatrixWorld(true);
  m.chip.updateMatrixWorld(true);
  poeSombra(m.sombras.phone, m.phoneRig, 0.85);
  poeSombra(m.sombras.watch, m.watchRig, 0.7);
  poeSombra(m.sombras.folha, m.folha, 0.45);
  poeSombra(m.sombras.chip, m.chip, 0.5);

  // varredura de luz: softbox estreito descendo pela lateral do aparelho (em pé) ou passando por cima do verso (deitado)
  const deitado = st.phone.rx > 1;
  const vy = 0.28 - 0.56 * st.luz.varre;
  const varreAtiva = st.luz.varre > 0 && st.luz.varre < 1;
  const varrePos: [number, number, number] = deitado ? [-0.16 + 0.32 * st.luz.varre, MESA + 0.13, 0.06] : [0.11, vy, 0.12];
  const varreAlvo: [number, number, number] = deitado ? [varrePos[0] * 0.5, MESA, 0] : [0, vy * 0.6, 0];
  // onda coral no papel em volta do aparelho que assentou
  m.ondaMesa.forEach((r, i) => {
    const k = st.luz.onda * 1.25 - i * 0.25;
    const v = k > 0 && k < 1;
    r.visible = v;
    r.position.x = st.phone.x;
    r.position.z = st.phone.z;
    r.scale.setScalar(0.07 + 0.16 * Math.max(0, k));
    (r.material as THREE.MeshBasicMaterial).opacity = v ? 0.5 * Math.pow(1 - k, 1.3) : 0;
  });
  // alvo das faíscas que convergem: o card da guia, na tela do iPhone
  const alvoCard = pontoTela(CARD.x + CARD.w / 2, CARD.y + CARD.h * 0.42).applyMatrix4(m.phoneRig.matrixWorld);
  const alvoCarimbo = new THREE.Vector3(0.017, 0.022, 0.003).applyMatrix4(m.folha.matrixWorld);
  const alvoChip = new THREE.Vector3(0, 0, 0).applyMatrix4(m.chip.matrixWorld);
  const alvoPouso = new THREE.Vector3().copy(m.phoneRig.position).setY(MESA + 0.002);
  const alvoBotao = pontoTela(BOTAO_PAGAR.x + BOTAO_PAGAR.w / 2, BOTAO_PAGAR.y + BOTAO_PAGAR.h / 2).applyMatrix4(m.phoneRig.matrixWorld);

  return (
    <>
      <directionalLight position={[0.3, 0.6, 0.6]} intensity={1.1} />
      <directionalLight position={[-0.5, 0.25, -0.4]} intensity={1.6} color="#FFE9DC" />
      <hemisphereLight args={["#FFFFFF", "#E9DFD2", 0.35]} />
      {varreAtiva && (
        <rectAreaLight position={varrePos} width={deitado ? 0.5 : 0.05} height={deitado ? 0.05 : 0.5} intensity={(deitado ? 30 : 14) * Math.sin(Math.PI * st.luz.varre)} color="#FFFFFF"
          onUpdate={(l) => l.lookAt(...varreAlvo)} />
      )}
      <primitive object={m.phoneRig} />
      <primitive object={m.watchRig} />
      <primitive object={m.folha} />
      <primitive object={m.chip} />
      {Object.values(m.sombras).map((s, i) => <primitive key={i} object={s} />)}
      {m.ondaMesa.map((r, i) => <primitive key={`o${i}`} object={r} />)}
      <Particulas t={t} st={st} tex={m.faisca} alvoCard={alvoCard} alvoCarimbo={alvoCarimbo} alvoChip={alvoChip} alvoPouso={alvoPouso} alvoBotao={alvoBotao} />
    </>
  );
};

