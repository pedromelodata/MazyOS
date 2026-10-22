// Envio de arquivos pra aprovação técnica (21/10/2026, Pedro: "Dentro de aprovações técnicas, permita também subir
// direto lá alguns arquivos com um título e uma base e logo depois permitir enviar para aprovação").
// O time sobe imagem, PDF ou vídeo com um título e a base técnica (de onde vem o que o arquivo diz) e manda pro Diretor
// contábil pelas mesmas rotas das peças (aprovacoes.mjs: enviar, aprovar, ajustar, mensagem).
// Banco: db.envios, um item por envio:
//   { id, titulo, base, arquivos: [{ id, nome, tipo, ext, tamanho, enviadoEm, enviadoPor, enviadoPorId }], criadoEm,
//     criadoPor, criadoPorId, atualizadoEm, atualizadoPor, aprovacao: null | (o mesmo formato de db.reels[].aprovacao) }
// Disco: data/envios/<envioId>/<arquivoId>.<ext>. O nome que a pessoa deu é só pra mostrar: o caminho nunca usa ele.
// O tipo sai dos BYTES DO COMEÇO do arquivo (tipoPelosBytes), nunca do Content-Type nem da extensão que chegou: SVG,
// HTML, zip, exe e o resto dão 415. Até 200 MB por arquivo e 20 por envio.
// Rotas (o perfil já foi conferido pelo servidor, auth.podeApi: o Diretor contábil só lê os arquivos):
//   POST   /api/envios                       { titulo, base }  → 201 com o envio na forma de tela
//   GET    /api/envios/:id                   → o envio
//   PUT    /api/envios/:id                   { titulo?, base? } → o envio
//   DELETE /api/envios/:id                   → { ok: true } (a pasta do envio sai junto)
//   POST   /api/envios/:id/arquivos          corpo CRU (o arquivo), x-nome-arquivo = encodeURIComponent(nome) → 201
//   DELETE /api/envios/:id/arquivos/:arq     → o envio
//   GET e HEAD /api/envios/:id/arquivos/:arq → o arquivo, com Range (videos.mjs, servirArquivo)
// Envio com o Diretor (aprovacao.estado pendente) não muda: 409. Aprovado e mexido vira "alterado" (precisa mandar de
// novo), como a peça do cronograma (aprovacoes.mjs, conferirMudancaAprovada).
// Decisões fora do contrato, anotadas aqui:
//  - travessão no título, na base e no nome vira vírgula (semTracos), como no texto da peça
//  - ftyp de imagem (HEIC e AVIF do celular) não é vídeo: 415, em vez de virar um "mp4" que não toca
//  - o Diretor contábil só abre arquivo de envio que já foi mandado pra aprovação (rascunho do time: 404)
//  - recusa do upload antes de ler o corpo inteiro (404, 409, 413) fecha a conexão: o servidor não engole 200 MB à toa
// 21/10 (Pedro, revisão do upload):
//  - pedido que morreu antes do pipe (aba fechada logo no começo) é recusado na hora: gravarCorpo não fica esperando
//  - o nome gravado e servido termina sempre na extensão do tipo que os bytes deram (parecer.bat vira parecer.gif)
//  - a vaga do arquivo é reservada antes de ler o corpo (contador em memória por envio, solto no finally): uploads
//    juntos não passam dos 20 arquivos só depois de ler 200 MB cada um
//  - antes de aceitar, o disco precisa ficar com pelo menos 2 GB livres descontando o que os uploads em andamento ainda
//    podem gravar (fs.statfs); sem isso, 507. Sem conseguir medir o disco, 503 (falha fechada)
//  - temporário de upload que morreu (.subindo-*.tmp com mais de 30 min) sai no primeiro upload depois do boot
//  - recusa com o corpo ainda chegando fecha a conexão pela regra única do auth.mjs (fecharSeCorpoChegando)
//  - aprovação em 2 etapas (aprovacoes.mjs): o envio pendente não muda em nenhuma das duas; o Diretor contábil só abre
//    arquivo de envio que ele vê (auth.diretorVe: pendente na etapa dele ou decidido nela)
import { createWriteStream } from 'node:fs';
import { mkdir, rename, rm, readdir, stat, statfs } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { carregar, salvar, falha, agora, novoId, arquivoDados, semTracos } from './db.mjs';
import { servirArquivo, dentroDe } from './videos.mjs';
import * as auth from './auth.mjs';

