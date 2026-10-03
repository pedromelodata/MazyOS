// Extensão "tradicional-vs-legalizai" do kit de motion: as batidas novas do reel de 05/10/2026
// ("Contabilidade tradicional vs Legalizaí") e os metadados da camada 2D. Contrato: KIT/DESENHO.md, seções 4.3 e
// 4.10. Roteiro aprovado: KIT/pecas/2026-10-05-tradicional-vs-legalizai/ROTEIRO.md (decupagem por batida).
//
// Puro: sem React, sem DOM, sem Remotion. Cada batida recebe os parâmetros (padrão + cena), anima os canais do
// palco (st.canais.palco e st.canais["p:<peça>"]), o aparelho do kit (st.obj, st.telas) e a câmera (st.cam), e
// devolve os sons pelas âncoras (ctx.som), no perfil v2 do kit. Movimento: entradas com pouso (lgPousa no aparelho,
// kitPousa5 na argila e no papel, que passam no máximo 5%), saídas com lgSai, câmera em power*.inOut.
import type { Batida, Ctx, Estado, ObjSt, Tempo, TelaSt } from "../../nucleo/tipos";
import { ancoras, exigeTela, objeto, telaDe, vars, type Valores } from "../../batidas/ajudantes";
import {
  CANAIS_PALCO, P, PALCO, canalDe, estadoDaCena, garante, garanteCurvas, iniciaCanais, inicialPeca, peca, type Canal, type Palco, type Vals,
} from "./comum";

type Mov = { dur: number; ease: string };

const nomeDe = (x: unknown) => JSON.stringify(x);

/** prepara a batida: curvas da peça e canais (idempotente) */
function prepara(st: Estado, ctx: Ctx, palco: string): Palco {
  garanteCurvas();
  return iniciaCanais(st, ctx, palco);
}

/** canal do palco (vitrines e luz) */
function canalPalco(st: Estado, pal: Palco): Canal {
  return garante(canalDe(st, pal.id), CANAIS_PALCO);
}

/** troca seca da tela do aparelho (sem transição) */
function trocaTela(tl: gsap.core.Timeline, tela: TelaSt, chave: string, t: number, ctx: Ctx, extra?: Vals): void {
  exigeTela(ctx, chave);
  const v: Record<string, unknown> = { a: chave, b: chave, p: 0 };
  if (extra) for (const k of Object.keys(extra)) v[k] = extra[k];
  tl.set(tela, v, t);
}

// =====================================================================================================
// 1. vitrine-luz: a varredura de luz fria passa sobre o conjunto de argila ("tradicional")
export type ParamsVitrineLuz = { palco: string; t: Tempo; dur: number; ease: string };
export const vitrineLuz: Batida<ParamsVitrineLuz> = {
  id: "vitrine-luz",
  camada: "3d",
  descricao: "Uma varredura de luz fria atravessa a vitrine Tradicional e o conjunto de argila (luz de área fria e faixa clara no painel).",
  ancoras: ["inicio"],
  padrao: { palco: PALCO, t: { palavra: 1 }, dur: 0.5, ease: "power2.inOut" },
  sons: { v2: [{ som: "sint-s_brilho", em: "inicio", desloc: 0.02, ganhoDb: -38, args: ["$dur"] }] },
  aplica(tl, st, p, ctx) {
    const pal = prepara(st, ctx, p.palco);
    const c = canalPalco(st, pal);
    const t0 = ctx.t(p.t);
    ctx.t(p.dur + t0); // confere se cabe no vídeo
    tl.set(c, { varreI: 1 }, t0);
    tl.fromTo(c, { varre: 0 }, { varre: 1, duration: p.dur, ease: p.ease, immediateRender: false }, t0);
    tl.set(c, { varreI: 0, varre: 0 }, t0 + p.dur);
    ctx.som(ancoras({ inicio: t0 }), { dur: Math.round(p.dur * 1000) / 1000 });
  },
};

