# B-roll do Legalizaí

Auditoria do checklist de 100 takes que o Pedro mandou, mais os takes próprios que faltavam. Usado na
Etapa 5 do Construtor (`reels-leo` §7) e nos stories (`stories-leo`).

Cada take tem um código. No roteiro, o código vai na linha `b-roll` do bloco. No cronograma, cada take
vira um item de `gravacao.broll`, no molde "B039 · teclado em close · respiro do beat 2". Tela do app vai
em `gravacao.telasApp`, com o nome do arquivo e o recorte.

**Regra de quantidade:** a fala é a estrela. No máximo um take por beat; reel de 30 segundos leva de 2 a
4 takes. B-roll não traz texto próprio: se o objeto tem escrita, ela fica fora de foco.

## Regras de imagem (bloqueiam o take)

1. **MEI nunca com contador, nem por imagem** (P06). Contador, call com contador ou alguém
   atendendo só entram em peça de ME. O Mauro e o escritório Legalize nunca entram (P39).
2. **Tela do app só se existir** em `marketing/telas-app/` (captura da versão de teste, com dados de
   exemplo), só no recorte que bate com FATOS e PROIBIDO, e com o selo APP EM CONSTRUÇÃO. Veja a tabela
   de telas abaixo: várias capturas atuais não passam.
3. **Nada de documento legível:** CPF, RG, boleto, guia, contrato, nota, extrato, tela de banco, gov.br
   logado. Papel sempre fora de foco ou de costas.
4. **Gente:** real (o time: Pedro Melo, Pedro Maia, Pedro Puntel, Thiago e Natanael) com autorização de imagem; desconhecido só ao fundo, sem rosto
   próximo. Gente gerada por IA só dentro de P35: adulto, com características brasileiras, nunca em
   comércio ou varejo. Contador em card: foto real autorizada ou ilustração.
5. **Sem marca de terceiros em destaque** (caneca, logo de notebook, fachada de loja) e nada que lembre
   concorrente por cor ou objeto (P27).
6. **Nada que sugira comércio** (loja, balcão, estoque, mercado): a gente atende serviço (F030).
7. **Relógio, ampulheta ou cronômetro nunca junto de fala sobre abrir empresa**: vira promessa de
   prazo (P01).
8. **Coral nunca como cor de erro ou alerta** (P35).
9. **Léo só com o asset gerado a partir da referência.** Se ele fala, ele aparece (P29).
10. **Letreiro, lousa, papel com texto:** sem travessão, sem barrinha decorativa (P26).
11. **Metáfora visual que precisa ser decodificada sai** (grade = burocracia, labirinto, corrente): o
    mesmo pedido do Pedro de 28/09 vale pra imagem.

## Na campanha de lançamento: Luz Coral e o motor de vídeo (desde 26/10/2026)

Todo take, filmado ou gerado, e toda imagem seguem a unidade visual "Luz Coral" enquanto durar o lançamento (Pedro,
26/10/2026; vale também pros vídeos do Léo). As fontes mandam: `_base-contabil/video-ia/estilo-luz-coral.md` (o
estilo), `_base-contabil/video-ia/README.md` (o motor, as 8 etapas) e `_base-contabil/video-ia/aprendizados.md` (o log
A-001 em diante). O texto do mote está no §0 de `estrategia.md`. As regras de imagem acima continuam valendo por cima.

**O look.** Luz motivada (sol baixo pela janela ou abajur quente), altas luzes e pele em coral e damasco, sombras em ink
azul-carvão (`#1B1E24`), nunca preto; contraluz coral na borda da mão e do objeto; névoa leve; grão fino de filme;
**um objeto coral por quadro**; saturação rica mas contida. Ação no miolo (o 4:5 do feed é um recorte central do 9:16)
e o terço de cima calmo pro texto.

**Os dois humores** (o grade é o mesmo; muda o equilíbrio entre coral e ink):

