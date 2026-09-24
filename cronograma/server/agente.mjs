// Chat "Criar reel": roda a skill reels-curtos via Claude Agent SDK, com a
// conta do Claude Code já logada nesta máquina (sem chave de API).
// O agente só lê (Read/Glob/Grep/Skill), e só nas pastas liberadas em guarda.mjs. Quem grava é a
// ferramenta salvar_reel, que o servidor controla: vai pro banco e vira um reel.md em marketing/conteudo.
// Dado do banco (ideia, cases, reel em edição) vai na primeira mensagem dentro de
// <dados_de_referencia>, não no system prompt: pode carregar texto de terceiro (legenda do Instagram).
// Reel NOVO só começa com dia e tipo escolhidos (conferirPedidoChat, 400 antes do SSE). Tipo e dia
// vêm da sessão, nunca do modelo; o reel.md sai do gerador compartilhado em reelmd.mjs.
// 23/09: o tipo escolhido traz o guia do estilo (data/estilos.json) pro system prompt, com as famílias
// de gancho casadas com as categorias do banco da skill reels-curtos. Reel que vem de uma ideia leva o
// roteiro base dela e os fatos com fonte do tema dela nos dados de referência.
// Fator R tem uma peça só no cronograma (23/09): fora dela, o contexto proíbe o assunto e deixa de fora
// o exemplo de formato que fala dele (a mesma trava do ideias-ia.mjs).
import { query, tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import {
  carregar, criar, atualizar, salvar, statusFormato, novoId, repontarIdeia, falha, dataValida,
  TIPOS_REEL, ROTULO_TIPO, limparGravacao, limparFontes, guia, temaDoGuia, nomeTema, TEMA_LEGADO,
} from './db.mjs';
import { RAIZ } from './importar.mjs';
import { CAMPANHA_PADRAO } from './migrar.mjs';
import { hooksLeitura, LEITURAS_PROIBIDAS, contemSegredo, blocoDados, AVISO_DADOS } from './guarda.mjs';
import { escreverReelMd, relRaiz } from './reelmd.mjs';

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const dataOk = (d) => (typeof d === 'string' && DATA_ISO.test(d) ? d : '');
const tipoOk = (t) => (TIPOS_REEL.includes(t) ? t : null);

const FATOR_R = 'tm_fator_r';
const FALA_DE_FATOR_R = /fator\s*r\b|15,5\s*%/i;
// a peça de Fator R: a ideia é do tema Fator R ou o reel em edição é o de Fator R
export const ehPecaFatorR = ({ ideia = null, reelExistente = null } = {}) =>
  (TEMA_LEGADO[ideia?.tema] ?? ideia?.tema) === FATOR_R || /fator\s*r\b/i.test(reelExistente?.ideia ?? '');
const TRAVA_FATOR_R = '- Fator R já tem a peça única do cronograma (23/09). Não faça reel sobre Fator R, Anexo III e V ou o simulador, nem use isso como gancho, exemplo ou CTA, a não ser que o usuário peça. O exemplo do formato serve só de estrutura.';

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
    '  - CTA final, falado: "Entra na lista de espera pelo link da bio: rápido, poucas perguntas." (variação aceita: "Quer garantir? Leva menos de 1 minuto.")',
    '  - Venda pelos diferenciais antes do preço: preço fechado sem asterisco, contador CRC de verdade no plano ME (NUNCA no MEI, que tem assistente virtual), tudo pelo celular, onboarding rápido, custo de saída declarado, hiperlocal BH/MG.',
    '  - A oferta com número (MEI R$19 e ME R$79 nos 3 primeiros meses, depois R$49 e R$139, válida até 31/12/2026, garantia de 7 dias) só entra se o usuário pedir: o pilar 10 (oferta) já está saturado. Prefira os pilares 8, 11, 12 e 13.',
  ],
  viralizacao: [
    '**Viralização** (topo de funil). Emoção e identificação: o reel ganha no salvar, compartilhar, marcar alguém e comentar.',
    '  - CTA final SÓ de engajamento (salva, marca alguém, comenta, compartilha). Nada de link, lista de espera ou funil.',
    '  - A ironia mira o sistema (burocracia, contabilês, portal que cai), nunca o cliente nem o contador. Ironia mais baixa pra público mais velho.',
  ],
  ensino: [
    '**Ensino** (educativo). Um conceito só por reel, traduzido pra fala de gente, sem termo técnico sem tradução.',
    '  - CTA final: salvar o post pra consultar depois, ou mandar pra quem precisa.',
  ],
};

