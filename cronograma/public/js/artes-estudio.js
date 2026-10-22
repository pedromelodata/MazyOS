// 22/10 (Pedro): a arte que o estúdio de design exporta e anexa na peça (reel.artes ou stories.artes, estudio.mjs)
// aparece nas Aprovações técnicas e no painel da peça e dos stories: a imagem (PNG ou JPG) abre em tamanho real numa aba
// nova e o PDF também. O Diretor contábil abre só a arte da peça que ele vê (o servidor confere, estudio.mjs); o
// "Abrir no Estúdio" é só do time (o Diretor não chega no Ateliê)
import { esc, icone, fmtData } from './core.js';

const ID_EXPORTACAO = /^exp_[A-Za-z0-9_-]{1,64}$/;
const ID_DESIGN = /^est_[A-Za-z0-9_-]{1,64}$/;
const FORMATOS = { png: 'PNG', jpg: 'JPG', pdf: 'PDF' };
const urlArte = (id, baixar = false) => `/api/estudio/exportacoes/${encodeURIComponent(id)}/arquivo${baixar ? '?baixar=1' : ''}`;
// a página 1, 2, 3... e o PDF com todas no fim
const ordem = (a) => (a.pagina === 'todas' ? Number.MAX_SAFE_INTEGER : Number(a.pagina) || 0);
const rotuloPagina = (a) => (a.pagina === 'todas' ? 'Todas as páginas' : `Página ${Number(a.pagina) || 1}`);

// só as artes que o servidor gravou (id de exportação e formato conhecido), na ordem das páginas
export function artesDaPeca(artes) {
  return (Array.isArray(artes) ? artes : [])
    .filter((a) => a && typeof a === 'object' && ID_EXPORTACAO.test(String(a.id ?? '')) && FORMATOS[a.formato])
    .sort((a, b) => ordem(a) - ordem(b) || String(a.formato).localeCompare(String(b.formato)));
}

// estudio: false esconde o "Abrir no Estúdio" (o Diretor contábil)
export function artesHtml(artes, { estudio = true } = {}) {
  const lista = artesDaPeca(artes);
  if (!lista.length) return '';
  const designs = estudio ? [...new Set(lista.map((a) => a.docId).filter((d) => ID_DESIGN.test(String(d ?? ''))))] : [];
  const abrir = designs.length === 1
    ? `<a class="btn btn-sm" href="#/atelie?design=${encodeURIComponent(designs[0])}">${icone('pincel', 14)}Abrir no Estúdio</a>`
    : '';
  return `
    <section class="bloco artes-estudio">
      <div class="bloco-titulo">Arte do Estúdio<span class="dt-contador">${lista.length} ${lista.length === 1 ? 'arquivo' : 'arquivos'}</span>${abrir}</div>
      <ul class="env-arquivos">${lista.map((a) => {
        const fmt = FORMATOS[a.formato];
        const nome = `${rotuloPagina(a)} · ${fmt}`;
        const midia = a.formato === 'pdf'
          ? `<div class="env-arq-midia env-arq-doc">${icone('livro', 34)}<a class="btn btn-sm" href="${esc(urlArte(a.id))}" target="_blank" rel="noopener">${icone('externo', 14)}Abrir PDF</a></div>`
          : `<a class="env-arq-midia" href="${esc(urlArte(a.id))}" target="_blank" rel="noopener" title="Abrir em tamanho real"><img loading="lazy" src="${esc(urlArte(a.id))}" alt="${esc(nome)}" /></a>`;
        // o dia de Brasília da exportação (o em é UTC)
        const dia = a.em && !Number.isNaN(Date.parse(a.em)) ? new Date(a.em).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }) : '';
        const quando = dia ? fmtData(dia) : '';
        const quem = typeof a.por === 'string' && a.por.trim() ? a.por.trim() : '';
        return `
        <li class="env-arq card">
          ${midia}
          <div class="env-arq-pe">
            <span class="env-arq-info"><span class="env-arq-nome">${esc(nome)}</span>${quando || quem ? `<span class="env-arq-tam">${esc([quando, quem].filter(Boolean).join(' · '))}</span>` : ''}</span>
            <a class="btn btn-sm btn-fantasma" href="${esc(urlArte(a.id, true))}" aria-label="${esc(`Baixar ${nome}`)}">${icone('baixar', 14)}Baixar</a>
            ${designs.length > 1 && ID_DESIGN.test(String(a.docId ?? '')) ? `<a class="btn btn-sm btn-fantasma artes-estudio-abrir" href="#/atelie?design=${encodeURIComponent(a.docId)}">${icone('pincel', 14)}Abrir no Estúdio</a>` : ''}
          </div>
        </li>`;
      }).join('')}</ul>
    </section>`;
}
