// Extensão "precificacao" do kit de motion: as camadas 2D (dono K14; contrato: KIT/DESENHO.md, seções 4.10 e 5).
// Cada camada "p2d-<Nome>" embrulha o componente EXPORTADO de RM/src/motion/kit.tsx com o mesmo nome, só
// importando (o código do componente não é copiado): os params da camada são as props do componente, e o
// movimento vem de st.canais[id] (o batidas.ts anima; aqui só se lê). A posição usa o At do próprio kit.tsx.
// Mais três camadas do kit:
// - p2d-grupo: uma cena 2D que junta camadas (as que têm "grupo" com o id dela), com o fundo (Bg) opcional, a
//   câmera do Motion.tsx (escala, rotação e deslocamento com mola e tremida somadas, origem 50% 58%) e o estilo
//   das transições (transicoes.ts, o Scene do Motion.tsx) e dos cortes (cortes.ts, o trOf do Broll.tsx);
// - p2d-legenda: a legenda do kit (LegendaApple do K06) desenhada de novo por cima das camadas, com modo por
//   frase e, opcional, o fecho e o LINK DA BIO (o KitMotion desenha as camadas por cima da legenda e do fecho);
// - p2d-Bg solto (fundo de tela cheia, z 0).
// Ordem de pintura: Bg solto no z 0, grupos no z 10 + 2 por ordem (100 na saída em zoom), camadas soltas no z 150
// e a p2d-legenda no z 200 (os mesmos degraus do Motion.tsx e do Broll.tsx).
// Sem efeito colateral no import: só constantes, funções e componentes.
import React from "react";
import { AbsoluteFill } from "remotion";
import {
  AlarmClock, At, Bg, BigArrow, Bubble, Calendar, Check, ClayCard, CommentIcon, Confetti, Eye, HangTag, NumDot, Numeral,
  Padlock, Phone, Pill, Rays, Sparkle, Stamp, Sticker, TetoCard, YearOdo,
} from "../../../motion/kit";
import type { BgKind } from "../../../motion/kit";
import { FONT } from "../../../lib/tl";
import { frequencia } from "../../nucleo/pose";
import type { CamadaProps, Estado, PropsKit } from "../../nucleo/tipos";
import { Fecho } from "../../render/Fecho";
import { LegendaApple, type ModoLegenda } from "../../render/LegendaApple";
import { LinkBio } from "../../render/LinkBio";
import type { CamadaExtensao, RenderExtensao } from "../../render/tipos-render";
import { Ampulheta, Bilhete, Construcao, Cursor, Empresa, Entardecer, Fila, Navegador, Perfil, RelogioTarde, Telefone } from "./sufoco";
import { LinhaDescendo, type Chave, type ParamsLinha } from "./linha";
import { COMPONENTES, COMPONENTES_SUFOCO, CONFETE_PADRAO, FUNDOS, MODOS_LEGENDA, PREFIXO, REPOUSO, TIPO_GRUPO, TIPO_LEGENDA, grupoDe } from "./batidas";
import { CLARAO, TIPOS_CORTE, estiloCorteEntrada, estiloCorteSaida, loopEntrada, loopSaida } from "./cortes";
import { IRIS_PADRAO, TIPOS_TRANSICAO, estiloCamera, estiloEntrada, estiloSaida, type Estilo } from "./transicoes";

type Canal = Record<string, number>;
type PropsCamada = { id: string; st: Estado; props: PropsKit; t: number };
type PropsDentro = PropsCamada & { dentro?: boolean; nivel?: number };

const num = (x: unknown, p: number) => (typeof x === "number" && isFinite(x) ? x : p);
const txt = (x: unknown, p: string) => (typeof x === "string" && x ? x : p);
const opcNum = (x: unknown) => (typeof x === "number" && isFinite(x) ? x : undefined);
const opcTxt = (x: unknown) => (typeof x === "string" && x ? x : undefined);
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const css = (e: Estilo) => e as unknown as React.CSSProperties;

/** profundidade máxima de grupos dentro de grupos (a conferência das batidas já recusa círculo) */
const NIVEL_MAX = 6;

