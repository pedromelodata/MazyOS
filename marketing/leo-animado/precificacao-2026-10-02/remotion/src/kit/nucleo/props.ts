// Montagem e validação das props do KitMotion (contrato: KIT/DESENHO.md, seções 4.4, 4.5 e 4.9; dono K02).
// montaProps(cena, {narracao, regioes, fecho, catalogo, camadasConhecidas?}) recebe objetos e não lê arquivo.
// Preenche os padrões da seção 4.4, aplica as validações (erro bloqueia; aviso vai pra props.avisos) e faz um
// ensaio da timeline (o mesmo código do render) pra achar tempo fora do vídeo, palavra inválida, objeto ou tela
// citados que não existem e os sons usados. Em Node, quem chama dorme o ticker do gsap e termina com process.exit.
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import type {
  Batida, CamadaProps, Cena, CenaObjeto, EventoSom, ExtraTela, NarracaoArquivo, ObjetoProps, PropsKit, Regiao,
} from "./tipos";
import { novaTimeline, registraEases } from "./eases";
import { novoEstado, poseCompleta } from "./estado";
import { eObjetoSimples, limpaComentarios, montaTimeline } from "./monta";
import { criaRelogio, tFechoAuto } from "./tempo";
import { caixaNoRig } from "./projecao";
import { BATIDAS_NUCLEO } from "../batidas/index";

// ---------- padrões da seção 4.4 ----------
export const PADROES = {
  legenda: { top: 206, altura: 330, tamanho: 68, modo: "light" as const },
  ambiente: {
    deriva: true, flutuacao: true, poeira: 0.65, periodico: true,
    varredura: { x: 0.11, z: 0.12, largura: 0.05, altura: 0.5, intensidade: 14, yDe: 0.28, yAte: -0.28 },
  },
  fechoLayout: {
    top: 752, altura: 140, gap: 28, tamanhoVai: 106, larguraLogo: 590,
    logoBase: "marca/logo-ai-tinta.svg", logoAcesa: "marca/logo-horizontal.svg",
  },
  link: { texto: "LINK DA BIO", cor: "#DD4E27", top: 960, tamanho: 34 },
  voz: { arquivo: "voz/narr-dylan.wav", fecho: "asset" as const, final: "voz/voz-final.wav" as string | null },
  fatos: { publico: null, exemplos: [] as Array<{ texto: string; origem: string }> },
  camera: { x: 0, y: 0.004, z: 0.66, tx: 0, ty: -0.004, tz: 0, fov: 30 }, // a do guia (CAM0)
  trilha: { automacao: [] as Array<[number, number]>, abaixamento: 0.55, fadeIn: 0.03, fadeOut: 0.5 },
  aiAcende: 0.94,
  publicDir: "public-kit",
  fecho: "vai-legalizai-dylan",
};

export const PECA_GUIA = "guia-pronta-2026-10-14";
export const COR_LINK_MARCA = "#DD4E27";
export const COR_LINK_GUIA = "#F2643C";
export const AVISO_LINK_MARCA = "LINK DA BIO em #DD4E27: cor da regra da marca; o V4 do guia usou #F2643C; decisão final do Pedro pendente";
export const AVISO_LINK_GUIA = "LINK DA BIO em #F2643C: coral-500 em fill de botão sobre fundo claro, contra a regra da marca; aceito só na cena do guia";
export const AVISO_TELA_REAL =
  "a peça fala em tela/prévia real: as capturas são do protótipo Next.js, repo ab68dbc, não do app Flutter; chamar de real depende do Pedro";
export const AVISO_CONJUNTO_ANTIGO = "conjunto antigo, fundo papel, só histórico";

const TIPOS_EXTRA = ["brilhoCard", "contador", "varredura", "botao", "toqueCirculo"];
// travessão (U+2014), meia-risca (U+2013) e os outros traços longos (U+2012, U+2015, U+2E3A, U+2E3B, U+FE31, U+FE32,
// U+FE58), mais o sinal de menos (U+2212, que lê como meia-risca), montados sem pôr o caractere no código
const TRAVESSAO = new RegExp("[" + String.fromCharCode(0x2012, 0x2013, 0x2014, 0x2015, 0x2212, 0x2e3a, 0x2e3b, 0xfe31, 0xfe32, 0xfe58) + "]");
const SELO_VETADO = /app\s+em\s+constru[cç][aã]o/i;
const SEM_ACENTO = /legalizai/i; // "Legalizaí" (com í) não casa
const FALA_DE_REAL = /(tela|pr[eé]via|app)\s+real|tela\s+do\s+app/i;

