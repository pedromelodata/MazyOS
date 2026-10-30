@echo off
rem Abre o Blender 5.2 com o servidor do MCP oficial ligado (Etapa 0 do PLANO.md).
rem O add-on vem com o inicio automatico desligado: o servidor so existe nesta janela, e fechar o Blender desliga.
rem persistent=True: o timer sobrevive a abrir um .blend passado na linha de comando (abrir_blender_mcp.cmd arquivo.blend).
rem --online-mode libera o acesso online so nesta sessao, sem mudar a preferencia salva.
"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --online-mode --python-expr "import bpy; bpy.app.timers.register(lambda: bpy.ops.blmcp.server_start() and None, first_interval=4.0, persistent=True)" %*
