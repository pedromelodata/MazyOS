// Início: saudação, o "Criar do zero" e o checklist de hoje. Sem estado próprio.
// 21/10 (Pedro): "no início, deixe apenas o criar do 0 e um checklist de hoje, que caso seja cumprido, abra a sugestão
// de adiantar outros conteúdos". Saíram o próximo passo, os cards do Banco de Ideias e da Biblioteca e as listas de
// próximos e de favoritas. O checklist é o que o cronograma marca pra hoje (dia de Brasília): cada post do dia e os
// stories do dia. Marcar o post é o mesmo "Marcar como postado" do painel (peça de feed só depois da aprovação
// técnica); marcar os stories troca o status deles. Tudo marcado (ou nada marcado pra hoje): aparecem os próximos
// posts que ainda não foram postados, pra adiantar
// 21/10 (Pedro): no topo, o Hero "Notícias de hoje" (noticias.js): as 5 notícias de contabilidade do dia, buscadas às
// 06:00, com o link, o resumo e "como vira conteúdo". A lista fica guardada no noticias.js e só o Hero se redesenha
// quando ela chega; depois dele, o Criar do zero e o checklist de hoje, como antes
import { esc, store, icone, fmtData, navegar, DIAS, api, recarregar, toast, rotuloPeca, blocoInfo, blocoDaPeca, infoAprovacao, travaPostado, hojeBrasilia } from '../core.js';
import * as chat from '../chat.js';
import { objeto3d } from '../efeitos.js';
import { temStories, storiesDoDia, objetivoInfo, abrirStories } from '../stories.js';
import { heroHtml, ligarHero, carregarNoticias, aoAtualizarHero } from '../noticias.js';

const ROTULO_STATUS = { ideia: 'Ideia', roteiro: 'Roteiro', gravado: 'Gravado', editado: 'Editado', publicado: 'Postado' };
// adiantar: primeiro o que ainda está mais cru
const PESO_STATUS = { ideia: 0, roteiro: 1, gravado: 2, editado: 3 };

function criar(opts) {
  if (typeof chat.abrirCriar === 'function') chat.abrirCriar(opts);
  else navegar('#/criar');
}

function dataHoje() {
  const s = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo' });
  return s[0].toUpperCase() + s.slice(1);
}

// o que o cronograma marca pra hoje: os posts (na ordem do dia) e os stories
function itensDeHoje(E) {
  const hoje = hojeBrasilia();
  const posts = (E.reels ?? []).filter((r) => r.data === hoje).sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));
  const sto = temStories() ? storiesDoDia(hoje) : null;
  return [
    ...posts.map((r) => ({ tipo: 'peca', id: r.id, r, feito: r.status === 'publicado' })),
    ...(sto ? [{ tipo: 'stories', id: sto.id, s: sto, feito: sto.status === 'publicado' }] : []),
  ];
}