export const PASTA_ENVIOS = arquivoDados('envios');
export const MAX_BYTES = 200 * 1024 * 1024;
export const MAX_ARQUIVOS = 20;
export const LIM = { titulo: 200, base: 3000, nome: 120 };
const LIM_CONVERSA = 300;
const CABECA = 16;

export const MSG_TIPO = 'Esse tipo de arquivo não entra: mande imagem (PNG, JPG, WEBP ou GIF), PDF ou vídeo (MP4, MOV ou WEBM).';
export const MSG_GRANDE = 'O arquivo passa de 200 MB.';
export const MSG_PAROU = 'O envio do arquivo parou no meio. Tente de novo.';
export const MSG_SEM_ESPACO = 'O servidor está sem espaço pra arquivos agora. Avise quem cuida do servidor.';
const MSG_COM_DIRETOR = 'Está com o Diretor contábil: espere a decisão antes de mexer.';
const MSG_COM_GERENTES = 'Está com os gerentes: espere a decisão antes de mexer.';
// 21/10: espaço livre mínimo no disco depois do upload, e a idade do temporário que é lixo
export const ESPACO_MIN = 2 * 1024 ** 3;
const TEMPORARIO_VELHO_MS = 30 * 60_000;
const TEMPORARIO = /^\.subindo-[0-9a-f-]{36}\.tmp$/;
const MSG_SEM_ENVIO = 'Esse envio não existe mais.';
const MSG_SEM_ARQUIVO = 'Esse arquivo não existe mais.';

const ID_ENVIO = /^env_[A-Za-z0-9_-]{1,64}$/;
const ID_ARQUIVO = /^arq_[A-Za-z0-9_-]{1,64}$/;
export const ehEnvio = (id) => ID_ENVIO.test(String(id ?? ''));
export const ehArquivo = (id) => ID_ARQUIVO.test(String(id ?? ''));
const EXTENSOES = new Set(['png', 'jpg', 'gif', 'webp', 'pdf', 'webm', 'mp4', 'mov']);

// ---------- tipo pelos bytes do começo ----------

