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

const { store, minhaVez, ajustaAprovada } = await import('../../public/js/core.js');

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
