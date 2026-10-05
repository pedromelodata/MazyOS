// Peças quentes do palco de argila (render), as que saem da tela do aparelho: os cartões recortados da própria tela
// (na peça de 05/10, "Sua empresa nasceu.", o imposto do mês com a face pintada a cada quadro e a linha "Contrato
// social" dos Documentos), as placas de documento da fileira, a moeda com o sinal de pessoa, o sino coral e as
// faíscas. Todas flutuam: ficam fora do passe da sombra de contato e ganham uma sombra-blob no chão.
//
// Cartão: nasce com o recorte EXATO da vaga na tela (mesmos pixels, mesma largura, mesma proporção e os mesmos
// cantos) e só muda durante o voo. Com opcoes.compacto ele corta a sobra da direita enquanto voa (a largura vai da
// vaga até a compacta, com os cantos de baixo arredondando junto), e na volta faz o caminho contrário: chega na
// vaga do tamanho exato dela, e a tela cheia volta no mesmo quadro.
import * as THREE from "three";
import { corpoPlaca, moedaPessoa, placa, sino, texSombraRet } from "../objetos/argila";
import { formataBrl } from "../../../render/pintores/telaKit";
import { ease, hexParaRgb } from "../../../render/pintores/texturas";
import { num, type Canal } from "./modelo";

/** largura do modelo dos cartões com a largura da vaga: 0,1 m (a compacta é a proporção dela) */
export const LARGURA_CARTAO = 0.1;

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, g: c.getContext("2d") as CanvasRenderingContext2D };
}

/** retângulo arredondado com raio de cima e raio de baixo (a vaga da linha de lista tem o de baixo reto) */
function rrCantos(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rt: number, rb: number) {
  const a = Math.max(0, Math.min(rt, w / 2, h / 2));
  const b = Math.max(0, Math.min(rb, w / 2, h / 2));
  g.beginPath();
  g.moveTo(x + a, y);
  g.lineTo(x + w - a, y);
  if (a > 0) g.arcTo(x + w, y, x + w, y + a, a);
  else g.lineTo(x + w, y);
  g.lineTo(x + w, y + h - b);
  if (b > 0) g.arcTo(x + w, y + h, x + w - b, y + h, b);
  else g.lineTo(x + w, y + h);
  g.lineTo(x + b, y + h);
  if (b > 0) g.arcTo(x, y + h, x, y + h - b, b);
  else g.lineTo(x, y + h);
  g.lineTo(x, y + a);
  if (a > 0) g.arcTo(x, y, x + a, y, a);
  else g.lineTo(x, y);
  g.closePath();
}

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  rrCantos(g, x, y, w, h, r, r);
}

/** contorno (metros, centrado) com raio de cima e de baixo, pra placa extrudada */
function contornoCantos(w: number, h: number, rt: number, rb: number): THREE.Shape {
  const s = new THREE.Shape();
  const x0 = -w / 2;
  const y0 = -h / 2;
  const x1 = w / 2;
  const y1 = h / 2;
  const a = Math.max(0, Math.min(rt, w / 2, h / 2));
  const b = Math.max(0, Math.min(rb, w / 2, h / 2));
  s.moveTo(x0 + b, y0);
  s.lineTo(x1 - b, y0);
  if (b > 0) s.absarc(x1 - b, y0 + b, b, -Math.PI / 2, 0, false);
  s.lineTo(x1, y1 - a);
  if (a > 0) s.absarc(x1 - a, y1 - a, a, 0, Math.PI / 2, false);
  s.lineTo(x0 + a, y1);
  if (a > 0) s.absarc(x0 + a, y1 - a, a, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + b);
  if (b > 0) s.absarc(x0 + b, y0 + b, b, Math.PI, Math.PI * 1.5, false);
  return s;
}

function texDe(c: HTMLCanvasElement, mip = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = mip;
  t.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  return t;
}

