// Motor do Diagnóstico (Métricas, 30/09/2026; SPEC-METRICAS.md §3.4, §3.5 e §3.11): objetivo por tipo, meta de
// 2× contra a mediana, funil, porquê, efeitos de tag, insights, recomendações por peça, bloco das IAs de
// criação e veredito das hipóteses. PURO: recebe os dados prontos (quem lê arquivo é diagnostico.mjs) e só
// importa estatistica.mjs, pra testar com banco falso. Decisões:
//  - "foi bem" depende do tipo da peça (decisão do Pedro); peça sem tipo usa o alcance
//  - valor comparável aos 7 dias: leitura interpolada do histórico (mais a leitura atual), só depois que a leitura
//    passou dos 7 dias (antes disso a folga da interpolação daria o número de 5 dias e pouco como se fosse o de
//    7); sem ela, o atual quando a leitura já tem 7 dias; senão o atual provisório, com o ritmo contra as peças
//    da base na mesma idade. A idade é a da leitura (insightsEm, ou a data dos números do app), não a de hoje:
//    cache velho não passa por 7 dias, e número do app digitado antes dos 7 dias segue provisório (a pendência
//    pede pra informar de novo)
//  - base do 2×: mediana das 5 anteriores do mesmo tipo e do mesmo formato de mídia (reel com reel, feed e
//    carrossel juntos), sem anúncio e com valor aos 7 dias (provisório não entra em base); menos de 3: o mesmo
//    tipo em qualquer formato, com aviso (nunca pra peça sem tipo); menos de 3: as 5 anteriores do mesmo
//    formato de mídia, com aviso; menos de 3 de novo: sem base
//  - meta = o menor inteiro que dá 2× (Math.ceil do meta2x) e "bateu" = valor >= meta (30/09, C2): a meta que
//    aparece é a que vale. Quem não bateu nunca aparece como "2×": o fator é truncado em uma casa (1,96× é 1,9×)
//    e o valor não é arredondado pra cima até a meta
//  - cartões de meta: um por tipo e formato de mídia (a meta da próxima peça daquele formato), com a última peça
//    medida na régua dela (base e meta dela), não na da próxima
//  - Vendas soma seguidores, visitas e cliques que existirem (no reel, só pelos números do app) e avisa o que
//    faltou. Número do app (manual) vale sobre o da API, campo a campo
//  - funil: base = mediana das 10 anteriores do mesmo formato de mídia, sem anúncio. Etapa é razão (%, ×, por
//    mil), então o score é o log2 da razão pura; a suavização de +1 fica nas contagens do objetivo. Distribuição
//    de peça provisória compara com as anteriores NA MESMA IDADE; sem 3 com leitura nessa idade, fica sem nível
//  - taxa por pessoa alcançada encolhe pro prior beta da própria conta, separado por formato de mídia
//  - post com anúncio aparece, mas fica fora de base e de efeito; ponto fora da curva só ganha a marca
//  - efeito de tag no score do objetivo e, quando a dimensão tem etapa, no da etapa; o insight usa o de
//    evidência maior. Sinais opostos com evidência nos dois viram "testar". Dimensão sim ou não vira insight só
//    pelo lado "com". Peça provisória espera fechar 7 dias pra entrar em efeito. Sem peça do outro lado (todas
//    com o mesmo valor) não há efeito (efeito null, "sem comparação"): seria só a tendência da conta. A
//    evidência é limitada pelo lado menor (5 peças contra 1 não é "forte": a média do outro lado é uma peça
//    só) e o texto diz os dois N. Valor médio da etapa só com as peças todas na mesma unidade
//  - frase determinística, com número real em pt-BR; ausente é "sem dado"; insight nunca afirma causa (sempre
//    N e rótulo de evidência); uma peça é sinal, não prova
//  - recomendação de peça: usar ou evitar com evidência fraca ou melhor, da mesma peça; CTA só da escada do
//    tipo, preço só em Vendas (o gatilho de preço e o de escassez também), gatilho só os do guia do tipo da
//    peça, humor com aviso (o gatilho de humor também), família de gancho só as do tipo, nada de pilar em
//    standby, de dia da semana (é do calendário), de Fator R nem de gancho fora do banco; uma por dimensão, até
//    3, a mais forte primeiro. Sem nenhuma: testar a família de gancho menos usada entre as do tipo. O bloco
//    das IAs de criação segue as mesmas regras e deixa de fora também a hora de postar (quem escreve não escolhe)
//  - hipótese: veredito com a mídia de 7 dias; sem o número, sem base ou com número provisório, segue aberta
//    até 30 dias e só então fecha como inconclusiva, dizendo o que faltou
//  - números da conta e pendências: provisória fica fora da taxa de acerto e da mediana e é contada à parte
//    (C5); os números do app dos reels de Vendas são pedidos com 7 dias (e de novo se vieram antes)
import {
  finito, mediana, media, log2Razao, meta2x, razao, nivelDeScore, ehOutlier, priorBeta, taxaEB, efeitoTag,
  rotuloEvidencia, interpolarIdade, fatorDeScore, msDe, diaBrasilia, horaBrasilia, diasEntre, LIMIAR_ACIMA,
  LIMIAR_ABAIXO, SEM_DADO, n0, num, pct, vezes, vezesDeScore, segundos, plural, listaPt, dataCurta,
} from './estatistica.mjs';

// ---------- regras fixas ----------

const HORA_MS = 3_600_000;
export const IDADE_REF_H = 168;
// hipótese sem número, sem base ou com número provisório espera até aqui antes de fechar como inconclusiva
export const PRAZO_HIPOTESE_H = 30 * 24;
// leitura de anúncios que ainda garante "sem anúncio" (a agenda lê de 12 em 12 horas)
export const LEITURA_ANUNCIOS_MS = 24 * 3_600_000;
const N_BASE = 5;
const N_BASE_FUNIL = 10;
const MIN_BASE = 3;
const MAX_ITENS = 3;
const MAX_POR_LISTA = 3;
const MAX_SINAIS = 3;
const MAX_BLOCO = 1200;
const EPS = 1e-9;
export const PILARES_STANDBY = ['6', '7', '14', '15'];
export const AVISO_HUMOR = 'Humor só se o tema não for multa, dívida, prazo vencido, golpe ou teto.';
// Fator R tem peça única e "fora do banco" não é do banco curado: nenhum dos dois vira recomendação
const FAMILIAS_FORA = ['fator-r', 'fora-do-banco'];
// o dia da peça é do calendário (como o pilar): não vira recomendação. Quem escreve (as IAs de criação) também
// não escolhe a hora de postar
const FORA_DA_PECA = ['diaSemana'];
const FORA_DA_IA = ['diaSemana', 'horario'];
// gatilhos que falam de preço e de oferta (preço só em Vendas) e o de humor (vai com o aviso de humor)
const GATILHOS_PRECO = ['transparencia-preco', 'escassez-real'];
const GATILHOS_HUMOR = ['humor-burocracia'];
export const ROTULO_FORMATO = { reel: 'Reels', feed: 'Posts e carrosséis' };
// faixas de idade da tela de público do post no app (as mesmas de publico-motor.mjs) e a célula mínima
const FAIXAS_APP = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const MINIMO_CELULA = 5;
const RANK = { insuficiente: 0, fraca: 1, moderada: 2, forte: 3 };
const NOME_RANK = ['insuficiente', 'fraca', 'moderada', 'forte'];
const TRACO = new RegExp(`\\s*[${String.fromCharCode(0x2013, 0x2014)}]\\s*`, 'g');
const PECAS = ['reel', 'carrossel', 'estatico', 'stories'];
const TIPOS_MIDIA = ['REELS', 'FEED', 'CAROUSEL_ALBUM'];
export const MIDIA_ID = /^\d{1,40}$/;

// objetivo por tipo (decisão do Pedro, 30/09); curto = como aparece dentro da frase
export const OBJETIVOS = {
  viralizacao: { id: 'alcance', rotulo: 'Alcance', curto: 'alcance', campos: ['reach'] },
  vendas: { id: 'interesse', rotulo: 'Seguidores, visitas ao perfil e cliques no link', curto: 'seguidores, visitas ao perfil e cliques no link', campos: ['follows', 'profileVisits', 'bioLinkClicks'], parcial: true },
  conexao: { id: 'conversa', rotulo: 'Comentários e compartilhamentos', curto: 'comentários e compartilhamentos', campos: ['comments', 'shares'] },
  ensino: { id: 'salvamentos', rotulo: 'Salvamentos', curto: 'salvamentos', campos: ['saved'] },
  conselho: { id: 'salvar-mandar', rotulo: 'Salvamentos e compartilhamentos', curto: 'salvamentos e compartilhamentos', campos: ['saved', 'shares'] },
};
export const OBJETIVO_SEM_TIPO = { id: 'alcance', rotulo: 'Alcance (peça sem tipo)', curto: 'alcance', campos: ['reach'] };
export const TIPOS = Object.keys(OBJETIVOS);
export const objetivoDoTipo = (tipo) => OBJETIVOS[tipo] ?? OBJETIVO_SEM_TIPO;
// um cálculo por métrica (viralização e peça sem tipo dividem o alcance)
const OBJETIVOS_UNICOS = [...new Map([...Object.values(OBJETIVOS), OBJETIVO_SEM_TIPO].map((o) => [o.id, o])).values()];

const CAMPOS_API = [
  'views', 'reach', 'saved', 'shares', 'likes', 'comments', 'interacoes', 'avgWatchMs', 'skipRate', 'totalViews',
  'viewTotalMs', 'reposts', 'profileVisits', 'follows', 'bioLinkClicks',
];
const CAMPOS_APP = ['follows', 'profileVisits', 'bioLinkClicks'];
const NOME_CAMPO = { follows: 'seguidores', profileVisits: 'visitas ao perfil', bioLinkClicks: 'cliques no link' };
const ACOES = [
  { k: 'shares', um: 'compartilhamento', varios: 'compartilhamentos' },
  { k: 'likes', um: 'curtida', varios: 'curtidas' },
  { k: 'saved', um: 'salvamento', varios: 'salvamentos' },
];
export const ETAPAS = ['gancho', 'retencao', 'distribuicao', 'qualidade', 'conversao'];
export const ROTULO_ETAPA = {
  objetivo: 'Métrica do tipo', gancho: 'Gancho (0 a 3s)', retencao: 'Retenção', distribuicao: 'Distribuição',
  qualidade: 'Ação por pessoa alcançada', conversao: 'Interesse no perfil',
};
const ALVO_ETAPA = {
  gancho: 'o gancho', retencao: 'a retenção', distribuicao: 'a distribuição', qualidade: 'a ação por pessoa alcançada',
  conversao: 'o interesse no perfil',
};

// ---------- utilidades ----------

const soma = (xs) => xs.reduce((s, x) => s + x, 0);
const chave = (v) => String(v ?? '');
const limpo = (s) => String(s ?? '').replace(TRACO, ', ').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
const alta = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
const baixa = (s) => (s ? s[0].toLowerCase() + s.slice(1) : '');
// contagem: milhar a partir de 100; abaixo, uma casa (o valor interpolado aos 7 dias pode ser 3,4)
const qtd = (v) => (finito(v) ? (Math.abs(v) >= 100 ? n0(v) : num(v, 1)) : SEM_DADO);
// valor que não chegou na meta nunca aparece arredondado pra cima até ela (1.047,6 contra meta de 1.048 é "1.047")
function qtdAte(v, meta) {
  if (!finito(v) || !finito(meta) || v >= meta - EPS) return qtd(v);
  return Math.abs(v) >= 100 ? n0(Math.floor(v)) : num(Math.floor(v * 10 + 1e-7) / 10, 1);
}
// meta de 2× que aparece e que vale: o menor inteiro com score >= 1 (C2)
const metaDaBase = (base) => (finito(base) ? Math.ceil(meta2x(base) - EPS) : null);
// fator de quem não bateu a meta: truncado em uma casa e nunca "2×" (1,96× é "1,9×", não "2×")
function vezesAbaixo(score) {
  const f = fatorDeScore(score);
  if (!finito(f)) return SEM_DADO;
  return f < 0.1 ? vezes(f) : vezes(Math.min(Math.floor(f * 10 + 1e-7) / 10, 1.9));
}
// fator "perto do normal" (entre 1/1,5 e 1,5): arredonda pro lado do 1×, pra 1,46× não aparecer como o 1,5× que confirma
function vezesNormal(score) {
  const f = fatorDeScore(score);
  if (!finito(f)) return SEM_DADO;
  return vezes(f >= 1 ? Math.floor(f * 10 + 1e-7) / 10 : Math.ceil(f * 10 - 1e-7) / 10);
}
const pct0 = (v) => pct(v, { casas: 0 });
// o singular é do número que aparece: "1 salvamento", "1,5 salvamentos", "0 salvamentos"
const contagem = (v, um, varios) => {
  const t = num(v, 1);
  return `${t} ${t === '1' ? um : varios}`;
};
const msDo = (p) => p?.ms ?? msDe(p?.timestamp);
const formatoDe = (p) => p?.formato ?? p?.formatoMidia ?? null;
const doTipo = (t) => (TIPOS.includes(t) ? t : null);
export const formatoDaPeca = (peca) => (peca === 'reel' ? 'reel' : peca === 'carrossel' || peca === 'estatico' ? 'feed' : null);
const rotuloTipo = (tipo, rotulos) => (tipo ? limpo(rotulos?.[tipo]) || tipo : 'sem tipo');
const ordemInsight = (a, b) => (RANK[b.evidencia] ?? 0) - (RANK[a.evidencia] ?? 0) || Math.abs(b.efeito ?? 0) - Math.abs(a.efeito ?? 0);
// "reels", "carrosséis", "estáticos" ou "peças", pelo que as peças da conta têm em comum
function nPecas(n, pecas) {
  const u = [...new Set(pecas ?? [])];
  const [um, varios] = u.length !== 1 ? ['peça', 'peças'] : { reel: ['reel', 'reels'], carrossel: ['carrossel', 'carrosséis'], estatico: ['estático', 'estáticos'] }[u[0]] ?? ['peça', 'peças'];
  return plural(n, um, varios);
}

