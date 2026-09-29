---
tipo: verdade
status: vivo
data: 2026-08-28
assunto: abertura-mei-processo
deriva_de: [resultado-pesquisa-abertura-mei-28-08]
tags: [mei, abertura, constituicao, redesim, portal-empreendedor, fonte-primaria, bh]
---

# 🟢 Abertura de MEI — fonte-verdade do processo (28/08)

> Pesquisa Gemini com fonte oficial obrigatória (70 referências, quase todas gov.br/planalto/pbh/sef-mg), rodada pelo Pedro. Arquivo bruto em [[resultado-pesquisa-abertura-mei-28-08]]. Equivalente MEI do que `produto/me/entrar/constituir/processo-abertura-empresa-bh.md` é pro ME.

## ⚠️ Os 3 achados que mudam o produto

### 1. 🔴 Não existe API. E não existe procuração possível.

- 🟢 **Não existe API/webservice oficial** que permita a um sistema privado formalizar um MEI. Confirmado com busca ativa: Portal do Empreendedor, Redesim, Conecta gov.br, Simples Nacional — nenhum tem rota de formalização.
- 🟢 O **Conecta gov.br** (Portaria SGD/ME 8.570/2021) só faz **autenticação** (OAuth2/OpenID). O token não carrega escopo pra abrir empresa.
- 🟢 Programas confundidos com integração **não são**: "MEI Conta com a Gente" é matchmaking com contadores; "CRED+" é API de crédito, restrita a instituições financeiras.
- 🟢 **Não existe funcionalidade de representação** no Portal do Empreendedor. Um procurador não consegue logar com o próprio CPF e abrir em nome de cliente.
- 🟢 A **Procuração Eletrônica do e-CAC não cobre a abertura.** Ela habilita atos posteriores (PGMEI, parcelamento, DARF, DCTFWeb, Sero) — não o registro originário na Redesim/CGSIM.
- 🟢 O acesso exige conta **gov.br nível Prata ou Ouro** do próprio titular (estrangeiro: Bronze + dados da Polícia Federal).
- 🔴 **Operar com a senha gov.br do cliente viola os Termos de Uso** ("sigilo da senha, pessoal e intransferível") e é risco alto de LGPD. Não é zona cinzenta — está escrito.
- 🟢 **Único canal oficial:** Portal do Empreendedor (gov.br/empresas-e-negocios), serviço "Formalize-se". Alternativa presencial (Sala do Empreendedor / Sebrae) é **orientativa**: o cidadão ainda insere as credenciais dele.

> **Consequência dura:** o modelo que usamos no ME (a gente executa, o cliente assina no fim) **não é aplicável ao MEI**. No MEI, quem clica é obrigatoriamente o titular.

### 2. 🟢 A abertura é grátis, síncrona e sem quase nenhuma etapa

| Etapa que existe no ME | No MEI |
|---|---|
| Consulta de viabilidade (locacional + nome) | **Extinta** — Resolução CGSIM nº 61/2020 (adequação à Lei 13.874/2019) |
| Contrato social / Requerimento de Empresário | **Não existe** — o **CCMEI** é o documento constitutivo (Res. CGSIM 48/2018) |
| Taxa de arquivamento na Junta (DAE) | **Isento** |
| Certificado digital ICP-Brasil | **Dispensado** — gov.br Prata/Ouro supre a assinatura |
| Prazo de dias/semanas até o CNPJ | **CNPJ na hora**, minutos, mesma sessão |
| Escolha de razão social + busca de colidência | **Gerada automaticamente**: 8 primeiros dígitos do CNPJ + nome civil (Lei 14.195/2021) |
| Escolha de natureza jurídica | **Automática**: 213-5 Empresário Individual |
| Alvará de funcionamento (BH) | **Dispensado** se baixo risco — Decreto PBH nº 17.245/2019 (275+ atividades) |
| Taxas municipais anuais (TFLF/TFS) | **MEI é isento** (Art. 21 da legislação municipal BH) |

O MEI **é** registrado na JUCEMG, mas de forma automática e transparente via barramento Redesim — o usuário nunca acessa a Junta nem paga DAE.

> **Consequência dura:** se a abertura é grátis, instantânea e sem burocracia, **não dá pra cobrar "pela abertura"**. O valor tem que estar em outro lugar.

