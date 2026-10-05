// Extensão "comum" do kit de motion: o modelo do palco de argila, que as batidas (batidas.ts) e o render
// (palco/fabrica.ts) dividem. Puro: sem React, sem DOM e sem Remotion (o Node das props, dos eventos e do qc também
// empacota este arquivo). Só a matemática do three (projeção) e o CustomEase do núcleo (curvas novas com prefixo
// "kit"). Veio da peça de 05/10/2026 ("Contabilidade tradicional vs Legalizaí"), que agora usa este código.
//
// O palco é um objeto da cena: as duas vitrines (opcionais), as peças de argila do carrossel de 05/10, os cartões
// que saem da tela do aparelho, a fileira de placas, a moeda e o sino. O estado de tudo mora em st.canais: "palco"
// (vitrines e luz) e "p:<peça>" (uma por peça). As batidas animam esses números na timeline mestre do kit; o render
// só lê.
//
// Tipos de palco: "palco-argila" é o genérico (nenhuma peça padrão: a cena declara as peças em conteudo.pecas). Uma
// extensão de peça registra o tipo dela com as peças padrão (registraPalco; o "palco-tvl" da peça de 05/10). O
// registro fica num nome próprio do globalThis porque, em Node, cada extensão é empacotada sozinha (a do comum e a
// da peça têm cópias deste módulo) e as duas precisam ver os mesmos tipos. Nenhum tipo é trocado depois de
// registrado (fica o primeiro).
import { CustomEase } from "gsap/CustomEase";
import type { CamSt, Ctx, Estado, ObjetoProps } from "../../../nucleo/tipos";
import { criaEaseKit, type CustomEaseMinimo } from "../../../nucleo/eases";
import { desprojeta, projetaPonto } from "../../../nucleo/projecao";

/** altura do chão das vitrines (a mesma "mesa" do kit: as sombras do núcleo caem aqui) */
export const MESA = -0.0905;
/** tipo do palco genérico (item proc-palco-argila do catálogo) */
export const TIPO_PALCO = "palco-argila";
/** id padrão do objeto palco na cena e do canal dele (vitrines e luz) */
export const PALCO = "palco";
/** prefixo dos canais das peças */
export const P = "p:";

export type Vals = Record<string, number>;
export type Canal = Record<string, number>;

// ---------- curvas ----------
// O kit tem lgEntra (12% de excesso), lgSai e lgPousa (uns 10%). Argila e papel passam do ponto no máximo 5%, então
// o palco ganha curvas com prefixo "kit" (criaEaseKit do núcleo: nunca redefine curva que já existe).
export const CURVAS: Record<string, string> = {
  // pouso com mola curta: passa 4,5% e assenta (argila subindo do chão, cartão pousando, pasta encostando)
  kitPousa5: "M0,0 C0.16,0.66 0.26,1.05 0.42,1.045 0.6,1.04 0.78,1 1,1",
  // saída de argila por encolhimento: cresce uns 3% (antecipação) e some acelerando, sem atravessar o chão
  kitEncolhe: "M0,0 C0.18,-0.07 0.42,-0.06 0.62,0.2 0.78,0.42 0.9,0.72 1,1",
  // chegada com velocidade: começa devagar e acelera até o contato (o som do pouso cai no toque)
  kitChega: "M0,0 C0.3,0.05 0.62,0.32 1,1",
};

let curvasProntas = false;
/** cria as curvas do palco (só na primeira batida que precisar; o CustomEase já está registrado pelo kit) */
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

export const num = (x: unknown, p: number) => (typeof x === "number" && isFinite(x) ? x : p);

