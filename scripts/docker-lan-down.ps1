param(
  [string]$ContainerName = "neuralshell-lan-sandbox"
)

$ErrorActionPreference = "Stop"

Write-Host "[lan-down] stopping/removing: $ContainerName"
docker rm -f $ContainerName | Out-Host
Write-Host "[lan-down] ok"

