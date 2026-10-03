// Linha editorial V1 de outubro/2026 (30/09): aplica no cronograma o texto V1 das 13 peças do feed e marca
// os pilares em standby. Lê server/calendario-v1-2026-10.json, exportado da planilha
// dados/legalizai-calendario-outubro-2026-v4-pre-lancamento.xlsx (o arquivo tem esse nome; a linha editorial é a V1).
// Rode com o servidor PARADO:
//   node server/aplicar-calendario-v1.mjs [caminho do JSON] [--simular]
// --simular confere tudo e mostra o que mudaria, sem gravar nada (nem a migração do boot).
// CRONOGRAMA_DATA troca a pasta de dados e CRONOGRAMA_CONTEUDO a dos reel.md (teste numa cópia); com elas,
// PORT é a porta do servidor de teste. Rodar de novo com o mesmo JSON não muda nada.
//
//  0. confere o JSON inteiro antes de escrever: 75 linhas (13 de Feed e 62 de Stories), uma peça de feed
//     por data, cada peça casada pela data com o item calendario "csv:<data>", pilar que existe e bloco que
//     bate com o pilar, a estrutura de cada tipo de peça que o formato da planilha pede, as regras duras de
//     copy (PROIBIDO, FATOS e _memoria/preferencias.md) no texto público e o tamanho das notas. Um problema e
//     nada é gravado
//  1. pilares: 6 e 7 ganham "(standby desde 01/09)" no nome (o banco não tem campo de status de pilar e a
//     tela mostra o nome). 16 e 17 já existem (migração de 24/09): não duplica
//  2. cada peça: título, pilar, pilarTexto, bloco, formato, gatilho e rede da planilha; peça (e segunda peça)
//     do formato quando ele mudou; o texto da peça vira o texto V1 na estrutura do tipo (reel: uma cena por
//     fala com a cena em branco, como o "Usar esta" do outras-ideias.mjs; carrossel: capa, slides e fecho;
//     estático: headline, apoio e CTA, visual em branco) e a legenda, quando a V1 traz uma. Status volta pra
//     Roteiro. Uma ideia nova no Banco de Ideias (ide_v1_<aammdd>) guarda o texto V1 e a ideia de antes
//     volta pro banco, livre (ela guarda o gancho, a narração e a CTA de 28/09)
//  3. notas da peça, nesta ordem: "Revisar antes de gravar (V1, 30/09)", persona principal, horário e
//     "relacionado a" (a tela não tem esses campos), o pilar conferido, cada "Ajuste V1" (o que mudou e por
//     quê) e o registro curto do roteiro anterior (28/09). Notas acima de 2.000 caracteres: nada é gravado
//  4. peça que alguém editou na tela depois da primeira rodada (atualizadoPor diferente deste script) e peça
//     publicada não mudam: saem no resumo
//  5. backup do db.json de antes (só quando algo vai mudar): db.antes-v1.json na primeira vez (nunca
//     regravado), db.antes-v1.ultimo.json a cada rodada. reel.md regravado (reelmd.mjs) nas peças que mudaram
//     e têm reel.md gerado pelo cronograma
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import {
  APP, DATA_DIR, DB_PATH, arquivoDados, carregar, salvar, agora, repontarIdeia, pecasDoTexto, blocoCanonico,
  blocoDoPilar, dataValida, ROTULO_PECA,
} from './db.mjs';
import { lerGuia } from './migrar.mjs';
import { conferirReel, conferirRefs, limparIdeia, ideiaPadrao, roteiroLimpo, MAX_LEGENDA } from './validar.mjs';
import { regravarSeGerado } from './reelmd.mjs';

const AUTOR = 'Linha editorial V1 (aplicar-calendario-v1)';
const JSON_PADRAO = path.join(APP, 'server', 'calendario-v1-2026-10.json');
const ARGS = process.argv.slice(2);
const SIMULAR = ARGS.includes('--simular');
const ARQUIVO = path.resolve(ARGS.find((a) => !a.startsWith('--')) || JSON_PADRAO);
const PORTA_APP = 4317;
const TOTAIS = { Feed: 13, Stories: 62 };
const LIM_NOTAS = 2000;
const DATA_V1 = '30/09';
const ANTERIOR = 'Roteiro anterior, 28/09:';
const STANDBY = { 6: '(standby desde 01/09)', 7: '(standby desde 01/09)' };
const NOTA_IDEIA = 'Linha editorial V1 (planilha de outubro), com os ajustes de regra anotados nas notas da peça.';
const PALAVRAS_POR_SEGUNDO = 2.1;

