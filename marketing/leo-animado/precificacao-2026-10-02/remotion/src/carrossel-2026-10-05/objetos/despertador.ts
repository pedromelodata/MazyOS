import * as THREE from "three";
import { C } from "../cores";
import { argila } from "../cena/materiais";
import { caixa, malha, suaviza } from "./base";

// Despertador de argila fria marcando 10:10 (ESPEC seção 5; v3: corpo e alça em frio-500, pés em frio-700, pra descolar do painel frio): corpo em disco com bisel, mostrador com 12
// marcas (as 4 maiores mais grossas), ponteiros com pino, 2 sinos em meia esfera a +-40°, martelinho, alça em
// arco atrás dos sinos e 2 pés inclinados. Origem no chão, no meio entre os pés. Face pra +z.

const R = 0.034; // raio do disco (sem o bisel)
const B = 0.004; // bisel
const P = 0.014; // profundidade
const YC = 0.0463; // centro do corpo (os pés tocam o chão)
const ALTURA_MODELO = YC + 0.03 + 0.022 + 0.0026; // topo da alça

export function despertador(altura: number) {
  const g = new THREE.Group();
  g.name = "despertador";
  const corpo = new THREE.Group();
  const circ = new THREE.Shape();
  circ.absarc(0, 0, R, 0, Math.PI * 2, false);
  const geo = new THREE.ExtrudeGeometry(circ, { depth: P, bevelEnabled: true, bevelThickness: B, bevelSize: B, bevelSegments: 6, curveSegments: 72 });
  geo.translate(0, 0, -P / 2);
  corpo.add(malha(suaviza(geo), argila(C.frio500)));
  const zf = P / 2 + B; // face da frente
  corpo.add(malha(new THREE.CircleGeometry(0.028, 72), argila(C.frio50), 0, 0, zf + 0.0002));
  for (let i = 0; i < 12; i++) {
    const grande = i % 3 === 0;
    const a = (i / 12) * Math.PI * 2;
    const rr = grande ? 0.0222 : 0.0234;
    const m = malha(caixa(grande ? 0.0026 : 0.0015, grande ? 0.006 : 0.004, 0.0008, 0.0004, 2), argila(C.frio700), Math.sin(a) * rr, Math.cos(a) * rr, zf + 0.0006);
    m.rotation.z = -a;
    corpo.add(m);
  }
  const ponteiro = (comp: number, larg: number, graus: number, z: number) => {
    const p = new THREE.Group();
    p.rotation.z = -THREE.MathUtils.degToRad(graus); // sentido horário a partir do 12
    p.position.z = z;
    p.add(malha(caixa(larg, comp, 0.0008, larg * 0.45, 2), argila(C.frio700), 0, comp / 2 - 0.003, 0));
    return p;
  };
  corpo.add(ponteiro(0.015, 0.0028, 305, zf + 0.001)); // horas: 10h10
  corpo.add(ponteiro(0.0215, 0.002, 60, zf + 0.0018)); // minutos: 10
  const pino = new THREE.CylinderGeometry(0.0018, 0.0018, 0.0016, 20);
  pino.rotateX(Math.PI / 2);
  corpo.add(malha(pino, argila(C.frio700), 0, 0, zf + 0.0024));
  corpo.position.y = YC;
  g.add(corpo);

  const a40 = THREE.MathUtils.degToRad(40);
  for (const lado of [-1, 1]) {
    const sino = new THREE.Group();
    sino.add(malha(new THREE.SphereGeometry(0.013, 36, 16, 0, Math.PI * 2, 0, Math.PI / 2), argila(C.frio400)));
    const fundo = new THREE.CircleGeometry(0.013, 36);
    fundo.rotateX(Math.PI / 2);
    sino.add(malha(fundo, argila(C.frio400)));
    sino.add(malha(new THREE.CylinderGeometry(0.0022, 0.0022, 0.008, 12), argila(C.frio500), 0, -0.004, 0));
    sino.position.set(lado * Math.sin(a40) * (R + 0.002), YC + Math.cos(a40) * (R + 0.002), -0.002);
    sino.rotation.z = -lado * a40;
    g.add(sino);
  }
  g.add(malha(new THREE.CylinderGeometry(0.0016, 0.0016, 0.01, 12), argila(C.frio500), 0, YC + R + B + 0.003, 0));
  g.add(malha(new THREE.SphereGeometry(0.0028, 16, 12), argila(C.frio500), 0, YC + R + B + 0.0085, 0));
  g.add(malha(new THREE.TorusGeometry(0.022, 0.0026, 12, 48, Math.PI), argila(C.frio500), 0, YC + 0.03, -0.009));

  const a35 = THREE.MathUtils.degToRad(35);
  const inc = THREE.MathUtils.degToRad(24);
  const L = 0.016;
  for (const lado of [-1, 1]) {
    const ax = lado * R * Math.sin(a35);
    const ay = YC - R * Math.cos(a35);
    const dx = lado * Math.sin(inc);
    const dy = -Math.cos(inc);
    const pe = malha(new THREE.CylinderGeometry(0.0026, 0.0034, L, 16), argila(C.frio700), ax + (dx * L) / 2, ay + (dy * L) / 2, 0);
    pe.rotation.z = lado * inc;
    g.add(pe);
    g.add(malha(new THREE.SphereGeometry(0.0038, 16, 12), argila(C.frio700), ax + dx * L, ay + dy * L, 0));
  }
  g.scale.setScalar(altura / ALTURA_MODELO);
  return g;
}
