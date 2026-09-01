---
tipo: verdade
status: vivo
data: 2026-08-27
assunto: cnae-atendemos-com-certeza
deriva_de: [cnae-matriz-governo, lc123-art18-anexos-taxativo, profissoes-regulamentadas-conselhos, mei-risco-e-simplificacao-abertura, cnae-complexidade-abertura]
superado_por:
tags: [cnae, mei, simples-nacional, escopo, fonte-primaria]
---

# 🟢 CNAEs que atendemos com certeza (87 ME · 51 MEI)

> Substitui a v1 de 17/07 (103 CNAEs, herdada da Contabilizei, não ratificada). Esta versão é **fonte primária em toda a linha**: cada critério tem lei/resolução citada, nenhum dado vem de concorrente.
>
> 🔄 **Correção 28/08** (investigação do eixo de registro setorial, disparada pelo `cnae-verifica-atende.js`): eram 90/53. 5 CNAEs tinham `exige_registro_setorial: nao-verificado` (não `nao`) — aprovados sem essa checagem rodar neles especificamente. Investigado com fonte primária: 1 saiu de vez (agenciamento marítimo exige habilitação federal), 2 confirmaram "não exige" (ficam), 2 seguem pendentes (recuperação de metal/plástico — indício de CTF/APP IBAMA, não confirmado contra o Anexo oficial). Detalhe completo abaixo.

## 🛠️ Pro desenvolvedor — dado completo, não só este `.md`

Este documento é a **leitura humana curada** (tabela enxuta, 6 colunas, pra entender o critério). Pra implementar de verdade, use o **export dedicado**, que tem as **40 colunas** da matriz só pra estes 87 códigos (sem precisar filtrar os 1332 inteiros):

- **`cnae-atendemos-certeza.json`** / **`cnae-atendemos-certeza.csv`** — todas as colunas: `atividades` (exemplos reais de negócio do IBGE), `subclasse_observacoes` (o que compreende/NÃO compreende, com exclusões cruzadas pra outros CNAEs), `anexo_fator_r_fonte` (o inciso exato da lei, não só o resultado), `mei_ocupacoes` (nome oficial da ocupação MEI), `iss_bh_detalhe` (quando a alíquota varia por sub-atividade), `risco_cgsim_desc_oficial`, `conselho_qual`/`conselho_fonte`, `registro_setorial_qual`/`registro_setorial_fonte`, etc. — a mesma coluna a coluna que `cnae-matriz.csv` tem pros 1332, só que filtrado (hoje 87 linhas).

**Dado vivo:** cada fato aqui tem a fonte junto (inciso de lei, resolução, artigo) — não é só um valor solto. Isso é o que permite, quando o governo mudar uma regra, saber exatamente qual linha reavaliar e por quê. Ainda não existe mecanismo de versionamento/notificação automática (ver [[legalize-equacao-fiscal-camadas-cnae-cnpj]] na memória — provocação em aberto do Pedro, não construída), mas o dado já nasce rastreável pra quando isso for desenhado.

## Critério (7 filtros, todos com fonte)
```
632 CNAEs de serviço (IBGE — corrigido: alimentação/divisão 56 é comércio, ver abaixo)
→ 540 não vedados ao Simples Nacional (CGSN140 Anexo VI)
→ 523 não ambíguos (CGSN140 Anexo VII)
→ 120 baixo risco — dispensa vistoria/alvará (CGSIM Resolução 51/2019, Anexo I)
→  94 não exigem registro em conselho profissional (Lei 6.839/1980 + leis de cada conselho)
→  90 não exigem registro setorial federal (CADASTUR/Polícia Federal/Bacen-CVM-SUSEP — cruzado contra a seção de complexidade abaixo)
```
4ª rodada (28/08, [[cnae-verifica-atende]]): dos 90, **5 tinham o eixo nao-verificado** (não checado nessa subclasse específica, não "nao" de verdade) — investigado com fonte primária. 1 confirmou exigência (saiu) · 2 confirmaram "não exige" (ficam) · 2 seguem pendentes. **87 restam certeza.**
Dos 87, **51 também permitem MEI** (Anexo XI CGSN140) — MEI segue o mesmo filtro de risco do ME (confirmado em [[mei-risco-e-simplificacao-abertura]], Art. 18-A §18 da LC123), não existe atalho.

