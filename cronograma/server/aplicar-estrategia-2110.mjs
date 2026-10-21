// Estratégia principal no sistema (Pedro, 21/10/2026: "importe, entenda, audite e incorpore como nossa principal
// estratégia; atualize os termos do sistema também"). A estratégia está em marketing/estrategia/ESTRATEGIA-PRINCIPAL.md
// (a anatomia do orgânico, o volume semanal, o plano de lançamento e o calendário da semana de 26/10, do repo
// legalizei). Rode com o servidor PARADO:
//   node server/aplicar-estrategia-2110.mjs [--simular]
// --simular mostra o que mudaria, sem gravar. CRONOGRAMA_DATA troca a pasta de dados (teste numa cópia). Rodar de novo
// não duplica (a peça da semana do repo é achada pela marca calendario "repo-semana:2026-10-26:<n>").
// 21/10, 2ª rodada (Pedro): "o .md é a fonte verdade ... não é para tirar, descartar ou reescrever alguma ideia, tudo
// deve ser 100% exato ao que está ali". Os ajustes da auditoria da 1ª rodada saíram: a semana e os pilares são lidos
// na hora, das cópias fiéis, e entram sem mudar uma palavra. Onde a ideia bate numa regra de copy (P39, P11, P09), o
// alerta vai nas notas e a conferência do Ateliê segura o texto público; a ideia fica como está
//  1. pilares: nome e descrição exatos da anatomia do orgânico de 21/10 (ESTRATEGIA-PRINCIPAL.md, seções 3 e 4) e o
//     status (ativo ou guardado)
//  2. config: volume da semana (3 reels, 5 feeds, 5 temas de stories), horário do feed, mix dos blocos, teto de
//     venda e onde mora a estratégia. A meta do mês passa a sair do volume da semana
//  3. campanha do pré-lançamento: as fases do plano de 15/10 (aquecimento, contagem, abertura, escala, fecho)
//  4. semana de 26/10 a 01/11, da tabela do calendário (_base-contabil/estrategia/2026-10-26-calendario-...md):
//     ideia = "Ideia central", motivo = "Defesa", pilarTexto = "Pilar · persona · Léo", formatoTexto = "Formato";
//     bloco e pilar saem do texto do pilar. Os 8 posts entram como Ideia; a peça que estava nesses dias (não
//     postada) sai do calendário, sem data e com a nota de por que saiu. Os 5 temas de stories viram os stories dos
//     dias 26, 27, 28, 30 e 31, ligados ao post do dia e sem quadros (o texto se escreve depois, no Ateliê). Dia de
//     stories da semana que não está no .md sai
//  5. stories soltos antes de 26/10 saem (Pedro, 21/10: "limpe esses mini stories que ficaram soltos antes do dia
//     26. Arranca fora")
//  6. backup: db.antes-estrategia-2110.json na primeira vez e db.antes-estrategia-2110.ultimo.json a cada rodada
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { DB_PATH, arquivoDados, carregar, salvar, agora, novoId, BLOCOS, blocoDoPilar, tipoDoPilar } from './db.mjs';
import { conferirReel, conferirStoriesDia, roteiroLimpo, pecaVazia } from './validar.mjs';
import { conferir } from './atelie.mjs';
import { RAIZ } from './importar.mjs';

const SIMULAR = process.argv.includes('--simular');
const PORTA = Number(process.env.PORT) || 4317;
const AUTOR = 'Estratégia principal (aplicar-estrategia-2110)';
const ARQUIVO = 'marketing/estrategia/ESTRATEGIA-PRINCIPAL.md';
const CALENDARIO = '_base-contabil/estrategia/2026-10-26-calendario-editorial-semana-26-10-a-01-11.md';
const SEMANA = ['2026-10-26', '2026-11-01'];
const ORIGEM = 'Calendário editorial da semana de 26/10 a 01/11 (repo legalizei, versão 2): ideia, formato, pilar e motivo copiados sem mudar nada (Pedro, 21/10: o .md é a fonte verdade). Estratégia: marketing/estrategia/ESTRATEGIA-PRINCIPAL.md.';
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const tem = (v) => Boolean(String(v ?? '').trim());
const curto = (s, n) => (String(s).length > n ? `${String(s).slice(0, n - 1)}…` : String(s));
const fmt = (d) => String(d).split('-').reverse().slice(0, 2).join('/');
const sair = (msg) => { console.error(`Nada foi gravado. ${msg}`); process.exit(1); };
// negrito e código do markdown saem; as palavras ficam
const semMarcacao = (s) => String(s).replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').trim();

