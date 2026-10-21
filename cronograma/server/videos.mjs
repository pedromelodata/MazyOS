// Vídeos finais (02/10/2026): a pasta marketing/final do workspace, uma subpasta por proposta ("AAAA-MM-DD nome da
// proposta", ou só o nome quando não tem data), só com a última versão de cada vídeo (marketing/final/LEIA-ME.md).
// O app só LÊ de lá: nunca move, renomeia nem grava nada nessa pasta.
//  - GET /api/videos (listar): as propostas, cada uma com os arquivos de vídeo (nome, caminho relativo, tamanho,
//    data) e as peças do banco (reel.videos e stories.videos) que apontam pra eles, mais as peças que apontam pra
//    um arquivo que não está na pasta (faltando). Fica de fora o que começa com "." ou "_" (_versoes-anteriores),
//    final/src (o render do filme de 18 s lê de lá), link simbólico, pasta sem vídeo e arquivo que não é vídeo
//  - GET e HEAD /videos/<caminho relativo> (servir): o arquivo, com Range (206), Content-Type de vídeo, ETag e
//    cache curto e PRIVADO. Private é obrigatório: a Cloudflare guarda .mp4 por padrão e, sem ele, entregaria o
//    vídeo do cache do túnel pra quem não entrou. Recusa: "..", caminho absoluto, drive, barra invertida, pedaço
//    escondido, extensão que não é de vídeo e link (simbólico ou junção) que leva pra fora da pasta (confere o
//    caminho real no disco). O login é o de sempre: a rota não é pública no server.mjs (sem sessão, 401; página
//    aberta direto no navegador vai pra /entrar; senha temporária ainda não trocada, 403, como na API)
//  - pedido do player até o fim do arquivo: um pedaço por resposta, não o resto do arquivo (pedacoDoPlayer)
//  - GET e HEAD /videos/<caminho relativo>?capa=<versão>: a capa do vídeo, um quadro em JPEG pequeno, feita pelo
//    ffmpeg e guardada em data/capas-videos (servirCapa)
//  - 21/10: a entrega com Range mora em servirArquivo (exportada): os arquivos subidos nas Aprovações técnicas
//    (envios.mjs) saem por ela também
// A pasta vem de CRONOGRAMA_FINAL (no .env ou no ambiente); sem ela, <workspace>/marketing/final.
// As regras do caminho moram no db.mjs (caminhoVideo, pedacoVideoOk): as mesmas da validação de reel.videos
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { open, readdir, readFile, realpath, mkdir, rename, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { APP, DATA_DIR, caminhoVideo, pedacoVideoOk, extensaoVideo, dataValida } from './db.mjs';

export const PASTA_FINAL = process.env.CRONOGRAMA_FINAL
  ? path.resolve(process.env.CRONOGRAMA_FINAL)
  : path.resolve(APP, '..', 'marketing', 'final');

// versão da área (vai no /api/estado como videosFinais). A tela só liga "Vídeos prontos" com 2 ou mais: o servidor
// que subiu em 02/10 às 15:37 mandava true e caía quando o navegador cortava um pedido de vídeo no meio
export const VERSAO = 2;

const TIPO_VIDEO = { '.mp4': 'video/mp4', '.m4v': 'video/x-m4v', '.mov': 'video/quicktime', '.webm': 'video/webm' };
// 5 minutos: quem assiste não baixa de novo a cada play, e o vídeo refeito no lugar aparece logo
const CACHE = 'private, max-age=300';
// pastas da raiz que não são proposta
const FORA_DA_LISTA = new Set(['src']);
// subpastas dentro da proposta (cortes, formatos): até 3 níveis contando a da proposta
const PROFUNDIDADE = 3;
const DATA_NA_FRENTE = /^(\d{4}-\d{2}-\d{2})\s+(.+)$/;
const PREFIXO = '/videos/';

// Pedido do player pedindo até o fim do arquivo (Range aberto, "bytes=N-", ou fechado no último byte, que é como o
// Chrome e o Edge pedem a continuação): a resposta leva um pedaço, com o Content-Range do fim real dele, e não o resto
// do arquivo. Com o resto, o Edge lia de 3 a 7 MB de cada vídeo antes de parar, mesmo com preload="metadata" (02/10:
// abrir "Vídeos prontos" baixava de 11 a 13 MB e a página inteira, uns 64 MB, tudo saindo do upload deste computador
// pelo túnel). Chrome, Edge e Firefox pedem o pedaço seguinte sozinhos quando precisam (play, busca).
// O pedaço cresce com a posição (metade dela, de 1 MB a 4 MB): o começo, que é o que o preload lê, vai em pedaços de
// 1 MB; tocando, eles crescem e o vídeo pede menos vezes pelo túnel.
// Só vale pro player desses navegadores: Sec-Fetch-Dest video ou audio e o navegador no User-Agent. Ficam de fora o
// Safari e tudo no iPhone e no iPad (o player da Apple confere se veio o tamanho pedido), o Baixar e a retomada de
// download (não são pedido de player: vão inteiros)
export const PEDACO_MIN = 1024 * 1024;
export const PEDACO_MAX = 4 * 1024 * 1024;
export const pedacoDoPlayer = (inicio) => Math.min(PEDACO_MAX, Math.max(PEDACO_MIN, Math.floor(inicio / 2)));
const DESTINO_PLAYER = new Set(['video', 'audio']);
const ACEITA_PEDACO = /\b(?:Chrome|Chromium|Edg|Firefox)\//;
const APPLE_MOVEL = /\b(?:iPhone|iPad|iPod)\b/;
export function pedidoDoPlayer(req) {
  const ua = String(req?.headers?.['user-agent'] ?? '');
  return DESTINO_PLAYER.has(String(req?.headers?.['sec-fetch-dest'] ?? '').trim().toLowerCase()) && ACEITA_PEDACO.test(ua) && !APPLE_MOVEL.test(ua);
}

const comparar = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' }).compare;
// no Windows o disco não diferencia maiúscula: a comparação de caminho também não
const chave = (s) => (process.platform === 'win32' ? String(s).toLowerCase() : String(s));
const semPrefixoLongo = (s) => String(s).replace(/^\\\\\?\\/, '');

// alvo está dentro de base (os dois absolutos)?
export function dentroDe(alvo, base) {
  const a = chave(semPrefixoLongo(path.resolve(alvo)));
  const b = chave(semPrefixoLongo(path.resolve(base)));
  return a.startsWith(b.endsWith(path.sep) ? b : b + path.sep);
}

// ---------- lista ----------

async function videosDa(pastaAbs, relativo, nivel) {
  let entradas;
  try {
    entradas = await readdir(pastaAbs, { withFileTypes: true });
  } catch {
    return [];
  }
  const saida = [];
  for (const e of entradas) {
    // link simbólico e junção ficam de fora (não seguem pra lugar nenhum)
    if (e.isSymbolicLink() || !pedacoVideoOk(e.name)) continue;
    const rel = `${relativo}/${e.name}`;
    const abs = path.join(pastaAbs, e.name);
    if (e.isDirectory()) {
      if (nivel < PROFUNDIDADE) saida.push(...(await videosDa(abs, rel, nivel + 1)));
      continue;
    }
    if (!e.isFile() || !extensaoVideo(e.name) || !caminhoVideo(rel)) continue;
    let fh;
    try {
      fh = await open(abs, 'r');
      const st = await fh.stat();
      saida.push({ nome: e.name, arquivo: rel, tamanho: st.size, modificadoEm: st.mtime.toISOString() });
    } catch {
      // sumiu ou está preso (render gravando) entre a listagem e a leitura: fica pra próxima
    } finally {
      await fh?.close().catch(() => {});
    }
  }
  return saida;
}

// as propostas do disco, sem o banco. null = a pasta não existe
export async function propostas(pasta = PASTA_FINAL) {
  let entradas;
  try {
    entradas = await readdir(pasta, { withFileTypes: true });
  } catch (e) {
    if (['ENOENT', 'ENOTDIR'].includes(e.code)) return null;
    throw e;
  }
  const lista = [];
  for (const e of entradas) {
    if (!e.isDirectory() || e.isSymbolicLink() || !pedacoVideoOk(e.name) || FORA_DA_LISTA.has(e.name.toLowerCase())) continue;
    const arquivos = await videosDa(path.join(pasta, e.name), e.name, 1);
    if (!arquivos.length) continue;
    const m = DATA_NA_FRENTE.exec(e.name);
    const data = m && dataValida(m[1]) ? m[1] : null;
    lista.push({ pasta: e.name, nome: data ? m[2].trim() : e.name, data, arquivos });
  }
  // com data, a mais nova primeiro (a ordem do LEIA-ME); sem data, no fim, pelo nome
  return lista.sort((a, b) => (a.data && b.data ? b.data.localeCompare(a.data) : a.data ? -1 : b.data ? 1 : comparar(a.nome, b.nome)));
}

// as peças do banco que apontam pra cada arquivo (reel.videos e stories.videos)
function usosDoBanco(db) {
  const usos = new Map();
  const anotar = (tipo, item, titulo) => {
    if (!Array.isArray(item?.videos)) return;
    item.videos.forEach((v, ordem) => {
      if (typeof v?.arquivo !== 'string') return;
      const k = chave(v.arquivo);
      if (!usos.has(k)) usos.set(k, []);
      usos.get(k).push({
        tipo, id: item.id, titulo: String(titulo ?? ''), data: item.data || null, status: item.status ?? null,
        rotulo: v.rotulo ?? '', aviso: v.aviso || null, arquivo: v.arquivo, ordem,
      });
    });
  };
  for (const r of db?.reels ?? []) anotar('reel', r, r.ideia);
  for (const s of db?.stories ?? []) anotar('stories', s, s.tema);
  return usos;
}

// GET /api/videos. lista: o resultado de propostas() (passa no teste; a rota lê o disco)
export async function listar(db, lista) {
  if (lista === undefined) lista = await propostas();
  const usos = usosDoBanco(db);
  const achados = new Set();
  const saida = (lista ?? []).map((p) => {
    const arquivos = p.arquivos.map((a) => {
      const k = chave(a.arquivo);
      achados.add(k);
      const pecas = (usos.get(k) ?? []).map(({ arquivo: _a, ...resto }) => resto);
      return { ...a, url: urlDoVideo(a.arquivo), capa: urlDaCapa(a), pecas };
    });
    // primeiro os que alguma peça usa, na ordem da peça (Com o Léo, Motion, B-roll...); depois pelo nome
    const ordem = (a) => (a.pecas.length ? Math.min(...a.pecas.map((x) => x.ordem)) : Infinity);
    arquivos.sort((a, b) => ordem(a) - ordem(b) || comparar(a.nome, b.nome));
    const pecas = [];
    for (const a of arquivos) for (const x of a.pecas) if (!pecas.some((y) => y.tipo === x.tipo && y.id === x.id)) pecas.push(x);
    return { ...p, arquivos, pecas: pecas.map(({ tipo, id, titulo, data, status }) => ({ tipo, id, titulo, data, status })) };
  });
  const faltando = [];
  for (const [k, lista2] of usos) {
    if (achados.has(k)) continue;
    for (const x of lista2) faltando.push({ tipo: x.tipo, id: x.id, titulo: x.titulo, arquivo: x.arquivo });
  }
  return { pastaExiste: lista != null, propostas: saida, faltando };
}

// "pasta/arquivo.mp4" → "/videos/pasta/arquivo.mp4" (cada pedaço codificado)
export const urlDoVideo = (arquivo) => PREFIXO + String(arquivo).split('/').map(encodeURIComponent).join('/');
// a capa: o mesmo endereço com ?capa=<tamanho>-<data> (vídeo refeito no lugar muda o endereço e o navegador não usa a
// capa velha guardada)
export const urlDaCapa = ({ arquivo, tamanho, modificadoEm }) =>
  `${urlDoVideo(arquivo)}?capa=${Number(tamanho).toString(36)}-${(Date.parse(modificadoEm) || 0).toString(36)}`;

// ---------- entrega ----------

// /videos/<pedaços codificados> → "pasta/arquivo.mp4" ou null. Cada pedaço é decodificado e conferido sozinho:
// %2F e %5C (barra codificada) viram um pedaço com barra e são recusados
export function relativoDaUrl(pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith(PREFIXO)) return null;
  let pedacos;
  try {
    pedacos = pathname.slice(PREFIXO.length).split('/').map(decodeURIComponent);
  } catch {
    return null;
  }
  if (!pedacos.every(pedacoVideoOk)) return null;
  return caminhoVideo(pedacos.join('/'));
}

