// Extensão "tradicional-vs-legalizai" do kit de motion: o que as batidas (puras) e o render dividem.
// Reel de 05/10/2026 "Contabilidade tradicional vs Legalizaí", versão animada do carrossel do mesmo dia.
// Puro: sem React, sem DOM e sem Remotion (o Node das props, dos eventos e do qc também empacota este arquivo).
// Só a matemática do three (projeção) e o CustomEase do núcleo (curvas novas com prefixo "kit").
//
// O palco é um objeto só da cena (tipo "palco-tvl"): as duas vitrines, as peças de argila do lado Tradicional
// (importadas do carrossel), os cartões que saem da tela, a fileira de placas, a moeda e o sino. O estado de tudo
// mora em st.canais: "palco" (as vitrines e a luz) e "p:<peça>" (uma por peça). As batidas animam esses números
// na timeline mestre do kit; o render só lê.
import { CustomEase } from "gsap/CustomEase";
import type { CamSt, Ctx, Estado, ObjetoProps } from "../../nucleo/tipos";
import { criaEaseKit, type CustomEaseMinimo } from "../../nucleo/eases";
import { desprojeta, projetaPonto } from "../../nucleo/projecao";

/** altura do chão das vitrines (a mesma "mesa" do kit: as sombras do núcleo caem aqui) */
export const MESA = -0.0905;
/** tipo do objeto da cena */
export const TIPO_PALCO = "palco-tvl";
/** id padrão do canal do palco (vitrines e luz) */
export const PALCO = "palco";
/** prefixo dos canais das peças */
export const P = "p:";

export type Vals = Record<string, number>;
export type Canal = Record<string, number>;

// ---------- curvas da peça ----------
// O kit tem lgEntra (12% de excesso), lgSai e lgPousa (uns 10%). Argila e papel passam do ponto no máximo 5%
// (linguagem de movimento do roteiro), então a peça ganha uma curva com prefixo "kit" (criaEaseKit do núcleo:
// nunca redefine curva que já existe).
export const CURVAS: Record<string, string> = {
  // pouso com mola curta: passa 4,5% e assenta (argila subindo do chão, cartão pousando, pasta encostando)
  kitPousa5: "M0,0 C0.16,0.66 0.26,1.05 0.42,1.045 0.6,1.04 0.78,1 1,1",
  // saída de argila por encolhimento: cresce uns 3% (antecipação) e some acelerando, sem atravessar o chão
  kitEncolhe: "M0,0 C0.18,-0.07 0.42,-0.06 0.62,0.2 0.78,0.42 0.9,0.72 1,1",
  // chegada com velocidade: começa devagar e acelera até o contato (o som do pouso cai no toque)
  kitChega: "M0,0 C0.3,0.05 0.62,0.32 1,1",
};

let curvasProntas = false;
/** cria as curvas da peça (só na primeira batida que precisar; o CustomEase já está registrado pelo kit) */
export function garanteCurvas(): void {
  if (curvasProntas) return;
  const ce = CustomEase as unknown as CustomEaseMinimo;
  for (const nome of Object.keys(CURVAS)) criaEaseKit(ce, nome, CURVAS[nome]);
  curvasProntas = true;
}

// ---------- canais ----------
export function canalDe(st: Estado, id: string): Canal {
  if (!st.canais[id]) st.canais[id] = {};
  return st.canais[id];
}

/** os padrões que faltam no canal (o que já existe fica) */
export function garante(c: Canal, padroes: Vals): Canal {
  for (const k of Object.keys(padroes)) if (typeof c[k] !== "number") c[k] = padroes[k];
  return c;
}

const num = (x: unknown, p: number) => (typeof x === "number" && isFinite(x) ? x : p);

// ---------- câmera de repouso e tela ----------
/** câmera do carrossel (elevação de 12°) no enquadramento de repouso do reel: aparelho com uns 330 px de largura
 *  centrado em x 780, vitrines de x 72 a 1008. Os pousos dos cartões e das placas são dados em px dessa câmera. */
