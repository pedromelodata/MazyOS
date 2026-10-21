// Estratégia principal no sistema (Pedro, 21/10/2026: "importe, entenda, audite e incorpore como nossa principal
// estratégia; atualize os termos do sistema também"). A estratégia auditada está em
// marketing/estrategia/ESTRATEGIA-PRINCIPAL.md (a anatomia do orgânico, o volume semanal, o plano de lançamento e o
// calendário da semana de 26/10, do repo legalizei). Rode com o servidor PARADO:
//   node server/aplicar-estrategia-2110.mjs [--simular]
// --simular mostra o que mudaria, sem gravar. CRONOGRAMA_DATA troca a pasta de dados (teste numa cópia). Rodar de novo
// não duplica (a peça da semana do repo é achada pela marca calendario "repo-semana:2026-10-26:<n>").
//  1. pilares: o nome e a descrição da anatomia, e o status (ativo ou guardado). Entram o 14 e o 15, guardados.
//     O 3 sai sem o Mauro, o escritório e os 22 anos (P39)
//  2. config: volume da semana (3 reels, 5 feeds, 5 temas de stories), horário do feed, mix dos blocos, teto de
//     venda e onde mora a estratégia. A meta do mês passa a sair do volume da semana
//  3. campanha do pré-lançamento: as fases do plano de 15/10 (aquecimento, contagem, abertura, escala, fecho)
//  4. semana de 26/10 a 01/11: os 8 posts do calendário do repo (com os ajustes da auditoria) entram no cronograma
//     como Ideia; a peça que estava nesses dias (não postada) sai do calendário, sem data e com a nota de por que saiu.
//     Os 5 temas de stories do repo viram o tema e os quadros dos dias 26, 27, 28, 30 e 31
//  5. backup: db.antes-estrategia-2110.json na primeira vez e db.antes-estrategia-2110.ultimo.json a cada rodada
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { DB_PATH, arquivoDados, carregar, salvar, agora, novoId } from './db.mjs';
import { conferirReel, conferirStoriesDia, roteiroLimpo, pecaVazia } from './validar.mjs';
import { conferir } from './atelie.mjs';

const SIMULAR = process.argv.includes('--simular');
const PORTA = Number(process.env.PORT) || 4317;
const AUTOR = 'Estratégia principal (aplicar-estrategia-2110)';
const ARQUIVO = 'marketing/estrategia/ESTRATEGIA-PRINCIPAL.md';
const SEMANA = ['2026-10-26', '2026-11-01'];
const ORIGEM = 'Semana de 26/10 do repo legalizei (calendário v2, motor Ateliê), na estratégia principal (marketing/estrategia/ESTRATEGIA-PRINCIPAL.md).';
const tem = (v) => Boolean(String(v ?? '').trim());
const curto = (s, n) => (String(s).length > n ? `${String(s).slice(0, n - 1)}…` : String(s));
const fmt = (d) => String(d).split('-').reverse().slice(0, 2).join('/');
const sair = (msg) => { console.error(`Nada foi gravado. ${msg}`); process.exit(1); };

