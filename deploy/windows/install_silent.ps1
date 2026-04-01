param(
    [Parameter(Mandatory = $true)]
    [string]$MsiPath,
    [string]$InstallDir = "$env:ProgramFiles\\NeuralShell",
    [string]$LogPath = "$env:TEMP\\neuralshell_msi_install.log",
    [switch]$EnableAutoUpdate,
    [switch]$EnableRelay
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $MsiPath)) {
    throw "MSI not found: $MsiPath"
}

$autoUpdate = if ($EnableAutoUpdate.IsPresent) { "1" } else { "0" }
$relayEnabled = if ($EnableRelay.IsPresent) { "1" } else { "0" }

$msiArgs = @(
    "/i", "`"$MsiPath`"",
    "/qn",
    "/norestart",
    "INSTALLDIR=`"$InstallDir`"",
    "NEURAL_LICENSE_MODE=auditor",
    "NEURAL_ALLOW_REMOTE_BRIDGE=0",
    "NEURAL_PROOF_RELAY_ENABLED=$relayEnabled",
    "NEURAL_AUTO_UPDATE_ENABLED=$autoUpdate",
    "NEURAL_OTEL_EXPORT_ENABLED=0",
    "/L*v", "`"$LogPath`""
)

Write-Host "Installing NeuralShell silently..."
$process = Start-Process -FilePath "msiexec.exe" -ArgumentList $msiArgs -Wait -PassThru -WindowStyle Hidden

if ($process.ExitCode -ne 0) {
    throw "MSI installation failed with exit code $($process.ExitCode). See $LogPath"
}

Write-Host "NeuralShell installed successfully at $InstallDir"
Write-Host "Install log: $LogPath"