/** marcas que nunca vão pro crédito da legenda: reserva igual ao catalogo.MARCAS_CREDITO (o "exporta" manda a lista dele) */
export const MARCAS_CREDITO_PADRAO = [
  "apple watch", "watch ultra", "apple", "iphone", "ipad", "macbook", "airpods", "mudmaster", "g-shock", "casio",
  "samsung", "galaxy", "nubank", "itaú", "itau", "bradesco", "banco do brasil", "pix", "google", "pixel", "android",
  "microsoft", "amazon", "kindle", "facebook", "instagram", "whatsapp", "youtube", "tiktok", "leica", "canon",
  "nikon", "sony", "fujifilm", "kodak", "polaroid", "gopro", "garmin", "nokia", "rolex", "swatch", "xiaomi",
  "motorola", "huawei", "mastercard", "visa", "santander", "post-it", "moleskine", "bic", "faber-castell",
  "coca-cola",
];
const escapaRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** sem acento e em minúscula (o mesmo do catalogo._sem_acento) */
const semAcento = (s: string) => (s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
/** "apple watch" casa "apple watch", "apple-watch" e "applewatch" (o mesmo do catalogo._padrao_marca) */
const padraoMarca = (m: string) => semAcento(m).split(/[\s-]+/).filter(Boolean).map(escapaRx).join("[\\s_-]?");
/** a primeira marca da lista no texto, ou null. Igual ao catalogo.marca_em: sobre o texto sem acento, com borda só de
 *  letra (dígito, hífen e sublinhado não protegem: "iPhone15", "iPhone-15", "Apple-Watch"), e de novo com as palavras
 *  coladas separadas pela maiúscula ("AppleWatch", "CasioF91W") */
export function marcaEm(texto: string, marcas: string[] = MARCAS_CREDITO_PADRAO): string | null {
  const lista = marcas.slice().sort((a, b) => b.length - a.length).map(padraoMarca).join("|");
  const rx = new RegExp("(?<![a-z])(" + lista + ")(?![a-z])");
  const t = texto || "";
  for (const variante of [t, t.replace(/(?<=[a-z0-9])(?=[A-Z])/g, " ")]) {
    const m = rx.exec(semAcento(variante));
    if (m) return m[1];
  }
  return null;
}

// ---------- licença (a mesma leitura do catalogo.py: cc_by, licenca_restrita e cita_epidemic) ----------
/** CC BY: "CC BY", "CC-BY", "CC Attribution", "Creative Commons Attribution", "CC Atribuição" */
export const CC_BY = /\bCC[\s-]?BY\b|\b(?:CC|creative[\s-]+commons)[\s-]+(?:attribution|atribui[cç][aã]o)\b/i;
/** "NC" (não comercial) ou "ND" (sem derivações) numa licença CC, ou null: nenhuma das duas serve conteúdo de marca */
export function licencaRestrita(nome: string): "NC" | "ND" | null {
  const n = semAcento(nome);
  const fichas: string[] = n.match(/[a-z0-9]+/g) || [];
  const cc = fichas.indexOf("cc") >= 0 || n.indexOf("creative commons") >= 0 || CC_BY.test(nome || "");
  if (/non[\s-]?commercial|nao[\s-]?comercial|\bby[\s-]nc\b/.test(n) || (cc && fichas.indexOf("nc") >= 0)) return "NC";
  if (/no[\s-]?deriv|sem[\s-]?deriva|\bby[\s-]nd\b/.test(n) || (cc && fichas.indexOf("nd") >= 0)) return "ND";
  return null;
}
/** o item vem da Epidemic pela fonte, url, licença, autor, arquivo ou id (em qualquer tipo de item) */
export function citaEpidemic(it: Item | undefined): boolean {
  if (!it) return false;
  const textos: string[] = [];
  for (const k of ["id", "fonte", "url", "arquivo", "autor", "origem", "obtidoDe"]) textos.push(String(it[k] || ""));
  const l = it.licenca;
  if (eObjetoSimples(l)) for (const k of ["nome", "url", "fonte", "credito"]) textos.push(String(l[k] || ""));
  else textos.push(String(l || ""));
  return textos.some((t) => /epidemic/i.test(t));
}

// ---------- público (F063 por padrão, rodada 4, 03/10) ----------
/** "ME", "MEI" ou "todos" ("ambos" é o nome antigo de "todos") */
export const PUBLICOS = ["ME", "MEI", "todos", "ambos"];
/** a peça é conferida como MEI (nenhum valor de guia aparece): todo público que não é "ME", vazio incluído */
export const publicoEstrito = (p: unknown) => p !== "ME";

/** valor de exemplo que o pintor da folha DAS e o do comprovante mostram quando a cena não traz conteudo */
export const VALOR_PADRAO_PINTOR = "R$ 178,31";

// ---------- decisão de risco (catalogos/LEIA-ME.md, seção Status; a mesma regra do catalogo.py) ----------
export type DecisaoRisco = {
  quem: string; quando: string | null; pecas: string[]; texto: string; fonte?: string; pendente?: boolean; pergunta?: string;
};
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** a decisaoRisco estruturada do item ({quem, quando, pecas, texto}, ou pendente com a pergunta), ou o problema */
export function decisaoDe(it: Item | undefined): { d: DecisaoRisco | null; problema: string | null } {
  const d = it ? it.decisaoRisco : undefined;
  if (d === undefined || d === null) return { d: null, problema: "sem decisaoRisco" };
  if (typeof d === "string") return { d: null, problema: "decisaoRisco em texto livre (formato antigo); precisa ser {quem, quando, pecas, texto}" };
  if (!eObjetoSimples(d)) return { d: null, problema: "decisaoRisco inválida" };
  const faltam: string[] = [];
  for (const k of ["quem", "texto"]) if (!(typeof d[k] === "string" && (d[k] as string).trim())) faltam.push(k);
  const pecas = d.pecas;
  const pecasOk = Array.isArray(pecas) && pecas.every((p) => typeof p === "string" && p.trim().length > 0);
  if (!pecasOk) faltam.push("pecas");
  if (d.pendente === true) {
    if (!(typeof d.pergunta === "string" && (d.pergunta as string).trim())) faltam.push("pergunta");
  } else {
    if (!(typeof d.quando === "string" && DATA_ISO.test(d.quando as string))) faltam.push("quando (AAAA-MM-DD)");
    if (pecasOk && !(pecas as string[]).length) faltam.push("pecas (pelo menos uma; '*' pra qualquer peça)");
  }
  if (faltam.length) return { d: null, problema: `decisaoRisco incompleta: falta ${faltam.join(", ")}` };
  return { d: d as unknown as DecisaoRisco, problema: null };
}

/** peça de teste (nome da PASTA começando com "_"): o entregar recusa ela na pasta final de verdade */
export const pecaDeTeste = (peca: string) => typeof peca === "string" && peca.charAt(0) === "_";
/** a decisão é do Pedro (o campo quem começa com "Pedro") */
export const quemDecide = (d: DecisaoRisco | null) => !!d && /^\s*pedro\b/i.test(String(d.quem || ""));
/** a decisão libera o item na peça (o nome da PASTA). Na peça do guia, a decisão registrada vale pela lista (ou "*").
 *  Em peça nova, só a decisão do Pedro com a peça escrita pelo nome: decisão de agente e "*" não valem (rodada 4; a
 *  mesma regra do catalogo.decisao_vale) */
export const decisaoVale = (d: DecisaoRisco | null, peca: string) => {
  if (!d || d.pendente === true || typeof peca !== "string" || !peca) return false;
  if (peca === PECA_GUIA) return d.pecas.indexOf("*") >= 0 || d.pecas.indexOf(peca) >= 0;
  return quemDecide(d) && d.pecas.indexOf(peca) >= 0;
};
/** o motivo de a decisão não valer pra peça (texto curto pras mensagens), ou null quando vale */
export function porQueNaoVale(d: DecisaoRisco | null, peca: string): string | null {
  if (decisaoVale(d, peca)) return null;
  if (!d) return "sem decisão";
  if (d.pendente === true) return "decisão do Pedro pendente";
  if (d.pecas.indexOf(peca) >= 0 && !quemDecide(d)) return `a decisão é de agente (${d.quem}), não do Pedro: provisória, não vale pra peça nova`;
  if (d.pecas.indexOf("*") >= 0) return `a decisão vale com '*' (${quemDecide(d) ? "do Pedro" : "de agente, provisória"}): '*' não vale pra peça nova; só o Pedro, com a peça escrita pelo nome`;
  return `a peça ${peca} não está na lista da decisão`;
}
const dataBr = (iso: string | null) => (iso && DATA_ISO.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : String(iso));
/** uma linha: quem, quando, o quê e onde vale (ou a pergunta pendente); igual ao catalogo.resumo_decisao */
export function resumoDecisao(d: DecisaoRisco): string {
  if (d.pendente === true) return `decisão de ${d.quem} pendente: ${d.pergunta || d.texto}`;
  // '*' só vale na peça do guia (em peça nova, só a decisão do Pedro com a peça escrita: rodada 4)
  const alcance = d.pecas.map((p) => (p === "*" ? "'*' (só na peça do guia)" : p)).join(", ");
  return `${d.quem}, ${dataBr(d.quando)}: ${d.texto.replace(/[.\s]+$/, "")} (vale em ${alcance})`;
}

/** regra da trilha da peça (a mesma do catalogo.confere_trilha e do mixa.py): só trilha (não prévia) liberada, ou
 * aceito-com-risco com a decisaoRisco do catálogo valendo pra peça; sem verificação nunca entra; texto na cena não libera */
export function confereTrilha(it: Item, peca: string): { erros: string[]; avisos: string[] } {
  const erros: string[] = [];
  const avisos: string[] = [];
  const tid = String(it.id);
  const st = String(it.status || "?");
  const tipo = String(it.tipo || "trilha");
  const epidemic = /^epidemic-/.test(tid) || citaEpidemic(it);
  const restrita = licencaRestrita(eObjetoSimples(it.licenca) ? String(it.licenca.nome || "") : String(it.licenca || ""));
  if (tipo !== "trilha") {
    erros.push(`${tid} é ${tipo === "previa" ? "prévia de audição" : tipo}, não trilha: prévia de audição tem a narração da peça de 14/10 e nunca vai como trilha de cena`);
  }
  if (st === "reprovado" || epidemic) {
    erros.push(`trilha reprovada: ${tid}${epidemic ? " (Epidemic: plano gratuito do Pedro, não cobre conteúdo de marca)" : ""}`);
  } else if (restrita) {
    erros.push(`trilha ${tid} com licença ${restrita}: não serve conteúdo de marca`);
  } else if (st === "sem-verificacao") {
    erros.push(`trilha ${tid} está "sem-verificacao": sem os 2 recortes limpos na AudD a trilha não entra (texto em trilha.decisaoRisco da cena não libera)`);
  } else if (st === "aceito-com-risco") {
    const { d, problema } = decisaoDe(it);
    if (!d) erros.push(`trilha ${tid} está "aceito-com-risco" e o catálogo não tem decisaoRisco estruturada (${problema})`);
    else if (d.pendente === true) erros.push(`trilha ${tid} fora do padrão: ${resumoDecisao(d)}`);
    else if (decisaoVale(d, peca)) avisos.push(`trilha ${tid} está "aceito-com-risco": vale pela decisão de ${resumoDecisao(d)}`);
    else if (pecaDeTeste(peca)) {
      avisos.push(`trilha ${tid} está "aceito-com-risco" e a decisão (${resumoDecisao(d)}) não cobre a peça ${peca}: passa só por ser peça de teste, que o entregar recusa na pasta final`);
    } else {
      erros.push(
        `trilha ${tid} está "aceito-com-risco" e a decisão do catálogo (${resumoDecisao(d)}) não vale pra peça ${peca} (${porQueNaoVale(d, peca)}): só com decisão nova do Pedro, com a peça escrita pelo nome, registrada no catálogo (decisaoRisco numa sobreposição revisao-*.json de catalogos/trilhas/); texto em trilha.decisaoRisco da cena não basta`,
      );
    }
  } else if (st !== "liberado") erros.push(`trilha ${tid} com status fora do enum: ${st}`);
  return { erros, avisos };
}

// ---------- catálogo ----------
type Item = Record<string, any>;
export type CatalogoKit = {
  trilhas: Record<string, Item>; efeitos: Record<string, Item>; modelos: Record<string, Item>; telas: Record<string, Item>;
  /** marcas que nunca vão pro crédito da legenda (regras.marcasCredito do "exporta"); sem elas, MARCAS_CREDITO_PADRAO */
  marcas?: string[];
};

function indexa(fonte: unknown): Record<string, Item> {
  const r: Record<string, Item> = {};
  if (Array.isArray(fonte)) {
    for (const it of fonte) if (it && typeof it.id === "string") r[it.id] = it;
    return r;
  }
  if (eObjetoSimples(fonte)) {
    if (Array.isArray(fonte.itens)) return indexa(fonte.itens);
    for (const k of Object.keys(fonte)) {
      const v = fonte[k];
      if (eObjetoSimples(v)) r[typeof v.id === "string" ? (v.id as string) : k] = v;
    }
  }
  return r;
}

/** aceita a saída do "catalogo.py exporta" (K01) em lista ou mapa, na raiz ou dentro de "tipos"/"itens" */
export function normalizaCatalogo(c: unknown): CatalogoKit {
  const raiz: Record<string, unknown> = eObjetoSimples(c) ? c : {};
  const pega = (nome: string): unknown => {
    if (raiz[nome] !== undefined) return raiz[nome];
    const tipos = raiz.tipos;
    if (eObjetoSimples(tipos) && tipos[nome] !== undefined) return tipos[nome];
    const itens = raiz.itens;
    if (eObjetoSimples(itens) && itens[nome] !== undefined) return itens[nome];
    return [];
  };
  const regras = raiz.regras;
  const marcas = eObjetoSimples(regras) && Array.isArray(regras.marcasCredito) ? (regras.marcasCredito as unknown[]).filter((x): x is string => typeof x === "string") : undefined;
  const marcasDiretas = Array.isArray(raiz.marcas) ? (raiz.marcas as unknown[]).filter((x): x is string => typeof x === "string") : undefined;
  return {
    trilhas: indexa(pega("trilhas")), efeitos: indexa(pega("efeitos")), modelos: indexa(pega("modelos")), telas: indexa(pega("telas")),
    marcas: marcas && marcas.length ? marcas : marcasDiretas && marcasDiretas.length ? marcasDiretas : undefined,
  };
}

// ---------- créditos (regra da seção 4.9) ----------
export type CreditoLegenda = { trecho: string; fonte: string; licenca: string };

function juntaE(itens: string[]): string {
  if (itens.length <= 1) return itens.join("");
  return itens.slice(0, -1).join(", ") + " e " + itens[itens.length - 1];
}

/** agrupa por (fonte, licença) na ordem da cena; "Modelos 3D: <trechos> (<fonte>, <licença>); ..." + ", modificado(s)" */
export function textoCreditoLegenda(itens: CreditoLegenda[]): string | null {
  if (!itens.length) return null;
  const grupos: Array<{ chave: string; fonte: string; licenca: string; trechos: string[] }> = [];
  for (const it of itens) {
    const chave = it.fonte + " | " + it.licenca;
    let g = grupos.filter((x) => x.chave === chave)[0];
    if (!g) {
      g = { chave, fonte: it.fonte, licenca: it.licenca, trechos: [] };
      grupos.push(g);
    }
    g.trechos.push(it.trecho);
  }
  const corpo = grupos.map((g) => `${juntaE(g.trechos)} (${g.fonte}, ${g.licenca})`).join("; ");
  return `Modelos 3D: ${corpo}, ${itens.length === 1 ? "modificado" : "modificados"}`;
}

function licencaDe(m: Item): { nome: string; creditoObrigatorio?: boolean; creditoLegenda?: CreditoLegenda | null } {
  const l = m.licenca;
  if (typeof l === "string") return { nome: l };
  if (eObjetoSimples(l)) return l as { nome: string; creditoObrigatorio?: boolean; creditoLegenda?: CreditoLegenda | null };
  return { nome: "" };
}

// ---------- caixa dos procedurais (quando o catálogo não traz) ----------
const m9 = (x: number) => {
  const r = Math.round(x * 1e9) / 1e9;
  return r === 0 ? 0 : r;
};

function caixaProcedural(render: Item): { min: [number, number, number]; max: [number, number, number] } | undefined {
  const c = caixaProceduralBruta(render);
  if (!c) return undefined;
  return { min: [m9(c.min[0]), m9(c.min[1]), m9(c.min[2])], max: [m9(c.max[0]), m9(c.max[1]), m9(c.max[2])] };
}

function caixaProceduralBruta(render: Item): { min: [number, number, number]; max: [number, number, number] } | undefined {
  const plano = render.plano;
  if (eObjetoSimples(plano) && typeof plano.largura === "number" && typeof plano.altura === "number") {
    const w = plano.largura as number;
    const h = plano.altura as number;
    const curva = typeof plano.curva === "number" ? Math.abs(plano.curva as number) : 0;
    const ond = typeof plano.ondula === "number" ? Math.abs(plano.ondula as number) : 0;
    const fundo = curva * (w / 2) * (w / 2) + ond; // -curva·x² nas bordas, mais a ondulação
    return { min: [-w / 2, -h / 2, -fundo], max: [w / 2, h / 2, ond] };
  }
  const forma = render.forma;
  if (eObjetoSimples(forma) && typeof forma.largura === "number" && typeof forma.altura === "number") {
    const b = typeof forma.bisel === "number" ? (forma.bisel as number) : 0;
    const d = typeof forma.profundidade === "number" ? (forma.profundidade as number) : 0;
    const w = forma.largura as number;
    const h = forma.altura as number;
    return { min: [-w / 2 - b, -h / 2 - b, -d / 2 - b], max: [w / 2 + b, h / 2 + b, d / 2 + b] };
  }
  return undefined;
}

// ---------- modelo do catálogo no rig: escala, caixa, pivô e materiais (frente MODELOS NO RENDER, 03/10) ----------
type Caixa3 = { min: [number, number, number]; max: [number, number, number] };
const tres = (x: unknown): x is [number, number, number] =>
  Array.isArray(x) && x.length === 3 && x.every((v) => typeof v === "number" && isFinite(v));
const HEX = /^#[0-9a-fA-F]{6}$/;

/** a caixa do catálogo (que já vem com a escala sugerida, caixa.escala; null = unidades do arquivo) levada pra escala
 *  de render; com a mesma escala, a caixa sai igual (sem conta) */
export function caixaEscalada(m: Item, escala: number | undefined): Caixa3 | undefined {
  const c = m.caixa;
  if (!eObjetoSimples(c) || !tres(c.min) || !tres(c.max)) return undefined;
  const ce = typeof c.escala === "number" && c.escala > 0 ? (c.escala as number) : typeof m.escala === "number" && m.escala > 0 ? (m.escala as number) : 1;
  const f = typeof escala === "number" ? escala / ce : 1;
  if (f === 1) return { min: [c.min[0], c.min[1], c.min[2]], max: [c.max[0], c.max[1], c.max[2]] };
  return { min: [m9(c.min[0] * f), m9(c.min[1] * f), m9(c.min[2] * f)], max: [m9(c.max[0] * f), m9(c.max[1] * f), m9(c.max[2] * f)] };
}

/** render.pivo: "centro" (o centro da caixa no rig vai pra origem), "base" (o meio do pé vai pra origem), [x, y, z]
 *  (deslocamento dado, em metros) ou "origem"/ausente (a origem do arquivo, como o celular do guia) */
export function pivoDe(pivo: unknown, caixaRig: Caixa3 | undefined): [number, number, number] | undefined {
  if (tres(pivo)) return [pivo[0], pivo[1], pivo[2]];
  if (!caixaRig || (pivo !== "centro" && pivo !== "base")) return undefined;
  const cx = (caixaRig.min[0] + caixaRig.max[0]) / 2;
  const cz = (caixaRig.min[2] + caixaRig.max[2]) / 2;
  const cy = pivo === "base" ? caixaRig.min[1] : (caixaRig.min[1] + caixaRig.max[1]) / 2;
  return [m9(-cx), m9(-cy), m9(-cz)];
}

const desloca = (c: Caixa3, p: [number, number, number]): Caixa3 => ({
  min: [m9(c.min[0] + p[0]), m9(c.min[1] + p[1]), m9(c.min[2] + p[2])],
  max: [m9(c.max[0] + p[0]), m9(c.max[1] + p[1]), m9(c.max[2] + p[2])],
});

const CAMPOS_MATERIAL: Record<string, "numero" | "cor" | "bool" | "matiz"> = {
  cor: "cor", rugosidade: "numero", metalico: "numero", envMap: "numero", opacidade: "numero", transparente: "bool",
  transmissao: "numero", semMapa: "bool", semLuz: "bool", emissivo: "cor", intensidadeEmissiva: "numero", dupla: "bool",
  normaisSuaves: "bool", matiz: "matiz",
};

/** render.materiais do catálogo + materiais da cena (a cena vence campo a campo); confere os campos */
export function mesclaMateriais(doCatalogo: unknown, daCena: unknown, onde: string, erros: string[]): Record<string, Record<string, unknown>> | undefined {
  const out: Record<string, Record<string, unknown>> = {};
  for (const fonte of [doCatalogo, daCena]) {
    if (fonte === undefined || fonte === null) continue;
    if (!eObjetoSimples(fonte)) {
      erros.push(`${onde}: materiais precisa ser {"<nome do material>": {...}}`);
      continue;
    }
    for (const nome of Object.keys(fonte)) {
      const aj = fonte[nome];
      if (!eObjetoSimples(aj)) {
        erros.push(`${onde}: materiais.${nome} precisa ser um objeto`);
        continue;
      }
      for (const k of Object.keys(aj)) {
        const tipo = CAMPOS_MATERIAL[k];
        const v = aj[k];
        if (!tipo) erros.push(`${onde}: materiais.${nome}.${k} não existe (campos: ${Object.keys(CAMPOS_MATERIAL).join(", ")})`);
        else if (tipo === "numero" && !(typeof v === "number" && isFinite(v) && v >= 0)) erros.push(`${onde}: materiais.${nome}.${k} precisa ser número >= 0`);
        else if (tipo === "cor" && !(typeof v === "string" && HEX.test(v))) erros.push(`${onde}: materiais.${nome}.${k} precisa ser cor #RRGGBB`);
        else if (tipo === "bool" && typeof v !== "boolean") erros.push(`${onde}: materiais.${nome}.${k} precisa ser true ou false`);
        else if (tipo === "matiz") {
          const ok = Array.isArray(v) && v.length > 0 && v.length <= 4 &&
            v.every((t) => eObjetoSimples(t) && typeof t.de === "string" && HEX.test(t.de) && typeof t.para === "string" && HEX.test(t.para) &&
              (t.tolerancia === undefined || (typeof t.tolerancia === "number" && t.tolerancia > 0 && t.tolerancia <= 180)) &&
              (t.satMin === undefined || (typeof t.satMin === "number" && t.satMin >= 0 && t.satMin < 1)));
          if (!ok) erros.push(`${onde}: materiais.${nome}.matiz precisa ser lista (até 4) de {de: "#RRGGBB", para: "#RRGGBB", tolerancia?: graus (0 a 180), satMin?: 0 a 1}`);
        }
      }
      out[nome] = { ...(out[nome] || {}), ...aj };
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/** render.cores do catálogo + cores da cena (a cena vence); confere o hex */
function mesclaCores(doCatalogo: unknown, daCena: unknown, onde: string, erros: string[]): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  for (const fonte of [doCatalogo, daCena]) {
    if (fonte === undefined || fonte === null) continue;
    if (!eObjetoSimples(fonte)) {
      erros.push(`${onde}: cores precisa ser {"<nome do material>": "#RRGGBB"}`);
      continue;
    }
    for (const nome of Object.keys(fonte)) {
      const v = fonte[nome];
      if (typeof v === "string" && HEX.test(v)) out[nome] = v;
      else erros.push(`${onde}: cores.${nome} precisa ser cor #RRGGBB`);
    }
  }
  return Object.keys(out).length ? out : undefined;
}

const tira = <T extends Record<string, unknown>>(o: T): T => {
  const r: Record<string, unknown> = {};
  for (const k of Object.keys(o)) if (o[k] !== undefined) r[k] = o[k];
  return r as T;
};

// ---------- textos visíveis ----------
function textosDe(x: unknown, saida: string[], pular?: string[]): void {
  if (typeof x === "string") saida.push(x);
  else if (Array.isArray(x)) for (const v of x) textosDe(v, saida, pular);
  else if (eObjetoSimples(x)) for (const k of Object.keys(x)) if (!pular || pular.indexOf(k) < 0) textosDe(x[k], saida, pular);
}

export type OpcoesProps = {
  narracao: NarracaoArquivo;
  /** regiões quando a cena aponta pra um arquivo (telas/regioes.json); regiões inline da cena vencem */
  regioes?: Record<string, Regiao> | null;
  /** o fecho.json do K03 (só o aiAcende importa aqui); sem ele, aiAcende 0,94 */
  fecho?: { aiAcende?: number } | null;
  /** a saída do "catalogo.py exporta" (K01) ou um catálogo mínimo no mesmo formato */
  catalogo: unknown;
  /** tipos de camada válidos (núcleo + extensões); sem isto, qualquer tipo passa */
  camadasConhecidas?: string[];
  /** registro de batidas (núcleo + extensões); padrão: as 13 do núcleo */
  batidas?: Record<string, Batida<any>>;
  /** força ou desliga o aviso de peça nova; padrão: toda peça que não é a do guia */
  pecaNova?: boolean;
  /** captura de origem de cada tela montada por receita, pelo caminho da tela no public-kit (o props.mjs lê as
   * receitas da peça): {"pecas/<peça>/telas/tela-inicio.png": {conjunto: "2026-10-02", arquivo: "inicio.png"}}.
   * Sem a entrada, a origem sai do catálogo pelo nome do arquivo (as 4 montadas do guia e as capturas). */
  origensTelas?: Record<string, { conjunto: string; arquivo: string; receita?: string }> | null;
  /** o nome da PASTA da peça (o props.mjs passa): as travas de trilha, de modelo aceito com risco e a exceção da peça
   *  de teste valem por ele, e a cena com "peca" diferente é recusada (rodada 4). Sem ele, vale o campo da cena (testes) */
  peca?: string;
  /** as peças de um objeto palco já mescladas com as do tipo registrado por extensão (o props.mjs passa, pelo registro
   *  dos palcos da extensão comum): o cartão do imposto de um palco-tvl vem das peças padrão. Sem ele, só as peças que a
   *  cena declara em conteudo.pecas */
  pecasDoPalco?: (o: { id: string; tipo: string; conteudo?: unknown }) => Record<string, Item> | null;
  /** caminhos de tela de teste que ficam fora da conferência de origem (só o cartão do notebook da prova de modelos,
   *  que nunca vira peça); o props.mjs nunca passa */
  telasDeTeste?: string[];
};

export type ResultadoCena = { props: PropsKit | null; erros: string[]; avisos: string[]; eventos: EventoSom[] };

export class ErroProps extends Error {
  erros: string[];
  avisos: string[];
  constructor(erros: string[], avisos: string[]) {
    super(`montaProps: ${erros.length} erro(s)\n- ${erros.join("\n- ")}`);
    this.name = "ErroProps";
    this.erros = erros;
    this.avisos = avisos;
  }
}

/** monta as props e devolve erros e avisos sem lançar (pros scripts mostrarem tudo de uma vez) */
export function avaliaCena(cenaBruta: Cena, op: OpcoesProps): ResultadoCena {
  const erros: string[] = [];
  const avisos: string[] = [];
  const avisa = (m: string) => {
    if (avisos.indexOf(m) < 0) avisos.push(m);
  };
  const cena = limpaComentarios(cenaBruta) as Cena;
  const sai = (): ResultadoCena => ({ props: null, erros, avisos, eventos: [] });

  if (!cena || cena.versao !== 1) erros.push("cena: versao precisa ser 1");
  if (!cena || typeof cena.peca !== "string" || !cena.peca) erros.push("cena: falta peca");
  if (!cena || typeof cena.titulo !== "string") erros.push("cena: falta titulo");
  // a peça é a PASTA (rodada 4): cena copiada de outra peça, ou pasta de teste renomeada, não leva a decisão da outra
  if (cena && typeof op.peca === "string" && op.peca && typeof cena.peca === "string" && cena.peca !== op.peca) {
    erros.push(
      `cena: "peca" é "${cena.peca}" e a pasta é ${op.peca}: as travas (trilha, modelos aceitos com risco e peça de teste) valem pela pasta; se a cena veio de outra peça, troque "peca" por "${op.peca}" (a decisão de risco da outra peça não vem junto)`,
    );
  }
  const narr = op.narracao;
  if (!narr || !Array.isArray(narr.words) || !narr.words.length) {
    erros.push("narração vazia ou sem words");
    return sai();
  }
  if (!Array.isArray(narr.phrases)) erros.push("narração sem phrases");
  if (erros.length) return sai();

  const fps = cena.fps || 30;
  const largura = cena.largura || 1080;
  const altura = cena.altura || 1920;

  // tFecho e duração
  let tFecho: number | null;
  if (cena.tFecho === null) tFecho = null;
  else if (typeof cena.tFecho === "number") tFecho = cena.tFecho;
  else tFecho = typeof narr.tFecho === "number" ? narr.tFecho : tFechoAuto(narr);
  const ultima = narr.words[narr.words.length - 1];
  let duracao: number;
  if (typeof cena.duracao === "number") duracao = cena.duracao;
  else duracao = (tFecho === null ? ultima.e + 0.44 : tFecho) + 3.0;
  if (!(duracao > 0)) {
    erros.push(`duração inválida: ${duracao}`);
    return sai();
  }
  const quadros = Math.round(duracao * fps);
  const marcas = cena.marcas || {};
  const aiAcende = op.fecho && typeof op.fecho.aiAcende === "number" ? op.fecho.aiAcende : PADROES.aiAcende;
  const relogio = criaRelogio({ narracao: narr, tFecho, duracao, marcas, aiAcende });
  for (const nome of Object.keys(marcas)) {
    try {
      relogio.confere(marcas[nome], `marcas.${nome}`);
    } catch (e) {
      erros.push((e as Error).message);
    }
  }
  if (tFecho !== null) {
    try {
      relogio.confere(tFecho, "tFecho");
    } catch (e) {
      erros.push((e as Error).message);
    }
    if (tFecho - ultima.e < 0.3) avisa(`tFecho (${tFecho.toFixed(2)} s) a menos de 0,3 s do fim da última palavra (${ultima.e.toFixed(2)} s)`);
  }

  const cat = normalizaCatalogo(op.catalogo);
  // o nome da peça pras travas: a PASTA (o props.mjs passa em op.peca); sem ela, o campo da cena (só nos testes)
  const pecaPasta = typeof op.peca === "string" && op.peca ? op.peca : typeof cena.peca === "string" ? cena.peca : "";

  // trilha
  const ct = cena.trilha;
  let trilha: PropsKit["trilha"] = { id: "", mStart: 0, ganhoDb: "auto", transporVerificado: 0, status: "?", decisaoRisco: null };
  if (!ct || typeof ct.id !== "string") erros.push("cena: falta trilha.id");
  else {
    const it = cat.trilhas[ct.id];
    // a decisão que vale é a do catálogo (estruturada, com as peças); o texto em trilha.decisaoRisco da cena não libera
    let decisao: string | null = null;
    if (!it) erros.push(`trilha não está no catálogo: ${ct.id}`);
    else {
      const r = confereTrilha(it, pecaPasta);
      for (const e of r.erros) erros.push(e);
      for (const a of r.avisos) avisa(a);
      const { d } = decisaoDe(it);
      if (String(it.status) === "aceito-com-risco" && d && !r.erros.length) decisao = resumoDecisao(d);
    }
    let mStart: number | undefined = typeof ct.mStart === "number" ? ct.mStart : undefined;
    let momento: number | undefined;
    if (mStart === undefined) {
      if (ct.momento === undefined || !ct.ponto) erros.push("trilha: dê mStart ou momento e ponto");
      else if (it) {
        const pontos: Item[] = Array.isArray(it.pontos) ? it.pontos : [];
        const ponto = pontos.filter((p) => p && p.id === ct.ponto)[0];
        if (!ponto || typeof ponto.t !== "number") erros.push(`trilha ${ct.id}: ponto "${ct.ponto}" não existe no catálogo`);
        else {
          try {
            momento = relogio.t(ct.momento, undefined, "trilha.momento");
            mStart = Math.round((ponto.t - momento) * 1e6) / 1e6;
            if (mStart < 0) erros.push(`trilha ${ct.id}: o ponto ${ct.ponto} (${ponto.t} s) cai antes do começo da música com o momento ${momento.toFixed(3)} s`);
          } catch (e) {
            erros.push((e as Error).message);
          }
        }
      }
    }
    const tom = it && eObjetoSimples(it.tom) ? it.tom : {};
    trilha = tira({
      id: ct.id,
      mStart: mStart === undefined ? 0 : mStart,
      ganhoDb: ct.ganhoDb === undefined ? "auto" : ct.ganhoDb,
      transporVerificado: typeof tom.transporVerificado === "number" ? tom.transporVerificado : 0,
      status: it ? String(it.status) : "?",
      decisaoRisco: decisao,
      automacao: ct.automacao || PADROES.trilha.automacao,
      abaixamento: ct.abaixamento === undefined ? PADROES.trilha.abaixamento : ct.abaixamento,
      fadeIn: ct.fadeIn === undefined ? PADROES.trilha.fadeIn : ct.fadeIn,
      fadeOut: ct.fadeOut === undefined ? PADROES.trilha.fadeOut : ct.fadeOut,
      momento,
      ponto: ct.ponto,
    }) as PropsKit["trilha"];
  }

  // regiões
  let regioes: Record<string, Regiao> = {};
  if (eObjetoSimples(cena.regioes)) regioes = cena.regioes as Record<string, Regiao>;
  else if (typeof cena.regioes === "string") {
    if (op.regioes) regioes = op.regioes;
    else erros.push(`regiões: a cena aponta pra "${cena.regioes}"; passe o conteúdo em opcoes.regioes`);
  } else if (op.regioes) regioes = op.regioes;

  // telas
  const telas: PropsKit["telas"] = {};
  const telasCena = cena.telas || {};
  for (const chave of Object.keys(telasCena)) {
    const tc = telasCena[chave];
    if (!tc || typeof tc.arquivo !== "string") {
      erros.push(`tela "${chave}" sem arquivo`);
      continue;
    }
    const extras: ExtraTela[] = Array.isArray(tc.extras) ? tc.extras : [];
    extras.forEach((ex, i) => {
      const onde = `telas.${chave}.extras[${i}]`;
      if (!ex || TIPOS_EXTRA.indexOf(ex.tipo) < 0) erros.push(`${onde}: tipo de extra desconhecido: ${ex ? String(ex.tipo) : "?"}`);
      else {
        if (!regioes[ex.regiao]) erros.push(`${onde}: região citada não existe: "${ex.regiao}"`);
        if (ex.tipo === "contador" && typeof ex.valor !== "number") erros.push(`${onde}: contador sem valor numérico`);
        const formato = (ex as { formato?: unknown }).formato;
        if (ex.tipo === "contador" && formato !== undefined && formato !== "brl") {
          erros.push(`${onde}: contador com formato "${String(formato)}": o contador sempre desenha em R$ (o telaKit usa o formataBrl), então o formato é "brl" ou nenhum`);
        }
        if (ex.tipo === "botao" && (typeof ex.rotulo !== "string" || typeof ex.retorno !== "string")) erros.push(`${onde}: botao precisa de rotulo e retorno`);
      }
    });
    const conjunto = tc.conjunto || conjuntoDaTela(tc.arquivo, cat);
    telas[chave] = tira({ arquivo: tc.arquivo, extras, conjunto });
  }

  // objetos
  const objetos: ObjetoProps[] = [];
  const creditosItens: CreditoLegenda[] = [];
  const modelosCreditados: Record<string, true> = {};
  const vistos: Record<string, true> = {};
  for (const o of (cena.objetos || []) as CenaObjeto[]) {
    if (!o || typeof o.id !== "string") {
      erros.push("objeto sem id");
      continue;
    }
    if (vistos[o.id]) erros.push(`objeto repetido: ${o.id}`);
    vistos[o.id] = true;
    const m = cat.modelos[o.modelo];
    if (!m) {
      erros.push(`objeto ${o.id}: modelo não está no catálogo: ${o.modelo}`);
      continue;
    }
    const stModelo = String(m.status || "?");
    const licModelo = eObjetoSimples(m.licenca) ? String(m.licenca.nome || "") : String(m.licenca || "");
    const restritaModelo = licencaRestrita(licModelo);
    if (stModelo === "reprovado") erros.push(`objeto ${o.id}: modelo reprovado: ${o.modelo}`);
    else if (restritaModelo) erros.push(`objeto ${o.id}: o modelo ${o.modelo} tem licença ${restritaModelo} (${licModelo}): não serve conteúdo de marca`);
    else if (citaEpidemic(m)) erros.push(`objeto ${o.id}: o modelo ${o.modelo} vem da Epidemic: reprovado em tudo`);
    else {
      // aceito-com-risco só pela decisaoRisco do catálogo; decisão pendente (ou nota de licença sem decisão) fica fora
      const { d: dm, problema: pm } = decisaoDe(m);
      if (stModelo === "aceito-com-risco") {
        if (!dm) erros.push(`objeto ${o.id}: o modelo ${o.modelo} está "aceito-com-risco" sem decisaoRisco estruturada no catálogo (${pm})`);
        else if (dm.pendente === true) erros.push(`objeto ${o.id}: o modelo ${o.modelo} está fora do padrão: ${resumoDecisao(dm)}`);
        else if (decisaoVale(dm, pecaPasta)) avisa(`modelo ${o.modelo} aceito com risco: vale pela decisão de ${resumoDecisao(dm)}`);
        else avisa(`modelo ${o.modelo} aceito com risco e a decisão (${resumoDecisao(dm)}) não cobre esta peça: confirmar com o Pedro antes de postar`);
      } else if (m.notaLicenca && (!dm || dm.pendente === true)) {
        erros.push(`objeto ${o.id}: o modelo ${o.modelo} tem nota de licença sem decisão registrada (${dm ? resumoDecisao(dm) : pm}): ${String(m.notaLicenca)}`);
      } else if (stModelo === "sem-verificacao") avisa(`modelo ${o.modelo} sem verificação de licença: conferir antes de postar`);
    }
    const render: Item = eObjetoSimples(m.render) ? m.render : {};
    const tipo = o.tipo || render.tipoObjeto || "glb";
    const lic = licencaDe(m);
    const pedeCredito = lic.creditoObrigatorio === true || CC_BY.test(lic.nome || "");
    let credito: string | null = null;
    if (pedeCredito) {
      const cl = lic.creditoLegenda;
      if (!cl || typeof cl.trecho !== "string" || !cl.trecho) erros.push(`modelo CC BY sem licenca.creditoLegenda: ${o.modelo}`);
      else {
        const marca = marcaEm(`${cl.trecho} ${cl.fonte || ""} ${cl.licenca || ""}`, cat.marcas || MARCAS_CREDITO_PADRAO);
        if (marca) erros.push(`objeto ${o.id}: o crédito de legenda do modelo ${o.modelo} cita marca (${marca}); o crédito da legenda nunca cita marca`);
        credito = cl.trecho;
        if (!modelosCreditados[o.modelo]) {
          modelosCreditados[o.modelo] = true;
          creditosItens.push({ trecho: cl.trecho, fonte: cl.fonte, licenca: cl.licenca });
        }
      }
    }
    const rotacaoBase = Array.isArray(render.rotacaoBase) ? (render.rotacaoBase as [number, number, number]) : undefined;
    // escala de render: a do bloco render (a frente modelos no render corrige por ele); sem ela, a do item
    const escala = typeof render.escala === "number" ? (render.escala as number) : typeof m.escala === "number" ? (m.escala as number) : undefined;
    let caixa: ObjetoProps["caixa"];
    let pivo: ObjetoProps["pivo"];
    const ce = caixaEscalada(m, escala);
    if (ce) {
      caixa = caixaNoRig(ce, rotacaoBase);
      pivo = pivoDe(render.pivo, caixa);
      if (pivo) caixa = desloca(caixa, pivo);
    } else caixa = caixaProcedural(render);
    const ondeObj = `objeto ${o.id} (${o.modelo})`;
    const cores = mesclaCores(render.cores, o.cores, ondeObj, erros);
    const materiais = mesclaMateriais(render.materiais, (o as { materiais?: unknown }).materiais, ondeObj, erros) as ObjetoProps["materiais"];
    if (tipo === "aparelho" && o.telaInicial && o.telaInicial !== "apagada" && !telasCena[o.telaInicial]) {
      erros.push(`objeto ${o.id}: telaInicial citada não existe: "${o.telaInicial}"`);
    }
    objetos.push(
      tira({
        id: o.id,
        modelo: o.modelo,
        tipo,
        arquivo: render.publicKit,
        rotacaoBase,
        escala,
        pivo,
        malhaTela: render.malhaTela,
        telaPx: render.telaPx,
        flipY: render.flipY,
        telaPlano: render.telaPlano,
        vidro: render.vidro,
        texturaMalha: render.texturaMalha,
        caixa,
        pose: poseCompleta(o.pose),
        sombra: typeof o.sombra === "number" ? o.sombra : typeof render.sombra === "number" ? render.sombra : 0.5,
        telaInicial: o.telaInicial,
        mostrador: o.mostrador,
        conteudo: o.conteudo,
        cores,
        materiais,
        flutuacao: o.flutuacao || (eObjetoSimples(render.flutuacao) ? render.flutuacao : undefined),
        credito,
        render: Object.keys(render).length ? render : undefined,
      }) as ObjetoProps,
    );
  }

  // camadas
  const camadas: CamadaProps[] = Array.isArray(cena.camadas) ? cena.camadas : [];
  const idsCamada: Record<string, true> = {};
  camadas.forEach((c, i) => {
    if (!c || typeof c.id !== "string" || typeof c.tipo !== "string") erros.push(`camadas[${i}]: precisa de id e tipo`);
    else {
      if (idsCamada[c.id]) erros.push(`camada repetida: ${c.id}`);
      idsCamada[c.id] = true;
      if (op.camadasConhecidas && op.camadasConhecidas.indexOf(c.tipo) < 0) erros.push(`camada de tipo desconhecido: ${c.tipo} (${c.id})`);
      if (!eObjetoSimples(c.estado)) c.estado = {};
    }
  });

  // sons, fecho, voz e o resto
  const sonsCena = cena.sons || {};
  const sons: PropsKit["sons"] = {
    perfil: sonsCena.perfil || "v2",
    modoRuido: sonsCena.modoRuido || "por-evento",
    extras: sonsCena.extras || [],
    remover: sonsCena.remover || [],
  };
  if (sons.perfil !== "v2" && sons.perfil !== "enxuto") erros.push(`sons.perfil inválido: ${String(sons.perfil)}`);
  if (sons.modoRuido !== "legado" && sons.modoRuido !== "por-evento") erros.push(`sons.modoRuido inválido: ${String(sons.modoRuido)}`);

  let fecho: PropsKit["fecho"] = null;
  if (cena.fecho !== null) {
    const fc = cena.fecho || {};
    fecho = {
      asset: fc.asset || PADROES.fecho,
      aiAcende,
      layout: { ...PADROES.fechoLayout, ...(fc.layout || {}) },
      link: { ...PADROES.link, ...(fc.link || {}) },
    };
  }

  const vozCena = cena.voz || {};
  const voz: PropsKit["voz"] = { ...PADROES.voz, ...vozCena } as PropsKit["voz"];
  if (voz.fecho !== "embutido" && voz.fecho !== "asset") erros.push(`voz.fecho inválido: ${String(voz.fecho)}`);

  const amb = cena.ambiente || {};
  const ambiente: PropsKit["ambiente"] = {
    ...PADROES.ambiente,
    ...amb,
    varredura: { ...PADROES.ambiente.varredura, ...(amb.varredura || {}) },
  } as PropsKit["ambiente"];

  const fatosCena = cena.fatos || {};
  const publico = fatosCena.publico as unknown;
  // F063 por padrão (rodada 4, 03/10): o público é obrigatório ("ME", "MEI" ou "todos"; "ambos" é o nome antigo de
  // "todos"); "MEI", "todos" e vazio são conferidos como MEI, a regra mais restrita: só "ME" deixa o valor aparecer
  if (publico === undefined || publico === null || publico === "") {
    erros.push('fatos.publico vazio: declare "ME", "MEI" ou "todos" (até lá a peça é conferida como MEI, a regra mais restrita: nenhum valor de guia aparece)');
  } else if (PUBLICOS.indexOf(String(publico)) < 0) {
    erros.push(`fatos.publico inválido: ${String(publico)} (use "ME", "MEI" ou "todos"; conferida como MEI até lá)`);
  }
  const fatos: PropsKit["fatos"] = {
    publico: typeof publico === "string" && PUBLICOS.indexOf(publico) >= 0 ? (publico as PropsKit["fatos"]["publico"]) : null,
    exemplos: Array.isArray(fatosCena.exemplos) ? fatosCena.exemplos : [],
  };
  const estrito = publicoEstrito(fatos.publico);
  const rotuloMei = fatos.publico === "MEI" ? "peça de MEI" : `peça conferida como MEI (público ${fatos.publico ? fatos.publico : "vazio"})`;
  // exemplo fictício só vale com a origem escrita (o esquema da cena já pede; aqui é trava)
  fatos.exemplos.forEach((ex, i) => {
    const e: Record<string, unknown> = eObjetoSimples(ex) ? (ex as unknown as Record<string, unknown>) : {};
    if (typeof e.texto !== "string" || !e.texto.trim()) erros.push(`fatos.exemplos[${i}]: falta o texto do valor fictício`);
    else if (typeof e.origem !== "string" || !e.origem.trim()) {
      erros.push(`fatos.exemplos[${i}] ("${e.texto}"): falta a origem (de onde vem o valor fictício); exemplo sem origem não vale`);
    }
  });

  // trava do F063: peça conferida como MEI nunca mostra valor de guia (folha DAS, comprovante, contador de tela, cartão
  // do imposto do palco de argila e tela ou imagem 2D de tela que mostra valor)
  if (estrito) {
    for (const o of objetos) {
      if (o.tipo === "folha" || o.tipo === "comprovante") {
        const c = (o.conteudo || {}) as Record<string, unknown>;
        if (c.mostraValor !== false) {
          const valor = typeof c.valor === "string" ? c.valor : VALOR_PADRAO_PINTOR;
          erros.push(
            `objeto ${o.id} (${o.tipo === "folha" ? "folha DAS" : "comprovante"}): ${rotuloMei} e o valor da guia aparece (o pintor mostra ${valor}); ponha "mostraValor": false no conteudo (F063: o valor da guia do MEI nunca aparece)`,
          );
        }
      }
      // o cartão do imposto do palco de argila conta até opcoes.valor em R$ (as peças padrão do tipo de palco vêm do
      // registro da extensão comum, que o props.mjs passa em op.pecasDoPalco)
      const doPalco = op.pecasDoPalco ? op.pecasDoPalco({ id: o.id, tipo: o.tipo, conteudo: o.conteudo }) : null;
      const daCena = eObjetoSimples(o.conteudo) && eObjetoSimples((o.conteudo as Record<string, unknown>).pecas) ? ((o.conteudo as Record<string, unknown>).pecas as Record<string, Item>) : null;
      const pecasPalco = doPalco || daCena;
      if (pecasPalco) {
        for (const pid of Object.keys(pecasPalco)) {
          const pc = pecasPalco[pid];
          if (pid.charAt(0) === "_" || !eObjetoSimples(pc) || pc.tipo !== "cartao-imposto") continue;
          const opc = eObjetoSimples(pc.opcoes) ? pc.opcoes : {};
          if (typeof opc.valor === "number" || typeof opc.valorTexto === "string") {
            const v = typeof opc.valorTexto === "string" ? opc.valorTexto : `R$ ${String(opc.valor)}`;
            erros.push(`objeto ${o.id}, cartão do imposto ${pid}: ${rotuloMei} e o cartão conta o valor da guia (${v}) (F063: o valor da guia do MEI nunca aparece; tire o cartão do imposto ou use ME)`);
          }
        }
      }
    }
  }
  // origem das telas: tela sem origem no catálogo e captura reprovada nunca entram, em peça nenhuma; conferida como MEI,
  // só captura com servePecaMei true; captura aceita com risco sem decisão do Pedro pra esta peça: aviso
  const provisorias: string[] = [];
  const confereOrigem = (onde: string, or: { item: Item | null; via: string }) => {
    if (!or.item) {
      erros.push(`${onde}: sem origem no catálogo de telas (${or.via}); tela sem origem não entra em peça nenhuma (monte pela receita da peça, com a captura do catálogo)`);
      return;
    }
    if (String(or.item.status) === "reprovado") {
      erros.push(`${onde}: a captura de origem ${or.item.id} está reprovada no catálogo (${String(or.item.resumo || or.item.motivo || "ver catalogos/telas")})`);
    }
    if (estrito && or.item.servePecaMei !== true) {
      erros.push(
        `${onde}: ${rotuloMei} e a captura de origem (${or.item.id}) não serve peça de MEI (servePecaMei ${String(or.item.servePecaMei)}${or.item.resumo ? "; " + String(or.item.resumo) : ""}): pode mostrar valor de guia ou ser só de ME (F063)`,
      );
    }
    if (String(or.item.status) === "aceito-com-risco") {
      const { d } = decisaoDe(or.item);
      if (!decisaoVale(d, pecaPasta) && provisorias.indexOf(String(or.item.id)) < 0) provisorias.push(String(or.item.id));
    }
  };
  for (const k of Object.keys(telas)) {
    if (op.telasDeTeste && op.telasDeTeste.indexOf(telas[k].arquivo) >= 0) avisa(`tela "${k}" de teste (${telas[k].arquivo}): fora da conferência de origem, só pra prova`);
    else confereOrigem(`tela "${k}"`, origemDaTela(telas[k].arquivo, telas[k].conjunto, op, cat));
    if (estrito && telas[k].extras.some((ex) => ex && ex.tipo === "contador")) {
      erros.push(`tela "${k}": contador de valor numa ${rotuloMei} (o contador desenha o valor em R$; F063: o valor da guia do MEI nunca aparece)`);
    }
  }
  // imagem de camada 2D que é tela (src telas/<png> ou pecas/<peça>/telas/<png>, ou nome de captura do catálogo)
  for (const c of camadas) {
    if (!c || typeof c.id !== "string") continue;
    for (const src of srcsDe(c)) {
      const or = origemDaTela(src, undefined, op, cat);
      if (!or.item && !CAMINHO_TELA.test(src.replace(/^\.?\//, ""))) continue; // imagem que não é tela (marca, ícone)
      confereOrigem(`camada ${c.id} (imagem ${src})`, or);
    }
  }
  if (provisorias.length) {
    avisa(`telas de captura aceitas com risco sem decisão do Pedro pra esta peça (${provisorias.join(", ")}): as decisões do catálogo são de agente ou com '*', provisórias; confirmar com o Pedro antes de postar`);
  }

  const capa = cena.capa === undefined ? null : cena.capa;
  const creditoLegenda = textoCreditoLegenda(creditosItens);

  const props: PropsKit = {
    versao: 1,
    peca: cena.peca,
    titulo: cena.titulo,
    publicDir: cena.publicDir || PADROES.publicDir,
    fps,
    largura,
    altura,
    duracao,
    quadros,
    tFecho,
    narracao: { fps: narr.fps || fps, words: narr.words, phrases: narr.phrases },
    voz,
    legenda: { ...PADROES.legenda, ...(cena.legenda || {}) },
    camera: { ...PADROES.camera, ...(cena.camera || {}) },
    ambiente,
    objetos,
    telas,
    regioes,
    camadas,
    batidas: (cena.batidas || []).map((b) => ({ id: b.id, params: b.params || {} })),
    sons,
    fecho,
    trilha,
    fatos,
    capa,
    creditos: creditosItens.map((c) => c.trecho),
    creditoLegenda,
    avisos,
    marcas,
  };
  if (cena.dataPost) props.dataPost = cena.dataPost;

  // ensaio da timeline: o mesmo código do render, pra achar erros de tempo, objeto e tela e listar os sons
  let eventos: EventoSom[] = [];
  const registro = op.batidas || BATIDAS_NUCLEO;
  const avisosBatidas: string[] = [];
  try {
    registraEases(gsap, CustomEase);
    const tl = novaTimeline(gsap);
    const st = novoEstado(props);
    eventos = montaTimeline(tl, st, props, registro, {
      avisos: avisosBatidas,
      aoErro: (_onde, e) => erros.push(e.message),
    });
    tl.kill();
  } catch (e) {
    erros.push(`ensaio da timeline: ${(e as Error).message}`);
  }
  for (const a of avisosBatidas) avisa(a);

  // efeitos usados
  const semVerif: string[] = [];
  const vistosEfeito: Record<string, true> = {};
  for (const ev of eventos) {
    if (vistosEfeito[ev.som]) continue;
    vistosEfeito[ev.som] = true;
    const ef = cat.efeitos[ev.som];
    if (!ef) erros.push(`efeito não está no catálogo: ${ev.som} (${ev.origem})`);
    else if (ef.status === "reprovado") erros.push(`efeito reprovado: ${ev.som} (${ev.origem})`);
    else if (citaEpidemic(ef)) erros.push(`efeito ${ev.som} vem da Epidemic (fonte, url, licença ou arquivo): reprovado em tudo (${ev.origem})`);
    else if (licencaRestrita(eObjetoSimples(ef.licenca) ? String(ef.licenca.nome || "") : String(ef.licenca || ""))) {
      erros.push(`efeito ${ev.som} com licença NC ou ND: não serve conteúdo de marca (${ev.origem})`);
    }
    else if (ef.status === "sem-verificacao") semVerif.push(ev.som);
  }
  if (semVerif.length) avisa(`efeitos sem verificação: ${semVerif.join(", ")} (licença não conferida na fonte; conferir antes de postar)`);
  if (creditoLegenda) avisa(`créditos CC BY (vão na legenda do post, nunca o título com marca): ${creditoLegenda}`);

  // textos visíveis
  const visiveis: string[] = [];
  for (const w of narr.words) visiveis.push(w.t);
  for (const o of objetos) {
    if (o.mostrador) textosDe(o.mostrador, visiveis);
    if (o.conteudo) textosDe(o.conteudo, visiveis);
  }
  for (const k of Object.keys(telas)) {
    for (const ex of telas[k].extras) {
      if (ex.tipo === "botao") visiveis.push(ex.rotulo, ex.retorno);
    }
  }
  if (fecho) visiveis.push(fecho.link.texto);
  for (const c of camadas) textosDe(c, visiveis, ["id", "tipo", "estado"]);
  if (capa) textosDe({ titulo: capa.titulo, destaque: capa.destaque }, visiveis);
  const todos = visiveis.concat([props.titulo || ""], fatos.exemplos.map((e) => e.texto));
  for (const s of todos) if (TRAVESSAO.test(s)) erros.push(`travessão em texto: "${s}"`);
  for (const s of todos) if (SELO_VETADO.test(s)) erros.push(`"APP EM CONSTRUÇÃO" em texto: "${s}"`);
  for (const s of visiveis) if (SEM_ACENTO.test(s)) erros.push(`"Legalizai" sem acento em texto visível: "${s}" (escreva Legalizaí)`);

  // link da bio
  if (fecho) {
    const cor = String(fecho.link.cor || "").toUpperCase();
    if (cor === COR_LINK_MARCA) avisa(AVISO_LINK_MARCA);
    else if (cor === COR_LINK_GUIA) avisa(AVISO_LINK_GUIA);
  }

  // telas do protótipo chamadas de "real" e conjunto antigo em peça nova
  const falaDaPeca = narr.words.map((w) => w.t).join(" ") + " " + (capa ? capa.titulo : "") + " " + props.titulo + " " +
    camadas.map((c) => { const t: string[] = []; textosDe(c, t, ["id", "tipo", "estado"]); return t.join(" "); }).join(" ");
  if (Object.keys(telas).length && FALA_DE_REAL.test(falaDaPeca)) avisa(AVISO_TELA_REAL);
  const pecaNova = op.pecaNova !== undefined ? op.pecaNova : props.peca !== PECA_GUIA;
  if (pecaNova) {
    for (const k of Object.keys(telas)) {
      if (telas[k].conjunto === "2026-09") avisa(`tela "${k}" do conjunto 2026-09: ${AVISO_CONJUNTO_ANTIGO}`);
    }
  }

  return { props: erros.length ? null : props, erros, avisos, eventos };
}

/** a captura (ou a tela montada) de origem de uma tela: pela receita (op.origensTelas, conjunto e arquivo da captura) ou,
 * sem receita, pelo nome do arquivo no catálogo (as 4 montadas do guia, capturas usadas direto) */
function origemDaTela(arquivo: string, conjunto: string | undefined, op: OpcoesProps, cat: CatalogoKit): { item: Item | null; via: string } {
  const nomeDe = (s: string) => s.split("/").pop() || s;
  const o = op.origensTelas ? op.origensTelas[arquivo] : undefined;
  if (o) {
    for (const id of Object.keys(cat.telas)) {
      const it = cat.telas[id];
      if (String(it.tipo) === "captura" && it.conjunto === o.conjunto && nomeDe(String(it.arquivo || "")) === o.arquivo) {
        return { item: it, via: `receita ${o.receita || "?"}` };
      }
    }
    return { item: null, via: `receita ${o.receita || "?"}: a captura ${o.conjunto}/${o.arquivo} não está no catálogo` };
  }
  const nome = nomeDe(arquivo);
  const achados = Object.keys(cat.telas).map((id) => cat.telas[id]).filter((it) => nomeDe(String(it.arquivo || it.caminho || "")) === nome);
  const doConjunto = conjunto ? achados.filter((it) => it.conjunto === conjunto) : achados;
  if (doConjunto.length === 1) return { item: doConjunto[0], via: "nome do arquivo" };
  if (achados.length === 1) return { item: achados[0], via: "nome do arquivo" };
  return { item: null, via: achados.length ? `nome do arquivo ambíguo (${achados.length} itens no catálogo)` : "sem receita e sem item com esse nome de arquivo" };
}

/** conjunto da tela: o do catálogo (pelo nome do arquivo), senão as telas legadas do guia (montadas de 02/10) */
function conjuntoDaTela(arquivo: string, cat: CatalogoKit): string | undefined {
  const base = arquivo.split("/").pop() || arquivo;
  for (const id of Object.keys(cat.telas)) {
    const it = cat.telas[id];
    const arq = String(it.arquivo || it.caminho || "");
    if (arq && (arq.split("/").pop() || "") === base && typeof it.conjunto === "string") return it.conjunto;
  }
  if (/^telas\/tela-[\w-]+\.png$/.test(arquivo)) return "2026-10-02"; // as 4 do guia, montadas pelo GP/monta_telas.py de 02/10
  return undefined;
}

/** caminho de tela no public-kit: telas/<png> (as 4 montadas do guia) ou pecas/<peça>/telas/<png> (receita) */
const CAMINHO_TELA = /^(?:pecas\/[^/]+\/)?telas\/[^/]+$/;

/** toda string em campo "src" de uma camada (a imagem e o selo da abertura; aninhado também) */
function srcsDe(x: unknown, saida: string[] = []): string[] {
  if (Array.isArray(x)) for (const v of x) srcsDe(v, saida);
  else if (eObjetoSimples(x)) {
    for (const k of Object.keys(x)) {
      const v = x[k];
      if (k === "src" && typeof v === "string" && v.trim()) saida.push(v.trim());
      else srcsDe(v, saida);
    }
  }
  return saida;
}

/** monta as props; com erro, lança ErroProps com todos os erros e avisos */
export function montaProps(cena: Cena, op: OpcoesProps): PropsKit {
  const r = avaliaCena(cena, op);
  if (r.erros.length || !r.props) throw new ErroProps(r.erros, r.avisos);
  return r.props;
}
