param(
  [string]$ShareName = "NeuralShellKits",
  [string]$UserName = "ns-kits"
)

$ErrorActionPreference = "Stop"

function Test-IsAdmin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p = New-Object Security.Principal.WindowsPrincipal($id)
  return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsAdmin)) {
  throw "Run this in an elevated PowerShell (Admin)."
}

Write-Host "[share] removing SMB share + local user"

$existingShare = Get-SmbShare -Name $ShareName -ErrorAction SilentlyContinue
if ($existingShare) {
  Remove-SmbShare -Name $ShareName -Force | Out-Null
  Write-Host ("[share] removed share: " + $ShareName)
} else {
  Write-Host ("[share] share not found: " + $ShareName)
}

$existingUser = Get-LocalUser -Name $UserName -ErrorAction SilentlyContinue
if ($existingUser) {
  Remove-LocalUser -Name $UserName | Out-Null
  Write-Host ("[share] removed user: " + $UserName)
} else {
  Write-Host ("[share] user not found: " + $UserName)
}

Write-Host "[share] ok"