export const CAM_REPOUSO: CamSt = { x: 0, y: 0.21939, z: 0.88298, tx: 0, ty: 0.0317, tz: 0, fov: 28 };

export type PontoTela = { px: number; py: number; z: number };

/** ponto do mundo no plano z que cai no px (px, py) da câmera dada */
export function noMundo(p: PontoTela, cam: CamSt = CAM_REPOUSO): { x: number; y: number; z: number } {
  return desprojeta(p.px, p.py, cam, p.z);
}

/** largura no mundo (no plano z) de um trecho de larguraPx centrado em (px, py) */
export function larguraNoMundo(p: PontoTela, larguraPx: number, cam: CamSt = CAM_REPOUSO): number {
  const a = desprojeta(p.px - larguraPx / 2, p.py, cam, p.z);
  const b = desprojeta(p.px + larguraPx / 2, p.py, cam, p.z);
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function projeta(x: number, y: number, z: number, cam: CamSt): { px: number; py: number } {
  const r = projetaPonto([x, y, z], cam);
  return { px: r.px, py: r.py };
}

// ---------- vitrines ----------
/** âncoras das vitrines no mundo: as bordas laterais no plano z = 0 (na altura do alvo da câmera), o topo no
 *  fundo e a base no chão da frente. Projetadas a cada quadro, viram os dois painéis arredondados do carrossel. */
export type Vitrine = {
  borda: number; // |x| da borda de fora (as duas vitrines são simétricas em volta de x = 0)
  vao: number; // |x| da borda de dentro (metade do vão)
  yTopo: number;
  zFundo: number;
  zFrente: number;
  raio: number; // px
  yAncora: number; // altura em que as bordas laterais são medidas
};
export const VITRINE_PADRAO: Vitrine = { borda: 0.1097, vao: 0.0028, yTopo: 0.0958, zFundo: -0.07, zFrente: 0.06, raio: 24, yAncora: 0.0317 };

/** canais do palco (vitrines, luz e fio) e os valores do quadro 0 */
export const CANAIS_PALCO: Vals = {
  fusao: 0, // 0 duas vitrines, 1 um painel só (o vão fechado)
  aquece: 0, // 0 vitrine fria, 1 com o tom da quente
  escala: 1, // tamanho dos painéis em volta de (ex, ey)
  ex: 540,
  ey: 1180,
  alfa: 1, // opacidade dos painéis (o fecho some no papel)
  halo: 0.4, // halo coral da vitrine quente
  brilho: 0, // brilho do splash no chão
  brilhoNeutro: 0, // 0 coral (splash), 1 claro (app aberto)
  varre: 0, // varredura de luz fria (0 a 1)
  varreI: 0, // intensidade da varredura
  fio: 0, // fio de luz no vão (0 a 1, descendo)
  fioA: 0, // opacidade do fio
};

// ---------- peças ----------
export type TipoPeca =
  | "pilha" | "carimbo" | "despertador" | "pasta" | "envelope" | "lupa"
  | "cartao-app" | "cartao-imposto" | "placa" | "moeda" | "sino" | "faisca";

export type PecaDef = {
  tipo: TipoPeca;
  lado: "frio" | "quente";
  // pose de repouso (mundo, em metros e radianos); nas peças presas a outra (pai), é a pose local
  x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number;
  altura: number; // altura da peça (as trocas da vitrine fria não atravessam o chão: a peça encolhe no pé)
  visivel: boolean; // no quadro 0 (e no fim do loop)
  pai?: string;
  opcoes?: Record<string, unknown>;
  inicial?: Vals; // canais do quadro 0 fora do padrão do tipo (ex.: a pasta que já entra aberta)
};

/** canais de cada peça: deslocamentos sobre a pose de repouso (x, y, z, rx, ry, rz), escala, visibilidade e os
 *  canais próprios do tipo. enc é a escala da troca da vitrine fria (1 inteira, 0 sumida no pé da peça: nada
 *  atravessa o chão); painel 1 prende a peça ao painel no fecho (mesmo centro e mesma escala dele); alfa é a
 *  opacidade (só no fecho, junto com o painel). */
export const CANAIS_PECA: Vals = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, sy: 1, vis: 1, enc: 1, painel: 0, alfa: 1 };

