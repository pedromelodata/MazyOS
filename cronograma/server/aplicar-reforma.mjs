// Reforma de 28/09/2026 (Pedro): ganchos do banco de 1000, CTAs do banco de CTAs, o construtor de reels curtos
// (gancho, narração, CTA) e a checklist de 100 takes de b-roll, fundidos na skill reels-leo e aplicados em cada
// peça do cronograma de 28/09 a 30/10, com a ideia do Banco de Ideias que produz cada uma. Título e gancho no
// jeito que a pessoa fala, pouca coisa na tela, tudo fechando no app (P38), fato só da base (FATOS.md, USAR).
// O conteúdo está em server/conteudo-reforma-2026-10.json. Rode com o servidor PARADO:
//   node server/aplicar-reforma.mjs [caminho do JSON] [--simular] [--sobrescrever-editadas]
// --simular confere tudo e mostra o que mudaria, sem gravar nada.
// --sobrescrever-editadas aplica também nas peças que alguém editou na tela depois que a reforma foi escrita
// (sem ele, essas ficam como estão e saem no resumo).
// CRONOGRAMA_DATA troca a pasta de dados e CRONOGRAMA_CONTEUDO a dos reel.md (teste numa cópia: os dois juntos).
// Rodar de novo com o mesmo JSON não muda nada.
//
// Mesmo padrão do aplicar-ideias-cronograma.mjs, com estas diferenças:
//  - o título da peça (campo "ideia") muda: é o título no jeito que a pessoa fala
//  - peça da planilha de outubro (calendario "csv:..." ou data a partir de 01/10) NUNCA muda campo de
//    planejamento (data, tema, pilar, pilarTexto, bloco, tipo, peça, formato, rede, gatilho, impulsionar,
//    status, link, campanha). JSON que tenta é recusado; depois de aplicar, o script confere campo a campo
//  - peça de setembro fora da planilha pode trocar o planejamento (a pauta de 29/09 saiu do pilar 6, em standby)
//  - notas da peça e da ideia são substituídas (a reforma reescreve a peça inteira; o antigo fica no backup)
//  - peça já gravada, editada ou publicada, e peça ou ideia que alguém editou na tela depois de "escritoContra"
//    (a hora do banco contra o qual a reforma foi escrita), ficam como estão, com aviso
//
//  0. porta: na pasta de dados de verdade (ou com PORT), servidor respondendo na 4317 (ou PORT) para tudo
//  1. JSON inteiro antes de abrir o banco: travessão ou meia-risca em qualquer lugar; preço morto (R$ 19,
//     R$ 79, R$ 49,90 e os valores em conflito) em qualquer lugar, até nas notas; no texto publicado:
//     concorrente, grafia, "link na", promessa proibida, escassez, loja, "faça sozinho" (P38), id de fato
//     (P33), barrinha, R$ que nenhum fato USAR traz; preço promocional só com o cheio, a validade 31/12/2026 e
//     a fidelidade juntos; fontes e ledger só com id USAR em FATOS.md; campos que o script não grava
//  2. banco: cada peça existe, na data do JSON; a ideia existe e não é de outra peça fora do JSON; campos
//     validados pelo validar.mjs (conferirReel, roteiroLimpo, limparIdeia, conferirRefs) sem corte de texto
//  3. ligação: item.ideiaId = ideia e ideia.reelId = item; a ideia que era da peça e não é mais volta livre
//     (repontarIdeia). Tipo da ideia = tipo da peça; pilar em standby (6, 7, 14, 15) não entra
//  4. travas depois de aplicar em memória: planejamento das peças da planilha idêntico; peças, ideias e o resto
//     do banco fora do JSON idênticos; peça e ideia apontando uma pra outra. Qualquer falha: nada é gravado
//  5. backup do db.json de antes da rodada (só quando algo muda): db.antes-reforma.json na primeira vez (nunca
//     regravado) e db.antes-reforma.ultimo.json a cada rodada; atualizadoEm só em quem mudou; salva uma vez;
//     regrava o reel.md (regravarSeGerado) das peças que mudaram
//  6. resumo
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { APP, DATA_DIR, DB_PATH, arquivoDados, carregar, salvar, repontarIdeia, agora, ROTULO_PECA } from './db.mjs';
import { conferirReel, conferirRefs, limparIdeia, roteiroLimpo, MAX_LEGENDA } from './validar.mjs';
import { regravarSeGerado, CONTEUDO } from './reelmd.mjs';

const AUTOR = 'Reforma das skills (28/09)';
const JSON_PADRAO = path.join(APP, 'server', 'conteudo-reforma-2026-10.json');
const ARGS = process.argv.slice(2);
const SIMULAR = ARGS.includes('--simular');
const SOBRESCREVER_EDITADAS = ARGS.includes('--sobrescrever-editadas');
const ARQUIVO = path.resolve(ARGS.find((a) => !a.startsWith('--')) || JSON_PADRAO);
const PORTA_APP = 4317;
const FATOS_MD = path.join(APP, '..', '_base-contabil', 'FATOS.md');
const PRIMEIRO_DIA_PLANILHA = '2026-10-01';

