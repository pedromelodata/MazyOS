---
tipo: pesquisa
data: 2026-10-29
status: decidido em 29/10/2026, caminho A (Pedro e Claude, no PC EDIT-ADMIN); execução em PLANO.md
assunto: Léo 3D canônico (malha, pelo, rig de corpo, rig facial, lip-sync, pipeline Blender)
metodo: 6 frentes de pesquisa em paralelo e 3 verificadores céticos (54 afirmações checadas em fonte oficial; nenhuma refutada por inteiro, 11 corrigidas em detalhe)
dados: dados/pesquisa-bruta-2026-10-29.json (117 opções avaliadas, com fonte e data de cada uma)
---

# Léo 3D: o que usar e como montar

> **Decisão do Pedro (29/10/2026):** o Léo 3D vai ser feito só pelo Pedro e pelo Claude, sem ninguém de fora, no PC EDIT-ADMIN (caminho A da seção 6). O passo a passo e o progresso estão em [PLANO.md](PLANO.md). O briefing da seção 14 fica como referência e não será usado agora.
>
> **Rota de custo zero (29/10/2026, à tarde):** nenhuma compra. AccuRIG (grátis) no esqueleto do corpo, rosto por ossos montado pelo Claude por código, Wiggle 2, Hunyuan 3D grátis para a malha-base (créditos do Higgsfield como reserva) e render no PC do Pedro, dia e noite. Auto-Rig Pro, Faceit e SpringFX ficam só como plano B. Detalhes na seção "Rota escolhida" do plano.

## Resumo em um minuto

1. **Trocar de modelo de vídeo não resolve.** Em outubro de 2026 nenhum modelo de vídeo trava rosto, óculos, selo e proporção de um take para outro, e os próprios fabricantes admitem a deriva. Três fornecedores mudaram as regras este ano: o Veo 3.1 Preview saiu da Gemini API em 22/10/2026 (substituído pelo Gemini Omni Flash), a OpenAI desligou o Sora e o Wan 3.0 fechou os pesos. A identidade do Léo só fica fixa quando os pixels dele saem de um arquivo 3D de vocês.
2. **A casa do Léo é o Blender 5.2 LTS.** É grátis, não tem teto de faturamento, tem suporte até julho de 2028 e faz pelo, rig, animação e render no mesmo arquivo. O Claude Code já pilota o Blender por script, e isso vira o motor de produção.
3. **IA 3D faz o rascunho, não o personagem.** O Tripo H3.1 é o melhor gerador para a malha-base do Léo. Mas nenhum gerador entrega rosto animável, olho com globo, boca com interior, pelo de verdade ou rig de cauda. O teste antigo (977 mil faces, 23 ossos, textura perdida) é a prova.
4. **O melhor por etapa:** Tripo H3.1 para a malha-base; artista retopologiza e esculpe no Blender; Auto-Rig Pro no corpo (dedos, cauda, orelhas); Faceit no rosto (52 shape keys ARKit); pelo nativo do Blender; lip-sync em português alinhando o áudio ao texto do roteiro (Montreal Forced Aligner); render Eevee ou Cycles; Remotion compõe.
5. **Quem faz:** um artista 3D sênior, ou dois (modelagem e pelo; rig e rosto). Faixa de R$ 25 a 60 mil, 6 a 10 semanas, pago por marcos e com cessão de direitos por escrito. Em paralelo, o Claude Code monta o estúdio inteiro com um Léo dublê, para o primeiro reel sair 2 a 3 dias depois da entrega.
6. **Máquina:** este notebook não renderiza pelo nem roda IA 3D local. Começar na nuvem (RTX 4090 de R$ 1,82 a 4,75 por hora) e comprar um desktop com RTX 5070 Ti 16 GB (PC de R$ 15 a 19 mil) só depois do Léo aprovado. Antes de tudo, conferir a GPU do PC EDIT-ADMIN.
7. **Prazo realista:** reels com o Léo já sem deriva a partir da semana 4; o Léo completo (pelo final, 52 expressões, fala em português) em 5 a 8 semanas.

## 1. Ponto de partida

### O que o Léo exige

| Traço | Por que é difícil no 3D | Como resolver |
|---|---|---|
| Pelo realista creme-castanho, máscara escura | o pelo precisa acompanhar a pele quando o rosto mexe, e render de pelo é pesado | hair curves do Blender com Deform Curves on Surface; pelo mais curto nas áreas que deformam; cor herdada da textura |
| Focinho de suricato | as 52 shapes do ARKit são de rosto humano; num focinho viram bico de pato | reesculpir à mão mouthFunnel, mouthPucker, mouthRoll, mouthShrug e noseSneer |
| Óculos redondos de aro fino | a IA funde o aro no rosto; lente com refração muda o tamanho do olho | modelar à parte, rígido no osso da cabeça, lente fina (Thin Wall do 5.2) |
| Polo coral com selo | cloth sim é lento, briga com o pelo e muda a cada take | polo rígida com skin e 3 a 5 shape keys corretivas; selo como decal |
| Cauda longa com ponta escura | auto-rig de IA não cria osso de cauda | cadeia de 8 a 12 ossos no Auto-Rig Pro e mola (SpringFX ou Wiggle 2) |
| Expressão padrão: olhos atentos, sorriso de canto, boca nunca escancarada | mocap humano e lip-sync automático abrem demais a mandíbula | limitar jawOpen (perto de 0,5) no próprio rig; LEO_PADRAO como pose, nunca esculpido na malha |

