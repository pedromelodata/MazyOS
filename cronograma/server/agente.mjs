// Chat "Criar reel": roda a skill reels-leo (a do projeto: o Construtor de gancho, CTA e narração, com o banco
// curado de ganchos, as CTAs e o b-roll em references/) via Claude Agent SDK. 28/09: a reels-curtos global saiu
// da lista, porque o banco genérico dela tem ganchos e CTAs que a reforma das skills descartou.
// com a conta do Claude Code já logada nesta máquina (sem chave de API).
// O agente só lê (Read/Glob/Grep/Skill), e só nas pastas liberadas em guarda.mjs. Quem grava é a
// ferramenta salvar_reel, que o servidor controla: vai pro banco e vira um reel.md em marketing/conteudo.
// Dado do banco (ideia, cases, reel em edição) vai na primeira mensagem dentro de
// <dados_de_referencia>, não no system prompt: pode carregar texto de terceiro (legenda do Instagram).
// Reel NOVO só começa com dia e tipo escolhidos (conferirPedidoChat, 400 antes do SSE). Tipo e dia
// vêm da sessão, nunca do modelo; o reel.md sai do gerador compartilhado em reelmd.mjs.
// 23/09: o tipo escolhido traz o guia do estilo (data/estilos.json) pro system prompt, com as famílias
// de gancho casadas com as categorias do banco curado da reels-leo (os mesmos nomes do banco da reels-curtos). Reel que vem de uma ideia leva o
// roteiro base dela e os fatos com fonte do tema dela nos dados de referência.
// Fator R tem uma peça só no cronograma (23/09): fora dela, o contexto proíbe o assunto e deixa de fora
// o exemplo de formato que fala dele (a mesma trava do ideias-ia.mjs).
// 25/09: _base-contabil/FATOS.md e PROIBIDO.md vão inteiros no system prompt (base-contabil.mjs). Todo número
// ou fato legal da peça cita o id do fato nas fontes; preço e validade da oferta saem só de lá.
// 30/09: o bloco "O que os números da nossa conta mostram" (Métricas, diagnostico.mjs) entra logo depois do
// contexto escolhido no app. É texto nosso (codebook e números), sem legenda de terceiro; falha vira bloco vazio.
import { query, tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import {
  carregar, criar, atualizar, salvar, statusFormato, novoId, repontarIdeia, falha, dataValida, agora,
  TIPOS_REEL, ROTULO_TIPO, limparGravacao, limparFontes, guia, temaDoGuia, nomeTema, TEMA_LEGADO,
  PECAS, ROTULO_PECA, limparCarrossel, limparEstatico, limparStories, blocoDoPilar,
} from './db.mjs';
import { RAIZ } from './importar.mjs';
import { CAMPANHA_PADRAO } from './migrar.mjs';
import { hooksLeitura, LEITURAS_PROIBIDAS, contemSegredo, blocoDados, AVISO_DADOS } from './guarda.mjs';
import { blocoBaseContabil } from './base-contabil.mjs';
import { escreverReelMd, relRaiz } from './reelmd.mjs';
import { pecaVazia, roteiroLimpo } from './validar.mjs';
import { blocoInsightsIa } from './diagnostico.mjs';
// 21/10: aba Ateliê (card antes de salvar, conferência das regras duras por código, anti-repetição)
import {
  conferir as conferirAtelie, textoConferencia, blocoAtelie, pecasRecentes, nomePersona, PUBLICOS, PERSONAS, ESTAGIOS, IRONIAS, VOZES,
  GATILHOS_EMOCIONAIS, GATILHOS_PSICOLOGICOS,
} from './atelie.mjs';

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const dataOk = (d) => (typeof d === 'string' && DATA_ISO.test(d) ? d : '');
const tipoOk = (t) => (TIPOS_REEL.includes(t) ? t : null);

const FATOR_R = 'tm_fator_r';
const FALA_DE_FATOR_R = /fator\s*r\b|15,5\s*%/i;
// a peça de Fator R: a ideia é do tema Fator R ou o reel em edição é o de Fator R
export const ehPecaFatorR = ({ ideia = null, reelExistente = null } = {}) =>
  (TEMA_LEGADO[ideia?.tema] ?? ideia?.tema) === FATOR_R || /fator\s*r\b/i.test(reelExistente?.ideia ?? '');
const TRAVA_FATOR_R = '- Fator R já tem a peça única no Banco de Ideias. Não faça reel sobre Fator R ou Anexo III e V, nem use isso como gancho, exemplo ou CTA, a não ser que o usuário peça. O exemplo do formato serve só de estrutura.';

// ---------- contexto ----------

// escada de CTA por tipo (_memoria/preferencias.md e o pedido do Pedro de 23/09)
const TIPO_CONTEXTO = {
  conexao: [
    '**Conexão e identificação** (topo e meio de funil). Fazer o MEI e o dono de ME se sentirem vistos: a rotina de quem trabalha sozinho, com validação sem pena (o problema é o sistema, nunca a pessoa).',
    '  - CTA final SUAVE, falada: comenta a sua história, manda pra quem vive isso, ou segue pra acompanhar. Nada de link, lista de espera ou funil.',
    '  - No máximo uma menção ao app que tá chegando, sem CTA de lista. História do escritório sem nome e marcada "confirmar antes de gravar"; bastidor do Pedro só com fato real.',
  ],
  vendas: [
    '**Vendas** (fundo de funil). Objetivo: gente entrando na lista de espera do app que está chegando.',
    '  - CTA final, falado: "Entra na lista de espera pelo link da bio." A lista não cobra nada e não compromete com contratação (F007). Nada de prazo de preenchimento nem de simulador: não estão na base.',
    '  - Venda pelos diferenciais antes do preço (um por peça): o preço e o contrato inteiros antes de pagar (F020, F045), contador CRC de verdade no plano ME (NUNCA no MEI, que tem assistente virtual), tudo pelo app, abertura sem honorário, regra de saída escrita no contrato, a gente é de BH (em peça de ME; em peça de MEI, sem cidade, F027). Nunca prometa prazo de abertura. Linguagem de gente: nada de "asterisco", "letra miúda" ou "hiperlocal" na peça.',
    '  - Janela promocional ligada até 31/12/2026 (estratégia v4): as peças de vendas alternam com preço e sem preço e somam no máximo 30% das peças do mês (reels-leo §6). Com preço, os valores saem SÓ de FATOS.md (grupo Preços e planos), com os ids nas fontes: os dois valores do plano, a frase inteira da promoção (F005) e a fidelidade de 12 meses (F023). Toda peça de vendas leva os 7 dias pra mudar de ideia com a condição (F021, F022); no MEI, até o Pedro decidir a forma da condição, eles ficam de fora e a exceção vai nas notas. O pilar 10 já teve 12 peças na primeira campanha: varie o ângulo. Pilar 13 não é vendas.',
  ],
  viralizacao: [
    '**Viralização** (topo de funil). Emoção e identificação: o reel ganha no salvar, compartilhar, marcar alguém e comentar.',
    '  - CTA final SÓ de engajamento (salva, marca alguém, comenta, compartilha). Nada de link, lista de espera ou funil.',
    '  - A ironia mira o sistema (burocracia, contabilês, portal que cai), nunca o cliente nem o contador. Ironia mais baixa pra público mais velho.',
  ],
  ensino: [
    '**Ensino** (educativo). Um conceito só por reel, traduzido pra fala de gente, sem termo técnico sem tradução.',
    '  - CTA final: salvar o post pra consultar depois, ou mandar pra quem precisa.',
    '  - O conceito fecha no app (o app faz, avisa ou prepara). Nunca vira tutorial de portal, emissor ou gov.br pra pessoa fazer sozinha (PROIBIDO P38).',
  ],
  conselho: [
    '**Conselho** (topo e meio de funil). Conselho direto ou reflexão de quem já viveu o problema: fala em primeira pessoa, com a experiência do Pedro ou de alguém do time que constrói o app, sem aula e sem sermão.',
    '  - CTA final SÓ de engajamento: salva pra lembrar, manda pra quem precisa ouvir isso, ou segue pra mais conselhos. Nada de link, lista de espera ou funil.',
    '  - Um conselho só por reel, dito como a pessoa diria pra um amigo. Experiência contada é fato real ou marcada "confirmar antes de gravar".',
  ],
};

export function blocoTipo(tipo) {
  const t = TIPO_CONTEXTO[tipo];
  if (!t) return '- Tipo do reel: não definido (reel antigo). Pergunte ao usuário se é Viralização, Vendas, Conexão, Ensino ou Conselho antes de mexer na CTA.';
  return `- Tipo do reel: ${t.join('\n')}`;
}

// as categorias do banco curado da reels-leo (.claude/skills/reels-leo/references/ganchos.md), que têm os mesmos
// nomes do "Banco de Ganchos de Referência" da reels-curtos (títulos ### do SKILL.md dela)
export const CATEGORIAS_BANCO = [
  'Abertura com Gancho Direto', 'Storytelling em Vídeo', 'Curiosidades e Fatos', 'Polêmicas e Opiniões', 'Motivação Curta',
  'Educativo Rápido', 'Provas e Resultados', 'Perguntas Que Prendem', 'Gatilhos de Identificação',
];
const semAcento = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

// "Curiosidades e Fatos: 'A maioria...'" → "Curiosidades e Fatos". Família que não casa fica de fora da lista
export function categoriasDoEstilo(familias = []) {
  const achadas = [];
  for (const f of familias) {
    const c = CATEGORIAS_BANCO.find((cat) => semAcento(f).trimStart().startsWith(semAcento(cat)));
    if (c && !achadas.includes(c)) achadas.push(c);
  }
  return achadas;
}

const itens = (lista, recuo = '    ') => (lista ?? []).map((x) => `${recuo}- ${x}`).join('\n');

// guia do estilo do tipo escolhido (ensino não tem guia: fica só a escada de CTA acima)
export function blocoEstilo(tipo) {
  const e = guia().estilos?.[tipo];
  if (!e) return '';
  const cats = categoriasDoEstilo(e.familiasDeGancho);
  return [
    `## Guia do estilo ${ROTULO_TIPO[tipo]} (${e.nome}), do app`,
    `- Objetivo: ${e.objetivo}`,
    e.gatilhos?.length ? `- Gatilhos que esse estilo usa:\n${itens(e.gatilhos)}` : '',
    `- Ganchos: na ETAPA 2 da skill reels-leo (§7), sugira 3 ganchos de .claude/skills/reels-leo/references/ganchos.md${cats.length ? `, destas categorias: ${cats.join(', ')}` : ''}, que sirvam ao tipo e ao pilar, adaptados como nas famílias abaixo. Regra do Pedro (09/10/2026): todo gancho sai do banco (a curadoria G ou o banco original numerado em .claude/skills/reels-leo/references/banco-1000-ganchos.md), e a peça anota de onde veio; os ganchos modelo do estilo só valem se forem do banco.`,
    `  - Famílias de gancho do estilo (categoria do banco: adaptação):\n${itens(e.familiasDeGancho)}`,
    `  - Ganchos modelo:\n${itens(e.ganchosModelo)}`,
    `- Estrutura do estilo:\n${itens(e.estrutura, '  ')}`,
    `- CTA: na ETAPA 3 da skill reels-leo, proponha a CTA de .claude/skills/reels-leo/references/ctas.md, do degrau do tipo, em vez de perguntar do zero. As CTAs do estilo abaixo só valem se também passarem no ctas.md (nada de CTA de dia 20; preço sempre com os dois valores, a frase de F005 e a fidelidade):\n${itens(e.ctas, '  ')}`,
    `- Evitar:\n${itens(e.evitar, '  ')}`,
  ].filter(Boolean).join('\n');
}

const ENTREGA = `
## O que a entrega PRECISA ter (cada parte vira um campo do app)
1. **Formato**: o escolhido acima, em uma linha (código e nome).
2. **Hook** falado (0 a 3s, forte, até ~110 caracteres). **Texto de tela é opcional**: só quando ajuda de verdade (o hook precisa funcionar com o som desligado, ou um número ou palavra-chave merece ficar na tela), em CAIXA ALTA e até ~40 caracteres, como mandam a reels-leo §1 e §8. Sem isso, deixe vazio.
3. **Narração do desenvolvimento PALAVRA POR PALAVRA**, do jeito que o Pedro vai falar (pt-BR natural, ~2,1 palavras por segundo de vídeo).
4. **CTA final** palavra por palavra, da escada do tipo escolhido.
5. **Roteiro cena a cena**: 4 a 7 cenas com tempo, cena (o que a câmera mostra) e fala exata; texto de tela só na cena em que ele ajuda (senão vazio). A primeira cena é o gancho, a última é a CTA, e hook + desenvolvimento + CTA são exatamente as falas das cenas.
6. **Detalhes de gravação**: duração, quem aparece, local exato, enquadramento (vertical 9:16, altura dos olhos, plano médio, close...), luz, áudio, figurino (sem logo de outra marca), objetos, cada tomada de b-roll separada, telas do app (nomes de arquivo de marketing/telas-app/_manifesto.json e pra onde apontar), edição (cortes, zooms, legenda queimada em Sora com 1 palavra coral por frase, tag ME/MEI no canto, end card) e checklist antes de gravar.
7. **Fontes**: o id do fato de FATOS.md de cada número, data, preço, regra ou fato legal usado em qualquer parte do reel ("F077 · 07-OBRIGACOES-MENSAIS §5"). Número sem id de fato não entra.

Produção enxuta: um celular, tripé, microfone de lapela e luz natural; cada reel precisa ser gravado em menos de 30 minutos com o que um escritório pequeno tem (a edição é o gargalo do time). Quem apresenta é o Pedro (fundador, produto e dev; 1ª pessoa liberada pra bastidor). Formato de diálogo pede o Pedro e mais uma pessoa do time que constrói o app (Pedro Maia, Pedro Puntel, Thiago ou Natanael); no roteiro, a fala dela vai marcada COLEGA:. Nunca cite o Mauro, o escritório Legalize nem os 22 anos (PROIBIDO P39). Legenda curta e assertiva (até uns 600 caracteres), sem hashtag: CTA, de 2 a 4 linhas de desenvolvimento, cada uma com um emoji no começo, e a CTA de novo. salvar_reel recebe tudo isso, gravação e fontes inclusive.`.trim();

// 24/09: a peça pode ser carrossel, estático ou stories (ou duas delas, como o calendário pede).
// Cada tipo tem o seu campo no salvar_reel; o reel continua com hook, cenas, desenvolvimento e cta
const ESTRUTURA_PECA = {
  carrossel: [
    '**Carrossel** (4:5, 1080x1350, até 20 slides no total), no campo `carrossel`:',
    '  - `capa`: `titulo` (o gancho, forte, até ~70 caracteres, que funciona sozinho no feed), `texto` (opcional: uma linha de apoio) e `visual` (o que a arte mostra: foto real, ilustração, template, a palavra em coral);',
    '  - `slides`: os do meio, um por ideia e na ordem, cada um com `titulo` (opcional, curto), `texto` (exatamente o que vai escrito no slide, em frases curtas) e `visual`;',
    '  - `final`: o slide de CTA, com `texto` (a CTA da escada do tipo, palavra por palavra) e `visual`.',
  ].join('\n'),
  estatico: '**Estático** (4:5, 1080x1350), no campo `estatico`: `headline` (o gancho, até ~70 caracteres), `apoio` (de 1 a 3 linhas curtas, exatamente como vão na arte), `cta` (da escada do tipo, palavra por palavra) e `visual` (template, cores, o que aparece e onde).',
  stories: '**Stories** (9:16), no campo `stories.quadros`: um quadro por tela, na ordem, cada um com `texto` (exatamente o que aparece escrito), `visual` (fundo, foto, vídeo curto, figurinha) e `interacao` (enquete, caixinha de perguntas, quiz, link, contagem regressiva; vazio no quadro sem interação).',
  reel: '**Reel** (9:16): `hook` falado (0 a 3s, até ~110 caracteres), `textoTela` só se ajudar (CAIXA ALTA, até ~40 caracteres), `desenvolvimento` palavra por palavra (~2,1 palavras por segundo), `cta` palavra por palavra e `cenas` (4 a 7, com tempo, cena, fala e tela opcional): a primeira cena é o gancho, a última é a CTA, e hook + desenvolvimento + CTA são exatamente as falas das cenas.',
};

export function blocoEntrega(tipos = ['reel'], formatoTexto = '') {
  if (tipos.length === 1 && tipos[0] === 'reel') return ENTREGA;
  const nomes = tipos.map((t) => ROTULO_PECA[t]);
  const temReel = tipos.includes('reel');
  const soStories = tipos.length === 1 && tipos[0] === 'stories';
  return [
    '## O que a entrega PRECISA ter (cada parte vira um campo do app)',
    tipos.length > 1
      ? `Esta peça tem duas partes: ${nomes.join(' e ')}${formatoTexto ? ` (no calendário: "${formatoTexto}")` : ''}. Se o calendário deixa a escolha ("ou"), pergunte ao usuário qual fazer, ou se são as duas; se pede as duas ("+", "/"), entregue as duas. A principal é ${nomes[0]}.`
      : `Esta peça é ${nomes[0]}${formatoTexto ? ` (no calendário: "${formatoTexto}")` : ''}, não é vídeo: das skills valem o tom, o jeito de escrever, o banco de ganchos e a escada de CTA; a estrutura é esta.`,
    ...tipos.map((t) => ESTRUTURA_PECA[t]),
    soStories ? '' : '**Legenda** curta e assertiva (até uns 600 caracteres), sem hashtag: CTA, de 2 a 4 linhas de desenvolvimento, cada uma com um emoji no começo, e a CTA de novo.',
    temReel
      ? '**Detalhes de gravação** do reel, como na entrega de reel: duração, quem aparece, local, enquadramento, luz, áudio, figurino, objetos, b-roll, telas do app, edição e checklist.'
      : '**Detalhes de produção** no campo `gravacao` (os campos que não servem ficam vazios): `duracao` com o tamanho da arte (ex.: "Carrossel 4:5, 6 slides (1080x1350)"), `quem` (voz institucional ou quem aparece nas fotos), `telasApp` (arquivos de marketing/telas-app/_manifesto.json), `edicao` com a arte (fundo papel quente, cards com borda hairline, Sora, 1 palavra coral por slide, tag ME/MEI) e `checklist` antes de produzir.',
    '**Fontes**: o id do fato de FATOS.md de cada número, data, preço, regra ou fato legal usado em qualquer parte da peça ("F077 · 07-OBRIGACOES-MENSAIS §5"). Número sem id de fato não entra.',
    'Quem aparece em foto ou vídeo é gente real do time que constrói o app (Pedro Melo, Pedro Maia, Pedro Puntel, Thiago e Natanael), sempre com autorização de imagem. salvar_reel recebe tudo isso de uma vez.',
  ].filter(Boolean).join('\n');
}

const dataPorExtenso = (d) =>
  d ? new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

function blocoFormato(formato, st, { fatorR = false } = {}) {
  if (!formato) return '- Formato: livre (usuário não escolheu)';
  // exemplo de Fator R fora da peça de Fator R: nem ele nem as fontes dele entram
  const ex = !fatorR && FALA_DE_FATOR_R.test(JSON.stringify(formato.exemplo ?? {})) ? {} : formato.exemplo ?? {};
  const linhas = [
    `- Formato: **${formato.codigo ? `${formato.codigo} · ` : ''}${formato.categoria ? `${formato.categoria} · ` : ''}${formato.nome}** (${formato.duracao || 'duração livre'}, público ${formato.publico || 'MEI + ME'})`,
    formato.formula ? `  - Fórmula: ${formato.formula}` : '',
    formato.descricao ? `  - O que é: ${formato.descricao}` : '',
    formato.estrutura?.length ? `  - Estrutura: ${formato.estrutura.join(' → ')}` : '',
    ex.titulo || ex.gancho ? `  - Exemplo já adaptado ao Legalizaí: título "${ex.titulo ?? ''}", gancho "${ex.gancho ?? ''}", texto de tela "${ex.tela ?? ''}"` : '',
    (ex.titulo || ex.gancho) && formato.fontes?.length ? `  - Fontes dos números do exemplo: ${formato.fontes.join('; ')}` : '',
  ];
  let status;
  if (st.status === 'validado' && st.via === 'dado') {
    status = `VALIDADO pelo nosso dado (${st.acima} ${st.acima === 1 ? 'post' : 'posts'} a 1,5× ou mais a mediana da conta). Os cases estão em casesDoFormato, nos dados de referência.`;
  } else if (st.status === 'validado' && st.via === 'benchmark') {
    const ev = (formato.evidencias ?? []).filter((e) => e.tipo === 'benchmark').map((e) => `    - ${e.valor} (fonte: ${e.fonte})`);
    status = `VALIDADO por benchmark:\n${ev.join('\n')}`;
  } else if (st.status === 'validado') {
    status = 'VALIDADO.';
  } else {
    status = 'EM TESTE (ainda sem dado de desempenho). Avise isso uma vez, sem drama, e siga.';
  }
  linhas.push(`- Status do formato: ${status}`);
  return linhas.filter(Boolean).join('\n');
}

// o que vai dentro de <dados_de_referencia> (texto do banco, que pode ter vindo de terceiro)
export function dadosDeReferencia({ formato, st, cases, reelExistente, ideia }) {
  const dados = {};
  if (ideia) {
    const rb = ideia.roteiroBase ?? {};
    dados.ideiaDeOrigem = {
      tipo: ideia.tipo ?? null, tema: nomeTema(ideia.tema), titulo: ideia.titulo, descricao: ideia.descricao ?? '', gancho: ideia.gancho ?? '',
      estiloGancho: ideia.estiloGancho ?? '', fontes: ideia.fontes ?? [],
      ...(['hook', 'textoTela', 'narracao', 'cta'].some((k) => rb[k]) ? { roteiroBase: rb } : {}),
      ...(String(ideia.notas ?? '').trim() ? { agendaECuidados: ideia.notas } : {}),
    };
    const t = temaDoGuia(TEMA_LEGADO[ideia.tema] ?? ideia.tema);
    if (t) dados.temaDaIdeia = { nome: t.nome, publico: t.publico ?? '', dor: t.dor ?? '', fatos: t.fatos ?? [], fontes: t.fontes ?? [], sazonal: t.sazonal ?? '' };
  }
  if (formato && st?.status === 'validado' && st.via === 'dado') {
    dados.casesDoFormato = (cases ?? [])
      .filter((c) => c.formatoId === formato.id)
      .map((c) => ({ titulo: c.titulo, conta: c.conta, relativo: c.relativo ?? null, permalink: c.permalink || '' }));
  }
  if (reelExistente) {
    const r = reelExistente;
    const tipos = tiposPeca(r);
    dados.reelEmEdicao = {
      peca: tipos.map((t) => ROTULO_PECA[t]).join(' / '),
      ideia: r.ideia, tema: r.tema, pilar: r.pilar ?? null, bloco: r.bloco ?? null,
      ...(r.calendario ? { calendario: { pilar: r.pilarTexto ?? '', formato: r.formatoTexto ?? '', rede: r.rede ?? '', gatilho: r.gatilho ?? '', impulsionar: r.impulsionar ?? null } } : {}),
      ...(String(r.notas ?? '').trim() ? { notas: r.notas } : {}),
      ...(tipos.includes('reel') || r.roteiro?.cenas?.length ? { roteiro: r.roteiro } : {}),
      ...(tipos.includes('carrossel') ? { carrossel: r.carrossel ?? null } : {}),
      ...(tipos.includes('estatico') ? { estatico: r.estatico ?? null } : {}),
      ...(tipos.includes('stories') ? { stories: r.stories ?? null } : {}),
      legenda: r.legenda, gravacao: r.gravacao ?? null, fontes: r.fontes ?? [],
    };
  }
  return dados;
}

// tipos da peça em edição (ou do pedido): reel quando nada diz o contrário
export const tiposPeca = (r) => [...new Set([PECAS.includes(r?.peca) ? r.peca : 'reel', PECAS.includes(r?.peca2) ? r.peca2 : null].filter(Boolean))];

// insights: o bloco das Métricas, já pronto (montarContexto é síncrono; quem chama calcula), ou ''
// atelie: o bloco da aba Ateliê, já pronto (atelie.mjs), ou '' fora dela
// pilar: o pilar da estratégia principal escolhido no app (db.pilares), ou null
export function montarContexto({ formato, st, campanha, data, tipo, reelExistente, ideia, pecas = null, insights = '', atelie = '', pilar = null }) {
  const fatorR = ehPecaFatorR({ ideia, reelExistente });
  const tipos = pecas ?? tiposPeca(reelExistente);
  const rotulo = tipos.map((t) => ROTULO_PECA[t]).join(' / ');
  const soReel = tipos.length === 1 && tipos[0] === 'reel';
  return `
# Você está dentro do app "Gestão de Marketing" do Legalizaí

Fluxo desta conversa:
1. ANTES da primeira resposta, carregue com a ferramenta Skill a skill **reels-leo** (a do projeto: o Construtor de gancho, CTA e narração). Siga o fluxo do §7 dela, uma etapa por mensagem (tema, 3 ganchos de references/ganchos.md, CTA de references/ctas.md, narração e entrega, com o b-roll de references/broll.md). Não use o banco genérico da reels-curtos nem a /reels: a reels-leo já traz o fluxo delas, e o banco foi trocado pelo curado.
2. Antes de escrever qualquer copy, leia \`_memoria/preferencias.md\` e \`_memoria/estrategia.md\`. A base contábil (FATOS.md e PROIBIDO.md) está no fim deste contexto e manda sobre a memória em número, preço, prazo e regra: onde a memória discordar dela, vale a base. As REGRAS DURAS valem sem exceção: zero travessão, grafia "Legalizaí", zero concorrente citado, MEI sem contador humano, escassez só a real (31/12/2026), número só com fonte, todo termo técnico traduzido, guarda-corpos da Reforma (nunca "imposto novo", o MEI não "paga mais", Simples Híbrido é opcional), CTA de reel orgânico é "link da bio" (nunca "link abaixo"), copy fala com "você", nunca citar o Mauro, o escritório Legalize nem os 22 anos (PROIBIDO P39: nem em texto, imagem, b-roll, legenda ou fonte). A skill é genérica; onde ela conflitar com essas regras, as regras do Legalizaí mandam.
3. O app do Legalizaí está em PRÉ-LANÇAMENTO: ninguém consegue baixar ainda. Fale do "app que tá chegando"; nada de "baixe agora" nem tutorial de algo que a pessoa ainda não pode usar, e nunca ensine a fazer sozinho (PROIBIDO P38: nada de passo a passo no Portal do Empreendedor, Emissor Nacional ou gov.br, nada de "faz você mesmo" ou "quem abre é você"; todo conteúdo fecha no app: no MEI "pelo app a gente prepara tudo e você só confirma na sua conta gov.br", na ME "a gente abre, você só assina"). A chamada de venda é entrar na lista de espera pelo link da bio.
4. O TIPO e o DIA ${soReel ? 'do reel' : 'da peça'} já foram escolhidos no app (abaixo). Escreva pro tipo: a CTA final segue a escada dele.
5. Mostre a versão completa (itens da entrega abaixo) e pergunte se pode salvar. Só depois do "sim" chame a ferramenta **salvar_reel**. Se o usuário pedir ajuste depois de salvo, chame salvar_reel de novo (ela atualiza ${soReel ? 'o mesmo reel' : 'a mesma peça'}).

Estilo das suas mensagens: português do Brasil, curtas, sem travessão, sem cabeçalho gigante. Você não cria nem edita arquivos; quem grava é salvar_reel.
Leitura de arquivo só dentro de _memoria, _base-contabil, identidade, marketing e das pastas de skills (em Glob e Grep, passe sempre o path). Pra detalhe de um fato, a nota de origem está na cópia do vault em _base-contabil/.
${AVISO_DADOS}

## Contexto escolhido no app
${fatorR ? '' : `${TRAVA_FATOR_R}\n`}${blocoTipo(tipo)}
${pilar ? `- Pilar escolhido no app (estratégia principal, marketing/estrategia/ESTRATEGIA-PRINCIPAL.md): **${pilar.id} · ${pilar.nome}**, bloco ${pilar.bloco ?? 'sem bloco'}. ${pilar.descricao ?? ''} Quem manda é o pilar; o tipo acima é só o guia de estilo por dentro.` : ''}
${blocoFormato(formato, st, { fatorR })}
${ideia ? `- Ideia de origem: está em ideiaDeOrigem, nos dados de referência da primeira mensagem. Parta dela e do roteiroBase dela (quando houver); o gancho pode melhorar. Os fatos do tema (temaDaIdeia) são pistas: número e fato legal só se também estiverem em FATOS.md, sempre com o id do fato em Fontes.${String(ideia.notas ?? '').trim() ? ' Os cuidados de agenda e de ângulo da ideia (o que fica pra outra peça, o que não entra na fala) estão em agendaECuidados: respeite.' : ''}` : ''}
- Campanha: ${campanha ? `${campanha.nome} · ${campanha.objetivo}${campanha.fim ? ` (até ${campanha.fim.split('-').reverse().join('/')})` : ''}` : 'nenhuma'}
- Dia de publicação: ${data ? `${dataPorExtenso(data)} (${data})` : 'a definir'}
- Peça: **${rotulo}**${soReel ? '' : ' (não é só reel: siga a entrega abaixo, com a estrutura de cada tipo)'}
${reelExistente ? `- Você está EDITANDO ${soReel ? 'um reel existente: o texto atual dele (roteiro, gravação e fontes)' : 'uma peça existente: o texto atual dela (estrutura de cada tipo, legenda, produção e fontes)'} está em reelEmEdicao, nos dados de referência da primeira mensagem. Pilar, bloco e o que o calendário pediu também estão lá.${reelExistente.calendario ? ' É peça do calendário oficial: pilar, bloco, tema e formato vêm da planilha e o tema não muda (o título pode melhorar).' : ''}` : ''}
${insights ? `\n${insights}\n` : ''}
${blocoEstilo(tipo)}

${blocoEntrega(tipos, reelExistente?.formatoTexto ?? '')}
${atelie ? `\n${atelie}\n` : ''}
${blocoBaseContabil()}
`.trim();
}

// ---------- conversa ----------

// sessões do app → sessão do SDK + contexto
const sessoes = new Map();

// antes de abrir o SSE: reel NOVO precisa de dia e tipo escolhidos no app (erro 400 em português).
// Editar um reel que existe (ou continuar uma conversa já aberta) não pede de novo
// erro do SDK em português. O caso comum: a conta do Claude Code logada no PC deslogou
export function erroLegivel(msg) {
  const s = String(msg ?? '');
  if (/authenticat|oauth|not logged in|please run .login|invalid api key/i.test(s)) {
    // 21/10: no servidor (Linux, mkt.legalizai.com.br) não tem "claude" pra logar: a chave vai no claude.env
    if (process.platform !== 'win32') return 'A IA não está ligada neste servidor: falta a credencial do Claude. Com a chave colada no servidor (arquivo /etc/gestao-marketing/claude.env), o Ateliê volta a responder.';
    return 'O login do Claude Code expirou, então a skill não conseguiu responder. Abra um terminal, rode "claude" e faça o /login. Depois mande a mensagem de novo.';
  }
  return s;
}

const NOMES_TIPOS = TIPOS_REEL.map((t) => ROTULO_TIPO[t]).join(', ').replace(/, ([^,]+)$/, ' ou $1');

export function conferirPedidoChat(b, db) {
  if (b.tipo != null && b.tipo !== '' && !TIPOS_REEL.includes(b.tipo)) throw falha(400, `Tipo inválido. Escolha ${NOMES_TIPOS}.`);
  if (b.data != null && b.data !== '' && !dataValida(b.data)) throw falha(400, 'Dia inválido. Escolha o dia de publicação no calendário.');
  const editando = b.reelId && db.reels.some((r) => r.id === b.reelId);
  if (editando || (b.chatId && sessoes.has(b.chatId))) return;
  if (!dataValida(b.data)) throw falha(400, 'Pra criar um reel novo, escolha no calendário o dia do mês em que ele entra.');
  if (!TIPOS_REEL.includes(b.tipo)) throw falha(400, `Pra criar um reel novo, escolha o tipo: ${NOMES_TIPOS}.`);
}

const GRAVACAO_ZOD = z.object({
  duracao: z.string().describe('Duração total, ex.: "30-35s"'),
  quem: z.string().describe('Quem aparece na câmera'),
  local: z.string().describe('Onde exatamente, ex.: "mesa do escritório com parede lisa atrás"'),
  enquadramento: z.string().describe('Planos e posição da câmera (vertical 9:16, altura dos olhos, plano médio, close...)'),
  luz: z.string().describe('Luz natural/janela/ring light e a direção'),
  audio: z.string().describe('Lapela, silêncio, trilha baixa...'),
  figurino: z.string().optional().describe('O que vestir (sem logo de outra marca)'),
  objetos: z.array(z.string()).optional().describe('Objetos de cena'),
  broll: z.array(z.string()).optional().describe('Cada tomada de b-roll, gravada separada'),
  telasApp: z.array(z.string()).optional().describe('Arquivos de marketing/telas-app a mostrar e pra onde apontar'),
  edicao: z.string().describe('Cortes, zooms, legenda queimada Sora com 1 palavra coral por frase, tag ME/MEI no canto, end card'),
  checklist: z.array(z.string()).optional().describe('Checklist curto antes de gravar'),
});

// ac: AbortController da requisição. Cliente desconectou = o turno para.
// autor: nome de quem está logado no app (criadoPor / atualizadoPor do reel), nunca do corpo
export async function conversar({ chatId, mensagem, formatoId, campanhaId, data, tipo, reelId, ideiaId, peca, atelie, pilar }, emitir, ac, autor = null) {
  if (!String(mensagem ?? '').trim()) return emitir({ type: 'error', message: 'Mensagem vazia.' });
  const db = await carregar();
  const id = chatId || novoId('chat');
  let s = sessoes.get(id);
  if (!s) {
    // editando um reel: o que não veio do front vem do próprio reel, pra salvar_reel não apagar nada
    // (|| e não ??: o front manda "" quando o campo ficou em branco). Referência morta não entra
    const existente = reelId ? db.reels.find((r) => r.id === reelId) : null;
    const ideiaIni = db.ideias.find((i) => i.id === (ideiaId || existente?.ideiaId));
    const formatoVivo = (f) => (f && db.formatos.some((x) => x.id === f) ? f : null);
    const campanhaViva = (c) => (c && db.campanhas.some((x) => x.id === c) ? c : null);
    // tipos da peça: os do item em edição; peça nova é reel (ou o tipo que o front pediu)
    const pecas = existente ? tiposPeca(existente) : [PECAS.includes(peca) ? peca : 'reel'];
    // formato da Biblioteca de Reels só pra peça com reel (carrossel não herda o formato da ideia)
    const formatoIdeia = pecas.includes('reel') ? formatoVivo(ideiaIni?.formatoId) : null;
    s = {
      sdkSessionId: null,
      reelId: existente?.id ?? null,
      pecas,
      formatoId: formatoVivo(formatoId) || formatoVivo(existente?.formatoId) || formatoIdeia || null,
      campanhaId: campanhaViva(campanhaId) || campanhaViva(existente?.campanhaId) || CAMPANHA_PADRAO,
      data: (dataValida(data) && data) || dataOk(existente?.data) || '',
      tipo: tipoOk(tipo) || tipoOk(existente?.tipo) || tipoOk(ideiaIni?.tipo),
      ideiaId: ideiaIni?.id ?? null,
      // 21/10 (Pedro): o pilar da estratégia principal escolhido no passo 1 (o tipo por dentro sai dele)
      pilar: (Number.isInteger(Number(pilar)) && db.pilares?.some((p) => p.id === Number(pilar)) ? Number(pilar) : null) ?? existente?.pilar ?? null,
      // aba Ateliê: card antes de salvar e conferência por código (atelie.mjs). ultimoCard: o que o card disse
      atelie: atelie === true,
      ultimoCard: null,
      ocupado: false,
    };
    sessoes.set(id, s);
  }
  if (s.ocupado) return emitir({ type: 'error', message: 'Ainda estou respondendo a mensagem anterior.' });

  const formato = db.formatos.find((f) => f.id === s.formatoId);
  const st = formato ? statusFormato(formato, db.cases) : null;
  const campanha = db.campanhas.find((c) => c.id === s.campanhaId);
  const ideia = s.ideiaId ? db.ideias.find((i) => i.id === s.ideiaId) : null;
  const reelExistente = s.reelId ? db.reels.find((r) => r.id === s.reelId) : null;

  // o esquema do salvar_reel segue os tipos da peça: o tipo principal é obrigatório, o segundo é opcional
  const tipos = s.pecas ?? ['reel'];
  const principal = tipos[0];
  const temReel = tipos.includes('reel');
  const obrig = (esquema, sim) => (sim ? esquema : esquema.optional());
  const SLIDE_ZOD = z.object({
    titulo: z.string().optional().describe('Título curto do slide (opcional nos slides do meio)'),
    texto: z.string().describe('Exatamente o que vai escrito no slide'),
    visual: z.string().describe('O que a arte mostra'),
  });
  const campos = {
    ideia: z.string().describe('Título curto da peça'),
    tema: z.string().describe('O tema em uma frase'),
    pilar: z.number().int().min(1).max(17).optional().describe('Número do pilar editorial (v3; 16 e 17 entraram com o calendário de outubro)'),
    ...(temReel ? {
      hook: obrig(z.string().describe('Gancho falado (0-3s), até ~110 caracteres'), principal === 'reel'),
      textoTela: z.string().optional().describe('Opcional: texto de tela do gancho, só se ajudar (som desligado, número ou palavra-chave). CAIXA ALTA, até ~40 caracteres'),
      cenas: obrig(z.array(z.object({ tempo: z.string(), cena: z.string(), fala: z.string(), tela: z.string().optional().describe('Opcional: texto de tela só se ajudar') })).describe('4 a 7 cenas cobrindo o reel inteiro: a primeira é o gancho, a última a CTA'), principal === 'reel'),
      desenvolvimento: obrig(z.string().describe('Narração do desenvolvimento palavra por palavra, como o Pedro vai falar'), principal === 'reel'),
      cta: obrig(z.string().describe('CTA final falada, palavra por palavra'), principal === 'reel'),
    } : {}),
    ...(tipos.includes('carrossel') ? {
      carrossel: obrig(z.object({
        capa: SLIDE_ZOD.describe('Capa: titulo é o gancho'),
        slides: z.array(SLIDE_ZOD).max(18).describe('Slides do meio, na ordem'),
        final: SLIDE_ZOD.describe('Slide final de CTA: texto é a CTA da escada do tipo'),
      }).describe('Carrossel 4:5'), principal === 'carrossel'),
    } : {}),
    ...(tipos.includes('estatico') ? {
      estatico: obrig(z.object({
        headline: z.string().describe('O gancho da arte, até ~70 caracteres'),
        apoio: z.string().optional().describe('De 1 a 3 linhas curtas'),
        visual: z.string().describe('Template, cores, o que aparece e onde'),
        cta: z.string().describe('CTA da escada do tipo'),
      }).describe('Estático 4:5'), principal === 'estatico'),
    } : {}),
    ...(tipos.includes('stories') ? {
      stories: obrig(z.object({
        quadros: z.array(z.object({
          texto: z.string().describe('Exatamente o que aparece escrito no quadro'),
          visual: z.string().optional(),
          interacao: z.string().optional().describe('Enquete, caixinha de perguntas, quiz, link, contagem regressiva; vazio quando não tem'),
        })).min(1).max(20),
      }).describe('Stories 9:16, um quadro por tela'), principal === 'stories'),
    } : {}),
    legenda: obrig(z.string().max(2200), !(tipos.length === 1 && principal === 'stories')),
    gravacao: principal === 'reel'
      ? GRAVACAO_ZOD.describe('Detalhes de gravação')
      : GRAVACAO_ZOD.partial().optional().describe(temReel ? 'Detalhes de gravação do reel' : 'Detalhes de produção: tamanho em duracao, arte em edicao, checklist'),
    fontes: z.array(z.string()).optional().describe('Id do fato de _base-contabil/FATOS.md de cada número, data, preço, regra ou fato legal usado na peça, ex.: "F077 · 07-OBRIGACOES-MENSAIS §5"'),
  };

  const salvarReel = tool(
    'salvar_reel',
    `Salva (ou atualiza) a peça (${tipos.map((t) => ROTULO_PECA[t]).join(' / ')}) aprovada pelo usuário no cronograma e gera o reel.md em marketing/conteudo. Tipo e dia já vêm do app.`,
    campos,
    async (a) => {
      if (await contemSegredo(JSON.stringify(a))) {
        return { content: [{ type: 'text', text: 'Não salvei: o texto tem algo com cara de token ou chave de acesso. Tire isso e mostre a versão de novo.' }], isError: true };
      }
      // Ateliê: a conferência por código roda de novo na hora de salvar; com bloqueante, não grava
      let qa = null;
      if (s.atelie) {
        qa = await conferirAtelie(a, { db: await carregar(), reelId: s.reelId, meta: s.ultimoCard?.meta ?? {} });
        if (qa.bloqueia) return { content: [{ type: 'text', text: `Não salvei.\n${textoConferencia(qa)}` }], isError: true };
      }
      const existente = s.reelId ? (await carregar()).reels.find((r) => r.id === s.reelId) : null;
      const temRoteiro = ['hook', 'cenas', 'cta'].some((k) => a[k] != null);
      if (temRoteiro && !(a.hook && a.cenas?.length && a.cta)) {
        return { content: [{ type: 'text', text: 'Não salvei: o reel precisa de hook, cenas e cta juntos.' }], isError: true };
      }
      let gravacao, fontes, estrutura;
      try {
        gravacao = a.gravacao != null ? limparGravacao(a.gravacao) : undefined;
        fontes = limparFontes(a.fontes ?? []);
        estrutura = {
          ...(a.carrossel ? { carrossel: limparCarrossel(a.carrossel) } : {}),
          ...(a.estatico ? { estatico: limparEstatico(a.estatico) } : {}),
          ...(a.stories ? { stories: limparStories(a.stories) } : {}),
        };
      } catch (e) {
        return { content: [{ type: 'text', text: `Não salvei: ${e.message}` }], isError: true };
      }
      // pilar que não veio fica o que a peça já tinha (ou o escolhido no passo 1); o bloco acompanha o pilar quando ele muda
      const pilar = a.pilar ?? existente?.pilar ?? s.pilar ?? null;
      const bloco = existente && Number(existente.pilar) === Number(pilar) && existente.bloco ? existente.bloco : blocoDoPilar(pilar);
      const dados = {
        ideia: a.ideia,
        // peça do calendário: o tema é o da planilha
        tema: existente?.calendario ? existente.tema : a.tema,
        pilar,
        bloco,
        peca: tipos[0],
        peca2: tipos[1] ?? null,
        formatoId: s.formatoId ?? null,
        campanhaId: s.campanhaId ?? CAMPANHA_PADRAO,
        data: s.data ?? '',
        tipo: s.tipo ?? null,
        ideiaId: s.ideiaId ?? null,
        ...(temRoteiro ? { roteiro: { hook: a.hook, textoTela: a.textoTela ?? '', cenas: a.cenas.map((c) => ({ ...c, tela: c.tela ?? '' })), desenvolvimento: a.desenvolvimento ?? '', cta: a.cta } } : {}),
        ...estrutura,
        ...(a.legenda != null ? { legenda: a.legenda } : {}),
        ...(gravacao ? { gravacao } : {}),
        fontes,
        // 21/10 (Pedro): o motivo (a "defesa" do calendário) que o card trouxe vira o campo da peça
        ...(s.ultimoCard?.meta?.motivo ? { motivo: s.ultimoCard.meta.motivo } : {}),
        // nasceu no Ateliê: o card (público, persona, funil, ironia, voz) e o que a conferência deixou em aberto
        ...(qa ? { atelie: { ...(s.ultimoCard?.meta ?? {}), pendencias: qa.itens.filter((i) => !i.ok).map(({ id, nome, nivel }) => ({ id, nome, nivel })), conferidoEm: agora() } } : {}),
      };
      let reel;
      const ideiaAntiga = existente?.ideiaId ?? null;
      if (s.reelId) reel = await atualizar('reels', s.reelId, { ...dados, atualizadoPor: autor });
      if (!reel) {
        reel = await criar('reels', 'reel', {
          roteiro: roteiroLimpo(null), legenda: '', gravacao: limparGravacao(null), ...pecaVazia(),
          ...dados, status: 'roteiro', permalink: '', metricas: null, favorito: false, origemChat: id, criadoPor: autor,
        });
        s.reelId = reel.id;
      }
      // ideia e reel apontam um pro outro. O vínculo é estado, não edição da ideia: sem
      // atualizadoEm, a ideia da curadoria continua recebendo as correções de ideias.json
      const atual = await carregar();
      const nova = s.ideiaId && atual.ideias.find((i) => i.id === s.ideiaId);
      const velha = ideiaAntiga && ideiaAntiga !== s.ideiaId && atual.ideias.find((i) => i.id === ideiaAntiga);
      if ((nova && nova.reelId !== reel.id) || (velha && velha.reelId === reel.id)) {
        if (nova) nova.reelId = reel.id;
        // a ideia de antes volta pro outro reel dela, se ainda existir
        if (velha?.reelId === reel.id) repontarIdeia(atual, velha.id, reel.id);
        await salvar();
      }
      const pasta = await escreverReelMd(reel);
      emitir({ type: 'reel', reel: (await carregar()).reels.find((r) => r.id === reel.id) });
      return { content: [{ type: 'text', text: `Salvo no cronograma (id ${reel.id}, ${tipos.map((t) => ROTULO_PECA[t]).join(' / ')}, ${ROTULO_TIPO[reel.tipo] ?? 'sem tipo'}, ${reel.data || 'sem data'}) e em ${relRaiz(pasta)}/reel.md.` }] };
    }
  );

  // Ateliê: o card na tela, sem gravar nada. A resposta traz a conferência pra IA corrigir antes do "pode salvar"
  const CARD = {
    publico: z.enum(PUBLICOS).describe('Pra quem é a peça'),
    persona: z.enum(PERSONAS).describe('Dorsal do Ateliê: A Direto, B Construindo, C Precisa de mão na mão, D MEI de vida toda, E Começa Certo; ou geral'),
    estagioFunil: z.enum(ESTAGIOS).describe('Estágio do funil (lista de espera é o fundo enquanto o app não lança)'),
    dialIronia: z.enum(IRONIAS).describe('Dial de ironia da peça (a ironia mira o sistema, nunca quem lê)'),
    voz: z.enum(VOZES).describe('Quem fala: pedro, colega (alguém do time), institucional (a marca) ou leo'),
    valorExplicito: z.boolean().describe('A peça cita preço ou data da oferta?'),
    // 21/10 (estratégia principal): pilar × gatilho emocional × gatilho psicológico
    gatilhoEmocional: z.enum(GATILHOS_EMOCIONAIS).describe('Por que o post mexe com a pessoa (estratégia principal, seção 7)'),
    gatilhoPsicologico: z.enum(GATILHOS_PSICOLOGICOS).describe('O mecanismo que faz o post funcionar (estratégia principal, seção 8)'),
    excecaoAntiRepeticao: z.string().optional().describe('Só quando repete de propósito gancho, ângulo ou headline de peça recente: o motivo'),
    motivo: z.string().max(1000).describe('O motivo da peça (a "defesa" do calendário da estratégia principal): por que este post existe, em 1 a 3 frases'),
  };
  const mostrarCard = tool(
    'mostrar_card',
    'Ateliê: mostra a peça como card na tela, ao lado do chat, com a conferência das regras duras. Não grava nada. Chame com a versão completa antes de perguntar se pode salvar, e de novo a cada ajuste.',
    { ...campos, ...CARD },
    async (a) => {
      const meta = Object.fromEntries(Object.keys(CARD).map((k) => [k, a[k]]).filter(([, v]) => v !== undefined));
      const qa = await conferirAtelie(a, { db: await carregar(), reelId: s.reelId, meta });
      s.ultimoCard = { meta };
      emitir({ type: 'card', card: { ...a, personaNome: await nomePersona(a.persona) }, qa, pecas: tipos, data: s.data, tipo: s.tipo, pilar: a.pilar ?? s.pilar ?? null, formatoId: s.formatoId, reelId: s.reelId });
      return { content: [{ type: 'text', text: `Card na tela.\n${textoConferencia(qa)}` }] };
    },
  );

  const servidor = createSdkMcpServer({ name: 'cronograma', version: '1.0.0', tools: [salvarReel, ...(s.atelie ? [mostrarCard] : [])] });

  // dado do banco só no primeiro turno (depois ele já está no histórico da sessão). No Ateliê, as peças
  // recentes também vão (anti-repetição)
  const dados = s.sdkSessionId ? {} : {
    ...dadosDeReferencia({ formato, st, cases: db.cases, reelExistente, ideia }),
    ...(s.atelie ? { pecasRecentes: pecasRecentes(db, s.reelId) } : {}),
  };
  const conteudo = Object.keys(dados).length ? `${blocoDados(dados)}\n\n${mensagem}` : mensagem;

  // modo streaming-input (exigido por ferramenta in-process): o gerador segura
  // a entrada aberta até o turno terminar, senão a chamada da ferramenta morre.
  let terminar;
  const fim = new Promise((r) => (terminar = r));
  async function* entrada() {
    yield { type: 'user', message: { role: 'user', content: conteudo }, parent_tool_use_id: null, session_id: '' };
    await fim;
  }

  let avisado = false; // o erro já foi pro chat (não repete no catch)
  // daqui até o try não há await: outra mensagem do mesmo chat não entra no meio
  s.ocupado = true;
  try {
    // bloco das Métricas (SPEC-METRICAS §3.5): nunca lança; sem dado ou com erro, vem ''
    const insights = await blocoInsightsIa({ tipo: s.tipo, pecas: tipos, pilar: reelExistente?.pilar ?? null, reelId: s.reelId });
    const atelieTxt = s.atelie ? await blocoAtelie() : '';
    const q = query({
      prompt: entrada(),
      options: {
        cwd: RAIZ,
        model: process.env.CRONOGRAMA_MODEL || undefined,
        settingSources: ['user', 'project'],
        // reels-leo (skill do projeto, em .claude/skills): traz o fluxo do Construtor e o banco curado.
        // A reels-curtos saiu em 28/09 (o banco genérico dela tem o que a reforma descartou)
        skills: ['reels-leo'],
        tools: ['Read', 'Glob', 'Grep', 'Skill'],
        // Read/Glob/Grep seguem liberados pra skill em ~/.claude/skills funcionar no dontAsk;
        // quem limita o caminho é o hook (nega antes da permissão) e a lista de proibidos
        allowedTools: ['Read', 'Glob', 'Grep', 'Skill', 'mcp__cronograma__salvar_reel', ...(s.atelie ? ['mcp__cronograma__mostrar_card'] : [])],
        disallowedTools: LEITURAS_PROIBIDAS,
        hooks: hooksLeitura,
        permissionMode: 'dontAsk',
        mcpServers: { cronograma: servidor },
        includePartialMessages: true,
        resume: s.sdkSessionId ?? undefined,
        systemPrompt: { type: 'preset', preset: 'claude_code', append: montarContexto({ formato, st, campanha, data: s.data, tipo: s.tipo, reelExistente, ideia, pecas: tipos, insights, atelie: atelieTxt, pilar: s.pilar ? (db.pilares ?? []).find((p) => p.id === s.pilar) ?? null : null }) },
        maxTurns: 30,
        abortController: ac,
      },
    });
    for await (const m of q) {
      if (m.type === 'system' && m.subtype === 'init') s.sdkSessionId = m.session_id;
      else if (m.type === 'stream_event') {
        const ev = m.event;
        if (ev.type === 'message_start') emitir({ type: 'break' });
        else if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') emitir({ type: 'text', delta: ev.delta.text });
        else if (ev.type === 'content_block_start' && ev.content_block?.type === 'tool_use') emitir({ type: 'tool', name: ev.content_block.name });
      } else if (m.type === 'result') {
        s.sdkSessionId = m.session_id ?? s.sdkSessionId;
        // "success" com is_error (login expirado, por exemplo) é erro: não sai como "done ok"
        if (m.is_error && m.subtype === 'success') {
          avisado = true;
          emitir({ type: 'error', message: erroLegivel(m.result) });
        } else emitir({ type: 'done', ok: m.subtype === 'success', custo: m.total_cost_usd, reelId: s.reelId, chatId: id });
        terminar();
      }
    }
  } catch (e) {
    if (ac?.signal.aborted) return; // cliente foi embora: ninguém pra avisar
    if (!avisado) emitir({ type: 'error', message: erroLegivel(e.message) });
  } finally {
    s.ocupado = false;
    terminar();
  }
}