/** sombra retangular macia atrás do que flutua na frente do aparelho (a sombraAtras do carrossel) */
function sombraAtras(w: number, h: number, opacidade: number, dz = -0.012): THREE.Mesh {
  const sh = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 1.42, h * 1.36),
    new THREE.MeshBasicMaterial({ map: texSombraRet(), transparent: true, depthWrite: false, opacity: opacidade, toneMapped: false }),
  );
  sh.position.set(0.004, -0.006, dz);
  sh.renderOrder = 2;
  sh.userData.foraDaCaixa = true;
  sh.userData.semColisao = true; // sombra falsa atrás do cartão: fora da prova de colisão
  return sh;
}

// ---------- cartão recortado da tela ----------
/** o cartão do imposto: valor de exemplo (conta de R$ 0,00 até ele), rótulo e retorno do botão (os textos do app) e,
 *  em px a partir do canto de cima da vaga, onde ficam o valor e o botão (padrão: os da tela "inicio" da peça de 05/10) */
export type OpImposto = {
  valor: number; rotulo: string; retorno: string; corBotao: string;
  valorEm?: { x: number; y: number; fonte?: string; cor?: string };
  botaoEm?: { x: number; y: number; w: number; h: number; r: number };
  fundoCard?: string;
};
export type OpCartao = {
  regiao: { x: number; y: number; w: number; h: number };
  raio: number;
  raioBaixo?: number;
  compacto?: number;
  raioCompacto?: number;
  corCorpo: string;
  borda?: string;
  /** "sempre" (a borda faz parte do cartão) ou "voo" (só aparece fora da vaga: a captura já traz a da tela) */
  bordaSo?: "sempre" | "voo";
  imposto?: OpImposto;
};

const MARGEM = 72; // px de folga em volta do cartão pro brilho coral
// regiões da tela montada (regioes.json da peça) levadas pro canto do cartão do imposto (x 72, y 424)
const VALOR = { x: 125 - 72, y: 682 - 424, fonte: "600 59px Sora", cor: "#1B1E24" };
const BOTAO = { x: 123 - 72, y: 739 - 424, w: 389, h: 119, r: 28 };
const FUNDO_CARD = "#FEF3EE";

export class CartaoTela {
  grupo: THREE.Group;
  private img: HTMLImageElement;
  private op: OpCartao;
  private c: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private tex: THREE.CanvasTexture;
  private face: THREE.Mesh;
  private corpo: THREE.Mesh;
  private sombra: THREE.Mesh;
  private geos = new Map<string, THREE.BufferGeometry>();
  private chave = "";
  private chaveCorpo = "";
  /** metros por px da captura */
  readonly k: number;
  readonly wCompacto: number;
  constructor(img: HTMLImageElement, op: OpCartao) {
    this.img = img;
    this.op = op;
    const R = op.regiao;
    this.k = LARGURA_CARTAO / R.w;
    this.wCompacto = Math.max(40, Math.min(R.w, num(op.compacto, R.w)));
    const W = R.w + 2 * MARGEM;
    const H = R.h + 2 * MARGEM;
    const { c, g } = canvas(W, H);
    this.c = c;
    this.g = g;
    this.tex = texDe(c);
    const grupo = new THREE.Group();
    grupo.name = "cartao-tela";
    this.corpo = new THREE.Mesh(new THREE.BufferGeometry(), corpoPlaca(op.corCorpo));
    grupo.add(this.corpo);
    this.face = new THREE.Mesh(new THREE.PlaneGeometry(W * this.k, H * this.k), new THREE.MeshBasicMaterial({ map: this.tex, toneMapped: false, transparent: true, depthWrite: false }));
    this.face.position.z = 0.0024 / 2 + 0.00025;
    this.face.renderOrder = 4;
    grupo.add(this.face);
    this.sombra = sombraAtras(R.w * this.k, R.h * this.k, 0.3);
    grupo.add(this.sombra);
    this.grupo = grupo;
    this.pinta({}, 1);
  }

