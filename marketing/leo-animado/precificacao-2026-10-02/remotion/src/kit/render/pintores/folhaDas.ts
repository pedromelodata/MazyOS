// Pintor da guia de papel (dono K06): o PintorFolha do src/guia/pinturas.ts, idêntico, com os dados como
// parâmetro (padrão = os do original). Sem dados novos o canvas sai igual ao do guia. Com mostraValor false
// (obrigatório em peça de MEI, F063: o montaProps recusa a folha sem isso) o valor vira esqueleto, como no
// comprovante; o resto do desenho não muda.
//
// A guia é um DAS do Simples Nacional desenhado com os campos e a ordem do modelo oficial e os dados fictícios do
// app (impostos/pagar/page.tsx): razão social e CNPJ do mock, junho/2026, vence 20/07/2026 (dia 20 do mês
// seguinte, F077), R$ 178,31. Sem brasão, sem logo do Simples, sem "Receita Federal", sem marca nem coral da
// Legalizaí. O quadro "Composição" fica fora: inventaria valor por tributo e deixaria a alíquota calculável
// (P13, P14). A linha digitável segue a estrutura FEBRABAN com o DV geral errado; o DV do número do documento
// e o do CNPJ também. Identificadores inválidos de propósito, NÃO CORRIGIR (revisão de regras de 01/10): nenhum
// banco aceita, mesmo pausando o vídeo, e nenhum coincide com o DAS de alguém. As barras são decorativas.
import * as THREE from "three";
import { novaTex, rr } from "./texturas";

export const TINTA = "#1B1E24";
export const TINTA2 = "#524E48";
export const PAPEL = "#FCF6EE";
export const ROTULO_ESCURO = "rgba(252,246,238,0.78)";
export const BORDA = "rgba(82,78,72,0.72)";

/** dados fictícios da guia (os do PintorFolha); identificadores inválidos de propósito, NÃO CORRIGIR */
export type DadosDas = {
  titulo1: string; titulo2: string;
  razaoSocial: string; cnpj: string; periodo: string; vencimento: string; numeroDocumento: string;
  pagarAte: string; valor: string; linhaDigitavel: string;
  /** false troca o valor por esqueleto (peça de MEI, F063); padrão true, o desenho do guia */
  mostraValor: boolean;
};

export const DADOS_DAS_PADRAO: DadosDas = {
  titulo1: "Documento de Arrecadação",
  titulo2: "do Simples Nacional",
  razaoSocial: "ANA BEATRIZ RAMOS DESENV. DE SOFTWARE",
  cnpj: "54.321.000/0001-09", // DV inválido de propósito (o certo seria 12), NÃO CORRIGIR
  periodo: "Junho/2026",
  vencimento: "20/07/2026",
  numeroDocumento: "07.20.26182.5730941-8", // DV inválido de propósito (o certo seria 0), NÃO CORRIGIR
  pagarAte: "20/07/2026",
  valor: "R$ 178,31",
  linhaDigitavel: "85830000001 7  78310328262 6  01072026182 9  57309418419 1", // DV geral inválido, NÃO CORRIGIR
  mostraValor: true,
};

/** cor do esqueleto que esconde o valor (sobre a caixa escura), a mesma do comprovante */
const ESQUELETO_VALOR = "rgba(252,246,238,0.22)";

type Caixa = { x: number; y: number; w: number; h: number; raio: number; borda?: string; cor?: string };
type Linha = { t: string; x: number; y: number; f: string; c: string; a: CanvasTextAlign; ehValor?: boolean };

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

function linhasDe(d: DadosDas): Linha[] {
  const linhas = todasAsLinhas(d);
  // sem o valor (peça de MEI): a linha do valor sai e o pinta() desenha o esqueleto no lugar
  return d.mostraValor === false ? linhas.filter((l) => !l.ehValor) : linhas;
}

