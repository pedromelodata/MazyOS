// Bloco "Métricas desta peça" no painel da peça do cronograma (SPEC-METRICAS.md §5.6). O detalhe.js chama
// duas funções: blocoMetricasHtml(r) no HTML do painel (logo depois do bloco Ideia, fora do modo edição) e
// ligarBlocoMetricas(painel, r) depois de abrir. Decisões:
//  - a busca (GET /api/metricas/recomendacoes/:reelId) só começa com o painel aberto; seq e o data-reel do
//    bloco descartam a resposta que chega depois de o painel ter sido reaberto pra outra peça
//  - toda edição reabre o painel: a mesma peça desenha na hora a última resposta guardada e atualiza por
//    baixo, então o bloco não pisca nem empurra a rolagem
//  - peça por publicar: a meta do tipo e até 3 "Aplicar nesta peça" (cada um vira uma hipótese no servidor,
//    com "Desfazer"), mais o "Testar"; peça publicada e ligada a um post: resultado contra a meta,
//    veredito, gargalo e ponto forte em frase e as hipóteses dela
//  - sem Instagram, sem base ou com a rota fora do ar: uma frase curta, nunca caixa de erro; stories têm a
//    régua própria (tabela de Stories), então nunca pedem pra ligar post
//  - número ausente é "sem dado"; botão ocupado fica com aria-disabled (o foco não se perde)
//  - Aplicar e Desfazer: um pedido por vez (os outros botões do bloco esperam) e o estado novo parte do mais
//    recente guardado, nunca do que estava na tela no clique; busca que saiu antes de uma ação é refeita
//  - fator × a base abaixo de 2× sai truncado em uma casa: quem não bateu a meta nunca aparece como "2×"
import { esc, api, toast, icone, fecharPainel, navegar, store } from './core.js';
import { SEM_DADO, finito, num, plural, vezes, pillEvidencia, pillMeta, medidor, ligarDicas } from './metricas-comum.js';

const RE_REEL = /^reel_[a-z0-9]{4,20}$/i;
const RE_MIDIA = /^\d{1,40}$/;
// os mesmos formatos que server/hipoteses.mjs aceita (ID_HIPOTESE e ID_INSIGHT)
const RE_HIP = /^hip_[a-z0-9]{8}$/i;
const RE_INSIGHT = /^ins_[A-Za-z]{1,40}_[A-Za-z0-9_-]{1,80}$/;
const RE_DESTINO = /^#\/instagram\/metricas\/diagnostico(?:\?post=\d{1,40})?$/;
const GUARDA_MS = 10 * 60_000;
const MAX_GUARDADOS = 40;

const ACAO = { usar: 'Fazer mais', evitar: 'Evitar', testar: 'Testar', planejar: 'No planejamento' };
const STATUS_HIP = { aberta: 'Em teste', confirmada: 'Confirmada', refutada: 'Refutada', inconclusiva: 'Inconclusiva', 'nao-aplicada': 'Não aplicada' };
// etapa do funil com artigo, pra frase ("Ponto forte: o gancho (0 a 3s)")
const ETAPA = {
  gancho: 'o gancho (0 a 3s)', retencao: 'a retenção', distribuicao: 'a distribuição',
  qualidade: 'a ação por pessoa alcançada', conversao: 'o interesse no perfil', objetivo: 'a meta do tipo',
};
const FRASE = {
  semInstagram: 'Conecte o Instagram em Métricas pra ver a meta e as recomendações desta peça.',
  semBase: 'Ainda sem base pra meta desta peça: faltam peças do mesmo tipo publicadas e com número.',
  foraDoAr: 'As métricas desta peça não carregaram agora. Abra a peça de novo daqui a pouco.',
  semId: 'Esta peça ainda não tem métricas.',
  stories: 'Stories têm a régua própria, na tabela de Stories do Diagnóstico.',
};

let seq = 0; // cada ligar invalida as buscas de antes
let mudancas = 0; // aplicar e desfazer: busca que saiu antes deles não desenha por cima (é refeita)
let emVoo = false; // um Aplicar ou Desfazer no ar: os outros botões do bloco esperam ele voltar
const guardados = new Map(); // reelId → { em, dados }
const ACOES = '[data-dm-aplicar], [data-dm-desfazer]';

