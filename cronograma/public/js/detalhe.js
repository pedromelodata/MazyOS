// Detalhe do reel (painel lateral). Porta da v1 + "Adaptado de X.Y", ideia de origem, o botão
// que manda um reel publicado que performou pra Biblioteca como case e (23/09) o reel inteiro
// estruturado: formato, tipo, roteiro em blocos (Gancho, desenvolvimento, CTA), detalhes de gravação
// e fontes (24/09: no botão "i" do topo).
import {
  esc, fmtN, fmtRel, fmtData, STATUS, TIPOS, store, api, recarregar, toast, abrirPainel, fecharPainel,
  BTN_FECHAR, navegar, formato, campanha, ideia, reel, seloFormato, qa, icone, tipoReel, pillTipo, nomeTema,
  tipoFormato, rotuloFormato, blocosRoteiro, roteiroHtml, roteiroTexto, botaoFontes,
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
    [r.data ? fmtData(r.data, { ano: true, diaSemana: true }) : 'sem data', t?.nome ?? 'sem tipo', f ? `${tipoFormato(f)}: ${f.nome} (${f.codigo})` : 'Formato livre'].join(' · '),
    '',
    ...bloco('ROTEIRO', roteiroTexto(blocosRoteiro(ro))),
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
  const pilarNome = (id) => { const pl = (E.pilares ?? []).find((x) => x.id === Number(id)); return pl ? `${pl.id} · ${pl.nome}` : ''; };
  const vazio = (txt) => `<span class="dt-vazio">${esc(txt)}</span>`;
  const blocos = blocosRoteiro(ro);
  const nTotal = blocos.reduce((n, b) => n + palavras(b.fala), 0);
  const cenas = ro.cenas ?? [];
  const temGravacao = [...GRAV_TEXTO.map(([k]) => g[k]), g.edicao].some((x) => String(x ?? '').trim())
    || [...GRAV_LISTA.map(([k]) => g[k]), g.checklist].some((x) => x?.length);

  const opcoesFormato = gruposFormato(E.formatos).map(([cat, fs]) => `
    <optgroup label="${esc(tipoFormato(fs[0]) || cat)}">
      ${fs.map((x) => `<option value="${x.id}" ${r.formatoId === x.id ? 'selected' : ''}>${esc(x.nome)} · ${esc(x.codigo)}${x.status === 'validado' ? '' : ' (em teste)'}</option>`).join('')}
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
          ${f ? '' : '<span>Escolha o formato antes de mandar.</span>'}
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
    const lista = (arr, telas = false) => (arr?.length
      ? `<ul>${arr.map((x) => {
        if (!telas) return `<li>${esc(x)}</li>`;
        const i = x.indexOf(':');
        return i > 0 && i < 60 ? `<li><b>${esc(x.slice(0, i))}</b>${esc(x.slice(i))}</li>` : `<li>${esc(x)}</li>`;
      }).join('')}</ul>`
      : '');
    // leitura: só o que foi preenchido
    const textos = GRAV_TEXTO.filter(([k]) => String(g[k] ?? '').trim());
    const listas = GRAV_LISTA.filter(([k]) => g[k]?.length);
    return `
      ${textos.length ? `<div class="dt-grav">
        ${textos.map(([k, nome]) => `<div class="dt-grav-item${k === 'enquadramento' || k === 'local' || k === 'audio' ? ' largo' : ''}"><span class="dt-rotulo">${esc(nome)}</span><p>${esc(g[k])}</p></div>`).join('')}
      </div>` : ''}
      ${listas.length ? `<div class="dt-grav-listas">
        ${listas.map(([k, nome]) => `<div class="dt-grav-lista"><span class="dt-rotulo">${esc(nome)}</span>${lista(g[k], k === 'telasApp')}</div>`).join('')}
      </div>` : ''}
      ${g.checklist?.length || String(g.edicao ?? '').trim() ? `<div class="dt-grav-listas dt-grav-fim">
        ${g.checklist?.length ? `<div class="dt-grav-lista dt-check">
          <span class="dt-rotulo">Checklist antes de gravar</span>
          <ul>${g.checklist.map((x, i) => `<li><label><input type="checkbox" data-check="${r.id}:${i}" ${marcados.has(`${r.id}:${i}`) ? 'checked' : ''} /><span>${esc(x)}</span></label></li>`).join('')}</ul>
        </div>` : ''}
        ${String(g.edicao ?? '').trim() ? `<div class="dt-grav-lista"><span class="dt-rotulo">Edição</span><p>${esc(g.edicao)}</p></div>` : ''}
      </div>` : ''}`;
  };

  // edição: com cenas, cada bloco (tempo, fala, em cena, na tela); sem cenas, gancho, desenvolvimento e CTA
  const edicaoRoteiro = () => {
    if (cenas.length) {
      return `<ol class="rt-blocos rt-edicao">${cenas.map((c, i) => `
        <li class="rt-bloco" data-parte="${blocos[i]?.parte ?? 'dev'}">
          <div class="rt-cab"><span class="rt-rotulo">${esc(blocos[i]?.rotulo ?? `Bloco ${i + 1}`)}</span>${campoLinha(`c.${i}.tempo`, c.tempo, '0-3s')}</div>
          <label class="rotulo">Fala${campoTexto(`c.${i}.fala`, c.fala, 3)}</label>
          <label class="rotulo">Em cena${campoLinha(`c.${i}.cena`, c.cena, 'o que a câmera mostra')}</label>
          <label class="rotulo">Na tela <small>opcional</small>${campoLinha(`c.${i}.tela`, c.tela, 'só se ajudar: número ou palavra-chave')}</label>
        </li>`).join('')}</ol>`;
    }
    return `
      <label class="rotulo">Gancho${campoTexto('hook', ro.hook, 2, 'O que se fala nos primeiros 3 segundos')}</label>
      <label class="rotulo">Na tela no gancho <small>opcional</small>${campoLinha('textoTela', ro.textoTela, 'só se ajudar: som desligado, número ou palavra-chave')}</label>
      <label class="rotulo">Desenvolvimento <small>uma batida por parágrafo</small>${campoTexto('desenvolvimento', ro.desenvolvimento, 7, 'Palavra por palavra, como vai ser falado')}</label>
      <label class="rotulo">CTA${campoTexto('cta', ro.cta, 2)}</label>`;
  };

  painel = abrirPainel(`
    <div class="painel-topo">
      <div class="dt-cabeca">
        <div class="dt-pills">
          <span class="pill status-reel" data-st="${esc(r.status)}">${esc(rotulo(r.status))}</span>
          ${pillTipo(r.tipo)}
          ${c ? `<span class="pill">${icone('alvo', 13)}${esc(c.nome)}</span>` : ''}
          ${r.calendario ? `<span class="pill" title="Peça do calendário editorial oficial do mês">${icone('calendario', 13)}Calendário oficial</span>` : ''}
          ${r.impulsionar === 'Sim' || r.impulsionar === 'Avaliar' ? `<span class="pill">Impulsionar: ${esc(r.impulsionar)}</span>` : ''}
          <span class="pill" id="dt-pill-data">${r.data ? esc(fmtData(r.data, { ano: true, diaSemana: true })) : 'sem data'}</span>
        </div>
        ${editando ? `<input class="campo dt-titulo-campo" data-edit="ideia" value="${esc(r.ideia)}" aria-label="Título do reel" />` : `<h2>${esc(r.ideia)}</h2>`}
        ${editando ? `<input class="campo dt-tema-campo" data-edit="tema" value="${esc(r.tema)}" placeholder="Tema em uma frase" aria-label="Tema" />` : r.tema && r.tema !== r.ideia ? `<p>${esc(r.tema)}</p>` : ''}
      </div>
      ${editando ? '' : botaoFontes(fontes)}
      ${BTN_FECHAR}
    </div>
    <div class="painel-corpo">
      ${r.notas ? `<div class="dt-aviso dt-aviso-notas">${icone('lampada', 16)}<span>${esc(r.notas)}</span></div>` : ''}
      <div class="dt-origem">
        <div class="dt-origem-fmt">
          ${f
            ? `<span class="dt-rotulo">Formato</span>
               <a href="#/biblioteca/${f.id}" data-ir="#/biblioteca/${f.id}" class="dt-link-fmt">${rotuloFormato(f)}</a>
               <span class="dt-selo">${seloFormato(f, { compacto: true })}${f.duracao ? `<span class="dt-duracao">${icone('relogio', 13)}${esc(f.duracao)}</span>` : ''}</span>
               ${r.formatoTexto ? `<p class="dt-nota">No calendário: ${esc(r.formatoTexto)}</p>` : ''}`
            : `<span class="dt-rotulo">Formato livre</span>
               ${r.formatoTexto ? `<p class="dt-formato-livre">${esc(r.formatoTexto)}</p>` : ''}`}
        </div>
        ${ide ? `
        <div class="dt-origem-ideia">
          <span class="dt-ideia-icone">${icone('lampada', 16)}</span>
          <div>
            <span class="dt-rotulo">Ideia de origem</span>
            <a href="#/ideias?abrir=${encodeURIComponent(ide.id)}" data-ir="#/ideias?abrir=${encodeURIComponent(ide.id)}" class="dt-link-ideia">${esc(ide.titulo)}</a>
            ${ide.tema ? `<p class="dt-nota">${esc(nomeTema(ide.tema))}</p>` : ''}
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
        <label class="rotulo dt-meta-largo">Link do post<input class="campo" data-meta="permalink" placeholder="https://www.instagram.com/reel/..." value="${esc(r.permalink)}" /></label>
        <label class="rotulo">Rede<input class="campo" data-meta="rede" placeholder="Instagram + Facebook" value="${esc(r.rede ?? '')}" /></label>
        <label class="rotulo">Candidato a impulsionar<select class="campo" data-meta="impulsionar"><option value="">não definido</option>${['Sim', 'Não', 'Avaliar'].map((x) => `<option value="${x}" ${r.impulsionar === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <label class="rotulo dt-meta-largo">Formato no calendário<input class="campo" data-meta="formatoTexto" placeholder="ex.: Carrossel 4:5, 3 slides" value="${esc(r.formatoTexto ?? '')}" /></label>
        <label class="rotulo dt-meta-largo">Gatilho / observação<textarea class="campo" data-meta="gatilho" rows="2" placeholder="Data comemorativa, evergreen, janela de promoção...">${esc(r.gatilho ?? '')}</textarea></label>
        <label class="rotulo dt-meta-largo">Notas<textarea class="campo" data-meta="notas" rows="3" placeholder="O que conferir antes de produzir">${esc(r.notas ?? '')}</textarea></label>
      </div>
      ${r.pilarTexto && r.pilarTexto !== pilarNome(r.pilar) ? `<p class="dt-nota dt-pilar-cal">Pilar no calendário: ${esc(r.pilarTexto)}</p>` : ''}

      <div class="bloco">
        <div class="bloco-titulo">Roteiro${nTotal ? `<span class="dt-contador" title="Estimativa a ${String(PALAVRAS_POR_SEGUNDO).replace('.', ',')} palavras por segundo">${nTotal} palavras · ~${Math.round(nTotal / PALAVRAS_POR_SEGUNDO)}s</span>` : ''}${editando || !blocos.length ? '' : `<button class="btn btn-sm btn-fantasma" data-copiar="roteiro">${icone('copiar', 14)} Copiar</button>`}</div>
        ${editando ? edicaoRoteiro() : blocos.length ? roteiroHtml(blocos) : vazio('sem roteiro ainda')}
      </div>

      ${editando || temGravacao ? `
      <div class="bloco">
        <div class="bloco-titulo">Detalhes de gravação</div>
        ${blocoGravacao()}
      </div>` : ''}

      ${editando ? `
      <div class="bloco">
        <div class="bloco-titulo">Fontes</div>
        ${campoTexto('fontes', fontes.join('\n'), 4, 'Uma fonte por linha')}
      </div>` : ''}

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
        <p class="dt-nota">${r.permalink ? 'Sincronize em Métricas pra ver os números.' : 'Cole o link do post e sincronize em Métricas.'}</p>
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
  qq('[data-copiar]').forEach((b) => (b.onclick = () => copiar(b.dataset.copiar === 'roteiro' ? roteiroTexto(blocos) : r.legenda)));
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
    // com cenas, o gancho é a fala da primeira, a CTA a da última (quando ela é a CTA) e o resto é o desenvolvimento
    const roteiroEditado = (v) => {
      if (!cenas.length) return { ...ro, hook: v.hook, textoTela: v.textoTela, desenvolvimento: v.desenvolvimento, cta: v.cta };
      const novas = cenas.map((c, i) => Object.fromEntries(['tempo', 'fala', 'cena', 'tela'].map((k) => [k, String(v[`c.${i}.${k}`] ?? c[k] ?? '').trim()])));
      const temCta = blocos[cenas.length - 1]?.parte === 'cta';
      const meio = novas.slice(1, temCta ? -1 : undefined);
      return {
        ...ro,
        cenas: novas,
        hook: novas[0].fala,
        textoTela: novas[0].tela,
        desenvolvimento: meio.map((c) => c.fala).filter(Boolean).join('\n\n'),
        cta: temCta ? novas.at(-1).fala : ro.cta,
      };
    };
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
          roteiro: roteiroEditado(v),
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
