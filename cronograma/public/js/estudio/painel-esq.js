// 22/10 (Pedro): painel da esquerda do editor. Em cima, "Texto" e "Forma" põem camada nova (modelos do design
// guide). Aba Assets: o banco de assets (os da base, versionados no repo, e os que o time sobe), com busca,
// categorias, miniaturas; clicar ou arrastar põe na página; subir imagem (PNG, JPEG ou WEBP até 30 MB); ocultar
// (base) ou apagar (upload) e restaurar. Aba Camadas: a lista de cima pra baixo, renomear (duplo clique), subir e
// descer (ou arrastar), travar, ocultar, duplicar e apagar.
import { esc, toast, abrirPainel, fecharPainel, BTN_FECHAR } from '../core.js';
import * as M from './modelo.js';
import * as A from './api.js';
import { ic } from './icones.js';
import { urlDoAsset } from './render.js';
import { esquecerAsset } from './exportar.js';

export const CATEGORIAS = [
  ['leo', 'Léo'], ['3d', '3D'], ['icone', 'Ícones'], ['marca', 'Marca'], ['tela-app', 'Telas do app'],
  ['foto', 'Fotos'], ['fundo', 'Fundos'], ['outro', 'Outros'],
];
const NOME_CAT = Object.fromEntries(CATEGORIAS);
const TIPOS_OK = /^image\/(png|jpeg|webp)$/;
const TETO = 30 * 1024 * 1024;
const ICONE_TIPO = { texto: 'texto', imagem: 'imagem', forma: 'forma' };