// Range: "bytes=a-b", "bytes=a-" ou "bytes=-n". Devolve { inicio, fim }, 'fora' (416) ou null (cabeçalho torto
// ou com vários pedaços: a norma manda ignorar e entregar o arquivo inteiro). player: o pedido que vai até o fim do
// arquivo (aberto ou fechado no último byte) para no fim do pedaço (pedacoDoPlayer); o resto e o sufixo vão como
// pedidos
export function intervalo(cabecalho, tamanho, { player = false } = {}) {
  const m = /^\s*bytes\s*=\s*(\d*)\s*-\s*(\d*)\s*$/i.exec(String(cabecalho ?? ''));
  if (!m || (m[1] === '' && m[2] === '')) return null;
  if (m[1] === '') {
    const n = Number(m[2]);
    if (!(n > 0) || !(tamanho > 0)) return 'fora';
    return { inicio: Math.max(0, tamanho - n), fim: tamanho - 1 };
  }
  const inicio = Number(m[1]);
  if (m[2] !== '' && Number(m[2]) < inicio) return null;
  if (!(tamanho > 0) || inicio >= tamanho) return 'fora';
  const fim = m[2] === '' ? tamanho - 1 : Math.min(Number(m[2]), tamanho - 1);
  if (player && fim === tamanho - 1) return { inicio, fim: Math.min(fim, inicio + pedacoDoPlayer(inicio) - 1) };
  return { inicio, fim };
}

