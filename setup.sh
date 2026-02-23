#!/bin/bash

# NeuralShell: The Monolith Installer
# "One command to rule the swarm."

echo "----------------------------------------------------------------"
echo "   NEURALSHELL // SOVEREIGN AI OPERATING SYSTEM"
echo "----------------------------------------------------------------"

# 1. Check Pre-requisites
echo "[*] Checking System Core..."
if ! command -v docker &> /dev/null; then
    echo "[!] CRITICAL: Docker is not installed. The Hive cannot rise."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "[!] CRITICAL: Node.js is not installed. The Neural Link is broken."
    exit 1
fi

# 2. Environment Setup
if [ ! -f .env ]; then
    echo "[*] Initializing Environment Configuration..."
    cp .env.example .env 2>/dev/null || touch .env
    echo "NODE_ENV=production" >> .env
    echo "HIVE_ENABLED=1" >> .env
    echo "SWARM_ENABLED=1" >> .env
    echo "EVOLUTION_ENABLED=1" >> .env
    echo "PORT=3000" >> .env
fi

# 3. Dark Node Provisioning
echo "[*] Provisioning Dark Node Assets (Local Libraries)..."
node dark-node-provision.js

# 4. Model Directory
if [ ! -d "models" ]; then
    mkdir -p models
    echo "[*] Created /models directory."
    echo "[!] ACTION REQUIRED: Place your ONNX models in /models/Xenova/all-MiniLM-L6-v2/"
fi

# 5. Build The Monolith
echo "[*] Building The Monolith (Docker Stack)..."
docker-compose build

echo "----------------------------------------------------------------"
echo "   INSTALLATION COMPLETE."
echo "   Run 'docker-compose up' to ignite the Singularity."
echo "----------------------------------------------------------------"