const lista = (x) => (Array.isArray(x) ? x : []);
const texto = (s) => String(s ?? '').trim();
// quantidade: inteira sem casa; mediana ou leitura interpolada (2,5) com uma
const qtd = (v) => num(v, { casas: finito(v) && !Number.isInteger(v) ? 1 : 0 });
// "1,4×" do score (log2 contra a base). Abaixo de 2× trunca em uma casa, pra nunca arredondar pra "2×" o que
// não chegou lá; quem não bateu a meta (bateu false) fica em 1,9× no máximo, mesmo com valor fracionário
// entre 2× a base e a meta inteira. Abaixo de 0,1× mantém o algarismo (truncar daria "0×")
export function vezesDe(score, { bateu = null } = {}) {
  if (!finito(score)) return SEM_DADO;
  const r = 2 ** score;
  if (r < 0.1 || (r >= 2 && bateu !== false)) return vezes(r);
  return vezes(Math.min(Math.floor(r * 10 + 1e-9) / 10, 1.9));
}
const frase = (t) => `<p class="dm-frase">${esc(t)}</p>`;
const carregando = () => '<p class="dm-carregando" role="status"><span class="dt-spinner" aria-hidden="true"></span>Carregando as métricas…</p>';

function guardado(id) {
  const g = guardados.get(id);
  if (!g) return null;
  if (Date.now() - g.em > GUARDA_MS) {
    guardados.delete(id);
    return null;
  }
  return g.dados;
}
function guardar(id, dados) {
  guardados.delete(id);
  guardados.set(id, { em: Date.now(), dados });
  while (guardados.size > MAX_GUARDADOS) guardados.delete(guardados.keys().next().value);
}

// ── pedaços ──────────────────────────────────────────────────────────────
function metaHtml(m) {
  if (!m || typeof m !== 'object') return '';
  const rot = texto(m.objetivo?.rotulo) || 'Métrica do tipo';
  const tem = finito(m.meta);
  const base = `2× a mediana ${m.baseDe === 'formato' ? 'das últimas peças do mesmo formato' : 'das últimas peças do mesmo tipo'}${finito(m.baseN) ? ` (${plural(m.baseN, 'peça', 'peças')})` : ''}.`;
  return `
    <div class="dm-parte dm-meta">
      <span class="dt-rotulo">Meta</span>
      <p class="dm-meta-linha"><span class="dm-meta-obj">${esc(rot)}</span>${tem ? `<span class="dm-meta-num">meta <b>${esc(qtd(m.meta))}</b></span><span class="dm-meta-num">base <b>${esc(qtd(m.base))}</b></span>` : ''}</p>
      <p class="dm-texto dm-texto-sec">${esc(texto(m.texto) || (tem ? base : 'Ainda sem base pra meta de 2× neste tipo.'))}</p>
    </div>`;
}

function itemHtml(it) {
  const acao = ACAO[it.acao] ? it.acao : 'testar';
  const iid = String(it.insightId);
  const hip = RE_HIP.test(String(it.aplicado ?? '')) ? String(it.aplicado) : '';
  const nome = texto(it.titulo) || texto(it.nomeValor) || texto(it.texto).slice(0, 80) || 'esta recomendação';
  return `
    <li class="dm-item" data-acao="${acao}"${hip ? ' data-aplicado="true"' : ''}>
      <div class="dm-item-topo">
        <span class="pill dm-acao" data-acao="${acao}">${esc(ACAO[acao])}</span>
        ${it.evidencia ? pillEvidencia(it.evidencia) : ''}
        ${finito(it.n) ? `<span class="dm-n">${esc(plural(it.n, 'peça', 'peças'))}</span>` : ''}
      </div>
      ${texto(it.titulo) ? `<strong class="dm-item-titulo">${esc(it.titulo)}</strong>` : ''}
      ${texto(it.texto) ? `<p class="dm-texto">${esc(it.texto)}</p>` : ''}
      ${texto(it.aviso) ? `<p class="dm-aviso">${icone('alerta', 14)}<span>${esc(it.aviso)}</span></p>` : ''}
      <div class="dm-item-acoes">
        ${hip
          ? `<span class="dm-aplicado">Aplicado <b aria-hidden="true">✓</b></span><button type="button" class="btn btn-sm btn-fantasma" data-dm-desfazer="${esc(hip)}" data-insight="${esc(iid)}" data-foco="desfazer:${esc(iid)}" aria-label="${esc(`Desfazer: ${nome}`)}">Desfazer</button>`
          : `<button type="button" class="btn btn-sm" data-dm-aplicar="${esc(iid)}" data-foco="aplicar:${esc(iid)}" aria-label="${esc(`Aplicar nesta peça: ${nome}`)}">Aplicar</button>`}
      </div>
    </li>`;
}

