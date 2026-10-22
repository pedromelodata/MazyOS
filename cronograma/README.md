# Gestão de Marketing (v2)

A Gestão de Marketing é o sistema interno do marketing do Legalizaí: planejamento, execução e análise
de conteúdo num lugar só. Tem banco de ideias do nicho contábil nos estilos Viralização, Vendas e
Conexão, Biblioteca de Reels com 28 formatos validados + os 6 nossos em teste, o Cronograma do mês,
criação guiada pela skill **reels-leo** (a do projeto: o Construtor de gancho, CTA e narração; a reels-curtos saiu em 28/09), e métricas do
Instagram. Tipos de reel: Viralização, Vendas, Conexão, Ensino e Conselho (24/09). O contrato completo está em
`SPEC.md`. (A pasta `cronograma/` e os nomes no código continuam
com o nome antigo do app.)

## Servidor da equipe (VPS) e deploy por git (22/10/2026)

O app da equipe (https://mkt.legalizai.com.br) roda na VPS da Hostinger `srv1868768` (82.112.244.145):
serviço systemd `gestao-marketing`, usuário `gestao`, Node 26 em `/opt/node26/bin`, pasta
`/srv/gestao-marketing/ws`. Essa pasta é um **clone deste repositório** (branch `main`): deploy é `git pull`.

- A VPS lê o GitHub com uma deploy key **só de leitura** (`/home/gestao/.ssh/github_deploy`). De lá não sai push
- **O banco de verdade é o da VPS.** `cronograma/data/` (db.json, usuários, sessões, métricas, envios) está no
  `.gitignore` e nenhum pull mexe nele. O `data/` deste PC é só local e não sobe mais pro GitHub
- **Ninguém edita código direto na VPS.** Em 21/10 uma edição feita lá deixou o GitHub 55 arquivos atrás.
  Toda mudança nasce num PC, passa nos testes e vai por commit. Arquivo rastreado mexido na VPS faz o
  `git pull` parar com erro (não perde nada, mas trava o deploy até alguém resolver)

**Fluxo de deploy**

1. No PC: editar, rodar `npm run testar` dentro de `cronograma/`, commit e `git push`
2. Na VPS (`ssh root@82.112.244.145`):

   ```bash
   cd /srv/gestao-marketing/ws
   runuser -u gestao -- git pull --ff-only
   systemctl restart gestao-marketing
   systemctl is-active gestao-marketing
   ```

   Se o pull mudou `cronograma/package-lock.json`, antes do restart:
   `cd cronograma && runuser -u gestao -- env PATH=/opt/node26/bin:$PATH npm ci`
3. Conferir: `runuser -u gestao -- git status` limpo e mkt.legalizai.com.br abrindo. Testes na VPS:
   `cd cronograma && runuser -u gestao -- env PATH=/opt/node26/bin:$PATH npm run testar`

**Scripts de conteúdo** (`server/aplicar-*.mjs`): chegam pelo pull e rodam na VPS com o servidor parado:
`systemctl stop gestao-marketing`, depois `cd cronograma && runuser -u gestao -- /opt/node26/bin/node server/aplicar-<nome>.mjs`,
depois `systemctl start gestao-marketing`.

**reel.md salvos pela gestão**: o servidor grava `marketing/conteudo/reel-*/reel.md` na VPS. Pasta nova de reel
fica ignorada só lá (`.git/info/exclude`), então o `git status` continua limpo, mas ela não chega sozinha no
GitHub. Reel antigo salvo de novo aparece como modificado no `git status` e trava o próximo pull. Pra trazer
qualquer um dos dois: no PC,
`scp -r -i ~/.ssh/legalizai_vps root@82.112.244.145:/srv/gestao-marketing/ws/marketing/conteudo/<pasta> ../marketing/conteudo/`,
commit e push. Na VPS, se era reel antigo, `runuser -u gestao -- git checkout -- marketing/conteudo/<pasta>/reel.md`
(a versão dele já está no GitHub) e então o `git pull`. Pasta nova não precisa disso: o pull grava por cima da ignorada.

Backup de antes da troca (pasta copiada, sem os vídeos e o node_modules):
`/srv/gestao-marketing/backup-2210-antes-do-git.tar.gz`.

## Instalado nesta máquina (deploy de 22/09/2026)

- O servidor sobe sozinho quando o Windows liga (atalho **Gestão de Marketing (servidor)** na pasta
  Inicializar) e roda sem janela
- Atalho **Gestão de Marketing** na área de trabalho: garante o servidor no ar e abre o app
- Log do servidor: `data/servidor.log`
- Reinstalar: `powershell -File deploy\instalar.ps1` · Desfazer: `powershell -File deploy\desinstalar.ps1`.
  O instalar também apaga os atalhos antigos **Cronograma de Reels\*** (área de trabalho e Inicializar)
- Depois de mudar o código, reinicie: rode o desinstalar e o instalar de novo (ou reinicie o Windows)

## Login e usuários (23/09/2026)

- Toda tela e toda API pedem login. Todo mundo tem o mesmo acesso
- A tela de entrar (`/entrar`) só tem usuário e senha. Ninguém cria conta por ela, nem neste computador
- **Primeiro acesso só por link único.** No app: seu nome no rodapé do menu → **Usuários** →
  **+ Gerar link de acesso** (o nome é opcional). O link aparece uma vez só, com botão de copiar:
  mande só pra pessoa. Ele funciona **uma vez** e vence em **72 horas**. Quem abre escolhe nome, login
  e senha e já entra
- **Esqueceu a senha**: em **Usuários**, **Gerar link de redefinição** ao lado da pessoa. Ela abre o link,
  cria uma senha nova e sai de todos os outros aparelhos. Link novo de redefinição anula os anteriores
  dessa pessoa
- Em **Usuários** também ficam os links esperando uso (tipo, nome sugerido, quem criou, quando vence),
  com **Revogar**, e o **Remover** de cada pessoa (remover anula os links de redefinição dela)
- **Pelo terminal** (neste computador), quando ninguém consegue entrar:
  - `npm run usuario convite [nome]` imprime um link de primeiro acesso (é assim que nasce a
    primeira conta)
  - `npm run usuario redefinir <login>` imprime um link de senha nova
  - `npm run usuario listar` e `npm run usuario remover <login>`
- O link começa pelo `PUBLIC_URL` do `.env` (depois do túnel permanente, `https://mkt.legalizai.com.br`);
  sem ele, por `http://localhost:4317`, que só abre neste computador
- Guardado fora do git: senhas com scrypt em `data/usuarios.json`, sessões em `data/sessoes.json` e os
  links em `data/convites.json`, onde fica só o sha256 do token (o link não aparece no log nem em
  nenhuma outra tela). 5 senhas erradas seguidas travam por 15 minutos quem tenta de um aparelho novo;
  5 links inválidos, vencidos ou já usados travam os links por 15 minutos naquela rede

## Link público (Cloudflare Tunnel)

O servidor continua escutando só em 127.0.0.1; o `cloudflared` leva o tráfego do link público até
ele, sempre com HTTPS e login.

- **Link permanente** (mkt.legalizai.com.br): depois que o domínio estiver no Cloudflare,
  1. `& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel login` e escolha o domínio no navegador
  2. `powershell -ExecutionPolicy Bypass -File deploy\tunel-permanente.ps1` (o endereço padrão é
     mkt.legalizai.com.br; outro com `-Hostname outro.legalizai.com.br`)
  3. No Cloudflare: SSL/TLS → Edge Certificates → ligar "Always Use HTTPS"

  O script cria o túnel, aponta o DNS, grava `PUBLIC_HOSTS`/`PUBLIC_URL` no `.env` (os links de acesso
  passam a sair com https://mkt.legalizai.com.br), liga o túnel junto com o Windows (atalho
  **Gestão de Marketing (túnel)** na pasta Inicializar) e reinicia o app
- **Link temporário**: `powershell -ExecutionPolicy Bypass -File deploy\tunel-rapido.ps1` dá um
  endereço *.trycloudflare.com na hora, que muda a cada reinício. Com ele, os links de acesso ainda
  saem com localhost: troque o começo do link pelo endereço temporário antes de mandar

O chat usa a conta do Claude Code logada neste computador e o token do Instagram fica em
`data/instagram.json`: os dois nunca saem da máquina, só as telas passam pelo túnel.

## Rodar na mão

```bash
cd cronograma
npm install   # só na primeira vez
npm start
```

Abre em http://localhost:4317. Só escuta nesta máquina. Na primeira vez o banco v1 é convertido
pra v2 sozinho (o original fica em `data/db.v1.backup.json`). Pra rodar só a conversão:
`npm run migrar`. Sem nenhuma conta ainda, o primeiro acesso sai de `npm run usuario convite`.

O chat "Criar reel" e o "Gerar ideias com IA" usam a conta do Claude Code já logada aqui (sem
chave de API) e consomem uso da sua assinatura. Medido em 22/09/2026 no modelo padrão: um reel
completo pelo chat custou o equivalente a US$ 1,87 e uma ideia gerada, US$ 0,92. Pra baratear,
defina `CRONOGRAMA_MODEL` no `.env` (modelo em `.env.exemplo`).

## Telas (menu lateral)

| Menu | Endereço | O que faz |
|---|---|---|
| Início | `#/` | Próximo passo, atalhos pra criar, banco de ideias e biblioteca |
| Cronograma | `#/cronograma` | Peças do mês (reel, carrossel, estático, stories) no calendário, com o detalhe completo e a checagem das regras duras |
| Vídeos prontos | `#/videos` | Os vídeos finais da pasta `marketing/final`, uma proposta por cartão, com player, Baixar e o link pra peça (02/10, seção própria abaixo) |
| Banco de Ideias | `#/ideias` | Ideias do nicho contábil por tipo e assunto, com roteiro em blocos (Gancho, desenvolvimento, CTA). Fontes no botão "i". Favoritar, criar, gerar com IA (só nos 3 estilos com guia) |
| Biblioteca de Reels | `#/biblioteca` e `#/biblioteca/<id>` | Aba "Reels validados" (os 28 templates, miniatura em `public/img/templates/<codigo>.webp`) e aba "Guia de estilos". O detalhe mostra o template original e a nossa versão, com "Adaptar com a skill" |
| Métricas | `#/instagram/metricas` | Abas Visão geral (nossos reels com views relativas à mediana da conta; "Mandar pra biblioteca" vira case), Diagnóstico, Público e Semanal (30/09, seção própria abaixo), Ranking, Orgânico, Pago e Consolidado (`#/instagram/metricas/diagnostico`, `/publico`, `/semanal`, `/ranking`, `/organico`, `/pago`, `/consolidado`) |
| Inspirações | `#/instagram/inspiracoes` | Reels das contas de referência e hashtags. Viram case ou ideia |
| Pré-lançamento | `#/campanha` | A campanha da lista de espera (20/08 a 31/12/2026), meta e ritmo |

Atalhos: `#/criar` abre o "Criar reel" e `#/reel/<id>` abre o detalhe de um reel.

## Regra de validação (sem achismo)

Um formato é **validado** com:

- **2 cases** (nossos ou do nicho) rendendo **1,5× ou mais a mediana de views da própria conta** (via dado), ou
- **1 benchmark externo** com número **e** fonte citável (via benchmark), ou
- **origem registrada**: os 28 formatos da biblioteca já entram validados (a origem fica registrada
  num arquivo de referência desta pasta, fora da interface). O nosso dado entra por cima, case a case.

A regra mora em `server/db.mjs` (`statusFormato`).

## Instagram: como conectar (passo a passo)

Vocês já têm o Gerenciador de Negócios por causa dos anúncios, então o caminho é um token de
**usuário do sistema**. Precisa de alguém com acesso de administrador ao portfólio da Legalizaí.

1. **Confira a conta.** O Instagram da Legalizaí (@legalizai.app) precisa ser Profissional (Empresa
   ou Criador) e estar ligado à Página do Facebook da Legalizaí. Se vocês já impulsionam pelo
   Instagram, já está.
2. **Tenha um app da Meta.** Em developers.facebook.com, **Meus apps** → **Criar app**, tipo
   **Empresa**. Se já existe um app do negócio (de anúncios, por exemplo), pode usar esse.
3. **Ponha o app no portfólio.** Em business.facebook.com/settings, **Contas** → **Apps** →
   **Adicionar** → **Conectar um ID do app** e cole o ID do app do passo 2. Sem isso o usuário do
   sistema não enxerga o app.
4. **Crie o usuário do sistema.** Ainda nas configurações, **Usuários** → **Usuários do sistema** →
   **Adicionar**. Nome livre (ex.: "cronograma"), função **Funcionário** (Admin também funciona).
5. **Atribua os ativos a ele.** Com o usuário selecionado, **Atribuir ativos**:
   - **Apps**: o app do passo 2, com **Gerenciar app**
   - **Páginas**: a Página da Legalizaí
   - **Contas do Instagram**: a conta da Legalizaí
6. **Gere o token.** No usuário do sistema, **Gerar novo token**: escolha o app, validade **Nunca**
   e marque `instagram_basic`, `instagram_manage_insights`, `pages_show_list`,
   `pages_read_engagement`, `business_management` e `ads_read`. O `ads_read` é exigido pela Meta
   quando a Página chega pelo Gerenciador de Negócios, que é sempre o caso do usuário do sistema.
   Se a Meta não oferecer "Nunca", escolha 60 dias e reconecte antes de vencer (a data aparece em
   **Métricas**). Copie na hora: a Meta mostra o token uma vez só.
7. **Cole no app.** `npm start`, abra **Métricas**, cole o token e clique em **Conectar**. O servidor
   acha a conta do Instagram sozinho e sincroniza os nossos reels.

O token fica só nesta máquina, em `data/instagram.json` (fora do git), e nunca vai pro navegador
nem pro chat da IA (a leitura de arquivos do agente não alcança `cronograma/`). Não precisa
preencher nada no `.env` pra esse caminho. Token vencido ou recusado pela Meta aparece como
desconectado em **Métricas**, com o aviso e o campo pra colar um novo.

As métricas da nossa conta não precisam de revisão do app pela Meta, porque o token só lê ativos
do próprio portfólio. As contas de referência usam as mesmas permissões; se a Meta recusar alguma,
o erro aparece na tela em Inspirações. **Hashtags** exigem o recurso "Instagram Public Content
Access", aprovado pela Meta no app; sem ele a tela avisa e o resto continua funcionando.

Alternativa: botão "Entrar com Facebook" (OAuth). Precisa de `META_APP_ID` e `META_APP_SECRET` no
`.env` e da URL `http://localhost:4317/api/instagram/callback` cadastrada no Login do Facebook do app.

Limites da API que o sistema respeita:

- Não existe busca de "reels que bombam no nicho" na API. Em Inspirações, **Buscar novas referências** testa as
  contas de `data/referencias-candidatas.json` (montada por pesquisa na web em 24/09/2026: contadores, MEI, CNPJ,
  impostos, finanças de pequenos negócios) e põe na lista quem é conta profissional com Reels. Concorrente direto
  e conta que alguém tirou da lista ficam marcados como descartados e não voltam sozinhos
- Reels tocam no próprio card (Métricas e Inspirações). O link do vídeo vem do CDN do Instagram e vence em
  cerca de 1 a 2 dias: sincronizar renova. Quando a Meta não manda o vídeo (acontece com parte dos reels de
  outras contas) o card mostra "Assistir no Instagram"
- Limite da Meta: o Business Discovery conta chamadas por hora. Se estourar no meio da leitura, as contas que
  faltaram ficam com a leitura anterior (a tela não esvazia) e o aviso diz quais
- De outras contas vêm só views (incluindo mídia paga), curtidas e comentários. Saves, shares e retenção só dos nossos
- Scraping fora da API viola os Termos do Instagram e não é feito

## Peças e planejamento (24/09/2026)

- Cada item do cronograma é uma **peça**: `peca` (reel, carrossel, estatico, stories) e `peca2` quando o calendário
  pede duas ou deixa a escolha ("Reels/Stories", "Reels ou carrossel"). Sem valor, sai do formato escrito pelo
  calendário (`formatoTexto`, na ordem em que ele cita); item antigo sem formato é reel. O chip do calendário mostra o tipo
- **Bloco** da planilha (Educação, Afeto, Diferencial, Conversão) fica em `bloco`; sem valor, sai do pilar
  (Afeto 1 a 3; Educação 4 a 7 e 16; Diferencial 8, 9 e 17; Conversão 10 a 13). Os pilares usam os mesmos 4 blocos.
  `tipo` (Viralização, Vendas...) continua separado
- Detalhe: bloco **Planejamento** no topo (pilar, bloco, tema, formato, data, status, rede, gatilho, impulsionar,
  link, campanha), só leitura; **Editar** abre tudo em campos e salva de uma vez. Depois vem o conteúdo de cada tipo:
  roteiro do reel, `carrossel` (capa, slides, slide final de CTA), `estatico` (headline, apoio, CTA, visual) e
  `stories.quadros` (texto, visual, interação). **Copiar peça** leva tudo em texto
- O chat da skill ("Ajustar com a skill") recebe o tipo da peça e salva cada estrutura no campo dela; em peça do
  calendário o tema da planilha não muda. O reel.md sai com o tipo no título, Peça e Bloco no cabeçalho e uma seção por tipo
- A conversão das peças de outubro que já estavam escritas como carrossel ou estático (cenas "Slide N") roda uma vez
  no boot (`db.migracoes`), sem mudar uma palavra; o banco de antes fica em `data/db.antes-pecas.json`
- `npm run importar-calendario` grava o Bloco como veio da planilha e o Gatilho sem acréscimo (o aviso de preço fica nas notas)

## Cronograma, peças e ideia de cada peça (25/09/2026)

- O calendário não cria peça (saiu o "+ reel" do dia). Peça nova só pelo **Novo reel** do menu (no celular, o
  "+" do topo), que abre o "Criar". Ali se escolhe a **Peça** (Reel, Carrossel, Estático ou Stories): o título
  vira "Criar carrossel" etc., a biblioteca de formatos só aparece com Reel e o tipo vai pro chat (`peca` no
  `/api/chat`), que salva a peça com ele
- Chip do calendário: um ícone e o nome por tipo de peça. "Stories + Reel" (19/10) e "Reel + Stories" (12/10)
  mostram os dois; no celular ficam os dois ícones
- Filtro **Peça** (Todas, Reel, Carrossel, Estático, Stories) ao lado do Tipo: casa com `peca` ou `peca2`. Os
  KPIs e o mix por tipo seguem o filtro
- Detalhe: logo depois do Planejamento, o bloco **Ideia** com a ideia do banco que a peça produz (título, gancho,
  narração em parágrafos, CTA) e **Abrir no banco**. **Trocar** e a peça sem ideia têm a busca no Banco de Ideias
  (mesmo tipo primeiro, depois as livres), **Criar ideia desta peça** (o formulário vem com o que a peça já tem) e
  **Desvincular**. Tudo passa por `PUT /api/reels/:id { ideiaId }`: o servidor acerta `ideia.reelId` e solta a
  ideia de antes (`repontarIdeia`)
- Banco de Ideias: ideia usada por uma peça mostra o chip "No cronograma · 19/10 · Stories/Reel", que abre a peça,
  e o filtro Livres / No cronograma. A peça é a verdade (`reel.ideiaId`); o painel da ideia lista as peças em
  "No cronograma"

## Outra ideia (28/09/2026)

- No detalhe da peça, bloco **Ideia**: **Outra ideia** (na peça sem ideia, **Gerar ideias**) pede à IA 3 ideias pro
  mesmo lugar: mesmo dia, peça, tipo, pilar e bloco. Peça da planilha (`calendario: "csv:..."`) mantém o tema da
  planilha e as 3 são ângulos dele; peça fora da planilha ganha assunto novo dentro do pilar e do bloco. O prompt é o
  do "Gerar ideias com IA" (FATOS e PROIBIDO inteiros, reels-leo, id de fato nas fontes) com a regra P38 por extenso:
  nunca ensinar a fazer sozinho, tudo fecha no app. Opção que escorrega pra "faz você mesmo", "quem abre é você" ou
  Fator R (fora da peça dele) não aparece
- Cada opção: gancho, começo da narração (**Ler tudo** mostra o resto e a CTA) e o "i" com as fontes. **Usar esta**
  cria a ideia no banco, liga a peça a ela (a ideia de antes volta pro banco, livre), troca o título, o tema (só fora
  da planilha) e o texto da peça: reel com cenas ganha uma cena por fala (gancho, cada batida, CTA) com "em cena" em
  branco; reel sem cenas fica com gancho, desenvolvimento e CTA; carrossel, estático e stories recebem o texto com o
  visual em branco. Status volta pra Roteiro e uma nota "Revisar antes de gravar" entra no topo das notas: legenda e
  gravação não são inventadas nem apagadas. **Gerar outras** pede mais 3 sem repetir as já mostradas
- Rotas (`server/outras-ideias.mjs`): `POST /api/reels/:id/outras-ideias` começa (uma geração por usuário; a mesma
  peça devolve a que está rodando), `GET` acompanha, `POST .../usar { opcao }` aplica. As opções ficam só na memória
  do servidor, presas a quem pediu e à peça: reiniciar o servidor apaga (é só gerar de novo). Peça publicada não troca
- Sem login do Claude nada roda: aparece a frase curta de sempre e **Escolher do banco** abre a busca só com as ideias
  livres, mesmo tipo primeiro

## Stories do dia (28/09/2026)

- Uma ideia de stories por dia, fora das peças do feed: `db.stories` (data, objetivo `engajamento` ou `vendas`,
  pilar, bloco, tema, `pecaDoDia`, 1 a 6 quadros com texto, visual e interação, CTA, fontes, notas e status
  Ideia, Pronto ou Publicado). O boot cria a coleção vazia
- Calendário: uma linha discreta ao lado do número do dia (ícone e "Engaja" ou "Vende"; no celular, só o ícone).
  O interruptor **Stories do dia** na barra mostra ou esconde (fica no navegador de cada um; começa ligado). Stories
  do dia nunca contam nos KPIs nem no mix. O filtro **Peça** em Todas ou Stories mostra; em Reel, Carrossel ou
  Estático esconde. Filtro de **Tipo** esconde (tipo é do feed). O de status vale quando bate (Ideia, Publicado)
- Clicar na linha abre o painel: tema, objetivo, pilar, bloco, status (troca na hora), link pra peça do dia,
  os quadros em cards de celular, CTA e as fontes no "i". **Editar** abre tudo em campos (quadro entra e sai, de 1
  a 6); **Copiar stories** leva em texto. Início: com stories hoje e o interruptor ligado, uma linha embaixo do
  próximo passo
- Rotas: `PUT /api/stories/:id` (o dia inteiro; outra data que já tem stories dá 409) e
  `PUT /api/stories/:id/status { status }`. Validação em `server/validar.mjs` (`conferirStoriesDia`): texto acima do
  limite é recusado (quadro 500, visual 500, interação 200, tema 300, CTA 300, notas 2.000), travessão vira vírgula.
  Peça apagada solta o `pecaDoDia` que apontava pra ela
- Importar o conteúdo, com o servidor **parado**: `npm run aplicar-stories -- --simular` (confere e mostra, não
  grava) e depois `npm run aplicar-stories`. Lê `server/stories-diarios-2026-10.json` (`{ "dias": [...] }` ou a
  lista pura; outro arquivo: `node server/aplicar-stories.mjs caminho.json`). Upsert pela data; rodar de novo não
  muda nada. Recusa se a porta 4317 responde, confere tudo antes (um erro e nada é gravado; inclui as regras duras
  de copy no texto dos quadros e da CTA), liga a peça do dia só se ela existe e **nunca sobrescreve** um dia com
  status diferente de Ideia nem um dia editado na tela (os dois saem no resumo). Backup:
  `data/db.antes-stories.json` (primeira vez) e `data/db.antes-stories.ultimo.json` (cada rodada que muda algo)

## Linha editorial V1 de outubro (30/09/2026)

- A planilha `dados/legalizai-calendario-outubro-2026-v4-pre-lancamento.xlsx` (o arquivo tem esse nome; a linha
  editorial é a **V1**) virou `server/calendario-v1-2026-10.json`: as 75 linhas (13 de Feed, 62 de Stories), os 17
  pilares e as regras-base da aba Base Estrategica, e em `feed` o texto V1 das 13 peças na estrutura de cada tipo,
  com as correções de regra (PROIBIDO, FATOS e as regras duras) e o registro de cada uma
- `npm run aplicar-calendario-v1 -- --simular` e depois `npm run aplicar-calendario-v1`, com o servidor **parado**
  (recusa se a porta 4317 responde). Confere tudo antes (um erro e nada é gravado) e rodar de novo não muda nada.
  Casa cada peça pela data (`calendario: "csv:<data>"`): título, pilar, bloco, formato, gatilho e o texto V1 (reel com
  uma cena por fala e a cena em branco; carrossel e estático com o visual em branco; a legenda quando a V1 traz uma).
  Status volta pra Roteiro. Uma ideia nova no banco (`ide_v1_<aammdd>`) guarda o texto V1 e a ideia de antes volta
  livre (com o gancho, a narração e a CTA de 28/09). Nas notas da peça: "Revisar antes de gravar (V1, 30/09)",
  persona principal, horário e "relacionado a" (a tela não tem esses campos), o pilar conferido, cada "Ajuste V1" e
  o registro curto do roteiro anterior. Peça editada na tela depois da primeira rodada não muda. Backup:
  `data/db.antes-v1.json` (primeira vez) e `data/db.antes-v1.ultimo.json`. Os pilares 6 e 7 ganham "(standby desde
  01/09)" no nome (o banco não tem campo de status de pilar); 16 e 17 já existiam
