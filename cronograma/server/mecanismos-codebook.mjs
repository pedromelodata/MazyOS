// Codebook dos mecanismos (Métricas: Diagnóstico, 30/09/2026; SPEC-METRICAS.md §3.3). A parte pura do
// mecanismos.mjs: o que é cada dimensão e que valores aceita, como juntar as fontes de uma tag, como sugerir
// o vínculo entre post e peça do cronograma e como conferir a resposta da IA. Nada de disco, rede ou relógio
// escondido (quem precisa de "agora" recebe por parâmetro): os testes rodam sem banco. Decisões:
//  - dimensões e valores são os da tabela da SPEC §3.3; pilar e formato vêm do banco (codebook(db))
//  - a fonte de uma tag segue a ordem de `fontes` da dimensão. Em geral dá manual > cronograma > ia >
//    calculado; a CTA é a exceção da tabela (manual > ia > cronograma): a IA lê a CTA que foi ao ar, com
//    trecho literal, e a do cronograma é a planejada, classificada por palavra
//  - sim ou não é booleano (true/false); o resto é id de texto
//  - tag manual por cima da da IA guarda a da IA em `ia`: apagar a manual devolve a da IA
//  - "impulsionado" manual mora em registro.impulsionado (um lugar só, o do definirImpulsionado)
//  - áudio calculado: MUSIC vira musica; áudio original com fala na transcrição vira fala, sem fala vira
//    som-sem-fala (tem som, só não tem fala: música ou efeito); vídeo sem trilha de áudio vira sem-audio; sem
//    transcrição conferida (whisper ausente ou falhou) fica sem valor
//  - carrossel com mais de 10 slides fica sem faixa (a tabela para em 7 a 10)
//  - vínculo sugerido: peça do mesmo tipo com data até 3 dias da publicação (Brasília), nota pela distância
//    e pelas palavras em comum; nunca a peça já ligada a outro post do mesmo tipo, nunca o post cujo vínculo
//    alguém soltou de propósito, e cada peça sai sugerida pra um post só (o par de maior nota ganha)
//  - o que vem de db.mjs e reelmd.mjs (blocos, tipos, link do post, gancho e CTA da peça) está copiado
//    aqui: db.mjs lê o .env ao ser importado e reelmd.mjs mexe em arquivo, e módulo puro não importa eles
import { diaBrasilia, horaBrasilia, diaSemanaBrasilia, diasEntre, msDe, finito, slug } from './estatistica.mjs';

// ---------- cópias de db.mjs e reelmd.mjs ----------

const TIPOS_REEL = ['viralizacao', 'vendas', 'conexao', 'ensino', 'conselho'];
const ROTULO_TIPO = { viralizacao: 'Viralização', vendas: 'Vendas', conexao: 'Conexão', ensino: 'Ensino', conselho: 'Conselho' };
const BLOCOS = ['Educação', 'Afeto', 'Diferencial', 'Conversão'];
const BLOCO_DO_PILAR = {
  1: 'Afeto', 2: 'Afeto', 3: 'Afeto',
  4: 'Educação', 5: 'Educação', 6: 'Educação', 7: 'Educação', 16: 'Educação',
  8: 'Diferencial', 9: 'Diferencial', 17: 'Diferencial',
  10: 'Conversão', 11: 'Conversão', 12: 'Conversão', 13: 'Conversão',
};
const ROTULO_PECA = { reel: 'Reel', carrossel: 'Carrossel', estatico: 'Estático', stories: 'Stories' };
// travessão e meia-risca montados por código, como em db.mjs
const TRACOS = new RegExp(`\\s*[${String.fromCharCode(0x2014, 0x2013)}]\\s*`, 'g');

const chaveBloco = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
function blocoCanonico(v) {
  const k = chaveBloco(v).split(/[\s/,]/)[0];
  return BLOCOS.find((b) => chaveBloco(b) === k) ?? null;
}

