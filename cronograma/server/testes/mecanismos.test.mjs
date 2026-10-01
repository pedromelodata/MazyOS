// Testes de server/mecanismos-codebook.mjs (node --test). Rodar: npm run testar
// Só o módulo puro: nada de disco, rede ou banco de verdade (o banco aqui é falso e mínimo). O mecanismos.mjs
// (arquivo, IA e download) só entra como texto, na conferência de travessão.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DIMENSOES, VALORES_GATILHO, VALORES_GANCHO, CTA_POR_TIPO, GANCHO_POR_TIPO, DICAS_IA, LIMIAR_VINCULO,
  codebook, dimensao, dimensoesIa, validarValor, normalizarValor, classificarCta, pecaDaMidia, reelDaMidia, vinculoDaMidia,
  tagsEfetivas, sugerirVinculos, pontuarVinculo, faixaDuracao, faixaSlides, faixaLegenda, faixaHorario, audioCalculado,
  falaDaEvidencia, registroVazio, formaArquivo, aplicarTagManual, aplicarTagsIa, inteiroManual, dadosParaIa, esquemaIa,
  verificarTagsIa,
} from '../mecanismos-codebook.mjs';

const TRACO = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);

const db = {
  pilares: [
    { id: 1, nome: 'Bastidor fundador', bloco: 'Afeto' },
    { id: 4, nome: 'Dor educativa', bloco: 'Educação' },
    { id: 17, nome: 'Facilidade do app', bloco: 'Diferencial' },
  ],
  formatos: [
    { id: 'fmt_1_1', codigo: '1.1', nome: 'Como corrigir um dado' },
    { id: 'fmt_t_1', codigo: 'T1', nome: 'Teste do app' },
  ],
  reels: [
    {
      id: 'reel_aaaa1111', data: '2026-09-18', peca: 'reel', peca2: null, tipo: 'ensino', pilar: 4, bloco: 'Educação', formatoId: 'fmt_1_1',
      permalink: 'https://www.instagram.com/reel/AAA111/', ideia: 'Contratar funcionário sem burocracia', tema: 'Contratação de funcionário',
      roteiro: { hook: 'Contratar alguém deveria significar crescimento', cta: 'Salva esse vídeo pra quando for contratar.' }, legenda: '',
    },
    {
      id: 'reel_bbbb2222', data: '2026-09-20', peca: 'reel', peca2: 'carrossel', tipo: 'vendas', pilar: 17, bloco: null, formatoId: null,
      permalink: '', ideia: 'Nota fiscal pelo celular', tema: 'Emitir nota fiscal pelo app',
      roteiro: { hook: 'Nota fiscal pelo celular: pronto', cta: 'Entra na lista de espera pelo link da bio.' },
      carrossel: { capa: { titulo: 'Nota fiscal pelo celular' }, final: { texto: 'Comenta aqui: você já emitiu nota?' } },
      legenda: '',
    },
  ],
};

const REEL_A = { midiaId: '111', tipo: 'REELS', permalink: 'https://www.instagram.com/p/AAA111/', timestamp: '2026-09-18T15:12:25+0000', caption: 'Contratar alguém' };

// ---------- codebook ----------

const TABELA = {
  pilar: ['objetivo', 'planejamento', 'todas', 'manual,cronograma'],
  bloco: ['objetivo', 'planejamento', 'todas', 'manual,cronograma'],
  tipo: ['objetivo', 'planejamento', 'todas', 'manual,cronograma'],
  formato: ['objetivo', 'planejamento', 'reel', 'manual,cronograma,ia'],
  ganchoFamilia: ['gancho', 'peca', 'reel,carrossel', 'manual,ia'],
  ganchoForma: ['gancho', 'peca', 'todas', 'manual,ia'],
  rostoInicio: ['gancho', 'peca', 'reel', 'manual,ia'],
  textoInicio: ['gancho', 'peca', 'reel', 'manual,ia'],
  telaApp: ['qualidade', 'peca', 'todas', 'manual,ia'],
  gatilho: ['qualidade', 'peca', 'todas', 'manual,ia'],
  cta: ['conversao', 'peca', 'todas', 'manual,ia,cronograma'],
  voz: ['qualidade', 'peca', 'reel', 'manual,ia'],
  humor: ['qualidade', 'peca', 'todas', 'manual,ia'],
  audio: ['retencao', 'peca', 'reel', 'manual,ia,calculado'],
  preco: ['conversao', 'peca', 'todas', 'manual,ia'],
  duracaoFaixa: ['retencao', 'peca', 'reel', 'calculado'],
  slidesFaixa: ['retencao', 'peca', 'carrossel', 'calculado'],
  legendaFaixa: ['qualidade', 'peca', 'todas', 'calculado'],
  horario: ['distribuicao', 'peca', 'todas', 'calculado'],
  diaSemana: ['distribuicao', 'peca', 'todas', 'calculado'],
  impulsionado: ['contexto', 'nunca', 'todas', 'manual,calculado'],
  linha: ['contexto', 'nunca', 'todas', 'calculado'],
};
const VALORES = {
  bloco: 'Educação,Afeto,Diferencial,Conversão',
  tipo: 'viralizacao,vendas,conexao,ensino,conselho',
  ganchoFamilia: 'gancho-direto,storytelling,curiosidades,polemicas,motivacao,educativo-rapido,provas,perguntas,identificacao,listas,fator-r,fora-do-banco',
  ganchoForma: 'pergunta,afirmacao,numero,cena,sem-fala',
  cta: 'seguir,salvar,mandar,comentar,lista-de-espera,fora-do-escopo,curtir,sem-cta',
  voz: 'leo,pedro,mauro,institucional,sem-voz,outro',
  audio: 'fala,musica,fala-e-musica,som-sem-fala,sem-audio',
  duracaoFaixa: 'ate-15,16-30,31-45,46-60,mais-60',
  slidesFaixa: '2-3,4-6,7-10',
  legendaFaixa: 'curta,media,longa',
  horario: 'madrugada,manha,tarde,noite',
  diaSemana: 'dom,seg,ter,qua,qui,sex,sab',
  linha: 'v1,anterior',
};
const BOOLS = ['rostoInicio', 'textoInicio', 'telaApp', 'humor', 'preco', 'impulsionado'];