## O que mudou vs a v1 (103, herdada)
- **80 confirmados** — os dois métodos concordam, núcleo sólido.
- **23 saíram na 1ª rodada** (5 critérios): 21 eram na verdade comércio/indústria pelo IBGE (violavam "MVP só serviço" — a curadoria de julho errou a seção); 2 eram regulamentados que passaram batido (`7020-4/00` consultoria em gestão/CRA, `7490-1/03` agronomia/CREA).
- **+4 saíram na 2ª rodada** (cruzamento com o eixo de registro setorial, 27/08 — diferente de conselho profissional, que a pesquisa original do 5º dado não cobriu): `6621-5/02` auditoria/consultoria atuarial → Bacen/CVM/SUSEP; `7911-2/00` agências de viagens → CADASTUR; `7912-1/00` operadores turísticos → CADASTUR; `8011-1/02` adestramento de cães de guarda → Polícia Federal.
- **+2 saíram na 3ª rodada** (achado do Pedro, 27/08): `5611-2/01` restaurantes e `5611-2/03` lanchonetes **são comércio (Anexo I), não serviço** — base legal: Decreto 7.212/2010 (RIPI) art. 5º I "a", preparo de alimento pra venda direta ao consumidor não é industrialização, tratado como revenda de mercadoria. A regra de seção do IBGE (`anexo_base`) tratava toda a seção "Alojamento e Alimentação" como serviço — **estava errada especificamente pra divisão 56 (Alimentação)**; corrigida na matriz pros 9 CNAEs dessa divisão (Alojamento, divisão 55, continua serviço — hotel/pensão é serviço de verdade).
- **16 entraram**: batiam nos critérios e não estavam na lista velha.

⚠️ **O eixo de registro setorial só foi cruzado pra 387 dos 1332 CNAEs** (cobertura do arquivo antigo, que só mapeia o footprint da Contabilizei). Pra CNAEs fora desses 387, `exige_registro_setorial` fica `nao-verificado` na matriz — não é garantia de que não precisam, é lacuna de pesquisa ainda aberta.

## ⚠️ Casos deixados de fora por segurança (não classificados, não é "não atende")
`8660-7/00` apoio à gestão de saúde · `8030-7/00` investigação particular · `8020-0/01` monitoramento de segurança eletrônica — ver [[profissoes-regulamentadas-conselhos]] pelo motivo de cada um. E 62 CNAEs de serviço ficaram `requer-revisao` no Anexo/Fator R (ambíguo demais pra classificar sem humano) — nenhum deles entra aqui por definição.

---

## Lista completa (87), por seção

**Colunas:** CNAE · Descrição · Anexo/Fator R · Fonte legal · MEI · ISS BH. Atividades/observações completas → export dedicado (ver acima).

### Alojamento (2)
> ⚠️ Renomeado de "Alojamento e Alimentação" — a parte de Alimentação (restaurante/lanchonete) saiu, é comércio. Ver "O que mudou" acima.

| CNAE | Descrição | Anexo/Fator R | Fonte legal | MEI | ISS BH |
|---|---|---|---|---|---|
| 5590-6/01 | Albergues, exceto assistenciais | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 5590-6/03 | Pensões (alojamento) | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |

### Artes, Cultura, Esporte e Recreação (10)
| CNAE | Descrição | Anexo/Fator R | Fonte legal | MEI | ISS BH |
|---|---|---|---|---|---|
| 9001-9/01 | Produção teatral | III-fixo | LC123 art18 5º-B, XV | ✅ | 2%/5% |
| 9001-9/02 | Produção musical | III-fixo | LC123 art18 5º-B, XV | ✅ | 2%/5% |
| 9001-9/03 | Produção de espetáculos de dança | III-fixo | LC123 art18 5º-B, XV | — | 2%/5% |
| 9001-9/04 | Produção de espetáculos circenses, de marionetes e similares | III-fixo | LC123 art18 5º-B, XV | — | 2%/5% |
| 9002-7/01 | Atividades de artistas plásticos, jornalistas independentes e escritores | III-fixo | LC123 art18 5º-F (residual) | — | 2%/5% |
| 9002-7/02 | Restauração de obras de arte | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 9102-3/02 | Restauração e conservação de lugares e prédios históricos | III-fixo | LC123 art18 5º-F (residual) | — | 2% |
| 9319-1/01 | Produção e promoção de eventos esportivos | III-fixo | LC123 art18 5º-F (residual) | — | 5% |
| 9329-8/03 | Exploração de jogos de sinuca, bilhar e similares | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 9329-8/04 | Exploração de jogos eletrônicos recreativos | Fator R dinâmico | LC123 art18 5º-D, IV | ✅ | 5% |

### Atividades Administrativas e Serviços Complementares (17)
| CNAE | Descrição | Anexo/Fator R | Fonte legal | MEI | ISS BH |
|---|---|---|---|---|---|
| 7721-7/00 | Aluguel de equipamentos recreativos e esportivos | III-fixo | LC123 art18 5º-F (residual) | ✅ | — |
| 7722-5/00 | Aluguel de fitas de vídeo, DVDs e similares | III-fixo | LC123 art18 5º-F (residual) | ✅ | — |
| 7723-3/00 | Aluguel de objetos do vestuário, jóias e acessórios | III-fixo | LC123 art18 5º-F (residual) | ✅ | — |
| 7729-2/01 | Aluguel de aparelhos de jogos eletrônicos | Fator R dinâmico | LC123 art18 5º-D, IV | ✅ | — |
| 7729-2/02 | Aluguel de móveis, utensílios e aparelhos de uso doméstico e pessoal; instrumentos musicais | III-fixo | LC123 art18 5º-F (residual) | ✅ | — |
| 7729-2/03 | Aluguel de material médico | III-fixo | LC123 art18 5º-F (residual) | ✅ | — |
| 7729-2/99 | Aluguel de outros objetos pessoais e domésticos NE | `requer-revisao` | sem match claro (residual genérico) | ✅ | — |
| 7733-1/00 | Aluguel de máquinas e equipamentos para escritórios | III-fixo | LC123 art18 5º-F (residual) | ✅ | — |
| 8211-3/00 | Serviços combinados de escritório e apoio administrativo | `requer-revisao` | sem match claro (residual genérico) | — | 5% |
| 8219-9/01 | Fotocópias | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 8219-9/99 | Preparação de documentos e serviços especializados de apoio administrativo NE | `requer-revisao` | sem match claro (residual genérico) | ✅ | 5% |
| 8220-2/00 | Atividades de teleatendimento | III-fixo | LC123 art18 5º-F (residual) | — | 2%/5% |
| 8230-0/01 | Serviços de organização de feiras, congressos, exposições e festas | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 8291-1/00 | Atividades de cobranças e informações cadastrais | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 8292-0/00 | Envasamento e empacotamento sob contrato | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 8299-7/03 | Serviços de gravação de carimbos, exceto confecção | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 8299-7/07 | Salas de acesso à internet | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |

