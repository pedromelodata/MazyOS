---
tipo: fato
status: vivo
data: 2026-08-28
assunto: resultado-pesquisa-abertura-mei
fonte: Gemini Pro (Google Search), rodado pelo Pedro
tags: [pesquisa, mei, abertura, fonte-externa]
---

# 📥 Resultado bruto — pesquisa Gemini sobre abertura de MEI

> Original em `Downloads/Abertura MEI em Belo Horizonte.md` (62KB, 70 referências, quase todas gov.br / planalto / pbh / sef-mg). Copiado condensado pra cá pra não depender de arquivo fora do repo. Prompt que gerou: [[prompt-pesquisa-abertura-mei-27-08]]. Síntese cruzada: [[abertura-mei-processo]].

## Bloco 1 — API

**Não existe API oficial de abertura de MEI.** Busca ativa por: API do Portal do Empreendedor, webservice Redesim, Conecta gov.br, API Simples Nacional, convênio CGSIM. Resultado: nenhuma rota de formalização.

- "MEI Conta com a Gente" = matchmaking com contadores parceiros, não integração sistêmica.
- "CRED+" = API de crédito, restrita a instituições financeiras/pagamento (Pronampe). Sem rota de formalização ou alteração.
- **Conecta gov.br** (Portaria SGD/ME 8.570/2021) = só autenticação, OAuth 2.0 / OpenID Connect. O token não concede scope pra acessar a Redesim e disparar inscrição. O processo permanece "inalienavelmente encapsulado" na interface do Portal.
- **Não existe programa de convênio** que transfira autoridade de abertura pra software house.

**Etapas adjacentes:**
| Etapa | Status |
|---|---|
| Viabilidade | Extinta pro MEI (Res. CGSIM 61/2020) — não há endpoint |
| CCMEI | Reemissão exige login do titular. Sem fonte oficial de API de download em massa |
| Situação cadastral | RFB/Serpro tem webservice público de consulta CNPJ, tarifado por volume |

**Único canal:** Portal do Empreendedor (gov.br/empresas-e-negocios), serviço "Formalize-se". Alternativa presencial (Sala do Empreendedor / Sebrae) é orientativa — o cidadão ainda insere as próprias credenciais. Qualquer automação exigiria RPA simulando navegação humana.

## Bloco 2 — Quem pode, e quem pode por outro

**Elegibilidade (LC 123/2006 art. 18-A + Res. CGSN 140/2018):**
- Teto R$81.000/ano proporcional. Exceção MEI Caminhoneiro (TAC): R$251.600.
- Proibido participar de outra PJ como titular, sócio **ou administrador** — a RFB cruza o CPF no ato.
- Proibido constituir filial.
- Máx. 1 empregado, piso da categoria ou salário mínimo.
- Ocupação no Anexo XI (Tabelas A e B).

**Terceiro abrindo por outro: não é possível.** Não há funcionalidade de autenticação por representação no Portal. O aceite do Termo de Ciência e a validação via gov.br vinculam o ato ao CPF do futuro empresário. Sem fonte oficial de instrumento nativo que permita representação.

**Procuração e-CAC não cobre a abertura.** Ela habilita atos pós-abertura (Sero, parcelamento PGMEI, DARF, DCTFWeb). Não tem alçada sobre o registro originário na Redesim/CGSIM.

**Conta gov.br: Prata ou Ouro obrigatório** (brasileiros). Atingidos por internet banking credenciado, biometria facial TSE, ou validação CNH. Estrangeiro: Bronze aceito com dados da Polícia Federal (CNRM, DPRNM, Protocolo de Refúgio).

**Operar com senha do cliente = infração.** Termos de Uso gov.br: "sigilo da senha, que deve ser pessoal e intransferível", com responsabilização civil e penal por compartilhamento. LGPD reforça — guarda de senha de portal governamental por privado é risco alto.

**Certificado digital: dispensado na abertura do MEI.** Ao contrário do ME/EPP. A assinatura é suprida pela autenticação gov.br Prata/Ouro.

## Bloco 3 — Passo a passo

