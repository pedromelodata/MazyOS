---
tipo: plano de projeto
data: 2026-10-29
status: vivo; o progresso mora AQUI, não na conversa
decisao: "Pedro, 29/10/2026: só o Pedro e o Claude, sem ninguém de fora, no PC EDIT-ADMIN"
pesquisa: PESQUISA-LEO-3D.md (ferramentas, preços, fontes e riscos)
---

# Léo 3D canônico: plano etapa por etapa

**Objetivo:** um Léo 3D que nunca muda, com corpo completo, rosto expressivo e fala em português, renderizado no visual Luz Coral e montado no Remotion. Feito só pelo Pedro e pelo Claude, no PC EDIT-ADMIN.

**Como retomar em qualquer conversa:** abrir o Claude Code no EDIT-ADMIN, na pasta do repositório, e dizer "vamos voltar ao Léo 3D". O Claude lê a tabela de progresso e a seção "Onde paramos" logo abaixo e continua da etapa aberta. Ao fim de cada etapa: atualizar a tabela e o "Onde paramos", anotar o que foi aprovado e o arquivo vencedor, e fazer commit.

## Progresso

| Etapa | O que sai | Status | Aprovado em | Arquivo |
|---|---|---|---|---|
| 0. Preparar o EDIT-ADMIN | Blender 5.2, add-ons, MCP, decisão de render | ⬜ | | |
| 1. Entradas para a IA | vistas recortadas e prancha em A-pose | ⬜ | | |
| 2. Malha-base por IA | GLB vencedor do bake-off e versão final | ⬜ | | |
| 3. Malha de animação | retopologia, peças separadas, UV, bake | ⬜ | | |
| 4. Texturas, materiais e teste de pelo | lookdev no Luz Coral | ⬜ | | |
| 5. Rig do corpo | rig, molas, polo, as 12 poses (**M1: Léo estático**) | ⬜ | | |
| 6. Rosto | 52 ARKit, 16 expressões, 12 visemas | ⬜ | | |
| 7. Pelo final | groom herói e leve, motor canônico | ⬜ | | |
| 8. Estúdio de produção | scripts de take, luz, câmera, render e QA | ⬜ | | |
| 9. Fala e movimento | lip-sync pt-BR e biblioteca de ações (**M2: Léo fala**) | ⬜ | | |
| 10. Primeiro reel | reel piloto aprovado (**M3**) | ⬜ | | |
| 11. Produção contínua | rotina de reels e versões do Léo | ⬜ | | |

Legenda: ⬜ a fazer · 🟡 em andamento · ✅ aprovado.

## Onde paramos

**29/10/2026, conversa no PC do Peter** (a próxima continua no EDIT-ADMIN):
- **Decidido:** só o Pedro e o Claude, sem ninguém de fora, no PC EDIT-ADMIN, com o Blender 5.2 LTS como casa do Léo.
- **Já respondido** (seções "Compras", "Perguntas já respondidas" e "Ferramentas de apoio", no fim deste plano):
  - onde o esqueleto é feito;
  - o que comprar e por quê;
  - por que o modelo da IA não vai direto para o Auto-Rig;
  - o papel dos sites, do ComfyUI e do Kling.
- **Próximo passo:** Etapa 0 no EDIT-ADMIN:
  - `git pull` e diagnóstico da placa de vídeo;
  - Blender 5.2 LTS;
  - compra dos 3 add-ons;
  - MCP oficial do Blender.
- **Opções grátis:** seção "Opções grátis ou baratas". O pacote (grátis, econômico ou completo) se decide na Etapa 0; a ferramenta do rig de corpo, até a Etapa 5.
- **Dá para adiantar de qualquer PC:** recortar as vistas da folha aprovada e escrever os prompts da prancha em A-pose (Etapa 1).
- **Pendências do Pedro:**
  - ler os termos de uso da Tripo no navegador;
  - conferir quantas pessoas usam o Remotion (a licença é grátis só até 3).

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
  - scripts bpy (cena, luz, câmera, materiais, acessórios, pelo procedural, lip-sync, render em lote, QA);
  - gerações por IA via MCP, com o OK do Pedro para o crédito;
  - conferência de cada etapa por render de prova;
  - guia passo a passo do que é feito à mão.
- **Pedro:**
  - aprovações;
  - o que é interativo no Blender: marcar pontos do rig e do rosto, retopologia da cabeça, ajuste de pesos, reescultura de 5 bocas, pintura de máscaras do pelo;
  - gravação de mocap pelo celular quando precisar.
