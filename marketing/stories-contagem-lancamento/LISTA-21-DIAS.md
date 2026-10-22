# Contagem do lançamento: 21 funcionalidades nos stories

De 20/10 (faltam 21) a 09/11 (falta 1), uma funcionalidade por dia. O app chega dia 10 de novembro. Tudo é do plano ME.

Cada dia tem 4 quadros:
- **Q1:** gancho com a dor e a figurinha de contagem pra 10/11 (a mesma figurinha nos 21 dias, título "App Legalizaí").
- **Q2:** o problema.
- **Q3:** a tela com o benefício.
- **Q4:** interação ou lista de espera.

As telas estão em `telas/`, com o nome do dia. O roteiro detalhado, com a origem de cada gancho, o recorte de cada tela e as fontes, está em `ROTEIRO-21-DIAS.md`.

## Resumo

| Dia | Faltam | Funcionalidade | Status | Tela |
|---|---|---|---|---|
| 20/10 | 21 | 2.1 O DAS do mês: valor, vencimento e composição | mostra como funciona | sim |
| 21/10 | 20 | 3.1 Emitir NFS-e pedindo só valor e cliente | mostra como funciona | sim |
| 22/10 | 19 | 4.1 Pró-labore interativo: mexe e vê o imposto mudar | mostra como funciona | sim |
| 23/10 | 18 | 5.2 Declarações entregues: DEFIS, DCTF, SPED | em breve | sim |
| 24/10 | 17 | 4.5 Guia do INSS do pró-labore | mostra como funciona | sim |
| 25/10 | 16 | 8.1 Cadastro do colaborador: PIS, cargo, dependentes | em breve | sem tela |
| 26/10 | 15 | 4.2 Fator R com alerta antes de virar a faixa | em breve | sim |
| 27/10 | 14 | 6.1 Documentos da empresa num lugar só | em breve | sim |
| 28/10 | 13 | 8.4 Guias da folha: INSS, FGTS e IRRF | em breve | sem tela |
| 29/10 | 12 | 4.6 Duplo vínculo: CLT e sócio na mesma conta | mostra como funciona | sim |
| 30/10 | 11 | 5.3 Calendário de obrigações do mês | em breve | sim |
| 31/10 | 10 | 4.4 Recibo de pró-labore e informe de rendimentos | em breve | sem tela |
| 01/11 | 9 | 8.2 Lançamentos do mês e fechamento da competência | em breve | sem tela |
| 02/11 | 8 | 5.4 Vigília fiscal preditiva: avisa antes do problema | em breve | sim |
| 03/11 | 7 | 8.3 Holerite e demonstrativo de pagamento | em breve | sem tela |
| 04/11 | 6 | 4.8 Alterar pró-labore de mês já processado | em breve | sem tela |
| 05/11 | 5 | 6.3 Emissão de certidão negativa | em breve | sim |
| 06/11 | 4 | 8.7 Desligamento e rescisão | em breve | sem tela |
| 07/11 | 3 | 2.8 Débito automático do DAS | ainda não existe | sem tela |
| 08/11 | 2 | 8.5 Obrigações mensais: eSocial, EFD-Reinf, DCTFWeb | em breve | sim |
| 09/11 | 1 | 5.6 Relatórios contábeis: DRE, balanço, razão | em breve | sim |

## Dia a dia

### 20/10 · faltam 21 · 2.1 O DAS do mês: valor, vencimento e composição

- **Tela:** `telas/20-10 2.1 Guia do mês.png`
- **Dor:** Todo mês chega um imposto sem explicação: quanto é, quando vence e de onde saiu aquele número.
- **Q1:** "Quem tem ME conhece essa: a guia de imposto que chega sem explicação."
- **Q2:** "A guia do mês, o DAS, soma seis impostos. A conta de cabeça não bate."
- **Q3:** "No plano ME, o imposto do mês chega pronto: valor, vencimento e a conta."
- **Q4:** enquete "Você sabe de onde sai o valor do seu imposto?" ("Sei explicar" / "Pago sem saber")

### 21/10 · faltam 20 · 3.1 Emitir NFS-e pedindo só valor e cliente

- **Tela:** `telas/21-10 3.1 Nota fiscal.png`
- **Dor:** Na hora de emitir a nota, a pessoa trava num campo que ninguém explicou e fica com medo de errar.
- **Q1:** "Travou num campo da nota fiscal? Não é só você."
- **Q2:** "Sem o app, sobra campo técnico que ninguém explicou."
- **Q3:** "No app do plano ME, a nota tem poucos campos. O código vem pronto."
- **Q4:** enquete "Quanto tempo você leva pra emitir uma nota hoje?" ("Minutos" / "Uma eternidade")

### 22/10 · faltam 19 · 4.1 Pró-labore interativo: mexe e vê o imposto mudar

