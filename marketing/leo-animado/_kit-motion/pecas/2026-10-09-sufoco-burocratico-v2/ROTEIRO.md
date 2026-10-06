# Roteiro: O sufoco burocrático real (versão 2)

Reel 9:16 de 09/10/2026 (`reel_c261009` da Gestão de Marketing; pilar Dor educativa, bloco Educação, tipo ensino). Refaz a versão 1 (`KIT/pecas/2026-10-09-sufoco-burocratico/`) a pedido do Pedro, em 06/10: "achei esses assets muito simples, não tem nenhuma animação e nada dinâmico; anime melhor e exemplifique em animação cada parte da narração, uma a uma".

- **Linguagem:** a do reel de 02/10 (3 sinais), já publicado. Uma cena 2D animada por frase, com transição entre elas, nas cores da marca.
- **Elementos novos do kit:** relógio da tarde, bilhete, janela de site, cursor, telefone, fila, entardecer, lojinha, ampulheta, celular em montagem e perfil. Ficam em `RM/src/kit/ext/precificacao/sufoco.tsx`.
- **Voz:** a mesma da versão 1. É uma tomada só do TTS (clone Pedro-Legalizai), no ritmo natural, sem aceleração nem emenda, dublada inteira pro Dylan.
- **Fatos:** nenhum número, prazo ou promessa. "A gente tá construindo o Legalizaí" é o pré-lançamento (F008). A janela de site é genérica: sem endereço, marca, brasão ou nome de órgão.

## Título

O sufoco burocrático real

## Público

ME (`fatos.publico` "ME"): a legenda do post fala da abertura de ME em BH.

## Narração

> Uma frase da legenda por linha, com a palavra-chave entre asteriscos. O fecho "Vai, Legalizaí" é o asset fixo do kit e não entra aqui.

Você separa a *tarde* inteira pra resolver uma coisa simples.
Chega no site, *trava*.
Liga pro telefone, cai a *ligação*.
Vai pessoalmente, *fila*.
No fim do dia, nada *resolvido*,
e sua empresa *parada* esperando.
É por isso que a gente tá construindo o *Legalizaí*.
Segue a gente. E clica no *link* da bio.

## Cenas

A cena sai do `provas/cena.js`, com os tempos presos às palavras da voz.

| frase | fundo | o que a imagem faz |
|---|---|---|
| Você separa a tarde inteira | papel | O relógio de parede: no "tarde", a fatia coral cobre a tarde e os ponteiros disparam, com o solzinho andando na borda. |
| pra resolver uma coisa simples | papel | Um bilhete pequeno, com uma caixinha vazia, cai ao lado do relógio. |
| Chega no site, trava | escuro | A janela do site entra, a seta clica no endereço e a barra carrega. No "trava", a página congela: falha nas faixas, rachaduras, o alerta e a seta clicando sem resposta. |
| Liga pro telefone, cai a ligação | papel | O fone toca e vibra, com as ondas e os pontinhos de chamando. No "cai", as ondas somem, o fone despenca quicando e os pontinhos viram a linha partida, com o sinal de ocupado. |
| Vai pessoalmente, fila | papel | Você, em coral, chega andando no fim da fila. No "fila", a câmera abre e mostra a fila inteira até a porta, e você suspira. |
| No fim do dia, nada resolvido | o céu | O sol desce atrás da cidade, o céu escurece e as janelas acendem. No "nada resolvido", o bilhete volta, a caixinha tenta marcar, não marca e o bilhete treme. |
| e sua empresa parada esperando | escuro | A lojinha com as engrenagens girando. No "parada", elas param, as luzes apagam e a placa de pausa balança na porta. No "esperando", a ampulheta vira e a areia escorre. |
| É por isso que a gente tá construindo o Legalizaí | coral | A íris abre no coral: o contorno do celular se desenha e, no "construindo", os blocos da tela chegam um a um. No "Legalizaí", a tela acende no app, com raios e brilhos. |
| Segue a gente. E clica no link da bio | papel | O perfil: o toque no "Seguir" vira "Seguindo", com confete. No "clica", o toque acende o link da bio. |
| fecho | papel | "Vai, Legalizaí" e a pílula LINK DA BIO. No fim, o corte de loop volta pro relógio. |
