// 22/10 (Pedro): banco de assets do editor de Design do Ateliê ("Canva básico" dentro do sistema). Pedido: "banco de
// assets 3D (os que já existem e os nossos), usar nas imagens, adicionar e remover à mão".
// Duas origens, uma lista só:
//  - base: os assets curados que vêm no repo, em estudio/base/assets/, descritos em estudio/base/catalogo.json
//    (montado por estudio/base/montar-banco.py: o Léo, a papelada, os celulares com tela real, o símbolo 3D, argila,
//    ícones Fluent, a marca e os fundos). Somente leitura: "apagar" um asset base só esconde (oculto), e editar o
//    nome, a categoria, as tags ou a descrição grava uma camada por cima, em data/estudio/assets.json
//  - upload: o que o time sobe pela tela, em data/estudio/assets/<id>.<ext>, registrado em data/estudio/assets.json.
//    Apagar um upload apaga o arquivo
// Asset na tela (o contrato do editor): { id, nome, categoria, tags, descricao, origem: 'base'|'upload', largura,
// altura, tipo, tamanho, licenca, oculto, criadoEm, criadoPor, url: '/api/estudio/assets/<id>/arquivo' }
// Rotas (o perfil é conferido pelo servidor, auth.podeApi: o estúdio é do time; o Diretor contábil não chega aqui):
//   GET    /api/estudio/assets?q=&categoria=&ocultos=1 → { assets, categorias }
//   GET    /api/estudio/assets/:id                     → o asset
//   GET e HEAD /api/estudio/assets/:id/arquivo          → o arquivo (cache, ETag, nosniff; SVG com CSP sandbox; ?baixar=1 vem como download com o nome do asset)
//   GET e HEAD /api/estudio/assets/:id/miniatura        → a miniatura da grade (WEBP de 320 px da base) ou o original
//   GET e HEAD /api/estudio/assets/:id/tela             → a versão de tela do canvas (WEBP de 1200 px da base) ou o original
//   POST   /api/estudio/assets                          corpo CRU (o arquivo); x-nome-arquivo, x-categoria e x-tags
//                                                       com encodeURIComponent (tags separadas por vírgula) → 201
//   PUT    /api/estudio/assets/:id                     { nome?, categoria?, tags?, descricao? } → o asset
//   DELETE /api/estudio/assets/:id[?forcar=1]          upload: apaga ({ ok, apagado }); base: esconde ({ ok, oculto, asset })
//   POST   /api/estudio/assets/:id/restaurar           base escondido volta pra lista → o asset
// Upload (o padrão do envios.mjs): o tipo sai dos BYTES do começo (PNG, JPEG ou WEBP; SVG, GIF, PDF e o resto dão
// 415, SVG só entra pela base do repo), teto de 30 MB em streaming, no máximo 8000 x 8000 px lidos do cabeçalho da
// imagem (com a orientação EXIF do JPEG de celular), temporário + rename, vaga reservada antes de ler o corpo,
// espaço livre mínimo no disco e connection: close na recusa com o corpo ainda chegando.
// Decisões fora do contrato, anotadas aqui:
//  - asset escondido continua servindo o arquivo: um design que já usa ele não quebra; só some da lista (ocultos=1
//    mostra) e a IA não escolhe
//  - upload que está em algum design (estudio.mjs, usosDoAsset) não é apagado: 409 com { erro, usos: [{ id, titulo }] }
//    e a mensagem diz quais designs. ?forcar=1 apaga mesmo assim (o design fica com a camada vazia e a revisão avisa)
//  - a lista vem em { assets, categorias }, na ordem das categorias; dentro de cada uma, os uploads mais novos
//    primeiro e depois a base na ordem do catálogo
//  - no máximo 4 uploads ao mesmo tempo (429) e 3000 uploads no banco (409); a imagem passa de 8000 px = 422
//  - licença do upload: "Enviado pelo time" (quem sobe responde pelo direito de uso; a tela pode avisar)
//  - travessão no nome, nas tags e na descrição vira vírgula (semTracos), como no resto do app
//  - CRONOGRAMA_ESTUDIO_BASE (teste) troca a pasta da base (estudio/base)
//  - 22/10 (Pedro): a grade baixava o PNG inteiro de cada asset (o Léo tem até 4,5 MB). O asset na tela ganha
//    "miniatura" (a rota /miniatura): pra base, o WEBP de 320 px de estudio/base/miniaturas/<nome>.webp (feito pelo
//    estudio/base/miniaturas.py, que refaz todas: rodar depois de mexer no banco); sem ela, e pro upload (o servidor
//    não tem biblioteca de imagem), o próprio arquivo. O canvas e a exportação continuam no arquivo original (url)
import { open, mkdir, rename, rm, readdir, stat, statfs, readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { APP, arquivoDados, falha, agora, novoId, semTracos, lerJsonEstrito, gravarJson } from './db.mjs';
import { servirArquivo, dentroDe } from './videos.mjs';
import { gravarCorpo, tipoPelosBytes, limparNome } from './envios.mjs';
import * as auth from './auth.mjs';

export const PASTA_BASE = process.env.CRONOGRAMA_ESTUDIO_BASE ? path.resolve(process.env.CRONOGRAMA_ESTUDIO_BASE) : path.join(APP, 'estudio', 'base');
export const PASTA_BASE_ASSETS = path.join(PASTA_BASE, 'assets');
export const PASTA_BASE_DOCS = path.join(PASTA_BASE, 'docs');
export const PASTA_BASE_MINIATURAS = path.join(PASTA_BASE, 'miniaturas');
// 22/10 (Pedro: "demorando muito para carregar"): a versão de tela que o canvas do editor mostra (a exportação continua
// no original). Feita pelo mesmo estudio/base/miniaturas.py
export const PASTA_BASE_TELAS = path.join(PASTA_BASE, 'telas');
export const PASTA_UPLOADS = arquivoDados(path.join('estudio', 'assets'));
const REGISTRO = 'estudio/assets.json';

export const CATEGORIAS = ['leo', '3d', 'icone', 'marca', 'tela-app', 'foto', 'fundo', 'outro'];
export const ROTULO_CATEGORIA = { leo: 'Léo', '3d': '3D', icone: 'Ícones', marca: 'Marca', 'tela-app': 'Telas do app', foto: 'Fotos', fundo: 'Fundos', outro: 'Outros' };
// trocáveis no teste
export const LIMITES = { bytes: 30 * 1024 * 1024, lado: 8000, simultaneos: 4, uploads: 3000 };
export const LIM = { nome: 120, tag: 40, tags: 20, descricao: 1000 };
export const ESPACO_MIN = 2 * 1024 ** 3;
const TEMPORARIO = /^\.subindo-[0-9a-f-]{36}\.tmp$/;
const TEMPORARIO_VELHO_MS = 30 * 60_000;
const LICENCA_UPLOAD = 'Enviado pelo time';

export const MSG_TIPO = 'Esse arquivo não entra no banco: mande imagem PNG, JPG ou WEBP. SVG só entra pela base do repo.';
export const MSG_GRANDE = 'O arquivo passa de 30 MB.';
export const MSG_ILEGIVEL = 'Não deu pra ler o tamanho da imagem: o arquivo parece corrompido.';
export const MSG_SEM_ASSET = 'Esse asset não existe mais.';
export const MSG_SEM_ESPACO = 'O servidor está sem espaço pra arquivos agora. Avise quem cuida do servidor.';

const ID_BASE = /^ast_base_[a-z0-9-]{1,80}$/;
const ID_UPLOAD = /^ast_[A-Za-z0-9_-]{1,64}$/;
export const ehAsset = (id) => ID_UPLOAD.test(String(id ?? ''));
const ehBase = (id) => ID_BASE.test(String(id ?? ''));
const ARQUIVO_BASE = /^[a-z0-9][a-z0-9-]{0,100}\.(png|jpg|webp|svg)$/;
const TIPOS_BASE = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml' };
const TIPOS_UPLOAD = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

export const urlArquivo = (id) => `/api/estudio/assets/${id}/arquivo`;
export const urlMiniatura = (id) => `/api/estudio/assets/${id}/miniatura`;
const objeto = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

// ---------- textos ----------

// sem acento e em minúsculas, pra busca ("Léo" acha "leo" e vice-versa)
export const semAcento = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const CONTROLE = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g;

function lerNome(v) {
  if (typeof v !== 'string') throw falha(400, 'O nome precisa ser texto.');
  const s = semTracos(v.normalize('NFC').replace(CONTROLE, '').replace(/\s+/g, ' ')).trim();
  if (!s) throw falha(400, 'O nome não pode ficar vazio.');
  if (Array.from(s).length > LIM.nome) throw falha(400, `O nome passou de ${LIM.nome} caracteres.`);
  return s;
}
function lerCategoria(v) {
  const s = String(v ?? '').trim().toLowerCase();
  if (!CATEGORIAS.includes(s)) throw falha(400, `A categoria precisa ser ${CATEGORIAS.join(', ')}.`);
  return s;
}
// lista ou texto separado por vírgula; sem repetir, sem vazio, até 20 tags de 40 caracteres
export function lerTags(v) {
  if (v == null || v === '') return [];
  const itens = typeof v === 'string' ? v.split(',') : v;
  if (!Array.isArray(itens) || itens.some((t) => typeof t !== 'string')) throw falha(400, 'As tags precisam ser uma lista de textos.');
  const saida = [];
  for (const t of itens) {
    const s = semTracos(t.normalize('NFC').replace(CONTROLE, '').replace(/\s+/g, ' ')).trim().toLowerCase();
    if (!s) continue;
    if (Array.from(s).length > LIM.tag) throw falha(400, `A tag "${s.slice(0, 20)}" passou de ${LIM.tag} caracteres.`);
    if (!saida.includes(s)) saida.push(s);
  }
  if (saida.length > LIM.tags) throw falha(400, `No máximo ${LIM.tags} tags.`);
  return saida;
}
function lerDescricao(v) {
  if (v == null) return '';
  if (typeof v !== 'string') throw falha(400, 'A descrição precisa ser texto.');
  const s = semTracos(v.normalize('NFC').replace(/\r\n?/g, '\n').replace(CONTROLE, '')).trim();
  if (Array.from(s).length > LIM.descricao) throw falha(400, `A descrição passou de ${LIM.descricao} caracteres.`);
  return s;
}
function cabecalho(req, nome) {
  const v = req.headers[nome];
  const s = String(Array.isArray(v) ? v[0] : v ?? '');
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

// ---------- base (catalogo.json) ----------

// confere o catálogo inteiro (o teste usa no catálogo de verdade do repo). Devolve { assets, problemas }: o que tem
// problema fica de fora da lista
export async function validarCatalogo(pasta = PASTA_BASE) {
  let bruto;
  try {
    bruto = JSON.parse(await readFile(path.join(pasta, 'catalogo.json'), 'utf8'));
  } catch (e) {
    return { assets: [], problemas: [`catalogo.json não foi lido (${e.code ?? e.message})`] };
  }
  const problemas = [];
  const assets = [];
  const vistos = new Set();
  for (const [i, a] of (Array.isArray(bruto?.assets) ? bruto.assets : []).entries()) {
    const onde = `assets[${i}] ${a?.id ?? ''}`;
    if (!ehBase(a?.id)) { problemas.push(`${onde}: id fora do padrão ast_base_<nome>`); continue; }
    if (vistos.has(a.id)) { problemas.push(`${onde}: id repetido`); continue; }
    if (!ARQUIVO_BASE.test(String(a.arquivo ?? ''))) { problemas.push(`${onde}: arquivo fora do padrão`); continue; }
    const ext = a.arquivo.split('.').pop();
    if (a.tipo !== TIPOS_BASE[ext]) { problemas.push(`${onde}: tipo ${a.tipo} não bate com .${ext}`); continue; }
    if (!CATEGORIAS.includes(a.categoria)) { problemas.push(`${onde}: categoria ${a.categoria} não existe`); continue; }
    if (!(a.largura > 0 && a.altura > 0)) { problemas.push(`${onde}: sem largura e altura`); continue; }
    if (typeof a.nome !== 'string' || !a.nome.trim()) { problemas.push(`${onde}: sem nome`); continue; }
    const real = path.join(pasta, 'assets', a.arquivo);
    let st;
    try {
      st = await stat(real);
    } catch {
      problemas.push(`${onde}: o arquivo ${a.arquivo} não existe`);
      continue;
    }
    if (!st.isFile()) { problemas.push(`${onde}: ${a.arquivo} não é arquivo`); continue; }
    vistos.add(a.id);
    assets.push({
      id: a.id, nome: a.nome.trim(), categoria: a.categoria, tags: Array.isArray(a.tags) ? a.tags.filter((t) => typeof t === 'string') : [],
      descricao: typeof a.descricao === 'string' ? a.descricao : '', origem: 'base', largura: Math.round(a.largura), altura: Math.round(a.altura),
      // 22/10 (achado da revisão): o catálogo pode nascer com o asset escondido (licença a confirmar); o time decide por cima
      tipo: a.tipo, tamanho: st.size, licenca: typeof a.licenca === 'string' ? a.licenca : '', oculto: a.oculto === true,
      criadoEm: typeof a.criadoEm === 'string' ? a.criadoEm : null, criadoPor: typeof a.criadoPor === 'string' ? a.criadoPor : 'Legalizaí',
      arquivo: a.arquivo,
    });
  }
  return { assets, problemas };
}

let base = null;
async function baseCarregada() {
  if (base) return base;
  const { assets, problemas } = await validarCatalogo();
  for (const p of problemas) console.error('Banco base do estúdio:', p);
  base = assets;
  return base;
}

// ---------- registro (data/estudio/assets.json) ----------

let registro = null;
let fila = Promise.resolve();
async function lerRegistro() {
  if (registro) return registro;
  const r = objeto(await lerJsonEstrito(REGISTRO, null));
  registro = { versao: 1, uploads: Array.isArray(r.uploads) ? r.uploads.filter((u) => u && ehAsset(u.id) && !ehBase(u.id)) : [], base: objeto(r.base) };
  return registro;
}
// muda o registro em fila (duas requisições juntas não se atropelam); falhou a gravação, o cache sai e a próxima
// leitura vem do disco
function mexer(fn) {
  const proxima = fila.then(async () => {
    const r = await lerRegistro();
    const saida = await fn(r);
    try {
      await mkdir(arquivoDados('estudio'), { recursive: true });
      await gravarJson(REGISTRO, r);
    } catch (e) {
      registro = null;
      throw e;
    }
    return saida;
  });
  fila = proxima.catch(() => {});
  return proxima;
}

// ---------- o asset na tela ----------

const CAMPOS = ['id', 'nome', 'categoria', 'tags', 'descricao', 'origem', 'largura', 'altura', 'tipo', 'tamanho', 'licenca', 'oculto', 'criadoEm', 'criadoPor'];
function paraTela(a) {
  const s = {};
  for (const k of CAMPOS) s[k] = a[k] ?? null;
  s.tags = Array.isArray(a.tags) ? a.tags : [];
  s.oculto = a.oculto === true;
  s.url = urlArquivo(a.id);
  s.miniatura = urlMiniatura(a.id);
  return s;
}
// o asset base com o que o time mudou por cima (nome, categoria, tags, descrição, oculto)
function baseComCamada(a, r) {
  const c = objeto(r.base[a.id]);
  const s = { ...a };
  if (typeof c.nome === 'string' && c.nome) s.nome = c.nome;
  if (CATEGORIAS.includes(c.categoria)) s.categoria = c.categoria;
  if (Array.isArray(c.tags)) s.tags = c.tags.filter((t) => typeof t === 'string');
  if (typeof c.descricao === 'string') s.descricao = c.descricao;
  s.oculto = typeof c.oculto === 'boolean' ? c.oculto : a.oculto === true;
  return s;
}

async function todos() {
  const [b, r] = await Promise.all([baseCarregada(), lerRegistro()]);
  return { r, base: b.map((a) => baseComCamada(a, r)), uploads: r.uploads };
}

async function acharInterno(id) {
  const { r, base: b, uploads } = await todos();
  if (ehBase(id)) {
    const a = b.find((x) => x.id === id);
    return a ? { r, a, origem: 'base' } : null;
  }
  const a = ehAsset(id) && uploads.find((x) => x.id === id);
  return a ? { r, a, origem: 'upload' } : null;
}

// a lista da tela (e da IA): sem os escondidos, a não ser com ocultos
export async function listar({ q = '', categoria = '', ocultos = false } = {}) {
  if (categoria && !CATEGORIAS.includes(categoria)) throw falha(400, `A categoria precisa ser ${CATEGORIAS.join(', ')}.`);
  const termos = semAcento(q).split(/\s+/).filter(Boolean).slice(0, 12);
  const { base: b, uploads } = await todos();
  const novosPrimeiro = [...uploads].sort((x, y) => String(y.criadoEm ?? '').localeCompare(String(x.criadoEm ?? '')));
  const lista = [...novosPrimeiro, ...b].filter((a) => {
    if (a.oculto && !ocultos) return false;
    if (categoria && a.categoria !== categoria) return false;
    if (!termos.length) return true;
    const palheiro = semAcento([a.nome, a.categoria, ROTULO_CATEGORIA[a.categoria], a.descricao, a.id, ...(a.tags ?? [])].join(' '));
    return termos.every((t) => palheiro.includes(t));
  });
  const ordem = (a) => CATEGORIAS.indexOf(a.categoria);
  return lista.map((a, i) => [a, i]).sort((x, y) => ordem(x[0]) - ordem(y[0]) || x[1] - y[1]).map(([a]) => paraTela(a));
}

export async function acharAsset(id) {
  const achado = await acharInterno(id);
  return achado ? paraTela(achado.a) : null;
}

// o caminho do arquivo no disco (pra quem usa o asset por dentro do servidor). null = não existe
export async function caminhoDoArquivo(id) {
  const achado = await acharInterno(id);
  return achado ? caminhoReal(achado.a, achado.origem) : null;
}
function caminhoReal(a, origem) {
  if (origem === 'base') {
    if (!ARQUIVO_BASE.test(String(a.arquivo ?? ''))) return null;
    const p = path.join(PASTA_BASE_ASSETS, a.arquivo);
    return dentroDe(p, PASTA_BASE_ASSETS) ? p : null;
  }
  const ext = TIPOS_UPLOAD[a.tipo];
  if (!ext || !ehAsset(a.id)) return null;
  const p = path.join(PASTA_UPLOADS, `${a.id}.${ext}`);
  return dentroDe(p, PASTA_UPLOADS) ? p : null;
}

// o que a IA lê pra escolher assets (gerar com IA): só os visíveis, sem tamanho de arquivo nem datas
export async function resumoParaIA() {
  return (await listar()).map(({ id, nome, categoria, tags, descricao, largura, altura, tipo }) => ({ id, nome, categoria, tags, descricao, largura, altura, tipo }));
}

// os documentos do destaque importado e outros modelos do repo (estudio/base/docs/*.json), pra quem semeia o banco
// de designs. JSON quebrado fica de fora, com aviso no log
export async function lerDocsBase(pasta = PASTA_BASE_DOCS) {
  let nomes;
  try {
    nomes = (await readdir(pasta)).filter((n) => /^[a-z0-9-]+\.json$/.test(n)).sort();
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
  const saida = [];
  for (const arquivo of nomes) {
    try {
      saida.push({ arquivo, doc: JSON.parse(await readFile(path.join(pasta, arquivo), 'utf8')) });
    } catch (e) {
      console.error(`Documento base ${arquivo} ficou de fora:`, e.message);
    }
  }
  return saida;
}

// ---------- tamanho da imagem pelo cabeçalho ----------

// { largura, altura } como a imagem aparece (JPEG girado pelo EXIF troca os dois), ou null (não deu pra ler)
export async function dimensoes(arquivo, tipo) {
  const fh = await open(arquivo, 'r');
  try {
    const ler = async (pos, n) => {
      const b = Buffer.alloc(n);
      const { bytesRead } = await fh.read(b, 0, n, pos);
      return b.subarray(0, bytesRead);
    };
    if (tipo === 'image/png') {
      const b = await ler(0, 24);
      if (b.length < 24 || b.toString('latin1', 12, 16) !== 'IHDR') return null;
      return valido(b.readUInt32BE(16), b.readUInt32BE(20));
    }
    if (tipo === 'image/webp') {
      const b = await ler(0, 30);
      if (b.length < 30) return null;
      const bloco = b.toString('latin1', 12, 16);
      if (bloco === 'VP8 ') {
        if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null;
        return valido(b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff);
      }
      if (bloco === 'VP8L') {
        if (b[20] !== 0x2f) return null;
        const [b0, b1, b2, b3] = [b[21], b[22], b[23], b[24]];
        return valido(1 + (((b1 & 0x3f) << 8) | b0), 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)));
      }
      if (bloco === 'VP8X') return valido(1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3));
      return null;
    }
    if (tipo === 'image/jpeg') return await dimensoesJpeg(ler);
    return null;
  } finally {
    await fh.close().catch(() => {});
  }
}
const valido = (largura, altura) => (Number.isInteger(largura) && Number.isInteger(altura) && largura > 0 && altura > 0 ? { largura, altura } : null);

