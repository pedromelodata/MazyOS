// Vídeo do reel de 09/10 (reel_c261009, "O sufoco burocrático real"), feito pelo kit de motion em 06/10/2026 a pedido
// do Pedro ("pode fazer a narração você mesmo, desenvolva o vídeo"): a mesa do tradicional (notebook preso no
// carregando, telefone de disco, despertador e calendário) e, no "Legalizaí", o celular abrindo o app.
//  - status: só anda pra frente (roteiro pra editado);
//  - vídeo final: marketing/final/2026-10-09 O sufoco burocrático real/SUFOCO-BUROCRATICO-motion.mp4, rótulo "Motion"
//    e o aviso dos créditos CC BY dos modelos 3D;
//  - legenda do post: a da pasta da peça no kit (saida/legenda-post.txt), com o chamado de seguir e clicar no link da
//    bio na primeira linha (F007, P32) no lugar do "Salva esse vídeo", e o crédito dos modelos 3D;
//  - roteiro: o fecho da fala troca "Comenta aqui se você já viveu isso" por "Segue a gente. E clica no link da bio"
//    (o mesmo fecho da peça de 05/10) e cada cena ganha o que aparece nela, nos tempos do vídeo;
//  - fontes: F007 (lista de espera, na primeira linha da legenda).
// Como os outros aplicar-*.mjs: recusa gravar com o servidor no ar (ele regravaria o banco da memória por cima),
// backup antes de gravar, idempotente, e --simular só mostra (esse pode rodar com o servidor no ar: só lê).
// CRONOGRAMA_DATA troca a pasta de dados (teste numa cópia; aí a porta 4317 não trava).
//   node server/aplicar-video-0910.mjs [--simular]
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { APP, DATA_DIR, DB_PATH, arquivoDados, carregar, salvar, agora } from './db.mjs';
import { STATUS_REEL, conferirReel, roteiroLimpo } from './validar.mjs';
import { PASTA_FINAL } from './videos.mjs';

const SIMULAR = process.argv.includes('--simular');
const ID = 'reel_c261009';
const LEGENDA_KIT = new URL('../../marketing/leo-animado/_kit-motion/pecas/2026-10-09-sufoco-burocratico/saida/legenda-post.txt', import.meta.url);
const ARQUIVO = '2026-10-09 O sufoco burocrático real/SUFOCO-BUROCRATICO-motion.mp4';
const ROTULO = 'Motion';
const AVISO = 'Na legenda do post: créditos dos modelos 3D (celular por polyman Studio e telefone por pan.stasian, CC BY 4.0).';
const STATUS = 'editado';
const NOTA = 'Vídeo feito pelo kit de motion em 06/10, a pedido do Pedro ("pode fazer a narração você mesmo, desenvolva o vídeo"), 24,8 s: a mesa do tradicional em argila (o notebook preso no carregando no "trava", o telefone de disco com o sinal de ocupado na "ligação", o calendário virando na "fila" e o despertador tocando no "esperando") e, no "Legalizaí", o celular abrindo o app; fecho "Vai, Legalizaí" com a pílula LINK DA BIO. Voz numa tomada só, sem aceleração nem emenda, dublada inteira pro Dylan. O fecho da fala virou "Segue a gente. E clica no link da bio" (o mesmo da peça de 05/10) no lugar do "Comenta aqui se você já viveu isso", e a legenda do post abre com o chamado da lista de espera, no lugar do "Salva esse vídeo". Trilha Let\'s Move liberada, prova de colisão sem nenhum cruzamento. O vídeo está em marketing/final/2026-10-09 O sufoco burocrático real, com a capa.';
const FONTES_NOVAS = ['F007 · 01-PLANOS-E-OFERTAS §5 (lista de espera: não cobra, não compromete, avisa quando o app abrir)'];
const CTA = 'É por isso que a gente tá construindo o Legalizaí. Segue a gente. E clica no link da bio.';
const CENAS = [
  { tempo: '0-3,7s', cena: 'A mesa do tradicional em argila fria: notebook, telefone de disco, despertador e calendário. A câmera chega devagar e os ponteiros começam a correr.', fala: 'Você separa a tarde inteira pra resolver uma coisa simples.', tela: 'tarde' },
  { tempo: '3,7-6s', cena: 'Close no notebook: a página fica presa no carregando e o notebook dá um tranco no "trava".', fala: 'Chega no site, trava.', tela: 'trava' },
  { tempo: '6-8,8s', cena: 'Close no telefone de disco: alguém disca e, na "ligação", entra o sinal de ocupado.', fala: 'Liga pro telefone, cai a ligação.', tela: 'ligação' },
  { tempo: '8,8-10,9s', cena: 'O despertador e o calendário: a folha vira na "fila".', fala: 'Vai pessoalmente, fila.', tela: 'fila' },
  { tempo: '10,9-15,3s', cena: 'As folhas do calendário viram, os ponteiros correm e o despertador toca no "esperando".', fala: 'No fim do dia, nada resolvido, e sua empresa parada esperando.', tela: 'resolvido, parada' },
  { tempo: '15,3-18,6s', cena: 'A cena vira pro lado do Legalizaí: o celular gira de frente, a luz coral acende e o app abre na tela inicial.', fala: 'É por isso que a gente tá construindo o Legalizaí.', tela: 'Legalizaí' },
  { tempo: '18,6-24,8s', cena: 'O app fecha no símbolo e entram o "Vai, Legalizaí" e a pílula LINK DA BIO. O fim emenda no começo.', fala: 'Segue a gente. E clica no link da bio.', tela: 'LINK DA BIO' },
];