// 1. pilares (anatomia do orgânico; o 3 pela P39)
const PILARES = [
  { id: 1, nome: 'Bastidor do fundador', bloco: 'Afeto', status: 'ativo', descricao: 'Construção em público: a voz do Pedro como pessoa.' },
  { id: 2, nome: 'Cultural e identificável', bloco: 'Afeto', status: 'ativo', descricao: 'Piada leve sobre burocracia, sem ser genérica. É o pilar que mais se compartilha.' },
  { id: 3, nome: 'Nossa origem', bloco: 'Afeto', status: 'ativo', descricao: 'Por que o Legalizaí existe e o time que constrói o app. Sem o Mauro, o escritório Legalize ou os 22 anos (P39).' },
  { id: 4, nome: 'A dor da burocracia', bloco: 'Educação', status: 'ativo', descricao: 'O peso do dia a dia: fila, papelada, órgão que não responde, contador que some.' },
  { id: 5, nome: 'Mitos e crenças erradas', bloco: 'Educação', status: 'ativo', descricao: 'Uma crença a corrigir, como "abrir empresa é caro e demorado".' },
  { id: 6, nome: 'Calendário e prazos fiscais', bloco: 'Educação', status: 'guardado', descricao: 'Guardado desde 01/09 (falar menos de imposto). Vive como gatilho de data marcada até o público pedir.' },
  { id: 7, nome: 'Educação fiscal e enquadramento', bloco: 'Educação', status: 'guardado', descricao: 'Guardado desde 01/09. Volta quando a fase de promoção passar; o material (Fator R, anexos, CNAE) está pronto.' },
  { id: 8, nome: 'O nosso diferencial', bloco: 'Diferencial', status: 'ativo', descricao: 'Gira entre os ângulos da estratégia principal (preço fechado, gente no plano ME, daqui de BH, 7 dias na ME, capricho, tudo pelo app, preço redondo). Nunca cita concorrente.' },
  { id: 9, nome: 'Bastidor do processo', bloco: 'Diferencial', status: 'ativo', descricao: 'O contador de verdade, com CRC, aparecendo (plano ME). Responde à desconfiança que o setor carrega.' },
  { id: 10, nome: 'Oferta', bloco: 'Conversão', status: 'ativo', descricao: 'A promoção com a condição inteira (até 31/12/2026). Na ME, os 7 dias com a condição. No máximo 20% da pauta fora da promoção, 30% dentro.' },
  { id: 11, nome: 'Troca de contador', bloco: 'Conversão', status: 'ativo', descricao: 'Pra quem já tem CNPJ e o contador falhou; o app tem um caminho próprio. Sem preço e sem os 7 dias até a regra da migração sair.' },
  { id: 12, nome: 'O dinheiro do dono', bloco: 'Conversão', status: 'ativo', descricao: 'Pró-labore, retirada, planejamento.' },
  { id: 13, nome: 'Documentação em dia', bloco: 'Conversão', status: 'ativo', descricao: 'Alvará, certidões, certificado: "Sua empresa está em dia".' },
  { id: 14, nome: 'Prova e reação', bloco: null, status: 'guardado', descricao: 'Guardado: volta quando houver depoimento real. Até lá, a prova é feita pelo fundador.' },
  { id: 15, nome: 'Conteúdo do público', bloco: null, status: 'guardado', descricao: 'Guardado: volta quando a mecânica de engajamento (a caixinha quinzenal) estiver validada.' },
  { id: 16, nome: 'Dicas pra quem tem empresa', bloco: 'Educação', status: 'ativo', descricao: 'Preço, separar o dinheiro da empresa do pessoal, primeiro cliente, contrato simples. Útil e sem contabilês.' },
  { id: 17, nome: 'A facilidade do app', bloco: 'Diferencial', status: 'ativo', descricao: 'A tela de verdade fazendo o trabalho: simplicidade mostrada, não só dita.' },
];

// 2. config da semana
const CONFIG = {
  volumeSemanal: { reels: 3, feeds: 5, storiesTemas: 5 },
  horarioFeed: '18h na terça, quinta e sexta',
  mixBlocos: { Afeto: 20, Educação: 30, Diferencial: 25, Conversão: 25 },
  tetoVenda: { foraDaPromocao: 20, naPromocao: 30 },
  estrategia: { arquivo: ARQUIVO, atualizadaEm: '2026-10-21' },
};

// 3. fases do lançamento (plano de 15/10)
const FASES = [
  { nome: 'Aquecimento', inicio: '2026-10-12', fim: '2026-10-26', foco: 'Lista de espera crescendo, prova do produto.' },
  { nome: 'Contagem regressiva', inicio: '2026-10-27', fim: '2026-11-09', foco: 'Contagem até 10/11, mídia exterior instalada até 06/11.' },
  { nome: 'Abertura', inicio: '2026-11-10', fim: '2026-11-16', foco: 'O app chega; aviso à lista; a Meta muda pra instalar e assinar.' },
  { nome: 'Escala', inicio: '2026-11-17', fim: '2026-12-10', foco: 'Escalar o que converteu, prova social com os primeiros clientes.' },
  { nome: 'Fecho', inicio: '2026-12-11', fim: '2026-12-31', foco: 'Os últimos dias da promoção (vale até 31/12/2026).' },
];

