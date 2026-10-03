// Vídeos prontos (02/10): os vídeos finais da pasta marketing/final, um cartão por proposta (o nome da pasta sem
// a data e a data por extenso), com os players, o Baixar e o link pra peça do cronograma que usa os vídeos. Cada
// player mostra a capa que o servidor faz (a.capa) e só lê o vídeo no play (videos-finais.js, cartaoVideo).
// Dados de GET /api/videos (server/videos.mjs), guardados aqui no módulo. A vista redesenha a cada recarga do
// estado: com a mesma lista, os players ficam como estão (o vídeo que estiver tocando continua tocando).
// A lista se renova ao voltar pra tela depois de um minuto e no botão Atualizar.
import { esc, store, api, icone, fmtData, toast, reel as reelDoEstado } from '../core.js';
import { objeto3d, esqueletoCards } from '../efeitos.js';
import { abrirStories } from '../stories.js';
import { avisoComum, avisoHtml, cartaoVideo, ligarPlayers, videosNoAr } from '../videos-finais.js';

const VELHA_MS = 60_000;
const cache = { dados: null, em: 0, carregando: false, erro: '', servidorAntigo: false, avisar: false };
let ultimo = null;
let ultimoCorpo = '';

const plural = (n, um, varios) => `${n.toLocaleString('pt-BR')} ${n === 1 ? um : varios}`;
const chave = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const ROTULO_STATUS = { ideia: 'Ideia', roteiro: 'Roteiro', gravado: 'Gravado', editado: 'Editado', publicado: 'Publicado', pronto: 'Pronto' };

// "Quarta, 14 de outubro de 2026" (o mesmo jeito do painel dos stories, com o ano)
const DIAS_LONGOS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
function dataLonga(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ''));
  if (!m) return 'Sem data';
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return `${DIAS_LONGOS[d.getDay()]}, ${d.getDate()} de ${d.toLocaleDateString('pt-BR', { month: 'long' })} de ${d.getFullYear()}`;
}

async function carregar() {
  cache.carregando = true;
  try {
    cache.dados = await api('GET', '/api/videos');
    cache.em = Date.now();
    cache.erro = '';
    cache.servidorAntigo = false;
  } catch (e) {
    // servidor que ainda não reiniciou com esta versão não tem a rota
    cache.servidorAntigo = e.status === 404;
    cache.erro = e.message || 'erro desconhecido';
    if (cache.avisar) toast(`Não consegui atualizar a lista: ${cache.erro}`);
    cache.avisar = false;
  }
  cache.carregando = false;
  if (ultimo?.isConnected && location.hash.startsWith('#/videos')) render(ultimo);
}

// a peça do cronograma, com o que o estado tem de mais novo (título e status podem ter mudado na tela)
function pecaHtml(p, nomeProposta) {
  if (p.tipo === 'stories') {
    const s = (store.E?.stories ?? []).find((x) => x.id === p.id);
    if (!s) return '';
    return `
      <button type="button" class="vp-peca" data-vp-stories="${esc(s.id)}">
        <span class="pill status-reel" data-st="${esc(s.status)}">${esc(ROTULO_STATUS[s.status] ?? s.status)}</span>
        <span class="vp-peca-texto">Stories do dia ${esc(fmtData(s.data))} no cronograma</span>${icone('chevron-dir', 16)}
      </button>`;
  }
  const r = reelDoEstado(p.id);
  if (!r) return '';
  const titulo = chave(r.ideia) === chave(nomeProposta) ? '' : `: ${r.ideia}`;
  return `
    <a class="vp-peca" href="#/reel/${encodeURIComponent(r.id)}">
      <span class="pill status-reel" data-st="${esc(r.status)}">${esc(ROTULO_STATUS[r.status] ?? r.status)}</span>
      <span class="vp-peca-texto">${r.data ? `Reel de ${esc(fmtData(r.data))}` : 'Reel sem data'}${titulo ? esc(titulo) : ' no cronograma'}</span>${icone('chevron-dir', 16)}
    </a>`;
}

function propostaHtml(p, i) {
  const lista = p.arquivos.map((a) => {
    const uso = a.pecas?.[0];
    return { arquivo: a.arquivo, rotulo: uso?.rotulo ?? '', aviso: uso?.aviso ?? '', tamanho: a.tamanho, capa: a.capa };
  });
  const comum = avisoComum(lista);
  const pecas = (p.pecas ?? []).map((x) => pecaHtml(x, p.nome)).filter(Boolean);
  return `
    <section class="card vp-proposta" aria-labelledby="vp-titulo-${i}">
      <header class="vp-cab">
        <div class="vp-titulos">
          <p class="vp-data">${esc(p.data ? dataLonga(p.data) : 'Sem data')}</p>
          <h2 id="vp-titulo-${i}">${esc(p.nome)}</h2>
        </div>
        <div class="vp-pecas">${pecas.length ? pecas.join('') : '<span class="vp-fora">Fora do cronograma</span>'}</div>
      </header>
      ${avisoHtml(comum)}
      <div class="vf-grade">${lista.map((v) => cartaoVideo(v, { aviso: !comum, tamanho: v.tamanho, capa: v.capa })).join('')}</div>
    </section>`;
}

