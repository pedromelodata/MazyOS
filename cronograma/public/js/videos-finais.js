// Vídeo final (02/10): o player de cada vídeo pronto da pasta de vídeos finais (marketing/final), usado no detalhe
// do reel, no painel dos stories do dia e na página "Vídeos prontos". O arquivo vem do próprio app (/videos/...,
// só com login). <video controls preload="metadata" playsinline>: até alguém dar o play, só o começo do arquivo
// é lido. Um vídeo toca por vez; o deitado (16:9) ocupa duas colunas quando cabe; arquivo que não abre vira um
// aviso no lugar do player (saiu da pasta, sessão vencida ou formato que o navegador não toca).
// Dados: item.videos = [{ arquivo, rotulo, aviso? }] (SPEC §3.6). Aviso igual em todos aparece uma vez só.
// Na página "Vídeos prontos" o player tem capa (um quadro do vídeo em JPEG, feito pelo servidor) e preload="none":
// abrir e rolar a página só baixa as capas, e cada vídeo só é lido no play. Com preload="metadata" o Edge lê cada
// vídeo até ter o bastante pra tocar (de 1 a 12 MB cada; a página inteira passava de 50 MB). No detalhe do reel e
// nos stories, preload="metadata": são poucos vídeos e o servidor entrega em pedaços (server/videos.mjs).
// Tudo isso só liga com o servidor da versão 2 da área (store.E.videosFinais): o de antes caía com pedido cortado.
import { esc, icone, sessaoCaiu, store } from './core.js';

const VERSAO_MINIMA = 2;
export const videosNoAr = () => Number(store.E?.videosFinais) >= VERSAO_MINIMA;
export const videosDe = (item) => (videosNoAr() && Array.isArray(item?.videos) ? item.videos.filter((v) => v && typeof v.arquivo === 'string' && v.arquivo) : []);
export const temVideos = (item) => videosDe(item).length > 0;
// cada pedaço do caminho codificado: acento, espaço, vírgula e parêntese dos nomes das pastas
export const urlVideo = (arquivo) => '/videos/' + String(arquivo).split('/').map(encodeURIComponent).join('/');
const nomeArquivo = (arquivo) => String(arquivo ?? '').split('/').pop();

// tamanho como o Windows mostra nas propriedades do arquivo (1 MB = 1024 KB)
export function tamanhoArquivo(bytes) {
  const n = Number(bytes);
  if (bytes == null || !Number.isFinite(n) || n < 0) return 'sem dado';
  const fmt = (x) => x.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  if (n >= 1024 ** 3) return `${fmt(n / 1024 ** 3)} GB`;
  if (n >= 1024 ** 2) return `${fmt(n / 1024 ** 2)} MB`;
  return `${Math.max(1, Math.round(n / 1024)).toLocaleString('pt-BR')} KB`;
}

// aviso igual em todos os vídeos (ex.: trocar a trilha antes de postar): uma vez só, em cima da grade
export function avisoComum(lista) {
  const avisos = lista.map((v) => String(v?.aviso ?? '').trim());
  return avisos.length > 1 && avisos[0] && avisos.every((a) => a === avisos[0]) ? avisos[0] : '';
}
export const avisoHtml = (texto) => (String(texto ?? '').trim() ? `<p class="vf-aviso">${icone('alerta', 15)}<span>${esc(texto)}</span></p>` : '');

// a marca pequena do calendário (chip da peça e linha dos stories do dia)
export const marcaVideo = (tam = 8) => `<span class="vf-marca" title="Vídeo final pronto">${icone('play', tam)}<span class="sr-only">, vídeo final pronto</span></span>`;

// um vídeo: o player e, embaixo, o rótulo, o nome do arquivo (e o tamanho, quando a lista do servidor deu) e o Baixar.
// capa: o endereço da capa (página "Vídeos prontos"): o player fica com preload="none" e mostra a capa até o play
export function cartaoVideo(v, { aviso = true, tamanho, capa } = {}) {
  const url = urlVideo(v.arquivo);
  const nome = nomeArquivo(v.arquivo);
  const rotulo = String(v.rotulo ?? '').trim() || nome;
  const meta = [rotulo !== nome ? nome : '', tamanho !== undefined ? tamanhoArquivo(tamanho) : ''].filter(Boolean).join(' · ');
  const carga = capa ? `preload="none" data-capa="${esc(capa)}"` : 'preload="metadata"';
  return `
    <figure class="vf-card">
      <div class="vf-tela">
        <video class="vf-video" controls ${carga} playsinline data-src="${esc(url)}" aria-label="${esc(`Vídeo final: ${rotulo}`)}"></video>
      </div>
      <figcaption class="vf-legenda">
        <span class="vf-rotulo">${esc(rotulo)}</span>
        <a class="btn btn-sm btn-fantasma vf-baixar" href="${esc(url)}" download="${esc(nome)}" aria-label="${esc(`Baixar ${rotulo}`)}" title="Baixar o arquivo">${icone('baixar', 14)}<span class="vf-baixar-texto">Baixar</span></a>
        ${meta ? `<span class="vf-meta">${esc(meta)}</span>` : ''}
      </figcaption>
      ${aviso ? avisoHtml(v.aviso) : ''}
    </figure>`;
}

// a grade de vídeos de uma peça ou proposta; tamanhoDe(v) devolve os bytes do arquivo, quando houver
export function gradeVideos(lista, { tamanhoDe } = {}) {
  const comum = avisoComum(lista);
  return `${avisoHtml(comum)}<div class="vf-grade">${lista.map((v) => cartaoVideo(v, { aviso: !comum, tamanho: tamanhoDe?.(v) })).join('')}</div>`;
}

