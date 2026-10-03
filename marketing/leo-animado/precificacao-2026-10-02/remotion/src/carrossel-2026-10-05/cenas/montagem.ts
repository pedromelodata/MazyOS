import * as THREE from "three";
import { FONE_CAIXA, type TelaCfg } from "../dados";
import type { Luz } from "../luz";
import type { Assets } from "../cena/assets";
import { acertaResolucao, criaFundo, criaMascara, mascaraVitrine, type Mascara } from "../cena/fundo";
import { SombraContato } from "../cena/sombra";
import { texRecorteApp, texSombraBlob, texTelaApp, type OpRecorte } from "../cena/texturas";
import { afastaDaTela, ajustaCentroX, caixaMundo, caixaTela, encaixa, encaixaVertical, minimoY, separaPreciso, type Caixa } from "../cena/camera";
import { carimbo, caneta, envelopeAberto, envelopeEmPe, pasta, pilha, prancheta } from "../objetos/papelaria";
import { despertador } from "../objetos/despertador";
import { cartao, contrato, iphone, lupa, moedaPessoa, placaUI, sino } from "../objetos/legalizai";

// Monta o palco de cada tela (revisão v3): luz e câmera iguais em todas, a vitrine em dois painéis, as duas
// sombras (contato e chave) presas aos painéis, e os objetos encaixados por caixas de tela. O aparelho fica
// travado na mesma caixa da capa à tela 5 (FONE_CAIXA); só o conteúdo muda. Os objetos do Tradicional são
// procedurais; só o iPhone (CC BY 4.0) pede crédito.

export type Montagem = {
  raiz: THREE.Group;
  antesDoRender: (gl: THREE.WebGLRenderer, scene: THREE.Scene) => void;
};

type Item = { nome: string; alvo?: Caixa; caixa: number[]; escala: number; chao: number };
type Ctx = { g: THREE.Group; a: Assets; cam: THREE.PerspectiveCamera; itens: Item[]; mascara: Mascara };

function registra(ctx: Ctx, nome: string, obj: THREE.Object3D, alvo?: Caixa) {
  const c = caixaTela(obj, ctx.cam);
  ctx.itens.push({ nome, alvo, caixa: c.map((v) => Math.round(v)), escala: Number(obj.getWorldScale(new THREE.Vector3()).x.toFixed(4)), chao: Number(minimoY(obj).toFixed(5)) });
}

function luzes(raiz: THREE.Group, luz: Luz) {
  // chave quente de cima, da esquerda e da frente, com a sombra suave (VSM)
  const chave = new THREE.DirectionalLight("#FFF6EE", luz.chave);
  chave.position.set(-0.45, 0.65, 0.55).multiplyScalar(1.6);
  chave.castShadow = true;
  chave.shadow.mapSize.set(2048, 2048);
  chave.shadow.radius = 10;
  chave.shadow.blurSamples = 16;
  chave.shadow.bias = -0.0004;
  const sc = chave.shadow.camera;
  sc.left = -0.34;
  sc.right = 0.34;
  sc.top = 0.34;
  sc.bottom = -0.34;
  sc.near = 0.3;
  sc.far = 3.4;
  sc.updateProjectionMatrix();
  raiz.add(chave, chave.target);
  // recorte de trás e da direita
  const recorte = new THREE.DirectionalLight("#FFE9DC", luz.recorte);
  recorte.position.set(0.5, 0.25, -0.4).multiplyScalar(1.6);
  raiz.add(recorte, recorte.target);
  raiz.add(new THREE.HemisphereLight("#FFFFFF", "#E7DED3", luz.hemisferio));
}

// ---------------------------------------------------------------------------------------------------------
// ajudantes

const POSE_FONE = -0.28; // virado pro lado Tradicional, em conversa

function aparelho(ctx: Ctx, nome = "iphone") {
  if (!ctx.a.iphone || !ctx.a.tela) throw new Error("tela sem iPhone carregado");
  const fone = iphone(ctx.a.iphone, texTelaApp(ctx.a.tela));
  fone.rotation.set(0, POSE_FONE, 0, "YXZ");
  ctx.g.add(fone);
  encaixa(fone, FONE_CAIXA, ctx.cam);
  registra(ctx, nome, fone, FONE_CAIXA);
  return fone;
}

