// Versão 4 do vídeo do reel de 09/10 (reel_c261009, "O sufoco burocrático real"), 07/10/2026, com os quatro ajustes
// que o Pedro pediu em cima da versão 3:
//   1. o bilhete do "fim do dia" é picotado em pedacinhos, que caem girando;
//   2. a empresa parada leva o símbolo de pausado (o play num círculo escuro), no lugar das duas barrinhas;
//   3. o celular do "construindo o Legalizaí" ganha guias de construção mais fortes, giro de produto com desfoque
//      de movimento e a tela de home do app no lugar da splash;
//   4. o fecho perde o risco que sobrava: a linha chega como cometa e desenha o visto branco dentro do logo.
// Mesma narração, trilha e efeitos das versões 2 e 3. A versão 3 foi pra marketing/final/_versoes-anteriores.
//  - vídeo final: o mesmo caminho, rótulo "Motion (versão 4, After Effects)";
//  - roteiro: as cenas com o que aparece nelas na versão 4;
//  - a legenda do post não muda (a curta de 06/10, sem hashtag; sem modelo 3D, sem crédito).
// Como os outros aplicar-*.mjs: recusa gravar com o servidor no ar (ele regravaria o banco da memória por cima),
// backup antes de gravar, idempotente, e --simular só mostra. CRONOGRAMA_DATA troca a pasta de dados (teste numa
// cópia; aí a porta 4317 não trava).
//   node server/aplicar-video-0910-v4.mjs [--simular]
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { APP, DATA_DIR, DB_PATH, arquivoDados, carregar, salvar, agora } from './db.mjs';
import { roteiroLimpo } from './validar.mjs';
import { PASTA_FINAL } from './videos.mjs';

const SIMULAR = process.argv.includes('--simular');
const ID = 'reel_c261009';
const ARQUIVO = '2026-10-09 O sufoco burocrático real/SUFOCO-BUROCRATICO-motion.mp4';
const ROTULO = 'Motion (versão 4, After Effects)';
const AVISO = 'Versão 4, montada no After Effects: a linha que desce e liga as cenas, agora com o bilhete picotado, o símbolo de pausado, o celular com guias de construção e a home do app, e o fecho em que a linha desenha o visto. Sem modelo 3D à vista, a legenda do post não leva crédito.';
const NOTA = 'Versão 4 do vídeo (07/10), com os quatro ajustes pedidos pelo Pedro em cima da versão 3. (1) O bilhete do "fim do dia" é cortado em doze pedacinhos, que estouram pra fora girando e caem com gravidade, depois de o bilhete tremer e os riscos do corte passarem por cima. (2) A empresa parada leva o símbolo de pausado, o play dentro de um círculo escuro, no lugar das duas barrinhas. (3) O celular do "construindo o Legalizaí" ganha guias de construção mais fortes (linhas de projeto que cruzam o quadro, contorno duplo no sentido contrário, marcas nos cantos e um pulso quando fecha), um giro de produto com desfoque de movimento junto com o avanço da câmera, luz atrás do aparelho, brilho passando no vidro, e a tela de home do app no lugar da splash. (4) No fecho não sobra risco: a linha vira um cometa que desce do link da bio e entra no quadrado do logo, e o visto branco é desenhado dentro dele. Mesma narração, trilha e efeitos das versões 2 e 3. Projeto em marketing/leo-animado/sufoco-linha-ae. A versão 3 está em marketing/final/_versoes-anteriores.';
const CTA = 'É por isso que a gente tá construindo o Legalizaí. Segue a gente. E clica no link da bio.';
const CENAS = [
  { tempo: '0-3,7s', cena: 'A linha desce e abraça o relógio de parede: os ponteiros correm da manhã até a tarde e, no "tarde", a fatia coral cobre a tarde inteira junto com a linha. No "simples", cai o bilhete com a caixinha vazia.', fala: 'Você separa a tarde inteira pra resolver uma coisa simples.', tela: 'tarde' },
  { tempo: '3,7-6s', cena: 'A câmera desce com a linha até a janela do site: a linha vira a barra de carregamento em cima dela, a seta clica no endereço e, no "trava", a barra para, a página racha, o alerta aparece e a seta clica sem resposta.', fala: 'Chega no site, trava.', tela: 'trava' },
  { tempo: '6-8,8s', cena: 'O fone toca, com as ondas, e a linha passa embaixo dele como o sinal da ligação, ondulando. No "cai", o sinal fica reto e o fone despenca e quica em cima da linha.', fala: 'Liga pro telefone, cai a ligação.', tela: 'ligação' },
  { tempo: '8,8-10,9s', cena: 'A linha vira o chão da fila: as pessoas aparecem em cima dela até a porta, você em coral no fim, e a fila anda devagar. No "fila", você suspira.', fala: 'Vai pessoalmente, fila.', tela: 'fila' },
  { tempo: '10,9-12,9s', cena: 'A linha desenha o horizonte da cidade enquanto o sol se põe, o céu escurece e as janelas acendem. No "nada resolvido", o bilhete volta, a caixinha tenta marcar e não marca; o bilhete treme, os riscos do corte passam por cima dele e ele se parte em pedacinhos, que estouram girando e caem.', fala: 'No fim do dia, nada resolvido,', tela: 'resolvido' },
  { tempo: '12,9-15,3s', cena: 'À noite, a linha contorna a lojinha, com as engrenagens girando. No "parada", elas param, as luzes apagam e o símbolo de pausado, o play num círculo escuro, aparece na porta. No "esperando", a ampulheta vira e a areia escorre.', fala: 'e sua empresa parada esperando.', tela: 'parada' },
  { tempo: '15,3-18,6s', cena: 'A íris coral abre a partir da linha, que fica branca e desenha o celular enquanto as guias de construção cruzam o quadro e marcam os cantos; no "construindo", os blocos da tela chegam um a um. No "Legalizaí", a tela acende na home do app, o aparelho gira como produto, com desfoque de movimento e um brilho passando no vidro.', fala: 'É por isso que a gente tá construindo o Legalizaí.', tela: 'Legalizaí' },
  { tempo: '18,6-24,8s', cena: 'A íris de papel abre e a linha contorna o Seguir: o toque vira Seguindo, com confete; no "clica", a linha contorna o link da bio e o toque acende ele. A linha desce como um cometa e entra no quadrado do logo, onde o visto branco é desenhado: Vai, Legalizaí e a pílula LINK DA BIO, e o relógio volta pro loop.', fala: 'Segue a gente. E clica no link da bio.', tela: 'LINK DA BIO' },
];

