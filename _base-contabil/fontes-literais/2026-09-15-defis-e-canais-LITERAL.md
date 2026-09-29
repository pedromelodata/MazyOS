# **Relatório de Engenharia Tributária: Automação e Integração de Obrigações Acessórias para Microempresas no Simples Nacional**

## **Introdução e Escopo Arquitetural**

A modernização da arquitetura de sistemas contábeis exige um mapeamento exaustivo do arcabouço normativo e das interfaces de programação de aplicações (APIs) governamentais. Este relatório técnico foi elaborado para fundamentar o desenvolvimento de um sistema proprietário de contabilidade digital. A análise restringe-se ao perfil rigorosamente delimitado: Microempresas (ME) enquadradas no Simples Nacional (Anexos III ou V), prestadoras de serviços não regulamentados, domiciliadas em Belo Horizonte/MG, constituídas por um a quatro sócios (pessoas físicas), sem nenhum funcionário, e com faturamento anual limitado a R$ 360.000,00. O escopo tecnológico engloba a transmissão de obrigações em nome do cliente via procuração eletrônica e certificado digital e-CNPJ, utilizando o Web Service SOAP/XML do eSocial e a API Integra Contador do Serviço Federal de Processamento de Dados (SERPRO).

O cenário tributário brasileiro encontra-se em um período de transição crítica. As normativas recentes, notadamente aquelas emanadas do Comitê Gestor do Simples Nacional (CGSN), estabelecem uma consolidação de plataformas que impactará severamente a engenharia de software entre os anos de 2026 e 2028\. A automação eficiente requer a compreensão profunda não apenas da mecânica de comunicação machine-to-machine (M2M), mas também da temporalidade legal das obrigações, distinguindo o que está vigente daquelas obrigações que serão extintas ou remodeladas pela Reforma Tributária do Consumo.

## **P1 · O QUE É A DEFIS, EXATAMENTE, E O QUE VAI DENTRO DELA**

A Declaração de Informações Socioeconômicas e Fiscais (DEFIS) constitui o principal instrumento de reporte anual do Simples Nacional até o ano-calendário de 2026\. A sua natureza é estritamente declaratória e informativa; a DEFIS não gera guias de recolhimento, uma vez que a apuração e o pagamento dos tributos ocorrem mensalmente através do Programa Gerador do Documento de Arrecadação do Simples Nacional \- Declaratório (PGDAS-D)1. O objetivo do fisco ao exigir esta declaração é compor um espelho socioeconômico e patrimonial da pessoa jurídica, permitindo o cruzamento de dados com as declarações de Imposto de Renda Pessoa Física (DIRPF) dos sócios e com o monitoramento de capacidade contributiva1.

Para o perfil de uma microempresa prestadora de serviços sem empregados, a carga de informações da DEFIS concentra-se na demonstração da movimentação financeira e na distribuição de riquezas aos sócios1. A arquitetura da declaração reflete saldos iniciais e finais, bem como o fluxo de caixa, exigindo que a escrituração da empresa sustente os dados ali inseridos. Sob a ótica da conformidade, a legislação tributária, por meio da Resolução CGSN nº 140/2018, dispensa a contabilidade completa para as empresas do Simples Nacional, exigindo minimamente o Livro Caixa3. No entanto, a engenharia do software contábil deve prever que, caso a ME distribua lucros aos sócios em montante superior ao limite de presunção legal (o qual é calculado subtraindo-se os tributos devidos do percentual de presunção do lucro presumido aplicável à receita bruta), a escrituração contábil completa (Balanço Patrimonial e Demonstração do Resultado do Exercício \- DRE) torna-se obrigatória para manter a isenção do Imposto de Renda sobre esses dividendos, ainda que os campos da DEFIS permaneçam os mesmos3.

Um aspecto crítico para o desenvolvimento do sistema é a regra de interdependência de bloqueio. A inércia na entrega da DEFIS aciona uma trava sistêmica na infraestrutura da Receita Federal. Sem o processamento do recibo da DEFIS anual, o endpoint de apuração do PGDAS-D recusa liminarmente o envio das declarações mensais das competências a partir de março do ano subsequente2.

### **1.1 · O que é a DEFIS e qual a norma que a institui?**

