param(
  [string]$ShareName = "NeuralShellKits",
  [string]$Path = ".\\out\\client-kits-zips",
  [string]$UserName = "ns-kits",
  [switch]$EncryptData
)

$ErrorActionPreference = "Stop"

function Test-IsAdmin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p = New-Object Security.Principal.WindowsPrincipal($id)
  return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function New-RandomPassword([int]$Length = 28) {
  $bytes = New-Object byte[] $Length
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $b64 = [Convert]::ToBase64String($bytes)
  # Make it shell-friendly
  return ($b64 -replace "[^a-zA-Z0-9]", "").Substring(0, [Math]::Min($Length, ($b64 -replace "[^a-zA-Z0-9]", "").Length))
}

if (-not (Test-IsAdmin)) {
  throw "Run this in an elevated PowerShell (Admin)."
}

$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$absPath = (Resolve-Path -LiteralPath (Join-Path $root $Path)).Path
if (-not (Test-Path -LiteralPath $absPath)) {
  throw "Missing path: $absPath (run: pwsh -File .\\scripts\\package-client-kits.ps1 -LatestOnly)"
}

Write-Host "[share] creating locked-down SMB share for client kits"
Write-Host ("[share] path: " + $absPath)
Write-Host ("[share] name: " + $ShareName)
Write-Host ("[share] user: " + $UserName)

# Create local user (or reset its password)
$pwPlain = New-RandomPassword
$pw = ConvertTo-SecureString -String $pwPlain -AsPlainText -Force

$existingUser = Get-LocalUser -Name $UserName -ErrorAction SilentlyContinue
if (-not $existingUser) {
  New-LocalUser -Name $UserName -Password $pw -PasswordNeverExpires -UserMayNotChangePassword | Out-Null
} else {
  Set-LocalUser -Name $UserName -Password $pw | Out-Null
}

# Lock NTFS permissions down to owner + the kit user (read-only)
$ownerAccount = "$($env:USERDOMAIN)\$($env:USERNAME)"
$kitAccount = "$($env:COMPUTERNAME)\$UserName"

$acl = New-Object System.Security.AccessControl.DirectorySecurity
$acl.SetAccessRuleProtection($true, $false) | Out-Null

$acl.AddAccessRule([System.Security.AccessControl.FileSystemAccessRule]::new(
  $ownerAccount,
  "FullControl",
  "ContainerInherit,ObjectInherit",
  "None",
  "Allow"
)) | Out-Null

$acl.AddAccessRule([System.Security.AccessControl.FileSystemAccessRule]::new(
  $kitAccount,
  "ReadAndExecute",
  "ContainerInherit,ObjectInherit",
  "None",
  "Allow"
)) | Out-Null

$systemSid = New-Object System.Security.Principal.SecurityIdentifier("S-1-5-18")
$adminsSid = New-Object System.Security.Principal.SecurityIdentifier("S-1-5-32-544")

$acl.AddAccessRule([System.Security.AccessControl.FileSystemAccessRule]::new(
  $systemSid,
  "FullControl",
  "ContainerInherit,ObjectInherit",
  "None",
  "Allow"
)) | Out-Null

$acl.AddAccessRule([System.Security.AccessControl.FileSystemAccessRule]::new(
  $adminsSid,
  "FullControl",
  "ContainerInherit,ObjectInherit",
  "None",
  "Allow"
)) | Out-Null

Set-Acl -LiteralPath $absPath -AclObject $acl

# Remove existing share if present
$existingShare = Get-SmbShare -Name $ShareName -ErrorAction SilentlyContinue
if ($existingShare) {
  Remove-SmbShare -Name $ShareName -Force | Out-Null
}

$shareArgs = @{
  Name = $ShareName
  Path = $absPath
  ReadAccess = @($UserName)
  FolderEnumerationMode = "AccessBased"
}
if ($EncryptData) {
  $shareArgs.EncryptData = $true
}

New-SmbShare @shareArgs | Out-Null

$hostName = $env:COMPUTERNAME

Write-Host ""
Write-Host "[share] OK"
Write-Host ("[share] UNC:  \\\\" + $hostName + "\\" + $ShareName)
Write-Host ("[share] User: " + $UserName)
Write-Host ("[share] Pass: " + $pwPlain)
Write-Host ""
Write-Host "[share] Client instructions:"
Write-Host ("  1) In File Explorer: \\\\" + $hostName + "\\" + $ShareName)
Write-Host ("  2) When prompted: username " + $hostName + "\\" + $UserName + " and the password above")
Write-Host "  3) Copy the right .zip to the client, unzip, run client-setup.ps1"
Write-Host ""
Write-Host "[share] After you're done, run:"
Write-Host "  pwsh -File .\\scripts\\unshare-client-kits.ps1"
