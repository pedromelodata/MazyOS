# Cinco motivos pra ter CNPJ (After Effects, celular 3D, 09/10/2026)

Roteiro 3 de `marketing/conteudo/roteiros-ganchos-2026-10-09.md` (gancho G55 do banco), com o fecho pedido pelo Pedro.
Referências de estilo que ele mandou (YouTube Shorts de AE): fundo escuro com luz em gradiente, cards com brilho,
grade de pontos acesos, ícone que se desenha no traço, explosão de luz e legenda forte, tudo passado pras cores da
marca. Montagem rodada no AE pelo computer use (Arquivo > Scripts > Executar arquivo de script).

## Como refazer

1. **Voz:** `voz/tomada1.wav` é o clone (seed_audio, elemento e43fbc58), convertida pro Dylan (voice_change, preset
   b847bc29) em `voz/voz-dylan.wav`. "ME" foi falado como "microempresa" (a sigla some na voz do Dylan) e "app" foi
   escrito "ép". O fecho "Vai, Legalizaí" é o fixo do kit (`_kit-motion/voz/fecho/`).
2. **Celular 3D:** `precificacao-2026-10-02/remotion/src/sufoco/CelularCinco.tsx`, composição `CelularCinco`
   (1600x2400, 120 fps, 25,2 a 40,6 s do vídeo; telas `impostos_pagar` e `home` do `public-sufoco`). Render em
   sequência PNG e `python mistura-120-30.py` (da pasta do sufoco) pra `assets/celular-3d/` (462 quadros).
   - As malhas do iPhone vêm em escala de centímetro: sem `m.scale.setScalar(1)` o aparelho sai um pontinho.
3. **Mix:** `PYW -B mix.py` grava `audio/mix.wav` (voz, fecho, trilha House One liberada a partir de 51,711 s, e os
   efeitos liberados 1490, 2568 e 2867).
4. **Montagem:** `node gera.mjs` grava `monta.jsx` (só ASCII); rodar no AE com o projeto vazio aberto. Ele monta a comp
   CINCO-MOTIVOS, confere a margem de segurança (96 px dos lados, 240 do topo, 360 da base) e salva `CINCO-MOTIVOS.aep`.
5. **Render:** `bash renderiza.sh saida/cinco-motivos-mudo.mp4 100` (aerender em blocos de 100 quadros, com
   `-mem_usage 5 40`: sem isso o processo chegou a 10 GB no quadro 154 e parou) e depois `bash final.sh v1`.

## Legenda do post

Os 7 dias da ME vão aqui, porque a fala não tem espaço (peça de vendas: F021, F022). O crédito CC BY do celular é
obrigatório.

```
📲 Entra na lista de espera pelo link da bio. Não cobra nada e não te compromete.

✅ No MEI, a guia é fixa: fature 500 ou 5 mil
🧾 Numa ME que começa em 6%: de 10 mil, uns 600 de imposto e uns 9.400 no bolso
🚀 O app calcula e a abertura é com a gente, sem honorário
↩️ Na ME, você tem 7 dias pra mudar de ideia, com dinheiro de volta se desistir antes de autorizar o envio pra Junta

📲 Entrar na lista não cobra nada e não te compromete. Link da bio.

Modelo 3D: celular por polyman Studio (Sketchfab, CC BY 4.0), modificado
```

## Armadilhas desta peça

- **Legenda com entrada NaN derruba o script com um aviso do AE** ("objeto do tipo Error no qual é necessário um
  número"), numa linha que não é a do erro e fora do try. Era a frase sem o campo `s` (início) que o
  `legendaDaFrase` usa no primeiro bloco.
- **A janela de console do aerender toma a frente** e o computer use não consegue clicar no AE enquanto ele roda.
