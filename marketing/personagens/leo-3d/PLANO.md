---
tipo: plano de projeto
data: 2026-10-29
status: vivo; o progresso mora AQUI, não na conversa
decisao: "Pedro, 29/10/2026: só o Pedro e o Claude, sem ninguém de fora, no PC EDIT-ADMIN"
rota: "Pedro, 29/10/2026 à tarde: custo zero com a mesma qualidade, mesmo que demore mais; AccuRIG no corpo; o Claude operando os softwares; render no próprio PC, dia e noite"
pesquisa: PESQUISA-LEO-3D.md (ferramentas, preços, fontes e riscos)
---

# Léo 3D canônico: plano etapa por etapa

**Objetivo:** um Léo 3D que nunca muda, com corpo completo, rosto expressivo e fala em português, renderizado no visual Luz Coral e montado no Remotion. Feito só pelo Pedro e pelo Claude, no PC EDIT-ADMIN.

**Como retomar em qualquer conversa:** abrir o Claude Code no EDIT-ADMIN, na pasta do repositório, e dizer "vamos voltar ao Léo 3D" ou "continua o Léo 3D". O Claude entra no **modo contínuo** (seção logo abaixo do "Onde paramos"): executa as etapas uma atrás da outra e só para nos pontos que pedem o Pedro. Ao fim de cada etapa: atualizar a tabela e o "Onde paramos", anotar o que foi aprovado e o arquivo vencedor, fazer commit e push.

## Progresso

| Etapa | O que sai | Status | Aprovado em | Arquivo |
|---|---|---|---|---|
| 0. Preparar o EDIT-ADMIN | Blender 5.2, AccuRIG, Wiggle 2, MCP, PC de render dia e noite | 🟡 | | |
| 1. Entradas para a IA | vistas recortadas e prancha em A-pose | 🟡 | | `entradas/vistas/` |
| 2. Malha-base por IA | GLB vencedor do bake-off e versão final | ⬜ | | |
| 3. Malha de animação | retopologia, peças separadas, UV, bake | ⬜ | | |
| 4. Texturas, materiais e teste de pelo | lookdev no Luz Coral | ⬜ | | |
| 5. Rig do corpo | rig, molas, polo, as 12 poses (**M1: Léo estático**) | ⬜ | | |
| 6. Rosto | rosto por ossos, 16 expressões, 12 visemas | ⬜ | | |
| 7. Pelo final | groom herói e leve, motor canônico | ⬜ | | |
| 8. Estúdio de produção | scripts de take, luz, câmera, render e QA | ⬜ | | |
| 9. Fala e movimento | lip-sync pt-BR e biblioteca de ações (**M2: Léo fala**) | ⬜ | | |
| 10. Primeiro reel | reel piloto aprovado (**M3**) | ⬜ | | |
| 11. Produção contínua | rotina de reels e versões do Léo | ⬜ | | |

Legenda: ⬜ a fazer · 🟡 em andamento · ✅ aprovado.

## Onde paramos

