// Métricas → Semanal (SPEC-METRICAS.md §5.5): o resumo da semana que o servidor monta (relatorio.mjs, um
// arquivo por semana ISO, toda segunda às 7h pela agenda ou no "Gerar agora"). A aba só desenha o que vem
// pronto: número, meta, frase e recomendação são do servidor; aqui entram a formatação pt-BR e as peças de
// metricas-comum.js. Decisões:
//  - seletor de semana com anterior, próxima e a lista (semanas com resumo, a de agora marcada como parcial
//    e a anterior a ela, que é a que a agenda gera); a escolhida vai pro endereço (?semana=) sem disparar a
//    rota, pra link e recarga voltarem na mesma semana
//  - o que já veio aparece na hora e a aba busca de novo por baixo: resumo gerado de manhã aparece sem F5
//  - "Escrever leitura com IA" começa o job no servidor; a aba acompanha (GET a cada 2,5s) só com a aba na
//    tela e a janela visível; quando o job acaba, o resumo volta com a leitura (cada frase abre os fatos que
//    ela cita)
//  - "Copiar resumo" é texto puro pro WhatsApp: sem markdown, lista com "•", sem travessão
//  - botão ocupado fica com aria-disabled (o foco não se perde); número ausente é "sem dado", nunca zero
//  - fator × a base abaixo de 2× sai truncado em uma casa (1,96× é "1,9×"): peça que não bateu a meta nunca
//    aparece como "2×" (revisão de 30/09). Seguidores da semana com o dia de cada leitura, nunca "fim da
//    semana" de uma leitura de quarta; uma leitura só não tem variação (é "sem dado", não 0)
import { esc, api, toast, icone, pillTipo, tipoReel, pecaInfo, fmtData, semTraco } from '../core.js';
import {
  SEM_DADO, finito, num, pct, vezes, dataCurta, dataHora, rotuloSemana, plural,
  pillEvidencia, pillMeta, medidor, vazio, ligarDicas,
} from '../metricas-comum.js';

const RE_SEMANA = /^(\d{4})-W(\d{2})$/;
const RE_MIDIA = /^\d{1,40}$/;
const RE_REEL = /^reel_[a-z0-9]{4,20}$/i;
const RE_DIA = /^\d{4}-\d{2}-\d{2}$/;
const ESPERA_MS = 2500;
const DIA_MS = 86_400_000;
const FUSO = 'America/Sao_Paulo';

const ACAO = { usar: 'Fazer mais', evitar: 'Evitar', testar: 'Testar', planejar: 'No planejamento' };
const EVIDENCIA = { forte: 'evidência forte', moderada: 'evidência moderada', fraca: 'evidência fraca', insuficiente: 'sem evidência' };
const ETAPA = {
  objetivo: 'meta do tipo', gancho: 'gancho (0 a 3s)', retencao: 'retenção', distribuicao: 'distribuição',
  qualidade: 'ação por pessoa alcançada', conversao: 'interesse no perfil',
};
const PUBLICADAS = [['reel', 'reel', 'reels'], ['carrossel', 'carrossel', 'carrosséis'], ['estatico', 'estático', 'estáticos']];
// os vereditos que o relatorio-motor devolve (naoAplicadas: a peça saiu sem o que a hipótese pedia)
const GRUPOS_HIP = [
  ['confirmadas', 'Confirmadas', 'Confirmada'], ['refutadas', 'Refutadas', 'Refutada'],
  ['inconclusivas', 'Inconclusivas', 'Inconclusiva'], ['naoAplicadas', 'Não aplicadas', 'Não aplicada'],
];

const st = {
  semana: null, // a semana na tela (AAAA-Www)
  atual: null, // a semana que o servidor escolheu mostrar (pedida, a mais nova ou a anterior)
  corrente: null, // a semana em andamento pelo relógio do servidor (Brasília)
  semanas: [], // semanas com arquivo, mais nova primeiro
  dados: new Map(), // semana → { relatorio, leitura }
  carregando: new Set(),
  erro: new Map(),
  gerando: null, // semana sendo gerada
  pedindoLeitura: false,
  erroLeitura: '',
  abertos: new Set(), // fatos abertos na leitura (sobrevivem ao redesenho)
  poll: null, // { semana, seq, timer, pausado }
  seqPoll: 0,
};
let alvo = null; // { el, aoAnalisar }
let ouvindo = false;

// ── semanas ISO (a mesma conta de server/estatistica.mjs, que não é servido ao navegador) ──
function segundaDa(semana) {
  const m = RE_SEMANA.exec(String(semana ?? ''));
  if (!m) return null;
  const jan4 = Date.UTC(Number(m[1]), 0, 4);
  return jan4 - ((new Date(jan4).getUTCDay() + 6) % 7) * DIA_MS + (Number(m[2]) - 1) * 7 * DIA_MS;
}
function semanaDoDia(ms) {
  const t = new Date(ms);
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7) + 3);
  const ano = t.getUTCFullYear();
  const q1 = new Date(Date.UTC(ano, 0, 4));
  q1.setUTCDate(q1.getUTCDate() - ((q1.getUTCDay() + 6) % 7) + 3);
  return `${ano}-W${String(1 + Math.round((t - q1) / (7 * DIA_MS))).padStart(2, '0')}`;
}
export function somarSemanas(semana, n) {
  const seg = segundaDa(semana);
  return seg == null || !Number.isInteger(n) ? null : semanaDoDia(seg + n * 7 * DIA_MS);
}
// a semana em andamento no fuso de Brasília: dela em diante o resumo é parcial
export function semanaDeHoje(agora = Date.now()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(agora)).map((x) => [x.type, x.value]));
  return semanaDoDia(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)));
}

