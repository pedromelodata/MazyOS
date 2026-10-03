// Sons das batidas (contrato: KIT/DESENHO.md, seções 4.3, 4.6 e 6; dono K02).
// Cada batida declara os sons por perfil (v2 = o aprovado; enxuto = o da auditoria de 01/10) presos às âncoras.
// Aqui: escolha da lista (semSom, sons, perfilSom e o perfil da cena), conversão de SomDef em EventoSom,
// extras e remoções da cena, t com 6 casas, ordem de emissão e semente por evento (crc32 da origem).
import type { Batida, EventoSom, ExtraSom, PropsKit, SomDef } from "./tipos";
import type { Relogio } from "./tempo";

export class ErroSom extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ErroSom";
  }
}

export const arredonda6 = (x: number) => {
  const r = Math.round(x * 1e6) / 1e6;
  return r === 0 ? 0 : r; // nada de -0 no JSON
};

/** escolhe a lista de sons da batida: params.semSom cala; params.sons troca a lista; params.perfilSom troca o perfil */
export function escolheSons(
  batida: Pick<Batida<unknown>, "id" | "sons">,
  params: Record<string, unknown>,
  perfilCena: string,
): { lista: SomDef[]; perfil: string } {
  if (params && params.semSom === true) return { lista: [], perfil: "nenhum" };
  if (params && Array.isArray(params.sons)) return { lista: params.sons as SomDef[], perfil: "cena" };
  const perfil = (params && typeof params.perfilSom === "string" ? (params.perfilSom as string) : perfilCena) || "v2";
  const sons = batida.sons as Record<string, SomDef[] | undefined>;
  if (perfil !== "v2" && perfil !== "enxuto") throw new ErroSom(`${batida.id}: perfil de som desconhecido: ${perfil}`);
  const lista = sons[perfil];
  // o perfil enxuto só existe nas batidas em que ele difere do v2; nas outras vale o v2
  return { lista: lista || batida.sons.v2, perfil: lista ? perfil : "v2" };
}

const REF_ANCORA = /^@([A-Za-z_][\w.]*)\s*(?:([+-])\s*(\d+(?:\.\d+)?))?$/;

/** "@ancora", "@ancora+0.08", "@ancora-0.1" e "$nome" viram número; o resto fica como está.
 *  Devolve undefined quando a âncora citada não existe nesta aplicação (o som cai junto). */
export function resolveArg(
  a: number | string,
  ancoras: Record<string, number>,
  valores: Record<string, number | string> | undefined,
  onde: string,
): number | string | undefined {
  if (typeof a !== "string") return a;
  const m = REF_ANCORA.exec(a);
  if (m) {
    const base = ancoras[m[1]];
    if (typeof base !== "number") return undefined;
    const d = m[3] ? Number(m[3]) * (m[2] === "-" ? -1 : 1) : 0;
    return arredonda6(base + d);
  }
  if (a.charAt(0) === "$") {
    const nome = a.slice(1);
    if (!valores || !(nome in valores)) throw new ErroSom(`${onde}: valor "${a}" não foi passado pela batida`);
    return valores[nome];
  }
  return a;
}

/** crc32 (IEEE 802.3, o mesmo do zlib.crc32 do Python) do texto em UTF-8, sem sinal */
let TABELA_CRC: number[] | null = null;
export function crc32(texto: string): number {
  if (!TABELA_CRC) {
    TABELA_CRC = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      TABELA_CRC.push(c >>> 0);
    }
  }
  const bytes = utf8(texto);
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = TABELA_CRC[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function utf8(s: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
      const d = s.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) {
        c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00);
        i++;
      }
    }
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}

/** transposição resolvida: "trilha" usa trilha.transporVerificado; 0 ou ausente = nenhum filtro (fica fora do evento) */
export function resolveTranspor(x: SomDef["transpor"], props: Pick<PropsKit, "trilha">): number | undefined {
  if (x === undefined || x === null) return undefined;
  const n = x === "trilha" ? props.trilha.transporVerificado || 0 : x;
  if (typeof n !== "number" || !isFinite(n)) throw new ErroSom(`transpor inválido: ${String(x)}`);
  return n === 0 ? undefined : n;
}