1. Acesso e autenticação (empreendedor, gov.br Prata/Ouro) → "Quero ser MEI" → "Formalize-se".
2. Coleta de identificação: nome civil, CPF, nascimento, filiação vêm automáticos e imutáveis do gov.br. Usuário complementa RG + órgão emissor + UF.
3. Qualificação do negócio (Redesim): contato, capital social, nome fantasia (opcional), ocupação principal e secundárias, formas de atuação.
4. Endereços: CEP + detalhamento residencial, depois comercial.
5. Assinatura eletrônica das declarações (aceites obrigatórios).
6. Processamento: Redesim valida em tempo real, grava nas bases estaduais e municipais, finaliza em minutos.

**CNPJ síncrono** — gerado na hora, sem fila nem triagem humana.

**Viabilidade extinta** — Res. CGSIM nº 61 de 12/08/2020, adequação à Lei da Liberdade Econômica (13.874/2019). Sem crivo prévio de uso do solo ou nome. Responsabilidade transferida ao empreendedor via Termo de Ciência, com fiscalização *a posteriori*.

**JUCEMG**: o MEI tem inscrição mercantil, mas gravada automaticamente via barramento Redesim, sem acesso aos sistemas da Junta e sem taxa DAE. **CCMEI substitui o Requerimento de Empresário** pra todos os fins (Res. CGSIM 48/2018).

**Contrato social não existe** — MEI é atuação individual, qualificação simplificada do Empresário Individual (Art. 966 CC).

**Natureza jurídica: 213-5 Empresário (Individual)**, automática. "MEI" não é natureza jurídica própria.

## Bloco 4 — Campo a campo

| Categoria | Campo | Obrigatório | Nota |
|---|---|---|---|
| Identificação imutável | CPF, nome civil, data de nascimento, nome da mãe | ✅ | Auto do gov.br, não editável |
| Identificação civil | RG (ou doc. oficial), órgão emissor, UF | ✅ | Estrangeiro: dados da PF |
| Contato | Celular, e-mail | ✅ | Usado pelo DET |
| Endereço residencial | CEP, logradouro, nº, complemento, bairro, município, UF | ✅ | Validação cruzada de CEP |
| Endereço comercial | idem | ✅ | Pode ser o mesmo do residencial |
| Negócio | Capital social | ✅ | Sem mínimo legal, a partir de R$1,00 |
| Negócio | Ocupação principal | ✅ | Seleção única |
| Negócio | Forma de atuação | ✅ | Multi: estabelecimento fixo · internet · local fixo fora de loja · correio · porta a porta/ambulante · televendas · máquinas automáticas |
| Negócio | Nome fantasia | ⬜ | Opcional |
| Negócio | Ocupações secundárias | ⬜ | **Até 15** |

**Ocupação ≠ CNAE.** O Portal usa lista semântica de ocupações; o Anexo XI faz o de-para (ex: "Padeiro(a) Independente" → 1091-1/01). **Limite interno** (Solução de Consulta Cosit nº 27/2021): o MEI só pode exercer a faceta nomeada na ocupação, não todo o escopo do CNAE.

**Razão social não é escolhida.** Gerada automaticamente: 8 primeiros dígitos do CNPJ + nome civil (ex: "12.345.678 JOAO DA SILVA"), por força da Lei 14.195/2021. Nome fantasia é livre e opcional.

**Endereço residencial como comercial**: permitido (LC 123/2006), especialmente pra atuação porta-a-porta/internet sem circulação de pessoas ou estoque perigoso.

**As 3 declarações:** (1) Desimpedimento (não é magistrado/servidor federal, não tem outra empresa); (2) Opção pelo Simples Nacional/SIMEI; (3) Termo de Ciência e Responsabilidade com Efeito de Dispensa de Alvará (Res. CGSIM 59/2020).

**Título de eleitor e recibo de IRPF não são mais pedidos** — o gov.br Prata/Ouro substituiu. Exceção: estrangeiro Bronze.

## Bloco 5 — BH/MG

- **CMC (Inscrição Municipal)**: obrigatória pra ISSQN, mas **automática** — Portal → Integrador MG → PBH. Comprovante disponível nos portais da PBH.
- **Alvará**: BH promulgou o **Decreto nº 17.245 de 27/12/2019**, listando 275+ atividades de baixo risco com **dispensa total de ALF** e de licenças sanitária/ambiental prévias. O CCMEI + Termo de Ciência é o comprovante frente à fiscalização (critério de dupla visita, orientativa).
- **Inscrição Estadual (SEFAZ/MG)**: só se houver ICMS. Gerada automática no SIARE, comprovante imprimível.
- **Taxas**: formalização isenta em todas as instâncias. Em BH, **MEI é isento de TFLF e TFS** (Art. 21 da legislação municipal).

