// Testes do carrossel montado da peça (23/10, Pedro: "A skill deve rodar identificando o post, o tipo de conteúdo e criar
// um carrossel com um design que converse com o post"; server/estudio-carrossel.mjs):
//  - o tipo de conteúdo pela peça (mito, comparativo, oferta, pergunta, notícia, tirinha, alerta e lista), com os posts
//    de verdade do cronograma
//  - as falas da tirinha, o destaque do título e a variação escuro e claro pela ordem do cronograma
//  - cada tipo com o design dele, nas duas variações: os rótulos e os elementos do tipo, nenhuma colisão, nenhum texto
//    fora da área segura e nenhum problema na revisão do design (a mesma do Estúdio)
//  - a tag do público não vai por padrão (fica no banco, como asset)
// Usa o catálogo de verdade do banco (estudio/base/catalogo.json), sem servidor. Rodar: npm run testar
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const AQUI = import.meta.dirname;
const C = await import('../estudio-carrossel.mjs');
const estudio = await import('../estudio.mjs');
const catalogo = JSON.parse(readFileSync(path.join(AQUI, '..', '..', 'estudio', 'base', 'catalogo.json'), 'utf8')).assets;
const assets = new Map(catalogo.map((a) => [a.id, a]));
const DOC = { formato: 'feed45', largura: 1080, altura: 1350 };

const peca = (extra = {}) => ({ id: 'reel_x', data: '2026-11-05', peca: 'carrossel', pilar: 16, ideia: 'Ideia', carrossel: { capa: { titulo: '' }, slides: [], final: {} }, ...extra });
const montar = (p, variante = 'escuro', bloco = 'Educação') => C.montarCarrossel(p, {
  alturaEstimada: estudio.alturaEstimada, quebrarLinhas: estudio.quebrarLinhas, assets, bloco, variante, maxSlides: 10,
});
const nomes = (pg) => pg.camadas.map((c) => c.nome);
const porNome = (pg) => Object.fromEntries(pg.camadas.map((c) => [c.nome, c]));
// o design montado passa pela mesma correção e pela mesma revisão do Estúdio: nenhum problema
function conferir(paginas, rotulo) {
  const doc = { id: 'est_teste', titulo: 'Teste', ...DOC, ...estudio.validarDocumento({ titulo: 'Teste', ...DOC, paginas: estudio.corrigirDesign({ ...DOC, paginas: structuredClone(paginas) }, assets).paginas }, { assets }), versao: 1 };
  const problemas = estudio.revisarDesign(doc, assets).filter((x) => x.nivel === 'problema');
  assert.deepEqual(problemas.map((x) => `${x.pagina}:${x.regra}:${x.texto}`), [], rotulo);
  for (const pg of doc.paginas) assert.deepEqual(estudio.colisoes(pg, doc, assets).map(([a, b]) => `${a.nome} x ${b.nome}`), [], `${rotulo}: nada atravessa nada`);
  return doc;
}

