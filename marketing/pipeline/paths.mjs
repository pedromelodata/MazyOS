// Paths do vault resolvidos a partir da localização deste arquivo.
// Os scripts do pipeline nasceram com caminho absoluto do PC de origem
// (`c:/Users/TI/Desktop/...`) e paravam de rodar assim que o vault mudava de
// máquina. Aqui tudo pendura em VAULT, então clonar em qualquer lugar funciona.

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const AQUI = dirname(fileURLToPath(import.meta.url));

/** Raiz do vault (…/Legalizei_Videos) — este arquivo mora em marketing/pipeline. */
export const VAULT = resolve(AQUI, '..', '..');

export const MARKETING = join(VAULT, 'marketing');
export const AUDIO = join(MARKETING, 'audio');
export const FINAL_SRC = join(MARKETING, 'final', 'src');
export const TELAS_APP = join(MARKETING, 'telas-app');
export const PIPELINE = AQUI;

/** Onde o render18 cospe os frames. Fora do repo? Não: `.gitignore` cobre. */
export const FRAMES = join(AQUI, 'frames-18');

/**
 * Arquivo de chaves. Procura `.env.local` (o padrão do vault, conforme
 * `.env.local.exemplo`) e cai pra `.env`, inclusive um nível acima — que era
 * onde o `sfx.mjs` esperava encontrar no PC de origem.
 */
export function envPath() {
  const candidatos = [
    join(VAULT, '.env.local'),
    join(VAULT, '.env'),
    join(resolve(VAULT, '..'), '.env'),
  ];
  const achou = candidatos.find(existsSync);
  if (!achou) {
    throw new Error(
      'Nenhum arquivo de chaves encontrado. Copie .env.local.exemplo pra .env.local ' +
      `na raiz do vault. Procurei em:\n  ${candidatos.join('\n  ')}`);
  }
  return achou;
}
