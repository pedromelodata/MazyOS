// Versão 5 do vídeo do reel de 09/10 (reel_c261009, "O sufoco burocrático real"), 07/10/2026, a pedido do Pedro:
// "O modelo do celular precisa ser 3D"; "está faltando uma construção, 'por isso a gente está construindo o
// Legalizaí'. Depois dessa parte é importante ter algumas funcionalidades, sem ser emissão de nota (...) aí sim
// depois disso tudo que fecha o vídeo".
//  - o celular é o iPhone 3D (polyman Studio, CC BY 4.0, modificado), feito em three.js no Remotion e composto no AE;
//    no "construindo", as peças chegam e se encaixam no contorno que a linha desenha;
//  - depois do "Legalizaí", 6 s sem fala, sobre a trilha: quatro funcionalidades, com as telas do app;
//  - o vídeo vai de 24,8 s para 30,8 s; o fecho é o mesmo;
//  - a legenda do post ganha o crédito do modelo 3D (obrigatório na licença CC BY).
// Como os outros aplicar-*.mjs: recusa gravar com o servidor no ar (ele regravaria o banco da memória por cima),
// backup antes de gravar, idempotente, e --simular só mostra. CRONOGRAMA_DATA troca a pasta de dados (teste numa
// cópia; aí a porta 4317 não trava).
//   node server/aplicar-video-0910-v5.mjs [--simular]
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
const ROTULO = 'Motion (versão 5, After Effects com celular 3D)';
const CREDITO = 'Modelo 3D: celular por polyman Studio (Sketchfab, CC BY 4.0), modificado';
const AVISO = `Versão 5, 30,8 s: o celular agora é 3D e é montado peça por peça no "construindo"; depois do "Legalizaí" entram quatro funcionalidades do app, sem fala, antes do fecho. A legenda do post leva o crédito do modelo 3D: "${CREDITO}".`;
const NOTA = 'Versão 5 do vídeo (07/10), a pedido do Pedro ("o modelo do celular precisa ser 3D"; "está faltando uma construção"; "depois dessa parte é importante ter algumas funcionalidades, sem ser emissão de nota"). O celular é o iPhone 3D do kit (polyman Studio, CC BY 4.0, modificado), renderizado em three.js no Remotion com fundo transparente e composto no After Effects, porque o AE desta máquina não renderiza modelo 3D. No "construindo", as peças chegam e se encaixam no contorno que a linha desenha: a moldura, o vidro de trás e a tela, que pousa pela frente; a tela acende, os blocos da interface se montam e, no "Legalizaí", acende a home do app e o aparelho gira como produto. Depois, 6 s sem fala sobre a trilha (12 batidas, a música segue no compasso), com quatro funcionalidades, uma a cada três batidas, cada uma com a tela real do app: Painel fácil de entender (Início), Alíquota acompanhada (alíquota efetiva e Fator R, F087), Folha e pró-labore em dia (pró-labore; no plano ME o contador cuida da folha, F101/F102) e Obrigações do mês à vista (Tudo em dia). Ficaram de fora a emissão de nota (pedido do Pedro) e o cadastro de funcionário (no app só existe no plano MEI, e a peça é ME). Nas telas das funcionalidades a base esmaece em branco, pra barra de abas com o botão de nota não aparecer. O vídeo vai de 24,8 s para 30,8 s e o fecho é o mesmo. A versão 4 está em marketing/final/_versoes-anteriores.';
const CTA = 'É por isso que a gente tá construindo o Legalizaí. Segue a gente. E clica no link da bio.';
const CENAS = [
  { tempo: '0-3,7s', cena: 'A linha desce e abraça o relógio de parede: os ponteiros correm da manhã até a tarde e, no "tarde", a fatia coral cobre a tarde inteira junto com a linha. No "simples", cai o bilhete com a caixinha vazia.', fala: 'Você separa a tarde inteira pra resolver uma coisa simples.', tela: 'tarde' },
  { tempo: '3,7-6s', cena: 'A câmera desce com a linha até a janela do site: a linha vira a barra de carregamento em cima dela, a seta clica no endereço e, no "trava", a barra para, a página racha, o alerta aparece e a seta clica sem resposta.', fala: 'Chega no site, trava.', tela: 'trava' },
  { tempo: '6-8,8s', cena: 'O fone toca, com as ondas, e a linha passa embaixo dele como o sinal da ligação, ondulando. No "cai", o sinal fica reto e o fone despenca e quica em cima da linha.', fala: 'Liga pro telefone, cai a ligação.', tela: 'ligação' },
  { tempo: '8,8-10,9s', cena: 'A linha vira o chão da fila: as pessoas aparecem em cima dela até a porta, você em coral no fim, e a fila anda devagar. No "fila", você suspira.', fala: 'Vai pessoalmente, fila.', tela: 'fila' },
  { tempo: '10,9-12,9s', cena: 'A linha desenha o horizonte da cidade enquanto o sol se põe, o céu escurece e as janelas acendem. No "nada resolvido", o bilhete volta, a caixinha tenta marcar e não marca; o bilhete treme, os riscos do corte passam por cima dele e ele se parte em pedacinhos, que estouram girando e caem.', fala: 'No fim do dia, nada resolvido,', tela: 'resolvido' },
  { tempo: '12,9-15,3s', cena: 'À noite, a linha contorna a lojinha, com as engrenagens girando. No "parada", elas param, as luzes apagam e o símbolo de pausado, o play num círculo escuro, aparece na porta. No "esperando", a ampulheta vira e a areia escorre.', fala: 'e sua empresa parada esperando.', tela: 'parada' },
  { tempo: '15,3-17,9s', cena: 'A íris coral abre a partir da linha, que fica branca e desenha o contorno do celular com as guias de construção. Dentro do desenho, as peças do iPhone 3D chegam e se encaixam: a moldura, o vidro de trás e a tela, que pousa pela frente e trava no contorno. No "construindo", a tela acende e os blocos da interface se montam um a um. No "Legalizaí", a home do app acende e o aparelho gira como produto, com a câmera avançando.', fala: 'É por isso que a gente tá construindo o Legalizaí.', tela: 'Legalizaí' },
  { tempo: '17,9-24,1s', cena: 'Sem fala, sobre a trilha: quatro funcionalidades, uma a cada três batidas. O celular vira, troca de tela num brilho do vidro e volta, e o nome de cada uma entra no lugar da legenda: o painel de Início, a alíquota efetiva com o Fator R, o pró-labore e o painel Tudo em dia.', fala: '', tela: 'Painel fácil de entender · Alíquota acompanhada · Folha e pró-labore em dia · Obrigações do mês à vista' },
  { tempo: '24,1-30,8s', cena: 'A câmera recua, a íris de papel abre e a linha contorna o Seguir: o toque vira Seguindo, com confete; no "clica", a linha contorna o link da bio e o toque acende ele. A linha desce como um cometa e entra no quadrado do logo, onde o visto branco é desenhado: Vai, Legalizaí e a pílula LINK DA BIO, e o relógio volta pro loop.', fala: 'Segue a gente. E clica no link da bio.', tela: 'LINK DA BIO' },
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
  if (v.rotulo !== ROTULO || v.aviso !== AVISO) { v.rotulo = ROTULO; v.aviso = AVISO; mudancas.push('vídeo final: rótulo e aviso da versão 5'); }
  const r = roteiroLimpo(reel.roteiro);
  const roteiro = roteiroLimpo({ ...r, cenas: CENAS, textoTela: CENAS[0].tela, cta: CTA });
  if (!igual(roteiro, r)) mudancas.push('roteiro: as cenas da versão 5');
  const notas = String(reel.notas ?? '');
  const notasNovas = notas.includes(NOTA) ? notas : `${NOTA}\n\n${notas}`.trim();
  if (notasNovas !== notas) mudancas.push('notas: a versão 5');
  const legenda = String(reel.legenda ?? '');
  const legendaNova = legenda.includes(CREDITO) ? legenda : `${legenda.trimEnd()}\n\n${CREDITO}`;
  if (legendaNova !== legenda) mudancas.push('legenda: o crédito do modelo 3D no fim');
  return { videos, roteiro, notas: notasNovas, legenda: legendaNova, mudancas };
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
if (!previa.mudancas.length) { console.log('Nada mudou: a peça já está com a versão 5.'); process.exit(0); }
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
reel.legenda = feito.legenda;
reel.atualizadoEm = agora();
reel.atualizadoPor = 'Versão 5 do vídeo de 09/10 (aplicar-video-0910-v5)';
const backup = arquivoDados('db.antes-video-0910-v5.json');
if (!existsSync(backup)) await writeFile(backup, original);
await salvar();
console.log(`Pronto. Backup: ${backup}`);