  /** largura (px da captura) e raios do quadro, pelo canal larg */
  private forma(larg: number) {
    const R = this.op.regiao;
    const l = Math.max(0, Math.min(1, larg));
    const rc = num(this.op.raioCompacto, this.op.raio);
    return {
      w: R.w + (this.wCompacto - R.w) * l,
      rt: this.op.raio + (rc - this.op.raio) * l,
      rb: num(this.op.raioBaixo, this.op.raio) + (rc - num(this.op.raioBaixo, this.op.raio)) * l,
      l,
    };
  }

  /** corpo de 2,4 mm na forma do quadro (geometria refeita só quando a forma muda, com cache) */
  private poeCorpo(w: number, rt: number, rb: number) {
    const chave = `${Math.round(w)}|${Math.round(rt)}|${Math.round(rb)}`;
    if (chave === this.chaveCorpo) return;
    this.chaveCorpo = chave;
    let geo = this.geos.get(chave);
    if (!geo) {
      const k = this.k;
      const h = this.op.regiao.h * k;
      const esp = 0.0024;
      const bisel = 0.0005;
      geo = placa(contornoCantos(Math.round(w) * k - 2 * bisel, h - 2 * bisel, Math.max(0, Math.round(rt) * k - bisel), Math.max(0, Math.round(rb) * k - bisel)), esp, bisel, 10);
      this.geos.set(chave, geo);
    }
    this.corpo.geometry = geo;
  }

  /** no chão (acréscimo de 05/10): sem a sombra falsa de trás (a do flutuar); o corpo projeta a sombra da luz chave
   *  e entra na sombra de contato do palco */
  private semAtras = false;
  apoiaNoChao(): void {
    this.semAtras = true;
    this.sombra.visible = false;
    this.corpo.castShadow = true;
  }

  /** pinta o quadro: forma pelo canal larg, sombra de trás pelo prende e, no imposto, valor, botão e retorno */
  pinta(c: Canal, prende: number): void {
    const f = this.forma(num(c.larg, 0));
    const R = this.op.regiao;
    const k = this.k;
    // a face é fixa (o canvas inteiro); o cartão visível é a parte da esquerda: a face anda pra o centro dele
    // ficar na origem do grupo
    this.face.position.x = ((R.w - f.w) / 2) * k;
    this.poeCorpo(f.w, f.rt, f.rb);
    const sv = this.semAtras ? 0 : Math.max(0, Math.min(1, 1 - prende));
    this.sombra.scale.x = f.w / R.w;
    (this.sombra.material as THREE.MeshBasicMaterial).opacity = 0.3 * sv;
    this.sombra.visible = sv > 0.002;
    const q = (x: number) => Math.round(x * 1000) / 1000;
    const v = {
      w: Math.round(f.w), rt: q(f.rt), rb: q(f.rb), l: q(f.l),
      brilho: q(num(c.brilho, 0)), conta: q(num(c.conta, 0)), calc: q(num(c.calc, 0)), mostra: q(num(c.mostraValor, 0)),
      revela: q(num(c.revela, 0)), brilhoBotao: q(num(c.brilhoBotao, 0)), pulso: q(num(c.pulso, 0)), toque: q(num(c.toque, 0)),
      verif: q(num(c.verif, 0)), anel: q(num(c.anel, 0)),
    };
    const chave = JSON.stringify(v);
    if (chave === this.chave) return;
    this.chave = chave;
    const g = this.g;
    const W = this.c.width;
    const H = this.c.height;
    const M = MARGEM;
    g.clearRect(0, 0, W, H);
    // brilho coral em volta do cartão (o brilhoCard do kit, por fora)
    if (v.brilho > 0) {
      g.save();
      g.globalAlpha = Math.min(1, v.brilho);
      g.lineWidth = 9;
      g.strokeStyle = "#F2643C";
      g.shadowColor = "rgba(242,100,60,0.75)";
      g.shadowBlur = 46;
      rrCantos(g, M - 2, M - 2, v.w + 4, R.h + 4, v.rt + 2, v.rb + 2);
      g.stroke();
      g.restore();
    }
    // o cartão: os pixels da tela montada, na forma do quadro
    g.save();
    rrCantos(g, M, M, v.w, R.h, v.rt, v.rb);
    g.clip();
    g.fillStyle = this.op.corCorpo;
    g.fillRect(M, M, v.w, R.h);
    g.drawImage(this.img, R.x, R.y, R.w, R.h, M, M, R.w, R.h);
    g.restore();
    if (this.op.borda) {
      const ab = this.op.bordaSo === "voo" ? v.l : 1;
      if (ab > 0.001) {
        g.save();
        g.globalAlpha = ab;
        g.strokeStyle = this.op.borda;
        g.lineWidth = 3;
        rrCantos(g, M + 1.5, M + 1.5, v.w - 3, R.h - 3, Math.max(0, v.rt - 1.5), Math.max(0, v.rb - 1.5));
        g.stroke();
        g.restore();
      }
    }
    if (this.op.imposto) this.imposto(v, M);
    this.tex.needsUpdate = true;
  }

