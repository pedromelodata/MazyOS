import * as THREE from "three";

// Texturas desenhadas em canvas a cada quadro: tela do relógio (aviso de vencimento) e a guia de papel.
// Nada aqui é captura do app: o relógio mostra uma notificação do app espelhada (F040: a Legalizaí avisa
// prazos e vencimentos pelo app) e a guia é ilustração de um DAS com dados fictícios (ver PintorFolha).

const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));
const back = (t: number, s = 1.7) => { t = Math.min(1, Math.max(0, t)) - 1; return 1 + (s + 1) * t * t * t + s * t * t; };

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function novaTex(c: HTMLCanvasElement, flipY = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = flipY;
  t.anisotropy = 8;
  return t;
}

export type RelogioSt = { notif: number; luz: number };

export class PintorRelogio {
  c: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  icone: HTMLImageElement;
  constructor(icone: HTMLImageElement) {
    this.icone = icone;
    this.c = document.createElement("canvas");
    this.c.width = 420; // proporção da tela do Ultra (~0,82)
    this.c.height = 512;
    this.g = this.c.getContext("2d")!;
    this.tex = novaTex(this.c);
  }
  pinta(st: RelogioSt, t: number) {
    const g = this.g;
    const W = this.c.width;
    const H = this.c.height;
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
    // mostrador discreto antes do aviso: hora grande, sem marca
    const k = ease(st.notif);
    g.save();
    g.globalAlpha = 1 - k * 0.85;
    g.fillStyle = "#F4F1EC";
    g.font = "600 112px Sora";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("9:41", W / 2, H * 0.46 - k * 40);
    g.restore();
    if (st.notif > 0) {
      // cartão de notificação subindo de baixo, com o símbolo do app
      const y0 = H * (1 - back(st.notif, 1.2)) * 0.9;
      g.save();
      g.translate(0, y0);
      g.fillStyle = "#26272B";
      rr(g, 18, 70, W - 36, H - 120, 46);
      g.fill();
      g.drawImage(this.icone, 44, 96, 64, 64);
      g.fillStyle = "#BDB8B0";
      g.font = "600 28px Sora";
      g.textBaseline = "middle";
      g.fillText("LEGALIZAÍ", 124, 116);
      g.fillStyle = "#8E8A84";
      g.font = "500 24px Sora";
      g.fillText("agora", 124, 146);
      // só a informação nova do trecho: o dia, grande, numa linha só de conteúdo ("Guia do mês" e "Sua guia está
      // pronta" saíram: a narração e a legenda já dizem; auditoria de 01/10)
      g.fillStyle = "#F47F58";
      g.font = "800 88px Sora";
      g.fillText("Vence", 44, 262);
      g.fillText("dia 20.", 44, 352);
      g.restore();
    }
    if (st.luz < 1) {
      g.fillStyle = `rgba(0,0,0,${1 - Math.max(0, st.luz)})`;
      g.fillRect(0, 0, W, H);
    }
    this.tex.needsUpdate = true;
    void t;
  }
}

export type FolhaSt = { carimbo: number };

