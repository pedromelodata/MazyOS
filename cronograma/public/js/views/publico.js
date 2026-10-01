// Métricas → Público (SPEC-METRICAS.md §5.4): quem segue, quem engaja e quem é alcançado (idade, gênero,
// cidade e país), como a conta é descoberta, crescimento, horários, personas × público real, o público de
// cada post (anúncio ligado ou tela do app, digitada ou lida de print), anúncios e o que a Meta não devolve
// pra esta conta. Os dados vêm de GET /api/metricas/publico (resumo() de server/publico.mjs, §3.6).
// Decisões:
//  - construtores de HTML e funções de dado são puros e exportados (testados no Node em
//    server/testes/front-publico.test.mjs); a ligação com o DOM fica à parte e nada mexe no DOM ao importar
//  - todo número e gráfico sai do metricas-comum.js: número ausente é "sem dado", todo gráfico tem tabela e
//    dica só por data-mc-dica; texto de fora (legenda, cidade, erro da Meta) passa por esc()
//  - as frases de público são do servidor (grupo com menos de 5 pessoas não vira frase): aqui só aparecem,
//    sempre com a fonte, a janela e a data
//  - público por post: só as frases do servidor. Sem frase, o porquê; nunca o percentual cru da linha, que
//    mostraria justamente os grupos pequenos que o servidor escondeu (revisão de 30/09)
//  - público indisponível continua no seletor, desabilitado e com o motivo escrito (não some)
//  - o resumo guardado vale 2 minutos: a agenda, o painel do Diagnóstico e os anúncios mudam o público sem
//    passar por esta aba, então montar() relê o que já passou disso
//  - o formulário do app sempre abre com os números salvos lidos na hora (GET do post), nunca do resumo
//    guardado, e o "Salvar" só destrava depois disso: salvar em cima de número velho apagaria o mais novo
//  - token de anúncio: campo password, limpo no envio e nunca reescrito no redesenho; erro da Meta passa
//    por mascarar()
//  - print: lido no navegador como data URL (PNG, JPG ou WebP, até 3, 4 MB cada, 12 MB juntos); o servidor
//    devolve uma SUGESTÃO e só o "Salvar" grava. A leitura é acompanhada a cada 2 s enquanto o painel está
//    aberto
//  - redesenho com data-foco (molde ranking.js): o foco volta pro mesmo controle depois de cada resposta
import { esc, api, icone, toast, abrirPainel, fecharPainel, BTN_FECHAR } from '../core.js';
import {
  SEM_DADO, finito, num, pct, vezesDeScore, plural, dataCurta, dataHora, haQuanto, rotuloSemana,
  pillFonte, tabela, barrasH, divergente, piramide, colunas, colunasDivergentes, empilhadas, linha, vazio,
  ligarDicas,
} from '../metricas-comum.js';

// ── constantes ───────────────────────────────────────────────────────────
// a ordem e os nomes do seletor são fixos (SPEC §5.4); o título longo vem do servidor
const BLOCOS = [
  { id: 'seguidores', nome: 'Seguidores', janela: 'últimos 30 dias' },
  { id: 'engajados-30', nome: 'Engajados 30 dias', janela: 'últimos 30 dias' },
  { id: 'engajados-7', nome: 'Engajados 7 dias', janela: 'últimos 7 dias' },
  { id: 'alcancados-30', nome: 'Alcançados 30 dias', janela: 'últimos 30 dias' },
];
const JANELAS = { this_week: 'últimos 7 dias', this_month: 'últimos 30 dias' };
const FONTES = {
  api: 'API do Instagram', instagram: 'API do Instagram', app: 'tela do app do Instagram',
  anuncio: 'anúncios da Meta', print: 'print da tela do app',
};
export const FAIXAS = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const GENERO_NOME = {
  f: 'Mulheres', female: 'Mulheres', mulheres: 'Mulheres',
  m: 'Homens', male: 'Homens', homens: 'Homens',
  u: 'Não informado', unknown: 'Não informado', outros: 'Não informado',
};
export const BASES_APP = [['visualizacoes', 'Visualizações'], ['contas-alcancadas', 'Contas alcançadas'], ['contas-engajadas', 'Contas com engajamento']];
const TIPO_CONTEUDO = { REEL: 'Reels', POST: 'Posts', CAROUSEL_CONTAINER: 'Carrosséis', STORY: 'Stories', AD: 'Anúncios' };
const TIPO_MIDIA = { REELS: 'Reel', FEED: 'Post', CAROUSEL_ALBUM: 'Carrossel' };
const RE_MIDIA = /^\d{1,40}$/;
const LUGARES = 5; // o app mostra as 5 maiores cidades e os 5 maiores países
export const PRINT = {
  max: 3, bytes: 4 * 1024 * 1024, corpo: 12 * 1024 * 1024,
  tipos: ['image/png', 'image/jpeg', 'image/webp'], passoMs: 2000, limiteMs: 5 * 60_000,
};
// etapas do job do publico.mjs (preparando, lendo, pronto, erro) e sinônimos tolerados
const ETAPAS_PRINT = {
  preparando: 'Preparando os prints', recebido: 'Recebendo os prints', recebendo: 'Recebendo os prints', enviando: 'Recebendo os prints',
  lendo: 'Lendo os números', analisando: 'Lendo os números', conferindo: 'Conferindo as somas',
};
const FIM_LEITURA = new Set(['pronto', 'pronta', 'fim', 'ok', 'concluido', 'concluida', 'feito']);
const LINK_USUARIOS_SISTEMA = 'https://business.facebook.com/settings/system-users';
// o caminho da SPEC §3.7, quando o servidor não manda os passos
const PASSOS_ANUNCIOS = [
  'No Gerenciador de Negócios, abra Usuários do sistema e escolha o usuário que o app já usa.',
  'Em Atribuir ativos, escolha Contas de anúncios, marque a conta da Legalizaí e dê a permissão Ver desempenho.',
  'Gere o token de novo com a permissão ads_read marcada.',
  'Cole o token novo aqui embaixo.',
];
const VAZIO_APP = { base: '', contas: null, genero: {}, idade: {}, cidades: [], paises: [], seguidores: null, naoSeguidores: null };
// o resumo da aba vale 2 minutos (o molde é o VELHO_MS do diagnóstico)
export const VELHO_MS = 2 * 60_000;
const ESCOLHA_POST = 'Escolha o post pra preencher os números da tela.';
const LENDO_POST = 'Lendo os números salvos deste post…';