| Humor | No reel | Como |
|---|---|---|
| Hora devolvida | a solução, o tempo livre, o "100% humana", a CTA e o fecho | golden hour, sol baixo entrando pela janela, coral dominante, ar leve, com sombra ink pra dar fundo (nunca imagem leitosa) |
| Hora chata | o gancho de dor, a papelada, a noite | uma poça de luz quente de abajur na mesa, o resto em sombra ink, contraste maior, quadro mais fechado; o coral fica preso na luminária |

**Os 4 planos (nada fora deles):**

| Plano | Lente | Uso | Movimento |
|---|---|---|---|
| MESA | 35 mm, 3/4 de cima | estado, passagem de tempo, emendas | travado |
| MÃO | 85 mm macro, f/1.8 | o gesto (toque, caneta, mão que puxa) | quase parado, respiração de câmera na mão |
| OMBRO | 50 mm, sobre o ombro, do peito pra baixo | o ponto de vista dele, sem rosto | aproximação lenta (5 a 10%) |
| ENTRADA | 35 mm, na altura da mesa | a mão de alguém entrando no quadro, o momento humano | travado ou deslize lateral lento |

Sem drone, pan rápido, zoom, câmera girando ou close de rosto. Por isso o B099 (câmera subindo até o rosto) fica fora na
campanha. A fala do Pedro pra câmera (L18, B009, B100) segue em plano médio fixo, com a mesma luz.

**Filmado ou gerado, a cor se unifica na edição** (§6 do estilo): no estático e no quadro de início, o mapa de gradiente
`#1B1E24`, `#8C2F16`, `#F5A184` em Luz suave, de 10 a 15% (a predefinição "Luz Coral" do Photoshop); no vídeo, a mesma
correção exportada como LUT `.cube` em todos os takes (no Adobe Express, que não aceita LUT, os mesmos ajustes à mão em
todos os trechos). A tela verde fica fora do grade, pura e chapada.

**Gerado por IA (Gemini e Flow com Veo 3.1): o motor de vídeo.**

1. **Quadro de início antes.** A cena com o personagem nasce inteira no Gemini (cenário e referência anexados), um
   elemento por vez; estado e variação saem por edição em conversa nova ("Edit the attached image."), e correção de
   detalhe se regenera com a trava escrita no prompt (A-001, A-002, A-016, A-020).
2. **Um gesto por take,** 8 s. Gesto contado ("4 toques + 1") não se pede: vira takes de um gesto, emendados na edição
   (A-006).
3. **Só imagem de início é o padrão.** Início + fim só pra transformação do mesmo quadro (time-lapse, mudança de luz,
   A-012) ou pra travar física difícil: pegar alguém pela roupa, erguer, soltar. Aí o quadro final é gerado antes
   (A-025).
4. **Câmera travada** quando dois takes emendam ou um vai invertido (A-010).
5. **Tela de celular em verde puro (`#00FF00`)**; a tela real do app entra por cima na montagem (A-009).
6. **Som, trilha, texto e fecho só na edição,** nunca na IA. Notificação sem "plim": vibração.
7. **Prévia antes de gastar crédito** (Pedro, 26/10/2026): os quadros-chave e a prévia em Veo 3.1 Fast vão pro Pedro
   aprovar antes do take final. No Flow, cada take em Fast custa 20 créditos e a edição de imagem sai sem custo (A-024);
   o Quality custa 100 créditos por vídeo de 8 s.
8. **Prompt** em inglês, curto por bloco (sujeito, ação, cenário, plano, luz, o que NÃO pode), fechando com o BLOCO
   ESTILO e um HUMOR (abaixo). O de vídeo abre com `Generate a video with Veo 3.1, vertical 9:16, 8 seconds, using the
   attached image as the FIRST FRAME. Do not create a new image.` e leva também o bloco SÓ NO VÍDEO.
