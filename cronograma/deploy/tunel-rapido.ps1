# Link público TEMPORÁRIO da Gestão de Marketing (túnel rápido da Cloudflare: sem conta e sem domínio).
# O endereço *.trycloudflare.com muda toda vez que o túnel sobe e some quando o PC desliga.
# Pra um link fixo, use deploy\tunel-permanente.ps1.
# Uso: powershell -ExecutionPolicy Bypass -File deploy\tunel-rapido.ps1
# Todo acesso pelo link pede login. Pra desligar: deploy\desinstalar.ps1 (ou encerre o cloudflared no Gerenciador de Tarefas).
param([int]$Porta = 0)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

$app = Split-Path $PSScriptRoot
$dados = Join-Path $app 'data'
$log = Join-Path $dados 'tunel.log'
$semConfig = Join-Path $dados 'tunel-rapido.yml'

if ($Porta -le 0) {
  $Porta = 4317
  $envArq = Join-Path $app '.env'
  if (Test-Path $envArq) {
    foreach ($l in Get-Content $envArq -Encoding UTF8) { if ($l -match '^\s*PORT\s*=\s*(\d+)\s*$') { $Porta = [int]$Matches[1] } }
  }
}

$cf = Join-Path ${env:ProgramFiles(x86)} 'cloudflared\cloudflared.exe'
if (-not (Test-Path $cf)) {
  $c = Get-Command cloudflared -ErrorAction SilentlyContinue
  if (-not $c) { Write-Output 'Não achei o cloudflared. Instale com: winget install --id Cloudflare.cloudflared'; exit 1 }
  $cf = $c.Source
}

# só abre o link se o servidor no ar já é a versão com login (a antiga ficaria aberta pra internet)
$estado = $null
try {
  $estado = (Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 "http://127.0.0.1:$Porta/api/auth/estado").Content | ConvertFrom-Json
} catch {}
if (-not $estado -or $null -eq $estado.logado) {
  Write-Output "A Gestão de Marketing em http://localhost:$Porta não respondeu com o login ativo. Nada foi aberto pra internet."
  Write-Output 'Se o servidor está desligado, abra pelo atalho Gestão de Marketing. Se está ligado, é a versão antiga: rode deploy\desinstalar.ps1 e deploy\instalar.ps1 pra reiniciar, e rode este script de novo.'
  exit 1
}

# túnel rápido anterior desta porta sai (cada um teria um endereço diferente)
$fim = "--url http://localhost:$Porta"
Get-CimInstance Win32_Process -Filter "Name='cloudflared.exe'" |
  Where-Object { $_.CommandLine -and $_.CommandLine.TrimEnd().EndsWith($fim) } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -Confirm:$false; Write-Output "Túnel rápido anterior encerrado (processo $($_.ProcessId))." }

New-Item -ItemType Directory -Force $dados | Out-Null
if (Test-Path $log) { Remove-Item $log -Force -Confirm:$false }
# config própria e vazia: o config.yml do túnel permanente (se existir) não atrapalha o rápido
[IO.File]::WriteAllText($semConfig, "# tunel rapido da Gestao de Marketing: sem configuracao`r`n", (New-Object Text.UTF8Encoding $false))

$argumentos = @('tunnel', '--no-autoupdate', '--config', "`"$semConfig`"", '--logfile', "`"$log`"", '--url', "http://localhost:$Porta")
$proc = Start-Process -FilePath $cf -ArgumentList $argumentos -WindowStyle Hidden -PassThru
Write-Output 'Subindo o túnel rápido da Cloudflare...'

$url = $null
for ($i = 0; $i -lt 90 -and -not $url; $i++) {
  Start-Sleep -Milliseconds 500
  if ($proc.HasExited) { break }
  if (Test-Path $log) {
    $achado = Select-String -Path $log -Pattern 'https://(?!api\.)[a-z0-9-]+\.trycloudflare\.com' | Select-Object -Last 1
    if ($achado) { $url = $achado.Matches[0].Value }
  }
}

if (-not $url) {
  Write-Output 'Não consegui o endereço do túnel. Últimas linhas do log (data\tunel.log):'
  if (Test-Path $log) { Get-Content $log -Tail 15 | ForEach-Object { Write-Output "  $_" } }
  if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -Confirm:$false }
  exit 1
}

# o endereço novo leva alguns segundos pra existir na internet
$noAr = $false
for ($i = 0; $i -lt 20 -and -not $noAr; $i++) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 10 "$url/api/auth/estado"
    $noAr = $r.StatusCode -eq 200
  } catch { Start-Sleep -Seconds 3 }
}

try { Set-Clipboard -Value $url } catch {}
Write-Output ''
Write-Output "Link público temporário: $url"
if (-not $noAr) { Write-Output '(Ainda propagando: se não abrir de primeira, espere 1 minuto e recarregue.)' }
Write-Output 'O link já está copiado. Todo acesso pede usuário e senha.'
if ($estado.semUsuarios) { Write-Output 'Ainda não existe nenhuma conta: gere o link de acesso NESTE computador com npm run usuario convite' }
Write-Output 'Os links de acesso e de senha nova (Usuários) saem com o PUBLIC_URL do .env, ou com localhost se ele estiver vazio.'
Write-Output "Enquanto usar este link temporário, troque http://localhost:$Porta no começo do link por $url antes de mandar."
Write-Output 'Ele muda quando o túnel reinicia ou o PC desliga. Pra um link fixo: deploy\tunel-permanente.ps1 (mkt.legalizai.com.br)'
