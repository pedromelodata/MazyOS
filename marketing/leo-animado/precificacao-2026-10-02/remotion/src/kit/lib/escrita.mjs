// Escrita segura do kit em Node (contrato: KIT/DESENHO.md, seção 4.12; dono K02).
// Mesmas regras do KIT/lib/escrita.py: grava num temporário na mesma pasta e troca com fs.renameSync;
// recusa destino com st_nlink > 1 sem {forca: true}; recusa sempre caminho protegido (seção 13);
// não cria pasta sem {criaPasta: true}.
// Nunca é importado pelo bundle do Remotion (usa node:fs). Uso: import { gravaJson } from ".../escrita.mjs".
// Autoteste: node escrita.mjs --autoteste <pasta>   (prova as recusas e a troca atômica na pasta dada)

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export class EscritaRecusada extends Error {
  constructor(msg) {
    super(msg);
    this.name = "EscritaRecusada";
  }
}

export class DiscoInsuficiente extends Error {
  constructor(msg) {
    super(msg);
    this.name = "DiscoInsuficiente";
  }
}

// ---------- caminhos ----------
const MKT = "c:/mkt-insta/content legalizai/marketing";
const LEO = MKT + "/leo-animado";
const KIT = LEO + "/_kit-motion";
const PR = LEO + "/precificacao-2026-10-02";
const RM = PR + "/remotion";
const GP = LEO + "/guia-pronta-2026-10-14";
const AB = LEO + "/abertura-mes-2026-10-01";
const EXT = LEO + "/_assets-externos";
const FINAL = MKT + "/final";
const BASE = "c:/mkt-insta/content legalizai/_base-contabil";
const MEM = "c:/users/edit-admin/.claude/projects/c--mkt-insta/memory";
const LEGALIZEI = "c:/legalizei";
const VIDEOS = "c:/users/edit-admin/videos";

export const PASTAS = { KIT, PR, RM, GP, AB, EXT, FINAL, BASE, MEM, VIDEOS };

/** caminho absoluto, com o nome longo do Windows (expande EDIT-A~1), barras normais e minúsculas */
export function canonico(caminho) {
  let abs = path.resolve(String(caminho));
  try {
    abs = fs.realpathSync.native(abs);
  } catch {
    // arquivo ainda não existe: resolve a pasta mais próxima que existe e cola o resto
    const resto = [];
    let atual = abs;
    for (let i = 0; i < 64; i++) {
      const pai = path.dirname(atual);
      resto.unshift(path.basename(atual));
      if (pai === atual) break;
      atual = pai;
      try {
        abs = path.join(fs.realpathSync.native(atual), ...resto);
        break;
      } catch {
        // continua subindo
      }
    }
  }
  return abs.normalize("NFC").replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
}

const dentro = (p, pasta) => p === pasta || p.startsWith(pasta + "/");

