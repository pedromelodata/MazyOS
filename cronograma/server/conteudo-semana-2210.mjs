// Os 4 posts de 22 a 25/10/2026 (Pedro, 21/10: "no sistema os dias 22, 23, 24 e 25 estão sem nada"; aprovados no
// chat em 21/10: o carrossel de mitos, a tirinha e o estático do certificado; em 22/10 o Pedro trocou o de sexta pelo
// carrossel da Lei Complementar 238/2026, e o reel das 3 perguntas foi pro Banco de Ideias). Nenhum de vendas, e nenhum tema da semana de 26/10 (nota, troca de
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
    tema: 'Três mitos sobre abrir empresa: nome sujo, carteira assinada e morar fora de BH',
    formatoTexto: 'Carrossel do kit, só texto (5 slides)',
    pilarTexto: 'Educação · pilar 5 · persona A · Léo encaixe forte',
    motivo: 'Mito desfeito foi o formato que mais rendeu no radar do Instagram (346x a média da conta). Só texto, no kit: fica pronto no mesmo dia. O fecho fala do "app que tá chegando", sem a data, pra guardar a revelação de 27/10.',
    carrossel: {
      capa: { titulo: '3 coisas que te disseram sobre abrir empresa e não são verdade', texto: '', visual: 'Capa só com texto. A palavra em coral: verdade. Cabe o Léo de sentinela no canto (L17, gerado com a referência), sem fala' },
      slides: [
        { titulo: '"Nome sujo impede de abrir CNPJ."', texto: 'Não impede. SPC e Serasa são crédito, não registro. O que trava é pendência do CPF na Receita ou na Justiça Eleitoral.', visual: 'O mito riscado em cima e a resposta embaixo' },
        { titulo: '"Quem tem carteira assinada não pode ter empresa."', texto: 'Pode, sim. Dá pra ser sócio de uma ME no Simples Nacional.', visual: 'O mito riscado em cima e a resposta embaixo' },
        { titulo: '"Pra ter empresa em BH, tem que morar em BH."', texto: 'Na ME, o que vale é o endereço da empresa. O sócio de outro estado assina do celular, com a conta gov.br dele.', visual: 'O mito riscado em cima e a resposta embaixo' },
      ],
      final: { titulo: '', texto: 'No app que tá chegando, a gente pergunta antes o que costuma travar. Conhece alguém que precisa ver isso? Manda pra essa pessoa.', visual: 'Fecho com o símbolo da marca' },
    },
    legenda: 'Manda esse post pra quem tá adiando abrir a empresa por causa de um desses. 👀\n\n🧐 Tem muita regra de ouvir falar que não é regra.\n📲 No app que tá chegando, a gente pergunta antes o que costuma travar a abertura.\n\nConhece alguém que precisa ver isso? Manda pra essa pessoa. 👇',
    fontes: ['F135', 'F106', 'F029'],
    gravacao: { ...kit(5), checklist: ['O mito 3 fala de ME (MEI de fora de BH tem outra regra, F027)', 'Sem a data do lançamento (a revelação é em 27/10)'] },
    notas: 'Gancho G68 (curadoria do banco). Texto do plano diário de 21/10, com o fecho sem a data.',
  },
  {
    data: '2026-10-23', peca: 'carrossel', tipo: 'ensino', pilar: 16, bloco: 'Educação', status: 'roteiro',
    ideia: 'A lei nova do MEI saiu: 3 coisas que mudam pra você',
    tema: 'Lei Complementar 238/2026: o limite do MEI sobe, até 2 funcionários e perdão de dívidas com a União',
    formatoTexto: 'Carrossel do kit, só texto (7 slides)',
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
      ],
      final: { titulo: '', texto: 'O limite muda, e a gente fica de olho nele. No app que tá chegando, a gente acompanha o seu faturamento até o limite. Salva esse post pra quando 2027 chegar.', visual: 'Fecho com o símbolo da marca' },
    },
    legenda: 'Salva esse post pra quando 2027 chegar. 📌\n\n📜 A Lei Complementar 238/2026 saiu em 21/10 e muda o MEI.\n📈 O limite sobe de R$ 81 mil pra R$ 110 mil por ano em 2027, e pra R$ 140 mil em 2028.\n👥 O MEI vai poder contratar até 2 pessoas, nas atividades que a lei permite.\n🧾 Dívidas com a União constituídas até 13/10/2026 podem ser perdoadas, com a guia do mês em dia nos 6 primeiros meses da medida.\n⏳ Quase tudo começa em 1º/01/2027, e parte ainda depende de regulamentação.\n\nManda pra quem é MEI. Vai que ajuda. 👇',
    fontes: ['F051', 'F044'],
    fontesExternas: [
      'Lei Complementar 238/2026, publicada no Diário Oficial da União de 21/10/2026 (edição extra)',
      'Senado Notícias, 21/10/2026: https://www12.senado.leg.br/noticias/materias/2026/10/21/nova-lei-amplia-limite-de-faturamento-do-mei-e-preve-perdao-de-dividas',
      'Agência Brasil, 21/10/2026: https://agenciabrasil.ebc.com.br/economia/noticia/2026-10/perdao-de-dividas-e-novo-teto-do-mei-entenda-o-que-muda',
    ],
    gravacao: { ...kit(7), checklist: ['Cada número no slide dele, com a fonte oficial', 'Tag MEI: sem cidade e sem contador (F027, P06)', 'Nada de "a gente resolve a sua dívida" (P07); tema de dívida sem piada (P23)'] },
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
    data: '2026-10-25', peca: 'estatico', tipo: 'ensino', pilar: 13, bloco: 'Conversão', status: 'roteiro',
    ideia: 'Por que o plano ME já vem com certificado digital?',
    tema: 'O que é o certificado digital e por que ele vem no plano ME: fora, em torno de R$ 209 por ano',
    formatoTexto: 'Estático com o Léo e a pergunta em destaque',
    pilarTexto: 'Conversão · pilar 13 · persona B · Léo encaixe forte',
    motivo: 'Pedido do Pedro (22/10): responder por que a ME tem certificado digital. A base não confirma que ele é obrigatório (o F127 está como NÃO USAR), então a peça responde o que ele é e por que vem no plano, sem dizer "obrigatório". Domingo pede estático. Pilar 13 é só ensino: fecha em salvar.',
    estatico: {
      headline: 'Por que o plano ME já vem com certificado digital?',
      apoio: 'É o arquivo que identifica a sua empresa nos sistemas do governo. Fora, as certificadoras cobram em torno de R$ 209 por ano. No plano ME, ele já vem incluso na mensalidade.',
      cta: 'Salva pra quando for abrir a sua ME.',
      visual: 'Fundo papel quente, Sora. A pergunta grande no topo. O Léo (L17, gerado com a referência) de sentinela ao lado de um cartão com o símbolo da marca escrito "Certificado digital". O número em tamanho médio: "em torno de R$ 209 por ano". Coral só na palavra "incluso". Tag ME no canto superior esquerdo',
    },
    legenda: 'Salva pra quando for abrir a sua ME. 📌\n\n🔐 O certificado digital é o arquivo que identifica a sua empresa nos sistemas do governo.\n💳 Fora, as certificadoras cobram em torno de R$ 209 por ano.\n✅ No plano ME, ele já vem incluso na mensalidade, junto com o contador com CRC.\n\nSalva e manda pra quem vai abrir ME. 👇',
    fontes: ['F013', 'F014'],
    gravacao: {
      duracao: 'Estático 4:5 (1080x1350)', quem: 'O Léo (L17), sem fala no texto da arte',
      edicao: 'Arte no template do kit: o número em destaque, tom de informação',
      checklist: ['O preço de fora sempre com "em torno de" (F014)', 'Só ME: nada de MEI na arte (no MEI o certificado é pago à parte)', 'Nunca "grátis" nem "sem custo" (P10): "incluso na mensalidade"'],
    },
    notas: 'Gancho do Pedro (22/10), sem "obrigatório": o FATOS não tem fato que diga isso (o F127 é NÃO USAR; o ADR de 06/10 diz que a nota nacional exige o e-CNPJ, mas ainda não entrou no FATOS). Com esse fato no vault, a peça pode virar "Por que a ME precisa de certificado digital". Pilar 13 é só ensino (reels-leo §5). Buraco da base pro Pedro: o FATOS não descreve o que o app confere na documentação, e a renovação avisada 30 dias antes (ADR 04/10) ainda não está no FATOS, por isso não entra. A tradução de certificado digital é a do glossário (marca/glossario-tecnico-humano.md).',
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
    data: '2026-10-25', objetivo: 'engajamento', pilar: 13, bloco: 'Conversão',
    tema: 'Você sabia que, na ME, o certificado digital vem no plano?',
    pilarTexto: 'Conversão · pilar 13 · persona B · Léo encaixe forte',
    motivo: 'Pilar 13 nunca é venda nos stories: sai como enquete. Retoma o estático do dia por outro ângulo.',
    quadros: [
      { texto: 'Você sabia que, na ME, o certificado digital vem no plano?', visual: 'Fundo papel quente; o Léo (L17), se o asset existir', interacao: 'Enquete: Sabia / Não sabia' },
      { texto: 'Fora, as certificadoras cobram em torno de R$ 209 por ano.', visual: 'Fundo papel quente, o número em coral', interacao: '' },
      { texto: 'No plano ME, ele já vem incluso na mensalidade.', visual: 'O estático do dia', interacao: 'Compartilhar o post do feed' },
    ],
    cta: 'Compartilhar o post do dia', fontes: ['F014', 'F013'],
    notas: 'Tag ME. Nada de MEI (no MEI o certificado é pago à parte).',
  },
];