// travessão e meia-risca (e parentes), montados por código pra nenhum aparecer no fonte
const TRACO = new RegExp(`[${String.fromCharCode(0x2012, 0x2013, 0x2014, 0x2015)}]`);
// regras duras do texto público: as do aplicar-stories.mjs (28/09) e as que a V1 pediu (30/09)
const CONCORRENTE = /\b(contabilizei|agilize|contaj[aá]|facilite|contabilivre|marvee|conta ?azul|nubank)\b/i;
const PROIBIDOS = [
  [CONCORRENTE, 'concorrente citado por nome (regra dura 2, P27)'],
  [/R\$\s*(?:19|79)(?!\d|[.,]\d)|\b(?:a|por)\s+(?:19|79)\s+reais\b|49,90|86,05|81,05|268,51|R\$\s*288(?!\d|[.,]\d)|168,48/i, 'preço ou valor morto ou em conflito na base (F006, F063, F018, F140)'],
  [/\blink (?:na|abaixo)\b/i, 'CTA de clique é "link da bio" (P32)'],
  [/\bLegaliz(?:ai|ei)\b(?!\.app)/, 'grafia da marca é "Legalizaí" (regra dura 10, P28)'],
  [/Legalize Group/i, 'o escritório no vault é "a Legalize" (F148)'],
  [/incondicional|sem letra mi[uú]da|sem asterisco|receber tudo de volta/i, 'promessa proibida (P05, F021, F022)'],
  [/\bs[oó] hoje\b|[uú]ltimas vagas|\bvagas?\b|fundador/i, 'escassez inventada: vaga e condição de fundador não existem (P09, F005)'],
  [/\bbaix[ea] (?:o app )?agora\b|j[aá] dispon[ií]vel|app store|google play|previs[aã]o de chegada/i, 'download, loja ou data de lançamento que não existe (P11, F008)'],
  [/\bsem fidelidade\b|imposto novo|\bao vivo\b/i, 'frase proibida (F023, P31, P25)'],
  [/\bfator\s*r\b|anexo iii/i, 'Fator R e anexo só na peça única de Fator R (P15)'],
  [/\b\d+\s*segundos\b|\b1 toque\b/i, 'tempo ou número sem fato no vault (regra dura 7, P36)'],
  [/sicalc|c[oó]digo de barras|aplicativo do seu banco|\bfa(?:z|zer|[çc]a)\s+(?:isso\s+)?voc[eê]\s+mesmo|\bquem\s+(?:abre|clica|emite)\s+[eé]\s+voc[eê]|\bfecha\s+a\s+aba|\bpasso\s+a\s+passo\s+(?:no|do|pelo|na|da)\s+(?:portal|gov\.?\s?br|emissor)/i, 'ensina a fazer sozinho (regra dura 11, P38)'],
  [/migra\w*\s+autom[aá]tic/i, 'a migração depende do contador atual (F142)'],
  [/1º de novembro|01\/11|a partir de novembro/i, 'data da nota nacional em conflito no vault (F126)'],
  [/sem senha do governo/i, 'afirmação sem fato no vault (regra dura 7)'],
];
const PRECO = (v) => new RegExp(`R\\$\\s*${v}(?!\\d|[.,]\\d)`);
const VALIDADE = /31\/12\/2026|31 de dezembro de 2026/;

const erros = [];
const avisos = [];
const erro = (msg) => erros.push(msg);
const sair = (msg) => {
  console.error(`\nNada foi gravado: ${msg}`);
  process.exit(1);
};
const fmt = (d) => `${String(d).slice(8, 10)}/${String(d).slice(5, 7)}`;
const igual = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const tem = (v) => Boolean(String(v ?? '').trim());
const texto = (v) => String(v ?? '').trim();
const curto = (s, n = 110) => (texto(s).length > n ? `${texto(s).slice(0, n - 1).trimEnd()}…` : texto(s));
const mesmoCaminho = (a, b) => (process.platform === 'win32' ? path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase() : path.resolve(a) === path.resolve(b));
const palavras = (s) => (texto(s).match(/\S+/g) ?? []).length;

