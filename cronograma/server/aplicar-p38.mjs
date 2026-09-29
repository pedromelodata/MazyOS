// Aplica a regra P38 do PROIBIDO.md (Pedro, 28/09/2026: nenhuma peça ensina quem vai abrir empresa ou quem já
// tem CNPJ a fazer sozinho; conteúdo educativo fecha no app) no que NÃO é do cronograma com data: ideias livres
// do Banco, reels sem data, a Biblioteca (data/biblioteca.json) e o Guia do nicho (data/estilos.json).
// As trocas estão em server/conteudo-p38.json. Rode com o servidor PARADO:
//   node server/aplicar-p38.mjs [caminho do JSON] [--simular] [--detalhe]
// --simular confere tudo e mostra o que mudaria, sem gravar nada. --detalhe lista os trechos de "faça sozinho"
// que a varredura achou antes das trocas.
// CRONOGRAMA_DATA troca a pasta de dados e CRONOGRAMA_CONTEUDO a dos reel.md (teste numa cópia: os dois juntos).
// Rodar de novo com o mesmo JSON não muda nada.
//
// Nunca mexe em peça do cronograma com data nem em ideia ligada a ela (ideia.reelId ou reel.ideiaId de peça
// com data): essas estão numa reescrita completa em outro fluxo. JSON que lista peça com data é recusado
// inteiro; ideia que ficou ligada a peça com data até a hora de aplicar é pulada com aviso. Campos de
// planejamento também não mudam (tema, pilar, bloco, formato, rede, gatilho, impulsionar, data, tipo, peça,
// público, duração, tipos do formato).
//
// Cada troca é mínima e conferida contra o que está no arquivo:
//  - "de/para" num texto: o trecho "de" aparece uma vez só e vira "para". Campo que já tem "para": troca já
//    aplicada. Nem um nem outro: conflito (alguém editou depois), nada é gravado
//  - "de/para" numa lista troca o item igual; "incluir" põe um item (antesDe opcional); "remover" tira um item;
//    "acrescentar" soma um texto no fim do campo
//
//  0. porta: na pasta de dados de verdade, servidor respondendo na 4317 (ou PORT) para tudo
//  1. JSON inteiro antes de abrir os dados: travessão, barrinha, concorrente, grafia, preço morto ou fora de
//     FATOS.md, promessa proibida e id de fato em texto publicado, fonte sem id USAR, id de "fatos" que não é
//     USAR em FATOS.md, e os padrões de "faça sozinho" (P38) em todo texto novo
//  2. aplica em memória e valida: validar.mjs (limparIdeia, conferirReel, roteiroLimpo) sem corte de texto;
//     formatos e temas com as regras do aplicar-biblioteca-v2 (fonte com id USAR, tempo em cada bloco,
//     destaque dentro da tela, fatos e fontes na mesma posição)
//  3. varredura P38 no escopo inteiro depois das trocas (ideias livres, reels sem data, formatos, estilos e
//     temas): sobrou padrão de "faça sozinho", nada é gravado
//  4. travas: peça com data e ideia ligada saem idênticas; fora do que o JSON lista, db.json, biblioteca.json e
//     estilos.json saem idênticos; o merge do boot (migrar.mjs) não desfaz a biblioteca nova no db.json
//  5. backup só quando algo muda: <arquivo>.antes-p38.json na primeira vez, <arquivo>.antes-p38.ultimo.json a
//     cada rodada (db, biblioteca e estilos, só os que mudam)
//  6. grava (tmp + rename), atualizadoEm só em ideia e reel que mudaram, regrava o reel.md (regravarSeGerado)
//     dos reels que mudaram e confere o que ficou no disco
import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { APP, DATA_DIR, DB_PATH, arquivoDados, agora } from './db.mjs';
import { conferirReel, limparIdeia, roteiroLimpo, MAX_LEGENDA } from './validar.mjs';
import { lerGuia, mesclar, normFormato } from './migrar.mjs';

const AUTOR = 'Regra P38 (fazer sozinho)';
const JSON_PADRAO = path.join(APP, 'server', 'conteudo-p38.json');
const ARGS = process.argv.slice(2);
const SIMULAR = ARGS.includes('--simular');
const DETALHE = ARGS.includes('--detalhe'); // lista os trechos de "faça sozinho" que a varredura achou antes das trocas
const ARQUIVO = path.resolve(ARGS.find((a) => !a.startsWith('--')) || JSON_PADRAO);
const PORTA = 4317;
const FATOS_MD = path.join(APP, '..', '_base-contabil', 'FATOS.md');
const SUFIXO = 'antes-p38';

