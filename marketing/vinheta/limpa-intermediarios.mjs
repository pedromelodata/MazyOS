// Remove os intermediários de UM aspecto depois do compose — disco é o
// recurso raro nesta máquina (111GB, chegou a 0 livre em 10/08). Tudo aqui é
// regenerável por script: base (render-base --stream) e 3D (simbolo3d.py).
//
//   node limpa-intermediarios.mjs 16x9
import { rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const ASPECT = process.argv[2];
if (!['16x9', '9x16'].includes(ASPECT)) throw new Error(`aspecto inválido: ${ASPECT}`);

for (const p of [
  join(AQUI, `frames-base-${ASPECT}.mp4`),
  join(AQUI, `frames-base-${ASPECT}`),
  join(AQUI, 'blender', `out-${ASPECT}`),
]) {
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
    console.log('[limpa] removido:', p);
  }
}