- Stories do dia da V1: `server/stories-diarios-2026-10-v1.json` (manhã e tarde viram quadros do mesmo dia; pilar do
  dia é o da linha ligada à peça do feed, a outra linha fica nas notas), aplicado com
  `node server/aplicar-stories.mjs server/stories-diarios-2026-10-v1.json`

## Vídeos prontos e vídeo final da peça (02/10/2026)

Os vídeos finais ficam em `marketing/final/<AAAA-MM-DD> <nome da proposta>/`, só a última versão (guia em
`marketing/final/LEIA-ME.md`). O app só **lê** essa pasta: nunca move, renomeia nem grava nada lá. Outra pasta:
`CRONOGRAMA_FINAL` no `.env`.

- **Vídeos prontos** (menu GERAL, logo depois de Cronograma): um cartão por proposta, com o nome da pasta sem a data e
  a data por extenso ("Quarta, 14 de outubro de 2026"; pasta sem data aparece como "Sem data"). Cada vídeo tem player,
  rótulo, nome do arquivo, tamanho e **Baixar**. Com peça ligada, o cartão mostra o status e leva pra ela (reel abre o
  detalhe no cronograma; stories do dia abrem o painel); sem peça, "Fora do cronograma". **Atualizar** lê a pasta de
  novo (ela também se renova sozinha ao voltar pra tela depois de um minuto). Vídeo ligado a uma peça que saiu da pasta
  aparece num aviso no topo