function hipotesesHtml(hs, titulo, { desfazer = false } = {}) {
  const xs = lista(hs).filter((h) => h && typeof h === 'object');
  if (!xs.length) return '';
  return `
    <div class="dm-parte dm-hips">
      <span class="dt-rotulo">${esc(titulo)}</span>
      <ul>${xs.map((h) => {
        const st = STATUS_HIP[h.status] ? h.status : 'aberta';
        const id = RE_HIP.test(String(h.id ?? '')) ? String(h.id) : '';
        const podeDesfazer = desfazer && id && st === 'aberta';
        return `
          <li class="dm-hip">
            <div class="dm-hip-topo"><span class="pill dm-status" data-status="${st}">${esc(STATUS_HIP[st])}</span>${podeDesfazer ? `<button type="button" class="btn btn-sm btn-fantasma" data-dm-desfazer="${id}" data-foco="desfazer-h:${id}" aria-label="${esc(`Desfazer: ${texto(h.texto) || 'esta hipótese'}`)}">Desfazer</button>` : ''}</div>
            <p class="dm-texto">${esc(texto(h.texto) || 'Hipótese sem texto.')}</p>
            ${texto(h.veredito?.texto) ? `<p class="dm-texto dm-texto-sec">${esc(h.veredito.texto)}</p>` : ''}
          </li>`;
      }).join('')}</ul>
    </div>`;
}

// sem o valor da métrica do tipo: só o objetivo de Vendas (interesse) vem dos números do app; nos outros,
// o Instagram ainda não mandou (até 48h depois de publicar) ou não mandou nesta leitura
function semValorTexto(o, idadeH) {
  if (o.id === 'interesse') return 'Sem dado: informe os números do app (seguidores, visitas ao perfil e cliques no link) no Diagnóstico.';
  if (finito(idadeH) && idadeH >= 48) return 'Sem dado da métrica do tipo nesta leitura: o Instagram não mandou o número.';
  return 'Sem dado da métrica do tipo nesta leitura: o Instagram ainda não mandou o número (pode levar até 48h depois de publicar).';
}

// frase do veredito com os números do objetivo (PostRow.objetivo); idadeH: a idade do post em horas
function veredito(o, idadeH = null) {
  const rot = (texto(o.rotulo) || 'métrica do tipo').toLowerCase();
  let t;
  if (!finito(o.valor)) t = semValorTexto(o, idadeH);
  else if (!finito(o.base)) t = `Fez ${qtd(o.valor)} em ${rot}, mas ainda não tem base pra comparar.`;
  else if (o.bateuMeta) t = `Bateu a meta de 2×: fez ${qtd(o.valor)} em ${rot}, e a meta era ${qtd(o.meta)}.`;
  // quem não bateu fica no fator truncado (1,96× é "1,9×"), nunca "Ficou em 2×"
  else t = `${finito(o.score) ? `Ficou em ${vezesDe(o.score, { bateu: false })} a base` : 'Não bateu a meta de 2×'}: fez ${qtd(o.valor)} em ${rot}, e a meta era ${qtd(o.meta)}.`;
  const extras = [
    o.provisorio ? 'Número provisório: a peça ainda não fez 7 dias.' : '',
    finito(o.ritmo) ? `No ritmo das outras peças na mesma idade: ${vezesDe(o.ritmo)} a base.` : '',
    o.baseDe === 'formato' ? 'A base é do mesmo formato, porque ainda há poucas peças do mesmo tipo.' : '',
  ].filter(Boolean);
  return [t, ...extras].join(' ');
}