// ---------- codebook (recebido pronto de mecanismos-codebook.mjs) ----------

export function listaDimensoes(codebook) {
  const lista = Array.isArray(codebook) ? codebook : Array.isArray(codebook?.dimensoes) ? codebook.dimensoes : codebook && typeof codebook === 'object' ? Object.values(codebook) : [];
  return lista.filter((d) => d && typeof d.id === 'string');
}
const ehBool = (d) => d?.tipo === 'bool';
const aplicaNaPeca = (d, peca) => !Array.isArray(d?.pecas) || !d.pecas.length || d.pecas.includes(peca);

export function nomeDoValor(d, valor) {
  const k = chave(valor);
  const v = (d?.valores ?? []).find((x) => chave(x?.id) === k);
  if (v?.nome) return limpo(v.nome);
  if (ehBool(d) || typeof valor === 'boolean') return k === 'true' ? 'Sim' : 'Não';
  return limpo(k);
}

// as opções do seletor no painel do post (sim ou não sem lista vira as duas)
export function opcoesDaDimensao(d) {
  const vs = (d?.valores ?? []).filter((v) => v && v.id != null).map((v) => ({ id: v.id, nome: limpo(v.nome ?? chave(v.id)) }));
  return vs.length || !ehBool(d) ? vs : [{ id: true, nome: 'Sim' }, { id: false, nome: 'Não' }];
}

// ---------- frases de cada dimensão ----------
// curto: o nome dentro de uma lista ("gancho de pergunta"); prep: o complemento de "Peças ..." e de "Com ...";
// sem: o outro lado de uma dimensão sim ou não ("sem rosto")

const FRASE_BOOL = {
  rostoInicio: ['rosto nos 3 primeiros segundos', 'sem rosto'],
  textoInicio: ['texto na tela no começo', 'sem texto na tela'],
  telaApp: ['tela do app', 'sem a tela do app'],
  humor: ['humor', 'sem humor'],
  preco: ['preço na peça', 'sem preço'],
  impulsionado: ['anúncio', 'sem anúncio'],
};
const FORMA_GANCHO = { pergunta: 'gancho de pergunta', afirmacao: 'gancho de afirmação', numero: 'gancho com número', cena: 'gancho de cena', 'sem-fala': 'gancho sem fala' };
const VOZ = { leo: 'o Léo falando', pedro: 'o Pedro falando', mauro: 'o Mauro falando', institucional: 'a voz da marca', 'sem-voz': 'sem voz', outro: 'outra pessoa falando' };
const AUDIO = { fala: 'áudio só de fala', musica: 'áudio só de música', 'fala-e-musica': 'fala com música', 'sem-audio': 'sem áudio' };
const DURACAO = { 'ate-15': 'até 15s', '16-30': '16 a 30s', '31-45': '31 a 45s', '46-60': '46 a 60s', 'mais-60': 'mais de 60s' };
const SLIDES = { '2-3': '2 a 3 slides', '4-6': '4 a 6 slides', '7-10': '7 a 10 slides' };
const LEGENDA = { curta: 'legenda curta', media: 'legenda média', longa: 'legenda longa' };
const HORARIO = { madrugada: 'de madrugada', manha: 'de manhã', tarde: 'à tarde', noite: 'à noite' };
const DIA_SEMANA = { dom: 'no domingo', seg: 'na segunda', ter: 'na terça', qua: 'na quarta', qui: 'na quinta', sex: 'na sexta', sab: 'no sábado' };
const LINHA = { v1: 'linha editorial v1', anterior: 'linha editorial anterior' };
const CTA = { 'sem-cta': 'sem CTA', 'fora-do-escopo': 'CTA fora do escopo', 'lista-de-espera': 'CTA da lista de espera', mandar: 'CTA de mandar pra alguém' };

export function frase(d, valor, nome = null) {
  const id = d?.id;
  const k = chave(valor);
  const n = nome ?? nomeDoValor(d, valor);
  if (FRASE_BOOL[id] || ehBool(d)) {
    const [com, sem] = FRASE_BOOL[id] ?? [baixa(limpo(d?.nome ?? id)), `sem ${baixa(limpo(d?.nome ?? id))}`];
    return k === 'true'
      ? { curto: com, prep: `com ${com}`, sem, titulo: alta(com) }
      : { curto: sem, prep: sem, sem: `com ${com}`, titulo: alta(sem) };
  }
  let curto;
  let prep = null;
  switch (id) {
    case 'pilar': curto = `pilar ${n}`; prep = `do ${curto}`; break;
    case 'bloco': curto = `bloco ${n}`; prep = `do ${curto}`; break;
    case 'tipo': curto = `tipo ${n}`; prep = `do ${curto}`; break;
    case 'formato': curto = `formato ${n}`; prep = `no ${curto}`; break;
    case 'linha': curto = LINHA[k] ?? `linha ${n}`; prep = `da ${curto}`; break;
    case 'ganchoFamilia': curto = `gancho da família ${n}`; break;
    case 'ganchoForma': curto = FORMA_GANCHO[k] ?? `gancho: ${baixa(n)}`; break;
    case 'gatilho': curto = `gatilho ${baixa(n)}`; prep = `com o ${curto}`; break;
    case 'cta': curto = CTA[k] ?? `CTA de ${baixa(n)}`; break;
    case 'voz': curto = VOZ[k] ?? `voz: ${n}`; break;
    case 'audio': curto = AUDIO[k] ?? `áudio: ${baixa(n)}`; break;
    case 'duracaoFaixa': curto = `duração de ${DURACAO[k] ?? baixa(n)}`; break;
    case 'slidesFaixa': curto = SLIDES[k] ?? baixa(n); break;
    case 'legendaFaixa': curto = LEGENDA[k] ?? `legenda ${baixa(n)}`; break;
    case 'horario': curto = `postagem ${HORARIO[k] ?? baixa(n)}`; break;
    case 'diaSemana': curto = `postagem ${DIA_SEMANA[k] ?? baixa(n)}`; break;
    default: curto = `${baixa(limpo(d?.nome ?? id))}: ${n}`;
  }
  prep ??= curto.startsWith('sem ') ? curto : `com ${curto}`;
  return { curto, prep, sem: null, titulo: alta(curto) };
}

// ---------- montar as linhas por post ----------

function tipoMidiaDe(m) {
  if (TIPOS_MIDIA.includes(m?.tipo)) return m.tipo;
  const media = String(m?.mediaType ?? m?.media_type ?? '').toUpperCase();
  if (media === 'CAROUSEL_ALBUM') return 'CAROUSEL_ALBUM';
  if (media === 'IMAGE') return 'FEED';
  return 'REELS';
}
// igual ao pecaDaMidia do codebook: vídeo de feed é reel
function pecaDe(m, tipoMidia) {
  if (tipoMidia === 'CAROUSEL_ALBUM') return 'carrossel';
  if (tipoMidia === 'REELS') return 'reel';
  return String(m?.mediaType ?? '').toUpperCase() === 'VIDEO' ? 'reel' : 'estatico';
}

function primeiraLinha(s, max = 140) {
  const l = limpo(String(s ?? '').split('\n').map((x) => x.trim()).find(Boolean) ?? '');
  return l.length > max ? `${l.slice(0, max - 1).trimEnd()}…` : l;
}

function limparTags(t) {
  const out = {};
  for (const [dim, x] of Object.entries(t && typeof t === 'object' ? t : {})) {
    if (x && typeof x === 'object' && x.valor != null && x.valor !== '') out[dim] = x;
  }
  return out;
}

// seguidores no dia do post: o total do dia em publico.json (o dia anterior mais perto, ou o primeiro que
// existir); sem nenhum, o de hoje da conta
function seguidoresPorDia(publico, conta) {
  const dias = Object.entries(publico?.diario && typeof publico.diario === 'object' ? publico.diario : {})
    .filter(([d, x]) => /^\d{4}-\d{2}-\d{2}$/.test(d) && finito(x?.seguidoresTotal) && x.seguidoresTotal > 0)
    .map(([d, x]) => [d, x.seguidoresTotal])
    .sort((a, b) => a[0].localeCompare(b[0]));
  const atual = finito(conta?.followers_count) && conta.followers_count > 0 ? conta.followers_count : null;
  return { dias, atual };
}
function seguidoresNoDia({ dias, atual }, dia) {
  if (dia && dias.length) {
    let antes = null;
    for (const d of dias) {
      if (d[0] <= dia) antes = d;
      else break;
    }
    const x = antes ?? dias[0];
    return { valor: x[1], dia: x[0], exato: x[0] === dia, origem: 'dia' };
  }
  return { valor: atual, dia: null, exato: false, origem: atual ? 'conta' : null };
}

function interno(m, dados, ctx) {
  const id = String(m?.midiaId ?? '');
  const ms = msDe(m?.timestamp);
  if (!MIDIA_ID.test(id) || ms == null) return null;
  const registro = dados.registros?.[id] ?? null;
  const tags = limparTags(dados.tagsPorMidia?.[id]);
  const reel = dados.reelPorMidia?.[id] ?? null;
  const tipoMidia = tipoMidiaDe(m);
  const manual = registro?.manual && typeof registro.manual === 'object' ? registro.manual : null;
  const idadeH = Math.max(0, (ctx.agoraMs - ms) / HORA_MS);
  const idadeEm = (em) => {
    const x = msDe(em);
    return x == null ? idadeH : Math.max(0, Math.min(idadeH, (x - ms) / HORA_MS));
  };
  const leituraH = idadeEm(m.insightsEm);
  const valores = {};
  const fontes = {};
  const idades = {};
  for (const k of CAMPOS_API) {
    valores[k] = finito(m[k]) ? m[k] : null;
    fontes[k] = valores[k] == null ? null : 'api';
    idades[k] = leituraH;
  }
  // número do app (digitado) vale sobre o da API, campo a campo
  for (const k of CAMPOS_APP) {
    if (!finito(manual?.[k])) continue;
    valores[k] = manual[k];
    fontes[k] = 'manual';
    idades[k] = idadeEm(manual.em);
  }
  const duracaoS = [dados.duracoes?.[id], registro?.ia?.duracaoS].find((x) => finito(x) && x > 0) ?? null;
  const tipo = doTipo(tags.tipo?.valor) ?? doTipo(reel?.tipo);
  const pilarBruto = tags.pilar?.valor ?? reel?.pilar;
  const pilar = pilarBruto == null || pilarBruto === '' || !Number.isFinite(Number(pilarBruto)) ? null : Number(pilarBruto);
  const pilarObj = ctx.pilares.find((x) => x?.id != null && Number(x.id) === pilar) ?? null;
  const declarado = [tags.impulsionado?.valor, registro?.impulsionado].find((v) => typeof v === 'boolean');
  // sem palavra da pessoa nem tag: anúncio ligado ao post (lido ou só listado) é certeza; o resto não se sabe
  const impulsionado = typeof declarado === 'boolean' ? declarado : anuncioDoPost(id, m.timestamp, dados.anuncios) === true ? true : null;
  const seg = seguidoresNoDia(ctx.seguidores, diaBrasilia(ms));
  const v = valores;
  return {
    id, ms, m, registro, tags, reel, tipoMidia, formato: tipoMidia === 'REELS' ? 'reel' : 'feed', peca: pecaDe(m, tipoMidia),
    idadeH, leituraH, valores, fontes, idades,
    leituras: Array.isArray(dados.historico?.[id]?.leituras) ? dados.historico[id].leituras : [],
    tipo, pilar, pilarNome: pilarObj?.nome ? limpo(pilarObj.nome) : null,
    bloco: limpo(tags.bloco?.valor ?? reel?.bloco ?? pilarObj?.bloco ?? '') || null,
    impulsionado,
    // views totais (pago e Facebook juntos) bem acima das orgânicas: sinal de anúncio, não prova
    talvezImpulsionado: impulsionado == null && finito(v.totalViews) && finito(v.views) && v.totalViews >= 1.5 * v.views && v.totalViews - v.views >= 100,
    seguidores: seg,
    metricas: {
      views: v.views, reach: v.reach, saved: v.saved, shares: v.shares, likes: v.likes, comments: v.comments, interacoes: v.interacoes,
      avgWatchMs: v.avgWatchMs, skipRate: v.skipRate,
      retido3s: finito(v.skipRate) ? Math.min(100, Math.max(0, 100 - v.skipRate)) : null,
      duracaoS,
      pctAssistido: finito(v.avgWatchMs) && duracaoS ? (v.avgWatchMs / 1000 / duracaoS) * 100 : null,
      // views além da primeira de cada conta (views menos alcance)
      replays: finito(v.views) && finito(v.reach) ? Math.max(0, v.views - v.reach) : null,
      follows: v.follows, profileVisits: v.profileVisits, bioLinkClicks: v.bioLinkClicks,
      cadastros: finito(manual?.cadastros) ? manual.cadastros : null,
      totalViews: v.totalViews, seguidoresNoDia: seg.valor, alcancePorSeguidor: razao(v.reach, seg.valor),
    },
  };
}

