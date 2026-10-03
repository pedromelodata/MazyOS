// Texturas pequenas desenhadas em canvas (dono K06): as do src/guia/pinturas.ts com o mesmo desenho
// (sombra de contato, sombra retangular da folha, ponto da poeira e etiqueta da pílula) e os ajudantes comuns.
import * as THREE from "three";

/** retângulo arredondado (o mesmo caminho do rr do tela.ts e do pinturas.ts) */
export function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** CanvasTexture em sRGB com anisotropia 8 (a novaTex do pinturas.ts) */
export function novaTex(c: HTMLCanvasElement, flipY = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = flipY;
  t.anisotropy = 8;
  return t;
}

export function novoCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, g: c.getContext("2d")! };
}

/** curva de saída cúbica com corte em 0 e 1 (a ease do tela.ts e do pinturas.ts) */
export const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));
/** back com excesso s (o back do pinturas.ts) */
export const back = (t: number, s = 1.7) => { t = Math.min(1, Math.max(0, t)) - 1; return 1 + (s + 1) * t * t * t + s * t * t; };

/** "#B83D1C" vira [184, 61, 28] */
export function hexParaRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
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

/** sombra retangular suave (papel flutuando: dá corpo contra o papel do fundo) */
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

/** fonte "800 150px Sora" com o tamanho trocado */
export function fonteComTamanho(fonte: string, px: number) {
  return fonte.replace(/(\d+(?:\.\d+)?)px/, `${px}px`);
}

/** tamanho em px da fonte ("800 150px Sora" dá 150) */
export function tamanhoDaFonte(fonte: string) {
  const m = /(\d+(?:\.\d+)?)px/.exec(fonte);
  return m ? Number(m[1]) : 16;
}

/** escreve o texto encolhendo a fonte até caber na largura (nunca aumenta) */
export function textoQueCabe(g: CanvasRenderingContext2D, texto: string, fonte: string, largura: number) {
  let px = tamanhoDaFonte(fonte);
  g.font = fonte;
  while (px > 6 && g.measureText(texto).width > largura) {
    px -= 1;
    g.font = fonteComTamanho(fonte, px);
  }
  return g.font;
}

/** etiqueta da pílula: a texturaDia20 do pinturas.ts com texto, fonte, cor e canvas como parâmetro */
export function texturaEtiqueta(o: { texto: string; fonte: string; cor: string; canvas: [number, number] }) {
  const c = document.createElement("canvas");
  c.width = o.canvas[0];
  c.height = o.canvas[1];
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = o.cor;
  g.font = o.fonte;
  // texto longo encolhe (o "dia 20" do guia cabe em 150 px e sai igual ao original)
  if (g.measureText(o.texto).width > c.width * 0.92) textoQueCabe(g, o.texto, o.fonte, c.width * 0.92);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(o.texto, c.width / 2, c.height / 2 + 8 * (c.height / 256));
  return novaTex(c);
}
