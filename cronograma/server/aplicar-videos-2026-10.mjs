// Vídeos finais de outubro (02/10/2026): liga os vídeos prontos de marketing/final às peças do cronograma
// (reel.videos e stories.videos, contrato no SPEC.md §3.6) e acerta o status de cada uma. Rode com o servidor PARADO:
//   node server/aplicar-videos-2026-10.mjs [--simular] [--sem-aviso-trilha]      (ou npm run aplicar-videos)
// --simular confere tudo e mostra o que mudaria, sem gravar nada (nem a migração do boot, que só roda quando alguma
// peça vai mudar de verdade). Rodar de novo não muda nada.
// --sem-aviso-trilha: depois que a trilha do Epidemic for trocada nos 5 vídeos (3 sinais e Abertura do mês), tira o
// aviso "Trocar a trilha antes de postar". Sem ela, o aviso entra (ou volta): depois da troca, rode SEMPRE com ela.
// Se o vídeo refeito ganhar outro nome, troque o nome no PLANO: o arquivo velho da mesma pasta que saiu da pasta final
// (foi pra _versoes-anteriores) sai da peça sozinho
// CRONOGRAMA_DATA troca a pasta de dados (teste numa cópia; com ela, PORT é a porta do servidor de teste) e
// CRONOGRAMA_FINAL, a pasta dos vídeos. A pasta dos vídeos só é LIDA: nada é movido, renomeado nem gravado nela.
//
//  0. confere tudo antes de escrever: a peça existe, a data dela é a da pasta da proposta, a pasta e cada arquivo
//     existem no disco com o nome exato (maiúscula e acento iguais, arquivo de verdade e não link) e passam nas
//     regras de caminho do app (db.mjs, limparVideos). Um problema e nada é gravado
//  1. vídeo: entra ou é atualizado (rótulo e aviso) pelo arquivo. Vídeo que a peça já tinha e não está no plano fica,
//     menos o da mesma pasta da proposta cujo arquivo saiu da pasta final (versão trocada)
//  2. status: só anda pra frente (peça publicada continua publicada; nunca volta pra trás)
//  3. backup do db.json de antes (só quando algo vai mudar): db.antes-videos.json na primeira vez (nunca regravado)
//     e db.antes-videos.ultimo.json a cada rodada que muda algo
//  4. resumo
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync, realpathSync, statSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { APP, DATA_DIR, DB_PATH, arquivoDados, carregar, salvar, agora, limparVideos, extensaoVideo } from './db.mjs';
import { STATUS_REEL, STATUS_STORIES, conferirReel, conferirStatusStories } from './validar.mjs';
import { PASTA_FINAL } from './videos.mjs';

const AUTOR = 'Vídeos finais (aplicar-videos)';
const OPCOES = ['--simular', '--sem-aviso-trilha'];
const ARGS = process.argv.slice(2);
const SIMULAR = ARGS.includes('--simular');
const SEM_AVISO_TRILHA = ARGS.includes('--sem-aviso-trilha');
const PORTA_APP = 4317;

// trilha do Epidemic: o plano do Pedro é o gratuito, que não cobre conteúdo de marca (02/10). Sai com
// --sem-aviso-trilha, depois da troca
const AVISO_EPIDEMIC = 'Trocar a trilha antes de postar: a música atual (Epidemic) não é liberada no plano gratuito';
const avisoTrilha = () => (SEM_AVISO_TRILHA ? {} : { aviso: AVISO_EPIDEMIC });

