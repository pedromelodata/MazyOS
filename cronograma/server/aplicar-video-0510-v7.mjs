// Versão 7 do reel de 05/10 (reel_93834bb1), 06/10/2026: a animação refeita a pedido do Pedro ("uma linha que desça de
// cima para baixo e, conforme ela vai descendo, os motions vão acontecendo, de uma forma que tudo fique conectado nessa
// linha... ela só não pode ser sem graça"). Uma linha só, contínua, num plano-sequência que a câmera acompanha sem
// corte, com a mesma voz gravada pelo Pedro e a mesma legenda da v6. Nenhum modelo 3D aparece na tela, então a linha
// do crédito CC BY sai da legenda. O vídeo fica no mesmo caminho da pasta Final (a v6 foi pra _versoes-anteriores).
//  - legenda do post: a da pasta da peça no kit (saida/legenda-post.txt), curta, com emoji e sem hashtag (reels-leo §10);
//  - vídeo final: rótulo e aviso da versão 7.
// Como os outros aplicar-*.mjs: recusa gravar com o servidor no ar (ele regravaria o banco da memória por cima),
// backup antes de gravar, idempotente, e --simular só mostra (esse pode rodar com o servidor no ar: só lê). Com
// CRONOGRAMA_DATA numa cópia (teste), a porta 4317 não trava.
//   node server/aplicar-video-0510-v7.mjs [--simular]
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { APP, DATA_DIR, DB_PATH, arquivoDados, carregar, salvar, agora } from './db.mjs';

const SIMULAR = process.argv.includes('--simular');
const ID = 'reel_93834bb1';
const LEGENDA_KIT = new URL('../../marketing/leo-animado/_kit-motion/pecas/2026-10-05-tradicional-vs-legalizai-v7/saida/legenda-post.txt', import.meta.url);
const ARQUIVO = '2026-10-05 Contabilidade tradicional vs Legalizaí/TRADICIONAL-VS-LEGALIZAI-motion.mp4';
const ROTULO = 'Motion (versão 7)';
const AVISO = 'Versão 7: a linha que desce, num plano-sequência, com a voz gravada pelo Pedro. Nenhum modelo 3D aparece, então a legenda sai sem crédito CC BY.';
const NOTA = 'Versão 7 do vídeo (06/10): a animação refeita a pedido do Pedro ("uma linha que desça de cima para baixo e, conforme ela vai descendo, os motions vão acontecendo, de uma forma que tudo fique conectado nessa linha"). Uma linha só, contínua, que a câmera acompanha sem corte. Na abertura, ela sublinha a papelada do tradicional, vira o raio do "vs" e desenha o visto embaixo do celular. No antes, é tinta: costura a papelada, vira o caminho até o escritório e se enrola em volta do relógio da espera. No "Agora", acende em coral e desenha o celular, a guia, o contador, o coração do cuidado e os botões de Seguir e do link da bio, até o visto do logo no fecho. A voz e a legenda são as da v6 (a legenda sem o crédito 3D, porque nenhum modelo 3D aparece). Conferência do kit toda aprovada. A v6 está em marketing/final/_versoes-anteriores.';

const portaOcupada = (porta) => new Promise((ok) => {
  const s = net.connect({ host: '127.0.0.1', port: porta });
  s.setTimeout(800);
  s.once('connect', () => { s.destroy(); ok(true); });
  s.once('timeout', () => { s.destroy(); ok(false); });
  s.once('error', () => ok(false));
});

function ajustar(reel, legendaNova) {
  const mudancas = [];
  const legenda = legendaNova.replace(/\r\n/g, '\n').trimEnd();
  if (String(reel.legenda ?? '').trimEnd() !== legenda) mudancas.push('legenda: a da versão 7 (sem o crédito 3D)');
  const videos = Array.isArray(reel.videos) ? reel.videos.map((v) => ({ ...v })) : [];
  let v = videos.find((x) => x.arquivo === ARQUIVO);
  if (!v) { v = { arquivo: ARQUIVO }; videos.unshift(v); mudancas.push('vídeo final: incluído'); }
  if (v.rotulo !== ROTULO || v.aviso !== AVISO) { v.rotulo = ROTULO; v.aviso = AVISO; mudancas.push('vídeo final: rótulo e aviso da versão 7'); }
  const notas = String(reel.notas ?? '');
  const notasNovas = notas.includes(NOTA) ? notas : `${NOTA}\n\n${notas}`.trim();
  if (notasNovas !== notas) mudancas.push('notas: o que mudou na versão 7');
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
if (!previa.mudancas.length) { console.log('Nada mudou: a peça já está com a versão 7.'); process.exit(0); }
console.log(`${SIMULAR ? 'SIMULAÇÃO (nada é gravado)\n' : ''}${ID}:\n  ${previa.mudancas.join('\n  ')}\n\nLegenda nova:\n${previa.legenda}\n`);
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
reel.atualizadoPor = 'Versão 7 do vídeo de 05/10 (aplicar-video-0510-v7)';
const backup = arquivoDados('db.antes-video-0510-v7.json');
if (!existsSync(backup)) await writeFile(backup, original);
await salvar();
console.log(`Pronto. Backup: ${backup}`);
