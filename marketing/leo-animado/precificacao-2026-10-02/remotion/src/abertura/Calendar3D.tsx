import React, { useLayoutEffect, useMemo, useState } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import { setImg2ThreeRerender } from "./img2three";
import {
  createClayCalendarBlockEnvironment,
  createClayCalendarBlockLookDevLights,
  createClayCalendarBlockModel,
  type ProceduralModelRuntime,
} from "./3d/createClayCalendarModel";
import { rigCalendarPage, setPageFlip } from "./calendarRig";

// Estado do calendário que a linha do tempo GSAP anima (o componente só lê).
export type CalState = {
  px: number; py: number; s: number; // centro na tela (px) e escala (1 = 448 px por unidade)
  rx: number; ry: number; rz: number; // rotação somada à pose 3/4 da referência
  sx: number; sy: number; // squash & stretch
  flip: number; // 0 = página SET na frente; 1 = virada
  pageVis: number; // a página SET some atrás das argolas no fim do giro
  marker: number; // 0..1 anel + etiqueta "dia 20"
  pulse: number; // soco no botão coral
  vis: number; // 0 some, 1 visível
};
export const newCal = (): CalState => ({ px: 540, py: 1100, s: 1.4, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, flip: 0, pageVis: 1, marker: 0, pulse: 0, vis: 1 });

const D = 8; // distância da câmera
const PX = 1920 / (2 * D * Math.tan((15 * Math.PI) / 180)); // px por unidade no plano z=0
const BASE_RX = 0.38;
const BASE_RY = 0.56; // pose 3/4 da referência (câmera az -34, el 24 na revisão do img2threejs)

function labelTexture(text: string, color: string, w = 512, h = 200, bg?: string) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, w, h);
  if (bg) {
    const r = h / 2;
    g.fillStyle = bg;
    g.beginPath(); g.moveTo(r, 0); g.lineTo(w - r, 0); g.arc(w - r, r, r, -Math.PI / 2, Math.PI / 2);
    g.lineTo(r, h); g.arc(r, r, r, Math.PI / 2, (3 * Math.PI) / 2); g.fill();
  }
  g.font = `800 ${Math.round(h * 0.62)}px Sora`;
  g.fillStyle = color;
  g.textBaseline = "middle";
  g.textAlign = bg ? "center" : "left";
  g.fillText(text, bg ? w / 2 : 10, h * 0.55);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

type Built = { model: THREE.Group; hinge: THREE.Group; ring: THREE.Mesh; tag: THREE.Sprite; accentOut: THREE.Object3D };

function build(): Built {
  const model = createClayCalendarBlockModel({ castShadow: true, receiveShadow: true });
  const rt = model.userData.sculptRuntime as ProceduralModelRuntime;
  const pageSet = rt.nodes["page-front"];
  // página de OUT: cópia da página, logo atrás; a de SET fica sem o botão coral (o mês novo ganha a marca)
  const pageOut = pageSet.clone(true);
  pageOut.position.z -= 0.006;
  model.add(pageOut);
  const beige = rt.meshes["stud-r1c3"].material;
  rt.meshes["stud-r2c3"].material = beige;
  let accentOut: THREE.Object3D = pageOut;
  pageOut.traverse((o) => { if (o.name.startsWith("Grid stud row 2 col 3") && (o as THREE.Mesh).isMesh) accentOut = o; });
  // rótulos de mês em Sora (no canto livre de cima da página)
  const mk = (text: string, color: string) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.172), new THREE.MeshStandardMaterial({ map: labelTexture(text, color), transparent: true, roughness: 0.9 }));
    m.position.set(-0.16, 0.24, 0.0195);
    return m;
  };
  pageSet.add(mk("SET", "#1B1E24"));
  pageOut.add(mk("OUT", "#DD4E27"));
  // anel coral em volta do botão de destaque da página de OUT e etiqueta "dia 20"
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.014, 16, 64), new THREE.MeshStandardMaterial({ color: "#E8603C", roughness: 0.8 }));
  ring.position.set(0.09, 0.105, 0.05);
  pageOut.add(ring);
  const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture("dia 20", "#FFFFFF", 512, 200, "#DD4E27"), depthTest: false }));
  tag.position.set(0.25, 0.3, 0.12);
  tag.scale.set(0.36, 0.14, 1);
  tag.renderOrder = 10;
  pageOut.add(tag);
  const { hinge } = rigCalendarPage(model);
  return { model, hinge, ring, tag, accentOut };
}

const Scene: React.FC<{ cal: CalState }> = ({ cal }) => {
  const { gl, scene, camera, advance } = useThree();
  const frame = useCurrentFrame();
  useLayoutEffect(() => {
    setImg2ThreeRerender(() => advance(performance.now()));
    return () => setImg2ThreeRerender(null);
  }, [advance]);
  const [fontsOk, setFontsOk] = useState(false);
  const [h] = useState(() => delayRender("fonte dos rótulos 3D"));
  useLayoutEffect(() => {
    document.fonts.load("800 100px Sora").then(() => { setFontsOk(true); continueRender(h); });
  }, [h]);
  const b = useMemo(() => (fontsOk ? build() : null), [fontsOk]);
  const lights = useMemo(() => createClayCalendarBlockLookDevLights("reference"), []);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.setClearColor(0x000000, 0);
    scene.environment = createClayCalendarBlockEnvironment(gl);
    scene.background = null;
    camera.position.set(0, 0, D);
    camera.lookAt(0, 0, 0);
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }, [gl, scene, camera]);
  if (!b) return null;
  // aplica o estado da linha do tempo (lido depois do seek do quadro atual)
  const t = frame / 30;
  const float = Math.sin(t * 2.1) * 0.012;
  b.model.position.set((cal.px - 540) / PX, (960 - cal.py) / PX + float, 0);
  b.model.rotation.set(BASE_RX + cal.rx, BASE_RY + cal.ry + Math.sin(t * 1.3) * 0.02, cal.rz, "YXZ");
  const k = cal.s * Math.max(0.0001, cal.vis);
  b.model.scale.set(k * cal.sx, k * cal.sy, k);
  b.model.visible = cal.vis > 0.001;
  setPageFlip(b.hinge, cal.flip);
  b.hinge.scale.set(1, Math.max(0.0001, cal.pageVis), Math.max(0.0001, cal.pageVis));
  b.hinge.visible = cal.pageVis > 0.001;
  b.ring.scale.setScalar(Math.max(0.0001, cal.marker));
  b.ring.rotation.z = (1 - cal.marker) * 2.4;
  b.tag.material.opacity = Math.min(1, cal.marker * 1.6);
  b.tag.scale.set(0.36 * (0.6 + 0.4 * cal.marker), 0.14 * (0.6 + 0.4 * cal.marker), 1);
  b.accentOut.scale.setScalar(1 + 0.3 * cal.pulse);
  return (
    <>
      <primitive object={lights} />
      <primitive object={b.model} />
    </>
  );
};

export const Calendar3D: React.FC<{ cal: CalState }> = ({ cal }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: 30, position: [0, 0, D], near: 0.1, far: 50 }} gl={{ alpha: true, antialias: true }}
      style={{ position: "absolute", inset: 0 }}>
      <Scene cal={cal} />
    </ThreeCanvas>
  );
};

export const CAL_PX = PX;