/** monta o EventoSom (sem a ordem, que sai no fim); campos opcionais só quando existem */
export function montaEvento(
  base: { t: number; som: string; ganhoDb: number; args?: (number | string)[]; filtro?: string; inverte?: boolean; ancora?: "inicio" | "sincronia"; transpor?: SomDef["transpor"] },
  origem: string,
  props: Pick<PropsKit, "trilha" | "sons">,
): EventoSom {
  // ordem de campos estável no JSON: ordem, t, som, ganhoDb, args, filtro, inverte, ancora, transpor, semente, origem
  const saida: Record<string, unknown> = { ordem: -1, t: arredonda6(base.t), som: base.som, ganhoDb: base.ganhoDb };
  if (base.args && base.args.length) saida.args = base.args;
  if (base.filtro) saida.filtro = base.filtro;
  if (base.inverte) saida.inverte = true;
  if (base.ancora) saida.ancora = base.ancora;
  const tr = resolveTranspor(base.transpor, props);
  if (tr !== undefined) saida.transpor = tr;
  if (props.sons.modoRuido === "por-evento") saida.semente = crc32(origem);
  saida.origem = origem;
  return saida as unknown as EventoSom;
}

/** SomDef da batida em EventoSom pelas âncoras; null quando a âncora não existe nesta aplicação (parte desligada) */
export function somParaEvento(
  def: SomDef,
  ancoras: Record<string, number>,
  valores: Record<string, number | string> | undefined,
  origem: string,
  props: Pick<PropsKit, "trilha" | "sons">,
  relogio: Pick<Relogio, "confere">,
  ancorasDeclaradas?: string[],
): EventoSom | null {
  if (!def || typeof def.som !== "string" || !def.som) throw new ErroSom(`${origem}: som sem id`);
  if (ancorasDeclaradas && ancorasDeclaradas.indexOf(def.em) < 0) {
    throw new ErroSom(`${origem}: âncora "${def.em}" não existe nesta batida (as âncoras são: ${ancorasDeclaradas.join(", ")})`);
  }
  const a0 = ancoras[def.em];
  if (typeof a0 !== "number") return null;
  const t = a0 + (def.desloc || 0);
  relogio.confere(t, `${origem} (${def.som})`);
  let args: (number | string)[] | undefined;
  if (def.args) {
    args = [];
    for (const a of def.args) {
      const r = resolveArg(a, ancoras, valores, origem);
      if (r === undefined) return null;
      args.push(r);
    }
  }
  return montaEvento(
    { t, som: def.som, ganhoDb: def.ganhoDb, args, filtro: def.filtro, inverte: def.inverte, ancora: def.ancora, transpor: def.transpor },
    origem,
    props,
  );
}

/** extras da cena ("cena#<índice>"), com o t resolvido pelo relógio da peça */
export function extraParaEvento(x: ExtraSom, i: number, relogio: Relogio, props: Pick<PropsKit, "trilha" | "sons">): EventoSom {
  const origem = `cena#${i}`;
  const t = relogio.t(x.t, undefined, `sons.extras[${i}]`);
  return montaEvento(
    { t, som: x.som, ganhoDb: x.ganhoDb, args: x.args, filtro: x.filtro, inverte: x.inverte, ancora: x.ancora, transpor: x.transpor },
    origem,
    props,
  );
}

/** tira os `remover` (por origem) e numera a ordem de emissão */
export function fechaEventos(eventos: EventoSom[], remover: string[]): EventoSom[] {
  const fora: Record<string, true> = {};
  for (const r of remover || []) fora[r] = true;
  const ficam = eventos.filter((e) => !fora[e.origem]);
  ficam.forEach((e, i) => {
    e.ordem = i;
  });
  return ficam;
}