- **Juntos:** o MCP oficial do Blender deixa o Claude ver e mexer na mesma cena que o Pedro está com aberta. Assim o trabalho manual vira guiado: o Claude prepara, o Pedro faz o toque humano, o Claude confere.

---

## Etapa 0. Preparar o EDIT-ADMIN

**Tempo:** 1 dia · **Custo:** US$ 164 em add-ons (cerca de R$ 876)

1. **Pedro:** no EDIT-ADMIN, `git pull` na pasta do repositório e abrir o Claude Code nela.
2. **Claude:** diagnóstico da máquina:
   - placa de vídeo e VRAM (`nvidia-smi`), RAM e disco livre;
   - versões do Blender instaladas.
   - Anotar aqui embaixo.
3. **Decisão de render, pela placa:**
   - NVIDIA com 12 GB ou mais: prévia e render no próprio EDIT-ADMIN.
   - Sem isso: prévia leve local e render na nuvem (RunPod, RTX 4090 de US$ 0,34 a 0,89 por hora). Comprar uma RTX 5070 Ti 16 GB fica para depois do Léo aprovado.
4. **Claude:** garantir o Blender 5.2 LTS (a documentação do kit diz que ele já está no EDIT-ADMIN) e fixar o caminho dele nos scripts.
5. **Pedro compra no Superhive e instala:**
   - Auto-Rig Pro Full (US$ 50);
   - Faceit 2.3 (US$ 99);
   - SpringFX Full (US$ 15). O Wiggle 2, grátis, é a alternativa.
   - Guardar os instaladores: as atualizações valem por 12 meses.
6. **Claude:** instalar o MCP oficial do Blender (Blender Lab, exige 5.1 ou mais novo) e testar se enxerga a cena aberta.
   - Cuidado: ele executa código sem proteção. Ligar só durante o trabalho; se o EDIT-ADMIN tiver dados de clientes, rodar num usuário Windows separado.
7. **Claude:** criar a estrutura de pastas em `marketing/personagens/leo-3d/`: `entradas/`, `geracoes/`, `scripts/`, `renders/`, `takes/`.

**Portão:**
- o Blender 5.2 abre com os 3 add-ons;
- o Claude enxerga a cena pelo MCP;
- um quadro de teste renderiza no caminho escolhido.

**Diagnóstico do EDIT-ADMIN:** _(preencher)_

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
   - O Claude escreve os prompts (um por vista, conversa nova a cada vista, folha aprovada anexada) e o Pedro gera no Gemini, como no motor de vídeo. Outra opção: o Claude gera direto pelo Higgsfield, mas os termos dele permitem treinar com o material enviado.
4. **Pedro:** aprova cada vista lado a lado com a folha. Correção de detalhe é no Photoshop, não pedindo à IA.

**Portão:** prancha aprovada pelo Pedro.

## Etapa 2. Malha-base por IA

**Tempo:** 2 a 3 dias · **Custo:** R$ 30 a 110 no bake-off, mais US$ 10 a 20 na conta da Tripo

1. **Claude, com o OK do crédito:** bake-off pelo MCP do Higgsfield, 2 seeds de cada:
   - Tripo H3.1 Multiview (geometria detailed, PBR);
   - Meshy Multi-Image (pose A, com textura);
   - Hunyuan3D v3 multivista.
2. **Claude:** baixa os GLB e renderiza no Blender, em background, turntable e close de rosto de cada um. Monta uma folha de contato lado a lado com a folha aprovada.
3. **Pedro:** escolhe o vencedor. Critérios:
   - rosto no close e proporção;
   - mãos e cauda;
   - coral e selo;
   - malha sem furo.
4. **Versão final (se a Tripo vencer):**
   - **Pedro:** abre conta direta em developers.tripo3d.ai e lê os termos de uso, que bloqueiam leitura automática.
   - **Claude:** gera a versão final com `texture_version=v3.5-20260815` (sem isso a remoção de luz não age), geometria detailed, `model_seed` e `texture_seed` anotados aqui, e uma base quad P2 com o mesmo seed.
5. **Claude:** cria um dublê do Léo com o rig humanoide automático da Meshy (só para desenvolver o estúdio da Etapa 8 enquanto o rig de verdade não fica pronto).

**Portão:** malha-base aprovada (silhueta e proporção batem com a folha). Seeds e arquivos anotados.

## Etapa 3. Malha de animação

