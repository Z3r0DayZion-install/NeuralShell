param(
  [int]$Port = 4443,
  [string]$RuleName = "NeuralShell mTLS (LAN)",
  [string[]]$RemoteCidrs = @("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"),
  [ValidateSet("Domain", "Private", "Public")]
  [string[]]$Profiles = @("Private", "Domain")
)

$ErrorActionPreference = "Stop"

$existing = Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "[fw] rule already exists: $RuleName"
  exit 0
}

Write-Host "[fw] creating inbound allow rule: name=$RuleName port=$Port profiles=$($Profiles -join ',') remote=$($RemoteCidrs -join ',')"
New-NetFirewallRule `
  -DisplayName $RuleName `
  -Direction Inbound `
  -Action Allow `
  -Protocol TCP `
  -LocalPort $Port `
  -RemoteAddress $RemoteCidrs `
  -Profile $Profiles | Out-Null

Write-Host "[fw] ok"
