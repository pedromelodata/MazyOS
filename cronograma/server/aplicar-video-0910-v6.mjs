// Versão 6 do vídeo do reel de 09/10 (reel_c261009, "O sufoco burocrático real"), 07/10/2026, a pedido do Pedro:
// "Faltou narração e mais detalhamento das atividades e funcionalidades do App. E cada detalhamento além de aparecer
// só o celular deve conter assests, motions representativos da funcionalidade. Capriche!"
//  - depois do "construindo o Legalizaí", cinco falas novas (o mesmo clone do Pedro convertido pro Dylan, como o resto
//    do reel), uma cena por fala: o celular 3D de um lado, com a tela real do app, e do outro os assets animados da
//    funcionalidade, cada ação na palavra da fala;
//  - o vídeo vai de 30,8 s pra 44,8 s; o fecho é o mesmo;
//  - a legenda do post continua com o crédito do modelo 3D (CC BY).
// Como os outros aplicar-*.mjs: recusa gravar com o servidor no ar (ele regravaria o banco da memória por cima),
// backup antes de gravar, idempotente, e --simular só mostra. CRONOGRAMA_DATA troca a pasta de dados (teste numa
// cópia; aí a porta 4317 não trava).
//   node server/aplicar-video-0910-v6.mjs [--simular]
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
const ROTULO = 'Motion (versão 6, funcionalidades narradas)';
const CREDITO = 'Modelo 3D: celular por polyman Studio (Sketchfab, CC BY 4.0), modificado';
const AVISO = `Versão 6, 44,8 s: depois do "construindo o Legalizaí", cinco funcionalidades narradas, cada uma com o celular 3D e assets animados (painel, imposto e guia, alíquota, avisos de prazo e o contador do plano ME). A legenda do post leva o crédito do modelo 3D: "${CREDITO}".`;
const NOTA = 'Versão 6 do vídeo (07/10), a pedido do Pedro ("faltou narração e mais detalhamento das atividades e funcionalidades do App; cada detalhamento, além do celular, deve ter assets e motions representativos da funcionalidade; capriche"). Depois do "construindo o Legalizaí" entram cinco falas novas, no mesmo clone do Pedro convertido pro Dylan: "Um painel fácil de entender, com quanto entrou e o imposto do mês." "O imposto vem calculado, e a guia chega pronta." "Sua alíquota é acompanhada todo mês." "A gente avisa cada prazo, no app e no WhatsApp." "E, pra quem é microempresa, um contador de verdade cuida da folha e das declarações." Fatos: FATOS linha 307 (o sistema soma o faturamento, calcula o imposto e emite a guia; a Legalizaí avisa prazos pelo app e pelo WhatsApp; no ME o contador entrega as declarações), linha 743 (acompanha a alíquota todo mês), F013 e F101/F102 (contador com CRC no plano ME, que cuida da folha). Sem Fator R (P15), sem número nos assets (P36), sem "a gente paga a guia" (P21); "pra quem é microempresa" no lugar de "plano ME" (na voz convertida o "ME" virava "M"). Uma cena por fala, com o celular 3D de um lado, virado pros assets, e os assets do outro, a linha branca saindo do celular e contornando o cartão: o painel com as barras do que entrou e a rosca do imposto; a calculadora que fecha a conta e a guia que sobe com o código de barras e leva o carimbo de pronta; o medidor da alíquota com a lupa e o calendário virando os meses; o sino, o prazo circulado e as notificações no app e no WhatsApp; o contador com o selo, os holerites e as declarações com o visto. Telas reais do app: Início, a guia do mês, a alíquota (só até o cartão da alíquota efetiva), Impostos (com a notificação descendo no topo) e Tudo em dia. Ficaram de fora a emissão de nota (pedido do Pedro), o cadastro de funcionário (no app só existe no plano MEI) e as telas de Avisos (mostra Fator R e notas) e Suas guias (diz que a gente pagou). O vídeo vai de 30,8 s pra 44,8 s. A versão 5 está em marketing/final/_versoes-anteriores.';
const CTA = 'É por isso que a gente tá construindo o Legalizaí. Segue a gente. E clica no link da bio.';
const CENAS = [
  { tempo: '0-3,7s', cena: 'A linha desce e abraça o relógio de parede: os ponteiros correm da manhã até a tarde e, no "tarde", a fatia coral cobre a tarde inteira junto com a linha. No "simples", cai o bilhete com a caixinha vazia.', fala: 'Você separa a tarde inteira pra resolver uma coisa simples.', tela: 'tarde' },
  { tempo: '3,7-6s', cena: 'A câmera desce com a linha até a janela do site: a linha vira a barra de carregamento em cima dela, a seta clica no endereço e, no "trava", a barra para, a página racha, o alerta aparece e a seta clica sem resposta.', fala: 'Chega no site, trava.', tela: 'trava' },
  { tempo: '6-8,8s', cena: 'O fone toca, com as ondas, e a linha passa embaixo dele como o sinal da ligação, ondulando. No "cai", o sinal fica reto e o fone despenca e quica em cima da linha.', fala: 'Liga pro telefone, cai a ligação.', tela: 'ligação' },
  { tempo: '8,8-10,9s', cena: 'A linha vira o chão da fila: as pessoas aparecem em cima dela até a porta, você em coral no fim, e a fila anda devagar. No "fila", você suspira.', fala: 'Vai pessoalmente, fila.', tela: 'fila' },
  { tempo: '10,9-12,9s', cena: 'A linha desenha o horizonte da cidade enquanto o sol se põe, o céu escurece e as janelas acendem. No "nada resolvido", o bilhete volta, a caixinha tenta marcar e não marca; o bilhete treme, os riscos do corte passam por cima dele e ele se parte em pedacinhos, que estouram girando e caem.', fala: 'No fim do dia, nada resolvido,', tela: 'resolvido' },
  { tempo: '12,9-15,3s', cena: 'À noite, a linha contorna a lojinha, com as engrenagens girando. No "parada", elas param, as luzes apagam e o símbolo de pausado, o play num círculo escuro, aparece na porta. No "esperando", a ampulheta vira e a areia escorre.', fala: 'e sua empresa parada esperando.', tela: 'parada' },
  { tempo: '15,3-17,9s', cena: 'A íris coral abre a partir da linha, que fica branca e desenha o contorno do celular com as guias de construção. Dentro do desenho, as peças do iPhone 3D chegam e se encaixam: a moldura, o vidro de trás e a tela, que pousa pela frente e trava no contorno. No "construindo", a tela acende e os blocos da interface se montam um a um. No "Legalizaí", a home do app acende e o aparelho gira como produto, com a câmera avançando.', fala: 'É por isso que a gente tá construindo o Legalizaí.', tela: 'Legalizaí' },
  { tempo: '17,9-22,5s', cena: 'O celular vai pra direita com a tela de Início. Do outro lado, a linha sai dele e contorna o cartão do painel: no "fácil de entender" entra o selo; no "entrou" as barras sobem uma a uma e a seta de tendência desenha; no "imposto do mês" entra o cartão com a rosca que fecha.', fala: 'Um painel fácil de entender, com quanto entrou e o imposto do mês.', tela: 'painel' },
  { tempo: '22,5-26,3s', cena: 'O celular gira pra esquerda com a tela da guia do mês. A linha contorna a calculadora: no "calculado" as teclas acendem, a conta enche o visor e o visto fecha; no "guia" a guia sobe por trás com o código de barras desenhando; no "pronta" cai o carimbo.', fala: 'O imposto vem calculado, e a guia chega pronta.', tela: 'pronta' },
  { tempo: '26,3-29,4s', cena: 'O celular volta pra direita com a tela da alíquota efetiva. A linha contorna o medidor: no "acompanhada" o ponteiro gira e assenta, com a lupa em cima; no "todo mês" o calendário vira três meses, e o ponteiro ajusta a cada virada.', fala: 'Sua alíquota é acompanhada todo mês.', tela: 'alíquota' },
  { tempo: '29,4-33s', cena: 'O celular vai pra esquerda com a tela de Impostos, e uma notificação desce no topo: "A guia do mês vence em breve". No "avisa" o sino toca, com as ondas; no "prazo" a linha circula o dia; no "app" e no "WhatsApp" as duas mensagens entram deslizando.', fala: 'A gente avisa cada prazo, no app e no WhatsApp.', tela: 'prazo' },
  { tempo: '33-37,9s', cena: 'O celular volta pra direita com o painel Tudo em dia. Entra a pílula Microempresa; no "contador" a linha chega no contador, que ganha o selo no "de verdade"; no "folha" três holerites abrem em leque; no "declarações" dois formulários sobem, a assinatura desenha e cada um recebe o visto. No fim o celular volta pro centro.', fala: 'E, pra quem é microempresa, um contador de verdade cuida da folha e das declarações.', tela: 'contador' },
  { tempo: '37,9-44,8s', cena: 'A câmera recua, a íris de papel abre e a linha contorna o Seguir: o toque vira Seguindo, com confete; no "clica", a linha contorna o link da bio e o toque acende ele. A linha desce como um cometa e entra no quadrado do logo, onde o visto branco é desenhado: Vai, Legalizaí e a pílula LINK DA BIO, e o relógio volta pro loop.', fala: 'Segue a gente. E clica no link da bio.', tela: 'LINK DA BIO' },
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
  if (v.rotulo !== ROTULO || v.aviso !== AVISO) { v.rotulo = ROTULO; v.aviso = AVISO; mudancas.push('vídeo final: rótulo e aviso da versão 6'); }
  const r = roteiroLimpo(reel.roteiro);
  const roteiro = roteiroLimpo({ ...r, cenas: CENAS, textoTela: CENAS[0].tela, cta: CTA });
  if (!igual(roteiro, r)) mudancas.push('roteiro: as cenas da versão 6');
  const notas = String(reel.notas ?? '');
  const notasNovas = notas.includes(NOTA) ? notas : `${NOTA}\n\n${notas}`.trim();
  if (notasNovas !== notas) mudancas.push('notas: a versão 6');
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
if (!previa.mudancas.length) { console.log('Nada mudou: a peça já está com a versão 6.'); process.exit(0); }
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
reel.atualizadoPor = 'Versão 6 do vídeo de 09/10 (aplicar-video-0910-v6)';
const backup = arquivoDados('db.antes-video-0910-v6.json');
if (!existsSync(backup)) await writeFile(backup, original);
await salvar();
console.log(`Pronto. Backup: ${backup}`);