export const CANAIS_POR_TIPO: Record<string, Vals> = {
  // marca: a marca do carimbo no formulário de cima (0 a 1); voa: o formulário sai da pilha e entra na pasta (0 a 1)
  pilha: { tremor: 0, marca: 0, voa: 0 },
  carimbo: { sobe: 0, achata: 0 },
  despertador: {},
  // folhas: 0 pra fora da pasta, 1 dentro; abre: 1 com a frente inclinada pra frente (aberta), 0 fechada
  pasta: { folhas: 0, abre: 0 },
  envelope: {},
  lupa: {},
  // cartões: prende 1 = colado na tela (o mesmo recorte da vaga); 0 = solto, na pose de pouso; larg 0 = largura
  // da vaga, 1 = largura compacta do voo; arco = altura do arco no voo
  "cartao-app": { prende: 1, arco: 0, achata: 0, larg: 0 },
  "cartao-imposto": { prende: 1, arco: 0, achata: 0, larg: 0, brilho: 0, conta: 0, calc: 0, mostraValor: 0, revela: 0, brilhoBotao: 0, pulso: 0, toque: 0, verif: 0, anel: 0, afunda: 0 },
  // entregue: a pílula "Entregue" do app na placa que volta pra fileira (0 a 1)
  placa: { prende: 1, salto: 0, entregue: 0 },
  moeda: { k: 0, giro: 0, brilho: 0 },
  sino: { balanco: 0 },
  faisca: { k: 0 },
};

/** a cena da peça: as peças de argila nas poses do carrossel, os cartões e as placas com o pouso em px da câmera
 *  de repouso. A cena pode trocar qualquer número por conteudo.pecas.<id> (mescla rasa). */
