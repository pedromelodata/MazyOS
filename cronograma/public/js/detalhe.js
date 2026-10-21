// Detalhe da peça (painel lateral). Porta da v1 + "Adaptado de X.Y", ideia de origem, o botão
// que manda um reel publicado que performou pra Biblioteca como case e (23/09) o reel inteiro
// estruturado: formato, tipo, roteiro em blocos (Gancho, desenvolvimento, CTA), detalhes de gravação
// e fontes (24/09: no botão "i" do topo).
// 24/09: a peça pode ser reel, carrossel, estático ou stories (ou duas delas). No topo, o bloco
// Planejamento (pilar, bloco, tema, formato, data, status, rede, gatilho, impulsionar, link, campanha):
// na leitura só mostra, no modo edição tudo vira campo e salva de uma vez. Depois vem o conteúdo de cada
// tipo: roteiro do reel, slides do carrossel, arte do estático, quadros dos stories.
// 25/09: logo depois do Planejamento, o bloco Ideia: a ideia do banco que a peça produz (gancho,
// narração em parágrafos, CTA), com busca pra vincular outra e "Criar ideia desta peça". Vincular é
// PUT /api/reels/:id { ideiaId }: o servidor acerta os dois lados (ligarIdeia, repontarIdeia).
// 28/09: "Outra ideia" no bloco Ideia: 3 opções da IA pro mesmo lugar (outras-ideias.mjs); "Usar esta" troca a
// ideia e o texto da peça no servidor. Sem login do Claude, a busca do banco abre só com as ideias livres.
import {
  esc, fmtN, fmtRel, fmtData, STATUS, TIPOS, store, api, recarregar, toast, abrirPainel, fecharPainel,
  BTN_FECHAR, navegar, formato, campanha, ideia, reel, seloFormato, qa, icone, tipoReel, pillTipo, nomeTema,
  tipoFormato, rotuloFormato, blocosRoteiro, roteiroTresHtml, roteiroTresTexto, botaoFontes, botaoNotas,
  PECAS, pecaInfo, tiposDaPeca, rotuloPeca, BLOCOS, blocoDaPeca,
  batidas, ganchoDaPeca, ctaDaPeca, pecasDaIdeia, rotuloNoCronograma,
  precisaAprovacao, travaPostado, infoAprovacao, hojeBrasilia,
  BLOCOS_ESTRATEGIA, blocoInfo, pillBloco, tipoDoPilar,
} from './core.js';
import { abrirChat } from './chat.js';
import { abrirNovaIdeiaDaPeca } from './views/ideias.js';
// 21/10: Aprovações técnicas (o Diretor contábil aprova antes de postar)
import { explicacaoHtml, conversaHtml, trilhaHtml, invalidar as invalidarAprovacoes } from './views/aprovacoes.js';
// 21/10 (Pedro): aprovação em 2 etapas (os gerentes e depois o Diretor contábil); a trilha mostra quem já aprovou
import { minhaVez, etapaAprovacao, gerentesFaltando, gerentesDe, lembrarGerentes, juntarNomes } from './core.js';
// 21/10 (Pedro): o painel ficou mais simples. Saíram pilar, tipo, rede (é sempre Instagram), candidato a
// impulsionar, "Calendário oficial", "Abrir no banco", "Trocar" e as métricas da peça (que ficam só na aba
// Métricas). A peça tem um tipo só (reel, carrossel, estático ou stories). O roteiro e a ideia vêm em três
// blocos (Hook, Desenvolvimento, CTA) e o rodapé ganhou "Marcar como postado"
const REDE = 'Instagram';
// 02/10: "Vídeo final" logo depois do Planejamento: um player por vídeo pronto da peça (reel.videos), e a pílula
// "Vídeo final" no cabeçalho que leva até ele
import { secaoVideoFinal, pilulaVideoFinal, ligarPlayers } from './videos-finais.js';
// 21/10 (Pedro): o bloco "Mecanismo" depois da Ideia (mecanismo.js): os alertas de repetição e continuidade da semana,
// a exceção ("repetição de propósito"), "Regerar ideia" com o "O que mudar" e "Voltar à versão anterior"
import { blocoMecanismoHtml, ligarBlocoMecanismo } from './mecanismo.js';
import * as storiesDoDia from './stories.js';

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
// peça sem reel: os mesmos campos são detalhes de produção
const ROTULO_PRODUCAO = { duracao: 'Tamanho', edicao: 'Arte e edição', checklist: 'Checklist antes de produzir' };
const DICA_PRODUCAO = { duracao: 'ex.: Carrossel 4:5, 6 slides (1080x1350)' };
const INTERACOES = ['Enquete', 'Caixinha de perguntas', 'Quiz', 'Link', 'Contagem regressiva', 'Reação com emoji'];
const PALAVRAS_POR_SEGUNDO = 2.1;