// o simulador de Fator R só aparece na peça de Fator R
function blocoTipo(tipo, { fatorR = false } = {}) {
  const t = TIPO_CONTEXTO[tipo];
  if (!t) return '- Tipo do reel: não definido (reel antigo). Pergunte ao usuário se é Viralização, Vendas, Conexão ou Ensino antes de mexer na CTA.';
  const linhas = fatorR && tipo === 'ensino' ? [...t, '  - Esta é a peça de Fator R: a CTA também pode ser "Simule seu Fator R grátis (link na bio)".'] : t;
  return `- Tipo do reel: ${linhas.join('\n')}`;
}

// as categorias do "Banco de Ganchos de Referência" da skill reels-curtos (títulos ### do SKILL.md)
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
    `- Ganchos: na ETAPA 2 da skill reels-curtos, sugira os ganchos do banco da skill${cats.length ? ` só destas categorias: ${cats.join(', ')}` : ''}, adaptados como nas famílias abaixo. Os ganchos modelo já estão adaptados ao nicho e também valem como sugestão.`,
    `  - Famílias de gancho do estilo (categoria do banco: adaptação):\n${itens(e.familiasDeGancho)}`,
    `  - Ganchos modelo:\n${itens(e.ganchosModelo)}`,
    `- Estrutura do estilo:\n${itens(e.estrutura, '  ')}`,
    `- CTAs do estilo: na ETAPA 3 da skill, proponha uma destas (ou variação curta) em vez de perguntar do zero:\n${itens(e.ctas, '  ')}`,
    `- Evitar:\n${itens(e.evitar, '  ')}`,
  ].filter(Boolean).join('\n');
}

const ENTREGA = `
## O que a entrega PRECISA ter (cada parte vira um campo do app)
1. **Formato**: o escolhido acima, em uma linha (código e nome).
2. **Hook** falado (0 a 3s, forte, até ~110 caracteres) e o **texto de tela** do hook (CAIXA ALTA, até ~40 caracteres).
3. **Narração do desenvolvimento PALAVRA POR PALAVRA**, do jeito que o Pedro vai falar (pt-BR natural, ~2,1 palavras por segundo de vídeo).
4. **CTA final** palavra por palavra, da escada do tipo escolhido.
5. **Roteiro cena a cena**: 4 a 7 cenas com tempo, cena (o que a câmera mostra), fala exata e texto de tela. Hook + desenvolvimento + CTA são exatamente as falas das cenas.
6. **Detalhes de gravação**: duração, quem aparece, local exato, enquadramento (vertical 9:16, altura dos olhos, plano médio, close...), luz, áudio, figurino (sem logo de outra marca), objetos, cada tomada de b-roll separada, telas do app (nomes de arquivo de marketing/telas-app/_manifesto.json e pra onde apontar), edição (cortes, zooms, legenda queimada em Sora com 1 palavra coral por frase, tag ME/MEI no canto, end card) e checklist antes de gravar.
7. **Fontes**: a fonte de cada número ou fato legal usado em qualquer parte do reel. Número sem fonte não entra.

Produção enxuta: um celular, tripé, microfone de lapela e luz natural; cada reel precisa ser gravado em menos de 30 minutos com o que um escritório pequeno tem (a edição é o gargalo do time). Quem apresenta é o Pedro (fundador, produto e dev; 1ª pessoa liberada pra bastidor). Formato de diálogo pede o Pedro e mais uma pessoa do time, por exemplo o Mauro (sócio, 22 anos de contabilidade em BH). Legenda até 2.200 caracteres: CTA, desenvolvimento, CTA de novo e poucas hashtags, uma ideia por parágrafo. salvar_reel recebe tudo isso, gravação e fontes inclusive.`.trim();

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
    dados.reelEmEdicao = {
      ideia: reelExistente.ideia, tema: reelExistente.tema, pilar: reelExistente.pilar ?? null, roteiro: reelExistente.roteiro,
      legenda: reelExistente.legenda, gravacao: reelExistente.gravacao ?? null, fontes: reelExistente.fontes ?? [],
    };
  }
  return dados;
}