- **Tela:** `telas/22-10 4.1 Pró-labore interativo.png`
- **Dor:** Você decide quanto se paga todo mês sem ver o que esse valor faz com o imposto.
- **Q1:** "Seu salário de dono mexe no imposto. Você já viu essa conta?"
- **Q2:** "Puxa o INSS da aposentadoria e o imposto de renda. Sem a conta, é chute."
- **Q3:** "No plano ME, você arrasta o valor e vê o imposto mudar na hora."
- **Q4:** enquete "Você ia querer ver essa conta antes de decidir quanto se paga?" ("Sim" / "Já vejo")

### 23/10 · faltam 18 · 5.2 Declarações entregues: DEFIS, DCTF, SPED (em breve)

- **Tela:** `telas/23-10 5.2 Declarações entregues.png`
- **Dor:** O governo pede declaração todo mês e todo ano só pra confirmar o imposto que já foi pago, e esse trabalho fica invisível pra quem tem a empresa.
- **Q1:** "Um papel pedindo outro papel. Todo dono de empresa já viu isso."
- **Q2:** "Declaração todo mês, outra todo ano. Cada uma com prazo e sigla própria."
- **Q3:** "Em breve no plano ME: o contador entrega, você só vê o comprovante."
- **Q4:** lista de espera: "O app chega dia 10 de novembro. Entrar na lista não cobra nem compromete."

### 24/10 · faltam 17 · 4.5 Guia do INSS do pró-labore

- **Tela:** `telas/24-10 4.5 Guia do INSS do pró-labore.png`
- **Dor:** Todo mês aparece uma segunda guia, a do INSS do sócio, que depende de declarações que ninguém vê.
- **Q1:** "Aquele momento em que você descobre que tem uma segunda guia todo mês."
- **Q2:** "Ela junta INSS e imposto de renda, e depende de dois sistemas do governo."
- **Q3:** "No plano ME, a guia do INSS chega pronta, já declarada. Você só paga."
- **Q4:** teste "Salário de dono: quanto vira INSS?" ("11%, até o teto" (certa) / "Vem no imposto da empresa")

### 25/10 · faltam 16 · 8.1 Cadastro do colaborador: PIS, cargo, dependentes (em breve)

- **Tela:** sem tela
- **Dor:** Contratar a primeira pessoa e descobrir que o registro pede uma pilha de dados e documentos.
- **Q1:** "Travou no registro do primeiro colaborador? Não é só você."
- **Q2:** "A ficha pede documento, filho, cargo, dependente. E cada campo vem sem explicação."
- **Q3:** "Em breve no plano ME: campo por campo no app, sem mandar cópia de documento."
- **Q4:** enquete "Você já tem colaborador com carteira assinada?" ("Já tenho" / "Penso em contratar")

### 26/10 · faltam 15 · 4.2 Fator R com alerta antes de virar a faixa (em breve)

- **Tela:** `telas/26-10 4.2 Aviso do Fator R.png`
- **Dor:** Descobrir que o imposto da empresa subiu só quando a guia chega mais cara.
- **Q1:** "O imposto da sua empresa depende do seu salário de dono? Saberia antes de subir?"
- **Q2:** "Em algumas atividades, sim. E corrigir hoje só faz efeito nos meses seguintes."
- **Q3:** "Em breve no plano ME: o app avisa antes e mostra quanto falta."
- **Q4:** lista de espera: "O app chega dia 10 de novembro. A lista não cobra nada."

### 27/10 · faltam 14 · 6.1 Documentos da empresa num lugar só (em breve)

- **Tela:** `telas/27-10 6.1 Documentos num lugar só.png`
- **Dor:** Pediram o contrato social ou o cartão CNPJ, e começa a caça ao papel em e-mail antigo, pasta e celular.
- **Q1:** "Caçar papel da empresa em e-mail antigo: quem nunca?"
- **Q2:** "Contrato na Junta, cartão CNPJ na Receita, inscrição na Prefeitura. Cada um num canto."
- **Q3:** "Em breve no app do plano ME: os papéis da empresa num lugar só."
- **Q4:** enquete "Qual papel da empresa mais te pedem?" ('Contrato social' / 'Cartão CNPJ')

### 28/10 · faltam 13 · 8.4 Guias da folha: INSS, FGTS e IRRF (em breve)

- **Tela:** sem tela
- **Dor:** Contratou alguém e o mês, que tinha a guia do imposto, ganhou mais guia, com INSS, fundo de garantia e imposto de renda do colaborador.
- **Q1:** "Quem tem colaborador conhece essa: todo mês chega mais guia."
- **Q2:** "INSS, fundo de garantia, imposto de renda. Cada um com a sua conta."
- **Q3:** "Em breve no plano ME: as guias da folha chegam prontas. Você só paga."
- **Q4:** lista de espera: "Entrar na lista não cobra nada e não te compromete."

