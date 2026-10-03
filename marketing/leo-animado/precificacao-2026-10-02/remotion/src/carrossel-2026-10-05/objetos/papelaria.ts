import * as THREE from "three";
import { C } from "../cores";
import { argila, papelLateral, papelPintado } from "../cena/materiais";
import { texFolhaContratoSocial, texFolhaEnvelope, texFolhaPrancheta, texFolhaTopo, texLinhasLateral } from "../cena/texturas";
import { caixa, malha, placa, placaRet, planoPapel, semente } from "./base";

// Objetos do lado Tradicional em argila fria (ESPEC seção 5, revisão v3), sempre arrumados, com dignidade de peça
// de arquivo: nada torto demais, nada sujo, nada em vermelho. Superfícies grandes em frio-500 e papel claro, pra
// descolar do painel frio (L* 83). Origem de cada um no meio da base (y = 0 no apoio).

/** pilha de papel em maços (3 a 4), cada um com o fio das folhas pintado na lateral: lê como papelada e não
 *  serrilha. Deslocamento de +-2 mm e giro de +-1,5° por maço. userData.topo = altura da face de cima. */
export function pilha(macos: number[], op: { doc?: boolean; semente?: number } = {}) {
  const g = new THREE.Group();
  g.name = "pilha";
  const rnd = semente(op.semente ?? 7);
  const topoMat = argila(C.papelFrio, {}, "papel-topo");
  let y = 0;
  let ultima: THREE.Mesh | null = null;
  macos.forEach((h, i) => {
    const lado = papelLateral(texLinhasLateral(Math.max(6, Math.round(h / 0.0011)), (op.semente ?? 7) * 10 + i));
    const geo = caixa(0.074, h, 0.105, 0.0012, 2);
    const m = new THREE.Mesh(geo, [lado, lado, topoMat, topoMat, lado, lado]);
    m.position.set((rnd() - 0.5) * 0.004, y + h / 2, (rnd() - 0.5) * 0.004);
    m.rotation.y = (rnd() - 0.5) * 0.052;
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    ultima = m;
    y += h;
  });
  if (op.doc && ultima) {
    // formulário na folha de cima (o topo da página fica do lado de trás, longe da câmera)
    const u = ultima as THREE.Mesh;
    const l = new THREE.Mesh(
      new THREE.PlaneGeometry(0.0715, 0.1015),
      papelPintado(texFolhaTopo(op.semente ?? 5), "#FFFFFF", { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    );
    l.rotation.x = -Math.PI / 2;
    l.position.y = (u.geometry as THREE.BufferGeometry & { parameters: { height: number } }).parameters.height / 2 + 0.0001;
    l.castShadow = false;
    l.receiveShadow = true;
    l.userData.foraDaCaixa = true;
    l.userData.semSombra = true;
    u.add(l);
  }
  g.userData.topo = y;
  return g;
}

/** pasta em pé: costas com aba no alto à esquerda, frente mais baixa, 3 folhas aparecendo acima da frente. Com
 *  docFrente, a folha da frente leva o cabeçalho "Contrato social" (rima com a primeira linha da tela de
 *  Documentos do app, no fecho) e as folhas sobem mais. */
export function pasta(folhas = 3, docFrente = false) {
  const g = new THREE.Group();
  g.name = "pasta";
  const W = 0.082;
  const HC = 0.11;
  const HF = 0.096;
  const E = 0.0035;
  const mat = argila(C.frio500);
  const costas = malha(placaRet(W, HC, E, 0.004, 0.0008), mat, 0, HC / 2, -0.003);
  costas.receiveShadow = true;
  g.add(costas);
  g.add(malha(placaRet(0.032, 0.018, E, 0.004, 0.0008), mat, -W / 2 + 0.006 + 0.016, HC + 0.004, -0.003));
  const frente = malha(placaRet(W, HF, E, 0.004, 0.0008), mat, 0, HF / 2, 0.003);
  frente.receiveShadow = true;
  g.add(frente);
  g.add(malha(caixa(W, 0.004, 0.0095, 0.0018), mat, 0, 0.002, 0));
  const tops = docFrente ? [0.121, 0.1175, 0.1235] : [0.11, 0.1075, 0.1115];
  const xs = [-0.0014, 0.0009, 0.0018];
  const zs = [-0.0007, 0, 0.0007];
  for (let i = 0; i < folhas; i++) {
    const h = 0.106;
    const k = i % 3;
    const f = malha(caixa(0.074, h, 0.0006, 0.0003, 2), argila(k === 1 ? "#FFFFFF" : C.papelFrio, {}, "folha" + k), xs[k], tops[k] - h / 2, zs[k]);
    f.receiveShadow = true;
    g.add(f);
    if (docFrente && k === 2) {
      // cabeçalho do documento na parte que fica à vista (a face da folha olha pra câmera)
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.072, 0.03), papelPintado(texFolhaContratoSocial(), "#FFFFFF", { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      d.position.set(xs[k], tops[k] - 0.016, zs[k] + 0.00036);
      d.castShadow = false;
      d.userData.foraDaCaixa = true;
      d.userData.semSombra = true;
      g.add(d);
    }
  }
  return g;
}

/** carimbo em pé: borracha, base, pescoço e pegador em gota (cerca de 0,064 de altura) */
export function carimbo() {
  const g = new THREE.Group();
  g.name = "carimbo";
  g.add(malha(caixa(0.037, 0.004, 0.025, 0.0012), argila(C.frio700), 0, 0.002, 0));
  g.add(malha(caixa(0.04, 0.016, 0.028, 0.004), argila(C.frio500), 0, 0.012, 0));
  g.add(malha(new THREE.CylinderGeometry(0.0055, 0.0055, 0.016, 32, 1), argila(C.frio400), 0, 0.028, 0));
  const perfil: [number, number][] = [
    [0.0055, 0],
    [0.0062, 0.003],
    [0.0085, 0.009],
    [0.0108, 0.015],
    [0.012, 0.0195],
    [0.0112, 0.0235],
    [0.0088, 0.0262],
    [0.005, 0.0277],
    [0.0001, 0.028],
  ];
  g.add(malha(new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), 48), argila(C.frio500), 0, 0.036, 0));
  return g;
}

/** caneta deitada ao longo de x (origem no meio; y é o "pra cima" da caneta): corpo escuro sobre o papel claro */
export function caneta() {
  const g = new THREE.Group();
  g.name = "caneta";
  const L = 0.088;
  const r = 0.0035;
  const ponta = 0.012;
  const corpoL = L - ponta - r;
  const corpo = new THREE.CylinderGeometry(r, r, corpoL, 28, 1);
  corpo.rotateZ(Math.PI / 2);
  g.add(malha(corpo, argila(C.frio700), -L / 2 + ponta + corpoL / 2, 0, 0));
  const cone = new THREE.ConeGeometry(r, ponta, 28, 1);
  cone.rotateZ(Math.PI / 2); // ponta pra -x
  g.add(malha(cone, argila(C.frio400), -L / 2 + ponta / 2, 0, 0));
  const tampa = new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  tampa.rotateZ(-Math.PI / 2); // cúpula pra +x
  g.add(malha(tampa, argila(C.frio700), -L / 2 + ponta + corpoL, 0, 0));
  g.add(malha(caixa(0.03, 0.0015, 0.0015, 0.0006, 2), argila(C.frio400), L / 2 - r - 0.017, r + 0.0006, 0));
  return g;
}

/** envelope de documento em pé (retrato, 0,070 x 0,105), fechado: aba em V no alto e o lacre na ponta */
export function envelopeEmPe() {
  const g = new THREE.Group();
  g.name = "envelope-documento";
  const W = 0.07;
  const H = 0.105;
  const E = 0.004;
  const corpo = malha(caixa(W, H, E, 0.0016), argila(C.papelFrio, {}, "envelope"), 0, H / 2, 0);
  corpo.receiveShadow = true;
  g.add(corpo);
  const ponta = H - 0.036;
  const tri = new THREE.Shape();
  tri.moveTo(-W / 2 + 0.0035, H - 0.003);
  tri.lineTo(W / 2 - 0.0035, H - 0.003);
  tri.lineTo(0, ponta);
  tri.closePath();
  const aba = malha(placa(tri, 0.0015, 0.0005, 4), argila(C.frio200), 0, 0, E / 2 + 0.00075);
  aba.receiveShadow = true;
  g.add(aba);
  const lacre = new THREE.CylinderGeometry(0.0075, 0.0075, 0.0022, 40, 1);
  lacre.rotateX(Math.PI / 2);
  g.add(malha(lacre, argila(C.frio500), 0, ponta + 0.0042, E / 2 + 0.0015 + 0.0011));
  return g;
}

/** envelope aberto em pé (paisagem, 0,105 x 0,070): a aba em V aberta pra trás, bem à vista, e duas folhas de
 *  documento saindo da boca (sem total e sem valor). Pra ver de três quartos, gira em y na cena. */
export function envelopeAberto() {
  const g = new THREE.Group();
  g.name = "envelope-aberto";
  const W = 0.105;
  const H = 0.07;
  const E = 0.006;
  const papel = argila(C.papelFrio, {}, "envelope");
  // frente e costas separadas (a boca fica aberta entre elas)
  const frente = malha(caixa(W, H, 0.0015, 0.0007), papel, 0, H / 2, E / 2);
  frente.receiveShadow = true;
  g.add(frente);
  const costas = malha(caixa(W, H, 0.0015, 0.0007), papel, 0, H / 2, -E / 2);
  costas.receiveShadow = true;
  g.add(costas);
  g.add(malha(caixa(0.0015, H, E, 0.0006), papel, -W / 2 + 0.0008, H / 2, 0));
  g.add(malha(caixa(0.0015, H, E, 0.0006), papel, W / 2 - 0.0008, H / 2, 0));
  g.add(malha(caixa(W, 0.0015, E, 0.0006), papel, 0, 0.0008, 0));
  // dobras em V da frente (relevo leve, dá a leitura de envelope)
  const v = new THREE.Shape();
  v.moveTo(-W / 2 + 0.003, 0.003);
  v.lineTo(0, H * 0.52);
  v.lineTo(W / 2 - 0.003, 0.003);
  v.lineTo(W / 2 - 0.006, 0.003);
  v.lineTo(0, H * 0.47);
  v.lineTo(-W / 2 + 0.006, 0.003);
  v.closePath();
  g.add(malha(placa(v, 0.0008, 0.0003, 2), argila(C.frio200), 0, 0, E / 2 + 0.0011));
  // aba aberta: triângulo pendurado na borda de cima das costas, virado pra trás e pra cima
  const tri = new THREE.Shape();
  tri.moveTo(-W / 2 + 0.003, 0);
  tri.lineTo(W / 2 - 0.003, 0);
  tri.lineTo(0, 0.05);
  tri.closePath();
  const dobra = new THREE.Group();
  dobra.position.set(0, H - 0.0006, -E / 2);
  dobra.rotation.x = -0.3; // aberta, inclinada uns 17° pra trás (aparece inteira da câmera a 12°)
  const aba = malha(placa(tri, 0.0012, 0.0004, 4), argila("#E4E8EC", {}, "aba-clara"));
  aba.receiveShadow = true;
  dobra.add(aba);
  g.add(dobra);
  // duas folhas saindo da boca, um pouco abertas em leque e mais estreitas que o envelope: os dois lados
  // inclinados da aba aberta ficam à vista
  const folhas: [number, number, number, number][] = [
    [-0.005, 0.03, -0.0012, 0.045],
    [0.006, 0.024, 0.0012, -0.035],
  ];
  folhas.forEach(([dx, sobe, dz, rz], i) => {
    const f = new THREE.Mesh(planoPapel(0.046, 0.072, 1.4, 0.0005), papelPintado(texFolhaEnvelope(11 + i * 7), "#FFFFFF", { side: THREE.DoubleSide }));
    f.position.set(dx, 0.036 + sobe, dz);
    f.rotation.z = rz;
    f.castShadow = true;
    f.receiveShadow = true;
    g.add(f);
  });
  return g;
}

/** prancheta em pé (face pra +z): placa frio-500, folha de contrato genérico e prendedor com argola */
export function prancheta() {
  const g = new THREE.Group();
  g.name = "prancheta";
  const W = 0.082;
  const H = 0.118;
  const E = 0.005;
  const placaM = malha(caixa(W, H, E, 0.004, 3), argila(C.frio500), 0, H / 2, 0);
  placaM.receiveShadow = true;
  g.add(placaM);
  const folha = new THREE.Mesh(new THREE.PlaneGeometry(0.072, 0.098), papelPintado(texFolhaPrancheta()));
  folha.position.set(0, 0.054, E / 2 + 0.0003);
  folha.castShadow = false;
  folha.receiveShadow = true;
  g.add(folha);
  g.add(malha(caixa(0.034, 0.012, 0.006, 0.002), argila(C.frio400), 0, 0.106, E / 2 + 0.0025));
  g.add(malha(new THREE.TorusGeometry(0.0055, 0.0013, 12, 28), argila(C.frio400), 0, 0.1185, E / 2 + 0.0025));
  g.userData.frente = E / 2 + 0.0003;
  return g;
}
