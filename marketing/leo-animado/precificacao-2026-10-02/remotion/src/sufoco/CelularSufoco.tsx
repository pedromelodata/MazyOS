import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { loadGLB, loadImage, studioEnv, useCenaPronta } from "../guia/assets3d";
import AG from "./agenda-v6.json";

/**
 * O celular 3D do reel de 09/10 (O sufoco burocrático real, versão 6), renderizado com fundo transparente pra
 * entrar no After Effects no lugar do celular chapado. O AE desta máquina não renderiza modelo 3D (erro \1).
 *
 * Tempo do VÍDEO (já com os 20 s das funcionalidades narradas, inseridos em 17,9 s): quadro 0 = T0.
 *   15,60 a 16,20  as peças chegam e se encaixam no contorno que a linha desenha (moldura, vidro de trás, tela)
 *   16,20          a tela acende; 16,24 a 17,12 os blocos da interface se montam (no tempo dos "pops" do mix)
 *   17,15 a 17,45  a home do app ("Sua empresa nasceu"); 17,12 a 17,90 o giro de produto
 *   17,95 a 37,9   as cinco funcionalidades (agenda-v6.json, gravada pelo gera.mjs): em cada cena o celular vai pra um
 *                  lado, olha pros assets (14 graus) e troca de tela no pico de um giro; no fim volta pro centro
 * Renderizado a 120 quadros por segundo: a mistura de 4 subquadros em 30 dá o desfoque de movimento dos giros.
 */
export const T0 = 15.55;
const TELA_W = 1290, TELA_H = 2796;

// ---------- curvas ----------
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOutCubic = (u: number) => 1 - (1 - u) ** 3;
const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2);
const easeInOutSine = (u: number) => -(Math.cos(Math.PI * u) - 1) / 2;
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
/** o "pulo" do gerador do AE: sobe passando do alvo e assenta */
function pulo(t: number, t0: number, d: number, a: number, b: number, passa: number) {
  const pk = b + (b - a) * passa;
  return chaves([[t0, a], [t0 + d * 0.62, pk], [t0 + d, b]], t, easeInOutSine);
}

// ---------- a tela ----------
const C = { coral: "#F2643C", coral1: "#FBDDD1", cinza3: "#ECE8E2", cinza4: "#F1EEE9", bezel: "#0E1014" };
// blocos da interface, no espaço da tela do AE (372 x 792, centro 0,0): x, y, w, h, raio, cor
const BLOCOS: [number, number, number, number, number, string][] = [
  [0, -300, 344, 92, 20, C.coral], [-104, -168, 120, 120, 60, C.coral1], [60, -194, 170, 26, 13, C.cinza3], [40, -150, 130, 20, 10, C.cinza4],
  [0, -10, 320, 160, 24, C.coral1], [0, 128, 320, 58, 16, C.cinza4], [0, 200, 320, 58, 16, C.cinza4], [0, 300, 290, 72, 36, C.coral],
];
const tBloco = (i: number) => 16.23 - 0.05 + ((i + 0.55) * 0.89) / 8;
export const TROCAS: number[] = AG.cenas.map((c) => c.troca);
const TELAS = ["telas/home.png", ...AG.cenas.map((c) => c.tela)];
const ESMAECE = [1, ...AG.cenas.map((c) => c.esmaece)];   // onde a base da tela começa a esmaecer (1 = não esmaece)
const POSE = AG.cenas.map((c) => (c.lado === "dir" ? -14 : 14)); // o celular olha pros assets

function retArred(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.arcTo(x + w, y, x + w, y + h, rr);
  g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr);
  g.arcTo(x, y, x + w, y, rr);
  g.closePath();
}

