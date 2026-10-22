// Os 4 posts de 22 a 25/10/2026 (Pedro, 21/10: "no sistema os dias 22, 23, 24 e 25 estão sem nada"; aprovados no
// chat em 21/10: o carrossel de mitos, a tirinha e o estático do certificado; em 22/10 o Pedro trocou o de sexta pelo
// carrossel da Lei Complementar 238/2026, e o reel das 3 perguntas foi pro Banco de Ideias; o domingo virou o fim da escala 6x1 e o certificado foi pro banco). Nenhum de vendas, e nenhum tema da semana de 26/10 (nota, troca de
// contador, contador com rosto). A data do lançamento não aparece: a revelação é em 27/10 (calendário da semana).
// O carrossel e a tirinha vêm do plano diário (conteudo-plano-diario-2026-10.mjs), com o fecho sem a data e a dona
// da tirinha trocada pra persona B. O texto segue a reels-leo; as fontes são ids do _base-contabil/FATOS.md (o
// aplicar confere que estão como USAR) e o texto passa na conferência do Ateliê.
const kit = (n) => ({
  duracao: `Carrossel 4:5, ${n} slides (1080x1350)`,
  quem: 'Voz institucional ("a gente")',
  edicao: 'Carrossel do kit: fundo papel quente, cards com borda hairline, Sora, 1 palavra coral por slide. Tag ME / MEI no canto superior esquerdo',
});

