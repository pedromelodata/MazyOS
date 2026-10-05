// Versão 4 do reel de 05/10 (reel_93834bb1): a v3 com a narração corrigida a pedido do Pedro (05/10 à noite): "app" dito
// "ép" na voz (o texto continua "app"), "atividade" no lugar de CNAE ("com a atividade certa") e a fala do contador com
// menos pausas. A v3, feita em 05/10 à tarde a pedido do Pedro, trouxe: abertura em tela dividida na diagonal (o embate, com raio e VS), a espera no Tradicional (despertador e
// calendário), o CNAE certo e cada passo no app, "No plano do Simples, tem um contador de verdade", o celular maior no
// meio e modelos 3D detalhados. O vídeo fica no mesmo caminho da pasta Final (a v2 foi pra _versoes-anteriores).
//  - legenda do post: a da pasta da peça no kit (saida/legenda-post.txt), com o chamado de seguir e clicar no link
//    da bio na primeira linha (F007, P32) e "plano ME (Simples Nacional)" (F003, P06);
//  - vídeo final: rótulo e aviso da versão 3 (créditos CC BY dos modelos 3D);
//  - fontes: F047 (o processo entra certo e a pessoa vê cada passo) e F003 (plano ME no Simples Nacional).
// Como os outros aplicar-*.mjs: recusa gravar com o servidor no ar (ele regravaria o banco da memória por cima),
// backup antes de gravar, idempotente, e --simular só mostra (esse pode rodar com o servidor no ar: só lê).
//   node server/aplicar-video-0510-v4.mjs [--simular]
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import { DB_PATH, arquivoDados, carregar, salvar, agora } from './db.mjs';

const SIMULAR = process.argv.includes('--simular');
const ID = 'reel_93834bb1';
const LEGENDA_KIT = new URL('../../marketing/leo-animado/_kit-motion/pecas/2026-10-05-tradicional-vs-legalizai-v4/saida/legenda-post.txt', import.meta.url);
const ARQUIVO = '2026-10-05 Contabilidade tradicional vs Legalizaí/TRADICIONAL-VS-LEGALIZAI-motion.mp4';
const ROTULO = 'Motion (versão 4)';
const AVISO = 'Na legenda do post: créditos dos modelos 3D (celular por polyman Studio e telefone por pan.stasian, CC BY 4.0). Versão 4: a v3 com a narração corrigida ("app" dito "ép", "atividade certa", a fala do contador sem pausas).';
const NOTA = 'Versão 4 do vídeo (05/10, à noite): a v3 com a narração corrigida. "app" agora é dito "ép" (só na voz; legenda e textos continuam "app"), "CNAE" virou "atividade" ("Agora é tudo pelo app, com a atividade certa e cada passo na sua tela.") e "No plano do Simples tem um contador de verdade com registro no CRC" sai sem pausas. A v3 está em marketing/final/_versoes-anteriores. Versão 3 do vídeo (05/10, à tarde): abertura em tela dividida na diagonal com raio e VS; no Tradicional, papel, ida ao escritório e espera pra ser atendido (despertador com os ponteiros correndo e calendário virando); no app, o CNAE certo e cada passo na tela; "No plano do Simples, tem um contador de verdade, com registro no CRC" (a legenda do post diz plano ME, Simples Nacional, por causa do MEI); celular maior no meio; modelos 3D detalhados; "Segue a gente. E clica no link da bio". Ajustes ao vault: sem "tempo recorde" (P01) e sem "melhores alíquotas" (P04). Prova de colisão do kit com zero cruzamento. As versões 1 e 2 estão em marketing/final/_versoes-anteriores.';
const FONTES_NOVAS = [];

const portaOcupada = (porta) => new Promise((ok) => {
  const s = net.connect({ host: '127.0.0.1', port: porta });
  s.once('connect', () => { s.destroy(); ok(true); });
  s.once('error', () => ok(false));
});

function ajustar(reel, legendaNova) {
  const mudancas = [];
  const legenda = legendaNova.replace(/\r\n/g, '\n').trimEnd();
  if (String(reel.legenda ?? '').trimEnd() !== legenda) mudancas.push('legenda: a da versão 4 ("com a atividade certa")');
  const videos = Array.isArray(reel.videos) ? reel.videos.map((v) => ({ ...v })) : [];
  let v = videos.find((x) => x.arquivo === ARQUIVO);
  if (!v) { v = { arquivo: ARQUIVO }; videos.unshift(v); mudancas.push('vídeo final: incluído'); }
  if (v.rotulo !== ROTULO || v.aviso !== AVISO) { v.rotulo = ROTULO; v.aviso = AVISO; mudancas.push('vídeo final: rótulo e aviso da versão 4'); }
  const fontes = Array.isArray(reel.fontes) ? [...reel.fontes] : [];
  for (const f of FONTES_NOVAS) {
    const id = f.split(' ')[0];
    if (!fontes.some((x) => String(x).startsWith(id + ' '))) { fontes.push(f); mudancas.push(`fontes: ${id}`); }
  }
  const notas = String(reel.notas ?? '');
  const notasNovas = notas.includes(NOTA) ? notas : `${NOTA}\n\n${notas}`.trim();
  if (notasNovas !== notas) mudancas.push('notas: o que mudou na versão 4');
  return { legenda, videos, fontes, notas: notasNovas, mudancas };
}

if (!existsSync(DB_PATH)) { console.error(`o banco ${DB_PATH} não existe`); process.exit(1); }
const legendaNova = await readFile(LEGENDA_KIT, 'utf8');
if (/[\u2013\u2014]/.test(legendaNova)) { console.error('a legenda tem travessão; nada foi gravado'); process.exit(1); }
const original = await readFile(DB_PATH);
const cru = JSON.parse(original.toString('utf8'));
const alvo = (cru.reels ?? []).find((r) => r.id === ID);
if (!alvo) { console.error(`a peça ${ID} não está no banco`); process.exit(1); }
const previa = ajustar(alvo, legendaNova);
if (!previa.mudancas.length) { console.log('Nada mudou: a peça já está com a versão 4.'); process.exit(0); }
console.log(`${SIMULAR ? 'SIMULAÇÃO (nada é gravado)\n' : ''}${ID}:\n  ${previa.mudancas.join('\n  ')}\n\nLegenda nova:\n${previa.legenda}\n`);
if (SIMULAR) process.exit(0);
if (await portaOcupada(4317)) {
  console.error('Tem um servidor no ar na porta 4317. Pare a Gestão de Marketing antes e rode de novo.');
  process.exit(1);
}

const db = await carregar();
const reel = db.reels.find((r) => r.id === ID);
const feito = ajustar(reel, legendaNova);
reel.legenda = feito.legenda;
reel.videos = feito.videos;
reel.fontes = feito.fontes;
reel.notas = feito.notas;
reel.atualizadoEm = agora();
reel.atualizadoPor = 'Versão 4 do vídeo de 05/10 (aplicar-video-0510-v4)';
const backup = arquivoDados('db.antes-video-0510-v4.json');
if (!existsSync(backup)) await writeFile(backup, original);
await salvar();
console.log(`Pronto. Backup: ${backup}`);
