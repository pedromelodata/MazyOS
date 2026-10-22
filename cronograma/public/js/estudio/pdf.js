// 22/10 (Pedro): gerador mínimo de PDF, sem dependência. Cada página do design vira uma página do PDF com uma
// imagem JPEG (filtro DCTDecode: os bytes do JPEG entram como estão, sem recompressão) ocupando a página inteira.
// Tamanho da página em pontos: o px do documento a 96 por polegada (1 px = 0,75 pt), o mesmo do CSS; a imagem
// pode ter mais pixels que isso (exportação em 2x) e o leitor de PDF mostra com a resolução toda.
// Sem DOM: roda no navegador e no teste do Node (server/testes/front-estudio.test.mjs).
// 22/10 (Pedro): a página também pode ir sem perda: os pixels RGB com o preditor do PNG (rgbComPreditor) comprimidos em
// zlib (FlateDecode); a compressão é do navegador (exportar.js), aqui só embrulha.

const enc = new TextEncoder();

// largura, altura e número de componentes de cor lidos do próprio JPEG (marcador SOF)
export function dimensoesJpeg(b) {
  if (!(b instanceof Uint8Array) || b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) throw new Error('Não é um JPEG');
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    // marcadores sem tamanho (RST, SOI, preenchimento)
    if (m === 0xff || m === 0x01 || (m >= 0xd0 && m <= 0xd8)) { i += m === 0xff ? 1 : 2; continue; }
    const len = (b[i + 2] << 8) | b[i + 3];
    // SOF0 a SOF15, menos DHT (C4), JPG (C8) e DAC (CC)
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return { altura: (b[i + 5] << 8) | b[i + 6], largura: (b[i + 7] << 8) | b[i + 8], componentes: b[i + 9] };
    }
    if (m === 0xda) break;
    i += 2 + len;
  }
  throw new Error('JPEG sem o tamanho (marcador SOF)');
}

// texto do PDF em UTF-16BE (acento e "í" de Legalizaí saem certos)
export function textoPdf(s) {
  let hex = 'FEFF';
  for (const ch of String(s ?? '')) {
    const cp = ch.codePointAt(0);
    const unidades = cp > 0xffff ? [0xd800 + ((cp - 0x10000) >> 10), 0xdc00 + ((cp - 0x10000) & 0x3ff)] : [cp];
    for (const u of unidades) hex += u.toString(16).toUpperCase().padStart(4, '0');
  }
  return `<${hex}>`;
}

const numPdf = (n) => {
  const s = (Math.round(n * 100) / 100).toFixed(2);
  return s.replace(/\.?0+$/, '') || '0';
};