// 4. a semana do repo (ideias centrais, com os ajustes da auditoria)
const POSTS = [
  {
    n: 1, data: '2026-10-26', peca: 'carrossel', tipo: 'viralizacao', pilar: 4,
    ideia: 'Quanto do seu mês vai embora com o contador',
    tema: 'A nota caçada no WhatsApp, a guia que chega em cima da hora e a resposta que demora: o tempo que o contador come do seu mês',
    notas: 'Persona B (Construindo). Léo: encaixe forte. Gatilho emocional: cansaço da burocracia (o principal). Post de atração, sem convite de venda; a ironia mira o sistema, nunca o cliente.',
  },
  {
    n: 2, data: '2026-10-27', peca: 'reel', tipo: 'conexao', pilar: 3,
    ideia: 'Quem constrói o app que chega dia 10/11',
    tema: 'A origem do Legalizaí contada pelo time que constrói o app, fechando em "salva a data: 10/11"',
    notas: 'Ajuste da auditoria (P39): o repo dizia "22 anos de escritório e um app novo". Sai o escritório e os 22 anos; a origem vem pelo time (Pedro Melo, Pedro Maia, Pedro Puntel, Thiago e Natanael). A data é pública desde 14/10, então o reel é "salva a data", não revelação. Convite só de engajamento. Léo fora (pilar 3). Feed às 18h.',
  },
  {
    n: 3, data: '2026-10-28', peca: 'carrossel', tipo: 'ensino', pilar: 11,
    ideia: '5 sinais de que é hora de trocar de contador',
    tema: 'Educativo: os sinais de que o contador de agora não está dando conta',
    notas: 'Volante a2 (consultor migrando). Léo só no gancho. 79% da lista quer trocar, e o pago testa "troque de contador" desde 14/10. Educativo, não oferta (diferente da peça C2). Ajuste: sem preço e sem os 7 dias (a venda de migração ainda não tem regra).',
  },
  {
    n: 4, data: '2026-10-29', peca: 'reel', tipo: 'conexao', pilar: 17,
    ideia: 'Emitir uma nota em 15 segundos',
    tema: 'O app em X segundos: a tela real emitindo uma nota, sem narração',
    notas: 'Persona A (Direto). Léo só no gancho, sem ironia sobre a demonstração. O "digital" mostrado, não dito. Tela real gravada do protótipo (nada de tutorial de tela que a pessoa ainda não pode usar, P11). Feed às 18h.',
  },
  {
    n: 5, data: '2026-10-29', peca: 'estatico', tipo: 'conexao', pilar: 9,
    ideia: 'O contador de verdade do plano ME',
    tema: 'O "humano" mostrado: o contador com CRC do plano ME, com rosto',
    notas: 'Persona B. Léo no meio (quem sustenta é a pessoa). Ajuste da auditoria (P39): o repo dizia "o contador de verdade da Legalize, com nome e rosto"; sai o nome do escritório. Precisa do OK do contador pro uso da imagem. Mostra a pessoa em vez de afirmar a promessa (diferente da peça C1). O "humana" sempre junto do plano ME (P06).',
  },
  {
    n: 6, data: '2026-10-30', peca: 'carrossel', tipo: 'ensino', pilar: 5,
    ideia: 'Mito: trocar de contador no meio do ano dá dor de cabeça',
    tema: 'Mito de burocracia no eixo da troca de contador',
    notas: 'Persona A. Léo: encaixe forte. Ajuste da auditoria (P11): o repo mandava pro "simulador grátis no link da bio", que não existe; o convite vira a lista de espera pelo link da bio. Feed às 18h.',
  },
  {
    n: 7, data: '2026-10-31', peca: 'reel', tipo: 'viralizacao', pilar: 2,
    ideia: 'O dono de ME no último dia do mês, caçando nota e comprovante',
    tema: 'Humor: o fim de mês de quem tem ME, e o ponto "isso podia ser simples"',
    notas: 'Persona E (dial de ironia alto). Léo: encaixe forte. Post de compartilhamento num sábado de consumo leve, sem convite de venda.',
  },
  {
    n: 8, data: '2026-11-01', peca: 'estatico', tipo: 'conselho', pilar: 16,
    ideia: 'Novembro chegou: o que muda na sua nota de serviço',
    tema: 'Emissor nacional e cliente identificado: o que muda pra ME de serviço em BH',
    notas: 'Persona A. Léo: encaixe forte. Prazo como gatilho sazonal. Antes de produzir: a regra "a partir de 01/11/2026, serviço como o seu exige o cliente identificado" veio da tela do Emitir e não foi conferida em fonte oficial; só vai ao ar com o OK do contador (o ADR de 21/10 deixou em aberto o consumidor final depois de 01/11).',
  },
];