// A guia é um DAS do Simples Nacional desenhado com os campos e a ordem do modelo oficial (exemplo do "novo modelo
// do DAS" da Receita) e os dados fictícios do app (impostos/pagar/page.tsx): razão social e CNPJ do mock (o CNPJ tem
// DV inválido, não aponta pra empresa real), junho/2026, vence 20/07/2026 (dia 20 do mês seguinte, F077), R$ 178,31.
// Sem brasão, sem logo do Simples, sem "Receita Federal", sem marca nem coral da Legalizaí. O quadro "Composição"
// ficou fora: inventaria valor por tributo e deixaria a alíquota calculável (P13, P14).
// A linha digitável segue a estrutura FEBRABAN (858, valor, órgão 0328, campo livre) com o DV geral ERRADO DE
// PROPÓSITO (3 no lugar de 0): nenhum banco aceita, mesmo pausando o vídeo. As barras são decorativas, não codificam.
// Também de propósito: o DV do número do documento (8, o certo seria 0) e o do CNPJ (09, o certo seria 12). Nenhum
// identificador da guia é válido nem coincide com o DAS de alguém. NÃO CORRIGIR (revisão de regras de 01/10).
const TINTA = "#1B1E24";
const TINTA2 = "#524E48";
const PAPEL = "#FCF6EE";
const ROTULO_ESCURO = "rgba(252,246,238,0.78)";
const BORDA = "rgba(82,78,72,0.72)";
type Caixa = { x: number; y: number; w: number; h: number; raio: number; borda?: string; cor?: string };
type Linha = { t: string; x: number; y: number; f: string; c: string; a: CanvasTextAlign };
const CAIXAS: Caixa[] = [
  { x: 44, y: 158, w: 632, h: 82, borda: BORDA, raio: 12 }, // razão social
  { x: 44, y: 252, w: 300, h: 82, borda: BORDA, raio: 12 }, // CNPJ
  { x: 356, y: 252, w: 320, h: 82, borda: BORDA, raio: 12 }, // período de apuração
  { x: 44, y: 346, w: 300, h: 82, borda: BORDA, raio: 12 }, // data de vencimento
  { x: 356, y: 346, w: 320, h: 82, borda: BORDA, raio: 12 }, // número do documento
  { x: 44, y: 446, w: 300, h: 132, cor: TINTA, raio: 14 }, // pagar este documento até
  { x: 356, y: 446, w: 320, h: 132, cor: TINTA, raio: 14 }, // valor total
  { x: 44, y: 596, w: 632, h: 100, borda: BORDA, raio: 12 }, // observações (vazio, como no documento real)
];
const LINHAS: Linha[] = [
  { t: "Documento de Arrecadação", x: 44, y: 82, f: "700 38px Sora", c: TINTA, a: "left" },
  { t: "do Simples Nacional", x: 44, y: 128, f: "700 38px Sora", c: TINTA, a: "left" },
  { t: "Razão Social", x: 62, y: 186, f: "700 18px Sora", c: TINTA2, a: "left" },
  { t: "ANA BEATRIZ RAMOS DESENV. DE SOFTWARE", x: 62, y: 224, f: "700 22px Sora", c: TINTA, a: "left" },
  { t: "CNPJ", x: 62, y: 280, f: "700 18px Sora", c: TINTA2, a: "left" },
  { t: "54.321.000/0001-09", x: 62, y: 318, f: "700 24px Sora", c: TINTA, a: "left" },
  { t: "Período de Apuração", x: 374, y: 280, f: "700 18px Sora", c: TINTA2, a: "left" },
  { t: "Junho/2026", x: 374, y: 318, f: "700 24px Sora", c: TINTA, a: "left" },
  { t: "Data de Vencimento", x: 62, y: 374, f: "700 18px Sora", c: TINTA2, a: "left" },
  { t: "20/07/2026", x: 62, y: 412, f: "700 24px Sora", c: TINTA, a: "left" },
  { t: "Número do Documento", x: 374, y: 374, f: "700 18px Sora", c: TINTA2, a: "left" },
  { t: "07.20.26182.5730941-8", x: 374, y: 412, f: "700 22px Sora", c: TINTA, a: "left" },
  { t: "Pagar este documento até", x: 62, y: 480, f: "600 18px Sora", c: ROTULO_ESCURO, a: "left" },
  { t: "20/07/2026", x: 62, y: 548, f: "800 36px Sora", c: PAPEL, a: "left" },
  { t: "Valor Total do Documento", x: 374, y: 480, f: "600 18px Sora", c: ROTULO_ESCURO, a: "left" },
  { t: "R$ 178,31", x: 374, y: 548, f: "800 36px Sora", c: PAPEL, a: "left" },
  { t: "Observações", x: 62, y: 624, f: "700 18px Sora", c: TINTA2, a: "left" },
  { t: "AUTENTICAÇÃO MECÂNICA", x: 676, y: 944, f: "700 16px Sora", c: TINTA2, a: "right" },
];
const LINHA_DIGITAVEL = "85830000001 7  78310328262 6  01072026182 9  57309418419 1";