// anda pelos marcadores do JPEG até o SOF (com a orientação do EXIF no caminho)
async function dimensoesJpeg(ler) {
  const ini = await ler(0, 2);
  if (ini.length < 2 || ini[0] !== 0xff || ini[1] !== 0xd8) return null;
  let pos = 2;
  let giro = 1;
  for (let passos = 0; passos < 10_000; passos++) {
    const m = await ler(pos, 4);
    if (m.length < 2 || m[0] !== 0xff) return null;
    const marca = m[1];
    if (marca === 0xff) { pos += 1; continue; } // byte de enchimento
    if (marca === 0xd8 || marca === 0x01 || (marca >= 0xd0 && marca <= 0xd7)) { pos += 2; continue; }
    if (marca === 0xd9 || marca === 0xda || m.length < 4) return null; // fim ou dados antes do SOF
    const tam = m.readUInt16BE(2);
    if (tam < 2) return null;
    const sof = marca >= 0xc0 && marca <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marca);
    if (sof) {
      const s = await ler(pos + 4, 5);
      if (s.length < 5) return null;
      const d = valido(s.readUInt16BE(3), s.readUInt16BE(1));
      return d && giro >= 5 && giro <= 8 ? { largura: d.altura, altura: d.largura } : d;
    }
    if (marca === 0xe1 && tam >= 16) giro = orientacaoExif(await ler(pos + 4, Math.min(tam - 2, 65_533))) ?? giro;
    pos += 2 + tam;
  }
  return null;
}
function orientacaoExif(b) {
  if (b.length < 14 || b.toString('latin1', 0, 6) !== 'Exif\0\0') return null;
  const t = 6;
  const le = b.toString('latin1', t, t + 2) === 'II';
  if (!le && b.toString('latin1', t, t + 2) !== 'MM') return null;
  const u16 = (o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o));
  const u32 = (o) => (le ? b.readUInt32LE(o) : b.readUInt32BE(o));
  const ifd = t + u32(t + 4);
  if (ifd + 2 > b.length) return null;
  const n = u16(ifd);
  for (let i = 0; i < n; i++) {
    const e = ifd + 2 + i * 12;
    if (e + 12 > b.length) return null;
    if (u16(e) === 0x0112) return u16(e + 8);
  }
  return null;
}