const STORIES = [
  {
    data: '2026-10-26', objetivo: 'engajamento', pilar: 4, pecaN: 1,
    tema: 'Caixinha: qual dúvida você tem vergonha de perguntar pro contador?',
    quadros: [
      { texto: 'Qual dúvida você tem vergonha de perguntar pro contador?', visual: 'Fundo da marca', interacao: 'Caixinha de perguntas' },
      { texto: 'Sem nome: a sua pergunta pode virar conteúdo, sem expor ninguém.', visual: 'Fundo da marca', interacao: '' },
    ],
    cta: 'Manda a sua na caixinha.',
    notas: 'Abre a rodada quinzenal da "Pergunta que ninguém explica". De 3 a 5 respostas viram o carrossel "Traduzindo o contabilês" na semana de 02/11. Sempre anônimo; nunca expor situação fiscal irregular. A pergunta não é do Léo.',
  },
  {
    data: '2026-10-27', objetivo: 'vendas', pilar: 10, pecaN: 2,
    tema: 'Contagem regressiva até 10/11 com a figurinha de lembrete',
    quadros: [
      { texto: 'Faltam 14 dias. O app chega dia 10/11.', visual: 'Fundo da marca', interacao: 'Figurinha de contagem regressiva com lembrete pra 10/11' },
      { texto: 'Entra na lista de espera: não cobra nada e não te compromete.', visual: 'Fundo da marca', interacao: 'Figurinha de link: lista de espera' },
    ],
    cta: 'Ativa o lembrete e entra na lista.', fontes: ['F007', 'F009'],
    notas: 'É onde fica o convite de conversão do reel do dia: o lembrete do Instagram e a entrada na lista.',
  },
  {
    data: '2026-10-28', objetivo: 'engajamento', pilar: 8, pecaN: 3,
    tema: 'Enquete: seu contador responde em quanto tempo?',
    quadros: [{ texto: 'Seu contador responde em quanto tempo?', visual: 'Fundo da marca', interacao: 'Enquete (sugestão: No mesmo dia / Demora dias)' }],
    cta: '',
    notas: 'Persona B. Ângulo "gente desde a entrada" do pilar 8, que na estratégia principal virou "gente no plano ME". Engajamento barato que gera dado próprio pra usar depois.',
  },
  {
    data: '2026-10-30', objetivo: 'engajamento', pilar: 1, pecaN: 6,
    tema: 'Bastidor do fundador: a semana do produto (telas, testes, contagem)',
    quadros: [{ texto: 'A semana do app: telas, testes e a contagem pra 10/11.', visual: 'Vídeo real do Pedro (só com gravação)', interacao: '' }],
    cta: '',
    notas: 'Persona A. Léo fora (voz do Pedro). Mostra que o app existe e está sendo terminado: prova feita pelo fundador enquanto não há clientes. Só com gravação real.',
  },
  {
    data: '2026-10-31', objetivo: 'vendas', pilar: 10, pecaN: 7,
    tema: 'A promoção: ME a R$ 99 por mês nos 3 primeiros meses, até 31/12/2026',
    quadros: [
      { texto: 'ME: R$ 99 por mês nos 3 primeiros meses. Depois, R$ 139.', visual: 'Fundo da marca, os dois valores em destaque', interacao: '' },
      { texto: 'A promoção vale até 31/12/2026 pra quem está na lista de espera.', visual: 'Fundo da marca', interacao: '' },
      { texto: 'Na ME, 7 dias pra mudar de ideia, com dinheiro de volta se desistir antes de autorizar o envio pra Junta.', visual: 'Fundo da marca', interacao: 'Figurinha de link: lista de espera' },
    ],
    cta: 'Entra na lista de espera.', fontes: ['F003', 'F004', 'F005', 'F021', 'F022', 'F007'],
    notas: 'Persona A. Léo só no "Vai, legaliza aí". Ajuste da auditoria (P09): o repo dizia "oferta de fundador" e "vagas reais"; sai "fundador" e "vagas", fica a promoção com a validade. Repete o pilar 10 de propósito (contagem): quando virar peça, leva a exceção de anti-repetição.',
  },
];

function portaOcupada() {
  return new Promise((ok) => {
    const s = net.connect({ host: '127.0.0.1', port: PORTA });
    s.once('connect', () => { s.destroy(); ok(true); });
    s.once('error', () => ok(false));
    s.setTimeout(1500, () => { s.destroy(); ok(false); });
  });
}
if (!SIMULAR && !process.env.CRONOGRAMA_DATA && (await portaOcupada())) {
  console.error(`O servidor está no ar na porta ${PORTA}. Pare ele antes (systemctl stop gestao-marketing) e rode de novo.`);
  process.exit(1);
}

const marca = (p) => `repo-semana:${SEMANA[0]}:${p.n}`;
const naSemana = (d) => d >= SEMANA[0] && d <= SEMANA[1];