### O que já existe

- **Higgsfield via MCP:** Meshy 7 (rig humanoide e 678 animações), Meshy Multi-Image, Tripo H3.1 (imagem e multivista), Tripo P2, Hunyuan3D v3 e SAM 3D. Serve para o bake-off.
- **Folhas aprovadas** (frente, 3/4, perfil, costas, close) e **12 poses 2D** em `cronograma/estudio/base/assets/`.
- **Blender:** este PC tem só o 4.5. O kit de motion foi escrito para o 5.2, que está no PC EDIT-ADMIN, junto com o `suricato-rigged.blend` do teste antigo.
- **Remotion 4.0.531** com `@remotion/three`, R3F 9 e three 0.186. O kit já carrega GLB com esqueleto (`SkeletonUtils` em `src/kit/render/objetos/glb.ts`), mas ainda não toca clipes de animação nem dirige morph targets.

### A máquina

- **Este PC:** AMD Ryzen 7 5700U com Radeon Vega integrada, 15,4 GB de RAM, 108 GB livres, sem NVIDIA.
- **Consequências:** Cycles em GPU não roda (o HIP do Blender exige RDNA1 ou mais nova); os modelos abertos de IA 3D (TRELLIS.2, Hunyuan 2.1, UniRig) pedem CUDA com 8 a 26 GB; o Blender recomenda 32 GB de RAM.
- **Serve para:** scripts, prévias leves (Workbench ou Eevee em 540x960) e animação num Léo sem pelo (proxy com Simplify).

## 2. O que a IA 3D faz e o que não faz

**Faz bem**, em minutos e por menos de US$ 1 por tentativa: forma geral, proporção, textura de cor fiel às folhas, base para retopologia e referência de volume para o artista.

**Não faz:**
- topologia de rosto com loops nos olhos e na boca (todo "quad" de IA é base, não malha de animação);
- olhos esféricos separados, boca com dentes e língua;
- pelo de verdade (vem pintado na textura ou como grumos na malha);
- rig de cauda, orelhas e rosto (a API de rig da Meshy só aceita humanoide e não cita rosto; a da Tripo faz corpo sem face);
- óculos finos (fundem no rosto e saem com aro grosso ou lente opaca).

**Regras de entrada, para qualquer gerador:**
- prancha em A-pose (braços a 45 graus, dedos abertos), cauda estendida para trás sem tocar as pernas;
- boca fechada neutra e olhos para a frente;
- sem óculos e sem bigodes (entram depois, no Blender);
- luz chapada e fundo liso, sem Luz Coral (a luz da referência fica assada na textura);
- perfil direito desenhado de verdade, não espelhado (o selo é assimétrico);
- a prancha passa pela aprovação do Pedro antes de gastar crédito, porque redesenhar o Léo com IA de imagem pode trazer a deriva de volta.

### Ranking dos geradores para o Léo

| # | Gerador | A favor | Contra | Preço | Onde |
|---|---|---|---|---|---|
| 1 | **Tripo H3.1** | 1º na arena Top 3D AI (03/08/2026, ranking publicado por terceiro); multivista com vistas nomeadas; segmentação v2 com hint; completion; retopo quad; seeds reprodutíveis | partes saem sem textura; o delight só age com `texture_version=v3.5-20260815` explícito; no Higgsfield não tem model_seed nem segmentação | cerca de US$ 0,60 por geração completa (60 créditos a US$ 0,01) | Higgsfield no bake-off; conta direta (developers.tripo3d.ai) na versão final |
| 2 | **Meshy 7.1** | alinhamento à imagem; pose_mode A-pose; textura com 4 vistas; Ultra 4K (só imagem única, conta direta) | ignora remove_lighting; rig só humanoide | Pro R$ 107,90/mês (1.000 créditos, com API) | Higgsfield e conta direta |
| 3 | **Hunyuan3D 3.x / Studio** | separa roupa; retopo quad; UV; muito barato; 20 gerações grátis por dia na web | "até 8 vistas" não verificado; cláusula de output não localizada; rig exige T-pose | cerca de US$ 0,50 por geração | Higgsfield (v3) e Tencent Cloud |
| 4 | **Rodin Gen-2.5** | aceita de 1 a 5 imagens | quad e TAPose não aparecem na especificação oficial; sem rig | US$ 0,40 no fal.ai | fora do Higgsfield |

