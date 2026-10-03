import * as THREE from "three";
import { findMesh } from "../../guia/assets3d";
import { C } from "../cores";
import { coral3d, corpoPlaca, faceUI, papelPintado, tintaLupa, vidro } from "../cena/materiais";
import { texCartao, texContratoFrente, texContratoVerso, texMoedaPessoa, texSombraRet } from "../cena/texturas";
import { malha, placa, planoPapel, retArredondado } from "./base";

// Objetos do lado Legalizaí: o iPhone 3D de verdade (CC BY 4.0, polyman Studio) com a tela do app, o sino
// coral, a moeda com o sinal de pessoa, as placas com o recorte do app, os cartões "Serviço" e "Taxa do
// governo", as páginas do contrato e a lupa (a do lado Tradicional).

const MEIA_ALTURA = 0.079772; // caixa do GLB: y de -0,079771 a 0,079772
const FRENTE = 0.0064; // face da tela no rig (o modelo gira 180° pra tela olhar pra +z)

function vidroFrontal() {
  // vidro da frente inteiro, só reflexo: aditivo com difuso preto (o mesmo do guia)
  const w = 0.0748;
  const h = 0.1575;
  const r = 0.0105;
  const m = new THREE.Mesh(
    new THREE.ShapeGeometry(retArredondado(w, h, r), 12),
    new THREE.MeshStandardMaterial({ color: "#000000", roughness: 0.04, metalness: 0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: 1.3 }),
  );
  m.position.z = FRENTE + 0.0009;
  m.renderOrder = 5;
  m.userData.foraDaCaixa = true;
  m.userData.semSombra = true;
  return m;
}

/** iPhone em pé com a tela do app. Origem no meio da base (o pé do aparelho toca y = 0). */
export function iphone(glb: THREE.Object3D, telaTex: THREE.Texture) {
  const rig = new THREE.Group();
  rig.name = "iphone";
  const corpo = new THREE.Group();
  corpo.position.y = MEIA_ALTURA;
  const fone = glb.clone(true);
  fone.rotation.y = Math.PI;
  const tm = findMesh(fone, "Tela");
  if (tm) {
    // polygonOffset empurra a tela um tico pra trás: a ilha dinâmica, no mesmo plano, ganha sempre
    tm.material = new THREE.MeshBasicMaterial({ map: telaTex, toneMapped: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  } else {
    console.error("CARROSSEL_ERRO malha Tela não encontrada no iphone.glb");
  }
  fone.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = false;
    }
  });
  corpo.add(fone, vidroFrontal());
  rig.add(corpo);
  rig.userData.tela = tm;
  return rig;
}

/** marca o que flutua: fica fora do passe da sombra de contato e não projeta a sombra da chave (cada um ganha a
 *  sua sombra-blob no chão, maior e mais desfocada conforme a altura) */
export function flutua(o: THREE.Object3D) {
  o.traverse((x) => {
    x.userData.semSombra = true;
    const m = x as THREE.Mesh;
    if (m.isMesh) m.castShadow = false;
  });
  o.userData.flutua = true;
  return o;
}

/** sino coral (Lathe), badalo em tinta, argola e 2 arcos de toque. Origem no centro do sino. */
export function sino() {
  const g = new THREE.Group();
  g.name = "sino";
  const perfil: [number, number][] = [
    [0.024, 0],
    [0.0255, 0.0015],
    [0.0245, 0.0035],
    [0.021, 0.006],
    [0.018, 0.012],
    [0.0155, 0.02],
    [0.0135, 0.028],
    [0.011, 0.034],
    [0.0075, 0.038],
    [0.004, 0.04],
    [0.0001, 0.0405],
  ];
  const corpo = new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), 64);
  corpo.translate(0, -0.02, 0);
  const mat = coral3d();
  const ladoDuplo = mat.clone();
  ladoDuplo.side = THREE.DoubleSide;
  g.add(malha(corpo, ladoDuplo));
  g.add(malha(new THREE.SphereGeometry(0.005, 20, 14), tintaLupa(), 0, -0.0215, 0));
  g.add(malha(new THREE.TorusGeometry(0.0042, 0.0014, 12, 28), mat, 0, 0.0205 + 0.0034, 0));
  for (const lado of [-1, 1]) {
    const arco = new THREE.TorusGeometry(0.032, 0.0018, 10, 40, 0.9);
    arco.rotateZ(-0.45); // arco centrado no eixo +x
    const a = malha(arco, mat, 0, -0.002, 0);
    if (lado < 0) a.rotation.z = Math.PI;
    g.add(a);
  }
  return flutua(g);
}

/** moeda coral com o sinal de pessoa sem rosto (tela 3: a gente de verdade continua). Origem no centro, face pra +z. */
export function moedaPessoa() {
  const g = new THREE.Group();
  g.name = "moeda-pessoa";
  const R = 0.017;
  const borda = new THREE.CylinderGeometry(R, R, 0.0042, 72, 1);
  borda.rotateX(Math.PI / 2);
  g.add(malha(borda, coral3d()));
  const face = new THREE.Mesh(new THREE.CircleGeometry(R * 0.86, 72), papelPintado(texMoedaPessoa(), "#FFFFFF", { roughness: 0.6, envMapIntensity: 0.5 }));
  face.position.z = 0.0021 + 0.0002;
  g.add(face);
  return flutua(g);
}

