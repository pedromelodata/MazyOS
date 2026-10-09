import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadGLB, loadImage, studioEnv, useCenaPronta } from "../guia/assets3d";

/**
 * O iPhone 17 Pro Max 3D do reel "Cinco motivos pra ter CNPJ" (v6, 09/10/2026), com fundo transparente, pra entrar no
 * CincoMotivos como sequência PNG. Modelo "IPhone 17 Pro Max" de Fiq KM (BlenderKit, royalty free), sem o logo da
 * Apple: _assets-externos/modelos-3d/celular_iphone-17-pro-max_fiqkm-blenderkit_limpo.glb (public-cinco/3d/iphone17.glb).
 *
 * Tempo do VÍDEO, quadro 0 = T0:
 *   25,20 a 26,15  chega do fundo da tela girando (uma volta e meia, mostra as costas e assenta de frente)
 *   tela 1         o imposto do mês calculado (impostos_pagar), no "o app calcula"
 *   30,35          gira e troca pra home ("Sua empresa nasceu"), no "a abertura é com a gente"
 *   40,12 a 40,6   sai girando antes do fecho (o CincoMotivos leva pra direita)
 * Renderizado a 120 quadros por segundo: a mistura de 4 subquadros em 30 dá o desfoque de movimento dos giros.
 */
export const T0_17 = 25.2;
export const TFIM_17 = 40.6;
const TELA_W = 1290, TELA_H = 2796;
const TELAS = ["telas/impostos_pagar.png", "telas/home.png"];
const TROCA = 30.35;
const POSE = -14; // o celular fica à direita e olha pros cartões da esquerda
const POUSA = 26.15;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOutCubic = (u: number) => 1 - (1 - u) ** 3;
const easeOutQuart = (u: number) => 1 - (1 - u) ** 4;
const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2);
type K = [number, number];
function chaves(keys: K[], t: number, ease = easeInOutCubic) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t <= t1) return v0 + (v1 - v0) * ease(clamp01((t - t0) / (t1 - t0)));
  }
  return keys[keys.length - 1][1];
}

function pintaTela(g: CanvasRenderingContext2D, t: number, imgs: HTMLImageElement[]) {
  g.globalAlpha = 1;
  g.fillStyle = "#FFFFFF";
  g.fillRect(0, 0, TELA_W, TELA_H);
  const mistura = clamp01((t - (TROCA - 0.03)) / 0.06);
  g.drawImage(imgs[0], 0, 0, TELA_W, TELA_H);
  if (mistura > 0) {
    g.globalAlpha = mistura;
    g.drawImage(imgs[1], 0, 0, TELA_W, TELA_H);
  }
  // brilho que atravessa o vidro: quando ele assenta e na troca (o pico cobre a passagem de uma tela pra outra)
  for (const ts of [POUSA - 0.05, TROCA]) {
    const u = (t - (ts - 0.21)) / 0.42;
    if (u <= 0 || u >= 1) continue;
    const x = -TELA_W * 0.6 + u * TELA_W * 2.2;
    const grad = g.createLinearGradient(x - 300, 0, x + 300, 0);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.5, `rgba(255,255,255,${0.62 * Math.sin(Math.PI * u)})`);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.save();
    g.globalAlpha = 1;
    g.translate(TELA_W / 2, TELA_H / 2);
    g.rotate(-0.42);
    g.translate(-TELA_W / 2, -TELA_H / 2);
    g.fillStyle = grad;
    g.fillRect(x - 260, -TELA_H, 520, TELA_H * 3);
    g.restore();
  }
  g.globalAlpha = 1;
}