- **Plano B aberto:** TRELLIS.2 (MIT) e Hunyuan 2.1/Omni (licença comunitária; vale no Brasil) em GPU alugada.
- **Fora:** CSM (domínio não resolve), Luma Genie (encerrado), Roblox Cube (licença só de pesquisa), SAM 3D (foto de objeto real), geração por partes aberta (PartCrafter, OmniPart: treinada em objetos).
- **Custo da frente:** R$ 100 a 400. **Prazo:** 3 a 5 dias até a malha-base aprovada.

## 3. A escolha, etapa por etapa

| Etapa | Escolha | Por quê | Custo | Alternativa |
|---|---|---|---|---|
| Hub | **Blender 5.2 LTS** | grátis, sem teto de faturamento; pelo, rig, animação e render no mesmo arquivo; o Claude Code já pilota | R$ 0 | Maya (R$ 7.760/ano na revenda brasileira; o rig não viaja por FBX) |
| Malha-base | **Tripo H3.1**, em bake-off com Meshy 7.1 e Hunyuan 3.x | ver a seção 2 | R$ 100 a 400 | Hunyuan Studio |
| Escultura, retopologia e UV | **artista, dentro do Blender** | loops de rosto exigem mão humana | no orçamento do artista | ZBrush, se o artista usar |
| Textura | **Substance 3D Painter** (Steam, perpétuo) | polo em piquet, selo, armação, focinho e o mapa de cor que o pelo herda | US$ 199,99 | pintura de textura do Blender |
| Pelo | **hair curves nativo do Blender** | pelo de suricato é curto e denso, o caso mais simples; Ornatrix não existe para Blender | R$ 0 | Sisir (groom grátis, beta) |
| Rig de corpo | **Auto-Rig Pro Full** | Smart para corpo e dedos, mais cauda, orelhas, focinho, IK digitígrado, Remap de mocap e export FBX/GLTF | US$ 50 (12 meses de update) | Rigify (grátis, mais manual, sem retarget) |
| Física secundária | **SpringFX Full** ou Wiggle 2 | cauda e orelhas com atraso e balanço, sempre assados antes do render | US$ 15 ou grátis | Jiggle Physics |
| Rosto | **Faceit 2.3** | gera as 52 shape keys ARKit, cria control rig e importa iPhone, webcam e Audio2Face; a FAQ oficial cita lobos, ovelhas e dragões | US$ 99 | MHFRT (US$ 24,99, topologia de rosto humano) |
| Expressões | **Pose Library + Asset Shelf** | 16 poses do control rig, inclusive a LEO_PADRAO | R$ 0 | nativo |
| Lip-sync em português | **Montreal Forced Aligner** (modelo de português) + tabela de 12 visemas + script do Claude Code | usa o texto do roteiro; preciso; roda em CPU | R$ 0 | Rhubarb phonetic (grátis, menos preciso, ignora o texto) |
| Movimento do corpo | **Mixamo + ActorCore + mocap por vídeo do Pedro** (Rokoko Vision Basic), remapeados pelo Auto-Rig Pro | só humanoide, mas o Remap resolve; cauda e orelhas ficam com as molas | US$ 10 a 12/mês | QuickMagic (captura dedos); Cascadeur (keyframe assistido) |
| Render | **Eevee** no volume e **Cycles** nos closes, decididos por teste A/B | o Eevee não tem shader físico de cabelo | nuvem, R$ 40 a 860/mês | Unreal 5.8 (fase 2) |
| Composição | **Remotion** (já usado), com o Léo entrando como sequência PNG com alfa | o glTF não tem primitiva de pelo | R$ 0 a US$ 25 por assento/mês | After Effects |

## 4. Criar fora e animar no Blender: o que viaja e o que não viaja

| Item | Viaja para o Blender? | Observação |
|---|---|---|
| Malha, UV, texturas PBR | sim (GLB, FBX, OBJ) | por isso IA 3D, ZBrush e Substance podem ficar fora |
| Shape keys | sim (FBX, GLB) | precisam chegar com nomes fixos |
| Ossos e pesos | sim (FBX) | sem os controles |
| Controles do rig (IK/FK, constraints, drivers) | não | o rig nasce onde a animação acontece |
| Pelo (groom) | não pelo GLB; parcial por Alembic | o groom nasce no Blender |
| Rig facial com drivers | não | nasce no Blender |
| Simulação de roupa | só assada | |

**Conclusão:** dá para criar fora e animar no Blender, desde que "fora" seja só forma e textura. Rig, pelo, rosto, animação e render nascem e moram no Blender.

### O fluxo completo

1. Folhas aprovadas viram a prancha em A-pose, aprovada pelo Pedro.
2. IA 3D (Tripo H3.1, depois do bake-off) gera a malha-base em GLB: só forma e cor.
3. No Blender 5.2, num arquivo mestre (`Leo_v1.blend`): retopologia e escultura; UV e texturas; óculos, gravata, olhos, dentes, língua e selo como objetos separados; rig do corpo; rig do rosto com ARKit 52; visemas em português; biblioteca de 16 expressões; pelo.
4. Cada take linka o mestre por library override (o mestre nunca é editado num take).
5. O Claude escreve o `take.json`; os scripts montam a cena, aplicam a pose e o lip-sync e renderizam em lote na nuvem.
6. O Léo sai como sequência PNG com alfa.
7. O Remotion junta fundo, lettering, legenda e som e aplica cor e grão uma vez só, gerando o reel 9:16.