export const PECAS_PADRAO: Record<string, PecaDef> = {
  // Tradicional (argila fria); conjunto da capa no quadro 0. O formulário de cima da pilhaA recebe a marca do
  // carimbo e voa pra dentro da pastaA na "ida ao escritório" (opcoes.voaPara).
  pilhaA: { tipo: "pilha", lado: "frio", x: -0.066, y: 0, z: -0.012, rx: 0, ry: 0.12, rz: 0, s: 1, altura: 0.056, visivel: true, opcoes: { macos: [0.013, 0.012, 0.014, 0.012], semente: 11, voaPara: "pastaA", marca: true } },
  carimbo: { tipo: "carimbo", lado: "frio", pai: "pilhaA", x: 0.006, y: 0, z: 0.004, rx: 0, ry: 0.13, rz: 0, s: 1, altura: 0.13, visivel: true },
  despP: { tipo: "despertador", lado: "frio", x: -0.035, y: 0, z: 0.042, rx: 0, ry: 0.35, rz: 0, s: 1, altura: 0.066, visivel: true, opcoes: { tamanho: 0.062 } },
  // a pasta da "ida ao escritório" entra atrás da pilha, já aberta (frente inclinada); com o carimbo fora, a
  // folha carimbada voa pra dentro dela, a frente fecha girando e ela sai pela parede da esquerda
  pastaA: { tipo: "pasta", lado: "frio", x: -0.074, y: 0, z: -0.074, rx: -0.05, ry: 0.16, rz: 0, s: 0.85, altura: 0.11, visivel: false, opcoes: { folhas: 3, docFrente: false }, inicial: { abre: 1 } },
  despG: { tipo: "despertador", lado: "frio", x: -0.042, y: 0, z: 0.012, rx: 0, ry: 0.3, rz: 0, s: 1, altura: 0.095, visivel: false, opcoes: { tamanho: 0.09, segundos: true } },
  envelope: { tipo: "envelope", lado: "frio", x: -0.08, y: 0, z: -0.042, rx: 0, ry: 0.32, rz: -0.12, s: 1, altura: 0.11, visivel: false },
  pilhaB: { tipo: "pilha", lado: "frio", x: -0.068, y: 0, z: -0.006, rx: 0, ry: 0.1, rz: 0, s: 1, altura: 0.054, visivel: false, opcoes: { macos: [0.012, 0.013, 0.012, 0.012], semente: 3 } },
  // a lupa fica com o aro longe do vão (aro até uns x 460 na câmera de repouso); o pivô da troca é a ponta do cabo
  lupa: { tipo: "lupa", lado: "frio", x: -0.038, y: 0.0705, z: 0.02, rx: 0, ry: 0, rz: 0.24, s: 0.75, altura: 0.125, visivel: false, opcoes: { pivo: [0, -0.094, 0] } },
  pastaC: { tipo: "pasta", lado: "frio", x: -0.06, y: 0, z: -0.02, rx: 0, ry: 0.2, rz: 0, s: 1, altura: 0.135, visivel: false, opcoes: { folhas: 3, docFrente: true } },
  // Legalizaí: os cartões nascem com o recorte EXATO da vaga na tela (opcoes.regiao, em px da tela montada) e só
  // mudam durante o voo: crescem e, se pedirem, ficam compactos (opcoes.compacto: largura em px da tela, cortando
  // a sobra da direita). Pouso em px da câmera de repouso (opcoes.pouso {px, py, z, larguraPx}: o centro e a
  // largura do cartão já compacto).
  cartaoNasceu: {
    tipo: "cartao-app", lado: "quente", x: 0, y: 0, z: 0, rx: -0.2, ry: -0.12, rz: 0, s: 1, altura: 0, visivel: false,
    opcoes: {
      tela: "homeDia1",
      regiao: { x: 72, y: 209, w: 1146, h: 637 },
      raio: 46,
      compacto: 1064,
      corCorpo: "#24262C",
      pouso: { px: 734, py: 1238, z: 0.06, larguraPx: 470 },
    },
  },
  cartaoImposto: {
    tipo: "cartao-imposto", lado: "quente", x: 0, y: 0, z: 0, rx: -0.2, ry: -0.12, rz: 0, s: 1, altura: 0, visivel: false,
    opcoes: {
      tela: "inicio",
      regiao: { x: 72, y: 424, w: 1146, h: 486 },
      raio: 46,
      compacto: 648,
      corCorpo: "#FEF3EE",
      borda: "#F1D5C8",
      valorTexto: "R$ 178,31",
      valor: 178.31,
      rotulo: "Pagar agora",
      retorno: "Código copiado",
      corBotao: "#B83D1C",
      pouso: { px: 745, py: 1236, z: 0.06, larguraPx: 436 },
    },
  },
  // a linha "Contrato social" da tela de Documentos (a vaga tem os cantos de cima redondos e o divisor embaixo)
  cartaoContrato: {
    tipo: "cartao-app", lado: "quente", x: 0, y: 0, z: 0, rx: -0.16, ry: -0.1, rz: 0, s: 1, altura: 0, visivel: false,
    opcoes: {
      tela: "documentos",
      regiao: { x: 72, y: 813, w: 1146, h: 188 },
      raio: 46,
      raioBaixo: 0,
      compacto: 880,
      raioCompacto: 40,
      corCorpo: "#FFFFFF",
      borda: "#E6E1DA",
      bordaSo: "voo",
      pouso: { px: 752, py: 1084, z: 0.07, larguraPx: 470 },
    },
  },
  // fileira de quatro placas de papel creme, em leque: cada uma um pouco na frente da anterior
  placa1: { tipo: "placa", lado: "quente", x: 0, y: 0, z: 0, rx: -0.2, ry: -0.1, rz: 0.035, s: 1, altura: 0, visivel: false, opcoes: { ordem: 0 } },
  placa2: { tipo: "placa", lado: "quente", x: 0, y: 0, z: 0, rx: -0.2, ry: -0.1, rz: 0.012, s: 1, altura: 0, visivel: false, opcoes: { ordem: 1 } },
  placa3: { tipo: "placa", lado: "quente", x: 0, y: 0, z: 0, rx: -0.2, ry: -0.1, rz: -0.012, s: 1, altura: 0, visivel: false, opcoes: { ordem: 2, entregue: true } },
  placa4: { tipo: "placa", lado: "quente", x: 0, y: 0, z: 0, rx: -0.2, ry: -0.1, rz: -0.035, s: 1, altura: 0, visivel: false, opcoes: { ordem: 3 } },
  // moeda 1,5 vez maior (uns 170 px), pousando à esquerda e acima da fileira, sem tapar placa e longe de x 980;
  // sai da tela pela direita, por cima da fileira (origem em px da tela montada)
  moeda: { tipo: "moeda", lado: "quente", x: 0, y: 0, z: 0, rx: -0.16, ry: -0.18, rz: 0, s: 1.08, altura: 0, visivel: false, opcoes: { pouso: { px: 650, py: 1056, z: 0.075 }, origem: { u: 1010, v: 1400 } } },
  sino: { tipo: "sino", lado: "quente", x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0.3, s: 0.7, altura: 0, visivel: false, opcoes: { pouso: { px: 922, py: 800, z: 0.03 } } },
  faisca1: { tipo: "faisca", lado: "quente", x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, altura: 0, visivel: false, opcoes: { cor: "#F2643C", desloc: [0.02, 0.021, 0.012], tamanho: 0.014 } },
  faisca2: { tipo: "faisca", lado: "quente", x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, altura: 0, visivel: false, opcoes: { cor: "#F7A386", desloc: [-0.019, 0.023, 0.01], tamanho: 0.01 } },
};