// Regras de intocáveis (seção 13), as mesmas do KIT/lib/escrita.py (K01): [rótulo, tipo, caminho, exceções].
// "pasta": o caminho e tudo abaixo; "arquivo": só ele; "prefixo": pastas logo abaixo cujo nome começa com o prefixo.
const REGRAS = [
  ["RM/src/guia/", "pasta", RM + "/src/guia", []],
  ["RM/src/abertura/", "pasta", RM + "/src/abertura", []],
  ["RM/src/motion/", "pasta", RM + "/src/motion", []],
  ["RM/src/parts/", "pasta", RM + "/src/parts", []],
  ["RM/src/lib/", "pasta", RM + "/src/lib", []],
  ["RM/src/data/", "pasta", RM + "/src/data", []],
  ["RM/src/Motion.tsx", "arquivo", RM + "/src/motion.tsx", []],
  ["RM/src/Broll.tsx", "arquivo", RM + "/src/broll.tsx", []],
  ["RM/src/Leo.tsx", "arquivo", RM + "/src/leo.tsx", []],
  ["RM/src/Root.tsx (só o K06 acrescenta os dois registros, fora deste ajudante)", "arquivo", RM + "/src/root.tsx", []],
  ["RM/src/index.ts", "arquivo", RM + "/src/index.ts", []],
  ["RM/stills.mjs", "arquivo", RM + "/stills.mjs", []],
  ["RM/remotion.config.ts", "arquivo", RM + "/remotion.config.ts", []],
  ["RM/package.json", "arquivo", RM + "/package.json", []],
  ["RM/package-lock.json", "arquivo", RM + "/package-lock.json", []],
  ["RM/tsconfig.json", "arquivo", RM + "/tsconfig.json", []],
  ["RM/node_modules/", "pasta", RM + "/node_modules", []],
  ["RM/bin/", "pasta", RM + "/bin", []],
  ["RM/public*/ (menos RM/public-kit/)", "prefixo", RM + "/public", ["public-kit"]],
  ["PR/ (menos RM/src/kit/ e RM/public-kit/)", "pasta", PR, [RM + "/src/kit", RM + "/public-kit"]],
  ["GP/", "pasta", GP, []],
  ["AB/", "pasta", AB, []],
  ["EXT/ (menos EXT/kit-2026-10/)", "pasta", EXT, [EXT + "/kit-2026-10"]],
  ["FINAL/", "pasta", FINAL, []],
  ["marketing/telas-app*/", "prefixo", MKT + "/telas-app", []],
  ["C:/Legalizei/", "pasta", LEGALIZEI, []],
  ["BASE/", "pasta", BASE, []],
  ["MEM/", "pasta", MEM, []],
  ["KIT/DESENHO.md", "arquivo", KIT + "/desenho.md", []],
  ["KIT/scripts/capturar-telas.mjs", "arquivo", KIT + "/scripts/capturar-telas.mjs", []],
  ["REF (_referencia.json)", "arquivo", KIT + "/pecas/guia-pronta-2026-10-14/_referencia.json", []],
  ["REF (_referencia/)", "pasta", KIT + "/pecas/guia-pronta-2026-10-14/_referencia", []],
  ["Vídeos/ (outro hardlink do V4; só leitura)", "pasta", VIDEOS, []],
];

/** rótulo da regra da seção 13 que protege o caminho, ou null */
export function protegidoMotivo(caminho) {
  const p = canonico(caminho);
  for (const [rotulo, tipo, base, excecoes] of REGRAS) {
    if (tipo === "arquivo") {
      if (p === base) return rotulo;
    } else if (tipo === "pasta") {
      if (dentro(p, base) && !excecoes.some((e) => dentro(p, e))) return rotulo;
    } else if (tipo === "prefixo") {
      const pai = base.slice(0, base.lastIndexOf("/"));
      const prefixo = base.slice(base.lastIndexOf("/") + 1);
      if (p.startsWith(pai + "/")) {
        const primeiro = p.slice(pai.length + 1).split("/")[0];
        if (primeiro.startsWith(prefixo) && excecoes.indexOf(primeiro) < 0) return rotulo;
      }
    }
  }
  return null;
}

/** verdadeiro pra qualquer caminho da lista de intocáveis da seção 13 do DESENHO */
export function protegido(caminho) {
  return protegidoMotivo(caminho) !== null;
}

// ---------- disco ----------
export function livreMb(raiz = "C:/") {
  const s = fs.statfsSync(raiz);
  return (Number(s.bavail) * Number(s.bsize)) / (1024 * 1024);
}

export function exigeDisco(minimoMb, motivo = "") {
  const livre = livreMb();
  if (livre < minimoMb) {
    throw new DiscoInsuficiente(
      `disco: ${livre.toFixed(0)} MB livres no C:, precisa de ${minimoMb} MB${motivo ? " (" + motivo + ")" : ""}`,
    );
  }
  return livre;
}

export function md5(caminho) {
  return crypto.createHash("md5").update(fs.readFileSync(caminho)).digest("hex");
}

// ---------- gravação ----------
function confereDestino(destino, forca) {
  const motivo = protegidoMotivo(destino);
  if (motivo) {
    throw new EscritaRecusada(`recusado: ${destino} é caminho protegido (${motivo}; DESENHO.md seção 13)`);
  }
  let lst = null;
  try {
    lst = fs.lstatSync(destino);
  } catch {
    lst = null;
  }
  if (lst) {
    if (lst.isSymbolicLink()) throw new EscritaRecusada(`recusado: ${destino} é link simbólico; grave num caminho novo`);
    const st = fs.statSync(destino);
    if (st.isDirectory()) throw new EscritaRecusada(`recusado: ${destino} é uma pasta`);
    if (st.nlink > 1 && !forca) {
      throw new EscritaRecusada(`recusado: ${destino} é hardlink (st_nlink ${st.nlink}); grave num caminho novo`);
    }
  }
}

