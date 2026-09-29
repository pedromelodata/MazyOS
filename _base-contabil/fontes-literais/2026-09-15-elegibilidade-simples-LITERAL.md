# **Relatório Exaustivo de Elegibilidade Tributária e Vedações ao Simples Nacional para Microempresas de Serviços**

A estruturação do *gate* de entrada para um aplicativo voltado à abertura e legalização de sociedades empresárias exige uma arquitetura de conformidade informacional rigorosa. O presente documento esgota a análise normativa, principiológica e operacional referente às barreiras de elegibilidade e regras de manutenção aplicáveis a uma Microempresa (ME). O escopo da análise está estritamente delimitado a uma entidade prestadora de serviços não regulamentados (abrangendo áreas como consultoria, publicidade, tecnologia da informação, design, ensino e tradução), sediada no município de Belo Horizonte/MG, sem filiais, composta por um a quatro sócios (exclusivamente pessoas físicas residentes no Brasil), desprovida de empregados celetistas e cuja tributação gravita entre os Anexos III e V do regime simplificado1.

O Regime Especial Unificado de Arrecadação de Tributos e Contribuições devidos pelas Microempresas e Empresas de Pequeno Porte (Simples Nacional), instituído pela Lei Complementar nº 123/2006, não constitui um direito incondicional do contribuinte. Consiste em um benefício fiscal condicionado a critérios inflexíveis de faturamento, constituição societária e natureza da atividade econômica explorada3. A inteligência do legislador, ao consolidar as vedações presentes no art. 3º, §4º, foi estabelecer um escudo contra a elisão fiscal, impedindo que o tratamento favorecido fosse instrumentalizado por meio da fragmentação artificial de receitas (a criação de múltiplos CNPJs para diluir o faturamento e burlar o teto do regime) ou pela dissimulação de relações de emprego formal (fenômeno comumente denominado "pejotização")4.

Deste modo, a interface de *onboarding* do aplicativo deve operar como um filtro autodeclaratório exaustivo e preventivo. O objetivo primário é mitigar o risco de a empresa ser formalmente constituída perante a Junta Comercial do Estado de Minas Gerais (JUCEMG) e, subsequentemente, ter o seu pedido de opção pelo regime simplificado indeferido pela Secretaria da Receita Federal do Brasil (RFB)5. O indeferimento ou a exclusão de ofício retroativa condenam a operação ao enquadramento no Lucro Presumido ou Lucro Real, gerando passivos tributários e custos de conformidade que, para uma microempresa nascente, costumam ser economicamente fatais.

Abaixo, apresenta-se a desconstrução técnica, jurídica e analítica de cada um dos vetores de vedação e elegibilidade, acompanhada do bloco mandatório de formatação estruturada para a parametrização do motor de decisão do software.

## **Parte 1: As Vedações do Art. 3º §4º da LC 123/2006, Uma a Uma**

A arquitetura das vedações estabelecida pela Lei Complementar nº 123/2006 concentra-se primordialmente na prevenção do abuso da personalidade jurídica e da pulverização de faturamento. A hermenêutica do sistema jurídico tributário brasileiro entende que se um indivíduo ostenta capacidade contributiva, administrativa e gerencial para controlar múltiplas entidades empresariais cujas receitas globais extrapolam o teto do Simples Nacional, este indivíduo perde o direito ao amparo estatal destinado aos micro e pequenos empreendedores7.

Para o perfil sob escrutínio — uma sociedade de serviços intelectuais não regulamentados, formada estritamente por sócios pessoas físicas — algumas das vedações legais são automaticamente neutralizadas pela própria natureza do modelo de negócios. Por exemplo, a proibição de participação de outras pessoas jurídicas no quadro societário (inciso I) ou a constituição sob a forma de sociedade por ações (inciso X) não representam riscos para este desenho corporativo4. Contudo, a análise adquire contornos de alta complexidade e risco quando se investiga o histórico empresarial e as conexões societárias pré-existentes dos sócios pessoas físicas que pretendem integrar a nova microempresa.

O sócio que já detém quotas em outras sociedades empresárias beneficiadas pela mesma Lei Complementar, ou que possui participação superior a 10% no capital de empresas enquadradas em regimes normais (Lucro Presumido ou Lucro Real), projeta sobre a nova Microempresa o risco imediato de exclusão, caso a receita global do conglomerado de fato ultrapasse o patamar de R$ 4.800.000,00 anuais8. Além das barreiras de faturamento global, o combate à fraude trabalhista introduziu o inciso XI, que exige atenção extrema na formulação das perguntas ao usuário final, visando detectar a subordinação jurídica disfarçada de prestação de serviços4.

### **Análise das Vedações Legais e Incidência no Perfil (Questão 1.1)**

A legislação elenca doze incisos que determinam a vedação plena ao ingresso ou à permanência no regime do Simples Nacional. A tabela a seguir esgota o texto literal de cada comando legal e afere a sua probabilidade de incidência sobre o modelo de negócios delineado (ME de serviços com até quatro sócios pessoas físicas).

&nbsp;

| Inciso do Art. 3º, §4º da LC 123/2006 | Texto Literal da Norma | Atinge uma ME de serviço com 1 a 4 sócios PF? (Risco para o App) |
| :---- | :---- | :---- |
| **Inciso I** | "de cujo capital participe outra pessoa jurídica;"4 | **NÃO.** O perfil definido estabelece que a empresa terá de 1 a 4 sócios, *todos* pessoa física. Logo, essa vedação é estruturalmente evitada pela modelagem. |
| **Inciso II** | "que seja filial, sucursal, agência ou representação, no País, de pessoa jurídica com sede no exterior;"4 | **NÃO.** A empresa será sediada em Belo Horizonte e os sócios são pessoas físicas residentes no Brasil, descartando a subordinação a matriz estrangeira. |
| **Inciso III** | "de cujo capital participe pessoa física que seja inscrita como empresário ou seja sócia de outra empresa que receba tratamento jurídico diferenciado nos termos desta Lei Complementar, desde que a receita bruta global ultrapasse o limite de que trata o inciso II do caput deste artigo;"4 | **SIM (Risco Alto).** É altamente provável que um dos sócios PF já possua outra ME/EPP. O aplicativo deve monitorar ativamente o limite de R$ 4,8 milhões somados. |
| **Inciso IV** | "cujo titular ou sócio participe com mais de 10% (dez por cento) do capital de outra empresa não beneficiada por esta Lei Complementar, desde que a receita bruta global ultrapasse o limite de que trata o inciso II do caput deste artigo;"4 | **SIM (Risco Alto).** Se o sócio detém mais de 10% em uma empresa de Lucro Presumido/Real, a soma dos faturamentos pode estourar o limite da nova ME. |
| **Inciso V** | "cujo titular ou sócio exerça cargo de administrador ou equivalente em outra pessoa jurídica com fins lucrativos, desde que a receita bruta global ultrapasse o limite de que trata o inciso II do caput deste artigo;"7 | **SIM (Risco Alto).** O sócio pode ser um mero diretor executivo (sem cotas) em uma S.A. ou Ltda de grande porte. Se o faturamento somado estourar, a ME é vedada. |
| **Inciso VI** | "constituída sob a forma de cooperativas, salvo as de consumo;"4 | **NÃO.** O escopo do projeto é a abertura de uma Microempresa (provavelmente LTDA ou Sociedade Unipessoal), e não de uma sociedade cooperativa. |
| **Inciso VII** | "que participe do capital de outra pessoa jurídica;"4 | **NÃO.** A vedação pune a ME que compra cotas de outras empresas. Como o app apenas abrirá a empresa operadora de serviços, ela nascerá sem participações. |
| **Inciso VIII** | "que exerça atividade de banco comercial, de investimentos e de desenvolvimento, de caixa econômica, de sociedade de crédito, financiamento e investimento ou de crédito imobiliário, de corretora ou de distribuidora de títulos, valores mobiliários e câmbio, de empresa de arrendamento mercantil, de seguros privados e de capitalização ou de previdência complementar;"4 | **NÃO.** O perfil está restrito a serviços não regulamentados (TI, publicidade, consultoria, etc.), o que afasta o Sistema Financeiro Nacional. |
| **Inciso IX** | "resultante ou remanescente de cisão ou qualquer outra forma de desmembramento de pessoa jurídica que tenha ocorrido em um dos 5 (cinco) anos-calendário anteriores;"10 | **NÃO.** O aplicativo propõe a abertura originária de empresas ("gate de entrada"), e não operações complexas de reestruturação societária (cisão). |
| **Inciso X** | "constituída sob a forma de sociedade por ações;"4 | **NÃO.** As Sociedades Anônimas (S.A.) são vedadas, mas o app constituirá MEs sob a forma de Sociedade Limitada (LTDA), conforme o escopo padrão do mercado. |
| **Inciso XI** | "cujos titulares ou sócios guardem, cumulativamente, com o contratante do serviço, relação de pessoalidade, subordinação e habitualidade;"4 | **SIM (Risco Crítico).** Profissionais de TI, design e consultoria frequentemente abrem PJs para atuar como funcionários de fato. Isso configura pejotização e é vedado. |
| **Inciso XII** | "que tenha filial, sucursal, agência ou representação no exterior."4 | **NÃO.** O escopo trava a sede em Belo Horizonte/MG, sem a existência de filiais, isolando a empresa desta vedação de internacionalização física. |

