// As 5 ideias de reel pra terça 03/11 no Banco de Ideias (27/10/2026, Pedro: "Coloque o enquanto você e suba todas as
// ideias para o banco"). O leão vira gatinho, que era o reel da terça, já foi ao ar; o Pedro escolheu o "Enquanto
// você..." (entra no PLANO.md da semana de 02/11, marcado como favorita aqui) e as outras 4 ficam livres no banco.
// Rode com o servidor PARADO:
//   node server/aplicar-ideias-0311.mjs [--simular]
// --simular confere tudo e mostra o que entraria, sem gravar. CRONOGRAMA_DATA troca a pasta de dados (teste numa cópia).
// Rodar de novo não duplica: cada ideia tem id fixo, e a que já está no banco fica como está (alguém pode ter editado).
//  0. confere o texto antes de abrir o banco: travessão, hífen solto, concorrente, grafia, P39, "funcionário", "grátis"
//     e loja que não existe
//  1. limparIdeia sobre ideiaPadrao, e a validação não pode cortar nem trocar texto
//  2. backup só quando algo entra: db.antes-ideias-0311.json na primeira vez e db.antes-ideias-0311.ultimo.json a cada rodada
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import { DB_PATH, arquivoDados, carregar, salvar, agora } from './db.mjs';
import { limparIdeia, ideiaPadrao } from './validar.mjs';
import { lerGuia } from './migrar.mjs';

const SIMULAR = process.argv.includes('--simular');
const PORTA = Number(process.env.PORT) || 4317;
const AUTOR = 'Ideias pra terça 03/11 (aplicar-ideias-0311)';
const sair = (msg) => { console.error(`Nada foi gravado. ${msg}`); process.exit(1); };

