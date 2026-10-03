import React, { useEffect, useLayoutEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cancelRender } from "remotion";
import { studioEnv, useCenaPronta } from "../../guia/assets3d";
import { C } from "../cores";
import type { TelaCfg } from "../dados";
import { carregaAssets } from "./assets";
import { configuraCamera } from "./camera";
import { montaTela, type Montagem } from "../cenas/montagem";
import type { Luz } from "../luz";

// Palco 3D de uma tela. Segura o quadro (useCenaPronta) até o GLB, a tela do app, as fontes e as texturas
// estarem prontos e a cena ter sido desenhada. A sombra de contato roda num useFrame de prioridade negativa
// (antes do render padrão do R3F, sem tomar conta do laço).

export const Palco: React.FC<{ tela: TelaCfg; luz: Luz }> = ({ tela, luz }) => {
  const { gl, scene, camera, advance } = useThree();
  const [m, setM] = useState<Montagem | null>(null);
  useCenaPronta(!!m, advance);

  useLayoutEffect(() => {
    gl.toneMapping = THREE.NeutralToneMapping; // não desbota o coral nem o papel
    gl.toneMappingExposure = luz.exposicao;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.VSMShadowMap;
    gl.shadowMap.needsUpdate = true;
    gl.setClearColor(C.papel, 1);
    const env = studioEnv(gl);
    scene.environment = env;
    scene.environmentIntensity = luz.ambiente;
    scene.background = null;
    configuraCamera(camera as THREE.PerspectiveCamera, tela.cam);
    return () => {
      env.dispose();
    };
  }, [gl, scene, camera, tela, luz]);

  useEffect(() => {
    let vivo = true;
    carregaAssets(tela.n)
      .then((a) => {
        if (!vivo) return;
        configuraCamera(camera as THREE.PerspectiveCamera, tela.cam); // o encaixe usa a câmera final
        setM(montaTela(tela, a, camera as THREE.PerspectiveCamera, luz));
      })
      .catch((e) => {
        console.error("CARROSSEL_ERRO", e);
        cancelRender(e instanceof Error ? e : new Error(String(e)));
      });
    return () => {
      vivo = false;
    };
  }, [tela, camera, luz]);

  useFrame((st) => {
    if (!m) return;
    configuraCamera(st.camera as THREE.PerspectiveCamera, tela.cam); // nada desfaz o deslocamento de lente
    m.antesDoRender(st.gl, st.scene);
  }, -1);

  if (!m) return null;
  return <primitive object={m.raiz} />;
};