A seguir, a formatação obrigatória para a parametrização do software no que diz respeito ao levantamento geral das vedações do Artigo 3º.

| Formato Obrigatório (Questão 1.1) | Detalhamento |
| :---- | :---- |
| **1\. Resposta direta** | A legislação impõe doze incisos restritivos, dos quais os focados em participação do sócio em outras empresas (III, IV e V) e na prestação de serviço com características de vínculo empregatício disfarçado (XI) são os únicos que podem atingir e inviabilizar o perfil da Microempresa analisada. |
| **2\. Dispositivo legal** | Lei Complementar nº 123/2006, art. 3º, §4º, incisos I a XII. |
| **3\. Citação LITERAL** | "\[textos literais supramencionados na tabela de análise vertical\]" |
| **4\. Vigência** | Setembro de 2026 |
| **5\. Confiança** | ALTA |
| **6\. 🔑 Pergunta App** | "Para garantir que sua empresa possa pagar menos impostos pelo Simples Nacional, precisamos investigar se você já possui outras empresas, se atua como administrador em outros negócios, ou se vai trabalhar para o seu cliente cumprindo horários e ordens como se fosse um funcionário." |

### **O Risco da Participação Societária Pré-existente (Questão 1.2)**

Quando a pessoa física que está ingressando na nova Microempresa já figura no quadro societário de outra pessoa jurídica, a malha fiscal da Receita Federal atua consolidando as receitas para evitar o fracionamento elisivo. A regra, no entanto, é assimétrica e depende intimamente do regime tributário da "outra empresa". Se a outra empresa na qual o indivíduo já é sócio for optante pelo Simples Nacional (outra ME ou EPP), a lei não faz qualquer distinção quanto ao percentual de quotas que ele detém. Seja uma participação ínfima de 0,1% ou o controle absoluto de 100%, o mero fato de o CPF constar no quadro societário de duas empresas do Simples Nacional atrai a regra da cumulatividade: a receita bruta global das duas entidades somadas não pode ultrapassar o teto de R$ 4.800.000,00 anuais8.

Por outro lado, se a "outra empresa" não for optante pelo Simples Nacional (estando enquadrada, por exemplo, no Lucro Presumido ou Lucro Real), a legislação estabelece uma trava de materialidade. O impedimento e a consequente soma dos faturamentos globais apenas ocorrerão se o sócio detiver mais de 10% (dez por cento) do capital social dessa outra empresa4. Esta flexibilização permite que um empreendedor mantenha pequenos investimentos em companhias maiores sem que isso asfixie a sua capacidade de abrir uma microempresa de serviços sob o regime simplificado.

| Formato Obrigatório (Questão 1.2) | Detalhamento |
| :---- | :---- |
| **1\. Resposta direta** | O impedimento ocorre se o sócio participar de outra empresa optante pelo Simples (não importando o percentual) e o faturamento somado estourar R$ 4,8 milhões, ou se participar de empresa fora do Simples com mais de 10% do capital e o faturamento somado também estourar esse limite. |
| **2\. Dispositivo legal** | Lei Complementar nº 123/2006, art. 3º, §4º, incisos III e IV. |
| **3\. Citação LITERAL** | "III \- de cujo capital participe pessoa física que seja inscrita como empresário ou seja sócia de outra empresa que receba tratamento jurídico diferenciado nos termos desta Lei Complementar, desde que a receita bruta global ultrapasse o limite de que trata o inciso II do caput deste artigo; IV \- cujo titular ou sócio participe com mais de 10% (dez por cento) do capital de outra empresa não beneficiada por esta Lei Complementar, desde que a receita bruta global ultrapasse o limite de que trata o inciso II do caput deste artigo;" |
| **4\. Vigência** | Setembro de 2026 |
| **5\. Confiança** | ALTA |
| **6\. 🔑 Pergunta App** | "Você já é dono ou sócio de alguma outra empresa atualmente? Precisamos saber qual é o regime de impostos dela e quantos por cento você tem no negócio." |

### **A Condição de Administrador Não-Sócio (Questão 1.3)**

O planejamento tributário agressivo frequentemente tentava contornar as vedações de faturamento global nomeando o verdadeiro controlador do negócio apenas como "diretor" ou "administrador" no contrato social, sem lhe atribuir quotas (sócio oculto ou blindagem patrimonial). O legislador antecipou essa manobra e instituiu uma vedação focada no poder de gestão, desvinculada da propriedade do capital7.

Se a pessoa física figura como administrador em outra pessoa jurídica com fins lucrativos (como uma grande rede de varejo, uma indústria no Lucro Real, ou qualquer operação empresarial), o faturamento dessa empresa administrada é somado ao faturamento da nova Microempresa. Não importa se a pessoa possui zero quotas na empresa que administra; a detenção do cargo executivo é o gatilho para a consolidação das receitas7. Se essa soma ultrapassar os R$ 4.800.000,00 anuais, a nova ME será irremediavelmente vedada de ingressar no Simples Nacional.

| Formato Obrigatório (Questão 1.3) | Detalhamento |
| :---- | :---- |
| **1\. Resposta direta** | Sim, o exercício do cargo de administrador em outra empresa com fins lucrativos (mesmo sem ser sócio dela) impede a opção se a soma dos faturamentos das duas empresas ultrapassar o limite global de R$ 4,8 milhões. |
| **2\. Dispositivo legal** | Lei Complementar nº 123/2006, art. 3º, §4º, inciso V. |
| **3\. Citação LITERAL** | "V \- cujo titular ou sócio exerça cargo de administrador ou equivalente em outra pessoa jurídica com fins lucrativos, desde que a receita bruta global ultrapasse o limite de que trata o inciso II do caput deste artigo;" |
| **4\. Vigência** | Setembro de 2026 |
| **5\. Confiança** | ALTA |
| **6\. 🔑 Pergunta App** | "Você atua como diretor ou administrador oficial em alguma outra empresa com fins lucrativos, mesmo sem ter participação como dono?" |

### **O Conflito Simultâneo com o MEI (Questão 1.4)**

O Microempreendedor Individual (MEI) é uma subcategoria do Simples Nacional criada com um propósito social rigoroso de formalização da base da pirâmide econômica. Por este motivo, o instituto do MEI não admite a convivência com outras atuações empresariais do mesmo indivíduo. A legislação prevê que a pessoa física não pode ser sócia, administradora ou titular de qualquer outra empresa enquanto mantiver a sua condição de MEI11.

Consequentemente, se o cliente do aplicativo possui um MEI ativo em seu Cadastro de Pessoas Físicas (CPF), a tentativa de integrar o quadro societário de uma nova ME provocará uma colisão de regimes12. A abertura da nova ME não é juridicamente bloqueada na Junta Comercial, contudo, a efetivação dessa nova sociedade forçará o desenquadramento obrigatório e imediato do MEI original, que passará a ser tributado como uma ME ordinária com recolhimentos retroativos caso a comunicação não seja feita tempestivamente11. Portanto, a abertura da ME obriga, de fato, a baixa ou o desenquadramento prévio do MEI para evitar um contencioso tributário oneroso.

