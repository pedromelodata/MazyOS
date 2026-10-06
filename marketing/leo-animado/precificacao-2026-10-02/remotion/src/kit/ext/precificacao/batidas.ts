// Extensão "precificacao" do kit de motion: as batidas 2D da biblioteca do reel de 02/10 ("3 sinais") e os
// metadados das camadas (dono K14; contrato: KIT/DESENHO.md, seções 4.3, 4.10 e 5, "Família 2D da precificação").
// Origem: RM/src/motion/kit.tsx (componentes e as curvas spring, shake e inn), RM/src/Motion.tsx (transições e
// câmera) e RM/src/Broll.tsx (cortes), todos só importados; nada é copiado nem editado.
// Sons padrão: os do PR/src/mix_inst.py (modo motion pras transições, modo broll pros cortes).
//
// Puro: sem React, sem DOM, sem Remotion, sem SplitText e sem DrawSVGPlugin. Sem efeito colateral no import:
// nenhuma ease registrada, nenhum padrão do gsap trocado, nenhum plugin, nenhum gancho global. As curvas da mola
// e da tremida entram como função de ease do próprio tween (não ficam registradas em lugar nenhum).
//
// Estado: cada camada lê st.canais[id]. Nas camadas de componente: x, y (px, somados à posição da camada), s
// (escala, multiplica a da camada), rot (graus, somado), op, blur e os canais próprios (frame, acende, shut,
// digit, on, cheio, spin, ring, voo, open, look, fill, val). Mola e tremida em x, y, s e rot ganham um canal só
// delas ("s~1", "x~2"...), que o render soma: assim duas molas seguidas se somam como no original. No grupo:
// vis, op, x, y, s, rot e os progressos das transições e dos cortes (entra, sai, corteEntra, corteSai, clarao).
import type { Batida, CamadaProps, Ctx, Estado, SomDef, Tempo } from "../../nucleo/tipos";
import { ancoras, vars } from "../../batidas/ajudantes";
import { CLARAO, DUR_CORTE, TIPOS_CORTE, type TipoCorte } from "./cortes";
import { DURACAO_TREMIDA, duracaoMola } from "./curvas";
import { DUR_TRANSICAO, IRIS_PADRAO, TIPOS_TRANSICAO, type TipoTransicao } from "./transicoes";

type Canal = Record<string, number>;
type Vals = Record<string, number>;

// ---------- tipos de camada ----------

export const PREFIXO = "p2d-";
export const TIPO_GRUPO = "p2d-grupo";
export const TIPO_LEGENDA = "p2d-legenda";

/** os componentes exportados de RM/src/motion/kit.tsx que viram camada "p2d-<Nome>", na ordem do arquivo */
export const COMPONENTES = [
  "At", "Bg", "Numeral", "Sticker", "ClayCard", "Bubble", "Calendar", "Stamp", "HangTag", "Padlock", "YearOdo", "Check",
  "NumDot", "AlarmClock", "BigArrow", "Rays", "Confetti", "Phone", "Eye", "TetoCard", "CommentIcon", "Pill", "Sparkle",
];

/** os elementos do reel de 09/10 (sufoco.tsx, nativos do kit): também viram camada "p2d-<Nome>" */
export const COMPONENTES_SUFOCO = ["RelogioTarde", "Bilhete", "Navegador", "Cursor", "Telefone", "Fila", "Entardecer", "Empresa", "Ampulheta", "Construcao", "Perfil"];

/** ícones clay que o Sticker acha em icons/<nome>.webp (os 5 de RM/public/icons, ligados pelo ext-liga) */
export const ICONES = ["calendario", "campanha", "growth", "lampada", "metricas"];

/** sequências clay do ClayCard (121 quadros cada, de 000 a 120, em clay/<seq>/NNN.jpg) */
export const SEQUENCIAS_CLAY = ["cadastro", "calculo"];

/** fundos do Bg e do grupo */
export const FUNDOS = ["paper", "dark", "coral"];

/** modos da legenda (os do AppleCaptions e da LegendaApple do K06) */
export const MODOS_LEGENDA = ["light", "dark", "coral", "video"];

/** cores do confete quando a camada não diz (as do sinal 5 do Motion.tsx) */
export const CONFETE_PADRAO = ["#FFFFFF", "#1B1E24", "#F8C3B0", "#FBDDD1"];

/** canais que aceitam mola e tremida (cada uma ganha o canal "<base>~<n>", somado pelo render) */
export const ADITIVOS = ["x", "y", "s", "rot"];

const BASE = ["x", "y", "s", "rot", "op", "blur"];

/** canais que cada tipo de camada lê (o que as batidas podem animar) */
export const CANAIS: Record<string, string[]> = {
  "p2d-At": BASE,
  "p2d-Bg": ["op"],
  "p2d-Numeral": BASE,
  "p2d-Sticker": BASE,
  "p2d-ClayCard": BASE.concat(["frame"]),
  "p2d-Bubble": BASE,
  "p2d-Calendar": BASE.concat(["acende"]),
  "p2d-Stamp": BASE,
  "p2d-HangTag": BASE,
  "p2d-Padlock": BASE.concat(["shut"]),
  "p2d-YearOdo": BASE.concat(["digit"]),
  "p2d-Check": BASE.concat(["on"]),
  "p2d-NumDot": BASE.concat(["cheio"]),
  "p2d-AlarmClock": BASE.concat(["spin", "ring"]),
  "p2d-BigArrow": BASE,
  "p2d-Rays": BASE,
  "p2d-Confetti": BASE.concat(["voo"]),
  "p2d-Phone": BASE,
  "p2d-Eye": BASE.concat(["open", "look"]),
  "p2d-TetoCard": BASE.concat(["fill", "val"]),
  "p2d-CommentIcon": BASE,
  "p2d-Pill": BASE,
  "p2d-Sparkle": BASE,
  "p2d-RelogioTarde": BASE.concat(["hora", "fatia"]),
  "p2d-Bilhete": BASE.concat(["marca"]),
  "p2d-Navegador": BASE.concat(["carrega", "gira", "trava", "falha"]),
  "p2d-Cursor": BASE.concat(["aperta", "onda"]),
  "p2d-Telefone": BASE.concat(["toca", "cai", "vibra"]),
  "p2d-Fila": BASE.concat(["anda", "suspira"]),
  "p2d-Entardecer": BASE.concat(["sol", "noite", "luzes"]),
  "p2d-Empresa": BASE.concat(["gira", "luz", "pausa"]),
  "p2d-Ampulheta": BASE.concat(["vira", "areia"]),
  "p2d-Construcao": BASE.concat(["molde", "blocos", "liga"]),
  "p2d-Perfil": BASE.concat(["segue", "link"]),
  [TIPO_GRUPO]: ["vis", "op", "x", "y", "s", "rot", "entra", "sai", "corteEntra", "corteSai", "clarao"],
  [TIPO_LEGENDA]: ["op"],
};

