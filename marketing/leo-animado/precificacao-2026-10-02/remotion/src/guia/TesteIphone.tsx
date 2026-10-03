import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { findMesh, loadGLB, loadImage, studioEnv, useCenaPronta } from "./assets3d";

// Teste de validação: iPhone e relógio com textura de teste na tela (descobrir orientação da UV),
// luz de estúdio e sombra no papel.
function texTeste(w: number, h: number, flipY: boolean) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = "#2b6cb0"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#F2643C"; g.fillRect(0, 0, w, h * 0.12);
  g.fillStyle = "#fff"; g.font = `800 ${Math.round(w * 0.16)}px Sora`; g.textAlign = "center";
  g.fillText("TOPO", w / 2, h * 0.1);
  g.fillText("ESQ", w * 0.22, h / 2);
  g.fillStyle = "#1B1E24"; g.fillText("BASE", w / 2, h * 0.95);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.flipY = flipY;
  return t;
}

const Cena: React.FC<{ ry: number; tela: string }> = ({ ry, tela }) => {
  const { gl, scene, camera, advance } = useThree();
  const [phone, setPhone] = useState<THREE.Object3D | null>(null);
  const [watch, setWatch] = useState<THREE.Object3D | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useCenaPronta(!!phone && !!img && !!watch, advance);
  useEffect(() => {
    loadGLB("3d/iphone.glb").then((s) => setPhone(s.clone(true)));
    loadGLB("3d/watch.glb").then((s) => setWatch(s.clone(true)));
    loadImage(tela).then(setImg);
  }, [tela]);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    scene.environment = studioEnv(gl);
    scene.environmentIntensity = 1.6;
    scene.background = new THREE.Color("#FAF8F5");
    camera.position.set(0, 0.02, 0.62);
    camera.lookAt(0, 0, 0);
  }, [gl, scene, camera]);
  useMemo(() => {
    if (!phone || !img || !watch) return;
    const c = document.createElement("canvas");
    c.width = 1290; c.height = 2796;
    c.getContext("2d")!.drawImage(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.flipY = true;
    findMesh(phone, "Tela")!.material = new THREE.MeshBasicMaterial({ map: t, toneMapped: false });
    const tw = findMesh(watch, "Tela");
    if (tw) tw.material = new THREE.MeshBasicMaterial({ map: texTeste(512, 512, true), toneMapped: false });
    // bbox do relógio pra entender escala e eixo
    const b = new THREE.Box3().setFromObject(watch);
    console.log("RELOGIO_BBOX", JSON.stringify({ min: b.min.toArray(), max: b.max.toArray() }));
    if (tw) { const bt = new THREE.Box3().setFromObject(tw); console.log("RELOGIO_TELA", JSON.stringify({ min: bt.min.toArray(), max: bt.max.toArray() })); }
  }, [phone, img, watch]);
  if (!phone || !img || !watch) return null;
  phone.rotation.set(0.05, Math.PI + ry, 0);
  phone.position.set(-0.03, 0, 0);
  watch.position.set(0.075, -0.02, 0.05);
  watch.scale.setScalar(1.6);
  return (
    <>
      <directionalLight position={[0.2, 0.6, 0.5]} intensity={1.4} />
      <primitive object={phone} />
      <primitive object={watch} />
    </>
  );
};

export const TesteIphone: React.FC<{ ry: number; tela: string }> = ({ ry, tela }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#FAF8F5" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 30, near: 0.01, far: 10 }} gl={{ antialias: true }}>
        <Cena ry={ry} tela={tela} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
