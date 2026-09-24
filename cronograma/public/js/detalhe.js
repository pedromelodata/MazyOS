// Detalhe do reel (painel lateral). Porta da v1 + "Adaptado de X.Y", ideia de origem, o botão
// que manda um reel publicado que performou pra Biblioteca como case e (23/09) o reel inteiro
// estruturado: formato, tipo, hook, narração, CTA final, cenas, detalhes de gravação e fontes.
import {
  esc, fmtN, fmtRel, fmtData, STATUS, TIPOS, store, api, recarregar, toast, abrirPainel, fecharPainel,
  BTN_FECHAR, navegar, formato, campanha, ideia, reel, seloFormato, qa, icone, tipoReel, pillTipo, estilo, nomeTema,
} from './core.js';
import { abrirChat } from './chat.js';

const rotulo = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
const chaveCodigo = (c = '') => {
  const [a, b] = String(c).split('.');
  return [a === 'T' ? 999 : Number(a) || 998, Number(b) || 0];
};
const porCodigo = (x, y) => {
  const [a1, b1] = chaveCodigo(x.codigo), [a2, b2] = chaveCodigo(y.codigo);
  return a1 - a2 || b1 - b2;
};

function gruposFormato(formatos) {
  const grupos = new Map();
  for (const f of [...formatos].sort(porCodigo)) {
    const k = f.categoria || 'Outros';
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(f);
  }
  return [...grupos];
}

function avisoFormato(f) {
  if (!f) return '';
  if (f.status === 'validado' && f.via === 'dado')
    return `Validado pelo nosso dado: ${f.acima} reels acima de 1,5× a mediana da conta.`;
  if (f.status === 'validado' && f.via === 'biblioteca')
    return 'Formato validado. Depois de publicado, o desempenho deste reel vira case nosso.';
  if (f.status === 'validado') return 'Validado por benchmark externo com número e fonte.';
  return 'Formato em teste. O desempenho deste reel, depois de publicado, ajuda a validar ou descartar o formato.';
}

// campos de gravação na ordem da tela; lista = um item por linha no modo edição
const GRAV_TEXTO = [
  ['duracao', 'Duração', 'ex.: 30-35s'],
  ['quem', 'Quem aparece', 'ex.: Pedro, sozinho'],
  ['local', 'Local', 'ex.: mesa do escritório com parede lisa atrás'],
  ['enquadramento', 'Enquadramento', 'vertical 9:16, altura dos olhos, plano médio...'],
  ['luz', 'Luz', 'ex.: janela de frente, luz natural'],
  ['audio', 'Áudio', 'ex.: lapela, sala em silêncio'],
  ['figurino', 'Figurino', 'sem logo de outra marca'],
];
const GRAV_LISTA = [
  ['objetos', 'Objetos'],
  ['broll', 'B-roll (gravar separado)'],
  ['telasApp', 'Telas do app'],
];
const PALAVRAS_POR_SEGUNDO = 2.1;

