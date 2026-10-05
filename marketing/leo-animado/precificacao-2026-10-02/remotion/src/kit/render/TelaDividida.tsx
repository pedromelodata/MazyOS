// Tela dividida do kit (05/10/2026; batida tela-dividida da extensão comum, canal st.canais.divisao): duas câmeras
// num quadro só. A câmera principal (st.cam) desenha na tela como sempre; a câmera 2 (x, y, z, tx, ty, tz e fov do
// canal, com a mesma deriva de mão da principal) desenha antes num render target do tamanho do drawing buffer, com
// MSAA, e um quadro por cima compõe a câmera 2 do lado dela da linha (a conta da linha é a do render/divisao.ts), com
// 1,5 px de borda suave.
//
// O Cena3DKit monta este componente só quando a composição tem a batida (fixo por composição, como o borrão da
// troca-lado no KitMotion). O useFrame de prioridade 1 assume o render do R3F: com k 0 ele só chama o mesmo
// gl.render(scene, camera) que o R3F chamaria, e o quadro sai igual ao de antes.
//
// Cuidados:
// - o render target leva a marca isXRRenderTarget, a mesma dos alvos do WebXR no three: com ela o three aplica o
//   tone mapping e a saída sRGB como na tela (sem ela, um render target recebe a cor linear, sem tone mapping, e a
//   mistura das sombras, da vitrine e da poeira sairia diferente da metade da câmera principal). A textura fica RGBA8
//   (formato fixo: é o do renderbuffer do MSAA) com os mesmos bytes que iriam pra tela, e a composição copia sem
//   converter;
// - o papel do kit (o fundo) é preso à câmera principal: a câmera 2 ganha um papel igual (a mesma malha e o mesmo
//   material) só durante o passe dela, e o da principal some nesse passe;
// - quem depende da câmera que desenha (as vitrines do palco de argila: os painéis e os planos de recorte da argila
//   fria) expõe userData.kitPorCamera, e a conta é refeita com a câmera de cada passe antes do render: o mapa de
//   sombra da luz chave corta a argila com esses planos antes de qualquer malha desenhar.
import React, { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cameraRender } from "../nucleo/pose";
import type { CamSt, Estado, PropsKit } from "../nucleo/tipos";
import { CANAL_DIVISAO, linhaDe } from "./divisao";

type PoeFundo = (bg: THREE.Mesh, cam: THREE.PerspectiveCamera, quente: number, t: number, fps: number) => void;

const num = (x: unknown, p: number) => (typeof x === "number" && isFinite(x) ? x : p);

/** meia largura da borda suave (px do quadro de 1080): a máscara vai de -0,75 a 0,75 px da linha */
const MEIA_BORDA = 0.75;

const VERT = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const FRAG = /* glsl */ `
uniform sampler2D uCam2;
uniform vec2 uRes;
uniform vec3 uLinha; // d = x * nx + y * ny - c, em px do quadro de 1080x1920; positiva do lado da câmera 2
uniform float uBorda;
void main() {
  float k = 1080.0 / uRes.x;
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) * k;
  float d = dot(uLinha.xy, px) - uLinha.z;
  float a = smoothstep(-uBorda, uBorda, d);
  if (a <= 0.0) discard;
  gl_FragColor = vec4(texture2D(uCam2, gl_FragCoord.xy / uRes).rgb, a);
}`;

/** refaz a conta de quem depende da câmera que desenha (userData.kitPorCamera), com a matriz dela em dia */
function preparaCamera(scene: THREE.Scene, cam: THREE.Camera) {
  cam.updateMatrixWorld(true);
  scene.traverse((o) => {
    const f = o.userData && (o.userData.kitPorCamera as ((c: THREE.Camera) => void) | undefined);
    if (typeof f === "function") f(cam);
  });
}

/** a câmera 2 do canal (os campos que faltam vêm da câmera da cena) */
function camera2(d: Record<string, number>, base: CamSt): CamSt {
  return {
    x: num(d.x, base.x), y: num(d.y, base.y), z: num(d.z, base.z),
    tx: num(d.tx, base.tx), ty: num(d.ty, base.ty), tz: num(d.tz, base.tz), fov: num(d.fov, base.fov),
  };
}

