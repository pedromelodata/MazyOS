# Gestão de Marketing (v2)

A Gestão de Marketing é o sistema interno do marketing do Legalizaí: planejamento, execução e análise
de conteúdo num lugar só. Tem banco de ideias do nicho contábil nos estilos Viralização, Vendas e
Conexão, Biblioteca de Reels com 28 formatos validados + os 6 nossos em teste, o Cronograma do mês,
criação guiada pela skill **reels-curtos** e métricas do Instagram. O contrato completo está em
`SPEC.md`. (A pasta `cronograma/` e os nomes no código continuam
com o nome antigo do app.)

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
| Cronograma | `#/cronograma` | Reels do mês em lista ou calendário, com o detalhe completo e a checagem das regras duras |
| Banco de Ideias | `#/ideias` | Ideias do nicho contábil por estilo (Viralização, Vendas, Conexão) e assunto, com roteiro base. Favoritar, criar, gerar com IA |
| Biblioteca de Reels | `#/biblioteca` e `#/biblioteca/<id>` | Formatos com estrutura, exemplo, validação, cases e evidências |
| Métricas | `#/instagram/metricas` | Nossos reels com views relativas à mediana da conta. "Mandar pra biblioteca" vira case |
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

- Não existe busca de "reels que bombam no nicho". As contas de referência e hashtags quem escolhe é você
- De outras contas vêm só views (incluindo mídia paga), curtidas e comentários. Saves, shares e retenção só dos nossos
- Scraping fora da API viola os Termos do Instagram e não é feito

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