/** fileira de placas (px da câmera de repouso): centros em 624, 716, 808 e 900, de x 571 a 953 (dentro da
 *  vitrine quente, longe do vão e da coluna de ícones do Reels); passo menor que a largura = leque */
export const FILEIRA_PADRAO = { px: 762, py: 1218, z: 0.052, larguraPx: 106, passoPx: 92, dz: 0.0022 };

export type ConteudoPalco = {
  aparelho?: string;
  vitrine?: Partial<Vitrine>;
  pecas?: Record<string, Partial<PecaDef>>;
  fileira?: Partial<typeof FILEIRA_PADRAO>;
  camRepouso?: Partial<CamSt>;
  luz?: Record<string, number>;
  estado?: Record<string, Vals>;
};

/** o objeto palco da cena e o conteúdo dele já mesclado com os padrões */
export type Palco = {
  id: string;
  objeto: ObjetoProps | null;
  aparelho: string;
  vitrine: Vitrine;
  pecas: Record<string, PecaDef>;
  fileira: typeof FILEIRA_PADRAO;
  camRepouso: CamSt;
};

export function palcoDe(objetos: ObjetoProps[], id = PALCO): Palco {
  const o = (objetos || []).filter((x) => x.id === id && x.tipo === TIPO_PALCO)[0] || (objetos || []).filter((x) => x.tipo === TIPO_PALCO)[0] || null;
  const c = ((o && o.conteudo) || {}) as ConteudoPalco;
  const pecas: Record<string, PecaDef> = {};
  for (const k of Object.keys(PECAS_PADRAO)) {
    const extra = (c.pecas && c.pecas[k]) || {};
    const base = PECAS_PADRAO[k];
    pecas[k] = {
      ...base,
      ...extra,
      opcoes: { ...(base.opcoes || {}), ...((extra.opcoes as Record<string, unknown>) || {}) },
      inicial: { ...(base.inicial || {}), ...((extra.inicial as Vals) || {}) },
    };
  }
  return {
    id: o ? o.id : id,
    objeto: o,
    aparelho: typeof c.aparelho === "string" ? c.aparelho : "aparelho",
    vitrine: { ...VITRINE_PADRAO, ...(c.vitrine || {}) },
    pecas,
    fileira: { ...FILEIRA_PADRAO, ...(c.fileira || {}) },
    camRepouso: { ...CAM_REPOUSO, ...(c.camRepouso || {}) },
  };
}

/** valores do quadro 0 de uma peça (def.inicial e, por cima, os da cena em conteudo.estado.<id>). Peça fria
 *  invisível começa encolhida (enc 0): ela entra crescendo no pé, sem atravessar o chão. */