function defDe(props: PropsKit, id: string): CamadaProps | null {
  return (props.camadas || []).filter((c) => c.id === id)[0] || null;
}

/** canal com o valor de repouso (o mesmo do batidas.ts) quando a cena ainda não animou */
function valor(c: Canal, k: string): number {
  return num(c[k], num(REPOUSO[k], 0));
}

/** soma dos canais da mola e da tremida de uma base ("s~1" + "s~2"...) */
export function soma(c: Canal, base: string): number {
  let s = 0;
  const pref = `${base}~`;
  for (const k of Object.keys(c)) if (k.indexOf(pref) === 0 && typeof c[k] === "number") s += c[k];
  return s;
}

function fundoDe(x: unknown): BgKind | null {
  return typeof x === "string" && FUNDOS.indexOf(x) >= 0 ? (x as BgKind) : null;
}

/** balanço senoidal da camada (flutua {amp, freq, fase, eixo}); no modo periódico a frequência fecha o loop */
function flutuacao(def: CamadaProps, t: number, props: PropsKit): { x: number; y: number; rot: number } {
  const r = { x: 0, y: 0, rot: 0 };
  const f = def.flutua as Record<string, unknown> | undefined;
  if (!f || typeof f !== "object") return r;
  const amp = num(f.amp, 0);
  if (!amp) return r;
  const w = frequencia(num(f.freq, 2.4), !!(props.ambiente && props.ambiente.periodico), props.duracao);
  const v = amp * Math.sin(w * t + num(f.fase, 0));
  const eixo = f.eixo === "x" || f.eixo === "rot" ? f.eixo : "y";
  r[eixo] = v;
  return r;
}

/** posição, escala, rotação e desfoque da camada: params + canais + mola/tremida + balanço */
function transformacao(def: CamadaProps, c: Canal, t: number, props: PropsKit) {
  const fl = flutuacao(def, t, props);
  const giro = num(def.giro, 0);
  return {
    x: num(def.x, 540) + valor(c, "x") + soma(c, "x") + fl.x,
    y: num(def.y, 960) + valor(c, "y") + soma(c, "y") + fl.y,
    sc: num(def.s, 1) * valor(c, "s") * (1 + soma(c, "s")),
    rot: num(def.rot, 0) + valor(c, "rot") + soma(c, "rot") + giro * t + fl.rot,
    blur: valor(c, "blur") || num(def.blur, 0),
    origem: txt(def.origem, "50% 50%"),
  };
}

/** caixa de texto da p2d-At (o "sinais" e o "mais caro" do gancho do Motion.tsx) */
function caixaTexto(def: CamadaProps): React.CSSProperties {
  return {
    fontFamily: FONT,
    fontWeight: num(def.peso, 800),
    fontSize: num(def.tamanho, 96),
    lineHeight: num(def.altura, 1),
    color: txt(def.cor, "#1B1E24"),
    letterSpacing: txt(def.espacamento, "-0.03em"),
    whiteSpace: def.quebra === true ? "normal" : "nowrap",
    textAlign: "center",
    maxWidth: opcNum(def.largura),
    background: opcTxt(def.fundo),
    borderRadius: opcNum(def.raio),
    padding: opcTxt(def.padding),
    boxShadow: opcTxt(def.sombra),
    textShadow: opcTxt(def.sombraTexto),
  };
}