// o que vai pra cada peça: a pasta da proposta (com a data dela na frente) e os arquivos, na ordem da tela
const PLANO = [
  {
    tipo: 'reel', id: 'reel_e1977777', status: 'editado',
    pasta: '2026-10-14 O app fazendo a guia do mês, sem site do governo',
    videos: [{ arquivo: 'GUIA-PRONTA-motion-v4.mp4', rotulo: 'Motion' }],
  },
  {
    tipo: 'reel', id: 'reel_c261002', status: 'editado',
    pasta: '2026-10-02 3 sinais de que você já pode cobrar mais caro',
    videos: [
      { arquivo: 'LEO-precificacao-v2.mp4', rotulo: 'Com o Léo', ...avisoTrilha() },
      { arquivo: 'MOTION-precificacao.mp4', rotulo: 'Motion', ...avisoTrilha() },
      { arquivo: 'BROLL-precificacao.mp4', rotulo: 'B-roll', ...avisoTrilha() },
    ],
  },
  {
    // a encomenda: já publicada, continua publicada
    tipo: 'reel', id: 'reel_4f2a8179', status: 'publicado',
    pasta: '2026-09-29 Caixa do caminhão (iPhone com splash)',
    videos: [
      { arquivo: 'CAIXA-iphone-splash.mp4', rotulo: 'Completo' },
      { arquivo: 'CAIXA-iphone-splash-15s.mp4', rotulo: 'Corte de 15 s' },
    ],
  },
  {
    // 03/10: o reel feito com o kit de motion, irmão do carrossel da mesma proposta (carrossel/ na mesma pasta)
    tipo: 'reel', id: 'reel_93834bb1', status: 'editado',
    pasta: '2026-10-05 Contabilidade tradicional vs Legalizaí',
    videos: [{ arquivo: 'TRADICIONAL-VS-LEGALIZAI-motion.mp4', rotulo: 'Motion', aviso: 'Na legenda do post: crédito do celular 3D (polyman Studio, CC BY 4.0)' }],
  },
  {
    tipo: 'stories', id: 'sto_89e98cb6', status: 'pronto',
    pasta: '2026-10-01 Abertura do mês (stories)',
    videos: [
      { arquivo: 'ABERTURA-MES-leo.mp4', rotulo: 'Com o Léo', ...avisoTrilha() },
      { arquivo: 'ABERTURA-MES-motion.mp4', rotulo: 'Motion', ...avisoTrilha() },
    ],
  },
];

const ORDEM_STATUS = { reel: STATUS_REEL, stories: STATUS_STORIES };
const COLECAO = { reel: 'reels', stories: 'stories' };
const NOME_TIPO = { reel: 'Reel', stories: 'Stories do dia' };

const erros = [];
const erro = (msg) => erros.push(msg);
const sair = (msg) => {
  console.error(`\nNada foi gravado: ${msg}`);
  process.exit(1);
};
const fmtData = (d) => (d ? `${String(d).slice(8, 10)}/${String(d).slice(5, 7)}` : 'sem data');
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const curto = (s, n = 60) => (String(s ?? '').length > n ? `${String(s).slice(0, n - 3).trimEnd()}...` : String(s ?? ''));
const minusculo = (s) => String(s ?? '').toLowerCase();

function caminhoReal(p) {
  try {
    return realpathSync.native(p);
  } catch {
    return path.resolve(p);
  }
}
const mesmoCaminho = (a, b) => {
  const [x, y] = [caminhoReal(a), caminhoReal(b)];
  return process.platform === 'win32' ? x.toLowerCase() === y.toLowerCase() : x === y;
};

function portaOcupada(porta) {
  return new Promise((ok) => {
    const s = net.connect({ host: '127.0.0.1', port: porta });
    s.setTimeout(800);
    s.once('connect', () => { s.destroy(); ok(true); });
    s.once('timeout', () => { s.destroy(); ok(false); });
    s.once('error', () => ok(false));
  });
}

// nomes exatos de uma pasta (o Windows acha "abertura-mes-LEO.mp4" mesmo escrito errado: aqui não vale)
async function nomesDa(pasta) {
  try {
    return await readdir(pasta, { withFileTypes: true });
  } catch (e) {
    if (['ENOENT', 'ENOTDIR'].includes(e.code)) return null;
    throw e;
  }
}
function confereNome(entradas, nome, onde, { pasta = false } = {}) {
  const e = entradas.find((x) => x.name === nome);
  if (!e) {
    const parecido = entradas.find((x) => minusculo(x.name) === minusculo(nome) || x.name.normalize('NFC') === nome.normalize('NFC'));
    erro(`${onde}: "${nome}" não existe${parecido ? ` (no disco está "${parecido.name}")` : ''}.`);
    return false;
  }
  if (e.isSymbolicLink()) { erro(`${onde}: "${nome}" é um link, não ${pasta ? 'uma pasta' : 'um arquivo'} de verdade.`); return false; }
  if (pasta ? !e.isDirectory() : !e.isFile()) { erro(`${onde}: "${nome}" não é ${pasta ? 'uma pasta' : 'um arquivo'}.`); return false; }
  return true;
}

// o arquivo (caminho relativo com barra normal, como no banco) ainda está na pasta final?
function naPastaFinal(arquivo) {
  try {
    return statSync(path.join(PASTA_FINAL, ...String(arquivo).split('/'))).isFile();
  } catch {
    return false;
  }
}