function portaOcupada(porta) {
  return new Promise((ok) => {
    const s = net.connect({ host: '127.0.0.1', port: porta });
    s.setTimeout(800);
    s.once('connect', () => { s.destroy(); ok(true); });
    s.once('timeout', () => { s.destroy(); ok(false); });
    s.once('error', () => ok(false));
  });
}

// tempo de cada fala a ~2,1 palavras por segundo; o gancho ocupa pelo menos 0-3s (o mesmo do outras-ideias.mjs)
function tempos(falas) {
  let t = 0;
  return falas.map((f, i) => {
    const dur = Math.max(i === 0 ? 3 : 2, Math.round(palavras(f) / PALAVRAS_POR_SEGUNDO));
    const faixa = `${t}-${t + dur}s`;
    t += dur;
    return faixa;
  });
}

// ---------- 0. leitura e conferência ----------
function lerJson(bruto) {
  let j;
  try {
    j = JSON.parse(bruto.replace(/^﻿/, ''));
  } catch (e) {
    sair(`o JSON não abre: ${e.message}`);
  }
  if (!j || !Array.isArray(j.linhas) || !Array.isArray(j.feed)) sair('o JSON precisa ter "linhas" (a planilha) e "feed" (o texto V1 das peças).');
  return j;
}

// todo texto que vai pro público numa peça
function textosPublicos(e) {
  const ro = e.roteiro ?? {};
  const car = e.carrossel ?? {};
  const est = e.estatico ?? {};
  return [
    ro.hook, ro.textoTela, ...(ro.batidas ?? []), ro.cta, ro.telaCta,
    car.capa?.titulo, car.capa?.texto, ...(car.slides ?? []), car.final?.titulo, car.final?.texto,
    est.headline, est.apoio, est.cta,
    e.legenda,
  ].filter(tem);
}

function regrasDuras(onde, e) {
  const publico = textosPublicos(e);
  for (const t of publico) {
    if (TRACO.test(t)) erro(`${onde}: travessão ou meia-risca em "${curto(t, 90)}" (regra dura 1, P26)`);
    for (const [re, motivo] of PROIBIDOS) {
      const m = t.match(re);
      if (m) erro(`${onde}: ${motivo} ("${m[0]}" em "${curto(t, 90)}")`);
    }
  }
  // preço promocional só com o cheio junto e a validade escrita (F002, F004, F005). Cada estrutura é uma
  // peça que pode sair sozinha (o estático, o carrossel, a legenda): a regra vale em cada uma
  const partes = [
    ['roteiro', [e.roteiro?.hook, ...(e.roteiro?.batidas ?? []), e.roteiro?.cta, e.roteiro?.telaCta]],
    ['carrossel', [e.carrossel?.capa?.titulo, e.carrossel?.capa?.texto, ...(e.carrossel?.slides ?? []), e.carrossel?.final?.titulo, e.carrossel?.final?.texto]],
    ['estático', [e.estatico?.headline, e.estatico?.apoio, e.estatico?.cta]],
    ['legenda', [e.legenda]],
  ];
  for (const [nome, ts] of partes) {
    const junto = ts.filter(tem).join('\n');
    if (PRECO(29).test(junto) && !PRECO(49).test(junto)) erro(`${onde} (${nome}): R$ 29 sem o valor cheio (R$ 49) junto (F002)`);
    if (PRECO(99).test(junto) && !PRECO(139).test(junto)) erro(`${onde} (${nome}): R$ 99 sem o valor cheio (R$ 139) junto (F004)`);
    if ((PRECO(29).test(junto) || PRECO(99).test(junto)) && !VALIDADE.test(junto)) erro(`${onde} (${nome}): preço promocional sem a validade 31/12/2026 (F005)`);
  }
}