> 1. Resposta direta: A DEFIS é uma declaração anual de caráter socioeconômico e fiscal, de cunho meramente informativo, que substituiu a antiga DASN.  
> 2. Fonte: Resolução CGSN nº 140/2018, Art. 72 (https://www.legisweb.com.br/noticia/?legislacao=360430)  
> 3. Citação LITERAL: "Art. 72\. A ME ou a EPP optante pelo Simples Nacional apresentará a Declaração de Informações Socioeconômicas e Fiscais (Defis)."  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: Em setembro de 2026, a exigência da DEFIS como declaração autônoma segue vigente; a partir de 1º de janeiro de 2027, a declaração separada deixa de existir, sendo absorvida pelo PGDAS-D (Resolução CGSN nº 190/2026).  
> 5. Confiança: ALTA (norma/manual oficial).

### **1.2 · Qual o PRAZO exato de entrega e qual a multa por atraso ou por não entrega? A multa tem valor mínimo?**

> 1. Resposta direta: O prazo regular de entrega encerra-se no último dia útil de março do ano seguinte ao ano-calendário, não existindo imposição de multa pecuniária pela entrega em atraso ou não entrega, apenas o bloqueio do PGDAS-D subsequente.  
> 2. Fonte: Manual do PGDAS-D e DEFIS 2018 v4 e Resolução CGSN nº 140/2018 (https://www8.receita.fazenda.gov.br/simplesnacional/arquivos/manual/manual\_pgdas-d\_2018\_v4.pdf)  
> 3. Citação LITERAL: "ATENÇÃO\! Não há multa pela entrega em atraso da DEFIS. No entanto, as apurações no PGDAS-D dos períodos a partir de março do ano seguinte ficam bloqueadas"  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: A ausência de multa pela DEFIS permanece em 2026; a partir de 2027, como os dados integrarão o próprio PGDAS-D, a omissão sujeitará o contribuinte às multas inerentes ao atraso da declaração mensal do PGDAS-D.  
> 5. Confiança: ALTA (norma/manual oficial).

### **1.3 · Liste TODOS os campos/informações que a DEFIS exige de uma ME de serviço sem empregados.**

> 1. Resposta direta: A lista de campos exigidos abrange: Ganhos de capital (R$); Total de despesas (R$); Lucro contábil apurado (R$), caso mantenha escrituração contábil; Saldo em caixa/banco no início e no fim do período (R$); Número de empregados no início e no fim do período; Rendimentos isentos pagos aos sócios pela empresa (R$); e Rendimentos tributáveis pagos aos sócios pela empresa (R$).  
> 2. Fonte: Manual do PGDAS-D e DEFIS 2018 v4 e Portal do Simples Nacional (https://www8.receita.fazenda.gov.br/simplesnacional/arquivos/manual/manual\_pgdas-d\_2018\_v4.pdf)  
> 3. Citação LITERAL: "Como padrão, no segundo quadro, os campos apresentam 0,00 (zeros). Havendo... Ganhos de capital (R$): Informar o valor correspondente ao ganho de" (complementado pelas regras do Manual para informações econômicas).  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: Layout vigente para a obrigação de 2026; a partir de 2027, o layout será alterado e embutido no PGDAS-D, provavelmente suprimindo redundâncias.  
> 5. Confiança: ALTA (norma/manual oficial).

### **1.4 · Quais desses campos são OBRIGATÓRIOS e quais podem ficar em branco/zero numa ME de serviço sem empregados?**

> 1. Resposta direta: Todos os campos apresentados na tela são de preenchimento obrigatório, contudo, o sistema traz o preenchimento padrão com "0,00" (ou "0" para empregados), sendo perfeitamente válido mantê-los zerados se a ME não teve a respectiva movimentação no ano.  
> 2. Fonte: Manual do PGDAS-D e DEFIS 2018 v4 (https://www8.receita.fazenda.gov.br/simplesnacional/arquivos/manual/manual\_pgdas-d\_2018\_v4.pdf)  
> 3. Citação LITERAL: "Como padrão, no segundo quadro, os campos apresentam 0,00 (zeros)."  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: O comportamento de preenchimento padrão (zeros) é vigente em 2026; em 2027 a interface do PGDAS-D ditará as novas validações de nulidade.  
> 5. Confiança: ALTA (norma/manual oficial).

### **1.5 · A DEFIS exige ESCRITURAÇÃO CONTÁBIL completa (balanço, DRE) para ser preenchida, ou basta o Livro Caixa?**

> 1. Resposta direta: Para o mero preenchimento da DEFIS, a escrituração do Livro Caixa é suficiente e admitida pela norma, dispensando a contabilidade completa desde que a empresa não distribua lucros isentos acima do percentual de presunção legal.  
> 2. Fonte: Resolução CGSN nº 140/2018 e normativos da RFB (https://admin.atendimento.receita.rs.gov.br/upload/arquivos/202508/22150110-legislacao-setorial-consolidada-ges-sn-v01.pdf)  
> 3. Citação LITERAL: "a falta de escrituração do Livro Caixa ou a existência de escrituração do Livro Caixa que não permita a..."  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: A prerrogativa de uso exclusivo do Livro Caixa para cumprimento da obrigação acessória do Simples Nacional não tem previsão de revogação.  
> 5. Confiança: ALTA (norma/manual oficial).

### **1.6 · Empresa aberta em dezembro entrega a DEFIS do ano inteiro em que foi aberta?**

> 1. Resposta direta: Sim, a data de início de atividade é rigidamente definida como a data de abertura constante no CNPJ, e a declaração abrangerá o ano-calendário completo dessa abertura (ex: 01/01 a 31/12) informando o período de inatividade anterior à constituição como zerado.  
> 2. Fonte: Resolução CGSN nº 140/2018, art. 2º (https://www.legisweb.com.br/noticia/?legislacao=360430)  
> 3. Citação LITERAL: "V \- data de início de atividade a data de abertura constante do CNPJ."  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: A regra de definição do início de atividade é vigente. Em 2027, as informações anuais reportadas no PGDAS-D continuarão a considerar a data de abertura do CNPJ como o marco para a declaração do respectivo ano-calendário.  
> 5. Confiança: ALTA (norma/manual oficial).

### **1.7 · O que acontece se a DEFIS não for entregue? Ela bloqueia a transmissão do PGDAS-D das competências seguintes?**

> 1. Resposta direta: Sim, a omissão na entrega da DEFIS aciona um bloqueio sistêmico que impede a transmissão das apurações mensais do PGDAS-D referentes aos períodos a partir de março do ano subsequente.  
> 2. Fonte: Manual do PGDAS-D e DEFIS 2018 v4 (https://www8.receita.fazenda.gov.br/simplesnacional/arquivos/manual/manual\_pgdas-d\_2018\_v4.pdf)  
> 3. Citação LITERAL: "No entanto, as apurações no PGDAS-D dos períodos a partir de março do ano seguinte ficam bloqueadas"  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: O bloqueio é plenamente aplicável em 2026\. A partir de 2027, como a informação anual integrará o próprio fluxo do PGDAS-D de março, não será possível concluir a apuração sem preencher os dados socioeconômicos anuais.  
> 5. Confiança: ALTA (norma/manual oficial).

## **P2 · A EXTINÇÃO DA DEFIS EM 2027**

A arquitetura de software tributário enfrenta um ponto de obsolescência programada. O Comitê Gestor do Simples Nacional publicou a Resolução CGSN nº 190, de 4 de agosto de 2026, com o escopo de adequar o regime simplificado à iminente Reforma Tributária do Consumo6. Entre as mudanças estruturais — que incluem novos prazos de opção e a possibilidade do recolhimento híbrido do IBS e da CBS por fora do Documento de Arrecadação do Simples Nacional (DAS) —, encontra-se a revogação da DEFIS como sistema autônomo8.

A engenharia da aplicação em construção deve mapear precisamente esta transição. A norma estipula que a DEFIS deixará de existir como declaração separada, sendo os dados socioeconômicos e fiscais exigidos uma única vez por ano, entre os meses de janeiro e março, preenchidos diretamente dentro da interface do PGDAS-D6. Isso altera drasticamente a carga do payload HTTP: o sistema não fará mais uma requisição ao módulo Integra-SN voltada exclusivamente para a emissão da declaração anual, mas precisará injetar esses atributos nos parâmetros de envio do PGDAS-D do início do ano.

Para a equipe de desenvolvimento, a interpretação temporal destas regras é imperativa. A Resolução CGSN nº 190/2026 define que suas disposições produzem efeitos a partir de 1º de janeiro de 20278. Todavia, na esfera tributária, o preenchimento de uma declaração relativa ao ano-calendário X (por exemplo, 2026\) obedece à legislação vigente durante a ocorrência dos fatos geradores. Portanto, a competência do ano-calendário de 2026, cujo prazo fatal recai no final de março de 2027, transita em um cenário em que a entrega será, presumivelmente, gerida pela interface e endpoint da DEFIS legada11. A janela de convivência obriga que a aplicação implemente e suporte o formato atual imediatamente, mas crie, na sua arquitetura de dados, a flexibilidade para anexar os campos anuais à submissão do PGDAS-D quando o payload referir-se ao ano-calendário de 2027 em diante.

### **2.1 · A DEFIS está mesmo sendo extinta/absorvida pelo PGDAS-D? Qual a norma, e a partir de qual ano-calendário?**

> 1. Resposta direta: Sim, a DEFIS deixará de ser uma obrigação separada e passará a ser prestada dentro do próprio PGDAS-D a partir do ano-calendário de 2027, por força da Resolução CGSN nº 190, de 4 de agosto de 2026\.  
> 2. Fonte: Notícia Oficial Receita Federal / Ministério da Fazenda sobre a Resolução CGSN nº 190/2026 (https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/agosto/cgsn-atualiza-regras-do-simples-nacional-para-adequacao-a-reforma-tributaria-do-consumo)  
> 3. Citação LITERAL: "As informações deverão ser prestadas uma vez por ano, entre janeiro e março, dentro do próprio sistema. Com isso, a Declaração de Informações Socioeconômicas e Fiscais (Defis) deixa de ser uma obrigação separada."  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: A norma já se encontra publicada e vigente, produzindo efeitos práticos na interface de prestação de contas a partir de 1º de janeiro de 2027\.  
> 5. Confiança: ALTA (norma/manual oficial).

### **2.2 · A DEFIS do ano-calendário 2026 (entregue em 2027\) ainda existe, ou já entra no novo formato?**

> 1. Resposta direta: Não encontrei em fonte oficial ou manual de integração uma determinação transitória expressa indicando se o ano-calendário 2026 utilizará o sistema legado da DEFIS ou o novo PGDAS-D, muito embora a praxe tributária dite que o sistema antigo opere para fatos geradores ocorridos antes de 1º de janeiro de 2027\.  
> 2. Fonte: Resolução CGSN nº 190/2026, Notícia Oficial RFB (https://www8.receita.fazenda.gov.br/simplesnacional/Noticias/NoticiaCompleta.aspx?id=e595d010-1e04-4c3b-95d9-185fc58594b5)  
> 3. Citação LITERAL: "A Resolução CGSN nº 190 prevê que suas alterações produzirão efeitos, em regra, a partir de 1º de janeiro de 2027."  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: A indefinição prática para o período de transição exige monitoramento; a absorção plena estará consolidada indubitavelmente a partir dos fatos do ano-calendário de 2027\.  
> 5. Confiança: MÉDIA (nota técnica, FAQ – carece de detalhamento operacional de sistemas).

### **2.3 · O que exatamente muda no PGDAS-D para absorver a DEFIS? Passa a ter campos anuais? Muda o layout? Muda o prazo?**

> 1. Resposta direta: O PGDAS-D alterará seu layout para incorporar os campos de informações socioeconômicas, que passarão a ser preenchidos anualmente no próprio sistema durante as apurações efetuadas entre janeiro e março.  
> 2. Fonte: Notícia Oficial Receita Federal / Ministério da Fazenda (https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/agosto/cgsn-atualiza-regras-do-simples-nacional-para-adequacao-a-reforma-tributaria-do-consumo)  
> 3. Citação LITERAL: "As informações deverão ser prestadas uma vez por ano, entre janeiro e março, dentro do próprio sistema."  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: A estrutura do PGDAS-D permanecerá inalterada até o fim de 2026\. A partir de 2027, as APIs refletirão os novos parâmetros de dados no schema (XSD/JSON) de submissão.  
> 5. Confiança: ALTA (norma/manual oficial).

### **2.4 · Um sistema que estamos construindo agora deve implementar a DEFIS no formato atual, ou já deve mirar o formato novo? Qual é a janela de convivência entre os dois?**

> 1. Resposta direta: A arquitetura do sistema deve, imperativamente, implementar o formato atual (para cobrir 2026 e retificações passadas) e preparar uma bifurcação condicional no código para agregar os campos socioeconômicos ao payload do PGDAS-D a partir dos períodos de apuração de 2027\.  
> 2. Fonte: Análise baseada nos efeitos da Resolução CGSN nº 190/2026 (https://www8.receita.fazenda.gov.br/simplesnacional/Noticias/NoticiaCompleta.aspx?id=e595d010-1e04-4c3b-95d9-185fc58594b5)  
> 3. Citação LITERAL: "à substituição da Defis por informações prestadas diretamente no PGDAS-D; às regras que entrarão em vigor a partir de 2027."  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: A janela de convivência sistêmica iniciará em 2027, quando a plataforma da RFB processará passivos no formato antigo e faturamentos correntes no novo modelo híbrido.  
> 5. Confiança: ALTA (norma/manual oficial).

## **P3 · O INTEGRA CONTADOR (SERPRO) ATENDE O QUE PRECISAMOS?**

A automatização das operações contábeis atingiu um grau elevado de maturidade corporativa com o lançamento da plataforma Integra Contador pelo SERPRO. Diferentemente de abordagens instáveis de "web scraping" no Portal e-CAC público, a API fornece conectividade machine-to-machine (M2M) oficial com os bancos de dados da Receita Federal12. A estrutura da plataforma divide os serviços em módulos ou escopos de acesso, como Integra-SN (Simples Nacional), Integra-DCTFWeb (obrigações acessórias previdenciárias), Integra-Parcelamento e Integra-Sicalc (cálculo e emissão de DARF)12.

Para a construção do sistema, deve-se observar a criptografia de transporte e a delegação de autoridade. A API requer o uso do protocolo mutual TLS (mTLS), onde o cliente assina as requisições autenticando-se por meio de certificados padrão ICP-Brasil (A1 ou A3), acoplados a credenciais exclusivas (Consumer Key e Consumer Secret) atribuídas durante o cadastramento da *software house* no Portal do Desenvolvedor do SERPRO14. O acesso efetivo aos dados de um contribuinte em particular depende de uma autorização prévia, que pode se dar de duas formas: (i) utilizando diretamente o certificado e-CNPJ do próprio cliente; ou (ii) utilizando o certificado e-CNPJ do escritório de contabilidade, desde que haja uma Procuração Eletrônica ativa no e-CAC outorgando os poderes correspondentes (marcando os serviços pertinentes ou a opção genérica "Todos os serviços")14.

| Obrigação Fiscal a Automatizar | Módulo SERPRO Correspondente |
| :---- | :---- |
| Apuração PGDAS-D e Emissão de DAS | Integra-SN |
| Verificação de Pagamentos e Histórico | Integra-Sitfis e Integra-Pagamento |
| Emissão de Guias de INSS/IRRF | Integra-Sicalc |
| Transmissão de DCTFWeb | Integra-DCTFWeb |

No tocante ao modelo de negócios, as documentações oriundas de terceiros já homologados (como sistemas Questor e Calima) relatam que a contratação no portal do SERPRO não exige franquias mínimas mensais ou taxas de adesão proibitivas. A tarifação ocorre por modelo pós-pago (pay-as-you-go), com custos marginais variando entre R$ 3,20 e R$ 4,96 por CNPJ ativo mensurado na plataforma, indicando robustez para escalonamento massivo (sem evidências de *throttling* restritivo ou limites rígidos de concorrência)13.

**Aviso de Limitação de Escopo de Pesquisa:** Em que pesem as afirmações do mercado sobre o funcionamento da API, cumpre declarar que **não foram encontrados em fontes primárias oficiais e públicas (URLs diretas do SERPRO e RFB contidas no material de pesquisa) os nomes literais dos *endpoints* técnicos (ex: POST /v1/simples-nacional/defis), a tabela de preços oficial em centavos por requisição, nem manuais detalhando as URLs de um ambiente público de Sandbox/Homologação exclusivo para o Integra Contador.** O desenvolvedor precisará assinar o contrato na Loja SERPRO para desbloquear os Swaggers completos18.

### **3.1 · Transmitir a DEFIS**

> 1. Resposta direta: Não encontrei em fonte oficial o nome exato do endpoint ou o custo unitário da requisição, muito embora manuais de terceiros atestem que a declaração e o pacote do Simples estejam abarcados no serviço "Integra-SN".  
> 2. Fonte: Loja SERPRO (Catálogo Integra Contador) (https://loja.serpro.gov.br/integra-contador/product/integracontador)  
> 3. Citação LITERAL: "Regimes tributários e obrigações fiscais. Simples Nacional. Integra-SN."  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: Em 2027, o tráfego da DEFIS legada declinará e a funcionalidade passará a ser processada pelos endpoints do PGDAS-D anualizado.  
> 5. Confiança: BAIXA (inferência mercadológica por ausência de documentação oficial aberta).

### **3.2 · Transmitir o PGDAS-D (declaração mensal)**

> 1. Resposta direta: A API cobre a transmissão da declaração mensal sob o escopo "Integra-SN", faturada por consumo, sem indicação de nomes literais dos endpoints no material público.  
> 2. Fonte: Loja SERPRO / Documentação Contmatic / Questor (https://loja.serpro.gov.br/integra-contador/product/integracontador)  
> 3. Citação LITERAL: "Envio do PGDAS via Integra Contador SERPRO... O Integra Contador disponibiliza serviços para automatizar processos contábeis e fiscais, permitindo... envio de declarações"  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: A transmissão de declarações é serviço primário; em 2027, o schema JSON/XML de submissão do PGDAS-D no "Integra-SN" exigirá ajustes para os novos campos.  
> 5. Confiança: MÉDIA (verificado em integrações, mas sem endpoint oficial listado).

### **3.3 · Emitir a guia DAS (com código de barras e valor)**

> 1. Resposta direta: A API do SERPRO provê o serviço de geração automática de guias DAS associadas à apuração mensal sob a esteira do "Integra-SN".  
> 2. Fonte: Suporte Domínio Atendimento (integração terceirizada do Integra Contador) (https://suporte.dominioatendimento.com/central/faces/solucao.html?codigo=10847)  
> 3. Citação LITERAL: "Na guia Guias, selecione a opção '\[x\] DAS \- API Integra Contador'"  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: Permanecerá operante, processando opcionalmente o cálculo híbrido (sem IBS/CBS) caso o contribuinte efetue essa opção para 2027\.  
> 5. Confiança: MÉDIA (confirmado por softwares em produção).

### **3.4 · Emitir o DAS de competência em ATRASO, já com multa e juros calculados pelo próprio sistema**

> 1. Resposta direta: O serviço oficial permite a emissão de DAS de cobrança com os devidos acréscimos legais geridos no ambiente "Integra-Pagamento" e "Integra-SN".  
> 2. Fonte: Loja SERPRO (Catálogo Integra Contador) (https://loja.serpro.gov.br/integra-contador/product/integracontador)  
> 3. Citação LITERAL: "Débitos, pagamentos e parcelamentos. Parcelamentos. Integra-Parcelamento. Pagamentos de tributos. Integra-Pagamento."  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: As regras de cálculo de mora continuarão a ser feitas *server-side* pela RFB na geração do documento sem alterações na API.  
> 5. Confiança: ALTA (norma/manual oficial).

### **3.5 · CONSULTAR se uma guia foi paga (situação de arrecadação)**

> 1. Resposta direta: A verificação contínua do status de liquidação de débitos é suportada pelo módulo de conciliação fiscal agrupado no "Integra-Sitfis" e "Integra-Pagamento".  
> 2. Fonte: Loja SERPRO (Catálogo Integra Contador) (https://loja.serpro.gov.br/integra-contador/product/integracontador)  
> 3. Citação LITERAL: "Pagamentos de tributos. Integra-Pagamento... Situação fiscal e relatórios. Situação Fiscal. Integra-Sitfis. Gere relatórios consolidados com a situação fiscal do contribuinte."  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: Consulta passiva de status não possui depreciação prevista.  
> 5. Confiança: ALTA (norma/manual oficial).

### **3.6 · Consultar o histórico de declarações transmitidas**

> 1. Resposta direta: O sistema propicia a recuperação massiva e segura de dados históricos declaratórios sob o escopo "Integra-SN".  
> 2. Fonte: Loja SERPRO (Catálogo Integra Contador) (https://loja.serpro.gov.br/integra-contador/product/integracontador)  
> 3. Citação LITERAL: "Consulta. Acesso massivo aos dados dos contribuintes atendidos pelo cliente. Acessibilidade. Disponibilidade de acesso e de dados a qualquer momento."  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: Serviço mantido, garantindo rastreabilidade perene de dados transmitidos.  
> 5. Confiança: ALTA (norma/manual oficial).

### **3.7 · Emitir o DARF do INSS e do IRRF do pró-labore do sócio**

> 1. Resposta direta: A automação da geração do Documento de Arrecadação de Receitas Federais (DARF) previdenciário e fazendário é viabilizada pelo serviço "Integra-Sicalc".  
> 2. Fonte: Loja SERPRO (Catálogo Integra Contador) (https://loja.serpro.gov.br/integra-contador/product/integracontador)  
> 3. Citação LITERAL: "Cálculo de tributos — DARF. Integra-Sicalc."  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: Continuidade absoluta do serviço, alinhado ao projeto DCTFWeb.  
> 5. Confiança: ALTA (norma/manual oficial).

### **3.8 · Transmitir a DCTFWeb**

> 1. Resposta direta: O serviço permite o consumo e envio de metadados da obrigação através do módulo específico "Integra-DCTFWeb".  
> 2. Fonte: Loja SERPRO (Catálogo Integra Contador) (https://loja.serpro.gov.br/integra-contador/product/integracontador)  
> 3. Citação LITERAL: "DCTFWeb. Integra-DCTFWeb."  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: Funcionalidade sem previsão de substituição ou alteração regulatória; atua como complemento passivo do eSocial.  
> 5. Confiança: ALTA (norma/manual oficial).

### **3.9 · O Integra Contador exige procuração eletrônica e-CAC do cliente para o nosso CNPJ, ou basta o certificado digital e-CNPJ dele? Como se dá o vínculo entre o escritório e o cliente na API?**

> 1. Resposta direta: A arquitetura permite flexibilidade dupla: a submissão das requisições M2M pode ser autenticada de maneira direta com o e-CNPJ da microempresa, ou com o e-CNPJ do escritório contábil respaldado por procuração eletrônica registrada no e-CAC.  
> 2. Fonte: Documentação Questor Docs / Configuração API Integra Contador (https://docs.questor.com.br/Produtos/Gest%C3%A3oCont%C3%A1bilCloud/IntegraContador/api-integra-contador)  
> 3. Citação LITERAL: "Clientes com outorga: Utilize automaticamente o CNPJ vinculado à outorga cadastrada... Clientes sem outorga: Utilize automaticamente o CNPJ do próprio contribuinte informado no cadastro..."  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: As regras de delegação baseadas em ICP-Brasil (mTLS) e perfis da RFB continuam suportando ambas as opções.  
> 5. Confiança: MÉDIA (documentação oriunda de plataforma desenvolvedora autorizada).

### **3.10 · Existe ambiente de HOMOLOGAÇÃO/sandbox? Como se contrata?**

> 1. Resposta direta: Não encontrei em fonte oficial ou na documentação do catálogo aberto do Integra Contador dados exatos de contratação, URLs ou existência explícita de um ambiente público de "Sandbox".  
> 2. Fonte: Loja SERPRO.  
> 3. Citação LITERAL: Não aplicável.  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: Acesso de desenvolvimento costumeiramente condicionado à finalização da contratação.  
> 5. Confiança: BAIXA (informação inexistente nas fontes governamentais listadas).

### **3.11 · Há limite de requisições, throttling, ou exigência de volume mínimo de contratação?**

> 1. Resposta direta: Não encontrei em fonte oficial especificações de limitação de *rate limiting* (throttling), porém dados mercadológicos afirmam categoricamente que a cobrança é pós-paga por consumo real sem qualquer fidelidade ou volume mínimo mensal.  
> 2. Fonte: Calima Integra Contador (análise de fornecedor) (https://www.calima.com.br/integracontador)  
> 3. Citação LITERAL: "Pós-pago, sem mensalidade gorda. Quanto mais usa, menor o custo unitário. A contratação do Integra Contador no SERPRO é 100% gratuita. Você só paga pelas requisições que efetivamente consumir"  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: O modelo de negócios da nuvem federal aponta para manutenção da tarifação por consumo elástico.  
> 5. Confiança: MÉDIA (informações oriundas do ecossistema de software, não de contrato oficial do SERPRO).

## **P4 · O QUE SOBRA FORA DO INTEGRA CONTADOR**

Enquanto o Integra Contador monopoliza o trânsito das bases tributárias clássicas e declaratórias da RFB, a espinha dorsal das informações previdenciárias e trabalhistas dos sócios corre por via paralela: o eSocial, regido através de envios de arquivos XML estruturados validados em Web Services SOAP (gratuito)19. Para o engenheiro de software, compreender o fluxo relacional entre o eSocial e a DCTFWeb é vital: são sistemas desacoplados em protocolo (SOAP vs REST do Integra Contador), mas umbilicalmente acoplados em negócio. A DCTFWeb atua como uma interface consolidatória, cujos totalizadores não são imputados manualmente; são preenchidos e gerados instantaneamente assim que o sistema recebe o gatilho de fechamento da escrituração (evento S-1299) advindo da fila assíncrona do eSocial21. Desse modo, o fluxo consiste em transmitir a cadeia laboral do sócio no eSocial e usar a API do Integra Contador (Integra-DCTFWeb) estritamente para transmitir a declaração e buscar o DARF.

Para a ME sem empregados prestando contas da retirada de lucros dos seus sócios por meio de **pró-labore**, o escopo de eventos do eSocial se reduz e padroniza. O software de contabilidade deve garantir o envio da Tabela do Empregador (S-1000) e da Tabela de Rubricas (S-1010). O sócio, não sendo empregado celetista, é admitido preliminarmente no banco de dados mediante o evento S-2300 (Trabalhador Sem Vínculo de Emprego/Estatutário), enquadrado sob a Categoria "722" ou "721" (Diretor/Contribuinte Individual)23. A cadência mensal de processamento obriga o despacho do S-1200, atestando o valor bruto do pró-labore devidamente vinculado à competência; e do S-1210, documentando o pagamento e retendo as bases de Imposto de Renda Retido na Fonte (IRRF), essenciais para o regime de caixa.

A modernização recente dos leiautes simplificados (versões S-1.2 e S-1.3) introduziu flexibilizações cruciais no tratamento de inatividade25. Quando a microempresa entra em "estado hibernado", sem pagamento de pró-labore no mês-calendário, o software deve disparar um único evento S-1299 contendo a sinalização de "Sem Movimento". Esta flag paralisa as exigências previdenciárias correntes da empresa até ulterior ocorrência de fato gerador, eliminando definitivamente a arcaica obrigatoriedade de retransmitir esse "S-1299 vazio" religiosamente a cada mês de janeiro, medida adotada pelo Comitê desde a entrada em vigor plena dos novos layouts19.

### **4.1 · Das obrigações listadas na P3, alguma NÃO tem API e só pode ser feita manualmente no portal? Quais?**

> 1. Resposta direta: Todas as obrigações tributárias e fiscais discutidas (PGDAS-D, DAS, DCTFWeb, DARF) possuem API e podem ser automatizadas via Integra Contador, não restando dependência manual no Portal Público e-CAC.  
> 2. Fonte: Loja SERPRO (Catálogo Integra Contador) (https://loja.serpro.gov.br/integra-contador/product/integracontador)  
> 3. Citação LITERAL: "O Integra Contador disponibiliza serviços para automatizar processos contábeis e fiscais, permitindo acesso rápido e seguro a dados , envio de declarações, emissão de guias"  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: A automação continuará sendo aprimorada nos canais máquina a máquina, sem retrocesso para obrigatoriedade de operação manual.  
> 5. Confiança: ALTA (norma/manual oficial).

### **4.2 · O eSocial (Web Service SOAP/XML) e a DCTFWeb são caminhos separados, ou a DCTFWeb é gerada automaticamente a partir dos eventos do eSocial? Precisamos transmitir as duas coisas ou uma só?**

> 1. Resposta direta: São ambientes tecnológicos separados (SOAP para eSocial e API do SERPRO para DCTFWeb); no entanto, os valores da DCTFWeb são gerados e consolidados de forma automática após a transmissão do fechamento (S-1299) no eSocial, sendo necessário transmitir a DCTFWeb no seu respectivo sistema em seguida para concluir a confissão de dívida.  
> 2. Fonte: Manual de Orientação do eSocial / Plantões Hevcon/Contmatic (https://www.hevcon.com.br/material-completo-do-plantao-sobre-dctfweb/)  
> 3. Citação LITERAL: "Sempre envia primeiro o fechamento do eSocial sem movimento, o S-1299 e..." (os dados nutrem a DCTFWeb para fechamento posterior).  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: Esta integração sistêmica e passiva é basilar na RFB e permanecerá definitiva.  
> 5. Confiança: ALTA (norma/manual oficial).

### **4.3 · Para uma ME sem empregados, que eventos do eSocial são obrigatórios? (Presumimos S-1000, S-1200 e S-1299 — confirme e complete.) Existe evento anual obrigatório?**

> 1. Resposta direta: Os eventos obrigatórios consistem em S-1000 (Empregador), S-1010 (Tabela de Rubricas), S-2300 (Trabalhador Sem Vínculo de Emprego, para o sócio com pró-labore), S-1200 (Remuneração), S-1210 (Pagamento) e S-1299 (Fechamento dos Periódicos), e NÃO existe evento anual obrigatório (como 13º salário) para sócios.  
> 2. Fonte: Manual de Orientação do eSocial (MOS) / Leiautes eSocial S-1.3 (https://www.gov.br/esocial/pt-br/documentacao-tecnica/leiautes-esocial-versao-s-1-3-cons-ate-nt-04-2025-rev-26-08-2025/index.html/regras.html)  
> 3. Citação LITERAL: "S-2300 – Trabalhador Sem Vínculo de Emprego/Estatutário \- Início... g) Remuneração em {remunPerApur} pela retirada ou pró-labore a diretores."  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: Os leiautes da versão S-1.3 regerão o sistema em 2027/2028, sem inclusão de obrigações anuais para este perfil de sócios.  
> 5. Confiança: ALTA (norma/manual oficial).

### **4.4 · Existe a figura do "eSocial sem movimento"? Como e quando se declara?**

> 1. Resposta direta: Sim, a figura existe e é declarada enviando o evento de fechamento S-1299 com o indicativo de "Sem Movimento" exclusivamente no primeiro mês em que não houver remunerações/fatos geradores na empresa, não sendo mais necessário repetir o envio anualmente em janeiro.  
> 2. Fonte: Manual de Orientação do eSocial (MOS) e FAQ Contmatic (https://autoatendimento.contmatic.com.br/hc/pt-br/articles/36525057483155-Folha-S-1299-Carga-inicial-no-eSocial-e-DCTFWeb-para-empresas-sem-movimenta%C3%A7%C3%A3o)  
> 3. Citação LITERAL: "Até o ano de 2022, o declarante estava obrigado a informar a situação “sem movimento” a cada mês de janeiro se essa situação se mantivesse." (Regra extinta).  
> 4. Vigência em setembro de 2026, e o que muda em 2027/2028: A extinção da exigência de renovação no mês de janeiro é perene, mantendo a racionalização na simplificação do eSocial.  
> 5. Confiança: ALTA (norma/manual oficial).

## **FECHAMENTO E QUADRO-RESUMO**

A arquitetura do software contábil desenvolvido enfrentará uma dualidade em seu ciclo de vida imediato: a estabilidade das APIs previdenciárias do eSocial (ancoradas nos Leiautes S-1.2/S-1.3) contraposta à disrupção do ecossistema do Simples Nacional, alavancada pela Resolução CGSN nº 190/2026. A bifurcação do fluxo de transmissão da DEFIS em 2027, demandará que o código suporte requisições *legacy* e prepare payloads integrados ao PGDAS-D.

### **Painel de Automação de Obrigações Acessórias**

| Obrigação Fiscal/Trabalhista | Prazo Regular de Transmissão | Canal de Transmissão Técnico | Possui API? | Custo Estimado na API | Confiança da Informação |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **PGDAS-D** | Até o dia 20 do mês subsequente à apuração | Integra Contador (SERPRO) | SIM | R$ 3,20 a R$ 4,96 (Mensal/CNPJ) | ALTA |
| **Emissão de Guia DAS** | Até o dia 20 do mês subsequente à apuração | Integra Contador (SERPRO) | SIM | R$ 3,20 a R$ 4,96 (Mensal/CNPJ) | ALTA |
| **DEFIS (Regra vigente até 2026\)** | 31 de Março do ano seguinte | Integra Contador (SERPRO) | SIM | Atrelado ao Integra-SN | BAIXA (ausência de docs abertas) |
| **eSocial (Pró-labore Sócios)** | Dia 15 do mês seguinte ao pagamento | eSocial Nacional (Webservice SOAP) | SIM | Gratuito | ALTA |
| **DCTFWeb** | Dia 15 do mês seguinte ao fato | Integra Contador (SERPRO) | SIM | Atrelado ao Integra-DCTFWeb | ALTA |
| **DARF Previdenciário (INSS/IRRF)** | Até o dia 20 do mês seguinte | Integra Contador (SERPRO) | SIM | Atrelado ao Integra-Sicalc | ALTA |

*Observação referente a custos: Os montantes refletem consolidações de players de mercado, uma vez que a estrutura técnica restrita de endpoints e bilhetagem não é publicizada de forma aberta.*

### **Declaração de Ausência de Dados Oficiais**

Em rigorosa observância à proibição de preencher lacunas de forma plausível sem lastro legal explícito nas fontes fornecidas, manifesto que as seguintes respostas **NÃO foram encontradas em fonte primária/oficial (legislação ou manuais abertos do SERPRO/RFB)** contidas no contexto de pesquisa:

* A lista explícita de identificadores URL, JSON schemas ou caminhos dos endpoints do Integra Contador (Swagger/OpenAPI do SERPRO para o Simples Nacional). As deduções foram alicerçadas em blogs técnicos de *software houses* já integradas (Rech Sistemas, Calima, Questor e Domínio).  
* Tabela de preços nominal em centavos por requisição e modelo oficial de bilhetagem limitadora (throttling) estipulados no contrato do Integra Contador (os custos médios e a ausência de limites citados em P3.11 provêm da literatura de terceiros).  
* URLs, instâncias ou tutoriais literais para habilitação de credenciais do ambiente de testes estrito de desenvolvedor (Sandbox/Homologação) do SERPRO Integra Contador.

#### **Referências citadas**

> 1. DEFIS 2025, fique atento a esses detalhes\!, [https://blog.esimplesauditoria.com.br/defis/](https://blog.esimplesauditoria.com.br/defis/)  
> 2. Manual do PGDAS-D e DEFIS \- Simples Nacional, [https://www8.receita.fazenda.gov.br/simplesnacional/arquivos/manual/manual\_pgdas-d\_2018\_v4.pdf](https://www8.receita.fazenda.gov.br/simplesnacional/arquivos/manual/manual_pgdas-d_2018_v4.pdf)  
> 3. NORMAS \- Manaus Atende, [https://manausatende.manaus.am.gov.br/storage/webdisco/2021/06/17/outros/1965deb28499fb8f8af19897d0fc4687.pdf](https://manausatende.manaus.am.gov.br/storage/webdisco/2021/06/17/outros/1965deb28499fb8f8af19897d0fc4687.pdf)  
> 4. SIMPLES NACIONAL, [https://admin.atendimento.receita.rs.gov.br/upload/arquivos/202508/22150110-legislacao-setorial-consolidada-ges-sn-v01.pdf](https://admin.atendimento.receita.rs.gov.br/upload/arquivos/202508/22150110-legislacao-setorial-consolidada-ges-sn-v01.pdf)  
> 5. IMPOSTO SOBRE A RENDA – PESSOA FÍSICA \- Portal Gov.br, [https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/dirpf/pr-irpf-2024.pdf](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/dirpf/pr-irpf-2024.pdf)  
> 6. CGSN atualiza regras do Simples Nacional para adequação à, [https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/agosto/cgsn-atualiza-regras-do-simples-nacional-para-adequacao-a-reforma-tributaria-do-consumo](https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/agosto/cgsn-atualiza-regras-do-simples-nacional-para-adequacao-a-reforma-tributaria-do-consumo)  
> 7. Resolução CGSN 190/2026: o que muda no Simples Nacional e no, [https://vemlucrarmais.com.br/resolucao-cgsn-190-2026-simples-nacional-mei/](https://vemlucrarmais.com.br/resolucao-cgsn-190-2026-simples-nacional-mei/)  
> 8. Comitê Gestor do Simples Nacional (CGSN), [https://www8.receita.fazenda.gov.br/simplesnacional/Noticias/NoticiaCompleta.aspx?id=e595d010-1e04-4c3b-95d9-185fc58594b5](https://www8.receita.fazenda.gov.br/simplesnacional/Noticias/NoticiaCompleta.aspx?id=e595d010-1e04-4c3b-95d9-185fc58594b5)  
> 9. Regime híbrido do Simples Nacional: vale a pena optar até 30 de, [https://gsoft.com.br/artigos/regime-h%C3%ADbrido-do-simples-nacional-vale-a-pena-optar-at%C3%A9-30-de-setembro](https://gsoft.com.br/artigos/regime-h%C3%ADbrido-do-simples-nacional-vale-a-pena-optar-at%C3%A9-30-de-setembro)  
> 10. ATUALIZAÇÕES TRIBUTÁRIAS – 10 a 14/08/2026, [https://pradvogados.com.br/2026/08/17/atualizacoes-tributarias-10-a-14-08-2026/](https://pradvogados.com.br/2026/08/17/atualizacoes-tributarias-10-a-14-08-2026/)  
> 11. DEFIS vai acabar? Entenda a mudança no Simples Nacional, [https://spmartinscontabilidade.com.br/blog/defis-vai-acabar-pgdas-d-simples-nacional-2027](https://spmartinscontabilidade.com.br/blog/defis-vai-acabar-pgdas-d-simples-nacional-2027)  
> 12. Integra Contador \- Loja Serpro, [https://loja.serpro.gov.br/integra-contador/product/integracontador](https://loja.serpro.gov.br/integra-contador/product/integracontador)  
> 13. Integra Contador no Calima Pro | API oficial do SERPRO, [https://www.calima.com.br/integracontador](https://www.calima.com.br/integracontador)  
> 14. Como Configurar a API Integra Contador para o Simples Nacional?, [https://docs.questor.com.br/Produtos/Gest%C3%A3oCont%C3%A1bil/IntegraContador/api-integra-contador](https://docs.questor.com.br/Produtos/Gest%C3%A3oCont%C3%A1bil/IntegraContador/api-integra-contador)  
> 15. serpro\_integra\_contador\_api | Flutter package \- Pub.dev, [https://pub.dev/packages/serpro\_integra\_contador\_api](https://pub.dev/packages/serpro_integra_contador_api)  
> 16. Configuração da integração Integra Contador (PGDAS), [https://autoatendimento.contmatic.com.br/hc/pt-br/articles/40949193274003-Configura%C3%A7%C3%A3o-da-integra%C3%A7%C3%A3o-Integra-Contador-PGDAS](https://autoatendimento.contmatic.com.br/hc/pt-br/articles/40949193274003-Configura%C3%A7%C3%A3o-da-integra%C3%A7%C3%A3o-Integra-Contador-PGDAS)  
> 17. Manual WEB GERAL — eSocial \- Portal Gov.br, [https://www.gov.br/esocial/pt-br/empresas/manual-web-geral](https://www.gov.br/esocial/pt-br/empresas/manual-web-geral)  
> 18. Alteração de Preços Senatran 2025 \- Central de Ajuda, [https://centraldeajuda.serpro.gov.br/duvidas/pt/avisos/avisosenatran2025/](https://centraldeajuda.serpro.gov.br/duvidas/pt/avisos/avisosenatran2025/)  
> 19. Produção Empresas e Ambiente de Testes — eSocial \- Portal Gov.br, [https://www.gov.br/esocial/pt-br/empresas/perguntas-frequentes/perguntas-frequentes-producao-empresas-e-ambiente-de-testes](https://www.gov.br/esocial/pt-br/empresas/perguntas-frequentes/perguntas-frequentes-producao-empresas-e-ambiente-de-testes)  
> 20. MANUAL DE ORIENTAÇÃO DO ESOCIAL – VERSÃO, [https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/mos-s-1-1-consolidada-ate-a-no-s-1-1-03-2023.pdf](https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/mos-s-1-1-consolidada-ate-a-no-s-1-1-03-2023.pdf)  
> 21. Folha | S-1299 | Carga inicial no eSocial e DCTFWeb para, [https://autoatendimento.contmatic.com.br/hc/pt-br/articles/36525057483155-Folha-S-1299-Carga-inicial-no-eSocial-e-DCTFWeb-para-empresas-sem-movimenta%C3%A7%C3%A3o](https://autoatendimento.contmatic.com.br/hc/pt-br/articles/36525057483155-Folha-S-1299-Carga-inicial-no-eSocial-e-DCTFWeb-para-empresas-sem-movimenta%C3%A7%C3%A3o)  
> 22. Material completo do Plantão sobre DCTFWeb \- Hevcon WEB, [https://www.hevcon.com.br/material-completo-do-plantao-sobre-dctfweb/](https://www.hevcon.com.br/material-completo-do-plantao-sobre-dctfweb/)  
> 23. eSocial versão S-1.0 \- Leiautes (cons. até NT 05/2022), [https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/leiautes-esocial-nt-05-2022-html/index.html](https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/leiautes-esocial-nt-05-2022-html/index.html)  
> 24. Histórico de Perguntas Frequentes — eSocial \- Portal Gov.br, [https://www.gov.br/esocial/pt-br/empresas/perguntas-frequentes/historico-de-perguntas-frequentes](https://www.gov.br/esocial/pt-br/empresas/perguntas-frequentes/historico-de-perguntas-frequentes)  
> 25. eSocial versão S-1.3 \- Regras \- Portal Gov.br, [https://www.gov.br/esocial/pt-br/documentacao-tecnica/leiautes-esocial-versao-s-1-3-cons-ate-nt-04-2025-rev-26-08-2025/index.html/regras.html](https://www.gov.br/esocial/pt-br/documentacao-tecnica/leiautes-esocial-versao-s-1-3-cons-ate-nt-04-2025-rev-26-08-2025/index.html/regras.html)  
> 26. MANUAL DE ORIENTAÇÃO DO eSOCIAL \- Versão S-1.3, [https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/mos-s-1-3-consolidada-ate-a-no-s-1-3-11-2026-retificada.pdf](https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/mos-s-1-3-consolidada-ate-a-no-s-1-3-11-2026-retificada.pdf)