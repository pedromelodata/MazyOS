// 22/10 (Pedro): as chamadas do estúdio (contrato das rotas /api/estudio/*). As respostas são lidas com folga: um
// documento pode vir solto ou em { doc }, uma lista solta ou em { docs } / { assets } / { itens }, pra a tela não
// quebrar se o servidor embrulhar diferente. Corpo cru (upload de asset e exportação) vai por fetch/XHR com os
// cabeçalhos do contrato; o resto pelo api() do core (JSON, 401 manda pra entrar).
import { api, sessaoCaiu } from '../core.js';

const enc = encodeURIComponent;
const umDoc = (r) => r?.doc ?? r?.documento ?? r;
const umaLista = (r, chaves) => (Array.isArray(r) ? r : chaves.map((k) => r?.[k]).find(Array.isArray) ?? []);

export const listarDocs = async () => umaLista(await api('GET', '/api/estudio/docs'), ['docs', 'documentos', 'itens', 'lista']);
export const lerDoc = async (id) => umDoc(await api('GET', `/api/estudio/docs/${enc(id)}`));
export const criarDoc = async (corpo) => umDoc(await api('POST', '/api/estudio/docs', corpo));
export const salvarDoc = async (id, corpo) => umDoc(await api('PUT', `/api/estudio/docs/${enc(id)}`, corpo));
export const apagarDoc = (id) => api('DELETE', `/api/estudio/docs/${enc(id)}`);
export const duplicarDoc = async (id) => umDoc(await api('POST', `/api/estudio/docs/${enc(id)}/duplicar`, {}));
export const listarVersoes = async (id) => umaLista(await api('GET', `/api/estudio/docs/${enc(id)}/versoes`), ['versoes', 'itens', 'lista']);
export const restaurarVersao = async (id, n, versao) => umDoc(await api('POST', `/api/estudio/docs/${enc(id)}/versoes/${enc(n)}/restaurar`, versao != null ? { versao } : {}));
// 23/10 (Pedro): as páginas montadas de novo com o texto da peça ligada, como versão nova
export const remontarDaPeca = async (id, versao) => umDoc(await api('POST', `/api/estudio/docs/${enc(id)}/remontar`, versao != null ? { versao } : {}));
export const gerarComIA = async (corpo) => umDoc(await api('POST', '/api/estudio/gerar', corpo));
// 22/10 (Pedro): os modelos de layout (estudio/base/modelos/*.json no repo): cada um é um documento inteiro (formato,
// páginas e camadas) com nome, descrição e tipo. Lido com folga como o resto ({ modelos } ou a lista solta)
export const listarModelos = async () => umaLista(await api('GET', '/api/estudio/modelos'), ['modelos', 'itens', 'lista']);
export async function alertasMecanismo(docId) {
  const r = await api('GET', `/api/estudio/mecanismo?docId=${enc(docId)}`);
  return umaLista(r, ['alertas', 'itens']);
}

export const listarAssets = async ({ ocultos = true } = {}) => umaLista(await api('GET', `/api/estudio/assets${ocultos ? '?ocultos=1' : ''}`), ['assets', 'itens', 'lista']);
export const editarAsset = async (id, corpo) => { const r = await api('PUT', `/api/estudio/assets/${enc(id)}`, corpo); return r?.asset ?? r; };
// upload que está em algum design: o servidor responde 409 com os usos; forcar apaga mesmo assim
export const apagarAsset = (id, { forcar = false } = {}) => api('DELETE', `/api/estudio/assets/${enc(id)}${forcar ? '?forcar=1' : ''}`);
export const restaurarAsset = async (id) => { const r = await api('POST', `/api/estudio/assets/${enc(id)}/restaurar`, {}); return r?.asset ?? r; };

function erroDaResposta(status, j, padrao) {
  if (sessaoCaiu(status, j)) return Object.assign(new Error('Sua sessão acabou. Entre de novo.'), { status, parar: true });
  return Object.assign(new Error(j?.erro || padrao || `Erro ${status}`), { status, corpo: j });
}

// sobe uma imagem pro banco de assets (corpo cru, com progresso; XMLHttpRequest porque o fetch não dá o progresso)
export function subirAsset(arquivo, { categoria = 'outro', tags = [], nome = '' } = {}, aoProgresso = () => {}) {
  return new Promise((ok, falhou) => {
    const x = new XMLHttpRequest();
    x.open('POST', '/api/estudio/assets');
    x.setRequestHeader('x-nome-arquivo', enc(nome || arquivo.name || 'imagem'));
    x.setRequestHeader('x-categoria', enc(categoria));
    x.setRequestHeader('x-tags', enc((Array.isArray(tags) ? tags : String(tags).split(',')).map((t) => String(t).trim()).filter(Boolean).join(',')));
    x.setRequestHeader('content-type', arquivo.type || 'application/octet-stream');
    x.upload.onprogress = (e) => { if (e.lengthComputable && e.total) aoProgresso(Math.min(99, Math.round((e.loaded / e.total) * 100))); };
    x.onload = () => {
      let j = {};
      try { j = JSON.parse(x.responseText || '{}'); } catch { /* resposta sem JSON */ }
      if (x.status >= 200 && x.status < 300) { aoProgresso(100); ok(j?.asset ?? j); return; }
      const padrao = x.status === 413 ? 'A imagem passa de 30 MB.' : x.status === 415 ? 'Só PNG, JPEG ou WEBP.' : null;
      falhou(erroDaResposta(x.status, j, padrao));
    };
    x.onerror = () => falhou(new Error('A conexão caiu no meio da subida. Tente de novo.'));
    x.onabort = () => falhou(new Error('A subida foi interrompida.'));
    x.send(arquivo);
  });
}

// manda o arquivo exportado no navegador (PNG, JPEG ou PDF); com peça vinculada, o servidor anexa nela
export async function enviarExportacao(docId, blob, { pagina = 'todas', formato = 'png' } = {}) {
  let r;
  try {
    r = await fetch(`/api/estudio/docs/${enc(docId)}/exportacoes`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': blob.type || 'application/octet-stream', 'x-pagina': String(pagina), 'x-formato': formato },
      body: blob,
    });
  } catch {
    throw new Error('Sem conexão com o servidor');
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw erroDaResposta(r.status, j);
  return j?.exportacao ?? j?.arte ?? j;
}