// ---------- câmera de repouso e tela ----------
/** câmera do carrossel de 05/10 (elevação de 12°) no enquadramento de repouso do reel: aparelho com uns 330 px de
 *  largura centrado em x 780, vitrines de x 72 a 1008. Os pousos dos cartões e das placas são dados em px dessa
 *  câmera (conteudo.camRepouso troca). */
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
  /** luz suave atrás da argila fria: centro em x no mundo e raio em metros (acréscimo de 05/10; padrão os números
   *  da peça de 05/10, x -0,056 e raio 0,078) */
  luzFria?: { x: number; raio: number };
  /** caminho da luz de área da varredura fria, em x no mundo (acréscimo de 05/10; padrão -0,14 a 0,01) */
  varre?: { de: number; ate: number };
  /** cores das vitrines (os tokens do carrossel por padrão; acréscimo de 05/10) */
  cores?: Partial<Record<"frio" | "frioLuz" | "frioBorda" | "quente" | "quenteBorda" | "halo", string>>;
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
/** tipos de peça: as frias são a argila do carrossel (com recorte da vitrine fria); as quentes saem da tela do
 *  aparelho (cartões e placas), da tela pela direita (moeda) ou nascem no lugar (sino e faíscas) */
export const TIPOS_PECA = [
  "pilha", "carimbo", "despertador", "pasta", "envelope", "envelope-aberto", "lupa", "caneta", "prancheta", "calendario",
  "cartao-app", "cartao-imposto", "placa", "moeda", "sino", "faisca",
] as const;
export type TipoPeca = (typeof TIPOS_PECA)[number];

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

/** peça declarada só na cena: o que faltar vem daqui (o tipo é obrigatório) */
const PECA_NOVA: Omit<PecaDef, "tipo"> = { lado: "frio", x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, altura: 0, visivel: true };

/** canais de cada peça: deslocamentos sobre a pose de repouso (x, y, z, rx, ry, rz), escala, visibilidade e os
 *  canais próprios do tipo. enc é a escala da troca da vitrine fria (1 inteira, 0 sumida no pé da peça: nada
 *  atravessa o chão); painel 1 prende a peça ao painel no fecho (mesmo centro e mesma escala dele); alfa é a
 *  opacidade (só no fecho, junto com o painel). */
export const CANAIS_PECA: Vals = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, sy: 1, vis: 1, enc: 1, painel: 0, alfa: 1 };