export function inicialPeca(def: PecaDef, extra?: Vals): Vals {
  const r: Vals = { ...CANAIS_PECA, ...(CANAIS_POR_TIPO[def.tipo] || {}) };
  if (def.inicial) for (const k of Object.keys(def.inicial)) if (typeof def.inicial[k] === "number") r[k] = def.inicial[k];
  if (!def.visivel) {
    r.vis = 0;
    if (def.lado === "frio") r.enc = 0;
  }
  if (extra) for (const k of Object.keys(extra)) if (typeof extra[k] === "number") r[k] = extra[k];
  return r;
}

/** estado da cena pra uma peça (conteudo.estado.<id>), pra quem precisa voltar ao quadro 0 (a volta do loop) */
export function estadoDaCena(pal: Palco, id: string): Vals | undefined {
  const c = ((pal.objeto && pal.objeto.conteudo) || {}) as ConteudoPalco;
  return c.estado ? c.estado[id] : undefined;
}

/** garante os canais do palco e de todas as peças (idempotente; toda batida da peça chama antes de animar) */
export function iniciaCanais(st: Estado, ctx: Pick<Ctx, "props">, id = PALCO): Palco {
  const pal = palcoDe(ctx.props.objetos, id);
  const est = ((pal.objeto && pal.objeto.conteudo && (pal.objeto.conteudo as ConteudoPalco).estado) || {}) as Record<string, Vals>;
  garante(canalDe(st, pal.id), { ...CANAIS_PALCO, ...(est[pal.id] || {}) });
  for (const k of Object.keys(pal.pecas)) garante(canalDe(st, P + k), inicialPeca(pal.pecas[k], est[k]));
  return pal;
}

/** canal de uma peça (com conferência do nome) */
export function peca(st: Estado, pal: Palco, id: string): Canal {
  if (!pal.pecas[id]) throw new Error(`peça citada não existe: "${id}" (o palco tem: ${Object.keys(pal.pecas).join(", ")})`);
  return canalDe(st, P + id);
}

/** pose de pouso de uma peça do lado quente dada em px da câmera de repouso: {x, y, z, s} pra largura do modelo */
export function pousoDe(pal: Palco, pouso: { px: number; py: number; z: number; larguraPx?: number }, larguraModelo: number): { x: number; y: number; z: number; s: number } {
  const p = noMundo({ px: pouso.px, py: pouso.py, z: pouso.z }, pal.camRepouso);
  const s = pouso.larguraPx ? larguraNoMundo({ px: pouso.px, py: pouso.py, z: pouso.z }, pouso.larguraPx, pal.camRepouso) / larguraModelo : 1;
  return { x: p.x, y: p.y, z: p.z, s };
}

/** centro (px da câmera de repouso) da placa i da fileira (cada placa um pouco na frente da anterior: o leque) */
export function centroPlaca(pal: Palco, i: number): { px: number; py: number; z: number } {
  const f = pal.fileira;
  return { px: f.px + (i - 1.5) * f.passoPx, py: f.py, z: f.z + i * (typeof f.dz === "number" ? f.dz : 0) };
}

// ---------- tela do aparelho ----------
/** o plano da tela do iPhone do kit no rig (catálogo: telaPlano {largura 0,0713, altura 0,154, frente 0,0064}) */
export const TELA_PLANO = { largura: 0.0713, altura: 0.154, frente: 0.0064, px: [1290, 2796] as [number, number] };

/** ponto (u, v) em px da tela montada no espaço do rig do aparelho */
export function pontoNaTela(u: number, v: number, folga = 0.0006): [number, number, number] {
  return [(u / TELA_PLANO.px[0] - 0.5) * TELA_PLANO.largura, (0.5 - v / TELA_PLANO.px[1]) * TELA_PLANO.altura, TELA_PLANO.frente + folga];
}

/** largura em metros de um trecho de px da tela */
export function larguraNaTela(px: number): number {
  return (px / TELA_PLANO.px[0]) * TELA_PLANO.largura;
}

export { num };