// a pílula do cabeçalho do painel que leva até a seção (no celular o Planejamento ocupa a primeira tela)
export const pilulaVideoFinal = (item) => (temVideos(item)
  ? `<button type="button" class="pill vf-pilula" data-ir-video aria-label="Ir pro vídeo final">${icone('play', 11)}Vídeo final</button>`
  : '');

// a seção "Vídeo final" do detalhe do reel e do painel dos stories (vazia quando a peça não tem vídeo)
export function secaoVideoFinal(item) {
  const lista = videosDe(item);
  if (!lista.length) return '';
  return `
    <section class="bloco vf-secao">
      <div class="bloco-titulo">Vídeo final${lista.length > 1 ? `<span class="dt-contador">${lista.length} versões</span>` : ''}</div>
      ${gradeVideos(lista)}
    </section>`;
}

// ── comportamento dos players (chamar depois de pôr o html na tela) ─────────
function pararOutros(atual) {
  for (const o of document.querySelectorAll('video')) if (o !== atual && !o.paused) o.pause();
}

async function falhou(video) {
  const tela = video.closest('.vf-tela');
  if (!tela || tela.classList.contains('vf-falhou')) return;
  tela.classList.add('vf-falhou');
  let motivo = 'Não consegui abrir este vídeo agora.';
  try {
    // um byte só: o que importa é a resposta (sem sessão e senha temporária vão pra tela de entrar, como na API)
    const r = await fetch(video.currentSrc || video.getAttribute('src'), { headers: { range: 'bytes=0-0' } });
    if (!r.ok && sessaoCaiu(r.status, await r.json().catch(() => ({})))) return;
    if (r.status === 404) motivo = 'O arquivo não está mais na pasta de vídeos finais.';
    else if (r.ok) motivo = 'Este navegador não toca este arquivo. Use o Baixar.';
  } catch {
    motivo = 'Sem conexão com o servidor.';
  }
  if (!tela.isConnected) return;
  tela.innerHTML = `<div class="vf-erro" role="status">${icone('alerta', 20)}<strong>Vídeo indisponível</strong><span>${esc(motivo)}</span></div>`;
}

// Safari e qualquer navegador do iPhone e do iPad deixam o player preto até o play com preload="metadata"
const UA = typeof navigator === 'object' ? navigator.userAgent : '';
const SEM_PRIMEIRO_QUADRO = /iP(hone|ad|od)/.test(UA)
  || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1)
  || (/Safari\//.test(UA) && !/Chrome|Chromium|Edg|OPR|Firefox/.test(UA));

// o cartão toma o formato do vídeo (ou da capa, que tem o mesmo): deitado (16:9) ocupa duas colunas quando cabe
function ajustarFormato(video, w, h) {
  if (!w || !h) return;
  const tela = video.closest('.vf-tela');
  if (tela) tela.style.aspectRatio = `${w} / ${h}`;
  video.closest('.vf-card')?.classList.toggle('vf-deitado', w > h * 1.1);
}

function medir(video) {
  ajustarFormato(video, video.videoWidth, video.videoHeight);
  // um instante do começo desenha o 1º quadro (no Chrome e no Edge ele já aparece sozinho; com capa, nem precisa)
  if (SEM_PRIMEIRO_QUADRO && !video.poster && video.paused && video.currentTime === 0) {
    try { video.currentTime = 0.001; } catch { /* sem seek nesse navegador: fica o fundo */ }
  }
}

// o src entra quando o player chega perto da tela. Só na página (a janela é quem rola): dentro do painel, que rola
// sozinho, o observador não enxerga o que está logo abaixo da dobra, e lá são no máximo uns poucos vídeos.
// Com capa (página "Vídeos prontos"): o src entra com preload="none", que não baixa nada do vídeo até o play, e a capa
// vira o pôster e dá o formato do cartão. Sem capa (servidor sem ffmpeg ou vídeo que ele não abre): volta pro
// preload="metadata", que lê o começo do vídeo pra mostrar o primeiro quadro
let observador = null;
function porSrc(video) {
  if (!video.getAttribute('src') && video.dataset.src) video.src = video.dataset.src;
  const capa = video.dataset.capa;
  if (!capa || video.dataset.capaPedida) return;
  video.dataset.capaPedida = '1';
  const img = new Image();
  img.onload = () => {
    video.poster = capa;
    if (!video.videoWidth) ajustarFormato(video, img.naturalWidth, img.naturalHeight);
  };
  img.onerror = () => {
    if (video.isConnected && video.readyState === 0 && video.paused) video.preload = 'metadata';
  };
  img.src = capa;
}
function carregarQuandoPerto(video) {
  if (typeof IntersectionObserver !== 'function') return porSrc(video);
  observador ??= new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      observador.unobserve(e.target);
      porSrc(e.target);
    }
  }, { rootMargin: '400px 0px' });
  observador.observe(video);
}

// adiar: o src só entra perto da tela (página "Vídeos prontos"); sem ele, entra na hora (detalhe e stories)
export function ligarPlayers(raiz, { adiar = false } = {}) {
  for (const b of raiz?.querySelectorAll('[data-ir-video]') ?? []) {
    b.onclick = () => raiz.querySelector('.vf-secao')?.scrollIntoView({
      block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }
  for (const video of raiz?.querySelectorAll('video.vf-video') ?? []) {
    if (video.dataset.vfLigado) continue;
    video.dataset.vfLigado = '1';
    video.addEventListener('play', () => pararOutros(video));
    video.addEventListener('error', () => falhou(video), { once: true });
    video.addEventListener('loadedmetadata', () => medir(video), { once: true });
    if (adiar) carregarQuandoPerto(video);
    else porSrc(video);
  }
}
