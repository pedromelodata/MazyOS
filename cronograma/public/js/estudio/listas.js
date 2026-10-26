// 26/10 (Pedro: "tem que ter um slide explicativo para cada um"): a lista espremida num slide do carrossel conta um
// slide por item nas páginas da peça. A mesma conta de server/listas-carrossel.mjs (o teste listas-carrossel confere
// que as duas dão igual): lista é a numeração de 1 até pelo menos 3 ou 3 linhas com marcador

const NUMERO_DE_ITEM = /(?:^|[\s·•;|(])(\d{1,2})[.)]\s+(?=[^\s\d])/gu;
const LINHA_COM_MARCADOR = /^\s*[•◦▪●]\s*\S/u;

export function itensDeLista(texto) {
  const s = String(texto ?? '');
  const numeros = new Set([...s.matchAll(NUMERO_DE_ITEM)].map((m) => Number(m[1])));
  let n = 0;
  while (numeros.has(n + 1)) n += 1;
  if (n >= 3) return n;
  const marcadas = s.split(/\r?\n/).filter((l) => LINHA_COM_MARCADOR.test(l)).length;
  return marcadas >= 3 ? marcadas : 0;
}

// as páginas do carrossel da peça ({ capa, slides, final }) com cada lista aberta: a capa, um slide por item e o fim
export function paginasDoCarrossel(ca) {
  const c = ca && typeof ca === 'object' ? ca : {};
  const lista = [c.capa, ...(Array.isArray(c.slides) ? c.slides : []), c.final];
  const itens = (s) => itensDeLista([s?.titulo, s?.texto].filter((x) => typeof x === 'string').join('\n'));
  return 2 + lista.slice(1, -1).reduce((n, s) => n + Math.max(1, itens(s)), 0) + itens(lista.at(-1));
}
