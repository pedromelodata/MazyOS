// Testes da lista espremida no Ateliê (estudio.mjs, 26/10/2026, Pedro: "tem que ter um slide explicativo para cada
// um"): a peça carrossel com a lista num slide só pede as páginas com a lista aberta, o prompt avisa a IA, e o design
// com a lista aberta vale mesmo quando o pedido traz menos páginas. Sem lista, a conta e a conferência de sempre. Pasta
// de dados temporária e IA falsa: o banco de verdade (data/) não é lido. Rodar: npm run testar
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const raiz = mkdtempSync(path.join(os.tmpdir(), 'cronograma-listas-'));
const dados = path.join(raiz, 'data');
const base = path.join(raiz, 'base');
process.env.CRONOGRAMA_DATA = dados;
process.env.CRONOGRAMA_ESTUDIO_BASE = base;
// a IA de verdade nunca roda no teste
process.env.CRONOGRAMA_IA = '0';
mkdirSync(dados, { recursive: true });
mkdirSync(path.join(base, 'docs'), { recursive: true });
writeFileSync(path.join(dados, 'estilos.json'), '{}');
after(() => rmSync(raiz, { recursive: true, force: true }));

const BLOCO = { 1: 'Afeto', 2: 'Afeto', 3: 'Afeto', 4: 'Educação', 5: 'Educação', 16: 'Educação', 8: 'Diferencial', 9: 'Diferencial', 17: 'Diferencial', 10: 'Conversão', 11: 'Conversão', 12: 'Conversão', 13: 'Conversão' };
const pilares = Object.keys(BLOCO).map(Number).sort((a, b) => a - b).map((id) => ({ id, nome: `Pilar ${id}`, bloco: BLOCO[id] }));
const CAPA = 'As 5 dores de quem tem empresa';
const LISTA = '1. Guia apertada · 2. Nota caçada · 3. Resposta demorada · 4. Só contabilês · 5. Papelada infinita';
const peca = (id, carrossel) => ({
  id, ideia: `Peça ${id}`, data: '2099-05-12', peca: 'carrossel', pilar: 4, bloco: 'Educação', status: 'roteiro', legenda: '', fontes: [],
  motivo: 'A dor da burocracia contada item por item.', gatilhoEmocional: 'cansaço da burocracia', gatilhoPsicologico: 'identificação',
  roteiro: { hook: '', textoTela: '', cenas: [], desenvolvimento: '', cta: '' }, carrossel, estatico: {}, aprovacao: null,
});
writeFileSync(path.join(dados, 'db.json'), JSON.stringify({
  schemaVersion: 2, pilares, campanhas: [{ id: 'cmp_prelancamento', nome: 'Pré-lançamento' }],
  reels: [
    // o print do Pedro: a capa e o fim com a lista inteira (saiu 02 / 02)
    peca('reel_lista', { capa: { titulo: CAPA, texto: '', visual: '' }, slides: [], final: { titulo: 'Bateu algum?', texto: `${LISTA}\nSalva pra quando bater a dúvida.`, visual: '' } }),
    peca('reel_sem_lista', { capa: { titulo: CAPA, texto: '', visual: '' }, slides: [{ titulo: 'Guia apertada', texto: 'O mês aperta e a guia chega junto.', visual: '' }], final: { titulo: 'Salva pra quando bater a dúvida.', texto: '', visual: '' } }),
  ],
  stories: [],
}));

const estudio = await import('../estudio.mjs');
estudio.definirFonteAssets(() => [
  { id: 'ast_leo', nome: 'Léo acenando', categoria: 'leo', tags: ['leo'], descricao: 'O suricato acenando', origem: 'base', largura: 800, altura: 1200 },
  { id: 'ast_simbolo', nome: 'Símbolo da marca', categoria: 'marca', tags: ['simbolo', 'visto'], descricao: 'Quadrado coral com o visto', origem: 'base', largura: 200, altura: 200 },
]);
after(() => estudio.definirIa(null));
const QUEM = { id: 'usr_listas', nome: 'Pedro Maia', usuario: 'maia', papel: 'operador' };