function faltandoHtml(faltando) {
  if (!faltando?.length) return '';
  const itens = faltando.map((f) => {
    const onde = f.tipo === 'stories' ? 'Stories do dia' : 'Reel';
    return `<li><b>${esc(String(f.arquivo).split('/').pop())}</b> · ${esc(onde)}: ${esc(f.titulo || 'sem título')}</li>`;
  }).join('');
  return `
    <div class="aviso vp-faltando" role="status">
      ${icone('alerta', 18)}
      <div><strong>${faltando.length === 1 ? 'Um vídeo ligado a uma peça não está' : `${faltando.length} vídeos ligados a peças não estão`} na pasta de vídeos finais</strong><ul>${itens}</ul></div>
    </div>`;
}

function vazioHtml(titulo, texto, botao = '') {
  return `
    <div class="card vazio">
      <span class="vazio-ico">${icone('video', 22)}</span>
      <strong>${esc(titulo)}</strong>
      ${texto ? `<p>${esc(texto)}</p>` : ''}
      ${botao}
    </div>`;
}

function corpoHtml() {
  const d = cache.dados;
  if (!d) {
    if (cache.servidorAntigo || !videosNoAr()) return vazioHtml('A lista de vídeos ainda não está no ar', 'Ela aparece quando o servidor da Gestão de Marketing for reiniciado com esta versão.');
    if (cache.erro) return vazioHtml('Não consegui ler os vídeos', cache.erro, '<button type="button" class="btn btn-sm" data-vp-atualizar>Tentar de novo</button>');
    return `<p class="vp-carregando" role="status">Lendo a pasta dos vídeos finais…</p>${esqueletoCards(3)}`;
  }
  if (!d.pastaExiste) return vazioHtml('A pasta dos vídeos finais não foi encontrada', 'Confira no computador do servidor se a pasta de vídeos finais existe.');
  if (!d.propostas?.length) return vazioHtml('Nenhum vídeo pronto ainda', 'Quando um vídeo final entrar na pasta de vídeos finais, ele aparece aqui.');
  return `${faltandoHtml(d.faltando)}<div class="vp-lista">${d.propostas.map(propostaHtml).join('')}</div>`;
}

function subtitulo() {
  const ps = cache.dados?.propostas;
  if (!ps?.length) return 'A última versão de cada vídeo, por proposta.';
  const n = ps.reduce((t, p) => t + p.arquivos.length, 0);
  return `A última versão de cada vídeo, por proposta: ${plural(ps.length, 'proposta', 'propostas')} e ${plural(n, 'vídeo', 'vídeos')}.`;
}

export function render(root) {
  ultimo = root;
  const velha = cache.dados && Date.now() - cache.em > VELHA_MS;
  // servidor de antes da versão 2 da área: a tela avisa e não pede vídeo nenhum
  if (videosNoAr() && (!cache.dados || velha) && !cache.carregando && !cache.erro) carregar();
  const corpo = corpoHtml();
  // mesma lista e a tela já desenhada: só o botão acompanha (o vídeo tocando continua)
  if (corpo === ultimoCorpo && root.querySelector('.vp')) {
    root.querySelectorAll('[data-vp-atualizar]').forEach((b) => { b.disabled = cache.carregando; });
    if (cache.avisar && !cache.carregando) { cache.avisar = false; toast('A lista já estava em dia'); }
    return;
  }
  if (cache.avisar && !cache.carregando) { cache.avisar = false; toast('Lista atualizada'); }
  ultimoCorpo = corpo;
  root.innerHTML = `
    <div class="vp">
      <header class="cabecalho-pagina">
        <div>
          <h1>Vídeos prontos</h1>
          <p>${esc(subtitulo())}</p>
        </div>
        ${videosNoAr() ? `<div class="acoes"><button type="button" class="btn btn-sm" data-vp-atualizar ${cache.carregando ? 'disabled' : ''}>${icone('gerar', 14)}Atualizar</button></div>` : ''}
        ${objeto3d('reels')}
      </header>
      ${corpo}
    </div>`;
  ligarPlayers(root, { adiar: true });
  root.querySelectorAll('[data-vp-atualizar]').forEach((b) => (b.onclick = () => {
    if (cache.carregando || !videosNoAr()) return;
    cache.erro = '';
    cache.avisar = Boolean(cache.dados);
    b.disabled = true;
    carregar();
  }));
  root.querySelectorAll('[data-vp-stories]').forEach((b) => (b.onclick = () => abrirStories(b.dataset.vpStories)));
}