const palavras = (s) => (String(s ?? '').trim().match(/\S+/g) ?? []).length;
const linhas = (v) => String(v ?? '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
const tem = (v) => Boolean(String(v ?? '').trim());
const SEM_DADO = '<span class="dt-sem">sem dado</span>';
const vazio = (txt) => `<p class="dt-vazio">${esc(txt)}</p>`;

// checklist é só visual: a marcação vive enquanto a aba está aberta, não vai pro banco
const marcados = new Set();

let painel = null;

// o mesmo post aparece como /reel/X, /reels/X, /p/X ou /usuario/reel/X (igual ao mesmoPost do servidor)
const codigoPost = (url) => {
  const m = String(url ?? '').match(/instagram\.com\/(?:[^/?#]+\/)?(?:reels?|p|tv)\/([^/?#]+)/i);
  return m ? m[1] : String(url ?? '').split(/[?#]/)[0].replace(/\/+$/, '');
};
const mesmoPost = (a, b) => Boolean(a && b) && codigoPost(a) === codigoPost(b);

// ── Conteúdo de cada tipo de peça ──────────────────────────────────────────
// carrossel em slides numerados: a capa é o 1, o slide final (CTA) é o último
function slidesDe(c = {}) {
  const cheio = (s) => ['titulo', 'texto', 'visual'].some((k) => tem(s?.[k]));
  return [
    ...(cheio(c.capa) ? [{ ...c.capa, parte: 'gancho', nome: 'Capa' }] : []),
    ...(c.slides ?? []).filter(cheio).map((s) => ({ ...s, parte: 'dev', nome: '' })),
    ...(cheio(c.final) ? [{ ...c.final, parte: 'cta', nome: 'CTA' }] : []),
  ].map((s, i) => ({ ...s, n: i + 1 }));
}
const rotuloSlide = (s) => (s.nome ? `${s.n} · ${s.nome}` : `Slide ${s.n}`);

function carrosselHtml(c) {
  const sl = slidesDe(c);
  if (!sl.length) return vazio('sem slides ainda');
  return `<ol class="rt-blocos">${sl.map((s) => `
    <li class="rt-bloco" data-parte="${s.parte}">
      <div class="rt-cab"><span class="rt-rotulo">${esc(rotuloSlide(s))}</span></div>
      ${tem(s.titulo) ? `<p class="rt-fala">${esc(s.titulo)}</p>` : ''}
      ${tem(s.texto) ? `<p class="${tem(s.titulo) ? 'pc-texto' : 'rt-fala'}">${esc(s.texto)}</p>` : ''}
      ${tem(s.visual) ? `<p class="rt-meta"><span>Visual:</span> ${esc(s.visual)}</p>` : ''}
    </li>`).join('')}</ol>`;
}

const PARTES_ESTATICO = [['headline', 'Headline', 'gancho'], ['apoio', 'Texto de apoio', 'dev'], ['cta', 'CTA', 'cta'], ['visual', 'Visual', 'dev']];
function estaticoHtml(e = {}) {
  const partes = PARTES_ESTATICO.filter(([k]) => tem(e[k]));
  if (!partes.length) return vazio('sem arte ainda');
  return `<ol class="rt-blocos">${partes.map(([k, nome, parte]) => `
    <li class="rt-bloco" data-parte="${parte}">
      <div class="rt-cab"><span class="rt-rotulo">${esc(nome)}</span></div>
      <p class="${k === 'headline' ? 'rt-fala' : k === 'visual' ? 'rt-meta' : 'pc-texto'}">${esc(e[k])}</p>
    </li>`).join('')}</ol>`;
}

function storiesHtml(s = {}) {
  const qs = (s.quadros ?? []).filter((q) => tem(q.texto) || tem(q.visual) || tem(q.interacao));
  if (!qs.length) return vazio('sem quadros ainda');
  return `<ol class="rt-blocos">${qs.map((q, i) => `
    <li class="rt-bloco" data-parte="dev">
      <div class="rt-cab"><span class="rt-rotulo">Quadro ${i + 1}</span>${tem(q.interacao) ? `<span class="pill pc-interacao">${esc(q.interacao)}</span>` : ''}</div>
      ${tem(q.texto) ? `<p class="rt-fala">${esc(q.texto)}</p>` : ''}
      ${tem(q.visual) ? `<p class="rt-meta"><span>Visual:</span> ${esc(q.visual)}</p>` : ''}
    </li>`).join('')}</ol>`;
}

// ── Ideia da peça ──────────────────────────────────────────────────────────
const semAcento = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const MAX_OPCOES = 40;

// o que a peça já tem vira o ponto de partida de uma ideia nova (formulário do banco)
function ideiaDaPeca(r) {
  const tipos = tiposDaPeca(r);
  const falas = (lista) => lista.filter(tem).join('\n\n');
  const c = r.carrossel ?? {};
  const narr = {
    reel: falas(blocosRoteiro(r.roteiro ?? {}).filter((b) => b.parte === 'dev').map((b) => b.fala)),
    carrossel: falas((c.slides ?? []).map((s) => [s.titulo, s.texto].filter(tem).join(': '))),
    estatico: r.estatico?.apoio ?? '',
    stories: falas((r.stories?.quadros ?? []).slice(1).map((x) => x.texto)),
  };
  const ordem = tipos.includes('reel') ? ['reel', ...tipos.filter((t) => t !== 'reel')] : tipos;
  const hook = ganchoDaPeca(r);
  return {
    titulo: r.ideia ?? '',
    tipo: r.tipo ?? '',
    formatoId: tipos.includes('reel') ? r.formatoId ?? '' : '',
    descricao: r.tema ?? '',
    gancho: hook,
    roteiroBase: {
      hook,
      textoTela: tipos.includes('reel') ? r.roteiro?.textoTela ?? '' : '',
      narracao: ordem.map((t) => narr[t]).find(tem) ?? '',
      cta: ctaDaPeca(r),
    },
    fontes: r.fontes ?? [],
  };
}

// busca no banco: todas as palavras no título, gancho, tema ou tipo. Primeiro as do mesmo tipo da
// peça, depois as livres (sem peça no cronograma); a ideia atual fica de fora.
// soLivres (a saída do "Outra ideia" sem login): só as que nenhuma peça usa
function opcoesIdeia(r, busca, { soLivres = false } = {}) {
  const termos = semAcento(busca).split(/\s+/).filter(Boolean);
  const texto = (i) => semAcento([i.titulo, i.gancho, i.roteiroBase?.hook, i.temaNome ?? nomeTema(i.tema), tipoReel(i.tipo)?.nome].join(' '));
  const livre = (i) => (pecasDaIdeia(i.id).length ? 0 : 1);
  const doTipo = (i) => (r.tipo && i.tipo === r.tipo ? 1 : 0);
  return (store.E?.ideias ?? [])
    .filter((i) => i.id !== r.ideiaId && (!soLivres || livre(i)) && termos.every((t) => texto(i).includes(t)))
    .sort((a, b) => doTipo(b) - doTipo(a) || livre(b) - livre(a) || String(a.titulo).localeCompare(String(b.titulo), 'pt-BR'))
    .slice(0, MAX_OPCOES);
}
function opcaoIdeiaHtml(i) {
  const usos = pecasDaIdeia(i.id);
  const meta = [tipoReel(i.tipo)?.nome, i.tema ? nomeTema(i.tema, { curto: true }) : '', usos.length ? rotuloNoCronograma(usos[0]) : 'Livre'].filter(Boolean).join(' · ');
  return `<li role="option" id="dt-op-${esc(i.id)}" data-ideia-opcao="${esc(i.id)}" aria-selected="false"><strong>${esc(i.titulo)}</strong><small>${esc(meta)}</small></li>`;
}
const seletorIdeia = () => `
  <div class="dt-ideia-busca">
    <div class="dt-ideia-campo">${icone('busca', 16)}<input class="campo" id="dt-ideia-q" type="search" role="combobox" aria-expanded="false" aria-controls="dt-ideia-opcoes" aria-autocomplete="list" autocomplete="off" placeholder="Buscar no Banco de Ideias" aria-label="Buscar ideia no Banco de Ideias" /></div>
    <ul class="dt-ideia-opcoes" id="dt-ideia-opcoes" role="listbox" aria-label="Ideias do banco" hidden></ul>
  </div>`;

// ── Outra ideia (28/09): a IA escreve 3 ideias pro mesmo lugar da peça; "Usar esta" troca tudo no servidor.
// A geração roda no servidor (POST começa, GET acompanha): o estado fica aqui pra sobreviver ao redesenho
// do painel, e seq invalida o acompanhamento de um desenho antigo
const outras = { reelId: null, aberto: false, fase: '', opcoes: [], erro: '', semLogin: false, desde: 0, seq: 0, usando: false };
const urlOutras = (id) => `/api/reels/${encodeURIComponent(id)}/outras-ideias`;
function tempoOutras() {
  const s = Math.max(0, Math.floor((Date.now() - outras.desde) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function opcaoOutraHtml(op, i) {
  const rb = op.roteiroBase ?? {};
  const pars = batidas(rb.narracao);
  const resto = pars.slice(2);
  const mais = resto.length > 0 || tem(rb.cta);
  const id = `dt-op-mais-${i}`;
  return `
    <article class="dt-op" aria-label="Opção ${i + 1}">
      <div class="dt-op-topo"><p class="dt-op-gancho">${esc(op.gancho || rb.hook)}</p>${botaoFontes(op.fontes)}</div>
      ${pars.length ? `<div class="dt-op-narracao">${pars.slice(0, 2).map((x) => `<p>${esc(x)}</p>`).join('')}${mais ? `<div class="dt-op-mais" id="${id}" hidden>${resto.map((x) => `<p>${esc(x)}</p>`).join('')}${tem(rb.cta) ? `<p class="dt-op-cta">${esc(rb.cta)}</p>` : ''}</div>` : ''}</div>` : ''}
      <div class="dt-op-acoes">${mais ? `<button type="button" class="btn btn-sm btn-fantasma" data-op-ler aria-expanded="false" aria-controls="${id}">Ler tudo</button>` : ''}<button type="button" class="btn btn-sm btn-primario" data-op-usar="${esc(op.id)}">Usar esta</button></div>
    </article>`;
}
function outrasHtml() {
  const fechar = '<button type="button" class="btn btn-sm btn-fantasma" data-outras-fechar>Fechar</button>';
  const gerar = (rot) => `<button type="button" class="btn btn-sm" data-outras-gerar>${icone('gerar', 14)} ${rot}</button>`;
  if (outras.fase === 'abrindo' || outras.fase === 'gerando') {
    const esq = '<div class="dt-op dt-op-esq"><span class="fx-esq dt-esq-l1"></span><span class="fx-esq dt-esq-l2"></span><span class="fx-esq dt-esq-l3"></span></div>';
    return `
      ${outras.fase === 'gerando' ? `<div class="dt-outras-status" role="status"><span class="dt-spinner" aria-hidden="true"></span><span>Gerando 3 ideias</span><span class="dt-outras-tempo">${tempoOutras()}</span></div>` : ''}
      <div class="dt-outras-lista" aria-hidden="true">${esq.repeat(3)}</div>
      <div class="dt-outras-rodape">${fechar}</div>`;
  }
  if (outras.fase === 'erro') {
    return `
      <p class="dt-outras-erro" role="alert">${icone('alerta', 16)}<span>${esc(outras.erro)}</span></p>
      <div class="dt-outras-rodape">${outras.semLogin ? `<button type="button" class="btn btn-sm btn-primario" data-outras-banco>${icone('busca', 14)} Escolher do banco</button>` : ''}${gerar('Tentar de novo')}${fechar}</div>`;
  }
  return `
    <div class="dt-outras-lista">${outras.opcoes.map(opcaoOutraHtml).join('')}</div>
    <div class="dt-outras-rodape">${gerar('Gerar outras')}${fechar}</div>`;
}

// o mesmo conteúdo em texto puro (copiar pro WhatsApp); lista com "•", nunca com hífen solto
const itensTexto = (arr, marca = '•') => (arr ?? []).filter(Boolean).map((x) => `${marca} ${x}`).join('\n');
function carrosselTexto(c) {
  return slidesDe(c).map((s) => [
    rotuloSlide(s).toUpperCase(),
    tem(s.titulo) ? `Título: ${s.titulo.trim()}` : '',
    tem(s.texto) ? `"${s.texto.trim()}"` : '',
    tem(s.visual) ? `Visual: ${s.visual.trim()}` : '',
  ].filter(Boolean).join('\n')).join('\n\n');
}
const estaticoTexto = (e = {}) => PARTES_ESTATICO.filter(([k]) => tem(e[k])).map(([k, nome]) => `${nome}: ${e[k].trim()}`).join('\n');
function storiesTexto(s = {}) {
  return (s.quadros ?? []).filter((q) => tem(q.texto) || tem(q.visual) || tem(q.interacao)).map((q, i) => [
    `QUADRO ${i + 1}`,
    tem(q.texto) ? `"${q.texto.trim()}"` : '',
    tem(q.visual) ? `Visual: ${q.visual.trim()}` : '',
    tem(q.interacao) ? `Interação: ${q.interacao.trim()}` : '',
  ].filter(Boolean).join('\n')).join('\n\n');
}

const nomePilar = (id) => {
  const pl = (store.E?.pilares ?? []).find((x) => x.id === Number(id));
  return pl ? `${pl.id} · ${pl.nome}` : '';
};

// a peça inteira em texto puro, pro time colar no WhatsApp ou imprimir
function textoPeca(r, f) {
  const g = r.gravacao ?? {};
  const tipos = tiposDaPeca(r);
  const temReel = tipos.includes('reel');
  const bloco = (titulo, corpo) => (tem(corpo) ? [titulo, String(corpo).trim(), ''] : []);
  const rot = (k, nome) => (temReel ? nome : ROTULO_PRODUCAO[k] ?? nome);
  const ide = r.ideiaId ? ideia(r.ideiaId) : null;
  const conteudo = {
    reel: () => bloco('ROTEIRO', roteiroTresTexto(blocosRoteiro(r.roteiro ?? {}))),
    carrossel: () => bloco('CARROSSEL', carrosselTexto(r.carrossel)),
    estatico: () => bloco('ESTÁTICO', estaticoTexto(r.estatico)),
    stories: () => bloco('STORIES', storiesTexto(r.stories)),
  };
  return [
    `${rotuloPeca(r).toUpperCase()}: ${r.ideia}`,
    [r.data ? fmtData(r.data, { ano: true, diaSemana: true }) : 'sem data', blocoInfo(blocoDaPeca(r))?.longo ?? 'sem bloco', f ? `${tipoFormato(f)}: ${f.nome} (${f.codigo})` : 'Formato livre'].join(' · '),
    '',
    ...bloco('PLANEJAMENTO', [
      `Tema: ${r.tema || 'sem dado'}`,
      r.motivo ? `Motivo: ${r.motivo}` : '',
      `Bloco: ${blocoInfo(blocoDaPeca(r))?.longo ?? 'sem dado'}`,
      r.pilar ? `Pilar: ${nomePilar(r.pilar)}` : '',
      r.pilarTexto ? `Pilar no calendário: ${r.pilarTexto}` : '',
      `Formato: ${rotuloPeca(r)}${r.formatoTexto ? ` (no calendário: ${r.formatoTexto})` : ''}`,
      `Status: ${r.status === 'publicado' ? 'Postado' : rotulo(r.status)}`,
      `Rede: ${REDE}`,
      r.gatilho ? `Gatilho / observação: ${r.gatilho}` : '',
      r.permalink ? `Link do post: ${r.permalink}` : '',
      ide ? `Ideia: ${ide.titulo}` : '',
    ].filter(Boolean).join('\n')),
    ...tipos.flatMap((k) => conteudo[k]()),
    ...bloco(temReel ? 'GRAVAÇÃO' : 'PRODUÇÃO', [
      ...GRAV_TEXTO.filter(([k]) => tem(g[k])).map(([k, nome]) => `${rot(k, nome)}: ${g[k]}`),
      ...GRAV_LISTA.filter(([k]) => g[k]?.length).map(([k, nome]) => `${nome}:\n${itensTexto(g[k])}`),
      tem(g.edicao) ? `${rot('edicao', 'Edição')}: ${g.edicao}` : '',
    ].filter(Boolean).join('\n')),
    ...bloco(temReel ? 'CHECKLIST ANTES DE GRAVAR' : 'CHECKLIST ANTES DE PRODUZIR', itensTexto(g.checklist, '[ ]')),
    ...bloco('LEGENDA', r.legenda),
    ...bloco('FONTES', itensTexto(r.fontes)),
  ].join('\n').trim();
}

// reabre a mesma peça sem perder a rolagem (toda edição recarrega o estado)
function reabrir(id, editando = false) {
  const topo = painel?.querySelector('.painel-corpo')?.scrollTop ?? 0;
  abrirDetalhe(id, editando);
  const corpo = painel?.querySelector('.painel-corpo');
  if (corpo) corpo.scrollTop = topo;
}

// ── Editores (modo edição) ─────────────────────────────────────────────────
const inputK = (attr, chave, valor, dica = '', extra = '') =>
  `<input class="campo" ${attr}="${esc(chave)}" value="${esc(valor ?? '')}" placeholder="${esc(dica)}" ${extra} />`;
const textareaK = (attr, chave, valor, n = 2, dica = '') =>
  `<textarea class="campo" ${attr}="${esc(chave)}" rows="${n}" placeholder="${esc(dica)}">${esc(valor ?? '')}</textarea>`;

function editorCarrossel(c) {
  const slides = c.slides ?? [];
  const slide = (chave, s, rot, parte, i = null) => `
    <li class="rt-bloco" data-parte="${parte}">
      <div class="rt-cab"><span class="rt-rotulo">${esc(rot)}</span>${i != null ? `<button type="button" class="btn-icone btn-sm pc-remover" data-car-del="${i}" aria-label="Remover o slide ${i + 2}">${icone('fechar', 14)}</button>` : ''}</div>
      <label class="rotulo"><span>Título${parte === 'dev' ? ' <small>opcional</small>' : ''}</span>${inputK('data-car', `${chave}.titulo`, s?.titulo)}</label>
      <label class="rotulo">Texto${textareaK('data-car', `${chave}.texto`, s?.texto, 3, parte === 'cta' ? 'a CTA, palavra por palavra' : 'o que vai escrito no slide')}</label>
      <label class="rotulo">Visual${textareaK('data-car', `${chave}.visual`, s?.visual, 2, 'foto, ilustração, template, a palavra em coral')}</label>
    </li>`;
  return `
    <ol class="rt-blocos rt-edicao">
      ${slide('capa', c.capa, '1 · Capa', 'gancho')}
      ${slides.map((s, i) => slide(`s.${i}`, s, `Slide ${i + 2}`, 'dev', i)).join('')}
      ${slide('final', c.final, `${slides.length + 2} · CTA`, 'cta')}
    </ol>
    <button type="button" class="btn btn-sm pc-adicionar" data-car-add ${slides.length >= 18 ? 'disabled' : ''}>${icone('mais', 14)} Adicionar slide</button>`;
}

function editorEstatico(e) {
  return `
    <div class="pc-edicao">
      <label class="rotulo">Headline${inputK('data-est', 'headline', e.headline, 'o gancho da arte')}</label>
      <label class="rotulo">Texto de apoio${textareaK('data-est', 'apoio', e.apoio, 3, 'de 1 a 3 linhas curtas')}</label>
      <label class="rotulo">CTA${inputK('data-est', 'cta', e.cta)}</label>
      <label class="rotulo">Visual${textareaK('data-est', 'visual', e.visual, 3, 'template, cores, o que aparece e onde')}</label>
    </div>`;
}

function editorStories(s) {
  const qs = s.quadros ?? [];
  return `
    ${qs.length ? `<ol class="rt-blocos rt-edicao">${qs.map((q, i) => `
      <li class="rt-bloco" data-parte="dev">
        <div class="rt-cab"><span class="rt-rotulo">Quadro ${i + 1}</span><button type="button" class="btn-icone btn-sm pc-remover" data-sto-del="${i}" aria-label="Remover o quadro ${i + 1}">${icone('fechar', 14)}</button></div>
        <label class="rotulo">Texto${textareaK('data-sto', `${i}.texto`, q.texto, 2, 'o que aparece escrito')}</label>
        <label class="rotulo">Visual${inputK('data-sto', `${i}.visual`, q.visual, 'fundo, foto, vídeo curto, figurinha')}</label>
        <label class="rotulo"><span>Interação <small>opcional</small></span>${inputK('data-sto', `${i}.interacao`, q.interacao, 'enquete, caixinha, link...', 'list="dt-interacoes"')}</label>
      </li>`).join('')}</ol>` : ''}
    <datalist id="dt-interacoes">${INTERACOES.map((x) => `<option value="${esc(x)}"></option>`).join('')}</datalist>
    <button type="button" class="btn btn-sm pc-adicionar" data-sto-add ${qs.length >= 20 ? 'disabled' : ''}>${icone('mais', 14)} Adicionar quadro</button>`;
}

export function abrirDetalhe(reelId, editando = false) {
  const E = store.E;
  if (!E) return;
  const r = reel(reelId);
  if (!r) { toast('Essa peça não existe mais'); return; }
  const ro = r.roteiro ?? {};
  const g = r.gravacao ?? {};
  const fontes = (r.fontes ?? []).filter(Boolean);
  const f = formato(r.formatoId);
  const c = campanha(r.campanhaId);
  const ide = r.ideiaId ? ideia(r.ideiaId) : null;
  const tipos = tiposDaPeca(r);
  const temReel = tipos.includes('reel');
  const itensQa = qa(r);
  const leg = (r.legenda ?? '').length;
  const limiar = E.regraValidacao?.limiarRelativo ?? 1.5;
  const m = r.metricas;
  const caseDoReel = (E.cases ?? []).find((x) => x.reelId === r.id || mesmoPost(x.permalink, r.permalink));
  const podeVirarCase = r.status === 'publicado' && m?.relativo != null && Number(m.relativo) >= limiar;
  const campoTexto = (nome, valor, n = 3, dica = '') => textareaK('data-edit', nome, valor, n, dica);
  const campoLinha = (nome, valor, dica = '') => inputK('data-edit', nome, valor, dica);
  const blocos = blocosRoteiro(ro);
  const nTotal = blocos.reduce((n, b) => n + palavras(b.fala), 0);
  const cenas = ro.cenas ?? [];
  const temGravacao = [...GRAV_TEXTO.map(([k]) => g[k]), g.edicao].some(tem)
    || [...GRAV_LISTA.map(([k]) => g[k]), g.checklist].some((x) => x?.length);
  const bloco = blocoDaPeca(r);
  const pInfo = pecaInfo(tipos[0]);
  const postado = r.status === 'publicado';
  const rotGrav = (k, nome, reelSim = temReel) => (reelSim ? nome : ROTULO_PRODUCAO[k] ?? nome);

  const opcoesFormato = gruposFormato(E.formatos).map(([cat, fs]) => `
    <optgroup label="${esc(tipoFormato(fs[0]) || cat)}">
      ${fs.map((x) => `<option value="${x.id}" ${r.formatoId === x.id ? 'selected' : ''}>${esc(x.nome)} · ${esc(x.codigo)}${x.status === 'validado' ? '' : ' (em teste)'}</option>`).join('')}
    </optgroup>`).join('');
  const opcoes = (lista, atual) => lista.map(([v, t]) => `<option value="${esc(v)}" ${String(atual ?? '') === String(v) ? 'selected' : ''}>${esc(t)}</option>`).join('');

  const blocoCase = () => {
    if (caseDoReel) {
      const fc = formato(caseDoReel.formatoId);
      return `<div class="dt-aviso dt-aviso-ok">${icone('estrela', 16)}<span>Este post já está na Biblioteca como case${fc ? ` do formato <strong>${esc(fc.codigo)}</strong>` : ''}.</span>${fc ? `<a class="btn btn-sm" href="#/biblioteca/${fc.id}" data-ir="#/biblioteca/${fc.id}">Ver na biblioteca</a>` : ''}</div>`;
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

  // ── Planejamento: leitura limpa; no modo edição, os campos ──
  const planLeitura = () => {
    const item = (rot, valor, extra = '') => `<div class="dt-plan-item${extra}"><dt>${esc(rot)}</dt><dd>${valor}</dd></div>`;
    const pecasHtml = tipos.map((t) => `<span class="dt-plan-peca">${icone(pecaInfo(t).icone, 15)}${esc(pecaInfo(t).nome)}</span>`).join('<span class="dt-plan-sep">/</span>');
    const link = r.permalink
      ? `<a href="${esc(r.permalink)}" target="_blank" rel="noopener noreferrer">${esc(String(r.permalink).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>`
      : SEM_DADO;
    return `
      <div class="dt-plan">
        <div class="dt-plan-tema"><span class="dt-rotulo">Tema</span><p>${tem(r.tema) ? esc(r.tema) : SEM_DADO}</p></div>
        ${tem(r.motivo) ? `<div class="dt-plan-tema dt-plan-motivo"><span class="dt-rotulo">Motivo</span><p>${esc(r.motivo)}</p></div>` : ''}
        <dl class="dt-plan-grade">
          ${item('Bloco', bloco ? esc(blocoInfo(bloco)?.longo ?? bloco) : SEM_DADO)}
          ${item('Pilar', r.pilar ? esc(nomePilar(r.pilar) || String(r.pilar)) : SEM_DADO)}
          ${tem(r.pilarTexto) ? item('Pilar no calendário', esc(r.pilarTexto), ' largo') : ''}
          ${item('Formato', `<span class="dt-plan-pecas">${pecasHtml}</span>${f ? `<a href="#/biblioteca/${f.id}" data-ir="#/biblioteca/${f.id}" class="dt-link-fmt">${rotuloFormato(f)}</a><span class="dt-selo">${seloFormato(f, { compacto: true })}${f.duracao ? `<span class="dt-duracao">${icone('relogio', 13)}${esc(f.duracao)}</span>` : ''}</span>` : ''}${r.formatoTexto ? `<small>No calendário: ${esc(r.formatoTexto)}</small>` : ''}`, ' dt-plan-dois')}
          ${item('Data', r.data ? esc(fmtData(r.data, { ano: true, diaSemana: true })) : SEM_DADO)}
          ${item('Status', postado
            ? `<span class="pill pill-ok dt-postado-pill">${icone('check', 13)}Postado</span>`
            : `<span class="pill status-reel" data-st="${esc(r.status)}">${esc(rotulo(r.status))}</span>`)}
          ${item('Rede', esc(REDE))}
          ${item('Campanha', c ? esc(c.nome) : SEM_DADO)}
          ${item('Gatilho / observação', tem(r.gatilho) ? esc(r.gatilho) : SEM_DADO, ' largo')}
          ${item('Link do post', link, ' largo')}
        </dl>
      </div>`;
  };

  const planEdicao = () => `
    <div class="dt-plan-edicao">
      <label class="rotulo largo">Tema${inputK('data-plan', 'tema', r.tema, 'o tema em uma frase')}</label>
      <label class="rotulo largo">Motivo<textarea class="campo" data-plan="motivo" rows="2" maxlength="1000" placeholder="Por que este post existe (a defesa do calendário)">${esc(r.motivo ?? '')}</textarea></label>
      <label class="rotulo">Pilar<select class="campo" data-plan="pilar"><option value="">sem pilar</option>${BLOCOS_ESTRATEGIA.map((b) => `<optgroup label="${esc(b.longo)}">${(store.E?.pilares ?? []).filter((p) => p.bloco === b.id).map((p) => `<option value="${p.id}" data-bloco="${esc(b.id)}" ${Number(r.pilar) === p.id ? 'selected' : ''}>${esc(`${p.id} · ${p.nome}${p.status === 'guardado' ? ' (guardado)' : ''}`)}</option>`).join('')}</optgroup>`).join('')}</select></label>
      <label class="rotulo">Bloco<select class="campo" data-plan="bloco"><option value="">sem bloco</option>${opcoes(BLOCOS_ESTRATEGIA.map((b) => [b.id, b.longo]), bloco)}</select></label>
      <label class="rotulo">Status<select class="campo" data-plan="status">${opcoes(STATUS.map((s) => [s, s === 'publicado' ? 'Postado' : rotulo(s)]), r.status)}</select></label>
      <label class="rotulo">Peça<select class="campo" data-plan="peca">${opcoes(PECAS.map((p) => [p.id, p.nome]), tipos[0])}</select></label>
      <label class="rotulo" data-so-reel ${temReel ? '' : 'hidden'}>Formato da biblioteca<select class="campo" data-plan="formatoId"><option value="">Formato livre</option>${opcoesFormato}</select></label>
      <label class="rotulo">Data<input type="date" class="campo" data-plan="data" min="2000-01-01" max="2100-12-31" value="${esc(r.data)}" /></label>
      <div class="rotulo-fixo">Rede<span class="campo-fixo">${icone('instagram', 16)}${esc(REDE)}</span></div>
      <div class="rotulo-fixo">Campanha<span class="campo-fixo" title="Por enquanto só existe esta campanha">${icone('alvo', 16)}${esc(c?.nome ?? 'Pré-lançamento')}</span></div>
      <label class="rotulo largo">Formato no calendário${inputK('data-plan', 'formatoTexto', r.formatoTexto, 'ex.: Carrossel 4:5, 3 slides')}</label>
      <label class="rotulo largo">Gatilho / observação${textareaK('data-plan', 'gatilho', r.gatilho, 2, 'Data comemorativa, evergreen, janela de promoção...')}</label>
      <label class="rotulo largo">Link do post${inputK('data-plan', 'permalink', r.permalink, 'https://www.instagram.com/p/...')}</label>
      <label class="rotulo largo">Notas${textareaK('data-plan', 'notas', r.notas, 3, 'O que conferir antes de produzir')}</label>
    </div>`;

  // ── Aprovação técnica (21/10): mandar pra aprovação, ver o que disseram e mandar de novo ──
  // 21/10 (Pedro): 2 etapas. Primeiro os gerentes (os dois aprovam, cada um do seu lado), depois o Diretor contábil (um
  // basta). A trilha mostra cada gerente com check ou relógio; na vez do gerente, um atalho leva pra decidir nas Aprovações
  const apv = r.aprovacao ?? null;
  const infoApv = infoAprovacao(r);
  const vezApv = minhaVez(r);
  const blocoAprovacao = () => {
    if (!precisaAprovacao(r) || (postado && !apv)) return '';
    const dias = r.data ? Math.round((Date.parse(`${r.data}T12:00:00`) - Date.parse(`${hojeBrasilia()}T12:00:00`)) / 86400000) : null;
    const podeMandar = !postado && (!apv?.estado || ['ajuste', 'alterado'].includes(apv.estado));
    // quem aprovou ou ajustou, com nome e hora (21/10, Pedro: sempre a confirmação de quem foi)
    const estadoHtml = infoApv
      ? `<span class="dt-apv-estado" id="dt-apv-estado" data-estado="${esc(infoApv.estado)}">${icone(infoApv.icone, 15)}${esc(infoApv.dica)}</span>`
      : '<span class="dt-apv-estado">Ainda não foi pra aprovação</span>';
    // 21/10 (Pedro): o "Enviar para aprovação" fica no rodapé, no lugar do "Marcar como postado" (que só volta
    // depois de aprovada). Peça de data passada não pede aprovação (travaPostado)
    const quemAjustou = esc(apv?.decididoPor || 'Quem aprova');
    const nota = !apv?.estado && !postado && travaPostado(r)
      ? `<p class="dt-apv-nota${dias != null && dias <= 1 ? ' alerta' : ''}">${dias != null && dias <= 1
        ? `${icone('alerta', 14)} ${dias === 0 ? 'Posta hoje' : 'Posta amanhã'}: mande pra aprovação agora.`
        : 'Mande pra aprovação de preferência um dia antes de postar: primeiro os gerentes, depois o Diretor contábil. Aprovada, o botão do rodapé vira "Marcar como postado".'}</p>`
      : apv?.estado === 'ajuste' ? `<p class="dt-apv-nota alerta">${apv.tipoAjuste === 'editado' ? `${quemAjustou} mudou o texto da peça (já está aqui no roteiro). Confira, ajuste o que faltar e mande de novo.` : `${quemAjustou} sugeriu um ajuste (veja a conversa). Ajuste a peça e mande de novo.`}</p>`
        : apv?.estado === 'alterado' ? '<p class="dt-apv-nota alerta">O texto mudou depois de aprovado. Mande de novo pra aprovação antes de postar.</p>' : '';
    // a vez de quem está vendo: o gerente decide nas Aprovações técnicas (lá ele vê a peça inteira e a explicação)
    const faltamOutros = gerentesFaltando(r).filter((g) => g.id !== store.usuario?.id).map((g) => g.nome).filter(Boolean);
    const vez = vezApv === 'decidir'
      ? `<div class="dt-apv-vez"><p>${etapaAprovacao(apv) === 'gerentes' ? 'Falta a sua aprovação nesta peça (etapa dos gerentes).' : 'Falta a sua aprovação nesta peça.'}</p><button type="button" class="btn btn-primario btn-sm" data-apv-ir>${icone('escudo', 14)} Aprovar ou ajustar</button></div>`
      : vezApv === 'aguardar' ? `<p class="dt-apv-nota">Você já aprovou. ${faltamOutros.length ? `Falta${faltamOutros.length > 1 ? 'm' : ''} ${esc(juntarNomes(faltamOutros))}.` : 'Falta o outro gerente.'}</p>` : '';
    return `
      <section class="bloco" id="dt-apv">
        <div class="bloco-titulo">Aprovação técnica</div>
        <div class="dt-apv">
          ${estadoHtml}
          ${nota}
          ${vez}
          <div id="dt-apv-trilha">${trilhaHtml(r)}</div>
          ${apv?.explicacao && apv.estado !== 'ajuste' ? `<details class="dt-apv-exp"><summary>Explicação técnica</summary>${explicacaoHtml(apv.explicacao)}</details>` : ''}
          ${podeMandar ? `
          <div class="dt-apv-form" id="dt-apv-form" hidden>
            <label class="rotulo"><span>Explicação técnica <small>por que este post existe, a base contábil dele e o objetivo, curto e sem firula</small></span>
              <textarea class="campo" id="dt-apv-exp" rows="8" maxlength="3000" placeholder="Por que este post: ...&#10;Base técnica:&#10;• ... (F051)&#10;Objetivo: ...">${esc(apv?.explicacao ?? (tem(r.motivo) ? `Por que este post: ${r.motivo}` : ''))}</textarea>
            </label>
            <div class="dt-apv-acoes">
              <button type="button" class="btn" data-apv-ia>${icone('raio', 15)} Escrever com IA</button>
              <button type="button" class="btn btn-primario" data-apv-enviar>${icone('escudo', 15)} Enviar</button>
              <button type="button" class="btn btn-fantasma" data-apv-cancelar>Cancelar</button>
            </div>
          </div>` : ''}
          ${apv?.conversa?.length ? conversaHtml(apv.conversa).replace('<section class="bloco">', '<section class="dt-apv-conversa">') : ''}
          ${apv?.estado ? `
          <div class="dt-apv-form">
            <label class="rotulo"><span class="sr-only">Responder na conversa</span><textarea class="campo" id="dt-apv-msg" rows="2" maxlength="2000" placeholder="Responder na conversa da aprovação"></textarea></label>
            <div class="dt-apv-acoes"><button type="button" class="btn btn-sm" data-apv-responder>${icone('balao', 14)} Responder</button></div>
          </div>` : ''}
        </div>
      </section>`;
  };

  // ── Ideia: a do banco que a peça produz; sem ideia, busca pra vincular e "Criar ideia desta peça" ──
  const blocoIdeia = () => {
    const criar = `<button type="button" class="btn btn-sm" data-ideia-criar>${icone('mais', 14)} Criar ideia desta peça</button>`;
    // "Outra ideia": peça postada não troca de ideia
    const podeOutras = !postado;
    const outrasAberto = podeOutras && outras.aberto && outras.reelId === r.id;
    const botaoOutras = (rot) => (podeOutras
      ? `<button type="button" class="btn btn-sm dt-outras-btn" data-outras-abrir aria-expanded="${outrasAberto}" aria-controls="dt-outras">${icone('raio', 14)} ${rot}</button>`
      : '');
    const regiaoOutras = podeOutras ? `<div class="dt-outras" id="dt-outras" ${outrasAberto ? '' : 'hidden'}></div>` : '';
    if (!ide) {
      return `
      <section class="bloco" id="dt-ideia">
        <div class="bloco-titulo">Ideia</div>
        <div class="dt-ideia dt-ideia-vazia">
          <p class="dt-vazio">Sem ideia vinculada</p>
          ${seletorIdeia()}
          <div class="dt-ideia-acoes">${criar}${botaoOutras('Gerar ideias')}</div>
        </div>
        ${regiaoOutras}
      </section>`;
    }
    // a ideia no mesmo molde do Banco de Ideias: Hook, Desenvolvimento e CTA em três blocos
    const rb = ide.roteiroBase ?? {};
    const blocosIdeia = blocosRoteiro({ ...rb, hook: rb.hook || ide.gancho || '' });
    const meta = [tipoReel(ide.tipo)?.nome, ide.tema ? nomeTema(ide.tema, { curto: true }) : ''].filter(Boolean).join(' · ');
    return `
      <section class="bloco" id="dt-ideia">
        <div class="bloco-titulo dt-ideia-titulo">Ideia${botaoOutras('Outra ideia')}</div>
        <article class="dt-ideia">
          <div class="dt-ideia-topo">
            <span class="dt-ideia-ico">${icone('lampada', 16)}</span>
            <div><strong>${esc(ide.titulo)}</strong>${meta ? `<small>${esc(meta)}</small>` : ''}</div>
          </div>
          ${blocosIdeia.length ? roteiroTresHtml(blocosIdeia) : vazio('sem roteiro base ainda')}
        </article>
        <div class="dt-ideia-troca" id="dt-ideia-troca" hidden>
          ${seletorIdeia()}
          <div class="dt-ideia-acoes">${criar}<button type="button" class="btn btn-sm btn-fantasma btn-perigo" data-ideia-desvincular>Desvincular</button></div>
        </div>
        ${regiaoOutras}
      </section>`;
  };

  // detalhes de gravação (ou de produção): grade limpa na leitura, campos no modo edição
  const blocoGravacao = () => {
    if (editando) {
      return `
        <div class="dt-grav-edicao">
          ${GRAV_TEXTO.map(([k, nome, dica]) => `<label class="rotulo"><span data-rot-grav="${k}">${esc(rotGrav(k, nome))}</span>${campoLinha(`g.${k}`, g[k] ?? '', temReel ? dica : DICA_PRODUCAO[k] ?? dica)}</label>`).join('')}
          ${GRAV_LISTA.map(([k, nome]) => `<label class="rotulo"><span>${esc(nome)} <small>um por linha</small></span>${campoTexto(`g.${k}`, (g[k] ?? []).join('\n'), 4)}</label>`).join('')}
          <label class="rotulo"><span><span data-rot-grav="checklist">${esc(rotGrav('checklist', 'Checklist antes de gravar'))}</span> <small>um por linha</small></span>${campoTexto('g.checklist', (g.checklist ?? []).join('\n'), 4)}</label>
          <label class="rotulo dt-grav-largo"><span data-rot-grav="edicao">${esc(rotGrav('edicao', 'Edição'))}</span>${campoTexto('g.edicao', g.edicao ?? '', 3, 'cortes, zooms, legenda queimada Sora com 1 palavra coral por frase, tag ME/MEI no canto, end card')}</label>
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
    const textos = GRAV_TEXTO.filter(([k]) => tem(g[k]));
    const listas = GRAV_LISTA.filter(([k]) => g[k]?.length);
    return `
      ${textos.length ? `<div class="dt-grav">
        ${textos.map(([k, nome]) => `<div class="dt-grav-item${k === 'enquadramento' || k === 'local' || k === 'audio' ? ' largo' : ''}"><span class="dt-rotulo">${esc(rotGrav(k, nome))}</span><p>${esc(g[k])}</p></div>`).join('')}
      </div>` : ''}
      ${listas.length ? `<div class="dt-grav-listas">
        ${listas.map(([k, nome]) => `<div class="dt-grav-lista"><span class="dt-rotulo">${esc(nome)}</span>${lista(g[k], k === 'telasApp')}</div>`).join('')}
      </div>` : ''}
      ${g.checklist?.length || tem(g.edicao) ? `<div class="dt-grav-listas dt-grav-fim">
        ${g.checklist?.length ? `<div class="dt-grav-lista dt-check">
          <span class="dt-rotulo">${esc(rotGrav('checklist', 'Checklist antes de gravar'))}</span>
          <ul>${g.checklist.map((x, i) => `<li><label><input type="checkbox" data-check="${r.id}:${i}" ${marcados.has(`${r.id}:${i}`) ? 'checked' : ''} /><span>${esc(x)}</span></label></li>`).join('')}</ul>
        </div>` : ''}
        ${tem(g.edicao) ? `<div class="dt-grav-lista"><span class="dt-rotulo">${esc(rotGrav('edicao', 'Edição'))}</span><p>${esc(g.edicao)}</p></div>` : ''}
      </div>` : ''}`;
  };

  // edição do roteiro: com cenas, cada bloco (tempo, fala, em cena, na tela); sem cenas, gancho, desenvolvimento e CTA
  const edicaoRoteiro = () => {
    if (cenas.length) {
      return `<ol class="rt-blocos rt-edicao">${cenas.map((cn, i) => `
        <li class="rt-bloco" data-parte="${blocos[i]?.parte ?? 'dev'}">
          <div class="rt-cab"><span class="rt-rotulo">${esc(blocos[i]?.rotulo ?? `Bloco ${i + 1}`)}</span>${campoLinha(`c.${i}.tempo`, cn.tempo, '0-3s')}</div>
          <label class="rotulo">Fala${campoTexto(`c.${i}.fala`, cn.fala, 3)}</label>
          <label class="rotulo">Em cena${campoLinha(`c.${i}.cena`, cn.cena, 'o que a câmera mostra')}</label>
          <label class="rotulo"><span>Na tela <small>opcional</small></span>${campoLinha(`c.${i}.tela`, cn.tela, 'só se ajudar: número ou palavra-chave')}</label>
        </li>`).join('')}</ol>`;
    }
    return `
      <label class="rotulo">Gancho${campoTexto('hook', ro.hook, 2, 'O que se fala nos primeiros 3 segundos')}</label>
      <label class="rotulo"><span>Na tela no gancho <small>opcional</small></span>${campoLinha('textoTela', ro.textoTela, 'só se ajudar: som desligado, número ou palavra-chave')}</label>
      <label class="rotulo"><span>Desenvolvimento <small>uma batida por parágrafo</small></span>${campoTexto('desenvolvimento', ro.desenvolvimento, 7, 'Palavra por palavra, como vai ser falado')}</label>
      <label class="rotulo">CTA${campoTexto('cta', ro.cta, 2)}</label>`;
  };

  // uma seção por tipo de peça. No modo edição saem as quatro, e só as dos tipos escolhidos aparecem
  const nSlides = slidesDe(r.carrossel).length;
  const nQuadros = (r.stories?.quadros ?? []).length;
  const copiar = (k) => (editando ? '' : `<button class="btn btn-sm btn-fantasma" data-copiar="${k}">${icone('copiar', 14)} Copiar</button>`);
  const secoes = {
    reel: () => `
      <section class="bloco" data-sec-peca="reel">
        <div class="bloco-titulo">Roteiro${nTotal ? `<span class="dt-contador" title="Estimativa a ${String(PALAVRAS_POR_SEGUNDO).replace('.', ',')} palavras por segundo">${nTotal} palavras · ~${Math.round(nTotal / PALAVRAS_POR_SEGUNDO)}s</span>` : ''}${blocos.length ? copiar('roteiro') : ''}</div>
        ${editando ? edicaoRoteiro() : blocos.length ? roteiroTresHtml(blocos) : vazio('sem roteiro ainda')}
      </section>`,
    carrossel: () => `
      <section class="bloco" data-sec-peca="carrossel">
        <div class="bloco-titulo">Carrossel${nSlides && !editando ? `<span class="dt-contador">${nSlides} ${nSlides === 1 ? 'slide' : 'slides'}</span>` : ''}${nSlides ? copiar('carrossel') : ''}</div>
        ${editando ? `<div id="dt-ed-carrossel">${editorCarrossel(r.carrossel ?? {})}</div>` : carrosselHtml(r.carrossel)}
      </section>`,
    estatico: () => `
      <section class="bloco" data-sec-peca="estatico">
        <div class="bloco-titulo">Estático${PARTES_ESTATICO.some(([k]) => tem(r.estatico?.[k])) ? copiar('estatico') : ''}</div>
        ${editando ? editorEstatico(r.estatico ?? {}) : estaticoHtml(r.estatico)}
      </section>`,
    stories: () => `
      <section class="bloco" data-sec-peca="stories">
        <div class="bloco-titulo">Stories${nQuadros && !editando ? `<span class="dt-contador">${nQuadros} ${nQuadros === 1 ? 'quadro' : 'quadros'}</span>` : ''}${nQuadros ? copiar('stories') : ''}</div>
        ${editando ? `<div id="dt-ed-stories">${editorStories(r.stories ?? {})}</div>` : storiesHtml(r.stories)}
      </section>`,
  };
  const ordem = editando ? [...tipos, ...PECAS.map((p) => p.id).filter((t) => !tipos.includes(t))] : tipos;
  const secoesHtml = ordem.map((t) => secoes[t]().replace('<section class="bloco"', `<section class="bloco"${tipos.includes(t) ? '' : ' hidden'}`)).join('');
  const mostraLegenda = editando || !(tipos.length === 1 && tipos[0] === 'stories') || tem(r.legenda);

  painel = abrirPainel(`
    <div class="painel-topo">
      <div class="dt-cabeca">
        <div class="dt-pills">
          <span class="pill pill-peca">${icone(pInfo.icone, 13)}${esc(rotuloPeca(r))}</span>
          ${pillBloco(blocoDaPeca(r))}
          ${editando ? '' : pilulaVideoFinal(r)}
          ${postado && !editando ? `<span class="pill pill-ok">${icone('check', 13)}Postado</span>` : ''}
          ${!postado && !editando && infoApv ? `<span class="pill dt-apv-pill" data-estado="${esc(infoApv.estado)}" title="${esc(infoApv.dica)}">${icone(infoApv.icone, 13)}${esc(infoApv.curto ?? infoApv.nome)}</span>` : ''}
        </div>
        ${editando ? `<input class="campo dt-titulo-campo" id="dt-titulo" value="${esc(r.ideia)}" aria-label="Título" />` : `<h2>${esc(r.ideia)}</h2>`}
      </div>
      ${editando ? '' : botaoNotas(r.notas) + botaoFontes(fontes)}
      ${BTN_FECHAR}
    </div>
    <div class="painel-corpo">

      <section class="bloco">
        <div class="bloco-titulo">Planejamento</div>
        ${editando ? planEdicao() : planLeitura()}
      </section>

      ${editando ? '' : blocoAprovacao()}

      ${editando ? '' : secaoVideoFinal(r)}

      ${editando ? '' : blocoIdeia()}

      ${editando ? '' : blocoMecanismoHtml(r, { postado })}

      ${secoesHtml}

      ${editando || temGravacao ? `
      <section class="bloco">
        <div class="bloco-titulo" id="dt-titulo-grav">${temReel ? 'Detalhes de gravação' : 'Detalhes de produção'}</div>
        ${blocoGravacao()}
      </section>` : ''}

      ${editando ? `
      <section class="bloco">
        <div class="bloco-titulo">Fontes</div>
        ${campoTexto('fontes', fontes.join('\n'), 4, 'Uma fonte por linha')}
      </section>` : ''}

      ${mostraLegenda ? `
      <section class="bloco">
        <div class="bloco-titulo">Legenda <span class="dt-contador ${leg > 2200 ? 'estourou' : ''}" id="dt-contador">${leg.toLocaleString('pt-BR')} / 2.200</span>${editando || !tem(r.legenda) ? '' : `<button class="btn btn-sm btn-fantasma" data-copiar="legenda">${icone('copiar', 14)} Copiar</button>`}</div>
        ${editando ? campoTexto('legenda', r.legenda, 14) : `<div class="texto">${r.legenda ? esc(r.legenda) : '<span class="dt-vazio">sem legenda ainda</span>'}</div>`}
      </section>` : ''}

      <section class="bloco">
        <div class="bloco-titulo">Checagem das regras duras</div>
        <div class="dt-qa">${itensQa.map((i) => `<span class="selo ${i.ok ? 'validado' : i.nivel === 'alerta' ? 'em-teste' : 'erro'}">${i.ok ? '✓' : i.nivel === 'alerta' ? '!' : '✕'} ${esc(i.texto)}</span>`).join('')}</div>
      </section>

      ${editando || !blocoCase() ? '' : `
      <section class="bloco">
        <div class="bloco-titulo">Biblioteca</div>
        ${blocoCase()}
      </section>`}

      ${r.origem ? `<p class="dt-arquivo">Arquivo: ${esc(r.origem)}</p>` : ''}
    </div>
    <div class="painel-rodape dt-rodape">
      ${editando
        ? `<button class="btn btn-primario" id="dt-salvar">Salvar</button><button class="btn" id="dt-cancelar">Cancelar</button>`
        : `${postado
          ? `<button class="btn btn-postado" id="dt-postado" aria-pressed="true" title="Clique pra desmarcar">${icone('check', 16)} Postado</button>`
          // sem aprovação, o lugar do "Marcar como postado" é do "Enviar para aprovação" (com o diretor: esperando)
          : travaPostado(r)
            ? `${apv?.estado === 'pendente'
              ? `<button class="btn" id="dt-apv-esperando" disabled title="${esc(infoApv?.dica ?? 'Com o Diretor contábil')}">${icone('relogio', 16)} Esperando aprovação</button>`
              : `<button class="btn btn-primario" data-apv-abrir>${icone('escudo', 16)} ${apv?.estado ? 'Mandar de novo pra aprovação' : 'Enviar para aprovação'}</button>`}<button class="btn" id="dt-skill">${icone('raio', 16)} Ajustar com a skill</button>`
            : `<button class="btn btn-primario" id="dt-postado" aria-pressed="false">${icone('check', 16)} Marcar como postado</button><button class="btn" id="dt-skill">${icone('raio', 16)} Ajustar com a skill</button>`}<button class="btn" id="dt-editar">${icone('editar', 16)} Editar</button><button class="btn" data-copiar-peca>${icone('copiar', 16)} Copiar peça</button>`}
      <span class="dt-espaco"></span>
      <button class="btn btn-fantasma btn-perigo" id="dt-excluir">${icone('lixo', 16)} Excluir</button>
    </div>
  `, { largo: true }) || document.querySelector('.painel');

  const p = painel;
  const q = (s) => p.querySelector(s);
  const qq = (s) => [...p.querySelectorAll(s)];

  ligarPlayers(p);
  qq('[data-fechar]').forEach((b) => (b.onclick = fecharPainel));
  qq('[data-ir]').forEach((a) => (a.onclick = (e) => {
    e.preventDefault();
    fecharPainel();
    navegar(a.dataset.ir);
  }));

  const copiarTexto = async (texto, ok = 'Copiado') => {
    try {
      await navigator.clipboard.writeText(texto ?? '');
      toast(ok);
    } catch { toast('Não consegui copiar. Selecione o texto e copie na mão.'); }
  };
  const TEXTO_SECAO = {
    roteiro: () => roteiroTresTexto(blocos),
    carrossel: () => carrosselTexto(r.carrossel),
    estatico: () => estaticoTexto(r.estatico),
    stories: () => storiesTexto(r.stories),
    legenda: () => r.legenda,
  };
  qq('[data-copiar]').forEach((b) => (b.onclick = () => copiarTexto(TEXTO_SECAO[b.dataset.copiar]?.() ?? '')));
  qq('[data-copiar-peca]').forEach((b) => (b.onclick = () => copiarTexto(textoPeca(reel(r.id) ?? r, f), 'Peça copiada')));
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
      toast('Peça excluída');
      await recarregar();
    } catch (e) { toast(e.message); }
  };

  if (!editando) {
    // ── Mecanismo (21/10): alertas da semana, exceção, regerar e voltar à versão anterior ──
    ligarBlocoMecanismo(p, r, { reabrir: (id) => reabrir(id), abrirPeca: (id) => abrirDetalhe(id), abrirStoriesDia: (id) => storiesDoDia.abrirStories?.(id) });
    // ── Postado (21/10): marca e desmarca. Desmarcar volta pra "editado" e pede confirmação ──
    const btnPostado = q('#dt-postado');
    if (btnPostado) btnPostado.onclick = async () => {
      if (postado && !confirm(`Desmarcar "${r.ideia}" como postado? A peça volta pra Editado.`)) return;
      btnPostado.disabled = true;
      try {
        await api('PUT', `/api/reels/${r.id}`, { status: postado ? 'editado' : 'publicado' });
        await recarregar();
        reabrir(r.id);
        toast(postado ? 'Desmarcado: a peça voltou pra Editado' : 'Marcado como postado');
      } catch (e) {
        btnPostado.disabled = false;
        toast(e.message);
      }
    };
    // ── Aprovação técnica (21/10): explicação (à mão ou rascunho da IA), enviar e responder na conversa ──
    const formApv = q('#dt-apv-form');
    const abrirApv = q('[data-apv-abrir]');
    // o botão é o do rodapé: abre o formulário da explicação no bloco "Aprovação técnica" e leva até ele
    if (abrirApv && formApv) abrirApv.onclick = () => {
      formApv.hidden = false;
      formApv.scrollIntoView({ block: 'center', behavior: 'smooth' });
      q('#dt-apv-exp')?.focus({ preventScroll: true });
    };
    const cancelarApv = q('[data-apv-cancelar]');
    if (cancelarApv && formApv) cancelarApv.onclick = () => { formApv.hidden = true; abrirApv?.focus(); };
    const iaApv = q('[data-apv-ia]');
    if (iaApv) iaApv.onclick = async () => {
      const antes = iaApv.innerHTML;
      iaApv.disabled = true;
      iaApv.setAttribute('aria-busy', 'true');
      iaApv.innerHTML = '<span class="dt-spinner" aria-hidden="true"></span> Escrevendo';
      try {
        const d = await api('POST', `/api/aprovacoes/${encodeURIComponent(r.id)}/explicacao`, {});
        const campo = q('#dt-apv-exp');
        if (campo) campo.value = d.explicacao ?? '';
        toast('Rascunho pronto: confira antes de enviar');
      } catch (e) { toast(e.message); }
      finally {
        if (iaApv.isConnected) { iaApv.disabled = false; iaApv.removeAttribute('aria-busy'); iaApv.innerHTML = antes; }
      }
    };
    const enviarApv = q('[data-apv-enviar]');
    if (enviarApv) enviarApv.onclick = async () => {
      const explicacao = q('#dt-apv-exp').value.trim();
      if (!explicacao) { toast('Escreva a explicação técnica (ou use "Escrever com IA").'); q('#dt-apv-exp').focus(); return; }
      enviarApv.disabled = true;
      try {
        const novo = await api('POST', `/api/aprovacoes/${encodeURIComponent(r.id)}/enviar`, { explicacao });
        invalidarAprovacoes();
        await recarregar();
        reabrir(r.id);
        // 21/10: sem gerente cadastrado, o servidor já manda direto pro Diretor contábil
        toast(etapaAprovacao(novo?.aprovacao) === 'diretor' ? 'Mandada pra aprovação: está com o Diretor contábil' : 'Mandada pra aprovação: agora está com os gerentes');
      } catch (e) {
        enviarApv.disabled = false;
        toast(e.message);
      }
    };
    // 21/10: a vez do gerente: abre a peça nas Aprovações técnicas, pronta pra aprovar ou ajustar
    const irApv = q('[data-apv-ir]');
    if (irApv) irApv.onclick = () => { fecharPainel(); navegar(`#/aprovacoes?abrir=${encodeURIComponent(r.id)}`); };
    // a peça do /api/estado não traz quem são os gerentes: sem a lista guardada, busca uma vez e redesenha a trilha
    if (apv?.estado === 'pendente' && etapaAprovacao(apv) === 'gerentes' && !gerentesDe(r)) {
      api('GET', '/api/aprovacoes').then((dados) => {
        lembrarGerentes(dados);
        const trilha = q('#dt-apv-trilha');
        if (!trilha?.isConnected || !gerentesDe(r)) return;
        trilha.innerHTML = trilhaHtml(r);
        const est = q('#dt-apv-estado');
        const info = infoAprovacao(r);
        if (!info) return;
        if (est) est.innerHTML = `${icone(info.icone, 15)}${esc(info.dica)}`;
        // 21/10 (Pedro): a pílula do topo e o "Esperando aprovação" do rodapé ganham o "(1 de 2)" junto com a trilha
        const pilula = q('.dt-apv-pill');
        if (pilula) {
          pilula.innerHTML = `${icone(info.icone, 13)}${esc(info.curto ?? info.nome)}`;
          pilula.title = info.dica;
        }
        const esperando = q('#dt-apv-esperando');
        if (esperando) esperando.title = info.dica;
      }).catch(() => {});
    }
    const responderApv = q('[data-apv-responder]');
    if (responderApv) responderApv.onclick = async () => {
      const texto = q('#dt-apv-msg').value.trim();
      if (!texto) { q('#dt-apv-msg').focus(); return; }
      responderApv.disabled = true;
      try {
        await api('POST', `/api/aprovacoes/${encodeURIComponent(r.id)}/mensagem`, { texto });
        invalidarAprovacoes();
        await recarregar();
        reabrir(r.id);
        toast('Resposta enviada');
      } catch (e) {
        responderApv.disabled = false;
        toast(e.message);
      }
    };
    // ── Ideia: vincular (busca), trocar, desvincular, criar a partir da peça ──
    const vincular = async (ideiaId) => {
      try {
        await api('PUT', `/api/reels/${r.id}`, { ideiaId: ideiaId || '' });
        await recarregar();
        reabrir(r.id);
        toast(ideiaId ? 'Ideia vinculada' : 'Ideia desvinculada');
      } catch (e) { toast(e.message); }
    };
    const campoIdeia = q('#dt-ideia-q');
    const listaIdeia = q('#dt-ideia-opcoes');
    // a saída do "Outra ideia" sem login: a busca mostra só as livres (mesmo tipo primeiro)
    let soLivres = false;
    let mostrarBusca = () => {};
    const modoLivres = (sim) => {
      soLivres = sim;
      if (campoIdeia) campoIdeia.placeholder = sim ? 'Buscar ideia livre no banco' : 'Buscar no Banco de Ideias';
    };
    if (campoIdeia && listaIdeia) {
      let ativo = -1;
      const itens = () => [...listaIdeia.querySelectorAll('[data-ideia-opcao]')];
      const marcarAtivo = (i) => {
        const its = itens();
        ativo = its.length ? (i + its.length) % its.length : -1;
        its.forEach((el, k) => el.setAttribute('aria-selected', String(k === ativo)));
        const el = its[ativo];
        if (el) { campoIdeia.setAttribute('aria-activedescendant', el.id); el.scrollIntoView({ block: 'nearest' }); }
        else campoIdeia.removeAttribute('aria-activedescendant');
      };
      const mostrar = () => {
        const ops = opcoesIdeia(r, campoIdeia.value, { soLivres });
        listaIdeia.innerHTML = ops.length ? ops.map(opcaoIdeiaHtml).join('') : `<li class="dt-ideia-nada" role="presentation">Nenhuma ideia ${soLivres ? 'livre ' : ''}com esse texto</li>`;
        listaIdeia.hidden = false;
        campoIdeia.setAttribute('aria-expanded', 'true');
        ativo = -1;
        campoIdeia.removeAttribute('aria-activedescendant');
      };
      const esconder = () => {
        listaIdeia.hidden = true;
        campoIdeia.setAttribute('aria-expanded', 'false');
        campoIdeia.removeAttribute('aria-activedescendant');
        ativo = -1;
      };
      mostrarBusca = mostrar;
      campoIdeia.onfocus = mostrar;
      campoIdeia.oninput = mostrar;
      campoIdeia.onblur = () => setTimeout(esconder, 150);
      campoIdeia.onkeydown = (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (listaIdeia.hidden) mostrar();
          marcarAtivo(ativo < 0 && e.key === 'ArrowUp' ? -1 : ativo + (e.key === 'ArrowDown' ? 1 : -1));
        } else if (e.key === 'Enter' && ativo >= 0) {
          e.preventDefault();
          vincular(itens()[ativo].dataset.ideiaOpcao);
        } else if (e.key === 'Escape' && !listaIdeia.hidden) {
          // fecha só a lista, não o painel
          e.preventDefault();
          e.stopPropagation();
          esconder();
        }
      };
      // o clique numa opção não tira o foco do campo (a lista não fecha antes do clique)
      listaIdeia.onmousedown = (e) => e.preventDefault();
      listaIdeia.onclick = (e) => {
        const op = e.target.closest('[data-ideia-opcao]');
        if (op) vincular(op.dataset.ideiaOpcao);
      };
    }
    const btnTrocar = q('[data-ideia-trocar]');
    const caixaTroca = q('#dt-ideia-troca');
    const mostrarTroca = (abrir) => {
      if (!caixaTroca) return;
      caixaTroca.hidden = !abrir;
      btnTrocar?.setAttribute('aria-expanded', String(abrir));
    };
    if (btnTrocar) btnTrocar.onclick = () => {
      const abrir = caixaTroca.hidden;
      if (abrir) { fecharOutras(); modoLivres(false); }
      mostrarTroca(abrir);
      if (abrir) campoIdeia?.focus();
    };
    const btnDesvincular = q('[data-ideia-desvincular]');
    if (btnDesvincular) btnDesvincular.onclick = () => vincular('');

    // ── Outra ideia: 3 opções da IA pro mesmo lugar. Sem login, a frase curta e o banco (só as livres) ──
    const caixaOutras = q('#dt-outras');
    const botoesOutras = qq('[data-outras-abrir]');
    const minha = (seq) => seq === outras.seq && outras.reelId === r.id && caixaOutras?.isConnected;
    function marcarOutras(abrir) {
      if (!caixaOutras) return;
      caixaOutras.hidden = !abrir;
      botoesOutras.forEach((b) => b.setAttribute('aria-expanded', String(abrir)));
    }
    // fecha só a caixa: a geração que estiver rodando continua no servidor e volta quando reabrir
    function fecharOutras() {
      if (!caixaOutras || caixaOutras.hidden) return;
      outras.aberto = false;
      outras.seq++;
      marcarOutras(false);
      caixaOutras.innerHTML = '';
    }
    function relogioOutras(seq) {
      const t = setInterval(() => {
        const el = caixaOutras?.querySelector('.dt-outras-tempo');
        if (!minha(seq) || outras.fase !== 'gerando') return clearInterval(t);
        if (el) el.textContent = tempoOutras();
      }, 1000);
    }
    function pintarOutras(seq) {
      caixaOutras.innerHTML = outrasHtml();
      if (outras.fase === 'gerando') relogioOutras(seq);
      caixaOutras.querySelector('[data-outras-fechar]')?.addEventListener('click', () => {
        fecharOutras();
        botoesOutras[0]?.focus();
      });
      caixaOutras.querySelector('[data-outras-gerar]')?.addEventListener('click', () => comecarOutras(true));
      caixaOutras.querySelector('[data-outras-banco]')?.addEventListener('click', () => {
        fecharOutras();
        modoLivres(true);
        mostrarTroca(true);
        campoIdeia?.focus();
        mostrarBusca(); // a lista abre mesmo se o campo já estava com o foco
      });
      caixaOutras.querySelectorAll('[data-op-ler]').forEach((b) => b.addEventListener('click', () => {
        const alvo = document.getElementById(b.getAttribute('aria-controls'));
        if (!alvo) return;
        alvo.hidden = !alvo.hidden;
        b.setAttribute('aria-expanded', String(!alvo.hidden));
        b.textContent = alvo.hidden ? 'Ler tudo' : 'Mostrar menos';
      }));
      caixaOutras.querySelectorAll('[data-op-usar]').forEach((b) => b.addEventListener('click', () => usarOutra(b)));
    }
    function falhouOutras(seq, erro, semLogin = false) {
      if (!minha(seq)) return;
      Object.assign(outras, { fase: 'erro', erro, semLogin, opcoes: [] });
      pintarOutras(seq);
    }
    // resposta do servidor (POST ou GET): gerando segue acompanhando; pronta mostra as opções
    function aplicarOutras(d, seq) {
      if (!minha(seq)) return;
      const j = d?.job;
      if (!j) return falhouOutras(seq, 'As opções não estão mais no servidor. Gere de novo.');
      if (j.estado === 'gerando') {
        const antes = outras.fase;
        Object.assign(outras, { fase: 'gerando', desde: Date.now() - (Number(j.segundos) || 0) * 1000 });
        if (antes !== 'gerando') pintarOutras(seq);
        setTimeout(async () => {
          if (!minha(seq)) return;
          try { aplicarOutras(await api('GET', urlOutras(r.id)), seq); } catch (e) { falhouOutras(seq, e.message); }
        }, 2500);
        return;
      }
      if (j.estado === 'pronto') {
        Object.assign(outras, { fase: 'pronto', opcoes: d.opcoes ?? [], erro: '', semLogin: false });
        return pintarOutras(seq);
      }
      falhouOutras(seq, j.erro || 'A geração falhou. Tente de novo.', j.semLogin);
    }
    // novas: "Gerar outras" / "Tentar de novo" (sempre gera). Sem isso, reabre o que já houver pra esta peça
    async function comecarOutras(novas = false) {
      if (!caixaOutras) return;
      const seq = ++outras.seq;
      Object.assign(outras, { reelId: r.id, aberto: true, fase: 'abrindo', opcoes: [], erro: '', semLogin: false });
      mostrarTroca(false);
      marcarOutras(true);
      pintarOutras(seq);
      caixaOutras.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      try {
        let d = novas ? null : await api('GET', urlOutras(r.id));
        if (!minha(seq)) return;
        if (!d?.job || d.job.estado === 'erro') d = await api('POST', urlOutras(r.id));
        aplicarOutras(d, seq);
      } catch (e) { falhouOutras(seq, e.message); }
    }
    async function usarOutra(b) {
      if (outras.usando) return;
      const temTexto = Boolean(ganchoDaPeca(r) || ctaDaPeca(r));
      if (temTexto && !confirm(`Usar esta ideia? O texto desta peça é trocado${ide ? ' e a ideia de agora volta pro banco' : ''}.`)) return;
      outras.usando = true;
      const usar = [...caixaOutras.querySelectorAll('[data-op-usar]')];
      usar.forEach((x) => { x.disabled = true; });
      b.setAttribute('aria-busy', 'true');
      try {
        await api('POST', `${urlOutras(r.id)}/usar`, { opcao: b.dataset.opUsar });
        Object.assign(outras, { aberto: false, fase: '', opcoes: [] });
        outras.seq++;
        await recarregar();
        reabrir(r.id);
        toast('Ideia trocada');
      } catch (e) {
        toast(e.message);
        if (e.status === 410) falhouOutras(outras.seq, e.message);
        else { usar.forEach((x) => { x.disabled = false; }); b.removeAttribute('aria-busy'); }
      } finally {
        outras.usando = false;
      }
    }
    botoesOutras.forEach((b) => (b.onclick = () => (caixaOutras && !caixaOutras.hidden ? fecharOutras() : comecarOutras())));
    // o painel redesenhou (recarga, outra ação) com a caixa aberta: retoma sem gerar de novo
    if (caixaOutras && outras.aberto && outras.reelId === r.id) {
      const seq = ++outras.seq;
      if (outras.fase === 'pronto' || outras.fase === 'erro') pintarOutras(seq);
      else {
        outras.fase = 'abrindo';
        pintarOutras(seq);
        api('GET', urlOutras(r.id)).then((d) => aplicarOutras(d, seq), (e) => falhouOutras(seq, e.message));
      }
    }
    const btnCriarIdeia = q('[data-ideia-criar]');
    if (btnCriarIdeia) btnCriarIdeia.onclick = () => abrirNovaIdeiaDaPeca(ideiaDaPeca(r), { reelId: r.id, voltar: () => abrirDetalhe(r.id) });

    q('#dt-editar').onclick = () => reabrir(r.id, true);
    const btnSkill = q('#dt-skill');
    if (btnSkill) btnSkill.onclick = () => abrirChat({
      reelId: r.id, formatoId: r.formatoId, campanhaId: r.campanhaId, data: r.data, tipo: r.tipo ?? '', ideiaId: r.ideiaId ?? '',
      pilar: r.pilar ?? '', titulo: `Ajustar: ${r.ideia}`,
    });
    return;
  }

  // ── modo edição ──
  const legenda = q('[data-edit="legenda"]');
  const contador = q('#dt-contador');
  legenda.oninput = () => {
    const n = legenda.value.length;
    contador.textContent = `${n.toLocaleString('pt-BR')} / 2.200`;
    contador.classList.toggle('estourou', n > 2200);
  };
  q('#dt-cancelar').onclick = () => reabrir(r.id);

  // o tipo escolhido (um só): mostra a seção de conteúdo dele, o formato da biblioteca (só reel) e o título da gravação
  const selPeca = q('[data-plan="peca"]');
  const tiposForm = () => [selPeca.value].filter(Boolean);
  const aplicarTipos = () => {
    const ts = tiposForm();
    const comReel = ts.includes('reel');
    qq('[data-sec-peca]').forEach((s) => { s.hidden = !ts.includes(s.dataset.secPeca); });
    q('[data-so-reel]').hidden = !comReel;
    q('#dt-titulo-grav').textContent = comReel ? 'Detalhes de gravação' : 'Detalhes de produção';
    const nomes = { duracao: 'Duração', edicao: 'Edição', checklist: 'Checklist antes de gravar' };
    qq('[data-rot-grav]').forEach((el) => { el.textContent = rotGrav(el.dataset.rotGrav, nomes[el.dataset.rotGrav], comReel); });
  };
  selPeca.onchange = aplicarTipos;
  // 21/10: o pilar escolhido leva o bloco dele (estratégia principal)
  const selPilar = q('[data-plan="pilar"]');
  const selBloco = q('[data-plan="bloco"]');
  if (selPilar && selBloco) selPilar.onchange = () => { const b = selPilar.selectedOptions[0]?.dataset.bloco; if (b) selBloco.value = b; };

  // carrossel e stories: slides e quadros entram e saem sem perder o que já foi digitado
  const valor = (attr, k) => p.querySelector(`[${attr}="${CSS.escape(k)}"]`)?.value ?? '';
  const lerCarrossel = () => {
    const slide = (k) => ({ titulo: valor('data-car', `${k}.titulo`), texto: valor('data-car', `${k}.texto`), visual: valor('data-car', `${k}.visual`) });
    const n = qq('[data-car-del]').length;
    return { capa: slide('capa'), slides: Array.from({ length: n }, (_, i) => slide(`s.${i}`)), final: slide('final') };
  };
  const lerStories = () => ({
    quadros: Array.from({ length: qq('[data-sto-del]').length }, (_, i) => ({
      texto: valor('data-sto', `${i}.texto`), visual: valor('data-sto', `${i}.visual`), interacao: valor('data-sto', `${i}.interacao`),
    })),
  });
  const lerEstatico = () => Object.fromEntries(['headline', 'apoio', 'cta', 'visual'].map((k) => [k, valor('data-est', k)]));
  const edCarrossel = q('#dt-ed-carrossel');
  edCarrossel.onclick = (e) => {
    const add = e.target.closest('[data-car-add]');
    const del = e.target.closest('[data-car-del]');
    if (!add && !del) return;
    const cr = lerCarrossel();
    if (add) cr.slides.push({ titulo: '', texto: '', visual: '' });
    else cr.slides.splice(Number(del.dataset.carDel), 1);
    edCarrossel.innerHTML = editorCarrossel(cr);
    if (add) edCarrossel.querySelector(`[data-car="s.${cr.slides.length - 1}.texto"]`)?.focus();
    else edCarrossel.querySelector('[data-car-add]')?.focus();
  };
  const edStories = q('#dt-ed-stories');
  edStories.onclick = (e) => {
    const add = e.target.closest('[data-sto-add]');
    const del = e.target.closest('[data-sto-del]');
    if (!add && !del) return;
    const st = lerStories();
    if (add) st.quadros.push({ texto: '', visual: '', interacao: '' });
    else st.quadros.splice(Number(del.dataset.stoDel), 1);
    edStories.innerHTML = editorStories(st);
    if (add) edStories.querySelector(`[data-sto="${st.quadros.length - 1}.texto"]`)?.focus();
    else edStories.querySelector('[data-sto-add]')?.focus();
  };

  // com cenas, o gancho é a fala da primeira, a CTA a da última (quando ela é a CTA) e o resto é o desenvolvimento
  const roteiroEditado = (v) => {
    if (!cenas.length) return { ...ro, hook: v.hook ?? '', textoTela: v.textoTela ?? '', desenvolvimento: v.desenvolvimento ?? '', cta: v.cta ?? '' };
    const novas = cenas.map((cn, i) => Object.fromEntries(['tempo', 'fala', 'cena', 'tela'].map((k) => [k, String(v[`c.${i}.${k}`] ?? cn[k] ?? '').trim()])));
    const temCta = blocos[cenas.length - 1]?.parte === 'cta';
    const meio = novas.slice(1, temCta ? -1 : undefined);
    return {
      ...ro,
      cenas: novas,
      hook: novas[0].fala,
      textoTela: novas[0].tela,
      desenvolvimento: meio.map((cn) => cn.fala).filter(Boolean).join('\n\n'),
      cta: temCta ? novas.at(-1).fala : ro.cta,
    };
  };

  q('#dt-salvar').onclick = async () => {
    const v = Object.fromEntries(qq('[data-edit]').map((t) => [t.dataset.edit, t.value]));
    const plan = Object.fromEntries(qq('[data-plan]').map((t) => [t.dataset.plan, t.value]));
    const campoData = q('[data-plan="data"]');
    if (!campoData.checkValidity() || (plan.data && !/^\d{4}-\d{2}-\d{2}$/.test(plan.data))) {
      toast('Data incompleta ou fora do intervalo. Confira o ano.');
      campoData.focus();
      return;
    }
    const ts = tiposForm();
    const gravacao = Object.fromEntries([
      ...GRAV_TEXTO.map(([k]) => [k, v[`g.${k}`] ?? '']),
      ...[...GRAV_LISTA.map(([k]) => k), 'checklist'].map((k) => [k, linhas(v[`g.${k}`])]),
      ['edicao', v['g.edicao'] ?? ''],
    ]);
    // servidor que ainda não reiniciou com a versão das peças (item sem "peca"): não manda os campos novos
    const migrado = 'peca' in r;
    const botao = q('#dt-salvar');
    botao.disabled = true;
    try {
      await api('PUT', `/api/reels/${r.id}`, {
        ideia: q('#dt-titulo').value.trim() || r.ideia,
        tema: plan.tema,
        // um tipo só: a segunda peça sempre sai
        ...(migrado ? { bloco: plan.bloco, peca: plan.peca, peca2: '' } : {}),
        // 21/10: na tela é o pilar (estratégia principal); o tipo por dentro acompanha o pilar
        pilar: plan.pilar ? Number(plan.pilar) : null,
        tipo: plan.pilar ? (tipoDoPilar(plan.pilar) ?? r.tipo ?? '') : (r.tipo ?? ''),
        motivo: plan.motivo,
        // formato da biblioteca só vale com reel; escondido, fica o que já estava
        formatoId: ts.includes('reel') ? plan.formatoId : r.formatoId ?? '',
        formatoTexto: plan.formatoTexto,
        data: plan.data,
        status: plan.status,
        rede: REDE,
        gatilho: plan.gatilho,
        // o link só vai quando mudou no formulário: soltar o post em Métricas com este painel aberto tira o link
        // da peça, e o valor antigo daqui não pode religar
        ...(plan.permalink.trim() !== String(r.permalink ?? '').trim() ? { permalink: plan.permalink.trim() } : {}),
        notas: plan.notas,
        ...(ts.includes('reel') || !migrado ? { roteiro: roteiroEditado(v) } : {}),
        ...(migrado && ts.includes('carrossel') ? { carrossel: lerCarrossel() } : {}),
        ...(migrado && ts.includes('estatico') ? { estatico: lerEstatico() } : {}),
        ...(migrado && ts.includes('stories') ? { stories: lerStories() } : {}),
        legenda: v.legenda,
        gravacao,
        fontes: linhas(v.fontes),
      });
      await recarregar();
      reabrir(r.id);
      toast('Salvo');
    } catch (e) {
      botao.disabled = false;
      toast(e.message);
    }
  };
}
