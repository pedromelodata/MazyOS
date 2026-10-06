// Versão 2 do vídeo do reel de 09/10 (reel_c261009, "O sufoco burocrático real"), 06/10/2026, a pedido do Pedro ("achei
// esses assets muito simples, não tem nenhuma animação e nada dinâmico; anime melhor e exemplifique em animação cada
// parte da narração, uma a uma"): uma cena 2D animada por frase, na linguagem do reel de 02/10. A versão 1 (a mesa do
// tradicional em argila) foi pra marketing/final/_versoes-anteriores. Roda depois do aplicar-video-0910.mjs.
//  - status: só anda pra frente (roteiro pra editado);
//  - vídeo final: o mesmo caminho (a versão 2 entrou no lugar da 1), rótulo "Motion (versão 2)"; sem modelo 3D à vista,
//    a legenda não leva crédito;
//  - legenda do post: a da pasta da versão 2 no kit (saida/legenda-post.txt), que é a da versão 1 sem a linha de crédito;
//  - roteiro: cada cena com o que aparece nela na versão 2;
//  - fontes: F007 (lista de espera, na primeira linha da legenda).
// Como os outros aplicar-*.mjs: recusa gravar com o servidor no ar (ele regravaria o banco da memória por cima),
// backup antes de gravar, idempotente, e --simular só mostra (esse pode rodar com o servidor no ar: só lê).
// CRONOGRAMA_DATA troca a pasta de dados (teste numa cópia; aí a porta 4317 não trava).
//   node server/aplicar-video-0910-v2.mjs [--simular]
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { APP, DATA_DIR, DB_PATH, arquivoDados, carregar, salvar, agora } from './db.mjs';
import { STATUS_REEL, conferirReel, roteiroLimpo } from './validar.mjs';
import { PASTA_FINAL } from './videos.mjs';