## 5. Plano em fases

### Semana 0: agora, sem depender de ninguém

1. **Pedro decide** quem faz (seção 6) e o teto de orçamento.
2. **Publicar o briefing** (seção 14) e contratar um teste pago com 2 ou 3 artistas: a cabeça do Léo em argila 3D, em 3 a 5 dias, por R$ 1.500 a 3.000 cada (estimativa). Pelo menos um brasileiro e um de fora, todos com portfólio de animal peludo em Blender.
3. **Prancha em A-pose aprovada e bake-off de IA** (Tripo, Meshy e Hunyuan no Higgsfield; Rodin opcional). O Claude baixa os GLB e renderiza turntables lado a lado no Blender em background. O vencedor vai para o artista como referência de volume.
4. **Claude Code monta o estúdio:**
   - instala o Blender 5.2 LTS ao lado do 4.5 e porta os scripts;
   - cria um Léo dublê (manequim por script com os mesmos nomes de ossos e shape keys do contrato);
   - escreve `luz_coral.py`, `camera_9x16.py`, `montar_take.py`, `lipsync.py` (MFA), `render_lote.py` e `qa_quadro.py`;
   - monta o template da RunPod e roda um benchmark de 30 quadros, Eevee contra Cycles.

### Semanas 1 a 4: etapa A do artista

- Escultura aprovada em turnaround lado a lado com as folhas; retopologia; UV; texturas.
- Polo, óculos, gravata e selo.
- Rig do corpo (dedos, cauda, orelhas) e rosto básico (piscada, olhar, visemas em português).
- Versão leve em GLB (pelo em cards) para o Remotion.
- **A partir daqui já saem reels com o Léo sem deriva.**

### Semanas 4 a 8: etapa B

- Pelo final (versão herói e versão leve).
- 52 shape keys ARKit reesculpidas para o focinho e as 16 expressões.
- Corretivas da polo, teste de fala de 10 s em português, idle e caminhada.
- Teste A/B de motor com um close em contraluz coral atravessando o pelo, com névoa.

### Produção, a partir da entrega

- O fluxo vira roteiro, `take.json`, render e Remotion.
- Meta: o primeiro reel sai 2 a 3 dias depois da entrega; depois, um gesto por take, com biblioteca de 20 a 30 ações.

### Enquanto o Léo 3D não chega

- Vídeo gerado com o Léo só com aprovação quadro a quadro (selo, óculos, gravata).
- Preferir peças com as 12 poses 2D aprovadas ou sem o Léo.

## 6. Quem faz: quatro caminhos

| Caminho | Custo | Prazo | Qualidade | Independência | Quando escolher |
|---|---|---|---|---|---|
| **A. Interno** (Pedro + Claude Code + IA + add-ons) | R$ 2 a 5 mil + nuvem | 6 a 12 semanas, incerto | média; rosto e pelo abaixo do padrão das folhas | total | sem verba para artista, aceitando um Léo mais simples |
| **B. Artista de avatar realtime** (estilo VRChat/VTuber, ARKit 52) | US$ 800 a 2.500 (R$ 4 a 13 mil), sinal de campo sem data | 2 a 4 semanas (estimativa) | de jogo: boa para GLB no Remotion, fraca em close cinematográfico | alta, se vier o .blend | precisa de algo já; versão leve |
| **C. Freelancer sênior** (recomendado) | R$ 25 a 60 mil (Brasil) ou US$ 6 a 15 mil (exterior) | 6 a 10 semanas, em 2 marcos | profissional | total, com cessão por escrito e arquivos-fonte | o caso do Léo |
| **D. Estúdio** | R$ 60 a 150 mil | 8 a 14 semanas | menor risco técnico | só se o contrato entregar os arquivos-fonte | se quiser terceirizar também as animações |

- **Dica para o caminho C:** dividir entre dois profissionais (modelagem e pelo; rig e rosto) costuma ser mais rápido, porque poucos dominam ao mesmo tempo groom de animal e rig facial ARKit.
- **O caminho A tem limite claro:** script não esculpe. Reesculpir os shapes de boca, acertar pesos e pentear pelo é trabalho manual, e o próprio verificador chamou de otimista o prazo de 2 a 3 semanas feito por dentro.

## 7. Máquina e render

