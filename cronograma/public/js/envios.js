// Arquivos subidos direto nas Aprovações técnicas (21/10/2026, Pedro: "Dentro de aprovações técnicas, permita também
// subir direto lá alguns arquivos com um título e uma base e logo depois permitir enviar para aprovação").
// O time sobe imagem, PDF ou vídeo com um título e a base técnica; o envio vira um item da aba e segue o mesmo
// caminho da peça (mandar, aprovar, ajustar, conversa). Aqui ficam o painel "Subir arquivos pra aprovação", a fila
// de upload (um arquivo por vez, com progresso) e a prévia dos arquivos. O painel do envio fica na vista
// (views/aprovacoes.js), junto do painel da peça.
// O servidor decide o tipo pelos bytes do começo do arquivo; a tela só confere antes pela extensão ou pelo tipo
// que o navegador informa, pra recusar cedo o que nem vai entrar.
import { esc, api, icone, toast, abrirPainel, BTN_FECHAR, sessaoCaiu } from './core.js';

export const MAX_BYTES = 200 * 1024 * 1024;
export const MAX_ARQUIVOS = 20;
const LIM = { titulo: 200, base: 3000 };
const TIPOS = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  pdf: 'application/pdf', mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
};
const MIMES = [...new Set(Object.values(TIPOS))];
export const ACEITA = [...MIMES, ...Object.keys(TIPOS).map((e) => `.${e}`)].join(',');
export const ERRO_TIPO = 'Esse tipo de arquivo não entra: mande imagem (PNG, JPG, WEBP ou GIF), PDF ou vídeo (MP4, MOV ou WEBM).';
export const ERRO_TAMANHO = 'O arquivo passa de 200 MB.';
export const DICA_ARQUIVOS = 'Imagem (PNG, JPG, WEBP ou GIF), PDF ou vídeo (MP4, MOV ou WEBM). Até 200 MB cada, até 20 por envio.';
export const DICA_BASE = 'A base técnica: de onde vem o que o arquivo diz (fato do FATOS.md, regra ou fonte)';

const extDe = (nome) => (/\.([a-z0-9]+)$/i.exec(String(nome ?? ''))?.[1] ?? '').toLowerCase();
// null = pode subir; senão, o motivo
export function conferirArquivo(f) {
  const mime = String(f?.type ?? '').toLowerCase();
  if (!Object.hasOwn(TIPOS, extDe(f?.name)) && !MIMES.includes(mime)) return ERRO_TIPO;
  if (f.size > MAX_BYTES) return ERRO_TAMANHO;
  if (!f.size) return 'O arquivo está vazio.';
  return null;
}
// 'imagem', 'video' ou 'pdf' pelo tipo gravado (arquivo do servidor) ou pelo que o navegador informa
export function tipoDe(tipo, nome = '') {
  const dado = String(tipo ?? '').toLowerCase();
  // tipo fora da lista (vazio ou application/octet-stream): vale a extensão do nome
  const t = MIMES.includes(dado) ? dado : TIPOS[extDe(nome)] ?? dado;
  if (t.startsWith('image/')) return 'imagem';
  if (t.startsWith('video/')) return 'video';
  if (t === 'application/pdf') return 'pdf';
  return 'outro';
}

