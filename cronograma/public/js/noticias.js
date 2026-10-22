// 21/10 (Pedro): "Na aba de início me traga todos os dias às 06:00 5 principais notícias de sites de contabilidade, os
// mais essenciais e os mais respeitados e verídicos, deixe eles sempre em um Hero no início trazendo essas notícias de
// forma resumida, o link delas e como podem virar conteúdo. Capricha!"
// O Hero "Notícias de hoje" do Início. As notícias vêm de GET /api/noticias (o servidor busca às 06:00 de Brasília):
// { dia, geradoEm, itens: [{ id, titulo, resumo, link, fonte, publicadoEm, comoVirarConteudo, bloco, pilar }], erro, ia }.
// A primeira vem em destaque; no desktop é uma grade, no celular um carrossel com scroll-snap. Cada notícia tem o link
// (nova aba), o resumo, "Como vira conteúdo" e "Criar post com essa": a notícia vira uma ideia no Banco de Ideias
// (com o link nas fontes) e o Ateliê abre com ela, que é o único ponto de partida que o criar aceita (ideiaId).
// Admin e Gerente de Marketing têm "Buscar agora" (POST /api/noticias/atualizar).
// A lista fica guardada aqui: o Início redesenha a cada recarga do estado e não pode buscar de novo toda vez.
import { esc, store, api, recarregar, toast, icone, pillBloco, pilarInfo, tipoDoPilar, papelAtual, hojeBrasilia, ideia } from './core.js';

const est = { dados: null, erro: null, carregando: false, buscando: false, em: 0, prom: null };
const VALIDADE = 10 * 60 * 1000;
const tem = (v) => Boolean(String(v ?? '').trim());
export const podeBuscar = () => ['admin', 'gerente'].includes(papelAtual());

