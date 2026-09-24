import { readFileSync, mkdirSync, writeFileSync, createWriteStream } from 'node:fs';
import { get } from 'node:https';

import { AUDIO, envPath } from './paths.mjs';
import { join } from 'node:path';

const ENV = envPath();
const OUT = join(AUDIO, 'sfx');
mkdirSync(OUT, { recursive: true });

// lê a chave sem nunca imprimi-la
const envTxt = readFileSync(ENV, 'utf8');
let KEY = (envTxt.match(/FREESOUND_API_KEY\s*=+[\s=]*([A-Za-z0-9]{20,60})/) || [])[1];
if (!KEY) {
  // fallback: linha solta que pareça token
  const solto = envTxt.split(/\r?\n/).map((l) => l.trim()).filter((l) => /^[A-Za-z0-9]{20,60}$/.test(l));
  KEY = solto[0];
}
if (!KEY) {
  console.log('SEM_CHAVE: nenhum FREESOUND_API_KEY= encontrado no .env');
  process.exit(1);
}
console.log('chave carregada (não exibida)');

const jfetch = (url) =>
  new Promise((res, rej) => {
    get(url, { headers: { Authorization: `Token ${KEY}` } }, (r) => {
      if (r.statusCode !== 200) { rej(new Error(`HTTP ${r.statusCode} ${url.split('?')[0]}`)); r.resume(); return; }
      let b = '';
      r.on('data', (c) => (b += c));
      r.on('end', () => res(JSON.parse(b)));
    }).on('error', rej);
  });

const download = (url, dest) =>
  new Promise((res, rej) => {
    const go = (u, n) => {
      if (n > 5) return rej(new Error('redirects'));
      get(u, (r) => {
        if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) { r.resume(); return go(r.headers.location, n + 1); }
        if (r.statusCode !== 200) { rej(new Error(`HTTP ${r.statusCode}`)); r.resume(); return; }
        const f = createWriteStream(dest);
        r.pipe(f);
        f.on('finish', () => f.close(res));
      }).on('error', rej);
    };
    go(url, 0);
  });

// o que a peça precisa, casado com a timeline da v2
const ALVOS = [
  { slug: 'whoosh',   q: 'whoosh',            fmin: 0.2, fmax: 2.5, n: 3 },
  { slug: 'pop',      q: 'pop',               fmin: 0.05, fmax: 1.5, n: 3 },
  { slug: 'success',  q: 'success',           fmin: 0.3, fmax: 4.0, n: 3 },
  { slug: 'success',  q: 'chime notification', fmin: 0.3, fmax: 4.0, n: 2 },
  { slug: 'confetti', q: 'party popper',      fmin: 0.2, fmax: 4.0, n: 2 },
  { slug: 'confetti', q: 'confetti',          fmin: 0.2, fmax: 5.0, n: 2 },
  { slug: 'riser',    q: 'riser',             fmin: 0.5, fmax: 5.0, n: 3 },
  { slug: 'impacto',  q: 'impact boom',       fmin: 0.3, fmax: 4.0, n: 2 },
  { slug: 'impacto',  q: 'sub drop',          fmin: 0.3, fmax: 4.0, n: 2 },
];

const manifesto = [];
const porSlug = {};
for (const a of ALVOS) {
  const url =
    `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(a.q)}` +
    `&filter=${encodeURIComponent(`license:"Creative Commons 0" duration:[${a.fmin} TO ${a.fmax}]`)}` +
    `&sort=score&fields=id,name,duration,license,username,previews&page_size=${a.n * 4}`;
  try {
    const r = await jfetch(url);
    let ok = 0;
    porSlug[a.slug] = porSlug[a.slug] || 0;
    for (const s of r.results || []) {
      if (ok >= a.n) break;
      const prev = s.previews?.['preview-hq-mp3'];
      if (!prev) continue;
      if (manifesto.some((m) => m.id === s.id)) continue;
      porSlug[a.slug]++;
      const dest = `${OUT}/${a.slug}-${porSlug[a.slug]}-fs${s.id}.mp3`;
      try {
        await download(prev, dest);
        ok++;
        manifesto.push({ arquivo: dest.split('/').pop(), alvo: a.slug, id: s.id, nome: s.name, dur: s.duration, licenca: s.license, autor: s.username });
        console.log(`OK  ${a.slug}: ${s.name} (${s.duration.toFixed(2)}s, CC0, by ${s.username})`);
      } catch (e) {
        console.log(`falha download ${s.id}: ${e.message}`);
      }
    }
    if (!ok) console.log(`NADA para ${a.slug}`);
  } catch (e) {
    console.log(`FALHA busca ${a.slug}: ${e.message}`);
  }
}

writeFileSync(`${OUT}/manifesto.json`, JSON.stringify(manifesto, null, 2));
console.log(`\ntotal ${manifesto.length} arquivos em ${OUT}`);
