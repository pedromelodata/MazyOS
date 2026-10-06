# Roteiro: Contabilidade tradicional vs Legalizaí (versão 7)

Versão 7 (06/10/2026): a mesma voz do Pedro e a mesma legenda da versão 6, com a animação refeita a pedido dele: "uma linha que desça de cima para baixo e, conforme ela vai descendo, os motions vão acontecendo, de uma forma que tudo fique conectado nessa linha... ela só não pode ser sem graça".
- **Uma linha só, contínua, num plano-sequência:** a câmera desce junto com ela, sem corte, e cada frase acontece presa à linha (camada `p2d-LinhaDescendo`, em `RM/src/kit/ext/precificacao/linha.tsx`).
- **Na abertura:**
  - a linha sublinha a pilha de papel do tradicional;
  - vira o raio do "vs";
  - desenha o visto embaixo do celular do Legalizaí.
- **No "O que muda pra você?":** ela desenha o ponto de interrogação.
- **No antes, ela é tinta, meio à mão:**
  - costura a papelada, com a carimbada;
  - vira o caminho pontilhado até o escritório;
  - se enrola num espiral em volta do relógio da espera.
- **No "Agora", o espiral se solta e a linha acende em coral.** Ela:
  - desenha o celular e liga as etapas;
  - sublinha a guia enquanto o valor é calculado;
  - puxa o quadrado que fugiu do padrão;
  - contorna o cartão do contador e desenha o coração do cuidado;
  - passa pelo app que tá chegando e contorna o Seguir e o link da bio.
- **No fecho:** ela desenha o visto onde o símbolo do logo aparece.
- **Sem crédito CC BY na legenda:** nenhum modelo 3D aparece na tela, então a linha do crédito sai.

Versão 6 (06/10/2026): a narração é a do Pedro, gravada por ele ("quem vai narrar vai ser eu"), e o tempo é o da gravação ("o time que vale é o time do áudio").
- **A voz:** `voz/gravacao-pedro/asset.m4a` (a leitura inteira) até "E aí, fugiu do padrão?" e, dali até o "Vai, Legalizaí!", o `asset 2.m4a` (o final regravado; o começo falso dele fica de fora). As duas gravações vão sem acelerar, sem encurtar pausa e sem dublagem, com um corte de graves e a emenda numa pausa. O fecho é o dele, embutido na gravação. Montagem em `voz/narr-pedro-gravada.wav`.
- **A legenda segue o que ele fala:** "com acesso à atividade certa", "E aí, fugiu do padrão?", "está chegando" e "clique no link da bio".
- **O cartão "Web design · Principal" vem na cara de quem vê** e volta pro lugar de onde saiu, a pedido do Pedro (05/10, à noite).
- A animação segue os tempos novos pelas palavras.

Versão 5 (05/10/2026, à noite): a v4 com mais três ajustes do Pedro.
- **"CRC" soletrado:** "cê, erre, cê", com as três letras separadas. O "cêerrecê" junto da v4 embolava.
- **"O mesmo cuidado, mas agora no app que tá chegando."**
- **A cena do Tradicional do "O mesmo cuidado" fica até o fim da frase:** a pasta do contrato social e o telefone, com a câmera chegando devagar. O app volta no "Segue a gente". Por isso sai o cartão "Contrato social" que saía da tela nesse trecho.

Versão 4 (05/10/2026, à noite): a v3 com a narração corrigida, a pedido do Pedro.
- **"app" se diz "ép"**, só na voz: a legenda e todo texto escrito continuam "app". As duas frases com "app" são TTS novo escrito "ép". A "no app que tá chegando" da v3 vinha da leitura da v1 e saía "áp".
- **"CNAE" vira "atividade":** "com a atividade certa".
- **A fala do contador com menos pausas:** TTS sem vírgula, com o "cêerrecê" junto, sem acelerar e com as pausas internas de no máximo 0,12 s.

O resto é a v3, descrito abaixo.

Reel 9:16 da peça de 05/10/2026 (`reel_93834bb1`, pilar 3, bloco Afeto). Refaz a versão 2 (`KIT/pecas/2026-10-05-tradicional-vs-legalizai-v2/`) com os pedidos do Pedro de 05/10/2026, à tarde:

1. **Abertura com a tela dividida na diagonal.** O "embate", com o raio e o VS, no estilo da imagem que ele mandou, só como inspiração e dentro do design system.
2. **Os argumentos com a espera no tradicional e o app resolvendo.**
   - Ele sugeriu: "Papel e ida ao escritório, mais um tempo de demora no atendimento".
   - E também: "No app, nós constituímos a sua empresa em tempo recorde e ainda identificamos os melhores CNAEs e alíquotas pra você".
   - **Ajustado ao vault.** "Tempo recorde" é promessa de prazo de abertura (PROIBIDO P01). "Melhores alíquotas" é promessa de pagar menos imposto (P04). O vault só deixa dizer, sem número, "CNAE certo" (SOUL, citado no P04) e "o processo entra certo e você vê cada passo" (F047).
3. **"No plano do Simples"** no lugar de "No plano ME", e **"um contador de verdade"**.
   - A legenda do post mantém "plano ME (Simples Nacional)" (F003), porque o MEI também é do Simples e o P06 proíbe insinuar contador no MEI.
4. **O celular mais destacado no meio**, e assets e animações mais detalhados.
5. **O "E" de "E clica no link da bio"** bem dito: a voz nova tem "Segue a gente. E clica no link da bio", com uma pausa curta antes do "E".

## Título

Contabilidade tradicional vs Legalizaí

## Pilar

3, Nossa origem (F148): o mesmo cuidado do escritório, agora no app.

## Público

ME (`fatos.publico` "ME").

## Narração

> Uma frase da legenda por linha, com a palavra-chave entre asteriscos. A voz diz "versus" onde a legenda mostra "vs". O fecho "Vai, Legalizaí" está na gravação do Pedro (fecho embutido) e não entra aqui. As frases longas viraram duas legendas curtas.

Contabilidade tradicional vs *Legalizaí*.
O que *muda* pra você?
Abrir empresa era *papel*, ida ao escritório
e *espera* pra ser atendido.
Agora é tudo pelo *app*,
com acesso à atividade certa e cada *passo* na sua tela.
O *sistema* calcula, emite a guia e te avisa.
Você *só* paga.
E aí, fugiu do *padrão*?
No plano do *Simples*,
tem um *contador* de verdade, com registro no CRC,
o mesmo *cuidado*, mas agora no app que está chegando.
Segue a gente e clique no *link* da bio.

## Batidas

A cena sai do `provas/cena-v3.js` (a partir da v2, com os tempos pelas palavras da voz nova). T é a vitrine Tradicional (fria, argila), L é a Legalizaí (quente, o iPhone).

- **Câmeras novas:**
  - L com o celular bem maior que na v2 (a câmera mais perto). O topo fica abaixo da faixa da legenda e o chão da frente continua no quadro.
  - T um pouco mais à esquerda (x -0,142), pra o carimbo pousado caber.
- **Modelos detalhados** do catálogo de 05/10 em argila fria:
  - o despertador, com os ponteiros e o martelo animados por `conteudo.nos`;
  - o telefone de disco, com o disco girando.