- **No detalhe do reel e no painel dos stories do dia**: a seção **Vídeo final** logo depois do Planejamento, com um
  player por versão, e a pílula **Vídeo final** no cabeçalho, que leva até ela. Aviso igual em todas as versões (ex.:
  trocar a trilha) aparece uma vez só, em cima
- **No calendário**: uma bolinha coral com play no canto do chip da peça (e na linha dos stories do dia) que tem vídeo
  final; a dica do chip diz "Vídeo final pronto"
- Player: servido pelo próprio app, um tocando por vez, vídeo deitado (16:9) em duas colunas. No celular o Baixar vira
  só o ícone
  - **Na página Vídeos prontos**, cada vídeo mostra uma **capa** (um quadro perto de 1 s, em JPEG de 6 a 47 KB) e o
    player fica com `preload="none"`: abrir e rolar a página só baixa as capas e o vídeo só é lido no play. A capa é
    feita pelo ffmpeg na primeira vez e fica em `data/capas-videos/` (nunca na pasta final; vídeo refeito no lugar
    ganha capa nova). Sem ffmpeg, a capa dá 404 e a página volta pro `preload="metadata"`. Outro ffmpeg:
    `CRONOGRAMA_FFMPEG` no `.env`
  - **No detalhe do reel e nos stories**, `preload="metadata"`: o vídeo já aparece no primeiro quadro, pronto pra tocar
  - Peso medido no Edge, na cópia, com um proxy que conta os bytes entregues (02/10): rolar a página inteira (15
    vídeos) caiu de uns 70 MB pra uns 450 KB de capas, sem nenhum byte de vídeo; abrir a página, de 11 a 14 MB pra 90
    a 125 KB. O detalhe do 02/10 (3 versões, as de taxa mais alta) caiu de 15,6 MB pra 9,5 MB, o de 14/10 de 3,6 MB
    pra 1 MB, e os stories de 01/10 ficam em 5 MB. O motivo: com `preload="metadata"` o Edge lê cada vídeo até ter o
    bastante pra tocar (de 1 a 12 MB, conforme a taxa do vídeo)
  - Entrega em pedaços: o player do Chrome, do Edge e do Firefox pedia o resto do arquivo e o servidor mandava tudo,
    então o navegador lia vários MB a mais antes de parar. Agora o pedido até o fim do arquivo recebe um pedaço (metade
    da posição, de 1 MB a 4 MB) e o navegador pede o seguinte quando precisa. Safari, iPhone e iPad (o player da Apple
    confere o tamanho), o Baixar e a retomada de download recebem o que pediram