export const SEMANA = [
  {
    data: '2026-10-22', peca: 'carrossel', tipo: 'viralizacao', pilar: 5, bloco: 'Educação', status: 'roteiro',
    ideia: '3 coisas que te disseram sobre abrir empresa e não são verdade',
    tema: 'Três mitos sobre abrir empresa: nome sujo, carteira assinada e morar fora do país',
    formatoTexto: 'Carrossel do kit, só texto (5 slides)',
    pilarTexto: 'Educação · pilar 5 · persona A · Léo encaixe forte',
    motivo: 'Mito desfeito foi o formato que mais rendeu no radar do Instagram (346x a média da conta). Só texto, no kit: fica pronto no mesmo dia. O fecho fala do "app que tá chegando", sem a data, pra guardar a revelação de 27/10.',
    carrossel: {
      capa: { titulo: '3 coisas que te disseram sobre abrir empresa e não são verdade', texto: '', visual: 'Capa só com texto. A palavra em coral: verdade. Cabe o Léo de sentinela no canto (L17, gerado com a referência), sem fala' },
      slides: [
        { titulo: '"Nome sujo impede de abrir CNPJ."', texto: 'Não impede. SPC e Serasa são crédito, não registro. O que trava é pendência do CPF na Receita ou na Justiça Eleitoral.', visual: 'O mito riscado em cima e a resposta embaixo' },
        { titulo: '"Quem tem carteira assinada não pode ter empresa."', texto: 'Pode, sim. Carteira assinada não impede ser sócio de uma ME no Simples Nacional.', visual: 'O mito riscado em cima e a resposta embaixo' },
        { titulo: '"Morando fora do país, dá pra ter ME no Simples."', texto: 'Não dá. Sócio que mora no exterior impede a empresa de optar pelo Simples Nacional.', visual: 'O mito riscado em cima e a resposta embaixo' },
      ],
      final: { titulo: '', texto: 'No app que tá chegando, a gente pergunta antes o que costuma travar. Conhece alguém que precisa ver isso? Manda pra essa pessoa.', visual: 'Fecho com o símbolo da marca' },
    },
    legenda: 'Manda esse post pra quem tá adiando abrir a empresa por causa de um desses. 👀\n\n🧐 Tem muita regra de ouvir falar que não é regra.\n📲 No app que tá chegando, a gente pergunta antes o que costuma travar a abertura.\n\nConhece alguém que precisa ver isso? Manda pra essa pessoa. 👇',
    fontes: ['F135', 'F106', 'F105'],
    gravacao: { ...kit(5), checklist: ['O mito 3 é do Simples Nacional: sócio no exterior (F105)', 'Sem a data do lançamento (a revelação é em 27/10)'] },
    notas: 'Gancho G68 (curadoria do banco). Texto do plano diário de 21/10, com o fecho sem a data. Ajustes do Pedro Maia (22/10): o mito 3 virou o de morar fora do país (F105), no lugar do de morar em BH; ser só administrador, sem ser sócio, não está na base.',
  },
  {
    data: '2026-10-23', peca: 'carrossel', tipo: 'ensino', pilar: 16, bloco: 'Educação', status: 'roteiro',
    ideia: 'A lei nova do MEI saiu: 3 coisas que mudam pra você',
    tema: 'Lei Complementar 238/2026: o limite do MEI sobe, até 2 funcionários e perdão de dívidas com a União',
    formatoTexto: 'Carrossel do kit, só texto (8 slides)',
    pilarTexto: 'Educação · pilar 16 (novidade como gatilho) · persona D (MEI) · Léo sério',
    motivo: 'Pedido do Pedro (22/10): a Lei Complementar 238/2026, sancionada e publicada em 21/10, muda o limite do MEI, a contratação e as dívidas com a União. É a notícia mais útil da semana pro público, e o post sai no dia seguinte. Carrossel só de texto: fica pronto rápido e cada número fica no slide certo.',
    carrossel: {
      capa: { titulo: 'A lei nova do MEI saiu: 3 coisas que mudam pra você', texto: '', visual: 'Capa só com texto; "lei nova" em coral; tag MEI. Tom de informação, sem susto' },
      slides: [
        { titulo: '1. O limite de faturamento sobe', texto: 'Em 2027, o MEI vai poder faturar até R$ 110 mil por ano.', visual: 'Card de texto, o número em destaque' },
        { titulo: 'E sobe de novo em 2028', texto: 'O limite chega a R$ 140 mil por ano.', visual: 'Card de texto, o número em destaque' },
        { titulo: '2. Até 2 funcionários', texto: 'O MEI vai poder contratar até 2 pessoas, nas atividades que a lei permite, pagando pelo menos o salário mínimo ou o piso da categoria.', visual: 'Card de texto' },
        { titulo: '3. Perdão de dívidas', texto: 'Dívidas com a União constituídas até 13/10/2026 entram no perdão, se a guia do mês ficar em dia nos primeiros meses da medida. O que já foi pago não volta.', visual: 'Card de texto, tom sério' },
        { titulo: 'Quando começa', texto: 'Quase tudo começa em 1º/01/2027, e parte da lei ainda depende de regulamentação.', visual: 'Card de texto' },
        { titulo: 'De onde vem', texto: 'Lei Complementar 238/2026, publicada no Diário Oficial da União em 21/10/2026.', visual: 'Card de fonte: só o nome da lei e a data, sem brasão e sem nome de político' },
      ],
      final: { titulo: '', texto: 'O limite muda, e a gente fica de olho nele. No app que tá chegando, a gente acompanha o seu faturamento até o limite. Salva esse post pra quando 2027 chegar.', visual: 'Fecho com o símbolo da marca' },
    },
    legenda: 'Salva esse post pra quando 2027 chegar. 📌\n\n📜 A Lei Complementar 238/2026 saiu em 21/10 e muda o MEI.\n📈 O limite sobe de R$ 81 mil pra R$ 110 mil por ano em 2027, e pra R$ 140 mil em 2028.\n👥 O MEI vai poder contratar até 2 pessoas, nas atividades que a lei permite.\n🧾 Dívidas com a União constituídas até 13/10/2026 podem ser perdoadas, com a guia do mês em dia nos 6 primeiros meses da medida.\n⏳ Quase tudo começa em 1º/01/2027, e parte ainda depende de regulamentação.\n📎 Fonte: Lei Complementar 238/2026, Diário Oficial da União de 21/10/2026.\n\nManda pra quem é MEI. Vai que ajuda. 👇',
    fontes: ['F051', 'F044'],
    fontesExternas: [
      'Lei Complementar 238/2026, publicada no Diário Oficial da União de 21/10/2026 (edição extra)',
      'Senado Notícias, 21/10/2026: https://www12.senado.leg.br/noticias/materias/2026/10/21/nova-lei-amplia-limite-de-faturamento-do-mei-e-preve-perdao-de-dividas',
      'Agência Brasil, 21/10/2026: https://agenciabrasil.ebc.com.br/economia/noticia/2026-10/perdao-de-dividas-e-novo-teto-do-mei-entenda-o-que-muda',
    ],
    gravacao: { ...kit(8), checklist: ['Card de fonte oficial no penúltimo slide e a fonte na legenda; nenhum nome de político (Pedro Maia, 22/10)', 'Cada número no slide dele, com a fonte oficial', 'Tag MEI: sem cidade e sem contador (F027, P06)', 'Nada de "a gente resolve a sua dívida" (P07); tema de dívida sem piada (P23)'] },
    notas: 'Gancho do banco de 1000, nº 144 (Um fato sobre [tema comum] que muda completamente como você age), adaptado. Os fatos da LC 238/2026 ainda não estão no FATOS (o F052, que diz que o teto maior não é lei, ficou velho): as fontes são o Senado e a Agência Brasil. Levar pro vault antes de reaproveitar. Ficaram de fora de propósito o decreto que dispensa nota pra pessoa física (tem condições e conversa com o F070) e o Pix MEI (depende de regra). Substituiu o reel das 3 perguntas, que foi pro Banco de Ideias.',
  },
  {
    data: '2026-10-24', peca: 'carrossel', tipo: 'viralizacao', pilar: 2, bloco: 'Afeto', status: 'roteiro',
    ideia: 'Tirinha do Léo: um papel pedindo outro papel',
    tema: 'A Bia, dona de um estúdio de estética (ME), e o papel que confirma o imposto já pago: na ME, é com o contador',
    formatoTexto: 'Carrossel em tirinha de 4 quadros',
    pilarTexto: 'Afeto · pilar 2 · persona B · Léo encaixe forte',
    motivo: 'Ideia do Pedro (personagem em quadrinhos, do plano diário): o pilar 2 é o que mais se compartilha, e sábado é dia de consumo leve. A dona da tirinha virou esteticista porque beleza tem 83% de presença no Instagram e as outras peças dos 4 dias são da persona A.',
    carrossel: {
      capa: { titulo: 'Todo dono de empresa pequena já viu isso: um papel pedindo outro papel', texto: '', visual: 'Capa da tirinha com o gancho; o Léo de sentinela no canto' },
      slides: [
        { titulo: 'Quadro 1', texto: 'Carta: "DECLARE O IMPOSTO QUE VOCÊ JÁ PAGOU". Bia: "Mas eu já paguei!"', visual: 'A Bia termina um atendimento no estúdio de estética, feliz. Entra voando uma carta' },
        { titulo: 'Quadro 2', texto: 'Carta: "AGORA DECLARE QUE DECLAROU"', visual: 'A carta abre e de dentro sai outra. A Bia de olho arregalado' },
        { titulo: 'Quadro 3', texto: 'Sem fala.', visual: 'As cartas se multiplicam até o teto. Só aparece a mão da Bia, segurando o café' },
      ],
      final: { titulo: 'Quadro 4', texto: 'Léo: "Relaxa, Bia. Na ME, esse papel é com o contador com CRC." Bia: "E eu?" Léo: "Você cuida das suas clientes."', visual: 'O Léo aparece no alto da pilha, em pose de sentinela, e desce levando tudo num carrinho' },
    },
    legenda: 'Manda pra um amigo sem comentário: todo dono de empresa pequena já viu um papel pedindo outro papel. 😅\n\n📨 Tem declaração que só confirma o imposto que você já pagou.\n🧾 Na ME, esse papel fica com o contador com CRC.\n\nManda pra quem vive isso. 👇',
    fontes: ['F094'],
    gravacao: {
      duracao: 'Carrossel 4:5, capa e 4 quadros (1080x1350)', quem: 'O Léo e a Bia, dona de um estúdio de estética (ME), adulta e brasileira (P35)',
      edicao: 'Traço de quadrinho limpo na paleta da marca (creme, coral e ink); balões em Sora. O texto dos balões entra em pós, nunca gerado pela IA',
      checklist: ['4 imagens no Nano Banana 2.1 com a referência do Léo (uns 8 créditos) ou um ilustrador', 'A Bia adulta e brasileira, num estúdio de estética, nunca em loja (P35)'],
    },
    notas: 'Gancho G63 (na capa). Ideia do Pedro: personagem em quadrinhos. Se agradar, vira a série de sábado, a tirinha do Léo.',
  },
  {
    data: '2026-10-25', peca: 'carrossel', tipo: 'ensino', pilar: 16, bloco: 'Educação', status: 'roteiro',
    ideia: 'Se você tem funcionário, esse post é pra você: a escala 6x1 acabou',
    tema: 'Emenda Constitucional 141/2026: a escala 6x1 vira 5x2 e a jornada cai pra 42 e depois 40 horas',
    formatoTexto: 'Carrossel do kit, só texto (9 slides)',
    pilarTexto: 'Educação · pilar 16 (novidade como gatilho) · persona B (ME com equipe) · Léo sério',
    motivo: 'Pedido do Pedro (22/10): o fim da escala 6x1 (Emenda Constitucional 141/2026, promulgada em 16/10) muda a rotina de quem tem funcionário, e salão e estética, da persona B, costumam trabalhar em 6x1. Notícia útil e com prazo curto (60 dias). Linguagem neutra, sem nome de político, com a fonte num card.',
    carrossel: {
      capa: { titulo: 'Se você tem funcionário, esse post é pra você: a escala 6x1 acabou', texto: '', visual: 'Capa só com texto; "6x1" riscado e "5x2" em coral; tag ME / MEI. Tom de informação, sem susto' },
      slides: [
        { titulo: 'O que mudou', texto: 'A escala 6x1 vira 5x2: dois dias de descanso por semana, sem reduzir o salário.', visual: 'Card de texto, "5x2" em destaque' },
        { titulo: 'Em 60 dias', texto: 'A jornada máxima cai pra 42 horas por semana, contando da publicação da emenda.', visual: 'Card de texto, o número em destaque' },
        { titulo: 'Em 14 meses', texto: 'O limite chega a 40 horas por semana.', visual: 'Card de texto, o número em destaque' },
        { titulo: 'A folga de domingo', texto: 'Um dos dois dias de descanso deve cair, de preferência, no domingo.', visual: 'Card de texto' },
        { titulo: 'E a empresa pequena?', texto: 'Uma lei complementar ainda pode trazer regras de adaptação pra MEI, ME e EPP, com a condição de manter os empregos. Essa lei ainda não existe.', visual: 'Card de texto' },
        { titulo: 'Acordos e convenções', texto: 'Cláusula que vai contra a regra nova perde a validade em 60 dias.', visual: 'Card de texto' },
        { titulo: 'De onde vem', texto: 'Emenda Constitucional 141/2026, promulgada pelo Congresso em 16/10/2026.', visual: 'Card de fonte: só o nome da emenda e a data, sem brasão e sem nome de político' },
      ],
      final: { titulo: '', texto: 'No plano ME, a declaração da folha fica com o contador com CRC. Salva pra rever a escala da sua equipe com calma.', visual: 'Fecho com o símbolo da marca' },
    },
    legenda: 'Salva pra rever a escala da sua equipe com calma. 📌\n\n📜 A Emenda Constitucional 141/2026 acaba com a escala 6x1: vira 5x2, com dois dias de descanso por semana e sem reduzir salário.\n⏳ Em 60 dias da publicação, a jornada máxima cai de 44 pra 42 horas por semana. Em 14 meses, chega a 40 horas.\n🗓️ Um dos dias de folga deve cair, de preferência, no domingo.\n🧩 Pra MEI, ME e EPP, uma lei complementar ainda pode trazer regras de adaptação, com a condição de manter os empregos.\n📎 Fonte: Emenda Constitucional 141/2026, promulgada em 16/10/2026.\n\nManda pra quem tem equipe. 👇',
    fontes: ['F101'],
    fontesExternas: [
      'Emenda Constitucional 141/2026, promulgada pelo Congresso em 16/10/2026',
      'Senado Notícias, 16/10/2026: https://www12.senado.leg.br/noticias/materias/2026/10/16/congresso-promulga-o-fim-da-escala-6x1-e-aposentadoria-de-agentes-de-saude',
      'Agência Brasil, 16/10/2026: https://agenciabrasil.ebc.com.br/politica/noticia/2026-10/congresso-promulga-emenda-do-fim-da-6x1-escala-5x2-comeca-em-60-dias',
    ],
    gravacao: { ...kit(9), checklist: ['Card de fonte oficial; nenhum nome de político', 'O prazo conta da publicação da emenda: não cravar data', 'Contador só no plano ME (P06)', 'Nenhuma imagem de loja ou comércio (P35)'] },
    notas: 'Gancho G06 (curadoria: "Se você [situação], esse vídeo é pra você"), adaptado. Os fatos da EC 141/2026 estão fora do FATOS (Senado e Agência Brasil, 16/10/2026): levar pro vault. A data exata dos 60 dias depende da publicação no Diário Oficial, por isso não aparece. Substituiu o estático do certificado, que foi pro Banco de Ideias.',
  },
];

