// Fumaça do front das Aprovações técnicas (21/10, Pedro): a regra de quem vê "Ajustar mesmo aprovada", rodando no
// Node sem navegador. core.js mexe no document ao carregar: os globais mínimos entram antes do import (por isso
// import dinâmico). Rodar: node --test "server/testes/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';

const nada = () => {};
const elementoFalso = () => ({
  style: {}, dataset: {}, hidden: true, setAttribute: nada, getAttribute: () => null, removeAttribute: nada,
  append: nada, appendChild: nada, remove: nada, addEventListener: nada, removeEventListener: nada,
  querySelector: () => null, querySelectorAll: () => [], classList: { add: nada, remove: nada, toggle: nada, contains: () => false },
});
globalThis.window = globalThis;
globalThis.document = {
  documentElement: { dataset: { theme: 'dark' } },
  body: elementoFalso(),
  activeElement: null,
  visibilityState: 'visible',
  addEventListener: nada,
  removeEventListener: nada,
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  createElement: elementoFalso,
};
globalThis.location = { hash: '#/aprovacoes', pathname: '/', search: '', href: 'http://localhost/' };
globalThis.addEventListener = nada;
globalThis.removeEventListener = nada;
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null, setItem: nada, removeItem: nada }, configurable: true, writable: true });

const { store, minhaVez, ajustaAprovada, infoAprovacao, observacoesDaRodada, DECISAO } = await import('../../public/js/core.js');

const aprovada = (extra = {}) => ({ id: 'reel_1', peca: 'reel', status: 'roteiro', aprovacao: { estado: 'aprovado', etapa: 'diretor', decididoPor: 'Ana' }, ...extra });
const comConta = (usuario, fn) => {
  const antes = store.usuario;
  store.usuario = usuario;
  try { return fn(); } finally { store.usuario = antes; }
};
const mauro = { id: 'usr_d', nome: 'Diretor', papel: 'diretor', acesso: 'pin', ajustaDepoisDeAprovada: true };

test('o diretor com ajustaDepoisDeAprovada ajusta peça e envio aprovados', () => {
  comConta(mauro, () => {
    assert.equal(ajustaAprovada(), true);
    assert.equal(minhaVez(aprovada()), 'ajustarAprovada');
    assert.equal(minhaVez({ id: 'env_1', envio: true, aprovacao: { estado: 'aprovado', etapa: 'diretor' } }), 'ajustarAprovada');
  });
});

test('peça já postada não oferece "Ajustar mesmo aprovada" (o servidor recusa com 409)', () => {
  comConta(mauro, () => assert.equal(minhaVez(aprovada({ status: 'publicado' })), null));
});

test('ajustaDepoisDeAprovada só vale pro Diretor contábil (o servidor exige o mesmo)', () => {
  for (const papel of ['gerente', 'admin', 'operador']) {
    comConta({ ...mauro, papel, acesso: 'senha' }, () => {
      assert.equal(ajustaAprovada(), false, papel);
      assert.equal(minhaVez(aprovada()), null, papel);
    });
  }
  comConta({ ...mauro, ajustaDepoisDeAprovada: false }, () => assert.equal(minhaVez(aprovada()), null));
});

test('a vez do gerente e do diretor na peça pendente continua a mesma', () => {
  const pendente = (etapa, aprovaram = []) => ({ id: 'reel_2', peca: 'reel', aprovacao: { estado: 'pendente', etapa, gerentes: { aprovaram } } });
  comConta({ id: 'usr_g', nome: 'Gerente', papel: 'gerente' }, () => {
    assert.equal(minhaVez(pendente('gerentes')), 'decidir');
    assert.equal(minhaVez(pendente('gerentes', [{ id: 'usr_g', nome: 'Gerente' }])), 'aguardar');
    assert.equal(minhaVez(pendente('diretor')), null);
  });
  comConta(mauro, () => {
    assert.equal(minhaVez(pendente('diretor')), 'decidir');
    assert.equal(minhaVez(pendente('gerentes')), null);
  });
});

// 22/10 (Pedro): as decisões são "Aprovado", "Aprovado com observação" e "Reprovado", com o nome de quem decidiu, na
// mesma forma na peça, no envio e no story (Story · tema, no singular)
const itens = (aprovacao) => [
  { id: 'reel_3', peca: 'reel', aprovacao },
  { id: 'env_3', envio: true, aprovacao },
  { id: 'sto_3', stories: true, aprovacao },
];
const decidida = (extra = {}) => ({ estado: 'aprovado', etapa: 'diretor', rodada: 1, decididoPor: 'Ana Souza', decididoPorId: 'usr_d', decididoEm: '2026-10-22T15:00:00.000Z', ...extra });

test('as três decisões têm exatamente estes nomes', () => {
  assert.deepEqual(DECISAO, { aprovado: 'Aprovado', observacao: 'Aprovado com observação', reprovado: 'Reprovado' });
});

test('"Aprovado por <nome>" na peça, no envio e no story, com o escudo', () => {
  for (const r of itens(decidida())) {
    const i = infoAprovacao(r);
    assert.equal(i.nome, 'Aprovado', r.id);
    assert.equal(i.curto, 'Aprovado por Ana', r.id);
    assert.equal(i.rotulo, 'Aprovado por Ana Souza', r.id);
    assert.equal(i.icone, 'escudo', r.id);
  }
});