/** o componente do kit.tsx de cada tipo, com os params da camada e os canais do quadro */
function desenha(def: CamadaProps, c: Canal, t: number): React.ReactNode {
  switch (def.tipo) {
    case "p2d-At":
      return <div style={caixaTexto(def)}>{txt(def.texto, "")}</div>;
    case "p2d-Numeral":
      return <Numeral n={num(def.n, 1)} size={opcNum(def.size)} color={opcTxt(def.color)} outline={def.outline === true} />;
    case "p2d-Sticker":
      return <Sticker icon={txt(def.icon, "lampada")} d={num(def.d, 230)} pad={opcNum(def.pad)} ring={opcTxt(def.ring)} />;
    case "p2d-ClayCard":
      return <ClayCard seq={def.seq === "calculo" ? "calculo" : "cadastro"} frame={valor(c, "frame")} size={num(def.size, 600)} />;
    case "p2d-Bubble":
      return <Bubble text={txt(def.text, "")} side={def.side === "r" ? "r" : "l"} w={opcNum(def.w)} />;
    case "p2d-Calendar": {
      const dur = num(def.dur, 0.5);
      return <Calendar month={txt(def.month, "OUT")} t={clamp01(valor(c, "acende")) * (dur + 0.14)} t0={0} dur={dur} />;
    }
    case "p2d-Stamp":
      return <Stamp text={txt(def.text, "")} />;
    case "p2d-HangTag":
      return <HangTag hole={opcTxt(def.hole)} />;
    case "p2d-Padlock":
      return <Padlock shut={clamp01(valor(c, "shut"))} />;
    case "p2d-YearOdo":
      return <YearOdo digit={valor(c, "digit")} />;
    case "p2d-Check":
      return <Check on={valor(c, "on")} size={opcNum(def.size)} />;
    case "p2d-NumDot":
      return <NumDot n={num(def.n, 1)} size={opcNum(def.size)} filled={valor(c, "cheio") > 0 || def.filled === true} />;
    case "p2d-AlarmClock":
      return <AlarmClock spin={valor(c, "spin")} ring={valor(c, "ring")} />;
    case "p2d-BigArrow":
      return <BigArrow w={opcNum(def.w)} />;
    case "p2d-Rays":
      return <Rays n={opcNum(def.n)} len={opcNum(def.len)} color={opcTxt(def.color)} a1={opcNum(def.a1)} a2={opcNum(def.a2)} />;
    case "p2d-Confetti": {
      const voo = valor(c, "voo");
      if (voo <= 0 || voo >= 1) return null;
      const cols = Array.isArray(def.cols) && (def.cols as unknown[]).length ? (def.cols as string[]) : CONFETE_PADRAO;
      return <Confetti t={voo * 1.6} t0={0} x={0} y={0} cols={cols} n={opcNum(def.n)} power={opcNum(def.power)} />;
    }
    case "p2d-Phone":
      return <Phone w={opcNum(def.w)} />;
    case "p2d-Eye":
      return <Eye open={valor(c, "open")} w={opcNum(def.w)} look={valor(c, "look")} />;
    case "p2d-TetoCard":
      return <TetoCard fill={clamp01(valor(c, "fill"))} val={clamp01(valor(c, "val"))} />;
    case "p2d-CommentIcon":
      return <CommentIcon t={t} w={opcNum(def.w)} />;
    case "p2d-Pill":
      return (
        <Pill bg={opcTxt(def.bg)} color={opcTxt(def.color)} size={opcNum(def.size)} border={opcTxt(def.border)}>
          {txt(def.texto, "")}
        </Pill>
      );
    case "p2d-Sparkle": {
      const p = (def.pulso || {}) as Record<string, unknown>;
      const s = num(p.base, 1) + num(p.amp, 0) * Math.sin(num(p.freq, 6) * t + num(p.fase, 0));
      return <Sparkle s={s} color={opcTxt(def.color)} />;
    }
    case "p2d-RelogioTarde":
      return <RelogioTarde hora={valor(c, "hora")} fatia={clamp01(valor(c, "fatia"))} de={opcNum(def.de)} ate={opcNum(def.ate)} d={opcNum(def.d)} t={t} />;
    case "p2d-Bilhete":
      return <Bilhete marca={valor(c, "marca")} w={opcNum(def.w)} />;
    case "p2d-Navegador":
      return <Navegador carrega={valor(c, "carrega")} gira={valor(c, "gira")} trava={valor(c, "trava")} falha={valor(c, "falha")} t={t} w={opcNum(def.w)} uid={def.id} />;
    case "p2d-Cursor":
      return <Cursor aperta={valor(c, "aperta")} onda={valor(c, "onda")} tipo={opcTxt(def.modo)} />;
    case "p2d-Telefone":
      return <Telefone toca={valor(c, "toca")} cai={valor(c, "cai")} vibra={valor(c, "vibra")} t={t} w={opcNum(def.w)} />;
    case "p2d-Fila":
      return <Fila anda={valor(c, "anda")} suspira={valor(c, "suspira")} n={opcNum(def.n)} passo={opcNum(def.passo)} t={t} w={opcNum(def.w)} />;
    case "p2d-Entardecer":
      return <Entardecer sol={valor(c, "sol")} noite={valor(c, "noite")} luzes={valor(c, "luzes")} t={t} uid={def.id} />;
    case "p2d-Empresa":
      return <Empresa gira={valor(c, "gira")} luz={valor(c, "luz")} pausa={valor(c, "pausa")} w={opcNum(def.w)} />;
    case "p2d-Ampulheta":
      return <Ampulheta vira={valor(c, "vira")} areia={valor(c, "areia")} w={opcNum(def.w)} uid={def.id} />;
    case "p2d-Construcao":
      return <Construcao molde={valor(c, "molde")} blocos={valor(c, "blocos")} liga={valor(c, "liga")} w={opcNum(def.w)} />;
    case "p2d-LinhaDescendo": {
      const tl = (def.telas || {}) as Record<string, { src?: string }>;
      const src = (k: string) => ({ src: typeof tl[k]?.src === "string" ? (tl[k].src as string) : "" });
      const telas: ParamsLinha["telas"] = { splash: src("splash"), atividade: src("atividade"), home: src("home") };
      return (
        <LinhaDescendo t={t} dur={num(def.dur, 34.58)} tempos={(def.tempos || {}) as Record<string, number>} chaves={(Array.isArray(def.chaves) ? def.chaves : []) as Chave[]}
          camera={(Array.isArray(def.camera) ? def.camera : []) as Array<[number, number]>} telas={telas} />
      );
    }
    case "p2d-Perfil":
      return (
        <Perfil segue={valor(c, "segue")} link={valor(c, "link")} nome={opcTxt(def.nome)} botao={opcTxt(def.botao)} botaoFeito={opcTxt(def.botaoFeito)} linkTexto={opcTxt(def.linkTexto)} w={opcNum(def.w)} />
      );
    default:
      return null;
  }
}

