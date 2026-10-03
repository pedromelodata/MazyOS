import * as THREE from "three";
import { C } from "../cores";

// Materiais (ESPEC 2.5). Argila fria e fosca no lado Tradicional; coral com clearcoat no lado Legalizaí.
// O vidro da lupa é por opacidade (a transmissão pode falhar no angle; ver VIDRO_TRANSMISSAO).

export const VIDRO_TRANSMISSAO = false;

const cache = new Map<string, THREE.Material>();
function memo<T extends THREE.Material>(chave: string, cria: () => T): T {
  let m = cache.get(chave) as T | undefined;
  if (!m) {
    m = cria();
    cache.set(chave, m);
  }
  return m;
}

/** argila: MeshPhysical, rugosidade 0,82, sheen 0,25, envMapIntensity 0,3 */
export function argila(cor: string, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}, chave = ""): THREE.MeshPhysicalMaterial {
  return memo("argila" + cor + chave, () =>
    new THREE.MeshPhysicalMaterial({
      color: cor,
      roughness: 0.82,
      metalness: 0,
      sheen: 0.25,
      sheenRoughness: 0.8,
      sheenColor: new THREE.Color("#FFFFFF"),
      envMapIntensity: 0.3,
      ...extra,
    }),
  );
}

/** lateral dos maços de papel: a textura traz o fio das folhas (em vez de 30 folhas de geometria que serrilham) */
export function papelLateral(mapa: THREE.Texture): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    map: mapa,
    color: "#FFFFFF",
    roughness: 0.86,
    metalness: 0,
    sheen: 0.2,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color("#FFFFFF"),
    envMapIntensity: 0.3,
  });
}

/** tinta da lupa (#2E3138): um pouco menos fosca pra ganhar um brilho de peça */
export function tintaLupa(): THREE.MeshPhysicalMaterial {
  return argila(C.lupa, { roughness: 0.55, envMapIntensity: 0.55, sheen: 0.1 }, "lupa");
}

/** coral 3D: base #E2532B com clearcoat (a face iluminada fica perto do #F2643C) */
export function coral3d(): THREE.MeshPhysicalMaterial {
  return memo("coral", () =>
    new THREE.MeshPhysicalMaterial({ color: C.coralBase3d, roughness: 0.42, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 0.6 }),
  );
}

/** vidro da lente */
export function vidro(): THREE.MeshPhysicalMaterial {
  return memo("vidro", () =>
    VIDRO_TRANSMISSAO
      ? new THREE.MeshPhysicalMaterial({ color: "#FFFFFF", roughness: 0.04, metalness: 0, transmission: 1, ior: 1.45, thickness: 0.0025, envMapIntensity: 1 })
      : new THREE.MeshPhysicalMaterial({
          color: "#FFFFFF",
          roughness: 0.05,
          metalness: 0,
          transparent: true,
          opacity: 0.25,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          envMapIntensity: 1.2,
          depthWrite: false,
        }),
  );
}

/** corpo das placas que flutuam (cartões, recortes do app): cor da superfície, clearcoat leve nas quinas */
export function corpoPlaca(cor: string): THREE.MeshPhysicalMaterial {
  return memo("placa" + cor, () =>
    new THREE.MeshPhysicalMaterial({ color: cor, roughness: 0.5, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.35, envMapIntensity: 0.5 }),
  );
}

/** face de interface (recorte da tela do app): sem luz e sem tone mapping, como a tela do aparelho */
export function faceUI(mapa: THREE.Texture): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ map: mapa, toneMapped: false, transparent: true, depthWrite: false });
}

/** papel com textura pintada (documentos, folha da prancheta, face dos cartões) */
export function papelPintado(map: THREE.Texture, cor = "#FFFFFF", extra: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ map, color: cor, roughness: 0.92, metalness: 0, envMapIntensity: 0.4, ...extra });
}
