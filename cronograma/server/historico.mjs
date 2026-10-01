// Histórico das leituras de cada mídia nossa (Métricas, 30/09/2026; SPEC-METRICAS.md §2.1 e §3.2), em
// data/historico-midias.json. A Meta só dá o acumulado da vida do post, com atraso de até 48h e sem série
// por idade: pra comparar peças na mesma idade (7 dias, ritmo das primeiras horas) a gente guarda uma leitura
// por sincronização em que a mídia ganhou insight novo (instagram.mjs chama registrar). Decisões:
//  - a forma do arquivo, a da leitura e a poda moram em instagram-motor.mjs (puro), pra testar sem disco
//  - cache em memória e fila de escrita (molde monitoramento.mjs). O arquivo é registro nosso, não cache: a API
//    não refaz a série por idade, então ele entra no git (30/09)
//  - arquivo ilegível (JSON quebrado, preso por outro processo) não vira vazio: lerJsonEstrito lança 503, nada
//    vai pro cache (a próxima chamada tenta de novo) e nada é gravado por cima. Antes (lerJson), a sincronização
//    seguinte regravava o arquivo só com as leituras novas e a série por idade sumia
//  - uma leitura só do disco por boot: chamadas juntas na primeira carga recebem o mesmo objeto (duas cargas
//    criavam dois objetos, e a gravação de uma sumia com as leituras que o registrar pôs na outra)
//  - só id numérico da Meta vira chave (nada de __proto__ vindo de arquivo editado à mão)
import { lerJsonEstrito, gravarJson, agora } from './db.mjs';
import { juntarLeitura, valorNaIdade, formaHistorico } from './instagram-motor.mjs';

export { valorNaIdade };

const ARQUIVO = 'historico-midias.json';
const ID_MIDIA = /^\d{1,40}$/;

let cache = null;
let carregando = null;
let fila = Promise.resolve();

// o arquivo inteiro, com a forma garantida: { versao: 1, midias: { [midiaId]: { publicadoEm, tipo, leituras } } }
export function ler() {
  if (cache) return Promise.resolve(cache);
  carregando ??= lerJsonEstrito(ARQUIVO, null)
    .then((bruto) => (cache = formaHistorico(bruto)))
    .catch((e) => {
      carregando = null; // tenta de novo na próxima vez; o erro sobe (a rota responde 503)
      throw e;
    });
  return carregando;
}

// só grava o cache que veio de uma leitura boa (quem chama passou pelo ler() antes)
function gravar() {
  const proxima = fila.then(() => gravarJson(ARQUIVO, cache));
  fila = proxima.catch((e) => console.error('Falha ao gravar historico-midias.json:', e.message));
  return proxima;
}

// itens: proprios/postsProprios com insight lido AGORA. Devolve quantas mídias ganharam leitura
export async function registrar(itens, em = agora()) {
  const h = await ler();
  let n = 0;
  for (const item of Array.isArray(itens) ? itens : []) {
    const id = String(item?.midiaId ?? '');
    if (!ID_MIDIA.test(id)) continue;
    const nova = juntarLeitura(h.midias[id], item, em);
    if (!nova || nova === h.midias[id]) continue;
    h.midias[id] = nova;
    n++;
  }
  if (n) await gravar();
  return n;
}

// [] quando não tem (cópia: quem usa não mexe no cache)
export async function leiturasDe(midiaId) {
  const id = String(midiaId ?? '');
  if (!ID_MIDIA.test(id)) return [];
  return ((await ler()).midias[id]?.leituras ?? []).map((l) => ({ ...l }));
}

// o objeto midias inteiro (cópia rasa)
export async function todas() {
  return { ...(await ler()).midias };
}