/** camada solta: um quadro inteiro com o z dela (por cima dos grupos, embaixo da p2d-legenda) */
const Solta: React.FC<{ z: number; children: React.ReactNode }> = ({ z, children }) => <AbsoluteFill style={{ zIndex: z }}>{children}</AbsoluteFill>;

/** as camadas de componente (todas as p2d-<Nome> do kit.tsx) */
const Elemento: React.FC<PropsDentro> = ({ id, st, props, t, dentro }) => {
  const def = defDe(props, id);
  if (!def) return null;
  if (!dentro && grupoDe(def)) return null; // quem desenha é o grupo
  const c = st.canais[id] || {};
  const op = valor(c, "op");
  if (op <= 0.001) return null;
  if (def.tipo === "p2d-Bg") {
    const fundo = <AbsoluteFill style={{ opacity: Math.min(1, op) }}><Bg kind={fundoDe(def.kind) || "paper"} t={t} /></AbsoluteFill>;
    return dentro ? fundo : <Solta z={num(def.z, 0)}>{fundo}</Solta>;
  }
  const conteudo = desenha(def, c, t);
  if (conteudo === null) return null;
  const tr = transformacao(def, c, t, props);
  const el = (
    <At x={tr.x} y={tr.y} sc={tr.sc} al={Math.min(1, op)} rot={tr.rot} blur={tr.blur} origin={tr.origem}>
      {conteudo}
    </At>
  );
  return dentro ? el : <Solta z={num(def.z, 150)}>{el}</Solta>;
};

/** z de um grupo: 10 + 2 pela ordem entre os grupos da cena (a ordem da lista é a ordem de entrada) */
function zDoGrupo(props: PropsKit, id: string): number {
  const grupos = (props.camadas || []).filter((c) => c.tipo === TIPO_GRUPO);
  for (let i = 0; i < grupos.length; i++) if (grupos[i].id === id) return 10 + 2 * i;
  return 10;
}

const copia = (alvo: Estilo, de: Estilo) => {
  for (const k of Object.keys(de)) alvo[k] = de[k];
};

