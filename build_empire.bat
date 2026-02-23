@echo off
setlocal enabledelayedexpansion

:: --- NEURAL EMPIRE // MASTER BUILD SCRIPT ---
:: Project: NeuralShell Sovereign Workstation
:: Founder: Christian Cash
:: --------------------------------------------

title NEURAL EMPIRE BUILDER // CHRISTIANITHY III²

echo [SYSTEM] Initiating NeuralShell Build Sequence...
echo [SYSTEM] DNA: NS-SOVEREIGN-SOV-MASTER

:: 1. Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Empire requires a runtime.
    pause
    exit /b
1)

:: 2. Check for Ollama
echo [SYSTEM] Detecting Local Intelligence (Ollama)...
curl -s http://localhost:11434/api/tags >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Ollama is offline. NeuralShell will lack Sentience.
    echo [HINT] Run 'ollama run llama3' or 'ollama run nomic-embed-text'.
)

:: 3. Install Dependencies
echo [SYSTEM] Syncing local dependencies...
cd NeuralShell_Desktop
call npm install --silent
if %errorlevel% neq 0 (
    echo [ERROR] NPM install failed. Check internet link.
    pause
    exit /b 1
)

:: 4. Build Portable EXE
echo [SYSTEM] Burning Sovereign EXE (Portable)...
call npm run build:portable
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed. System integrity compromised.
    pause
    exit /b 1
)

:: 5. Success
echo.
echo [JACKPOT] NeuralShell-TEAR-Portable-0.2.0.exe generated in dist/
echo [JACKPOT] CHRISTIANITHY III² ACTIVE.
echo.
pause
