// Rebaixa os SFX EXATOS que o mix.mjs referencia, por ID do Freesound.
//
// Por que existe, já que tem o sfx.mjs: o sfx.mjs BUSCA por palavra-chave e pega
// os melhores resultados do momento. Rodar ele de novo traz sons diferentes, com
// outros IDs — e o mix.mjs, que referencia os arquivos pelo nome, quebra. Este
// aqui baixa por ID, então reproduz a mixagem original nota por nota.
//
// A lista sai do próprio mix.mjs (regex nos paths `sfx/...mp3`), pra nunca
// dessincronizar: acrescentou um efeito lá, ele entra aqui sozinho.
//
//   node sfx-por-id.mjs
//
// Dois caminhos pra resolver cada ID, nessa ordem:
//   1. API  — usa FREESOUND_API_KEY do .env.local, se existir. Caminho oficial.
//   2. Página pública — https://freesound.org/s/<id>/ traz a URL do preview e a
//      licença no HTML. É o fallback pra quando não há chave.
// Os arquivos são os mesmos: o preview em `cdn.freesound.org` que o sfx.mjs
// original já usava.

import { readFileSync, mkdirSync, createWriteStream, existsSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { get } from 'node:https';
import { AUDIO, PIPELINE, envPath } from './paths.mjs';

const OUT = join(AUDIO, 'sfx');
mkdirSync(OUT, { recursive: true });
const UA = { 'User-Agent': 'legalizai-pipeline/1.0' };

// chave é opcional; se houver, é lida sem nunca ser impressa
let KEY = null;
try {
  KEY = (readFileSync(envPath(), 'utf8').match(/FREESOUND_API_KEY\s*=+[\s=]*([A-Za-z0-9]{20,60})/) || [])[1] || null;
} catch { /* sem .env.local — segue pela página pública */ }
console.log(KEY ? 'chave encontrada — usando a API' : 'sem chave — usando as páginas públicas do Freesound');

// nomes exatos que o mix.mjs consome
const src = readFileSync(join(PIPELINE, 'mix.mjs'), 'utf8');
const nomes = [...new Set([...src.matchAll(/sfx\/([^'"]+?\.mp3)/g)].map((m) => m[1]))];
const comId = [], semId = [];
for (const n of nomes) {
  const m = n.match(/-fs(\d+)\.mp3$/);
  (m ? comId : semId).push(m ? { nome: n, id: m[1] } : { nome: n });
}
console.log(`mix.mjs usa ${nomes.length} efeitos: ${comId.length} com ID, ${semId.length} sem.\n`);

const pega = (url, headers = {}) =>
  new Promise((res, rej) => {
    const go = (u, n) => {
      if (n > 5) return rej(new Error('redirects demais'));
      get(u, { headers: { ...UA, ...headers } }, (r) => {
        if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
          r.resume(); return go(new URL(r.headers.location, u).href, n + 1);
        }
        if (r.statusCode !== 200) { r.resume(); return rej(new Error(`HTTP ${r.statusCode}`)); }
        let b = '';
        r.setEncoding('utf8');
        r.on('data', (c) => (b += c));
        r.on('end', () => res(b));
      }).on('error', rej);
    };
    go(url, 0);
  });

const baixa = (url, dest) =>
  new Promise((res, rej) => {
    const go = (u, n) => {
      if (n > 5) return rej(new Error('redirects demais'));
      get(u, { headers: UA }, (r) => {
        if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
          r.resume(); return go(new URL(r.headers.location, u).href, n + 1);
        }
        if (r.statusCode !== 200) { r.resume(); return rej(new Error(`HTTP ${r.statusCode}`)); }
        const f = createWriteStream(dest);
        r.pipe(f);
        f.on('finish', () => f.close(() => res()));
        f.on('error', rej);
      }).on('error', rej);
    };
    go(url, 0);
  });

async function resolvePorApi(id) {
  const s = JSON.parse(await pega(
    `https://freesound.org/apiv2/sounds/${id}/?fields=id,name,license,previews`,
    { Authorization: `Token ${KEY}` }));
  return { url: s.previews['preview-hq-mp3'], licenca: s.license };
}

async function resolvePorPagina(id) {
  const html = await pega(`https://freesound.org/s/${id}/`);
  const prev = html.match(/https:\/\/cdn\.freesound\.org\/previews\/[^"'\s]+?\.mp3/);
  if (!prev) throw new Error('preview não encontrado no HTML');
  const lic = html.match(/creativecommons\.org\/(publicdomain\/zero\/1\.0|licenses\/[a-z-]+)\//);
  return {
    // a página expõe o -lq; o -hq mora no mesmo path e é o que o mix original usou
    url: prev[0].replace('-lq.mp3', '-hq.mp3'),
    urlAlt: prev[0],
    licenca: lic ? (lic[1].startsWith('publicdomain') ? 'Creative Commons 0' : lic[1]) : 'desconhecida',
  };
}

let ok = 0, pulados = 0;
const naoCC0 = [], falhas = [];

for (const { nome, id } of comId) {
  const dest = join(OUT, nome);
  if (existsSync(dest) && statSync(dest).size > 1024) { console.log(`· já existe  ${nome}`); pulados++; continue; }
  try {
    const r = KEY ? await resolvePorApi(id) : await resolvePorPagina(id);
    // A peça roda em Meta Ads = uso comercial. CC-BY exigiria crédito no anúncio,
    // o que não cabe — então qualquer coisa fora de CC0 é sinalizada.
    if (!/Creative Commons 0|CC0|publicdomain/i.test(r.licenca || '')) naoCC0.push(`${nome} -> ${r.licenca}`);
    try {
      await baixa(r.url, dest);
    } catch (e) {
      if (!r.urlAlt) throw e;
      await baixa(r.urlAlt, dest);   // sem hq, fica o lq
    }
    const kb = Math.round(statSync(dest).size / 1024);
    if (kb < 1) { unlinkSync(dest); throw new Error('arquivo vazio'); }
    console.log(`✓ ${nome.padEnd(28)} ${String(kb).padStart(5)} KB  ${r.licenca}`);
    ok++;
  } catch (e) {
    console.log(`✗ ${nome} (id ${id}): ${e.message}`);
    falhas.push(nome);
  }
}

console.log(`\nbaixados ${ok}, já existiam ${pulados}, falharam ${falhas.length}, de ${comId.length} com ID.`);
if (naoCC0.length) {
  console.log('\nATENÇÃO — licença não é CC0, conferir antes de subir campanha paga:');
  for (const l of naoCC0) console.log(`  ${l}`);
}
if (semId.length) {
  console.log(`\nSem ID, não dá pra rebaixar (cópia manual): ${semId.map((s) => s.nome).join(', ')}`);
}