test('codebook: as 22 dimensões da tabela da SPEC, na ordem, com etapa, aplica, peças, fontes e valores', () => {
  assert.deepEqual(DIMENSOES.map((d) => d.id), Object.keys(TABELA));
  for (const d of DIMENSOES) {
    const [etapa, aplica, pecas, fontes] = TABELA[d.id];
    assert.equal(d.etapa, etapa, d.id);
    assert.equal(d.aplica, aplica, d.id);
    assert.deepEqual(d.pecas, pecas === 'todas' ? ['reel', 'carrossel', 'estatico'] : pecas.split(','), d.id);
    assert.deepEqual(d.fontes, fontes.split(','), d.id);
    assert.equal(d.grupo, { planejamento: 'fundamento', peca: 'mecanismo', nunca: 'contexto' }[d.aplica], d.id);
    assert.equal(d.tipo, BOOLS.includes(d.id) ? 'bool' : 'enum', d.id);
    assert.ok(d.nome && !TRACO.test(d.nome), d.id);
    if (VALORES[d.id]) assert.deepEqual(d.valores.map((v) => v.id), VALORES[d.id].split(','), d.id);
    if (d.tipo === 'bool') assert.deepEqual(d.valores.map((v) => v.id), [true, false], d.id);
    for (const v of d.valores) assert.ok(v.nome && !TRACO.test(v.nome), `${d.id}.${v.id}`);
  }
  assert.ok(Object.isFrozen(DIMENSOES) && Object.isFrozen(DIMENSOES[0]) && Object.isFrozen(DIMENSOES[0].pecas));
});

test('codebook: os 24 gatilhos, as famílias de gancho, a escada de CTA e as dicas da IA', () => {
  assert.equal(VALORES_GATILHO.length, 24);
  assert.equal(new Set(VALORES_GATILHO.map((g) => g.id)).size, 24);
  for (const tipo of ['viralizacao', 'vendas', 'conexao']) assert.equal(VALORES_GATILHO.filter((g) => g.tipo === tipo).length, 8);
  assert.ok(VALORES_GATILHO.some((g) => g.id === 'prova-visivel' && g.nome === 'Prova visível na tela do app'));
  assert.equal(dimensao('gatilho').valores, VALORES_GATILHO);
  assert.equal(dimensao('ganchoFamilia').valores, VALORES_GANCHO);
  assert.deepEqual(CTA_POR_TIPO.vendas, ['lista-de-espera', 'fora-do-escopo']);
  assert.deepEqual(CTA_POR_TIPO.viralizacao.slice(0, 3), ['salvar', 'mandar', 'comentar']);
  assert.deepEqual(CTA_POR_TIPO.conexao.slice(0, 3), ['comentar', 'mandar', 'seguir']);
  assert.deepEqual(CTA_POR_TIPO.ensino.slice(0, 3), ['salvar', 'mandar', 'seguir']);
  assert.deepEqual(CTA_POR_TIPO.conselho.slice(0, 2), ['salvar', 'mandar']);
  const ctas = dimensao('cta').valores.map((v) => v.id);
  for (const lista of Object.values(CTA_POR_TIPO)) {
    assert.ok(lista.includes('fora-do-escopo'));
    for (const c of lista) assert.ok(ctas.includes(c), c);
  }
  const familias = VALORES_GANCHO.map((v) => v.id);
  for (const lista of Object.values(GANCHO_POR_TIPO)) for (const f of lista) assert.ok(familias.includes(f), f);
  for (const peca of ['reel', 'carrossel', 'estatico']) {
    for (const d of dimensoesIa(peca)) assert.ok(DICAS_IA[d.id] && !TRACO.test(DICAS_IA[d.id]), d.id);
  }
  assert.deepEqual(dimensoesIa('estatico').map((d) => d.id), ['ganchoForma', 'telaApp', 'gatilho', 'cta', 'humor', 'preco']);
  assert.equal(dimensao('nada'), null);
});

test('codebook(db): pilar e formato vêm do banco; devolve cópia', () => {
  const cb = codebook(db);
  const pilar = cb.find((d) => d.id === 'pilar');
  assert.deepEqual(pilar.valores.map((v) => v.id), ['1', '4', '17']);
  assert.equal(pilar.valores[1].nome, '4 · Dor educativa');
  const formato = cb.find((d) => d.id === 'formato');
  assert.deepEqual(formato.valores, [{ id: 'fmt_1_1', nome: '1.1 · Como corrigir um dado' }, { id: 'fmt_t_1', nome: 'T1 · Teste do app' }]);
  assert.deepEqual(codebook({}).find((d) => d.id === 'pilar').valores, []);
  cb[0].valores.push({ id: 'x', nome: 'x' });
  cb[1].pecas.push('stories');
  assert.deepEqual(DIMENSOES[1].pecas, ['reel', 'carrossel', 'estatico']);
  assert.equal(codebook(db)[0].valores.length, 3);
});

