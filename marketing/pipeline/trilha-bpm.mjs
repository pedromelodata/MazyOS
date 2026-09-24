import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

import { AUDIO } from './paths.mjs';
import { join } from 'node:path';

const DIR = join(AUDIO, 'trilha');
const SR = 11025, HOP = 256, HOPS_S = SR / HOP;

for (const f of readdirSync(DIR).filter((x) => /\.(mp3|wav|m4a)$/i.test(x))) {
  const path = `${DIR}/${f}`;
  const dur = parseFloat(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], { encoding: 'utf8' }),
  );
  // decodifica 90s do meio da faixa em PCM mono float
  const ss = Math.max(0, dur / 2 - 45);
  const raw = execFileSync(
    'ffmpeg',
    ['-v', 'error', '-ss', String(ss), '-t', '90', '-i', path, '-ac', '1', '-ar', String(SR), '-f', 'f32le', 'pipe:1'],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  const pcm = new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 4));

  // envelope de energia por hop, depois força de onset (diferença positiva)
  const nH = Math.floor(pcm.length / HOP) - 2;
  const env = new Float32Array(nH);
  for (let h = 0; h < nH; h++) {
    let e = 0;
    for (let i = h * HOP; i < h * HOP + 512 && i < pcm.length; i++) e += pcm[i] * pcm[i];
    env[h] = e;
  }
  const on = new Float32Array(nH);
  for (let h = 1; h < nH; h++) on[h] = Math.max(0, env[h] - env[h - 1]);
  const m = on.reduce((a, b) => a + b, 0) / nH;
  for (let h = 0; h < nH; h++) on[h] = Math.max(0, on[h] - m);

  // autocorrelação nos lags de 80–170 BPM
  let best = { bpm: 0, sc: -1 };
  for (let bpm = 80; bpm <= 170; bpm += 0.25) {
    const lag = (HOPS_S * 60) / bpm;
    let sc = 0;
    // soma em 4 múltiplos do lag pra premiar métrica estável
    for (const mult of [1, 2, 3, 4]) {
      const L = Math.round(lag * mult);
      for (let h = 0; h + L < nH; h += 7) sc += on[h] * on[h + L];
    }
    if (sc > best.sc) best = { bpm, sc };
  }
  console.log(`${f}\n  duracao=${dur.toFixed(1)}s  bpm~${best.bpm.toFixed(1)}`);
}
