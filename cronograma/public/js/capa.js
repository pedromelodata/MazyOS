// Capa tipográfica 4:5 que imita um reel publicado (SPEC §6.4).
// As 3 variantes têm cor fixa nos dois temas: é a única exceção aos tokens.
import { esc, icone } from './core.js';

const VARIANTES = ['ink', 'papel', 'tint'];

// sem variante explícita, escolhe uma estável pelo texto (a grade fica variada e não pisca)
function varianteDe(chave) {
  let h = 0;
  for (const c of String(chave)) h = (h * 31 + c.codePointAt(0)) >>> 0;
  return VARIANTES[h % VARIANTES.length];
}

// um único trecho em coral por capa
function comDestaque(tela, destaque) {
  const d = String(destaque ?? '').trim();
  if (!d) return esc(tela);
  const i = tela.toLocaleUpperCase('pt-BR').indexOf(d.toLocaleUpperCase('pt-BR'));
  if (i < 0) return esc(tela);
  return `${esc(tela.slice(0, i))}<em>${esc(tela.slice(i, i + d.length))}</em>${esc(tela.slice(i + d.length))}`;
}

export function capa({ tela = '', destaque = '', categoria = '', variante = '', thumb = '' } = {}) {
  const texto = String(tela || '').trim();
  const v = VARIANTES.includes(variante) ? variante : varianteDe(texto || categoria);
  const classes = ['capa', `capa-${v}`];
  if (thumb) classes.push('capa-foto');
  if (texto.length > 18) classes.push('capa-longa');
  return `
    <div class="${classes.join(' ')}">
      ${thumb ? `<img class="capa-thumb" src="${esc(thumb)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-some-se-falhar><span class="capa-scrim"></span>` : ''}
      ${categoria ? `<span class="capa-cat">${esc(categoria)}</span>` : ''}
      ${texto ? `<div class="capa-miolo"><p class="capa-tela">${comDestaque(texto, destaque)}</p></div>` : ''}
      <span class="capa-play">${icone('play', 16)}</span>
    </div>`;
}
