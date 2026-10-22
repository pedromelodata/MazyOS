// Decisões do Pedro de 22/10/2026 sobre a estratégia principal e a semana de 26/10 (o aplicar-ajustes-2210 grava no
// banco; o aplicar-estrategia-2110 aplica por cima do calendário do repo depois de ler o .md, pra rodar de novo não
// desfazer o que o Pedro decidiu)
//  A. "O do dia 27 mantém, mas precisa estar atualizado e substituir o 22 anos de Legalize: tudo que tem esse 22 anos
//     de Legalize, delete e apague." A P39 vale em tudo; o reel do 27/10 do calendário fica com a ideia nova e o pilar 3
//     com a descrição nova. Os alertas da P39 que estavam nas notas de 27 e 29/10 saem
//  B. "Gere outra ideia para o do dia 29" e, depois de ver a ideia, "Quero essa ideia para o dia 29 [a tirinha 'Até o
//     nada tem prazo', do Banco de Ideias]. A sua pode guardar no banco de ideias": a peça 5 do calendário (o estático
//     de 29/10) virou a tirinha em carrossel (ide_9922aaca) e a ideia escrita pela estratégia ("Bastidor da ME") foi
//     pro Banco de Ideias. As duas coisas foram gravadas no servidor em 22/10; a decisão abaixo é a tirinha campo por
//     campo, pra rodar de novo não trocar a tirinha (o reel de 29/10 do calendário, "Emitir uma nota em 15 segundos",
//     não muda)
// Na tela, ainda em 22/10, o Pedro trocou os dois reels de dia (o da nota em 15 segundos foi pro 27 e o da data 10/11
// pro 29). Os scripts não mexem na data: a peça mexida na tela conta como mexida
// Nenhum texto daqui cita o que a P39 proíbe: a ideia antiga de 29/10 aparece na nota sem o nome do escritório

export const PILAR_3 = {
  id: 3,
  descricao: 'a origem do Legalizaí e de quem constrói o produto novo. No pilar 1 é uma pessoa; aqui é a empresa',
};

// a peça da semana de 26/10 é achada pela marca do aplicar-estrategia-2110 (repo-semana:2026-10-26:<n>); data é o dia
// dela no calendário do repo
export const DECISOES_SEMANA = [
  {
    marca: 'repo-semana:2026-10-26:2', data: '2026-10-27', peca: 'reel',
    ideia: '"Um app novo: 10/11." A origem da Legalizaí revelando a data',
    nota: '22/10 (Pedro): voltou pro calendário sem o que a P39 proíbe.',
  },
  {
    marca: 'repo-semana:2026-10-26:5', data: '2026-10-29', peca: 'carrossel',
    ideia: 'Até o nada tem prazo (tirinha da Bia e do Léo)',
    tema: 'Carrossel em tirinha, 4 slides. A Bia (fotógrafa, com ME) passou um mês sem trabalhar e acha que está tudo certo; o Léo explica que até o mês parado tem declaração com prazo, e fecha dizendo que essa parte fica com a gente.',
    formato: 'Feed · carrossel (tirinha, 4 slides)',
    motivo: 'Ideia do Pedro escolhida pro dia 29 (22/10): humor de tirinha sobre a obrigação que existe até no mês parado, com o CNPJ em dia como saída; no plano ME quem entrega é o contador com CRC (F093, F092, F094).',
    pilarTexto: 'Conversão · pilar 13 · ME (a Bia) · Léo visível',
    pilar: 13, bloco: 'Conversão', status: 'ideia',
    // os ids são conferidos no FATOS.md pelo aplicar-ajustes-2210 (têm de estar como USAR); o texto segue o molde das
    // fontes das outras peças ("id · título")
    fatos: ['F093', 'F092', 'F094'],
    fontes: ['F093 · Mês sem faturamento', 'F092 · Declaração mensal (PGDAS-D)', 'F094 · Obrigações acessórias no plano ME'],
    // a nota de origem toma o lugar da do calendário (que dizia "copiado sem mudar nada"), do alerta da P39, da
    // anti-repetição e do cuidado do contador com nome e rosto, que eram da ideia antiga. O cuidado dos horários fica
    origem: 'Ideia do Pedro (22/10). Base: no mês sem faturamento a ME entrega a declaração com zero (F093), até o dia 20 (F092); no plano ME quem entrega é o contador com CRC (F094), por isso "a gente cuida". A Bia tem que ser ME: no MEI não tem declaração mensal, e do relatório mensal do MEI a base não diz que o app faz (F068). Na tirinha de 24/10 a Bia é esteticista: decidir se é a mesma Bia (fotógrafa ou esteticista). Sem susto de "12 declarações zeradas" (F093). Ironia no sistema, nunca na Bia (P22). Léo visível (asset L17). Telas e visual do app: prototipo.legalizai.com.br.',
    nota: '22/10: no lugar do estático “Bastidor da ME”, que foi pro Banco de Ideias.',
    // parágrafos das notas que eram da ideia antiga e saem (o resto, como o cuidado dos horários, fica)
    notasQueSaem: [
      /^Calendário editorial da semana de 26\/10 a 01\/11 \(repo legalizei/,
      /^Anti-repetição \(alerta, não bloqueio\): peça parecida: C1\b/,
      /^Cuidado antes de produzir: Qui 29:/,
    ],
    // no aplicar-estrategia-2110, o que o calendário põe nas notas e fica (os outros extras da linha são da ideia antiga)
    extrasQueFicam: [/^Cuidado antes de produzir: Horários:/],
  },
];

// o alerta da P39 que o aplicar-estrategia-2110 punha nas notas ("até o Pedro decidir"): sai de toda peça não postada
export const ALERTA_P39 = /^Alerta das regras de copy\b[^\n]*\bP39\b/;
// a frase "Mauro não aparece" das notas de gravação (gravacao.quem dos reels de setembro), com o parêntese dela
export const FRASE_MAURO = /\s*\b(?:o\s+)?Mauro\s+n[ãa]o\s+aparece\b[^.!?\n]*[.!?]?/gi;
// notas internas de 22/10 que ainda citavam o que a P39 proíbe, na forma nova (a frase inteira, onde estiver: nas notas
// da peça, na ideia pra onde ela foi e na peça guardada na ideia)
export const NOTAS_TROCADAS = [
  [/22\/10 \(Pedro\): voltou pro calendário sem os \d+ anos de escritório \(P39\)\./g, '22/10 (Pedro): voltou pro calendário sem o que a P39 proíbe.'],
];
