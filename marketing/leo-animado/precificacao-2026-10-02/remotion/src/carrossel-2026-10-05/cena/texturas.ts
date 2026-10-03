import * as THREE from "three";
import { C, SORA } from "../cores";

// Texturas pintadas em canvas (a Sora já está carregada antes: esperaSora no carregamento).
// Documentos do Tradicional com anatomia de formulário (cabeçalho em bloco, campos em caixa, assinatura), sempre
// sem número e sem valor. O contrato do Legalizaí tem a face limpa: título e três campos grandes. Os recortes do
// app são os mesmos pixels da tela aprovada (montada pelo monta.py), só emoldurados num cartão.

function tela(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, g: c.getContext("2d") as CanvasRenderingContext2D };
}

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + k, y);
  g.arcTo(x + w, y, x + w, y + h, k);
  g.arcTo(x + w, y + h, x, y + h, k);
  g.arcTo(x, y + h, x, y, k);
  g.arcTo(x, y, x + w, y, k);
  g.closePath();
}

function barra(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cor: string) {
  g.fillStyle = cor;
  rr(g, x, y, w, h, h / 2);
  g.fill();
}

function semente(s: number) {
  let v = s;
  return () => (v = (v * 16807) % 2147483647) / 2147483647;
}

function nova(c: HTMLCanvasElement, mip = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = true;
  t.anisotropy = 16;
  t.generateMipmaps = mip;
  t.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

function grao(g: CanvasRenderingContext2D, W: number, H: number, s: number, cor: string, n: number) {
  const rnd = semente(s);
  g.fillStyle = cor;
  for (let i = 0; i < n; i++) g.fillRect(rnd() * W, rnd() * H, 2, 2);
}

// ---------------------------------------------------------------------------------------------------------
// Tradicional

/** lateral de um maço de papel: n folhas em faixas de tom levemente diferente, com o fio entre elas */
export function texLinhasLateral(n: number, s = 1) {
  const W = 32;
  const H = 256;
  const { c, g } = tela(W, H);
  const rnd = semente(s * 97 + 13);
  const passo = H / n;
  for (let i = 0; i < n; i++) {
    const t = rnd();
    g.fillStyle = t < 0.3 ? "#E8ECF0" : t > 0.8 ? "#F4F6F8" : "#EEF1F4";
    g.fillRect(0, i * passo, W, passo + 1);
  }
  g.fillStyle = "rgba(92,100,110,0.42)";
  for (let i = 1; i < n; i++) g.fillRect(0, Math.round(i * passo + (rnd() - 0.5) * 2) - 1, W, 2);
  return nova(c);
}

type Campo = [string, number]; // rótulo, fração da largura da linha
type OpForm = {
  W: number;
  H: number;
  titulo: string;
  linhas: Campo[][];
  assinatura?: boolean;
  papel?: string;
  bloco?: string;
  borda?: string;
  tinta?: string;
  valor?: string;
  semente?: number;
};

/** formulário genérico: cabeçalho em bloco, campos em caixa com rótulo e valor em barra (sem número), linha de
 *  assinatura numa linha própria com o rótulo embaixo */
function pintaFormulario(g: CanvasRenderingContext2D, o: OpForm) {
  const { W, H } = o;
  const papel = o.papel ?? C.papelFrio;
  const bloco = o.bloco ?? "#D9DEE4";
  const borda = o.borda ?? "#9AA3AD";
  const tinta = o.tinta ?? C.frioTexto;
  const valor = o.valor ?? "#D3D8DE";
  g.fillStyle = papel;
  g.fillRect(0, 0, W, H);
  grao(g, W, H, o.semente ?? 3, "rgba(90,96,104,0.035)", Math.round((W * H) / 400));
  const m = Math.round(W * 0.075);
  const hb = Math.round(H * 0.1);
  // cabeçalho em bloco
  g.fillStyle = bloco;
  rr(g, m, m, W - 2 * m, hb, 10);
  g.fill();
  g.fillStyle = tinta;
  g.textAlign = "left";
  g.textBaseline = "alphabetic";
  g.font = `700 ${Math.round(hb * 0.42)}px ${SORA}`;
  g.fillText(o.titulo, m + hb * 0.35, m + hb * 0.66);
  // campos
  const rh = H * 0.105;
  const gap = H * 0.022;
  const gx = W * 0.025;
  let y = m + hb + H * 0.04;
  for (const linha of o.linhas) {
    let x = m;
    const util = W - 2 * m - gx * (linha.length - 1);
    for (const [rotulo, frac] of linha) {
      const w = util * frac;
      rr(g, x, y, w, rh, 10);
      g.strokeStyle = borda;
      g.lineWidth = Math.max(2, W * 0.0035);
      g.stroke();
      g.fillStyle = "#5D636B";
      g.font = `600 ${Math.round(rh * 0.22)}px ${SORA}`;
      g.fillText(rotulo, x + W * 0.03, y + rh * 0.36);
      barra(g, x + W * 0.03, y + rh * 0.56, Math.min(w - W * 0.06, w * 0.62), rh * 0.17, valor);
      x += w + gx;
    }
    y += rh + gap;
  }
  if (o.assinatura) {
    const ya = H - m - H * 0.085;
    g.fillStyle = "#6E767F";
    g.fillRect(W * 0.34, ya, W * 0.5, Math.max(2, W * 0.0035));
    g.font = `600 ${Math.round(W * 0.032)}px ${SORA}`;
    g.textAlign = "center";
    g.fillStyle = "#5D636B";
    g.fillText("Assinatura", W * 0.59, ya + W * 0.05);
    g.textAlign = "left";
  }
}

/** folha de cima da pilha (proporção 0,074 x 0,105): requerimento genérico (o topo fica do lado de trás) */
export function texFolhaTopo(s = 5) {
  const { c, g } = tela(740, 1050);
  pintaFormulario(g, {
    W: 740,
    H: 1050,
    titulo: "Requerimento",
    linhas: [[["Nome empresarial", 1]], [["Endereço", 0.62], ["Data", 0.38]], [["Atividade", 1]], [["Responsável", 1]]],
    assinatura: true,
    semente: s,
  });
  return nova(c);
}

/** folha da prancheta (0,072 x 0,098): contrato genérico com a assinatura em branco */
export function texFolhaPrancheta() {
  const { c, g } = tela(720, 980);
  pintaFormulario(g, {
    W: 720,
    H: 980,
    titulo: "Contrato",
    linhas: [[["Contratante", 0.6], ["Data", 0.4]], [["Contratada", 1]], [["Objeto", 1]]],
    assinatura: true,
    semente: 9,
  });
  return nova(c);
}

/** topo da folha da frente da pasta do fecho (0,072 x 0,03): cabeçalho "Contrato social", o mesmo documento
 *  que abre a lista da tela de Documentos do app (o papel do escritório e o PDF no app) */
export function texFolhaContratoSocial() {
  const W = 720;
  const H = 300;
  const { c, g } = tela(W, H);
  g.fillStyle = C.papelFrio;
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#D9DEE4";
  rr(g, 40, 34, W - 80, 104, 12);
  g.fill();
  g.fillStyle = C.frioTexto;
  g.font = `800 58px ${SORA}`;
  g.textAlign = "left";
  g.textBaseline = "alphabetic";
  g.fillText("Contrato social", 70, 107);
  barra(g, 40, 170, 560, 20, "#D3D8DE");
  barra(g, 40, 214, 470, 20, "#D3D8DE");
  barra(g, 40, 258, 520, 20, "#D3D8DE");
  return nova(c);
}

/** folha que sai do envelope (tela 4): documento genérico, sem total e sem valor */
export function texFolhaEnvelope(s: number) {
  const { c, g } = tela(600, 860);
  pintaFormulario(g, {
    W: 600,
    H: 860,
    titulo: "Documento",
    linhas: [[["Nome", 1]], [["Endereço", 1]], [["Assunto", 0.6], ["Data", 0.4]]],
    assinatura: false,
    semente: s,
  });
  return nova(c);
}

// ---------------------------------------------------------------------------------------------------------
// Legalizaí

/** papel quente com grão e contorno (base das páginas do contrato) */
function papelQuente(g: CanvasRenderingContext2D, W: number, H: number, s: number) {
  g.fillStyle = C.papelDoc;
  g.fillRect(0, 0, W, H);
  grao(g, W, H, s, "rgba(120,100,80,0.035)", 1700);
  g.strokeStyle = "rgba(80,56,30,0.16)";
  g.lineWidth = 4;
  g.strokeRect(2, 2, W - 4, H - 4);
}

/** frente do contrato (680 x 960): face limpa, só título e três campos grandes (rótulos de 58 px). CNPJ e CRC
 *  em barra de esqueleto (nenhum número sem fato no vault: P36). Assinatura em branco: nada se assina antes (F045). */
export function texContratoFrente(simbolo: HTMLImageElement) {
  const W = 680;
  const H = 960;
  const { c, g } = tela(W, H);
  papelQuente(g, W, H, 7);
  g.drawImage(simbolo, 44, 50, 66, 66);
  g.fillStyle = C.tinta;
  g.textAlign = "left";
  g.textBaseline = "alphabetic";
  g.font = `800 92px ${SORA}`;
  g.fillText("Contrato", 128, 114);
  g.fillStyle = C.tinta2;
  g.font = `600 44px ${SORA}`;
  g.fillText("de prestação de serviços", 44, 178);
  g.fillStyle = "rgba(82,78,72,0.28)";
  g.fillRect(44, 208, 592, 3); // régua numa linha própria, abaixo do título
  const caixa = (y: number) => {
    rr(g, 44, y, 592, 150, 16);
    g.strokeStyle = "rgba(82,78,72,0.7)";
    g.lineWidth = 4;
    g.stroke();
  };
  const rotulo = (t: string, y: number) => {
    g.fillStyle = C.tinta2;
    g.font = `600 58px ${SORA}`;
    g.fillText(t, 70, y);
  };
  caixa(236);
  rotulo("Contratada", 300);
  g.fillStyle = C.tinta;
  g.font = `800 62px ${SORA}`;
  g.fillText("Legalizaí", 70, 364);
  caixa(404);
  rotulo("CNPJ", 468);
  barra(g, 70, 498, 330, 32, "#E6DED3");
  caixa(572);
  rotulo("Registro no CRC", 636);
  barra(g, 70, 666, 270, 32, "#E6DED3");
  g.fillStyle = "rgba(82,78,72,0.6)";
  g.fillRect(150, 830, 380, 3);
  g.fillStyle = C.tinta3;
  g.font = `600 44px ${SORA}`;
  g.textAlign = "center";
  g.fillText("Assinatura", 340, 890);
  g.textAlign = "left";
  return nova(c);
}

/** páginas de trás do contrato: cabeçalho em bloco e cláusulas em caixa (só a borda de cima aparece no leque) */
export function texContratoVerso(s: number) {
  const W = 680;
  const H = 960;
  const { c, g } = tela(W, H);
  papelQuente(g, W, H, s);
  g.fillStyle = "#EFE5D8";
  rr(g, 44, 44, 592, 92, 12);
  g.fill();
  barra(g, 76, 74, 220, 26, "#DCD2C4");
  barra(g, 76, 108, 140, 14, "#E4DACD");
  const rnd = semente(s * 31 + 5);
  let y = 172;
  for (let b = 0; b < 3; b++) {
    const linhas = 4 + (b % 2);
    const h = 40 + linhas * 34;
    rr(g, 44, y, 592, h, 12);
    g.strokeStyle = "rgba(82,78,72,0.45)";
    g.lineWidth = 3;
    g.stroke();
    barra(g, 70, y + 22, 180 + rnd() * 80, 18, "#DCD2C4");
    for (let i = 0; i < linhas; i++) barra(g, 70, y + 58 + i * 34, i === linhas - 1 ? 220 + rnd() * 120 : 500 + rnd() * 30, 12, "#E7E0D6");
    y += h + 22;
  }
  return nova(c);
}

/** face dos cartões da tela 4 (900 x 572), com alfa fora do retângulo arredondado. "Serviço": coral-50 com o
 *  símbolo e borda coral. "Taxa do governo": #F1EEE9 com o prédio em tinta e borda #CBC5BC. Rótulo de 95 px,
 *  sem valor, sem botão e sem número (F020: só serviço e taxa separados). */
export function texCartao(tipo: "servico" | "taxa", simbolo: HTMLImageElement) {
  const W = 900;
  const H = 572;
  const { c, g } = tela(W, H);
  g.clearRect(0, 0, W, H);
  const servico = tipo === "servico";
  g.fillStyle = servico ? C.coral50 : C.ink100;
  rr(g, 0, 0, W, H, 56);
  g.fill();
  g.strokeStyle = servico ? C.coral : C.bordaTaxa;
  g.lineWidth = 8;
  rr(g, 4, 4, W - 8, H - 8, 52);
  g.stroke();
  if (servico) {
    g.drawImage(simbolo, 64, 60, 132, 132);
  } else {
    // prédio de colunas em tinta, num círculo claro (desenho genérico, sem brasão)
    const cx = 130;
    const cy = 126;
    g.beginPath();
    g.arc(cx, cy, 70, 0, Math.PI * 2);
    g.fillStyle = "#FBFAF7";
    g.fill();
    g.strokeStyle = C.bordaTaxa;
    g.lineWidth = 4;
    g.stroke();
    g.fillStyle = C.tinta;
    g.beginPath();
    g.moveTo(cx - 44, cy - 16);
    g.lineTo(cx + 44, cy - 16);
    g.lineTo(cx, cy - 46);
    g.closePath();
    g.fill();
    g.fillRect(cx - 40, cy - 13, 80, 8);
    for (const x of [-34, -16, 6, 24]) g.fillRect(cx + x, cy - 2, 10, 34);
    g.fillRect(cx - 46, cy + 34, 92, 9);
  }
  g.fillStyle = C.tinta;
  g.textAlign = "left";
  g.textBaseline = "alphabetic";
  g.font = `800 95px ${SORA}`;
  if (servico) {
    g.fillText("Serviço", 64, 478);
  } else {
    g.fillText("Taxa do", 64, 380);
    g.fillText("governo", 64, 478);
  }
  return nova(c);
}

/** face da moeda da tela 3 (512 x 512): sinal de pessoa sem rosto (cabeça e ombros), em tinta sobre coral-50 */
export function texMoedaPessoa() {
  const { c, g } = tela(512, 512);
  g.fillStyle = C.coral50;
  g.beginPath();
  g.arc(256, 256, 256, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(242,100,60,0.55)";
  g.lineWidth = 10;
  g.beginPath();
  g.arc(256, 256, 226, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = C.tinta2;
  g.beginPath();
  g.arc(256, 200, 66, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(130, 392);
  g.bezierCurveTo(130, 300, 190, 282, 256, 282);
  g.bezierCurveTo(322, 282, 382, 300, 382, 392);
  g.quadraticCurveTo(382, 402, 372, 402);
  g.lineTo(140, 402);
  g.quadraticCurveTo(130, 402, 130, 392);
  g.closePath();
  g.fill();
  return nova(c);
}

export type Pedaco = { sx: number; sy: number; sw: number; sh: number; dx: number; dy: number };
export type OpRecorte = { largura: number; altura: number; fundo: string; raio: number; borda?: string; pedacos: Pedaco[] };

/** recorte da tela do app (mesmos pixels) emoldurado num cartão: os pedaços vão pro canvas na posição dada, o
 *  fundo é a cor do próprio card, a borda (se o card tem) é refeita no contorno e tudo fora do retângulo
 *  arredondado fica transparente. Medidas em px da captura (1290 x 2796). */
export function texRecorteApp(img: HTMLImageElement, o: OpRecorte) {
  const { c, g } = tela(o.largura, o.altura);
  g.save();
  rr(g, 0, 0, o.largura, o.altura, o.raio);
  g.clip();
  g.fillStyle = o.fundo;
  g.fillRect(0, 0, o.largura, o.altura);
  for (const p of o.pedacos) g.drawImage(img, p.sx, p.sy, p.sw, p.sh, p.dx, p.dy, p.sw, p.sh);
  g.restore();
  if (o.borda) {
    g.strokeStyle = o.borda;
    g.lineWidth = 3;
    rr(g, 1.5, 1.5, o.largura - 3, o.altura - 3, o.raio - 1.5);
    g.stroke();
  }
  const t = nova(c);
  return t;
}

// ---------------------------------------------------------------------------------------------------------
// Sombras e tela

/** sombra suave arredondada (sombra-blob: carimbo na pilha, caneta na prancheta, o que flutua) */
export function texSombraBlob() {
  const { c, g } = tela(128, 128);
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, "rgba(40,30,20,0.5)");
  gr.addColorStop(0.5, "rgba(40,30,20,0.22)");
  gr.addColorStop(1, "rgba(40,30,20,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return nova(c, false);
}

/** sombra retangular suave atrás do que flutua na frente do aparelho (a mesma do guia de 14/10) */
export function texSombraRet() {
  const { c, g } = tela(256, 320);
  g.filter = "blur(18px)";
  g.fillStyle = "rgba(60,40,24,0.55)";
  g.fillRect(44, 44, 168, 232);
  return nova(c, false);
}

/** tela do app (captura montada pelo monta.py): 1290 x 2796, flipY verdadeiro, mipmap e anisotropia 16 */
export function texTelaApp(img: HTMLImageElement) {
  const t = new THREE.Texture(img);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = true;
  t.anisotropy = 16;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}