9. **Gente gerada por IA só adulta (P35, regra 4).** As cenas do mote com criança (o filho no futebol, a filha no balé,
   a mão do filho na Rebobina) esbarram nela: até o Pedro decidir, nada de criança gerada por IA. O Léo sai sempre da
   referência dele (regra 9), com o bloco e o humor.

**Conferência de todo quadro e de todo take,** antes de mandar pro Pedro (tira de quadros no ffmpeg; no movimento, 4
quadros por segundo, A-023):

- o número de patas, mãos e dedos de cada personagem (A-026);
- a cabeça, a juba ou o ombro do próprio personagem invadindo o ponto de vista dele (A-027);
- lente de óculos que escurece no meio do take (A-028);
- o celular que some da mão, o personagem que solta o outro e o outro fica flutuando, o objeto que pula de lugar (A-029);
- as âncoras de identidade (o lado de cada joia, a cor da roupa, o rosto do Léo contra a referência) e a cabeça que vira
  sozinha (A-015, A-023).

O trecho com defeito sai no corte; o que o corte não salva volta pro quadro ou pro take.

**Os blocos de prompt** (cópia de `_base-contabil/video-ia/estilo-luz-coral.md` §4, v1.1 de 25/10; se a fonte mudar,
vale a fonte). Fecham todo prompt de imagem e de vídeo, da folha de referência ao take.

BLOCO ESTILO (imagem e vídeo):

```
STYLE "LUZ CORAL": cinematic still from a contemporary Brazilian drama, shot on ARRI Alexa 35 with an anamorphic-look 40mm lens at f/2. Color grade: warm golden-hour split-toning; highlights and skin glow in soft coral and apricot tones (#F47F58, #F5A184), natural warm midtones, shadows in deep ink charcoal-blue (#1B1E24), never pure black. Motivated light only: low warm sun or warm practical lamps as the key light, a gentle coral rim light along edges and hands, soft atmospheric haze catching the light, subtle bloom and halation on bright sources, oval bokeh in the background. Fine organic 35mm film grain, slight vignette. Natural skin texture, real materials. Rich but restrained saturation; exactly one coral object anchors the frame. Avoid: teal-and-orange cliché, HDR look, oversaturation, plastic skin, heavy lens flares, CGI look, any text.
```

HUMOR (um só por prompt):

```
MOOD "HORA DEVOLVIDA": golden hour, low sun streaming through the window, warm coral light dominant, airy and calm; keep deep ink charcoal-blue in the shadows for depth, never a milky or washed-out image.
```

```
MOOD "HORA CHATA": night, a single warm tungsten pool of light on the table from the lamp; everything outside it falls into deep ink-blue shadow; higher contrast, slightly claustrophobic; the coral glow is confined to the lamp.
```

SÓ NO VÍDEO (Veo), além dos dois acima:

```
Cinematic 24 fps with natural 180-degree shutter motion blur. Keep the exact color grade, light and haze of the first frame for the whole video: no color shifts, no exposure jumps.
```

## Auditoria dos 100 takes

Resultado: **22 ficam, 44 adaptam, 34 saem.**

### Pessoa

