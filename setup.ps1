# NeuralShell: The Monolith Installer (Windows)
# "One command to rule the swarm."

Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "   NEURALSHELL // SOVEREIGN AI OPERATING SYSTEM"
Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan

# 1. Check Pre-requisites
Write-Host "[*] Checking System Core..."
if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Write-Error "CRITICAL: Docker is not installed. The Hive cannot rise."
    exit 1
}

if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Error "CRITICAL: Node.js is not installed. The Neural Link is broken."
    exit 1
}

# 2. Environment Setup
if (-not (Test-Path ".env")) {
    Write-Host "[*] Initializing Environment Configuration..."
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    Add-Content ".env" "NODE_ENV=production`nHIVE_ENABLED=1`nSWARM_ENABLED=1`nEVOLUTION_ENABLED=1`nPORT=3000"
}

# 3. Dark Node Provisioning
Write-Host "[*] Provisioning Dark Node Assets (Local Libraries)..."
node dark-node-provision.js

# 4. Model Directory
if (-not (Test-Path "models")) {
    New-Item -ItemType Directory -Path "models" | Out-Null
    Write-Host "[*] Created /models directory."
    Write-Warning "ACTION REQUIRED: Place your ONNX models in /models/Xenova/all-MiniLM-L6-v2/"
}

# 5. Build The Monolith
Write-Host "[*] Building The Monolith (Docker Stack)..."
docker-compose build

Write-Host "----------------------------------------------------------------" -ForegroundColor Green
Write-Host "   INSTALLATION COMPLETE."
Write-Host "   Run 'docker-compose up' to ignite the Singularity."
Write-Host "----------------------------------------------------------------" -ForegroundColor Green