// confere as linhas da planilha e devolve as de Feed por data
function conferirLinhas(j, pilaresDoBanco) {
  const cont = { Feed: 0, Stories: 0 };
  const feed = new Map();
  for (const l of j.linhas) {
    const onde = `linha ${l?.linha ?? '?'} da planilha`;
    if (!l || typeof l !== 'object') { erro(`${onde}: precisa ser um objeto.`); continue; }
    if (!dataValida(l.data) || !l.data.startsWith('2026-10')) erro(`${onde}: data "${l.data}" não é um dia de outubro/2026.`);
    if (!(l.tipo in cont)) { erro(`${onde}: tipo "${l.tipo}" não é Feed nem Stories.`); continue; }
    cont[l.tipo]++;
    if (!pilaresDoBanco.some((p) => p.id === l.pilar)) erro(`${onde}: o pilar ${l.pilar} não existe no banco.`);
    const bloco = blocoCanonico(l.bloco);
    if (!bloco) erro(`${onde}: o bloco "${l.bloco}" não é Afeto, Educação, Diferencial ou Conversão.`);
    else if (blocoDoPilar(l.pilar) && bloco !== blocoDoPilar(l.pilar)) erro(`${onde}: o bloco ${bloco} não é o do pilar ${l.pilar} (${blocoDoPilar(l.pilar)}).`);
    for (const k of ['tema', 'formato', 'persona', 'slot', 'copy']) if (!tem(l[k])) erro(`${onde}: "${k}" vazio.`);
    if (l.tipo === 'Feed') {
      if (feed.has(l.data)) erro(`${onde}: ${fmt(l.data)} tem duas linhas de Feed. Uma peça de feed por dia (a peça é casada pela data).`);
      feed.set(l.data, l);
    }
  }
  for (const [tipo, n] of Object.entries(TOTAIS)) if (cont[tipo] !== n) erro(`a planilha tem ${cont[tipo]} linhas de ${tipo}; esperado ${n}.`);
  return feed;
}

// ---------- 2. o texto V1 na estrutura de cada tipo ----------
function estruturas(e, tipos, r) {
  const out = {};
  if (tipos.includes('reel')) {
    const ro = e.roteiro;
    const falas = [ro.hook, ...ro.batidas, ro.cta].filter(tem);
    const faixas = tempos(falas);
    const cenasAntes = (r.roteiro?.cenas ?? []).length > 0;
    out.roteiro = roteiroLimpo({
      hook: ro.hook,
      textoTela: ro.textoTela ?? '',
      desenvolvimento: ro.batidas.join('\n\n'),
      cta: ro.cta,
      cenas: cenasAntes
        ? falas.map((fala, i) => ({
          tempo: faixas[i],
          cena: '',
          fala,
          tela: i === 0 ? ro.textoTela ?? '' : i === falas.length - 1 ? ro.telaCta ?? '' : '',
        }))
        : [],
    });
  }
  if (tipos.includes('carrossel')) {
    const c = e.carrossel;
    out.carrossel = {
      capa: { titulo: c.capa.titulo ?? '', texto: c.capa.texto ?? '', visual: '' },
      slides: c.slides.map((s) => ({ titulo: '', texto: s, visual: '' })),
      final: { titulo: c.final?.titulo ?? '', texto: c.final?.texto ?? '', visual: '' },
    };
  }
  if (tipos.includes('estatico')) {
    const s = e.estatico;
    out.estatico = { headline: s.headline ?? '', apoio: s.apoio ?? '', visual: '', cta: s.cta ?? '' };
  }
  return out;
}

// gancho, narração e CTA da ideia V1 (o roteiroBase do Banco de Ideias)
function roteiroBaseDe(e, tipos) {
  if (e.roteiro && tipos.includes('reel')) {
    return { hook: e.roteiro.hook, textoTela: e.roteiro.textoTela ?? '', narracao: e.roteiro.batidas.join('\n\n'), cta: e.roteiro.cta };
  }
  if (e.carrossel && tipos.includes('carrossel')) {
    const c = e.carrossel;
    return { hook: [c.capa.titulo, c.capa.texto].filter(tem).join(' '), textoTela: '', narracao: c.slides.join('\n\n'), cta: [c.final?.titulo, c.final?.texto].filter(tem).join(' ') };
  }
  const s = e.estatico;
  return { hook: s.headline, textoTela: '', narracao: s.apoio ?? '', cta: s.cta ?? '' };
}

// o que o roteiro de antes dizia, em uma linha (o inteiro fica na ideia de antes e no backup)
function resumoAnterior(r, ideiaAntiga) {
  const tipos = [r.peca || 'reel', r.peca2].filter(Boolean);
  const partes = [];
  const ro = r.roteiro ?? {};
  if (tipos.includes('reel') && tem(ro.hook)) partes.push(`gancho "${curto(ro.hook)}"`, tem(ro.cta) ? `CTA "${curto(ro.cta)}"` : '');
  if (tipos.includes('carrossel') && tem(r.carrossel?.capa?.titulo)) partes.push(`capa do carrossel "${curto(r.carrossel.capa.titulo)}"`);
  if (tipos.includes('estatico') && tem(r.estatico?.headline)) partes.push(`headline do estático "${curto(r.estatico.headline)}"`);
  const onde = ideiaAntiga ? `Gancho, narração e CTA na ideia ${ideiaAntiga} (Banco de Ideias); ` : '';
  return `${ANTERIOR} "${curto(r.ideia, 90)}", ${partes.filter(Boolean).join(', ') || 'sem roteiro'}. ${onde}roteiro inteiro, legenda e notas de 28/09 em data/db.antes-v1.json.`;
}