/** valor de repouso de cada canal (o que vale quando a cena não declara em "estado") */
export const REPOUSO: Vals = {
  x: 0, y: 0, s: 1, rot: 0, op: 1, blur: 0,
  frame: 0, acende: 0, shut: 0, digit: 4, on: 0, cheio: 0, spin: 10.25, ring: 0, voo: 0, open: 1, look: 0, fill: 0, val: 0,
  vis: 1, entra: 1, sai: 0, corteEntra: 1, corteSai: 0, clarao: 0,
  hora: 13, fatia: 0, marca: 0, carrega: 0, gira: 0, trava: 0, falha: 0, aperta: 0, onda: 0, toca: 0, cai: 0, vibra: 0,
  anda: 0, suspira: 0, sol: 0, noite: 0, luzes: 0, luz: 1, pausa: 0, vira: 0, areia: 0, molde: 1, blocos: 0, liga: 0,
  segue: 0, link: 0,
  entraTipo: -1, saiTipo: -1, corteEntraTipo: -1, corteSaiTipo: -1, entraOx: IRIS_PADRAO.ox, entraOy: IRIS_PADRAO.oy,
};

/** canais internos do grupo (gravados pelas batidas de transição e de corte; a cena não anima) */
const INTERNOS_GRUPO = ["entraTipo", "saiTipo", "corteEntraTipo", "corteSaiTipo", "entraOx", "entraOy"];

/** camadas que precisam da mídia do midia.json no public-kit (kit.py ext-liga precificacao) */
export const PEDEM_MIDIA = ["p2d-Sticker", "p2d-ClayCard", "p2d-TetoCard", "p2d-Phone", "p2d-Construcao"];

export function ehP2D(tipo: unknown): boolean {
  return typeof tipo === "string" && tipo.indexOf(PREFIXO) === 0 && !!CANAIS[tipo];
}

/** o grupo da camada (param "grupo"), ou null quando ela fica solta */
export function grupoDe(def: CamadaProps): string | null {
  return typeof def.grupo === "string" && def.grupo ? (def.grupo as string) : null;
}

const nome = (x: unknown) => JSON.stringify(x);
const arred6 = (x: number) => Math.round(x * 1e6) / 1e6;

// ---------- estado ----------

/** canal da camada (cria vazio quando não existe) */
export function canalDe(st: Estado, id: string): Canal {
  if (!st.canais[id]) st.canais[id] = {};
  return st.canais[id];
}

/** a camada p2d declarada na cena, conferindo o tipo (tipos vazio = qualquer p2d) */
export function camadaP2D(ctx: Pick<Ctx, "props">, id: unknown, tipos?: string[]): CamadaProps {
  const lista = ctx.props.camadas || [];
  const c = lista.filter((x) => x && x.id === id)[0];
  if (!c) throw new Error(`camada citada não existe: ${nome(id)} (a cena tem: ${lista.map((x) => x.id).join(", ") || "nenhuma"})`);
  if (!ehP2D(c.tipo)) throw new Error(`a camada ${nome(id)} é do tipo ${nome(c.tipo)}, que não é da biblioteca 2D (p2d-...)`);
  if (tipos && tipos.length && tipos.indexOf(c.tipo) < 0) throw new Error(`a camada ${nome(id)} é do tipo ${nome(c.tipo)}; esta batida aceita: ${tipos.join(", ")}`);
  return c;
}

/** completa o canal com os valores de repouso dos canais do tipo (o que a cena pôs em "estado" fica) */
export function prepara(st: Estado, def: CamadaProps): Canal {
  const c = canalDe(st, def.id);
  const lista = (CANAIS[def.tipo] || []).concat(def.tipo === TIPO_GRUPO ? INTERNOS_GRUPO : []);
  for (const k of lista) if (typeof c[k] !== "number") c[k] = REPOUSO[k];
  return c;
}

export function exigeCanal(def: CamadaProps, canal: string): void {
  const lista = CANAIS[def.tipo] || [];
  if (lista.indexOf(canal) < 0) throw new Error(`a camada ${nome(def.id)} (${def.tipo}) não tem o canal ${nome(canal)} (canais: ${lista.join(", ")})`);
}

// Valor de partida de cada canal: o GSAP só mexe no canal quando um tween começa; antes disso vale o que está no
// estado. Aqui o estado de partida de cada canal vira o "de" do primeiro evento NO TEMPO que mexe nele (uma
// entrada começa escondida; uma saída começa do que estava). Todo fromTo das batidas usa immediateRender false,
// então a ordem das batidas na cena não importa. Registro por estado (cada render e cada execução em Node cria o
// seu), sem nada global.
type Partida = { base: number; t: number };
const PARTIDAS = new WeakMap<Estado, Record<string, Partida>>();

export function partida(st: Estado, id: string, c: Canal, canal: string, t: number, de: number | undefined): void {
  let m = PARTIDAS.get(st);
  if (!m) {
    m = {};
    PARTIDAS.set(st, m);
  }
  const chave = `${id}|${canal}`;
  let r = m[chave];
  if (!r) {
    r = { base: typeof c[canal] === "number" ? c[canal] : REPOUSO[canal], t: Infinity };
    m[chave] = r;
  }
  if (t < r.t) {
    r.t = t;
    c[canal] = de === undefined ? r.base : de;
  }
}

/** próximo canal só da mola ou da tremida: "s~1", "s~2"... (o render soma todos os "<base>~n") */
export function proximoAditivo(c: Canal, base: string): string {
  let n = 1;
  while (typeof c[`${base}~${n}`] === "number") n++;
  const k = `${base}~${n}`;
  c[k] = 0;
  return k;
}

// ---------- conferência da cena (uma vez por estado, na primeira batida p2d) ----------

const CONFERIDAS = new WeakSet<Estado>();
const PALAVRA_PAGAR = /^pag(ar|ou|o|a|as|os|amento|amentos|ue|uei)?$/i;
const TEXTO_PAGO = /(^|[^a-zà-ú])(pag[oa]s?|quitad[oa]s?)([^a-zà-ú]|$)/i;

