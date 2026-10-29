# MazyOS — Sistema operacional do negócio

Sua empresa roda em cima desse arquivo. Aqui ficam as regras de operação
do MazyOS — como o Claude lê o contexto, aprende com correções, mantém
tudo atualizado e cria skills novas conforme a operação evolui.

Esse arquivo é editável. Quando o `/instalar` rodar, ele complementa o
final dessa página com as regras específicas do seu negócio.

---

## Contexto do negócio

No início de toda conversa, ler os seguintes arquivos (quando existirem
e estiverem preenchidos):

1. `_memoria/empresa.md` — quem é o usuário, o que faz, como funciona o negócio
2. `_memoria/preferencias.md` — tom de voz, estilo de escrita, o que evitar
3. `_memoria/estrategia.md` — foco atual, prioridades, prazos

Usar essas informações como base pra qualquer resposta ou decisão. Ao
sugerir prioridades, formatos ou abordagens, considerar o foco atual
descrito em `estrategia.md`.

Pra qualquer tarefa visual (carrossel, post, landing page), consultar
`identidade/design-guide.md` como referência de estilo.

Não é necessário listar o que foi lido nem confirmar a leitura. Apenas
usar o contexto naturalmente.

---

## Fluxo de trabalho

Antes de executar qualquer tarefa, verificar se existe skill relevante
em `.claude/skills/`. Se encontrar, seguir as instruções da skill. Se
não encontrar, executar a tarefa normalmente.

Ao concluir uma tarefa que não tinha skill mas parece repetível (o
usuário provavelmente vai pedir de novo no futuro), perguntar:

> "Isso pode virar uma skill pra próxima vez. Quer que eu crie?"

Não perguntar pra tarefas pontuais ou perguntas simples. Só quando o
padrão de repetição for claro.

---

## Aprender com correções

