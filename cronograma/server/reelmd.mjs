// reel.md em marketing/conteudo: o mesmo gerador pro chat (salvar_reel), pro lote
// (POST /api/reels/lote) e pra edição feita na tela. Saiu do agente.mjs em 23/09.
// 24/09: a peça pode ser reel, carrossel, estático ou stories (ou duas delas): o título diz o tipo,
// o cabeçalho ganha Peça e Bloco, e cada tipo tem a sua seção (Roteiro, Carrossel, Estático, Stories).
// O nome da pasta continua reel-<tema>-<data> (é por ele que o app acha o arquivo).
// O importar.mjs lê este arquivo de volta: cabeçalho "- **Rótulo:**", "## Roteiro" em tabela e
// "## Legenda" até o próximo "## ". Tipo, Narração, Gravação e Fontes são gerados; o resto
// (Visual, guarda-corpos, notas do autor) volta intacto a cada regravação.
import { mkdir, writeFile, readFile, copyFile, unlink, readdir, rmdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { carregar, salvar, statusFormato, hoje, semTracos, ROTULO_TIPO, ROTULO_PECA } from './db.mjs';
import { RAIZ } from './importar.mjs';

export const slug = (s) =>
  String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48).replace(/^-+|-+$/g, '');

// formato validado via curadoria sai só como "validado" (reel.md, contexto do agente)
const VIA = { dado: 'pelo nosso dado', benchmark: 'por benchmark' };
export const MARCADOR = '<!-- gerado pelo cronograma';
const CONTEUDO_REAL = path.join(RAIZ, 'marketing', 'conteudo');
// CRONOGRAMA_CONTEUDO (caminho absoluto) só pra teste: junto com CRONOGRAMA_DATA, nada encosta no real
export const CONTEUDO = process.env.CRONOGRAMA_CONTEUDO ? path.resolve(process.env.CRONOGRAMA_CONTEUDO) : CONTEUDO_REAL;
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const dataOk = (d) => (typeof d === 'string' && DATA_ISO.test(d) ? d : '');
export const relRaiz = (p) => path.relative(RAIZ, p).replaceAll('\\', '/');
// reel.origem é sempre "marketing/conteudo/<pasta>/reel.md"; em teste (CRONOGRAMA_CONTEUDO) a mesma
// origem aponta pra pasta de mesmo nome na cópia (pastaDaOrigem)
const origemDe = (alvo) => `marketing/conteudo/${path.basename(path.dirname(alvo))}/reel.md`;

export function rotuloStatus(st) {
  return st?.status === 'validado' ? `validado ${VIA[st.via] ?? ''}`.trim() : 'em teste';
}

// rótulos do cabeçalho que o gerador escreve; o resto (Visual, notas...) é do autor e fica
// (24/09) pilar e os campos do calendário editorial oficial também saem do banco
const ROTULOS_GERADOS = [
  'tipo', 'tema', 'formato', 'campanha', 'ideia de origem', 'gancho', 'cta',
  'pilar', 'rede', 'gatilho / observação', 'candidato a impulsionar', 'notas do calendário', 'peça', 'bloco',
];
// seções geradas: título exato. "## Fontes (auditadas em 01/09)" escrito à mão não é uma delas
const SECOES_GERADAS = {
  narracao: /^narra[cç][aã]o$/i, gravacao: /^(grava[cç][aã]o|produ[cç][aã]o)$/i, fontes: /^fontes$/i,
  carrossel: /^carrossel$/i, estatico: /^est[aá]tico$/i, stories: /^stories$/i,
};

