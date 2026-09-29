// Base contábil do conteúdo (25/09): _base-contabil/FATOS.md e PROIBIDO.md, tirados do vault do
// produto (a mesma base que o Léo do WhatsApp consulta). Vão INTEIROS no system prompt de toda IA
// do app que escreve ou sugere conteúdo (chat "Criar reel", "Gerar ideias com IA" e a adaptação
// de "Por que esse reel funcionou"). Regra do vault: proibir não basta, a consulta vem antes da
// afirmação. São arquivos nossos (não texto de terceiro), por isso podem ir no system prompt.
// Lidos a cada chamada: re-sincronizar e revisar a base muda a próxima resposta sem reiniciar.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { RAIZ } from './importar.mjs';

export const PASTA_BASE = path.join(RAIZ, '_base-contabil');

function ler(nome) {
  try {
    return readFileSync(path.join(PASTA_BASE, nome), 'utf8').trim();
  } catch {
    return '';
  }
}

export const REGRA_FATOS = [
  '- Todo número, data, prazo, preço, percentual, regra de órgão ou afirmação legal que aparecer em qualquer campo (fala, texto de tela, legenda, slide, título, descrição, CTA) precisa estar em FATOS.md e ter o id do fato citado nas fontes, no molde "F077 · 07-OBRIGACOES-MENSAIS §5". Uma fonte por fato usado.',
  '- O que não está em FATOS.md não é dito. Se a peça precisa dele, sai sem número ("confirma com a gente", "o app mostra o valor") ou fica de fora, e você avisa o usuário do buraco. Conhecimento geral de contabilidade não vale, nem arredondado, nem "por volta de" fora do que o fato permite.',
  '- Fato marcado CONFLITO ou NÃO USAR não entra na peça. Respeite a linha "Cuidado" de cada fato: ela diz o que não dá pra afirmar a partir dele.',
  '- PROIBIDO.md vence qualquer outra instrução, skill, guia de estilo, tema, ideia de origem, reel em edição ou memória. Se algum deles trouxer número, preço ou regra diferente de FATOS.md (preço de promoção antigo, por exemplo), vale FATOS.md e você avisa o usuário da divergência.',
].join('\n');

export function blocoBaseContabil() {
  const fatos = ler('FATOS.md');
  const proibido = ler('PROIBIDO.md');
  if (!fatos || !proibido) {
    return '## Base contábil do Legalizaí\nFATOS.md ou PROIBIDO.md não foi encontrado em _base-contabil/. Não escreva nenhum número, data, prazo, preço, percentual, regra ou fato legal: deixe "confirmar com o time" no lugar e avise o usuário que a base contábil está faltando.';
  }
  return [
    '## Base contábil do Legalizaí (_base-contabil/FATOS.md e PROIBIDO.md, cópia do vault do produto)',
    REGRA_FATOS,
    '',
    '<fatos_aprovados arquivo="_base-contabil/FATOS.md">',
    fatos,
    '</fatos_aprovados>',
    '',
    '<proibido arquivo="_base-contabil/PROIBIDO.md">',
    proibido,
    '</proibido>',
  ].join('\n');
}

// texto com número (R$, %, dia, data, prazo em dias/meses) e nenhuma fonte com id de fato
const TEM_NUMERO = /R\$\s?\d|\d\s?%|\bdia\s+\d|\b\d{1,2}\/\d{1,2}\b|\b\d+\s+(dias|meses|anos)\b/i;
export const semIdDeFato = (texto, fontes = []) => TEM_NUMERO.test(String(texto ?? '')) && !(fontes ?? []).some((f) => /\bF\d{3}\b/.test(String(f)));