// "Ponto forte: o gancho (0 a 3s), com 54% contra 40% na base." (números do funil, quando vieram)
function etapaFrase(tipo, etapa, funil) {
  const id = typeof etapa === 'string' ? etapa : etapa?.etapa;
  if (!id) return '';
  const f = lista(funil).find((x) => x?.etapa === id);
  const nome = ETAPA[id] ?? (texto(f?.rotulo ?? etapa?.rotulo) || String(id)).toLowerCase();
  const nums = texto(f?.valorTexto) && texto(f?.baseTexto)
    ? `, com ${texto(f.valorTexto)} contra ${texto(f.baseTexto)} na base`
    : finito(f?.score) ? `, ${vezesDe(f.score)} a base` : '';
  return `${tipo === 'forte' ? 'Ponto forte' : 'Gargalo'}: ${nome}${nums}.`;
}
function etapasHtml(p) {
  const forte = etapaFrase('forte', p.forte, p.funil);
  const gargalo = etapaFrase('gargalo', p.gargalo, p.funil);
  if (!forte && !gargalo) {
    return lista(p.funil).length ? '<div class="dm-parte"><p class="dm-texto dm-texto-sec">Nenhuma etapa do funil ficou longe da base.</p></div>' : '';
  }
  return `
    <div class="dm-parte">
      <ul class="dm-etapas">
        ${forte ? `<li data-nivel="acima"><b aria-hidden="true">↑</b><span>${esc(forte)}</span></li>` : ''}
        ${gargalo ? `<li data-nivel="abaixo"><b aria-hidden="true">↓</b><span>${esc(gargalo)}</span></li>` : ''}
      </ul>
    </div>`;
}

const botaoIr = (href, rotulo) => `<a class="btn btn-sm dm-ir" href="${href}" data-dm-ir="${href}" data-foco="ir">${icone('grafico', 14)} ${esc(rotulo)}</a>`;

function resultadoHtml(d) {
  const p = d.resultado;
  const o = p.objetivo && typeof p.objetivo === 'object' ? p.objetivo : {};
  const id = RE_MIDIA.test(String(p.midiaId ?? '')) ? String(p.midiaId) : '';
  const bateu = finito(o.base) ? (o.bateuMeta ?? null) : null;
  const rot = texto(o.rotulo) || 'Métrica do tipo';
  return `
    <div class="dm-cartao">
      <div class="dm-parte dm-resultado">
        <div class="dm-res-cab"><span class="dt-rotulo">Resultado × meta</span>${finito(o.valor) ? pillMeta(bateu, o.score) : ''}</div>
        <p class="dm-res-obj">${esc(rot)}</p>
        ${medidor({ valor: o.valor, base: o.base, meta: o.meta, formato: qtd, rotulo: rot })}
        <p class="dm-texto">${esc(veredito(o, p.idadeH))}</p>
      </div>
      ${etapasHtml(p)}
      ${hipotesesHtml(d.aplicados, 'Testes nesta peça')}
      ${id ? `<div class="dm-parte">${botaoIr(`#/instagram/metricas/diagnostico?post=${id}`, 'Ver diagnóstico completo')}</div>` : ''}
    </div>`;
}

// publicada, mas nenhum post ligado a ela ainda
function publicadaHtml(d, r) {
  const como = texto(r?.permalink)
    ? 'o post ainda não foi ligado a ela. Ligue na aba Diagnóstico de Métricas pra ver o resultado contra a meta.'
    : 'falta o link do post. Cole em Editar, no Planejamento, ou ligue o post na aba Diagnóstico de Métricas.';
  return `
    <div class="dm-cartao">
      <div class="dm-parte">
        <p class="dm-texto">Peça publicada, mas ${esc(como)}</p>
        ${botaoIr('#/instagram/metricas/diagnostico', 'Abrir o Diagnóstico')}
      </div>
      ${metaHtml(d.meta)}
      ${hipotesesHtml(d.aplicados, 'Testes nesta peça')}
    </div>`;
}