/** p2d-grupo: fundo, câmera e as camadas filhas, com o estilo da transição (Scene) e do corte (trOf) */
const Grupo: React.FC<PropsDentro> = ({ id, st, props, t, dentro, nivel = 0 }) => {
  const def = defDe(props, id);
  if (!def || nivel > NIVEL_MAX) return null;
  if (!dentro && grupoDe(def)) return null;
  const c = st.canais[id] || {};
  if (valor(c, "vis") < 0.5) return null;
  const op = valor(c, "op");
  if (op <= 0.001) return null;
  let z = typeof def.z === "number" ? def.z : zDoGrupo(props, id);
  // transição (o Scene do Motion.tsx): wrap no grupo inteiro, cont no conteúdo
  const wrap: Estilo = {};
  const cont: Estilo = {};
  const te = Math.round(valor(c, "entraTipo"));
  const pe = valor(c, "entra");
  if (te >= 0 && te < TIPOS_TRANSICAO.length && pe < 1) {
    const r = estiloEntrada(TIPOS_TRANSICAO[te], clamp01(pe), num(c.entraOx, IRIS_PADRAO.ox), num(c.entraOy, IRIS_PADRAO.oy));
    copia(wrap, r.wrap);
    copia(cont, r.cont);
  }
  const ts = Math.round(valor(c, "saiTipo"));
  const ps = valor(c, "sai");
  if (ts >= 0 && ts < TIPOS_TRANSICAO.length && ps > 0) {
    const r = estiloSaida(TIPOS_TRANSICAO[ts], clamp01(ps));
    copia(wrap, r.wrap);
    if (r.z !== null) z = r.z;
  }
  // corte (o trOf do Broll.tsx): o estilo inteiro no fundo; nas camadas, sem o desfoque (como o Over do Broll)
  const corte: Estilo = {};
  const ce = Math.round(valor(c, "corteEntraTipo"));
  const pce = valor(c, "corteEntra");
  if (ce >= 0 && ce < TIPOS_CORTE.length && pce < 1) {
    const tipo = TIPOS_CORTE[ce];
    copia(corte, tipo === "loop" ? loopEntrada(clamp01(pce)) : estiloCorteEntrada(tipo, clamp01(pce)));
  }
  const cs = Math.round(valor(c, "corteSaiTipo"));
  const pcs = valor(c, "corteSai");
  if (cs >= 0 && cs < TIPOS_CORTE.length && pcs > 0) {
    const tipo = TIPOS_CORTE[cs];
    if (tipo === "loop") copia(corte, loopSaida(clamp01(pcs)));
    else {
      const r = estiloCorteSaida(tipo, clamp01(pcs));
      copia(corte, r.style);
      if (r.z !== null) z = r.z;
    }
  }
  const corteCamadas: Estilo = {};
  for (const k of Object.keys(corte)) if (k !== "filter") corteCamadas[k] = corte[k];
  // câmera (o Camera do Motion.tsx): escala e rotação somadas às molas, deslocamento somado às tremidas
  const cam = estiloCamera(
    { sc: valor(c, "s") + soma(c, "s"), rot: valor(c, "rot") + soma(c, "rot"), dx: valor(c, "x") + soma(c, "x"), dy: valor(c, "y") + soma(c, "y") },
    txt(def.origem, "50% 58%"),
  );
  const fora: Estilo = { zIndex: z };
  copia(fora, wrap);
  const opWrap = typeof wrap.opacity === "number" ? (wrap.opacity as number) : 1;
  if (op < 1 || opWrap < 1) fora.opacity = Math.min(1, op) * opWrap;
  const fundo = fundoDe(def.fundo);
  const clarao = clamp01(valor(c, "clarao"));
  const filhos = (props.camadas || []).filter((x) => grupoDe(x) === id);
  return (
    <AbsoluteFill style={css(fora)}>
      {fundo ? (
        <AbsoluteFill style={css(corte)}>
          <Bg kind={fundo} t={t} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={css(cont)}>
        <AbsoluteFill style={css(corteCamadas)}>
          <AbsoluteFill style={css(cam)}>
            {filhos.map((f) => (
              <Filho key={f.id} def={f} st={st} props={props} t={t} nivel={nivel} />
            ))}
          </AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>
      {clarao > 0 ? <AbsoluteFill style={{ background: "#FFFFFF", opacity: CLARAO.opacidade * clarao }} /> : null}
    </AbsoluteFill>
  );
};

/** uma camada dentro de um grupo (só camadas da biblioteca 2D entram em grupo) */
const Filho: React.FC<{ def: CamadaProps; st: Estado; props: PropsKit; t: number; nivel: number }> = ({ def, st, props, t, nivel }) => {
  if (def.tipo === TIPO_GRUPO) return <Grupo id={def.id} st={st} props={props} t={t} dentro nivel={nivel + 1} />;
  if (def.tipo === TIPO_LEGENDA) return <Legenda id={def.id} st={st} props={props} t={t} dentro />;
  if (def.tipo.indexOf(PREFIXO) === 0) return <Elemento id={def.id} st={st} props={props} t={t} dentro />;
  return null;
};

/** p2d-legenda: a LegendaApple do K06 por cima das camadas 2D, com modo por frase (uma LegendaApple por modo,
 *  cada uma pulando as frases dos outros modos) e, com fecho true, o fecho e o LINK DA BIO por cima também */
const Legenda: React.FC<PropsDentro> = ({ id, st, props, dentro }) => {
  const def = defDe(props, id);
  if (!def) return null;
  if (!dentro && grupoDe(def)) return null;
  const c = st.canais[id] || {};
  const op = valor(c, "op");
  if (op <= 0.001) return null;
  const leg = props.legenda;
  const padrao = (MODOS_LEGENDA.indexOf(def.modo as string) >= 0 ? def.modo : leg.modo) as ModoLegenda;
  const modos = Array.isArray(def.modos) ? (def.modos as unknown[]) : [];
  const pula = Array.isArray(def.pula) ? (def.pula as number[]) : [];
  const frases = (props.narracao && props.narracao.phrases) || [];
  const porModo: Record<string, number[]> = {};
  frases.forEach((_f, n) => {
    if (pula.indexOf(n) >= 0) return;
    const m = MODOS_LEGENDA.indexOf(modos[n] as string) >= 0 ? (modos[n] as string) : padrao;
    (porModo[m] = porModo[m] || []).push(n);
  });
  const todas = frases.map((_f, n) => n);
  const conteudo = (
    <AbsoluteFill style={{ opacity: Math.min(1, op) }}>
      {Object.keys(porModo).map((m) => (
        <LegendaApple
          key={m}
          narracao={props.narracao}
          top={num(def.top, leg.top)}
          altura={num(def.altura, leg.altura)}
          tamanho={num(def.tamanho, leg.tamanho)}
          modo={m as ModoLegenda}
          esquerda={opcNum(def.esquerda) !== undefined ? opcNum(def.esquerda) : leg.esquerda}
          largura={opcNum(def.largura) !== undefined ? opcNum(def.largura) : leg.largura}
          pula={todas.filter((n) => porModo[m].indexOf(n) < 0)}
        />
      ))}
      {def.fecho === true && props.fecho ? <Fecho ui={st.ui} fecho={props.fecho} /> : null}
      {def.fecho === true && props.fecho ? <LinkBio ui={st.ui} link={props.fecho.link} /> : null}
    </AbsoluteFill>
  );
  return dentro ? conteudo : <Solta z={num(def.z, 200)}>{conteudo}</Solta>;
};

// ---------- registro (seção 4.10) ----------

const camadaElemento: CamadaExtensao = (p) => <Elemento {...p} />;
const camadaGrupo: CamadaExtensao = (p) => <Grupo {...p} />;
const camadaLegenda: CamadaExtensao = (p) => <Legenda {...p} />;

const camadasRender: Record<string, CamadaExtensao> = {};
for (const nomeComp of COMPONENTES.concat(COMPONENTES_SUFOCO)) camadasRender[`${PREFIXO}${nomeComp}`] = camadaElemento;
camadasRender[TIPO_GRUPO] = camadaGrupo;
camadasRender[TIPO_LEGENDA] = camadaLegenda;

export const render: RenderExtensao = { camadas: camadasRender };