  private imposto(v: Record<string, number>, M: number) {
    const g = this.g;
    const op = this.op.imposto as OpImposto;
    const VL = { ...VALOR, ...(op.valorEm || {}) };
    const BT = op.botaoEm || BOTAO;
    // valor contando (R$ 0,00 até o valor de exemplo)
    if (v.mostra > 0) {
      g.save();
      g.globalAlpha = Math.min(1, v.mostra);
      g.font = VL.fonte;
      g.fillStyle = VL.cor;
      g.textAlign = "left";
      g.textBaseline = "alphabetic";
      g.fillText(formataBrl(op.valor * Math.max(0, Math.min(1, v.conta))), M + VL.x, M + VL.y);
      g.restore();
    }
    const B = { x: M + BT.x, y: M + BT.y, w: BT.w, h: BT.h, r: BT.r };
    // brilho de carregamento no esqueleto (o "varredura" do kit)
    if (v.revela < 1 && v.calc > 0 && v.calc < 1) {
      g.save();
      rr(g, B.x, B.y, B.w, B.h, B.r);
      g.clip();
      const cx = B.x - 160 + (B.w + 320) * v.calc;
      const gr = g.createLinearGradient(cx - 120, 0, cx + 120, 0);
      gr.addColorStop(0, "rgba(255,255,255,0)");
      gr.addColorStop(0.5, "rgba(255,255,255,0.8)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.fillRect(B.x, B.y, B.w, B.h);
      g.restore();
    }
    if (v.revela > 0) this.botao(v, B, op);
  }

  /** o botão do app, com o mesmo desenho do PintorTelaKit (pulso, toque, aperto e o retorno com o check) */
  private botao(v: Record<string, number>, B: { x: number; y: number; w: number; h: number; r: number }, op: OpImposto): void {
    const g = this.g;
    const COR = hexParaRgb(op.corBotao);
    const rotulo = op.rotulo;
    const retorno = op.retorno;
    const rv = Math.min(1, v.revela);
    const cx = B.x + B.w / 2;
    const cy = B.y + B.h / 2;
    const ve = Math.max(0, Math.min(1, v.verif));
    const tq = v.toque;
    const fase = (a: number, b: number) => Math.max(0, Math.min(1, (tq - a) / (b - a)));
    let esc = 1;
    let escuro = 0;
    if (tq > 0 && tq < 1) {
      const kIn = fase(0.06, 0.18);
      const kOut = fase(0.24, 0.36);
      const kSet = fase(0.36, 0.49);
      esc = 1 - 0.05 * ease(kIn) + 0.08 * ease(kOut) - 0.03 * ease(kSet);
      escuro = 0.16 * ease(kIn) * (1 - ease(kOut));
    }
    const pulso = v.pulso > 0 && v.pulso < 1 ? Math.sin(Math.PI * v.pulso) : 0;
    const salto = ve > 0.35 && ve < 0.62 ? Math.sin((Math.PI * (ve - 0.35)) / 0.27) : 0;
    const sc = esc * (1 + 0.04 * pulso) * (1 + 0.04 * salto) * (0.9 + 0.1 * ease(rv));
    g.save();
    if (rv >= 1) {
      rr(g, B.x - 3, B.y - 3, B.w + 6, B.h + 6, B.r + 3);
      g.fillStyle = op.fundoCard || FUNDO_CARD;
      g.fill();
    }
    g.globalAlpha = ease(rv);
    g.font = "600 46px Sora";
    const ic = 34;
    const wTxt = g.measureText(retorno).width;
    const wNec = ic * 2 + 18 + wTxt + 64;
    const bw = B.w + Math.max(0, wNec - B.w) * ease(ve / 0.3);
    const ccx = B.x + bw / 2;
    g.translate(cx, cy);
    g.scale(sc, sc);
    g.translate(-cx, -cy);
    rr(g, B.x, B.y, bw, B.h, B.r);
    g.fillStyle = `rgb(${COR[0]},${COR[1]},${COR[2]})`;
    g.fill();
    if (escuro > 0) {
      g.fillStyle = `rgba(0,0,0,${escuro})`;
      g.fill();
    }
    if (v.brilhoBotao > 0 && v.brilhoBotao < 1) {
      g.save();
      rr(g, B.x, B.y, bw, B.h, B.r);
      g.clip();
      const bx = B.x - 120 + (bw + 240) * v.brilhoBotao;
      const gr = g.createLinearGradient(bx - 90, 0, bx + 90, 0);
      gr.addColorStop(0, "rgba(255,255,255,0)");
      gr.addColorStop(0.5, "rgba(255,255,255,0.45)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.fillRect(B.x, B.y, bw, B.h);
      g.restore();
    }
    g.textBaseline = "middle";
    g.font = "600 46px Sora";
    g.fillStyle = "#FFFFFF";
    const kl = ease(ve / 0.1);
    if (kl < 1) {
      g.globalAlpha = ease(rv) * (1 - kl);
      g.textAlign = "center";
      g.fillText(rotulo, ccx, cy + 2 - 12 * kl);
    }
    if (ve > 0) {
      const total = ic * 2 + 18 + wTxt;
      const x0 = ccx - total / 2;
      const kc = ease(ve / 0.22);
      g.globalAlpha = 1;
      g.lineWidth = 7;
      g.lineCap = "round";
      g.lineJoin = "round";
      g.strokeStyle = "#FFFFFF";
      g.beginPath();
      g.arc(x0 + ic, cy, ic - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * kc);
      g.stroke();
      const kd = ease((ve - 0.16) / 0.19);
      if (kd > 0) {
        const p1 = [x0 + ic - 15, cy + 1];
        const p2 = [x0 + ic - 4, cy + 12];
        const p3 = [x0 + ic + 16, cy - 11];
        const l1 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
        const l2 = Math.hypot(p3[0] - p2[0], p3[1] - p2[1]);
        const L = (l1 + l2) * kd;
        g.beginPath();
        g.moveTo(p1[0], p1[1]);
        if (L <= l1) g.lineTo(p1[0] + ((p2[0] - p1[0]) * L) / l1, p1[1] + ((p2[1] - p1[1]) * L) / l1);
        else {
          g.lineTo(p2[0], p2[1]);
          const r = (L - l1) / l2;
          g.lineTo(p2[0] + (p3[0] - p2[0]) * r, p2[1] + (p3[1] - p2[1]) * r);
        }
        g.stroke();
      }
      const kt = ease((ve - 0.04) / 0.22);
      if (kt > 0) {
        g.globalAlpha = kt;
        g.textAlign = "left";
        g.fillText(retorno, x0 + ic * 2 + 18, cy + 2 + 16 * (1 - kt));
      }
    }
    g.restore();
    const ka = v.anel;
    if (ka > 0 && ka < 1) {
      g.save();
      g.globalAlpha = 0.5 * (1 - ease(ka));
      g.strokeStyle = `rgb(${COR.join(",")})`;
      g.lineWidth = 7;
      const grw = 20 * ease(ka);
      rr(g, B.x - grw, B.y - grw, bw + 2 * grw, B.h + 2 * grw, B.r + grw);
      g.stroke();
      g.restore();
    }
    // círculo de toque (indicador de gravação de tela), sem mão: encosta encolhendo e vira anel que abre e some
    if (tq > 0 && tq < 1) {
      const tx = cx + 40;
      const ty = cy + 6;
      g.save();
      if (tq < 0.45) {
        const kk = tq / 0.45;
        const r = 58 - 12 * ease(kk);
        g.globalAlpha = 0.5 * Math.min(1, kk * 3);
        g.fillStyle = "#FFFFFF";
        g.beginPath();
        g.arc(tx, ty, r, 0, Math.PI * 2);
        g.fill();
      } else {
        const kk = (tq - 0.45) / 0.55;
        g.globalAlpha = 0.55 * (1 - ease(kk));
        g.strokeStyle = "#FFFFFF";
        g.lineWidth = 8;
        g.beginPath();
        g.arc(tx, ty, 46 + 120 * ease(kk), 0, Math.PI * 2);
        g.stroke();
      }
      g.restore();
    }
  }
}

// ---------- placas de documento da fileira ----------
export const PLACA = { w: 0.02, h: 0.0266, esp: 0.0016 };
/** papel creme dos documentos do lado Legalizaí (o da folha DAS), com borda mais escura: separa da tela branca */
const CREME = "#FBF5EA";
const BORDA_CREME = "#E2D6C3";

/** face das placas: papel creme com o ícone de documento e barras de esqueleto (sem texto, sem cor de alerta) */
export function texPlaca(): THREE.CanvasTexture {
  const W = 300;
  const H = 400;
  const { c, g } = canvas(W, H);
  g.clearRect(0, 0, W, H);
  g.save();
  rr(g, 0, 0, W, H, 30);
  g.clip();
  g.fillStyle = CREME;
  g.fillRect(0, 0, W, H);
  // ícone de documento no círculo (o dos itens de Declarações do app)
  g.fillStyle = "#F0E7D8";
  g.beginPath();
  g.arc(62, 66, 36, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#8A7F70";
  g.lineWidth = 5;
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(50, 46);
  g.lineTo(68, 46);
  g.lineTo(78, 56);
  g.lineTo(78, 86);
  g.lineTo(50, 86);
  g.closePath();
  g.stroke();
  g.beginPath();
  g.moveTo(68, 46);
  g.lineTo(68, 56);
  g.lineTo(78, 56);
  g.stroke();
  const barra = (x: number, y: number, w: number, h: number, cor: string) => {
    g.fillStyle = cor;
    rr(g, x, y, w, h, h / 2);
    g.fill();
  };
  barra(116, 50, 150, 18, "#E3D8C6");
  barra(116, 82, 96, 13, "#EAE1D2");
  barra(34, 150, 232, 15, "#ECE4D6");
  barra(34, 182, 196, 15, "#ECE4D6");
  barra(34, 214, 214, 15, "#ECE4D6");
  barra(34, 300, 96, 34, "#ECE4D6");
  barra(186, 306, 80, 22, "#F0E9DC");
  g.restore();
  g.strokeStyle = BORDA_CREME;
  g.lineWidth = 6;
  rr(g, 3, 3, W - 6, H - 6, 27);
  g.stroke();
  const t = texDe(c);
  t.needsUpdate = true;
  return t;
}

/** a pílula "Entregue" do app (o status da tela de Declarações: #E7F6EF com o texto #0B5E40, Sora 600), maior
 *  que a placa, como um selo por cima dela */
export function texEntregue(): THREE.CanvasTexture {
  const W = 360;
  const H = 104;
  const { c, g } = canvas(W, H);
  g.clearRect(0, 0, W, H);
  g.save();
  g.shadowColor = "rgba(11,94,64,0.18)";
  g.shadowBlur = 10;
  g.shadowOffsetY = 3;
  rr(g, 8, 8, W - 16, H - 16, (H - 16) / 2);
  g.fillStyle = "#E7F6EF";
  g.fill();
  g.restore();
  g.strokeStyle = "rgba(11,94,64,0.22)";
  g.lineWidth = 2.5;
  rr(g, 9.5, 9.5, W - 19, H - 19, (H - 19) / 2);
  g.stroke();
  g.fillStyle = "#0B5E40";
  g.font = "600 52px Sora";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("Entregue", W / 2, H / 2 + 2);
  const t = texDe(c);
  t.needsUpdate = true;
  return t;
}

export function criaPlaca(tex: THREE.Texture, texSelo?: THREE.Texture | null, noChao = false): { grupo: THREE.Group; selo: THREE.Mesh | null } {
  const g = new THREE.Group();
  g.name = "placa-documento";
  const b = 0.0004;
  const corpo = new THREE.Mesh(placa(contornoCantos(PLACA.w - 2 * b, PLACA.h - 2 * b, 0.0018, 0.0018), PLACA.esp, b), corpoPlaca(CREME));
  // no chão (acréscimo de 05/10): o corpo projeta a sombra da luz chave e não leva a sombra falsa de trás
  if (noChao) corpo.castShadow = true;
  g.add(corpo);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(PLACA.w, PLACA.h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true, depthWrite: false }));
  face.position.z = PLACA.esp / 2 + 0.0002;
  face.renderOrder = 4;
  g.add(face);
  if (!noChao) g.add(sombraAtras(PLACA.w, PLACA.h, 0.42, -0.007));
  let selo: THREE.Mesh | null = null;
  if (texSelo) {
    selo = new THREE.Mesh(new THREE.PlaneGeometry(0.0236, 0.0068), new THREE.MeshBasicMaterial({ map: texSelo, toneMapped: false, transparent: true, depthWrite: false }));
    selo.position.set(0.0004, -0.0064, PLACA.esp / 2 + 0.0006);
    selo.rotation.z = 0.07;
    selo.renderOrder = 5;
    selo.visible = false;
    g.add(selo);
  }
  return { grupo: g, selo };
}

// ---------- moeda, sino e faíscas ----------
export const MOEDA_RAIO = 0.017;

/** brilho em estrela de quatro pontas (coral ou claro), pra faísca e pro reflexo da moeda */
export function texEstrela(cor: string): THREE.CanvasTexture {
  const S = 128;
  const { c, g } = canvas(S, S);
  g.clearRect(0, 0, S, S);
  const m = S / 2;
  const gr = g.createRadialGradient(m, m, 0, m, m, m);
  gr.addColorStop(0, "rgba(255,255,255,0.9)");
  gr.addColorStop(0.18, cor);
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.globalAlpha = 0.35;
  g.beginPath();
  g.arc(m, m, m * 0.62, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
  g.fillStyle = cor;
  for (const rot of [0, Math.PI / 2]) {
    g.save();
    g.translate(m, m);
    g.rotate(rot);
    g.beginPath();
    g.moveTo(0, -m * 0.95);
    g.quadraticCurveTo(m * 0.09, -m * 0.09, m * 0.95, 0);
    g.quadraticCurveTo(m * 0.09, m * 0.09, 0, m * 0.95);
    g.quadraticCurveTo(-m * 0.09, m * 0.09, -m * 0.95, 0);
    g.quadraticCurveTo(-m * 0.09, -m * 0.09, 0, -m * 0.95);
    g.fill();
    g.restore();
  }
  g.fillStyle = "#FFFFFF";
  g.beginPath();
  g.arc(m, m, m * 0.1, 0, Math.PI * 2);
  g.fill();
  const t = texDe(c, false);
  t.needsUpdate = true;
  return t;
}

export function criaMoeda(): { grupo: THREE.Object3D; reflexo: THREE.Sprite } {
  const grupo = moedaPessoa();
  const reflexo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texEstrela("#FFFFFF"), transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
  reflexo.position.set(0.006, 0.007, 0.004);
  reflexo.scale.setScalar(0.016);
  reflexo.renderOrder = 6;
  grupo.add(reflexo);
  return { grupo, reflexo };
}

export function criaSino(): THREE.Object3D {
  return sino();
}

export function criaFaisca(cor: string): THREE.Sprite {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texEstrela(cor), transparent: true, depthWrite: false, toneMapped: false }));
  s.renderOrder = 7;
  return s;
}
