// Volta do reel de 05/10 (reel_93834bb1) pra versão 6, 06/10/2026, a pedido do Pedro: a linha que desce era pro reel
// de 09/10 (O sufoco burocrático real), não pra este ("não era esse vídeo, preciso que volte ele para a versão
// original"). A v7 ficou em marketing/final/_versoes-anteriores com o sufixo -v7, e a v6 voltou pro caminho da pasta
// Final.
//  - legenda do post: a da v6 (saida/legenda-post.txt da peça v6 no kit), com o crédito dos modelos 3D;
//  - vídeo final: rótulo e aviso da versão 6;
//  - notas: sai o parágrafo da v7 e entra uma linha dizendo o que houve.
// Como os outros aplicar-*.mjs: recusa gravar com o servidor no ar (ele regravaria o banco da memória por cima),
// backup antes de gravar, idempotente, e --simular só mostra. Com CRONOGRAMA_DATA numa cópia (teste), a porta 4317
// não trava.
//   node server/aplicar-video-0510-volta-v6.mjs [--simular]
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { APP, DATA_DIR, DB_PATH, arquivoDados, carregar, salvar, agora } from './db.mjs';

const SIMULAR = process.argv.includes('--simular');
const ID = 'reel_93834bb1';
const LEGENDA_KIT = new URL('../../marketing/leo-animado/_kit-motion/pecas/2026-10-05-tradicional-vs-legalizai-v6/saida/legenda-post.txt', import.meta.url);
const ARQUIVO = '2026-10-05 Contabilidade tradicional vs Legalizaí/TRADICIONAL-VS-LEGALIZAI-motion.mp4';
const ROTULO = 'Motion (versão 6)';
const AVISO = 'Na legenda do post: créditos dos modelos 3D (celular por polyman Studio e telefone por pan.stasian, CC BY 4.0). Versão 6: a narração gravada pelo Pedro, no tempo dela, e o cartão Web design · Principal vindo na cara de quem vê.';
const INICIO_V7 = 'Versão 7 do vídeo (06/10): a animação refeita a pedido do Pedro';
const NOTA = 'De volta à versão 6 (06/10), a pedido do Pedro: a linha que desce era pro reel de 09/10 (O sufoco burocrático real), não pra este. A versão 7 ficou em marketing/final/_versoes-anteriores, com o sufixo -v7.';

const portaOcupada = (porta) => new Promise((ok) => {
  const s = net.connect({ host: '127.0.0.1', port: porta });
  s.setTimeout(800);
  s.once('connect', () => { s.destroy(); ok(true); });
  s.once('timeout', () => { s.destroy(); ok(false); });
  s.once('error', () => ok(false));
});

function semV7(notas) {
  return notas.split('\n\n').filter((p) => !p.startsWith(INICIO_V7)).join('\n\n');
}

function ajustar(reel, legendaNova) {
  const mudancas = [];
  const legenda = legendaNova.replace(/\r\n/g, '\n').trimEnd();
  if (String(reel.legenda ?? '').trimEnd() !== legenda) mudancas.push('legenda: a da versão 6 (com o crédito 3D)');
  const videos = Array.isArray(reel.videos) ? reel.videos.map((v) => ({ ...v })) : [];
  let v = videos.find((x) => x.arquivo === ARQUIVO);
  if (!v) { v = { arquivo: ARQUIVO }; videos.unshift(v); mudancas.push('vídeo final: incluído'); }
  if (v.rotulo !== ROTULO || v.aviso !== AVISO) { v.rotulo = ROTULO; v.aviso = AVISO; mudancas.push('vídeo final: rótulo e aviso da versão 6'); }
  const notas = String(reel.notas ?? '');
  let notasNovas = semV7(notas);
  if (!notasNovas.includes(NOTA)) notasNovas = `${NOTA}\n\n${notasNovas}`.trim();
  if (notasNovas !== notas) mudancas.push('notas: sai a v7, entra a volta pra v6');
  return { legenda, videos, notas: notasNovas, mudancas };
}

if (!existsSync(DB_PATH)) { console.error(`o banco ${DB_PATH} não existe`); process.exit(1); }
const legendaNova = await readFile(LEGENDA_KIT, 'utf8');
if (/[\u2013\u2014]/.test(legendaNova)) { console.error('a legenda tem travessão; nada foi gravado'); process.exit(1); }
if (/(^|\s)#[\p{L}\d_]/u.test(legendaNova)) { console.error('a legenda tem hashtag; nada foi gravado'); process.exit(1); }
const original = await readFile(DB_PATH);
const cru = JSON.parse(original.toString('utf8'));
const alvo = (cru.reels ?? []).find((r) => r.id === ID);
if (!alvo) { console.error(`a peça ${ID} não está no banco`); process.exit(1); }
const previa = ajustar(alvo, legendaNova);
if (!previa.mudancas.length) { console.log('Nada mudou: a peça já está na versão 6.'); process.exit(0); }
console.log(`${SIMULAR ? 'SIMULAÇÃO (nada é gravado)\n' : ''}${ID}:\n  ${previa.mudancas.join('\n  ')}\n`);
if (SIMULAR) process.exit(0);
const dadosReais = path.resolve(DATA_DIR).toLowerCase() === path.join(APP, 'data').toLowerCase();
if (dadosReais && await portaOcupada(4317)) {
  console.error('Tem um servidor no ar na porta 4317. Pare a Gestão de Marketing antes e rode de novo.');
  process.exit(1);
}

const db = await carregar();
const reel = db.reels.find((r) => r.id === ID);
const feito = ajustar(reel, legendaNova);
reel.legenda = feito.legenda;
reel.videos = feito.videos;
reel.notas = feito.notas;
reel.atualizadoEm = agora();
reel.atualizadoPor = 'Volta do vídeo de 05/10 pra versão 6 (aplicar-video-0510-volta-v6)';
const backup = arquivoDados('db.antes-video-0510-volta-v6.json');
if (!existsSync(backup)) await writeFile(backup, original);
await salvar();
console.log(`Pronto. Backup: ${backup}`);