// ---------- regras duras de texto ----------
// travessão, meia-risca e parentes, montados por código pra nenhum aparecer no fonte
const TRACO = new RegExp(`[${String.fromCharCode(0x2012, 0x2013, 0x2014, 0x2015, 0x2212)}]`);
const BARRINHA = /(^|\s)-(\s|$)/m; // hífen solto (lista ou régua), lê como travessão
// preço morto ou em conflito na base (FATOS F006, F063, F018, F140; ADR L103): trava o JSON inteiro
const MORTOS = [
  [/R\$\s*(?:19|79)(?![\d.,])/i, 'R$ 19 ou R$ 79 (F006, preço antigo morreu)'],
  [/\b(?:19|79)\s+reais\b/i, '19 ou 79 reais (F006)'],
  [/\b(?:a|por)\s+(?:19|79)\s+reais\b/i, 'preço 19 ou 79 (F006)'],
  [/49,90/, 'R$ 49,90 (morto)'],
  [/86,05|81,05/, 'valor da guia do MEI em conflito (F063)'],
  [/178,31/, 'conta nova com número novo (P13)'],
  [/168,48|268,51|R\$\s*288(?![\d.,])/, 'valor superado ou em conflito (F018, F140)'],
];
// o que não pode sair em texto de peça (fala, direção de cena, tela, legenda, slide, quadro, roteiro base)
const PROIBIDOS = [
  [/\b(contabilizei|agilize|contaj[aá]|facilite|contabilivre|marvee|conta ?azul|nubank)\b/i, 'concorrente citado por nome (P27)'],
  [/\blink (?:na|abaixo)\b/i, 'CTA de clique é "link da bio" (P32)'],
  [/\bLegaliz(?:ai|ei)\b(?![.\w])/, 'grafia da marca é "Legalizaí" (P28)'],
  [/incondicional|sem letra mi[uú]da|sem asterisco|receber tudo de volta/i, 'promessa proibida ("incondicional", "sem letra miúda", "tudo de volta" sem a condição)'],
  [/\bs[oó] hoje\b|[uú]ltimas vagas|vagas? de fundador/i, 'escassez inventada (P09)'],
  [/\bbaix[ea] (?:o app )?agora\b|j[aá] dispon[ií]vel|app store|google play|play store/i, 'download ou loja que não existe (P11)'],
  [/\bsem fidelidade\b|imposto novo|\bao vivo\b/i, 'frase proibida (F023, P31, P25)'],
];
// só no texto que vai pro público (a direção de cena e as notas citam o que evitar)
const PUBLICO = [
  [/gr[aá]tis/i, '"grátis" (P10)'],
  [/qualquer cidade/i, 'MEI fora de BH está em conflito (F027)'],
  [/\bgarantid[oa]s?\b|zero multa/i, 'promessa de resultado (P02, P03)'],
  [/economi[az]|pag(?:ar|ue) menos/i, 'economia de imposto (P04)'],
  [/6\s?% fixo/i, '"6% fixo" (P14)'],
  [/(?:cnpj|empresa|abertura|abrir|abre|sai|pronto|bloquead)[^.]{0,25}\bna hora\b|\bem \d+ ?(?:h|horas?|dias?|minutos?)\b|cnpj pronto/i, 'prazo de abertura (P01)'],
  [/simulador|simule/i, 'simulador de Fator R não é link da base (F009)'],
  [/\bF\d{3}\b|\bP\d{2}\b/, 'id de fato ou de proibição no texto publicado (P33)'],
];
// P38: os jeitos de mandar a pessoa fazer sozinha, no portal, no emissor, no gov.br ou "de graça"
const FAZ_SOZINHO = [
  [/quem (?:abre|clica) (?:é|e) (?:você|vc|o titular)/i, '"quem abre é você"'],
  [/fecha a aba/i, '"fecha a aba"'],
  [/fa(?:z|ça|zer) (?:você|vc) mesm[oa]/i, '"faz você mesmo"'],
  [/(?<![\p{L}\d])(?:é|e|sai|fica) (?:de gra[cç]a|gratuit[oa])|(?<![\p{L}\d])mei(?![\p{L}\d])[^.]{0,30}(?:de gra[cç]a|gratuit)/iu, 'abertura do MEI "de graça" como caminho'],
  [/portal do empreendedor|formalize-se/i, 'Portal do Empreendedor'],
  [/primeiro acesso/i, 'primeiro acesso no emissor do governo'],
  [/canal oficial|caminho oficial|caminho formal/i, '"canal oficial" ou "caminho oficial" como caminho'],
  [/\bpasso (?:um|dois|tr[eê]s)\b/i, 'passo a passo de órgão ("passo um")'],
  [/passo a passo[^.]{0,40}(?:portal|emissor|gov\.?br|receita|prefeitura|junta|conselho)|(?:portal|emissor|gov\.?br|receita|prefeitura|junta|troca)[^.]{0,40}passo a passo/i, 'passo a passo em órgão'],
  [/\bentra (?:com|no|na|pelo|pela) [^.]{0,30}(?:gov\.?br|emissor|portal|site|e-?cac)/i, '"entra no" sistema do governo'],
  [/\bacess(?:a|e|ar) o (?:site|portal|emissor|gov)/i, '"acessa o site"'],
  [/no gov\.?br voc[eê]/i, '"no gov.br você"'],
  [/login (?:do |no )?gov\.?br|usuário e senha/i, 'login no gov.br ou "usuário e senha"'],
  [/\bemite (?:lá|no emissor)|no emissor nacional, com/i, 'emitir no emissor do governo'],
  [/porta certa/i, '"a porta certa" fora do app'],
  [/depois voc[eê]s? abrem?\b/i, '"depois vocês abrem"'],
];
// todo "R$ X" do texto publicado precisa ser um valor que um fato USAR traz (FATOS.md)
const REAIS_OK = new Set([
  '29', '49', '99', '139', '148', '188', '281,08', '209', '50', '25', '7.910', '474,60', '474,59', '1.621', '1.518',
  '8.475,55', '932,31', '200', '500', '81 mil', '81.000', '6.750', '97.200', '97.200,00', '81.000,01', '97.200,01',
  '180 mil', '360 mil', '360.000', '30.000', '4,8 milhões', '5 mil', '300', '10 mil', '600', '9.400',
]);
const valoresEmReais = (t) => [...String(t).matchAll(/R\$\s?(\d{1,3}(?:\.\d{3})*(?:,\d+)?(?:\s(?:mil|milhões)\b)?)/gi)].map((m) => m[1].toLowerCase());
// preço promocional só com o cheio junto, a validade escrita e a fidelidade (FATOS F002, F004, F005, F023)
const PRECO = (v) => new RegExp(`R\\$\\s*${v}(?!\\d|[.,]\\d)`);
const VALIDADE = /31\/12\/2026|31 de dezembro de 2026/;
const FIDELIDADE = /fidelidade/i;