function confirmaPasta(pasta, criaPasta) {
  if (fs.existsSync(pasta)) return;
  if (!criaPasta) throw new EscritaRecusada(`recusado: a pasta ${pasta} não existe (passe {criaPasta: true})`);
  if (protegido(pasta)) throw new EscritaRecusada(`recusado: ${pasta} é caminho protegido`);
  fs.mkdirSync(pasta, { recursive: true });
}

/** grava bytes por temporário na mesma pasta + fsync + rename (troca atômica) */
export function gravaBytes(caminho, dados, { forca = false, criaPasta = false } = {}) {
  const destino = path.resolve(caminho);
  confereDestino(destino, forca);
  const pasta = path.dirname(destino);
  confirmaPasta(pasta, criaPasta);
  const tmp = path.join(pasta, `.tmp-${process.pid}-${crypto.randomBytes(4).toString("hex")}-${path.basename(destino)}`);
  let fd;
  try {
    fd = fs.openSync(tmp, "wx");
    fs.writeSync(fd, dados);
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;
    fs.renameSync(tmp, destino);
  } catch (e) {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch {
        // nada
      }
    }
    try {
      fs.unlinkSync(tmp);
    } catch {
      // o temporário pode nem ter sido criado
    }
    throw e;
  }
  return { caminho: destino, tamanho: dados.length };
}

/** texto em UTF-8 com fim de linha \n */
export function gravaTexto(caminho, texto, opcoes = {}) {
  const limpo = String(texto).replace(/\r\n/g, "\n");
  return gravaBytes(caminho, Buffer.from(limpo, "utf8"), opcoes);
}

/** JSON com indentação 2, sem escapar acento, e \n no fim */
export function gravaJson(caminho, obj, opcoes = {}) {
  return gravaTexto(caminho, JSON.stringify(obj, null, 2) + "\n", opcoes);
}

/** hardlink conferido (tamanho igual, mesmo inode, st_nlink >= 2). Destino em FINAL só com permiteFinal. */
export function liga(origem, destino, { permiteFinal = false, criaPasta = false } = {}) {
  const o = path.resolve(origem);
  const d = path.resolve(destino);
  if (!fs.existsSync(o)) throw new Error(`origem não existe: ${o}`);
  const naFinal = dentro(canonico(d), FINAL);
  if (naFinal && !permiteFinal) throw new EscritaRecusada(`recusado: ${d} fica dentro de FINAL (só o kit.py entregar liga lá)`);
  const motivo = protegidoMotivo(d);
  if (motivo && !(naFinal && permiteFinal)) throw new EscritaRecusada(`recusado: ${d} é caminho protegido (${motivo}; DESENHO.md seção 13)`);
  const so = fs.statSync(o, { bigint: true });
  const info = (s) => ({ origem: o, destino: d, tamanho: Number(s.size), st_ino: s.ino.toString(), st_nlink: Number(s.nlink) });
  if (fs.existsSync(d)) {
    const sd = fs.statSync(d, { bigint: true });
    if (sd.ino === so.ino && sd.dev === so.dev) return info(sd);
    throw new EscritaRecusada(`recusado: ${d} já existe e é outro arquivo`);
  }
  confirmaPasta(path.dirname(d), criaPasta);
  fs.linkSync(o, d);
  const s2 = fs.statSync(d, { bigint: true });
  if (s2.size !== so.size || s2.ino !== so.ino || s2.nlink < 2n) {
    throw new Error(`hardlink não confere: ${d} (tamanho ${s2.size}, st_nlink ${s2.nlink})`);
  }
  return info(s2);
}