// ---------- upload ----------

// vagas e bytes reservados pelos uploads em andamento (o servidor é um processo só)
let subindo = 0;
let bytesSubindo = 0;
function reservar(bytes) {
  subindo++;
  bytesSubindo += bytes;
  let solta = false;
  return () => {
    if (solta) return;
    solta = true;
    subindo--;
    bytesSubindo -= bytes;
  };
}
function conferirVaga(r, proprias = 0) {
  if (r.uploads.length + subindo - proprias >= LIMITES.uploads) {
    throw falha(409, `O banco já tem ${LIMITES.uploads} imagens enviadas (contando as que estão subindo): apague alguma antes.`);
  }
}

// o disco (trocável no teste): bytes livres na pasta dos uploads
export const disco = {
  async livre(pasta) {
    const s = await statfs(pasta);
    return Number(s.bavail) * Number(s.bsize);
  },
};
async function conferirEspaco() {
  let livre;
  try {
    livre = await disco.livre(PASTA_UPLOADS);
  } catch (err) {
    console.error('Espaço livre dos assets não foi medido:', err.message);
    throw falha(503, 'Não deu pra conferir o espaço livre do servidor. Tente de novo em instantes.');
  }
  if (!Number.isFinite(livre) || livre - bytesSubindo < ESPACO_MIN) throw falha(507, MSG_SEM_ESPACO);
}