const camada = (texto, y) => ({
  tipo: 'texto', nome: 'Texto', x: 72, y, largura: 900, altura: 80, rotacao: 0, opacidade: 1, texto, fonte: 'Sora', peso: 700, italico: false, tamanho: 54,
  cor: '#1b1e24', corDestaque: '#f2643c', alinhamento: 'esquerda', alturaLinha: 1.2, espacamentoLetra: 0, caixa: 'normal',
  pilula: { ativa: false, cor: '', raio: 0, padding: 0 }, assetId: '', espelhar: false, raio: 0, forma: 'retangulo', borda: { ativa: false, cor: '', largura: 0 },
});
const fundo = { tipo: 'cor', cor: '#faf8f5', cor2: '#f1eee9', angulo: 160, assetId: '', ajuste: 'cobrir' };
// o design que a IA falsa devolve: a capa da peça e mais n - 1 páginas, uma frase curta em cada
const design = (n) => ({
  titulo: 'As 5 dores', ganchoOrigem: 'G20', fontes: [], observacoes: '',
  estrategia: { pilar: 4, motivo: 'A dor da burocracia contada item por item.', gatilhoEmocional: 'Cansaço da burocracia', gatilhoPsicologico: 'identificação', angulo: '' },
  paginas: Array.from({ length: n }, (_, i) => ({ fundo, camadas: [camada(i === 0 ? CAPA : `Item ${i}`, 300)] })),
});
function iaQueDevolve(n) {
  const chamadas = [];
  estudio.definirIa(async (args) => {
    chamadas.push(args);
    return { dados: design(n), custo: 0.01 };
  });
  return chamadas;
}
const pediuPaginas = (r) => (r.geracao?.problemasDaPrimeira ?? []).filter((p) => /^Pedi \d+/.test(p));

test('Criar no Ateliê: a peça com a lista no fim pede 7 páginas e o prompt manda abrir a lista', async () => {
  const chamadas = iaQueDevolve(7);
  const r = await estudio.gerar({ pecaId: 'reel_lista', skill: true }, QUEM);
  assert.equal(r.paginas.length, 7);
  assert.deepEqual(pediuPaginas(r), []);
  const { prompt } = chamadas[0];
  assert.match(prompt, /, 7 páginas \(capa, slides do meio e o slide final\)/, 'o pedido já vem com a lista aberta');
  assert.match(prompt, /Lista espremida: o slide 2 traz 5 itens/);
  assert.match(prompt, /o design sai com 7 páginas \(a capa, um slide por item e o fim\)/);
});

test('pedido com menos páginas: vale o pedido ou a lista aberta, e o erro diz as duas', async () => {
  iaQueDevolve(7);
  const aberta = await estudio.gerar({ pecaId: 'reel_lista', paginas: 2 }, QUEM);
  assert.equal(aberta.paginas.length, 7);
  assert.deepEqual(pediuPaginas(aberta), [], 'a lista aberta vale');
  iaQueDevolve(2);
  assert.deepEqual(pediuPaginas(await estudio.gerar({ pecaId: 'reel_lista', paginas: 2 }, QUEM)), [], 'o pedido também vale');
  iaQueDevolve(3);
  assert.deepEqual(pediuPaginas(await estudio.gerar({ pecaId: 'reel_lista', paginas: 2 }, QUEM)), ['Pedi 2 páginas (ou 7, com a lista aberta em um slide por item) e vieram 3.']);
});

test('sem lista: a conta e a conferência de sempre', async () => {
  const chamadas = iaQueDevolve(3);
  const r = await estudio.gerar({ pecaId: 'reel_sem_lista', skill: true }, QUEM);
  assert.equal(r.paginas.length, 3);
  assert.deepEqual(pediuPaginas(r), []);
  assert.ok(!chamadas[0].prompt.includes('Lista espremida'));
  iaQueDevolve(4);
  assert.deepEqual(pediuPaginas(await estudio.gerar({ pecaId: 'reel_sem_lista', paginas: 3 }, QUEM)), ['Pedi 3 páginas e vieram 4.']);
});