- Dados: `videos: [{ arquivo, rotulo, aviso? }]` no reel e nos stories do dia, contrato no `SPEC.md` §3.6 (validação
  em `server/db.mjs`, `limparVideos`). A tela não edita o campo: quem grava é o script abaixo (ou a API)
- Rotas (`server/videos.mjs`): `GET /api/videos` (as propostas, as peças de cada arquivo e o endereço da capa) e
  `GET /videos/<caminho>` (o arquivo, com Range, só com login e só de dentro da pasta: `..`, caminho absoluto, barra
  invertida, pasta escondida, link que sai da pasta e extensão que não é de vídeo são recusados; com `?capa=`, a capa).
  Quem está com senha temporária recebe 403 no vídeo e na capa, como na API. `Cache-Control: private`: a Cloudflare
  guarda .mp4 por padrão e, sem isso, entregaria o vídeo do cache do túnel pra quem não entrou
- Nome de arquivo com travessão: o caminho fica como está no banco, inclusive no boot (a migração que tira travessão
  de todo texto da peça pula `videos[].arquivo`); rótulo e aviso seguem sem travessão e a tela troca no nome mostrado
- `/api/estado` leva `videosFinais` (a versão da área). A tela só mostra a área com 2 ou mais. O servidor que subiu em
  02/10 às 15:37 mandava `true` e **caía** quando o navegador cortava um pedido de vídeo enquanto o arquivo abria (o
  arquivo ficava aberto e, no Node 26, a coleta de lixo que fecha arquivo esquecido derruba o processo). A versão 2
  fecha o arquivo sempre; o teste `entrega: pedido cortado...` reproduz o caso