// temporário de upload que morreu no meio (mais de 30 min parado) sai no primeiro upload depois do boot
export async function limparTemporariosVelhos(agoraMs = Date.now()) {
  let nomes;
  try {
    nomes = await readdir(PASTA_UPLOADS);
  } catch (err) {
    if (err.code === 'ENOENT') return 0;
    throw err;
  }
  let n = 0;
  for (const nome of nomes) {
    if (!TEMPORARIO.test(nome)) continue;
    const p = path.join(PASTA_UPLOADS, nome);
    try {
      if (agoraMs - (await stat(p)).mtimeMs <= TEMPORARIO_VELHO_MS) continue;
      await rm(p, { force: true });
      n++;
    } catch (err) {
      if (err.code !== 'ENOENT') console.error(`Temporário ${nome} ficou:`, err.message);
    }
  }
  return n;
}
let limpeza = null;
const limparUmaVez = () => (limpeza ??= limparTemporariosVelhos().catch((err) => console.error('Limpeza dos temporários de assets:', err.message)));

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

async function subir(req, u) {
  limparUmaVez();
  const declarado = Number(req.headers['content-length']);
  const temTamanho = req.headers['content-length'] != null && Number.isFinite(declarado) && declarado >= 0;
  if (temTamanho && declarado > LIMITES.bytes) throw falha(413, MSG_GRANDE);
  // o que vem nos cabeçalhos é conferido antes de ler o corpo
  const nomeBruto = cabecalho(req, 'x-nome-arquivo');
  const categoria = cabecalho(req, 'x-categoria').trim() ? lerCategoria(cabecalho(req, 'x-categoria')) : 'outro';
  const tags = lerTags(cabecalho(req, 'x-tags'));
  const r0 = await lerRegistro();
  if (subindo >= LIMITES.simultaneos) throw falha(429, `Já tem ${LIMITES.simultaneos} imagens subindo agora. Espere uma terminar e mande de novo.`);
  conferirVaga(r0);
  // a vaga e os bytes ficam reservados antes de ler o corpo (sem await entre a conferência e a reserva)
  const soltar = reservar(temTamanho ? declarado : LIMITES.bytes);
  const tmp = path.join(PASTA_UPLOADS, `.subindo-${randomUUID()}.tmp`);
  let final = null;
  try {
    await mkdir(PASTA_UPLOADS, { recursive: true });
    await conferirEspaco();
    let gravado;
    try {
      gravado = await gravarCorpo(req, tmp, LIMITES.bytes);
    } catch (e) {
      if (e.status === 413) throw falha(413, MSG_GRANDE);
      throw e;
    }
    const t = tipoPelosBytes(gravado.cabeca);
    if (!t || !TIPOS_UPLOAD[t.tipo]) throw falha(415, MSG_TIPO);
    const d = await dimensoes(tmp, t.tipo);
    if (!d) throw falha(415, MSG_ILEGIVEL);
    if (d.largura > LIMITES.lado || d.altura > LIMITES.lado) {
      throw falha(422, `A imagem tem ${d.largura} x ${d.altura} px e o máximo é ${LIMITES.lado} x ${LIMITES.lado}: reduza e mande de novo.`);
    }
    // o nome que aparece no banco: o do arquivo sem a extensão (sem nome: "Imagem enviada")
    const nome = (nomeBruto.trim() ? limparNome(nomeBruto).replace(/\.[A-Za-z0-9]{1,10}$/, '').trim() : '') || 'Imagem enviada';
    const a = {
      id: novoId('ast'), nome: Array.from(nome).slice(0, LIM.nome).join(''), categoria, tags, descricao: '', origem: 'upload',
      largura: d.largura, altura: d.altura, tipo: t.tipo, tamanho: gravado.total, licenca: LICENCA_UPLOAD, oculto: false,
      criadoEm: agora(), criadoPor: u?.nome ?? null, criadoPorId: u?.id ?? null, atualizadoEm: null, atualizadoPor: null,
    };
    const destino = caminhoReal(a, 'upload');
    if (!destino) throw falha(400, 'Endereço inválido.');
    await mover(tmp, destino);
    final = destino;
    await mexer((r) => {
      conferirVaga(r, 1);
      r.uploads.push(a);
    });
    final = null;
    return paraTela(a);
  } finally {
    soltar();
    await rm(tmp, { force: true }).catch(() => {});
    if (final) await rm(final, { force: true }).catch(() => {});
  }
}