// os pontos de um campo pra interpolar por idade: o histórico mais a leitura atual (a do cache ou a do app, na
// idade dela). A atual entra porque o histórico pode não ter a última sincronização
function pontos(p, c) {
  const atual = finito(p.valores[c]) && finito(p.idades[c]) ? [{ idadeH: p.idades[c], [c]: p.valores[c] }] : [];
  return [...p.leituras, ...atual];
}

// valor de um objetivo numa peça: aos 7 dias pelo histórico; senão o atual (provisório antes de 7 dias)
function medir(p, obj) {
  const campos = obj.parcial ? obj.campos.filter((c) => finito(p.valores[c])) : obj.campos;
  if (!campos.length || campos.some((c) => !finito(p.valores[c]))) {
    return { valor: null, fonte: null, idadeRef: null, provisorio: false, campos: [], idadeH: null };
  }
  const manual = campos.some((c) => p.fontes[c] === 'manual');
  // o valor aos 7 dias só existe depois que a leitura passou dos 7 dias: antes disso a folga da interpolação
  // devolveria a leitura de 5 dias e pouco como se fosse a de 7 (um número que ainda cresce, com cara de final)
  if (!manual && p.leituraH >= IDADE_REF_H) {
    const aos7 = campos.map((c) => interpolarIdade(pontos(p, c), c, IDADE_REF_H));
    if (aos7.every(finito)) return { valor: soma(aos7), fonte: 'api', idadeRef: '7d', provisorio: false, campos, idadeH: IDADE_REF_H };
  }
  const idadeH = Math.min(...campos.map((c) => p.idades[c]));
  return { valor: soma(campos.map((c) => p.valores[c])), fonte: manual ? 'manual' : 'api', idadeRef: 'atual', provisorio: idadeH < IDADE_REF_H, campos, idadeH };
}

function valorNaIdade(p, campos, horas) {
  const vs = campos.map((c) => interpolarIdade(pontos(p, c), c, horas));
  return vs.length && vs.every(finito) ? soma(vs) : null;
}

// base do 2×: as 5 anteriores do mesmo tipo E do mesmo formato de mídia (reel com reel; feed e carrossel
// juntos), com valor aos 7 dias. Refinado em 30/09 com os dados reais: alcance e salvamento de reel e de
// carrossel não se comparam (na conta, reel de 1.018 contas contra carrossel de 52), e sem isso a peça sem
// tipo misturava tudo. Menos de 3: o mesmo tipo em qualquer formato ('tipo-misto', com aviso; nunca pra peça
// sem tipo); menos de 3: o mesmo formato de mídia. Serve às linhas internas e às PostRow
function selecionarBase(lista, objId, { antesDe, tipo, formato }) {
  const anteriores = (lista ?? []).filter((q) => msDo(q) < antesDe && q.impulsionado !== true).sort((a, b) => msDo(b) - msDo(a));
  const pegar = (filtro) => {
    const usados = [];
    for (const q of anteriores) {
      if (usados.length === N_BASE) break;
      const c = q.comparaveis?.[objId];
      if (filtro(q) && finito(c?.valor) && !c.provisorio) usados.push({ q, valor: c.valor });
    }
    return usados;
  };
  const mesmoTipo = (q) => (q.tipo ?? null) === (tipo ?? null);
  const tentativas = [
    ['tipo', (q) => mesmoTipo(q) && (!formato || formatoDe(q) === formato)],
    ...(tipo && formato ? [['tipo-misto', mesmoTipo]] : []),
    ...(formato ? [['formato', (q) => formatoDe(q) === formato]] : []),
  ];
  let maior = 0;
  for (const [de, filtro] of tentativas) {
    const usados = pegar(filtro);
    if (usados.length >= MIN_BASE) return { base: mediana(usados.map((u) => u.valor)), baseN: usados.length, baseDe: de, usados: usados.map((u) => u.q) };
    maior = Math.max(maior, usados.length);
  }
  return { base: null, baseN: maior, baseDe: null, usados: [] };
}

function objetivoDe(p, todos) {
  const obj = objetivoDoTipo(p.tipo);
  const v = p.comparaveis[obj.id];
  const sel = selecionarBase(todos, obj.id, { antesDe: p.ms, tipo: p.tipo, formato: p.formato });
  const score = finito(v.valor) && sel.base != null ? log2Razao(v.valor, sel.base) : null;
  let ritmo = null;
  let ritmoBase = null;
  let ritmoN = 0;
  if (v.provisorio && finito(v.valor) && v.fonte === 'api' && sel.usados.length) {
    const naIdade = sel.usados.map((q) => valorNaIdade(q, v.campos, v.idadeH)).filter(finito);
    if (naIdade.length >= MIN_BASE) {
      ritmoBase = mediana(naIdade);
      ritmo = log2Razao(v.valor, ritmoBase);
      ritmoN = naIdade.length;
    }
  }
  const meta = metaDaBase(sel.base);
  // bateu = chegou na meta que aparece (o menor inteiro que dá 2×); provisório abaixo dela ainda pode bater
  const chegou = finito(v.valor) && finito(meta) ? v.valor >= meta - EPS : null;
  p.objetivo = {
    id: obj.id, rotulo: obj.rotulo, valor: v.valor, fonte: v.fonte, idadeRef: v.idadeRef, provisorio: v.provisorio,
    base: sel.base, baseN: sel.baseN, baseDe: sel.baseDe, meta,
    razao: razao(v.valor, sel.base), score,
    bateuMeta: chegou == null ? null : chegou ? true : v.provisorio ? null : false,
    // idade (horas) da leitura que deu o valor: a do cache ou a dos números do app
    idadeValorH: finito(v.idadeH) ? Math.round(v.idadeH * 10) / 10 : null,
    ritmo, ritmoBase, ritmoN, cadastros: p.metricas.cadastros, campos: v.campos, baseMidias: sel.usados.map((q) => q.id ?? q.midiaId),
  };
}

// ---------- funil ----------

// eventos de interesse no perfil: reel só tem seguidores (do app); feed soma o que tiver
function eventosConversao(q) {
  if (q.formato === 'reel') return finito(q.valores.follows) ? q.valores.follows : null;
  const vs = CAMPOS_APP.map((k) => q.valores[k]).filter(finito);
  return vs.length ? soma(vs) : null;
}

function prioresDaConta(todos) {
  const out = {};
  for (const f of ['reel', 'feed']) {
    const lista = todos.filter((q) => q.formato === f && q.impulsionado !== true && q.valores.reach > 0);
    const pares = (ev) => lista
      .map((q) => ({ e: ev(q), n: q.valores.reach }))
      .filter((x) => finito(x.e) && x.e >= 0)
      .map((x) => ({ eventos: Math.min(x.e, x.n), n: x.n }));
    out[f] = { conversao: priorBeta(pares(eventosConversao)) };
    for (const a of ACOES) out[f][a.k] = priorBeta(pares((q) => q.valores[a.k]));
  }
  return out;
}

function baseSimples(anteriores, valorDe) {
  const vs = [];
  for (const q of anteriores) {
    if (vs.length === N_BASE_FUNIL) break;
    const v = valorDe(q);
    if (finito(v)) vs.push(v);
  }
  return { base: vs.length >= MIN_BASE ? mediana(vs) : null, n: vs.length };
}

// etapa é razão (%, ×, por mil): log2 da razão pura. Zero (ou base zero) cai na suavizada de estatistica.mjs
const scoreEtapa = (v, b) => (finito(v) && finito(b) && v > 0 && b > 0 ? Math.log2(v / b) : log2Razao(v, b));

function itemEtapa(etapa, { valor, base, n, score, formatar, unidade, detalhe = '', extra = {} }) {
  const s = score !== undefined ? score : finito(valor) && finito(base) ? scoreEtapa(valor, base) : null;
  return {
    etapa, rotulo: ROTULO_ETAPA[etapa], valor: finito(valor) ? valor : null, valorTexto: formatar(finito(valor) ? valor : null),
    base: finito(base) ? base : null, baseTexto: formatar(finito(base) ? base : null), baseN: n ?? 0,
    score: finito(s) ? s : null, nivel: finito(s) ? nivelDeScore(s) : null, detalhe, unidade, ...extra,
  };
}
const porMilTexto = (x) => (finito(x) ? `${num(x, 1)} por mil` : SEM_DADO);