function pintaAviso(g: CanvasRenderingContext2D, t: number, a: number) {
  const u = clamp01((t - AG.aviso.t) / 0.32);
  if (u <= 0) return;
  const y = -280 + easeOutCubic(u) * 340;
  const x = 60, w = TELA_W - 120, h = 236;
  g.save();
  g.globalAlpha = a;
  g.shadowColor = "rgba(27,30,36,0.28)";
  g.shadowBlur = 48;
  g.shadowOffsetY = 14;
  g.fillStyle = "rgba(255,255,255,0.97)";
  retArred(g, x, y, w, h, 56);
  g.fill();
  g.shadowColor = "transparent";
  // o selo da marca
  g.fillStyle = C.coral;
  retArred(g, x + 44, y + 52, 132, 132, 34);
  g.fill();
  g.strokeStyle = "#FFFFFF";
  g.lineWidth = 17;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(x + 44 + 34, y + 52 + 70);
  g.lineTo(x + 44 + 58, y + 52 + 94);
  g.lineTo(x + 44 + 100, y + 52 + 44);
  g.stroke();
  g.fillStyle = "#1B1E24";
  g.font = "800 58px Sora";
  g.fillText(AG.aviso.titulo, x + 212, y + 104);
  g.fillStyle = "#5B5F69";
  g.font = "600 50px Sora";
  g.fillText(AG.aviso.texto, x + 212, y + 172);
  g.restore();
}

