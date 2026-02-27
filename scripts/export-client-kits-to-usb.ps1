param(
  [string]$ZipDir = ".\\out\\client-kits-zips",
  [string]$DriveLetter = "",
  [string]$FolderName = ""
)

$ErrorActionPreference = "Stop"

function Get-RemovableDriveLetters {
  try {
    $disks = Get-CimInstance Win32_LogicalDisk -ErrorAction Stop | Where-Object { $_.DriveType -eq 2 }
    return $disks | ForEach-Object { $_.DeviceID.TrimEnd(":") }
  } catch {
    return @()
  }
}

function Resolve-Abs([string]$p) {
  return (Resolve-Path -LiteralPath $p).Path
}

if (-not (Test-Path -LiteralPath $ZipDir)) {
  throw "Missing zip dir: $ZipDir (run: pwsh -File .\\scripts\\package-client-kits.ps1 -LatestOnly)"
}

$zipDirAbs = Resolve-Abs $ZipDir
$zips = Get-ChildItem -LiteralPath $zipDirAbs -Filter "*.zip" -File
$manifest = Get-ChildItem -LiteralPath $zipDirAbs -Filter "MANIFEST-*.txt" -File | Sort-Object Name -Descending | Select-Object -First 1

if ($zips.Count -eq 0) {
  throw "No zip files found under: $zipDirAbs"
}

if (-not $FolderName) {
  $stamp = (Get-Date).ToString("yyyyMMdd-HHmmss")
  $FolderName = "NeuralShell_ClientKits_$stamp"
}

if ($DriveLetter) {
  $DriveLetter = $DriveLetter.Trim().TrimEnd(":").ToUpperInvariant()
} else {
  $candidates = Get-RemovableDriveLetters
  if ($candidates.Count -eq 0) {
    throw "No removable drives detected. Plug in a USB drive (or pass -DriveLetter E)."
  }
  if ($candidates.Count -gt 1) {
    Write-Host ("[usb] detected removable drives: " + ($candidates -join ", "))
    Write-Host ("[usb] using: " + $candidates[0] + " (override with -DriveLetter)")
  }
  $DriveLetter = $candidates[0]
}

$destRoot = "{0}:\\" -f $DriveLetter
if (-not (Test-Path -LiteralPath $destRoot)) {
  throw "Drive not found: $destRoot"
}

$dest = Join-Path $destRoot $FolderName
New-Item -ItemType Directory -Force -Path $dest | Out-Null

Write-Host "[usb] WARNING: these zips contain client certificates (private keys). Treat like passwords."
Write-Host ("[usb] copying from: " + $zipDirAbs)
Write-Host ("[usb] copying to:   " + $dest)

foreach ($z in $zips) {
  Copy-Item -LiteralPath $z.FullName -Destination (Join-Path $dest $z.Name) -Force
}

if ($manifest) {
  Copy-Item -LiteralPath $manifest.FullName -Destination (Join-Path $dest $manifest.Name) -Force
}

$readme = @"
NeuralShell mTLS Client Kits

1) Copy the appropriate <client>.zip to the target client machine.
2) Unzip it.
3) Run (PowerShell 7 recommended):

   pwsh -File .\\client-setup.ps1 -ClientPfxPath .\\<client>.pfx -CaCerPath .\\ca.cer -TestBaseUrl https://<router-ip>:4443

Notes:
- You will be prompted for the PFX passphrase.
- These files contain private keys. Do not email them. Prefer USB / encrypted transfer.
"@

Set-Content -LiteralPath (Join-Path $dest "README-CLIENT-KITS.txt") -Value $readme -Encoding UTF8

Write-Host "[usb] ok"