test('validarValor: bool só true/false; enum só id da lista; pilar e formato do banco', () => {
  assert.ok(validarValor('humor', true, db));
  assert.ok(validarValor('humor', false, db));
  assert.ok(!validarValor('humor', 'sim', db));
  assert.ok(!validarValor('humor', null, db));
  assert.ok(validarValor('ganchoForma', 'pergunta', db));
  assert.ok(!validarValor('ganchoForma', 'Pergunta', db));
  assert.ok(!validarValor('ganchoForma', '', db));
  assert.ok(!validarValor('ganchoForma', 1, db));
  assert.ok(validarValor('pilar', '4', db));
  assert.ok(!validarValor('pilar', 4, db));
  assert.ok(!validarValor('pilar', '99', db));
  assert.ok(validarValor('formato', 'fmt_1_1', db));
  assert.ok(!validarValor('formato', 'fmt_1_1', {}));
  assert.ok(validarValor('bloco', 'Educação', db));
  assert.ok(!validarValor('bloco', 'educacao', db));
  assert.ok(validarValor('gatilho', 'orgulho-cnpj', db));
  assert.ok(validarValor(dimensao('cta'), 'lista-de-espera', db));
  assert.ok(!validarValor('inexistente', 'x', db));
  assert.equal(normalizarValor('humor', 'sim'), true);
  assert.equal(normalizarValor('humor', 'Não'), false);
  assert.equal(normalizarValor('pilar', 4), '4');
  assert.equal(normalizarValor('bloco', 'educacao'), 'Educação');
  assert.equal(normalizarValor('ganchoForma', ' pergunta '), 'pergunta');
  assert.equal(normalizarValor('humor', null), null);
});

test('classificarCta pelas palavras da SPEC, na ordem de prioridade', () => {
  const casos = [
    ['Entra na lista de espera pelo link da bio.', 'lista-de-espera'],
    ['O app tá chegando. Link da bio.', 'lista-de-espera'],
    ['Salva esse vídeo pra quando for abrir a sua empresa.', 'salvar'],
    ['Guarda esse post pro dia que você for abrir o seu CNPJ.', 'salvar'],
    ['Manda pra quem é MEI e ainda não sabe disso.', 'mandar'],
    ['Marca aquela pessoa que abriu MEI esse ano.', 'mandar'],
    ['Compartilha nos seus stories.', 'mandar'],
    ['Comenta aqui: qual sigla do governo você nunca entendeu?', 'comentar'],
    ['Conta pra gente: qual dessas você já viveu?', 'comentar'],
    ['Me conta nos comentários: como foi a sua primeira nota?', 'comentar'],
    ['Segue a gente pra ver o resto.', 'seguir'],
    ['Hoje a gente cuida de empresa de serviço, MEI ou ME no Simples. Segue a gente pra acompanhar.', 'fora-do-escopo'],
    ['Salva e manda pra quem precisa ouvir.', 'salvar'],
    ['Se fez sentido, deixa o like.', 'curtir'],
  ];
  for (const [texto, esperado] of casos) assert.equal(classificarCta(texto), esperado, texto);
  assert.equal(classificarCta(''), null);
  assert.equal(classificarCta(null), null);
  assert.equal(classificarCta('Já pagou a sua desse mês?'), null);
});

// ---------- post e peça ----------

test('pecaDaMidia e reelDaMidia (vínculo gravado primeiro, depois o link do mesmo post)', () => {
  assert.equal(pecaDaMidia({ tipo: 'REELS' }), 'reel');
  assert.equal(pecaDaMidia({ tipo: 'FEED', mediaType: 'VIDEO' }), 'reel');
  assert.equal(pecaDaMidia({ tipo: 'FEED', mediaType: 'IMAGE' }), 'estatico');
  assert.equal(pecaDaMidia({ tipo: 'FEED' }), 'estatico');
  assert.equal(pecaDaMidia({ tipo: 'CAROUSEL_ALBUM' }), 'carrossel');
  assert.equal(pecaDaMidia({ mediaType: 'CAROUSEL_ALBUM' }), 'carrossel');
  assert.equal(pecaDaMidia({}), 'reel');
  assert.equal(pecaDaMidia(null), null);

  assert.equal(reelDaMidia(db, REEL_A, null)?.id, 'reel_aaaa1111');
  assert.equal(reelDaMidia(db, { ...REEL_A, permalink: 'https://www.instagram.com/legalizai.app/reel/AAA111/?igsh=x' }, null)?.id, 'reel_aaaa1111');
  assert.equal(reelDaMidia(db, { ...REEL_A, permalink: 'https://www.instagram.com/reel/ZZZ/' }, null), null);
  assert.deepEqual(vinculoDaMidia(db, REEL_A, { reelId: 'reel_bbbb2222', vinculoPor: 'manual' }).reel.id, 'reel_bbbb2222');
  assert.equal(vinculoDaMidia(db, REEL_A, { reelId: 'reel_bbbb2222', vinculoPor: 'manual' }).por, 'manual');
  assert.equal(vinculoDaMidia(db, REEL_A, null).por, 'permalink');
  // vínculo gravado com uma peça que foi apagada: volta pro link
  assert.equal(reelDaMidia(db, REEL_A, { reelId: 'reel_apagada1' })?.id, 'reel_aaaa1111');
  assert.deepEqual(vinculoDaMidia(db, { permalink: '' }, null), { reel: null, por: null });
});

// ---------- tags efetivas ----------

test('tagsEfetivas: o cronograma preenche pilar, bloco, tipo, formato e CTA da peça vinculada', () => {
  const t = tagsEfetivas(db, REEL_A, null);
  assert.deepEqual(t.pilar, { valor: '4', fonte: 'cronograma' });
  assert.deepEqual(t.bloco, { valor: 'Educação', fonte: 'cronograma' });
  assert.deepEqual(t.tipo, { valor: 'ensino', fonte: 'cronograma' });
  assert.deepEqual(t.formato, { valor: 'fmt_1_1', fonte: 'cronograma' });
  assert.deepEqual(t.cta, { valor: 'salvar', fonte: 'cronograma' });
  // sem bloco gravado: o do pilar (17 é Diferencial); a CTA do carrossel publicado vem do slide final
  const car = { midiaId: '222', tipo: 'CAROUSEL_ALBUM', permalink: '', timestamp: '2026-09-20T15:00:00+0000', caption: '' };
  const t2 = tagsEfetivas(db, car, { reelId: 'reel_bbbb2222', vinculoPor: 'manual' });
  assert.equal(t2.bloco.valor, 'Diferencial');
  assert.equal(t2.cta.valor, 'comentar');
  assert.equal(tagsEfetivas(db, { ...car, tipo: 'REELS' }, { reelId: 'reel_bbbb2222' }).cta.valor, 'lista-de-espera');
  // sem vínculo: nada do cronograma
  const solto = tagsEfetivas(db, { ...REEL_A, permalink: '' }, null);
  assert.equal(solto.pilar, undefined);
  assert.equal(solto.cta, undefined);
});