| palavra | batida | o que a imagem faz |
|---|---|---|
| quadro 0 a "você" | tela-dividida | A tela nasce dividida na diagonal "/": T à esquerda (pilha com o carimbo e a pasta aberta) e L à direita (o aparelho no splash, de três quartos). As duas câmeras chegam devagar. |
| tradicional | vitrine-luz | A luz fria passa na argila. |
| vs | divisor-raio | O raio desce pela linha. No impacto, clarão, faíscas e o VS estoura entre o carimbo e o celular. |
| Legalizaí | gancho-giro-varredura, palco-luz | O aparelho gira de frente, a luz varre o vidro e o halo coral abre. |
| você | aceno | O aparelho acena. |
| antes de Abrir | tela-dividida (saída) | A divisão sai pra direita e T toma a tela. A linha revela o despertador e o calendário, que estavam atrás dela. |
| papel | carimba | O carimbo bate no formulário. |
| depois de papel | peca-move (carimbo) | O carimbo sobe, vai pra frente e pra esquerda da pilha e pousa no chão, a 4,7 cm dela. |
| ida ao escritório | pasta-leva | A folha carimbada voa pra pasta, a pasta fecha e sai pela esquerda. |
| e espera pra ser atendido | aproxima (zoom), peca-move (calendario), objeto-canal (relogioT) | A câmera fecha no despertador e no calendário, por zoom e sem passar da frente da vitrine. As folhas viram do 8 ao 12, com o som de página, e os ponteiros correm com tique-taque. |
| atendido | objeto-canal (toca), pose-objeto | O despertador toca: o martelo bate entre os sinos e o corpo treme. |
| Agora | troca-lado, mergulho-abre-app | L: o app abre na escolha da atividade, com as sugestões "compatível". |
| fim do app | tela-canal (brilhoCard, toque), empurrar-tela | O card "Web design" acende, o toque escolhe e a tela abre a Principal. |
| atividade certa | cartao-sai-da-tela (cartaoPrincipal) | O card coral "Web design · Principal" sai da tela e pousa em pé na frente do aparelho. Volta antes do "passo". |
| passo, sua tela | empurrar-tela, tela-canal | A tela vai pra home do primeiro dia e o card "Sua ativação" acende. |
| O sistema calcula | empurrar-tela, cartao-sai-da-tela, cartao-contador | O cartão do imposto sai da tela, pousa e o valor de exemplo conta. |
| emite a guia | toque-cartao (revela) | O botão "Pagar agora" aparece. |
| te avisa | peca-move (sino) | O sino coral cai à esquerda do aparelho, quica e balança apoiado no aro. |
| Você só paga | toque-cartao | O toque e o retorno "Código copiado". |
| antes de Fugiu | troca-lado | T: a pilha com a lupa, trocada fora de quadro. |
| padrão | peca-move (lupa) | A lupa desliza pela folha. |
| No plano do Simples | troca-lado, fileira-fora-do-padrao | L, nas Declarações: as placas saem da tela e ficam em pé; a primeira salta. |
| contador, verdade, CRC | moeda-pessoa | A moeda com o sinal de pessoa pousa no "contador" e encosta na placa no "verdade". A placa volta com "Entregue". Brilho no "CRC". |
| O mesmo cuidado | troca-lado, vitrine-luz, objeto-canal (disca) | T: a pasta do contrato social e o telefone de disco. Alguém disca: o disco vai e volta, com os estalos. |
| agora no app que tá chegando | troca-lado, cartao-sai-da-tela, aproxima | L, nos Documentos: a linha "Contrato social" sai da tela e pousa em pé. |
| Segue a gente, link | fecho-simbolo, palco-luz | O app fecha no splash e o halo cresce no "link". |
| fecho | palco-fecha, link-bio | "Vai, Legalizaí" e a pílula LINK DA BIO. |
| fim | tela-dividida, vitrine-palco, pose-objeto | A divisão volta seca e as vitrines crescem do centro com a mesa subindo. O aparelho cresce na pose do quadro 0 e o loop emenda. |

## Física e contato

Pela prova de colisão do kit (`qc/colisao.md`, 998 quadros):

- **Corpos se cruzando:** 0.
- **Faixas:** só a de propósito, o aparelho encolhendo até o símbolo no fecho (igual à v2).
- **Toques aparentes:** 4, todos em movimento.
  - O carimbo erguido e saindo da pilha.
  - Duas placas chegando na fila, em 4 quadros.
  - A moeda passando na frente do aparelho logo depois de sair da tela.

A prova só olha a câmera principal. A metade da câmera 2 na abertura foi conferida nos stills: o aparelho e o VS não encostam em nada.

## Voz

`voz/monta_narracao.py`:
- **Frases que não mudaram:** saem da leitura aprovada da v1 (`v1-narr-pedro-ed.wav`).
- **Frases novas:** saem do TTS frase a frase (seed_audio, clone `Pedro-Legalizai`), com o mesmo atempo 1,08, as pausas internas encurtadas e o nível casado pela loudness.
  - "Abrir empresa era papel, ida ao escritório e espera pra ser atendido."
  - "Agora é tudo pelo app, com o CNAE certo e cada passo na sua tela." (escrito "Cnae", que sai "cê-na-é"; na v4, "Agora é tudo pelo ép, com a atividade certa e cada passo na sua tela.")
  - "No plano do Simples, tem um contador de verdade, com registro no cê-erre-cê."
  - "Segue a gente. E clica no link da bio!"
- **Montagem:** pausa de 0,40 s entre as frases, atempo 1,02 no todo e uma conversão só pro Dylan (`voice_change`, preset b847bc29), pra o timbre ficar igual.
- **Gancho:** o nome saiu "legalizari" na conversão, como na v1. Entrou o gancho já corrigido da v2, com o mesmo atempo e o nível casado.
