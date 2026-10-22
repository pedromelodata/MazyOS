// Aprovações técnicas (21/10/2026, Pedro). A aba onde o Diretor contábil confere cada peça de feed (reel,
// carrossel ou estático) antes de ir ao ar: o roteiro inteiro em Hook, Desenvolvimento e CTA, a legenda, as
// fontes, o vídeo final e a explicação técnica (por que o post existe e o objetivo). Ele aprova ou ajusta:
// ajustar é escrever o que mudar e, se quiser, editar o texto ali mesmo. Salvo, a peça sai da lista e volta
// pro cronograma com a bandeira amarela. Dados de GET /api/aprovacoes (não usa o /api/estado: o Diretor só
// enxerga esta aba). O time (Admin e Operador) vê a mesma lista, sem os botões de decidir.
// 21/10 (Pedro): o time também sobe arquivos direto aqui (imagem, PDF ou vídeo) com um título e uma base e manda pra
// aprovação. O envio (r.envio) entra nas mesmas listas e decisões da peça; o painel dele é o pintarEnvio, e o upload
// fica em ../envios.js
// 21/10 (Pedro): aprovação em 2 etapas. Primeiro os gerentes (Gerente de Marketing: os dois aprovam, cada um do seu
// lado), depois o Diretor contábil (a aprovação de um diretor fecha). O gerente vê "Esperando os gerentes" com Aprovar
// e Ajustar (se já aprovou, só espera o outro) e "Com o Diretor contábil" só pra ler; o diretor vê só a etapa dele.
// Quem tem ajustaDepoisDeAprovada (o Mauro) ajusta também o que já foi aprovado. O painel mostra a trilha: cada
// gerente com check ou relógio e depois o Diretor contábil (trilhaHtml, usada também no painel da peça)
import {
  esc, api, icone, toast, abrirPainel, fecharPainel, BTN_FECHAR, fmtData, blocosRoteiro, roteiroTresHtml, pillBloco, blocoInfo,
  pecaInfo, store, ehDiretor, ehGerente, recarregar, navegar, NOME_PAPEL, infoAprovacao, papelAtual,
  etapaAprovacao, aprovaramGerentes, gerentesDe, gerentesFaltando, minhaVez, lembrarGerentes, juntarNomes, quandoAprovacao,
} from '../core.js';
import {
  abrirSubir, arquivosHtml, ligarSoltar, segurarSoltarFora, novosItens, avisoLimite, subirFila, itemHtml, atualizarItem,
  ACEITA, MAX_ARQUIVOS, DICA_BASE,
} from '../envios.js';

const tem = (v) => Boolean(String(v ?? '').trim());
const est = {
  dados: null, erro: null, carregando: false, abertoId: null, ajustando: false, editando: false, enviando: false,
  // envio de arquivos: edição do título e da base, arquivos que não subiram ({ id, lista }) e a fila do
  // "Adicionar arquivos" ({ id, itens }; uma subida por vez)
  editandoEnvio: false, falhas: null, subindo: null,
  // 21/10: #/aprovacoes?abrir=<id> (o painel da peça leva o gerente direto pra decidir): abre depois de carregar
  abrirDepois: null,
  // 21/10 (Pedro): "Decididas nos últimos 30 dias" aberta continua aberta quando a lista redesenha (depois de cada ação)
  recentesAberto: false,
};
let raiz = null;

const urlVideo = (arquivo) => '/videos/' + String(arquivo).split('/').map(encodeURIComponent).join('/');
const diasAte = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return null;
  const h = new Date();
  return Math.round((new Date(+m[1], +m[2] - 1, +m[3]) - new Date(h.getFullYear(), h.getMonth(), h.getDate())) / 86400000);
};
function prazo(iso) {
  const d = diasAte(iso);
  if (d == null) return 'sem data';
  if (d < 0) return `era pra ${fmtData(iso)}`;
  if (d === 0) return 'posta hoje';
  if (d === 1) return 'posta amanhã';
  return `posta em ${d} dias`;
}
const quando = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');
// a peça fala no feminino, o envio no masculino
const oa = (r) => (r?.envio ? 'o' : 'a');

export async function render(root) {
  raiz = root;
  const pedido = new URLSearchParams(location.hash.split('?')[1] ?? '').get('abrir');
  if (pedido) {
    est.abrirDepois = pedido;
    history.replaceState(null, '', '#/aprovacoes');
  }
  desenhar();
  // a lista da última visita aparece na hora e a de agora chega por cima (outro gerente pode ter aprovado no meio);
  // quem chega pra decidir uma peça espera a de agora
  if (pedido || !est.carregando) await carregar();
  if (est.abrirDepois && est.dados) {
    const id = est.abrirDepois;
    est.abrirDepois = null;
    if (achar(id)) abrir(id);
    else toast('Essa peça não está mais esperando aqui.');
  }
}

async function carregar() {
  est.carregando = true;
  try {
    est.dados = await api('GET', '/api/aprovacoes');
    lembrarGerentes(est.dados);
    est.erro = null;
    // o contador do menu (main.js) usa a mesma lista, sem outra ida ao servidor
    window.dispatchEvent(new CustomEvent('aprovacoes:dados', { detail: est.dados }));
  } catch (e) {
    est.erro = e.message;
  } finally {
    est.carregando = false;
  }
  if (raiz?.isConnected) desenhar();
}

// ── lista ──
// a linha de baixo do cartão: o que falta e quem mandou
function situacaoHtml(r, decidido) {
  const a = r.aprovacao ?? {};
  const info = infoAprovacao(r);
  // envio de arquivos ainda não mandado: rascunho
  if (r.envio && !a.estado) return `<span class="apv-card-situacao">${icone('editar', 14)}Rascunho: falta mandar pra aprovação</span>`;
  if (decidido || a.estado !== 'pendente') {
    return `<span class="apv-card-situacao" data-estado="${esc(a.estado ?? '')}">${icone(info?.icone ?? 'bandeira', 14)}${esc(info?.dica ?? '')}</span>`;
  }
  const etapa = etapaAprovacao(a);
  const vez = minhaVez(r);
  const ja = aprovaramGerentes(a).map((x) => x.nome).filter(Boolean);
  const faltam = gerentesFaltando(r).map((g) => g.nome).filter(Boolean);
  const mandou = [`Mandad${oa(r)} por ${a.enviadoPor ?? ''} ${quando(a.enviadoEm)}`.trim(), a.rodada > 1 ? `${a.rodada}ª vez` : ''].filter(Boolean).join(' · ');
  // o diretor só recebe o que está com ele: o cartão diz quem dos gerentes já aprovou
  if (ehDiretor()) {
    return `
      <span class="apv-card-situacao" data-estado="pendente">${icone('relogio', 14)}${esc(ja.length ? `Gerentes aprovaram: ${juntarNomes(ja)}` : 'Esperando a sua aprovação')}</span>
      <span class="apv-card-meta">${esc(mandou)}</span>`;
  }
  // a etapa em destaque; "Falta você" quando é a vez de quem está vendo
  const vezTxt = vez === 'decidir' ? (etapa === 'gerentes' ? 'Falta você' : 'Sua vez') : vez === 'aguardar' ? 'Você já aprovou' : '';
  const quemFalta = etapa === 'gerentes' && vez !== 'decidir' && faltam.length ? `Falta${faltam.length > 1 ? 'm' : ''} ${juntarNomes(faltam)}` : '';
  const meta = [
    etapa === 'gerentes' && ja.length && vez !== 'aguardar' ? `${juntarNomes(ja)} já ${ja.length === 1 ? 'aprovou' : 'aprovaram'}` : '',
    etapa === 'diretor' && ja.length ? `Gerentes: ${juntarNomes(ja)}` : '',
    mandou,
  ].filter(Boolean).join(' · ');
  return `
      <span class="apv-card-situacao" data-estado="pendente" data-etapa="${esc(etapa)}">${icone('relogio', 14)}${esc(info?.nome ?? '')}${vezTxt ? `<b class="apv-vez">${esc(vezTxt)}</b>` : ''}${quemFalta ? `<span class="apv-falta">${esc(quemFalta)}</span>` : ''}</span>
      <span class="apv-card-meta">${esc(meta)}</span>`;
}

