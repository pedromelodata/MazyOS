import * as THREE from "three";
import { continueRender, delayRender, staticFile } from "remotion";

// Integração de runtime das fábricas do img2threejs com o Remotion:
// os mapas PBR vêm do /public (staticFile) e o quadro só é liberado depois que a textura carregou
// E a cena foi desenhada de novo com ela (senão o quadro sai com albedo preto e só o reflexo).
let rerender: (() => void) | null = null;
export const setImg2ThreeRerender = (fn: (() => void) | null) => {
  rerender = fn;
};
(globalThis as any).__img2threeTexLoad = (url: string) => {
  const h = delayRender(`textura ${url}`);
  const done = () => {
    rerender?.();
    requestAnimationFrame(() => {
      rerender?.();
      requestAnimationFrame(() => continueRender(h));
    });
  };
  return new THREE.TextureLoader().load(staticFile(url), done, undefined, done);
};