const CALCULO_ETAPA = {
  gancho(p, ant) {
    const b = baseSimples(ant, (q) => q.metricas.retido3s);
    return itemEtapa('gancho', {
      valor: p.metricas.retido3s, base: b.base, n: b.n, formatar: (x) => pct(x), unidade: 'pct',
      detalhe: finito(p.metricas.skipRate) ? `${pct(p.metricas.skipRate)} pularam nos 3 primeiros segundos.` : 'A Meta não mandou a taxa de pulo deste reel.',
    });
  },
  retencao(p, ant) {
    const { duracaoS: dur, avgWatchMs: avg, pctAssistido } = p.metricas;
    if (finito(pctAssistido)) {
      const b = baseSimples(ant, (q) => q.metricas.pctAssistido);
      if (b.base != null) {
        return itemEtapa('retencao', {
          valor: pctAssistido, base: b.base, n: b.n, formatar: (x) => pct(x), unidade: 'pct',
          detalhe: `${segundos(avg)} assistidos em média, de ${segundos(dur * 1000)} de vídeo.`,
        });
      }
    }
    // sem duração (ou poucos reels com ela): compara os segundos assistidos, com aviso
    const s = (q) => (finito(q.metricas.avgWatchMs) ? q.metricas.avgWatchMs / 1000 : null);
    const b = baseSimples(ant, s);
    return itemEtapa('retencao', {
      valor: s(p), base: b.base, n: b.n, formatar: (x) => segundos(finito(x) ? x * 1000 : null), unidade: 's',
      detalhe: dur
        ? 'Poucos reels anteriores têm a duração: a comparação é em segundos assistidos.'
        : 'Sem a duração do vídeo: a comparação é em segundos assistidos (a duração sai da análise do vídeo ou da etiquetagem com IA).',
    });
  },
  distribuicao(p, ant) {
    const porSeguidor = (q) => {
      const c = q.comparaveis.alcance;
      return finito(c?.valor) && q.seguidores.valor > 0 ? c.valor / q.seguidores.valor : null;
    };
    const alc = p.comparaveis.alcance;
    // peça provisória: o alcance ainda cresce e, contra a mediana dos 7 dias, ficaria "abaixo" quase sempre. A
    // base vira a das anteriores NA MESMA IDADE (como o ritmo do objetivo); sem 3 com leitura nessa idade, fica
    // sem base e sem nível (fora do gargalo, do ponto forte e do porquê) até fechar os 7 dias
    const mesmaIdade = Boolean(alc.provisorio);
    const b = mesmaIdade
      ? baseSimples(ant.filter((q) => !q.comparaveis.alcance.provisorio), (q) => {
        const v = valorNaIdade(q, ['reach'], alc.idadeH);
        return finito(v) && q.seguidores.valor > 0 ? v / q.seguidores.valor : null;
      })
      : baseSimples(ant, (q) => (q.comparaveis.alcance.provisorio ? null : porSeguidor(q)));
    const seg = p.seguidores;
    const quando = seg.origem === 'dia' ? (seg.exato ? 'do dia' : `de ${dataCurta(seg.dia)}`) : 'de hoje';
    const idade = !mesmaIdade
      ? ''
      : b.base != null
        ? ` A leitura é de ${tempoNoAr(alc.idadeH)} de post: a mediana é a das peças anteriores na mesma idade.`
        : ` A leitura é de ${tempoNoAr(alc.idadeH)} de post e o alcance ainda cresce: sem 3 peças anteriores com leitura nessa idade, a comparação espera os 7 dias.`;
    const detalhe = finito(alc.valor) && seg.valor
      ? `Alcance de ${n0(alc.valor)} contas${alc.idadeRef === '7d' ? ' aos 7 dias' : ''}, com ${n0(seg.valor)} seguidores ${quando}.${idade}`
      : 'Sem o alcance ou sem o número de seguidores.';
    return itemEtapa('distribuicao', { valor: porSeguidor(p), base: b.base, n: b.n, formatar: vezes, unidade: 'x', detalhe, extra: { alcance: alc.valor, mesmaIdade } });
  },
  // índice por mil alcançados = média geométrica das três taxas encolhidas; log2(índice ÷ índice da base) é
  // exatamente a média dos três scores (SPEC), então número, base e nível contam a mesma história
  qualidade(p, ant, pr) {
    const taxa = (q, k) => {
      const r = q.valores.reach;
      const e = q.valores[k];
      return r > 0 && finito(e) && e >= 0 ? taxaEB(Math.min(e, r), r, pr[k]) : null;
    };
    const porMil = (q, k) => (q.valores.reach > 0 && finito(q.valores[k]) ? (q.valores[k] / q.valores.reach) * 1000 : null);
    const partes = ACOES.map((a) => {
      const t = taxa(p, a.k);
      const b = baseSimples(ant, (q) => taxa(q, a.k));
      return {
        metrica: a.k, porMil: porMil(p, a.k), basePorMil: baseSimples(ant, (q) => porMil(q, a.k)).base, taxa: t, baseTaxa: b.base, n: b.n,
        score: finito(t) && finito(b.base) ? scoreEtapa(t, b.base) : null,
      };
    });
    const geo = (xs) => (xs.length && xs.every((x) => finito(x) && x > 0) ? 2 ** media(xs.map(Math.log2)) : null);
    const comBase = partes.filter((x) => finito(x.score));
    const soDoPost = partes.filter((x) => finito(x.taxa));
    const detalhe = partes.map((x) => `${ACOES.find((a) => a.k === x.metrica).varios}: ${num(x.porMil, 1)} por mil (mediana ${num(x.basePorMil, 1)})`).join('; ');
    return itemEtapa('qualidade', {
      valor: geo((comBase.length ? comBase : soDoPost).map((x) => x.taxa * 1000)),
      base: comBase.length ? geo(comBase.map((x) => x.baseTaxa * 1000)) : null,
      n: Math.max(0, ...partes.map((x) => x.n)), score: comBase.length ? media(comBase.map((x) => x.score)) : null,
      formatar: porMilTexto, unidade: 'pormil',
      detalhe: `Junta compartilhamentos, curtidas e salvamentos com o mesmo peso, por mil alcançados (com pouca gente, o número puxa pro padrão da conta). ${alta(detalhe)}.`,
      extra: { partes: partes.map(({ metrica, porMil: pm, basePorMil, score }) => ({ metrica, porMil: pm, basePorMil, score })) },
    });
  },
  // taxa encolhida no número e na base (o nível bate com eles); o número cru fica no detalhe e na frase
  conversao(p, ant, pr) {
    const taxa = (q) => {
      const r = q.valores.reach;
      const e = eventosConversao(q);
      return r > 0 && finito(e) && e >= 0 ? taxaEB(Math.min(e, r), r, pr.conversao) : null;
    };
    const porMil = (q) => {
      const e = eventosConversao(q);
      return q.valores.reach > 0 && finito(e) ? (e / q.valores.reach) * 1000 : null;
    };
    const t = taxa(p);
    const b = baseSimples(ant, taxa);
    const ev = eventosConversao(p);
    const reel = p.formato === 'reel';
    const cru = finito(ev) && p.valores.reach > 0
      ? `${reel ? plural(ev, 'seguidor', 'seguidores') : plural(ev, 'ação', 'ações')} em ${n0(p.valores.reach)} alcançados (${num(porMil(p), 1)} por mil); com pouca gente, o número puxa pro padrão da conta.`
      : '';
    const detalhe = !reel
      ? `Seguir, visitar o perfil e clicar no link da bio. ${cru}`.trim()
      : finito(p.valores.follows) ? `Seguidores que o app do Instagram mostra neste reel: ${cru}` : 'Reel: só com o número de Seguidores do app do Instagram, informado à mão.';
    return itemEtapa('conversao', {
      valor: finito(t) ? t * 1000 : null, base: finito(b.base) ? b.base * 1000 : null, n: b.n,
      score: finito(t) && finito(b.base) ? scoreEtapa(t, b.base) : null, formatar: porMilTexto, unidade: 'pormil', detalhe,
      extra: { bruto: porMil(p) },
    });
  },
};

function funilDe(p, todos, priores) {
  const anteriores = todos.filter((q) => q.ms < p.ms && q.impulsionado !== true && q.formato === p.formato);
  const etapas = p.formato === 'reel' ? ETAPAS : ETAPAS.filter((e) => e !== 'gancho' && e !== 'retencao');
  p.funil = etapas.map((e) => CALCULO_ETAPA[e](p, anteriores, priores[p.formato]));
  const comScore = p.funil.filter((x) => finito(x.score));
  const menor = comScore.reduce((a, x) => (!a || x.score < a.score ? x : a), null);
  const maior = comScore.reduce((a, x) => (!a || x.score > a.score ? x : a), null);
  p.gargalo = menor?.nivel === 'abaixo' ? menor.etapa : null;
  p.forte = maior?.nivel === 'acima' ? maior.etapa : null;
}

function marcarOutliers(todos) {
  const ok = todos.filter((q) => finito(q.objetivo?.score) && !q.objetivo.provisorio && q.impulsionado !== true);
  const scores = ok.map((q) => q.objetivo.score);
  const dentro = new Set(ok);
  for (const q of todos) q.outlier = dentro.has(q) && ehOutlier(q.objetivo.score, scores);
}

// ---------- o porquê (frases determinísticas, com os números) ----------

function tempoNoAr(h) {
  if (h < 24) return plural(Math.max(1, Math.round(h)), 'hora', 'horas');
  return plural(Math.floor(h / 24), 'dia', 'dias');
}

function fraseObjetivo(p, rotulos) {
  const o = p.objetivo;
  if (!finito(o.valor) || o.base == null) return null;
  const R = rotuloTipo(p.tipo, rotulos);
  const obj = objetivoDoTipo(p.tipo);
  const metrica = p.tipo ? `Na métrica do tipo ${R} (${obj.curto})` : `Na métrica da peça sem tipo (${obj.curto})`;
  if (o.provisorio) {
    const ritmo = finito(o.ritmo) ? ` No ritmo das peças da base na mesma idade: ${vezesDeScore(o.ritmo)}.` : '';
    // a idade é a da leitura que deu o número (a do cache ou a dos números do app)
    const texto = `${metrica}, fez ${qtdAte(o.valor, o.meta)} em ${tempoNoAr(o.idadeValorH ?? p.leituraH)} no ar; a meta de 2× é ${qtd(o.meta)}.${o.bateuMeta ? ' Já bateu.' : ritmo}`;
    const lado = o.bateuMeta ? 'bem' : finito(o.ritmo) ? (o.ritmo >= 0 ? 'bem' : 'mal') : null;
    return lado ? { texto, lado } : null;
  }
  const oFormato = p.formato === 'reel' ? 'reels' : 'posts do feed';
  const deQuem = o.baseDe === 'formato'
    ? `dos últimos ${n0(o.baseN)} ${oFormato}`
    : o.baseDe === 'tipo-misto'
      ? `das últimas ${n0(o.baseN)} peças de ${R} (reels e posts juntos)`
      : p.tipo ? `dos últimos ${n0(o.baseN)} ${oFormato} de ${R}` : `dos últimos ${n0(o.baseN)} ${oFormato} sem tipo`;
  const texto = `${metrica}, fez ${qtdAte(o.valor, o.meta)}${o.idadeRef === '7d' ? ' aos 7 dias' : ''}, contra ${qtd(o.base)} na mediana ${deQuem}. Meta de 2×: ${qtd(o.meta)}. ${o.bateuMeta ? 'Bateu.' : `Ficou em ${vezesAbaixo(o.score)}.`}`;
  // igual à mediana não é motivo de ter ido bem nem mal
  if (!o.bateuMeta && Math.abs(o.score) < EPS) return null;
  return { texto, lado: o.bateuMeta || o.score > 0 ? 'bem' : 'mal' };
}

function fraseEtapa(x, p) {
  if (x.nivel !== 'acima' && x.nivel !== 'abaixo') return null;
  const acima = x.nivel === 'acima';
  const dosUltimos = p.formato === 'reel' ? 'dos últimos reels' : 'dos últimos posts do feed';
  switch (x.etapa) {
    case 'gancho':
      return acima
        ? `O gancho segurou mais gente: ${pct0(x.valor)} passaram dos 3 primeiros segundos, contra ${pct0(x.base)} na mediana ${dosUltimos}.`
        : `O gancho perdeu gente cedo: só ${pct0(x.valor)} passaram dos 3 primeiros segundos (a mediana é ${pct0(x.base)}).`;
    case 'retencao':
      return x.unidade === 'pct'
        ? `Quem ficou assistiu em média ${pct0(x.valor)} do vídeo (${segundos(p.metricas.avgWatchMs)} de ${segundos(p.metricas.duracaoS * 1000)}), ${acima ? 'acima' : 'abaixo'} da mediana (${pct0(x.base)}).`
        : `Quem ficou assistiu em média ${segundos(x.valor * 1000)}, ${acima ? 'acima' : 'abaixo'} da mediana (${segundos(x.base * 1000)}); sem a duração do vídeo, a comparação é em segundos.`;
    case 'distribuicao':
      return `${acima ? 'Chegou longe' : 'Ficou perto de casa'}: alcance de ${n0(x.alcance)} contas, ${vezes(x.valor)} o número de seguidores (a mediana${x.mesmaIdade ? ' na mesma idade' : ''} é ${vezes(x.base)}).`;
    case 'qualidade': {
      const partes = (x.partes ?? []).filter((y) => finito(y.porMil));
      const escolhidas = acima
        ? partes.filter((y) => finito(y.score) && y.score > 0 && y.porMil > 0).sort((a, b) => b.score - a.score)
        : partes.filter((y) => finito(y.score) && y.score < 0).sort((a, b) => a.score - b.score);
      const itens = (escolhidas.length ? escolhidas : partes).map((y) => {
        const a = ACOES.find((z) => z.k === y.metrica);
        return contagem(y.porMil, a.um, a.varios);
      });
      const lista = listaPt(itens) || `${num(x.valor, 1)} ações`;
      return `${acima ? 'Gerou mais ação por pessoa' : 'Gerou pouca ação por pessoa'}: ${lista} a cada mil alcançados (${vezesDeScore(x.score)} a mediana ${dosUltimos}).`;
    }
    case 'conversao': {
      const oque = p.formato === 'reel' ? contagem(x.bruto, 'seguidor novo', 'seguidores novos') : contagem(x.bruto, 'ação no perfil', 'ações no perfil (seguir, visitar ou clicar no link)');
      return `${acima ? 'Levou gente pro perfil' : 'Pouca gente foi pro perfil'}: ${oque} a cada mil alcançados (${vezesDeScore(x.score)} a mediana ${dosUltimos}).`;
    }
    default:
      return null;
  }
}

function porqueDe(p, ctx) {
  const bem = [];
  const mal = [];
  const o = fraseObjetivo(p, ctx.rotulosTipo);
  if (o) (o.lado === 'bem' ? bem : mal).push(o.texto);
  for (const x of p.funil) {
    const f = fraseEtapa(x, p);
    if (f) (x.nivel === 'acima' ? bem : mal).push(f);
  }
  return { bem, mal };
}