function dataPdf(d = new Date()) {
  const p = (n, t = 2) => String(n).padStart(t, '0');
  return `D:${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

// os pixels RGBA do canvas viram linhas RGB com o filtro "Up" do PNG na frente de cada uma (byte 2: cada byte menos o
// de cima), o que o FlateDecode com /Predictor 15 desfaz. Fundo liso e degradê vertical comprimem muito melhor assim
export function rgbComPreditor(rgba, largura, altura) {
  const linha = largura * 3;
  const out = new Uint8Array((linha + 1) * altura);
  const atual = new Uint8Array(linha);
  const cima = new Uint8Array(linha);
  let o = 0;
  for (let y = 0; y < altura; y++) {
    let k = y * largura * 4;
    for (let x = 0; x < linha; x += 3, k += 4) { atual[x] = rgba[k]; atual[x + 1] = rgba[k + 1]; atual[x + 2] = rgba[k + 2]; }
    out[o++] = 2;
    for (let x = 0; x < linha; x++) out[o++] = (atual[x] - cima[x]) & 0xff;
    cima.set(atual);
  }
  return out;
}

// paginas: [{ jpeg: Uint8Array, larguraPt, alturaPt }] ou, sem perda, [{ flate: Uint8Array (o zlib das linhas do
// rgbComPreditor), largura, altura, larguraPt, alturaPt }]; devolve Uint8Array com o PDF inteiro
export function gerarPdf(paginas, { titulo = '', autor = '', criador = 'Gestão de Marketing do Legalizaí' } = {}) {
  if (!Array.isArray(paginas) || !paginas.length) throw new Error('PDF sem página');
  const partes = [];
  let pos = 0;
  const offsets = [];
  const escrever = (x) => {
    const b = typeof x === 'string' ? enc.encode(x) : x;
    partes.push(b);
    pos += b.length;
  };
  const objeto = (n, corpo) => {
    offsets[n] = pos;
    escrever(`${n} 0 obj\n${corpo}\nendobj\n`);
  };

  // cabeçalho com 4 bytes acima de 127 (o leitor trata o arquivo como binário)
  escrever('%PDF-1.4\n');
  escrever(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  const n = paginas.length;
  const idPagina = (i) => 4 + i * 3;
  const kids = paginas.map((_, i) => `${idPagina(i)} 0 R`).join(' ');
  objeto(1, '<< /Type /Catalog /Pages 2 0 R >>');
  objeto(2, `<< /Type /Pages /Kids [${kids}] /Count ${n} >>`);
  const info = [`/Producer ${textoPdf(criador)}`, `/Creator ${textoPdf(criador)}`, `/CreationDate (${dataPdf()})`];
  if (titulo) info.push(`/Title ${textoPdf(titulo)}`);
  if (autor) info.push(`/Author ${textoPdf(autor)}`);
  objeto(3, `<< ${info.join(' ')} >>`);

  paginas.forEach((p, i) => {
    const flate = p.flate ? (p.flate instanceof Uint8Array ? p.flate : new Uint8Array(p.flate)) : null;
    const jpeg = flate ? null : p.jpeg instanceof Uint8Array ? p.jpeg : new Uint8Array(p.jpeg);
    const d = flate ? { largura: p.largura, altura: p.altura, componentes: 3 } : dimensoesJpeg(jpeg);
    if (flate && !(d.largura > 0 && d.altura > 0)) throw new Error('Página sem perda sem a largura e a altura');
    const w = numPdf(p.larguraPt ?? d.largura * 0.75);
    const h = numPdf(p.alturaPt ?? d.altura * 0.75);
    const pid = idPagina(i);
    const conteudo = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`;
    objeto(pid, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${pid + 2} 0 R >> /ProcSet [/PDF /ImageC /ImageB] >> /Contents ${pid + 1} 0 R >>`);
    objeto(pid + 1, `<< /Length ${enc.encode(conteudo).length} >>\nstream\n${conteudo}\nendstream`);
    const espaco = d.componentes === 1 ? '/DeviceGray' : d.componentes === 4 ? '/DeviceCMYK /Decode [1 0 1 0 1 0 1 0]' : '/DeviceRGB';
    offsets[pid + 2] = pos;
    const bytes = flate ?? jpeg;
    const filtro = flate ? `/Filter /FlateDecode /DecodeParms << /Predictor 15 /Colors 3 /BitsPerComponent 8 /Columns ${d.largura} >>` : '/Filter /DCTDecode';
    escrever(`${pid + 2} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${d.largura} /Height ${d.altura} /ColorSpace ${espaco} /BitsPerComponent 8 ${filtro} /Length ${bytes.length} >>\nstream\n`);
    escrever(bytes);
    escrever('\nendstream\nendobj\n');
  });

  const total = 3 + n * 3;
  const xref = pos;
  let tabela = `xref\n0 ${total + 1}\n0000000000 65535 f \n`;
  for (let k = 1; k <= total; k++) tabela += `${String(offsets[k]).padStart(10, '0')} 00000 n \n`;
  escrever(tabela);
  escrever(`trailer\n<< /Size ${total + 1} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  const out = new Uint8Array(pos);
  let o = 0;
  for (const b of partes) { out.set(b, o); o += b.length; }
  return out;
}