### 3. 🔴 Os 3 pilares do nosso ICP não podem ser MEI

Art. 966, parágrafo único, do Código Civil: *"Não se considera empresário quem exerce profissão intelectual, de natureza científica, literária ou artística"*. Por isso essas ocupações **nem constam** no Anexo XI.

Cruzando os nossos **51 CNAEs certeza que aceitam MEI** contra as 14 categorias (pills) do E3.4:

| Categoria (pill) | CNAEs que atendemos (ME) | Quantos aceitam MEI |
|---|---|---|
| Tecnologia e software | 8 | **0** ❌ |
| Design | 4 | **0** ❌ |
| Consultoria, pesquisa e tradução | 5 | **0** ❌ |
| Marketing e publicidade | 6 | 1 |
| Arte, cultura e patrimônio | 8 | 3 |
| Eventos e entretenimento | 4 | 3 |
| Foto, vídeo e áudio | 8 | 4 |
| Hospedagem | 7 | 4 |
| Edição e mídia | 6 | 5 |
| Apoio administrativo | 8 | 6 |
| Ensino e cursos | 9 | 7 |
| Aluguel de equipamentos | 8 | **8** ✅ |
| Reparos e manutenção | 10 | **10** ✅ |
| Salão e beleza | 1 | **1** ✅ |

> **Consequência dura:** a Persona A (dev/consultor/designer — nosso ICP mais forte) **não pode ser MEI**. O público MEI é outro: reparos, aluguel de equipamento, salão, instrutor, fotógrafo, evento. Isso bate com o achado de campo já registrado nas volantes (93% das novas empresas de chaveiro em 2025 foram MEI).

## Elegibilidade — os gates que o governo checa

🟢 Critérios cumulativos (LC 123/2006 art. 18-A + Res. CGSN 140/2018):

1. **Teto**: R$81.000/ano proporcional. Exceção: MEI Caminhoneiro (TAC) = R$251.600.
2. **Singularidade societária**: não pode ser titular, sócio **ou administrador** de outra PJ. A RFB **cruza o CPF automaticamente** e bloqueia.
3. **Sem filial.**
4. **Máx. 1 empregado**, no piso da categoria ou salário mínimo.
5. **Ocupação no Anexo XI** (Tabelas A e B da Res. CGSN 140/2018).

🟢 Bloqueios/alertas sistêmicos no ato:

| Situação | O que acontece |
|---|---|
| Servidor público **federal** na ativa | **Bloqueio imediato** (Lei 8.112/90 art. 117) |
| Já é sócio/titular/admin de CNPJ ativo | **Bloqueio** — precisa baixar/desvincular antes |
| Aposentadoria por invalidez, salário-maternidade, seguro-desemprego | **Alerta, mas deixa seguir** — e a formalização **suspende/cancela o benefício**, com risco de multa se houver dolo |
| Estrangeiro com dado migratório inconsistente | Trava no barramento da Polícia Federal |
| Profissão intelectual regulamentada | Não existe a ocupação na lista — nem chega a tentar |

## O formulário, campo a campo

🟢 O que o Portal do Empreendedor exige:

| Grupo | Campo | Obrigatório | Origem |
|---|---|---|---|
| Identificação imutável | CPF, Nome civil, Data de nascimento, Nome da mãe | ✅ | **Puxado do gov.br**, não editável |
| Identificação civil | RG (ou doc. oficial), Órgão emissor, UF de emissão | ✅ | Digitado |
| Contato | Telefone celular, E-mail | ✅ | Digitado — usado pelo DET |
| Endereço residencial | CEP, logradouro, nº, complemento, bairro, município, UF | ✅ | Digitado |
| Endereço comercial | CEP, logradouro, nº, complemento, bairro, município, UF | ✅ | Pode ser igual ao residencial |
| Negócio | **Capital social** | ✅ | Sem mínimo legal — pode ser R$1,00 |
| Negócio | **Ocupação principal** | ✅ | Seleção única do Anexo XI |
| Negócio | **Forma de atuação** | ✅ | Multi-seleção, 7 opções: estabelecimento fixo · internet · local fixo fora de loja · correio · porta a porta/ambulante · televendas · máquinas automáticas |
| Negócio | Nome fantasia | ⬜ opcional | Livre |
| Negócio | Ocupações secundárias | ⬜ opcional | **Até 15** |
| Aceites | 3 declarações (ver abaixo) | ✅ | Checkbox |