// ---------- regras duras de texto (as mesmas dos outros aplicar-*.mjs) ----------
// travessão, meia-risca e parentes, montados por código pra nenhum aparecer no fonte
const TRACO = new RegExp(`[${String.fromCharCode(0x2012, 0x2013, 0x2014, 0x2015, 0x2212)}]`);
const BARRINHA = /(^|\s)-(\s|$)/; // hífen solto (lista ou régua), lê como travessão
const CONCORRENTE = [/\b(contabilizei|agilize|contaj[aá]|facilite|contabilivre|marvee|conta ?azul|nubank)\b/i, 'concorrente citado por nome (P27)'];
const GRAFIA = [/\bLegaliz(?:ai|ei)\b(?![.\w])/, 'grafia da marca é "Legalizaí" (P28)'];
const OUTRAS = [
  [/\blink (?:na|abaixo)\b/i, 'CTA de clique é "link da bio" (P32)'],
  [/\bao vivo\b/i, '"ao vivo" é proibido em copy (P25)'],
];
const PROMESSAS = [
  [/incondicional|sem letra mi[uú]da/i, '"incondicional" ou "sem letra miúda" (P05)'],
  [/gr[aá]tis/i, '"grátis" (P10)'],
  [/qualquer cidade/i, 'MEI fora de BH está em conflito (F027)'],
  [/\bbaix(?:e|a) (?:agora|o app)\b|j[aá] dispon[ií]vel|app store|play store|google play/i, 'download ou loja que não existe (P11)'],
  [/\bgarantid[oa]s?\b|zero multa/i, 'promessa de resultado (P02, P03)'],
  [/economi[az]|pag(?:ar|ue) menos/i, 'economia de imposto (P04)'],
  [/imposto novo/i, 'reforma mal dita (P31)'],
  [/6\s?% fixo/i, '"6% fixo" (P14)'],
  [/(?:cnpj|empresa|abertura|abrir|abre|sai|pronto|bloquead)[^.]{0,25}\bna hora\b|\bem \d+ ?(?:h|horas?|dias?|minutos?)\b|cnpj pronto/i, 'prazo de abertura (P01)'],
  [/\bvagas?\b|\bs[óo] hoje\b/i, 'escassez inventada (P09)'],
  [/sem fidelidade|cancela quando quiser/i, 'fidelidade dita de cabeça (F023)'],
  [/simulador|simule/i, 'simulador de Fator R não é link da base (F009)'],
];
const MORTOS = [
  [/R\$\s*(?:19|79)(?![\d.,])/i, 'R$ 19 ou R$ 79 (F006)'],
  [/\b(?:19|79)\s+reais\b/i, '19 ou 79 reais (F006)'],
  [/\b(?:por|a)\s+(?:19|79)\b(?![\d/.,%])/i, 'preço 19 ou 79 (F006)'],
  [/49,90/, 'R$ 49,90 (morto, ADR L103)'],
  [/86,05|81,05/, 'valor da guia do MEI em conflito (F063)'],
  [/178,31/, 'conta nova com número novo (P13)'],
  [/168,48|268,51|R\$\s*288(?![\d.,])/, 'valor superado ou em conflito (F018, F140)'],
];
// todo "R$ X" precisa ser um valor que um fato USAR traz (FATOS.md)
const REAIS_OK = new Set([
  '29', '49', '99', '139', '148', '188', '281,08', '209', '50', '25', '7.910', '474,60', '474,59', '1.621', '1.518',
  '8.475,55', '932,31', '200', '500', '81 mil', '81.000', '6.750', '97.200', '97.200,00', '81.000,01', '97.200,01',
  '180 mil', '360 mil', '360.000', '30.000', '4,8 milhões', '5 mil', '300', '10 mil', '600', '9.400',
]);
const valoresEmReais = (t) => [...String(t).matchAll(/R\$\s?(\d{1,3}(?:\.\d{3})*(?:,\d+)?(?:\s(?:mil|milhões)\b)?)/gi)].map((m) => m[1].toLowerCase());
const ID_TEXTO = /\bF\d{3}\b|\bP\d{2}\b/;

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
  [/confere a (?:sua|regra)\b|confere o teto/i, '"confere você" sem o app'],
  [/porta certa/i, '"a porta certa" fora do app'],
  [/coloca ess[ae]s? (?:duas )?datas no seu/i, '"coloca as datas no seu"'],
  [/depois voc[eê]s? abrem?\b/i, '"depois vocês abrem"'],
];
// texto interno (descrição, notas, fontes, sazonal) cita a frase proibida entre aspas pra dizer que saiu
const semAspas = (s) => String(s ?? '').replace(/"[^"\n]*"/g, '""');

const erros = [];
const avisos = [];
const erro = (m) => erros.push(m);
const sair = (m) => {
  console.error(`\nNada foi gravado: ${m}`);
  process.exit(1);
};
const objeto = (v) => v && typeof v === 'object' && !Array.isArray(v);
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const textos = (v) => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(textos) : objeto(v) ? Object.values(v).flatMap(textos) : []);

function portaOcupada(porta) {
  return new Promise((ok) => {
    const s = net.connect({ host: '127.0.0.1', port: porta });
    s.setTimeout(800);
    s.once('connect', () => { s.destroy(); ok(true); });
    s.once('timeout', () => { s.destroy(); ok(false); });
    s.once('error', () => ok(false));
  });
}

async function trocarArquivo(destino, texto) {
  const tmp = `${destino}.${process.pid}.tmp`;
  await writeFile(tmp, texto, 'utf8');
  for (let i = 0; ; i++) {
    try {
      return await rename(tmp, destino);
    } catch (e) {
      if (i >= 4 || !['EPERM', 'EBUSY', 'EACCES'].includes(e.code)) { await unlink(tmp).catch(() => {}); throw e; }
      await new Promise((r) => setTimeout(r, 60 * (i + 1)));
    }
  }
}

// ---------- FATOS.md ----------
async function lerFatos() {
  if (!existsSync(FATOS_MD)) sair(`não achei ${FATOS_MD}.`);
  const fatos = new Map();
  for (const l of (await readFile(FATOS_MD, 'utf8')).split(/\r?\n/)) {
    const m = /^\*\*(F\d{3}) · (.+?)\*\* · (USAR|NÃO USAR|CONFLITO)/.exec(l);
    if (m) fatos.set(m[1], m[3]);
  }
  if (fatos.size < 100) sair(`FATOS.md parece incompleto (${fatos.size} fatos lidos).`);
  return fatos;
}
let FATOS = new Map();
function idsUsar(onde, s) {
  for (const id of String(s).match(/\bF\d{3}\b/g) ?? []) {
    const st = FATOS.get(id);
    if (!st) erro(`${onde}: ${id} não existe em FATOS.md`);
    else if (st !== 'USAR') erro(`${onde}: ${id} é ${st} em FATOS.md`);
  }
}
// fonte de formato e de tema: começa pelo id do fato ("F0xx · arquivo §seção") e todo id é USAR
function fonteComFato(onde, s) {
  if (!/^F\d{3}\b/.test(String(s)) || !String(s).split(' · ')[0].match(/\bF\d{3}\b/)) erro(`${onde}: a fonte precisa começar pelo id do fato ("F0xx · arquivo §seção"): "${String(s).slice(0, 60)}"`);
  idsUsar(onde, s);
}