### Atividades Profissionais, Científicas e Técnicas (19)
| CNAE | Descrição | Anexo/Fator R | Fonte legal | MEI | ISS BH |
|---|---|---|---|---|---|
| 7210-0/00 | Pesquisa e desenvolvimento experimental em ciências físicas e naturais | III-fixo | LC123 art18 5º-F (residual) | — | 5% |
| 7220-7/00 | Pesquisa e desenvolvimento experimental em ciências sociais e humanas | III-fixo | LC123 art18 5º-F (residual) | — | 5% |
| 7311-4/00 | Agências de publicidade | Fator R dinâmico | LC123 art18 5º-I, X | — | 2% |
| 7312-2/00 | Agenciamento de espaços para publicidade, exceto em veículos de comunicação | Fator R dinâmico | LC123 art18 5º-I, X | — | 2% |
| 7319-0/02 | Promoção de vendas | III-fixo | LC123 art18 5º-F (residual) | ✅ | 2% |
| 7319-0/03 | Marketing direto | III-fixo | LC123 art18 5º-F (residual) | — | 2% |
| 7319-0/04 | Consultoria em publicidade | Fator R dinâmico | LC123 art18 5º-I, IX | — | 5% |
| 7320-3/00 | Pesquisas de mercado e de opinião pública | III-fixo | LC123 art18 5º-F (residual) | — | 2% |
| 7410-2/02 | Design de interiores | Fator R dinâmico | LC123 art18 5º-I, VI | — | 2% |
| 7410-2/03 | Design de produto | Fator R dinâmico | LC123 art18 5º-I, VI | — | — |
| 7410-2/99 | Atividades de design NE | `requer-revisao` | sem match claro (residual genérico) | — | — |
| 7420-0/01 | Atividades de produção de fotografias, exceto aérea e submarina | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 7420-0/03 | Laboratórios fotográficos | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 7420-0/04 | Filmagem de festas e eventos | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 7420-0/05 | Serviços de microfilmagem | III-fixo | LC123 art18 5º-F (residual) | — | 5% |
| 7490-1/01 | Serviços de tradução, interpretação e similares | Fator R dinâmico | LC123 art18 5º-I, V | — | 5% |
| 7490-1/04 | Atividades de intermediação e agenciamento de serviços e negócios em geral, exceto imobiliários | Fator R dinâmico | LC123 art18 5º-I, XI | — | 2% |
| 7490-1/05 | Agenciamento de profissionais para atividades esportivas, culturais e artísticas | Fator R dinâmico | LC123 art18 5º-I, XI | — | 2% |
| 7490-1/99 | Outras atividades profissionais, científicas e técnicas NE | `requer-revisao` | sem match claro (residual genérico) | — | 2%/5% |

### Educação (9)
| CNAE | Descrição | Anexo/Fator R | Fonte legal | MEI | ISS BH |
|---|---|---|---|---|---|
| 8591-1/00 | Ensino de esportes | III-fixo | LC123 art18 5º-F (residual) | — | 2% |
| 8592-9/01 | Ensino de dança | III-fixo | LC123 art18 5º-F (residual) | — | 2% |
| 8592-9/02 | Ensino de artes cênicas, exceto dança | III-fixo | LC123 art18 5º-B, XV | ✅ | 2% |
| 8592-9/03 | Ensino de música | III-fixo | LC123 art18 5º-F (residual) | ✅ | 2% |
| 8592-9/99 | Ensino de arte e cultura NE | `requer-revisao` | sem match claro (residual genérico) | ✅ | 2% |
| 8593-7/00 | Ensino de idiomas | III-fixo | LC123 art18 5º-F (residual) | ✅ | 2% |
| 8599-6/03 | Treinamento em informática | III-fixo | LC123 art18 5º-F (residual) | ✅ | 2% |
| 8599-6/04 | Treinamento em desenvolvimento profissional e gerencial | III-fixo | LC123 art18 5º-F (residual) | ✅ | 2% |
| 8599-6/05 | Cursos preparatórios para concursos | III-fixo | LC123 art18 5º-B, I | ✅ | 2% |

