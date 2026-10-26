// 22/10 (Pedro): os painéis do estúdio. Exportar (PNG, JPG ou PDF, em 1x ou 2x, a página aberta ou todas num .zip, e anexar
// na peça vinculada), Versões (as 20 últimas guardadas no servidor, com restaurar), Vincular peça do cronograma e
// Gerar com IA (POST /api/estudio/gerar, com espera e o erro de sem IA claro). Usam o painel lateral do core.
// 23/10 (Pedro): "a exportação aqui é sempre na melhor qualidade possível": PNG ou PDF, os dois sem perda e sempre no
// tamanho máximo (2x); o JPG, o tamanho Original e o PDF em JPEG saíram do painel. "Selecionar quais as imagens que eu
// quero para exportar": no editor, as páginas viram miniaturas de marcar; na lista, os designs marcados saem num .zip
// (abrirExportarVarios)
import { esc, toast, abrirPainel, fecharPainel, BTN_FECHAR, store, recarregar, fmtData, rotuloPeca, hojeBrasilia, blocoDoPilar } from '../core.js';
import * as M from './modelo.js';
import * as A from './api.js';
import { ic } from './icones.js';
import { exportarImagem, exportarPdf, baixar, nomeExportacao, zipDasPaginas } from './exportar.js';
import { miniaturaEl } from './render.js';
import { carregarFontes } from './fontes.js';
import { paginasDoCarrossel } from './listas.js';

const formatoNome = (d) => `${M.formatoInfo(d.formato).nome} · ${d.largura} × ${d.altura}`;

// ── peças do cronograma (pra vincular e pra gerar) ──
export function pecasDoCronograma() {
  const hoje = hojeBrasilia();
  // 22/10 (Pedro): cada peça já diz o formato e as páginas do design dela (a mesma conta do servidor, formatoDaPeca e
  // paginasDaPeca do estudio.mjs): stories e reel viram Stories; carrossel tem capa, slides e o final (26/10: um slide
  // por item, da lista espremida num slide ou das N coisas que a capa ou a ideia promete); o resto, 1
  const reels = (store.E?.reels ?? []).map((r) => ({
    id: r.id, data: r.data ?? '', rotulo: rotuloPeca(r), titulo: r.ideia ?? '', item: r,
    formato: (r.peca ?? 'reel') === 'reel' ? 'stories' : 'feed45',
    paginas: r.peca === 'carrossel' ? Math.min(20, Math.max(2, paginasDoCarrossel(r.carrossel, { promessa: r.ideia }))) : 1,
  }));
  const stories = (store.E?.stories ?? []).map((s) => ({
    id: s.id, data: s.data ?? '', rotulo: 'Stories do dia', titulo: s.tema ?? '', item: s,
    formato: 'stories', paginas: Math.min(20, Math.max(1, (s.quadros ?? []).length)),
  }));
  const todas = [...reels, ...stories];
  const futuras = todas.filter((p) => p.data && p.data >= hoje).sort((a, b) => a.data.localeCompare(b.data));
  const passadas = todas.filter((p) => !p.data || p.data < hoje).sort((a, b) => b.data.localeCompare(a.data));
  return [...futuras, ...passadas];
}
const rotuloItem = (p) => `${p.data ? fmtData(p.data) : 'sem data'} · ${p.rotulo} · ${p.titulo}`;

function opcoesPecas(atual = '') {
  return `<option value="">Nenhuma</option>${pecasDoCronograma().map((p) => `<option value="${esc(p.id)}" ${p.id === atual ? 'selected' : ''}>${esc(rotuloItem(p).slice(0, 110))}</option>`).join('')}`;
}