function avisosDe(p, ctx) {
  const a = [];
  const o = p.objetivo;
  const R = rotuloTipo(p.tipo, ctx.rotulosTipo);
  const def = OBJETIVOS[p.tipo];
  if (p.impulsionado === true) a.push('Teve anúncio: aparece aqui, mas fica fora das bases e dos efeitos.');
  else if (p.talvezImpulsionado) a.push('As views totais passam bem das orgânicas: pode ter tido anúncio. Marque em "Teve anúncio" se teve.');
  if (!finito(o.valor)) {
    // o número do app só vale como definitivo com 7 dias: antes disso, pedir agora faria o time digitar duas vezes
    if (p.tipo !== 'vendas') a.push('Sem dado da métrica do tipo nesta leitura.');
    else if (p.idadeH >= IDADE_REF_H) a.push('Sem dado: informe os números do app (seguidores, visitas ao perfil e cliques no link).');
    else a.push('Sem dado ainda: informe os números do app (seguidores, visitas ao perfil e cliques no link) quando a peça fizer 7 dias.');
  } else if (def?.parcial && o.campos.length < def.campos.length) {
    const faltam = def.campos.filter((c) => !o.campos.includes(c));
    a.push(`A soma leva só ${listaPt(o.campos.map((c) => NOME_CAMPO[c]))}: ${listaPt(faltam.map((c) => NOME_CAMPO[c]))} sem dado.`);
  }
  if (finito(o.valor) && o.base == null) {
    a.push(o.baseN > 0
      ? `Ainda sem base: tem ${plural(o.baseN, 'peça anterior', 'peças anteriores')} com o número e a base precisa de ${MIN_BASE}.`
      : `Ainda sem base: nenhuma peça anterior com o número; a base precisa de ${MIN_BASE}.`);
  } else if (o.baseDe === 'formato') a.push(`Ainda não há 3 peças ${p.tipo ? `de ${R}` : 'sem tipo'} do mesmo formato antes dela: a base usa as últimas ${n0(o.baseN)} do mesmo formato de mídia, de qualquer tipo.`);
  else if (o.baseDe === 'tipo-misto') a.push(`Ainda não há 3 ${p.formato === 'reel' ? 'reels' : 'posts do feed'} de ${R} antes dela: a base junta reels e posts de ${R}.`);
  if (o.provisorio) {
    // peça com 7 dias ou mais e número provisório: a leitura é que ficou velha (números do app de antes dos 7
    // dias, ou o Instagram sem sincronizar), não a peça
    if (p.idadeH < IDADE_REF_H) a.push('Peça com menos de 7 dias: o número ainda cresce e a comparação é provisória.');
    else if (o.fonte === 'manual') a.push(`Números do app informados com ${tempoNoAr(o.idadeValorH ?? 0)} de post: informe de novo pra fechar a meta (o número só vale como definitivo a partir dos 7 dias).`);
    else a.push(`O número é de uma leitura com ${tempoNoAr(o.idadeValorH ?? 0)} de post: sincronize pra fechar a meta.`);
  }
  if (!p.tipo) a.push('Peça sem tipo: a métrica é o alcance. Ligue o post a uma peça do cronograma ou marque o tipo.');
  if (p.funil.find((x) => x.etapa === 'retencao')?.unidade === 's') {
    a.push(finito(p.metricas.duracaoS)
      ? 'Poucos reels anteriores têm a duração medida (etiquete com IA): a retenção compara segundos assistidos.'
      : 'Sem a duração do vídeo: a retenção compara segundos assistidos.');
  }
  return a;
}

function faltando(p, dims) {
  return dims.filter((d) => d.aplica === 'peca' && aplicaNaPeca(d, p.peca) && !p.tags[d.id]).map((d) => d.id);
}

function linha(p, ctx) {
  const m = p.m;
  return {
    midiaId: p.id, permalink: String(m.permalink ?? ''), thumb: String(m.thumb ?? ''), legenda1: primeiraLinha(m.caption),
    timestamp: m.timestamp ?? null, dia: diaBrasilia(p.ms), hora: horaBrasilia(p.ms), idadeH: Math.round(p.idadeH * 10) / 10,
    tipoMidia: p.tipoMidia, peca: p.peca, formatoMidia: p.formato,
    reelId: p.reel?.id ?? null, reelTitulo: p.reel ? limpo(p.reel.ideia) || null : null,
    tipo: p.tipo, pilar: p.pilar, pilarNome: p.pilarNome, bloco: p.bloco,
    metricas: p.metricas, objetivo: p.objetivo, funil: p.funil, gargalo: p.gargalo, forte: p.forte, porque: p.porque,
    tags: Object.fromEntries(Object.entries(p.tags).map(([k, t]) => [k, { valor: t.valor, fonte: t.fonte ?? null }])),
    tagsFaltando: faltando(p, ctx.dims),
    impulsionado: p.impulsionado, talvezImpulsionado: p.talvezImpulsionado, outlier: p.outlier,
    iaStatus: p.registro?.ia?.status ?? null, avisos: p.avisos,
    // o valor de cada métrica de objetivo (base de outro tipo e a meta da próxima peça saem daqui)
    comparaveis: Object.fromEntries(Object.entries(p.comparaveis).map(([k, c]) => [k, { valor: c.valor, idadeRef: c.idadeRef, provisorio: c.provisorio }])),
  };
}

// dados = { midias, reels?, pilares, conta, historico, registros, tagsPorMidia, reelPorMidia, publico, anuncios,
//   duracoes, dimensoes, rotulosTipo, agora } → PostRow[] (SPEC §3.4), mais novo primeiro
export function montarPosts(dados = {}) {
  const ctx = {
    agoraMs: msDe(dados.agora) ?? Date.now(),
    pilares: Array.isArray(dados.pilares) ? dados.pilares : [],
    seguidores: seguidoresPorDia(dados.publico, dados.conta),
    rotulosTipo: dados.rotulosTipo ?? {},
    dims: listaDimensoes(dados.dimensoes),
  };
  const vistos = new Set();
  const todos = [];
  for (const m of Array.isArray(dados.midias) ? dados.midias : []) {
    const p = interno(m, dados, ctx);
    if (!p || vistos.has(p.id)) continue;
    vistos.add(p.id);
    todos.push(p);
  }
  todos.sort((a, b) => b.ms - a.ms);
  for (const p of todos) p.comparaveis = Object.fromEntries(OBJETIVOS_UNICOS.map((o) => [o.id, medir(p, o)]));
  const priores = prioresDaConta(todos);
  for (const p of todos) objetivoDe(p, todos);
  marcarOutliers(todos);
  for (const p of todos) funilDe(p, todos, priores);
  for (const p of todos) {
    p.porque = porqueDe(p, ctx);
    p.avisos = avisosDe(p, ctx);
  }
  return todos.map((p) => linha(p, ctx));
}

// ---------- efeitos e insights ----------

function efeitoDaEtapa(posts, etapa, tem, outro) {
  const item = (p) => p.funil?.find((f) => f.etapa === etapa);
  const ok = (p) => finito(item(p)?.score);
  const com = posts.filter((p) => tem(p) && ok(p));
  const sem = posts.filter((p) => outro(p) && ok(p));
  const r = efeitoTag(com.map((p) => item(p).score), sem.map((p) => item(p).score), { k: 3 });
  // o valor médio da etapa ("52% passaram do gancho") só com TODAS as peças dos dois lados na mesma unidade e com
  // valor: a retenção mistura % do vídeo e segundos, e a média de um subconjunto sairia com o N de todos. Sem
  // isso, o texto fica no "× a base"
  const itens = [...com, ...sem].map(item);
  const unidade = itens.length && itens.every((x) => x.unidade === itens[0].unidade && finito(x.valor)) ? itens[0].unidade : null;
  const valorMedio = (lista) => (unidade ? media(lista.map((p) => item(p).valor)) : null);
  return { ...r, com, unidade, mediaValorCom: valorMedio(com), mediaValorSem: valorMedio(sem) };
}

// o efeito que dá pra afirmar. Sem peça do outro lado (todas com o mesmo valor) não há comparação: o "efeito"
// contra 0 seria só a tendência da conta (C6). Com comparação, a evidência fica limitada pelo lado menor: 5 peças
// contra 1 não é "forte", porque a média do outro lado é uma peça só
function comparado(r) {
  if (!r?.n) return { efeito: null, bruto: null, consistencia: null, evidencia: 'insuficiente', semComparacao: false };
  if (!r.nSem) return { efeito: null, bruto: null, consistencia: null, evidencia: 'insuficiente', semComparacao: true };
  return {
    efeito: r.efeito, bruto: r.bruto, consistencia: r.consistencia, semComparacao: false,
    evidencia: rotuloEvidencia({ n: Math.min(r.n, r.nSem), efeito: r.efeito, consistencia: r.consistencia }),
  };
}

// por dimensão e valor: efeito no score do objetivo (posts sem anúncio, com base e já com 7 dias) e, quando a
// dimensão tem etapa, no score da etapa. Encolhido: n/(n+3) × (média com − média sem)
export function calcularEfeitos(posts, dimensoes) {
  const dims = listaDimensoes(dimensoes).filter((d) => d.id !== 'impulsionado');
  const elegiveis = (posts ?? []).filter((p) => p && p.impulsionado !== true && !p.objetivo?.provisorio);
  const scoreObj = (p) => (finito(p.objetivo?.score) ? p.objetivo.score : null);
  const efeitos = [];
  for (const d of dims) {
    const etapa = ETAPAS.includes(d.etapa) ? d.etapa : null;
    const valores = new Map();
    for (const p of elegiveis) {
      const t = p.tags?.[d.id];
      if (t?.valor != null && t.valor !== '' && !valores.has(chave(t.valor))) valores.set(chave(t.valor), t.valor);
    }
    for (const [k, valor] of valores) {
      const tem = (p) => chave(p.tags?.[d.id]?.valor) === k;
      const outro = (p) => {
        const v = p.tags?.[d.id]?.valor;
        return v != null && v !== '' && chave(v) !== k;
      };
      const com = elegiveis.filter((p) => tem(p) && scoreObj(p) != null);
      const sem = elegiveis.filter((p) => outro(p) && scoreObj(p) != null);
      const o = efeitoTag(com.map(scoreObj), sem.map(scoreObj), { k: 3 });
      const et = etapa ? efeitoDaEtapa(elegiveis, etapa, tem, outro) : null;
      const donos = elegiveis.filter((p) => tem(p) && (com.includes(p) || et?.com.includes(p)));
      if (!donos.length) continue;
      const co = comparado(o);
      const ce = et ? comparado(et) : null;
      efeitos.push({
        dimensao: d.id, nomeDimensao: limpo(d.nome ?? d.id), valor, nomeValor: nomeDoValor(d, valor),
        n: o.n, nSem: o.nSem, mediaCom: o.mediaCom, mediaSem: o.mediaSem, bruto: co.bruto, efeito: co.efeito,
        consistencia: co.consistencia, evidencia: co.evidencia, semComparacao: co.semComparacao,
        fatorCom: fatorDeScore(o.mediaCom), fatorSem: fatorDeScore(o.mediaSem),
        etapa, nEtapa: et?.n ?? 0, nSemEtapa: et?.nSem ?? 0, efeitoEtapa: ce?.efeito ?? null, brutoEtapa: ce?.bruto ?? null,
        consistenciaEtapa: ce?.consistencia ?? null, evidenciaEtapa: ce?.evidencia ?? null, semComparacaoEtapa: ce?.semComparacao ?? false,
        mediaEtapaCom: et?.mediaValorCom ?? null, mediaEtapaSem: et?.mediaValorSem ?? null, unidadeEtapa: et?.unidade ?? null,
        fatorEtapaCom: fatorDeScore(et?.mediaCom), fatorEtapaSem: fatorDeScore(et?.mediaSem),
        midias: donos.map((p) => p.midiaId), pecas: [...new Set(donos.map((p) => p.peca).filter(Boolean))],
        tipos: [...new Set(donos.map((p) => p.tipo).filter(Boolean))],
      });
    }
  }
  return efeitos;
}