const segundos = (d) => Math.floor(d.getTime() / 1000) * 1000;

// If-None-Match (comparação fraca) ou, sem ele, If-Modified-Since
function naoMudou(req, etag, mtime) {
  const inm = req.headers['if-none-match'];
  if (inm) return String(inm).split(',').map((s) => s.trim().replace(/^W\//, '')).some((t) => t === '*' || t === etag);
  const ims = Date.parse(String(req.headers['if-modified-since'] ?? ''));
  return Number.isFinite(ims) && segundos(mtime) <= ims;
}

// If-Range: só ETag forte igual ou a mesma data. Não bateu: o arquivo mudou, vai inteiro (200)
function rangeVale(req, etag, mtime) {
  const ir = req.headers['if-range'];
  if (!ir) return true;
  const s = String(ir).trim();
  if (s.startsWith('"') || s.startsWith('W/')) return s === etag;
  const d = Date.parse(s);
  return Number.isFinite(d) && d === segundos(mtime);
}

export async function servir(req, res, url, { json }) {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('allow', 'GET, HEAD');
    return json(res, 405, { erro: 'Método não permitido.' });
  }
  const rel = relativoDaUrl(url.pathname);
  if (!rel) return json(res, 400, { erro: 'Endereço de vídeo inválido.' });
  const abs = path.resolve(PASTA_FINAL, ...rel.split('/'));
  if (!dentroDe(abs, PASTA_FINAL)) return json(res, 403, { erro: 'Acesso negado.' });

  // o caminho real (links e nomes curtos do Windows resolvidos) tem de ser exatamente o pedido, dentro do caminho
  // real da pasta: link que sai da pasta, link que aponta pra outro arquivo dela e nome curto (GUIA-P~1.MP4) não passam
  let real;
  let base;
  try {
    [real, base] = await Promise.all([realpath(abs), realpath(PASTA_FINAL)]);
  } catch (e) {
    if (['ENOENT', 'ENOTDIR'].includes(e.code)) return json(res, 404, { erro: 'Vídeo não encontrado.' });
    throw e;
  }
  const relReal = path.relative(semPrefixoLongo(base), semPrefixoLongo(real)).split(path.sep).join('/');
  if (!dentroDe(real, base) || chave(relReal) !== chave(rel)) return json(res, 403, { erro: 'Acesso negado.' });
  if (url.searchParams.has('capa')) return servirCapa(req, res, rel, real, { json });
  return servirArquivo(req, res, real, { json, tipo: TIPO_VIDEO[path.extname(real).toLowerCase()] ?? 'application/octet-stream', rotulo: `Vídeo ${rel}` });
}

// 21/10: a entrega em si (abrir, conferir, responder com Range e fechar), separada do servir() pra servir também os
// arquivos subidos nas Aprovações técnicas (envios.mjs). Quem chama já conferiu o método (GET ou HEAD) e o caminho
// (real, dentro da pasta dele). tipo: o Content-Type; cache: o Cache-Control; extras: cabeçalhos a mais (nosniff,
// Content-Disposition); rotulo: o que aparece no log; naoAchou e ocupado: as mensagens do 404 e do 503
const MSG_VIDEO = { naoAchou: 'Vídeo não encontrado.', ocupado: 'O vídeo está sendo gravado agora. Tente de novo em instantes.' };
export async function servirArquivo(req, res, real, { json, tipo = 'application/octet-stream', cache = CACHE, extras = {}, rotulo = 'Arquivo', naoAchou = MSG_VIDEO.naoAchou, ocupado = MSG_VIDEO.ocupado }) {
  let fh;
  try {
    fh = await open(real, 'r');
  } catch (e) {
    if (['ENOENT', 'ENOTDIR', 'EISDIR'].includes(e.code)) return json(res, 404, { erro: naoAchou });
    if (['EBUSY', 'EPERM', 'EACCES'].includes(e.code)) {
      res.setHeader('retry-after', '10');
      return json(res, 503, { erro: ocupado });
    }
    throw e;
  }
  try {
    const st = await fh.stat();
    if (!st.isFile()) return json(res, 404, { erro: naoAchou });
    const etag = `"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
    const comuns = { ...extras, 'accept-ranges': 'bytes', 'cache-control': cache, etag, 'last-modified': st.mtime.toUTCString() };
    if (naoMudou(req, etag, st.mtime)) {
      res.writeHead(304, comuns);
      return res.end();
    }
    const faixa = req.headers.range && rangeVale(req, etag, st.mtime)
      ? intervalo(req.headers.range, st.size, { player: pedidoDoPlayer(req) })
      : null;
    if (faixa === 'fora') {
      res.writeHead(416, { 'accept-ranges': 'bytes', 'content-range': `bytes */${st.size}`, 'cache-control': 'no-store' });
      return res.end();
    }
    const inicio = faixa ? faixa.inicio : 0;
    const fim = faixa ? faixa.fim : st.size - 1;
    const tamanho = st.size ? fim - inicio + 1 : 0;
    res.writeHead(faixa ? 206 : 200, {
      ...comuns,
      'content-type': tipo,
      'content-length': String(tamanho),
      ...(faixa ? { 'content-range': `bytes ${inicio}-${fim}/${st.size}` } : {}),
    });
    if (req.method === 'HEAD' || !tamanho) return res.end();
    // o navegador corta pedido de vídeo o tempo todo (pulou pra frente, já tem o começo, aba fechada): se cortou
    // enquanto o arquivo abria, nem começa a ler
    if (res.destroyed || res.writableEnded) return;
    const leitura = fh.createReadStream({ start: inicio, end: fim, autoClose: false });
    try {
      await pipeline(leitura, res);
    } catch (e) {
      if (!CORTES_NORMAIS.has(e.code)) console.error(`${rotulo} parou no meio:`, e.message);
      leitura.destroy();
      res.destroy();
    }
  } finally {
    // fechado SEMPRE aqui, por quem abriu: arquivo esquecido aberto e fechado pela coleta de lixo derruba o processo
    // no Node 26 (ERR_INVALID_STATE). close() de novo num arquivo já fechado não dá erro
    await fh.close().catch(() => {});
  }
}

// o navegador cortou o pedido: não é erro do servidor
const CORTES_NORMAIS = new Set(['ERR_STREAM_PREMATURE_CLOSE', 'ERR_STREAM_UNABLE_TO_PIPE', 'ERR_STREAM_DESTROYED', 'ECONNRESET', 'EPIPE']);

// ---------- capa (pôster) ----------
// 02/10: na página "Vídeos prontos" cada vídeo mostra uma capa (um quadro perto de 1 s, em JPEG pequeno) e o player
// fica com preload="none": abrir e rolar a página não baixa vídeo nenhum, só as capas (dezenas de KB cada). Com
// preload="metadata" o Edge lê o vídeo até ter o bastante pra tocar (de 1 a 12 MB cada um, mesmo em pedaços), e a
// página inteira passava de 50 MB. A capa é feita pelo ffmpeg na primeira vez que alguém pede e fica em
// data/capas-videos/ (NUNCA na pasta final), com o tamanho e a data do vídeo no nome: vídeo refeito no lugar ganha
// capa nova e a velha sai. Sem ffmpeg, ou com vídeo que ele não abre, a capa dá 404 e a tela volta pro
// preload="metadata". Outro ffmpeg: CRONOGRAMA_FFMPEG no .env (caminho do ffmpeg.exe)
export const PASTA_CAPAS = path.join(DATA_DIR, 'capas-videos');
const ffmpeg = () => process.env.CRONOGRAMA_FFMPEG || 'ffmpeg';
// deitado até 960 de largura, em pé até 540 (a capa aparece no máximo com uns 400 px de largura na tela)
const ESCALA_CAPA = "scale='if(gt(iw,ih),min(960,iw),min(540,iw))':-2";
const CAPAS_JUNTAS = 2;
const CAPA_TEMPO_MAX = 30_000;
const SEM_FFMPEG_POR = 10 * 60_000;
const gerando = new Map();
const esperandoVaga = [];
let capasRodando = 0;
let semFfmpegAte = 0;

const nomeDaCapa = (rel, st) =>
  `${createHash('sha1').update(chave(rel)).digest('hex').slice(0, 20)}-${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}.jpg`;

// no máximo CAPAS_JUNTAS ffmpeg ao mesmo tempo: a página pede as capas todas de uma vez
async function comVaga(fn) {
  if (capasRodando >= CAPAS_JUNTAS) await new Promise((ok) => esperandoVaga.push(ok));
  capasRodando++;
  try {
    return await fn();
  } finally {
    capasRodando--;
    esperandoVaga.shift()?.();
  }
}

function rodarFfmpeg(entrada, saida, segundo) {
  const args = ['-hide_banner', '-loglevel', 'error', '-nostdin', '-ss', String(segundo), '-i', entrada,
    '-frames:v', '1', '-vf', ESCALA_CAPA, '-q:v', '5', '-f', 'image2', '-update', '1', '-y', saida];
  return new Promise((ok, erro) => {
    execFile(ffmpeg(), args, { timeout: CAPA_TEMPO_MAX, windowsHide: true }, (e, _saida, falas) => {
      if (!e) return ok();
      // a última linha do que o ffmpeg disse (o comando inteiro, com caminho, não vai pro log)
      e.motivo = e.killed ? `passou de ${CAPA_TEMPO_MAX / 1000} s` : String(falas ?? '').trim().split(/\r?\n/).pop() || `saiu com ${e.code}`;
      erro(e);
    });
  });
}

// o quadro de 1 s; vídeo mais curto (ou que o ffmpeg não acha nesse ponto): o primeiro quadro
async function gerarCapa(real, destino) {
  await mkdir(PASTA_CAPAS, { recursive: true });
  const tmp = `${destino}.${process.pid}.tmp.jpg`;
  let ultimoErro = null;
  try {
    for (const segundo of [1, 0]) {
      try {
        await rodarFfmpeg(real, tmp, segundo);
      } catch (e) {
        if (e.code === 'ENOENT') throw e;
        ultimoErro = e;
        continue;
      }
      if ((await stat(tmp).catch(() => null))?.size) {
        await rename(tmp, destino);
        return;
      }
    }
    throw ultimoErro ?? new Error('o ffmpeg não tirou nenhum quadro');
  } finally {
    await unlink(tmp).catch(() => {});
  }
}

// a capa nova entrou: as velhas do mesmo vídeo (outro tamanho ou outra data) saem
async function tirarCapasVelhas(nome) {
  const prefixo = `${nome.split('-')[0]}-`;
  for (const n of await readdir(PASTA_CAPAS).catch(() => [])) {
    if (n.startsWith(prefixo) && n !== nome && n.endsWith('.jpg') && !n.includes('.tmp')) await unlink(path.join(PASTA_CAPAS, n)).catch(() => {});
  }
}

// true quando a capa está no disco (já estava ou acabou de ser feita)
function capaPronta(nome, real, rel) {
  if (gerando.has(nome)) return gerando.get(nome);
  const p = comVaga(() => gerarCapa(real, path.join(PASTA_CAPAS, nome)))
    .then(async () => {
      await tirarCapasVelhas(nome);
      return true;
    })
    .catch((e) => {
      if (e.code === 'ENOENT') {
        semFfmpegAte = Date.now() + SEM_FFMPEG_POR;
        console.error(`Capas dos vídeos: ffmpeg não encontrado (${ffmpeg()}). Sem capa, a página lê o começo de cada vídeo.`);
      } else console.error(`Capa de ${rel} não saiu: ${e.motivo ?? e.message ?? e}`);
      return false;
    })
    .finally(() => gerando.delete(nome));
  gerando.set(nome, p);
  return p;
}

async function servirCapa(req, res, rel, real, { json }) {
  let st;
  try {
    st = await stat(real);
  } catch {
    return json(res, 404, { erro: 'Vídeo não encontrado.' });
  }
  if (!st.isFile()) return json(res, 404, { erro: 'Vídeo não encontrado.' });
  const nome = nomeDaCapa(rel, st);
  const arquivo = path.join(PASTA_CAPAS, nome);
  if (!(await stat(arquivo).catch(() => null))?.size) {
    if (Date.now() < semFfmpegAte || !(await capaPronta(nome, real, rel))) return json(res, 404, { erro: 'Capa indisponível.' });
  }
  const etag = `"${nome.slice(0, -4)}"`;
  // o endereço muda quando o vídeo muda (?capa=<tamanho>-<data>): pode ficar um dia no navegador
  const comuns = { 'cache-control': 'private, max-age=86400', etag };
  if (String(req.headers['if-none-match'] ?? '').split(',').map((s) => s.trim().replace(/^W\//, '')).includes(etag)) {
    res.writeHead(304, comuns);
    return res.end();
  }
  const dados = await readFile(arquivo);
  res.writeHead(200, { ...comuns, 'content-type': 'image/jpeg', 'content-length': String(dados.length) });
  res.end(req.method === 'HEAD' ? undefined : dados);
}