const F040 = 'F040 · Quem faz o quê no dia a dia';
const IDEIAS = [
  {
    id: 'ide_0311_enquanto', favorita: true,
    titulo: 'Reel "Enquanto você...": a vida de um lado, o app trabalhando do outro',
    descricao: 'Montagem paralela em Luz Coral: de um lado a vida de quem assiste, do outro a tela real do app com o Léo trabalhando. Prova a promessa "A gente devolve o seu tempo." mostrando quem faz o quê (F040).',
    tipo: 'vendas', tema: 'tm_quem_faz_o_que', publico: 'MEI + ME',
    gancho: 'Você emite a nota e paga a guia. O cálculo é com a gente.', estiloGancho: 'G67 do banco de ganchos (reels-leo)',
    roteiroBase: {
      hook: 'Você emite a nota e paga a guia. O cálculo é com a gente.',
      textoTela: 'Uma frase "Enquanto você..." por corte, no lado da vida; no outro lado, a tela real do app e o Léo',
      narracao: '"Enquanto você janta, a guia do mês fica pronta."\n\n"Enquanto você tá no aniversário, eu fico de olho no prazo."\n\n"Enquanto você dorme, eu somo o que você faturou."\n\n"100% digital. E 100% humana."\n\n"Dia 10/11, a parte chata muda de dono." "Vai, legaliza aí."',
      cta: 'Marca quem merece jantar sem pensar em guia.',
    },
    fontes: [F040],
    notas: 'Escolhida pelo Pedro em 27/10 pro reel de terça 03/11 (entrou no PLANO.md da semana de 02/11; o leão já foi ao ar). Pilar 17 facilidade do app · personas A e B · Léo forte: fala em 1ª pessoa, então aparece no lado do app (P29) · ironia baixa. Tudo sai do F040: o sistema soma o faturamento, calcula e emite a guia, e a Legalizaí avisa os prazos. Ajuste de 27/10: saiu a virada "O resto da conta é com a gente", porque a nota do G67 veta frase de resto; o gancho já diz "O cálculo é com a gente". Alerta de repetição: "a guia do mês fica pronta" encosta no reel de 06/11 do cronograma ("A guia do mês chega pronta. Você só paga.") e no carrossel da guia de sexta 06/11 do PLANO.md. Quadros-chave e prévia vão pro Pedro antes do take final.',
  },
  {
    id: 'ide_0311_legal',
    titulo: 'Reel "É legal": a palavra fica parada e a vida passa por trás',
    descricao: 'Reel de uns 16 s em Luz Coral. A palavra "legal" fica fixa no mesmo lugar do quadro do começo ao fim, as cenas passam por trás dela e no fecho ela vira "Vai, legaliza aí.". O fecho da campanha é a própria piada.',
    tipo: 'viralizacao', tema: 'tm_papelada_cansa', publico: 'MEI + ME',
    gancho: 'O que você faria com o tempo da papelada?', estiloGancho: 'G56 do banco de ganchos (reels-leo), adaptado',
    roteiroBase: {
      hook: 'O que você faria com o tempo da papelada?',
      textoTela: 'O "legal" fixo num vazio do quadro (parede, céu), sem cobrir mão nem ação',
      narracao: '0 a 2 s: mesa com uma pilha de papel presa por um clipe coral. Na tela, o gancho.\n\n2 a 9 s: o "É legal" fica fixo e só o complemento muda, no ritmo da batida: "É legal jantar sem o notebook na mesa." (tigela coral) · "É legal chegar no aniversário na hora." (balão coral) · "É legal pegar a estrada na sexta." (lenço coral na janela) · "É legal cochilar no sábado à tarde." (almofada coral na rede)\n\n9 a 11 s: volta a mesa de papel. "Sabe o que não é legal?" e o "legal" ganha um risco.\n\n11 a 13 s: um toque no app, com a tela real da guia. "A guia do mês chega pronta." e "100% digital."\n\n13 a 14 s: volta a rede. "E 100% humana."\n\n14 a 16 s: o "legal" ganha o resto e vira "Vai, legaliza aí.". Entram "Dia 10/11, a parte chata muda de dono.", o Léo no último quadro e o logo.',
      cta: 'Marca quem merece um sábado sem papelada.',
    },
    fontes: [F040],
    notas: 'Ideia de 27/10 pro reel de terça 03/11, que ficou com o "Enquanto você...". Pilar 2 cultural · todas as personas · Léo no último quadro · ironia baixa, no virar do "não é legal", mirando a papelada. CTA só de engajamento (topo emocional). Legenda: "Marca quem merece um sábado sem papelada." / 🍽️ Jantar sem notebook na mesa. / 🎂 Aniversário sem chegar atrasado. / 📲 A guia do mês chegando pronta no app. / "Dia 10/11, a parte chata muda de dono. Vai, legaliza aí." Produção: 5 quadros parados em Luz Coral e a tela real, animados no kit com aproximação leve e câmera travada, sem take no Veo. Quadros-chave vão pro Pedro antes de animar.',
  },
  {
    id: 'ide_0311_despejo',
    titulo: 'Reel "O aviso de despejo": a parte chata recebe o aviso de mudança',
    descricao: 'Episódio 1 da história que fecha no reel "A parte chata muda de dono". A pilha de papel com clipe coral está esparramada no sofá, como dona da casa. O Léo chega e entrega um envelope coral escrito "AVISO DE MUDANÇA". A pilha treme e deixa cair uma folha. Um dia vira o aviso e o outro a mudança: a contagem ganha uma história.',
    tipo: 'viralizacao', tema: 'tm_papelada_cansa', publico: 'MEI + ME',
    gancho: 'Esse vídeo é pra quem cansou de papelada', estiloGancho: 'G59 do banco de ganchos (reels-leo)',
    roteiroBase: {
      hook: 'Esse vídeo é pra quem cansou de papelada',
      textoTela: '"AVISO DE MUDANÇA" no envelope coral',
      narracao: 'A pilha de papel com clipe coral esparramada no sofá, em Luz Coral. O Léo entra e entrega o envelope coral "AVISO DE MUDANÇA". A pilha treme e deixa cair uma folha.\n\nLéo: "Arruma suas coisas. Dia 10/11 você vem morar comigo."\n\nCartela: "Dia 10/11, a parte chata muda de dono." "Vai, legaliza aí."',
      cta: 'Marca quem divide o sofá com uma pilha dessas.',
    },
    fontes: [F040],
    notas: 'Ideia de 27/10 pro reel de terça 03/11, que ficou com o "Enquanto você...". Pilar 2 cultural · todas as personas · Léo forte (fala em 1ª pessoa e aparece) · ironia alta, mirando a papelada. Uns 8 a 10 s, pra rever em loop. Produção barata: a pilha é a mesma do reel de sábado 07/11 do PLANO.md, então a imagem de referência serve pros dois e resolve o risco da pilha mudar de forma entre takes. Quadros-chave vão pro Pedro antes de animar.',
  },
  {
    id: 'ide_0311_cracha',
    titulo: 'Reel "O crachá do Léo": do PJtinha ao PJtão',
    descricao: 'O Léo aparece com o crachá "MEI" cuidando da rotina. Uma barra de faturamento sobe, ele vê o teto chegando e avisa antes. Ele troca o crachá por "ME" e entra um contador com CRC (só as mãos e a caneca coral). A versão em vídeo do carrossel "Do PJtinha ao PJtão".',
    tipo: 'vendas', tema: 'tm_teto_mei', publico: 'MEI + ME',
    gancho: 'O governo não te avisa quando o MEI passa do limite', estiloGancho: 'G03 do banco de ganchos (reels-leo)',
    roteiroBase: {
      hook: 'O governo não te avisa quando o MEI passa do limite.',
      textoTela: '"Teto do MEI: R$ 81 mil por ano" já na primeira cena (P18)',
      narracao: 'O Léo com o crachá "MEI" cuidando da rotina.\n\nA barra de faturamento sobe. O Léo vê o teto chegando e avisa antes.\n\nEle troca o crachá por "ME" e entra o contador com CRC (só as mãos e a caneca coral).\n\n"Do PJtinha ao PJtão, sem trocar de contabilidade." "100% digital. E 100% humana." "Vai, legaliza aí."',
      cta: 'Salva pra lembrar quanto cabe no seu MEI.',
    },
    fontes: ['F044 · Monitoramento do teto do MEI', 'F051 · Teto do MEI', 'F010 · O que o plano MEI inclui', 'F011 · MEI não tem contador humano', 'F013 · O que o plano ME inclui'],
    notas: 'Ideia de 27/10 pro reel de terça 03/11, que ficou com o "Enquanto você...". Pilar 8 diferencial · personas B e E · Léo forte. No MEI quem cuida é o Léo (assistente virtual) e o contador com CRC só aparece no ME (F010, F011, F013). O teto vem com o valor junto (o F044 pede o F051). "Sem trocar de contabilidade" é a frase do mote (variação "Do PJtinha ao PJtão", 25/10). Alerta de repetição: mesmo ângulo do carrossel de segunda 02/11 do PLANO.md; a vantagem é virar a versão em vídeo dele no dia da enquete "Hoje você é PJtinha ou PJtão?".',
  },
  {
    id: 'ide_0311_faltam7',
    titulo: 'Reel "Faltam 7 dias": o Pedro mostra uma parte do app que ainda não apareceu',
    descricao: 'O Pedro grava no celular, sem produção: a tela do app em teste, uma parte que ainda não apareceu no perfil e um teste que ele fez hoje. Do Luz Coral fica só a unidade visual (Sora e o coral na cartela).',
    tipo: 'conexao', tema: null, publico: 'MEI + ME',
    gancho: 'Tem uma parte desse app que eu ainda não mostrei aqui', estiloGancho: 'G17 do banco de ganchos (reels-leo)',
    roteiroBase: {
      hook: 'Tem uma parte desse app que eu ainda não mostrei aqui.',
      textoTela: 'Cartela final em Sora, com o coral: "Dia 10/11."',
      narracao: 'O Pedro, na voz dele, com a tela do app em teste: mexe numa parte que ainda não apareceu no perfil e conta um teste que fez hoje.\n\nFecho: "Dia 10/11." "Vai, legaliza aí."',
      cta: 'Comenta qual parte do app você quer ver primeiro.',
    },
    fontes: [],
    notas: 'Ideia de 27/10 pro reel de terça 03/11, que ficou com o "Enquanto você...". Pilar 1 bastidor fundador · persona A · Léo fora, na voz do Pedro em 1ª pessoa. A mais barata e a mais verdadeira. Cuidados: só telas já aprovadas (broll L01 e L04 a L07; L02, L03 e L09 bloqueadas) e nada de prometer loja, porque o app segue em teste interno. Encosta no stories de bastidor de sexta 06/11 do PLANO.md, em outro formato. Alerta de repetição: o reel de 02/11 do cronograma já usa este gancho G17 como título.',
  },
];