function confereCena(st: Estado, ctx: Ctx): void {
  if (CONFERIDAS.has(st)) return;
  CONFERIDAS.add(st);
  const camadas = (ctx.props.camadas || []).filter((c) => c && ehP2D(c.tipo));
  const porId: Record<string, CamadaProps> = {};
  for (const c of ctx.props.camadas || []) if (c && typeof c.id === "string") porId[c.id] = c;
  let olhos = 0;
  const midia: string[] = [];
  for (const c of camadas) {
    const g = grupoDe(c);
    if (c.grupo !== undefined && c.grupo !== null && !g) throw new Error(`camada ${nome(c.id)}: "grupo" tem de ser o id de uma camada p2d-grupo`);
    if (g) {
      const pai = porId[g];
      if (!pai || pai.tipo !== TIPO_GRUPO) throw new Error(`camada ${nome(c.id)}: o grupo ${nome(g)} não existe ou não é p2d-grupo`);
      const vistos: Record<string, true> = {};
      let atual: CamadaProps | undefined = c;
      while (atual && grupoDe(atual)) {
        if (vistos[atual.id]) throw new Error(`grupos em círculo: ${Object.keys(vistos).join(" > ")}`);
        vistos[atual.id] = true;
        atual = porId[grupoDe(atual) as string];
      }
    }
    const t = c.tipo;
    if (t === "p2d-Bg" && c.kind !== undefined && FUNDOS.indexOf(c.kind as string) < 0) {
      throw new Error(`camada ${nome(c.id)} (p2d-Bg): kind ${nome(c.kind)} não existe (use ${FUNDOS.join(", ")})`);
    }
    if (t === TIPO_GRUPO && c.fundo !== undefined && c.fundo !== null && FUNDOS.indexOf(c.fundo as string) < 0) {
      throw new Error(`camada ${nome(c.id)} (p2d-grupo): fundo ${nome(c.fundo)} não existe (use ${FUNDOS.join(", ")} ou null)`);
    }
    if (t === "p2d-Numeral") {
      if (typeof c.n !== "number") throw new Error(`camada ${nome(c.id)} (p2d-Numeral): falta "n" (número)`);
      if (!(Number.isInteger(c.n) && (c.n as number) >= 1 && (c.n as number) <= 9)) {
        ctx.avisa(`p2d-Numeral ${nome(c.id)} mostra ${c.n}: número que não é numeração de lista só com base no FATOS`);
      }
    }
    if (t === "p2d-Sticker" && ICONES.indexOf(c.icon as string) < 0) throw new Error(`camada ${nome(c.id)} (p2d-Sticker): ícone ${nome(c.icon)} não existe (ícones: ${ICONES.join(", ")})`);
    if (t === "p2d-ClayCard" && SEQUENCIAS_CLAY.indexOf(c.seq as string) < 0) throw new Error(`camada ${nome(c.id)} (p2d-ClayCard): seq ${nome(c.seq)} não existe (use ${SEQUENCIAS_CLAY.join(" ou ")})`);
    const textos: Array<[string, string]> = [["p2d-Bubble", "text"], ["p2d-Stamp", "text"], ["p2d-Pill", "texto"], ["p2d-At", "texto"], ["p2d-Calendar", "month"]];
    for (const [tipo, campo] of textos) {
      if (t === tipo && (typeof c[campo] !== "string" || !(c[campo] as string).trim())) throw new Error(`camada ${nome(c.id)} (${tipo}): falta "${campo}" (texto)`);
    }
    if (t === "p2d-Stamp" && TEXTO_PAGO.test(c.text as string)) {
      throw new Error(`camada ${nome(c.id)} (p2d-Stamp): carimbo sem "pago" nem "quitado" (o app não confirma pagamento)`);
    }
    if (t === "p2d-TetoCard") ctx.avisa(`p2d-TetoCard ${nome(c.id)} mostra "TETO DO MEI" e "R$ 81 mil por ano" (F051, escrito no componente): só em peça que fala do teto do MEI`);
    if (t === "p2d-Phone") ctx.avisa(`p2d-Phone ${nome(c.id)} mostra a splash do protótipo (conjunto 2026-10-02): não chamar de tela real do app`);
    if (t === "p2d-Eye") olhos++;
    if (PEDEM_MIDIA.indexOf(t) >= 0 && midia.indexOf(t) < 0) midia.push(t);
    if (t === TIPO_LEGENDA) {
      const modos = Array.isArray(c.modos) ? (c.modos as unknown[]) : [];
      for (const m of modos.concat(c.modo === undefined ? [] : [c.modo])) {
        if (MODOS_LEGENDA.indexOf(m as string) < 0) throw new Error(`camada ${nome(c.id)} (p2d-legenda): modo ${nome(m)} não existe (use ${MODOS_LEGENDA.join(", ")})`);
      }
    }
  }
  if (olhos > 1) ctx.avisa(`${olhos} camadas p2d-Eye: o Eye usa o id de recorte fixo "olho"; dois olhos no mesmo quadro podem recortar errado`);
  if (midia.length) ctx.avisa(`${midia.join(", ")} usam a mídia da extensão: rode kit.py ext-liga precificacao antes do render ou dos stills (e ext-desliga depois)`);
}

/** confete nunca na batida de pagar: nenhuma palavra "pagar" (e família) entre 0,5 s antes e o fim do voo */
function confereConfete(ctx: Ctx, def: CamadaProps, t0: number): void {
  if (def.tipo !== "p2d-Confetti") return;
  const palavras = (ctx.props.narracao && ctx.props.narracao.words) || [];
  for (const w of palavras) {
    const limpa = String(w.t).toLowerCase().replace(/[^a-zà-ú]/g, "");
    if (PALAVRA_PAGAR.test(limpa) && w.e >= t0 - 0.5 && w.s <= t0 + 1.6) {
      throw new Error(`confete ${nome(def.id)} em ${t0.toFixed(2)} s perto de "${w.t}" (${w.s.toFixed(2)} s): confete nunca na batida de pagar (o app não confirma pagamento)`);
    }
  }
}

// ---------- 1. p2d-entra ----------

export type ParamsEntra = { camada: string; t: Tempo; dur: number; s0: number; ease: string; opFracao: number; de: Vals; easeDe: string };

