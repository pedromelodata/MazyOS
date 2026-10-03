// Extensão "abertura" do kit de motion: as camadas 2D e o objeto calendário clay (dono K10).
// Contrato: KIT/DESENHO.md, seções 4.10 e 5 (família 2D da abertura). As camadas só LEEM st.canais[id] (quem
// anima é o batidas.ts); os números de desenho são os do RM/src/abertura/Abertura.tsx e do Calendar3D.tsx.
//
// Camadas: texto (linhas explícitas, máscara por linha, cada palavra num span, Sora e cores da marca), imagem,
// selo (vetorial, com o check ou o símbolo da marca, ou uma imagem), marcaTexto (traço SVG ATRÁS da palavra,
// desenhado pela camada texto: nunca antes dela na mesma linha), pecas (formas vetoriais na paleta, pro estouro)
// e cta. Objeto: calendario-clay (createClayCalendarModel e setPageFlip de src/abertura, rótulos de mês em pt-BR
// e etiqueta por CanvasTexture como parâmetro).
//
// Texturas do calendário: a fábrica gerada carrega os 15 mapas planos ("clay-cream_albedo.png" e os outros, na
// raiz do public) pelo gancho global do src/abertura/img2three.ts, que este arquivo só importa (o mesmo módulo da
// Abertura). O gancho NUNCA é trocado aqui. O re-render depois de cada textura usa o setImg2ThreeRerender como o
// Calendar3D.tsx usa (o advance do react-three-fiber), pra textura não sair preta.
// Sem efeito colateral no import: só constantes, funções e componentes.
import React from "react";
import { Img, staticFile } from "remotion";
import * as THREE from "three";
import { advance } from "@react-three/fiber";
import { setImg2ThreeRerender } from "../../../abertura/img2three";
import { createClayCalendarBlockModel, type ProceduralModelRuntime } from "../../../abertura/3d/createClayCalendarModel";
import { rigCalendarPage, setPageFlip } from "../../../abertura/calendarRig";
import { CommentIcon } from "../../../motion/kit";
import { cameraRender, frequencia } from "../../nucleo/pose";
import type { CamadaProps, Estado, PropsKit } from "../../nucleo/tipos";
import type { CamadaExtensao, FabricaObjeto, RenderExtensao } from "../../render/tipos-render";
import { PALCO, TIPO_CALENDARIO, estadoInicialCalendario, linhasDoTexto, type PalavraTexto } from "./batidas";

// cores da marca (catalogos/marca.json) e a fonte
const COR = {
  ink: "#1B1E24",
  coral: "#F2643C",
  coral6: "#DD4E27",
  coral200: "#F8C3B0",
  areia: "#EAE1D6",
  branco: "#FFFFFF",
};
const FONTE = "Sora";
const SOMBRA_CTA = "0 26px 50px rgba(27,30,36,0.16), 0 6px 14px rgba(27,30,36,0.08)";

type Canal = Record<string, number>;

const num = (x: unknown, p: number) => (typeof x === "number" && isFinite(x) ? x : p);
const txt = (x: unknown, p: string) => (typeof x === "string" && x ? x : p);
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const r4 = (x: number) => Math.round(x * 1e4) / 1e4;

function defDe(props: PropsKit, id: string): CamadaProps | null {
  return (props.camadas || []).filter((c) => c.id === id)[0] || null;
}

function canal(st: Estado, id: string): Canal {
  return st.canais[id] || {};
}

/** o palco da camada: o canal (s, x, y) que o soco e a tremida animam, ou null com palco desligado */
function palcoDe(st: Estado, def: CamadaProps, padrao: boolean): Canal | null {
  const v = def.palco === undefined ? padrao : def.palco;
  if (v === false || v === null) return null;
  const id = typeof v === "string" && v ? v : PALCO;
  return st.canais[id] || null;
}

/** o palco da abertura (.stage): translate(x, y) scale(s) com origem em 50% 58%. Com o canal do palco na cena, o
 *  invólucro existe em todo quadro (parado, sem transform), pra camada não ser remontada quando o soco começa */
