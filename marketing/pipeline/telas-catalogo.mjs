/**
 * Lê o catálogo de telas do app (FONTE ÚNICA: legalizei/app/src/lib/telas-flow.ts)
 * e devolve GRUPOS como dado JS.
 *
 * Por que transformar em vez de copiar: se a lista virasse cópia aqui, ela
 * envelheceria calada — que é exatamente o problema que o `telas-flow.ts`
 * resolveu no app (2 bugs de copy que só sobreviviam na cópia da demo).
 * O arquivo é TS mas o corpo é literal puro, então bastam 2 remoções.
 */
import { readFileSync } from 'node:fs';

export const APP_SRC = 'C:/PedroProjects/legalizei/app/src/lib/telas-flow.ts';

export function lerGrupos(caminho = APP_SRC) {
  const ts = readFileSync(caminho, 'utf8').replace(/\r\n/g, '\n'); // checkout Windows é CRLF
  const js = ts
    .replace(/export interface [\s\S]*?\n}\n/g, '')   // as 2 interfaces
    .replace(/export const GRUPOS: GrupoTelas\[\] =/, 'const GRUPOS =');

  return new Function(`${js}\nreturn GRUPOS;`)();
}

/** Rota → nome de arquivo estável (querystring vira parte do slug). */
export function slug(rota) {
  return (
    rota
      .replace(/^\//, '')
      .replace(/[?&]/g, '-')
      .replace(/=/g, '-')
      .replace(/\//g, '_') || 'root'
  );
}