function todasAsLinhas(d: DadosDas): Linha[] {
  return [
    { t: d.titulo1, x: 44, y: 82, f: "700 38px Sora", c: TINTA, a: "left" },
    { t: d.titulo2, x: 44, y: 128, f: "700 38px Sora", c: TINTA, a: "left" },
    { t: "Razão Social", x: 62, y: 186, f: "700 18px Sora", c: TINTA2, a: "left" },
    { t: d.razaoSocial, x: 62, y: 224, f: "700 22px Sora", c: TINTA, a: "left" },
    { t: "CNPJ", x: 62, y: 280, f: "700 18px Sora", c: TINTA2, a: "left" },
    { t: d.cnpj, x: 62, y: 318, f: "700 24px Sora", c: TINTA, a: "left" },
    { t: "Período de Apuração", x: 374, y: 280, f: "700 18px Sora", c: TINTA2, a: "left" },
    { t: d.periodo, x: 374, y: 318, f: "700 24px Sora", c: TINTA, a: "left" },
    { t: "Data de Vencimento", x: 62, y: 374, f: "700 18px Sora", c: TINTA2, a: "left" },
    { t: d.vencimento, x: 62, y: 412, f: "700 24px Sora", c: TINTA, a: "left" },
    { t: "Número do Documento", x: 374, y: 374, f: "700 18px Sora", c: TINTA2, a: "left" },
    { t: d.numeroDocumento, x: 374, y: 412, f: "700 22px Sora", c: TINTA, a: "left" },
    { t: "Pagar este documento até", x: 62, y: 480, f: "600 18px Sora", c: ROTULO_ESCURO, a: "left" },
    { t: d.pagarAte, x: 62, y: 548, f: "800 36px Sora", c: PAPEL, a: "left" },
    { t: "Valor Total do Documento", x: 374, y: 480, f: "600 18px Sora", c: ROTULO_ESCURO, a: "left" },
    { t: d.valor, x: 374, y: 548, f: "800 36px Sora", c: PAPEL, a: "left", ehValor: true },
    { t: "Observações", x: 62, y: 624, f: "700 18px Sora", c: TINTA2, a: "left" },
    { t: "AUTENTICAÇÃO MECÂNICA", x: 676, y: 944, f: "700 16px Sora", c: TINTA2, a: "right" },
  ];
}

/** código de barras decorativo (não codifica nada): ritmo de barras finas e grossas, semente fixa (não pisca) */
export function barras(g: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, semente = 20260720) {
  let s = semente;
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

/** papel quente com grão leve (fixo, semente constante) e contorno: o fundo do PintorFolha */
export function papelComGrao(g: CanvasRenderingContext2D, W: number, H: number, cor = PAPEL, semente = 7, graos = 1800) {
  g.fillStyle = cor;
  g.fillRect(0, 0, W, H);
  let s = semente;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  g.fillStyle = "rgba(120,100,80,0.035)";
  for (let i = 0; i < graos; i++) g.fillRect(rnd() * W, rnd() * H, 2, 2);
  g.strokeStyle = "rgba(80,56,30,0.16)";
  g.lineWidth = 4;
  g.strokeRect(2, 2, W - 4, H - 4);
}

export class PintorFolhaKit {
  c: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  dados: DadosDas;
  private pintada = false;
  constructor(dados?: Partial<DadosDas> | null, canvas: [number, number] = [720, 1016], flipY = true) {
    this.dados = { ...DADOS_DAS_PADRAO, ...(dados || {}) };
    this.c = document.createElement("canvas");
    this.c.width = canvas[0];
    this.c.height = canvas[1]; // proporção da folha (0,068 x 0,096)
    this.g = this.c.getContext("2d")!;
    this.tex = novaTex(this.c, flipY);
    // a folha aparece com ~0,8 do tamanho do canvas: sem mipmap os rótulos e as bordas finas ficam legíveis
    this.tex.generateMipmaps = false;
    this.tex.minFilter = THREE.LinearFilter;
  }
  pinta() {
    if (this.pintada) return; // conteúdo estático: pinta e sobe a textura uma vez só
    const g = this.g;
    const W = this.c.width;
    const H = this.c.height;
    // papel quente com grão leve (fixo, semente constante) e contorno
    papelComGrao(g, W, H);
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
    for (const l of linhasDe(this.dados)) {
      g.font = l.f;
      g.fillStyle = l.c;
      g.textAlign = l.a;
      g.fillText(l.t, l.x, l.y);
    }
    if (this.dados.mostraValor === false) {
      // esqueleto na linha do valor total (x 374, linha de base 548, 800 36px), dentro da caixa escura
      rr(g, 374, 514, 230, 44, 16);
      g.fillStyle = ESQUELETO_VALOR;
      g.fill();
    }
    // linha digitável: 4 grupos de 11 dígitos + DV, numa linha só, como no DAS real
    g.font = "700 18px Sora";
    g.fillStyle = TINTA;
    g.textAlign = "left";
    g.fillText(this.dados.linhaDigitavel, 44, 798);
    barras(g, 44, 816, 632, 92);
    this.tex.needsUpdate = true;
    this.pintada = true;
  }
}
