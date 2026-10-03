# Extensão "tradicional-vs-legalizai" do kit de motion (`RM/src/kit/ext/tradicional-vs-legalizai/`)

Reel 9:16 de 05/10/2026 "Contabilidade tradicional vs Legalizaí", a versão animada do carrossel do mesmo dia. Contrato: `KIT/DESENHO.md`, seções 4.3 e 4.10. Roteiro e decupagem aprovados: `KIT/pecas/2026-10-05-tradicional-vs-legalizai/ROTEIRO.md`. Cena: `KIT/pecas/2026-10-05-tradicional-vs-legalizai/cenas.json`.

**Desde 03/10/2026 o código desta extensão é do kit.** O palco, as peças de argila, os cartões, a luz, as vitrines, as 22 batidas e a camada `pilula-comenta` foram pra extensão comum (`RM/src/kit/ext/comum/`, LEIA-ME lá), com os mesmos ids, os mesmos números padrão e o mesmo código (os sons padrão de 5 delas viraram os do final da peça, que a cena já mandava). Aqui ficou só o que é da peça: o tipo de palco `palco-tvl`, com as 20 peças, as poses e as opções do reel. A cena da peça não mudou e o render saiu igual (provas em `KIT/pecas/2026-10-05-tradicional-vs-legalizai/provas/kit-comum/`). O código desta pasta antes da mudança está guardado em `KIT/pecas/2026-10-05-tradicional-vs-legalizai/provas/kit-comum/ext-original/`, com o md5 de cada arquivo (pra conferir ou voltar atrás).

| arquivo | o que é |
|---|---|
| `comum.ts` | as peças do palco da peça (`PECAS_TVL`) e o registro do tipo `palco-tvl` (`registraPalco` da extensão comum, com as vitrines, a fileira e a câmera de repouso padrão do palco de argila) |
| `batidas.ts` | nenhuma batida (estão na extensão comum); exporta `palcos`, que diz se o tipo entrou no registro |
| `render.tsx` | liga o tipo `palco-tvl` à fábrica do palco de argila (`ext/comum/palco/fabrica.ts`) |

Nenhum arquivo do núcleo, do render do kit ou do carrossel foi editado: as duas extensões só importam.

## O palco da peça (`palco-tvl`)

Na cena, o objeto `palco` usa o modelo `proc-cena-guia` com `"tipo": "palco-tvl"` (é anterior ao item `proc-palco-argila` do catálogo; não troque, a peça está entregue e provada assim). O palco, as vitrines, a luz, as sombras e os canais estão descritos no LEIA-ME da extensão comum.

- Peças frias: `pilhaA` (com o `carimbo`; o formulário de cima recebe a marca e voa pra `pastaA`), `despP`, `pastaA` (começa aberta), `despG` (com o ponteiro dos segundos), `envelope`, `pilhaB`, `lupa` (pivô na ponta do cabo), `pastaC` (folha "Contrato social").
- Cartões: `cartaoNasceu` (tela `homeDia1`), `cartaoImposto` (tela `inicio`, valor de exemplo R$ 178,31), `cartaoContrato` (a linha "Contrato social" da tela `documentos`).
- Fileira: `placa1` a `placa4`, em leque (`placa3` com a pílula "Entregue").
- `moeda`, `sino`, `faisca1` e `faisca2`.

A cena troca poses e opções por `conteudo.pecas.<id>` e os canais do quadro 0 por `conteudo.estado.<id>`.

## Conferir depois de mexer

Mexer aqui ou na extensão comum muda o vídeo da peça. Antes de renderizar de novo:

1. `npx tsc --noEmit -p src/kit/tsconfig.json` (cwd `RM`): zero erro.
2. `kit.py props`, `kit.py eventos`, `kit.py fatos` e `kit.py qc` da peça: zero erro e sem invasão da legenda.
3. Stills (`kit.py stills <peça> --quadros ...`) contra as variantes de `provas/kit-comum/md5-pixels.json`.
4. Zero U+2014 e U+2013 nesta pasta.
