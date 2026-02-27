param(
  [Parameter(Mandatory = $true)]
  [string]$ClientName,

  [string]$OutDir = "",

  [string]$CaCerPath = "",

  [string]$ClientPfxPath = ""
)

$ErrorActionPreference = "Stop"

function Resolve-ExistingPath([string]$p) {
  if (-not $p) { return $null }
  $rp = Resolve-Path -LiteralPath $p -ErrorAction SilentlyContinue
  if (-not $rp) { return $null }
  return $rp.Path
}

$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path

if (-not $CaCerPath) {
  $CaCerPath = Join-Path $root "certs\\ca\\ca.cer"
}
if (-not $ClientPfxPath) {
  $ClientPfxPath = Join-Path $root ("certs\\clients\\{0}.pfx" -f $ClientName)
}

$caCer = Resolve-ExistingPath $CaCerPath
if (-not $caCer) { throw "Missing CA .cer: $CaCerPath" }

$clientPfx = Resolve-ExistingPath $ClientPfxPath
if (-not $clientPfx) { throw "Missing client .pfx: $ClientPfxPath" }

if (-not $OutDir) {
  $stamp = (Get-Date).ToString("yyyyMMdd-HHmmss")
  $OutDir = Join-Path $root ("out\\client-kits\\{0}-{1}" -f $ClientName, $stamp)
}

$out = (Resolve-Path -LiteralPath $root).Path
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

Copy-Item -LiteralPath $caCer -Destination (Join-Path $OutDir "ca.cer") -Force
Copy-Item -LiteralPath $clientPfx -Destination (Join-Path $OutDir ("{0}.pfx" -f $ClientName)) -Force
Copy-Item -LiteralPath (Join-Path $root "scripts\\client-setup.ps1") -Destination (Join-Path $OutDir "client-setup.ps1") -Force

$readme = @"
NeuralShell mTLS Client Kit: $ClientName

Files:
- ca.cer (install into Trusted Root)
- $ClientName.pfx (install into Personal)
- client-setup.ps1 (installs both)

On the client machine (PowerShell 7 recommended):

  pwsh -File .\\client-setup.ps1 -ClientPfxPath .\\$ClientName.pfx -CaCerPath .\\ca.cer -TestBaseUrl https://<router-ip>:4443

Notes:
- You will be prompted for the PFX passphrase.
- If the router is using a different port, update the URL accordingly.
"@

Set-Content -LiteralPath (Join-Path $OutDir "README.txt") -Value $readme -Encoding UTF8

Write-Host "[client-kit] wrote $OutDir"
