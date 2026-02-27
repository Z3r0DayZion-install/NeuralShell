param(
  [string]$KitsRoot = ".\\out\\client-kits",
  [string]$ZipOut = ".\\out\\client-kits-zips",
  [switch]$LatestOnly
)

$ErrorActionPreference = "Stop"

function Resolve-Abs([string]$p) {
  return (Resolve-Path -LiteralPath $p).Path
}

if (-not (Test-Path -LiteralPath $KitsRoot)) {
  throw "Missing kits root: $KitsRoot (run: pwsh -File .\\scripts\\make-client-kits.ps1)"
}

New-Item -ItemType Directory -Force -Path $ZipOut | Out-Null

$kitsRootAbs = Resolve-Abs $KitsRoot
$zipOutAbs = Resolve-Abs $ZipOut

$dirs = Get-ChildItem -LiteralPath $kitsRootAbs -Directory | Sort-Object Name
if ($dirs.Count -eq 0) {
  throw "No kit directories found under: $kitsRootAbs"
}

# Group by client name prefix (before the final -YYYYMMDD-HHMMSS)
$byClient = @{}
foreach ($d in $dirs) {
  if ($d.Name -notmatch '^(?<name>.+)-(?<stamp>\d{8}-\d{6})$') {
    continue
  }
  $name = $Matches['name']
  if (-not $byClient.ContainsKey($name)) {
    $byClient[$name] = @()
  }
  $byClient[$name] += $d
}

if ($byClient.Keys.Count -eq 0) {
  throw "No kit directories matched expected pattern under: $kitsRootAbs"
}

$stamp = (Get-Date).ToString("yyyyMMdd-HHmmss")
$manifestPath = Join-Path $zipOutAbs ("MANIFEST-{0}.txt" -f $stamp)

$lines = @()
$lines += ("NeuralShell Client Kit Zips ({0})" -f (Get-Date).ToString("s"))
$lines += ("KitsRoot: {0}" -f $kitsRootAbs)
$lines += ("ZipOut:   {0}" -f $zipOutAbs)
$lines += ""

foreach ($client in ($byClient.Keys | Sort-Object)) {
  $candidates = $byClient[$client] | Sort-Object Name
  $selected = if ($LatestOnly) { @($candidates[-1]) } else { $candidates }

  foreach ($dir in $selected) {
    $zipName = ("{0}.zip" -f $dir.Name)
    $zipPath = Join-Path $zipOutAbs $zipName

    if (Test-Path -LiteralPath $zipPath) {
      Remove-Item -LiteralPath $zipPath -Force
    }

    Compress-Archive -Path (Join-Path $dir.FullName "*") -DestinationPath $zipPath -Force
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $zipPath).Hash.ToLowerInvariant()

    $lines += ("{0}  {1}" -f $hash, $zipName)
  }
}

Set-Content -LiteralPath $manifestPath -Value ($lines -join "`n") -Encoding UTF8
Write-Host ("[kits] wrote zips to {0}" -f $zipOutAbs)
Write-Host ("[kits] manifest {0}" -f $manifestPath)