### Informação e Comunicação (18)
| CNAE | Descrição | Anexo/Fator R | Fonte legal | MEI | ISS BH |
|---|---|---|---|---|---|
| 5811-5/00 | Edição de livros | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 5812-3/01 | Edição de jornais diários | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 5812-3/02 | Edição de jornais não diários | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 5813-1/00 | Edição de revistas | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 5819-1/00 | Edição de cadastros, listas e de outros produtos gráficos | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 5911-1/02 | Produção de filmes para publicidade | `requer-revisao` | ambíguo (5º-B XV × 5º-I X) | — | 2% |
| 5912-0/01 | Serviços de dublagem | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 5912-0/02 | Serviços de mixagem sonora em produção audiovisual | III-fixo | LC123 art18 5º-F (residual) | — | 5% |
| 5920-1/00 | Atividades de gravação de som e de edição de música | III-fixo | LC123 art18 5º-B, XV | — | 5% |
| 6201-5/01 | Desenvolvimento de programas de computador sob encomenda | Fator R dinâmico | LC123 art18 5º-D, IV | — | 2% |
| 6201-5/02 | Web design | Fator R dinâmico | LC123 art18 5º-D, VI | — | 2% |
| 6202-3/00 | Desenvolvimento e licenciamento de programas de computador customizáveis | Fator R dinâmico | LC123 art18 5º-D, V | — | 2% |
| 6203-1/00 | Desenvolvimento e licenciamento de programas de computador não customizáveis | Fator R dinâmico | LC123 art18 5º-D, V | — | 2% |
| 6204-0/00 | Consultoria em tecnologia da informação | Fator R dinâmico | LC123 art18 5º-I, IX | — | 2% |
| 6209-1/00 | Suporte técnico, manutenção e outros serviços em tecnologia da informação | III-fixo | LC123 art18 5º-F (residual) | — | 2% |
| 6311-9/00 | Tratamento de dados, provedores de serviços de aplicação e serviços de hospedagem na internet | III-fixo | LC123 art18 5º-F (residual) | — | 2% |
| 6319-4/00 | Portais, provedores de conteúdo e outros serviços de informação na internet | III-fixo | LC123 art18 5º-F (residual) | — | 2% |
| 6391-7/00 | Agências de notícias | III-fixo | LC123 art18 5º-F (residual) | — | 5% |

### Outras Atividades de Serviços (12)
| CNAE | Descrição | Anexo/Fator R | Fonte legal | MEI | ISS BH |
|---|---|---|---|---|---|
| 9511-8/00 | Reparação e manutenção de computadores e de equipamentos periféricos | III-fixo | LC123 art18 5º-B, IX | ✅ | 5% |
| 9512-6/00 | Reparação e manutenção de equipamentos de comunicação | III-fixo | LC123 art18 5º-B, IX | ✅ | 5% |
| 9521-5/00 | Reparação e manutenção de equipamentos eletroeletrônicos de uso pessoal e doméstico | III-fixo | LC123 art18 5º-B, IX | ✅ | 5% |
| 9529-1/01 | Reparação de calçados, de bolsas e artigos de viagem | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 9529-1/02 | Chaveiros | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 9529-1/03 | Reparação de relógios | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 9529-1/04 | Reparação de bicicletas, triciclos e outros veículos não motorizados | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 9529-1/05 | Reparação de artigos do mobiliário | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 9529-1/06 | Reparação de jóias | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 9529-1/99 | Reparação e manutenção de outros objetos e equipamentos pessoais e domésticos NE | III-fixo | LC123 art18 5º-B, IX | ✅ | 5% |
| 9602-5/01 | Cabeleireiros, manicure e pedicure | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |
| 9609-2/02 | Agências matrimoniais | III-fixo | LC123 art18 5º-F (residual) | ✅ | 5% |

---

## ⚠️ Saíram na correção do eixo de registro setorial (28/08)

**Transporte, Armazenagem e Correio** e **Água, Esgoto, Gestão de Resíduos e Descontaminação** existiam como seções só por causa dos CNAEs abaixo — as duas desapareceram da lista "certeza" nesta correção:

| CNAE | Descrição | Status novo | Motivo |
|---|---|---|---|
| 5232-0/00 | Atividades de agenciamento marítimo | 🔴 **Não atende** (saiu de vez) | Exige habilitação federal (Receita Federal — Siscomex/RADAR aduaneiro; ANTAQ registra o agente estrangeiro, Res. ANTAQ 18/2017). Fonte confirmada 28/08. |
| 3831-9/99 | Recuperação de materiais metálicos, exceto alumínio | 🟡 **Pendente** (fora da certeza, não descartado) | Indício de exigência de CTF/APP (IBAMA, Lei 6.938/1981, gestão de resíduos) — não confirmado contra o Anexo I/II oficial pra esta subclasse específica. |
| 3832-7/00 | Recuperação de materiais plásticos | 🟡 **Pendente** (fora da certeza, não descartado) | Mesmo motivo do 3831-9/99. |

Os outros 2 CNAEs investigados na mesma rodada **confirmaram "não exige registro setorial"** e continuam na lista (ficaram nas seções de origem, sem mudar de lugar): `8292-0/00` (envasamento sob contrato — o que existe é licença sanitária municipal/estadual, eixo diferente) e `9529-1/04` (reparação de bicicletas — nenhuma exigência federal encontrada).

---

## Roadmap de expansão (backlog, não construído)
Dá pra crescer por camadas até paridade com o mercado (~387 CNAEs de serviço da Contabilizei). Cada camada é um estudo, pode virar feature ("abrimos mais CNAEs"):

| camada | o que falta estudar |
|---|---|
| **87 atual** | pronto |
| + risco médio (verificar-licenciamento) | fonte setorial BH/Bombeiros/Vigilância por atividade específica |
| + regulamentados com RT terceirizável | modelo de atendimento humano (Mauro/parceiro) por conselho |
| + comércio/indústria leve | reabrir decisão "MVP só serviço" |

---

## 📚 Contexto mais amplo — a complexidade de abertura nos 387 (fundiu com `cnae-complexidade-abertura.md`, 17/07)

> Esta seção veio de uma nota separada (`cnae-complexidade-abertura.md`) fundida aqui em 27/08 a pedido do Pedro — os 87 acima são o recorte "liso + serviço puro" do universo abaixo. Cobertura: **387 CNAEs** (footprint completo da Contabilizei, comércio+indústria+serviço), não só os 632 de serviço do IBGE.

Responde a pergunta original do Pedro (17/07): *"quais CNAEs de fato são simples e quais dependem de mais atenção até de atendimento humano?"* — o eixo é **ortogonal ao fiscal** (Anexo/Fator R): um CNAE pode ser Anexo III barato **e** precisar de vistoria.

### Veredito (387)
| balde | nº | % | o que é | roteamento de produto |
|---|---|---|---|---|
| 🟢 **liso** | 170 | 44% | baixo risco A (CGSIM) **e** sem conselho/setorial | abertura 100% automatizável (happy path MVP) |
| 🟡 **verificar-licenciamento** | 120 | 31% | fora do baixo-risco-A, sem conselho | precisa licença municipal — médio (provisório) OU alto (vistoria); nível é **municipal/BH** |
| 🔴 **tato-registro** | 97 | 25% | exige conselho de classe **ou** órgão setorial | quase sempre humano/RT → Mauro ou waitlist |

> Dos 170 liso, **103 eram serviço puro** na conta original de 17/07 — reduzido pra **87** depois do cruzamento fonte-primária de 27/08-28/08 (ver seção acima, 4 rodadas de correção). Os outros do 170 são comércio/indústria liso (Anexo I/II), fora do "MVP só serviço" — inclusive restaurante/lanchonete, que a conta original de 17/07 também classificava errado como serviço.

### Os 3 eixos (regra determinística, re-executável)
`veredito = tato-registro` se tem conselho/setorial · senão `verificar-licenciamento` se fora do baixo-risco-A · senão `liso`. Prioridade: **registro > licenciamento > liso**. Direção segura do erro travada: **falso-liso é o pecado** (cobra antes de barrar), **falso-tato é conservador** → só marca `liso` quem está na lista oficial; ausência nunca vira "presumido liso".