| Código | Take | Veredito | Como fica no Legalizaí, ou por que sai |
|---|---|---|---|
| B001 | Lendo um livro com luz natural na janela | sai | lifestyle de leitura, não fala de papelada; soa guru |
| B002 | Tomando café olhando pra fora | adapta | café na janela do escritório em BH, 2s de respiro no bastidor (pilar 1) |
| B003 | Digitando no celular, concentrado | adapta | emitindo nota: tela fora do quadro, ou o recorte aprovado de emitir (L07); pilar 17 |
| B004 | Digitando no computador | fica | Pedro construindo o app (pilar 1, 17); sem dado real nem senha na tela |
| B005 | Abrindo o notebook devagar | fica | começo do dia de quem trabalha por conta; gancho de identificação (pilar 2, 4) |
| B006 | Fechando o notebook no fim do dia | fica | fecho e CTA: você cuida do negócio, a papelada fica com a gente |
| B007 | Escrevendo num caderno | adapta | anotação fora de foco, nada legível; dica de gestão (pilar 16, 12) |
| B008 | Virando páginas de livro ou revista | sai | repete B001, sem função |
| B009 | Olhando direto pra câmera por alguns segundos | fica | gancho: 1 segundo de silêncio antes da primeira frase |
| B010 | Falando pra câmera, sem som | fica | cobre narração em off de alguém do time (pilar 1, 3, 9) |
| B011 | Pensando, olhando pro lado ou pra cima | fica | gancho de dúvida (pilar 4, 5), como "MEI ou ME?" |
| B012 | Sorrindo sem motivo aparente | adapta | sorriso de alívio depois de olhar o celular, só no fim (CTA); sem motivo parece banco de imagem |
| B013 | Rindo olhando o celular | adapta | reação leve em peça cultural (pilar 2); a tela não aparece |
| B014 | Tomando água | sai | sem função |
| B015 | Colocando fone de ouvido | sai | sem função |
| B016 | Ouvindo música de olhos fechados | sai | lifestyle, fora do nicho |
| B017 | Caminhando pela calçada | adapta | calçada de BH, reconhecível (L12); pilar 1, 2, 3 |
| B018 | Exercício ou alongamento | sai | fora do nicho |
| B019 | Ajustando a câmera ou o tripé | fica | bastidor do fundador (pilar 1) |
| B020 | Mexendo no celular, rolagem lenta | adapta | rolagem lenta de uma tela aprovada do app (tabela de telas); pilar 17 |

### Ambiente e rotina

| Código | Take | Veredito | Como fica no Legalizaí, ou por que sai |
|---|---|---|---|
| B021 | Organizando a mesa | adapta | o papel sai da mesa até sobrar o celular: antes e depois da papelada (pilar 4, 17), com L14 e L15 |
| B022 | Empilhando livros | adapta | vira pilha de pastas e papel sem nada legível (L14); gancho de dor (pilar 4) |
| B023 | Abrindo a agenda e escrevendo | adapta | agenda aberta, a mão para numa página do mês, nada legível; o "antes" de uma dica de rotina de dono (pilar 16). Sem data em destaque: prazo mensal vira série (pilar 6 em standby) |
| B024 | Colocando objetos em ordem | sai | repete B021 |
| B025 | Preparando café do começo ao fim | adapta | só 2s, no escritório em BH, sem marca de café; respiro de bastidor (pilar 1) |
| B026 | Ligando o computador e esperando | fica | começo de bastidor (pilar 1); "espera" em peça cultural (pilar 2) |
| B027 | Abrindo a janela e olhando pra fora | adapta | janela com BH ao fundo (L10, L12); pilar 3 |
| B028 | Acendendo vela ou difusor | sai | lifestyle, sem função |
| B029 | Planta no lugar ou regando | sai | decoração, sem função |
| B030 | Arrumando travesseiro ou cama | sai | fora do nicho |
| B031 | Gravando a tela do celular | adapta | gravação de tela da versão de teste, só telas e recortes aprovados, selo APP EM CONSTRUÇÃO; pilar 17, 10 |
| B032 | Gravando a tela do computador | adapta | Pedro trabalhando no app; sem dado real, senha ou chave na tela (pilar 1) |
| B033 | Abrindo um aplicativo no celular | adapta | abrindo o app de teste, a tela de abertura coral (L01); gancho ou prova do pilar 17 |
| B034 | Digitando numa planilha | adapta | o jeito antigo: planilha de faturamento fora de foco, sem número legível, contra o app que soma (F040); pilar 4, 12 |
| B035 | Conversando ao telefone | adapta | ou a pessoa presa no telefone com o órgão (pilar 2, ironia do sistema, sem rosto de terceiro) |

### Objetos

