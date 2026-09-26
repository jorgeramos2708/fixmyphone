# Barrido de caracteres no latinos en el codigo fuente.
# Uso: pwsh -File tools/sweep-cjk.ps1
param([string]$Root = ".")

$ErrorActionPreference = "Stop"
$patron = '[\u4E00-\u9FFF\uAC00-\uD7AF\uFF00-\uFFEF]'

$archivos = Get-ChildItem -Path $Root -Recurse -Include *.ts,*.tsx,*.css,*.html,*.mjs,*.js -File |
  Where-Object {
    $_.FullName -notmatch 'node_modules' -and
    $_.FullName -notmatch 'device-db\\data' -and
    $_.FullName -notmatch '\\dist\\' -and
    $_.FullName -notmatch '\\out\\'
  }

$total = 0
foreach ($f in $archivos) {
  $lineas = [IO.File]::ReadAllLines($f.FullName, [Text.Encoding]::UTF8)
  for ($i = 0; $i -lt $lineas.Length; $i++) {
    if ($lineas[$i] -match $patron) {
      $rel = $f.FullName.Substring((Resolve-Path $Root).Path.Length + 1)
      Write-Output ("{0}:{1}" -f $rel, ($i + 1))
      Write-Output ("    " + $lineas[$i].Trim())
      $total++
    }
  }
}

Write-Output ""
Write-Output ("Lineas con caracteres CJK: " + $total)
if ($total -eq 0) { exit 0 } else { exit 1 }