// 2. vitrine-fio: um fio de luz desce pelo vão entre as vitrines ("vs")
export type ParamsVitrineFio = { palco: string; t: Tempo; dur: number; ease: string; some: { desloc: number; dur: number; ease: string } };
export const vitrineFio: Batida<ParamsVitrineFio> = {
  id: "vitrine-fio",
  camada: "2d",
  descricao: "Um fio de luz desce pelo vão entre as vitrines e some (sem texto).",
  ancoras: ["inicio"],
  padrao: { palco: PALCO, t: { palavra: 2 }, dur: 0.35, ease: "power2.out", some: { desloc: 0.3, dur: 0.3, ease: "power1.in" } },
  sons: { v2: [{ som: "sint-s_swish", em: "inicio", desloc: 0, ganhoDb: -37, args: [0.13] }] },
  aplica(tl, st, p, ctx) {
    const pal = prepara(st, ctx, p.palco);
    const c = canalPalco(st, pal);
    const t0 = ctx.t(p.t);
    tl.set(c, { fioA: 1 }, t0);
    tl.fromTo(c, { fio: 0 }, { fio: 1, duration: p.dur, ease: p.ease, immediateRender: false }, t0);
    tl.to(c, vars({ fioA: 0 }, p.some.dur, p.some.ease), ctx.t({ desloc: p.some.desloc }, t0));
    tl.set(c, { fio: 0 }, ctx.t({ desloc: p.some.desloc + p.some.dur }, t0));
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// 3. aceno: ida e volta curta num eixo do objeto (o aceno no "você", o giro curto no "Agora")
export type ParamsAceno = { alvo: string; t: Tempo; eixo: "rx" | "ry" | "rz" | "y"; amp: number; ida: Mov; volta: Mov };
export const aceno: Batida<ParamsAceno> = {
  id: "aceno",
  camada: "3d",
  descricao: "O objeto vai e volta num eixo (relativo à pose do momento), com pouso de mola: aceno pra câmera ou giro curto.",
  ancoras: ["inicio"],
  padrao: { alvo: "aparelho", t: { palavra: 8 }, eixo: "rx", amp: 0.04, ida: { dur: 0.16, ease: "power2.out" }, volta: { dur: 0.32, ease: "kitPousa5" } },
  sons: { v2: [] },
  aplica(tl, st, p, ctx) {
    garanteCurvas();
    const ob = objeto(st, ctx, p.alvo);
    const t0 = ctx.t(p.t);
    const ida = p.amp >= 0 ? `+=${p.amp}` : `-=${-p.amp}`;
    const volta = p.amp >= 0 ? `-=${p.amp}` : `+=${-p.amp}`;
    tl.to(ob, vars({ [p.eixo]: ida }, p.ida.dur, p.ida.ease), t0);
    tl.to(ob, vars({ [p.eixo]: volta }, p.volta.dur, p.volta.ease), t0 + p.ida.dur);
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// 4. pose-objeto: o objeto do kit vai pra uma pose (o aparelho encara a câmera)
export type ParamsPoseObjeto = { alvo: string; t: Tempo; para: Valores; dur: number; ease: string };
export const poseObjeto: Batida<ParamsPoseObjeto> = {
  id: "pose-objeto",
  camada: "3d",
  descricao: "O objeto do kit vai pra uma pose (campos absolutos) com a curva dada.",
  ancoras: ["inicio"],
  padrao: { alvo: "aparelho", t: 0, para: {}, dur: 0.45, ease: "power2.inOut" },
  sons: { v2: [] },
  aplica(tl, st, p, ctx) {
    garanteCurvas();
    const ob = objeto(st, ctx, p.alvo);
    const t0 = ctx.t(p.t);
    tl.to(ob, vars(p.para, p.dur, p.ease), t0);
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// 5. palco-luz: halo coral, brilho do splash no chão e o tom do brilho
export type ParamsPalcoLuz = { palco: string; t: Tempo; para: Vals; dur: number; ease: string };
export const palcoLuz: Batida<ParamsPalcoLuz> = {
  id: "palco-luz",
  camada: "3d",
  descricao: "Muda a luz das vitrines: halo coral da quente, brilho da tela no chão e o tom dele (coral no splash, claro no app aberto).",
  ancoras: ["inicio"],
  padrao: { palco: PALCO, t: 0, para: {}, dur: 0.5, ease: "power2.out" },
  sons: { v2: [] },
  aplica(tl, st, p, ctx) {
    const pal = prepara(st, ctx, p.palco);
    const c = canalPalco(st, pal);
    const t0 = ctx.t(p.t);
    tl.to(c, vars(p.para, p.dur, p.ease), t0);
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// 6. exibe-objeto: troca de peça na vitrine fria. Nada atravessa o chão: o que sai encolhe no próprio pé (com uma
// antecipação de 3%, kitEncolhe) e o que entra cresce no pé e assenta (kitPousa5). A entrada só começa quando a
// saída já está no fim (sobe.desloc): as duas nunca ocupam o mesmo lugar ao mesmo tempo.
export type ParamsExibe = {
  palco: string; t: Tempo; saem: string[]; entram: string[];
  desce: Mov; sobe: Mov & { desloc: number }; escalona: number;
};
export const exibeObjeto: Batida<ParamsExibe> = {
  id: "exibe-objeto",
  camada: "3d",
  descricao: "Troca de peça na vitrine fria, no respiro entre frases: o que sai encolhe no pé (kitEncolhe) e o que entra cresce no pé e assenta (kitPousa5), depois da saída.",
  ancoras: ["inicio", "pouso"],
  padrao: { palco: PALCO, t: 0, saem: [], entram: [], desce: { dur: 0.28, ease: "kitEncolhe" }, sobe: { desloc: 0.24, dur: 0.42, ease: "kitPousa5" }, escalona: 0.06 },
  sons: {
    v2: [
      { som: "sint-s_whoosh", em: "inicio", desloc: 0, ganhoDb: -34, args: [0.3, 500, 6000] },
      { som: "sint-s_thump", em: "pouso", desloc: 0, ganhoDb: -30, args: [110, 50, 0.22] },
    ],
  },
  aplica(tl, st, p, ctx) {
    const pal = prepara(st, ctx, p.palco);
    const t0 = ctx.t(p.t);
    (p.saem || []).forEach((id, i) => {
      const c = peca(st, pal, id);
      const ti = t0 + i * p.escalona;
      tl.to(c, vars({ enc: 0 }, p.desce.dur, p.desce.ease), ti);
      tl.set(c, { vis: 0 }, ti + p.desce.dur);
    });
    let tp: number | undefined;
    (p.entram || []).forEach((id, i) => {
      const c = peca(st, pal, id);
      const ti = t0 + p.sobe.desloc + i * p.escalona;
      tl.set(c, { vis: 1, y: 0 }, ti);
      tl.fromTo(c, { enc: 0 }, { enc: 1, duration: p.sobe.dur, ease: p.sobe.ease, immediateRender: false }, ti);
      // a peça chega no tamanho final em uns 30% da curva (kitPousa5): é o pouso que o som marca
      if (i === 0) tp = ti + p.sobe.dur * 0.3;
    });
    ctx.t(t0 + p.sobe.desloc + p.sobe.dur + Math.max(0, (p.entram || []).length - 1) * p.escalona);
    ctx.som(ancoras({ inicio: t0, pouso: tp }));
  },
};

// 7. carimba: o carimbo sobe (antecipação), carimba o formulário, achata e volta com mola; as folhas tremem e a
// marca do carimbo aparece no formulário (tinta fria, em 2 quadros). Com "sai", o carimbo sobe e encolhe depois do
// impacto: a marca fica à vista e a folha carimbada fica livre pra ir pra pasta (pasta-leva)
export type ParamsCarimba = {
  palco: string; peca: string; pilha: string; t: Tempo;
  sobe: { antes: number; dur: number; altura: number; ease: string };
  desce: Mov; achata: { valor: number; dur: number }; mola: Mov; tremor: Mov;
  marca: null | { desloc: number; dur: number };
  sai: null | { t: Tempo; dur: number; altura: number; ease: string };
};
export const carimba: Batida<ParamsCarimba> = {
  id: "carimba",
  camada: "3d",
  descricao: "O carimbo sobe 2 cm, desce e carimba o formulário do topo (t = o impacto), achata e volta com mola; as folhas tremem e a marca aparece. Com 'sai', o carimbo sobe e encolhe e a marca fica à vista.",
  ancoras: ["sobe", "impacto", "sai"],
  padrao: {
    palco: PALCO, peca: "carimbo", pilha: "pilhaA", t: { palavra: 12, desloc: 0.04 },
    sobe: { antes: 0.2, dur: 0.13, altura: 0.02, ease: "power2.out" },
    desce: { dur: 0.07, ease: "power3.in" },
    achata: { valor: 0.07, dur: 0.05 },
    mola: { dur: 0.3, ease: "elastic.out(1, 0.5)" },
    tremor: { dur: 0.45, ease: "power2.out" },
    marca: { desloc: 0.005, dur: 0.07 },
    sai: null,
  },
  sons: {
    v2: [
      { som: "sint-s_swish", em: "sobe", desloc: 0, ganhoDb: -34, args: [0.24] },
      { som: "sint-s_thump", em: "impacto", desloc: 0, ganhoDb: -22, args: [150, 60, 0.3] },
      { som: "mixkit-2995", em: "impacto", desloc: 0, ganhoDb: -28, ancora: "sincronia" },
    ],
  },
  aplica(tl, st, p, ctx) {
    const pal = prepara(st, ctx, p.palco);
    const c = peca(st, pal, p.peca);
    const pi = peca(st, pal, p.pilha);
    const ti = ctx.t(p.t);
    const ts = ctx.t({ desloc: -p.sobe.antes }, ti);
    tl.to(c, vars({ sobe: p.sobe.altura }, p.sobe.dur, p.sobe.ease), ts);
    tl.to(c, vars({ sobe: 0 }, p.desce.dur, p.desce.ease), ti - p.desce.dur);
    tl.to(c, vars({ achata: p.achata.valor }, p.achata.dur, "power2.out"), ti);
    tl.to(c, vars({ achata: 0 }, p.mola.dur, p.mola.ease), ti + p.achata.dur);
    tl.fromTo(pi, { tremor: 1 }, { tremor: 0, duration: p.tremor.dur, ease: p.tremor.ease, immediateRender: false }, ti);
    if (p.marca) tl.fromTo(pi, { marca: 0 }, { marca: 1, duration: p.marca.dur, ease: "power1.out", immediateRender: false }, ti + p.marca.desloc);
    let tsai: number | undefined;
    if (p.sai) {
      tsai = ctx.t(p.sai.t, ti);
      if (!(tsai >= ti + p.achata.dur)) throw new Error(`o carimbo só pode sair depois do impacto (${tsai.toFixed(3)} s)`);
      tl.to(c, { sobe: p.sai.altura, enc: 0, duration: p.sai.dur, ease: p.sai.ease }, tsai);
      tl.set(c, { vis: 0 }, tsai + p.sai.dur);
    }
    ctx.som(ancoras({ sobe: ts, impacto: ti, sai: tsai }));
  },
};

// 8. pasta-leva ("ida ao escritório"): a folha de cima da pilha (a carimbada) sobe e entra de verdade na pasta, que
// está aberta atrás da pilha; as folhas descem pra dentro, a frente da pasta fecha girando na dobradiça (0,15 a
// 0,2 s, o mesmo modelo) e só então a pasta sai pela parede da esquerda. Tudo fora da silhueta do carimbo (ele já
// saiu no fim do carimba).
export type ParamsPastaLeva = {
  palco: string; peca: string; pilha: string | null; t: Tempo;
  voa: Mov; folhas: Mov & { desloc: number }; fecha: Mov & { desloc: number };
  sai: Mov & { desloc: number; para: Vals };
};
export const pastaLeva: Batida<ParamsPastaLeva> = {
  id: "pasta-leva",
  camada: "3d",
  descricao: "A folha carimbada sai da pilha e entra na pasta aberta; as folhas descem pra dentro, a frente fecha girando e a pasta sai pela parede da esquerda.",
  ancoras: ["inicio", "entra", "fecha", "desliza"],
  padrao: {
    palco: PALCO, peca: "pastaA", pilha: "pilhaA", t: { palavra: 14 },
    voa: { dur: 0.36, ease: "power2.inOut" },
    folhas: { desloc: 0.3, dur: 0.24, ease: "power2.in" },
    fecha: { desloc: 0.42, dur: 0.18, ease: "power2.inOut" },
    sai: { desloc: 0.62, dur: 0.46, ease: "lgSai", para: { x: -0.13, z: 0.004, ry: 0.1 } },
  },
  sons: {
    v2: [
      { som: "mixkit-1105", em: "entra", desloc: 0, ganhoDb: -30, ancora: "sincronia" },
      { som: "sint-s_thump", em: "fecha", desloc: 0, ganhoDb: -34, args: [120, 55, 0.16] },
      { som: "mixkit-1530", em: "desliza", desloc: 0, ganhoDb: -31, ancora: "sincronia" },
    ],
  },
  aplica(tl, st, p, ctx) {
    const pal = prepara(st, ctx, p.palco);
    const c = peca(st, pal, p.peca);
    const t0 = ctx.t(p.t);
    let tEntra: number | undefined;
    if (p.pilha) {
      const pi = peca(st, pal, p.pilha);
      const vp = (pal.pecas[p.pilha].opcoes || {}).voaPara;
      if (vp !== p.peca) throw new Error(`pasta-leva: a ${p.pilha} não tem opcoes.voaPara "${p.peca}" (tem ${JSON.stringify(vp)})`);
      tl.fromTo(pi, { voa: 0 }, { voa: 1, duration: p.voa.dur, ease: p.voa.ease, immediateRender: false }, t0);
      tEntra = t0 + p.voa.dur * 0.82;
    }
    tl.fromTo(c, { folhas: 0 }, { folhas: 1, duration: p.folhas.dur, ease: p.folhas.ease, immediateRender: false }, ctx.t({ desloc: p.folhas.desloc }, t0));
    const tf = ctx.t({ desloc: p.fecha.desloc }, t0);
    tl.to(c, vars({ abre: 0 }, p.fecha.dur, p.fecha.ease), tf);
    const td = ctx.t({ desloc: p.sai.desloc }, t0);
    if (td < tf + p.fecha.dur - 1e-6) ctx.avisa(`pasta-leva: a pasta sai (${td.toFixed(2)} s) antes de terminar de fechar (${(tf + p.fecha.dur).toFixed(2)} s)`);
    tl.to(c, vars(p.sai.para, p.sai.dur, p.sai.ease), td);
    tl.set(c, { vis: 0 }, ctx.t({ desloc: p.sai.dur }, td));
    ctx.som(ancoras({ inicio: t0, entra: tEntra, fecha: tf + p.fecha.dur * 0.8, desliza: td + p.sai.dur * 0.45 }));
  },
};

// 9. cartao-sai-da-tela: o cartão nasce com o recorte EXATO da vaga (mesma largura, proporção, cantos e conteúdo)
// e descola da tela no mesmo quadro em que a tela troca pra variante vazia; só no voo ele cresce e, se o cartão tem
// largura compacta, corta a sobra da direita (larg 0 a 1, já fora da tela). Pousa na frente do aparelho com um
// pouso de carimbo. Com "volta", faz o caminho contrário: volta à largura da vaga antes de entrar e termina o
// tween exatamente na caixa da vaga, no mesmo quadro em que a tela cheia volta.
export type ParamsCartaoSai = {
  palco: string; cartao: string; aparelho: string | null;
  sai: Tempo; pousa: Tempo; ease: string; arco: number;
  telaVazia: string | null;
  compacta: null | { de: number; ate: number; ease: string };
  achata: null | { valor: number; dur: number; mola: Mov };
  volta: null | { t: Tempo; dur: number; ease: string; telaCheia: string | null; extraTela?: Vals; largAte?: number };
};
export const cartaoSaiDaTela: Batida<ParamsCartaoSai> = {
  id: "cartao-sai-da-tela",
  camada: "3d",
  descricao: "O cartão (o recorte exato da vaga na tela) descola, voa em arco (crescendo e, se for compacto, cortando a sobra só no voo) e pousa na frente do aparelho com achatamento de carimbo; a tela fica com o lugar vazio. Com volta, chega na vaga do tamanho dela e a tela cheia volta no mesmo quadro.",
  ancoras: ["sai", "pousa", "volta"],
  padrao: {
    palco: PALCO, cartao: "cartaoNasceu", aparelho: null, sai: { palavra: 18 }, pousa: { palavra: 20 }, ease: "power2.inOut", arco: 0.016,
    telaVazia: "homeDia1Vazio",
    compacta: { de: 0.3, ate: 0.9, ease: "power2.inOut" },
    achata: { valor: 0.07, dur: 0.06, mola: { dur: 0.32, ease: "elastic.out(1, 0.55)" } },
    volta: null,
  },
  sons: {
    v2: [
      { som: "mixkit-3005", em: "sai", desloc: 0, ganhoDb: -27, ancora: "sincronia" },
      { som: "sint-s_thump", em: "pousa", desloc: 0, ganhoDb: -30, args: [120, 55, 0.25] },
      { som: "sint-s_pop", em: "pousa", desloc: 0, ganhoDb: -31, args: [900, 420, 0.1, 34] },
    ],
  },
  aplica(tl, st, p, ctx) {
    const pal = prepara(st, ctx, p.palco);
    const c = peca(st, pal, p.cartao);
    const ap = p.aparelho || pal.aparelho;
    const tela = telaDe(st, ap);
    const ts = ctx.t(p.sai);
    const tp = ctx.t(p.pousa, ts);
    if (!(tp > ts + 0.05)) throw new Error(`o pouso (${tp.toFixed(3)} s) precisa vir depois da saída (${ts.toFixed(3)} s)`);
    tl.set(c, { vis: 1, prende: 1, larg: 0, arco: p.arco, achata: 0 }, ts);
    if (p.telaVazia) trocaTela(tl, tela, p.telaVazia, ts, ctx);
    tl.to(c, vars({ prende: 0 }, tp - ts, p.ease), ts);
    if (p.compacta) {
      const de = Math.max(0, Math.min(1, p.compacta.de));
      const ate = Math.max(de + 0.05, Math.min(1, p.compacta.ate));
      tl.to(c, vars({ larg: 1 }, (ate - de) * (tp - ts), p.compacta.ease), ts + de * (tp - ts));
    }
    if (p.achata) {
      tl.to(c, vars({ achata: p.achata.valor }, p.achata.dur, "power2.out"), tp);
      tl.to(c, vars({ achata: 0 }, p.achata.mola.dur, p.achata.mola.ease), tp + p.achata.dur);
    }
    let tv: number | undefined;
    if (p.volta) {
      tv = ctx.t(p.volta.t, ts);
      tl.set(c, { arco: p.arco * 0.4 }, tv);
      tl.to(c, vars({ prende: 1 }, p.volta.dur, p.volta.ease), tv);
      // volta à largura da vaga antes de encostar na tela (até largAte do caminho)
      if (p.compacta) tl.to(c, vars({ larg: 0 }, p.volta.dur * Math.max(0.2, Math.min(1, typeof p.volta.largAte === "number" ? p.volta.largAte : 0.7)), "power2.inOut"), tv);
      const tf = ctx.t({ desloc: p.volta.dur }, tv);
      tl.set(c, { vis: 0, prende: 1, larg: 0 }, tf);
      if (p.volta.telaCheia) trocaTela(tl, tela, p.volta.telaCheia, tf, ctx, p.volta.extraTela);
    }
    ctx.som(ancoras({ sai: ts, pousa: tp, volta: tv }));
  },
};

// 10. cartao-contador: o cartão do imposto acende em coral, o valor conta do zero e o brilho passa no esqueleto
export type ParamsCartaoContador = {
  palco: string; cartao: string;
  brilho: { t: Tempo; dur: number; ease: string };
  contador: { t: Tempo; dur: number; ease: string };
  varreduras: Array<{ t: Tempo; dur: number }>;
  apaga: null | { t: Tempo; dur: number; ease: string };
};
export const cartaoContador: Batida<ParamsCartaoContador> = {
  id: "cartao-contador",
  camada: "tela",
  descricao: "No cartão do imposto fora da tela: acende em coral, o valor conta de R$ 0,00 até o valor de exemplo e o brilho de carregamento passa no esqueleto do botão.",
  ancoras: ["brilho", "contador"],
  padrao: {
    palco: PALCO, cartao: "cartaoImposto",
    brilho: { t: { palavra: 23 }, dur: 0.25, ease: "power2.out" },
    contador: { t: { desloc: 0 }, dur: 0.6, ease: "power3.out" },
    varreduras: [{ t: { desloc: 0.02 }, dur: 0.55 }],
    apaga: { t: { desloc: 1.1 }, dur: 0.4, ease: "power2.inOut" },
  },
  sons: {
    v2: [
      { som: "sint-s_chime", em: "brilho", desloc: 0.02, ganhoDb: -35, args: [1975.5, 0.6] },
      { som: "sint-s_conta", em: "contador", desloc: 0, ganhoDb: 0, args: ["@contador", "$contadorDur", 16] },
    ],
  },
  aplica(tl, st, p, ctx) {
    const pal = prepara(st, ctx, p.palco);
    const c = peca(st, pal, p.cartao);
    const tb = ctx.t(p.brilho.t);
    tl.to(c, vars({ brilho: 1 }, p.brilho.dur, p.brilho.ease), tb);
    const tc = ctx.t(p.contador.t, tb);
    tl.set(c, { mostraValor: 1 }, tc);
    tl.fromTo(c, { conta: 0 }, { conta: 1, duration: p.contador.dur, ease: p.contador.ease, immediateRender: false }, tc);
    for (const v of p.varreduras || []) {
      const tv = ctx.t(v.t, tb);
      tl.fromTo(c, { calc: 0 }, { calc: 1, duration: v.dur, ease: "none", immediateRender: false }, tv);
    }
    if (p.apaga) tl.to(c, vars({ brilho: 0 }, p.apaga.dur, p.apaga.ease), ctx.t(p.apaga.t, tb));
    ctx.som(ancoras({ brilho: tb, contador: tc }), { contadorDur: p.contador.dur });
  },
};

// 11. sino-toca: o sino coral de argila salta no canto de cima da vitrine quente, balança três vezes e sai
export type ParamsSino = {
  palco: string; peca: string; t: Tempo; salto: Mov & { sobe: number };
  balanco: { desloc: number; chaves: Array<[number, number, string?]> };
  sai: null | { t: Tempo; dur: number; ease: string };
};
export const sinoToca: Batida<ParamsSino> = {
  id: "sino-toca",
  camada: "3d",
  descricao: "O sino coral salta até 0,7 da escala (back.out), balança três vezes amortecido e, no fim, encolhe e sai (lgSai).",
  ancoras: ["salto", "balanco", "sai"],
  padrao: {
    palco: PALCO, peca: "sino", t: { palavra: 29 },
    salto: { dur: 0.42, ease: "back.out(1.8)", sobe: 0.012 },
    balanco: { desloc: 0.1, chaves: [[0.34, 0.12, "sine.out"], [-0.26, 0.2, "sine.inOut"], [0.16, 0.18, "sine.inOut"], [-0.08, 0.16, "sine.inOut"], [0, 0.18, "sine.inOut"]] },
    sai: { t: { palavra: 30 }, dur: 0.25, ease: "lgSai" },
  },
  sons: {
    v2: [
      { som: "sint-s_pop", em: "salto", desloc: 0, ganhoDb: -31, args: [1300, 700, 0.08, 45] },
      { som: "mixkit-766", em: "balanco", desloc: 0, ganhoDb: -27, ancora: "sincronia" },
    ],
  },
  aplica(tl, st, p, ctx) {
    const pal = prepara(st, ctx, p.palco);
    const c = peca(st, pal, p.peca);
    const t0 = ctx.t(p.t);
    tl.set(c, { vis: 1 }, t0);
    tl.fromTo(c, { s: 0.001, y: -p.salto.sobe }, { s: 1, y: 0, duration: p.salto.dur, ease: p.salto.ease, immediateRender: false }, t0);
    const tb = ctx.t({ desloc: p.balanco.desloc }, t0);
    const kf = p.balanco.chaves.map((k) => {
      const v: Record<string, unknown> = { rz: k[0], duration: k[1] };
      if (k[2]) v.ease = k[2];
      return v as gsap.TweenVars;
    });
    tl.to(c, { keyframes: kf }, tb);
    let tsai: number | undefined;
    if (p.sai) {
      tsai = ctx.t(p.sai.t, t0);
      tl.to(c, vars({ s: 0.001, y: p.salto.sobe * 0.6 }, p.sai.dur, p.sai.ease), tsai);
      tl.set(c, { vis: 0, y: 0, s: 1, rz: 0 }, tsai + p.sai.dur);
    }
    ctx.som(ancoras({ salto: t0, balanco: tb, sai: tsai }));
  },
};

// 12. toque-cartao: o esqueleto vira "Pagar agora", o botão pulsa no "só", o toque encosta no "paga", o cartão
// afunda e volta, a câmera dá um empurrão curto e o botão mostra o retorno do app (sem verde, sem "pago")
export type ParamsToqueCartao = {
  palco: string; cartao: string; palavra: number;
  revela: null | { t: Tempo; dur: number; ease: string; brilho: number };
  pulso: null | { dur: number };
  afunda: null | { desloc: number; chaves: Array<Record<string, number | string>> };
  toque: { desloc: number; dur: number };
  verif: { desloc: number; dur: number };
  anel: null | { desloc: number; dur: number };
  camera: null | { ida: { desloc: number; para: Valores; dur: number; ease: string }; volta: { desloc: number; para: Valores; dur: number; ease: string } };
};
export const toqueCartao: Batida<ParamsToqueCartao> = {
  id: "toque-cartao",
  camada: "tela",
  descricao: "No cartão do imposto fora da tela: o esqueleto vira o botão, pulso no 'só', círculo de toque e aperto no 'paga' (o cartão afunda e volta), empurrão curto da câmera e o retorno do app no botão.",
  ancoras: ["revela", "so", "toque"],
  padrao: {
    palco: PALCO, cartao: "cartaoImposto", palavra: 32,
    revela: { t: { palavra: 30 }, dur: 0.3, ease: "power2.out", brilho: 0.5 },
    pulso: { dur: 0.18 },
    afunda: { desloc: -0.05, chaves: [{ afunda: 1, dur: 0.07, ease: "power2.out" }, { afunda: 0, dur: 0.3, ease: "kitPousa5" }] },
    toque: { desloc: -0.1, dur: 0.55 },
    verif: { desloc: 0.1, dur: 0.55 },
    anel: { desloc: 0.2, dur: 0.6 },
    camera: {
      ida: { desloc: -0.04, para: { z: "-=0.02", y: "-=0.004", ty: "-=0.006", x: "+=0.005", tx: "+=0.007" }, dur: 0.2, ease: "power2.out" },
      volta: { desloc: 0.18, para: { z: "+=0.02", y: "+=0.004", ty: "+=0.006", x: "-=0.005", tx: "-=0.007" }, dur: 0.34, ease: "power2.inOut" },
    },
  },
  sons: {
    v2: [
      { som: "sint-s_tick", em: "so", desloc: 0, ganhoDb: -38, args: [2900] },
      { som: "mixkit-1109", em: "toque", desloc: -0.01, ganhoDb: -22 },
      { som: "mixkit-2867", em: "toque", desloc: 0.12, ganhoDb: -26, transpor: "trilha" },
    ],
  },
  aplica(tl, st, p, ctx) {
    const pal = prepara(st, ctx, p.palco);
    const c = peca(st, pal, p.cartao);
    if (!(typeof p.palavra === "number" && p.palavra >= 1)) throw new Error('toque-cartao precisa de "palavra" >= 1 (o "só" é a palavra anterior)');
    const tt = ctx.W(p.palavra);
    const so = ctx.W(p.palavra - 1);
    let tr: number | undefined;
    if (p.revela) {
      tr = ctx.t(p.revela.t);
      tl.to(c, vars({ revela: 1 }, p.revela.dur, p.revela.ease), tr);
      tl.fromTo(c, { brilhoBotao: 0 }, { brilhoBotao: 1, duration: p.revela.brilho, ease: "none", immediateRender: false }, tr + p.revela.dur * 0.5);
    }
    if (p.pulso) tl.fromTo(c, { pulso: 0 }, { pulso: 1, duration: p.pulso.dur, ease: "none", immediateRender: false }, so);
    if (p.afunda) {
      const kf = p.afunda.chaves.map((k) => {
        const v: Record<string, unknown> = {};
        for (const q of Object.keys(k)) if (q !== "dur" && q !== "ease") v[q] = k[q];
        v.duration = k.dur;
        if (k.ease !== undefined) v.ease = k.ease;
        return v as gsap.TweenVars;
      });
      tl.to(c, { keyframes: kf }, ctx.t({ desloc: p.afunda.desloc }, tt));
    }
    tl.fromTo(c, { toque: 0 }, { toque: 1, duration: p.toque.dur, ease: "none", immediateRender: false }, ctx.t({ desloc: p.toque.desloc }, tt));
    tl.fromTo(c, { verif: 0 }, { verif: 1, duration: p.verif.dur, ease: "none", immediateRender: false }, ctx.t({ desloc: p.verif.desloc }, tt));
    if (p.anel) tl.fromTo(c, { anel: 0 }, { anel: 1, duration: p.anel.dur, ease: "none", immediateRender: false }, ctx.t({ desloc: p.anel.desloc }, tt));
    if (p.camera) {
      tl.to(st.cam, vars(p.camera.ida.para, p.camera.ida.dur, p.camera.ida.ease), ctx.t({ desloc: p.camera.ida.desloc }, tt));
      tl.to(st.cam, vars(p.camera.volta.para, p.camera.volta.dur, p.camera.volta.ease), ctx.t({ desloc: p.camera.volta.desloc }, tt));
    }
    ctx.som(ancoras({ revela: tr, so, toque: tt }));
  },
};

// 13. fileira-fora-do-padrao: a fileira de placas sai da tela já formada; uma placa salta pra fora dela
export type ParamsFileira = {
  palco: string; placas: string[]; sai: { t: Tempo; dur: number; escalona: number; ease: string };
  salto: null | { t: Tempo; indice: number; dur: number; ease: string };
};
export const fileiraForaDoPadrao: Batida<ParamsFileira> = {
  id: "fileira-fora-do-padrao",
  camada: "3d",
  descricao: "Quatro placas de documento (papel com barras de esqueleto, sem texto) saem da tela já em fileira; depois que ela assenta, uma placa salta pra fora, sobe e gira (sem cor de alerta).",
  ancoras: ["inicio", "salto"],
  padrao: {
    palco: PALCO, placas: ["placa1", "placa2", "placa3", "placa4"],
    sai: { t: { palavra: 33, desloc: 0.04 }, dur: 0.3, escalona: 0.03, ease: "power2.out" },
    salto: { t: { palavra: 35, desloc: 0.14 }, indice: 2, dur: 0.34, ease: "back.out(1.6)" },
  },
  sons: {
    v2: [
      { som: "sint-s_bubble", em: "inicio", desloc: 0, ganhoDb: -30 },
      { som: "sint-s_bubble", em: "inicio", desloc: 0.03, ganhoDb: -31 },
      { som: "sint-s_bubble", em: "inicio", desloc: 0.06, ganhoDb: -32 },
      { som: "sint-s_pop", em: "salto", desloc: 0, ganhoDb: -28, args: [500, 900, 0.12, 30] },
    ],
  },
  aplica(tl, st, p, ctx) {
    const pal = prepara(st, ctx, p.palco);
    const t0 = ctx.t(p.sai.t);
    p.placas.forEach((id, i) => {
      const c = peca(st, pal, id);
      const ti = t0 + i * p.sai.escalona;
      tl.set(c, { vis: 1, prende: 1, salto: 0 }, ti);
      tl.to(c, vars({ prende: 0 }, p.sai.dur, p.sai.ease), ti);
    });
    let ts: number | undefined;
    if (p.salto) {
      const id = p.placas[p.salto.indice];
      if (!id) throw new Error(`salto.indice ${p.salto.indice} fora da fileira (${p.placas.length} placas)`);
      ts = ctx.t(p.salto.t, t0);
      const fim = t0 + (p.placas.length - 1) * p.sai.escalona + p.sai.dur;
      if (ts < fim - 1e-6) ctx.avisa(`a placa salta em ${ts.toFixed(2)} s, antes de a fileira assentar (${fim.toFixed(2)} s)`);
      tl.to(peca(st, pal, id), vars({ salto: 1 }, p.salto.dur, p.salto.ease), ts);
    }
    ctx.som(ancoras({ inicio: t0, salto: ts }));
  },
};

// 14. peca-move: movimento secundário de uma peça (a lupa desliza devagar sobre a pilha)
export type ParamsPecaMove = { palco: string; peca: string; t: Tempo; para: Vals; dur: number; ease: string };
export const pecaMove: Batida<ParamsPecaMove> = {
  id: "peca-move",
  camada: "3d",
  descricao: "Uma peça do palco vai pra outros deslocamentos (x, y, z, rx, ry, rz, s), com calma: ação secundária do lado frio.",
  ancoras: ["inicio"],
  padrao: { palco: PALCO, peca: "lupa", t: 0, para: {}, dur: 0.9, ease: "sine.inOut" },
  sons: { v2: [] },
  aplica(tl, st, p, ctx) {
    const pal = prepara(st, ctx, p.palco);
    const c = peca(st, pal, p.peca);
    const t0 = ctx.t(p.t);
    tl.to(c, vars(p.para, p.dur, p.ease), t0);
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// 15. moeda-pessoa: a moeda coral com o sinal de pessoa sem rosto sai rolando da tela por cima da fileira, gira no
// ar e pousa em pé à esquerda dela ("gente"), chegando com velocidade (kitChega): o pouso e o som caem no toque. No
// "contador" ela dá um pulinho até a placa que fugiu, a placa volta pra fileira com pouso (kitPousa5, o som no
// assentar) e ganha a pílula "Entregue" do app; a fileira faz uma onda. No "CRC", brilho curto com duas faíscas
export type ParamsMoeda = {
  palco: string; moeda: string; placas: string[]; placa: string; faiscas: string[];
  rola: { t: Tempo; ease: string };
  pousa: { t: Tempo; achata: number };
  giro: { voltas: number; ease: string };
  encosta: null | { t: Tempo; para: Vals; dur: number; volta: Mov; placa: Mov; entregue: null | { desloc: number; dur: number } };
  onda: null | { amp: number; escalona: number; dur: number };
  brilho: null | { t: Tempo; dur: number };
};
export const moedaPessoa: Batida<ParamsMoeda> = {
  id: "moeda-pessoa",
  camada: "3d",
  descricao: "A moeda com o sinal de pessoa sai rolando da tela, gira no ar e pousa em pé à esquerda da fileira; depois dá um pulinho até a placa que fugiu, a placa volta pra fileira (onda) com a pílula 'Entregue', e a moeda ganha um brilho curto.",
  ancoras: ["rola", "pouso", "encosta", "assenta", "brilho"],
  padrao: {
    palco: PALCO, moeda: "moeda", placas: ["placa1", "placa2", "placa3", "placa4"], placa: "placa3", faiscas: ["faisca1", "faisca2"],
    rola: { t: { palavra: 37, desloc: 0.05 }, ease: "kitChega" },
    pousa: { t: { palavra: 40 }, achata: 0.1 },
    giro: { voltas: 1, ease: "power2.in" },
    encosta: {
      t: { palavra: 44 }, para: { x: 0.009, y: -0.0045, z: 0.002 }, dur: 0.17, volta: { dur: 0.34, ease: "kitPousa5" },
      placa: { dur: 0.4, ease: "kitPousa5" }, entregue: { desloc: 0.06, dur: 0.24 },
    },
    onda: { amp: 0.0045, escalona: 0.045, dur: 0.34 },
    brilho: { t: { palavra: 48 }, dur: 0.5 },
  },
  sons: {
    v2: [
      { som: "mixkit-2641", em: "rola", desloc: 0, ganhoDb: -30, ancora: "sincronia" },
      { som: "sint-s_chime", em: "pouso", desloc: 0, ganhoDb: -34, args: [2093.0, 0.35] },
      { som: "sint-s_thump", em: "pouso", desloc: 0, ganhoDb: -32, args: [120, 55, 0.2] },
      { som: "sint-s_swish", em: "encosta", desloc: 0, ganhoDb: -36, args: [0.2] },
      { som: "mixkit-1120", em: "assenta", desloc: 0, ganhoDb: -30, ancora: "sincronia" },
      { som: "sint-s_brilho", em: "brilho", desloc: 0, ganhoDb: -38, args: [0.5] },
    ],
  },
  aplica(tl, st, p, ctx) {
    const pal = prepara(st, ctx, p.palco);
    const m = peca(st, pal, p.moeda);
    const tr = ctx.t(p.rola.t);
    const tp = ctx.t(p.pousa.t, tr);
    if (!(tp > tr + 0.2)) throw new Error(`o pouso da moeda (${tp.toFixed(3)} s) precisa vir pelo menos 0,2 s depois da rolagem (${tr.toFixed(3)} s)`);
    tl.set(m, { vis: 1, k: 0, giro: 0 }, tr);
    tl.to(m, vars({ k: 1 }, tp - tr, p.rola.ease), tr);
    // giro no ar: a moeda dá a volta em y no voo e termina junto com o pouso (chega de frente, ainda girando)
    tl.to(m, vars({ giro: p.giro.voltas }, (tp - tr) * 0.75, p.giro.ease), tp - (tp - tr) * 0.75);
    tl.to(m, vars({ sy: 1 - p.pousa.achata }, 0.05, "power2.out"), tp);
    tl.to(m, vars({ sy: 1 }, 0.3, "elastic.out(1, 0.5)"), tp + 0.05);
    let te: number | undefined;
    let ta: number | undefined;
    if (p.encosta) {
      const en = p.encosta;
      te = ctx.t(en.t, tr);
      const pl = peca(st, pal, p.placa);
      // o pulinho até a placa (vai e volta pro lugar com pouso)
      const ida: Vals = {};
      const volta: Vals = {};
      for (const k of Object.keys(en.para)) {
        ida[k] = en.para[k];
        volta[k] = 0;
      }
      tl.to(m, vars(ida, en.dur, "power2.out"), te);
      tl.to(m, vars(volta, en.volta.dur, en.volta.ease), te + en.dur);
      // a placa volta pra fileira no toque e assenta com pouso: o som cai quando ela chega (30% do kitPousa5)
      const tPl = te + en.dur * 0.85;
      tl.to(pl, vars({ salto: 0 }, en.placa.dur, en.placa.ease), tPl);
      const tAssenta = tPl + en.placa.dur * 0.3;
      ta = tAssenta;
      if (en.entregue) tl.fromTo(pl, { entregue: 0 }, { entregue: 1, duration: en.entregue.dur, ease: "none", immediateRender: false }, tAssenta + en.entregue.desloc);
      const onda = p.onda;
      if (onda) {
        p.placas.forEach((id, i) => {
          const c = peca(st, pal, id);
          const ti = tAssenta + 0.02 + i * onda.escalona;
          tl.to(c, { keyframes: [{ y: onda.amp, duration: onda.dur * 0.4, ease: "power2.out" }, { y: 0, duration: onda.dur * 0.6, ease: "kitPousa5" }] }, ti);
        });
      }
    }
    let tb: number | undefined;
    if (p.brilho) {
      const br = p.brilho;
      const tBrilho = ctx.t(br.t, tr);
      tb = tBrilho;
      tl.to(m, { keyframes: [{ brilho: 1, duration: br.dur * 0.35, ease: "power2.out" }, { brilho: 0, duration: br.dur * 0.65, ease: "power2.in" }] }, tBrilho);
      p.faiscas.forEach((id, i) => {
        const f = peca(st, pal, id);
        const ti = tBrilho + i * 0.06;
        tl.set(f, { vis: 1 }, ti);
        tl.fromTo(f, { k: 0 }, { k: 1, duration: 0.5, ease: "none", immediateRender: false }, ti);
        tl.set(f, { vis: 0, k: 0 }, ti + 0.5);
      });
    }
    ctx.som(ancoras({ rola: tr, pouso: tp, encosta: te, assenta: ta, brilho: tb }));
  },
};

// 16. volta-pra-tela: placas e moeda voltam pra tela (no respiro antes da troca de tela)
export type ParamsVoltaTela = { palco: string; placas: string[]; moeda: string | null; t: Tempo; dur: number; escalona: number; ease: string };
export const voltaPraTela: Batida<ParamsVoltaTela> = {
  id: "volta-pra-tela",
  camada: "3d",
  descricao: "As placas (e a moeda, pelo caminho de volta) entram de novo na tela do aparelho, escalonadas, e somem.",
  ancoras: ["inicio"],
  padrao: { palco: PALCO, placas: ["placa1", "placa2", "placa3", "placa4"], moeda: "moeda", t: 0, dur: 0.26, escalona: 0.03, ease: "power2.in" },
  sons: { v2: [{ som: "sint-s_swish", em: "inicio", desloc: 0.02, ganhoDb: -36, args: [0.24] }] },
  aplica(tl, st, p, ctx) {
    const pal = prepara(st, ctx, p.palco);
    const t0 = ctx.t(p.t);
    p.placas.forEach((id, i) => {
      const c = peca(st, pal, id);
      const ti = t0 + i * p.escalona;
      tl.to(c, vars({ prende: 1, salto: 0, entregue: 0 }, p.dur, p.ease), ti);
      tl.set(c, { vis: 0 }, ti + p.dur);
    });
    if (p.moeda) {
      const m = peca(st, pal, p.moeda);
      const ti = t0 + p.placas.length * p.escalona;
      tl.to(m, vars({ k: 0, giro: 0 }, p.dur + 0.06, p.ease), ti);
      tl.set(m, { vis: 0 }, ti + p.dur + 0.06);
    }
    ctx.t(t0 + p.placas.length * p.escalona + p.dur + 0.06);
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// 17. funde-vitrines: o vão fecha, a vitrine fria esquenta até o tom da quente e as duas viram um painel só; o
// aparelho e a pasta vêm pro meio e a pasta encosta inclinada na quina do aparelho ("cuidado")
export type ParamsFunde = {
  palco: string; t: Tempo; dur: number; ease: string;
  aparelho: null | { alvo: string; para: Valores; dur: number; ease: string };
  pasta: null | { peca: string; para: Vals; desloc: number; dur: number; ease: string };
};
export const fundeVitrines: Batida<ParamsFunde> = {
  id: "funde-vitrines",
  camada: "3d",
  descricao: "O vão entre as vitrines fecha, a fria esquenta até o tom da quente e as duas viram um painel só; o aparelho e a pasta vêm pro meio e a pasta encosta inclinada na quina do aparelho.",
  ancoras: ["inicio", "encosta"],
  padrao: {
    palco: PALCO, t: { palavra: 51 }, dur: 0.7, ease: "power2.inOut",
    aparelho: { alvo: "aparelho", para: { x: 0.03 }, dur: 0.7, ease: "power2.inOut" },
    pasta: { peca: "pastaC", para: { x: 0.04, rz: -0.3, ry: 0.12 }, desloc: 0.02, dur: 0.5, ease: "kitPousa5" },
  },
  sons: {
    v2: [
      { som: "sint-s_whoosh", em: "inicio", desloc: 0, ganhoDb: -30, args: [0.6, 300, 5000] },
      { som: "sint-s_thump", em: "encosta", desloc: 0, ganhoDb: -29, args: [110, 50, 0.22] },
    ],
  },
  aplica(tl, st, p, ctx) {
    const pal = prepara(st, ctx, p.palco);
    const c = canalPalco(st, pal);
    const t0 = ctx.t(p.t);
    tl.to(c, vars({ fusao: 1, aquece: 1 }, p.dur, p.ease), t0);
    if (p.aparelho) tl.to(objeto(st, ctx, p.aparelho.alvo) as ObjSt, vars(p.aparelho.para, p.aparelho.dur, p.aparelho.ease), t0);
    let te: number | undefined;
    if (p.pasta) {
      const pa = peca(st, pal, p.pasta.peca);
      const tp = ctx.t({ desloc: p.pasta.desloc }, t0);
      tl.to(pa, vars(p.pasta.para, p.pasta.dur, p.pasta.ease), tp);
      te = tp + p.pasta.dur * 0.3;
    }
    ctx.t(t0 + p.dur);
    ctx.som(ancoras({ inicio: t0, encosta: te }));
  },
};

// 18. aproxima: a câmera aproxima devagar ("o app que tá chegando")
export type ParamsAproxima = { t: Tempo; para: Valores; dur: number; ease: string; riser: null | { t: Tempo } };
export const aproxima: Batida<ParamsAproxima> = {
  id: "aproxima",
  camada: "3d",
  descricao: "Só câmera: recentra no painel único e aproxima devagar (power2.inOut); o riser acaba na palavra pedida.",
  ancoras: ["inicio", "riser"],
  padrao: { t: { palavra: 52 }, para: {}, dur: 1.4, ease: "power2.inOut", riser: { t: { palavra: 57, desloc: -0.32 } } },
  sons: { v2: [{ som: "sint-s_riser", em: "riser", desloc: 0, ganhoDb: -32, args: [0.5, 420, 1250] }] },
  aplica(tl, st, p, ctx) {
    const t0 = ctx.t(p.t);
    ctx.t(t0 + p.dur);
    tl.to(st.cam, vars(p.para, p.dur, p.ease), t0);
    const tr = p.riser ? ctx.t(p.riser.t, t0) : undefined;
    ctx.som(ancoras({ inicio: t0, riser: tr }));
  },
};

// 19. pasta-endireita: no "prefere", a pasta se endireita e fica em pé ao lado do aparelho (sem sair do painel)
export type ParamsEndireita = { palco: string; peca: string; t: Tempo; para: Vals; dur: number; ease: string };
export const pastaEndireita: Batida<ParamsEndireita> = {
  id: "pasta-endireita",
  camada: "3d",
  descricao: "A pasta encostada na quina do aparelho se endireita e fica em pé ao lado dele, encostada de leve: os dois jeitos juntos no painel.",
  ancoras: ["inicio", "pousa"],
  padrao: { palco: PALCO, peca: "pastaC", t: { palavra: 60 }, para: { rz: 0, ry: 0.14, x: 0.046 }, dur: 0.45, ease: "kitPousa5" },
  sons: { v2: [{ som: "sint-s_thump", em: "pousa", desloc: 0, ganhoDb: -33, args: [110, 50, 0.18] }] },
  aplica(tl, st, p, ctx) {
    const pal = prepara(st, ctx, p.palco);
    const c = peca(st, pal, p.peca);
    const t0 = ctx.t(p.t);
    tl.to(c, vars(p.para, p.dur, p.ease), t0);
    ctx.som(ancoras({ inicio: t0, pousa: t0 + p.dur * 0.3 }));
  },
};

// 20. palco-fecha: no fecho, o painel único encolhe e some no papel junto com o aparelho. As peças pedidas (a
// pasta) ficam presas ao painel: o mesmo centro (o ponto do símbolo), a mesma curva de escala e a mesma opacidade
// (o render faz a conta no plano de cada peça, pela câmera do quadro). Nada anda sozinho nem fica no papel.
export type ParamsPalcoFecha = { palco: string; t: Tempo; dur: number; ease: string; centro: [number, number]; pecas: string[] };
export const palcoFecha: Batida<ParamsPalcoFecha> = {
  id: "palco-fecha",
  camada: "fecho",
  descricao: "O painel único encolhe até o ponto do símbolo do logo e some no papel; as peças pedidas ficam presas a ele (mesmo centro, mesma escala e mesma opacidade).",
  ancoras: ["inicio"],
  padrao: { palco: PALCO, t: { fecho: -0.4 }, dur: 0.4, ease: "power3.in", centro: [410, 818], pecas: ["pastaC"] },
  sons: { v2: [] },
  aplica(tl, st, p, ctx) {
    const pal = prepara(st, ctx, p.palco);
    const c = canalPalco(st, pal);
    const t0 = ctx.t(p.t);
    tl.set(c, { ex: p.centro[0], ey: p.centro[1] }, t0);
    tl.to(c, vars({ escala: 0.001, alfa: 0, brilho: 0, halo: 0 }, p.dur, p.ease), t0);
    for (const id of p.pecas || []) {
      const pc = peca(st, pal, id);
      tl.set(pc, { painel: 1 }, t0);
      // a argila escura pesa mais que o painel claro na mesma opacidade: some com a mesma curva, 12% antes
      tl.to(pc, vars({ alfa: 0 }, p.dur * 0.88, p.ease), t0);
      tl.set(pc, { vis: 0, painel: 0, alfa: 1 }, t0 + p.dur);
    }
    ctx.t(t0 + p.dur);
    ctx.som(ancoras({ inicio: t0 }));
  },
};

// 21. vitrine-palco: no fim do loop, as vitrines crescem de novo a partir do centro (fria à esquerda, quente à
// direita) e o conjunto da capa sobe na fria; todos os canais voltam pro quadro 0
export type ParamsVitrinePalco = {
  palco: string; t: Tempo; cresce: Mov & { centro: [number, number] };
  entram: string[]; sobe: Mov & { desloc: number; escalona: number };
};
export const vitrinePalco: Batida<ParamsVitrinePalco> = {
  id: "vitrine-palco",
  camada: "3d",
  descricao: "Volta do loop: as vitrines crescem do centro e o conjunto da capa sobe na vitrine fria; cada canal do palco e das peças volta pro valor do quadro 0.",
  ancoras: ["inicio", "pouso"],
  padrao: {
    palco: PALCO, t: { fim: -0.95 }, cresce: { dur: 0.6, ease: "power3.out", centro: [540, 1180] },
    entram: ["pilhaA", "despP"], sobe: { desloc: 0.16, dur: 0.45, escalona: 0.08, ease: "kitPousa5" },
  },
  sons: { v2: [] },
  aplica(tl, st, p, ctx) {
    const pal = prepara(st, ctx, p.palco);
    const c = canalPalco(st, pal);
    const t0 = ctx.t(p.t);
    const ini: Vals = { ...CANAIS_PALCO };
    // o painel nasce no centro, já com o tom do quadro 0 (frio de um lado, quente do outro)
    tl.set(c, { ...ini, escala: 0.001, ex: p.cresce.centro[0], ey: p.cresce.centro[1] }, t0);
    tl.to(c, vars({ escala: 1 }, p.cresce.dur, p.cresce.ease), t0);
    tl.set(c, { ex: ini.ex, ey: ini.ey }, t0 + p.cresce.dur);
    // peças: tudo no estado do quadro 0 (com o estado da cena), menos as que entram (que crescem no pé até o
    // repouso, sem atravessar o chão)
    for (const id of Object.keys(pal.pecas)) {
      const def = pal.pecas[id];
      const v = inicialPeca(def, estadoDaCena(pal, id));
      const pc = canalDe(st, P + id);
      const entra = (p.entram || []).indexOf(id) >= 0;
      if (entra) tl.set(pc, { ...v, vis: 0, enc: 0 }, t0);
      else tl.set(pc, v, t0);
    }
    let tp: number | undefined;
    (p.entram || []).forEach((id, i) => {
      const pc = peca(st, pal, id);
      const ti = t0 + p.sobe.desloc + i * p.sobe.escalona;
      tl.set(pc, { vis: 1 }, ti);
      tl.fromTo(pc, { enc: 0 }, { enc: 1, duration: p.sobe.dur, ease: p.sobe.ease, immediateRender: false }, ti);
      if (i === 0) tp = ti + p.sobe.dur * 0.3;
    });
    const fim = t0 + Math.max(p.cresce.dur, p.sobe.desloc + Math.max(0, (p.entram || []).length - 1) * p.sobe.escalona + p.sobe.dur);
    if (fim > ctx.dur - 1 / ctx.fps + 1e-6) ctx.avisa(`as vitrines só assentam em ${fim.toFixed(3)} s, depois do último quadro (${(ctx.dur - 1 / ctx.fps).toFixed(3)} s): o loop não emenda`);
    ctx.som(ancoras({ inicio: t0, pouso: tp }));
  },
};

// 22. pilula-comenta (2D): a pílula "Comenta aí" (com o balão do carrossel) entra embaixo do logo e sai com ele
export type ParamsPilula = { camada: string; t: Tempo; dur: number; ease: string; sai: null | { t: Tempo; dur: number; ease: string } };
export const pilulaComenta: Batida<ParamsPilula> = {
  id: "pilula-comenta",
  camada: "fecho",
  descricao: "A pílula coral 'Comenta aí' com o ícone de balão entra embaixo do logo (lgEntra) e sai junto com a assinatura (lgSai).",
  ancoras: ["inicio", "sai"],
  padrao: { camada: "comenta", t: { fecho: 0.3 }, dur: 0.45, ease: "lgEntra", sai: { t: { fecho: 1.95 }, dur: 0.3, ease: "lgSai" } },
  sons: { v2: [{ som: "pixabay-316482", em: "inicio", desloc: 0, ganhoDb: -28 }] },
  aplica(tl, st, p, ctx) {
    const def = (ctx.props.camadas || []).filter((x) => x.id === p.camada)[0];
    if (!def) throw new Error(`camada citada não existe: ${nomeDe(p.camada)}`);
    if (def.tipo !== "pilula-comenta") throw new Error(`a camada ${nomeDe(p.camada)} é do tipo ${nomeDe(def.tipo)}; esta batida pede uma pilula-comenta`);
    const c = garante(canalDe(st, p.camada), { k: 0 });
    const t0 = ctx.t(p.t);
    tl.to(c, vars({ k: 1 }, p.dur, p.ease), t0);
    let ts: number | undefined;
    if (p.sai) {
      ts = ctx.t(p.sai.t, t0);
      tl.to(c, vars({ k: 0 }, p.sai.dur, p.sai.ease), ts);
    }
    ctx.som(ancoras({ inicio: t0, sai: ts }));
  },
};

// ---------- registro (seção 4.10) ----------
const LISTA: Array<Batida<any>> = [
  vitrineLuz, vitrineFio, aceno, poseObjeto, palcoLuz, exibeObjeto, carimba, pastaLeva, cartaoSaiDaTela, cartaoContador,
  sinoToca, toqueCartao, fileiraForaDoPadrao, pecaMove, moedaPessoa, voltaPraTela, fundeVitrines, aproxima, pastaEndireita,
  palcoFecha, vitrinePalco, pilulaComenta,
];

export const batidas: Record<string, Batida<any>> = {};
for (const b of LISTA) batidas[b.id] = b;

/** metadados da camada 2D (o Node valida as camadas da cena por aqui) */
export const camadas: Record<string, { descricao: string; params: Record<string, unknown>; canais: string[] }> = {
  "pilula-comenta": {
    descricao: "Pílula coral (#DD4E27, Sora 800 branca) com o ícone de balão em contorno branco antes do texto, a do fecho do carrossel; centrada em x, com o topo em 'top'.",
    params: { texto: "Comenta aí", top: 968, tamanho: 36, cor: "#DD4E27" },
    canais: ["k (0 fora, 1 no lugar)"],
  },
};