| Código | Take | Veredito | Como fica no Legalizaí, ou por que sai |
|---|---|---|---|
| B036 | Capa de um livro | sai | marca de terceiro, sem função |
| B037 | Xícara segurada com as duas mãos | fica | respiro de alívio antes da CTA |
| B038 | Caneta deslizando no papel | adapta | papel e caneta como o "antes", corta pro celular; nada legível. A assinatura de verdade é digital, com gov.br (F036) |
| B039 | Teclado em close | fica | respiro e transição (pilar 1, 17) |
| B040 | Fones em cima da mesa | sai | sem função |
| B041 | Caderno aberto com anotações | adapta | fora de foco; se aparecer palavra, é uma só e é do tema (pilar 16) |
| B042 | Planta com luz natural | sai | decoração |
| B043 | Relógio no pulso | adapta | só em dica de rotina (pilar 16); nunca junto de fala sobre abrir empresa (P01) |
| B044 | Anel, pulseira, detalhe de roupa | sai | fora do nicho |
| B045 | Celular com notificações | adapta | só aviso que o app tem de verdade (prazo e vencimento, F040) e só com tela aprovada; nada de notificação inventada (P12) |
| B046 | Livros empilhados mostrando títulos | sai | título e marca de terceiro |
| B047 | Caneca com logo ou frase | adapta | só caneca da Legalizaí, se existir, sem frase; nunca de outra marca |
| B048 | Mesa organizada vista de cima | fica | celular, notebook e café, sem papel: o depois da papelada; CTA de vendas (pilar 10, 17) |
| B049 | Mão folheando caderno | sai | repete B041 |
| B050 | Produto do dia a dia sobre a mesa | adapta | a ferramenta de quem presta serviço (câmera de fotógrafo, tesoura de salão, notebook de dev); nunca produto à venda (F030); pilar 2, 16 |

### Viagem

| Código | Take | Veredito | Como fica no Legalizaí, ou por que sai |
|---|---|---|---|
| B051 | Caminhando por uma rua nova | adapta | rua de BH, sem olhar pra câmera (L12) |
| B052 | Horizonte num mirante ou varanda | adapta | vista de BH (pilar 3; F026) |
| B053 | Num café, olhando pela janela | adapta | café em BH com notebook: quem presta serviço trabalhando de onde quiser (pilar 2, 16); sem marca do lugar |
| B054 | Chegando num hotel | sai | viagem, fora do nicho |
| B055 | Mala no porta-malas | sai | viagem |
| B056 | Janela do avião | sai | viagem |
| B057 | Passaporte e cartão de embarque | sai | documento pessoal legível e viagem |
| B058 | Mãos com o mapa da cidade | adapta | mapa de BH no celular, só a cidade, em peça sobre quem a gente atende (F026, F028); nunca a região metropolitana como atendida |
| B059 | Rua histórica ou charmosa | adapta | rua conhecida de BH, sem fachada de loja em destaque |
| B060 | Praça com pessoas ao redor | adapta | praça de BH, pessoas só ao fundo, sem rosto próximo |
| B061 | Algo típico do lugar | adapta | pão de queijo e café numa mesa em BH, 2s, sem marca do estabelecimento (pilar 2) |
| B062 | Mercado com produtos coloridos | sai | comércio, fora do escopo (F030); confunde quem a gente atende |
| B063 | Praia de costas | sai | BH não tem mar; aspiracional |
| B064 | Pôr do sol do lugar | sai | repete B069 |
| B065 | Vista do hotel pela manhã | sai | viagem |

### Natureza