| Formato Obrigatório (Questão 1.4) | Detalhamento |
| :---- | :---- |
| **1\. Resposta direta** | Possuir um MEI ativo não impede tecnicamente a abertura da nova ME, porém, o ingresso na nova sociedade obriga o cliente a desenquadrar ou dar baixa no MEI imediatamente, sob pena de exclusão de ofício e multas. |
| **2\. Dispositivo legal** | Resolução CGSN nº 140/2018, art. 115, § 2º, inciso IV. |
| **3\. Citação LITERAL** | "O desenquadramento do Simei mediante comunicação do contribuinte à RFB (...) dar-se-á: (...) IV \- obrigatoriamente, quando o MEI incorrer em qualquer das situações de vedação previstas (...) Que passe a participar de outra empresa como titular, sócio ou administrador." |
| **4\. Vigência** | Setembro de 2026 |
| **5\. Confiança** | ALTA |
| **6\. 🔑 Pergunta App** | "Você possui algum MEI aberto no seu nome? Se sim, precisaremos solicitar a baixa ou a alteração desse MEI antes de formalizarmos a sua nova empresa." |

### **Mecânica de Cálculo do Limite Global (Questão 1.5)**

A "receita bruta global" representa a consolidação matemática do faturamento de todas as entidades vinculadas à pessoa física pelos gatilhos dos incisos III, IV e V do art. 3º da LC 123/2006. O teto máximo consolidado que o sistema federal tolera é de R$ 4.800.000,00 anuais no mercado interno8. O cálculo não respeita a proporcionalidade da participação do sócio; trata-se de uma soma integral e absoluta. Se o indivíduo detém 11% de uma empresa de tecnologia no Lucro Presumido que fatura R$ 4.000.000,00 e decide abrir uma nova ME de consultoria, o faturamento da nova ME estará limitado ao teto residual de R$ 800.000,008.

Quando o estouro do teto ocorre, os efeitos punitivos são distribuídos a todas as empresas do portfólio do sócio que estejam no Simples Nacional. Se a ultrapassagem for comunicada durante o ano-calendário, as empresas são excluídas do regime simplificado. Caso o excesso seja superior a 20% do limite (ou seja, faturamento global acima de R$ 5.760.000,00), a exclusão possui efeito retroativo ao início do ano ou à data de abertura5. Se o excesso for inferior a 20%, a exclusão produzirá efeitos apenas a partir de 1º de janeiro do ano subsequente5.

| Formato Obrigatório (Questão 1.5) | Detalhamento |
| :---- | :---- |
| **1\. Resposta direta** | O limite global somado é de R$ 4.800.000,00 por ano-calendário, calculado pela soma total e integral do faturamento das empresas vinculadas ao CPF; quando estourado, todas as empresas optantes do sócio são excluídas do Simples Nacional. |
| **2\. Dispositivo legal** | Lei Complementar nº 123/2006, art. 3º, §4º c/c Resolução CGSN nº 140/2018, art. 15, inciso IV. |
| **3\. Citação LITERAL** | "A pessoa jurídica de cujo capital participe pessoa física que seja inscrita como empresário ou seja sócia de outra empresa beneficiada (...) não pode ser optante pelo Simples Nacional se a receita bruta global ultrapassar R$ 4.800.000,00." |
| **4\. Vigência** | Setembro de 2026 |
| **5\. Confiança** | ALTA |
| **6\. 🔑 Pergunta App** | "Somando todo o faturamento por ano de todas as outras empresas nas quais você tem participação, o valor chega perto de 4 milhões e 800 mil reais?" |

### **A Relação com Vínculo Empregatício CLT (Questão 1.6)**

A existência de um vínculo empregatício formal regido pela Consolidação das Leis do Trabalho (CLT) é absolutamente ignorada pelas normativas de elegibilidade do Simples Nacional16. O Estado não proíbe a pessoa física de acumular a condição de assalariado em uma corporação e a condição de empresário no contraturno.

Contudo, a leitura da equipe de engenharia/negócios do aplicativo está essencialmente correta: o único impacto real dessa concomitância incide sobre o cômputo da folha de pagamento e o limite de contribuição ao Instituto Nacional do Seguro Social (INSS). Como o sócio CLT já recolhe contribuição previdenciária descontada na fonte por seu empregador, ao definir a retirada de pró-labore na nova ME, deve-se aplicar o abatimento para garantir que o recolhimento somado das duas fontes não exceda o Teto do Regime Geral de Previdência Social (RGPS)16. A ausência desse mapeamento no aplicativo faria com que o cliente pagasse impostos redundantes sem benefício atuarial.

| Formato Obrigatório (Questão 1.6) | Detalhamento |
| :---- | :---- |
| **1\. Resposta direta** | Ter emprego formal sob a CLT não impede a pessoa de ser sócia ou abrir uma ME no Simples Nacional, impactando exclusivamente o ajuste do teto de contribuição previdenciária (INSS) para evitar pagamentos duplicados. |
| **2\. Dispositivo legal** | Princípio da Legalidade (Art. 5º, II, CF/88) c/c Lei nº 8.212/1991 (Regramento do INSS). |
| **3\. Citação LITERAL** | \[Inexistência de texto proibitivo aplicável; a Constituição garante o livre exercício da atividade econômica não expressamente vedada por lei\]. |
| **4\. Vigência** | Setembro de 2026 |
| **5\. Confiança** | ALTA |
| **6\. 🔑 Pergunta App** | "Você trabalha atualmente com carteira assinada? (Fique tranquilo, isso não impede a abertura da empresa, apenas ajustaremos o seu recolhimento de INSS para você não pagar a mais)." |

### **O Caso de Aposentados, Servidores e Estrangeiros Residentes (Questão 1.7)**

O cruzamento do perfil demográfico do sócio com a capacidade civil para o exercício da atividade empresarial exige uma dissecação em três frentes. Para o aposentado pelo INSS, a constituição de uma ME é perfeitamente legal e não suspende seus proventos (diferentemente de regras específicas de aposentadoria por invalidez, onde a atividade laborativa implica cassação do benefício)16. Para o estrangeiro residente, o Departamento Nacional de Registro Empresarial e Integração (DREI) consolidou o entendimento, por meio da IN DREI nº 81/2020, de que a posse de visto e identidade compatível permite a integral participação no quadro societário de uma ME17.

O ponto de atenção crítico reside nos servidores públicos ativos. A esmagadora maioria dos estatutos de funcionalismo público proíbe o servidor de figurar na condição de sócio-administrador, diretor ou gerente de sociedades privadas16. O servidor só pode ingressar em uma ME na condição estrita de sócio quotista, aportando capital, mas nunca exercendo atos de gestão18. Em uma empresa delimitada de 1 a 4 sócios em Belo Horizonte, se todos forem servidores estaduais ou federais, a empresa enfrentará um impasse legal, pois não haverá quem a administre licitamente, ferindo o arcabouço funcional.

| Formato Obrigatório (Questão 1.7) | Detalhamento |
| :---- | :---- |
| **1\. Resposta direta** | Estrangeiros residentes e aposentados podem ser sócios sem restrições fiscais, porém, os servidores públicos ativos são estatutariamente proibidos de atuar como administradores da empresa, podendo figurar apenas como sócios quotistas. |
| **2\. Dispositivo legal** | Lei nº 8.112/1990, art. 117, inciso X (espelhado por estatutos estaduais e municipais, como a Lei nº 7.169/1996 de BH). |
| **3\. Citação LITERAL** | "Art. 117\. Ao servidor é proibido: (...) X \- participar de gerência ou administração de sociedade privada, personificada ou não personificada, exercer o comércio, exceto na qualidade de acionista, cotista ou comanditário;" |
| **4\. Vigência** | Setembro de 2026 |
| **5\. Confiança** | ALTA |
| **6\. 🔑 Pergunta App** | "Algum dos sócios é servidor público ativo? (Servidores não podem assinar pela administração da empresa, então precisaremos definir outro administrador)." |