// ainda por publicar: a meta, o que aplicar e o que testar
function planejamentoHtml(d) {
  const itens = lista(d.itens).filter((x) => x && x.insightId != null).slice(0, 3);
  const testar = d.testar && typeof d.testar === 'object' && d.testar.insightId != null ? { ...d.testar, acao: 'testar' } : null;
  const ids = new Set([...itens, testar].filter(Boolean).map((x) => String(x.insightId)));
  // hipótese de um insight que saiu da lista (a conta mudou): continua visível e dá pra desfazer
  const outros = lista(d.aplicados).filter((h) => h && typeof h === 'object' && !ids.has(String(h.insightId ?? '')));
  return `
    <div class="dm-cartao">
      ${texto(d.semDados) ? `<div class="dm-parte"><p class="dm-texto dm-texto-sec">${esc(d.semDados)}</p></div>` : ''}
      ${metaHtml(d.meta)}
      <div class="dm-parte">
        <span class="dt-rotulo" id="dm-aplicar-t">Aplicar nesta peça</span>
        ${itens.length || testar
          ? `<ul class="dm-itens" aria-labelledby="dm-aplicar-t">${itens.map(itemHtml).join('')}${testar ? itemHtml(testar) : ''}</ul>`
          : '<p class="dm-texto dm-texto-sec">Nada com evidência pra aplicar ainda: as recomendações aparecem quando houver peças parecidas publicadas.</p>'}
      </div>
      ${hipotesesHtml(outros, 'Também aplicado nesta peça', { desfazer: true })}
    </div>`;
}

// o miolo do bloco (puro: sem DOM nem rede). d = resposta de /recomendacoes/:reelId, ou null quando a busca
// falhou; o.conectado = Instagram conectado (store.E.instagram.conectado), undefined quando não se sabe
export function metricasPecaHtml(d, r, o = {}) {
  if (!RE_REEL.test(String(r?.id ?? ''))) return frase(FRASE.semId);
  if (!d || typeof d !== 'object') return frase(o.conectado === false ? FRASE.semInstagram : FRASE.foraDoAr);
  if (d.resultado && typeof d.resultado === 'object') return resultadoHtml(d);
  // stories (ou resposta sem meta, com o porquê): o Diagnóstico nunca liga post a eles, então nada de "ligue
  // o post"; fica o porquê e, se sobrou hipótese de quando a peça era outra, ela com o Desfazer
  const stories = d.peca === 'stories' || r.peca === 'stories';
  if (stories || (texto(d.semDados) && !d.meta)) {
    const hips = hipotesesHtml(d.aplicados, 'Também aplicado nesta peça', { desfazer: true });
    return `${frase(texto(d.semDados) || (stories ? FRASE.stories : FRASE.semBase))}${hips ? `<div class="dm-cartao">${hips}</div>` : ''}`;
  }
  // o motor sempre manda a meta (com base null quando falta) e um "testar" mesmo sem post: sem base, sem
  // recomendação com evidência e sem nada aplicado, a peça não tem o que mostrar além do porquê
  const temBase = Boolean(d.meta) && (finito(d.meta.base) || finito(d.meta.meta));
  const vazio = !temBase && !lista(d.itens).length && !lista(d.aplicados).length;
  if (vazio && o.conectado === false) return frase(texto(d.semDados) || FRASE.semInstagram);
  // publicada sem post ligado: o caminho é ligar o post (o que aplicar já não serve)
  if (r.status === 'publicado') return publicadaHtml(d, r);
  if (vazio) return frase(texto(d.semDados) || FRASE.semBase);
  return planejamentoHtml(d);
}

// a <section> do bloco. Com a peça já vista há pouco, vem desenhada; senão, com a linha de "carregando"
export function blocoMetricasHtml(r, { editando = false } = {}) {
  if (!r || typeof r !== 'object' || editando) return '';
  const id = RE_REEL.test(String(r.id ?? '')) ? String(r.id) : '';
  const g = id ? guardado(id) : null;
  return `
    <section class="bloco dm-secao" id="dm-bloco" data-reel="${esc(id)}" aria-labelledby="dm-titulo"${g || !id ? '' : ' aria-busy="true"'}>
      <div class="bloco-titulo" id="dm-titulo">Métricas desta peça</div>
      <div class="dm-corpo">${!id || g ? metricasPecaHtml(g, r, { conectado: store.E?.instagram?.conectado }) : carregando()}</div>
    </section>`;
}