const Palco: React.FC<{ pc: Canal | null; children: React.ReactNode }> = ({ pc, children }) => {
  if (!pc) return <>{children}</>;
  const s = num(pc.s, 1);
  const x = num(pc.x, 0);
  const y = num(pc.y, 0);
  const parado = s === 1 && x === 0 && y === 0;
  return (
    <div style={{ position: "absolute", inset: 0, transform: parado ? undefined : `translate(${r4(x)}px, ${r4(y)}px) scale(${r4(s)})`, transformOrigin: "50% 58%" }}>
      {children}
    </div>
  );
};

// ---------- texto ----------

type MarcaDoTexto = { de: number; ate: number; id: string; cor: string; espessura: number; opacidade: number };

/** os marca-texto que apontam pra esta camada texto (palavra, ou de palavra a ate, na mesma linha) */
function marcasDoTexto(props: PropsKit, id: string): MarcaDoTexto[] {
  return (props.camadas || [])
    .filter((m) => m.tipo === "marcaTexto" && m.texto === id && typeof m.palavra === "number")
    .map((m) => {
      const de = m.palavra as number;
      const ate = typeof m.ate === "number" && (m.ate as number) >= de ? (m.ate as number) : de;
      return { de, ate, id: m.id, cor: txt(m.cor, COR.coral), espessura: num(m.espessura, 9), opacidade: num(m.opacidade, 0.85) };
    });
}

/** o traço do marca-texto: atrás das palavras, dentro da caixa delas (começa depois da borda esquerda) */
const Traco: React.FC<{ p: number; m: MarcaDoTexto }> = ({ p, m }) => (
  <svg viewBox="0 0 200 30" preserveAspectRatio="none" style={{ position: "absolute", left: 0, width: "100%", bottom: "0.04em", height: "0.36em", overflow: "visible", zIndex: 0 }}>
    {p > 0.001 ? (
      <path d="M8 22 C52 14 120 12 192 18" pathLength={1} stroke={m.cor} strokeWidth={m.espessura} fill="none" strokeLinecap="round" opacity={m.opacidade}
        strokeDasharray="1 1" strokeDashoffset={r4(1 - clamp01(p))} />
    ) : null}
  </svg>
);