// ---------- o que cada tipo de item pode mudar ----------
// estrito = texto publicado (promessas e sem id de fato); ids = pode citar id; aspas = na varredura P38, o
// trecho entre aspas é citação do que saiu; fonte = lista de fontes; livre = sem varredura P38 (lista do que evitar)
const MODO = {
  ideia: {
    titulo: 'estrito', gancho: 'estrito', roteiroBase: 'estrito',
    descricao: 'interno', estiloGancho: 'interno', notas: 'ids', fontes: 'fonte-livre',
  },
  reel: {
    roteiro: 'estrito', legenda: 'estrito', carrossel: 'estrito', estatico: 'estrito', stories: 'estrito',
    gravacao: 'ids', notas: 'ids', fontes: 'fonte-livre',
  },
  formato: { nome: 'estrito', formula: 'estrito', descricao: 'estrito-aspas', estrutura: 'estrito', exemplo: 'estrito', fontes: 'fonte' },
  tema: { nome: 'estrito', dor: 'estrito', fatos: 'estrito', fontes: 'fonte', sazonal: 'ids' },
  estilo: {
    objetivo: 'estrito', gatilhos: 'estrito', familiasDeGancho: 'estrito', ganchosModelo: 'gancho-modelo',
    estrutura: 'estrito', ctas: 'estrito', evitar: 'livre',
  },
};

function regrasTexto(onde, s, modo) {
  const t = String(s ?? '');
  if (TRACO.test(t)) erro(`${onde}: travessão ou meia-risca`);
  if (BARRINHA.test(t)) erro(`${onde}: hífen solto (barrinha) em "${t.slice(0, 70)}"`);
  const promessas = modo.startsWith('estrito') || modo === 'gancho-modelo';
  for (const [re, motivo] of [CONCORRENTE, GRAFIA, ...OUTRAS, ...MORTOS, ...(promessas ? PROMESSAS : [])]) {
    const m = t.match(re);
    if (m) erro(`${onde}: ${motivo} ("${m[0]}")`);
  }
  for (const v of valoresEmReais(t)) if (!REAIS_OK.has(v)) erro(`${onde}: R$ ${v} não é valor de fato USAR em FATOS.md`);
  if (modo === 'gancho-modelo') {
    // o id do fato só aparece no parêntese final, junto do tema (a tela esconde)
    const ref = /\s*\(([^()]*)\)\s*$/.exec(t);
    const corpo = ref && /\btm_[a-z0-9_]+/.test(ref[1]) ? t.slice(0, ref.index) : t;
    if (ID_TEXTO.test(corpo)) erro(`${onde}: id de fato fora do parêntese final (P33)`);
    if (ref) idsUsar(onde, ref[1]);
  } else if (modo.startsWith('estrito') || modo === 'interno' || modo === 'livre') {
    if ((modo === 'livre' ? /\bF\d{3}\b/ : ID_TEXTO).test(t)) erro(`${onde}: id de fato no texto (P33): "${t.slice(0, 70)}"`);
  } else {
    idsUsar(onde, t);
  }
  if (modo !== 'livre') {
    const alvo = modo === 'interno' || modo === 'ids' || modo.startsWith('fonte') || modo === 'estrito-aspas' ? semAspas(t) : t;
    for (const [re, motivo] of FAZ_SOZINHO) {
      const m = alvo.match(re);
      if (m) erro(`${onde}: P38, ${motivo} ("${m[0]}")`);
    }
  }
}

// ---------- 1. o JSON ----------
const COLECOES = { reels: 'reel', ideias: 'ideia', formatos: 'formato', temas: 'tema', estilos: 'estilo' };

function lerConteudo(bruto) {
  if (TRACO.test(bruto)) {
    const i = bruto.search(TRACO);
    sair(`o JSON tem travessão ou meia-risca perto de "${bruto.slice(Math.max(0, i - 40), i + 20).replace(/\s+/g, ' ')}".`);
  }
  let j;
  try {
    j = JSON.parse(bruto);
  } catch (e) {
    sair(`o JSON não abre: ${e.message}`);
  }
  if (!objeto(j)) sair('o JSON precisa ser um objeto.');
  for (const c of Object.keys(COLECOES)) if (!Array.isArray(j[c] ?? [])) sair(`"${c}" precisa ser uma lista.`);
  for (const [colecao, tipo] of Object.entries(COLECOES)) {
    const vistos = new Set();
    for (const [n, it] of (j[colecao] ?? []).entries()) {
      const onde = `${colecao}[${n}]${it?.id ? ` ${it.id}` : ''}`;
      if (!objeto(it) || typeof it.id !== 'string' || !Array.isArray(it.ops) || !it.ops.length) { erro(`${onde}: precisa de id e ops.`); continue; }
      if (vistos.has(it.id)) erro(`${onde}: aparece duas vezes.`);
      vistos.add(it.id);
      if ('data' in it) erro(`${onde}: item com data é peça do cronograma, fora do escopo deste script.`);
      for (const id of it.fatos ?? []) {
        if (!/^F\d{3}$/.test(id)) erro(`${onde}: "${id}" em fatos não é id de fato.`);
        else idsUsar(`${onde} fatos`, id);
      }
      for (const [m, op] of it.ops.entries()) {
        const o = `${onde} ops[${m}]`;
        if (!objeto(op) || typeof op.campo !== 'string' || !op.campo) { erro(`${o}: precisa de campo.`); continue; }
        const topo = op.campo.split('.')[0];
        const modo = MODO[tipo][topo];
        if (!modo) { erro(`${o}: o campo "${op.campo}" não é gravado por este script (planejamento, id ou estrutura não mudam).`); continue; }
        const tipos = ['de', 'incluir', 'remover', 'acrescentar'].filter((k) => k in op);
        if (tipos.length !== 1) { erro(`${o}: use um só de "de/para", "incluir", "remover" ou "acrescentar".`); continue; }
        const novo = op.para ?? op.incluir ?? op.acrescentar;
        if (tipos[0] === 'de' && (typeof op.de !== 'string' || !op.de || typeof op.para !== 'string' || !op.para.trim())) erro(`${o}: "de" e "para" precisam ser texto não vazio.`);
        if (tipos[0] !== 'de' && typeof (op[tipos[0]]) !== 'string') erro(`${o}: "${tipos[0]}" precisa ser texto.`);
        if ('antesDe' in op && (tipos[0] !== 'incluir' || typeof op.antesDe !== 'string')) erro(`${o}: "antesDe" só vale com "incluir".`);
        if (novo != null) {
          const m2 = modo === 'fonte' ? 'fonte' : modo === 'fonte-livre' ? 'fonte-livre' : modo;
          regrasTexto(o, novo, m2);
          if (modo === 'fonte' && tipos[0] !== 'acrescentar') fonteComFato(o, novo);
        }
      }
    }
  }
  return j;
}

