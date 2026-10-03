// Pintor do comprovante (dono K06; contrato: KIT/DESENHO.md, seção 4.9): papel como a guia DAS, com título
// "Comprovante de pagamento", a linha "Documento de Arrecadação do Simples Nacional" e, por padrão, os mesmos
// dados fictícios do PintorFolha (empresa de exemplo, CNPJ, período, vencimento, número do documento e valor).
// Identificadores inválidos de propósito, NÃO CORRIGIR: o CNPJ e o número do documento têm o DV errado (os do
// guia), a linha digitável tem o DV geral errado e a autenticação é uma sequência inventada que não autentica nada.
// Sem brasão, sem nome ou logo de banco, sem carimbo "PAGO", sem verde (o app não confirma pagamento). Com
// mostraValor false (obrigatório em peça de MEI, F063: o montaProps e o kit.py fatos recusam sem isso) o valor
// vira esqueleto.
import * as THREE from "three";
import { BORDA, DADOS_DAS_PADRAO, PAPEL, ROTULO_ESCURO, TINTA, TINTA2, barras, papelComGrao } from "./folhaDas";
import { novaTex, rr, textoQueCabe } from "./texturas";

export type DadosComprovante = {
  titulo: string;
  linha: string;
  razaoSocial: string; cnpj: string; periodo: string; vencimento: string; numeroDocumento: string;
  valor: string;
  linhaDigitavel: string;
  autenticacao: string;
  mostraValor: boolean;
};

export const DADOS_COMPROVANTE_PADRAO: DadosComprovante = {
  titulo: "Comprovante de pagamento",
  linha: "Documento de Arrecadação do Simples Nacional",
  razaoSocial: DADOS_DAS_PADRAO.razaoSocial,
  cnpj: DADOS_DAS_PADRAO.cnpj, // DV inválido de propósito, NÃO CORRIGIR
  periodo: DADOS_DAS_PADRAO.periodo,
  vencimento: DADOS_DAS_PADRAO.vencimento,
  numeroDocumento: DADOS_DAS_PADRAO.numeroDocumento, // DV inválido de propósito, NÃO CORRIGIR
  valor: DADOS_DAS_PADRAO.valor,
  linhaDigitavel: DADOS_DAS_PADRAO.linhaDigitavel, // DV geral inválido de propósito, NÃO CORRIGIR
  autenticacao: "5D2C.81A7.0F39.E46B.92C0.7A15.3E", // inventada, não autentica nada, NÃO CORRIGIR
  mostraValor: true,
};

/** cor do esqueleto que esconde o valor (sobre a caixa escura) */
const ESQUELETO = "rgba(252,246,238,0.22)";

export class PintorComprovante {
  c: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  dados: DadosComprovante;
  private pintado = false;
  constructor(conteudo?: Partial<DadosComprovante> | null, canvas: [number, number] = [660, 1210], flipY = true) {
    this.dados = { ...DADOS_COMPROVANTE_PADRAO, ...(conteudo || {}) };
    this.c = document.createElement("canvas");
    this.c.width = canvas[0];
    this.c.height = canvas[1]; // proporção do papel (0,06 x 0,11)
    this.g = this.c.getContext("2d")!;
    this.tex = novaTex(this.c, flipY);
    // como a folha: sem mipmap, pra os rótulos pequenos ficarem legíveis
    this.tex.generateMipmaps = false;
    this.tex.minFilter = THREE.LinearFilter;
  }

  private campo(x: number, y: number, w: number, h: number, rotulo: string, valor: string, fonteValor: string) {
    const g = this.g;
    rr(g, x, y, w, h, 12);
    g.strokeStyle = BORDA;
    g.lineWidth = 3;
    g.stroke();
    g.textAlign = "left";
    g.textBaseline = "alphabetic";
    g.font = "700 20px Sora";
    g.fillStyle = TINTA2;
    g.fillText(rotulo, x + 18, y + 32);
    g.fillStyle = TINTA;
    textoQueCabe(g, valor, fonteValor, w - 36);
    g.fillText(valor, x + 18, y + h - 22);
  }

  pinta() {
    if (this.pintado) return; // estático: pinta e sobe a textura uma vez só
    const d = this.dados;
    const g = this.g;
    const W = this.c.width;
    const H = this.c.height;
    // escala do desenho: o layout é pensado em 660 x 1210 (o canvas do catálogo)
    const kx = W / 660;
    const ky = H / 1210;
    papelComGrao(g, W, H, "#FBF7F1", 11, Math.round(1800 * kx * ky));
    g.save();
    g.scale(kx, ky);
    const M = 44; // margem
    const L = 660 - 2 * M; // largura útil
    // título e a linha do documento
    g.textBaseline = "alphabetic";
    g.textAlign = "left";
    g.fillStyle = TINTA;
    textoQueCabe(g, d.titulo, "800 46px Sora", L);
    g.fillText(d.titulo, M, 104);
    g.fillStyle = TINTA2;
    textoQueCabe(g, d.linha, "700 26px Sora", L);
    g.fillText(d.linha, M, 146);
    // campos
    this.campo(M, 182, L, 96, "Razão Social", d.razaoSocial, "700 25px Sora");
    const meio = (L - 16) / 2;
    this.campo(M, 292, meio, 96, "CNPJ", d.cnpj, "700 27px Sora");
    this.campo(M + meio + 16, 292, meio, 96, "Período de Apuração", d.periodo, "700 27px Sora");
    this.campo(M, 402, meio, 96, "Data de Vencimento", d.vencimento, "700 27px Sora");
    this.campo(M + meio + 16, 402, meio, 96, "Número do Documento", d.numeroDocumento, "700 24px Sora");
    // valor (ou esqueleto)
    rr(g, M, 516, L, 150, 14);
    g.fillStyle = TINTA;
    g.fill();
    g.font = "600 22px Sora";
    g.fillStyle = ROTULO_ESCURO;
    g.fillText("Valor Total do Documento", M + 22, 556);
    if (d.mostraValor) {
      g.fillStyle = PAPEL;
      textoQueCabe(g, d.valor, "800 60px Sora", L - 44);
      g.fillText(d.valor, M + 22, 636);
    } else {
      rr(g, M + 22, 586, 300, 56, 18);
      g.fillStyle = ESQUELETO;
      g.fill();
    }
    // autenticação (inventada, NÃO CORRIGIR)
    rr(g, M, 690, L, 128, 12);
    g.strokeStyle = BORDA;
    g.lineWidth = 3;
    g.stroke();
    g.font = "700 20px Sora";
    g.fillStyle = TINTA2;
    g.fillText("Autenticação", M + 18, 722);
    g.fillStyle = TINTA;
    textoQueCabe(g, d.autenticacao, "700 30px Sora", L - 36);
    g.fillText(d.autenticacao, M + 18, 786);
    // linha digitável e barras decorativas (não codificam nada)
    g.font = "700 20px Sora";
    g.fillStyle = TINTA2;
    g.fillText("Linha digitável", M, 872);
    g.fillStyle = TINTA;
    textoQueCabe(g, d.linhaDigitavel, "700 21px Sora", L);
    g.fillText(d.linhaDigitavel, M, 906);
    barras(g, M, 930, L, 104, 20261002);
    g.restore();
    this.tex.needsUpdate = true;
    this.pintado = true;
  }
}