### 29/10 · faltam 12 · 4.6 Duplo vínculo: CLT e sócio na mesma conta

- **Tela:** `telas/29-10 4.6 Duplo vínculo.png`
- **Dor:** Ter carteira assinada, ser sócio e não saber se está pagando INSS duas vezes.
- **Q1:** "Carteira assinada não impede você de ser sócio. Mas muda o seu INSS."
- **Q2:** "O teto do INSS é da pessoa. O emprego de carteira já usa parte."
- **Q3:** "No plano ME, o app pergunta isso pra não recolher duas vezes no mesmo teto."
- **Q4:** enquete "Você tem carteira assinada e também é sócio?" ("Tenho os dois" / "Ainda não")

### 30/10 · faltam 11 · 5.3 Calendário de obrigações do mês (em breve)

- **Tela:** `telas/30-10 5.3 Calendário de obrigações.png`
- **Dor:** Cada obrigação da empresa vence num dia diferente, e o dono não tem uma lista do mês que diga o que é dele e o que já está sendo feito.
- **Q1:** "Se você já se perdeu nas datas da empresa, não é só você."
- **Q2:** "Datas diferentes. No fim de semana, uma guia vai pra frente, outra pra trás."
- **Q3:** "Em breve no plano ME: o calendário separa o que é seu do nosso."
- **Q4:** enquete "Você tem todas as datas da empresa num lugar só?" ('Tenho' / 'Tá tudo espalhado')

### 31/10 · faltam 10 · 4.4 Recibo de pró-labore e informe de rendimentos (em breve)

- **Tela:** sem tela
- **Dor:** Precisar comprovar o que a própria empresa te pagou e não achar o papel.
- **Q1:** "Comprovar o que a própria empresa te paga: um papel pedindo outro papel."
- **Q2:** "Recibo de cada mês, informe do ano. Quando precisa, cada um está num lugar."
- **Q3:** "Em breve no app do plano ME: os dois num lugar só, gerados pelo sistema."
- **Q4:** enquete "Você sabe onde está o recibo do que a empresa te pagou?" ("Sei" / "Vou caçar")

### 01/11 · faltam 9 · 8.2 Lançamentos do mês e fechamento da competência (em breve)

- **Tela:** sem tela
- **Dor:** Todo mês a folha volta pra mesa: salário, desconto, falta, hora extra, comissão, adiantamento.
- **Q1:** "Cansou de montar a folha do zero todo mês?"
- **Q2:** "Salário, desconto, falta, hora extra. E cada uma puxa outra conta."
- **Q3:** "Em breve no plano ME: o fixo se repete sozinho. Você avisa o que mudou."
- **Q4:** enquete "O que mais muda na sua folha de um mês pro outro?" ("Hora extra" / "Falta")

### 02/11 · faltam 8 · 5.4 Vigília fiscal preditiva: avisa antes do problema (em breve)

- **Tela:** `telas/02-11 5.4 Vigília fiscal.png`
- **Dor:** Em algumas atividades, o imposto da empresa pode mudar por causa de uma conta que fica nos bastidores, e o dono só fica sabendo quando a guia já veio diferente.
- **Q1:** "Se o seu imposto fosse mudar, você saberia antes da guia chegar?"
- **Q2:** "Em algumas atividades, a conta do imposto olha 12 meses pra trás. Corrigir tarde demora."
- **Q3:** "Em breve no plano ME: o app vigia essa conta e avisa antes da virada."
- **Q4:** enquete "Você sabia que, em algumas atividades, o quanto você se paga mexe no imposto?" ('Sabia' / 'Não sabia')

### 03/11 · faltam 7 · 8.3 Holerite e demonstrativo de pagamento (em breve)

- **Tela:** sem tela
- **Dor:** No dia do pagamento o colaborador pede o holerite e o dono não tem de onde tirar.
- **Q1:** "Dia do pagamento e o colaborador pergunta: cadê meu holerite?"
- **Q2:** "Montar o recibo de cada um, com cada desconto, todo mês, cansa."
- **Q3:** "Em breve no plano ME: fechou a folha, sai o holerite de cada um."
- **Q4:** enquete "Seu colaborador já te pediu o holerite?" ("Já pediu" / "Ainda não tenho colaborador")

### 04/11 · faltam 6 · 4.8 Alterar pró-labore de mês já processado (em breve)

- **Tela:** sem tela
- **Dor:** Perceber que o salário de dono de um mês passado ficou errado e não saber o que corrigir arrasta.
- **Q1:** "Precisou mudar o salário de dono de um mês passado? Não é só você."
- **Q2:** "E aí vem a dúvida: dá pra corrigir? E quem corrige?"
- **Q3:** "Em breve no plano ME: você pede no app e o contador refaz a declaração."
- **Q4:** lista de espera: "O app chega dia 10 de novembro. A lista não cobra nada."