// ---------- autoteste ----------
function autoteste(pasta) {
  const raiz = path.resolve(pasta);
  if (!fs.existsSync(raiz)) throw new Error(`a pasta do autoteste não existe: ${raiz}`);
  if (protegido(raiz)) throw new Error(`a pasta do autoteste é protegida: ${raiz}`);
  const dir = path.join(raiz, `escrita-autoteste-${process.pid}`);
  fs.mkdirSync(dir);
  const res = [];
  const ok = (nome, cond) => {
    res.push([nome, !!cond]);
    console.log(`${cond ? "ok  " : "FALHA"} ${nome}`);
  };
  const recusa = (fn) => {
    try {
      fn();
      return false;
    } catch (e) {
      return e instanceof EscritaRecusada;
    }
  };
  try {
    const a = path.join(dir, "a.txt");
    gravaTexto(a, "um\r\ndois\n");
    ok("grava e troca o fim de linha por \\n", fs.readFileSync(a, "utf8") === "um\ndois\n");
    gravaTexto(a, "três\n");
    ok("regrava arquivo com st_nlink 1", fs.readFileSync(a, "utf8") === "três\n");
    ok("nenhum temporário sobrando", fs.readdirSync(dir).filter((n) => n.startsWith(".tmp-")).length === 0);
    const b = path.join(dir, "b.txt");
    const lig = liga(a, b);
    ok("liga cria hardlink conferido (st_nlink 2)", lig.st_nlink === 2 && fs.readFileSync(b, "utf8") === "três\n");
    ok("liga de novo no mesmo inode não faz nada", liga(a, b).st_nlink === 2);
    ok("recusa gravar por cima de hardlink sem forca", recusa(() => gravaTexto(a, "quatro\n")));
    gravaTexto(a, "quatro\n", { forca: true });
    ok("com forca troca só a entrada da pasta (o outro link fica com o conteúdo antigo)",
      fs.readFileSync(a, "utf8") === "quatro\n" && fs.readFileSync(b, "utf8") === "três\n");
    const c = path.join(dir, "c.txt");
    gravaTexto(c, "outro\n");
    ok("liga recusa destino que já é outro arquivo", recusa(() => liga(a, c)));
    ok("recusa pasta inexistente sem criaPasta", recusa(() => gravaTexto(path.join(dir, "nova", "x.txt"), "x")));
    gravaJson(path.join(dir, "nova", "x.json"), { texto: "Legalizaí" }, { criaPasta: true });
    ok("gravaJson com criaPasta e acento sem escape",
      fs.readFileSync(path.join(dir, "nova", "x.json"), "utf8") === '{\n  "texto": "Legalizaí"\n}\n');
    const casos = [
      [RM + "/src/guia/coreografia.ts", true],
      [RM + "/src/Root.tsx", true],
      [RM + "/tsconfig.json", true],
      [RM + "/public-guia/telas/tela-inicio.png", true],
      [RM + "/public-kit/pecas/x/telas/a.png", false],
      [RM + "/src/kit/nucleo/tipos.ts", false],
      [PR + "/src/sfx.py", true],
      [GP + "/mix_guia.py", true],
      [EXT + "/mixkit/sfx/a.wav", true],
      [EXT + "/kit-2026-10/sfx/a.wav", false],
      [FINAL + "/2026-10-14 x/a.mp4", true],
      [MKT + "/telas-app-2026-10-02/inicio.png", true],
      [KIT + "/DESENHO.md", true],
      [KIT + "/pecas/guia-pronta-2026-10-14/_referencia.json", true],
      [KIT + "/pecas/guia-pronta-2026-10-14/_referencia/narracao.json", true],
      [KIT + "/pecas/guia-pronta-2026-10-14/cenas.json", false],
      ["C:/Users/EDIT-A~1/.claude/projects/c--MKT-INSTA/memory/MEMORY.md", true],
      [BASE + "/FATOS.md", true],
      ["C:/Users/EDIT-ADMIN/Videos/GUIA-PRONTA-motion-v4.mp4", true],
      [RM + "/public/qualquer.png", true],
      [RM + "/README.md", true],
      [RM + "/src/kit/render/KitMotion.tsx", false],
      [KIT + "/catalogos/trilhas/base.json", false],
    ];
    for (const [cam, esperado] of casos) ok(`protegido(${cam}) = ${esperado}`, protegido(cam) === esperado);
    ok("recusa gravar em caminho protegido", recusa(() => gravaTexto(RM + "/src/guia/nao-existe.txt", "x")));
    ok("livreMb devolve número", Number.isFinite(livreMb()));
  } finally {
    // apaga só o que o autoteste criou
    fs.rmSync(dir, { recursive: true, force: true });
  }
  const falhas = res.filter((r) => !r[1]).length;
  console.log(`\nautoteste: ${res.length - falhas} de ${res.length} ok`);
  return falhas === 0;
}

const ehPrincipal = !!process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (ehPrincipal && process.argv[2] === "--autoteste") {
  const pasta = process.argv[3];
  if (!pasta) {
    console.error("uso: node escrita.mjs --autoteste <pasta>");
    process.exit(2);
  }
  process.exit(autoteste(pasta) ? 0 : 1);
}