/** sombra retangular macia atrás do que flutua na frente do aparelho (deslocada pra baixo e pra direita, pra onde
 *  a luz chave joga) */
function sombraAtras(w: number, h: number, opacidade: number, dz = -0.012) {
  const sh = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 1.42, h * 1.36),
    new THREE.MeshBasicMaterial({ map: texSombraRet(), transparent: true, depthWrite: false, opacity: opacidade, toneMapped: false }),
  );
  sh.position.set(0.004, -0.006, dz);
  sh.renderOrder = 2;
  sh.userData.foraDaCaixa = true;
  sh.userData.semSombra = true;
  return sh;
}

/** Placa que flutua com o recorte da tela do app (mesmos pixels): corpo de 2,4 mm na cor do card e a face sem
 *  luz por cima. Origem no centro da placa; largura em metros (a cena ajusta a escala pela caixa de tela). */
export function placaUI(tex: THREE.Texture, larguraPx: number, alturaPx: number, raioPx: number, corCorpo: string) {
  const g = new THREE.Group();
  g.name = "placa-app";
  const w = 0.1;
  const h = (w * alturaPx) / larguraPx;
  const r = (w * raioPx) / larguraPx;
  const esp = 0.0024;
  const bisel = 0.0005;
  const corpo = malha(placa(retArredondado(w - 2 * bisel, h - 2 * bisel, Math.max(0.0005, r - bisel)), esp, bisel), corpoPlaca(corCorpo));
  g.add(corpo);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), faceUI(tex));
  face.position.z = esp / 2 + 0.00025;
  face.renderOrder = 4;
  face.userData.foraDaCaixa = true;
  g.add(face);
  g.add(sombraAtras(w, h, 0.3));
  return flutua(g);
}

/** cartão 3D (0,085 x 0,054 x 0,004) com a face pintada; o corpo tem a cor da face (coral-50 ou #F1EEE9). Origem
 *  no centro do cartão. */
export function cartao(tipo: "servico" | "taxa", simbolo: HTMLImageElement) {
  const g = new THREE.Group();
  g.name = tipo === "servico" ? "cartao-servico" : "cartao-taxa";
  const W = 0.085;
  const H = 0.054;
  const E = 0.004;
  const bisel = 0.0007;
  g.add(malha(placa(retArredondado(W - 2 * bisel, H - 2 * bisel, 0.0053 - bisel), E, bisel), corpoPlaca(tipo === "servico" ? C.coral50 : C.ink100)));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W, H), papelPintado(texCartao(tipo, simbolo), "#FFFFFF", { transparent: true, alphaTest: 0.02, roughness: 0.55 }));
  face.position.z = E / 2 + 0.0002;
  face.renderOrder = 4;
  g.add(face);
  g.add(sombraAtras(W, H, 0.26));
  return flutua(g);
}

/** 4 páginas do contrato em leque aberto (a da frente legível, as de trás com a borda de cima à vista). Origem no
 *  meio da borda de baixo da página da frente. */
export function contrato(simbolo: HTMLImageElement) {
  const g = new THREE.Group();
  g.name = "contrato";
  const W = 0.068;
  const H = 0.096;
  // [textura, dx, dy, dz, giro em z]: recuos de 20 a 30 mm e giros de 5° a 8°, alternando o lado
  const paginas: [THREE.Texture, number, number, number, number][] = [
    [texContratoVerso(41), -0.009, 0.026, -0.03, 0.13],
    [texContratoVerso(13), 0.012, 0.02, -0.022, -0.1],
    [texContratoVerso(29), -0.006, 0.011, -0.012, 0.085],
    [texContratoFrente(simbolo), 0, 0, 0, -0.02],
  ];
  for (const [tex, dx, dy, dz, rz] of paginas) {
    const p = new THREE.Mesh(planoPapel(W, H, 5, 0.003), papelPintado(tex, "#F2ECE3", { roughness: 1, envMapIntensity: 0.45, side: THREE.DoubleSide }));
    p.position.set(dx, H / 2 + dy, dz);
    p.rotation.z = rz;
    p.add(sombraAtras(W, H, 0.26, -0.008));
    g.add(p);
  }
  return flutua(g);
}

/** lupa: aro de tinta, lente de vidro, colar e cabo. Origem no centro do aro; o cabo desce em -y. */
export function lupa() {
  const g = new THREE.Group();
  g.name = "lupa";
  const tinta = tintaLupa();
  g.add(malha(new THREE.TorusGeometry(0.022, 0.0035, 20, 72), tinta));
  const lente = new THREE.CylinderGeometry(0.0205, 0.0205, 0.0025, 64, 1);
  lente.rotateX(Math.PI / 2);
  const l = malha(lente, vidro());
  l.castShadow = false;
  l.renderOrder = 3;
  g.add(l);
  g.add(malha(new THREE.CylinderGeometry(0.0055, 0.0055, 0.01, 24), tinta, 0, -0.0295, 0));
  g.add(malha(new THREE.CylinderGeometry(0.0045, 0.0045, 0.055, 24), tinta, 0, -0.062, 0));
  g.add(malha(new THREE.SphereGeometry(0.0045, 20, 12), tinta, 0, -0.0895, 0));
  return g;
}
