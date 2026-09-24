# Remove os atalhos criados por instalar.ps1 e tunel-permanente.ps1 (os de nome antigo, "Cronograma de
# Reels", também), desliga o túnel e para o servidor.
# Não apaga dados nem o túnel da conta Cloudflare (pra apagar de vez:
#   & "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel delete cronograma-legalizai
# e o registro DNS no painel da Cloudflare).
$inicializar = [Environment]::GetFolderPath('Startup')
$desktop = [Environment]::GetFolderPath('Desktop')
$alvos = @()
foreach ($nome in @('Gestão de Marketing', 'Cronograma de Reels')) {
  $alvos += (Join-Path $inicializar "$nome (servidor).lnk")
  $alvos += (Join-Path $inicializar "$nome (túnel).lnk")
  $alvos += (Join-Path $desktop "$nome.lnk")
}
foreach ($a in $alvos) { if (Test-Path -LiteralPath $a) { Remove-Item -LiteralPath $a -Confirm:$false; Write-Output "Removido: $a" } }
# túnel permanente e túnel rápido desta porta
Get-CimInstance Win32_Process -Filter "Name='cloudflared.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -and ($_.CommandLine -like '*cronograma-legalizai*' -or $_.CommandLine.TrimEnd().EndsWith('--url http://localhost:4317')) } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -Confirm:$false; Write-Output 'Túnel desligado' }
$pid4317 = (Get-NetTCPConnection -LocalPort 4317 -State Listen -ErrorAction SilentlyContinue).OwningProcess
if ($pid4317) { Stop-Process -Id $pid4317 -Confirm:$false; Write-Output 'Servidor parado' }