// Os stories dos mesmos 4 dias (Pedro, 22/10: "pode subir tudo para o sistema"), um tema por dia, ligado ao post do
// dia (stories-leo §7). Todos de engajamento: sexta virou peça do 16 (a lei nova do MEI), que não leva venda.
// fontesExternas: fonte oficial de fato que ainda não está no FATOS (a LC 238/2026), sem id.
export const STORIES = [
  {
    data: '2026-10-22', objetivo: 'engajamento', pilar: 5, bloco: 'Educação',
    tema: 'Verdade ou mito: quem tem carteira assinada não pode ter empresa?',
    pilarTexto: 'Educação · pilar 5 · Verdade ou Mito · persona A',
    motivo: 'Verdade ou Mito é a mecânica semanal que está rodando, e o dia tem peça do pilar 5. O story pega um dos mitos do carrossel por outro ângulo e leva pro post.',
    quadros: [
      { texto: 'Verdade ou mito: quem tem carteira assinada não pode ter empresa?', visual: 'O Léo (L17) de braços cruzados, fundo papel quente. Sem o asset do Léo, só o texto no fundo da marca', interacao: 'Enquete: Verdade / Mito' },
      { texto: 'Mito. Dá pra ser sócio de uma ME no Simples.', visual: 'Fundo papel quente, a palavra Mito em coral', interacao: '' },
      { texto: 'Tem mais dois mitos no post de hoje.', visual: 'O carrossel do dia', interacao: 'Compartilhar o post do feed' },
    ],
    cta: 'Compartilhar o post do dia', fontes: ['F106'],
    notas: 'Tag ME. Sem o Léo em primeira pessoa (o texto é da marca).',
  },
  {
    data: '2026-10-23', objetivo: 'engajamento', pilar: 16, bloco: 'Educação',
    tema: 'Lei nova do MEI: você já ficou sabendo?',
    pilarTexto: 'Educação · pilar 16 · enquete · persona D (MEI)',
    motivo: 'Peça de Educação pede enquete ou teste com o fato do dia. Sem caixinha: a rodada quinzenal abre em 26/10. O story leva pro carrossel da lei.',
    quadros: [
      { texto: 'Saiu uma lei nova pro MEI. Você já ficou sabendo?', visual: 'Fundo papel quente, o texto grande', interacao: 'Enquete: Já / Ainda não' },
      { texto: 'Em 2027, o limite do MEI sobe pra R$ 110 mil por ano.', visual: 'Fundo papel quente, o número em coral', interacao: '' },
      { texto: 'E o MEI vai poder contratar até 2 pessoas.', visual: 'Fundo papel quente', interacao: '' },
      { texto: 'O resto, com as datas, tá no post de hoje.', visual: 'O carrossel do dia', interacao: 'Compartilhar o post do feed' },
    ],
    cta: 'Compartilhar o post do dia', fontes: [],
    fontesExternas: [
      'Lei Complementar 238/2026, publicada no Diário Oficial da União de 21/10/2026 (edição extra)',
      'Senado Notícias, 21/10/2026: https://www12.senado.leg.br/noticias/materias/2026/10/21/nova-lei-amplia-limite-de-faturamento-do-mei-e-preve-perdao-de-dividas',
    ],
    notas: 'Tag MEI: sem cidade e sem contador. Fatos da LC 238/2026, ainda fora do FATOS.',
  },
  {
    data: '2026-10-24', objetivo: 'engajamento', pilar: 2, bloco: 'Afeto',
    tema: 'Papel que pede outro papel: quem nunca?',
    pilarTexto: 'Afeto · pilar 2 · persona B · Léo encaixe forte',
    motivo: 'Peça de Afeto pede enquete leve do mesmo assunto. As imagens saem da própria tirinha: produção sem custo.',
    quadros: [
      { texto: 'Já recebeu um papel que só pedia outro papel?', visual: 'O quadro 2 da tirinha (a carta saindo de dentro da carta)', interacao: 'Enquete: Já / Todo mês' },
      { texto: 'Na ME, esse papel fica com o contador com CRC.', visual: 'O Léo do quadro 4 da tirinha, descendo com o carrinho', interacao: '' },
      { texto: 'A tirinha inteira tá no feed.', visual: 'O carrossel do dia', interacao: 'Compartilhar o post do feed' },
    ],
    cta: 'Compartilhar o post do dia', fontes: ['F094'],
    notas: 'Tag ME.',
  },
  {
    data: '2026-10-25', objetivo: 'engajamento', pilar: 16, bloco: 'Educação',
    tema: 'Fim da escala 6x1: na sua empresa alguém trabalha 6 dias por semana?',
    pilarTexto: 'Educação · pilar 16 · enquete · persona B',
    motivo: 'Peça de Educação pede enquete ou teste com o fato do dia. A enquete mede quantos seguidores têm equipe em 6x1, dado próprio pra usar depois.',
    quadros: [
      { texto: 'Na sua empresa, alguém trabalha 6 dias por semana?', visual: 'Fundo papel quente, o texto grande', interacao: 'Enquete: Sim / Não' },
      { texto: 'A escala 6x1 acabou: vira 5x2, com 2 dias de descanso.', visual: 'Fundo papel quente, "5x2" em coral', interacao: '' },
      { texto: 'Em 60 dias, a jornada máxima cai pra 42 horas por semana.', visual: 'Fundo papel quente, o número em coral', interacao: '' },
      { texto: 'O resto, com a fonte, tá no post de hoje.', visual: 'O carrossel do dia', interacao: 'Compartilhar o post do feed' },
    ],
    cta: 'Compartilhar o post do dia', fontes: [],
    fontesExternas: [
      'Emenda Constitucional 141/2026, promulgada pelo Congresso em 16/10/2026',
      'Senado Notícias, 16/10/2026: https://www12.senado.leg.br/noticias/materias/2026/10/16/congresso-promulga-o-fim-da-escala-6x1-e-aposentadoria-de-agentes-de-saude',
    ],
    notas: 'Tag ME / MEI. Linguagem neutra, sem nome de político. Fatos da EC 141/2026, ainda fora do FATOS.',
  },
];
