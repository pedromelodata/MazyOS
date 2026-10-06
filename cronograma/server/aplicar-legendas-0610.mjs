// Legendas novas de 06/10/2026, a pedido do Pedro ("legendas não precisam mais de hashtags; use a skill direito e
// faça uma legenda menor e mais assertiva com emojis"), nos dois reels com vídeo pronto:
//  - reel_93834bb1 (05/10, Contabilidade tradicional vs Legalizaí, versão 6);
//  - reel_c261009 (09/10, O sufoco burocrático real, versão 2).
// A legenda de cada um vem da pasta da peça no kit (saida/legenda-post.txt): a CTA da narração abre e fecha, de 2 a 4
// linhas curtas no meio, cada uma com um emoji, sem hashtag (skill reels-leo §10). As fontes que a legenda nova deixou
// de usar saem da lista (05/10: F020 e F045; 09/10: F138).
// Como os outros aplicar-*.mjs: recusa gravar com o servidor no ar (ele regravaria o banco da memória por cima),
// backup antes de gravar, idempotente, e --simular só mostra. Com CRONOGRAMA_DATA numa cópia (teste), a porta 4317 não
// trava.
//   node server/aplicar-legendas-0610.mjs [--simular]
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { APP, DATA_DIR, DB_PATH, arquivoDados, carregar, salvar, agora } from './db.mjs';

const SIMULAR = process.argv.includes('--simular');
const KIT = '../../marketing/leo-animado/_kit-motion/pecas/';
const PLANO = [
  { id: 'reel_93834bb1', legenda: new URL(KIT + '2026-10-05-tradicional-vs-legalizai-v6/saida/legenda-post.txt', import.meta.url), saem: ['F020', 'F045'] },
  { id: 'reel_c261009', legenda: new URL(KIT + '2026-10-09-sufoco-burocratico-v2/saida/legenda-post.txt', import.meta.url), saem: ['F138'] },
];
const NOTA = 'Legenda nova (06/10), a pedido do Pedro: curta e assertiva, com emoji e sem hashtag (skill reels-leo §10).';

const portaOcupada = (porta) => new Promise((ok) => {
  const s = net.connect({ host: '127.0.0.1', port: porta });
  s.setTimeout(800);
  s.once('connect', () => { s.destroy(); ok(true); });
  s.once('timeout', () => { s.destroy(); ok(false); });
  s.once('error', () => ok(false));
});

function ajustar(reel, legendaNova, saem) {
  const mudancas = [];
  const legenda = legendaNova.replace(/\r\n/g, '\n').trimEnd();
  if (String(reel.legenda ?? '').trimEnd() !== legenda) mudancas.push('legenda: a nova, curta e sem hashtag');
  const fontesAntes = Array.isArray(reel.fontes) ? reel.fontes : [];
  const fontes = fontesAntes.filter((f) => !saem.some((id) => String(f).startsWith(id + ' ')));
  if (fontes.length !== fontesAntes.length) mudancas.push(`fontes: saem ${saem.filter((id) => fontesAntes.some((f) => String(f).startsWith(id + ' '))).join(', ')}`);
  const notas = String(reel.notas ?? '');
  const notasNovas = notas.includes(NOTA) ? notas : `${NOTA}\n\n${notas}`.trim();
  if (notasNovas !== notas) mudancas.push('notas: a legenda nova');
  return { legenda, fontes, notas: notasNovas, mudancas };
}

if (!existsSync(DB_PATH)) { console.error(`o banco ${DB_PATH} não existe`); process.exit(1); }
const legendas = {};
for (const p of PLANO) {
  const t = await readFile(p.legenda, 'utf8');
  if (/[–—]/.test(t)) { console.error(`${p.id}: a legenda tem travessão; nada foi gravado`); process.exit(1); }
  if (/(^|\s)#[\p{L}\d_]/u.test(t)) { console.error(`${p.id}: a legenda tem hashtag; nada foi gravado`); process.exit(1); }
  legendas[p.id] = t;
}
const original = await readFile(DB_PATH);
const cru = JSON.parse(original.toString('utf8'));
let total = 0;
for (const p of PLANO) {
  const alvo = (cru.reels ?? []).find((r) => r.id === p.id);
  if (!alvo) { console.error(`a peça ${p.id} não está no banco`); process.exit(1); }
  const previa = ajustar(alvo, legendas[p.id], p.saem);
  total += previa.mudancas.length;
  console.log(`${p.id}: ${previa.mudancas.length ? previa.mudancas.join('; ') : 'sem mudança'}`);
}
if (!total) { console.log('Nada mudou: as duas peças já estão com a legenda nova.'); process.exit(0); }
if (SIMULAR) { console.log('SIMULAÇÃO: nada foi gravado.'); process.exit(0); }
const dadosReais = path.resolve(DATA_DIR).toLowerCase() === path.join(APP, 'data').toLowerCase();
if (dadosReais && await portaOcupada(4317)) {
  console.error('Tem um servidor no ar na porta 4317. Pare a Gestão de Marketing antes e rode de novo.');
  process.exit(1);
}

const db = await carregar();
for (const p of PLANO) {
  const reel = db.reels.find((r) => r.id === p.id);
  const feito = ajustar(reel, legendas[p.id], p.saem);
  if (!feito.mudancas.length) continue;
  reel.legenda = feito.legenda;
  reel.fontes = feito.fontes;
  reel.notas = feito.notas;
  reel.atualizadoEm = agora();
  reel.atualizadoPor = 'Legenda nova de 06/10 (aplicar-legendas-0610)';
}
const backup = arquivoDados('db.antes-legendas-0610.json');
if (!existsSync(backup)) await writeFile(backup, original);
await salvar();
console.log(`Pronto. Backup: ${backup}`);