const portaOcupada = (porta) => new Promise((ok) => {
  const s = net.connect({ host: '127.0.0.1', port: porta });
  s.setTimeout(800);
  s.once('connect', () => { s.destroy(); ok(true); });
  s.once('timeout', () => { s.destroy(); ok(false); });
  s.once('error', () => ok(false));
});
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function ajustar(reel, legendaNova) {
  const mudancas = [];
  const status = STATUS_REEL.indexOf(reel.status) >= STATUS_REEL.indexOf(STATUS) ? reel.status : STATUS;
  if (status !== reel.status) mudancas.push(`status: de ${reel.status} pra ${status}`);
  const legenda = legendaNova.replace(/\r\n/g, '\n').trimEnd();
  if (String(reel.legenda ?? '').trimEnd() !== legenda) mudancas.push('legenda: a do vídeo (kit)');
  const videos = Array.isArray(reel.videos) ? reel.videos.map((v) => ({ ...v })) : [];
  let v = videos.find((x) => x.arquivo === ARQUIVO);
  if (!v) { v = { arquivo: ARQUIVO }; videos.unshift(v); mudancas.push('vídeo final: incluído'); }
  if (v.rotulo !== ROTULO || v.aviso !== AVISO) { v.rotulo = ROTULO; v.aviso = AVISO; mudancas.push('vídeo final: rótulo e aviso'); }
  const r = roteiroLimpo(reel.roteiro);
  const roteiro = roteiroLimpo({ ...r, cenas: CENAS, textoTela: CENAS[0].tela, cta: CTA });
  if (!igual(roteiro, r)) mudancas.push('roteiro: cenas do vídeo e o fecho "Segue a gente"');
  const fontes = Array.isArray(reel.fontes) ? [...reel.fontes] : [];
  for (const f of FONTES_NOVAS) {
    const id = f.split(' ')[0];
    if (!fontes.some((x) => String(x).startsWith(id + ' '))) { fontes.push(f); mudancas.push(`fontes: ${id}`); }
  }
  const notas = String(reel.notas ?? '');
  const notasNovas = notas.includes(NOTA) ? notas : `${NOTA}\n\n${notas}`.trim();
  if (notasNovas !== notas) mudancas.push('notas: como o vídeo foi feito');
  // a mesma validação da tela (status, vídeos e fontes)
  const conferido = conferirReel({ status, videos, fontes }, reel);
  return { status: conferido.status, legenda, videos: conferido.videos, roteiro, fontes: conferido.fontes, notas: notasNovas, mudancas };
}

if (!existsSync(DB_PATH)) { console.error(`o banco ${DB_PATH} não existe`); process.exit(1); }
try {
  if (!statSync(path.join(PASTA_FINAL, ...ARQUIVO.split('/'))).isFile()) throw new Error('não é arquivo');
} catch (e) {
  console.error(`o vídeo ${ARQUIVO} não está na pasta final (${PASTA_FINAL}): ${e.message}`);
  process.exit(1);
}
const legendaNova = await readFile(LEGENDA_KIT, 'utf8');
if (/[–—]/.test(legendaNova)) { console.error('a legenda tem travessão; nada foi gravado'); process.exit(1); }
const original = await readFile(DB_PATH);
const cru = JSON.parse(original.toString('utf8'));
const alvo = (cru.reels ?? []).find((r) => r.id === ID);
if (!alvo) { console.error(`a peça ${ID} não está no banco`); process.exit(1); }
const previa = ajustar(alvo, legendaNova);
if (!previa.mudancas.length) { console.log('Nada mudou: a peça já está com o vídeo.'); process.exit(0); }
console.log(`${SIMULAR ? 'SIMULAÇÃO (nada é gravado)\n' : ''}Dados: ${DATA_DIR}\n${ID}:\n  ${previa.mudancas.join('\n  ')}\n\nLegenda nova:\n${previa.legenda}\n`);
if (SIMULAR) process.exit(0);
const dadosReais = path.resolve(DATA_DIR).toLowerCase() === path.join(APP, 'data').toLowerCase();
if (dadosReais && await portaOcupada(4317)) {
  console.error('Tem um servidor no ar na porta 4317. Pare a Gestão de Marketing antes e rode de novo.');
  process.exit(1);
}

const db = await carregar();
const reel = db.reels.find((r) => r.id === ID);
const feito = ajustar(reel, legendaNova);
reel.status = feito.status;
reel.legenda = feito.legenda;
reel.videos = feito.videos;
reel.roteiro = feito.roteiro;
reel.fontes = feito.fontes;
reel.notas = feito.notas;
reel.atualizadoEm = agora();
reel.atualizadoPor = 'Vídeo do reel de 09/10 (aplicar-video-0910)';
const backup = arquivoDados('db.antes-video-0910.json');
if (!existsSync(backup)) await writeFile(backup, original);
await salvar();
console.log(`Pronto. Backup: ${backup}`);
