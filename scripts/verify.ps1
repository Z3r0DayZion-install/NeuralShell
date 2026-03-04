[CmdletBinding()]
param(
    [switch]$Installer,
    [switch]$Unpacked,
    [switch]$SelfTest,
    [switch]$ShowDetails,
    [string]$ChecksumsFile = "release/checksums.txt"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Script:Version = "1.0.0"
$Script:ExitCodes = @{
    SUCCESS          = 0
    FILE_NOT_FOUND   = 1
    HASH_MISMATCH    = 2
    MANIFEST_ERROR   = 3
    PERMISSION_ERROR = 4
    SELF_TEST_FAILED = 5
}

function Write-Log {
    param(
        [Parameter(Mandatory = $true)][string]$Message,
        [ValidateSet("INFO", "WARN", "ERROR", "PASS")][string]$Level = "INFO"
    )

    $color = switch ($Level) {
        "PASS" { "Green" }
        "WARN" { "Yellow" }
        "ERROR" { "Red" }
        default { "White" }
    }
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$ts] [$Level] $Message" -ForegroundColor $color
}

function Show-Banner {
    Write-Host ""
    Write-Host "NeuralShell Integrity Verifier v$($Script:Version)" -ForegroundColor Cyan
    Write-Host "Offline checksum verification utility" -ForegroundColor Cyan
    Write-Host ""
}

function Normalize-RelPath {
    param([Parameter(Mandatory = $true)][string]$PathValue)
    return ($PathValue -replace "\\", "/").Trim()
}

function Resolve-AbsolutePath {
    param(
        [Parameter(Mandatory = $true)][string]$RootDir,
        [Parameter(Mandatory = $true)][string]$RelPath
    )

    $native = $RelPath -replace "/", [System.IO.Path]::DirectorySeparatorChar
    return [System.IO.Path]::GetFullPath((Join-Path -Path $RootDir -ChildPath $native))
}

function Get-Sha256Hash {
    param(
        [Parameter(Mandatory = $true)][string]$LiteralPath
    )

    $cmd = Get-Command Get-FileHash -ErrorAction SilentlyContinue
    if ($cmd) {
        return (Get-FileHash -LiteralPath $LiteralPath -Algorithm SHA256).Hash.ToLowerInvariant()
    }

    $stream = [System.IO.File]::OpenRead($LiteralPath)
    try {
        $algo = [System.Security.Cryptography.SHA256]::Create()
        try {
            $bytes = $algo.ComputeHash($stream)
        } finally {
            $algo.Dispose()
        }
    } finally {
        $stream.Dispose()
    }

    return ([System.BitConverter]::ToString($bytes) -replace "-", "").ToLowerInvariant()
}

function Load-Checksums {
    param(
        [Parameter(Mandatory = $true)][string]$RootDir,
        [Parameter(Mandatory = $true)][string]$FilePath
    )

    $absChecksums = if ([System.IO.Path]::IsPathRooted($FilePath)) {
        $FilePath
    } else {
        Join-Path -Path $RootDir -ChildPath $FilePath
    }

    if (-not (Test-Path -Path $absChecksums -PathType Leaf)) {
        throw "Checksums file not found: $absChecksums"
    }

    $map = @{}
    $lineNumber = 0
    foreach ($line in Get-Content -LiteralPath $absChecksums) {
        $lineNumber++
        $trimmed = $line.Trim()
        if ([string]::IsNullOrWhiteSpace($trimmed)) { continue }
        if ($trimmed.StartsWith("#")) { continue }
        if ($trimmed -notmatch '^([A-Fa-f0-9]{64})\s+(.+)$') {
            throw "Invalid checksum entry at line $lineNumber in $absChecksums"
        }
        $sha = $matches[1].ToLowerInvariant()
        $rel = Normalize-RelPath -PathValue $matches[2]
        $map[$rel] = $sha
    }

    if ($map.Count -eq 0) {
        throw "No checksum entries found in $absChecksums"
    }

    return @{
        Map = $map
        Path = $absChecksums
    }
}

function Get-VerificationEntries {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Checksums,
        [switch]$InstallerOnly,
        [switch]$UnpackedOnly
    )

    $keys = @($Checksums.Keys | Sort-Object)
    if (-not $InstallerOnly -and -not $UnpackedOnly) {
        return $keys
    }

    $selected = New-Object System.Collections.Generic.List[string]
    foreach ($key in $keys) {
        $isInstaller = (
            $key -match '^dist/NeuralShell Setup .+\.exe(\.blockmap)?$' -or
            $key -eq 'dist/OMEGA.yml' -or
            $key -eq 'dist/latest.yml'
        )
        $isUnpacked = ($key -match '^(dist/)?win-unpacked/')

        if ($InstallerOnly -and $isInstaller) { [void]$selected.Add($key) }
        if ($UnpackedOnly -and $isUnpacked) { [void]$selected.Add($key) }
    }

    return @($selected)
}

