import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadGLB, loadImage, studioEnv, useCenaPronta } from "../guia/assets3d";

/**
 * O celular 3D do reel "Cinco motivos pra ter CNPJ" (09/10/2026), com fundo transparente pra entrar no After Effects
 * (o AE desta máquina não renderiza modelo 3D). Mesmo aparelho e mesma luz do CelularSufoco.
 *
 * Tempo do VÍDEO, quadro 0 = T0:
 *   25,20 a 25,95  chega girando (o AE faz a entrada de posição e escala) e assenta olhando pro lado esquerdo
 *   tela 1         o imposto do mês calculado (impostos_pagar), no "o app calcula"
 *   30,35          gira e troca pra home ("Sua empresa nasceu"), no "a abertura é com a gente"
 *   40,15 a 40,6   sai girando antes do fecho
 * Renderizado a 120 quadros por segundo: a mistura de 4 subquadros em 30 dá o desfoque de movimento dos giros.
 */
export const T0 = 25.2;
export const TFIM = 40.6;
const TELA_W = 1290, TELA_H = 2796;
const TELAS = ["telas/impostos_pagar.png", "telas/home.png"];
const TROCA = 30.35;
const POSE = -14; // o celular fica à direita e olha pros cartões da esquerda

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOutCubic = (u: number) => 1 - (1 - u) ** 3;
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
  // brilho que atravessa o vidro: na chegada e na troca (o pico cobre a passagem de uma tela pra outra)
  for (const ts of [25.9, TROCA]) {
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
function rotacao(t: number) {
  let ry = chaves([[25.2, 78], [25.78, POSE - 6], [25.98, POSE]], t, easeOutCubic);
  let rx = chaves([[25.2, -16], [25.85, 0]], t, easeOutCubic);
  // a troca de tela no pico de um giro, e a saída girando
  ry += chaves([[TROCA - 0.22, 0], [TROCA, -41], [TROCA + 0.3, 5], [TROCA + 0.48, 0]], t);
  rx += chaves([[TROCA - 0.22, 0], [TROCA, -6], [TROCA + 0.28, 1.5], [TROCA + 0.45, 0]], t);
  ry += chaves([[40.12, 0], [40.6, -96]], t);
  // respiração nas pausas
  const resp = clamp01((t - 26.0) / 0.4) * (1 - clamp01((t - 40.0) / 0.12));
  rx += resp * 0.8 * Math.sin((2 * Math.PI * t) / 2.4);
  ry += resp * 1.1 * Math.sin((2 * Math.PI * t) / 3.1 + 0.7);
  return { rx, ry };
}

const Cena: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = T0 + frame / fps;
  const { gl, scene, camera, advance } = useThree();
  const [phone, setPhone] = useState<THREE.Object3D | null>(null);
  const [imgs, setImgs] = useState<HTMLImageElement[] | null>(null);
  useCenaPronta(!!phone && !!imgs, advance);
  useEffect(() => {
    loadGLB("3d/iphone.glb").then((s) => setPhone(s.clone(true)));
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
    cam.far = 200;
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [gl, scene, camera]);

  const tela = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = TELA_W;
    c.height = TELA_H;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = true;
    tex.anisotropy = 8;
    return { c, g: c.getContext("2d")!, tex };
  }, []);

  useMemo(() => {
    if (!phone) return;
    phone.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      // as malhas vêm em escala de centímetro: em 1 o aparelho fica no tamanho do CelularSufoco
      m.scale.setScalar(1);
      if (m.name === "Tela") m.material = new THREE.MeshBasicMaterial({ map: tela.tex, toneMapped: false });
    });
  }, [phone, tela]);

  if (!phone || !imgs) return null;
  pintaTela(tela.g, t, imgs);
  tela.tex.needsUpdate = true;
  const { rx, ry } = rotacao(t);
  phone.rotation.set(graus(rx), Math.PI + graus(ry), 0);
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[6, 9, 14]} intensity={1.5} />
      <directionalLight position={[-9, 3, -6]} intensity={1.1} color="#FFB49A" />
      <primitive object={phone} />
    </>
  );
};

export const CelularCinco: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 24, near: 1, far: 200, position: [0, 0, 54.9] }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false }}>
        <Cena />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
