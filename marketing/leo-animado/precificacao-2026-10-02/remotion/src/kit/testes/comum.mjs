// Ajudantes comuns dos testes do K02: caminhos, leitura da cena, da narração, das regiões, do fecho e do catálogo.
// Só leitura: quem grava é o escrita.mjs.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { KIT, RM } from "./esbuild-node.mjs";
import { catalogoMinimo } from "./catalogo-minimo.mjs";
import { PY } from "../lib/escrita.mjs";

export { KIT, RM, PY };
export const PECA_GUIA = "guia-pronta-2026-10-14";
export const PASTA_GUIA = path.join(KIT, "pecas", PECA_GUIA);
export const NARRACAO_ORIGINAL = path.join(RM, "src", "guia", "narracao.json");
export const MD5_NARRACAO_REF = "de548fb7302f40fe57156dae9581d467";
export const FECHO_JSON = path.join(KIT, "voz", "fecho", "fecho.json");
export const CATALOGO_PY = path.join(KIT, "catalogos", "catalogo.py");

export const lerJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
export const md5Arquivo = (p) => crypto.createHash("md5").update(fs.readFileSync(p)).digest("hex");

/** cena pelo nome (dentro da pasta da peça do guia) ou pelo caminho */
export function lerCena(nomeOuCaminho, pastaPeca = PASTA_GUIA) {
  const caminho = path.isAbsolute(nomeOuCaminho) ? nomeOuCaminho : path.join(pastaPeca, nomeOuCaminho);
  return { caminho, cena: lerJson(caminho), pasta: path.dirname(caminho) };
}

/** narração da cena; sem o arquivo da peça, a do guia (RM/src/guia/narracao.json) se `fallback` */
export function lerNarracao(cena, pasta, { fallback = true } = {}) {
  const rel = cena.narracao || "voz/narracao.json";
  const caminho = path.join(pasta, rel);
  if (fs.existsSync(caminho)) {
    const md5 = md5Arquivo(caminho);
    return { narracao: lerJson(caminho), origem: caminho, usouFallback: false, md5 };
  }
  if (!fallback) return { narracao: null, origem: caminho, usouFallback: false, falta: true };
  return { narracao: lerJson(NARRACAO_ORIGINAL), origem: NARRACAO_ORIGINAL, usouFallback: true, md5: md5Arquivo(NARRACAO_ORIGINAL), procurado: caminho };
}

/** regiões: inline na cena (devolve null, a cena já tem) ou pelo arquivo que a cena aponta */
export function lerRegioes(cena, pasta) {
  if (typeof cena.regioes !== "string") return { regioes: null, origem: "inline" };
  const caminho = path.join(pasta, cena.regioes);
  if (!fs.existsSync(caminho)) return { regioes: null, origem: caminho, falta: true };
  return { regioes: lerJson(caminho), origem: caminho };
}

/** fecho.json do K03; sem ele, o montaProps usa aiAcende 0,94 */
export function lerFecho() {
  if (fs.existsSync(FECHO_JSON)) return { fecho: lerJson(FECHO_JSON), origem: FECHO_JSON };
  return { fecho: null, origem: "padrão (aiAcende 0.94; KIT/voz/fecho/fecho.json ainda não existe)" };
}

/**
 * Catálogo: 1) KIT_CATALOGO=<arquivo.json> (saída gravada do "catalogo.py exporta");
 * 2) o "catalogo.py exporta" do K01 imprimindo JSON no stdout, se o arquivo existir;
 * 3) o mínimo em memória do K02.
 */
export function carregaCatalogo({ silencioso = false } = {}) {
  const env = process.env.KIT_CATALOGO;
  if (env) {
    return { catalogo: lerJson(env), origem: `KIT_CATALOGO=${env}` };
  }
  if (fs.existsSync(CATALOGO_PY) && process.env.KIT_SEM_K01 !== "1") {
    const r = spawnSync(PY, ["-B", CATALOGO_PY, "exporta"], {
      cwd: path.dirname(CATALOGO_PY),
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1", PYTHONIOENCODING: "utf-8" },
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      timeout: 120000,
    });
    if (r.status === 0 && r.stdout) {
      try {
        const cat = JSON.parse(r.stdout);
        return { catalogo: cat, origem: "catalogo.py exporta (K01)" };
      } catch {
        if (!silencioso) console.warn("aviso: o catalogo.py exporta não imprimiu JSON no stdout; uso o catálogo mínimo do K02");
      }
    } else if (!silencioso) {
      console.warn(`aviso: catalogo.py exporta falhou (código ${r.status}); uso o catálogo mínimo do K02`);
    }
  }
  return { catalogo: catalogoMinimo(), origem: "catálogo mínimo em memória do K02" };
}

/** dorme o ticker do gsap (sem isso o setTimeout dele segura o processo do Node) */
export function dormeTicker(...gs) {
  for (const g of gs) {
    if (g && g.ticker) {
      g.ticker.lagSmoothing(0);
      g.ticker.sleep();
    }
  }
}

/** gerador pseudo-aleatório com semente (mulberry32) */
export function semeado(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function embaralha(lista, semente) {
  const r = semeado(semente);
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
