@echo off
setlocal

if "%VSDEVCMD_PATH%"=="" goto :missing
if not exist "%VSDEVCMD_PATH%" goto :missing

call "%VSDEVCMD_PATH%" -no_logo -arch=x64 -host_arch=x64 >nul
if errorlevel 1 exit /b %errorlevel%

cargo %*
exit /b %errorlevel%

:missing
echo VSDEVCMD_PATH missing or invalid: %VSDEVCMD_PATH%
exit /b 2
