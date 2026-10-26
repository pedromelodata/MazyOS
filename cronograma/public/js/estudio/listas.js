// 26/10 (Pedro: "tem que ter um slide explicativo para cada um"): a lista espremida num slide do carrossel conta um
// slide por item nas páginas da peça, e a capa ou a ideia que promete N coisas ("5 sinais de que...") pede pelo menos N
// slides de item (Pedro: "se o carrossel for de 5 coisas, deve ter no mínimo 5 [slides] e um no final com um CTA"). A
// mesma conta de server/listas-carrossel.mjs (o teste listas-carrossel confere que as duas dão igual)

const NUMERO_DE_ITEM = /(?:^|[\s·•;|(])(\d{1,2})[.)]\s+(?=[^\s\d])/gu;
const LINHA_COM_MARCADOR = /^\s*[•◦▪●]\s*\S/u;
const POR_EXTENSO = { tres: 3, três: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10 };
const PROMESSA = /^[\s"'“”‘’«»(*_-]*(?:(?:os|as|esses|essas|estes|estas|seus|suas|só)\s+)?(\d{1,2}|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez)\s+([\p{L}]+)/iu;
const UNIDADES = new Set(['dias', 'meses', 'anos', 'horas', 'minutos', 'segundos', 'semanas', 'vezes', 'reais', 'mil', 'milhões', 'primeiros', 'últimos', 'colaboradores', 'sócios', 'pessoas']);

export function itensDeLista(texto) {
  const s = String(texto ?? '');
  const numeros = new Set([...s.matchAll(NUMERO_DE_ITEM)].map((m) => Number(m[1])));
  let n = 0;
  while (numeros.has(n + 1)) n += 1;
  if (n >= 3) return n;
  const marcadas = s.split(/\r?\n/).filter((l) => LINHA_COM_MARCADOR.test(l)).length;
  return marcadas >= 3 ? marcadas : 0;
}

export function itensPrometidos(texto) {
  const m = PROMESSA.exec(String(texto ?? ''));
  if (!m) return 0;
  const palavra = m[2].toLowerCase();
  if (!palavra.endsWith('s') || UNIDADES.has(palavra)) return 0;
  const n = /^\d+$/.test(m[1]) ? Number(m[1]) : POR_EXTENSO[m[1].toLowerCase()] ?? 0;
  return n >= 3 && n <= 10 ? n : 0;
}

// as páginas do carrossel da peça ({ capa, slides, final }) com um slide por item: a capa, os itens e o fim. promessa:
// a ideia da peça, que também pode prometer as N coisas
export function paginasDoCarrossel(ca, { promessa = '' } = {}) {
  const c = ca && typeof ca === 'object' ? ca : {};
  const lista = [c.capa, ...(Array.isArray(c.slides) ? c.slides : []), c.final];
  const texto = (s) => [s?.titulo, s?.texto].filter((x) => typeof x === 'string').join('\n');
  const entregues = lista.slice(1, -1).reduce((n, s) => n + Math.max(1, itensDeLista(texto(s))), 0) + itensDeLista(texto(lista.at(-1)));
  return 2 + Math.max(entregues, itensPrometidos(texto(lista[0])), itensPrometidos(promessa));
}