function cartaoHtml(r, decidido = false) {
  const p = pecaInfo(r.peca) ?? pecaInfo('reel');
  const a = r.aprovacao ?? {};
  const d = diasAte(r.data);
  const urgente = !decidido && d != null && d <= 1;
  // a vez em destaque é do gerente (pro diretor, tudo que está na lista dele é a vez dele)
  const vez = decidido || ehDiretor() ? null : minhaVez(r);
  // o envio não tem peça, bloco, pilar nem data: a pílula conta os arquivos
  const topo = r.envio
    ? `<span class="pill pill-peca">${icone('pasta', 13)}Arquivos · ${(r.arquivos ?? []).length}</span>
        <span class="apv-prazo">${icone('calendario', 13)}sem data</span>`
    : `<span class="pill pill-peca">${icone(p.icone, 13)}${esc(p.nome)}</span>
        ${pillBloco(r.bloco, { tam: 12 })}${r.pilar ? `<span class="pill">Pilar ${r.pilar.id}</span>` : ''}
        <span class="apv-prazo${urgente ? ' urgente' : ''}">${icone('calendario', 13)}${r.data ? esc(fmtData(r.data, { diaSemana: true })) : 'sem data'} · ${esc(prazo(r.data))}</span>`;
  return `
    <button type="button" class="apv-card card${urgente ? ' urgente' : ''}" data-apv="${esc(r.id)}" data-estado="${esc(a.estado ?? '')}"${vez ? ` data-vez="${esc(vez)}"` : ''}>
      <span class="apv-card-topo">
        ${topo}
      </span>
      <strong class="apv-card-titulo">${esc(r.envio ? r.titulo ?? r.ideia : r.ideia)}</strong>
      ${situacaoHtml(r, decidido)}
    </button>`;
}

const listaHtml = (itens, decidido = false) => `<div class="apv-lista">${itens.map((r) => cartaoHtml(r, decidido)).join('')}</div>`;

function desenhar() {
  if (!raiz) return;
  const d = est.dados;
  const diretor = ehDiretor();
  const gerente = ehGerente();
  const sub = diretor
    ? 'Cada peça chega aqui depois dos gerentes e antes de ir ao ar. Leia o roteiro e a explicação técnica e aprove ou peça um ajuste. A aprovação de um Diretor contábil fecha.'
    : gerente
      ? 'Você faz a primeira aprovação: os dois gerentes aprovam, cada um do seu lado, e a peça segue pro Diretor contábil. Mande peças pelo painel delas ou suba arquivos aqui mesmo.'
      : 'Toda peça de feed e todo envio de arquivos passam pelos gerentes e depois pelo Diretor contábil. Mande pela peça, de preferência um dia antes de postar, ou suba arquivos aqui mesmo.';
  const topo = `
    <header class="apv-topo">
      <div>
        <h1>Aprovações técnicas</h1>
        <p class="apv-sub">${sub}</p>
      </div>
      ${diretor ? '' : `<button type="button" class="btn btn-primario" data-apv-subir>${icone('mais', 16)}Subir arquivos</button>`}
    </header>`;
  const ligarSubir = () => {
    const b = raiz.querySelector('[data-apv-subir]');
    if (b) b.onclick = abrirSubirArquivos;
  };
  if (est.erro && !d) {
    raiz.innerHTML = `${topo}<div class="card vazio"><strong>Não consegui carregar as aprovações</strong><p>${esc(est.erro)}</p><button class="btn" data-apv-tentar>Tentar de novo</button></div>`;
    raiz.querySelector('[data-apv-tentar]').onclick = () => { est.erro = null; desenhar(); carregar(); };
    ligarSubir();
    return;
  }
  if (!d) {
    raiz.innerHTML = `${topo}<div class="apv-lista" aria-busy="true">${'<div class="apv-card card apv-esq"><span class="fx-esq"></span><span class="fx-esq"></span></div>'.repeat(3)}</div>`;
    ligarSubir();
    return;
  }
  const pend = d.pendentes ?? [];
  // 21/10: arquivos subidos que ainda não estão em aprovação (rascunho, ajuste ou mudou depois de aprovado). Só o time.
  // O envio com ajuste já aparece ali com a decisão: não repete em "Decididas"
  const envs = diretor ? [] : d.envios ?? [];
  const rec = (d.recentes ?? []).filter((r) => !envs.some((e) => e.id === r.id));
  const contador = (n) => `<span class="dt-contador">${n}</span>`;
  let secoesPend;
  if (diretor) {
    // o servidor já manda só o que está na etapa do diretor
    secoesPend = `
    <section class="apv-secao">
      <h2 class="bloco-titulo">Esperando a sua aprovação${contador(pend.length)}</h2>
      ${pend.length ? listaHtml(pend)
        : `<div class="card vazio apv-vazio">${icone('escudo', 22)}<strong>Nada esperando aprovação</strong><p>Quando os gerentes aprovarem uma peça, ela aparece aqui.</p></div>`}
    </section>`;
  } else {
    const comGerentes = pend.filter((r) => etapaAprovacao(r.aprovacao) === 'gerentes');
    const comDiretor = pend.filter((r) => etapaAprovacao(r.aprovacao) === 'diretor');
    // o gerente vê primeiro o que falta ele aprovar
    if (gerente) comGerentes.sort((a, b) => (minhaVez(a) === 'decidir' ? 0 : 1) - (minhaVez(b) === 'decidir' ? 0 : 1));
    const minhas = gerente ? comGerentes.filter((r) => minhaVez(r) === 'decidir').length : 0;
    secoesPend = `
    <section class="apv-secao">
      <h2 class="bloco-titulo">Esperando os gerentes${contador(comGerentes.length)}${minhas ? `<span class="apv-minhas">Falta você em ${minhas}</span>` : ''}</h2>
      ${comGerentes.length ? listaHtml(comGerentes)
        : `<div class="card vazio apv-vazio">${icone('escudo', 22)}<strong>Nada esperando os gerentes</strong><p>${gerente ? 'Quando o time mandar uma peça ou um envio, aparece aqui pra você aprovar.' : 'Mande uma peça pelo botão "Enviar para aprovação" no painel dela.'}</p></div>`}
    </section>
    <section class="apv-secao">
      <h2 class="bloco-titulo">Com o Diretor contábil${contador(comDiretor.length)}</h2>
      ${comDiretor.length ? listaHtml(comDiretor) : '<p class="apv-nenhum">Nada com o Diretor contábil agora.</p>'}
    </section>`;
  }
  raiz.innerHTML = `
    ${topo}
    ${secoesPend}
    ${envs.length ? `
    <section class="apv-secao">
      <h2 class="bloco-titulo">Arquivos subidos${contador(envs.length)}</h2>
      ${listaHtml(envs, true)}
    </section>` : ''}
    ${rec.length ? `
    <details class="apv-secao apv-recentes"${est.recentesAberto ? ' open' : ''}>
      <summary class="bloco-titulo">Decididas nos últimos 30 dias${contador(rec.length)}</summary>
      ${listaHtml(rec, true)}
    </details>` : ''}`;
  raiz.querySelectorAll('[data-apv]').forEach((b) => (b.onclick = () => abrir(b.dataset.apv)));
  const recentes = raiz.querySelector('.apv-recentes');
  if (recentes) recentes.ontoggle = () => { est.recentesAberto = recentes.open; };
  ligarSubir();
}

