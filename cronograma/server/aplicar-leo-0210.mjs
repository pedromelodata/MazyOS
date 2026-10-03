// Grava na peça de 02/10 (reel_c261002, pilar 16) o reel animado do Léo produzido em 30/09:
// roteiro por cena com os tempos do vídeo, legenda, fontes, gravação (produção animada) e status editado.
// Rode com o servidor PARADO:  node server/aplicar-leo-0210.mjs
// Backup: data/db.antes-leo-0210.json. Rodar de novo com o mesmo texto não muda nada.
import { readFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATA_DIR, DB_PATH, carregar, salvar, agora } from './db.mjs';
import { conferirReel, conferirRefs } from './validar.mjs';
import { escreverReelMd } from './reelmd.mjs';

const ID = 'reel_c261002';
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PASTA = 'marketing/leo-animado/precificacao-2026-10-02';
const TL = JSON.parse(await readFile(path.join(RAIZ, PASTA, 'remotion', 'src', 'data', 'timeline.json'), 'utf8'));
const T = (i) => TL.words[i].s;
const TE = (i) => TL.words[i].e;
const s = (x) => x.toFixed(1).replace('.', ',');
const faixa = (a, b) => `${s(a)} a ${s(b)}s`;

function portaOcupada(porta) {
  return new Promise((ok) => {
    const c = net.connect({ host: '127.0.0.1', port: porta });
    c.once('connect', () => { c.destroy(); ok(true); });
    c.once('error', () => ok(false));
    c.setTimeout(800, () => { c.destroy(); ok(false); });
  });
}
if (await portaOcupada(4317)) {
  console.error('O servidor da Gestão de Marketing está no ar (porta 4317). Pare o servidor e rode de novo.');
  process.exit(1);
}

const cenas = [
  { tempo: faixa(0, TE(9)), fala: 'Três sinais de que você já pode cobrar mais caro.', tela: '3 sinais de que você já pode cobrar mais caro',
    cena: 'Léo animado (3D, recortado com contorno branco) com as patas abertas na frente de um disco coral que pulsa na batida. Título "3 sinais" gigante no alto; a promessa já acesa desde o quadro 0 (legenda estilo Apple).' },
  { tempo: faixa(T(10), TE(16)), fala: 'Um: seus clientes nunca reclamam do preço.', tela: '',
    cena: 'Léo à direita gesticulando, "1" coral gigante atrás. À esquerda, balões de clientes: "Fechado, pode marcar!", "Perfeito, combinado.", "Tem horário na semana que vem?".' },
  { tempo: faixa(T(17), TE(24)), fala: 'Dois: sua agenda vive cheia, meses à frente.', tela: '',
    cena: 'Léo à esquerda, "2" gigante atrás. À direita, a agenda de outubro enche de coral e novembro e dezembro empilham.' },
  { tempo: faixa(T(25), TE(34)), fala: 'Três: você cobra o mesmo valor de dois anos atrás.', tela: '',
    cena: 'Léo à direita, "3" gigante atrás. Etiqueta "R$" balançando e o ano virando 2024, 2025, 2026 embaixo dela.' },
  { tempo: faixa(T(35), TE(41)), fala: 'Bateu dois? Tá na hora de reajustar.', tela: '',
    cena: 'Léo no centro. Bolinhas 1, 2, 3 e duas ganham check. No "reajustar", uma seta coral sobe atrás dele, com soco de zoom.' },
  { tempo: faixa(T(42), TE(50)), fala: 'Cobrar mais é o seu negócio dizendo que cresceu.', tela: '',
    cena: 'Close no Léo (ele ajeita a gravata), raios de sol girando atrás e confete coral no "cresceu".' },
  { tempo: faixa(T(51), TE(69)), fala: 'E no app que tá chegando, eu fico de olho no teto do MEI, de 81 mil por ano.', tela: 'Cobrou mais, faturou mais. E o MEI tem teto. · R$ 81 mil por ano',
    cena: 'Léo à direita. À esquerda: a ponte "Cobrou mais, faturou mais. E o MEI tem teto.", o celular com a tela de abertura do app (selo APP EM CONSTRUÇÃO) e o card TETO DO MEI com a barra enchendo e o olho piscando.' },
  { tempo: faixa(T(70), TL.dur), fala: 'Comenta aqui: quais desses sinais você tem?', tela: '1 ninguém reclama · 2 agenda cheia · 3 preço parado · @legalizai.app',
    cena: 'O disco coral volta atrás do Léo (fecha em loop com o começo). Bolinhas 1, 2, 3 com rótulo curto e o @legalizai.app pequeno. Sem cartão final.' },
];

const legenda = [
  'Comenta aqui: quais desses sinais você tem?',
  'Subir o preço dá um frio na barriga. Mas o seu negócio costuma avisar quando chegou a hora.',
  'Um: seus clientes nunca reclamam do preço. Se ninguém nem pergunta se dá pra fazer mais barato, o valor ficou pequeno pro que você entrega.',
  'Dois: sua agenda vive cheia, com meses de antecedência. Procura alta e horário disputado dizem muito sobre o seu serviço.',
  'Três: você cobra o mesmo valor de dois anos atrás. Pensa em quanto ficou mais caro o que você usa pra trabalhar nesse tempo.',
  'Bateu dois desses? Tá na hora de reajustar. Cobrar mais é o seu negócio dizendo que cresceu.',
  'E se o faturamento subir, fica o lembrete: o MEI tem teto, de R$ 81 mil por ano. No app da Legalizaí, que tá chegando, eu fico de olho nisso por você.',
  'Comenta aqui: quais desses sinais você tem?',
  '#precificacao #MEI #autonomo #empreendedorismo #prestadordeservico',
].join('\n\n');

