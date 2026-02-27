param(
  [string[]]$ClientNames = @(),
  [string]$ClientsDir = "",
  [string]$OutRoot = ""
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$makeOne = Join-Path $root "scripts\\make-client-kit.ps1"

if (-not (Test-Path -LiteralPath $makeOne)) {
  throw "Missing script: $makeOne"
}

if (-not $ClientsDir) {
  $ClientsDir = Join-Path $root "certs\\clients"
}

if (-not (Test-Path -LiteralPath $ClientsDir)) {
  throw "Missing clients dir: $ClientsDir"
}

if (-not $OutRoot) {
  $OutRoot = Join-Path $root "out\\client-kits"
}

$pfxFiles = Get-ChildItem -LiteralPath $ClientsDir -Filter "*.pfx" -File
if ($pfxFiles.Count -eq 0) {
  throw "No client PFX files found under $ClientsDir"
}

$foundNames = $pfxFiles | ForEach-Object { $_.BaseName }

if ($ClientNames.Count -eq 0) {
  $ClientNames = $foundNames
} else {
  $missing = @()
  foreach ($n in $ClientNames) {
    if (-not ($foundNames -contains $n)) {
      $missing += $n
    }
  }
  if ($missing.Count -gt 0) {
    throw ("Missing client PFX for: " + ($missing -join ", ") + " (expected: $ClientsDir\\<name>.pfx)")
  }
}

Write-Host ("[client-kits] building: " + ($ClientNames -join ", "))

foreach ($n in $ClientNames) {
  pwsh -NoProfile -File $makeOne -ClientName $n -OutDir "" | Out-Host
}

Write-Host "[client-kits] ok"