// ---------- o que o JSON pode gravar ----------
const CAMPOS_CONTEUDO = ['ideia', 'roteiro', 'legenda', 'gravacao', 'fontes', 'carrossel', 'estatico', 'stories', 'notas'];
// planejamento: só na peça de setembro fora da planilha
const PLANEJAMENTO_LIVRE = ['tema', 'tipo', 'pilar', 'pilarTexto', 'bloco', 'peca', 'peca2', 'formatoId', 'formatoTexto', 'rede', 'gatilho', 'impulsionar'];
// o que a planilha manda (e a trava confere depois de aplicar)
const PLANEJAMENTO = [...PLANEJAMENTO_LIVRE, 'data', 'status', 'permalink', 'campanhaId', 'calendario'];
const CAMPOS_IDEIA = ['titulo', 'descricao', 'tipo', 'tema', 'formatoId', 'publico', 'gancho', 'estiloGancho', 'roteiroBase', 'fontes', 'notas'];
// registro que vem junto e não vai pro banco (conferido)
const REGISTRO_ITEM = ['ledger', 'bancos', 'pendenciasPedro', 'checagem'];
const GRAVADA = ['gravado', 'editado', 'publicado'];
const STANDBY = [6, 7, 14, 15];
const PUBLICOS = ['MEI', 'ME', 'MEI + ME'];
// limites em que a validação corta o texto sem avisar: aqui passar do limite é erro
const LIMITES = { rede: 200, gatilho: 1000, formatoTexto: 300, pilarTexto: 200, notas: 2000, tema: 2000 };

const erros = [];
const avisos = [];
const erro = (msg) => erros.push(msg);
const sair = (msg) => {
  console.error(`\nNada foi gravado: ${msg}`);
  process.exit(1);
};
const fmtData = (d) => `${String(d).slice(8, 10)}/${String(d).slice(5, 7)}`;
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const objeto = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const textos = (v) => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(textos) : objeto(v) ? Object.values(v).flatMap(textos) : []);
const mesmoCaminho = (a, b) => (process.platform === 'win32' ? path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase() : path.resolve(a) === path.resolve(b));
const daPlanilha = (r) => (typeof r.calendario === 'string' && r.calendario.startsWith('csv:')) || String(r.data ?? '') >= PRIMEIRO_DIA_PLANILHA;

function portaOcupada(porta) {
  return new Promise((ok) => {
    const s = net.connect({ host: '127.0.0.1', port: porta });
    s.setTimeout(800);
    s.once('connect', () => { s.destroy(); ok(true); });
    s.once('timeout', () => { s.destroy(); ok(false); });
    s.once('error', () => ok(false));
  });
}

// ---------- FATOS.md ----------
const FATOS = new Map();
async function lerFatos() {
  if (!existsSync(FATOS_MD)) sair(`não achei ${FATOS_MD}.`);
  for (const l of (await readFile(FATOS_MD, 'utf8')).split(/\r?\n/)) {
    const m = /^\*\*(F\d{3}) · (.+?)\*\* · (USAR|NÃO USAR|CONFLITO)/.exec(l);
    if (m) FATOS.set(m[1], m[3]);
  }
  if (FATOS.size < 100) sair(`FATOS.md parece incompleto (${FATOS.size} fatos lidos).`);
}
function idUsar(onde, id) {
  const st = FATOS.get(id);
  if (!st) erro(`${onde}: ${id} não existe em FATOS.md`);
  else if (st !== 'USAR') erro(`${onde}: ${id} é ${st} em FATOS.md`);
}
// fontes: todo id de fato citado é USAR (a linha sem id diz por que aquele trecho não precisa de fato,
// como "dica de rotina de dono, sem número"); pelo menos uma fonte com id
function conferirFontes(onde, fontes) {
  if (fontes == null) return;
  if (!Array.isArray(fontes) || fontes.some((s) => typeof s !== 'string')) { erro(`${onde}: fontes precisa ser uma lista de textos.`); return; }
  for (const [n, s] of fontes.entries()) for (const id of s.match(/\bF\d{3}\b/g) ?? []) idUsar(`${onde} fontes[${n}]`, id);
  if (!fontes.some((s) => /^F\d{3}\b/.test(s))) erro(`${onde}: nenhuma fonte começa pelo id do fato ("F0xx · arquivo §seção").`);
}

// ---------- textos de cada peça ----------
// publicado: o que a pessoa lê ou ouve. direcao: descrição de cena e visual (passa só pelas regras de base)
function textosDaPeca(c) {
  const r = objeto(c.roteiro) ? c.roteiro : {};
  const cenas = Array.isArray(r.cenas) ? r.cenas : [];
  const slides = objeto(c.carrossel) ? [c.carrossel.capa, ...(Array.isArray(c.carrossel.slides) ? c.carrossel.slides : []), c.carrossel.final].filter(objeto) : [];
  const e = objeto(c.estatico) ? c.estatico : {};
  const quadros = objeto(c.stories) && Array.isArray(c.stories.quadros) ? c.stories.quadros.filter(objeto) : [];
  const blocos = {
    titulo: textos(c.ideia),
    roteiro: textos([r.hook, r.textoTela, r.desenvolvimento, r.cta, cenas.map((x) => [x?.fala, x?.tela])]),
    legenda: textos(c.legenda),
    carrossel: textos(slides.map((s) => [s.titulo, s.texto])),
    estatico: textos([e.headline, e.apoio, e.cta]),
    stories: textos(quadros.map((q) => [q.texto, q.interacao])),
  };
  const direcao = textos([cenas.map((x) => x?.cena), slides.map((s) => s.visual), e.visual, quadros.map((q) => q.visual)]);
  return { blocos, direcao };
}

