// Arrastar os cards do cronograma pra outro dia (09/10/2026, pedido do Pedro: "libere no cronograma a opção de
// arrastar os cards dos reels e carrosséis").
// Eventos de ponteiro em vez do arrastar-e-soltar do HTML, que não funciona no toque:
//  - mouse: o arrasto começa depois de andar 6 px com o botão apertado (clique parado continua abrindo a peça);
//  - toque: segura o card 350 ms (o celular vibra) e arrasta; toque normal rola a página como sempre;
//  - perto da borda da tela (ou da faixa do calendário que rola de lado), a página rola sozinha;
//  - Esc cancela; soltar fora de um dia não muda nada;
//  - 21/10 (Pedro: "trocar um de lugar com o outro"): soltar em cima de outro card arrastável chama o aoTrocar da
//    vista (os dois trocam de lugar), quando ela passa um.
//  - 23/10 (Pedro: "permita mover os stories também"): o card do story (data-stories) também arrasta. Troca só com
//    outro story (story em cima de post vale como soltar no dia) e não vai pro Banco de Ideias (o banco é de posts).
// Quem decide o que arrasta e o que fazer ao soltar é a vista (views/cronograma.js), pelo ligarArrasto.
const LIMIAR = 6;          // px que o mouse anda até virar arrasto
const SEGURAR = 350;       // ms segurando no toque
const BORDA = 56;          // px da borda em que a rolagem automática liga
const VELOCIDADE = 16;     // px por quadro na rolagem automática

const ligados = new WeakMap();   // root -> estado (as escutas entram uma vez só por root)
// o id do card (o da peça ou o do story) e se ele é de story
const idDoCard = (chip) => chip.dataset.detalhar || chip.dataset.stories || '';
const ehStory = (chip) => Boolean(chip.dataset.stories);

