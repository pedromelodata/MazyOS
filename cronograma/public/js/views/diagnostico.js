// Métricas → Diagnóstico (SPEC-METRICAS.md §5.3, 30/09/2026): metas 2× por tipo, pendências, o que os
// números mostram, pilares e mecanismos, peças, hipóteses e stories, mais o painel de um post (abrirPost).
// Decisões:
//  - a aba busca sozinha GET /api/metricas/diagnostico; buscando de novo, o desenho anterior fica na tela
//    com opacidade reduzida (nada pisca nem some) e o erro vira cartão com "Tentar de novo"
//  - todo número, pílula e gráfico sai de metricas-comum.js ("sem dado", ×, %, medidor, barra divergente,
//    tabela equivalente); nada de número inventado quando a API não manda
//  - os construtores de HTML são puros e exportados (o teste de fumaça roda no Node); o que mexe no DOM
//    fica no fim do arquivo
//  - o painel do post redesenha por região depois de cada edição: região igual não é tocada (detalhe
//    aberto continua aberto), formulário com digitação pendente não é apagado e o foco volta pro controle
//  - etiquetar com IA e ler o print: consulta a cada 3 s só com a aba (ou o painel) na tela e a janela
//    visível
//  - ?post=<midiaId> no endereço abre o painel daquele post uma vez e sai do endereço (mesmo padrão do
//    ?abrir= das ideias)
//  - texto de fora (legenda, frases, evidências) só entra escapado; link externo só https; id validado
//    antes de ir pra URL; dica de hover só pelo data-mc-dica. Evidência da IA é texto puro (nunca vira link)
// Revisão de 30/09:
//  - metas: um cartão por tipo e formato (reel; post e carrossel). O medidor da última peça usa a régua
//    dela (ultima.base e ultima.meta); a meta da próxima peça fica numa linha própria
//  - fator de peça que não bateu é truncado (vezesDaPeca): nunca "2×" ao lado de "não bateu"
//  - efeito sem grupo de comparação (todas as peças com o mesmo valor) não vira barra nem evidência
//  - público do post: só as frases e os grupos visíveis (5 pessoas ou mais) que o servidor manda; os
//    percentuais digitados só voltam no formulário. Salvar ou apagar invalida também a aba Público
//  - vincular post a peça recarrega o cronograma (o permalink da peça muda no db.json)
//  - seletor que grava (vínculo e etiqueta) não grava a cada seta do teclado: o vínculo tem botão
//    "Salvar vínculo"; a etiqueta grava na escolha com o mouse, no Enter ou ao sair do campo
//  - leitura de print é retomada ao reabrir o painel, aguenta erro de rede passageiro e não pisa no que já
//    foi digitado nem rouba o foco; falha da leitura automática (agenda) aparece em cima da aba
import {
  esc, api, icone, toast, abrirPainel, fecharPainel, BTN_FECHAR, pillTipo, tipoReel, rotuloPeca, recarregar,
} from '../core.js';
import {
  SEM_DADO, finito, num, pct, vezes, vezesDeScore, vezesDaPeca, segundos, reais, plural, dataCurta, dataHora, haQuanto,
  diaDaSemana, pillEvidencia, pillNivel, pillFonte, pillMeta, tabela, divergente, medidor, vazio, ligarDicas,
} from '../metricas-comum.js';
import { esqueletoCards, semMovimento } from '../efeitos.js';
// a aba Público guarda o próprio resumo: o público do post salvo aqui deixa o dela velho (sem ciclo:
// publico.js só importa core.js e metricas-comum.js)
import { invalidar as invalidarPublico } from './publico.js';

// ── constantes ───────────────────────────────────────────────────────────
const ID_MIDIA = /^\d{1,40}$/;
const ID_REEL = /^reel_[a-z0-9]{4,20}$/i;
const ID_DIMENSAO = /^[a-z][a-z0-9]{0,39}$/i;
const CONSULTA_MS = 3000;
// dado com mais de 2 minutos: a aba mostra o que tem e busca de novo por baixo
const VELHO_MS = 120_000;
const PAGINA = 20;
const MB = 1024 * 1024;
// o print vai inteiro num corpo JSON: a tela confere 12 MiB no corpo todo e o servidor aceita esse teto com
// folga pro JSON (12 MiB + 64 KiB, metricas-rotas.mjs); cada imagem até 4 MiB
export const PRINT_MAX_CORPO = 12 * MB;
export const PRINT_MAX_IMAGEM = 4 * MB;
const IDADE_REF_H = 168;
const DIA_MS = 86_400_000;
// erro de rede ou 5xx na consulta do print: tenta de novo com espera maior antes de desistir
const PRINT_TENTATIVAS = 3;
const TAREFAS_AGENDA = ['sincronizar', 'hipoteses', 'stories', 'publico', 'anuncios', 'relatorio'];
const ROTULO_TAREFA = {
  sincronizar: 'Ler os posts do Instagram', hipoteses: 'Avaliar as hipóteses', stories: 'Capturar os stories',
  publico: 'Ler o público da conta', anuncios: 'Ler os anúncios', relatorio: 'Gerar o resumo semanal',
};
const ROTULO_FORMATO = { reel: 'Reels', feed: 'Posts e carrosséis' };

const ETAPAS = {
  objetivo: 'Objetivo', gancho: 'Gancho (0 a 3s)', retencao: 'Retenção', distribuicao: 'Distribuição',
  qualidade: 'Ação por pessoa alcançada', conversao: 'Interesse no perfil',
};
const GRUPOS_INSIGHT = [
  { acao: 'usar', titulo: 'Fazer mais', icone: 'check', dica: '' },
  { acao: 'evitar', titulo: 'Evitar', icone: 'alerta', dica: '' },
  { acao: 'testar', titulo: 'Testar', icone: 'lampada', dica: 'Sinal fraco ou misturado: vale testar numa peça antes de virar regra.' },
  { acao: 'planejar', titulo: 'No planejamento', icone: 'calendario', dica: 'Pilar, bloco, tipo e formato vêm do calendário: servem pra planejar o mês, não pra mudar uma peça pronta.' },
];
const STATUS_HIP = { aberta: 'em teste', confirmada: 'confirmada', refutada: 'refutada', inconclusiva: 'inconclusiva', 'nao-aplicada': 'não aplicada' };
const GRUPO_DIM = { fundamento: 'Fundamentos', mecanismo: 'Mecanismos', contexto: 'Contexto' };
const EVIDENCIA_TXT = { forte: 'forte', moderada: 'moderada', fraca: 'fraca', insuficiente: 'sem evidência' };
const NIVEL_TXT = { acima: 'acima da base', abaixo: 'abaixo da base', normal: 'na base' };
const ETAPA_IA = {
  fila: 'na fila', baixando: 'baixando a mídia', quadros: 'separando os quadros', transcrevendo: 'transcrevendo o áudio',
  imagens: 'baixando as imagens', analisando: 'olhando a peça', etiquetando: 'etiquetando', conferindo: 'conferindo as evidências',
};
const ROTULO_EV = { quadro: 'quadro', fala: 'fala', legenda: 'legenda', imagem: 'imagem' };
const TEXTO_PEND = {
  vincular: 'Posts sem peça do cronograma vinculada', etiquetar: 'Posts sem etiqueta da IA',
  'numeros-app': 'Reels de Vendas sem os números do app', conectar: 'Instagram não conectado', anuncios: 'Anúncios não conectados',
};
// números da tela do app: o reel não traz seguidores, visitas nem clique no link pela API
const CAMPOS_NUM = [['follows', 'Seguidores ganhos'], ['profileVisits', 'Visitas ao perfil'], ['bioLinkClicks', 'Cliques no link da bio'], ['cadastros', 'Cadastros']];
// os mesmos nomes do formulário da aba Público (publico.js)
const BASES_APP = [['visualizacoes', 'Visualizações'], ['contas-alcancadas', 'Contas alcançadas'], ['contas-engajadas', 'Contas com engajamento']];
const FAIXAS = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const GENERO_VISIVEL = { mulheres: 'Mulheres', homens: 'Homens', f: 'Mulheres', m: 'Homens', female: 'Mulheres', male: 'Homens' };