const palavras = (s) => (String(s ?? '').trim().match(/\S+/g) ?? []).length;
const linhas = (v) => String(v ?? '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

// checklist é só visual: a marcação vive enquanto a aba está aberta, não vai pro banco
const marcados = new Set();

let painel = null;

// o mesmo post aparece como /reel/X, /reels/X, /p/X ou /usuario/reel/X (igual ao mesmoPost do servidor)
const codigoPost = (url) => {
  const m = String(url ?? '').match(/instagram\.com\/(?:[^/?#]+\/)?(?:reels?|p|tv)\/([^/?#]+)/i);
  return m ? m[1] : String(url ?? '').split(/[?#]/)[0].replace(/\/+$/, '');
};
const mesmoPost = (a, b) => Boolean(a && b) && codigoPost(a) === codigoPost(b);

// roteiro de gravação em texto puro, pro time colar no WhatsApp ou imprimir
function textoGravacao(r, f) {
  const ro = r.roteiro ?? {};
  const g = r.gravacao ?? {};
  const t = tipoReel(r.tipo);
  const bloco = (titulo, corpo) => (corpo && String(corpo).trim() ? [`${titulo}`, String(corpo).trim(), ''] : []);
  const itens = (arr, marca = '-') => (arr ?? []).filter(Boolean).map((x) => `${marca} ${x}`).join('\n');
  return [
    `REEL: ${r.ideia}`,
    [r.data ? fmtData(r.data, { ano: true, diaSemana: true }) : 'sem data', t?.nome ?? 'sem tipo', f ? `Formato ${f.codigo} · ${f.nome}` : 'Formato livre'].join(' · '),
    '',
    ...bloco(`HOOK${ro.cenas?.[0]?.tempo ? ` (${ro.cenas[0].tempo})` : ''}`, ro.hook ? `"${ro.hook}"${ro.textoTela ? `\nTexto de tela: ${ro.textoTela}` : ''}` : ''),
    ...bloco('NARRAÇÃO DO DESENVOLVIMENTO', ro.desenvolvimento),
    ...bloco('CTA FINAL', ro.cta ? `"${ro.cta}"` : ''),
    ...bloco('CENA A CENA', (ro.cenas ?? []).map((c) => `${c.tempo} | ${c.cena}\n  Fala: "${c.fala}"${c.tela ? `\n  Tela: ${c.tela}` : ''}`).join('\n')),
    ...bloco('GRAVAÇÃO', [
      ...GRAV_TEXTO.filter(([k]) => g[k]).map(([k, nome]) => `${nome}: ${g[k]}`),
      ...GRAV_LISTA.filter(([k]) => g[k]?.length).map(([k, nome]) => `${nome}:\n${itens(g[k])}`),
      g.edicao ? `Edição: ${g.edicao}` : '',
    ].filter(Boolean).join('\n')),
    ...bloco('CHECKLIST ANTES DE GRAVAR', itens(g.checklist, '[ ]')),
    ...bloco('FONTES', itens(r.fontes)),
  ].join('\n').trim();
}

// reabre o mesmo reel sem perder a rolagem (toda edição recarrega o estado). No modo edição,
// `rascunho` devolve aos campos o texto ainda não salvo
function reabrir(id, editando = false, rascunho = null) {
  const topo = painel?.querySelector('.painel-corpo')?.scrollTop ?? 0;
  abrirDetalhe(id, editando);
  if (rascunho && painel) {
    for (const [k, val] of Object.entries(rascunho)) {
      const t = painel.querySelector(`[data-edit="${k}"]`);
      if (t) t.value = val;
    }
    painel.querySelector('[data-edit="legenda"]')?.dispatchEvent(new Event('input'));
  }
  const corpo = painel?.querySelector('.painel-corpo');
  if (corpo) corpo.scrollTop = topo;
}

export function abrirDetalhe(reelId, editando = false) {
  const E = store.E;
  if (!E) return;
  let r = reel(reelId); // let: a data salva no lugar atualiza o reel sem redesenhar o painel
  if (!r) { toast('Esse reel não existe mais'); return; }
  const ro = r.roteiro ?? {};
  const g = r.gravacao ?? {};
  const fontes = (r.fontes ?? []).filter(Boolean);
  const f = formato(r.formatoId);
  const c = campanha(r.campanhaId);
  const ide = r.ideiaId ? ideia(r.ideiaId) : null;
  const itensQa = qa(r);
  const leg = (r.legenda ?? '').length;
  const limiar = E.regraValidacao?.limiarRelativo ?? 1.5;
  const m = r.metricas;
  const caseDoReel = (E.cases ?? []).find((x) => x.reelId === r.id || mesmoPost(x.permalink, r.permalink));
  const podeVirarCase = r.status === 'publicado' && m?.relativo != null && Number(m.relativo) >= limiar;
  const campoTexto = (nome, valor, linhas = 3, dica = '') =>
    `<textarea class="campo" data-edit="${nome}" rows="${linhas}" placeholder="${esc(dica)}">${esc(valor)}</textarea>`;
  const campoLinha = (nome, valor, dica = '') => `<input class="campo" data-edit="${nome}" value="${esc(valor)}" placeholder="${esc(dica)}" />`;
  const vazio = (txt = '-') => `<span class="dt-vazio">${esc(txt)}</span>`;
  const nPalavras = palavras(ro.desenvolvimento);
  const nTotal = palavras(ro.hook) + nPalavras + palavras(ro.cta);
  const temGravacao = [...GRAV_TEXTO.map(([k]) => g[k]), g.edicao].some((x) => String(x ?? '').trim())
    || [...GRAV_LISTA.map(([k]) => g[k]), g.checklist].some((x) => x?.length);

  const opcoesFormato = gruposFormato(E.formatos).map(([cat, fs]) => `
    <optgroup label="${esc(cat)}">
      ${fs.map((x) => `<option value="${x.id}" ${r.formatoId === x.id ? 'selected' : ''}>${esc(x.codigo)} · ${esc(x.nome)}${x.status === 'validado' ? ' ✓' : ' (em teste)'}</option>`).join('')}
    </optgroup>`).join('');

  const blocoCase = () => {
    if (caseDoReel) {
      const fc = formato(caseDoReel.formatoId);
      return `<div class="dt-aviso dt-aviso-ok">${icone('estrela', 16)}<span>Este reel já está na Biblioteca como case${fc ? ` do formato <strong>${esc(fc.codigo)}</strong>` : ''}.</span>${fc ? `<a class="btn btn-sm" href="#/biblioteca/${fc.id}" data-ir="#/biblioteca/${fc.id}">Ver na biblioteca</a>` : ''}</div>`;
    }
    if (!podeVirarCase) return '';
    return `
      <div class="dt-case">
        <div>
          <strong>Rendeu ${fmtRel(m.relativo)} a mediana da conta.</strong>
          <span>${f ? `Vira case do formato ${esc(f.codigo)} e conta pra validar pelo nosso dado.` : 'Escolha o formato no campo acima antes de mandar.'}</span>
        </div>
        <button class="btn btn-primario btn-sm" id="dt-case" ${f ? '' : 'disabled'}>${icone('livro', 16)} Mandar pra biblioteca como case</button>
      </div>`;
  };

  // detalhes de gravação: grade limpa na leitura, campos no modo edição
  const blocoGravacao = () => {
    if (editando) {
      return `
        <div class="dt-grav-edicao">
          ${GRAV_TEXTO.map(([k, nome, dica]) => `<label class="rotulo">${esc(nome)}${campoLinha(`g.${k}`, g[k] ?? '', dica)}</label>`).join('')}
          ${GRAV_LISTA.map(([k, nome]) => `<label class="rotulo">${esc(nome)} <small>um por linha</small>${campoTexto(`g.${k}`, (g[k] ?? []).join('\n'), 4)}</label>`).join('')}
          <label class="rotulo">Checklist antes de gravar <small>um por linha</small>${campoTexto('g.checklist', (g.checklist ?? []).join('\n'), 4)}</label>
          <label class="rotulo dt-grav-largo">Edição${campoTexto('g.edicao', g.edicao ?? '', 3, 'cortes, zooms, legenda queimada Sora com 1 palavra coral por frase, tag ME/MEI no canto, end card')}</label>
        </div>`;
    }
    if (!temGravacao) return `<p class="dt-nota">Sem detalhes de gravação ainda. Preencha em "Editar texto" ou peça pra skill em "Ajustar com a skill".</p>`;
    const lista = (arr, telas = false) => (arr?.length
      ? `<ul>${arr.map((x) => {
        if (!telas) return `<li>${esc(x)}</li>`;
        const i = x.indexOf(':');
        return i > 0 && i < 60 ? `<li><b>${esc(x.slice(0, i))}</b>${esc(x.slice(i))}</li>` : `<li>${esc(x)}</li>`;
      }).join('')}</ul>`
      : vazio());
    return `
      <div class="dt-grav">
        ${GRAV_TEXTO.map(([k, nome]) => `<div class="dt-grav-item${k === 'enquadramento' || k === 'local' || k === 'audio' ? ' largo' : ''}"><span class="dt-rotulo">${esc(nome)}</span><p>${g[k] ? esc(g[k]) : vazio()}</p></div>`).join('')}
      </div>
      <div class="dt-grav-listas">
        ${GRAV_LISTA.map(([k, nome]) => `<div class="dt-grav-lista"><span class="dt-rotulo">${esc(nome)}</span>${lista(g[k], k === 'telasApp')}</div>`).join('')}
      </div>
      <div class="dt-grav-listas dt-grav-fim">
        <div class="dt-grav-lista dt-check">
          <span class="dt-rotulo">Checklist antes de gravar</span>
          ${g.checklist?.length
            ? `<ul>${g.checklist.map((x, i) => `<li><label><input type="checkbox" data-check="${r.id}:${i}" ${marcados.has(`${r.id}:${i}`) ? 'checked' : ''} /><span>${esc(x)}</span></label></li>`).join('')}</ul>
               <small class="dt-nota">Só pra conferir na hora: a marcação não fica salva.</small>`
            : vazio()}
        </div>
        <div class="dt-grav-lista"><span class="dt-rotulo">Edição</span><p>${g.edicao ? esc(g.edicao) : vazio()}</p></div>
      </div>`;
  };

  painel = abrirPainel(`
    <div class="painel-topo">
      <div class="dt-cabeca">
        <div class="dt-pills">
          <span class="pill status-reel" data-st="${esc(r.status)}">${esc(rotulo(r.status))}</span>
          ${pillTipo(r.tipo)}
          ${c ? `<span class="pill">${icone('alvo', 13)}${esc(c.nome)}</span>` : ''}
          <span class="pill" id="dt-pill-data">${r.data ? esc(fmtData(r.data, { ano: true, diaSemana: true })) : 'sem data'}</span>
        </div>
        ${editando ? `<input class="campo dt-titulo-campo" data-edit="ideia" value="${esc(r.ideia)}" aria-label="Título do reel" />` : `<h2>${esc(r.ideia)}</h2>`}
        ${editando ? `<input class="campo dt-tema-campo" data-edit="tema" value="${esc(r.tema)}" placeholder="Tema em uma frase" aria-label="Tema" />` : r.tema ? `<p>${esc(r.tema)}</p>` : ''}
      </div>
      ${BTN_FECHAR}
    </div>
    <div class="painel-corpo">
      <div class="dt-origem">
        <div class="dt-origem-fmt">
          ${f
            ? `<span class="dt-rotulo">Formato · adaptado de</span>
               <a href="#/biblioteca/${f.id}" data-ir="#/biblioteca/${f.id}" class="dt-link-fmt"><b>${esc(f.codigo)}</b> · ${esc(f.nome)}</a>
               <span class="dt-selo">${seloFormato(f)}${f.duracao ? `<span class="dt-duracao">${icone('relogio', 13)}${esc(f.duracao)}</span>` : ''}</span>
               <p class="dt-nota">${esc(avisoFormato(f))}</p>`
            : `<span class="dt-rotulo">Formato livre</span>
               <p class="dt-nota">${r.formatoTexto ? `Veio do arquivo como "${esc(r.formatoTexto.split(',')[0])}". ` : ''}Escolha um formato da biblioteca no campo Formato pra este reel contar na validação.</p>`}
        </div>
        ${ide ? `
        <div class="dt-origem-ideia">
          <span class="dt-ideia-icone">${icone('lampada', 16)}</span>
          <div>
            <span class="dt-rotulo">Ideia de origem</span>
            <a href="#/ideias?abrir=${encodeURIComponent(ide.id)}" data-ir="#/ideias?abrir=${encodeURIComponent(ide.id)}" class="dt-link-ideia">${esc(ide.titulo)}</a>
            ${ide.tema ? `<p class="dt-nota">Tema: ${esc(nomeTema(ide.tema))}</p>` : ''}
            ${ide.descricao ? `<p class="dt-nota">${esc(ide.descricao)}</p>` : ''}
            ${ide.gancho ? `<p class="dt-nota">Gancho sugerido: "${esc(ide.gancho)}"</p>` : ''}
          </div>
        </div>` : ''}
      </div>

      <div class="dt-meta">
        <label class="rotulo">Tipo<select class="campo" data-meta="tipo"><option value="">sem tipo</option>${TIPOS.map((t) => `<option value="${t.id}" ${r.tipo === t.id ? 'selected' : ''}>${esc(t.nome)}</option>`).join('')}</select></label>
        <label class="rotulo">Data<input type="date" class="campo" data-meta="data" min="2000-01-01" max="2100-12-31" value="${esc(r.data)}" /></label>
        <label class="rotulo">Status<select class="campo" data-meta="status">${STATUS.map((s) => `<option value="${s}" ${r.status === s ? 'selected' : ''}>${esc(rotulo(s))}</option>`).join('')}</select></label>
        <label class="rotulo">Pilar<select class="campo" data-meta="pilar"><option value="">sem pilar</option>${(E.pilares ?? []).map((p) => `<option value="${p.id}" ${Number(r.pilar) === p.id ? 'selected' : ''}>${p.id} · ${esc(p.nome)}</option>`).join('')}</select></label>
        <label class="rotulo dt-meta-largo">Formato<select class="campo" data-meta="formatoId"><option value="">${esc(r.formatoTexto ? 'livre: ' + r.formatoTexto.split(',')[0] : 'Formato livre')}</option>${opcoesFormato}</select></label>
        <div class="rotulo-fixo">Campanha<span class="campo-fixo" title="Por enquanto só existe esta campanha">${icone('alvo', 16)}${esc(c?.nome ?? 'Pré-lançamento')}</span></div>
        <label class="rotulo dt-meta-largo">Link do post publicado<input class="campo" data-meta="permalink" placeholder="https://www.instagram.com/reel/..." value="${esc(r.permalink)}" /></label>
      </div>
      ${tipoReel(r.tipo) ? `<p class="dt-nota dt-tipo-dica">${icone(tipoReel(r.tipo).icone, 14)}<span>${esc(tipoReel(r.tipo).dica)}${estilo(r.tipo) ? ` <a href="#/biblioteca?estilo=${r.tipo}" data-ir="#/biblioteca?estilo=${r.tipo}">Ver o guia do estilo</a>` : ''}</span></p>` : ''}

      <div class="bloco">
        <div class="bloco-titulo">Hook falado${editando ? '' : `<button class="btn btn-sm btn-fantasma" data-copiar="hook">${icone('copiar', 14)} Copiar</button>`}</div>
        ${editando
          ? `${campoTexto('hook', ro.hook, 2, 'O que o Pedro fala nos primeiros 3 segundos')}<div class="dt-espaco-v"></div><label class="rotulo">Texto de tela do hook${campoLinha('textoTela', ro.textoTela, 'CAIXA ALTA, até ~40 caracteres')}</label>`
          : `<div class="texto dt-hook">${ro.hook ? esc(ro.hook) : vazio('sem hook ainda')}</div>${ro.textoTela ? `<div class="dt-tela-linha"><span class="dt-rotulo">Texto de tela</span><span class="dt-tela">${esc(ro.textoTela)}</span></div>` : ''}`}
      </div>

      <div class="bloco">
        <div class="bloco-titulo">Narração do desenvolvimento<span class="dt-contador" title="Estimativa a ${String(PALAVRAS_POR_SEGUNDO).replace('.', ',')} palavras por segundo">${nPalavras} palavras · ~${Math.round(nPalavras / PALAVRAS_POR_SEGUNDO)}s${nTotal !== nPalavras ? ` · reel falado ~${Math.round(nTotal / PALAVRAS_POR_SEGUNDO)}s` : ''}</span></div>
        ${editando ? campoTexto('desenvolvimento', ro.desenvolvimento, 7, 'Palavra por palavra, como o Pedro vai falar') : `<div class="texto dt-narracao">${ro.desenvolvimento ? esc(ro.desenvolvimento) : vazio()}</div>`}
      </div>

      <div class="bloco">
        <div class="bloco-titulo">CTA final</div>
        ${editando ? campoTexto('cta', ro.cta, 2) : `<div class="texto dt-cta">${ro.cta ? esc(ro.cta) : vazio()}</div>`}
      </div>

      ${ro.cenas?.length ? `
      <div class="bloco">
        <div class="bloco-titulo">Roteiro cena a cena</div>
        <div class="rolagem"><table class="tabela dt-tabela">
          <thead><tr><th>Tempo</th><th>Cena / visual</th><th>Fala</th><th>Texto de tela</th></tr></thead>
          <tbody>${ro.cenas.map((x) => `<tr><td>${esc(x.tempo)}</td><td>${esc(x.cena)}</td><td>${esc(x.fala)}</td><td class="dt-tela-celula">${esc(x.tela)}</td></tr>`).join('')}</tbody>
        </table></div>
      </div>` : ''}

      <div class="bloco">
        <div class="bloco-titulo">Detalhes de gravação</div>
        ${blocoGravacao()}
      </div>

      <div class="bloco">
        <div class="bloco-titulo">Fontes</div>
        ${editando
          ? `${campoTexto('fontes', fontes.join('\n'), 4, 'Uma fonte por linha: a de cada número ou fato legal do reel')}`
          : fontes.length
            ? `<ol class="dt-fontes">${fontes.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`
            : `<p class="dt-nota">${/\d/.test([ro.hook, ro.desenvolvimento, ro.cta, r.legenda].join(' ')) ? 'Tem número no texto e nenhuma fonte listada. Número sem fonte não entra.' : 'Nenhuma fonte listada.'}</p>`}
      </div>

      <div class="bloco">
        <div class="bloco-titulo">Legenda <span class="dt-contador ${leg > 2200 ? 'estourou' : ''}" id="dt-contador">${leg.toLocaleString('pt-BR')} / 2.200</span>${editando ? '' : `<button class="btn btn-sm btn-fantasma" data-copiar="legenda">${icone('copiar', 14)} Copiar</button>`}</div>
        ${editando ? campoTexto('legenda', r.legenda, 14) : `<div class="texto">${r.legenda ? esc(r.legenda) : vazio('sem legenda ainda')}</div>`}
      </div>

      <div class="bloco">
        <div class="bloco-titulo">Checagem das regras duras</div>
        <div class="dt-qa">${itensQa.map((i) => `<span class="selo ${i.ok ? 'validado' : i.nivel === 'alerta' ? 'em-teste' : 'erro'}">${i.ok ? '✓' : i.nivel === 'alerta' ? '!' : '✕'} ${esc(i.texto)}</span>`).join('')}</div>
      </div>

      ${m ? `
      <div class="bloco">
        <div class="bloco-titulo">Desempenho no Instagram</div>
        <div class="dt-kpis">
          <div class="kpi"><b>${fmtN(m.views)}</b><span>views</span></div>
          <div class="kpi"><b>${fmtN(m.reach)}</b><span>alcance</span></div>
          <div class="kpi"><b>${fmtN(m.saved)}</b><span>salvamentos</span></div>
          <div class="kpi"><b>${fmtN(m.shares)}</b><span>compartilhamentos</span></div>
          <div class="kpi"><b>${fmtN(m.likes)}</b><span>curtidas</span></div>
          <div class="kpi"><b class="dt-rel ${m.relativo != null && Number(m.relativo) >= limiar ? 'alto' : ''}">${fmtRel(m.relativo)}</b><span>vs. mediana da conta</span></div>
        </div>
        ${blocoCase()}
      </div>` : r.status === 'publicado' ? `
      <div class="bloco">
        <div class="bloco-titulo">Desempenho no Instagram</div>
        <p class="dt-nota">${r.permalink ? 'Os números aparecem aqui depois de sincronizar em Instagram, Métricas.' : 'Cole o link do post publicado no campo acima e sincronize em Instagram, Métricas.'}</p>
      </div>` : ''}

      ${r.origem ? `<p class="dt-arquivo">Arquivo: ${esc(r.origem)}</p>` : ''}
    </div>
    <div class="painel-rodape dt-rodape">
      ${editando
        ? `<button class="btn btn-primario" id="dt-salvar">Salvar texto</button><button class="btn" id="dt-cancelar">Cancelar</button>`
        : `<button class="btn btn-primario" id="dt-skill">${icone('raio', 16)} Ajustar com a skill</button><button class="btn" id="dt-editar">${icone('editar', 16)} Editar texto</button><button class="btn" data-copiar-grav>${icone('copiar', 16)} Copiar roteiro de gravação</button>`}
      <span class="dt-espaco"></span>
      <button class="btn btn-fantasma btn-perigo" id="dt-excluir">${icone('lixo', 16)} Excluir</button>
    </div>
  `, { largo: true }) || document.querySelector('.painel');

  const p = painel;
  const q = (s) => p.querySelector(s);
  const qq = (s) => [...p.querySelectorAll(s)];

  qq('[data-fechar]').forEach((b) => (b.onclick = fecharPainel));
  qq('[data-ir]').forEach((a) => (a.onclick = (e) => {
    e.preventDefault();
    fecharPainel();
    navegar(a.dataset.ir);
  }));

  // texto ainda não salvo do modo edição (lido do painel atual, antes de redesenhar)
  const rascunho = () => (editando ? Object.fromEntries(qq('[data-edit]').map((t) => [t.dataset.edit, t.value])) : null);

  qq('[data-meta]:not([data-meta="data"])').forEach((el) => (el.onchange = async () => {
    const campo = el.dataset.meta;
    const v = campo === 'pilar' ? (el.value ? Number(el.value) : null) : el.value;
    try {
      await api('PUT', `/api/reels/${r.id}`, { [campo]: v });
      await recarregar();
      reabrir(r.id, editando, rascunho());
      toast('Salvo');
    } catch (e) {
      // não salvou: o campo volta pro valor que está no servidor
      el.value = campo === 'pilar' ? (r.pilar ?? '') : (r[campo] ?? '');
      toast(e.message);
    }
  }));

  // Data: o Chromium dispara change a cada dígito que já forma uma data válida (ano 0002, dia 01).
  // Só salva data completa com ano 2000+, depois de uma pausa ou ao sair do campo, e nunca
  // redesenha o painel com o campo em uso (atualiza só a pílula do topo)
  const campoData = q('[data-meta="data"]');
  let tempoData = null;
  let salvandoData = false;
  // flag própria: quando um segmento (dia, mês) se completa, o foco passa por dentro do campo e
  // document.activeElement deixa de ser o input por um instante, bem na hora do change
  let emUso = false;
  const dataValida = (v) => campoData.checkValidity() && (!v || /^\d{4}-\d{2}-\d{2}$/.test(v));
  const salvarData = async () => {
    clearTimeout(tempoData);
    const v = campoData.value;
    if (v === (r.data ?? '')) return;
    if (!dataValida(v)) { toast('Data incompleta ou fora do intervalo. Confira o ano.'); return; }
    if (salvandoData) { tempoData = setTimeout(salvarData, 300); return; }
    salvandoData = true;
    try {
      await api('PUT', `/api/reels/${r.id}`, { data: v });
      await recarregar();
      r = reel(r.id) ?? { ...r, data: v };
      const pill = q('#dt-pill-data');
      if (pill) pill.textContent = r.data ? fmtData(r.data, { ano: true, diaSemana: true }) : 'sem data';
      toast('Salvo');
    } catch (e) {
      if (!emUso) campoData.value = r.data ?? '';
      toast(e.message);
    } finally { salvandoData = false; }
  };
  campoData.onchange = () => {
    clearTimeout(tempoData);
    if (!emUso) salvarData(); // mudou sem o campo em uso (botão Limpar, por exemplo)
    else if (campoData.value && dataValida(campoData.value)) tempoData = setTimeout(salvarData, 900);
  };
  campoData.onfocus = () => { emUso = true; };
  campoData.onblur = () => { emUso = false; if (campoData.value !== (r.data ?? '')) salvarData(); };
  campoData.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); campoData.blur(); } };

  const copiar = async (texto, ok = 'Copiado') => {
    try {
      await navigator.clipboard.writeText(texto ?? '');
      toast(ok);
    } catch { toast('Não consegui copiar. Selecione o texto e copie na mão.'); }
  };
  qq('[data-copiar]').forEach((b) => (b.onclick = () => copiar(b.dataset.copiar === 'hook' ? ro.hook : r.legenda)));
  qq('[data-copiar-grav]').forEach((b) => (b.onclick = () => copiar(textoGravacao(reel(r.id) ?? r, f), 'Roteiro de gravação copiado')));
  qq('[data-check]').forEach((cb) => (cb.onchange = () => {
    if (cb.checked) marcados.add(cb.dataset.check);
    else marcados.delete(cb.dataset.check);
  }));

  const botaoCase = q('#dt-case');
  if (botaoCase) botaoCase.onclick = async () => {
    botaoCase.disabled = true;
    const E2 = store.E;
    try {
      // com a mídia no cache do Instagram, o case nasce ligado a ela (midiaId, thumb, números
      // renovados a cada sincronização) e Métricas não oferece mandar o mesmo reel de novo
      let midia = null;
      if (r.permalink) {
        try {
          const d = await api('GET', '/api/instagram/dados');
          midia = (d.proprios ?? []).find((x) => mesmoPost(x.permalink, r.permalink)) ?? null;
        } catch { /* sem cache: segue com o case manual */ }
      }
      if (midia) {
        const novo = await api('POST', '/api/instagram/para-biblioteca', { midiaId: midia.midiaId, formatoId: r.formatoId });
        if (!midia.caseId && novo?.id && novo.titulo !== r.ideia) await api('PUT', `/api/cases/${novo.id}`, { titulo: r.ideia }).catch(() => {});
      } else await api('POST', '/api/cases', {
        formatoId: r.formatoId,
        titulo: r.ideia,
        conta: E2.instagram?.conta?.username || E2.config?.handleInstagram || '',
        origem: 'nosso',
        permalink: r.permalink ?? '',
        thumb: m.thumb ?? '',
        views: m.views ?? null,
        likes: m.likes ?? null,
        comments: m.comments ?? null,
        saved: m.saved ?? null,
        shares: m.shares ?? null,
        relativo: m.relativo ?? null,
        data: r.data || (m.timestamp ?? '').slice(0, 10),
        notas: '',
        midiaId: m.midiaId ?? null,
        reelId: r.id,
      });
      toast(`Virou case do formato ${f.codigo}`);
      await recarregar();
      reabrir(r.id);
    } catch (e) {
      toast(e.message);
      botaoCase.disabled = false;
    }
  };

  q('#dt-excluir').onclick = async () => {
    if (!confirm(`Excluir "${r.ideia}" do cronograma? O arquivo .md em marketing/conteudo continua lá.`)) return;
    try {
      await api('DELETE', `/api/reels/${r.id}`);
      fecharPainel();
      toast('Reel excluído');
      await recarregar();
    } catch (e) { toast(e.message); }
  };

  if (editando) {
    const legenda = q('[data-edit="legenda"]');
    const contador = q('#dt-contador');
    legenda.oninput = () => {
      const n = legenda.value.length;
      contador.textContent = `${n.toLocaleString('pt-BR')} / 2.200`;
      contador.classList.toggle('estourou', n > 2200);
    };
    q('#dt-cancelar').onclick = () => reabrir(r.id);
    q('#dt-salvar').onclick = async () => {
      const v = Object.fromEntries(qq('[data-edit]').map((t) => [t.dataset.edit, t.value]));
      const gravacao = Object.fromEntries([
        ...GRAV_TEXTO.map(([k]) => [k, v[`g.${k}`] ?? '']),
        ...[...GRAV_LISTA.map(([k]) => k), 'checklist'].map((k) => [k, linhas(v[`g.${k}`])]),
        ['edicao', v['g.edicao'] ?? ''],
      ]);
      try {
        await api('PUT', `/api/reels/${r.id}`, {
          ideia: v.ideia.trim() || r.ideia,
          tema: v.tema ?? r.tema,
          legenda: v.legenda,
          roteiro: { ...ro, hook: v.hook, textoTela: v.textoTela, desenvolvimento: v.desenvolvimento, cta: v.cta },
          gravacao,
          fontes: linhas(v.fontes),
        });
        await recarregar();
        reabrir(r.id);
        toast('Texto salvo');
      } catch (e) { toast(e.message); }
    };
  } else {
    q('#dt-editar').onclick = () => reabrir(r.id, true);
    q('#dt-skill').onclick = () => abrirChat({
      reelId: r.id, formatoId: r.formatoId, campanhaId: r.campanhaId, data: r.data, tipo: r.tipo ?? '', ideiaId: r.ideiaId ?? '',
      titulo: `Ajustar: ${r.ideia}`,
    });
  }
}