## **Parte 2: Quando e Como o Impedimento Aparece**

O processo de legalização empresarial no Brasil sofreu uma metamorfose digital drástica, unificando bancos de dados municipais, estaduais e federais sob o guarda-chuva da Redesim9. Contudo, a arquitetura deste sistema impõe desafios de *timing* e rastreabilidade que o aplicativo deve contornar mediante a interface de usuário.

O fluxo inicia-se com o registro do ato constitutivo (contrato social) na JUCEMG. Neste momento primário, a Junta Comercial examina quase que exclusivamente a adequação das regras civis de formação do contrato, emitindo o Cadastro Nacional da Pessoa Jurídica (CNPJ)17. O enquadramento no Simples Nacional é um rito secundário e subsequente, formalizado digitalmente via portal próprio20.

### **A Mecânica da Verificação (Questão 2.1)**

No exato momento em que o aplicativo ou o contador submete a opção eletrônica ao Simples Nacional, os barramentos do Serviço Federal de Processamento de Dados (Serpro) disparam gatilhos de consulta sincrônica21. Impedimentos explícitos e primários — como a presença de um MEI ativo associado ao CPF de um dos sócios, a existência de débitos tributários inscritos em Dívida Ativa ou irregularidades cadastrais patentes — são flagrados automaticamente6. A tela retornará um indeferimento liminar, gerando um termo com a listagem exata dos entes federativos que opuseram bloqueios (ex: "Pendência Estadual \- SEFAZ/MG")6.

Porém, a assimetria informacional é real para vedações de natureza global, como o estouro do limite de R$ 4.800.000,00 envolvendo receitas de terceiras empresas sediadas em estados distintos ou sob apurações fiscais morosas. A legislação deposita no contribuinte o dever da autodeclaração no instante da opção, declarando sob as penas da lei que cumpre os limites5. Caso a Receita Federal identifique, por meio de malha fina posterior (cruzamento de EFD-Contribuições e PGDAS-D), que a autodeclaração era inconsistente, a exclusão será processada *de ofício*, com graves repercussões retroativas5.

| Formato Obrigatório (Questão 2.1) | Detalhamento |
| :---- | :---- |
| **1\. Resposta direta** | O impedimento por pendências fiscais ou cadastrais básicas é verificado de forma imediata e automática no clique da opção, mas o estouro de faturamento global muitas vezes só é detectado pela Receita Federal meses depois, gerando exclusão retroativa. |
| **2\. Dispositivo legal** | Resolução CGSN nº 140/2018, art. 15, § 3º c/c Manual de Exclusão do Simples Nacional. |
| **3\. Citação LITERAL** | "No momento da opção, o contribuinte deverá declarar expressamente que não se enquadra nas vedações (...) A exclusão será efetuada de ofício quando verificada a falta de comunicação obrigatória..." |
| **4\. Vigência** | Setembro de 2026 |
| **5\. Confiança** | ALTA |
| **6\. 🔑 Pergunta App** | "Se deixarmos passar alguma informação incorreta sobre as suas outras empresas, a Receita pode aprovar agora e nos multar severamente no futuro. Você confirma as informações?" |

### **Consequências do Indeferimento e o Regime Subsidiário (Questão 2.2)**

Se o aplicativo solicitar a opção pelo Simples Nacional e o sistema do governo devolver um termo de indeferimento por motivo de restrições (sejam fiscais ou cadastrais), inicia-se um cronograma de crise6. O termo especificará o ente que originou o bloqueio (Prefeitura, Estado ou Receita Federal). A empresa possuirá um prazo legal—que varia conforme as leis de processo administrativo do ente impeditivo, mas que tradicionalmente gravita em 30 dias—para apresentar impugnação ou sanar o problema25.

Entretanto, uma das normativas mais severas e contraintuitivas do sistema é que a contestação do indeferimento *não possui efeito suspensivo*6. Durante toda a tramitação do processo administrativo para provar que a empresa tinha direito ao Simples, ela será tratada como uma entidade de regime ordinário. Isso significa que a recém-constituída ME nascerá, por força residual, enquadrada no Lucro Presumido (ou Real, por opção), sujeitando-se às custosas obrigações acessórias do SPED, apuração isolada de PIS, COFINS, IRPJ, CSLL e retenções previdenciárias de altíssima carga6.

| Formato Obrigatório (Questão 2.2) | Detalhamento |
| :---- | :---- |
| **1\. Resposta direta** | Se a opção for indeferida, a empresa ficará enquadrada no Lucro Presumido (regime normal) até que a pendência seja solucionada, devendo recorrer no prazo determinado pelo ente que a bloqueou, mas sem que o recurso suspenda a cobrança mais cara de impostos. |
| **2\. Dispositivo legal** | Resolução CGSN nº 140/2018, art. 14, caput e Manual de Perguntas e Respostas do Simples Nacional. |
| **3\. Citação LITERAL** | "A contestação do indeferimento não tem efeito suspensivo. Ou seja, durante a tramitação do processo a empresa não é optante, sujeitando-se às regras de tributação aplicáveis às demais pessoas jurídicas." |
| **4\. Vigência** | Setembro de 2026 |
| **5\. Confiança** | ALTA |
| **6\. 🔑 Pergunta App** | "Caso sua empresa seja bloqueada pela Receita, ela começará a vida pagando as altas taxas do Lucro Presumido até regularizarmos tudo. Tem plena certeza de que seu CPF e nome estão limpos?" |

### **A Barreira da Consulta Prévia via API (Questão 2.3)**

Do ponto de vista de engenharia de software para orquestração tributária (GovTech), o cenário atual de integração governamental é marcado por um silêncio arquitetônico no que tange a checagens preditivas de CPF21. Não existe, no catálogo de integrações do Serpro ou da Rede Nacional para a Simplificação do Registro e da Legalização de Empresas e Negócios (Redesim), uma API ou *webservice* de acesso público ou pago que permita a um aplicativo submeter um pacote de CPFs e requerer um *status* de "Elegibilidade ao Simples Nacional" antes da geração do CNPJ19.

As APIs existentes (como o sistema de Consulta Optantes) demandam, invariavelmente, que o CNPJ da requerente já esteja materializado no mundo jurídico21. O Estado delega a averiguação preliminar inteiramente ao profissional responsável pelo *onboarding* do cliente, que deve balizar-se por declarações assinadas. A implicação de negócio para o aplicativo é que a esteira de abertura de empresas deve adotar contratos de prestação de serviços com cláusulas de isenção de responsabilidade severas, caso o cliente minta ou omita a existência de pendências que gerem o indeferimento após o pagamento de taxas comerciais29.

| Formato Obrigatório (Questão 2.3) | Detalhamento |
| :---- | :---- |
| **1\. Resposta direta** | Não existe nenhum serviço, portal ou API governamental que permita simular de forma prévia e autônoma se um CPF possui impeditivos para o Simples Nacional antes de o CNPJ ser de fato gerado na Junta Comercial. |
| **2\. Dispositivo legal** | \[Inexistência de regulamentação / Arquitetura técnica omissa\]. |
| **3\. Citação LITERAL** | \[Declara-se a inexistência de norma jurídica determinando a disponibilização desse recurso tecnológico em caráter de consulta prévia por CPF\]. |
| **4\. Vigência** | Setembro de 2026 |
| **5\. Confiança** | ALTA |
| **6\. 🔑 Pergunta App** | "Como não temos acesso antecipado aos sistemas bloqueados da Receita Federal para testar o seu CPF, precisaremos confiar 100% nas suas respostas a seguir." |

### **A Exclusão Temporal por Novos Entrantes (Questão 2.4)**

A perenidade da conformidade tributária obriga a ME a policiar a sua composição societária contínua. Se o aplicativo estrutura uma sociedade regular em janeiro, mas em outubro os sócios decidem incorporar um investidor-anjo pessoa física que detém 20% de uma imobiliária no Lucro Presumido, a engrenagem fiscal é acionada.