| Código | Take | Veredito | Como fica no Legalizaí, ou por que sai |
|---|---|---|---|
| B066 | Árvores balançando | sai | sem ligação com o tema |
| B067 | Chuva na janela | adapta | dia pesado em peça de dor (pilar 4) ou em tema sério; 2s |
| B068 | Sol entre as folhas | sai | estético, sem função |
| B069 | Pôr do sol no horizonte | adapta | fim do dia em BH; fecho de bastidor (pilar 1) ou CTA de conexão |
| B070 | Céu azul | sai | genérico |
| B071 | Mar ou lago com reflexo | adapta | Lagoa da Pampulha, respiro de BH (pilar 3) |
| B072 | Flores em close | sai | decoração |
| B073 | Caminhando num parque | adapta | parque de BH, Pedro pensando (pilar 1) |
| B074 | Pés na areia ou na grama | sai | fora do nicho |
| B075 | Luz da manhã na parede | fica | abertura suave de bastidor |
| B076 | Sombra de galhos ou grades | sai | metáfora visual que precisa ser decodificada (regra 11) |
| B077 | Poça refletindo o céu | sai | estético |
| B078 | Folha molhada em close | sai | estético |
| B079 | Fumaça de café subindo | fica | respiro de 1 a 2s, abertura de bastidor |

### Social

| Código | Take | Veredito | Como fica no Legalizaí, ou por que sai |
|---|---|---|---|
| B080 | Conversando numa mesa de café | adapta | gente do time conversando (pilar 1, 3); nunca "cliente" encenado dando depoimento |
| B081 | Rindo com alguém fora do quadro | adapta | time rindo no escritório (pilar 1, 2) |
| B082 | Aperto de mão ou abraço | adapta | o time comemorando uma entrega (pilar 1, 3); nunca "cliente fechando contrato": ainda não há cliente e seria prova inventada |
| B083 | Reunião ou call no computador | adapta | reunião do time do app (pilar 1); call com contador só em peça de ME (P06, pilar 9); rosto de terceiro só com autorização |
| B084 | Mostrando algo no celular pra outra pessoa | fica | Pedro mostrando uma tela aprovada pra alguém do time (pilar 17) |
| B085 | Sentados num banco de praça | sai | sem função |
| B086 | Brindando | adapta | só marco real do time (pilar 1); nunca "o CNPJ saiu" encenado enquanto o app não abriu |
| B087 | Andando ao lado de alguém | adapta | gente do time numa rua de BH (pilar 3) |
| B088 | Alguém ouvindo com atenção | adapta | alguém do time ouvindo o outro (pilar 1) |
| B089 | Dois computadores abertos na mesa | adapta | dois notebooks do time lado a lado, construindo o app (pilar 1, 3); telas sem dado real |

### Transições

| Código | Take | Veredito | Como fica no Legalizaí, ou por que sai |
|---|---|---|---|
| B090 | Andando até cobrir a lente | fica | transição do gancho pro primeiro beat |
| B091 | Mão passando na frente da câmera | fica | corte do "antes" (papel) pro "depois" (celular), com L15 |
| B092 | Abrindo a porta e entrando | adapta | entrando na sala do time em BH (L10); pilar 1, 3 |
| B093 | Fechando janela ou cortina | sai | repete B097, fecho escuro |
| B094 | Virando o caderno pra página em branco | adapta | troca de assunto dentro da peça; página sem nada escrito |
| B095 | Desligando a tela do computador | fica | fecho: o app cuida, você desliga |
| B096 | Celular virado pra baixo na mesa | fica | fecho de alívio (pilar 17): você não precisa ficar olhando |
| B097 | Apagando a luz ao sair | fica | fim do expediente, fecho de bastidor (pilar 1) |
| B098 | De cima, mãos trabalhando | fica | quem presta serviço trabalhando; cobre narração (pilar 2, 16) |
| B099 | Câmera subindo do objeto até o rosto | fica | gancho: do celular até o rosto do Pedro |
| B100 | Olhando pra baixo e erguendo o olhar | fica | gancho: o olhar sobe e a primeira frase entra |

## Takes próprios do Legalizaí

O checklist não tinha nada do nosso produto, da nossa cidade nem da nossa gente. Estes faltavam.