test('tipo do carrossel pelos posts de verdade do cronograma', () => {
  const casos = [
    ['mito', { pilar: 5, ideia: '3 coisas que te disseram sobre abrir empresa e não são verdade' }],
    ['mito', { pilar: 16, ideia: 'Mito: "Trocar de contador no meio do ano dá dor de cabeça"' }],
    ['comparativo', { pilar: 5, ideia: 'MEI ou ME: qual é o seu?', carrossel: { capa: { titulo: 'MEI ou ME: qual é o seu?' }, slides: [] } }],
    ['oferta', { pilar: 10, ideia: '3 coisas que já vêm no plano da ME' }],
    ['pergunta', { pilar: 16, ideia: 'Traduzindo o contabilês: as dúvidas da caixinha de 26/10' }],
    ['noticia', { pilar: 16, ideia: 'A lei nova do MEI saiu: 3 coisas que mudam pra você' }],
    ['noticia', { pilar: 16, ideia: 'Se você tem colaborador, esse post é pra você: a escala 6x1 acabou' }],
    ['tirinha', { pilar: 2, ideia: 'Tirinha do Léo: um papel pedindo outro papel', formatoTexto: 'Carrossel em tirinha de 4 quadros' }],
    ['alerta', { pilar: 4, ideia: 'Esse detalhe no endereço pode travar a abertura da sua empresa' }],
    ['lista', { pilar: 11, ideia: '5 sinais de que é hora de trocar de contador' }],
  ];
  for (const [esperado, p] of casos) assert.equal(C.tipoDoCarrossel(peca(p)), esperado, p.ideia);
  // os títulos dos slides também dizem: entre aspas, o mito; com "?", a pergunta; "Quadro N", a tirinha
  assert.equal(C.tipoDoCarrossel(peca({ pilar: 16, carrossel: { slides: [{ titulo: '"Nome sujo impede de abrir CNPJ."', texto: 'Não impede.' }, { titulo: '"MEI não declara."', texto: 'Declara.' }] } })), 'mito');
  assert.equal(C.tipoDoCarrossel(peca({ pilar: 16, carrossel: { slides: [{ titulo: 'Quem paga o DAS?', texto: 'Você.' }, { titulo: 'Quando vence?', texto: 'Dia 20.' }] } })), 'pergunta');
  assert.equal(C.tipoDoCarrossel(peca({ pilar: 16, carrossel: { slides: [{ titulo: 'Quadro 1', texto: 'Léo: "Oi"' }, { titulo: 'Quadro 2', texto: 'Sem fala.' }] } })), 'tirinha');
});

test('falas da tirinha, destaque do título e a variação pela ordem do cronograma', () => {
  assert.deepEqual(C.falasDoQuadro('Carta: "DECLARE O IMPOSTO QUE VOCÊ JÁ PAGOU". Bia: "Mas eu já paguei!"'), [{ quem: 'Carta', fala: 'DECLARE O IMPOSTO QUE VOCÊ JÁ PAGOU' }, { quem: 'Bia', fala: 'Mas eu já paguei!' }]);
  assert.deepEqual(C.falasDoQuadro('Léo: "Relaxa, Bia. Na ME, esse papel é com o contador com CRC."'), [{ quem: 'Léo', fala: 'Relaxa, Bia. Na ME, esse papel é com o contador com CRC.' }]);
  assert.deepEqual(C.falasDoQuadro('Sem fala.'), []);
  assert.equal(C.destacar('MEI ou ME: qual é o seu?'), 'MEI ou ME: *qual é o seu*?');
  assert.equal(C.destacar('3 coisas que já vêm no plano da ME'), '3 coisas que já vêm no plano *da ME*');
  assert.equal(C.destacar('Já tem *destaque*'), 'Já tem *destaque*');
  const db = { reels: [peca({ id: 'a', data: '2026-11-01' }), peca({ id: 'b', data: '2026-11-03' }), peca({ id: 'c', data: '2026-11-05' }), { id: 'r', peca: 'reel', data: '2026-11-02' }] };
  assert.deepEqual(['a', 'b', 'c'].map((id) => C.varianteDoCarrossel(db, { id })), ['escuro', 'claro', 'escuro']);
});

