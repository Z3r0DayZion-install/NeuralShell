# Builds the sales site package and publishes it to docs/ for GitHub Pages (/docs source)
param()

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

$builder = Join-Path $repoRoot "docs/sales/build-sales-site.ps1"
if (!(Test-Path $builder)) {
  throw "Missing build script: $builder"
}

powershell -ExecutionPolicy Bypass -File $builder

$buildDir = Join-Path $repoRoot "release/site/neuralshell-operator"
$buildIndex = Join-Path $buildDir "index.html"
$buildAssets = Join-Path $buildDir "assets"

if (!(Test-Path $buildIndex)) {
  throw "Build output missing index: $buildIndex"
}
if (!(Test-Path $buildAssets)) {
  throw "Build output missing assets: $buildAssets"
}

# Copy primary index
Copy-Item -Path $buildIndex -Destination (Join-Path $repoRoot "docs/index.html") -Force

# Copy all other documentation pages
Get-ChildItem -Path (Join-Path $buildDir "*.html") | Where-Object { $_.Name -ne "index.html" } | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $repoRoot "docs") -Force
}

# Sync assets
Remove-Item -Path (Join-Path $repoRoot "docs/assets") -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path $buildAssets -Destination (Join-Path $repoRoot "docs/assets") -Recurse -Force

Write-Host "Published build to docs/ for GitHub Pages"
Write-Host "- docs/index.html"
Write-Host "- docs/assets/*"