const fontes = [
  'Sinais 1 a 3: dica de rotina de dono, sem número de fato e sem regra de órgão ("dois anos" é a situação do exemplo, não dado)',
  'F051 · 09-ESCOPO-E-LIMITES §3 (teto do MEI: R$ 81 mil por ano, LC 123 art. 18-A)',
  'F044 · 07-OBRIGACOES-MENSAIS §1 (a Legalizaí monitora o teto do MEI; o governo não avisa)',
  'F040 · 07-OBRIGACOES-MENSAIS §3 (o sistema monitora o teto do MEI)',
  'F008 · 01-PLANOS-E-OFERTAS §5 (app em pré-lançamento: "o app que tá chegando")',
];

const gravacao = {
  duracao: `${s(TL.dur)}s, termina emendando no começo (loop)`,
  quem: 'Léo, o suricato, em 1ª pessoa, na tela o tempo todo (animação 3D com lip sync e gestos).',
  local: 'Fundo branco da marca (papel #FAF8F5), sem cenário.',
  enquadramento: '9:16. Léo recortado com contorno branco; muda de lado a cada sinal, fecha em close no "cresceu" e volta ao disco coral no CTA.',
  luz: 'Luz de estúdio do render.',
  audio: 'Voz do Léo (timbre Dylan, por conversão de voz sobre a narração em pt-BR), trilha Palmy Sway (G Mills, Epidemic Sound) abaixando sob a voz, efeitos sincronizados. -14 LUFS.',
  figurino: 'Polo coral com o badge do check, gravata-borboleta cinza, óculos redondos.',
  edicao: `Vídeo pronto: ${PASTA}/LEO-precificacao-v2.mp4. Motion em Remotion (${PASTA}/remotion), legenda estilo Apple (frase apagada, palavra acende ao ser dita, uma palavra-chave coral), sem a tag ME/MEI (pedido do Pedro). Capa: quadro 0 (título aceso).`,
  objetos: [],
  broll: [],
  telasApp: ['splash.png (tela de abertura, com selo APP EM CONSTRUÇÃO)'],
  checklist: ['Publicar com o áudio original do vídeo', 'Capa no quadro 0', 'Legenda do post abaixo, sem mudar número'],
};

const nota = `Reel animado do Léo produzido em 30/09 (linha editorial V1, pilar 16, Dorsal B). Vídeo: ${PASTA}/LEO-precificacao-v2.mp4. ` +
  'Ajustes do roteiro V1: "não é ganância, é..." virou "Cobrar mais é o seu negócio dizendo que cresceu" (sem oposição "não é X, é Y", reels-leo §11); ' +
  'entrou a virada pro app com o teto do MEI (F044 exige o valor junto, F051), porque conteúdo educativo fecha no app (P38). Revisão de retenção (skill corte-viral): ponte "Cobrou mais, faturou mais. E o MEI tem teto.", promessa acesa no quadro 0, CTA com rótulos e fim em loop. ' +
  `Versões sem o Léo, com a mesma fala em voz institucional ("a gente fica de olho"): ${PASTA}/BROLL-precificacao.mp4 (um b-roll do Pexels por fala, fontes e licenças em broll/fontes.md) e ${PASTA}/MOTION-precificacao.mp4 (100% motion graphics em Sora).`;

await copyFile(DB_PATH, path.join(DATA_DIR, 'db.antes-leo-0210.json'));
const db = await carregar();
const r = db.reels.find((x) => x.id === ID);
if (!r) { console.error('Peça', ID, 'não encontrada.'); process.exit(1); }
// tira a nota desta produção (se já rodou) e os dois avisos de 30/09 que ficaram velhos com o roteiro final
const antigas = (r.notas || '')
  .replace(/^Reel animado do Léo produzido em 30\/09[^\n]*\n*/, '')
  .replace(/Revisar antes de gravar \(V1, 30\/09\): o texto é o da linha editorial V1 \(planilha de outubro\), com os ajustes abaixo\. Falta definir o que aparece em cada cena\. A legenda e os detalhes de gravação ainda são do roteiro anterior\.\s*/, '')
  .replace(/Esta peça vai virar reel animado do Léo \(produção do Pedro, 30\/09\): o roteiro final entra depois, por cima deste\.\s*/, '');
let notas = `${nota}\n\n${antigas}`.trim();
if (notas.length > 2000) notas = notas.slice(0, 1997) + '...';
const bruto = {
  status: 'editado',
  roteiro: {
    hook: 'Três sinais de que você já pode cobrar mais caro.',
    textoTela: '3 sinais de que você já pode cobrar mais caro',
    cenas,
    desenvolvimento: cenas.slice(1, -1).map((c) => c.fala).join('\n\n'),
    cta: 'Comenta aqui: quais desses sinais você tem?',
  },
  legenda,
  fontes,
  gravacao,
  notas,
};
const campos = conferirReel(bruto, r);
conferirRefs(db, campos);
Object.assign(r, campos, { atualizadoEm: agora(), atualizadoPor: 'Claude (reel animado do Léo)' });
await salvar();
const pasta = await escreverReelMd(r);
console.log('ok:', ID, '| status', r.status, '| reel.md em', pasta);
