# Extensões do kit de motion (`RM/src/kit/ext/`)

Esta pasta guarda as extensões do kit: famílias de batidas, camadas 2D e objetos 3D que não são do núcleo
(o núcleo é `RM/src/kit/nucleo/` e `RM/src/kit/batidas/`, do K02). O contrato é o `KIT/DESENHO.md`, seções 1
(item 10) e 4.10. Quem cria a pasta e mantém este arquivo é o K06.

Extensões: `ext/abertura/` (K10: família 2D da abertura e o calendário clay), `ext/precificacao/` (K14: biblioteca
2D da precificação, transições e cortes), `ext/comum/` (o que serve pra qualquer peça: o palco de argila, os objetos de
argila do carrossel de 05/10 soltos na cena e 23 batidas; veio da peça de 05/10 em 03/10) e
`ext/tradicional-vs-legalizai/` (só a configuração da peça de 05/10: o tipo de palco dela, `palco-tvl`).

## Batida genérica ou de uma peça

- Batida, objeto ou camada que serve pra qualquer peça vai pra `ext/comum/`, com os números padrão do vídeo de onde
  veio (a peça manda os ids e os tempos dela).
- O que só faz sentido numa peça fica na extensão da peça. A extensão da peça pode só configurar o que é do kit: a de
  05/10 registra o tipo de palco dela (`registraPalco` de `ext/comum/palco/modelo.ts`, com as peças padrão) e liga
  esse tipo à fábrica do palco de argila no `render.tsx` dela. A cena da peça continua igual.
- Antes de levar código de uma peça pro comum, prove que a peça sai igual: estado da timeline quadro a quadro e
  eventos de som iguais, as saídas do `kit.py props`, `eventos` e `qc` com o mesmo md5 e os stills contra as variantes
  de antes (exemplo em `KIT/pecas/2026-10-05-tradicional-vs-legalizai/provas/kit-comum/`).

## Estrutura de uma extensão

```
RM/src/kit/ext/<nome>/
  batidas.ts    puro (sem React, sem Remotion, sem DOM): batidas e metadados das camadas
  render.tsx    camadas 2D e fábricas de objeto 3D (React e three)
  midia.json    opcional: mídia que os componentes buscam em caminho fixo do public
```

`batidas.ts` exporta:

```ts
export const batidas: Record<string, Batida<any>> = { ... };        // tipo Batida de ../../nucleo/tipos
export const camadas: Record<string, { descricao: string; params: Record<string, unknown>; canais: string[] }> = { ... };
```

`render.tsx` exporta:

```ts
import type { RenderExtensao } from "../../render/tipos-render";
export const render: RenderExtensao = {
  objetos: { "<tipo>": fabrica },   // FabricaObjeto: arquivos?(objeto, props) e cria(ctx) => ObjetoMontado | Promise
  camadas: { "<tipo>": Componente }, // React.FC<{ id: string; st: Estado; props: PropsKit; t: number }>
};
```

O estado das camadas e dos objetos de extensão mora em `st.canais[id]` (as batidas da extensão animam esses
números; o componente só lê). O tipo `FabricaObjeto` e o resto do contrato de render estão em
`RM/src/kit/render/tipos-render.ts` (K06). Mídia fixa da extensão vai em `RM/public-kit/ext/<nome>/`. Mídia que
os componentes originais buscam em caminho fixo (`clay/...`, `icons/...`, `splash.png`) é declarada no
`midia.json` (`{versao: 1, links: [{origem, destino, padrao?}]}`) e só entra no public-kit por
`kit.py ext-liga <nome>` (e sai com `kit.py ext-desliga <nome>`).

## Como o bundle acha as extensões

O `RM/src/kit/render/ext.ts` descobre `ext/*/batidas.ts` e `ext/*/render.tsx` por `require.context` (o rspack e o
webpack do Remotion juntam tudo no bundle). Cada extensão carrega dentro de `try/catch`: a que der erro de
execução fica desligada, com `console.warn("EXT_ERRO", nome, mensagem)` no log do navegador, e só a cena que
pedir batida, camada ou objeto dela falha. Nome repetido não troca o do núcleo nem o de outra extensão (fica o
primeiro, com `console.warn("EXT_AVISO", ...)`). Com esta pasta sem nenhuma extensão, o kit funciona igual.

Em Node (os scripts do `RM/src/kit/cli/`, com o esbuild) não existe `require.context`: lá as extensões são
achadas por busca de arquivos.

## Regras

- A extensão não edita nada fora da própria pasta; só importa (de `src/abertura`, `src/motion`, `src/parts`,
  do núcleo e do render do kit).
- Nada de efeito colateral no import além de registrar nomes próprios: não trocar
  `globalThis.__img2threeTexLoad`, não redefinir ease existente (curva nova ganha prefixo `kit`, pelo
  `criaEaseKit` do núcleo), não mexer em `gsap.defaults`, não registrar plugin do GSAP além do `CustomEase`. O
  registro de tipos de palco da extensão comum (`registraPalco`) conta como nome próprio: mora em
  `globalThis.__kitComumPalcos` (em Node cada extensão é empacotada sozinha, e as duas pontas precisam ver os mesmos
  tipos) e nunca troca um tipo que já existe.
- Erro de sintaxe ou de import numa extensão quebra o bundle inteiro (todas as composições, inclusive as
  antigas). Antes de entregar, prove o empacotamento em memória com o esbuild (como os testes do K02) e rode os
  stills de `GuiaPronta` e `AberturaMes` contra a linha de base do K06 (`KIT/provas/render/linha-de-base/`).
- Texto em português do Brasil, sem travessão, e "Legalizaí" com acento em texto visível.
