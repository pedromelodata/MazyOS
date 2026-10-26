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

// o texto de um slide da peça ({ titulo, texto }) ou de uma página do design (os textos dela, já juntos numa string)
const textoDoSlide = (s) => (typeof s === 'string' ? s : [s?.titulo, s?.texto].filter((x) => typeof x === 'string').join('\n'));

// os slides com lista, na ordem da capa ao fim: [{ indice (1 = capa), itens }]
export const slidesComLista = (slides) => (Array.isArray(slides) ? slides : [])
  .map((s, i) => ({ indice: i + 1, itens: itensDeLista(textoDoSlide(s)) }))
  .filter((x) => x.itens > 0);

// as páginas do carrossel com cada lista aberta: a capa, um slide por item e o fim. O slide do meio com lista vira os
// itens dela; a lista do slide final ganha os slides dela antes do fim; a capa fica uma página só. Os slides vão na
// ordem, da capa ao fim
export function paginasAbrindoListas(slides) {
  const lista = Array.isArray(slides) ? slides : [];
  if (lista.length < 2) return lista.length;
  const meio = lista.slice(1, -1).reduce((n, s) => n + Math.max(1, itensDeLista(textoDoSlide(s))), 0);
  return 2 + meio + itensDeLista(textoDoSlide(lista.at(-1)));
}