- Aba aberta e servidor reiniciado: `/api/versao` leva a hora em que o servidor subiu, então a aba recarrega sozinha
  (na conferida de cada minuto ou quando volta pra frente), menos com painel aberto ou vídeo tocando. Antes disso, a
  aba aberta seguia com o `/api/estado` do servidor antigo até alguém apertar F5

**Ligar os vídeos às peças de outubro**, com o servidor **parado**:
`npm run aplicar-videos -- --simular` (confere e mostra) e depois `npm run aplicar-videos`
(`server/aplicar-videos-2026-10.mjs`). Recusa se a porta 4317 responde. Confere tudo antes de gravar (a peça existe, a
data dela é a da pasta, a pasta e os arquivos existem com o nome exato e passam nas regras); um problema e nada é
gravado. Status só anda pra frente (peça publicada continua publicada), vídeo entra ou é atualizado pelo arquivo e
rodar de novo não muda nada. Backup: `data/db.antes-videos.json` (primeira vez) e `data/db.antes-videos.ultimo.json`.
Liga: o reel de 14/10 (Motion, status Editado), o de 02/10 (Com o Léo, Motion e B-roll, com o aviso da trilha do
Epidemic), o de 29/09 da encomenda (Completo e Corte de 15 s, segue Publicado) e os stories de 01/10 (Com o Léo e
Motion, com o aviso da trilha, status Pronto). Com `CRONOGRAMA_DATA` roda numa cópia (aí confere a porta de `PORT`)

**Depois da troca da trilha do Epidemic** (os 5 vídeos dos 3 sinais e da Abertura do mês), com o servidor parado:
`node server/aplicar-videos-2026-10.mjs --sem-aviso-trilha` (primeiro com `--simular`). Ela tira o aviso "Trocar a
trilha antes de postar". **Rodar sem ela põe o aviso de volta**: depois da troca, rode sempre com ela. Se o vídeo
refeito ganhar outro nome, troque o nome no `PLANO` do script: o arquivo velho da mesma pasta que saiu da pasta final
(foi pra `_versoes-anteriores`) sai da peça sozinho. Opção escrita errada é recusada sem gravar nada. Com o servidor no
ar, o caminho é a API: `PUT /api/reels/reel_c261002` e `PUT /api/stories/sto_89e98cb6` com o `videos` inteiro, sem o
`aviso`