// ---------- editar, esconder, apagar, restaurar ----------

async function editar(id, b, u) {
  // confere tudo antes de mexer: nome bom com categoria ruim não muda nada
  const novo = {};
  if ('nome' in b) novo.nome = lerNome(b.nome);
  if ('categoria' in b) novo.categoria = lerCategoria(b.categoria);
  if ('tags' in b) novo.tags = lerTags(b.tags);
  if ('descricao' in b) novo.descricao = lerDescricao(b.descricao);
  return mexer(async (r) => {
    const achado = await acharInterno(id);
    if (!achado) throw falha(404, MSG_SEM_ASSET);
    const quando = { atualizadoEm: agora(), atualizadoPor: u?.nome ?? null };
    if (achado.origem === 'base') {
      r.base[id] = { ...objeto(r.base[id]), ...novo, ...quando };
      return paraTela(baseComCamada((await baseCarregada()).find((x) => x.id === id), r));
    }
    const a = r.uploads.find((x) => x.id === id);
    Object.assign(a, novo, quando);
    return paraTela(a);
  });
}

// quem usa o asset (os designs do estúdio, estudio.mjs, usosDoAsset): trocável no teste
export const usos = {
  async de(id) {
    const m = await import('./estudio.mjs');
    return typeof m.usosDoAsset === 'function' ? await m.usosDoAsset(id) : [];
  },
};
// upload que está em algum design não sai sem forcar=1 (o design ficaria com um buraco no lugar da imagem). Devolve
// null (pode apagar) ou o corpo do 409
async function bloqueioDeUso(id) {
  let lista;
  try {
    lista = await usos.de(id);
  } catch (e) {
    console.error(`Usos do asset ${id} não foram conferidos:`, e.message);
    throw falha(503, 'Não deu pra conferir se a imagem está em algum design. Tente de novo em instantes.');
  }
  if (!Array.isArray(lista) || !lista.length) return null;
  const titulos = lista.slice(0, 3).map((d) => `"${d.titulo ?? d.id}"`).join(', ');
  const mais = lista.length > 3 ? ` e mais ${lista.length - 3}` : '';
  return {
    erro: `Essa imagem está em ${lista.length === 1 ? '1 design' : `${lista.length} designs`} (${titulos}${mais}). Tire ela de lá antes de apagar.`,
    usos: lista.map((d) => ({ id: d.id, titulo: d.titulo ?? null })),
  };
}