let _blob: THREE.Texture | null = null;
const blobTex = () => (_blob ??= texSombraBlob());

/** sombra-blob deitada num plano horizontal (local do pai): carimbo na pilha, pé da lupa, caneta na prancheta */
function blob(ctx: Ctx, pai: THREE.Object3D, x: number, y: number, z: number, w: number, d: number, opacidade: number, giroY = 0) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    mascaraVitrine(new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, toneMapped: false, opacity: opacidade }), ctx.mascara),
  );
  m.rotation.set(-Math.PI / 2, 0, giroY);
  m.position.set(x, y, z);
  m.scale.set(w, d, 1);
  m.renderOrder = 1;
  m.userData.foraDaCaixa = true;
  m.userData.semSombra = true;
  m.castShadow = false;
  pai.add(m);
  return m;
}

/** sombra no chão de quem flutua: maior e mais desfocada conforme a altura, opacidade de 0,12 a 0,18 */
function sombraDeFlutuante(ctx: Ctx, obj: THREE.Object3D) {
  const b = caixaMundo(obj);
  const altura = Math.max(0, b.min.y);
  const larg = (b.max.x - b.min.x) * (1.15 + altura * 6);
  const prof = Math.max(0.03, (b.max.z - b.min.z) + 0.02) * (1.2 + altura * 6);
  const op = THREE.MathUtils.clamp(0.18 - altura * 0.6, 0.12, 0.18);
  blob(ctx, ctx.g, (b.min.x + b.max.x) / 2 + altura * 0.25, 0.0004, (b.min.z + b.max.z) / 2 - altura * 0.3, larg, prof, op);
}

/** placa flutuante na frente da metade de baixo do aparelho, de frente pra câmera */
function placaDaTela(ctx: Ctx, fone: THREE.Object3D, op: OpRecorte, corCorpo: string, alvo: Caixa, nome: string) {
  if (!ctx.a.tela) throw new Error("sem tela pra recortar");
  const p = placaUI(texRecorteApp(ctx.a.tela, op), op.largura, op.altura, op.raio, corCorpo);
  p.rotation.set(-0.2, -0.12, 0, "YXZ"); // de frente pra câmera (elevação de 12°), virada de leve pro meio
  ctx.g.add(p);
  encaixaVertical(p, alvo, ctx.cam, fone.position.z + 0.05, { escala: "largura", limites: [0.3, 3] });
  sombraDeFlutuante(ctx, p);
  registra(ctx, nome, p, alvo);
  return p;
}

// ---------------------------------------------------------------------------------------------------------
// Quadro 0 · Capa: pilha com formulário e carimbo no topo, despertador pequeno; iPhone com o splash.
function capa(ctx: Ctx) {
  const { g, cam } = ctx;
  aparelho(ctx);

  const p = pilha([0.013, 0.012, 0.014, 0.012], { doc: true, semente: 11 });
  p.rotation.y = 0.12;
  g.add(p);
  const aP: Caixa = [120, 955, 372, 1172];
  encaixa(p, aP, cam, { escala: "largura", limites: [0.85, 1.25] });
  registra(ctx, "pilha", p, aP);

  const car = carimbo();
  car.rotation.y = 0.25 - 0.12;
  car.position.set(0.006, p.userData.topo as number, 0.004);
  p.add(car);
  ajustaCentroX(car, 262, cam, "x", 0.02);
  blob(ctx, p, car.position.x + 0.005, (p.userData.topo as number) + 0.0003, car.position.z - 0.004, 0.056, 0.044, 0.45);
  registra(ctx, "carimbo", car);

  // despertador pequeno na frente e à direita da pilha (encosta sem atravessar)
  const rel = despertador(0.062);
  rel.rotation.y = 0.35;
  g.add(rel);
  const aR: Caixa = [300, 990, 450, 1176];
  encaixa(rel, aR, cam);
  separaPreciso(rel, p, "z", 0.001);
  registra(ctx, "despertador", rel, aR);
}