**Tempo:** 5 a 10 dias (a etapa mais manual) · **Custo:** R$ 0

1. **Corpo:**
   - quad automático (base P2, remesh quad da Meshy ou QuadriFlow do Blender), com simetria;
   - o Pedro corrige ombros, cotovelos, joelhos e base da cauda com o Claude guiando.
2. **Cabeça (retopologia manual pelo Pedro):**
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
5. **Claude:** UV; bake de normal e de cor da malha da IA para a malha nova.
6. **Congelar topologia e UV.** Depois do rig, não mexe mais.

**Portão:** turntable sem pelo aprovado lado a lado com a folha. **A identidade congela aqui.**

## Etapa 4. Texturas, materiais e teste de pelo

**Tempo:** 2 a 4 dias · **Custo:** R$ 0 (Substance Painter, US$ 199,99, é opcional)

1. **Cor base:** vem da textura da IA sem luz, com retoques na pintura de textura do Blender (máscara escura, focinho, patas, garras). O coral é conferido com um card de cor no render.
2. **Claude:** materiais por script: polo em piquet, armação, lente fina (Thin Wall), olhos.
3. **Claude:** teste rápido de pelo procedural na malha parada (hair curves por Geometry Nodes, densidade e comprimento por máscara). É o maior risco técnico do caminho, então ele vem cedo.
4. **Claude:** lookdev no Luz Coral (golden hour, contraluz coral, névoa, AgX), com A/B preliminar de Eevee contra Cycles.

**Portão:** render de lookdev aprovado e o pelo de teste convincente. Se o pelo não convencer, decidir aqui um pelo mais estilizado antes de seguir.

## Etapa 5. Rig do corpo (M1: Léo estático)

**Tempo:** 4 a 7 dias · **Custo:** R$ 0 (add-ons já comprados)

1. **Decisão do Pedro:** o Léo pisa como gente (perna de 2 ossos, mais fácil para mocap) ou na ponta dos dedos.
2. **Auto-Rig Pro Smart:** o Pedro marca os pontos (pescoço, queixo, ombros, pulsos, quadril, tornozelos), com a polo, os óculos e a gravata escondidos.
3. **Membros extras:** cauda (8 a 12 ossos), orelhas (2 a 3 ossos cada), focinho e dedos.
4. **Pesos:**
   - skin automático do Auto-Rig Pro;
   - o Claude renderiza poses de teste extremas e aponta onde deforma mal;
   - o Pedro corrige os pesos guiado.
5. **Acessórios:** óculos rígidos no osso da cabeça, gravata no pescoço. A polo ganha 3 a 5 formas corretivas dirigidas por ombro e cotovelo.
6. **Molas:** SpringFX na cauda e nas orelhas (mola dura nas orelhas), sempre assadas antes do render.
7. **Pose library:** as 12 poses 2D aprovadas (`cronograma/estudio/base/assets/leo-*.png`) recriadas em 3D. O Claude monta a primeira versão de cada pose e o Pedro ajusta.

**Portão:** as 12 poses aprovadas lado a lado com as 2D.

**M1 (Léo estático):** com o pelo de teste, já dá para usar o Léo 3D em carrossel, post e stories.

## Etapa 6. Rosto

**Tempo:** 6 a 10 dias · **Custo:** R$ 0

1. **Faceit 2.3:**
   - o Pedro posiciona os landmarks, pensando no focinho;
   - o Faceit gera as 52 shape keys ARKit.
2. **Reescultura:** o Pedro refaz, guiado e com referência lado a lado, as 5 bocas que vêm com cara de humano: mouthFunnel, mouthPucker, mouthRoll, mouthShrug e noseSneer (este vira franzir do focinho).
3. **Claude:**
   - corretiva de piscada;
   - ossos de olhar, orelhas e ponta do focinho;
   - limite de abertura da boca (jawOpen perto de 0,5, mouthStretch e mouthLowerDown também limitados);
   - bake do control rig.
4. **16 expressões** como poses na Pose Library: LEO_PADRAO (olhos atentos, sorriso de canto assimétrico), fala neutra, feliz de boca fechada, risada contida, surpresa, curioso, pensativo, confiante, piscadela, preocupado, desconfiado, alívio, empolgado, ops, escuta atenta e didático.
5. **12 visemas pt-BR** como poses: X (repouso), MBP, FV, A, E, I, O, U (inclui o L final), SZ (s, z, t, d, n, l), CH (ch, j, lh, nh, ti, di), R e KG. As nasais reaproveitam A, E e O com menos abertura.

