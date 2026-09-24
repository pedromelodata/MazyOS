import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';

import { AUDIO as A } from './paths.mjs';
const OUT = `${A}/mix`;
mkdirSync(OUT, { recursive: true });

const MUS = `${A}/trilha/ES_Keep Your Focus on Me (Instrumental Version) - Basixx.mp3`;
const DUR = 18.621;

// [arquivo, inicio_s, volume, atrim_start (opcional, corta o começo do sample)]
const EV = [
  ['sfx/impacto-1-fs535557.mp3',  0.00, 0.50],
  ['sfx/Click_mouse.mp3',         1.50, 0.90],
  ['sfx/pop-1-fs244654.mp3',      1.75, 0.80],
  ['sfx/pop-2-fs850092.mp3',      2.65, 0.70],
  ['sfx/riser-3-fs685256.mp3',    3.45, 0.55, 1.85],
  ['sfx/whoosh-2-fs427823.mp3',   4.36, 0.90],
  ['sfx/confetti-1-fs26349.mp3',  5.76, 0.85],
  ['sfx/success-4-fs380482.mp3',  5.88, 0.80],
  ['sfx/Click_mouse.mp3',         7.86, 0.90],
  ['sfx/whoosh-1-fs60021.mp3',    9.01, 0.90],
  ['sfx/pop-1-fs244654.mp3',     10.70, 0.80],
  ['sfx/Click_mouse.mp3',        11.26, 0.90],
  ['sfx/success-5-fs351879.mp3', 11.50, 0.60],
  ['sfx/click-2-fs582902.mp3',   11.76, 0.70],
  ['sfx/riser-3-fs685256.mp3',   12.75, 0.55, 1.85],
  ['sfx/whoosh-2-fs60030.mp3',   13.67, 0.90],
  ['sfx/impacto-3-fs81144.mp3',  14.10, 0.45],
  ['sfx/pop-2-fs850092.mp3',     15.95, 0.70],
];

// `--so-trilha` mixa sem efeito nenhum, pra destravar preview enquanto os SFX
// não chegam. Sai com outro nome pra nunca sobrescrever a mixagem de verdade.
const SO_TRILHA = process.argv.includes('--so-trilha');
const eventos = SO_TRILHA ? [] : EV;
const SAIDA = `${OUT}/${SO_TRILHA ? 'mix-18s-so-trilha.m4a' : 'mix-18s.m4a'}`;

// Confere os arquivos antes de chamar o ffmpeg: faltando um, o erro nativo é um
// "No such file or directory" solto no meio de 19 inputs, sem dizer qual.
const faltando = [];
if (!existsSync(MUS)) faltando.push(MUS.replace(`${A}/`, ''));
for (const [f] of eventos) if (!existsSync(`${A}/${f}`)) faltando.push(f);
if (faltando.length) {
  // dedup: vários efeitos disparam mais de uma vez na timeline
  const unicos = [...new Set(faltando)];
  console.error(`Faltam ${unicos.length} arquivo(s) em marketing/audio/:\n  ${unicos.join('\n  ')}`);
  console.error('\nSFX do Freesound: `node sfx-por-id.mjs` rebaixa pelo ID.');
  console.error('Só a trilha, sem efeitos: `node mix.mjs --so-trilha`.');
  console.error('A lista completa está em marketing/audio/README.md.');
  process.exit(1);
}

const args = ['-y', '-i', MUS];
for (const [f] of eventos) args.push('-i', `${A}/${f}`);

let fc = `[0:a]atrim=0:${DUR},asetpts=PTS-STARTPTS,afade=t=in:d=0.2,afade=t=out:st=${DUR - 1.2}:d=1.2,volume=0.85[mus];`;
const tags = ['[mus]'];
eventos.forEach(([f, t, v, trim], i) => {
  const d = Math.round(t * 1000);
  const pre = trim ? `atrim=start=${trim},asetpts=PTS-STARTPTS,` : '';
  fc += `[${i + 1}:a]${pre}adelay=${d}|${d},volume=${v}[e${i}];`;
  tags.push(`[e${i}]`);
});
// amix com 1 entrada é ruído inútil no grafo — com só a trilha, vai direto pro loudnorm
const junta = tags.length > 1 ? `amix=inputs=${tags.length}:normalize=0,` : '';
fc += `${tags.join('')}${junta}loudnorm=I=-14:TP=-1.0:LRA=9[out]`;

args.push('-filter_complex', fc, '-map', '[out]', '-t', String(DUR), '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', SAIDA);
execFileSync('ffmpeg', args, { stdio: 'inherit' });
console.log('mix pronta:', SAIDA, SO_TRILHA ? '(sem SFX)' : '');
