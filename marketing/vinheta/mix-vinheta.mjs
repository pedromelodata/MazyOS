// Mixagem da vinheta — clone do padrão pipeline/mix.mjs, na grade de beats.
//
//   node mix-vinheta.mjs               → mix-vinheta-standalone.m4a (trilha + SFX, fade no fim)
//   node mix-vinheta.mjs --preroll     → mix-vinheta-preroll.m4a (SÓ SFX, corte seco:
//                                        pra emendar em peça que traz a própria trilha)
//   node mix-vinheta.mjs --so-trilha   → sem SFX, destrava preview
//
// Trilha e SFX vêm de marketing/audio/ (mesma biblioteca do 18s). O hit de sub
// do impacto é opcional: se audio/sfx/epidemic/impact-sub.mp3 existir, entra.

import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const A = join(AQUI, '..', 'audio');                 // marketing/audio
const OUT = join(AQUI, 'audio', 'mix');
mkdirSync(OUT, { recursive: true });

const T = JSON.parse(readFileSync(join(AQUI, 'timing.json'), 'utf8'));
const BEAT = 60000 / T.bpm;
const DUR = Math.round(BEAT * T.beats) / 1000;       // 4.655
const b = (x) => (BEAT * x) / 1000;                  // beat → segundos

// Trilha: WHAT! — Basixx, 116 BPM (escolhida pelo Pedro/análise 10/08/2026).
// Cama INSTRUMENTAL montada dos stems (bass+drums+instruments) — a faixa full
// tem "vocal presence" e stem de melodia não é baixável; a cama de stems zera
// o risco de vocal na vinheta. ENTRADA NO IMPACTO: os stems tocam a partir do
// primeiro kick do groove (2.087s, medido por silencedetect no stem de
// bateria) e entram com adelay no beat 2 — o drop cai junto com o carimbo.
const STEMS_DIR = join(A, 'trilha', 'stems-what');
const STEMS = [
  ['bass.mp3', 0.78],
  ['drums.mp3', 0.85],
  ['instruments.mp3', 0.62],
];
const GROOVE_IN = 2.087;   // s no arquivo — primeiro kick (downbeat)

// [arquivo, inicio_s, volume, atrim_start (opcional)] — eventos na grade:
// riser até o impacto (b2), shimmer no início do check, pop na wordmark,
// tick no "ai", whoosh na resolução.
// Níveis pós-feedback do Pedro ("senti falta dos SFX"): o groove da WHAT! é
// mais denso que a trilha antiga e mascarava os efeitos — SFX subiram ~2-3dB
// e a cama desceu (ver STEMS). Os dois whooshes finais marcam a QUEDA das
// letras (fallIni) e do símbolo (symFallIni).
const EV = [
  ['sfx/riser-3-fs685256.mp3',   0.00,                   0.55, 1.85],
  ['sfx/impacto-1-fs535557.mp3', b(T.events.impacto),    1.00],
  ['sfx/whoosh-2-fs427823.mp3',  b(T.events.checkIni),   0.70],
  ['sfx/pop-1-fs244654.mp3',     b(T.events.wordIni),    0.75],
  ['sfx/Click_mouse.mp3',        b(T.events.aiPop),      1.00],
  ['sfx/pop-2-fs850092.mp3',     b(T.events.aiPop),      0.60],
  ['sfx/whoosh-1-fs60021.mp3',   b(T.events.lock),       0.85],
  ['sfx/whoosh-2-fs60030.mp3',   b(T.events.fallIni),    0.85],
  ['sfx/whoosh-1-fs60021.mp3',   b(T.events.symFallIni), 0.90],
  ['sfx/pop-1-fs244654.mp3',     b(T.events.sloganIni),  0.50],
  ['sfx/whoosh-2-fs427823.mp3',  b(T.events.handIni),    0.35],
  ['sfx/Click_mouse.mp3',        b(T.events.clickBeat),  1.00],
  ['sfx/whoosh-2-fs427823.mp3',  b(T.events.revealIni),  0.80],
  ['sfx/impacto-3-fs81144.mp3',  b(T.events.revealIni) + 0.55, 0.45],
];
// sub do impacto (Epidemic) — opcional, entra se já foi baixado
const SUB = 'sfx/epidemic/impact-sub.mp3';
if (existsSync(join(A, SUB))) EV.push([SUB, b(T.events.impacto), 1.00]);

const PREROLL = process.argv.includes('--preroll');
const SO_TRILHA = process.argv.includes('--so-trilha');
const eventos = SO_TRILHA ? [] : EV;
const comMusica = !PREROLL;
const SAIDA = join(OUT, PREROLL ? 'mix-vinheta-preroll.m4a'
  : SO_TRILHA ? 'mix-vinheta-so-trilha.m4a' : 'mix-vinheta-standalone.m4a');

const faltando = [];
if (comMusica) for (const [f] of STEMS) if (!existsSync(join(STEMS_DIR, f))) faltando.push(`stems-what/${f}`);
for (const [f] of eventos) if (!existsSync(join(A, f))) faltando.push(f);
if (faltando.length) {
  console.error(`Faltam ${[...new Set(faltando)].length} arquivo(s):\n  ${[...new Set(faltando)].join('\n  ')}`);
  process.exit(1);
}

const DELAY_MS = Math.round(b(T.events.impacto) * 1000);   // groove entra no impacto
const args = ['-y'];
if (comMusica) for (const [f] of STEMS) args.push('-i', join(STEMS_DIR, f));
for (const [f] of eventos) args.push('-i', join(A, f));

let fc = '';
const tags = [];
if (comMusica) {
  const musDur = (DUR - DELAY_MS / 1000).toFixed(3);
  STEMS.forEach(([, v], i) => {
    fc += `[${i}:a]atrim=start=${GROOVE_IN},asetpts=PTS-STARTPTS,atrim=0:${musDur},` +
          `afade=t=in:d=0.015,adelay=${DELAY_MS}|${DELAY_MS},` +
          `afade=t=out:st=${(DUR - 0.35).toFixed(3)}:d=0.35,volume=${v}[st${i}];`;
    tags.push(`[st${i}]`);
  });
}
const base = comMusica ? STEMS.length : 0;
eventos.forEach(([f, t, v, trim], i) => {
  const d = Math.round(t * 1000);
  const pre = trim ? `atrim=start=${trim},asetpts=PTS-STARTPTS,` : '';
  fc += `[${base + i}:a]${pre}adelay=${d}|${d},volume=${v}[e${i}];`;
  tags.push(`[e${i}]`);
});
if (!tags.length) { console.error('nada pra mixar'); process.exit(1); }
const junta = tags.length > 1 ? `amix=inputs=${tags.length}:normalize=0,` : '';
fc += `${tags.join('')}${junta}loudnorm=I=-14:TP=-1.0:LRA=9[out]`;

args.push('-filter_complex', fc, '-map', '[out]', '-t', String(DUR),
  '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', SAIDA);
execFileSync('ffmpeg', args, { stdio: 'inherit' });
console.log('mix pronta:', SAIDA);