const SIMULAR = process.argv.includes('--simular');
const ID = 'reel_c261009';
const LEGENDA_KIT = new URL('../../marketing/leo-animado/_kit-motion/pecas/2026-10-09-sufoco-burocratico-v2/saida/legenda-post.txt', import.meta.url);
const ARQUIVO = '2026-10-09 O sufoco burocrático real/SUFOCO-BUROCRATICO-motion.mp4';
const ROTULO = 'Motion (versão 2)';
const AVISO = 'Versão 2: uma cena animada por frase. Sem modelo 3D à vista, a legenda do post não leva crédito.';
const STATUS = 'editado';
const NOTA = 'Versão 2 do vídeo (06/10), a pedido do Pedro ("anime melhor e exemplifique em animação cada parte da narração, uma a uma"): uma cena 2D animada por frase, na linguagem do reel de 02/10, com a mesma narração. O relógio em que a fatia coral cobre a tarde e o bilhete da coisa simples; a janela do site que carrega, empaca e trava, com a seta clicando sem resposta; o fone que toca e despenca, com o sinal de ocupado; você chegando no fim da fila, que a câmera revela inteira até a porta; o sol se pondo atrás da cidade e o bilhete que não marca; a lojinha com a engrenagem que para, as luzes que apagam, a placa de pausa e a ampulheta; no coral, o celular montado bloco por bloco e a tela do app acendendo no Legalizaí; e o perfil com o toque no Seguir e no link da bio. Fecho Vai, Legalizaí com LINK DA BIO. Conferência do kit toda aprovada. A versão 1 (a mesa do tradicional em argila) está em marketing/final/_versoes-anteriores.';
const FONTES_NOVAS = [];
const CTA = 'É por isso que a gente tá construindo o Legalizaí. Segue a gente. E clica no link da bio.';
const CENAS = [
  { tempo: '0-3,7s', cena: 'O relógio de parede: os ponteiros correm da manhã até a tarde e, no "tarde", a fatia coral cobre a tarde inteira, com o solzinho andando na borda. No "simples", cai um bilhete pequeno com uma caixinha vazia.', fala: 'Você separa a tarde inteira pra resolver uma coisa simples.', tela: 'tarde' },
  { tempo: '3,7-6s', cena: 'Fundo escuro: a janela de um site genérico entra, a seta clica no endereço e a barra carrega. No "trava", a página congela, com falha, rachaduras e o alerta, e a seta clica sem resposta.', fala: 'Chega no site, trava.', tela: 'trava' },
  { tempo: '6-8,8s', cena: 'O fone toca e vibra, com as ondas e os pontinhos de chamando. No "cai", as ondas somem, o fone despenca quicando e os pontinhos viram a linha partida, com o sinal de ocupado.', fala: 'Liga pro telefone, cai a ligação.', tela: 'ligação' },
  { tempo: '8,8-10,9s', cena: 'Você, em coral, chega andando no fim da fila. No "fila", a câmera abre e mostra a fila inteira até a porta, e você suspira.', fala: 'Vai pessoalmente, fila.', tela: 'fila' },
  { tempo: '10,9-12,9s', cena: 'O sol desce atrás da cidade, o céu escurece e as janelas acendem. No "nada resolvido", o bilhete volta, a caixinha tenta marcar, não marca e o bilhete treme.', fala: 'No fim do dia, nada resolvido,', tela: 'resolvido' },
  { tempo: '12,9-15,3s', cena: 'Fundo escuro: a lojinha com as engrenagens girando. No "parada", elas param, as luzes apagam e a placa de pausa balança na porta. No "esperando", a ampulheta vira e a areia escorre.', fala: 'e sua empresa parada esperando.', tela: 'parada' },
  { tempo: '15,3-18,6s', cena: 'A íris abre no coral: o contorno do celular se desenha e, no "construindo", os blocos da tela chegam um a um. No "Legalizaí", a tela acende no app, com raios e brilhos.', fala: 'É por isso que a gente tá construindo o Legalizaí.', tela: 'Legalizaí' },
  { tempo: '18,6-24,8s', cena: 'O perfil: o toque no Seguir vira Seguindo, com confete coral; no "clica", o toque acende o link da bio. Depois, Vai, Legalizaí e a pílula LINK DA BIO, e o corte de loop volta pro relógio.', fala: 'Segue a gente. E clica no link da bio.', tela: 'LINK DA BIO' },
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
  if (String(reel.legenda ?? '').trimEnd() !== legenda) mudancas.push('legenda: a da versão 2 (sem crédito de modelo 3D)');
  const videos = Array.isArray(reel.videos) ? reel.videos.map((v) => ({ ...v })) : [];
  let v = videos.find((x) => x.arquivo === ARQUIVO);
  if (!v) { v = { arquivo: ARQUIVO }; videos.unshift(v); mudancas.push('vídeo final: incluído'); }
  if (v.rotulo !== ROTULO || v.aviso !== AVISO) { v.rotulo = ROTULO; v.aviso = AVISO; mudancas.push('vídeo final: rótulo e aviso'); }
  const r = roteiroLimpo(reel.roteiro);
  const roteiro = roteiroLimpo({ ...r, cenas: CENAS, textoTela: CENAS[0].tela, cta: CTA });
  if (!igual(roteiro, r)) mudancas.push('roteiro: as cenas da versão 2');
  const fontes = Array.isArray(reel.fontes) ? [...reel.fontes] : [];
  for (const f of FONTES_NOVAS) {
    const id = f.split(' ')[0];
    if (!fontes.some((x) => String(x).startsWith(id + ' '))) { fontes.push(f); mudancas.push(`fontes: ${id}`); }
  }
  const notas = String(reel.notas ?? '');
  const notasNovas = notas.includes(NOTA) ? notas : `${NOTA}\n\n${notas}`.trim();
  if (notasNovas !== notas) mudancas.push('notas: a versão 2');
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
if (!previa.mudancas.length) { console.log('Nada mudou: a peça já está com a versão 2.'); process.exit(0); }
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
reel.atualizadoPor = 'Versão 2 do vídeo de 09/10 (aplicar-video-0910-v2)';
const backup = arquivoDados('db.antes-video-0910-v2.json');
if (!existsSync(backup)) await writeFile(backup, original);
await salvar();
console.log(`Pronto. Backup: ${backup}`);