/** código de barras decorativo (não codifica nada): ritmo de barras finas e grossas, semente fixa (não pisca) */
function barras(g: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number) {
  let s = 20260720;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const FINA = 3;
  const GROSSA = 7;
  const ESP = 3;
  const ESP_L = 6;
  const fim = x0 + w;
  g.fillStyle = TINTA;
  let x = x0;
  for (let i = 0; i < 2; i++) {
    g.fillRect(x, y0, FINA, h);
    x += FINA + ESP;
  }
  for (;;) {
    const b = rnd() < 0.42 ? GROSSA : FINA;
    const e = rnd() < 0.4 ? ESP_L : ESP;
    if (x + b + e > fim - (GROSSA + ESP + FINA)) break;
    g.fillRect(x, y0, b, h);
    x += b + e;
  }
  g.fillRect(fim - FINA, y0, FINA, h);
  g.fillRect(fim - FINA - ESP - GROSSA, y0, GROSSA, h);
}

export class PintorFolha {
  c: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  private pintada = false;
  constructor() {
    this.c = document.createElement("canvas");
    this.c.width = 720;
    this.c.height = 1016; // proporção da folha (0,068 x 0,096)
    this.g = this.c.getContext("2d")!;
    this.tex = novaTex(this.c, true);
    // a folha aparece com ~0,8 do tamanho do canvas: sem mipmap os rótulos e as bordas finas ficam legíveis
    this.tex.generateMipmaps = false;
    this.tex.minFilter = THREE.LinearFilter;
  }
  pinta(st: FolhaSt) {
    void st;
    if (this.pintada) return; // conteúdo estático: pinta e sobe a textura uma vez só
    const g = this.g;
    const W = this.c.width;
    const H = this.c.height;
    // papel quente com grão leve (fixo, semente constante) e contorno
    g.fillStyle = PAPEL;
    g.fillRect(0, 0, W, H);
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    g.fillStyle = "rgba(120,100,80,0.035)";
    for (let i = 0; i < 1800; i++) g.fillRect(rnd() * W, rnd() * H, 2, 2);
    g.strokeStyle = "rgba(80,56,30,0.16)";
    g.lineWidth = 4;
    g.strokeRect(2, 2, W - 4, H - 4);
    for (const c of CAIXAS) {
      rr(g, c.x, c.y, c.w, c.h, c.raio);
      if (c.cor) {
        g.fillStyle = c.cor;
        g.fill();
      }
      if (c.borda) {
        g.strokeStyle = c.borda;
        g.lineWidth = 3;
        g.stroke();
      }
    }
    g.textBaseline = "alphabetic";
    for (const l of LINHAS) {
      g.font = l.f;
      g.fillStyle = l.c;
      g.textAlign = l.a;
      g.fillText(l.t, l.x, l.y);
    }
    // linha digitável: 4 grupos de 11 dígitos + DV, numa linha só, como no DAS real
    g.font = "700 18px Sora";
    g.fillStyle = TINTA;
    g.textAlign = "left";
    g.fillText(LINHA_DIGITAVEL, 44, 798);
    barras(g, 44, 816, 632, 92);
    this.tex.needsUpdate = true;
    this.pintada = true;
  }
}

/** etiqueta "dia 20" pra frente da pílula 3D */
export function texturaDia20() {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = "#FFFFFF";
  g.font = "800 150px Sora";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("dia 20", c.width / 2, c.height / 2 + 8);
  return novaTex(c);
}

/** sombra suave arredondada (textura alfa) pra pousar objetos no papel */
export function texturaSombra() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(128, 128, 10, 128, 128, 126);
  gr.addColorStop(0, "rgba(40,30,20,0.55)");
  gr.addColorStop(0.45, "rgba(40,30,20,0.3)");
  gr.addColorStop(1, "rgba(40,30,20,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  return t;
}

/** ponto suave pra partícula (núcleo quente + halo) */
export function texturaFaisca() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.25, "rgba(255,255,255,0.85)");
  gr.addColorStop(0.6, "rgba(255,255,255,0.18)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/** sombra retangular suave (guia de papel flutuando: dá corpo contra o papel do fundo) */
export function texturaSombraRet() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 320;
  const g = c.getContext("2d")!;
  g.filter = "blur(18px)";
  g.fillStyle = "rgba(60,40,24,0.55)";
  g.fillRect(44, 44, 168, 232);
  return new THREE.CanvasTexture(c);
}