// ── texto ────────────────────────────────────────────────────────────────
// token de acesso nunca aparece, nem dentro de mensagem de erro da Meta
export const mascarar = (s) => String(s ?? '')
  .replace(/\bEA[A-Za-z0-9]{20,}/g, '[token oculto]')
  .replace(/access_token=[^&\s"]+/gi, 'access_token=[oculto]');
const textoErro = (e) => mascarar(typeof e === 'string' ? e : e?.message || e?.erro || 'erro desconhecido');
const https = (u) => (/^https:\/\//i.test(String(u ?? '')) ? String(u) : '');
const giro = '<span class="ig-giro" aria-hidden="true"></span>';
const soma = (xs) => xs.filter(finito).reduce((a, b) => a + b, 0);
const contagem = (n, um, varios) => (finito(n) ? plural(n, um, varios) : SEM_DADO);
const fonteTexto = (f) => FONTES[String(f ?? '').toLowerCase()] ?? (String(f ?? '').trim() || SEM_DADO);
// "25-34" é chave; na tela vira "25 a 34" e "65+" vira "65 ou mais"
export const faixaTexto = (f) => String(f ?? '').replace('-', ' a ').replace(/\+$/, ' ou mais');
const ordemFaixa = (f) => { const i = FAIXAS.indexOf(String(f)); return i < 0 ? 99 : i; };
const msDe = (ts) => Date.parse(String(ts ?? '').replace(/([+-]\d{2})(\d{2})$/, '$1:$2')) || 0;
// número dentro do campo: vírgula decimal, sem separador de milhar
const fmtCampo = (v) => (finito(v) ? v.toLocaleString('pt-BR', { maximumFractionDigits: 2, useGrouping: false }) : '');

// ── dado: normalizações (puras) ──────────────────────────────────────────
// pct de cada item: o do servidor; sem ele, o valor sobre a soma da lista
export function comPct(lista) {
  const itens = (Array.isArray(lista) ? lista : []).filter((x) => x && typeof x === 'object');
  const total = soma(itens.map((x) => x.valor));
  return itens.map((x) => ({ ...x, pct: finito(x.pct) ? x.pct : finito(x.valor) && total > 0 ? (x.valor / total) * 100 : null }));
}

// gênero em lista ([{ id, rotulo, valor, pct }]) ou em objeto ({ mulheres, homens } em %)
export function generoNorm(g) {
  if (Array.isArray(g)) {
    return comPct(g).map((x) => {
      const id = String(x.id ?? x.genero ?? '').toLowerCase();
      return { id, rotulo: x.rotulo || GENERO_NOME[id] || String(x.id ?? x.genero ?? SEM_DADO), valor: finito(x.valor) ? x.valor : null, pct: x.pct };
    });
  }
  if (g && typeof g === 'object') {
    return Object.entries(g).filter(([, v]) => v != null)
      .map(([k, v]) => ({ id: k.toLowerCase(), rotulo: GENERO_NOME[k.toLowerCase()] ?? k, valor: null, pct: finito(v) ? v : null }));
  }
  return [];
}

// idade em lista ([{ faixa, valor, pct }]) ou em objeto ({ '25-34': pct }), na ordem das faixas
export function idadeNorm(i) {
  let itens = [];
  if (Array.isArray(i)) itens = comPct(i).map((x) => ({ faixa: String(x.faixa ?? x.idade ?? ''), valor: finito(x.valor) ? x.valor : null, pct: x.pct }));
  else if (i && typeof i === 'object') itens = Object.entries(i).map(([k, v]) => ({ faixa: k, valor: null, pct: finito(v) ? v : null }));
  return itens.filter((x) => x.faixa).sort((a, b) => ordemFaixa(a.faixa) - ordemFaixa(b.faixa));
}

// linhas da pirâmide em % do total. O publico.mjs manda percentual (célula com menos de 5 pessoas vem null);
// se vier contagem de contas, divide pelo total (ou pela base, se maior). Soma até 105 sem célula acima de
// 100 é percentual (21 células arredondadas em 0,1 passam um pouco de 100)
export function linhasPiramide(idadeGenero, base = null) {
  const ls = (Array.isArray(idadeGenero) ? idadeGenero : []).filter((l) => l && l.faixa != null);
  const vals = ls.flatMap((l) => [l.mulheres, l.homens, l.outros]).filter(finito);
  if (!vals.length) return [];
  const total = soma(vals);
  const jaPct = total <= 105 && vals.every((v) => v <= 100);
  const div = jaPct ? 100 : Math.max(total, finito(base) ? base : 0);
  const p = (v) => (finito(v) && div > 0 ? (v / div) * 100 : null);
  return [...ls].sort((a, b) => ordemFaixa(a.faixa) - ordemFaixa(b.faixa))
    .map((l) => ({ faixa: String(l.faixa), a: p(l.mulheres), b: p(l.homens), outros: p(l.outros) }));
}

// o bloco a mostrar: o pedido, se disponível; senão o primeiro disponível; nenhum: null
export function escolherBloco(quem, id) {
  const lista = (Array.isArray(quem) ? quem : []).filter((b) => b && b.id);
  const ok = (b) => b.disponivel !== false;
  return lista.find((b) => b.id === id && ok(b)) ?? lista.find(ok) ?? null;
}

// código de país da Graph ("BR") vira nome em português
let nomesRegiao = null;
export function nomePais(nome) {
  const t = String(nome ?? '').trim();
  if (!/^[A-Z]{2}$/.test(t)) return t;
  try {
    nomesRegiao ??= new Intl.DisplayNames(['pt-BR'], { type: 'region' });
    return nomesRegiao.of(t) || t;
  } catch {
    return t;
  }
}
const BRASIL = new Set(['br', 'brasil', 'brazil']);
// a lista de países só aparece quando tem alguém fora do Brasil
export function soBrasil(paises) {
  return comPct(paises)
    .filter((p) => p.nome && ((finito(p.pct) && p.pct > 0) || (finito(p.valor) && p.valor > 0)))
    .every((p) => BRASIL.has(String(p.nome).trim().toLowerCase()));
}

// as n horas com mais seguidores online, em ordem de hora
export function topoHoras(online, n = 3) {
  if (!Array.isArray(online)) return [];
  return online.map((v, h) => ({ v, h })).filter((x) => finito(x.v) && x.v > 0)
    .sort((a, b) => b.v - a.v || a.h - b.h).slice(0, n).map((x) => x.h).sort((a, b) => a - b);
}

// alcance por tipo de conteúdo. O publico.mjs manda { inicio, fim, dias, itens: [{ tipo, rotulo, alcance,
// pctAlcance }] }; aceita também { REEL: n } e { alcance: { REEL: n } } (no objeto, só chave de tipo da Graph)
export function itensPorTipo(porTipo) {
  const p = porTipo && typeof porTipo === 'object' ? porTipo : null;
  if (!p) return [];
  const fonte = Array.isArray(p) ? p : Array.isArray(p.itens) ? p.itens : p.alcance && typeof p.alcance === 'object' ? p.alcance : p;
  const valor = (v) => (finito(v) ? v : finito(v?.alcance) ? v.alcance : finito(v?.valor) ? v.valor : null);
  // na ponta da barra só o número (cabe no espaço da ponta); a parte do alcance vai na dica
  const item = (rotulo, v, x) => ({
    rotulo, valor: v, texto: num(v),
    dica: `${rotulo}: ${num(v)}${finito(x?.pctAlcance) && finito(v) ? ` (${pct(x.pctAlcance)} do alcance)` : ''}`,
  });
  let itens = [];
  if (Array.isArray(fonte)) {
    itens = fonte.filter((x) => x && typeof x === 'object')
      .map((x) => item(TIPO_CONTEUDO[x.tipo ?? x.id] ?? x.rotulo ?? String(x.tipo ?? x.id ?? ''), valor(x), x));
  } else {
    itens = Object.entries(fonte).filter(([k]) => /^[A-Z][A-Z_]*$/.test(k)).map(([k, v]) => item(TIPO_CONTEUDO[k] ?? k, valor(v), v));
  }
  return itens.filter((x) => x.rotulo).sort((a, b) => (b.valor ?? -1) - (a.valor ?? -1));
}

// ── "o que a Meta não devolve" (chaves de publico.json → suporte) ────────
const METRICA_DEMO = { seguidores: 'Seguidores', engajados: 'Engajados', alcancados: 'Alcançados' };
const JANELA_DEMO = { this_week: '7 dias', this_month: '30 dias' };
const QUEBRA_DEMO = { 'age,gender': 'idade e gênero cruzados', age: 'idade', gender: 'gênero', city: 'cidade', country: 'país' };
const DIARIO = {
  'alcance-seguidor': 'Alcance por dia, entre seguidores e não seguidores',
  tipo: 'Alcance e interações por dia, por tipo de conteúdo',
  'views-seguidor': 'Views por dia, entre seguidores e não seguidores',
  conta: 'Contas engajadas, interações e toques no perfil, por dia',
  seguiram: 'Quem começou e quem deixou de seguir, por dia',
};
export function rotuloSuporte(chave) {
  const k = String(chave ?? '');
  if (k === 'online_followers') return 'Horários em que os seguidores ficam online';
  const d = /^demo:([^:]+):([^:]*):(.+)$/.exec(k);
  if (d) {
    const j = JANELA_DEMO[d[2]];
    return `${METRICA_DEMO[d[1]] ?? d[1]} por ${QUEBRA_DEMO[d[3]] ?? d[3]}${j ? ` (${j})` : ''}`;
  }
  const g = /^diario:(.+)$/.exec(k);
  if (g) return DIARIO[g[1]] ?? `Leitura diária: ${g[1]}`;
  return k;
}
// o rótulo vem do servidor quando ele manda; o publico.mjs marca resposta sem número com erro 'vazio'; o
// resto é a mensagem da Meta (mascarada)
export function itensSuporte(suporte) {
  return Object.entries(suporte && typeof suporte === 'object' ? suporte : {})
    .filter(([, v]) => v && v.ok === false)
    .map(([chave, v]) => ({
      chave, rotulo: String(v.rotulo ?? '').trim() || rotuloSuporte(chave), em: v.em ?? null,
      erro: v.erro === 'vazio' ? 'A Meta respondeu sem número.' : mascarar(v.erro ?? ''),
    }))
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
}

// ── posts (lista do /api/instagram/dados) ────────────────────────────────
export function primeiraLinha(texto, max = 60) {
  const l = String(texto ?? '').split('\n').map((x) => x.trim()).find(Boolean) ?? '';
  const t = l.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const corte = t.slice(0, max);
  const i = corte.lastIndexOf(' ');
  return `${(i > max * 0.6 ? corte.slice(0, i) : corte).replace(/[\s,;:.]+$/, '')}…`;
}
export const rotuloPost = (m) => `${dataCurta(m?.timestamp)} · ${TIPO_MIDIA[m?.tipo] ?? 'Post'} · ${primeiraLinha(m?.caption) || 'sem legenda'}`;
// sem repetido e mais novo primeiro
export function ordenarPosts(posts) {
  const vistos = new Map();
  for (const m of Array.isArray(posts) ? posts : []) {
    const id = String(m?.midiaId ?? '');
    if (RE_MIDIA.test(id) && !vistos.has(id)) vistos.set(id, m);
  }
  return [...vistos.values()].sort((a, b) => msDe(b.timestamp) - msDe(a.timestamp));
}

// o público por post junta anúncio e app do mesmo post num item só, mais novo primeiro
export function agruparPorPost(porPost) {
  const grupos = new Map();
  for (const x of Array.isArray(porPost) ? porPost : []) {
    const id = String(x?.midiaId ?? '');
    if (!RE_MIDIA.test(id)) continue;
    const g = grupos.get(id) ?? { midiaId: id, dia: x.dia ?? null, titulo: '', thumb: '', permalink: '', tipo: null, fontes: [] };
    g.titulo ||= String(x.titulo ?? '').trim();
    g.thumb ||= https(x.thumb);
    g.permalink ||= https(x.permalink);
    g.tipo ??= x.tipo ?? null;
    g.dia ??= x.dia ?? null;
    g.fontes.push(x);
    grupos.set(id, g);
  }
  return [...grupos.values()].sort((a, b) => msDe(b.dia) - msDe(a.dia));
}

// qualquer forma de público do app (resumo, detalhe do post, sugestão do print) → campos do formulário (§2.3)
export function paraFormApp(x) {
  if (!x || typeof x !== 'object') return null;
  const g = generoNorm(x.genero);
  const acha = (ids) => g.find((i) => ids.includes(i.id) || ids.includes(String(i.rotulo).toLowerCase()))?.pct;
  const genero = {};
  const mulheres = acha(['f', 'female', 'mulheres']);
  const homens = acha(['m', 'male', 'homens']);
  if (finito(mulheres)) genero.mulheres = mulheres;
  if (finito(homens)) genero.homens = homens;
  const idade = {};
  for (const i of idadeNorm(x.idade)) if (FAIXAS.includes(i.faixa) && finito(i.pct)) idade[i.faixa] = i.pct;
  const lugares = (l) => (Array.isArray(l) ? l : []).filter((c) => c?.nome).slice(0, LUGARES)
    .map((c) => ({ nome: String(c.nome), pct: finito(c.pct) ? c.pct : null }));
  // contas da base: o número que a tela mostra (digitado ou lido do print), inteiro
  const contas = typeof x.contas === 'string' ? lerContas(x.contas) : x.contas;
  return {
    base: BASES_APP.some(([id]) => id === x.base) ? x.base : '',
    contas: finito(contas) && contas >= 1 ? Math.round(contas) : null,
    genero, idade, cidades: lugares(x.cidades), paises: lugares(x.paises),
    seguidores: finito(x.seguidores) ? x.seguidores : null,
    naoSeguidores: finito(x.naoSeguidores) ? x.naoSeguidores : null,
  };
}
// os números do app salvos pra um post, na resposta do GET /api/metricas/post/:id (detalhePost). O que foi
// digitado mora em publico.app.dados (a linha em si leva as frases e os grupos visíveis); sem "dados", a
// própria linha. Sem público do app: null
export function appDoDetalhe(d) {
  const app = d?.publico?.app;
  if (!app || typeof app !== 'object') return null;
  return paraFormApp(app.dados && typeof app.dados === 'object' ? app.dados : app);
}

// o resumo guardado precisa ser lido de novo: nunca lido, marcado velho ou com mais de 2 minutos
export function resumoVelho({ dados = null, velho = true, lidoEm = 0 } = {}, agora = Date.now()) {
  return !dados || Boolean(velho) || !(agora - (finito(lidoEm) ? lidoEm : 0) <= VELHO_MS);
}

// ── validação do formulário "Informar do app" (pura) ─────────────────────
// "45,5", "45.5" e "45,5%" valem; vazio é null; o resto é NaN
export function lerPct(texto) {
  const t = String(texto ?? '').replace(/\s+/g, '').replace(/%$/, '');
  if (!t) return null;
  if (!/^\d{1,3}([.,]\d{1,2})?$/.test(t)) return NaN;
  const n = Number(t.replace(',', '.'));
  return n >= 0 && n <= 100 ? n : NaN;
}

// contas da base: número inteiro de 1 pra cima ("1.234", "1234" e "1 234" valem); vazio é null; o resto é NaN
export function lerContas(texto) {
  const t = String(texto ?? '').replace(/\s+/g, '');
  if (!t) return null;
  const digitos = /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, '') : t;
  if (!/^\d{1,12}$/.test(digitos)) return NaN;
  const n = Number(digitos);
  return n >= 1 && Number.isSafeInteger(n) ? n : NaN;
}

// bruto: os campos do formulário como texto. Devolve { erros: [{ campo, msg }], corpo } (corpo null com erro).
// Somas iguais às do servidor (limparPostApp): a tela do app arredonda, então um grupo inteiro fica entre 90% e
// 102% (gênero com os dois, idade com qualquer faixa, seguidores com os dois); cidades e países até 102%
export function validarApp(bruto = {}) {
  const erros = [];
  const erro = (campo, msg) => erros.push({ campo, msg });
  const corpo = { base: null, genero: {}, idade: {}, cidades: [], paises: [] };
  let algum = false;
  if (!RE_MIDIA.test(String(bruto.midiaId ?? ''))) erro('midiaId', 'Escolha o post.');
  if (BASES_APP.some(([id]) => id === bruto.base)) corpo.base = bruto.base;
  else erro('base', 'Diga de onde são os percentuais: visualizações, contas alcançadas ou contas com engajamento.');
  // opcional: com ele o servidor sabe quantas pessoas cada percentual representa (grupo com menos de 5 pessoas
  // não vira frase); vazio fica fora do corpo e o servidor usa o número do próprio post
  const contas = lerContas(bruto.contas);
  if (Number.isNaN(contas)) erro('contas', 'Contas na base: use o número inteiro que a tela mostra (ex.: 1.234).');
  else if (contas !== null) corpo.contas = contas;
  const numero = (campo, rotulo, texto, destino, chave) => {
    const n = lerPct(texto);
    if (n === null) return;
    if (Number.isNaN(n)) return erro(campo, `${rotulo}: use um número de 0 a 100 (ex.: 45,5).`);
    destino[chave] = n;
    algum = true;
  };
  numero('genero.mulheres', 'Mulheres', bruto.genero?.mulheres, corpo.genero, 'mulheres');
  numero('genero.homens', 'Homens', bruto.genero?.homens, corpo.genero, 'homens');
  for (const f of FAIXAS) numero(`idade.${f}`, `Idade de ${faixaTexto(f)}`, bruto.idade?.[f], corpo.idade, f);
  numero('seguidores', 'Seguidores', bruto.seguidores, corpo, 'seguidores');
  numero('naoSeguidores', 'Não seguidores', bruto.naoSeguidores, corpo, 'naoSeguidores');
  for (const [chave, rotulo] of [['cidades', 'Cidade'], ['paises', 'País']]) {
    (Array.isArray(bruto[chave]) ? bruto[chave] : []).slice(0, LUGARES).forEach((x, i) => {
      const nome = String(x?.nome ?? '').trim().replace(/\s+/g, ' ').slice(0, 80);
      const n = lerPct(x?.pct);
      if (!nome && n === null) return;
      if (!nome) return erro(`${chave}.${i}.nome`, `${rotulo} ${i + 1}: falta o nome.`);
      if (n === null) return erro(`${chave}.${i}.pct`, `${rotulo} ${i + 1}: falta o percentual.`);
      if (Number.isNaN(n)) return erro(`${chave}.${i}.pct`, `${rotulo} ${i + 1}: use um número de 0 a 100 (ex.: 45,5).`);
      corpo[chave].push({ nome, pct: n });
      algum = true;
    });
  }
  const somaTexto = (xs) => pct(Math.round(soma(xs) * 10) / 10);
  const inteiro = (xs) => soma(xs) >= 90 && soma(xs) <= 102;
  const gv = Object.values(corpo.genero);
  if (gv.length === 2 && !inteiro(gv)) erro('genero.mulheres', `Mulheres e homens somam ${somaTexto(gv)}: na tela do app a soma fica perto de 100%.`);
  const iv = Object.values(corpo.idade);
  if (iv.length && !inteiro(iv)) {
    erro(`idade.${FAIXAS.find((f) => f in corpo.idade)}`, `As faixas de idade somam ${somaTexto(iv)}: preencha todas as faixas da tela (a soma fica perto de 100%).`);
  }
  const sv = [corpo.seguidores, corpo.naoSeguidores];
  if (sv.every(finito) && !inteiro(sv)) erro('seguidores', `Seguidores e não seguidores somam ${somaTexto(sv)}: na tela do app a soma fica perto de 100%.`);
  for (const [chave, rotulo] of [['cidades', 'As cidades'], ['paises', 'Os países']]) {
    const xs = corpo[chave].map((c) => c.pct);
    if (soma(xs) > 102) erro(`${chave}.0.pct`, `${rotulo} somam ${somaTexto(xs)}: passa de 100%.`);
  }
  // as contas sozinhas não dizem nada do público: precisa de pelo menos um percentual
  if (!algum && !erros.some((x) => !['midiaId', 'base', 'contas'].includes(x.campo))) erro('genero.mulheres', 'Preencha pelo menos um número da tela do app.');
  return { erros, corpo: erros.length ? null : corpo };
}

// arquivos do "Ler do print": [{ name, type, size }] → mensagem de erro ou ''
export function validarArquivos(lista) {
  const fs = Array.from(lista ?? []);
  const nome = (f) => primeiraLinha(f?.name, 40) || 'imagem';
  if (!fs.length) return 'Escolha de 1 a 3 prints da tela de público do post.';
  if (fs.length > PRINT.max) return 'Mande no máximo 3 prints.';
  for (const f of fs) {
    if (!PRINT.tipos.includes(f?.type)) return `${nome(f)}: só PNG, JPG ou WebP.`;
    if (!(f.size > 0)) return `${nome(f)}: o arquivo está vazio.`;
    if (f.size > PRINT.bytes) return `${nome(f)}: passou de 4 MB.`;
  }
  // base64 cresce 4/3: o pedido inteiro precisa caber nos 12 MB do servidor
  const corpo = fs.reduce((s, f) => s + Math.ceil(f.size / 3) * 4 + 64, 0);
  if (corpo > PRINT.corpo) return 'Os prints juntos passaram do limite de envio (12 MB). Mande menos prints ou prints menores.';
  return '';
}

// a sugestão do print na forma do formulário (§2.3): direto em leitura.sugestao ou dentro do
// { sugestao, avisos, vazio } do sugestaoDoPrint
export function sugestaoDe(l) {
  const s = l?.sugestao;
  if (!s || typeof s !== 'object') return null;
  return s.sugestao && typeof s.sugestao === 'object' ? s.sugestao : s;
}
// avisos da leitura (soma que não fecha, base que não deu pra ver): aparecem junto do "Confira"
export function avisosDaLeitura(l) {
  const xs = [...(Array.isArray(l?.avisos) ? l.avisos : []), ...(Array.isArray(l?.sugestao?.avisos) ? l.sugestao.avisos : [])];
  return [...new Set(xs.map((a) => mascarar(typeof a === 'string' ? a : a?.texto ?? '')).filter((a) => a.trim()))];
}

// estado da leitura de print: nenhuma, rodando, pronta (com sugestão), vazia (terminou sem números) ou erro
export function faseLeitura(l) {
  if (!l || typeof l !== 'object') return 'nenhuma';
  if (l.erro || l.etapa === 'erro') return 'erro';
  if (l.vazio === true || l.sugestao?.vazio === true) return 'vazia';
  if (sugestaoDe(l)) return 'pronta';
  const etapa = String(l.etapa ?? '').trim().toLowerCase();
  if (!etapa) return 'nenhuma';
  return FIM_LEITURA.has(etapa) ? 'vazia' : 'rodando';
}

export const AVISO_CONFIRA = 'Confira os números antes de salvar.';
export function confiraHtml(avisos = []) {
  const xs = (Array.isArray(avisos) ? avisos : []).filter((a) => String(a ?? '').trim());
  return `<p>${icone('alerta', 16)}<span>${esc(AVISO_CONFIRA)}</span></p>${xs.length ? `<ul>${xs.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}`;
}
const etapaTexto = (etapa) => ETAPAS_PRINT[String(etapa ?? '').toLowerCase()] ?? 'Lendo o print';

// ── HTML: pedaços ────────────────────────────────────────────────────────
const semDado = (texto = SEM_DADO) => `<p class="pb-mudo pb-sem">${esc(texto)}</p>`;
const frase = (f) => (String(f ?? '').trim() ? `<p class="pb-frase">${esc(f)}</p>` : '');
const figVazia = (titulo) => `<figure class="mc-fig"><figcaption class="mc-titulo">${esc(titulo)}</figcaption>${semDado()}</figure>`;
const cartaoFig = (html) => `<div class="card pb-fig">${html}</div>`;

function secao(classe, titulo, sub, corpo, acoes = '') {
  const id = `${classe}-t`;
  return `
    <section class="card pb-card ${classe}" aria-labelledby="${id}">
      <div class="pb-secao-topo">
        <div class="pb-secao-titulo">
          <h2 class="pb-h2" id="${id}">${esc(titulo)}</h2>
          ${sub ? `<p class="pb-sub">${esc(sub)}</p>` : ''}
        </div>
        ${acoes}
      </div>
      ${corpo}
    </section>`;
}

// barras de percentual (0 a 100, escala fixa: parte do todo)
function barrasPct(itens, titulo, tabelaTitulos) {
  const lista = itens.filter((x) => x && x.rotulo);
  const fig = barrasH(lista.map((x) => ({
    rotulo: x.rotulo, valor: x.pct, texto: pct(x.pct), dica: `${x.dicaRotulo ?? x.rotulo}: ${pct(x.pct)}`,
  })), { max: 100, titulo, tabelaTitulos, formato: (v) => pct(v) });
  return fig || figVazia(titulo);
}

export function carregandoHtml() {
  return `<div class="pb pb-carregando"><p class="ig-carregando-txt" role="status">${giro}Lendo o público…</p></div>`;
}

export function erroHtml(texto) {
  return `
    <div class="card vazio pb-erro" role="alert">
      <strong>Não consegui ler o público</strong>
      <p>${esc(mascarar(texto))}</p>
      <button type="button" class="btn btn-sm" data-pb-tentar data-foco="tentar">Tentar de novo</button>
    </div>`;
}

function faixaErroHtml(texto) {
  return `
    <div class="pb-aviso" data-tipo="erro" role="alert">
      <span>Não consegui atualizar: ${esc(mascarar(texto))}</span>
      <button type="button" class="btn btn-sm" data-pb-tentar data-foco="tentar">Tentar de novo</button>
    </div>`;
}

function avisoHtml(aviso) {
  if (!aviso?.texto) return '';
  const ok = aviso.tipo === 'ok';
  return `
    <div class="pb-aviso" data-tipo="${ok ? 'ok' : 'erro'}" role="${ok ? 'status' : 'alert'}">
      <span>${esc(mascarar(aviso.texto))}</span>
      <button type="button" class="btn-icone btn-sm" data-pb-fechar-aviso data-foco="fechar-aviso" aria-label="Fechar aviso">${icone('fechar', 14)}</button>
    </div>`;
}

function avisosHtml(avisos) {
  const lista = (Array.isArray(avisos) ? avisos : []).map((a) => mascarar(typeof a === 'string' ? a : a?.texto ?? '')).filter((a) => a.trim());
  if (!lista.length) return '';
  return `<div class="pb-avisos" role="note">${icone('info', 16)}<ul>${lista.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>`;
}

// seguidores, a última leitura e o "Atualizar agora" (a ação da aba inteira)
export function topoHtml(dados, ui = {}) {
  const s = dados?.seguidores ?? {};
  const v = s.variacao7d;
  const variacao = finito(v)
    ? `<span class="pb-variacao" data-sinal="${v > 0 ? 'mais' : v < 0 ? 'menos' : 'igual'}">${esc(`${v > 0 ? '+' : ''}${num(v)} em 7 dias`)}</span>`
    : `<span class="pb-variacao">${esc(`em 7 dias: ${SEM_DADO}`)}</span>`;
  const total = finito(s.total) ? `<b>${esc(num(s.total))}</b> ${s.total === 1 ? 'seguidor' : 'seguidores'}` : `Seguidores: <b>${SEM_DADO}</b>`;
  const quando = dados?.atualizadoEm ? `Público lido em ${dataHora(dados.atualizadoEm)}${haQuanto(dados.atualizadoEm) ? ` (${haQuanto(dados.atualizadoEm)})` : ''}` : 'Ainda sem leitura do público';
  const ocupado = Boolean(ui.atualizando);
  // leitura rodando no servidor (a agenda ou outra pessoa): avisa, sem travar o botão
  const rodando = dados?.rodando && !ocupado ? '<small class="pb-mudo">Tem uma leitura do público rodando agora: os números podem mudar em instantes.</small>' : '';
  return `
    <div class="pb-topo">
      <div class="pb-topo-info">
        <p class="pb-total">${total} ${variacao}</p>
        <small class="pb-mudo">${esc(quando)}</small>
        ${rodando}
      </div>
      <button type="button" class="btn btn-primario" data-pb-atualizar data-foco="atualizar"${ocupado ? ' aria-disabled="true" aria-busy="true"' : ''}>
        ${ocupado ? `${giro}Lendo a conta…` : `${icone('gerar', 16)}Atualizar agora`}
      </button>
    </div>`;
}

// o seletor de público: indisponível fica desabilitado, com o motivo escrito embaixo e na dica
export function trocaHtml(quem, ativo) {
  const porId = new Map((Array.isArray(quem) ? quem : []).filter((b) => b?.id).map((b) => [b.id, b]));
  const itens = BLOCOS.map((def) => {
    const b = porId.get(def.id);
    const ok = Boolean(b) && b.disponivel !== false;
    return { def, ok, motivo: ok ? '' : String(b?.motivo || 'Ainda sem leitura deste público.') };
  });
  const botoes = itens.map(({ def, ok, motivo }) => (ok
    ? `<button type="button" data-pb-bloco="${def.id}" data-foco="bloco:${def.id}" aria-pressed="${def.id === ativo}">${esc(def.nome)}</button>`
    : `<button type="button" data-pb-bloco="${def.id}" data-foco="bloco:${def.id}" aria-pressed="false" aria-disabled="true"
        aria-describedby="pb-motivo-${def.id}" data-mc-dica="${esc(`${def.nome}: ${motivo}`)}">${esc(def.nome)}</button>`)).join('');
  const fora = itens.filter((x) => !x.ok);
  return `
    <div class="pb-troca-caixa">
      <div class="segmentado pb-troca" role="group" aria-label="Qual público ver">${botoes}</div>
      ${fora.length ? `<ul class="pb-motivos">${fora.map(({ def, motivo }) => `<li id="pb-motivo-${def.id}"><b>${esc(def.nome)}:</b> ${esc(motivo)}</li>`).join('')}</ul>` : ''}
    </div>`;
}

// cabeçalho: as frases do bloco escolhido (o exemplo do Pedro), a fonte, a janela e a data, e o seletor
export function cabecaHtml(quem, bloco) {
  const lista = Array.isArray(quem) ? quem : [];
  const def = BLOCOS.find((b) => b.id === bloco?.id);
  const titulo = String(bloco?.titulo || def?.nome || 'Público');
  let corpo;
  if (!bloco) {
    corpo = vazio(
      'Ainda sem dado de público',
      lista.length
        ? 'Nenhum dos públicos tem dado ainda. O motivo de cada um está logo abaixo.'
        : 'Clique em "Atualizar agora" pra ler quem segue, quem engaja e quem é alcançado.',
    );
  } else {
    const frases = (Array.isArray(bloco.frases) ? bloco.frases : []).filter((f) => String(f ?? '').trim());
    // janela: a do servidor (null = leitura sem janela, cai fora); sem a chave, a do seletor
    const janela = 'janela' in bloco ? JANELAS[bloco.janela] ?? '' : def?.janela ?? '';
    // "Meta: seguidores da conta" já diz a fonte; id curto ("api") ganha o rótulo
    const fonte = fonteTexto(bloco.fonte);
    const meta = [
      fonte.includes(':') ? fonte : `Fonte: ${fonte}`,
      janela ? `Janela: ${janela}` : '',
      bloco.em ? `Lido em ${dataHora(bloco.em)}` : 'Ainda sem leitura',
      `Base: ${contagem(bloco.base, 'conta com dado', 'contas com dado')}`,
      finito(bloco.ocultos) && bloco.ocultos > 0 ? `${plural(bloco.ocultos, 'grupo com menos de 5 pessoas ficou', 'grupos com menos de 5 pessoas ficaram')} fora das frases` : '',
    ].filter(Boolean);
    corpo = `
      ${frases.length
        ? `<ul class="pb-frases">${frases.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`
        : semDado('Ainda sem frase pra este público (grupo com menos de 5 pessoas não vira frase).')}
      <p class="pb-meta">${meta.map((m) => `<span>${esc(m)}</span>`).join('')}</p>`;
  }
  return `
    <section class="card pb-card pb-cabeca" aria-labelledby="pb-cabeca-t">
      <div class="pb-secao-titulo">
        <p class="eyebrow">Quem é o público</p>
        <h2 class="pb-h2" id="pb-cabeca-t">${esc(titulo)}</h2>
      </div>
      ${corpo}
      ${trocaHtml(lista, bloco?.id)}
    </section>`;
}

// pirâmide (ou idade sozinha, sem o cruzamento), gênero, cidades e países do bloco escolhido
export function quemHtml(bloco) {
  if (!bloco) return '';
  const pir = linhasPiramide(bloco.idadeGenero, bloco.base);
  const semGenero = soma(pir.map((l) => l.outros));
  const figIdade = pir.length
    ? `${piramide(pir, { titulo: 'Idade e gênero (% do total)' })}${semGenero > 0 ? `<p class="pb-nota">Sem gênero informado: ${esc(pct(Math.round(semGenero * 10) / 10))} do total (fora da pirâmide).</p>` : ''}`
    : barrasPct(idadeNorm(bloco.idade).map((x) => ({ rotulo: `${faixaTexto(x.faixa)} anos`, pct: x.pct })), 'Idade', ['Idade', 'Percentual']);
  const figGenero = barrasPct(generoNorm(bloco.genero).map((x) => ({ rotulo: x.rotulo, pct: x.pct })), 'Gênero', ['Gênero', 'Percentual']);
  const cidades = comPct(bloco.cidades).filter((c) => c.nome).slice(0, 10);
  const figCidades = barrasPct(cidades.map((c) => ({ rotulo: String(c.nome).split(',')[0].trim(), dicaRotulo: String(c.nome), pct: c.pct })), 'Cidades', ['Cidade', 'Percentual']);
  const paises = comPct(bloco.paises).filter((p) => p.nome);
  const figPaises = soBrasil(paises) ? '' : barrasPct(paises.slice(0, 10).map((p) => ({ rotulo: nomePais(p.nome), pct: p.pct })), 'Países', ['País', 'Percentual']);
  const def = BLOCOS.find((b) => b.id === bloco.id);
  return `
    <div class="pb-grade" role="group" aria-label="${esc(`Idade, gênero e lugar: ${def?.nome ?? 'público'}`)}">
      ${cartaoFig(figIdade)}
      ${cartaoFig(figGenero)}
      ${cartaoFig(figCidades)}
      ${figPaises ? cartaoFig(figPaises) : ''}
    </div>`;
}

// descoberta: seguidores × não seguidores no alcance de cada semana
export function descobertaHtml(desc) {
  const d = desc && typeof desc === 'object' ? desc : {};
  const semanas = (Array.isArray(d.semanas) ? d.semanas : []).filter(Boolean);
  const rotulo = (s) => s.rotulo || rotuloSemana(s.semana);
  // semana sem uma das duas partes fica fora (a barra 100% mostraria o que falta como zero) e é citada
  const completa = (s) => finito(s.seguidores) && finito(s.naoSeguidores);
  const faltam = semanas.filter((s) => !completa(s));
  // alcance diário somado na semana: a mesma conta conta de novo a cada dia (o título diz "somado")
  const fig = empilhadas(
    semanas.filter(completa).map((s) => ({ rotulo: rotulo(s), partes: [s.seguidores, s.naoSeguidores] })),
    { nomes: ['Seguidores', 'Não seguidores'], titulo: 'Alcance diário somado, por semana' },
  );
  const nota = fig && faltam.length
    ? `<p class="pb-nota">Fora do gráfico, sem a divisão entre seguidores e não seguidores: ${esc(faltam.map(rotulo).join(', '))}.</p>`
    : '';
  const tipos = itensPorTipo(d.porTipo);
  const diasTipo = d.porTipo?.dias;
  const figTipos = tipos.length
    ? barrasH(tipos, { titulo: `Alcance por tipo de conteúdo${finito(diasTipo) && diasTipo > 0 ? `, somado em ${plural(diasTipo, 'dia', 'dias')}` : ''}`, tabelaTitulos: ['Tipo', 'Alcance'] })
    : '';
  const corpo = `${frase(d.frase)}${fig ? `${fig}${nota}` : semDado('Sem a divisão do alcance entre seguidores e não seguidores ainda.')}${figTipos}`;
  return secao('pb-descoberta', 'Como a conta é descoberta', 'O alcance de cada semana, entre quem já segue e quem ainda não segue.', corpo);
}

// crescimento: quem começou e quem deixou de seguir por dia, e o total
export function crescimentoHtml(cres) {
  const dias = (Array.isArray(cres?.dias) ? cres.dias : []).filter((x) => x?.dia);
  const itens = dias.map((x) => ({ rotulo: dataCurta(x.dia), pos: x.seguiram, neg: x.deixaram }));
  const n = itens.length;
  const fig = colunasDivergentes(itens, { titulo: 'Por dia', rotuloACada: n > 21 ? 7 : n > 10 ? 3 : 1 });
  const figTotal = linha(dias.map((x) => ({ rotulo: dataCurta(x.dia), valor: x.total })), { titulo: 'Seguidores no total', tabelaTitulos: ['Dia', 'Seguidores'] });
  const seguiram = dias.map((x) => x.seguiram).filter(finito);
  const deixaram = dias.map((x) => x.deixaram).filter(finito);
  const saldo = seguiram.length || deixaram.length ? soma(seguiram) - soma(deixaram) : null;
  // os totais só com algum dia lido (30 dias vazios não viram três "sem dado")
  const nums = seguiram.length || deixaram.length ? `
    <dl class="pb-nums">
      <div><dt>Seguiram</dt><dd>${esc(seguiram.length ? num(soma(seguiram)) : SEM_DADO)}</dd></div>
      <div><dt>Deixaram de seguir</dt><dd>${esc(deixaram.length ? num(soma(deixaram)) : SEM_DADO)}</dd></div>
      <div><dt>Saldo</dt><dd>${esc(finito(saldo) ? `${saldo > 0 ? '+' : ''}${num(saldo)}` : SEM_DADO)}</dd></div>
    </dl>` : '';
  const corpo = `${frase(cres?.frase)}${nums}${fig || semDado('Sem leitura de quem seguiu e deixou de seguir.')}${figTotal}`;
  return secao('pb-crescimento', 'Crescimento', n ? `Quem começou e quem deixou de seguir, nos últimos ${plural(n, 'dia', 'dias')}.` : '', corpo);
}

// horários: seguidores online nas 24h (as 3 maiores em destaque) e os nossos horários de postagem por score
export function horariosHtml(h) {
  const online = Array.isArray(h?.online) && h.online.length === 24 && h.online.some(finito) ? h.online : null;
  const topo = topoHoras(online, 3);
  const figOnline = online ? colunas(online.map((v, i) => ({
    rotulo: `${i}h`, valor: finito(v) ? v : null, destaque: topo.includes(i),
    dica: `${i}h às ${i + 1}h: ${finito(v) ? plural(v, 'seguidor online', 'seguidores online') : SEM_DADO}`,
  })), { emfase: true, rotuloACada: 3, titulo: 'Seguidores online por hora (horário de Brasília)', tabelaTitulos: ['Hora', 'Seguidores online'] }) : '';
  const destaque = topo.length ? `<p class="pb-nota">Em destaque, ${topo.length === 1 ? 'a hora' : `as ${topo.length} horas`} com mais gente online: ${esc(topo.map((x) => `${x}h`).join(', '))}.</p>` : '';
  // nossos horários: alcance de cada post contra a mediana do formato dele (reel com reel, feed com carrossel)
  const nossos = (Array.isArray(h?.nossos) ? h.nossos : []).filter((x) => x && (x.rotulo || x.faixa));
  const textoScore = (s) => (finito(s) ? `${vezesDeScore(s)} a mediana` : SEM_DADO);
  const figNossos = nossos.length ? `
    <figure class="mc-fig">
      <figcaption class="mc-titulo">Nossos horários de postagem: alcance contra a mediana do formato</figcaption>
      <ul class="pb-horas" role="list">
        ${nossos.map((x) => {
          const rot = String(x.rotulo || x.faixa);
          const texto = textoScore(x.medianaScore);
          return `
            <li class="pb-hora" tabindex="0" data-mc-dica="${esc(`${rot}: ${texto}, ${contagem(x.n, 'peça', 'peças')}`)}">
              <span class="pb-hora-rotulo">${esc(rot)}</span>
              ${divergente(x.medianaScore, { rotulo: rot })}
              <span class="pb-hora-valor">${esc(texto)}</span>
              <small class="pb-mudo">${esc(contagem(x.n, 'peça', 'peças'))}</small>
            </li>`;
        }).join('')}
      </ul>
      ${tabela([{ titulo: 'Horário' }, { titulo: 'Peças', num: true }, { titulo: 'Alcance contra a mediana', num: true }],
        nossos.map((x) => [String(x.rotulo || x.faixa), num(x.n), textoScore(x.medianaScore)]))}
    </figure>` : '';
  const corpo = `${frase(h?.frase)}${figOnline ? `${figOnline}${destaque}` : ''}${figNossos}${!figOnline && !figNossos ? semDado('Sem horário lido ainda.') : ''}`;
  return secao('pb-horarios', 'Horários', 'Quando os seguidores estão online e como os nossos horários de postagem têm ido.', corpo);
}

// a frase do servidor começa por "Nome (descrição; recorte): ...": o cartão já mostra nome e recorte em
// cima, então fica só o que vem depois. Frase noutro formato aparece inteira
export function corpoPersona(p) {
  const f = String(p?.frase ?? '').trim();
  const i = f.indexOf('): ');
  if (f && p?.nome && f.startsWith(`${p.nome} (`) && i > 0) {
    const resto = f.slice(i + 3);
    return resto.charAt(0).toUpperCase() + resto.slice(1);
  }
  if (f) return f;
  return p?.motivo ? `Sem dado: ${p.motivo}.` : 'Sem dado.';
}

const AVISO_PERSONAS = 'Idade e gênero não dizem profissão nem se é MEI ou ME. Aqui entra só o recorte de idade e gênero de cada persona.';
// personas × público real: recorte de idade e gênero de cada persona (nunca profissão nem MEI/ME). O aviso
// fixo é o do servidor (personasAviso) quando ele manda; senão, o daqui
export function personasHtml(personas, avisoServidor = '') {
  const ps = (Array.isArray(personas) ? personas : []).filter((p) => p && p.nome);
  const textoAviso = String(avisoServidor ?? '').trim() || AVISO_PERSONAS;
  const aviso = `<p class="pb-aviso-fixo" role="note">${icone('info', 16)}<span>${esc(textoAviso)}</span></p>`;
  if (!ps.length) return secao('pb-personas', 'Personas × público real', '', `${aviso}${semDado('Sem dado: precisa da idade e do gênero dos seguidores.')}`);
  const barra = (campo, titulo, quem) => barrasPct(ps.map((p) => ({
    rotulo: String(p.nome), dicaRotulo: `${p.nome}${p.recorte ? ` (${p.recorte})` : ''}, ${quem}`, pct: finito(p[campo]) ? p[campo] : null,
  })), titulo, ['Persona', 'Percentual']);
  // gráfico só com número: sem nenhum, os cartões abaixo já dizem o porquê
  const temSeguidores = ps.some((p) => finito(p.pctSeguidores));
  const temEngajados = ps.some((p) => finito(p.pctEngajados));
  const lista = `
    <ul class="pb-personas-lista">
      ${ps.map((p) => `
        <li>
          <strong>${esc(p.nome)}</strong>
          ${p.descricao || p.recorte ? `<small class="pb-mudo">${esc([p.descricao, p.recorte].filter(Boolean).join('; '))}</small>` : ''}
          <p>${esc(corpoPersona(p))}</p>
        </li>`).join('')}
    </ul>`;
  const graficos = temSeguidores || temEngajados ? `
    <div class="pb-grade">
      ${temSeguidores ? cartaoFig(barra('pctSeguidores', 'Nos seguidores', 'nos seguidores')) : ''}
      ${temEngajados ? cartaoFig(barra('pctEngajados', 'Nos engajados (30 dias)', 'nos engajados')) : ''}
    </div>` : '';
  const corpo = `${aviso}${graficos}${lista}`;
  return secao('pb-personas', 'Personas × público real', 'Quanto do público cabe no recorte de idade e gênero de cada persona.', corpo);
}

// a base de cada fonte: o texto pronto do servidor (baseTexto); sem ele, montado aqui (nunca o id cru)
export function textoBase(f) {
  if (String(f?.baseTexto ?? '').trim()) return `Base: ${String(f.baseTexto).trim()}`;
  const b = f?.base;
  if (finito(b)) return `Base: ${plural(b, 'conta', 'contas')}`;
  const app = BASES_APP.find(([id]) => id === b);
  if (app) return `Base: ${app[1].toLowerCase()}`;
  if (b === 'alcance-pago') return `Base: alcance pago${finito(f?.n) ? ` de ${plural(f.n, 'conta', 'contas')}` : ''}`;
  return `Base: ${String(b ?? '').trim() || SEM_DADO}`;
}

// sem frase, o porquê (nunca os percentuais da linha: seriam os grupos pequenos que o servidor escondeu). A
// linha do app com n null (a chave veio, sem número) é a que não sabe quantas contas a tela mede
export function semFraseTexto(f) {
  if (f?.fonte === 'app' && f && Object.hasOwn(f, 'n') && f.n == null) {
    return 'Sem frase: falta o número de contas da base. Informe em "Editar números do app", no campo Contas na base.';
  }
  return 'Sem frase: nenhum grupo com 5 pessoas ou mais.';
}

function fontePostHtml(f) {
  const frases = (Array.isArray(f.frases) ? f.frases : []).filter((x) => String(x ?? '').trim());
  const quem = f.fonte === 'app'
    ? [f.autor ? `informado por ${f.autor}` : '', f.em ? `em ${dataCurta(f.em)}` : ''].filter(Boolean).join(' ')
    : f.em ? `lido em ${dataCurta(f.em)}` : '';
  return `
    <div class="pb-post-fonte">
      <div class="pb-post-fonte-topo">${pillFonte(f.fonte) || `<span class="mc-fonte">${esc(fonteTexto(f.fonte))}</span>`}<small class="pb-mudo">${esc(textoBase(f))}${quem ? esc(`, ${quem}`) : ''}</small></div>
      ${frases.length
        ? `<ul class="pb-post-frases">${frases.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
        : `<p class="pb-mudo">${esc(semFraseTexto(f))}</p>`}
    </div>`;
}

function postHtml(g) {
  const id = esc(g.midiaId);
  const titulo = g.titulo || 'Post sem título';
  const temApp = g.fontes.some((f) => f.fonte === 'app');
  const rotuloApp = temApp ? 'Editar números do app' : 'Informar do app';
  return `
    <li class="pb-post">
      <span class="pb-post-thumb" aria-hidden="true">${icone('play', 14)}${g.thumb ? `<img src="${esc(g.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer" data-some-se-falhar />` : ''}</span>
      <div class="pb-post-corpo">
        <div class="pb-post-topo">
          <strong class="pb-post-titulo">${esc(titulo)}</strong>
          <small class="pb-mudo">${esc([TIPO_MIDIA[g.tipo], dataCurta(g.dia)].filter(Boolean).join(' · '))}</small>
        </div>
        ${g.fontes.map(fontePostHtml).join('')}
        <div class="pb-post-acoes">
          <button type="button" class="btn btn-sm" data-pb-app="${id}" data-foco="app:${id}" aria-label="${esc(`${rotuloApp}: ${titulo}`)}">${icone('editar', 14)}${rotuloApp}</button>
          <button type="button" class="btn btn-sm btn-fantasma" data-pb-print="${id}" data-foco="print:${id}" aria-label="${esc(`Ler do print: ${titulo}`)}">${icone('estatico', 14)}Ler do print</button>
          <a class="btn btn-sm btn-fantasma" href="#/instagram/metricas/diagnostico?post=${id}" data-foco="diag:${id}" aria-label="${esc(`Ver no diagnóstico: ${titulo}`)}">${icone('grafico', 14)}Ver no diagnóstico</a>
          ${g.permalink ? `<a class="btn btn-sm btn-fantasma" href="${esc(g.permalink)}" target="_blank" rel="noopener noreferrer" data-foco="ig:${id}" aria-label="${esc(`Abrir no Instagram: ${titulo}`)}">${icone('instagram', 14)}Abrir no Instagram</a>` : ''}
        </div>
      </div>
    </li>`;
}

// público por post: anúncio ligado ao post e tela do app (digitada ou lida de print)
export function porPostHtml(porPost) {
  const grupos = agruparPorPost(porPost);
  const acoes = `<button type="button" class="btn btn-sm" data-pb-app="" data-foco="app-novo">${icone('editar', 14)}Informar do app</button>`;
  const corpo = grupos.length
    ? `<ul class="pb-posts">${grupos.map(postHtml).join('')}</ul>`
    : vazio('Nenhum post com público ainda', 'Informe os números da tela de público do post no app, ou ligue os anúncios, pra ver quem assistiu cada post.');
  return secao(
    'pb-porpost', 'Público por post',
    'A API não traz idade nem gênero por post: aqui entra o público do anúncio ligado ao post ou o da tela do app do Instagram.',
    corpo, acoes,
  );
}

// os passos do anuncios.mjs (status().passos); sem eles, os da SPEC só quando pedido (padrao)
function passosHtml(passos, { padrao = true, link = true } = {}) {
  let lista = [];
  if (Array.isArray(passos)) lista = passos.map((p) => (typeof p === 'string' ? p : p?.texto ?? '')).filter((p) => String(p).trim());
  else if (typeof passos === 'string' && passos.trim()) lista = [passos];
  if (!lista.length && padrao) lista = PASSOS_ANUNCIOS;
  if (!lista.length) return '';
  return `
    ${lista.length === 1 ? `<p class="pb-sub">${esc(lista[0])}</p>` : `<ol class="pb-passos">${lista.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>`}
    ${link ? `<p class="pb-nota"><a href="${LINK_USUARIOS_SISTEMA}" target="_blank" rel="noopener noreferrer">Abrir Usuários do sistema ${icone('externo', 12)}</a></p>` : ''}`;
}

function botaoAtualizarAnuncios(ads, { primario = true } = {}) {
  const ocupado = ads.ocupado === 'atualizar';
  return `
    <div class="pb-acoes">
      <button type="button" class="btn${primario ? ' btn-primario' : ''}" data-pb-ads-atualizar data-foco="ads-atualizar"${ocupado ? ' aria-disabled="true" aria-busy="true"' : ''}>
        ${ocupado ? `${giro}Lendo os anúncios…` : `${icone('gerar', 16)}Atualizar anúncios`}
      </button>
    </div>`;
}

// o campo nunca recebe value: o token só sai dele direto pro POST
function formTokenHtml(ads = {}) {
  const ocupado = ads.ocupado === 'token';
  return `
    <form class="pb-form-token" id="pb-form-token" autocomplete="off" novalidate>
      <label class="rotulo" for="pb-token">Token de usuário do sistema (com ads_read)</label>
      <div class="pb-linha-campo">
        <input id="pb-token" class="campo" type="password" autocomplete="off" autocapitalize="off" spellcheck="false"
          placeholder="Cole o token aqui" required data-1p-ignore data-lpignore="true" data-foco="token" aria-describedby="pb-token-seguro" />
        <button class="btn btn-primario" type="submit" data-foco="token-enviar"${ocupado ? ' aria-disabled="true" aria-busy="true"' : ''}>${ocupado ? `${giro}Conectando…` : 'Conectar'}</button>
      </div>
      <small class="pb-seguro" id="pb-token-seguro">${icone('cadeado', 14)}O token fica só nesta máquina e nunca aparece na tela.</small>
    </form>`;
}

function contasHtml(s, ads = {}) {
  const contas = (Array.isArray(s.contasDisponiveis) ? s.contasDisponiveis : []).filter((c) => c?.id);
  // sem conta visível: os passos e o "Atualizar anúncios", que relê a lista de contas do token
  if (!contas.length) return `${semDado('Nenhuma conta de anúncios chegou por este token.')}${passosHtml(s.passos)}${botaoAtualizarAnuncios(ads, { primario: false })}`;
  const ocupado = ads.ocupado === 'conta';
  return `
    <form class="pb-form-conta" id="pb-form-conta" novalidate>
      <label class="rotulo" for="pb-conta">${s.conta ? 'Trocar a conta de anúncios' : 'Conta de anúncios'}</label>
      <div class="pb-linha-campo">
        <select class="campo" id="pb-conta" data-foco="conta">
          ${s.conta ? '' : '<option value="">Escolha a conta</option>'}
          ${contas.map((c) => `<option value="${esc(c.id)}"${c.id === s.conta?.id ? ' selected' : ''}>${esc(c.nome || c.id)}${c.moeda ? ` (${esc(c.moeda)})` : ''}</option>`).join('')}
        </select>
        <button class="btn" type="submit" data-foco="conta-enviar"${ocupado ? ' aria-disabled="true" aria-busy="true"' : ''}>${ocupado ? `${giro}Salvando…` : 'Usar esta conta'}</button>
      </div>
    </form>`;
}

// anúncios: sem token (passos + campo), sem conta (escolher), com conta (números e "Atualizar anúncios")
export function anunciosHtml(status, ads = {}) {
  const s = status && typeof status === 'object' ? status : null;
  const sub = 'O anúncio ligado ao post mostra idade, gênero e região de quem viu a parte paga.';
  const erroAcao = ads.erro ? `<p class="pb-erro-linha" role="alert">${esc(mascarar(ads.erro))}</p>` : '';
  if (!s) {
    const corpo = vazio('Estado dos anúncios: sem dado', 'O resumo não trouxe o estado dos anúncios.',
      `<button type="button" class="btn btn-sm" data-pb-ads-estado data-foco="ads-estado">${icone('gerar', 14)}Ler estado dos anúncios</button>`);
    return secao('pb-anuncios', 'Anúncios', sub, `${erroAcao}${corpo}`);
  }
  const erroMeta = s.erro ? `<p class="pb-erro-linha" role="alert">${esc(mascarar(s.erro))}</p>` : '';
  let corpo;
  if (!s.temToken) {
    corpo = `<p class="pb-sub">Pra ler os anúncios, o app precisa de um token de usuário do sistema com a permissão ads_read.</p>${passosHtml(s.passos)}${formTokenHtml(ads)}`;
  } else if (!s.conta) {
    const temContas = (Array.isArray(s.contasDisponiveis) ? s.contasDisponiveis : []).some((c) => c?.id);
    corpo = `${temContas ? passosHtml(s.passos, { padrao: false, link: false }) : ''}${contasHtml(s, ads)}<details class="pb-detalhes"><summary>Trocar o token</summary>${formTokenHtml(ads)}</details>`;
  } else {
    const nContas = (Array.isArray(s.contasDisponiveis) ? s.contasDisponiveis : []).filter((c) => c?.id).length;
    corpo = `
      <dl class="pb-nums">
        <div><dt>Conta</dt><dd>${esc(s.conta.nome || s.conta.id || SEM_DADO)}${s.conta.moeda ? ` <small class="pb-mudo">${esc(s.conta.moeda)}</small>` : ''}</dd></div>
        <div><dt>Anúncios lidos</dt><dd>${esc(finito(s.nAnuncios) ? num(s.nAnuncios) : SEM_DADO)}</dd></div>
        ${'nLigados' in s ? `<div><dt>Ligados a posts nossos</dt><dd>${esc(finito(s.nLigados) ? num(s.nLigados) : SEM_DADO)}</dd></div>` : ''}
        <div><dt>Posts com anúncio</dt><dd>${esc(finito(s.nPosts) ? num(s.nPosts) : SEM_DADO)}</dd></div>
        <div><dt>Última leitura</dt><dd>${esc(s.lidoEm ? dataHora(s.lidoEm) : 'ainda não leu')}</dd></div>
      </dl>
      ${botaoAtualizarAnuncios(ads)}
      ${nContas > 1 ? contasHtml(s, ads) : ''}
      <details class="pb-detalhes"><summary>Trocar o token</summary>${formTokenHtml(ads)}</details>`;
  }
  return secao('pb-anuncios', 'Anúncios', sub, `${erroMeta}${erroAcao}${corpo}`);
}

// o que a Meta não devolve pra esta conta (suporte) e quando o app tenta de novo
export function suporteHtml(suporte) {
  const itens = itensSuporte(suporte);
  const leu = suporte && typeof suporte === 'object' && Object.keys(suporte).length > 0;
  const corpo = itens.length
    ? `
      <ul class="pb-suporte">
        ${itens.map((x) => `
          <li>
            <strong>${esc(x.rotulo)}</strong>
            ${x.erro ? `<small>${esc(x.erro)}</small>` : ''}
            ${x.em ? `<small class="pb-mudo">Tentado em ${esc(dataHora(x.em))}</small>` : ''}
          </li>`).join('')}
      </ul>
      <p class="pb-nota">O app tenta de novo sozinho depois de 7 dias. O "Atualizar agora" tenta na hora.</p>`
    : semDado(leu ? 'Na última leitura a Meta devolveu tudo o que o app pediu.' : 'Ainda sem leitura: aparece depois do primeiro "Atualizar agora".');
  return secao('pb-suporte-secao', 'O que a Meta não devolve pra esta conta', '', corpo);
}

// a aba inteira. ui: { bloco, carregando, erro, atualizando, aviso, ads: { ocupado, erro } }
export function paginaHtml(dados, ui = {}) {
  if (!dados || typeof dados !== 'object') return ui.erro ? erroHtml(ui.erro) : carregandoHtml();
  const quem = Array.isArray(dados.quem) ? dados.quem : [];
  const bloco = escolherBloco(quem, ui.bloco);
  // aria-busy só no conteúdo: o aviso de "Atualizando" fica fora dele pra ser lido
  return `
    <div class="pb${ui.carregando ? ' pb-velho' : ''}">
      ${ui.carregando ? `<p class="pb-status" role="status">${giro}Atualizando os números…</p>` : ''}
      ${ui.erro ? faixaErroHtml(ui.erro) : ''}
      ${avisoHtml(ui.aviso)}
      <div class="pb-conteudo" aria-busy="${ui.carregando ? 'true' : 'false'}">
        ${topoHtml(dados, ui)}
        ${avisosHtml(dados.avisos)}
        ${cabecaHtml(quem, bloco)}
        ${quemHtml(bloco)}
        ${descobertaHtml(dados.descoberta)}
        ${crescimentoHtml(dados.crescimento)}
        ${horariosHtml(dados.horarios)}
        ${personasHtml(dados.personas, dados.personasAviso)}
        ${porPostHtml(dados.porPost)}
        ${anunciosHtml(dados.anuncios, ui.ads)}
        ${suporteHtml(dados.suporte)}
      </div>
    </div>`;
}

// ── HTML: painel "Informar do app" ───────────────────────────────────────
const campoPct = (nome, rotulo, valor) => `
  <label class="rotulo">${esc(rotulo)}
    <input class="campo" type="text" inputmode="decimal" name="${nome}" value="${esc(fmtCampo(valor))}" maxlength="6" autocomplete="off" placeholder="%" />
  </label>`;

// 5 linhas (nome e %): um cabeçalho visível só, e cada campo com o rótulo inteiro pro leitor de tela
function lugaresHtml(chave, rotulo, valores) {
  const vs = Array.isArray(valores) ? valores : [];
  return `
    <div class="pb-lugares">
      <div class="pb-lugar pb-lugar-cab" aria-hidden="true"><span>${esc(rotulo)}</span><span>%</span></div>
      ${Array.from({ length: LUGARES }, (_, i) => `
        <div class="pb-lugar">
          <label><span class="sr-only">${esc(`${rotulo} ${i + 1}`)}</span>
            <input class="campo" type="text" name="${chave}.${i}.nome" value="${esc(vs[i]?.nome ?? '')}" maxlength="80" autocomplete="off" />
          </label>
          <label><span class="sr-only">${esc(`Percentual: ${rotulo.toLowerCase()} ${i + 1}`)}</span>
            <input class="campo" type="text" inputmode="decimal" name="${chave}.${i}.pct" value="${esc(fmtCampo(vs[i]?.pct))}" maxlength="6" autocomplete="off" />
          </label>
        </div>`).join('')}
    </div>`;
}

// o painel inteiro: post, leitura de print, base (e as contas dela), gênero, idade, seguidores, cidades e
// países. Sai em branco e travado: os números salvos entram depois, lidos na hora do servidor (ligarFormApp),
// e só então o formulário e o "Salvar" destravam. comApp: ids dos posts que já têm números do app (marcados
// na lista)
export function formAppHtml({ midiaId = '', posts = [], titulo = '', comApp = [] } = {}) {
  const id = RE_MIDIA.test(String(midiaId ?? '')) ? String(midiaId) : '';
  const lista = ordenarPosts(posts);
  if (id && !lista.some((m) => String(m.midiaId) === id)) lista.unshift({ midiaId: id, caption: titulo, timestamp: null });
  const jaTem = new Set([...(comApp ?? [])].map(String));
  const rotulo = (m) => `${m.timestamp ? rotuloPost(m) : primeiraLinha(m.caption) || `Post ${m.midiaId}`}${jaTem.has(String(m.midiaId)) ? ' · já tem números do app' : ''}`;
  const e = VAZIO_APP; // em branco: os números salvos chegam depois, pelo preencher()
  return `
    <div class="painel-topo">
      <div>
        <h2>Público do post</h2>
        <p>Os números da tela de público do post, no app do Instagram.</p>
      </div>
      ${BTN_FECHAR}
    </div>
    <form class="painel-corpo pb-form" id="pb-form-app" novalidate data-pb-painel="${esc(id)}">
      <label class="rotulo" for="pb-app-post">Post</label>
      <select class="campo" id="pb-app-post" name="midiaId" required>
        <option value=""${id ? '' : ' selected'}>Escolha o post</option>
        ${lista.map((m) => `<option value="${esc(m.midiaId)}"${String(m.midiaId) === id ? ' selected' : ''}>${esc(rotulo(m))}</option>`).join('')}
      </select>

      <div class="pb-app-estado" id="pb-app-estado-caixa">
        <p class="pb-app-estado-txt" id="pb-app-estado" role="status" aria-live="polite">${esc(id ? LENDO_POST : ESCOLHA_POST)}</p>
        <button type="button" class="btn btn-sm" id="pb-app-tentar" hidden>Tentar de novo</button>
      </div>

      <fieldset class="pb-dados" id="pb-app-dados" disabled aria-describedby="pb-app-estado">
        <fieldset class="pb-grupo pb-print">
          <legend>Ler do print</legend>
          <p class="pb-nota">Até 3 prints da tela de público do post (PNG, JPG ou WebP, até 4 MB cada e 12 MB juntos). A leitura só preenche o formulário: nada é salvo sem você conferir.</p>
          <div class="pb-linha-campo pb-arquivos">
            <input class="pb-arquivo" type="file" id="pb-print-arquivos" accept="image/png,image/jpeg,image/webp" multiple aria-describedby="pb-print-nomes pb-print-estado" />
            <label class="btn btn-sm" for="pb-print-arquivos">${icone('pasta', 14)}Escolher prints</label>
            <span class="pb-print-nomes" id="pb-print-nomes">Nenhum print escolhido</span>
            <button type="button" class="btn btn-sm" id="pb-print-ler">${icone('estatico', 14)}Ler do print</button>
          </div>
          <div class="pb-print-previas" id="pb-print-previas" aria-hidden="true"></div>
          <p class="pb-print-estado" id="pb-print-estado" role="status" aria-live="polite"></p>
          <button type="button" class="btn btn-sm btn-fantasma" id="pb-print-usar" hidden>Usar a última leitura do print</button>
        </fieldset>

        <div class="pb-confira" id="pb-confira" role="status" aria-live="polite"></div>

        <fieldset class="pb-grupo">
          <legend>Os percentuais são de</legend>
          <div class="pb-opcoes">
            ${BASES_APP.map(([valor, nome]) => `<label class="pb-radio"><input type="radio" name="base" value="${valor}"${e.base === valor ? ' checked' : ''} />${esc(nome)}</label>`).join('')}
          </div>
          <div class="pb-contas">
            <label class="rotulo" for="pb-app-contas">Contas na base (o número que a tela mostra, se aparecer)</label>
            <input class="campo" type="text" inputmode="numeric" id="pb-app-contas" name="contas" value="${esc(fmtCampo(e.contas))}" maxlength="15" autocomplete="off" aria-describedby="pb-app-contas-nota" />
            <p class="pb-nota" id="pb-app-contas-nota">Com ele dá pra saber quantas pessoas cada percentual representa: grupo com menos de 5 pessoas não vira frase.</p>
          </div>
        </fieldset>

        <fieldset class="pb-grupo">
          <legend>Gênero (%)</legend>
          <div class="pb-campos">
            ${campoPct('genero.mulheres', 'Mulheres', e.genero?.mulheres)}
            ${campoPct('genero.homens', 'Homens', e.genero?.homens)}
          </div>
        </fieldset>

        <fieldset class="pb-grupo">
          <legend>Idade (%)</legend>
          <div class="pb-campos">${FAIXAS.map((f) => campoPct(`idade.${f}`, faixaTexto(f), e.idade?.[f])).join('')}</div>
        </fieldset>

        <fieldset class="pb-grupo">
          <legend>Seguidores e não seguidores (%)</legend>
          <div class="pb-campos">
            ${campoPct('seguidores', 'Seguidores', e.seguidores)}
            ${campoPct('naoSeguidores', 'Não seguidores', e.naoSeguidores)}
          </div>
        </fieldset>

        <fieldset class="pb-grupo">
          <legend>Cidades (%)</legend>
          ${lugaresHtml('cidades', 'Cidade', e.cidades)}
        </fieldset>

        <fieldset class="pb-grupo">
          <legend>Países (%)</legend>
          ${lugaresHtml('paises', 'País', e.paises)}
        </fieldset>
      </fieldset>

      <div class="pb-form-erro" id="pb-form-erro" role="alert" hidden></div>
    </form>
    <div class="painel-rodape">
      <button class="btn btn-primario" type="submit" form="pb-form-app" id="pb-app-salvar" aria-disabled="true">Salvar</button>
      <button class="btn btn-fantasma" type="button" data-fechar>Cancelar</button>
      <span class="espaco"></span>
      <button class="btn btn-fantasma btn-perigo" type="button" id="pb-app-apagar" hidden>${icone('lixo', 14)}Apagar números do app</button>
    </div>`;
}

// ── estado e ligação com o DOM ───────────────────────────────────────────
const st = {
  dados: null, velho: true, lidoEm: 0, carregando: false, erro: '', seq: 0,
  bloco: 'seguidores', atualizando: false, aviso: null,
  ads: { ocupado: null, erro: '' },
};
let alvo = null; // { el, opts }
let dicasLigadas = false;
let ouvindoFoco = false;
let focoGuardado = null;
const postsCache = { lista: null, em: 0 };
// uma leitura de print acompanhada por vez; dono = o formulário que acompanha (painel reaberto assume)
const leitura = { dono: null, id: null, timer: null, inicio: 0 };

const estadoUi = () => ({
  bloco: st.bloco, carregando: st.carregando && Boolean(st.dados), erro: st.erro,
  atualizando: st.atualizando, aviso: st.aviso, ads: st.ads,
});
const ehResumo = (r) => Boolean(r) && typeof r === 'object' && ('quem' in r || 'porPost' in r || 'atualizadoEm' in r || 'seguidores' in r);

// resposta nova vale mais que qualquer GET ainda no ar (o seq descarta o que voltar depois)
function aplicarResumo(r) {
  st.dados = r;
  st.velho = false;
  st.lidoEm = Date.now();
  st.erro = '';
  st.carregando = false;
  st.seq++;
}

async function carregar() {
  if (st.carregando) return;
  st.carregando = true;
  st.erro = '';
  const minha = ++st.seq;
  desenhar();
  try {
    const r = await api('GET', '/api/metricas/publico');
    if (minha !== st.seq) return;
    st.dados = r && typeof r === 'object' ? r : {};
    st.velho = false;
    st.lidoEm = Date.now();
  } catch (e) {
    if (minha !== st.seq) return;
    st.erro = textoErro(e);
  }
  st.carregando = false;
  desenhar();
}

// o app redesenha a tela do Instagram inteira às vezes: o foco volta pro controle com o mesmo data-foco.
// Clicar fora (foco no body com o controle ainda na tela) esquece
function ouvirFoco() {
  if (ouvindoFoco) return;
  ouvindoFoco = true;
  document.addEventListener('focusin', (e) => {
    const f = e.target instanceof Element ? e.target.closest('.pb [data-foco]') : null;
    focoGuardado = f ? f.dataset.foco : null;
  });
  document.addEventListener('focusout', (e) => {
    const t = e.target;
    setTimeout(() => {
      if (t instanceof Element && t.isConnected && (!document.activeElement || document.activeElement === document.body)) focoGuardado = null;
    });
  });
}

function desenhar() {
  if (!alvo?.el?.isConnected) return;
  const el = alvo.el;
  const ativo = document.activeElement;
  const dentro = el.contains(ativo);
  const semFoco = !ativo || ativo === document.body;
  const foco = dentro ? ativo.dataset?.foco ?? null : semFoco ? focoGuardado : null;
  // o que estava sendo digitado volta; senha nunca (o token não é reescrito)
  const digitado = dentro && ativo.matches?.('input:not([type="password"]):not([type="file"]), select') ? ativo.value : null;
  el.innerHTML = paginaHtml(st.dados, estadoUi());
  ligar(el);
  if (!foco) return;
  const novo = el.querySelector(`[data-foco="${CSS.escape(foco)}"]`);
  if (!novo) return;
  if (digitado != null && novo.matches('input:not([type="password"]):not([type="file"]), select')) novo.value = digitado;
  novo.focus({ preventScroll: true });
}

function ligar(el) {
  el.querySelectorAll('[data-pb-tentar]').forEach((b) => (b.onclick = () => { st.erro = ''; carregar(); }));
  el.querySelectorAll('[data-pb-atualizar]').forEach((b) => (b.onclick = atualizarAgora));
  el.querySelectorAll('[data-pb-fechar-aviso]').forEach((b) => (b.onclick = () => { st.aviso = null; desenhar(); }));
  el.querySelectorAll('[data-pb-bloco]').forEach((b) => (b.onclick = () => {
    if (b.getAttribute('aria-disabled') === 'true' || st.bloco === b.dataset.pbBloco) return;
    st.bloco = b.dataset.pbBloco;
    desenhar();
  }));
  el.querySelectorAll('[data-pb-app]').forEach((b) => (b.onclick = () => abrirFormApp(b.dataset.pbApp, { botao: b })));
  el.querySelectorAll('[data-pb-print]').forEach((b) => (b.onclick = () => abrirFormApp(b.dataset.pbPrint, { print: true, botao: b })));
  el.querySelectorAll('[data-pb-ads-atualizar]').forEach((b) => (b.onclick = atualizarAnuncios));
  el.querySelectorAll('[data-pb-ads-estado]').forEach((b) => (b.onclick = lerEstadoAnuncios));
  el.querySelectorAll('#pb-form-token').forEach((f) => (f.onsubmit = salvarToken));
  el.querySelectorAll('#pb-form-conta').forEach((f) => (f.onsubmit = escolherConta));
}

async function atualizarAgora() {
  if (st.atualizando) return;
  st.atualizando = true;
  st.aviso = null;
  desenhar();
  try {
    const r = await api('POST', '/api/metricas/publico/atualizar');
    if (ehResumo(r)) aplicarResumo(r);
    else st.velho = true;
    toast('Público atualizado');
  } catch (e) {
    st.aviso = { tipo: 'erro', texto: textoErro(e) };
  }
  st.atualizando = false;
  desenhar();
  if (st.velho) carregar();
}

// ── anúncios ─────────────────────────────────────────────────────────────
function aplicarAnuncios(s) {
  if (s && typeof s === 'object') st.dados = { ...(st.dados ?? {}), anuncios: s };
}

async function acaoAnuncios(tipo, fn) {
  if (st.ads.ocupado) return;
  st.ads = { ocupado: tipo, erro: '' };
  desenhar();
  try {
    await fn();
  } catch (e) {
    st.ads.erro = textoErro(e);
  }
  st.ads.ocupado = null;
  desenhar();
}

function salvarToken(e) {
  e.preventDefault();
  const campo = e.currentTarget.querySelector('#pb-token');
  const token = String(campo?.value ?? '').trim();
  if (campo) campo.value = ''; // limpo já no envio: o token não fica na tela nem no redesenho
  if (st.ads.ocupado) return;
  if (!token) {
    st.ads = { ocupado: null, erro: 'Cole o token antes de salvar.' };
    desenhar();
    return;
  }
  acaoAnuncios('token', async () => {
    aplicarAnuncios(await api('POST', '/api/metricas/anuncios/token', { token }));
    toast('Anúncios conectados');
  });
}

function escolherConta(e) {
  e.preventDefault();
  const contaId = e.currentTarget.querySelector('#pb-conta')?.value ?? '';
  if (st.ads.ocupado) return;
  if (!contaId) {
    st.ads = { ocupado: null, erro: 'Escolha a conta de anúncios.' };
    desenhar();
    return;
  }
  acaoAnuncios('conta', async () => {
    aplicarAnuncios(await api('PUT', '/api/metricas/anuncios/conta', { contaId }));
    toast('Conta de anúncios escolhida. Agora é só atualizar os anúncios.');
  });
}

function atualizarAnuncios() {
  acaoAnuncios('atualizar', async () => {
    aplicarAnuncios(await api('POST', '/api/metricas/anuncios/atualizar'));
    toast('Anúncios atualizados');
    // o público de cada post muda com os anúncios novos
    st.velho = true;
    carregar();
  });
}

function lerEstadoAnuncios() {
  acaoAnuncios('estado', async () => {
    aplicarAnuncios(await api('GET', '/api/metricas/anuncios'));
  });
}

// ── painel "Informar do app" e "Ler do print" ────────────────────────────
async function postsDoInstagram() {
  if (postsCache.lista && Date.now() - postsCache.em < 5 * 60_000) return postsCache.lista;
  try {
    const d = await api('GET', '/api/instagram/dados');
    postsCache.lista = ordenarPosts([...(d?.proprios ?? []), ...(d?.postsProprios ?? [])]);
    postsCache.em = Date.now();
  } catch {
    // sem a lista, o painel ainda abre com o post da linha
  }
  return postsCache.lista ?? [];
}

function lerComoDataUrl(arquivo) {
  return new Promise((ok, falhou) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result ?? ''));
    r.onerror = () => falhou(new Error('Não consegui abrir a imagem.'));
    r.readAsDataURL(arquivo);
  });
}

function lerFormApp(form) {
  const v = (nome) => form.elements.namedItem(nome)?.value ?? '';
  const lugares = (chave) => Array.from({ length: LUGARES }, (_, i) => ({ nome: v(`${chave}.${i}.nome`), pct: v(`${chave}.${i}.pct`) }));
  return {
    midiaId: v('midiaId'),
    base: form.querySelector('input[name="base"]:checked')?.value ?? '',
    contas: v('contas'),
    genero: { mulheres: v('genero.mulheres'), homens: v('genero.homens') },
    idade: Object.fromEntries(FAIXAS.map((f) => [f, v(`idade.${f}`)])),
    seguidores: v('seguidores'),
    naoSeguidores: v('naoSeguidores'),
    cidades: lugares('cidades'),
    paises: lugares('paises'),
  };
}

function preencher(form, app) {
  const a = app ?? VAZIO_APP;
  const por = (nome, valor) => { const c = form.elements.namedItem(nome); if (c && 'value' in c) c.value = fmtCampo(valor); };
  form.querySelectorAll('input[name="base"]').forEach((r) => { r.checked = r.value === a.base; });
  por('contas', a.contas);
  por('genero.mulheres', a.genero?.mulheres);
  por('genero.homens', a.genero?.homens);
  for (const f of FAIXAS) por(`idade.${f}`, a.idade?.[f]);
  por('seguidores', a.seguidores);
  por('naoSeguidores', a.naoSeguidores);
  for (const chave of ['cidades', 'paises']) {
    for (let i = 0; i < LUGARES; i++) {
      const nome = form.elements.namedItem(`${chave}.${i}.nome`);
      if (nome) nome.value = a[chave]?.[i]?.nome ?? '';
      por(`${chave}.${i}.pct`, a[chave]?.[i]?.pct);
    }
  }
}

async function abrirFormApp(midiaId, { print = false, botao = null } = {}) {
  const id = RE_MIDIA.test(String(midiaId ?? '')) ? String(midiaId) : '';
  botao?.setAttribute('aria-busy', 'true');
  const posts = await postsDoInstagram();
  botao?.removeAttribute('aria-busy');
  // a lista do Instagram manda (legenda e hora); os posts recentes do resumo cobrem o que faltar nela
  const recentes = (Array.isArray(st.dados?.postsRecentes) ? st.dados.postsRecentes : [])
    .map((x) => ({ midiaId: x?.midiaId, tipo: x?.tipo ?? null, caption: x?.titulo ?? '', timestamp: x?.dia ?? null }));
  const grupos = agruparPorPost(st.dados?.porPost);
  const grupo = grupos.find((g) => g.midiaId === id);
  // do resumo guardado sai só a marca "já tem números do app" da lista; os números vêm do GET do post
  const comApp = grupos.filter((g) => g.fontes.some((f) => f.fonte === 'app')).map((g) => g.midiaId);
  const p = abrirPainel(formAppHtml({ midiaId: id, posts: [...posts, ...recentes], titulo: grupo?.titulo ?? '', comApp }));
  if (p) ligarFormApp(p, { id, print });
}

function ligarFormApp(p, { id: inicial, print }) {
  const q = (s) => p.querySelector(s);
  const form = q('#pb-form-app');
  const sel = q('#pb-app-post');
  if (!form || !sel) return;
  const dados = q('#pb-app-dados');
  const caixaEstado = q('#pb-app-estado-caixa');
  const estadoPost = q('#pb-app-estado');
  const tentar = q('#pb-app-tentar');
  const erro = q('#pb-form-erro');
  const confira = q('#pb-confira');
  const apagar = q('#pb-app-apagar');
  const salvar = q('#pb-app-salvar');
  const arquivos = q('#pb-print-arquivos');
  const ler = q('#pb-print-ler');
  const usar = q('#pb-print-usar');
  const estado = q('#pb-print-estado');
  const previas = q('#pb-print-previas');
  const nomes = q('#pb-print-nomes');
  // carregado: o post cujos números salvos (lidos do servidor) estão no formulário; pedido: só o último GET vale
  const ctx = { id: inicial, carregado: '', pedido: 0, imagens: [], ultima: null };
  // este painel ainda aberto e neste post (abrirPainel troca o conteúdo: formulário velho sai do DOM)
  const vivo = (id) => Boolean(id) && form.isConnected && !p.hidden && ctx.id === id && form.dataset.pbPainel === id;
  const minha = (id) => leitura.dono === form && leitura.id === id;

  const avisarPrint = (texto, tipo = '') => { estado.textContent = texto; estado.dataset.tipo = tipo; };
  const limparErros = () => {
    erro.hidden = true;
    erro.replaceChildren();
    form.querySelectorAll('[aria-invalid="true"]').forEach((c) => {
      c.removeAttribute('aria-invalid');
      // a descrição que o campo já tinha (a nota das contas) volta
      if (c.dataset.descAntes) c.setAttribute('aria-describedby', c.dataset.descAntes);
      else c.removeAttribute('aria-describedby');
      delete c.dataset.descAntes;
    });
  };
  const mostrarErros = (erros) => {
    erro.innerHTML = erros.length === 1
      ? esc(erros[0].msg)
      : `<span>Confira ${erros.length} pontos:</span><ul>${erros.map((x) => `<li>${esc(x.msg)}</li>`).join('')}</ul>`;
    erro.hidden = false;
    let primeiro = null;
    for (const x of erros) {
      const campo = x.campo === 'base' ? form.querySelector('input[name="base"]') : x.campo ? form.elements.namedItem(x.campo) : null;
      if (!campo?.setAttribute) continue;
      const antes = campo.getAttribute('aria-describedby');
      if (antes && antes !== 'pb-form-erro' && !campo.dataset.descAntes) campo.dataset.descAntes = antes;
      campo.setAttribute('aria-invalid', 'true');
      campo.setAttribute('aria-describedby', ['pb-form-erro', campo.dataset.descAntes].filter(Boolean).join(' '));
      primeiro ??= campo;
    }
    primeiro?.focus();
  };
  const ocupar = (sim) => {
    sel.disabled = sim;
    ler.setAttribute('aria-disabled', String(sim));
    ler.innerHTML = sim ? `${giro}Lendo…` : `${icone('estatico', 14)}Ler do print`;
  };

  // até os números salvos chegarem do servidor, só o post aceita mexer: aberto com o que a aba guardou (talvez
  // de antes de uma edição no painel do Diagnóstico), o "Salvar" trocaria o número mais novo pelo velho
  const travar = (texto, { falhou = false } = {}) => {
    ctx.carregado = '';
    dados.disabled = true;
    salvar.setAttribute('aria-disabled', 'true');
    apagar.hidden = true;
    estadoPost.textContent = texto;
    estadoPost.dataset.tipo = falhou ? 'erro' : '';
    tentar.hidden = !falhou;
    caixaEstado.hidden = false;
  };
  const destravar = (id) => {
    ctx.carregado = id;
    dados.disabled = false;
    salvar.removeAttribute('aria-disabled');
    estadoPost.textContent = '';
    estadoPost.dataset.tipo = '';
    tentar.hidden = true;
    caixaEstado.hidden = true;
  };
  // os números salvos do post, lidos na hora (GET do post, o mesmo do painel do Diagnóstico). true: chegaram
  // e o painel ainda é deste post
  const carregarPost = async (id) => {
    if (!id) { travar(ESCOLHA_POST); return false; }
    travar(LENDO_POST);
    const vez = ++ctx.pedido;
    let d = null;
    try {
      d = await api('GET', `/api/metricas/post/${id}`);
    } catch (e) {
      if (vez === ctx.pedido && vivo(id)) travar(`Não consegui ler os números salvos deste post: ${textoErro(e)}`, { falhou: true });
      return false;
    }
    if (vez !== ctx.pedido || !vivo(id)) return false;
    const app = appDoDetalhe(d);
    preencher(form, app);
    apagar.hidden = !app;
    destravar(id);
    return true;
  };

  const focarCampos = () => (form.querySelector('input[name="base"]:checked') ?? form.querySelector('input[name="base"]'))?.focus();
  // foco ainda sem dono (no painel recém-aberto ou no body): pode ir pro formulário sem atrapalhar ninguém
  const focoLivre = () => { const a = document.activeElement; return !a || a === document.body || a === p; };

  const terminar = (l) => {
    ocupar(false);
    const fase = faseLeitura(l);
    if (fase === 'pronta') {
      preencher(form, paraFormApp(sugestaoDe(l)) ?? VAZIO_APP);
      limparErros();
      confira.innerHTML = confiraHtml(avisosDaLeitura(l));
      usar.hidden = true;
      avisarPrint('Leitura pronta: os números entraram no formulário.', 'ok');
    } else if (fase === 'erro') avisarPrint(mascarar(l?.erro) || 'Não consegui ler o print.', 'erro');
    else if (fase === 'vazia') avisarPrint('A leitura terminou sem números. Confira se o print é da tela de público do post.', 'erro');
    else avisarPrint('A leitura não voltou. Tente de novo.', 'erro');
  };

  const soltar = () => { if (leitura.dono === form) Object.assign(leitura, { dono: null, id: null }); };

  // acompanha a leitura a cada 2 s enquanto o painel deste post está aberto; fechou, para
  const acompanhar = async (id) => {
    if (!minha(id)) return;
    if (!vivo(id)) { soltar(); return; }
    let l = null;
    try {
      l = (await api('GET', `/api/metricas/publico/post/${id}/print`))?.leitura ?? null;
    } catch (e) {
      if (!minha(id)) return;
      soltar();
      if (vivo(id)) { ocupar(false); avisarPrint(textoErro(e), 'erro'); }
      return;
    }
    if (!minha(id)) return;
    if (!vivo(id)) { soltar(); return; }
    if (faseLeitura(l) === 'rodando') {
      if (Date.now() - leitura.inicio > PRINT.limiteMs) {
        soltar();
        ocupar(false);
        avisarPrint('A leitura passou de 5 minutos. Tente de novo.', 'erro');
        return;
      }
      avisarPrint(`${etapaTexto(l.etapa)}…`);
      leitura.timer = setTimeout(() => acompanhar(id), PRINT.passoMs);
      return;
    }
    soltar();
    terminar(l);
  };

  const comecar = (id, l) => {
    clearTimeout(leitura.timer);
    Object.assign(leitura, { dono: form, id, inicio: Date.now() });
    ocupar(true);
    avisarPrint(`${etapaTexto(l?.etapa)}…`);
    leitura.timer = setTimeout(() => acompanhar(id), PRINT.passoMs);
  };

  // depois dos números salvos: uma leitura ainda rodando é retomada; uma pronta vira botão
  const verLeitura = async (id) => {
    usar.hidden = true;
    if (!id) return;
    let l = null;
    try {
      l = (await api('GET', `/api/metricas/publico/post/${id}/print`))?.leitura ?? null;
    } catch {
      return;
    }
    if (!vivo(id) || minha(id)) return;
    const fase = faseLeitura(l);
    if (fase === 'rodando') comecar(id, l);
    else if (fase === 'pronta') { ctx.ultima = l; usar.hidden = false; }
  };

  // os números salvos primeiro e a leitura de print depois: a sugestão do print nunca é apagada por números
  // salvos que chegaram atrasados
  const abrir = async (id, depois = null) => {
    if (!(await carregarPost(id)) || !vivo(id)) return;
    verLeitura(id);
    depois?.();
  };

  const trocarPost = (id) => {
    ctx.id = RE_MIDIA.test(id) ? id : '';
    form.dataset.pbPainel = ctx.id;
    limparErros();
    confira.replaceChildren();
    avisarPrint('');
    // print escolhido pra outro post não vai junto
    arquivos.value = '';
    ctx.imagens = [];
    ctx.ultima = null;
    usar.hidden = true;
    previas.replaceChildren();
    nomes.textContent = 'Nenhum print escolhido';
    // os números do post anterior saem já; os deste chegam do servidor
    preencher(form, null);
    abrir(ctx.id);
  };
  sel.onchange = () => trocarPost(sel.value);
  // o foco espera no post (sempre habilitado) enquanto relê; chegou, desce pro formulário
  tentar.onclick = () => {
    sel.focus();
    abrir(ctx.id, () => { if (document.activeElement === sel || focoLivre()) focarCampos(); });
  };

  arquivos.onchange = async () => {
    ctx.imagens = [];
    previas.replaceChildren();
    const lista = [...(arquivos.files ?? [])];
    nomes.textContent = lista.length ? lista.map((f) => primeiraLinha(f.name, 40)).join(', ') : 'Nenhum print escolhido';
    if (!lista.length) { avisarPrint(''); return; }
    const problema = validarArquivos(lista);
    if (problema) { avisarPrint(problema, 'erro'); return; }
    let urls = [];
    try {
      urls = await Promise.all(lista.map(lerComoDataUrl));
    } catch (e) {
      avisarPrint(textoErro(e), 'erro');
      return;
    }
    if (!urls.every((u) => /^data:image\/(png|jpeg|webp);base64,/.test(u))) { avisarPrint('Só PNG, JPG ou WebP.', 'erro'); return; }
    ctx.imagens = urls;
    for (const u of urls) {
      const img = document.createElement('img');
      img.src = u;
      img.alt = '';
      previas.append(img);
    }
    avisarPrint(`${plural(urls.length, 'print pronto', 'prints prontos')} pra ler.`);
  };

  ler.onclick = async () => {
    if (ler.getAttribute('aria-disabled') === 'true' || ctx.carregado !== ctx.id) return;
    if (!ctx.id) { avisarPrint('Escolha o post antes de ler o print.', 'erro'); sel.focus(); return; }
    if (!ctx.imagens.length) { avisarPrint('Escolha de 1 a 3 prints da tela de público do post.', 'erro'); arquivos.focus(); return; }
    const id = ctx.id;
    ocupar(true);
    avisarPrint('Mandando os prints…');
    try {
      const r = await api('POST', `/api/metricas/publico/post/${id}/print`, { imagens: ctx.imagens });
      // o painel fechou no meio: a leitura segue no servidor e é retomada quando o painel abrir de novo
      if (!vivo(id)) return;
      const l = r?.leitura ?? null;
      if (faseLeitura(l) === 'rodando' || faseLeitura(l) === 'nenhuma') comecar(id, l);
      else terminar(l);
    } catch (e) {
      ocupar(false);
      avisarPrint(textoErro(e), 'erro');
    }
  };

  usar.onclick = () => { if (ctx.ultima) terminar(ctx.ultima); };

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (salvar.getAttribute('aria-busy') === 'true') return;
    limparErros();
    const id = ctx.id;
    if (!RE_MIDIA.test(id) || id !== sel.value) { mostrarErros([{ campo: 'midiaId', msg: 'Escolha o post.' }]); return; }
    // sem os números salvos na tela, salvar trocaria o que está no servidor por um formulário incompleto
    if (ctx.carregado !== id) { mostrarErros([{ campo: '', msg: 'Espere os números salvos deste post chegarem antes de salvar.' }]); return; }
    const { erros, corpo } = validarApp(lerFormApp(form));
    if (erros.length) { mostrarErros(erros); return; }
    salvar.setAttribute('aria-busy', 'true');
    salvar.setAttribute('aria-disabled', 'true');
    try {
      const r = await api('PUT', `/api/metricas/publico/post/${id}`, corpo);
      if (ehResumo(r)) aplicarResumo(r);
      else st.velho = true;
      fecharPainel();
      desenhar();
      if (st.velho) carregar();
      toast('Público do post salvo');
    } catch (err) {
      salvar.removeAttribute('aria-busy');
      salvar.removeAttribute('aria-disabled');
      mostrarErros([{ campo: '', msg: textoErro(err) }]);
    }
  };

  apagar.onclick = async () => {
    const id = ctx.id;
    if (!RE_MIDIA.test(id) || ctx.carregado !== id || apagar.getAttribute('aria-busy') === 'true') return;
    if (!confirm('Apagar os números do app deste post? O que veio de anúncio continua.')) return;
    apagar.setAttribute('aria-busy', 'true');
    try {
      const r = await api('DELETE', `/api/metricas/publico/post/${id}`);
      if (ehResumo(r)) aplicarResumo(r);
      else st.velho = true;
      fecharPainel();
      desenhar();
      if (st.velho) carregar();
      toast('Números do app apagados');
    } catch (err) {
      apagar.removeAttribute('aria-busy');
      mostrarErros([{ campo: '', msg: textoErro(err) }]);
    }
  };

  if (!inicial) {
    travar(ESCOLHA_POST);
    sel.focus();
    return;
  }
  // aberto num post: os números salvos chegam e o foco desce pro print ou pro formulário (se ninguém o levou)
  abrir(inicial, () => {
    if (!focoLivre()) return;
    if (print) arquivos.focus();
    else focarCampos();
  });
}

// ── entrada ──────────────────────────────────────────────────────────────
// opts: { aoAnalisar } (SPEC §5.2; a aba Público não usa, fica pra paridade com as outras abas)
export function montar(el, opts = {}) {
  if (!el) return;
  alvo = { el, opts: opts ?? {} };
  if (!dicasLigadas) {
    dicasLigadas = true;
    ligarDicas();
  }
  ouvirFoco();
  desenhar();
  // nunca lido, marcado velho (Sincronizar agora, escrita no Diagnóstico) ou lido há mais de 2 minutos
  if (resumoVelho(st)) carregar();
}

// "Sincronizar agora" e escritas de fora deixam o resumo velho: com a aba na tela, busca já (o desenho
// antigo fica apagado até a resposta); fora dela, na próxima vez que montar
export function invalidar() {
  st.velho = true;
  postsCache.lista = null;
  if (!alvo?.el?.isConnected) return;
  // um GET que saiu antes da mudança não vale mais
  st.seq++;
  st.carregando = false;
  carregar();
}