// os vídeos do plano entram pelo arquivo (rótulo e aviso novos valem). Os que a peça já tinha e não estão no plano
// ficam, depois dos do plano; menos os da mesma pasta da proposta cujo arquivo saiu da pasta final (versão trocada:
// o velho foi pra _versoes-anteriores e o plano já aponta pro novo)
function juntar(atuais, novos, pasta) {
  const doPlano = new Set(novos.map((n) => minusculo(n.arquivo)));
  const prefixo = `${minusculo(pasta)}/`;
  const resto = [];
  const sairam = [];
  for (const v of Array.isArray(atuais) ? atuais : []) {
    if (doPlano.has(minusculo(v?.arquivo))) continue;
    if (minusculo(v?.arquivo).startsWith(prefixo) && !naPastaFinal(v.arquivo)) sairam.push(v);
    else resto.push(v);
  }
  return { videos: limparVideos([...novos, ...resto]), sairam };
}

// status só anda pra frente na ordem do app (ideia, roteiro, gravado, editado, publicado; nos stories, ideia,
// pronto, publicado)
function statusFinal(tipo, atual, alvo) {
  const ordem = ORDEM_STATUS[tipo];
  return ordem.indexOf(atual) >= ordem.indexOf(alvo) ? atual : alvo;
}

// ---------- 0. confere ----------
async function conferir(cru) {
  const raiz = await nomesDa(PASTA_FINAL);
  if (!raiz) sair(`a pasta dos vídeos finais (${PASTA_FINAL}) não existe.`);
  const prontos = [];
  for (const p of PLANO) {
    const onde = `${NOME_TIPO[p.tipo]} ${p.id}`;
    const item = (cru[COLECAO[p.tipo]] ?? []).find((x) => x?.id === p.id);
    if (!item) { erro(`${onde}: não existe no banco.`); continue; }
    const dataPasta = p.pasta.slice(0, 10);
    if (item.data !== dataPasta) erro(`${onde}: a peça está em ${fmtData(item.data)} e a pasta "${p.pasta}" é de ${fmtData(dataPasta)}.`);
    if (!confereNome(raiz, p.pasta, onde, { pasta: true })) continue;
    const dentro = await nomesDa(path.join(PASTA_FINAL, p.pasta));
    if (!dentro) { erro(`${onde}: não consegui ler a pasta "${p.pasta}".`); continue; }
    let ok = true;
    for (const v of p.videos) {
      if (!confereNome(dentro, v.arquivo, `${onde} (${p.pasta})`)) ok = false;
      else if (!extensaoVideo(v.arquivo)) { erro(`${onde}: "${v.arquivo}" não é vídeo.`); ok = false; }
    }
    if (!ok) continue;
    try {
      const novos = limparVideos(p.videos.map((v) => ({ ...v, arquivo: `${p.pasta}/${v.arquivo}` })));
      const { videos, sairam } = juntar(item.videos, novos, p.pasta);
      const status = statusFinal(p.tipo, item.status, p.status);
      // a mesma validação da tela (status e videos)
      if (p.tipo === 'reel') conferirReel({ status, videos }, item);
      else conferirStatusStories(status);
      prontos.push({ p, status, videos, sairam });
    } catch (e) {
      if (!e.status) throw e;
      erro(`${onde}: ${e.message}`);
    }
  }
  if (erros.length) sair(`${erros.length} problema(s):\n  - ${erros.join('\n  - ')}`);
  return prontos;
}