**29/10/2026, fim da tarde, no EDIT-ADMIN (Etapa 1 em andamento, rodada zero esperando o Pedro):**
- **Feito pelo Pedro:** AccuRIG 2 instalado e abrindo; conta no Hunyuan 3D global criada e logada no Chrome dele (perfil Trabalho); tarefa agendada `\Legalizai\LeoRenderFila` criada (estado Ready). Falta o reinício de verdade com trabalho na fila, o teste de exportação do AccuRIG e o plugin da Rokoko.
- **Folha chegou pelo chat** (o arquivo original não veio): salva em `entradas/REF-leo-folha.png` (2000x896, 4 painéis: frente, perfil esquerdo, perfil direito, costas; sem 3/4), mais `entradas/REF-leo-frente.png` (1116x2000) e `entradas/REF-leo-rosto.png` (retrato 1024, que estava em Downloads). A folha do chat veio comprimida e cada vista nasce com uns 500 px de largura: serve para a rodada zero; para a versão final, trazer o original do PC do Peter se for maior.
- **Vistas recortadas (Etapa 1, passo 1):** `scripts/recortar_vistas.py` tira o fundo com o BiRefNet general lite (modelo do rembg, num venv fora do repo em `C:\Users\EDIT-ADMIN\.leo3d\`) e põe cada vista num quadro de 1024 px, mesma escala, pés na mesma linha. Saem em `entradas/vistas/` com fundo transparente e com fundo branco, mais a `vista-frente-alta` (2048 px, da frente sozinha) e a `prancha-rodada-zero.png`. Contorno conferido.
- **Rodada zero no Hunyuan:** a extensão do Claude no Chrome não herda o login do Hunyuan (as abas que o Claude abre caem na tela de login nos 3 Chromes conectados), então **o Pedro gera no site**: Image-to-3D, Multiple Images, `vista-frente/costas/esquerda/direita-branco.png`, modelo 3DGeneration-V3.1, 1.5m faces; e, para comparar, Single Image com `vista-frente-alta-branco.png`. O GLB vai para `geracoes/` (ou Downloads, que o Claude pega).
- **Rodada com 8 vistas (Pedro, 29/10, no lugar da rodada de 4):** o Pedro trouxe as 8 vistas que o Multiple Images aceita (Front, Back, Left, Right, Left 45°, Right 45°, Top, Bottom), geradas fora daqui e anexadas direto no site; só o Top e o Bottom passaram pelo chat. Convenção conferida nas miniaturas de exemplo do Hunyuan: Left e Left 45° com o nariz para a esquerda da imagem, Top com a frente para baixo, Bottom com a frente para cima. As 7 outras batiam; o Top veio de cabeça para baixo. `scripts/preparar_vistas_extras.py` troca o fundo preto do Top e do Bottom pelo cinza das outras (188, 187, 187), sem halo no pelo, e gira o Top 180°; saem em `entradas/geradas/` (`vista-topo.png`, `vista-base.png` e a conferência com a máscara). Para refazer as 4 vistas extras, os prompts estão em `entradas/prompts-vistas-extras.md`. Gerar com 3DGeneration-V3.1 e 1.5m faces.
- **Bake-off pelo Higgsfield (Pedro, 29/10, com o OK para os créditos):** as 6 vistas do Pedro (de `C:\Users\EDIT-ADMIN\Videos\Leozin Suricato\`) foram copiadas para `entradas/geradas/` com nomes padrão. O Higgsfield aceita no máximo 4 vistas em todos os modelos, então foram frente, esquerda, costas e direita. Saíram `geracoes/tripo-h31-4vistas.glb` (1,49 mi faces, olha para +X: turntable com `--rotacao -90`), `geracoes/meshy-multi-4vistas.glb` (596 mil faces, sem remesh, sem simetria) e `geracoes/hunyuan-v3-4vistas.glb` (1,5 mi faces, PBR). Giros em `renders/turntable/<nome>/` e lado a lado em `renders/turntable/comparativo-3-modelos.png`. Leitura do Claude: Tripo com a forma mais fiel e a cor da camisa certa, mas lentes escuras escondendo os olhos; Meshy com o melhor rosto (olhos visíveis pela lente) e camisa desbotada; Hunyuan com lente transparente e cor quente, forma um pouco mais mole. A rodada de 8 vistas segue na fila do site grátis. **Portão:** o Pedro escolhe o vencedor.
- **Olhos pretos em todos (29/10, também no GLB de 8 vistas do site, `geracoes/hunyuan-site-8vistas.glb`):** os geradores fundem lente, aro e olho numa casca só e pintam a sombra de trás da lente. Teste `scripts/olhos_teste.py` (Tripo): acha as lentes num render ortográfico, abre o buraco, põe globo ocular e lente de vidro. Resultado em `renders/olhos/tripo-h31-4vistas/ab.png`: os olhos entram, mas o aro e as hastes velhos continuam fundidos e atravessando a cabeça, e não saem limpos da malha. **Decisão proposta:** regerar o Léo a partir das vistas **sem óculos** (Etapa 1, passo 3) e modelar óculos e olhos no Blender, iguais à folha.
- **Léo por peças (Pedro, 30/10):** decisão de fazer o corpo sem roupa e camisa, gravata, óculos e olhos como objetos separados (dá para puxar a camisa e mostrar a barriga, trocar de roupa e piscar; acaba a fusão dos óculos). Higgsfield recarregado (200 créditos). Nano Banana gerou em `entradas/pecas/`: `corpo-frente/esquerda-45/esquerda/costas/direita/direita-45.png` (bons) e `acessorios.png` (camisa frente e costas, gravata, óculos em 3 vistas; o selo saiu maior que o da folha). `corpo-topo-ruim` e `corpo-base-ruim` vieram com o rosto colado de frente e não servem. Visão geral em `entradas/pecas/prancha-pecas.png`. Prompts para o Gemini em `entradas/prompts-leo-por-pecas.md`. As imagens grandes ficam fora do git (`entradas/pecas/.gitignore`). **Próximo:** corpo 3D com as 6 vistas boas (Hunyuan do site, grátis) e peças no Blender.
- **Corpo 3D sem roupa (30/10, Higgsfield, 4 vistas: frente, esquerda, costas, direita):** `geracoes/corpo-tripo-h31.glb` (1,45 mi faces, `--rotacao -90`) e `geracoes/corpo-hunyuan-v3.glb` (1,49 mi faces). Lado a lado em `renders/turntable/comparativo-corpo.png` (referência: `entradas/pecas/ref/`). Olhos agora aparecem nos dois. Tripo: forma e listras das costas mais fiéis, olho castanho; Hunyuan: cor mais quente, mas olho azul e listras perdidas. Os olhos serão trocados por globos no Blender de qualquer jeito. **Portão:** o Pedro escolhe o corpo.
- **Léo montado por peças, rodada 6 (30/10, Pedro escolheu o corpo do Tripo):** `scripts/bl_medir.py` (gira, apoia e mede o corpo; renders ortográficos da cabeça) e `scripts/bl_montar.py` (veste: globos oculares castanhos no lugar dos olhos, óculos de aro fino com ponte e hastes por fora da cabeça e lentes de vidro, gravata-borboleta, camisa polo feita do tronco com mangas e o selo recortado de `entradas/pecas/selo.png`). Parâmetros em `scripts/montagem-params-r6.json`; resultado em `geracoes/leo-montado-r6.blend` e `renders/montagem/leo-montado-r6.png` (folha em cima, montagem embaixo). Cada peça é um objeto (`LEO_corpo`, `LEO_olho_E/D`, `LEO_oculos`, `LEO_lente_E/D`, `LEO_gravata`, `LEO_camisa`, `LEO_gola`, `LEO_selo`). **Falta para ficar igual à folha:** camisa ainda com relevo do pelo e cor clara, sem gola dobrada, botões e barra; gravata com lóbulos de balão; olhos com íris clara demais. Isso fecha na Etapa 3 (retopologia da camisa e modelagem fina), com o Pedro aprovando cada peça.
- **Atenção:** a pasta `entradas/vistas/` apareceu vazia em 29/10 à noite; restaurada do git (`git checkout`). O `turntable_glb.py` agora compara com `entradas/geradas/` por padrão (`--referencia vistas` para a folha antiga) e tem `--so-contato`.
- **Pronto para quando o GLB chegar (Etapa 2, passo 2):** `scripts/turntable_glb.py <glb>` renderiza em Cycles na placa 8 vistas da volta inteira e o close do rosto, mede faces, vértices, altura e materiais, e monta `contato.png` com a folha em cima e o GLB embaixo. Testado com um GLB de teste (ordem frente, esquerda, costas, direita igual à da folha).
- **Disco:** de 3,95 para uns **10 GB livres** sem apagar nada: compressão transparente do NTFS (LZX) nas pastas de programas e dependências (Antigravity, CapCut, npm, Playwright, WinGet, node_modules dos projetos, caches do hyperframes) e LZNT1 nas transcrições do Claude Code. Desfaz com `compact /u /s /exe` (ou `compact /u /s`). O maior ganho foi `C:\Leghub\node_modules` (1,97 GB). Os instaladores do AccuRIG foram para a lixeira, que está com 1,4 GB para o Pedro esvaziar. Os 40 GB da Etapa 3 em diante continuam pedindo disco a mais.

**29/10/2026, à tarde, no EDIT-ADMIN (Etapa 0 em andamento):**
- **Feito:** `git pull`; diagnóstico da máquina (seção "Diagnóstico do EDIT-ADMIN", na Etapa 0); pastas `entradas/`, `geracoes/`, `scripts/`, `renders/` e `takes/` criadas, com `geracoes/` e `renders/` fora do git pelo `.gitignore` da pasta; caminho do Blender fixado em `scripts/ambiente.py`.
- **Motor dos reels:** a placa é NVIDIA RTX 3060 de 12 GB, então os reels saem em **Cycles** (OptiX).
- **Energia:** já serve para render dia e noite (plano Máximo Desempenho, sem suspender nem hibernar).
- **Bloqueios novos:**
  - **disco:** o C: é um SSD de 120 GB com só 5,9 GB livres. Não cabe a Etapa 2 em diante (GLB de até 2 milhões de faces, bakes 4K, pelo, sequências de render). Decisão do Pedro: liberar espaço ou ligar um disco a mais (compra, fora da rota de custo zero).
    - **Levantamento de 29/10 (nada apagado):** o Léo 3D pede uns 40 GB livres para trabalhar com folga (estimativa). Sem perder nada, caches e instaladores dão de 3 a 6 GB. Mover para fora do PC a mídia que só existe aqui (11,3 GB no repo, fora do git, e uns 3,7 GB de vídeos em Downloads) dá mais 15 GB. Desinstalar o que talvez não se use (Cinema 4D, Media Encoder, Antigravity) dá até uns 10 GB. Somando tudo, chega perto de 35 GB livres.
  - **folha aprovada:** `marketing/video-ia/projetos/2026-10-nota-drone/assets/quadros/REF-leo-folha.png` não existe neste PC nem no git. Trazer do PC do Peter para `entradas/REF-leo-folha.png`. Sem ela, a Etapa 1 não começa. A `leo-animado/precificacao-2026-10-02/qa/LEO-v2-final-folha.jpg` daqui é folha de quadros de reel, não serve.
- **Instalado com o OK do Pedro (29/10):**
  - **Wiggle 2 v2.4.0** (hash sha256 conferido com o da loja), ativo no Blender 5.2. A página só declara até o 5.1, mas carrega sem erro no 5.2;
  - **MCP oficial do Blender v1.0.3:** add-on `mcp` ativo, com o início automático **desligado**; servidor `blender-mcp` 1.0.3 num venv fora do repo (`C:\Users\EDIT-ADMIN\.blender-mcp\venv`); registrado no Claude Code só neste projeto e neste PC (`claude mcp add --scope local blender`). As ferramentas aparecem a partir da próxima sessão do Claude Code;
  - **teste do portão passou:** com o Blender aberto, o MCP listou as 26 ferramentas e leu a cena (`Cube`, `Light`, `Camera`, Blender 5.2.0 LTS).
- **Como ligar o MCP:** abrir o Blender pelo `scripts/abrir_blender_mcp.cmd`. Ele liga o servidor na porta 9876 e libera o acesso online só nessa sessão (`--online-mode`, sem mudar a preferência salva). Fechar o Blender desliga o servidor.
- **Limpeza do disco (29/10, com o OK do Pedro):** `npm-cache` e o temp com mais de 1 dia apagados (0,54 GB); os 3 instaladores de Downloads foram para a lixeira (0,65 GB, liberados quando o Pedro esvaziar). A versão antiga do app Claude ficou, porque o `chrome-native-host.exe` ainda roda de lá. Disco em 6,25 GB livres.
- **Fila de render pronta e testada (adiantada da Etapa 8):** `scripts/render_lote.py`. Trabalho em JSON em `renders/fila/`, Cycles na placa por OptiX, PNG RGBA, prioridade baixa, registro de temperatura em `renders/logs/temperatura.csv` (alerta a partir de 83 °C), para com menos de 3 GB livres e respeita `renders/fila/PAUSA`. Teste com 12 quadros: a fila foi derrubada no meio do quadro 9 e, ao rodar de novo, achou a trava antiga, refez só o quadro cortado, terminou os que faltavam e não tocou nos 8 prontos.
- **Falta no portão 0:**
  - **o Pedro** cria a tarefa agendada rodando `scripts/criar_tarefa_fila.ps1` (o controle de permissões não deixa o Claude criar tarefa que fica no PC); depois, um reinício de verdade com um trabalho na fila confirma a retomada;
  - AccuRIG abrindo e exportando um teste;
  - o plugin da Rokoko.
- **Do Pedro:** AccuRIG 2 com a conta grátis da ActorCore; conta no Hunyuan 3D global e leitura dos termos; pausar o Windows Update durante as filas; baixar o plugin da Rokoko no site deles (pede login; suporte ao Blender 5 não confirmado, e ele só entra na Etapa 9).

**29/10/2026, conversa no PC do Peter** (a próxima continua no EDIT-ADMIN):
- **Decidido:** só o Pedro e o Claude, sem ninguém de fora, no PC EDIT-ADMIN, com o Blender 5.2 LTS como casa do Léo.
- **Rota escolhida (à tarde):** custo zero com a mesma qualidade, mesmo que demore mais. AccuRIG no corpo, o Claude operando os softwares, qualidade máxima onde aparece e o PC do Pedro renderizando dia e noite. Detalhes em "Rota escolhida", logo abaixo; as etapas já estão escritas nessa rota.
- **Já respondido** (seções "Compras", "Perguntas já respondidas" e "Ferramentas de apoio", no fim deste plano):
  - onde o esqueleto é feito;
  - o que comprar e por quê;
  - por que o modelo da IA não vai direto para o Auto-Rig;
  - o papel dos sites, do ComfyUI e do Kling;
  - se o AccuRIG substitui o que é pago, se a Adobe cria o Léo 3D e se existe IA grátis que gera o modelo.
- **Próximo passo:** Etapa 0 no EDIT-ADMIN:
  - `git pull` e diagnóstico da placa de vídeo;
  - Blender 5.2 LTS, AccuRIG 2, Wiggle 2 e o plugin da Rokoko (tudo grátis);
  - MCP oficial do Blender;
  - PC configurado para renderizar dia e noite.
- **Pacote:** grátis. As compras de "Compras" ficam só como plano B, se algo travar.
- **Modo contínuo combinado (29/10):** ao ouvir a frase, o Claude executa o plano em sequência e só para nos portões do Pedro (seção "Modo contínuo", logo abaixo).
- **Dá para adiantar de qualquer PC:** recortar as vistas da folha aprovada e escrever os prompts da prancha em A-pose (Etapa 1).
- **Pendências do Pedro:**
  - ler os termos do Hunyuan 3D (uso comercial do plano grátis) e a licença do AccuRIG na instalação;
  - ver se a lista de apps da Adobe mostra o Substance 3D Painter (o Creative Cloud Pro não inclui);
  - conferir quantas pessoas usam o Remotion (a licença é grátis só até 3).

## Modo contínuo: como o Claude executa o plano

**A frase:** no EDIT-ADMIN, o Pedro diz "vamos voltar ao Léo 3D" ou "continua o Léo 3D". A partir daí o Claude executa o plano inteiro, uma etapa atrás da outra, sem esperar comando entre elas:

1. Ler este plano: a tabela de progresso, o "Onde paramos", a "Rota escolhida" e a etapa aberta.
2. Executar as etapas em ordem. A Etapa 8 (estúdio) avança em paralelo desde a Etapa 2, sempre que houver espera de render ou de aprovação.
3. Parar só nos pontos que pedem o Pedro (tabela abaixo). Pedir de forma objetiva, com a imagem de prova, registrar a resposta aqui e seguir.
4. No fim de cada etapa: atualizar a tabela de progresso e o "Onde paramos", fazer commit só dos arquivos do Léo 3D e push. Deploy na VPS só quando mexer em caminho que o sistema usa (regra do `CLAUDE.md`).
5. Render longo vai para a fila do PC, em segundo plano. Enquanto ele roda, o Claude adianta o que não depende dele.
6. Se algo falhar, tentar o plano B escrito na etapa. Se o plano B custar dinheiro (Auto-Rig Pro, Faceit, RunPod) ou mexer na identidade do Léo, parar e perguntar.
7. Se a conversa ficar longa demais, o progresso já está no arquivo: abrir uma sessão nova e dizer a frase de novo.

**Onde o Claude para e chama o Pedro:**

| Etapa | O que só o Pedro faz ou decide |
|---|---|
| 0 | baixar e instalar o AccuRIG e aceitar a licença dele; criar as contas grátis na ActorCore e no Hunyuan 3D (o Claude não cria conta nem digita senha); ajustar energia e Windows Update com o passo a passo do Claude; dar o OK para o Claude baixar o Wiggle 2 e o plugin da Rokoko e criar a tarefa agendada da fila de render; liberar o AccuRIG no controle de tela, se quiser |
| 1 | gerar as vistas da prancha no Gemini ou no Firefly, se a rodada zero pedir; aprovar a prancha |
| 2 | gerar no site do Hunyuan com o login dele; dar o OK para gastar créditos do Higgsfield; ler os termos do Hunyuan; escolher o vencedor |
| 3 | aprovar o turntable sem pelo (a identidade congela aqui) |
| 4 | aprovar o lookdev e o pelo de teste |
| 5 | decidir como o Léo pisa; clicar no AccuRIG, se o controle de tela não for liberado; aprovar as 12 poses |
| 6 | conferir os pontos do rosto numa imagem; aprovar a folha das 16 expressões e dos 12 visemas |
| 7 | aprovar o turntable com pelo e o motor canônico |
| 8 | definir os enquadramentos do Léo; aprovar o take de teste |
| 9 | gravar mocap no celular, se quiser; aprovar o teste de fala e as ações |
| 10 | aprovar o reel e publicar |

## Rota escolhida: custo zero, com o AccuRIG e o Claude operando

**Decisão do Pedro (29/10/2026, à tarde):** tudo o que puder ter custo zero, com a mesma qualidade, mesmo que demore um pouco mais. Nenhuma compra e nenhuma assinatura nova. O render roda no PC do Pedro, dia e noite.

| Peça | Como fica, a custo zero | Quem faz |
|---|---|---|
| Malha-base | **Hunyuan 3D global**: 20 gerações grátis por dia, multivista, qualidade de ponta. Sem custo extra: os créditos do Higgsfield, que já são pagos. Reserva aberta: Hunyuan3D 2.1 e TRELLIS.2, grátis no Hugging Face | o Pedro gera no site do Hunyuan (login dele); o Claude gera pelo Higgsfield e compara tudo no Blender |
| Esqueleto do corpo e dedos | **AccuRIG 2**: grátis e sem prazo, Windows, conta grátis na ActorCore. Posiciona o esqueleto sozinho, entrega pesos limpos e exporta FBX com preset para o Blender | o Pedro clica (uns 10 minutos, uma vez) ou o Claude opera pelo controle de tela, se o Pedro liberar o app |
| Cauda, orelhas, focinho e controles | script do Claude no Blender: cadeias de ossos, pesos dessas regiões, controles IK de braços e pernas | Claude |
| Rosto | **por ossos**, montado pelo Claude por código: pontos do rosto calculados da malha, ossos com pesos suaves, expressões e visemas como poses | o Claude monta; o Pedro aprova pela folha de expressões |
| Corretivas (ombro, cotovelo, polo) | capturadas do Corrective Smooth como formas e dirigidas pelo osso, por script | Claude |
| Balanço de cauda e orelhas | **Wiggle 2**, grátis, assado antes do render | Claude |
| Malha de animação | quad uniforme automático; a retopologia manual da cabeça só entra se o teste de rosto reprovar | Claude (o Pedro só no plano B) |
| Texturas | pintura de textura do Blender, sobre a cor que vem da IA | o Claude, com retoque do Pedro |
| Máscaras do pelo | geradas da textura e das regiões da malha | o Claude (o Pedro só retoca) |
| Movimento | **Mixamo** (da Adobe, grátis), ActorCore grátis, Flow Studio grátis e o plugin grátis da Rokoko para aplicar no Léo | Claude |
| Render | no PC do Pedro, dia e noite, numa fila que retoma sozinha | o Claude configura |

**O que a assinatura Adobe do Pedro resolve, sem custo extra:** Photoshop para acertar a prancha, Mixamo para as animações e Firefly para fundos e referências.

**O que ela não resolve: criar o Léo 3D.**
- O "3D" do Firefly gera imagens com aparência 3D e muda o ângulo de objetos num quadro, sem exportar um modelo.
- O Substance 3D (Painter, Modeler e o Text to 3D do Viewer) não vem no Creative Cloud Pro: é um plano separado, de US$ 59,99 por mês.
- Se a lista de apps do Pedro mostrar o Substance 3D Painter, ele entra nas texturas.

**O teste de 30 dias da Reallusion é do Character Creator 5, não do AccuRIG,** e não serve para o Léo: vídeo com marca d'água em 720p, movimento exportado só até 30 s, exportação só em GoZ (sem FBX, OBJ nem USD) e uso comercial não listado (página oficial, 29/10/2026).

**Cuidados da rota grátis:**
- **Hunyuan grátis:** as 20 gerações por dia são oferta para contas novas e podem mudar. Os termos não dizem se o resultado do plano grátis tem uso comercial, e as imagens vão para servidor da Tencent. O Pedro lê os termos antes da versão final; se não liberarem, a versão final sai pelos créditos do Higgsfield.
- **Meshy e Tripo grátis:** não servem para o Léo, porque o resultado vira público (CC BY 4.0).
- **AccuRIG:** o Pedro lê a licença na instalação. O uso comercial do personagem riggado não aparece nas páginas que li.

**Plano B, só se algo travar (é o único lugar onde entra dinheiro):**
- Auto-Rig Pro (US$ 50), se o corpo pelo AccuRIG não der certo, decidido até o início da Etapa 5;
- Faceit (US$ 99), se o rosto por ossos não convencer na Etapa 6.

### Qualidade máxima onde aparece

Mais polígono no esqueleto não é mais qualidade: o teste antigo, com 977 mil faces, deformava como borracha. A qualidade máxima vem de quatro camadas:

| Camada | Qualidade | Para quê |
|---|---|---|
| Malha de detalhe | o máximo do gerador: 1,5 a 2 milhões de faces | fonte do detalhe; não anima |
| Malha de animação | 50 a 80 mil quads uniformes, mais densos no rosto | deforma bem e deixa o rig leve |
| Render | Subdivision nível 2 só na hora do render (de 0,8 a 1,3 milhão de polígonos na tela) e mapas 4K de normal, cor e rugosidade assados da malha de detalhe | o detalhe da IA volta inteiro no quadro |
| Pelo | de centenas de milhares a alguns milhões de fios, em hair curves | é o que mais pesa no visual de um suricato |

Os olhos ganham córnea com refração e íris com profundidade, e o render final sai em Cycles com denoise.

### PC de render dia e noite

O PC do Pedro fica renderizando sem parar, então a nuvem sai do plano e o Cycles entra até em reel. Na Etapa 0:
- **energia (o Pedro ajusta, com o passo a passo do Claude):** nunca suspender nem hibernar (a tela pode apagar);
- **Windows Update (o Pedro ajusta):** horário ativo e pausa durante as filas, porque o Windows reinicia sozinho e mata o render;
- **fila que retoma (o Claude cria, com o OK do Pedro):** render quadro a quadro sem sobrescrever o que já saiu, e uma tarefa agendada que religa a fila quando o PC volta;
- **temperatura (o Claude registra):** registro contínuo e, se esquentar, o Claude avisa e propõe limitar a potência da placa;
- **luz, a única despesa nova da rota:** o custo é potência x horas x tarifa. Uma máquina puxando 400 W o dia todo gasta 9,6 kWh por dia, uns R$ 290 por mês a cerca de R$ 1 o kWh (conferir a tarifa na conta).

**Quanto sai por dia** (estimativa, confirmada no teste de 30 quadros da Etapa 4):
- **com placa NVIDIA:** Cycles com pelo leva de 20 a 90 s por quadro; um reel de 30 s (720 quadros) sai em 4 a 18 h, de 1 a 6 reels por dia;
- **sem NVIDIA:** Cycles na CPU leva minutos por quadro (de 1,5 a 5 dias por reel). Aí os reels saem em Eevee, e o Cycles fica para estáticos e planos curtos.

## Regras que não mudam

1. **Um Léo só:** o arquivo mestre `Leo_v1.blend`. Cada take linka o mestre e nunca o edita. Versão nova (v1.1, v2) só com aprovação do Pedro lado a lado com a anterior.
2. **Identidade congelada na aprovação da Etapa 3:** proporção da folha aprovada, polo coral #F2643C com o selo, gravata cinza, óculos redondos de aro marrom, máscara escura, cauda com ponta escura. Depois disso, melhorar pelo ou rosto não pode mudar o Léo.
3. **Expressão da marca dentro do rig:** padrão é olhos atentos e sorriso de canto. Boca nunca escancarada: a abertura da mandíbula fica limitada a cerca de metade no próprio rig.
4. **Prévia antes de gastar crédito** (regra de 26/10): prancha e testes baratos primeiro, aprovação do Pedro, só depois a geração cara.
5. **Rig, pelo, rosto e animação nascem no Blender.** Fora dele só forma e textura.
6. **Blender 5.2 LTS fixo** em tudo: mestre, scripts e nuvem.
7. **Arquivos pesados fora do git**, no padrão do kit: catálogo com md5 e cópia de segurança fora da máquina. No git ficam scripts, pranchas aprovadas, JSON de take e este plano.

## Divisão do trabalho

- **Claude:**
  - scripts bpy (malha de animação automática, acessórios, texturas e materiais, cauda, orelhas e controles, rosto por ossos com expressões e visemas, pelo procedural, cena, luz, câmera, lip-sync, render em lote, QA);
  - gerações por IA via MCP, com o OK do Pedro para o crédito;
  - conferência de cada etapa por render de prova;
  - guia passo a passo do que é feito à mão.
- **Pedro:**
  - aprovações (cada portão);
  - gerar no site do Hunyuan com o login dele e clicar no AccuRIG uma vez (se o controle de tela não for liberado);
  - retoques pontuais quando o Claude pedir (um peso, uma máscara de pelo);
  - gravação de mocap pelo celular quando precisar;
  - no plano B: retopologia manual da cabeça.
- **Juntos:** o MCP oficial do Blender deixa o Claude ver e mexer na mesma cena que o Pedro está com aberta. Na rota escolhida, o Claude faz quase tudo por código e o Pedro entra para aprovar e dar o toque final.

---

## Etapa 0. Preparar o EDIT-ADMIN

**Tempo:** 1 dia · **Custo:** R$ 0

1. **Pedro:** no EDIT-ADMIN, `git pull` na pasta do repositório e abrir o Claude Code nela.
2. **Claude:** diagnóstico da máquina:
   - placa de vídeo e VRAM (`nvidia-smi`), RAM e disco livre;
   - versões do Blender instaladas.
   - Anotar aqui embaixo.
3. **Render no próprio PC, dia e noite** (decisão do Pedro): o Pedro ajusta energia e Windows Update com o passo a passo do Claude, e o Claude monta a fila que retoma e o registro de temperatura (ver "PC de render dia e noite"). A placa decide o motor dos reels:
   - NVIDIA: Cycles nos reels;
   - sem NVIDIA: Eevee nos reels, e Cycles em estáticos e planos curtos.
4. **Claude:** garantir o Blender 5.2 LTS (a documentação do kit diz que ele já está no EDIT-ADMIN) e fixar o caminho dele nos scripts.
5. **Instalar o que é grátis (nenhuma compra):**
   - **o Pedro:** baixa e instala o AccuRIG 2 (Windows), aceita a licença e cria a conta grátis na ActorCore, que o AccuRIG pede para exportar;
   - **o Pedro:** cria a conta grátis no Hunyuan 3D global (20 gerações por dia) e lê os termos;
   - **o Claude, com o OK do Pedro para o download:** instala o Wiggle 2 RTX (extensão grátis do Blender) e o plugin da Rokoko para Blender;
   - se o Pedro quiser que o Claude opere o AccuRIG, ele libera o app no controle de tela.
6. **Claude:** instalar o MCP oficial do Blender (Blender Lab, exige 5.1 ou mais novo) e testar se enxerga a cena aberta.
   - Cuidado: ele executa código sem proteção. Ligar só durante o trabalho; se o EDIT-ADMIN tiver dados de clientes, rodar num usuário Windows separado.
7. **Claude:** criar a estrutura de pastas em `marketing/personagens/leo-3d/`: `entradas/`, `geracoes/`, `scripts/`, `renders/`, `takes/`.

**Portão:**
- o Blender 5.2 abre com o Wiggle 2 e o plugin da Rokoko, e o AccuRIG abre e exporta um teste;
- o Claude enxerga a cena pelo MCP;
- um quadro de teste renderiza na fila local, e a fila retoma sozinha depois de um reinício.

**Diagnóstico do EDIT-ADMIN (29/10/2026):**
- **Máquina:** nome TI-MKT, usuário EDIT-ADMIN, Windows 11 Pro.
- **Placa:** NVIDIA GeForce RTX 3060, 12 GB (12.288 MiB), driver 610.88, limite de 170 W, 31 °C parada. O Blender enxerga a placa em OptiX e em CUDA. Tem também a Radeon integrada do processador, que não entra no render.
- **Processador:** AMD Ryzen 7 5700G, 8 núcleos e 16 threads.
- **RAM:** 31,3 GB.
- **Disco:** um SSD só, de 120 GB (C:), com **5,9 GB livres**. Bloqueio (ver "Onde paramos"). Maiores pastas: `C:\MKT-INSTA` 15,1 GB, Downloads 4,4 GB, `C:\Projects` 2,0 GB.
- **Blender:** 5.2.0 LTS (build de 14/07/2026), o único instalado, em `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`. Fixado em `scripts/ambiente.py`.
- **Energia:** plano Máximo Desempenho; suspender e hibernar em nunca, hibernação desligada; a tela apaga em 5 h.
- **Windows Update:** horário ativo das 7h às 19h, então ele pode reiniciar de madrugada, no meio da fila. Pausar durante as filas.
- **Python:** 3.11.9 no PATH; sem `uv`.
- **Decisão de render:** NVIDIA, então Cycles nos reels. Com 12 GB, o pelo herói de milhões de fios pode apertar a memória da placa (o teste de 30 quadros da Etapa 4 confirma), e o Hunyuan3D 2.1 e o TRELLIS.2 locais ficam fora (pedem 24 GB): a reserva fica nas demos do Hugging Face.

## Etapa 1. Entradas para a IA

**Tempo:** 1 a 2 dias · **Custo:** quase zero

1. **Claude:** recortar as vistas da folha aprovada (`marketing/video-ia/projetos/2026-10-nota-drone/assets/quadros/REF-leo-folha.png`): frente, perfil, costas e 3/4, cada uma em quadro próprio, mesma escala, fundo liso.
2. **Rodada zero (barata):** usar essas vistas como estão para um teste rápido na Etapa 2. Mostra quanto os óculos, os braços colados e a cauda atrapalham.
3. **Se o teste mostrar fusão** (óculos grudados no rosto, axila ou dedos fundidos, cauda colada), fazer a prancha canônica em A-pose:
   - braços a 45 graus, dedos abertos, cauda estendida para trás;
   - sem óculos e sem bigodes;
   - boca fechada neutra;
   - luz chapada.
   - O perfil do outro lado é desenhado, não espelhado, porque o selo é assimétrico.
   - O Claude escreve os prompts (um por vista, conversa nova a cada vista, folha aprovada anexada) e o Pedro gera no Gemini, como no motor de vídeo, ou no Firefly, que já vem na assinatura Adobe. Outra opção: o Claude gera direto pelo Higgsfield, mas os termos dele permitem treinar com o material enviado.
4. **Pedro:** aprova cada vista lado a lado com a folha. Correção de detalhe é no Photoshop, não pedindo à IA.

**Portão:** prancha aprovada pelo Pedro.

## Etapa 2. Malha-base por IA

**Tempo:** 2 a 3 dias · **Custo:** R$ 0 (Hunyuan grátis; os créditos do Higgsfield, que já são pagos, como reserva)

1. **Bake-off de custo zero, com as mesmas vistas:**
   - **Hunyuan 3D global, grátis** (20 gerações por dia, multivista): o Pedro gera no site com o login dele e salva os GLB em `geracoes/`;
   - **créditos do Higgsfield, que já são pagos** (custo extra zero; com o OK do Pedro, porque o crédito é dividido com os vídeos): o Claude gera Tripo H3.1 Multiview, Meshy Multi-Image (pose A) e Hunyuan3D v3 multivista pelo MCP, 2 seeds de cada;
   - reserva aberta: Hunyuan3D 2.1 e TRELLIS.2 nas demos grátis do Hugging Face, ou no próprio EDIT-ADMIN, se a placa for NVIDIA de 24 GB.
2. **Claude:** baixa os GLB e renderiza no Blender, em background, turntable e close de rosto de cada um. Monta uma folha de contato lado a lado com a folha aprovada.
3. **Pedro:** escolhe o vencedor. Critérios:
   - rosto no close e proporção;
   - mãos e cauda;
   - coral e selo;
   - malha sem furo.
4. **Versão final, na qualidade máxima e no mesmo lugar do vencedor:** geometria e textura no modo mais detalhado, com o máximo de faces do gerador (até 2 milhões na Tripo, até 1,5 milhão no Hunyuan). O GLB vencedor é guardado e versionado: é a fonte de detalhe de tudo o que vem depois.
   - Se o vencedor vier do Hunyuan grátis e os termos não liberarem uso comercial, a versão final sai pelos créditos do Higgsfield.
   - Conta direta na Tripo (US$ 10 a 20, com seed fixa e remoção de luz) só se for preciso regerar igual; hoje está fora do plano.
5. **Claude:** cria um dublê do Léo com o rig humanoide automático da Meshy (só para desenvolver o estúdio da Etapa 8 enquanto o rig de verdade não fica pronto).

**Portão:** malha-base aprovada (silhueta e proporção batem com a folha). Seeds e arquivos anotados.

## Etapa 3. Malha de animação

**Tempo:** 3 a 6 dias · **Custo:** R$ 0

1. **Malha de animação automática (Claude):**
   - quad uniforme de 50 a 80 mil faces, com simetria e mais densidade no rosto (QuadriFlow do Blender ou remesh quad da Meshy pelo Higgsfield);
   - o Claude compara as opções em render de prova (ombros, cotovelos, joelhos, base da cauda, rosto) e escolhe com o Pedro.
2. **Plano B, só se o teste de rosto da Etapa 6 reprovar: retopologia manual da cabeça pelo Pedro.**
   - O Claude prepara a cena: a malha da IA como referência, o objeto novo com Mirror e Shrinkwrap e o snapping configurado.
   - O Claude entrega o mapa de topologia: anéis em volta dos olhos, da boca e do focinho.
   - O Claude confere pelo MCP: polos, triângulos, simetria e render em wireframe.
3. **Peças separadas por script do Claude, ajustadas pelo Pedro:**
   - globos oculares com íris e córnea;
   - dentes, língua e interior da boca;
   - óculos (aro, ponte, hastes e lente fina);
   - gravata;
   - selo como decal (a textura do check já existe no kit).
4. **Polo na v1:** fica como região de material do corpo (mais simples e estável). Polo separada fica para uma v1.1.
5. **Claude:** UV; bake em 4K de normal, cor e rugosidade da malha de detalhe para a malha nova (na fila do PC de render).
6. **Congelar topologia e UV.** Depois do rig, não mexe mais.

**Portão:** turntable sem pelo aprovado lado a lado com a folha. **A identidade congela aqui.**

## Etapa 4. Texturas, materiais e teste de pelo

**Tempo:** 2 a 4 dias · **Custo:** R$ 0 (pintura de textura do Blender; o Substance 3D Painter só se já estiver na assinatura Adobe do Pedro)

1. **Cor base:** vem da textura da IA sem luz, com retoques na pintura de textura do Blender (máscara escura, focinho, patas, garras). O coral é conferido com um card de cor no render.
2. **Claude:** materiais por script: polo em piquet, armação, lente fina (Thin Wall), olhos.
3. **Claude:** teste rápido de pelo procedural na malha parada (hair curves por Geometry Nodes, densidade e comprimento por máscara). É o maior risco técnico do caminho, então ele vem cedo.
4. **Claude:** lookdev no Luz Coral (golden hour, contraluz coral, névoa, AgX), com A/B preliminar de Eevee contra Cycles.

**Portão:** render de lookdev aprovado e o pelo de teste convincente. Se o pelo não convencer, decidir aqui um pelo mais estilizado antes de seguir.

## Etapa 5. Rig do corpo (M1: Léo estático)

**Tempo:** 4 a 7 dias · **Custo:** R$ 0

1. **Decisão do Pedro:** o Léo pisa como gente (perna de 2 ossos, mais fácil para mocap, e é o que o AccuRIG faz) ou na ponta dos dedos (isso pede o Auto-Rig Pro, do plano B).
2. **AccuRIG (corpo e dedos):** o Claude exporta a malha do corpo, sem óculos e gravata. No AccuRIG, os pontos do esqueleto são conferidos (o Pedro clica, ou o Claude opera pelo controle de tela) e sai um FBX com o preset do Blender.
3. **Claude, por script no Blender:**
   - importa e corrige a escala (há relato de chegar em 0,01);
   - acrescenta cauda (8 a 12 ossos), orelhas (2 a 3 ossos cada) e focinho, e refaz os pesos dessas regiões;
   - cria os controles de animação: IK de braços e pernas, alças de mão, pé e cauda.
4. **Pesos:**
   - o Claude renderiza poses de teste extremas e aponta onde deforma mal;
   - o Claude corrige por script o que der (suavização, transferência); o Pedro retoca só o que sobrar.
5. **Acessórios:** óculos rígidos no osso da cabeça, gravata no pescoço. A polo ganha 3 a 5 formas corretivas, capturadas do Corrective Smooth e dirigidas por ombro e cotovelo, por script.
6. **Molas:** Wiggle 2 na cauda e nas orelhas (mola dura nas orelhas), sempre assado antes do render.
7. **Pose library:** as 12 poses 2D aprovadas (`cronograma/estudio/base/assets/leo-*.png`) recriadas em 3D. O Claude monta a primeira versão de cada pose e o Pedro ajusta.

**Portão:** as 12 poses aprovadas lado a lado com as 2D.

**M1 (Léo estático):** com o pelo de teste, já dá para usar o Léo 3D em carrossel, post e stories.

## Etapa 6. Rosto

**Tempo:** 6 a 10 dias · **Custo:** R$ 0

1. **Rosto por ossos, montado pelo Claude por código:**
   - pontos do rosto calculados da malha (centro dos olhos, cantos da boca, mandíbula, sobrancelhas, bochechas, ponta do focinho), conferidos pelo Pedro numa imagem;
   - ossos de mandíbula, lábios, cantos da boca, bochechas, sobrancelhas, pálpebras, olhar, orelhas e focinho, com pesos suaves por distância;
   - piscada por osso girando no centro do olho (a pálpebra não atravessa o globo);
   - limite de abertura da boca no próprio rig (cerca de metade).
2. **Teste de rosto:** as expressões mais exigentes (sorriso de canto, surpresa, fala) renderizadas em close. Se a malha automática deformar mal, entra o plano B da Etapa 3 (retopologia manual da cabeça).
3. **Plano B do rosto:** se o rosto por ossos não convencer, comprar o Faceit (US$ 99), gerar as 52 shape keys ARKit e reesculpir as 5 bocas com cara de humano (mouthFunnel, mouthPucker, mouthRoll, mouthShrug, noseSneer).
4. **16 expressões** como poses na Pose Library, criadas pelo Claude e aprovadas pelo Pedro: LEO_PADRAO (olhos atentos, sorriso de canto assimétrico), fala neutra, feliz de boca fechada, risada contida, surpresa, curioso, pensativo, confiante, piscadela, preocupado, desconfiado, alívio, empolgado, ops, escuta atenta e didático.
5. **12 visemas pt-BR** como poses: X (repouso), MBP, FV, A, E, I, O, U (inclui o L final), SZ (s, z, t, d, n, l), CH (ch, j, lh, nh, ti, di), R e KG. As nasais reaproveitam A, E e O com menos abertura.

**Portão:** folha das 16 expressões e dos 12 visemas aprovada.

## Etapa 7. Pelo final

**Tempo:** 4 a 8 dias · **Custo:** R$ 0

1. **Claude:** groom procedural por regiões (corpo, máscara, focinho, orelhas, cauda com ponta escura, bigodes). Direção, densidade e comprimento vêm de máscaras que o Claude gera da textura e das regiões da malha; o Pedro só retoca. A cor vem da textura, na raiz do fio. Na versão herói, densidade alta: de centenas de milhares a alguns milhões de fios.
2. **Densidade zero** sob a polo e nas bordas da gola e das mangas. Pelo curto onde o rosto mais deforma (boca, pálpebras, focinho), acompanhando as expressões (Deform Curves on Surface).
3. **Testes:**
   - as 16 expressões e as 12 poses com o pelo ligado;
   - nenhum fio atravessando polo, gola ou óculos.
4. **Duas versões:** herói (render) e leve (para animar sem travar).
5. **Motor canônico** escolhido pelo A/B final, com close em contraluz coral atravessando o pelo e névoa. Depois de escolhido, não troca entre takes.

**Portão:** turntable com pelo e uma pose expressiva aprovados. Motor canônico anotado aqui.

## Etapa 8. Estúdio de produção (em paralelo, desde a Etapa 2)

**Tempo:** 5 a 8 dias do Claude, com o dublê · **Custo:** R$ 0

Scripts em `marketing/personagens/leo-3d/scripts/`:

| Script | O que faz |
|---|---|
| `luz_coral.py` | sol baixo e quente, preenchimento azul-tinta, névoa, HDRI de golden hour (Poly Haven, CC0), AgX e compositor (Glare em modo Bloom, Split Toning, grão, vinheta) |
| `camera_9x16.py` | 1080x1920, presets de enquadramento do Léo (a definir com o Pedro), câmera travada |
| `montar_take.py` | lê o `take.json` e monta a cena com o mestre linkado (library override) |
| `lipsync.py` | Montreal Forced Aligner com o WAV e o texto do roteiro, fonemas viram visemas com coarticulação, keyframes no .blend e um JSON |
| `vida.py` | piscadas a cada 2 a 6 s, micro-sacadas e respiração |
| `render_lote.py` | fila de render no próprio PC, dia e noite, que retoma sozinha (quadro a quadro, sem sobrescrever o que já saiu); sequência PNG com alfa |
| `qa_quadro.py` | hash do mestre, card de cor do coral, sombra nunca preta pura, conferência dos acessórios; depois o Claude olha os quadros |

- **Remotion:** um template que recebe a sequência do Léo e junta fundo, lettering nos espaços livres do quadro, legenda e som.
- **Contrato de nomes:** fecha nesta etapa (ver o fim deste plano). É ele que deixa trocar o dublê pelo mestre sem mexer nos scripts.

**Portão:** um take de teste de 10 s com o dublê, do `take.json` até o vídeo.

## Etapa 9. Fala e movimento (M2: Léo fala)

**Tempo:** 3 a 5 dias, depois contínuo · **Custo:** R$ 0 (Rokoko Vision pago só se o grátis não der conta)

1. **Teste de fala:** 10 s de narração em português com o `lipsync.py` no Léo de verdade. O Pedro revisa os visemas nos trechos principais.
2. **Biblioteca de ações:**
   - clipes do Mixamo e do ActorCore (idle, gestos de fala, apontar, acenar, comemorar) aplicados no Léo pelo plugin grátis da Rokoko, por script do Claude;
   - mocap do Pedro gravado no celular (Flow Studio grátis ou Rokoko Vision Starter, grátis);
   - cauda e orelhas pelas molas assadas.
3. **Meta:** 10 ações aprovadas para começar e de 20 a 30 com o tempo, sempre um gesto por take.

**Portão:** teste de fala e 10 ações aprovados.

**M2 (Léo fala):** o Léo já fala em reels.

## Etapa 10. Primeiro reel (M3)

**Tempo:** 2 a 3 dias

1. **Roteiro** da pauta da semana, com gancho do banco e as regras duras de copy. A narração segue as regras de voz já usadas.
2. **Claude:** `take.json`, render, montagem no Remotion. O som passa pelas 3 etapas da skill `som-de-video` e pelo Earshot antes da entrega.
3. **Pedro:** aprova.

**Portão:** reel aprovado e publicado. Medir o tempo de cada etapa para ajustar a rotina.

## Etapa 11. Produção contínua (a parte final)

1. **Rotina por reel:** roteiro, `take.json` gerado pelo Claude, render, Remotion, QA, publicação. A meta é o reel com o Léo sair em 1 a 2 dias.
2. **Versões do Léo:** melhorias (polo separada, mais expressões, pelo melhor) entram como v1.1, v1.2, sempre aprovadas lado a lado.
3. **Extras que entram quando fizer sentido:**
   - versão leve em GLB (pelo em cards, morph targets) direto no `@remotion/three` para inserts rápidos;
   - LoRA treinada com renders do Léo 3D para estáticos (Qwen-Image ou FLUX.2 klein 4B, ambos Apache 2.0);
   - Kling 4.0 com keyframes renderizados do 3D para movimentos difíceis;
   - ComfyUI para fundos.
4. **Transformar a rotina numa skill** (por exemplo, `reels-leo-3d`) quando ela estabilizar.

---

## Compras

**Decisão de 29/10, à tarde: custo zero, sem compras** (ver "Rota escolhida"). Esta tabela fica só como plano B, se algo travar. Quase nada é assinatura: são 3 add-ons de compra única, cerca de R$ 876, vendidos no Superhive com 12 meses de atualização, mais créditos pré-pagos.

| Software | Tipo | Preço | Quando | Por quê |
|---|---|---|---|---|
| Auto-Rig Pro Full | compra única | US$ 50 | Etapa 0 | esqueleto com cauda, orelhas e focinho, e mocap do Mixamo e do celular aplicado no Léo. O Rigify, grátis, é bem mais manual e não aplica mocap |
| Faceit 2.3 | compra única | US$ 99 | Etapa 0 | gera as 52 expressões do rosto automaticamente. Sem ele, seriam 52 esculpidas à mão; com ele, só 5 bocas |
| SpringFX Full | compra única | US$ 15 | Etapa 0 | cauda e orelhas balançam sozinhas e batem nas pernas e no chão. O Wiggle 2, grátis, faz o balanço sem a colisão |
| Créditos da Tripo (conta direta) | pré-pago | US$ 10 a 20 | Etapa 2 | geração final com seed fixa, remoção de luz e separação da camisa, que o Higgsfield não oferece |

**Só se precisar:**
- RunPod, pago por hora: só se a fila do PC de render não der conta de um prazo.
- Rokoko Vision Basic, US$ 10 a 12 por mês: na Etapa 9, depois de testar o plano grátis.
- Meshy Pro, R$ 107,90 por um mês: se a Meshy vencer o teste em textura.
- Substance Painter, US$ 199,99 perpétuo: se a pintura de textura do Blender não der conta.

**Não assinar:** Maya, ZBrush, Cinema 4D, Reallusion, Marvelous, Rodin, Hi3D, Kling, Runway e Comfy Cloud. Ou o Blender já faz o mesmo de graça, ou o uso é para depois.

**Grátis:** Blender, Mixamo, Montreal Forced Aligner, Rhubarb, Wiggle 2 e Poly Haven.

## Opções grátis ou baratas (mesmo resultado)

Dá para fazer o Léo inteiro **sem gastar nada além do que já é pago** (Higgsfield e Claude). O que muda é o tempo, porque algumas etapas ficam mais manuais. O resultado na tela é o mesmo, com as diferenças anotadas abaixo.

| Pago | Alternativa grátis ou barata | Resultado | O que se perde | Tempo a mais |
|---|---|---|---|---|
| Auto-Rig Pro (US$ 50) | **AccuRIG 2** (grátis, escolhido): posiciona o esqueleto do corpo e dos dedos sozinho, com pesos limpos; cauda, orelhas, focinho e controles entram por script do Claude. Outra opção grátis: **Rigify** (`spines.basic_tail` na cauda, `limbs.simple_tentacle` nas orelhas). Mocap pelo **plugin grátis da Rokoko** | o mesmo esqueleto, com cauda, orelhas e controles | não traz retarget embutido; perna só de gente | 1 a 2 dias (Rigify: 2 a 4) |
| Faceit (US$ 99) | **rosto por ossos do Rigify**, com expressões e visemas salvos como poses na Pose Library, e formas corretivas esculpidas só onde precisar | para o Léo, quase o mesmo, porque a expressão da marca é contida (sorriso de canto, boca nunca escancarada) | o padrão ARKit pronto; a captura do iPhone ou da webcam passa a precisar de um script de conversão (o Claude escreve) | 3 a 5 dias |
| SpringFX (US$ 15) | **Wiggle 2 RTX** (GPLv3) ou **Jiggle Physics**, grátis | o mesmo balanço de cauda e orelhas, assado | a colisão da cauda com pernas e chão, que vira limite de rotação e ajuste na animação | meio dia |
| Créditos da Tripo (US$ 10 a 20) | **Hunyuan 3D global** (20 gerações grátis por dia) e os **créditos do Higgsfield**, já pagos, com Tripo, Meshy e Hunyuan | a mesma malha-base | regerar igual pela seed, separação da camisa e remoção de luz; a prancha já vem com luz chapada e o GLB fica guardado | nenhum |
| Substance Painter (US$ 199,99) | **pintura de textura do Blender** (o Substance 3D não vem no Creative Cloud Pro: é plano separado) | o mesmo: a cor base já vem da IA, é só retoque | camadas e máscaras inteligentes | 1 dia |
| Rokoko Vision (US$ 10 a 12/mês) | **Mixamo**; **Mesh2Motion** (animações CC0); **Autodesk Flow Studio grátis** (300 créditos/mês, exporta mocap para o Blender); **Rokoko Vision Starter** (30 s/mês) | os mesmos gestos | volume de captura por mês | nenhum |
| RunPod (por hora) | render no próprio PC: **Eevee** em qualquer placa e **Cycles na CPU** durante a noite | a mesma imagem | velocidade | render à noite |
| ZBrush, Maya, Marvelous | **Blender**: Sculpt, rig e cloth por nós no 5.2 | o mesmo para o Léo | nada de que o Léo precise | nenhum |
| Kling, Runway, Comfy Cloud (Etapa 11) | **ComfyUI local** com Wan 2.2 (Apache 2.0) e LoRA treinada no próprio PC | o mesmo | precisa de placa NVIDIA; sem ela, LoRA no fal.ai por US$ 2 a 5 o treino | depende da placa |

**Já grátis no plano:**
- Blender 5.2 e o MCP oficial do Blender;
- pelo por hair curves;
- remesh quad (QuadriFlow do Blender e o remesh da Meshy pelo Higgsfield);
- Montreal Forced Aligner e Rhubarb (lip-sync);
- Live Link Face e MediaPipe (captura de rosto);
- Poly Haven e Kenney (cenário).

**Três pacotes:**

| Pacote | Custo | Quando escolher |
|---|---|---|
| **Grátis (escolhido)** | R$ 0 | rota escolhida em 29/10: AccuRIG, Hunyuan grátis e o Claude operando; aceita demorar um pouco mais |
| **Econômico** | US$ 50 (cerca de R$ 268), só o Auto-Rig Pro | é a compra que mais economiza tempo: posiciona o esqueleto sozinho e aplica mocap |
| **Completo** | US$ 164 (cerca de R$ 876) | o mais rápido, e com o padrão ARKit no rosto |

**Regra para trocar de pacote:**
- A ferramenta do rig de corpo (AccuRIG, Rigify ou Auto-Rig Pro) precisa estar decidida até o início da Etapa 5 e não muda depois: trocar refaz o esqueleto e as animações.
- O Faceit pode ser comprado mais tarde, na Etapa 6, se o rosto por ossos não convencer.

## Perguntas já respondidas

**Onde o esqueleto é feito?**
- No Blender, no EDIT-ADMIN (Etapa 5), dentro do `Leo_v1.blend`.
- Na rota escolhida, o esqueleto do corpo e dos dedos sai do AccuRIG (grátis), que posiciona os pontos sozinho. O Claude acrescenta no Blender a cauda (8 a 12 ossos), as orelhas (2 a 3 cada), o focinho e os controles.
- O rosto é por ossos, montado pelo Claude (Etapa 6), e o balanço vem do Wiggle 2. No plano B: Auto-Rig Pro no corpo e Faceit no rosto.
- Esqueleto são os ossos; rig são os ossos mais os controles. Os controles não viajam entre programas, por isso o rig nasce onde a animação acontece.

**Fazer o modelo no Meshy e depois mandar para o Auto-Rig?**
- O modelo sai da IA, mas não vai direto para o rig.
- Na Etapa 2, teste com Tripo, Meshy e Hunyuan usando as mesmas imagens e os créditos do Higgsfield. A aposta é a Tripo H3.1.
- Depois, no Blender: refazer a malha (Etapa 3), texturas e teste de pelo (Etapa 4), e só então o esqueleto (Etapa 5).
- O Auto-Rig Pro é um add-on dentro do Blender: "mandar para o Auto-Rig" é abrir o GLB no Blender. Na rota escolhida, quem posiciona o esqueleto do corpo é o AccuRIG, e o FBX dele volta para o Blender.
- Por que não direto: malha crua de IA (triângulos sem ordem, olho pintado, boca sem interior, óculos grudados) deforma como borracha. O teste antigo da Tripo, com 977 mil faces e 23 ossos, falhou por isso.
- O rig automático da Meshy serve só para o Léo provisório da Etapa 8.

**Dá para fazer o rig nos sites?** Não o que o Léo precisa:
- Meshy e Tripo fazem rig automático humanoide, sem cauda, orelhas nem rosto;
- Hi3D e Rodin não fazem rig;
- ZBrush é escultura;
- Reallusion: o AccuRIG entra só no esqueleto do corpo e dos dedos (grátis); Character Creator e iClone ficam fora (só humanoide, sem pelo de verdade, e o teste de 30 dias não exporta FBX).

**ComfyUI e Kling?** Apoio, nunca a fonte do Léo, e só a partir da Etapa 11. Detalhes em "Ferramentas de apoio".

**O AccuRIG substitui tudo que é pago?** Junto com o resto grátis, sim:
- AccuRIG no esqueleto do corpo e dos dedos, no lugar do Auto-Rig Pro;
- rosto por ossos montado pelo Claude, no lugar do Faceit;
- Wiggle 2 no lugar do SpringFX;
- pintura do Blender no lugar do Substance;
- Hunyuan grátis e créditos do Higgsfield no lugar da conta da Tripo.
- O preço é tempo: de 1 a 2 semanas a mais no total. O AccuRIG é grátis de vez; o teste de 30 dias é do Character Creator 5, que não serve.

**Dá para criar o Léo 3D dentro da Adobe?** Com o Creative Cloud Pro, não:
- o "3D" do Firefly gera imagens com aparência 3D e muda o ângulo de objetos num quadro, sem exportar um modelo;
- o Substance 3D (Painter, Modeler e o Text to 3D do Viewer) é um plano separado, de US$ 59,99 por mês;
- a Adobe ajuda no resto sem custo extra: Photoshop (prancha), Mixamo (animações) e Firefly (fundos e referências).

**Tem IA grátis que gera o modelo?** Sim:
- Hunyuan 3D global, com 20 gerações grátis por dia, qualidade de ponta e multivista. Ler os termos de uso comercial do plano grátis antes da versão final;
- Hunyuan3D 2.1 e TRELLIS.2, abertos, grátis nas demos do Hugging Face ou num PC com NVIDIA grande, com qualidade um pouco abaixo;
- Meshy e Tripo grátis não servem, porque o resultado vira público;
- sem custo extra também: os créditos do Higgsfield que vocês já pagam.

## Onde se faz o rig

**O rig mora onde a animação acontece:** controles, IK, drivers e o rig do rosto não viajam entre programas. Como o Léo vai ser animado e renderizado no Blender, o rig é finalizado no Blender. Na rota escolhida:
- **AccuRIG** posiciona o esqueleto do corpo e dos dedos e volta como FBX;
- **o Claude, por script no Blender,** acrescenta cauda, orelhas, focinho, controles e o rosto por ossos;
- **Wiggle 2** faz o balanço da cauda e das orelhas.

No plano B: Auto-Rig Pro no corpo, Faceit no rosto e SpringFX nas molas. Os auto-rigs da Meshy e da Tripo fazem esqueleto humanoide sem cauda, orelhas nem rosto: servem só para prévia e para o dublê da Etapa 2.

## Ferramentas de apoio: quando entram

| Ferramenta | Papel no projeto | Quando |
|---|---|---|
| Hunyuan 3D grátis; Meshy, Tripo e Hunyuan pelo Higgsfield | malha-base e dublê | Etapa 2 |
| Hi3D, Rodin | fora (sem rig, foco em forma ou impressão) | não entram |
| ZBrush | dispensável: o sculpt do Blender cobre o necessário | não entra |
| AccuRIG (Reallusion) | esqueleto do corpo e dos dedos, grátis | Etapa 5 |
| Character Creator 5 e iClone | fora: rig humanoide, sem pelo por fio, rosto só para humano; o teste de 30 dias não exporta FBX | não entram |
| Adobe (assinatura atual) | Photoshop na prancha, Mixamo nas animações, Firefly em fundos; não cria o modelo 3D | Etapas 1, 9 e 11 |
| Kling 4.0 | apoio: keyframes do 3D e fundos; nunca a fonte do Léo | Etapa 11 |
| ComfyUI | apoio: fundos, LoRA de estáticos e saída aberta se uma API fechar; pede NVIDIA ou Comfy Cloud | Etapa 11 |
| Veo, Seedance e similares | nunca por cima do render do Léo (a deriva volta) | só fundo e B-roll |

## Contrato de nomes (fecha na Etapa 8)

- **Objetos:** `LEO_corpo`, `LEO_olho_L`, `LEO_olho_R`, `LEO_dentes`, `LEO_lingua`, `LEO_boca_interior`, `LEO_oculos`, `LEO_gravata`, `LEO_selo`, `LEO_pelo_<regiao>` (corpo, mascara, focinho, orelhas, cauda, bigodes).
- **Coleções:** `LEO_geometria`, `LEO_rig`, `LEO_pelo`, `LEO_acessorios`.
- **Rig:** nomes gerados pela ferramenta escolhida (o AccuRIG, na rota escolhida), sem renomear. Ossos acrescentados pelo Claude: `tail_01` a `tail_12`, `ear_01.L` a `ear_03.L`, `ear_01.R` a `ear_03.R` e `muzzle`.
- **Rosto:** na rota escolhida, por ossos; visemas e expressões ficam como poses, com os nomes abaixo. Só no plano B (Faceit) entram as 52 shape keys do ARKit com a grafia oficial (`eyeBlinkLeft`, `jawOpen`, `mouthSmileLeft` e as demais).
- **Visemas:** `VIS_X`, `VIS_MBP`, `VIS_FV`, `VIS_A`, `VIS_E`, `VIS_I`, `VIS_O`, `VIS_U`, `VIS_SZ`, `VIS_CH`, `VIS_R`, `VIS_KG`.
- **Expressões:** `EXP_LEO_PADRAO`, `EXP_FALA_NEUTRA`, `EXP_FELIZ`, `EXP_RISADA_CONTIDA`, `EXP_SURPRESA`, `EXP_CURIOSO`, `EXP_PENSATIVO`, `EXP_CONFIANTE`, `EXP_PISCADELA`, `EXP_PREOCUPADO`, `EXP_DESCONFIADO`, `EXP_ALIVIO`, `EXP_EMPOLGADO`, `EXP_OPS`, `EXP_ESCUTA`, `EXP_DIDATICO`.

## Prazo e riscos do caminho Pedro + Claude

**Prazo:**
- **Por etapa:** os dias estão no título de cada etapa.
- **Total:** de 8 a 12 semanas até o primeiro reel, contando que o lançamento de 10/11 vai disputar o tempo do Pedro. Na rota escolhida, o tempo de mão do Pedro cai muito: o Claude faz quase tudo por código, e o Pedro aprova e retoca.
- **Marcos:** o M1 (Léo estático) sai por volta da metade desse caminho.

**Riscos e como cortar:**
- **Rosto por ossos e malha automática podem deformar menos fino que o trabalho manual.** Como cortar: o padrão de expressão da marca é contido (sorriso de canto, boca nunca escancarada) e o pelo esconde pequenas imperfeições. O teste de rosto da Etapa 6 decide, e os planos B (retopologia manual da cabeça, Faceit) já estão escritos.
- **Termos das ferramentas grátis.** O uso comercial do resultado do Hunyuan grátis e do personagem riggado no AccuRIG não aparece nas páginas que li: o Pedro lê os termos antes da versão final. Se o Hunyuan não liberar, a versão final sai pelos créditos do Higgsfield.
- **Render dia e noite.** Reinício do Windows, queda de luz e calor param a fila. Por isso a fila retoma sozinha, o Windows Update fica fora do horário de render e a temperatura é registrada.
- **Pelo é o maior risco técnico.** Ele é testado cedo, na Etapa 4, e pode virar um pelo mais estilizado se o realista não convencer.
- **Melhorar o Léo depois pode mudar a identidade.** Por isso a identidade congela na Etapa 3, e versão nova só sai com aprovação lado a lado.
- **Fornecedor que muda regra.** O mestre, os scripts e os seeds ficam com vocês; nenhuma etapa depois da 2 depende de serviço externo.