- **Agora: RunPod.** RTX 4090 a US$ 0,34/h no Community (máquinas de terceiros) ou US$ 0,89/h no Secure, com cobrança por segundo. Para o mestre do Léo antes do lançamento, usar o Secure.
- **Por reel de 30 s (720 quadros):** Eevee de R$ 1 a 10, Cycles de R$ 11 a 120.
- **Por mês, com 12 reels:** de R$ 40 a 330 no Community ou de R$ 105 a 860 no Secure.
- Validar tudo no benchmark de 30 quadros, que também confere se o Eevee roda em background no Linux da nuvem.
- **Depois: desktop com RTX 5070 Ti 16 GB.**
  - Preço da placa: R$ 8.445,90 em 29/10, contra mediana de 90 dias de R$ 7.919,93 e mínima de R$ 7.099,99.
  - PC completo com 64 GB de RAM: de R$ 15 a 19 mil.
  - Evitar a RTX 5070 de 12 GB. A 5080 rende só 19% a mais com os mesmos 16 GB. A 5090 vale só alugada.
  - Comprar quando o Léo mestre for aprovado e houver alguém interno animando, com um alerta de preço perto de R$ 8.000.
- **Conferir antes:** a GPU do PC EDIT-ADMIN, onde está o Blender 5.2. Se for NVIDIA de 12 a 16 GB, ela vira a estação de trabalho já.
- **Nunca usar farm comunitária com o mestre do Léo.** No SheepIt, o .blend vai para máquinas de voluntários.
- **Eevee ou Cycles:**
  - o Eevee não suporta Hair BSDF nem Principled Hair BSDF, e a névoa dele é single scattering;
  - o Cycles dá pelagem e névoa de filme, mas leva de dezenas de segundos a minutos por quadro;
  - escolher um motor canônico e não trocar entre takes, porque o pelo muda de cara.

## 8. Rosto e fala em português

### Arquitetura

- **Rosto híbrido:** ossos para mandíbula, olhos, pálpebras, orelhas e ponta do focinho; shape keys com os 52 nomes ARKit mais os visemas de português.
- **O padrão ARKit é o que dá independência:** iPhone (Live Link Face, grátis), webcam (MediaPipe, Apache 2.0), Audio2Face e Faceit falam a mesma língua, e as shape keys viram morph targets no GLB.

### Os 12 visemas pt-BR (poses do control rig)

| Visema | Sons |
|---|---|
| X | repouso, volta para a LEO_PADRAO |
| MBP | lábios selados |
| FV | lábio inferior no dente |
| A | aberto, com teto |
| E | e, é |
| I | i |
| O | o, ó |
| U | u (inclui o L final, como em "Brasil") |
| SZ | s, z, t, d, n, l |
| CH | ch, j, lh, nh (inclui ti e di) |
| R | r |
| KG | k, g |

As nasais reaproveitam A, E e O com menos abertura. Referência: De Martino, Magalhães e Violaro (2006), visemas do português do Brasil.

### Lip-sync

- **Base: Montreal Forced Aligner.** Ele alinha o WAV ao texto do roteiro, e um script converte os fonemas em visemas com coarticulação:
  - antecipar 1 a 2 quadros;
  - sempre fechar a boca em m, b e p;
  - encostar o lábio no dente em f e v;
  - pular consoantes de 1 quadro.
- **Saída:** keyframes no .blend e um JSON que também serve para o three.js.
- **Plano B:** Rhubarb em modo phonetic. Atenção: esse modo ignora o texto do roteiro.
- **Azure TTS:** entrega visemas e blend shapes ARKit em pt-BR, mas só com voz neural padrão (nenhuma voz HD entrega). Só vale se a voz do Léo mudar para o Azure.
- **ElevenLabs:** tem API de forced alignment, mas as línguas aceitas não estão listadas.
- **Audio2Face-3D:** modelos abertos desde 24/09/2025, com saída ARKit. Não tem plugin oficial de Blender, na prática pede NVIDIA e não lista português. Vale um teste opcional de 1 hora, com a chave grátis do build.nvidia.com.

### As 16 expressões

LEO_PADRAO (olhos atentos, sorriso de canto assimétrico), fala neutra, feliz de boca fechada, risada contida, surpresa, curioso, pensativo, confiante, piscadela, preocupado, desconfiado, alívio, empolgado, ops, escuta atenta e didático. Orelhas e focinho fazem parte de cada pose.

### Regras de marca dentro do rig

- **Boca:** jawOpen limitado perto de 0,5, com mouthStretch e mouthLowerDown também limitados. A boca escancarada fica fisicamente impossível.
- **Olhar vivo:** piscadas a cada 2 a 6 s e micro-sacadas por script. Sem isso, o Léo vira boneco mesmo com rig perfeito.

## 9. Cenários

- **A regra da campanha é câmera travada** nos 4 planos (MESA, MÃO, OMBRO, ENTRADA). Por isso, fundos 2.5D em Luz Coral resolvem a maioria dos takes. A IA de imagem pode variar o fundo; o Léo, nunca.
- **Contato e sombra:**
  - chão e props em 3D, aproveitando os GLB que o kit já tem catalogados (props de mesa, notebook, cédula, símbolo, relógios, celulares);
  - Poly Haven e Kenney (CC0) cobrem o resto, inclusive HDRI de golden hour.