export function fmtTamanho(n) {
  const b = Math.max(0, Number(n) || 0);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.max(1, Math.round(b / 1024))} KB`;
  const mb = b / (1024 * 1024);
  return `${mb.toLocaleString('pt-BR', { maximumFractionDigits: mb < 10 ? 1 : 0 })} MB`;
}

// o core não tem ícone de documento: o PDF usa este, no mesmo traço dos outros
const DOC = '<path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8Z"/><path d="M14 3.5V8h4.5M9 13h6M9 16.5h4"/>';
const iconeDoc = (tam) => `<svg class="ico" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${DOC}</svg>`;
export function iconeArquivo(tipo, tam = 18) {
  if (tipo === 'imagem') return icone('estatico', tam);
  if (tipo === 'video') return icone('video', tam);
  return iconeDoc(tam);
}

// ── upload de um arquivo (corpo cru, com progresso) ──
// XMLHttpRequest porque o fetch não dá o progresso da subida. Mesma origem: a sessão vai no cookie
export function subirArquivo(envioId, arquivo, aoProgresso = () => {}) {
  return new Promise((ok, falhou) => {
    const x = new XMLHttpRequest();
    x.open('POST', `/api/envios/${encodeURIComponent(envioId)}/arquivos`);
    x.setRequestHeader('x-nome-arquivo', encodeURIComponent(arquivo.name));
    x.setRequestHeader('content-type', arquivo.type || 'application/octet-stream');
    // 100% só quando o servidor responde: ele ainda confere e guarda o arquivo depois do último byte
    x.upload.onprogress = (e) => { if (e.lengthComputable && e.total) aoProgresso(Math.min(99, Math.round((e.loaded / e.total) * 100))); };
    x.onload = () => {
      let j = {};
      try { j = JSON.parse(x.responseText || '{}'); } catch {}
      if (x.status >= 200 && x.status < 300) { aoProgresso(100); ok(j); return; }
      if (sessaoCaiu(x.status, j)) { falhou(Object.assign(new Error('Sua sessão acabou. Entre de novo.'), { parar: true })); return; }
      const msg = j?.erro || (x.status === 413 ? ERRO_TAMANHO : x.status === 415 ? ERRO_TIPO : `Erro ${x.status}`);
      falhou(Object.assign(new Error(msg), { status: x.status }));
    };
    x.onerror = () => falhou(new Error('A conexão caiu no meio da subida. Tente de novo.'));
    x.onabort = () => falhou(new Error('A subida foi interrompida.'));
    x.send(arquivo);
  });
}

// sobe a fila um por vez; arquivo recusado mostra o erro dele e os outros seguem
export async function subirFila(envio, fila, aoMudar = () => {}) {
  let atual = envio;
  const falhas = [];
  for (const it of fila) {
    it.estado = 'subindo';
    it.pct = 0;
    aoMudar(it);
    try {
      const novo = await subirArquivo(envio.id, it.arquivo, (pct) => { it.pct = pct; aoMudar(it); });
      if (novo?.id) atual = novo;
      it.estado = 'ok';
      aoMudar(it);
    } catch (e) {
      it.estado = 'erro';
      it.erro = e.message;
      aoMudar(it);
      // 21/10: o status vai junto (404 = o envio sumiu, 409 = entrou em aprovação no meio): a tela recarrega
      falhas.push({ nome: it.arquivo.name, erro: e.message, ...(e.status ? { status: e.status } : {}) });
      if (e.parar) break;
      // envio apagado ou travado no meio: os próximos dariam o mesmo erro
      if (e.status === 404 || e.status === 409) {
        for (const resto of fila.slice(fila.indexOf(it) + 1)) {
          resto.estado = 'erro';
          resto.erro = 'Não subiu: o envio mudou no meio da subida.';
          aoMudar(resto);
          falhas.push({ nome: resto.arquivo.name, erro: resto.erro, status: e.status });
        }
        break;
      }
    }
  }
  return { envio: atual, falhas };
}

// ── fila na tela ──
const chaveDe = (f) => `${f.name}|${f.size}|${f.lastModified}`;
// itens: { chave, arquivo, estado: espera | recusado | subindo | ok | erro, pct, erro }
export function novosItens(arquivos, { fila = [], jaTem = 0 } = {}) {
  const itens = [];
  let foraDoLimite = 0;
  const vale = (x) => x.estado !== 'recusado' && x.estado !== 'erro';
  let conta = jaTem + fila.filter(vale).length;
  for (const f of arquivos) {
    const chave = chaveDe(f);
    if ([...fila, ...itens].some((x) => x.chave === chave)) continue;
    const erro = conferirArquivo(f);
    if (erro) { itens.push({ chave, arquivo: f, estado: 'recusado', erro }); continue; }
    if (conta >= MAX_ARQUIVOS) { foraDoLimite++; continue; }
    conta++;
    itens.push({ chave, arquivo: f, estado: 'espera', pct: 0 });
  }
  return { itens, foraDoLimite };
}
export const avisoLimite = (n) => (n ? `Até ${MAX_ARQUIVOS} arquivos por envio: ${n === 1 ? '1 ficou de fora' : `${n} ficaram de fora`}.` : '');

function barraHtml(it) {
  return `<div class="progresso env-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${it.pct ?? 0}" aria-label="${esc(`Subindo ${it.arquivo.name}`)}"><i style="width:${it.pct ?? 0}%"></i></div>`;
}
const META = { espera: '', subindo: 'Subindo', ok: 'Subiu', recusado: '', erro: '' };
export function itemHtml(it, { podeTirar = true } = {}) {
  const f = it.arquivo;
  const tipo = tipoDe(f.type, f.name);
  const meta = it.estado === 'recusado' || it.estado === 'erro' ? it.erro
    : `${fmtTamanho(f.size)}${META[it.estado] ? ` · ${META[it.estado]}${it.estado === 'subindo' ? ` ${it.pct ?? 0}%` : ''}` : ''}`;
  const tira = podeTirar && (it.estado === 'espera' || it.estado === 'recusado');
  return `
    <li class="env-item" data-chave="${esc(it.chave)}" data-estado="${esc(it.estado)}">
      <span class="env-item-ico">${it.estado === 'ok' ? icone('check', 16) : iconeArquivo(tipo, 16)}</span>
      <span class="env-item-info">
        <span class="env-item-nome">${esc(f.name)}</span>
        <span class="env-item-meta">${esc(meta)}</span>
        ${it.estado === 'subindo' ? barraHtml(it) : ''}
      </span>
      ${tira ? `<button type="button" class="btn btn-sm btn-fantasma" data-env-tirar-item="${esc(it.chave)}" aria-label="${esc(`Tirar ${f.name}`)}">Tirar</button>` : ''}
    </li>`;
}
// progresso muda só a barra e o texto; mudança de estado troca a linha
export function atualizarItem(lista, it, opcoes) {
  const li = lista?.querySelector(`[data-chave="${CSS.escape(it.chave)}"]`);
  if (!li) return;
  const barra = li.querySelector('[role="progressbar"]');
  if (it.estado === 'subindo' && li.dataset.estado === 'subindo' && barra) {
    barra.setAttribute('aria-valuenow', String(it.pct ?? 0));
    barra.firstElementChild.style.width = `${it.pct ?? 0}%`;
    li.querySelector('.env-item-meta').textContent = `${fmtTamanho(it.arquivo.size)} · Subindo ${it.pct ?? 0}%`;
    return;
  }
  li.outerHTML = itemHtml(it, opcoes);
}

// ── arrastar e soltar ──
const temArquivos = (e) => [...(e.dataTransfer?.types ?? [])].includes('Files');
export function ligarSoltar(alvo, aoSoltar, ativo = () => true) {
  let dentro = 0;
  const sai = () => { dentro = 0; alvo.classList.remove('arrastando'); };
  alvo.addEventListener('dragenter', (e) => {
    if (!temArquivos(e) || !ativo()) return;
    e.preventDefault();
    dentro++;
    alvo.classList.add('arrastando');
  });
  alvo.addEventListener('dragover', (e) => {
    if (!temArquivos(e) || !ativo()) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });
  alvo.addEventListener('dragleave', (e) => {
    if (!temArquivos(e)) return;
    dentro = Math.max(0, dentro - 1);
    if (!dentro) alvo.classList.remove('arrastando');
  });
  alvo.addEventListener('drop', (e) => {
    if (!temArquivos(e)) return;
    e.preventDefault();
    sai();
    if (ativo()) aoSoltar([...e.dataTransfer.files]);
  });
}
// arquivo solto fora da área abriria no navegador e levaria o que foi escrito: dentro do painel de envio, não abre
export function segurarSoltarFora(painel) {
  const segura = (e) => { if (temArquivos(e) && painel.querySelector('[data-env-soltar]')) e.preventDefault(); };
  painel.ondragover = segura;
  painel.ondrop = segura;
}
// 21/10 (revisão do upload): solto fora do painel (no véu, no menu, na página de trás), o navegador abria o arquivo na
// aba e o painel de subir sumia com o que estava escrito. Com um painel de envio aberto, a página inteira segura o
// arquivo e mostra que ali não solta (as áreas de soltar já trataram o evento antes de ele chegar aqui)
const painelDeEnvioAberto = () => Boolean(document.querySelector('#painel:not([hidden]) :is(#env-form, [data-envio-id])'));
document.addEventListener('dragover', (e) => {
  if (e.defaultPrevented || !temArquivos(e) || !painelDeEnvioAberto()) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'none';
});
document.addEventListener('drop', (e) => {
  if (e.defaultPrevented || !temArquivos(e) || !painelDeEnvioAberto()) return;
  e.preventDefault();
});

// ── prévia dos arquivos já subidos ──
export function arquivosHtml(arquivos = [], { tirar = false } = {}) {
  if (!arquivos.length) return '<p class="dt-vazio">Nenhum arquivo ainda.</p>';
  return `<ul class="env-arquivos">${arquivos.map((f) => {
    const tipo = tipoDe(f.tipo, f.nome);
    const url = esc(f.url);
    const midia = tipo === 'imagem'
      ? `<a class="env-arq-midia" href="${url}" target="_blank" rel="noopener" title="Abrir em tamanho real"><img loading="lazy" src="${url}" alt="${esc(f.nome)}" /></a>`
      : tipo === 'video'
        ? `<div class="env-arq-midia"><video controls preload="metadata" playsinline src="${url}" aria-label="${esc(f.nome)}"></video></div>`
        : `<div class="env-arq-midia env-arq-doc">${iconeArquivo(tipo, 34)}<a class="btn btn-sm" href="${url}" target="_blank" rel="noopener">${icone('externo', 14)}${tipo === 'pdf' ? 'Abrir PDF' : 'Abrir arquivo'}</a></div>`;
    return `
      <li class="env-arq card">
        ${midia}
        <div class="env-arq-pe">
          <span class="env-arq-info"><span class="env-arq-nome">${esc(f.nome)}</span><span class="env-arq-tam">${esc(fmtTamanho(f.tamanho))}</span></span>
          ${tirar ? `<button type="button" class="btn btn-sm btn-fantasma btn-perigo" data-env-tirar="${esc(f.id)}" aria-label="${esc(`Tirar ${f.nome}`)}">Tirar</button>` : ''}
        </div>
      </li>`;
  }).join('')}</ul>`;
}

// ── painel "Subir arquivos pra aprovação" ──
// aoTerminar(envio, falhas, { painelAberto }) depois de criar o envio e subir a fila
export function abrirSubir({ aoTerminar }) {
  const st = { fila: [], subindo: false };
  const painel = abrirPainel(`
    <div class="painel-topo">
      <div class="dt-cabeca">
        <h2>Subir arquivos pra aprovação</h2>
        <p>Imagem, PDF ou vídeo com um título e a base. Depois de subir, é só mandar pra aprovação.</p>
      </div>
      ${BTN_FECHAR}
    </div>
    <form class="painel-corpo env-form" id="env-form" novalidate>
      <label class="rotulo">Título
        <input class="campo" name="titulo" type="text" maxlength="${LIM.titulo}" required autocomplete="off" placeholder="O que é este envio" />
      </label>
      <div class="env-campo">
        <label class="rotulo">Base
          <textarea class="campo" name="base" rows="5" maxlength="${LIM.base}" required aria-describedby="env-base-dica"></textarea>
        </label>
        <p class="env-dica" id="env-base-dica">${esc(DICA_BASE)}</p>
      </div>
      <fieldset class="env-grupo">
        <legend>Arquivos</legend>
        <div class="env-soltar" data-env-soltar>
          <span class="env-soltar-ico">${icone('baixar', 22)}</span>
          <p><b>Arraste os arquivos pra cá</b> ou</p>
          <input class="env-input" type="file" id="env-escolher" multiple accept="${esc(ACEITA)}" aria-describedby="env-arquivos-dica" />
          <label class="btn btn-sm" for="env-escolher">${icone('pasta', 14)}Escolher arquivos</label>
          <p class="env-dica" id="env-arquivos-dica">${esc(DICA_ARQUIVOS)}</p>
        </div>
        <p class="env-aviso" id="env-aviso" role="status" aria-live="polite"></p>
        <ul class="env-fila" id="env-fila"></ul>
      </fieldset>
    </form>
    <div class="painel-rodape">
      <button type="submit" form="env-form" class="btn btn-primario" id="env-subir">${icone('mais', 16)}<span>Subir arquivos</span></button>
      <button type="button" class="btn" id="env-cancelar" data-fechar>Cancelar</button>
    </div>`);
  if (!painel) return;
  segurarSoltarFora(painel);
  const q = (s) => painel.querySelector(s);
  const form = q('#env-form');
  const lista = q('#env-fila');
  const avisoEl = q('#env-aviso');
  const aviso = (txt, tipo = 'erro') => { avisoEl.textContent = txt; avisoEl.dataset.tipo = tipo; };
  const desenharFila = () => {
    lista.innerHTML = st.fila.map((it) => itemHtml(it, { podeTirar: !st.subindo })).join('');
  };
  const adicionar = (arquivos) => {
    if (st.subindo || !arquivos.length) return;
    const { itens, foraDoLimite } = novosItens(arquivos, { fila: st.fila });
    st.fila.push(...itens);
    aviso(avisoLimite(foraDoLimite));
    desenharFila();
  };
  q('#env-escolher').onchange = (e) => { adicionar([...e.target.files]); e.target.value = ''; };
  ligarSoltar(q('[data-env-soltar]'), adicionar, () => !st.subindo);
  lista.onclick = (e) => {
    const b = e.target instanceof Element ? e.target.closest('[data-env-tirar-item]') : null;
    if (!b || st.subindo) return;
    st.fila = st.fila.filter((x) => x.chave !== b.dataset.envTirarItem);
    aviso('');
    desenharFila();
  };
  const travar = (sim) => {
    painel.querySelectorAll('input, textarea, button:not([data-fechar]), #env-cancelar').forEach((el) => (el.disabled = sim));
    q('[data-env-soltar]').classList.toggle('travado', sim);
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (st.subindo) return;
    const campoTitulo = q('[name="titulo"]');
    const campoBase = q('[name="base"]');
    const titulo = campoTitulo.value.trim();
    const base = campoBase.value.trim();
    if (!titulo) { aviso('Escreva o título.'); campoTitulo.focus(); return; }
    if (!base) { aviso('Escreva a base.'); campoBase.focus(); return; }
    const fila = st.fila.filter((x) => x.estado === 'espera');
    if (!fila.length) { aviso(st.fila.length ? 'Nenhum dos arquivos escolhidos entra: escolha outro.' : 'Escolha pelo menos um arquivo.'); return; }
    st.subindo = true;
    st.fila = fila;
    aviso('');
    travar(true);
    desenharFila();
    lista.scrollIntoView({ block: 'nearest' });
    const rotulo = q('#env-subir span');
    rotulo.textContent = 'Criando o envio';
    let envio;
    try {
      envio = await api('POST', '/api/envios', { titulo, base });
    } catch (err) {
      st.subindo = false;
      travar(false);
      desenharFila();
      rotulo.textContent = 'Subir arquivos';
      aviso(err.message);
      return;
    }
    // 21/10 (revisão do upload): o número sai da posição do arquivo na fila, não da contagem de eventos (o 0% chega
    // mais de uma vez e o rótulo pulava pra "Subindo 3 de 2")
    const res = await subirFila(envio, fila, (it) => {
      if (it.estado === 'subindo') rotulo.textContent = `Subindo ${fila.indexOf(it) + 1} de ${fila.length}`;
      atualizarItem(lista, it, { podeTirar: false });
    });
    st.subindo = false;
    // o painel pode ter sido fechado no meio: aí a subida terminou por trás e só avisa
    aoTerminar(res.envio, res.falhas, { painelAberto: Boolean(form.isConnected && !painel.hidden) });
  };
  q('[name="titulo"]').focus();
}