// Quadro 1 · Abrir a empresa: pasta em pé atrás da pilha com carimbo; iPhone com "Sua empresa nasceu".
function abrirEmpresa(ctx: Ctx) {
  const { g, cam } = ctx;
  const fone = aparelho(ctx);
  // card escuro "Sua empresa nasceu." com o CNPJ de exemplo e o "Cartão CNPJ" (o subtítulo fica de fora)
  placaDaTela(
    ctx,
    fone,
    {
      largura: 834,
      altura: 500,
      fundo: "#24262C",
      raio: 46,
      pedacos: [
        { sx: 72, sy: 209, sw: 834, sh: 153, dx: 0, dy: 0 },
        { sx: 72, sy: 497, sw: 834, sh: 347, dx: 0, dy: 153 },
      ],
    },
    "#24262C",
    [606, 912, 984, 1138],
    "placa-empresa-nasceu",
  );

  const pi = pilha([0.012, 0.013, 0.011, 0.012], { doc: true, semente: 5 });
  pi.rotation.y = -0.08;
  g.add(pi);
  const aPi: Caixa = [138, 990, 430, 1170];
  encaixa(pi, aPi, cam, { escala: "largura", limites: [0.9, 1.1] });
  registra(ctx, "pilha", pi, aPi);

  const pa = pasta();
  pa.rotation.set(-0.14, 0.2, 0, "YXZ"); // 8° pra trás
  pa.position.z = pi.position.z - 0.0525 * pi.scale.x - 0.01;
  g.add(pa);
  const aPa: Caixa = [118, 650, 366, 1120];
  encaixa(pa, aPa, cam, { soX: true });
  separaPreciso(pa, pi, "z", -0.001);
  registra(ctx, "pasta", pa, aPa);

  const car = carimbo();
  car.rotation.y = 0.3 + 0.08;
  car.position.set(0.014, pi.userData.topo as number, 0.004);
  pi.add(car);
  ajustaCentroX(car, 352, cam, "x", 0.02);
  blob(ctx, pi, car.position.x + 0.005, (pi.userData.topo as number) + 0.0003, car.position.z - 0.004, 0.056, 0.044, 0.45);
  registra(ctx, "carimbo", car);
}

// Quadro 2 · A guia do mês: despertador com envelope recuado; iPhone com a guia, o card de pagar e o sino.
function guiaDoMes(ctx: Ctx) {
  const { g, cam } = ctx;
  const fone = aparelho(ctx);
  // card "Vence dia 20 · Seu imposto de junho · R$ 178,31 · Pagar agora" (a parte vazia da direita fica de fora)
  placaDaTela(
    ctx,
    fone,
    { largura: 648, altura: 486, fundo: "#FEF3EE", raio: 46, borda: "#E3DED7", pedacos: [{ sx: 72, sy: 424, sw: 648, sh: 486, dx: 0, dy: 0 }] },
    "#FEF3EE",
    [612, 792, 980, 1068],
    "placa-pagar",
  );

  // sino coral colado no canto de cima à direita do aparelho (o "te avisa"), a 70 % e com folga da margem
  const si = sino();
  si.rotation.z = 0.3;
  si.scale.setScalar(0.7);
  g.add(si);
  const aS: Caixa = [790, 466, 978, 620];
  encaixaVertical(si, aS, cam, fone.position.z + 0.03, { escala: "cabe", limites: [0.5, 1.4] });
  sombraDeFlutuante(ctx, si);
  registra(ctx, "sino", si, aS);

  const rel = despertador(0.09);
  rel.rotation.y = 0.3;
  g.add(rel);
  const aR: Caixa = [212, 800, 448, 1168];
  encaixa(rel, aR, cam);
  registra(ctx, "despertador", rel, aR);

  // envelope de documento em pé, mais recuado, encostado atrás e à esquerda do despertador
  const env = envelopeEmPe();
  env.rotation.set(0, 0.32, -0.12, "YXZ");
  env.position.z = rel.position.z - 0.04;
  g.add(env);
  const aE: Caixa = [140, 800, 344, 1150];
  encaixa(env, aE, cam, { soX: true });
  separaPreciso(env, rel, "z", -0.001);
  registra(ctx, "envelope", env, aE);
}