// o valor da etapa dentro da frase ("52% passaram do gancho") e o curto do "contra"
function valorEtapaFrase(etapa, unidade, v) {
  if (!finito(v)) return null;
  switch (etapa) {
    case 'gancho': return `${pct0(v)} passaram do gancho`;
    case 'retencao': return unidade === 's' ? `assistiram em média ${segundos(v * 1000)}` : `assistiram em média ${pct0(v)} do vídeo`;
    case 'distribuicao': return `o alcance foi ${vezes(v)} os seguidores`;
    case 'qualidade': return `a ação por pessoa ficou em ${num(v, 1)} por mil alcançados`;
    case 'conversao': return `o interesse no perfil ficou em ${num(v, 1)} por mil alcançados`;
    default: return null;
  }
}
function valorEtapaCurto(etapa, unidade, v) {
  if (etapa === 'gancho' || (etapa === 'retencao' && unidade !== 's')) return pct0(v);
  if (etapa === 'retencao') return segundos(v * 1000);
  if (etapa === 'distribuicao') return vezes(v);
  return num(v, 1);
}

function textoInsight(tipo, e, f, x) {
  // os dois N: "6 reels contra 4" (a evidência vale pelo lado menor)
  const nt = x.nSem ? `${nPecas(x.n, e.pecas)} contra ${n0(x.nSem)}` : nPecas(x.n, e.pecas);
  const ev = `evidência ${x.evidencia}`;
  if (tipo === 'sinal') {
    return `Uma peça ${f.prep} ficou em ${vezes(x.fatorCom)} a base (1 peça, sem evidência ainda). Uma peça é sinal, não prova: vale testar de novo.`;
  }
  if (tipo === 'conflito') {
    const lado = (x) => (x > 0 ? 'acima' : 'abaixo');
    const contra = (com, sem) => `${vezes(com)} a base, contra ${vezes(sem)} ${f.sem ?? 'nas outras'}`;
    return `Sinal misturado: ${f.prep}, ${ALVO_ETAPA[e.etapa]} ficou ${lado(e.efeitoEtapa)} (${contra(e.fatorEtapaCom, e.fatorEtapaSem)}), mas a métrica do tipo ficou ${lado(e.efeito)} (${contra(e.fatorCom, e.fatorSem)}). São ${nt}, ${ev}: vale testar de novo antes de virar regra.`;
  }
  if (tipo === 'etapa') {
    const com = valorEtapaFrase(e.etapa, e.unidadeEtapa, e.mediaEtapaCom);
    if (!com) return `${alta(f.prep)}, ${ALVO_ETAPA[e.etapa]} ficou em ${vezes(x.fatorCom)} a base (${nt}, ${ev}).`;
    const sem = finito(e.mediaEtapaSem) ? `, contra ${valorEtapaCurto(e.etapa, e.unidadeEtapa, e.mediaEtapaSem)} ${f.sem ?? 'nas outras'}` : '';
    return `${alta(f.prep)}, ${com}${sem} (${nt}, ${ev}).`;
  }
  return `Peças ${f.prep} ficaram em ${vezes(x.fatorCom)} a base, contra ${vezes(x.fatorSem)} ${f.sem ? `das peças ${f.sem}` : 'das outras'} (${nt}, ${ev}).`;
}

// insights: usar/evitar (mecanismo da peça), planejar (pilar, bloco, tipo, formato), testar (sinal misturado
// ou uma peça só muito acima da base). Sem peça do outro lado não há comparação (o "efeito" seria a tendência
// da conta): fica só na tabela de efeitos. O sinal de uma peça só vale pra mecanismo que a IA etiqueta, um por
// post (o viral não vira três sinais)
export function gerarInsights(efeitos, posts, dimensoes) {
  const dims = new Map(listaDimensoes(dimensoes).map((d) => [d.id, d]));
  const saida = [];
  const sinais = [];
  const postsComSinal = new Set();
  for (const e of efeitos ?? []) {
    const d = dims.get(e.dimensao);
    if (!d || d.aplica === 'nunca') continue;
    if (ehBool(d) && chave(e.valor) !== 'true') continue;
    const rO = RANK[e.evidencia] ?? 0;
    const rE = e.etapa ? RANK[e.evidenciaEtapa] ?? 0 : 0;
    const okO = rO >= 1 && e.nSem >= 1;
    const okE = rE >= 1 && e.nSemEtapa >= 1;
    const conflito = okO && okE && Math.sign(e.efeito) !== Math.sign(e.efeitoEtapa);
    const daEtapa = !conflito && okE && (!okO || rE > rO);
    let tipo;
    let x;
    if (conflito) {
      if (d.aplica !== 'peca') continue;
      tipo = 'conflito';
      x = { acao: 'testar', evidencia: NOME_RANK[Math.min(rO, rE)], n: e.n, nSem: e.nSem, efeito: e.efeito, etapa: e.etapa, fatorCom: e.fatorCom, fatorSem: e.fatorSem };
    } else if (okO || okE) {
      tipo = daEtapa ? 'etapa' : 'objetivo';
      const efeito = daEtapa ? e.efeitoEtapa : e.efeito;
      x = {
        acao: d.aplica === 'planejamento' ? 'planejar' : efeito > 0 ? 'usar' : 'evitar',
        evidencia: daEtapa ? e.evidenciaEtapa : e.evidencia, n: daEtapa ? e.nEtapa : e.n, nSem: daEtapa ? e.nSemEtapa : e.nSem, efeito,
        etapa: daEtapa ? e.etapa : 'objetivo',
        fatorCom: daEtapa ? e.fatorEtapaCom : e.fatorCom, fatorSem: daEtapa ? e.fatorEtapaSem : e.fatorSem,
      };
    } else if (d.aplica === 'peca' && (d.fontes ?? []).includes('ia') && e.n === 1 && e.nSem >= 1 && finito(e.bruto) && e.bruto >= 1 && !postsComSinal.has(e.midias?.[0])) {
      postsComSinal.add(e.midias?.[0]);
      tipo = 'sinal';
      x = { acao: 'testar', evidencia: 'insuficiente', n: 1, nSem: e.nSem, efeito: e.bruto, etapa: 'objetivo', fatorCom: e.fatorCom, fatorSem: e.fatorSem };
    } else continue;
    const f = frase(d, e.valor, e.nomeValor);
    const standby = e.dimensao === 'pilar' && PILARES_STANDBY.includes(chave(e.valor));
    const texto = textoInsight(tipo, e, f, x) + (standby ? ' O pilar está em standby: fica fora do calendário.' : '');
    const insight = {
      id: `ins_${e.dimensao}_${chave(e.valor)}`, acao: x.acao, dimensao: e.dimensao, valor: e.valor, nomeValor: e.nomeValor,
      curto: f.curto, prep: f.prep, titulo: f.titulo, texto, evidencia: x.evidencia, n: x.n, nSem: x.nSem ?? null, fatorCom: x.fatorCom, fatorSem: x.fatorSem,
      aplica: d.aplica, pecas: (e.pecas ?? []).filter((pc) => aplicaNaPeca(d, pc)), tipos: e.tipos ?? [], midias: e.midias ?? [],
      etapa: x.etapa, efeito: x.efeito, standby,
    };
    (tipo === 'sinal' ? sinais : saida).push(insight);
  }
  sinais.sort((a, b) => b.efeito - a.efeito);
  return [...saida.sort(ordemInsight), ...sinais.slice(0, MAX_SINAIS)];
}

export function efeitosDoPost(post, efeitos) {
  return (efeitos ?? []).filter((e) => post?.tags?.[e.dimensao] && chave(post.tags[e.dimensao].valor) === chave(e.valor));
}

// ---------- meta e recomendações ----------

function montarMeta(obj, tipo, sel, rotulos) {
  const R = rotuloTipo(tipo, rotulos);
  const base = sel.base;
  const meta = metaDaBase(base);
  const de = tipo ? `de ${R}` : 'sem tipo';
  let texto;
  if (base == null) texto = `Meta desta peça (${R}): ${obj.curto}. Ainda sem base: faltam peças publicadas pra comparar.`;
  else if (sel.baseDe === 'formato') texto = `Meta desta peça (${R}): ${obj.curto}, 2× a mediana das últimas ${n0(sel.baseN)} peças do mesmo formato, porque ainda não há 3 ${de} (mediana ${qtd(base)}, meta ${qtd(meta)}).`;
  else if (sel.baseDe === 'tipo-misto') texto = `Meta desta peça (${R}): ${obj.curto}, 2× a mediana das últimas ${n0(sel.baseN)} ${de}, juntando reels e posts porque ainda há poucas do mesmo formato (mediana ${qtd(base)}, meta ${qtd(meta)}).`;
  else texto = `Meta desta peça (${R}): ${obj.curto}, 2× a mediana das últimas ${n0(sel.baseN)} ${de} (mediana ${qtd(base)}, meta ${qtd(meta)}).`;
  return { objetivo: { id: obj.id, rotulo: obj.rotulo }, base, baseN: sel.baseN, baseDe: sel.baseDe, meta, texto };
}

// a meta da próxima peça do tipo, com as peças publicadas até agora (formato = 'reel' | 'feed' | null)
export function metaPara(tipo, formato, posts, contexto = {}) {
  const t = doTipo(tipo);
  const obj = objetivoDoTipo(t);
  const agoraMs = msDe(contexto.agora) ?? Date.now();
  const sel = selecionarBase(posts ?? [], obj.id, { antesDe: agoraMs + 1, tipo: t, formato });
  return montarMeta(obj, t, sel, contexto.rotulosTipo);
}

// um cartão por tipo E formato de mídia (reel; feed e carrossel juntos) em que o tipo tem peça, e um só (formato
// null) pro tipo sem nenhuma (C1). base e meta são as da PRÓXIMA peça daquele tipo e formato (as mesmas do bloco
// da peça e das IAs); ultima é a peça mais nova do cartão com a base e a meta DELA (a régua em que foi medida), pra
// o medidor da última não usar a meta da próxima
export function metasPorTipo(posts, contexto = {}) {
  const lista = [...(posts ?? [])].sort((a, b) => msDo(b) - msDo(a));
  const cartoes = [];
  for (const tipo of TIPOS) {
    const doTipo = lista.filter((p) => p.tipo === tipo);
    const formatos = ['reel', 'feed'].filter((f) => doTipo.some((p) => formatoDe(p) === f));
    for (const formato of formatos.length ? formatos : [null]) {
      const m = metaPara(tipo, formato, lista, contexto);
      const u = formato ? doTipo.find((p) => formatoDe(p) === formato) : null;
      const o = u?.objetivo ?? {};
      cartoes.push({
        tipo, rotuloTipo: rotuloTipo(tipo, contexto.rotulosTipo), formato, rotuloFormato: formato ? ROTULO_FORMATO[formato] : null,
        objetivo: m.objetivo, base: m.base, baseN: m.baseN, baseDe: m.baseDe, meta: m.meta,
        ultima: u
          ? {
            midiaId: u.midiaId, valor: o.valor ?? null, score: o.score ?? null, bateuMeta: o.bateuMeta ?? null, provisorio: Boolean(o.provisorio),
            base: o.base ?? null, meta: o.meta ?? null, impulsionado: u.impulsionado ?? null,
          }
          : null,
      });
    }
  }
  return cartoes;
}

// as regras de peça: CTA da escada do tipo, preço só em Vendas, gatilho só os do guia do tipo, família de gancho
// só as do tipo, nada de pilar em standby, dia da semana, Fator R ou gancho fora do banco
function permitido(i, d, { tipo, peca, ctaPorTipo, familias }) {
  if (!d || d.aplica !== 'peca' || FORA_DA_PECA.includes(i.dimensao)) return false;
  if (!Array.isArray(i.pecas) || !i.pecas.includes(peca)) return false;
  const v = chave(i.valor);
  if (i.dimensao === 'pilar' && PILARES_STANDBY.includes(v)) return false;
  if (i.dimensao === 'ganchoFamilia') {
    if (FAMILIAS_FORA.includes(v)) return false;
    if (i.acao === 'usar' && Array.isArray(familias) && familias.length && !familias.includes(v)) return false;
  }
  if (i.dimensao === 'cta') {
    if (!tipo) return false;
    const escada = Array.isArray(ctaPorTipo?.[tipo]) ? ctaPorTipo[tipo] : [];
    if (!escada.includes(v) && v !== 'fora-do-escopo') return false;
  }
  if (i.dimensao === 'preco' && tipo !== 'vendas') return false;
  // gatilho: só os do guia de estilo do tipo da peça (o codebook diz o tipo de cada um; sem tipo, nenhum). Os de
  // preço e de oferta (transparência de preço, escassez real) são preço: só em Vendas, mesmo se o guia mudar
  if (i.dimensao === 'gatilho') {
    const def = (d.valores ?? []).find((x) => chave(x?.id) === v);
    if (!tipo || !def || def.tipo !== tipo) return false;
    if (GATILHOS_PRECO.includes(v) && tipo !== 'vendas') return false;
  }
  return true;
}
// humor (a dimensão ou o gatilho de humor sobre a burocracia) só vai com o aviso dos temas que não aceitam humor
const comHumor = (i) => i.acao === 'usar' && ((i.dimensao === 'humor' && chave(i.valor) === 'true') || (i.dimensao === 'gatilho' && GATILHOS_HUMOR.includes(chave(i.valor))));
// o complemento da frase ("com gancho de pergunta", "sem rosto"), do insight ou montado pelo codebook
const prepDe = (i, dims) => i.prep ?? frase(dims.get(i.dimensao) ?? { id: i.dimensao }, i.valor, i.nomeValor ?? null).prep;