function regrasDoPublico(onde, lista) {
  for (const t of lista) {
    for (const [re, motivo] of [...PROIBIDOS, ...PUBLICO, ...FAZ_SOZINHO]) {
      const m = t.match(re);
      if (m) erro(`${onde}: ${motivo} ("${m[0]}" em "${t.slice(Math.max(0, m.index - 40), m.index + 60).replace(/\s+/g, ' ')}")`);
    }
    if (BARRINHA.test(t)) erro(`${onde}: hífen solto lido como travessão ou barrinha em "${t.slice(0, 80).replace(/\s+/g, ' ')}"`);
    if (/cancela quando quiser/i.test(t) && !/12 meses|fidelidade/i.test(t)) erro(`${onde}: "cancela quando quiser" sem a regra da fidelidade de 12 meses (F023, F025)`);
    for (const v of valoresEmReais(t)) if (!REAIS_OK.has(v)) erro(`${onde}: R$ ${v} não é valor de nenhum fato USAR`);
  }
}
function regrasDeBase(onde, lista) {
  for (const t of lista) {
    for (const [re, motivo] of PROIBIDOS) {
      const m = t.match(re);
      if (m) erro(`${onde}: ${motivo} ("${m[0]}" em "${t.slice(0, 90).replace(/\s+/g, ' ')}")`);
    }
  }
}
function precoCasado(onde, lista) {
  const t = lista.join('\n');
  if (PRECO(29).test(t) && !PRECO(49).test(t)) erro(`${onde}: R$ 29 sem o valor cheio (R$ 49) junto`);
  if (PRECO(99).test(t) && !PRECO(139).test(t)) erro(`${onde}: R$ 99 sem o valor cheio (R$ 139) junto`);
  if ((PRECO(29).test(t) || PRECO(99).test(t)) && !VALIDADE.test(t)) erro(`${onde}: preço promocional sem a validade 31/12/2026`);
  if ((PRECO(29).test(t) || PRECO(99).test(t)) && !FIDELIDADE.test(t)) erro(`${onde}: preço promocional sem a fidelidade de 12 meses (F023)`);
}

// o texto que a validação devolve tem que ser o mesmo que entrou (sem corte nem troca silenciosa)
function semCorte(onde, entrou, saiu) {
  const b = textos(saiu);
  const faltando = textos(entrou).map((x) => x.trim()).filter((x) => x && !b.includes(x));
  if (faltando.length) erro(`${onde}: a validação cortou ou mudou o texto "${faltando[0].slice(0, 80)}" (limite de tamanho?)`);
}