function aplicar(db) {
  const log = [];
  const mudou = { pilares: 0, config: 0, fases: 0, novas: 0, iguais: 0, sairam: 0, stories: 0 };

  // 1. pilares
  db.pilares ??= [];
  for (const p of PILARES) {
    const atual = db.pilares.find((x) => Number(x.id) === p.id);
    if (!atual) { db.pilares.push({ ...p }); mudou.pilares++; log.push(`pilar ${p.id} novo: ${p.nome} (${p.status})`); continue; }
    const antes = JSON.stringify(atual);
    Object.assign(atual, { nome: p.nome, bloco: p.bloco ?? atual.bloco ?? null, status: p.status, descricao: p.descricao });
    if (JSON.stringify(atual) !== antes) { mudou.pilares++; log.push(`pilar ${p.id}: ${p.nome} (${p.status})`); }
  }
  db.pilares.sort((a, b) => a.id - b.id);

  // 2. config
  db.config ??= {};
  const metaMes = Math.round(((CONFIG.volumeSemanal.reels + CONFIG.volumeSemanal.feeds) * 31) / 7);
  const novaConfig = { ...CONFIG, metaMensal: metaMes };
  for (const [k, v] of Object.entries(novaConfig)) {
    if (JSON.stringify(db.config[k]) !== JSON.stringify(v)) { db.config[k] = v; mudou.config++; log.push(`config.${k} = ${JSON.stringify(v)}`); }
  }

  // 3. fases da campanha
  const cmp = (db.campanhas ?? []).find((c) => c.id === 'cmp_prelancamento');
  if (cmp && JSON.stringify(cmp.fases) !== JSON.stringify(FASES)) { cmp.fases = FASES; mudou.fases++; log.push('campanha Pré-lançamento: fases do lançamento (plano de 15/10)'); }

  // 4. a semana do repo
  const ids = {};
  for (const p of POSTS) {
    const campos = conferirReel({
      ideia: p.ideia, tema: p.tema, pilar: p.pilar, peca: p.peca, peca2: null, tipo: p.tipo, data: p.data, status: 'ideia',
      campanhaId: 'cmp_prelancamento', rede: 'Instagram', formatoId: null,
      formatoTexto: { reel: 'Reel', carrossel: 'Carrossel', estatico: 'Imagem única' }[p.peca],
      pilarTexto: `${p.pilar} · ${PILARES.find((x) => x.id === p.pilar).nome}`,
      notas: `${ORIGEM} ${p.notas}`, calendario: marca(p),
    });
    const ja = db.reels.find((r) => r.calendario === marca(p));
    if (ja) {
      if (ja.atualizadoPor && ja.atualizadoPor !== AUTOR) { ids[p.n] = ja.id; log.push(`${fmt(p.data)} mexida na tela por ${ja.atualizadoPor}: não mudou`); continue; }
      const antes = JSON.stringify(ja);
      Object.assign(ja, campos);
      if (JSON.stringify(ja) !== antes) { ja.atualizadoEm = agora(); ja.atualizadoPor = AUTOR; log.push(`${fmt(p.data)} atualizada: ${p.ideia}`); } else mudou.iguais++;
      ids[p.n] = ja.id;
      continue;
    }
    const nova = {
      id: novoId('reel'), criadoEm: agora(), criadoPor: 'Calendário da semana (repo legalizei)',
      roteiro: roteiroLimpo(null), ...pecaVazia(), legenda: '', gravacao: null, fontes: [],
      ...campos, permalink: '', metricas: null, ideiaId: null, favorito: false, atualizadoEm: agora(), atualizadoPor: AUTOR,
    };
    db.reels.push(nova);
    ids[p.n] = nova.id;
    mudou.novas++;
    log.push(`${fmt(p.data)} nova (${p.peca}): ${p.ideia}`);
  }
  // o que estava nesses dias (não postado e fora da semana do repo) sai do calendário, guardado sem data
  for (const r of db.reels) {
    if (!r.data || !naSemana(r.data) || r.status === 'publicado' || (r.peca ?? 'reel') === 'stories') continue;
    if (String(r.calendario ?? '').startsWith(`repo-semana:${SEMANA[0]}:`)) continue;
    r.notas = curto([`Saiu do calendário em 21/10: a semana de 26/10 seguiu o calendário do repo (estratégia principal). Era do dia ${fmt(r.data)}. O texto continua aqui; pra voltar, é só pôr uma data.`, r.notas].filter(tem).join('\n\n'), 2000);
    log.push(`${fmt(r.data)} saiu (sem data): ${curto(r.ideia, 70)}`);
    r.data = '';
    r.atualizadoEm = agora();
    r.atualizadoPor = AUTOR;
    mudou.sairam++;
  }
  // stories: os 5 temas da semana
  db.stories ??= [];
  for (const s of STORIES) {
    const atual = db.stories.find((x) => x.data === s.data);
    const dia = conferirStoriesDia(db, {
      data: s.data, objetivo: s.objetivo, pilar: s.pilar, tema: s.tema, pecaDoDia: ids[s.pecaN] ?? null,
      quadros: s.quadros, cta: s.cta ?? '', fontes: s.fontes ?? [], notas: `${ORIGEM} ${s.notas}`,
    }, atual);
    if (atual) {
      const antes = JSON.stringify(atual);
      Object.assign(atual, dia);
      if (JSON.stringify(atual) !== antes) { atual.status = 'ideia'; atual.atualizadoEm = agora(); atual.atualizadoPor = AUTOR; mudou.stories++; log.push(`stories ${fmt(s.data)}: ${curto(s.tema, 70)}`); }
    } else {
      db.stories.push({ id: novoId('sto'), ...dia, status: 'ideia', criadoEm: agora(), criadoPor: AUTOR });
      mudou.stories++;
      log.push(`stories ${fmt(s.data)} novo: ${curto(s.tema, 70)}`);
    }
  }
  // dia de stories da semana sem tema do repo: fica, com a nota
  for (const d of db.stories.filter((x) => naSemana(x.data) && !STORIES.some((s) => s.data === x.data))) {
    const aviso = 'Fora dos 5 temas da semana do repo (26, 27, 28, 30 e 31/10): é da V1. Decida se ainda posta.';
    if (!String(d.notas ?? '').startsWith(aviso)) { d.notas = curto([aviso, d.notas].filter(tem).join('\n\n'), 2000); mudou.stories++; log.push(`stories ${fmt(d.data)}: marcado como fora da semana do repo`); }
  }
  return { mudou, log, ids };
}