- **Depois:** 3 a 5 sets recorrentes (escritório, sala), de dois jeitos:
  - World Labs Marble (Pro US$ 35/mês, preço não reconferido; a empresa está sendo comprada pela AMD);
  - Gaussian splats no Blender 5.3 (beta, luz assada, reiluminação aproximada), numa instalação paralela, com o mestre no 5.2.
- **Licenças:** manter um manifesto por asset. No Sketchfab a licença varia por modelo, e NC proíbe uso comercial.

## 10. IA de vídeo daqui para frente

- **O Léo sempre sai do render 3D.** A IA gera fundo, cenário e B-roll sem o Léo.
- **Para embelezar um plano inteiro:**
  - Kling 4.0 com 3 a 10 keyframes renderizados do 3D;
  - Runway Aleph 2.0 ou Kling Edit por cima do render, em força baixa;
  - em qualquer caso, conferir selo, óculos e gravata quadro a quadro.
- **Nunca passar o render final do Léo por Veo, Seedance ou similar "para melhorar".** A deriva volta.
- **Estáticos e capas:** LoRA treinada com 40 a 80 renders do 3D num modelo Apache 2.0 (Qwen-Image ou FLUX.2 klein 4B), por US$ 2 a 5 por treino. O selo e o aro ainda pedem retoque no Photoshop.
- **Soul ID do Higgsfield:** foi feito para rosto humano e não serve para o Léo.

## 11. Automação com o Claude Code

- **Base:** bpy em background no Blender 5.2 LTS, o padrão que o time já usa.
- **Quebras da API 5.0:**
  - `scene.node_tree` virou `scene.compositing_node_group`;
  - `BLENDER_EEVEE_NEXT` virou `BLENDER_EEVEE`;
  - `action.fcurves` foi para os channelbags.
- **Contrato de nomes** (ossos, shape keys e propriedades) fechado antes da modelagem. É ele que permite trocar o dublê pelo mestre sem mexer nos scripts.
- **Proteção do mestre:** cada take linka o mestre por library override, e o QA confere o hash dele.
- **MCP oficial do Blender** (Blender Lab, add-on v1.0.3, Blender 5.1 ou mais novo, 26 ferramentas):
  - serve para inspecionar o .blend do artista e consultar a API certa;
  - executa código sem proteção, então deve rodar num usuário Windows separado ou numa VM, longe de dados de clientes (LGPD).
- **MCP comunitário ahujasid/blender-mcp:** tem a CVE-2026-10688 (injeção de código) sem correção e socket sem autenticação. Só em sandbox.
- **O LLM não modela o Léo.** Os benchmarks de 2025 e 2026 (BlenderGym, BlenderWorld) mostram erro de coerência espacial fina. O LLM orquestra; o personagem vem do artista.

## 12. Riscos e cuidados

- **Termos do Higgsfield (23/10/2026):**
  - não restringem o uso comercial do que é gerado;
  - permitem treinar com tudo que é enviado e gerado (exceto no plano Enterprise);
  - por isso, usar o Higgsfield só no bake-off, com a malha final e o mestre em conta direta e armazenamento próprio. Mesmo cuidado com as folhas aprovadas.
- **Termos da Tripo:** a página bloqueou a leitura automática. Ler no navegador, ou pedir por escrito em business@tripo3d.ai, antes da malha final: propriedade, uso comercial e uso dos uploads para treino.
- **Contrato com o artista:** cessão total e definitiva só vale por escrito (Lei 9.610/98, arts. 49 e 50); sem isso, vale no máximo 5 anos, com interpretação restritiva. O detalhe está no briefing da seção 14.
- **Versões:**
  - fixar o Blender 5.2 LTS em tudo (mestre, scripts e nuvem);
  - Auto-Rig Pro e Faceit dão 12 meses de update, então guardar os instaladores;
  - a Meshy aposenta modos com poucas semanas de aviso (meshy-5 em 10/10/2026, lowpoly em 30/10/2026), então versionar GLB, texturas, seeds e entradas.
- **Aceite técnico:** o .blend final abre e renderiza em background sem add-on pago obrigatório e sem driver com expressão Python.
- **Licença do Remotion:** é grátis para empresas de até 3 pessoas. A partir de 4, vale a Company License (US$ 25 por assento/mês). O time listado tem 5 pessoas: vale conferir quantas usam.
- **Teto de faturamento:** Cascadeur Indie, Maya Indie e Houdini Indie exigem receita abaixo de US$ 100 mil por ano.
- **Cor:** travar a transformação (AgX) e conferir o coral #F2643C com um card de cor no render. Grade e grão numa etapa só.

## 13. Custos

| Item | Valor |
|---|---|
| Software, uma vez: Auto-Rig Pro US$ 50 + Faceit US$ 99 + SpringFX US$ 15 + Substance Painter (Steam) US$ 199,99 | US$ 363,99, cerca de R$ 1.945 (PTAX de 28/10: R$ 5,342) |
| IA 3D (bake-off e versão final) | R$ 100 a 400 |
| Mocap por vídeo (opcional) | R$ 54 a 64/mês |
| Render na nuvem | R$ 40 a 860/mês, conforme motor e tipo de nuvem |
| Teste pago com artistas | R$ 1.500 a 3.000 por artista |
| Artista (caminho C) | R$ 25 a 60 mil no Brasil, ou US$ 6 a 15 mil fora |
| Desktop com RTX 5070 Ti (opcional, depois) | R$ 15 a 19 mil |
| Remotion Company (se 4 ou mais pessoas usarem) | US$ 25 por assento/mês |