// ---------- 1. lê e confere o JSON ----------
function lerConteudo(bruto) {
  if (TRACO.test(bruto)) {
    const i = bruto.search(TRACO);
    sair(`o JSON tem travessão ou meia-risca perto de "${bruto.slice(Math.max(0, i - 40), i + 20).replace(/\s+/g, ' ')}". Reescreva com ponto, vírgula ou "e".`);
  }
  for (const [re, motivo] of MORTOS) {
    const m = bruto.match(re);
    if (m) sair(`o JSON tem preço morto ou em conflito na base: ${motivo}, perto de "${bruto.slice(Math.max(0, m.index - 40), m.index + 30).replace(/\s+/g, ' ')}".`);
  }
  let j;
  try {
    j = JSON.parse(bruto.replace(/^\uFEFF/, ''));
  } catch (e) {
    sair(`o JSON não abre: ${e.message}`);
  }
  if (!objeto(j) || !Array.isArray(j.itens) || !Array.isArray(j.ideias)) sair('o JSON precisa de "itens" e "ideias" (listas).');
  if (typeof j.escritoContra !== 'string' || Number.isNaN(Date.parse(j.escritoContra))) sair('o JSON precisa de "escritoContra": a data e hora (ISO) do banco contra o qual a reforma foi escrita.');
  const idsItem = new Set();
  const idsIdeiaLigada = new Map();
  for (const [n, it] of j.itens.entries()) {
    const onde0 = `itens[${n}]`;
    if (!objeto(it) || typeof it.id !== 'string' || typeof it.data !== 'string' || typeof it.ideiaId !== 'string' || !objeto(it.campos)) {
      erro(`${onde0}: precisa de id, data, ideiaId e campos.`);
      continue;
    }
    const onde = `${it.id} (${fmtData(it.data)})`;
    if (idsItem.has(it.id)) erro(`${onde}: a peça aparece duas vezes.`);
    idsItem.add(it.id);
    if (idsIdeiaLigada.has(it.ideiaId)) erro(`${onde}: a ideia ${it.ideiaId} já é da peça ${idsIdeiaLigada.get(it.ideiaId)} (uma ideia por peça).`);
    idsIdeiaLigada.set(it.ideiaId, it.id);
    for (const k of Object.keys(it)) if (!['id', 'data', 'ideiaId', 'campos', ...REGISTRO_ITEM].includes(k)) erro(`${onde}: a chave "${k}" não é lida por este script.`);
    for (const k of Object.keys(it.campos)) if (![...CAMPOS_CONTEUDO, ...PLANEJAMENTO_LIVRE].includes(k)) erro(`${onde}: o campo "${k}" não é gravado por este script.`);
    const c = it.campos;
    if ('ideia' in c && (typeof c.ideia !== 'string' || !c.ideia.trim() || c.ideia.trim().length > 300)) erro(`${onde}: o título (ideia) precisa ser texto de 1 a 300 caracteres.`);
    if (c.notas != null && typeof c.notas !== 'string') erro(`${onde}: notas precisa ser texto.`);
    const { blocos, direcao } = textosDaPeca(c);
    for (const [k, lista] of Object.entries(blocos)) {
      regrasDoPublico(`${onde} ${k}`, lista);
      precoCasado(`${onde} ${k}`, lista);
    }
    regrasDeBase(`${onde} direção de cena`, direcao);
    regrasDeBase(`${onde} tema`, textos(c.tema));
    conferirFontes(onde, c.fontes);
    // registro: ledger com fatos USAR (frase de opinião, gancho ou CTA sem número fica com a lista vazia)
    if (it.ledger != null) {
      if (!Array.isArray(it.ledger)) erro(`${onde}: ledger precisa ser uma lista.`);
      else for (const [k, l] of it.ledger.entries()) {
        if (!objeto(l) || typeof l.frase !== 'string' || !Array.isArray(l.fatos)) { erro(`${onde} ledger[${k}]: precisa de frase e fatos (lista, vazia quando a frase não afirma fato).`); continue; }
        for (const id of l.fatos) if (typeof id !== 'string' || !/^F\d{3}$/.test(id)) erro(`${onde} ledger[${k}]: "${id}" não é id de fato.`); else idUsar(`${onde} ledger[${k}]`, id);
      }
    }
    if (it.pendenciasPedro != null && (!Array.isArray(it.pendenciasPedro) || it.pendenciasPedro.some((p) => typeof p !== 'string'))) erro(`${onde}: pendenciasPedro precisa ser uma lista de textos.`);
  }
  const idsIdeia = new Set();
  for (const [n, i] of j.ideias.entries()) {
    const onde = `ideias[${n}]`;
    if (!objeto(i) || typeof i.id !== 'string' || !objeto(i.campos)) { erro(`${onde}: precisa de id e campos.`); continue; }
    if (idsIdeia.has(i.id)) erro(`${i.id}: a ideia aparece duas vezes.`);
    idsIdeia.add(i.id);
    if (!idsIdeiaLigada.has(i.id)) erro(`${i.id}: a ideia não é de nenhuma peça do JSON.`);
    for (const k of Object.keys(i.campos)) if (!CAMPOS_IDEIA.includes(k)) erro(`${i.id}: o campo "${k}" não é gravado por este script.`);
    const publico = textos([i.campos.titulo, i.campos.gancho, i.campos.roteiroBase]);
    regrasDoPublico(i.id, publico);
    precoCasado(i.id, publico);
    regrasDeBase(`${i.id} descrição`, textos(i.campos.descricao));
    conferirFontes(i.id, i.campos.fontes);
  }
  for (const id of idsIdeiaLigada.keys()) if (!idsIdeia.has(id)) avisos.push(`${id}: ideia ligada sem entrada em "ideias" (fica como está no banco).`);
  return j;
}

// ---------- 2. campos da peça ----------
function camposDoItem(db, it, r) {
  const onde = `${it.id} (${fmtData(it.data)})`;
  const c = structuredClone(it.campos);
  const saida = {};
  try {
    if ('ideia' in c) {
      saida.ideia = c.ideia.trim();
      delete c.ideia;
    }
    if ('roteiro' in c) {
      saida.roteiro = roteiroLimpo(c.roteiro);
      semCorte(`${onde} roteiro`, c.roteiro, saida.roteiro);
      delete c.roteiro;
    }
    if ('legenda' in c) {
      if (typeof c.legenda !== 'string') throw new Error('legenda precisa ser texto.');
      saida.legenda = c.legenda.trim();
      if (saida.legenda.length > MAX_LEGENDA) throw new Error(`legenda tem ${saida.legenda.length} caracteres; o limite do Instagram é ${MAX_LEGENDA}.`);
      delete c.legenda;
    }
    if ('tema' in c) {
      if (typeof c.tema !== 'string') throw new Error('tema precisa ser texto.');
      saida.tema = c.tema.trim();
      delete c.tema;
    }
    for (const [k, lim] of Object.entries(LIMITES)) {
      const v = k === 'tema' ? saida.tema : c[k];
      if (typeof v === 'string' && v.trim().length > lim) throw new Error(`${k} passa de ${lim} caracteres.`);
    }
    const limpo = conferirReel(structuredClone(c), r);
    for (const k of ['carrossel', 'estatico', 'stories', 'fontes', 'gravacao', 'notas', 'gatilho', 'formatoTexto', 'pilarTexto', 'rede']) {
      if (k in c) semCorte(`${onde} ${k}`, c[k], limpo[k]);
    }
    Object.assign(saida, limpo);
    conferirRefs(db, saida);
  } catch (e) {
    erro(`${onde}: ${e.message}`);
    return null;
  }
  return saida;
}

