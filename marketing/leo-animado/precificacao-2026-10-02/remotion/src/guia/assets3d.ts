import React from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { continueRender, delayRender, staticFile } from "remotion";

// Carregamento único (por aba do render) dos modelos e imagens, travando o quadro até ficar pronto.
const cache = new Map<string, Promise<unknown>>();

function once<T>(key: string, make: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) {
    const h = delayRender(`carregando ${key}`, { timeoutInMilliseconds: 120000 });
    const p = make().then(
      (v) => { continueRender(h); return v; },
      (e) => { console.error("falhou", key, e); continueRender(h); throw e; },
    );
    cache.set(key, p);
  }
  return cache.get(key) as Promise<T>;
}

export const loadGLB = (path: string) =>
  once(path, () => new GLTFLoader().loadAsync(staticFile(path)).then((g) => g.scene));

export const loadImage = (path: string) =>
  once(path, () => new Promise<HTMLImageElement>((ok, fail) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = fail;
    im.src = staticFile(path);
  }));

/**
 * Segura o quadro até a cena 3D ter sido DESENHADA com os assets carregados: o ThreeCanvas só redesenha
 * na troca de quadro, então quando o modelo chega é preciso forçar um `advance` e esperar dois rAF.
 * Sem isso o primeiro quadro de cada aba sai vazio (mesma armadilha da textura preta de 01/10).
 */
export function useCenaPronta(pronta: boolean, advance: (t: number) => void) {
  const [h] = React.useState(() => delayRender("cena 3D desenhada", { timeoutInMilliseconds: 120000 }));
  const feito = React.useRef(false);
  React.useLayoutEffect(() => {
    if (!pronta || feito.current) return;
    feito.current = true;
    advance(performance.now());
    requestAnimationFrame(() => requestAnimationFrame(() => { advance(performance.now()); continueRender(h); }));
  }, [pronta, advance, h]);
}

/** ambiente de estúdio (softboxes) pra reflexo no vidro e no titânio */
export function studioEnv(gl: THREE.WebGLRenderer) {
  const pm = new THREE.PMREMGenerator(gl);
  const env = pm.fromScene(new RoomEnvironment(), 0.035).texture;
  pm.dispose();
  return env;
}

/** acha um mesh pelo nome (os nomes em português foram dados na limpeza do modelo) */
export function findMesh(root: THREE.Object3D, name: string) {
  let found: THREE.Mesh | null = null;
  root.traverse((o) => { if (!found && o.name === name && (o as THREE.Mesh).isMesh) found = o as THREE.Mesh; });
  if (!found) {
    // o GLTFLoader às vezes põe o nome no nó pai e o mesh fica com sufixo
    root.traverse((o) => { if (!found && o.name.startsWith(name) && (o as THREE.Mesh).isMesh) found = o as THREE.Mesh; });
  }
  return found as THREE.Mesh | null;
}
