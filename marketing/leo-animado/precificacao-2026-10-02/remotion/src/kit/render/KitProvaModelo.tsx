// Composição KitProvaModelo (dono K06; contrato: KIT/DESENHO.md, seções 1 (item 7) e 4.9): 1 quadro com a cena
// padrão (papel da marca, as luzes do guia e a sombra de contato) e UM modelo do catálogo vindo das props (GLB,
// procedural ou objeto do kit), enquadrado pela caixa, com ângulo e elevação pelas props. Escreve a caixa medida
// no log do navegador: console.log("CAIXA_MEDIDA", json). Desde 03/10 (frente MODELOS NO RENDER) o kit.py
// prova-modelos monta o objeto pelo montaProps (cli/prova-modelos.mjs) e roda com o public-kit, com os GLB do lote
// ligados em 3d/biblioteca/ só durante a prova (a biblioteca inteira nunca entra).
import React, { useEffect, useLayoutEffect, useState } from "react";
import { AbsoluteFill, cancelRender, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import "../../lib/font";
import { novaTelaKit, RETORNO_PADRAO } from "../nucleo/estado";
import { aplicaRig } from "../nucleo/pose";
import type { Estado, ObjetoProps, PropsKit } from "../nucleo/tipos";
import { studioEnv, useCenaPronta } from "./carrega";
import { arquivosDaCena, carregaRecursos, criaObjetos, fundo, poeFundo, poeSombra, sombra } from "./Cena3DKit";
import { fabricasDeObjetos } from "./ext";
import { PROPS_GUIA } from "./metadados";
import { texturaSombra } from "./pintores/texturas";
import type { ObjetoMontado } from "./tipos-render";

export type PropsProvaModelo = {
  objeto: ObjetoProps; // como nas props do KitMotion (tipo, arquivo no public, render do catálogo, conteudo...)
  angulo: number; // graus em volta do eixo vertical (0 = de frente, positivo gira a câmera pra direita)
  elevacao: number; // graus acima do horizonte
  margem?: number; // folga em volta da caixa (padrão 0,18)
  telas?: PropsKit["telas"]; // telas da cena, pro aparelho
  regioes?: PropsKit["regioes"];
  rotulo?: string | null; // texto pequeno no rodapé (por exemplo o id do modelo)
};

const POSE_NEUTRA = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, vis: 1 };

/** props mínimas pras fábricas (as do guia, sem batidas, com só este objeto) */
function propsDaProva(p: PropsProvaModelo): PropsKit {
  return {
    ...PROPS_GUIA,
    peca: "prova-modelo",
    titulo: "prova de modelo",
    objetos: [{ ...p.objeto, pose: { ...POSE_NEUTRA } }],
    telas: p.telas || {},
    regioes: p.regioes || {},
    batidas: [],
    camadas: [],
    ambiente: { ...PROPS_GUIA.ambiente, deriva: false, flutuacao: false, poeira: 0 },
  };
}

function estadoDaProva(props: PropsKit): Estado {
  const o = props.objetos[0];
  const telas: Estado["telas"] = {};
  const chaves = Object.keys(props.telas || {});
  if (o.tipo === "aparelho") telas[o.id] = novaTelaKit(o.telaInicial || chaves[0] || "apagada", RETORNO_PADRAO);
  return {
    cam: { ...props.camera },
    obj: { [o.id]: { ...POSE_NEUTRA, buzz: 0 } },
    telas,
    mostradores: o.tipo === "relogio" ? { [o.id]: { notif: 1, luz: 1 } } : {},
    luz: { varre: 0, quente: 0 },
    ui: { assina: 0, ai: 0, link: 0 },
    canais: {},
  };
}

const r6 = (x: number) => Math.round(x * 1e6) / 1e6;

/** caixa do objeto: só as malhas visíveis, sem as marcadas com userData.ignoraCaixa (a sombra retangular do
 *  papel); cada malha pelos vértices (precisa), no espaço do mundo */
function caixaDoObjeto(raiz: THREE.Object3D) {
  const caixa = new THREE.Box3();
  const visivel = (o: THREE.Object3D | null): boolean => (o ? o.visible && !o.userData.ignoraCaixa && visivel(o.parent) : true);
  const v = new THREE.Vector3();
  raiz.updateWorldMatrix(true, true);
  raiz.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !visivel(m)) return;
    const pos = m.geometry.getAttribute("position");
    if (!pos) return;
    for (let i = 0; i < pos.count; i++) caixa.expandByPoint(v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld));
  });
  return caixa;
}

type Montado = { item: ObjetoMontado; sombra: THREE.Mesh; bg: THREE.Mesh; caixa: THREE.Box3; esfera: THREE.Sphere; mesa: number; st: Estado; forca: number };

