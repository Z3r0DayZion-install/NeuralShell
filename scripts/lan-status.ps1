param(
  [string]$ContainerName = "neuralshell-lan-sandbox",
  [int]$PublicPort = 4443,
  [string]$FirewallRuleName = "NeuralShell mTLS (LAN)",
  [string]$SecretsPath = ".\\local\\lan-secrets.json",
  [string]$CaPemPath = ".\\certs\\ca\\ca.crt",
  [string]$ClientPfxPath = ".\\certs\\clients\\client-desktop.pfx",
  [string]$ClientPassphraseEnv = "NS_TLS_PFX_PASSPHRASE"
)

$ErrorActionPreference = "Stop"

function Get-LanIPv4 {
  $ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -and
      $_.IPAddress -notlike "127.*" -and
      $_.IPAddress -notlike "169.254.*"
    } |
    Select-Object -ExpandProperty IPAddress

  # Prefer RFC1918 192.168.x.x for typical home LANs
  $prefer = $ips | Where-Object { $_ -like "192.168.*" } | Select-Object -First 1
  if ($prefer) { return $prefer }

  $prefer = $ips | Where-Object { $_ -like "10.*" } | Select-Object -First 1
  if ($prefer) { return $prefer }

  $prefer = $ips | Where-Object { $_ -like "172.16.*" -or $_ -like "172.17.*" -or $_ -like "172.18.*" -or $_ -like "172.19.*" -or $_ -like "172.2?.*" -or $_ -like "172.3?.*" } | Select-Object -First 1
  if ($prefer) { return $prefer }

  return ($ips | Select-Object -First 1)
}

Write-Host "[lan] checking docker container..."
docker ps --filter ("name=" + $ContainerName) --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}" | Out-Host

Write-Host "[lan] checking firewall rule..."
$rule = Get-NetFirewallRule -DisplayName $FirewallRuleName -ErrorAction SilentlyContinue
if ($rule) {
  Write-Host ("[lan] firewall rule ok: " + $FirewallRuleName)
} else {
  Write-Host ("[lan] firewall rule missing: " + $FirewallRuleName)
  Write-Host ("[lan] fix (Admin): pwsh -File .\\scripts\\open-lan-firewall.ps1 -Port " + $PublicPort)
}

if (-not (Test-Path -LiteralPath $SecretsPath)) {
  throw "Missing secrets file: $SecretsPath"
}

$secrets = Get-Content -LiteralPath $SecretsPath -Raw | ConvertFrom-Json
if (-not $secrets.$ClientPassphraseEnv) {
  throw "Secrets JSON missing field: $ClientPassphraseEnv"
}
if (-not $secrets.ADMIN_TOKEN) {
  throw "Secrets JSON missing field: ADMIN_TOKEN"
}

$pass = $secrets.PSObject.Properties[$ClientPassphraseEnv].Value
Set-Item -Path ("Env:" + $ClientPassphraseEnv) -Value $pass
$env:ADMIN_TOKEN = $secrets.ADMIN_TOKEN

$lanIp = Get-LanIPv4
if (-not $lanIp) {
  throw "Could not detect a LAN IPv4 address"
}

$smoke = ".\\scripts\\smoke-mtls.mjs"
if (-not (Test-Path -LiteralPath $smoke)) {
  throw "Missing script: $smoke"
}

Write-Host "[lan] smoke test localhost..."
node $smoke --base-url ("https://localhost:" + $PublicPort) --ca-pem $CaPemPath --client-pfx $ClientPfxPath --client-pass-env $ClientPassphraseEnv --admin-token-env ADMIN_TOKEN --expect-client-cert-required

Write-Host ("[lan] smoke test LAN: https://" + $lanIp + ":" + $PublicPort + " ...")
node $smoke --base-url ("https://" + $lanIp + ":" + $PublicPort) --ca-pem $CaPemPath --client-pfx $ClientPfxPath --client-pass-env $ClientPassphraseEnv --admin-token-env ADMIN_TOKEN --expect-client-cert-required

Write-Host ("[lan] ok: router url https://" + $lanIp + ":" + $PublicPort)
