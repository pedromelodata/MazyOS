import React, { useLayoutEffect, useRef, useState } from "react";
import { Img, continueRender, delayRender, staticFile } from "remotion";
import { C, SORA } from "./cores";
import { VITRINE_DIR, VITRINE_ESQ, type Linha, type TelaCfg } from "./dados";
import { esperaSora } from "./fonte";

// Camada de texto e interface (DOM por cima do canvas). Grade: margem lateral de 72 px, texto entre x 72 e 1008
// (936 px úteis). Quebras de linha manuais; nada de quebra automática (ela deixa palavra sozinha na última
// linha). Zero travessão e nenhuma barrinha colada antes de texto.

const ESQ = 72;
const DIR = 1008;
const UTIL = DIR - ESQ;

type BlocoProps = {
  linhas: Linha[];
  tam: number;
  entrelinha: number;
  peso: number;
  cor: string;
  espaco?: string;
  topo: number;
  esquerda?: number;
};

/** Bloco de linhas fixas. Mede cada linha com a Sora carregada e, se alguma passar dos 936 px, reduz o bloco
 *  inteiro na mesma proporção (rede de segurança: as quebras já foram medidas com a Sora real). */
const Bloco: React.FC<BlocoProps> = ({ linhas, tam, entrelinha, peso, cor, espaco, topo, esquerda = ESQ }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  const [h] = useState(() => delayRender("medindo as linhas do texto", { timeoutInMilliseconds: 60000 }));
  const feito = useRef(false);
  useLayoutEffect(() => {
    let vivo = true;
    const fim = () => {
      if (!feito.current) {
        feito.current = true;
        continueRender(h);
      }
    };
    esperaSora([peso, 400, 700])
      .then(() => {
        if (!vivo) return;
        const el = ref.current;
        let maior = 0;
        if (el) {
          const filhos = el.querySelectorAll("[data-linha]");
          for (let i = 0; i < filhos.length; i++) maior = Math.max(maior, (filhos[i] as HTMLElement).getBoundingClientRect().width);
        }
        const lim = DIR - esquerda;
        if (maior > lim) {
          console.log(`CARROSSEL_AVISO linha com ${maior.toFixed(1)} px (limite ${lim}); bloco reduzido`);
          setK(lim / maior);
          requestAnimationFrame(fim);
        } else fim();
      })
      .catch((e) => {
        console.error("fonte não carregou", e);
        fim();
      });
    return () => {
      vivo = false;
      fim();
    };
  }, [h, peso, tam, esquerda]);
  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: esquerda,
        top: topo,
        fontFamily: SORA,
        fontSize: tam * k,
        lineHeight: `${entrelinha * k}px`,
        fontWeight: peso,
        color: cor,
        letterSpacing: espaco,
        whiteSpace: "nowrap",
        textRendering: "geometricPrecision",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {linhas.map((l, i) => (
        <div key={i} data-linha="" style={{ width: "max-content" }}>
          {l.map((s, j) => (
            <span key={j} style={{ color: s.cor ?? cor, fontWeight: s.peso ?? peso }}>
              {s.t}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

type Trecho = { t: string; cor: string; sep?: boolean };

/** pílula de rótulo (caixa alta, 700, espaçamento .14em, 26 px). O padding esquerdo ganha o espaçamento da última
 *  letra pra o texto ficar no centro ótico. */
const Pilula: React.FC<{ trechos: Trecho[]; fundo: string; borda: string; tam?: number; padV?: number; padH?: number }> = ({
  trechos,
  fundo,
  borda,
  tam = 26,
  padV = 12,
  padH = 20,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      background: fundo,
      border: `1.5px solid ${borda}`,
      borderRadius: 999,
      padding: `${padV}px ${padH}px ${padV}px ${padH + tam * 0.14}px`,
      fontFamily: SORA,
      fontWeight: 700,
      fontSize: tam,
      lineHeight: 1,
      letterSpacing: "0.14em",
      whiteSpace: "nowrap",
    }}
  >
    {trechos.map((t, i) => (
      <span key={i} style={{ color: t.cor, margin: t.sep ? `0 ${tam * 0.42}px 0 ${tam * 0.28}px` : undefined }}>
        {t.t}
      </span>
    ))}
  </div>
);

/** rótulos da vitrine: cada pílula no canto de cima à esquerda do seu painel (não briga com o sino nem com o
 *  aparelho). Na tela 3 o "Plano ME" entra na própria pílula do Legalizaí: um elemento só, sem pílula repetida. */
const Rotulos: React.FC<{ planoMe?: boolean }> = ({ planoMe }) => {
  const y = VITRINE_ESQ[1] + 42;
  const pos = (x: number): React.CSSProperties => ({ position: "absolute", left: x, top: y, transform: "translateY(-50%)" });
  const legalizai: Trecho[] = [{ t: "LEGALIZAÍ", cor: C.coral700 }];
  if (planoMe) legalizai.push({ t: "·", cor: C.coral, sep: true }, { t: "PLANO ME", cor: C.tinta });
  return (
    <>
      <div style={pos(VITRINE_ESQ[0] + 26)}>
        <Pilula trechos={[{ t: "TRADICIONAL", cor: C.frioTexto }]} fundo="#EEF1F4" borda={C.vitrineFrioBorda} />
      </div>
      <div style={pos(VITRINE_DIR[0] + 26)}>
        <Pilula trechos={legalizai} fundo={C.branco} borda={C.coral} />
      </div>
    </>
  );
};

/** rodapé das telas 1 a 5: só o símbolo de 36 px em (72, 1250). Sem contador: o Instagram já põe o "2/7". */
const Rodape: React.FC = () => <Img src={staticFile("marca/simbolo.svg")} style={{ position: "absolute", left: ESQ, top: 1250, width: 36, height: 36 }} />;

/** capa: pílula escura "Arrasta pro lado" com chevron sem haste, canto inferior direito */
const Arrasta: React.FC = () => (
  <div
    style={{
      position: "absolute",
      right: 1080 - DIR,
      top: 1218,
      display: "flex",
      alignItems: "center",
      gap: 14,
      background: C.tinta,
      color: C.branco,
      borderRadius: 999,
      padding: "18px 30px",
      fontFamily: SORA,
      fontWeight: 700,
      fontSize: 26,
      lineHeight: 1,
      whiteSpace: "nowrap",
    }}
  >
    <span>Arrasta pro lado</span>
    <svg width="11" height="18" viewBox="0 0 11 18" style={{ display: "block" }}>
      <path d="M2 2 L9 9 L2 16" fill="none" stroke={C.branco} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

/** fecho: CTA "Comenta aí" (fill coral 600, ícone de balão em contorno branco antes do texto). Sem sombra: em
 *  carrossel a separação vem do fill (design guide). */
const Comenta: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: ESQ,
      top: 1102,
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      background: C.coral600,
      color: C.branco,
      borderRadius: 999,
      padding: "20px 40px",
      fontFamily: SORA,
      fontWeight: 800,
      fontSize: 34,
      lineHeight: 1,
      whiteSpace: "nowrap",
    }}
  >
    <svg width="30" height="30" viewBox="0 0 30 30" style={{ display: "block" }}>
      <path
        d="M6.5 5h17A3.5 3.5 0 0 1 27 8.5v10a3.5 3.5 0 0 1 -3.5 3.5H14.2l-5.7 4.6V22H6.5A3.5 3.5 0 0 1 3 18.5v-10A3.5 3.5 0 0 1 6.5 5z"
        fill="none"
        stroke={C.branco}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
    </svg>
    <span>Comenta aí</span>
  </div>
);

export const Texto: React.FC<{ tela: TelaCfg }> = ({ tela }) => {
  if (tela.tipo === "capa") {
    return (
      <>
        <Bloco linhas={tela.titulo} tam={100} entrelinha={98} peso={800} cor={C.tinta} espaco="-0.035em" topo={tela.tituloTopo} />
        <Bloco linhas={tela.apoio} tam={48} entrelinha={58} peso={600} cor={C.tinta2} topo={tela.apoioTopo} />
        <Arrasta />
      </>
    );
  }
  if (tela.tipo === "fecho") {
    return (
      <>
        <Bloco linhas={tela.apoio} tam={38} entrelinha={51} peso={500} cor={C.tinta2} topo={tela.apoioTopo} />
        <Bloco linhas={tela.titulo} tam={88} entrelinha={88} peso={800} cor={C.tinta} espaco="-0.035em" topo={tela.tituloTopo} />
        <Comenta />
        <Img src={staticFile("marca/logo-horizontal.svg")} style={{ position: "absolute", left: ESQ, top: 1240, width: 188 }} />
      </>
    );
  }
  return (
    <>
      <Bloco linhas={tela.titulo} tam={76} entrelinha={78} peso={800} cor={C.tinta} espaco="-0.03em" topo={tela.tituloTopo} />
      <Bloco linhas={tela.apoio} tam={38} entrelinha={51} peso={500} cor={C.tinta2} topo={tela.apoioTopo} />
      {tela.rotulos && <Rotulos planoMe={tela.rotulos.planoMe} />}
      <Rodape />
    </>
  );
};

export const LARGURA_UTIL = UTIL;