// ---------- 2. as trocas ----------
function pegar(obj, caminho) {
  return caminho.split('.').reduce((o, k) => (o == null ? undefined : Array.isArray(o) && /^\d+$/.test(k) ? o[Number(k)] : o[k]), obj);
}
function por(obj, caminho, valor) {
  const ks = caminho.split('.');
  const ult = ks.pop();
  const pai = ks.length ? pegar(obj, ks.join('.')) : obj;
  if (pai == null || typeof pai !== 'object') throw new Error(`o caminho "${caminho}" não existe`);
  pai[Array.isArray(pai) ? Number(ult) : ult] = valor;
}
const vezes = (s, trecho) => s.split(trecho).length - 1;

// devolve 'aplicada' ou 'ja'; conflito vira erro
function aplicarOp(alvo, op) {
  const atual = pegar(alvo, op.campo);
  if (typeof atual === 'string') {
    if ('acrescentar' in op) {
      if (atual.includes(op.acrescentar)) return 'ja';
      const base = atual.replace(/\s+$/, '');
      por(alvo, op.campo, base ? `${base}${op.separador ?? ' '}${op.acrescentar}` : op.acrescentar);
      return 'aplicada';
    }
    if ('de' in op) {
      if (atual.includes(op.para)) return 'ja';
      const n = vezes(atual, op.de);
      if (n !== 1) throw new Error(`"${op.campo}": o trecho "${op.de.slice(0, 70)}" aparece ${n} vez(es) e a troca não está aplicada (o texto mudou depois do JSON?)`);
      por(alvo, op.campo, atual.replace(op.de, () => op.para));
      return 'aplicada';
    }
    throw new Error(`"${op.campo}" é texto: use "de/para" ou "acrescentar".`);
  }
  if (Array.isArray(atual)) {
    if (atual.some((x) => typeof x !== 'string')) throw new Error(`"${op.campo}" não é lista de textos.`);
    if ('de' in op) {
      if (atual.includes(op.para)) return 'ja';
      const n = atual.filter((x) => x === op.de).length;
      if (n !== 1) throw new Error(`"${op.campo}": o item "${op.de.slice(0, 70)}" aparece ${n} vez(es) e a troca não está aplicada`);
      atual[atual.indexOf(op.de)] = op.para;
      return 'aplicada';
    }
    if ('incluir' in op) {
      if (atual.includes(op.incluir)) return 'ja';
      if (op.antesDe != null) {
        const i = atual.indexOf(op.antesDe);
        if (i < 0) throw new Error(`"${op.campo}": o item de referência "${op.antesDe.slice(0, 60)}" não está na lista`);
        atual.splice(i, 0, op.incluir);
      } else atual.push(op.incluir);
      return 'aplicada';
    }
    if ('remover' in op) {
      const i = atual.indexOf(op.remover);
      if (i < 0) return 'ja';
      if (atual.lastIndexOf(op.remover) !== i) throw new Error(`"${op.campo}": o item a remover aparece mais de uma vez`);
      atual.splice(i, 1);
      return 'aplicada';
    }
    throw new Error(`"${op.campo}" é lista: use "de/para", "incluir" ou "remover".`);
  }
  throw new Error(`o campo "${op.campo}" não existe ou não é texto nem lista`);
}

function aplicarItem(onde, alvo, item) {
  let aplicadas = 0;
  let ja = 0;
  for (const [n, op] of item.ops.entries()) {
    try {
      if (aplicarOp(alvo, op) === 'aplicada') aplicadas++;
      else ja++;
    } catch (e) {
      erro(`${onde} ops[${n}]: ${e.message}`);
    }
  }
  return { aplicadas, ja };
}

const aparado = (o) => (objeto(o) ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])) : o);
function semCorte(onde, entrou, saiu) {
  if (!igual(entrou, saiu)) erro(`${onde}: a validação mudou o texto (limite de tamanho ou formato?).`);
}