// ── DOM ──────────────────────────────────────────────────────────────────
function blocoVivo(r) {
  const b = document.getElementById('dm-bloco');
  return b?.isConnected && b.dataset.reel === String(r?.id ?? '') ? b : null;
}

// com um Aplicar ou Desfazer no ar, todos os botões de ação do bloco esperam (o clicado leva também aria-busy)
function travarAcoes(bloco, sim) {
  bloco?.querySelectorAll(ACOES).forEach((x) => {
    if (sim) x.setAttribute('aria-disabled', 'true');
    else {
      x.removeAttribute('aria-disabled');
      x.removeAttribute('aria-busy');
    }
  });
}
function comecarAcao(b) {
  emVoo = true;
  travarAcoes(b.closest('#dm-bloco'), true);
  b.setAttribute('aria-busy', 'true');
}
// a ação voltou (certa ou não): os botões do bloco que estiver na tela voltam a valer
function soltarAcao() {
  emVoo = false;
  travarAcoes(document.getElementById('dm-bloco'), false);
}

function pintar(bloco, r, d, foco = null) {
  const corpo = bloco.querySelector('.dm-corpo');
  if (!corpo) return;
  // só devolve o foco se ele ainda estava no bloco: quem saiu dele durante a espera não é puxado de volta
  const ativo = document.activeElement;
  const antes = bloco.contains(ativo) ? foco ?? ativo?.dataset?.foco ?? null : null;
  corpo.innerHTML = metricasPecaHtml(d, r, { conectado: store.E?.instagram?.conectado });
  bloco.removeAttribute('aria-busy');
  ligarAcoes(bloco, r, d);
  // desenhado com um pedido ainda no ar (resposta de busca no meio): os botões novos esperam também
  if (emVoo) travarAcoes(bloco, true);
  if (!antes) return;
  // o botão que tinha o foco virou outro (Aplicar ↔ Desfazer): o foco vai pro par dele, nunca pro body
  const volta = bloco.querySelector(`[data-foco="${CSS.escape(antes)}"]`) ?? bloco.querySelector('.dm-corpo button, .dm-corpo a[href]');
  volta?.focus({ preventScroll: true });
}

// a resposta do servidor muda só o item: sem buscar tudo de novo. Puras (exportadas pros testes)
export function comAplicado(d, insightId, hip) {
  const hid = RE_HIP.test(String(hip?.id ?? '')) ? String(hip.id) : null;
  const marca = (it) => (it && String(it.insightId) === String(insightId) ? { ...it, aplicado: hid } : it);
  return {
    ...d,
    itens: lista(d.itens).map(marca),
    testar: d.testar ? marca(d.testar) : d.testar,
    aplicados: hid ? [...lista(d.aplicados).filter((h) => h?.id !== hid), { ...hip, reelId: hip.reelId ?? d.reelId, insightId: hip.insightId ?? insightId }] : lista(d.aplicados),
  };
}
export function semAplicado(d, hipId) {
  const solta = (it) => (it && String(it.aplicado ?? '') === hipId ? { ...it, aplicado: null } : it);
  return { ...d, itens: lista(d.itens).map(solta), testar: d.testar ? solta(d.testar) : d.testar, aplicados: lista(d.aplicados).filter((h) => h?.id !== hipId) };
}

// a lista do servidor. Uma ação que termina enquanto esta busca está no ar deixa a resposta velha: busca de novo
async function recarregar(r) {
  const id = String(r.id);
  const antes = mudancas;
  let d = null;
  try {
    d = await api('GET', `/api/metricas/recomendacoes/${encodeURIComponent(id)}`);
  } catch {
    return; // fica o que está na tela
  }
  if (!d || typeof d !== 'object') return;
  if (mudancas !== antes) return recarregar(r);
  guardar(id, d);
  const vivo = blocoVivo(r);
  if (vivo) pintar(vivo, r, d);
}