// ── painel da peça ──
const achar = (id) => [...(est.dados?.pendentes ?? []), ...(est.dados?.envios ?? []), ...(est.dados?.recentes ?? [])].find((x) => x.id === id);
// o painel aberto é desta peça ou deste envio? (depois de uma ação ou de uma subida, só repinta se ainda estiver na tela)
const itemNaTela = (id) => document.querySelector(`#painel:not([hidden]) [data-apv-id="${CSS.escape(id)}"]`);

export function explicacaoHtml(txt) {
  if (!tem(txt)) return '<p class="dt-vazio">Sem explicação técnica.</p>';
  // "Por que este post:", "Base técnica:" e "Objetivo:" viram rótulos; o resto fica como veio
  const linhas = String(txt).split(/\n+/).map((l) => l.replace(/\*\*/g, '').trim()).filter(Boolean);
  return `<div class="apv-explicacao">${linhas.map((l) => {
    const m = /^(Por que este post|Base técnica|Objetivo)\s*:\s*(.*)$/i.exec(l);
    if (m) return `<p><b>${esc(m[1])}:</b>${m[2] ? ` ${esc(m[2])}` : ''}</p>`;
    // "Sem fato na base" é o que o diretor mais precisa ver: fica em destaque
    const classe = l.startsWith('•') ? (/sem fato na base/i.test(l) ? 'apv-item alerta' : 'apv-item') : '';
    return `<p${classe ? ` class="${classe}"` : ''}>${esc(l)}</p>`;
  }).join('')}</div>`;
}

// 21/10 (Pedro): a trilha da aprovação. 1 Gerentes (cada um com check ou relógio), 2 Diretor contábil (um basta).
// Só pra quem está em aprovação ou aprovado; peça antiga sem etapa dos gerentes mostra que foi direto pro diretor
export function trilhaHtml(r) {
  const a = r?.aprovacao;
  if (!a || !['pendente', 'aprovado'].includes(a.estado)) return '';
  const etapa = etapaAprovacao(a);
  const ja = aprovaramGerentes(a);
  const precisam = gerentesDe(r);
  const eu = store.usuario?.id;
  let gerentes = ja.map((x) => ({ id: x.id, nome: x.nome, ok: x }));
  if (etapa === 'gerentes') {
    // na etapa deles: todos os que precisam, na ordem do servidor, com quem já aprovou marcado
    const lista = (precisam ?? []).map((g) => ({ id: g.id, nome: g.nome, ok: ja.find((x) => x.id === g.id) ?? null }));
    for (const x of ja) if (!lista.some((g) => g.id === x.id)) lista.push({ id: x.id, nome: x.nome, ok: x });
    gerentes = lista;
  }
  const pessoa = (g) => `
          <li class="apv-pessoa" data-ok="${g.ok ? 'sim' : 'nao'}">
            <span class="apv-pessoa-ico">${icone(g.ok ? 'check' : 'relogio', 14)}</span>
            <span class="apv-pessoa-nome">${esc(g.nome || 'Gerente')}${g.id && g.id === eu ? ' <small>(você)</small>' : ''}</span>
            <span class="apv-pessoa-quando">${g.ok ? `aprovou${g.ok.em ? ` ${esc(quandoAprovacao(g.ok.em))}` : ''}` : 'falta aprovar'}</span>
          </li>`;
  const notaGerentes = etapa === 'gerentes'
    ? (precisam ? 'Esperando os gerentes.' : 'Esperando os gerentes aprovarem.')
    : 'Sem a etapa dos gerentes: foi direto pro Diretor contábil.';
  const listaG = gerentes.length ? `<ul class="apv-pessoas">${gerentes.map(pessoa).join('')}</ul>` : '';
  // sem a lista de quem precisa (ainda não chegou), avisa que falta alguém
  const faltaAlguem = etapa === 'gerentes' && !precisam ? '<p class="apv-etapa-nota">Falta pelo menos mais um gerente.</p>' : '';
  const estadoG = etapa === 'gerentes' ? 'atual' : 'feito';
  const estadoD = a.estado === 'aprovado' ? 'feito' : etapa === 'diretor' ? 'atual' : 'espera';
  const marca = (estado, n) => (estado === 'feito' ? icone('check', 14) : estado === 'atual' ? icone('relogio', 14) : n);
  const SR = { feito: 'concluída', atual: 'agora', espera: 'depois' };
  const diretor = a.estado === 'aprovado'
    ? `<ul class="apv-pessoas">
          <li class="apv-pessoa" data-ok="sim">
            <span class="apv-pessoa-ico">${icone('check', 14)}</span>
            <span class="apv-pessoa-nome">${esc(a.decididoPor || 'Diretor contábil')}</span>
            <span class="apv-pessoa-quando">aprovou${a.decididoEm ? ` ${esc(quandoAprovacao(a.decididoEm))}` : ''}</span>
          </li>
        </ul>`
    : `<p class="apv-etapa-nota">${etapa === 'diretor' ? 'Esperando um Diretor contábil. A aprovação de um fecha.' : 'Depois dos gerentes. A aprovação de um Diretor contábil fecha.'}</p>`;
  return `
    <ol class="apv-trilha" aria-label="Caminho da aprovação">
      <li class="apv-etapa" data-estado="${estadoG}">
        <span class="apv-etapa-marca" aria-hidden="true">${marca(estadoG, 1)}</span>
        <div class="apv-etapa-corpo">
          <span class="apv-etapa-nome">Gerentes<span class="sr-only">, etapa ${SR[estadoG]}</span></span>
          ${listaG || `<p class="apv-etapa-nota">${notaGerentes}</p>`}${faltaAlguem}
        </div>
      </li>
      <li class="apv-etapa" data-estado="${estadoD}">
        <span class="apv-etapa-marca" aria-hidden="true">${marca(estadoD, 2)}</span>
        <div class="apv-etapa-corpo">
          <span class="apv-etapa-nome">Diretor contábil<span class="sr-only">, etapa ${SR[estadoD]}</span></span>
          ${diretor}
        </div>
      </li>
    </ol>`;
}
const trilhaSecao = (r) => {
  const t = trilhaHtml(r);
  return t ? `<section class="bloco apv-trilha-sec"><h3 class="bloco-titulo">Aprovação</h3>${t}</section>` : '';
};