function itemHtml(it) {
  if (it.tipo === 'stories') {
    const s = it.s;
    const o = objetivoInfo(s.objetivo);
    // 22/10 (Pedro): o story no singular, como o "Story · tema" do calendário, e com a decisão de quem aprovou quando ele
    // foi pra aprovação ("Reprovado por Leonam", "Aprovado com observação por Leonam: pode postar"). Postar não depende dela
    const apv = it.feito ? null : infoAprovacao(s);
    const estado = it.feito ? 'Postado'
      : apv?.estado === 'aprovado' ? `${apv.curto ?? apv.nome}: pode postar` : apv ? apv.curto ?? apv.nome : 'Marque quando postar';
    return `
      <li class="hk-item" data-feito="${it.feito}">
        <input type="checkbox" class="hk-check" data-hk-stories="${esc(s.id)}" ${it.feito ? 'checked' : ''} aria-label="Story postado: ${esc(s.tema)}" />
        <button type="button" class="hk-texto" data-hk-abrir-sto="${esc(s.id)}">
          <strong>Story · ${esc(s.tema)}</strong>
          <small>${[o.nome, estado].filter(Boolean).map(esc).join(' · ')}</small>
        </button>
      </li>`;
  }
  const r = it.r;
  const bl = blocoInfo(blocoDaPeca(r));
  const apv = infoAprovacao(r);
  // peça de feed só vira postada depois da aprovação técnica: até lá, a caixa fica travada e diz o que falta
  const trava = !it.feito && travaPostado(r);
  // 22/10 (Pedro): a decisão com quem decidiu ("Reprovado por Leonam", "Aprovado com observação por Leonam: pode postar")
  const estado = it.feito ? 'Postado'
    : trava ? (apv ? apv.curto ?? apv.nome : 'Falta mandar pra aprovação técnica')
      : apv?.estado === 'aprovado' ? `${apv.curto ?? apv.nome}: pode postar` : ROTULO_STATUS[r.status] ?? r.status;
  return `
    <li class="hk-item" data-feito="${it.feito}">
      <input type="checkbox" class="hk-check" data-hk-peca="${esc(r.id)}" ${it.feito ? 'checked' : ''} ${trava ? `disabled title="${esc(`${estado}. A peça vira postada depois da aprovação.`)}"` : ''} aria-label="Postado: ${esc(r.ideia)}" />
      <a class="hk-texto" href="#/reel/${encodeURIComponent(r.id)}">
        <strong>${esc(rotuloPeca(r, ' + '))} · ${esc(r.ideia)}</strong>
        <small>${[bl?.nome, estado].filter(Boolean).map(esc).join(' · ')}</small>
      </a>
    </li>`;
}

// próximos posts que ainda não foram ao ar, o mais cru primeiro (até 3)
function paraAdiantar(E) {
  const hoje = hojeBrasilia();
  return (E.reels ?? [])
    .filter((r) => r.data && r.data > hoje && r.status !== 'publicado')
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 8)
    .sort((a, b) => (PESO_STATUS[a.status] ?? 9) - (PESO_STATUS[b.status] ?? 9) || a.data.localeCompare(b.data))
    .slice(0, 3)
    .sort((a, b) => a.data.localeCompare(b.data));
}

function adiantarHtml(E, vazio) {
  const lista = paraAdiantar(E);
  const titulo = vazio ? 'Nada marcado pra hoje. Quer adiantar os próximos?' : 'Checklist de hoje cumprido. Quer adiantar os próximos?';
  return `
    <div class="hk-adiantar" role="status">
      <p class="hk-adiantar-titulo">${icone('raio', 16)}${esc(titulo)}</p>
      ${lista.length ? `<ul class="hk-adiantar-lista">${lista.map((r) => {
        const d = new Date(`${r.data}T12:00`);
        return `
          <li>
            <a class="hk-prox" href="#/reel/${encodeURIComponent(r.id)}">
              <span class="hk-dia"><b>${d.getDate()}</b><small>${DIAS[d.getDay()]}</small></span>
              <span class="hk-prox-texto"><strong>${esc(r.ideia)}</strong><small>${esc([rotuloPeca(r, ' + '), blocoInfo(blocoDaPeca(r))?.nome, ROTULO_STATUS[r.status] ?? r.status].filter(Boolean).join(' · '))}</small></span>
              <span class="btn btn-sm">Adiantar ${icone('seta', 14)}</span>
            </a>
          </li>`;
      }).join('')}</ul>` : `<p class="hk-adiantar-vazio">O cronograma não tem nada pela frente. <button type="button" class="crono-link" data-home="criar">Criar do zero</button></p>`}
    </div>`;
}

function checklistHtml(E) {
  const itens = itensDeHoje(E);
  const feitos = itens.filter((x) => x.feito).length;
  const cumprido = itens.length > 0 && feitos === itens.length;
  return `
    <section class="card hk" aria-labelledby="hk-titulo" data-cumprido="${cumprido}">
      <div class="hk-topo">
        <div>
          <h2 id="hk-titulo">Checklist de hoje</h2>
          <small>${esc(fmtData(hojeBrasilia(), { diaSemana: true }))}</small>
        </div>
        ${itens.length ? `<span class="hk-conta" aria-label="${feitos} de ${itens.length} feitos"><b>${feitos}</b>/${itens.length}</span>` : ''}
      </div>
      ${itens.length ? `<div class="hk-barra" aria-hidden="true"><i style="width:${Math.round((feitos / itens.length) * 100)}%"></i></div>
      <ul class="hk-lista">${itens.map(itemHtml).join('')}</ul>` : ''}
      ${!itens.length || cumprido ? adiantarHtml(E, !itens.length) : ''}
    </section>`;
}