**Portão:** folha das 16 expressões e dos 12 visemas aprovada.

## Etapa 7. Pelo final

**Tempo:** 4 a 8 dias · **Custo:** R$ 0

1. **Claude:** groom procedural por regiões (corpo, máscara, focinho, orelhas, cauda com ponta escura, bigodes). Direção, densidade e comprimento vêm de máscaras pintadas pelo Pedro. A cor vem da textura, na raiz do fio.
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
| `render_lote.py` | render local ou na nuvem, sequência PNG com alfa |
| `qa_quadro.py` | hash do mestre, card de cor do coral, sombra nunca preta pura, conferência dos acessórios; depois o Claude olha os quadros |

- **Remotion:** um template que recebe a sequência do Léo e junta fundo, lettering nos espaços livres do quadro, legenda e som.
- **Contrato de nomes:** fecha nesta etapa (ver o fim deste plano). É ele que deixa trocar o dublê pelo mestre sem mexer nos scripts.

**Portão:** um take de teste de 10 s com o dublê, do `take.json` até o vídeo.

## Etapa 9. Fala e movimento (M2: Léo fala)

**Tempo:** 3 a 5 dias, depois contínuo · **Custo:** opcional, de US$ 10 a 12/mês (Rokoko Vision)

1. **Teste de fala:** 10 s de narração em português com o `lipsync.py` no Léo de verdade. O Pedro revisa os visemas nos trechos principais.
2. **Biblioteca de ações:**
   - clipes do Mixamo (idle, gestos de fala, apontar, acenar, comemorar) remapeados pelo Auto-Rig Pro, por script do Claude;
   - mocap do Pedro gravado no celular (Rokoko Vision; testar antes no plano grátis);
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

Antes de comprar, ver a seção seguinte, "Opções grátis ou baratas": dá para fazer tudo sem gastar além do que já é pago. Quase nada é assinatura. A base são 3 add-ons de compra única, cerca de R$ 876, vendidos no Superhive com 12 meses de atualização (guardar os instaladores), mais créditos pré-pagos.

| Software | Tipo | Preço | Quando | Por quê |
|---|---|---|---|---|
| Auto-Rig Pro Full | compra única | US$ 50 | Etapa 0 | esqueleto com cauda, orelhas e focinho, e mocap do Mixamo e do celular aplicado no Léo. O Rigify, grátis, é bem mais manual e não aplica mocap |
| Faceit 2.3 | compra única | US$ 99 | Etapa 0 | gera as 52 expressões do rosto automaticamente. Sem ele, seriam 52 esculpidas à mão; com ele, só 5 bocas |
| SpringFX Full | compra única | US$ 15 | Etapa 0 | cauda e orelhas balançam sozinhas e batem nas pernas e no chão. O Wiggle 2, grátis, faz o balanço sem a colisão |
| Créditos da Tripo (conta direta) | pré-pago | US$ 10 a 20 | Etapa 2 | geração final com seed fixa, remoção de luz e separação da camisa, que o Higgsfield não oferece |

**Só se precisar:**
- RunPod, pago por hora: se o EDIT-ADMIN não tiver placa NVIDIA.
- Rokoko Vision Basic, US$ 10 a 12 por mês: na Etapa 9, depois de testar o plano grátis.
- Meshy Pro, R$ 107,90 por um mês: se a Meshy vencer o teste em textura.
- Substance Painter, US$ 199,99 perpétuo: se a pintura de textura do Blender não der conta.

**Não assinar:** Maya, ZBrush, Cinema 4D, Reallusion, Marvelous, Rodin, Hi3D, Kling, Runway e Comfy Cloud. Ou o Blender já faz o mesmo de graça, ou o uso é para depois.

**Grátis:** Blender, Mixamo, Montreal Forced Aligner, Rhubarb, Wiggle 2 e Poly Haven.

## Opções grátis ou baratas (mesmo resultado)

Dá para fazer o Léo inteiro **sem gastar nada além do que já é pago** (Higgsfield e Claude). O que muda é o tempo, porque algumas etapas ficam mais manuais. O resultado na tela é o mesmo, com as diferenças anotadas abaixo.

