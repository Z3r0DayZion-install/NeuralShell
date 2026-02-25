@echo off
setlocal enableextensions

REM Deterministic Windows release gate (fail-closed).
REM Orchestrates the same gates as CI without relying on Node spawnSync.

cd /d "%~dp0.."

call scripts\git_clean_check.cmd || exit /b 1

for /f "usebackq delims=" %%T in (`node scripts\print_run_ts.cjs`) do set "PROOF_RUN_TS=%%T"
if "%PROOF_RUN_TS%"=="" (
  echo [release-gate] FAIL missing PROOF_RUN_TS
  exit /b 1
)
set "NS_GIT_CLEAN_CHECKED=1"

echo [release-gate] runTs=%PROOF_RUN_TS%

REM Root gates (fail-closed).
call npm run security:audit || exit /b 1
call npm run ast-gate || exit /b 1
call npm test || exit /b 1
call npm run verify:all || exit /b 1

REM Desktop artifacts.
call npm ci --prefix NeuralShell_Desktop || exit /b 1
call npm --prefix NeuralShell_Desktop run release:all || exit /b 1

REM Optional signing enforcement (CI should set NS_REQUIRE_SIGNING=1).
if "%NS_REQUIRE_SIGNING%"=="1" (
  set "SIGNTOOL="
  if not "%NS_SIGNTOOL_PATH%"=="" set "SIGNTOOL=%NS_SIGNTOOL_PATH%"
  if "%SIGNTOOL%"=="" (
    for /f "usebackq delims=" %%S in (`C:\Windows\System32\where.exe signtool.exe 2^>nul`) do (
      set "SIGNTOOL=%%S"
      goto :signtool_found
    )
  )
:signtool_found
  if "%SIGNTOOL%"=="" (
    echo [release-gate] FAIL signtool.exe not found (set NS_SIGNTOOL_PATH or install Windows SDK)
    exit /b 1
  )
  for %%F in ("NeuralShell_Desktop\dist\*.exe") do (
    echo [release-gate] signtool.verify %%~fF
    "%SIGNTOOL%" verify /pa "%%~fF" || exit /b 1
  )
)

REM Release manifest + receipt.
node scripts\release_manifest.cjs --runTs %PROOF_RUN_TS% || exit /b 1
node scripts\release_receipt.cjs --runTs %PROOF_RUN_TS% || exit /b 1

if not "%GITHUB_OUTPUT%"=="" (
  echo runTs=%PROOF_RUN_TS%>> "%GITHUB_OUTPUT%"
  echo releaseDir=state/releases/%PROOF_RUN_TS%>> "%GITHUB_OUTPUT%"
  echo proofBundleDir=state/proof_bundles/%PROOF_RUN_TS%>> "%GITHUB_OUTPUT%"
)

echo [release-gate] PASS
exit /b 0
