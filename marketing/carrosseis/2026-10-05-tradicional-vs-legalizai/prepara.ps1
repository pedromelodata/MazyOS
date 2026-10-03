# Preparo do render do carrossel de 05/10 (Contabilidade tradicional vs Legalizaí).
#   powershell -ExecutionPolicy Bypass -File prepara.ps1
# 1. Monta as 5 telas do app pelas receitas (monta.py) e confere os md5 da ESPEC (seção 3).
# 2. Cria o public próprio do render (remotion/public-carrossel) só com hardlinks, conferindo o tamanho.
# Não apaga nada: se um destino já existe com outro tamanho, para e avisa.
$ErrorActionPreference = 'Stop'
$PY = 'C:/Users/EDIT-ADMIN/.claude/skills/corte-viral/.venv/Scripts/python.exe'
$C = 'C:/MKT-INSTA/Content Legalizai/marketing/carrosseis/2026-10-05-tradicional-vs-legalizai'
$R = 'C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/precificacao-2026-10-02/remotion'

$livre = [math]::Round((Get-PSDrive C).Free / 1MB)
Write-Output "disco: $livre MB livres no C:"

# 1) telas do app
& $PY -B 'C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/_kit-motion/telas/monta.py' "$C/telas/receitas" --saida "$C/telas" --qa
if ($LASTEXITCODE -ne 0) { throw "monta.py saiu com $LASTEXITCODE" }
$esperado = [ordered]@{
  'tela-splash.png'       = '28d46a9939f3c9d7837cadf36d225e05'
  'tela-inicio-pagar.png' = 'eb8596dee4c5487d9b2c5111937d1a6a'
  'tela-home-dia1.png'    = '69978f352c73569e74eeb143e200a888'
  'tela-declaracoes.png'  = 'b377dcbeb8e5fddc355933d4a7aeb70f'
  'tela-documentos.png'   = '528d157da59fd55831f4ac92270b87c6'
}
foreach ($k in $esperado.Keys) {
  $h = (Get-FileHash -Algorithm MD5 "$C/telas/$k").Hash.ToLower()
  if ($h -ne $esperado[$k]) { throw "md5 de $k = $h (a ESPEC pede $($esperado[$k]))" }
  Write-Output "md5 ok  $k"
}

# 2) public-carrossel só com hardlinks
$P = "$R/public-carrossel"
foreach ($d in @("$P", "$P/3d", "$P/marca", "$P/telas")) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d | Out-Null } }
function Liga([string]$novo, [string]$origem) {
  $tam = (Get-Item -LiteralPath $origem).Length
  if (Test-Path -LiteralPath $novo) {
    if ((Get-Item -LiteralPath $novo).Length -eq $tam) { Write-Output "já existe  $novo"; return }
    throw "$novo já existe com outro tamanho; confira antes de religar"
  }
  New-Item -ItemType HardLink -Path $novo -Target $origem | Out-Null
  if ((Get-Item -LiteralPath $novo).Length -ne $tam) { throw "hardlink $novo com tamanho diferente da origem" }
  Write-Output "hardlink  $novo ($tam bytes)"
}
Liga "$P/Sora-wght.ttf" "$R/public-guia/Sora-wght.ttf"
Liga "$P/3d/iphone.glb" "$R/public-guia/3d/iphone.glb"
Liga "$P/marca/simbolo.svg" "$R/public-guia/marca/simbolo.svg"
Liga "$P/marca/logo-horizontal.svg" "$R/public-guia/marca/logo-horizontal.svg"
foreach ($k in $esperado.Keys) { Liga "$P/telas/$k" "$C/telas/$k" }
Write-Output "preparo ok"
