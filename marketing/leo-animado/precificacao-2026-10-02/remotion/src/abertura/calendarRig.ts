import * as THREE from "three";
import type { ProceduralModelRuntime } from "./3d/createClayCalendarModel";

// Rig de interação do calendário (passada "interaction" do img2threejs): a página da frente
// passa a girar numa dobradiça no eixo das argolas (y = centro das argolas, logo à frente da face).
export const HINGE = new THREE.Vector3(0, 0.55, 0.17);

export function rigCalendarPage(model: THREE.Group): { hinge: THREE.Group; page: THREE.Object3D } {
  const rt = model.userData.sculptRuntime as ProceduralModelRuntime;
  const page = rt.nodes["page-front"];
  model.updateMatrixWorld(true);
  const hinge = new THREE.Group();
  hinge.name = "page-hinge";
  hinge.position.copy(HINGE);
  model.add(hinge);
  model.updateMatrixWorld(true);
  hinge.attach(page);
  return { hinge, page };
}

/** flip 0 = página fechada; 1 = página virada por cima das argolas (meia volta pra trás) */
export const setPageFlip = (hinge: THREE.Group, flip: number) => {
  hinge.rotation.x = -flip * Math.PI * 1.04;
};