// ---------- 0. regras duras no texto ----------
// travessão, meia-risca e parentes, montados por código pra nenhum aparecer no fonte
const TRACO = new RegExp(`[${String.fromCharCode(0x2012, 0x2013, 0x2014, 0x2015)}]`);
const PROIBIDOS = [
  [TRACO, 'travessão ou meia-risca'],
  [/ - /, 'hífen solto entre espaços no lugar do travessão'],
  [/\b(contabilizei|agilize|contaj[aá]|facilite|contabilivre|marvee|conta ?azul|nubank)\b/i, 'concorrente citado por nome'],
  [/\bLegaliz(?:ai|ei)\b(?![.\w])/, 'grafia da marca é "Legalizaí"'],
  [/\bmauro\b|\blegalize\b|22 anos/i, 'Mauro, escritório ou "22 anos" (P39)'],
  [/funcion[aá]ri/i, 'é "colaborador", nunca "funcionário"'],
  [/gr[aá]tis/i, '"grátis" (P10)'],
  [/app store|play store|google play|j[aá] dispon[ií]vel|\bbaix(?:e|a) (?:agora|o app)\b/i, 'loja ou download que não existe (P11)'],
];
const textos = (v) => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(textos) : v && typeof v === 'object' ? Object.values(v).flatMap(textos) : []);
const erros = [];
for (const i of IDEIAS) {
  for (const t of textos(i)) {
    for (const [re, motivo] of PROIBIDOS) {
      const m = t.match(re);
      if (m) erros.push(`${i.id}: ${motivo} ("${m[0]}" em "${t.slice(0, 80)}")`);
    }
  }
}

