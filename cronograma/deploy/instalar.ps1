# Instala a Gestão de Marketing nesta máquina:
#  - atalho na pasta Inicializar (servidor sobe sozinho quando o Windows liga)
#  - atalho na área de trabalho (abre o app)
#  - tira os atalhos antigos "Cronograma de Reels*" (o nome antigo do app)
# Pra desfazer: deploy\desinstalar.ps1
$deploy = $PSScriptRoot
$wscript = Join-Path $env:WINDIR 'System32\wscript.exe'
$ws = New-Object -ComObject WScript.Shell

function Novo-Atalho($caminho, $script, $descricao) {
  $a = $ws.CreateShortcut($caminho)
  $a.TargetPath = $wscript
  $a.Arguments = '"' + (Join-Path $deploy $script) + '"'
  $a.WorkingDirectory = Split-Path $deploy
  $a.IconLocation = (Join-Path $deploy 'cronograma.ico') + ',0'
  $a.Description = $descricao
  $a.Save()
  Write-Output "Atalho criado: $caminho"
}

$inicializar = [Environment]::GetFolderPath('Startup')
$desktop = [Environment]::GetFolderPath('Desktop')

# atalhos com o nome antigo saem (servidor, túnel e área de trabalho)
foreach ($pasta in @($inicializar, $desktop)) {
  Get-ChildItem -LiteralPath $pasta -Filter 'Cronograma de Reels*.lnk' -ErrorAction SilentlyContinue |
    ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force -Confirm:$false; Write-Output "Atalho antigo removido: $($_.FullName)" }
}

Novo-Atalho (Join-Path $inicializar 'Gestão de Marketing (servidor).lnk') 'iniciar-oculto.vbs' 'Sobe o servidor da Gestão de Marketing'
Novo-Atalho (Join-Path $desktop 'Gestão de Marketing.lnk') 'abrir.vbs' 'Abre a Gestão de Marketing do Legalizaí'

& $wscript (Join-Path $deploy 'iniciar-oculto.vbs')
Write-Output 'Servidor iniciado em http://localhost:4317'

# link público: se o tunel-permanente.ps1 já rodou nesta máquina, o túnel volta junto
$configTunel = Join-Path $env:USERPROFILE '.cloudflared\config.yml'
if ((Test-Path $configTunel) -and (Select-String -Path $configTunel -Pattern 'tunel-permanente' -SimpleMatch -Quiet)) {
  Novo-Atalho (Join-Path $inicializar 'Gestão de Marketing (túnel).lnk') 'tunel-oculto.vbs' 'Sobe o túnel público da Gestão de Marketing'
  & $wscript (Join-Path $deploy 'tunel-oculto.vbs')
  Write-Output 'Túnel público ligado'
}
