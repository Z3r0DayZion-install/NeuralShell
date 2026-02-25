@echo off
setlocal enableextensions

REM Fail-closed clean-tree gate for production releases (Windows).
REM - Root working tree must be clean
REM - NeuralShell_Desktop submodule working tree must be clean

cd /d "%~dp0.."

for /f "usebackq delims=" %%L in (`C:\Windows\System32\cmd.exe /d /s /c git status --porcelain`) do (
  echo [git-clean] FAIL root dirty
  echo %%L
  exit /b 1
)

cd /d "%~dp0..\\NeuralShell_Desktop"

for /f "usebackq delims=" %%L in (`C:\Windows\System32\cmd.exe /d /s /c git status --porcelain`) do (
  echo [git-clean] FAIL desktop dirty
  echo %%L
  exit /b 1
)

echo [git-clean] PASS
exit /b 0

