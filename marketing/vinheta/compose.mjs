// Composição final da vinheta: base 2D (Playwright) + símbolo 3D (Blender,
// RGBA com sombra no alpha) + áudio → MP4.
//
//   node compose.mjs [16x9|9x16] [fps] [--tag piloto] [--sem-audio]
//
// O overlay usa scale2ref: os frames do Blender são reescalados pro tamanho da
// base — assim o piloto (Blender 1280x720 sobre base 1080p) e o master (4K
// sobre 4K) usam o mesmo caminho. Range completo 0..N — sem tpad; se um dia o
// Blender renderizar range parcial, prepender tpad=start=N, NUNCA setpts
// (lição do blender/README.md).

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const ASPECT = process.argv[2] || '16x9';
const FPS = Number(process.argv[3] || 30);
const TAG = process.argv.includes('--tag')
  ? process.argv[process.argv.indexOf('--tag') + 1] : `${FPS}fps`;
const SEM_AUDIO = process.argv.includes('--sem-audio');

const T = JSON.parse(readFileSync(join(AQUI, 'timing.json'), 'utf8'));
const DUR = Math.round((60000 / T.bpm) * T.beats) / 1000;   // 4.655

const BASE = join(AQUI, `frames-base-${ASPECT}`);
const BASE_MP4 = join(AQUI, `frames-base-${ASPECT}.mp4`);
const B3D = join(AQUI, 'blender', `out-${ASPECT}`);
const MIX = join(AQUI, 'audio', 'mix', 'mix-vinheta-standalone.m4a');
const OUT = join(AQUI, 'out');
mkdirSync(OUT, { recursive: true });

// base pode ser sequência de PNGs (pilotos) ou o .mp4 CRF6 do modo --stream
const BASE_EH_VIDEO = existsSync(BASE_MP4);
if (!BASE_EH_VIDEO) {
  const n = existsSync(BASE) ? readdirSync(BASE).filter((f) => f.endsWith('.png')).length : 0;
  if (!n) throw new Error(`sem base em ${BASE}(.mp4) — rode render-base.mjs antes`);
  console.log(`[compose] base: ${n} frames PNG`);
} else {
  console.log(`[compose] base: ${BASE_MP4}`);
}
{
  const n = existsSync(B3D) ? readdirSync(B3D).filter((f) => f.endsWith('.png')).length : 0;
  if (!n) throw new Error(`sem frames em ${B3D} — rode simbolo3d.py antes`);
  console.log(`[compose] 3D: ${n} frames`);
}

const comAudio = !SEM_AUDIO && existsSync(MIX);
if (!comAudio) console.log('[compose] sem áudio (mix ausente ou --sem-audio) — vídeo mudo');

const saida = join(OUT, `vinheta-${ASPECT}-${TAG}.mp4`);
const args = ['-y'];
if (BASE_EH_VIDEO) args.push('-i', BASE_MP4);
else args.push('-framerate', String(FPS), '-i', join(BASE, 'f%05d.png'));
args.push('-framerate', String(FPS), '-i', join(B3D, 'simbolo_%04d.png'));
if (comAudio) args.push('-i', MIX);
// eof_action=pass: quando a sequência 3D acaba (o símbolo já saiu de cena),
// o vídeo segue só com a base — permite renderizar no Blender APENAS os
// frames em que o símbolo existe (~1h45 de GPU a menos por aspecto no 4K).
args.push(
  '-filter_complex',
  '[1:v][0:v]scale2ref=flags=lanczos[ov][base];[base][ov]overlay=eof_action=pass[v]',
  '-map', '[v]',
);
const MEZANINO = process.argv.includes('--mezanino');
if (MEZANINO) {
  // Mezanino profissional: ProRes 422 HQ + PCM — arquivo de TRABALHO pra
  // edição do filme, sem perda geracional. O .mp4 CRF14 é o de entrega.
  const mov = saida.replace(/\.mp4$/, '.mov');
  if (comAudio) args.push('-map', '2:a', '-c:a', 'pcm_s16le');
  args.push('-c:v', 'prores_ks', '-profile:v', '3', '-vendor', 'apl0',
    '-pix_fmt', 'yuv422p10le', '-t', String(DUR), mov);
  execFileSync('ffmpeg', args, { stdio: 'inherit' });
  console.log('[compose] mezanino pronto:', mov);
} else {
  if (comAudio) args.push('-map', '2:a', '-c:a', 'copy');
  // tune grain + aq-mode 3: o CRF14 padrão esmagou o grão sobre o fundo
  // escuro em manchas ("borrões" reportados pelo Pedro em 11/08) — grão em
  // cena escura precisa de bitrate de verdade e AQ com viés pro escuro
  args.push(
    '-c:v', 'libx264', '-crf', '12', '-preset', 'veryslow', '-tune', 'grain',
    '-x264-params', 'aq-mode=3:deblock=-1,-1',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-t', String(DUR), saida,
  );
  execFileSync('ffmpeg', args, { stdio: 'inherit' });
  console.log('[compose] pronto:', saida);
}
