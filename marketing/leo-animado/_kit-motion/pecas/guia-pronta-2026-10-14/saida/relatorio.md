# Conferência: guia-pronta-2026-10-14

Gerado pelo KIT/scripts/confere.py em 2026-10-02T22:25:31. Final: `C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion/pecas/guia-pronta-2026-10-14/saida/guia-pronta-2026-10-14.mp4`.

| conferência | resultado | medido | limite |
|---|---|---|---|
| formato | ok | {"tamanho": "1080x1920", "fps": 30.0, "quadros": 540, "pix_fmt": "yuv420p", "color_space": "bt709", "color_range": "tv", "audio": "aac 48000 Hz 2 canais"} | 1080x1920, 30 fps, 540 quadros, yuv420p, bt709 tv, AAC 48 kHz estéreo |
| som | ok | I -14.0 LUFS, pico real -2.7 dBTP, LRA 1.2 LU | I -14,0 +- 0,2 LUFS; pico real <= -1,5 dBTP |
| cor | ok | 6 still(s); pior média 1.6364 no quadro 0 (matriz bt709-tv) | média < 2 |
| fala | ok | 50 de 50 palavras (100%: 48 iguais e 2 no lugar certo com outra grafia: aparece/parece, o/um), mediana do desvio 0.000 s, fecho ok ('vai legalizar i') | >= 95%, mediana <= 0,08 s, fecho reconhecido |
| legenda | ok | 0 quadro(s) com invasão (margens -6.0 px cheia e -26.0 px na transição; 27 em alerta) | zero quadro com invasão |
| loop | ok | estado t=0 contra t=duração: 0.00e+00; camada ambiente: 7.00e-03 (sem o modo periódico: não emenda, só registro); imagem q0 contra q539: média 2.169 | estado <= 1e-5; ambiente <= 1e-9 com o modo periódico |
| texto | ok | 0 travessão, 0 'APP EM CONSTRUÇÃO' nas props; fatos: 0 erro(s), 4 aviso(s) | zero, zero e zero erro de fatos |
| créditos | ok | creditos.txt: "Modelos 3D: celular por polyman Studio e relógio por alboxer2000_ (Sketchfab, CC BY 4.0), modificados" | o creditoLegenda das props, sem marca |
| folha | ok | folha.jpg (36 quadros, 362011 bytes) | quadros a cada 0,5 s com o tempo |

Resultado: tudo passou.

## Fatos (trava de conteúdo)

0 erro(s), 4 aviso(s), 2 número(s) conferido(s).
- aviso: regra 5 (avisos de revisão): fatos.publico vazio: declare ME, MEI ou ambos (a regra 6 depende dele) (cena (fatos.publico))
- aviso: regra 5 (avisos de revisão): 'site do governo': conferir o sentido (o guia promete 'sem entrar no site do governo'; nunca mandar a pessoa pro site) (roteiro (Narração, linha 30))
- aviso: regra 5 (avisos de revisão): 'site do governo': conferir o sentido (o guia promete 'sem entrar no site do governo'; nunca mandar a pessoa pro site) (narração, frase 2 (voz e legenda))
- aviso: regra 1 (valor em R$): R$ 178,31 é valor fictício declarado em fatos.exemplos (origem: dado fictício da empresa de exemplo do app; o Pedro liberou nítido em 01/10; não é guia de MEI): conferir que aparece como exemplo (tela inicio, contador (região valor))

## Avisos das props (montaProps)

- trilha mixkit-01-talent-in-the-air está "aceito-com-risco": vale pela decisão registrada ("Pedro, 02/10/2026: trilha da V2 mesmo relançada por terceiro; só nesta peça")
- fatos.publico vazio: declare ME, MEI ou ambos (a trava de fatos usa isso)
- efeitos sem verificação: pixabay-405445, pixabay-197886, pixabay-186577, pixabay-570438, pixabay-316482 (licença não conferida na fonte; conferir antes de postar)
- créditos CC BY (vão na legenda do post, nunca o título com marca): Modelos 3D: celular por polyman Studio e relógio por alboxer2000_ (Sketchfab, CC BY 4.0), modificados
- LINK DA BIO em #F2643C: coral-500 em fill de botão sobre fundo claro, contra a regra da marca; aceito só na cena do guia
- a peça fala em tela/prévia real: as capturas são do protótipo Next.js, repo ab68dbc, não do app Flutter; chamar de real depende do Pedro

## Crédito pra legenda do post

Modelos 3D: celular por polyman Studio e relógio por alboxer2000_ (Sketchfab, CC BY 4.0), modificados

Folha de contato: `C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion/pecas/guia-pronta-2026-10-14/saida/folha.jpg`.