const longo = 'Antes, era papel e ida ao escritório. Agora, tudo pelo celular ou computador, e você assina com a sua conta gov.br.';
const AMOSTRAS = {
  mito: peca({ pilar: 5, ideia: '3 coisas que te disseram e não são verdade', carrossel: { capa: { titulo: '3 coisas que te disseram e não são verdade' }, slides: [{ titulo: '"Nome sujo impede de abrir CNPJ."', texto: 'Não impede. SPC e Serasa são crédito, não registro.' }, { titulo: '"Quem tem carteira assinada não pode ter empresa."', texto: 'Pode, sim. Carteira assinada não impede ser sócio de uma ME.' }], final: { texto: 'Conhece alguém que precisa ver isso? Manda pra essa pessoa.' } } }),
  comparativo: peca({ pilar: 5, ideia: 'MEI ou ME: qual é o seu?', carrossel: { capa: { titulo: 'MEI ou ME: qual é o seu?' }, slides: [{ titulo: '', texto: 'O MEI pode faturar até R$ 81 mil por ano.' }, { titulo: '', texto: 'O teto da ME que a gente atende é R$ 360 mil por ano.' }], final: { texto: 'Salva pra quando bater a dúvida.' } } }),
  oferta: peca({ pilar: 10, ideia: '3 coisas que já vêm no plano da ME', carrossel: { capa: { titulo: '3 coisas que já vêm no plano da ME' }, slides: [{ titulo: '1', texto: 'Contador com registro no CRC cuidando da rotina fiscal.' }, { titulo: '2', texto: 'O certificado digital incluso. Fora daqui, ele custa em torno de R$ 209 por ano.' }], final: { texto: 'Entra na lista de espera pelo link da bio.' } } }),
  pergunta: peca({ pilar: 16, ideia: 'Traduzindo o contabilês: as dúvidas da caixinha', carrossel: { capa: { titulo: 'Traduzindo o contabilês: as dúvidas da caixinha' }, slides: [{ titulo: 'Quem paga a guia do mês?', texto: 'O app calcula e emite. Você só paga.' }], final: { texto: 'Manda a sua dúvida na próxima caixinha.' } } }),
  noticia: peca({ pilar: 16, ideia: 'A lei nova do MEI saiu: 3 coisas que mudam pra você', carrossel: { capa: { titulo: 'A lei nova do MEI saiu: 3 coisas que mudam pra você' }, slides: [{ titulo: '1. O limite de faturamento sobe', texto: 'Em 2027, o MEI vai poder faturar até R$ 110 mil por ano.' }, { titulo: 'Quando começa', texto: 'Quase tudo começa em 1º/01/2027.' }], final: { texto: 'O limite muda, e a gente fica de olho nele.' } } }),
  tirinha: peca({ pilar: 2, ideia: 'Tirinha do Léo: um papel pedindo outro papel', formatoTexto: 'Carrossel em tirinha de 4 quadros', carrossel: { capa: { titulo: 'Todo dono de empresa pequena já viu isso: um papel pedindo outro papel' }, slides: [{ titulo: 'Quadro 1', texto: 'Carta: "DECLARE O IMPOSTO QUE VOCÊ JÁ PAGOU". Bia: "Mas eu já paguei!"' }, { titulo: 'Quadro 2', texto: 'Sem fala.' }, { titulo: 'Quadro 3', texto: 'Carta: "AGORA DECLARE QUE DECLAROU"' }], final: { titulo: 'Quadro 4', texto: 'Léo: "Relaxa, Bia. Na ME, esse papel é com o contador com CRC." Bia: "E eu?" Léo: "Você cuida das suas clientes."' } } }),
  alerta: peca({ pilar: 4, ideia: 'Esse detalhe no endereço pode travar a abertura da sua empresa', carrossel: { capa: { titulo: 'Esse detalhe no endereço pode travar a abertura da sua empresa' }, slides: [{ titulo: '', texto: 'O índice do IPTU é obrigatório. Sem ele, o processo para.' }, { titulo: '', texto: longo }], final: { texto: 'Guarda esse post pro dia que você for abrir o seu CNPJ.' } } }),
  lista: peca({ pilar: 11, ideia: '5 sinais de que é hora de trocar de contador', carrossel: { capa: { titulo: '5 sinais de que é hora de trocar de contador' }, slides: [{ titulo: 'Ele some', texto: 'Você manda mensagem e a resposta não vem.' }, { titulo: 'A guia chega em cima', texto: longo }], final: { texto: 'Salva pra lembrar.' } } }),
};