const CamadaTexto: CamadaExtensao = ({ id, st, props }) => {
  const def = defDe(props, id);
  if (!def) return null;
  const c = canal(st, id);
  const vis = num(c.vis, 1);
  if (vis <= 0.001) return null;
  const P = {
    top: num(def.top, 205),
    altura: num(def.altura, 420),
    esquerda: num(def.esquerda, 70),
    largura: num(def.largura, 940),
    tamanho: num(def.tamanho, 100),
    peso: num(def.peso, 800),
    cor: txt(def.cor, COR.ink),
    corDestaque: txt(def.corDestaque, COR.coral6),
    entrelinha: num(def.entrelinha, 1.04),
    espacamento: txt(def.espacamento, "-0.035em"),
  };
  const yP = num(c.entraY, 115);
  const rot = num(c.entraRot, 4);
  const linhas = linhasDoTexto(def.linhas);
  const marcas = marcasDoTexto(props, id);
  const palavra = (w: PalavraTexto, i: number) => {
    const e = num(c["w" + i], 1);
    const parado = Math.abs(e - 1) < 1e-9;
    return (
      <span key={`p${i}`} style={{ display: "inline-block", position: "relative", zIndex: 1, color: w.destaque ? P.corDestaque : undefined,
        transform: parado ? undefined : `translateY(${r4(yP * (1 - e))}%) rotate(${r4(rot * (1 - e))}deg)` }}>
        {w.t}
      </span>
    );
  };
  let k = 0;
  return (
    <div style={{ position: "absolute", left: P.esquerda, top: P.top, width: P.largura, minHeight: P.altura, display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "stretch", textAlign: "center", fontFamily: FONTE, fontWeight: P.peso, fontSize: P.tamanho, color: P.cor,
      letterSpacing: P.espacamento, lineHeight: P.entrelinha, opacity: Math.min(1, vis) }}>
      {linhas.map((ln, j) => {
        const l = clamp01(num(c["l" + j], 0));
        const inicio = k;
        k += ln.length;
        const filhos: React.ReactNode[] = [];
        let i = 0;
        while (i < ln.length) {
          const g = inicio + i;
          const m = marcas.filter((x) => x.de === g)[0];
          if (m) {
            const fim = Math.min(ln.length - 1, m.ate - inicio);
            const grupo: React.ReactNode[] = [];
            for (let q = i; q <= fim; q++) {
              if (q > i) grupo.push(" ");
              grupo.push(palavra(ln[q], inicio + q));
            }
            filhos.push(
              <span key={`m${g}`} style={{ position: "relative", display: "inline-block", isolation: "isolate" }}>
                <Traco p={num(canal(st, m.id).p, 0)} m={m} />
                {grupo}
              </span>,
            );
            i = fim + 1;
          } else {
            filhos.push(palavra(ln[i], g));
            i++;
          }
          if (i < ln.length) filhos.push(" ");
        }
        return (
          <div key={j} style={{ overflow: "hidden" }}>
            <div style={{ transform: l > 0 ? `translateY(${r4(-60 * l)}%)` : undefined, opacity: r4(1 - l), filter: l > 0 ? `blur(${r4(6 * l)}px)` : undefined,
              visibility: l >= 1 ? "hidden" : undefined, whiteSpace: "nowrap" }}>
              {filhos}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** o marca-texto é desenhado pela camada texto (atrás da palavra); aqui não aparece nada */
const CamadaMarcaTexto: CamadaExtensao = () => null;

// ---------- imagem ----------

const CamadaImagem: CamadaExtensao = ({ id, st, props }) => {
  const def = defDe(props, id);
  if (!def) return null;
  const c = canal(st, id);
  const op = num(c.op, 1);
  const src = txt(def.src, "");
  if (op <= 0.001 || !src) return null;
  const x = num(c.x, 0);
  const y = num(c.y, 0);
  const s = num(c.s, 1);
  const rot = num(c.rot, 0);
  const sx = num(c.sx, 1);
  const sy = num(c.sy, 1);
  return (
    <Palco pc={palcoDe(st, def, true)}>
      <div style={{ position: "absolute", left: num(def.x, 540), top: num(def.y, 960), width: num(def.largura, 520), opacity: Math.min(1, op),
        transform: `translate(-50%, -50%) translate(${r4(x)}px, ${r4(y)}px) rotate(${r4(rot)}deg) scale(${r4(s)})` }}>
        <div style={{ transform: sx === 1 && sy === 1 ? undefined : `scale(${r4(sx)}, ${r4(sy)})`, transformOrigin: txt(def.origemAchata, "50% 100%") }}>
          <Img src={staticFile(src)} style={{ width: "100%", height: "auto", display: "block",
            filter: def.sombra === false ? undefined : "drop-shadow(0 26px 30px rgba(27,30,36,0.18))" }} />
        </div>
      </div>
    </Palco>
  );
};

// ---------- selo ----------

/** borda recortada do selo (disco de cera): n lóbulos em volta do raio r */
function bordaRecortada(cx: number, cy: number, r: number, n: number, amp: number): string {
  const pts: string[] = [];
  const passos = n * 12;
  for (let i = 0; i < passos; i++) {
    const a = (i / passos) * Math.PI * 2;
    const rr = r * (1 + amp * Math.cos(n * a));
    pts.push(`${r4(cx + Math.cos(a) * rr)} ${r4(cy + Math.sin(a) * rr)}`);
  }
  return `M${pts.join(" L")} Z`;
}

const SeloVetor: React.FC<{ tam: number; icone: string | null; cor: string; corAro: string; src: string }> = ({ tam, icone, cor, corAro, src }) => {
  if (src) return <Img src={staticFile(src)} style={{ width: tam, height: tam, display: "block" }} />;
  const simbolo = icone === "simbolo";
  return (
    <div style={{ position: "relative", width: tam, height: tam, filter: "drop-shadow(0 14px 16px rgba(27,30,36,0.18))" }}>
      <svg width={tam} height={tam} viewBox="0 0 200 200" style={{ display: "block" }}>
        <path d={bordaRecortada(100, 100, 92, 14, 0.045)} fill={simbolo ? COR.branco : cor} stroke={simbolo ? cor : "none"} strokeWidth={simbolo ? 7 : 0} />
        <circle cx={100} cy={100} r={70} fill="none" stroke={simbolo ? cor : corAro} strokeWidth={simbolo ? 3 : 6} opacity={simbolo ? 0.45 : 0.9} />
        {icone === "check" ? <path d="M62 104 L88 128 L140 72" stroke={COR.branco} strokeWidth={20} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
      {simbolo ? (
        <Img src={staticFile("marca/simbolo.svg")} style={{ position: "absolute", left: tam * 0.29, top: tam * 0.29, width: tam * 0.42, height: tam * 0.42 }} />
      ) : null}
    </div>
  );
};

const CamadaSelo: CamadaExtensao = ({ id, st, props }) => {
  const def = defDe(props, id);
  if (!def) return null;
  const c = canal(st, id);
  const tam = num(def.tamanho, 175);
  const k = tam / 175;
  const cx = num(def.x, 540);
  const cy = num(def.y, 1100);
  const cor = txt(def.cor, COR.coral);
  const op = num(c.op, 1);
  const sombraOp = num(c.sombraOp, 0);
  const anel = clamp01(num(c.anel, 0));
  const anelVis = num(c.anelVis, 0);
  const s = num(c.s, 1);
  const icone = def.icone === null ? null : txt(def.icone, "check");
  return (
    <Palco pc={palcoDe(st, def, true)}>
      {sombraOp > 0.001 ? (
        <div style={{ position: "absolute", left: cx - tam / 2 + tam * 0.1, top: cy - tam / 2 + tam * 0.18, width: tam * 0.85, height: tam * 0.85, borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(27,30,36,0.55), rgba(27,30,36,0))", opacity: r4(sombraOp), transform: `scale(${r4(num(c.sombraS, 1))})` }} />
      ) : null}
      {anelVis > 0.001 && anel < 1 ? (
        <svg width={2} height={2} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <circle cx={cx} cy={cy} r={r4((70 + 120 * anel) * k)} fill="none" stroke={cor} strokeWidth={r4(16 * (1 - anel) * k)} opacity={r4(anelVis * (1 - anel))} />
        </svg>
      ) : null}
      {op > 0.001 ? (
        <div style={{ position: "absolute", left: cx - tam / 2, top: cy - tam / 2, width: tam, height: tam, opacity: Math.min(1, op),
          transform: `translate(${r4(num(c.x, 0))}px, ${r4(num(c.y, 0))}px) rotate(${r4(num(c.rot, 0))}deg) scale(${r4(s * num(c.sx, 1))}, ${r4(s * num(c.sy, 1))})` }}>
          <SeloVetor tam={tam} icone={icone} cor={cor} corAro={txt(def.corAro, COR.coral6)} src={txt(def.src, "")} />
        </div>
      ) : null}
    </Palco>
  );
};

// ---------- peças do estouro ----------

const CamadaPecas: CamadaExtensao = ({ id, st, props }) => {
  const def = defDe(props, id);
  if (!def) return null;
  const c = canal(st, id);
  const vis = num(c.vis, 0);
  const f = clamp01(num(c.f, 0));
  if (vis <= 0.001 || f >= 1) return null;
  const v = num(c.v, 0);
  const n = Math.max(1, Math.round(num(def.n, 10)));
  const raio = Array.isArray(def.raio) ? (def.raio as number[]) : [120, 55];
  const r0 = num(raio[0], 120);
  const r1 = num(raio[1], 55);
  const subida = num(def.subida, 30);
  const giro = num(def.giro, 160);
  const cores = Array.isArray(def.cores) && (def.cores as unknown[]).length ? (def.cores as string[]) : [COR.coral, COR.coral200, COR.coral6, COR.areia];
  const pecas: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (i % 2) * 0.35;
    const r = r0 + (i % 3) * r1;
    const x = Math.cos(a) * r * v;
    const y = (Math.sin(a) * r - subida) * v;
    const g = (i % 2 ? 1 : -1) * giro * v;
    const sc = 1 + (0.3 - 1) * f;
    pecas.push(
      <i key={i} style={{ position: "absolute", left: -9, top: -9, width: i % 3 === 0 ? 22 : 16, height: i % 3 === 0 ? 12 : 16, borderRadius: i % 2 ? 99 : 5,
        background: cores[i % cores.length], boxShadow: "0 3px 6px rgba(27,30,36,0.12)", opacity: r4(Math.min(1, vis) * (1 - f)),
        transform: `translate(${r4(x)}px, ${r4(y)}px) rotate(${r4(g)}deg) scale(${r4(sc)})` }} />,
    );
  }
  return (
    <Palco pc={palcoDe(st, def, true)}>
      <div style={{ position: "absolute", left: num(c.cx, num(def.x, 540)), top: num(c.cy, num(def.y, 960)), zIndex: 5 }}>{pecas}</div>
    </Palco>
  );
};

// ---------- cta ----------

const CamadaCta: CamadaExtensao = ({ id, st, props, t }) => {
  const def = defDe(props, id);
  if (!def) return null;
  const c = canal(st, id);
  const op = num(c.op, 1);
  if (op <= 0.001) return null;
  const largura = num(def.largura, 600);
  const tamanho = num(def.tamanho, 40);
  const comIcone = def.icone !== null && txt(def.icone, "comentario") === "comentario";
  const pill = (
    <div style={{ position: "absolute", left: num(def.x, 540) - largura / 2, width: largura, top: num(def.y, 1450), display: "flex", justifyContent: "center", opacity: Math.min(1, op),
      transform: `translate(${r4(num(c.x, 0))}px, ${r4(num(c.y, 0))}px) scale(${r4(num(c.s, 1))})` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 * (tamanho / 40), background: COR.branco, borderRadius: 999, padding: `${16 * (tamanho / 40)}px ${34 * (tamanho / 40)}px ${16 * (tamanho / 40)}px ${(comIcone ? 22 : 34) * (tamanho / 40)}px`,
        boxShadow: SOMBRA_CTA, fontFamily: FONTE, fontWeight: 800, fontSize: tamanho, color: COR.ink, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
        {comIcone ? (
          <div style={{ width: 62 * (tamanho / 40), height: 54 * (tamanho / 40) }}>
            <CommentIcon t={t} w={62 * (tamanho / 40)} />
          </div>
        ) : null}
        {txt(def.texto, "")}
      </div>
    </div>
  );
  return <Palco pc={palcoDe(st, def, false)}>{pill}</Palco>;
};

// ---------- objeto calendario-clay ----------

/** meses em pt-BR (a etiqueta do mês na página, como o SET e o OUT da abertura) */
export const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

/** escala padrão: 1 unidade do modelo = 0,12 m (o calendário da abertura com s 1,45 ocupa ~650 px na câmera do kit) */
export const ESCALA_CALENDARIO = 0.12;

export type ConteudoCalendario = {
  mes?: number; // 1 a 12: a página que aparece depois da virada; a da frente é o mês anterior
  de?: string; // rótulo da página da frente (padrão "SET")
  para?: string; // rótulo da página revelada (padrão "OUT")
  corDe?: string;
  corPara?: string;
  etiqueta?: string | null; // a etiqueta da marca-dia (padrão "dia 20"; null tira)
  corEtiqueta?: string;
  corAnel?: string;
  balanco?: number; // balanço lento de ry (0,02 na abertura; 0 desliga)
  estado?: Record<string, number>; // canais de partida (virada, pagina, marca, pulso, sx, sy, giro)
};

/** rótulo em Sora 800 numa CanvasTexture (o labelTexture do Calendar3D.tsx, com o texto encolhendo pra caber) */
export function texturaRotulo(texto: string, cor: string, w = 512, h = 200, fundo?: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, w, h);
  if (fundo) {
    const r = h / 2;
    g.fillStyle = fundo;
    g.beginPath();
    g.moveTo(r, 0);
    g.lineTo(w - r, 0);
    g.arc(w - r, r, r, -Math.PI / 2, Math.PI / 2);
    g.lineTo(r, h);
    g.arc(r, r, r, Math.PI / 2, (3 * Math.PI) / 2);
    g.fill();
  }
  let tam = Math.round(h * 0.62);
  g.font = `800 ${tam}px Sora`;
  const util = fundo ? w - h * 0.6 : w - 20;
  while (tam > 20 && g.measureText(texto).width > util) {
    tam -= 2;
    g.font = `800 ${tam}px Sora`;
  }
  g.fillStyle = cor;
  g.textBaseline = "middle";
  g.textAlign = fundo ? "center" : "left";
  g.fillText(texto, fundo ? w / 2 : 10, h * 0.55);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** rótulos de mês do conteúdo: mes (1 a 12) dá o mês e o anterior; de e para trocam */
export function rotulosDoMes(cont: ConteudoCalendario): { de: string; para: string } {
  let de = "SET";
  let para = "OUT";
  if (typeof cont.mes === "number" && cont.mes >= 1 && cont.mes <= 12) {
    const m = Math.round(cont.mes) - 1;
    para = MESES[m];
    de = MESES[(m + 11) % 12];
  }
  if (typeof cont.de === "string" && cont.de) de = cont.de;
  if (typeof cont.para === "string" && cont.para) para = cont.para;
  return { de, para };
}

type Montado = { model: THREE.Group; hinge: THREE.Group; ring: THREE.Mesh; tag: THREE.Sprite | null; accentOut: THREE.Object3D };

/** o build() do Calendar3D.tsx com os rótulos e a etiqueta como parâmetro */
function montaCalendario(cont: ConteudoCalendario): Montado {
  const model = createClayCalendarBlockModel({ castShadow: true, receiveShadow: true });
  const rt = model.userData.sculptRuntime as ProceduralModelRuntime;
  const pageSet = rt.nodes["page-front"];
  // página revelada: cópia da página, logo atrás; a da frente fica sem o botão coral (o mês novo ganha a marca)
  const pageOut = pageSet.clone(true);
  pageOut.position.z -= 0.006;
  model.add(pageOut);
  const beige = rt.meshes["stud-r1c3"].material;
  rt.meshes["stud-r2c3"].material = beige;
  let accentOut: THREE.Object3D = pageOut;
  pageOut.traverse((o) => {
    if (o.name.startsWith("Grid stud row 2 col 3") && (o as THREE.Mesh).isMesh) accentOut = o;
  });
  const { de, para } = rotulosDoMes(cont);
  const rotulo = (texto: string, cor: string) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.172), new THREE.MeshStandardMaterial({ map: texturaRotulo(texto, cor), transparent: true, roughness: 0.9 }));
    m.position.set(-0.16, 0.24, 0.0195);
    return m;
  };
  pageSet.add(rotulo(de, txt(cont.corDe, COR.ink)));
  pageOut.add(rotulo(para, txt(cont.corPara, COR.coral6)));
  // anel coral em volta do botão de destaque da página revelada e a etiqueta
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.014, 16, 64), new THREE.MeshStandardMaterial({ color: txt(cont.corAnel, "#E8603C"), roughness: 0.8 }));
  ring.position.set(0.09, 0.105, 0.05);
  pageOut.add(ring);
  const etiqueta = cont.etiqueta === null ? null : txt(cont.etiqueta, "dia 20");
  let tag: THREE.Sprite | null = null;
  if (etiqueta) {
    tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaRotulo(etiqueta, COR.branco, 512, 200, txt(cont.corEtiqueta, COR.coral6)), depthTest: false }));
    tag.position.set(0.25, 0.3, 0.12);
    tag.scale.set(0.36, 0.14, 1);
    tag.renderOrder = 10;
    pageOut.add(tag);
  }
  const { hinge } = rigCalendarPage(model);
  return { model, hinge, ring, tag, accentOut };
}

export const fabricaCalendarioClay: FabricaObjeto = {
  arquivos() {
    // as texturas vêm pelo gancho do img2three.ts (os 15 mapas planos na raiz do public), não por aqui
    return {};
  },
  cria({ objeto: o, props }) {
    // re-render depois de cada textura, como o Calendar3D.tsx (o advance desenha a cena 3D do quadro de novo)
    setImg2ThreeRerender(() => advance(performance.now()));
    const cont = (o.conteudo || {}) as ConteudoCalendario;
    const b = montaCalendario(cont);
    const escala = typeof o.escala === "number" ? o.escala : ESCALA_CALENDARIO;
    const modelo = new THREE.Group();
    modelo.name = "calendario-clay";
    modelo.add(b.model);
    const rb = o.rotacaoBase;
    if (rb && (rb[0] !== 0 || rb[1] !== 0 || rb[2] !== 0)) modelo.rotation.set(rb[0], rb[1], rb[2]);
    const rig = new THREE.Group();
    rig.add(modelo);
    const inicial = estadoInicialCalendario(o);
    const balanco = typeof cont.balanco === "number" ? cont.balanco : 0.02;
    const cam = new THREE.PerspectiveCamera();
    const v = new THREE.Vector3();
    const valor = (c: Canal | undefined, k: string) => (c && typeof c[k] === "number" ? c[k] : inicial[k]);
    const aplicaCanais = (c: Canal | undefined) => {
      setPageFlip(b.hinge, valor(c, "virada"));
      const pv = valor(c, "pagina");
      b.hinge.scale.set(1, Math.max(0.0001, pv), Math.max(0.0001, pv));
      b.hinge.visible = pv > 0.001;
      const mk = valor(c, "marca");
      b.ring.scale.setScalar(Math.max(0.0001, mk));
      b.ring.rotation.z = (1 - mk) * 2.4;
      b.ring.visible = mk > 0.001;
      if (b.tag) {
        b.tag.material.opacity = Math.min(1, mk * 1.6);
        b.tag.scale.set(0.36 * (0.6 + 0.4 * mk), 0.14 * (0.6 + 0.4 * mk), 1);
        b.tag.visible = mk > 0.001;
      }
      b.accentOut.scale.setScalar(1 + 0.3 * valor(c, "pulso"));
      modelo.scale.set(escala * valor(c, "sx"), escala * valor(c, "sy"), escala);
    };
    aplicaCanais(undefined);
    return {
      raiz: rig,
      sombra: o.sombra,
      pinta(st, t) {
        const c = st.canais[o.id];
        aplicaCanais(c);
        // giro da virada e o balanço lento (no modo periódico a frequência fecha o loop, como a camada ambiente)
        const bal = balanco ? Math.sin(t * frequencia(1.3, props.ambiente.periodico, props.duracao)) * balanco : 0;
        rig.rotation.y += valor(c, "giro") + bal;
        // palco da abertura (soco e tremida): a mesma transformação 2D do .stage, no ponto do objeto na tela
        const pc = st.canais[PALCO];
        if (!pc) return;
        const s = num(pc.s, 1);
        const dx = num(pc.x, 0);
        const dy = num(pc.y, 0);
        if (s === 1 && dx === 0 && dy === 0) return;
        const W = props.largura || 1080;
        const H = props.altura || 1920;
        const cr = cameraRender(st.cam, t, props);
        cam.fov = cr.fov;
        cam.aspect = W / H;
        cam.near = 0.005;
        cam.far = 20;
        cam.position.set(cr.x, cr.y, cr.z);
        cam.lookAt(cr.tx, cr.ty, cr.tz);
        cam.updateProjectionMatrix();
        cam.updateMatrixWorld(true);
        v.copy(rig.position).project(cam);
        const ox = W * 0.5;
        const oy = H * 0.58;
        const X = ((v.x + 1) / 2) * W;
        const Y = ((1 - v.y) / 2) * H;
        const X2 = ox + (X - ox) * s + dx;
        const Y2 = oy + (Y - oy) * s + dy;
        v.set((X2 / W) * 2 - 1, 1 - (Y2 / H) * 2, v.z).unproject(cam);
        rig.position.copy(v);
        rig.scale.multiplyScalar(s);
      },
    };
  },
};

export const render: RenderExtensao = {
  objetos: { [TIPO_CALENDARIO]: fabricaCalendarioClay },
  camadas: {
    texto: CamadaTexto,
    imagem: CamadaImagem,
    selo: CamadaSelo,
    marcaTexto: CamadaMarcaTexto,
    pecas: CamadaPecas,
    cta: CamadaCta,
  },
};