function slidesHtml(c = {}) {
  const sl = [
    ...(tem(c.capa?.titulo) || tem(c.capa?.texto) ? [{ ...c.capa, nome: 'Capa', parte: 'gancho' }] : []),
    ...(c.slides ?? []).filter((s) => tem(s?.titulo) || tem(s?.texto)).map((s) => ({ ...s, nome: '', parte: 'dev' })),
    ...(tem(c.final?.titulo) || tem(c.final?.texto) ? [{ ...c.final, nome: 'CTA', parte: 'cta' }] : []),
  ];
  if (!sl.length) return '<p class="dt-vazio">sem slides</p>';
  return `<ol class="rt-blocos">${sl.map((s, i) => `
    <li class="rt-bloco" data-parte="${s.parte}">
      <div class="rt-cab"><span class="rt-rotulo">${s.nome ? `${i + 1} · ${esc(s.nome)}` : `Slide ${i + 1}`}</span></div>
      ${tem(s.titulo) ? `<p class="rt-fala">${esc(s.titulo)}</p>` : ''}
      ${tem(s.texto) ? `<p class="pc-texto">${esc(s.texto)}</p>` : ''}
    </li>`).join('')}</ol>`;
}
function arteHtml(e = {}) {
  const partes = [['headline', 'Headline', 'gancho'], ['apoio', 'Texto de apoio', 'dev'], ['cta', 'CTA', 'cta']].filter(([k]) => tem(e[k]));
  if (!partes.length) return '<p class="dt-vazio">sem arte</p>';
  return `<ol class="rt-blocos">${partes.map(([k, nome, parte]) => `
    <li class="rt-bloco" data-parte="${parte}"><div class="rt-cab"><span class="rt-rotulo">${esc(nome)}</span></div><p class="${k === 'headline' ? 'rt-fala' : 'pc-texto'}">${esc(e[k])}</p></li>`).join('')}</ol>`;
}
function videosHtml(vs = []) {
  const lista = vs.filter((v) => v && typeof v.arquivo === 'string' && v.arquivo);
  if (!lista.length) return '';
  return `
    <section class="bloco">
      <div class="bloco-titulo">Vídeo final</div>
      <div class="apv-videos">${lista.map((v) => `
        <figure class="apv-video">
          <video controls preload="metadata" playsinline src="${esc(urlVideo(v.arquivo))}"></video>
          ${tem(v.rotulo) ? `<figcaption>${esc(v.rotulo)}</figcaption>` : ''}
        </figure>`).join('')}</div>
    </section>`;
}
export function conversaHtml(conversa = []) {
  if (!conversa.length) return '';
  const ICONE = { envio: 'seta', aprovado: 'escudo', ajuste: 'bandeira', mensagem: 'balao', alterado: 'alerta' };
  return `
    <section class="bloco">
      <div class="bloco-titulo">Conversa</div>
      <ol class="apv-conversa">${conversa.map((m) => `
        <li class="apv-msg" data-tipo="${esc(m.tipo)}" data-papel="${esc(m.papel ?? '')}">
          <span class="apv-msg-ico">${icone(ICONE[m.tipo] ?? 'balao', 14)}</span>
          <div>
            <p class="apv-msg-quem"><b>${esc(m.autor ?? '')}</b> <span>${esc([NOME_PAPEL[m.papel], quando(m.em)].filter(Boolean).join(' · '))}</span></p>
            ${tem(m.texto) ? `<p class="apv-msg-texto">${esc(m.texto)}</p>` : ''}
            ${m.mudou?.length ? `<p class="apv-msg-mudou">Mudou: ${esc(m.mudou.join(', '))}</p>` : ''}
          </div>
        </li>`).join('')}</ol>
    </section>`;
}

// edição de quem ajusta: só o texto (as falas do roteiro, os slides, a arte e a legenda)
function editorHtml(r) {
  const area = (k, valor, linhas = 2) => `<textarea class="campo" data-apv-ed="${esc(k)}" rows="${linhas}">${esc(valor ?? '')}</textarea>`;
  const ro = r.roteiro ?? {};
  let corpo = '';
  if (r.peca === 'reel') {
    const cenas = ro.cenas ?? [];
    if (cenas.length) {
      const ultimaCta = tem(ro.cta) && cenas.length > 1;
      corpo = cenas.map((c, i) => {
        const nome = i === 0 ? 'Hook' : ultimaCta && i === cenas.length - 1 ? 'CTA' : 'Desenvolvimento';
        return `<label class="rotulo">${nome}${area(`cena.${i}`, c?.fala, 2)}</label>`;
      }).join('');
    } else {
      corpo = `<label class="rotulo">Hook${area('hook', ro.hook, 2)}</label>
        <label class="rotulo"><span>Desenvolvimento <small>uma fala por parágrafo</small></span>${area('desenvolvimento', ro.desenvolvimento, 6)}</label>
        <label class="rotulo">CTA${area('cta', ro.cta, 2)}</label>`;
    }
  } else if (r.peca === 'carrossel') {
    const c = r.carrossel ?? {};
    const slide = (chave, s, nome) => `<fieldset class="apv-slide"><legend>${esc(nome)}</legend><label class="rotulo">Título${area(`${chave}.titulo`, s?.titulo, 1)}</label><label class="rotulo">Texto${area(`${chave}.texto`, s?.texto, 2)}</label></fieldset>`;
    corpo = [slide('capa', c.capa, 'Capa'), ...(c.slides ?? []).map((s, i) => slide(`slide.${i}`, s, `Slide ${i + 2}`)), slide('final', c.final, 'CTA')].join('');
  } else {
    const e = r.estatico ?? {};
    corpo = `<label class="rotulo">Headline${area('headline', e.headline, 1)}</label><label class="rotulo">Texto de apoio${area('apoio', e.apoio, 3)}</label><label class="rotulo">CTA${area('ctaArte', e.cta, 1)}</label>`;
  }
  return `<div class="apv-editor">${corpo}<label class="rotulo">Legenda${area('legenda', r.legenda, 8)}</label></div>`;
}
function lerEditor(p, r) {
  const v = (k) => p.querySelector(`[data-apv-ed="${CSS.escape(k)}"]`)?.value;
  const c = {};
  if (r.peca === 'reel') {
    const cenas = r.roteiro?.cenas ?? [];
    c.roteiro = cenas.length ? { cenas: cenas.map((_, i) => ({ fala: v(`cena.${i}`) ?? '' })) } : { hook: v('hook') ?? '', desenvolvimento: v('desenvolvimento') ?? '', cta: v('cta') ?? '' };
  } else if (r.peca === 'carrossel') {
    const sl = (k) => ({ titulo: v(`${k}.titulo`) ?? '', texto: v(`${k}.texto`) ?? '' });
    c.carrossel = { capa: sl('capa'), slides: (r.carrossel?.slides ?? []).map((_, i) => sl(`slide.${i}`)), final: sl('final') };
  } else {
    c.estatico = { headline: v('headline') ?? '', apoio: v('apoio') ?? '', cta: v('ctaArte') ?? '' };
  }
  c.legenda = v('legenda') ?? '';
  return c;
}

function abrir(id) {
  const r = achar(id);
  if (!r) return;
  est.abertoId = id;
  est.ajustando = false;
  est.editando = false;
  est.editandoEnvio = false;
  est.falhas = null;
  pintarPainel(r);
}

