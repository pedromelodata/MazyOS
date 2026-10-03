// Montagem da timeline a partir das props (contrato: KIT/DESENHO.md, seção 4.3; dono K02).
// As batidas entram na ordem do array `batidas` da cena; um Ctx por batida; params por mescla profunda sobre
// o padrão (arrays e Tempo substituem); os eventos saem na ordem de emissão, depois os extras da cena, menos
// os `remover`, com t em 6 casas. A timeline é a do novaTimeline (eases.ts); quem chama dá o seek(0, false)
// e, a cada quadro, tl.seek(quadro / fps + 1e-4, false).
import type { Batida, Ctx, Estado, EventoSom, PropsKit } from "./tipos";
import { criaRelogio, type Relogio } from "./tempo";
import { escolheSons, extraParaEvento, fechaEventos, somParaEvento } from "./sons";

export type OpcoesMonta = {
  /** recebe os avisos das batidas (sem isto, vão pro console.warn) */
  avisos?: string[];
  /** com isto a batida que der erro é pulada e a montagem segue (o montaProps usa pra juntar todos os erros) */
  aoErro?: (onde: string, erro: Error) => void;
  /** recebe os valores publicados entre batidas (ctx.publica), pra inspeção */
  quadro?: Record<string, unknown>;
};

export function eObjetoSimples(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

/** campos que guardam um Tempo inteiro: a cena substitui, nunca mescla ({palavra} com {fecho} daria lixo) */
export const CHAVES_ATOMICAS = ["t", "instante", "momento"];

const clona = (x: unknown): unknown => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

/** mescla profunda da cena sobre o padrão: objeto com objeto mescla; array, null, número e texto substituem.
 *  Chaves que começam com "_" (comentários como "_ajuda") ficam fora. */
export function mescla(padrao: unknown, cena: unknown): unknown {
  if (cena === undefined) return clonaComFuncoes(padrao);
  if (!eObjetoSimples(padrao) || !eObjetoSimples(cena)) return limpaComentarios(clona(cena));
  const r: Record<string, unknown> = {};
  for (const k of Object.keys(padrao)) r[k] = clonaComFuncoes(padrao[k]);
  for (const k of Object.keys(cena)) {
    if (k.charAt(0) === "_") continue;
    r[k] = CHAVES_ATOMICAS.indexOf(k) >= 0 ? limpaComentarios(clona(cena[k])) : mescla(padrao[k], cena[k]);
  }
  return r;
}

/** cópia profunda que mantém números como -2π exatos (JSON também mantém; aqui só evita perder undefined) */
function clonaComFuncoes(x: unknown): unknown {
  if (Array.isArray(x)) return x.map(clonaComFuncoes);
  if (eObjetoSimples(x)) {
    const r: Record<string, unknown> = {};
    for (const k of Object.keys(x)) r[k] = clonaComFuncoes(x[k]);
    return r;
  }
  return x;
}

/** tira as chaves "_..." (comentários) de qualquer profundidade */
export function limpaComentarios<T>(x: T): T {
  if (Array.isArray(x)) return x.map((v) => limpaComentarios(v)) as unknown as T;
  if (eObjetoSimples(x)) {
    const r: Record<string, unknown> = {};
    for (const k of Object.keys(x)) if (k.charAt(0) !== "_") r[k] = limpaComentarios(x[k]);
    return r as T;
  }
  return x;
}

export function relogioDe(props: PropsKit): Relogio {
  return criaRelogio({
    narracao: props.narracao,
    tFecho: props.tFecho,
    duracao: props.duracao,
    marcas: props.marcas || {},
    aiAcende: props.fecho ? props.fecho.aiAcende : 0.94,
  });
}

export function montaTimeline(
  tl: gsap.core.Timeline,
  st: Estado,
  props: PropsKit,
  batidas: Record<string, Batida<any>>,
  opcoes: OpcoesMonta = {},
): EventoSom[] {
  const relogio = relogioDe(props);
  const quadro = opcoes.quadro || {};
  const eventos: EventoSom[] = [];
  const ocorrencias: Record<string, number> = {};
  const avisa = (m: string) => {
    if (opcoes.avisos) opcoes.avisos.push(m);
    else console.warn(`[kit] ${m}`);
  };
  const falha = (onde: string, e: unknown) => {
    const erro = e instanceof Error ? e : new Error(String(e));
    if (erro.message.indexOf(onde) !== 0) erro.message = `${onde}: ${erro.message}`;
    if (opcoes.aoErro) opcoes.aoErro(onde, erro);
    else throw erro;
  };

  (props.batidas || []).forEach((entrada, i) => {
    const def = batidas[entrada.id];
    if (!def) {
      falha(`batidas[${i}]`, new Error(`batida inexistente: "${entrada.id}"`));
      return;
    }
    const n = (ocorrencias[entrada.id] = (ocorrencias[entrada.id] || 0) + 1);
    const rotulo = n === 1 ? entrada.id : `${entrada.id}:${n}`;
    const params = mescla(def.padrao, entrada.params || {}) as Record<string, unknown>;
    const ctx: Ctx = {
      t: (x, base) => relogio.t(x, base, rotulo),
      W: (k) => relogio.W(k),
      We: (k) => relogio.We(k),
      tFecho: props.tFecho === null ? NaN : props.tFecho,
      dur: props.duracao,
      fps: props.fps,
      props,
      som: (ancoras, valores) => {
        const { lista } = escolheSons(def, params, props.sons.perfil);
        lista.forEach((s, k) => {
          const ev = somParaEvento(s, ancoras, valores, `${rotulo}#${k}`, props, relogio, def.ancoras);
          if (ev) eventos.push(ev);
        });
      },
      publica: (chave, valor) => {
        quadro[chave] = valor;
      },
      le: <T>(chave: string) => quadro[chave] as T | undefined,
      avisa: (m) => avisa(`${rotulo}: ${m}`),
    };
    try {
      def.aplica(tl, st, params, ctx);
    } catch (e) {
      falha(rotulo, e);
    }
  });

  (props.sons.extras || []).forEach((x, i) => {
    try {
      eventos.push(extraParaEvento(x, i, relogio, props));
    } catch (e) {
      falha(`sons.extras[${i}]`, e);
    }
  });

  return fechaEventos(eventos, props.sons.remover || []);
}
