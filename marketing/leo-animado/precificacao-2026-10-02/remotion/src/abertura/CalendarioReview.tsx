import React, { useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { setImg2ThreeRerender } from "./img2three";
import { rigCalendarPage, setPageFlip } from "./calendarRig";
import {
  createClayCalendarBlockEnvironment,
  createClayCalendarBlockLookDevLights,
  createClayCalendarBlockModel,
  frameClayCalendarBlockCamera,
} from "./3d/createClayCalendarModel";

// Render de revisão do img2threejs: modelo gerado, câmera no enquadramento pedido, luz de look-dev,
// fundo papel e sombra de contato.
type Props = { azimuth: number; elevation: number; mode: "neutral" | "grazing" | "reference"; stripMaps?: boolean; margin?: number; flip?: number };

const Scene: React.FC<Props> = ({ azimuth, elevation, mode, stripMaps, margin, flip }) => {
  const { camera, gl, scene, advance } = useThree();
  useLayoutEffect(() => {
    setImg2ThreeRerender(() => advance(performance.now()));
    return () => setImg2ThreeRerender(null);
  }, [advance]);
  const model = useMemo(() => {
    const m = createClayCalendarBlockModel({ castShadow: true, receiveShadow: true });
    if (stripMaps) {
      // render "map-stripped" do Tier 1: sem mapas, cor dominante da receita de cada peça
      m.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const rgba = (mesh.userData.sculptComponent?.colorMaterialRecipe?.dominantAlbedo as string) ?? "rgba(200,200,200,1)";
        const [r, g, b] = rgba.replace(/[^\d,.]/g, "").split(",").map(Number);
        // sem luz e sem mapas: só a cor dominante da receita (evidência "unlit, map-stripped")
        const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(r / 255, g / 255, b / 255).convertSRGBToLinear() });
        mesh.material = mat;
      });
    }
    if (flip) setPageFlip(rigCalendarPage(m).hinge, flip);
    let tris = 0, draws = 0;
    m.traverse((o) => {
      const g = (o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
      if (!(o as THREE.Mesh).isMesh || !g) return;
      draws += 1;
      tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    });
    console.log(`MEDIDA_3D triangulos=${Math.round(tris)} drawcalls=${draws}`);
    // manifesto de peças pro check_part_coverage.py (dump do runtime do modelo construído)
    const rt = m.userData.sculptRuntime as { meshes: Record<string, THREE.Mesh> };
    const named = new Set(Object.values(rt.meshes));
    let unnamed = 0;
    m.traverse((o) => { if ((o as THREE.Mesh).isMesh && !named.has(o as THREE.Mesh) && o.type !== "Mesh") unnamed += 0; });
    m.traverse((o) => { if ((o as THREE.Mesh).isMesh && !named.has(o as THREE.Mesh)) unnamed += 1; });
    const parts = Object.entries(rt.meshes).map(([id, mesh]) => {
      const g = mesh.geometry as THREE.BufferGeometry;
      return { name: id, kind: "part", module: id, triangles: Math.round((g.index ? g.index.count : g.attributes.position.count) / 3) };
    });
    console.log("MANIFESTO_3D " + JSON.stringify({ model: "clay-calendar-block", parts, unnamedMeshes: unnamed, integralMeshes: parts.length }));
    return m;
  }, [stripMaps, flip]);
  const lights = useMemo(() => createClayCalendarBlockLookDevLights(mode), [mode]);
  useLayoutEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    scene.environment = createClayCalendarBlockEnvironment(gl);
    scene.background = new THREE.Color("#FAF8F5");
    frameClayCalendarBlockCamera(camera as THREE.PerspectiveCamera, model, { azimuthDeg: azimuth, elevationDeg: elevation, margin: margin ?? 1.25 });
  }, [camera, gl, scene, model, azimuth, elevation]);
  const box = new THREE.Box3().setFromObject(model);
  return (
    <>
      <primitive object={lights} />
      <primitive object={model} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, box.min.y - 0.001, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
    </>
  );
};

export const CalendarioReview: React.FC<Props> = (props) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#FAF8F5" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 30, position: [0, 0, 5] }} shadows>
        <Scene {...props} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