Ao processar a alteração contratual nos sistemas, a Receita Federal validará a nova composição do capital social. Se as condições preexistentes do novo sócio incorrerem nas vedações do art. 3º, §4º (como o estouro da receita global), o desenquadramento não punirá o passado, mas atingirá o futuro imediato. A exclusão operará seus efeitos a partir do mês subsequente à homologação dessa modificação contratual na Junta Comercial14. Isso impõe que a validação executada pelo app no *onboarding* seja replicada futuramente como uma funcionalidade (uma espécie de *check-up* societário) sempre que os clientes requisitarem alterações no QSA (Quadro de Sócios e Administradores).

| Formato Obrigatório (Questão 2.4) | Detalhamento |
| :---- | :---- |
| **1\. Resposta direta** | Sim, a entrada de um novo sócio no meio do ano que carregue um fator de vedação (como histórico de faturamentos altos em outras empresas) acarretará a exclusão irremediável da empresa do Simples Nacional a partir do mês seguinte. |
| **2\. Dispositivo legal** | Lei Complementar nº 123/2006, art. 31, inciso II c/c Resolução CGSN nº 140/2018, art. 81, II, 'c'. |
| **3\. Citação LITERAL** | "A exclusão das microempresas (...) produzirá efeitos: II \- na hipótese do inciso II do caput do art. 30 desta Lei Complementar, a partir do mês seguinte ao da ocorrência da situação de vedação;" |
| **4\. Vigência** | Setembro de 2026 |
| **5\. Confiança** | ALTA |
| **6\. 🔑 Pergunta App** | "Antes de aceitar um novo sócio na sua empresa no futuro, lembre-se que teremos de analisar todo o histórico de outras empresas dele para não sermos expulsos do Simples." |

### **Detectabilidade: Cadastro Humano vs. Bancos de Dados (Questão 2.5)**

Para o time de produto que está desenhando o funil de aquisição (UX/UI), é crucial separar as responsabilidades de mapeamento. As vedações de configuração societária (ter um MEI, ser um servidor estadual impeditivo, possuir participação com faturamento explosivo em outras PJs, ou atuar como administrador em S.A.s) pertencem inteiramente à esfera da declaração volitiva do usuário4. Um questionário inteligente, dotado de perguntas sequenciais em árvore de decisão, cobre 100% dessa exposição.

Diametralmente, a existência de execuções fiscais obscuras, pendências de alvarás de localização de empresas antigas no município de Belo Horizonte, Inscrições Estaduais inaptas em MG por não entrega de declarações, e falhas no cruzamento da malha fina estadual (DAPI/DeSTDA) pertencem a uma dimensão de bases de dados segregadas que raramente são do conhecimento primário do próprio cidadão, que muitas vezes desconhece a irregularidade residual de negócios passados14.

| Formato Obrigatório (Questão 2.5) | Detalhamento |
| :---- | :---- |
| **1\. Resposta direta** | Vedações relacionadas à estrutura societária, ocupações (como ser servidor) e faturamento em outros negócios são detectáveis por um cadastro preciso, mas dívidas ocultas e bloqueios de prefeituras/estados só serão descobertos consultando os respectivos órgãos na emissão do deferimento. |
| **2\. Dispositivo legal** | Resolução CGSN nº 140/2018, art. 15, § 2º e § 3º. |
| **3\. Citação LITERAL** | "O contribuinte deverá declarar expressamente que não se enquadra nas vedações (...) A opção (...) sujeita-se à verificação da regularidade da inscrição municipal ou estadual, quando exigível, e de ausência de débitos, pelo respectivo ente federado." |
| **4\. Vigência** | Setembro de 2026 |
| **5\. Confiança** | ALTA |
| **6\. 🔑 Pergunta App** | "Nós cuidaremos da análise das suas respostas sobre participação em empresas e cargo público, mas dívidas de prefeitura e governo estadual nós só descobriremos depois de darmos andamento ao pedido oficial." |

## **Parte 3: O Que Muda Com a Entrada de um Sócio Novo e o Fator R**

A prestação de serviços intelectuais, como os descritos no modelo (consultoria, design, TI), atrai a aplicação do mecanismo de tributação mais refinado e punitivo do Simples Nacional: o Fator R2.

Essas atividades são alocadas nativamente no Anexo V, que submete a empresa a uma alíquota inicial gravosa de 15,5%. O legislador concede uma válvula de escape permitindo que essas empresas tributem pelo Anexo III (alíquota inicial amigável de 6%) condicionada à sua função social de gerar empregos e distribuir renda. Essa válvula é acionada se a relação entre a folha de salários dos últimos doze meses (FS12) e a receita bruta dos mesmos doze meses (RBT12) for igual ou superior a 28%2. Como o perfil estipula zero funcionários, a única engrenagem disponível para inflar a rubrica da Folha de Salários é o pró-labore dos sócios pessoas físicas. Portanto, qualquer alteração societária impõe manobras contábeis diretas na gestão deste coeficiente matemático33.

### **A Esteira de Obrigações na Admissão do Novo Sócio (Questão 3.1)**

A incorporação de um novo participante a uma empresa preexistente em operação exige uma sequência cartorária, fazendária e previdenciária infalível17.

> 1. **Alteração Contratual (JUCEMG):** Celebração do documento jurídico redistribuindo as quotas, assinado preferencialmente por certificado digital e protocolado via requerimento eletrônico na Junta Comercial de Minas Gerais.  
> 2. **Redesim / DBE (RFB):** Aprovação da viabilidade e transmissão do Documento Básico de Entrada via portal gov.br para sincronização do capital e averbação do sócio no Cadastro Nacional de Pessoa Jurídica19.  
> 3. **Prefeitura de BH (Alvará/ISS):** Reflexo automatizado via integração estadual, mas que por vezes exige atualização sistêmica local para manutenção de conformidade de guias do ISS30.  
> 4. **eSocial e DCTFWeb:** A obrigação mais premente. O escritório contábil ou o *software* da empresa deverá cadastrar a qualificação cadastral do novo membro no sistema eSocial e enviar, imediatamente na competência pertinente, os eventos de Remuneração de Trabalhador (S-1200) e Pagamento de Rendimentos (S-1210) informando o valor do pró-labore33.

| Formato Obrigatório (Questão 3.1) | Detalhamento |
| :---- | :---- |
| **1\. Resposta direta** | O ingresso exige o registro de alteração contratual na Junta Comercial, a aprovação do DBE perante a Receita Federal para atualizar o CNPJ, e a inserção imediata dos dados do sócio no eSocial para legitimar os repasses de pró-labore. |
| **2\. Dispositivo legal** | Lei nº 10.406/2002 (Código Civil), art. 997 e ss. c/c IN DREI nº 81/2020. |
| **3\. Citação LITERAL** | "A sociedade constitui-se mediante contrato escrito, particular ou público, que (...) mencionará: I \- nome, nacionalidade, estado civil, profissão e residência dos sócios, se pessoas naturais..." |
| **4\. Vigência** | Setembro de 2026 |
| **5\. Confiança** | ALTA |
| **6\. 🔑 Pergunta App** | "Para oficializarmos a entrada do seu novo sócio, precisamos gerar o contrato, pagar as taxas do governo e registrar ele nos sistemas de folha de pagamento (eSocial)." |

### **O Início e o Impacto do Pró-Labore no Fator R (Questão 3.2)**

A eficácia contábil para o cômputo do Fator R opera sob a lógica do *Regime de Caixa* para as saídas (quando o dinheiro efetivamente cai na conta ou é formalizado pelo recibo de pró-labore)31. Se o sócio for admitido mediante registro na Junta Comercial na primeira semana de agosto, e o contrato social ou ata estipular a sua retirada de pró-labore já no mês de agosto, esse valor será declarado no fechamento de folha gerado até meados de setembro.

O reflexo no Fator R será imediato na competência da distribuição (agosto, pago e declarado em setembro). O somatório dessa retirada passará a encorpar o numerador da fórmula—a Folha de Salários (FS12)—afetando o cálculo tributário exato do Simples Nacional que será pago em 20 de setembro (relativo às notas fiscais de agosto)2. Além da competência de ingresso, esse exato pagamento comporá o lastro matemático da empresa pelos próximos 11 meses de apuração.

