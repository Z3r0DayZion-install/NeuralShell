param(
  [string]$OutDir = "certs",
  [string[]]$ServerDns = @("localhost"),
  [string[]]$ServerIp = @("127.0.0.1"),
  [string[]]$ClientNames = @(),
  [string]$PfxPassphrase = ""
)

$ErrorActionPreference = "Stop"

function New-RandomPassphrase([int]$length = 32) {
  $alphabet = @()
  $alphabet += 48..57   # 0-9
  $alphabet += 65..90   # A-Z
  $alphabet += 97..122  # a-z
  -join (Get-Random -Count $length -InputObject $alphabet | ForEach-Object { [char]$_ })
}

function Normalize-StringList([string[]]$items) {
  $out = @()
  foreach ($item in ($items | Where-Object { $_ -ne $null })) {
    $raw = [string]$item
    foreach ($piece in ($raw -split ',')) {
      $t = $piece.Trim()
      if ($t) { $out += $t }
    }
  }
  return $out
}

function Ensure-Dir([string]$p) {
  if (-not (Test-Path -LiteralPath $p)) {
    New-Item -ItemType Directory -Path $p | Out-Null
  }
}

function Encode-CerToPem([string]$cerPath, [string]$pemPath) {
  & certutil.exe -f -encode $cerPath $pemPath | Out-Null
}

function Export-CertBundle([System.Security.Cryptography.X509Certificates.X509Certificate2]$cert, [string]$basePath, [string]$passphrase) {
  $cerPath = "${basePath}.cer"
  $pemPath = "${basePath}.crt"
  $pfxPath = "${basePath}.pfx"

  Export-Certificate -Cert $cert -FilePath $cerPath | Out-Null
  Encode-CerToPem -cerPath $cerPath -pemPath $pemPath

  $secure = ConvertTo-SecureString -String $passphrase -AsPlainText -Force
  Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $secure | Out-Null

  return @{
    cer = $cerPath
    crt = $pemPath
    pfx = $pfxPath
  }
}

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$outRoot = (Resolve-Path -LiteralPath $repoRoot).Path
$certRoot = Join-Path $outRoot $OutDir

$ServerDns = Normalize-StringList $ServerDns
$ServerIp = Normalize-StringList $ServerIp
$ClientNames = Normalize-StringList $ClientNames

$generatedPassphrase = $false
if ([string]::IsNullOrWhiteSpace($PfxPassphrase)) {
  $PfxPassphrase = New-RandomPassphrase 32
  $generatedPassphrase = $true
}

$caDir = Join-Path $certRoot "ca"
$serverDir = Join-Path $certRoot "server"
$clientsDir = Join-Path $certRoot "clients"

Ensure-Dir $certRoot
Ensure-Dir $caDir
Ensure-Dir $serverDir
Ensure-Dir $clientsDir

Write-Host "[certs] output=$certRoot"
if ($generatedPassphrase) {
  Write-Host "[certs] generated PFX passphrase (store safely): $PfxPassphrase"
}

$notAfterCa = (Get-Date).AddYears(10)
$notAfterLeaf = (Get-Date).AddYears(2)

$caSubject = "CN=NeuralShell Dev CA"
$serverCn = $ServerDns[0]
$serverSubject = "CN=$serverCn"

$sanParts = @()
foreach ($d in $ServerDns) {
  if ([string]::IsNullOrWhiteSpace($d)) { continue }
  $sanParts += ("dns=" + $d)
}
foreach ($ip in $ServerIp) {
  if ([string]::IsNullOrWhiteSpace($ip)) { continue }
  $sanParts += ("ipaddress=" + $ip)
}
if ($sanParts.Count -eq 0) {
  $sanParts += "dns=localhost"
  $sanParts += "ipaddress=127.0.0.1"
}
$sanExt = "2.5.29.17={text}" + ($sanParts -join "&")