test('tagsEfetivas: manual > cronograma > ia > calculado, e a CTA na ordem da tabela (manual > ia > cronograma)', () => {
  const ia = (valor) => ({ valor, fonte: 'ia', em: '2026-09-30T12:00:00.000Z', evidencias: [{ tipo: 'legenda', tempo: '', texto: 'x' }] });
  const manual = (valor) => ({ valor, fonte: 'manual', em: '2026-09-30T13:00:00.000Z', autor: 'Pedro' });
  let t = tagsEfetivas(db, REEL_A, { tags: { formato: ia('fmt_t_1') } });
  assert.equal(t.formato.fonte, 'cronograma');
  t = tagsEfetivas(db, REEL_A, { tags: { formato: manual('fmt_t_1') } });
  assert.deepEqual(t.formato, { valor: 'fmt_t_1', fonte: 'manual', em: '2026-09-30T13:00:00.000Z', autor: 'Pedro' });
  t = tagsEfetivas(db, REEL_A, { tags: { cta: ia('comentar') } });
  assert.equal(t.cta.valor, 'comentar');
  assert.equal(t.cta.fonte, 'ia');
  assert.equal(t.cta.evidencias.length, 1);
  t = tagsEfetivas(db, REEL_A, { tags: { cta: manual('mandar') } });
  assert.equal(t.cta.fonte, 'manual');
  // áudio: manual > ia > calculado
  const m = { ...REEL_A, audioTipo: 'MUSIC' };
  assert.deepEqual(tagsEfetivas(db, m, null).audio, { valor: 'musica', fonte: 'calculado' });
  assert.equal(tagsEfetivas(db, m, { tags: { audio: ia('fala-e-musica') } }).audio.fonte, 'ia');
  assert.equal(tagsEfetivas(db, m, { tags: { audio: manual('fala') } }).audio.valor, 'fala');
  // valor gravado que saiu do codebook cai pra próxima fonte; a da IA guardada na manual volta
  assert.equal(tagsEfetivas(db, REEL_A, { tags: { pilar: manual('99') } }).pilar.fonte, 'cronograma');
  const guardada = { ...manual('xxx'), ia: { valor: 'pergunta', em: 'e', evidencias: [] } };
  assert.deepEqual(tagsEfetivas(db, REEL_A, { tags: { ganchoForma: guardada } }).ganchoForma, { valor: 'pergunta', fonte: 'ia', em: 'e', evidencias: [] });
  // dimensão que não vale pro tipo de peça some
  const car = { midiaId: '9', tipo: 'CAROUSEL_ALBUM', timestamp: REEL_A.timestamp, caption: '' };
  assert.equal(tagsEfetivas(db, car, { tags: { rostoInicio: manual(true), humor: manual(true) } }).rostoInicio, undefined);
  assert.equal(tagsEfetivas(db, car, { tags: { humor: manual(true) } }).humor.valor, true);
  // impulsionado: o manual (registro.impulsionado) vence o calculado (anúncio ligado)
  assert.deepEqual(tagsEfetivas(db, REEL_A, { impulsionado: false }, { anunciado: true }).impulsionado, { valor: false, fonte: 'manual' });
  assert.deepEqual(tagsEfetivas(db, REEL_A, { impulsionado: null }, { anunciado: true }).impulsionado, { valor: true, fonte: 'calculado' });
  assert.equal(tagsEfetivas(db, REEL_A, null).impulsionado, undefined);
  assert.deepEqual(tagsEfetivas(db, null, null), {});
});