| Pago | Alternativa grátis ou barata | Resultado | O que se perde | Tempo a mais |
|---|---|---|---|---|
| Auto-Rig Pro (US$ 50) | **Rigify**, que já vem no Blender: metarig humano com dedos, `spines.basic_tail` na cauda, `limbs.simple_tentacle` nas orelhas. Mocap pelo **plugin grátis da Rokoko** para Blender | o mesmo esqueleto, com IK/FK, cauda e orelhas | não posiciona os pontos sozinho e não traz retarget embutido | 2 a 4 dias |
| Faceit (US$ 99) | **rosto por ossos do Rigify**, com expressões e visemas salvos como poses na Pose Library, e formas corretivas esculpidas só onde precisar | para o Léo, quase o mesmo, porque a expressão da marca é contida (sorriso de canto, boca nunca escancarada) | o padrão ARKit pronto; a captura do iPhone ou da webcam passa a precisar de um script de conversão (o Claude escreve) | 3 a 5 dias |
| SpringFX (US$ 15) | **Wiggle 2 RTX** (GPLv3) ou **Jiggle Physics**, grátis | o mesmo balanço de cauda e orelhas, assado | a colisão da cauda com pernas e chão, que vira limite de rotação e ajuste na animação | meio dia |
| Créditos da Tripo (US$ 10 a 20) | **créditos do Higgsfield**, já pagos, com Tripo, Meshy e Hunyuan | a mesma malha-base | regerar igual pela seed, separação da camisa e remoção de luz; a prancha já vem com luz chapada e o GLB fica guardado | nenhum |
| Substance Painter (US$ 199,99) | **pintura de textura do Blender** | o mesmo: a cor base já vem da IA, é só retoque | camadas e máscaras inteligentes | 1 dia |
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
| **Grátis** | R$ 0 além do Higgsfield | se der para aceitar 1 a 2 semanas a mais no total |
| **Econômico** | US$ 50 (cerca de R$ 268), só o Auto-Rig Pro | é a compra que mais economiza tempo: posiciona o esqueleto sozinho e aplica mocap |
| **Completo** | US$ 164 (cerca de R$ 876) | o mais rápido, e com o padrão ARKit no rosto |

**Regra para trocar de pacote:**
- Começar no grátis é possível, mas a ferramenta do rig de corpo (Rigify ou Auto-Rig Pro) precisa estar decidida até o início da Etapa 5 e não muda depois: trocar refaz o esqueleto e as animações.
- O Faceit pode ser comprado mais tarde, na Etapa 6, se o rosto por ossos não convencer.

## Perguntas já respondidas

**Onde o esqueleto é feito?**
- No Blender, no EDIT-ADMIN, com o Auto-Rig Pro (Etapa 5), dentro do `Leo_v1.blend`.
- O Pedro marca uns 8 pontos (pescoço, queixo, ombros, pulsos, quadril, tornozelos) e o Auto-Rig Pro gera corpo e dedos.
- Depois entram cauda (8 a 12 ossos), orelhas (2 a 3 cada) e focinho. O rosto vem do Faceit (Etapa 6) e o balanço, do SpringFX.
- Esqueleto são os ossos; rig são os ossos mais os controles. Os controles não viajam entre programas, por isso o rig nasce onde a animação acontece.

**Fazer o modelo no Meshy e depois mandar para o Auto-Rig?**
- O modelo sai da IA, mas não vai direto para o rig.
- Na Etapa 2, teste com Tripo, Meshy e Hunyuan usando as mesmas imagens e os créditos do Higgsfield. A aposta é a Tripo H3.1.
- Depois, no Blender: refazer a malha (Etapa 3), texturas e teste de pelo (Etapa 4), e só então o Auto-Rig Pro (Etapa 5).
- O Auto-Rig Pro é um add-on dentro do Blender: "mandar para o Auto-Rig" é abrir o GLB no Blender.
- Por que não direto: malha crua de IA (triângulos sem ordem, olho pintado, boca sem interior, óculos grudados) deforma como borracha. O teste antigo da Tripo, com 977 mil faces e 23 ossos, falhou por isso.
- O rig automático da Meshy serve só para o Léo provisório da Etapa 8.

**Dá para fazer o rig nos sites?** Não o que o Léo precisa:
- Meshy e Tripo fazem rig automático humanoide, sem cauda, orelhas nem rosto;
- Hi3D e Rodin não fazem rig;
- ZBrush é escultura;
- Reallusion (Character Creator, iClone, AccuRIG) é só humanoide e sem pelo de verdade.

**ComfyUI e Kling?** Apoio, nunca a fonte do Léo, e só a partir da Etapa 11. Detalhes em "Ferramentas de apoio".

## Onde se faz o rig