| Código | Take | Serve pra | Situação e cuidado |
|---|---|---|---|
| L01 | App de teste abrindo (tela coral de abertura) e rolagem de uma tela aprovada | gancho ou prova; pilar 17, 10 | pronto (`splash.png`); selo APP EM CONSTRUÇÃO |
| L02 | Taxa da Junta separada do serviço, na tela de pagamento | prova; pilar 8, 10 (F018, F020) | **falta.** `plano.png` e `pagamento.png` mostram R$ 195 e R$ 463,51, que não estão em FATOS, e "Sem letra miúda" (P05), "Grátis" (P10), "em segundos" e "cai na hora". Refazer a captura com os valores de FATOS antes de usar |
| L03 | Contrato inteiro antes de pagar | prova; pilar 8 (F045) | **falta.** `contrato.png` traz os mesmos preços fora de FATOS, "a abertura é gratuita" (P10) e "receber tudo de volta" sem a condição (F022). Até refazer, só close no botão "Ler o contrato completo", sem preço |
| L04 | Painel de andamento da abertura | prova; pilar 17 (F047) | `painel.png`, recorte no card "Quanto tempo leva" ("depende de cada órgão, e o tempo deles a gente não controla") e na linha do tempo. Cortar ou desfocar três frases que prometem o que a base não descreve (P12): o subtítulo "a gente avisa no WhatsApp a cada passo", o "Te avisaremos quando terminar" e a caixa "Pode fechar o app que o processo segue sozinho" |
| L05 | Revisão com "Ajustar" em cada bloco | prova; pilar 17 (F038) | `revisar.png`, recorte no título "Está tudo certo?" e nos botões Ajustar. Cortar CPF, capital social e códigos de atividade (F039, P16) |
| L06 | As 3 opções de nome da empresa | prova; pilar 16, 17 (F134) | `dossie_nome.png`, recorte nas três opções. Cortar a caixa azul (tem travessão e a promessa "nenhuma tentativa atrasa a sua abertura") e o objeto social |
| L07 | Emitir nota em poucos campos | prova; pilar 17 (F041) | `emitir.png`, recorte em "Pra quem é a nota?" e "Qual o valor?". Cortar o bloco "O serviço" (código de atividade e alíquota de um código específico, P16) |
| L08 | Guia pronta e aviso de prazo | prova; pilar 17 (F040) | `impostos_pagar.png`, `avisos.png`: conferir antes de usar (não auditadas aqui). Valor da guia do MEI nunca aparece (F063); aviso só do que F040 descreve |
| L09 | Assinatura com a conta gov.br | prova; pilar 17 (F036) | **falta.** `assinatura.png` diz "leva uns minutos" e que a procuração "deixa a gente pagar seu DAS" (contra F040 e P21). Não usar até refazer |
| L10 | Sala onde o time trabalha, em BH | pilar 1, 3 | sem placa nem logo de outra empresa (nem do escritório Legalize, P39); combina com B092 |
| L11 | Pedro no notebook construindo o app | pilar 1, 17 | tela sem dado real, senha ou chave |
| L12 | Rua de BH reconhecível, plano aberto | pilar 2, 3; qualquer peça que diga "BH" (F026) | sem fachada de loja em destaque |
| L13 | **saiu em 21/10/2026** (era o Mauro; P39) | | não usar |
| L14 | Pilha de papel e pastas, nada legível | gancho de dor; pilar 4, 2 | papel de costas ou fora de foco |
| L15 | A pilha sai do quadro e fica só o celular | transição antes e depois; pilar 17, 4 | corte com B091 |
| L16 | Quem presta serviço trabalhando (fotógrafo com a câmera, salão, designer no notebook) | identificação; pilar 2, 16, 10 | gente real autorizada, ou IA dentro de P35; nunca comércio; fotógrafo é o exemplo que a base garante como MEI (F057) |
| L17 | Léo | forte em 2, 4, 5, 13 e 16; abre o gancho e fecha em 8, 10, 11, 12 e 17; nunca em 1 e 3 | asset gerado a partir da referência (polo coral com o símbolo, óculos redondos, gravata-borboleta preta); obrigatório quando o Léo fala (P29). No stories do dia, só quando o asset já existe |
| L18 | Pedro olhando pra câmera no escritório, plano médio | base de quase todo gancho falado | luz natural, sem logo de outra marca na roupa |

