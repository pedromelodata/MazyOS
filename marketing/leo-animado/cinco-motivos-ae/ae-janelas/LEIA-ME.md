# Janelas do After Effects (13/10/2026)

Pra quando um aviso do AE trava o script (ícone piscando, `-r` sem resposta), sem precisar de computer use.

- `powershell -File lista.ps1`: lista as janelas do AfterFX.exe (classe e título). Aviso preso é `#32770` com título
  vazio; o progresso do script é `#32770` "Executando script ...".
- `powershell -File foto.ps1 -Hwnd <número> -Saida <png>`: foto da janela (PrintWindow), pra ler o aviso antes de agir.
- `powershell -File ok.ps1`: manda Enter pros avisos `#32770` sem título (o botão em destaque). Na tela "Opções de
  reparo de falhas", depois de uma queda, o destaque é "Continuar" (início normal, sem modo de segurança).
- `verifica-v9.jsx`: anda por todas as propriedades do projeto aberto, lista expressão com erro ou NaN e salva.