export const CANAIS_POR_TIPO: Record<string, Vals> = {
  // marca: a marca do carimbo no formulário de cima (0 a 1); voa: o formulário sai da pilha e entra na pasta (0 a 1)
  pilha: { tremor: 0, marca: 0, voa: 0 },
  carimbo: { sobe: 0, achata: 0 },
  // corre: voltas do ponteiro dos minutos (o tempo passando depressa; acréscimo de 05/10)
  despertador: { corre: 0 },
  // vira: folhas viradas (a fração é o giro da folha da vez; acréscimo de 05/10)
  calendario: { vira: 0 },
  // folhas: 0 pra fora da pasta, 1 dentro; abre: 1 com a frente inclinada pra frente (aberta), 0 fechada
  pasta: { folhas: 0, abre: 0 },
  envelope: {},
  "envelope-aberto": {},
  lupa: {},
  caneta: {},
  prancheta: {},
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

/** fileira de placas (px da câmera de repouso): centros em 624, 716, 808 e 900, de x 571 a 953 (dentro da vitrine
 *  quente da peça de 05/10, longe do vão e da coluna de ícones do Reels); passo menor que a largura = leque */
export const FILEIRA_PADRAO = { px: 762, py: 1218, z: 0.052, larguraPx: 106, passoPx: 92, dz: 0.0022 };
/** fileira no mundo (acréscimo de 05/10): centro da fileira, passo entre placas e largura de cada uma, em metros;
 *  com noChao, o y é o do pé da placa no chão (a placa fica em pé, apoiada) */
export type FileiraMundo = {
  x: number; y?: number; z: number; passo: number; largura: number; dz?: number; noChao?: boolean;
  /** no chão: pra onde a placa que salta cai, em metros (padrão x 0,004 e z 0,022) */
  saltoX?: number; saltoZ?: number;
};
export type Fileira = typeof FILEIRA_PADRAO & { mundo?: FileiraMundo };

/** o que a cena pode mandar em objeto.conteudo do palco */
export type ConteudoPalco = {
  /** o aparelho de onde saem cartões, placas e moeda (padrão "aparelho"; null: palco sem aparelho) */
  aparelho?: string | null;
  /** medidas das vitrines (null: palco sem vitrines, só a luz, o chão e as peças) */
  vitrine?: Partial<Vitrine> | null;
  pecas?: Record<string, Partial<PecaDef>>;
  fileira?: Partial<Fileira>;
  camRepouso?: Partial<CamSt>;
  /** luz do carrossel (exposicao, ambiente, chave, recorte, hemisferio); null: fica a luz do kit */
  luz?: Record<string, number> | null;
  estado?: Record<string, Vals>;
  /** área da sombra de contato no chão, em metros (acréscimo de 05/10; padrão 0,42 por 0,32, centrada em x 0) */
  sombraContato?: { largura?: number; profundidade?: number; x?: number };
};

/** um tipo de palco: as peças padrão e as medidas (a cena troca tudo por objeto.conteudo) */
export type ModeloPalco = {
  pecas: Record<string, PecaDef>;
  vitrine: Vitrine | null;
  fileira: Fileira;
  camRepouso: CamSt;
};

// ---------- registro dos tipos de palco ----------
const CHAVE_REGISTRO = "__kitComumPalcos";
type RegistroPalcos = Record<string, ModeloPalco>;

function registroPalcos(): RegistroPalcos {
  const g = globalThis as unknown as Record<string, RegistroPalcos | undefined>;
  let r = g[CHAVE_REGISTRO];
  if (!r) {
    r = {};
    g[CHAVE_REGISTRO] = r;
  }
  return r;
}

/** registra um tipo de palco com as peças e medidas padrão; nunca troca um tipo que já existe (devolve false) */
export function registraPalco(tipo: string, modelo: ModeloPalco): boolean {
  const r = registroPalcos();
  if (r[tipo]) return false;
  r[tipo] = modelo;
  return true;
}

export function modeloDoPalco(tipo: string | undefined | null): ModeloPalco | undefined {
  return typeof tipo === "string" ? registroPalcos()[tipo] : undefined;
}

export function tiposDePalco(): string[] {
  return Object.keys(registroPalcos());
}

registraPalco(TIPO_PALCO, { pecas: {}, vitrine: VITRINE_PADRAO, fileira: FILEIRA_PADRAO, camRepouso: CAM_REPOUSO });

/** o objeto palco da cena e o conteúdo dele já mesclado com os padrões do tipo */
export type Palco = {
  id: string;
  objeto: ObjetoProps | null;
  tipo: string;
  aparelho: string | null;
  vitrine: Vitrine | null;
  pecas: Record<string, PecaDef>;
  fileira: Fileira;
  camRepouso: CamSt;
};

/** o palco da cena: o objeto com esse id (ou o primeiro) cujo tipo é um palco registrado, com as peças do tipo e as
 *  da cena (mescla rasa; opcoes e inicial mesclam campo a campo). Peça que só a cena tem precisa do tipo. */
export function palcoDe(objetos: ObjetoProps[], id = PALCO): Palco {
  const lista = objetos || [];
  const ehPalco = (x: ObjetoProps) => !!modeloDoPalco(x.tipo);
  const o = lista.filter((x) => x.id === id && ehPalco(x))[0] || lista.filter(ehPalco)[0] || null;
  const tipo = o ? o.tipo : TIPO_PALCO;
  const modelo = modeloDoPalco(tipo) as ModeloPalco;
  const c = ((o && o.conteudo) || {}) as ConteudoPalco;
  const ids = Object.keys(modelo.pecas);
  const daCena = c.pecas || {};
  for (const k of Object.keys(daCena)) if (k.charAt(0) !== "_" && ids.indexOf(k) < 0) ids.push(k);
  const pecas: Record<string, PecaDef> = {};
  for (const k of ids) {
    const extra = (daCena[k] || {}) as Partial<PecaDef>;
    const doTipo = modelo.pecas[k];
    if (!doTipo && (typeof extra.tipo !== "string" || TIPOS_PECA.indexOf(extra.tipo as TipoPeca) < 0)) {
      throw new Error(`palco "${o ? o.id : id}": a peça "${k}" precisa de "tipo" (${TIPOS_PECA.join(", ")})`);
    }
    const base = (doTipo || { ...PECA_NOVA, tipo: extra.tipo as TipoPeca }) as PecaDef;
    pecas[k] = {
      ...base,
      ...extra,
      opcoes: { ...(base.opcoes || {}), ...((extra.opcoes as Record<string, unknown>) || {}) },
      inicial: { ...(base.inicial || {}), ...((extra.inicial as Vals) || {}) },
    };
    if (TIPOS_PECA.indexOf(pecas[k].tipo) < 0) throw new Error(`palco "${o ? o.id : id}": a peça "${k}" tem tipo desconhecido "${pecas[k].tipo}" (${TIPOS_PECA.join(", ")})`);
  }
  const vitrine = c.vitrine === null || (modelo.vitrine === null && c.vitrine === undefined) ? null : { ...(modelo.vitrine || VITRINE_PADRAO), ...(c.vitrine || {}) };
  return {
    id: o ? o.id : id,
    objeto: o,
    tipo,
    aparelho: c.aparelho === null ? null : typeof c.aparelho === "string" ? c.aparelho : "aparelho",
    vitrine,
    pecas,
    fileira: { ...modelo.fileira, ...(c.fileira || {}) },
    camRepouso: { ...modelo.camRepouso, ...(c.camRepouso || {}) },
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

/** garante os canais do palco e de todas as peças (idempotente; toda batida do palco chama antes de animar) */
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

/** pose de pouso no mundo (acréscimo de 05/10): {x, y, z} em metros e, opcional, a largura do modelo no pouso */
export type PousoMundo = { x: number; y: number; z: number; largura?: number };
export function pousoMundoDe(op: Record<string, unknown>): PousoMundo | null {
  const m = op.pousoMundo as Partial<PousoMundo> | undefined;
  if (!m || typeof m !== "object") return null;
  if (!(typeof m.x === "number" && typeof m.y === "number" && typeof m.z === "number")) throw new Error(`pousoMundo precisa de x, y e z em metros (recebido ${JSON.stringify(m)})`);
  return { x: m.x, y: m.y, z: m.z, largura: typeof m.largura === "number" ? m.largura : undefined };
}

/** centro (px da câmera de repouso) da placa i da fileira (cada placa um pouco na frente da anterior: o leque) */
export function centroPlaca(pal: Palco, i: number): { px: number; py: number; z: number } {
  const f = pal.fileira;
  return { px: f.px + (i - 1.5) * f.passoPx, py: f.py, z: f.z + i * (typeof f.dz === "number" ? f.dz : 0) };
}

// ---------- objeto de argila solto (tipo "argila") ----------
/** canais do objeto de argila solto (st.canais[id]) e os valores do quadro 0, por forma */
export const CANAIS_ARGILA: Record<string, Vals> = {
  pilha: { tremor: 0 },
  carimbo: { sobe: 0, achata: 0 },
  pasta: { abre: 0, folhas: 0 },
  moeda: { giro: 0 },
  sino: { balanco: 0 },
};

/** a forma de um objeto do tipo "argila" (conteudo.forma da cena ou render.formaArgila do catálogo) */
export function formaDoObjeto(o: ObjetoProps): string {
  const c = (o.conteudo || {}) as Record<string, unknown>;
  const r = (o.render || {}) as Record<string, unknown>;
  return String(c.forma || r.formaArgila || "");
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