### Telas: o que não foi auditado

As outras capturas de `marketing/telas-app/_manifesto.json` não foram conferidas aqui. Antes de usar
qualquer uma, leia o texto e os números da tela contra FATOS e PROIBIDO. Alertas que o próprio
manifesto já dá: `entrada-intencao-abrir.png` fala de MEI "no Brasil todo" (F027, conflito);
`veredito_nao-atende.png` cita o Mauro (P39 e P06); `mais_servicos.png` é loja de
avulsos (serviço que a base não descreve); `impostos_aliquotas.png` e `pro-labore.png` são fiscais
(pilar 7 em standby, P04). As capturas atuais são de uma versão com preço antigo: o caminho certo é o
Pedro pedir novas capturas com os valores de FATOS.

## Uso por momento do reel

| Momento | O que o take faz | Takes |
|---|---|---|
| Gancho (0 a 3s) | prende o olho antes da primeira frase: a pessoa ou o problema, nunca tela cheia de texto | B009, B011, B099, B100, B005, L14, L17, L18 |
| Prova (beats) | mostra o que a fala diz: tela aprovada ou a pessoa real | L01, L04 a L07, B003, B020, B031, B033, B084, L13 (só ME), L16 |
| Respiro (1 a 2s entre beats) | descansa o olho e segura o ritmo | B002, B025, B037, B039, B061, B067, B075, B079 |
| Transição | troca de ideia ou do antes pro depois | B090, B091, B094, L15 |
| CTA | fecha com alívio, sem tela cheia | B006, B012, B048, B069, B095, B096, B097 |

## Uso por pilar

| Pilar | Takes | Cuidado |
|---|---|---|
| 1 bastidor fundador | B004, B005, B010, B019, B025, B026, B032, B073, B081, B083, B086, B097, L11 | só fato real do Pedro |
| 2 cultural | B011, B013, B035 (telefone com o órgão), B050, B053, B061, B098, L14, L16 | ironia do sistema, nunca da pessoa |
| 3 nossa origem | B027, B052, B071, B080, B082, B087, B089, B092, L10, L12 | o time que constrói o app; nunca o Mauro, o escritório Legalize nem os 22 anos (P39) |
| 4 dor da burocracia | B005, B011, B021, B022, B034, B038, B067, L14, L15 | sem susto (P23) |
| 5 mitos | B009, B011, B099, B100, L14 e L15 | o mito entra no gancho; a verdade, na fala ou numa tela aprovada |
| 16 dicas | B007, B023, B041, B043, B050, B053, B098, L16 | nada legível; a dica fecha no app |
| 8 diferencial | B048, B084, L18; L02 e L03 quando forem refeitas | preço na tela só como está em FATOS |
| 9 bastidor e processo (só ME) | B010, B035, B083, B088, L13 | P06: nunca em peça de MEI |
| 17 o app fazendo o trabalho | B003, B020, B031, B033, B084, B096, L01, L04 a L07, L15 | selo APP EM CONSTRUÇÃO, dados de exemplo, só recorte aprovado |
| 10 oferta | B006, B012, B033, B048, B095 | CTA "link da bio"; preço só do grupo A de FATOS |
| 11 troca de contador | B034, B083, L13 | nunca falar mal do contador anterior (P22) |
| 12 dinheiro do dono | B007, B034, L16 | sem número de pró-labore de caso (P13) |
| 13 documentação em dia | B041, L05 | a base não descreve o que o app confere na documentação: tela só com fato (P07) |
