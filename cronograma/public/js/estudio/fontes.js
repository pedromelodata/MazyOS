// 22/10 (Pedro): as fontes do estúdio. O editor e a exportação usam os MESMOS bytes (pasta fontes/, OFL): a Sora
// variável (100 a 800, o design guide para no 800) e a DM Serif Display Italic (a ênfase que o Pedro pediu).
// Por que não o Google Fonts da casca: a CSP do app só deixa o fetch na própria origem (connect-src 'self'), e a
// exportação precisa dos bytes pra embutir em base64 no SVG. A FontFace feita de ArrayBuffer não passa pelo
// font-src (não busca URL nenhuma); se o navegador recusar mesmo assim, o editor cai na Sora do Google da casca
// (a mesma família) e a exportação segue com os bytes daqui.

const PASTA = new URL('./fontes/', import.meta.url).href;

export const FONTES = [
  {
    id: 'Sora', familia: 'Sora Estudio', reserva: '"Sora", sans-serif', arquivo: 'Sora-wght.ttf',
    formato: 'truetype', mime: 'font/ttf', descritores: { weight: '100 800', style: 'normal' },
  },
  {
    id: 'DM Serif Display', familia: 'DM Serif Estudio', reserva: '"DM Serif Display", Georgia, serif', arquivo: 'DMSerifDisplay-Italic.ttf',
    formato: 'truetype', mime: 'font/ttf', descritores: { weight: '400', style: 'italic' },
  },
];

const porId = new Map(FONTES.map((f) => [f.id, f]));
export const familiaCss = (fonte) => {
  const f = porId.get(fonte) ?? FONTES[0];
  return `"${f.familia}", ${f.reserva}`;
};

const bytes = new Map(); // id -> ArrayBuffer
let carregando = null;
let registradas = false;

async function buscar(f) {
  const r = await fetch(PASTA + f.arquivo, { credentials: 'same-origin' });
  if (!r.ok) throw new Error(`A fonte ${f.id} não carregou (${r.status})`);
  return r.arrayBuffer();
}

// busca os bytes uma vez e registra as famílias no document.fonts; devolve quando dá pra medir texto
export function carregarFontes() {
  carregando ??= (async () => {
    for (const f of FONTES) bytes.set(f.id, await buscar(f));
    if (typeof FontFace === 'function' && document.fonts) {
      try {
        for (const f of FONTES) {
          const face = new FontFace(f.familia, bytes.get(f.id).slice(0), f.descritores);
          await face.load();
          document.fonts.add(face);
        }
        registradas = true;
      } catch (e) {
        console.warn('Estúdio: as fontes não registraram no editor; a tela usa a Sora da casca', e);
      }
    }
    return true;
  })().catch((e) => { carregando = null; throw e; });
  return carregando;
}
export const fontesRegistradas = () => registradas;

function base64(buf) {
  const b = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s);
}

let cssCache = null;
// @font-face com os bytes em data: URL, pro SVG da exportação (que não enxerga as fontes da página)
export async function cssFontesEmbutidas() {
  if (cssCache) return cssCache;
  await carregarFontes();
  cssCache = FONTES.map((f) => `@font-face{font-family:"${f.familia}";src:url(data:${f.mime};base64,${base64(bytes.get(f.id))}) format("${f.formato}");font-weight:${f.descritores.weight};font-style:${f.descritores.style};font-display:block}`).join('');
  return cssCache;
}

// confere se a família já está pronta pra desenhar no peso e estilo pedidos
export function fontePronta(fonte, peso = 400, italico = false) {
  const f = porId.get(fonte) ?? FONTES[0];
  try { return document.fonts.check(`${italico ? 'italic ' : ''}${peso} 40px "${f.familia}"`); } catch { return false; }
}
