param(
  [string]$ContainerName = "neuralshell-lan-sandbox",
  [string]$Image = "neuralshell:sandbox-lan",
  [int]$HostPort = 4443,
  [int]$ContainerPort = 3443,
  [string]$ConfigPath = ".\\local\\config.lan.yaml",
  [string]$CertsDir = ".\\certs",
  [string]$SecretsPath = ".\\local\\lan-secrets.json",
  [ValidateSet("always", "unless-stopped", "no", "on-failure")]
  [string]$Restart = "unless-stopped",
  [switch]$Build,
  [switch]$ReadOnly,
  [int]$PidsLimit = 256,
  [string]$Memory = "768m",
  [double]$Cpus = 1.5
)

$ErrorActionPreference = "Stop"

function Assert-Path([string]$p, [string]$label) {
  if (-not (Test-Path -LiteralPath $p)) {
    throw ("Missing {0}: {1}" -f $label, $p)
  }
}

Assert-Path $ConfigPath "config file"
Assert-Path $SecretsPath "secrets file"
Assert-Path $CertsDir "certs dir"

if ($Build) {
  Write-Host "[lan-up] building image: $Image"
  docker build -t $Image . | Out-Host
}

$secrets = Get-Content -LiteralPath $SecretsPath -Raw | ConvertFrom-Json
if (-not $secrets.ADMIN_TOKEN -or -not $secrets.PROMPT_TOKEN) {
  throw "Secrets file missing ADMIN_TOKEN or PROMPT_TOKEN: $SecretsPath"
}

$envFile = Join-Path ".\\state" "docker-lan.env"
New-Item -ItemType Directory -Force -Path ".\\state" | Out-Null

try {
  "NS_PROFILE=lan" | Set-Content -LiteralPath $envFile -Encoding ascii
  foreach ($p in $secrets.PSObject.Properties) {
    # values are generated; avoid multiline in env file
    $line = "{0}={1}" -f $p.Name, [string]$p.Value
    Add-Content -LiteralPath $envFile -Value $line -Encoding ascii
  }

  Write-Host "[lan-up] replacing container: $ContainerName"
  docker rm -f $ContainerName 2>$null | Out-Null

  $args = @(
    "run", "-d",
    "--name", $ContainerName,
    "--restart", $Restart,
    "--init",
    "--no-healthcheck",
    "-p", ("{0}:{1}" -f $HostPort, $ContainerPort),
    "--env-file", $envFile,
    "-v", ("{0}:/app/config.yaml:ro" -f (Resolve-Path -LiteralPath $ConfigPath).Path),
    "-v", ("{0}:/app/certs:ro" -f (Resolve-Path -LiteralPath $CertsDir).Path),
    "--cap-drop", "ALL",
    "--security-opt", "no-new-privileges:true",
    "--pids-limit", [string]$PidsLimit,
    "--memory", $Memory,
    "--cpus", [string]$Cpus
  )

  if ($ReadOnly) {
    $args += @(
      "--read-only",
      "--tmpfs", "/tmp:rw,noexec,nosuid,size=64m",
      "--tmpfs", "/app/state:rw,nosuid,nodev,size=128m",
      "--tmpfs", "/app/logs:rw,nosuid,nodev,size=64m"
    )
  }

  $args += @($Image)

  Write-Host "[lan-up] starting container..."
  docker @args | Out-Host

  Write-Host "[lan-up] ok"
} finally {
  if (Test-Path -LiteralPath $envFile) {
    Remove-Item -LiteralPath $envFile -Force
  }
}