const original = await readFile(DB_PATH, 'utf8');
const cru = JSON.parse(original);

// conferência dos textos que vão pro ar (tema e notas são de produção; os quadros e a CTA dos stories são públicos)
const problemas = [];
for (const s of STORIES) {
  const qa = await conferir({ legenda: [...s.quadros.map((q) => q.texto), s.cta].filter(tem).join('\n'), fontes: s.fontes ?? [] });
  for (const i of qa.itens.filter((x) => !x.ok && x.nivel === 'bloqueante')) problemas.push(`stories ${fmt(s.data)}: ${i.nome}: ${i.achados.map((a) => a.trecho).join('; ')}`);
}
for (const p of POSTS) {
  const qa = await conferir({ legenda: `${p.ideia}\n${p.tema}`, fontes: [] });
  for (const i of qa.itens.filter((x) => !x.ok && x.nivel === 'bloqueante')) problemas.push(`${fmt(p.data)}: ${i.nome}: ${i.achados.map((a) => a.trecho).join('; ')}`);
}
if (problemas.length) sair(`${problemas.length} problema(s):\n  - ${problemas.join('\n  - ')}`);

let plano;
try { plano = aplicar(structuredClone(cru)); } catch (e) { sair(e.message); }
const total = Object.entries(plano.mudou).filter(([k]) => k !== 'iguais').reduce((s, [, v]) => s + v, 0);
if (total && !SIMULAR) {
  const db = await carregar();
  plano = aplicar(db);
  const primeiro = arquivoDados('db.antes-estrategia-2110.json');
  if (!existsSync(primeiro)) await writeFile(primeiro, original);
  await writeFile(arquivoDados('db.antes-estrategia-2110.ultimo.json'), original);
  await salvar();
}
const m = plano.mudou;
console.log(`${SIMULAR ? '[simulação] ' : ''}Estratégia principal: ${m.pilares} pilar(es), ${m.config} item(ns) de config, ${m.fases ? 'fases da campanha, ' : ''}${m.novas} post(s) novo(s) da semana, ${m.sairam} fora do calendário (sem data), ${m.stories} dia(s) de stories${m.iguais ? `, ${m.iguais} igual(is)` : ''}.`);
for (const l of plano.log) console.log(`  ${l}`);
if (!total) console.log('Nada a mudar.');
process.exit(0);