export const TelaDividida: React.FC<{ st: Estado; t: number; props: PropsKit; fundo: THREE.Mesh; poeFundo: PoeFundo }> = ({ st, t, props, fundo, poeFundo }) => {
  const { gl, scene, camera } = useThree();
  const r = useMemo(() => {
    const cam2 = new THREE.PerspectiveCamera(30, (props.largura || 1080) / (props.altura || 1920), 0.005, 20);
    cam2.name = "camera-2-tela-dividida";
    // o papel da câmera 2: a mesma geometria e o mesmo material (os uniformes do quadro são os mesmos)
    const fundo2 = new THREE.Mesh(fundo.geometry, fundo.material);
    fundo2.renderOrder = fundo.renderOrder;
    fundo2.frustumCulled = false;
    const rt = new THREE.WebGLRenderTarget(1, 1, {
      samples: 4,
      type: THREE.UnsignedByteType,
      format: THREE.RGBAFormat,
      colorSpace: THREE.SRGBColorSpace,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      generateMipmaps: false,
      depthBuffer: true,
      stencilBuffer: false,
    });
    (rt as unknown as { isXRRenderTarget: boolean }).isXRRenderTarget = true;
    // RGBA8 nos dois lados do MSAA: com a marca acima o three cria o renderbuffer em RGBA8, mas a textura sRGB sairia
    // SRGB8_ALPHA8, e a resolução do MSAA (blitFramebuffer) recusa formatos diferentes (a metade sairia preta)
    rt.texture.internalFormat = "RGBA8";
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uCam2: { value: rt.texture },
        uRes: { value: new THREE.Vector2(1080, 1920) },
        uLinha: { value: new THREE.Vector3(1, 0, 540) },
        uBorda: { value: MEIA_BORDA },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    quad.frustumCulled = false;
    const cenaQuad = new THREE.Scene();
    cenaQuad.add(quad);
    const camQuad = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    return { cam2, fundo2, rt, mat, quad, cenaQuad, camQuad, tam: new THREE.Vector2() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      r.rt.dispose();
      r.mat.dispose();
      r.quad.geometry.dispose();
    },
    [r],
  );

  useFrame(() => {
    const d = st.canais[CANAL_DIVISAO];
    const k = d ? num(d.k, 0) : 0;
    if (!(k > 0)) {
      gl.render(scene, camera);
      return;
    }
    const cam1 = camera as THREE.PerspectiveCamera;
    const { cam2, fundo2, rt, mat, cenaQuad, camQuad, tam } = r;
    gl.getDrawingBufferSize(tam);
    if (rt.width !== tam.x || rt.height !== tam.y) rt.setSize(tam.x, tam.y);

    // câmera 2: a do canal, com a deriva de mão da principal (a mesma conta do Cena3DKit)
    const c2 = cameraRender(camera2(d, props.camera), t, props);
    cam2.near = cam1.near;
    cam2.far = cam1.far;
    cam2.aspect = cam1.aspect;
    cam2.fov = c2.fov;
    if (cam2.parent !== scene) scene.add(cam2);
    cam2.position.set(c2.x, c2.y, c2.z);
    cam2.lookAt(c2.tx, c2.ty, c2.tz);
    cam2.updateProjectionMatrix();
    poeFundo(fundo2, cam2, st.luz.quente, t, props.fps);

    // passe da câmera 2, no render target (o papel da principal some nele)
    const alvo = gl.getRenderTarget();
    const fundoVis = fundo.visible;
    fundo.visible = false;
    preparaCamera(scene, cam2);
    gl.setRenderTarget(rt);
    gl.render(scene, cam2);
    gl.setRenderTarget(alvo);
    fundo.visible = fundoVis;
    scene.remove(cam2);

    // passe da principal, na tela (a conta de quem depende da câmera volta pra ela)
    preparaCamera(scene, cam1);
    gl.render(scene, cam1);

    // composição: a câmera 2 do lado dela da linha
    const L = linhaDe(num(d.ang, 90), num(d.px, 540), num(d.py, 960));
    const lado = num(d.lado, 1) < 0 ? -1 : 1;
    mat.uniforms.uLinha.value.set(lado * L.nx, lado * L.ny, lado * (L.nx * L.px + L.ny * L.py));
    (mat.uniforms.uRes.value as THREE.Vector2).copy(tam);
    const auto = gl.autoClear;
    gl.autoClear = false;
    gl.render(cenaQuad, camQuad);
    gl.autoClear = auto;
  }, 1);

  return null;
};