🟢 **Não pede mais** título de eleitor nem recibo do IRPF (o gov.br Prata/Ouro substituiu). Exceção: estrangeiro Bronze.

🟢 **As 3 declarações obrigatórias:**
1. **Desimpedimento** — não é impedido por lei (magistrado, servidor federal) e não tem outra empresa ativa.
2. **Opção pelo Simples Nacional / SIMEI.**
3. **Termo de Ciência e Responsabilidade com Efeito de Dispensa de Alvará** (Res. CGSIM 59/2020) — declara ser atividade de baixo risco e assume responsabilidade cível e penal por posturas, saúde, ambiente e incêndio.

## Ocupação ≠ CNAE: a armadilha do "limite interno"

🟢 O Portal não pede código CNAE — pede **ocupação** (nome semântico). O Anexo XI faz o de-para.

🟢 **Mas o MEI não pode exercer tudo o que o CNAE abrange.** Solução de Consulta Cosit nº 27/2021: há um **limite externo** (o escopo do CNAE) e um **limite interno** (o conceito estrito da ocupação nomeada). Se o CNAE cobre 5 atividades e o Anexo XI só nomeou 1 como ocupação, as outras 4 estão **proibidas** pro MEI.

> Isso é exatamente o tipo de erro que só um contador pega — e é onde mora parte do nosso valor.

✅ **Já temos isso mapeado:** `pesquisa/cnae-matriz/cnae-matriz.json` tem o campo `mei_ocupacoes` preenchido nos **351/351** CNAEs que aceitam MEI. Esse é o insumo mais difícil da abertura e ele já está no vault.

## Depois de aberto (BH/MG)

- 🟢 **Inscrição Municipal (CMC)** em BH: automática via Redesim → Integrador MG → PBH. Sem petição manual. Comprovante sai no portal da PBH.
- 🟢 **Inscrição Estadual (SEFAZ/MG)**: só se a ocupação envolver ICMS (comércio/indústria/transporte inter). Gerada automática no SIARE.
- 🟢 **NFS-e**: MEI de serviço tem que fazer **primeiro acesso no Emissor Nacional** (nfse.gov.br) — não está apto a emitir no minuto seguinte à abertura. Precisa conectar o CNPJ e parametrizar. (Cruza com [[mei-obrigacoes-operacionais]].)
- 🟡 **NFC-e em MG**: MEI está **dispensado** de emitir NFC-e pra consumidor final PF (Res. SEF/MG 5.234/2019). Pra PJ, o comprador emite nota de entrada; se quiser emitir, usa NFA-e pelo SIARE/app NFF.
- 🟢 **Primeiro DAS**: vence dia 20 do mês seguinte ao da formalização. Abriu em fevereiro → primeira guia 20/março.
- 🟢 **CCMEI**: reemissão exige login gov.br do titular. **Cartão CNPJ**: público, sem login.
- 🟢 **Alteração cadastral** (ocupação, endereço, nome fantasia, capital): a qualquer momento, **gratuita**, síncrona, exige novo Termo de Ciência. Também no Portal do Empreendedor com login do titular.

## Pendências

1. 🟡 Não achou fonte oficial sobre API de download em massa do CCMEI. Provavelmente não existe.
2. 🟡 O relatório cita salário mínimo de R$1.518 (2025) em um trecho e nossa base usa R$1.621 (2026) — nossa fonte em [[mei-obrigacoes-operacionais]] é mais atual, mantida.
3. 🔴 **Decisão de negócio, não de pesquisa:** o que exatamente vendemos no MEI, se a abertura é grátis e não podemos executá-la. Ver [[cruzamento-flow-mei-vs-me]].

## Links
- [[resultado-pesquisa-abertura-mei-28-08]] — bruto arquivado.
- [[cruzamento-flow-mei-vs-me]] — o que isso vira de flow e tela.
- [[mei-obrigacoes-operacionais]] — o que vem depois de aberto.
- `produto/me/entrar/constituir/processo-abertura-empresa-bh.md` — o equivalente do ME.
- `pesquisa/cnae-matriz/cnae-matriz.json` — campo `mei_ocupacoes`, 351 preenchidos.