test('tagsEfetivas: dimensões calculadas', () => {
  const calc = (midia, reg = null, extras = {}) => tagsEfetivas({}, { midiaId: '1', tipo: 'REELS', caption: '', ...midia }, reg, extras);
  const dur = (s) => calc({}, { ia: { duracaoS: s } }).duracaoFaixa?.valor;
  assert.equal(dur(15.4), 'ate-15');
  assert.equal(dur(15.6), '16-30');
  assert.equal(dur(30), '16-30');
  assert.equal(dur(45.2), '31-45');
  assert.equal(dur(60), '46-60');
  assert.equal(dur(61), 'mais-60');
  assert.equal(calc({}, null, { analise: { duracao: 38 } }).duracaoFaixa.valor, '31-45');
  assert.equal(calc({}, { ia: { duracaoS: 12 } }, { analise: { duracao: 38 } }).duracaoFaixa.valor, 'ate-15');
  assert.equal(calc({}).duracaoFaixa, undefined);

  const slides = (n) => tagsEfetivas({}, { tipo: 'CAROUSEL_ALBUM', caption: '', nSlides: n }, null).slidesFaixa?.valor;
  assert.equal(slides(2), '2-3');
  assert.equal(slides(4), '4-6');
  assert.equal(slides(7), '7-10');
  assert.equal(slides(10), '7-10');
  assert.equal(slides(11), undefined);
  assert.equal(slides(1), undefined);
  assert.equal(calc({ nSlides: 3 }).slidesFaixa, undefined);

  const leg = (n, ch = 'a') => calc({ caption: ch.repeat(n) }).legendaFaixa.valor;
  assert.equal(leg(0), 'curta');
  assert.equal(leg(300), 'curta');
  assert.equal(leg(301), 'media');
  assert.equal(leg(1000), 'media');
  assert.equal(leg(1001), 'longa');
  assert.equal(leg(300, '😀'), 'curta');

  const hora = (ts) => calc({ timestamp: ts }).horario.valor;
  assert.equal(hora('2026-09-10T02:00:00+0000'), 'noite');
  assert.equal(hora('2026-09-10T08:59:00+0000'), 'madrugada');
  assert.equal(hora('2026-09-10T09:00:00+0000'), 'manha');
  assert.equal(hora('2026-09-10T15:00:00+0000'), 'tarde');
  assert.equal(hora('2026-09-10T21:00:00+0000'), 'noite');
  assert.equal(calc({ timestamp: '2026-09-30T12:00:00+0000' }).diaSemana.valor, 'qua');
  assert.equal(calc({ timestamp: '2026-10-05T01:00:00+0000' }).diaSemana.valor, 'dom');
  assert.equal(calc({}).horario, undefined);

  assert.equal(calc({ timestamp: '2026-09-30T02:59:59+0000' }).linha.valor, 'anterior');
  assert.equal(calc({ timestamp: '2026-09-30T03:00:00+0000' }).linha.valor, 'v1');
  assert.equal(calc({ timestamp: '2026-10-02T12:00:00+0000' }).linha.valor, 'v1');

  const comFala = { analise: { temAudio: true, transcricao: { texto: 'oi', segmentos: [{ inicio: 0, fim: 1, texto: 'oi' }] } } };
  const semFala = { analise: { temAudio: true, transcricao: { texto: '', segmentos: [] }, avisoAudio: 'O áudio não tem fala reconhecível (só música ou som ambiente).' } };
  const falhou = { analise: { temAudio: true, transcricao: { texto: '', segmentos: [] }, avisoAudio: 'A transcrição do áudio falhou; a análise segue só com os quadros e a legenda.' } };
  assert.equal(calc({ audioTipo: 'MUSIC' }).audio.valor, 'musica');
  assert.equal(calc({ audioTipo: 'ORIGINAL_SOUND' }, null, comFala).audio.valor, 'fala');
  assert.equal(calc({ audioTipo: 'ORIGINAL_SOUND' }, null, semFala).audio.valor, 'som-sem-fala');
  assert.equal(calc({ audioTipo: 'ORIGINAL_SOUND' }, null, falhou).audio, undefined);
  assert.equal(calc({ audioTipo: 'ORIGINAL_SOUND' }).audio, undefined);
  assert.equal(calc({}, null, comFala).audio.valor, 'fala');
  assert.equal(calc({ audioTipo: 'MUSIC' }, { ia: { temAudio: false } }).audio.valor, 'sem-audio');
  assert.equal(calc({ audioTipo: 'ORIGINAL_SOUND' }, { ia: { fala: true } }, semFala).audio.valor, 'fala');
  assert.equal(tagsEfetivas({}, { tipo: 'FEED', mediaType: 'IMAGE', audioTipo: 'MUSIC', caption: '' }, null).audio, undefined);

  assert.equal(calc({}, null, { anunciado: false }).impulsionado.valor, false);
});

test('faixas e sinais de áudio soltos', () => {
  assert.equal(faixaDuracao(0), null);
  assert.equal(faixaDuracao(null), null);
  assert.equal(faixaSlides(3.5), null);
  assert.equal(faixaLegenda(null), null);
  assert.equal(faixaHorario(24), null);
  assert.equal(faixaHorario(0), 'madrugada');
  assert.equal(audioCalculado('LICENSED_MUSIC', true, true), 'musica');
  assert.equal(audioCalculado('', null, false), null);
  assert.equal(falaDaEvidencia({ temAudio: false }), false);
  assert.equal(falaDaEvidencia(null), null);
});

// ---------- vínculo sugerido ----------

const dbVinculo = {
  pilares: db.pilares,
  formatos: db.formatos,
  reels: [
    { id: 'reel_peca0001', data: '2026-09-18', peca: 'reel', ideia: 'Contratar funcionário sem burocracia', tema: 'Contratação de funcionário', roteiro: { hook: 'Contratar alguém deveria significar crescimento' }, permalink: '' },
    { id: 'reel_peca0002', data: '2026-09-19', peca: 'reel', peca2: 'carrossel', ideia: 'Nota fiscal pelo celular', tema: 'Emitir nota fiscal pelo app', roteiro: { hook: 'Nota fiscal pelo celular' }, permalink: '' },
    { id: 'reel_peca0003', data: '2026-09-25', peca: 'reel', ideia: 'Guia do mês pronta', tema: 'Guia mensal chegando pronta no app', roteiro: { hook: 'A guia do mês chega pronta' }, permalink: 'https://www.instagram.com/reel/JAFOI/' },
    { id: 'reel_peca0004', data: '2026-09-18', peca: 'estatico', ideia: 'Preço sem letra miúda', tema: 'Preço transparente', permalink: '' },
    { id: 'reel_peca0005', data: '', peca: 'reel', ideia: 'Contratar funcionário sem burocracia', tema: 'Contratação', permalink: '' },
  ],
};
const midia = (id, tipo, dia, caption, extra = {}) => ({ midiaId: id, tipo, timestamp: `${dia}T15:00:00+0000`, caption, permalink: `https://www.instagram.com/reel/C${id}/`, ...extra });