const fusoBR = { timeZone: 'America/Sao_Paulo' };
const horaBR = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('pt-BR', { ...fusoBR, hour: '2-digit', minute: '2-digit' });
};
const diaBR = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('sv-SE', fusoBR);
};
const ddmm = (iso) => (/^\d{4}-\d{2}-\d{2}/.test(iso ?? '') ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '');
const ontem = () => {
  const d = new Date(`${hojeBrasilia()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};
// "hoje, 05:12" · "ontem, 19:40" · "18/10"
function quandoPublicou(iso) {
  if (!iso) return '';
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : diaBR(iso);
  if (!dia) return '';
  const hora = /T\d/.test(iso) ? horaBR(iso) : '';
  if (dia === hojeBrasilia()) return hora ? `hoje, ${hora}` : 'hoje';
  if (dia === ontem()) return hora ? `ontem, ${hora}` : 'ontem';
  return ddmm(dia);
}
// o link só vale com http(s): o resto vira texto
const linkSeguro = (u) => (/^https?:\/\//i.test(String(u ?? '').trim()) ? String(u).trim() : '');
const dominio = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

// a mensagem que o servidor grava quando falta a chave do Claude (server/noticias.mjs, MSG_SEM_IA)
const MSG_SEM_IA = 'Falta ligar a IA neste servidor: a chave do Claude.';

// sem IA no servidor: o resumo vem do próprio site e o "como vira conteúdo" fica pra quando a IA for ligada
function semIA(d) {
  if (!d) return false;
  if (d.ia === false || d.ia?.ligada === false) return true;
  const itens = d.itens ?? [];
  return itens.length > 0 && itens.every((n) => !tem(n.comoVirarConteudo));
}

// ── Busca ────────────────────────────────────────────────────────────────
let aoMudarHero = null;
function avisar() { try { aoMudarHero?.(); } catch (e) { console.error(e); } }

export function carregarNoticias({ forcar = false } = {}) {
  // a virada do dia só se arma quando o Início pede a lista (nada roda antes, nem nos testes sem navegador)
  ouvirAba();
  agendarVirada();
  if (est.prom) return est.prom;
  const velha = Date.now() - est.em > VALIDADE;
  const outroDia = est.dados && est.dados.dia && est.dados.dia !== hojeBrasilia();
  // 21/10 (Pedro): a lista guardada diz "rodando" e ninguém está conferindo (o Início saiu da tela no meio da busca):
  // lê de novo, senão o Hero fica em "Buscando" até a validade de 10 min vencer
  const rodandoSemVigia = Boolean(est.dados?.rodando) && !relogio;
  if (!forcar && (est.dados || est.erro) && !velha && !outroDia && !rodandoSemVigia) return Promise.resolve(est);
  est.carregando = !est.dados;
  est.prom = api('GET', '/api/noticias')
    .then((d) => { est.dados = d ?? null; est.erro = null; })
    .catch((e) => { est.erro = e; })
    .finally(() => { est.carregando = false; est.em = Date.now(); est.prom = null; avisar(); vigiar(); });
  return est.prom;
}

const naTela = () => Boolean(document.getElementById('home-noticias'));

// a busca das 06:00 (ou a do "Buscar agora" que passou de 25 s) ainda roda no servidor: pergunta de novo a cada 8 s,
// só com o Início aberto. 21/10 (Pedro): com o Início fora da tela, não busca, mas deixa a lista vencida pra que a
// volta ao Início leia de novo
let relogio = 0;
function vigiar() {
  clearTimeout(relogio);
  relogio = 0;
  if (!est.dados?.rodando) return;
  relogio = setTimeout(() => {
    relogio = 0;
    if (naTela()) carregarNoticias({ forcar: true });
    else est.em = 0;
  }, 8000);
}

// 21/10 (Pedro): a aba do Início fica aberta de um dia pro outro (o PC do escritório). À meia-noite (o "hoje" vira
// "ontem") e às 06:01 de Brasília (a busca das 06:00 já começou), lê de novo; e quando a aba volta a aparecer (o PC
// dormiu, o relógio atrasou), confere se a lista ainda é de hoje. Só o Hero se redesenha (aoMudarHero), e só com o
// Início na tela; fora dele, a lista fica vencida pra próxima vez que ele abrir
const MARCOS_BR = [5, 6 * 3600 + 60]; // 00:00:05 e 06:01:00, em segundos do dia de Brasília
const DIA_S = 86_400;
const relogioBR = new Intl.DateTimeFormat('en-US', { ...fusoBR, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit' });
function segundosBR(agora = new Date()) {
  const p = Object.fromEntries(relogioBR.formatToParts(agora).map((x) => [x.type, x.value]));
  return (Number(p.hour) % 24) * 3600 + Number(p.minute) * 60 + Number(p.second);
}
let relogioDia = 0;
function agendarVirada() {
  if (relogioDia) return;
  const agora = segundosBR();
  const falta = Math.min(...MARCOS_BR.map((m) => ((m - agora + DIA_S) % DIA_S) || DIA_S));
  relogioDia = setTimeout(() => {
    relogioDia = 0;
    if (naTela()) carregarNoticias({ forcar: true });
    else { est.em = 0; agendarVirada(); }
  }, falta * 1000 + 500);
}
let ouvindoAba = false;
function ouvirAba() {
  if (ouvindoAba) return;
  ouvindoAba = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    // o relógio pode ter dormido junto com o PC: arma de novo pela hora de agora
    clearTimeout(relogioDia);
    relogioDia = 0;
    if (naTela()) carregarNoticias();
    else agendarVirada();
  });
}

async function buscarAgora() {
  if (buscando()) return;
  est.buscando = true;
  avisar();
  try {
    const d = await api('POST', '/api/noticias/atualizar', {});
    // a rota pode devolver a lista nova ou só o ok: sem a lista, lê de novo
    if (Array.isArray(d?.itens)) { est.dados = d; est.erro = null; est.em = Date.now(); }
    else { est.buscando = false; await carregarNoticias({ forcar: true }); }
    const n = est.dados?.itens?.length ?? 0;
    // 202: a busca passou de 25 s e segue no servidor (o Hero mostra "buscando" e confere sozinho)
    if (d?.rodando) toast('A busca segue no servidor: as notícias aparecem aqui quando terminar');
    else toast(est.dados?.erro ? est.dados.erro : n ? `${n} ${n === 1 ? 'notícia' : 'notícias'} de agora` : 'Nenhuma notícia nova agora');
  } catch (e) {
    toast(e.message);
  } finally {
    est.buscando = false;
    avisar();
    vigiar();
  }
}

// ── Criar post com essa ─────────────────────────────────────────────────
// a notícia vira (uma vez só) uma ideia do banco com o resumo, o "como vira conteúdo" e o link nas fontes; o Ateliê
// abre com ela (o agente lê a ideia de origem). A mesma notícia de novo reaproveita a ideia
async function criarComNoticia(n, botao, criar) {
  const link = linkSeguro(n.link);
  const ja = link ? (store.E?.ideias ?? []).find((i) => (i.fontes ?? []).some((f) => String(f).includes(link))) : null;
  if (ja) { criar({ ideiaId: ja.id }); return; }
  const antes = botao.innerHTML;
  botao.disabled = true;
  botao.setAttribute('aria-busy', 'true');
  botao.innerHTML = '<span class="dt-spinner" aria-hidden="true"></span> Abrindo';
  try {
    const tipo = tipoDoPilar(n.pilar);
    const nova = await api('POST', '/api/ideias', {
      titulo: String(n.titulo ?? '').trim(),
      descricao: [tem(n.resumo) ? n.resumo.trim() : '', tem(n.comoVirarConteudo) ? `Como vira conteúdo: ${n.comoVirarConteudo.trim()}` : ''].filter(Boolean).join('\n\n'),
      ...(tipo ? { tipo } : {}),
      fontes: [[n.fonte, link || n.link].filter(tem).join(': ')].filter(tem),
      notas: `Veio das Notícias de hoje (${ddmm(est.dados?.dia) || ddmm(hojeBrasilia())}). Número, prazo e regra só entram na peça se estiverem no FATOS.md, com o id do fato nas fontes.`,
      origem: 'noticia',
      referencia: null,
      favorita: false,
      reelId: null,
    });
    await recarregar();
    if (nova?.id && ideia(nova.id)) criar({ ideiaId: nova.id });
    else criar({});
  } catch (e) {
    toast(`Não deu pra abrir o criar com a notícia: ${e.message}`);
  } finally {
    if (botao.isConnected) { botao.disabled = false; botao.removeAttribute('aria-busy'); botao.innerHTML = antes; }
  }
}

// ── Desenho ──────────────────────────────────────────────────────────────
function cartaoHtml(n, i, total) {
  const link = linkSeguro(n.link);
  const fonte = tem(n.fonte) ? n.fonte.trim() : dominio(link);
  const quando = quandoPublicou(n.publicadoEm);
  const pl = pilarInfo(n.pilar);
  const idTitulo = `hn-t-${i}`;
  const titulo = esc(String(n.titulo ?? '').trim() || 'Sem título');
  return `
    <li class="hn-item${i === 0 ? ' hn-destaque' : ''}" data-hn-i="${i}">
      <article class="hn-cartao" aria-labelledby="${idTitulo}" aria-roledescription="notícia">
        <div class="hn-fonte">
          <span class="hn-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <span class="hn-fonte-nome">${esc(fonte || 'Fonte')}</span>
          ${quando ? `<span class="hn-quando">${esc(quando)}</span>` : ''}
          <span class="sr-only">, notícia ${i + 1} de ${total}</span>
        </div>
        <h3 class="hn-titulo" id="${idTitulo}">${link
          ? `<a href="${esc(link)}" target="_blank" rel="noopener noreferrer">${titulo}<span class="hn-externo" aria-hidden="true">${icone('externo', i === 0 ? 18 : 14)}</span><span class="sr-only"> (abre o site em outra aba)</span></a>`
          : titulo}</h3>
        ${tem(n.resumo) ? `<p class="hn-resumo">${esc(n.resumo.trim())}</p>` : ''}
        ${tem(n.comoVirarConteudo) ? `
        <div class="hn-como">
          <span class="hn-como-rot">${icone('lampada', 14)}Como vira conteúdo</span>
          <p>${esc(n.comoVirarConteudo.trim())}</p>
        </div>` : ''}
        <div class="hn-pe">
          <div class="hn-tags">${n.bloco ? pillBloco(n.bloco, { tam: 12 }) : ''}${pl ? `<span class="hn-pilar">Pilar ${esc(`${pl.id} · ${pl.nome}`)}</span>` : ''}</div>
          <button type="button" class="btn btn-sm hn-criar" data-hn-criar="${i}">${icone('raio', 14)}Criar post com essa</button>
        </div>
      </article>
    </li>`;
}

function esqueletoHtml() {
  const cartao = (dest) => `
    <li class="hn-item${dest ? ' hn-destaque' : ''}" aria-hidden="true">
      <div class="hn-cartao hn-esq">
        <span class="fx-esq hn-esq-linha" style="width:38%"></span>
        <span class="fx-esq hn-esq-titulo"></span>
        <span class="fx-esq hn-esq-titulo" style="width:72%"></span>
        <span class="fx-esq hn-esq-linha"></span>
        <span class="fx-esq hn-esq-linha" style="width:86%"></span>
        <span class="fx-esq hn-esq-caixa"></span>
      </div>
    </li>`;
  return `<ol class="hn-lista" aria-busy="true">${cartao(true)}${cartao()}${cartao()}${cartao()}${cartao()}</ol><span class="sr-only" role="status">Carregando as notícias</span>`;
}

function estadoHtml({ icone: ico, titulo, texto, acao = '' }) {
  return `
    <div class="hn-estado">
      <span class="hn-estado-ico">${icone(ico, 20)}</span>
      <div><strong>${esc(titulo)}</strong>${texto ? `<p>${esc(texto)}</p>` : ''}</div>
      ${acao}
    </div>`;
}

// buscando: o "Buscar agora" desta tela ou a busca que o servidor já está fazendo (a das 06:00)
const buscando = () => est.buscando || Boolean(est.dados?.rodando);
const botaoBuscar = (classe = 'btn btn-sm') => (podeBuscar()
  ? `<button type="button" class="${classe}" data-hn-buscar title="Buscar as notícias agora" ${buscando() ? 'aria-disabled="true" aria-busy="true"' : ''}>${buscando() ? '<span class="dt-spinner" aria-hidden="true"></span><span class="hn-buscar-txt">Buscando</span>' : `${icone('gerar', 15)}<span class="hn-buscar-txt">Buscar agora</span>`}</button>`
  : '');

// as fontes que a busca consulta (as que não responderam ficam marcadas): é a prova de onde as notícias vêm
function fontesHtml(d) {
  const fs = (Array.isArray(d?.fontes) ? d.fontes : []).filter((f) => tem(f?.nome));
  if (!fs.length) return '';
  const fora = fs.filter((f) => f.ok === false).map((f) => f.nome);
  return `<p class="hn-fontes">${icone('livro', 13)}<span>Fontes: ${esc(fs.map((f) => f.nome).join(' · '))}${fora.length ? `. Não responderam hoje: ${esc(fora.join(', '))}.` : ''}</span></p>`;
}

export function heroHtml() {
  const d = est.dados;
  const itens = (d?.itens ?? []).filter((n) => tem(n?.titulo)).slice(0, 5);
  const hoje = hojeBrasilia();
  const doDia = d?.dia || (d?.geradoEm ? diaBR(d.geradoEm) : '');
  const deOutroDia = itens.length && doDia && doDia !== hoje;
  const hora = d?.geradoEm ? horaBR(d.geradoEm) : '';
  const comIA = !semIA(d);

  let sub;
  // de outro dia: antes das 06:00 é normal (as de hoje ainda vão chegar); depois, a busca de hoje falhou ou atrasou
  const antesDas6 = Number(new Date().toLocaleTimeString('pt-BR', { ...fusoBR, hour: '2-digit', hour12: false }).slice(0, 2)) < 6;
  const titulo = deOutroDia ? `Notícias de ${doDia === ontem() ? 'ontem' : ddmm(doDia)}` : 'Notícias de hoje';
  if (d?.rodando && itens.length) sub = 'Buscando as de agora. A lista troca quando a busca terminar';
  else if (deOutroDia) sub = antesDas6 ? 'As de hoje chegam às 06:00' : 'As de hoje ainda não chegaram';
  else if (itens.length && hora) sub = `Atualizado às ${hora}`;
  else sub = '';

  let corpo;
  // antes da primeira resposta (e enquanto ela não chega) é o esqueleto, nunca o "chegam às 06:00"
  if (!d && !est.erro) corpo = esqueletoHtml();
  else if (est.erro && !d) corpo = estadoHtml({
    icone: 'alerta', titulo: 'Não deu pra trazer as notícias', texto: est.erro.message,
    acao: `<button type="button" class="btn btn-sm" data-hn-tentar>Tentar de novo</button>`,
  });
  else if (!itens.length && d?.rodando) corpo = `${esqueletoHtml()}<p class="hn-aviso" role="status">${icone('relogio', 15)}<span>Buscando as notícias de hoje nos sites de contabilidade. Leva alguns minutos.</span></p>`;
  else if (!itens.length) corpo = estadoHtml(d?.erro
    ? { icone: 'alerta', titulo: 'A busca de hoje não trouxe notícia', texto: d.erro, acao: botaoBuscar() }
    : { icone: 'relogio', titulo: 'As notícias chegam todo dia às 06:00', texto: 'De sites de contabilidade respeitados, resumidas, com o link e o jeito de virar post.', acao: botaoBuscar() }) + fontesHtml(d);
  else {
    // 21/10 (Pedro): só a falta da chave (a mensagem exata do servidor) é "Sem IA neste servidor", e aí o aviso já diz o
    // que o erro diz: não sai duas vezes. Falha passageira da IA com a chave ligada aparece como o servidor escreveu
    // (ele já diz que o resumo é do próprio site e quando tenta de novo); sem erro escrito, um aviso neutro
    const erro = String(d?.erro ?? '').trim();
    const semChave = erro.includes(MSG_SEM_IA);
    const avisoIA = comIA ? ''
      : semChave ? 'Sem IA neste servidor: o resumo vem do próprio site. O "como vira conteúdo" volta quando a IA for ligada.'
        : erro ? '' : 'A IA não resumiu estas: o resumo vem do próprio site e o "como vira conteúdo" fica pra próxima busca.';
    corpo = `
    ${avisoIA ? `<p class="hn-aviso" role="note">${icone('info', 15)}<span>${esc(avisoIA)}</span></p>` : ''}
    ${erro && !semChave ? `<p class="hn-aviso" role="note">${icone('alerta', 15)}<span>${esc(erro)}</span></p>` : ''}
    <ol class="hn-lista" id="hn-lista" tabindex="-1">${itens.map((n, i) => cartaoHtml(n, i, itens.length)).join('')}</ol>
    ${itens.length > 1 ? `<div class="hn-pontos" aria-hidden="true">${itens.map((_, i) => `<i data-hn-ponto="${i}"${i === 0 ? ' data-ativo' : ''}></i>`).join('')}</div>` : ''}
    ${fontesHtml(d)}`;
  }

  return `
    <section class="hn" aria-labelledby="hn-titulo" id="home-noticias">
      <header class="hn-topo">
        <div class="hn-topo-texto">
          <h2 id="hn-titulo">${esc(titulo)}</h2>
          ${sub ? `<p class="hn-sub">${esc(sub)}</p>` : ''}
        </div>
        ${itens.length ? botaoBuscar('btn btn-sm btn-fantasma hn-buscar') : ''}
      </header>
      ${corpo}
    </section>`;
}


// liga os botões e o carrossel do celular (o ponto ativo segue a rolagem)
export function ligarHero(sec, { criar }) {
  if (!sec) return;
  const itens = (est.dados?.itens ?? []).filter((n) => tem(n?.titulo)).slice(0, 5);
  sec.querySelectorAll('[data-hn-buscar]').forEach((b) => (b.onclick = buscarAgora));
  sec.querySelectorAll('[data-hn-tentar]').forEach((b) => (b.onclick = () => { est.erro = null; carregarNoticias({ forcar: true }); avisar(); }));
  sec.querySelectorAll('[data-hn-criar]').forEach((b) => (b.onclick = () => {
    const n = itens[Number(b.dataset.hnCriar)];
    if (n) criarComNoticia(n, b, criar);
  }));
  const lista = sec.querySelector('#hn-lista');
  const pontos = [...sec.querySelectorAll('[data-hn-ponto]')];
  if (lista && pontos.length) {
    let quadro = 0;
    lista.addEventListener('scroll', () => {
      if (quadro) return;
      quadro = requestAnimationFrame(() => {
        quadro = 0;
        const cards = [...lista.children];
        // posição de cada cartão a partir do primeiro (o offsetParent pode ser outro elemento)
        const zero = cards[0]?.offsetLeft ?? 0;
        const meio = lista.scrollLeft + lista.clientWidth / 2;
        let ativo = 0;
        cards.forEach((c, i) => { if (c.offsetLeft - zero <= meio) ativo = i; });
        pontos.forEach((p, i) => p.toggleAttribute('data-ativo', i === ativo));
      });
    }, { passive: true });
  }
}

// o Início chama com a função que redesenha só o Hero quando a busca termina
export function aoAtualizarHero(fn) { aoMudarHero = fn; }
export const estadoNoticias = () => est;