// "Fica registrado como Pedro Maia (Gerente de Marketing)" e, pro gerente, o que acontece depois de aprovar
function assinaHtml(r, vez) {
  if (vez !== 'decidir' && !est.ajustando) return '';
  const papel = NOME_PAPEL[papelAtual()] ?? '';
  let depois = '';
  if (!est.ajustando && etapaAprovacao(r.aprovacao) === 'gerentes') {
    const outros = gerentesFaltando(r).filter((g) => g.id !== store.usuario?.id).map((g) => g.nome).filter(Boolean);
    depois = outros.length ? ` Depois de você, falta${outros.length > 1 ? 'm' : ''} ${esc(juntarNomes(outros))}.` : gerentesDe(r) ? ' Aprovando, vai pro Diretor contábil.' : '';
  }
  return `<span class="apv-assina">Fica registrado como <b>${esc(store.usuario?.nome ?? '')}</b>${papel ? ` (${esc(papel)})` : ''}.${depois}</span>`;
}
// o rodapé de quem decide (o mesmo pra peça e envio); null quando não é a vez de quem está vendo
function rodapeDecisao(r, vez) {
  if (est.ajustando) return `<button class="btn btn-primario" id="apv-salvar">${icone('bandeira', 16)} Salvar ajuste</button><button class="btn" id="apv-cancelar">Cancelar</button>`;
  if (vez === 'decidir') return `<button class="btn btn-primario" id="apv-aprovar">${icone('escudo', 16)} Aprovar</button><button class="btn" id="apv-ajustar">${icone('editar', 16)} Ajustar</button>`;
  if (vez === 'aguardar') {
    const faltam = gerentesFaltando(r).map((g) => g.nome).filter(Boolean);
    return `<button class="btn" disabled>${icone('check', 16)} Você já aprovou</button><span class="apv-rodape-nota">${faltam.length ? `Esperando ${esc(juntarNomes(faltam))}.` : 'Esperando os outros gerentes.'}</span>`;
  }
  return null;
}
const botaoAjustarAprovada = (r) => `<button class="btn" id="apv-ajustar">${icone('editar', 16)} Ajustar mesmo aprovad${oa(r)}</button>`;