// marcas do ftyp que são imagem (HEIC e AVIF, a foto do celular), não vídeo
const FTYP_IMAGEM = new Set(['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'hevm', 'hevs', 'mif1', 'msf1', 'avif', 'avis']);

// { tipo, ext } ou null (não entra)
export function tipoPelosBytes(b) {
  if (!(b instanceof Uint8Array)) return null;
  const bytes = (pos, lista) => b.length >= pos + lista.length && lista.every((x, i) => b[pos + i] === x);
  const letras = (pos, s) => bytes(pos, [...s].map((c) => c.charCodeAt(0)));
  if (bytes(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { tipo: 'image/png', ext: 'png' };
  if (bytes(0, [0xff, 0xd8, 0xff])) return { tipo: 'image/jpeg', ext: 'jpg' };
  if (letras(0, 'GIF87a') || letras(0, 'GIF89a')) return { tipo: 'image/gif', ext: 'gif' };
  if (letras(0, 'RIFF') && letras(8, 'WEBP')) return { tipo: 'image/webp', ext: 'webp' };
  if (letras(0, '%PDF-')) return { tipo: 'application/pdf', ext: 'pdf' };
  if (bytes(0, [0x1a, 0x45, 0xdf, 0xa3])) return { tipo: 'video/webm', ext: 'webm' };
  if (letras(4, 'ftyp')) {
    const marca = b.length >= 12 ? Buffer.from(b.subarray(8, 12)).toString('latin1') : '';
    if (FTYP_IMAGEM.has(marca)) return null;
    return marca === 'qt  ' ? { tipo: 'video/quicktime', ext: 'mov' } : { tipo: 'video/mp4', ext: 'mp4' };
  }
  return null;
}
const TIPOS_OK = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'video/webm', 'video/mp4', 'video/quicktime']);

// ---------- textos ----------

// caractere de controle e os invisíveis que viram a ordem do texto (o "gpj.exe" que aparece como "exe.jpg")
const INVISIVEIS = /[\u0000-\u001f\u007f-\u009f​‌‎‏‪-‮⁠-⁤⁦-⁩﻿]/g;

// o nome que aparece na tela: sem controle, sem barra, até 120 caracteres. Vazio: "arquivo.<ext>"
export function limparNome(v, ext = '') {
  let s = String(v ?? '').normalize('NFC').replace(INVISIVEIS, '').replace(/[\\/]+/g, ' ');
  s = semTracos(s).replace(/\s+/g, ' ').trim();
  s = Array.from(s).slice(0, LIM.nome).join('').trim();
  return s || (ext ? `arquivo.${ext}` : 'arquivo');
}

// 21/10 (Pedro): o nome que fica gravado e que vai no download termina sempre na extensão do tipo que os bytes deram.
// A extensão que veio no nome sai (parecer.bat vira parecer.gif, foto.jpeg vira foto.jpg); "foto.png.exe" com bytes
// de PNG vira "foto.png" (sem repetir a extensão). Até 120 caracteres contando a extensão
export function nomeComExtensao(v, ext) {
  const fim = EXTENSOES.has(ext) ? `.${ext}` : '';
  let base = limparNome(v).replace(/\.[A-Za-z0-9]{1,10}$/, '');
  if (fim && base.toLowerCase().endsWith(fim)) base = base.slice(0, -fim.length);
  base = Array.from(base.replace(/[.\s]+$/, '')).slice(0, LIM.nome - fim.length).join('').replace(/[.\s]+$/, '');
  return `${base || 'arquivo'}${fim}`;
}

// título (uma linha) e base (pode ter linhas): obrigatórios, sem controle e sem travessão
function textoEnvio(v, rotulo, max, { linha = false } = {}) {
  if (v != null && typeof v !== 'string') throw falha(400, `${rotulo} precisa ser texto.`);
  let s = String(v ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '');
  if (linha) s = s.replace(/\s+/g, ' ');
  s = semTracos(s).trim();
  if (!s) throw falha(400, `${rotulo} não pode ficar ${rotulo.startsWith('A ') ? 'vazia' : 'vazio'}.`);
  if (s.length > max) throw falha(400, `${rotulo} passou de ${max} caracteres.`);
  return s;
}
const lerTitulo = (v) => textoEnvio(v, 'O título', LIM.titulo, { linha: true });
const lerBase = (v) => textoEnvio(v, 'A base', LIM.base);

// x-nome-arquivo vem com encodeURIComponent; torto, fica como chegou (limparNome tira o resto)
function nomeDoCabecalho(v) {
  const s = String(Array.isArray(v) ? v[0] : v ?? '');
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

// filename* da RFC 5987: o que o encodeURIComponent deixa passar e a norma não aceita também vai codificado
const codificarNome = (s) => encodeURIComponent(s).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

// ---------- banco ----------

export const urlArquivo = (envioId, arquivoId) => `/api/envios/${envioId}/arquivos/${arquivoId}`;

// o envio como a aba mostra (e como /api/aprovacoes devolve junto das peças)
export function paraTela(e) {
  return {
    id: e.id, envio: true, titulo: e.titulo ?? '', ideia: e.titulo ?? '', base: e.base ?? '', peca: 'arquivos', data: '',
    arquivos: (e.arquivos ?? []).map((a) => ({ id: a.id, nome: nomeComExtensao(a.nome, a.ext), tipo: a.tipo, tamanho: a.tamanho, url: urlArquivo(e.id, a.id) })),
    aprovacao: e.aprovacao ?? null, criadoPor: e.criadoPor ?? null, criadoEm: e.criadoEm ?? null, atualizadoEm: e.atualizadoEm ?? null,
  };
}

async function acharEnvio(id) {
  const db = await carregar();
  db.envios ??= [];
  const e = ehEnvio(id) && db.envios.find((x) => x?.id === id);
  if (!e) throw falha(404, MSG_SEM_ENVIO);
  e.arquivos ??= [];
  return { db, e };
}

function conferirMexivel(e) {
  if (e.aprovacao?.estado !== 'pendente') return;
  throw falha(409, auth.etapaDaAprovacao(e.aprovacao) === 'gerentes' ? MSG_COM_GERENTES : MSG_COM_DIRETOR);
}

// 21/10: vagas e bytes reservados pelos uploads em andamento (memória: o servidor é um processo só). A vaga entra
// antes de ler o corpo e sai no finally, deu certo ou não
const subindo = new Map(); // envioId → uploads em andamento
let bytesSubindo = 0; // o máximo que os uploads em andamento ainda podem gravar
// proprias: as reservas deste mesmo pedido (que já estão contadas)
function conferirVaga(e, proprias = 0) {
  if (e.arquivos.length + (subindo.get(e.id) ?? 0) - proprias >= MAX_ARQUIVOS) {
    throw falha(409, `Esse envio já tem ${MAX_ARQUIVOS} arquivos (contando os que estão subindo agora): tire um antes de subir outro.`);
  }
}
function reservar(envioId, bytes) {
  subindo.set(envioId, (subindo.get(envioId) ?? 0) + 1);
  bytesSubindo += bytes;
  let solta = false;
  return () => {
    if (solta) return;
    solta = true;
    const n = (subindo.get(envioId) ?? 1) - 1;
    if (n > 0) subindo.set(envioId, n);
    else subindo.delete(envioId);
    bytesSubindo -= bytes;
  };
}

// o disco (trocável no teste): bytes livres pra quem não é root, na pasta dos envios
export const disco = {
  async livre(pasta) {
    const s = await statfs(pasta);
    return Number(s.bavail) * Number(s.bsize);
  },
};
async function conferirEspaco() {
  let livre;
  try {
    livre = await disco.livre(PASTA_ENVIOS);
  } catch (err) {
    console.error('Espaço livre dos envios não foi medido:', err.message);
    throw falha(503, 'Não deu pra conferir o espaço livre do servidor. Tente de novo em instantes.');
  }
  if (!Number.isFinite(livre) || livre - bytesSubindo < ESPACO_MIN) throw falha(507, MSG_SEM_ESPACO);
}

// temporário de upload que morreu no meio (servidor reiniciado, disco cheio): mais de 30 min sem mexer é lixo.
// Devolve quantos saíram
export async function limparTemporariosVelhos(agoraMs = Date.now()) {
  let nomes;
  try {
    nomes = await readdir(PASTA_ENVIOS);
  } catch (err) {
    if (err.code === 'ENOENT') return 0;
    throw err;
  }
  let n = 0;
  for (const nome of nomes) {
    if (!TEMPORARIO.test(nome)) continue;
    const p = path.join(PASTA_ENVIOS, nome);
    try {
      if (agoraMs - (await stat(p)).mtimeMs <= TEMPORARIO_VELHO_MS) continue;
      await rm(p, { force: true });
      n++;
    } catch (err) {
      if (err.code !== 'ENOENT') console.error(`Temporário ${nome} ficou:`, err.message);
    }
  }
  if (n) console.log(`${n} ${n === 1 ? 'temporário velho de upload apagado' : 'temporários velhos de upload apagados'} em ${PASTA_ENVIOS}`);
  return n;
}
let limpeza = null;
const limparUmaVez = () => (limpeza ??= limparTemporariosVelhos().catch((err) => console.error('Limpeza dos temporários de upload:', err.message)));

// a conversa no mesmo formato da peça (aprovacoes.mjs, registrar)
function registrar(e, tipo, u, texto, extra = {}) {
  e.aprovacao.conversa ??= [];
  e.aprovacao.conversa.push({ id: novoId('apv'), em: agora(), tipo, autor: u.nome, autorId: u.id, papel: auth.papelDe(u), texto, ...extra });
  if (e.aprovacao.conversa.length > LIM_CONVERSA) e.aprovacao.conversa.splice(0, e.aprovacao.conversa.length - LIM_CONVERSA);
}

// mexeu no título, na base ou nos arquivos: aprovado vira "alterado" (manda de novo); ajuste e rascunho seguem como estão
function mexeu(e, mudou, u) {
  e.atualizadoEm = agora();
  e.atualizadoPor = u.nome;
  if (e.aprovacao?.estado !== 'aprovado' || !mudou.length) return;
  e.aprovacao.estado = 'alterado';
  registrar(e, 'alterado', u, 'O envio mudou depois de aprovado: mande de novo pra aprovação', { mudou });
}

const pastaDoEnvio = (envioId) => path.join(PASTA_ENVIOS, envioId);
// null quando o id ou a extensão gravados no banco não são os nossos (banco mexido à mão)
function caminhoDoArquivo(envioId, a) {
  if (!ehEnvio(envioId) || !ehArquivo(a?.id) || !EXTENSOES.has(a?.ext)) return null;
  const p = path.join(pastaDoEnvio(envioId), `${a.id}.${a.ext}`);
  return dentroDe(p, PASTA_ENVIOS) ? p : null;
}

// ---------- corpo cru até o teto ----------

// grava o corpo do pedido em destino, com teto em streaming: passou, para de ler, apaga o que gravou e dá 413.
// Devolve { total, cabeca } (cabeca: os primeiros bytes, pra conferir o tipo). O pedido não entra no pipeline:
// destruir o pedido derruba a conexão e a resposta (o 413) não chegaria
export async function gravarCorpo(req, destino, max = MAX_BYTES) {
  // 21/10: o pedido já morreu antes de chegar aqui (aba fechada enquanto o servidor conferia o envio e o disco): o
  // 'aborted' e o 'close' já passaram e ninguém avisaria o medidor, que ficaria esperando pra sempre. Recusa na hora
  if (req.destroyed && !req.readableEnded) throw falha(400, MSG_PAROU);
  const cabeca = [];
  let lidos = 0;
  let total = 0;
  const medidor = new Transform({
    transform(c, _cod, pronto) {
      total += c.length;
      if (total > max) return pronto(falha(413, MSG_GRANDE));
      if (lidos < CABECA) {
        const pedaco = c.subarray(0, CABECA - lidos);
        cabeca.push(pedaco);
        lidos += pedaco.length;
      }
      pronto(null, c);
    },
  });
  // a pessoa fechou a aba ou a rede caiu no meio: o medidor para com erro (sem isso, ficaria esperando pra sempre)
  const parou = () => falha(400, MSG_PAROU);
  const cortou = () => {
    if (!req.complete && !req.readableEnded) medidor.destroy(parou());
  };
  const erroPedido = () => medidor.destroy(parou());
  req.once('aborted', cortou);
  req.once('close', cortou);
  req.once('error', erroPedido);
  req.pipe(medidor);
  try {
    await pipeline(medidor, createWriteStream(destino, { flags: 'wx' }));
  } catch (e) {
    req.unpipe(medidor);
    await rm(destino, { force: true, maxRetries: 3, retryDelay: 60 }).catch(() => {});
    throw e;
  } finally {
    req.off('aborted', cortou);
    req.off('close', cortou);
    req.off('error', erroPedido);
  }
  return { total, cabeca: Buffer.concat(cabeca) };
}

// rename com paciência: no Windows o antivírus segura o arquivo novo por um instante
async function mover(de, para) {
  for (let i = 0; ; i++) {
    try {
      return await rename(de, para);
    } catch (e) {
      if (i >= 4 || !['EPERM', 'EBUSY', 'EACCES'].includes(e.code)) throw e;
      await new Promise((ok) => setTimeout(ok, 60 * (i + 1)));
    }
  }
}

// ---------- ações ----------

async function criar(b, u) {
  const titulo = lerTitulo(b.titulo);
  const base = lerBase(b.base);
  const db = await carregar();
  db.envios ??= [];
  const e = {
    id: novoId('env'), titulo, base, arquivos: [], criadoEm: agora(), criadoPor: u.nome, criadoPorId: u.id,
    atualizadoEm: null, atualizadoPor: null, aprovacao: null,
  };
  db.envios.push(e);
  await salvar();
  return paraTela(e);
}

async function editar(id, b, u) {
  const { e } = await acharEnvio(id);
  conferirMexivel(e);
  // confere tudo antes de mexer: título bom com base ruim não muda nada
  const novo = {};
  if ('titulo' in b) novo.titulo = lerTitulo(b.titulo);
  if ('base' in b) novo.base = lerBase(b.base);
  const mudou = [];
  if ('titulo' in novo && novo.titulo !== e.titulo) mudou.push('título');
  if ('base' in novo && novo.base !== e.base) mudou.push('base');
  if (!mudou.length) return paraTela(e);
  Object.assign(e, novo);
  mexeu(e, mudou, u);
  await salvar();
  return paraTela(e);
}

async function apagar(id) {
  const { db, e } = await acharEnvio(id);
  conferirMexivel(e);
  db.envios.splice(db.envios.indexOf(e), 1);
  await salvar();
  // o banco já não tem o envio: falha no disco vai pro log (sobra uma pasta que ninguém lista)
  await rm(pastaDoEnvio(e.id), { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
    .catch((err) => console.error(`Envio ${e.id} apagado, mas a pasta dele ficou:`, err.message));
  return { ok: true };
}

async function subir(req, id, u) {
  limparUmaVez();
  const { e } = await acharEnvio(id);
  conferirMexivel(e);
  const declarado = Number(req.headers['content-length']);
  if (Number.isFinite(declarado) && declarado > MAX_BYTES) throw falha(413, MSG_GRANDE);
  conferirVaga(e);
  // 21/10: a vaga e os bytes ficam reservados antes de ler o corpo (sem await entre a conferência e a reserva).
  // Sem tamanho declarado (chunked), reserva o teto
  const soltar = reservar(e.id, Number.isFinite(declarado) && declarado >= 0 && req.headers['content-length'] != null ? declarado : MAX_BYTES);
  const tmp = path.join(PASTA_ENVIOS, `.subindo-${randomUUID()}.tmp`);
  let final = null;
  try {
    const nome = nomeDoCabecalho(req.headers['x-nome-arquivo']);
    await mkdir(PASTA_ENVIOS, { recursive: true });
    await conferirEspaco();
    // o temporário fica dentro de data/envios (o rename não atravessa disco) e com nome que não é de envio
    const { total, cabeca } = await gravarCorpo(req, tmp, MAX_BYTES);
    const t = tipoPelosBytes(cabeca);
    if (!t) throw falha(415, MSG_TIPO);
    // o envio pode ter mudado enquanto o arquivo chegava (apagado, mandado pra aprovação, outro arquivo subiu)
    const { e: atual } = await acharEnvio(id);
    conferirMexivel(atual);
    conferirVaga(atual, 1);
    const a = { id: novoId('arq'), nome: nomeComExtensao(nome, t.ext), tipo: t.tipo, ext: t.ext, tamanho: total, enviadoEm: agora(), enviadoPor: u.nome, enviadoPorId: u.id };
    const destino = caminhoDoArquivo(atual.id, a);
    if (!destino) throw falha(400, 'Endereço inválido.');
    await mkdir(pastaDoEnvio(atual.id), { recursive: true });
    await mover(tmp, destino);
    final = destino;
    // de novo depois do rename, já sem await até o push: nada passa no meio
    const db = await carregar();
    const agoraEnvio = (db.envios ?? []).find((x) => x?.id === id);
    if (!agoraEnvio) throw falha(404, MSG_SEM_ENVIO);
    agoraEnvio.arquivos ??= [];
    conferirMexivel(agoraEnvio);
    conferirVaga(agoraEnvio, 1);
    agoraEnvio.arquivos.push(a);
    mexeu(agoraEnvio, ['arquivos'], u);
    final = null;
    await salvar();
    return paraTela(agoraEnvio);
  } finally {
    soltar();
    await rm(tmp, { force: true }).catch(() => {});
    if (final) await rm(final, { force: true }).catch(() => {});
  }
}

async function tirarArquivo(id, arquivoId, u) {
  const { e } = await acharEnvio(id);
  const a = e.arquivos.find((x) => x?.id === arquivoId);
  if (!a) throw falha(404, MSG_SEM_ARQUIVO);
  conferirMexivel(e);
  e.arquivos.splice(e.arquivos.indexOf(a), 1);
  mexeu(e, ['arquivos'], u);
  await salvar();
  const p = caminhoDoArquivo(e.id, a);
  if (p) await rm(p, { force: true, maxRetries: 3, retryDelay: 100 }).catch((err) => console.error(`Arquivo ${e.id}/${a.id} tirado, mas ficou no disco:`, err.message));
  return paraTela(e);
}

async function servirDoEnvio(req, res, id, arquivoId, sess, json) {
  const { e } = await acharEnvio(id);
  const a = e.arquivos.find((x) => x?.id === arquivoId);
  // o Diretor contábil só vê o que já chegou nele (o rascunho do time e o que ainda está com os gerentes não)
  if (!a || (auth.papelDe(sess?.usuario) === 'diretor' && !auth.diretorVe(e.aprovacao))) return json(res, 404, { erro: MSG_SEM_ARQUIVO });
  const real = caminhoDoArquivo(e.id, a);
  if (!real) return json(res, 404, { erro: MSG_SEM_ARQUIVO });
  return servirArquivo(req, res, real, {
    json,
    tipo: TIPOS_OK.has(a.tipo) ? a.tipo : 'application/octet-stream',
    cache: 'private, no-cache',
    extras: { 'x-content-type-options': 'nosniff', 'content-disposition': `inline; filename*=UTF-8''${codificarNome(nomeComExtensao(a.nome, a.ext))}` },
    rotulo: `Arquivo ${e.id}/${a.id}`,
    naoAchou: MSG_SEM_ARQUIVO,
    ocupado: 'O arquivo está sendo gravado agora. Tente de novo em instantes.',
  });
}

// /api/envios[/:id[/arquivos[/:arq]]]. partes: o que vem depois de "envios" (já decodificado pelo servidor)
export async function rota(req, res, partes, sess, { json, corpoJson }) {
  const [id, sub, arq] = partes;
  const m = req.method;
  const u = sess.usuario;
  const so = (...metodos) => {
    res.setHeader('allow', metodos.join(', '));
    return json(res, 405, { erro: 'Método não permitido.' });
  };
  if (!id) {
    if (m !== 'POST') return so('POST');
    return json(res, 201, await criar(await corpoJson(req, 100_000), u));
  }
  if (!ehEnvio(id)) return json(res, 404, { erro: MSG_SEM_ENVIO });
  if (!sub) {
    if (m === 'GET') return json(res, 200, paraTela((await acharEnvio(id)).e));
    if (m === 'PUT') return json(res, 200, await editar(id, await corpoJson(req, 100_000), u));
    if (m === 'DELETE') return json(res, 200, await apagar(id));
    return so('GET', 'PUT', 'DELETE');
  }
  if (sub !== 'arquivos') return json(res, 404, { erro: 'Rota não existe.' });
  if (!arq) {
    if (m !== 'POST') return so('POST');
    try {
      return json(res, 201, await subir(req, id, u));
    } catch (e) {
      // recusado antes de ler o corpo inteiro: a conexão fecha depois da resposta, em vez de o servidor ler (e
      // jogar fora) o resto do arquivo (a regra única do auth.mjs)
      auth.fecharSeCorpoChegando(req, res);
      throw e;
    }
  }
  if (!ehArquivo(arq)) return json(res, 404, { erro: MSG_SEM_ARQUIVO });
  if (m === 'GET' || m === 'HEAD') return servirDoEnvio(req, res, id, arq, sess, json);
  if (m === 'DELETE') return json(res, 200, await tirarArquivo(id, arq, u));
  return so('GET', 'HEAD', 'DELETE');
}