Testes: `server/testes/videos.test.mjs` (regras do caminho, lista, Range, pedaços do player, ETag, recusas, junção
pra fora da pasta, o pedido cortado, a trava da senha temporária, o boot com travessão no nome do arquivo e a capa
feita pelo ffmpeg), numa pasta temporária com arquivos falsos e vídeos de 2 s feitos pelo ffmpeg (sem ffmpeg, o
teste da capa é pulado).

## Por que esse reel funcionou (24/09/2026)

Em Inspirações e Métricas, clicar no card (fora do play) abre o painel com o vídeo, os fatos e a análise.

- **Fatos, sem IA**: views, curtidas, comentários, views × mediana da conta, taxa de curtida e de comentário
  contra a mediana dessas taxas na mesma conta (dos reels que estão no cache), views ÷ seguidores, dia e hora
  (Brasília), legenda (tamanho, primeira linha, hashtags, menções) e duração
- **Analisar este reel**: baixa o vídeo pra uma pasta temporária, tira ~10 quadros (0; 0,5; 1; 1,5 e 2,5s e
  mais 5 espalhados), transcreve o áudio com faster-whisper (`server/transcrever.py`, no Python do venv da skill
  corte-viral; modelo `small`, troque com `ANALISE_WHISPER_MODELO`) e manda tudo pro Claude (conta logada, só lê
  os quadros). Cada afirmação cita evidência (quadro, fala, legenda ou número) e o servidor confere: citação que
  não bate com o vídeo, a transcrição ou a legenda sai. Leva de 1 a 2 minutos, uma análise por vez
- Fica em `data/analises/<midiaId>.json` + 3 quadros-chave em webp (fora do git). Vídeo e quadros de trabalho
  são apagados no fim. **Refazer análise** roda de novo
- ffmpeg: pelo PATH, `FFMPEG_DIR` no `.env` ou a instalação do winget (Gyan.FFmpeg). Python: `ANALISE_PYTHON`
- Sem login do Claude, a tela mostra os fatos e o aviso pra rodar `claude` e `/login` num terminal
- **Virar ideia** a partir do painel leva a adaptação pra descrição da ideia e o porquê pras notas; **Mandar pra
  biblioteca** já vem com o formato que a análise apontou

## Métricas: Ranking e Monitoramento (24/09/2026)

- **Sincronizar** agora pagina todas as mídias da nossa conta e junta com o que já estava salvo: post
  antigo nunca sai. Reels ficam em `db.instagram.proprios`; foto e carrossel em `db.instagram.postsProprios`.
  Insight custa uma chamada por post, então só relê os posts dos últimos 90 dias, os que nunca foram lidos,
  os que deram erro e os lidos há mais de 30 dias. A métrica que a Meta recusa pra um tipo de post sai da
  lista daquele tipo (anotado em `db.instagram.metricasApi`). Seguidores novos por dia ficam em
  `db.instagram.diario`
- O que a API v26.0 devolveu pra nossa conta em 24/09: Reels com views, alcance, salvamentos,
  compartilhamentos, curtidas, comentários, interações, tempo médio assistido e taxa de pulo; foto e
  carrossel com os mesmos (sem tempo e pulo) mais visitas ao perfil e seguidores. Não vem: impressões (a Meta
  trocou por views, e a coluna Impressões mostra views), taxa de conclusão, clique no link da bio por post,
  visitas ao perfil e seguidores de Reels, e nada do Facebook
- **Ranking**: os 5 reels que mais renderam no período (semanal, mensal, trimestral, semestral ou anual),
  escolhido num mini calendário 3D (clicar na semana, no mês ou no trimestre; setas do teclado andam de
  período). Métricas: views (padrão), engajamento, taxa de engajamento, salvamentos e compartilhamentos, com
  o "× mediana" de views ao lado. Clicar no reel abre "Por que esse reel funcionou"
- **Orgânico, Pago e Consolidado**: as 3 abas de monitoramento da planilha oficial do calendário, por mês.
  Guardadas em `data/monitoramento.json` (`server/monitoramento.mjs`, rotas `/api/monitoramento/:mes`)
  - Orgânico: uma linha por item do cronograma no mês, mais os posts nossos publicados fora dele. Colando o
    link do post, a linha do Instagram se preenche sozinha na próxima leitura (os números da API ficam
    travados); o resto e o Facebook são à mão. A aba Soma junta as duas redes
  - Pago: semanas de segunda a domingo cortadas no mês, um bloco por conjunto (os 4 de outubro já vêm; mês
    novo herda os do anterior; "Conjuntos do mês" adiciona, renomeia e remove). Taxa de qualificação, CPL
    bruto e CPL qualificado saem sozinhos. A coluna Escala compara o gasto por dia com a semana anterior
    (semana cortada no mês não conta como escalar) e marca quando passa de 20%
  - Consolidado: cadastros pago Meta e Google vêm dos leads brutos da aba Pago quando ninguém digitou;
    total, investimento, custo por cadastro, distância da meta de split (MEI 30% · ME 70%), o post que
    mais salvou e compartilhou na semana e o "escalou mais de 20%" saem sozinhos
  - Enter salva e desce pra linha de baixo; Esc desfaz o campo

## Métricas: Diagnóstico, Público e Semanal (30/09/2026)

Três abas novas em **Métricas** (`#/instagram/metricas/diagnostico`, `/publico` e `/semanal`). O contrato está em
`SPEC-METRICAS.md`. A pergunta que elas respondem: por que uma peça foi bem ou mal, quem assiste, e o que levar pra
próxima peça pra fazer pelo menos o dobro.

- **Diagnóstico**: a meta de 2× de cada tipo (base, meta e como foi a última peça), as pendências com o botão que
  resolve (ligar post a peça, etiquetar com IA, números do app, conectar anúncios), "O que os números mostram"
  (Fazer mais, Evitar, Testar, No planejamento), pilares e mecanismos (o efeito de cada valor contra a base), a
  lista de peças com meta, score, gargalo e ponto forte, as hipóteses em teste e os stories de 14 dias. Clicar num
  post abre o painel: vínculo com a peça do cronograma, meta e veredito, "Por que foi bem" e "Por que foi mal", o
  funil (gancho, retenção, distribuição, ação por pessoa alcançada, interesse no perfil), os mecanismos com a fonte
  de cada um (dá pra corrigir no seletor), os números do app, o público do post, "Teve anúncio" e a análise do vídeo
- **Etiquetar com IA**: a IA olha o vídeo (quadros e transcrição) ou as imagens do post e marca os mecanismos
  (família e forma do gancho, rosto e texto no começo, tela do app, gatilho, CTA, quem fala, humor, áudio, preço).
  Ela não vê nenhum número de desempenho, e cada marca cita a evidência (quadro, fala, legenda ou imagem) que o
  servidor confere; marca sem evidência sai. Uma etiquetagem por vez, na mesma fila da análise do vídeo
