param(
  [string]$OutDir = "release/site/neuralshell-operator"
)

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

$sourceHtml = Join-Path $repoRoot "docs/sales/pricing-page.html"
$sourceAssets = Join-Path $repoRoot "docs/sales/assets"
$target = Join-Path $repoRoot $OutDir
$targetAssets = Join-Path $target "assets"

if (!(Test-Path $sourceHtml)) {
  throw "Missing source page: $sourceHtml"
}
if (!(Test-Path $sourceAssets)) {
  throw "Missing source assets directory: $sourceAssets"
}

New-Item -ItemType Directory -Force -Path $target,$targetAssets | Out-Null

# Primary landing page
Copy-Item -LiteralPath $sourceHtml -Destination (Join-Path $target "index.html") -Force

# All other documentation pages
Get-ChildItem -Path (Join-Path $repoRoot "docs/sales/*.html") | Where-Object { $_.Name -ne "pricing-page.html" } | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $target -Force
}

Copy-Item -Path (Join-Path $sourceAssets "*") -Destination $targetAssets -Recurse -Force

$html = Get-Content -LiteralPath (Join-Path $target "index.html") -Raw
if ($html -match "\.\./\.\./screenshots/") {
  throw "Build failed: page still references ../../screenshots paths."
}

$manifest = [ordered]@{
  generatedAt = (Get-Date).ToString("o")
  sourceHtml = "docs/sales/pricing-page.html"
  sourceAssets = "docs/sales/assets"
  outputDir = $OutDir
  files = (Get-ChildItem -Path $target -Recurse -File | ForEach-Object {
    [ordered]@{
      path = $_.FullName.Replace("$repoRoot\\","")
      size = $_.Length
    }
  })
}

$manifestPath = Join-Path $target "build-manifest.json"
$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

Write-Host "Sales site package generated: $target"
Write-Host "Entry file: $(Join-Path $target 'index.html')"
Write-Host "Manifest: $manifestPath"
