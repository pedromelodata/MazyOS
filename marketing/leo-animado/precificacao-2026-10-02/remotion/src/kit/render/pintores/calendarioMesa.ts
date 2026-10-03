// Pintor da página do calendário de mesa (dono K06; contrato: KIT/DESENHO.md, seção 4.9): mês por extenso em
// pt-BR, a grade dos dias, o dia 20 em destaque coral e, opcional, a frase "passa pro próximo dia útil" (F077 e
// o fato do DAS do MEI: dia 20 que cai em dia não útil prorroga pro próximo dia útil). Tudo é parâmetro.
// Paleta da marca e Sora. Feito pro glb-calendario-mesa (texturaMalha na malha "Mesh2 Calendar_C01_1"): a UV da
// página usa o canvas inteiro na largura, mas a FRENTE só vai de v 0,337 a v 1 (de 0 a 0,314 é a borda de cima,
// que fica com a cor do cabeçalho) e a frente mede 23 x 12,81 no arquivo (proporção 1,795). O desenho é feito
// nessa proporção e espremido na horizontal pra sair sem distorção no modelo.
import type * as THREE from "three";
import { novaTex, rr, textoQueCabe } from "./texturas";

export const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const INICIAIS = ["D", "S", "T", "Q", "Q", "S", "S"]; // domingo a sábado

export type ParamsCalendario = {
  mes: number; // 1 a 12
  ano: number;
  dia: number; // dia em destaque
  frase: string | null; // por exemplo "passa pro próximo dia útil"; null não mostra
  maiuscula: boolean; // "Outubro" (true) ou "outubro" (false)
  frente: { u0: number; u1: number; v0: number; v1: number; aspecto: number };
  cores: { cabecalho: string; textoCabecalho: string; pagina: string; texto: string; semana: string; destaque: string; textoDestaque: string; frase: string };
};

export const PARAMS_CALENDARIO_PADRAO: ParamsCalendario = {
  mes: 10,
  ano: 2026,
  dia: 20,
  frase: null,
  maiuscula: true,
  frente: { u0: 0, u1: 1, v0: 0.337, v1: 1, aspecto: 1.795 },
  cores: {
    cabecalho: "#F2643C",
    textoCabecalho: "#FFFFFF",
    pagina: "#FBF8F3",
    texto: "#1B1E24",
    semana: "#524E48",
    destaque: "#F2643C",
    textoDestaque: "#FFFFFF",
    frase: "#DD4E27",
  },
};

/** dia da semana (0 = domingo) do dia 1 do mês */
export function primeiroDiaDaSemana(ano: number, mes: number) {
  return new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay();
}

export function diasNoMes(ano: number, mes: number) {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

export class PintorCalendarioMesa {
  c: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  p: ParamsCalendario;
  private pintado = false;
  constructor(params?: Partial<ParamsCalendario> | null, canvas: [number, number] = [512, 512], flipY = false) {
    const pp = params || {};
    this.p = {
      ...PARAMS_CALENDARIO_PADRAO,
      ...pp,
      frente: { ...PARAMS_CALENDARIO_PADRAO.frente, ...(pp.frente || {}) },
      cores: { ...PARAMS_CALENDARIO_PADRAO.cores, ...(pp.cores || {}) },
    };
    this.c = document.createElement("canvas");
    this.c.width = canvas[0];
    this.c.height = canvas[1];
    this.g = this.c.getContext("2d")!;
    this.tex = novaTex(this.c, flipY);
  }

  pinta() {
    if (this.pintado) return; // página estática
    const p = this.p;
    const cor = p.cores;
    const g = this.g;
    const W = this.c.width;
    const H = this.c.height;
    // tudo que não é a frente (a borda de cima da página) fica com a cor do cabeçalho
    g.fillStyle = cor.cabecalho;
    g.fillRect(0, 0, W, H);
    // a frente: região do canvas e o espaço lógico na proporção física
    const x0 = p.frente.u0 * W;
    const y0 = p.frente.v0 * H;
    const wpx = (p.frente.u1 - p.frente.u0) * W;
    const hpx = (p.frente.v1 - p.frente.v0) * H;
    const HL = hpx;
    const WL = hpx * p.frente.aspecto;
    g.save();
    g.setTransform(wpx / WL, 0, 0, 1, x0, y0);
    g.fillStyle = cor.pagina;
    g.fillRect(0, 0, WL, HL);
    // cabeçalho com o mês por extenso
    const hCab = HL * 0.2;
    g.fillStyle = cor.cabecalho;
    g.fillRect(0, 0, WL, hCab);
    const nome = MESES[(p.mes - 1 + 120) % 12];
    const mes = p.maiuscula ? nome.charAt(0).toUpperCase() + nome.slice(1) : nome;
    g.fillStyle = cor.textoCabecalho;
    g.textAlign = "center";
    g.textBaseline = "middle";
    textoQueCabe(g, mes, `800 ${Math.round(hCab * 0.62)}px Sora`, WL * 0.9);
    g.fillText(mes, WL / 2, hCab / 2 + 1);
    // grade
    const margem = WL * 0.03;
    const cw = (WL - 2 * margem) / 7;
    const ySemana = hCab + HL * 0.085;
    g.font = `700 ${Math.round(HL * 0.056)}px Sora`;
    g.fillStyle = cor.semana;
    INICIAIS.forEach((l, i) => g.fillText(l, margem + cw * (i + 0.5), ySemana));
    const inicio = primeiroDiaDaSemana(p.ano, p.mes);
    const total = diasNoMes(p.ano, p.mes);
    const semanas = Math.ceil((inicio + total) / 7);
    const yGrade = ySemana + HL * 0.05;
    const reservaFrase = p.frase ? HL * 0.13 : HL * 0.03;
    const rh = (HL - yGrade - reservaFrase) / semanas;
    const fonteDia = `600 ${Math.round(Math.min(rh * 0.62, cw * 0.42))}px Sora`;
    for (let d = 1; d <= total; d++) {
      const k = inicio + d - 1;
      const cx = margem + cw * ((k % 7) + 0.5);
      const cy = yGrade + rh * (Math.floor(k / 7) + 0.5);
      if (d === p.dia) {
        // destaque: pílula coral com o número em branco (o "dia 20")
        const rx = cw * 0.4;
        const ry = rh * 0.44;
        rr(g, cx - rx, cy - ry, 2 * rx, 2 * ry, Math.min(rx, ry));
        g.fillStyle = cor.destaque;
        g.fill();
        g.fillStyle = cor.textoDestaque;
        g.font = fonteDia.replace(/^600/, "800");
      } else {
        g.fillStyle = cor.texto;
        g.font = fonteDia;
      }
      g.fillText(String(d), cx, cy + 1);
    }
    if (p.frase) {
      g.fillStyle = cor.frase;
      textoQueCabe(g, p.frase, `700 ${Math.round(HL * 0.07)}px Sora`, WL * 0.92);
      g.fillText(p.frase, WL / 2, HL - reservaFrase / 2);
    }
    g.restore();
    this.tex.needsUpdate = true;
    this.pintado = true;
  }
}