export function montarEsquerda(ed, raiz) {
  const est = { aba: 'assets', busca: '', categoria: '', ocultos: false, subindo: [], recentes: new Set() };
  raiz.innerHTML = `
    <div class="est-add">
      <div class="est-menu-caixa">
        <button type="button" class="btn btn-sm" data-abrir-menu="texto" aria-haspopup="menu" aria-expanded="false">${ic('texto', 15)}Texto</button>
        <div class="est-menu" role="menu" data-menu="texto" hidden>
          ${M.LISTA_PRESETS_TEXTO.map((p) => `<button type="button" role="menuitem" data-texto="${p.id}" class="est-menu-item est-preset-${p.id}">${esc(p.nome)}</button>`).join('')}
        </div>
      </div>
      <div class="est-menu-caixa">
        <button type="button" class="btn btn-sm" data-abrir-menu="forma" aria-haspopup="menu" aria-expanded="false">${ic('forma', 15)}Forma</button>
        <div class="est-menu" role="menu" data-menu="forma" hidden>
          <button type="button" role="menuitem" data-forma="retangulo" class="est-menu-item"><span class="est-f est-f-ret"></span>Retângulo (card)</button>
          <button type="button" role="menuitem" data-forma="circulo" class="est-menu-item"><span class="est-f est-f-circ"></span>Círculo</button>
          <button type="button" role="menuitem" data-forma="linha" class="est-menu-item"><span class="est-f est-f-lin"></span>Linha</button>
        </div>
      </div>
    </div>
    <div class="segmentado est-abas" role="tablist" aria-label="Painel da esquerda">
      <button type="button" role="tab" id="est-aba-assets" data-aba="assets" aria-selected="true" aria-controls="est-painel-esq">${ic('imagem', 15)}Assets</button>
      <button type="button" role="tab" id="est-aba-camadas" data-aba="camadas" aria-selected="false" aria-controls="est-painel-esq" tabindex="-1">${ic('camadas', 15)}Camadas</button>
    </div>
    <div class="est-troca" hidden></div>
    <div id="est-painel-esq" class="est-esq-corpo" role="tabpanel" aria-labelledby="est-aba-assets"></div>
    <input type="file" class="est-arquivo" accept="image/png,image/jpeg,image/webp" multiple hidden>`;
  const corpo = raiz.querySelector('.est-esq-corpo');
  const arquivo = raiz.querySelector('.est-arquivo');

  // ── menus Texto e Forma ──
  function fecharMenus() {
    // só os menus Texto e Forma (o menu de um asset se fecha sozinho)
    raiz.querySelectorAll('.est-menu[data-menu]').forEach((m) => { m.hidden = true; });
    raiz.querySelectorAll('[data-abrir-menu]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  }
  document.addEventListener('pointerdown', (e) => { if (raiz.isConnected && !(e.target instanceof Element && e.target.closest('.est-menu-caixa'))) fecharMenus(); });
  raiz.addEventListener('keydown', (e) => { if (e.key === 'Escape' && raiz.querySelector('.est-menu[data-menu]:not([hidden])')) { e.stopPropagation(); fecharMenus(); } });

  // ── abas ──
  function pintarAbas() {
    for (const b of raiz.querySelectorAll('[data-aba]')) {
      const ativa = b.dataset.aba === est.aba;
      b.setAttribute('aria-selected', String(ativa));
      b.tabIndex = ativa ? 0 : -1;
    }
    corpo.setAttribute('aria-labelledby', `est-aba-${est.aba}`);
    if (est.aba === 'assets') desenharAssets(); else desenharCamadas();
  }

  // ── assets ──
  // 22/10 (Pedro): o que foi subido nesta sessão aparece primeiro (o servidor manda na ordem dele, com o upload no fim)
  function filtrados() {
    const q = est.busca.trim().toLowerCase();
    const recente = (a) => (est.recentes.has(a.id) ? 0 : 1);
    return ed.assets.filter((a) => {
      if (!est.ocultos && a.oculto) return false;
      if (est.ocultos && !a.oculto) return false;
      if (est.categoria && a.categoria !== est.categoria) return false;
      if (!q) return true;
      return `${a.nome ?? ''} ${(a.tags ?? []).join(' ')} ${a.descricao ?? ''} ${NOME_CAT[a.categoria] ?? ''}`.toLowerCase().includes(q);
    }).map((a, i) => ({ a, i })).sort((p, q2) => recente(p.a) - recente(q2.a) || p.i - q2.i).map((x) => x.a);
  }
  function desenharAssets() {
    if (est.aba !== 'assets') return;
    const lista = filtrados();
    const ocultosN = ed.assets.filter((a) => a.oculto).length;
    const foco = document.activeElement?.classList?.contains('est-busca');
    corpo.innerHTML = `
      <div class="est-assets-topo">
        <label class="est-busca-caixa">${ic('busca', 15)}<input type="search" class="campo est-busca" placeholder="Buscar (nome, tag)" value="${esc(est.busca)}" aria-label="Buscar assets"></label>
        <button type="button" class="btn btn-sm" data-subir title="PNG, JPEG ou WEBP até 30 MB e 8000 × 8000 px">${ic('subirArquivo', 15)}Subir</button>
      </div>
      <div class="est-cats" role="group" aria-label="Categorias">
        <button type="button" data-cat="" aria-pressed="${!est.categoria}">Todos</button>
        ${CATEGORIAS.map(([id, n]) => `<button type="button" data-cat="${id}" aria-pressed="${est.categoria === id}">${esc(n)}</button>`).join('')}
      </div>
      ${est.subindo.length ? `<ul class="est-subindo">${est.subindo.map((s, i) => `<li data-estado="${s.estado}"><span>${esc(s.nome)}</span><b>${s.estado === 'erro' ? esc(s.erro) : s.estado === 'ok' ? 'pronto' : `${s.pct}%`}</b>${s.estado === 'erro' ? `<button type="button" class="btn-icone btn-sm" data-fechar-subida="${i}" aria-label="Fechar o aviso de ${esc(s.nome)}" title="Fechar">${ic('fechar', 13)}</button>` : ''}</li>`).join('')}</ul>` : ''}
      ${ed.erroAssets ? `<p class="aviso">${ic('alerta', 15)}<span>Os assets não carregaram: ${esc(ed.erroAssets)}</span></p>` : ''}
      <ul class="est-grade-assets" aria-label="Assets">${lista.map((a) => `
        <li class="est-asset${a.oculto ? ' oculto' : ''}" data-asset="${esc(a.id)}">
          <button type="button" class="est-asset-img" data-usar="${esc(a.id)}" draggable="true" title="${esc(a.nome)}${a.descricao ? `: ${esc(a.descricao)}` : ''}${a.licenca ? ` (${esc(a.licenca)})` : ''}" aria-label="Pôr ${esc(a.nome)} na página">
            <img src="${esc(a.miniatura || a.url || urlDoAsset(a.id))}" alt="" loading="lazy" decoding="async" draggable="false">
          </button>
          <span class="est-asset-nome">${esc(a.nome)}</span>
          <button type="button" class="est-asset-mais btn-icone btn-sm" data-menu-asset="${esc(a.id)}" aria-label="Mais ações de ${esc(a.nome)}">${ic('mais3', 15)}</button>
        </li>`).join('')}</ul>
      ${!lista.length && !ed.erroAssets ? `<p class="est-vazio-esq">${!ed.assetsProntos ? 'Carregando os assets…' : ed.assets.length ? (est.ocultos ? 'Nenhum asset oculto.' : 'Nada com esse filtro.') : 'O banco de assets ainda está vazio: suba a primeira imagem.'}</p>` : ''}
      <label class="est-alterna est-ver-ocultos"><input type="checkbox" data-ver-ocultos ${est.ocultos ? 'checked' : ''}><span>Ver ocultos e removidos (${ocultosN})</span></label>`;
    if (foco) {
      const b = corpo.querySelector('.est-busca');
      b.focus();
      b.setSelectionRange(b.value.length, b.value.length);
    }
  }

  async function recarregarAssets() {
    try {
      const lista = await A.listarAssets({ ocultos: true });
      ed.erroAssets = null;
      ed.atualizarAssets(lista);
    } catch (e) {
      ed.erroAssets = e.message;
      desenharAssets();
    }
  }

  // sobe imagens (do botão, do arrastar pra página ou do Ctrl+V); com inserir, cada uma entra na página
  // 22/10 (Pedro): a subida vai pro topo da grade; uma imagem só (pelo botão) já abre "Nome, categoria e tags"; o aviso
  // de erro fica até fechar (tem o X) e o de pronto some em 4 s
  async function subirArquivos(arquivos, { inserir = false, cx = null, cy = null } = {}) {
    const categoria = est.categoria || 'outro';
    const subidos = [];
    for (const f of arquivos) {
      const item = { nome: f.name || 'imagem', pct: 0, estado: 'subindo', erro: '' };
      est.subindo.push(item);
      if (!TIPOS_OK.test(f.type)) { item.estado = 'erro'; item.erro = 'só PNG, JPEG ou WEBP'; continue; }
      if (f.size > TETO) { item.estado = 'erro'; item.erro = 'passa de 30 MB'; continue; }
      desenharAssets();
      try {
        const asset = await A.subirAsset(f, { categoria, nome: f.name }, (pct) => { item.pct = pct; if (est.aba === 'assets') { const li = corpo.querySelector('.est-subindo li:last-child b'); if (li && est.subindo.at(-1) === item) li.textContent = `${pct}%`; } });
        item.estado = 'ok';
        if (asset?.id) {
          est.recentes.add(asset.id);
          subidos.push(asset);
          ed.atualizarAssets([asset, ...ed.assets.filter((a) => a.id !== asset.id)]);
          if (inserir) ed.inserirAsset(asset, cx != null ? { cx, cy } : {});
        }
      } catch (e) {
        item.estado = 'erro';
        item.erro = e.message;
        if (e.parar) break;
      }
      desenharAssets();
    }
    desenharAssets();
    setTimeout(() => { est.subindo = est.subindo.filter((s) => s.estado === 'erro'); desenharAssets(); }, 4000);
    if (!inserir) {
      await recarregarAssets();
      const novo = subidos.length === 1 ? ed.assetsPorId.get(subidos[0].id) ?? subidos[0] : null;
      if (novo) editarAsset(novo, { recemSubido: true });
    }
  }

  function menuAsset(id, botao) {
    const a = ed.assetsPorId.get(id);
    if (!a) return;
    corpo.querySelector('.est-menu-asset')?.remove();
    const m = document.createElement('div');
    m.className = 'est-menu est-menu-asset';
    m.setAttribute('role', 'menu');
    const ehBase = a.origem === 'base';
    m.innerHTML = `
      ${!a.oculto ? `<button type="button" role="menuitem" class="est-menu-item" data-ma="usar">${ic('mais', 14)}Pôr na página</button>
      <button type="button" role="menuitem" class="est-menu-item" data-ma="fundo">${ic('imagem', 14)}Usar como fundo</button>` : ''}
      <button type="button" role="menuitem" class="est-menu-item" data-ma="editar">${ic('editar', 14)}Nome, categoria e tags</button>
      ${a.oculto
        ? `<button type="button" role="menuitem" class="est-menu-item" data-ma="restaurar">${ic('restaurar', 14)}Restaurar</button>`
        : `<button type="button" role="menuitem" class="est-menu-item est-menu-perigo" data-ma="remover">${ic(ehBase ? 'olho-fechado' : 'lixo', 14)}${ehBase ? 'Ocultar (é da base)' : 'Apagar'}</button>`}`;
    botao.closest('.est-asset').append(m);
    m.querySelector('button')?.focus();
    m.addEventListener('click', async (e) => {
      const acao = e.target instanceof Element ? e.target.closest('[data-ma]')?.dataset.ma : null;
      if (!acao) return;
      m.remove();
      if (acao === 'usar') ed.inserirAsset(a);
      else if (acao === 'fundo') ed.usarComoFundo(a);
      else if (acao === 'editar') editarAsset(a);
      else if (acao === 'restaurar') {
        try { await A.restaurarAsset(a.id); toast(`"${a.nome}" voltou pro banco`); recarregarAssets(); } catch (err) { toast(err.message); }
      } else if (acao === 'remover') {
        const pergunta = ehBase
          ? `Ocultar "${a.nome}"? Ele é da base (vem com o sistema): some da lista, mas dá pra restaurar em "Ver ocultos".`
          : `Apagar "${a.nome}" do banco? Design que usa essa imagem fica com o espaço vazio.`;
        if (!window.confirm(pergunta)) return;
        try {
          await A.apagarAsset(a.id);
        } catch (err) {
          // upload usado em algum design: o servidor diz quais; apagar mesmo assim deixa a camada vazia (a revisão avisa)
          if (err.status !== 409 || !Array.isArray(err.corpo?.usos)) { toast(err.message); return; }
          const quais = err.corpo.usos.slice(0, 5).map((u) => `"${u.titulo}"`).join(', ');
          if (!window.confirm(`${err.message}

Usado em: ${quais}. Apagar mesmo assim? Nesses designs a imagem some.`)) return;
          try { await A.apagarAsset(a.id, { forcar: true }); } catch (e2) { toast(e2.message); return; }
        }
        esquecerAsset(a.id);
        toast(ehBase ? 'Asset oculto' : 'Asset apagado');
        recarregarAssets();
      }
    });
    m.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); m.remove(); botao.focus(); } });
    setTimeout(() => document.addEventListener('pointerdown', function fora(ev) {
      if (!(ev.target instanceof Element && ev.target.closest('.est-menu-asset'))) { m.remove(); document.removeEventListener('pointerdown', fora, true); }
    }, true), 0);
  }

  function editarAsset(a, { recemSubido = false } = {}) {
    const p = abrirPainel(`
      <div class="painel-topo"><div><h2>${recemSubido ? 'Imagem subida' : 'Asset'}</h2><p>${esc(recemSubido ? 'Já está no banco. Dê um nome, a categoria e umas tags pra achar depois.' : a.origem === 'base' ? 'Da base do sistema (versionado no repo)' : 'Subido pelo time')}</p></div>${BTN_FECHAR}</div>
      <form class="painel-corpo est-form" id="est-form-asset">
        <div class="est-asset-grande"><img src="${esc(a.url || urlDoAsset(a.id))}" alt=""></div>
        <label class="rotulo">Nome<input class="campo" name="nome" value="${esc(a.nome ?? '')}" maxlength="120" required></label>
        <label class="rotulo">Categoria<select class="campo" name="categoria">${CATEGORIAS.map(([id, n]) => `<option value="${id}" ${a.categoria === id ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
        <label class="rotulo">Tags (separadas por vírgula)<input class="campo" name="tags" value="${esc((a.tags ?? []).join(', '))}" maxlength="400"></label>
        <label class="rotulo">Descrição<textarea class="campo" name="descricao" rows="3" maxlength="600">${esc(a.descricao ?? '')}</textarea></label>
        <p class="est-dica">${a.largura ? `${a.largura} × ${a.altura} px · ` : ''}${esc(a.tipo ?? '')}${a.licenca ? ` · ${esc(a.licenca)}` : ''}</p>
        <p class="est-form-erro" role="alert" hidden></p>
      </form>
      <div class="painel-rodape"><span class="espaco"></span><button type="button" class="btn" data-fechar>Cancelar</button><button type="submit" form="est-form-asset" class="btn btn-primario">${ic('check', 15)}Salvar</button></div>`);
    p.querySelector('#est-form-asset').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const erro = p.querySelector('.est-form-erro');
      try {
        await A.editarAsset(a.id, {
          nome: String(f.get('nome')).trim(),
          categoria: f.get('categoria'),
          tags: String(f.get('tags')).split(',').map((t) => t.trim()).filter(Boolean),
          descricao: String(f.get('descricao')).trim(),
        });
        fecharPainel();
        toast('Asset atualizado');
        // a grade mostra a categoria nova (o asset não some atrás de um filtro de outra categoria)
        if (est.categoria && est.categoria !== f.get('categoria')) est.categoria = String(f.get('categoria'));
        recarregarAssets();
      } catch (err) {
        erro.hidden = false;
        erro.textContent = err.message;
      }
    });
  }

  // modo "trocar imagem": o próximo asset escolhido entra no lugar (camada ou fundo). 22/10 (Pedro): a troca de fundo
  // filtra Fundos e, quando acaba (escolheu ou cancelou), a grade volta pro filtro de antes
  function trocarImagem(t) {
    ed.trocando = t;
    est.aba = 'assets';
    if (t.alvo === 'fundo') {
      if (est.catAntesDaTroca === undefined) est.catAntesDaTroca = est.categoria;
      est.categoria = 'fundo';
    }
    pintarAbas();
    pintarTroca();
  }
  function pintarTroca() {
    const b = raiz.querySelector('.est-troca');
    b.hidden = !ed.trocando;
    if (!ed.trocando && est.catAntesDaTroca !== undefined) {
      est.categoria = est.catAntesDaTroca;
      delete est.catAntesDaTroca;
      desenharAssets();
    }
    if (!ed.trocando) return;
    b.innerHTML = `${ic('imagem', 15)}<span>${ed.trocando.alvo === 'fundo' ? 'Escolha a imagem do fundo' : 'Escolha a imagem nova'}</span><button type="button" class="btn btn-sm btn-fantasma" data-cancelar-troca>Cancelar</button>`;
  }

  // ── camadas ──
  function desenharCamadas() {
    if (est.aba !== 'camadas' || !ed.doc) return;
    const pag = ed.pagina();
    const lista = [...pag.camadas].reverse();
    const renomeando = corpo.querySelector('.est-renomear');
    if (renomeando && !renomeando.dataset.feito && document.activeElement === renomeando) return;
    corpo.innerHTML = `
      <p class="est-camadas-cab">Página ${ed.idx + 1} · ${pag.camadas.length} camada${pag.camadas.length === 1 ? '' : 's'}</p>
      <ol class="est-camadas" aria-label="Camadas, da frente pro fundo">${lista.map((c) => `
        <li class="est-camada${ed.sel.includes(c.id) ? ' ativa' : ''}${c.oculta ? ' oculta' : ''}" data-camada-lista="${esc(c.id)}" draggable="true">
          <span class="est-camada-pegar" aria-hidden="true">${ic('pegar', 14)}</span>
          <button type="button" class="est-camada-nome" data-escolher="${esc(c.id)}" aria-pressed="${ed.sel.includes(c.id)}" title="Clique escolhe, Shift soma, duplo clique renomeia">
            ${ic(ICONE_TIPO[c.tipo], 14)}<span>${esc(c.nome)}</span>${c.tipo === 'texto' ? `<small>${esc(M.textoSemMarcas(c.texto).slice(0, 40))}</small>` : ''}
          </button>
          <button type="button" class="btn-icone btn-sm" data-trava="${esc(c.id)}" aria-pressed="${c.travada}" aria-label="${c.travada ? 'Destravar' : 'Travar'} ${esc(c.nome)}" title="${c.travada ? 'Destravar' : 'Travar'}">${ic(c.travada ? 'cadeado' : 'destravar', 14)}</button>
          <button type="button" class="btn-icone btn-sm" data-olho="${esc(c.id)}" aria-pressed="${c.oculta}" aria-label="${c.oculta ? 'Mostrar' : 'Ocultar'} ${esc(c.nome)}" title="${c.oculta ? 'Mostrar' : 'Ocultar'}">${ic(c.oculta ? 'olho-fechado' : 'olho', 14)}</button>
        </li>`).join('')}</ol>
      ${!lista.length ? '<p class="est-vazio-esq">Página vazia.</p>' : ''}
      <div class="est-botoes est-camadas-acoes">
        <button type="button" class="btn-icone btn-sm" data-cam-acao="subir" aria-label="Subir a camada" title="Subir (Ctrl+])" ${ed.sel.length ? '' : 'disabled'}>${ic('subir', 15)}</button>
        <button type="button" class="btn-icone btn-sm" data-cam-acao="descer" aria-label="Descer a camada" title="Descer (Ctrl+[)" ${ed.sel.length ? '' : 'disabled'}>${ic('descer', 15)}</button>
        <button type="button" class="btn-icone btn-sm" data-cam-acao="duplicar" aria-label="Duplicar" title="Duplicar (Ctrl+D)" ${ed.sel.length ? '' : 'disabled'}>${ic('duplicar', 15)}</button>
        <button type="button" class="btn-icone btn-sm btn-perigo" data-cam-acao="apagar" aria-label="Apagar" title="Apagar (Delete)" ${ed.sel.length ? '' : 'disabled'}>${ic('lixo', 15)}</button>
      </div>`;
  }

  function renomear(id, botao) {
    const c = ed.camada(id);
    if (!c) return;
    const input = document.createElement('input');
    input.className = 'campo est-renomear';
    input.value = c.nome;
    input.maxLength = 80;
    input.setAttribute('aria-label', 'Nome da camada');
    botao.replaceWith(input);
    input.focus();
    input.select();
    let feito = false;
    const fim = (salvar) => {
      if (feito) return;
      feito = true;
      input.dataset.feito = '1';
      if (salvar) ed.renomear(id, input.value);
      desenharCamadas();
    };
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') fim(true);
      else if (e.key === 'Escape') fim(false);
    });
    input.addEventListener('blur', () => fim(true));
  }

  // ── eventos ──
  raiz.addEventListener('click', (e) => {
    const t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    const abrir = t.closest('[data-abrir-menu]');
    if (abrir) {
      const m = raiz.querySelector(`[data-menu="${abrir.dataset.abrirMenu}"]`);
      const estava = !m.hidden;
      fecharMenus();
      if (!estava) { m.hidden = false; abrir.setAttribute('aria-expanded', 'true'); m.querySelector('button')?.focus(); }
      return;
    }
    const preset = t.closest('[data-texto]')?.dataset.texto;
    if (preset) { fecharMenus(); ed.inserirCamadas([M.camadaTexto(ed.doc, preset, ed.fundoAtual())]); return; }
    const forma = t.closest('[data-forma]')?.dataset.forma;
    if (forma) { fecharMenus(); ed.inserirCamadas([M.camadaForma(ed.doc, forma, ed.fundoAtual())]); return; }
    const aba = t.closest('[data-aba]')?.dataset.aba;
    if (aba) { est.aba = aba; pintarAbas(); return; }
    if (t.closest('[data-cancelar-troca]')) { ed.cancelarTroca(); return; }
    const fechaErro = t.closest('[data-fechar-subida]');
    if (fechaErro) { est.subindo.splice(Number(fechaErro.dataset.fecharSubida), 1); desenharAssets(); return; }
    if (t.closest('[data-subir]')) { arquivo.click(); return; }
    const cat = t.closest('[data-cat]');
    if (cat) { est.categoria = cat.dataset.cat; desenharAssets(); return; }
    const usar = t.closest('[data-usar]')?.dataset.usar;
    if (usar) {
      const a = ed.assetsPorId.get(usar);
      if (a?.oculto) return toast('Asset oculto: restaure antes de usar');
      if (ed.trocando) return ed.trocarPor(a);
      ed.inserirAsset(a);
      return;
    }
    const menu = t.closest('[data-menu-asset]');
    if (menu) { menuAsset(menu.dataset.menuAsset, menu); return; }
    const escolher = t.closest('[data-escolher]')?.dataset.escolher;
    if (escolher) {
      if (e.detail === 2) return renomear(escolher, t.closest('[data-escolher]'));
      ed.selecionar([escolher], { somar: e.shiftKey });
      return;
    }
    const trava = t.closest('[data-trava]')?.dataset.trava;
    if (trava) { ed.alternar(trava, 'travada'); return; }
    const olho = t.closest('[data-olho]')?.dataset.olho;
    if (olho) { ed.alternar(olho, 'oculta'); return; }
    const ca = t.closest('[data-cam-acao]')?.dataset.camAcao;
    if (ca === 'subir') ed.ordenar(1);
    else if (ca === 'descer') ed.ordenar(-1);
    else if (ca === 'duplicar') ed.duplicarSelecao();
    else if (ca === 'apagar') ed.apagarSelecao();
  });
  raiz.addEventListener('keydown', (e) => {
    // setas entre as abas (padrão de tablist)
    const aba = e.target instanceof Element ? e.target.closest('[role="tab"]') : null;
    if (aba && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      est.aba = est.aba === 'assets' ? 'camadas' : 'assets';
      pintarAbas();
      raiz.querySelector(`[data-aba="${est.aba}"]`)?.focus();
      e.preventDefault();
    }
    if (e.key === 'F2') {
      const b = e.target instanceof Element ? e.target.closest('[data-escolher]') : null;
      if (b) { e.preventDefault(); renomear(b.dataset.escolher, b); }
    }
  });
  let tempoBusca = null;
  raiz.addEventListener('input', (e) => {
    if (!(e.target instanceof HTMLInputElement) || !e.target.classList.contains('est-busca')) return;
    est.busca = e.target.value;
    clearTimeout(tempoBusca);
    tempoBusca = setTimeout(desenharAssets, 180);
  });
  raiz.addEventListener('change', (e) => {
    if (e.target instanceof HTMLInputElement && e.target.hasAttribute('data-ver-ocultos')) { est.ocultos = e.target.checked; desenharAssets(); }
  });
  arquivo.addEventListener('change', () => {
    const lista = [...arquivo.files];
    arquivo.value = '';
    if (lista.length) subirArquivos(lista);
  });
  // arrastar asset pra página
  raiz.addEventListener('dragstart', (e) => {
    const t = e.target instanceof Element ? e.target : null;
    const usar = t?.closest('[data-usar]')?.dataset.usar;
    if (usar) {
      e.dataTransfer.setData('application/x-estudio-asset', usar);
      e.dataTransfer.effectAllowed = 'copy';
      const img = t.closest('[data-usar]').querySelector('img');
      if (img) e.dataTransfer.setDragImage(img, img.width / 2, img.height / 2);
      return;
    }
    const li = t?.closest('[data-camada-lista]');
    if (li) { e.dataTransfer.setData('application/x-estudio-camada', li.dataset.camadaLista); e.dataTransfer.effectAllowed = 'move'; }
  });
  // reordenar camadas arrastando na lista
  raiz.addEventListener('dragover', (e) => {
    if (![...(e.dataTransfer?.types ?? [])].includes('application/x-estudio-camada')) return;
    const li = e.target instanceof Element ? e.target.closest('[data-camada-lista]') : null;
    if (!li) return;
    e.preventDefault();
    raiz.querySelectorAll('.est-camada').forEach((x) => x.classList.toggle('alvo', x === li));
  });
  raiz.addEventListener('drop', (e) => {
    const id = e.dataTransfer?.getData('application/x-estudio-camada');
    const li = e.target instanceof Element ? e.target.closest('[data-camada-lista]') : null;
    raiz.querySelectorAll('.est-camada.alvo').forEach((x) => x.classList.remove('alvo'));
    if (!id || !li || li.dataset.camadaLista === id) return;
    e.preventDefault();
    const pag = ed.pagina();
    const de = pag.camadas.findIndex((c) => c.id === id);
    const para = pag.camadas.findIndex((c) => c.id === li.dataset.camadaLista);
    if (de < 0 || para < 0) return;
    ed.mudar(() => { const [c] = pag.camadas.splice(de, 1); pag.camadas.splice(para, 0, c); });
  });
  raiz.addEventListener('dragend', () => raiz.querySelectorAll('.est-camada.alvo').forEach((x) => x.classList.remove('alvo')));

  pintarAbas();
  return { desenharAssets, desenharCamadas, recarregarAssets, subirArquivos, trocarImagem, pintarTroca };
}