| Formato Obrigatório (Questão 3.2) | Detalhamento |
| :---- | :---- |
| **1\. Resposta direta** | O pró-labore pode ser retirado a partir do exato mês em que a entrada do sócio for formalizada e afeta o Fator R imediatamente na apuração dos impostos referentes àquela mesma competência, compondo o histórico dos próximos 12 meses. |
| **2\. Dispositivo legal** | Resolução CGSN nº 140/2018, art. 26\. |
| **3\. Citação LITERAL** | "Para fins de determinação do fator 'r' (...) considera-se: I \- folha de salários, incluídos encargos, nos 12 (doze) meses anteriores ao período de apuração (FS12), o montante pago (...) a título de remunerações a pessoas físicas decorrentes do trabalho..." |
| **4\. Vigência** | Setembro de 2026 |
| **5\. Confiança** | ALTA |
| **6\. 🔑 Pergunta App** | "O novo sócio começará a receber o pró-labore (o 'salário' de dono) já neste primeiro mês, ajudando a diminuir o imposto da empresa agora mesmo?" |

### **O Desligamento Societário e o Fantasma do Fator R (Questão 3.3)**

O aspecto mais hermético e estrategicamente explorado da equação do Fator R refere-se à inércia dos pagamentos pretéritos33. A base normativa para o cálculo tributário exige a mensuração dos pagamentos efetuados "nos 12 (doze) meses anteriores" (FS12)2. A legislação atrela o peso contábil à rubrica financeira, e não à manutenção do vínculo sociocrático ou trabalhista.

Isto significa que, se um sócio recebeu pró-labore elevado entre janeiro e junho, e formalizou sua saída integral da sociedade em julho, a massa salarial gasta com ele não é subtraída retroativamente dos sistemas do Programa Gerador do Documento de Arrecadação (PGDAS-D). Os valores repassados a ele continuarão somados na Folha Histórica (FS12) por doze meses subsequentes ao respectivo pagamento de cada competência2. A microempresa usufruirá de um "fôlego" tributário, permanecendo beneficiada pelo Anexo III, à medida que a robustez daqueles salários pagos sustenta o coeficiente acima de 28%, decaindo paulatinamente mês a mês à medida que a janela móvel avança.

| Formato Obrigatório (Questão 3.3) | Detalhamento |
| :---- | :---- |
| **1\. Resposta direta** | A saída do sócio não apaga os pró-labores recebidos por ele no passado; a folha histórica não muda, e os valores pagos a ele continuarão favorecendo a manutenção da empresa no Anexo III por até doze meses após o pagamento. |
| **2\. Dispositivo legal** | Resolução CGSN nº 140/2018, art. 26\. |
| **3\. Citação LITERAL** | "Para fins de determinação do fator 'r' (...) considera-se: I \- folha de salários (...) o montante pago (...) nos 12 (doze) meses anteriores ao período de apuração (FS12)..." \[Regime de caixa puro, sem exigência de continuidade do favorecido\]. |
| **4\. Vigência** | Setembro de 2026 |
| **5\. Confiança** | ALTA |
| **6\. 🔑 Pergunta App** | "Como o sócio saiu, nós saberemos ajustar seus impostos, pois os saques feitos por ele no passado continuam sendo calculados a seu favor nos próximos meses para reduzir sua alíquota." |

## **Fechamento e Parametrização Final**

A tabela a seguir unifica os gargalos centrais que norteiam a programação do sistema e a modelagem do questionário cadastral, garantindo que a equipe de engenharia e negócios tenha visibilidade absoluta das áreas de exposição de risco no momento de atrair uma nova Microempresa de serviços de propriedade mista (até 4 sócios PF) no estado de Minas Gerais.

| Vedação / Impeditivo Primário | Norma de Regência e Aplicação | Atinge nosso perfil (Serviço, 1-4 sócios PF, sem funcionários em BH/MG)? | Detectável por pergunta no cadastro? | 🔑 A pergunta em português de gente, direcionada ao usuário |
| :---- | :---- | :---- | :---- | :---- |
| **Sócio atua em outra empresa optante pelo Simples** (O somatório estoura 4,8M) | LC 123/2006, art. 3º, §4º, III | **Sim**. Qualquer percentual societário engatilha a soma de faturamentos das entidades limitando o ingresso. | **Sim**. Integralmente dependente da autodeclaração. | "Você já é dono ou sócio de alguma outra empresa atualmente? Se sim, somando o faturamento delas com o desta nova, o valor passa de 4 milhões e 800 mil reais no ano?" |
| **Sócio atua em outra empresa FORA do Simples** (O somatório estoura 4,8M) | LC 123/2006, art. 3º, §4º, IV | **Sim**. A regra de soma global dispara somente se o sócio possuir participação superior a **10%** nas outras empresas. | **Sim**. Necessária declaração do QSA. | "Você possui mais de 10% de participação em alguma empresa de lucro presumido ou real? Se sim, o faturamento global de todas elas passa de 4,8 milhões?" |
| **Sócio é apenas administrador de outra empresa** (O somatório estoura 4,8M) | LC 123/2006, art. 3º, §4º, V | **Sim**. A mera titularidade do cargo de diretoria em entidades com fins lucrativos invoca a barreira. | **Sim**. | "Você atua como diretor ou administrador registrado em outra empresa, mesmo sem ser sócio ou dono dela? Se sim, o faturamento de todas passa de 4,8 milhões?" |
| **Pejotização (Empregado Disfarçado)** | LC 123/2006, art. 3º, §4º, XI | **Sim** (Risco Crítico). Serviços em áreas intelectuais atraem pesada fiscalização para simulação de vínculos. | **Parcialmente** (A eficácia depende da sinceridade contratual do cliente). | "Você vai prestar o serviço cumprindo horários rígidos e recebendo ordens diretas do seu cliente como se fosse um funcionário de carteira assinada?" |
| **Titularidade Concomitante de MEI** | Res. CGSN 140/2018, art. 115, §2º, IV | **Sim**. É proibida a permanência de um MEI frente à absorção de quotas de uma ME. | **Sim**. A base restritiva é nominal (CPF). | "Você possui um MEI ativo em seu nome? (Teremos que baixar ou alterar o MEI antes de prosseguir com a abertura)." |
| **Servidor Público Ativo** | Lei 8.112/90, art. 117, X / Lei 7.169/96 (Estatuto BH) | **Sim**. A limitação ocorre na atribuição de administração (é vedado), embora a participação no capital (como quotista) seja lícita. | **Sim**. Exige o mapeamento funcional. | "Algum dos sócios é servidor público ativo? (Isso exige que definamos quem irá assinar oficialmente as responsabilidades do negócio, pois servidores não podem)." |
| **Vínculo Empregatício CLT em outra empresa** | Princípio da Legalidade / Lei 8.212/91 | **Não é Vedação**. O impeditivo não existe. Serve exclusivamente ao *compliance* do recolhimento de INSS atrelado ao Fator R. | **Sim**. Foco na usabilidade fiscal. | "Você trabalha com carteira assinada atualmente? (Isso não bloqueia a empresa, serve apenas para ajustarmos seu desconto de INSS corretamente)." |
| **Consulta Prévia Autônoma via API por CPF** | Omisso na arquitetura e documentação do Governo | **Não aplicável**. O ambiente tecnológico do REDESIM/Serpro recusa avaliações preditivas síncronas fora da posse do CNPJ. | **Não**. | "O governo não libera um teste prévio automático pelo CPF. Você tem total certeza de que todas as informações passadas são verdadeiras?" |

### **Declaração Normativa de Ausências Legais**

A fim de instruir os departamentos jurídico, técnico e de produto da corporação sobre as omissões objetivas da legislação aplicada a este cenário, declara-se oficialmente que:

