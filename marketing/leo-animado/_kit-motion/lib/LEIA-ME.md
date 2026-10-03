# lib: ajudante comum de escrita segura (Python)

`escrita.py` é o ajudante que todo script Python do kit usa pra gravar arquivo. Contrato: `KIT/DESENHO.md`, seção 4.12 (a lista de intocáveis está na seção 13). Dono: K01. O par em Node é o `RM/src/kit/lib/escrita.mjs`, do K02, com as mesmas regras.

## Por que existe

Várias pastas do projeto são hardlinks umas das outras (as telas do guia entre `GP` e `RM/public-guia`, os GLB, a Sora, os SVG da marca, e o V4 entre `FINAL` e `Vídeos/`). Gravar no lugar num desses caminhos muda o arquivo nos dois lugares sem ninguém perceber. Por isso nada no kit grava direto: tudo passa por aqui.

## Como importar

Sempre com `python -B` (ou `PYTHONDONTWRITEBYTECODE=1`), pra não criar `__pycache__`:

```python
import sys
sys.dont_write_bytecode = True
sys.path.insert(0, "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion/lib")
import escrita
```

De dentro do kit dá pra montar o caminho a partir do próprio arquivo:

```python
import os, sys
sys.dont_write_bytecode = True
KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # pasta _kit-motion, num script de KIT/<pasta>/
sys.path.insert(0, os.path.join(KIT, "lib"))
import escrita
```

## Funções

| função | o que faz |
|---|---|
| `livre_mb()` | espaço livre no C: em MB (`shutil.disk_usage("C:/")`) |
| `exige_disco(minimo_mb, motivo)` | levanta `DiscoInsuficiente` se o C: tiver menos que `minimo_mb` livres |
| `md5(caminho)` | md5 do arquivo, lido em blocos de 1 MB |
| `protegido(caminho)` e `protegido_motivo(caminho)` | se o caminho é intocável (seção 13) e por qual regra; sem diferença de maiúsculas, com barras normalizadas e nome curto (8.3) resolvido |
| `grava_bytes(caminho, dados, forca=False, cria_pasta=False)` | grava num temporário da mesma pasta (`.tmp-*`), dá `flush` e `os.fsync` e troca com `os.replace`; se der erro, apaga o temporário |
| `grava_texto(caminho, texto, ...)` | UTF-8 e fim de linha `\n` |
| `grava_json(caminho, obj, ...)` | `ensure_ascii=False`, `indent=2` e `\n` no fim |
| `copia(origem, destino, forca=False, cria_pasta=False)` | cópia de conteúdo pelo mesmo caminho do temporário (nunca link) |
| `liga(origem, destino, permite_final=False, cria_pasta=False)` | hardlink (`os.link`); se o destino já é o mesmo inode, não faz nada; se é outro arquivo, recusa; confere tamanho igual e st_nlink de 2 ou mais e devolve `{origem, destino, tamanho, st_ino, st_nlink}` |
| `move(origem, destino, permite_final=False, cria_pasta=False)` | `os.replace` no mesmo volume; recusa se o destino já existe |

Arquivo acima de 5 MB (gravação ou cópia) só passa com 400 MB livres mais o tamanho dele (regra do ambiente).

## Recusas

Todas levantam `EscritaRecusada`, com a mensagem em português:

- destino que existe com st_nlink maior que 1 sem `forca=True`: "recusado: <caminho> é hardlink (st_nlink N); grave num caminho novo";
- destino protegido (seção 13), sempre; o `FINAL/` só passa no `liga` e no `move` com `permite_final=True` (uso exclusivo do `kit.py entregar`);
- pasta-mãe inexistente sem `cria_pasta=True`;
- destino que é pasta ou link simbólico.

Com `forca=True`, o `os.replace` troca só a entrada daquele caminho: o outro nome do hardlink continua com o conteúdo antigo e os dois deixam de ser o mesmo arquivo. Só use com ordem explícita.

## O que é protegido

Os intocáveis da seção 13: `RM/src/{guia,abertura,motion,parts,lib,data}/`, `RM/src/Motion.tsx`, `Broll.tsx`, `Leo.tsx`, `Root.tsx`, `index.ts`, `RM/stills.mjs`, `remotion.config.ts`, `package.json`, `package-lock.json`, `tsconfig.json`, `RM/node_modules/`, `RM/bin/`, `RM/public*/` (menos `RM/public-kit/`), `PR/` inteiro (menos `RM/src/kit/` e `RM/public-kit/`), `GP/`, `AB/`, `EXT/` (menos `EXT/kit-2026-10/`), `FINAL/`, `marketing/telas-app*/`, `C:/Legalizei/`, `BASE/`, `MEM/`, `KIT/DESENHO.md`, `KIT/scripts/capturar-telas.mjs` e o registro congelado `KIT/pecas/guia-pronta-2026-10-14/_referencia.json` e `_referencia/`.

Acréscimo do K01: `C:/Users/EDIT-ADMIN/Videos/` também é protegido, porque guarda o outro hardlink do V4 (seção 0); o kit só lê ali.

O `RM/src/Root.tsx` continua protegido aqui: o único que mexe nele é o K06 (dois registros, depois de guardar o `Root.tsx.orig`), e faz isso fora deste ajudante, com a ordem do desenho.

As ferramentas Write e Edit do construtor gravam no lugar: elas também não podem ser usadas em caminho com st_nlink maior que 1 nem protegido.

## Linha de comando

```
python -B escrita.py --autoteste <pasta>     prova as regras numa pasta temporária dentro de <pasta> e apaga no fim
python -B escrita.py --protegido <caminho>   diz se o caminho é protegido e por qual regra
python -B escrita.py --livre                 espaço livre no C:
```

O autoteste prova: a troca atômica (inode novo, nenhum `.tmp-` sobrando, original intacto quando o `os.replace` falha), o formato do JSON, a recusa de hardlink, que com `forca` o original ligado não muda, a recusa de caminho protegido (só pela função, sem tocar no caminho real), o `liga` idempotente, o `move` sem sobrescrever, a pasta-mãe inexistente, a cópia de conteúdo e o `exige_disco`. Sai com código 0 quando tudo passa.
