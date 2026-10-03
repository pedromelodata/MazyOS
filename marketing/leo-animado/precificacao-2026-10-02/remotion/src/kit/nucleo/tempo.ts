// Resolvedor de Tempo (contrato: KIT/DESENHO.md, seção 4.1; dono K02).
// W(i) e We(i) são o início e o fim da palavra i da narração. Tempo que cai fora de [0, duracao] é erro.
import type { Narracao, Tempo } from "./tipos";

export class ErroTempo extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ErroTempo";
  }
}

export type Relogio = {
  W(i: number): number;
  We(i: number): number;
  /** resolve um Tempo; `base` é o t da batida (pra {desloc}); `onde` entra na mensagem de erro */
  t(x: Tempo, base?: number, onde?: string): number;
  /** confere se um instante já calculado está dentro do vídeo (erro claro se não estiver) */
  confere(v: number, onde?: string): number;
  tFecho: number | null;
  duracao: number;
  aiAcende: number;
  marcas: Record<string, number>;
};

const TOLERANCIA = 1e-9;

const descreve = (x: unknown) => {
  try {
    return JSON.stringify(x);
  } catch {
    return String(x);
  }
};

export function criaRelogio(o: {
  narracao: Narracao;
  tFecho: number | null;
  duracao: number;
  marcas?: Record<string, number>;
  aiAcende?: number;
}): Relogio {
  const palavras = o.narracao.words;
  const marcas = o.marcas || {};
  const aiAcende = o.aiAcende === undefined ? 0.94 : o.aiAcende;
  const palavra = (i: number, onde?: string) => {
    if (typeof i !== "number" || !Number.isInteger(i) || i < 0 || i >= palavras.length) {
      throw new ErroTempo(
        `${onde ? onde + ": " : ""}índice de palavra inválido: ${descreve(i)} (a narração tem ${palavras.length} palavras, de 0 a ${palavras.length - 1})`,
      );
    }
    return palavras[i];
  };
  const confere = (v: number, onde?: string) => {
    if (typeof v !== "number" || !isFinite(v)) {
      throw new ErroTempo(`${onde ? onde + ": " : ""}tempo inválido (${descreve(v)})`);
    }
    if (v < -TOLERANCIA || v > o.duracao + TOLERANCIA) {
      throw new ErroTempo(
        `${onde ? onde + ": " : ""}tempo fora do vídeo: ${v.toFixed(3)} s (o vídeo vai de 0 a ${o.duracao} s)`,
      );
    }
    return v;
  };
  const t = (x: Tempo, base?: number, onde?: string): number => {
    let v: number;
    if (typeof x === "number") {
      v = x;
    } else if (x && typeof x === "object") {
      const q = x as Record<string, unknown>;
      const desloc = typeof q.desloc === "number" ? (q.desloc as number) : 0;
      if ("palavra" in q) {
        const p = palavra(q.palavra as number, onde);
        v = (q.borda === "fim" ? p.e : p.s) + desloc;
      } else if ("fecho" in q) {
        if (o.tFecho === null || o.tFecho === undefined) {
          throw new ErroTempo(`${onde ? onde + ": " : ""}tempo preso ao fecho, mas a peça não tem tFecho`);
        }
        const n = q.fecho === "aiAcende" ? aiAcende : (q.fecho as number);
        if (typeof n !== "number") throw new ErroTempo(`${onde ? onde + ": " : ""}fecho inválido: ${descreve(q.fecho)}`);
        v = o.tFecho + n + desloc;
      } else if ("fim" in q) {
        v = o.duracao + (q.fim as number);
      } else if ("marca" in q) {
        const m = marcas[q.marca as string];
        if (typeof m !== "number") {
          throw new ErroTempo(`${onde ? onde + ": " : ""}marca inexistente: ${descreve(q.marca)} (a cena declara: ${Object.keys(marcas).join(", ") || "nenhuma"})`);
        }
        v = m + desloc;
      } else if ("desloc" in q) {
        if (typeof base !== "number") {
          throw new ErroTempo(`${onde ? onde + ": " : ""}{desloc} só vale dentro da batida (falta o t de referência)`);
        }
        v = base + desloc;
      } else {
        throw new ErroTempo(`${onde ? onde + ": " : ""}tempo inválido: ${descreve(x)}`);
      }
    } else {
      throw new ErroTempo(`${onde ? onde + ": " : ""}tempo inválido: ${descreve(x)}`);
    }
    return confere(v, onde);
  };
  return {
    W: (i: number) => palavra(i).s,
    We: (i: number) => palavra(i).e,
    t,
    confere,
    tFecho: o.tFecho,
    duracao: o.duracao,
    aiAcende,
    marcas,
  };
}

/** fim da última palavra + 0,44 (a regra do tFecho "auto", seção 4.5) */
export function tFechoAuto(narracao: Narracao): number {
  const ult = narracao.words[narracao.words.length - 1];
  return ult.e + 0.44;
}
