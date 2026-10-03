# Provas: a peça de 05/10 renderiza igual com o código no kit (03/10/2026)

Em 03/10/2026 o código da extensão desta peça (`RM/src/kit/ext/tradicional-vs-legalizai/`: o palco, as peças de argila, os cartões, a luz, as vitrines, as 22 batidas e a camada `pilula-comenta`) foi pra extensão comum do kit (`RM/src/kit/ext/comum/`). A extensão da peça ficou só com o tipo de palco `palco-tvl` e as peças dela. A cena (`cenas.json`), as props, os eventos e o final entregue não mudaram. Esta pasta prova que o render sai igual.

| arquivo | o que prova |
|---|---|
| `timeline-kit-comum.json` | o estado inteiro da timeline (câmera, objetos, telas, luz, assinatura e os 22 canais do palco), quadro a quadro, nos 826 quadros e em t = duração (827 comparações, 295.239 números): **0 diferença** entre a extensão original e o kit novo. Os 65 eventos de som: **iguais** (instante, som, ganho, argumentos, filtro e semente) |
| `timeline-palco-generico.json` | a mesma comparação com a cena trocada pro palco genérico (`proc-palco-argila`, sem peça padrão, com as 20 peças da peça declaradas na cena): **0 diferença** e os mesmos 65 eventos |
| `saidas-node.json` | `props.json`, `eventos.json` e `qc/quadros.json` refeitos pelo kit numa cópia da pasta, antes e depois da mudança: o **mesmo md5** dos arquivos da peça |
| `md5-pixels.json` | md5 dos pixels (RGBA) dos stills de 26 quadros (0 a 825, um por batida): 2 rodadas com o código original (a da correção, 00:40, e a desta frente, 02:28) e 11 com o kit comum (4 de 02:45 a 02:49 e 7 com o código final, de 03:10 a 03:16, várias só nos quadros que ainda não tinham batido), mais 10 quadros da cena com o palco genérico. **Nos 26 quadros, pelo menos uma rodada do kit comum sai igual, pixel a pixel, a uma rodada do código original.** A variação que sobra entre rodadas (1 a 6 níveis em uns 4.000 px, e às vezes 1 pixel de borda mais longe, como os 19 do quadro 420) fica no chão embaixo do aparelho e no corpo dele (y 950 a 1500, x 520 a 1030). O código original também tem, e a mesma rodada troca de variante de um quadro pro outro: é do render, não da mudança |
| `antes-depois.jpg` | folha de 12 quadros: antes, depois e a diferença multiplicada por 40 |
| `palco-generico.jpg` | a mesma folha com o palco genérico |
| `linha-de-base-4-extensoes.json` | stills da GuiaPronta (0, 245, 478) e da AberturaMes (0, 60, 150, 300, 450) com as 4 extensões no bundle (abertura, comum, precificacao e tradicional-vs-legalizai): **iguais, pixel a pixel,** à linha de base do K06 (`KIT/provas/render/linha-de-base/depois.json`, md5 dos pixels RGB) |
| `ext-original/` | o código da extensão da peça antes da mudança (o da correção de 03/10, com que o final saiu), com o md5 de cada arquivo em `md5.json` |
| `scripts/` | os scripts das provas: `eq.mjs` (timeline e eventos, com o `resolve.mjs`, que empacota a cópia de `ext-original` como se estivesse em `RM/src/kit/ext/`), `pixmd5.py` (md5 e diferença de pixels), `folha_par.py` (as folhas) e `caixas_argila.mjs` (a caixa de cada objeto de argila, pro catálogo) |

## Como repetir

1. Copie `cenas.json`, `voz/narracao.json` e `telas/regioes.json` da peça pra uma pasta de rascunho com o mesmo nome (`.../2026-10-05-tradicional-vs-legalizai/`).
2. `node RM/src/kit/cli/props.mjs <pasta>`, `eventos.mjs <pasta>` e `quadros.mjs <pasta>` (cwd `RM`): os três arquivos com o md5 da peça.
3. `node scripts/eq.mjs <pasta>/props.json <pasta-com-tradicional-vs-legalizai-original> x --publicado`: a cópia de `ext-original/` contra o que está em `RM/src/kit/ext/`. Saída 0 = igual.
4. `kit.py stills <pasta> --quadros ...` e `python -B scripts/pixmd5.py` contra `md5-pixels.json` (rode 2 ou 3 vezes os quadros que caírem numa variante nova).

Sem render nem final novo: o final entregue (`saida/TRADICIONAL-VS-LEGALIZAI-motion.mp4`) é o de 03/10 00:49.