function notasDaPeca({ e, linha, tipos, legendaAntiga, temGravacao, anterior }) {
  const temReel = tipos.includes('reel');
  const faltas = [temReel ? 'o que aparece em cada cena' : '', tipos.some((t) => t !== 'reel') ? 'o visual' : ''].filter(Boolean);
  const velhos = [legendaAntiga ? 'a legenda' : '', temGravacao ? `os detalhes de ${temReel ? 'gravação' : 'produção'}` : ''].filter(Boolean);
  const revisao = [
    `Revisar antes de ${temReel ? 'gravar' : 'produzir'} (V1, ${DATA_V1}): o texto é o da linha editorial V1 (planilha de outubro), com os ajustes abaixo.`,
    `Falta definir ${faltas.join(' e ')}.`,
    velhos.length ? `${velhos.join(' e ').replace(/^./, (c) => c.toUpperCase())} ainda ${velhos.length > 1 ? 'são' : 'é'} do roteiro anterior.` : '',
  ].filter(Boolean).join(' ');
  const planejamento = `V1 · Persona principal: ${linha.persona} · Horário: ${linha.slot} · Relacionado a: ${tem(linha.relacionado) ? linha.relacionado : 'nada (peça do feed; os stories do dia apontam pra ela)'}`;
  return [revisao, planejamento, `Pilar ${linha.pilar}: ${e.pilar}`, ...e.ajustes, e.notaExtra, anterior].filter(tem).join('\n');
}

function conferirEntrada(e, linha, onde) {
  if (!tem(e.titulo)) erro(`${onde}: sem título.`);
  if (!Array.isArray(e.fontes) || !e.fontes.length) erro(`${onde}: sem fontes (id de fato ou "sem número").`);
  if (!Array.isArray(e.ajustes) || !e.ajustes.length || e.ajustes.some((a) => !String(a).startsWith('Ajuste V1: '))) erro(`${onde}: cada ajuste começa por "Ajuste V1: " (e a peça tem ao menos um registro).`);
  if (!tem(e.pilar)) erro(`${onde}: falta a conferência do pilar.`);
  if (e.legenda != null && typeof e.legenda !== 'string') erro(`${onde}: legenda precisa ser texto ou null.`);
  if (typeof e.legenda === 'string' && e.legenda.length > MAX_LEGENDA) erro(`${onde}: legenda com ${e.legenda.length} caracteres (limite ${MAX_LEGENDA}).`);
  const tipos = [pecasDoTexto(linha.formato).peca, pecasDoTexto(linha.formato).peca2].filter(Boolean);
  if (tipos.includes('stories')) erro(`${onde}: o formato "${linha.formato}" pede stories na peça do feed; os stories da V1 vão pros Stories do dia.`);
  if (tipos.includes('reel') && !(e.roteiro && tem(e.roteiro.hook) && Array.isArray(e.roteiro.batidas) && e.roteiro.batidas.length && tem(e.roteiro.cta))) erro(`${onde}: o formato pede reel e falta o roteiro (hook, batidas e cta).`);
  if (tipos.includes('carrossel') && !(e.carrossel?.capa && tem(e.carrossel.capa.titulo) && Array.isArray(e.carrossel.slides) && e.carrossel.final)) erro(`${onde}: o formato pede carrossel e falta capa, slides ou fecho.`);
  if (tipos.includes('estatico') && !(e.estatico && tem(e.estatico.headline))) erro(`${onde}: o formato pede estático e falta a headline.`);
  if (!tem(e.temaIdeia)) erro(`${onde}: falta o tema da ideia (temaIdeia).`);
  regrasDuras(onde, e);
  return tipos;
}