- **Público**: quem segue e quem engaja (idade, gênero, cidade, país) com a frase pronta (na leitura de 30/09: "Dos
  107 seguidores com dado: 64% são homens, 27% mulheres... Homens de 35 anos ou mais são 44% do total. O restante são
  principalmente mulheres de 25 a 44 anos (22%) e homens de 25 a 34 (16%). 52% estão em Belo Horizonte"), a fonte e a
  data. Com 118 seguidores e poucas interações, a Meta ainda recusa o público de quem engaja e de quem foi alcançado
  (precisa de 100 contas na janela); a aba mostra o motivo; quanto do alcance vem de quem não segue; quem seguiu e quem deixou de seguir;
  horários; as personas contra o público real; o público de cada post (pago e do app) e a conexão dos anúncios.
  **Atualizar agora** lê tudo de novo, até o que a Meta recusou nos últimos 7 dias
- **Semanal**: um resumo por semana (segunda a domingo): peças publicadas, metas batidas, melhor e pior peça e o
  porquê, mecanismos e hipóteses, público, stories e as peças da semana seguinte com a meta e as recomendações de
  cada uma. **Gerar agora**, **Escrever leitura com IA** e **Copiar resumo** (texto puro pro WhatsApp). Todo número
  do resumo mora num fato numerado (F1, F2...); a leitura com IA só recebe esses fatos, cada frase dela cita os
  fatos que usou, e frase com número que não está nos fatos citados sai (data e título do fato não valem como
  número). Metas batidas, mediana e melhor e pior peça contam só as peças com 7 dias e sem anúncio; as outras
  aparecem à parte ("2 peças ainda têm menos de 7 dias"). Fica em `data/relatorios/<AAAA-Www>.json`

### A meta de 2× (decisão do Pedro, 30/09)

"Foi bem" depende do tipo da peça:

| Tipo | O que conta |
|---|---|
| Viralização | Alcance |
| Ensino | Salvamentos |
| Conselho | Salvamentos e compartilhamentos |
| Conexão | Comentários e compartilhamentos |
| Vendas | Seguidores, visitas ao perfil e cliques no link |
| Sem tipo | Alcance |

- A base é a **mediana das últimas 5 peças do mesmo tipo e do mesmo formato** (reel com reel; foto e carrossel
  juntos), publicadas antes e sem anúncio. Com menos de 3, vale o mesmo tipo em qualquer formato, com aviso (nunca pra
  peça sem tipo); com menos de 3 de novo, as 5 anteriores do mesmo formato, com aviso; com menos de 3 no total, a peça
  fica "ainda sem base". O formato entrou na regra depois do teste com os dados reais (30/09): na conta, um reel chega
  a mil contas e um carrossel a dezenas, e misturar os dois dava meta errada
- Meta = 2× a base, arredondada pra cima (ação é número inteiro), e bateu = chegou na meta. Base menor que 10 ganha
  +1 dos dois lados (salvamento com mediana 0 tem meta 1, não infinito). Quem não bateu nunca aparece como "2×":
  1,96× sai "1,9×"
- O número comparado é o de 7 dias no ar: o app guarda as leituras de cada post pra comparar peças na mesma idade.
  Peça mais nova mostra o número provisório e, quando dá, o ritmo contra as outras na mesma idade
- Post com anúncio aparece, mas fica fora da base e dos efeitos
- Reels de Vendas: a API não dá seguidores nem cliques por reel. Os números saem da tela do post no app do Instagram
  e entram no painel do post, em **Números do app**

### Onde os insights aparecem

- Na aba **Diagnóstico**, em cartões, sempre com o número de peças e a evidência (forte, moderada ou fraca). Uma peça
  só nunca vira insight, e insight nunca afirma causa ("tende a", "nas 4 peças")
- No detalhe da peça, no **Cronograma**: bloco **Métricas desta peça**, com a meta e até 3 recomendações. **Aplicar**
  vira uma hipótese, que o app confere quando o post ligado à peça faz 7 dias. Peça publicada mostra o resultado
  contra a meta
- Na IA de criação (**Criar reel**, **Gerar ideias com IA** e **Outra ideia**): um bloco curto com a meta e o que os
  números mostram, como orientação de mecanismo (gancho, duração, CTA, formato). Nenhum número dele entra na peça: a
  base contábil e as regras duras mandam
- No **Semanal**, toda segunda

### Agenda automática

O servidor lê sozinho, num laço que gira a cada 30 minutos (o primeiro giro, 2 minutos depois de ligar):

| Tarefa | Quando |
|---|---|
| Ler os posts do Instagram | a cada 3 horas (o "Sincronizar agora" de alguém também conta; o das Inspirações, não) |
| Avaliar as hipóteses | depois de cada leitura dos posts |
| Capturar os stories | a cada hora (story só tem número enquanto está no ar, 24 horas) |
| Ler o público da conta | uma vez por dia; leitura cortada (limite da Meta, rede fora) tenta de novo em 1 hora |
| Ler os anúncios | a cada 12 horas, com a conta de anúncios escolhida e o token dos anúncios valendo |
| Gerar o resumo semanal | segunda a partir das 7h (Brasília), depois da primeira leitura dos posts na semana nova |

- **O semanal espera os números fecharem.** O da segunda só sai depois de uma leitura dos nossos posts feita com a
  semana já acabada; sem ela (Instagram desconectado, por exemplo), sai na terça às 7h com a data da leitura que
  usou, e é gerado de novo quando a leitura chegar. Na segunda quase toda peça da semana ainda tem menos de 7 dias:
  por isso o resumo dela é gerado de novo na segunda seguinte, quando todas já fizeram 7 dias. A leitura com IA
  fica quando os fatos não mudaram
- **Só roda com este computador e o servidor ligados.** Não tem nada na nuvem: computador desligado não lê nada. O
  que passou da hora roda no primeiro giro depois de ligar (o semanal de uma segunda perdida sai na terça). Story que
  saiu do ar com o computador desligado fica sem número
- Uma tarefa por vez, e erro numa não para as outras. A última rodada de cada tarefa, a próxima e os últimos erros
  vão junto com o Diagnóstico e ficam em `GET /api/metricas/agenda`; `POST /api/metricas/agenda/<tarefa>` roda uma
  tarefa na hora
- Guardado em `data/agenda.json`. `CRONOGRAMA_AGENDA=0` no ambiente desliga o laço (servidor de teste)

### Anúncios: como conectar (passo a passo)

Idade, gênero e região POR POST só existem do lado pago. Vocês promovem pelo Gerenciador de Anúncios usando o post
já publicado, e o anúncio aponta pra mídia orgânica: com a conta de anúncios ligada, o app acha o post de cada anúncio
e lê o alcance pago dele por idade, gênero e região.

1. **Atribua a conta de anúncios ao usuário do sistema.** Em business.facebook.com/settings, **Usuários** →
   **Usuários do sistema** → o usuário do app (o do passo 4 do Instagram) → **Atribuir ativos** → **Contas de
   anúncios** → a conta da Legalizaí, com a permissão **Ver desempenho**
2. **Gere o token de novo** nesse usuário, com as mesmas permissões do Instagram (inclusive `ads_read`). Copie na hora
3. **Cole no app**: **Métricas** → **Público** → **Anúncios** → cole o mesmo token do usuário do sistema e clique em
   **Conectar**
4. **Escolha a conta de anúncios** na lista. O app lê os anúncios na hora e depois a cada 12 horas

Sem conta atribuída ou sem `ads_read`, a própria tela explica o que falta. O token fica em `data/instagram.json` (fora
do git) e nunca vai pro navegador nem pro log.

### O que a API da Meta não dá (e como o app preenche)

- **Idade, gênero e cidade de quem viu um post**: não existem pra post orgânico. Saem do anúncio ligado ao post ou da
  tela de público do post no app do Instagram: **Informar do app** (digitado) ou **Ler do print** (até 3 prints, 4 MB
  cada e 12 MB juntos; a IA lê o print e devolve uma sugestão pro formulário; nada é gravado sem o **Salvar**, e a
  imagem é apagada no fim)
- **Seguidores, visitas ao perfil e cliques no link por reel**: a Meta não dá pra Reels. Entram à mão em **Números do
  app**, no painel do post. Foto e carrossel trazem pela API
- **Duração do reel**: não vem na API; sai da análise do vídeo ou da etiquetagem com IA. A retenção em % (tempo médio
  ÷ duração) só aparece quando os reels da base também têm a duração medida: etiquete os posts antigos com IA
- **Stories**: só têm número enquanto estão no ar, por isso a captura de hora em hora
- **Público da conta**: só agregado, só com 100 seguidores ou mais, janela da semana ou do mês e sem histórico na API
  (o app guarda cada leitura). O que a Meta não devolve aparece na aba como "a Meta não devolve isso pra esta conta"
- Número que não veio aparece como "sem dado", nunca como zero

### Privacidade

- Só número agregado: nenhum perfil por pessoa e nenhuma tentativa de adivinhar idade ou gênero de quem comentou
  (Termos da Meta e LGPD)
- Grupo com menos de 5 pessoas não vira frase nem rótulo. No público do post lido da tela do app, as pessoas da base
  são as contas que a tela mostra (campo **Contas na base**); sem ele, o alcance do post ou, na tela de contas com
  engajamento, o maior entre curtidas e salvamentos (comentário e compartilhamento repetem a mesma conta). Sem nenhum
  desses números, nenhuma frase sai
- Token e segredos nunca vão pro navegador, pro log nem pro texto da IA; o que a IA escreve passa por uma checagem de
  credencial antes de gravar

### IA: custo e o conserto de 30/09

- Etiquetar um post, analisar um vídeo, ler um print e escrever a leitura do semanal usam a conta do Claude Code
  logada neste computador (sem chave de API) e gastam uso da assinatura. Medido em 30/09 no modelo padrão: a análise
  de um reel de 15s custou o equivalente a US$ 1,63; a etiquetagem, menos. Pra baratear só as tarefas de Métricas,
  defina `METRICAS_MODEL` no `.env` (vazio = `CRONOGRAMA_MODEL`, e depois o padrão do Claude Code). O "Etiquetar com
  IA" em lote pega no máximo 30 posts por vez, um de cada vez
- Até 30/09 a análise "Por que esse reel funcionou" nunca chegava a gravar: a trava que deixa a IA ler só os quadros
  também barrava a ferramenta interna com que ela entrega a resposta (`StructuredOutput`). Liberada só ela, a análise,
  a etiquetagem e a leitura de print passaram a funcionar (conferido com o reel de 29/09)

### Arquivos e testes

- `data/historico-midias.json` (as leituras de cada post por idade), `stories-metricas.json` (os números de cada
  story, que a Meta apaga em 24 horas) e `publico.json` (a leitura de cada dia da conta e o público de cada post,
  digitado ou lido do print) são **registro nosso**: a API não refaz nenhum deles. Entram no git, como o `db.json`,
  o `mecanismos.json` e o `hipoteses.json` (trabalho do time). **Não apague nenhum deles pra liberar espaço**
- Fora do git ficam só os que a API ou um botão refazem: `anuncios.json`, `agenda.json` e `relatorios/`. A cópia
  de um arquivo com o JSON quebrado (`<nome>.quebrado-<quando>.json`) também fica fora (a do `instagram.json` leva o
  token)
- `npm run check` confere a sintaxe de todos os módulos; `npm run testar` roda os testes (`server/testes/`)
- Servidor de teste numa cópia, sem agenda e sem mexer no banco de verdade: copie `data/db.json` pra uma pasta e
  rode `CRONOGRAMA_DATA=<pasta> PORT=4399 CRONOGRAMA_AGENDA=0 node server/server.mjs` (no PowerShell:
  `$env:CRONOGRAMA_DATA='<pasta>'; $env:PORT='4399'; $env:CRONOGRAMA_AGENDA='0'; node server/server.mjs`). A primeira
  conta dessa cópia sai de `npm run usuario convite`, com o mesmo `CRONOGRAMA_DATA`. Pra testar uma mudança de tela
  sem que ela entre no ar (o servidor de verdade serve `public/` direto), copie `public/` pra outra pasta, mude lá e
  aponte `CRONOGRAMA_PUBLIC=<pasta>` no servidor de teste

## Arquivos

- `data/db.json`: o banco (schemaVersion 2). Nasce de `data/seed.json` + `data/biblioteca.json` +
  `data/ideias.json`. Entrada nova nesses arquivos entra no próximo boot; entrada que você editou
  nunca é sobrescrita; entrada que você apagou não volta
- Todo reel salvo pelo chat também vira `marketing/conteudo/reel-<tema>-<data>/reel.md` (com `-2`,
  `-3` antes da data se o nome já estiver em uso). Reel importado de um `reel.md` escrito à mão:
  o primeiro salvamento pelo chat guarda o original em `reel.original.md` e mantém no novo as
  partes que o chat não gera (Visual, Fontes, guarda-corpos)
- Um post vira um case só: mandar o mesmo reel pra biblioteca de novo reclassifica o case que já existe
- Login: `server/auth.mjs` (sessão, senha, limites) e `server/convites.mjs` (links únicos e as rotas
  `/api/usuarios`, `/api/convites`, `/api/auth/convite`). O link só aparece na resposta de quem cria
  (`POST /api/convites`, `POST /api/usuarios/:id/redefinir` e o terminal); `data/convites.json` guarda o
  sha256, e usado ou vencido sai do arquivo depois de 30 dias
- Front sem build: `public/index.html`, `public/js/` (um módulo por tela) e `public/css/`
- Cores e fonte vêm direto de `identidade/tokens.css` (tema escuro por padrão, botão alterna pro claro)