> 1. **Inexistência de Normativa para Web Services de Pré-Consulta por CPF:** Embora o ambiente burocrático demande profunda análise preventiva por parte de escritórios de contabilidade e ferramentas automatizadas, constata-se a completa ausência de regulamentação, instrução normativa ou manual técnico do Serpro/Receita Federal que discipline ou disponibilize uma API de consulta livre, baseada primariamente no número do CPF da pessoa física, para atestar previamente o deferimento futuro ao Simples Nacional. Todo o ecossistema tecnológico governamental (como a API de *Consulta Optantes*) exige a geração preexistente do CNPJ para operar uma validação21.  
> 2. **Inexistência de Vedação para Sócios Celetistas (CLT):** Após investigação transversal das restrições da LC nº 123/2006 (artigos 3º, 15, 17, 30 e 31\) e da Resolução CGSN nº 140/2018, declara-se a total inexistência de comando jurídico ou infralegal que impeça a constituição de uma Microempresa e o ingresso no Simples Nacional pela posse de um contrato de trabalho celetista prévio, concomitante ou superveniente8. A preocupação da plataforma em absorver tal informação deve repousar fundamentalmente em algoritmos de cálculo para a otimização tributária do eSocial (limitador do Teto Previdenciário), e nunca atuar como bloqueador do acesso (gate) à abertura da organização.

#### **Referências citadas**