// ---------- 1. validação do servidor, sem corte ----------
function montar({ id, favorita = false, ...campos }) {
  const limpo = limparIdeia(campos);
  const saiu = textos(limpo);
  const cortado = textos(campos).find((t) => t.trim() && !saiu.includes(t.trim()));
  if (cortado) erros.push(`${id}: a validação cortou ou mudou o texto "${cortado.slice(0, 80)}" (limite de tamanho?)`);
  return { id, ...ideiaPadrao(), ...limpo, favorita, origem: 'manual', criadaEm: agora(), criadoPor: AUTOR };
}
// o tema só valida com os temas do nicho carregados (estilos.json), o que o boot faria
await lerGuia();
let novas;
try {
  novas = IDEIAS.map(montar);
} catch (e) { sair(e.message); }
if (erros.length) sair(`\n  ${erros.join('\n  ')}`);

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

// ---------- 2. grava ----------
const original = await readFile(DB_PATH, 'utf8');
const jaTem = new Set(JSON.parse(original).ideias.map((i) => i.id));
const entram = novas.filter((n) => !jaTem.has(n.id));
if (entram.length && !SIMULAR) {
  const db = await carregar();
  const primeiro = arquivoDados('db.antes-ideias-0311.json');
  if (!existsSync(primeiro)) await writeFile(primeiro, original);
  await writeFile(arquivoDados('db.antes-ideias-0311.ultimo.json'), original);
  db.ideias.push(...entram.filter((n) => !db.ideias.some((i) => i.id === n.id)));
  await salvar();
}
console.log(`${SIMULAR ? '[simulação] ' : ''}Banco de Ideias: ${entram.length} de ${novas.length} ideias pra terça 03/11 ${SIMULAR ? 'entrariam' : 'entraram'}.`);
for (const n of novas) console.log(`  ${jaTem.has(n.id) ? 'já estava' : SIMULAR ? 'entraria' : 'entrou'}: ${n.titulo}${n.favorita ? ' (favorita: a escolhida)' : ''}`);
if (!entram.length) console.log('Nada a mudar.');
process.exit(0);
