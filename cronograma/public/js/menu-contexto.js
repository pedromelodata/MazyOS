// Menu do botão direito (24/10/2026, Pedro: "ao clicar com o botão direito no card, ter opções de realizar algumas ações,
// como também criar"). Um menu por vez, no ponto do clique (pela tecla de menu ou Shift+F10, embaixo do card), sempre
// dentro da tela. Teclado: setas, Home e End andam; Enter e espaço escolhem; Esc e Tab fecham e o foco volta pro card.
// Clicar fora, rolar a página ou mudar o tamanho da janela fecha.
// itens: [{ icone, texto, acao, perigo? } | '-' (separador)]. Quem monta os itens é a vista (views/cronograma.js)
import { esc, icone } from './core.js';

const MARGEM = 8;
let atual = null;

export function fecharMenuContexto({ devolverFoco = false } = {}) {
  if (!atual) return;
  const { el, origem, soltar } = atual;
  atual = null;
  soltar();
  el.remove();
  if (devolverFoco && origem?.isConnected && origem.matches(':is(button, a, [tabindex])')) origem.focus({ preventScroll: true });
}

export function abrirMenuContexto(e, { titulo = '', itens = [], origem = null } = {}) {
  fecharMenuContexto();
  const el = document.createElement('div');
  el.className = 'menu-ctx';
  el.setAttribute('role', 'menu');
  if (titulo) el.setAttribute('aria-label', titulo);
  el.innerHTML = `${titulo ? `<div class="menu-ctx-titulo" aria-hidden="true">${esc(titulo)}</div>` : ''}${itens.map((it, i) => (it === '-'
    ? '<hr role="separator" />'
    : `<button type="button" role="menuitem" tabindex="-1" class="menu-ctx-item${it.perigo ? ' perigo' : ''}" data-i="${i}">${it.icone ? icone(it.icone, 16) : ''}<span>${esc(it.texto)}</span></button>`)).join('')}`;
  document.body.appendChild(el);

  // no ponto do clique; pela tecla (sem ponto), embaixo do card. Nunca sai da tela
  const caixa = el.getBoundingClientRect();
  const ref = origem?.getBoundingClientRect();
  const peloMouse = e && (e.clientX > 0 || e.clientY > 0);
  let x = peloMouse ? e.clientX : ref?.left ?? MARGEM;
  let y = peloMouse ? e.clientY : ref?.bottom ?? MARGEM;
  if (x + caixa.width > innerWidth - MARGEM) x = Math.max(MARGEM, innerWidth - MARGEM - caixa.width);
  if (y + caixa.height > innerHeight - MARGEM) y = Math.max(MARGEM, (peloMouse ? y : ref?.top ?? y) - caixa.height);
  Object.assign(el.style, { left: `${x}px`, top: `${y}px` });

  const botoes = [...el.querySelectorAll('.menu-ctx-item')];
  const focar = (i) => botoes[(i + botoes.length) % botoes.length]?.focus({ preventScroll: true });
  const escolher = (b) => {
    const it = itens[Number(b.dataset.i)];
    fecharMenuContexto();
    it?.acao?.();
  };
  el.addEventListener('click', (ev) => {
    const b = ev.target instanceof Element ? ev.target.closest('.menu-ctx-item') : null;
    if (b) escolher(b);
  });
  el.addEventListener('keydown', (ev) => {
    const i = botoes.indexOf(document.activeElement);
    if (ev.key === 'ArrowDown') focar(i + 1);
    else if (ev.key === 'ArrowUp') focar(i < 0 ? -1 : i - 1);
    else if (ev.key === 'Home') focar(0);
    else if (ev.key === 'End') focar(-1);
    else if (ev.key === 'Escape') fecharMenuContexto({ devolverFoco: true });
    else if (ev.key === 'Tab') { fecharMenuContexto({ devolverFoco: true }); }
    else return;
    ev.preventDefault();
    ev.stopPropagation();
  });
  // fora do menu: clique (ou outro botão direito), rolagem e janela mudando fecham
  const fora = (ev) => { if (!el.contains(ev.target)) fecharMenuContexto(); };
  const fechar = () => fecharMenuContexto();
  document.addEventListener('pointerdown', fora, true);
  window.addEventListener('scroll', fechar, true);
  window.addEventListener('resize', fechar);
  window.addEventListener('blur', fechar);
  atual = {
    el,
    origem,
    soltar: () => {
      document.removeEventListener('pointerdown', fora, true);
      window.removeEventListener('scroll', fechar, true);
      window.removeEventListener('resize', fechar);
      window.removeEventListener('blur', fechar);
    },
  };
  focar(0);
}