export const entra: Batida<ParamsEntra> = {
  id: "p2d-entra",
  camada: "2d",
  descricao: "Pop de entrada da camada (o inn do kit.tsx): a escala sai de s0 até 1 com back.out(1.8) em 0,34 s e a opacidade sobe em 30% desse tempo, sem nada antes. Em \"de\", deslocamentos de partida (x e y em px, rot em graus, blur em px) que voltam a 0 com easeDe.",
  ancoras: ["inicio"],
  padrao: { camada: "elemento", t: 1.0, dur: 0.34, s0: 0.4, ease: "back.out(1.8)", opFracao: 0.3, de: {}, easeDe: "power2.out" },
  sons: { v2: [{ som: "sint-s_pop", em: "inicio", desloc: 0, ganhoDb: -25, args: [620, 240, 0.16, 22] }] },
  aplica(tl, st, p, ctx) {
    confereCena(st, ctx);
    const def = camadaP2D(ctx, p.camada);
    const c = prepara(st, def);
    const t0 = ctx.t(p.t);
    if (!(p.dur > 0)) throw new Error(`dur precisa ser maior que 0 (recebido ${nome(p.dur)})`);
    const temEscala = (CANAIS[def.tipo] || []).indexOf("s") >= 0;
    if (temEscala) {
      partida(st, def.id, c, "s", t0, p.s0);
      tl.fromTo(c, { s: p.s0 }, vars({ s: 1 }, p.dur, p.ease, { immediateRender: false }), t0);
    }
    partida(st, def.id, c, "op", t0, 0);
    tl.fromTo(c, { op: 0 }, vars({ op: 1 }, p.dur * p.opFracao, "none", { immediateRender: false }), t0);
    const ks = Object.keys(p.de || {});
    if (ks.length) {
      const de: Vals = {};
      const para: Vals = {};
      for (const k of ks) {
        if (["x", "y", "rot", "blur"].indexOf(k) < 0) throw new Error(`"de" aceita x, y, rot e blur (recebido ${nome(k)})`);
        exigeCanal(def, k);
        de[k] = p.de[k];
        para[k] = 0;
        partida(st, def.id, c, k, t0, p.de[k]);
      }
      tl.fromTo(c, de, vars(para, p.dur, p.easeDe, { immediateRender: false }), t0);
    }
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// ---------- 2. p2d-sai ----------

export type ParamsSai = { camada: string; t: Tempo; dur: number; ease: string; para: Vals };

export const sai: Batida<ParamsSai> = {
  id: "p2d-sai",
  camada: "2d",
  descricao: "Saída da camada como o leave do lib/tl (1 menos outCubic em 0,26 s): vai até \"para\" (padrão: opacidade 0; acrescente s, x, y ou rot pra sair andando, por exemplo {\"op\": 0, \"s\": 0.85}). Sem som padrão: o mix_inst.py não tem som de saída de elemento.",
  ancoras: ["inicio"],
  padrao: { camada: "elemento", t: 2.0, dur: 0.26, ease: "power2.out", para: { op: 0 } },
  sons: { v2: [] },
  aplica(tl, st, p, ctx) {
    confereCena(st, ctx);
    const def = camadaP2D(ctx, p.camada);
    const c = prepara(st, def);
    const t0 = ctx.t(p.t);
    const ks = Object.keys(p.para || {});
    if (!ks.length) throw new Error(`"para" vazio: diga os canais de chegada (por exemplo {"op": 0})`);
    for (const k of ks) {
      exigeCanal(def, k);
      partida(st, def.id, c, k, t0, undefined);
    }
    tl.to(c, vars(p.para, p.dur, p.ease), t0);
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// ---------- 3. p2d-mola ----------

export type ParamsMola = { camada: string; t: Tempo; canal: string; amp: number; f: number; amort: number; dur: number | null };

export const molaBatida: Batida<ParamsMola> = {
  id: "p2d-mola",
  camada: "2d",
  descricao: "Mola amortecida que parte de 0 (o spring do kit.tsx): amp·e^(-amort·d)·sen(2πf·d) somada ao canal (s soma ao fator de escala, rot em graus, x e y em px). Em canal próprio (como o ring do despertador) a mola vai direto no canal. Dura até cair a 1/1000 (ln 1000/amort) ou o dur dado. Sem som padrão: no mix_inst.py o soco não tem som próprio.",
  ancoras: ["inicio"],
  padrao: { camada: "elemento", t: 1.0, canal: "s", amp: 0.1, f: 2.6, amort: 6.5, dur: null },
  sons: { v2: [] },
  aplica(tl, st, p, ctx) {
    confereCena(st, ctx);
    const def = camadaP2D(ctx, p.camada);
    const c = prepara(st, def);
    exigeCanal(def, p.canal);
    const t0 = ctx.t(p.t);
    const D = typeof p.dur === "number" ? p.dur : duracaoMola(p.amort);
    if (!(D > 0) || !isFinite(D)) throw new Error(`duração da mola inválida (${nome(D)}): dê "dur" ou amort maior que 0`);
    let k = p.canal;
    if (ADITIVOS.indexOf(p.canal) >= 0) k = proximoAditivo(c, p.canal);
    else partida(st, def.id, c, k, t0, undefined);
    const amp = p.amp;
    const f = p.f;
    const amort = p.amort;
    // a curva do spring como ease: q é o progresso do tween (0 a 1), d = q·D é o tempo desde t0
    const ease = (q: number) => {
      if (q >= 1) return 0;
      const d = q * D;
      return amp * Math.exp(-amort * d) * Math.sin(2 * Math.PI * f * d);
    };
    const de: Vals = {};
    de[k] = 0;
    const para: Record<string, unknown> = {};
    para[k] = 1;
    para.duration = D;
    para.ease = ease;
    para.immediateRender = false;
    tl.fromTo(c, de, para as gsap.TweenVars, t0);
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// ---------- 4. p2d-treme ----------

export type EixoTremida = null | { amp: number; semente: number };
export type ParamsTreme = { camada: string; t: Tempo; x: EixoTremida; y: EixoTremida };

export const treme: Batida<ParamsTreme> = {
  id: "p2d-treme",
  camada: "2d",
  descricao: "Tremida amortecida em px (o shake do kit.tsx) somada a x e a y por 0,6 s; o padrão é a primeira tremida da câmera do Motion.tsx (x com amp 14 e semente 0; y com 0,7 da amplitude e semente 1).",
  ancoras: ["inicio"],
  padrao: { camada: "cena", t: 1.0, x: { amp: 14, semente: 0 }, y: { amp: 9.8, semente: 1 } },
  sons: { v2: [{ som: "sint-s_thump", em: "inicio", desloc: 0, ganhoDb: -21, args: [130, 55, 0.3] }] },
  aplica(tl, st, p, ctx) {
    confereCena(st, ctx);
    const def = camadaP2D(ctx, p.camada);
    const c = prepara(st, def);
    const t0 = ctx.t(p.t);
    const eixos: Array<["x" | "y", EixoTremida]> = [["x", p.x], ["y", p.y]];
    let algum = false;
    for (const [eixo, e] of eixos) {
      if (!e) continue;
      exigeCanal(def, eixo);
      algum = true;
      const k = proximoAditivo(c, eixo);
      const amp = e.amp;
      const semente = e.semente;
      const ease = (q: number) => {
        if (q >= 1) return 0;
        const d = q * DURACAO_TREMIDA;
        return amp * Math.exp(-9 * d) * 0.5 * (Math.sin(83 * d + semente) + Math.sin(127 * d + 2 * semente));
      };
      const de: Vals = {};
      de[k] = 0;
      const para: Record<string, unknown> = {};
      para[k] = 1;
      para.duration = DURACAO_TREMIDA;
      para.ease = ease;
      para.immediateRender = false;
      tl.fromTo(c, de, para as gsap.TweenVars, t0);
    }
    if (!algum) throw new Error("a tremida precisa de x ou y");
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// ---------- 5. p2d-canal ----------

export type ParamsCanal = { camada: string; t: Tempo; canal: string; de: number | null; para: number; dur: number; ease: string };

export const canalBatida: Batida<ParamsCanal> = {
  id: "p2d-canal",
  camada: "2d",
  descricao: "Tween de qualquer canal da camada (frame do ClayCard, acende do Calendar, shut, digit, on, spin, voo, open, look, fill, val, ou x, y, s, rot, op e blur): de \"de\" (ou do valor que estiver) até \"para\" em dur, com a ease dada.",
  ancoras: ["inicio"],
  padrao: { camada: "elemento", t: 1.0, canal: "op", de: null, para: 1, dur: 0.3, ease: "power2.out" },
  sons: { v2: [] },
  aplica(tl, st, p, ctx) {
    confereCena(st, ctx);
    const def = camadaP2D(ctx, p.camada);
    const c = prepara(st, def);
    exigeCanal(def, p.canal);
    if (typeof p.para !== "number") throw new Error(`"para" precisa ser número (recebido ${nome(p.para)})`);
    const t0 = ctx.t(p.t);
    if (p.canal === "voo") confereConfete(ctx, def, t0);
    const para: Vals = {};
    para[p.canal] = p.para;
    if (typeof p.de === "number") {
      partida(st, def.id, c, p.canal, t0, p.de);
      const de: Vals = {};
      de[p.canal] = p.de;
      tl.fromTo(c, de, vars(para, p.dur, p.ease, { immediateRender: false }), t0);
    } else {
      partida(st, def.id, c, p.canal, t0, undefined);
      tl.to(c, vars(para, p.dur, p.ease), t0);
    }
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// ---------- 6. p2d-transicao ----------

export type ParamsTransicao = { tipo: TipoTransicao; de: string; para: string; t: Tempo; dur: number | null; ox: number | null; oy: number | null };

/** sons do mix_inst.py (modo motion): o whoosh começa 0,08 s antes da janela e dura d + 0,2 (d + 0,25 no zoom);
 *  a íris e o zoom têm um acento na borda */
const SONS_TRANSICAO: SomDef[] = [
  { som: "sint-s_whoosh", em: "iris", desloc: -0.08, ganhoDb: -29, args: ["$dSom", 600, 8000] },
  { som: "sint-s_pop", em: "irisBorda", desloc: 0, ganhoDb: -27, args: [700, 300, 0.14, 24] },
  { som: "sint-s_whoosh", em: "push", desloc: -0.08, ganhoDb: -27, args: ["$dSom", 400, 6000] },
  { som: "sint-s_whoosh", em: "zoom", desloc: -0.08, ganhoDb: -26, args: ["$dSomZoom", 250, 4500] },
  { som: "sint-s_thump", em: "zoomBorda", desloc: 0.05, ganhoDb: -26, args: [110, 50, 0.3] },
  { som: "sint-s_whoosh", em: "slideUp", desloc: -0.08, ganhoDb: -27, args: ["$dSom", 400, 6000] },
  { som: "sint-s_whoosh", em: "wipeUp", desloc: -0.08, ganhoDb: -27, args: ["$dSom", 300, 5000] },
];

function doisGrupos(ctx: Ctx, de: string, para: string): [CamadaProps, CamadaProps] {
  if (de === para) throw new Error(`"de" e "para" são o mesmo grupo (${nome(de)})`);
  return [camadaP2D(ctx, de, [TIPO_GRUPO]), camadaP2D(ctx, para, [TIPO_GRUPO])];
}

export const transicao: Batida<ParamsTransicao> = {
  id: "p2d-transicao",
  camada: "2d",
  descricao: "Transição entre dois grupos (p2d-grupo), centrada em t, como o Scene do Motion.tsx: iris (círculo abrindo em ox, oy), push (empurrão de lado com desfoque), zoom (a cena que sai cresce e some na frente; a que entra vem de 0,7), slideUp (sobe com desfoque) e wipeUp (cortina de baixo pra cima). A que entra aparece no começo da janela; a que sai some no fim.",
  ancoras: ["inicio", "borda", "iris", "irisBorda", "push", "zoom", "zoomBorda", "slideUp", "wipeUp"],
  padrao: { tipo: "push", de: "cena1", para: "cena2", t: 3.0, dur: null, ox: null, oy: null },
  sons: { v2: SONS_TRANSICAO },
  aplica(tl, st, p, ctx) {
    confereCena(st, ctx);
    const idx = TIPOS_TRANSICAO.indexOf(p.tipo);
    if (idx < 0) throw new Error(`tipo de transição desconhecido: ${nome(p.tipo)} (tipos: ${TIPOS_TRANSICAO.join(", ")})`);
    const [gDe, gPara] = doisGrupos(ctx, p.de, p.para);
    const d = typeof p.dur === "number" ? p.dur : DUR_TRANSICAO[p.tipo];
    if (!(d > 0)) throw new Error(`dur precisa ser maior que 0 (recebido ${nome(d)})`);
    const b = ctx.t(p.t);
    const ini = ctx.t({ desloc: -d / 2 }, b);
    const fim = ctx.t({ desloc: d / 2 }, b);
    const cd = prepara(st, gDe);
    const cp = prepara(st, gPara);
    const ox = typeof p.ox === "number" ? p.ox : IRIS_PADRAO.ox;
    const oy = typeof p.oy === "number" ? p.oy : IRIS_PADRAO.oy;
    partida(st, gPara.id, cp, "vis", ini, 0);
    partida(st, gPara.id, cp, "entra", ini, undefined);
    partida(st, gDe.id, cd, "sai", ini, undefined);
    partida(st, gDe.id, cd, "vis", fim, undefined);
    tl.set(cp, { vis: 1, entraTipo: idx, entraOx: ox, entraOy: oy, entra: 0 }, ini);
    tl.to(cp, { entra: 1, duration: d, ease: "none" }, ini);
    tl.set(cd, { saiTipo: idx, sai: 0 }, ini);
    tl.to(cd, { sai: 1, duration: d, ease: "none" }, ini);
    tl.set(cd, { vis: 0 }, fim);
    const anc: Record<string, number> = { inicio: ini, borda: b };
    anc[p.tipo] = ini;
    if (p.tipo === "iris") anc.irisBorda = b;
    if (p.tipo === "zoom") anc.zoomBorda = b;
    ctx.som(anc, { dSom: arred6(d + 0.2), dSomZoom: arred6(d + 0.25) });
  },
};

// ---------- 7. p2d-corte ----------

export type ParamsCorte = { tipo: TipoCorte; de: string; para: string; t: Tempo; dur: number | null };

/** sons do mix_inst.py (modo broll): flash com baque e tique na borda; chicote com whoosh 0,22 s antes; o
 *  zoomBlur ganha um baque 0,04 s depois; a volta do loop com whoosh e os dois sinos do fim */
const SONS_CORTE: SomDef[] = [
  { som: "sint-s_thump", em: "flash", desloc: 0, ganhoDb: -24, args: [150, 60, 0.28] },
  { som: "sint-s_tick", em: "flash", desloc: 0, ganhoDb: -30, args: [2200] },
  { som: "sint-s_whoosh", em: "chicote", desloc: -0.22, ganhoDb: -31, args: [0.34, 500, 7000] },
  { som: "sint-s_thump", em: "zoomBlur", desloc: 0.04, ganhoDb: -28, args: [110, 50, 0.3] },
  { som: "sint-s_whoosh", em: "loop", desloc: -0.08, ganhoDb: -29, args: [0.4, 500, 7000] },
  { som: "sint-s_chime", em: "loop", desloc: 0.15, ganhoDb: -26, args: [1318.5, 1.1] },
  { som: "sint-s_chime", em: "loop", desloc: 0.22, ganhoDb: -34, args: [1975.5, 0.9] },
];

export const corte: Batida<ParamsCorte> = {
  id: "p2d-corte",
  camada: "2d",
  descricao: "Corte entre dois grupos (p2d-grupo), centrado em t, como o trOf do Broll.tsx: whipL (chicote pra esquerda com desfoque), whipUp (pra cima), zoomBlur (a que entra vem de 1,35 com desfoque; a que sai cresce, some e vai pra frente), flash (troca seca na borda, com clarão branco de 0,08 s antes e 0,2 s depois) e loop (a última cena sai pela esquerda e a primeira volta pela direita, como o fim do Broll).",
  ancoras: ["inicio", "borda", "flash", "chicote", "zoomBlur", "loop"],
  padrao: { tipo: "whipL", de: "cena1", para: "cena2", t: 3.0, dur: null },
  sons: { v2: SONS_CORTE },
  aplica(tl, st, p, ctx) {
    confereCena(st, ctx);
    const idx = TIPOS_CORTE.indexOf(p.tipo);
    if (idx < 0) throw new Error(`tipo de corte desconhecido: ${nome(p.tipo)} (tipos: ${TIPOS_CORTE.join(", ")})`);
    const [gDe, gPara] = doisGrupos(ctx, p.de, p.para);
    const d = typeof p.dur === "number" ? p.dur : DUR_CORTE[p.tipo];
    if (!(d > 0)) throw new Error(`dur precisa ser maior que 0 (recebido ${nome(d)})`);
    const b = ctx.t(p.t);
    const ini = ctx.t({ desloc: -d / 2 }, b);
    const fim = ctx.t({ desloc: d / 2 }, b);
    const cd = prepara(st, gDe);
    const cp = prepara(st, gPara);
    const anc: Record<string, number> = { inicio: ini, borda: b };
    if (p.tipo === "flash") {
      const tSobe = ctx.t({ desloc: -CLARAO.sobe }, b);
      ctx.t({ desloc: CLARAO.desce }, b); // só confere que o clarão termina dentro do vídeo
      partida(st, gPara.id, cp, "vis", b, 0);
      partida(st, gDe.id, cd, "vis", b, undefined);
      partida(st, gDe.id, cd, "clarao", tSobe, 0);
      partida(st, gPara.id, cp, "clarao", b, 0);
      tl.set(cp, { vis: 1 }, b);
      tl.set(cd, { vis: 0 }, b);
      tl.fromTo(cd, { clarao: 0 }, { clarao: 1, duration: CLARAO.sobe, ease: "none", immediateRender: false }, tSobe);
      tl.fromTo(cp, { clarao: 1 }, { clarao: 0, duration: CLARAO.desce, ease: "none", immediateRender: false }, b);
      anc.flash = b;
    } else {
      partida(st, gPara.id, cp, "vis", ini, 0);
      partida(st, gPara.id, cp, "corteEntra", ini, undefined);
      partida(st, gDe.id, cd, "corteSai", ini, undefined);
      partida(st, gDe.id, cd, "vis", fim, undefined);
      tl.set(cp, { vis: 1, corteEntraTipo: idx, corteEntra: 0 }, ini);
      tl.to(cp, { corteEntra: 1, duration: d, ease: "none" }, ini);
      tl.set(cd, { corteSaiTipo: idx, corteSai: 0 }, ini);
      tl.to(cd, { corteSai: 1, duration: d, ease: "none" }, ini);
      tl.set(cd, { vis: 0 }, fim);
      if (p.tipo === "loop") anc.loop = ini;
      else anc.chicote = b;
      if (p.tipo === "zoomBlur") anc.zoomBlur = b;
    }
    ctx.som(anc);
  },
};

// ---------- registro (seção 4.10) ----------

const LISTA: Array<Batida<any>> = [entra, sai, molaBatida, treme, canalBatida, transicao, corte];

export const batidas: Record<string, Batida<any>> = {};
for (const b of LISTA) batidas[b.id] = b;

const POS = { x: 540, y: 960, s: 1, rot: 0 };
const TRANSF = "Transformação da camada (At do kit.tsx): x e y (centro em px), s, rot (graus), origem, z (camada solta: padrão 150), grupo (id do p2d-grupo que a desenha) e flutua {amp, freq, fase, eixo} (balanço senoidal, fecha o loop no modo periódico).";

/** metadados das camadas (o Node valida as camadas da cena por aqui; o kit.py batidas lista) */
export const camadas: Record<string, { descricao: string; params: Record<string, unknown>; canais: string[] }> = {
  "p2d-At": {
    descricao: "Caixa de texto posicionada pelo At do kit.tsx (o \"sinais\" e o \"mais caro\" do gancho). " + TRANSF,
    params: { ...POS, texto: "mais caro", tamanho: 128, peso: 800, cor: "#FFFFFF", fundo: "#1B1E24", raio: 30, padding: "8px 40px 16px", espacamento: "-0.04em", sombra: null },
    canais: CANAIS["p2d-At"],
  },
  "p2d-Bg": {
    descricao: "Fundo de tela cheia do kit.tsx (papel, escuro ou coral, com a trama de pontos andando). Solta, fica no z 0, embaixo dos grupos; dentro de um grupo, use o \"fundo\" do grupo.",
    params: { kind: "paper", z: 0 },
    canais: CANAIS["p2d-Bg"],
  },
  "p2d-Numeral": {
    descricao: "Numeral gigante em Sora 800 (cheio ou só contorno). Só numeração de lista ou número do FATOS. " + TRANSF,
    params: { ...POS, n: 1, size: 1000, color: "#F2643C", outline: false },
    canais: CANAIS["p2d-Numeral"],
  },
  "p2d-Sticker": {
    descricao: "Adesivo: ícone clay (icons/<icon>.webp) num disco branco com sombra. Precisa do ext-liga. " + TRANSF,
    params: { ...POS, icon: "lampada", d: 230, pad: 0.08, ring: null },
    canais: CANAIS["p2d-Sticker"],
  },
  "p2d-ClayCard": {
    descricao: "Cartão com a sequência clay (clay/cadastro ou clay/calculo, 121 quadros a 24 fps; o original toca em 48 fps). O canal frame (0 a 120) escolhe o quadro: anime com p2d-canal, ease none. Precisa do ext-liga. " + TRANSF,
    params: { ...POS, seq: "cadastro", size: 600 },
    canais: CANAIS["p2d-ClayCard"],
  },
  "p2d-Bubble": {
    descricao: "Balão de conversa branco com o rabinho do lado l ou r (texto em Sora 600). " + TRANSF,
    params: { ...POS, text: "Perfeito, combinado.", side: "l", w: 440 },
    canais: CANAIS["p2d-Bubble"],
  },
  "p2d-Calendar": {
    descricao: "Agenda do mês com as células acendendo em diagonal. O canal acende (0 a 1) cobre dur + 0,14 s do original: anime com p2d-canal de 0 a 1 em dur + 0,14 s, ease none. " + TRANSF,
    params: { ...POS, month: "OUT", dur: 0.5 },
    canais: CANAIS["p2d-Calendar"],
  },
  "p2d-Stamp": {
    descricao: "Carimbo coral-700 com borda (texto em Sora 800). Nunca \"pago\" nem \"quitado\" (o app não confirma pagamento). " + TRANSF,
    params: { ...POS, rot: -14, text: "LOTADA" },
    canais: CANAIS["p2d-Stamp"],
  },
  "p2d-HangTag": {
    descricao: "Etiqueta de preço coral com \"R$\" e o furo. " + TRANSF,
    params: { ...POS, hole: "#1A1D23" },
    canais: CANAIS["p2d-HangTag"],
  },
  "p2d-Padlock": {
    descricao: "Cadeado; o canal shut (0 a 1) fecha a alça. " + TRANSF,
    params: { ...POS },
    canais: CANAIS["p2d-Padlock"],
  },
  "p2d-YearOdo": {
    descricao: "Odômetro do ano, \"202\" fixo e o último dígito rolando; o canal digit vai de 4 a 6 (2024 a 2026). " + TRANSF,
    params: { ...POS },
    canais: CANAIS["p2d-YearOdo"],
  },
  "p2d-Check": {
    descricao: "Caixa de checklist; o canal on (0 a 1) pinta de coral e desenha o check. " + TRANSF,
    params: { ...POS, size: 98 },
    canais: CANAIS["p2d-Check"],
  },
  "p2d-NumDot": {
    descricao: "Bolinha numerada (contorno coral; cheia com filled ou com o canal cheio acima de 0). " + TRANSF,
    params: { ...POS, n: 1, size: 100, filled: false },
    canais: CANAIS["p2d-NumDot"],
  },
  "p2d-AlarmClock": {
    descricao: "Despertador; spin é a hora dos ponteiros (10,25 = 10h15) e ring o tremor do toque (use p2d-mola no canal ring: amp 1, f 13, amort 3,2, dur 0,9). " + TRANSF,
    params: { ...POS, rot: -4 },
    canais: CANAIS["p2d-AlarmClock"],
  },
  "p2d-BigArrow": {
    descricao: "Seta grande coral de reajuste, de baixo pra cima. " + TRANSF,
    params: { ...POS, w: 600 },
    canais: CANAIS["p2d-BigArrow"],
  },
  "p2d-Rays": {
    descricao: "Raios girando em volta de x, y (giro em graus por segundo). " + TRANSF,
    params: { ...POS, n: 20, len: 1500, color: "255,255,255", a1: 0.08, a2: 0.16, giro: 12 },
    canais: CANAIS["p2d-Rays"],
  },
  "p2d-Confetti": {
    descricao: "Confete em leque saindo de x, y; o canal voo (0 a 1) cobre os 1,6 s do original: anime com p2d-canal de 0 a 1 em 1,6 s, ease none. Nunca na batida de pagar (a batida recusa). " + TRANSF,
    params: { ...POS, cols: CONFETE_PADRAO, n: 64, power: 1 },
    canais: CANAIS["p2d-Confetti"],
  },
  "p2d-Phone": {
    descricao: "Celular 2D com a splash do app (splash.png, a do conjunto atual, ligada pelo ext-liga). " + TRANSF,
    params: { ...POS, w: 300, rot: -6 },
    canais: CANAIS["p2d-Phone"],
  },
  "p2d-Eye": {
    descricao: "Olho que abre (open 0 a 1) e olha de lado (look -1 a 1). Um por quadro (recorte de id fixo). " + TRANSF,
    params: { ...POS, w: 250 },
    canais: CANAIS["p2d-Eye"],
  },
  "p2d-TetoCard": {
    descricao: "Medidor do teto do MEI (escuro): fill enche a barra e val mostra \"R$ 81 mil por ano\" (F051, escrito no componente). Só em peça do teto do MEI. Precisa do ext-liga (icons/metricas.webp). " + TRANSF,
    params: { ...POS },
    canais: CANAIS["p2d-TetoCard"],
  },
  "p2d-CommentIcon": {
    descricao: "Balão de comentário coral com os três pontinhos \"digitando\" (andam sozinhos com o tempo). " + TRANSF,
    params: { ...POS, w: 330 },
    canais: CANAIS["p2d-CommentIcon"],
  },
  "p2d-Pill": {
    descricao: "Pílula de texto (Sora 700), fundo e cor configuráveis. " + TRANSF,
    params: { ...POS, texto: "agenda cheia", bg: "#FFFFFF", color: "#1B1E24", size: 30, border: null },
    canais: CANAIS["p2d-Pill"],
  },
  "p2d-Sparkle": {
    descricao: "Brilho de 4 pontas pulsando (pulso {base, amp, freq, fase}: escala base + amp·sen(freq·t + fase)). " + TRANSF,
    params: { ...POS, color: "#FFFFFF", pulso: { base: 0.9, amp: 0.5, freq: 6, fase: 0 } },
    canais: CANAIS["p2d-Sparkle"],
  },
  "p2d-RelogioTarde": {
    descricao: "Relógio de parede (reel de 09/10): a fatia coral cobre de \"de\" a \"ate\" (horas) conforme o canal fatia (0 a 1), hora é a hora dos ponteiros (13,5 = 13h30) e o ponteiro dos segundos anda sozinho, um tique por segundo. Sem números no mostrador. " + TRANSF,
    params: { ...POS, de: 13, ate: 18, d: 560 },
    canais: CANAIS["p2d-RelogioTarde"],
  },
  "p2d-Bilhete": {
    descricao: "Bilhete coral claro com fita, uma caixinha e duas linhas (a \"coisa simples\"); marca (0 a 1) desenha o visto coral na caixinha (pra tentar e não marcar: suba e volte a 0). " + TRANSF,
    params: { ...POS, w: 300 },
    canais: CANAIS["p2d-Bilhete"],
  },
  "p2d-Navegador": {
    descricao: "Janela de site genérica (sem endereço, marca nem texto): carrega é a barra de progresso, gira as voltas do anel de carregando (anime com ease none; parado, congela), trava (0 a 1) congela a página com rachaduras e o alerta, falha (0 a 1) desloca faixas da página (o glitch). " + TRANSF,
    params: { ...POS, w: 760 },
    canais: CANAIS["p2d-Navegador"],
  },
  "p2d-Cursor": {
    descricao: "Cursor: modo \"seta\" (a ponta fica em x, y) ou \"toque\" (círculo de toque); aperta (0 a 1) encolhe no clique e onda (0 a 1) abre o anel do clique. Mova com p2d-canal em x e y. " + TRANSF,
    params: { ...POS, modo: "seta" },
    canais: CANAIS["p2d-Cursor"],
  },
  "p2d-Telefone": {
    descricao: "Fone coral com as ondas do toque (toca 0 a 1; pulsam sozinhas) e a pílula de chamando (pontinhos); vibra (0 a 1) treme o fone; cai (0 a 1) some com as ondas, derruba o fone com quique e troca a pílula pela linha partida. " + TRANSF,
    params: { ...POS, w: 600 },
    canais: CANAIS["p2d-Telefone"],
  },
  "p2d-Fila": {
    descricao: "Fila de n pessoas (passo em px entre elas) até a porta da direita, respirando; você (coral, com olhos) chega andando no fim da fila com o canal anda (0 a 1, já com a curva de chegada) e suspira com suspira (0 a 1). " + TRANSF,
    params: { ...POS, n: 9, passo: 122, w: 1500 },
    canais: CANAIS["p2d-Fila"],
  },
  "p2d-Entardecer": {
    descricao: "Céu de tela cheia (1080x1920, ponha em x 540 e y 960): o sol desce (sol 0 a 1), o céu vai do dia ao entardecer e à noite (noite 0 a 1; estrelas no fim) e as janelas da cidade acendem (luzes 0 a 1). " + TRANSF,
    params: { ...POS },
    canais: CANAIS["p2d-Entardecer"],
  },
  "p2d-Empresa": {
    descricao: "Lojinha com toldo coral e as engrenagens no telhado: gira são as voltas da engrenagem (anime até parar com uma curva de saída), luz (0 a 1) acende as janelas e pausa (0 a 1) pendura a placa de pausa na porta. " + TRANSF,
    params: { ...POS, w: 640 },
    canais: CANAIS["p2d-Empresa"],
  },
  "p2d-Ampulheta": {
    descricao: "Ampulheta com areia coral: vira (0 a 1) dá meia volta (antes de virar, a areia está toda embaixo) e areia (0 a 1) escorre depois de virada. " + TRANSF,
    params: { ...POS, w: 260 },
    canais: CANAIS["p2d-Ampulheta"],
  },
  "p2d-Construcao": {
    descricao: "Celular em montagem: molde (0 a 1) desenha o contorno branco, blocos (0 a 8) traz os blocos da tela um a um com pouso de mola e liga (0 a 1) acende a splash do app (splash.png, a do ext-liga) e o corpo escuro do aparelho. Protótipo: não chamar de tela real do app. " + TRANSF,
    params: { ...POS, w: 340 },
    canais: CANAIS["p2d-Construcao"],
  },
  "p2d-Perfil": {
    descricao: "Cartão de perfil sem @ (avatar com o visto coral, nome e duas linhas): segue (0 a 1) aperta o botão e, da metade em diante, ele vira o \"Seguindo\" com o visto; link (0 a 1) acende a pílula do link da bio. " + TRANSF,
    params: { ...POS, nome: "Legalizaí", botao: "Seguir", botaoFeito: "Seguindo", linkTexto: "link da bio", w: 780 },
    canais: CANAIS["p2d-Perfil"],
  },
  [TIPO_GRUPO]: {
    descricao: "Cena 2D que junta camadas (as que têm \"grupo\" com o id dela) com o fundo opcional e a câmera do Motion.tsx (x, y, s e rot do grupo, origem 50% 58%, mola e tremida somadas). Recebe as transições (p2d-transicao) e os cortes (p2d-corte). z padrão 10 + 2 por ordem entre os grupos (liste na ordem em que aparecem).",
    params: { fundo: "paper", origem: "50% 58%", z: null },
    canais: CANAIS[TIPO_GRUPO],
  },
  [TIPO_LEGENDA]: {
    descricao: "A legenda do kit (LegendaApple do K06) desenhada de novo POR CIMA das camadas 2D, com modo por frase (modos), pula e, com fecho true, também o fecho e o LINK DA BIO. Use quando um fundo 2D cobre a tela inteira (o KitMotion desenha as camadas por cima da legenda); sem fundo cheio, não use (a legenda sairia duas vezes).",
    params: { top: 250, altura: 340, tamanho: 72, modo: "light", modos: ["coral", "light", "light", "dark"], pula: [], fecho: true, z: 200 },
    canais: CANAIS[TIPO_LEGENDA],
  },
};