> 1. Lei do Simples Nacional \- Principais pontos para concursos públicos, [https://www.estrategiaconcursos.com.br/blog/principais-pontos-da-lei-do-simples-nacional-para-concursos-publicos/](https://www.estrategiaconcursos.com.br/blog/principais-pontos-da-lei-do-simples-nacional-para-concursos-publicos/)  
> 2. Manual do PGDAS-D e DEFIS \- Simples Nacional, [https://www8.receita.fazenda.gov.br/simplesnacional/arquivos/manual/manual\_pgdas-d\_2018\_v4.pdf](https://www8.receita.fazenda.gov.br/simplesnacional/arquivos/manual/manual_pgdas-d_2018_v4.pdf)  
> 3. LEI COMPLEMENTAR Nº 123, DE 14 DE DEZEMBRO DE 2006, [https://www.comprasnet.gov.br/legislacao/leis/lei123\_2006.htm](https://www.comprasnet.gov.br/legislacao/leis/lei123_2006.htm)  
> 4. Lcp 123 \- Planalto, [https://www.planalto.gov.br/ccivil\_03/leis/lcp/lcp123.htm](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm)  
> 5. MANUAL DA EXCLUSÃO DO SIMPLES NACIONAL, [https://www8.receita.fazenda.gov.br/SimplesNacional/Arquivos/manual/MANUAL\_EXCLUSAO.pdf](https://www8.receita.fazenda.gov.br/SimplesNacional/Arquivos/manual/MANUAL_EXCLUSAO.pdf)  
> 6. Perguntas e Respostas do Simples Nacional, [https://www8.receita.fazenda.gov.br/simplesnacional/arquivos/manual/perguntaosn.pdf](https://www8.receita.fazenda.gov.br/simplesnacional/arquivos/manual/perguntaosn.pdf)  
> 7. RC 21256/2020 \- Legislação Tributária, [https://legislacao.fazenda.sp.gov.br/Paginas/RC21256\_2020.aspx](https://legislacao.fazenda.sp.gov.br/Paginas/RC21256_2020.aspx)  
> 8. RC 21062/2019 \- Legislação Tributária, [https://legislacao.fazenda.sp.gov.br/Paginas/RC21062\_2019.aspx](https://legislacao.fazenda.sp.gov.br/Paginas/RC21062_2019.aspx)  
> 9. Lcp 147 \- Planalto, [https://www.planalto.gov.br/ccivil\_03/leis/lcp/lcp147.htm](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp147.htm)  
> 10. L9317 \- Planalto, [https://www.planalto.gov.br/ccivil\_03/leis/L9317.htm](https://www.planalto.gov.br/ccivil_03/leis/L9317.htm)  
> 11. MANUAL DO DESENQUADRAMENTO DO SIMEI \- Simples Nacional, [https://www8.receita.fazenda.gov.br/SimplesNacional/Arquivos/manual/MANUAL\_DESENQUADRAMENTO\_SIMEI.pdf](https://www8.receita.fazenda.gov.br/SimplesNacional/Arquivos/manual/MANUAL_DESENQUADRAMENTO_SIMEI.pdf)  
> 12. estudo técnico preliminar, [https://pncp.gov.br/pncp-api/v1/orgaos/14662467000101/compras/2026/22/arquivos/2](https://pncp.gov.br/pncp-api/v1/orgaos/14662467000101/compras/2026/22/arquivos/2)  
> 13. NORMAS \- Manaus Atende, [https://manausatende.manaus.am.gov.br/storage/webdisco/2021/06/17/outros/1965deb28499fb8f8af19897d0fc4687.pdf](https://manausatende.manaus.am.gov.br/storage/webdisco/2021/06/17/outros/1965deb28499fb8f8af19897d0fc4687.pdf)  
> 14. conselho de contribuintes do estado de minas gerais, [https://www.fazenda.mg.gov.br/secretaria/conselho\_contribuintes/acordaos/2023/2/23614232.pdf](https://www.fazenda.mg.gov.br/secretaria/conselho_contribuintes/acordaos/2023/2/23614232.pdf)  
> 15. Para observar o sublimite estadual em Mato ... \- Órgão Consultivo, [http://app1.sefaz.mt.gov.br/sistema/legislacao/RespostaConsulta.nsf/5540d90afcacd4f204257057004b655c/aa34004ef9e86f9403258baf0056d3ce?OpenDocument](http://app1.sefaz.mt.gov.br/sistema/legislacao/RespostaConsulta.nsf/5540d90afcacd4f204257057004b655c/aa34004ef9e86f9403258baf0056d3ce?OpenDocument)  
> 16. Perguntas Frequentes — Empresas & Negócios \- Portal Gov.br, [https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes](https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes)  
> 17. JUNTA COMERCIAL DO ESTADO DE MINAS GERAIS \- JUCEMG, [https://jucemg.mg.gov.br/adminlte/bower\_components/kcfinder/upload/files/Entendimentos%20Consolidados%20-%20De%20acordo%20com%20a%20RP%20n%C2%BA%2003-2026.pdf](https://jucemg.mg.gov.br/adminlte/bower_components/kcfinder/upload/files/Entendimentos%20Consolidados%20-%20De%20acordo%20com%20a%20RP%20n%C2%BA%2003-2026.pdf)  
> 18. Perícia Médica \- Prefeitura de Belo Horizonte, [https://prefeitura.pbh.gov.br/planejamento/gestao-de-pessoas/sala-do-servidor/periciamedica](https://prefeitura.pbh.gov.br/planejamento/gestao-de-pessoas/sala-do-servidor/periciamedica)  
> 19. TERMO DE REFERÊNCIA \- AWS, [https://www.tcm.pa.gov.br/mural-de-licitacoes/licitacoes/arquivo-s3/mRGcuQDNwUTMx8VNyUDM1AzXPRUQOl0UTF0XSRVSfVkUBdFVG90UfJFVfVzLykTO0MTM08SMwADM38CM38SNyAjM/80gDf4wBRVSMlkQBhEIFREIPRVSTlUVRVkU](https://www.tcm.pa.gov.br/mural-de-licitacoes/licitacoes/arquivo-s3/mRGcuQDNwUTMx8VNyUDM1AzXPRUQOl0UTF0XSRVSfVkUBdFVG90UfJFVfVzLykTO0MTM08SMwADM38CM38SNyAjM/80gDf4wBRVSMlkQBhEIFREIPRVSTlUVRVkU)  
> 20. Coordenação-Geral de Tributação \- Normas \- Receita Federal, [https://normas.receita.fazenda.gov.br/sijut2consulta/anexoOutros.action?idArquivoBinario=74615](https://normas.receita.fazenda.gov.br/sijut2consulta/anexoOutros.action?idArquivoBinario=74615)  
> 21. Arquivo de Todos \- GuiaCont, [https://guiacont.com.br/categoria/todos/](https://guiacont.com.br/categoria/todos/)  
> 22. Atos do Executivo \- Diário Oficial, [https://diariooficial.prefeitura.sp.gov.br/md\_epubli\_controlador.php?acao=edicao\_consultar\&formato=O\&dta=26/09/2024](https://diariooficial.prefeitura.sp.gov.br/md_epubli_controlador.php?acao=edicao_consultar&formato=O&dta=26/09/2024)  
> 23. Lei-3.316-24122021-institui-o-sistema-tributario-do-municipio-de, [https://santavitoria.mg.gov.br/wp-content/uploads/2022/01/Lei-3.316-24122021-institui-o-sistema-tributario-do-municipio-de-santa-vitoria.pdf](https://santavitoria.mg.gov.br/wp-content/uploads/2022/01/Lei-3.316-24122021-institui-o-sistema-tributario-do-municipio-de-santa-vitoria.pdf)  
> 24. L13043 \- Planalto, [https://www.planalto.gov.br/ccivil\_03/\_ato2011-2014/2014/lei/l13043.htm](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13043.htm)  
> 25. Decreto nº 7574 \- Planalto, [https://www.planalto.gov.br/ccivil\_03/\_ato2011-2014/2011/decreto/d7574.htm](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/decreto/d7574.htm)  
> 26. Lcp 227 \- Planalto, [https://www.planalto.gov.br/ccivil\_03/leis/lcp/lcp227.htm](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp227.htm)  
> 27. L10522 \- Planalto, [https://www.planalto.gov.br/ccivil\_03/leis/2002/l10522.htm](https://www.planalto.gov.br/ccivil_03/leis/2002/l10522.htm)  
> 28. Ano do ato \- Normas \- Receita Federal, [https://normas.receita.fazenda.gov.br/sijut2consulta/consulta.action?termoBusca=consulta+optante+simples+nacional](https://normas.receita.fazenda.gov.br/sijut2consulta/consulta.action?termoBusca=consulta+optante+simples+nacional)  
> 29. Ano do ato \- Normas \- Receita Federal, [https://normas.receita.fazenda.gov.br/sijut2consulta/consulta.action?termoBusca=consulta+cnpj](https://normas.receita.fazenda.gov.br/sijut2consulta/consulta.action?termoBusca=consulta+cnpj)  
> 30. [https://fazenda.pbh.gov.br/PDA/ConsultasFormais.asp?ano=2015](https://fazenda.pbh.gov.br/PDA/ConsultasFormais.asp?ano=2015)  
> 31. Termo de Exclusão do Simples Nacional \- Normas \- Receita Federal, [https://normas.receita.fazenda.gov.br/sijut2consulta/consulta.action?facetsExistentes=\&orgaosSelecionados=Cosit\&tiposAtosSelecionados=72%3B+75%3B+73\&lblTiposAtosSelecionados=SC%3B+SCI%3B+SD\&ordemColuna=Publicacao\&ordemDirecao=DESC\&tipoConsulta=formulario\&tipoAtoFacet=\&siglaOrgaoFacet=\&anoAtoFacet=\&termoBusca=%22Assunto%3A+Simples+Nacional%22\&numero\_ato=\&tipoData=2\&dt\_inicio=\&dt\_fim=\&ano\_ato=\&somente\_atos\_vigentes=on\&p=1\&optOrdem=relevancia\&p=1](https://normas.receita.fazenda.gov.br/sijut2consulta/consulta.action?facetsExistentes&orgaosSelecionados=Cosit&tiposAtosSelecionados=72;+75;+73&lblTiposAtosSelecionados=SC;+SCI;+SD&ordemColuna=Publicacao&ordemDirecao=DESC&tipoConsulta=formulario&tipoAtoFacet&siglaOrgaoFacet&anoAtoFacet&termoBusca=%22Assunto:+Simples+Nacional%22&numero_ato&tipoData=2&dt_inicio&dt_fim&ano_ato&somente_atos_vigentes=on&p=1&optOrdem=relevancia&p=1)  
> 32. SIMPLES NACIONAL, [https://admin.atendimento.receita.rs.gov.br/upload/arquivos/202508/22150110-legislacao-setorial-consolidada-ges-sn-v01.pdf](https://admin.atendimento.receita.rs.gov.br/upload/arquivos/202508/22150110-legislacao-setorial-consolidada-ges-sn-v01.pdf)  
> 33. Solução de Consulta \- Normas \- Receita Federal, [https://normas.receita.fazenda.gov.br/sijut2consulta/consulta.action?facetsExistentes=siglaOrgaoFacet%2CsiglaOrgaoFacet%2CsiglaOrgaoFacet%2CtipoAtoFacet%2CtipoAtoFacet%2CsiglaOrgaoFacet%2CsiglaOrgaoFacet\&orgaosSelecionados=\&tiposAtosSelecionados=\&lblTiposAtosSelecionados=\&ordemColuna=\&ordemDirecao=\&tipoAtoFacet=\&siglaOrgaoFacet=Cosit\&anoAtoFacet=\&termoBusca=Microempresas\&numero\_ato=\&tipoData=2\&dt\_inicio=\&dt\_fim=\&ano\_ato=\&optOrdem=relevancia](https://normas.receita.fazenda.gov.br/sijut2consulta/consulta.action?facetsExistentes=siglaOrgaoFacet,siglaOrgaoFacet,siglaOrgaoFacet,tipoAtoFacet,tipoAtoFacet,siglaOrgaoFacet,siglaOrgaoFacet&orgaosSelecionados&tiposAtosSelecionados&lblTiposAtosSelecionados&ordemColuna&ordemDirecao&tipoAtoFacet&siglaOrgaoFacet=Cosit&anoAtoFacet&termoBusca=Microempresas&numero_ato&tipoData=2&dt_inicio&dt_fim&ano_ato&optOrdem=relevancia)  
> 34. Ano do ato \- Normas \- Receita Federal, [https://normas.receita.fazenda.gov.br/sijut2consulta/consulta.action?facetsExistentes=tipoAtoFacet%2CtipoAtoFacet%2CtipoAtoFacet%2CtipoAtoFacet%2CanoAtoFacet%2CtipoAtoFacet%2CsiglaOrgaoFacet%2CsiglaOrgaoFacet%2CtipoAtoFacet%2CtipoAtoFacet%2CsiglaOrgaoFacet%2CanoAtoFacet%2CanoAtoFacet%2CanoAtoFacet%2CtipoAtoFacet%2CtipoAtoFacet%2CtipoAtoFacet%2CsiglaOrgaoFacet%2CanoAtoFacet\&orgaosSelecionados=\&tiposAtosSelecionados=\&lblTiposAtosSelecionados=\&ordemColuna=\&ordemDirecao=\&tipoAtoFacet=\&siglaOrgaoFacet=Cosit\&anoAtoFacet=\&termoBusca=CONSULTA\&numero\_ato=\&tipoData=2\&dt\_inicio=\&dt\_fim=\&ano\_ato=\&optOrdem=relevancia](https://normas.receita.fazenda.gov.br/sijut2consulta/consulta.action?facetsExistentes=tipoAtoFacet,tipoAtoFacet,tipoAtoFacet,tipoAtoFacet,anoAtoFacet,tipoAtoFacet,siglaOrgaoFacet,siglaOrgaoFacet,tipoAtoFacet,tipoAtoFacet,siglaOrgaoFacet,anoAtoFacet,anoAtoFacet,anoAtoFacet,tipoAtoFacet,tipoAtoFacet,tipoAtoFacet,siglaOrgaoFacet,anoAtoFacet&orgaosSelecionados&tiposAtosSelecionados&lblTiposAtosSelecionados&ordemColuna&ordemDirecao&tipoAtoFacet&siglaOrgaoFacet=Cosit&anoAtoFacet&termoBusca=CONSULTA&numero_ato&tipoData=2&dt_inicio&dt_fim&ano_ato&optOrdem=relevancia)  
> 35. Solução de Consulta \- Normas \- Receita Federal, [https://normas.receita.fazenda.gov.br/sijut2consulta/consulta.action?termoBusca=LC+123%2F2006\&tipoData=2](https://normas.receita.fazenda.gov.br/sijut2consulta/consulta.action?termoBusca=LC+123/2006&tipoData=2)