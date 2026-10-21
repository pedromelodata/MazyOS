// Limpeza dos bancos (Pedro, 21/10/2026: "tirando todas as ideias de banco e deixe tudo zerado por enquanto, tire o
// banco de reels também, deixando apenas os reels que nós fizemos e não aqueles da Gio ... vamos seguir apenas a
// nossa estratégia"). Rode com o servidor PARADO:
//   node server/limpar-bancos-2110.mjs [--simular]
// --simular mostra o que sairia, sem gravar. CRONOGRAMA_DATA troca a pasta de dados (teste numa cópia). Rodar de novo
// não muda nada.
//  1. Banco de Ideias: todas as ideias saem. A peça que veio de uma ideia continua, só sem o vínculo (ideiaId)
//  2. Biblioteca de Reels: saem os formatos da curadoria (origem "curadoria": os 28 da biblioteca.json, montados em
//     cima dos reels de referência da Giullya). Ficam os nossos (origem "teste", T.1 a T.6, tirados dos nossos
//     reels). Peça que usava um formato que saiu fica com o formato escrito (formatoTexto) e sem o formatoId; case
//     pendurado num formato que saiu sai junto
//  3. o que saiu não volta no boot: o id fica em db.sementes (o migrar.mjs não ressuscita semente já vista), mesmo o
//     que ainda não tinha passado por ele
//  4. backup: db.antes-limpeza-2110.json na primeira vez e db.antes-limpeza-2110.ultimo.json a cada rodada
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import { DB_PATH, arquivoDados, carregar, salvar, agora } from './db.mjs';

const SIMULAR = process.argv.includes('--simular');
const PORTA = Number(process.env.PORT) || 4317;
const AUTOR = 'Limpeza dos bancos (limpar-bancos-2110)';
const saiFormato = (f) => f.origem === 'curadoria';

function portaOcupada() {
  return new Promise((ok) => {
    const s = net.connect({ host: '127.0.0.1', port: PORTA });
    s.once('connect', () => { s.destroy(); ok(true); });
    s.once('error', () => ok(false));
    s.setTimeout(1500, () => { s.destroy(); ok(false); });
  });
}
if (!SIMULAR && !process.env.CRONOGRAMA_DATA && (await portaOcupada())) {
  console.error(`O servidor está no ar na porta ${PORTA}. Pare ele antes (systemctl stop gestao-marketing) e rode de novo.`);
  process.exit(1);
}

function aplicar(db) {
  const n = { ideias: 0, formatos: 0, cases: 0, pecasSemIdeia: 0, pecasSemFormato: 0 };
  db.sementes ??= {};
  const semente = (col, ids) => { db.sementes[col] = [...new Set([...(db.sementes[col] ?? []), ...ids])]; };

  // 1. ideias
  const ideias = db.ideias ?? [];
  semente('ideias', ideias.map((i) => i.id));
  n.ideias = ideias.length;
  db.ideias = [];
  for (const r of db.reels) if (r.ideiaId) { r.ideiaId = null; n.pecasSemIdeia++; }

  // 2. formatos da curadoria
  const fora = (db.formatos ?? []).filter(saiFormato);
  const idsFora = new Set(fora.map((f) => f.id));
  semente('formatos', [...idsFora]);
  n.formatos = fora.length;
  db.formatos = db.formatos.filter((f) => !idsFora.has(f.id));
  for (const r of db.reels) {
    if (!idsFora.has(r.formatoId)) continue;
    const f = fora.find((x) => x.id === r.formatoId);
    if (!String(r.formatoTexto ?? '').trim()) r.formatoTexto = `${f.codigo} ${f.nome}`.trim().slice(0, 300);
    r.formatoId = null;
    r.atualizadoEm = agora();
    r.atualizadoPor = AUTOR;
    n.pecasSemFormato++;
  }
  const casesFora = new Set((db.cases ?? []).filter((c) => idsFora.has(c.formatoId)).map((c) => c.id));
  n.cases = casesFora.size;
  db.cases = (db.cases ?? []).filter((c) => !casesFora.has(c.id));
  for (const m of [...(db.instagram?.proprios ?? []), ...(db.instagram?.inspiracoes ?? [])]) if (casesFora.has(m.caseId)) m.caseId = null;
  return n;
}

const original = await readFile(DB_PATH, 'utf8');
const plano = aplicar(JSON.parse(original));
const total = plano.ideias + plano.formatos + plano.cases;
if (total && !SIMULAR) {
  const db = await carregar();
  aplicar(db);
  const primeiro = arquivoDados('db.antes-limpeza-2110.json');
  if (!existsSync(primeiro)) await writeFile(primeiro, original);
  await writeFile(arquivoDados('db.antes-limpeza-2110.ultimo.json'), original);
  await salvar();
}
console.log(`${SIMULAR ? '[simulação] ' : ''}Limpeza dos bancos: ${plano.ideias} ideia(s) do Banco de Ideias, ${plano.formatos} formato(s) da curadoria na Biblioteca de Reels, ${plano.cases} case(s). ${plano.pecasSemIdeia} peça(s) sem o vínculo da ideia, ${plano.pecasSemFormato} peça(s) sem o formato da curadoria (fica o formato escrito).`);
if (!total) console.log('Nada a limpar.');
process.exit(0);
