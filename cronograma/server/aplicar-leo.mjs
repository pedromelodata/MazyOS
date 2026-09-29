// Aplica a reescrita da skill reels-leo (ideias e reels, mesmos ids) no banco. Rodar com o servidor PARADO.
// Uso: node server/aplicar-leo.mjs <pasta com ideias.json e reels.json>
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { carregar, salvar, DB_PATH } from './db.mjs';
import { regravarSeGerado } from './reelmd.mjs';

const pasta = process.argv[2];
if (!pasta) throw new Error('Informe a pasta com ideias.json e reels.json.');
const ler = async (n) => JSON.parse(await readFile(path.join(pasta, n), 'utf8'));
const TRACO = /[\u2014\u2013]/;

const ideias = await ler('ideias.json');
const reels = await ler('reels.json');
for (const x of [...ideias, ...reels]) if (TRACO.test(JSON.stringify(x))) throw new Error(`travessão em ${x.id}`);

await copyFile(DB_PATH, DB_PATH.replace(/\.json$/, '.antes-leo.json'));
const db = await carregar();
const agora = new Date().toISOString();
let ni = 0, nr = 0;
for (const nova of ideias) {
  const i = db.ideias.findIndex((x) => x.id === nova.id);
  if (i < 0) continue;
  db.ideias[i] = { ...db.ideias[i], ...nova, reelId: db.ideias[i].reelId, atualizadoEm: agora };
  ni++;
}
const mexidos = [];
for (const novo of reels) {
  const i = db.reels.findIndex((x) => x.id === novo.id);
  if (i < 0 || ['gravado', 'publicado'].includes(db.reels[i].status)) continue;
  const { origem, origemChat, calendario, criadoEm, ...campos } = novo;
  db.reels[i] = { ...db.reels[i], ...campos, atualizadoEm: agora };
  if (db.reels[i].status === 'ideia' && db.reels[i].roteiro?.cenas?.length) db.reels[i].status = 'roteiro';
  mexidos.push(db.reels[i]);
  nr++;
}
await salvar();
for (const r of mexidos) await regravarSeGerado(r).catch((e) => console.log(`reel.md de ${r.id}: ${e.message}`));
console.log(`ideias atualizadas: ${ni} · reels atualizados: ${nr}`);