// o que o reel.md atual tem e reelParaMd não gera: volta intacto. Seção com título de seção
// gerada num arquivo escrito à mão fica em `aMao` (reelParaMd só usa se não tiver a própria)
export function extrasDoMd(md) {
  const extras = { cabeca: [], secoes: [], aMao: {} };
  if (!md) return extras;
  const gerado = md.includes(MARCADOR);
  const texto = md.replace(/\r\n/g, '\n').replace(/<!-- gerado pelo cronograma[\s\S]*?-->\n?/g, '');
  const i = texto.search(/^## /m);
  const cabeca = i < 0 ? texto : texto.slice(0, i);
  let pulando = false;
  for (const l of cabeca.split('\n')) {
    if (/^# /.test(l)) continue;
    const m = l.match(/^- \*\*([^*]+?)\*\*/);
    if (m) {
      const rotulo = m[1].replace(/:\s*$/, '').trim().toLowerCase();
      pulando = ROTULOS_GERADOS.some((g) => rotulo === g || rotulo.startsWith(`${g} `) || rotulo.startsWith(`${g}(`));
      if (!pulando) extras.cabeca.push(l);
      continue;
    }
    if (pulando && /^\s+\S/.test(l)) continue; // continuação de um bullet gerado
    pulando = false;
    extras.cabeca.push(l);
  }
  while (extras.cabeca.length && !extras.cabeca[0].trim()) extras.cabeca.shift();
  while (extras.cabeca.length && !extras.cabeca.at(-1).trim()) extras.cabeca.pop();
  if (i >= 0) {
    for (const s of texto.slice(i).split(/^(?=## )/m)) {
      if (!s.startsWith('## ')) continue;
      const titulo = s.split('\n')[0].slice(3).trim();
      if (/^(roteiro|legenda)\b/i.test(titulo)) continue;
      const chave = Object.keys(SECOES_GERADAS).find((k) => SECOES_GERADAS[k].test(titulo));
      if (chave) {
        if (!gerado) extras.aMao[chave] = s.trimEnd();
        continue;
      }
      extras.secoes.push(s.trimEnd());
    }
  }
  return extras;
}

// célula de tabela markdown: sem quebra de linha e sem "|" (o importar.mjs divide por "|")
const celula = (s) => String(s ?? '').replace(/\r?\n+/g, ' ').replace(/\|/g, '/').trim();
const lista = (itens, recuo = '') => itens.map((x) => `${recuo}- ${String(x).replace(/\r?\n+/g, ' ')}`);
const temTexto = (s) => typeof s === 'string' && s.trim() !== '';

// o hook é a fala da primeira cena: o tempo vem dela (nem todo hook cabe em 0-3s)
const tempoHook = (ro) => (temTexto(ro.cenas?.[0]?.tempo) ? ` (${celula(ro.cenas[0].tempo)})` : '');

function secaoNarracao(ro) {
  if (!temTexto(ro.hook) && !temTexto(ro.desenvolvimento) && !temTexto(ro.cta)) return null;
  return [
    '## Narração',
    '',
    `**Hook${tempoHook(ro)}:** "${ro.hook ?? ''}"`,
    ...(temTexto(ro.textoTela) ? ['', `**Texto de tela do hook:** ${ro.textoTela}`] : []),
    '',
    '**Desenvolvimento, palavra por palavra:**',
    '',
    ro.desenvolvimento || 'sem dado',
    '',
    `**CTA final:** "${ro.cta ?? ''}"`,
  ].join('\n');
}

const ROTULOS_GRAVACAO = [
  ['duracao', 'Duração'], ['quem', 'Quem aparece'], ['local', 'Local'], ['enquadramento', 'Enquadramento'],
  ['luz', 'Luz'], ['audio', 'Áudio'], ['figurino', 'Figurino'], ['objetos', 'Objetos'], ['broll', 'B-roll (gravar separado)'],
  ['telasApp', 'Telas do app'], ['edicao', 'Edição'], ['checklist', 'Checklist antes de gravar'],
];

// peça sem reel (carrossel, estático, stories): os mesmos campos viram detalhes de produção
const ROTULOS_PRODUCAO = { duracao: 'Tamanho', edicao: 'Arte e edição', checklist: 'Checklist antes de produzir' };
function secaoGravacao(g, temReel = true) {
  if (!g || typeof g !== 'object') return null;
  const linhas = [];
  for (const [k, rotuloReel] of ROTULOS_GRAVACAO) {
    const rotulo = temReel ? rotuloReel : ROTULOS_PRODUCAO[k] ?? rotuloReel;
    const v = g[k];
    if (Array.isArray(v)) {
      const itens = v.filter(temTexto);
      if (!itens.length) continue;
      linhas.push(`- **${rotulo}:**`, ...(k === 'checklist' ? itens.map((x) => `  - [ ] ${x}`) : lista(itens, '  ')));
    } else if (temTexto(v)) linhas.push(`- **${rotulo}:** ${v.replace(/\r?\n+/g, ' ')}`);
  }
  return linhas.length ? [temReel ? '## Gravação' : '## Produção', '', ...linhas].join('\n') : null;
}

// tipos da peça, na ordem (principal primeiro). Peça sem tipo gravado é reel
export const tiposDaPeca = (reel) => [...new Set([reel.peca || 'reel', reel.peca2].filter((t) => ROTULO_PECA[t]))];
export const rotuloPeca = (reel) => tiposDaPeca(reel).map((t) => ROTULO_PECA[t]).join(' / ');
// gancho e CTA da peça: do roteiro no reel, da capa e do slide final no carrossel, da arte no estático
// com reel na peça, gancho e CTA vêm dele; senão, na ordem dos tipos
const ordemTexto = (x) => { const ts = tiposDaPeca(x); return ts.includes('reel') ? ['reel', ...ts.filter((t) => t !== 'reel')] : ts; };
export function ganchoDaPeca(reel) {
  for (const t of ordemTexto(reel)) {
    const v = { reel: reel.roteiro?.hook, carrossel: reel.carrossel?.capa?.titulo, estatico: reel.estatico?.headline, stories: reel.stories?.quadros?.[0]?.texto }[t];
    if (temTexto(v)) return v.trim();
  }
  return '';
}
export function ctaDaPeca(reel) {
  for (const t of ordemTexto(reel)) {
    const v = { reel: reel.roteiro?.cta, carrossel: reel.carrossel?.final?.texto, estatico: reel.estatico?.cta }[t];
    if (temTexto(v)) return v.trim();
  }
  return '';
}

const slideTem = (x) => ['titulo', 'texto', 'visual'].some((k) => temTexto(x?.[k]));
function secaoCarrossel(c) {
  if (!c) return null;
  const slides = [
    ...(slideTem(c.capa) ? [['Capa', c.capa]] : []),
    ...(c.slides ?? []).filter(slideTem).map((x) => ['', x]),
    ...(slideTem(c.final) ? [['CTA', c.final]] : []),
  ];
  if (!slides.length) return null;
  return [
    '## Carrossel',
    '',
    '| Slide | Título | Texto | Visual |',
    '|---|---|---|---|',
    ...slides.map(([nome, x], i) => `| ${i + 1}${nome ? ` · ${nome}` : ''} | ${celula(x.titulo)} | ${celula(x.texto)} | ${celula(x.visual)} |`),
  ].join('\n');
}

function secaoEstatico(e) {
  const campos = [['headline', 'Headline'], ['apoio', 'Texto de apoio'], ['cta', 'CTA'], ['visual', 'Visual']].filter(([k]) => temTexto(e?.[k]));
  if (!campos.length) return null;
  return ['## Estático', '', ...campos.map(([k, r]) => `- **${r}:** ${umaLinha(e[k])}`)].join('\n');
}

function secaoStories(s) {
  const quadros = (s?.quadros ?? []).filter((q) => temTexto(q.texto) || temTexto(q.visual) || temTexto(q.interacao));
  if (!quadros.length) return null;
  return [
    '## Stories',
    '',
    '| Quadro | Texto | Visual | Interação |',
    '|---|---|---|---|',
    ...quadros.map((q, i) => `| ${i + 1} | ${celula(q.texto)} | ${celula(q.visual)} | ${celula(q.interacao)} |`),
  ].join('\n');
}

// linha do cabeçalho numa linha só (o importar.mjs lê "- **Rótulo:** valor" até o fim da linha)
const umaLinha = (s) => String(s ?? '').replace(/\r?\n+/g, ' ').trim();

// pilar: o texto do calendário (quando veio de lá) ou "N · nome" do pilar cadastrado
export function reelParaMd(reel, formato, st, campanha, ideia, extras = { cabeca: [], secoes: [], aMao: {} }, pilar = null) {
  const ro = reel.roteiro ?? {};
  const aMao = extras.aMao ?? {};
  const tipos = tiposDaPeca(reel);
  const temReel = tipos.includes('reel');
  const rotuloPilar = umaLinha(reel.pilarTexto) || (pilar ? `${pilar.id} · ${pilar.nome}` : '');
  const calendario = [
    ...(rotuloPilar ? [`- **Pilar:** ${rotuloPilar}`] : []),
    ...(temTexto(reel.bloco) ? [`- **Bloco:** ${umaLinha(reel.bloco)}`] : []),
    ...(temTexto(reel.formatoTexto) ? [`- **Formato no calendário:** ${umaLinha(reel.formatoTexto)}`] : []),
    ...(temTexto(reel.rede) ? [`- **Rede:** ${umaLinha(reel.rede)}`] : []),
    ...(temTexto(reel.gatilho) ? [`- **Gatilho / observação:** ${umaLinha(reel.gatilho)}`] : []),
    ...(reel.impulsionar ? [`- **Candidato a impulsionar:** ${reel.impulsionar}`] : []),
    ...(temTexto(reel.notas) ? [`- **Notas do calendário:** ${umaLinha(reel.notas)}`] : []),
  ];
  const cabeca = [
    `# ${rotuloPeca(reel)} · ${reel.ideia} · ${reel.data || 'sem data'}`,
    '',
    `- **Peça:** ${rotuloPeca(reel)}`,
    ...(ROTULO_TIPO[reel.tipo] ? [`- **Tipo:** ${ROTULO_TIPO[reel.tipo]}`] : []),
    `- **Tema:** ${reel.tema || 'sem dado'}`,
    `- **Formato:** ${formato ? `${formato.codigo ? `${formato.codigo} · ` : ''}${formato.nome} (${rotuloStatus(st)})` : 'livre'}`,
    `- **Campanha:** ${campanha?.nome ?? 'sem dado'}`,
    ...calendario,
    ...(ideia ? [`- **Ideia de origem:** ${ideia.titulo}`] : []),
    `- **Gancho:** "${ganchoDaPeca(reel)}"`,
    `- **CTA:** ${ctaDaPeca(reel)}`,
  ].map(semTracos).join('\n');
  const fontes = (reel.fontes ?? []).filter(temTexto);
  // uma seção por tipo, na ordem da peça. Roteiro também sai em peça sem reel que ainda tem cenas
  const roteiro = () => [
    ['## Roteiro', '', '| Tempo | Cena / visual | Fala | Texto de tela |', '|---|---|---|---|',
      ...(ro.cenas ?? []).map((c) => `| ${celula(c.tempo)} | ${celula(c.cena)} | ${celula(c.fala)} | ${celula(c.tela)} |`)].join('\n'),
    secaoNarracao(ro) ?? aMao.narracao,
  ];
  const porTipo = {
    reel: roteiro,
    carrossel: () => [secaoCarrossel(reel.carrossel) ?? aMao.carrossel],
    estatico: () => [secaoEstatico(reel.estatico) ?? aMao.estatico],
    stories: () => [secaoStories(reel.stories) ?? aMao.stories],
  };
  const secoesPeca = [...tipos.flatMap((t) => porTipo[t]()), ...(!temReel && ro.cenas?.length ? roteiro() : [])];
  const corpo = [
    ...[...secoesPeca, secaoGravacao(reel.gravacao, temReel) ?? aMao.gravacao].filter(Boolean).flatMap((x) => [x, '']),
    '## Legenda',
    '',
    reel.legenda ?? '',
    '',
    ...(fontes.length ? [['## Fontes', '', ...lista(fontes)].join('\n'), ''] : aMao.fontes ? [aMao.fontes, ''] : []),
  ].join('\n').split('\n').map(semTracos).join('\n').trimEnd();
  // o que o autor escreveu à mão entra como estava (depois da Legenda: o importar.mjs lê a
  // legenda até o próximo "## ", então ela continua saindo certa)
  return [
    cabeca,
    ...(extras.cabeca.length ? [extras.cabeca.join('\n')] : []),
    '',
    corpo,
    '',
    ...extras.secoes.flatMap((s) => [s, '']),
    `${MARCADOR} em ${new Date().toISOString()} · id ${reel.id} -->`,
    '',
  ].join('\n');
}

// origem só vale se for marketing/conteudo/reel-*/reel.md (nada de ../ nem pasta de fora)
export function pastaDaOrigem(origem) {
  if (typeof origem !== 'string' || !origem) return null;
  const alvo = path.resolve(RAIZ, origem);
  const pasta = path.dirname(alvo);
  if (path.basename(alvo) !== 'reel.md' || !path.basename(pasta).startsWith('reel-')) return null;
  if (path.dirname(pasta) === CONTEUDO) return pasta;
  return path.dirname(pasta) === CONTEUDO_REAL ? path.join(CONTEUDO, path.basename(pasta)) : null;
}

// grava o reel.md do reel e devolve a pasta. montar(extras) monta o conteúdo.
// adiar: pasta nova só marca reel.origem no banco em memória (quem chamou salva uma vez no fim)
export async function gravarReelMd(reel, montar, { adiar = false } = {}) {
  const db = await carregar();
  const pasta = pastaDaOrigem(reel.origem);
  if (pasta) {
    const alvo = path.join(pasta, 'reel.md');
    const antigo = await readFile(alvo, 'utf8').catch(() => null);
    // arquivo que outro reel já escreveu por cima (colisão antiga de nome): este vai pra pasta nova
    const dono = antigo?.match(/· id (reel_[\w-]+) -->/)?.[1];
    const deOutro = dono && dono !== reel.id && db.reels.some((r) => r.id === dono && r.origem === reel.origem);
    if (!deOutro) {
      // reel.md escrito à mão (reel importado): o original fica em reel.original.md, uma vez só
      // (COPYFILE_EXCL: salvar de novo nunca troca o backup por uma versão já regravada)
      if (antigo != null && !antigo.includes(MARCADOR)) {
        await copyFile(alvo, path.join(pasta, 'reel.original.md'), constants.COPYFILE_EXCL).catch((e) => {
          if (e.code !== 'EEXIST') throw e;
        });
      }
      await mkdir(pasta, { recursive: true });
      await writeFile(alvo, montar(extrasDoMd(antigo)), 'utf8');
      return pasta;
    }
  }
  // pasta nova. O sufixo -2, -3 vai ANTES da data (o importar.mjs lê a data no fim do nome),
  // e o arquivo é criado com 'wx': nunca pisa no reel.md de outro reel, nem de um escrito à mão
  const base = slug(reel.ideia) || 'reel';
  const dia = dataOk(reel.data) || dataOk(String(reel.criadoEm ?? '').slice(0, 10)) || hoje();
  const usados = new Set(db.reels.filter((r) => r.id !== reel.id && r.origem).map((r) => r.origem));
  const conteudo = montar({ cabeca: [], secoes: [], aMao: {} });
  for (let n = 1; n <= 200; n++) {
    const nova = path.join(CONTEUDO, `reel-${base}${n > 1 ? `-${n}` : ''}-${dia}`);
    const alvo = path.join(nova, 'reel.md');
    if (usados.has(origemDe(alvo)) || usados.has(relRaiz(alvo))) continue;
    await mkdir(nova, { recursive: true });
    try {
      await writeFile(alvo, conteudo, { encoding: 'utf8', flag: 'wx' });
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      // só reaproveita se o arquivo é deste mesmo reel (salvo antes sem gravar a origem)
      if (!(await readFile(alvo, 'utf8')).includes(`· id ${reel.id} -->`)) continue;
      await writeFile(alvo, conteudo, 'utf8');
    }
    // origem é estado do arquivo, não edição do texto: sem atualizadoEm
    const doBanco = db.reels.find((r) => r.id === reel.id);
    if (doBanco) doBanco.origem = origemDe(alvo);
    reel.origem = origemDe(alvo);
    if (!adiar) await salvar();
    return nova;
  }
  throw new Error('Não achei uma pasta livre pra este reel em marketing/conteudo.');
}

// monta com o que o banco sabe do reel (formato, status do formato, campanha, ideia de origem)
export async function escreverReelMd(reel, opcoes) {
  const db = await carregar();
  const formato = reel.formatoId ? db.formatos.find((f) => f.id === reel.formatoId) : null;
  const st = formato ? statusFormato(formato, db.cases) : null;
  const campanha = db.campanhas.find((c) => c.id === reel.campanhaId) ?? null;
  const ideia = reel.ideiaId ? db.ideias.find((i) => i.id === reel.ideiaId) : null;
  const pilar = reel.pilar != null ? (db.pilares ?? []).find((p) => p.id === Number(reel.pilar)) ?? null : null;
  return gravarReelMd(reel, (extras) => reelParaMd(reel, formato, st, campanha, ideia, extras, pilar), opcoes);
}

// edição feita na tela: só regrava o reel.md que o próprio cronograma escreveu (o escrito à mão
// continua sendo do autor até o reel passar pelo chat). Devolve a pasta ou null
export async function regravarSeGerado(reel) {
  const pasta = pastaDaOrigem(reel.origem);
  if (!pasta) return null;
  const atual = await readFile(path.join(pasta, 'reel.md'), 'utf8').catch(() => null);
  if (!atual?.includes(MARCADOR) || !atual.includes(`· id ${reel.id} -->`)) return null;
  return escreverReelMd(reel);
}

// reel que saiu do cronograma: apaga o reel.md que o próprio cronograma gerou pra ELE (marcador + id).
// A pasta só some se ficar vazia (reel.original.md, imagens e afins ficam). Escrito à mão, de outro
// reel ou já apagado: não mexe. Devolve { apagado, pasta, motivo?, sobrou? }
export async function apagarReelMdGerado(reel) {
  const pasta = pastaDaOrigem(reel.origem);
  if (!pasta) return { apagado: false, pasta: null, motivo: 'sem pasta de origem em marketing/conteudo' };
  const alvo = path.join(pasta, 'reel.md');
  const atual = await readFile(alvo, 'utf8').catch(() => null);
  if (atual == null) return { apagado: false, pasta, motivo: 'reel.md já não existe' };
  if (!atual.includes(MARCADOR) || !atual.includes(`· id ${reel.id} -->`)) return { apagado: false, pasta, motivo: 'reel.md não foi gerado pelo cronograma pra este reel' };
  await unlink(alvo);
  const sobrou = await readdir(pasta).catch(() => []);
  if (!sobrou.length) await rmdir(pasta);
  return { apagado: true, pasta, sobrou };
}
