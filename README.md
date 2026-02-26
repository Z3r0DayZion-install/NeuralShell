# NeuralShell: The Sovereign AI Operating System

![Status](https://img.shields.io/badge/Status-PRODUCTION-green)
![Mode](https://img.shields.io/badge/Mode-DARK_NODE-black)
![Architecture](https://img.shields.io/badge/Architecture-HEXAGONAL-blue)

NeuralShell is not just an AI router. It is a **Self-Replicating, Economic, Sovereign Swarm**.
It turns your computer into a private AI node capable of creating software, trading assets, and evolving its own code.

## 🌟 The Monolith Features

### 1. 🧬 The Genesis Engine (Creation)
- **Prompt-to-App:** "Create a snake game." -> NeuralShell builds, dockerizes, and deploys it instantly.
- **The Forge:** Dynamic runtime management of file systems and containers.

### 2. 🐝 Swarm Intelligence (Collaboration)
- **Orchestrator:** Decomposes complex goals into sub-tasks.
- **Specialized Agents:**
  - **Coder:** Writes and executes code in a hardened Docker sandbox.
  - **Researcher:** Scrapes and synthesizes information.
  - **Dreamer:** Autonomously invents new apps when the system is idle.

### 3. 💰 The Hive Economy (Trade)
- **DAO Architecture:** Agents hold wallets and trade **NeuralCredits (NC)**.
- **Marketplace:** AI-generated assets are automatically listed for sale.
- **Rich List:** Track the GDP of your local swarm.

### 4. 🛡️ Dark Node (Sovereignty)
- **100% Air-Gapped:** Zero external dependencies. All libs and models run locally.
- **Hardened:** Retry-bootloaders, Agent Supervisors, and Traffic Encryption.
- **Memory:** `pgvector` backing for industrial-grade semantic recall.

## 🚀 Quick Start (The Universal Installer)

**Linux / Mac:**
```bash
bash setup.sh
docker-compose up
```

**Windows (PowerShell):**
```powershell
.\setup.ps1
docker-compose up
```

## 🧠 Mission Control
Access the Dashboard at: **`http://localhost:3000/admin-dashboard.html`**

- **Overview:** Real-time neural metrics.
- **Genesis:** Spawn applications.
- **Brain Dump:** Visualize the 3D knowledge graph.
- **Neural Store:** Buy AI inventions.

## 📚 Documentation
- [Architecture Guide](docs/ARCHITECTURE.md)
- [Vision Manifesto](VISION.md)
- [Status Report](PROJECT_STATUS.md)

---
"The best way to predict the future is to invent it."

## Shipping
- Build a local release bundle (desktop EXEs + docker image + smoke test):
  - `npm run ship:bundle`
- Create a redacted support bundle for debugging:
  - `npm run support:bundle`

Bundles are written under `out/`.

## Sandbox
- Ensure the sandbox image is available:
  - `npm run sandbox:prepare`
- Run sandbox smoke tests:
  - `npm run test:sandbox`
