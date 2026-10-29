# Cria a tarefa agendada que religa a fila de render do Léo 3D (PLANO.md, Etapa 0, "PC de render dia e noite").
# Quem roda é o Pedro (o Claude não cria tarefa que fica no PC). No PowerShell:
#   powershell -ExecutionPolicy Bypass -File "C:\MKT-INSTA\Content Legalizai\marketing\personagens\leo-3d\scripts\criar_tarefa_fila.ps1"
# A tarefa chama "render_lote.py rodar" no login e a cada 10 minutos. Sem trabalho na fila, ou com a fila já
# rodando, ela sai na hora. Pausar a fila: criar o arquivo renders\fila\PAUSA. Tirar a tarefa:
#   Unregister-ScheduledTask -TaskPath "\Legalizai\" -TaskName "LeoRenderFila" -Confirm:$false

$py = "C:\Users\EDIT-ADMIN\AppData\Local\Programs\Python\Python311\pythonw.exe"
$sc = Join-Path $PSScriptRoot "render_lote.py"

$acao = New-ScheduledTaskAction -Execute $py -Argument "-I `"$sc`" rodar" -WorkingDirectory $PSScriptRoot
$noLogin = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$cada10 = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 10)
# Sem limite de tempo (o padrão do Windows mata a tarefa em 3 dias) e sem duas filas ao mesmo tempo
$cfg = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName "LeoRenderFila" -TaskPath "\Legalizai\" -Action $acao -Trigger $noLogin, $cada10 `
    -Settings $cfg -Description "Fila de render do Leo 3D: retoma depois de reinicio ou queda (PLANO.md)." -Force | Out-Null

Get-ScheduledTask -TaskPath "\Legalizai\" -TaskName "LeoRenderFila" | Select-Object TaskPath, TaskName, State