test('pontuarVinculo: data e palavras em comum', () => {
  const r = dbVinculo.reels[0];
  const cheio = pontuarVinculo({ caption: 'Contratar funcionário deveria significar crescimento, sem burocracia. Contratação de alguém.' }, r, 0);
  assert.ok(cheio.score >= 0.95, String(cheio.score));
  assert.ok(cheio.comuns >= 5);
  assert.equal(pontuarVinculo({ caption: 'nada a ver com isso' }, r, 3).score, 0.1);
  // uma palavra em comum é acaso: o texto vale 0
  assert.equal(pontuarVinculo({ caption: 'contratar' }, r, 0).notaTexto, 0);
  // a legenda planejada igual à publicada basta, mesmo com título diferente
  const comLegenda = { ...r, ideia: 'X', tema: 'Y', roteiro: {}, legenda: 'Hoje falamos de papelada, prazo e contador na abertura.' };
  assert.equal(pontuarVinculo({ caption: 'Hoje falamos de papelada, prazo e contador na abertura.' }, comLegenda, 2).notaTexto, 1);
});

test('sugerirVinculos: mesmo tipo, até 3 dias, acima do limiar, sem peça ocupada', () => {
  const legendaA = 'Contratar funcionário deveria significar crescimento, não mais burocracia. Contratação sem sofrimento.';
  const midias = [
    midia('1', 'REELS', '2026-09-18', legendaA),
    midia('2', 'REELS', '2026-09-23', 'Algo sem relação com o calendário de peças.'),
    midia('3', 'CAROUSEL_ALBUM', '2026-09-19', 'Nota fiscal pelo celular: emitir nota fiscal pelo app, pronto.'),
    midia('4', 'REELS', '2026-09-26', 'A guia do mês chega pronta', { permalink: 'https://www.instagram.com/p/JAFOI/' }),
    midia('5', 'REELS', '2026-09-25', 'A guia do mês chega pronta no app, mensal'),
    midia('6', 'REELS', '2026-09-19', 'Nota fiscal pelo celular: emitir nota fiscal pelo app.'),
    midia('7', 'FEED', '2026-09-18', 'Preço transparente, sem letra miúda no preço.', { mediaType: 'IMAGE' }),
    midia('8', 'REELS', '2026-09-18', 'Contratar funcionário sem burocracia: a contratação de alguém.'),
  ];
  const registros = { 7: { reelId: null, vinculoEm: '2026-09-30T10:00:00.000Z', vinculoPor: null } };
  const s = sugerirVinculos(dbVinculo, midias, registros);
  const por = Object.fromEntries(s.map((x) => [x.midiaId, x]));
  // 1 e 8 disputam a peça 1: fica com quem tem a nota maior, e a outra não ganha a mesma peça
  assert.equal(s.filter((x) => x.reelId === 'reel_peca0001').length, 1);
  assert.ok(por[1]?.reelId === 'reel_peca0001' || por[8]?.reelId === 'reel_peca0001');
  // 4 já está ligada à peça 3 pelo link (/p/ e /reel/ do mesmo post): nenhuma sugestão pra 4, e a 5 não ganha a peça 3
  assert.equal(por[4], undefined);
  assert.equal(por[5], undefined);
  // 2 não tem peça a até 3 dias
  assert.equal(por[2], undefined);
  // carrossel 3 só casa com peça que tem carrossel (a 2, reel + carrossel); o reel 6 também pega a 2, no tipo reel
  assert.equal(por[3]?.reelId, 'reel_peca0002');
  assert.equal(por[6]?.reelId, 'reel_peca0002');
  // 7 teve o vínculo solto de propósito: não volta a sugestão
  assert.equal(por[7], undefined);
  for (const x of s) {
    assert.ok(x.score >= LIMIAR_VINCULO);
    assert.deepEqual(Object.keys(x), ['midiaId', 'reelId', 'score', 'motivo']);
    assert.ok(!TRACO.test(x.motivo), x.motivo);
  }
  assert.match(por[3].motivo, /^Publicado no dia da peça, com \d+ palavras em comum/);
  // o mais novo primeiro
  const ts = s.map((x) => midias.find((m) => m.midiaId === x.midiaId).timestamp);
  assert.deepEqual(ts, [...ts].sort().reverse());
});

test('sugerirVinculos: peça ligada a outro post do mesmo tipo fica de fora; de outro tipo, não', () => {
  const m1 = midia('10', 'REELS', '2026-09-19', 'Nota fiscal pelo celular, emitir nota fiscal pelo app');
  const m2 = midia('11', 'CAROUSEL_ALBUM', '2026-09-19', 'Nota fiscal pelo celular: emitir nota fiscal pelo app');
  const m3 = midia('12', 'REELS', '2026-09-20', 'Nota fiscal pelo celular: emitir nota fiscal pelo app');
  const regs = { 10: { reelId: 'reel_peca0002', vinculoPor: 'manual', vinculoEm: '2026-09-30T10:00:00.000Z' } };
  const s = sugerirVinculos(dbVinculo, [m1, m2, m3], regs);
  assert.deepEqual(s.map((x) => [x.midiaId, x.reelId]), [['11', 'reel_peca0002']]);
  // peça com o link de um post que não está no cache também está ocupada (no tipo do link)
  const comLink = { ...dbVinculo, reels: dbVinculo.reels.map((r) => (r.id === 'reel_peca0002' ? { ...r, permalink: 'https://www.instagram.com/reel/OUTRO/' } : r)) };
  assert.deepEqual(sugerirVinculos(comLink, [m2, m3], {}).map((x) => [x.midiaId, x.reelId]), [['11', 'reel_peca0002']]);
  // mesmo dia e só uma palavra em comum: abaixo do limiar
  assert.deepEqual(sugerirVinculos(dbVinculo, [midia('13', 'REELS', '2026-09-18', 'Contratar')], {}), []);
  assert.deepEqual(sugerirVinculos(dbVinculo, [], {}), []);
  assert.deepEqual(sugerirVinculos({}, [m1], null), []);
});

// ---------- arquivo e escrita ----------