// o mesmo post aparece como /reel/X, /reels/X, /p/X ou /usuario/reel/X (a regra do mesmoPost do db.mjs)
function codigoPost(url) {
  const m = String(url ?? '').match(/instagram\.com\/(?:[^/?#]+\/)?(?:reels?|p|tv)\/([^/?#]+)/i);
  return m ? m[1] : String(url ?? '').split(/[?#]/)[0].replace(/\/+$/, '');
}

const temTexto = (s) => typeof s === 'string' && s.trim() !== '';
// tipos da peça na ordem (principal primeiro); item antigo sem peca é reel
const tiposDaPeca = (r) => [...new Set([ROTULO_PECA[r?.peca] ? r.peca : 'reel', ROTULO_PECA[r?.peca2] ? r.peca2 : null].filter(Boolean))];
const ordemTexto = (r) => {
  const ts = tiposDaPeca(r);
  return ts.includes('reel') ? ['reel', ...ts.filter((t) => t !== 'reel')] : ts;
};
function ganchoDaPeca(r) {
  for (const t of ordemTexto(r)) {
    const v = { reel: r?.roteiro?.hook, carrossel: r?.carrossel?.capa?.titulo, estatico: r?.estatico?.headline, stories: r?.stories?.quadros?.[0]?.texto }[t];
    if (temTexto(v)) return v.trim();
  }
  return '';
}
// a CTA do tipo do post vem primeiro: o carrossel publicado de uma peça "reel + carrossel" usa o slide final
function ctaDaPeca(r, peca = null) {
  const campo = (t) => ({ reel: r?.roteiro?.cta, carrossel: r?.carrossel?.final?.texto, estatico: r?.estatico?.cta }[t]);
  for (const t of [...(peca ? [peca] : []), ...ordemTexto(r)]) {
    const v = campo(t);
    if (temTexto(v)) return v.trim();
  }
  return '';
}

export const limparTexto = (s, lim = 400) => String(s ?? '').replace(TRACOS, ', ').replace(/\s+/g, ' ').trim().slice(0, lim);
const objeto = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const arred = (x) => Math.round(x * 1000) / 1000;

// ---------- valores ----------

export const MIDIA_ID = /^\d{1,40}$/;
export const REEL_ID = /^reel_[a-z0-9]{4,20}$/i;
export const PECAS_MIDIA = ['reel', 'carrossel', 'estatico'];
export const INICIO_V1 = '2026-09-30';

const TODAS = PECAS_MIDIA;
const SIM_NAO = [{ id: true, nome: 'Sim' }, { id: false, nome: 'Não' }];
const lista = (pares) => pares.map(([id, nome]) => ({ id, nome }));

// os 24 de data/estilos.json (SPEC §3.3.1), com o tipo que tem o guia de estilo
export const VALORES_GATILHO = [
  ...[
    ['surpresa-fato', 'Surpresa com fato'], ['indignacao-sistema', 'Indignação com o sistema'],
    ['humor-burocracia', 'Humor sobre a burocracia'], ['opiniao-forte', 'Opinião forte'],
    ['curiosidade-lacuna', 'Curiosidade com lacuna'], ['utilidade-salvar', 'Utilidade de salvar'],
    ['protecao', 'Proteção de quem você gosta'], ['reconhecimento-imediato', 'Reconhecimento imediato'],
  ].map(([id, nome]) => ({ id, nome, tipo: 'viralizacao' })),
  ...[
    ['dor-custo', 'Dor com custo concreto'], ['prova-visivel', 'Prova visível na tela do app'],
    ['facilidade', 'Facilidade'], ['transparencia-preco', 'Transparência de preço'],
    ['confianca-local', 'Confiança local'], ['honestidade', 'Honestidade que desarma'],
    ['escassez-real', 'Escassez real'], ['baixo-atrito', 'Baixo atrito'],
  ].map(([id, nome]) => ({ id, nome, tipo: 'vendas' })),
  ...[
    ['reconhecimento-cena', 'Reconhecimento de cena'], ['validacao', 'Validação sem pena'],
    ['orgulho-cnpj', 'Orgulho do CNPJ'], ['medo-nomeado', 'Medo nomeado com cuidado'],
    ['solidao', 'Solidão de quem trabalha sozinho'], ['bastidor-fundador', 'Bastidor vulnerável do fundador'],
    ['especificidade-profissao', 'Especificidade de profissão'], ['pertencimento', 'Pertencimento'],
  ].map(([id, nome]) => ({ id, nome, tipo: 'conexao' })),
];

// famílias do banco curado (.claude/skills/reels-leo/references/ganchos.md), com os nomes das seções
export const VALORES_GANCHO = lista([
  ['gancho-direto', 'Abertura com Gancho Direto'], ['storytelling', 'Storytelling em Vídeo'],
  ['curiosidades', 'Curiosidades e Fatos'], ['polemicas', 'Polêmicas e Opiniões'], ['motivacao', 'Motivação Curta'],
  ['educativo-rapido', 'Educativo Rápido'], ['provas', 'Provas e Resultados'], ['perguntas', 'Perguntas Que Prendem'],
  ['identificacao', 'Gatilhos de Identificação'], ['listas', 'Listas em Vídeo'], ['fator-r', 'Peça única de Fator R'],
  ['fora-do-banco', 'Fora do banco de ganchos'],
]);

// "Mapa por tipo" do ganchos.md: as famílias que mais servem a cada tipo (pro "testar" do diagnóstico)
export const GANCHO_POR_TIPO = {
  viralizacao: ['curiosidades', 'identificacao', 'perguntas', 'polemicas'],
  conexao: ['identificacao', 'storytelling', 'motivacao', 'perguntas'],
  ensino: ['educativo-rapido', 'curiosidades', 'listas'],
  conselho: ['gancho-direto', 'storytelling', 'polemicas', 'perguntas'],
  vendas: ['gancho-direto', 'polemicas', 'provas', 'listas'],
};

// a escada da ctas.md; fora do escopo vale em qualquer tipo
export const CTA_POR_TIPO = {
  viralizacao: ['salvar', 'mandar', 'comentar', 'fora-do-escopo'],
  conexao: ['comentar', 'mandar', 'seguir', 'fora-do-escopo'],
  ensino: ['salvar', 'mandar', 'seguir', 'fora-do-escopo'],
  conselho: ['salvar', 'mandar', 'fora-do-escopo'],
  vendas: ['lista-de-espera', 'fora-do-escopo'],
};

const VALORES_CTA = lista([
  ['seguir', 'Seguir'], ['salvar', 'Salvar'], ['mandar', 'Mandar, compartilhar ou marcar'], ['comentar', 'Comentar'],
  ['lista-de-espera', 'Lista de espera (link da bio)'], ['fora-do-escopo', 'Fora do escopo'], ['curtir', 'Curtir'],
  ['sem-cta', 'Sem CTA'],
]);

const dim = (id, nome, grupo, etapa, aplica, pecas, fontes, valores, tipo = 'enum') => ({ id, nome, grupo, etapa, aplica, pecas, fontes, valores, tipo });

// a tabela da SPEC §3.3, na ordem dela. pilar e formato ficam sem valores aqui: vêm do banco em codebook(db)
export const DIMENSOES = [
  dim('pilar', 'Pilar', 'fundamento', 'objetivo', 'planejamento', TODAS, ['manual', 'cronograma'], []),
  dim('bloco', 'Bloco', 'fundamento', 'objetivo', 'planejamento', TODAS, ['manual', 'cronograma'], BLOCOS.map((b) => ({ id: b, nome: b }))),
  dim('tipo', 'Tipo (objetivo da peça)', 'fundamento', 'objetivo', 'planejamento', TODAS, ['manual', 'cronograma'], TIPOS_REEL.map((t) => ({ id: t, nome: ROTULO_TIPO[t] }))),
  dim('formato', 'Formato da biblioteca', 'fundamento', 'objetivo', 'planejamento', ['reel'], ['manual', 'cronograma', 'ia'], []),
  dim('ganchoFamilia', 'Gancho: família', 'mecanismo', 'gancho', 'peca', ['reel', 'carrossel'], ['manual', 'ia'], VALORES_GANCHO),
  dim('ganchoForma', 'Gancho: forma', 'mecanismo', 'gancho', 'peca', TODAS, ['manual', 'ia'], lista([
    ['pergunta', 'Pergunta'], ['afirmacao', 'Afirmação'], ['numero', 'Número'], ['cena', 'Cena'], ['sem-fala', 'Sem fala'],
  ])),
  dim('rostoInicio', 'Rosto nos 3 primeiros segundos', 'mecanismo', 'gancho', 'peca', ['reel'], ['manual', 'ia'], SIM_NAO, 'bool'),
  dim('textoInicio', 'Texto na tela no começo', 'mecanismo', 'gancho', 'peca', ['reel'], ['manual', 'ia'], SIM_NAO, 'bool'),
  dim('telaApp', 'Tela do app aparece', 'mecanismo', 'qualidade', 'peca', TODAS, ['manual', 'ia'], SIM_NAO, 'bool'),
  dim('gatilho', 'Gatilho emocional', 'mecanismo', 'qualidade', 'peca', TODAS, ['manual', 'ia'], VALORES_GATILHO),
  dim('cta', 'CTA', 'mecanismo', 'conversao', 'peca', TODAS, ['manual', 'ia', 'cronograma'], VALORES_CTA),
  dim('voz', 'Quem fala', 'mecanismo', 'qualidade', 'peca', ['reel'], ['manual', 'ia'], lista([
    ['leo', 'Léo (o suricato)'], ['pedro', 'Pedro'], ['mauro', 'Mauro'], ['institucional', 'Voz da marca'],
    ['sem-voz', 'Sem voz'], ['outro', 'Outra pessoa'],
  ])),
  dim('humor', 'Humor', 'mecanismo', 'qualidade', 'peca', TODAS, ['manual', 'ia'], SIM_NAO, 'bool'),
  dim('audio', 'Áudio', 'mecanismo', 'retencao', 'peca', ['reel'], ['manual', 'ia', 'calculado'], lista([
    ['fala', 'Fala'], ['musica', 'Música'], ['fala-e-musica', 'Fala e música'], ['som-sem-fala', 'Som sem fala (música ou efeito)'],
    ['sem-audio', 'Sem áudio'],
  ])),
  dim('preco', 'Preço na peça', 'mecanismo', 'conversao', 'peca', TODAS, ['manual', 'ia'], SIM_NAO, 'bool'),
  dim('duracaoFaixa', 'Duração', 'mecanismo', 'retencao', 'peca', ['reel'], ['calculado'], lista([
    ['ate-15', 'Até 15s'], ['16-30', '16 a 30s'], ['31-45', '31 a 45s'], ['46-60', '46 a 60s'], ['mais-60', 'Mais de 60s'],
  ])),
  dim('slidesFaixa', 'Slides do carrossel', 'mecanismo', 'retencao', 'peca', ['carrossel'], ['calculado'], lista([
    ['2-3', '2 a 3 slides'], ['4-6', '4 a 6 slides'], ['7-10', '7 a 10 slides'],
  ])),
  dim('legendaFaixa', 'Tamanho da legenda', 'mecanismo', 'qualidade', 'peca', TODAS, ['calculado'], lista([
    ['curta', 'Curta (até 300 caracteres)'], ['media', 'Média (301 a 1.000)'], ['longa', 'Longa (mais de 1.000)'],
  ])),
  dim('horario', 'Horário de postagem', 'mecanismo', 'distribuicao', 'peca', TODAS, ['calculado'], lista([
    ['madrugada', 'Madrugada (0h a 6h)'], ['manha', 'Manhã (6h a 12h)'], ['tarde', 'Tarde (12h a 18h)'], ['noite', 'Noite (18h a 24h)'],
  ])),
  dim('diaSemana', 'Dia da semana', 'mecanismo', 'distribuicao', 'peca', TODAS, ['calculado'], lista([
    ['dom', 'Domingo'], ['seg', 'Segunda'], ['ter', 'Terça'], ['qua', 'Quarta'], ['qui', 'Quinta'], ['sex', 'Sexta'], ['sab', 'Sábado'],
  ])),
  dim('impulsionado', 'Teve anúncio', 'contexto', 'contexto', 'nunca', TODAS, ['manual', 'calculado'], SIM_NAO, 'bool'),
  dim('linha', 'Linha editorial', 'contexto', 'contexto', 'nunca', TODAS, ['calculado'], lista([
    ['v1', 'V1 (publicado a partir de 30/09/2026)'], ['anterior', 'Anterior'],
  ])),
];

// como a IA decide cada dimensão (vai no system prompt da etiquetagem; texto nosso, sem dado de terceiro)
export const DICAS_IA = {
  formato: 'o formato da Biblioteca de Reels que mais se parece com a estrutura do vídeo. Sem nenhum parecido, não etiquete.',
  ganchoFamilia: 'a categoria do banco de ganchos (abaixo) em que o gancho se encaixa: de 0 a 3s no reel, a capa no carrossel. fora-do-banco quando o gancho não segue nenhuma categoria do banco.',
  ganchoForma: 'pergunta (o gancho é uma pergunta), afirmacao (frase afirmativa), numero (abre com número, valor ou data), cena (abre com uma situação encenada, sem frase de gancho) ou sem-fala (ninguém fala no começo: o gancho é só imagem ou texto na tela).',
  rostoInicio: 'sim quando um rosto (de gente ou do Léo, o suricato da marca) aparece em destaque em algum quadro de 0:00 a 0:02,5.',
  textoInicio: 'sim quando há texto escrito na tela (título, frase, legenda queimada) em algum quadro de 0:00 a 0:02,5.',
  telaApp: 'sim quando aparece a tela do app do Legalizaí (celular ou tela com a interface do app).',
  gatilho: 'o gatilho emocional principal (um só), da lista do guia de estilo.',
  cta: 'a chamada pra ação que a peça usa (em geral a última fala e o começo ou o fim da legenda). sem-cta quando a peça não pede nada.',
  voz: 'quem fala. leo é o Léo, o suricato animado da marca; pedro ou mauro só quando a fala, a legenda ou o texto na tela disser o nome; institucional é narração da marca sem pessoa identificada; sem-voz quando ninguém fala; outro para outra pessoa.',
  humor: 'sim quando a peça usa humor (piada, ironia, situação cômica).',
  audio: 'só etiquete fala (tem fala) ou fala-e-musica (tem fala e audioDaMeta diz música), sempre com um trecho da fala como evidência.',
  preco: 'sim quando a peça mostra ou fala um preço (R$) do Legalizaí.',
};

// congela o codebook: quem importa não muda a tabela sem querer
function congelar(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const x of Object.values(o)) congelar(x);
  }
  return o;
}
[DIMENSOES, VALORES_GATILHO, VALORES_GANCHO, GANCHO_POR_TIPO, CTA_POR_TIPO, DICAS_IA].forEach(congelar);

const POR_ID = new Map(DIMENSOES.map((d) => [d.id, d]));
export const dimensao = (id) => POR_ID.get(typeof id === 'string' ? id : id?.id) ?? null;
// as dimensões que a IA etiqueta num post daquele tipo de peça
export const dimensoesIa = (peca) => DIMENSOES.filter((d) => d.fontes.includes('ia') && d.pecas.includes(peca));

// valores de uma dimensão; os de pilar e formato saem do banco
function valoresDe(d, db) {
  if (d.id === 'pilar') {
    return (Array.isArray(db?.pilares) ? db.pilares : [])
      .filter((p) => p?.id != null && String(p.id).trim())
      .map((p) => ({ id: String(p.id), nome: temTexto(p.nome) ? `${p.id} · ${limparTexto(p.nome, 200)}` : String(p.id) }));
  }
  if (d.id === 'formato') {
    return (Array.isArray(db?.formatos) ? db.formatos : [])
      .filter((f) => typeof f?.id === 'string' && f.id)
      .map((f) => ({ id: f.id, nome: limparTexto(f.codigo ? `${f.codigo} · ${f.nome ?? ''}` : f.nome ?? f.id, 200) }));
  }
  return d.valores;
}

// DIMENSOES com os valores dinâmicos (pilares e formatos do banco); cópia, pode mexer
export function codebook(db) {
  return DIMENSOES.map((d) => ({ ...d, pecas: [...d.pecas], fontes: [...d.fontes], valores: valoresDe(d, db).map((v) => ({ ...v })) }));
}

// o que chega da tela: "sim"/"nao" viram booleano, número vira texto ("4" do pilar), bloco sem acento vira o canônico
export function normalizarValor(dimensaoId, valor) {
  const d = dimensao(dimensaoId);
  if (!d || valor === null || valor === undefined) return valor ?? null;
  if (d.tipo === 'bool') {
    if (typeof valor === 'boolean') return valor;
    const t = typeof valor === 'string' ? slug(valor) : '';
    if (['sim', 'true'].includes(t)) return true;
    if (['nao', 'false'].includes(t)) return false;
    return valor;
  }
  if (typeof valor === 'number' && Number.isFinite(valor)) return String(valor);
  if (typeof valor !== 'string') return valor;
  const t = valor.trim();
  return d.id === 'bloco' ? blocoCanonico(t) ?? t : t;
}

// bool só aceita true/false; enum só um id da lista (pilar e formato: os do banco)
export function validarValor(dimensaoId, valor, db) {
  const d = dimensao(dimensaoId);
  if (!d) return false;
  if (d.tipo === 'bool') return typeof valor === 'boolean';
  return typeof valor === 'string' && valor !== '' && valoresDe(d, db).some((v) => v.id === valor);
}

// ---------- CTA pelo texto ----------

// na ordem de prioridade: link manda; fora do escopo antes do "segue a gente" que fecha a frase dele;
// depois o que a estratégia mede (salvar, mandar, comentar, seguir) e curtir por último
const REGRAS_CTA = [
  ['lista-de-espera', /\blista de espera\b|\blink da bio\b|\blink na bio\b/],
  ['fora-do-escopo', /\bhoje a gente (?:so )?cuida\b/],
  ['salvar', /\bsalv(?:a|e|ar|em)\b|\bguard(?:a|e|ar)\b/],
  ['mandar', /\bmand(?:a|e|ar)\b|\bcompartilh(?:a|e|ar)\b|\bmarc(?:a|ar|que)\b/],
  ['comentar', /\bcoment(?:a|e|ar|ario|arios)\b|\bconta pra gente\b|\bme conta\b|\bconta aqui\b|\brespond(?:e|a) aqui\b|\bpergunta aqui\b/],
  ['seguir', /\bsegu(?:e|ir)\b|\bsiga\b/],
  ['curtir', /\bcurt(?:e|ir|a)\b|\blike\b/],
];

// "Salva pra quando bater a dúvida." → salvar. Sem palavra conhecida (ou sem texto): null, nunca "sem-cta"
export function classificarCta(texto) {
  const t = slug(texto).replace(/-/g, ' ');
  if (!t) return null;
  for (const [id, re] of REGRAS_CTA) if (re.test(t)) return id;
  return null;
}

// ---------- post e peça ----------

// REELS e vídeo de feed são reel; álbum é carrossel; foto de feed é estático. Item antigo do cache sem tipo era reel
export function pecaDaMidia(midia) {
  if (!midia || typeof midia !== 'object') return null;
  const tipo = String(midia.tipo ?? midia.tipoMidia ?? '').toUpperCase();
  const media = String(midia.mediaType ?? '').toUpperCase();
  if (tipo === 'CAROUSEL_ALBUM' || media === 'CAROUSEL_ALBUM') return 'carrossel';
  if (tipo === 'REELS') return 'reel';
  if (tipo === 'FEED') return media === 'VIDEO' ? 'reel' : 'estatico';
  if (media === 'IMAGE') return 'estatico';
  return 'reel';
}

// a peça do post: o vínculo gravado (registro.reelId), senão a peça com o link do mesmo post.
// por: 'manual' | 'permalink' | null
export function vinculoDaMidia(db, midia, registro) {
  const reels = Array.isArray(db?.reels) ? db.reels : [];
  const id = registro?.reelId;
  if (typeof id === 'string' && id) {
    const r = reels.find((x) => x?.id === id);
    if (r) return { reel: r, por: registro.vinculoPor === 'permalink' ? 'permalink' : 'manual' };
  }
  if (temTexto(midia?.permalink)) {
    const codigo = codigoPost(midia.permalink);
    const r = reels.find((x) => temTexto(x?.permalink) && codigoPost(x.permalink) === codigo);
    if (r) return { reel: r, por: 'permalink' };
  }
  return { reel: null, por: null };
}
export const reelDaMidia = (db, midia, registro) => vinculoDaMidia(db, midia, registro).reel;

// ---------- faixas (as dimensões calculadas) ----------

// segundos inteiros: 15,4s é "até 15"; 15,6s já é "16 a 30"
export function faixaDuracao(s) {
  if (!finito(s) || s <= 0) return null;
  const r = Math.round(s);
  return r <= 15 ? 'ate-15' : r <= 30 ? '16-30' : r <= 45 ? '31-45' : r <= 60 ? '46-60' : 'mais-60';
}
export function faixaSlides(n) {
  if (!Number.isInteger(n)) return null;
  return n >= 2 && n <= 3 ? '2-3' : n >= 4 && n <= 6 ? '4-6' : n >= 7 && n <= 10 ? '7-10' : null;
}
// caracteres como a pessoa conta (emoji é um só)
export function faixaLegenda(texto) {
  if (typeof texto !== 'string') return null;
  const n = [...texto].length;
  return n <= 300 ? 'curta' : n <= 1000 ? 'media' : 'longa';
}
export function faixaHorario(hora) {
  if (!Number.isInteger(hora) || hora < 0 || hora > 23) return null;
  return hora < 6 ? 'madrugada' : hora < 12 ? 'manha' : hora < 18 ? 'tarde' : 'noite';
}
const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

// fala na transcrição: true (tem fala), false (o whisper rodou e não achou fala, ou o vídeo não tem áudio),
// null (não deu pra saber). ev = a evidência do analise.mjs ({ temAudio, transcricao, avisoAudio })
export function falaDaEvidencia(ev) {
  if (!ev || typeof ev !== 'object') return null;
  const segs = ev.transcricao?.segmentos;
  if (Array.isArray(segs) && segs.some((s) => temTexto(s?.texto))) return true;
  if (ev.temAudio === false) return false;
  // o aviso que o analise.mjs escreve quando a transcrição rodou e voltou vazia
  if (/fala reconhec/i.test(String(ev.avisoAudio ?? ''))) return false;
  return null;
}

// media_audio_type da Meta + o que a transcrição achou (a IA refina pra fala-e-musica)
export function audioCalculado(audioTipo, temAudio, fala) {
  if (temAudio === false) return 'sem-audio';
  const t = String(audioTipo ?? '').toUpperCase();
  if (t.includes('MUSIC')) return 'musica';
  if (t.includes('ORIGINAL')) return fala === true ? 'fala' : fala === false ? 'som-sem-fala' : null;
  return fala === true ? 'fala' : null;
}

function sinaisDeAudio(ia, analise) {
  const temAudio = typeof ia?.temAudio === 'boolean' ? ia.temAudio : typeof analise?.temAudio === 'boolean' ? analise.temAudio : null;
  const fala = typeof ia?.fala === 'boolean' ? ia.fala : falaDaEvidencia(analise);
  return { temAudio, fala };
}

function tagsCalculadas(midia, registro, extras) {
  const ts = midia?.timestamp;
  const analise = extras?.analise && typeof extras.analise === 'object' ? extras.analise : null;
  const duracao = finito(registro?.ia?.duracaoS) ? registro.ia.duracaoS : finito(analise?.duracao) ? analise.duracao : null;
  const { temAudio, fala } = sinaisDeAudio(registro?.ia, analise);
  const dia = diaBrasilia(ts);
  const ds = diaSemanaBrasilia(ts);
  return {
    duracaoFaixa: faixaDuracao(duracao),
    slidesFaixa: faixaSlides(midia?.nSlides),
    legendaFaixa: faixaLegenda(midia?.caption),
    horario: faixaHorario(horaBrasilia(ts)),
    diaSemana: ds == null ? null : DIAS_SEMANA[ds],
    audio: audioCalculado(midia?.audioTipo, temAudio, fala),
    impulsionado: typeof extras?.anunciado === 'boolean' ? extras.anunciado : null,
    linha: dia ? (dia >= INICIO_V1 ? 'v1' : 'anterior') : null,
  };
}

// o que a peça vinculada diz: pilar, bloco (o gravado ou o do pilar), tipo, formato e a CTA do texto
function tagsDoCronograma(db, reel, peca) {
  if (!reel) return {};
  const pilar = reel.pilar == null || reel.pilar === '' ? null : String(Number(reel.pilar));
  const doPilar = pilar ? (db?.pilares ?? []).find((p) => String(p?.id) === pilar)?.bloco ?? BLOCO_DO_PILAR[pilar] : null;
  return {
    pilar,
    bloco: blocoCanonico(reel.bloco) ?? blocoCanonico(doPilar),
    tipo: reel.tipo ?? null,
    formato: reel.formatoId ?? null,
    cta: classificarCta(ctaDaPeca(reel, peca)),
  };
}

// { [dim]: { valor, fonte: 'manual'|'cronograma'|'ia'|'calculado', evidencias?, em?, autor? } }, só as dimensões
// que valem pro tipo de peça do post e têm valor válido no codebook agora.
// midia = item de proprios/postsProprios; registro = mecanismos.midias[id] ou null;
// extras = { analise?: data/analises/<id>.json, anunciado?: boolean }
export function tagsEfetivas(db, midia, registro, extras = {}) {
  const peca = pecaDaMidia(midia);
  if (!peca) return {};
  const reg = registro && typeof registro === 'object' ? registro : null;
  const salvas = objeto(reg?.tags);
  let cronograma = null;
  let calculadas = null;
  const candidato = {
    manual: (d) => {
      if (d.id === 'impulsionado' && typeof reg?.impulsionado === 'boolean') return { valor: reg.impulsionado, fonte: 'manual' };
      const t = salvas[d.id];
      if (t?.fonte !== 'manual') return null;
      return { valor: t.valor, fonte: 'manual', ...(t.em ? { em: t.em } : {}), ...(t.autor ? { autor: t.autor } : {}) };
    },
    ia: (d) => {
      const t = salvas[d.id];
      const x = t?.fonte === 'ia' ? t : t?.fonte === 'manual' && t.ia && typeof t.ia === 'object' ? t.ia : null;
      if (!x) return null;
      return { valor: x.valor, fonte: 'ia', ...(x.em ? { em: x.em } : {}), evidencias: Array.isArray(x.evidencias) ? x.evidencias.map((e) => ({ ...e })) : [] };
    },
    cronograma: (d) => {
      cronograma ??= tagsDoCronograma(db, reelDaMidia(db, midia, reg), peca);
      return cronograma[d.id] == null ? null : { valor: cronograma[d.id], fonte: 'cronograma' };
    },
    calculado: (d) => {
      calculadas ??= tagsCalculadas(midia, reg, extras);
      return calculadas[d.id] == null ? null : { valor: calculadas[d.id], fonte: 'calculado' };
    },
  };
  const saida = {};
  for (const d of DIMENSOES) {
    if (!d.pecas.includes(peca)) continue;
    for (const fonte of d.fontes) {
      const c = candidato[fonte]?.(d);
      if (c && validarValor(d, c.valor, db)) {
        saida[d.id] = c;
        break;
      }
    }
  }
  return saida;
}

// ---------- vínculo sugerido ----------

export const JANELA_VINCULO = 3; // dias entre a data da peça e a publicação
export const LIMIAR_VINCULO = 0.5;
const PESO_DATA = 0.4;
const PESO_TEXTO = 0.6;
// palavra de ligação não conta como palavra em comum
const PARADAS = new Set((
  'que com por pra para pro pros pras uma umas uns dos das nos nas num numa aos pelo pela pelos pelas ele ela eles elas '
  + 'voce voces seu sua seus suas meu minha meus minhas nosso nossa nossos nossas isso isto esse essa esses essas este esta '
  + 'estes estas aquele aquela aquilo aqui ali mais menos mas nem como quando onde qual quais quem porque pois tambem ate '
  + 'sem sob sobre entre depois antes muito muita muitos muitas pouco pouca tudo todo toda todos todas cada outro outra '
  + 'outros outras mesmo mesma agora hoje ainda bem tem ter tinha tenho temos sao ser foi era vai vou vao vem ver faz '
  + 'fazer feito sim nao gente lhe estao the and'
).split(' '));

function palavras(...textos) {
  const s = new Set();
  for (const t of textos) {
    for (const w of slug(t).split('-')) if (w.length >= 3 && !/^\d+$/.test(w) && !PARADAS.has(w)) s.add(w);
  }
  return s;
}

// nota de 0 a 1: 40% a data (mesmo dia 1; 3 dias 0,25) e 60% o texto. O texto é o maior entre a cobertura
// das palavras do título, tema e gancho da peça na legenda do post e a semelhança entre as duas legendas;
// com menos de 2 palavras em comum, o texto vale 0 (uma palavra só é acaso)
export function pontuarVinculo(midia, reel, dias) {
  const legenda = palavras(midia?.caption);
  const chave = palavras(reel?.ideia, reel?.tema, ganchoDaPeca(reel ?? {}));
  const texto = palavras(reel?.legenda);
  const comunsChave = [...chave].filter((w) => legenda.has(w));
  const comunsTexto = [...texto].filter((w) => legenda.has(w));
  const comuns = new Set([...comunsChave, ...comunsTexto]).size;
  const cobertura = chave.size ? comunsChave.length / chave.size : 0;
  const parecida = texto.size && legenda.size ? comunsTexto.length / Math.min(texto.size, legenda.size) : 0;
  const notaTexto = comuns >= 2 ? Math.max(cobertura, parecida) : 0;
  const notaData = finito(dias) && Math.abs(dias) <= JANELA_VINCULO ? 1 - Math.abs(dias) / (JANELA_VINCULO + 1) : 0;
  return { score: arred(PESO_DATA * notaData + PESO_TEXTO * notaTexto), comuns, notaTexto: arred(notaTexto), notaData: arred(notaData) };
}

function motivoVinculo(dias, comuns) {
  const n = Math.abs(dias);
  const quando = dias === 0 ? 'Publicado no dia da peça' : `Publicado ${n} ${n === 1 ? 'dia' : 'dias'} ${dias > 0 ? 'depois' : 'antes'} da data da peça`;
  return `${quando}, com ${comuns} ${comuns === 1 ? 'palavra' : 'palavras'} em comum com o título, o tema, o gancho ou a legenda.`;
}

// link colado de um post que não está no cache: o tipo sai do caminho (/reel/ é reel; /p/ é feed)
function pecasDoLink(url) {
  const m = /instagram\.com\/(?:[^/?#]+\/)?(reels?|p|tv)\//i.exec(String(url ?? ''));
  if (!m) return [];
  return m[1].toLowerCase() === 'p' ? ['carrossel', 'estatico'] : ['reel'];
}

// [ { midiaId, reelId, score, motivo } ], um por post sem vínculo, o mais novo primeiro.
// midias = proprios + postsProprios; registros = mecanismos.midias (ou o arquivo inteiro)
export function sugerirVinculos(db, midias, registros) {
  const lista = (Array.isArray(midias) ? midias : []).filter((m) => m && m.midiaId != null);
  const regs = objeto(registros?.midias && typeof registros.midias === 'object' ? registros.midias : registros);
  const pecas = (Array.isArray(db?.reels) ? db.reels : []).filter((r) => r?.id && /^\d{4}-\d{2}-\d{2}$/.test(String(r.data ?? '')));
  const ocupadas = new Set(); // `${reelId}|${peca}`: a peça já tem um post daquele tipo
  const livres = [];
  for (const m of lista) {
    const reg = regs[String(m.midiaId)] ?? null;
    const r = reelDaMidia(db, m, reg);
    if (r) ocupadas.add(`${r.id}|${pecaDaMidia(m)}`);
    else if (!reg?.vinculoEm) livres.push(m); // alguém soltou o vínculo de propósito: não sugere de novo
  }
  // o link colado na peça manda, mesmo o de um post que ainda não está no cache
  const porCodigo = new Map(lista.filter((m) => temTexto(m.permalink)).map((m) => [codigoPost(m.permalink), m]));
  for (const r of Array.isArray(db?.reels) ? db.reels : []) {
    if (!temTexto(r?.permalink)) continue;
    const dono = porCodigo.get(codigoPost(r.permalink));
    for (const p of dono ? [pecaDaMidia(dono)] : pecasDoLink(r.permalink)) ocupadas.add(`${r.id}|${p}`);
  }

  const pares = [];
  for (const m of livres) {
    const dia = diaBrasilia(m.timestamp);
    const peca = pecaDaMidia(m);
    if (!dia || !peca) continue;
    for (const r of pecas) {
      if (!tiposDaPeca(r).includes(peca) || ocupadas.has(`${r.id}|${peca}`)) continue;
      const dias = diasEntre(r.data, dia);
      if (dias == null || Math.abs(dias) > JANELA_VINCULO) continue;
      const p = pontuarVinculo(m, r, dias);
      if (p.score >= LIMIAR_VINCULO) pares.push({ m, r, peca, dias, ...p });
    }
  }
  pares.sort((a, b) => b.score - a.score || Math.abs(a.dias) - Math.abs(b.dias)
    || String(a.m.midiaId).localeCompare(String(b.m.midiaId)) || String(a.r.id).localeCompare(String(b.r.id)));
  const usados = new Set();
  const saida = [];
  for (const p of pares) {
    const chave = `${p.r.id}|${p.peca}`;
    if (usados.has(String(p.m.midiaId)) || ocupadas.has(chave)) continue;
    usados.add(String(p.m.midiaId));
    ocupadas.add(chave);
    saida.push({ ms: msDe(p.m.timestamp) ?? 0, item: { midiaId: String(p.m.midiaId), reelId: p.r.id, score: p.score, motivo: motivoVinculo(p.dias, p.comuns) } });
  }
  return saida.sort((a, b) => b.ms - a.ms).map((x) => x.item);
}

// ---------- o arquivo (data/mecanismos.json) ----------

export const registroVazio = () => ({ reelId: null, vinculoPor: null, vinculoEm: null, vinculoAutor: null, tags: {}, ia: null, manual: null, impulsionado: null });

// forma garantida de um registro; chave desconhecida fica (outro módulo pode ter escrito)
export function formaRegistro(bruto) {
  const r = objeto(bruto);
  const tags = {};
  for (const [id, t] of Object.entries(objeto(r.tags))) {
    if (POR_ID.has(id) && t && typeof t === 'object' && (t.fonte === 'manual' || t.fonte === 'ia')) tags[id] = t;
  }
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);
  return {
    ...r,
    reelId: typeof r.reelId === 'string' && REEL_ID.test(r.reelId) ? r.reelId : null,
    vinculoPor: r.vinculoPor === 'manual' || r.vinculoPor === 'permalink' ? r.vinculoPor : null,
    vinculoEm: typeof r.vinculoEm === 'string' ? r.vinculoEm : null,
    vinculoAutor: typeof r.vinculoAutor === 'string' ? r.vinculoAutor : null,
    tags,
    ia: obj(r.ia),
    manual: obj(r.manual),
    impulsionado: typeof r.impulsionado === 'boolean' ? r.impulsionado : null,
  };
}

export function formaArquivo(bruto) {
  const midias = {};
  for (const [id, r] of Object.entries(objeto(objeto(bruto).midias))) if (MIDIA_ID.test(id)) midias[id] = formaRegistro(r);
  return { versao: 1, midias };
}

// tag manual (valor null apaga a manual). A da IA que estava ali fica guardada em `ia` e volta quando a
// manual sai. Muda o registro e devolve ele
export function aplicarTagManual(registro, dimensaoId, valor, { autor = null, em = null } = {}) {
  registro.tags = objeto(registro.tags);
  const atual = registro.tags[dimensaoId];
  const daIa = atual?.fonte === 'ia'
    ? { valor: atual.valor, em: atual.em ?? null, evidencias: atual.evidencias ?? [] }
    : atual?.fonte === 'manual' && atual.ia && typeof atual.ia === 'object' ? atual.ia : null;
  if (valor === null || valor === undefined) {
    if (atual?.fonte !== 'manual') return registro;
    if (daIa) registro.tags[dimensaoId] = { valor: daIa.valor, fonte: 'ia', em: daIa.em ?? null, evidencias: daIa.evidencias ?? [] };
    else delete registro.tags[dimensaoId];
    return registro;
  }
  registro.tags[dimensaoId] = { valor, fonte: 'manual', em, ...(autor ? { autor } : {}), ...(daIa ? { ia: daIa } : {}) };
  return registro;
}

// resultado novo da IA: some tudo o que a IA tinha dito nas dimensões pedidas e entra o novo.
// Dimensão com tag manual não muda: a da IA fica guardada dentro dela (`ia`)
export function aplicarTagsIa(registro, tags, dimsPedidas, em) {
  registro.tags = objeto(registro.tags);
  for (const id of dimsPedidas ?? []) {
    const t = registro.tags[id];
    if (t?.fonte === 'ia') delete registro.tags[id];
    else if (t?.fonte === 'manual') delete t.ia;
  }
  for (const [id, t] of Object.entries(objeto(tags))) {
    const atual = registro.tags[id];
    const evidencias = Array.isArray(t.evidencias) ? t.evidencias : [];
    if (atual?.fonte === 'manual') atual.ia = { valor: t.valor, em, evidencias };
    else registro.tags[id] = { valor: t.valor, fonte: 'ia', em, evidencias };
  }
  return registro;
}

// número da tela do app: inteiro de 0 a 1 bilhão; aceita "1.234" (milhar pt-BR). Vazio = null; inválido = NaN
export function inteiroManual(v) {
  if (v === null || v === undefined || v === '') return null;
  let n = v;
  if (typeof v === 'string') {
    const t = v.trim().replace(/\s/g, '');
    if (!t) return null;
    if (!/^\d+$/.test(t) && !/^\d{1,3}(\.\d{3})+$/.test(t)) return NaN;
    n = Number(t.replace(/\./g, ''));
  }
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 1e9 ? n : NaN;
}

// ---------- etiquetagem com IA (a parte que não depende de disco) ----------

const valorTexto = (d, v) => (d.tipo === 'bool' ? (v.id ? 'sim' : 'nao') : v.id);
function audioDaMeta(audioTipo) {
  const t = String(audioTipo ?? '').toUpperCase();
  return t.includes('MUSIC') ? 'música' : t.includes('ORIGINAL') ? 'áudio original' : 'sem dado';
}

// o bloco de dados do prompt. Só a peça em si: legenda, duração, áudio da Meta, quadros ou imagens e o
// codebook. Nenhum número de desempenho entra (a IA não pode racionalizar o resultado).
// transcricao = linhas já com tempo ("[0:00 a 0:02,5] texto")
export function dadosParaIa({ midia, peca, db, quadros = [], imagens = [], transcricao = [], duracao = null } = {}) {
  const post = { peca: ROTULO_PECA[peca] ?? String(peca ?? ''), legenda: String(midia?.caption ?? '').slice(0, 2200) };
  if (peca === 'reel') {
    post.duracao = finito(duracao) ? `${(Math.round(duracao * 10) / 10).toLocaleString('pt-BR')}s` : 'sem dado';
    post.audioDaMeta = audioDaMeta(midia?.audioTipo);
  }
  if (peca === 'carrossel' && Number.isInteger(midia?.nSlides)) post.slides = midia.nSlides;
  const material = peca === 'reel'
    ? { quadros: quadros.map((q) => ({ tempo: q.rotulo, arquivo: q.arquivo })), transcricao: transcricao.length ? transcricao : ['Sem fala.'] }
    : { imagens: imagens.map((x) => ({ numero: x.numero, arquivo: x.arquivo })) };
  return {
    post,
    ...material,
    dimensoes: dimensoesIa(peca).map((d) => ({ id: d.id, nome: d.nome, valores: valoresDe(d, db).map((v) => ({ id: valorTexto(d, v), nome: v.nome })) })),
  };
}

// saída estruturada: dimensão e valor com enum do codebook (a dupla é conferida no servidor)
export function esquemaIa(peca, db) {
  const dims = dimensoesIa(peca);
  const valores = [...new Set(dims.flatMap((d) => valoresDe(d, db).map((v) => valorTexto(d, v))))];
  return {
    type: 'object',
    properties: {
      tags: {
        type: 'array',
        maxItems: dims.length * 2,
        items: {
          type: 'object',
          properties: {
            dimensao: { type: 'string', enum: dims.map((d) => d.id) },
            valor: { type: 'string', enum: valores },
            evidencias: {
              type: 'array',
              minItems: 1,
              maxItems: 4,
              items: {
                type: 'object',
                properties: {
                  tipo: { type: 'string', enum: peca === 'reel' ? ['quadro', 'fala', 'legenda'] : ['imagem', 'legenda'] },
                  tempo: { type: 'string' },
                  texto: { type: 'string' },
                },
                required: ['tipo', 'tempo', 'texto'],
                additionalProperties: false,
              },
            },
          },
          required: ['dimensao', 'valor', 'evidencias'],
          additionalProperties: false,
        },
      },
    },
    required: ['tags'],
    additionalProperties: false,
  };
}

function valorDaIa(d, v) {
  if (d.tipo === 'bool') {
    const t = slug(v);
    return t === 'sim' ? true : t === 'nao' ? false : undefined;
  }
  return typeof v === 'string' ? v.trim() : undefined;
}
const numeroImagem = (tempo) => {
  const m = /(\d{1,3})/.exec(String(tempo ?? ''));
  return m ? Number(m[1]) : null;
};

// confere a resposta da IA. quadro, fala e legenda passam pelo conferir do analise.mjs (injetado: este
// módulo não importa disco); imagem só com o número de uma imagem que existe. Dimensão fora da lista, valor
// fora do codebook ou etiqueta sem evidência conferida saem e contam em descartadas; a repetida é ignorada.
// base = { quadros, transcricao, legenda, imagens: [números] } → { tags: { [dim]: { valor, evidencias } }, descartadas }
export function verificarTagsIa(saida, base, { db, dims, conferir }) {
  const permitidas = new Map((dims ?? []).map((d) => dimensao(d)).filter(Boolean).map((d) => [d.id, d]));
  const numeros = new Set((base?.imagens ?? []).map(Number));
  const tags = {};
  let descartadas = 0;
  for (const t of Array.isArray(saida?.tags) ? saida.tags : []) {
    const d = permitidas.get(t?.dimensao);
    if (!d) {
      descartadas++;
      continue;
    }
    if (tags[d.id]) continue;
    const valor = valorDaIa(d, t.valor);
    if (!validarValor(d, valor, db)) {
      descartadas++;
      continue;
    }
    const evs = (Array.isArray(t.evidencias) ? t.evidencias : []).filter((e) => e && typeof e === 'object');
    const doTexto = evs.filter((e) => ['quadro', 'fala', 'legenda'].includes(e.tipo));
    const conferidas = doTexto.length && typeof conferir === 'function'
      ? conferir([{ texto: String(t.valor ?? ''), evidencias: doTexto }], {
        quadros: base?.quadros ?? [],
        transcricao: base?.transcricao ?? { texto: '', segmentos: [] },
        legenda: String(base?.legenda ?? ''),
      }, { descartadas: 0 })
      : [];
    const evidencias = [
      ...(conferidas?.[0]?.evidencias ?? [])
        .filter((e) => ['quadro', 'fala', 'legenda'].includes(e?.tipo))
        .map((e) => ({ tipo: e.tipo, tempo: String(e.tempo ?? ''), texto: limparTexto(e.texto) })),
      ...evs.filter((e) => e.tipo === 'imagem')
        .map((e) => ({ n: numeroImagem(e.tempo), texto: e.texto }))
        .filter((e) => e.n != null && numeros.has(e.n))
        .map((e) => ({ tipo: 'imagem', tempo: String(e.n), texto: limparTexto(e.texto) })),
    ].slice(0, 4);
    if (!evidencias.length) {
      descartadas++;
      continue;
    }
    tags[d.id] = { valor, evidencias };
  }
  return { tags, descartadas };
}