**Caminho recomendado (C), sem desktop:** cerca de R$ 30 a 65 mil no projeto, mais R$ 100 a 900 por mês de operação.

## 14. Briefing pronto para o artista

> **Personagem 3D: mascote suricato antropomórfico, com pelo, rig de corpo e rig facial ARKit, em Blender**
>
> **Contexto.** Mascote de marca (contabilidade digital, Brasil) para reels verticais. Anexos: folhas aprovadas (frente, 3/4, perfil, costas, close do rosto) e 12 poses 2D. Uma malha-base gerada por IA vai junto só como referência de volume; não é a malha final.
>
> **O personagem.** Suricato antropomórfico de pé, com proporção normal da espécie (sem cabeça de cartoon), look CG estilizado-realista de longa de animação. Pelo creme-castanho curto e denso, máscara escura nos olhos, orelhas pequenas e escuras, focinho escuro, bigodes. Óculos redondos de aro marrom, gravata borboleta cinza, camisa polo coral #F2643C com um selo branco arredondado com check coral no peito (vetor fornecido). Cauda longa com ponta escura. Expressão padrão: olhos atentos e sorriso de canto; boca nunca escancarada.
>
> **Entregáveis.**
> 1. `Leo_v1.blend` no Blender 5.2 LTS, organizado em coleções e com os nomes do contrato de nomes.
> 2. Malha em quads (base na ordem de 20 a 40 mil faces), com loops em olhos, boca, focinho, ombros, cotovelos, joelhos e base da cauda. UV sem sobreposição.
> 3. Olhos esféricos, dentes, língua, óculos, gravata e selo como objetos separados.
> 4. Texturas PBR 4K, inclusive o mapa de cor que o pelo herda.
> 5. Pelo em hair curves do Blender (versão herói e versão leve), com máscara de densidade sob a roupa; bigodes como curvas próprias.
> 6. Rig de corpo (Auto-Rig Pro ou Rigify, declarado no contrato): IK/FK, dedos, cauda de 8 a 12 ossos, orelhas com 2 a 3 ossos cada, focinho e controle de ajuste dos óculos. Polo com skin e 3 a 5 shape keys corretivas.
> 7. Rig facial: as 52 shape keys com os nomes exatos do ARKit, reesculpidas para o focinho (mouthFunnel, mouthPucker, mouthRoll, mouthShrug, noseSneer), corretiva de piscada, ossos de olhar e pálpebra, e control rig de ossos.
> 8. 12 visemas pt-BR e 16 expressões como poses na Pose Library (listas fornecidas).
> 9. Versão leve em GLB (pelo em cards ou shells, shape keys assadas, até 4 influências por vértice) para three.js.
> 10. Turntable e as 12 poses 2D recriadas em 3D, para aprovação lado a lado.
>
> **Critérios de aceite.**
> - O turntable bate com as folhas, com aprovação lado a lado.
> - As 12 poses em 3D batem com as 12 poses 2D.
> - Teste de fala de 10 s em português, sem boca escancarada.
> - O `.blend` abre e renderiza em background (`blender -b`), sem add-on pago obrigatório e sem driver com expressão Python.
> - Nenhum pelo atravessa polo, gola, mangas ou óculos nas poses extremas.
>
> **Marcos e pagamento.**
> - Teste pago: a cabeça em argila 3D, em 3 a 5 dias.
> - Etapa A, em cerca de 4 semanas: escultura, retopologia, textura, roupa, rig de corpo, rosto básico e GLB leve.
> - Etapa B, em cerca de 4 semanas: pelo final, ARKit 52, expressões, visemas e teste de fala.
> - Pagamento por marco, com aceite em cada um.
>
> **Contrato de nomes.** Uma lista fechada no kickoff, antes da modelagem, e congelada:
> - ossos de cauda, orelhas e focinho;
> - as 52 shape keys ARKit com a grafia oficial;
> - visemas `VIS_X`, `VIS_MBP`, `VIS_FV`, `VIS_A`, `VIS_E`, `VIS_I`, `VIS_O`, `VIS_U`, `VIS_SZ`, `VIS_CH`, `VIS_R` e `VIS_KG`;
> - expressões `EXP_LEO_PADRAO` e as demais.
>
> **Jurídico.**
> - Cessão total e definitiva dos direitos patrimoniais por escrito (Lei 9.610/98, arts. 49 e 50).
> - Modalidades listadas: publicidade, redes sociais, TV, impressos, merchandising, obras derivadas e treino de modelos de IA com os renders.
> - Território mundial, sem prazo e com preço.
> - Autorização expressa para modificação e obras derivadas, porque os direitos morais do art. 27 não se cedem.
> - NDA, declaração de origem de todos os assets (inclusive bases de IA) e entrega de todos os arquivos-fonte.