// ---------- 1 e 2. aplica no banco (cru na conferência; o do boot na rodada de verdade) ----------
function aplicar(banco, prontos) {
  const quando = agora();
  const linhas = [];
  let mudaram = 0;
  for (const { p, status, videos, sairam } of prontos) {
    const item = banco[COLECAO[p.tipo]].find((x) => x?.id === p.id);
    const titulo = p.tipo === 'reel' ? item.ideia : item.tema;
    const cab = `  ${fmtData(item.data)} · ${NOME_TIPO[p.tipo]} · ${curto(titulo)}`;
    const antesVideos = Array.isArray(item.videos) ? item.videos : [];
    const mudouStatus = item.status !== status;
    const mudouVideos = !igual(antesVideos, videos);
    const txtStatus = mudouStatus ? `status de ${item.status} pra ${status}` : `status ${item.status} (fica)`;
    const txtVideos = videos.map((v) => {
      const antes = antesVideos.find((a) => minusculo(a?.arquivo) === minusculo(v.arquivo));
      const marca = !antes ? 'novo' : igual(antes, v) ? 'igual' : antes.aviso && !v.aviso ? 'aviso tirado' : 'atualizado';
      return `${v.rotulo} (${path.posix.basename(v.arquivo)}, ${marca}${v.aviso ? ', com aviso' : ''})`;
    }).join('; ')
      + (sairam.length ? `; saiu da peça: ${sairam.map((v) => path.posix.basename(v.arquivo)).join(', ')} (não está mais na pasta final)` : '');
    if (!mudouStatus && !mudouVideos) {
      linhas.push(`${cab}\n      sem mudança: ${txtStatus}; vídeos: ${txtVideos}`);
      continue;
    }
    Object.assign(item, { status, videos }, { atualizadoEm: quando, atualizadoPor: AUTOR });
    mudaram++;
    linhas.push(`${cab}\n      ${txtStatus}; vídeos: ${txtVideos}`);
  }
  return { linhas, mudaram, iguais: prontos.length - mudaram };
}

async function main() {
  // opção escrita errada (ex.: --sem-aviso) rodaria o plano com o aviso de volta: nada é gravado
  const desconhecidas = ARGS.filter((a) => !OPCOES.includes(a));
  if (desconhecidas.length) sair(`opção desconhecida: ${desconhecidas.join(' ')}. As opções são ${OPCOES.join(' e ')}.`);
  const dadosReais = mesmoCaminho(DATA_DIR, path.join(APP, 'data'));
  // com o servidor no ar, ele regravaria o banco da memória por cima desta rodada
  const portas = new Set([...(dadosReais ? [PORTA_APP] : []), ...(process.env.PORT ? [Number(process.env.PORT)] : [])]);
  for (const porta of portas) {
    if (await portaOcupada(porta)) sair(`tem um servidor no ar na porta ${porta}. Pare o servidor da Gestão de Marketing antes e rode de novo.`);
  }
  if (!existsSync(DB_PATH)) sair(`o banco ${DB_PATH} não existe.`);
  console.log(`${SIMULAR ? 'SIMULAÇÃO (nada é gravado)\n' : ''}Dados: ${DATA_DIR}\nVídeos (só leitura): ${PASTA_FINAL}\n`);

  // o banco de antes desta rodada, lido cru: a conferência e o plano não passam pelo boot
  const original = await readFile(DB_PATH);
  let cru;
  try {
    cru = JSON.parse(original.toString('utf8'));
  } catch (e) {
    sair(`o banco não abre: ${e.message}`);
  }
  for (const k of ['reels', 'stories']) if (!Array.isArray(cru[k])) cru[k] = [];

  const prontos = await conferir(cru);
  let plano = aplicar(structuredClone(cru), prontos);

  // ---------- 3. grava ----------
  const primeiro = arquivoDados('db.antes-videos.json');
  if (plano.mudaram && !SIMULAR) {
    const db = await carregar();
    db.stories ??= [];
    plano = aplicar(db, prontos);
    if (!existsSync(primeiro)) await writeFile(primeiro, original);
    await writeFile(arquivoDados('db.antes-videos.ultimo.json'), original);
    await salvar();
  }

  // ---------- 4. resumo ----------
  console.log([
    `== Vídeos finais ${SIMULAR ? '(simulação) ' : ''}==`,
    ...plano.linhas,
    `Peças que mudaram: ${plano.mudaram} · Sem mudança: ${plano.iguais}`,
    SEM_AVISO_TRILHA
      ? 'Aviso da trilha: fora dos 5 vídeos do Epidemic (--sem-aviso-trilha).'
      : 'Aviso da trilha do Epidemic: nos 5 vídeos (3 sinais e Abertura do mês). Depois da troca da trilha, rode com --sem-aviso-trilha (servidor parado).',
    !plano.mudaram ? 'Nada mudou: estes vídeos já estavam ligados às peças.'
      : SIMULAR ? 'Simulação: nada foi gravado. Rode sem --simular pra aplicar.'
        : `Pronto. Backup de antes da primeira rodada: ${primeiro}`,
  ].join('\n'));
}

try {
  await main();
  process.exit(0);
} catch (e) {
  console.error(`\nErro: ${e.status ? e.message : e.stack}`);
  process.exit(1);
}