$ekuServer = "2.5.29.37={text}1.3.6.1.5.5.7.3.1"
$ekuClient = "2.5.29.37={text}1.3.6.1.5.5.7.3.2"
$basicConstraintsCa = "2.5.29.19={text}ca=1&pathlength=1"
$basicConstraintsLeaf = "2.5.29.19={text}ca=0"

Write-Host "[certs] creating CA in CurrentUser\\My: $caSubject"
$caCert = New-SelfSignedCertificate `
  -Type Custom `
  -Subject $caSubject `
  -KeyAlgorithm RSA `
  -KeyLength 2048 `
  -HashAlgorithm SHA256 `
  -KeyExportPolicy Exportable `
  -CertStoreLocation "Cert:\\CurrentUser\\My" `
  -NotAfter $notAfterCa `
  -KeyUsage CertSign, CRLSign, DigitalSignature `
  -TextExtension @($basicConstraintsCa)

$caBase = Join-Path $caDir "ca"
$caOut = Export-CertBundle -cert $caCert -basePath $caBase -passphrase $PfxPassphrase

Write-Host "[certs] creating server cert signed by CA: $serverSubject"
$serverCert = New-SelfSignedCertificate `
  -Type Custom `
  -Subject $serverSubject `
  -KeyAlgorithm RSA `
  -KeyLength 2048 `
  -HashAlgorithm SHA256 `
  -KeyExportPolicy Exportable `
  -CertStoreLocation "Cert:\\CurrentUser\\My" `
  -NotAfter $notAfterLeaf `
  -KeyUsage DigitalSignature, KeyEncipherment `
  -Signer $caCert `
  -TextExtension @($sanExt, $ekuServer, $basicConstraintsLeaf)

$serverBase = Join-Path $serverDir "neuralshell"
$serverOut = Export-CertBundle -cert $serverCert -basePath $serverBase -passphrase $PfxPassphrase

if ($ClientNames.Count -gt 0) {
  foreach ($name in $ClientNames) {
    if ([string]::IsNullOrWhiteSpace($name)) { continue }
    $clientSubject = "CN=$name"
    Write-Host "[certs] creating client cert signed by CA: $clientSubject"
    $clientCert = New-SelfSignedCertificate `
      -Type Custom `
      -Subject $clientSubject `
      -KeyAlgorithm RSA `
      -KeyLength 2048 `
      -HashAlgorithm SHA256 `
      -KeyExportPolicy Exportable `
      -CertStoreLocation "Cert:\\CurrentUser\\My" `
      -NotAfter $notAfterLeaf `
      -KeyUsage DigitalSignature `
      -Signer $caCert `
      -TextExtension @($ekuClient, $basicConstraintsLeaf)

    $clientBase = Join-Path $clientsDir $name
    Export-CertBundle -cert $clientCert -basePath $clientBase -passphrase $PfxPassphrase | Out-Null
  }
}

Write-Host ''
Write-Host '[next] config.yaml (LAN, TLS):'
Write-Host 'server:'
Write-Host '  profile: "lan"'
Write-Host '  host: "0.0.0.0"'
Write-Host '  tls:'
Write-Host '    enabled: true'
Write-Host ('    pfxPath: "./{0}"' -f (Join-Path $OutDir 'server/neuralshell.pfx').Replace('\','/'))
Write-Host ('    caPath: "./{0}"' -f (Join-Path $OutDir 'ca/ca.crt').Replace('\','/'))
Write-Host '    requireClientCert: false  # set true for mTLS'
Write-Host ''
Write-Host '[next] env (optional):'
Write-Host '  NS_TLS=1'
Write-Host '  NS_TLS_PFX=./certs/server/neuralshell.pfx'
Write-Host '  NS_TLS_CA=./certs/ca/ca.crt'
Write-Host '  NS_TLS_REQUIRE_CLIENT_CERT=0'
if ($PfxPassphrase) {
  Write-Host '  NS_TLS_PFX_PASSPHRASE=(your passphrase)'
}
Write-Host ''
Write-Host '[note] For browser trust (no warnings), install the CA certificate into Trusted Root manually:'
Write-Host ("  {0}" -f $caOut.cer)