test('cada tipo com o design dele, nas duas variações: sem colisão, sem texto fora e sem problema na revisão', () => {
  for (const [tipo, p] of Object.entries(AMOSTRAS)) {
    for (const variante of ['escuro', 'claro']) {
      const paginas = montar(p, variante, tipo === 'oferta' ? 'Conversão' : 'Educação');
      const rotulo = `${tipo} ${variante}`;
      conferir(paginas, rotulo);
      // a tag do público não vai por padrão; o contador e o logo vão em todas (menos no fim de Conversão, com o logo no centro)
      for (const pg of paginas) assert.ok(!nomes(pg).includes('Tag do público') && nomes(pg).includes('Contador'), rotulo);
      const [capa, s1] = paginas.map(porNome);
      const leo = Object.values(capa).find((c) => /^Léo/.test(c.nome));
      if (tipo === 'comparativo') assert.ok(capa['Lado MEI'] && capa['Lado ME'] && !leo, `${rotulo}: os dois lados na capa`);
      else {
        // 23/10 (Pedro: "o Leozin está bem pequeno"): o Léo grande, na coluna da direita, sem ficar por cima do texto
        assert.ok(leo && leo.altura >= 850, `${rotulo}: o Léo grande na capa (${leo?.altura})`);
        for (const n of ['Kicker', 'Título', 'Linha de apoio', 'Arrasta pro lado']) if (capa[n]) assert.ok(capa[n].x + capa[n].largura <= leo.x, `${rotulo}: ${n} à esquerda do Léo`);
      }
      // o balão da fala nunca fica estreito a ponto de quebrar a palavra no meio
      if (tipo === 'tirinha') for (const pg of paginas) for (const c of pg.camadas) if (/^Fala/.test(c.nome)) {
        for (const palavra of c.texto.split(/\s+/)) {
          const { larguras } = estudio.quebrarLinhas({ ...c, texto: palavra, largura: 100000 });
          assert.ok(larguras[0] <= c.largura, `${rotulo}: "${palavra}" cabe inteira em ${c.nome} (${c.largura} px)`);
        }
      }
      if (tipo === 'mito') assert.ok(s1['Mito'] && s1['Verdade'] && /^\*“\*/.test(s1['Mito'].texto) && /^\*Não impede\.\*/.test(s1['Resposta'].texto), rotulo);
      if (tipo === 'comparativo') assert.ok(s1['Lado MEI'] && s1['Lado ME'] && /\*R\$ 81 mil\*/.test(s1['Título'].texto), rotulo);
      if (tipo === 'oferta') assert.ok(s1['Símbolo (o visto)'] && s1['Símbolo (o visto)'].assetId === 'ast_base_simbolo', rotulo);
      if (tipo === 'pergunta') assert.ok(s1['Card da pergunta'] && s1['Rótulo resposta'], rotulo);
      if (tipo === 'noticia') assert.equal(s1['Título'].texto.replace(/\*/g, ''), '1. O limite de faturamento sobe', `${rotulo}: o número do título fica um só`);
      if (tipo === 'tirinha') {
        assert.ok(s1['Painel do quadro'] && s1['Balão (Carta)'] && s1['Balão (Bia)'] && s1['Papelada'], rotulo);
        assert.ok(porNome(paginas[2])['Léo'], `${rotulo}: o quadro sem fala tem o Léo`);
        assert.ok(porNome(paginas.at(-1))['Balão (Léo)'], `${rotulo}: a tirinha fecha no último quadro`);
      }
      if (tipo === 'alerta') assert.ok(s1['Atenção'], rotulo);
      if (tipo === 'lista') assert.equal(s1['Título'].texto.replace(/\*/g, ''), '1. Ele some');
    }
  }
});

test('pilares 1 e 3 (a voz do Pedro ou da empresa): sem o Léo na capa, com o ícone 3D', () => {
  const capa = porNome(montar(peca({ pilar: 3, ideia: 'Como a gente começou', carrossel: { capa: { titulo: 'Como a gente começou' }, slides: [{ titulo: 'O começo', texto: 'Tudo começou com uma planilha.' }], final: {} } }))[0]);
  assert.ok(!Object.keys(capa).some((n) => /^Léo/.test(n)));
  assert.ok(capa['Ícone 3D'] || capa['Ícone 3D no círculo']);
});