// ---------- 2. campos da ideia ----------
function camposDaIdeia(db, i, atual) {
  const c = structuredClone(i.campos);
  try {
    if ('titulo' in c && (typeof c.titulo !== 'string' || !c.titulo.trim() || c.titulo.length > 300)) throw new Error('titulo precisa ser texto de 1 a 300 caracteres.');
    for (const k of ['descricao', 'gancho']) if (k in c && typeof c[k] !== 'string') throw new Error(`${k} precisa ser texto.`);
    if ('publico' in c && !PUBLICOS.includes(c.publico)) throw new Error(`publico precisa ser ${PUBLICOS.join(', ')}.`);
    if (c.notas != null && String(c.notas).length > LIMITES.notas) throw new Error(`notas passa de ${LIMITES.notas} caracteres.`);
    if (c.estiloGancho != null && String(c.estiloGancho).length > 600) throw new Error('estiloGancho passa de 600 caracteres.');
    if (objeto(c.roteiroBase)) {
      for (const [k, v] of Object.entries(c.roteiroBase)) {
        const lim = k === 'narracao' ? 4000 : 600;
        if (typeof v === 'string' && v.trim().length > lim) throw new Error(`roteiroBase.${k} passa de ${lim} caracteres.`);
      }
    }
    for (const k of ['titulo', 'descricao', 'gancho']) if (typeof c[k] === 'string') c[k] = c[k].trim();
    const limpo = limparIdeia(c, atual);
    for (const k of ['fontes', 'roteiroBase', 'notas', 'estiloGancho']) if (k in c) semCorte(`${i.id} ${k}`, c[k], limpo[k]);
    if ('formatoId' in limpo && limpo.formatoId === '') limpo.formatoId = null;
    conferirRefs(db, { formatoId: limpo.formatoId });
    return limpo;
  } catch (e) {
    erro(`${i.id}: ${e.message}`);
    return null;
  }
}

// a narração da ideia cobre as falas do roteiro da peça? (aviso, não trava)
function conferirNarracao(r, ideia) {
  if (![r.peca || 'reel', r.peca2].includes('reel') || !r.roteiro?.cenas?.length || !ideia) return;
  const narr = ideia.roteiroBase?.narracao ?? '';
  const falas = r.roteiro.cenas.slice(1, -1).map((c) => (c.fala ?? '').trim()).filter(Boolean);
  const fora = falas.filter((f) => !narr.includes(f));
  if (fora.length) avisos.push(`${fmtData(r.data)}: a narração de ${ideia.id} não traz a fala "${fora[0].slice(0, 70)}" do roteiro.`);
  if ((ideia.roteiroBase?.hook ?? '').trim() !== (r.roteiro.hook ?? '').trim()) avisos.push(`${fmtData(r.data)}: o hook de ${ideia.id} é diferente do hook do roteiro.`);
  if ((ideia.roteiroBase?.cta ?? '').trim() !== (r.roteiro.cta ?? '').trim()) avisos.push(`${fmtData(r.data)}: o CTA de ${ideia.id} é diferente do CTA do roteiro.`);
}