// ---------- 1 a 4. o plano, aplicado no banco que vier (cru na simulação, o do boot na rodada de verdade) ----------
function aplicar(db, j, feedPorData) {
  const quando = agora();
  const linhasResumo = [];
  const protegidos = [];
  const mudaram = [];
  const cont = { atualizada: 0, igual: 0, protegida: 0 };

  // pilares em standby
  const pilaresMudaram = [];
  for (const [id, marca] of Object.entries(STANDBY)) {
    const p = db.pilares.find((x) => x.id === Number(id));
    if (!p) { avisos.push(`o pilar ${id} não existe no banco: nada a marcar.`); continue; }
    if (!String(p.nome).includes('(standby')) {
      p.nome = `${p.nome} ${marca}`;
      pilaresMudaram.push(`${p.id} · ${p.nome}`);
    }
  }
  const novos = (j.pilares ?? []).filter((p) => !db.pilares.some((x) => x.id === p.id) && /ativo/i.test(p.status));
  for (const p of novos) erro(`o pilar ${p.id} (${p.nome}) é ativo na planilha e não existe no banco.`);

  for (const e of j.feed) {
    const linha = feedPorData.get(e.data);
    const r = db.reels.find((x) => x.calendario === `csv:${e.data}`);
    const pecas = pecasDoTexto(linha.formato);
    const tipos = [pecas.peca, pecas.peca2].filter(Boolean);
    const idIdeia = `ide_v1_${e.data.replaceAll('-', '').slice(2)}`;
    if (r.status === 'publicado') {
      protegidos.push(`  ${fmt(e.data)} (publicada: não muda)`);
      cont.protegida++;
      continue;
    }
    const jaAplicada = r.ideiaId === idIdeia;
    const ideiaV1 = db.ideias.find((i) => i.id === idIdeia) ?? null;

    // o que é de antes: na primeira rodada, a peça como está; nas seguintes, o que ela guardou
    const anterior = jaAplicada
      ? (String(r.notas ?? '').split('\n').find((l) => l.startsWith(ANTERIOR)) ?? '')
      : resumoAnterior(r, r.ideiaId && db.ideias.some((i) => i.id === r.ideiaId) ? r.ideiaId : null);
    const fontesDeAntes = (r.fontes ?? []).filter((f) => !(jaAplicada && ideiaV1?.fontes?.includes(f)));
    const legenda = e.legenda ?? r.legenda ?? '';
    const legendaAntiga = e.legenda == null && tem(r.legenda);
    const g = r.gravacao ?? {};
    const temGravacao = Object.values(g).some((v) => (Array.isArray(v) ? v.length : tem(v)));
    const notas = notasDaPeca({ e, linha, tipos, legendaAntiga, temGravacao, anterior });
    if (notas.length > LIM_NOTAS) {
      erro(`${fmt(e.data)}: as notas ficariam com ${notas.length} caracteres (limite ${LIM_NOTAS}). Encurte os ajustes.`);
      continue;
    }
    const mudaFormato = r.formatoTexto !== linha.formato;
    const bruto = {
      ideia: e.titulo,
      pilar: linha.pilar,
      pilarTexto: linha.pilarTexto,
      bloco: blocoCanonico(linha.bloco),
      formatoTexto: linha.formato,
      gatilho: linha.gatilho,
      rede: linha.rede,
      ...(mudaFormato ? { peca: pecas.peca, peca2: pecas.peca2 } : {}),
      formatoId: tipos.includes('reel') ? r.formatoId ?? null : null,
      status: 'roteiro',
      ...estruturas(e, tipos, r),
      legenda,
      fontes: [...new Set([...e.fontes, ...(e.legenda == null ? fontesDeAntes : [])])],
      notas,
    };
    let campos;
    try {
      campos = conferirReel(bruto, r);
      conferirRefs(db, campos);
    } catch (err) {
      if (!err.status) throw err;
      erro(`${fmt(e.data)}: ${err.message}`);
      continue;
    }
    // conferirReel corta notas em 2.000 sem avisar: aqui nunca chega a cortar (conferido acima)
    campos.ideiaId = idIdeia;

    // a ideia V1 no Banco de Ideias
    let ideiaCampos;
    try {
      ideiaCampos = limparIdeia({
        titulo: e.titulo,
        descricao: linha.tema,
        tipo: r.tipo ?? null,
        tema: e.temaIdeia,
        roteiroBase: roteiroBaseDe(e, tipos),
        fontes: e.fontes,
        notas: NOTA_IDEIA,
      });
    } catch (err) {
      if (!err.status) throw err;
      erro(`${fmt(e.data)}, ideia: ${err.message}`);
      continue;
    }
    const ideiaAlvo = {
      ...ideiaPadrao(),
      ...ideiaCampos,
      formatoId: tipos.includes('reel') && r.formatoId ? r.formatoId : null,
      publico: e.publico ?? 'MEI + ME',
      gancho: ideiaCampos.roteiroBase.hook,
      origem: 'manual',
      reelId: r.id,
    };

    const CAMPOS = Object.keys(campos);
    const pecaMudou = CAMPOS.filter((k) => !igual(r[k], campos[k]));
    const ideiaMudou = !ideiaV1 || Object.keys(ideiaAlvo).some((k) => !igual(ideiaV1[k], ideiaAlvo[k]));
    const resumo = `${fmt(e.data)} · ${r.id} · ${tipos.map((t) => ROTULO_PECA[t]).join(' / ')} · pilar ${linha.pilar}`;
    if (!pecaMudou.length && !ideiaMudou) {
      cont.igual++;
      linhasResumo.push(`  ${resumo} · sem mudança`);
      continue;
    }
    const naTela = jaAplicada && r.atualizadoPor && r.atualizadoPor !== AUTOR;
    const ideiaNaTela = ideiaV1?.atualizadoPor && ideiaV1.atualizadoPor !== AUTOR;
    if (naTela || ideiaNaTela) {
      protegidos.push(`  ${fmt(e.data)} (editada na tela por ${naTela ? r.atualizadoPor : ideiaV1.atualizadoPor}). No JSON mudaria: ${[...pecaMudou, ...(ideiaMudou ? ['ideia V1'] : [])].join(', ')}`);
      cont.protegida++;
      linhasResumo.push(`  ${resumo} · não sobrescrita (editada na tela)`);
      continue;
    }

    // ideia: cria ou atualiza; a de antes volta pro banco
    const antiga = r.ideiaId && r.ideiaId !== idIdeia ? r.ideiaId : null;
    if (!ideiaV1) db.ideias.push({ id: idIdeia, ...ideiaAlvo, criadaEm: quando, criadaPor: AUTOR });
    else if (ideiaMudou) Object.assign(ideiaV1, ideiaAlvo, { atualizadoEm: quando, atualizadoPor: AUTOR });
    Object.assign(r, campos, { atualizadoEm: quando, atualizadoPor: AUTOR });
    if (antiga) repontarIdeia(db, antiga, r.id);
    cont.atualizada++;
    mudaram.push(r);
    linhasResumo.push(`  ${resumo} · ${jaAplicada ? 'atualizada' : 'texto V1'}: ${pecaMudou.join(', ')}${ideiaMudou ? `; ideia ${idIdeia}${ideiaV1 ? ' atualizada' : ' nova'}` : ''}${antiga ? `; ${antiga} volta pro banco` : ''}`);
  }
  return { linhasResumo, protegidos, mudaram, cont, pilaresMudaram };
}

