@echo off
setlocal enableextensions
cd /d "%~dp0"

set "PS_EXE=pwsh.exe"
where %PS_EXE% >nul 2>nul
if errorlevel 1 set "PS_EXE=powershell.exe"

"%PS_EXE%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\connect-keys-gui.ps1"

endlocal