export function render(root) {
  const E = store.E;
  // quem está logado é quem a home cumprimenta; sem login (servidor antigo), o nome da config
  const nome = (store.usuario?.nome?.trim().split(/\s+/)[0] || E.config?.nomeUsuario || 'Pedro').trim();

  root.innerHTML = `
    <div class="home">
      <header class="home-topo">
        <div class="home-topo-texto">
          <p class="home-data">${esc(dataHoje())}</p>
          <h1 class="home-saudacao">Bora criar,<br><span>${esc(nome)}.</span></h1>
        </div>
        ${objeto3d('growth', { classe: 'home-objeto', tam: 236 })}
      </header>

      ${heroHtml()}

      <div class="home-principal">
        <button type="button" class="hc hc-criar" data-home="criar">
          <span class="hc-anel" aria-hidden="true"></span>
          <span class="hc-topo"><span class="hc-ico">${icone('raio', 22)}</span></span>
          <span class="hc-corpo">
            <span class="hc-titulo">Criar do zero</span>
          </span>
          <span class="hc-rodape">
            <span class="hc-seta">${icone('seta', 18)}</span>
          </span>
        </button>
        ${checklistHtml(E)}
      </div>
    </div>`;

  ligarHero(root.querySelector('#home-noticias'), { criar });
  // a busca termina depois do desenho: troca só o Hero (o foco que estava nele volta pro mesmo lugar)
  aoAtualizarHero(() => {
    const sec = document.getElementById('home-noticias');
    if (!sec) return;
    const ativo = sec.contains(document.activeElement) ? document.activeElement : null;
    const alvo = ativo?.matches('[data-hn-buscar]') ? '[data-hn-buscar]' : ativo ? '#hn-titulo' : '';
    sec.outerHTML = heroHtml();
    const novo = document.getElementById('home-noticias');
    ligarHero(novo, { criar });
    if (alvo) { const el = novo?.querySelector(alvo); if (el) { if (alvo === '#hn-titulo') el.tabIndex = -1; el.focus({ preventScroll: true }); } }
  });
  carregarNoticias();
  root.querySelectorAll('[data-home="criar"]').forEach((b) => (b.onclick = () => criar()));
  root.querySelectorAll('[data-hk-abrir-sto]').forEach((b) => (b.onclick = () => abrirStories(b.dataset.hkAbrirSto)));
  // marcar: a tela muda na hora e volta se o servidor recusar
  root.querySelectorAll('[data-hk-peca]').forEach((c) => (c.onchange = () => marcar(root, c, 'peca', c.dataset.hkPeca)));
  root.querySelectorAll('[data-hk-stories]').forEach((c) => (c.onchange = () => marcar(root, c, 'stories', c.dataset.hkStories)));
}

async function marcar(root, caixa, tipo, id) {
  const E = store.E;
  const item = tipo === 'peca' ? E.reels.find((r) => r.id === id) : (E.stories ?? []).find((s) => s.id === id);
  if (!item) return;
  const antes = item.status;
  // desmarcar devolve o post pra "editado" e os stories pra "pronto" (o passo antes de postar)
  const status = caixa.checked ? 'publicado' : tipo === 'peca' ? 'editado' : 'pronto';
  item.status = status;
  render(root);
  try {
    if (tipo === 'peca') await api('PUT', `/api/reels/${encodeURIComponent(id)}`, { status });
    else await api('PUT', `/api/stories/${encodeURIComponent(id)}/status`, { status });
  } catch (e) {
    item.status = antes;
    render(root);
    toast(`Não deu pra marcar: ${e.message}`);
    return;
  }
  const itens = itensDeHoje(E);
  if (status === 'publicado' && itens.length && itens.every((x) => x.feito)) toast('Checklist de hoje cumprido');
  recarregar().catch(() => {});
}