function pintaTela(g: CanvasRenderingContext2D, t: number, imgs: HTMLImageElement[]) {
  g.globalAlpha = 1;
  g.fillStyle = C.bezel;
  g.fillRect(0, 0, TELA_W, TELA_H);
  if (t < 16.17) return;
  // acende
  g.globalAlpha = clamp01((t - 16.17) / 0.07);
  g.fillStyle = "#FFFFFF";
  g.fillRect(0, 0, TELA_W, TELA_H);
  // os blocos (somem por baixo da home)
  const k = TELA_W / 372;
  const aBlocos = 1 - clamp01((t - 17.15) / 0.3);
  if (aBlocos > 0) {
    BLOCOS.forEach(([x, y, w, h, r, cor], i) => {
      const s = pulo(t, tBloco(i), 0.24, 0, 1, 0.12);
      if (s <= 0.001) return;
      const cx = TELA_W / 2 + x * k, cy = TELA_H / 2 + y * k;
      const ww = w * k * s, hh = h * k * s;
      g.globalAlpha = aBlocos;
      g.fillStyle = cor;
      retArred(g, cx - ww / 2, cy - hh / 2, ww, hh, r * k * s);
      g.fill();
    });
  }
  // a home e as telas das funcionalidades, cada troca escondida no meio do giro
  const aHome = clamp01((t - 17.15) / 0.3);
  if (aHome <= 0) return;
  let atual = 0;
  let mistura = 0;
  for (let i = 0; i < TROCAS.length; i++) {
    const ts = TROCAS[i];
    if (t >= ts + 0.03) atual = i + 1;
    else if (t > ts - 0.03) { atual = i; mistura = (t - (ts - 0.03)) / 0.06; break; }
    else break;
  }
  const pintaUma = (i: number, a: number) => {
    g.globalAlpha = a;
    g.drawImage(imgs[i], 0, 0, TELA_W, TELA_H);
    // a base esmaece em branco onde a tela pede: a barra de abas (com o botão de nota) e, na alíquota, a parte do
    // Fator R (P15: Fator R só na peça própria dele)
    const e0 = ESMAECE[i];
    if (e0 < 1) {
      const len = e0 < 0.5 ? 0.02 : 0.06;   // logo abaixo de um cartão o corte é curto
      const f = g.createLinearGradient(0, TELA_H * e0, 0, TELA_H * (e0 + len));
      f.addColorStop(0, "rgba(255,255,255,0)");
      f.addColorStop(1, "rgba(255,255,255,1)");
      g.fillStyle = f;
      g.fillRect(0, TELA_H * e0, TELA_W, TELA_H * (1 - e0));
    }
    // a notificação que desce no topo da tela de impostos (cena dos avisos)
    if (TELAS[i] === "telas/impostos.png") pintaAviso(g, t, a);
  };
  pintaUma(atual, aHome);
  if (mistura > 0 && imgs[atual + 1]) pintaUma(atual + 1, aHome * mistura);
  // o brilho que atravessa o vidro na troca: o pico cai bem na troca e cobre a passagem
  for (const ts of TROCAS) {
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

// ---------- o aparelho ----------
type Grupo = "frente" | "tras" | "corpo";
const graus = (d: number) => (d * Math.PI) / 180;

function rotacao(t: number) {
  let ry = 0, rx = 0;
  // a montagem: chega girado e endireita no contorno
  ry += chaves([[15.6, 18], [16.2, 0]], t, easeOutCubic);
  rx += chaves([[15.6, -10], [16.2, 0]], t, easeOutCubic);
  // o giro de produto do "Legalizaí"
  ry += chaves([[17.12, 0], [17.36, -24], [17.7, 4], [17.9, 0]], t);
  rx += chaves([[17.12, 0], [17.36, 9], [17.7, -2], [17.9, 0]], t);
  // as cenas das funcionalidades: em cada troca, gira passando do lado novo (a tela troca no pico, de lado) e
  // assenta olhando pros assets; no fim volta pro centro
  const kY: K[] = [[17.9, 0]];
  TROCAS.forEach((ts, i) => {
    const p = POSE[i], d = Math.sign(p);
    kY.push([ts - 0.2, kY[kY.length - 1][1]], [ts, p + 41 * d], [ts + 0.3, p - 5 * d], [ts + 0.48, p]);
  });
  kY.push([AG.TFIM - 0.5, POSE[POSE.length - 1]], [AG.TFIM - 0.02, 0]);
  ry += chaves(kY, t);
  TROCAS.forEach((ts) => { rx += chaves([[ts - 0.2, 0], [ts, -6], [ts + 0.28, 1.5], [ts + 0.45, 0]], t); });
  // respiração nas pausas
  const resp = clamp01((t - 17.95) / 0.4);
  rx += resp * 0.8 * Math.sin((2 * Math.PI * t) / 2.4);
  ry += resp * 1.1 * Math.sin((2 * Math.PI * t) / 3.1 + 0.7);
  return { rx, ry };
}

function deslocamento(grupo: Grupo, t: number) {
  // a moldura cresce primeiro, o vidro de trás encaixa por trás e a tela pousa pela frente, fechando em 16,2 s
  if (grupo === "frente") return { z: chaves([[15.85, -7], [16.2, 0]], t, easeOutCubic), s: 1 };
  if (grupo === "tras") return { z: chaves([[15.65, 7], [16.05, 0]], t, easeOutCubic), s: 1 };
  return { z: 0, s: chaves([[15.6, 0.9], [15.92, 1]], t, easeOutCubic) };
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

  // a tela como textura de canvas, repintada a cada quadro
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

  // as peças: classificadas pela profundidade (a frente do modelo é -Z)
  const pecas = useMemo(() => {
    if (!phone) return null;
    const lista: { o: THREE.Mesh; grupo: Grupo; z0: number }[] = [];
    phone.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.geometry.computeBoundingBox();
      const b = m.geometry.boundingBox!;
      const grupo: Grupo = m.name === "Tela" || b.max.z <= -0.5 ? "frente" : b.min.z >= 0.05 ? "tras" : "corpo";
      lista.push({ o: m, grupo, z0: m.position.z });
      if (m.name === "Tela") m.material = new THREE.MeshBasicMaterial({ map: tela.tex, toneMapped: false });
    });
    return lista;
  }, [phone, tela]);

  if (!phone || !imgs || !pecas) return null;
  pintaTela(tela.g, t, imgs);
  tela.tex.needsUpdate = true;
  const { rx, ry } = rotacao(t);
  phone.rotation.set(graus(rx), Math.PI + graus(ry), 0);
  for (const p of pecas) {
    const d = deslocamento(p.grupo, t);
    p.o.position.z = p.z0 + d.z;
    p.o.scale.setScalar(d.s);
  }
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[6, 9, 14]} intensity={1.5} />
      <directionalLight position={[-9, 3, -6]} intensity={1.1} color="#FFB49A" />
      <primitive object={phone} />
    </>
  );
};

export const CelularSufoco: React.FC = () => {
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