// linhas de uma tabela markdown que começa no cabeçalho que bate com cab
function tabela(linhas, cab) {
  const i = linhas.findIndex((l) => cab.test(l));
  if (i < 0) return null;
  const rows = [];
  for (const l of linhas.slice(i + 2)) {
    if (!l.trim().startsWith('|')) break;
    rows.push(l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()));
  }
  return rows;
}

// 1. pilares: as tabelas das seções 3 (ativos, um bloco por subtítulo) e 4 (guardados) da anatomia
function lerPilares(md) {
  const linhas = md.split(/\r?\n/);
  const ini = linhas.findIndex((l) => /^### 3\. Os 13 pilares ativos/.test(l));
  const gua = linhas.findIndex((l) => /^### 4\. Os 4 pilares guardados/.test(l));
  if (ini < 0 || gua < ini) throw new Error(`As seções 3 e 4 da anatomia (os pilares) não foram achadas em ${ARQUIVO}.`);
  const out = [];
  let bloco = null;
  for (let k = ini + 1; k < gua; k++) {
    const h = linhas[k].match(/^#### (.+)/);
    if (h) { bloco = BLOCOS.find((b) => h[1].startsWith(b)) ?? null; continue; }
    const m = linhas[k].match(/^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/);
    if (!m) continue;
    const id = Number(m[1]);
    if (!bloco || blocoDoPilar(id) !== bloco) throw new Error(`O pilar ${id} está no bloco "${bloco}" na anatomia e em "${blocoDoPilar(id)}" no sistema (db.mjs).`);
    out.push({ id, nome: semMarcacao(m[2]), bloco, status: 'ativo', descricao: semMarcacao(m[3]) });
  }
  for (let k = gua + 1; k < linhas.length && !/^#{2,3} /.test(linhas[k]); k++) {
    const m = linhas[k].match(/^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/);
    if (m) out.push({ id: Number(m[1]), nome: semMarcacao(m[2]), status: 'guardado', descricao: `Por que parou: ${semMarcacao(m[3])}. Volta quando: ${semMarcacao(m[4])}.` });
  }
  const ids = out.map((p) => p.id).sort((a, b) => a - b).join(',');
  if (ids !== Array.from({ length: 17 }, (_, i) => i + 1).join(',')) throw new Error(`A anatomia deu os pilares ${ids}; são 17 (1 a 17).`);
  return out;
}

// 4. a semana: a tabela Dia | Formato | Ideia central | Pilar · persona · Léo | Defesa, linha a linha
function dataDoDia(txt) {
  const m = semMarcacao(txt).match(/^(Dom|Seg|Ter|Qua|Qui|Sex|Sáb)\s+(\d{1,2})(?:\/(\d{1,2}))?$/);
  if (!m) throw new Error(`Dia que não deu pra ler na tabela: "${txt}".`);
  for (let d = new Date(`${SEMANA[0]}T12:00:00`); d.toLocaleDateString('sv-SE') <= SEMANA[1]; d.setDate(d.getDate() + 1)) {
    if (d.getDate() !== Number(m[2]) || (m[3] && d.getMonth() + 1 !== Number(m[3]))) continue;
    if (DIAS_SEMANA[d.getDay()] !== m[1]) throw new Error(`"${txt}": o dia ${m[2]} não é ${m[1]}.`);
    return d.toLocaleDateString('sv-SE');
  }
  throw new Error(`O dia "${txt}" não está na semana de ${fmt(SEMANA[0])} a ${fmt(SEMANA[1])}.`);
}
function pecaDoFormato(f) {
  const t = f.toLowerCase();
  if (t.includes('stories')) return 'stories';
  if (t.includes('reel')) return 'reel';
  if (t.includes('carrossel')) return 'carrossel';
  if (t.includes('imagem única') || t.includes('estático')) return 'estatico';
  throw new Error(`Formato que não deu pra ler na tabela: "${f}".`);
}
// "Educação · pilar 4 · persona B · Léo encaixe forte": o bloco é a primeira parte (quando é um bloco) e o pilar, o
// número depois de "pilar". "Mecânica recorrente" e "momentâneo (lançamento)" ficam sem número: vale o texto
function lerPilar(txt) {
  const bloco = BLOCOS.find((b) => txt.split('·')[0].trim() === b) ?? null;
  const n = txt.match(/\bpilar (\d+)/);
  const pilar = n ? Number(n[1]) : null;
  if (pilar && bloco && blocoDoPilar(pilar) !== bloco) throw new Error(`"${txt}": o pilar ${pilar} é do bloco ${blocoDoPilar(pilar)}, não ${bloco}.`);
  return { bloco: bloco ?? blocoDoPilar(pilar), pilar };
}

// a anti-repetição e os três cuidados do .md vão, sem mudar o texto, nas notas da peça de que falam
const ANTI_REPETICAO = {
  'Sáb 31, stories de oferta': ['2026-10-31', 'stories'],
  'Qua 28, troca de contador': ['2026-10-28', 'carrossel'],
  'Qui 29, contador real': ['2026-10-29', 'estatico'],
};
const CUIDADOS = [['Dom 01/11:', '2026-11-01', 'estatico'], ['Qui 29:', '2026-10-29', 'estatico'], ['Horários:', null, 'feed']];
// regras de copy que batem com a ideia (seção 5 da estratégia principal): alerta pro texto público, a ideia fica
const ALERTAS_COPY = {
  '2026-10-27:reel': 'P39: a ideia cita os "22 anos de escritório". O texto público não cita o Mauro, o escritório Legalize nem os 22 anos até o Pedro decidir se a P39 vale pra esta peça.',
  '2026-10-29:estatico': 'P39: a ideia cita "o contador de verdade da Legalize" (o nome do escritório). O texto público segue a P39 até o Pedro decidir.',
  '2026-10-30:carrossel': 'P11 e F009: o convite é "o simulador grátis no link da bio", e a base diz que só existem 3 links. O link do simulador precisa existir antes do post.',
  '2026-10-31:stories': 'P09 e F005: a base proíbe "vagas de fundador" e diz que a promoção é uma só. O Pedro decide se as vagas de fundador valem.',
};

function lerSemana(md) {
  const linhas = md.split(/\r?\n/);
  const rows = tabela(linhas, /^\|\s*Dia\s*\|\s*Formato\s*\|\s*Ideia central\s*\|\s*Pilar · persona · Léo\s*\|\s*Defesa\s*\|/);
  if (!rows?.length) throw new Error(`A tabela da semana (Dia | Formato | Ideia central | Pilar · persona · Léo | Defesa) não foi achada em ${CALENDARIO}.`);
  const itens = rows.map((c) => {
    if (c.length !== 5) throw new Error(`Linha da semana com ${c.length} colunas (são 5): ${c.join(' | ')}`);
    const [dia, formato, ideia, pilarTexto, motivo] = c;
    return { dia: semMarcacao(dia), data: dataDoDia(dia), formato, ideia, pilarTexto, motivo, peca: pecaDoFormato(formato), ...lerPilar(pilarTexto), extras: [] };
  });
  const achar = (data, peca) => itens.find((x) => x.data === data && (peca === 'feed' ? ['carrossel', 'estatico'].includes(x.peca) : x.peca === peca));
  const anti = tabela(linhas, /^\|\s*Item desta semana\s*\|\s*Peça parecida\s*\|\s*O que fiz\s*\|/) ?? [];
  for (const [item, parecida, feito] of anti) {
    const alvo = ANTI_REPETICAO[item];
    if (!alvo || !achar(...alvo)) throw new Error(`Anti-repetição: "${item}" não tem peça na semana. Confira o ANTI_REPETICAO do script.`);
    achar(...alvo).extras.push(`Anti-repetição (alerta, não bloqueio): peça parecida: ${semMarcacao(parecida)}. O que o calendário fez: ${semMarcacao(feito)}.`);
  }
  const ic = linhas.findIndex((l) => /^## Três cuidados antes de produzir/.test(l));
  const cuidados = ic < 0 ? [] : linhas.slice(ic + 1).filter((l, k, a) => /^\d\.\s/.test(l) && !a.slice(0, k).some((x) => /^## /.test(x))).map((l) => semMarcacao(l.replace(/^\d\.\s+/, '')));
  if (cuidados.length !== CUIDADOS.length) throw new Error(`Os "Três cuidados" do calendário vieram com ${cuidados.length} itens.`);
  cuidados.forEach((t, k) => {
    const [rotulo, data, peca] = CUIDADOS[k];
    if (!t.startsWith(rotulo)) throw new Error(`O cuidado ${k + 1} não começa com "${rotulo}": ${curto(t, 60)}`);
    const alvos = data ? [achar(data, peca)] : itens.filter((x) => ['carrossel', 'estatico'].includes(x.peca));
    for (const a of alvos) {
      if (!a) throw new Error(`O cuidado ${k + 1} não tem peça na semana.`);
      a.extras.push(`Cuidado antes de produzir: ${t}`);
    }
  });
  for (const x of itens) {
    const al = ALERTAS_COPY[`${x.data}:${x.peca}`];
    if (al) x.extras.push(`Alerta das regras de copy (vale no texto público, não muda a ideia): ${al}`);
  }
  let n = 0;
  const posts = itens.filter((x) => x.peca !== 'stories').map((x) => ({ ...x, n: ++n }));
  const stories = itens.filter((x) => x.peca === 'stories');
  for (const s of stories) {
    s.post = posts.find((p) => p.data === s.data) ?? null;
    s.objetivo = s.bloco === 'Conversão' ? 'vendas' : 'engajamento';
  }
  return { posts, stories };
}

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

let PILARES, SEMANA_MD;
try {
  PILARES = lerPilares(await readFile(path.join(RAIZ, ARQUIVO), 'utf8'));
  SEMANA_MD = lerSemana(await readFile(path.join(RAIZ, CALENDARIO), 'utf8'));
} catch (e) { sair(e.message); }

const marca = (p) => `repo-semana:${SEMANA[0]}:${p.n}`;
const naSemana = (d) => d >= SEMANA[0] && d <= SEMANA[1];
const notasDe = (x) => [ORIGEM, ...x.extras].join('\n\n');

function aplicar(db) {
  const log = [];
  const mudou = { pilares: 0, config: 0, fases: 0, novas: 0, iguais: 0, sairam: 0, stories: 0, storiesFora: 0 };

  // 1. pilares
  db.pilares ??= [];
  for (const p of PILARES) {
    const atual = db.pilares.find((x) => Number(x.id) === p.id);
    if (!atual) { db.pilares.push({ ...p, bloco: p.bloco ?? blocoDoPilar(p.id) }); mudou.pilares++; log.push(`pilar ${p.id} novo: ${p.nome} (${p.status})`); continue; }
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

  // 4. a semana do .md, palavra por palavra
  const ids = {};
  for (const p of SEMANA_MD.posts) {
    const campos = conferirReel({
      ideia: p.ideia, tema: '', motivo: p.motivo, pilar: p.pilar, bloco: p.bloco, peca: p.peca, peca2: null, tipo: tipoDoPilar(p.pilar),
      data: p.data, status: 'ideia', campanhaId: 'cmp_prelancamento', rede: 'Instagram', formatoId: null,
      formatoTexto: p.formato, pilarTexto: p.pilarTexto, notas: notasDe(p), calendario: marca(p),
    });
    const ja = db.reels.find((r) => r.calendario === marca(p));
    if (ja) {
      if (ja.atualizadoPor && ja.atualizadoPor !== AUTOR) { ids[p.n] = ja.id; log.push(`${fmt(p.data)} mexida na tela por ${ja.atualizadoPor}: não mudou`); continue; }
      const antes = JSON.stringify(ja);
      Object.assign(ja, campos);
      if (JSON.stringify(ja) !== antes) { ja.atualizadoEm = agora(); ja.atualizadoPor = AUTOR; log.push(`${fmt(p.data)} (${p.peca}) agora igual ao .md: ${curto(p.ideia, 70)}`); } else mudou.iguais++;
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
    log.push(`${fmt(p.data)} nova (${p.peca}): ${curto(p.ideia, 70)}`);
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
  // stories: os 5 temas da semana, cada um ligado ao post do mesmo dia
  db.stories ??= [];
  for (const s of SEMANA_MD.stories) {
    const atual = db.stories.find((x) => x.data === s.data);
    const dia = conferirStoriesDia(db, {
      data: s.data, objetivo: s.objetivo, pilar: s.pilar, bloco: s.bloco, tema: s.ideia, pecaDoDia: s.post ? ids[s.post.n] ?? null : null,
      quadros: [], cta: '', fontes: [], notas: notasDe(s), pilarTexto: s.pilarTexto, motivo: s.motivo,
    }, atual);
    if (atual) {
      const antes = JSON.stringify(atual);
      Object.assign(atual, dia);
      if (JSON.stringify(atual) !== antes) { atual.status = 'ideia'; atual.atualizadoEm = agora(); atual.atualizadoPor = AUTOR; mudou.stories++; log.push(`stories ${fmt(s.data)} agora igual ao .md: ${curto(s.ideia, 70)}`); }
    } else {
      db.stories.push({ id: novoId('sto'), ...dia, status: 'ideia', criadoEm: agora(), criadoPor: AUTOR });
      mudou.stories++;
      log.push(`stories ${fmt(s.data)} novo: ${curto(s.ideia, 70)}`);
    }
  }
  // 5. stories que saem: antes de 26/10 (soltos) e os dias da semana que o .md não tem
  const sai = (x) => x.data < SEMANA[0] || (naSemana(x.data) && !SEMANA_MD.stories.some((s) => s.data === x.data));
  const fora = db.stories.filter(sai);
  for (const x of fora.filter((y) => naSemana(y.data))) log.push(`stories ${fmt(x.data)} saiu (não está no .md): ${curto(x.tema, 70)}`);
  const antes26 = fora.filter((y) => y.data < SEMANA[0]);
  if (antes26.length) {
    const porMes = Object.entries(antes26.reduce((m, y) => ((m[y.data.slice(0, 7)] = (m[y.data.slice(0, 7)] ?? 0) + 1), m), {})).map(([k, v]) => `${v} de ${k.slice(5)}/${k.slice(0, 4)}`).join(', ');
    const postados = antes26.filter((y) => y.status === 'publicado').length;
    const comVideo = antes26.filter((y) => y.videos?.length).length;
    log.push(`stories antes de 26/10 saíram: ${antes26.length} (${porMes}; ${postados} marcados como postados${comVideo ? `; ${comVideo} com vídeo final` : ''})`);
  }
  db.stories = db.stories.filter((x) => !sai(x));
  mudou.storiesFora = fora.length;
  return { mudou, log, ids };
}

const original = await readFile(DB_PATH, 'utf8');
const cru = JSON.parse(original);

// a conferência do Ateliê nas ideias só avisa: a ideia é a do .md e não muda. Ela segura o texto público depois
const alertas = [];
for (const x of [...SEMANA_MD.posts, ...SEMANA_MD.stories]) {
  const qa = await conferir({ legenda: x.ideia, fontes: [] });
  for (const i of qa.itens.filter((y) => !y.ok && y.nivel === 'bloqueante')) alertas.push(`${fmt(x.data)} (${x.peca}): ${i.nome}: ${i.achados.map((a) => a.trecho).join('; ')}`);
}

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
console.log(`${SIMULAR ? '[simulação] ' : ''}Estratégia principal: ${m.pilares} pilar(es), ${m.config} item(ns) de config, ${m.fases ? 'fases da campanha, ' : ''}${m.novas} post(s) novo(s) da semana, ${m.sairam} fora do calendário (sem data), ${m.stories} dia(s) de stories, ${m.storiesFora} dia(s) de stories apagado(s)${m.iguais ? `, ${m.iguais} igual(is)` : ''}.`);
for (const l of plano.log) console.log(`  ${l}`);
if (alertas.length) {
  console.log(`Alertas das regras de copy nas ideias (a ideia fica como está; o texto público passa pela conferência):`);
  for (const a of alertas) console.log(`  ${a}`);
}
if (!total) console.log('Nada a mudar.');
process.exit(0);