function testarPara({ tipo, peca, posts, dims, familias, aplicadoDe, rotulos }) {
  const d = [dims.get('ganchoFamilia'), dims.get('ganchoForma')].find((x) => x && x.aplica === 'peca' && aplicaNaPeca(x, peca));
  if (!d) return null;
  let valores = (d.valores ?? []).map((v) => chave(v?.id)).filter((v) => v && !FAMILIAS_FORA.includes(v));
  if (d.id === 'ganchoFamilia' && Array.isArray(familias) && familias.length) valores = valores.filter((v) => familias.includes(v));
  if (!valores.length) return null;
  const uso = (v) => posts.filter((p) => chave(p.tags?.[d.id]?.valor) === v).length;
  const [x] = valores.map((v, i) => ({ v, n: uso(v), i })).sort((a, b) => a.n - b.n || a.i - b.i);
  const f = frase(d, x.v);
  const id = `ins_${d.id}_${x.v}`;
  const qual = d.id === 'ganchoFamilia' ? 'família de gancho' : 'forma de gancho';
  const entre = tipo ? `as do tipo ${rotuloTipo(tipo, rotulos)}` : 'as do banco';
  return {
    insightId: id, acao: 'usar', dimensao: d.id, valor: x.v, nomeValor: nomeDoValor(d, x.v), curto: f.curto, prep: f.prep, titulo: f.titulo,
    texto: `${alta(f.curto)}: é a ${qual} menos usada entre ${entre} (${x.n ? `${plural(x.n, 'peça', 'peças')} até agora` : 'nenhuma peça até agora'}). Uma peça é sinal, não prova.`,
    etapa: ETAPAS.includes(d.etapa) ? d.etapa : 'objetivo', aplicado: aplicadoDe(id),
  };
}

// contexto = { posts, insights, hipoteses, dimensoes, ctaPorTipo, familiasPorTipo, rotulosTipo, agora }
export function recomendacoesPara(reel, contexto = {}) {
  const posts = Array.isArray(contexto.posts) ? contexto.posts : [];
  const dims = new Map(listaDimensoes(contexto.dimensoes).map((d) => [d.id, d]));
  const tipo = doTipo(reel?.tipo);
  const peca = PECAS.includes(reel?.peca) ? reel.peca : 'reel';
  const aplicados = (contexto.hipoteses ?? []).filter((h) => h && h.reelId === reel?.id);
  const aplicadoDe = (id) => aplicados.find((h) => h.insightId === id)?.id ?? null;
  const resultado = reel?.id ? posts.find((p) => p.reelId === reel.id) ?? null : null;
  const saida = { reelId: reel?.id ?? null, tipo, peca, meta: null, itens: [], testar: null, aplicados, resultado, semDados: null };
  if (peca === 'stories') return { ...saida, semDados: 'Stories têm a régua própria, na tabela de Stories.' };
  const obj = objetivoDoTipo(tipo);
  const meta = resultado?.objetivo
    ? montarMeta(obj, tipo, { base: resultado.objetivo.base, baseN: resultado.objetivo.baseN, baseDe: resultado.objetivo.baseDe }, contexto.rotulosTipo)
    : metaPara(tipo, formatoDaPeca(peca), posts, contexto);
  const regras = { tipo, peca, ctaPorTipo: contexto.ctaPorTipo, familias: contexto.familiasPorTipo?.[tipo] };
  const candidatos = (contexto.insights ?? [])
    .filter((i) => i && (i.acao === 'usar' || i.acao === 'evitar') && (RANK[i.evidencia] ?? 0) >= 1 && permitido(i, dims.get(i.dimensao), regras))
    .sort(ordemInsight);
  const itens = [];
  const usadas = new Set();
  for (const i of candidatos) {
    if (itens.length === MAX_ITENS) break;
    if (usadas.has(i.dimensao)) continue;
    usadas.add(i.dimensao);
    itens.push({
      insightId: i.id, acao: i.acao, dimensao: i.dimensao, valor: i.valor, nomeValor: i.nomeValor, curto: i.curto, prep: prepDe(i, dims), titulo: i.titulo,
      texto: i.texto, evidencia: i.evidencia, n: i.n, etapa: i.etapa ?? 'objetivo', aviso: comHumor(i) ? AVISO_HUMOR : null, aplicado: aplicadoDe(i.id),
    });
  }
  const testar = itens.length ? null : testarPara({ tipo, peca, posts, dims, familias: regras.familias, aplicadoDe, rotulos: contexto.rotulosTipo });
  const semDados = !posts.length
    ? 'Ainda não há posts lidos do Instagram pra comparar.'
    : meta.base == null && !itens.length ? 'Ainda sem base: faltam peças publicadas pra montar a meta desta peça.' : null;
  return { ...saida, meta, itens, testar, semDados };
}

// ---------- bloco das IAs de criação (SPEC §3.5) ----------

// pedido = { tipo, pecas, pilar, reelId? }; contexto = o mesmo das recomendações. Até ~1.200 caracteres, ou ''
// quando não há nada com evidência, nem base de meta, nem hipótese aberta na peça
export function blocoParaIa(pedido = {}, contexto = {}) {
  const tipo = doTipo(pedido?.tipo);
  const pedidas = Array.isArray(pedido?.pecas) && pedido.pecas.length ? pedido.pecas : ['reel'];
  const pecas = pedidas.filter((x) => PECAS.includes(x) && x !== 'stories');
  if (!pecas.length) return '';
  const posts = Array.isArray(contexto.posts) ? contexto.posts : [];
  const dims = new Map(listaDimensoes(contexto.dimensoes).map((d) => [d.id, d]));
  const agoraMs = msDe(contexto.agora) ?? Date.now();
  const meta = metaPara(tipo, formatoDaPeca(pecas[0]), posts, contexto);
  const regrasDe = (pc) => ({ tipo, peca: pc, ctaPorTipo: contexto.ctaPorTipo, familias: contexto.familiasPorTipo?.[tipo] });
  const servem = (contexto.insights ?? [])
    .filter((i) => i && (RANK[i.evidencia] ?? 0) >= 1 && !FORA_DA_IA.includes(i.dimensao) && pecas.some((pc) => permitido(i, dims.get(i.dimensao), regrasDe(pc))))
    .sort(ordemInsight);
  const umPorDimensao = (acao) => {
    const vistos = new Set();
    const out = [];
    for (const i of servem) {
      if (i.acao !== acao || vistos.has(i.dimensao)) continue;
      vistos.add(i.dimensao);
      out.push(i);
    }
    return out.slice(0, MAX_POR_LISTA);
  };
  const usar = umPorDimensao('usar');
  const evitar = umPorDimensao('evitar');
  const emTeste = pedido?.reelId ? (contexto.hipoteses ?? []).filter((h) => h && h.reelId === pedido.reelId && h.status === 'aberta') : [];
  const pilarIns = pedido?.pilar != null && pedido.pilar !== ''
    ? (contexto.insights ?? []).find((i) => i?.dimensao === 'pilar' && chave(i.valor) === chave(pedido.pilar) && (RANK[i.evidencia] ?? 0) >= 1 && !i.standby)
    : null;
  if (meta.base == null && !usar.length && !evitar.length && !emTeste.length) return '';

  const soSe = AVISO_HUMOR.replace(/^Humor /, '').replace(/\.$/, '');
  const nome = (i) => `${i.curto} (${nPecas(i.n, i.pecas)}, evidência ${i.evidencia}${comHumor(i) ? `; ${soSe}` : ''})`;
  const hipotese = (h) => {
    const f = frase(dims.get(h.dimensao) ?? { id: h.dimensao }, h.valor);
    // "evitar fazer a peça sem CTA", nunca "evitar sem CTA"
    return h.acao === 'evitar' ? `evitar fazer a peça ${f.prep}` : f.curto;
  };
  const montar = (u, ev, comPilar) => [
    `## O que os números da nossa conta mostram (Métricas, ${dataCurta(diaBrasilia(agoraMs))})`,
    'Use como orientação de MECANISMO (gancho, duração, CTA, formato), nunca como fato de copy: nenhum número daqui entra na peça. O pilar, a base contábil e as regras duras mandam sobre isto.',
    meta.base != null ? `- ${meta.texto}` : '',
    u.length ? `- Fazer mais: ${u.map(nome).join('; ')}.` : '',
    ev.length ? `- Evitar: ${ev.map(nome).join('; ')}.` : '',
    comPilar && pilarIns ? `- Pilar desta peça: ${pilarIns.texto}` : '',
    emTeste.length ? `- Em teste nesta peça: ${emTeste.map(hipotese).join('; ')}.` : '',
  ].filter(Boolean).map(limpo).join('\n');
  // passou do tamanho: sai o pilar, depois o último item de Evitar, depois o de Fazer mais (o primeiro fica)
  let u = usar;
  let ev = evitar;
  let comPilar = Boolean(pilarIns);
  let texto = montar(u, ev, comPilar);
  while (texto.length > MAX_BLOCO) {
    if (comPilar) comPilar = false;
    else if (ev.length) ev = ev.slice(0, -1);
    else if (u.length > 1) u = u.slice(0, -1);
    else break;
    texto = montar(u, ev, comPilar);
  }
  return texto;
}

// ---------- hipóteses ----------

// veredito quando a mídia vinculada tem 7 dias: null = ainda aberta (sem mídia, sem 7 dias, sem a tag da
// dimensão, ou sem número pra comparar antes do prazo). "Não aplicada" já sai com os 7 dias (só depende da tag).
// Sem o número, sem base ou com número provisório, espera até 30 dias (informar os números do app depois ainda
// conta) e só então fecha como inconclusiva, dizendo o que faltou. contexto = { posts, dimensoes, rotulosTipo, agora }
export function avaliarHipotese(h, contexto = {}) {
  if (!h || (h.status && h.status !== 'aberta')) return null;
  const posts = Array.isArray(contexto.posts) ? contexto.posts : [];
  const p = (h.midiaId && posts.find((x) => x.midiaId === h.midiaId)) || (h.reelId && posts.find((x) => x.reelId === h.reelId)) || null;
  if (!p || !(p.idadeH >= IDADE_REF_H)) return null;
  const tag = p.tags?.[h.dimensao];
  if (!tag || tag.valor == null || tag.valor === '') return null;
  const dims = new Map(listaDimensoes(contexto.dimensoes).map((d) => [d.id, d]));
  const d = dims.get(h.dimensao) ?? { id: h.dimensao };
  const em = new Date(msDe(contexto.agora) ?? Date.now()).toISOString();
  const etapa = ETAPAS.includes(h.previsao?.etapa) ? h.previsao.etapa : null;
  const provisorio = Boolean(p.objetivo?.provisorio);
  const prazo = p.idadeH >= PRAZO_HIPOTESE_H;
  const score = finito(p.objetivo?.score) && !provisorio ? p.objetivo.score : null;
  const scoreEtapa = etapa ? p.funil?.find((x) => x.etapa === etapa)?.score ?? null : null;
  const veredito = (status, texto) => ({ status, midiaId: p.midiaId, veredito: { em, score, scoreEtapa: finito(scoreEtapa) ? scoreEtapa : null, texto } });
  // "prep" já traz o "com" ou o "sem": "saiu sem rosto em vez de com rosto nos 3 primeiros segundos"
  const alvo = frase(d, h.valor);
  const fim = ' Uma peça é sinal, não prova.';
  const bate = chave(tag.valor) === chave(h.valor);
  const aplicou = h.acao === 'evitar' ? !bate : bate;
  if (!aplicou) {
    const saiu = frase(d, tag.valor);
    return veredito('nao-aplicada', h.acao === 'evitar'
      ? `Não aplicada: a peça saiu ${alvo.prep} mesmo assim.${fim}`
      : `Não aplicada: a peça saiu ${saiu.prep} em vez de ${alvo.prep}.${fim}`);
  }
  const fez = h.acao === 'evitar' ? `evitou fazer a peça ${alvo.prep}` : `fez a peça ${alvo.prep}`;
  // número provisório com 7 dias (números do app de antes dos 7 dias, ou leitura velha): espera o prazo
  if (provisorio) {
    if (!prazo) return null;
    const porque = p.objetivo?.fonte === 'manual' ? 'os números do app foram informados antes dos 7 dias' : 'não teve leitura depois dos 7 dias';
    return veredito('inconclusiva', `Inconclusiva: ${fez}, mas o número da peça ficou provisório (${porque}).${fim}`);
  }
  // na etapa prevista, quando ela tem score; senão no objetivo
  const usarEtapa = finito(scoreEtapa);
  const s = usarEtapa ? scoreEtapa : score;
  const oque = usarEtapa ? ALVO_ETAPA[etapa] : `a métrica do tipo (${objetivoDoTipo(p.tipo).curto})`;
  if (!finito(s)) {
    if (!prazo) return null;
    const semValor = !finito(p.objetivo?.valor);
    const falta = p.tipo === 'vendas' && p.tipoMidia === 'REELS' ? 'os números do app não foram informados' : 'a Meta não mandou a métrica do tipo';
    return veredito('inconclusiva', semValor
      ? `Inconclusiva: ${fez}, mas faltou o número da peça pra comparar (${falta}).${fim}`
      : `Inconclusiva: ${fez}, mas não havia base pra comparar (menos de ${MIN_BASE} peças anteriores com o número).${fim}`);
  }
  if (s >= LIMIAR_ACIMA - EPS) return veredito('confirmada', `Confirmada nesta peça: ${fez}, e ${oque} ficou em ${vezesDeScore(s)} a base.${fim}`);
  if (s <= LIMIAR_ABAIXO + EPS) return veredito('refutada', `Não se confirmou nesta peça: ${fez}, e ${oque} ficou em ${vezesDeScore(s)} a base.${fim}`);
  return veredito('inconclusiva', `Inconclusiva: ${fez}, e ${oque} ficou em ${vezesNormal(s)} a base, perto do normal.${fim}`);
}

