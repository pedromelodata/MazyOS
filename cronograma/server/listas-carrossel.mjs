// Lista espremida num slide do carrossel (26/10, Pedro, sobre um carrossel de 2 slides com 5 dores numa lista só: "tem
// que ter um slide explicativo para cada um"): a lista abre em um slide por item, com a capa antes e o fim depois.
// Lista é a numeração que começa em 1 e chega pelo menos a 3 ("1. Guia apertada · 2. Nota caçada · 3. Resposta
// demorada", numa linha ou uma por linha) ou 3 linhas ou mais que começam com marcador (•, ◦, ▪, ●). Preço, data e
// número solto ("R$ 99.", "dia 20.", "10/11.") não contam: a numeração precisa da sequência 1, 2, 3. Usado no gerador da
// semana (o slide com lista volta pra IA), no estúdio (as páginas da peça e o que o design pode ter) e, com a mesma
// conta, no front (public/js/estudio/dialogos.js)

const NUMERO_DE_ITEM = /(?:^|[\s·•;|(])(\d{1,2})[.)]\s+(?=[^\s\d])/gu;
const LINHA_COM_MARCADOR = /^\s*[•◦▪●]\s*\S/u;

// quantos itens de lista o texto traz (3 ou mais), ou 0 quando o slide é de uma ideia só
export function itensDeLista(texto) {
  const s = String(texto ?? '');
  const numeros = new Set([...s.matchAll(NUMERO_DE_ITEM)].map((m) => Number(m[1])));
  let n = 0;
  while (numeros.has(n + 1)) n += 1;
  if (n >= 3) return n;
  const marcadas = s.split(/\r?\n/).filter((l) => LINHA_COM_MARCADOR.test(l)).length;
  return marcadas >= 3 ? marcadas : 0;
}

// 26/10 (Pedro: "se o carrossel for de 5 coisas, deve ter no mínimo 5 [slides] e um no final com um CTA"): quantas
// coisas a capa ou a ideia promete, pelo número no começo da frase ("5 sinais de que...", "As 5 dores...", "Três
// coisas que..."), mesmo quando a peça ainda não escreveu os itens. Unidade de medida (dias, meses, reais, mil...) não é
// promessa de itens; vale de 3 a 10, senão 0
const POR_EXTENSO = { tres: 3, três: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10 };
const PROMESSA = /^[\s"'“”‘’«»(*_-]*(?:(?:os|as|esses|essas|estes|estas|seus|suas|só)\s+)?(\d{1,2}|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez)\s+([\p{L}]+)/iu;
const UNIDADES = new Set(['dias', 'meses', 'anos', 'horas', 'minutos', 'segundos', 'semanas', 'vezes', 'reais', 'mil', 'milhões', 'primeiros', 'últimos', 'colaboradores', 'sócios', 'pessoas']);
export function itensPrometidos(texto) {
  const m = PROMESSA.exec(String(texto ?? ''));
  if (!m) return 0;
  const palavra = m[2].toLowerCase();
  if (!palavra.endsWith('s') || UNIDADES.has(palavra)) return 0;
  const n = /^\d+$/.test(m[1]) ? Number(m[1]) : POR_EXTENSO[m[1].toLowerCase()] ?? 0;
  return n >= 3 && n <= 10 ? n : 0;
}

// o texto de um slide da peça ({ titulo, texto }) ou de uma página do design (os textos dela, já juntos numa string)
const textoDoSlide = (s) => (typeof s === 'string' ? s : [s?.titulo, s?.texto].filter((x) => typeof x === 'string').join('\n'));

// os slides com lista, na ordem da capa ao fim: [{ indice (1 = capa), itens }]
export const slidesComLista = (slides) => (Array.isArray(slides) ? slides : [])
  .map((s, i) => ({ indice: i + 1, itens: itensDeLista(textoDoSlide(s)) }))
  .filter((x) => x.itens > 0);

// os itens que os slides entregam: o slide do meio conta 1 (ou os itens da lista dele) e a lista do slide final conta
// os itens dela
const itensEntregues = (lista) => lista.slice(1, -1).reduce((n, s) => n + Math.max(1, itensDeLista(textoDoSlide(s))), 0)
  + itensDeLista(textoDoSlide(lista.at(-1)));
const prometidosDe = (lista, promessa) => Math.max(itensPrometidos(textoDoSlide(lista[0])), itensPrometidos(promessa));

// as páginas do carrossel com um slide por item: a capa, os itens e o fim. O slide do meio com lista vira os itens
// dela; a lista do slide final ganha os slides dela antes do fim; a capa fica uma página só; e a capa ou a ideia
// (promessa) que promete N coisas pede pelo menos N slides de item. Os slides vão na ordem, da capa ao fim
export function paginasAbrindoListas(slides, { promessa = '' } = {}) {
  const lista = Array.isArray(slides) ? slides : [];
  if (lista.length < 2) return lista.length;
  return 2 + Math.max(itensEntregues(lista), prometidosDe(lista, promessa));
}

// a promessa que os slides não cumprem ("5 sinais" com 1 slide do meio): { prometidos, entregues }, ou null
export function promessaSemSlides(slides, { promessa = '' } = {}) {
  const lista = Array.isArray(slides) ? slides : [];
  if (lista.length < 2) return null;
  const prometidos = prometidosDe(lista, promessa);
  const entregues = itensEntregues(lista);
  return prometidos > entregues ? { prometidos, entregues } : null;
}