async function main() {
  const dadosReais = mesmoCaminho(DATA_DIR, path.join(APP, 'data'));
  // com o servidor no ar, ele regravaria o banco de memória por cima desta rodada
  const portas = new Set([...(dadosReais ? [PORTA_APP] : []), ...(process.env.PORT ? [Number(process.env.PORT)] : [])]);
  for (const porta of portas) {
    if (await portaOcupada(porta)) sair(`tem um servidor no ar na porta ${porta}. Pare o servidor da Gestão de Marketing antes e rode de novo.`);
  }
  if (!existsSync(ARQUIVO)) sair(`o JSON ${ARQUIVO} não existe.`);
  if (!existsSync(DB_PATH)) sair(`o banco ${DB_PATH} não existe.`);
  console.log(`${SIMULAR ? 'SIMULAÇÃO (nada é gravado)\n' : ''}JSON: ${ARQUIVO}\nDados: ${DATA_DIR}\n`);

  const j = lerJson(await readFile(ARQUIVO, 'utf8'));
  // o banco de antes desta rodada, lido cru: a conferência e o plano não passam pelo boot
  const original = await readFile(DB_PATH);
  let cru;
  try {
    cru = JSON.parse(original.toString('utf8'));
  } catch (e) {
    sair(`o banco não abre: ${e.message}`);
  }
  for (const k of ['reels', 'pilares', 'ideias']) if (!Array.isArray(cru[k])) cru[k] = [];
  await lerGuia(); // os temas do nicho (a ideia V1 é conferida contra eles)

  const feedPorData = conferirLinhas(j, cru.pilares);
  const vistos = new Set();
  for (const e of j.feed) {
    const onde = `peça ${e?.data ? fmt(e.data) : '?'}`;
    if (!e || typeof e !== 'object' || !dataValida(e.data)) { erro(`${onde}: sem data válida.`); continue; }
    if (vistos.has(e.data)) { erro(`${onde}: aparece duas vezes em "feed".`); continue; }
    vistos.add(e.data);
    const linha = feedPorData.get(e.data);
    if (!linha) { erro(`${onde}: não tem linha de Feed nesta data na planilha.`); continue; }
    if (!cru.reels.some((r) => r.calendario === `csv:${e.data}`)) erro(`${onde}: não existe peça do calendário (csv:${e.data}) no cronograma.`);
    conferirEntrada(e, linha, onde);
  }
  for (const d of feedPorData.keys()) if (!vistos.has(d)) erro(`a linha de Feed de ${fmt(d)} não tem texto V1 em "feed".`);
  if (erros.length) sair(`${erros.length} problema(s):\n  - ${erros.join('\n  - ')}`);

  // o plano no banco cru (numa cópia): confere o que só dá pra saber montando (notas, validação da peça)
  let plano = aplicar(structuredClone(cru), j, feedPorData);
  if (erros.length) sair(`${erros.length} problema(s):\n  - ${erros.join('\n  - ')}`);
  const mudouAlgo = plano.cont.atualizada > 0 || plano.pilaresMudaram.length > 0;

  const primeiro = arquivoDados('db.antes-v1.json');
  const arquivos = [];
  if (mudouAlgo && !SIMULAR) {
    const db = await carregar();
    plano = aplicar(db, j, feedPorData);
    if (erros.length) sair(`${erros.length} problema(s) no banco do boot:\n  - ${erros.join('\n  - ')}`);
    if (!existsSync(primeiro)) await writeFile(primeiro, original);
    await writeFile(arquivoDados('db.antes-v1.ultimo.json'), original);
    await salvar();
    for (const r of plano.mudaram) {
      if (!r.origem) continue;
      try {
        const p = await regravarSeGerado(r);
        arquivos.push(p ? `regravado ${r.origem}` : `não regravado ${r.origem} (não foi gerado pelo cronograma)`);
      } catch (e) {
        avisos.push(`reel.md de ${r.id}: ${e.message}`);
      }
    }
  }

  const { linhasResumo, protegidos, cont, pilaresMudaram, mudaram } = plano;
  console.log([
    `== Linha editorial V1, outubro/2026 ${SIMULAR ? '(simulação) ' : ''}==`,
    `Planilha: ${j.linhas.length} linhas (${TOTAIS.Feed} de Feed, ${TOTAIS.Stories} de Stories). Peças do feed: ${j.feed.length}`,
    pilaresMudaram.length ? `Pilares marcados como standby: ${pilaresMudaram.join('; ')}` : 'Pilares: nada a mudar (16 e 17 já existem; 6 e 7 já marcados)',
    ...linhasResumo,
    `Com texto V1 nesta rodada: ${cont.atualizada} · Sem mudança: ${cont.igual} · Não sobrescritas: ${cont.protegida}`,
    ...(protegidos.length ? ['Não sobrescritas (o que precisar mudar, mude na tela):', ...protegidos] : []),
    ...(SIMULAR ? [] : arquivos.length ? ['reel.md:', ...arquivos.map((x) => `  - ${x}`)] : mudaram.length ? ['reel.md: nenhuma peça que mudou tem reel.md'] : []),
    ...(avisos.length ? ['Avisos:', ...avisos.map((x) => `  - ${x}`)] : []),
    !mudouAlgo ? 'Nada mudou: a linha editorial V1 já estava aplicada.'
      : SIMULAR ? 'Simulação: nada foi gravado. Rode sem --simular pra aplicar.'
        : `Pronto. Backup de antes da primeira rodada: ${primeiro}`,
  ].join('\n'));
}

try {
  await main();
  process.exit(0);
} catch (e) {
  console.error(`\nErro: ${e.status ? e.message : e.stack}`);
  process.exit(1);
}