// ── exportar ──
// 23/10 (Pedro): sempre a melhor qualidade (ver o topo)
export const ESCALA_EXPORTAR = 2;
export function abrirExportar(ed, { anexar = null } = {}) {
  const d = ed.doc;
  const temPeca = Boolean(d.pecaId);
  const n = d.paginas.length;
  // a página aberta usa os avisos do editor (com a tinta medida dos textos); as outras, pela caixa
  const alertas = d.paginas.flatMap((p, i) => (i === ed.idx ? ed.avisos : M.avisosDaPagina(d, p, { assetsPorId: ed.assetsPorId })).filter((a) => a.nivel === 'alerta').map((a) => ({ ...a, pagina: i + 1 })));
  const medida = `${d.largura * ESCALA_EXPORTAR} × ${d.altura * ESCALA_EXPORTAR} px`;
  const p = abrirPainel(`
    <div class="painel-topo"><div><h2>Exportar</h2><p>${esc(d.titulo)} · ${esc(formatoNome(d))} · ${n} página${n > 1 ? 's' : ''}</p></div>${BTN_FECHAR}</div>
    <form class="painel-corpo est-form" id="est-form-exportar">
      ${alertas.length ? `<div class="aviso">${ic('alerta', 16)}<div><strong>${alertas.length} aviso${alertas.length > 1 ? 's' : ''} das regras do Pedro antes de exportar</strong><ul class="est-lista-avisos">${alertas.slice(0, 6).map((a) => `<li>Página ${a.pagina}: ${esc(a.texto)}</li>`).join('')}${alertas.length > 6 ? `<li>e mais ${alertas.length - 6}</li>` : ''}</ul></div></div>` : ''}
      <fieldset class="est-opcoes"><legend>Formato</legend>
        <label class="est-opcao"><input type="radio" name="formato" value="png" checked><span><b>PNG</b><small>${medida}, sem perda</small></span></label>
        <label class="est-opcao"><input type="radio" name="formato" value="pdf"><span><b>PDF</b><small>As páginas marcadas num arquivo só, sem perda</small></span></label>
      </fieldset>
      ${n > 1 ? `
      <fieldset class="est-opcoes est-exp-paginas"><legend>Páginas</legend>
        <div class="est-exp-marcas">${d.paginas.map((_, i) => `
          <label class="est-exp-marca"><input type="checkbox" name="pag" value="${i}" ${i === ed.idx ? 'checked' : ''} aria-label="Página ${i + 1}"><span class="est-exp-mini" data-mini="${i}"></span><span class="est-exp-num">${i + 1}</span></label>`).join('')}</div>
        <div class="est-botoes"><button type="button" class="btn btn-sm" data-pag-todas>Marcar todas</button><button type="button" class="btn btn-sm" data-pag-nenhuma>Desmarcar</button></div>
      </fieldset>` : ''}
      <label class="est-alterna est-anexar"><input type="checkbox" name="anexar" ${temPeca && anexar !== false ? 'checked' : ''} ${temPeca ? '' : 'disabled'}>
        <span>${temPeca ? `Anexar na peça vinculada: <b>${esc(rotuloPecaCurto(d.pecaId))}</b>` : 'Anexar na peça: vincule o design a uma peça do cronograma primeiro'}</span></label>
      ${temPeca ? '' : `<button type="button" class="btn btn-sm" data-ir-vincular>${ic('link', 14)}Vincular peça</button>`}
      <div class="est-progresso" role="status" aria-live="polite" hidden></div>
      <p class="est-form-erro" role="alert" hidden></p>
    </form>
    <div class="painel-rodape"><span class="espaco"></span><button type="button" class="btn" data-fechar>Fechar</button><button type="submit" form="est-form-exportar" class="btn btn-primario">${ic('baixar', 15)}Baixar</button></div>`);
  const form = p.querySelector('#est-form-exportar');
  const prog = p.querySelector('.est-progresso');
  const erro = p.querySelector('.est-form-erro');
  const botao = p.querySelector('[type="submit"]');
  // as miniaturas das páginas (o mesmo render do editor)
  p.querySelectorAll('[data-mini]').forEach((s) => {
    try { s.replaceChildren(miniaturaEl(d, d.paginas[Number(s.dataset.mini)], 72)); } catch { /* fica o número */ }
  });
  const marcar = (v) => form.querySelectorAll('[name="pag"]').forEach((x) => { x.checked = v; });
  p.querySelector('[data-pag-todas]')?.addEventListener('click', () => marcar(true));
  p.querySelector('[data-pag-nenhuma]')?.addEventListener('click', () => marcar(false));
  p.querySelector('[data-ir-vincular]')?.addEventListener('click', () => abrirVincular(ed, { depois: () => abrirExportar(ed) }));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formato = form.formato.value === 'pdf' ? 'pdf' : 'png';
    const escala = ESCALA_EXPORTAR;
    const marcadas = n > 1 ? [...form.querySelectorAll('[name="pag"]:checked')].map((x) => Number(x.value)) : [0];
    if (!marcadas.length) {
      erro.hidden = false;
      erro.textContent = 'Marque pelo menos uma página.';
      return;
    }
    const todas = marcadas.length > 1;
    const anexarAgora = form.anexar.checked && Boolean(ed.doc.pecaId);
    botao.disabled = true;
    erro.hidden = true;
    prog.hidden = false;
    const linhas = [];
    let naoAnexou = false;
    const passo = (t, estado = 'feito') => { linhas.push({ t, estado }); prog.innerHTML = `<ul>${linhas.map((l) => `<li data-estado="${l.estado}">${ic(l.estado === 'feito' ? 'check' : 'relogio', 14)}${esc(l.t)}</li>`).join('')}</ul>`; };
    const trocarUltimo = (t, estado = 'feito') => { linhas.pop(); passo(t, estado); };
    try {
      ed.sairDoTexto?.();
      if (anexarAgora) { passo('Salvando o design', 'andando'); await ed.salvarJa(); trocarUltimo('Design salvo'); }
      const doc = ed.doc;
      if (formato === 'pdf') {
        passo(`Montando o PDF (0 de ${marcadas.length})`, 'andando');
        const blob = await exportarPdf(doc, { escala, semPerda: true, paginas: marcadas.map((i) => doc.paginas[i]), aoProgresso: (i, total) => trocarUltimo(`Montando o PDF (${i} de ${total})`, 'andando') });
        const nome = nomeExportacao(doc, { formato: 'pdf', escala });
        baixar(blob, nome);
        trocarUltimo(`${nome} baixado (${tamanho(blob.size)})`);
        if (anexarAgora) {
          passo('Anexando na peça', 'andando');
          const r = await A.enviarExportacao(ed.id, blob, { pagina: 'todas', formato: 'pdf' });
          if (r?.anexo && r.anexo.anexada === false) { trocarUltimo(r.anexo.aviso || 'O PDF não foi anexado', 'erro'); naoAnexou = true; }
          else trocarUltimo('PDF anexado na peça');
        }
      } else {
        // 22/10 (achado da revisão): mais de uma página sai num .zip só (um download). Um arquivo por página fazia o Chrome segurar do
        // 2º em diante e o progresso dizia "baixado" pra página que não chegou. Baixa antes de anexar: anexo que falha
        // não leva o download junto
        const indices = marcadas;
        const prontas = [];
        for (const i of indices) {
          passo(`Página ${i + 1}: desenhando`, 'andando');
          const blob = await exportarImagem(doc, doc.paginas[i], { formato, escala });
          const nome = nomeExportacao(doc, { formato, escala, pagina: doc.paginas.length > 1 ? i + 1 : null });
          prontas.push({ i, blob, nome });
          trocarUltimo(`${nome} pronto (${tamanho(blob.size)})`);
        }
        if (todas) {
          passo('Montando o .zip', 'andando');
          const zip = await zipDasPaginas(prontas);
          const nome = nomeExportacao(doc, { formato: 'zip', escala });
          baixar(zip, nome);
          trocarUltimo(`${nome} baixado (${tamanho(zip.size)}, ${prontas.length} páginas)`);
        } else {
          baixar(prontas[0].blob, prontas[0].nome);
          trocarUltimo(`${prontas[0].nome} baixado (${tamanho(prontas[0].blob.size)})`);
        }
        for (const { i, blob } of anexarAgora ? prontas : []) {
          passo(`Página ${i + 1}: anexando na peça`, 'andando');
          const r = await A.enviarExportacao(ed.id, blob, { pagina: i + 1, formato });
          if (r?.anexo && r.anexo.anexada === false) { trocarUltimo(r.anexo.aviso || `A página ${i + 1} não foi anexada`, 'erro'); naoAnexou = true; }
          else trocarUltimo(`Página ${i + 1} anexada na peça${r?.anexo?.aprovacao ? ' (a aprovação técnica vê a arte nova)' : ''}`);
        }
      }
      if (anexarAgora) { recarregar().catch(() => {}); toast(naoAnexou ? 'Baixado, mas a peça não recebeu a arte' : 'Arte anexada na peça'); }
      botao.disabled = false;
      botao.innerHTML = `${ic('baixar', 15)}Baixar de novo`;
    } catch (err) {
      if (linhas.length && linhas.at(-1).estado === 'andando') trocarUltimo(linhas.at(-1).t, 'erro');
      erro.hidden = false;
      erro.textContent = err.message || 'Não exportou';
      botao.disabled = false;
    }
  });
}
function tamanho(b) {
  return b > 1024 * 1024 ? `${(b / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
}
function rotuloPecaCurto(id) {
  const p = pecasDoCronograma().find((x) => x.id === id);
  return p ? rotuloItem(p).slice(0, 80) : 'peça que não está mais no cronograma';
}

// exportação sem painel (prévia do celular): sempre 2x
export async function exportarRapido(ed, tipo, i = 0) {
  const doc = ed.doc;
  if (tipo === 'pdf') {
    toast('Montando o PDF');
    // no celular o PDF vai em JPEG de alta qualidade: o sem perda pede uns 25 MB de memória por página em 2x
    const blob = await exportarPdf(doc, { escala: 2, semPerda: false });
    baixar(blob, nomeExportacao(doc, { formato: 'pdf', escala: 2 }));
    return;
  }
  // 22/10 (achado da revisão): "PNG de cada página" também sai num .zip só (um download)
  const indices = tipo === 'png-todas' ? doc.paginas.map((_, k) => k) : [i];
  if (indices.length > 1) toast('Montando o .zip');
  const prontas = [];
  for (const k of indices) {
    const blob = await exportarImagem(doc, doc.paginas[k], { formato: 'png', escala: 2 });
    prontas.push({ blob, nome: nomeExportacao(doc, { formato: 'png', escala: 2, pagina: doc.paginas.length > 1 ? k + 1 : null }) });
  }
  if (prontas.length > 1) baixar(await zipDasPaginas(prontas), nomeExportacao(doc, { formato: 'zip', escala: 2 }));
  else baixar(prontas[0].blob, prontas[0].nome);
}

// 23/10 (Pedro): "o Ateliê tem que me dar permissão para selecionar quais as imagens que eu quero para exportar". Os
// designs marcados na lista (lista.js) saem num .zip só, cada página em PNG sem perda no tamanho máximo, com o nome do
// design (nome repetido ganha -2, -3); uma imagem só baixa direto. Começa ao abrir; "Baixar de novo" refaz
function nomeUnico(nome, usados) {
  const n = (usados.get(nome) ?? 0) + 1;
  usados.set(nome, n);
  return n === 1 ? nome : nome.replace(/(\.[a-z0-9]+)$/i, `-${n}$1`);
}
export function abrirExportarVarios(resumos) {
  const n = resumos.length;
  const p = abrirPainel(`
    <div class="painel-topo"><div><h2>Exportar ${n} design${n > 1 ? 's' : ''}</h2><p>PNG sem perda, tamanho máximo</p></div>${BTN_FECHAR}</div>
    <div class="painel-corpo est-form">
      <ul class="est-exp-lista">${resumos.map((d) => `<li>${esc(d.titulo ?? 'Design sem título')}</li>`).join('')}</ul>
      <div class="est-progresso" role="status" aria-live="polite" hidden></div>
      <p class="est-form-erro" role="alert" hidden></p>
    </div>
    <div class="painel-rodape"><span class="espaco"></span><button type="button" class="btn" data-fechar>Fechar</button><button type="button" class="btn btn-primario" data-exp-baixar>${ic('baixar', 15)}Baixar</button></div>`);
  if (!p) return;
  const prog = p.querySelector('.est-progresso');
  const erro = p.querySelector('.est-form-erro');
  const botao = p.querySelector('[data-exp-baixar]');
  async function rodar() {
    botao.disabled = true;
    erro.hidden = true;
    prog.hidden = false;
    const linhas = [];
    const passo = (t, estado = 'feito') => { linhas.push({ t, estado }); prog.innerHTML = `<ul>${linhas.map((l) => `<li data-estado="${l.estado}">${ic(l.estado === 'feito' ? 'check' : 'relogio', 14)}${esc(l.t)}</li>`).join('')}</ul>`; };
    const trocarUltimo = (t, estado = 'feito') => { linhas.pop(); passo(t, estado); };
    try {
      const prontas = [];
      const usados = new Map();
      for (const r of resumos) {
        const titulo = r.titulo ?? 'Design sem título';
        passo(`${titulo}: desenhando`, 'andando');
        const d = M.normalizarDoc(await A.lerDoc(r.id));
        for (let i = 0; i < d.paginas.length; i++) {
          if (d.paginas.length > 1) trocarUltimo(`${titulo}: desenhando a página ${i + 1} de ${d.paginas.length}`, 'andando');
          const blob = await exportarImagem(d, d.paginas[i], { formato: 'png', escala: ESCALA_EXPORTAR });
          prontas.push({ blob, nome: nomeUnico(nomeExportacao(d, { formato: 'png', escala: ESCALA_EXPORTAR, pagina: d.paginas.length > 1 ? i + 1 : null }), usados) });
        }
        trocarUltimo(`${titulo} pronto`);
      }
      if (prontas.length === 1) {
        baixar(prontas[0].blob, prontas[0].nome);
        passo(`${prontas[0].nome} baixado (${tamanho(prontas[0].blob.size)})`);
      } else {
        passo('Montando o .zip', 'andando');
        const zip = await zipDasPaginas(prontas);
        const nome = `atelie-${hojeBrasilia()}-${prontas.length}-imagens@${ESCALA_EXPORTAR}x.zip`;
        baixar(zip, nome);
        trocarUltimo(`${nome} baixado (${tamanho(zip.size)}, ${prontas.length} imagens)`);
      }
      botao.innerHTML = `${ic('baixar', 15)}Baixar de novo`;
    } catch (err) {
      if (linhas.length && linhas.at(-1).estado === 'andando') trocarUltimo(linhas.at(-1).t, 'erro');
      erro.hidden = false;
      erro.textContent = err.message || 'Não exportou';
    } finally {
      botao.disabled = false;
    }
  }
  botao.addEventListener('click', rodar);
  rodar();
}

// ── modelos ──
// 22/10 (Pedro): "Novo a partir de um modelo", com miniatura. Os modelos de layout ficam no repo
// (estudio/base/modelos/*.json, com a nossa marca e os assets da base) e chegam por GET /api/estudio/modelos. Serve pra
// criar um design novo (lista.js) e pra pôr as páginas de um modelo num design aberto (editor.js e painel-dir.js).
// A lista vem uma vez por sessão (o modelo muda só com deploy)
let modelosCache = null;
const TIPO_MODELO = { capa: 'Capa', conteudo: 'Conteúdo', lista: 'Lista', cta: 'CTA final', carrossel: 'Carrossel', dica: 'Dica', mito: 'Mito', numero: 'Número', bastidor: 'Bastidor', oferta: 'Oferta', caixinha: 'Caixinha' };
// 22/10 (Pedro): sem dica de explicação embaixo do título (o título e os botões bastam); quem chama ainda pode passar uma
export function abrirModelos({ formato = '', aoEscolher, titulo = 'Novo a partir de um modelo', dica = '' } = {}) {
  const grupoDe = (m) => (m.formato === 'stories' || (Number(m.altura) / Number(m.largura) >= 1.7) ? 'stories' : 'feed');
  const est = { filtro: formato === 'stories' ? 'stories' : formato ? 'feed' : '' };
  const p = abrirPainel(`
    <div class="painel-topo"><div><h2>${esc(titulo)}</h2>${dica ? `<p>${esc(dica)}</p>` : ''}</div>${BTN_FECHAR}</div>
    <div class="painel-corpo est-form">
      <div class="segmentado" role="group" aria-label="Filtrar os modelos por formato">
        <button type="button" data-filtro-modelo="" aria-pressed="${!est.filtro}">Todos</button>
        <button type="button" data-filtro-modelo="feed" aria-pressed="${est.filtro === 'feed'}">Feed 4:5</button>
        <button type="button" data-filtro-modelo="stories" aria-pressed="${est.filtro === 'stories'}">Stories</button>
      </div>
      <div class="est-modelos-corpo" aria-live="polite"><div class="est-carregando est-carregando-curto"><span class="est-girando" aria-hidden="true"></span><span role="status">Carregando os modelos</span></div></div>
    </div>`, { largo: true });
  // 22/10 (achado da revisão): o #painel é o mesmo elemento a cada abertura (o abrirPainel só troca o conteúdo). O
  // ouvinte pendurado nele somava um por abertura, e o modelo escolhido ia pro design da primeira abertura da sessão
  // (até pra um design já fechado). Agora o ouvinte fica no corpo deste diálogo e some com ele
  const raiz = p.querySelector('.painel-corpo');
  const corpo = raiz.querySelector('.est-modelos-corpo');
  let lista = [];
  const desenhar = () => {
    const vis = lista.filter((m) => !est.filtro || grupoDe(m) === est.filtro);
    if (!vis.length) { corpo.innerHTML = '<p class="est-dica">Nenhum modelo nesse formato.</p>'; return; }
    corpo.innerHTML = `<ul class="est-modelos">${vis.map((m) => {
      const i = lista.indexOf(m);
      const n = m.paginas?.length ?? 0;
      return `
      <li><button type="button" class="est-modelo" data-modelo="${i}" aria-label="Usar o modelo ${esc(m.nome ?? m.titulo ?? '')}">
        <span class="est-modelo-mini" style="aspect-ratio:${m.largura} / ${m.altura}"></span>
        <span class="est-modelo-info"><b>${esc(m.nome ?? m.titulo ?? 'Modelo')}</b><small>${esc([TIPO_MODELO[m.tipo] ?? '', M.formatoInfo(m.formato).nome, n > 1 ? `${n} páginas` : ''].filter(Boolean).join(' · '))}</small>${m.descricao ? `<small class="est-modelo-desc">${esc(m.descricao)}</small>` : ''}</span>
      </button></li>`;
    }).join('')}</ul>`;
    for (const b of corpo.querySelectorAll('[data-modelo]')) {
      const m = lista[Number(b.dataset.modelo)];
      const caixa = b.querySelector('.est-modelo-mini');
      const largura = Math.max(120, caixa.clientWidth || 180);
      try {
        const n = M.normalizarDoc(m);
        caixa.append(miniaturaEl(n, n.paginas[0], largura));
      } catch { /* modelo sem página: fica a caixa vazia */ }
    }
  };
  raiz.addEventListener('click', async (e) => {
    const t = e.target instanceof Element ? e.target : null;
    const f = t?.closest('[data-filtro-modelo]');
    if (f) {
      est.filtro = f.dataset.filtroModelo;
      raiz.querySelectorAll('[data-filtro-modelo]').forEach((x) => x.setAttribute('aria-pressed', String(x === f)));
      desenhar();
      return;
    }
    const b = t?.closest('[data-modelo]');
    if (!b || b.disabled) return;
    const m = lista[Number(b.dataset.modelo)];
    if (!m) return;
    b.disabled = true;
    try {
      await aoEscolher?.(m);
      // fecha só se o painel ainda é este diálogo (a escolha pode ter aberto outro)
      if (raiz.isConnected) fecharPainel();
    } catch (err) {
      b.disabled = false;
      toast(err.message || 'Não deu pra usar o modelo');
    }
  });
  (async () => {
    try {
      // na ordem do uso (capa, conteúdo, lista, CTA, carrossel inteiro e os estáticos), não na do nome do arquivo
      const ordem = Object.keys(TIPO_MODELO);
      const pos = (m) => (ordem.includes(m.tipo) ? ordem.indexOf(m.tipo) : ordem.length);
      modelosCache ??= A.listarModelos()
        .then((l) => l.filter((m) => m && Array.isArray(m.paginas) && m.paginas.length).sort((a, b) => pos(a) - pos(b) || String(a.nome ?? '').localeCompare(String(b.nome ?? ''))))
        .catch((e) => { modelosCache = null; throw e; });
      await carregarFontes().catch(() => {});
      lista = await modelosCache;
      if (!raiz.isConnected) return;
      if (!lista.length) { corpo.innerHTML = '<p class="est-dica">Ainda não tem modelo no servidor (estudio/base/modelos).</p>'; return; }
      desenhar();
    } catch (e) {
      corpo.innerHTML = `<p class="aviso">${ic('alerta', 15)}<span>${esc(e.status === 404 ? 'Os modelos ainda não chegaram neste servidor (a rota /api/estudio/modelos). Reinicie com a versão nova.' : e.message)}</span></p>`;
    }
  })();
  return p;
}

// ── versões ──
export async function abrirVersoes(ed) {
  const p = abrirPainel(`
    <div class="painel-topo"><div><h2>Versões</h2><p>O servidor guarda as 20 últimas. Restaurar vira uma versão nova (a de agora continua na lista).</p></div>${BTN_FECHAR}</div>
    <div class="painel-corpo"><p class="est-dica">Carregando…</p></div>`);
  const corpo = p.querySelector('.painel-corpo');
  try {
    await ed.salvarJa().catch(() => {});
    const lista = await A.listarVersoes(ed.id);
    if (!lista.length) { corpo.innerHTML = '<p class="est-dica">Ainda não tem versão guardada. Cada gravação guarda uma.</p>'; return; }
    const ordenada = [...lista].sort((a, b) => numeroVersao(b) - numeroVersao(a));
    corpo.innerHTML = `<ol class="est-versoes">${ordenada.map((v) => {
      const nv = numeroVersao(v);
      const atual = v.atual === true || nv === ed.doc.versao;
      const quando = v.em ?? v.atualizadoEm ?? v.criadoEm ?? '';
      const nPag = Array.isArray(v.paginas) ? v.paginas.length : Number(v.paginas) || 0;
      return `<li${atual ? ' class="atual"' : ''}>
        <div><strong>Versão ${nv}${atual ? ' · a de agora' : ''}</strong>
        <small>${quando ? esc(new Date(quando).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })) : ''}${v.por ?? v.atualizadoPor ? ` · ${esc(v.por ?? v.atualizadoPor)}` : ''}${nPag ? ` · ${nPag} página${nPag > 1 ? 's' : ''}` : ''}${v.nota ? ` · ${esc(v.nota)}` : ''}</small>${v.titulo && v.titulo !== ed.doc.titulo ? `<small>${esc(v.titulo)}</small>` : ''}</div>
        ${atual ? '' : `<button type="button" class="btn btn-sm" data-restaurar="${nv}">${ic('restaurar', 14)}Restaurar</button>`}
      </li>`;
    }).join('')}</ol>`;
    corpo.addEventListener('click', async (e) => {
      const b = e.target instanceof Element ? e.target.closest('[data-restaurar]') : null;
      if (!b) return;
      if (!window.confirm(`Restaurar a versão ${b.dataset.restaurar}? A de agora fica guardada nas versões.`)) return;
      b.disabled = true;
      try {
        await ed.salvarJa();
        let d = await A.restaurarVersao(ed.id, b.dataset.restaurar, ed.doc.versao);
        if (!d?.paginas) d = await A.lerDoc(ed.id);
        ed.carregarNovaVersao(d);
        // 22/10 (achado da revisão): depois da espera, fecha só se o painel ainda é este (o #painel é o mesmo pra todos)
        if (corpo.isConnected) fecharPainel();
        toast(`Versão ${b.dataset.restaurar} restaurada`);
      } catch (err) {
        b.disabled = false;
        toast(err.message);
      }
    });
  } catch (e) {
    corpo.innerHTML = `<p class="aviso">${ic('alerta', 15)}<span>${esc(e.message)}</span></p>`;
  }
}
const numeroVersao = (v) => Number(v?.n ?? v?.versao ?? v?.numero ?? 0);

// ── vincular peça ──
export function abrirVincular(ed, { depois = null } = {}) {
  const atual = ed.doc.pecaId ?? '';
  const lista = pecasDoCronograma();
  const p = abrirPainel(`
    <div class="painel-topo"><div><h2>Vincular a uma peça</h2></div>${BTN_FECHAR}</div>
    <div class="painel-corpo est-form">
      <label class="est-busca-caixa">${ic('busca', 15)}<input type="search" class="campo" data-busca-peca placeholder="Buscar peça (tema, data, tipo)" aria-label="Buscar peça"></label>
      <ul class="est-pecas" role="listbox" aria-label="Peças do cronograma">${lista.map((x) => `
        <li><button type="button" role="option" data-peca="${esc(x.id)}" aria-selected="${x.id === atual}" data-texto="${esc(rotuloItem(x).toLowerCase())}">
          <span>${esc(x.data ? fmtData(x.data, { diaSemana: true }) : 'sem data')} · ${esc(x.rotulo)}</span><b>${esc(x.titulo || 'sem título')}</b>
        </button></li>`).join('')}</ul>
      ${!lista.length ? '<p class="est-dica">O cronograma ainda não tem peça.</p>' : ''}
    </div>
    <div class="painel-rodape">${atual ? `<button type="button" class="btn btn-perigo" data-desvincular>${ic('fechar', 15)}Desvincular</button><button type="button" class="btn" data-remontar>${ic('restaurar', 15)}Remontar com o texto da peça</button>` : ''}<span class="espaco"></span><button type="button" class="btn" data-fechar>Fechar</button></div>`);
  // 22/10 (achado da revisão): os ouvintes ficam nos nós deste diálogo, não no #painel (o mesmo elemento a cada abertura).
  // Lá eles se somavam: vincular o design B trocava também a peça do A, já fechado, e o "depois" rodava uma vez por abertura
  const corpo = p.querySelector('.painel-corpo');
  const escolher = (pecaId) => {
    ed.vincular(pecaId);
    if (pecaId) trazerEstrategia(ed, pecaId);
    fecharPainel();
    toast(pecaId ? 'Design vinculado à peça' : 'Design desvinculado');
    depois?.();
  };
  corpo.querySelector('[data-busca-peca]').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    for (const b of corpo.querySelectorAll('[data-peca]')) b.parentElement.hidden = Boolean(q) && !b.dataset.texto.includes(q);
  });
  corpo.addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest('[data-peca]') : null;
    if (b) escolher(b.dataset.peca);
  });
  p.querySelector('[data-desvincular]')?.addEventListener('click', () => escolher(null));
  // 23/10 (Pedro: "os carrosséis estão vindo extremamente genéricos"): o design que já existe troca as páginas pelas
  // montadas de novo com o texto da peça (o carrossel no visual da skill). Vira uma versão nova: a de agora fica em Versões
  const remontar = p.querySelector('[data-remontar]');
  remontar?.addEventListener('click', async () => {
    if (!window.confirm('Trocar as páginas deste design pelas montadas de novo com o texto da peça? A versão de agora fica guardada em Versões.')) return;
    remontar.disabled = true;
    try {
      await ed.salvarJa();
      let d = await A.remontarDaPeca(ed.id, ed.doc.versao);
      if (!d?.paginas) d = await A.lerDoc(ed.id);
      ed.carregarNovaVersao(d);
      if (corpo.isConnected) fecharPainel();
      toast('Montado de novo com o texto da peça');
    } catch (err) {
      remontar.disabled = false;
      toast(err.message);
    }
  });
}

// 22/10 (Pedro): vincular o design a uma peça traz a estratégia dela (pilar e bloco; os gatilhos quando a observação da
// peça cita um da lista da estratégia principal, a mesma do server/atelie.mjs). O que já estava preenchido no design fica
const GATILHOS_EMO = ['cansaço da burocracia', 'medo de errar com o fisco', 'alívio da conquista', 'vergonha do contabilês', 'pressa de prazo travado', 'orgulho de virar empresa', 'declaração anual do MEI', 'imposto de renda', 'virada de ano', 'dia do microempreendedor', 'PLP 108/2021'];
const GATILHOS_PSI = ['curiosidade', 'identificação', 'prova social', 'reciprocidade', 'ancoragem', 'novidade', 'escassez real'];
function trazerEstrategia(ed, pecaId) {
  const p = pecasDoCronograma().find((x) => x.id === pecaId)?.item;
  if (!p) return;
  const obs = String(p.gatilho ?? '').toLowerCase();
  const achou = (lista) => lista.find((g) => obs.includes(g.toLowerCase())) ?? '';
  ed.mudarDocMeta((d) => {
    const e = d.estrategia ?? { pilar: null, bloco: null, motivo: '', gatilhoEmocional: '', gatilhoPsicologico: '' };
    if (e.pilar == null && p.pilar != null && Number.isFinite(Number(p.pilar))) { e.pilar = Number(p.pilar); e.bloco = blocoDoPilar(p.pilar) ?? p.bloco ?? null; }
    if (!e.gatilhoEmocional) e.gatilhoEmocional = p.gatilhoEmocional || achou(GATILHOS_EMO);
    if (!e.gatilhoPsicologico) e.gatilhoPsicologico = p.gatilhoPsicologico || achou(GATILHOS_PSI);
    if (!e.motivo && p.motivo) e.motivo = String(p.motivo).slice(0, 600);
    d.estrategia = e;
  });
  // o painel da direita mostra a estratégia que veio
  ed.redesenhar?.({ props: true });
}

// ── gerar com IA ──
// os avisos da última geração (o editor mostra quando abre esse design)
let ultimaGeracao = null;
export function avisosDaGeracao(id, versao) {
  const g = ultimaGeracao;
  if (!g || g.id !== id || (versao != null && g.versao != null && g.versao !== versao)) return null;
  ultimaGeracao = null;
  return g.geracao;
}
// doc: com ele, o pedido vira uma versão nova desse design (docId); aoPronto(doc) recebe o resultado
// 23/10 (Pedro: "a skill não está sendo utilizada, ela deve ser ativa toda vez que eu for criar no Ateliê"): o "Criar
// no Ateliê" da peça roda a skill dela pela IA (POST /api/estudio/gerar { pecaId, skill: true }) e abre o design novo.
// A peça que já tem design pergunta antes: abrir o que existe ou criar de novo com a skill (o de antes fica na lista).
// Sem a chave do Claude no servidor, diz isso e oferece a montagem sem a skill, só se a pessoa escolher
// 26/10 (Pedro): a geração em segundo plano (POST /api/estudio/tarefas e o GET a cada 3 s até ficar pronta). Com a IA
// de conteúdo antes do design, a geração passa de minutos e não cabe numa resposta só (o túnel corta em 100 s); fechar
// o painel não para nada no servidor. Devolve o design pronto, com o resumo da geração
const ESPERA_TAREFA_MS = 3000;
async function gerarEmSegundoPlano(corpo) {
  let t = await A.iniciarTarefa(corpo);
  while (t?.estado === 'gerando') {
    await new Promise((ok) => { setTimeout(ok, ESPERA_TAREFA_MS); });
    t = await A.lerTarefa(t.id);
  }
  if (t?.estado !== 'pronto' || !t.docId) throw new Error(t?.erro || 'A geração não terminou. Tente de novo.');
  return { ...(await A.lerDoc(t.docId)), geracao: t.geracao ?? null };
}

export function criarArteDaPeca({ pecaId, existentes = [], aoAbrir }) {
  const ultimo = existentes[0] ?? null;
  const p = abrirPainel(`
    <div class="painel-topo"><div><h2>Criar no Ateliê</h2></div>${BTN_FECHAR}</div>
    <div class="painel-corpo est-form" data-arte-corpo>
      ${ultimo ? `<p class="est-dica">Essa peça já tem ${existentes.length === 1 ? 'um design' : `${existentes.length} designs`}${ultimo.atualizadoEm ? ` (o último, de ${esc(fmtData(String(ultimo.atualizadoEm).slice(0, 10)))})` : ''}. Criar de novo não apaga nenhum.</p>` : ''}
      <div class="est-espera" role="status" aria-live="polite" hidden></div>
      <div class="est-form-erro est-erro-ia" role="alert" hidden></div>
    </div>
    <div class="painel-rodape"><span class="espaco"></span>
      <button type="button" class="btn" data-arte="sem-ia" hidden>Montar sem a skill</button>
      ${ultimo ? '<button type="button" class="btn" data-arte="abrir">Abrir o design</button>' : ''}
      <button type="button" class="btn btn-primario" data-arte="skill">${ic('ia', 15)}${ultimo ? 'Criar de novo com a skill' : 'Criar com a skill'}</button>
    </div>`);
  const corpo = p.querySelector('[data-arte-corpo]');
  const espera = p.querySelector('.est-espera');
  const erro = p.querySelector('.est-erro-ia');
  const botoes = [...p.querySelectorAll('[data-arte]')];
  const travar = (sim) => botoes.forEach((b) => { b.disabled = sim; });
  const abrir = (id) => {
    if (corpo.isConnected) fecharPainel();
    aoAbrir(id);
  };
  async function comSkill() {
    travar(true);
    erro.hidden = true;
    espera.hidden = false;
    const inicio = Date.now();
    const pintar = () => {
      espera.innerHTML = `<span class="est-girando" aria-hidden="true"></span><div><strong>Escrevendo o conteúdo e rodando a skill</strong><p>Se a peça ainda não tem o texto completo, a IA de conteúdo escreve antes (estratégia, fatos e notícias), e a skill monta o design. Costuma levar de 3 a 7 minutos (${Math.round((Date.now() - inicio) / 1000)} s). Pode fechar este painel: segue no servidor.</p></div>`;
    };
    pintar();
    const relogio = setInterval(pintar, 1000);
    try {
      const novo = await gerarEmSegundoPlano({ pecaId, skill: true });
      if (!novo?.id) throw new Error('A IA respondeu sem o design. Tente de novo.');
      if (corpo.isConnected) {
        toast('Design da skill pronto');
        abrir(novo.id);
      } else toast('Design da skill pronto: está no Ateliê');
    } catch (e) {
      if (!corpo.isConnected) toast(`O design da skill não terminou: ${e.message || 'erro desconhecido'}`);
      espera.hidden = true;
      travar(false);
      erro.hidden = false;
      // "sem IA" só quando falta a chave (o MSG_SEM_IA do servidor); o resto, a mensagem do servidor como ela é
      const semIA = /chave do Claude|Falta ligar a IA/i.test(e.message || '');
      p.querySelector('[data-arte="sem-ia"]').hidden = !semIA;
      erro.innerHTML = semIA
        ? `${ic('alerta', 16)}<div><strong>A IA não está ligada neste servidor</strong><p>A skill roda pela IA do Claude, e a chave dela ainda não foi colada no servidor. Sem ela, só dá pra montar sem a skill, pelo modelo automático.</p></div>`
        : `${ic('alerta', 16)}<div><strong>A skill não terminou</strong><p>${esc(e.message || 'Erro desconhecido')}</p></div>`;
    } finally {
      clearInterval(relogio);
    }
  }
  p.querySelector('.painel-rodape').addEventListener('click', async (e) => {
    const b = e.target instanceof Element ? e.target.closest('[data-arte]') : null;
    if (!b || b.disabled) return;
    if (b.dataset.arte === 'abrir') abrir(ultimo.id);
    else if (b.dataset.arte === 'skill') comSkill();
    else if (b.dataset.arte === 'sem-ia') {
      travar(true);
      try {
        const d = await A.montarDaPeca(pecaId);
        toast('Design montado sem a skill');
        abrir(d.id);
      } catch (err) {
        travar(false);
        erro.hidden = false;
        erro.innerHTML = `${ic('alerta', 16)}<div><strong>Não montou</strong><p>${esc(err.message || 'Erro desconhecido')}</p></div>`;
      }
    }
  });
  if (!ultimo) comSkill();
}

// 26/10 (Pedro: "deixe um botão de regerar dentro do design da imagem também"): o Regerar do editor roda a skill de
// novo com a peça vinculada (como o "Criar no Ateliê") e grava o design inteiro como versão nova; a de agora fica em
// Versões. Vai pela geração em segundo plano (POST /api/estudio/tarefas): o painel acompanha, e fechar não para a skill
export function abrirRegerar({ doc, antes = null, aoPronto = null, aoOcupar = null }) {
  const pc = pecasDoCronograma().find((x) => x.id === doc.pecaId);
  const p = abrirPainel(`
    <div class="painel-topo"><div><h2>Regerar pela skill</h2></div>${BTN_FECHAR}</div>
    <div class="painel-corpo est-form">
      <p class="est-dica">O design inteiro sai de novo pela skill, lendo a peça ${pc ? `"${esc(rotuloItem(pc).slice(0, 110))}"` : 'vinculada'} do cronograma${pc && pc.paginas > 1 ? `, com ${pc.paginas} páginas` : ''}. Vira uma versão nova deste design: a de agora fica guardada em Versões.</p>
      <div class="est-espera" role="status" aria-live="polite" hidden></div>
      <div class="est-form-erro est-erro-ia" role="alert" hidden></div>
    </div>
    <div class="painel-rodape"><span class="espaco"></span><button type="button" class="btn" data-fechar>Cancelar</button><button type="button" class="btn btn-primario" data-regerar>${ic('restaurar', 15)}Regerar</button></div>`);
  const espera = p.querySelector('.est-espera');
  const erro = p.querySelector('.est-erro-ia');
  const botao = p.querySelector('[data-regerar]');
  botao.addEventListener('click', async () => {
    botao.disabled = true;
    erro.hidden = true;
    espera.hidden = false;
    const inicio = Date.now();
    const pintar = () => {
      espera.innerHTML = `<span class="est-girando" aria-hidden="true"></span><div><strong>Rodando a skill</strong><p>Se a peça ainda não tem o texto completo, a IA de conteúdo escreve antes (estratégia, fatos e notícias), e a skill monta o design. Costuma levar de 3 a 7 minutos (${Math.round((Date.now() - inicio) / 1000)} s). Pode fechar este painel: a skill segue no servidor e o design troca sozinho quando ficar pronto. Até lá, a edição fica travada.</p></div>`;
    };
    pintar();
    const relogio = setInterval(pintar, 1000);
    try {
      if (antes) await antes();
      aoOcupar?.(true);
      const novo = await gerarEmSegundoPlano({ pecaId: doc.pecaId, docId: doc.id, versao: doc.versao, skill: true });
      if (espera.isConnected) fecharPainel();
      aoPronto?.(novo);
    } catch (e) {
      espera.hidden = true;
      botao.disabled = false;
      erro.hidden = false;
      erro.innerHTML = `${ic('alerta', 16)}<div><strong>A skill não terminou</strong><p>${esc(e.message || 'Erro desconhecido')}</p></div>`;
      if (!espera.isConnected) toast(`O Regerar não terminou: ${e.message || 'erro desconhecido'}`);
    } finally {
      clearInterval(relogio);
      aoOcupar?.(false);
    }
  });
}

export function abrirGerarIA({ doc = null, aoPronto = null, pecaId = '', antes = null } = {}) {
  const formatoIni = doc?.formato && doc.formato !== 'personalizado' ? doc.formato : 'feed45';
  const pagIni = doc?.paginas?.length ?? 1;
  const p = abrirPainel(`
    <div class="painel-topo"><div><h2>${doc ? 'Versão nova com IA' : 'Gerar design com IA'}</h2></div>${BTN_FECHAR}</div>
    <form class="painel-corpo est-form" id="est-form-ia">
      <label class="rotulo">O que você quer
        <textarea class="campo" name="brief" rows="5" maxlength="2000" placeholder="Ex.: carrossel sobre o que acontece com o MEI que passa do limite, com o Léo na capa e fechando na lista de espera"></textarea>
      </label>
      <div class="est-grade2">
        <label class="rotulo">Formato
          <select class="campo" name="formato">${M.FORMATOS.filter((f) => f.id !== 'personalizado').map((f) => `<option value="${f.id}" ${f.id === formatoIni ? 'selected' : ''}>${esc(f.nome)} · ${esc(f.medida)}</option>`).join('')}</select>
        </label>
        <label class="rotulo">Páginas
          <input class="campo" type="number" name="paginas" min="1" max="20" value="${pagIni}" required>
        </label>
      </div>
      <label class="rotulo">Peça do cronograma (opcional)
        <select class="campo" name="pecaId">${opcoesPecas(doc?.pecaId ?? pecaId)}</select>
      </label>
      <p class="est-dica">Com uma peça escolhida, o formato e as páginas vêm dela e o pedido pode ficar em branco: a IA lê a peça do cronograma.</p>
      ${doc ? '<p class="est-dica">Vira uma versão nova deste design: a de agora fica guardada em Versões.</p>' : ''}
      <div class="est-espera" role="status" aria-live="polite" hidden></div>
      <div class="est-form-erro est-erro-ia" role="alert" hidden></div>
    </form>
    <div class="painel-rodape"><span class="espaco"></span><button type="button" class="btn" data-fechar>Cancelar</button><button type="submit" form="est-form-ia" class="btn btn-primario">${ic('ia', 15)}Gerar</button></div>`);
  const form = p.querySelector('#est-form-ia');
  const espera = p.querySelector('.est-espera');
  const erro = p.querySelector('.est-erro-ia');
  const botao = p.querySelector('[type="submit"]');
  // 22/10 (Pedro): escolheu a peça, o formato e as páginas vêm dela (dá pra mudar depois)
  const aoEscolherPeca = () => {
    const pc = pecasDoCronograma().find((x) => x.id === form.pecaId.value);
    if (!pc) return;
    form.formato.value = pc.formato;
    form.paginas.value = String(pc.paginas);
  };
  form.pecaId.addEventListener('change', aoEscolherPeca);
  if (!doc && form.pecaId.value) aoEscolherPeca();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const brief = form.brief.value.trim();
    if (!form.pecaId.value && brief.length < 8) { erro.hidden = false; erro.textContent = 'Conte um pouco mais do que você quer (o tema, pra quem, o que a peça faz) ou escolha a peça do cronograma.'; return; }
    const corpo = {
      brief,
      formato: form.formato.value,
      paginas: Math.max(1, Math.min(20, Number(form.paginas.value) || 1)),
      ...(form.pecaId.value ? { pecaId: form.pecaId.value } : {}),
      ...(doc?.id ? { docId: doc.id } : {}),
    };
    botao.disabled = true;
    form.querySelectorAll('textarea, select, input').forEach((x) => { x.disabled = true; });
    erro.hidden = true;
    espera.hidden = false;
    const inicio = Date.now();
    const pintar = () => {
      const s = Math.round((Date.now() - inicio) / 1000);
      espera.innerHTML = `<span class="est-girando" aria-hidden="true"></span><div><strong>Montando o design</strong><p>Lendo a estratégia, o que já saiu e o design system. Costuma levar de 1 a 3 minutos, às vezes mais (${s} s).</p></div>`;
    };
    pintar();
    const relogio = setInterval(pintar, 1000);
    try {
      if (antes) await antes();
      if (doc?.id) corpo.versao = doc.versao;
      const novo = await gerarEmSegundoPlano(corpo);
      ultimaGeracao = novo?.id ? { id: novo.id, versao: novo.versao, geracao: novo.geracao ?? null } : null;
      clearInterval(relogio);
      if (!novo?.id) throw new Error('A IA respondeu sem o design. Tente de novo.');
      // 22/10 (achado da revisão): a IA leva minutos; fecha só se o painel ainda é este (quem fechou e abriu outro fica nele)
      if (form.isConnected) fecharPainel();
      toast(doc ? 'Versão nova pronta' : 'Design pronto: abrindo');
      if (aoPronto) aoPronto(novo);
      else location.hash = `#/atelie?design=${encodeURIComponent(novo.id)}`;
    } catch (err) {
      clearInterval(relogio);
      espera.hidden = true;
      botao.disabled = false;
      form.querySelectorAll('textarea, select, input').forEach((x) => { x.disabled = false; });
      erro.hidden = false;
      // 22/10 (Pedro): "sem IA" só quando falta a chave (o MSG_SEM_IA do servidor); fila cheia, resposta ruim e demora
      // mostram a mensagem do servidor como ela é
      const semIA = /chave do Claude|Falta ligar a IA/i.test(err.message || '');
      erro.innerHTML = `${ic('alerta', 16)}<div><strong>${semIA ? 'A IA não está ligada neste servidor' : 'Não gerou'}</strong><p>${esc(err.message || 'Erro desconhecido')}</p>${semIA ? '<p>Enquanto isso, dá pra criar o design à mão em "Novo design".</p>' : ''}</div>`;
    }
  });
  form.brief.focus();
}

