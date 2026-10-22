// 22/10 (achado da revisão): gerador mínimo de .zip, sem dependência (no estilo do pdf.js), pra exportar todas as páginas
// num arquivo só. Um download por página fazia o Chrome segurar do 2º em diante (o pedido de "baixar vários arquivos"):
// negado ou sem ninguém ver, só a página 1 chegava, e o progresso dizia "baixado" pra todas.
// Método STORE (os bytes entram como estão: PNG e JPEG já vêm comprimidos), CRC32 em JS e o nome em UTF-8 (bit 11).
// Zip de 32 bits: até 65.535 arquivos e 4 GB, muito acima das 20 páginas de um design.
// Sem DOM: roda no navegador e no teste do Node (server/testes/front-estudio.test.mjs).

const enc = new TextEncoder();

// a tabela do CRC32 do zip (polinômio 0xEDB88320), montada na primeira chamada
let tabela = null;
function tabelaCrc() {
  if (tabela) return tabela;
  tabela = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabela[n] = c >>> 0;
  }
  return tabela;
}
// CRC32 sem sinal; crc: o do pedaço anterior, pra somar um arquivo grande em partes
export function crc32(bytes, crc = 0) {
  const t = tabelaCrc();
  let c = ~crc;
  for (let i = 0; i < bytes.length; i++) c = t[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}

// data e hora no formato do MS-DOS (hora local, de 2 em 2 segundos; o zip não guarda fuso)
function dataDos(d) {
  const ano = Math.min(2107, Math.max(1980, d.getFullYear()));
  return {
    hora: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    dia: ((ano - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

// o começo comum dos dois cabeçalhos: versão 2.0, nome em UTF-8, STORE, data, CRC e os dois tamanhos (iguais no STORE)
function comum(v, o, a) {
  v.setUint16(o, 20, true);
  v.setUint16(o + 2, 0x0800, true);
  v.setUint16(o + 4, 0, true);
  v.setUint16(o + 6, a.dos.hora, true);
  v.setUint16(o + 8, a.dos.dia, true);
  v.setUint32(o + 10, a.crc, true);
  v.setUint32(o + 14, a.tamanho, true);
  v.setUint32(o + 18, a.tamanho, true);
  v.setUint16(o + 22, a.nome.length, true);
  v.setUint16(o + 24, 0, true);
}
function cabecalhoLocal(a) {
  const h = new Uint8Array(30 + a.nome.length);
  const v = new DataView(h.buffer);
  v.setUint32(0, 0x04034b50, true);
  comum(v, 4, a);
  h.set(a.nome, 30);
  return h;
}
function cabecalhoCentral(a) {
  const h = new Uint8Array(46 + a.nome.length);
  const v = new DataView(h.buffer);
  v.setUint32(0, 0x02014b50, true);
  v.setUint16(4, 20, true);
  comum(v, 6, a);
  // comentário, disco, atributos internos e externos ficam zerados; depois, onde começa o cabeçalho local
  v.setUint32(42, a.offset, true);
  h.set(a.nome, 46);
  return h;
}
function fimDoDiretorio(n, tamanho, offset) {
  const h = new Uint8Array(22);
  const v = new DataView(h.buffer);
  v.setUint32(0, 0x06054b50, true);
  v.setUint16(8, n, true);
  v.setUint16(10, n, true);
  v.setUint32(12, tamanho, true);
  v.setUint32(16, offset, true);
  return h;
}

// arquivos: [{ nome, dados }]. dados em Uint8Array (o CRC e o tamanho saem dele) ou o que o Blob aceita (o Blob da
// página exportada), com crc e tamanho já calculados. Devolve as partes do .zip na ordem, pra montar com
// new Blob(partes): as imagens entram sem cópia
export function partesDoZip(arquivos, { data = new Date() } = {}) {
  if (!Array.isArray(arquivos) || !arquivos.length) throw new Error('Zip sem arquivo');
  if (arquivos.length > 0xffff) throw new Error('Arquivos demais pra um zip');
  const dos = dataDos(data);
  const vistos = new Set();
  const partes = [];
  const centrais = [];
  let pos = 0;
  for (const arq of arquivos) {
    const nome = String(arq?.nome ?? '');
    const bytesNome = enc.encode(nome);
    if (!bytesNome.length || bytesNome.length > 0xffff) throw new Error('Arquivo do zip sem nome');
    if (vistos.has(nome)) throw new Error(`Nome repetido no zip: ${nome}`);
    vistos.add(nome);
    const bytes = arq.dados instanceof Uint8Array ? arq.dados : null;
    const tamanho = bytes ? bytes.length : Number(arq.tamanho);
    const crc = bytes ? crc32(bytes) : Number(arq.crc);
    if (!Number.isInteger(tamanho) || tamanho < 0 || !Number.isInteger(crc)) throw new Error(`Falta o tamanho ou o CRC de ${nome}`);
    const a = { nome: bytesNome, dos, crc: crc >>> 0, tamanho, offset: pos };
    const local = cabecalhoLocal(a);
    centrais.push(cabecalhoCentral(a));
    partes.push(local, arq.dados);
    pos += local.length + tamanho;
    if (pos > 0xffffffff) throw new Error('Grande demais pra um zip (passa de 4 GB)');
  }
  let tamanhoDir = 0;
  for (const c of centrais) {
    partes.push(c);
    tamanhoDir += c.length;
  }
  partes.push(fimDoDiretorio(arquivos.length, tamanhoDir, pos));
  return partes;
}

// o .zip inteiro em bytes (todos os dados em Uint8Array): pro teste e pra arquivo pequeno
export function gerarZip(arquivos, opts) {
  const partes = partesDoZip(arquivos, opts);
  if (partes.some((p) => !(p instanceof Uint8Array))) throw new Error('gerarZip pede os dados em Uint8Array');
  const out = new Uint8Array(partes.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of partes) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
