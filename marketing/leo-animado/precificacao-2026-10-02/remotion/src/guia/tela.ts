import * as THREE from "three";

// Pintor da tela do iPhone: um canvas 1290x2796 (proporção da tela do modelo) redesenhado a cada quadro
// a partir das capturas reais montadas em monta_telas.py. A linha do tempo GSAP só mexe nos números de `TelaSt`.
export const TW = 1290;
export const TH = 2796;

export type TelaKey = "apagada" | "splash" | "inicio" | "inicioPagar" | "imposto";
export type TelaSt = {
  a: TelaKey; // tela atual
  b: TelaKey; // tela que está entrando
  p: number; // 0..1 progresso da troca a -> b
  modo: number; // 0 = abrir app (zoom + fade), 1 = empurrar (navegação iOS, entra pela direita)
  luz: number; // 0..1 brilho da tela (acordar)
  brilhoCard: number; // 0..1 contorno coral no card da guia (Início)
  conta: number; // 0..1 contador do valor no Início (R$ 0,00 até o valor da captura)
  calc: number; // 0..1 brilho de carregamento passando no esqueleto do "Pagar agora" (Início)
  toque: number; // 0..1 toque no botão "Ver a guia" (anel que abre)
  toqueBotao: number; // 0..1 toque no "Pagar agora" do Início: círculo de toque, aperta e solta em anel
  pulso: number; // 0..1 pulso único do "Pagar agora" no "só" (1 a 1,04 a 1), antes do toque
  verif: number; // 0..1 o botão mostra o retorno do toque (1) ou volta a ser "Pagar agora" (0)
  anel: number; // 0..1 anel que abre em volta do botão no retorno (uma vez)
  verifTexto: string; // retorno real do app ao pagar: "Código copiado" (impostos/pagar/page.tsx:255)
};
export const novaTela = (): TelaSt => ({ a: "splash", b: "splash", p: 0, modo: 0, luz: 1, brilhoCard: 0, conta: 0, calc: 0, toque: 0, toqueBotao: 0, pulso: 0, verif: 0, anel: 0, verifTexto: "Código copiado" });

// regiões medidas nas telas montadas (px da tela 1290x2796)
export const CARD = { x: 72, y: 424, w: 1146, h: 486, r: 46 }; // card "Vence dia 20" no Início
// valor fictício da empresa de exemplo do app (o Pedro liberou nítido em 01/10); a tela-inicio.png vem sem ele e
// o contador escreve aqui, com a fonte e a posição ajustadas contra a captura (Sora 600 59px, base 682)
const VALOR = 178.31;
const TEXTO_VALOR = { x: 125, y: 682 };
const ESQUELETO = { x: 123, y: 739, w: 389, h: 119, r: 28 }; // lugar do "Pagar agora" enquanto calcula
export const BOTAO_VER = { x: 645 - 375, y: 2604 + 72, r: 0 }; // centro do botão "Ver a guia" (tela-imposto)
export const BOTAO_PAGAR = { x: 123, y: 739, w: 389, h: 119, r: 28 }; // "Pagar agora" no card do Início (medido na tela montada)
const COR_BOTAO = [184, 61, 28]; // #B83D1C, cor real do botão
// no app copiar é AÇÃO, não estado: o retorno fica no coral do botão, sem verde (regra "Coral nunca é estado"
// ao contrário; verde só pra estado confirmado, e o app não confirma pagamento: ADR L272, lista-passos 28/08)

const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));

