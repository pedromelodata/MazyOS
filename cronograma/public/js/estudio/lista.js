// 22/10 (Pedro): a área "Design" do Ateliê (#/atelie?area=design). Lista os designs com miniatura (a página 1,
// desenhada pelo mesmo render.js), cria um novo por formato (stories, feed 4:5, quadrado ou personalizado), abre,
// duplica e apaga, e "Gerar com IA" (dialogos.js). Lista vinda do servidor sem as páginas: a miniatura busca o
// documento quando o cartão aparece na tela.
import { esc, toast, haQuanto, abrirPainel, fecharPainel, BTN_FECHAR } from '../core.js';
import * as M from './modelo.js';
import * as A from './api.js';
import { ic } from './icones.js';
import { miniaturaEl } from './render.js';
import { abrirGerarIA, abrirModelos } from './dialogos.js';
import { carregarFontes } from './fontes.js';
import { rotuloDaPeca } from './editor.js';

const ORIGEM = { ia: 'Feito pela IA', importado: 'Importado', manual: '' };

export function montarLista(alvo) {
  const est = { docs: null, erro: null, busca: '', formato: '' };
  alvo.innerHTML = `
    <div class="est-lista">
      <div class="est-lista-barra">
        <label class="est-busca-caixa">${ic('busca', 15)}<input type="search" class="campo" data-busca placeholder="Buscar design" aria-label="Buscar design"></label>
        <div class="segmentado" role="group" aria-label="Filtrar por formato">
          <button type="button" data-filtro="" aria-pressed="true">Todos</button>
          ${M.FORMATOS.map((f) => `<button type="button" data-filtro="${f.id}" aria-pressed="false">${esc(f.nome)}</button>`).join('')}
        </div>
        <span class="espaco"></span>
        <button type="button" class="btn" data-gerar>${ic('ia', 16)}Gerar com IA</button>
        <button type="button" class="btn" data-modelos>${ic('modelo', 16)}A partir de um modelo</button>
        <button type="button" class="btn btn-primario" data-novo>${ic('mais', 16)}Novo design</button>
      </div>
      <div class="est-lista-corpo" aria-live="polite"></div>
    </div>`;
  const corpo = alvo.querySelector('.est-lista-corpo');
  const visto = new IntersectionObserver((entradas) => {
    for (const e of entradas) if (e.isIntersecting) { visto.unobserve(e.target); preencherMiniatura(e.target); }
  }, { rootMargin: '200px' });

  async function carregar() {
    corpo.innerHTML = `<div class="est-lista-grade">${'<div class="est-cartao est-cartao-esq"><span class="fx-esq"></span></div>'.repeat(4)}</div>`;
    try {
      est.docs = await A.listarDocs();
      est.erro = null;
    } catch (e) {
      est.erro = e;
      est.docs = null;
    }
    desenhar();
  }

  function filtrados() {
    const q = est.busca.trim().toLowerCase();
    return (est.docs ?? [])
      .filter((d) => (!est.formato || d.formato === est.formato) && (!q || String(d.titulo ?? '').toLowerCase().includes(q)))
      .sort((a, b) => String(b.atualizadoEm ?? b.criadoEm ?? '').localeCompare(String(a.atualizadoEm ?? a.criadoEm ?? '')));
  }

  function desenhar() {
    if (est.erro) {
      const semRota = est.erro.status === 404;
      corpo.innerHTML = `<div class="card vazio"><span class="vazio-ico">${ic('alerta', 22)}</span><strong>${semRota ? 'O estúdio ainda não chegou neste servidor' : 'Os designs não carregaram'}</strong><p>${esc(semRota ? 'As rotas do estúdio (/api/estudio) não responderam. Reinicie o servidor com a versão nova.' : est.erro.message)}</p><button type="button" class="btn" data-recarregar>${ic('gerar', 15)}Tentar de novo</button></div>`;
      return;
    }
    const lista = filtrados();
    if (!est.docs?.length) {
      corpo.innerHTML = `
        <div class="card vazio est-lista-vazio">
          <span class="vazio-ico">${ic('pincel', 22)}</span>
          <strong>Nenhum design ainda</strong>
          <div class="est-botoes"><button type="button" class="btn" data-gerar>${ic('ia', 15)}Gerar com IA</button><button type="button" class="btn" data-modelos>${ic('modelo', 15)}A partir de um modelo</button><button type="button" class="btn btn-primario" data-novo>${ic('mais', 15)}Novo design</button></div>
        </div>`;
      return;
    }
    if (!lista.length) {
      corpo.innerHTML = '<p class="est-dica est-lista-nada">Nada com esse filtro.</p>';
      return;
    }
    corpo.innerHTML = `<ul class="est-lista-grade">${lista.map((d) => {
      const n = d.paginas?.length ?? d.nPaginas ?? null;
      const f = M.formatoInfo(d.formato);
      const peca = d.pecaId ? (d.peca?.titulo ? `${d.peca.data ? `${d.peca.data.slice(8, 10)}/${d.peca.data.slice(5, 7)} · ` : ''}${d.peca.titulo}` : rotuloDaPeca(d.pecaId)) : '';
      return `
      <li class="est-cartao card" data-doc="${esc(d.id)}">
        <a class="est-cartao-mini" href="#/atelie?design=${encodeURIComponent(d.id)}" aria-label="Abrir ${esc(d.titulo ?? 'design')}" style="aspect-ratio:${d.largura || f.largura} / ${d.altura || f.altura}"><span class="est-mini-vaga"></span></a>
        <div class="est-cartao-info">
          <a class="est-cartao-titulo" href="#/atelie?design=${encodeURIComponent(d.id)}">${esc(d.titulo ?? 'Design sem título')}</a>
          <p>${esc(f.nome)}${n ? ` · ${n} página${n > 1 ? 's' : ''}` : ''}${ORIGEM[d.origem] ? ` · ${esc(ORIGEM[d.origem])}` : ''}</p>
          ${peca ? `<p class="est-cartao-peca">${ic('link', 13)}${esc(peca)}</p>` : ''}
          <p class="est-cartao-quando">${esc(haQuanto(d.atualizadoEm ?? d.criadoEm))}${d.atualizadoPor ? ` · ${esc(d.atualizadoPor)}` : ''}</p>
        </div>
        <div class="est-cartao-acoes">
          <button type="button" class="btn-icone btn-sm" data-duplicar="${esc(d.id)}" aria-label="Duplicar ${esc(d.titulo ?? '')}" title="Duplicar">${ic('duplicar', 15)}</button>
          <button type="button" class="btn-icone btn-sm btn-perigo" data-apagar="${esc(d.id)}" aria-label="Apagar ${esc(d.titulo ?? '')}" title="Apagar">${ic('lixo', 15)}</button>
        </div>
      </li>`;
    }).join('')}</ul>`;
    corpo.querySelectorAll('.est-cartao').forEach((li) => visto.observe(li));
  }

  const cache = new Map();
  async function preencherMiniatura(li) {
    const id = li.dataset.doc;
    const caixa = li.querySelector('.est-cartao-mini');
    if (!caixa) return;
    try {
      let d = (est.docs ?? []).find((x) => x.id === id);
      // o resumo da lista traz a página 1 em "capa": a miniatura sai dela, sem buscar o documento inteiro
      if (d?.capa && !d.paginas) d = { ...d, paginas: [d.capa] };
      if (!d?.paginas?.length) {
        if (!cache.has(id)) cache.set(id, A.lerDoc(id));
        d = await cache.get(id);
      }
      const n = M.normalizarDoc(d);
      // 22/10 (Pedro): a caixa tem no máximo 360 px de altura: o stories cabe inteiro (pela altura), centralizado
      const alturaMax = parseFloat(getComputedStyle(caixa).maxHeight) || 360;
      const largura = Math.max(60, Math.min(caixa.clientWidth || 220, Math.floor((alturaMax * n.largura) / n.altura)));
      const mini = miniaturaEl(n, n.paginas[0], largura);
      caixa.replaceChildren(mini);
    } catch {
      caixa.innerHTML = `<span class="est-mini-vaga est-mini-erro">${ic('alerta', 18)}</span>`;
    }
  }

  // 22/10 (Pedro): "Novo a partir de um modelo", com miniatura: o modelo vira um design novo (ids novos, sem peça) e abre
  function novoDeModelo(formato = '') {
    abrirModelos({
      formato,
      aoEscolher: async (m) => {
        const novo = await A.criarDoc(M.docDoModelo(m, { titulo: m.nome ?? m.titulo }));
        location.hash = `#/atelie?design=${encodeURIComponent(novo.id)}`;
      },
    });
  }

  // 22/10 (Pedro): o título e os rótulos bastam (sem parágrafo de explicação no painel, no vazio nem nas opções)
  function abrirNovo() {
    const p = abrirPainel(`
      <div class="painel-topo"><div><h2>Novo design</h2></div>${BTN_FECHAR}</div>
      <form class="painel-corpo est-form" id="est-form-novo">
        <button type="button" class="est-opcao est-ir-modelos" data-ir-modelos>${ic('modelo', 18)}<span><b>Começar de um modelo</b></span></button>
        <label class="rotulo">Título<input class="campo" name="titulo" maxlength="160" placeholder="Ex.: Carrossel MEI que passou do limite"></label>
        <fieldset class="est-formatos"><legend>Formato</legend>
          ${M.FORMATOS.map((f, i) => `
            <label class="est-formato">
              <input type="radio" name="formato" value="${f.id}" ${i === 1 ? 'checked' : ''}>
              <span class="est-formato-desenho" style="aspect-ratio:${f.largura} / ${f.altura}"></span>
              <b>${esc(f.nome)}</b><small>${esc(f.medida)}</small>
            </label>`).join('')}
        </fieldset>
        <div class="est-grade2" data-personalizado hidden>
          <label class="rotulo">Largura (px)<input class="campo" type="number" name="largura" min="${M.LADO_MIN}" max="${M.LADO_MAX}" value="1080"></label>
          <label class="rotulo">Altura (px)<input class="campo" type="number" name="altura" min="${M.LADO_MIN}" max="${M.LADO_MAX}" value="1350"></label>
        </div>
        <fieldset class="est-opcoes"><legend>Fundo</legend>
          <label class="est-opcao"><input type="radio" name="fundo" value="papel" checked><span><b>Papel quente</b><small>#FAF8F5, o fundo da marca</small></span></label>
          <label class="est-opcao"><input type="radio" name="fundo" value="escuro"><span><b>Escuro</b><small>Gradiente ink hero (o problema)</small></span></label>
          <label class="est-opcao"><input type="radio" name="fundo" value="coral"><span><b>Coral</b><small>Pra capa e fecho</small></span></label>
        </fieldset>
        <p class="est-form-erro" role="alert" hidden></p>
      </form>
      <div class="painel-rodape"><span class="espaco"></span><button type="button" class="btn" data-fechar>Cancelar</button><button type="submit" form="est-form-novo" class="btn btn-primario">${ic('mais', 15)}Criar e abrir</button></div>`);
    const form = p.querySelector('#est-form-novo');
    const pers = p.querySelector('[data-personalizado]');
    form.addEventListener('change', () => { pers.hidden = form.formato.value !== 'personalizado'; });
    p.querySelector('[data-ir-modelos]').addEventListener('click', () => novoDeModelo(form.formato.value === 'stories' ? 'stories' : form.formato.value === 'feed45' ? 'feed45' : ''));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formato = form.formato.value;
      const f = M.formatoInfo(formato);
      const largura = formato === 'personalizado' ? Math.round(M.num(form.largura.value, 1080, M.LADO_MIN, M.LADO_MAX)) : f.largura;
      const altura = formato === 'personalizado' ? Math.round(M.num(form.altura.value, 1350, M.LADO_MIN, M.LADO_MAX)) : f.altura;
      const fundo = { papel: { tipo: 'cor', cor: '#FAF8F5' }, escuro: { tipo: 'gradiente', cor: '#2A2E37', cor2: '#15171C', angulo: 160 }, coral: { tipo: 'cor', cor: '#F2643C' } }[form.fundo.value];
      const botao = p.querySelector('[type="submit"]');
      botao.disabled = true;
      try {
        const novo = await A.criarDoc({
          titulo: form.titulo.value.trim() || `${f.nome} sem título`,
          formato, largura, altura,
          paginas: [M.paginaNova(fundo)],
          pecaId: null,
          origem: 'manual',
          estrategia: null,
        });
        fecharPainel();
        location.hash = `#/atelie?design=${encodeURIComponent(novo.id)}`;
      } catch (err) {
        botao.disabled = false;
        const erro = p.querySelector('.est-form-erro');
        erro.hidden = false;
        erro.textContent = err.message;
      }
    });
    form.titulo.focus();
  }

  alvo.addEventListener('click', async (e) => {
    const t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    if (t.closest('[data-novo]')) return abrirNovo();
    if (t.closest('[data-modelos]')) return novoDeModelo(est.formato);
    if (t.closest('[data-gerar]')) return abrirGerarIA();
    if (t.closest('[data-recarregar]')) return carregar();
    const filtro = t.closest('[data-filtro]');
    if (filtro) {
      est.formato = filtro.dataset.filtro;
      alvo.querySelectorAll('[data-filtro]').forEach((b) => b.setAttribute('aria-pressed', String(b === filtro)));
      return desenhar();
    }
    const dup = t.closest('[data-duplicar]')?.dataset.duplicar;
    if (dup) {
      try { await A.duplicarDoc(dup); toast('Design duplicado'); carregar(); } catch (err) { toast(err.message); }
      return;
    }
    const apagar = t.closest('[data-apagar]')?.dataset.apagar;
    if (apagar) {
      const d = est.docs?.find((x) => x.id === apagar);
      if (!window.confirm(`Apagar "${d?.titulo ?? 'este design'}"? As artes já anexadas nas peças continuam lá.`)) return;
      try { await A.apagarDoc(apagar); toast('Design apagado'); carregar(); } catch (err) { toast(err.message); }
    }
  });
  let tempo = null;
  alvo.addEventListener('input', (e) => {
    if (!(e.target instanceof HTMLInputElement) || !e.target.hasAttribute('data-busca')) return;
    est.busca = e.target.value;
    clearTimeout(tempo);
    tempo = setTimeout(desenhar, 150);
  });

  // as miniaturas usam as mesmas fontes do editor (sem elas, a Sora da casca faz as vezes)
  carregarFontes().catch(() => {});
  carregar();
  return { recarregar: carregar };
}
