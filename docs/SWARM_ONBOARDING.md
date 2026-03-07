# Swarm Onboarding: Expanding the Neural Empire

Follow these steps to connect a second Sovereign Node to your distributed OMEGA network.

## 1. Node Preparation
1.  Copy the Golden Master `NeuralShell_OMEGA_v5.2.0.zip` to the target machine.
2.  Extract and run `npm ci` to align dependencies.
3.  Run `.\VERIFY_RELEASE.ps1` to ensure hardware binding is active on the new silicon.

## 2. Identity Handshake
Each node must trust its peers to enable Swarm Consensus.

**On Node A (Master):**
1.  Open the console and run: `window.api.invoke("identity:pubkey")`.
2.  Copy the `pem` string.

**On Node B (New Node):**
1.  Run: `window.api.invoke("identity:trust-peer", { deviceId: "Node-A", pubKeyPem: "<PEM_FROM_NODE_A>", label: "Primary Guardian" })`.

Repeat this process in reverse so both nodes trust each other.

## 3. Threat Ledger Synchronization
To sync security patches across the swarm:
1.  Point both instances to a shared network drive or git-repo for the `governance/THREAT_LEDGER.jsonl` file.
2.  The OMEGA kernel will automatically detect new signatures and prompt for Quorum approval (2/3 nodes).

## 4. Collective Evolution
Once trusted, triggering the `autonomous-evolution` ritual on any node will broadcast the authored plugin to all other nodes for verification and installation.