// Quadro 3 · Quando o caso foge do padrão: pilha com a lupa em pé encostada; iPhone com "Declarações", o card
// "Apuração do Simples · Entregue" e a moeda com o sinal de pessoa (a gente de verdade continua).
function casoForaDoPadrao(ctx: Ctx) {
  const { g, cam } = ctx;
  const fone = aparelho(ctx);
  // "Apuração do Simples" e o selo "Entregue" do card do mês, alinhados na margem do card (ícone, descrição e
  // "Comprovante" ficam de fora pra o texto caber legível)
  placaDaTela(
    ctx,
    fone,
    {
      largura: 580,
      altura: 284,
      fundo: "#FFFFFF",
      raio: 46,
      borda: "#E3DED7",
      pedacos: [
        { sx: 272, sy: 858, sw: 500, sh: 64, dx: 40, dy: 48 },
        { sx: 104, sy: 1092, sw: 241, sh: 90, dx: 41, dy: 146 },
      ],
    },
    "#FFFFFF",
    [612, 930, 984, 1112],
    "placa-apuracao",
  );

  const mo = moedaPessoa();
  mo.rotation.set(-0.2, -0.18, 0, "YXZ");
  g.add(mo);
  const aM: Caixa = [618, 822, 712, 916];
  encaixaVertical(mo, aM, cam, fone.position.z + 0.055, { escala: "cabe", limites: [0.5, 1.6] });
  sombraDeFlutuante(ctx, mo);
  registra(ctx, "moeda-pessoa", mo, aM);

  const pi = pilha([0.012, 0.013, 0.012, 0.012], { doc: true, semente: 3 });
  pi.rotation.y = 0.1;
  g.add(pi);
  const aP: Caixa = [112, 975, 372, 1168];
  encaixa(pi, aP, cam, { escala: "largura", limites: [0.85, 1.2] });
  registra(ctx, "pilha", pi, aP);

  // lupa em pé, uns 25 % menor, encostada na quina direita da pilha: aro de frente pra câmera, cabo no chão
  const lu = lupa();
  lu.scale.setScalar(0.75);
  lu.rotation.set(0, 0, 0.24);
  lu.position.z = pi.position.z + 0.02;
  g.add(lu);
  const aL: Caixa = [270, 820, 390, 1170];
  encaixa(lu, aL, cam, { soX: true });
  separaPreciso(lu, pi, "x", 0.001);
  registra(ctx, "lupa", lu, aL);
}

// Quadro 4 · O que você paga: envelope aberto de três quartos com duas folhas; iPhone com o splash e os dois
// cartões separados saindo da tela.
function oQueVocePaga(ctx: Ctx) {
  const { g, cam, a } = ctx;
  const fone = aparelho(ctx);

  const cT = cartao("taxa", a.simbolo);
  cT.rotation.set(-0.16, -0.22, 0.03, "YXZ");
  g.add(cT);
  const aT: Caixa = [702, 708, 978, 886];
  encaixaVertical(cT, aT, cam, fone.position.z + 0.03, { escala: "largura", limites: [0.6, 1.4] });
  sombraDeFlutuante(ctx, cT);
  registra(ctx, "cartao-taxa", cT, aT);

  const cS = cartao("servico", a.simbolo);
  cS.rotation.set(-0.2, -0.12, -0.02, "YXZ");
  g.add(cS);
  const aS: Caixa = [608, 936, 902, 1124];
  encaixaVertical(cS, aS, cam, fone.position.z + 0.065, { escala: "largura", limites: [0.6, 1.4] });
  sombraDeFlutuante(ctx, cS);
  registra(ctx, "cartao-servico", cS, aS);

  const env = envelopeAberto();
  env.rotation.set(0, 0.52, 0, "YXZ"); // três quartos
  g.add(env);
  const aE: Caixa = [122, 760, 462, 1168];
  encaixa(env, aE, cam, { escala: "cabe", limites: [0.8, 1.3] });
  registra(ctx, "envelope-aberto", env, aE);
}