// ---------- 3. varredura P38 ----------
const PLANEJAMENTO_REEL = ['ideia', 'tema', 'formatoTexto', 'pilarTexto', 'rede', 'gatilho', 'calendario', 'origem', 'permalink'];
function varrer({ db, bib, est, fora }) {
  const achados = [];
  const olhar = (onde, valor, interno) => {
    for (const t of textos(valor)) {
      const alvo = interno ? semAspas(t) : t;
      for (const [re, motivo] of FAZ_SOZINHO) {
        const m = alvo.match(re);
        if (m) achados.push(`${onde}: ${motivo} ("${m[0]}" em "${t.slice(Math.max(0, t.indexOf(m[0]) - 30), t.indexOf(m[0]) + 50).replace(/\s+/g, ' ')}")`);
      }
    }
  };
  for (const i of db.ideias) {
    if (fora.has(`ideia ${i.id}`)) continue;
    for (const k of ['titulo', 'gancho', 'roteiroBase']) olhar(`ideia ${i.id} ${k}`, i[k], false);
    for (const k of ['descricao', 'estiloGancho', 'notas', 'fontes']) olhar(`ideia ${i.id} ${k}`, i[k], true);
  }
  for (const r of db.reels) {
    if (r.data || fora.has(`reel ${r.id}`)) continue;
    for (const k of ['roteiro', 'legenda', 'carrossel', 'estatico', 'stories']) olhar(`reel ${r.id} ${k}`, r[k], false);
    for (const k of ['gravacao', 'notas', 'fontes']) olhar(`reel ${r.id} ${k}`, r[k], true);
    for (const k of PLANEJAMENTO_REEL) {
      const antes = achados.length;
      olhar(`reel ${r.id} ${k}`, r[k], false);
      // campo de planejamento não é deste script: avisa em vez de travar
      avisos.push(...achados.splice(antes).map((x) => `${x} (campo de planejamento, fica como está)`));
    }
  }
  const formato = (onde, f) => {
    for (const k of ['nome', 'formula', 'estrutura', 'exemplo']) olhar(`${onde} ${k}`, f[k], false);
    for (const k of ['descricao', 'fontes']) olhar(`${onde} ${k}`, f[k], true);
  };
  for (const f of bib) formato(`biblioteca ${f.codigo ?? f.id}`, f);
  for (const f of db.formatos) formato(`db.formatos ${f.codigo ?? f.id}`, f);
  for (const [k, e] of Object.entries(est.estilos ?? {})) {
    for (const c of ['nome', 'objetivo', 'gatilhos', 'familiasDeGancho', 'ganchosModelo', 'estrutura', 'ctas']) olhar(`estilo ${k} ${c}`, e[c], false);
  }
  for (const t of est.temas ?? []) {
    for (const c of ['nome', 'dor', 'fatos']) olhar(`tema ${t.id} ${c}`, t[c], false);
    for (const c of ['fontes', 'sazonal']) olhar(`tema ${t.id} ${c}`, t[c], true);
  }
  olhar('rotulosTema', Object.values(est.rotulosTema ?? {}), false);
  olhar('estilos._leia', est._leia, true);
  return achados;
}

// ---------- principal ----------
async function lerDados(nome) {
  const p = arquivoDados(nome);
  if (!existsSync(p)) sair(`${p} não existe.`);
  const texto = await readFile(p, 'utf8');
  let json;
  try { json = JSON.parse(texto); } catch (e) { sair(`${p} não abre: ${e.message}`); }
  return { p, texto, json };
}
// os três arquivos voltam pro disco no mesmo formato em que o app grava
const formatoDb = (j) => JSON.stringify(j, null, 2);
const formatoArq = (j) => `${JSON.stringify(j, null, 2)}\n`;