## 15. O que os verificadores corrigiram

- **Tripo, delight:** só funciona com `texture_version=v3.5-20260815` explícito; no padrão ele não age.
- **Tripo, auto-rig:** o tipo "others" é da v3.0-20260909 (não da v2.5); sem versão explícita, a Tripo usa a v1.0, só bípede.
- **Rhubarb:** o modo phonetic ignora o texto do roteiro.
- **Azure:** nenhuma voz HD entrega blend shapes.
- **Meshy:** o limite de entrada do rig é de 320 mil faces; existe um Starter de R$ 54 sem API, e o plano Ultra saiu da página de preços.
- **Rokoko Vision:** só o Basic aparece na página oficial.
- **Audio2Face:** o SDK tem fallback de CPU, mas na prática pede NVIDIA.
- **Marvelous Designer:** existe plano Indie para organizações de até 5 usuários.
- **Soul ID:** a frase "não serve para inventar personagens" veio de página secundária; a conclusão continua a mesma.

## 16. O que ficou sem verificar

A cota de buscas na web da sessão acabou durante a pesquisa. As checagens finais foram feitas lendo direto as páginas oficiais. Ficaram em aberto:

- termos e preço do site da Tripo (bloqueados), FAQ do Mixamo e termos do Rokoko Vision;
- as "8 vistas" do Hunyuan 3.1, e quad e TAPose no Rodin Gen-2.5;
- preço do Marble, preço pago do Azure TTS e teto do Maya Indie no Brasil;
- quantos créditos do Higgsfield custa cada geração 3D (o catálogo não mostra);
- faixas de freelancer brasileiro (benchmark sem metodologia publicada) e de artista de avatar (páginas de comissão sem data);
- se o Autodesk Flow Studio aceita personagem com cauda;
- se o Eevee roda em background no contêiner Linux da RunPod.

## 17. Fontes principais

- Tripo H3.1: https://developers.tripo3d.com/en/models/v3-1 · preços da API: https://developers.tripo3d.com/en/pricing
- Meshy, changelog da API: https://docs.meshy.ai/en/api/changelog · Image to 3D: https://docs.meshy.ai/en/api/image-to-3d
- Hunyuan 3D, preço de créditos: https://www.tencentcloud.com/techpedia/148275?lang=en
- Auto-Rig Pro: https://superhivemarket.com/products/auto-rig-pro · documentação: https://www.lucky3d.fr/auto-rig-pro/doc/auto_rig.html · Remap: https://www.lucky3d.fr/auto-rig-pro/doc/remap_doc.html
- Faceit: https://superhivemarket.com/products/faceit · FAQ: https://faceit-doc.readthedocs.io/en/latest/FAQ/
- SpringFX: https://superhivemarket.com/products/springfx · Wiggle 2: https://extensions.blender.org/add-ons/wiggle-2/
- Montreal Forced Aligner, modelos de português: https://mfa-models.readthedocs.io/en/latest/acoustic/Portuguese/index.html
- Visemas do português do Brasil: https://doi.org/10.1016/j.cag.2006.08.017
- Rhubarb Lip Sync: https://github.com/DanielSWolf/rhubarb-lip-sync · Rhubarb Lipsync NG: https://github.com/Premik/blender_rhubarb_lipsync_ng
- NVIDIA Audio2Face-3D: https://github.com/NVIDIA/Audio2Face-3D
- Blender 5.2 LTS: https://developer.blender.org/docs/release_notes/5.2/ · mudanças da API 5.0: https://developer.blender.org/docs/release_notes/5.0/python_api/
- Limitações do Eevee (cabelo): https://docs.blender.org/manual/en/latest/render/eevee/limitations/nodes_support.html
- MCP oficial do Blender: https://www.blender.org/lab/mcp-server/ · CVEs do blender-mcp comunitário: https://app.opencve.io/cve/?product=blender-mcp&vendor=ahujasid
- Rokoko Vision: https://www.rokoko.com/products/vision
- RunPod: https://www.runpod.io/pricing · RTX 5070 Ti no Brasil: https://radargpu.com.br/gpu/rtx-5070-ti/
- Remotion e three.js: https://www.remotion.dev/docs/three · licença: https://www.remotion.pro/license
- Kling 4.0: https://kling.ai/quickstart/kling-4-model-user-guide · preços na Runway API: https://docs.dev.runwayml.com/guides/pricing/
- Qwen-Image (Apache 2.0): https://huggingface.co/Qwen/Qwen-Image · FLUX.2 klein 4B: https://huggingface.co/black-forest-labs/FLUX.2-klein-4B
- Freelancer 3D no Brasil, benchmark 2026: https://www.lancei.pro/benchmark/motion-design-3d

As 117 opções avaliadas, com fonte e data de cada afirmação, estão em `dados/pesquisa-bruta-2026-10-29.json`.