## Bloco 6 — Depois de aberto

- **NFC-e em MG**: MEI **dispensado** de emitir pra consumidor final PF (Res. SEF/MG nº 5.234/2019). Venda pra PJ: o comprador emite nota de entrada (RICMS/MG). Se quiser emitir: NFA-e via SIARE ou app NFF.
- **NFS-e**: desde 01/09/2023 (Res. CGSN 169/2022), MEI **proibido** de usar emissor municipal (inclui BHISS). Exclusivo do Emissor Nacional (nfse.gov.br). **Exige cadastro secundário / primeiro acesso** — não está apto a emitir imediatamente após a abertura.
- **Primeiro DAS**: dia 20 do mês subsequente ao da formalização (abriu em fevereiro → vence 20/março).
- **Cartão CNPJ**: público, sem login. **CCMEI**: exige login gov.br do titular.

## Bloco 7 — Erros e exceções

**Bloqueios:**
1. Servidor público federal na ativa → bloqueio imediato (Lei 8.112/90 art. 117).
2. CPF já vinculado a CNPJ ativo como titular/sócio/admin → bloqueio, exige baixa/desvinculação prévia. MEI também não pode abrir filial.
3. Estrangeiro com dado migratório inconsistente → trava no barramento da PF.

**Alerta (não bloqueia):** aposentadoria por invalidez, salário-maternidade, seguro-desemprego → o sistema alerta, mas deixa prosseguir; a formalização **suspende/cancela irreversivelmente o benefício**, com risco de multa se houver dolo.

**Profissões regulamentadas/intelectuais**: inviável e sistematicamente bloqueado. Art. 966 parágrafo único do CC ("não se considera empresário quem exerce profissão intelectual, de natureza científica, literária ou artística"). Essas ocupações simplesmente não constam do Anexo XI. Alternativa: autônomo, contribuinte individual, ou ME.

**Alteração cadastral**: a qualquer momento, gratuita, síncrona, no Portal do Empreendedor com login do titular. Cobre nome fantasia, ocupações, capital social, endereços. Exige novo Termo de Ciência.

## Bloco 8 — Comparativo MEI × ME

| Parâmetro | MEI | ME Simples |
|---|---|---|
| Portal | Portal do Empreendedor (centralizado, federal) | Sistemas estaduais (Módulo Integrador JUCEMG), Coletor Nacional Redesim, e-CAC |
| Viabilidade prévia | **Dispensada** (Res. CGSIM 61/2020) | **Obrigatória** — bloqueia até prefeitura atestar uso do solo e Junta validar nome |
| Documento constitutivo | CCMEI | Contrato Social (LTDA) ou Requerimento de Empresário |
| Custo | Isento de tudo | Taxas de protocolo (DAE JUCEMG), viabilidade, alvará municipal |
| Certificado digital | **Não exige** | Comumente exige e-CPF/e-CNPJ ICP-Brasil |
| Prazo até CNPJ | **Síncrono, minutos** | **Assíncrono, dias a semanas** |
| Teto | R$81.000 (TAC: R$251.600), escopo taxativo do Anexo XI | R$360.000+, cardápio amplo de CNAEs com Fator R |
| Manutenção fiscal | Guia fixa via PGMEI, independe do faturamento | PGDAS-D mensal pro-rata sobre receita real |

**Etapas exclusivas do ME**: viabilidade (FCN) na JUCEMG, DBE pra Receita, protocolo assíncrono do contrato social com taxas compensadas — exige polling de APIs estaduais e risco de devolução por exigência de redator.

**Etapa exclusiva do MEI**: aceitação síncrona das declarações e do Termo de Ciência, em malha contínua. O desafio deixa de ser integração de API e vira engenharia reversa de front-end + compliance — porque o governo **intencionalmente inviabilizou** a abertura mecanizada por terceiros sem anuência manifestada pelo titular.

## Links
- [[abertura-mei-processo]] — síntese fonte-verdade.
- [[cruzamento-flow-mei-vs-me]] — o que vira de flow.
- [[prompt-pesquisa-abertura-mei-27-08]] — o prompt que gerou.