// ---------- números da aba e pendências ----------

const DIAS_30_MS = 30 * 24 * HORA_MS;

// a frase das provisórias (C5): as novas e as de número antigo (7 dias ou mais, leitura de antes dos 7)
function fraseProvisorias(provisorias) {
  if (!provisorias.length) return null;
  const novas = provisorias.filter((p) => !(p.idadeH >= IDADE_REF_H)).length;
  const velhas = provisorias.length - novas;
  const partes = [];
  if (novas) partes.push(`${novas === 1 ? '1 peça ainda tem' : `${n0(novas)} peças ainda têm`} menos de 7 dias`);
  if (velhas) partes.push(`${velhas === 1 ? '1 peça tem' : `${n0(velhas)} peças têm`} número de antes dos 7 dias (informe ou sincronize de novo)`);
  return `${alta(listaPt(partes))}: ${provisorias.length === 1 ? 'fica' : 'ficam'} fora da taxa de acerto e da mediana até o número fechar.`;
}

// peças dos últimos 30 dias sem anúncio. Provisória fica fora da taxa de acerto e da mediana (o número ainda
// cresce, e "já bateu" de 2 dias não é acerto fechado) e é contada à parte, com a frase (C5)
export function numerosDaConta(posts, contexto = {}) {
  const lista = Array.isArray(posts) ? posts : [];
  const agoraMs = msDe(contexto.agora) ?? Date.now();
  const d30 = lista.filter((p) => p.impulsionado !== true && agoraMs - (msDo(p) ?? 0) <= DIAS_30_MS);
  const provisorias = d30.filter((p) => p.objetivo?.provisorio);
  const fechadas = d30.filter((p) => !p.objetivo?.provisorio);
  const avaliadas = fechadas.filter((p) => typeof p.objetivo?.bateuMeta === 'boolean');
  const bateram = avaliadas.filter((p) => p.objetivo.bateuMeta).length;
  return {
    posts: lista.length,
    comBase: lista.filter((p) => p.objetivo?.base != null).length,
    bateramMeta30d: bateram,
    avaliadas30d: avaliadas.length,
    // percentual de 0 a 100 (o pct de metricas-comum.js)
    taxaAcerto30d: avaliadas.length ? (bateram / avaliadas.length) * 100 : null,
    medianaScore30d: mediana(fechadas.filter((p) => finito(p.objetivo?.score)).map((p) => p.objetivo.score)),
    provisorias30d: provisorias.length,
    fraseProvisorias: fraseProvisorias(provisorias),
    semTipo: lista.filter((p) => !p.tipo).length,
    semTags: lista.filter((p) => p.iaStatus !== 'ok' && (p.tagsFaltando ?? []).length > 0).length,
    semVinculo: lista.filter((p) => !p.reelId).length,
  };
}

// opcoes = { conectado, anunciosConectados (true, false ou null quando não se sabe), nSugestoes }
export function pendenciasDe(posts, { conectado = true, anunciosConectados = null, nSugestoes = 0 } = {}) {
  const lista = Array.isArray(posts) ? posts : [];
  const out = [];
  if (!conectado) out.push({ id: 'conectar', texto: 'Conecte o Instagram pra ler os números dos posts.', n: 0, acao: 'Conectar' });
  const semVinculo = lista.filter((p) => !p.reelId).length;
  if (semVinculo) {
    const sug = nSugestoes ? ` ${nSugestoes === 1 ? 'Tem 1 sugestão pronta' : `Tem ${n0(nSugestoes)} sugestões prontas`} pra confirmar.` : '';
    out.push({ id: 'vincular', texto: `${semVinculo === 1 ? '1 post sem peça' : `${n0(semVinculo)} posts sem peça`} do cronograma ligada: sem a peça, o post fica sem tipo e sem pilar.${sug}`, n: semVinculo, acao: 'Vincular' });
  }
  const semIa = lista.filter((p) => p.iaStatus !== 'ok' && (p.tagsFaltando ?? []).length > 0).length;
  if (semIa) out.push({ id: 'etiquetar', texto: `${semIa === 1 ? '1 post ainda sem etiqueta' : `${n0(semIa)} posts ainda sem etiqueta`} de mecanismo (gancho, CTA, gatilho, voz).`, n: semIa, acao: 'Etiquetar com IA' });
  // números do app dos reels de Vendas: pedidos com 7 dias (antes disso o número ainda cresce e seria digitado duas
  // vezes) e pedidos de novo quando foram informados antes dos 7 dias (senão a peça fica provisória pra sempre)
  const vendas = lista.filter((p) => p.tipo === 'vendas' && p.tipoMidia === 'REELS' && p.idadeH >= IDADE_REF_H);
  const semNumeros = vendas.filter((p) => !finito(p.objetivo?.valor));
  const cedo = vendas.filter((p) => finito(p.objetivo?.valor) && p.objetivo.fonte === 'manual' && p.objetivo.provisorio);
  if (semNumeros.length || cedo.length) {
    const partes = [];
    if (semNumeros.length) partes.push(`${semNumeros.length === 1 ? '1 reel de Vendas com 7 dias ou mais sem' : `${n0(semNumeros.length)} reels de Vendas com 7 dias ou mais sem`} os números do app (seguidores, visitas ao perfil e cliques no link): sem eles, não tem meta.`);
    if (cedo.length) partes.push(`${cedo.length === 1 ? '1 reel de Vendas tem' : `${n0(cedo.length)} reels de Vendas têm`} os números do app informados antes dos 7 dias: atualize os números do app pra fechar a meta.`);
    out.push({ id: 'numeros-app', texto: partes.join(' '), n: semNumeros.length + cedo.length, acao: 'Informar números', midiaIds: [...semNumeros, ...cedo].map((p) => p.midiaId) });
  }
  if (anunciosConectados === false) out.push({ id: 'anuncios', texto: 'Conecte a conta de anúncios pra separar o pago e ler idade e gênero dos posts impulsionados.', n: 0, acao: 'Conectar anúncios' });
  return out;
}

// ---------- anúncio e público do post ----------

// o que a leitura de anúncios (anuncios.json) garante sobre um post: true com o post em porPost ou na lista de
// anúncios (mesmo quando os números do anúncio falharam); false só com uma leitura boa que cobre o post (conta
// escolhida, sem erro, token de usuário valendo, lida depois da publicação e há menos de 24 horas); senão
// undefined, "não se sabe" (leitura velha ou token revogado não viram "sem anúncio", e o post que passou das
// views orgânicas ganha o aviso "pode ter tido anúncio"). opcoes = { agora, tokenUsuario: true|false|null }
export function anuncioDoPost(midiaId, timestamp, anuncios, { agora = null, tokenUsuario = null } = {}) {
  const id = String(midiaId ?? '');
  if (!anuncios || typeof anuncios !== 'object' || !id) return undefined;
  if (anuncios.porPost && typeof anuncios.porPost === 'object' && anuncios.porPost[id]) return true;
  if ((Array.isArray(anuncios.anuncios) ? anuncios.anuncios : []).some((x) => String(x?.midiaId ?? '') === id)) return true;
  const lido = msDe(anuncios.lidoEm);
  const publicado = msDe(timestamp);
  const agoraMs = msDe(agora) ?? Date.now();
  const boa = Boolean(anuncios.conta?.id) && !anuncios.erro && tokenUsuario === true && lido != null && publicado != null
    && lido > publicado && agoraMs - lido < LEITURA_ANUNCIOS_MS;
  return boa ? false : undefined;
}

// pessoas na base do público do post lido do app (C3; a mesma regra do pessoasNaBase de publico-motor.mjs): o
// número de contas que a tela mostra, quando foi informado; sem ele, as contas alcançadas (base visualizações ou
// contas alcançadas) ou, pra contas com engajamento, o maior entre curtidas e salvamentos do post (comentário e
// compartilhamento podem repetir a mesma conta). Views nunca: contam reprodução, não pessoa. Sem número: n null,
// e nenhum grupo vira frase. metricas = PostRow.metricas → { n, nDe: 'informado'|'interacoes'|'alcance'|null }
// (nDe como na aba Público)
export function pessoasNaBaseApp(app, metricas) {
  const contas = app?.contas;
  if (finito(contas) && contas >= 0) return { n: contas, nDe: 'informado' };
  if (app?.base === 'contas-engajadas') {
    const xs = ['likes', 'saved'].map((k) => metricas?.[k]).filter(finito);
    return xs.length ? { n: Math.max(...xs), nDe: 'interacoes' } : { n: null, nDe: null };
  }
  return finito(metricas?.reach) ? { n: metricas.reach, nDe: 'alcance' } : { n: null, nDe: null };
}

// os grupos do público do post que podem aparecer (C3): só os com 5 pessoas ou mais (pct/100 × n); sem n, nenhum.
// É a reserva do visiveisPostApp de publico-motor.mjs, com a mesma regra e a mesma forma
export function visiveisDoApp(app, n) {
  const d = app && typeof app === 'object' ? app : {};
  const pode = (p) => finito(p) && finito(n) && (p / 100) * n >= MINIMO_CELULA;
  const lugares = (xs) => (Array.isArray(xs) ? xs : [])
    .filter((x) => x && typeof x.nome === 'string' && x.nome.trim() && pode(x.pct))
    .map((x) => ({ nome: limpo(x.nome), pct: x.pct }));
  return {
    genero: [['F', 'mulheres', 'Mulheres'], ['M', 'homens', 'Homens']].filter(([, k]) => pode(d.genero?.[k])).map(([id, k, rotulo]) => ({ id, rotulo, pct: d.genero[k] })),
    idade: FAIXAS_APP.filter((f) => pode(d.idade?.[f])).map((f) => ({ faixa: f, pct: d.idade[f] })),
    cidades: lugares(d.cidades),
    paises: lugares(d.paises),
    seguidores: pode(d.seguidores) || pode(d.naoSeguidores)
      ? { seguidores: pode(d.seguidores) ? d.seguidores : null, naoSeguidores: pode(d.naoSeguidores) ? d.naoSeguidores : null }
      : null,
  };
}

// peças do cronograma de 7 dias antes a 7 dias depois do post (o seletor de vínculo)
export function opcoesDeVinculo(reels, dia) {
  return (Array.isArray(reels) ? reels : [])
    .filter((r) => r?.id && /^\d{4}-\d{2}-\d{2}$/.test(String(r.data ?? '')) && dia && Math.abs(diasEntre(dia, r.data) ?? 99) <= 7)
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((r) => ({ id: r.id, titulo: limpo(r.ideia) || 'Sem título', dia: r.data, peca: PECAS.includes(r.peca) ? r.peca : 'reel' }));
}
