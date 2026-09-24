# Link público PERMANENTE da Gestão de Marketing: túnel nomeado da Cloudflare no domínio de vocês.
#
# Antes, uma vez só: rode
#   & "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel login
# e escolha no navegador o domínio (ele precisa estar na conta Cloudflare). Isso cria
# %USERPROFILE%\.cloudflared\cert.pem.
#
# Uso: powershell -ExecutionPolicy Bypass -File deploy\tunel-permanente.ps1
# (endereço padrão mkt.legalizai.com.br; outro: -Hostname outro.legalizai.com.br)
#
# O que ele faz (pode rodar de novo sem medo): cria ou reaproveita o túnel "cronograma-legalizai", aponta o
# DNS do endereço pro túnel, grava %USERPROFILE%\.cloudflared\config.yml, põe PUBLIC_HOSTS e PUBLIC_URL no
# .env (o resto do .env fica), liga o túnel sozinho quando o Windows inicia (atalho na pasta Inicializar),
# sobe o túnel e reinicia o servidor pra ele ler o .env novo (os links de acesso e de senha nova passam a sair
# com https://<endereço>). Não precisa de administrador.
# Pra desligar: deploy\desinstalar.ps1
param(
  [string]$Hostname = 'mkt.legalizai.com.br',
  [int]$Porta = 0
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

$NOME = 'cronograma-legalizai'
$deploy = $PSScriptRoot
$app = Split-Path $deploy
$dados = Join-Path $app 'data'
$envArq = Join-Path $app '.env'
$pastaCf = Join-Path $env:USERPROFILE '.cloudflared'
$cert = Join-Path $pastaCf 'cert.pem'
$config = Join-Path $pastaCf 'config.yml'
$logTunel = Join-Path $dados 'tunel-permanente.log'
$wscript = Join-Path $env:WINDIR 'System32\wscript.exe'
$vbs = Join-Path $deploy 'tunel-oculto.vbs'
$atalho = Join-Path ([Environment]::GetFolderPath('Startup')) 'Gestão de Marketing (túnel).lnk'
$atalhoAntigo = Join-Path ([Environment]::GetFolderPath('Startup')) 'Cronograma de Reels (túnel).lnk'

function Parar($msg) { Write-Output ''; Write-Output $msg; exit 1 }

$Hostname = ($Hostname.Trim().ToLower() -replace '^https?://', '') -replace '[/?#].*$', ''
if ($Hostname -notmatch '^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$') { Parar "Endereço inválido: '$Hostname'. Passe só o host, ex.: -Hostname mkt.legalizai.com.br" }
if ($Hostname -like '*.trycloudflare.com') { Parar 'Esse é um endereço de túnel rápido. Pra ele, use deploy\tunel-rapido.ps1.' }

if ($Porta -le 0) {
  $Porta = 4317
  if (Test-Path $envArq) {
    foreach ($l in Get-Content $envArq -Encoding UTF8) { if ($l -match '^\s*PORT\s*=\s*(\d+)\s*$') { $Porta = [int]$Matches[1] } }
  }
}

$cf = Join-Path ${env:ProgramFiles(x86)} 'cloudflared\cloudflared.exe'
if (-not (Test-Path $cf)) {
  $c = Get-Command cloudflared -ErrorAction SilentlyContinue
  if (-not $c) { Parar 'Não achei o cloudflared. Instale com: winget install --id Cloudflare.cloudflared' }
  $cf = $c.Source
}

if (-not (Test-Path $cert)) {
  Parar @"
Falta entrar na Cloudflare (o arquivo $cert não existe).
  1. Rode: & "$cf" tunnel login
  2. No navegador que abrir, entre na conta Cloudflare e escolha o domínio de $Hostname
  3. Rode este script de novo.
"@
}

# roda o cloudflared e devolve código, saída e erro (o cloudflared escreve o log no stderr)
function Cf {
  $out = [IO.Path]::GetTempFileName()
  $err = [IO.Path]::GetTempFileName()
  $lista = $args | ForEach-Object { if ("$_" -match '\s') { "`"$_`"" } else { "$_" } }
  try {
    $p = Start-Process -FilePath $cf -ArgumentList $lista -NoNewWindow -Wait -PassThru -RedirectStandardOutput $out -RedirectStandardError $err
    [pscustomobject]@{ Codigo = $p.ExitCode; Saida = [IO.File]::ReadAllText($out); Erro = [IO.File]::ReadAllText($err) }
  } finally {
    Remove-Item $out, $err -Force -ErrorAction SilentlyContinue
  }
}

function Achar-Tunel {
  $r = Cf tunnel list --output json --name $NOME
  if ($r.Codigo -ne 0) { Parar "O cloudflared não conseguiu listar os túneis:`n$($r.Erro)" }
  $texto = $r.Saida.Trim()
  if (-not $texto -or -not $texto.StartsWith('[')) { return $null }
  $tuneis = $texto | ConvertFrom-Json
  return $tuneis | Where-Object { $_.name -eq $NOME } | Select-Object -First 1
}

# 1. túnel
Write-Output "Túnel $NOME..."
$tunel = Achar-Tunel
if (-not $tunel) {
  $r = Cf tunnel create $NOME
  if ($r.Codigo -ne 0) { Parar "Não consegui criar o túnel:`n$($r.Erro)" }
  $tunel = Achar-Tunel
  if (-not $tunel) { Parar 'O túnel foi criado, mas não apareceu na lista. Rode o script de novo.' }
  Write-Output "  criado ($($tunel.id))"
} else {
  Write-Output "  já existia ($($tunel.id)), reaproveitando"
}
$id = $tunel.id
$cred = Join-Path $pastaCf "$id.json"
if (-not (Test-Path $cred)) {
  # túnel criado em outra máquina (ou credencial apagada): baixa a credencial de novo
  $r = Cf tunnel token --cred-file $cred $NOME
  if ($r.Codigo -ne 0 -or -not (Test-Path $cred)) { Parar "O túnel existe, mas a credencial dele ($cred) não está nesta máquina e não consegui baixar:`n$($r.Erro)" }
}

# 2. DNS
Write-Output "DNS de $Hostname..."
$r = Cf tunnel route dns $NOME $Hostname
if ($r.Codigo -ne 0) {
  Parar "Não consegui apontar $Hostname pro túnel:`n$($r.Erro)`nSe já existe um registro DNS com esse nome no painel da Cloudflare (A, AAAA ou CNAME), apague ou escolha outro subdomínio e rode de novo."
}
$fqdn = [regex]::Match("$($r.Saida)`n$($r.Erro)", 'CNAME\s+([a-z0-9.-]+)', 'IgnoreCase').Groups[1].Value.TrimEnd('.').ToLower()
if ($fqdn -and $fqdn -ne $Hostname) {
  Parar "A Cloudflare criou o DNS como $fqdn, não ${Hostname}: o login do cloudflared está em outro domínio. Apague esse registro no painel, rode 'cloudflared tunnel login' escolhendo o domínio certo e rode este script de novo."
}
Write-Output '  ok'

# 3. config.yml (a versão anterior, se diferente, fica com .bak)
$yml = @"
# gerado por cronograma\deploy\tunel-permanente.ps1
tunnel: $id
credentials-file: '$cred'
ingress:
  - hostname: $Hostname
    service: http://localhost:$Porta
  - service: http_status:404
"@
New-Item -ItemType Directory -Force $pastaCf | Out-Null
if ((Test-Path $config) -and ((Get-Content $config -Raw) -ne $yml)) {
  Copy-Item $config "$config.$(Get-Date -Format 'yyyyMMdd-HHmmss').bak"
}
[IO.File]::WriteAllText($config, $yml, (New-Object Text.UTF8Encoding $false))
$r = Cf tunnel --config $config ingress validate
if ($r.Codigo -ne 0) { Parar "O config.yml gerado não passou na validação do cloudflared:`n$($r.Erro)" }
Write-Output "Configuração: $config"

# 4. .env: PUBLIC_HOSTS e PUBLIC_URL (as outras chaves ficam como estão)
$linhas = @()
if (Test-Path $envArq) { $linhas = @(Get-Content $envArq -Encoding UTF8) }
$hosts = @()
foreach ($l in $linhas) {
  if ($l -match '^\s*PUBLIC_HOSTS\s*=(.*)$') {
    $hosts += @($Matches[1].Trim().Trim('"').Trim("'") -split ',' | ForEach-Object { $_.Trim().ToLower() } | Where-Object { $_ })
  }
}
if ($hosts -notcontains $Hostname) { $hosts += $Hostname }
$novos = @{ PUBLIC_HOSTS = ($hosts -join ','); PUBLIC_URL = "https://$Hostname" }
$saida = New-Object System.Collections.Generic.List[string]
$feitos = @{}
foreach ($l in $linhas) {
  if ($l -match '^\s*(PUBLIC_HOSTS|PUBLIC_URL)\s*=') {
    $k = $Matches[1]
    if (-not $feitos[$k]) { $saida.Add("$k=$($novos[$k])"); $feitos[$k] = $true }
    continue
  }
  $saida.Add($l)
}
foreach ($k in @('PUBLIC_HOSTS', 'PUBLIC_URL')) { if (-not $feitos[$k]) { $saida.Add("$k=$($novos[$k])") } }
[IO.File]::WriteAllText($envArq, (($saida -join "`r`n") + "`r`n"), (New-Object Text.UTF8Encoding $false))
Write-Output "Arquivo .env: PUBLIC_HOSTS=$($novos.PUBLIC_HOSTS) e PUBLIC_URL=$($novos.PUBLIC_URL)"

# 5. reinicia o servidor pra ele ler PUBLIC_HOSTS e PUBLIC_URL (antes do túnel: nada sem login vai pra internet)
$pids = @(Get-NetTCPConnection -LocalPort $Porta -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)
foreach ($p in $pids) { Stop-Process -Id $p -Force -Confirm:$false }
for ($i = 0; $i -lt 20 -and (Get-NetTCPConnection -LocalPort $Porta -State Listen -ErrorAction SilentlyContinue); $i++) { Start-Sleep -Milliseconds 250 }
& $wscript (Join-Path $deploy 'iniciar-oculto.vbs')
$estado = $null
for ($i = 0; $i -lt 40 -and -not $estado; $i++) {
  Start-Sleep -Milliseconds 500
  try { $estado = (Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 "http://127.0.0.1:$Porta/api/auth/estado").Content | ConvertFrom-Json } catch {}
}
if (-not $estado) { Parar "O servidor não voltou em 20 segundos. Veja $(Join-Path $dados 'servidor.log'). O túnel não foi ligado." }
if ($null -eq $estado.logado) { Parar 'O servidor que subiu não tem o login ativo. O túnel não foi ligado.' }
Write-Output 'Servidor reiniciado com o .env novo.'

# 6. túnel liga sozinho com o Windows (sem janela)
$ws = New-Object -ComObject WScript.Shell
$a = $ws.CreateShortcut($atalho)
$a.TargetPath = $wscript
$a.Arguments = '"' + $vbs + '"'
$a.WorkingDirectory = $app
$a.IconLocation = (Join-Path $deploy 'cronograma.ico') + ',0'
$a.Description = 'Sobe o túnel público da Gestão de Marketing'
$a.Save()
Write-Output "Atalho criado: $atalho"
if (Test-Path -LiteralPath $atalhoAntigo) { Remove-Item -LiteralPath $atalhoAntigo -Force -Confirm:$false; Write-Output "Atalho antigo removido: $atalhoAntigo" }

# 7. sobe o túnel (o de antes, se estava rodando com outra configuração, reinicia)
Get-CimInstance Win32_Process -Filter "Name='cloudflared.exe'" |
  Where-Object { $_.CommandLine -and $_.CommandLine -like "*$NOME*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -Confirm:$false }
Start-Sleep -Milliseconds 500
$inicioLog = if (Test-Path $logTunel) { (Get-Item $logTunel).Length } else { 0 }
& $wscript $vbs
$conectado = $false
for ($i = 0; $i -lt 60 -and -not $conectado; $i++) {
  Start-Sleep -Milliseconds 500
  if (Test-Path $logTunel) {
    $fs = [IO.File]::Open($logTunel, 'Open', 'Read', 'ReadWrite')
    try {
      $null = $fs.Seek([Math]::Min($inicioLog, $fs.Length), 'Begin')
      $novo = (New-Object IO.StreamReader($fs)).ReadToEnd()
    } finally { $fs.Dispose() }
    $conectado = $novo -match 'Registered tunnel connection'
  }
}
if ($conectado) { Write-Output 'Túnel conectado à Cloudflare.' } else { Write-Output "Aviso: o túnel ainda não confirmou a conexão. Veja $logTunel se o link não abrir." }

# 8. confere o link de fora
$publico = "https://$Hostname"
$noAr = $false
for ($i = 0; $i -lt 20 -and -not $noAr; $i++) {
  try { $noAr = (Invoke-WebRequest -UseBasicParsing -TimeoutSec 10 "$publico/api/auth/estado").StatusCode -eq 200 } catch { Start-Sleep -Seconds 3 }
}

Write-Output ''
Write-Output "Link público permanente: $publico"
if (-not $noAr) { Write-Output '(O DNS ainda está propagando: se não abrir agora, tente de novo em alguns minutos.)' }
Write-Output 'Todo acesso pede usuário e senha. O túnel e o servidor sobem sozinhos quando o Windows liga.'
Write-Output "Os links de acesso e de senha nova (Usuários) agora saem com $publico."
Write-Output ''
Write-Output 'IMPORTANTE, uma vez só: no painel da Cloudflare, abra o domínio, vá em SSL/TLS > Edge Certificates e ligue'
Write-Output "'Always Use HTTPS'. A Gestão de Marketing já manda quem abre por http:// pro https://, mas com essa opção a Cloudflare"
Write-Output 'faz isso antes, e nem o primeiro pedido anda sem criptografia.'
if ($estado.semUsuarios) {
  Write-Output 'Ainda não existe nenhuma conta: gere o link de acesso NESTE computador com npm run usuario convite'
}
Write-Output "Se usar o 'Entrar com Facebook' do Instagram, cadastre no app da Meta a URL $publico/api/instagram/callback"
try { Set-Clipboard -Value $publico } catch {}
