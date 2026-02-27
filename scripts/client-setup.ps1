param(
  [Parameter(Mandatory = $true)]
  [string]$ClientPfxPath,

  [string]$PfxPassphrase = "",

  [string]$CaCerPath = "",

  [ValidateSet("CurrentUser", "LocalMachine")]
  [string]$TrustStoreScope = "CurrentUser",

  [ValidateSet("CurrentUser", "LocalMachine")]
  [string]$ClientStoreScope = "CurrentUser",

  [string]$TestBaseUrl = ""
)

$ErrorActionPreference = "Stop"

function Resolve-ExistingPath([string]$p) {
  if (-not $p) { return $null }
  $rp = Resolve-Path -LiteralPath $p -ErrorAction SilentlyContinue
  if (-not $rp) { return $null }
  return $rp.Path
}

$clientPfx = Resolve-ExistingPath $ClientPfxPath
if (-not $clientPfx) {
  throw "Client PFX not found: $ClientPfxPath"
}

if (-not $CaCerPath) {
  $CaCerPath = Join-Path $PSScriptRoot "..\\certs\\ca\\ca.cer"
}
$caCer = Resolve-ExistingPath $CaCerPath
if (-not $caCer) {
  throw "CA certificate (.cer) not found: $CaCerPath"
}

if ([string]::IsNullOrWhiteSpace($PfxPassphrase)) {
  $pfxSecure = Read-Host -Prompt "Enter PFX passphrase" -AsSecureString
} else {
  $pfxSecure = ConvertTo-SecureString -String $PfxPassphrase -AsPlainText -Force
}

$trustStore = "Cert:\$TrustStoreScope\Root"
$clientStore = "Cert:\$ClientStoreScope\My"

Write-Host "[client-setup] importing CA -> $trustStore"
Import-Certificate -FilePath $caCer -CertStoreLocation $trustStore | Out-Null

Write-Host "[client-setup] importing client PFX -> $clientStore"
$imported = Import-PfxCertificate -FilePath $clientPfx -CertStoreLocation $clientStore -Password $pfxSecure

$thumb = $imported.Thumbprint
if (-not $thumb) {
  throw "Import-PfxCertificate succeeded but returned no thumbprint."
}
Write-Host "[client-setup] client cert thumbprint=$thumb"

if ($TestBaseUrl) {
  $base = $TestBaseUrl.TrimEnd("/")
  $healthUrl = "$base/health"

  Write-Host "[client-setup] probe (no client cert): $healthUrl"
  $noCertOk = $true
  try {
    $res = Invoke-WebRequest -Uri $healthUrl -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Host "[client-setup] no-cert status=$($res.StatusCode) (mTLS may be OFF)"
  } catch {
    $noCertOk = $false
    Write-Host "[client-setup] no-cert failed as expected when mTLS is ON"
  }

  Write-Host "[client-setup] probe (with client cert): $healthUrl"
  $cert = Get-Item -LiteralPath "$clientStore\$thumb"
  $res2 = Invoke-WebRequest -Uri $healthUrl -Method GET -UseBasicParsing -TimeoutSec 5 -Certificate $cert
  Write-Host "[client-setup] with-cert status=$($res2.StatusCode)"
  if ($res2.StatusCode -ne 200) {
    throw "Expected 200 from /health with client cert, got $($res2.StatusCode)"
  }

  if (-not $noCertOk) {
    Write-Host "[client-setup] mTLS handshake enforcement confirmed"
  }
}

Write-Host "[client-setup] done"