// ── ajudantes ────────────────────────────────────────────────────────────
const lista = (x) => (Array.isArray(x) ? x : []);
const texto = (s) => (typeof s === 'string' ? s.trim() : '');
const https = (u) => (/^https:\/\//i.test(String(u ?? '')) ? String(u) : '');
const idOk = (id) => ID_MIDIA.test(String(id ?? ''));
const reelOk = (id) => ID_REEL.test(String(id ?? ''));
const contagem = (n, um, varios) => (finito(n) ? plural(n, um, varios) : SEM_DADO);
// valor de objetivo é contagem; base e meta podem vir quebradas (mediana de número par): uma casa abaixo de 10
const qtd = (v) => num(v, { casas: finito(v) && Math.abs(v) < 10 ? 1 : 0 });
const rotuloEtapa = (e) => ETAPAS[e] ?? (texto(e) || SEM_DADO);
const nomePeca = (p) => (texto(p) ? rotuloPeca({ peca: p }) : SEM_DADO);
const quandoPost = (p) => p?.dia ?? p?.timestamp;
const faixaTexto = (f) => (f === '65+' ? '65 ou mais' : String(f).replace('-', ' a '));
const msDe = (ts) => {
  const v = Date.parse(String(ts ?? '').replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
  return Number.isFinite(v) ? v : 0;
};
const paraBool = (v) => (v === true || v === 'true' || v === 'sim' ? true : v === false || v === 'false' || v === 'nao' ? false : null);
const valorBool = (v) => (v === true ? 'Sim' : v === false ? 'Não' : null);
const iaRodando = (ia) => Boolean(ia && (ia.rodando === true || ia.atual || (finito(ia.fila) && ia.fila > 0)));
const valorStory = (v) => (v === 'menos-de-5' ? 'menos de 5' : num(v));
const diaCurto = (dia) => {
  const d = diaDaSemana(dia);
  return d === SEM_DADO ? '' : d.slice(0, 3);
};
const cbLista = (cb) => (Array.isArray(cb) ? cb : lista(cb?.dimensoes));
const frasesDe = (x) => lista(x).map((f) => (typeof f === 'string' ? f : texto(f?.texto))).filter(Boolean);
// efeito sem peça do outro lado (todas com o mesmo valor): a média "sem" não existe e o "efeito" seria só a
// tendência da conta. O servidor marca semComparacao; nSem 0 vale também pra resposta antiga
const semComparacao = (e) => e?.semComparacao === true || e?.nSem === 0;
const textoSemComparacao = (n) => (finito(n) && n > 1
  ? `Todas as ${num(n)} peças têm esse valor: sem comparação.`
  : 'Só uma peça tem esse dado: sem comparação.');
// número do app (Vendas) informado antes dos 7 dias num post que já passou deles: fica provisório pra
// sempre até alguém informar de novo (a idade do número é a de quando foi digitado)
const manualVelho = (o, idadeH) => o?.fonte === 'manual' && o?.provisorio === true && finito(idadeH) && idadeH >= IDADE_REF_H;
// dias de post quando os números do app foram informados (null sem as duas datas)
function diasAoInformar(publicadoEm, informadoEm) {
  const a = msDe(publicadoEm);
  const b = msDe(informadoEm);
  return a && b && b >= a ? Math.floor((b - a) / DIA_MS) : null;
}

// linha do post pelo id (um mapa por resposta, sem refazer a cada miniatura)
const mapas = new WeakMap();
function postPorId(d, id) {
  if (!d || typeof d !== 'object') return null;
  let m = mapas.get(d);
  if (!m) {
    m = new Map(lista(d.posts).filter((p) => p?.midiaId != null).map((p) => [String(p.midiaId), p]));
    mapas.set(d, m);
  }
  return m.get(String(id)) ?? null;
}

function tituloPost(p) {
  return texto(p?.legenda1) || texto(p?.reelTitulo) || `Post de ${dataCurta(quandoPost(p))}`;
}

function etapaDoFunil(p, etapa) {
  if (!etapa) return '';
  return texto(lista(p?.funil).find((f) => f?.etapa === etapa)?.rotulo) || rotuloEtapa(etapa);
}

// miniatura 4:5 da peça; o ícone fica por baixo e aparece se a imagem do CDN falhar (ligar tira a img)
function miniatura(p, { tam = 'p' } = {}) {
  const src = https(p?.thumb);
  const ico = p?.peca === 'carrossel' ? 'carrossel' : p?.peca === 'estatico' ? 'estatico' : 'reel';
  return `<span class="dg-mini" data-tam="${tam}" aria-hidden="true">${icone(ico, tam === 'g' ? 22 : 16)}${src ? `<img src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : ''}</span>`;
}

function botaoMini(p, prefixo) {
  const quando = dataCurta(quandoPost(p));
  const titulo = tituloPost(p);
  return `<button type="button" class="dg-mini-btn" data-dg-post="${esc(p.midiaId)}" data-foco="${esc(`${prefixo}:${p.midiaId}`)}"
    aria-label="${esc(`Abrir o post de ${quando}: ${titulo}`)}" data-mc-dica="${esc(`${quando}: ${titulo}`)}">${miniatura(p)}</button>`;
}

const giro = '<span class="ig-giro" aria-hidden="true"></span>';

// selo "provisório": menos de 7 dias no ar, ou número do app informado cedo num post que já passou deles
function seloProvisorio(o, idadeH) {
  const dica = manualVelho(o, idadeH)
    ? 'Números do app informados antes dos 7 dias: informe de novo pra fechar a meta'
    : 'Menos de 7 dias no ar: o número ainda sobe';
  return `<span class="pill dg-selo" data-mc-dica="${esc(dica)}">provisório</span>`;
}

// ════════════════════════════════════════════════════════════════════════
// HTML puro (sem DOM): exportado pro teste de fumaça
// ════════════════════════════════════════════════════════════════════════

export function carregandoHtml() {
  return `
    <div class="dg-aba dg-carregando" aria-busy="true">
      <p class="ig-carregando-txt" role="status">${giro}Lendo o diagnóstico…</p>
      ${esqueletoCards(4)}
    </div>`;
}

export function erroHtml(msg, { compacto = false } = {}) {
  return `
    <div class="card dg-erro${compacto ? ' dg-erro-compacto' : ''}" role="alert">
      <strong>Não consegui ler o diagnóstico</strong>
      <p>${esc(texto(msg) || 'Erro desconhecido')}</p>
      <button type="button" class="btn btn-sm" data-dg-tentar data-foco="tentar">Tentar de novo</button>
    </div>`;
}

// a aba inteira. ui = { carregando, erro, ordem, mostrar, dimensao, codebook, vinculando, loteIniciando }
export function abaHtml(d, ui = {}) {
  if (!d || typeof d !== 'object') return ui.erro ? `<div class="dg-aba">${erroHtml(ui.erro)}</div>` : carregandoHtml();
  const posts = lista(d.posts);
  const corpo = posts.length
    ? `${metasHtml(d)}${pendenciasHtml(d, ui)}${insightsHtml(d)}${mecanismosHtml(d, ui)}${pecasHtml(d, ui)}`
    : `${d.conectado === false ? '' : semPostsHtml()}${pendenciasHtml(d, ui)}`;
  return `
    <div class="dg-aba" aria-busy="${ui.carregando ? 'true' : 'false'}">
      ${statusHtml(d, ui)}
      ${ui.erro ? erroHtml(ui.erro, { compacto: true }) : ''}
      <div class="dg-corpo">
        ${d.conectado === false ? desconectadoHtml(posts.length) : ''}
        ${corpo}
        ${hipotesesHtml(d)}
        ${storiesHtml(d)}
      </div>
    </div>`;
}

function statusHtml(d, ui) {
  const ha = d.sincronizadoEm ? haQuanto(d.sincronizadoEm) : '';
  const prox = d.agenda?.proximas?.sincronizar;
  const partes = [
    ha ? `Última leitura do Instagram ${ha}` : 'Ainda sem leitura do Instagram',
    d.agenda?.ligada === false ? 'leitura automática desligada' : prox && dataHora(prox) !== SEM_DADO ? `próxima leitura automática ${dataHora(prox)}` : '',
  ].filter(Boolean);
  return `
    <div class="dg-status">
      <p>${esc(partes.join(' · '))}</p>
      ${ui.carregando ? `<p class="dg-atualizando" role="status">${giro}Atualizando…</p>` : ''}
    </div>
    ${agendaErrosHtml(d.agenda, ui)}`;
}

// tarefas automáticas (agenda.estado()): a que falhou na última vez, com o erro e o "Tentar agora", e os erros
// dos últimos 7 dias. Fechado por padrão: é aviso, não a aba. Sem falha nem erro recente, nada
const rotuloTarefa = (agenda, id) => texto(lista(agenda?.tarefas).find((t) => t?.id === id)?.rotulo) || ROTULO_TAREFA[id] || texto(id) || 'Tarefa';
export function agendaErrosHtml(agenda, ui = {}, agoraMs = Date.now()) {
  if (!agenda || typeof agenda !== 'object') return '';
  const ultimas = agenda.ultimas && typeof agenda.ultimas === 'object' ? agenda.ultimas : {};
  const ids = [...new Set([...TAREFAS_AGENDA, ...Object.keys(ultimas)])];
  const falhando = ids.filter((id) => ultimas[id]?.ok === false);
  const recentes = lista(agenda.erros)
    .filter((e) => e && msDe(e.em) && agoraMs - msDe(e.em) <= 7 * DIA_MS)
    .sort((a, b) => msDe(b.em) - msDe(a.em))
    .slice(0, 6);
  if (!falhando.length && !recentes.length) return '';
  const rodando = texto(ui.agendaRodando);
  const resumo = falhando.length
    ? (falhando.length === 1
      ? `A leitura automática falhou: ${rotuloTarefa(agenda, falhando[0]).toLowerCase()}`
      : `A leitura automática falhou em ${num(falhando.length)} tarefas`)
    : 'Erros recentes da leitura automática (a última vez de cada tarefa deu certo)';
  const itemFalha = (id) => {
    const u = ultimas[id] ?? {};
    const quando = dataHora(u.em);
    const ocupado = rodando === id;
    return `
      <li>
        <p><b>${esc(rotuloTarefa(agenda, id))}</b>: falhou${quando !== SEM_DADO ? ` em ${esc(quando)}` : ''}${texto(u.erro) ? `. ${esc(u.erro)}` : '.'}</p>
        ${TAREFAS_AGENDA.includes(id) ? `<button type="button" class="btn btn-sm" data-dg-agenda="${esc(id)}" data-foco="${esc(`agenda:${id}`)}"${rodando ? ' aria-disabled="true"' : ''}${ocupado ? ' aria-busy="true"' : ''}>${ocupado ? `${giro}Rodando…` : 'Tentar agora'}</button>` : ''}
      </li>`;
  };
  // aberto ou fechado atravessa o redesenho da aba (ui.agendaAberta, pelo evento toggle)
  return `
    <details class="dg-agenda" data-falha="${falhando.length ? 'sim' : 'nao'}"${ui.agendaAberta ? ' open' : ''}>
      <summary data-foco="agenda:resumo">${icone('alerta', 15)}${esc(resumo)}</summary>
      ${falhando.length ? `<ul class="dg-agenda-lista" role="list">${falhando.map(itemFalha).join('')}</ul>` : ''}
      ${recentes.length ? `
        <p class="dg-nota">Últimos erros:</p>
        <ul class="dg-agenda-erros" role="list">${recentes.map((e) => `<li>${esc(dataHora(e.em))} · ${esc(rotuloTarefa(agenda, e.tarefa))}: ${esc(texto(e.msg ?? e.erro) || 'erro sem mensagem')}</li>`).join('')}</ul>` : ''}
    </details>`;
}

function desconectadoHtml(nPosts) {
  return `
    <div class="card dg-faixa">
      <span class="dg-faixa-ico" aria-hidden="true">${icone('instagram', 20)}</span>
      <div>
        <strong>Instagram não conectado</strong>
        <p>${nPosts ? 'Mostrando a última leitura salva. ' : ''}Conecte na Visão geral pra ler os posts e as métricas.</p>
      </div>
      <a class="btn btn-sm btn-primario" href="#/instagram/metricas" data-foco="ir-conectar">Ir pra Visão geral</a>
    </div>`;
}

function semPostsHtml() {
  return `<div class="card dg-vazio">${vazio('Nenhum post lido ainda', 'Clique em "Sincronizar agora" na Visão geral pra puxar os posts da conta.',
    '<a class="btn btn-sm" href="#/instagram/metricas" data-foco="ir-visao">Ir pra Visão geral</a>')}</div>`;
}

function cabecalhoSecao(id, titulo, sub = '', extra = '', contador = null) {
  return `
    <div class="dg-secao-topo">
      <div>
        <h2 class="dg-h2" id="dg-t-${id}" tabindex="-1" data-foco="sec:${id}">${esc(titulo)}${contador != null ? ` <span class="dg-contagem">${esc(num(contador))}</span>` : ''}</h2>
        ${sub ? `<p class="dg-sub">${esc(sub)}</p>` : ''}
      </div>
      ${extra}
    </div>`;
}

// ── 1. metas 2× por tipo e formato, e números da conta ──────────────────
export function metasHtml(d) {
  const metas = lista(d?.metas).filter((m) => m && typeof m === 'object');
  const semBase = metas.length > 0 && metas.every((m) => !finito(m?.base));
  return `
    <section class="dg-secao" aria-labelledby="dg-t-metas">
      ${cabecalhoSecao('metas', 'Metas 2× por tipo e formato', 'Cada peça contra a mediana das 5 anteriores do mesmo tipo e do mesmo formato (reel com reel; post e carrossel juntos). Bateu = chegou na meta, o menor número que dá 2× a base.')}
      ${contaNumerosHtml(d?.numeros)}
      ${semBase ? '<p class="dg-nota">Ainda sem base: a meta precisa de pelo menos 3 peças anteriores do mesmo tipo (ou do mesmo formato).</p>' : ''}
      ${metas.length
        ? `<div class="dg-metas">${metas.map((m) => metaCardHtml(m, d)).join('')}</div>`
        : `<div class="card dg-vazio">${vazio('Sem metas ainda', 'As metas aparecem quando houver peça com tipo e número lido.')}</div>`}
    </section>`;
}

function contaNumerosHtml(n = {}) {
  const extras = [
    finito(n?.semTipo) && n.semTipo > 0 ? `sem tipo: ${num(n.semTipo)}` : '',
    finito(n?.semTags) && n.semTags > 0 ? `sem etiqueta: ${num(n.semTags)}` : '',
    finito(n?.semVinculo) && n.semVinculo > 0 ? `sem peça vinculada: ${num(n.semVinculo)}` : '',
  ].filter(Boolean);
  // peça com menos de 7 dias ou com anúncio fica fora da taxa e da mediana (o servidor conta à parte e manda a
  // frase pronta; sem ela, a conta vira frase aqui)
  const provisorias = [n?.provisorias30d, n?.provisorias].find(finito);
  const fraseProv = texto(n?.fraseProvisorias);
  return `
    <div class="kpis dg-kpis">
      <div class="kpi"><b>${esc(num(n?.comBase))}</b><span>peças com base${finito(n?.posts) ? ` de ${esc(num(n.posts))} lidas` : ''}</span></div>
      <div class="kpi"><b>${esc(pct(n?.taxaAcerto30d))}</b><span>bateram a meta em 30 dias${finito(n?.bateramMeta30d)
        ? ` (${esc(finito(n?.avaliadas30d) ? `${num(n.bateramMeta30d)} de ${contagem(n.avaliadas30d, 'peça', 'peças')}` : contagem(n.bateramMeta30d, 'peça', 'peças'))})`
        : ''}</span></div>
      <div class="kpi"><b>${esc(vezesDeScore(n?.medianaScore30d))}</b><span>mediana contra a base em 30 dias (1× = a base)</span></div>
    </div>
    ${fraseProv ? `<p class="dg-nota">${esc(fraseProv)}</p>` : finito(provisorias) && provisorias > 0 ? `<p class="dg-nota">${esc(provisorias === 1
      ? '1 peça ainda tem menos de 7 dias: fica fora da taxa e da mediana até completar 7 dias.'
      : `${num(provisorias)} peças ainda têm menos de 7 dias: ficam fora da taxa e da mediana até completarem 7 dias.`)}</p>` : ''}
    ${extras.length ? `<p class="dg-nota">${esc(extras.join(' · '))}</p>` : ''}`;
}

// um cartão por tipo e formato. O medidor é o da última peça, com a régua DELA (a base e a meta de quando
// saiu); a meta da próxima peça já conta a última na mediana, então fica numa linha própria
function metaCardHtml(m, d = null) {
  const u = m?.ultima && typeof m.ultima === 'object' ? m.ultima : null;
  // rótulo que é só o id ("vendas") perde pro nome do tipo no core.js ("Vendas")
  const rotulo = texto(m?.rotuloTipo);
  const nome = (rotulo && rotulo !== m?.tipo ? rotulo : '') || tipoReel(m?.tipo)?.nome || rotulo || 'Sem tipo';
  const formato = texto(m?.rotuloFormato) || ROTULO_FORMATO[m?.formato] || '';
  const obj = texto(m?.objetivo?.rotulo) || SEM_DADO;
  const cartao = [nome, formato].filter(Boolean).join(', ');
  const post = u ? postPorId(d, u.midiaId) : null;
  const quando = post ? dataCurta(quandoPost(post)) : SEM_DADO;
  const selo = !u ? '' : !finito(u.valor)
    ? `<span class="pill mc-meta" data-meta="sem">${SEM_DADO}</span>`
    : pillMeta(u.bateuMeta ?? null, u.score);
  const baseTxt = finito(m?.base)
    ? `base ${qtd(m.base)}${finito(m?.baseN) && m.baseN > 0 ? `, mediana das últimas ${num(m.baseN)}` : ''}${m?.baseDe === 'tipo-misto' ? ' (reels e posts juntos: ainda há menos de 3 deste formato)' : m?.baseDe === 'formato' ? ' (de qualquer tipo: ainda há menos de 3 deste tipo)' : ''}`
    : 'faltam peças anteriores com o número pra comparar';
  const chave = `${m?.tipo ?? 'sem'}:${m?.formato ?? 'todos'}`;
  const provisorio = u?.provisorio === true || post?.objetivo?.provisorio === true;
  return `
    <article class="card dg-meta">
      <header class="dg-meta-topo">${pillTipo(m?.tipo)}${formato ? `<span class="dg-meta-formato">${esc(formato)}</span>` : ''}<span class="dg-meta-obj">${esc(obj)}</span></header>
      ${u ? `
        <div class="dg-meta-ultima">
          <p class="dg-meta-rotulo">Última peça${quando !== SEM_DADO ? `, ${esc(quando)}` : ''}</p>
          ${medidor({ valor: u.valor, base: u.base, meta: u.meta, formato: qtd, rotulo: `${cartao}: última peça` })}
          <div class="dg-meta-pe">
            <span class="dg-meta-selos">${selo}${provisorio ? seloProvisorio(post?.objetivo ?? u, post?.idadeH) : ''}${u.impulsionado === true ? '<span class="pill dg-selo" data-mc-dica="Teve anúncio: fica fora da base de comparação">teve anúncio</span>' : ''}</span>
            ${idOk(u.midiaId) ? `<button type="button" class="btn btn-sm btn-fantasma" data-dg-post="${esc(u.midiaId)}" data-foco="${esc(`meta:${chave}`)}" aria-label="${esc(`Abrir a última peça: ${cartao}`)}">Abrir</button>` : ''}
          </div>
        </div>`
        : `<p class="dg-nota">Nenhuma peça ${m?.tipo ? `de ${esc(nome)}` : 'sem tipo'} publicada ainda.</p>`}
      <div class="dg-meta-proxima">
        <p><span>Meta da próxima peça</span><b>${finito(m?.meta) ? esc(qtd(m.meta)) : 'ainda sem base'}</b></p>
        <small>${esc(baseTxt)}</small>
      </div>
    </article>`;
}

// ── 2. pendências ────────────────────────────────────────────────────────
export function pendenciasHtml(d, ui = {}) {
  const pend = lista(d?.pendencias).filter((p) => p && p.id);
  if (!pend.length) return '';
  return `
    <section class="dg-secao" aria-labelledby="dg-t-pendencias">
      ${cabecalhoSecao('pendencias', 'Pendências', 'O que falta pra leitura ficar completa. Cada uma com o botão que resolve.')}
      <ul class="dg-pendencias" role="list">
        ${pend.map((p) => `<li class="card dg-pend" data-pend="${esc(p.id)}">${pendenciaHtml(p, d, ui)}</li>`).join('')}
      </ul>
    </section>`;
}

function pendenciaHtml(p, d, ui) {
  const rotulo = texto(typeof p.acao === 'string' ? p.acao : p.acao?.rotulo) || null;
  const cab = `
    <div class="dg-pend-topo">
      <p>${esc(texto(p.texto) || TEXTO_PEND[p.id] || 'Pendência')}</p>
      ${finito(p.n) && p.n > 0 ? `<span class="dg-contagem">${esc(num(p.n))}</span>` : ''}
    </div>`;
  if (p.id === 'vincular') return cab + sugestoesHtml(d, ui);
  if (p.id === 'etiquetar') return cab + loteHtml(d?.ia, ui, rotulo);
  // números do app faltando ou informados antes dos 7 dias (qualquer pendência de números com a lista)
  if (p.id === 'numeros-app' || /^numeros/.test(String(p.id))) return cab + numerosPendentesHtml(d, p);
  if (p.id === 'conectar') return `${cab}<a class="btn btn-sm btn-primario" href="#/instagram/metricas" data-foco="pend:conectar">${esc(rotulo ?? 'Conectar na Visão geral')}</a>`;
  if (p.id === 'anuncios') return `${cab}<a class="btn btn-sm" href="#/instagram/metricas/publico" data-foco="pend:anuncios">${esc(rotulo ?? 'Conectar anúncios')}</a>`;
  return cab;
}

function sugestoesHtml(d, ui) {
  const sug = lista(d?.sugestoesVinculo).filter((s) => idOk(s?.midiaId) && reelOk(s?.reelId));
  if (!sug.length) return '<p class="dg-nota">Abra o post na lista de peças e escolha a peça do cronograma no painel.</p>';
  const vis = sug.slice(0, 5);
  return `
    <ul class="dg-sugestoes" role="list">
      ${vis.map((s) => {
        const post = postPorId(d, s.midiaId);
        // dia = o do post; reelDia = a data da peça no cronograma
        const quando = dataCurta(quandoPost(post) ?? s.dia);
        const ocupado = Boolean(ui.vinculando?.has?.(String(s.midiaId)));
        const peca = texto(s.reelTitulo) || 'peça sem título';
        return `
          <li class="dg-sugestao">
            ${miniatura(post)}
            <div class="dg-sugestao-texto">
              <strong>${esc(post ? tituloPost(post) : `Post de ${quando}`)}</strong>
              <small>${esc(quando)}: parece a peça <b>${esc(peca)}</b>${s.reelDia ? ` de ${esc(dataCurta(s.reelDia))}` : ''}${texto(s.motivo) ? ` (${esc(s.motivo)})` : ''}</small>
            </div>
            <div class="dg-sugestao-acoes">
              <button type="button" class="btn btn-sm btn-primario" data-dg-vincular="${esc(s.midiaId)}" data-reel="${esc(s.reelId)}"
                data-foco="${esc(`vinc:${s.midiaId}`)}" aria-label="${esc(`Vincular o post de ${quando} à peça ${peca}`)}"${ocupado ? ' aria-disabled="true" aria-busy="true"' : ''}>${ocupado ? 'Vinculando…' : 'Vincular'}</button>
              <button type="button" class="btn btn-sm btn-fantasma" data-dg-post="${esc(s.midiaId)}" data-foco="${esc(`vinc-outra:${s.midiaId}`)}"
                aria-label="${esc(`Escolher outra peça pro post de ${quando}`)}">Escolher outra</button>
            </div>
          </li>`;
      }).join('')}
    </ul>
    ${sug.length > vis.length ? `<p class="dg-nota">E mais ${esc(contagem(sug.length - vis.length, 'sugestão', 'sugestões'))} depois dessas.</p>` : ''}`;
}

// etiquetagem em lote: o botão e o andamento (o andamento é trocado sozinho a cada consulta)
export function loteHtml(ia, ui = {}, rotulo = null) {
  const parado = iaRodando(ia) || ui.loteIniciando;
  return `
    <div class="dg-lote" data-dg-lote-caixa>
      <button type="button" class="btn btn-sm btn-primario" data-dg-lote data-foco="pend:lote"${parado ? ' aria-disabled="true"' : ''}>${icone('raio', 14)}${esc(rotulo ?? 'Etiquetar com IA')}</button>
      <div class="dg-lote-estado" data-dg-lote-estado aria-live="polite">${loteEstadoHtml(ia, ui.loteIniciando)}</div>
    </div>`;
}

// o erro que explica a rodada: sem login do Claude vale sobre os outros (a fila parou por ele)
function erroDoLote(ia) {
  const erros = lista(ia?.erros).filter((e) => e && typeof e === 'object');
  return erros.find((e) => e.status === 'sem-login') ?? erros.at(-1) ?? null;
}

// o aviso de fim da rodada diz o porquê (o passo a passo do login fica no andamento, na pendência)
export function toastFimLote(ia) {
  // a lista de erros do servidor guarda só os 10 últimos: a conta sai de feitos menos ok quando dá
  const erros = finito(ia?.feitos) && finito(ia?.ok) ? Math.max(0, ia.feitos - ia.ok) : lista(ia?.erros).length;
  if (!erros) return 'A etiquetagem com IA terminou';
  const erro = erroDoLote(ia);
  if (erro?.status === 'sem-login') return 'A etiquetagem com IA parou: falta o login do Claude neste computador';
  const msg = texto(erro?.mensagem);
  return `A etiquetagem com IA terminou com ${contagem(erros, 'post com erro', 'posts com erro')}${msg ? `: ${msg.length > 140 ? `${msg.slice(0, 139)}…` : msg}` : ''}`;
}

export function loteEstadoHtml(ia, iniciando = false) {
  if (iniciando) return `<small>${giro}Pedindo pro servidor…</small>`;
  if (!iaRodando(ia)) {
    const erros = lista(ia?.erros);
    if (finito(ia?.feitos) && ia.feitos > 0) {
      // feitos conta todos os que passaram pela fila; ok, só os que deram certo
      const ok = finito(ia.ok) ? ia.ok : Math.max(0, ia.feitos - erros.length);
      const falhas = Math.max(0, ia.feitos - ok);
      const erro = falhas ? erroDoLote(ia) : null;
      const rodada = `<small>Última rodada: ${esc(contagem(ok, 'post etiquetado', 'posts etiquetados'))}${falhas ? `, ${esc(contagem(falhas, 'com erro', 'com erro'))}` : ''}.</small>`;
      if (erro?.status === 'sem-login') {
        // a fila para no primeiro sem login: o resto nem roda (cancelados, quando o servidor conta)
        const fora = finito(ia.cancelados) && ia.cancelados > 0
          ? `${contagem(ia.cancelados, 'post ficou', 'posts ficaram')} de fora: falta o login do Claude.`
          : 'A fila parou: falta o login do Claude.';
        const passo = texto(erro.mensagem) || 'Neste computador, abra um terminal, rode claude e depois /login.';
        return `${rodada}<small class="dg-erro-txt">${esc(fora)}</small><small>${esc(passo)} Depois clique em Etiquetar com IA de novo.</small>`;
      }
      return `${rodada}${texto(erro?.mensagem) ? `<small class="dg-erro-txt">Último erro: ${esc(erro.mensagem)}</small>` : ''}`;
    }
    return '<small>A IA olha o vídeo, a fala e a legenda sem ver os números e marca gancho, gatilho, CTA e o resto.</small>';
  }
  const feitos = finito(ia.feitos) ? ia.feitos : 0;
  const total = feitos + (finito(ia.fila) ? ia.fila : 0) + (ia.atual ? 1 : 0);
  const etapa = ia.atual?.etapa ? ETAPA_IA[ia.atual.etapa] ?? texto(ia.atual.etapa) : '';
  const largura = total > 0 ? ((feitos / total) * 100).toFixed(1) : '0';
  return `
    <div class="progresso" role="progressbar" aria-label="Etiquetando com IA" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${feitos}"><i style="width:${largura}%"></i></div>
    <small>${giro}Etiquetando: ${esc(num(feitos))} de ${esc(num(total))}${etapa ? ` (agora ${esc(etapa)})` : ''}. Pode sair da aba: continua no servidor.</small>`;
}

// reels de Vendas sem os números do app, ou com números informados antes dos 7 dias (ficam provisórios até
// alguém informar de novo)
function postsSemNumeros(d, pend) {
  if (Array.isArray(pend?.midiaIds)) return pend.midiaIds.map((id) => postPorId(d, id)).filter(Boolean);
  return lista(d?.posts).filter((p) => p?.peca === 'reel' && p?.tipo === 'vendas'
    && (!finito(p?.objetivo?.valor) || manualVelho(p.objetivo, p.idadeH)));
}

function numerosPendentesHtml(d, pend) {
  const alvos = postsSemNumeros(d, pend).filter((p) => idOk(p?.midiaId)).slice(0, 6);
  if (!alvos.length) return '';
  const informar = texto(typeof pend?.acao === 'string' ? pend.acao : pend?.acao?.rotulo) || 'Informar números do app';
  return `
    <ul class="dg-botoes" role="list">
      ${alvos.map((p) => {
        const rotulo = manualVelho(p.objetivo, p.idadeH) ? 'Atualizar números do app' : informar;
        return `<li><button type="button" class="btn btn-sm" data-dg-post="${esc(p.midiaId)}" data-dg-ir="numeros" data-foco="${esc(`num:${p.midiaId}`)}"
          aria-label="${esc(`${rotulo}: ${tituloPost(p)}, ${dataCurta(quandoPost(p))}`)}">${icone('editar', 14)}${esc(rotulo)}: ${esc(dataCurta(quandoPost(p)))}</button></li>`;
      }).join('')}
    </ul>`;
}

// ── 3. o que os números mostram ──────────────────────────────────────────
export function insightsHtml(d) {
  const ins = lista(d?.insights).filter((i) => i && i.acao);
  const grupos = GRUPOS_INSIGHT.map((g) => ({ ...g, itens: ins.filter((i) => i.acao === g.acao) })).filter((g) => g.itens.length);
  return `
    <section class="dg-secao" aria-labelledby="dg-t-insights">
      ${cabecalhoSecao('insights', 'O que os números mostram', 'Sinais das nossas peças, nunca causa: cada um diz em quantas peças apareceu e com que evidência.')}
      ${grupos.length ? grupos.map((g) => `
        <div class="dg-ins-grupo" data-acao="${g.acao}">
          <h3 class="dg-h3">${icone(g.icone, 16)}${esc(g.titulo)} <span class="dg-contagem">${esc(num(g.itens.length))}</span></h3>
          ${g.dica ? `<p class="dg-nota">${esc(g.dica)}</p>` : ''}
          <div class="dg-insights">${g.itens.map((i) => insightHtml(i, d)).join('')}</div>
        </div>`).join('')
        : `<div class="card dg-vazio">${vazio('Ainda sem sinal com evidência', 'Um sinal precisa de pelo menos 2 peças com a mesma etiqueta e base de comparação. Etiquetar os posts ajuda.')}</div>`}
    </section>`;
}

function insightHtml(i, d) {
  const midias = lista(i?.midias).map((id) => postPorId(d, id)).filter((p) => p && idOk(p.midiaId));
  const extra = midias.length - 8;
  return `
    <article class="card dg-insight" data-acao="${esc(i.acao)}">
      <div class="dg-insight-topo"><strong>${esc(texto(i.titulo) || texto(i.nomeValor) || 'Sinal')}</strong>${pillEvidencia(i.evidencia)}</div>
      ${texto(i.texto) ? `<p>${esc(i.texto)}</p>` : ''}
      ${finito(i.fatorCom) || finito(i.fatorSem) || (finito(i.n) && i.n > 0) ? `
        <p class="dg-fatores">
          <span>Com: <b>${esc(vezes(i.fatorCom))}</b></span>
          <span>Sem: <b>${esc(vezes(i.fatorSem))}</b></span>
          <span>${esc(contagem(i.n, 'peça', 'peças'))}</span>
        </p>` : ''}
      ${midias.length ? `
        <div class="dg-thumbs" role="group" aria-label="Peças deste sinal">
          ${midias.slice(0, 8).map((p) => botaoMini(p, `ins-${i.id ?? i.dimensao ?? 'x'}`)).join('')}
          ${extra > 0 ? `<span class="dg-mais">+${esc(num(extra))}</span>` : ''}
        </div>` : ''}
    </article>`;
}

// ── 4. pilares e mecanismos ──────────────────────────────────────────────
function dimensoesComEfeito(efeitos, codebook) {
  const cb = cbLista(codebook);
  const ordem = (id) => {
    const i = cb.findIndex((x) => x?.id === id);
    return i < 0 ? 999 : i;
  };
  const ids = [...new Set(efeitos.map((e) => String(e.dimensao)))].sort((a, b) => ordem(a) - ordem(b));
  return ids.map((id) => {
    const c = cb.find((x) => x?.id === id);
    // sem codebook (falhou a busca): o id vira nome legível
    const nome = texto(c?.nome) || id.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (x) => x.toUpperCase());
    return { id, nome, grupo: c?.grupo ?? null };
  });
}

function opcoesDimensao(dims, atual) {
  const opt = (x) => `<option value="${esc(x.id)}"${x.id === atual ? ' selected' : ''}>${esc(x.nome)}</option>`;
  const grupos = new Map();
  for (const x of dims) {
    const g = GRUPO_DIM[x.grupo] ?? 'Outras';
    if (!grupos.has(g)) grupos.set(g, []);
    grupos.get(g).push(x);
  }
  if (grupos.size <= 1) return dims.map(opt).join('');
  return [...grupos].map(([g, xs]) => `<optgroup label="${esc(g)}">${xs.map(opt).join('')}</optgroup>`).join('');
}

export function mecanismosHtml(d, ui = {}) {
  const efeitos = lista(d?.efeitos).filter((e) => e && e.dimensao != null);
  const dims = dimensoesComEfeito(efeitos, ui.codebook);
  // sem escolha da pessoa, abre na dimensão com a evidência mais forte (empate: a ordem do codebook). Linha
  // sem comparação não conta: sem peça do outro lado, a "evidência" seria a tendência da conta
  const FORCA = { forte: 3, moderada: 2, fraca: 1 };
  const forca = (id) => Math.max(0, ...efeitos.filter((e) => String(e.dimensao) === id && !semComparacao(e)).map((e) => FORCA[e.evidencia] ?? 0));
  const comparavel = (id) => efeitos.some((e) => String(e.dimensao) === id && !semComparacao(e));
  const padrao = dims.reduce((m, x) => (!m || forca(x.id) > forca(m.id) || (!comparavel(m.id) && comparavel(x.id)) ? x : m), null);
  const atual = dims.find((x) => x.id === ui.dimensao) ?? padrao;
  return `
    <section class="dg-secao" aria-labelledby="dg-t-mecanismos">
      ${cabecalhoSecao('mecanismos', 'Pilares e mecanismos', 'Como ficaram as peças com cada valor, contra as peças sem ele. É sinal, não causa; com poucas peças o número é puxado pro meio.')}
      ${atual ? `
        <label class="dg-seletor"><span>Dimensão</span>
          <select class="campo" data-dg-dimensao data-foco="dimensao">${opcoesDimensao(dims, atual.id)}</select>
        </label>
        ${efeitosDimensaoHtml(efeitos.filter((e) => String(e.dimensao) === atual.id), atual)}`
        : `<div class="card dg-vazio">${vazio('Sem efeito medido ainda', 'Aparece quando pelo menos 2 peças com base tiverem a mesma etiqueta.')}</div>`}
    </section>`;
}

// a média da etapa na unidade dela: o servidor manda o valor cru (52 = 52% no gancho), não score. Mesma
// regra do valorEtapaCurto do diagnostico-motor.mjs
function valorDaEtapa(etapa, unidade, v) {
  if (!finito(v)) return SEM_DADO;
  if (etapa === 'gancho' || (etapa === 'retencao' && unidade !== 's')) return pct(v, { casas: 0 });
  if (etapa === 'retencao') return segundos(v * 1000);
  if (etapa === 'distribuicao') return vezes(v);
  return num(v, { casas: 1 });
}

function efeitosDimensaoHtml(efs, dim) {
  // as sem comparação vão pro fim (efeito null)
  const chave = (e) => (!semComparacao(e) && finito(e?.efeito) ? e.efeito : -Infinity);
  const ord = [...efs].sort((a, b) => chave(b) - chave(a));
  const temEtapa = ord.some((e) => !semComparacao(e) && e.etapa && finito(e.efeitoEtapa));
  const nomeValor = (e) => texto(e?.nomeValor) || valorBool(e?.valor) || (e?.valor != null ? String(e.valor) : SEM_DADO);
  const consist = (e) => pct(finito(e?.consistencia) ? e.consistencia * 100 : null, { casas: 0 });
  const SEM_COMP = 'sem comparação';
  return `
    <ul class="dg-efeitos" role="list">
      ${ord.map((e) => {
        const nome = nomeValor(e);
        // todas as peças com o mesmo valor: sem barra, sem efeito e sem evidência, só o porquê
        if (semComparacao(e)) {
          return `
            <li class="dg-efeito" data-sem-comparacao>
              <div class="dg-efeito-nome"><strong>${esc(nome)}</strong></div>
              <p class="dg-efeito-sem">${esc(textoSemComparacao(e.n))}</p>
            </li>`;
        }
        const dica = `${nome}: com ${vezesDeScore(e.mediaCom)} a base, sem ${vezesDeScore(e.mediaSem)} (efeito ${vezesDeScore(e.efeito)}, ajustado pelo número pequeno de peças)`;
        return `
          <li class="dg-efeito">
            <div class="dg-efeito-nome"><strong>${esc(nome)}</strong>${pillEvidencia(e.evidencia)}</div>
            <div class="dg-efeito-barra" data-mc-dica="${esc(dica)}"><span aria-hidden="true">${divergente(e.efeito)}</span><span>efeito <b>${esc(vezesDeScore(e.efeito))}</b></span></div>
            <p class="dg-efeito-nums">
              <span>Com: <b>${esc(vezesDeScore(e.mediaCom))}</b></span>
              <span>Sem: <b>${esc(vezesDeScore(e.mediaSem))}</b></span>
              <span>${esc(contagem(e.n, 'peça', 'peças'))}${finito(e.nSem) ? ` contra ${esc(num(e.nSem))}` : ''}</span>
              <span>Consistência: <b>${esc(consist(e))}</b></span>
            </p>
            ${e.etapa && finito(e.efeitoEtapa) ? `<p class="dg-nota">Na etapa ${esc(rotuloEtapa(e.etapa))}: ${esc(valorDaEtapa(e.etapa, e.unidadeEtapa, e.mediaEtapaCom))} com, ${esc(valorDaEtapa(e.etapa, e.unidadeEtapa, e.mediaEtapaSem))} sem (efeito ${esc(vezesDeScore(e.efeitoEtapa))}).</p>` : ''}
          </li>`;
      }).join('')}
    </ul>
    ${tabela(
      [{ titulo: dim.nome }, { titulo: 'Efeito', num: true }, { titulo: 'Com', num: true }, { titulo: 'Sem', num: true },
        { titulo: 'Peças', num: true }, { titulo: 'Consistência', num: true }, { titulo: 'Evidência' },
        ...(temEtapa ? [{ titulo: 'Etapa' }, { titulo: 'Efeito na etapa', num: true }] : [])],
      ord.map((e) => (semComparacao(e)
        ? [nomeValor(e), SEM_COMP, vezesDeScore(e.mediaCom), SEM_COMP, num(e.n), SEM_DADO, SEM_COMP, ...(temEtapa ? [e.etapa ? rotuloEtapa(e.etapa) : SEM_DADO, SEM_COMP] : [])]
        : [nomeValor(e), vezesDeScore(e.efeito), vezesDeScore(e.mediaCom), vezesDeScore(e.mediaSem), num(e.n), consist(e),
          EVIDENCIA_TXT[e.evidencia] ?? 'sem evidência', ...(temEtapa ? [e.etapa ? rotuloEtapa(e.etapa) : SEM_DADO, vezesDeScore(e.efeitoEtapa)] : [])])),
    )}`;
}

// ── 5. peças ─────────────────────────────────────────────────────────────
function ordenarPosts(posts, ordem) {
  const lp = [...posts];
  if (ordem === 'score') {
    const s = (p) => (finito(p?.objetivo?.score) ? p.objetivo.score : -Infinity);
    return lp.sort((a, b) => s(b) - s(a) || msDe(b?.timestamp) - msDe(a?.timestamp));
  }
  return lp.sort((a, b) => msDe(b?.timestamp) - msDe(a?.timestamp));
}

export function pecasHtml(d, ui = {}) {
  const posts = lista(d?.posts).filter((p) => p && idOk(p.midiaId));
  const ordem = ui.ordem === 'score' ? 'score' : 'recentes';
  const ord = ordenarPosts(posts, ordem);
  const vis = ord.slice(0, finito(ui.mostrar) && ui.mostrar > 0 ? ui.mostrar : PAGINA);
  const ordenar = posts.length > 1 ? `
    <div class="segmentado dg-ordem" role="group" aria-label="Ordenar peças">
      <button type="button" data-dg-ordem="recentes" data-foco="ordem:recentes" aria-pressed="${ordem === 'recentes'}">Mais novas</button>
      <button type="button" data-dg-ordem="score" data-foco="ordem:score" aria-pressed="${ordem === 'score'}">Mais acima da base</button>
    </div>` : '';
  return `
    <section class="dg-secao" aria-labelledby="dg-t-pecas">
      ${cabecalhoSecao('pecas', 'Peças', 'Valor do objetivo contra a base e a meta. Clique numa peça pra ver o porquê.', ordenar, posts.length)}
      <ul class="dg-pecas" role="list">${vis.map(pecaHtml).join('')}</ul>
      ${ord.length > vis.length ? `
        <div class="dg-mais-linha">
          <button type="button" class="btn btn-sm" data-dg-mais data-foco="mais">Mostrar mais ${esc(num(Math.min(PAGINA, ord.length - vis.length)))}</button>
          <small>${esc(num(vis.length))} de ${esc(num(ord.length))}</small>
        </div>` : ''}
    </section>`;
}

export function pecaHtml(p) {
  const o = p?.objetivo ?? {};
  const titulo = tituloPost(p);
  const quando = dataCurta(quandoPost(p));
  const rotuloObj = texto(o.rotulo) || 'Objetivo';
  const gargalo = etapaDoFunil(p, p?.gargalo);
  const forte = etapaDoFunil(p, p?.forte);
  // quem não bateu nunca aparece como "2×" (vezesDaPeca trunca)
  const fator = vezesDaPeca(o.score, o.bateuMeta ?? null);
  const score = finito(o.score) ? `${fator} a base` : '';
  const nome = [`Abrir o diagnóstico: ${titulo}`, quando, `${rotuloObj} ${qtd(o.valor)}`, score, o.bateuMeta === true ? 'bateu a meta' : '', gargalo ? `gargalo ${gargalo}` : '']
    .filter(Boolean).join(', ');
  const selos = [
    gargalo ? `<span class="pill dg-gargalo"><b aria-hidden="true">↓</b>gargalo: ${esc(gargalo)}</span>` : '',
    forte ? `<span class="pill dg-forte"><b aria-hidden="true">↑</b>forte: ${esc(forte)}</span>` : '',
    o.provisorio ? seloProvisorio(o, p?.idadeH) : '',
    p?.impulsionado === true ? '<span class="pill dg-selo" data-mc-dica="Teve anúncio: fica fora da base de comparação">teve anúncio</span>' : '',
    p?.impulsionado !== true && p?.talvezImpulsionado ? '<span class="pill dg-selo" data-mc-dica="As views totais passam das orgânicas: confira no painel se teve anúncio">talvez anúncio</span>' : '',
    p?.outlier ? '<span class="pill dg-selo" data-mc-dica="Muito longe das outras peças do mesmo formato">fora da curva</span>' : '',
  ].join('');
  return `
    <li class="dg-peca" data-dg-linha="${esc(p?.midiaId)}">
      ${miniatura(p)}
      <div class="dg-peca-info">
        <p class="dg-peca-titulo"><button type="button" class="dg-peca-abrir" data-dg-post="${esc(p?.midiaId)}" data-foco="${esc(`p:${p?.midiaId}`)}" aria-label="${esc(nome)}">${esc(titulo)}</button></p>
        <p class="dg-peca-meta"><span>${esc(quando)}</span><span>${esc(nomePeca(p?.peca))}</span>${pillTipo(p?.tipo)}${texto(p?.pilarNome) ? `<span>${esc(p.pilarNome)}</span>` : ''}</p>
      </div>
      <div class="dg-peca-medidor">
        <small>${esc(rotuloObj)}</small>
        ${medidor({ valor: o.valor, base: o.base, meta: o.meta, formato: qtd, rotulo: rotuloObj })}
      </div>
      <div class="dg-peca-score">
        ${finito(o.score) ? `<b>${esc(fator)}</b><small>a base</small>` : `<small>${finito(o.base) ? SEM_DADO : 'ainda sem base'}</small>`}
        ${o.bateuMeta === true ? pillMeta(true, o.score) : ''}
        ${o.provisorio && finito(o.ritmo) ? `<small data-mc-dica="Contra as outras peças na mesma idade">ritmo ${esc(vezesDeScore(o.ritmo))}</small>` : ''}
      </div>
      ${selos ? `<div class="dg-peca-selos">${selos}</div>` : ''}
    </li>`;
}

// ── 6. hipóteses e stories ───────────────────────────────────────────────
function hipoteseHtml(h, { comPost = true } = {}) {
  const status = STATUS_HIP[h?.status] ? h.status : 'aberta';
  const peca = texto(h?.reelTitulo) || 'Peça do cronograma';
  return `
    <li class="dg-hip" data-status="${esc(status)}">
      <div class="dg-hip-topo">
        <span class="pill dg-hip-status" data-status="${esc(status)}">${esc(STATUS_HIP[status])}</span>
        ${reelOk(h?.reelId) ? `<a href="#/reel/${esc(h.reelId)}" data-foco="${esc(`hip-reel:${h.id ?? h.reelId}`)}">${esc(peca)}</a>` : `<span>${esc(peca)}</span>`}
      </div>
      <p>${esc(texto(h?.texto) || SEM_DADO)}</p>
      ${h?.previsao?.etapa ? `<small class="dg-mudo">Onde deve aparecer: ${esc(rotuloEtapa(h.previsao.etapa))}</small>` : ''}
      ${texto(h?.veredito?.texto) ? `<p class="dg-hip-veredito">${esc(h.veredito.texto)}</p>` : ''}
      ${comPost && idOk(h?.midiaId) ? `<button type="button" class="btn btn-sm btn-fantasma" data-dg-post="${esc(h.midiaId)}" data-foco="${esc(`hip-post:${h.id ?? h.midiaId}`)}">Ver o post</button>` : ''}
    </li>`;
}

export function hipotesesHtml(d) {
  const hs = lista(d?.hipoteses).filter(Boolean);
  const quando = (h) => msDe(h?.veredito?.em ?? h?.criadaEm);
  const ord = [...hs].sort((a, b) => (a.status === 'aberta' ? 0 : 1) - (b.status === 'aberta' ? 0 : 1) || quando(b) - quando(a));
  const vis = ord.slice(0, 8);
  const resto = ord.slice(8);
  return `
    <section class="dg-secao" aria-labelledby="dg-t-hipoteses">
      ${cabecalhoSecao('hipoteses', 'Hipóteses em teste', 'Recomendação aplicada numa peça. O veredito sai com 7 dias de post: 1 peça é sinal, não prova.')}
      ${vis.length ? `
        <ul class="dg-hipoteses" role="list">${vis.map((h) => hipoteseHtml(h)).join('')}</ul>
        ${resto.length ? `<details class="dg-mais-det"><summary>Mais ${esc(contagem(resto.length, 'hipótese', 'hipóteses'))}</summary><ul class="dg-hipoteses" role="list">${resto.map((h) => hipoteseHtml(h)).join('')}</ul></details>` : ''}`
        : `<div class="card dg-vazio">${vazio('Nenhuma hipótese em teste', 'No cronograma, abra uma peça e aplique uma recomendação de Métricas.')}</div>`}
    </section>`;
}

// o id do pilar do story no cronograma (número ou texto); vazio quando não tem
const idPilar = (x) => (x?.pilar != null && String(x.pilar).trim() !== '' ? String(x.pilar).trim() : '');

export function storiesHtml(d) {
  const s = d?.stories ?? null;
  // o servidor manda todos os dias da janela, com n 0 nos sem story: só entram os dias que tiveram story
  const dias = [...lista(s?.dias)].filter((x) => x && finito(x.n) && x.n > 0)
    .sort((a, b) => String(b?.dia ?? '').localeCompare(String(a?.dia ?? '')));
  const temPilar = dias.some((x) => texto(x?.pilarNome) || idPilar(x));
  const total = s?.total && typeof s.total === 'object' ? s.total : null;
  const nTotal = finito(total?.n) ? total.n : dias.reduce((a, x) => a + x.n, 0);
  const menos5Total = dias.reduce((a, x) => a + (finito(x.menosDe5) ? x.menosDe5 : 0), 0);
  const cel = (v) => esc(valorStory(v));
  // views de story com menos de 5 pessoas: a Meta não dá o número (erro 10), e a soma do dia ignora esses.
  // Só stories assim no dia: o teto é 5 por story ("menos de 5" com um, "menos de 10" com dois)
  const views = (v, menos5) => {
    const m = finito(menos5) && menos5 > 0 ? menos5 : 0;
    if (v == null && m) return esc(`menos de ${num(5 * m)}`);
    return m ? `<span data-mc-dica="${esc(`Mais ${m === 1 ? '1 story' : `${num(m)} stories`} com menos de 5 views, fora da soma`)}">${cel(v)}</span>` : cel(v);
  };
  const pilarTexto = (x) => texto(x?.pilarNome) || (idPilar(x) ? `pilar ${idPilar(x)}` : SEM_DADO);
  const linha = (x, rotulo, menos5) => `
    <td class="num">${cel(x?.n)}</td><td class="num">${views(x?.views, menos5)}</td><td class="num">${cel(x?.alcanceMax)}</td>
    <td class="num">${cel(x?.saidas)}</td><td class="num">${cel(x?.respostas)}</td><td class="num">${cel(x?.cliques)}</td>
    ${temPilar ? `<td>${rotulo ?? esc(pilarTexto(x))}</td>` : ''}`;
  // captura quebrada não pode parecer "não teve story" (agenda.ultimas.stories)
  const falha = d?.agenda?.ultimas?.stories?.ok === false ? d.agenda.ultimas.stories : null;
  const avisoFalha = falha
    ? `A última captura dos stories falhou${dataHora(falha.em) !== SEM_DADO ? ` em ${dataHora(falha.em)}` : ''}${texto(falha.erro) ? `: ${texto(falha.erro)}` : '.'}`
    : '';
  return `
    <section class="dg-secao" aria-labelledby="dg-t-stories">
      ${cabecalhoSecao('stories', 'Stories dos últimos 14 dias', 'A Meta só dá número de story enquanto ele está no ar: a leitura roda de hora em hora.')}
      ${avisoFalha ? `<p class="dg-nota dg-erro-txt">${esc(avisoFalha)}</p>` : ''}
      ${dias.length && nTotal > 0 ? `
        <div class="rolagem dg-rolagem" role="region" aria-labelledby="dg-t-stories" tabindex="0">
          <table class="tabela dg-tabela">
            <thead><tr>
              <th scope="col">Dia</th><th scope="col" class="num">Stories</th><th scope="col" class="num">Views</th>
              <th scope="col" class="num">Alcance máximo</th><th scope="col" class="num">Saídas</th><th scope="col" class="num">Respostas</th>
              <th scope="col" class="num">Cliques no link</th>${temPilar ? '<th scope="col">Pilar</th>' : ''}
            </tr></thead>
            <tbody>${dias.map((x) => `<tr><th scope="row">${esc(dataCurta(x?.dia))} <small>${esc(diaCurto(x?.dia))}</small></th>${linha(x, null, x.menosDe5)}</tr>`).join('')}</tbody>
            ${total ? `<tfoot><tr><th scope="row">Total</th>${linha(total, '', menos5Total)}</tr></tfoot>` : ''}
          </table>
        </div>`
        : `<div class="card dg-vazio">${vazio('Sem story lido nos últimos 14 dias', falha
          ? 'Sem número não quer dizer sem story: a captura está falhando (veja o aviso acima).'
          : 'A leitura dos stories roda sozinha de hora em hora enquanto eles estão no ar.')}</div>`}
    </section>`;
}

// ════════════════════════════════════════════════════════════════════════
// Painel do post (HTML puro)
// est = { id, erro, leitura, sugestao, sugestaoPendente, printRetomado, falhasPrint, editandoPublico,
//         vinculoEscolha, salvando: Set, iaIniciando, iaNaFila, temAnalise }
// ════════════════════════════════════════════════════════════════════════

const ocupado = (est, chave) => Boolean(est?.salvando?.has?.(chave));

function subtituloPost(det) {
  const p = det?.post ?? {};
  return [dataHora(p.timestamp ?? det?.midia?.timestamp), nomePeca(p.peca), tipoReel(p.tipo)?.nome ?? 'sem tipo'].join(' · ');
}

function carregandoPainelHtml() {
  return `<p class="ig-carregando-txt" role="status">${giro}Lendo o post…</p>`;
}

function erroPainelHtml(msg) {
  return `
    <div class="dg-erro" role="alert">
      <strong>Não consegui abrir este post</strong>
      <p>${esc(texto(msg) || 'Erro desconhecido')}</p>
      <button type="button" class="btn btn-sm" data-dg-p-tentar data-foco="pp:tentar">Tentar de novo</button>
    </div>`;
}

function metricasResumoHtml(m = {}, peca, manual = null) {
  // reel não traz seguidores, visitas nem clique pela API: o número digitado do app entra, marcado
  const comApp = (k) => (finito(m?.[k]) ? num(m[k]) : finito(manual?.[k]) ? `${num(manual[k])} (app)` : SEM_DADO);
  const itens = [
    ['Views', num(m?.views)], ['Alcance', num(m?.reach)], ['Salvamentos', num(m?.saved)], ['Compartilhamentos', num(m?.shares)],
    ['Curtidas', num(m?.likes)], ['Comentários', num(m?.comments)],
    ...(peca === 'reel' ? [['Tempo médio', segundos(m?.avgWatchMs)], ['Passaram dos 3s', pct(m?.retido3s, { casas: 0 })],
      ['Duração', finito(m?.duracaoS) ? `${num(m.duracaoS, { casas: 1 })}s` : SEM_DADO]] : []),
    ['Seguidores ganhos', comApp('follows')], ['Visitas ao perfil', comApp('profileVisits')], ['Cliques no link', comApp('bioLinkClicks')],
  ];
  return `<dl class="dg-nums">${itens.map(([r, v]) => `<div><dt>${esc(r)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
}

function cabPostHtml(det) {
  const p = det.post ?? {};
  const m = det.midia ?? {};
  const link = https(p.permalink ?? m.permalink);
  return `
    <div class="dg-p-cab">
      ${miniatura(p, { tam: 'g' })}
      <div class="dg-p-cab-info">
        <strong class="dg-p-titulo">${esc(tituloPost(p))}</strong>
        <p class="dg-peca-meta"><span>${esc(dataHora(p.timestamp ?? m.timestamp))}</span><span>${esc(nomePeca(p.peca))}</span>${pillTipo(p.tipo)}${texto(p.pilarNome) ? `<span>${esc(p.pilarNome)}</span>` : ''}${texto(p.bloco) ? `<span>${esc(p.bloco)}</span>` : ''}</p>
        ${link ? `<a class="btn btn-sm btn-fantasma dg-p-link" href="${esc(link)}" target="_blank" rel="noopener noreferrer" data-foco="pc:link">${icone('instagram', 14)}Abrir no Instagram</a>` : ''}
      </div>
    </div>
    ${metricasResumoHtml(p.metricas, p.peca, det.manual)}
    ${texto(m.caption) ? `<details class="dg-legenda"><summary>Legenda completa</summary><p>${esc(m.caption)}</p></details>` : ''}`;
}

// o vínculo mexe no db.json (o link da peça): o seletor só escolhe (est.vinculoEscolha) e grava no botão
// "Salvar vínculo". No Windows cada seta do teclado num select fechado dispara change: gravar no change
// ligaria o post a cada peça por onde a seta passasse
function vinculoHtml(det, est) {
  const v = det.vinculo ?? {};
  const atual = reelOk(v.reelId) ? v.reelId : '';
  const opcoes = lista(v.opcoes).filter((o) => reelOk(o?.id));
  // a peça atual pode estar fora da janela de 7 dias: entra na lista mesmo assim
  const todas = atual && !opcoes.some((o) => o.id === atual) ? [{ id: atual, titulo: v.reelTitulo, dia: v.dia, peca: null }, ...opcoes] : opcoes;
  const sug = v.sugestao && reelOk(v.sugestao.reelId) && v.sugestao.reelId !== atual ? v.sugestao : null;
  const parado = ocupado(est, 'vinculo');
  const escolha = typeof est?.vinculoEscolha === 'string' && (est.vinculoEscolha === '' || todas.some((o) => o.id === est.vinculoEscolha))
    ? est.vinculoEscolha : atual;
  const mudou = escolha !== atual;
  const por = v.por === 'manual' ? 'escolhido à mão' : v.por === 'permalink' ? 'pelo link do post' : 'vínculo automático';
  const rotuloOpcao = (o) => [o.dia ? dataCurta(o.dia) : '', texto(o.peca) ? nomePeca(o.peca) : '', texto(o.titulo) || 'sem título'].filter(Boolean).join(' · ');
  return `
    <h3 class="bloco-titulo">Peça do cronograma</h3>
    ${atual
      ? `<p class="dg-p-linha">Vinculado a <a href="#/reel/${esc(atual)}" data-foco="pv:peca">${esc(texto(v.reelTitulo) || 'peça sem título')}</a>${v.dia ? ` (${esc(dataCurta(v.dia))})` : ''} <span class="dg-mudo">· ${esc(por)}</span></p>`
      : '<p class="dg-p-linha">Sem peça vinculada: o tipo, o pilar e a CTA do cronograma não entram na leitura.</p>'}
    ${sug ? `
      <div class="dg-p-sugestao">
        <p>Sugestão: <b>${esc(texto(sug.reelTitulo) || 'peça sem título')}</b>${texto(sug.motivo) ? ` <span class="dg-mudo">(${esc(sug.motivo)})</span>` : ''}</p>
        <button type="button" class="btn btn-sm btn-primario" data-dg-p-vincular="${esc(sug.reelId)}" data-foco="pv:sugestao"${parado ? ' disabled' : ''}>Vincular a esta</button>
      </div>` : ''}
    <div class="dg-p-vinculo">
      <label class="rotulo dg-p-campo">Trocar a peça
        <select class="campo" data-dg-p-vinculo data-foco="pv:select"${parado ? ' disabled' : ''}>
          <option value=""${escolha === '' ? ' selected' : ''}>Sem peça vinculada</option>
          ${todas.map((o) => `<option value="${esc(o.id)}"${o.id === escolha ? ' selected' : ''}>${esc(rotuloOpcao(o))}</option>`).join('')}
        </select>
      </label>
      <button type="button" class="btn btn-sm${mudou ? ' btn-primario' : ''}" data-dg-p-vinculo-salvar data-foco="pv:salvar"${parado ? ' disabled aria-busy="true"' : mudou ? '' : ' aria-disabled="true"'}>${parado ? 'Salvando…' : 'Salvar vínculo'}</button>
    </div>
    ${mudou ? `<small class="dg-mudo">${escolha ? 'O post passa pra peça escolhida' : 'O post fica sem peça'} só depois de Salvar vínculo.</small>` : ''}
    ${opcoes.length ? '' : '<small class="dg-mudo">Nenhuma peça do cronograma de 7 dias antes a 7 dias depois do post.</small>'}`;
}

// o fator de quem não bateu é truncado (vezesDaPeca): "Ficou em 1,9×", nunca "Ficou em 2×"
export function vereditoTexto(o) {
  const rot = (texto(o?.rotulo) || 'objetivo').toLowerCase();
  if (!finito(o?.valor)) return o?.id === 'interesse' ? 'Sem dado: informe os números do app.' : `Sem dado de ${rot}.`;
  if (!finito(o?.base)) return 'Ainda sem base: faltam peças anteriores do mesmo tipo pra comparar.';
  if (o.bateuMeta === true) return `Bateu a meta de 2×: ${qtd(o.valor)} contra a meta de ${qtd(o.meta)} (${vezesDaPeca(o.score, true)} a base).`;
  // provisório ainda não fechou: "por enquanto", não "ficou"
  if (o.bateuMeta == null && o.provisorio) return `Por enquanto em ${vezesDaPeca(o.score, null)} a base: ${qtd(o.valor)} contra a meta de ${qtd(o.meta)}.`;
  return `Ficou em ${vezesDaPeca(o.score, false)} a base: ${qtd(o.valor)} contra a meta de ${qtd(o.meta)}.`;
}

// ctx = { idadeH (do post), diasInformado (dias de post quando os números do app entraram) }
export function notasObjetivo(o, { idadeH = null, diasInformado = null } = {}) {
  const n = [];
  if (finito(o?.base)) {
    const quantas = finito(o.baseN) ? `das últimas ${num(o.baseN)} peças` : 'das últimas peças';
    n.push(o.baseDe === 'formato'
      ? `Base: mediana ${quantas} do mesmo formato (o tipo ainda tem menos de 3).`
      : o.baseDe === 'tipo-misto'
        ? `Base: mediana ${quantas} do mesmo tipo, juntando reels e posts (ainda há menos de 3 deste formato).`
        : `Base: mediana ${quantas} do mesmo tipo e do mesmo formato, sem anúncio.`);
  }
  // o servidor manda '7d' (valor interpolado aos 7 dias); 168 fica pra resposta antiga
  if (o?.idadeRef === '7d' || Number(o?.idadeRef) === IDADE_REF_H) n.push('Comparado na mesma idade: 7 dias depois de publicar.');
  else if (o?.idadeRef === 'atual' && !o?.provisorio) n.push('Valor atual: o post já tem 7 dias ou mais.');
  if (o?.provisorio) {
    if (manualVelho(o, idadeH)) {
      // o post passou dos 7 dias, mas o número é de quando foi digitado
      const quando = finito(diasInformado) ? (diasInformado < 1 ? 'com menos de 1 dia de post' : `com ${plural(diasInformado, 'dia', 'dias')} de post`) : 'antes dos 7 dias';
      n.push(`Números do app informados ${quando}: informe de novo pra fechar a meta.`);
    } else {
      n.push(finito(o.ritmo)
        ? `Provisório: menos de 7 dias no ar. No ritmo das outras peças na mesma idade: ${vezesDeScore(o.ritmo)}.`
        : 'Provisório: menos de 7 dias no ar.');
    }
  }
  return n.length ? `<ul class="dg-notas">${n.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
}

function metaPostHtml(det) {
  const p = det.post ?? {};
  const o = p.objetivo ?? {};
  const cad = det.manual?.cadastros ?? p.metricas?.cadastros;
  const bateu = o.bateuMeta === true ? 'sim' : o.bateuMeta === false ? 'nao' : 'sem';
  const velho = manualVelho(o, p.idadeH);
  const diasInformado = diasAoInformar(p.timestamp ?? det.midia?.timestamp, det.manual?.em);
  const reel = p.peca === 'reel' || p.tipoMidia === 'REELS';
  return `
    <h3 class="bloco-titulo">Meta do tipo</h3>
    <div class="dg-p-meta">
      <div class="dg-p-meta-topo">${pillTipo(p.tipo)}<strong>${esc(texto(o.rotulo) || 'Objetivo')}</strong>${pillFonte(o.fonte)}${o.provisorio ? seloProvisorio(o, p.idadeH) : ''}</div>
      ${medidor({ valor: o.valor, base: o.base, meta: o.meta, formato: qtd, rotulo: texto(o.rotulo) || 'Objetivo' })}
      <p class="dg-veredito" data-bateu="${bateu}">${bateu === 'sim' ? pillMeta(true, o.score) : ''}${esc(vereditoTexto(o))}</p>
      ${notasObjetivo(o, { idadeH: p.idadeH, diasInformado })}
      ${finito(cad) ? `<p class="dg-mudo">Cadastros: <b>${esc(num(cad))}</b> (informado à mão, fora da soma).</p>` : ''}
      ${reel && ((!finito(o.valor) && o.id === 'interesse') || velho) ? `<button type="button" class="btn btn-sm" data-dg-ir-numeros data-foco="pm:ir-numeros">${velho ? 'Atualizar os números do app' : 'Informar os números do app'}</button>` : ''}
    </div>`;
}

function porqueHtml(det) {
  const pq = det.post?.porque ?? {};
  const bem = frasesDe(pq.bem);
  const mal = frasesDe(pq.mal);
  const avisos = frasesDe(det.post?.avisos);
  const col = (lado, titulo, ico, itens, vazioTxt) => `
    <div class="dg-porque-col" data-lado="${lado}">
      <h3 class="dg-h4">${icone(ico, 15)}${esc(titulo)}</h3>
      ${itens.length ? `<ul>${itens.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : `<p class="dg-mudo">${esc(vazioTxt)}</p>`}
    </div>`;
  return `
    <div class="dg-porque">
      ${col('bem', 'Por que foi bem', 'check', bem, 'Nenhuma etapa acima da base.')}
      ${col('mal', 'Por que foi mal', 'alerta', mal, 'Nenhuma etapa abaixo da base.')}
    </div>
    ${avisos.length ? `<ul class="dg-avisos">${avisos.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}`;
}

function funilHtml(det) {
  const p = det.post ?? {};
  const f = lista(p.funil).filter(Boolean);
  if (!f.length) return '<h3 class="bloco-titulo">Funil contra a base</h3><p class="dg-mudo">Sem etapa medida pra este post.</p>';
  const valorTxt = (e) => texto(e?.valorTexto) || num(e?.valor, { casas: 1 });
  const baseTxt = (e) => texto(e?.baseTexto) || num(e?.base, { casas: 1 });
  // "54% contra 40% na base"; sem um dos lados, a frase diz qual falta (nada de "sem dado contra sem dado")
  const comparacao = (e) => {
    const v = valorTxt(e);
    const b = baseTxt(e);
    if (v === SEM_DADO && b === SEM_DADO) return `<b>${esc(SEM_DADO)}</b>`;
    if (b === SEM_DADO) return `<b>${esc(v)}</b> (ainda sem base)`;
    if (v === SEM_DADO) return `<b>${esc(SEM_DADO)}</b> (base ${esc(b)})`;
    return `<b>${esc(v)}</b> contra ${esc(b)} na base`;
  };
  return `
    <h3 class="bloco-titulo">Funil contra a base</h3>
    <p class="dg-mudo dg-p-explica">Base: mediana das 10 peças anteriores do mesmo formato, sem anúncio.</p>
    <ul class="dg-funil" role="list">
      ${f.map((e) => {
        const rot = texto(e.rotulo) || rotuloEtapa(e.etapa);
        const marca = e.etapa && e.etapa === p.gargalo ? '<span class="pill dg-gargalo"><b aria-hidden="true">↓</b>gargalo</span>'
          : e.etapa && e.etapa === p.forte ? '<span class="pill dg-forte"><b aria-hidden="true">↑</b>ponto forte</span>' : '';
        return `
          <li class="dg-funil-etapa">
            <div class="dg-funil-nome"><strong>${esc(rot)}</strong>${marca}</div>
            ${divergente(e.score, { rotulo: rot })}
            <p class="dg-funil-num"><span>${comparacao(e)}</span>${NIVEL_TXT[e.nivel] ? pillNivel(e.nivel, { curto: true }) : ''}</p>
            ${texto(e.detalhe) ? `<small class="dg-mudo">${esc(e.detalhe)}</small>` : ''}
          </li>`;
      }).join('')}
    </ul>
    ${tabela([{ titulo: 'Etapa' }, { titulo: 'Valor', num: true }, { titulo: 'Base', num: true }, { titulo: '× a base', num: true }, { titulo: 'Nível' }],
      f.map((e) => [texto(e.rotulo) || rotuloEtapa(e.etapa), valorTxt(e), baseTxt(e), vezesDeScore(e.score), NIVEL_TXT[e.nivel] ?? SEM_DADO]))}`;
}

// opções pra corrigir uma etiqueta; bool sem opções vira sim ou não
function opcoesTag(t) {
  const ops = lista(t?.opcoes).filter((o) => o && o.id != null);
  if (ops.length) return ops;
  if (typeof t?.valor === 'boolean' || t?.tipo === 'bool') return [{ id: true, nome: 'Sim' }, { id: false, nome: 'Não' }];
  return [];
}

function textoEvidencia(e) {
  const tipo = ROTULO_EV[e?.tipo] ?? (texto(e?.tipo) || 'evidência');
  const tempo = texto(e?.tempo);
  const t = texto(e?.texto);
  return t ? `${tipo}${tempo ? ` ${tempo}` : ''}: ${t}` : '';
}

// balão "i" da evidência da IA. Mesmo markup do botaoFontes do core.js (o abre e fecha é o dele, por
// data-pop), mas: texto puro, porque a evidência é texto livre da IA e da legenda (link nenhum, nem https);
// e id fixo por dimensão, porque um id novo a cada desenho (pop-N) fazia a região redesenhar a cada 3 s e
// fechar o balão aberto
export function botaoEvidencias(itens, dim, rotulo) {
  const xs = lista(itens).map((x) => texto(String(x ?? ''))).filter(Boolean);
  if (!xs.length) return '';
  const id = `dg-ev-${ID_DIMENSAO.test(String(dim ?? '')) ? dim : 'x'}`;
  return `<span class="pop"><button type="button" class="btn-icone btn-sm pop-btn" data-pop="${id}" data-foco="${esc(`ev:${dim}`)}" aria-label="${esc(rotulo)}" aria-expanded="false" aria-controls="${id}" title="${esc(rotulo)}">${icone('info', 16)}</button><div class="pop-balao" id="${id}" role="region" aria-label="${esc(rotulo)}" hidden><strong class="pop-titulo">${esc(rotulo)}</strong><ol>${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div></span>`;
}

function tagHtml(t, efeitos, est) {
  const dim = String(t?.dimensao ?? '');
  const nome = texto(t?.nome) || dim;
  const temValor = t?.valor != null && t?.valor !== '';
  const valorTxt = temValor ? (texto(t.nomeValor) || valorBool(t.valor) || String(t.valor)) : SEM_DADO;
  const ef = temValor ? efeitos.get(`${dim}|${String(t.valor)}`) : null;
  const evs = lista(t?.evidencias).map(textoEvidencia).filter(Boolean);
  const ops = opcoesTag(t);
  const manual = t?.fonte === 'manual';
  const editavel = t?.editavel !== false && ops.length > 0 && ID_DIMENSAO.test(dim);
  return `
    <li class="dg-tag">
      <div class="dg-tag-nome"><span>${esc(nome)}</span>${ETAPAS[t?.etapa] ? `<small class="dg-mudo">${esc(ETAPAS[t.etapa])}</small>` : ''}</div>
      <div class="dg-tag-valor">
        <strong${temValor ? '' : ' class="dg-mudo"'}>${esc(valorTxt)}</strong>${temValor ? pillFonte(t.fonte) : ''}
        ${evs.length ? botaoEvidencias(evs, dim, `Evidência da IA: ${nome}`) : ''}
      </div>
      ${ef && !semComparacao(ef) && finito(ef.efeito) ? `
        <div class="dg-tag-efeito" data-mc-dica="${esc(`Nas peças com ${valorTxt}: ${vezesDeScore(ef.mediaCom)} a base; sem: ${vezesDeScore(ef.mediaSem)}`)}">
          <span aria-hidden="true">${divergente(ef.efeito)}</span>
          <small>efeito ${esc(vezesDeScore(ef.efeito))} em ${esc(contagem(ef.n, 'peça', 'peças'))}</small>${pillEvidencia(ef.evidencia)}
        </div>` : ''}
      ${editavel ? `
        <label class="dg-tag-editar"><span class="sr-only">${esc(`Corrigir ${nome}`)}</span>
          <select class="campo" data-dg-tag="${esc(dim)}" data-foco="${esc(`tag:${dim}`)}"${ocupado(est, `tag:${dim}`) ? ' disabled' : ''}>
            <option value="">${manual ? 'Voltar pro automático' : 'Automático'}</option>
            ${ops.map((o) => `<option value="${esc(String(o.id))}"${manual && String(o.id) === String(t.valor) ? ' selected' : ''}>${esc(texto(o.nome) || valorBool(o.id) || String(o.id))}</option>`).join('')}
          </select>
        </label>` : ''}
    </li>`;
}

function tagsPostHtml(det, est) {
  const tags = lista(det.tags).filter((t) => t && t.dimensao != null && t.dimensao !== 'impulsionado');
  const efeitos = new Map(lista(det.efeitosDasTags).filter(Boolean).map((e) => [`${e.dimensao}|${String(e.valor)}`, e]));
  const grupos = new Map();
  for (const t of tags) {
    const g = GRUPO_DIM[t.grupo] ? t.grupo : 'outras';
    if (!grupos.has(g)) grupos.set(g, []);
    grupos.get(g).push(t);
  }
  const ordem = ['fundamento', 'mecanismo', 'contexto', 'outras'].filter((g) => grupos.has(g));
  return `
    <h3 class="bloco-titulo">Pilares e mecanismos</h3>
    <p class="dg-mudo dg-p-explica">Cada etiqueta com a fonte. Corrija no seletor (com o teclado, a escolha grava no Enter ou ao sair do campo): a correção manual vale sobre o cronograma e a IA. O "i" mostra a evidência da IA.</p>
    ${ordem.length ? ordem.map((g) => `
      <div class="dg-tags-grupo">
        <h4 class="dg-h4">${esc(GRUPO_DIM[g] ?? 'Outras')}</h4>
        <ul class="dg-tags" role="list">${grupos.get(g).map((t) => tagHtml(t, efeitos, est)).join('')}</ul>
      </div>`).join('') : '<p class="dg-mudo">Nenhuma etiqueta ainda.</p>'}`;
}

function iaPostHtml(det, est) {
  const ia = det.ia ?? null;
  const rodando = Boolean(det.iaRodando);
  // pedido feito e ainda não é a vez deste post (a fila da IA é uma só no servidor)
  const naFila = !rodando && Boolean(est.iaNaFila);
  const ok = ia?.status === 'ok';
  const parado = rodando || naFila || est.iaIniciando;
  let msg = '';
  let classe = 'dg-mudo';
  if (est.iaIniciando) msg = 'Pedindo pro servidor…';
  else if (rodando) msg = 'Etiquetando com IA: leva de 1 a 3 minutos. Pode fechar o painel, continua no servidor.';
  else if (naFila) msg = 'Na fila da IA: começa quando os posts da frente terminarem. Pode fechar o painel.';
  else if (ok) {
    const quando = ia.em && dataHora(ia.em) !== SEM_DADO ? ` em ${dataHora(ia.em)}` : '';
    const fora = finito(ia.descartadas) && ia.descartadas > 0
      ? ` ${contagem(ia.descartadas, 'etiqueta saiu', 'etiquetas saíram')} por falta de evidência conferida.` : '';
    msg = `Etiquetado pela IA${quando}.${fora}`;
  } else if (ia?.status === 'sem-login') {
    msg = `A IA precisa do login do Claude neste computador.${texto(ia.mensagem) ? ` ${ia.mensagem}` : ''}`;
    classe = 'dg-erro-txt';
  } else if (ia?.status === 'erro') {
    msg = `A última etiquetagem falhou${texto(ia.mensagem) ? `: ${ia.mensagem}` : '.'}`;
    classe = 'dg-erro-txt';
  } else msg = 'A IA olha a peça sem ver os números, e cada etiqueta vem com a evidência (quadro, fala ou legenda).';
  return `
    <div class="dg-p-ia-linha">
      <button type="button" class="btn btn-sm${ok ? '' : ' btn-primario'}" data-dg-p-etiquetar data-foco="pm:etiquetar"${parado ? ' aria-disabled="true"' : ''}>${icone('raio', 14)}${ok ? 'Etiquetar de novo com IA' : 'Etiquetar com IA'}</button>
      <p class="${classe}">${parado ? giro : ''}${esc(msg)}</p>
    </div>`;
}

// o número do app vale a partir do dia 7 do post: informado antes, a comparação fica provisória até alguém
// informar de novo (a idade do número é a de quando foi digitado, não a do post)
export function avisoSeteDias(post, manual) {
  const pub = msDe(post?.timestamp);
  if (!pub) return 'O número só fecha a meta quando é informado com o post já tendo 7 dias; antes disso a comparação fica provisória.';
  const seteDias = dataCurta(new Date(pub + IDADE_REF_H * 3_600_000).toISOString());
  if (manualVelho(post?.objetivo, post?.idadeH)) {
    const dias = diasAoInformar(post.timestamp, manual?.em);
    const quando = finito(dias) ? (dias < 1 ? 'com menos de 1 dia de post' : `com ${plural(dias, 'dia', 'dias')} de post`) : 'antes dos 7 dias';
    return `Os números salvos foram informados ${quando}: copie de novo da tela do app e salve pra fechar a meta.`;
  }
  if (finito(post?.idadeH) && post.idadeH < IDADE_REF_H) return `Informado antes de ${seteDias} (7 dias do post), o número fica provisório: atualize depois dessa data pra fechar a meta.`;
  return 'O número só fecha a meta quando é informado com o post já tendo 7 dias; antes disso a comparação fica provisória.';
}

function numerosPostHtml(det, est) {
  const p = det.post ?? {};
  const reel = p.peca === 'reel' || p.tipoMidia === 'REELS';
  const m = det.manual ?? {};
  const campos = reel ? CAMPOS_NUM : CAMPOS_NUM.filter(([k]) => k === 'cadastros');
  const parado = ocupado(est, 'numeros');
  return `
    <h3 class="bloco-titulo" id="dg-p-t-numeros">Números do app</h3>
    <p class="dg-mudo dg-p-explica">${reel
      ? 'O reel não traz seguidores, visitas ao perfil nem clique no link pela API: copie da tela do post no app do Instagram.'
      : 'Seguidores, visitas e cliques deste formato vêm do Instagram. Aqui entram só os cadastros.'}</p>
    ${reel ? `<p class="dg-p-explica${manualVelho(p.objetivo, p.idadeH) ? ' dg-erro-txt' : ' dg-mudo'}">${esc(avisoSeteDias(p, det.manual))}</p>` : ''}
    <form class="dg-form" data-dg-form="numeros" aria-labelledby="dg-p-t-numeros" novalidate>
      <div class="dg-campos">
        ${campos.map(([k, rot]) => `
          <label class="rotulo">${esc(rot)}
            <input class="campo" type="text" inputmode="numeric" name="${k}" value="${finito(m[k]) ? esc(String(m[k])) : ''}" placeholder="sem dado" autocomplete="off" data-foco="${esc(`num:${k}`)}" />
          </label>`).join('')}
      </div>
      <div class="dg-form-acoes">
        <button type="submit" class="btn btn-sm btn-primario" data-foco="num:salvar"${parado ? ' disabled aria-busy="true"' : ''}>${parado ? 'Salvando…' : 'Salvar números'}</button>
        ${m.em ? `<small class="dg-mudo">Informado${texto(m.autor) ? ` por ${esc(m.autor)}` : ''} em ${esc(dataHora(m.em))}</small>` : ''}
      </div>
    </form>`;
}

// os grupos que o servidor liberou (5 pessoas ou mais na base do post) em linhas de tabela. Só lê
// "visiveis": os percentuais digitados (em "dados", ou soltos na resposta antiga) nunca vão pra tela
export function linhasVisiveis(v) {
  if (!v || typeof v !== 'object') return [];
  const linhas = [];
  const p = (x) => pct(finito(x) ? x : null);
  for (const g of lista(v.genero)) {
    const nome = texto(g?.rotulo) || GENERO_VISIVEL[String(g?.id ?? '').toLowerCase()] || '';
    if (nome && finito(g?.pct)) linhas.push(['Gênero', nome, p(g.pct)]);
  }
  for (const i of lista(v.idade)) if (texto(i?.faixa) && finito(i?.pct)) linhas.push(['Idade', faixaTexto(i.faixa), p(i.pct)]);
  for (const c of lista(v.cidades)) if (texto(c?.nome) && finito(c?.pct)) linhas.push(['Cidade', texto(c.nome), p(c.pct)]);
  for (const c of lista(v.paises)) if (texto(c?.nome) && finito(c?.pct)) linhas.push(['País', texto(c.nome), p(c.pct)]);
  const s = v.seguidores && typeof v.seguidores === 'object' ? v.seguidores : null;
  if (s && finito(s.seguidores)) linhas.push(['Seguidores', 'Já seguiam', p(s.seguidores)]);
  if (s && finito(s.naoSeguidores)) linhas.push(['Seguidores', 'Não seguiam', p(s.naoSeguidores)]);
  return linhas;
}

function publicoBlocoHtml(titulo, fonte, d, extra = '') {
  const frases = frasesDe(d?.frases);
  const quando = d?.em && dataHora(d.em) !== SEM_DADO ? dataHora(d.em) : '';
  const grupos = linhasVisiveis(d?.visiveis);
  // o servidor diz por que não saiu frase (sem grupo de 5 pessoas, ou sem saber quantas contas a tela mede)
  const semFrase = texto(d?.semFrase) || 'Sem frase: nenhum grupo com 5 pessoas ou mais (ou falta o número de contas da base).';
  return `
    <div class="dg-pub">
      <div class="dg-pub-topo"><strong>${esc(titulo)}</strong>${pillFonte(fonte)}${quando ? `<small class="dg-mudo">${esc(quando)}${texto(d.autor) ? ` por ${esc(d.autor)}` : ''}</small>` : ''}</div>
      ${frases.length ? `<ul class="dg-frases">${frases.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : `<p class="dg-mudo">${esc(semFrase)}</p>`}
      ${grupos.length ? tabela([{ titulo: 'Grupo' }, { titulo: 'Quem' }, { titulo: 'Percentual', num: true }], grupos, { resumo: 'Ver os grupos com 5 pessoas ou mais' }) : ''}
      ${extra}
    </div>`;
}

// de onde veio o número de pessoas da base do público do app (a regra de 5 pessoas conta em cima dele)
const ORIGEM_N = { informado: 'o número da tela do app', alcance: 'o alcance do post', interacoes: 'o maior número de interações do post' };
function baseDoAppHtml(app) {
  const partes = [
    texto(app?.baseTexto) ? `Base: ${texto(app.baseTexto)}` : '',
    finito(app?.n) ? `${plural(app.n, 'conta', 'contas')} (${ORIGEM_N[app.nDe] ?? 'contas na base'})` : '',
  ].filter(Boolean);
  return partes.length ? `<small class="dg-mudo">${esc(partes.join(' · '))}</small>` : '';
}

// os números digitados do público do post (pro formulário): em "dados" na resposta nova, soltos na antiga
export function dadosDoApp(app) {
  if (!app || typeof app !== 'object') return null;
  return app.dados && typeof app.dados === 'object' ? app.dados : app;
}

function publicoPostHtml(det, est) {
  const pub = det.publico ?? {};
  const pago = pub.pago && typeof pub.pago === 'object' ? pub.pago : null;
  const app = pub.app && typeof pub.app === 'object' ? pub.app : null;
  const parado = ocupado(est, 'publico');
  const lendo = printRodando(est.leitura) || est.leitura?.etapa === 'enviando';
  const extraPago = pago ? `<small class="dg-mudo">Gasto ${esc(reais(pago.gasto))} · alcance ${esc(num(pago.alcance))} contas${lista(pago.anuncios).length > 1 ? ' (alcance somado dos anúncios)' : ''}</small>` : '';
  // o bloco do app mostra só frases e grupos visíveis; quem digitou e quando saem de "dados" se preciso
  const appTela = app ? { ...app, em: app.em ?? dadosDoApp(app)?.em, autor: app.autor ?? dadosDoApp(app)?.autor } : null;
  return `
    <h3 class="bloco-titulo">Público do post</h3>
    ${!pago && !app ? '<p class="dg-mudo">Sem dado de público deste post. Por post orgânico a Meta não dá idade nem gênero: vem do anúncio ligado ao post ou da tela do app.</p>' : ''}
    ${pago ? publicoBlocoHtml('No alcance pago', 'anuncio', pago, extraPago) : ''}
    ${appTela ? publicoBlocoHtml('Na tela do app', 'app', appTela, baseDoAppHtml(app)) : ''}
    <div class="dg-p-pub-acoes">
      <button type="button" class="btn btn-sm" data-dg-pub-editar data-foco="pub:editar" aria-expanded="${est.editandoPublico ? 'true' : 'false'}" aria-controls="dg-pub-form"${parado ? ' disabled' : ''}>${icone('editar', 14)}${app ? 'Corrigir do app' : 'Informar do app'}</button>
      <button type="button" class="btn btn-sm" data-dg-print-btn data-foco="pub:print"${lendo || parado ? ' aria-disabled="true"' : ''}>${icone('busca', 14)}Ler do print</button>
      <input type="file" hidden data-dg-print accept="image/png,image/jpeg,image/webp" multiple />
      ${app ? `<button type="button" class="btn btn-sm btn-fantasma btn-perigo" data-dg-pub-apagar data-foco="pub:apagar"${parado ? ' disabled' : ''}>${icone('lixo', 14)}Apagar os números do app</button>` : ''}
    </div>
    <small class="dg-mudo">Print: até 3 imagens da tela de público do post (PNG, JPG ou WEBP, até 4 MB cada e uns 9 MB somadas). Nada é salvo sem você conferir.</small>`;
}

// leitura do print (publico.mjs): { etapa: 'preparando'|'lendo'|'pronto'|'erro', erro, sugestao, avisos }.
// A sugestão pode vir aninhada ({ sugestao, avisos, vazio }): aceita as duas formas
function sugestaoDoPrint(l) {
  const s = l?.sugestao;
  if (!s || typeof s !== 'object') return null;
  const dentro = s.sugestao && typeof s.sugestao === 'object' ? s.sugestao : s;
  return s.vazio === true ? null : dentro;
}
const avisosDoPrint = (l) => frasesDe([...lista(l?.avisos), ...lista(l?.sugestao?.avisos)]);
const printRodando = (l) => Boolean(l && !l.sugestao && !l.erro && texto(l.etapa) && !['ok', 'erro', 'fim', 'pronto', 'pronta', 'enviando'].includes(l.etapa));

// est.sugestaoPendente: leitura pronta que NÃO foi pro formulário (a pessoa já estava digitando nele, ou a
// leitura é de antes de reabrir o painel). Só entra com o clique em "Usar os números lidos"
export function printEstadoHtml(l, est = {}) {
  const pendente = est?.sugestaoPendente && typeof est.sugestaoPendente === 'object' ? est.sugestaoPendente : null;
  if (pendente) {
    const avisos = avisosDoPrint(l);
    const quando = l?.fim && dataHora(l.fim) !== SEM_DADO ? ` (${dataHora(l.fim)})` : '';
    const msg = est.printRetomado
      ? `Tem uma leitura de print pronta deste post${quando}. Nada foi salvo ainda.`
      : 'Li o print. Você já tinha começado a digitar no formulário: os números lidos só entram se você pedir (e trocam o que foi digitado).';
    return `<p class="dg-ok-txt">${esc(msg)}</p>
      <div class="dg-print-acoes"><button type="button" class="btn btn-sm btn-primario" data-dg-print-usar data-foco="pr:usar">Usar os números lidos</button></div>
      ${avisos.length ? `<ul class="dg-avisos">${avisos.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}`;
  }
  if (!l) return '';
  if (l.etapa === 'enviando') return `<p class="dg-mudo">${giro}Mandando as imagens…</p>`;
  if (texto(l.erro)) return `<p class="dg-erro-txt">Não consegui ler o print: ${esc(l.erro)}</p>`;
  if (l.sugestao) {
    const avisos = avisosDoPrint(l);
    if (!sugestaoDoPrint(l)) return '<p class="dg-erro-txt">Não achei números de público no print. Confira se é a tela de público do post.</p>';
    return `<p class="dg-ok-txt">Li o print. Confira os números no formulário e clique em Salvar: nada foi salvo ainda.</p>
      ${avisos.length ? `<ul class="dg-avisos">${avisos.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}`;
  }
  if (printRodando(l)) {
    // consulta que falhou (rede ou servidor): a leitura segue no servidor e a tela tenta de novo
    const tentando = finito(est?.falhasPrint) && est.falhasPrint > 0 ? ' Perdi o contato com o servidor por um instante: tentando de novo.' : '';
    return `<p class="dg-mudo">${giro}${esc(`Lendo o print… leva até 1 minuto.${tentando}`)}</p>`;
  }
  if (l.etapa === 'pronto') return '<p class="dg-erro-txt">A leitura terminou sem números. Tente outro print.</p>';
  return '';
}

function campoPct(campo, chave, rotulo, valor) {
  return `
    <label class="rotulo">${esc(rotulo)}
      <span class="dg-pct"><input class="campo" type="text" inputmode="decimal" data-campo="${esc(campo)}" data-chave="${esc(chave)}"
        value="${finito(valor) ? esc(num(valor, { casas: 2 })) : ''}" autocomplete="off" data-foco="${esc(`pub:${campo}:${chave}`)}" /><span aria-hidden="true">%</span></span>
    </label>`;
}

function linhaLugar(tipo, i, item, rotulo) {
  // "da cidade 1", "do país 1"
  const artigo = tipo === 'paises' ? 'do' : 'da';
  return `
    <div class="dg-lugar" data-lugar="${tipo}">
      <label class="rotulo">${esc(`${rotulo} ${i + 1}`)}<input class="campo" type="text" maxlength="80" data-parte="nome" value="${esc(texto(item?.nome))}" autocomplete="off" data-foco="${esc(`pub:${tipo}:${i}:nome`)}" /></label>
      <label class="rotulo">Percentual<span class="dg-pct"><input class="campo" type="text" inputmode="decimal" data-parte="pct" value="${finito(item?.pct) ? esc(num(item.pct, { casas: 2 })) : ''}" autocomplete="off" data-foco="${esc(`pub:${tipo}:${i}:pct`)}" aria-label="${esc(`Percentual ${artigo} ${rotulo.toLowerCase()} ${i + 1}`)}" /><span aria-hidden="true">%</span></span></label>
    </div>`;
}

// app = o público do app como o detalhe manda (os números digitados em app.dados; soltos na resposta antiga)
export function publicoFormHtml(app, sug, est) {
  const v = sug && typeof sug === 'object' ? sug : dadosDoApp(app) ?? {};
  const g = v.genero ?? {};
  const idade = v.idade ?? {};
  const completar = (xs, n) => {
    const r = lista(xs).slice(0, 5);
    while (r.length < n) r.push({});
    return r;
  };
  const cidades = completar(v.cidades, 3);
  const paises = completar(v.paises, 2);
  // a base é escolha obrigatória: presumir "visualizações" gravava a base errada quando a pessoa copiava
  // outra aba do app (e o filtro de 5 pessoas passava a usar outro número)
  const base = BASES_APP.some(([id]) => id === v.base) ? v.base : '';
  const contas = Number.isInteger(v.contas) && v.contas >= 0 ? String(v.contas) : '';
  const parado = ocupado(est, 'publico');
  return `
    <form class="dg-form dg-pub-form" id="dg-pub-form" data-dg-form="publico" novalidate>
      <p class="dg-p-explica">${sug ? 'Números lidos do print: confira antes de salvar.' : 'Copie os percentuais da tela de público do post no app do Instagram. Campo vazio fica sem dado.'}</p>
      <div class="dg-campos dg-pub-base">
        <label class="rotulo">Base dos percentuais
          <select class="campo" name="base" data-foco="pub:base" required>
            <option value=""${base ? '' : ' selected'}>Escolha</option>
            ${BASES_APP.map(([id, nome]) => `<option value="${id}"${id === base ? ' selected' : ''}>${esc(nome)}</option>`).join('')}
          </select>
        </label>
        <label class="rotulo">Contas na base (o número que a tela mostra, se aparecer)
          <input class="campo" type="text" inputmode="numeric" name="contas" value="${esc(contas)}" placeholder="sem dado" autocomplete="off" data-foco="pub:contas" />
        </label>
      </div>
      <p class="dg-mudo dg-p-explica">Só grupo de 5 pessoas ou mais vira frase. Sem o número de contas, vale o alcance do post (na base de contas com engajamento, o maior entre curtidas, salvamentos, comentários e compartilhamentos).</p>
      <fieldset class="dg-fieldset"><legend>Gênero</legend>
        <div class="dg-campos">${campoPct('genero', 'mulheres', 'Mulheres', g.mulheres)}${campoPct('genero', 'homens', 'Homens', g.homens)}</div>
      </fieldset>
      <fieldset class="dg-fieldset"><legend>Idade</legend>
        <div class="dg-campos">${FAIXAS.map((f) => campoPct('idade', f, faixaTexto(f), idade[f])).join('')}</div>
      </fieldset>
      <fieldset class="dg-fieldset"><legend>Seguidores</legend>
        <div class="dg-campos">${campoPct('seguidores', 'seguidores', 'Seguidores', v.seguidores)}${campoPct('naoSeguidores', 'naoSeguidores', 'Não seguidores', v.naoSeguidores)}</div>
      </fieldset>
      <fieldset class="dg-fieldset"><legend>Cidades</legend>${cidades.map((c, i) => linhaLugar('cidades', i, c, 'Cidade')).join('')}</fieldset>
      <fieldset class="dg-fieldset"><legend>Países</legend>${paises.map((c, i) => linhaLugar('paises', i, c, 'País')).join('')}</fieldset>
      <div class="dg-form-acoes">
        <button type="submit" class="btn btn-sm btn-primario" data-foco="pub:salvar"${parado ? ' disabled aria-busy="true"' : ''}>${parado ? 'Salvando…' : 'Salvar público do app'}</button>
        <button type="button" class="btn btn-sm btn-fantasma" data-dg-pub-cancelar data-foco="pub:cancelar">Cancelar</button>
      </div>
    </form>`;
}

function textoAnuncio(escolha, efetivo, talvez) {
  if (escolha === 'sim') return 'Marcado à mão: teve anúncio. O post fica fora da base de comparação.';
  if (escolha === 'nao') return 'Marcado à mão: sem anúncio.';
  const auto = efetivo === true ? 'Automático: tem anúncio ligado a este post, então ele fica fora da base.'
    : efetivo === false ? 'Automático: nenhum anúncio ligado a este post.'
      : 'Automático: sem dado de anúncio (conecte os anúncios na aba Público).';
  return talvez && efetivo !== true ? `${auto} As views totais passam das orgânicas: pode ter tido anúncio.` : auto;
}

function anuncioHtml(det, est) {
  const p = det.post ?? {};
  // a escolha manual vem nas tags da linha do post (fonte manual); o detalhe tira "impulsionado" da lista
  const tag = p.tags?.impulsionado ?? lista(det.tags).find((t) => t?.dimensao === 'impulsionado') ?? null;
  const manual = tag?.fonte === 'manual' && paraBool(tag.valor) != null;
  const escolha = manual ? (paraBool(tag.valor) ? 'sim' : 'nao') : 'auto';
  const parado = ocupado(est, 'anuncio');
  const op = (id, rot) => `<button type="button" data-dg-anuncio="${id}" data-foco="${`an:${id}`}" aria-pressed="${escolha === id}"${parado ? ' disabled' : ''}>${esc(rot)}</button>`;
  return `
    <h3 class="bloco-titulo" id="dg-p-t-anuncio">Teve anúncio</h3>
    <div class="segmentado dg-p-anuncio" role="group" aria-labelledby="dg-p-t-anuncio">${op('sim', 'Sim')}${op('nao', 'Não')}${op('auto', 'Automático')}</div>
    <p class="dg-mudo dg-p-explica">${esc(textoAnuncio(escolha, p.impulsionado ?? null, Boolean(p.talvezImpulsionado)))}</p>`;
}

function hipotesesPostHtml(det) {
  const hs = lista(det.hipoteses).filter(Boolean);
  if (!hs.length) return '';
  return `<h3 class="bloco-titulo">Hipóteses desta peça</h3><ul class="dg-hipoteses" role="list">${hs.map((h) => hipoteseHtml(h, { comPost: false })).join('')}</ul>`;
}

function rodapeHtml(det, est = {}) {
  const av = det?.analiseVideo ?? {};
  const pode = Boolean(det && est.temAnalise && (av.podeAnalisar || av.existe));
  return `
    ${pode ? `<button type="button" class="btn btn-primario" data-dg-analise data-foco="rod:analise">${icone('play', 16)}${av.existe ? 'Ver a análise do vídeo' : 'Analisar o vídeo'}</button>` : ''}
    <span class="espaco"></span>
    <button type="button" class="btn btn-fantasma" data-fechar data-foco="rod:fechar">Fechar</button>`;
}

// regiões do painel, na ordem da tela; cada uma redesenha sozinha
const REGIOES = {
  cab: (det) => cabPostHtml(det),
  vinculo: (det, est) => vinculoHtml(det, est),
  meta: (det) => metaPostHtml(det),
  porque: (det) => porqueHtml(det),
  funil: (det) => funilHtml(det),
  mecanismos: (det, est) => tagsPostHtml(det, est),
  ia: (det, est) => iaPostHtml(det, est),
  numeros: (det, est) => numerosPostHtml(det, est),
  publico: (det, est) => publicoPostHtml(det, est),
  print: (det, est) => printEstadoHtml(est.leitura, est),
  pubform: (det, est) => (est.editandoPublico ? publicoFormHtml(det.publico?.app, est.sugestao, est) : ''),
  anuncio: (det, est) => anuncioHtml(det, est),
  hipoteses: (det) => hipotesesPostHtml(det),
};
const ORDEM_REGIOES = Object.keys(REGIOES);
// estas avisam o leitor de tela quando mudam: ficam sempre no DOM, mesmo vazias
const VIVAS = new Set(['ia', 'print']);

export function regiaoHtml(nome, det, est = {}) {
  const f = REGIOES[nome];
  return f && det && typeof det === 'object' ? f(det, est ?? {}) : '';
}

export function painelHtml(det, est = {}) {
  const e = est ?? {};
  const id = String(det?.post?.midiaId ?? e.id ?? '');
  const sub = det ? subtituloPost(det) : e.erro ? 'Não abriu' : 'Carregando…';
  return `
    <div class="painel-topo">
      <div><h2>Diagnóstico do post</h2><p data-dg-p-sub>${esc(sub)}</p></div>
      ${BTN_FECHAR}
    </div>
    <div class="painel-corpo dg-painel" data-dg-painel="${esc(id)}">
      <div data-dg-p-estado>${det ? '' : e.erro ? erroPainelHtml(e.erro) : carregandoPainelHtml()}</div>
      ${ORDEM_REGIOES.map((r) => {
        const html = det ? regiaoHtml(r, det, e) : '';
        const viva = VIVAS.has(r);
        return `<section class="dg-p-regiao" data-regiao="${r}"${viva ? ' aria-live="polite"' : ''}${!viva && !html.trim() ? ' hidden' : ''}>${html}</section>`;
      }).join('')}
    </div>
    <div class="painel-rodape dg-p-rodape" data-dg-p-rodape>${rodapeHtml(det, e)}</div>`;
}

// ════════════════════════════════════════════════════════════════════════
// DOM: aba
// ════════════════════════════════════════════════════════════════════════

const st = {
  dados: null, codebook: null, erro: '', carregando: false, velho: true, denovo: false, lidoEm: 0, promessa: null,
  ordem: 'recentes', mostrar: PAGINA, dimensao: null, vinculando: new Set(), loteIniciando: false, timerLote: null,
  focoReserva: null, agendaRodando: '', agendaAberta: false,
};
let alvo = null; // { el }
let aoAnalisarAtual = null;

const estadoAba = () => ({
  carregando: st.carregando, erro: st.erro, ordem: st.ordem, mostrar: st.mostrar, dimensao: st.dimensao,
  codebook: st.codebook, vinculando: st.vinculando, loteIniciando: st.loteIniciando,
  agendaRodando: st.agendaRodando, agendaAberta: st.agendaAberta,
});

let ligadoGlobal = false;
function ligarUmaVez() {
  if (ligadoGlobal) return;
  ligadoGlobal = true;
  ligarDicas();
  // janela de volta: as consultas que pararam escondidas voltam
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    agendarLote();
    agendarPainel();
    agendarPrint();
  });
}

function desenhar({ focar = null } = {}) {
  const el = alvo?.el;
  if (!el?.isConnected) return;
  const ativo = document.activeElement;
  const foco = el.contains(ativo) ? ativo?.dataset?.foco ?? null : null;
  const semFoco = !ativo || ativo === document.body;
  el.innerHTML = abaHtml(st.dados, estadoAba());
  ligarAba(el);
  const achar = (f) => (f ? el.querySelector(`[data-foco="${CSS.escape(f)}"]`) : null);
  let destino = achar(focar) ?? achar(foco);
  // o controle sumiu (sugestão resolvida): o foco vai pro título da seção, não pro começo da página
  if (!destino && (foco || semFoco) && st.focoReserva) destino = lista(st.focoReserva).map(achar).find(Boolean) ?? null;
  destino?.focus({ preventScroll: true });
  // a reserva vale até a lista nova chegar
  if (!st.carregando) st.focoReserva = null;
}

// busca a aba; chamada com outra busca no caminho só pede mais uma volta (a resposta dela pode ser velha)
function carregar() {
  if (st.carregando) {
    st.denovo = true;
    return st.promessa;
  }
  st.carregando = true;
  st.promessa = (async () => {
    do {
      st.denovo = false;
      st.velho = false;
      desenhar();
      try {
        const [dados, codebook] = await Promise.all([
          api('GET', '/api/metricas/diagnostico'),
          // o nome das dimensões vem do codebook; se falhar, a aba segue com o id legível
          st.codebook ? Promise.resolve(st.codebook) : api('GET', '/api/metricas/codebook').catch(() => null),
        ]);
        st.dados = dados && typeof dados === 'object' ? dados : null;
        st.codebook = codebook ?? st.codebook;
        st.lidoEm = Date.now();
        st.erro = st.dados ? '' : 'O servidor mandou uma resposta vazia';
      } catch (e) {
        st.erro = e?.message || 'Erro desconhecido';
      }
    } while (st.denovo);
    st.carregando = false;
    desenhar();
    agendarLote();
  })();
  return st.promessa;
}

const ligadosAba = new WeakSet();
function ligarAba(el) {
  el.onclick = aoClicarAba;
  el.onchange = aoMudarAba;
  if (!ligadosAba.has(el)) {
    ligadosAba.add(el);
    el.addEventListener('error', aoFalharImagem, true);
    // toggle não sobe: escuta na captura pra lembrar o aviso da agenda aberto entre um desenho e outro
    el.addEventListener('toggle', (e) => {
      if (e.target instanceof Element && e.target.matches('details.dg-agenda')) st.agendaAberta = e.target.open;
    }, true);
  }
  // na lista, o medidor não vira parada de Tab: o botão da linha já diz valor, base e meta
  for (const m of el.querySelectorAll('.dg-peca .mc-medidor')) m.setAttribute('tabindex', '-1');
}

function aoFalharImagem(e) {
  const t = e.target;
  if (t?.tagName === 'IMG' && t.closest?.('.dg-mini')) t.remove();
}

const desligado = (b) => b.disabled || b.getAttribute('aria-disabled') === 'true';

function aoClicarAba(e) {
  const t = e.target instanceof Element ? e.target : null;
  if (!t || !alvo?.el) return;
  const b = t.closest('button');
  if (b && alvo.el.contains(b)) {
    if (desligado(b)) return;
    if (b.matches('[data-dg-tentar]')) {
      st.erro = '';
      carregar();
    } else if (b.matches('[data-dg-vincular]')) vincular(b.dataset.dgVincular, b.dataset.reel);
    else if (b.matches('[data-dg-lote]')) iniciarLote();
    else if (b.matches('[data-dg-ordem]')) {
      st.ordem = b.dataset.dgOrdem === 'score' ? 'score' : 'recentes';
      st.mostrar = PAGINA;
      desenhar();
    } else if (b.matches('[data-dg-mais]')) mostrarMais();
    else if (b.matches('[data-dg-agenda]')) tentarTarefa(b.dataset.dgAgenda);
    else if (b.matches('[data-dg-post]')) abrirPost(b.dataset.dgPost, { ir: b.dataset.dgIr === 'numeros' ? 'numeros' : null });
    return;
  }
  // clique em qualquer lugar da linha da peça (fora de link e controle) abre o painel
  const li = t.closest('[data-dg-linha]');
  if (li && alvo.el.contains(li) && !t.closest('a, button, select, input, label, summary, details')) abrirPost(li.dataset.dgLinha);
}

function aoMudarAba(e) {
  const s = e.target;
  if (s?.matches?.('[data-dg-dimensao]') && ID_DIMENSAO.test(s.value)) {
    st.dimensao = s.value;
    desenhar();
  }
}

// mais peças na lista: o foco vai pra primeira que apareceu
function mostrarMais() {
  const posts = ordenarPosts(lista(st.dados?.posts).filter((p) => p && idOk(p.midiaId)), st.ordem);
  const primeira = posts[st.mostrar];
  st.mostrar += PAGINA;
  desenhar({ focar: primeira ? `p:${primeira.midiaId}` : null });
}

// o vínculo grava no db.json (o permalink da peça entra, e sai das outras): o cronograma do front relê o
// estado, senão a peça aberta ali mostraria o link velho e o Salvar da edição devolveria o link antigo
function recarregarCronograma() {
  recarregar().catch(() => { /* a próxima navegação relê; o vínculo já está salvo */ });
}

async function vincular(midiaId, reelId) {
  const id = String(midiaId ?? '');
  if (!idOk(id) || !reelOk(reelId) || st.vinculando.has(id)) return;
  st.vinculando.add(id);
  desenhar();
  let certo = false;
  try {
    await api('PUT', `/api/metricas/post/${encodeURIComponent(id)}/vinculo`, { reelId });
    certo = true;
    toast('Post vinculado à peça do cronograma');
  } catch (e) {
    toast(e?.message || 'Não vinculou');
  }
  if (certo) {
    st.focoReserva = ['sec:pendencias', 'sec:pecas'];
    st.velho = true;
    st.erro = '';
    recarregarCronograma();
    // "Vinculando…" fica na tela até a lista nova chegar
    await carregar();
  }
  st.vinculando.delete(id);
  desenhar();
}

// "Tentar agora" de uma tarefa automática que falhou (POST /agenda/:tarefa responde em até 25 s; o que
// passar disso segue no servidor e o próximo GET mostra)
async function tentarTarefa(tarefa) {
  if (!TAREFAS_AGENDA.includes(tarefa) || st.agendaRodando) return;
  st.agendaRodando = tarefa;
  st.agendaAberta = true;
  desenhar({ focar: `agenda:${tarefa}` });
  const nome = ROTULO_TAREFA[tarefa];
  try {
    const r = await api('POST', `/api/metricas/agenda/${encodeURIComponent(tarefa)}`);
    const res = r?.resultado ?? null;
    if (res?.rodando) toast(`${nome}: ainda rodando. A aba atualiza quando terminar`);
    else if (res?.ok === false) toast(`${nome}: falhou de novo${texto(res.erro) ? `. ${res.erro}` : ''}`);
    // pulou (ex.: já tinha uma leitura do Instagram rodando): diz o porquê, não "deu certo"
    else if (texto(res?.pulada)) toast(`${nome}: ${res.pulada}`);
    else toast(`${nome}: deu certo`);
    // a resposta é o estado novo da agenda (mais o resultado): o aviso já sai certo antes do GET da aba
    if (st.dados && r && typeof r === 'object') st.dados.agenda = Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'resultado'));
  } catch (e) {
    toast(e?.message || 'Não rodou');
  }
  st.agendaRodando = '';
  // o botão some quando a tarefa volta a dar certo: o foco vai pro aviso (ou pro topo da aba)
  st.focoReserva = ['agenda:resumo', 'sec:metas'];
  invalidar();
  desenhar();
}

// ── etiquetagem em lote ──
function desenharLote() {
  const caixa = alvo?.el?.isConnected ? alvo.el.querySelector('[data-dg-lote-caixa]') : null;
  if (!caixa) return;
  const ia = st.dados?.ia ?? null;
  const b = caixa.querySelector('[data-dg-lote]');
  if (b) {
    if (iaRodando(ia) || st.loteIniciando) b.setAttribute('aria-disabled', 'true');
    else b.removeAttribute('aria-disabled');
  }
  const estado = caixa.querySelector('[data-dg-lote-estado]');
  const html = loteEstadoHtml(ia, st.loteIniciando);
  // só troca quando muda: o leitor de tela não repete o mesmo andamento a cada 3 s
  if (estado && htmlLote.get(estado) !== html) {
    htmlLote.set(estado, html);
    estado.innerHTML = html;
  }
}
const htmlLote = new WeakMap();

async function iniciarLote() {
  if (st.loteIniciando || iaRodando(st.dados?.ia)) return;
  st.loteIniciando = true;
  desenharLote();
  try {
    const r = await api('POST', '/api/metricas/etiquetar-lote', {});
    if (st.dados) st.dados.ia = r?.ia ?? st.dados.ia;
    toast('A etiquetagem com IA começou');
  } catch (e) {
    toast(e?.message || 'Não começou');
  }
  st.loteIniciando = false;
  desenharLote();
  agendarLote();
}

function agendarLote() {
  clearTimeout(st.timerLote);
  st.timerLote = null;
  if (!iaRodando(st.dados?.ia) || !alvo?.el?.isConnected || document.visibilityState === 'hidden') return;
  st.timerLote = setTimeout(consultarLote, CONSULTA_MS);
}

async function consultarLote() {
  st.timerLote = null;
  if (!alvo?.el?.isConnected || document.visibilityState === 'hidden') return;
  let ia;
  try {
    ia = (await api('GET', '/api/metricas/etiquetar'))?.ia ?? null;
  } catch {
    agendarLote();
    return;
  }
  const antes = iaRodando(st.dados?.ia);
  if (st.dados) st.dados.ia = ia;
  if (antes && !iaRodando(ia)) {
    toast(toastFimLote(ia));
    invalidar();
    return;
  }
  desenharLote();
  agendarLote();
}

// ?post=<midiaId>: abre o painel uma vez e tira o pedido do endereço
function lerPedidoDoEndereco() {
  const hash = String(location.hash ?? '');
  const i = hash.indexOf('?');
  if (i < 0) return;
  const params = new URLSearchParams(hash.slice(i + 1));
  const id = params.get('post');
  if (id == null) return;
  params.delete('post');
  const resto = params.toString();
  // limpa antes: o render da página pode rodar de novo e o painel abriria outra vez
  history.replaceState(null, '', `${hash.slice(0, i)}${resto ? `?${resto}` : ''}`);
  if (!idOk(id)) {
    toast('Link de post inválido');
    return;
  }
  // setTimeout (não microtask): no hashchange este módulo roda antes do aoNavegar do main.js, que fecha
  // qualquer painel aberto na navegação e foca a vista. Abrir depois de todos os ouvintes do evento
  // mantém o painel aberto e com o foco
  setTimeout(() => abrirPost(id), 0);
}

export function montar(el, { aoAnalisar } = {}) {
  if (!el) return;
  alvo = { el };
  if (typeof aoAnalisar === 'function') aoAnalisarAtual = aoAnalisar;
  ligarUmaVez();
  if (st.carregando) desenhar();
  else if (st.velho || st.erro || !st.dados || Date.now() - st.lidoEm > VELHO_MS) carregar();
  else desenhar();
  agendarLote();
  lerPedidoDoEndereco();
}

// dado velho: sincronizou, editou um post, terminou a IA. Com a aba na tela, busca já
export function invalidar() {
  st.velho = true;
  st.erro = '';
  if (st.carregando) st.denovo = true;
  else if (alvo?.el?.isConnected) carregar();
}

// ════════════════════════════════════════════════════════════════════════
// DOM: painel do post
// ════════════════════════════════════════════════════════════════════════

// iaNaFila: a etiquetagem deste post foi pedida (aqui ou pelo lote) e o resultado ainda não voltou.
// O detalhe só diz iaRodando pro post da vez; na fila, o sinal de fim é o ia.em do registro mudar
const IA_ESPERA_MAX = 20 * 60_000;
// estado do painel que um post novo zera (volta fica de fora: é de quem abriu, não do post)
const PAINEL_LIMPO = () => ({
  dados: null, erro: '', timer: null, timerPrint: null, leitura: null, sugestao: null, sugestaoPendente: null,
  printRetomado: false, printConferido: false, falhasPrint: 0, editandoPublico: false, vinculoEscolha: null,
  salvando: new Set(), iaIniciando: false, iaNaFila: false, iaAntes: null, iaDesde: 0, irPara: null, focoPendente: null,
});
const pn = { id: null, seq: 0, volta: null, ...PAINEL_LIMPO() };
const htmlRegiao = new WeakMap();

const estadoPainel = () => ({
  id: pn.id, erro: pn.erro, leitura: pn.leitura, sugestao: pn.sugestao, sugestaoPendente: pn.sugestaoPendente,
  printRetomado: pn.printRetomado, falhasPrint: pn.falhasPrint, editandoPublico: pn.editandoPublico,
  vinculoEscolha: pn.vinculoEscolha, salvando: pn.salvando, iaIniciando: pn.iaIniciando, iaNaFila: pn.iaNaFila,
  temAnalise: typeof aoAnalisarAtual === 'function',
});

// o painel deste post, se ainda estiver aberto (outro painel por cima tira o nosso do DOM)
function painelEl() {
  if (!pn.id) return null;
  return document.querySelector(`#painel:not([hidden]) .dg-painel[data-dg-painel="${CSS.escape(pn.id)}"]`)?.closest('#painel') ?? null;
}

// o data-foco do controle da aba que abriu o painel (a lista é redesenhada a cada edição, então guardar o
// elemento não serve: ele sai do DOM e o fechar do core.js jogaria o foco no começo da página)
function focoDeQuemAbriu() {
  const a = document.activeElement;
  return a && alvo?.el?.contains(a) ? a.closest('[data-foco]')?.dataset?.foco ?? null : null;
}

// fechar o painel (X, Fechar, véu ou Esc, tudo no core.js): se o foco caiu no body porque o botão que abriu
// sumiu no redesenho, volta pro controle equivalente da aba. Observa o hidden do #painel, que o core.js
// cria uma vez e reaproveita
let observandoPainel = false;
function observarFechamento() {
  const p = document.getElementById('painel');
  if (observandoPainel || !p || typeof MutationObserver !== 'function') return;
  observandoPainel = true;
  new MutationObserver(() => {
    if (!p.hidden) return;
    const volta = pn.volta;
    pn.volta = null;
    clearTimeout(pn.timer);
    clearTimeout(pn.timerPrint);
    const a = document.activeElement;
    if (!volta || (a && a !== document.body) || !alvo?.el?.isConnected) return;
    alvo.el.querySelector(`[data-foco="${CSS.escape(volta)}"]`)?.focus({ preventScroll: true });
  }).observe(p, { attributes: true, attributeFilter: ['hidden'] });
}

export function abrirPost(midiaId, { ir = null } = {}) {
  const id = String(midiaId ?? '');
  if (!idOk(id)) {
    toast('Não achei esse post');
    return;
  }
  ligarUmaVez();
  clearTimeout(pn.timer);
  clearTimeout(pn.timerPrint);
  // painel fechado: quem abriu é o controle com o foco. Aberto (outro post por cima do nosso): fica o de antes
  const aberto = document.getElementById('painel')?.hidden === false;
  const volta = aberto ? (painelEl() ? pn.volta : null) : focoDeQuemAbriu();
  Object.assign(pn, { id, seq: pn.seq + 1, volta, ...PAINEL_LIMPO(), irPara: ir });
  const p = abrirPainel(painelHtml(null, estadoPainel()), { largo: true });
  ligarPainel(p);
  observarFechamento();
  carregarPost();
}

function ligarPainel(p) {
  const corpo = p?.querySelector('.dg-painel');
  const rodape = p?.querySelector('[data-dg-p-rodape]');
  if (!corpo || !rodape) return;
  // corpo e rodapé nascem de novo a cada abrirPainel: os ouvintes não acumulam
  corpo.addEventListener('click', aoClicarPainel);
  rodape.addEventListener('click', aoClicarPainel);
  corpo.addEventListener('change', aoMudarPainel);
  corpo.addEventListener('submit', aoEnviarPainel);
  corpo.addEventListener('input', (e) => {
    const f = e.target?.closest?.('form[data-dg-form]');
    if (f) f.dataset.dgSujo = '1';
  });
  // seletor de etiqueta: sabe se a escolha veio do mouse ou do teclado (ver aoMudarPainel)
  corpo.addEventListener('pointerdown', (e) => {
    const s = e.target instanceof Element ? e.target.closest('select[data-dg-tag]') : null;
    if (s) s.dataset.dgPonteiro = '1';
  }, true);
  corpo.addEventListener('keydown', aoTeclarTag, true);
  corpo.addEventListener('focusout', aoSairTag, true);
  corpo.addEventListener('error', aoFalharImagem, true);
}

// região igual não é tocada. O id do balão "i" de fora (pop-N do core.js) muda a cada desenho: sai da
// comparação, senão a região redesenharia a cada 3 s e fecharia o balão e o seletor abertos
const semIdsDeBalao = (html) => html.replace(/\bpop-\d+\b/g, 'pop');
function trocar(el, html) {
  const chave = semIdsDeBalao(html);
  if (!el || htmlRegiao.get(el) === chave) return false;
  htmlRegiao.set(el, chave);
  el.innerHTML = html;
  return true;
}

function desenharPainel() {
  const p = painelEl();
  if (!p) return;
  const det = pn.dados;
  const est = estadoPainel();
  const ativo = document.activeElement;
  const noPainel = Boolean(ativo && ativo !== p && p.contains(ativo));
  // primeiro o controle que está com o foco; se ele sumir, o que a edição pediu (focoPendente)
  const candidatos = [noPainel ? ativo.dataset?.foco : null, pn.focoPendente].filter(Boolean);
  const sub = p.querySelector('[data-dg-p-sub]');
  if (sub) sub.textContent = det ? subtituloPost(det) : pn.erro ? 'Não abriu' : 'Carregando…';
  trocar(p.querySelector('[data-dg-p-estado]'), det ? '' : pn.erro ? erroPainelHtml(pn.erro) : carregandoPainelHtml());
  for (const sec of p.querySelectorAll('[data-regiao]')) {
    // formulário com digitação pendente fica como está (uma edição noutra região não apaga o que foi digitado)
    if (sec.querySelector('[data-dg-sujo]')) continue;
    const html = det ? regiaoHtml(sec.dataset.regiao, det, est) : '';
    trocar(sec, html);
    if (!VIVAS.has(sec.dataset.regiao)) sec.hidden = !html.trim();
  }
  trocar(p.querySelector('[data-dg-p-rodape]'), rodapeHtml(det, est));
  for (const c of candidatos) {
    const f = p.querySelector(`[data-foco="${CSS.escape(c)}"]`);
    if (!f || f.disabled) continue;
    if (f !== document.activeElement) f.focus({ preventScroll: true });
    if (c === pn.focoPendente) pn.focoPendente = null;
    break;
  }
  // sem edição no caminho, o pedido de foco não fica pendurado pra roubar o foco depois
  if (!pn.salvando.size) pn.focoPendente = null;
  if (det && pn.irPara === 'numeros') {
    pn.irPara = null;
    irParaNumeros();
  }
}

function irParaNumeros() {
  const sec = painelEl()?.querySelector('[data-regiao="numeros"]');
  if (!sec || sec.hidden) return;
  sec.scrollIntoView({ block: 'start', behavior: semMovimento() ? 'auto' : 'smooth' });
  sec.querySelector('input')?.focus({ preventScroll: true });
}

async function carregarPost({ silencioso = false } = {}) {
  const id = pn.id;
  const minha = ++pn.seq;
  clearTimeout(pn.timer);
  pn.timer = null;
  let det = null;
  let erro = '';
  try {
    det = await api('GET', `/api/metricas/post/${encodeURIComponent(id)}`);
  } catch (e) {
    erro = e?.message || 'Erro desconhecido';
  }
  // outro post aberto, ou uma edição já trouxe dado mais novo
  if (pn.id !== id || minha !== pn.seq) return;
  if (det?.post) {
    acompanharIa(det);
    pn.dados = det;
    pn.erro = '';
  } else if (!pn.dados) pn.erro = erro || 'O servidor não mandou o post';
  else if (erro && !silencioso) toast(erro);
  desenharPainel();
  agendarPainel();
  // primeira carga do post: uma leitura de print pode estar rodando (ou pronta) de antes de fechar o painel
  if (pn.dados && !pn.printConferido) {
    pn.printConferido = true;
    retomarPrint(id);
  }
}

// etiquetagem deste post: começa a acompanhar quando ele é a vez (ou quando foi pedido aqui) e avisa no fim
function acompanharIa(det) {
  const em = det.ia?.em ?? null;
  if (det.iaRodando && !pn.iaNaFila) Object.assign(pn, { iaNaFila: true, iaAntes: em, iaDesde: Date.now() });
  if (!pn.iaNaFila || det.iaRodando) return;
  if (em !== pn.iaAntes) {
    pn.iaNaFila = false;
    toast(det.ia?.status === 'ok' ? 'Etiquetas da IA atualizadas' : `A etiquetagem com IA não terminou bem${texto(det.ia?.mensagem) ? `: ${det.ia.mensagem}` : ''}`);
    invalidar();
  } else if (Date.now() - pn.iaDesde > IA_ESPERA_MAX) {
    // a fila travou ou o servidor reiniciou: para de perguntar (abrir o post de novo mostra o que houve)
    pn.iaNaFila = false;
  }
}

function agendarPainel() {
  clearTimeout(pn.timer);
  pn.timer = null;
  if (!painelEl() || document.visibilityState === 'hidden') return;
  if (pn.dados?.iaRodando || pn.iaNaFila) pn.timer = setTimeout(() => carregarPost({ silencioso: true }), CONSULTA_MS);
}

function aoClicarPainel(e) {
  const b = e.target instanceof Element ? e.target.closest('button') : null;
  if (!b) return;
  if (b.matches('[data-fechar]')) {
    fecharPainel();
    return;
  }
  if (desligado(b)) return;
  if (b.matches('[data-dg-p-tentar]')) {
    pn.erro = '';
    desenharPainel();
    carregarPost();
  } else if (b.matches('[data-dg-p-vincular]')) salvarVinculo(b.dataset.dgPVincular);
  else if (b.matches('[data-dg-p-vinculo-salvar]')) {
    const s = painelEl()?.querySelector('[data-dg-p-vinculo]');
    if (s) salvarVinculo(s.value || null);
  } else if (b.matches('[data-dg-print-usar]')) usarSugestaoPendente();
  else if (b.matches('[data-dg-p-etiquetar]')) etiquetarPost();
  else if (b.matches('[data-dg-anuncio]')) salvarAnuncio(b.dataset.dgAnuncio);
  else if (b.matches('[data-dg-ir-numeros]')) irParaNumeros();
  else if (b.matches('[data-dg-pub-editar]')) {
    pn.editandoPublico = !pn.editandoPublico;
    // fechar o formulário descarta a sugestão do print (nada foi salvo)
    if (!pn.editandoPublico) Object.assign(pn, { sugestao: null, leitura: printRodando(pn.leitura) ? pn.leitura : null });
    limparSujo('publico');
    desenharPainel();
    if (pn.editandoPublico) painelEl()?.querySelector('[data-regiao="pubform"] select, [data-regiao="pubform"] input')?.focus();
  } else if (b.matches('[data-dg-pub-cancelar]')) {
    Object.assign(pn, { editandoPublico: false, sugestao: null, leitura: printRodando(pn.leitura) ? pn.leitura : null, focoPendente: 'pub:editar' });
    limparSujo('publico');
    desenharPainel();
  } else if (b.matches('[data-dg-pub-apagar]')) apagarPublico();
  else if (b.matches('[data-dg-print-btn]')) painelEl()?.querySelector('[data-dg-print]')?.click();
  else if (b.matches('[data-dg-analise]') && typeof aoAnalisarAtual === 'function') aoAnalisarAtual(pn.id);
}

// o valor com que o seletor foi desenhado (o que está gravado)
const valorInicial = (s) => [...(s?.options ?? [])].find((o) => o.defaultSelected)?.value ?? s?.options?.[0]?.value ?? '';

function aoMudarPainel(e) {
  const t = e.target;
  if (!(t instanceof Element)) return;
  if (t.matches('[data-dg-p-vinculo]')) {
    // só escolhe: grava no "Salvar vínculo" (o redesenho acende o botão e mantém o foco no seletor)
    pn.vinculoEscolha = t.value;
    desenharPainel();
  } else if (t.matches('[data-dg-tag]')) {
    // com o mouse, escolher é gravar. Pelo teclado (setas num select fechado disparam change a cada tecla
    // no Windows), a escolha fica pendente e grava no Enter ou ao sair do campo; Esc fecha sem gravar
    if (t.dataset.dgPonteiro === '1') {
      delete t.dataset.dgPonteiro;
      salvarTag(t.dataset.dgTag, t.value);
    } else t.dataset.dgSujo = '1'; // pendente: o redesenho da região não apaga a escolha
  } else if (t.matches('[data-dg-print]')) lerPrint(t);
}

// grava a etiqueta escolhida pelo teclado, se mudou (o data-dg-sujo sai antes: a região precisa redesenhar)
function gravarTagPendente(s) {
  if (!s?.dataset?.dgSujo) return;
  delete s.dataset.dgSujo;
  if (s.value !== valorInicial(s)) salvarTag(s.dataset.dgTag, s.value);
}

function aoTeclarTag(e) {
  const s = e.target instanceof Element ? e.target.closest('select[data-dg-tag]') : null;
  if (!s) return;
  delete s.dataset.dgPonteiro;
  if (e.key === 'Enter') {
    e.preventDefault();
    gravarTagPendente(s);
  }
}

// ao sair do campo, grava depois que o foco chegou no próximo controle (gravar dentro do focusout redesenha a
// região antes do foco chegar e ele cairia no body). Seletor que saiu do DOM (Esc fechou o painel) não grava
function aoSairTag(e) {
  const s = e.target instanceof Element ? e.target.closest('select[data-dg-tag]') : null;
  if (!s?.dataset?.dgSujo) return;
  setTimeout(() => {
    if (s.isConnected && painelEl()?.contains(s)) gravarTagPendente(s);
  }, 0);
}

function aoEnviarPainel(e) {
  const f = e.target;
  if (!(f instanceof Element)) return;
  e.preventDefault();
  if (f.matches('[data-dg-form="numeros"]')) salvarNumeros(f);
  else if (f.matches('[data-dg-form="publico"]')) salvarPublico(f);
}

function limparSujo(nome) {
  painelEl()?.querySelector(`form[data-dg-form="${nome}"]`)?.removeAttribute('data-dg-sujo');
}

// botão de envio de formulário: a região está "suja" e não redesenha, então o estado muda aqui
function botaoEnviando(f, sim, rotulo) {
  const b = f?.querySelector('button[type="submit"]');
  if (!b) return;
  b.disabled = sim;
  if (sim) b.setAttribute('aria-busy', 'true');
  else b.removeAttribute('aria-busy');
  b.textContent = sim ? 'Salvando…' : rotulo;
}

// edição que devolve o detalhePost: redesenha as regiões e marca a aba como velha
async function editar(chave, url, corpo, { ok = 'Salvo', form = null } = {}) {
  const id = pn.id;
  if (!id || pn.salvando.has(chave)) return false;
  const ativo = document.activeElement;
  if (ativo?.dataset?.foco) pn.focoPendente = ativo.dataset.foco;
  pn.salvando.add(chave);
  desenharPainel();
  let certo = false;
  try {
    const det = await api('PUT', url, corpo);
    certo = true;
    // o que foi salvo vale mesmo com outro post aberto no meio: a aba fica velha e quem chamou sabe que
    // gravou (o vínculo recarrega o cronograma); só o painel do outro post não é tocado
    invalidar();
    if (pn.id !== id) return true;
    // GET que estava no caminho fica velho
    if (det?.post) {
      pn.dados = det;
      pn.seq += 1;
    }
    form?.removeAttribute('data-dg-sujo');
    toast(ok);
  } catch (e) {
    if (pn.id !== id) return false;
    toast(e?.message || 'Não salvou');
  }
  pn.salvando.delete(chave);
  desenharPainel();
  if (certo && !pn.dados?.post) carregarPost();
  else agendarPainel();
  return certo;
}

async function salvarVinculo(reelId) {
  if (reelId != null && !reelOk(reelId)) return;
  const id = pn.id;
  const certo = await editar('vinculo', `/api/metricas/post/${encodeURIComponent(id)}/vinculo`, { reelId: reelId ?? null },
    { ok: reelId ? 'Post vinculado à peça' : 'Vínculo desfeito' });
  if (!certo) return;
  // o permalink mudou no db.json: o cronograma do front relê (o painel continua aberto)
  recarregarCronograma();
  if (pn.id === id) {
    pn.vinculoEscolha = null;
    desenharPainel();
  }
}

function salvarTag(dim, valorTxt) {
  if (!ID_DIMENSAO.test(String(dim ?? ''))) return;
  const tag = lista(pn.dados?.tags).find((t) => String(t?.dimensao) === dim);
  if (!tag) return;
  let valor = null;
  if (valorTxt !== '') {
    const op = opcoesTag(tag).find((o) => String(o.id) === valorTxt);
    if (!op) return;
    valor = op.id;
  }
  editar(`tag:${dim}`, `/api/metricas/post/${encodeURIComponent(pn.id)}/tag`, { dimensao: dim, valor },
    { ok: valor == null ? 'Etiqueta de volta ao automático' : 'Etiqueta corrigida' });
}

function salvarAnuncio(escolha) {
  const valor = escolha === 'sim' ? true : escolha === 'nao' ? false : null;
  editar('anuncio', `/api/metricas/post/${encodeURIComponent(pn.id)}/impulsionado`, { valor }, { ok: 'Anúncio atualizado' });
}

// "1.234" ou "1234"; vazio é sem dado; o resto é NaN
const lerInteiro = (s) => {
  const t = String(s ?? '').trim().replace(/[.\s]/g, '');
  if (!t) return null;
  return /^\d{1,9}$/.test(t) ? Number(t) : NaN;
};
// "45,5", "45.5" ou "45,5%" de 0 a 100; vazio é sem dado
const lerPct = (s) => {
  const t = String(s ?? '').trim().replace(/%$/, '').replace(',', '.').trim();
  if (!t) return null;
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(t)) return NaN;
  const n = Number(t);
  return n <= 100 ? n : NaN;
};

async function salvarNumeros(f) {
  const corpo = {};
  for (const [k, rot] of CAMPOS_NUM) {
    const inp = f.querySelector(`input[name="${k}"]`);
    if (!inp) continue;
    const v = lerInteiro(inp.value);
    if (Number.isNaN(v)) {
      toast(`${rot}: só número inteiro, sem sinal de menos`);
      inp.focus();
      return;
    }
    corpo[k] = v;
  }
  botaoEnviando(f, true, 'Salvar números');
  const certo = await editar('numeros', `/api/metricas/post/${encodeURIComponent(pn.id)}/numeros`, corpo, { ok: 'Números do app salvos', form: f });
  if (!certo && f.isConnected) botaoEnviando(f, false, 'Salvar números');
}

// o formulário do público do app em dados (puro, testado no Node). valores = { base, contas, pcts: [{ campo,
// chave, valor }], lugares: [{ tipo, nome, pct }] }, tudo como texto do campo. Devolve { dados } ou
// { erro, onde }: onde = 'base' | 'contas' | ['pct', i] | ['nome', i] | ['lugarPct', i] (o campo do foco)
export function validarPublico({ base = '', contas = '', pcts = [], lugares = [] } = {}) {
  if (!BASES_APP.some(([id]) => id === base)) {
    return { erro: 'Diga de onde são os percentuais: visualizações, contas alcançadas ou contas com engajamento.', onde: 'base' };
  }
  const dados = { base, genero: {}, idade: {}, cidades: [], paises: [] };
  // contas na base: o número da tela do app (a base do filtro de 5 pessoas); vazio fica sem dado
  const nContas = lerInteiro(contas);
  if (Number.isNaN(nContas) || nContas === 0) return { erro: 'Contas na base: só número inteiro maior que zero (ou deixe vazio)', onde: 'contas' };
  if (nContas != null) dados.contas = nContas;
  for (const [i, x] of lista(pcts).entries()) {
    const v = lerPct(x?.valor);
    if (Number.isNaN(v)) return { erro: 'Percentual de 0 a 100, com até duas casas', onde: ['pct', i] };
    if (v == null) continue;
    const { campo, chave } = x ?? {};
    if (campo === 'genero' && (chave === 'mulheres' || chave === 'homens')) dados.genero[chave] = v;
    else if (campo === 'idade' && FAIXAS.includes(chave)) dados.idade[chave] = v;
    else if (campo === 'seguidores' || campo === 'naoSeguidores') dados[campo] = v;
  }
  for (const [i, l] of lista(lugares).entries()) {
    const nome = String(l?.nome ?? '').trim().slice(0, 80);
    const v = lerPct(l?.pct);
    if (Number.isNaN(v)) return { erro: 'Percentual de 0 a 100, com até duas casas', onde: ['lugarPct', i] };
    if (!nome && v == null) continue;
    if (!nome || v == null) return { erro: 'Cada cidade ou país precisa do nome e do percentual', onde: [nome ? 'lugarPct' : 'nome', i] };
    if (l.tipo === 'cidades' || l.tipo === 'paises') dados[l.tipo].push({ nome, pct: v });
  }
  const soma = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  if (soma(dados.genero) > 102 || soma(dados.idade) > 102) return { erro: 'A soma passou de 100%: confira os números' };
  const vazioTudo = !Object.keys(dados.genero).length && !Object.keys(dados.idade).length && !dados.cidades.length
    && !dados.paises.length && dados.seguidores == null && dados.naoSeguidores == null;
  if (vazioTudo) return { erro: 'Preencha pelo menos um número' };
  return { dados };
}

function dadosDoFormPublico(f) {
  const pcts = [...f.querySelectorAll('input[data-campo]')];
  const linhas = [...f.querySelectorAll('[data-lugar]')];
  const r = validarPublico({
    base: f.querySelector('select[name="base"]')?.value ?? '',
    contas: f.querySelector('input[name="contas"]')?.value ?? '',
    pcts: pcts.map((inp) => ({ campo: inp.dataset.campo, chave: inp.dataset.chave, valor: inp.value })),
    lugares: linhas.map((l) => ({ tipo: l.dataset.lugar, nome: l.querySelector('[data-parte="nome"]')?.value ?? '', pct: l.querySelector('[data-parte="pct"]')?.value ?? '' })),
  });
  if (!r.erro) return r;
  const [tipo, i] = Array.isArray(r.onde) ? r.onde : [r.onde, -1];
  const campo = tipo === 'base' ? f.querySelector('select[name="base"]')
    : tipo === 'contas' ? f.querySelector('input[name="contas"]')
      : tipo === 'pct' ? pcts[i]
        : tipo === 'nome' ? linhas[i]?.querySelector('[data-parte="nome"]')
          : tipo === 'lugarPct' ? linhas[i]?.querySelector('[data-parte="pct"]') : null;
  return { erro: r.erro, campo };
}

async function salvarPublico(f) {
  const r = dadosDoFormPublico(f);
  if (r.erro) {
    toast(r.erro);
    r.campo?.focus();
    return;
  }
  const id = pn.id;
  if (pn.salvando.has('publico')) return;
  pn.salvando.add('publico');
  botaoEnviando(f, true, 'Salvar público do app');
  let certo = false;
  try {
    await api('PUT', `/api/metricas/publico/post/${encodeURIComponent(id)}`, r.dados);
    certo = true;
  } catch (e) {
    if (pn.id === id) toast(e?.message || 'Não salvou');
  }
  pn.salvando.delete('publico');
  if (certo) {
    invalidar();
    // a aba Público guarda o resumo dela (e pré-preenche o formulário dela com ele): fica velha também
    invalidarPublico();
  }
  if (pn.id !== id) return;
  if (!certo) {
    if (f.isConnected) botaoEnviando(f, false, 'Salvar público do app');
    return;
  }
  Object.assign(pn, { editandoPublico: false, sugestao: null, sugestaoPendente: null, printRetomado: false, leitura: null, focoPendente: 'pub:editar' });
  f.removeAttribute('data-dg-sujo');
  toast('Público do post salvo');
  // a rota do público devolve a aba Público, não o post: relê o post pras frases novas
  await carregarPost();
}

async function apagarPublico() {
  if (!confirm('Apagar os números do app deste post?')) return;
  const id = pn.id;
  if (pn.salvando.has('publico')) return;
  pn.salvando.add('publico');
  pn.focoPendente = 'pub:editar';
  desenharPainel();
  let certo = false;
  try {
    await api('DELETE', `/api/metricas/publico/post/${encodeURIComponent(id)}`);
    certo = true;
    if (pn.id === id) toast('Números do app apagados');
  } catch (e) {
    if (pn.id === id) toast(e?.message || 'Não apagou');
  }
  if (certo) {
    invalidar();
    invalidarPublico();
  }
  pn.salvando.delete('publico');
  if (pn.id === id) await carregarPost();
}

async function etiquetarPost() {
  const id = pn.id;
  if (pn.iaIniciando || pn.iaNaFila || pn.dados?.iaRodando) return;
  const antes = pn.dados?.ia?.em ?? null;
  pn.iaIniciando = true;
  desenharPainel();
  let foi = false;
  try {
    await api('POST', `/api/metricas/post/${encodeURIComponent(id)}/etiquetar`);
    foi = true;
  } catch (e) {
    if (pn.id === id) toast(e?.message || 'Não começou');
  }
  if (pn.id !== id) return;
  pn.iaIniciando = false;
  if (foi) {
    Object.assign(pn, { iaNaFila: true, iaAntes: antes, iaDesde: Date.now() });
    toast('Pedido de etiquetagem na fila da IA');
  }
  desenharPainel();
  agendarPainel();
}

// ── leitura de print ──
const lerComoDataUrl = (arquivo) => new Promise((ok, falha) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result ?? ''));
  r.onerror = () => falha(r.error);
  r.readAsDataURL(arquivo);
});

// o corpo do POST do print medido como chega no servidor (JSON com as data URLs; tudo ASCII)
export const tamanhoCorpoPrint = (imagens) => JSON.stringify({ imagens: lista(imagens) }).length;

// o foco só vai sozinho pro formulário quando a pessoa não está noutro lugar do painel: no body, no próprio
// painel ou nas regiões do público (o botão Ler do print fica lá). A leitura leva até minutos: ela pode
// estar digitando os números do app, e as teclas seguintes iriam pro formulário errado
function focoLivre() {
  const a = document.activeElement;
  const p = painelEl();
  if (!a || a === document.body || a === p) return true;
  return Boolean(p?.contains(a) && a.closest?.('[data-regiao="publico"], [data-regiao="print"], [data-regiao="pubform"]'));
}

function focarFormPublico() {
  painelEl()?.querySelector('[data-regiao="pubform"] select, [data-regiao="pubform"] input')?.focus({ preventScroll: true });
}

// leitura nova do print. Com sugestão, ela vai pro formulário; mas se a pessoa já começou a digitar nele, ou
// se é a leitura retomada ao reabrir o painel, fica pendente ("Usar os números lidos"): nada é trocado sem ela
function aplicarLeitura(l, { retomada = false } = {}) {
  pn.leitura = l ?? null;
  const s = sugestaoDoPrint(l);
  if (!s) {
    desenharPainel();
    return;
  }
  const sujo = Boolean(painelEl()?.querySelector('form[data-dg-form="publico"][data-dg-sujo]'));
  if (retomada || sujo) {
    Object.assign(pn, { sugestaoPendente: s, printRetomado: retomada });
    desenharPainel();
    return;
  }
  const livre = focoLivre();
  Object.assign(pn, { sugestao: s, sugestaoPendente: null, printRetomado: false, editandoPublico: true });
  limparSujo('publico');
  desenharPainel();
  if (livre) focarFormPublico();
}

// "Usar os números lidos": a pessoa escolheu trocar o que estava no formulário pela leitura
function usarSugestaoPendente() {
  const s = pn.sugestaoPendente;
  if (!s) return;
  Object.assign(pn, { sugestao: s, sugestaoPendente: null, printRetomado: false, editandoPublico: true });
  limparSujo('publico');
  desenharPainel();
  focarFormPublico();
}

// ao abrir o painel: o servidor guarda a leitura do print por 30 min. Rodando, volta a acompanhar; pronta,
// oferece "Usar os números lidos" sem trocar nada; com erro, mostra o erro. Leitura que terminou antes dos
// números do app salvos (alguém já salvou depois dela) não volta
async function retomarPrint(id) {
  let l = null;
  try {
    l = (await api('GET', `/api/metricas/publico/post/${encodeURIComponent(id)}/print`))?.leitura ?? null;
  } catch {
    return;
  }
  // outro post aberto, ou a pessoa já mandou outro print nesse meio tempo
  if (pn.id !== id || !l || typeof l !== 'object' || pn.leitura) return;
  const salvoEm = msDe(dadosDoApp(pn.dados?.publico?.app)?.em);
  if (l.fim && salvoEm && salvoEm >= msDe(l.fim)) return;
  if (printRodando(l)) {
    pn.leitura = l;
    desenharPainel();
    agendarPrint();
  } else if (sugestaoDoPrint(l)) aplicarLeitura(l, { retomada: true });
  else if (texto(l.erro)) {
    pn.leitura = l;
    desenharPainel();
  }
}

async function lerPrint(inp) {
  const arquivos = [...(inp.files ?? [])];
  inp.value = '';
  if (!arquivos.length) return;
  if (arquivos.length > 3) {
    toast('Mande até 3 imagens');
    return;
  }
  for (const a of arquivos) {
    if (!/^image\/(png|jpeg|webp)$/.test(a.type)) {
      toast('Só imagem PNG, JPG ou WEBP');
      return;
    }
    if (a.size > PRINT_MAX_IMAGEM) {
      toast(`${a.name} passa de 4 MB`);
      return;
    }
  }
  const id = pn.id;
  clearTimeout(pn.timerPrint);
  // print novo: a leitura pendente de antes sai
  Object.assign(pn, { sugestaoPendente: null, printRetomado: false, falhasPrint: 0 });
  aplicarLeitura({ etapa: 'enviando' });
  let imagens;
  try {
    imagens = await Promise.all(arquivos.map(lerComoDataUrl));
  } catch {
    if (pn.id === id) aplicarLeitura({ erro: 'o navegador não conseguiu abrir a imagem.' });
    return;
  }
  if (pn.id !== id) return;
  // a imagem em texto cresce um terço: a conta é no corpo que vai pro servidor, com o JSON junto (12 MB de
  // envio são uns 9 MB somando os arquivos, e é esse o número que a pessoa vê no computador)
  if (tamanhoCorpoPrint(imagens) > PRINT_MAX_CORPO) {
    aplicarLeitura({ erro: 'as imagens juntas passam de 12 MB no envio (uns 9 MB somando os arquivos): mande menos prints ou prints menores.' });
    return;
  }
  let leitura;
  try {
    leitura = (await api('POST', `/api/metricas/publico/post/${encodeURIComponent(id)}/print`, { imagens }))?.leitura ?? { etapa: 'lendo' };
  } catch (e) {
    leitura = { erro: e?.message || 'erro desconhecido' };
  }
  if (pn.id !== id) return;
  aplicarLeitura(leitura);
  agendarPrint();
}

function agendarPrint(espera = CONSULTA_MS) {
  clearTimeout(pn.timerPrint);
  pn.timerPrint = null;
  if (!painelEl() || document.visibilityState === 'hidden' || !printRodando(pn.leitura)) return;
  pn.timerPrint = setTimeout(consultarPrint, espera);
}

async function consultarPrint() {
  pn.timerPrint = null;
  const id = pn.id;
  if (!painelEl()) return;
  let leitura;
  try {
    leitura = (await api('GET', `/api/metricas/publico/post/${encodeURIComponent(id)}/print`))?.leitura ?? null;
  } catch (e) {
    if (pn.id !== id) return;
    // rede ou servidor (sem status, ou 5xx): a leitura segue lá. Tenta de novo, esperando mais a cada vez
    const passageiro = !e?.status || e.status >= 500;
    if (passageiro && pn.falhasPrint < PRINT_TENTATIVAS) {
      pn.falhasPrint += 1;
      desenharPainel();
      agendarPrint(CONSULTA_MS * 2 ** pn.falhasPrint);
      return;
    }
    leitura = {
      erro: passageiro
        ? `perdi o contato com o servidor (${e?.message || 'sem resposta'}). A leitura pode ter seguido lá: feche e abra o painel pra ver.`
        : e?.message || 'erro desconhecido',
    };
  }
  if (pn.id !== id) return;
  pn.falhasPrint = 0;
  // a leitura sumiu do servidor no meio (ele reiniciou): diz, em vez de sumir calada
  if (!leitura && printRodando(pn.leitura)) leitura = { erro: 'o servidor não tem mais essa leitura (ele pode ter reiniciado). Mande o print de novo.' };
  const achou = Boolean(sugestaoDoPrint(leitura));
  aplicarLeitura(leitura);
  if (achou) toast(pn.sugestaoPendente ? 'Li o print: use os números lidos quando quiser' : 'Li o print: confira os números e clique em Salvar');
  agendarPrint();
}
