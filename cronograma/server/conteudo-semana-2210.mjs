// Os 4 posts de 22 a 25/10/2026 (Pedro, 21/10: "no sistema os dias 22, 23, 24 e 25 estão sem nada"; aprovados no
// chat em 21/10: o carrossel de mitos, o reel das 3 perguntas, a tirinha e o estático do certificado). Um bloco por
// dia (Educação, Diferencial, Afeto, Conversão), nenhum de vendas, e nenhum tema da semana de 26/10 (nota, troca de
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
    data: '2026-10-23', peca: 'reel', tipo: 'ensino', pilar: 17, bloco: 'Diferencial', status: 'roteiro',
    ideia: '3 perguntas que o app faz antes de abrir a sua empresa',
    tema: 'Apartamento, índice do IPTU e 3 nomes: o que o app pergunta antes pra abertura da ME não travar',
    formatoTexto: 'Reel com as telas do app de teste e a narração em off, uns 40 s',
    pilarTexto: 'Diferencial · pilar 17 · persona A · Léo só no gancho (opcional)',
    motivo: 'O aquecimento pede prova do produto, e o radar mostra que o app fazendo a tarefa puxa (a guia do mês em poucos cliques teve 1.577 views). O tema é a abertura, diferente da nota (29/10) e da guia (02 e 14/10). As telas já estão aprovadas no broll (L01, L05, L06): produção barata.',
    textoTela: '3 PERGUNTAS ANTES DE ABRIR A EMPRESA',
    cenas: [
      { tempo: '0-3s', cena: 'A mão abre o app de teste no celular: a tela coral de abertura (L01, B033). Selo APP EM CONSTRUÇÃO', fala: '3 perguntas que o app faz antes de abrir a sua empresa.', tela: '3 PERGUNTAS ANTES DE ABRIR A EMPRESA' },
      { tempo: '3-11s', cena: 'Prédio residencial de BH em plano aberto, sem placa nem fachada de loja (L12)', fala: 'Casa ou apartamento? Em BH, a Prefeitura não libera empresa em apartamento sem sócio morando lá.', tela: '' },
      { tempo: '11-19s', cena: 'A mão segura a guia do IPTU de papel, fora de foco, nenhum dado legível (L14)', fala: 'O índice do IPTU, que fica na guia do IPTU. Sem ele, a Prefeitura não acha o imóvel.', tela: '' },
      { tempo: '19-26s', cena: 'A tela das 3 opções de nome (L06, recorte nas três opções; sem a caixa azul e sem o objeto social). Selo APP EM CONSTRUÇÃO', fala: 'E 3 nomes pra sua empresa. Se a Junta recusar o primeiro, vai o segundo.', tela: '3 NOMES' },
      { tempo: '26-35s', cena: 'A tela "Está tudo certo?" com os botões Ajustar (L05, recorte no título e nos botões; sem CPF, capital e códigos). Selo APP EM CONSTRUÇÃO', fala: 'A gente pergunta antes o que costuma travar. E abre a sua empresa: você só assina.', tela: '' },
      { tempo: '35-41s', cena: 'O celular na mão, tela apagada, fundo papel quente. Tag ME', fala: 'Salva esse vídeo pra quando for abrir a sua empresa.', tela: '' },
    ],
    legenda: 'Salva esse vídeo pra quando for abrir a sua empresa. 📌\n\n🏠 Casa ou apartamento? Em BH, a Prefeitura não libera empresa em apartamento quando nenhum sócio mora no endereço.\n🧾 O índice do IPTU fica na guia do IPTU. Sem ele, a Prefeitura não localiza o imóvel e o processo para.\n✍️ A Junta pode recusar o nome. Por isso o app pede 3 opções, em ordem.\n📲 No app que tá chegando, a gente pergunta antes o que costuma travar. Você só assina.\n\nSalva e volta aqui quando chegar a hora. 👇',
    fontes: ['F130', 'F131', 'F134', 'F129', 'F008'],
    gravacao: {
      duracao: 'Uns 40 s, vertical 9:16', quem: 'Narração em off do Pedro, na voz "a gente". Sem ninguém na câmera',
      local: 'Telas do app de teste e dois takes de rua e mesa', enquadramento: 'Vertical 9:16; telas em tela cheia, com borda do celular',
      audio: 'Narração numa tomada só, em lapela ou microfone de mesa',
      broll: ['L01 app de teste abrindo (B033)', 'L12 prédio residencial de BH, sem placa', 'L14 guia do IPTU de papel, sem dado legível', 'L06 as 3 opções de nome (recorte)', 'L05 revisão "Está tudo certo?" (recorte)'],
      telasApp: ['splash.png (L01)', 'dossie_nome.png (L06)', 'revisar.png (L05)'],
      edicao: 'Legenda queimada em Sora, poucas palavras por vez; texto de tela só no gancho e o "3 NOMES"; selo APP EM CONSTRUÇÃO quando a tela aparece; tag ME',
      checklist: [
        'Nenhum prazo de abertura (P01) e nenhuma promessa de aprovação (P02)',
        'L06 sem a caixa azul (tem travessão e promete que nenhuma tentativa atrasa a abertura)',
        'L05 sem CPF, capital social e códigos de atividade',
        'Fala de ME em BH: nada de MEI na peça',
      ],
    },
    notas: 'Gancho G65 (curadoria do banco). Encaixe do Léo: cabe só no gancho e no fecho "Vai, Legaliza aí!", e só se tiver o asset (L17); sem ele, fica a narração em off. Tipo ensino: sem convite de venda.',
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
    ideia: 'Na ME, o certificado digital já vem no plano',
    tema: 'O certificado digital: fora, em torno de R$ 209 por ano; no plano ME, incluso',
    formatoTexto: 'Estático com o Léo e o número em destaque',
    pilarTexto: 'Conversão · pilar 13 · persona B · Léo encaixe forte',
    motivo: 'O pilar 13 (documentação em dia) ainda não tem peça na estratégia nova, e o certificado é um custo concreto que todo dono de ME conhece. Domingo pede peça leve: estático. Pilar 13 é só ensino, então a peça fecha em salvar, sem lista de espera.',
    estatico: {
      headline: 'Na ME, o certificado digital já vem no plano',
      apoio: 'Fora, as certificadoras cobram em torno de R$ 209 por ano. No plano ME, ele já vem incluso na mensalidade.',
      cta: 'Salva pra quando for abrir a sua ME.',
      visual: 'Fundo papel quente, Sora. O Léo (L17, gerado com a referência) de sentinela ao lado de um cartão com o símbolo da marca escrito "Certificado digital". O número em tamanho médio: "em torno de R$ 209 por ano". Coral só na palavra "incluso". Tag ME no canto superior esquerdo',
    },
    legenda: 'Salva pra quando for abrir a sua ME. 📌\n\n🔐 O certificado digital é o arquivo que identifica a sua empresa nos sistemas do governo.\n💳 Fora, as certificadoras cobram em torno de R$ 209 por ano.\n✅ No plano ME, ele já vem incluso na mensalidade, junto com o contador com CRC.\n\nSalva e manda pra quem vai abrir ME. 👇',
    fontes: ['F013', 'F014'],
    gravacao: {
      duracao: 'Estático 4:5 (1080x1350)', quem: 'O Léo (L17), sem fala no texto da arte',
      edicao: 'Arte no template do kit: o número em destaque, tom de informação',
      checklist: ['O preço de fora sempre com "em torno de" (F014)', 'Só ME: nada de MEI na arte (no MEI o certificado é pago à parte)', 'Nunca "grátis" nem "sem custo" (P10): "incluso na mensalidade"'],
    },
    notas: 'Gancho G91 (curadoria do banco). Pilar 13 é só ensino (reels-leo §5). Buraco da base pro Pedro: o FATOS não descreve o que o app confere na documentação, e a renovação avisada 30 dias antes (ADR 04/10) ainda não está no FATOS, por isso não entra. A tradução de certificado digital é a do glossário (marca/glossario-tecnico-humano.md).',
  },
];
