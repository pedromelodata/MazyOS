// Luz do palco de argila (render). O palco usa a luz calibrada do carrossel de 05/10 (luz.ts do carrossel: exposição
// 0,78, ambiente 0,6, chave #FFF6EE 1,45 da esquerda e da frente, recorte #FFE9DC 1,25 de trás e da direita,
// hemisférica 0,32): com a luz do reel da guia a argila estourava (revisão v3 do carrossel). O Cena3DKit não tem luz
// por cena, então o palco ajusta a luz do kit antes de cada render (scene.onBeforeRender, que roda antes de o three
// juntar as luzes):
// - a direcional do kit da frente (0,3; 0,6; 0,6) apaga: quem faz a chave é a direcional do palco, com sombra VSM;
// - a direcional de trás do kit vira o recorte do carrossel; a hemisférica fica com 0,32;
// - ambiente da cena 0,6 e exposição 0,78.
// Só a cena que tem um palco muda (conteudo.luz null deixa a luz do kit): as composições antigas não usam o palco.
import * as THREE from "three";
import { LUZ_PADRAO } from "../objetos/argila";
import { MESA } from "./modelo";

export type CfgLuz = { exposicao: number; ambiente: number; chave: number; recorte: number; hemisferio: number };

export function cfgLuz(x?: Record<string, number>): CfgLuz {
  return { ...LUZ_PADRAO, ...(x || {}) } as CfgLuz;
}

/** a direcional chave do palco (a do carrossel), com a sombra suave VSM */
export function criaChave(cfg: CfgLuz): THREE.DirectionalLight {
  const chave = new THREE.DirectionalLight("#FFF6EE", cfg.chave);
  chave.position.set(-0.45 * 1.6, 0.65 * 1.6 + MESA, 0.55 * 1.6);
  chave.target.position.set(0, MESA, 0);
  chave.castShadow = true;
  chave.shadow.mapSize.set(2048, 2048);
  chave.shadow.radius = 10;
  chave.shadow.blurSamples = 16;
  chave.shadow.bias = -0.0004;
  const sc = chave.shadow.camera;
  sc.left = -0.3;
  sc.right = 0.3;
  sc.top = 0.3;
  sc.bottom = -0.3;
  sc.near = 0.3;
  sc.far = 3.4;
  sc.updateProjectionMatrix();
  chave.userData.palcoArgila = true;
  return chave;
}

/** varredura de luz fria sobre a argila (vitrine-luz): luz de área estreita que atravessa a vitrine fria */
export function criaVarreduraFria(): THREE.RectAreaLight {
  const l = new THREE.RectAreaLight("#E6EEF8", 0, 0.045, 0.22);
  l.userData.palcoArgila = true;
  return l;
}

/** instala o ajuste da luz do kit na cena (uma vez, quando o palco entra na cena) */
export function instalaLuz(raiz: THREE.Object3D, cfg: CfgLuz): void {
  const prende = () => {
    let cena: THREE.Object3D | null = raiz.parent;
    while (cena && !(cena as THREE.Scene).isScene) cena = cena.parent;
    if (!cena) return;
    const scene = cena as THREE.Scene;
    if (scene.userData.palcoArgilaLuz) return;
    scene.userData.palcoArgilaLuz = true;
    type Gancho = (...a: unknown[]) => void;
    const alvo = scene as unknown as { onBeforeRender: Gancho };
    const anterior = alvo.onBeforeRender;
    alvo.onBeforeRender = function (...a: unknown[]) {
      anterior.apply(scene, a);
      const renderer = a[0] as THREE.WebGLRenderer;
      renderer.toneMappingExposure = cfg.exposicao;
      scene.environmentIntensity = cfg.ambiente;
      for (const o of scene.children) {
        if (o.userData && o.userData.palcoArgila) continue;
        const dl = o as THREE.DirectionalLight;
        if (dl.isDirectionalLight) {
          if (dl.position.z > 0) {
            dl.intensity = 0; // a chave do kit: quem ilumina pela frente é a chave do palco
          } else {
            dl.position.set(0.5 * 1.6, 0.25 * 1.6, -0.4 * 1.6);
            dl.color.set("#FFE9DC");
            dl.intensity = cfg.recorte;
          }
          continue;
        }
        const hl = o as THREE.HemisphereLight;
        if (hl.isHemisphereLight) {
          hl.color.set("#FFFFFF");
          hl.groundColor.set("#E7DED3");
          hl.intensity = cfg.hemisferio;
        }
      }
    };
  };
  raiz.addEventListener("added", prende);
  if (raiz.parent) prende();
}
