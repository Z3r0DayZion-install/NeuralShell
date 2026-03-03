# ARCHITECTURE RISKS — NEURALSHELL v5.2.0

## 1. Privilege Escapes
- **Risk:** Malicious plugin bypasses `pluginLoader` to access `process` or `require`.
- **Mitigation:** AST Gate blocks `require` outside kernel; `sandbox: true` on renderer.

## 2. SPKI Pinning Maintenance
- **Risk:** Certificate rotation on `updates.neuralshell.app` breaks auto-updates.
- **Mitigation:** Implement multi-pin rotation support in `network.js`.

## 3. Intent Firewall Completeness
- **Risk:** IPC channel missing from `intentFirewall.js` allows unvalidated payload.
- **Mitigation:** AST Gate checks for IPC handlers without corresponding schema.

## 4. Performance Overhead
- **Risk:** Deep validation of every IPC intent increases latency.
- **Mitigation:** Ajv schema pre-compilation; keep schemas minimal.

## 5. TCB Surface Area
- **Risk:** Kernel modules grow too complex, increasing the attack surface.
- **Mitigation:** Strict LOC limits and audit requirements for `src/kernel/`.