const portaOcupada = (porta) => new Promise((ok) => {
  const s = net.connect({ host: '127.0.0.1', port: porta });
  s.setTimeout(800);
  s.once('connect', () => { s.destroy(); ok(true); });
  s.once('timeout', () => { s.destroy(); ok(false); });
  s.once('error', () => ok(false));
});
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function ajustar(reel) {
  const mudancas = [];
  const videos = Array.isArray(reel.videos) ? reel.videos.map((v) => ({ ...v })) : [];
  let v = videos.find((x) => x.arquivo === ARQUIVO);
  if (!v) { v = { arquivo: ARQUIVO }; videos.unshift(v); mudancas.push('vídeo final: incluído'); }
  if (v.rotulo !== ROTULO || v.aviso !== AVISO) { v.rotulo = ROTULO; v.aviso = AVISO; mudancas.push('vídeo final: rótulo e aviso da versão 4'); }
  const r = roteiroLimpo(reel.roteiro);
  const roteiro = roteiroLimpo({ ...r, cenas: CENAS, textoTela: CENAS[0].tela, cta: CTA });
  if (!igual(roteiro, r)) mudancas.push('roteiro: as cenas da versão 4');
  const notas = String(reel.notas ?? '');
  const notasNovas = notas.includes(NOTA) ? notas : `${NOTA}\n\n${notas}`.trim();
  if (notasNovas !== notas) mudancas.push('notas: a versão 4');
  return { videos, roteiro, notas: notasNovas, mudancas };
}

if (!existsSync(DB_PATH)) { console.error(`o banco ${DB_PATH} não existe`); process.exit(1); }
try {
  if (!statSync(path.join(PASTA_FINAL, ...ARQUIVO.split('/'))).isFile()) throw new Error('não é arquivo');
} catch (e) {
  console.error(`o vídeo ${ARQUIVO} não está na pasta final (${PASTA_FINAL}): ${e.message}`);
  process.exit(1);
}
const original = await readFile(DB_PATH);
const cru = JSON.parse(original.toString('utf8'));
const alvo = (cru.reels ?? []).find((r) => r.id === ID);
if (!alvo) { console.error(`a peça ${ID} não está no banco`); process.exit(1); }
const previa = ajustar(alvo);
if (!previa.mudancas.length) { console.log('Nada mudou: a peça já está com a versão 4.'); process.exit(0); }
console.log(`${SIMULAR ? 'SIMULAÇÃO (nada é gravado)\n' : ''}Dados: ${DATA_DIR}\n${ID}:\n  ${previa.mudancas.join('\n  ')}\n`);
if (SIMULAR) process.exit(0);
const dadosReais = path.resolve(DATA_DIR).toLowerCase() === path.join(APP, 'data').toLowerCase();
if (dadosReais && await portaOcupada(4317)) {
  console.error('Tem um servidor no ar na porta 4317. Pare a Gestão de Marketing antes e rode de novo.');
  process.exit(1);
}

const db = await carregar();
const reel = db.reels.find((r) => r.id === ID);
const feito = ajustar(reel);
reel.videos = feito.videos;
reel.roteiro = feito.roteiro;
reel.notas = feito.notas;
reel.atualizadoEm = agora();
reel.atualizadoPor = 'Versão 4 do vídeo de 09/10 (aplicar-video-0910-v4)';
const backup = arquivoDados('db.antes-video-0910-v4.json');
if (!existsSync(backup)) await writeFile(backup, original);
await salvar();
console.log(`Pronto. Backup: ${backup}`);