export class PintorTela {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  imgs: Record<string, HTMLImageElement>;
  constructor(imgs: Record<string, HTMLImageElement>) {
    this.imgs = imgs;
    this.canvas = document.createElement("canvas");
    this.canvas.width = TW;
    this.canvas.height = TH;
    this.ctx = this.canvas.getContext("2d")!;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.flipY = true; // a UV da tela deste modelo segue a convenção do canvas (testado: com false sai de cabeça pra baixo)
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

  private varredura(reg: { x: number; y: number; w: number; h: number; r: number }, k: number) {
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

  /** contador do valor: R$ 0,00 até o valor da captura, no formato do app (vírgula nos centavos) */
  private contador(st: TelaSt) {
    const g = this.ctx;
    const v = VALOR * Math.max(0, Math.min(1, st.conta));
    g.save();
    g.font = "600 59px Sora";
    g.fillStyle = "#1B1E24";
    g.textAlign = "left";
    g.textBaseline = "alphabetic";
    g.fillText(`R$ ${v.toFixed(2).replace(".", ",")}`, TEXTO_VALOR.x, TEXTO_VALOR.y);
    g.restore();
  }


  /** "Pagar agora": pulso no "só", círculo de toque (como gravação de tela), aperto em 2 quadros e o retorno
   *  "Código copiado" (refs: "Button click" da Fanimation, check em arco do Rappi, "Success" do Apple Pay).
   *  Sem raios nem confete: confete depois do toque é a gramática do "Pagamento confirmado", que o app não diz aqui */
  private pagar(st: TelaSt, dx: number) {
    const g = this.ctx;
    const B = BOTAO_PAGAR;
    const bx = B.x + dx;
    const cx = bx + B.w / 2;
    const cy = B.y + B.h / 2;
    const v = Math.max(0, Math.min(1, st.verif));
    const tq = st.toqueBotao;
    const fase = (a: number, b: number) => Math.max(0, Math.min(1, (tq - a) / (b - a)));
    // aperto (toqueBotao dura 0,55 s a partir de 10,20 s): afunda até 0,95 em 2 quadros (10,233 a 10,300),
    // escurece 16%, segura 1 quadro, solta passando pra 1,03 e assenta em 1 até 10,47
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
    // salto curto quando o check fecha (1 a 1,04 a 1, de 10,57 a 10,72 s)
    const salto = v > 0.35 && v < 0.62 ? Math.sin((Math.PI * (v - 0.35)) / 0.27) : 0;
    const sc = esc * (1 + 0.04 * pulso) * (1 + 0.04 * salto);
    if (Math.abs(sc - 1) > 1e-4 || escuro > 0 || v > 0) {
      const cor = COR_BOTAO;
      // apaga o botão da captura antes de redesenhar, senão a borda dele aparece quando a pílula encolhe
      this.rr(bx - 3, B.y - 3, B.w + 6, B.h + 6, B.r + 3);
      g.fillStyle = "rgb(254,243,238)";
      g.fill();
      // a pílula alarga pra direita pra caber o check e o texto do retorno
      g.font = "600 46px Sora";
      const ic = 34; // raio do círculo do check
      const wTxt = g.measureText(st.verifTexto).width;
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
      // "Pagar agora" sobe um pouco e some
      const kl = ease(v / 0.1);
      if (kl < 1) {
        g.globalAlpha = 1 - kl;
        g.textAlign = "center";
        g.fillText("Pagar agora", ccx, cy + 2 - 12 * kl);
      }
      if (v > 0) {
        const total = ic * 2 + 18 + wTxt;
        const x0 = ccx - total / 2;
        // círculo do ícone fechando como arco (10,38 a 10,50 s)
        const kc = ease(v / 0.22);
        g.globalAlpha = 1;
        g.lineWidth = 7;
        g.lineCap = "round";
        g.lineJoin = "round";
        g.strokeStyle = "#FFFFFF";
        g.beginPath();
        g.arc(x0 + ic, cy, ic - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * kc);
        g.stroke();
        // check em traço (10,47 a 10,57 s)
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
        // "Código copiado" entra subindo (10,40 a 10,52 s)
        const kt = ease((v - 0.04) / 0.22);
        if (kt > 0) {
          g.globalAlpha = kt;
          g.textAlign = "left";
          g.fillText(st.verifTexto, x0 + ic * 2 + 18, cy + 2 + 16 * (1 - kt));
        }
      }
      g.restore();
      // anel coral abrindo em volta do botão no retorno (uma vez só, controlado por `anel`)
      const ka = st.anel;
      if (ka > 0 && ka < 1) {
        g.save();
        g.globalAlpha = 0.5 * (1 - ease(ka));
        g.strokeStyle = `rgb(${COR_BOTAO.join(",")})`;
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

  /** desenha uma tela com os extras dela (brilho do card, varredura, pagar, toque) na MESMA camada,
   *  pra transição levar tudo junto (sem extra de uma tela vazando por cima da outra) */
  private camada(k: TelaKey, st: TelaSt, x: number, s: number, alpha: number) {
    if (k === "apagada" || alpha <= 0) return;
    const g = this.ctx;
    g.save();
    g.globalAlpha = alpha;
    g.translate(TW / 2 + x, TH / 2);
    g.scale(s, s);
    g.translate(-TW / 2, -TH / 2);
    g.drawImage(this.imgs[k], 0, 0, TW, TH);
    if (k === "inicio" || k === "inicioPagar") {
      if (st.brilhoCard > 0) {
        g.save();
        g.globalAlpha = alpha * st.brilhoCard;
        g.lineWidth = 10;
        g.strokeStyle = "#F2643C";
        g.shadowColor = "rgba(242,100,60,0.7)";
        g.shadowBlur = 40;
        this.rr(CARD.x, CARD.y, CARD.w, CARD.h, CARD.r);
        g.stroke();
        g.restore();
      }
      if (k === "inicio") {
        this.contador(st);
        this.varredura(ESQUELETO, st.calc);
      }
      if (k === "inicioPagar") this.pagar(st, 0);
    }
    if (k === "imposto") {
      if (st.toque > 0 && st.toque < 1) {
        const kk = ease(st.toque);
        g.save();
        g.globalAlpha = alpha * 0.35 * (1 - kk);
        g.fillStyle = "#1B1E24";
        g.beginPath();
        g.arc(BOTAO_VER.x, BOTAO_VER.y, 40 + 220 * kk, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    }
    g.restore();
  }

  pinta(st: TelaSt) {
    const g = this.ctx;
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
