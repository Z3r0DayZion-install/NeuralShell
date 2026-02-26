@echo off
setlocal enableextensions

REM Deterministic Windows release gate wrapper.
REM - Enforces git clean check (unless NS_ALLOW_DIRTY=1)
REM - Sets PROOF_RUN_TS
REM - Delegates orchestration to scripts\release_gate.cjs

cd /d "%~dp0.."

call scripts\git_clean_check.cmd || exit /b 1

REM If user explicitly allows dirty builds, reset proof baseline so executed-target hash mismatches
REM don't block local iteration.
if "%NS_ALLOW_DIRTY%"=="1" (
  call npm run proof:reset || exit /b 1
)

for /f "usebackq delims=" %%T in (`node scripts\print_run_ts.cjs`) do set "PROOF_RUN_TS=%%T"
if "%PROOF_RUN_TS%"=="" (
  echo [release-gate] FAIL missing PROOF_RUN_TS
  exit /b 1
)
set "NS_GIT_CLEAN_CHECKED=1"

echo [release-gate] runTs=%PROOF_RUN_TS%

node scripts\release_gate.cjs || exit /b 1

exit /b 0