// ── ajudantes ────────────────────────────────────────────────────────────
const lista = (x) => (Array.isArray(x) ? x : []);
const texto = (s) => String(s ?? '').trim();
// frase pode vir como texto ou como { texto }
const frase = (f) => texto(typeof f === 'string' ? f : f?.texto);
const https = (u) => (/^https:\/\//i.test(texto(u)) ? texto(u) : '');
const semanaOk = (s) => RE_SEMANA.test(String(s ?? ''));
// quantidade: inteira sem casa; mediana ou leitura interpolada (2,5) com uma
const qtd = (v) => num(v, { casas: finito(v) && !Number.isInteger(v) ? 1 : 0 });
const emLista = (xs) => (xs.length <= 1 ? xs[0] ?? '' : `${xs.slice(0, -1).join(', ')} e ${xs.at(-1)}`);
const maiuscula = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
const diaCurto = (dia) => (RE_DIA.test(texto(dia)) ? fmtData(texto(dia), { diaSemana: true }) : SEM_DADO);
const nomeEtapa = (e) => (typeof e === 'string' ? ETAPA[e] ?? e : e && typeof e === 'object' ? texto(e.rotulo) || ETAPA[e.etapa] || '' : '');
const metas = (m) => (m && typeof m === 'object' && finito(m.n) && finito(m.de) ? { n: m.n, de: m.de } : null);
const taxaDe = (m) => (m && m.de > 0 ? m.n / m.de : null);
// post sem legenda: onde a data não está do lado, ela entra no nome
const tituloPeca = (p, comData = false) => texto(p?.titulo) || (comData ? `Post sem título (${diaCurto(p?.dia)})` : 'Post sem título');
// "1,4×" do score (log2 contra a base). Abaixo de 2× trunca em uma casa, pra nunca arredondar pra "2×" o que
// não chegou lá; quem não bateu a meta (bateu false) fica em 1,9× no máximo, mesmo com valor fracionário
// entre 2× a base e a meta inteira. Abaixo de 0,1× mantém o algarismo (truncar daria "0×")
export function vezesDe(score, { bateu = null } = {}) {
  if (!finito(score)) return SEM_DADO;
  const r = 2 ** score;
  if (r < 0.1 || (r >= 2 && bateu !== false)) return vezes(r);
  return vezes(Math.min(Math.floor(r * 10 + 1e-9) / 10, 1.9));
}
// o veredito da hipótese: o relatorio-motor manda o texto pronto; a hipótese crua traz { texto }
const vereditoHip = (h) => texto(typeof h?.veredito === 'string' ? h.veredito : h?.veredito?.texto);
const provisoriasTexto = (n) => `${plural(n, 'peça ainda tem', 'peças ainda têm')} menos de 7 dias`;
// por que a conta da meta tem menos peças que as publicadas (relatorio-motor: a provisória, a com anúncio e a de
// 7 dias sem base ou sem número ficam de fora). Relatório antigo, sem esses campos e sem base: a frase geral
function foraDaConta(r, mb) {
  const n = (v) => (finito(v) && v > 0 ? v : 0);
  const [prov, anuncio, semAval] = [n(r?.provisorias), n(r?.comAnuncio), n(r?.semAvaliacao)];
  const xs = [
    prov ? provisoriasTexto(prov) : '',
    anuncio ? `${plural(anuncio, 'peça teve', 'peças tiveram')} anúncio` : '',
    semAval ? `${plural(semAval, 'peça', 'peças')} sem base ou sem o número do objetivo` : '',
  ].filter(Boolean);
  if (!xs.length && mb && mb.de === 0) xs.push('nenhuma peça da semana tinha base pra comparar');
  return xs;
}
const SELO_ANUNCIO = '<span class="pill sm-selo" data-destaque="anuncio" tabindex="0" data-mc-dica="Teve anúncio: fica fora da conta da meta, da mediana e dos destaques">teve anúncio</span>';
// o dia de cada leitura de seguidores ("30/09"); sem ele (relatório antigo), ''
const diaLeitura = (dia) => (RE_DIA.test(texto(dia)) ? dataCurta(texto(dia)) : '');
// total do servidor; sem ele, a soma das partes que vieram
function totalPublicadas(pub) {
  if (finito(pub?.total)) return pub.total;
  return PUBLICADAS.some(([k]) => finito(pub?.[k])) ? PUBLICADAS.reduce((s, [k]) => s + (finito(pub[k]) ? pub[k] : 0), 0) : null;
}
const partesPublicadas = (pub) => PUBLICADAS.filter(([k]) => finito(pub?.[k]) && pub[k] > 0).map(([k, um, varios]) => plural(pub[k], um, varios));
// "seg, 22/09 · Reel · Ensino"
const cabecaPeca = (p) => [diaCurto(p?.dia), pecaInfo(p?.peca)?.nome, tipoReel(p?.tipo)?.nome].filter(Boolean).join(' · ');

function periodoDe(rel, semana) {
  if (rel && RE_DIA.test(texto(rel.inicio)) && RE_DIA.test(texto(rel.fim))) return `${dataCurta(rel.inicio)} a ${dataCurta(rel.fim)}`;
  return semanaOk(semana) ? rotuloSemana(semana) : '';
}

// o job da leitura (estadoLeituraIa): aceita { etapa, erro, fim }, { estado } ou { rodando }; null é "sem job"
const FIM = new Set(['pronto', 'pronta', 'ok', 'feito', 'fim', 'concluido', 'concluida', 'terminado']);
const FALHA = new Set(['erro', 'falhou', 'falha', 'sem-login']);
export function faseLeitura(l) {
  if (!l || typeof l !== 'object') return null;
  const marcas = [l.estado, l.status, l.etapa].map((x) => String(x ?? '').toLowerCase());
  if (texto(l.erro) || marcas.some((x) => FALHA.has(x))) return 'erro';
  if (l.rodando === false || l.fim || l.pronto === true || marcas.some((x) => FIM.has(x))) return 'pronto';
  if (l.rodando === true || marcas.some(Boolean) || l.inicio || l.desde) return 'rodando';
  return null;
}
function mensagemLeitura(l) {
  if (texto(l?.erro)) return texto(l.erro);
  if (texto(l?.mensagem)) return texto(l.mensagem);
  if ([l?.estado, l?.status, l?.etapa].includes('sem-login')) return 'Sem login do Claude no servidor: a leitura com IA não roda agora.';
  return 'A leitura com IA falhou. Tente de novo.';
}

// ── pedaços ──────────────────────────────────────────────────────────────
function secao(id, titulo, corpo, extra = '') {
  return `
    <section class="card sm-secao" aria-labelledby="sm-t-${id}">
      <div class="sm-secao-cab"><h3 class="sm-h3" id="sm-t-${id}">${esc(titulo)}</h3>${extra}</div>
      ${corpo}
    </section>`;
}
const nada = (t) => `<p class="sm-nada">${esc(t)}</p>`;
const contador = (n, um, varios) => `<span class="sm-n">${esc(plural(n, um, varios))}</span>`;
function frasesHtml(fs) {
  const v = lista(fs).map(frase).filter(Boolean);
  return v.length ? `<ul class="sm-frases">${v.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : '';
}
function kpi(rotulo, valor, detalhe = '') {
  return `<div class="sm-kpi"><dt>${esc(rotulo)}</dt><dd class="sm-kpi-valor">${esc(valor)}</dd>${detalhe ? `<dd class="sm-kpi-detalhe">${detalhe}</dd>` : ''}</div>`;
}
// comparação com a semana anterior: seta, palavra e cor (nunca só a cor); subir é bom nas duas medidas
function delta(agora, antes, textoAntes) {
  if (!textoAntes) return '';
  if (!finito(agora) || !finito(antes)) return `<span class="sm-delta">semana anterior: ${esc(textoAntes)}</span>`;
  const d = agora - antes;
  const dir = Math.abs(d) < 1e-9 ? 'igual' : d > 0 ? 'sobe' : 'desce';
  const [seta, palavra] = { sobe: ['↑', 'subiu'], desce: ['↓', 'caiu'], igual: ['=', 'igual'] }[dir];
  return `<span class="sm-delta" data-dir="${dir}"><b aria-hidden="true">${seta}</b>${palavra}, era ${esc(textoAntes)} na semana anterior</span>`;
}
function pillPeca(id) {
  const p = pecaInfo(id);
  return p ? `<span class="pill pill-peca">${icone(p.icone, 13)}${esc(p.nome)}</span>` : '';
}
function thumbHtml(url, peca) {
  const u = https(url);
  const p = pecaInfo(peca) ?? pecaInfo('reel');
  return `<span class="sm-thumb" aria-hidden="true">${icone(p.icone, 18)}${u ? `<img src="${esc(u)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-some-se-falhar />` : ''}</span>`;
}
function linhaPeca(p, extra = '') {
  return `
    <div class="sm-linha">
      <span class="sm-data">${esc(diaCurto(p?.dia))}</span>
      ${pillPeca(p?.peca)}${pillTipo(p?.tipo)}
      ${texto(p?.pilarNome) ? `<span class="sm-pilar">${esc(p.pilarNome)}</span>` : ''}
      ${extra}
    </div>`;
}

// ── seções, na ordem do Relatorio ────────────────────────────────────────
function secaoResumo(rel) {
  const r = rel.resumo ?? {};
  const partes = partesPublicadas(r.publicadas);
  const mb = metas(r.metasBatidas);
  const antes = metas(r.anterior?.metasBatidas);
  const taxa = mb ? taxaDe(mb) : null;
  // taxaAcerto e pctNaoSeguidores vêm de 0 a 100 (relatorio-motor.mjs)
  const pctAcerto = finito(taxa) ? taxa * 100 : finito(r.taxaAcerto) ? r.taxaAcerto : null;
  // peça com menos de 7 dias, com anúncio ou sem base fica fora da conta da meta e é dita à parte; nenhuma peça
  // com base: a taxa não existe ("0 de 0" não é zero, é sem dado)
  const detalheMetas = [
    ...foraDaConta(r, mb).map((t) => `<span>${esc(t)}</span>`),
    finito(pctAcerto) ? `<span>${esc(`${pct(pctAcerto, { casas: 0 })} das peças com base`)}</span>` : '',
    antes && antes.de > 0 ? delta(taxa, taxaDe(antes), `${num(antes.n)} de ${num(antes.de)}`) : '',
  ].join('');
  const scoreAntes = r.anterior?.medianaScore;
  return secao('resumo', 'Resumo', `
    <dl class="sm-kpis">
      ${kpi('Peças publicadas', num(totalPublicadas(r.publicadas)), partes.length ? `<span>${esc(emLista(partes))}</span>` : '')}
      ${kpi('Bateram a meta de 2×', mb && mb.de > 0 ? `${num(mb.n)} de ${num(mb.de)}` : SEM_DADO, detalheMetas)}
      ${kpi('Mediana contra a base', vezesDe(r.medianaScore), finito(scoreAntes) ? delta(r.medianaScore, scoreAntes, vezesDe(scoreAntes)) : '')}
    </dl>
    ${frasesHtml(r.frases)}`);
}

function objetivoHtml(o) {
  const rot = texto(o.rotulo) || 'Métrica do tipo';
  const notas = [
    finito(o.base) ? '' : 'ainda sem base de comparação',
    o.provisorio ? 'número provisório: a peça ainda não fez 7 dias' : '',
    finito(o.ritmo) ? `no ritmo das outras na mesma idade: ${vezesDe(o.ritmo)} a base` : '',
    o.baseDe === 'formato' ? 'base do mesmo formato, porque ainda há poucas peças do mesmo tipo' : '',
  ].filter(Boolean);
  return `
    <div class="sm-objetivo">
      <span class="sm-rotulo">${esc(rot)}</span>
      ${medidor({ valor: o.valor, base: o.base, meta: o.meta, formato: qtd, rotulo: rot })}
      ${notas.length ? `<p class="sm-nota">${esc(maiuscula(notas.join('; ')))}.</p>` : ''}
    </div>`;
}
function porqueHtml(pq) {
  const col = (lado, titulo, fs) => (fs.length
    ? `<div class="sm-porque-col" data-lado="${lado}"><span class="sm-rotulo">${titulo}</span><ul>${fs.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div>`
    : '');
  const bem = lista(pq?.bem).map(frase).filter(Boolean);
  const mal = lista(pq?.mal).map(frase).filter(Boolean);
  return bem.length || mal.length ? `<div class="sm-porque">${col('bem', 'Por que foi bem', bem)}${col('mal', 'Por que foi mal', mal)}</div>` : '';
}
function etapasHtml(p) {
  const forte = nomeEtapa(p?.forte);
  const gargalo = nomeEtapa(p?.gargalo);
  if (!forte && !gargalo) return '';
  return `<p class="sm-etapas">${forte ? `<span class="pill mc-nivel" data-nivel="acima"><b aria-hidden="true">↑</b>ponto forte: ${esc(forte)}</span>` : ''}${gargalo ? `<span class="pill mc-nivel" data-nivel="abaixo"><b aria-hidden="true">↓</b>gargalo: ${esc(gargalo)}</span>` : ''}</p>`;
}
function linksHtml(p, id, o) {
  const link = https(p?.permalink);
  const partes = [
    id ? `<a class="btn btn-sm btn-fantasma" href="#/instagram/metricas/diagnostico?post=${id}" data-foco="dg:${id}">${icone('grafico', 14)} Ver no diagnóstico</a>` : '',
    id && o.aoAnalisar && p?.peca === 'reel' ? `<button type="button" class="btn btn-sm btn-fantasma" data-sm-analisar="${id}" data-foco="an:${id}">${icone('play', 14)} Análise do vídeo</button>` : '',
    link ? `<a class="btn btn-sm btn-fantasma" href="${esc(link)}" target="_blank" rel="noopener noreferrer"${id ? ` data-foco="ig:${id}"` : ''}>${icone('instagram', 14)} Abrir no Instagram<span class="sr-only"> (abre em outra aba)</span></a>` : '',
  ].filter(Boolean);
  return partes.length ? `<div class="sm-links">${partes.join('')}</div>` : '';
}
function pecaHtml(p, dest, o) {
  const obj = p?.objetivo && typeof p.objetivo === 'object' ? p.objetivo : {};
  const id = RE_MIDIA.test(String(p?.midiaId ?? '')) ? String(p.midiaId) : '';
  const qual = id && String(dest.melhor ?? '') === id ? 'melhor' : id && String(dest.pior ?? '') === id ? 'pior' : '';
  const bateu = finito(obj.base) ? (p?.bateuMeta ?? obj.bateuMeta ?? null) : null;
  const selo = `${qual ? `<span class="pill sm-selo" data-destaque="${qual}">${qual === 'melhor' ? 'melhor da semana' : 'pior da semana'}</span>` : ''}${p?.impulsionado === true ? SELO_ANUNCIO : ''}`;
  // sem o valor, a pílula diria "sem base" com base na mão: o medidor já mostra o "sem dado"
  const veredito = finito(obj.valor) ? pillMeta(bateu, obj.score) : '';
  return `
    <li class="sm-peca"${qual ? ` data-destaque="${qual}"` : ''}>
      <div class="sm-peca-topo">
        ${thumbHtml(p?.thumb, p?.peca)}
        <div class="sm-peca-info">
          ${linhaPeca(p, selo)}
          <h4 class="sm-peca-titulo">${esc(tituloPeca(p))}</h4>
        </div>
        ${veredito ? `<div class="sm-peca-veredito">${veredito}</div>` : ''}
      </div>
      ${objetivoHtml(obj)}
      ${porqueHtml(p?.porque)}
      ${etapasHtml(p)}
      ${linksHtml(p, id, o)}
    </li>`;
}
function secaoPecas(rel, o) {
  const pecas = lista(rel.pecas).filter((p) => p && typeof p === 'object');
  return secao('pecas', 'Peças da semana', pecas.length
    ? `<ol class="sm-pecas">${pecas.map((p) => pecaHtml(p, rel.destaques ?? {}, o)).join('')}</ol>`
    : nada('Nenhuma peça publicada nesta semana.'), pecas.length ? contador(pecas.length, 'peça', 'peças') : '');
}

function secaoDestaques(rel) {
  const d = rel.destaques ?? {};
  const pecas = lista(rel.pecas);
  const achar = (id) => (id == null ? null : pecas.find((p) => p && String(p.midiaId) === String(id)) ?? null);
  const melhor = achar(d.melhor);
  const pior = achar(d.pior);
  // o destaque sai só de peça com 7 dias ou mais, sem anúncio e com base (relatorio-motor): diz a regra toda
  if (!melhor && !pior) return secao('destaques', 'Destaques', nada('Sem destaque: ele sai só de peça com 7 dias ou mais, sem anúncio e com base pra comparar.'));
  const cartao = (qual, rotulo, p) => {
    const o = p.objetivo ?? {};
    const bateu = typeof p.bateuMeta === 'boolean' ? p.bateuMeta : typeof o.bateuMeta === 'boolean' ? o.bateuMeta : null;
    // parênteses em vez de vírgula: "7, 2,3×" se lê como três números
    const nums = `${texto(o.rotulo) || 'Métrica do tipo'}: ${qtd(o.valor)}${finito(o.score) ? ` (${vezesDe(o.score, { bateu })} a base)` : ''}`;
    return `
      <div class="sm-dest" data-destaque="${qual}">
        <span class="sm-rotulo">${esc(rotulo)}</span>
        <strong class="sm-dest-titulo">${esc(tituloPeca(p, true))}</strong>
        <p class="sm-dest-num">${esc(nums)}</p>
      </div>`;
  };
  const corpo = melhor && melhor === pior
    ? cartao('melhor', 'Única peça com base', melhor)
    : `${melhor ? cartao('melhor', 'Melhor da semana', melhor) : ''}${pior ? cartao('pior', 'Pior da semana', pior) : ''}`;
  return secao('destaques', 'Destaques', `<div class="sm-dests">${corpo}</div>`);
}

function insightHtml(i) {
  const acao = ACAO[i.acao] ? i.acao : '';
  return `
    <li class="sm-insight"${acao ? ` data-acao="${acao}"` : ''}>
      <div class="sm-linha">${acao ? `<span class="pill sm-acao" data-acao="${acao}">${esc(ACAO[acao])}</span>` : ''}${i.evidencia ? pillEvidencia(i.evidencia) : ''}</div>
      ${texto(i.titulo) ? `<strong class="sm-insight-titulo">${esc(i.titulo)}</strong>` : ''}
      ${texto(i.texto) ? `<p>${esc(i.texto)}</p>` : ''}
    </li>`;
}
function hipoteseHtml(h) {
  if (typeof h === 'string') return `<li class="sm-hip"><p class="sm-hip-texto">${esc(h)}</p></li>`;
  const reel = RE_REEL.test(String(h?.reelId ?? '')) ? h.reelId : '';
  const veredito = vereditoHip(h);
  return `
    <li class="sm-hip">
      <p class="sm-hip-texto">${esc(texto(h?.texto) || SEM_DADO)}</p>
      ${veredito ? `<p class="sm-hip-veredito">${esc(veredito)}</p>` : ''}
      ${reel ? `<a class="sm-link" href="#/reel/${reel}" data-foco="hip:${esc(texto(h.id) || reel)}">${esc(texto(h.reelTitulo) || 'Abrir a peça')}</a>` : ''}
    </li>`;
}
function secaoMecanismos(rel) {
  const m = rel.mecanismos ?? {};
  const ins = lista(m.insights).filter((i) => i && (texto(i.titulo) || texto(i.texto)));
  const h = m.hipoteses ?? {};
  const grupos = GRUPOS_HIP.map(([k, nome]) => [k, nome, lista(h[k]).filter(Boolean)]).filter(([, , xs]) => xs.length);
  const abertas = finito(h.abertas) ? h.abertas : Array.isArray(h.abertas) ? h.abertas.length : 0;
  const hips = grupos.length
    ? `<div class="sm-hips">${grupos.map(([k, nome, xs]) => `
        <div class="sm-hip-grupo" data-grupo="${k}">
          <h5 class="sm-h5">${esc(nome)} <span class="sm-n">${xs.length}</span></h5>
          <ul>${xs.map(hipoteseHtml).join('')}</ul>
        </div>`).join('')}</div>`
    : nada('Nenhuma hipótese ganhou veredito nesta semana.');
  const emTeste = abertas > 0 ? `<p class="sm-nota">${esc(plural(abertas, 'hipótese segue em teste', 'hipóteses seguem em teste'))}: o veredito sai quando a peça fizer 7 dias.</p>` : '';
  return secao('mecanismos', 'Mecanismos e hipóteses', `
    <div class="sm-sub-secao">
      <h4 class="sm-h4">O que os números mostram</h4>
      ${ins.length ? `<ul class="sm-insights">${ins.map(insightHtml).join('')}</ul>` : nada('Nada com evidência nesta semana.')}
    </div>
    <div class="sm-sub-secao">
      <h4 class="sm-h4">Hipóteses</h4>
      ${hips}${emTeste}
    </div>`);
}

// seguidores da semana (seguidoresDaSemana do relatorio-motor): a variação é a do servidor, que fica null com
// uma leitura só (fim menos início do mesmo dia daria um 0 inventado); os rótulos levam o dia de cada leitura
function secaoPublico(rel) {
  const p = rel.publico ?? {};
  const s = p.seguidores ?? {};
  const varia = finito(s.variacao) ? s.variacao : null;
  const fim = diaLeitura(s.diaFim);
  const ini = diaLeitura(s.diaInicio);
  const duas = finito(varia) && finito(s.inicio);
  const antes = duas ? `eram ${num(s.inicio)} ${ini && ini !== fim ? `em ${ini}` : 'na primeira leitura da semana'}` : '';
  const detalheVaria = duas && ini && fim && ini !== fim
    ? `de ${ini} a ${fim}`
    : !finito(varia) && finito(s.fim) ? 'uma leitura só na semana' : '';
  return secao('publico', 'Público', `
    <dl class="sm-kpis">
      ${kpi(fim ? `Seguidores em ${fim}` : 'Seguidores na última leitura da semana', num(s.fim), antes ? `<span>${esc(antes)}</span>` : '')}
      ${kpi('Variação na semana', finito(varia) ? `${varia > 0 ? '+' : ''}${num(varia)}` : SEM_DADO, detalheVaria ? `<span>${esc(detalheVaria)}</span>` : '')}
      ${kpi('Alcance de quem não segue', pct(p.pctNaoSeguidores))}
    </dl>
    ${frasesHtml(p.frases)}`);
}

function secaoStories(rel) {
  const s = rel.stories;
  if (!s || typeof s !== 'object') return secao('stories', 'Stories', nada('Sem stories medidos nesta semana.'));
  const dias = Array.isArray(s.dias) ? s.dias.length : s.dias;
  return secao('stories', 'Stories', `
    ${texto(s.frase) ? `<p class="sm-linha-texto">${esc(s.frase)}</p>` : ''}
    <dl class="sm-kpis sm-kpis-miudos">
      ${kpi('Dias com stories', num(dias))}
      ${kpi('Views', num(s.views))}
      ${kpi('Saídas', num(s.saidas))}
      ${kpi('Respostas', num(s.respostas))}
      ${kpi('Cliques no link', num(s.cliques))}
    </dl>`);
}

function proximaHtml(p) {
  const id = RE_REEL.test(String(p.reelId ?? '')) ? p.reelId : '';
  const titulo = texto(p.titulo) || 'Peça sem título';
  const m = p.meta && typeof p.meta === 'object' ? p.meta : null;
  const recs = lista(p.recomendacoes).map(frase).filter(Boolean);
  const meta = m && finito(m.meta)
    ? `${esc(texto(m.rotulo) || 'Métrica do tipo')}: <b>${esc(qtd(m.meta))}</b> (base ${esc(qtd(m.base))})`
    : 'ainda sem base pra este tipo';
  return `
    <li class="sm-proxima">
      ${linhaPeca(p)}
      <h4 class="sm-peca-titulo">${id ? `<a href="#/reel/${id}" data-foco="reel:${id}">${esc(titulo)}</a>` : esc(titulo)}</h4>
      <p class="sm-meta-linha"><span class="sm-rotulo">Meta</span><span>${meta}</span></p>
      ${recs.length
        ? `<ul class="sm-recs" aria-label="Recomendações pra ${esc(titulo)}">${recs.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`
        : '<p class="sm-nota">Sem recomendação com evidência pra esta peça ainda.</p>'}
    </li>`;
}
function secaoProxima(rel) {
  const ps = lista(rel.proximaSemana).filter((p) => p && typeof p === 'object');
  return secao('proxima', 'Próxima semana', ps.length
    ? `<ol class="sm-proximas">${ps.map(proximaHtml).join('')}</ol>`
    : nada('Nenhuma peça no cronograma pra próxima semana.'), ps.length ? contador(ps.length, 'peça', 'peças') : '');
}

function fraseLeituraHtml(f, i, fatos, abertos) {
  const ids = [...new Set(lista(f.fatos).map(String))].filter((id) => fatos.has(id));
  const chave = `f${i}`;
  return `
    <li class="sm-frase">
      <p>${esc(f.texto)}</p>
      ${ids.length ? `
        <details class="sm-fatos" data-sm-det="${chave}"${abertos?.has?.(chave) ? ' open' : ''}>
          <summary data-foco="det:${chave}">${ids.length === 1 ? 'Ver o fato citado' : `Ver os ${ids.length} fatos citados`}</summary>
          <ul>${ids.map((id) => `<li><b>${esc(id)}</b> ${esc(fatos.get(id) || SEM_DADO)}</li>`).join('')}</ul>
        </details>` : ''}
    </li>`;
}
function secaoLeitura(rel, o) {
  const l = rel.leituraIa && typeof rel.leituraIa === 'object' ? rel.leituraIa : null;
  const fatos = new Map(lista(rel.fatos).filter((f) => f && f.id != null).map((f) => [String(f.id), texto(f.texto)]));
  const frases = lista(l?.frases).filter((f) => f && texto(f.texto));
  if (!frases.length) {
    const falhou = l && l.status && l.status !== 'ok' && !o.leituraRodando;
    return secao('leitura', 'Leitura da IA', nada(o.leituraRodando
      ? 'A IA está escrevendo a leitura desta semana. Ela aparece aqui quando terminar.'
      : `${falhou ? 'A última leitura não saiu. ' : 'Ainda sem leitura. '}Em "Escrever leitura com IA", a IA lê só os fatos deste resumo e escreve frases curtas, cada uma citando o fato de onde saiu.`));
  }
  const quando = dataHora(l.em);
  const descartadas = finito(l.descartadas) && l.descartadas > 0 ? l.descartadas : 0;
  // a conferência tira frase por vários motivos (fato que não existe, sem fato citado, longa demais, número
  // fora dos fatos, passou de 6): o rodapé diz o que vale pra todos
  const rodape = `Escrita com IA${quando !== SEM_DADO ? ` em ${quando}` : ''}${texto(l.autor) ? ` por ${texto(l.autor)}` : ''}. A IA só pode citar os fatos do resumo${descartadas ? `; ${plural(descartadas, 'frase saiu', 'frases saíram')} por não passar na conferência com os fatos citados` : ''}.`;
  return secao('leitura', 'Leitura da IA', `
    <ol class="sm-leitura">${frases.map((f, i) => fraseLeituraHtml(f, i, fatos, o.abertos)).join('')}</ol>
    <p class="sm-nota">${esc(rodape)}</p>`);
}

// o relatório inteiro, seções na ordem do Relatorio (SPEC §3.8). o = { abertos, aoAnalisar, leituraRodando }
export function relatorioHtml(rel, o = {}) {
  if (!rel || typeof rel !== 'object') return '';
  return `
    <div class="sm-corpo">
      ${secaoResumo(rel)}
      ${secaoPecas(rel, o)}
      ${secaoDestaques(rel)}
      ${secaoMecanismos(rel)}
      ${secaoPublico(rel)}
      ${secaoStories(rel)}
      ${secaoProxima(rel)}
      ${secaoLeitura(rel, o)}
    </div>`;
}

// ── topo, estado e a aba inteira ─────────────────────────────────────────
function opcoesHtml(v, hoje) {
  const comResumo = new Set(lista(v.semanas).filter(semanaOk));
  const todas = new Set(comResumo);
  for (const s of [hoje, somarSemanas(hoje, -1), v.atual, v.semana]) if (semanaOk(s)) todas.add(s);
  const anoHoje = String(hoje ?? '').slice(0, 4);
  return [...todas].sort().reverse().map((s) => {
    // rótulo curto: a lista mede pelo maior, e a semana em andamento quase nunca tem resumo
    const marca = s >= hoje ? 'parcial' : comResumo.has(s) ? '' : 'sem resumo';
    const rot = `${rotuloSemana(s)}${s.slice(0, 4) !== anoHoje ? ` de ${s.slice(0, 4)}` : ''}${marca ? ` (${marca})` : ''}`;
    return `<option value="${s}"${s === v.semana ? ' selected' : ''}>${esc(rot)}</option>`;
  }).join('');
}
function geradoHtml(rel) {
  const quando = dataHora(rel.geradoEm);
  // 'agenda' e 'manual' são os valores sem pessoa que o servidor grava
  const por = rel.geradoPor === 'agenda' ? 'automático' : rel.geradoPor === 'manual' ? 'no Gerar agora' : texto(rel.geradoPor) ? `por ${texto(rel.geradoPor)}` : '';
  const partes = [quando !== SEM_DADO ? `em ${quando}` : '', por].filter(Boolean);
  return partes.length ? `Gerado ${partes.join(', ')}` : 'Resumo gerado';
}
// uma geração por vez na aba: com outra semana gerando, o "Gerar agora" desta fica travado e diz por quê
const gerandoOutraDe = (v) => (semanaOk(v.gerandoOutra) && v.gerandoOutra !== v.semana ? v.gerandoOutra : null);
const DICA_GERAR = 'Monta o resumo desta semana agora, com os números de hoje';
const esperaGerar = (outra) => `Espere: gerando o resumo da semana de ${rotuloSemana(outra)}`;
function atributosGerar(v) {
  if (v.gerando) return ' aria-disabled="true" aria-busy="true"';
  return gerandoOutraDe(v) ? ' aria-disabled="true"' : '';
}

function topoHtml(v, rel, hoje) {
  const s = semanaOk(v.semana) ? v.semana : null;
  const parcial = Boolean(s && s >= hoje);
  const periodo = periodoDe(rel, s);
  const rodando = v.pedindoLeitura || faseLeitura(v.leitura) === 'rodando';
  const sub = rel ? geradoHtml(rel) : s && v.temDados ? 'Ainda sem resumo gerado' : '';
  const ocupado = (sim) => (sim ? ' aria-disabled="true" aria-busy="true"' : '');
  const outra = gerandoOutraDe(v);
  return `
    <div class="sm-topo">
      <div class="sm-cab">
        <h2 class="sm-h2" id="sm-titulo">${esc(periodo ? `Semana de ${periodo}` : 'Resumo da semana')}${parcial ? ' <span class="pill pill-alerta sm-parcial" tabindex="0" data-mc-dica="A semana ainda não acabou: os números mudam até domingo.">parcial</span>' : ''}</h2>
        ${sub ? `<p class="sm-sub">${esc(sub)}</p>` : ''}
      </div>
      <div class="sm-controles">
        <div class="sm-semana" role="group" aria-label="Escolher a semana">
          <button type="button" class="btn-icone btn-sm" data-sm-mover="-1" data-foco="ant" aria-label="Semana anterior"${s ? '' : ' disabled'}>${icone('chevron-esq', 16)}</button>
          <label class="sr-only" for="sm-sel">Semana</label>
          <select class="campo sm-sel" id="sm-sel" data-foco="sel"${s ? '' : ' disabled'}>${s ? opcoesHtml(v, hoje) : ''}</select>
          <button type="button" class="btn-icone btn-sm" data-sm-mover="1" data-foco="prox" aria-label="Próxima semana"${s && s < hoje ? '' : ' disabled'}>${icone('chevron-dir', 16)}</button>
        </div>
        <div class="sm-acoes">
          <button type="button" class="btn btn-sm" data-sm-gerar data-foco="gerar"${s ? '' : ' disabled'}${atributosGerar(v)} data-mc-dica="${esc(outra ? esperaGerar(outra) : DICA_GERAR)}">${icone('gerar', 14)} Gerar agora</button>
          <button type="button" class="btn btn-sm" data-sm-leitura data-foco="leitura"${rel ? '' : ' disabled'}${ocupado(rel && rodando)} data-mc-dica="A IA lê só os fatos do resumo e escreve frases curtas, cada uma citando o fato">${icone('raio', 14)} ${rel?.leituraIa ? 'Refazer leitura com IA' : 'Escrever leitura com IA'}</button>
          <button type="button" class="btn btn-sm" data-sm-copiar data-foco="copiar"${rel ? '' : ' disabled'} data-mc-dica="Texto puro, pronto pra colar no WhatsApp">${icone('copiar', 14)} Copiar resumo</button>
        </div>
      </div>
    </div>`;
}
function statusHtml(v) {
  const giro = '<span class="ig-giro" aria-hidden="true"></span>';
  if (v.gerando) return `${giro}<span>Gerando o resumo desta semana…</span>`;
  const outra = gerandoOutraDe(v);
  if (outra) return `${giro}<span>${esc(`Gerando o resumo da semana de ${rotuloSemana(outra)}. O Gerar agora desta semana volta quando ele terminar.`)}</span>`;
  if (v.pedindoLeitura || faseLeitura(v.leitura) === 'rodando') return `${giro}<span>A IA está escrevendo a leitura. Pode seguir usando o app.</span>`;
  if (v.erroLeitura) return `<span class="sm-erro">${icone('alerta', 16)}<span>${esc(v.erroLeitura)}</span></span>`;
  return '';
}
function conteudoHtml(v, rel, hoje) {
  if (v.erro && !v.temDados) {
    return `<div class="card sm-vazio">${vazio('Não consegui ler o resumo', v.erro, '<button type="button" class="btn btn-sm" data-sm-tentar data-foco="tentar">Tentar de novo</button>')}</div>`;
  }
  if (!v.temDados) return '<p class="ig-carregando-txt" role="status"><span class="ig-giro" aria-hidden="true"></span>Carregando o resumo…</p>';
  if (!rel) {
    const parcial = semanaOk(v.semana) && v.semana >= hoje;
    const txt = `O resumo da semana sai toda segunda às 7h, ou agora em Gerar agora.${parcial ? ' Esta semana ainda não acabou: o resumo de agora sai parcial.' : ''}`;
    const botao = `<button type="button" class="btn btn-sm btn-primario" data-sm-gerar data-foco="gerar-vazio"${atributosGerar(v)}>${icone('gerar', 14)} Gerar agora</button>`;
    return `<div class="card sm-vazio">${vazio('Ainda não tem resumo desta semana', txt, semanaOk(v.semana) ? botao : '')}</div>`;
  }
  return relatorioHtml(rel, { abertos: v.abertos, aoAnalisar: v.aoAnalisar, leituraRodando: v.pedindoLeitura || faseLeitura(v.leitura) === 'rodando' });
}
// a aba inteira a partir do estado (puro: sem DOM nem rede). v = { semana, atual, semanas, hoje, relatorio,
// temDados, leitura, erro, gerando, gerandoOutra, pedindoLeitura, erroLeitura, abertos, aoAnalisar };
// gerando: esta semana está sendo gerada; gerandoOutra: a semana (AAAA-Www) que está gerando, se for outra
export function semanalHtml(v = {}) {
  const hoje = semanaOk(v.hoje) ? v.hoje : semanaDeHoje();
  const rel = v.relatorio && typeof v.relatorio === 'object' ? v.relatorio : null;
  return `
    <section class="sm-aba" aria-labelledby="sm-titulo">
      ${topoHtml(v, rel, hoje)}
      <div class="sm-status" role="status" aria-live="polite">${statusHtml(v)}</div>
      <div class="sm-conteudo"${v.temDados || v.erro ? '' : ' aria-busy="true"'}>${conteudoHtml(v, rel, hoje)}</div>
    </section>`;
}

// ── copiar pro WhatsApp ──────────────────────────────────────────────────
// "Salvamentos: 7 (meta 7, base 3). Bateu a meta de 2×."; sem valor, só o "sem dado"
function linhaObjetivo(o, bateu) {
  const rot = texto(o.rotulo) || 'Métrica do tipo';
  const provisorio = o.provisorio ? ' Número provisório: a peça ainda não fez 7 dias.' : '';
  if (!finito(o.valor)) return `${rot}: ${SEM_DADO}.`;
  if (!finito(o.base)) return `${rot}: ${qtd(o.valor)}. Ainda sem base pra comparar.${provisorio}`;
  // quem não bateu fica no fator truncado (1,96× é "1,9×"), nunca "Ficou em 2×"
  const veredito = bateu ? 'Bateu a meta de 2×.' : finito(o.score) ? `Ficou em ${vezesDe(o.score, { bateu: false })} a base.` : 'Não bateu a meta de 2×.';
  return `${rot}: ${qtd(o.valor)} (meta ${qtd(o.meta)}, base ${qtd(o.base)}). ${veredito}${provisorio}`;
}
// texto puro: título em maiúsculas, item com "•", subitem recuado; nada de markdown nem travessão
export function textoResumo(rel) {
  if (!rel || typeof rel !== 'object') return '';
  const limpo = (s) => semTraco(String(s ?? '')).replace(/\s+/g, ' ').trim();
  const item = (s) => `• ${limpo(s)}`;
  const sub = (s) => `   • ${limpo(s)}`;
  const L = [`RESUMO DA SEMANA: ${periodoDe(rel, rel.semana) || SEM_DADO}`];
  const bloco = (titulo, linhas) => {
    const ls = linhas.filter(Boolean);
    if (ls.length) L.push('', titulo, ...ls);
  };

  const r = rel.resumo ?? {};
  const partes = partesPublicadas(r.publicadas);
  const mb = metas(r.metasBatidas);
  const antes = metas(r.anterior?.metasBatidas);
  const taxa = taxaDe(mb);
  const fora = foraDaConta(r, mb);
  bloco('RESUMO', [
    item(`Peças publicadas: ${num(totalPublicadas(r.publicadas))}${partes.length ? ` (${emLista(partes)})` : ''}`),
    item(`Bateram a meta de 2×: ${mb && mb.de > 0 ? `${num(mb.n)} de ${num(mb.de)}${finito(taxa) ? ` (${pct(taxa * 100, { casas: 0 })})` : ''}${fora.length ? `; ${fora.join('; ')}` : ''}` : mb ? `${SEM_DADO} (${fora.join('; ') || 'nenhuma peça com base'})` : SEM_DADO}${antes && antes.de > 0 ? `; na semana anterior, ${num(antes.n)} de ${num(antes.de)}` : ''}`),
    item(`Mediana contra a base: ${vezesDe(r.medianaScore)}${finito(r.anterior?.medianaScore) ? `; na semana anterior, ${vezesDe(r.anterior.medianaScore)}` : ''}`),
    ...lista(r.frases).map(frase).filter(Boolean).map(item),
  ]);

  const pecas = lista(rel.pecas).filter((p) => p && typeof p === 'object');
  bloco('PEÇAS DA SEMANA', pecas.length ? pecas.flatMap((p) => {
    const o = p.objetivo && typeof p.objetivo === 'object' ? p.objetivo : {};
    const bateu = finito(o.base) ? (p.bateuMeta ?? o.bateuMeta ?? null) : null;
    return [
      item(`${cabecaPeca(p)}: ${tituloPeca(p)}${p.impulsionado === true ? ' (teve anúncio, fora da conta da semana)' : ''}`),
      sub(linhaObjetivo(o, bateu)),
      ...lista(p.porque?.bem).map(frase).filter(Boolean).slice(0, 2).map((f) => sub(`Foi bem: ${f}`)),
      ...lista(p.porque?.mal).map(frase).filter(Boolean).slice(0, 2).map((f) => sub(`Foi mal: ${f}`)),
    ];
  }) : [item('Nenhuma peça publicada nesta semana.')]);

  const d = rel.destaques ?? {};
  const achar = (id) => (id == null ? null : pecas.find((p) => String(p.midiaId) === String(id)) ?? null);
  const bateuDe = (p) => (typeof p.bateuMeta === 'boolean' ? p.bateuMeta : typeof p.objetivo?.bateuMeta === 'boolean' ? p.objetivo.bateuMeta : null);
  const destaque = (rotulo, p) => (p ? item(`${rotulo}: ${tituloPeca(p, true)}${finito(p.objetivo?.score) ? ` (${vezesDe(p.objetivo.score, { bateu: bateuDe(p) })} a base)` : ''}`) : '');
  bloco('DESTAQUES', [destaque('Melhor', achar(d.melhor)), achar(d.pior) !== achar(d.melhor) ? destaque('Pior', achar(d.pior)) : '']);

  const m = rel.mecanismos ?? {};
  bloco('O QUE OS NÚMEROS MOSTRAM', lista(m.insights).filter((i) => i && (texto(i.titulo) || texto(i.texto))).map((i) => {
    const ev = EVIDENCIA[i.evidencia] && !/evid[eê]ncia/i.test(texto(i.texto)) ? ` (${EVIDENCIA[i.evidencia]})` : '';
    return item(`${ACAO[i.acao] ? `${ACAO[i.acao]}: ` : ''}${[texto(i.titulo).replace(/[.!?]+$/, ''), texto(i.texto)].filter(Boolean).join('. ')}${ev}`);
  }));
  const h = m.hipoteses ?? {};
  const abertas = finito(h.abertas) ? h.abertas : Array.isArray(h.abertas) ? h.abertas.length : 0;
  bloco('HIPÓTESES', [
    ...GRUPOS_HIP.flatMap(([k, , rotulo]) => lista(h[k]).filter(Boolean).map((x) => (typeof x === 'string'
      ? item(`${rotulo}: ${x}`)
      : item(`${rotulo}: ${[texto(x.texto), vereditoHip(x)].filter(Boolean).join(' ')}`)))),
    abertas > 0 ? item(plural(abertas, 'hipótese segue em teste', 'hipóteses seguem em teste')) : '',
  ]);

  const pb = rel.publico ?? {};
  const sg = pb.seguidores ?? {};
  // a variação é a do servidor (null com uma leitura só); o texto diz o dia de cada leitura
  const varia = finito(sg.variacao) ? sg.variacao : null;
  const diaFim = diaLeitura(sg.diaFim);
  const diaIni = diaLeitura(sg.diaInicio);
  const mudou = finito(varia) ? `${varia === 0 ? 'sem mudança' : `${varia > 0 ? '+' : ''}${num(varia)}`}${diaIni && diaIni !== diaFim ? ` desde ${diaIni}` : ' na semana'}` : 'uma leitura só na semana';
  bloco('PÚBLICO', [
    item(finito(sg.fim) ? `Seguidores${diaFim ? ` em ${diaFim}` : ''}: ${num(sg.fim)} (${mudou})` : `Seguidores: ${SEM_DADO}`),
    item(`Alcance de quem não segue: ${pct(pb.pctNaoSeguidores)}`),
    ...lista(pb.frases).map(frase).filter(Boolean).map(item),
  ]);

  const s = rel.stories && typeof rel.stories === 'object' ? rel.stories : null;
  bloco('STORIES', s ? [
    texto(s.frase) ? item(s.frase) : '',
    item(`Views: ${num(s.views)} · Saídas: ${num(s.saidas)} · Respostas: ${num(s.respostas)} · Cliques no link: ${num(s.cliques)}`),
  ] : [item('Sem stories medidos nesta semana.')]);

  bloco('PRÓXIMA SEMANA', lista(rel.proximaSemana).filter((p) => p && typeof p === 'object').flatMap((p) => {
    const mt = p.meta && typeof p.meta === 'object' ? p.meta : null;
    return [
      item(`${cabecaPeca(p)}: ${texto(p.titulo) || 'Peça sem título'}`),
      sub(mt && finito(mt.meta) ? `Meta: ${texto(mt.rotulo) || 'métrica do tipo'}, ${qtd(mt.meta)} (base ${qtd(mt.base)})` : 'Meta: ainda sem base pra este tipo'),
      ...lista(p.recomendacoes).map(frase).filter(Boolean).map(sub),
    ];
  }));

  bloco('LEITURA DA IA', lista(rel.leituraIa?.frases).map(frase).filter(Boolean).map(item));
  return L.join('\n').trim();
}

// ── dados ────────────────────────────────────────────────────────────────
const corrente = () => (semanaOk(st.corrente) ? st.corrente : semanaDeHoje());
const padrao = () => st.semanas[0] ?? somarSemanas(corrente(), -1);

function guardarLista(d) {
  const ss = lista(d?.semanas).map((x) => (typeof x === 'string' ? x : x?.semana)).filter(semanaOk);
  st.semanas = [...new Set(ss)].sort().reverse();
  if (semanaOk(d?.atual)) st.atual = d.atual;
  if (semanaOk(d?.corrente)) st.corrente = d.corrente;
}

// sem semana: o servidor devolve a mais nova. Com dado na mão, só atualiza por baixo (forcar)
async function carregar(semana, { forcar = false } = {}) {
  const chave = semana ?? '';
  if (st.carregando.has(chave) || (!forcar && semana && st.dados.has(semana))) return;
  st.carregando.add(chave);
  st.erro.delete(chave);
  let d = null;
  try {
    d = await api('GET', `/api/metricas/semanal${semana ? `?semana=${encodeURIComponent(semana)}` : ''}`);
  } catch (e) {
    st.erro.set(chave, e.message);
  }
  st.carregando.delete(chave);
  if (d) {
    guardarLista(d);
    const rel = d.relatorio && typeof d.relatorio === 'object' ? d.relatorio : null;
    // sem semana pedida, vale a que o servidor escolheu (atual); o resto é rede de segurança
    const s = semana ?? (semanaOk(d.atual) ? d.atual : semanaOk(rel?.semana) ? rel.semana : padrao());
    if (s) st.dados.set(s, { relatorio: rel, leitura: d.leitura ?? null });
    if (!st.semana && s) st.semana = s;
  }
  if (!semana || semana === st.semana) {
    desenhar();
    acompanhar();
  }
}

// cache velho (depois do "Sincronizar agora"): a próxima montagem busca de novo
export function invalidar() {
  st.dados.clear();
  st.erro.clear();
}

// ── acompanhar a leitura com IA ──────────────────────────────────────────
function acompanhar() {
  const s = st.semana;
  const d = s ? st.dados.get(s) : null;
  if (!d || faseLeitura(d.leitura) !== 'rodando' || st.poll?.semana === s) return;
  const seq = ++st.seqPoll;
  st.poll = { semana: s, seq, timer: setTimeout(() => passo(seq), ESPERA_MS), pausado: false };
}
async function passo(seq) {
  const p = st.poll;
  if (!p || p.seq !== seq) return;
  // saiu da aba ou trocou de semana: para; a volta retoma pelo estado que o GET da semana traz
  if (!alvo?.el?.isConnected || st.semana !== p.semana) { st.poll = null; return; }
  if (document.visibilityState !== 'visible') { p.pausado = true; return; }
  let d;
  try {
    d = await api('GET', `/api/metricas/semanal/leitura?semana=${encodeURIComponent(p.semana)}`);
  } catch (e) {
    if (st.poll?.seq !== seq) return;
    st.poll = null;
    st.erroLeitura = e.message;
    desenhar();
    return;
  }
  if (st.poll?.seq !== seq) return;
  const guardado = st.dados.get(p.semana);
  if (guardado) guardado.leitura = d?.leitura ?? null;
  const fase = faseLeitura(d?.leitura);
  if (fase === 'rodando') {
    p.timer = setTimeout(() => passo(seq), ESPERA_MS);
    return;
  }
  st.poll = null;
  if (fase === 'erro') {
    st.erroLeitura = mensagemLeitura(d.leitura);
    toast(st.erroLeitura);
    desenhar();
    return;
  }
  // acabou: o resumo volta do servidor com a leitura nova
  await carregar(p.semana, { forcar: true });
  if (st.semana === p.semana) toast('A leitura da IA ficou pronta');
}
function ouvirVisibilidade() {
  if (ouvindo) return;
  ouvindo = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !st.poll?.pausado) return;
    st.poll.pausado = false;
    passo(st.poll.seq);
  });
}

// ── ações ────────────────────────────────────────────────────────────────
function mudarSemana(s) {
  if (!semanaOk(s) || s === st.semana) return;
  st.semana = s;
  st.erroLeitura = '';
  st.abertos.clear();
  gravarEndereco(s);
  desenhar();
  carregar(s, { forcar: true });
  acompanhar();
}

async function gerar() {
  const s = st.semana;
  if (!semanaOk(s)) return;
  // uma geração por vez: a desta semana já aparece ocupada; a de outra semana é dita, nunca um clique mudo
  if (st.gerando) {
    if (st.gerando !== s) toast(`${esperaGerar(st.gerando)}.`);
    return;
  }
  st.gerando = s;
  desenhar();
  try {
    const d = await api('POST', '/api/metricas/semanal/gerar', { semana: s });
    const rel = d?.relatorio && typeof d.relatorio === 'object' ? d.relatorio : null;
    if (rel) {
      st.dados.set(s, { relatorio: rel, leitura: st.dados.get(s)?.leitura ?? null });
      if (!st.semanas.includes(s)) st.semanas = [...st.semanas, s].sort().reverse();
      toast('Resumo da semana gerado');
    } else toast('O servidor não devolveu o resumo. Tente de novo.');
  } catch (e) {
    toast(e.message);
  }
  st.gerando = null;
  desenhar();
}

async function pedirLeitura() {
  const s = st.semana;
  const atual = s ? st.dados.get(s) : null;
  if (!atual?.relatorio || st.pedindoLeitura || faseLeitura(atual.leitura) === 'rodando') return;
  st.pedindoLeitura = true;
  st.erroLeitura = '';
  desenhar();
  let fase = null;
  try {
    const d = await api('POST', '/api/metricas/semanal/leitura', { semana: s });
    const l = d?.leitura;
    fase = faseLeitura(l);
    const guardado = st.dados.get(s);
    // resposta sem estado reconhecível: acompanha uma vez, e o GET diz como ficou
    if (guardado) guardado.leitura = fase ? l : { rodando: true };
    if (fase === 'erro') st.erroLeitura = mensagemLeitura(l);
  } catch (e) {
    st.erroLeitura = e.message;
  }
  st.pedindoLeitura = false;
  desenhar();
  if (fase === 'pronto') carregar(s, { forcar: true });
  else acompanhar();
}

async function copiar() {
  const rel = st.semana ? st.dados.get(st.semana)?.relatorio : null;
  if (!rel) return;
  try {
    await navigator.clipboard.writeText(textoResumo(rel));
    toast('Resumo copiado: é só colar no WhatsApp');
  } catch {
    toast('Não consegui copiar. Tente de novo com a janela em foco.');
  }
}

// ── endereço (?semana=) ──────────────────────────────────────────────────
function semanaDoEndereco() {
  let s = null;
  try { s = new URLSearchParams(String(location.hash ?? '').split('?')[1] ?? '').get('semana'); } catch { s = null; }
  return semanaOk(s) ? s : null;
}
// replaceState não dispara hashchange: a rota fica onde está e o link passa a abrir esta semana
function gravarEndereco(s) {
  if (!/^#\/instagram\/metricas\/semanal(?:[?/]|$)/.test(String(location.hash ?? ''))) return;
  try { history.replaceState(null, '', `#/instagram/metricas/semanal?semana=${s}`); } catch { /* sem history: fica só na tela */ }
}

// ── desenho ──────────────────────────────────────────────────────────────
function estadoTela() {
  const s = st.semana;
  const d = s ? st.dados.get(s) : null;
  return {
    semana: s, atual: st.atual, semanas: st.semanas, hoje: corrente(),
    relatorio: d?.relatorio ?? null, temDados: Boolean(d), leitura: d?.leitura ?? null,
    erro: st.erro.get(s ?? '') ?? '', gerando: Boolean(s) && st.gerando === s,
    gerandoOutra: st.gerando && st.gerando !== s ? st.gerando : null,
    pedindoLeitura: st.pedindoLeitura, erroLeitura: st.erroLeitura, abertos: st.abertos,
    aoAnalisar: Boolean(alvo?.aoAnalisar),
  };
}

function desenhar() {
  if (!alvo?.el?.isConnected) return;
  const el = alvo.el;
  const ativo = document.activeElement;
  const foco = el.contains(ativo) ? ativo?.dataset?.foco ?? null : null;
  el.innerHTML = semanalHtml(estadoTela());
  ligar();
  if (!foco) return;
  // o controle que tinha o foco sumiu ou ficou desabilitado: vai pro primeiro do topo, nunca pro body
  const volta = el.querySelector(`[data-foco="${CSS.escape(foco)}"]`);
  if (volta && !volta.disabled) volta.focus({ preventScroll: true });
  else el.querySelector('.sm-topo [data-foco]:not([disabled])')?.focus({ preventScroll: true });
}

function ligar() {
  const el = alvo.el;
  el.querySelectorAll('[data-sm-mover]').forEach((b) => (b.onclick = () => mudarSemana(somarSemanas(st.semana, Number(b.dataset.smMover)))));
  const sel = el.querySelector('#sm-sel');
  if (sel) sel.onchange = () => mudarSemana(sel.value);
  // gerar() sabe dizer por que não gera (outra semana gerando); a própria semana ocupada sai calada
  el.querySelectorAll('[data-sm-gerar]').forEach((b) => (b.onclick = () => gerar()));
  el.querySelectorAll('[data-sm-leitura]').forEach((b) => (b.onclick = () => { if (b.getAttribute('aria-disabled') !== 'true') pedirLeitura(); }));
  el.querySelectorAll('[data-sm-copiar]').forEach((b) => (b.onclick = copiar));
  el.querySelectorAll('[data-sm-tentar]').forEach((b) => (b.onclick = () => {
    st.erro.delete(st.semana ?? '');
    desenhar();
    carregar(st.semana, { forcar: true });
  }));
  el.querySelectorAll('[data-sm-analisar]').forEach((b) => (b.onclick = () => {
    if (RE_MIDIA.test(b.dataset.smAnalisar ?? '')) alvo.aoAnalisar?.(b.dataset.smAnalisar);
  }));
  el.querySelectorAll('details[data-sm-det]').forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) st.abertos.add(d.dataset.smDet);
    else st.abertos.delete(d.dataset.smDet);
  }));
}

// el = <div id="ig-semanal">; opts.aoAnalisar(midiaId) abre "Por que esse reel funcionou" (views/instagram.js)
export function montar(el, opts = {}) {
  if (!el) return;
  alvo = { el, aoAnalisar: typeof opts.aoAnalisar === 'function' ? opts.aoAnalisar : null };
  ligarDicas();
  ouvirVisibilidade();
  const pedida = semanaDoEndereco();
  if (pedida && pedida !== st.semana) {
    st.semana = pedida;
    st.erroLeitura = '';
    st.abertos.clear();
  }
  desenhar();
  carregar(st.semana, { forcar: true });
  acompanhar();
}