test('forma do arquivo e do registro', () => {
  assert.deepEqual(formaArquivo(null), { versao: 1, midias: {} });
  assert.deepEqual(formaArquivo({ versao: 1, midias: [] }), { versao: 1, midias: {} });
  const f = formaArquivo({ midias: { abc: {}, 123: { reelId: 'reel_x', tags: { humor: { valor: true, fonte: 'ia' }, nada: { valor: 1, fonte: 'manual' }, cta: { valor: 'salvar', fonte: 'outra' } }, impulsionado: 'sim' } } });
  assert.deepEqual(Object.keys(f.midias), ['123']);
  const r = f.midias[123];
  assert.equal(r.reelId, null);
  assert.deepEqual(Object.keys(r.tags), ['humor']);
  assert.equal(r.impulsionado, null);
  assert.deepEqual(Object.keys(registroVazio()), ['reelId', 'vinculoPor', 'vinculoEm', 'vinculoAutor', 'tags', 'ia', 'manual', 'impulsionado']);
});

test('tag manual guarda a da IA; apagar a manual devolve a da IA; IA nova não passa por cima da manual', () => {
  const reg = registroVazio();
  aplicarTagsIa(reg, { ganchoForma: { valor: 'pergunta', evidencias: [{ tipo: 'fala', tempo: '0:00', texto: 'Você sabia?' }] } }, ['ganchoForma', 'humor'], 'e1');
  assert.deepEqual(reg.tags.ganchoForma, { valor: 'pergunta', fonte: 'ia', em: 'e1', evidencias: [{ tipo: 'fala', tempo: '0:00', texto: 'Você sabia?' }] });
  aplicarTagManual(reg, 'ganchoForma', 'afirmacao', { autor: 'Pedro', em: 'e2' });
  assert.equal(reg.tags.ganchoForma.fonte, 'manual');
  assert.equal(reg.tags.ganchoForma.autor, 'Pedro');
  assert.equal(reg.tags.ganchoForma.ia.valor, 'pergunta');
  aplicarTagsIa(reg, { ganchoForma: { valor: 'numero', evidencias: [] }, humor: { valor: true, evidencias: [] } }, ['ganchoForma', 'humor'], 'e3');
  assert.equal(reg.tags.ganchoForma.valor, 'afirmacao');
  assert.equal(reg.tags.ganchoForma.ia.valor, 'numero');
  assert.equal(reg.tags.humor.fonte, 'ia');
  // rodada nova sem humor: a etiqueta velha da IA sai
  aplicarTagsIa(reg, {}, ['ganchoForma', 'humor'], 'e4');
  assert.equal(reg.tags.humor, undefined);
  assert.equal(reg.tags.ganchoForma.ia, undefined);
  aplicarTagsIa(reg, { ganchoForma: { valor: 'cena', evidencias: [] } }, ['ganchoForma'], 'e5');
  aplicarTagManual(reg, 'ganchoForma', null, { em: 'e6' });
  assert.deepEqual(reg.tags.ganchoForma, { valor: 'cena', fonte: 'ia', em: 'e5', evidencias: [] });
  // apagar sem manual não mexe; manual sem IA some de vez
  aplicarTagManual(reg, 'ganchoForma', null);
  assert.equal(reg.tags.ganchoForma.fonte, 'ia');
  aplicarTagManual(reg, 'voz', 'pedro', { em: 'e7' });
  aplicarTagManual(reg, 'voz', null);
  assert.equal(reg.tags.voz, undefined);
});

test('inteiroManual: número da tela do app', () => {
  assert.equal(inteiroManual('1.234'), 1234);
  assert.equal(inteiroManual(' 12 '), 12);
  assert.equal(inteiroManual(12), 12);
  assert.equal(inteiroManual(0), 0);
  assert.equal(inteiroManual(''), null);
  assert.equal(inteiroManual(null), null);
  assert.equal(inteiroManual(undefined), null);
  for (const ruim of ['-1', '1,5', 1.5, 'abc', 2e9, -3, '12.34', true]) assert.ok(Number.isNaN(inteiroManual(ruim)), String(ruim));
});

// ---------- etiquetagem com IA ----------

test('dadosParaIa: nenhum número de desempenho vai pro prompt', () => {
  const m = {
    midiaId: '555', tipo: 'REELS', caption: 'Legenda do post', audioTipo: 'MUSIC', timestamp: '2026-09-18T15:12:25+0000',
    views: 98761, reach: 87652, saved: 76543, shares: 65432, likes: 54321, comments: 43219, interacoes: 32198, avgWatchMs: 21987,
    skipRate: 61.73, relativo: 3.71, follows: 19876, profileVisits: 18765, bioLinkClicks: 17654, totalViews: 16543,
  };
  const d = dadosParaIa({ midia: m, peca: 'reel', db, quadros: [{ rotulo: '0:00', arquivo: 'C:/tmp/q/quadro-01.jpg' }], transcricao: ['[0:00 a 0:02] oi'], duracao: 38.44 });
  const txt = JSON.stringify(d);
  for (const k of ['views', 'reach', 'saved', 'shares', 'likes', 'comments', 'interacoes', 'avgWatchMs', 'skipRate', 'relativo', 'follows', 'profileVisits', 'bioLinkClicks', 'totalViews']) {
    assert.ok(!txt.includes(`"${k}"`), k);
    assert.ok(!txt.includes(String(m[k])), `${k}: ${m[k]}`);
  }
  assert.equal(d.post.duracao, '38,4s');
  assert.equal(d.post.audioDaMeta, 'música');
  assert.deepEqual(d.quadros, [{ tempo: '0:00', arquivo: 'C:/tmp/q/quadro-01.jpg' }]);
  assert.deepEqual(d.dimensoes.map((x) => x.id), dimensoesIa('reel').map((x) => x.id));
  assert.deepEqual(d.dimensoes.find((x) => x.id === 'humor').valores.map((v) => v.id), ['sim', 'nao']);
  const img = dadosParaIa({ midia: { ...m, tipo: 'CAROUSEL_ALBUM', nSlides: 3 }, peca: 'carrossel', db, imagens: [{ numero: 1, arquivo: 'a.jpg' }] });
  assert.equal(img.post.slides, 3);
  assert.equal(img.quadros, undefined);
  assert.deepEqual(img.imagens, [{ numero: 1, arquivo: 'a.jpg' }]);
});