const graus = (d: number) => (d * Math.PI) / 180;
function pose(t: number) {
  // chegada: do fundo (z -95) até o lugar, girando uma volta e meia (começa de costas, termina de frente)
  const u = clamp01((t - T0_17) / (POUSA - T0_17));
  const z = -95 * (1 - easeOutQuart(u));
  let ry = chaves([[T0_17, POSE - 540], [POUSA - 0.12, POSE + 5], [POUSA + 0.1, POSE]], t, easeOutCubic);
  let rx = chaves([[T0_17, 22], [POUSA, 0]], t, easeOutCubic);
  const rz = chaves([[T0_17, -16], [POUSA, 0]], t, easeOutCubic);
  // a troca de tela no pico de um giro, e a saída girando
  ry += chaves([[TROCA - 0.22, 0], [TROCA, -41], [TROCA + 0.3, 5], [TROCA + 0.48, 0]], t);
  rx += chaves([[TROCA - 0.22, 0], [TROCA, -6], [TROCA + 0.28, 1.5], [TROCA + 0.45, 0]], t);
  ry += chaves([[40.12, 0], [40.6, -96]], t);
  // respiração nas pausas
  const resp = clamp01((t - (POUSA + 0.1)) / 0.4) * (1 - clamp01((t - 40.0) / 0.12));
  rx += resp * 0.8 * Math.sin((2 * Math.PI * t) / 2.4);
  ry += resp * 1.1 * Math.sin((2 * Math.PI * t) / 3.1 + 0.7);
  return { rx, ry, rz, z };
}

const Cena: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = T0_17 + frame / fps;
  const { gl, scene, camera, advance } = useThree();
  const [modelo, setModelo] = useState<THREE.Object3D | null>(null);
  const [imgs, setImgs] = useState<HTMLImageElement[] | null>(null);
  useCenaPronta(!!modelo && !!imgs, advance);
  useEffect(() => {
    loadGLB("3d/iphone17.glb").then((s) => setModelo(s.clone(true)));
    Promise.all(TELAS.map(loadImage)).then(setImgs);
  }, []);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.setClearColor(0x000000, 0);
    scene.background = null;
    scene.environment = studioEnv(gl);
    scene.environmentIntensity = 1.25;
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 24;
    cam.position.set(0, 0, 54.9);
    cam.near = 1;
    cam.far = 300;
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [gl, scene, camera]);

  const tela = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = TELA_W;
    c.height = TELA_H;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false; // UV do glTF (origem em cima)
    tex.anisotropy = 8;
    return { c, g: c.getContext("2d")!, tex };
  }, []);

  // o aparelho centrado na origem, em centímetros (16,3 de altura, o mesmo tamanho do celular da v3), tela pra +Z
  const raiz = useMemo(() => {
    if (!modelo) return null;
    modelo.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const nome = (m.material as THREE.Material).name;
      if (nome === "17ProMax_Screen") m.material = new THREE.MeshBasicMaterial({ map: tela.tex, toneMapped: false });
      else if (nome === "17ProMax_glass") m.visible = false; // o vidro da frente: opaco no glTF, cobriria a tela
      else if (nome === "17ProMax_Lens") m.material = new THREE.MeshStandardMaterial({ color: 0x0a0d14, metalness: 0.9, roughness: 0.06 });
    });
    const g = new THREE.Group();
    const caixa = new THREE.Box3().setFromObject(modelo);
    const centro = caixa.getCenter(new THREE.Vector3());
    const tam = caixa.getSize(new THREE.Vector3());
    const k = 16.3 / tam.y;
    modelo.position.sub(centro);
    const escala = new THREE.Group();
    escala.scale.setScalar(k);
    escala.add(modelo);
    g.add(escala);
    return g;
  }, [modelo, tela]);

  if (!raiz || !imgs) return null;
  pintaTela(tela.g, t, imgs);
  tela.tex.needsUpdate = true;
  const { rx, ry, rz, z } = pose(t);
  raiz.rotation.set(graus(rx), graus(ry), graus(rz));
  raiz.position.set(0, 0, z);
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[6, 9, 14]} intensity={1.5} />
      <directionalLight position={[-9, 3, -6]} intensity={1.1} color="#FFB49A" />
      <primitive object={raiz} />
    </>
  );
};

export const CelularCinco17: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 24, near: 1, far: 300, position: [0, 0, 54.9] }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false }}>
        <Cena />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