async function main() {
  if (Boolean(process.env.CRONOGRAMA_DATA) !== Boolean(process.env.CRONOGRAMA_CONTEUDO)) {
    sair('teste numa cópia usa CRONOGRAMA_DATA e CRONOGRAMA_CONTEUDO juntos (um sem o outro mistura banco de teste com reel.md de verdade).');
  }
  // com o servidor no ar, ele regravaria o banco de memória por cima desta rodada
  const dadosReais = mesmoCaminho(DATA_DIR, path.join(APP, 'data'));
  const portas = new Set([...(dadosReais ? [PORTA_APP] : []), ...(process.env.PORT ? [Number(process.env.PORT)] : [])]);
  for (const porta of portas) {
    if (await portaOcupada(porta)) sair(`tem um servidor no ar na porta ${porta}. Pare o servidor da Gestão de Marketing antes e rode de novo.`);
  }
  if (!existsSync(ARQUIVO)) sair(`o JSON ${ARQUIVO} não existe.`);
  if (!existsSync(DB_PATH)) sair(`o banco ${DB_PATH} não existe.`);
  console.log(`${SIMULAR ? 'SIMULAÇÃO (nada é gravado)\n' : ''}JSON: ${ARQUIVO}\nDados: ${DATA_DIR}\nreel.md: ${CONTEUDO}\n`);

  await lerFatos();
  const conteudo = lerConteudo(await readFile(ARQUIVO, 'utf8'));
  if (erros.length) sair(`o JSON tem ${erros.length} problema(s):\n  - ${erros.join('\n  - ')}`);
  const escritoContra = new Date(conteudo.escritoContra).toISOString();

  // ---------- backup: o banco como estava antes desta rodada (lido antes do boot, que pode normalizar) ----------
  const primeiro = arquivoDados('db.antes-reforma.json');
  const original = await readFile(DB_PATH);
  const guardarBackup = async () => {
    if (!existsSync(primeiro)) await writeFile(primeiro, original);
    await writeFile(arquivoDados('db.antes-reforma.ultimo.json'), original);
  };

  const db = await carregar();
  const fotoReel = new Map(db.reels.map((r) => [r.id, JSON.stringify(r)]));
  const fotoIdeia = new Map(db.ideias.map((i) => [i.id, JSON.stringify(i)]));
  const fotoResto = new Map(Object.keys(db).filter((k) => !['reels', 'ideias'].includes(k)).map((k) => [k, JSON.stringify(db[k])]));

  // ---------- peças: existem, na data, e quem fica de fora (gravada ou editada depois da reforma) ----------
  const pecas = [];
  const protegidas = [];
  const editadaDepois = (x) => x && x.atualizadoEm && x.atualizadoEm > escritoContra && x.atualizadoPor !== AUTOR;
  for (const it of conteudo.itens) {
    const onde = `${it.id} (${fmtData(it.data)})`;
    const r = db.reels.find((x) => x.id === it.id);
    if (!r) { erro(`${onde}: essa peça não existe no cronograma.`); continue; }
    if (r.data !== it.data) { erro(`${onde}: a peça está em ${r.data || 'sem data'}, e o JSON diz ${it.data}.`); continue; }
    const dono = db.reels.find((x) => x.id !== it.id && x.ideiaId === it.ideiaId && !conteudo.itens.some((y) => y.id === x.id));
    if (dono) erro(`${onde}: a ideia ${it.ideiaId} já é da peça ${dono.id} (${dono.data || 'sem data'}), que fica fora deste JSON.`);
    const ideiaAtual = db.ideias.find((i) => i.id === it.ideiaId);
    if (!ideiaAtual) { erro(`${onde}: a ideia ${it.ideiaId} não existe no banco.`); continue; }
    if (daPlanilha(r)) {
      const plan = Object.keys(it.campos).filter((k) => PLANEJAMENTO.includes(k));
      if (plan.length) erro(`${onde}: peça da planilha de outubro; campo de planejamento não muda (${plan.join(', ')}).`);
    }
    if (GRAVADA.includes(r.status)) { protegidas.push(`${onde}: peça com status ${r.status}; nem ela nem a ideia ${it.ideiaId} mudaram.`); continue; }
    if (!SOBRESCREVER_EDITADAS && (editadaDepois(r) || editadaDepois(ideiaAtual))) {
      const quem = editadaDepois(r) ? r : ideiaAtual;
      protegidas.push(`${onde}: ${quem === r ? 'a peça' : `a ideia ${it.ideiaId}`} foi editada por ${quem.atualizadoPor || 'alguém'} em ${quem.atualizadoEm}, depois da reforma. Ficou como está (--sobrescrever-editadas aplica mesmo assim).`);
      continue;
    }
    pecas.push({ it, r, planilha: daPlanilha(r) });
  }

  // ---------- ideias das peças que entram (validadas antes de mexer em qualquer coisa) ----------
  const idsQueEntram = new Set(pecas.map((p) => p.it.ideiaId));
  const ideiasProntas = [];
  for (const i of conteudo.ideias) {
    if (!idsQueEntram.has(i.id)) continue;
    const atual = db.ideias.find((x) => x.id === i.id);
    const limpo = camposDaIdeia(db, i, atual);
    if (limpo) ideiasProntas.push({ i, atual, limpo });
  }

  // ---------- campos das peças ----------
  const pecasProntas = [];
  for (const p of pecas) {
    const campos = camposDoItem(db, p.it, p.r);
    if (campos) pecasProntas.push({ ...p, campos });
  }

  // tipo da ideia = tipo da peça; pilar ativo
  for (const { it, r, campos, planilha } of pecasProntas) {
    const onde = `${it.id} (${fmtData(r.data)})`;
    const tipoPeca = 'tipo' in campos ? campos.tipo : r.tipo;
    const pronta = ideiasProntas.find((x) => x.i.id === it.ideiaId);
    const ideia = db.ideias.find((x) => x.id === it.ideiaId);
    const tipoIdeia = pronta && 'tipo' in pronta.limpo ? pronta.limpo.tipo : ideia.tipo;
    if (tipoIdeia !== tipoPeca) erro(`${onde}: a ideia ${it.ideiaId} é do tipo "${tipoIdeia}" e a peça é "${tipoPeca}".`);
    const titulo = pronta && 'titulo' in pronta.limpo ? pronta.limpo.titulo : ideia.titulo;
    if (!String(titulo ?? '').trim()) erro(`${it.ideiaId}: ideia sem título.`);
    const pilar = 'pilar' in campos ? campos.pilar : r.pilar;
    if (STANDBY.includes(Number(pilar))) {
      if (planilha) avisos.push(`${onde}: o pilar ${pilar} da planilha está em standby na estratégia v4 (não mexido: é planejamento).`);
      else erro(`${onde}: o pilar ${pilar} está em standby na estratégia v4. Troque o pilar no JSON.`);
    }
  }
  if (erros.length) sair(`${erros.length} problema(s) na validação:\n  - ${erros.join('\n  - ')}`);

  // ---------- 3. aplica em memória (só grava no fim) ----------
  for (const { atual, limpo } of ideiasProntas) Object.assign(atual, limpo);
  const soltas = [];
  for (const { it, r, campos } of pecasProntas) {
    Object.assign(r, campos);
    const antes = r.ideiaId ?? null;
    r.ideiaId = it.ideiaId;
    // a ideia que era desta peça (pelo item ou pelo reelId dela) volta livre, se ninguém mais aponta pra ela
    const deAntes = new Set([antes, ...db.ideias.filter((x) => x.reelId === r.id).map((x) => x.id)].filter((x) => x && x !== it.ideiaId));
    for (const id of deAntes) {
      repontarIdeia(db, id, r.id);
      soltas.push({ id, de: r });
    }
    db.ideias.find((x) => x.id === it.ideiaId).reelId = r.id;
  }

  // ---------- 4. travas ----------
  const naRodada = new Set(pecasProntas.map((p) => p.r.id));
  const ideiasNaRodada = new Set(pecasProntas.map((p) => p.it.ideiaId));
  const idsSoltas = new Set(soltas.map((s) => s.id));
  for (const { r, planilha } of pecasProntas) {
    if (!planilha) continue;
    const velho = JSON.parse(fotoReel.get(r.id));
    const mexeu = PLANEJAMENTO.filter((k) => !igual(velho[k] ?? null, r[k] ?? null));
    if (mexeu.length) erro(`${r.id} (${fmtData(r.data)}): o planejamento da planilha mudaria (${mexeu.join(', ')}).`);
  }
  for (const r of db.reels) if (!naRodada.has(r.id) && fotoReel.get(r.id) !== JSON.stringify(r)) erro(`${r.id}: peça fora da reforma mudaria.`);
  for (const i of db.ideias) {
    if (ideiasNaRodada.has(i.id) || !fotoIdeia.has(i.id)) continue;
    const velho = JSON.parse(fotoIdeia.get(i.id));
    const mexeu = Object.keys({ ...velho, ...i }).filter((k) => !igual(velho[k], i[k]));
    if (mexeu.length && !(idsSoltas.has(i.id) && mexeu.every((k) => k === 'reelId'))) erro(`${i.id}: ideia fora da reforma mudaria (${mexeu.join(', ')}).`);
  }
  if (db.ideias.length !== fotoIdeia.size || db.reels.length !== fotoReel.size) erro('a reforma não cria nem apaga peça ou ideia, e a contagem mudaria.');
  for (const [k, foto] of fotoResto) if (JSON.stringify(db[k]) !== foto) erro(`db.${k} mudaria (a reforma só mexe em peças e ideias).`);
  for (const { it, r } of pecasProntas) {
    const ideia = db.ideias.find((x) => x.id === it.ideiaId);
    if (r.ideiaId !== ideia.id || ideia.reelId !== r.id) erro(`${r.id}: peça e ideia ${ideia.id} não apontam uma pra outra.`);
    const outras = db.reels.filter((x) => x.id !== r.id && x.ideiaId === ideia.id);
    if (outras.length) erro(`${ideia.id}: também é ideia de ${outras.map((x) => x.id).join(', ')}.`);
  }
  if (erros.length) sair(`${erros.length} problema(s) nas travas:\n  - ${erros.join('\n  - ')}`);

  // atualizadoEm só em quem mudou de verdade
  const quando = agora();
  const reelsMudados = db.reels.filter((r) => fotoReel.get(r.id) !== JSON.stringify(r));
  const ideiasMudadas = db.ideias.filter((i) => fotoIdeia.get(i.id) !== JSON.stringify(i));
  const camposMudados = new Map(reelsMudados.map((r) => {
    const velho = JSON.parse(fotoReel.get(r.id));
    return [r.id, Object.keys({ ...velho, ...r }).filter((k) => !igual(velho[k], r[k]))];
  }));
  for (const r of reelsMudados) Object.assign(r, { atualizadoEm: quando, atualizadoPor: AUTOR });
  // ideia solta (só reelId) não conta como edição do texto
  for (const i of ideiasMudadas) if (ideiasNaRodada.has(i.id)) Object.assign(i, { atualizadoEm: quando, atualizadoPor: AUTOR });
  const mudou = reelsMudados.length + ideiasMudadas.length > 0;

  for (const { r } of pecasProntas) conferirNarracao(r, db.ideias.find((x) => x.id === r.ideiaId));

  // ---------- 5. grava ----------
  const arquivos = [];
  const semMd = [];
  if (mudou && !SIMULAR) {
    await guardarBackup();
    await salvar();
    const ideiaMudou = new Set(ideiasMudadas.map((i) => i.id));
    for (const { r } of pecasProntas) {
      if (!camposMudados.has(r.id) && !ideiaMudou.has(r.ideiaId)) continue;
      try {
        const pasta = await regravarSeGerado(r);
        if (pasta) arquivos.push(`${fmtData(r.data)} ${r.origem}`);
        else semMd.push(fmtData(r.data));
      } catch (e) {
        avisos.push(`reel.md de ${fmtData(r.data)} (${r.id}): ${e.message}`);
      }
    }
  }

  // ---------- 6. resumo ----------
  const rotulo = (r) => [r.peca || 'reel', r.peca2].filter((t) => ROTULO_PECA[t]).map((t) => ROTULO_PECA[t]).join(' / ');
  const situacaoIdeia = (id) => (ideiasMudadas.some((x) => x.id === id) ? 'atualizada' : 'sem mudança');
  const pendencias = conteudo.itens.reduce((n, it) => n + (it.pendenciasPedro?.length ?? 0), 0);
  const linhas = [
    `== Reforma das skills no cronograma ${SIMULAR ? '(simulação) ' : ''}==`,
    `Peças no JSON: ${conteudo.itens.length} · aplicadas: ${pecasProntas.length} · de fora: ${protegidas.length}`,
    ...pecasProntas
      .sort((a, b) => a.r.data.localeCompare(b.r.data))
      .map(({ r, planilha }) => {
        const ks = (camposMudados.get(r.id) ?? []).filter((k) => !['atualizadoEm', 'atualizadoPor'].includes(k));
        return `  ${fmtData(r.data)} · ${rotulo(r)} · ${planilha ? 'planilha' : 'fora da planilha'} · ${r.ideiaId} (${situacaoIdeia(r.ideiaId)})${ks.length ? ` · mudou: ${ks.join(', ')}` : ' · peça sem mudança'}`;
      }),
    `Ideias: ${ideiasMudadas.filter((i) => ideiasNaRodada.has(i.id)).length} atualizada(s) de ${ideiasProntas.length}`,
    ...(protegidas.length ? ['Ficaram como estão:', ...protegidas.map((x) => `  - ${x}`)] : []),
    ...(soltas.length ? ['Ideias soltas das peças (voltam livres pro banco se nenhuma outra peça aponta pra elas):', ...soltas.map((s) => `  - ${s.id} (era de ${fmtData(s.de.data)}), agora reelId = ${db.ideias.find((x) => x.id === s.id)?.reelId ?? 'nenhum'}`)] : []),
    ...(SIMULAR ? [] : [
      ...(arquivos.length ? ['reel.md regravado:', ...arquivos.map((x) => `  - ${x}`)] : ['reel.md: nada a regravar']),
      ...(semMd.length ? [`Sem reel.md gerado pelo app (não regravado): ${semMd.join(', ')}`] : []),
    ]),
    ...(avisos.length ? ['Avisos:', ...avisos.map((x) => `  - ${x}`)] : []),
    `Pendências do Pedro registradas no JSON: ${pendencias} (campo pendenciasPedro de cada peça)`,
    !mudou ? 'Nada mudou: este conteúdo já estava aplicado.'
      : SIMULAR ? 'Simulação: nada foi gravado. Rode sem --simular pra aplicar.'
        : `Pronto. Backup de antes da primeira rodada: ${primeiro}`,
  ];
  console.log(linhas.join('\n'));
}

try {
  await main();
  process.exit(0);
} catch (e) {
  console.error(`\nErro: ${e.status ? e.message : e.stack}`);
  process.exit(1);
}