- **Eixo A — risco** (CGSIM Res 51/2019, Anexo I): 212/387 na lista de baixo risco A · 175 fora. "Fora da lista" ≠ alto risco — é médio **ou** alto, e o alto é definido por cada município.
- **Eixo B — profissão regulamentada** (conselho + RT): conjunto fechado de conselhos → classes CNAE. Ver versão fonte-primária mais recente em [[profissoes-regulamentadas-conselhos]] (27/08).
- **Eixo C — registro setorial** (órgão, sem conselho): CADASTUR, Polícia Federal, MEC/Conselho de Educação, Bacen/CVM/SUSEP, ANATEL, ANTT, IBAMA. **Este é o eixo que faltava na pesquisa do 5º dado** — foi cruzado em 27/08 e tirou 4 códigos (ver acima). Prova de que os eixos são independentes: advogado e agência de viagem são baixo-risco no eixo A mas tato no B/C.

### tato-registro (97) por órgão
| nº | órgão | confiança |
|---|---|---|
| 44 | Conselhos de saúde (CRM/CRO/COREN/CRN/CRP/CREFITO/CRF) | alta |
| 15 | CORE (representação comercial, Lei 4.886/65) | média-alta |
| 9 | MEC/Conselho de Educação (ensino regular 851-854) | alta |
| 8 | CREA/CAU (engenharia/arquitetura) | alta |
| 6 | Bacen/CVM/SUSEP (financeiro/seguros) | alta |
| 3+3+3 | CRECI (corretor imóveis) · OAB/INPI · CADASTUR · Polícia Federal | alta |
| 1+1+1 | CRF · CRMV · CREF | alta/média |

### verificar-licenciamento (120) — perfil por divisão
Puxado por: divisão 33 reparação de máquinas (25, tende médio) · 47 comércio varejo (14) · 43 obras/instalações (12, tende alto) · 77 aluguel (9, médio) · 96 serviços pessoais (9, misto) · 55/56 alojamento/comida (7, alto — Vigilância). Divisões pesadas (obra, comida, alojamento) puxam alto; reparação/aluguel puxam médio. Split exato médio×alto = municipal, **deferido** (REDESIM-MG bloqueado por período eleitoral em 17/07; decreto de risco de BH é a próxima fonte).

### Caveats originais (17/07, ainda válidos)
1. Baixo-risco-A tem entradas condicionais no Anexo I (ex: "desde que artesanal / área < X") — não parseadas, impacto baixo pro nosso recorte de serviço puro.
2. Conselho→CNAE é construção nossa, sem tabela oficial única — mesma ressalva que [[profissoes-regulamentadas-conselhos]] já carrega.
3. Correções já aplicadas na revisão original: +CORE nos 461x (era falso-liso) · −CRF em cosméticos 4772-5 (era falso-tato) · 6911-7/03 = INPI, não OAB.

### Arquivos de dados (mantidos, não fundidos)
- `cnae-complexidade-abertura.json` / `.csv` — os 387 completos com risco_cgsim, orgaos_conselho/setorial, veredito, motivos, confiança.
- `cgsim-res51-baixo-risco.pdf` — fonte primária do eixo A (mesmo PDF usado na pesquisa de 27/08).
- `cnae-atendemos-certeza.json` / `.csv` — export dedicado dos 87 (todas as 40 colunas da matriz, pro desenvolvedor — ver seção "Pro desenvolvedor" no topo).

## Links
- [[cnae-matriz-governo]] · [[lc123-art18-anexos-taxativo]] · [[profissoes-regulamentadas-conselhos]] · [[mei-risco-e-simplificacao-abertura]] · [[cnae-atendidos-hub]] · [[contabilizei-cnae-completo-relatorio]] · [[fila-validacao-humana]]
