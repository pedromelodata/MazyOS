// Lê os roteiros que já existem em marketing/conteudo/reel-*/reel.md e converte
// pro formato do cronograma. Não altera os arquivos de origem.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export const RAIZ = path.resolve(import.meta.dirname, '..', '..');
const CONTEUDO = path.join(RAIZ, 'marketing', 'conteudo');

const limpar = (s) => s.replace(/\*\*/g, '').trim();

function campo(md, rotulo) {
  const m = md.match(new RegExp(`^- \\*\\*${rotulo}[^:]*:\\*\\*\\s*(.+)$`, 'mi'));
  return m ? limpar(m[1]) : '';
}

function secao(md, titulo) {
  const m = md.match(new RegExp(`^## ${titulo}\\s*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'mi'));
  return m ? m[1].trim() : '';
}

export function parseReelMd(md, pasta) {
  const titulo = (md.match(/^# Reel · (.+?) ·/m) ?? [])[1] ?? pasta;
  const dataPasta = (pasta.match(/(\d{4}-\d{2}-\d{2})$/) ?? [])[1] ?? '';

  const cenas = secao(md, 'Roteiro')
    .split('\n')
    .filter((l) => l.startsWith('|') && !/^\|\s*-/.test(l) && !/^\|\s*Tempo/i.test(l))
    .map((l) => {
      const [tempo, cena, fala, tela] = l.split('|').slice(1, -1).map(limpar);
      return { tempo, cena, fala, tela };
    });

  const gancho = campo(md, 'Gancho').replace(/^fornecido pelo Pedro, INTOCÁVEL:\s*/i, '').replace(/^"|"$/g, '');
  const primeira = cenas[0];
  const ultima = cenas.at(-1);

  return {
    ideia: titulo,
    tema: campo(md, 'Tema'),
    formatoTexto: campo(md, 'Formato'),
    data: '',
    status: 'roteiro',
    roteiro: {
      hook: gancho || primeira?.fala || '',
      textoTela: primeira?.tela ?? '',
      cenas,
      desenvolvimento: cenas.slice(1, -1).map((c) => c.fala).join('\n\n'),
      cta: ultima?.fala ?? campo(md, 'CTA'),
    },
    // sem "## Fontes" depois, a Legenda vai até o fim e pegaria o comentário do gerador
    legenda: secao(md, 'Legenda').replace(/<!--[\s\S]*?-->/g, '').trim(),
    origem: path.relative(RAIZ, path.join(CONTEUDO, pasta, 'reel.md')).replaceAll('\\', '/'),
    criadoEm: dataPasta ? `${dataPasta}T12:00:00.000Z` : new Date().toISOString(),
  };
}

export async function listarReelsDoDisco() {
  let pastas = [];
  try {
    pastas = (await readdir(CONTEUDO, { withFileTypes: true }))
      .filter((d) => d.isDirectory() && d.name.startsWith('reel-'))
      .map((d) => d.name);
  } catch {
    return [];
  }
  const saida = [];
  for (const pasta of pastas) {
    try {
      const md = await readFile(path.join(CONTEUDO, pasta, 'reel.md'), 'utf8');
      saida.push(parseReelMd(md, pasta));
    } catch {
      /* pasta sem reel.md: ignora */
    }
  }
  return saida;
}