test('"Aprovado com observação por <nome>" quando o diretor fechou com observação, com o escudo e o balão', () => {
  const obs = [{ autor: 'Ana Souza', autorId: 'usr_d', papel: 'diretor', etapa: 'diretor', texto: 'Conferir o preço.', em: '2026-10-22T15:00:00.000Z', rodada: 1 }];
  for (const r of itens(decidida({ comObservacao: true, observacoes: obs }))) {
    const i = infoAprovacao(r);
    assert.equal(i.nome, 'Aprovado com observação', r.id);
    assert.equal(i.curto, 'Aprovado com observação por Ana', r.id);
    assert.equal(i.icone, 'escudo-balao', r.id);
    assert.equal(i.estado, 'aprovado', r.id);
  }
});

test('a observação de um gerente marca a aprovação e diz de quem é', () => {
  const obs = [{ autor: 'Pedro Maia', autorId: 'usr_g', papel: 'gerente', etapa: 'gerentes', texto: 'Trocar a foto.', em: '2026-10-22T14:00:00.000Z', rodada: 1 }];
  const i = infoAprovacao({ id: 'reel_4', peca: 'reel', aprovacao: decidida({ observacoes: obs }) });
  assert.equal(i.icone, 'escudo-balao');
  assert.equal(i.rotulo, 'Aprovado por Ana Souza');
  assert.match(i.dica, /Com observação de Pedro Maia/);
});

test('observação de uma ida anterior não conta na de agora', () => {
  const velha = { autor: 'Pedro Maia', autorId: 'usr_g', etapa: 'gerentes', texto: 'Antiga.', em: '2026-10-20T14:00:00.000Z', rodada: 1 };
  const a = decidida({ rodada: 2, observacoes: [velha] });
  assert.deepEqual(observacoesDaRodada(a), []);
  assert.equal(infoAprovacao({ id: 'reel_5', peca: 'reel', aprovacao: a }).nome, 'Aprovado');
});

test('"Reprovado por <nome>" no lugar do ajuste e da sugestão, com a bandeira', () => {
  for (const tipoAjuste of ['sugestao', 'editado']) {
    for (const r of itens({ estado: 'ajuste', etapa: 'gerentes', tipoAjuste, decididoPor: 'Leonam Silva', decididoEm: '2026-10-22T15:00:00.000Z' })) {
      const i = infoAprovacao(r);
      assert.equal(i.nome, 'Reprovado', r.id);
      assert.equal(i.curto, 'Reprovado por Leonam', r.id);
      assert.equal(i.icone, 'bandeira', r.id);
    }
  }
});

test('na etapa dos gerentes, quem aprovou com observação aparece na dica', () => {
  comConta({ id: 'usr_x', nome: 'Operador', papel: 'operador' }, () => {
    const i = infoAprovacao({ id: 'reel_6', peca: 'reel', gerentesNecessarios: [{ id: 'usr_g', nome: 'Pedro Maia' }, { id: 'usr_h', nome: 'Pedro Puntel' }],
      aprovacao: { estado: 'pendente', etapa: 'gerentes', rodada: 1, gerentes: { aprovaram: [{ id: 'usr_g', nome: 'Pedro Maia', comObservacao: true }] } } });
    assert.equal(i.nome, 'Com os gerentes (1 de 2)');
    assert.match(i.dica, /Pedro Maia aprovou com observação/);
    assert.match(i.dica, /Falta Pedro Puntel/);
  });
});

test('nenhum rótulo de decisão leva travessão', () => {
  const textos = [...Object.values(DECISAO), ...itens(decidida()).flatMap((r) => Object.values(infoAprovacao(r)).filter((v) => typeof v === 'string'))];
  for (const t of textos) assert.doesNotMatch(t, /[\u2013\u2014]/);
});

// 22/10 (Pedro): os dois gerentes são Pedro (Pedro Maia e Pedro Puntel). O primeiro nome sozinho não diz quem decidiu:
// quando outra pessoa da aprovação tem o mesmo primeiro nome, o rótulo curto (chip, pílula, Início) leva o nome inteiro
test('"Reprovado por Pedro Maia" quando os dois gerentes são Pedro; "por Ana" quando o nome não repete', () => {
  const gerentes = [{ id: 'usr_pm', nome: 'Pedro Maia' }, { id: 'usr_pp', nome: 'Pedro Puntel' }];
  const reprovado = { estado: 'ajuste', etapa: 'gerentes', tipoAjuste: 'sugestao', decididoPor: 'Pedro Maia', decididoPorId: 'usr_pm', decididoEm: '2026-10-22T15:00:00.000Z' };
  assert.equal(infoAprovacao({ id: 'reel_7', peca: 'reel', gerentesNecessarios: gerentes, aprovacao: reprovado }).curto, 'Reprovado por Pedro Maia');
  // sem a lista dos gerentes (peça do /api/estado), quem falou na conversa também conta
  const conversa = [{ tipo: 'aprovado', autor: 'Pedro Puntel', autorId: 'usr_pp' }, { tipo: 'ajuste', autor: 'Pedro Maia', autorId: 'usr_pm' }];
  assert.equal(infoAprovacao({ id: 'sto_7', stories: true, aprovacao: { ...reprovado, conversa } }).curto, 'Reprovado por Pedro Maia');
  const obs = [{ autor: 'Pedro Puntel', autorId: 'usr_pp', etapa: 'gerentes', texto: 'Trocar a foto.', em: '2026-10-22T14:00:00.000Z', rodada: 1 }];
  const aprovado = decidida({ decididoPor: 'Pedro Puntel', decididoPorId: 'usr_pp', comObservacao: true, observacoes: obs });
  assert.equal(infoAprovacao({ id: 'env_7', envio: true, gerentesNecessarios: gerentes, aprovacao: aprovado }).curto, 'Aprovado com observação por Pedro Puntel');
  assert.equal(infoAprovacao({ id: 'reel_8', peca: 'reel', gerentesNecessarios: gerentes, aprovacao: decidida() }).curto, 'Aprovado por Ana');
});