async function main() {
  const dadosReais = path.resolve(DATA_DIR) === path.join(APP, 'data');
  if (Boolean(process.env.CRONOGRAMA_DATA) !== Boolean(process.env.CRONOGRAMA_CONTEUDO)) {
    sair('teste numa cópia usa CRONOGRAMA_DATA e CRONOGRAMA_CONTEUDO juntos (um sem o outro mistura banco de teste com reel.md de verdade).');
  }
  // banco de verdade: nada abre com o servidor no ar (ele guarda o banco em memória e gravaria por cima)
  if (dadosReais) {
    for (const porta of new Set([Number(process.env.PORT) || PORTA, PORTA])) {
      if (await portaOcupada(porta)) sair(`tem um servidor respondendo na porta ${porta}. Pare o servidor da Gestão de Marketing e rode de novo.`);
    }
  }
  if (!existsSync(ARQUIVO)) sair(`o JSON ${ARQUIVO} não existe.`);
  console.log(`${SIMULAR ? 'SIMULAÇÃO (nada é gravado)\n' : ''}JSON: ${ARQUIVO}\nDados: ${DATA_DIR}${dadosReais ? ' (banco de verdade)' : ' (cópia)'}\n`);

  FATOS = await lerFatos();
  const conteudo = lerConteudo(await readFile(ARQUIVO, 'utf8'));
  if (erros.length) sair(`o JSON tem ${erros.length} problema(s):\n  - ${erros.join('\n  - ')}`);

  const arqDb = await lerDados('db.json');
  const arqBib = await lerDados('biblioteca.json');
  const arqEst = await lerDados('estilos.json');
  if (arqDb.texto !== formatoDb(arqDb.json)) sair('db.json não está no formato em que o app grava (JSON com 2 espaços): regravar mudaria o arquivo inteiro.');
  if (arqBib.texto !== formatoArq(arqBib.json)) sair('biblioteca.json não está no formato de sempre (JSON com 2 espaços e quebra de linha no fim).');
  if (arqEst.texto !== formatoArq(arqEst.json)) sair('estilos.json não está no formato de sempre (JSON com 2 espaços e quebra de linha no fim).');
  const db0 = arqDb.json;
  if (!Array.isArray(db0.ideias) || !Array.isArray(db0.reels) || !Array.isArray(db0.formatos)) sair('db.json sem ideias, reels ou formatos.');
  if (!Array.isArray(arqBib.json)) sair('biblioteca.json não é uma lista.');
  const db = structuredClone(db0);
  const bib = structuredClone(arqBib.json);
  const est = structuredClone(arqEst.json);

  // peça com data e ideia ligada a ela: fora do escopo, e têm que sair idênticas
  const comData = new Set(db.reels.filter((r) => r.data).map((r) => r.id));
  const ligadas = new Set([
    ...db.ideias.filter((i) => i.reelId && comData.has(i.reelId)).map((i) => i.id),
    ...db.reels.filter((r) => r.data && r.ideiaId).map((r) => r.ideiaId),
  ]);
  const intocados = new Map([
    ...db.ideias.filter((i) => ligadas.has(i.id)).map((i) => [`ideia ${i.id}`, JSON.stringify(i)]),
    ...db.reels.filter((r) => r.data).map((r) => [`reel ${r.id}`, JSON.stringify(r)]),
  ]);
  const foraDoEscopo = new Set(intocados.keys());
  const varreduraAntes = varrer({ db: db0, bib: arqBib.json, est: arqEst.json, fora: foraDoEscopo });
  avisos.length = 0; // os avisos de planejamento saem na varredura de depois

  const plano = []; // { tipo, id, veredito, aplicadas, ja }
  const mudouIdeia = new Set();
  const mudouReel = new Set();
  const mudouFormato = new Set();

  // ---------- reels sem data ----------
  for (const item of conteudo.reels ?? []) {
    const r = db.reels.find((x) => x.id === item.id);
    if (!r) { avisos.push(`reel ${item.id}: não existe mais, pulado.`); continue; }
    if (r.data) { erro(`reel ${item.id}: é peça do cronograma com data (${r.data}); este script não toca em peça com data.`); continue; }
    if (['gravado', 'editado', 'publicado'].includes(r.status)) { erro(`reel ${item.id}: já está ${r.status}; o texto gravado não muda por aqui.`); continue; }
    const antes = JSON.stringify(r);
    const res = aplicarItem(`reel ${item.id}`, r, item);
    plano.push({ tipo: 'reel', id: item.id, veredito: item.veredito, ...res });
    if (JSON.stringify(r) === antes) continue;
    mudouReel.add(r.id);
    const tocados = [...new Set(item.ops.map((op) => op.campo.split('.')[0]))];
    try {
      if (tocados.includes('roteiro')) semCorte(`reel ${r.id} roteiro`, { ...aparado(r.roteiro), cenas: (r.roteiro.cenas ?? []).map(aparado) }, roteiroLimpo(r.roteiro));
      if (tocados.includes('legenda') && r.legenda.trim().length > MAX_LEGENDA) erro(`reel ${r.id}: legenda com ${r.legenda.trim().length} caracteres (limite ${MAX_LEGENDA}).`);
      const outros = tocados.filter((k) => !['roteiro', 'legenda'].includes(k));
      if (outros.length) {
        const campos = Object.fromEntries(outros.map((k) => [k, structuredClone(r[k])]));
        const limpo = conferirReel(structuredClone(campos), JSON.parse(antes));
        for (const k of outros) {
          const esperado = k === 'fontes' ? r.fontes.map((s) => s.trim()) : k === 'notas' ? r.notas.trim() : r[k];
          semCorte(`reel ${r.id} ${k}`, esperado, limpo[k]);
        }
      }
    } catch (e) {
      erro(`reel ${r.id}: ${e.message}`);
    }
  }

  // ---------- ideias livres ----------
  for (const item of conteudo.ideias ?? []) {
    const i = db.ideias.find((x) => x.id === item.id);
    if (!i) { avisos.push(`ideia ${item.id}: não existe mais no banco, pulada.`); continue; }
    if (ligadas.has(item.id)) { avisos.push(`ideia ${item.id}: agora está ligada a uma peça com data (reescrita em outro fluxo), pulada.`); continue; }
    const antes = JSON.stringify(i);
    const res = aplicarItem(`ideia ${item.id}`, i, item);
    plano.push({ tipo: 'ideia', id: item.id, veredito: item.veredito, titulo: i.titulo, ...res });
    if (JSON.stringify(i) === antes) continue;
    mudouIdeia.add(i.id);
    const tocados = [...new Set(item.ops.map((op) => op.campo.split('.')[0]))];
    try {
      for (const k of ['titulo', 'descricao', 'gancho']) {
        if (!tocados.includes(k)) continue;
        if (typeof i[k] !== 'string' || i[k] !== i[k].trim()) erro(`ideia ${i.id}: ${k} com espaço sobrando nas pontas.`);
      }
      if (tocados.includes('titulo') && (!i.titulo.trim() || i.titulo.length > 300)) erro(`ideia ${i.id}: título precisa ter de 1 a 300 caracteres.`);
      const campos = Object.fromEntries(tocados.filter((k) => ['estiloGancho', 'notas', 'roteiroBase', 'fontes'].includes(k)).map((k) => [k, structuredClone(i[k])]));
      const limpo = limparIdeia(structuredClone(campos), JSON.parse(antes));
      if ('roteiroBase' in campos) semCorte(`ideia ${i.id} roteiroBase`, aparado(campos.roteiroBase), limpo.roteiroBase);
      if ('fontes' in campos) semCorte(`ideia ${i.id} fontes`, campos.fontes.map((s) => s.trim()), limpo.fontes);
      if ('notas' in campos) semCorte(`ideia ${i.id} notas`, campos.notas.trim(), limpo.notas);
      if ('estiloGancho' in campos) semCorte(`ideia ${i.id} estiloGancho`, campos.estiloGancho.trim(), limpo.estiloGancho);
      if ((i.fontes ?? []).length === 0) erro(`ideia ${i.id}: ficou sem fontes.`);
      if (/\d/.test(JSON.stringify(i.roteiroBase)) && !(i.fontes ?? []).some((f) => /\bF\d{3}\b/.test(f))) erro(`ideia ${i.id}: tem número e nenhuma fonte com id de fato.`);
    } catch (e) {
      erro(`ideia ${i.id}: ${e.message}`);
    }
  }

  // ---------- formatos: biblioteca.json e o mesmo formato no db.json ----------
  for (const item of conteudo.formatos ?? []) {
    const f = bib.find((x) => x.id === item.id);
    const fd = db.formatos.find((x) => x.id === item.id);
    if (!f) { erro(`formato ${item.id}: não está em biblioteca.json.`); continue; }
    if (!fd) { erro(`formato ${item.id}: não está no db.json (suba o servidor uma vez antes).`); continue; }
    for (const op of item.ops) {
      const topo = op.campo.split('.')[0];
      if (!igual(f[topo], fd[topo])) erro(`formato ${item.id}: "${topo}" no db.json difere de biblioteca.json (editado no app?); troque pelo app ou alinhe antes.`);
    }
    const antes = JSON.stringify(f);
    const res = aplicarItem(`formato ${f.codigo}`, f, item);
    aplicarItem(`db.formatos ${f.codigo}`, fd, item);
    plano.push({ tipo: 'formato', id: item.id, codigo: f.codigo, veredito: item.veredito, ...res });
    if (JSON.stringify(f) !== antes) mudouFormato.add(f.id);
    const onde = `formato ${f.codigo}`;
    for (const b of f.estrutura ?? []) if (!/\(\d+-\d+s\)/.test(b) && !/^CTA só na legenda/.test(b)) erro(`${onde}: bloco sem tempo "(0-3s)": "${String(b).slice(0, 60)}"`);
    const ex = f.exemplo ?? {};
    if (ex.destaque && !String(ex.tela ?? '').includes(ex.destaque)) erro(`${onde}: o destaque "${ex.destaque}" não está na tela "${ex.tela}".`);
    if (!Array.isArray(f.fontes) || !f.fontes.length) erro(`${onde}: ficou sem fontes.`);
    for (const s of f.fontes ?? []) fonteComFato(`${onde} fontes`, s);
    for (const op of item.ops) {
      const topo = op.campo.split('.')[0];
      if (!igual(f[topo], fd[topo])) erro(`${onde}: "${topo}" ficou diferente entre biblioteca.json e db.json.`);
    }
  }

  // ---------- temas e estilos (data/estilos.json) ----------
  for (const item of conteudo.temas ?? []) {
    const t = (est.temas ?? []).find((x) => x.id === item.id);
    if (!t) { erro(`tema ${item.id}: não está em estilos.json.`); continue; }
    const res = aplicarItem(`tema ${item.id}`, t, item);
    plano.push({ tipo: 'tema', id: item.id, veredito: item.veredito, ...res });
    if (!Array.isArray(t.fatos) || !t.fatos.length) erro(`tema ${t.id}: ficou sem fatos.`);
    if (t.fatos?.length !== t.fontes?.length) erro(`tema ${t.id}: ${t.fatos?.length} fatos e ${t.fontes?.length} fontes (cada fato com a fonte na mesma posição).`);
    for (const s of t.fontes ?? []) fonteComFato(`tema ${t.id} fontes`, s);
  }
  for (const item of conteudo.estilos ?? []) {
    const e = est.estilos?.[item.id];
    if (!objeto(e)) { erro(`estilo ${item.id}: não está em estilos.json.`); continue; }
    const res = aplicarItem(`estilo ${item.id}`, e, item);
    plano.push({ tipo: 'estilo', id: item.id, veredito: item.veredito, ...res });
    for (const g of e.ganchosModelo ?? []) {
      const tm = /\s*\(([^()]*)\)\s*$/.exec(g)?.[1].match(/\btm_[a-z0-9_]+/)?.[0];
      if (tm && !(est.temas ?? []).some((t) => t.id === tm)) erro(`estilo ${item.id} gancho: o tema ${tm} não está na lista de temas.`);
    }
  }
  if (erros.length) sair(`${erros.length} problema(s) nas trocas:\n  - ${erros.join('\n  - ')}`);

  // ---------- 3. varredura P38 depois das trocas ----------
  const varreduraDepois = varrer({ db, bib, est, fora: foraDoEscopo });
  if (varreduraDepois.length) sair(`ainda tem ${varreduraDepois.length} trecho(s) de "faça sozinho" (P38) no escopo:\n  - ${varreduraDepois.join('\n  - ')}`);

  // ---------- 4. travas ----------
  for (const [k, foto] of intocados) {
    const [tipo, id] = k.split(' ');
    const agoraObj = tipo === 'ideia' ? db.ideias.find((x) => x.id === id) : db.reels.find((x) => x.id === id);
    if (JSON.stringify(agoraObj) !== foto) sair(`${k} mudou, e não podia (peça com data ou ideia ligada a ela).`);
  }
  const quando = agora();
  for (const i of db.ideias) if (mudouIdeia.has(i.id)) Object.assign(i, { atualizadoEm: quando, atualizadoPor: AUTOR });
  for (const r of db.reels) if (mudouReel.has(r.id)) Object.assign(r, { atualizadoEm: quando, atualizadoPor: AUTOR });
  // fora do que o JSON lista, tudo igual
  for (const k of new Set([...Object.keys(db0), ...Object.keys(db)])) {
    if (['ideias', 'reels', 'formatos'].includes(k)) continue;
    if (!igual(db0[k], db[k])) sair(`db.json: "${k}" mudaria, e não é deste script.`);
  }
  const listados = { ideias: mudouIdeia, reels: mudouReel, formatos: mudouFormato };
  for (const [k, set] of Object.entries(listados)) {
    if (db0[k].length !== db[k].length) sair(`db.json: a quantidade de ${k} mudaria.`);
    db0[k].forEach((x, n) => {
      if (x.id !== db[k][n].id) sair(`db.json: a ordem de ${k} mudaria.`);
      if (!set.has(x.id) && !igual(x, db[k][n])) sair(`db.json: ${k} ${x.id} mudaria sem estar no JSON.`);
    });
  }
  arqBib.json.forEach((f, n) => {
    if (!mudouFormato.has(f.id) && !igual(f, bib[n])) sair(`biblioteca.json: ${f.codigo} mudaria sem estar no JSON.`);
  });
  const temasListados = new Set((conteudo.temas ?? []).map((t) => t.id));
  const estilosListados = new Set((conteudo.estilos ?? []).map((e) => e.id));
  for (const k of new Set([...Object.keys(arqEst.json), ...Object.keys(est)])) {
    if (k === 'temas') {
      if (arqEst.json.temas.length !== est.temas.length) sair('estilos.json: a quantidade de temas mudaria.');
      arqEst.json.temas.forEach((t, n) => {
        if (t.id !== est.temas[n].id || (!temasListados.has(t.id) && !igual(t, est.temas[n]))) sair(`estilos.json: o tema ${t.id} mudaria sem estar no JSON.`);
        if (!igual(Object.keys(t), Object.keys(est.temas[n]))) sair(`estilos.json: os campos do tema ${t.id} mudariam.`);
      });
    } else if (k === 'estilos') {
      for (const e of new Set([...Object.keys(arqEst.json.estilos), ...Object.keys(est.estilos)])) {
        if (!estilosListados.has(e) && !igual(arqEst.json.estilos[e], est.estilos[e])) sair(`estilos.json: o estilo ${e} mudaria sem estar no JSON.`);
        if (!igual(Object.keys(arqEst.json.estilos[e] ?? {}), Object.keys(est.estilos[e] ?? {}))) sair(`estilos.json: os campos do estilo ${e} mudariam.`);
      }
    } else if (!igual(arqEst.json[k], est[k])) sair(`estilos.json: "${k}" mudaria, e não é deste script.`);
  }
  // o boot (migrar.mjs, mesclar) acompanha biblioteca.json nos formatos nunca editados: com a biblioteca nova,
  // ele não pode trocar nada do que fica gravado no db.json
  await lerGuia(); // formatoTipos (formato.tipos) do estilos.json da pasta de dados; este script não mexe nele
  const bootDiff = (dbBase, bibBase) => {
    const copia = structuredClone(dbBase);
    mesclar(copia, 'formatos', bibBase, normFormato);
    return bibBase.map((f) => f.id).filter((id) => !igual(copia.formatos.find((x) => x.id === id), dbBase.formatos.find((x) => x.id === id)));
  };
  const bootAntes = new Set(bootDiff(db0, arqBib.json));
  const bootDepois = bootDiff(db, bib);
  const bootNovo = bootDepois.filter((id) => !bootAntes.has(id) || mudouFormato.has(id));
  if (bootNovo.length) sair(`o merge do boot mudaria estes formatos no db.json: ${bootNovo.join(', ')}.`);
  if (bootAntes.size) avisos.push(`o merge do boot já ia atualizar (antes deste script) os formatos ${[...bootAntes].join(', ')}: fica pro próximo boot, como sempre.`);

  // ---------- 5 e 6. grava ----------
  const textoDb = formatoDb(db);
  const textoBib = formatoArq(bib);
  const textoEst = formatoArq(est);
  const muda = { db: textoDb !== arqDb.texto, bib: textoBib !== arqBib.texto, est: textoEst !== arqEst.texto };
  const algo = muda.db || muda.bib || muda.est;
  const backups = [];
  const reelMd = [];
  if (!SIMULAR && algo) {
    // relê: nada pode ter mudado nos arquivos desde a leitura
    for (const a of [arqDb, arqBib, arqEst]) if ((await readFile(a.p, 'utf8')) !== a.texto) sair(`${path.basename(a.p)} mudou durante a rodada. Pare o que estiver gravando nele e rode de novo.`);
    const escrever = [[muda.db, 'db.json', arqDb, textoDb], [muda.bib, 'biblioteca.json', arqBib, textoBib], [muda.est, 'estilos.json', arqEst, textoEst]];
    for (const [sim, nome, a] of escrever) {
      if (!sim) continue;
      const base = nome.replace(/\.json$/, '');
      const primeiro = arquivoDados(`${base}.${SUFIXO}.json`);
      if (!existsSync(primeiro)) await writeFile(primeiro, a.texto, 'utf8');
      await writeFile(arquivoDados(`${base}.${SUFIXO}.ultimo.json`), a.texto, 'utf8');
      backups.push(primeiro);
    }
    for (const [sim, nome, , texto] of escrever) if (sim) await trocarArquivo(arquivoDados(nome), texto);
    for (const [sim, nome, , texto] of escrever) {
      if (sim && (await readFile(arquivoDados(nome), 'utf8')) !== texto) sair(`a conferência de ${nome} depois de gravar falhou. Restaure do backup ${SUFIXO}.`);
    }
    if (mudouReel.size) {
      const { regravarSeGerado } = await import('./reelmd.mjs');
      for (const id of mudouReel) {
        const r = db.reels.find((x) => x.id === id);
        try {
          const pasta = await regravarSeGerado(r);
          reelMd.push(pasta ? `${id}: ${r.origem}` : `${id}: sem reel.md gerado pelo app (escrito à mão), não regravado`);
        } catch (e) {
          avisos.push(`reel.md de ${id}: ${e.message}`);
        }
      }
    }
  }

  // ---------- resumo ----------
  const linha = (p) => `  ${p.tipo} ${p.codigo ?? p.id} · ${p.veredito ?? ''} · ${p.aplicadas} troca(s) aplicada(s)${p.ja ? `, ${p.ja} já estava(m)` : ''}${p.titulo ? ` · ${p.titulo}` : ''}`;
  const aplicadas = plano.reduce((s, p) => s + p.aplicadas, 0);
  const linhas = [
    `== Regra P38 (fazer sozinho) ${SIMULAR ? '(simulação) ' : ''}==`,
    `Trechos de "faça sozinho" no escopo antes: ${varreduraAntes.length} · depois: ${varreduraDepois.length}`,
    ...(DETALHE ? varreduraAntes.map((x) => `  antes · ${x}`) : []),
    `Itens no JSON: ${plano.length} (${plano.filter((p) => p.tipo === 'ideia').length} ideias, ${plano.filter((p) => p.tipo === 'reel').length} reels sem data, ${plano.filter((p) => p.tipo === 'formato').length} formatos, ${plano.filter((p) => p.tipo === 'tema').length} temas, ${plano.filter((p) => p.tipo === 'estilo').length} estilos) · trocas aplicadas nesta rodada: ${aplicadas}`,
    ...plano.map(linha),
    `Arquivos: db.json ${muda.db ? 'muda' : 'igual'} · biblioteca.json ${muda.bib ? 'muda' : 'igual'} · estilos.json ${muda.est ? 'muda' : 'igual'}`,
    `Intocados conferidos: ${[...intocados.keys()].filter((k) => k.startsWith('reel')).length} peças com data e ${[...intocados.keys()].filter((k) => k.startsWith('ideia')).length} ideias ligadas a elas`,
    ...(reelMd.length ? ['reel.md:', ...reelMd.map((x) => `  - ${x}`)] : []),
    ...(avisos.length ? ['Avisos:', ...avisos.map((x) => `  - ${x}`)] : []),
    !algo ? 'Nada mudou: este conteúdo já estava aplicado.'
      : SIMULAR ? 'Simulação: nada foi gravado. Rode sem --simular pra aplicar.'
        : `Pronto. Backup de antes da primeira rodada: ${backups.join(' · ')}${muda.bib || muda.est ? '\nSuba o servidor de novo pra Biblioteca e o Guia novos entrarem (o guia é lido no boot).' : ''}`,
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