async function apagar(id, u) {
  let caminho = null;
  const saida = await mexer(async (r) => {
    const achado = await acharInterno(id);
    if (!achado) throw falha(404, MSG_SEM_ASSET);
    if (achado.origem === 'base') {
      r.base[id] = { ...objeto(r.base[id]), oculto: true, ocultoEm: agora(), ocultoPor: u?.nome ?? null };
      return { ok: true, oculto: true, asset: paraTela(baseComCamada((await baseCarregada()).find((x) => x.id === id), r)) };
    }
    const i = r.uploads.findIndex((x) => x.id === id);
    caminho = caminhoReal(r.uploads[i], 'upload');
    r.uploads.splice(i, 1);
    return { ok: true, apagado: true };
  });
  // o registro já não tem o asset: falha no disco vai pro log (sobra um arquivo que ninguém lista)
  if (caminho) await rm(caminho, { force: true, maxRetries: 3, retryDelay: 100 }).catch((err) => console.error(`Asset ${id} apagado, mas o arquivo ficou:`, err.message));
  return saida;
}

async function restaurar(id, u) {
  return mexer(async (r) => {
    const achado = await acharInterno(id);
    if (!achado) throw falha(404, MSG_SEM_ASSET);
    if (achado.origem === 'base') {
      const c = { ...objeto(r.base[id]), oculto: false, restauradoEm: agora(), restauradoPor: u?.nome ?? null };
      delete c.ocultoEm;
      delete c.ocultoPor;
      r.base[id] = c;
      return paraTela(baseComCamada((await baseCarregada()).find((x) => x.id === id), r));
    }
    return paraTela(achado.a);
  });
}