// Quadro 5 · Antes de assinar: prancheta com contrato e caneta; iPhone com o splash e o contrato inteiro saindo
// da tela, com a assinatura ainda em branco.
function antesDeAssinar(ctx: Ctx) {
  const { g, cam, a } = ctx;
  const fone = aparelho(ctx);

  const ct = contrato(a.simbolo);
  ct.rotation.set(-0.16, -0.14, 0, "YXZ");
  g.add(ct);
  const aC: Caixa = [608, 598, 982, 1142];
  encaixaVertical(ct, aC, cam, fone.position.z + 0.05, { escala: "cabe", limites: [0.6, 1.8] });
  sombraDeFlutuante(ctx, ct);
  registra(ctx, "contrato", ct, aC);

  const pr = prancheta();
  pr.rotation.set(-0.314, 0.15, 0, "YXZ"); // 18° pra trás
  const cn = caneta();
  cn.rotation.set(Math.PI / 2, 0, -0.7, "ZXY"); // deitada na folha, na diagonal, perto da linha de assinatura
  const zCaneta = (pr.userData.frente as number) + 0.0036;
  cn.position.set(0.002, 0.036, zCaneta);
  pr.add(cn);
  // sombra da caneta na folha (plano da folha, um pouco pra baixo e pra direita)
  const sh = blob(ctx, pr, 0.0066, 0.0302, (pr.userData.frente as number) + 0.0004, 0.09, 0.012, 0.78);
  sh.rotation.set(0, 0, -0.7);
  g.add(pr);
  const aPr: Caixa = [112, 640, 448, 1166];
  encaixa(pr, aPr, cam, { escala: "cabe", limites: [0.9, 1.25] });
  registra(ctx, "prancheta", pr, aPr);
  registra(ctx, "caneta", cn);
}

// Quadro 6 · Fecho: a pasta do escritório apoiada na quina do celular que mostra "Os papéis da sua empresa".
function fecho(ctx: Ctx) {
  const { g, cam } = ctx;
  if (!ctx.a.iphone || !ctx.a.tela) throw new Error("fecho sem iPhone");
  const fone = iphone(ctx.a.iphone, texTelaApp(ctx.a.tela));
  fone.rotation.set(0, -0.18, 0, "YXZ");
  g.add(fone);
  const aF: Caixa = [575, 262, 830, 840];
  encaixa(fone, aF, cam);
  registra(ctx, "iphone", fone, aF);

  const pa = pasta(3, true);
  pa.rotation.set(0, 0.32, -0.3, "YXZ"); // uns 17° na direção do aparelho, apoiada na quina
  g.add(pa);
  const aPa: Caixa = [338, 470, 604, 848];
  encaixa(pa, aPa, cam, { escala: "altura", limites: [0.8, 1.25] });
  afastaDaTela(pa, fone.userData.tela as THREE.Object3D, cam, 2);
  registra(ctx, "pasta", pa, aPa);
}

const CENAS = [capa, abrirEmpresa, guiaDoMes, casoForaDoPadrao, oQueVocePaga, antesDeAssinar, fecho];

export function montaTela(tela: TelaCfg, a: Assets, cam: THREE.PerspectiveCamera, luz: Luz): Montagem {
  const raiz = new THREE.Group();
  raiz.name = "palco";
  luzes(raiz, luz);
  const fundo = criaFundo(tela.fundo);
  raiz.add(fundo);
  const mascara = criaMascara(tela.fundo);

  // sombra projetada suave (VSM) recebida só pelo chão invisível, presa aos painéis
  const chao = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.6),
    mascaraVitrine(new THREE.ShadowMaterial({ opacity: 0.1, color: new THREE.Color("#2A2018"), depthWrite: false }), mascara),
  );
  chao.rotation.x = -Math.PI / 2;
  chao.position.y = 0.0001;
  chao.receiveShadow = true;
  chao.userData.foraDaCaixa = true;
  chao.userData.semSombra = true;
  raiz.add(chao);

  // sombra de contato (só do que toca o chão; o que flutua tem sombra-blob própria)
  const sombra = new SombraContato({}, (m) => mascaraVitrine(m, mascara));
  raiz.add(sombra.grupo);

  const objetos = new THREE.Group();
  objetos.name = "objetos";
  raiz.add(objetos);
  raiz.updateWorldMatrix(true, true);

  const ctx: Ctx = { g: objetos, a, cam, itens: [], mascara };
  CENAS[tela.n](ctx);

  // o que não entra no passe da sombra de contato: fundo, chão, planos marcados e tudo o que flutua
  const ocultar: THREE.Object3D[] = [];
  raiz.traverse((o) => {
    if (o.userData.semSombra && o.parent !== sombra.grupo) ocultar.push(o);
  });

  console.log("CARROSSEL " + JSON.stringify({ tela: tela.n, arquivo: tela.arquivo, itens: ctx.itens }));

  return {
    raiz,
    antesDoRender: (gl, scene) => {
      acertaResolucao(fundo, gl, mascara);
      sombra.render(gl, scene, ocultar);
    },
  };
}