export function montarContexto({ formato, st, campanha, data, tipo, reelExistente, ideia }) {
  const fatorR = ehPecaFatorR({ ideia, reelExistente });
  return `
# Você está dentro do app "Gestão de Marketing" do Legalizaí

Fluxo desta conversa:
1. Carregue a skill **reels-curtos** com a ferramenta Skill ANTES da primeira resposta e siga o fluxo dela, uma etapa por mensagem (tema e origem do gancho, sugestões do banco, CTA, entrega).
2. Antes de escrever qualquer copy, leia \`_memoria/preferencias.md\` e \`_memoria/estrategia.md\`. As REGRAS DURAS valem sem exceção: zero travessão, grafia "Legalizaí", zero concorrente citado, MEI sem contador humano, escassez só a real (31/12/2026), número só com fonte, todo termo técnico traduzido, guarda-corpos da Reforma (nunca "imposto novo", o MEI não "paga mais", Simples Híbrido é opcional), CTA de reel orgânico é "link da bio" (nunca "link abaixo"), copy fala com "você". A skill é genérica; onde ela conflitar com essas regras, as regras do Legalizaí mandam.
3. O app do Legalizaí está em PRÉ-LANÇAMENTO: ninguém consegue baixar ainda. Fale do "app que tá chegando"; nada de "baixe agora" nem tutorial de algo que a pessoa ainda não pode usar. A chamada de venda é entrar na lista de espera pelo link da bio.
4. O TIPO e o DIA do reel já foram escolhidos no app (abaixo). Escreva pro tipo: a CTA final segue a escada dele.
5. Mostre a versão completa (itens da entrega abaixo) e pergunte se pode salvar. Só depois do "sim" chame a ferramenta **salvar_reel**. Se o usuário pedir ajuste depois de salvo, chame salvar_reel de novo (ela atualiza o mesmo reel).

Estilo das suas mensagens: português do Brasil, curtas, sem travessão, sem cabeçalho gigante. Você não cria nem edita arquivos; quem grava é salvar_reel.
Leitura de arquivo só dentro de _memoria, identidade, marketing e das pastas de skills (em Glob e Grep, passe sempre o path).
${AVISO_DADOS}

## Contexto escolhido no app
${fatorR ? '' : `${TRAVA_FATOR_R}\n`}${blocoTipo(tipo, { fatorR })}
${blocoFormato(formato, st, { fatorR })}
${ideia ? `- Ideia de origem: está em ideiaDeOrigem, nos dados de referência da primeira mensagem. Parta dela e do roteiroBase dela (quando houver); o gancho pode melhorar. Os fatos e as fontes do tema estão em temaDaIdeia: número e fato legal só desses (ou de fonte que você citar), sempre com a fonte em Fontes.${String(ideia.notas ?? '').trim() ? ' Os cuidados de agenda e de ângulo da ideia (o que fica pra outra peça, o que não entra na fala) estão em agendaECuidados: respeite.' : ''}` : ''}
- Campanha: ${campanha ? `${campanha.nome} · ${campanha.objetivo}${campanha.fim ? ` (até ${campanha.fim.split('-').reverse().join('/')})` : ''}` : 'nenhuma'}
- Dia de publicação: ${data ? `${dataPorExtenso(data)} (${data})` : 'a definir'}
${reelExistente ? '- Você está EDITANDO um reel existente: o texto atual dele (roteiro, gravação e fontes) está em reelEmEdicao, nos dados de referência da primeira mensagem.' : ''}

${blocoEstilo(tipo)}

${ENTREGA}
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
    return 'O login do Claude Code expirou, então a skill não conseguiu responder. Abra um terminal, rode "claude" e faça o /login. Depois mande a mensagem de novo.';
  }
  return s;
}

export function conferirPedidoChat(b, db) {
  if (b.tipo != null && b.tipo !== '' && !TIPOS_REEL.includes(b.tipo)) throw falha(400, 'Tipo inválido. Escolha Viralização, Vendas, Conexão ou Ensino.');
  if (b.data != null && b.data !== '' && !dataValida(b.data)) throw falha(400, 'Dia inválido. Escolha o dia de publicação no calendário.');
  const editando = b.reelId && db.reels.some((r) => r.id === b.reelId);
  if (editando || (b.chatId && sessoes.has(b.chatId))) return;
  if (!dataValida(b.data)) throw falha(400, 'Pra criar um reel novo, escolha no calendário o dia do mês em que ele entra.');
  if (!TIPOS_REEL.includes(b.tipo)) throw falha(400, 'Pra criar um reel novo, escolha o tipo: Viralização, Vendas, Conexão ou Ensino.');
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
export async function conversar({ chatId, mensagem, formatoId, campanhaId, data, tipo, reelId, ideiaId }, emitir, ac, autor = null) {
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
    s = {
      sdkSessionId: null,
      reelId: existente?.id ?? null,
      formatoId: formatoVivo(formatoId) || formatoVivo(existente?.formatoId) || formatoVivo(ideiaIni?.formatoId) || null,
      campanhaId: campanhaViva(campanhaId) || campanhaViva(existente?.campanhaId) || CAMPANHA_PADRAO,
      data: (dataValida(data) && data) || dataOk(existente?.data) || '',
      tipo: tipoOk(tipo) || tipoOk(existente?.tipo) || tipoOk(ideiaIni?.tipo),
      ideiaId: ideiaIni?.id ?? null,
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

  const salvarReel = tool(
    'salvar_reel',
    'Salva (ou atualiza) o reel aprovado pelo usuário no cronograma e gera o reel.md em marketing/conteudo. Tipo e dia já vêm do app.',
    {
      ideia: z.string().describe('Título curto da ideia do reel'),
      tema: z.string().describe('O tema em uma frase'),
      pilar: z.number().int().min(1).max(15).optional().describe('Número do pilar editorial (v3)'),
      hook: z.string().describe('Gancho falado (0-3s), até ~110 caracteres'),
      textoTela: z.string().describe('Texto de tela do gancho, CAIXA ALTA, até ~40 caracteres'),
      cenas: z.array(z.object({ tempo: z.string(), cena: z.string(), fala: z.string(), tela: z.string() })).describe('4 a 7 cenas cobrindo o reel inteiro'),
      desenvolvimento: z.string().describe('Narração do desenvolvimento palavra por palavra, como o Pedro vai falar'),
      cta: z.string().describe('CTA final falada, palavra por palavra'),
      legenda: z.string().max(2200),
      gravacao: GRAVACAO_ZOD.describe('Detalhes de gravação'),
      fontes: z.array(z.string()).optional().describe('Fonte de cada número ou fato legal usado no reel'),
    },
    async (a) => {
      if (await contemSegredo(JSON.stringify(a))) {
        return { content: [{ type: 'text', text: 'Não salvei: o texto tem algo com cara de token ou chave de acesso. Tire isso e mostre a versão de novo.' }], isError: true };
      }
      let gravacao, fontes;
      try {
        gravacao = limparGravacao(a.gravacao);
        fontes = limparFontes(a.fontes ?? []);
      } catch (e) {
        return { content: [{ type: 'text', text: `Não salvei: ${e.message}` }], isError: true };
      }
      const dados = {
        ideia: a.ideia,
        tema: a.tema,
        pilar: a.pilar ?? null,
        formatoId: s.formatoId ?? null,
        campanhaId: s.campanhaId ?? CAMPANHA_PADRAO,
        data: s.data ?? '',
        tipo: s.tipo ?? null,
        ideiaId: s.ideiaId ?? null,
        roteiro: { hook: a.hook, textoTela: a.textoTela, cenas: a.cenas, desenvolvimento: a.desenvolvimento, cta: a.cta },
        legenda: a.legenda,
        gravacao,
        fontes,
      };
      let reel;
      const ideiaAntiga = s.reelId ? (await carregar()).reels.find((r) => r.id === s.reelId)?.ideiaId : null;
      if (s.reelId) reel = await atualizar('reels', s.reelId, { ...dados, atualizadoPor: autor });
      if (!reel) {
        reel = await criar('reels', 'reel', { ...dados, status: 'roteiro', permalink: '', metricas: null, favorito: false, origemChat: id, criadoPor: autor });
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
      return { content: [{ type: 'text', text: `Salvo no cronograma (id ${reel.id}, ${ROTULO_TIPO[reel.tipo] ?? 'sem tipo'}, ${reel.data || 'sem data'}) e em ${relRaiz(pasta)}/reel.md.` }] };
    }
  );

  const servidor = createSdkMcpServer({ name: 'cronograma', version: '1.0.0', tools: [salvarReel] });

  // dado do banco só no primeiro turno (depois ele já está no histórico da sessão)
  const dados = s.sdkSessionId ? {} : dadosDeReferencia({ formato, st, cases: db.cases, reelExistente, ideia });
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
    const q = query({
      prompt: entrada(),
      options: {
        cwd: RAIZ,
        model: process.env.CRONOGRAMA_MODEL || undefined,
        settingSources: ['user', 'project'],
        skills: ['reels-curtos'],
        tools: ['Read', 'Glob', 'Grep', 'Skill'],
        // Read/Glob/Grep seguem liberados pra skill em ~/.claude/skills funcionar no dontAsk;
        // quem limita o caminho é o hook (nega antes da permissão) e a lista de proibidos
        allowedTools: ['Read', 'Glob', 'Grep', 'Skill', 'mcp__cronograma__salvar_reel'],
        disallowedTools: LEITURAS_PROIBIDAS,
        hooks: hooksLeitura,
        permissionMode: 'dontAsk',
        mcpServers: { cronograma: servidor },
        includePartialMessages: true,
        resume: s.sdkSessionId ?? undefined,
        systemPrompt: { type: 'preset', preset: 'claude_code', append: montarContexto({ formato, st, campanha, data: s.data, tipo: s.tipo, reelExistente, ideia }) },
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