**O rig mora onde a animação acontece:** controles, IK, drivers e o rig do rosto não viajam entre programas. Como o Léo vai ser animado e renderizado no Blender, o rig é feito no Blender:
- **Auto-Rig Pro** no corpo;
- **Faceit** no rosto;
- **SpringFX** na cauda e nas orelhas.

Os auto-rigs online (Meshy, Tripo, Mixamo, AccuRIG) fazem esqueleto humanoide sem cauda, orelhas nem rosto. Servem só para prévia e para o dublê da Etapa 2.

## Ferramentas de apoio: quando entram

| Ferramenta | Papel no projeto | Quando |
|---|---|---|
| Meshy, Tripo, Hunyuan (pelo Higgsfield) | malha-base e dublê | Etapa 2 |
| Hi3D, Rodin | fora (sem rig, foco em forma ou impressão) | não entram |
| ZBrush | dispensável: o sculpt do Blender cobre o necessário | não entra |
| Reallusion (CC5, iClone, AccuRIG) | fora: rig humanoide, sem pelo por fio, rosto só para humano | não entra |
| Kling 4.0 | apoio: keyframes do 3D e fundos; nunca a fonte do Léo | Etapa 11 |
| ComfyUI | apoio: fundos, LoRA de estáticos e saída aberta se uma API fechar; pede NVIDIA ou Comfy Cloud | Etapa 11 |
| Veo, Seedance e similares | nunca por cima do render do Léo (a deriva volta) | só fundo e B-roll |

## Contrato de nomes (fecha na Etapa 8)

- **Objetos:** `LEO_corpo`, `LEO_olho_L`, `LEO_olho_R`, `LEO_dentes`, `LEO_lingua`, `LEO_boca_interior`, `LEO_oculos`, `LEO_gravata`, `LEO_selo`, `LEO_pelo_<regiao>` (corpo, mascara, focinho, orelhas, cauda, bigodes).
- **Coleções:** `LEO_geometria`, `LEO_rig`, `LEO_pelo`, `LEO_acessorios`.
- **Rig:** nomes gerados pela ferramenta escolhida (Auto-Rig Pro ou Rigify), sem renomear.
- **Shape keys (pacote completo, com o Faceit):** as 52 do ARKit com a grafia oficial (`eyeBlinkLeft`, `jawOpen`, `mouthSmileLeft` e as demais). No pacote grátis, o rosto é por ossos e visemas e expressões ficam como poses, com os mesmos nomes abaixo.
- **Visemas:** `VIS_X`, `VIS_MBP`, `VIS_FV`, `VIS_A`, `VIS_E`, `VIS_I`, `VIS_O`, `VIS_U`, `VIS_SZ`, `VIS_CH`, `VIS_R`, `VIS_KG`.
- **Expressões:** `EXP_LEO_PADRAO`, `EXP_FALA_NEUTRA`, `EXP_FELIZ`, `EXP_RISADA_CONTIDA`, `EXP_SURPRESA`, `EXP_CURIOSO`, `EXP_PENSATIVO`, `EXP_CONFIANTE`, `EXP_PISCADELA`, `EXP_PREOCUPADO`, `EXP_DESCONFIADO`, `EXP_ALIVIO`, `EXP_EMPOLGADO`, `EXP_OPS`, `EXP_ESCUTA`, `EXP_DIDATICO`.

## Prazo e riscos do caminho Pedro + Claude

**Prazo:**
- **Por etapa:** os dias estão no título de cada etapa.
- **Total:** de 8 a 12 semanas até o primeiro reel, contando que o lançamento de 10/11 vai disputar o tempo do Pedro.
- **Marcos:** o M1 (Léo estático) sai por volta da metade desse caminho.

**Riscos e como cortar:**
- **A qualidade da cabeça, das bocas e do pelo depende da mão do Pedro.** Como cortar: o Claude prepara e confere cada passo por render; o padrão de expressão da marca é contido (sorriso de canto, boca nunca escancarada), o que reduz o alcance de rosto necessário.
- **Pelo é o maior risco técnico.** Ele é testado cedo, na Etapa 4, e pode virar um pelo mais estilizado se o realista não convencer.
- **Melhorar o Léo depois pode mudar a identidade.** Por isso a identidade congela na Etapa 3, e versão nova só sai com aprovação lado a lado.
- **Fornecedor que muda regra.** O mestre, os scripts e os seeds ficam com vocês; nenhuma etapa depois da 2 depende de serviço externo.