export function ligarArrasto(root, opcoes) {
  const ja = ligados.get(root);
  if (ja) { ja.opcoes = opcoes; return; }
  const est = { opcoes, gesto: null, fimEm: 0 };
  ligados.set(root, est);


  function limpar() {
    const g = est.gesto;
    if (!g) return;
    clearTimeout(g.timer);
    cancelAnimationFrame(g.raf);
    g.fantasma?.remove();
    g.chip.classList.remove('crono-chip-arrastando');
    g.alvo?.classList.remove('crono-dia-alvo');
    g.troca?.classList.remove('crono-chip-troca');
    g.banco?.classList.remove('crono-banco-alvo');
    document.body.classList.remove('crono-arrastando', 'crono-arrastando-story');
    window.removeEventListener('pointermove', mover, true);
    window.removeEventListener('pointerup', soltar, true);
    window.removeEventListener('pointercancel', cancelar, true);
    window.removeEventListener('keydown', tecla, true);
    document.removeEventListener('touchmove', segurarToque, { capture: true });
    est.gesto = null;
  }

  function iniciar() {
    const g = est.gesto;
    if (!g || g.ativo) return;
    g.ativo = true;
    const caixa = g.chip.getBoundingClientRect();
    // o card fica preso no ponto onde foi pego (no mouse, o arrasto só começa 6 px depois)
    g.offX = g.x0 - caixa.left;
    g.offY = g.y0 - caixa.top;
    const f = g.chip.cloneNode(true);
    for (const a of ['data-detalhar', 'data-stories', 'data-arrastavel', 'id']) f.removeAttribute(a);
    f.classList.add('crono-chip-fantasma');
    f.setAttribute('aria-hidden', 'true');
    // a posição vai na linha também: o .crono-chip do CSS tem position: relative
    Object.assign(f.style, { position: 'fixed', left: '0px', top: '0px', width: `${caixa.width}px` });
    document.body.appendChild(f);
    g.fantasma = f;
    g.chip.classList.add('crono-chip-arrastando');
    document.body.classList.add('crono-arrastando');
    // o story não vai pro Banco de Ideias: a área do banco não aparece
    if (ehStory(g.chip)) document.body.classList.add('crono-arrastando-story');
    if (g.tipo === 'touch') navigator.vibrate?.(12);
    posicionar();
    rolar();
  }

  function posicionar() {
    const g = est.gesto;
    g.fantasma.style.transform = `translate(${g.x - g.offX}px, ${g.y - g.offY}px) rotate(2deg)`;
    const embaixo = document.elementFromPoint(g.x, g.y);
    // 22/10 (Pedro): em cima da área "Banco de Ideias" (a que aparece embaixo durante o arrasto, ou o item do menu):
    // a peça vai pro banco, e nem troca nem dia acendem
    // 22/10 (achado da revisão): na faixa da rolagem automática (o pé e o topo da tela) a área do banco não vale: quem
    // leva o card até a borda pra rolar não manda a peça pro banco sem querer
    const naFaixa = g.y < BORDA || g.y > innerHeight - BORDA;
    const banco = est.opcoes.aoSoltarNoBanco && !naFaixa && !ehStory(g.chip) ? embaixo?.closest('[data-solta-banco], .sb-nav a[href="#/ideias"]') ?? null : null;
    if (banco !== g.banco) {
      g.banco?.classList.remove('crono-banco-alvo');
      banco?.classList.add('crono-banco-alvo');
      g.banco = banco;
    }
    // em cima de outro card que também arrasta (e do mesmo tipo: post com post, story com story): é troca, e o dia não
    // acende
    const outro = est.opcoes.aoTrocar && !banco ? embaixo?.closest('.crono-chip[data-arrastavel]') : null;
    const troca = outro && outro !== g.chip && ehStory(outro) === ehStory(g.chip) && root.contains(outro) && est.opcoes.podeArrastar(outro) ? outro : null;
    if (troca !== g.troca) {
      g.troca?.classList.remove('crono-chip-troca');
      troca?.classList.add('crono-chip-troca');
      g.troca = troca;
    }
    const dia = troca || banco ? null : embaixo?.closest('[data-dia]') ?? null;
    const valido = dia && root.contains(dia) ? dia : null;
    if (valido !== g.alvo) {
      g.alvo?.classList.remove('crono-dia-alvo');
      valido?.classList.add('crono-dia-alvo');
      g.alvo = valido;
    }
  }

  // rolagem automática perto das bordas (a da página e a da faixa do calendário, que rola de lado no celular)
  function rolar() {
    const g = est.gesto;
    if (!g?.ativo) return;
    let mexeu = false;
    if (g.y < BORDA) { window.scrollBy(0, -VELOCIDADE); mexeu = true; }
    else if (g.y > innerHeight - BORDA) { window.scrollBy(0, VELOCIDADE); mexeu = true; }
    const faixa = root.querySelector('.crono-cal-rolagem');
    if (faixa && faixa.scrollWidth > faixa.clientWidth) {
      const c = faixa.getBoundingClientRect();
      if (g.x < c.left + BORDA && faixa.scrollLeft > 0) { faixa.scrollLeft -= VELOCIDADE; mexeu = true; }
      else if (g.x > c.right - BORDA && faixa.scrollLeft < faixa.scrollWidth - faixa.clientWidth) { faixa.scrollLeft += VELOCIDADE; mexeu = true; }
    }
    if (mexeu) posicionar();
    g.raf = requestAnimationFrame(rolar);
  }

  function mover(e) {
    const g = est.gesto;
    if (!g || e.pointerId !== g.pid) return;
    g.x = e.clientX; g.y = e.clientY;
    if (!g.ativo) {
      const andou = Math.hypot(g.x - g.x0, g.y - g.y0);
      if (g.tipo === 'touch') { if (andou > LIMIAR) limpar(); return; }   // o dedo andou antes de segurar: é rolagem
      if (andou > LIMIAR) iniciar();
      return;
    }
    e.preventDefault();
    posicionar();
  }

  function soltar(e) {
    const g = est.gesto;
    if (!g || e.pointerId !== g.pid) return;
    const { ativo, chip, alvo, troca, banco } = g;
    const id = idDoCard(chip);
    const de = chip.closest('[data-dia]')?.dataset.dia ?? '';
    limpar();
    if (!ativo) return;
    est.fimEm = performance.now();   // o clique que vem junto com o soltar não abre a peça
    if (banco) { est.opcoes.aoSoltarNoBanco(id); return; }
    if (troca) { est.opcoes.aoTrocar(id, idDoCard(troca)); return; }
    const para = alvo?.dataset.dia;
    if (para && para !== de) est.opcoes.aoSoltar(id, para, de);
  }

  function cancelar() { if (est.gesto?.ativo) est.fimEm = performance.now(); limpar(); }
  function tecla(e) { if (e.key === 'Escape' && est.gesto) { e.preventDefault(); cancelar(); } }
  function segurarToque(e) { if (est.gesto?.ativo) e.preventDefault(); }   // arrastando no toque, a página não rola

  root.addEventListener('pointerdown', (e) => {
    if (est.gesto || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const chip = e.target.closest('.crono-chip[data-arrastavel]');
    if (!chip || !root.contains(chip) || !est.opcoes.podeArrastar(chip)) return;
    est.gesto = { chip, pid: e.pointerId, tipo: e.pointerType, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, ativo: false, timer: 0, raf: 0, alvo: null, troca: null, banco: null };
    if (e.pointerType === 'touch') est.gesto.timer = setTimeout(iniciar, SEGURAR);
    window.addEventListener('pointermove', mover, true);
    window.addEventListener('pointerup', soltar, true);
    window.addEventListener('pointercancel', cancelar, true);
    window.addEventListener('keydown', tecla, true);
    document.addEventListener('touchmove', segurarToque, { capture: true, passive: false });
  });
  // segurar no toque abre o menu do navegador: no card arrastável, não
  root.addEventListener('contextmenu', (e) => { if (e.target.closest('.crono-chip[data-arrastavel]') && est.gesto) e.preventDefault(); });
  // o clique logo depois de um arrasto não abre o detalhe da peça
  root.addEventListener('click', (e) => {
    if (performance.now() - est.fimEm < 400) { e.stopPropagation(); e.preventDefault(); }
  }, true);
}
