// Pintor do mostrador do relógio (dono K06): o PintorRelogio do src/guia/pinturas.ts com hora, app, quando e
// linhas como parâmetro. Com os valores do guia ("9:41", "LEGALIZAÍ", "agora", ["Vence", "dia 20."]) o
// desenho é idêntico ao original. O relógio mostra uma notificação do app espelhada (F040: a Legalizaí avisa
// prazos e vencimentos pelo app); nada aqui é captura do app.
import type * as THREE from "three";
import type { MostradorSt } from "../../nucleo/tipos";
import { back, ease, novaTex, rr } from "./texturas";

export type Mostrador = { hora: string; app: string; quando: string; linhas: string[] };

export const MOSTRADOR_GUIA: Mostrador = { hora: "9:41", app: "LEGALIZAÍ", quando: "agora", linhas: ["Vence", "dia 20."] };

export class PintorRelogioKit {
  c: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  icone: HTMLImageElement | null;
  m: Mostrador;
  constructor(icone: HTMLImageElement | null, mostrador?: Partial<Mostrador> | null, telaPx: [number, number] = [420, 512], flipY = true) {
    this.icone = icone;
    this.m = { ...MOSTRADOR_GUIA, ...(mostrador || {}) };
    this.c = document.createElement("canvas");
    this.c.width = telaPx[0]; // proporção da tela do relógio (~0,82)
    this.c.height = telaPx[1];
    this.g = this.c.getContext("2d")!;
    this.tex = novaTex(this.c, flipY);
  }
  pinta(st: MostradorSt, t: number) {
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
    g.fillText(this.m.hora, W / 2, H * 0.46 - k * 40);
    g.restore();
    if (st.notif > 0) {
      // cartão de notificação subindo de baixo, com o símbolo do app
      const y0 = H * (1 - back(st.notif, 1.2)) * 0.9;
      g.save();
      g.translate(0, y0);
      g.fillStyle = "#26272B";
      rr(g, 18, 70, W - 36, H - 120, 46);
      g.fill();
      if (this.icone) g.drawImage(this.icone, 44, 96, 64, 64);
      g.fillStyle = "#BDB8B0";
      g.font = "600 28px Sora";
      g.textBaseline = "middle";
      g.fillText(this.m.app, 124, 116);
      g.fillStyle = "#8E8A84";
      g.font = "500 24px Sora";
      g.fillText(this.m.quando, 124, 146);
      // só a informação nova do trecho, grande, uma linha de conteúdo por item (no guia: "Vence" e "dia 20.")
      g.fillStyle = "#F47F58";
      g.font = "800 88px Sora";
      this.m.linhas.forEach((linha, i) => g.fillText(linha, 44, 262 + 90 * i));
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