const CenaProva: React.FC<PropsProvaModelo> = (p) => {
  const { gl, scene, camera, advance } = useThree();
  const [m, setM] = useState<Montado | null>(null);
  useCenaPronta(!!m, advance);

  useEffect(() => {
    try {
      const props = propsDaProva(p);
      const fabricas = fabricasDeObjetos();
      const arq = arquivosDaCena(props.objetos, props, fabricas);
      carregaRecursos(arq)
        .then((recursos) => {
          const fecha = (objs: ObjetoMontado[]) => {
            const item = objs[0];
            const st = estadoDaProva(props);
            aplicaRig(item.raiz, props.objetos[0].pose, item.extraRy || 0);
            if (item.pinta) item.pinta(st, 0);
            item.raiz.updateMatrixWorld(true);
            const caixa = caixaDoObjeto(item.raiz);
            const esfera = caixa.getBoundingSphere(new THREE.Sphere());
            const tam = caixa.getSize(new THREE.Vector3());
            const o = props.objetos[0];
            const tm = o.texturaMalha;
            console.log("CAIXA_MEDIDA", JSON.stringify({
              id: o.id, modelo: o.modelo, tipo: o.tipo, arquivo: o.arquivo || null, escala: o.escala === undefined ? null : o.escala,
              rotacaoBase: o.rotacaoBase || null, flipYMalha: tm ? tm.flipY === true : null, conteudo: o.conteudo || null,
              min: caixa.min.toArray().map(r6), max: caixa.max.toArray().map(r6), tamanho: tam.toArray().map(r6),
              nota: "caixa das malhas visíveis do objeto montado, pelos vértices (com rotacaoBase e escala; no aparelho entra o vidro; sem a sombra retangular do papel)",
            }));
            const forca = typeof item.sombra === "number" ? item.sombra : o.sombra;
            setM({ item, sombra: sombra(texturaSombra(), caixa.min.y - 0.001), bg: fundo(), caixa, esfera, mesa: caixa.min.y - 0.001, st, forca });
          };
          const r = criaObjetos(props.objetos, props, fabricas, recursos, gl);
          if (Array.isArray(r)) fecha(r);
          else r.then(fecha).catch((e) => cancelRender(e));
        })
        .catch((e) => cancelRender(e));
    } catch (e) {
      cancelRender(e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    scene.environment = studioEnv(gl);
    scene.environmentIntensity = 1.45;
    scene.add(camera);
  }, [gl, scene, camera]);

  if (!m) return null;

  // câmera: olha o centro da caixa de fora da esfera, com a folga pedida
  const cam = camera as THREE.PerspectiveCamera;
  cam.fov = 30;
  const metadeV = THREE.MathUtils.degToRad(15);
  const metadeH = Math.atan(Math.tan(metadeV) * cam.aspect);
  const dist = (m.esfera.radius / Math.sin(Math.min(metadeV, metadeH))) * (1 + (p.margem === undefined ? 0.18 : p.margem));
  const az = THREE.MathUtils.degToRad(p.angulo || 0);
  const el = THREE.MathUtils.degToRad(p.elevacao || 0);
  const c = m.esfera.center;
  cam.position.set(c.x + Math.sin(az) * Math.cos(el) * dist, c.y + Math.sin(el) * dist, c.z + Math.cos(az) * Math.cos(el) * dist);
  cam.near = Math.max(0.001, dist / 200);
  cam.far = dist * 20;
  cam.lookAt(c.x, c.y, c.z);
  cam.updateProjectionMatrix();
  poeFundo(m.bg, cam, 0, 0, 30);
  m.item.raiz.updateMatrixWorld(true);
  poeSombra(m.sombra, m.item.alvoSombra || m.item.raiz, m.forca, m.mesa);

  return (
    <>
      <directionalLight position={[0.3, 0.6, 0.6]} intensity={1.1} />
      <directionalLight position={[-0.5, 0.25, -0.4]} intensity={1.6} color="#FFE9DC" />
      <hemisphereLight args={["#FFFFFF", "#E9DFD2", 0.35]} />
      <primitive object={m.item.raiz} />
      <primitive object={m.sombra} />
    </>
  );
};

export const KitProvaModelo: React.FC<PropsProvaModelo> = (p) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#FAF8F5" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 30, near: 0.005, far: 20, position: [0, 0, 0.66] }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <CenaProva {...p} />
      </ThreeCanvas>
      {p.rotulo ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 72, textAlign: "center", fontFamily: "Sora", fontWeight: 600, fontSize: 30, color: "#524E48", letterSpacing: "0.02em" }}>{p.rotulo}</div>
      ) : null}
    </AbsoluteFill>
  );
};

const aparelhoGuia = PROPS_GUIA.objetos.filter((o) => o.tipo === "aparelho")[0];

/** padrão: o celular do guia de frente, com a splash na tela */
export const PROPS_PROVA_PADRAO: PropsProvaModelo = {
  objeto: { ...aparelhoGuia, telaInicial: "splash", pose: { ...POSE_NEUTRA } },
  angulo: -20,
  elevacao: 8,
  margem: 0.18,
  telas: { splash: PROPS_GUIA.telas.splash },
  regioes: {},
  rotulo: "glb-video-iphone",
};
