import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadGLB, loadImage, studioEnv, useCenaPronta } from "../guia/assets3d";
import DADOS from "./prompt40.json";

/**
 * O iPhone 17 Pro Max 3D da batida "Você emite a nota e paga." do reel de 40 s pelo prompt do Pedro (13/10/2026), no
 * lugar da tela chapada presa com fita ("Tiressa essa tela esquisita e coloque o celular mesmo em 3D"). Quadro cheio
 * de 1080 x 1920 com fundo transparente, na mesma posição do vídeo (o Cinco40Prompt cola por cima, quadro a quadro).
 * Entra da quina de baixo à direita girando em 3D (como o teclado da referência), assenta girado 24 graus, flutua
 * sobre o papel com a sombra embaixo e escorrega devagar pra baixo e pra esquerda. Tela: "Nota emitida" (a nota de
 * verdade do app); no "paga." gira e troca pra guia do imposto do mês.
 * Renderizado a 240 quadros por segundo: o mistura-sub.py junta 8 subquadros em 1 (com 4, a entrada rápida saía em cópias).
 * Tempo em segundos desde o começo da batida (quadro 862 do reel).
 */
const TELA_W = 1290, TELA_H = 2796;
const TELAS = ["telas/notas_detalhe.png", "telas/impostos_pagar-conta.png"];
const POUSA = 0.36;
// o "paga." vem do prompt40.json (o quadro em que a palavra aparece, contado do começo da batida do celular), pra a
// troca de tela seguir a narração quando ela muda
const BATIDA = (DADOS as unknown as { batidas: { tipo: string; de: number; ate: number; troca?: number }[] }).batidas.find((b) => b.tipo === "cel3d")!;
export const QUADROS_CEL40 = (BATIDA.ate - BATIDA.de) * 8; // a 240 qps, 8 subquadros por quadro de 30
const TROCA = ((BATIDA.troca ?? BATIDA.de + 41) - BATIDA.de) / 30;
const DIST = 100; // câmera a 100 cm: 1 cm na altura do celular = 45,2 px
const PX = (2 * DIST * Math.tan((12 * Math.PI) / 180)) / 1920;
const ALVO: [number, number] = [600, 1110]; // centro do celular no quadro do reel

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
  // brilho que atravessa o vidro quando ele assenta e na troca
  for (const ts of [POUSA, TROCA]) {
    const u = (t - (ts - 0.21)) / 0.42;
    if (u <= 0 || u >= 1) continue;
    const x = -TELA_W * 0.6 + u * TELA_W * 2.2;
    const grad = g.createLinearGradient(x - 300, 0, x + 300, 0);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.5, `rgba(255,255,255,${0.6 * Math.sin(Math.PI * u)})`);
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
  // chegada: da quina de baixo à direita (fora do quadro) até o lugar, girando em 3D
  const u = easeOutQuart(clamp01(t / POUSA));
  const sx = 1420 + (ALVO[0] - 1420) * u, sy = 2220 + (ALVO[1] - 2220) * u;
  // depois de assentar, escorrega devagar pra baixo e pra esquerda (0,3 e 0,22 px por quadro de 30)
  const dr = Math.max(0, t - POUSA) * 30;
  const x = (sx - dr * 0.3 - 540) * PX, y = -(sy + dr * 0.22 - 960) * PX;
  let ry = chaves([[0, 78], [POUSA, 10], [POUSA + 0.16, 13]], t, easeOutCubic);
  let rx = chaves([[0, -34], [POUSA, -15], [POUSA + 0.16, -13]], t, easeOutCubic);
  const rz = chaves([[0, -62], [POUSA, -23], [POUSA + 0.16, -24]], t, easeOutCubic);
  // a troca de tela no pico de um giro
  ry += chaves([[TROCA - 0.2, 0], [TROCA, -32], [TROCA + 0.26, 4], [TROCA + 0.42, 0]], t);
  rx += chaves([[TROCA - 0.2, 0], [TROCA, -5], [TROCA + 0.26, 1.2], [TROCA + 0.42, 0]], t);
  // respiração
  const resp = clamp01((t - POUSA) / 0.3);
  rx += resp * 0.9 * Math.sin((2 * Math.PI * t) / 2.2);
  ry += resp * 1.2 * Math.sin((2 * Math.PI * t) / 2.9 + 0.7);
  return { rx, ry, rz, x, y };
}

const Cena: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
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
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFShadowMap;
    scene.background = null;
    scene.environment = studioEnv(gl);
    scene.environmentIntensity = 1.25;
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 24;
    cam.position.set(0, 0, DIST);
    cam.near = 1;
    cam.far = 400;
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

  const raiz = useMemo(() => {
    if (!modelo) return null;
    modelo.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
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

  // o papel atrás do celular só recebe a sombra (o resto fica transparente)
  const chao = useMemo(() => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(120, 160), new THREE.ShadowMaterial({ opacity: 0.15 }));
    m.position.set(0, 0, -3.4);
    m.receiveShadow = true;
    return m;
  }, []);
  const luz = useMemo(() => {
    const l = new THREE.DirectionalLight(0xffffff, 1.5);
    l.position.set(-16, 22, 34);
    l.castShadow = true;
    l.shadow.mapSize.set(2048, 2048);
    l.shadow.radius = 9;
    l.shadow.blurSamples = 24;
    const c = l.shadow.camera as THREE.OrthographicCamera;
    c.left = -30; c.right = 30; c.top = 40; c.bottom = -40; c.near = 1; c.far = 120;
    l.shadow.bias = -0.0004;
    return l;
  }, []);

  if (!raiz || !imgs) return null;
  pintaTela(tela.g, t, imgs);
  tela.tex.needsUpdate = true;
  const { rx, ry, rz, x, y } = pose(t);
  raiz.rotation.set(graus(rx), graus(ry), graus(rz), "ZXY");
  raiz.position.set(x, y, 0);
  luz.target.position.set(x, y, 0);
  luz.target.updateMatrixWorld();
  return (
    <>
      <ambientLight intensity={0.25} />
      <primitive object={luz} />
      <primitive object={luz.target} />
      <directionalLight position={[-9, 3, -6]} intensity={1.1} color="#FFB49A" />
      <primitive object={chao} />
      <primitive object={raiz} />
    </>
  );
};

export const Celular40Nota: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 24, near: 1, far: 400, position: [0, 0, DIST] }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false }}>
        <Cena />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