### 05/11 · faltam 5 · 6.3 Emissão de certidão negativa (em breve)

- **Tela:** `telas/05-11 6.3 Certidão negativa.png`
- **Dor:** Banco, dono do imóvel ou cliente grande pede a certidão negativa, e tirar vira mais uma tarefa de órgão no meio do dia.
- **Q1:** "Todo dono de empresa já ouviu: manda a certidão negativa?"
- **Q2:** "Ela prova que a empresa está em dia. E tirar vira mais uma tarefa."
- **Q3:** "Em breve no app do plano ME: você pede, a gente tira e entrega."
- **Q4:** enquete "Já te pediram certidão negativa da empresa?" ('Já pediram' / 'Ainda não')

### 06/11 · faltam 4 · 8.7 Desligamento e rescisão (em breve)

- **Tela:** sem tela
- **Dor:** Desligar um colaborador já é uma conversa difícil, e ainda vem a conta da rescisão.
- **Q1:** "Desligar alguém tem uma conta mais complexa do que parece."
- **Q2:** "Saldo de salário, férias, 13º, aviso prévio. Cada parte com a sua regra."
- **Q3:** "Em breve no plano ME: você diz o motivo, o app calcula cada parte."
- **Q4:** lista de espera: "Entrar na lista não cobra nada e não te compromete."

### 07/11 · faltam 3 · 2.8 Débito automático do DAS (ainda não existe)

- **Tela:** sem tela
- **Dor:** Todo mês a pessoa precisa lembrar do imposto e pagar guia por guia; se o vencimento passa, a conta cresce.
- **Q1:** "Pra quem cansou de lembrar do imposto todo mês."
- **Q2:** "Cada DAS, guia do imposto da ME, se paga na mão. Atrasou: multa e juros."
- **Q3:** "Débito automático ainda não tem. No app, a guia chega pronta pra pagar."
- **Q4:** enquete "Se tivesse débito automático do imposto, você usaria?" ('Usaria' / 'Prefiro pagar eu')

### 08/11 · faltam 2 · 8.5 Obrigações mensais: eSocial, EFD-Reinf, DCTFWeb (em breve)

- **Tela:** `telas/08-11 8.5 Obrigações da folha.png`
- **Dor:** Ter colaborador cria compromisso com o governo todo mês, um papel pedindo outro papel.
- **Q1:** "Contratou alguém? Agora é um papel pedindo outro papel, todo mês."
- **Q2:** "Todo mês a folha vai pro governo. E depois ainda vira declaração."
- **Q3:** "Em breve no plano ME: isso sai da sua lista de tarefas."
- **Q4:** teste "Quando vence a declaração da folha?" ("Dia 15 de cada mês" (certa) / "Junto com o imposto")

### 09/11 · falta 1 · 5.6 Relatórios contábeis: DRE, balanço, razão (em breve)

- **Tela:** `telas/09-11 5.6 Relatórios.png`
- **Dor:** Quem tem empresa quer saber se o mês foi bom, e o relatório que responde isso chega com nome técnico.
- **Q1:** "Relatório da sua empresa não precisava vir em contabilês."
- **Q2:** "Quanto entrou, saiu e sobrou fica escondido atrás de nomes como DRE e balanço."
- **Q3:** "Em breve no plano ME: o resultado do mês em português, pronto pra baixar."
- **Q4:** lista de espera: "Quer ver o seu assim? Entrar na lista não cobra nada e não te compromete."

## Antes de começar (decisões do Pedro)

1. **"Em breve":** nenhuma das 21 está confirmada pro dia 10/11 (o aceite das funcionalidades é em 03/11). As que não estão prontas saem com "em breve"; a partir de 04/11 dá pra tirar a marca das que passarem.
2. **Débito automático (07/11):** não existe e não entra no lançamento. Recomendação: trocar por outra funcionalidade.
3. **Fator R duas vezes:** 26/10 (4.2) e 02/11 (5.4) falam do mesmo aviso. Se cortar um, sai o 5.4.
4. **Stories do cronograma:** esses dias já têm stories do dia, e com a contagem junto passa do limite de venda. Recomendação: a contagem substitui os stories do cronograma de 20/10 a 09/11.
5. **Data no vault:** a base contábil ainda proíbe dizer a data de lançamento (F008 e P11). A série toda se apoia na decisão de 14/10.
6. **Telas:** todas são capturas de 02/10. Oito funcionalidades não têm tela e vão em fundo da marca; dá pra recapturar do app atual.
7. **Enquete do 21/10:** "Quanto tempo você leva pra emitir uma nota hoje?" é nova e precisa do seu ok.