function Verify-Entry {
    param(
        [Parameter(Mandatory = $true)][string]$RootDir,
        [Parameter(Mandatory = $true)][string]$RelPath,
        [Parameter(Mandatory = $true)][string]$ExpectedHash,
        [switch]$VerboseOutput
    )

    $absPath = Resolve-AbsolutePath -RootDir $RootDir -RelPath $RelPath
    if (-not (Test-Path -LiteralPath $absPath -PathType Leaf)) {
        Write-Log -Level "ERROR" -Message "Missing file: $RelPath"
        return $Script:ExitCodes.FILE_NOT_FOUND
    }

    try {
        $actual = Get-Sha256Hash -LiteralPath $absPath
    } catch {
        Write-Log -Level "ERROR" -Message "Permission/read error for ${RelPath}: $($_.Exception.Message)"
        return $Script:ExitCodes.PERMISSION_ERROR
    }

    if ($actual -ne $ExpectedHash.ToLowerInvariant()) {
        Write-Log -Level "ERROR" -Message "Hash mismatch: $RelPath"
        if ($VerboseOutput) {
            Write-Log -Level "INFO" -Message " expected: $ExpectedHash"
            Write-Log -Level "INFO" -Message "   actual: $actual"
        }
        return $Script:ExitCodes.HASH_MISMATCH
    }

    if ($VerboseOutput) {
        Write-Log -Level "PASS" -Message "Verified: $RelPath"
    }
    return $Script:ExitCodes.SUCCESS
}

function Invoke-SelfTest {
    param(
        [Parameter(Mandatory = $true)][string]$RootDir
    )

    $failed = New-Object System.Collections.Generic.List[string]

    try {
        $tmp = Join-Path $env:TEMP ("neuralshell-verify-selftest-" + [Guid]::NewGuid().ToString("N"))
        New-Item -ItemType Directory -Path $tmp -Force | Out-Null
        $samplePath = Join-Path $tmp "sample.txt"
        Set-Content -LiteralPath $samplePath -Value "selftest" -NoNewline
        $sampleSha = Get-Sha256Hash -LiteralPath $samplePath
        $checksumsPath = Join-Path $tmp "checksums.txt"
        Set-Content -LiteralPath $checksumsPath -Value "$sampleSha  sample.txt"
        $loaded = Load-Checksums -RootDir $tmp -FilePath "checksums.txt"
        if ($loaded.Map.Count -ne 1) {
            [void]$failed.Add("checksum parser did not load expected entry count")
        } else {
            $code = Verify-Entry -RootDir $tmp -RelPath "sample.txt" -ExpectedHash $sampleSha
            if ($code -ne $Script:ExitCodes.SUCCESS) {
                [void]$failed.Add("hash verifier failed synthetic case")
            }
        }
        Remove-Item -Recurse -Force -LiteralPath $tmp
    } catch {
        [void]$failed.Add("selftest exception: $($_.Exception.Message)")
    }

    if ($failed.Count -gt 0) {
        foreach ($item in $failed) {
            Write-Log -Level "ERROR" -Message "SelfTest: $item"
        }
        return $Script:ExitCodes.SELF_TEST_FAILED
    }

    Write-Log -Level "PASS" -Message "SelfTest passed."
    return $Script:ExitCodes.SUCCESS
}

Show-Banner
$root = (Get-Location).Path

if ($SelfTest) {
    exit (Invoke-SelfTest -RootDir $root)
}

try {
    $loadedChecksums = Load-Checksums -RootDir $root -FilePath $ChecksumsFile
    Write-Log -Level "INFO" -Message "Loaded $($loadedChecksums.Map.Count) checksum entries from $($loadedChecksums.Path)"
} catch {
    Write-Log -Level "ERROR" -Message $_.Exception.Message
    exit $Script:ExitCodes.MANIFEST_ERROR
}

$entries = Get-VerificationEntries -Checksums $loadedChecksums.Map -InstallerOnly:$Installer -UnpackedOnly:$Unpacked
if ($entries.Count -eq 0) {
    if ($Installer) {
        Write-Log -Level "ERROR" -Message "No installer checksum entries found in manifest."
    } elseif ($Unpacked) {
        Write-Log -Level "ERROR" -Message "No unpacked checksum entries found in manifest."
    } else {
        Write-Log -Level "ERROR" -Message "No entries selected for verification."
    }
    exit $Script:ExitCodes.MANIFEST_ERROR
}

$finalCode = $Script:ExitCodes.SUCCESS
foreach ($entry in $entries) {
    $code = Verify-Entry -RootDir $root -RelPath $entry -ExpectedHash $loadedChecksums.Map[$entry] -VerboseOutput:$ShowDetails
    if ($code -ne $Script:ExitCodes.SUCCESS) {
        $finalCode = $code
    }
}

if ($finalCode -eq $Script:ExitCodes.SUCCESS) {
    Write-Log -Level "PASS" -Message "Verification completed successfully."
} else {
    Write-Log -Level "ERROR" -Message "Verification failed. Exit code: $finalCode"
}

exit $finalCode