async function aplicar(b, r, d) {
  const insightId = b.dataset.dmAplicar;
  const id = String(r?.id ?? '');
  if (!d || emVoo || !RE_INSIGHT.test(insightId ?? '') || !RE_REEL.test(id) || b.getAttribute('aria-disabled') === 'true') return;
  comecarAcao(b);
  let resp;
  try {
    resp = await api('POST', '/api/metricas/hipoteses', { reelId: r.id, insightId });
  } catch (e) {
    soltarAcao();
    toast(e.message);
    return;
  }
  mudancas++;
  emVoo = false;
  const hip = resp?.hipotese && typeof resp.hipotese === 'object' ? resp.hipotese : resp;
  toast('Aplicado nesta peça');
  // resposta sem o id da hipótese: a lista do servidor diz como ficou
  if (!RE_HIP.test(String(hip?.id ?? ''))) {
    soltarAcao();
    recarregar(r);
    return;
  }
  // parte do estado mais novo guardado (uma busca pode ter chegado com o pedido no ar), nunca do d do clique
  const novo = comAplicado(guardado(id) ?? d, insightId, hip);
  guardar(id, novo);
  const vivo = blocoVivo(r);
  if (vivo) pintar(vivo, r, novo, `desfazer:${insightId}`);
  else soltarAcao();
}

async function desfazer(b, r, d) {
  const hid = b.dataset.dmDesfazer;
  const id = String(r?.id ?? '');
  if (!d || emVoo || !RE_HIP.test(String(hid ?? '')) || b.getAttribute('aria-disabled') === 'true') return;
  comecarAcao(b);
  let sumiu = false;
  try {
    await api('DELETE', `/api/metricas/hipoteses/${encodeURIComponent(hid)}`);
  } catch (e) {
    // 404: a hipótese já tinha saído (outra aba, outra pessoa); o bloco só precisa esquecer dela
    if (e?.status !== 404) {
      soltarAcao();
      toast(e.message);
      return;
    }
    sumiu = true;
  }
  mudancas++;
  emVoo = false;
  const novo = semAplicado(guardado(id) ?? d, hid);
  guardar(id, novo);
  toast(sumiu ? 'Essa hipótese já tinha saído: a peça segue sem ela' : 'Desfeito: a peça segue sem essa recomendação');
  const vivo = blocoVivo(r);
  if (vivo) pintar(vivo, r, novo, b.dataset.insight ? `aplicar:${b.dataset.insight}` : null);
  else soltarAcao();
}

function ligarAcoes(bloco, r, d) {
  bloco.querySelectorAll('[data-dm-aplicar]').forEach((b) => (b.onclick = () => aplicar(b, r, d)));
  bloco.querySelectorAll('[data-dm-desfazer]').forEach((b) => (b.onclick = () => desfazer(b, r, d)));
  // igual ao data-ir do detalhe.js: fecha o painel e só então navega
  bloco.querySelectorAll('[data-dm-ir]').forEach((a) => (a.onclick = (e) => {
    const destino = a.dataset.dmIr;
    if (!RE_DESTINO.test(destino ?? '')) return;
    e.preventDefault();
    fecharPainel();
    navegar(destino);
  }));
}

// painel = o <aside> que abrirPainel devolveu (sem ele, procura no documento)
export function ligarBlocoMetricas(painel, r) {
  ligarDicas();
  const minha = ++seq;
  const raiz = painel && typeof painel.querySelector === 'function' ? painel : document;
  const bloco = raiz.querySelector('#dm-bloco');
  if (!bloco || !r || typeof r !== 'object') return;
  const id = String(r.id ?? '');
  if (!RE_REEL.test(id) || bloco.dataset.reel !== id) {
    pintar(bloco, r, null);
    return;
  }
  // a última resposta (se houver) já veio no HTML: liga os botões dela e atualiza por baixo
  const g = guardado(id);
  if (g) {
    ligarAcoes(bloco, r, g);
    if (emVoo) travarAcoes(bloco, true);
  }
  const antes = mudancas;
  const aberto = () => minha === seq && bloco.isConnected && bloco.dataset.reel === id;
  api('GET', `/api/metricas/recomendacoes/${encodeURIComponent(id)}`).then(
    (d) => {
      if (!aberto()) return;
      // uma ação terminou depois que esta busca saiu: a resposta pode ser de antes dela, então busca de novo
      if (mudancas !== antes) {
        recarregar(r);
        return;
      }
      const dados = d && typeof d === 'object' ? d : null;
      if (dados) guardar(id, dados);
      pintar(bloco, r, dados);
    },
    () => {
      if (aberto() && mudancas === antes && !g) pintar(bloco, r, null);
    },
  );
}
