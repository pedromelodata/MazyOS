// Extensões do kit no bundle (dono K06; contrato: KIT/DESENHO.md, seções 1 (item 10) e 4.10).
// Descobre RM/src/kit/ext/<nome>/batidas.ts e RM/src/kit/ext/<nome>/render.tsx por require.context (o webpack e o
// rspack do Remotion juntam tudo no bundle) e carrega cada extensão dentro de try/catch: a que der erro de
// execução fica desligada, com console.warn("EXT_ERRO", nome, mensagem), e só a cena que pedir batida, camada ou
// objeto dela falha. Funciona com a pasta ext/ sem nenhuma extensão. Nome repetido não troca o do núcleo nem o de
// outra extensão (fica o primeiro, com console.warn("EXT_AVISO", ...)).
// Erro de sintaxe ou de import numa extensão quebra o bundle inteiro (todas as composições): quem escreve
// extensão prova o empacotamento com o esbuild antes de entregar (seção 4.10).
// Em Node (esbuild, fora do Remotion) não existe require.context: aqui volta a lista vazia, com aviso. O Node
// acha as extensões por busca de arquivos (K07).
import type { Batida } from "../nucleo/tipos";
import { BATIDAS_NUCLEO } from "../batidas/index";
import { FABRICAS_NUCLEO } from "./Cena3DKit";
import type { BatidasExtensao, CamadaExtensao, Extensao, FabricaObjeto, MetaCamada, RenderExtensao } from "./tipos-render";

type ContextoModulos = { keys(): string[]; (id: string): unknown };
// o require do bundler (webpack ou rspack), com o require.context
declare const require: { context(pasta: string, subpastas: boolean, filtro: RegExp): ContextoModulos };

let cache: Extensao[] | null = null;

const mensagem = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** nome da extensão a partir da chave do contexto ("./abertura/batidas.ts" dá "abertura") */
const nomeDe = (chave: string) => chave.replace(/^\.\//, "").split("/")[0];

function porNome(ctx: ContextoModulos | null): Record<string, string> {
  const r: Record<string, string> = {};
  if (!ctx) return r;
  for (const k of ctx.keys()) {
    const n = nomeDe(k);
    if (!r[n]) r[n] = k;
  }
  return r;
}

/** as extensões do bundle (carregadas uma vez por página) */
export function extensoes(): Extensao[] {
  if (cache) return cache;
  let ctxBatidas: ContextoModulos | null = null;
  let ctxRender: ContextoModulos | null = null;
  try {
    ctxBatidas = require.context("../ext", true, /^\.\/[^/]+\/batidas\.ts$/);
    ctxRender = require.context("../ext", true, /^\.\/[^/]+\/render\.tsx$/);
  } catch (e) {
    console.warn("EXT_AVISO", "require.context indisponível (fora do bundle do Remotion): nenhuma extensão carregada", mensagem(e));
    cache = [];
    return cache;
  }
  const kb = porNome(ctxBatidas);
  const kr = porNome(ctxRender);
  const nomes = Array.from(new Set(Object.keys(kb).concat(Object.keys(kr)))).sort();
  const lista: Extensao[] = [];
  for (const nome of nomes) {
    const ext: Extensao = { nome, batidas: {}, camadas: {}, render: {}, erro: null };
    try {
      if (kb[nome] && ctxBatidas) {
        const mod = ctxBatidas(kb[nome]) as BatidasExtensao;
        ext.batidas = (mod && mod.batidas) || {};
        ext.camadas = (mod && mod.camadas) || {};
      }
      if (kr[nome] && ctxRender) {
        const mod = ctxRender(kr[nome]) as { render?: RenderExtensao };
        ext.render = (mod && mod.render) || {};
      }
    } catch (e) {
      ext.erro = mensagem(e);
      ext.batidas = {};
      ext.camadas = {};
      ext.render = {};
      console.warn("EXT_ERRO", nome, ext.erro);
    }
    lista.push(ext);
  }
  cache = lista;
  return cache;
}

function junta<T>(base: Record<string, T>, campo: (e: Extensao) => Record<string, T> | undefined, rotulo: string): Record<string, T> {
  const r: Record<string, T> = {};
  for (const k of Object.keys(base)) r[k] = base[k];
  const dono: Record<string, string> = {};
  for (const k of Object.keys(base)) dono[k] = "núcleo";
  for (const ext of extensoes()) {
    if (ext.erro) continue;
    const itens = campo(ext) || {};
    for (const k of Object.keys(itens)) {
      if (r[k] !== undefined) {
        console.warn("EXT_AVISO", ext.nome, `${rotulo} "${k}" já existe (${dono[k]}); fica o primeiro`);
        continue;
      }
      r[k] = itens[k];
      dono[k] = `extensão ${ext.nome}`;
    }
  }
  return r;
}

/** batidas do núcleo + as das extensões ligadas */
export function registroDeBatidas(): Record<string, Batida<any>> {
  return junta(BATIDAS_NUCLEO, (e) => e.batidas, "batida");
}

/** fábricas de objeto do núcleo + as das extensões ligadas */
export function fabricasDeObjetos(): Record<string, FabricaObjeto> {
  return junta(FABRICAS_NUCLEO, (e) => e.render.objetos, "tipo de objeto");
}

/** componentes de camada 2D das extensões ligadas */
export function camadasDeRender(): Record<string, CamadaExtensao> {
  return junta<CamadaExtensao>({}, (e) => e.render.camadas, "tipo de camada");
}

/** metadados das camadas (os do batidas.ts das extensões) */
export function metaCamadas(): Record<string, MetaCamada> {
  return junta<MetaCamada>({}, (e) => e.camadas, "tipo de camada");
}

/** extensão desligada que a cena pede: erro claro (a cena só falha se pedir algo dela) */
export function confereExtensoes(o: { batidas: string[]; camadas: string[]; objetos: string[] }) {
  const desligadas = extensoes().filter((e) => !!e.erro);
  if (!desligadas.length) return;
  const b = registroDeBatidas();
  const c = camadasDeRender();
  const f = fabricasDeObjetos();
  const faltam = o.batidas.filter((x) => !b[x]).map((x) => `batida ${x}`)
    .concat(o.camadas.filter((x) => !c[x]).map((x) => `camada ${x}`))
    .concat(o.objetos.filter((x) => !f[x]).map((x) => `objeto ${x}`));
  if (faltam.length) {
    throw new Error(`a cena pede ${faltam.join(", ")}, e há extensão desligada por erro: ${desligadas.map((e) => `${e.nome} (${e.erro})`).join("; ")}`);
  }
}
