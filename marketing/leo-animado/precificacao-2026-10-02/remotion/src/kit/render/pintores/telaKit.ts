// Pintor da tela do aparelho (dono K06): o PintorTela do src/guia/tela.ts generalizado. As imagens vêm por
// chave (props.telas) e os extras por tipo e região (props.regioes), com o MESMO código de desenho do original
// pra brilhoCard, contador, varredura, botao e toqueCirculo, e as mesmas transições dos modos 0 (abrir) e 1
// (empurrar). Com as props do guia o canvas sai igual, pixel a pixel, ao do original.
import * as THREE from "three";
import type { ExtraTela, PropsKit, Regiao, TelaSt } from "../../nucleo/tipos";
import { ease, hexParaRgb } from "./texturas";

type Caixa = { x: number; y: number; w: number; h: number; r: number };

/** fundo do card atrás do botão (a cor que apaga o botão da captura antes de redesenhar) */
const FUNDO_BOTAO_PADRAO = "rgb(254,243,238)";
/** cor do botão quando o extra não diz (o #B83D1C do app) */
const COR_BOTAO_PADRAO = "#B83D1C";

/** R$ com vírgula nos centavos e ponto nos milhares (no guia, 178,31: igual ao toFixed do original) */
export function formataBrl(v: number) {
  const [int, dec] = v.toFixed(2).split(".");
  const milhar = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${milhar},${dec}`;
}

const caixaDe = (r: Regiao | undefined): Caixa => ({ x: r ? r.x : 0, y: r ? r.y : 0, w: r && r.w !== undefined ? r.w : 0, h: r && r.h !== undefined ? r.h : 0, r: r && r.r !== undefined ? r.r : 0 });

export class PintorTelaKit {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  imgs: Record<string, HTMLImageElement>;
  telas: PropsKit["telas"];
  regioes: Record<string, Regiao>;
  TW: number;
  TH: number;
  constructor(imgs: Record<string, HTMLImageElement>, telas: PropsKit["telas"], regioes: Record<string, Regiao>, telaPx: [number, number] = [1290, 2796], flipY = true) {
    this.imgs = imgs;
    this.telas = telas || {};
    this.regioes = regioes || {};
    this.TW = telaPx[0];
    this.TH = telaPx[1];
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.TW;
    this.canvas.height = this.TH;
    this.ctx = this.canvas.getContext("2d")!;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.flipY = flipY; // a UV da tela do iPhone segue a convenção do canvas (com false sai de cabeça pra baixo)
    this.tex.anisotropy = 8;
  }

  private rr(x: number, y: number, w: number, h: number, r: number) {
    const g = this.ctx;
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  private regiao(nome: string): Regiao | undefined {
    return this.regioes[nome];
  }

  private varredura(reg: Caixa, k: number) {
    // brilho de carregamento (skeleton shimmer) passando no esqueleto do botão enquanto o valor conta
    if (k <= 0 || k >= 1) return;
    const g = this.ctx;
    g.save();
    this.rr(reg.x, reg.y, reg.w, reg.h, reg.r);
    g.clip();
    const cx = reg.x - 160 + (reg.w + 320) * k;
    const gr = g.createLinearGradient(cx - 120, 0, cx + 120, 0);
    gr.addColorStop(0, "rgba(255,255,255,0)");
    gr.addColorStop(0.5, "rgba(255,255,255,0.75)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(reg.x, reg.y, reg.w, reg.h);
    g.restore();
  }

  /** contador do valor: R$ 0,00 até o valor do extra, no formato do app (vírgula nos centavos) */
  private contador(st: TelaSt, valor: number, reg: Regiao | undefined) {
    const g = this.ctx;
    const v = valor * Math.max(0, Math.min(1, st.conta));
    g.save();
    g.font = reg && reg.fonte ? reg.fonte : "600 59px Sora";
    g.fillStyle = reg && reg.cor ? reg.cor : "#1B1E24";
    g.textAlign = "left";
    g.textBaseline = "alphabetic";
    g.fillText(formataBrl(v), reg ? reg.x : 0, reg ? reg.y : 0);
    g.restore();
  }

  /** brilho coral em volta do card */
  private brilhoCard(st: TelaSt, alpha: number, R: Caixa) {
    if (!(st.brilhoCard > 0)) return;
    const g = this.ctx;
    g.save();
    g.globalAlpha = alpha * st.brilhoCard;
    g.lineWidth = 10;
    g.strokeStyle = "#F2643C";
    g.shadowColor = "rgba(242,100,60,0.7)";
    g.shadowBlur = 40;
    this.rr(R.x, R.y, R.w, R.h, R.r);
    g.stroke();
    g.restore();
  }

  /** o botão: pulso no "só", círculo de toque (como gravação de tela), aperto em 2 quadros e o retorno do app.
   *  Sem raios nem confete: confete depois do toque é a gramática do "Pagamento confirmado", que o app não diz */
  private botao(st: TelaSt, dx: number, B: Caixa, ex: Extract<ExtraTela, { tipo: "botao" }>) {
    const g = this.ctx;
    const COR = hexParaRgb(ex.cor || COR_BOTAO_PADRAO);
    const rotulo = ex.rotulo;
    const retorno = ex.retorno || st.verifTexto;
    const fundo = (ex as { fundo?: string }).fundo || FUNDO_BOTAO_PADRAO;
    const bx = B.x + dx;
    const cx = bx + B.w / 2;
    const cy = B.y + B.h / 2;
    const v = Math.max(0, Math.min(1, st.verif));
    const tq = st.toqueBotao;
    const fase = (a: number, b: number) => Math.max(0, Math.min(1, (tq - a) / (b - a)));
    // aperto: afunda até 0,95 em 2 quadros, escurece 16%, segura 1 quadro, solta passando pra 1,03 e assenta em 1
    let esc = 1;
    let escuro = 0;
    if (tq > 0 && tq < 1) {
      const kIn = fase(0.06, 0.18);
      const kOut = fase(0.24, 0.36);
      const kSet = fase(0.36, 0.49);
      esc = 1 - 0.05 * ease(kIn) + 0.08 * ease(kOut) - 0.03 * ease(kSet);
      escuro = 0.16 * ease(kIn) * (1 - ease(kOut));
    }
    const pulso = st.pulso > 0 && st.pulso < 1 ? Math.sin(Math.PI * st.pulso) : 0;
    // salto curto quando o check fecha (1 a 1,04 a 1)
    const salto = v > 0.35 && v < 0.62 ? Math.sin((Math.PI * (v - 0.35)) / 0.27) : 0;
    const sc = esc * (1 + 0.04 * pulso) * (1 + 0.04 * salto);
    if (Math.abs(sc - 1) > 1e-4 || escuro > 0 || v > 0) {
      const cor = COR;
      // apaga o botão da captura antes de redesenhar, senão a borda dele aparece quando a pílula encolhe
      this.rr(bx - 3, B.y - 3, B.w + 6, B.h + 6, B.r + 3);
      g.fillStyle = fundo;
      g.fill();
      // a pílula alarga pra direita pra caber o check e o texto do retorno
      g.font = "600 46px Sora";
      const ic = 34; // raio do círculo do check
      const wTxt = g.measureText(retorno).width;
      const wNec = ic * 2 + 18 + wTxt + 64;
      const bw = B.w + Math.max(0, wNec - B.w) * ease(v / 0.3);
      const ccx = bx + bw / 2;
      g.save();
      g.translate(cx, cy);
      g.scale(sc, sc);
      g.translate(-cx, -cy);
      this.rr(bx, B.y, bw, B.h, B.r);
      g.fillStyle = `rgb(${cor[0]},${cor[1]},${cor[2]})`;
      g.fill();
      if (escuro > 0) {
        g.fillStyle = `rgba(0,0,0,${escuro})`;
        g.fill();
      }
      g.textBaseline = "middle";
      g.font = "600 46px Sora";
      g.fillStyle = "#FFFFFF";
      // o rótulo sobe um pouco e some
      const kl = ease(v / 0.1);
      if (kl < 1) {
        g.globalAlpha = 1 - kl;
        g.textAlign = "center";
        g.fillText(rotulo, ccx, cy + 2 - 12 * kl);
      }
      if (v > 0) {
        const total = ic * 2 + 18 + wTxt;
        const x0 = ccx - total / 2;
        // círculo do ícone fechando como arco
        const kc = ease(v / 0.22);
        g.globalAlpha = 1;
        g.lineWidth = 7;
        g.lineCap = "round";
        g.lineJoin = "round";
        g.strokeStyle = "#FFFFFF";
        g.beginPath();
        g.arc(x0 + ic, cy, ic - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * kc);
        g.stroke();
        // check em traço
        const kd = ease((v - 0.16) / 0.19);
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
        // o retorno entra subindo
        const kt = ease((v - 0.04) / 0.22);
        if (kt > 0) {
          g.globalAlpha = kt;
          g.textAlign = "left";
          g.fillText(retorno, x0 + ic * 2 + 18, cy + 2 + 16 * (1 - kt));
        }
      }
      g.restore();
      // anel abrindo em volta do botão no retorno (uma vez só, controlado por `anel`)
      const ka = st.anel;
      if (ka > 0 && ka < 1) {
        g.save();
        g.globalAlpha = 0.5 * (1 - ease(ka));
        g.strokeStyle = `rgb(${COR.join(",")})`;
        g.lineWidth = 7;
        const gr = 20 * ease(ka);
        this.rr(bx - gr, B.y - gr, bw + 2 * gr, B.h + 2 * gr, B.r + gr);
        g.stroke();
        g.restore();
      }
    }
    // círculo de toque (indicador de gravação de tela), sem mão: encosta encolhendo e vira anel que abre e some
    if (tq > 0 && tq < 1) {
      const tx = cx + 40;
      const ty = cy + 6;
      g.save();
      if (tq < 0.45) {
        const k = tq / 0.45;
        const r = 58 - 12 * ease(k);
        g.globalAlpha = 0.5 * Math.min(1, k * 3);
        g.fillStyle = "#FFFFFF";
        g.beginPath();
        g.arc(tx, ty, r, 0, Math.PI * 2);
        g.fill();
      } else {
        const k = (tq - 0.45) / 0.55;
        g.globalAlpha = 0.55 * (1 - ease(k));
        g.strokeStyle = "#FFFFFF";
        g.lineWidth = 8;
        g.beginPath();
        g.arc(tx, ty, 46 + 120 * ease(k), 0, Math.PI * 2);
        g.stroke();
      }
      g.restore();
    }
  }

  /** toque num botão sem rótulo (o "Ver a guia" do Imposto): círculo escuro que abre e some */
  private toqueCirculo(st: TelaSt, alpha: number, reg: Regiao | undefined) {
    if (!(st.toque > 0 && st.toque < 1) || !reg) return;
    const g = this.ctx;
    const kk = ease(st.toque);
    g.save();
    g.globalAlpha = alpha * 0.35 * (1 - kk);
    g.fillStyle = "#1B1E24";
    g.beginPath();
    g.arc(reg.x, reg.y, 40 + 220 * kk, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  /** desenha uma tela com os extras dela na MESMA camada, pra transição levar tudo junto
   *  (sem extra de uma tela vazando por cima da outra) */
  private camada(k: string, st: TelaSt, x: number, s: number, alpha: number) {
    if (k === "apagada" || alpha <= 0) return;
    const g = this.ctx;
    const TW = this.TW;
    const TH = this.TH;
    g.save();
    g.globalAlpha = alpha;
    g.translate(TW / 2 + x, TH / 2);
    g.scale(s, s);
    g.translate(-TW / 2, -TH / 2);
    const img = this.imgs[k];
    if (img) g.drawImage(img, 0, 0, TW, TH);
    const tela = this.telas[k];
    for (const ex of tela ? tela.extras || [] : []) {
      if (ex.tipo === "brilhoCard") this.brilhoCard(st, alpha, caixaDe(this.regiao(ex.regiao)));
      else if (ex.tipo === "contador") this.contador(st, ex.valor, this.regiao(ex.regiao));
      else if (ex.tipo === "varredura") this.varredura(caixaDe(this.regiao(ex.regiao)), st.calc);
      else if (ex.tipo === "botao") this.botao(st, 0, caixaDe(this.regiao(ex.regiao)), ex);
      else if (ex.tipo === "toqueCirculo") this.toqueCirculo(st, alpha, this.regiao(ex.regiao));
    }
    g.restore();
  }

  pinta(st: TelaSt) {
    const g = this.ctx;
    const TW = this.TW;
    const TH = this.TH;
    g.fillStyle = "#050506";
    g.fillRect(0, 0, TW, TH);
    const p = ease(st.p);
    if (st.p <= 0 || st.a === st.b) {
      this.camada(st.a, st, 0, 1, 1);
    } else if (st.modo === 0) {
      // abrir: a nova tela cresce de 0,92 e acende por cima da antiga
      this.camada(st.a, st, 0, 1 + 0.04 * p, 1);
      this.camada(st.b, st, 0, 0.92 + 0.08 * p, Math.min(1, st.p * 1.6));
    } else {
      // empurrar (navegação): a nova entra pela direita, a antiga recua 30% e escurece
      this.camada(st.a, st, -0.3 * TW * p, 1, 1);
      g.fillStyle = `rgba(0,0,0,${0.12 * p})`;
      g.fillRect(0, 0, TW, TH);
      g.save();
      g.shadowColor = "rgba(0,0,0,0.18)";
      g.shadowBlur = 60;
      this.camada(st.b, st, TW * (1 - p), 1, 1);
      g.restore();
    }
    if (st.luz < 1) {
      g.fillStyle = `rgba(5,5,6,${1 - Math.max(0, st.luz)})`;
      g.fillRect(0, 0, TW, TH);
    }
    this.tex.needsUpdate = true;
  }
}
