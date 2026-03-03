# THREAT MODEL & KNOWN LIMITATIONS

While NeuralShell's OMEGA Enforcement Mode drastically reduces the attack surface, certain foundational limitations remain inherent to the operating system architecture.

## Covered Threats
- **Renderer RCE / Sandbox Escape:** Defeated via `sandbox: true`, `contextIsolation: true`, zero-network policies, and the Intent Firewall schema validator.
- **Malicious Plugin Injection:** Defeated via strict `vm` capability sandboxing.
- **Data Exfiltration:** Defeated via the Kernel Network Broker strictly enforcing SPKI pinning and proxy scrubbing.
- **Supply Chain Poisoning (Runtime):** Defeated via Signed Boot Manifest and SHA-256 Task Anchors.

## Known Limitations (Out of Scope)
1. **Ring-0 / Kernel-Level Attacker:** 
   If the host operating system kernel is compromised (e.g., loaded rootkit), NeuralShell cannot guarantee execution integrity. The attacker could patch the Node.js binary or hook syscalls.
   
2. **Physical RAM Extraction (Cold Boot Attacks):**
   Secrets managed in memory (e.g., active session keys) may be extracted via physical memory dumps if the machine is captured while powered on.

3. **Stolen Application Signing Certificate:**
   If the developer's EV Code Signing Certificate or the Ed25519 root private key is stolen, an attacker could sign malicious binaries or updates that bypass the updater validation.
   *Mitigation:* Private keys are stored on hardware HSMs and never enter the CI pipeline.

4. **Malicious OS Keychain Extraction:**
   While `os_keychain.js` protects at-rest data using DPAPI/Keychain, a local process running as the same user can request decryption. 
   *Mitigation:* Local device access control (lock screens, full disk encryption) is required.

5. **Resource Exhaustion (Denial of Service):**
   While response sizes are capped at 5MB, an attacker controlling the local loopback could spam IPC requests. The Intent Firewall limits parsing complexity, but an overwhelming volume could still cause CPU saturation.