Quando o usuário corrigir algo, melhorar uma resposta ou dar uma
instrução que parece permanente (frases como "na verdade é assim", "não
faça mais isso", "prefiro assim", "sempre que...", "evita...", "da
próxima vez..."), perguntar:

> "Quer que eu salve isso pra não precisar repetir?"

Se sim, identificar onde faz mais sentido salvar:

- **Sobre o negócio** (clientes, serviços, mercado) → `_memoria/empresa.md`
- **Sobre preferências e estilo** (tom de voz, formato, o que evitar) → `_memoria/preferencias.md`
- **Sobre prioridades e foco** (projetos, metas, prazos) → `_memoria/estrategia.md`
- **Regra de comportamento nessa pasta** → próprio `CLAUDE.md`

Salvar com uma linha nova clara, sem reformatar o arquivo inteiro.
Confirmar mostrando a linha adicionada.

Não perguntar se a correção for óbvia de contexto imediato (ex: "na
verdade o arquivo se chama X"). Só perguntar quando a informação tiver
valor duradouro.

---

## Manter contexto atualizado

Ao terminar uma tarefa que mudou algo relevante (cliente novo, skill
nova, mudança de foco, processo novo, ferramenta instalada, estrutura
alterada), perguntar:

> "Isso mudou algo no teu contexto. Quer que eu atualize a memória?"

Se sim, identificar o que atualizar:

- **Cliente, serviço, ferramenta, equipe** → `_memoria/empresa.md`
- **Mudança de prioridade ou foco** → `_memoria/estrategia.md`
- **Tom ou estilo** → `_memoria/preferencias.md`
- **Pasta, regra de organização, skill criada** → `CLAUDE.md`
- **Visual (cores, fontes, logo)** → `identidade/design-guide.md`

Mostrar o que vai mudar antes de salvar. Não reformatar o arquivo
inteiro, só adicionar ou editar a linha relevante.

**Quando NÃO perguntar:**
- Tarefas pontuais sem impacto no contexto (escrever um email avulso, criar um post)
- Perguntas simples ou conversas sem ação
- Mudanças já salvas pelo bloco "Aprender com correções"

**Dica:** rode `/atualizar` pra uma varredura completa quando houver dúvida.

---

## Criação de skills

Quando o usuário pedir skill nova:

1. Verificar se existe template relevante em `templates/skills/`. Se
   existir, usar como base e adaptar pro contexto
2. Perguntar se é específica desse projeto ou útil em qualquer:
   - Específica → `.claude/skills/nome-da-skill/SKILL.md` (local)
   - Universal → `~/.claude/skills/nome-da-skill/SKILL.md` (global)
3. Ler `_memoria/empresa.md` e `_memoria/preferencias.md` pra calibrar
   o conteúdo da skill ao contexto do negócio
4. Se a skill precisar de arquivos de apoio (templates, exemplos),
   criar dentro da pasta da skill
5. Seguir o fluxo da skill-creator nativa do Claude Code

---

## Regras específicas — Legalizaí (instalado 01/09/2026)

Este workspace opera o marketing do **Legalizaí** (contabilidade digital, BH/MG).

- Pacote completo de marca/personas/ICP/estratégia: `identidade/brandmkt/` (extraído do
  vault em 01/09/2026 — cópia fiel; o vault do produto segue sendo a fonte viva)
- Em conflito entre documentos, a autoridade é o ADR
  `identidade/brandmkt/01-marca/decisoes-marca.md` (entradas mais recentes no fim)
- As REGRAS DURAS de copy (zero travessão, zero concorrente nomeado, MEI sem contador
  humano, escassez só real, número com fonte, grafia "Legalizaí") estão em
  `_memoria/preferencias.md` e valem pra QUALQUER peça pública, sem exceção
- Antes de qualquer peça: ler `_memoria/*.md` + `identidade/design-guide.md`. Pra nuance
  de persona, ler o arquivo da dorsal em `identidade/brandmkt/02-personas/`
- Tipografia das peças é **Sora** (não Inter). Peso máximo 800
- **Estratégia principal de conteúdo: `marketing/estrategia/ESTRATEGIA-PRINCIPAL.md`** (Pedro, 21/10/2026: a anatomia do
  orgânico, o volume semanal de 3 reels + 5 feeds + 5 temas de stories e o calendário da semana, do repo `legalizei`,
  auditados contra o FATOS e o PROIBIDO). Toda pauta, calendário e peça seguem ela. O calendário de cada semana vem do
  repo (`mkt/redes-sociais/instagram/`), passa pela auditoria e entra no cronograma
- **Nunca citar o Mauro, o escritório Legalize nem os "22 anos"** (Pedro, 21/10/2026; PROIBIDO P39). Vale por
  cima do `identidade/brandmkt/`, do ADR e do vault, que ainda falam deles (o mote de 25/10 cita "22 anos" no
  pilar História, no Google e na ideia "Do outro lado": segue fora até o Pedro liberar)
- **Campanha de lançamento: o mote manda em TODA peça estática e em TODO vídeo** (Pedro, 26/10/2026: "daqui para
  frente, todos os nossos conteúdos estáticos e vídeos vão seguir exatamente essas estratégias, identidade visual,
  unidade visual"). Os documentos são do vault (`legalizai-time/legalizei`), espelhados por
  `scripts/sincronizar-base-contabil.mjs --vault C:\vault-legalizei` em `_base-contabil/`:
  - `lancamento/2026-10-25-mote-do-lancamento-arquitetura.md`: as 4 camadas (mote-mãe "100% digital. E 100% humana." ·
    promessa "A gente devolve o seu tempo." · promocional "A parte chata muda de dono.", que muda por fase · fecho
    "Vai, legaliza aí." com vírgula), as 6 regras de toda peça (§0), as personas, o "PJtinha" e os exemplos por mídia
  - `lancamento/2026-10-25-matriz-criativos-trafego.md` (o que cada campanha pede) e
    `lancamento/2026-10-25-roteiros-video-100-digital-100-humana.md` (os 3 roteiros de vídeo)
  - `video-ia/README.md`, `estilo-luz-coral.md` e `aprendizados.md`: o **motor de vídeo** e a **identidade visual
    "Luz Coral"** (golden hour, altas luzes coral, sombras em ink, nunca preto; luz motivada, névoa, grão; um objeto
    coral por quadro). O bloco de estilo fecha todo prompt de imagem e de vídeo; um gesto por take; quadro de início
    feito antes; câmera travada. Vale também para os vídeos do Léo
  - Prévia antes de gastar crédito (Pedro, 26/10): quadros-chave e prévia em vídeo (Veo) vão para ele aprovar antes
    do take final
  - Quando vier outro mote de campanha, o Pedro avisa; até lá, este. As peças desta semana já planejadas seguem pelo
    menos a unidade visual
- `cronograma/` é o app da equipe pra planejar reels (http://localhost:4317 com login; link público via
  Cloudflare Tunnel; sobe sozinho com o
  Windows; ver `cronograma/README.md`). Reel salvo por ele também vira
  `marketing/conteudo/reel-<tema>-<data>/reel.md`. Formato só conta como validado pela regra de
  `cronograma/server/db.mjs` (dado próprio, benchmark com fonte ou formato da biblioteca)
- **Subir pra VPS ao fim de cada coisa** (Pedro, 26/10/2026: "Ao final de cada coisa que fizer, suba direto para o
  servidor na VPS"): terminou uma mudança que o sistema usa (código do `cronograma/`, skills, `_memoria/`,
  `_base-contabil/`) e os testes passaram, sobe sem perguntar: commit só dos arquivos da tarefa (nunca o trabalho em
  andamento de outra sessão em `marketing/`), push no `main` e deploy pelo fluxo do `cronograma/README.md` (pull,
  restart, serviço ativo, site abrindo, `npm run testar` na VPS)
- Kit de motion (`marketing/leo-animado/_kit-motion`): rodar o `kit.py` sempre pelo caminho
  `C:\MKT-INSTA\Content Legalizai\...` (no PC do Peter é um atalho de pasta pra este repo) e passar o
  `kit.py doutor` antes de renderizar
- **Léo 3D canônico** (Pedro, 29/10/2026: só o Pedro e o Claude, sem ninguém de fora, no PC EDIT-ADMIN). O Léo é
  suricato. Quando o Pedro chamar ("vamos voltar ao Léo 3D"), ler `marketing/personagens/leo-3d/PLANO.md` (tabela
  de progresso e "Onde paramos") e seguir da etapa aberta; no fim de cada etapa, atualizar os dois e fazer commit.
  Ferramentas, preços e fontes em `PESQUISA-LEO-3D.md`; opções grátis ou baratas no próprio plano. Hub Blender 5.2
  LTS: rig, pelo, rosto e animação nascem no Blender, e o render do Léo nunca passa por modelo de vídeo para "melhorar"