// ---------- arquivo ----------

// 23/10 (Pedro: "o sistema deve permitir baixar esses assets para nosso pc rápido"): com ?baixar=1 o arquivo original
// vem como download, com o nome do asset e a extensão do tipo (o filename* da RFC 5987, como na exportação)
const EXT_DO_TIPO = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg' };
const nomeParaBaixar = (a) => `${String(a.nome ?? '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-').trim().slice(0, 120) || a.id}.${EXT_DO_TIPO[a.tipo] ?? 'png'}`;
const codificarNome = (s) => encodeURIComponent(s).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
async function servir(req, res, id, json) {
  const achado = await acharInterno(id);
  if (!achado) return json(res, 404, { erro: MSG_SEM_ASSET });
  const real = caminhoReal(achado.a, achado.origem);
  if (!real) return json(res, 404, { erro: MSG_SEM_ASSET });
  const svg = achado.a.tipo === 'image/svg+xml';
  const baixar = new URL(req.url, 'http://estudio').searchParams.get('baixar') === '1';
  return servirArquivo(req, res, real, {
    json,
    tipo: achado.a.tipo,
    // o upload nunca muda com o mesmo id; a base muda com o deploy (o ETag confere depois de 1 h)
    cache: achado.origem === 'upload' ? 'private, max-age=31536000, immutable' : 'private, max-age=3600',
    extras: {
      'x-content-type-options': 'nosniff',
      'content-disposition': baixar ? `attachment; filename*=UTF-8''${codificarNome(nomeParaBaixar(achado.a))}` : 'inline',
      ...(svg ? { 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox" } : {}),
    },
    rotulo: `Asset ${id}`,
    naoAchou: MSG_SEM_ASSET,
    ocupado: 'A imagem está sendo gravada agora. Tente de novo em instantes.',
  });
}

// a miniatura da grade (o WEBP de 320 px da base) ou a versão de tela do canvas (1200 px), quando existe; senão o original
async function servirMiniatura(req, res, id, json, pasta = PASTA_BASE_MINIATURAS) {
  const achado = await acharInterno(id);
  if (!achado) return json(res, 404, { erro: MSG_SEM_ASSET });
  if (achado.origem === 'base' && ARQUIVO_BASE.test(String(achado.a.arquivo ?? '')) && !achado.a.arquivo.endsWith('.svg')) {
    const mini = path.join(pasta, `${achado.a.arquivo.replace(/\.[a-z]+$/, '')}.webp`);
    try {
      if (dentroDe(mini, pasta) && (await stat(mini)).isFile()) {
        return servirArquivo(req, res, mini, {
          json, tipo: 'image/webp', cache: 'private, max-age=3600',
          extras: { 'x-content-type-options': 'nosniff', 'content-disposition': 'inline' },
          rotulo: `Miniatura ${id}`, naoAchou: MSG_SEM_ASSET, ocupado: 'A imagem está sendo gravada agora. Tente de novo em instantes.',
        });
      }
    } catch { /* sem miniatura: o original */ }
  }
  return servir(req, res, id, json);
}

// ---------- rotas ----------

// /api/estudio/assets[/:id[/arquivo|/miniatura|/restaurar]]. partes: o que vem depois de "assets" (já decodificado pelo servidor)
export async function rota(req, res, partes, sess, { json, corpoJson }) {
  const [id, sub, ...resto] = partes;
  const m = req.method;
  const u = sess?.usuario ?? null;
  const so = (...metodos) => {
    res.setHeader('allow', metodos.join(', '));
    return json(res, 405, { erro: 'Método não permitido.' });
  };
  if (resto.length) return json(res, 404, { erro: 'Rota não existe.' });
  if (!id) {
    if (m === 'GET') {
      const sp = new URL(req.url, 'http://local').searchParams;
      const ocultos = ['1', 'true', 'sim'].includes(String(sp.get('ocultos') ?? '').toLowerCase());
      const assets = await listar({ q: sp.get('q') ?? '', categoria: (sp.get('categoria') ?? '').trim().toLowerCase(), ocultos });
      return json(res, 200, { assets, categorias: CATEGORIAS.map((c) => ({ id: c, nome: ROTULO_CATEGORIA[c] })) });
    }
    if (m === 'POST') {
      try {
        return json(res, 201, await subir(req, u));
      } catch (e) {
        // recusado antes de ler o corpo inteiro: a conexão fecha depois da resposta (a regra única do auth.mjs)
        auth.fecharSeCorpoChegando(req, res);
        throw e;
      }
    }
    return so('GET', 'POST');
  }
  if (!ehAsset(id)) return json(res, 404, { erro: MSG_SEM_ASSET });
  if (!sub) {
    if (m === 'GET') {
      const a = await acharAsset(id);
      return a ? json(res, 200, a) : json(res, 404, { erro: MSG_SEM_ASSET });
    }
    if (m === 'PUT') return json(res, 200, await editar(id, await corpoJson(req, 50_000), u));
    if (m === 'DELETE') {
      const forcar = new URL(req.url, 'http://local').searchParams.get('forcar') === '1';
      if (!ehBase(id) && !forcar) {
        if (!(await acharInterno(id))) return json(res, 404, { erro: MSG_SEM_ASSET });
        const bloqueio = await bloqueioDeUso(id);
        if (bloqueio) return json(res, 409, bloqueio);
      }
      return json(res, 200, await apagar(id, u));
    }
    return so('GET', 'PUT', 'DELETE');
  }
  if (sub === 'arquivo') {
    if (m === 'GET' || m === 'HEAD') return servir(req, res, id, json);
    return so('GET', 'HEAD');
  }
  if (sub === 'miniatura' || sub === 'tela') {
    if (m === 'GET' || m === 'HEAD') return servirMiniatura(req, res, id, json, sub === 'tela' ? PASTA_BASE_TELAS : PASTA_BASE_MINIATURAS);
    return so('GET', 'HEAD');
  }
  if (sub === 'restaurar') {
    if (m === 'POST') return json(res, 200, await restaurar(id, u));
    return so('POST');
  }
  return json(res, 404, { erro: 'Rota não existe.' });
}

// teste: esquece o que leu (catálogo e registro) pra ler de novo do disco
export function esquecerCache() {
  base = null;
  registro = null;
}