function pintarPainel(r) {
  if (r.envio) return pintarEnvio(r);
  const p = pecaInfo(r.peca) ?? pecaInfo('reel');
  const a = r.aprovacao ?? {};
  const diretor = ehDiretor();
  const vez = minhaVez(r);
  const info = infoAprovacao(r);
  // a peça vai do jeito que está: sem texto escrito ainda, quem aprova vê a ideia como está no calendário
  const semTexto = `<p class="apv-ideia">${esc(r.ideia)}</p><p class="dt-vazio">O texto ainda não foi escrito: a peça foi pra aprovação do jeito que está no calendário.</p>`;
  const conteudo = r.peca === 'reel'
    ? (() => { const bl = blocosRoteiro(r.roteiro ?? {}); return bl.length ? roteiroTresHtml(bl) : semTexto; })()
    : r.peca === 'carrossel'
      ? ((r.carrossel?.capa?.titulo || (r.carrossel?.slides ?? []).length) ? slidesHtml(r.carrossel) : semTexto)
      : (r.estatico?.headline ? arteHtml(r.estatico) : semTexto);
  // 21/10 (Pedro): o planejamento da estratégia principal junto: motivo, bloco, pilar e o que o calendário diz
  const bl = blocoInfo(r.bloco);
  const planejamento = `
      <section class="bloco">
        <div class="bloco-titulo">Planejamento</div>
        ${tem(r.motivo) ? `<div class="dt-plan-tema dt-plan-motivo"><span class="dt-rotulo">Motivo</span><p>${esc(r.motivo)}</p></div>` : ''}
        <dl class="dt-plan-grade apv-plan">
          <div class="dt-plan-item"><dt>Bloco</dt><dd>${bl ? esc(`${bl.longo} (${bl.fatia}% da pauta)`) : 'sem bloco'}</dd></div>
          <div class="dt-plan-item"><dt>Pilar</dt><dd>${r.pilar ? esc(`${r.pilar.id} · ${r.pilar.nome}`) : 'sem pilar'}</dd></div>
          ${tem(r.pilarTexto) ? `<div class="dt-plan-item largo"><dt>Pilar no calendário</dt><dd>${esc(r.pilarTexto)}</dd></div>` : ''}
          ${tem(r.formatoTexto) ? `<div class="dt-plan-item largo"><dt>Formato no calendário</dt><dd>${esc(r.formatoTexto)}</dd></div>` : ''}
          ${tem(r.tema) ? `<div class="dt-plan-item largo"><dt>Tema</dt><dd>${esc(r.tema)}</dd></div>` : ''}
        </dl>
      </section>`;
  const rotuloConteudo = r.peca === 'reel' ? 'Roteiro' : r.peca === 'carrossel' ? 'Carrossel' : 'Arte';
  const fontes = (r.fontes ?? []).filter(tem);
  const aprovadaAntes = a.estado === 'aprovado' && est.ajustando
    ? `<p class="dt-apv-nota alerta">A peça já foi aprovada${a.decididoPor ? ` por ${esc(a.decididoPor)}` : ''}. Ajustando, ela volta pro time e passa de novo pela aprovação.</p>` : '';
  const corpo = est.ajustando ? `
      <section class="bloco apv-ajuste">
        <div class="bloco-titulo">O que ajustar</div>
        ${aprovadaAntes}
        <textarea class="campo" id="apv-msg" rows="4" maxlength="2000" aria-label="O que ajustar" placeholder="Escreva o ajuste pro time: o que está errado e como fica certo"></textarea>
        <label class="apv-editar"><input type="checkbox" id="apv-editar" ${est.editando ? 'checked' : ''} /> Quero editar o texto da peça eu mesmo</label>
        ${est.editando ? editorHtml(r) : ''}
      </section>` : `
      ${trilhaSecao(r)}
      <section class="bloco apv-porque">
        <div class="bloco-titulo">Explicação técnica</div>
        ${explicacaoHtml(a.explicacao)}
      </section>
      ${planejamento}
      ${videosHtml(r.videos)}
      <section class="bloco">
        <div class="bloco-titulo">${rotuloConteudo}</div>
        ${conteudo}
      </section>
      ${tem(r.legenda) ? `<section class="bloco"><div class="bloco-titulo">Legenda</div><div class="texto">${esc(r.legenda)}</div></section>` : ''}
      ${fontes.length ? `<section class="bloco"><div class="bloco-titulo">Fontes</div><ul class="apv-fontes">${fontes.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></section>` : ''}
      ${conversaHtml(a.conversa)}`;
  const abrirPeca = diretor ? '' : `<button class="btn" id="apv-abrir-peca">${icone('calendario', 16)} Abrir no cronograma</button>`;
  const rodape = rodapeDecisao(r, vez)
    ?? `${vez === 'ajustarAprovada' ? botaoAjustarAprovada(r) : ''}${abrirPeca}`;
  // repintar a mesma peça não volta a rolagem pro topo
  const rolagem = est.ajustando ? 0 : itemNaTela(r.id)?.scrollTop ?? 0;
  const painel = abrirPainel(`
    <div class="painel-topo">
      <div class="dt-cabeca apv-cabeca">
        <div class="dt-pills"><span class="pill pill-peca">${icone(p.icone, 13)}${esc(p.nome)}</span>${pillBloco(r.bloco)}<span class="pill">${icone('calendario', 13)}${r.data ? esc(fmtData(r.data, { ano: true, diaSemana: true })) : 'sem data'}</span>${info ? `<span class="pill dt-apv-pill" data-estado="${esc(info.estado)}" title="${esc(info.dica)}">${icone(info.icone, 13)}${esc(info.nome)}</span>` : ''}</div>
        <h2>${esc(r.ideia)}</h2>
      </div>
      ${BTN_FECHAR}
    </div>
    <div class="painel-corpo apv-painel" data-apv-id="${esc(r.id)}">${corpo}</div>
    ${rodape ? `<div class="painel-rodape dt-rodape">${rodape}${assinaHtml(r, vez)}</div>` : ''}`, { largo: true });
  if (!painel) return;
  if (rolagem) painel.querySelector('.painel-corpo').scrollTop = rolagem;
  painel.querySelectorAll('[data-fechar]').forEach((b) => (b.onclick = fecharPainel));
  const q = (s) => painel.querySelector(s);
  if (q('#apv-aprovar')) q('#apv-aprovar').onclick = () => decidir(r, 'aprovar', q('#apv-aprovar'));
  if (q('#apv-ajustar')) q('#apv-ajustar').onclick = () => { est.ajustando = true; pintarPainel(r); q2('#apv-msg')?.focus(); };
  if (q('#apv-cancelar')) q('#apv-cancelar').onclick = () => { est.ajustando = false; est.editando = false; pintarPainel(r); };
  if (q('#apv-editar')) q('#apv-editar').onchange = (e) => {
    const msg = q('#apv-msg').value;
    est.editando = e.target.checked;
    pintarPainel(r);
    q2('#apv-msg').value = msg;
  };
  if (q('#apv-salvar')) q('#apv-salvar').onclick = () => decidir(r, 'ajustar', q('#apv-salvar'), painel);
  if (q('#apv-abrir-peca')) q('#apv-abrir-peca').onclick = () => { fecharPainel(); navegar(`#/reel/${encodeURIComponent(r.id)}`); };
}
const q2 = (s) => document.querySelector(`#painel ${s}`);

// ── envio de arquivos (21/10, Pedro) ──
function abrirSubirArquivos() {
  abrirSubir({
    aoTerminar: (envio, falhas, { painelAberto }) => {
      carregar();
      const n = falhas.length;
      if (!painelAberto) {
        toast(`"${envio.titulo ?? ''}" subiu${n ? ` com ${n} ${n === 1 ? 'arquivo recusado' : 'arquivos recusados'}` : ''}: mande pra aprovação em Arquivos subidos`);
        return;
      }
      est.abertoId = envio.id;
      est.ajustando = false;
      est.editando = false;
      est.editandoEnvio = false;
      est.falhas = n ? { id: envio.id, lista: falhas } : null;
      pintarEnvio(envio);
      toast(n ? `${n === 1 ? '1 arquivo não subiu' : `${n} arquivos não subiram`}: o motivo está no painel` : 'Arquivos subidos: agora é só mandar pra aprovação');
    },
  });
}

function pintarEnvio(r) {
  const a = r.aprovacao ?? {};
  const diretor = ehDiretor();
  const pendente = a.estado === 'pendente';
  const vez = minhaVez(r);
  const subindo = est.subindo?.id === r.id;
  // o time mexe no título, na base e nos arquivos enquanto o envio não está em aprovação
  const mexe = !diretor && !pendente && !subindo;
  const arqs = r.arquivos ?? [];
  const info = infoAprovacao(r, { masculino: true });
  const titulo = r.titulo ?? r.ideia ?? '';
  const falhas = est.falhas?.id === r.id ? est.falhas.lista : [];
  const falhasHtml = falhas.length ? `
        <div class="env-falhas" role="alert">
          <strong>${falhas.length === 1 && falhas[0].nome ? 'Um arquivo não subiu' : 'Arquivos que não subiram'}</strong>
          <ul>${falhas.map((f) => `<li>${f.nome ? `<b>${esc(f.nome)}</b>: ` : ''}${esc(f.erro)}</li>`).join('')}</ul>
        </div>` : '';
  const nota = diretor ? ''
    : a.estado === 'ajuste' ? `<p class="dt-apv-nota alerta env-nota">${esc(a.decididoPor || 'Quem aprova')} pediu um ajuste (veja a conversa). Ajuste o envio e mande de novo.</p>`
      : a.estado === 'alterado' ? '<p class="dt-apv-nota alerta env-nota">O envio mudou depois de aprovado. Mande de novo pra aprovação.</p>'
        : a.estado === 'aprovado' ? '<p class="dt-apv-nota env-nota">Mexer no título, na base ou nos arquivos faz o envio precisar de aprovação de novo.</p>' : '';
  const base = est.editandoEnvio && mexe ? `
      <section class="bloco env-edicao">
        <div class="bloco-titulo">Título e base</div>
        <label class="rotulo">Título<input class="campo" id="env-ed-titulo" type="text" maxlength="200" autocomplete="off" value="${esc(titulo)}" /></label>
        <div class="env-campo">
          <label class="rotulo">Base<textarea class="campo" id="env-ed-base" rows="6" maxlength="3000" aria-describedby="env-ed-dica">${esc(r.base ?? '')}</textarea></label>
          <p class="env-dica" id="env-ed-dica">${esc(DICA_BASE)}</p>
        </div>
      </section>` : `
      <section class="bloco apv-porque">
        <div class="bloco-titulo">Base${mexe ? `<button type="button" class="btn btn-sm" id="env-editar">${icone('editar', 14)}Editar</button>` : ''}</div>
        ${tem(r.base) ? `<p class="env-base">${esc(r.base)}</p>` : '<p class="dt-vazio">Sem base.</p>'}
      </section>`;
  const podeAdicionar = mexe && !est.editandoEnvio && arqs.length < MAX_ARQUIVOS;
  const fila = subindo ? est.subindo.itens : [];
  // 21/10 (revisão do upload): o input escondido fica fora da barra do título; lá ficam só o contador e o botão
  const arquivos = `
      <section class="bloco env-arquivos-sec"${podeAdicionar ? ' data-env-soltar' : ''}>
        <div class="bloco-titulo">Arquivos<span class="dt-contador">${diretor ? arqs.length : `${arqs.length} de ${MAX_ARQUIVOS}`}</span>${podeAdicionar ? `
          <button type="button" class="btn btn-sm env-mais" id="env-mais-btn" aria-controls="env-mais">${icone('mais', 14)}Adicionar arquivos</button>` : ''}</div>
        ${podeAdicionar ? `<input type="file" id="env-mais" multiple accept="${esc(ACEITA)}" hidden />` : ''}
        ${falhasHtml}
        ${fila.length ? `<ul class="env-fila env-fila-mais" id="env-fila-mais">${fila.map((it) => itemHtml(it, { podeTirar: false })).join('')}</ul>` : ''}
        ${arquivosHtml(arqs, { tirar: mexe && !est.editandoEnvio })}
        ${podeAdicionar ? '<p class="env-dica env-solta-dica">Dá pra arrastar arquivos pra cá também.</p>' : ''}
      </section>`;
  // no envio, ajustar é só escrever o que mudar: não tem texto de peça pra editar
  const corpo = est.ajustando ? `
      <section class="bloco apv-ajuste">
        <div class="bloco-titulo">O que ajustar</div>
        ${a.estado === 'aprovado' ? `<p class="dt-apv-nota alerta">O envio já foi aprovado${a.decididoPor ? ` por ${esc(a.decididoPor)}` : ''}. Ajustando, ele volta pro time e passa de novo pela aprovação.</p>` : ''}
        <textarea class="campo" id="apv-msg" rows="4" maxlength="2000" aria-label="O que ajustar" placeholder="Escreva o ajuste pro time: o que está errado e como fica certo"></textarea>
      </section>` : `${nota}${trilhaSecao(r)}${base}${arquivos}${conversaHtml(a.conversa)}`;
  let rodape = rodapeDecisao(r, vez);
  if (rodape == null) {
    if (diretor) {
      rodape = vez === 'ajustarAprovada' ? botaoAjustarAprovada(r) : '';
    } else if (est.editandoEnvio && mexe) {
      rodape = `<button class="btn btn-primario" id="env-salvar">${icone('check', 16)} Salvar</button><button class="btn" id="env-cancelar-ed">Cancelar</button>`;
    } else {
      const principal = pendente
        ? `<button class="btn btn-primario" disabled title="${esc(info?.dica ?? '')}">${icone('relogio', 16)} Esperando aprovação</button>`
        : a.estado === 'aprovado'
          ? `<span class="dt-apv-estado" data-estado="aprovado">${icone('escudo', 15)}${esc(info?.dica ?? 'Aprovado')}</span>${vez === 'ajustarAprovada' ? botaoAjustarAprovada(r) : ''}`
          : `<button class="btn btn-primario" id="env-enviar"${arqs.length && !subindo ? '' : ' disabled'}${arqs.length ? '' : ' aria-describedby="env-enviar-nota"'}>${icone('seta', 16)} Enviar para aprovação</button>${arqs.length ? '' : '<span class="env-rodape-nota" id="env-enviar-nota">Suba pelo menos um arquivo antes de mandar.</span>'}`;
      rodape = `${principal}${pendente ? '' : `<span class="espaco"></span><button class="btn btn-perigo" id="env-apagar"${subindo ? ' disabled' : ''}>${icone('lixo', 16)} Apagar envio</button>`}`;
    }
  }
  // repintar o mesmo envio não volta a rolagem pro topo
  const rolagem = itemNaTela(r.id)?.scrollTop ?? 0;
  const painel = abrirPainel(`
    <div class="painel-topo">
      <div class="dt-cabeca apv-cabeca">
        <div class="dt-pills">
          <span class="pill pill-peca">${icone('pasta', 13)}Arquivos · ${arqs.length}</span>
          ${info ? `<span class="pill dt-apv-pill" data-estado="${esc(info.estado)}" title="${esc(info.dica)}">${icone(info.icone, 13)}${esc(info.nome)}</span>` : '<span class="pill">Rascunho</span>'}
        </div>
        <h2>${esc(titulo)}</h2>
      </div>
      ${BTN_FECHAR}
    </div>
    <div class="painel-corpo apv-painel" data-apv-id="${esc(r.id)}" data-envio-id="${esc(r.id)}">${corpo}</div>
    ${rodape ? `<div class="painel-rodape dt-rodape">${rodape}${assinaHtml(r, vez)}</div>` : ''}`, { largo: true });
  if (!painel) return;
  const q = (s) => painel.querySelector(s);
  if (rolagem) q('.painel-corpo').scrollTop = rolagem;
  segurarSoltarFora(painel);
  // quem decide (gerente, diretor ou quem ajusta o já aprovado)
  if (q('#apv-aprovar')) q('#apv-aprovar').onclick = () => decidir(r, 'aprovar', q('#apv-aprovar'));
  if (q('#apv-ajustar')) q('#apv-ajustar').onclick = () => { est.ajustando = true; pintarEnvio(r); q2('#apv-msg')?.focus(); };
  if (q('#apv-cancelar')) q('#apv-cancelar').onclick = () => { est.ajustando = false; pintarEnvio(r); };
  if (q('#apv-salvar')) q('#apv-salvar').onclick = () => decidir(r, 'ajustar', q('#apv-salvar'), painel);
  // time
  if (q('#env-editar')) q('#env-editar').onclick = () => { est.editandoEnvio = true; pintarEnvio(r); q2('#env-ed-titulo')?.focus(); };
  if (q('#env-cancelar-ed')) q('#env-cancelar-ed').onclick = () => { est.editandoEnvio = false; pintarEnvio(r); };
  if (q('#env-salvar')) q('#env-salvar').onclick = () => salvarEnvio(r, painel, q('#env-salvar'));
  if (q('#env-enviar')) q('#env-enviar').onclick = () => mandarEnvio(r, q('#env-enviar'));
  if (q('#env-apagar')) q('#env-apagar').onclick = () => apagarEnvio(r, q('#env-apagar'));
  if (q('#env-mais-btn')) {
    q('#env-mais-btn').onclick = () => q('#env-mais').click();
    q('#env-mais').onchange = (e) => { const fs = [...e.target.files]; e.target.value = ''; adicionarAoEnvio(r, fs); };
  }
  if (q('[data-env-soltar]')) ligarSoltar(q('[data-env-soltar]'), (fs) => adicionarAoEnvio(r, fs), () => !est.subindo);
  painel.querySelectorAll('[data-env-tirar]').forEach((b) => (b.onclick = () => tirarArquivo(r, b.dataset.envTirar, b)));
}

// depois de cada ação: a lista recarrega e o painel mostra o envio novo (se ainda estiver aberto nele)
function mostrarEnvio(envio) {
  carregar();
  if (envio?.id && itemNaTela(envio.id)) pintarEnvio(envio);
}
// 21/10 (revisão do upload): 409 (alguém mudou o estado antes) ou 404 (apagado) numa ação: a lista recarrega e o
// painel mostra o item como está agora, ou fecha se ele sumiu. guardar: o texto do ajuste que estava escrito
async function recarregarDepoisDoErro(id, { guardar = '' } = {}) {
  await carregar();
  if (!itemNaTela(id)) return;
  const novo = achar(id);
  if (!novo) {
    fecharPainel();
    return;
  }
  // o ajuste que estava sendo escrito continua se ainda dá pra ajustar
  const segue = est.ajustando && ['decidir', 'ajustarAprovada'].includes(minhaVez(novo));
  if (!segue) { est.ajustando = false; est.editando = false; }
  est.editandoEnvio = false;
  pintarPainel(novo);
  if (segue && guardar && q2('#apv-msg')) q2('#apv-msg').value = guardar;
}
const errosDeEstado = (e) => e?.status === 409 || e?.status === 404;
async function acaoEnvio(botao, fn, id = null) {
  if (est.enviando) return;
  est.enviando = true;
  if (botao) botao.disabled = true;
  try {
    await fn();
  } catch (e) {
    if (botao?.isConnected) botao.disabled = false;
    toast(e.message);
    if (id && errosDeEstado(e)) await recarregarDepoisDoErro(id);
  } finally {
    est.enviando = false;
  }
}
const urlEnvio = (id) => `/api/envios/${encodeURIComponent(id)}`;

function salvarEnvio(r, painel, botao) {
  const campoTitulo = painel.querySelector('#env-ed-titulo');
  const campoBase = painel.querySelector('#env-ed-base');
  const titulo = campoTitulo?.value.trim() ?? '';
  const base = campoBase?.value.trim() ?? '';
  if (!titulo) { toast('Escreva o título.'); campoTitulo?.focus(); return; }
  if (!base) { toast('Escreva a base.'); campoBase?.focus(); return; }
  // nada mudou: só fecha a edição (aprovado continua aprovado)
  if (titulo === String(r.titulo ?? '').trim() && base === String(r.base ?? '').trim()) {
    est.editandoEnvio = false;
    pintarEnvio(r);
    return;
  }
  return acaoEnvio(botao, async () => {
    const novo = await api('PUT', urlEnvio(r.id), { titulo, base });
    est.editandoEnvio = false;
    toast(r.aprovacao?.estado === 'aprovado' ? 'Salvo: mande de novo pra aprovação' : 'Título e base salvos');
    mostrarEnvio(novo);
  }, r.id);
}

// pra onde a peça ou o envio foi depois de mandar
const destinoEnvio = (a) => (etapaAprovacao(a) === 'gerentes' ? 'está com os gerentes' : 'está com o Diretor contábil');

function mandarEnvio(r, botao) {
  return acaoEnvio(botao, async () => {
    // a base vai como a explicação técnica do envio
    const novo = await api('POST', `/api/aprovacoes/${encodeURIComponent(r.id)}/enviar`, { explicacao: r.base ?? '' });
    est.falhas = null;
    toast(`Mandado pra aprovação: agora ${destinoEnvio(novo?.aprovacao ?? { estado: 'pendente', etapa: 'gerentes' })}`);
    mostrarEnvio(novo?.envio ? novo : await api('GET', urlEnvio(r.id)));
  }, r.id);
}

function apagarEnvio(r, botao) {
  if (!confirm(`Apagar o envio "${r.titulo ?? r.ideia ?? ''}"? Os arquivos dele somem junto e não dá pra desfazer.`)) return;
  return acaoEnvio(botao, async () => {
    await api('DELETE', urlEnvio(r.id));
    if (itemNaTela(r.id)) fecharPainel();
    toast('Envio apagado');
    await carregar();
  }, r.id);
}

function tirarArquivo(r, arqId, botao) {
  const f = (r.arquivos ?? []).find((x) => x.id === arqId);
  if (!f) return;
  if (!confirm(`Tirar "${f.nome}" do envio?${r.aprovacao?.estado === 'aprovado' ? ' Depois precisa mandar de novo pra aprovação.' : ''}`)) return;
  return acaoEnvio(botao, async () => {
    const novo = await api('DELETE', `${urlEnvio(r.id)}/arquivos/${encodeURIComponent(arqId)}`);
    toast('Arquivo tirado do envio');
    mostrarEnvio(novo);
  }, r.id);
}

// "Adicionar arquivos" (ou arrastar pra seção Arquivos): sobe um por vez, com a barra de cada um no painel
async function adicionarAoEnvio(r, arquivos) {
  if (!arquivos.length) return;
  if (est.subindo) { toast('Espere a subida que está andando terminar.'); return; }
  const { itens, foraDoLimite } = novosItens(arquivos, { jaTem: (r.arquivos ?? []).length });
  const fila = itens.filter((x) => x.estado === 'espera');
  const recusados = itens.filter((x) => x.estado === 'recusado').map((x) => ({ nome: x.arquivo.name, erro: x.erro }));
  const lista = [...recusados, ...(foraDoLimite ? [{ nome: '', erro: avisoLimite(foraDoLimite) }] : [])];
  est.falhas = lista.length ? { id: r.id, lista } : null;
  est.subindo = fila.length ? { id: r.id, itens: fila } : null;
  if (itemNaTela(r.id)) pintarEnvio(r);
  if (!fila.length) return;
  const res = await subirFila(r, fila, (it) => {
    const ul = itemNaTela(r.id) ? document.getElementById('env-fila-mais') : null;
    if (ul) atualizarItem(ul, it, { podeTirar: false });
  });
  est.subindo = null;
  const todas = [...lista, ...res.falhas];
  est.falhas = todas.length ? { id: r.id, lista: todas } : null;
  const ok = fila.filter((x) => x.estado === 'ok').length;
  if (ok) toast(`${ok === 1 ? '1 arquivo subiu' : `${ok} arquivos subiram`}${res.falhas.length ? `, ${res.falhas.length} não` : ''}`);
  else if (res.falhas.length) toast(res.falhas.length === 1 ? 'O arquivo não subiu: o motivo está no painel' : 'Os arquivos não subiram: o motivo está no painel');
  // 21/10 (revisão do upload): o envio sumiu ou entrou em aprovação no meio (404/409): a lista e o painel mostram como está
  if (res.falhas.some((f) => f.status === 404 || f.status === 409)) await recarregarDepoisDoErro(r.id);
  else mostrarEnvio(res.envio);
}

// a mensagem depois de decidir, pelo que o servidor devolveu
function toastDecisao(r, acao, novo) {
  const eu = store.usuario?.nome ?? 'você';
  const o = oa(r);
  if (acao === 'ajustar') return `Ajuste de ${eu} salvo: ${r.envio ? 'o envio' : 'a peça'} voltou pro time`;
  const a = novo?.aprovacao ?? {};
  if (a.estado === 'aprovado') return `Aprovad${o} por ${eu}: ${r.envio ? 'os arquivos estão liberados' : 'a peça está pronta pra postar'}`;
  if (etapaAprovacao(a) === 'diretor') return `Aprovad${o} por ${eu}: agora está com o Diretor contábil`;
  const faltam = gerentesFaltando({ ...novo, gerentesNecessarios: novo?.gerentesNecessarios ?? r.gerentesNecessarios }).map((g) => g.nome).filter(Boolean);
  return `Aprovação de ${eu} registrada${faltam.length ? `: falta${faltam.length > 1 ? 'm' : ''} ${juntarNomes(faltam)}` : ''}`;
}

async function decidir(r, acao, botao, painel = null) {
  if (est.enviando) return;
  let corpo = {};
  const mensagem = (painel?.querySelector('#apv-msg')?.value ?? '').trim();
  if (acao === 'ajustar') {
    const conteudo = est.editando ? lerEditor(painel, r) : null;
    // no envio de arquivos o ajuste é só a mensagem (est.editando nunca liga nele)
    if (!mensagem && !conteudo) { toast(r.envio ? 'Escreva o que ajustar.' : 'Escreva o que ajustar ou edite o texto da peça.'); painel?.querySelector('#apv-msg')?.focus(); return; }
    corpo = { mensagem, ...(conteudo ? { conteudo } : {}) };
  }
  est.enviando = true;
  botao.disabled = true;
  try {
    const novo = await api('POST', `/api/aprovacoes/${encodeURIComponent(r.id)}/${acao}`, corpo);
    fecharPainel();
    toast(toastDecisao(r, acao, novo));
    est.ajustando = false;
    est.editando = false;
    await carregar();
    if (!ehDiretor() && store.E) recarregar().catch(() => {});
  } catch (e) {
    if (botao.isConnected) botao.disabled = false;
    toast(e.message);
    // 409: alguém decidiu antes (ou a etapa mudou); 404: a peça sumiu. A lista e o painel mostram como está agora
    if (errosDeEstado(e)) {
      est.enviando = false;
      await recarregarDepoisDoErro(r.id, { guardar: mensagem });
    }
  } finally {
    est.enviando = false;
  }
}

// o painel da peça (cronograma) manda pra aprovação e a lista tem que refletir na próxima visita
export function invalidar() {
  est.dados = null;
}