test('esquemaIa: enum das dimensões e dos valores; evidência pelo tipo de peça', () => {
  const e = esquemaIa('reel', db);
  const item = e.properties.tags.items;
  assert.deepEqual(item.properties.dimensao.enum, dimensoesIa('reel').map((d) => d.id));
  for (const v of ['sim', 'nao', 'fmt_1_1', 'pergunta', 'orgulho-cnpj', 'lista-de-espera', 'fala-e-musica', 'leo']) assert.ok(item.properties.valor.enum.includes(v), v);
  assert.ok(!item.properties.valor.enum.includes('madrugada'));
  assert.deepEqual(item.properties.evidencias.items.properties.tipo.enum, ['quadro', 'fala', 'legenda']);
  assert.deepEqual(esquemaIa('carrossel', db).properties.tags.items.properties.evidencias.items.properties.tipo.enum, ['imagem', 'legenda']);
  assert.ok(!esquemaIa('estatico', db).properties.tags.items.properties.valor.enum.includes('fmt_1_1'));
});

// o mesmo papel do conferir do analise.mjs, simplificado: quadro pelo rótulo, fala e legenda por trecho literal
function conferirFalso(pontos, { quadros, transcricao, legenda }, contagem) {
  const saida = [];
  for (const p of pontos) {
    const evidencias = (p.evidencias ?? []).filter((e) => (e.tipo === 'quadro' ? quadros.some((q) => q.rotulo === e.tempo)
      : e.tipo === 'fala' ? transcricao.texto.includes(e.texto) : e.tipo === 'legenda' ? legenda.includes(e.texto) : e.tipo === 'metrica'))
      .map((e) => ({ ...e, segundos: 0 }));
    if (evidencias.length) saida.push({ texto: p.texto, evidencias });
    else contagem.descartadas++;
  }
  return saida;
}

test('verificarTagsIa: valor do codebook, evidência conferida, imagem que existe', () => {
  const base = { quadros: [{ rotulo: '0:00', tempo: 0 }], transcricao: { texto: 'Você sabia disso?', segmentos: [] }, legenda: 'Salva esse vídeo', imagens: [] };
  const traco = String.fromCharCode(0x2014);
  const saida = {
    tags: [
      { dimensao: 'rostoInicio', valor: 'sim', evidencias: [{ tipo: 'quadro', tempo: '0:00', texto: `rosto do Pedro ${traco} em destaque` }] },
      { dimensao: 'ganchoForma', valor: 'pergunta', evidencias: [{ tipo: 'fala', tempo: '0:00', texto: 'Você sabia disso?' }] },
      { dimensao: 'ganchoForma', valor: 'numero', evidencias: [{ tipo: 'fala', tempo: '0:00', texto: 'Você sabia disso?' }] },
      { dimensao: 'cta', valor: 'salvar', evidencias: [{ tipo: 'legenda', tempo: '', texto: 'frase que não está na legenda' }] },
      { dimensao: 'humor', valor: 'talvez', evidencias: [{ tipo: 'quadro', tempo: '0:00', texto: 'x' }] },
      { dimensao: 'duracaoFaixa', valor: 'ate-15', evidencias: [{ tipo: 'quadro', tempo: '0:00', texto: 'x' }] },
      { dimensao: 'preco', valor: 'nao', evidencias: [{ tipo: 'metrica', tempo: '', texto: '12 views' }] },
      { dimensao: 'formato', valor: 'fmt_1_1', evidencias: [{ tipo: 'legenda', tempo: '', texto: 'Salva esse vídeo' }] },
    ],
  };
  const r = verificarTagsIa(saida, base, { db, dims: dimensoesIa('reel'), conferir: conferirFalso });
  assert.deepEqual(Object.keys(r.tags).sort(), ['formato', 'ganchoForma', 'rostoInicio']);
  assert.equal(r.tags.rostoInicio.valor, true);
  assert.deepEqual(r.tags.rostoInicio.evidencias, [{ tipo: 'quadro', tempo: '0:00', texto: 'rosto do Pedro, em destaque' }]);
  assert.equal(r.tags.ganchoForma.valor, 'pergunta');
  // cta sem evidência, humor com valor fora do codebook, duração (não é da IA) e preço só com métrica
  assert.equal(r.descartadas, 4);

  const imagens = { quadros: [], transcricao: { texto: '', segmentos: [] }, legenda: 'Oi', imagens: [1, 2, 4] };
  const r2 = verificarTagsIa({
    tags: [
      { dimensao: 'telaApp', valor: 'sim', evidencias: [{ tipo: 'imagem', tempo: '4', texto: 'tela do app' }] },
      { dimensao: 'humor', valor: 'nao', evidencias: [{ tipo: 'imagem', tempo: '3', texto: 'x' }] },
      { dimensao: 'rostoInicio', valor: 'sim', evidencias: [{ tipo: 'imagem', tempo: '1', texto: 'x' }] },
    ],
  }, imagens, { db, dims: dimensoesIa('carrossel'), conferir: conferirFalso });
  assert.deepEqual(r2.tags, { telaApp: { valor: true, evidencias: [{ tipo: 'imagem', tempo: '4', texto: 'tela do app' }] } });
  assert.equal(r2.descartadas, 2);
  assert.deepEqual(verificarTagsIa(null, imagens, { db, dims: [], conferir: conferirFalso }), { tags: {}, descartadas: 0 });
});

test('zero travessão no mecanismos.mjs, no codebook e neste teste', () => {
  for (const f of ['mecanismos.mjs', 'mecanismos-codebook.mjs', 'testes/mecanismos.test.mjs']) {
    assert.ok(!TRACO.test(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')), f);
  }
});
