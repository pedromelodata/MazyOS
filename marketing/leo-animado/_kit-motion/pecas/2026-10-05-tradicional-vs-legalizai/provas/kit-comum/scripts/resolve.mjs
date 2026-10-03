// Plugin do esbuild que trata pastas fora do RM como se estivessem em RM/src/kit/ext/<nome>/ (rascunho e cópia de
// segurança), pra provar uma extensão antes de publicar. Cada árvore (raiz) diz que nomes de extensão ela tem: um
// import relativo que cai em RM/src/kit/ext/<nome>/ vai pra raiz quando ela tem esse nome; o resto vai pro RM real.
import fs from "node:fs";
import path from "node:path";

export const RM = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion";
export const EXT = path.join(RM, "src", "kit", "ext");

const low = (p) => path.resolve(p).toLowerCase();
const dentro = (p, base) => low(p) === low(base) || low(p).startsWith(low(base) + path.sep);

function acha(base) {
  for (const ext of ["", ".ts", ".tsx", ".js", ".mjs", "/index.ts", "/index.tsx"]) {
    if (fs.existsSync(base + ext) && fs.statSync(base + ext).isFile()) return base + ext;
  }
  return null;
}

/** arvores: [{raiz: pasta com subpastas <nome>/, nomes: [nomes de extensão que ela substitui]}] */
export function pluginArvores(arvores) {
  return {
    name: "arvores-como-ext",
    setup(build) {
      build.onResolve({ filter: /^\.\.?\// }, (a) => {
        if (!a.importer) return undefined;
        const imp = path.resolve(a.importer);
        const arv = arvores.find((x) => dentro(imp, x.raiz));
        let dirVirtual = path.dirname(imp);
        if (arv) dirVirtual = path.join(EXT, path.relative(arv.raiz, path.dirname(imp)));
        const alvo = path.resolve(dirVirtual, a.path);
        if (arv && dentro(alvo, EXT)) {
          const rel = path.relative(EXT, alvo);
          const nome = rel.split(path.sep)[0];
          if (arv.nomes.indexOf(nome) >= 0) {
            const r = acha(path.join(arv.raiz, rel));
            if (r) return { path: r };
            return { errors: [{ text: `não achei ${a.path} na árvore ${arv.raiz} (${rel})` }] };
          }
        }
        const r = acha(alvo);
        if (r) return { path: r };
        return { errors: [{ text: `não achei ${a.path} (de ${imp})` }] };
      });
    },
  };
}
